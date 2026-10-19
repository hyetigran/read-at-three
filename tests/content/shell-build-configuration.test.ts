import assert from "node:assert/strict";
import { generateKeyPairSync, sign, createHash } from "node:crypto";
import { test } from "node:test";
import { parseShellBuildConfiguration } from "../../tools/shell/build.ts";
import { serveInstalledPublication } from "../../apps/web/src/platform/shell-cache.ts";
import {
  canonical,
  publicationEnvelopePath,
  verifyShellDescriptor,
  verifyPublication,
} from "../../packages/teaching/src/index.ts";
import {
  shellFixturePolicy,
  shellFixtureCrypto,
  signedShellFixture,
} from "./fixtures/shell.ts";

const pair = generateKeyPairSync("ed25519");
const publicationKey = {
  id: "neutral-publication-only",
  spkiHex: pair.publicKey
    .export({ format: "der", type: "spki" })
    .toString("hex"),
};
function input() {
  return {
    mode: "fixture",
    applicationVersion: "neutral-v1",
    signingKeyId: "engineering-fixture-only",
    privateKeyPath: "unused-fixture.pem",
    keys: shellFixturePolicy.keys.map((key) => ({
      id: key.id,
      spkiHex: Buffer.from(key.spki).toString("hex"),
    })),
    installation: {
      courseId: "neutral-course",
      publicationKeys: [publicationKey],
    },
    publicationApprovals: [],
  };
}

test("signed configuration derives separate shell and content roots without an implicit offer", async () => {
  const { browser } = parseShellBuildConfiguration(input());
  assert.equal(browser.kind, "installed");
  assert.equal(browser.courseId, "neutral-course");
  assert.equal(browser.initialTarget, null);
  assert.notDeepEqual(browser.shell.keys, browser.publication.keys);
  await verifyShellDescriptor({
    raw: signedShellFixture(),
    policy: browser.shell,
    crypto: shellFixtureCrypto,
  });
  await assert.rejects(
    verifyShellDescriptor({
      raw: signedShellFixture(),
      policy: { ...browser.shell, keys: browser.publication.keys },
      crypto: shellFixtureCrypto,
    }),
  );
});

test("signed configuration refuses missing, malformed, duplicate and ambient trust inputs", () => {
  const valid = input();
  const { installation, ...withoutInstallation } = valid;
  for (const value of [
    withoutInstallation,
    { ...valid, kind: "development" },
    { ...valid, installation: { ...installation, publicationKeys: [] } },
    {
      ...valid,
      installation: {
        ...installation,
        publicationKeys: [publicationKey, publicationKey],
      },
    },
    {
      ...valid,
      installation: {
        ...installation,
        publicationKeys: [{ ...publicationKey, spkiHex: "0".repeat(88) }],
      },
    },
    { ...valid, installation: { ...installation, courseId: "" } },
    { ...valid, installation: { ...installation, mode: "publication" } },
    {
      ...valid,
      installation: {
        ...installation,
        initialTarget: { publicationHash: "bad", releaseId: "neutral-release" },
      },
    },
    {
      ...valid,
      installation: {
        ...installation,
        initialTarget: { publicationHash: "a".repeat(64), releaseId: "" },
      },
    },
  ])
    assert.throws(() => parseShellBuildConfiguration(value));
  const withTarget = parseShellBuildConfiguration({
    ...valid,
    installation: {
      ...installation,
      initialTarget: {
        publicationHash: "a".repeat(64),
        releaseId: "neutral-release",
      },
    },
  });
  assert.deepEqual(withTarget.browser.initialTarget, {
    publicationHash: "a".repeat(64),
    releaseId: "neutral-release",
  });
});

test("actual installed content serving uses publication roots and refuses crossed roots or mode", async () => {
  const { browser } = parseShellBuildConfiguration(input());
  const curriculum = Buffer.from('{"neutral":true}');
  const digest = (bytes: Uint8Array) =>
    createHash("sha256").update(bytes).digest("hex");
  const body = {
    courseId: "neutral-course",
    releaseId: "neutral-release",
    contentSchemaVersion: 3,
    requiredEngineCapabilities: [
      "writing-practice-plan-v2",
      "guidance-runs-v2",
      "printed-board-cues-v2",
    ],
    lessonIds: ["neutral-lesson"],
    curriculum: {
      path: "curriculum.json",
      sha256: digest(curriculum),
      byteLength: curriculum.length,
      mediaType: "application/json",
    },
    assets: [],
    sourceReviewManifestHash: "a".repeat(64),
    compatibilityMappings: [],
    progressMappings: [],
  };
  const unsigned = {
    formatVersion: 1,
    body,
    packageHash: digest(Buffer.from(canonical(body))),
    signingKeyId: publicationKey.id,
  };
  const envelope = Buffer.from(
    canonical({
      ...unsigned,
      signature: sign(
        null,
        Buffer.from(canonical(unsigned)),
        pair.privateKey,
      ).toString("base64url"),
    }),
  );
  await verifyPublication({
    raw: envelope,
    keys: browser.publication.keys,
    crypto: shellFixtureCrypto,
  });
  const prefix = `https://reading.invalid/_reading/content/fixture/${unsigned.packageHash}/`;
  const files = new Map([
    [prefix + publicationEnvelopePath, envelope],
    [prefix + "curriculum.json", curriculum],
  ]);
  const originalCaches = Object.getOwnPropertyDescriptor(globalThis, "caches");
  const originalNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator",
  );
  const namespace = `reading-content-v1-fixture-${unsigned.packageHash}`;
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: {
      has: async (name: string) => name === namespace,
      open: async () => ({
        keys: async () => [...files.keys()].map((url) => new Request(url)),
        match: async (url: string) => {
          const bytes = files.get(url);
          return bytes
            ? new Response(bytes, {
                headers: {
                  "Content-Type": "application/json",
                  "Content-Length": String(bytes.length),
                },
              })
            : undefined;
        },
      }),
    },
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      locks: {
        request: async (
          _name: string,
          _options: unknown,
          run: () => Promise<unknown>,
        ) => run(),
      },
    },
  });
  try {
    const request = new Request(prefix + "curriculum.json");
    const signal = new AbortController().signal;
    const served = await serveInstalledPublication({
      publicationPolicy: browser.publication,
      request,
      signal,
    });
    assert.equal(served.status, 200);
    assert.equal(await served.text(), curriculum.toString());
    const crossed = await serveInstalledPublication({
      publicationPolicy: { ...browser.publication, keys: browser.shell.keys },
      request,
      signal,
    });
    assert.equal(crossed.status, 503);
    const wrongMode = await serveInstalledPublication({
      publicationPolicy: { ...browser.publication, mode: "publication" },
      request,
      signal,
    });
    assert.equal(wrongMode.status, 404);
  } finally {
    if (originalCaches)
      Object.defineProperty(globalThis, "caches", originalCaches);
    else Reflect.deleteProperty(globalThis, "caches");
    if (originalNavigator)
      Object.defineProperty(globalThis, "navigator", originalNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});

test("owned shell verification holds one exact lock through callback and refuses lost or corrupt bytes", async () => {
  const { createShellCache, shellCacheName } =
    await import("../../apps/web/src/platform/shell-cache.ts");
  const { shellFixtureFiles } = await import("./fixtures/shell.ts");
  const { shellDescriptorPath, shellResourceMedia } =
    await import("../../packages/teaching/src/index.ts");
  const shell = await verifyShellDescriptor({
    raw: signedShellFixture(),
    policy: shellFixturePolicy,
    crypto: shellFixtureCrypto,
  });
  const name = shellCacheName(shell),
    origin = "https://reading.invalid";
  const files = new Map(
    [...shellFixtureFiles].map(([path, bytes]) => [
      new URL("/" + path, origin).href,
      bytes,
    ]),
  );
  files.set(
    new URL("/" + shellDescriptorPath, origin).href,
    Buffer.from(signedShellFixture()),
  );
  const oldCaches = Object.getOwnPropertyDescriptor(globalThis, "caches"),
    oldNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  let depth = 0,
    present = true,
    opens = 0,
    callbacks = 0;
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: {
      keys: async () => (present ? [name] : []),
      has: async (requested: string) => requested === name && present,
      open: async (requested: string) => {
        assert.equal(requested, name);
        assert.equal(depth, 1);
        opens++;
        return {
          keys: async () => [...files.keys()].map((url) => new Request(url)),
          match: async (url: string) => {
            assert.equal(depth, 1);
            const bytes = files.get(url);
            return bytes
              ? new Response(bytes, {
                  headers: {
                    "Content-Type": shellResourceMedia(
                      new URL(url).pathname.slice(1),
                    ),
                    "Content-Length": String(bytes.length),
                  },
                })
              : undefined;
          },
        };
      },
    },
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      locks: {
        request: async (
          requested: string,
          _options: unknown,
          run: () => Promise<unknown>,
        ) => {
          assert.equal(requested, name);
          assert.equal(depth, 0, "Non-reentrant shell scope");
          depth++;
          try {
            return await run();
          } finally {
            depth--;
          }
        },
      },
    },
  });
  try {
    const cache = createShellCache(shellFixturePolicy, origin),
      signal = new AbortController().signal;
    const result = await cache.withVerified({
      hash: shell.hash,
      signal,
      run: async (current) => {
        assert.equal(depth, 1);
        assert.equal(current.hash, shell.hash);
        callbacks++;
        await Promise.resolve();
        assert.equal(depth, 1);
        return "owned-result";
      },
    });
    assert.equal(result, "owned-result");
    assert.equal(depth, 0);
    assert.equal(callbacks, 1);
    await assert.rejects(
      cache.withVerified({
        hash: shell.hash,
        signal,
        run: async () => {
          throw Error("consumer failure");
        },
      }),
      /consumer failure/,
    );
    assert.equal(depth, 0);
    files.set(
      new URL("/assets/database.wasm", origin).href,
      Buffer.from([0, 97, 115, 109, 2, 0, 0, 0]),
    );
    await assert.rejects(
      cache.withVerified({
        hash: shell.hash,
        signal,
        run: async () => {
          callbacks++;
        },
      }),
    );
    assert.equal(callbacks, 1);
    assert.equal(depth, 0);
    const beforeOpens = opens;
    present = false;
    await assert.rejects(
      cache.withVerified({
        hash: shell.hash,
        signal,
        run: async () => {
          callbacks++;
        },
      }),
    );
    assert.equal(opens, beforeOpens, "Lost namespace must not be created");
    assert.equal(callbacks, 1);
    assert.equal(depth, 0);
  } finally {
    if (oldCaches) Object.defineProperty(globalThis, "caches", oldCaches);
    else Reflect.deleteProperty(globalThis, "caches");
    if (oldNavigator)
      Object.defineProperty(globalThis, "navigator", oldNavigator);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});
