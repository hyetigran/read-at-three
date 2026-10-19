import type { InstalledTeaching } from "./installed-teaching.ts";
export type IdKind =
  | "asset"
  | "profile"
  | "session"
  | "run"
  | "node"
  | "command"
  | "advance"
  | "installation"
  | "course"
  | "release"
  | "lesson"
  | "task"
  | "source"
  | "migration"
  | "occurrence"
  | "checkpoint"
  | "correction"
  | "credit"
  | "item"
  | "policy"
  | "review"
  | "queue"
  | "cycle"
  | "target"
  | "document"
  | "stroke";
export type Id<Kind extends IdKind> = string & { readonly __brand: Kind };
export type ProfileId = Id<"profile">;
export type SessionId = Id<"session">;
export type RunId = Id<"run">;
export type NodeId = Id<"node">;
export type CommandId = Id<"command">;
export type AdvanceId = Id<"advance">;
export type InstallationId = Id<"installation">;
export type CourseId = Id<"course">;
export type ReleaseId = Id<"release">;
export type LessonId = Id<"lesson">;
export type TaskId = Id<"task">;
export type SourceRef = Id<"source">;
export type MigrationId = Id<"migration">;
export type OccurrenceId = Id<"occurrence">;
export type CheckpointId = Id<"checkpoint">;
export type CorrectionId = Id<"correction">;
export type CreditId = Id<"credit">;
export type HashKind = "package" | "payload" | "migration" | "preparation";
export type Hash<Kind extends HashKind> = string & {
  readonly __brand: `${Kind}Hash`;
};
export type PackageHash = Hash<"package">;
export type PayloadHash = Hash<"payload">;
export type MigrationHash = Hash<"migration">;
export type PreparationHash = Hash<"preparation">;
export type Serialized<Value> = Value extends { readonly __brand: string }
  ? string
  : Value extends object
    ? { [Key in keyof Value]: Serialized<Value[Key]> }
    : Value;
export type Counter = string & { readonly __brand: "Counter" };
export type HashFunction = (text: string) => Promise<string>;
export type IdFactory = () => string;
export type Copy = Readonly<
  | { kind: "source" | "adapted"; text: string; sourceRef: SourceRef }
  | { kind: "added"; text: string }
>;
export type TeachingNode = Readonly<{
  id: NodeId;
  parentAction: Copy;
  spoken: Copy;
  expected: Copy;
  parentRole: "model" | "listen";
  glyph: "m";
  cue: Readonly<{ kind: "sustain"; durationMs: number }>;
  next: Readonly<
    | { kind: "node"; nodeId: NodeId }
    | { kind: "frontier"; unmetObligations: readonly NodeId[] }
  >;
}>;
export type LegacyDevelopmentBody = Readonly<{
  courseId: CourseId;
  releaseId: ReleaseId;
  coverage: "partial-first-m";
  title: Copy;
  lessonId: LessonId;
  taskId: TaskId;
  startNodeId: NodeId;
  nodes: readonly TeachingNode[];
}>;
export type PlainParentSpan = Readonly<{
  kind: "action" | "speech" | "expected" | "praise";
  copy: Copy;
}>;
export type ParentSpan =
  | PlainParentSpan
  | Readonly<{
      kind: PlainParentSpan["kind"];
      runs: readonly Readonly<{
        copy: Copy;
        emphasis: "plain" | "strong" | "italic";
      }>[];
    }>;
export type GraphNode = Readonly<{
  id: NodeId;
  kind: "normal" | "correction";
  sourceRefs: readonly SourceRef[];
  guidance: readonly ParentSpan[];
  parentRole: "model" | "listen";
  glyph: "m" | "s";
  cue: Readonly<{ kind: "sustain"; minimumMs: number | null }>;
  next: Readonly<{ kind: "node"; nodeId: NodeId } | { kind: "end" }>;
}>;
export type PrintedGlyph = "m" | "a" | "s" | "ē";
export type PrintedCue = Readonly<
  | { kind: "none" }
  | {
      kind: "childUnderSymbol";
      pace: "slow" | "fast";
      participant: "child" | "parentGuidesChild";
    }
  | { kind: "underSymbolHold"; hold: "parentControlled" }
  | { kind: "rhymeHoldThenSweep"; hold: "parentControlled" }
  | {
      kind: "endpointSweep";
      preparation: "touchStart" | "parentControlledStartHold";
    }
>;
export type PrintedBoard = {
  [K in keyof typeof import("./printed.ts").allReviewedPrintedBoards]: Pick<
    (typeof import("./printed.ts").allReviewedPrintedBoards)[K],
    "assetId" | "reviewId" | "assetHash"
  >;
}[keyof typeof import("./printed.ts").allReviewedPrintedBoards];
export type BoardPresentation = Readonly<{
  kind: "printedBoard";
  board: PrintedBoard;
  focus: PrintedGlyph;
  cue: PrintedCue;
}>;
export type BoardNode = Omit<GraphNode, "glyph" | "cue"> &
  Readonly<{
    presentation: BoardPresentation;
  }>;
export type PrintedNode = GraphNode | BoardNode;
export type BoardTask = Omit<GraphTask, "nodes"> &
  Readonly<{ nodes: readonly BoardNode[] }>;
export type BoardTurn = BoardNode & Omit<GraphTurn, keyof GraphNode>;
export type CorrectionSpec = Readonly<{
  id: CorrectionId;
  eligibleNodeIds: readonly NodeId[];
  instructionNodeId: NodeId;
  retestNodeIds: readonly NodeId[];
  continuationNodeId: NodeId | null;
  sourceRefs: readonly SourceRef[];
}>;
export type GraphTask = Readonly<{
  id: TaskId;
  number: number;
  title: Copy;
  startNodeId: NodeId;
  nodes: readonly GraphNode[];
  corrections: readonly CorrectionSpec[];
}>;
export type LessonTask = Readonly<{
  id: TaskId;
  number: number;
  title: Copy;
  optional: boolean;
}>;
export type GraphDevelopmentBody = Readonly<{
  courseId: CourseId;
  releaseId: ReleaseId;
  coverage: "lesson1-sounds-complete";
  title: Copy;
  lessonId: LessonId;
  lessonTasks: readonly LessonTask[];
  tasks: readonly GraphTask[];
}>;
export type DevelopmentBody =
  | LegacyDevelopmentBody
  | GraphDevelopmentBody
  | ControlDevelopmentBody
  | WritingDevelopmentBody;
export type DevelopmentBodyInput = Serialized<DevelopmentBody>;
export type TeachingNodeInput = Serialized<TeachingNode>;
export type DevelopmentPackage = Readonly<{
  formatVersion: 1;
  packageHash: PackageHash;
  body: DevelopmentBody;
}>;
export type LegacyTeachingState = Readonly<
  | {
      version: 1;
      kind: "teaching";
      nodeId: NodeId;
      acceptedNodeIds: readonly NodeId[];
    }
  | {
      version: 1;
      kind: "frontier";
      acceptedNodeIds: readonly NodeId[];
      unmetObligations: readonly NodeId[];
    }
>;
export type Occurrence = Readonly<{
  id: OccurrenceId;
  nodeId: NodeId;
  kind: "normal" | "practice" | "support";
}>;
export type NormalOrRepeatContext = Readonly<
  { kind: "normal" } | { kind: "repeat"; returnCheckpointId: CheckpointId }
>;
type CorrectionCommon = Readonly<{
  correctionId: CorrectionId;
  triggerOccurrenceId: OccurrenceId;
  returnOccurrenceId: OccurrenceId;
  suspended: NormalOrRepeatContext;
}>;
export type RouteContext =
  | NormalOrRepeatContext
  | (CorrectionCommon & { readonly kind: "correctionInstruction" })
  | (CorrectionCommon & {
      readonly kind: "correctionRetest";
      readonly retestIndex: number;
    });
export type Checkpoint = Readonly<{
  id: CheckpointId;
  occurrenceId: OccurrenceId | null;
  context: RouteContext;
}>;
export type GraphTeachingState = Readonly<{
  version: 1;
  kind: "graph";
  taskId: TaskId;
  occurrences: readonly Occurrence[];
  acceptedOccurrenceIds: readonly OccurrenceId[];
  nextOccurrenceNumber: Counter;
  checkpoints: readonly Checkpoint[];
  checkpointIndex: number;
  nextCheckpointNumber: Counter;
}>;
export type TeachingState =
  | LegacyTeachingState
  | GraphTeachingState
  | ControlTeachingState
  | WritingSkippedState;
export type PrintedGraphAction = Readonly<
  | { kind: "continue" | "back" | "repeat" | "pause" }
  | { kind: "help"; correctionId: CorrectionId }
>;
export type SelectionIntent = "start" | "resume" | "replay" | "restart";
export type UndoAdvanceBinding = Readonly<{
  packageHash: PackageHash;
  sessionId: SessionId;
  runId: RunId;
  advanceId: AdvanceId;
  runRevision: Counter;
  profileRevision: Counter;
  cursorRevision: Counter;
  selectionCounter: Counter;
}>;
export type UndoAdvanceCommand = Extract<
  TeachingCommand,
  { kind: "undoAdvance" | "writingUndoAdvance" }
>;
export type TeachingIntent =
  | Readonly<{ kind: "undoAdvance"; binding: UndoAdvanceBinding }>
  | GraphAction
  | Readonly<{
      kind: SelectionIntent;
      taskId: TaskId;
      packageHash: PackageHash;
      sessionId: SessionId | null;
    }>;
export type AvailableAction = Readonly<
  | { label: Copy; intent: Exclude<TeachingIntent, { kind: "help" }> }
  | {
      label: Copy;
      intent: Extract<TeachingIntent, { kind: "help" }>;
      correctionPreview: PrintedNode | ControlTurnNode;
    }
>;
export type Owner = Readonly<{ profileId: ProfileId; generation: Counter }>;
export type GraphTurn = GraphNode &
  Readonly<{
    extraPractice: boolean;
    routeKind: RouteContext["kind"];
    occurrenceId: OccurrenceId;
    checkpointId: CheckpointId;
  }>;
export type EngineProjection =
  | {
      kind: "teaching";
      turn: TeachingNode | GraphTurn | BoardTurn | ControlTurn;
    }
  | {
      kind: "frontier";
      status: "inProgress";
      unmetObligations: readonly NodeId[];
    }
  | Readonly<{
      kind: "readiness";
      nodeId: NodeId;
      policyId: PolicyId;
      cycleId: CycleId;
      occurrenceId: OccurrenceId;
      guidance: readonly ParentSpan[];
    }>
  | ControlSelectionProjection
  | { kind: "completed" }
  | { kind: "skipped" }
  | { kind: "writing"; turn: ControlTurn; documents: readonly DocumentToken[] }
  | {
      kind: "writingResult";
      outcome: "completed" | "skipped";
      documents: readonly DocumentToken[];
    };
export type Recovery = Readonly<{
  kind: "recovery";
  code: string;
  message: string;
}>;
export type CatalogTask = LessonTask &
  Readonly<{
    available: boolean;
    completed: boolean;
    packageHash: PackageHash;
    savedSessionId: SessionId | null;
  }> &
  (
    | Readonly<{ skipped?: never }>
    | Readonly<{ optional: true; completed: false; skipped: true }>
  );
type Common = {
  owner: Owner;
  packageHash: PackageHash;
  title: Copy;
  profileRevision: Counter;
  actions: readonly AvailableAction[];
  catalog: readonly CatalogTask[];
};
type SessionCommon = Common & {
  sessionId: SessionId;
  runId: RunId;
  revision: Counter;
  runStatus: "inProgress" | "completed" | "skipped";
  sessionStatus: "active" | "paused" | "closed";
  checkpointId: CheckpointId | null;
  taskId: TaskId;
  taskNumber: number;
  selectionCounter: Counter;
};
export type CommittedProjection = Readonly<
  (Common & { kind: "entry" }) | (SessionCommon & EngineProjection) | Recovery
>;
type CommandCommon = Readonly<{
  commandId: CommandId;
  owner: Owner;
  expectedRevision: Counter;
  payloadHash: PayloadHash;
}>;
type ProfileScope = Readonly<{
  kind: "profile";
  id: ProfileId;
  generation: Counter;
}>;
type SessionScope = Readonly<{
  kind: "session";
  id: SessionId;
  generation: Counter;
}>;
export type TeachingCommand = CommandCommon &
  Readonly<
    | {
        kind: "start";
        scope: ProfileScope;
        payload: Readonly<{ packageHash: PackageHash }>;
      }
    | { kind: "undoAdvance"; scope: SessionScope; payload: UndoAdvanceBinding }
    | {
        kind: "writingUndoAdvance";
        scope: SessionScope;
        payload: UndoAdvanceBinding & Readonly<{ barrier: WritingBarrier }>;
      }
    | {
        kind: "advance";
        scope: SessionScope;
        payload: Readonly<{
          packageHash: PackageHash;
          sessionId: SessionId;
          runId: RunId;
          nodeId: NodeId;
        }>;
      }
    | {
        kind: "select";
        scope: ProfileScope;
        payload: Readonly<{
          packageHash: PackageHash;
          intent: SelectionIntent;
          taskId: TaskId;
          sessionId: SessionId | null;
        }>;
      }
    | {
        kind: "writingSelect";
        scope: ProfileScope;
        payload: Readonly<{
          packageHash: PackageHash;
          intent: SelectionIntent;
          taskId: TaskId;
          sessionId: SessionId | null;
          barrier: WritingBarrier;
        }>;
      }
    | {
        kind: "writingNavigate";
        scope: SessionScope;
        payload: Readonly<{
          packageHash: PackageHash;
          sessionId: SessionId;
          runId: RunId;
          checkpointId: CheckpointId;
          action: GraphAction;
          barrier: WritingBarrier;
        }>;
      }
    | {
        kind: "writingControl";
        scope: SessionScope;
        payload: Readonly<{
          packageHash: PackageHash;
          sessionId: SessionId;
          runId: RunId;
          checkpointId: CheckpointId;
          barrier: WritingBarrier;
          documentId: DocumentId;
          layer: import("./ink-history.ts").ChildPracticeLayer;
          control: import("./ink-history.ts").PracticeControl;
        }>;
      }
    | {
        kind: "navigate";
        scope: SessionScope;
        payload: Readonly<{
          packageHash: PackageHash;
          sessionId: SessionId;
          runId: RunId;
          checkpointId: CheckpointId;
          action: GraphAction;
        }>;
      }
  >;
export type CommitReceipt = Readonly<{
  kind: "committed";
  commandId: CommandId;
  owner: Owner;
  sessionId: SessionId;
  runId: RunId;
  revision: Counter;
  packageHash: PackageHash;
}>;
export type CommandRejection = Readonly<{
  kind: "rejected";
  code: string;
  message: string;
}>;
export type CommandResult = CommitReceipt | CommandRejection;
export type CompletionProof = Readonly<{
  taskId: TaskId;
  packageHash: PackageHash;
  requiredOccurrenceIds: readonly OccurrenceId[];
  sourceRefs: readonly SourceRef[];
}>;
export type NonAcceptingTransition = Readonly<
  | { kind: "navigation"; after: TeachingState }
  | { kind: "pause"; after: TeachingState }
>;
export type AcceptingTransition = Readonly<
  | {
      kind: "acceptance";
      after: TeachingState;
      occurrenceId: OccurrenceId | NodeId;
    }
  | {
      kind: "skip";
      after: WritingSkippedState;
      occurrenceId: OccurrenceId;
      skip: SkipProof;
    }
  | {
      kind: "completion";
      after: TeachingState;
      occurrenceId: OccurrenceId | NodeId;
      completion: CompletionProof;
    }
>;
export type TransitionPlan = NonAcceptingTransition | AcceptingTransition;
export interface TeachingApplication {
  open(): Promise<CommittedProjection>;
  read(): Promise<CommittedProjection>;
  dispatch(command: TeachingCommand): Promise<CommandResult>;
}
export type StoredSession = Readonly<{
  sessionId: SessionId;
  runId: RunId;
  revision: Counter;
  runRevision: Counter;
  packageHash: PackageHash;
  lessonId: LessonId;
  taskId: TaskId;
  status: "active" | "paused" | "closed";
  runStatus: "inProgress" | "completed" | "skipped";
  state: TeachingState;
  activeAdvanceId: AdvanceId | null;
  nextAdvanceSeq: Counter;
  lastSelectedSequence?: Counter;
}>;
export interface StoredContext {
  owner: Owner;
  profileRevision: Counter;
  activationRevision?: Counter;
  cursorRevision?: Counter;
  lessonResults?: readonly Readonly<{
    lessonId: LessonId;
    acceptedLessonCreditId: CreditId;
  }>[];
  history?: readonly import("./course.ts").SavedWork[];
  undoRunId: RunId | null;
  taskResults: readonly Readonly<{
    taskId: TaskId;
    outcome: "completed" | "skipped";
  }>[];
  activePackageHash: PackageHash;
  selectionCounter: Counter;
  session: StoredSession | null;
  cursorSession?: StoredSession | null;
  sessions: readonly StoredSession[];
  ownedSessionIds: readonly SessionId[];
}
export type SelectionPlan = Readonly<
  | {
      kind: "new";
      sessionId: SessionId;
      runId: RunId;
      taskId: TaskId;
      state: TeachingState;
      replaceSessionId: SessionId | null;
    }
  | { kind: "resume"; session: StoredSession }
>;
export type ApplyTransitionInput = Readonly<{
  command: TeachingCommand;
  context: StoredContext & { session: StoredSession };
  content: InstalledTeaching;
  before: TeachingState;
  receipt: CommitReceipt;
}> &
  Readonly<
    | { plan: NonAcceptingTransition; advanceId: null }
    | { plan: AcceptingTransition; advanceId: AdvanceId }
  >;
export interface TeachingTransaction {
  context(owner: Owner): Promise<StoredContext | null>;
  receipt(
    command: TeachingCommand,
  ): Promise<{ payloadHash: PayloadHash; result: CommitReceipt } | null>;
  ensurePackage(content: InstalledTeaching): Promise<void>;
  writingBarrier?(input: {
    session: StoredSession;
    barrier: WritingBarrier;
  }): Promise<boolean>;
  select(input: {
    command: TeachingCommand;
    context: StoredContext;
    content: InstalledTeaching;
    selection: SelectionPlan;
    receipt: CommitReceipt;
  }): Promise<void>;
  applyWritingControl?(
    input: Readonly<{
      command: Extract<TeachingCommand, { kind: "writingControl" }>;
      context: StoredContext & { session: StoredSession };
      receipt: CommitReceipt;
    }>,
  ): Promise<boolean>;
  undoAdvance?(
    input: Readonly<{
      command: UndoAdvanceCommand;
      context: StoredContext & { session: StoredSession };
      content: InstalledTeaching;
      receipt: CommitReceipt;
    }>,
  ): Promise<void>;
  apply(input: ApplyTransitionInput): Promise<void>;
}
export interface TeachingStore {
  current(
    target?: import("./course.ts").CourseReadTarget,
  ): Promise<StoredContext>;
  documents?(input: {
    session: StoredSession;
  }): Promise<readonly DocumentToken[]>;
  resolvePackage(packageHash: PackageHash): Promise<InstalledTeaching>;
  transaction<T>(work: (tx: TeachingTransaction) => Promise<T>): Promise<T>;
}

export type ItemId = Id<"item">;
export type PolicyId = Id<"policy">;
export type ReviewId = Id<"review">;
export type QueueId = Id<"queue">;
export type CycleId = Id<"cycle">;
export type Destination = Readonly<
  { kind: "node"; nodeId: NodeId } | { kind: "end" }
>;
export type ControlSource = Readonly<{
  id: NodeId;
  sourceRefs: readonly SourceRef[];
  guidance: readonly ParentSpan[];
}>;
export type ConnectedPointingPresentation = Readonly<{
  kind: "connectedPointing";
  board: keyof typeof import("./connected-pointing.ts").connectedPointingBoards;
  role:
    "model" | "follow" | "guided" | "echo" | "childConnect" | "togetherGuided";
}>;
export type ControlTurnNode = ControlSource &
  Readonly<{
    kind: "turn";
    route: "normal" | "support";
    parentRole: "model" | "together" | "listen";
    itemId: ItemId | null;
    presentation:
      | Readonly<{ kind: "oral" }>
      | WritingPresentation
      | ConnectedPointingPresentation
      | BoardPresentation;
    next: Destination;
  }>;
export type UntilFirmNode = ControlSource &
  Readonly<{
    kind: "untilFirm";
    policyId: PolicyId;
    cycleEntryNodeId: NodeId;
    cycleExitNodeId: NodeId;
    next: Destination;
  }>;
export type SelectiveReviewNode = ControlSource &
  Readonly<{
    kind: "selectiveReview";
    reviewId: ReviewId;
    items: readonly Readonly<{
      itemId: ItemId;
      parentLabel: Copy;
      entryNodeId: NodeId;
      exitNodeId: NodeId;
    }>[];
    returnNodeId: NodeId;
    exitNodeId: NodeId;
  }>;
export type ControlNode =
  | ControlTurnNode
  | UntilFirmNode
  | SelectiveReviewNode
  | (ControlSource &
      Readonly<{ kind: "reviewExit"; reviewId: ReviewId; next: Destination }>);
export type ControlCorrection = Readonly<{
  id: CorrectionId;
  label: Copy;
  scope: "normal" | "review" | "any";
  eligibleNodeIds: readonly NodeId[];
  instructionNodeIds: readonly NodeId[];
  retestNodeIds: readonly NodeId[];
  sourceRefs: readonly SourceRef[];
}>;
export type ControlTask = Readonly<{
  id: TaskId;
  number: number;
  title: Copy;
  startNodeId: NodeId;
  nodes: readonly ControlNode[];
  corrections: readonly ControlCorrection[];
}>;
export type MixedTask = Readonly<
  | { kind: "printedGraphV1"; task: GraphTask }
  | { kind: "printedGraphV2"; task: BoardTask }
  | { kind: "graphControls"; task: ControlTask }
  | { kind: "soundWritingV1"; task: WritingTask }
  | { kind: "writingPracticePlanV2"; task: WritingPracticePlan }
  | { kind: "writingPracticePlanV3"; task: WritingPracticePlanV3 }
>;
export type PrintedPreviewTask = Extract<
  MixedTask,
  { kind: "printedGraphV1" | "printedGraphV2" }
>;
export type ControlDevelopmentBody = Omit<
  GraphDevelopmentBody,
  "coverage" | "tasks"
> &
  Readonly<{
    coverage: "lesson1-sounds-oral-complete";
    tasks: readonly Exclude<
      MixedTask,
      {
        kind:
          | "soundWritingV1"
          | "writingPracticePlanV2"
          | "writingPracticePlanV3"
          | "printedGraphV2";
      }
    >[];
  }>;
export type ReviewChoice = Readonly<
  { kind: "none" } | { kind: "items"; itemIds: readonly ItemId[] }
>;
export type GraphAction =
  | PrintedGraphAction
  | WritingAction
  | Readonly<
      | { kind: "parentReady"; policyId: PolicyId }
      | {
          kind: "commitReviewSelection";
          reviewId: ReviewId;
          choice: ReviewChoice;
        }
      | { kind: "confirmReviewItem"; queueId: QueueId; itemId: ItemId }
    >;
export type ReviewSelectionAction = Readonly<{
  kind: "reviewSelection";
  reviewId: ReviewId;
  eligibleItems: readonly Readonly<{ itemId: ItemId; label: Copy }>[];
  selectLabel: Copy;
  emptyLabel: Copy;
}>;
export type ControlOccurrence = Readonly<{
  id: OccurrenceId;
  target: Readonly<
    | { kind: "node"; nodeId: NodeId }
    | { kind: "reviewConfirmation"; queueId: QueueId; itemId: ItemId }
  >;
  obligation: "required" | "practice" | "support";
}>;
export type ControlFlow = Readonly<
  { kind: "normal" } | { kind: "review"; queueId: QueueId; index: number }
>;
export type ControlDelivery = Readonly<
  | { kind: "source" }
  | { kind: "cycle"; cycleId: CycleId }
  | { kind: "repeat"; returnCheckpointId: CheckpointId }
>;
export type ControlResume = Readonly<{
  flow: ControlFlow;
  delivery: ControlDelivery;
}>;
export type ControlContext = Readonly<
  | { kind: "delivering"; resume: ControlResume }
  | { kind: "selection"; reviewId: ReviewId }
  | { kind: "terminal" }
  | {
      kind: "correction";
      correctionId: CorrectionId;
      triggerOccurrenceId: OccurrenceId;
      owedOccurrenceId: OccurrenceId;
      suspended: ControlResume;
      instructionOccurrenceIds: readonly OccurrenceId[];
      retestOccurrenceIds: readonly OccurrenceId[];
      phase: Readonly<{ kind: "instruction" | "retest"; index: number }>;
    }
>;
export type ControlCheckpoint = Readonly<
  | {
      id: CheckpointId;
      occurrenceId: null;
      context: Extract<ControlContext, { kind: "terminal" }>;
    }
  | {
      id: CheckpointId;
      occurrenceId: OccurrenceId;
      context: Exclude<ControlContext, { kind: "terminal" }>;
    }
>;
export type ReviewQueue = Readonly<{
  id: QueueId;
  reviewId: ReviewId;
  selectionOccurrenceId: OccurrenceId;
  choice: ReviewChoice;
  items: readonly Readonly<{
    itemId: ItemId;
    routeOccurrences: readonly OccurrenceId[];
    confirmationOccurrenceId: OccurrenceId;
  }>[];
  returnNodeId: NodeId;
  exitNodeId: NodeId;
  exitOccurrenceId: OccurrenceId;
}>;
export type CycleBinding = Readonly<{
  id: CycleId;
  policyId: PolicyId;
  gateOccurrenceId: OccurrenceId;
  turnOccurrenceIds: readonly OccurrenceId[];
}>;
export type ControlTeachingState = Readonly<{
  version: 1;
  kind: "graphControls";
  taskId: TaskId;
  occurrences: readonly ControlOccurrence[];
  acceptedOccurrenceIds: readonly OccurrenceId[];
  cycles: readonly CycleBinding[];
  cycleOutcomes: readonly Readonly<{
    cycleId: CycleId;
    kind: "independent" | "supported";
  }>[];
  queues: readonly ReviewQueue[];
  checkpoints: readonly ControlCheckpoint[];
  checkpointIndex: number;
  nextOccurrenceNumber: Counter;
  nextCheckpointNumber: Counter;
}>;
export type ControlTurn = ControlTurnNode &
  Readonly<{
    extraPractice: boolean;
    routeKind: "delivering" | "correction";
    occurrenceId: OccurrenceId;
    checkpointId: CheckpointId;
  }>;
export type ControlSelectionProjection = Readonly<{
  kind: "reviewSelection";
  reviewId: ReviewId;
  items: ReviewSelectionAction["eligibleItems"];
  selectionAction: ReviewSelectionAction;
  presentation: Readonly<{ kind: "oral" }>;
  guidance: readonly ParentSpan[];
  committedChoice: ReviewChoice | null;
}>;

export type TargetId = Id<"target">;
export type DocumentId = Id<"document">;
export type StrokeId = Id<"stroke">;
export type WritingPhase =
  "parentDemonstration" | "childTracing" | "childIndependentWriting";
export type InkLayer = "model" | "tracing" | "independent";
export type WritingObligation = Readonly<
  | { kind: "soundResponse" }
  | { kind: "modelAndSound" }
  | { kind: "parentModel" }
  | { kind: "parentInstruction" }
  | {
      kind: "phaseConfirmation";
      phase: "childTracing" | "childIndependentWriting";
      practice:
        | { minimum: number; maximum: number; allowMore: true }
        | PracticePrescription;
    }
>;
export type WritingPresentation = Readonly<{
  kind: "writing";
  targetId: TargetId;
  obligation: WritingObligation;
}>;
export type WritingNode = ControlSource &
  Readonly<{
    kind: "turn";
    route: "normal";
    parentRole: "model" | "listen";
    presentation: WritingPresentation;
    next: Destination;
  }>;
export type WritingTarget = Readonly<{
  id: TargetId;
  sourceRefs: readonly SourceRef[];
  logicalWidth: number;
  logicalHeight: number;
  guides: { top: number; midline: number; baseline: number };
  boardY: number;
}>;
export type WritingTask = Readonly<{
  id: TaskId;
  number: number;
  title: Copy;
  optional: true;
  startNodeId: NodeId;
  targets: readonly WritingTarget[];
  nodes: readonly WritingNode[];
}>;
export type WritingScript = Readonly<{
  sourceRefs: readonly SourceRef[];
  guidance: readonly ParentSpan[];
}>;
export type PracticePrescription = Readonly<
  | {
      kind: "qualitative";
      instruction: Copy;
      sourceRef: SourceRef;
      furtherPractice: "parentDirected";
    }
  | {
      kind: "range";
      minimum: number;
      maximum: number;
      sourceRef: SourceRef;
      furtherPractice: "parentDirected";
    }
>;
export type WritingTargetPractice = Readonly<{
  target: WritingTarget;
  demonstration: WritingScript;
  sound: Readonly<{
    prompt: WritingScript;
    expected: WritingScript;
    affirmation: WritingScript;
  }>;
  tracing: Readonly<{
    instruction: WritingScript;
    practice: PracticePrescription;
    praise: WritingScript;
  }>;
  independent: Readonly<{
    instruction: WritingScript;
    practice: PracticePrescription;
    praise: WritingScript;
  }>;
}>;
export type WritingPracticePlan = Readonly<{
  id: TaskId;
  number: number;
  title: Copy;
  optional: true;
  introduction: WritingScript;
  targets: readonly [WritingTargetPractice, WritingTargetPractice];
}>;
export type WritingTargetPracticeV3 = Omit<WritingTargetPractice, "sound"> &
  Readonly<{
    identification:
      | { kind: "parentInstruction"; script: WritingScript }
      | { kind: "soundResponse"; sound: WritingTargetPractice["sound"] };
  }>;
export type WritingPracticePlanV3 = Omit<WritingPracticePlan, "targets"> &
  Readonly<{
    targets: readonly [
      WritingTargetPracticeV3 & {
        identification: { kind: "parentInstruction"; script: WritingScript };
      },
      WritingTargetPracticeV3 & {
        identification: {
          kind: "soundResponse";
          sound: WritingTargetPractice["sound"];
        };
      },
    ];
  }>;
export type WritingAction = Readonly<
  | {
      kind: "confirmTracing";
      targetId: TargetId;
      nodeId: NodeId;
      phase: "childTracing";
    }
  | {
      kind: "confirmIndependent";
      targetId: TargetId;
      nodeId: NodeId;
      phase: "childIndependentWriting";
    }
  | { kind: "skipWriting" }
>;
export type WritingSkippedState = Readonly<{
  version: 1;
  kind: "writingSkipped";
  viewCheckpoint: number | null;
  taskId: TaskId;
  last: ControlTeachingState;
}>;
export type SkipProof = Readonly<{
  taskId: TaskId;
  packageHash: PackageHash;
  sourceRefs: readonly SourceRef[];
  outcome: "skipped";
}>;
export type DocumentToken = Owner &
  Readonly<{
    documentId: DocumentId;
    runId: RunId;
    courseId: CourseId;
    packageHash: PackageHash;
    lessonId: LessonId;
    taskId: TaskId;
    targetId: TargetId;
    revision: Counter;
    phase: WritingPhase;
    inputEpoch: Counter;
  }>;
export type WritingBarrier = Readonly<{
  kind: "writing";
  documents: readonly DocumentToken[];
}>;

export type WritingDevelopmentBody = Omit<
  ControlDevelopmentBody,
  "coverage" | "tasks"
> &
  Readonly<{
    coverage: "lesson1-complete";
    tasks: readonly Exclude<MixedTask, { kind: "printedGraphV2" }>[];
  }>;
