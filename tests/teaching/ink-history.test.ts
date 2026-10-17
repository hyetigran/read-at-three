import assert from "node:assert/strict";
import { test } from "node:test";
import {
  changeInkHistory,
  evaluateInkHistory,
  assertInkReferences,
  parseCounter,
  parseId,
} from "../../packages/teaching/src/index.ts";
import type {
  InkHistory,
  InkStroke,
} from "../../packages/teaching/src/index.ts";
const id = (value: string) => parseId({ kind: "stroke", value });
const stroke = (value: string): InkStroke => ({
  strokeId: id(value),
  layer: "tracing",
  strokeOrder: parseCounter("0"),
  status: "finished",
  brush: {
    kind: "round",
    width: 5,
    colorRole: "child",
    cap: "round",
    join: "round",
  },
  pointCount: 1,
  chunks: [],
});
function empty(layer: InkHistory["layer"] = "tracing"): InkHistory {
  return {
    layer,
    baseline: [],
    baseSeq: parseCounter("0"),
    cursorSeq: parseCounter("0"),
    tipSeq: parseCounter("0"),
    nextOpSeq: parseCounter("1"),
    operations: [],
  };
}
test("Clear retains exact ordered geometry, gaps undo and redo, and abandoned branches remain absent", () => {
  const strokes = [stroke("a"), stroke("b"), stroke("c")];
  let history = empty();
  history = changeInkHistory({
    history,
    strokes,
    change: { kind: "finalizeStroke", strokeId: id("a") },
  });
  history = changeInkHistory({
    history,
    strokes,
    change: { kind: "finalizeStroke", strokeId: id("b") },
  });
  history = changeInkHistory({
    history,
    strokes,
    change: { kind: "clearPractice" },
  });
  assert.deepEqual(history.operations[2], {
    kind: "ClearPractice",
    seq: "3",
    strokeIds: ["a", "b"],
  });
  assert.deepEqual(evaluateInkHistory({ history, strokes }).visible, []);
  history = changeInkHistory({ history, strokes, change: { kind: "inkUndo" } });
  assert.deepEqual(evaluateInkHistory({ history, strokes }).visible, [
    "a",
    "b",
  ]);
  history = changeInkHistory({ history, strokes, change: { kind: "inkRedo" } });
  assert.deepEqual(
    [...evaluateInkHistory({ history, strokes }).references],
    ["a", "b"],
  );
  history = changeInkHistory({ history, strokes, change: { kind: "inkUndo" } });
  history = changeInkHistory({ history, strokes, change: { kind: "inkUndo" } });
  assert.deepEqual(evaluateInkHistory({ history, strokes }).visible, ["a"]);
  assert.deepEqual(
    [...evaluateInkHistory({ history, strokes }).references],
    ["a", "b"],
  );
  history = changeInkHistory({
    history,
    strokes,
    change: { kind: "beginNonemptyCapture" },
  });
  history = changeInkHistory({
    history,
    strokes,
    change: { kind: "finalizeStroke", strokeId: id("c") },
  });
  assert.deepEqual(
    history.operations.map((op) => op.seq),
    ["1", "4"],
  );
  history = changeInkHistory({ history, strokes, change: { kind: "inkUndo" } });
  assert.equal(history.cursorSeq, "1");
  history = changeInkHistory({ history, strokes, change: { kind: "inkRedo" } });
  assert.deepEqual(evaluateInkHistory({ history, strokes }).visible, [
    "a",
    "c",
  ]);
  assert.throws(
    () =>
      evaluateInkHistory({
        history: {
          ...empty(),
          baseline: [id("a"), id("a")],
          tipSeq: parseCounter("1"),
          nextOpSeq: parseCounter("2"),
          operations: [
            { kind: "AddStroke", seq: parseCounter("1"), strokeId: id("b") },
          ],
        },
        strokes,
      }),
    /baseline/,
  );
  assert.throws(
    () =>
      evaluateInkHistory({
        history: { ...history, cursorSeq: parseCounter("2") },
        strokes,
      }),
    /cursor/,
  );
  assert.throws(
    () =>
      evaluateInkHistory({
        history: {
          ...empty(),
          tipSeq: parseCounter("1"),
          nextOpSeq: parseCounter("2"),
          operations: [
            {
              kind: "ClearPractice",
              seq: parseCounter("1"),
              strokeIds: [id("a")],
            },
          ],
        },
        strokes,
      }),
    /before-set/,
  );
});
test("128-operation compaction folds Clear with the same replay and retains only reachable origins", () => {
  const strokes = Array.from({ length: 130 }, (_, n) => stroke(`stroke-${n}`));
  let history = empty();
  for (const item of strokes)
    history = changeInkHistory({
      history,
      strokes,
      change: { kind: "finalizeStroke", strokeId: item.strokeId },
    });
  assert.deepEqual(
    {
      base: history.baseSeq,
      cursor: history.cursorSeq,
      tip: history.tipSeq,
      next: history.nextOpSeq,
      count: history.operations.length,
      baseline: history.baseline,
    },
    {
      base: "2",
      cursor: "130",
      tip: "130",
      next: "131",
      count: 128,
      baseline: ["stroke-0", "stroke-1"],
    },
  );
  history = changeInkHistory({
    history,
    strokes,
    change: { kind: "clearPractice" },
  });
  for (let n = 0; n < 128; n++) {
    const item = stroke(`new-${n}`);
    strokes.push(item);
    history = changeInkHistory({
      history,
      strokes,
      change: { kind: "finalizeStroke", strokeId: item.strokeId },
    });
  }
  assert.equal(history.baseSeq, "131");
  assert.deepEqual(history.baseline, []);
  const retained = strokes.filter((s) =>
    evaluateInkHistory({ history, strokes }).references.has(s.strokeId),
  );
  assert.equal(retained.length, 128);
  assert.equal(
    assertInkReferences({
      histories: [empty("model"), history, empty("independent")],
      strokes: retained,
    }).size,
    128,
  );
  assert.throws(
    () =>
      assertInkReferences({
        histories: [empty("model"), history, empty("independent")],
        strokes,
      }),
    /Unreferenced/,
  );
});
