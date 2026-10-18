import {
  decodePublicationUtf8,
  publicationLimits,
  verifyPublication,
  verifyPublicationResource,
  type PublicationCrypto,
  type PublicationHash,
  type PublicationTrustKey,
  type VerifiedPublication,
} from "./publication.ts";
import type { PublicationResource } from "./publication-schemas.ts";
import { validatePreparationSvg } from "./preparation-svg.ts";

export type PublicationMode = "fixture" | "publication";
export type PublicationCancellation = Readonly<{ throwIfCancelled(): void }>;
export type PublicationResponse = Readonly<{
  status: number;
  redirected: boolean;
  exactUrl: boolean;
  mediaType: string | null;
  contentLength: string | null;
  contentEncoding: string | null;
  chunks: AsyncIterable<Uint8Array>;
  cancel(): Promise<void>;
}>;
export type PublicationNamespace = Readonly<{
  paths(): Promise<readonly string[]>;
  read(path: string): Promise<PublicationResponse | undefined>;
  write(
    input: Readonly<{ path: string; bytes: Uint8Array; mediaType: string }>,
  ): Promise<void>;
}>;
export type PublicationResourcePorts = Readonly<{
  exclusive<T>(
    input: Readonly<{
      mode: PublicationMode;
      hash: PublicationHash;
      run(namespace: PublicationNamespace): Promise<T>;
    }>,
  ): Promise<T>;
  download(
    input: Readonly<{
      mode: PublicationMode;
      hash: PublicationHash;
      path: string;
    }>,
  ): Promise<PublicationResponse>;
}>;
export type VerifiedPublicationClosure = Readonly<{
  kind: "verified-closure";
  mode: PublicationMode;
  publication: VerifiedPublication;
}>;
export type PublicationClosureResult =
  | VerifiedPublicationClosure
  | Readonly<{ kind: "missing"; path: string }>
  | Readonly<{ kind: "corrupt"; reason: PublicationIntegrityReason }>
  | Readonly<{ kind: "unavailable"; reason: PublicationUnavailableReason }>;
export type PublicationIntegrityReason =
  | "envelope-integrity"
  | "namespace-integrity"
  | "response-metadata"
  | "response-length"
  | "resource-integrity"
  | "svg-grammar";
export type PublicationUnavailableReason =
  "cache-access" | "download" | "stream" | "crypto" | "cancelled";
export class PublicationResourceError extends Error {
  constructor(
    readonly failure:
      | Readonly<{ kind: "missing"; path: string }>
      | Readonly<{ kind: "corrupt"; reason: PublicationIntegrityReason }>
      | Readonly<{ kind: "unavailable"; reason: PublicationUnavailableReason }>,
  ) {
    super(failure.kind === "missing" ? "missing" : failure.reason);
    this.name = "PublicationResourceError";
  }
}
function invalid(reason: PublicationIntegrityReason): never {
  throw new PublicationResourceError({ kind: "corrupt", reason });
}
async function unavailable<T>(
  reason: PublicationUnavailableReason,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof PublicationResourceError) throw error;
    throw new PublicationResourceError({ kind: "unavailable", reason });
  }
}
function checkCancellation(cancellation: PublicationCancellation): void {
  try {
    cancellation.throwIfCancelled();
  } catch {
    throw new PublicationResourceError({
      kind: "unavailable",
      reason: "cancelled",
    });
  }
}
async function integrity<T>(
  reason: PublicationIntegrityReason,
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof PublicationResourceError) throw error;
    invalid(reason);
  }
}
export const publicationEnvelopePath = "_publication-envelope.json";

type VerificationInput = Readonly<{
  mode: PublicationMode;
  raw: Uint8Array;
  keys: readonly PublicationTrustKey[];
  crypto: PublicationCrypto;
  ports: PublicationResourcePorts;
  cancellation: PublicationCancellation;
}>;

function inventory(
  publication: VerifiedPublication,
): readonly PublicationResource[] {
  const body = publication.envelope.body;
  const entries = [body.curriculum, ...body.assets];
  if (entries.some((entry) => entry.path === publicationEnvelopePath))
    invalid("namespace-integrity");
  return entries;
}

export async function readPublicationResponse(
  input: Readonly<{
    response: PublicationResponse;
    byteLength: number;
    mediaType: string;
    cancellation: PublicationCancellation;
  }>,
): Promise<Uint8Array> {
  const { response, byteLength, mediaType, cancellation } = input;
  try {
    if (
      !Number.isSafeInteger(byteLength) ||
      byteLength < 1 ||
      byteLength > publicationLimits.curriculumBytes
    )
      invalid("response-length");
    if (response.status !== 200 || response.redirected || !response.exactUrl)
      invalid("response-metadata");
    if (response.mediaType?.trim().toLowerCase() !== mediaType)
      invalid("response-metadata");
    const encoding =
      response.contentEncoding?.trim().toLowerCase() ?? "identity";
    if (!["identity", "gzip", "br", "deflate"].includes(encoding))
      invalid("response-metadata");
    if (response.contentLength !== null) {
      if (!/^(0|[1-9][0-9]*)$/.test(response.contentLength))
        invalid("response-length");
      const length = Number(response.contentLength);
      if (
        !Number.isSafeInteger(length) ||
        length < 1 ||
        (encoding === "identity"
          ? length !== byteLength
          : length > publicationLimits.curriculumBytes)
      )
        invalid("response-length");
    }
    checkCancellation(cancellation);
    const chunks: Uint8Array[] = [];
    let block = new Uint8Array(0);
    let used = 0;
    let size = 0;
    for await (const chunk of response.chunks) {
      checkCancellation(cancellation);
      if (chunk.length > byteLength - size) invalid("response-length");
      let cursor = 0;
      while (cursor < chunk.length) {
        if (used === block.length) {
          block = new Uint8Array(Math.min(65536, byteLength - size - cursor));
          chunks.push(block);
          used = 0;
        }
        const count = Math.min(block.length - used, chunk.length - cursor);
        block.set(chunk.subarray(cursor, cursor + count), used);
        cursor += count;
        used += count;
      }
      size += chunk.length;
    }
    checkCancellation(cancellation);
    if (size !== byteLength) invalid("response-length");
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return bytes;
  } catch (error) {
    if (error instanceof PublicationResourceError) throw error;
    throw new PublicationResourceError({
      kind: "unavailable",
      reason: "stream",
    });
  } finally {
    await unavailable("stream", () => response.cancel());
  }
}

async function verifiedResource(
  input: Readonly<{
    publication: VerifiedPublication;
    entry: PublicationResource;
    response: PublicationResponse;
    crypto: PublicationCrypto;
    cancellation: PublicationCancellation;
  }>,
): Promise<Uint8Array> {
  const bytes = await readPublicationResponse({
    ...input,
    byteLength: input.entry.byteLength,
    mediaType: input.entry.mediaType,
  });
  await integrity("resource-integrity", () =>
    verifyPublicationResource({ ...input, path: input.entry.path, bytes }),
  );
  if (input.entry.mediaType === "image/svg+xml")
    await integrity("svg-grammar", async () =>
      validatePreparationSvg(decodePublicationUtf8(bytes)),
    );
  return bytes;
}

async function inspect(
  input: VerificationInput,
  publication: VerifiedPublication,
  namespace: PublicationNamespace,
): Promise<PublicationClosureResult> {
  checkCancellation(input.cancellation);
  const entries = inventory(publication);
  const expected = [
    publicationEnvelopePath,
    ...entries.map((entry) => entry.path),
  ];
  const paths = await unavailable("cache-access", () => namespace.paths());
  if (
    new Set(paths).size !== paths.length ||
    paths.some((path) => !expected.includes(path))
  )
    return {
      kind: "corrupt",
      reason: "namespace-integrity",
    };
  for (const path of expected)
    if (!paths.includes(path)) return { kind: "missing", path };
  try {
    const envelopeResponse = await unavailable("cache-access", () =>
      namespace.read(publicationEnvelopePath),
    );
    if (!envelopeResponse)
      return { kind: "missing", path: publicationEnvelopePath };
    const raw = await readPublicationResponse({
      response: envelopeResponse,
      byteLength: input.raw.length,
      mediaType: "application/json",
      cancellation: input.cancellation,
    });
    if (raw.some((byte, index) => byte !== input.raw[index]))
      invalid("envelope-integrity");
    const retained = await integrity("envelope-integrity", () =>
      verifyPublication({ ...input, raw }),
    );
    if (retained.hash !== publication.hash) invalid("envelope-integrity");
    for (const entry of entries) {
      checkCancellation(input.cancellation);
      const response = await unavailable("cache-access", () =>
        namespace.read(entry.path),
      );
      if (!response) return { kind: "missing", path: entry.path };
      await verifiedResource({
        ...input,
        publication: retained,
        entry,
        response,
      });
    }
    checkCancellation(input.cancellation);
    return {
      kind: "verified-closure",
      mode: input.mode,
      publication: retained,
    };
  } catch (error) {
    if (error instanceof PublicationResourceError) return error.failure;
    return { kind: "unavailable", reason: "cache-access" };
  }
}

export async function revalidatePublicationClosure(
  request: VerificationInput,
): Promise<PublicationClosureResult> {
  try {
    const input = snapshot(request);
    const publication = await integrity("envelope-integrity", () =>
      verifyPublication(input),
    );
    inventory(publication);
    return await unavailable("cache-access", () =>
      input.ports.exclusive({
        mode: input.mode,
        hash: publication.hash,
        run: (namespace) => inspect(input, publication, namespace),
      }),
    );
  } catch (error) {
    if (error instanceof PublicationResourceError) return error.failure;
    return { kind: "unavailable", reason: "cache-access" };
  }
}

export async function publishPublicationClosure(
  request: VerificationInput,
): Promise<VerifiedPublicationClosure> {
  const input = snapshot(request);
  const publication = await integrity("envelope-integrity", () =>
    verifyPublication(input),
  );
  const entries = inventory(publication);
  return unavailable("cache-access", () =>
    input.ports.exclusive({
      mode: input.mode,
      hash: publication.hash,
      run: async (namespace) => {
        checkCancellation(input.cancellation);
        const paths = await unavailable("cache-access", () =>
          namespace.paths(),
        );
        const expected = [
          publicationEnvelopePath,
          ...entries.map((entry) => entry.path),
        ];
        if (
          new Set(paths).size !== paths.length ||
          paths.some((path) => !expected.includes(path))
        )
          invalid("namespace-integrity");
        await unavailable("cache-access", () =>
          namespace.write({
            path: publicationEnvelopePath,
            bytes: Uint8Array.from(input.raw),
            mediaType: "application/json",
          }),
        );
        let total = 0;
        for (const entry of entries) {
          checkCancellation(input.cancellation);
          total += entry.byteLength;
          if (total > publicationLimits.totalBytes) invalid("response-length");
          const response = await unavailable("download", () =>
            input.ports.download({
              mode: input.mode,
              hash: publication.hash,
              path: entry.path,
            }),
          );
          const bytes = await verifiedResource({
            ...input,
            publication,
            entry,
            response,
          });
          checkCancellation(input.cancellation);
          await unavailable("cache-access", () =>
            namespace.write({
              path: entry.path,
              bytes,
              mediaType: entry.mediaType,
            }),
          );
        }
        const result = await inspect(input, publication, namespace);
        if (result.kind !== "verified-closure")
          throw new PublicationResourceError(result);
        return result;
      },
    }),
  );
}

function snapshot(input: VerificationInput): VerificationInput {
  if (input.raw.length > publicationLimits.envelopeBytes)
    invalid("envelope-integrity");
  const crypto: PublicationCrypto = {
    sha256: (bytes) => unavailable("crypto", () => input.crypto.sha256(bytes)),
    verifyEd25519: (request) =>
      unavailable("crypto", () => input.crypto.verifyEd25519(request)),
  };
  return { ...input, crypto, raw: Uint8Array.from(input.raw) };
}
