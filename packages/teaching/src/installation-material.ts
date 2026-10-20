import {
  InstalledTeachingError,
  parseSignedInstalledTeaching,
} from "./installed-teaching.ts";
import type { InstalledTeaching } from "./installed-teaching.ts";
import { parsePreparationPackage } from "./preparation.ts";
import type { VerifiedPreparationDocument } from "./preparation.ts";
import {
  publicationLimits,
  verifyPublication,
  verifyPublicationResource,
  decodePublicationUtf8,
} from "./publication.ts";
import type {
  PublicationCrypto,
  PublicationTrustKey,
  PublicationHash,
} from "./publication.ts";
import {
  publicationEnvelopePath,
  publishPublicationClosure,
  withVerifiedPublicationClosure,
  withVerifiedPublicationBatch,
  readPublicationResponse,
  PublicationResourceError,
} from "./publication-resources.ts";
import type {
  CatalogPublicationResources,
  PublicationMode,
  PublicationCancellation,
  PublicationNamespace,
} from "./publication-resources.ts";
import type { VerifiedPublication } from "./publication.ts";
import type { CourseId, HashFunction, ReleaseId } from "./types.ts";
export class UnsupportedInstallProfileError extends Error {
  constructor() {
    super("Unsupported installation profile");
    this.name = "UnsupportedInstallProfileError";
  }
}
export type SignedInstallMaterial = Readonly<{
  teaching: Extract<InstalledTeaching, { kind: "signed-v1" }>;
  preparation: VerifiedPreparationDocument;
  envelope: Uint8Array;
  curriculum: Uint8Array;
  preparationBytes: Uint8Array;
}>;
const verified = new WeakSet<object>();
export async function parseInstallMaterial(
  input: Readonly<{
    envelope: Uint8Array;
    curriculum: Uint8Array;
    preparationBytes: Uint8Array;
    keys: readonly PublicationTrustKey[];
    crypto: PublicationCrypto;
    hash: HashFunction;
  }>,
): Promise<SignedInstallMaterial> {
  const envelope = Uint8Array.from(input.envelope),
    curriculum = Uint8Array.from(input.curriculum),
    preparationBytes = Uint8Array.from(input.preparationBytes);
  const publication = await verifyPublication({ ...input, raw: envelope });
  const entries = publication.envelope.body.assets.filter(
    (entry) => entry.assetId === "parent-preparation-v1",
  );
  const preparationEntry = entries[0];
  if (
    entries.length !== 1 ||
    !preparationEntry ||
    preparationEntry.mediaType !== "application/json"
  )
    throw new UnsupportedInstallProfileError();
  await verifyPublicationResource({
    publication,
    path: preparationEntry.path,
    bytes: preparationBytes,
    crypto: input.crypto,
  });
  let teaching: Extract<InstalledTeaching, { kind: "signed-v1" }>;
  try {
    teaching = await parseSignedInstalledTeaching({
      ...input,
      publication,
      curriculum,
    });
  } catch (error) {
    if (error instanceof InstalledTeachingError && error.reason === "invalid")
      throw new UnsupportedInstallProfileError();
    throw error;
  }
  let preparation: VerifiedPreparationDocument;
  let hashUnavailable = false;
  const preparationHash: HashFunction = async (text) => {
    try {
      return await input.hash(text);
    } catch (error) {
      hashUnavailable = true;
      throw error;
    }
  };
  try {
    preparation = await parsePreparationPackage(
      JSON.parse(decodePublicationUtf8(preparationBytes)),
      preparationHash,
    );
  } catch (error) {
    if (hashUnavailable) throw error;
    throw new UnsupportedInstallProfileError();
  }
  const material = Object.freeze({
    teaching,
    preparation,
    envelope,
    curriculum,
    preparationBytes,
  });
  verified.add(material);
  return material;
}
export function requireInstallMaterial(material: SignedInstallMaterial): void {
  if (!verified.has(material))
    throw new Error("Installation material requires owned verification");
}
export type InstallationLease = Readonly<{ isCurrent(): boolean }>;
const leases = new WeakSet<InstallationLease>();
export function requireInstallationLease(lease: InstallationLease) {
  if (!leases.has(lease) || !lease.isCurrent())
    throw new Error("Current resource scope is unavailable");
}

export type InstalledApplicationOptions = Readonly<{
  courseId: CourseId;
  offer?: Readonly<{ publicationHash: PublicationHash; releaseId: ReleaseId }>;
  mode: PublicationMode;
  keys: readonly PublicationTrustKey[];
  crypto: PublicationCrypto;
  resources: CatalogPublicationResources;
  envelope(
    hash: PublicationHash,
    cancellation: PublicationCancellation,
  ): Promise<Uint8Array>;
  lifetime: Readonly<{ isCurrent(): boolean }>;
  shell: Readonly<{
    prepare(
      input: Readonly<{
        teaching: Extract<InstalledTeaching, { kind: "signed-v1" }>;
        retainedTeachings?: readonly Extract<
          InstalledTeaching,
          { kind: "signed-v1" }
        >[];
        cancellation: PublicationCancellation;
      }>,
    ): Promise<
      Readonly<{
        withVerified<T>(
          run: (lease: InstallationLease) => Promise<T>,
        ): Promise<T>;
      }>
    >;
  }>;
}>;
export function createInstallationMaterials(
  options: InstalledApplicationOptions,
  hash: HashFunction,
) {
  const cancellation: PublicationCancellation = {
    throwIfCancelled() {
      if (!options.lifetime.isCurrent())
        throw new Error("Retired installation connection");
    },
  };
  async function cachedEnvelope(target: PublicationHash) {
    return options.resources.exclusive({
      mode: options.mode,
      hash: target,
      run: async (namespace) => {
        cancellation.throwIfCancelled();
        const response = await namespace.read(publicationEnvelopePath);
        if (!response) return undefined;
        return readPublicationResponse({
          response,
          maximumByteLength: publicationLimits.envelopeBytes,
          mediaType: "application/json",
          cancellation,
        });
      },
    });
  }
  async function acquire(target: PublicationHash) {
    cancellation.throwIfCancelled();
    try {
      const retained = await cachedEnvelope(target);
      if (retained) {
        await withContent(retained, async (material) => {
          if (material.teaching.identity.hash !== target)
            throw new PublicationResourceError({
              kind: "corrupt",
              reason: "envelope-integrity",
            });
        });
        return retained;
      }
    } catch (error) {
      if (!(error instanceof PublicationResourceError)) throw error;
    }
    cancellation.throwIfCancelled();
    let raw: Uint8Array;
    try {
      raw = await options.envelope(target, cancellation);
    } catch (error) {
      cancellation.throwIfCancelled();
      if (error instanceof PublicationResourceError) throw error;
      throw new PublicationResourceError({
        kind: "unavailable",
        reason: "download",
      });
    }
    const crypto: PublicationCrypto = {
      async sha256(bytes) {
        try {
          return await options.crypto.sha256(bytes);
        } catch {
          cancellation.throwIfCancelled();
          throw new PublicationResourceError({
            kind: "unavailable",
            reason: "crypto",
          });
        }
      },
      async verifyEd25519(input) {
        try {
          return await options.crypto.verifyEd25519(input);
        } catch {
          cancellation.throwIfCancelled();
          throw new PublicationResourceError({
            kind: "unavailable",
            reason: "crypto",
          });
        }
      },
    };
    let publication: Awaited<ReturnType<typeof verifyPublication>>;
    try {
      publication = await verifyPublication({
        raw,
        keys: options.keys,
        crypto,
      });
    } catch (error) {
      cancellation.throwIfCancelled();
      if (error instanceof PublicationResourceError) throw error;
      throw new PublicationResourceError({
        kind: "corrupt",
        reason: "envelope-integrity",
      });
    }
    if (publication.hash !== target)
      throw new PublicationResourceError({
        kind: "corrupt",
        reason: "envelope-integrity",
      });
    await publishPublicationClosure({
      raw,
      mode: options.mode,
      keys: options.keys,
      crypto: options.crypto,
      ports: options.resources,
      cancellation,
    });
    return raw;
  }
  async function withContent<T>(
    raw: Uint8Array,
    run: (material: SignedInstallMaterial) => Promise<T>,
  ): Promise<T> {
    const result = await withVerifiedPublicationClosure({
      raw,
      mode: options.mode,
      keys: options.keys,
      crypto: options.crypto,
      ports: options.resources,
      cancellation,
      run: async ({ publication, namespace }) =>
        run(await materialFrom({ raw, publication, namespace })),
    });
    if (result.kind !== "verified-callback")
      throw new PublicationResourceError(result);
    return result.value;
  }
  async function materialFrom({
    raw,
    publication,
    namespace,
  }: Readonly<{
    raw: Uint8Array;
    publication: VerifiedPublication;
    namespace: PublicationNamespace;
  }>) {
    const preparation = publication.envelope.body.assets.find(
      (entry) => entry.assetId === "parent-preparation-v1",
    );
    if (!preparation || preparation.mediaType !== "application/json")
      throw new UnsupportedInstallProfileError();
    async function read(entry: typeof publication.envelope.body.curriculum) {
      const response = await namespace.read(entry.path);
      if (!response)
        throw new PublicationResourceError({
          kind: "missing",
          path: entry.path,
        });
      return readPublicationResponse({
        response,
        byteLength: entry.byteLength,
        mediaType: entry.mediaType,
        cancellation,
      });
    }
    const material = await parseInstallMaterial({
      envelope: raw,
      curriculum: await read(publication.envelope.body.curriculum),
      preparationBytes: await read(preparation),
      keys: options.keys,
      crypto: options.crypto,
      hash,
    });
    return material;
  }
  async function withVerified<T>(
    raw: Uint8Array,
    run: (
      material: SignedInstallMaterial,
      lease: InstallationLease,
    ) => Promise<T>,
  ): Promise<T> {
    const first = await withContent(raw, async (material) => material);
    cancellation.throwIfCancelled();
    const shell = await options.shell.prepare({
      teaching: first.teaching,
      cancellation,
    });
    return withContent(raw, (material) =>
      shell.withVerified(async (lease) => {
        cancellation.throwIfCancelled();
        if (material.teaching.key !== first.teaching.key || !lease.isCurrent())
          throw new Error("Shell lease expired");
        const proof = Object.freeze({
          isCurrent: () => options.lifetime.isCurrent() && lease.isCurrent(),
        });
        leases.add(proof);
        try {
          return await run(material, proof);
        } finally {
          leases.delete(proof);
        }
      }),
    );
  }
  async function withVerifiedBatch<T>(
    envelopes: readonly Uint8Array[],
    run: (
      materials: readonly SignedInstallMaterial[],
      lease: InstallationLease,
    ) => Promise<T>,
  ) {
    const request = {
      mode: options.mode,
      envelopes,
      keys: options.keys,
      crypto: options.crypto,
      ports: options.resources,
      cancellation,
    };
    const first = await withVerifiedPublicationBatch({
      ...request,
      run: (entries) => Promise.all(entries.map(materialFrom)),
    });
    const anchor = first[0];
    if (!anchor) throw new Error("Material batch is empty");
    cancellation.throwIfCancelled();
    const shell = await options.shell.prepare({
      teaching: anchor.teaching,
      retainedTeachings: first.map((value) => value.teaching),
      cancellation,
    });
    return withVerifiedPublicationBatch({
      ...request,
      run: async (entries) => {
        const materials = await Promise.all(entries.map(materialFrom));
        if (
          materials.some(
            (value, index) => value.teaching.key !== first[index]?.teaching.key,
          )
        )
          throw new Error("Material batch identity changed");
        return shell.withVerified(async (lease) => {
          const proof = Object.freeze({
            isCurrent: () => options.lifetime.isCurrent() && lease.isCurrent(),
          });
          leases.add(proof);
          try {
            requireInstallationLease(proof);
            const result = await run(materials, proof);
            requireInstallationLease(proof);
            return result;
          } finally {
            leases.delete(proof);
          }
        });
      },
    });
  }
  return {
    acquire,
    cachedEnvelope,
    withContent,
    withVerified,
    withVerifiedBatch,
    cancellation,
  };
}
