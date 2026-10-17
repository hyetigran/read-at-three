import {
  canonical,
  prepareWritingControl,
  summarizePractice,
  inkAdmissionAnchor,
  inkStrokeMetadataReservation,
  inkChunkMetadataReservation,
  inkTailWriteReservation,
  createInkBuffer,
  createInkCommandQueue,
  decodeInkPoints,
  encodeInkPoints,
  INK_LIMITS,
  layerForPhase,
  parseId,
  prepareCommand,
  prepareInkCommand,
  prepareWritingCommand,
  validateInkDocumentUsage,
  visibleInkStrokes,
} from "@readatthree/teaching";
import type {
  AvailableAction,
  ControlTurnNode,
  DocumentToken,
  GraphNode,
  InkChunk,
  InkCommand,
  InkPoint,
  InkReceipt,
  InkSample,
  InkSnapshot,
  Projection,
  ReviewChoice,
  ReviewSelectionAction,
  StrokeId,
  PracticeControl,
  RetainedInkUsage,
  BrushSpec,
  TeachingCommand,
} from "@readatthree/teaching";
import type { InkLifecycleClient } from "./teaching-client.ts";
import type {
  CommittedTeachingExecution,
  PreparedAction,
  ReadExpectation,
  RestoreTeaching,
} from "@readatthree/react-integration";
import { hashText } from "./hash.ts";
import { isTeachingViewport } from "./viewport.ts";

export type ActionRequest =
  | Readonly<{ kind: "practice"; control: PracticeControl }>
  | AvailableAction
  | Readonly<{ action: ReviewSelectionAction; choice: ReviewChoice }>;
type InkRetry =
  | { kind: "inkOnly" }
  | { kind: "action"; request: ActionRequest; origin: Projection };
export type Operation =
  | { kind: "opening" | "idle" }
  | { kind: "openingFailed"; message: string }
  | { kind: "preparing"; request: ActionRequest; origin: Projection }
  | { kind: "pending"; prepared: PreparedAction }
  | { kind: "failed"; prepared: PreparedAction; message: string }
  | { kind: "inkFailed"; message: string; retry: InkRetry }
  | { kind: "rejected"; message: string };
export type ControllerState = Readonly<{
  operation: Operation;
  correctionPreview: GraphNode | ControlTurnNode | null;
  practiceControlsReady: boolean;
}>;
export type RenderStroke = Readonly<{
  strokeId: StrokeId;
  layer: "model" | "tracing" | "independent";
  width: number;
  points: readonly InkPoint[];
}>;
type DocumentView = {
  snapshot: InkSnapshot;
  strokes: readonly RenderStroke[];
  usage: RetainedInkUsage;
};
export type InkContact = Readonly<{
  strokeId: StrokeId;
  originalToken: DocumentToken;
  fenceSerial: number;
}>;
const brushFor = (layer: RenderStroke["layer"]): BrushSpec => ({
  kind: "round",
  width: 5,
  colorRole: layer === "model" ? "model" : "child",
  cap: "round",
  join: "round",
});
type PendingInk = Readonly<{
  command: InkCommand;
  through: number;
  chunks: readonly InkChunk[];
}>;
type Capture = {
  contact: InkContact;
  reserved: Readonly<{ bytes: number; through: number }> | null;
  segmentStart: number;
  strokeId: StrokeId;
  documentId: DocumentToken["documentId"];
  layer: RenderStroke["layer"];
  buffer: ReturnType<typeof createInkBuffer>;
  status: "capturing" | "finished" | "interrupted";
  sent: number;
  chunkIndex: number;
  began: boolean;
  pending: PendingInk | null;
};
const ids = () => crypto.randomUUID();
const saveMessage =
  "This save could not be confirmed. Keep this reading window open and retry the same action.";
function writing(
  view: Projection,
): view is Extract<Projection, { kind: "writing" | "writingResult" }> {
  return view.kind === "writing" || view.kind === "writingResult";
}

export function createWritingController({
  client,
  createTeaching,
}: Readonly<{
  client: InkLifecycleClient;
  createTeaching: (stageRestore: RestoreTeaching) => CommittedTeachingExecution;
}>) {
  let state: ControllerState = {
    operation: { kind: "opening" },
    correctionPreview: null,
    practiceControlsReady: false,
  };
  const subscribers = new Set<() => void>();
  const painters = new Set<() => void>();
  const fenceListeners = new Set<() => void>();
  const documents = new Map<DocumentToken["documentId"], DocumentView>();
  let spool: Capture[] = [];
  let active: Capture | null = null;
  let fenced = true;
  let fenceSerial = 0;
  let operationSerial = 0;
  let closed = false;
  let semanticReservation = 0;
  let connected = false;
  let opening: Promise<void> | null = null;
  let started = false;
  let draining: Promise<void> | null = null;
  const queue = createInkCommandQueue();
  const teaching = createTeaching(stageRestore);
  function refreshExpectation(): ReadExpectation {
    const current = teaching.current();
    return current && current.projection.kind !== "recovery"
      ? {
          kind: "refresh",
          owner: current.projection.owner,
          courseId: current.courseId,
        }
      : { kind: "opening" };
  }
  function publish(next: Partial<ControllerState>) {
    state = { ...state, ...next };
    for (const listener of subscribers) listener();
  }
  function updateReadiness() {
    const summary = teaching.practiceControls.getSnapshot();
    const current = teaching.current()?.projection;
    const bindingMatches =
      summary.kind === "editable" &&
      current?.kind === "writing" &&
      canonical(summary.binding) ===
        canonical({
          owner: current.owner,
          packageHash: current.packageHash,
          sessionId: current.sessionId,
          runId: current.runId,
        });
    const ready =
      bindingMatches &&
      !fenced &&
      connected &&
      state.operation.kind === "idle" &&
      spool.length === 0 &&
      active === null &&
      summary.kind === "editable" &&
      canonical(
        documents.get(summary.token.documentId)?.snapshot.token ?? null,
      ) === canonical(summary.token);
    if (state.practiceControlsReady !== ready)
      publish({ practiceControlsReady: ready });
  }
  const detachControls = teaching.practiceControls.subscribe(updateReadiness);
  function paint() {
    updateReadiness();
    for (const listener of painters) listener();
  }
  function fence() {
    fenceSerial++;
    fenced = true;
    if (active) {
      active.status = "interrupted";
      active = null;
    }
    for (const listener of fenceListeners) listener();
    paint();
  }
  function reopenInput() {
    fenced =
      state.operation.kind !== "idle" ||
      !connected ||
      !isTeachingViewport() ||
      document.visibilityState !== "visible";
    paint();
  }
  client.onLoss(() => {
    const wasConnected = connected;
    connected = false;
    fence();
    teaching.connectionLost();
    if (wasConnected && state.operation.kind === "idle")
      publish({
        operation: {
          kind: "inkFailed",
          message: saveMessage,
          retry: { kind: "inkOnly" },
        },
      });
  });
  async function stageRestore(projection: Projection) {
    const next = new Map<DocumentToken["documentId"], DocumentView>();
    let practiceControls: import("@readatthree/teaching").PracticeControlsSummary =
      { kind: "readOnly" };
    if (writing(projection)) {
      for (const token of projection.documents) {
        const snapshot = await client.readInk({ token });
        if (canonical(snapshot.token) !== canonical(token))
          throw new Error(
            "The restored writing did not match its committed document.",
          );
        const visible = new Set(
          snapshot.histories.flatMap((history) =>
            visibleInkStrokes({ history, strokes: snapshot.strokes }),
          ),
        );
        const strokes = snapshot.strokes
          .filter((stroke) => visible.has(stroke.strokeId))
          .map((stroke) => ({
            strokeId: stroke.strokeId,
            layer: stroke.layer,
            width: stroke.brush.width,
            points: stroke.chunks.flatMap((chunk) =>
              decodeInkPoints({
                payload: Uint8Array.from(chunk.payload),
                pointCount: chunk.pointCount,
                bounds: snapshot.bounds,
              }),
            ),
          }));
        next.set(token.documentId, {
          snapshot,
          strokes,
          usage: inkAdmissionAnchor(snapshot),
        });
        const summary = summarizePractice({
          binding: {
            owner: projection.owner,
            sessionId: projection.sessionId,
            runId: projection.runId,
            packageHash: projection.packageHash,
          },
          snapshot,
        });
        if (summary.kind === "editable") practiceControls = summary;
      }
    }
    return {
      practiceControls,
      activate() {
        documents.clear();
        for (const [key, value] of next) documents.set(key, value);
        paint();
      },
    };
  }
  function chunksFor(
    capture: Capture,
    points: readonly InkPoint[],
    snapshot: InkSnapshot,
  ): readonly InkChunk[] {
    const chunks: InkChunk[] = [];
    for (
      let offset = capture.sent;
      offset < points.length;
      offset += INK_LIMITS.pointsPerChunk
    ) {
      const part = points.slice(offset, offset + INK_LIMITS.pointsPerChunk);
      chunks.push({
        chunkIndex: capture.chunkIndex + chunks.length,
        firstPointIndex: offset,
        pointCount: part.length,
        codecVersion: 1,
        payload: Array.from(
          encodeInkPoints({
            points: part,
            bounds: snapshot.bounds,
            previousElapsedMs: points[offset - 1]?.elapsedMs ?? 0,
          }),
        ),
      });
    }
    return chunks;
  }
  function writeReservation(
    input: Readonly<
      | { kind: "current" }
      | { kind: "samples"; capture: Capture; pointCount: number }
      | {
          kind: "prepared";
          capture: Capture;
          reservation: Exclude<Capture["reserved"], null>;
        }
    > = { kind: "current" },
  ) {
    return (
      semanticReservation +
      spool.reduce((sum, capture) => {
        const view = documents.get(capture.documentId);
        if (!view) throw new Error("Writing reservation binding missing");
        const reservation =
          input.kind === "prepared" && input.capture === capture
            ? input.reservation
            : capture.reserved;
        const count =
          input.kind === "samples" && input.capture === capture
            ? input.pointCount
            : capture.buffer.snapshot().length;
        const tail = count - (reservation?.through ?? capture.sent);
        return (
          sum +
          (reservation?.bytes ?? 0) +
          ((tail > 0 || !capture.began || capture.status !== "capturing") &&
          !(reservation && tail === 0)
            ? inkTailWriteReservation({
                token: view.snapshot.token,
                strokeId: capture.strokeId,
                layer: capture.layer,
                brush: brushFor(capture.layer),
                pointCount: tail,
              })
            : 0)
        );
      }, 0)
    );
  }
  function checkOperation(ticket: number) {
    if (closed || operationSerial !== ticket)
      throw new Error("A newer writing operation replaced this attempt.");
  }
  async function prepare(capture: Capture) {
    if (capture.pending) return capture.pending;
    const view = documents.get(capture.documentId);
    if (!view) throw new Error("Retained writing binding is unavailable.");
    const points = capture.buffer.snapshot();
    const chunks = chunksFor(capture, points, view.snapshot);
    const edit = !capture.began
      ? ({
          kind: "begin",
          strokeId: capture.strokeId,
          layer: capture.layer,
          brush: {
            kind: "round",
            width: 5,
            colorRole: capture.layer === "model" ? "model" : "child",
            cap: "round",
            join: "round",
          },
          chunks,
        } satisfies Parameters<typeof prepareInkCommand>[0]["edit"])
      : capture.status === "capturing"
        ? ({
            kind: "checkpoint",
            strokeId: capture.strokeId,
            layer: capture.layer,
            chunks,
          } satisfies Parameters<typeof prepareInkCommand>[0]["edit"])
        : ({
            kind: "finalize",
            strokeId: capture.strokeId,
            layer: capture.layer,
            chunks,
            status: capture.status,
          } satisfies Parameters<typeof prepareInkCommand>[0]["edit"]);
    const command = await prepareInkCommand({
      token: view.snapshot.token,
      edit,
      ids,
      hash: hashText,
      reserve(bytes) {
        const reservation = { bytes, through: points.length };
        if (
          writeReservation({ kind: "prepared", capture, reservation }) >
          INK_LIMITS.queuedBytes
        )
          throw new Error("Writing queue reservation full");
        capture.reserved = reservation;
        capture.segmentStart = points.length;
      },
    });
    const pending = { command, through: points.length, chunks };
    capture.pending = pending;
    const retained = queue.retain({ command });
    if (retained.kind === "fenced")
      throw new Error(
        "Writing save buffer is full. Retained writing needs recovery.",
      );
    return pending;
  }
  function acknowledge(
    capture: Capture,
    pending: PendingInk,
    receipt: InkReceipt,
  ) {
    queue.acknowledge({ receipt });
    teaching.inkCommitted({ token: receipt.token });
    const view = documents.get(capture.documentId);
    if (!view) throw new Error("Writing receipt lost its document.");
    view.snapshot = { ...view.snapshot, token: receipt.token };
    capture.sent = pending.through;
    capture.chunkIndex += pending.chunks.length;
    capture.began = true;
    capture.pending = null;
    capture.reserved = null;
    if (pending.command.edit.kind === "finalize") {
      view.strokes = [
        ...view.strokes,
        {
          strokeId: capture.strokeId,
          layer: capture.layer,
          width: 5,
          points: capture.buffer.snapshot(),
        },
      ];
      spool = spool.filter((item) => item !== capture);
      teaching.captureFinalized({ token: receipt.token });
    }
    paint();
  }
  async function send(capture: Capture, recoveryId?: string) {
    const pending = await prepare(capture);
    const result =
      recoveryId === undefined
        ? await client.dispatchInk(pending.command)
        : await client.recoverInk({ recoveryId, command: pending.command });
    if (result.kind !== "inkCommitted")
      throw new Error(
        "The writing binding changed. Retained writing needs recovery.",
      );
    acknowledge(capture, pending, result);
  }
  async function drain() {
    if (draining) {
      await draining;
      if (spool.some((capture) => capture.status !== "capturing"))
        return drain();
      return;
    }
    draining = (async () => {
      while (spool.length) {
        const capture = spool[0];
        if (!capture) break;
        if (
          capture.began &&
          capture.status === "capturing" &&
          capture.sent === capture.buffer.snapshot().length
        )
          break;
        await send(capture);
        if (capture.status === "capturing") break;
      }
    })();
    try {
      await draining;
    } finally {
      draining = null;
    }
  }
  async function reconcile(prepared: PreparedAction | null = null) {
    fence();
    const retained = [...spool];
    const retainedStrokeIds = retained.map((capture) => capture.strokeId);
    const inventory = await client.connect(
      retained.length || prepared
        ? {
            kind: "warm",
            retainedStrokeIds,
            teaching: prepared
              ? {
                  kind: "pending",
                  commandId: prepared.command.commandId,
                  payloadHash: prepared.command.payloadHash,
                }
              : { kind: "none" },
          }
        : { kind: "cold" },
    );
    for (const capture of retained) {
      capture.status = "interrupted";
      while (spool.includes(capture)) await send(capture, inventory.recoveryId);
    }
    const attempt = prepared
      ? await teaching.execute({
          kind: "closedRecovery",
          recoveryId: inventory.recoveryId,
          prepared,
        })
      : null;
    if (attempt && attempt.kind !== "resolved")
      throw new Error("Closed recovery cannot publish teaching.");
    const projection = await client.reconcileRecovery({
      recoveryId: inventory.recoveryId,
      choice:
        retained.length || prepared
          ? { kind: "warm", settledStrokeIds: retainedStrokeIds }
          : { kind: "cold" },
    });
    connected = true;
    return { result: attempt?.result ?? null, projection };
  }
  async function open(): Promise<void> {
    if (opening) return opening;
    if (started) return;
    started = true;
    const ticket = ++operationSerial;
    publish({ operation: { kind: "opening" } });
    opening = (async () => {
      try {
        await reconcile();
        checkOperation(ticket);
        await teaching.read({ expectation: refreshExpectation() });
        checkOperation(ticket);
        publish({ operation: { kind: "idle" }, correctionPreview: null });
        reopenInput();
      } catch (error) {
        if (closed || operationSerial !== ticket) return;
        fence();
        publish({
          operation: {
            kind: "openingFailed",
            message:
              error instanceof Error
                ? error.message
                : "The saved place could not be opened.",
          },
        });
      } finally {
        opening = null;
      }
    })();
    return opening;
  }
  async function commit(prepared: PreparedAction, ticket = operationSerial) {
    checkOperation(ticket);
    publish({ operation: { kind: "pending", prepared } });
    try {
      if (!isTeachingViewport() || document.visibilityState !== "visible")
        throw new Error("Return to the reading window to save this action.");
      const result = await teaching.execute({ kind: "normal", prepared });
      checkOperation(ticket);
      semanticReservation = 0;
      if (result.kind === "resolved") {
        publish({
          operation: {
            kind: "rejected",
            message:
              "The saved reading place changed. Retry to reload it without advancing.",
          },
        });
        return;
      }
      publish({ operation: { kind: "idle" }, correctionPreview: null });
      reopenInput();
    } catch {
      if (operationSerial !== ticket) return;
      fence();
      publish({
        operation: { kind: "failed", prepared, message: saveMessage },
      });
    }
  }
  async function perform(
    request: ActionRequest,
    origin: Projection,
    ticket = operationSerial,
  ) {
    try {
      await drain();
      checkOperation(ticket);
    } catch {
      if (operationSerial !== ticket) return;
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          message: saveMessage,
          retry: { kind: "action", request, origin },
        },
      });
      return;
    }
    let prepared: PreparedAction;
    try {
      if ("kind" in request) {
        await teaching.read({ expectation: refreshExpectation() });
        checkOperation(ticket);
        const current = teaching.current()?.projection;
        const summary = teaching.practiceControls.getSnapshot();
        if (
          !current ||
          current.kind !== "writing" ||
          summary.kind !== "editable"
        )
          throw new Error("Practice unavailable");
        origin = current;
      }
      let command: TeachingCommand;
      if ("kind" in request) {
        const summary = teaching.practiceControls.getSnapshot();
        if (summary.kind !== "editable" || origin.kind !== "writing")
          throw new Error("Practice unavailable");
        command = await prepareWritingControl({
          projection: origin,
          control: request.control,
          documentId: summary.token.documentId,
          layer: summary.layer,
          barrier: { kind: "writing", documents: origin.documents },
          ids,
          hash: hashText,
          reserve(envelope) {
            const bytes = new TextEncoder().encode(envelope).byteLength;
            if (writeReservation() + bytes > INK_LIMITS.queuedBytes)
              throw new Error("Practice queue reservation full");
            semanticReservation = bytes;
          },
        });
      } else if ("intent" in request) {
        command = writing(origin)
          ? await prepareWritingCommand({
              projection: origin,
              action: request,
              barrier: {
                kind: "writing",
                documents: origin.documents.map((token) => {
                  const view = documents.get(token.documentId);
                  if (!view) throw new Error("Writing barrier is unavailable.");
                  return view.snapshot.token;
                }),
              },
              ids,
              hash: hashText,
            })
          : await prepareCommand({
              projection: origin,
              request: { kind: "action", action: request },
              ids,
              hash: hashText,
            });
      } else if ("choice" in request) {
        command = await prepareCommand({
          projection: origin,
          request: { kind: "review", ...request },
          ids,
          hash: hashText,
        });
      } else {
        const exhaustive: never = request;
        return exhaustive;
      }
      checkOperation(ticket);
      prepared = { command, origin };
    } catch {
      if (closed || operationSerial !== ticket) return;
      semanticReservation = 0;
      publish({
        operation: {
          kind: "rejected",
          message:
            "This action is unavailable. Retry to reload your saved place without advancing.",
        },
      });
      return;
    }
    await commit(prepared, ticket);
  }
  function act(request: ActionRequest) {
    if (
      state.operation.kind !== "idle" ||
      !isTeachingViewport() ||
      document.visibilityState !== "visible"
    )
      return;
    const origin = teaching.current()?.projection;
    if (!origin) return;
    operationSerial++;
    fence();
    publish({
      operation: { kind: "preparing", request, origin },
      correctionPreview:
        "correctionPreview" in request ? request.correctionPreview : null,
    });
    void perform(request, origin);
  }
  async function retry() {
    const operation = state.operation;
    if (
      operation.kind === "opening" ||
      operation.kind === "pending" ||
      operation.kind === "preparing" ||
      !isTeachingViewport() ||
      document.visibilityState !== "visible"
    )
      return;
    const ticket = ++operationSerial;
    fence();
    publish({ operation: { kind: "opening" } });
    try {
      if (draining) {
        try {
          await draining;
        } catch {}
      }
      if (operation.kind === "failed" && connected) {
        await commit(operation.prepared);
        return;
      }
      const recovery = connected
        ? (await drain(), null)
        : await reconcile(
            operation.kind === "failed" ? operation.prepared : null,
          );
      checkOperation(ticket);
      if (operation.kind === "failed") {
        const result = recovery?.result;
        if (!result || result.kind === "rejected") {
          publish({
            operation: {
              kind: "rejected",
              message:
                "The saved reading place changed. Retry to reload it without advancing.",
            },
          });
          return;
        }
        const current = teaching.current();
        if (!current)
          throw new Error("The retained reading course is unavailable.");
        await teaching.read({
          expectation: {
            kind: "receipt",
            courseId: current.courseId,
            prepared: operation.prepared,
            receipt: result,
            restoreBinding: recovery
              ? { kind: "reconciled", projection: recovery.projection }
              : { kind: "normal" },
          },
        });
        checkOperation(ticket);
        semanticReservation = 0;
        publish({ operation: { kind: "idle" }, correctionPreview: null });
        reopenInput();
      } else {
        await teaching.read({ expectation: refreshExpectation() });
        checkOperation(ticket);
        semanticReservation = 0;
        if (operation.kind === "inkFailed" && operation.retry.kind === "action")
          await perform(operation.retry.request, operation.retry.origin);
        else {
          publish({ operation: { kind: "idle" }, correctionPreview: null });
          reopenInput();
        }
      }
    } catch (error) {
      if (operationSerial !== ticket) return;
      fence();
      publish({
        operation:
          operation.kind === "failed"
            ? { ...operation, message: saveMessage }
            : operation.kind === "inkFailed"
              ? operation
              : operation.kind === "openingFailed"
                ? {
                    kind: "openingFailed",
                    message:
                      error instanceof Error
                        ? error.message
                        : operation.message,
                  }
                : {
                    kind: "inkFailed",
                    message: saveMessage,
                    retry: { kind: "inkOnly" },
                  },
      });
    }
  }
  async function interrupt() {
    const ticket = operationSerial;
    fence();
    if (!connected || state.operation.kind !== "idle") return;
    try {
      await drain();
      checkOperation(ticket);
      reopenInput();
    } catch {
      if (
        closed ||
        operationSerial !== ticket ||
        state.operation.kind !== "idle"
      )
        return;
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          message: saveMessage,
          retry: { kind: "inkOnly" },
        },
      });
    }
  }
  function admit(capture: Capture, count: number, first: boolean) {
    const view = documents.get(capture.documentId);
    if (!view) return false;
    const oldCount = capture.buffer.snapshot().length;
    const oldSegments = Math.ceil(
      (oldCount - capture.segmentStart) / INK_LIMITS.pointsPerChunk,
    );
    const newSegments = Math.ceil(
      (oldCount + count - capture.segmentStart) / INK_LIMITS.pointsPerChunk,
    );
    const metadata =
      (newSegments - oldSegments) * inkChunkMetadataReservation +
      (first
        ? inkStrokeMetadataReservation({
            strokeId: capture.strokeId,
            layer: capture.layer,
            brush: brushFor(capture.layer),
          })
        : 0);
    try {
      validateInkDocumentUsage({
        pointCount: view.usage.pointCount + count,
        canonicalByteLength:
          view.usage.canonicalByteLength + count * 16 + metadata,
      });
      if (
        spool.reduce(
          (sum, item) => sum + item.buffer.snapshot().length * 16,
          0,
        ) +
          count * 16 >
          INK_LIMITS.liveBytes ||
        writeReservation({
          kind: "samples",
          capture,
          pointCount: oldCount + count,
        }) > INK_LIMITS.queuedBytes
      )
        throw new Error("Writing reservation full");
      view.usage = {
        pointCount: view.usage.pointCount + count,
        canonicalByteLength:
          view.usage.canonicalByteLength + count * 16 + metadata,
      };
      return true;
    } catch {
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          retry: { kind: "inkOnly" },
          message:
            "This writing buffer is full. Confirmed writing is kept. Retry saving before continuing.",
        },
      });
      void drain().catch(() => {});
      return false;
    }
  }
  function begin(
    documentId: DocumentToken["documentId"],
    sample: InkSample,
  ): InkContact | null {
    const view = documents.get(documentId);
    if (
      fenced ||
      active ||
      !view?.snapshot.writable ||
      state.operation.kind !== "idle"
    )
      return null;
    if (spool.length >= 64) {
      void interrupt();
      return null;
    }
    const strokeId = parseId({ kind: "stroke", value: ids() });
    const layer = layerForPhase(view.snapshot.token.phase);
    const contact = Object.freeze({
      strokeId,
      originalToken: view.snapshot.token,
      fenceSerial,
    });
    const capture: Capture = {
      strokeId,
      contact,
      reserved: null,
      segmentStart: 0,
      documentId,
      layer: layerForPhase(view.snapshot.token.phase),
      buffer: createInkBuffer({ bounds: view.snapshot.bounds }),
      status: "capturing",
      sent: 0,
      chunkIndex: 0,
      began: false,
      pending: null,
    };
    spool.push(capture);
    if (!admit(capture, 1, true)) {
      spool = spool.filter((item) => item !== capture);
      return null;
    }
    capture.buffer.appendConfirmed({ samples: [sample] });
    active = capture;
    paint();
    void drain().catch(() => {
      if (closed || state.operation.kind !== "idle") return;
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          message: saveMessage,
          retry: { kind: "inkOnly" },
        },
      });
    });
    return contact;
  }
  function append(contact: InkContact, samples: readonly InkSample[]) {
    if (
      fenced ||
      active?.contact !== contact ||
      contact.fenceSerial !== fenceSerial ||
      active.status !== "capturing"
    )
      return;
    const view = documents.get(active.documentId);
    if (!view) return;
    if (!admit(active, samples.length, false)) return;
    const result = active.buffer.appendConfirmed({ samples });
    if (result.kind === "fenced") {
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          retry: { kind: "inkOnly" },
          message:
            "The writing buffer is full. Confirmed writing has been kept. Retry saving before continuing.",
        },
      });
      return;
    }
    paint();
  }
  function finish(contact: InkContact, status: "finished" | "interrupted") {
    if (active?.contact !== contact || contact.fenceSerial !== fenceSerial)
      return;
    active.status = status;
    active = null;
    paint();
    void drain().catch(() => {
      if (closed || state.operation.kind !== "idle") return;
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          message: saveMessage,
          retry: { kind: "inkOnly" },
        },
      });
    });
  }
  const checkpoint = window.setInterval(() => {
    if (!connected || !active || state.operation.kind !== "idle") return;
    void drain().catch(() => {
      if (closed || state.operation.kind !== "idle") return;
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          message: saveMessage,
          retry: { kind: "inkOnly" },
        },
      });
    });
  }, 750);
  const lifecycle = () => {
    void interrupt();
  };
  window.addEventListener("resize", lifecycle);
  window.addEventListener("orientationchange", lifecycle);
  window.addEventListener("blur", lifecycle);
  window.addEventListener("focus", lifecycle);
  window.addEventListener("pagehide", lifecycle);
  document.addEventListener("visibilitychange", lifecycle);
  window.visualViewport?.addEventListener("resize", lifecycle);
  return {
    committed: teaching.view,
    open,
    act,
    editPractice(control: PracticeControl) {
      updateReadiness();
      if (state.practiceControlsReady) act({ kind: "practice", control });
    },
    practiceControls: teaching.practiceControls,
    retry,
    async reopen() {
      await retry();
    },
    interrupt,
    begin,
    append,
    finish,
    getState: () => state,
    subscribe(listener: () => void) {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },
    subscribePaint(listener: () => void) {
      painters.add(listener);
      return () => {
        painters.delete(listener);
      };
    },
    subscribeFence(listener: () => void) {
      fenceListeners.add(listener);
      return () => {
        fenceListeners.delete(listener);
      };
    },
    getBoard() {
      return [...documents.values()].map((view) => ({
        snapshot: view.snapshot,
        strokes: [
          ...view.strokes,
          ...spool
            .filter(
              (capture) =>
                capture.documentId === view.snapshot.token.documentId,
            )
            .map((capture) => ({
              strokeId: capture.strokeId,
              layer: capture.layer,
              width: 5,
              points: capture.buffer.snapshot(),
            })),
        ],
      }));
    },
    canWrite: () => !fenced && state.operation.kind === "idle",
    close() {
      closed = true;
      operationSerial++;
      window.clearInterval(checkpoint);
      window.removeEventListener("resize", lifecycle);
      window.removeEventListener("orientationchange", lifecycle);
      window.removeEventListener("blur", lifecycle);
      window.removeEventListener("focus", lifecycle);
      window.removeEventListener("pagehide", lifecycle);
      document.removeEventListener("visibilitychange", lifecycle);
      window.visualViewport?.removeEventListener("resize", lifecycle);
      detachControls();
      teaching.close();
      client.close();
    },
  };
}
export type WritingController = ReturnType<typeof createWritingController>;
