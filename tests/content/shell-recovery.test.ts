import assert from "node:assert/strict";
import { test } from "node:test";
import { ShellError, verifyShellDescriptor } from "@readatthree/teaching";
import { createShellRecovery } from "../../apps/web/src/platform/shell-recovery.ts";
import { shellResponsePolicy } from "../../apps/web/src/platform/shell-response-policy.ts";
import type { ShellNavigationRequest } from "../../apps/web/src/platform/shell-request.ts";
import {
  signedShellFixture,
  shellFixtureBody,
  shellFixtureCrypto,
  shellFixturePolicy,
} from "./fixtures/shell.ts";
const origin = "https://reading.invalid";
const signal = () => new AbortController().signal;
function request(
  path = "/",
  changes: Partial<ShellNavigationRequest> = {},
): ShellNavigationRequest {
  return {
    url: new URL(path, origin).href,
    method: "GET",
    mode: "navigate",
    destination: "document",
    ...changes,
  };
}
async function link(response: Response): Promise<string> {
  const match = /href="(\/_reading\/repair-shell\/[a-f0-9]{64})"/.exec(
    await response.text(),
  );
  assert.ok(match?.[1]);
  return match[1];
}
async function fixture(
  options: {
    now?: () => number;
    install?: () => Promise<void>;
    current?: () => Promise<void>;
  } = {},
) {
  const verified = await verifyShellDescriptor({
    raw: signedShellFixture(),
    policy: shellFixturePolicy,
    crypto: shellFixtureCrypto,
  });
  let installs = 0,
    checks = 0;
  const owner = createShellRecovery({
    origin,
    ...(options.now ? { now: options.now } : {}),
    shell: {
      async install() {
        installs++;
        await options.install?.();
        return verified;
      },
      async current() {
        checks++;
        await options.current?.();
        return verified;
      },
    },
  });
  return { owner, count: () => ({ installs, checks }) };
}
test("recovery admission denies every non-document/foreign/open path with zero mint and zero install", async (t) => {
  const f = await fixture();
  const random = t.mock.method(crypto, "getRandomValues");
  const negatives = [
    request("/", { destination: "" }),
    request("/", { destination: "iframe" }),
    request("/", { destination: "worker" }),
    request("/", { mode: "cors" }),
    request("/", { method: "POST" }),
    request("/?x=1"),
    request("/arbitrary"),
    request("https://foreign.invalid/"),
    request("/_reading/repair-shell"),
    request("/_reading/repair-shell/"),
    request("/_reading/repair-shell/bad"),
    request("/_reading/repair-shell/" + "a".repeat(64) + "?x=1"),
    request("/_reading/repair-shell/" + "A".repeat(64)),
    request("/_reading/repair-shell/%61" + "a".repeat(63)),
    request("/_reading/repair-shell/" + "a".repeat(64), {
      destination: "iframe",
    }),
  ];
  for (const value of negatives) {
    const denied = f.owner.unavailable(
      value,
      new ShellError({ kind: "missing", path: "index.html" }),
    );
    assert.equal(denied.status, 503);
    assert.doesNotMatch(await denied.text(), /href=/);
    const handled = await f.owner.handle(value, signal());
    if (handled) assert.doesNotMatch(await handled.text(), /href=/);
    assert.equal(random.mock.callCount(), 0);
    assert.deepEqual(f.count(), { installs: 0, checks: 0 });
  }
});
test("readable failure has strict CSP, highlighted copy, private 256-bit link and no acquisition", async () => {
  const f = await fixture();
  const response = f.owner.unavailable(
    request("/parent/nested"),
    new ShellError({ kind: "missing", path: '<script>alert("bad")</script>' }),
  );
  assert.equal(
    response.headers.get("Content-Security-Policy"),
    shellResponsePolicy["Content-Security-Policy"],
  );
  assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const html = await response.text();
  assert.match(html, /<h1><mark>/);
  assert.match(html, /rel="noreferrer"/);
  assert.match(html, /repair-shell\/[a-f0-9]{64}/);
  assert.doesNotMatch(html, /<script|<form|http-equiv|preload|<img|alert\(/);
  assert.deepEqual(f.count(), { installs: 0, checks: 0 });
});
test("capability consumes once before awaiting and verifies current after installer completes", async () => {
  const order: string[] = [];
  const f = await fixture({
    install: async () => {
      order.push("install");
    },
    current: async () => {
      order.push("current");
    },
  });
  const url = await link(f.owner.unavailable(request(), Error()));
  const result = await f.owner.handle(request(url), signal());
  assert.equal(result?.status, 200);
  assert.deepEqual(order, ["install", "current"]);
  assert.deepEqual(f.count(), { installs: 1, checks: 1 });
  assert.match(await result.text(), /Return to app/);
  const replay = await f.owner.handle(request(url), signal());
  assert.equal(replay?.headers.get("X-Reading-Shell"), "expired");
  await link(replay);
  assert.deepEqual(f.count(), { installs: 1, checks: 1 });
});
test("expiry, oldest-entry eviction and worker restart lose authority without downloads", async () => {
  let time = 0;
  const f = await fixture({ now: () => time });
  const expired = await link(f.owner.unavailable(request(), Error()));
  time = 120000;
  const lost = await f.owner.handle(request(expired), signal());
  assert.equal(lost?.headers.get("X-Reading-Shell"), "expired");
  const first = await link(f.owner.unavailable(request(), Error()));
  let newest = first;
  for (let i = 0; i < 64; i++)
    newest = await link(f.owner.unavailable(request(), Error()));
  const evicted = await f.owner.handle(request(first), signal());
  assert.equal(evicted?.headers.get("X-Reading-Shell"), "expired");
  const restarted = await fixture();
  const absent = await restarted.owner.handle(request(newest), signal());
  assert.equal(absent?.headers.get("X-Reading-Shell"), "expired");
  assert.deepEqual(f.count(), { installs: 0, checks: 0 });
  assert.deepEqual(restarted.count(), { installs: 0, checks: 0 });
});
test("one active attempt consumes a competing capability without a second install and clears finally", async () => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let first = true;
  const f = await fixture({
    install: async () => {
      if (first) {
        first = false;
        await held;
        throw Error("offline");
      }
    },
  });
  const a = await link(f.owner.unavailable(request(), Error()));
  const b = await link(f.owner.unavailable(request(), Error()));
  const running = f.owner.handle(request(a), signal());
  const busy = await f.owner.handle(request(b), signal());
  assert.equal(busy?.headers.get("X-Reading-Shell"), "busy");
  const next = await link(busy);
  assert.deepEqual(f.count(), { installs: 1, checks: 0 });
  release();
  assert.equal((await running)?.status, 503);
  assert.equal((await f.owner.handle(request(next), signal()))?.status, 200);
  assert.deepEqual(f.count(), { installs: 2, checks: 1 });
});
test("failed full current verification and cancellation never claim repaired", async () => {
  const f = await fixture({
    current: async () => {
      throw new ShellError({ kind: "corrupt", reason: "inventory" });
    },
  });
  const url = await link(f.owner.unavailable(request(), Error()));
  const denied = await f.owner.handle(request(url), signal());
  assert.equal(denied?.status, 503);
  assert.equal(denied?.headers.get("X-Reading-Shell"), "corrupt");
  const cancelled = new AbortController();
  cancelled.abort();
  const next = await link(denied);
  assert.equal(
    (await f.owner.handle(request(next), cancelled.signal))?.status,
    503,
  );
  assert.deepEqual(f.count(), { installs: 1, checks: 1 });
});
test("signed inventory cannot collide with recovery namespace", async () => {
  for (const path of [
    "_reading/repair-shell",
    "_reading/repair-shell/" + "a".repeat(64) + ".js",
  ]) {
    const body = shellFixtureBody();
    const first = body.resources[0];
    assert.ok(first);
    await assert.rejects(
      verifyShellDescriptor({
        raw: signedShellFixture({
          ...body,
          resources: [{ ...first, path }, ...body.resources.slice(1)],
        }),
        policy: shellFixturePolicy,
        crypto: shellFixtureCrypto,
      }),
      ShellError,
    );
  }
});

test("authenticated installer removes only exact-cache extras after all bytes authenticate and releases before current", async (t) => {
  const { createShellCache, shellCacheName } =
    await import("../../apps/web/src/platform/shell-cache.ts");
  const { shellFixtureFiles } = await import("./fixtures/shell.ts");
  const { shellDescriptorPath, shellResourceMedia } =
    await import("@readatthree/teaching");
  const verified = await verifyShellDescriptor({
    raw: signedShellFixture(),
    policy: shellFixturePolicy,
    crypto: shellFixtureCrypto,
  });
  const name = shellCacheName(verified),
    extra = origin + "/assets/undeclared.js",
    other = "unrelated-personal-cache";
  const stored = new Map<string, Response>([
    [extra, new Response("do not execute")],
  ]);
  let depth = 0,
    deletions = 0,
    corrupt = true,
    deleteFails = false;
  const restore = ["navigator", "caches"].map((key) => ({
    key,
    descriptor: Object.getOwnPropertyDescriptor(globalThis, key),
  }));
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      locks: {
        request: async (
          key: string,
          _options: unknown,
          run: () => Promise<unknown>,
        ) => {
          assert.equal(key, name);
          assert.equal(depth, 0);
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
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: {
      keys: async () => [name, other],
      has: async (key: string) => key === name,
      open: async (key: string) => {
        assert.equal(key, name);
        assert.equal(depth, 1);
        return {
          keys: async () => [...stored.keys()].map((url) => new Request(url)),
          match: async (url: string) => stored.get(url)?.clone(),
          put: async (url: string, response: Response) => {
            assert.equal(depth, 1);
            stored.set(url, response.clone());
          },
          delete: async (req: Request) => {
            assert.equal(depth, 1);
            assert.equal(req.url, extra);
            deletions++;
            return deleteFails ? false : stored.delete(req.url);
          },
        };
      },
    },
  });
  t.mock.method(globalThis, "fetch", async (value: string | URL | Request) => {
    const url = String(value);
    const path = new URL(url).pathname.slice(1);
    const bytes =
      path === shellDescriptorPath
        ? signedShellFixture()
        : shellFixtureFiles.get(path);
    assert.ok(bytes);
    const response = new Response(
      corrupt && path === "assets/database.wasm"
        ? new Uint8Array([1])
        : Uint8Array.from(bytes),
      {
        headers: {
          "Content-Type": shellResourceMedia(path),
          "Content-Length": String(bytes.length),
        },
      },
    );
    Object.defineProperty(response, "url", { value: url });
    return response;
  });
  try {
    const cache = createShellCache(shellFixturePolicy, origin);
    await assert.rejects(cache.install(signal()));
    assert.equal(deletions, 0);
    assert.ok(stored.has(extra));
    assert.equal(depth, 0);
    corrupt = false;
    deleteFails = true;
    await assert.rejects(cache.install(signal()));
    assert.ok(stored.has(extra));
    assert.equal(depth, 0);
    deleteFails = false;
    const installed = await cache.install(signal());
    assert.equal(depth, 0);
    assert.equal(installed.hash, verified.hash);
    assert.equal(stored.has(extra), false);
    const current = await cache.current(signal());
    assert.equal(current.hash, installed.hash);
    assert.equal(depth, 0);
    assert.deepEqual(
      [...stored.keys()].sort(),
      [shellDescriptorPath, ...shellFixtureFiles.keys()]
        .map((path) => origin + "/" + path)
        .sort(),
    );
  } finally {
    for (const item of restore) {
      if (item.descriptor)
        Object.defineProperty(globalThis, item.key, item.descriptor);
      else Reflect.deleteProperty(globalThis, item.key);
    }
  }
});

test("same token replay while original installer is held starts no second attempt", async () => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const f = await fixture({ install: () => held });
  const url = await link(f.owner.unavailable(request(), Error()));
  const original = f.owner.handle(request(url), signal());
  const replay = await f.owner.handle(request(url), signal());
  assert.equal(replay?.headers.get("X-Reading-Shell"), "expired");
  assert.deepEqual(f.count(), { installs: 1, checks: 0 });
  release();
  assert.equal((await original)?.status, 200);
  assert.deepEqual(f.count(), { installs: 1, checks: 1 });
});

test("a different independently authenticated current shell cannot satisfy repair success", async () => {
  const first = await verifyShellDescriptor({
    raw: signedShellFixture(),
    policy: shellFixturePolicy,
    crypto: shellFixtureCrypto,
  });
  const body = shellFixtureBody();
  const second = await verifyShellDescriptor({
    raw: signedShellFixture({
      ...body,
      navigation: {
        ...body.navigation,
        byteLength: body.navigation.byteLength + 1,
      },
    }),
    policy: shellFixturePolicy,
    crypto: shellFixtureCrypto,
  });
  assert.notEqual(first.hash, second.hash);
  const calls: string[] = [];
  const owner = createShellRecovery({
    origin,
    shell: {
      async install() {
        calls.push("install");
        return first;
      },
      async current() {
        calls.push("current");
        return second;
      },
    },
  });
  const url = await link(owner.unavailable(request(), Error()));
  const result = await owner.handle(request(url), signal());
  assert.equal(result?.status, 503);
  assert.equal(result?.headers.get("X-Reading-Shell"), "corrupt");
  assert.doesNotMatch(
    await result.text(),
    /App files repaired\.|Return to app/,
  );
  assert.deepEqual(calls, ["install", "current"]);
});
