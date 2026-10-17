import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  encodeInkPoints,
  inkAdmissionAnchor,
  inkChunkMetadataReservation,
  inkCommandByteLength,
  inkSnapshotUsage,
  inkStrokeMetadataReservation,
  inkTailWriteReservation,
  parseCounter,
  parseId,
  prepareInkCommand,
} from "@readatthree/teaching";
import { practiceFixture } from "../storage/practice-support.ts";
import { hash } from "../storage/support.ts";
import { executeTeaching } from "../storage/selected-support.ts";

test("actual canonical encoders bound escaped IDs, maximum counters and frozen checkpoint segments before hashing", async (t) => {
  const f = await practiceFixture(t),
    { app } = await f.connectReady();
  await f.start(app);
  const { snapshot, token } = await f.current(app);
  const strokeId = parseId({ kind: "stroke", value: "\u0000".repeat(200) }),
    maximum = parseCounter("9223372036854775807");
  const brush = {
    kind: "round",
    width: 5,
    colorRole: "child",
    cap: "round",
    join: "round",
  } satisfies import("@readatthree/teaching").BrushSpec;
  const chunks = Array.from(
    { length: 101 },
    (_, index) =>
      ({
        chunkIndex: index,
        firstPointIndex: index,
        pointCount: 1,
        codecVersion: 1,
        payload: [
          ...encodeInkPoints({
            bounds: snapshot.bounds,
            points: [{ x: 100, y: 100, elapsedMs: index }],
          }),
        ],
      }) satisfies import("@readatthree/teaching").InkChunk,
  );
  const stroke = {
    strokeId,
    layer: "tracing",
    strokeOrder: parseCounter("9223372036854775806"),
    status: "interrupted",
    brush,
    pointCount: 101,
    chunks,
  } satisfies import("@readatthree/teaching").InkStroke;
  const prospective = {
    ...snapshot,
    token: { ...token, revision: maximum, inputEpoch: maximum },
    nextStrokeOrder: maximum,
    strokes: [...snapshot.strokes, stroke],
    histories: snapshot.histories.map((history) =>
      history.layer === "tracing"
        ? ({
            ...history,
            cursorSeq: maximum,
            tipSeq: maximum,
            nextOpSeq: maximum,
            operations: [{ kind: "AddStroke", seq: maximum, strokeId }],
          } satisfies import("@readatthree/teaching").InkHistory)
        : history,
    ),
  };
  const reservation =
    inkAdmissionAnchor(snapshot).canonicalByteLength +
    inkStrokeMetadataReservation({ strokeId, layer: "tracing", brush }) +
    101 * (16 + inkChunkMetadataReservation);
  assert.equal(inkSnapshotUsage(prospective).pointCount, 102);
  assert.equal(
    reservation >= inkSnapshotUsage(prospective).canonicalByteLength,
    true,
  );
  let reserved = 0,
    hashed = false;
  const command = await prepareInkCommand({
    token: { ...token, revision: maximum, inputEpoch: maximum },
    edit: {
      kind: "begin",
      strokeId,
      layer: "tracing",
      brush,
      chunks: chunks.slice(0, 64),
    },
    ids: () => "\u0000".repeat(200),
    reserve(bytes) {
      reserved = bytes;
      assert.equal(hashed, false);
    },
    hash: async (text) => {
      hashed = true;
      assert.equal(reserved > 64 * 16, true);
      return hash(text);
    },
  });
  assert.equal(reserved, inkCommandByteLength(command));
  const tail = inkTailWriteReservation({
    token,
    strokeId,
    layer: "tracing",
    brush,
    pointCount: 101,
  });
  const unsegmented = {
    ...command,
    edit: {
      ...command.edit,
      chunks: [
        {
          chunkIndex: 100000,
          firstPointIndex: 100000,
          pointCount: 2048,
          codecVersion: 1,
          payload: Array.from({ length: 101 * 16 }, () => 255),
        },
      ],
    },
  } satisfies import("@readatthree/teaching").InkCommand;
  assert.equal(tail >= inkCommandByteLength(unsegmented), true);
  assert.equal(canonical(command).includes("\\u0000"), true);
});
test("hidden retained geometry stays in the admission anchor after Undo and Clear", async (t) => {
  const f = await practiceFixture(t),
    { app } = await f.connectReady();
  await f.start(app);
  await f.draw(app, 100);
  await f.draw(app, 200);
  await executeTeaching(app, await f.prepareControl(app, { kind: "inkUndo" }));
  const undone = (await f.current(app)).snapshot;
  assert.equal(inkAdmissionAnchor(undone).pointCount, 3);
  await executeTeaching(
    app,
    await f.prepareControl(app, { kind: "clearPractice" }),
  );
  const cleared = (await f.current(app)).snapshot;
  assert.deepEqual(await f.visible(app), []);
  assert.equal(inkAdmissionAnchor(cleared).pointCount, 2);
  assert.equal(
    inkAdmissionAnchor(cleared).canonicalByteLength >=
      inkSnapshotUsage(cleared).canonicalByteLength,
    true,
  );
});
