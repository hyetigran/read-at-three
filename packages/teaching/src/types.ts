export type Counter = string & { readonly __brand: "Counter" };
export type HashFunction = (text: string) => Promise<string>;
export type IdFactory = () => string;
export type Copy = Readonly<
  | { kind: "source" | "adapted"; text: string; sourceRef: string }
  | { kind: "added"; text: string }
>;
export type TeachingNode = Readonly<{
  id: string;
  parentAction: Copy;
  spoken: Copy;
  expected: Copy;
  parentRole: "model" | "listen";
  glyph: "m";
  cue: Readonly<{ kind: "sustain"; durationMs: number }>;
  next: Readonly<
    | { kind: "node"; nodeId: string }
    | { kind: "frontier"; unmetObligations: readonly string[] }
  >;
}>;
export type DevelopmentBody = Readonly<{
  courseId: string;
  releaseId: string;
  coverage: "partial-first-m";
  title: Copy;
  lessonId: string;
  taskId: string;
  startNodeId: string;
  nodes: readonly TeachingNode[];
}>;
export type DevelopmentPackage = Readonly<{
  formatVersion: 1;
  packageHash: string;
  body: DevelopmentBody;
}>;
export type TeachingState = Readonly<
  | {
      version: 1;
      kind: "teaching";
      nodeId: string;
      acceptedNodeIds: readonly string[];
    }
  | {
      version: 1;
      kind: "frontier";
      acceptedNodeIds: readonly string[];
      unmetObligations: readonly string[];
    }
>;
export type Owner = Readonly<{ profileId: string; generation: Counter }>;
export type EngineProjection =
  | { kind: "teaching"; turn: TeachingNode }
  | {
      kind: "frontier";
      status: "inProgress";
      unmetObligations: readonly string[];
    };
export type Recovery = Readonly<{
  kind: "recovery";
  code: string;
  message: string;
}>;
type Common = { owner: Owner; packageHash: string; title: Copy };
type SessionCommon = Common & {
  sessionId: string;
  runId: string;
  revision: Counter;
};
export type CommittedProjection = Readonly<
  | (Common & { kind: "entry"; profileRevision: Counter })
  | (SessionCommon & EngineProjection)
  | Recovery
>;
export type TeachingCommand = Readonly<
  {
    commandId: string;
    owner: Owner;
    expectedRevision: Counter;
    payloadHash: string;
  } & (
    | {
        kind: "start";
        scope: Readonly<{ kind: "profile"; id: string; generation: Counter }>;
        payload: Readonly<{ packageHash: string }>;
      }
    | {
        kind: "advance";
        scope: Readonly<{ kind: "session"; id: string; generation: Counter }>;
        payload: Readonly<{
          packageHash: string;
          sessionId: string;
          runId: string;
          nodeId: string;
        }>;
      }
  )
>;
export type CommitReceipt = Readonly<{
  kind: "committed";
  commandId: string;
  owner: Owner;
  sessionId: string;
  runId: string;
  revision: Counter;
  packageHash: string;
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
    sessionId: string;
    runId: string;
    revision: Counter;
    runRevision: Counter;
    packageHash: string;
    state: TeachingState;
    activeAdvanceId: string | null;
    nextAdvanceSeq: Counter;
  };
}
export interface TeachingTransaction {
  context(owner: Owner): Promise<StoredContext | null>;
  receipt(
    command: TeachingCommand,
  ): Promise<{ payloadHash: string; result: CommitReceipt } | null>;
  start(input: {
    command: TeachingCommand;
    content: DevelopmentPackage;
    state: TeachingState;
    sessionId: string;
    runId: string;
    receipt: CommitReceipt;
  }): Promise<void>;
  advance(input: {
    command: TeachingCommand;
    context: StoredContext & { session: NonNullable<StoredContext["session"]> };
    before: TeachingState;
    after: TeachingState;
    advanceId: string;
    receipt: CommitReceipt;
  }): Promise<void>;
}
export interface TeachingStore {
  current(): Promise<StoredContext>;
  transaction<T>(work: (tx: TeachingTransaction) => Promise<T>): Promise<T>;
}
