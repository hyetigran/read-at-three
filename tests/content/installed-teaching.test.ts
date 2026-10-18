import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createHash,
  generateKeyPairSync,
  sign,
  verify,
  createPublicKey,
} from "node:crypto";
import { canonical } from "../../packages/teaching/src/identity.ts";
import {
  packageMetadata,
  resolvedLessons,
} from "../../packages/teaching/src/course-content.ts";
import {
  verifyPublication,
  publicationUtf8,
} from "../../packages/teaching/src/publication.ts";
import type { PublicationCrypto } from "../../packages/teaching/src/publication.ts";
import type { ManifestBody } from "../../packages/teaching/src/publication-schemas.ts";
import {
  parseSignedInstalledTeaching,
  parseDevelopmentInstalledTeaching,
  InstalledTeachingError,
} from "../../packages/teaching/src/installed-teaching.ts";
import { syntheticPrintedCourse } from "../printed-board-fixture.ts";
import { hash } from "../lesson-two-fixture.ts";

const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest();
const pair = generateKeyPairSync("ed25519");
const key = {
  id: "neutral-loader-test",
  spki: Uint8Array.from(pair.publicKey.export({ type: "spki", format: "der" })),
};
const crypto: PublicationCrypto = {
  sha256: async (bytes) => digest(bytes),
  verifyEd25519: async ({ spki, message, signature }) =>
    verify(
      null,
      message,
      createPublicKey({ key: Buffer.from(spki), format: "der", type: "spki" }),
      signature,
    ),
};
async function fixture() {
  const { content } = await syntheticPrintedCourse();
  const bytes = publicationUtf8(JSON.stringify(content, null, 2));
  const metadata = packageMetadata(content);
  const body: ManifestBody = {
    courseId: content.body.courseId,
    releaseId: content.body.releaseId,
    contentSchemaVersion: metadata.contentSchemaVersion,
    requiredEngineCapabilities: [...metadata.capabilities],
    lessonIds: resolvedLessons(content).map((lesson) => lesson.lessonId),
    curriculum: {
      path: "curriculum.json",
      sha256: digest(bytes).toString("hex"),
      byteLength: bytes.length,
      mediaType: "application/json",
    },
    assets: [],
    sourceReviewManifestHash: "a".repeat(64),
    compatibilityMappings: [],
    progressMappings: [],
  };
  return { content, bytes, body };
}
async function authenticate(body: ManifestBody) {
  const unsigned = {
    formatVersion: 1,
    body,
    packageHash: await hash(canonical(body)),
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
  return verifyPublication({ raw, keys: [key], crypto });
}
async function read(body: ManifestBody, bytes: Uint8Array, port = crypto) {
  return parseSignedInstalledTeaching({
    publication: await authenticate(body),
    curriculum: bytes,
    crypto: port,
  });
}
function file(body: ManifestBody, bytes: Uint8Array): ManifestBody {
  return {
    ...body,
    curriculum: {
      ...body.curriculum,
      sha256: digest(bytes).toString("hex"),
      byteLength: bytes.length,
    },
  };
}
async function rejected(
  promise: Promise<unknown>,
  reason: "invalid" | "unavailable" = "invalid",
) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof InstalledTeachingError);
    assert.equal(error.reason, reason);
    assert.equal(
      error.message,
      reason === "invalid"
        ? "Installed teaching content is invalid."
        : "Installed teaching verification is unavailable.",
    );
    assert.equal(error.cause, undefined);
    return true;
  });
}
test("signed teaching retains distinct authenticated manifest, exact file and inner body identities", async () => {
  const { content, bytes, body } = await fixture();
  const signed = await read(body, bytes);
  assert.deepEqual(signed.document, content);
  assert.equal(signed.document.packageHash, content.packageHash);
  assert.equal(signed.identity.hash, await hash(canonical(body)));
  assert.equal(signed.curriculumFile.sha256, digest(bytes).toString("hex"));
  assert.equal(
    new Set([
      signed.identity.hash,
      signed.curriculumFile.sha256,
      signed.document.packageHash,
    ]).size,
    3,
  );
  assert.deepEqual(publicationUtf8(signed.curriculumFile.utf8), bytes);
  assert.equal(signed.body, signed.document.body);
  assert.equal(Object.isFrozen(signed.body), true);
  assert.equal(Object.isFrozen(signed.curriculumFile), true);
  assert.equal(Object.isFrozen(signed.identity), true);
  assert.equal(Object.isFrozen(signed), true);
  const dev = await parseDevelopmentInstalledTeaching({
    document: content,
    hash,
  });
  assert.equal(dev.document, content);
  assert.equal(dev.body, content.body);
  assert.equal(dev.identity.kind, "development-v1");
  assert.equal(dev.identity.hash, content.packageHash);
});
test("fresh valid signatures cannot substitute course, release, schema or ordered lessons", async () => {
  const { bytes, body } = await fixture();
  for (const changed of [
    { ...body, courseId: "other-course" },
    { ...body, releaseId: "other-release" },
    {
      ...body,
      contentSchemaVersion: 2,
      requiredEngineCapabilities: [
        "writing-practice-plan-v2",
        "guidance-runs-v2",
      ],
    },
    { ...body, lessonIds: [...body.lessonIds].reverse() },
    { ...body, lessonIds: body.lessonIds.slice(1) },
  ])
    await rejected(read(changed, bytes));
  const reordered = {
    ...body,
    requiredEngineCapabilities: [...body.requiredEngineCapabilities].reverse(),
  };
  assert.deepEqual(
    (await read(reordered, bytes)).document.body,
    (await read(body, bytes)).document.body,
  );
});
test("wrong length and same-length corruption fail before parsing or inner hash", async () => {
  const { bytes, body } = await fixture();
  const publication = await authenticate(body);
  let calls = 0;
  const observed: PublicationCrypto = {
    ...crypto,
    sha256: async (input) => {
      calls++;
      return digest(input);
    },
  };
  await rejected(
    parseSignedInstalledTeaching({
      publication,
      curriculum: bytes.slice(1),
      crypto: observed,
    }),
  );
  assert.equal(calls, 0);
  const corrupt = Uint8Array.from(bytes);
  corrupt[0] = 0;
  await rejected(
    parseSignedInstalledTeaching({
      publication,
      curriculum: corrupt,
      crypto: observed,
    }),
  );
  assert.equal(calls, 1);
});
test("authenticated invalid JSON, UTF8, grammar, body hashes and metadata fail without leaking parser text", async () => {
  const { bytes, body, content } = await fixture();
  const invalid = [
    publicationUtf8('{"private-parser-detail":'),
    Uint8Array.of(0xc0, 0xaf),
    publicationUtf8('{"private-parser-detail":true}'),
    publicationUtf8(
      JSON.stringify({ ...content, packageHash: "b".repeat(64) }),
    ),
    publicationUtf8("[".repeat(33) + "]".repeat(33)),
    publicationUtf8('{"private":"\\ud800"}'),
  ];
  for (const bad of invalid) await rejected(read(file(body, bad), bad));
  const changedBody = { ...content.body, courseId: "substituted-inner-course" };
  const changed = publicationUtf8(
    JSON.stringify({
      ...content,
      body: changedBody,
      packageHash: await hash(canonical(changedBody)),
    }),
  );
  await rejected(read(file(body, changed), changed));
  assert.ok(bytes.length > 0);
});
test("unsupported capabilities and migration mappings are refused by actual signed authentication", async () => {
  const { body } = await fixture();
  await assert.rejects(
    authenticate({
      ...body,
      requiredEngineCapabilities: [
        ...body.requiredEngineCapabilities,
        "invented-capability",
      ],
    }),
    /Unsupported schema or capabilities/,
  );
  await assert.rejects(
    authenticate({
      ...body,
      compatibilityMappings: [
        { fromReleaseId: "a", fromLessonId: "b", toLessonId: "c" },
      ],
    }),
    /Unsupported migration mappings/,
  );
});
test("caller mutation during crypto cannot change the verified curriculum snapshot", async () => {
  const { bytes, body, content } = await fixture();
  const publication = await authenticate(body);
  const callerBytes = Uint8Array.from(bytes);
  const port: PublicationCrypto = {
    ...crypto,
    sha256: async (input) => {
      callerBytes.fill(0);
      return digest(input);
    },
  };
  const result = await parseSignedInstalledTeaching({
    publication,
    curriculum: callerBytes,
    crypto: port,
  });
  assert.deepEqual(result.document, content);
  assert.deepEqual(publicationUtf8(result.curriculumFile.utf8), bytes);
  await rejected(
    parseSignedInstalledTeaching({
      publication,
      curriculum: bytes,
      crypto: {
        ...crypto,
        sha256: async () => {
          throw new Error("private crypto diagnostic");
        },
      },
    }),
    "unavailable",
  );
  await rejected(
    parseSignedInstalledTeaching({
      publication,
      curriculum: bytes,
      crypto: { ...crypto, sha256: async () => new Uint8Array(31) },
    }),
  );
});

test("independently rehashed curriculum cannot add or duplicate capabilities", async () => {
  const { body, content } = await fixture();
  const metadata = packageMetadata(content);
  for (const requiredEngineCapabilities of [
    [...metadata.capabilities, "invented-inner-capability"],
    [...metadata.capabilities, metadata.capabilities[0]],
  ]) {
    const innerBody = { ...content.body, requiredEngineCapabilities };
    const bytes = publicationUtf8(
      JSON.stringify({
        ...content,
        body: innerBody,
        packageHash: await hash(canonical(innerBody)),
      }),
    );
    await rejected(read(file(body, bytes), bytes));
  }
});

test("development hash primitive outages are unavailable while invalid documents remain invalid", async () => {
  const { content } = await fixture();
  await rejected(
    parseDevelopmentInstalledTeaching({
      document: content,
      hash: async () => {
        throw new Error("private development crypto diagnostic");
      },
    }),
    "unavailable",
  );
  await rejected(parseDevelopmentInstalledTeaching({ document: {}, hash }));
});
test("inner body verification primitive outage remains unavailable after file authentication", async () => {
  const { body, bytes } = await fixture();
  const publication = await authenticate(body);
  let calls = 0;
  await rejected(
    parseSignedInstalledTeaching({
      publication,
      curriculum: bytes,
      crypto: {
        ...crypto,
        sha256: async (value) => {
          if (++calls === 2) throw new Error("private inner digest diagnostic");
          return digest(value);
        },
      },
    }),
    "unavailable",
  );
  assert.equal(calls, 2);
});
