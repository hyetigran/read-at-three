import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import {
  parseShellBridgeRequest,
  parseShellBridgeResponse,
  shellServiceWorkerPath,
  verifyShellDescriptor,
  shellDescriptorPath,
} from "../../packages/teaching/src/index.ts";
import { createPageShellBridge } from "../../apps/web/src/platform/shell-page-bridge.ts";
import { createWorkerShellBridge } from "../../apps/web/src/platform/shell-worker-bridge.ts";
import {
  shellFixturePolicy,
  shellFixtureCrypto,
  signedShellFixture,
} from "../content/fixtures/shell.ts";

test("private bridge messages reject roots, noncanonical epochs, wrong hashes and open fields", () => {
  const hash = "a".repeat(64);
  for (const raw of [
    { kind: "prepare", requestId: "neutral", keys: [] },
    { kind: "current", requestId: "neutral", epoch: "-1", hash },
    { kind: "current", requestId: "neutral", epoch: "0", hash: "bad" },
    { kind: "prepare", requestId: "" },
  ])
    assert.throws(() => parseShellBridgeRequest(raw));
  for (const raw of [
    { kind: "invalidated", epoch: "-1" },
    { kind: "prepared", requestId: "neutral", epoch: "0", hash: "bad" },
    {
      kind: "current",
      requestId: "neutral",
      epoch: "0",
      hash,
      current: true,
      permission: true,
    },
    {
      kind: "refused",
      requestId: "neutral",
      failure: { kind: "unavailable", reason: "invented" },
    },
  ])
    assert.throws(() => parseShellBridgeResponse(raw));
});

test("actual MessagePorts prepare before an identity-only barrier and fence processed controller changes", async () => {
  const origin = "https://reading.invalid";
  const shell = await verifyShellDescriptor({
    raw: signedShellFixture(),
    policy: shellFixturePolicy,
    crypto: shellFixtureCrypto,
  });
  let registry = 0,
    fetches = 0,
    handshakes = 0;
  const events = new EventTarget();
  const controller = {
    state: "activated",
    scriptURL: new URL("/" + shellServiceWorkerPath(shellFixturePolicy), origin)
      .href,
    postMessage(message: { requestId: string }, ports: MessagePort[]) {
      handshakes++;
      ports[0]?.postMessage({
        kind: "shell-result",
        requestId: message.requestId,
        applicationVersion: shellFixturePolicy.applicationVersion,
        result: { kind: "controlled-verified", hash: shell.hash },
      });
    },
  };
  let current: typeof controller | null = controller;
  const originals = new Map(
    ["navigator", "location", "fetch"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { origin },
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      serviceWorker: {
        get controller() {
          return current;
        },
        getRegistration: async () => {
          registry++;
          return { active: controller };
        },
        addEventListener: events.addEventListener.bind(events),
        removeEventListener: events.removeEventListener.bind(events),
      },
    },
  });
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: async (url: string) => {
      fetches++;
      assert.equal(url, new URL("/" + shellDescriptorPath, origin).href);
      const response = new Response(
        Uint8Array.from(signedShellFixture()).buffer,
      );
      Object.defineProperty(response, "url", { value: url });
      return response;
    },
  });
  const channel = new MessageChannel(),
    lifetime = new AbortController();
  const page = createPageShellBridge({
    port: channel.port1,
    policy: shellFixturePolicy,
    signal: lifetime.signal,
  });
  const worker = createWorkerShellBridge({
    port: channel.port2,
    signal: lifetime.signal,
  });
  try {
    const prepared = await worker.prepare();
    assert.equal(prepared.hash, shell.hash);
    assert.equal(prepared.isCurrent(), true);
    const afterPrepare = { registry, fetches, handshakes };
    assert.deepEqual(afterPrepare, { registry: 1, fetches: 1, handshakes: 1 });
    await prepared.current();
    assert.deepEqual(
      { registry, fetches, handshakes },
      afterPrepare,
      "Held barrier performs no handshake/cache/network work",
    );
    current = null;
    events.dispatchEvent(new Event("controllerchange"));
    for (let i = 0; i < 10 && prepared.isCurrent(); i++) await setImmediate();
    assert.equal(prepared.isCurrent(), false);
    await assert.rejects(prepared.current());
    assert.deepEqual({ registry, fetches, handshakes }, afterPrepare);
  } finally {
    lifetime.abort();
    page.close();
    worker.close();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});

test("connection retirement cancels a pending bridge request without a new controller grant", async () => {
  const channel = new MessageChannel(),
    lifetime = new AbortController();
  const worker = createWorkerShellBridge({
    port: channel.port2,
    signal: lifetime.signal,
  });
  const pending = worker.prepare();
  lifetime.abort();
  await assert.rejects(pending, /cancelled/);
  worker.close();
  channel.port1.close();
  await assert.rejects(worker.prepare(), /cancelled/);
});
