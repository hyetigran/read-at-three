import { syntheticLessonSixCourse } from "../lesson-six-fixture.ts";

import { ShellError } from "../../packages/teaching/src/shell.ts";
import { parseRuntimePackage } from "../../packages/teaching/src/index.ts";

import { AsyncLocalStorage } from "node:async_hooks";

import assert from "node:assert/strict";

import { DatabaseSync } from "node:sqlite";
import {
  createHash,
  generateKeyPairSync,
  sign,
  verify,
  createPublicKey,
} from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setImmediate } from "node:timers/promises";
import { createTeachingApplication } from "../../packages/storage/src/store.ts";
import type { TeachingApplicationOptions } from "../../packages/storage/src/store.ts";
import { requireCollectionClaim } from "../../packages/storage/src/index.ts";
import { parseInitialInstallCommand } from "../../packages/teaching/src/installation.ts";
import { canonical, parseId } from "../../packages/teaching/src/identity.ts";
import {
  parsePublicationHash,
  publicationUtf8,
} from "../../packages/teaching/src/publication.ts";
import type {
  PublicationCrypto,
  PublicationHash,
} from "../../packages/teaching/src/publication.ts";
import type {
  CatalogPublicationResources,
  PublicationResponse,
} from "../../packages/teaching/src/publication-resources.ts";
import {
  packageMetadata,
  resolvedLessons,
} from "../../packages/teaching/src/course-content.ts";
import { syntheticPrintedCourse } from "../printed-board-fixture.ts";
import { executorFor, hash } from "./support.ts";
import type { SqlHook } from "./support.ts";
import type { PackageCollectionClaim } from "../../packages/teaching/src/index.ts";
export async function installationFixture(
  t: { after(fn: () => Promise<void>): void },
  profile:
    | "complete"
    | "completeLessons"
    | "missingRole"
    | "unsupportedDocument"
    | "unsupportedCurriculum" = "complete",
) {
  const directory = await mkdtemp(join(tmpdir(), "reading-install-"));
  const path = join(directory, "reading.sqlite");
  const connections: DatabaseSync[] = [];
  t.after(async () => {
    for (const db of connections) if (db.isOpen) db.close();
    await rm(directory, { recursive: true, force: true });
  });
  const { content } =
    profile === "completeLessons"
      ? await syntheticLessonSixCourse()
      : await syntheticPrintedCourse();
  const curriculum = publicationUtf8(
    JSON.stringify(
      profile === "unsupportedCurriculum"
        ? { ...content, formatVersion: 2 }
        : content,
      null,
      2,
    ),
  );
  const added = (text: string) => ({
    copy: { kind: "added", text },
    marks: [],
  });
  const provenance = {
    kind: "synthetic",
    reviewId: "fixture.install.review",
    compositionHash: await hash("Neutral installation"),
    reviews: [],
    sources: [],
  };
  const preparationBody = {
    documentId: "fixture.install.preparation",
    title: added("Neutral parent preparation"),
    reviewHash: await hash(canonical(provenance)),
    provenance,
    sections: [
      {
        id: "fixture.intro",
        title: added("Prepare"),
        blocks: [
          {
            kind: "paragraph",
            id: "fixture.direction",
            role: "guidance",
            content: added("Synthetic instructions."),
          },
        ],
      },
    ],
    assets: [],
  };
  const preparation = publicationUtf8(
    JSON.stringify(
      {
        formatVersion: profile === "unsupportedDocument" ? 2 : 1,
        body: preparationBody,
        preparationHash: await hash(canonical(preparationBody)),
        assets: [],
      },
      null,
      2,
    ),
  );
  const digest = (bytes: Uint8Array) =>
    createHash("sha256").update(bytes).digest();
  const pair = generateKeyPairSync("ed25519");
  const key = {
    id: "fixture.install.key",
    spki: Uint8Array.from(
      pair.publicKey.export({ type: "spki", format: "der" }),
    ),
  };
  const crypto: PublicationCrypto = {
    sha256: async (bytes) => digest(bytes),
    verifyEd25519: async ({ spki, message, signature }) =>
      verify(
        null,
        message,
        createPublicKey({
          key: Buffer.from(spki),
          format: "der",
          type: "spki",
        }),
        signature,
      ),
  };
  const metadata = packageMetadata(content);
  const body = {
    courseId: content.body.courseId,
    releaseId: content.body.releaseId,
    contentSchemaVersion: metadata.contentSchemaVersion,
    requiredEngineCapabilities: [...metadata.capabilities],
    lessonIds: resolvedLessons(content).map((lesson) => lesson.lessonId),
    curriculum: {
      path: "curriculum.json",
      sha256: digest(curriculum).toString("hex"),
      byteLength: curriculum.length,
      mediaType: "application/json",
    },
    assets:
      profile === "missingRole"
        ? []
        : [
            {
              assetId: "parent-preparation-v1",
              path: "preparation.json",
              sha256: digest(preparation).toString("hex"),
              byteLength: preparation.length,
              mediaType: "application/json",
            },
          ],
    sourceReviewManifestHash: "a".repeat(64),
    compatibilityMappings: [],
    progressMappings: [],
  };
  const unsigned = {
    formatVersion: 1,
    body,
    packageHash: await hash(canonical(body)),
    signingKeyId: key.id,
  };
  const envelope = publicationUtf8(
    canonical({
      ...unsigned,
      signature: sign(
        null,
        publicationUtf8(canonical(unsigned)),
        pair.privateKey,
      ).toString("base64url"),
    }),
  );
  const target = parsePublicationHash(unsigned.packageHash);
  const envelopes = new Map<string, Uint8Array>([[target, envelope]]);
  const files = new Map([
    ["curriculum.json", curriculum],
    ["preparation.json", preparation],
  ]);
  const distribution = new Map<string, typeof files>([[target, files]]);
  const cache = new Map<string, { bytes: Uint8Array; mediaType: string }>();
  const namespaces = new Map<string, typeof cache>([[target, cache]]);
  const acquisitionTargets: PublicationHash[] = [];
  const downloadTargets: { hash: PublicationHash; path: string }[] = [];
  const heldContent = new AsyncLocalStorage<ReadonlySet<string>>();
  const resourceTails = new Map<string, Promise<void>>();
  let resourceGate = Promise.resolve();
  let eraseHook:
    | ((
        input: Readonly<{
          path: string;
          stage: "before" | "after";
          claim: PackageCollectionClaim;
        }>,
      ) => Promise<void>)
    | undefined;
  let downloads = 0,
    acquisitions = 0,
    hashFailure = false;
  let gate: Promise<void> = Promise.resolve();
  let shell = true;
  let offline = false;
  let cachedContentLength = true;
  let locks = 0;
  const response = (
    bytes: Uint8Array,
    mediaType: string,
  ): PublicationResponse => ({
    status: 200,
    redirected: false,
    exactUrl: true,
    mediaType,
    contentLength: String(bytes.length),
    contentEncoding: null,
    chunks: (async function* () {
      yield Uint8Array.from(bytes);
    })(),
    cancel: async () => {},
  });
  const resources: CatalogPublicationResources = {
    inventory: async ({ mode }) => {
      if (mode !== "fixture")
        throw new Error("Synthetic namespace mode unavailable");
      return [...namespaces.keys()].sort().map(parsePublicationHash);
    },
    exclusive: async ({ run, hash: scopeHash }) => {
      const previous = resourceTails.get(scopeHash) ?? Promise.resolve();
      let release!: () => void;
      resourceTails.set(
        scopeHash,
        new Promise((resolve) => {
          release = resolve;
        }),
      );
      await previous;
      const held = heldContent.getStore() ?? new Set<string>();
      assert.equal(
        held.has(scopeHash),
        false,
        "Non-reentrant content hash lock",
      );
      const scoped =
        namespaces.get(scopeHash) ??
        new Map<string, { bytes: Uint8Array; mediaType: string }>();
      namespaces.set(scopeHash, scoped);
      locks++;
      try {
        return await heldContent.run(new Set([...held, scopeHash]), () =>
          run({
            erase: async (claim) => {
              await requireCollectionClaim({
                claim,
                mode: "fixture",
                hash: scopeHash,
              });
              for (const path of [...scoped.keys()]) {
                await resourceGate;
                await requireCollectionClaim({
                  claim,
                  mode: "fixture",
                  hash: scopeHash,
                });
                await eraseHook?.({ path, stage: "before", claim });
                scoped.delete(path);
                await eraseHook?.({ path, stage: "after", claim });
              }
              await requireCollectionClaim({
                claim,
                mode: "fixture",
                hash: scopeHash,
              });
              namespaces.delete(scopeHash);
            },
            paths: async () => {
              await resourceGate;
              return [...scoped.keys()];
            },
            read: async (path) => {
              const entry = scoped.get(path);
              return entry
                ? {
                    ...response(entry.bytes, entry.mediaType),
                    contentLength: cachedContentLength
                      ? String(entry.bytes.length)
                      : null,
                  }
                : undefined;
            },
            write: async ({ path, bytes, mediaType }) => {
              scoped.set(path, { bytes: Uint8Array.from(bytes), mediaType });
            },
          }),
        );
      } finally {
        locks--;
        release();
      }
    },
    download: async ({ path, hash: scopeHash }) => {
      downloadTargets.push({ hash: scopeHash, path });
      downloads++;
      if (offline) throw new Error("Offline download refused");
      const bytes = distribution.get(scopeHash)?.get(path);
      if (!bytes) throw new Error("Missing neutral resource");
      return response(bytes, "application/json");
    },
  };
  let serial = 0;
  const ids = () => `install-fixture-${++serial}`;
  function connect(
    hook?: SqlHook,
    offer?: {
      publicationHash: PublicationHash;
      releaseId: typeof content.body.releaseId;
    },
  ) {
    const db = new DatabaseSync(path);
    connections.push(db);
    db.exec("PRAGMA journal_mode=DELETE");
    db.exec("PRAGMA synchronous=FULL");
    let live = true;
    const applicationOptions: TeachingApplicationOptions = {
      executor: executorFor(db, hook),
      ids,
      hash: async (text) => {
        if (
          hashFailure &&
          text.includes('"documentId":"fixture.install.preparation"')
        )
          throw new Error("Synthetic crypto unavailable");
        return hash(text);
      },
      installed: {
        courseId: parseId({ kind: "course", value: content.body.courseId }),
        ...(offer ? { offer } : {}),
        mode: "fixture",
        keys: [key],
        crypto,
        resources,
        envelope: async (requested) => {
          acquisitions++;
          acquisitionTargets.push(requested);
          if (offline) throw new Error("Offline envelope refused");
          await gate;
          const bytes = envelopes.get(requested);
          if (!bytes) throw new Error("Unknown configured publication");
          return bytes;
        },
        lifetime: { isCurrent: () => live },
        shell: {
          prepare: async () => {
            assert.equal(
              heldContent.getStore()?.size ?? 0,
              0,
              "Verified handshake precedes held content/shell scopes",
            );
            if (!shell)
              throw new ShellError({
                kind: "unavailable",
                reason: "uncontrolled",
              });
            return {
              withVerified: async (run) => {
                assert.equal(
                  (heldContent.getStore()?.size ?? 0) > 0,
                  true,
                  "Content lock precedes shell lock",
                );
                return run({ isCurrent: () => live && shell });
              },
            };
          },
        },
      },
    };
    const app = createTeachingApplication(applicationOptions);
    return {
      db,
      app,
      executor: applicationOptions.executor,
      installed: applicationOptions.installed,
      retire() {
        live = false;
      },
    };
  }
  async function command(
    app: ReturnType<typeof connect>["app"],
    name = "fixture.install.command",
    selectedTarget: PublicationHash = target,
  ) {
    const catalog = await app.installations();
    return parseInitialInstallCommand({
      version: 1,
      kind: "initialInstall",
      installationId: catalog.installationId,
      commandId: name,
      source: { mode: "fixture" },
      target: {
        publicationHash: selectedTarget,
        courseId: content.body.courseId,
        releaseId: content.body.releaseId,
      },
      expected: catalog.courses[0]?.activation ?? { kind: "absent" },
    });
  }
  async function until(app: ReturnType<typeof connect>["app"], kind: string) {
    for (let i = 0; i < 300; i++) {
      const read = (await app.installations()).commands[0];
      if (read?.fact.kind === kind) return read;
      await setImmediate();
    }
    throw new Error(
      `Installation did not reach ${kind}: ${JSON.stringify(await app.installations())}`,
    );
  }
  async function otherTarget() {
    const nextBody = { ...body, sourceReviewManifestHash: "b".repeat(64) };
    const nextUnsigned = {
      formatVersion: 1,
      body: nextBody,
      packageHash: await hash(canonical(nextBody)),
      signingKeyId: key.id,
    };
    const raw = publicationUtf8(
      canonical({
        ...nextUnsigned,
        signature: sign(
          null,
          publicationUtf8(canonical(nextUnsigned)),
          pair.privateKey,
        ).toString("base64url"),
      }),
    );
    const selected = parsePublicationHash(nextUnsigned.packageHash);
    envelopes.set(selected, raw);
    distribution.set(selected, files);
    return selected;
  }
  async function anotherRelease(
    name = "fixture.release.next",
    source = content,
  ) {
    const releaseId = parseId({
      kind: "release",
      value: name,
    });
    const nextCurriculumBody = { ...source.body, releaseId };
    const nextContent = await parseRuntimePackage(
      {
        ...content,
        body: nextCurriculumBody,
        packageHash: await hash(canonical(nextCurriculumBody)),
      },
      hash,
    );
    const nextCurriculum = publicationUtf8(
      JSON.stringify(nextContent, null, 2),
    );
    const nextBody = {
      ...body,
      releaseId,
      curriculum: {
        ...body.curriculum,
        sha256: digest(nextCurriculum).toString("hex"),
        byteLength: nextCurriculum.length,
      },
    };
    const unsigned = {
      formatVersion: 1,
      body: nextBody,
      packageHash: await hash(canonical(nextBody)),
      signingKeyId: key.id,
    };
    const raw = publicationUtf8(
      canonical({
        ...unsigned,
        signature: sign(
          null,
          publicationUtf8(canonical(unsigned)),
          pair.privateKey,
        ).toString("base64url"),
      }),
    );
    const nextTarget = parsePublicationHash(unsigned.packageHash);
    envelopes.set(nextTarget, raw);
    distribution.set(
      nextTarget,
      new Map([...files, ["curriculum.json", nextCurriculum]]),
    );
    return {
      target: nextTarget,
      envelope: raw,
      curriculum: nextCurriculum,
      releaseId,
    };
  }
  return {
    anotherRelease,
    acquisitionTargets,
    downloadTargets,
    connect,
    command,
    until,
    ids,
    content,
    target,
    otherTarget,
    get contentLocked() {
      return locks > 0;
    },
    setResourceGate(value: Promise<void>) {
      resourceGate = value;
    },
    setEraseHook(value: typeof eraseHook) {
      eraseHook = value;
    },
    replaceEnvelope(bytes: Uint8Array) {
      envelopes.set(target, Uint8Array.from(bytes));
    },
    envelopeFor(requested: PublicationHash) {
      const bytes = envelopes.get(requested);
      if (!bytes) throw Error("Missing test envelope");
      return Uint8Array.from(bytes);
    },
    namespacePresent(requested: PublicationHash) {
      return namespaces.has(requested);
    },
    namespace(requested: PublicationHash) {
      return namespaces.get(requested);
    },
    envelope,
    curriculum,
    preparation,
    cache,
    get downloads() {
      return downloads;
    },
    get acquisitions() {
      return acquisitions;
    },
    setGate(value: Promise<void>) {
      gate = value;
    },
    setCachedContentLength(value: boolean) {
      cachedContentLength = value;
    },
    setOffline(value: boolean) {
      offline = value;
    },
    setShell(value: boolean) {
      shell = value;
    },
    setHashFailure(value: boolean) {
      hashFailure = value;
    },
  };
}
