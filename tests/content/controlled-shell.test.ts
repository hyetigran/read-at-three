import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyControlledShell } from "../../apps/web/src/platform/controlled-shell.ts";
import { shellFixturePolicy } from "./fixtures/shell.ts";

test("already cancelled shell observation never reads the registry", async () => {
  let calls = 0;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      serviceWorker: {
        controller: null,
        getRegistration: async () => {
          calls++;
          return undefined;
        },
      },
    },
  });
  const c = new AbortController();
  c.abort();
  try {
    assert.deepEqual(
      await verifyControlledShell({
        policy: shellFixturePolicy,
        signal: c.signal,
      }),
      { kind: "unavailable", reason: "cancelled" },
    );
    assert.equal(calls, 0);
  } finally {
    Reflect.deleteProperty(globalThis, "navigator");
  }
});
test("registry rejection stays a typed unavailable observation", async () => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      serviceWorker: {
        controller: null,
        getRegistration: async () => {
          throw new Error("neutral registry unavailable");
        },
      },
    },
  });
  try {
    assert.deepEqual(
      await verifyControlledShell({
        policy: shellFixturePolicy,
        signal: new AbortController().signal,
      }),
      { kind: "unavailable", reason: "network" },
    );
  } finally {
    Reflect.deleteProperty(globalThis, "navigator");
  }
});
test("hung nonabortable registry observation is bounded without continuing after timeout", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let release: ((value: undefined) => void) | undefined;
  let reads = 0;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      serviceWorker: {
        get controller() {
          reads++;
          return null;
        },
        getRegistration: () =>
          new Promise<undefined>((resolve) => {
            release = resolve;
          }),
      },
    },
  });
  try {
    const pending = verifyControlledShell({
      policy: shellFixturePolicy,
      signal: new AbortController().signal,
    });
    await Promise.resolve();
    await Promise.resolve();
    t.mock.timers.tick(65000);
    assert.deepEqual(await pending, { kind: "unavailable", reason: "timeout" });
    release?.(undefined);
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(reads, 1);
  } finally {
    Reflect.deleteProperty(globalThis, "navigator");
    t.mock.timers.reset();
  }
});
test("cancelling a pending registry observation returns before platform IO completes", async () => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      serviceWorker: {
        controller: null,
        getRegistration: () => new Promise<undefined>(() => {}),
      },
    },
  });
  const c = new AbortController();
  try {
    const pending = verifyControlledShell({
      policy: shellFixturePolicy,
      signal: c.signal,
    });
    c.abort();
    assert.deepEqual(await pending, {
      kind: "unavailable",
      reason: "cancelled",
    });
  } finally {
    Reflect.deleteProperty(globalThis, "navigator");
  }
});
