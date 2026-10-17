import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createInkBuffer,
  decodeInkPoints,
  encodeInkPoints,
  normalizeInkPoints,
  parseCounter,
  parseId,
  parseHash,
  canonical,
  validateInkChunks,
  visibleInkStrokes,
  parseRecoveryOpening,
} from "../../packages/teaching/src/index.ts";
const bounds = { width: 1000, height: 180 };
test("warm recovery strictly requires one tagged retained teaching declaration", () => {
  const commandId = parseId({ kind: "command", value: "retained-teaching" });
  const payloadHash = parseHash({ kind: "payload", value: "a".repeat(64) });
  for (const teaching of [
    { kind: "none" },
    { kind: "pending", commandId, payloadHash },
  ]) {
    const opening = { kind: "warm", retainedStrokeIds: [], teaching };
    assert.deepEqual(parseRecoveryOpening(opening), opening);
    assert.equal(Object.isFrozen(teaching), true);
  }
  assert.deepEqual(parseRecoveryOpening({ kind: "cold" }), { kind: "cold" });
  for (const opening of [
    { kind: "warm", retainedStrokeIds: [] },
    { kind: "warm", retainedStrokeIds: [], teaching: null },
    {
      kind: "warm",
      retainedStrokeIds: [],
      teaching: { kind: "none", commandId },
    },
    {
      kind: "warm",
      retainedStrokeIds: [],
      teaching: { kind: "pending", commandId },
    },
    {
      kind: "warm",
      retainedStrokeIds: [],
      teaching: { kind: "pending", commandId: "", payloadHash },
    },
    {
      kind: "warm",
      retainedStrokeIds: [],
      teaching: { kind: "pending", commandId, payloadHash: "A".repeat(64) },
    },
    {
      kind: "warm",
      retainedStrokeIds: [],
      teaching: { kind: "pending", commandId, payloadHash: "a".repeat(63) },
    },
    {
      kind: "warm",
      retainedStrokeIds: [],
      teaching: { kind: "resolved", commandId, payloadHash },
    },
    {
      kind: "warm",
      retainedStrokeIds: [],
      teaching: { kind: "pending", commandId, payloadHash, extra: true },
    },
    { kind: "cold", teaching: { kind: "none" } },
  ])
    assert.throws(
      () => parseRecoveryOpening(opening),
      /Invalid recovery opening/,
    );
});
test("codec v1 is literal little-endian Float32/Uint32 with canonical zeros/default pressure", () => {
  const bytes = encodeInkPoints({
    points: [
      { x: 1.5, y: 2.25, elapsedMs: 5 },
      { x: -0, y: 0, elapsedMs: 6, pressure: 0.5 },
    ],
    bounds,
  });
  assert.equal(
    Buffer.from(bytes).toString("hex"),
    "0000c03f00001040050000000000803f0000000000000000060000000000003f",
  );
  const offset = new Uint8Array(bytes.length + 8);
  offset.set(bytes, 4);
  assert.deepEqual(
    decodeInkPoints({
      payload: offset.subarray(4, 4 + bytes.length),
      pointCount: 2,
      bounds,
    }),
    [
      { x: 1.5, y: 2.25, elapsedMs: 5, pressure: 1 },
      { x: 0, y: 0, elapsedMs: 6, pressure: 0.5 },
    ],
  );
  assert.equal(
    Object.is(
      normalizeInkPoints({
        points: [{ x: -0, y: -0, elapsedMs: -0, pressure: -0 }],
        bounds,
      })[0]?.x,
      -0,
    ),
    false,
  );
  for (const point of [
    { x: NaN, y: 0, elapsedMs: 0 },
    { x: 1001, y: 0, elapsedMs: 0 },
    { x: 0, y: 0, elapsedMs: 0, pressure: 2 },
    { x: 0, y: 0, elapsedMs: 0.5 },
    { x: 0, y: 0, elapsedMs: 0x100000000 },
  ])
    assert.throws(() => encodeInkPoints({ points: [point], bounds }));
  assert.throws(() =>
    decodeInkPoints({ payload: bytes.subarray(1), pointCount: 2, bounds }),
  );
  const negativeZero = bytes.slice(16);
  negativeZero[3] = 128;
  assert.throws(
    () => decodeInkPoints({ payload: negativeZero, pointCount: 1, bounds }),
    /Noncanonical/,
  );
});
test("chunk continuity and elapsed time span checkpoint boundaries", () => {
  const c = (index: number, first: number, elapsedMs: number) => ({
    chunkIndex: index,
    firstPointIndex: first,
    pointCount: 1,
    codecVersion: 1 as const,
    payload: [
      ...encodeInkPoints({ points: [{ x: 0, y: 0, elapsedMs }], bounds }),
    ],
  });
  assert.deepEqual(
    validateInkChunks({ chunks: [c(0, 0, 10), c(1, 1, 10)], bounds }),
    { pointCount: 2, elapsedMs: 10 },
  );
  assert.throws(() =>
    validateInkChunks({ chunks: [c(0, 0, 10), c(1, 1, 9)], bounds }),
  );
  assert.throws(() => validateInkChunks({ chunks: [c(0, 1, 0)], bounds }));
  assert.throws(() =>
    encodeInkPoints({
      points: Array.from({ length: 2049 }, () => ({
        x: 0,
        y: 0,
        elapsedMs: 0,
      })),
      bounds,
    }),
  );
});
test("canonical history accepts monotone gaps and rejects foreign origins", () => {
  const strokeId = parseId({ kind: "stroke", value: "stroke" });
  const history = {
    layer: "model",
    baseline: [],
    baseSeq: parseCounter("0"),
    cursorSeq: parseCounter("5"),
    tipSeq: parseCounter("5"),
    nextOpSeq: parseCounter("9"),
    operations: [{ seq: parseCounter("5"), kind: "AddStroke", strokeId }],
  } satisfies import("../../packages/teaching/src/index.ts").InkHistory;
  const stroke = {
    strokeId,
    layer: "model",
    strokeOrder: parseCounter("0"),
    status: "finished",
    brush: {
      kind: "round",
      width: 4,
      colorRole: "model",
      cap: "round",
      join: "round",
    },
    pointCount: 1,
    chunks: [],
  } satisfies import("../../packages/teaching/src/index.ts").InkStroke;
  assert.deepEqual(visibleInkStrokes({ history, strokes: [stroke] }), [
    strokeId,
  ]);
  assert.throws(() =>
    visibleInkStrokes({ history, strokes: [{ ...stroke, layer: "tracing" }] }),
  );
});
test("confirmed point buffer fences bounds and returns every unaccepted point", () => {
  const buffer = createInkBuffer({ bounds, committedPointCount: 99999 });
  assert.equal(
    buffer.appendConfirmed({ samples: [{ x: 1, y: 1, elapsedMs: 0 }] }).kind,
    "buffered",
  );
  const result = buffer.appendConfirmed({
    samples: [{ x: 2, y: 2, elapsedMs: 1 }],
  });
  assert.equal(result.kind, "fenced");
  if (result.kind !== "fenced") throw Error();
  assert.equal(result.retained.length, 1);
  assert.equal(result.unaccepted.length, 1);
  assert.equal(buffer.seal().length, 1);
});

test("document point/byte limits include metadata and command queue keeps data on wrong-owner acknowledgement", async () => {
  const { validateInkDocumentUsage, createInkCommandQueue, prepareInkCommand } =
    await import("../../packages/teaching/src/index.ts");
  validateInkDocumentUsage({
    pointCount: 1000000,
    canonicalByteLength: 32 * 1024 * 1024,
  });
  assert.throws(() =>
    validateInkDocumentUsage({ pointCount: 1000001, canonicalByteLength: 1 }),
  );
  assert.throws(() =>
    validateInkDocumentUsage({
      pointCount: 1,
      canonicalByteLength: 32 * 1024 * 1024 + 1,
    }),
  );
  const token = {
    profileId: parseId({ kind: "profile", value: "profile" }),
    generation: parseCounter("0"),
    documentId: parseId({ kind: "document", value: "doc" }),
    runId: parseId({ kind: "run", value: "run" }),
    courseId: parseId({ kind: "course", value: "course" }),
    packageHash: importHash(),
    lessonId: parseId({ kind: "lesson", value: "lesson" }),
    taskId: parseId({ kind: "task", value: "task" }),
    targetId: parseId({ kind: "target", value: "target" }),
    revision: parseCounter("0"),
    phase: "parentDemonstration",
    inputEpoch: parseCounter("0"),
  } satisfies import("../../packages/teaching/src/index.ts").DocumentToken;
  let next = 0;
  const command = await prepareInkCommand({
    token,
    edit: {
      kind: "begin",
      strokeId: parseId({ kind: "stroke", value: "stroke" }),
      layer: "model",
      brush: {
        kind: "round",
        width: 4,
        colorRole: "model",
        cap: "round",
        join: "round",
      },
      chunks: [],
    },
    ids: () => `command-${++next}`,
    hash: async () => "a".repeat(64),
  });
  const queue = createInkCommandQueue();
  queue.retain({ command });
  assert.throws(() =>
    queue.acknowledge({
      receipt: {
        kind: "inkCommitted",
        commandId: command.commandId,
        token: {
          ...token,
          profileId: parseId({ kind: "profile", value: "other" }),
          revision: parseCounter("1"),
        },
      },
    }),
  );
  assert.equal(queue.snapshot().length, 1);
  queue.acknowledge({
    receipt: {
      kind: "inkCommitted",
      commandId: command.commandId,
      token: { ...token, revision: parseCounter("1") },
    },
  });
  assert.equal(queue.snapshot().length, 0);
  const unicodeQueue = createInkCommandQueue();
  const unicodeCommand = {
    ...command,
    token: {
      ...command.token,
      profileId: parseId({ kind: "profile", value: "🦊".repeat(200) }),
    },
  };
  unicodeQueue.retain({ command });
  unicodeQueue.retain({
    command: {
      ...unicodeCommand,
      commandId: parseId({ kind: "command", value: "unicode-command" }),
    },
  });
  unicodeQueue.acknowledge({
    receipt: {
      kind: "inkCommitted",
      commandId: command.commandId,
      token: { ...token, revision: parseCounter("1") },
    },
  });
  assert.equal(
    unicodeQueue.byteLength(),
    Buffer.byteLength(
      canonical({ ...unicodeCommand, commandId: "unicode-command" }),
      "utf8",
    ),
  );
  assert.ok(unicodeQueue.byteLength() > canonical(unicodeCommand).length);
  const full = createInkCommandQueue(),
    payload = [
      ...encodeInkPoints({
        points: Array.from({ length: 2048 }, () => ({
          x: 1,
          y: 1,
          elapsedMs: 0,
        })),
        bounds,
      }),
    ];
  let fenced = false;
  for (let i = 0; i < 100; i++) {
    const result = full.retain({
      command: {
        ...command,
        commandId: parseId({ kind: "command", value: `queued-${i}` }),
        edit: {
          ...command.edit,
          chunks: [
            {
              codecVersion: 1,
              chunkIndex: 0,
              firstPointIndex: 0,
              pointCount: 2048,
              payload,
            },
          ],
        },
      },
    });
    if (result.kind === "fenced") {
      assert.equal(result.command.edit.chunks[0]?.payload.length, 32768);
      assert.ok(full.byteLength() <= 2 * 1024 * 1024);
      fenced = true;
      break;
    }
  }
  assert.equal(fenced, true);
});
function importHash() {
  return parseHash({ kind: "package", value: "a".repeat(64) });
}
