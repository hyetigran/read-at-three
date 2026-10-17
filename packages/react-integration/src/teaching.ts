import { useSyncExternalStore } from "react";
import { canonical, increment } from "@readatthree/teaching";
import { MutationObserver, QueryObserver } from "@tanstack/react-query";
import type {
  MutationObserverResult,
  QueryClient,
  QueryObserverResult,
} from "@tanstack/react-query";
import type {
  ApplicationRead,
  SelectedOwnerWitness,
  SelectedTeachingOperation,
  SelectedReadTarget,
  SelectedApplication,
  ExecutionResult,
  ProfileDirectory,
  CurrentResult,
  RecoveryResult,
  Counter,
  CourseReadTarget,
  CommandResult,
  CommitReceipt,
  CommittedProjection,
  CourseId,
  DocumentToken,
  Owner,
  TeachingCommand,
  PracticeControlsBinding,
  PracticeControlsSummary,
} from "@readatthree/teaching";

export type PreparedAction = Readonly<{
  operation: SelectedTeachingOperation;
  origin: CommittedProjection;
}>;
export type ReadEnvelope = Readonly<{
  directory: ProfileDirectory;
  courseId: CourseId;
  projection: CommittedProjection;
  application?: Extract<ApplicationRead, { kind: "ready" }>;
}>;
export class TeachingRecoveryError extends Error {
  readonly code: string;
  constructor(
    recovery: Pick<
      Extract<CommittedProjection, { kind: "recovery" }>,
      "code" | "message"
    >,
  ) {
    super(recovery.message);
    this.name = "TeachingRecoveryError";
    this.code = recovery.code;
  }
}
export interface TeachingRepository {
  read(input: SelectedReadTarget): Promise<ReadEnvelope>;
  readPracticeControls?(
    input: Parameters<SelectedApplication["readPracticeControls"]>[0],
  ): Promise<CurrentResult<PracticeControlsSummary>>;
  execute(operation: SelectedTeachingOperation): Promise<ExecutionResult>;
  recoverTeaching(
    input: Parameters<SelectedApplication["recoverTeaching"]>[0],
  ): Promise<RecoveryResult<CommitReceipt>>;
}
export type ReadExpectation = Readonly<{ minimumAdministration?: Counter }> &
  (
    | Readonly<{ kind: "opening"; selection: SelectedOwnerWitness }>
    | Readonly<{
        kind: "refresh";
        selection: SelectedOwnerWitness;
        courseId: CourseId;
      }>
    | Readonly<{
        kind: "receipt";
        courseId: CourseId;
        prepared: PreparedAction;
        receipt: CommitReceipt;
        restoreBinding: Readonly<
          | { kind: "normal" }
          | { kind: "reconciled"; projection: CommittedProjection }
        >;
      }>
  );
export type Attempt =
  | Readonly<{ kind: "normal"; prepared: PreparedAction }>
  | Readonly<{
      kind: "closedRecovery";
      recoveryId: string;
      prepared: PreparedAction;
    }>;
export type AttemptResult =
  | Readonly<{ kind: "visible"; receipt: CommitReceipt }>
  | Readonly<{ kind: "resolved"; result: CommandResult }>;
export type QuerySnapshot = Readonly<{
  recovery: TeachingRecoveryError | null;
  visible: Pick<
    QueryObserverResult<ReadEnvelope, Error>,
    "data" | "status" | "fetchStatus" | "error"
  >;
  read: Pick<
    QueryObserverResult<ReadEnvelope, Error>,
    "status" | "fetchStatus" | "error"
  >;
  mutation: Pick<
    MutationObserverResult<AttemptResult, Error, Attempt>,
    "status" | "error" | "isPaused"
  >;
}>;
export interface CommittedTeachingView {
  subscribe(listener: () => void): () => void;
  getSnapshot(): QuerySnapshot;
}
export type RestoreTeaching = (read: ReadEnvelope) => Promise<
  Readonly<{
    activate(): void;
    publish?(): void;
    practiceControls?: PracticeControlsSummary;
  }>
>;
export interface PracticeControlsView {
  subscribe(listener: () => void): () => void;
  getSnapshot(): PracticeControlsSummary;
}
export interface CommittedTeachingExecution {
  readonly view: CommittedTeachingView;
  readonly practiceControls: PracticeControlsView;
  current(): ReadEnvelope | undefined;
  read(
    input: Readonly<{ expectation: ReadExpectation }>,
  ): Promise<ReadEnvelope>;
  execute(attempt: Attempt): Promise<AttemptResult>;
  connectionLost(): void;
  retire(): void;
  adoptDirectory(directory: ProfileDirectory): boolean;
  captureFinalized(input: Readonly<{ token: DocumentToken }>): void;
  inkCommitted(input: Readonly<{ token: DocumentToken }>): void;
  close(): void;
}
function keyFor(read: ReadEnvelope): readonly string[] {
  const view = read.projection;
  if (view.kind === "recovery") throw new TeachingRecoveryError(view);
  return [
    "teaching",
    read.directory.selection.installationId,
    read.directory.selection.revision,
    read.directory.administration.revision,
    view.owner.profileId,
    view.owner.generation,
    read.courseId,
    read.application?.witness.activePackageHash ?? view.packageHash,
    view.packageHash,
    view.kind === "entry" ? "entry" : view.sessionId,
    ...(view.kind === "writing" || view.kind === "writingResult"
      ? view.documents.map((token) => token.documentId)
      : []),
  ];
}
function matchesCommandReceipt({
  command,
  receipt,
}: Readonly<{
  command: TeachingCommand;
  receipt: CommitReceipt;
}>) {
  return (
    receipt.commandId === command.commandId &&
    receipt.revision === increment(command.expectedRevision) &&
    receipt.packageHash === command.payload.packageHash &&
    (command.kind === "start" ||
      command.kind === "select" ||
      command.kind === "writingSelect" ||
      (receipt.sessionId === command.payload.sessionId &&
        receipt.runId === command.payload.runId)) &&
    receipt.owner.profileId === command.owner.profileId &&
    receipt.owner.generation === command.owner.generation
  );
}
function matchesReceipt({
  projection,
  command,
  receipt,
}: Readonly<{
  projection: CommittedProjection;
  command: TeachingCommand;
  receipt: CommitReceipt;
}>) {
  return (
    projection.kind !== "recovery" &&
    projection.kind !== "entry" &&
    matchesCommandReceipt({ command, receipt }) &&
    projection.owner.profileId === receipt.owner.profileId &&
    projection.owner.generation === receipt.owner.generation &&
    projection.sessionId === receipt.sessionId &&
    projection.runId === receipt.runId &&
    projection.packageHash === receipt.packageHash &&
    (command.scope.kind === "profile"
      ? projection.profileRevision
      : projection.revision) === receipt.revision
  );
}
function expectedSelection(expectation: ReadExpectation): SelectedOwnerWitness {
  return expectation.kind === "receipt"
    ? expectation.prepared.operation.selection
    : expectation.selection;
}
function targetFor(expectation: ReadExpectation): SelectedReadTarget {
  if (expectation.kind !== "receipt")
    return { selection: expectation.selection, target: { kind: "cursor" } };
  if (
    !matchesCommandReceipt({
      command: expectation.prepared.operation.command,
      receipt: expectation.receipt,
    })
  )
    throw new Error("The saved reading place did not match this save.");
  return {
    selection: expectation.prepared.operation.selection,
    target: { kind: "accepted", receipt: expectation.receipt },
  };
}
const readOnlyControls: PracticeControlsSummary = Object.freeze({
  kind: "readOnly",
});
let runtimeSerial = 0;
export function createCommittedTeaching({
  queryClient,
  repository,
  stageRestore,
}: Readonly<{
  queryClient: QueryClient;
  repository: TeachingRepository;
  stageRestore: RestoreTeaching;
}>): CommittedTeachingExecution {
  const runtimeId = ++runtimeSerial;
  let lease = 0;
  let attemptSerial = 0;
  let closed = false;
  let recovery: TeachingRecoveryError | null = null;
  const listeners = new Set<() => void>();
  const inactive = {
    enabled: false,
    retry: false,
    networkMode: "always",
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  } satisfies Omit<
    Parameters<QueryObserver<ReadEnvelope>["setOptions"]>[0],
    "queryKey"
  >;
  const selected = new QueryObserver<ReadEnvelope, Error>(queryClient, {
    ...inactive,
    queryKey: ["teaching-unopened", runtimeId],
  });
  const resolver = new QueryObserver<ReadEnvelope, Error>(queryClient, {
    ...inactive,
    queryKey: ["teaching-resolver", runtimeId, "unopened"],
  });
  const controls = new QueryObserver<PracticeControlsSummary, Error>(
    queryClient,
    {
      ...inactive,
      queryKey: ["practice-controls-empty", String(runtimeId)],
      initialData: { kind: "readOnly" },
    },
  );
  const controlListeners = new Set<() => void>();
  let publishing = false;
  let controlsChanged = false;
  const detachControls = controls.subscribe(() => {
    if (publishing) {
      controlsChanged = true;
      return;
    }
    for (const listener of controlListeners) listener();
  });
  function publishControls(
    summary: PracticeControlsSummary,
    publishingSelection: SelectedOwnerWitness,
  ) {
    const previousKey = controls.getCurrentQuery().queryKey;
    const queryKey =
      summary.kind === "editable"
        ? [
            "practice-controls",
            publishingSelection.installationId,
            publishingSelection.revision,
            summary.binding.owner.profileId,
            summary.binding.owner.generation,
            summary.token.courseId,
            summary.binding.packageHash,
            summary.binding.sessionId,
            summary.binding.runId,
            summary.token.documentId,
            String(runtimeId),
          ]
        : ["practice-controls-empty", String(runtimeId)];
    const publishingLease = lease;
    queryClient.setQueryData(queryKey, summary);
    controls.setOptions({
      ...inactive,
      queryKey,
      queryFn: async () => {
        checkLease(publishingLease);
        if (summary.kind === "readOnly") return summary;
        if (!repository.readPracticeControls)
          throw new Error("Practice repository unavailable");
        const read = await repository.readPracticeControls({
          selection: publishingSelection,
          binding: summary.binding,
        });
        if (canonical(read.selection) !== canonical(publishingSelection))
          throw new Error("Selected controls lifetime changed");
        const next = read.value;
        checkLease(publishingLease);
        if (canonical(next) !== canonical(summary))
          throw new Error(
            "Changed practice controls require a guarded repository read.",
          );
        return next;
      },
    });
    if (canonical(previousKey) !== canonical(queryKey))
      queryClient.removeQueries({ queryKey: previousKey, exact: true });
  }
  let summaryWanted = 0;
  let summaryReading = false;
  async function refreshControls() {
    if (summaryReading || !repository.readPracticeControls) return;
    summaryReading = true;
    try {
      while (!closed) {
        const wanted = summaryWanted,
          readingLease = lease,
          selectedRead = selected.getCurrentResult().data;
        if (!selectedRead || selectedRead.projection.kind !== "writing") break;
        const projection = selectedRead.projection;
        const binding = {
          owner: projection.owner,
          sessionId: projection.sessionId,
          runId: projection.runId,
          packageHash: projection.packageHash,
        };
        const queryKey = [
          "practice-controls-read",
          projection.owner.profileId,
          projection.owner.generation,
          selectedRead.courseId,
          projection.packageHash,
          projection.sessionId,
          projection.runId,
          ...projection.documents.map((token) => token.documentId),
          runtimeId,
          readingLease,
          wanted,
        ];
        try {
          const summary = await queryClient.query({
            ...inactive,
            queryKey,
            queryFn: () =>
              repository.readPracticeControls
                ? repository.readPracticeControls({
                    selection: selectedRead.directory.selection,
                    binding,
                  })
                : Promise.resolve<CurrentResult<PracticeControlsSummary>>({
                    selection: selectedRead.directory.selection,
                    value: { kind: "readOnly" },
                  }),
          });
          checkLease(readingLease);
          if (
            wanted === summaryWanted &&
            selected.getCurrentResult().data === selectedRead
          ) {
            if (
              canonical(summary.selection) !==
              canonical(selectedRead.directory.selection)
            )
              throw new Error("Selected controls lifetime changed");
            publishControls(summary.value, selectedRead.directory.selection);
          }
        } finally {
          queryClient.removeQueries({ queryKey, exact: true });
        }
        if (wanted === summaryWanted) break;
      }
    } catch {
    } finally {
      summaryReading = false;
    }
  }
  function checkLease(expected: number) {
    if (closed || lease !== expected)
      throw new Error(
        "The local store connection changed before the saved place could be shown.",
      );
  }
  function verify(read: ReadEnvelope, expectation: ReadExpectation) {
    const view = read.projection;
    if (view.kind === "recovery") throw new TeachingRecoveryError(view);
    if (
      canonical(read.directory.selection) !==
      canonical(expectedSelection(expectation))
    )
      throw new Error(
        "The selected child lifetime changed before publication.",
      );
    if (
      expectation.minimumAdministration !== undefined &&
      BigInt(read.directory.administration.revision) <
        BigInt(expectation.minimumAdministration)
    )
      throw new Error("A newer committed profile directory is required.");
    if (expectation.kind === "opening") return;
    const owner =
      expectation.kind === "refresh"
        ? expectation.selection.owner
        : expectation.prepared.operation.command.owner;
    if (
      read.courseId !== expectation.courseId ||
      view.owner.profileId !== owner.profileId ||
      view.owner.generation !== owner.generation
    )
      throw new Error("The saved reading owner or course changed.");
    if (
      expectation.kind === "receipt" &&
      !matchesReceipt({
        projection: view,
        command: expectation.prepared.operation.command,
        receipt: expectation.receipt,
      })
    )
      throw new Error("The saved reading place did not match this save.");
    if (expectation.kind === "receipt") {
      if (
        expectation.restoreBinding.kind === "reconciled" &&
        (!read.application ||
          expectation.prepared.operation.command.kind === "writingControl")
      ) {
        if (
          canonical(view) !== canonical(expectation.restoreBinding.projection)
        )
          throw new Error("The reconciled reading binding changed.");
      } else if (
        expectation.prepared.operation.command.kind === "writingControl"
      ) {
        const command = expectation.prepared.operation.command;
        if (view.kind !== "writing")
          throw new Error("The practice control left its writing context.");
        const expected = command.payload.barrier.documents.map((token) =>
          token.documentId === command.payload.documentId
            ? {
                ...token,
                revision: increment(token.revision),
                inputEpoch: increment(token.inputEpoch),
              }
            : token,
        );
        if (
          canonical(
            [...view.documents].sort((a, b) =>
              a.documentId.localeCompare(b.documentId),
            ),
          ) !==
          canonical(
            [...expected].sort((a, b) =>
              a.documentId.localeCompare(b.documentId),
            ),
          )
        )
          throw new Error(
            "The practice control documents did not match this save.",
          );
      }
    }
  }
  async function read({
    expectation,
  }: Readonly<{ expectation: ReadExpectation }>): Promise<ReadEnvelope> {
    const readingLease = lease;
    checkLease(readingLease);
    const readingAttempt = ++attemptSerial;
    function checkRead() {
      checkLease(readingLease);
      if (readingAttempt !== attemptSerial)
        throw new Error("A newer committed read replaced this attempt.");
    }
    const queryKey = [
      "teaching-resolver",
      runtimeId,
      readingLease,
      readingAttempt,
    ];
    let staged: Awaited<ReturnType<RestoreTeaching>> | undefined;
    const options = {
      ...inactive,
      queryKey,
      staleTime: 0,
      queryFn: async () => {
        const value = await repository.read(targetFor(expectation));
        if (value.projection.kind === "recovery")
          throw new TeachingRecoveryError(value.projection);
        checkRead();
        verify(value, expectation);
        staged = await stageRestore(value);
        checkRead();
        return value;
      },
    };
    resolver.setOptions(options);
    queryClient.removeQueries({
      queryKey: ["teaching-resolver", runtimeId, "unopened"],
      exact: true,
    });
    try {
      const value = await queryClient.query(options);
      checkRead();
      if (!staged) throw new Error("The saved writing was not restored.");
      const canonicalKey = keyFor(value);
      const canonicalOptions = {
        ...inactive,
        queryKey: canonicalKey,
        queryFn: async () => {
          checkLease(readingLease);
          const next = await repository.read(targetFor(expectation));
          checkLease(readingLease);
          verify(next, expectation);
          if (JSON.stringify(keyFor(next)) !== JSON.stringify(canonicalKey))
            throw new Error("The committed reading identity changed.");
          if (canonical(next) !== canonical(value))
            throw new Error(
              "Changed committed data requires a fenced read and canonical restore.",
            );
          return next;
        },
      };
      summaryWanted++;
      publishing = true;
      try {
        staged.activate();
        queryClient.setQueryData(canonicalKey, value);
        selected.setOptions(canonicalOptions);
        publishControls(
          staged.practiceControls ?? { kind: "readOnly" },
          value.directory.selection,
        );
        recovery = null;
        currentSnapshot = snapshot();
        staged.publish?.();
      } finally {
        publishing = false;
      }
      changed();
      if (controlsChanged) {
        controlsChanged = false;
        for (const listener of controlListeners) listener();
      }
      return value;
    } catch (error) {
      if (
        error instanceof TeachingRecoveryError &&
        !closed &&
        readingAttempt === attemptSerial
      ) {
        recovery = error;
        changed();
      }
      throw error;
    } finally {
      queryClient.removeQueries({ queryKey, exact: true });
    }
  }
  const mutation = new MutationObserver<AttemptResult, Error, Attempt>(
    queryClient,
    {
      retry: false,
      networkMode: "always",
      mutationFn: async (attempt) => {
        const executingLease = lease;
        checkLease(executingLease);
        switch (attempt.kind) {
          case "closedRecovery": {
            const result = await repository.recoverTeaching({
              recoveryId: attempt.recoveryId,
              operation: attempt.prepared.operation,
            });
            checkLease(executingLease);
            return { kind: "resolved", result: result.result };
          }
          case "normal": {
            const origin = selected.getCurrentResult().data;
            if (!origin)
              throw new Error("The saved reading place is unavailable.");
            if (
              canonical(origin.directory.selection) !==
              canonical(attempt.prepared.operation.selection)
            )
              throw new Error(
                "This teaching operation belongs to a retired selection.",
              );
            const response = await repository.execute(
              attempt.prepared.operation,
            );
            if (response.kind !== "teaching")
              throw new Error("Teaching result required");
            const result = response.result;
            if (
              result.kind === "committed" &&
              canonical(response.selection) !==
                canonical(attempt.prepared.operation.selection)
            )
              throw new Error("Committed teaching selection changed.");
            checkLease(executingLease);
            if (result.kind === "rejected") return { kind: "resolved", result };
            await read({
              expectation: {
                kind: "receipt",
                courseId: origin.courseId,
                prepared: attempt.prepared,
                receipt: result,
                restoreBinding: { kind: "normal" },
              },
            });
            checkLease(executingLease);
            await queryClient.invalidateQueries({
              queryKey: [
                "teaching",
                attempt.prepared.operation.selection.installationId,
                attempt.prepared.operation.selection.revision,
                origin.directory.administration.revision,
                result.owner.profileId,
                result.owner.generation,
                origin.courseId,
                result.packageHash,
              ],
              refetchType: "none",
            });
            checkLease(executingLease);
            return { kind: "visible", receipt: result };
          }
          default: {
            const exhaustive: never = attempt;
            return exhaustive;
          }
        }
      },
    },
  );
  function snapshot(): QuerySnapshot {
    const visible = selected.getCurrentResult();
    const reading = resolver.getCurrentResult();
    const mutating = mutation.getCurrentResult();
    return {
      recovery,
      visible: {
        data: visible.data,
        status: visible.status,
        fetchStatus: visible.fetchStatus,
        error: visible.error,
      },
      read: {
        status: reading.status,
        fetchStatus: reading.fetchStatus,
        error: reading.error,
      },
      mutation: {
        status: mutating.status,
        error: mutating.error,
        isPaused: mutating.isPaused,
      },
    };
  }
  let currentSnapshot = snapshot();
  function changed() {
    if (publishing) return;
    currentSnapshot = snapshot();
    for (const listener of listeners) listener();
  }
  const detach = [
    selected.subscribe(changed),
    resolver.subscribe(changed),
    mutation.subscribe(changed),
  ];
  return {
    view: {
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      getSnapshot: () => currentSnapshot,
    },
    practiceControls: {
      subscribe(listener) {
        controlListeners.add(listener);
        return () => {
          controlListeners.delete(listener);
        };
      },
      getSnapshot: () => controls.getCurrentResult().data ?? readOnlyControls,
    },
    current: () => selected.getCurrentResult().data,
    read,
    execute: (attempt) => mutation.mutate(attempt),
    connectionLost() {
      lease++;
    },
    retire() {
      lease++;
      attemptSerial++;
      const current = selected.getCurrentResult().data;
      if (current)
        publishControls({ kind: "readOnly" }, current.directory.selection);
    },
    adoptDirectory(directory) {
      const current = selected.getCurrentResult().data;
      if (
        !current ||
        closed ||
        canonical(current.directory.selection) !==
          canonical(directory.selection) ||
        BigInt(directory.administration.revision) <
          BigInt(current.directory.administration.revision)
      )
        return false;
      const active = (value: ProfileDirectory) =>
        value.profiles.find(
          (profile) =>
            canonical(profile.edit.owner) === canonical(value.selection.owner),
        );
      if (canonical(active(current.directory)) !== canonical(active(directory)))
        return false;
      const next = { ...current, directory };
      const publishingLease = lease;
      const queryKey = keyFor(next);
      queryClient.setQueryData(queryKey, next);
      selected.setOptions({
        ...inactive,
        queryKey,
        queryFn: async () => {
          checkLease(publishingLease);
          const read = await repository.read({
            selection: directory.selection,
            target: { kind: "cursor" },
          });
          checkLease(publishingLease);
          if (canonical(read) !== canonical(next))
            throw new Error("Changed committed data requires a guarded read.");
          return read;
        },
      });
      changed();
      return true;
    },
    captureFinalized() {
      summaryWanted++;
      void refreshControls();
    },
    inkCommitted({ token }) {
      void queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "teaching" &&
          query.queryKey[4] === token.profileId &&
          query.queryKey[5] === token.generation &&
          query.queryKey.includes(token.documentId),
        refetchType: "none",
      });
    },
    close() {
      closed = true;
      lease++;
      for (const unsubscribe of detach) unsubscribe();
      selected.destroy();
      resolver.destroy();
      detachControls();
      const controlsKey = controls.getCurrentQuery().queryKey;
      controls.destroy();
      controlListeners.clear();
      queryClient.removeQueries({ queryKey: controlsKey, exact: true });
      listeners.clear();
    },
  };
}
export function useCommittedTeaching(
  view: CommittedTeachingView,
): QuerySnapshot {
  return useSyncExternalStore(
    view.subscribe,
    view.getSnapshot,
    view.getSnapshot,
  );
}
