import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createHash,
  generateKeyPairSync,
  sign,
  verify,
  createPublicKey,
} from "node:crypto";
import canonicalize from "canonicalize";
import {
  publishPublicationClosure,
  revalidatePublicationClosure,
  readPublicationResponse,
  publicationEnvelopePath,
  type PublicationCrypto,
  type PublicationResponse,
  type PublicationResourcePorts,
  type ManifestBody,
} from "../../packages/teaching/src/index.ts";

const pair = generateKeyPairSync("ed25519");
const keys = [
  {
    id: "neutral-resource-fixture",
    spki: Uint8Array.from(
      pair.publicKey.export({ format: "der", type: "spki" }),
    ),
  },
];
const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest();
const crypto: PublicationCrypto = {
  async sha256(bytes) {
    return digest(bytes);
  },
  async verifyEd25519(input) {
    return verify(
      null,
      input.message,
      createPublicKey({
        key: Buffer.from(input.spki),
        format: "der",
        type: "spki",
      }),
      input.signature,
    );
  },
};
const cancellation = { throwIfCancelled() {} };
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><g fill="#123456"><path d="M 1 1 L 10 10"/></g></svg>';
function encoded(value: unknown) {
  const text = canonicalize(value);
  if (text === undefined) throw new Error("Not JSON");
  return Buffer.from(text);
}
function fixture(
  asset: string | Uint8Array = svg,
  curriculumPath = "curriculum.json",
) {
  const files = new Map([
    [curriculumPath, Buffer.from('{"neutral":true}')],
    [
      "board.svg",
      typeof asset === "string" ? Buffer.from(asset) : Buffer.from(asset),
    ],
  ]);
  const curriculum = files.get(curriculumPath);
  const image = files.get("board.svg");
  assert.ok(curriculum && image);
  const body: ManifestBody = {
    courseId: "neutral",
    releaseId: "neutral-v1",
    contentSchemaVersion: 3,
    requiredEngineCapabilities: [
      "writing-practice-plan-v2",
      "guidance-runs-v2",
      "printed-board-cues-v2",
    ],
    lessonIds: ["neutral-lesson"],
    sourceReviewManifestHash: "a".repeat(64),
    compatibilityMappings: [],
    progressMappings: [],
    curriculum: {
      path: curriculumPath,
      byteLength: curriculum.length,
      sha256: digest(curriculum).toString("hex"),
      mediaType: "application/json",
    },
    assets: [
      {
        assetId: "neutral-board",
        path: "board.svg",
        byteLength: image.length,
        sha256: digest(image).toString("hex"),
        mediaType: "image/svg+xml",
      },
    ],
  };
  const unsigned = {
    formatVersion: 1,
    body,
    packageHash: digest(encoded(body)).toString("hex"),
    signingKeyId: keys[0]?.id,
  };
  const raw = encoded({
    ...unsigned,
    signature: sign(null, encoded(unsigned), pair.privateKey).toString(
      "base64url",
    ),
  });
  const cache = new Map<string, { bytes: Uint8Array; mediaType: string }>();
  let writes = 0;
  const ports: PublicationResourcePorts = {
    async exclusive({ run }) {
      return run({
        async paths() {
          return [...cache.keys()];
        },
        async read(path) {
          const entry = cache.get(path);
          return entry ? response(entry.bytes, entry.mediaType) : undefined;
        },
        async write(input) {
          writes++;
          cache.set(input.path, {
            bytes: Uint8Array.from(input.bytes),
            mediaType: input.mediaType,
          });
        },
      });
    },
    async download({ path }) {
      const bytes = files.get(path);
      assert.ok(bytes);
      return response(
        bytes,
        path === curriculumPath ? "application/json" : "image/svg+xml",
      );
    },
  };
  const input = {
    mode: "fixture",
    raw,
    keys,
    crypto,
    ports,
    cancellation,
  } satisfies Parameters<typeof publishPublicationClosure>[0];
  return { input, cache, files, writes: () => writes };
}
function response(
  bytes: Uint8Array,
  mediaType = "application/json",
  changes: Partial<PublicationResponse> = {},
): PublicationResponse {
  return {
    async cancel() {},
    status: 200,
    redirected: false,
    exactUrl: true,
    mediaType,
    contentLength: String(bytes.length),
    contentEncoding: null,
    chunks: {
      async *[Symbol.asyncIterator]() {
        yield bytes.slice(0, 2);
        yield bytes.slice(2);
      },
    },
    ...changes,
  };
}

test("publishes original bytes then independently revalidates complete retained namespace without writes", async () => {
  const f = fixture();
  const result = await publishPublicationClosure(f.input);
  assert.equal(result.kind, "verified-closure");
  assert.equal(result.mode, "fixture");
  assert.deepEqual(
    [...f.cache.keys()],
    [publicationEnvelopePath, "curriculum.json", "board.svg"],
  );
  assert.deepEqual(
    f.cache.get("board.svg")?.bytes,
    Uint8Array.from(Buffer.from(svg)),
  );
  assert.deepEqual(
    f.cache.get(publicationEnvelopePath)?.bytes,
    Uint8Array.from(f.input.raw),
  );
  const before = f.writes();
  assert.equal(
    (await revalidatePublicationClosure(f.input)).kind,
    "verified-closure",
  );
  assert.equal(f.writes(), before);
});

test("response rejects status, redirect, wrong location, media, false lengths and overflow before buffering all chunks", async () => {
  for (const changes of [
    { status: 206 },
    { redirected: true },
    { exactUrl: false },
    { mediaType: "text/html" },
    { mediaType: "application/json; charset=utf-8" },
    { contentLength: "2" },
    { contentLength: "03" },
  ]) {
    let reads = 0;
    const r = response(Buffer.from("abc"), "application/json", {
      ...changes,
      chunks: {
        async *[Symbol.asyncIterator]() {
          reads++;
          yield Buffer.from("abc");
        },
      },
    });
    await assert.rejects(
      readPublicationResponse({
        response: r,
        byteLength: 3,
        mediaType: "application/json",
        cancellation,
      }),
    );
    assert.equal(reads, 0);
  }
  let reads = 0,
    closed = false;
  const chunks = {
    async *[Symbol.asyncIterator]() {
      try {
        reads++;
        yield Buffer.from("abcd");
        reads++;
        yield Buffer.from("never");
      } finally {
        closed = true;
      }
    },
  };
  await assert.rejects(
    readPublicationResponse({
      response: response(Buffer.from("abc"), "application/json", { chunks }),
      byteLength: 3,
      mediaType: "application/json",
      cancellation,
    }),
    /response-length/,
  );
  assert.equal(reads, 1);
  assert.equal(closed, true);
  assert.deepEqual(
    await readPublicationResponse({
      response: response(Buffer.from("abc"), "application/json", {
        contentLength: null,
      }),
      byteLength: 3,
      mediaType: "application/json",
      cancellation,
    }),
    Uint8Array.from(Buffer.from("abc")),
  );
  await assert.rejects(
    readPublicationResponse({
      response: response(Buffer.from("ab"), "application/json", {
        contentLength: null,
      }),
      byteLength: 3,
      mediaType: "application/json",
      cancellation,
    }),
    /response-length/,
  );
});

test("cache missing, corrupt hashes, envelope substitution and extra paths never become verified", async () => {
  const f = fixture();
  await publishPublicationClosure(f.input);
  f.cache.delete("board.svg");
  assert.deepEqual(await revalidatePublicationClosure(f.input), {
    kind: "missing",
    path: "board.svg",
  });
  await publishPublicationClosure(f.input);
  const image = f.cache.get("board.svg");
  assert.ok(image);
  image.bytes[5] = 0;
  assert.match(
    JSON.stringify(await revalidatePublicationClosure(f.input)),
    /corrupt.*resource-integrity/,
  );
  await publishPublicationClosure(f.input);
  const envelope = f.cache.get(publicationEnvelopePath);
  assert.ok(envelope);
  envelope.bytes[0] = 0;
  assert.match(
    JSON.stringify(await revalidatePublicationClosure(f.input)),
    /corrupt.*envelope-integrity/,
  );
  await publishPublicationClosure(f.input);
  f.cache.set("unknown.js", {
    bytes: Buffer.from("x"),
    mediaType: "application/javascript",
  });
  assert.match(
    JSON.stringify(await revalidatePublicationClosure(f.input)),
    /corrupt.*namespace-integrity/,
  );
  const count = f.writes();
  await assert.rejects(
    publishPublicationClosure(f.input),
    /namespace-integrity/,
  );
  assert.equal(f.writes(), count);
});

test("signed malformed, executable, external and non-UTF8 SVG is refused without caching asset bytes", async () => {
  for (const value of [
    svg.replace('<g fill="#123456">', '<g fill="#123456" onclick="alert(1)">'),
    svg.replace("</svg>", "<script/></svg>"),
    svg.replace("</svg>", '<image href="https://example.com/x"/></svg>'),
    svg.replace("M 1 1 L 10 10", "M nope"),
    svg.slice(0, -6),
  ]) {
    const f = fixture(value);
    await assert.rejects(publishPublicationClosure(f.input), /svg-grammar/);
    assert.equal(f.cache.has("board.svg"), false);
    assert.equal(f.cache.has("curriculum.json"), true);
  }
  const reserved = fixture(svg, publicationEnvelopePath);
  await assert.rejects(
    publishPublicationClosure(reserved.input),
    /namespace-integrity/,
  );
  assert.equal(reserved.writes(), 0);
});

test("download failure, abort and failed reread preserve inactive partial bytes and never return success", async () => {
  const f = fixture();
  const original = f.input.ports.download;
  const ports: PublicationResourcePorts = {
    ...f.input.ports,
    async download(input) {
      if (input.path === "board.svg") throw new Error("connection lost");
      return original(input);
    },
  };
  await assert.rejects(
    publishPublicationClosure({ ...f.input, ports }),
    /download/,
  );
  assert.deepEqual(
    [...f.cache.keys()],
    [publicationEnvelopePath, "curriculum.json"],
  );
  assert.deepEqual(await revalidatePublicationClosure(f.input), {
    kind: "missing",
    path: "board.svg",
  });
  let checks = 0;
  await assert.rejects(
    publishPublicationClosure({
      ...f.input,
      cancellation: {
        throwIfCancelled() {
          if (++checks === 5) throw new Error("aborted");
        },
      },
    }),
    /cancelled/,
  );
  assert.equal(f.cache.has("board.svg"), false);
  const corruptPorts: PublicationResourcePorts = {
    ...f.input.ports,
    async exclusive({ run }) {
      return run({
        async paths() {
          return [publicationEnvelopePath, "curriculum.json", "board.svg"];
        },
        async read() {
          return response(Buffer.from("broken"));
        },
        async write() {},
      });
    },
  };
  await assert.rejects(
    publishPublicationClosure({ ...f.input, ports: corruptPorts }),
    /response-length/,
  );
});

test("compressed transport length is separate from exact decoded bytes and unsupported encodings fail closed", async () => {
  for (const contentEncoding of ["gzip", "br", "deflate"]) {
    const decoded = await readPublicationResponse({
      response: response(Buffer.from("abc"), "application/json", {
        contentEncoding,
        contentLength: "23",
      }),
      byteLength: 3,
      mediaType: "application/json",
      cancellation,
    });
    assert.deepEqual(decoded, Uint8Array.from([97, 98, 99]));
    await assert.rejects(
      readPublicationResponse({
        response: response(Buffer.from("abcd"), "application/json", {
          contentEncoding,
          contentLength: "23",
        }),
        byteLength: 3,
        mediaType: "application/json",
        cancellation,
      }),
      /response-length/,
    );
  }
  await assert.rejects(
    readPublicationResponse({
      response: response(Buffer.from("abc"), "application/json", {
        contentEncoding: "custom",
      }),
      byteLength: 3,
      mediaType: "application/json",
      cancellation,
    }),
    /response-metadata/,
  );
  await assert.rejects(
    readPublicationResponse({
      response: response(Buffer.from("abc"), "application/json", {
        contentEncoding: "gzip",
        contentLength: "67108865",
      }),
      byteLength: 3,
      mediaType: "application/json",
      cancellation,
    }),
    /length/,
  );
});

test("invalid UTF8 SVG, wrong decoded hash and namespace faults cannot publish a closure", async () => {
  const invalid = fixture(Uint8Array.from([255]));
  await assert.rejects(publishPublicationClosure(invalid.input), /svg-grammar/);
  assert.equal(invalid.cache.has("board.svg"), false);
  const f = fixture();
  const fetchResource = f.input.ports.download;
  await assert.rejects(
    publishPublicationClosure({
      ...f.input,
      ports: {
        ...f.input.ports,
        async download(input) {
          if (input.path === "board.svg")
            return response(
              new Uint8Array(Buffer.byteLength(svg)),
              "image/svg+xml",
            );
          return fetchResource(input);
        },
      },
    }),
    /resource-integrity/,
  );
  assert.equal(f.cache.has("board.svg"), false);
  let writes = 0;
  await assert.rejects(
    publishPublicationClosure({
      ...f.input,
      ports: {
        ...f.input.ports,
        async exclusive({ run }) {
          return run({
            async paths() {
              return [];
            },
            async read() {
              return undefined;
            },
            async write() {
              if (++writes === 2) throw new Error("quota exhausted");
            },
          });
        },
      },
    }),
    /cache-access/,
  );
  assert.equal(writes, 2);
  const result = await revalidatePublicationClosure({
    ...f.input,
    ports: {
      ...f.input.ports,
      async exclusive({ run }) {
        return run({
          async paths() {
            return [publicationEnvelopePath, publicationEnvelopePath];
          },
          async read() {
            throw new Error("unreachable");
          },
          async write() {
            throw new Error("unreachable");
          },
        });
      },
    },
  });
  assert.deepEqual(result, {
    kind: "corrupt",
    reason: "namespace-integrity",
  });
});

test("metadata refusal closes response and arbitrarily small stream chunks retain exact copied bytes", async () => {
  let cancelled = 0;
  await assert.rejects(
    readPublicationResponse({
      response: response(Buffer.from("abc"), "application/json", {
        status: 500,
        async cancel() {
          cancelled++;
        },
      }),
      byteLength: 3,
      mediaType: "application/json",
      cancellation,
    }),
  );
  assert.equal(cancelled, 1);
  const expected = Uint8Array.from(
    { length: 65538 },
    (_, index) => index % 251,
  );
  const streamed = response(expected, "application/json", {
    chunks: {
      async *[Symbol.asyncIterator]() {
        const one = new Uint8Array(1);
        for (const byte of expected) {
          one[0] = byte;
          yield one;
        }
      },
    },
  });
  assert.deepEqual(
    await readPublicationResponse({
      response: streamed,
      byteLength: expected.length,
      mediaType: "application/json",
      cancellation,
    }),
    expected,
  );
});

test("actual neutral preparation asset bytes pass unchanged through the signed resource closure", async () => {
  const { createFixturePreparationPackage } =
    await import("../../tools/content/preparation.ts");
  const preparation = await createFixturePreparationPackage();
  assert.equal(preparation.assets.length, 1);
  const asset = preparation.assets[0];
  assert.ok(asset);
  const f = fixture(asset.svg);
  const result = await publishPublicationClosure(f.input);
  assert.equal(result.kind, "verified-closure");
  assert.deepEqual(
    f.cache.get("board.svg")?.bytes,
    Uint8Array.from(Buffer.from(asset.svg)),
  );
  assert.equal(Buffer.byteLength(asset.svg), 178);
});

test("retained IO failures stay unavailable and never leak platform exception text", async () => {
  const f = fixture();
  await publishPublicationClosure(f.input);
  for (const operation of ["paths", "read"] as const) {
    const ports: PublicationResourcePorts = {
      ...f.input.ports,
      async exclusive({ run, ...identity }) {
        return f.input.ports.exclusive({
          ...identity,
          run(namespace) {
            return run({
              ...namespace,
              [operation]: async () => {
                throw new Error("secret personal platform detail");
              },
            });
          },
        });
      },
    };
    assert.deepEqual(
      await revalidatePublicationClosure({ ...f.input, ports }),
      {
        kind: "unavailable",
        reason: "cache-access",
      },
    );
  }
  const streamed: PublicationResourcePorts = {
    ...f.input.ports,
    async exclusive({ run, ...identity }) {
      return f.input.ports.exclusive({
        ...identity,
        async run(namespace) {
          return run({
            ...namespace,
            async read(path) {
              const value = await namespace.read(path);
              return (
                value && {
                  ...value,
                  chunks: {
                    async *[Symbol.asyncIterator]() {
                      throw new Error("secret stream detail");
                    },
                  },
                }
              );
            },
          });
        },
      });
    },
  };
  assert.deepEqual(
    await revalidatePublicationClosure({ ...f.input, ports: streamed }),
    {
      kind: "unavailable",
      reason: "stream",
    },
  );
  assert.deepEqual(
    await revalidatePublicationClosure({
      ...f.input,
      crypto: {
        ...crypto,
        async sha256() {
          throw new Error("secret crypto platform detail");
        },
      },
    }),
    { kind: "unavailable", reason: "crypto" },
  );
  assert.deepEqual(
    await revalidatePublicationClosure({
      ...f.input,
      crypto: {
        ...crypto,
        async verifyEd25519() {
          return false;
        },
      },
    }),
    { kind: "corrupt", reason: "envelope-integrity" },
  );
  assert.deepEqual(
    await revalidatePublicationClosure({
      ...f.input,
      cancellation: {
        throwIfCancelled() {
          throw new Error("secret cancellation detail");
        },
      },
    }),
    { kind: "unavailable", reason: "cancelled" },
  );
});

test("publication reread cache loss remains missing rather than corrupt", async () => {
  const f = fixture();
  await assert.rejects(
    publishPublicationClosure({
      ...f.input,
      ports: {
        ...f.input.ports,
        async exclusive({ run, ...identity }) {
          return f.input.ports.exclusive({
            ...identity,
            run(namespace) {
              return run({
                ...namespace,
                async read(path) {
                  return path === "board.svg"
                    ? undefined
                    : namespace.read(path);
                },
              });
            },
          });
        },
      },
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error && "failure" in error);
      assert.deepEqual(error.failure, { kind: "missing", path: "board.svg" });
      assert.equal(error.message, "missing");
      return true;
    },
  );
});

test("bounded publication response preserves exact lengths, metadata, decoded limits and cancellation", async () => {
  const cases = [
    {
      mode: "maximum",
      bytes: [1, 2, 3],
      length: null,
      encoding: null,
      limit: 3,
      ok: true,
    },
    {
      mode: "maximum",
      bytes: [1, 2],
      length: null,
      encoding: null,
      limit: 3,
      ok: true,
    },
    {
      mode: "maximum",
      bytes: [1, 2, 3],
      length: "2",
      encoding: "gzip",
      limit: 3,
      ok: true,
    },
    {
      mode: "maximum",
      bytes: [],
      length: null,
      encoding: null,
      limit: 3,
      ok: false,
    },
    {
      mode: "maximum",
      bytes: [1, 2, 3, 4],
      length: null,
      encoding: null,
      limit: 3,
      ok: false,
    },
    {
      mode: "maximum",
      bytes: [1, 2, 3],
      length: "4",
      encoding: null,
      limit: 3,
      ok: false,
    },
    {
      mode: "maximum",
      bytes: [1, 2],
      length: "3",
      encoding: null,
      limit: 3,
      ok: false,
    },
    {
      mode: "maximum",
      bytes: [1, 2, 3],
      length: "03",
      encoding: null,
      limit: 3,
      ok: false,
    },
    {
      mode: "maximum",
      bytes: [1, 2, 3],
      length: null,
      encoding: "unknown",
      limit: 3,
      ok: false,
    },
    {
      mode: "maximum",
      bytes: [1, 2, 3],
      length: null,
      encoding: null,
      limit: 3,
      status: 404,
      ok: false,
    },
    {
      mode: "maximum",
      bytes: [1, 2, 3],
      length: null,
      encoding: null,
      limit: 3,
      cancelled: true,
      ok: false,
    },
    {
      mode: "exact",
      bytes: [1, 2, 3],
      length: null,
      encoding: null,
      limit: 3,
      ok: true,
    },
    {
      mode: "exact",
      bytes: [1, 2, 3],
      length: "2",
      encoding: "gzip",
      limit: 3,
      ok: true,
    },
    {
      mode: "exact",
      bytes: [1, 2],
      length: null,
      encoding: null,
      limit: 3,
      ok: false,
    },
    {
      mode: "exact",
      bytes: [1, 2, 3, 4],
      length: null,
      encoding: null,
      limit: 3,
      ok: false,
    },
    {
      mode: "exact",
      bytes: [1, 2, 3],
      length: "2",
      encoding: null,
      limit: 3,
      ok: false,
    },
  ];
  for (const item of cases) {
    let cancellations = 0;
    const response: PublicationResponse = {
      status: item.status ?? 200,
      redirected: false,
      exactUrl: true,
      mediaType: "application/json",
      contentLength: item.length,
      contentEncoding: item.encoding,
      chunks: (async function* () {
        for (const value of item.bytes) yield new Uint8Array([value]);
      })(),
      cancel: async () => {
        cancellations++;
      },
    };
    const input = {
      response,
      mediaType: "application/json",
      cancellation: {
        throwIfCancelled() {
          if (item.cancelled) throw Error("Retired response");
        },
      },
    };
    const read = readPublicationResponse(
      item.mode === "exact"
        ? { ...input, byteLength: item.limit }
        : { ...input, maximumByteLength: item.limit },
    );
    if (item.ok) assert.deepEqual(await read, new Uint8Array(item.bytes));
    else await assert.rejects(read);
    assert.equal(cancellations, 1, JSON.stringify(item));
  }
});
