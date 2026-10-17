import {
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
  TeachingCommand,
} from "@readatthree/teaching";
import type { BrowserTeachingClient } from "./teaching-client.ts";
import { hashText } from "./hash.ts";
import { isTeachingViewport } from "./viewport.ts";

export type ActionRequest =
  | AvailableAction
  | Readonly<{ action: ReviewSelectionAction; choice: ReviewChoice }>;
type PreparedAction = Readonly<{
  command: TeachingCommand;
  origin: Projection;
}>;
type InkRetry =
  | { kind: "inkOnly" }
  | { kind: "action"; request: ActionRequest; origin: Projection };
export type Operation =
  | { kind: "opening" | "idle" }
  | { kind: "preparing"; request: ActionRequest; origin: Projection }
  | { kind: "pending"; prepared: PreparedAction }
  | { kind: "failed"; prepared: PreparedAction; message: string }
  | { kind: "inkFailed"; message: string; retry: InkRetry }
  | { kind: "rejected"; message: string };
export type ControllerState = Readonly<{
  projection: Projection;
  operation: Operation;
  correctionPreview: GraphNode | ControlTurnNode | null;
}>;
export type RenderStroke = Readonly<{
  strokeId: StrokeId;
  layer: "model" | "tracing" | "independent";
  width: number;
  points: readonly InkPoint[];
}>;
type DocumentView = { snapshot: InkSnapshot; strokes: readonly RenderStroke[] };
type PendingInk = Readonly<{
  command: InkCommand;
  through: number;
  chunks: readonly InkChunk[];
}>;
type Capture = {
  strokeId: StrokeId;
  documentId: DocumentToken["documentId"];
  layer: RenderStroke["layer"];
  buffer: ReturnType<typeof createInkBuffer>;
  status: "capturing" | "finished" | "interrupted";
  sent: number;
  chunkIndex: number;
  began: boolean;
  pending: PendingInk | null;
  chunks: readonly InkChunk[];
};
const ids = () => crypto.randomUUID();
const unavailable: Projection = {
  kind: "recovery",
  code: "storage-unavailable",
  message:
    "The saved reading place could not open safely. Keep this window open and retry.",
};
const saveMessage =
  "This save could not be confirmed. Keep this reading window open and retry the same action.";
function owns(view: Projection, command: TeachingCommand) {
  return (
    view.kind !== "recovery" &&
    view.owner.profileId === command.owner.profileId &&
    view.owner.generation === command.owner.generation
  );
}
function writing(
  view: Projection,
): view is Extract<Projection, { kind: "writing" | "writingResult" }> {
  return view.kind === "writing" || view.kind === "writingResult";
}

export function createWritingController(client: BrowserTeachingClient) {
  let state: ControllerState = {
    projection: unavailable,
    operation: { kind: "opening" },
    correctionPreview: null,
  };
  const subscribers = new Set<() => void>();
  const painters = new Set<() => void>();
  const fenceListeners = new Set<() => void>();
  const documents = new Map<DocumentToken["documentId"], DocumentView>();
  let spool: Capture[] = [];
  let active: Capture | null = null;
  let fenced = true;
  let connected = false;
  let opening: Promise<Projection> | null = null;
  let started = false;
  let draining: Promise<void> | null = null;
  const queue = createInkCommandQueue();
  function publish(next: Partial<ControllerState>) {
    state = { ...state, ...next };
    for (const listener of subscribers) listener();
  }
  function paint() {
    for (const listener of painters) listener();
  }
  function fence() {
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
    if (wasConnected && state.operation.kind === "idle")
      publish({
        operation: {
          kind: "inkFailed",
          message: saveMessage,
          retry: { kind: "inkOnly" },
        },
      });
  });
  async function restore(projection: Projection) {
    const next = new Map<DocumentToken["documentId"], DocumentView>();
    if (writing(projection)) {
      for (const token of projection.documents) {
        const snapshot = await client.readInk({ token });
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
        next.set(token.documentId, { snapshot, strokes });
      }
    }
    documents.clear();
    for (const [key, value] of next) documents.set(key, value);
    paint();
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
    const view = documents.get(capture.documentId);
    if (!view) throw new Error("Writing receipt lost its document.");
    view.snapshot = { ...view.snapshot, token: receipt.token };
    capture.sent = pending.through;
    capture.chunkIndex += pending.chunks.length;
    capture.chunks = [...capture.chunks, ...pending.chunks];
    capture.began = true;
    capture.pending = null;
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
    const teachingResult = prepared
      ? await client.recoverTeaching({
          recoveryId: inventory.recoveryId,
          command: prepared.command,
        })
      : null;
    const projection = await client.reconcileRecovery({
      recoveryId: inventory.recoveryId,
      choice:
        retained.length || prepared
          ? { kind: "warm", settledStrokeIds: retainedStrokeIds }
          : { kind: "cold" },
    });
    connected = true;
    return { projection, teachingResult };
  }
  async function open(): Promise<Projection> {
    if (opening) return opening;
    if (started) return state.projection;
    started = true;
    publish({ operation: { kind: "opening" } });
    opening = (async () => {
      try {
        const { projection } = await reconcile();
        await restore(projection);
        publish({
          projection,
          operation: { kind: "idle" },
          correctionPreview: null,
        });
        reopenInput();
        return projection;
      } catch (error) {
        fence();
        const projection: Projection = {
          kind: "recovery",
          code: "storage-initialization-failed",
          message:
            error instanceof Error
              ? error.message
              : "The saved reading place could not open safely. Keep this window open and retry.",
        };
        publish({
          projection,
          operation: {
            kind: "inkFailed",
            message: saveMessage,
            retry: { kind: "inkOnly" },
          },
        });
        return projection;
      } finally {
        opening = null;
      }
    })();
    return opening;
  }
  async function commit(prepared: PreparedAction) {
    publish({ operation: { kind: "pending", prepared } });
    try {
      if (!isTeachingViewport() || document.visibilityState !== "visible")
        throw new Error("Return to the reading window to save this action.");
      const result = await client.dispatch(prepared.command);
      if (result.kind === "rejected") {
        publish({
          operation: {
            kind: "rejected",
            message:
              "The saved reading place changed. Retry to reload it without advancing.",
          },
        });
        return;
      }
      const next = await client.read();
      if (next.kind === "recovery") {
        publish({ projection: next });
        throw new Error("The saved place needs recovery.");
      }
      if (
        next.kind === "entry" ||
        !owns(next, prepared.command) ||
        next.sessionId !== result.sessionId ||
        next.runId !== result.runId ||
        next.packageHash !== result.packageHash
      )
        throw new Error("The saved reading place did not match this save.");
      await restore(next);
      publish({
        projection: next,
        operation: { kind: "idle" },
        correctionPreview: null,
      });
      reopenInput();
    } catch {
      fence();
      publish({
        operation: { kind: "failed", prepared, message: saveMessage },
      });
    }
  }
  async function perform(request: ActionRequest, origin: Projection) {
    try {
      await drain();
    } catch {
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
      const command =
        "intent" in request
          ? writing(origin)
            ? await prepareWritingCommand({
                projection: origin,
                action: request,
                barrier: {
                  kind: "writing",
                  documents: origin.documents.map((token) => {
                    const view = documents.get(token.documentId);
                    if (!view)
                      throw new Error("Writing barrier is unavailable.");
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
              })
          : await prepareCommand({
              projection: origin,
              request: { kind: "review", ...request },
              ids,
              hash: hashText,
            });
      prepared = { command, origin };
    } catch {
      publish({
        operation: {
          kind: "rejected",
          message:
            "This action is unavailable. Retry to reload your saved place without advancing.",
        },
      });
      return;
    }
    await commit(prepared);
  }
  function act(request: ActionRequest) {
    if (
      state.operation.kind !== "idle" ||
      !isTeachingViewport() ||
      document.visibilityState !== "visible"
    )
      return;
    const origin = state.projection;
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
        ? (await drain(),
          { projection: await client.read(), teachingResult: null })
        : await reconcile(
            operation.kind === "failed" ? operation.prepared : null,
          );
      const recovered = recovery.projection;
      if (operation.kind === "failed") {
        const result = recovery.teachingResult;
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
        const next = await client.read();
        if (
          next.kind === "recovery" ||
          next.kind === "entry" ||
          !owns(next, operation.prepared.command) ||
          next.sessionId !== result.sessionId ||
          next.runId !== result.runId ||
          next.packageHash !== result.packageHash
        )
          throw new Error("Recovered teaching did not match its receipt.");
        await restore(next);
        publish({
          projection: next,
          operation: { kind: "idle" },
          correctionPreview: null,
        });
        reopenInput();
      } else {
        await restore(recovered);
        if (operation.kind === "inkFailed" && operation.retry.kind === "action")
          await perform(operation.retry.request, operation.retry.origin);
        else {
          publish({
            projection: recovered,
            operation: { kind: "idle" },
            correctionPreview: null,
          });
          reopenInput();
        }
      }
    } catch {
      publish({
        operation:
          operation.kind === "failed"
            ? { ...operation, message: saveMessage }
            : operation.kind === "inkFailed"
              ? operation
              : {
                  kind: "inkFailed",
                  message: saveMessage,
                  retry: { kind: "inkOnly" },
                },
      });
    }
  }
  async function interrupt() {
    fence();
    if (!connected || state.operation.kind !== "idle") return;
    try {
      await drain();
      reopenInput();
    } catch {
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
  function begin(
    documentId: DocumentToken["documentId"],
    sample: InkSample,
  ): StrokeId | null {
    const view = documents.get(documentId);
    if (
      fenced ||
      active ||
      !view?.snapshot.writable ||
      state.operation.kind !== "idle"
    )
      return null;
    const pointCount =
      view.strokes.reduce((n, stroke) => n + stroke.points.length, 0) +
      spool
        .filter((capture) => capture.documentId === documentId)
        .reduce((n, capture) => n + capture.buffer.snapshot().length, 0);
    if (
      spool.length >= 64 ||
      spool.reduce(
        (n, capture) => n + capture.buffer.snapshot().length * 16,
        0,
      ) +
        16 >
        INK_LIMITS.liveBytes
    ) {
      void interrupt();
      return null;
    }
    try {
      validateInkDocumentUsage({
        pointCount: pointCount + 1,
        canonicalByteLength: (pointCount + 1) * 16,
      });
    } catch {
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          retry: { kind: "inkOnly" },
          message:
            "This writing page is full. Keep your saved work and pause or skip this optional task.",
        },
      });
      return null;
    }
    const capture: Capture = {
      strokeId: parseId({ kind: "stroke", value: ids() }),
      documentId,
      layer: layerForPhase(view.snapshot.token.phase),
      buffer: createInkBuffer({ bounds: view.snapshot.bounds }),
      status: "capturing",
      sent: 0,
      chunkIndex: 0,
      began: false,
      pending: null,
      chunks: [],
    };
    capture.buffer.appendConfirmed({ samples: [sample] });
    active = capture;
    spool.push(capture);
    paint();
    void drain().catch(() => {
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          message: saveMessage,
          retry: { kind: "inkOnly" },
        },
      });
    });
    return capture.strokeId;
  }
  function append(strokeId: StrokeId, samples: readonly InkSample[]) {
    if (
      fenced ||
      active?.strokeId !== strokeId ||
      active.status !== "capturing"
    )
      return;
    const view = documents.get(active.documentId);
    if (!view) return;
    const livePoints = spool.reduce(
      (count, capture) => count + capture.buffer.snapshot().length,
      0,
    );
    const documentPoints =
      view.strokes.reduce((count, stroke) => count + stroke.points.length, 0) +
      spool
        .filter((capture) => capture.documentId === active?.documentId)
        .reduce(
          (count, capture) => count + capture.buffer.snapshot().length,
          0,
        );
    if (
      (livePoints + samples.length) * 16 > INK_LIMITS.liveBytes ||
      documentPoints + samples.length > INK_LIMITS.pointsPerDocument
    ) {
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          message:
            "The writing buffer is full. Confirmed writing has been kept. Retry saving before continuing.",
          retry: { kind: "inkOnly" },
        },
      });
      return;
    }
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
  function finish(strokeId: StrokeId, status: "finished" | "interrupted") {
    if (active?.strokeId !== strokeId) return;
    active.status = status;
    active = null;
    paint();
    void drain().catch(() => {
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
    open,
    act,
    retry,
    async reopen() {
      await retry();
      return state.projection;
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
      window.clearInterval(checkpoint);
      window.removeEventListener("resize", lifecycle);
      window.removeEventListener("orientationchange", lifecycle);
      window.removeEventListener("blur", lifecycle);
      window.removeEventListener("focus", lifecycle);
      window.removeEventListener("pagehide", lifecycle);
      document.removeEventListener("visibilitychange", lifecycle);
      window.visualViewport?.removeEventListener("resize", lifecycle);
      client.close();
    },
  };
}
export type WritingController = ReturnType<typeof createWritingController>;
