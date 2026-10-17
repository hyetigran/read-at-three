import assert from "node:assert/strict";
import test from "node:test";
import {
  parseRequest,
  parseResponse,
} from "../../apps/web/src/platform/protocol.ts";
import { readOriginStorageEstimate } from "../../apps/web/src/platform/storage-estimate.ts";

test("Worker support requests and responses admit only finite local diagnostics and typed version capabilities", () => {
  const event = {
    category: "timing",
    operation: "administration",
    count: 2,
    durationMs: 10,
  };
  assert.deepEqual(
    parseRequest({ id: "support-1", kind: "recordDiagnostic", event }),
    { id: "support-1", kind: "recordDiagnostic", event },
  );
  assert.deepEqual(parseRequest({ id: "support-2", kind: "readDiagnostics" }), {
    id: "support-2",
    kind: "readDiagnostics",
  });
  for (const privateField of [
    "profileId",
    "displayName",
    "message",
    "content",
    "strokes",
    "passphrase",
  ]) {
    assert.throws(() =>
      parseRequest({
        id: "support-1",
        kind: "recordDiagnostic",
        event: { ...event, [privateField]: "private" },
      }),
    );
  }
  for (const invalid of [
    { ...event, durationMs: Infinity },
    { ...event, durationMs: 600001 },
    { ...event, count: 0 },
    { ...event, category: "exception message" },
  ])
    assert.throws(() =>
      parseRequest({
        id: "support-1",
        kind: "recordDiagnostic",
        event: invalid,
      }),
    );
  const response = {
    id: "support-1",
    kind: "diagnostics",
    value: {
      persistence: "memoryOnly",
      ring: { version: 1, omitted: 3, records: [event] },
    },
    metadata: {
      versions: { application: "0.0.0", database: 9, inkCodec: 1 },
      capabilities: { opfs: true, storeLock: true, sqliteBigInt: true },
    },
  };
  assert.deepEqual(parseResponse(response), response);
  assert.throws(() =>
    parseResponse({
      ...response,
      value: { ...response.value, profileId: "private" },
    }),
  );
  assert.throws(() =>
    parseResponse({
      ...response,
      metadata: { ...response.metadata, profileId: "private" },
    }),
  );
  assert.throws(() =>
    parseResponse({
      ...response,
      metadata: {
        ...response.metadata,
        versions: {
          ...response.metadata.versions,
          application: "private child name",
        },
      },
    }),
  );
  assert.throws(() =>
    parseResponse({
      ...response,
      value: {
        ...response.value,
        ring: {
          ...response.value.ring,
          records: [{ ...event, message: "private exception" }],
        },
      },
    }),
  );
  assert.throws(() =>
    parseResponse({
      ...response,
      value: { ...response.value, persistence: "uploaded" },
    }),
  );
});

test("browser storage estimates preserve measured whole-origin values and distinguish missing, invalid and failed measurements", async () => {
  assert.deepEqual(
    await readOriginStorageEstimate({
      estimate: async () => ({ usage: 123, quota: 456 }),
    }),
    { kind: "measured", scope: "origin", usage: 123, quota: 456 },
  );
  assert.deepEqual(
    await readOriginStorageEstimate({
      estimate: async () => ({ usage: 0, quota: 0 }),
    }),
    { kind: "measured", scope: "origin", usage: 0, quota: 0 },
  );
  assert.deepEqual(
    await readOriginStorageEstimate({ estimate: async () => ({ usage: 123 }) }),
    { kind: "incomplete", scope: "origin", usage: 123 },
  );
  assert.deepEqual(
    await readOriginStorageEstimate({ estimate: async () => ({ quota: 456 }) }),
    { kind: "incomplete", scope: "origin", quota: 456 },
  );
  assert.deepEqual(
    await readOriginStorageEstimate({ estimate: async () => ({}) }),
    { kind: "incomplete", scope: "origin" },
  );
  assert.deepEqual(
    await readOriginStorageEstimate({
      estimate: async () => ({ usage: NaN, quota: Infinity }),
    }),
    { kind: "incomplete", scope: "origin" },
  );
  assert.deepEqual(
    await readOriginStorageEstimate({
      estimate: async () => ({ usage: -1, quota: 1.5 }),
    }),
    { kind: "incomplete", scope: "origin" },
  );
  assert.deepEqual(
    await readOriginStorageEstimate({
      estimate: async () => {
        throw new Error("Private browser failure");
      },
    }),
    { kind: "error", reason: "estimate-failed" },
  );
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  try {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {},
    });
    assert.deepEqual(await readOriginStorageEstimate(), {
      kind: "unavailable",
      reason: "unsupported",
    });
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "navigator", descriptor);
    else Reflect.deleteProperty(globalThis, "navigator");
  }
});
