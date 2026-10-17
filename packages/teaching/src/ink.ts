import { INK_LIMITS } from "./ink-limits.ts";
export { INK_LIMITS } from "./ink-limits.ts";
import { inkCommandByteLength } from "./ink-reservation.ts";
import { evaluateInkHistory } from "./ink-history.ts";
import { utf8ByteLength } from "./unicode-length.ts";
import {
  validateInkCommand,
  validatePracticeControlsBinding,
  validatePracticeControlsSummary,
  validateInkReceipt,
  validateInkBrush,
  validateInkStrokeIds,
  validateInkOperation,
  validateInkSnapshot,
  validateRecoveryOpening,
  validateRecoveryChoice,
  validateRecoveryInventory,
  validateDocumentToken,
} from "./generated-validators.js";
import { canonical, parseCounter, deepFreeze, increment } from "./identity.ts";
import type { Counter, DocumentToken, InkLayer, StrokeId } from "./types.ts";

export type StrokeIdList = readonly StrokeId[];
export type InkPoint = Readonly<{
  x: number;
  y: number;
  elapsedMs: number;
  pressure: number;
}>;
export type InkSample = Readonly<{
  x: number;
  y: number;
  elapsedMs: number;
  pressure?: number;
}>;
export type InkBounds = Readonly<{ width: number; height: number }>;
export type BrushSpec = Readonly<{
  kind: "round";
  width: number;
  colorRole: "model" | "child";
  cap: "round";
  join: "round";
}>;
export type InkChunk = Readonly<{
  chunkIndex: number;
  firstPointIndex: number;
  pointCount: number;
  codecVersion: 1;
  payload: readonly number[];
}>;
export type InkStroke = Readonly<{
  strokeId: StrokeId;
  layer: InkLayer;
  strokeOrder: Counter;
  status: "capturing" | "finished" | "interrupted";
  brush: BrushSpec;
  pointCount: number;
  chunks: readonly InkChunk[];
}>;
export type InkOperation = Readonly<
  | { seq: Counter; kind: "AddStroke"; strokeId: StrokeId }
  | { seq: Counter; kind: "ClearPractice"; strokeIds: readonly StrokeId[] }
>;
export type InkHistory = Readonly<{
  layer: InkLayer;
  baseline: readonly StrokeId[];
  baseSeq: Counter;
  cursorSeq: Counter;
  tipSeq: Counter;
  nextOpSeq: Counter;
  operations: readonly InkOperation[];
}>;
export type InkSnapshot = Readonly<{
  token: DocumentToken;
  sourceRefs: readonly string[];
  bounds: InkBounds;
  guides: import("./types.ts").WritingTarget["guides"];
  boardY: number;
  writable: boolean;
  nextStrokeOrder: Counter;
  strokes: readonly InkStroke[];
  histories: readonly InkHistory[];
}>;
export type InkEdit = Readonly<
  | {
      kind: "begin";
      strokeId: StrokeId;
      layer: InkLayer;
      brush: BrushSpec;
      chunks: readonly InkChunk[];
    }
  | {
      kind: "checkpoint";
      strokeId: StrokeId;
      layer: InkLayer;
      chunks: readonly InkChunk[];
    }
  | {
      kind: "finalize";
      strokeId: StrokeId;
      layer: InkLayer;
      chunks: readonly InkChunk[];
      status: "finished" | "interrupted";
    }
>;
export type InkCommand = Readonly<{
  kind: "ink";
  commandId: import("./types.ts").CommandId;
  token: DocumentToken;
  payloadHash: import("./types.ts").PayloadHash;
  edit: InkEdit;
}>;
export type InkReceipt = Readonly<{
  kind: "inkCommitted";
  commandId: import("./types.ts").CommandId;
  token: DocumentToken;
}>;
export type InkResult = InkReceipt | import("./types.ts").CommandRejection;
export type RecoveryInventory = Readonly<{
  kind: "closed";
  recoveryId: string;
  captures: readonly Readonly<{
    token: DocumentToken;
    strokeId: StrokeId;
    layer: InkLayer;
    pointCount: number;
    nextChunkIndex: number;
  }>[];
}>;
export type RecoveryChoice = Readonly<
  { kind: "cold" } | { kind: "warm"; settledStrokeIds: readonly StrokeId[] }
>;
export type RecoveryTeaching = Readonly<
  | { kind: "none" }
  | {
      kind: "pending";
      commandId: import("./types.ts").CommandId;
      payloadHash: import("./types.ts").PayloadHash;
    }
>;
export type RecoveryOpening = Readonly<
  | { kind: "cold" }
  | {
      kind: "warm";
      retainedStrokeIds: readonly StrokeId[];
      teaching: RecoveryTeaching;
    }
>;
import type { TeachingApplication } from "./types.ts";
export interface WritingApplication extends TeachingApplication {
  readInk(input: { token: DocumentToken }): Promise<InkSnapshot>;
  readPracticeControls(
    input: PracticeControlsBinding,
  ): Promise<PracticeControlsSummary>;
  dispatchInk(command: InkCommand): Promise<InkResult>;
  openRecovery(input: RecoveryOpening): Promise<RecoveryInventory>;
  recoverInk(input: {
    recoveryId: string;
    command: InkCommand;
  }): Promise<InkResult>;
  recoverTeaching(input: {
    recoveryId: string;
    command: import("./types.ts").TeachingCommand;
  }): Promise<import("./types.ts").CommandResult>;
  reconcileRecovery(input: {
    recoveryId: string;
    choice: RecoveryChoice;
  }): Promise<import("./types.ts").CommittedProjection>;
}
function zero(value: number): number {
  return value === 0 ? 0 : value;
}
export function normalizeInkPoints({
  points,
  bounds,
  previousElapsedMs = 0,
}: {
  points: readonly InkSample[];
  bounds: InkBounds;
  previousElapsedMs?: number;
}): readonly InkPoint[] {
  if (
    ![bounds.width, bounds.height].every((v) => Number.isFinite(v) && v > 0) ||
    !Number.isInteger(previousElapsedMs) ||
    previousElapsedMs < 0 ||
    previousElapsedMs > 0xffffffff
  )
    throw new Error("Invalid ink bounds or elapsed origin");
  let elapsed = previousElapsedMs;
  return deepFreeze(
    points.map((point) => {
      const x = zero(Math.fround(point.x)),
        y = zero(Math.fround(point.y)),
        pressure = zero(Math.fround(point.pressure ?? 1)),
        elapsedMs = zero(point.elapsedMs);
      if (
        ![point.x, point.y, point.pressure ?? 1, x, y, pressure].every(
          Number.isFinite,
        ) ||
        point.x < 0 ||
        point.y < 0 ||
        point.x > bounds.width ||
        point.y > bounds.height ||
        x < 0 ||
        y < 0 ||
        x > bounds.width ||
        y > bounds.height ||
        (point.pressure ?? 1) < 0 ||
        (point.pressure ?? 1) > 1 ||
        !Number.isInteger(elapsedMs) ||
        elapsedMs < elapsed ||
        elapsedMs > 0xffffffff
      )
        throw new Error("Invalid canonical ink point");
      elapsed = elapsedMs;
      return { x, y, elapsedMs, pressure };
    }),
  );
}
export function encodeInkPoints(input: {
  points: readonly InkSample[];
  bounds: InkBounds;
  previousElapsedMs?: number;
}): Uint8Array {
  if (
    input.points.length < 1 ||
    input.points.length > INK_LIMITS.pointsPerChunk
  )
    throw new Error("Invalid ink chunk point count");
  const points = normalizeInkPoints(input),
    bytes = new Uint8Array(points.length * 16),
    view = new DataView(bytes.buffer);
  points.forEach((p, i) => {
    const offset = i * 16;
    view.setFloat32(offset, p.x, true);
    view.setFloat32(offset + 4, p.y, true);
    view.setUint32(offset + 8, p.elapsedMs, true);
    view.setFloat32(offset + 12, p.pressure, true);
  });
  return bytes;
}
export function decodeInkPoints({
  payload,
  pointCount,
  bounds,
  previousElapsedMs = 0,
}: {
  payload: Uint8Array;
  pointCount: number;
  bounds: InkBounds;
  previousElapsedMs?: number;
}): readonly InkPoint[] {
  if (
    !Number.isInteger(pointCount) ||
    pointCount < 1 ||
    pointCount > INK_LIMITS.pointsPerChunk ||
    payload.byteLength !== pointCount * 16
  )
    throw new Error("Invalid ink tuple length");
  const view = new DataView(
      payload.buffer,
      payload.byteOffset,
      payload.byteLength,
    ),
    points: InkPoint[] = [];
  for (let i = 0; i < pointCount; i++) {
    const offset = i * 16;
    points.push({
      x: view.getFloat32(offset, true),
      y: view.getFloat32(offset + 4, true),
      elapsedMs: view.getUint32(offset + 8, true),
      pressure: view.getFloat32(offset + 12, true),
    });
  }
  const normalized = normalizeInkPoints({ points, bounds, previousElapsedMs });
  if (canonical(points) !== canonical(normalized))
    throw new Error("Noncanonical ink points");
  const encoded = encodeInkPoints({
    points: normalized,
    bounds,
    previousElapsedMs,
  });
  if (payload.some((byte, i) => byte !== encoded[i]))
    throw new Error("Noncanonical ink bytes");
  return normalized;
}
export function validateInkChunks({
  chunks,
  bounds,
  firstPointIndex = 0,
  chunkIndex = 0,
  previousElapsedMs = 0,
}: {
  chunks: readonly InkChunk[];
  bounds: InkBounds;
  firstPointIndex?: number;
  chunkIndex?: number;
  previousElapsedMs?: number;
}): { pointCount: number; elapsedMs: number } {
  let count = firstPointIndex,
    index = chunkIndex,
    elapsed = previousElapsedMs;
  for (const chunk of chunks) {
    if (
      chunk.codecVersion !== 1 ||
      chunk.chunkIndex !== index ||
      chunk.firstPointIndex !== count ||
      chunk.payload.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
    )
      throw new Error("Invalid ordered ink chunk");
    const points = decodeInkPoints({
      payload: Uint8Array.from(chunk.payload),
      pointCount: chunk.pointCount,
      bounds,
      previousElapsedMs: elapsed,
    });
    count += points.length;
    elapsed = points.at(-1)?.elapsedMs ?? elapsed;
    index++;
    if (count > INK_LIMITS.pointsPerStroke)
      throw new Error("Stroke point bound reached");
  }
  return { pointCount: count, elapsedMs: elapsed };
}
export function visibleInkStrokes({
  history,
  strokes,
}: {
  history: InkHistory;
  strokes: readonly InkStroke[];
}): readonly StrokeId[] {
  return evaluateInkHistory({ history, strokes }).visible;
}

export function parseInkCommand(input: unknown): InkCommand {
  if (!validateInkCommand(input)) throw new Error("Invalid ink command");
  parseCounter(input.token.generation);
  parseCounter(input.token.revision);
  parseCounter(input.token.inputEpoch);
  return deepFreeze(input);
}
export function parseInkReceipt(input: unknown): InkReceipt {
  if (!validateInkReceipt(input)) throw new Error("Invalid ink receipt");
  parseCounter(input.token.generation);
  parseCounter(input.token.revision);
  parseCounter(input.token.inputEpoch);
  return deepFreeze(input);
}
export function parseInkBrush(input: unknown): BrushSpec {
  if (!validateInkBrush(input)) throw new Error("Invalid ink brush");
  return input;
}
export function parseInkStrokeIds(input: unknown): readonly StrokeId[] {
  if (!validateInkStrokeIds(input)) throw new Error("Invalid ink baseline");
  return input;
}
export function parseInkOperation(input: unknown): InkOperation {
  if (!validateInkOperation(input)) throw new Error("Invalid ink operation");
  parseCounter(input.seq);
  return input;
}

export function parseInkSnapshot(input: unknown): InkSnapshot {
  if (!validateInkSnapshot(input)) throw new Error("Invalid ink snapshot");
  parseDocumentToken(input.token);
  parseCounter(input.nextStrokeOrder);
  for (const stroke of input.strokes) parseCounter(stroke.strokeOrder);
  for (const history of input.histories) {
    for (const counter of [
      history.baseSeq,
      history.cursorSeq,
      history.tipSeq,
      history.nextOpSeq,
    ])
      parseCounter(counter);
    for (const op of history.operations) parseCounter(op.seq);
  }
  return deepFreeze(input);
}
export function parseRecoveryOpening(input: unknown): RecoveryOpening {
  if (!validateRecoveryOpening(input))
    throw new Error("Invalid recovery opening");
  return deepFreeze(input);
}
export function parseRecoveryChoice(input: unknown): RecoveryChoice {
  if (!validateRecoveryChoice(input))
    throw new Error("Invalid recovery choice");
  return deepFreeze(input);
}
export function parseRecoveryInventory(input: unknown): RecoveryInventory {
  if (!validateRecoveryInventory(input))
    throw new Error("Invalid recovery inventory");
  for (const capture of input.captures) parseDocumentToken(capture.token);
  return deepFreeze(input);
}
export function parseDocumentToken(input: unknown): DocumentToken {
  if (!validateDocumentToken(input)) throw new Error("Invalid document token");
  parseCounter(input.generation);
  parseCounter(input.revision);
  parseCounter(input.inputEpoch);
  return deepFreeze(input);
}

export async function prepareInkCommand({
  token,
  edit,
  ids,
  hash,
  reserve,
}: {
  token: DocumentToken;
  edit: InkEdit;
  ids: import("./types.ts").IdFactory;
  hash: import("./types.ts").HashFunction;
  reserve?: (byteLength: number) => void;
}): Promise<InkCommand> {
  const envelope = parseInkCommand({
    kind: "ink",
    commandId: ids(),
    token,
    edit,
    payloadHash: "0".repeat(64),
  });
  reserve?.(inkCommandByteLength(envelope));
  const payloadHash = await hash(canonical({ kind: "ink", token, edit }));
  return parseInkCommand({ ...envelope, payloadHash });
}
export type InkBufferResult = Readonly<
  | { kind: "buffered"; pointCount: number }
  | {
      kind: "fenced";
      reason: "stroke-bound" | "live-buffer-bound";
      retained: readonly InkPoint[];
      unaccepted: readonly InkPoint[];
    }
>;
export function createInkBuffer({
  bounds,
  committedPointCount = 0,
  previousElapsedMs = 0,
}: {
  bounds: InkBounds;
  committedPointCount?: number;
  previousElapsedMs?: number;
}) {
  let points: readonly InkPoint[] = [],
    fenced = false;
  if (
    !Number.isInteger(committedPointCount) ||
    committedPointCount < 0 ||
    committedPointCount > INK_LIMITS.pointsPerStroke
  )
    throw new Error("Invalid committed point count");
  return {
    appendConfirmed({
      samples,
    }: {
      samples: readonly InkSample[];
    }): InkBufferResult {
      if (fenced) throw new Error("Ink buffer is fenced");
      const next = normalizeInkPoints({
        points: samples,
        bounds,
        previousElapsedMs: points.at(-1)?.elapsedMs ?? previousElapsedMs,
      });
      const reason =
        committedPointCount + points.length + next.length >
        INK_LIMITS.pointsPerStroke
          ? "stroke-bound"
          : (points.length + next.length) * 16 > INK_LIMITS.liveBytes
            ? "live-buffer-bound"
            : null;
      if (reason) {
        fenced = true;
        return { kind: "fenced", reason, retained: points, unaccepted: next };
      }
      points = Object.freeze([...points, ...next]);
      return { kind: "buffered", pointCount: points.length };
    },
    seal() {
      fenced = true;
      return points;
    },
    snapshot() {
      return points;
    },
  };
}
export function createInkCommandQueue() {
  let commands: readonly InkCommand[] = [],
    bytes = 0,
    fenced = false;
  return {
    retain({
      command,
    }: {
      command: InkCommand;
    }): Readonly<
      | { kind: "retained" }
      | { kind: "fenced"; reason: "write-queue-bound"; command: InkCommand }
    > {
      const parsed = parseInkCommand(command),
        existing = commands.find(
          (c) =>
            c.commandId === parsed.commandId &&
            c.token.documentId === parsed.token.documentId,
        );
      if (existing) {
        if (canonical(existing) !== canonical(parsed))
          throw new Error("Retained command identity changed");
        return { kind: "retained" };
      }
      if (fenced) throw new Error("Ink write queue is fenced");
      const size = inkCommandByteLength(parsed);
      if (bytes + size > INK_LIMITS.queuedBytes || commands.length >= 256) {
        fenced = true;
        return { kind: "fenced", reason: "write-queue-bound", command: parsed };
      }
      commands = Object.freeze([...commands, parsed]);
      bytes += size;
      return { kind: "retained" };
    },
    acknowledge({ receipt }: { receipt: InkReceipt }) {
      const first = commands[0];
      if (
        !first ||
        first.commandId !== receipt.commandId ||
        canonical({
          ...first.token,
          revision: increment(first.token.revision),
        }) !== canonical(parseInkReceipt(receipt).token)
      )
        throw new Error("Ink queue acknowledgement changed");
      commands = Object.freeze(commands.slice(1));
      bytes = commands.reduce((sum, c) => sum + inkCommandByteLength(c), 0);
    },
    snapshot() {
      return commands;
    },
    byteLength() {
      return bytes;
    },
    fence() {
      fenced = true;
    },
  };
}
export function validateInkDocumentUsage({
  pointCount,
  canonicalByteLength,
}: {
  pointCount: number;
  canonicalByteLength: number;
}): void {
  if (
    !Number.isSafeInteger(pointCount) ||
    pointCount < 0 ||
    pointCount > INK_LIMITS.pointsPerDocument ||
    !Number.isSafeInteger(canonicalByteLength) ||
    canonicalByteLength < 0 ||
    canonicalByteLength > INK_LIMITS.bytesPerDocument
  )
    throw new Error("Ink document bound reached");
}

export type RetainedInkUsage = Readonly<{
  pointCount: number;
  canonicalByteLength: number;
}>;
export function inkSnapshotUsage(value: InkSnapshot): RetainedInkUsage {
  return {
    pointCount: value.strokes.reduce(
      (sum, stroke) => sum + stroke.pointCount,
      0,
    ),
    canonicalByteLength:
      value.strokes.reduce(
        (sum, stroke) =>
          sum + stroke.chunks.reduce((n, chunk) => n + chunk.payload.length, 0),
        0,
      ) +
      utf8ByteLength(
        canonical({
          ...value,
          strokes: value.strokes.map((stroke) => ({
            ...stroke,
            chunks: stroke.chunks.map(({ payload, ...chunk }) => chunk),
          })),
        }),
      ),
  };
}
export type PracticeControlsBinding = Readonly<{
  owner: import("./types.ts").Owner;
  packageHash: import("./types.ts").PackageHash;
  sessionId: import("./types.ts").SessionId;
  runId: import("./types.ts").RunId;
}>;
export type PracticeControlsSummary = Readonly<
  | { kind: "readOnly" }
  | {
      kind: "editable";
      binding: PracticeControlsBinding;
      token: DocumentToken;
      layer: import("./ink-history.ts").ChildPracticeLayer;
      undo: boolean;
      redo: boolean;
      clear: boolean;
      retainedUsage: RetainedInkUsage;
    }
>;
export function summarizePractice({
  binding,
  snapshot,
}: {
  binding: PracticeControlsBinding;
  snapshot: InkSnapshot;
}): PracticeControlsSummary {
  const layer =
    snapshot.token.phase === "childTracing"
      ? "tracing"
      : snapshot.token.phase === "childIndependentWriting"
        ? "independent"
        : null;
  if (
    !snapshot.writable ||
    layer === null ||
    snapshot.strokes.some((s) => s.status === "capturing")
  )
    return { kind: "readOnly" };
  const history = snapshot.histories.find((h) => h.layer === layer);
  if (!history) throw new Error("Practice history missing");
  const { visible } = evaluateInkHistory({
    history,
    strokes: snapshot.strokes,
  });
  return {
    kind: "editable",
    binding,
    token: snapshot.token,
    layer,
    undo: history.cursorSeq !== history.baseSeq,
    redo: history.cursorSeq !== history.tipSeq,
    clear: visible.length > 0,
    retainedUsage: inkSnapshotUsage(snapshot),
  };
}
export function parsePracticeControlsBinding(
  input: unknown,
): PracticeControlsBinding {
  if (!validatePracticeControlsBinding(input))
    throw new Error("Invalid practice controls binding");
  parseCounter(input.owner.generation);
  return deepFreeze(input);
}
export function parsePracticeControlsSummary(
  input: unknown,
): PracticeControlsSummary {
  if (!validatePracticeControlsSummary(input))
    throw new Error("Invalid practice controls summary");
  if (input.kind === "editable") {
    parseDocumentToken(input.token);
    parsePracticeControlsBinding(input.binding);
  }
  return deepFreeze(input);
}
