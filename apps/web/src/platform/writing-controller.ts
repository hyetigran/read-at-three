import {
  StorageCapacityError,
  isStorageCapacityError,
} from "./storage-capacity.ts";
import {
  InstalledResourceUnavailableError,
  canonical,
  prepareWritingControl,
  parseSelectedOperation,
  prepareProfileAdministration,
  prepareProfileRemoval,
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
  InstalledResourceFailure,
  AvailableAction,
  ControlTurnNode,
  DocumentToken,
  PrintedNode,
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
  SelectedOwnerWitness,
  SelectedInkOperation,
  ProfileDirectory,
  ProfileAdministrationIntent,
  ProfileRemovalIntent,
  ProfileRemovalCommand,
  ProfileAdministrationCommand,
  ProfileAdministrationReceipt,
  CommandRejection,
  Counter,
} from "@readatthree/teaching";
import type { InkLifecycleClient } from "./teaching-client.ts";
import type {
  CommittedTeachingExecution,
  PreparedAction,
  ReadExpectation,
  RestoreTeaching,
  ReadEnvelope,
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
  | {
      kind: "adminPreparing";
      intent: ProfileAdministrationIntent | ProfileRemovalIntent;
    }
  | { kind: "adminSaving"; command: ProfileAdministrationCommand }
  | {
      kind: "adminFailed";
      command: ProfileAdministrationCommand;
      message: string;
    }
  | { kind: "adopting"; receipt: ProfileAdministrationReceipt }
  | {
      kind: "adoptionFailed";
      receipt: ProfileAdministrationReceipt;
      message: string;
    }
  | { kind: "rejected"; message: string };
type RecoveryObligation = Extract<
  Operation,
  {
    kind:
      | "failed"
      | "inkFailed"
      | "adminFailed"
      | "adoptionFailed"
      | "openingFailed";
  }
>;
export type AdministrationOutcome =
  | Readonly<{
      kind: "visible" | "resolved";
      receipt: ProfileAdministrationReceipt;
    }>
  | Readonly<{ kind: "held" }>
  | CommandRejection;
export type ControllerState = Readonly<{
  resourceBlock: InstalledResourceFailure | null;
  operation: Operation;
  correctionPreview: PrintedNode | ControlTurnNode | null;
  practiceControlsReady: boolean;
  inputSuspended: boolean;
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
  startedAt: number;
  selection: SelectedOwnerWitness;
  connectionTicket: number;
}>;
const brushFor = (layer: RenderStroke["layer"]): BrushSpec => ({
  kind: "round",
  width: 5,
  colorRole: layer === "model" ? "model" : "child",
  cap: "round",
  join: "round",
});
type PendingInk = Readonly<{
  operation: SelectedInkOperation;
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
function saveFailureMessage(error: unknown): string {
  return isStorageCapacityError(error)
    ? new StorageCapacityError().message
    : saveMessage;
}
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
  initialSurface = "teaching",
}: Readonly<{
  client: InkLifecycleClient;
  initialSurface?: "teaching" | "other";
  createTeaching: (stageRestore: RestoreTeaching) => CommittedTeachingExecution;
}>) {
  let state: ControllerState = {
    resourceBlock: null,
    operation: { kind: "opening" },
    correctionPreview: null,
    practiceControlsReady: false,
    inputSuspended: initialSurface !== "teaching",
  };
  const subscribers = new Set<() => void>();
  const painters = new Set<() => void>();
  const fenceListeners = new Set<() => void>();
  const documents = new Map<DocumentToken["documentId"], DocumentView>();
  let spool: Capture[] = [];
  let active: Capture | null = null;
  let routeSuspended = initialSurface !== "teaching";
  let focused = true;
  let pageHidden = false;
  let visiting: Promise<boolean> | null = null;
  let fenced = true;
  let fenceSerial = 0;
  let inputEligibleAt = performance.now();
  let operationSerial = 0;
  let transportGeneration = 0;
  let resourceSurfaceRevision = 0;
  let resourceSurfaceKey: string | null = null;
  let closed = false;
  let semanticReservation = 0;
  let connected = false;
  let discovered: ProfileDirectory | null = null;
  let directorySerial = 0;
  let minimumAdministration: Counter | null = null;
  let opening: Promise<void> | null = null;
  let started = false;
  let draining: Promise<void> | null = null;
  let recoveryObligation: RecoveryObligation | null = null;
  let queue = createInkCommandQueue();
  const teaching = createTeaching(stageRestore);
  function refreshExpectation(): ReadExpectation {
    const current = teaching.current();
    return current &&
      current.projection.kind !== "recovery" &&
      (!discovered ||
        canonical(discovered.selection) ===
          canonical(current.directory.selection))
      ? {
          kind: "refresh",
          selection: current.directory.selection,
          courseId: current.courseId,
        }
      : discovered
        ? { kind: "opening", selection: discovered.selection }
        : (() => {
            throw new Error("Selected directory has not been discovered.");
          })();
  }
  function resourceContext() {
    return {
      operation: operationSerial,
      transport: transportGeneration,
      surface: resourceSurfaceRevision,
    };
  }
  function observeResourceFailure(
    error: unknown,
    context: ReturnType<typeof resourceContext>,
  ) {
    if (
      !closed &&
      context.operation === operationSerial &&
      context.transport === transportGeneration &&
      context.surface === resourceSurfaceRevision &&
      error instanceof InstalledResourceUnavailableError
    ) {
      fence();
      publish({ resourceBlock: error.failure });
    }
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
    inputEligibleAt = performance.now();
    fenced = true;
    if (active) {
      active.status = "interrupted";
      active = null;
    }
    for (const listener of fenceListeners) listener();
    paint();
  }
  function inputIsSuspended(): boolean {
    return (
      state.resourceBlock !== null ||
      routeSuspended ||
      !focused ||
      pageHidden ||
      !isTeachingViewport() ||
      document.visibilityState !== "visible"
    );
  }
  function reopenInput() {
    const wasFenced = fenced;
    const suspended = inputIsSuspended();
    fenced = suspended || state.operation.kind !== "idle" || !connected;
    if (state.inputSuspended !== suspended)
      publish({ inputSuspended: suspended });
    if (wasFenced && !fenced) inputEligibleAt = performance.now();
    paint();
  }
  client.onLoss(() => {
    transportGeneration++;
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
  async function stageRestore(read: ReadEnvelope) {
    const projection = read.projection;
    const connection = client.connectionTicket();
    const next = new Map<DocumentToken["documentId"], DocumentView>();
    let practiceControls: import("@readatthree/teaching").PracticeControlsSummary =
      { kind: "readOnly" };
    if (writing(projection)) {
      for (const token of projection.documents) {
        const restored = await client.readInk({
          selection: read.directory.selection,
          token,
        });
        if (
          connection !== client.connectionTicket() ||
          canonical(restored.selection) !== canonical(read.directory.selection)
        )
          throw new Error("The writing restoration lease changed.");
        const snapshot = restored.value;
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
        if (connection !== client.connectionTicket())
          throw new Error("The writing restoration connection changed.");
        documents.clear();
        for (const [key, value] of next) documents.set(key, value);
        discovered = read.directory;
      },
      publish: paint,
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
  function checkTransport(ticket: number) {
    if (closed || transportGeneration !== ticket)
      throw new Error("The retained writing transport was retired.");
  }
  async function prepare(capture: Capture) {
    const ticket = transportGeneration;
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
        checkTransport(ticket);
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
    checkTransport(ticket);
    const operation = parseSelectedOperation({
      kind: "ink",
      selection: capture.contact.selection,
      command,
    });
    if (operation.kind !== "ink")
      throw new Error("Retained ink operation required.");
    const pending = { operation, through: points.length, chunks };
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
    if (pending.operation.command.edit.kind === "finalize") {
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
    const ticket = transportGeneration;
    const pending = await prepare(capture);
    checkTransport(ticket);
    let result: import("@readatthree/teaching").InkResult;
    if (recoveryId === undefined) {
      const connection = client.connectionTicket();
      const response = await client.execute(pending.operation);
      if (connection !== client.connectionTicket())
        throw new Error(
          "The ink connection lease changed before acknowledgement.",
        );
      if (response.kind !== "ink") throw new Error("Ink result required.");
      if (
        response.result.kind === "inkCommitted" &&
        canonical(response.selection) !== canonical(pending.operation.selection)
      )
        throw new Error("Retired ink result cannot publish.");
      result = response.result;
    } else {
      result = (
        await client.recoverInk({ recoveryId, operation: pending.operation })
      ).result;
    }
    checkTransport(ticket);
    if (result.kind !== "inkCommitted")
      throw new Error(
        "The writing binding changed. Retained writing needs recovery.",
      );
    acknowledge(capture, pending, result);
  }
  async function drain() {
    const ticket = transportGeneration;
    if (draining) {
      await draining;
      checkTransport(ticket);
      if (spool.some((capture) => capture.status !== "capturing"))
        return drain();
      return;
    }
    const attempt = (async () => {
      while (spool.length) {
        checkTransport(ticket);
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
    draining = attempt;
    try {
      await attempt;
    } finally {
      if (draining === attempt) draining = null;
    }
  }
  async function reconcile(
    prepared: PreparedAction | null = null,
    administration: ProfileAdministrationCommand | null = null,
  ) {
    const ticket = operationSerial;
    fence();
    const retained = [...spool];
    const retainedStrokeIds = retained.map((capture) => capture.strokeId);
    const selection =
      prepared?.operation.selection ??
      administration?.selection ??
      retained[0]?.contact.selection ??
      teaching.current()?.directory.selection ??
      discovered?.selection;
    if ((retained.length || prepared || administration) && !selection)
      throw new Error("Retained selected lifetime is unavailable.");
    const resource = resourceContext();
    const connecting = client.connect(
      selection && (retained.length || prepared || administration)
        ? {
            kind: "warm",
            selection,
            retainedStrokeIds,
            teaching: prepared?.operation ?? null,
            administration,
          }
        : { kind: "cold" },
    );
    resource.transport = transportGeneration;
    try {
      const inventory = await connecting;
      checkOperation(ticket);
      for (const capture of retained) {
        capture.status = "interrupted";
        while (spool.includes(capture))
          await send(capture, inventory.recoveryId);
      }
      const attempt = prepared
        ? await teaching.execute({
            kind: "closedRecovery",
            recoveryId: inventory.recoveryId,
            prepared,
          })
        : null;
      checkOperation(ticket);
      if (attempt && attempt.kind !== "resolved")
        throw new Error("Closed recovery cannot publish teaching.");
      const administrative = administration
        ? await client.recoverAdministration({
            recoveryId: inventory.recoveryId,
            command: administration,
          })
        : null;
      checkOperation(ticket);
      const directory = await client.reconcileRecovery({
        recoveryId: inventory.recoveryId,
        choice:
          retained.length || prepared || administration
            ? { kind: "warm", settledStrokeIds: retainedStrokeIds }
            : { kind: "cold" },
      });
      checkOperation(ticket);
      discovered = directory;
      connected = true;
      return {
        result: attempt?.result ?? null,
        administrative: administrative?.result ?? null,
        directory,
        transport: resource.transport,
      };
    } catch (error) {
      observeResourceFailure(error, resource);
      throw error;
    }
  }
  async function open(): Promise<void> {
    if (opening) return opening;
    if (started) return;
    started = true;
    const ticket = ++operationSerial;
    let resource = resourceContext();
    publish({ operation: { kind: "opening" } });
    opening = (async () => {
      try {
        const recovery = await reconcile();
        checkOperation(ticket);
        resource = { ...resource, transport: recovery.transport };
        await teaching.read({ expectation: refreshExpectation() });
        checkOperation(ticket);
        publish({ operation: { kind: "idle" }, correctionPreview: null });
        reopenInput();
      } catch (error) {
        observeResourceFailure(error, resource);
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
        if (operationSerial === ticket) opening = null;
      }
    })();
    return opening;
  }
  async function commit(prepared: PreparedAction, ticket = operationSerial) {
    const resource = resourceContext();
    checkOperation(ticket);
    publish({ operation: { kind: "pending", prepared } });
    try {
      const pausing =
        "action" in prepared.operation.command.payload &&
        prepared.operation.command.payload.action.kind === "pause";
      if (
        !pausing &&
        (!isTeachingViewport() || document.visibilityState !== "visible")
      )
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
    } catch (error) {
      observeResourceFailure(error, resource);
      if (operationSerial !== ticket) return;
      fence();
      publish({
        operation: {
          kind: "failed",
          prepared,
          message: saveFailureMessage(error),
        },
      });
    }
  }
  async function perform(
    request: ActionRequest,
    origin: Projection,
    ticket = operationSerial,
  ) {
    const resource = resourceContext();
    try {
      await drain();
      checkOperation(ticket);
    } catch (error) {
      observeResourceFailure(error, resource);
      if (operationSerial !== ticket) return;
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          message: saveFailureMessage(error),
          retry: { kind: "action", request, origin },
        },
      });
      return;
    }
    let prepared: PreparedAction;
    const source = teaching.current();
    if (!source) throw new Error("Selected teaching source is unavailable.");
    const selection = source.directory.selection;
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
      const operation = parseSelectedOperation({
        kind: "teaching",
        selection,
        command,
      });
      if (operation.kind !== "teaching")
        throw new Error("Prepared teaching operation required.");
      prepared = { operation, origin };
    } catch (error) {
      observeResourceFailure(error, resource);
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
  async function enter(request: ActionRequest) {
    if (state.resourceBlock) return false;
    if (
      !focused ||
      pageHidden ||
      state.operation.kind !== "idle" ||
      !isTeachingViewport() ||
      document.visibilityState !== "visible"
    )
      return false;
    const origin = teaching.current()?.projection;
    if (!origin) return false;
    const ticket = ++operationSerial;
    fence();
    publish({
      operation: { kind: "preparing", request, origin },
      correctionPreview:
        "correctionPreview" in request ? request.correctionPreview : null,
    });
    await perform(request, origin, ticket);
    return operationSerial === ticket && state.operation.kind === "idle";
  }
  function act(request: ActionRequest) {
    if (
      state.inputSuspended ||
      state.operation.kind !== "idle" ||
      !isTeachingViewport() ||
      document.visibilityState !== "visible"
    )
      return;
    void enter(request);
  }
  function waitForOperation() {
    if (
      ![
        "opening",
        "preparing",
        "pending",
        "adminPreparing",
        "adminSaving",
        "adopting",
      ].includes(state.operation.kind)
    )
      return Promise.resolve();
    return new Promise<void>((resolve) => {
      const listener = () => {
        if (
          [
            "opening",
            "preparing",
            "pending",
            "adminPreparing",
            "adminSaving",
            "adopting",
          ].includes(state.operation.kind)
        )
          return;
        subscribers.delete(listener);
        resolve();
      };
      subscribers.add(listener);
    });
  }
  async function settleVisit() {
    const ticket = operationSerial;
    const resource = resourceContext();
    await waitForOperation();
    if (closed || operationSerial !== ticket || state.operation.kind !== "idle")
      return false;
    try {
      await drain();
      checkOperation(ticket);
    } catch (error) {
      observeResourceFailure(error, resource);
      if (closed || operationSerial !== ticket) return false;
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          message: saveFailureMessage(error),
          retry: { kind: "inkOnly" },
        },
      });
      return false;
    }
    const origin = teaching.current()?.projection;
    if (
      origin &&
      origin.kind !== "entry" &&
      origin.kind !== "recovery" &&
      origin.runStatus === "inProgress" &&
      origin.sessionStatus === "active"
    ) {
      const pause = origin.actions.find(
        (action) => action.intent.kind === "pause",
      );
      if (!pause) return false;
      const next = ++operationSerial;
      publish({
        operation: { kind: "preparing", request: pause, origin },
        correctionPreview: null,
      });
      await perform(pause, origin, next);
    }
    return state.operation.kind === "idle";
  }
  function settleSuspension() {
    if (!visiting) {
      const attempt = settleVisit().finally(() => {
        if (visiting === attempt) visiting = null;
      });
      visiting = attempt;
    }
    return visiting;
  }
  function visit() {
    routeSuspended = true;
    fence();
    reopenInput();
    return settleSuspension();
  }
  function setSurface(
    surface: "teaching" | "other",
    routeKey: string = surface,
  ) {
    if (resourceSurfaceKey !== routeKey) {
      resourceSurfaceKey = routeKey;
      resourceSurfaceRevision++;
    }
    routeSuspended = surface !== "teaching";
    if (routeSuspended) fence();
    reopenInput();
  }

  async function readDirectory(ticket: number) {
    const reading = ++directorySerial;
    const connection = client.connectionTicket();
    const directory = await client.readDirectory();
    checkOperation(ticket);
    if (reading !== directorySerial || connection !== client.connectionTicket())
      throw new Error("The directory read lease changed.");
    if (
      minimumAdministration !== null &&
      BigInt(directory.administration.revision) < BigInt(minimumAdministration)
    )
      throw new Error("A newer committed profile directory is required.");
    minimumAdministration = directory.administration.revision;
    return directory;
  }
  async function adopt(
    receipt: ProfileAdministrationReceipt,
    ticket: number,
  ): Promise<AdministrationOutcome> {
    const resource = resourceContext();
    publish({ operation: { kind: "adopting", receipt } });
    try {
      if (
        minimumAdministration === null ||
        BigInt(receipt.administration.revision) > BigInt(minimumAdministration)
      )
        minimumAdministration = receipt.administration.revision;
      const directory = await readDirectory(ticket);
      if (
        "selection" in receipt &&
        canonical(directory.selection) !== canonical(receipt.selection)
      ) {
        if (
          canonical(teaching.current()?.directory.selection) ===
          canonical(directory.selection)
        ) {
          publish({ operation: { kind: "idle" } });
          reopenInput();
        } else {
          fence();
          publish({
            operation: {
              kind: "rejected",
              message:
                "A newer child selection replaced this saved result. Retry to restore the current child.",
            },
          });
        }
        return { kind: "resolved", receipt };
      }
      if (!teaching.adoptDirectory(directory)) {
        fence();
        await drain();
        checkOperation(ticket);
        teaching.retire();
        await teaching.read({
          expectation: {
            kind: "opening",
            selection: directory.selection,
            minimumAdministration: receipt.administration.revision,
          },
        });
        checkOperation(ticket);
      }
      discovered = teaching.current()?.directory ?? directory;
      publish({ operation: { kind: "idle" }, correctionPreview: null });
      reopenInput();
      return { kind: "visible", receipt };
    } catch (error) {
      observeResourceFailure(error, resource);
      if (operationSerial === ticket && !closed) {
        fence();
        publish({
          operation: {
            kind: "adoptionFailed",
            receipt,
            message: saveFailureMessage(error),
          },
        });
      }
      return { kind: "held" };
    }
  }
  function retireRemoval(command: ProfileRemovalCommand) {
    fence();
    teaching.retireProfile({
      installationId: command.scope.installationId,
      owner: command.payload.target.owner,
      kind: command.payload.kind === "resetProfile" ? "reset" : "delete",
    });
    documents.clear();
    spool = [];
    active = null;
    queue = createInkCommandQueue();
    semanticReservation = 0;
    discovered = null;
    directorySerial++;
    publish({ correctionPreview: null });
    paint();
  }
  async function readAfterRetiredRejection(
    command: ProfileRemovalCommand,
    ticket: number,
  ) {
    const resource = resourceContext();
    const directory = await readDirectory(ticket);
    if (
      directory.profiles.some(
        (profile) =>
          canonical(profile.edit.owner) ===
          canonical(command.payload.target.owner),
      )
    )
      return;
    retireRemoval(command);
    publish({ operation: { kind: "opening" } });
    try {
      discovered = directory;
      await teaching.read({
        expectation: {
          kind: "opening",
          selection: directory.selection,
          minimumAdministration: directory.administration.revision,
        },
      });
      checkOperation(ticket);
      publish({ operation: { kind: "idle" } });
      reopenInput();
    } catch (error) {
      observeResourceFailure(error, resource);
      if (operationSerial === ticket && !closed)
        publish({
          operation: {
            kind: "openingFailed",
            message: saveFailureMessage(error),
          },
        });
    }
  }
  async function saveAdministration(
    command: ProfileAdministrationCommand,
    ticket: number,
  ): Promise<AdministrationOutcome> {
    const resource = resourceContext();
    publish({ operation: { kind: "adminSaving", command } });
    try {
      const connection = client.connectionTicket();
      const receipt = await client.administer(command);
      checkOperation(ticket);
      if (connection !== client.connectionTicket())
        throw new Error("The administrative connection lease changed.");
      if (receipt.kind === "rejected") {
        fence();
        publish({ operation: { kind: "rejected", message: receipt.message } });
        if (command.version === 2)
          await readAfterRetiredRejection(command, ticket);
        return receipt;
      }
      if (command.version === 2) {
        retireRemoval(command);
        publish({ operation: { kind: "adopting", receipt } });
      }
      return adopt(receipt, ticket);
    } catch (error) {
      observeResourceFailure(error, resource);
      if (operationSerial === ticket && !closed) {
        fence();
        publish({
          operation: {
            kind: "adminFailed",
            command,
            message: saveFailureMessage(error),
          },
        });
      }
      return { kind: "held" };
    }
  }
  async function administer(
    intent: ProfileAdministrationIntent | ProfileRemovalIntent,
  ): Promise<AdministrationOutcome> {
    await waitForOperation();
    if (state.resourceBlock || state.operation.kind !== "idle")
      return { kind: "held" };
    const selection =
      teaching.current()?.directory.selection ?? discovered?.selection;
    if (!selection) return { kind: "held" };
    const removing =
      intent.kind === "resetProfile" || intent.kind === "deleteProfile";
    if (
      removing &&
      canonical(intent.target.owner) !== canonical(selection.owner)
    )
      return { kind: "held" };
    const switching =
      intent.kind === "selectProfile" ||
      intent.kind === "createAndSelect" ||
      removing;
    if (switching) {
      routeSuspended = true;
      fence();
      if (!(await settleVisit())) return { kind: "held" };
      teaching.retire();
    }
    const ticket = ++operationSerial;
    const resource = resourceContext();
    directorySerial++;
    publish({ operation: { kind: "adminPreparing", intent } });
    try {
      const directory = await readDirectory(ticket);
      if (canonical(directory.selection) !== canonical(selection))
        throw new Error(
          "The selected child changed before administration preparation.",
        );
      const common = { selection, ids, hash: hashText };
      const command =
        intent.kind === "resetProfile" || intent.kind === "deleteProfile"
          ? await prepareProfileRemoval({
              ...common,
              intent,
              departure: await client.readDeparture({ selection }),
            })
          : intent.kind === "selectProfile" || intent.kind === "createAndSelect"
            ? await prepareProfileAdministration({
                ...common,
                intent,
                departure: await client.readDeparture({ selection }),
              })
            : await prepareProfileAdministration({ ...common, intent });
      checkOperation(ticket);
      return saveAdministration(command, ticket);
    } catch (error) {
      observeResourceFailure(error, resource);
      if (operationSerial === ticket && !closed) {
        fence();
        publish({
          operation: {
            kind: "rejected",
            message:
              "The profile change could not be prepared from this saved selection. Retry to reload it.",
          },
        });
      }
      return { kind: "held" };
    }
  }
  async function retryAdministration(
    operation: Extract<Operation, { kind: "adminFailed" | "adoptionFailed" }>,
  ) {
    const ticket = ++operationSerial;
    let resource = resourceContext();
    fence();
    if (operation.kind === "adoptionFailed") {
      try {
        if (!connected) {
          const recovery = await reconcile();
          resource = { ...resource, transport: recovery.transport };
        }
        checkOperation(ticket);
        await adopt(operation.receipt, ticket);
      } catch (error) {
        observeResourceFailure(error, resource);
        if (operationSerial === ticket && !closed)
          publish({
            operation: { ...operation, message: saveFailureMessage(error) },
          });
      }
      return;
    }
    if (connected) {
      await saveAdministration(operation.command, ticket);
      return;
    }
    try {
      const recovery = await reconcile(null, operation.command);
      checkOperation(ticket);
      resource = { ...resource, transport: recovery.transport };
      if (
        !recovery.administrative ||
        recovery.administrative.kind === "rejected"
      ) {
        publish({
          operation: {
            kind: "rejected",
            message: recovery.administrative?.message ?? saveMessage,
          },
        });
        if (operation.command.version === 2)
          await readAfterRetiredRejection(operation.command, ticket);
        return;
      }
      if (operation.command.version === 2) {
        retireRemoval(operation.command);
        publish({
          operation: { kind: "adopting", receipt: recovery.administrative },
        });
      }
      await adopt(recovery.administrative, ticket);
    } catch (error) {
      observeResourceFailure(error, resource);
      if (operationSerial === ticket && !closed)
        publish({
          operation: { ...operation, message: saveFailureMessage(error) },
        });
    }
  }

  function clearResolvedObligation(ticket: number) {
    if (
      !closed &&
      operationSerial === ticket &&
      (state.operation.kind === "idle" || state.operation.kind === "rejected")
    )
      recoveryObligation = null;
  }
  async function reconnect(): Promise<
    { kind: "held" } | { kind: "restored"; retained: RecoveryObligation }
  > {
    if (closed) return { kind: "held" };
    const operation = state.operation;
    const retained: RecoveryObligation =
      operation.kind === "pending"
        ? { kind: "failed", prepared: operation.prepared, message: saveMessage }
        : operation.kind === "adminSaving"
          ? {
              kind: "adminFailed",
              command: operation.command,
              message: saveMessage,
            }
          : operation.kind === "adopting"
            ? {
                kind: "adoptionFailed",
                receipt: operation.receipt,
                message: saveMessage,
              }
            : operation.kind === "failed" ||
                operation.kind === "adminFailed" ||
                operation.kind === "adoptionFailed" ||
                operation.kind === "inkFailed"
              ? operation
              : (recoveryObligation ?? {
                  kind: "openingFailed",
                  message: saveMessage,
                });
    recoveryObligation = retained;
    ++operationSerial;
    ++transportGeneration;
    fence();
    // Old operations are fenced before close rejects their outstanding requests.
    client.close();
    connected = false;
    opening = null;
    draining = null;
    visiting = null;
    publish({ operation: retained });
    const attempt = retry(true);
    const ticket = operationSerial;
    await attempt;
    clearResolvedObligation(ticket);
    return !closed &&
      operationSerial === ticket &&
      state.operation.kind === "idle"
      ? { kind: "restored", retained }
      : { kind: "held" };
  }

  async function retry(reconnecting = false) {
    const operation = state.operation;
    if (
      operation.kind === "failed" ||
      operation.kind === "inkFailed" ||
      operation.kind === "adminFailed" ||
      operation.kind === "adoptionFailed" ||
      operation.kind === "openingFailed"
    )
      recoveryObligation = operation;
    if (
      operation.kind === "adminFailed" ||
      operation.kind === "adoptionFailed"
    ) {
      const attempt = retryAdministration(operation);
      const ticket = operationSerial;
      await attempt;
      clearResolvedObligation(ticket);
      return;
    }
    if (
      operation.kind === "opening" ||
      operation.kind === "pending" ||
      operation.kind === "preparing" ||
      operation.kind === "adminPreparing" ||
      operation.kind === "adminSaving" ||
      operation.kind === "adopting" ||
      (!reconnecting &&
        (!isTeachingViewport() || document.visibilityState !== "visible"))
    )
      return;
    const ticket = ++operationSerial;
    let resource = resourceContext();
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
      if (recovery) resource = { ...resource, transport: recovery.transport };
      if (operation.kind === "failed") {
        const result = recovery?.result;
        if (
          recovery &&
          canonical(recovery.directory.selection) !==
            canonical(operation.prepared.operation.selection)
        ) {
          publish({
            operation: {
              kind: "rejected",
              message:
                "The retained operation is resolved for an earlier child selection. Retry to restore the current child.",
            },
          });
          return;
        }
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
        const reconciledRead =
          recovery &&
          operation.prepared.operation.command.kind === "writingControl"
            ? await client.read({
                selection: recovery.directory.selection,
                target: { kind: "cursor" },
              })
            : null;
        checkOperation(ticket);
        await teaching.read({
          expectation: {
            kind: "receipt",
            courseId: current.courseId,
            prepared: operation.prepared,
            receipt: result,
            restoreBinding: reconciledRead
              ? { kind: "reconciled", projection: reconciledRead.projection }
              : { kind: "normal" },
          },
        });
        checkOperation(ticket);
        semanticReservation = 0;
        publish({ operation: { kind: "idle" }, correctionPreview: null });
        reopenInput();
      } else {
        discovered = await readDirectory(ticket);
        const current = teaching.current();
        if (
          !current ||
          canonical(discovered.selection) !==
            canonical(current.directory.selection)
        )
          teaching.retire();
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
      observeResourceFailure(error, resource);
      if (operationSerial !== ticket) return;
      fence();
      publish({
        operation:
          operation.kind === "failed" || operation.kind === "inkFailed"
            ? { ...operation, message: saveFailureMessage(error) }
            : operation.kind === "openingFailed"
              ? {
                  kind: "openingFailed",
                  message:
                    error instanceof Error ? error.message : operation.message,
                }
              : {
                  kind: "inkFailed",
                  message: saveFailureMessage(error),
                  retry: { kind: "inkOnly" },
                },
      });
    } finally {
      clearResolvedObligation(ticket);
    }
  }
  async function interrupt() {
    const ticket = operationSerial;
    const resource = resourceContext();
    fence();
    if (!connected || state.operation.kind !== "idle") return;
    try {
      await drain();
      checkOperation(ticket);
      reopenInput();
    } catch (error) {
      observeResourceFailure(error, resource);
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
          message: saveFailureMessage(error),
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
  function backgroundDrain() {
    const ticket = transportGeneration;
    const resource = resourceContext();
    void drain().catch((error) => {
      observeResourceFailure(error, resource);
      if (
        closed ||
        transportGeneration !== ticket ||
        state.operation.kind !== "idle"
      )
        return;
      fence();
      publish({
        operation: {
          kind: "inkFailed",
          message: saveFailureMessage(error),
          retry: { kind: "inkOnly" },
        },
      });
    });
  }
  function begin(
    documentId: DocumentToken["documentId"],
    sample: InkSample,
    startedAt: number,
  ): InkContact | null {
    const view = documents.get(documentId);
    if (
      fenced ||
      !Number.isFinite(startedAt) ||
      startedAt < inputEligibleAt ||
      active ||
      !view?.snapshot.writable ||
      state.operation.kind !== "idle"
    )
      return null;
    if (spool.length >= 64) {
      void interrupt();
      return null;
    }
    const selection = teaching.current()?.directory.selection;
    if (!selection) return null;
    const strokeId = parseId({ kind: "stroke", value: ids() });
    const layer = layerForPhase(view.snapshot.token.phase);
    const contact = Object.freeze({
      strokeId,
      originalToken: view.snapshot.token,
      fenceSerial,
      startedAt,
      selection,
      connectionTicket: client.connectionTicket(),
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
    backgroundDrain();
    return contact;
  }
  function append(contact: InkContact, samples: readonly InkSample[]) {
    if (
      contact.connectionTicket !== client.connectionTicket() ||
      canonical(contact.selection) !==
        canonical(teaching.current()?.directory.selection)
    )
      return;
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
    if (
      contact.connectionTicket !== client.connectionTicket() ||
      canonical(contact.selection) !==
        canonical(teaching.current()?.directory.selection)
    )
      return;
    if (active?.contact !== contact || contact.fenceSerial !== fenceSerial)
      return;
    active.status = status;
    active = null;
    paint();
    backgroundDrain();
  }
  const checkpoint = window.setInterval(() => {
    if (!connected || !active || state.operation.kind !== "idle") return;
    backgroundDrain();
  }, 750);
  const lifecycle = (event: Event) => {
    if (event.type === "blur") focused = false;
    if (event.type === "focus") focused = true;
    if (event.type === "pagehide") pageHidden = true;
    if (event.type === "pageshow") pageHidden = false;
    fence();
    const suspended = inputIsSuspended();
    if (state.inputSuspended !== suspended)
      publish({ inputSuspended: suspended });
    if (
      !isTeachingViewport() ||
      document.visibilityState !== "visible" ||
      pageHidden
    ) {
      void settleSuspension();
    } else {
      void interrupt();
    }
  };
  window.addEventListener("resize", lifecycle);
  window.addEventListener("orientationchange", lifecycle);
  window.addEventListener("blur", lifecycle);
  window.addEventListener("focus", lifecycle);
  window.addEventListener("pagehide", lifecycle);
  window.addEventListener("pageshow", lifecycle);
  document.addEventListener("visibilitychange", lifecycle);
  window.visualViewport?.addEventListener("resize", lifecycle);
  return {
    blockResources(failure: InstalledResourceFailure) {
      fence();
      publish({ resourceBlock: failure });
    },
    clearResourceBlock(expected: InstalledResourceFailure): boolean {
      if (state.resourceBlock !== expected) return false;
      publish({ resourceBlock: null });
      return true;
    },
    committed: teaching.view,
    open,
    act,
    administer,
    enter,
    visit,
    setSurface,
    editPractice(control: PracticeControl) {
      updateReadiness();
      if (state.practiceControlsReady) act({ kind: "practice", control });
    },
    practiceControls: teaching.practiceControls,
    retry,
    reconnect,
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
    canWrite: () =>
      !fenced &&
      state.operation.kind === "idle" &&
      [...documents.values()].some((view) => view.snapshot.writable),
    close() {
      closed = true;
      operationSerial++;
      window.clearInterval(checkpoint);
      window.removeEventListener("resize", lifecycle);
      window.removeEventListener("orientationchange", lifecycle);
      window.removeEventListener("blur", lifecycle);
      window.removeEventListener("focus", lifecycle);
      window.removeEventListener("pagehide", lifecycle);
      window.removeEventListener("pageshow", lifecycle);
      document.removeEventListener("visibilitychange", lifecycle);
      window.visualViewport?.removeEventListener("resize", lifecycle);
      detachControls();
      teaching.close();
      client.close();
    },
  };
}
export type WritingController = ReturnType<typeof createWritingController>;
