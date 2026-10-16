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
  | "migration";
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
export type HashKind = "package" | "payload" | "migration";
export type Hash<Kind extends HashKind> = string & {
  readonly __brand: `${Kind}Hash`;
};
export type PackageHash = Hash<"package">;
export type PayloadHash = Hash<"payload">;
export type MigrationHash = Hash<"migration">;
type Serialized<Value> = Value extends { readonly __brand: string }
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
export type DevelopmentBody = Readonly<{
  courseId: CourseId;
  releaseId: ReleaseId;
  coverage: "partial-first-m";
  title: Copy;
  lessonId: LessonId;
  taskId: TaskId;
  startNodeId: NodeId;
  nodes: readonly TeachingNode[];
}>;
export type DevelopmentBodyInput = Serialized<DevelopmentBody>;
export type TeachingNodeInput = Serialized<TeachingNode>;
export type DevelopmentPackage = Readonly<{
  formatVersion: 1;
  packageHash: PackageHash;
  body: DevelopmentBody;
}>;
export type TeachingState = Readonly<
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
export type Owner = Readonly<{ profileId: ProfileId; generation: Counter }>;
export type EngineProjection =
  | { kind: "teaching"; turn: TeachingNode }
  | {
      kind: "frontier";
      status: "inProgress";
      unmetObligations: readonly NodeId[];
    };
export type Recovery = Readonly<{
  kind: "recovery";
  code: string;
  message: string;
}>;
type Common = { owner: Owner; packageHash: PackageHash; title: Copy };
type SessionCommon = Common & {
  sessionId: SessionId;
  runId: RunId;
  revision: Counter;
};
export type CommittedProjection = Readonly<
  | (Common & { kind: "entry"; profileRevision: Counter })
  | (SessionCommon & EngineProjection)
  | Recovery
>;
export type TeachingCommand = Readonly<
  {
    commandId: CommandId;
    owner: Owner;
    expectedRevision: Counter;
    payloadHash: PayloadHash;
  } & (
    | {
        kind: "start";
        scope: Readonly<{
          kind: "profile";
          id: ProfileId;
          generation: Counter;
        }>;
        payload: Readonly<{ packageHash: PackageHash }>;
      }
    | {
        kind: "advance";
        scope: Readonly<{
          kind: "session";
          id: SessionId;
          generation: Counter;
        }>;
        payload: Readonly<{
          packageHash: PackageHash;
          sessionId: SessionId;
          runId: RunId;
          nodeId: NodeId;
        }>;
      }
  )
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
export interface TeachingApplication {
  open(): Promise<CommittedProjection>;
  read(): Promise<CommittedProjection>;
  dispatch(command: TeachingCommand): Promise<CommandResult>;
}
export interface StoredContext {
  owner: Owner;
  profileRevision: Counter;
  session: null | {
    sessionId: SessionId;
    runId: RunId;
    revision: Counter;
    runRevision: Counter;
    packageHash: PackageHash;
    state: TeachingState;
    activeAdvanceId: AdvanceId | null;
    nextAdvanceSeq: Counter;
  };
}
export interface TeachingTransaction {
  context(owner: Owner): Promise<StoredContext | null>;
  receipt(
    command: TeachingCommand,
  ): Promise<{ payloadHash: PayloadHash; result: CommitReceipt } | null>;
  start(input: {
    command: TeachingCommand;
    content: DevelopmentPackage;
    state: TeachingState;
    sessionId: SessionId;
    runId: RunId;
    receipt: CommitReceipt;
  }): Promise<void>;
  advance(input: {
    command: TeachingCommand;
    context: StoredContext & { session: NonNullable<StoredContext["session"]> };
    before: TeachingState;
    after: TeachingState;
    advanceId: AdvanceId;
    receipt: CommitReceipt;
  }): Promise<void>;
}
export interface TeachingStore {
  current(): Promise<StoredContext>;
  transaction<T>(work: (tx: TeachingTransaction) => Promise<T>): Promise<T>;
}
