export type IdKind =
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
  | "cycle";
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
export type HashKind = "package" | "payload" | "migration";
export type Hash<Kind extends HashKind> = string & {
  readonly __brand: `${Kind}Hash`;
};
export type PackageHash = Hash<"package">;
export type PayloadHash = Hash<"payload">;
export type MigrationHash = Hash<"migration">;
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
export type ParentSpan = Readonly<{
  kind: "action" | "speech" | "expected" | "praise";
  copy: Copy;
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
  LegacyDevelopmentBody | GraphDevelopmentBody | ControlDevelopmentBody;
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
  LegacyTeachingState | GraphTeachingState | ControlTeachingState;
export type PrintedGraphAction = Readonly<
  | { kind: "continue" | "back" | "repeat" | "pause" }
  | { kind: "help"; correctionId: CorrectionId }
>;
export type SelectionIntent = "start" | "resume" | "replay" | "restart";
export type TeachingIntent =
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
      correctionPreview: GraphNode | ControlTurnNode;
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
  | { kind: "teaching"; turn: TeachingNode | GraphTurn | ControlTurn }
  | {
      kind: "frontier";
      status: "inProgress";
      unmetObligations: readonly NodeId[];
    }
  | ControlSelectionProjection
  | { kind: "completed" };
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
  }>;
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
  runStatus: "inProgress" | "completed";
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
  runStatus: "inProgress" | "completed";
  state: TeachingState;
  activeAdvanceId: AdvanceId | null;
  nextAdvanceSeq: Counter;
}>;
export interface StoredContext {
  owner: Owner;
  profileRevision: Counter;
  undoRunId: RunId | null;
  completedTaskIds: readonly TaskId[];
  activePackageHash: PackageHash;
  selectionCounter: Counter;
  session: StoredSession | null;
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
  content: DevelopmentPackage;
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
  ensurePackage(content: DevelopmentPackage): Promise<void>;
  select(input: {
    command: TeachingCommand;
    context: StoredContext;
    content: DevelopmentPackage;
    selection: SelectionPlan;
    receipt: CommitReceipt;
  }): Promise<void>;
  apply(input: ApplyTransitionInput): Promise<void>;
}
export interface TeachingStore {
  current(): Promise<StoredContext>;
  resolvePackage(packageHash: PackageHash): Promise<DevelopmentPackage>;
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
export type ControlTurnNode = ControlSource &
  Readonly<{
    kind: "turn";
    route: "normal" | "support";
    parentRole: "model" | "listen";
    itemId: ItemId | null;
    presentation: Readonly<{ kind: "oral" }>;
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
  | { kind: "graphControls"; task: ControlTask }
>;
export type ControlDevelopmentBody = Omit<
  GraphDevelopmentBody,
  "coverage" | "tasks"
> &
  Readonly<{
    coverage: "lesson1-sounds-oral-complete";
    tasks: readonly MixedTask[];
  }>;
export type ReviewChoice = Readonly<
  { kind: "none" } | { kind: "items"; itemIds: readonly ItemId[] }
>;
export type GraphAction =
  | PrintedGraphAction
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
