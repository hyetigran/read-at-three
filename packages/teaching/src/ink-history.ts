import { canonical, deepFreeze, increment } from "./identity.ts";
import { INK_LIMITS } from "./ink-limits.ts";
import type { InkHistory, InkOperation, InkStroke } from "./ink.ts";
import type { StrokeId } from "./types.ts";

export type PracticeControl = Readonly<
  { kind: "inkUndo" } | { kind: "inkRedo" } | { kind: "clearPractice" }
>;
export type ChildPracticeLayer = Exclude<InkHistory["layer"], "model">;
export type HistoryChange =
  | PracticeControl
  | Readonly<
      | { kind: "beginNonemptyCapture" }
      | { kind: "finalizeStroke"; strokeId: StrokeId }
    >;

function applyOperation(
  visible: readonly StrokeId[],
  operation: InkOperation,
): readonly StrokeId[] {
  switch (operation.kind) {
    case "AddStroke":
      return [...visible, operation.strokeId];
    case "ClearPractice": {
      if (
        !visible.length ||
        canonical(visible) !== canonical(operation.strokeIds)
      )
        throw new Error("Invalid Clear practice before-set");
      return [];
    }
  }
}

export function collectInkHistoryReferences({
  history,
}: {
  history: InkHistory;
}): ReadonlySet<StrokeId> {
  const references = new Set(history.baseline);
  for (const operation of history.operations)
    switch (operation.kind) {
      case "AddStroke":
        references.add(operation.strokeId);
        break;
      case "ClearPractice":
        for (const id of operation.strokeIds) references.add(id);
        break;
      default: {
        const exhaustive: never = operation;
        throw new Error(`Unknown ink operation ${exhaustive}`);
      }
    }
  return references;
}

export function evaluateInkHistory({
  history,
  strokes,
}: {
  history: InkHistory;
  strokes: readonly InkStroke[];
}): Readonly<{
  visible: readonly StrokeId[];
  references: ReadonlySet<StrokeId>;
}> {
  const references = collectInkHistoryReferences({ history }),
    origins = new Set(history.baseline);
  if (
    origins.size !== history.baseline.length ||
    history.operations.length > INK_LIMITS.retainedOperations
  )
    throw new Error("Invalid ink history baseline");
  const finalized = new Set(
    strokes
      .filter((s) => s.layer === history.layer && s.status !== "capturing")
      .map((s) => s.strokeId),
  );
  if (history.baseline.some((id) => !finalized.has(id)))
    throw new Error("Missing baseline stroke");
  let seq = history.baseSeq,
    visible = history.baseline,
    selected = history.cursorSeq === seq ? visible : null;
  for (const operation of history.operations) {
    if (BigInt(operation.seq) <= BigInt(seq))
      throw new Error("Unordered ink operation");
    switch (operation.kind) {
      case "AddStroke":
        if (
          !finalized.has(operation.strokeId) ||
          origins.has(operation.strokeId)
        )
          throw new Error("Invalid ink origin");
        origins.add(operation.strokeId);
        break;
      case "ClearPractice":
        if (history.layer === "model")
          throw new Error("Model cannot be cleared");
        break;
    }
    visible = applyOperation(visible, operation);
    seq = operation.seq;
    if (seq === history.cursorSeq) selected = visible;
  }
  if (
    history.tipSeq !== seq ||
    BigInt(history.nextOpSeq) <= BigInt(seq) ||
    selected === null
  )
    throw new Error("Invalid ink history cursor");
  return { visible: selected, references };
}

export function assertInkReferences({
  histories,
  strokes,
}: {
  histories: readonly InkHistory[];
  strokes: readonly InkStroke[];
}): ReadonlySet<StrokeId> {
  if (
    histories.length !== 3 ||
    new Set(histories.map((h) => h.layer)).size !== 3 ||
    new Set(strokes.map((s) => s.strokeId)).size !== strokes.length
  )
    throw new Error("Incomplete canonical ink history");
  const references = new Set<StrokeId>();
  for (const history of histories)
    for (const id of evaluateInkHistory({ history, strokes }).references)
      references.add(id);
  for (const stroke of strokes) {
    if (stroke.status === "capturing") references.add(stroke.strokeId);
    else if (!references.has(stroke.strokeId))
      throw new Error("Unreferenced finalized stroke");
  }
  return references;
}

export function changeInkHistory({
  history,
  strokes,
  change,
}: {
  history: InkHistory;
  strokes: readonly InkStroke[];
  change: HistoryChange;
}): InkHistory {
  const evaluated = evaluateInkHistory({ history, strokes });
  if (
    (change.kind === "inkUndo" ||
      change.kind === "inkRedo" ||
      change.kind === "clearPractice") &&
    history.layer === "model"
  )
    throw new Error("Practice controls cannot edit model");
  if (change.kind === "inkUndo") {
    if (history.cursorSeq === history.baseSeq)
      throw new Error("Ink Undo unavailable");
    const index = history.operations.findIndex(
      (op) => op.seq === history.cursorSeq,
    );
    return deepFreeze({
      ...history,
      cursorSeq: history.operations[index - 1]?.seq ?? history.baseSeq,
    });
  }
  if (change.kind === "inkRedo") {
    const next = history.operations.find(
      (op) => BigInt(op.seq) > BigInt(history.cursorSeq),
    );
    if (!next) throw new Error("Ink Redo unavailable");
    return deepFreeze({ ...history, cursorSeq: next.seq });
  }
  let operations = history.operations.filter(
    (op) => BigInt(op.seq) <= BigInt(history.cursorSeq),
  );
  let baseline = history.baseline,
    baseSeq = history.baseSeq;
  if (change.kind === "beginNonemptyCapture")
    return deepFreeze({ ...history, operations, tipSeq: history.cursorSeq });
  const operation: InkOperation =
    change.kind === "clearPractice"
      ? {
          kind: "ClearPractice",
          seq: history.nextOpSeq,
          strokeIds: evaluated.visible,
        }
      : {
          kind: "AddStroke",
          seq: history.nextOpSeq,
          strokeId: change.strokeId,
        };
  if (change.kind === "clearPractice" && !evaluated.visible.length)
    throw new Error("Clear practice unavailable");
  if (operations.length === INK_LIMITS.retainedOperations) {
    const oldest = operations[0];
    if (!oldest) throw new Error("Applied prefix missing");
    baseline = applyOperation(baseline, oldest);
    baseSeq = oldest.seq;
    operations = operations.slice(1);
  }
  const result = {
    ...history,
    baseline,
    baseSeq,
    operations: [...operations, operation],
    cursorSeq: operation.seq,
    tipSeq: operation.seq,
    nextOpSeq: increment(history.nextOpSeq),
  };
  evaluateInkHistory({ history: result, strokes });
  return deepFreeze(result);
}
