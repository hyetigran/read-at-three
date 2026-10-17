import assert from "node:assert/strict";
import { test } from "node:test";
import { parseHash, parseId } from "../../packages/teaching/src/index.ts";
import type {
  AdvanceId,
  CreditId,
  OccurrenceId,
  CheckpointId,
  CorrectionId,
  CommandId,
  Counter,
  CourseId,
  InstallationId,
  LessonId,
  MigrationHash,
  MigrationId,
  NodeId,
  PackageHash,
  PayloadHash,
  ProfileId,
  ReleaseId,
  RunId,
  SessionId,
  SourceRef,
  TaskId,
  TeachingCommand,
  TransitionPlan,
  ApplyTransitionInput,
  TeachingState,
  CompletionProof,
  AvailableAction,
} from "../../packages/teaching/src/index.ts";
import type { WorkerRequestId } from "../../apps/web/src/platform/protocol.ts";

type DomainPrimitives = {
  counter: Counter;
  credit: CreditId;
  occurrence: OccurrenceId;
  checkpoint: CheckpointId;
  correction: CorrectionId;
  profile: ProfileId;
  session: SessionId;
  run: RunId;
  node: NodeId;
  command: CommandId;
  advance: AdvanceId;
  installation: InstallationId;
  course: CourseId;
  release: ReleaseId;
  lesson: LessonId;
  task: TaskId;
  source: SourceRef;
  migration: MigrationId;
  packageHash: PackageHash;
  payloadHash: PayloadHash;
  migrationHash: MigrationHash;
  workerRequest: WorkerRequestId;
};
type CrossAssignments = {
  [Source in keyof DomainPrimitives]: {
    [Target in Exclude<keyof DomainPrimitives, Source>]: [
      DomainPrimitives[Source],
    ] extends [DomainPrimitives[Target]]
      ? true
      : false;
  }[Exclude<keyof DomainPrimitives, Source>];
}[keyof DomainPrimitives];
type AssertFalse<Value extends false> = Value;
type AssertTrue<Value extends true> = Value;
type AssertNever<Value extends never> = Value;
export type DomainPrimitivesCannotCrossAssign = AssertFalse<CrossAssignments>;
export type PlainStringsAreNotSessionIds = AssertFalse<
  string extends SessionId ? true : false
>;
export type CommandUsesNominalTargets = AssertTrue<
  Extract<TeachingCommand, { kind: "advance" }>["payload"] extends {
    packageHash: PackageHash;
    sessionId: SessionId;
    runId: RunId;
    nodeId: NodeId;
  }
    ? true
    : false
>;
export type CompletionNeedsAnAcceptedOccurrence = AssertFalse<
  {
    kind: "completion";
    after: TeachingState;
    completion: CompletionProof;
  } extends TransitionPlan
    ? true
    : false
>;
export type CompletionNeedsItsProof = AssertFalse<
  {
    kind: "completion";
    after: TeachingState;
    occurrenceId: OccurrenceId;
  } extends TransitionPlan
    ? true
    : false
>;
export type PauseHasNoAcceptanceOrCompletion = AssertNever<
  Extract<
    "occurrenceId" | "completion",
    keyof Extract<TransitionPlan, { kind: "pause" }>
  >
>;
export type AcceptingWritesNeedAnAdvance = AssertFalse<
  Omit<Extract<ApplyTransitionInput, { advanceId: AdvanceId }>, "advanceId"> & {
    advanceId: null;
  } extends ApplyTransitionInput
    ? true
    : false
>;
export type NavigationCannotCreateAnAdvance = AssertFalse<
  Omit<Extract<ApplyTransitionInput, { advanceId: null }>, "advanceId"> & {
    advanceId: AdvanceId;
  } extends ApplyTransitionInput
    ? true
    : false
>;
export type HelpCannotOmitItsPreview = AssertFalse<
  Omit<
    Extract<AvailableAction, { correctionPreview: object }>,
    "correctionPreview"
  > extends AvailableAction
    ? true
    : false
>;

test("identity constructors reject invalid wire values and preserve Unicode IDs", () => {
  assert.equal(
    parseId({ kind: "session", value: "saved-session" }),
    "saved-session",
  );
  const unicode = "🐻".repeat(200);
  assert.equal(parseId({ kind: "profile", value: unicode }), unicode);
  for (const value of [
    undefined,
    null,
    1,
    {},
    "",
    "x".repeat(201),
    "🐻".repeat(201),
  ]) {
    assert.throws(
      () => parseId({ kind: "run", value }),
      /Invalid run identity/,
    );
  }
});

test("hash constructors require complete lowercase SHA-256 hex", () => {
  const value = "a0".repeat(32);
  assert.equal(parseHash({ kind: "package", value }), value);
  assert.equal(parseHash({ kind: "payload", value }), value);
  for (const invalid of [
    undefined,
    null,
    1,
    {},
    "",
    "a".repeat(63),
    "A".repeat(64),
    "g".repeat(64),
  ]) {
    assert.throws(
      () => parseHash({ kind: "package", value: invalid }),
      /Invalid package hash/,
    );
  }
});
