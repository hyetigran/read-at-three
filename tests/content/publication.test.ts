import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
} from "node:crypto";
import vectors from "./fixtures/publication-vectors.ts";
import {
  publicationUtf8,
  parseCanonicalPublicationJson,
  decodePublicationSignature,
  requireEd25519Spki,
  verifyPublication,
  verifyPublicationResource,
  publicationLimits,
} from "../../packages/teaching/src/index.ts";
import type {
  PublicationCrypto,
  ManifestBody,
} from "../../packages/teaching/src/index.ts";

const bytes = (hex: string) => Uint8Array.from(Buffer.from(hex, "hex"));
const digest = (input: Uint8Array) =>
  createHash("sha256").update(input).digest();
const crypto: PublicationCrypto = {
  sha256: async (input) => digest(input),
  verifyEd25519: async (input) =>
    verify(
      null,
      input.message,
      createPublicKey({
        key: Buffer.from(input.spki),
        format: "der",
        type: "spki",
      }),
      input.signature,
    ),
};
const privateKey = createPrivateKey({
  key: Buffer.from(
    "302e020100300506032b6570042204209d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60",
    "hex",
  ),
  format: "der",
  type: "pkcs8",
});
const fixtureKey = {
  id: "engineering-fixture-only",
  spki: Uint8Array.from(
    createPublicKey(privateKey).export({ format: "der", type: "spki" }),
  ),
};
const keys = [fixtureKey];
function jcs(input: unknown): string {
  if (Array.isArray(input)) return `[${input.map(jcs).join(",")}]`;
  if (input !== null && typeof input === "object")
    return `{${Object.entries(input)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, value]) => `${JSON.stringify(key)}:${jcs(value)}`)
      .join(",")}}`;
  const value = JSON.stringify(input);
  if (value === undefined) throw new Error("Not JSON");
  return value;
}
const curriculum = Buffer.from('{"synthetic":true}');
function body(): ManifestBody {
  return {
    courseId: "synthetic-course",
    releaseId: "synthetic-release",
    contentSchemaVersion: 3,
    requiredEngineCapabilities: [
      "writing-practice-plan-v2",
      "guidance-runs-v2",
      "printed-board-cues-v2",
    ],
    lessonIds: ["synthetic-lesson"],
    curriculum: {
      path: "curriculum.json",
      sha256: digest(curriculum).toString("hex"),
      byteLength: curriculum.length,
      mediaType: "application/json",
    },
    assets: [],
    sourceReviewManifestHash: "a".repeat(64),
    compatibilityMappings: [],
    progressMappings: [],
  };
}
function wire(
  value: unknown = body(),
  extra: Record<string, unknown> = {},
): Uint8Array {
  const unsigned = {
    formatVersion: 1,
    body: value,
    packageHash: digest(Buffer.from(jcs(value))).toString("hex"),
    signingKeyId: fixtureKey.id,
    ...extra,
  };
  return Buffer.from(
    jcs({
      ...unsigned,
      signature: sign(null, Buffer.from(jcs(unsigned)), privateKey).toString(
        "base64url",
      ),
    }),
  );
}
async function reject(value: unknown, pattern: RegExp) {
  await assert.rejects(
    verifyPublication({ raw: wire(value), keys, crypto }),
    pattern,
  );
}

test("fixed independent RFC canonical UTF8, SHA256, Ed25519 and SPKI vectors use the actual boundary", async () => {
  const raw = bytes(vectors.jcs.canonicalHex);
  assert.deepEqual(
    publicationUtf8(jcs(parseCanonicalPublicationJson(raw))),
    raw,
  );
  for (const vector of vectors.sha256)
    assert.equal(
      Buffer.from(await crypto.sha256(bytes(vector.messageHex))).toString(
        "hex",
      ),
      vector.sha256,
    );
  for (const vector of vectors.ed25519) {
    const spki = bytes(vectors.spki.prefixHex + vector.publicKeyHex);
    requireEd25519Spki(spki);
    const signature = decodePublicationSignature(
      Buffer.from(vector.signatureHex, "hex").toString("base64url"),
    );
    assert.equal(
      await crypto.verifyEd25519({
        spki,
        message: bytes(vector.messageHex),
        signature,
      }),
      true,
    );
  }
  requireEd25519Spki(bytes(vectors.spki.rfcExampleDerHex));
  for (const vector of vectors.cryptoNegatives)
    assert.equal(
      await crypto.verifyEd25519({
        spki: bytes(vector.spkiDerHex),
        message: bytes(vector.messageHex),
        signature: bytes(vector.signatureHex),
      }),
      false,
    );
  for (const vector of vectors.wireNegatives)
    assert.throws(
      () => parseCanonicalPublicationJson(bytes(vector.wireHex)),
      Error,
      vector.id,
    );
  for (const vector of vectors.signatureEncodingNegatives)
    assert.throws(
      () => decodePublicationSignature(vector.encoded),
      /signature encoding/,
      vector.id,
    );
});
test("complete synthetic signed envelope authenticates exact body, signature, immutable inventory and declared bytes", async () => {
  const publication = await verifyPublication({ raw: wire(), keys, crypto });
  assert.equal(publication.kind, "signed-v1");
  assert.equal(
    publication.hash,
    digest(Buffer.from(jcs(body()))).toString("hex"),
  );
  assert.deepEqual(publication.envelope.body, body());
  assert.equal(Object.isFrozen(publication.envelope.body.curriculum), true);
  assert.deepEqual(
    await verifyPublicationResource({
      publication,
      path: "curriculum.json",
      bytes: curriculum,
      crypto,
    }),
    body().curriculum,
  );
  await assert.rejects(
    verifyPublicationResource({
      publication,
      path: "missing.json",
      bytes: curriculum,
      crypto,
    }),
    /Undeclared/,
  );
  await assert.rejects(
    verifyPublicationResource({
      publication,
      path: "curriculum.json",
      bytes: Buffer.from("x"),
      crypto,
    }),
    /length mismatch/,
  );
  const damaged = curriculum.slice();
  damaged[0] = 0;
  await assert.rejects(
    verifyPublicationResource({
      publication,
      path: "curriculum.json",
      bytes: damaged,
      crypto,
    }),
    /hash mismatch/,
  );
});
test("individually rehashed and resigned structural candidates are refused", async () => {
  for (const change of [
    (b: ManifestBody) => ({ ...b, unknown: true }),
    (b: ManifestBody) => ({
      ...b,
      curriculum: { ...b.curriculum, unknown: true },
    }),
    (b: ManifestBody) => ({ ...b, contentSchemaVersion: 99 }),
    (b: ManifestBody) => ({
      ...b,
      requiredEngineCapabilities: [...b.requiredEngineCapabilities, "unknown"],
    }),
    (b: ManifestBody) => ({
      ...b,
      requiredEngineCapabilities: [
        ...b.requiredEngineCapabilities,
        b.requiredEngineCapabilities[0],
      ],
    }),
    (b: ManifestBody) => ({ ...b, courseId: "" }),
    (b: ManifestBody) => ({ ...b, lessonIds: [] }),
    (b: ManifestBody) => ({ ...b, lessonIds: ["x", "x"] }),
    (b: ManifestBody) => ({
      ...b,
      lessonIds: Array.from({ length: 7 }, (_, i) => `l${i}`),
    }),
    (b: ManifestBody) => ({ ...b, sourceReviewManifestHash: "A".repeat(64) }),
    (b: ManifestBody) => ({
      ...b,
      assets: [{ ...b.curriculum, assetId: "duplicate-path" }],
    }),
    (b: ManifestBody) => ({
      ...b,
      curriculum: { ...b.curriculum, mediaType: "application/javascript" },
    }),
    (b: ManifestBody) => ({
      ...b,
      curriculum: { ...b.curriculum, byteLength: 0 },
    }),
    (b: ManifestBody) => ({
      ...b,
      curriculum: { ...b.curriculum, byteLength: 67108865 },
    }),
    (b: ManifestBody) => ({
      ...b,
      assets: [
        {
          ...b.curriculum,
          assetId: "oversize",
          path: "asset.json",
          byteLength: 16777217,
        },
      ],
    }),
    (b: ManifestBody) => ({
      ...b,
      compatibilityMappings: [
        { fromReleaseId: "old", fromLessonId: "a", toLessonId: "b" },
      ],
    }),
    (b: ManifestBody) => ({
      ...b,
      progressMappings: [
        { fromReleaseId: "old", fromLessonId: "a", toLessonId: "b" },
      ],
    }),
  ])
    await reject(change(body()), /Invalid|Unsupported|limit/);
  for (const path of [
    "/a",
    "../a",
    "a/../b",
    "a/./b",
    "a//b",
    "a/",
    "https://a/b",
    "a%2fb",
    "a\\b",
    "a?x",
    "a#x",
    "é",
    "a".repeat(1025),
  ])
    await reject(
      { ...body(), curriculum: { ...body().curriculum, path } },
      /Unsafe/,
    );
});
test("wrong envelope identity, trust key, signature, SPKI and encoding cannot cross verification", async () => {
  for (const extra of [
    { packageHash: "0".repeat(64) },
    { signingKeyId: "unknown" },
    { formatVersion: 2 },
    { unknown: true },
  ])
    await assert.rejects(
      verifyPublication({ raw: wire(body(), extra), keys, crypto }),
      /mismatch|Untrusted|Unsupported|schema/,
    );
  const value = JSON.parse(Buffer.from(wire()).toString());
  value.signature = "A".repeat(86);
  await assert.rejects(
    verifyPublication({ raw: Buffer.from(jcs(value)), keys, crypto }),
    /signature/,
  );
  for (const key of [
    new Uint8Array(44),
    fixtureKey.spki.slice(1),
    Uint8Array.from([...fixtureKey.spki, 0]),
  ])
    await assert.rejects(
      verifyPublication({
        raw: wire(),
        keys: [{ id: fixtureKey.id, spki: key }],
        crypto,
      }),
      /SPKI/,
    );
  await assert.rejects(
    verifyPublication({ raw: wire(), keys: [...keys, ...keys], crypto }),
    /Duplicate trusted/,
  );
  const malformed = JSON.parse(Buffer.from(wire()).toString());
  malformed.body.courseId = "\ud800";
  await assert.rejects(
    verifyPublication({ raw: Buffer.from(jcs(malformed)), keys, crypto }),
    /Unicode scalar/,
  );
});
test("resource count and declared byte budgets have exact boundaries without allocating the closure", async () => {
  const b = body();
  b.curriculum.byteLength = 67108864;
  b.assets = Array.from({ length: 4095 }, (_, i) => ({
    ...b.curriculum,
    assetId: `asset-${i}`,
    path: `a${i}.json`,
    byteLength: 1,
  }));
  assert.equal(
    (await verifyPublication({ raw: wire(b), keys, crypto })).envelope.body
      .assets.length,
    4095,
  );
  b.assets.push({
    ...b.curriculum,
    assetId: "overflow",
    path: "overflow.json",
    byteLength: 1,
  });
  await reject(b, /resource inventory/);
  const total = body();
  total.curriculum.byteLength = 67108864;
  total.assets = Array.from({ length: 28 }, (_, i) => ({
    ...total.curriculum,
    assetId: `asset-${i}`,
    path: `a${i}.json`,
    byteLength: 16777216,
  }));
  assert.equal(
    (await verifyPublication({ raw: wire(total), keys, crypto })).envelope.body
      .assets.length,
    28,
  );
  total.assets.push({
    ...total.curriculum,
    assetId: "one",
    path: "one.json",
    byteLength: 1,
  });
  await reject(total, /Closure byte limit/);
});
test("raw parser rejects excessive depth, text, invalid scalars, noncanonical numbers and byte overflow before crypto", () => {
  assert.throws(
    () =>
      parseCanonicalPublicationJson(
        Buffer.from("[".repeat(33) + "0" + "]".repeat(33)),
      ),
    /depth/,
  );
  assert.throws(
    () =>
      parseCanonicalPublicationJson(
        Buffer.from(JSON.stringify("x".repeat(16385))),
      ),
    /text limit/,
  );
  assert.throws(
    () =>
      parseCanonicalPublicationJson(
        new Uint8Array(publicationLimits.envelopeBytes + 1),
      ),
    /byte limit/,
  );
  for (const raw of ['{"a":1e999}', '{"a":"\\ud800"}', '{"\\udfff":1}'])
    assert.throws(
      () => parseCanonicalPublicationJson(Buffer.from(raw)),
      /number|Unicode/,
    );
  assert.deepEqual(
    publicationUtf8("a💚é"),
    Uint8Array.from([97, 240, 159, 146, 154, 195, 169]),
  );
  assert.throws(() => publicationUtf8("\udfff"), /Unicode/);
});

test("canonical parser accepts exact depth, string and aggregate-text boundaries", () => {
  assert.deepEqual(
    parseCanonicalPublicationJson(
      Buffer.from("[".repeat(32) + "0" + "]".repeat(32)),
    ),
    JSON.parse("[".repeat(32) + "0" + "]".repeat(32)),
  );
  assert.equal(
    parseCanonicalPublicationJson(
      Buffer.from(JSON.stringify("x".repeat(16384))),
    ),
    "x".repeat(16384),
  );
  const text = Array.from({ length: 48 }, () => "x".repeat(16384));
  assert.deepEqual(
    parseCanonicalPublicationJson(Buffer.from(JSON.stringify(text))),
    text,
  );
  text.push("x");
  assert.throws(
    () => parseCanonicalPublicationJson(Buffer.from(JSON.stringify(text))),
    /text limit/,
  );
  assert.throws(
    () => parseCanonicalPublicationJson(new Uint8Array(1048576)),
    SyntaxError,
  );
  assert.throws(
    () => parseCanonicalPublicationJson(new Uint8Array(1048577)),
    /Envelope byte limit/,
  );
});
test("safe path and individual declared resource limits accept their boundary values", async () => {
  const b = body();
  b.curriculum.path = "a".repeat(1024);
  b.curriculum.byteLength = 67108864;
  b.assets = [
    {
      ...b.curriculum,
      assetId: "image",
      path: "image.svg",
      mediaType: "image/svg+xml",
      byteLength: 16777216,
    },
  ];
  const result = await verifyPublication({ raw: wire(b), keys, crypto });
  assert.equal(result.envelope.body.curriculum.path.length, 1024);
  assert.equal(result.envelope.body.assets[0]?.byteLength, 16777216);
});
test("portable UTF8 preserves valid scalar edges and rejects every invalid UTF8 category", () => {
  for (const point of [
    0, 0x7f, 0x80, 0x7ff, 0x800, 0xd7ff, 0xe000, 0xffff, 0x10000, 0x10ffff,
  ]) {
    const text = String.fromCodePoint(point);
    assert.deepEqual(publicationUtf8(text), Uint8Array.from(Buffer.from(text)));
    const expected = { value: text };
    assert.deepEqual(
      parseCanonicalPublicationJson(Buffer.from(jcs(expected))),
      expected,
    );
  }
  for (const sequence of [
    "80",
    "c080",
    "e08080",
    "eda080",
    "f0808080",
    "f4908080",
    "f5808080",
    "ff",
    "e282",
    "c241",
  ]) {
    assert.throws(
      () =>
        parseCanonicalPublicationJson(
          Buffer.concat([
            Buffer.from('"'),
            Buffer.from(sequence, "hex"),
            Buffer.from('"'),
          ]),
        ),
      /UTF8/,
    );
  }
});

test("wire, schema and resource-policy refusals precede cryptographic use", async () => {
  const observations: { hashes: number; signatures: number } = {
    hashes: 0,
    signatures: 0,
  };
  const observed: PublicationCrypto = {
    sha256: async (input) => {
      observations.hashes++;
      return crypto.sha256(input);
    },
    verifyEd25519: async (input) => {
      observations.signatures++;
      return crypto.verifyEd25519(input);
    },
  };
  for (const negative of vectors.wireNegatives)
    await assert.rejects(
      verifyPublication({
        raw: bytes(negative.wireHex),
        keys,
        crypto: observed,
      }),
    );
  await assert.rejects(
    verifyPublication({
      raw: wire({ ...body(), requiredEngineCapabilities: ["untrusted"] }),
      keys,
      crypto: observed,
    }),
    /Unsupported/,
  );
  await assert.rejects(
    verifyPublication({
      raw: wire({
        ...body(),
        curriculum: { ...body().curriculum, path: "../escape" },
      }),
      keys,
      crypto: observed,
    }),
    /Unsafe/,
  );
  for (const negative of vectors.signatureEncodingNegatives) {
    const value = {
      formatVersion: 1,
      body: body(),
      packageHash: "a".repeat(64),
      signingKeyId: fixtureKey.id,
      signature: negative.encoded,
    };
    await assert.rejects(
      verifyPublication({
        raw: Buffer.from(jcs(value)),
        keys,
        crypto: observed,
      }),
      /signature encoding/,
    );
  }
  assert.deepEqual(observations, { hashes: 0, signatures: 0 });
  const result = await verifyPublication({
    raw: wire(),
    keys,
    crypto: observed,
  });
  assert.equal(result.envelope.body.courseId, "synthetic-course");
  assert.deepEqual(observations, { hashes: 1, signatures: 1 });
});

test("signed assets preserve stable identities distinct from file paths and curriculum", async () => {
  const b = body();
  const assetBytes = Buffer.from("neutral-image-bytes");
  const asset = {
    assetId: "stable-sound-board",
    path: "assets/board-v2.png",
    sha256: digest(assetBytes).toString("hex"),
    byteLength: assetBytes.length,
    mediaType: "image/png",
  } satisfies ManifestBody["assets"][number];
  b.assets = [asset];
  const publication = await verifyPublication({ raw: wire(b), keys, crypto });
  assert.deepEqual(publication.envelope.body.assets, [
    {
      assetId: "stable-sound-board",
      path: "assets/board-v2.png",
      sha256: digest(assetBytes).toString("hex"),
      byteLength: 19,
      mediaType: "image/png",
    },
  ]);
  assert.equal(
    Object.hasOwn(publication.envelope.body.curriculum, "assetId"),
    false,
  );
  assert.equal(Object.isFrozen(publication.envelope.body.assets[0]), true);
  assert.deepEqual(
    await verifyPublicationResource({
      publication,
      path: "assets/board-v2.png",
      bytes: assetBytes,
      crypto,
    }),
    asset,
  );
  const { assetId: omitted, ...missingIdentity } = asset;
  assert.equal(omitted, "stable-sound-board");
  await reject({ ...b, assets: [missingIdentity] }, /schema/);
  await reject({ ...b, assets: [{ ...asset, assetId: "" }] }, /identity/);
  await reject(
    { ...b, assets: [{ ...asset, assetId: "x".repeat(201) }] },
    /identity/,
  );
  await reject({ ...b, assets: [{ ...asset, assetId: 7 }] }, /schema/);
  await reject(
    { ...b, assets: [asset, { ...asset, path: "assets/another.png" }] },
    /Duplicate asset identities/,
  );
  await reject(
    { ...b, curriculum: { ...b.curriculum, assetId: "curriculum" } },
    /schema/,
  );
  const unicodeBoundary = {
    ...b,
    assets: [{ ...asset, assetId: "💚".repeat(200) }],
  };
  assert.equal(
    (await verifyPublication({ raw: wire(unicodeBoundary), keys, crypto }))
      .envelope.body.assets[0]?.assetId,
    "💚".repeat(200),
  );
  await reject(
    { ...b, assets: [{ ...asset, assetId: "💚".repeat(201) }] },
    /identity/,
  );
});
