import {
  canonical,
  completionProof,
  currentCheckpoint,
  initialState,
  increment,
  parseCommand,
  parseCounter,
  parseTeachingState,
  validateAcceptanceState,
  validateAcceptanceTransition,
  writingPermission,
  writingTask,
} from "../../teaching/src/index.ts";
import type {
  AdvanceId,
  CompletionProof,
  GraphAction,
  HashFunction,
  Owner,
  RuntimePackage,
  TeachingState,
} from "../../teaching/src/index.ts";
import type * as schema from "./schema.ts";
type AdvanceRow = typeof schema.taskAdvance.$inferSelect;
type RunRow = typeof schema.taskRunV6.$inferSelect;
type WithdrawalRow = typeof schema.advanceWithdrawal.$inferSelect;
function durableReceipt({
  run,
  advance,
  proof,
}: {
  run: RunRow;
  advance: AdvanceRow;
  proof: CompletionProof | import("../../teaching/src/index.ts").SkipProof;
}) {
  return {
    version: 1,
    commandId: advance.commandId,
    terminalAdvanceId: advance.advanceId,
    runId: run.runId,
    runRevision: advance.acceptedRunRevision,
    outcome: "outcome" in proof ? proof.outcome : "completed",
    packageHash: run.packageHash,
    taskId: run.taskId,
    ...("requiredOccurrenceIds" in proof
      ? { requiredOccurrenceIds: proof.requiredOccurrenceIds }
      : {}),
    sourceRefs: proof.sourceRefs,
  };
}
function skipProof(
  content: RuntimePackage,
  state: Extract<TeachingState, { kind: "writingSkipped" }>,
): import("../../teaching/src/index.ts").SkipProof {
  const task = writingTask({ content, taskId: state.taskId });
  if (!task) throw new Error("Skip proof requires optional writing");
  return {
    taskId: state.taskId,
    packageHash: content.packageHash,
    outcome: "skipped",
    sourceRefs: [...new Set(task.nodes.flatMap((n) => n.sourceRefs))],
  };
}
function acceptedId(
  state: TeachingState,
):
  | import("../../teaching/src/index.ts").OccurrenceId
  | import("../../teaching/src/index.ts").NodeId
  | undefined {
  if (state.kind === "writingSkipped") return acceptedId(state.last);
  return state.kind === "graph" || state.kind === "graphControls"
    ? state.acceptedOccurrenceIds.at(-1)
    : state.acceptedNodeIds.at(-1);
}

export { durableReceipt };
export async function validateAcceptanceHistory({
  run,
  session,
  owner,
  content,
  hash,
  advances,
  withdrawals,
  credits,
  documents,
  legacyLimit,
  linear,
}: {
  run: RunRow;
  session: typeof schema.session.$inferSelect;
  owner: Owner;
  content: RuntimePackage;
  hash: HashFunction;
  advances: readonly AdvanceRow[];
  withdrawals: readonly WithdrawalRow[];
  credits: readonly (typeof schema.taskCredit.$inferSelect)[];
  documents: readonly (typeof schema.inkDocument.$inferSelect)[];
  legacyLimit: import("../../teaching/src/index.ts").Counter;
  linear: boolean;
}) {
  let nextSeq = parseCounter("1");
  let allocationRevision = parseCounter("0");
  for (const advance of advances) {
    if (
      BigInt(advance.acceptedRunRevision) <= BigInt(allocationRevision) ||
      advance.seq !== nextSeq ||
      advance.profileId !== owner.profileId ||
      advance.generation !== owner.generation ||
      advance.beforeRunStatus !== "inProgress"
    )
      throw new Error("Saved acceptance allocation is invalid");
    allocationRevision = advance.acceptedRunRevision;
    nextSeq = increment(nextSeq);
  }
  if (nextSeq !== run.nextAdvanceSeq || BigInt(legacyLimit) >= BigInt(nextSeq))
    throw new Error("Saved acceptance allocation head is invalid");
  type Event =
    | { kind: "accept"; revision: typeof run.revision; advance: AdvanceRow }
    | {
        kind: "withdraw";
        revision: typeof run.revision;
        witness: WithdrawalRow;
      };
  const events: Event[] = [
    ...advances.map((advance) => ({
      kind: "accept" as const,
      revision: advance.acceptedRunRevision,
      advance,
    })),
    ...withdrawals.map((witness) => ({
      kind: "withdraw" as const,
      revision: witness.withdrawnRunRevision,
      witness,
    })),
  ];
  events.sort((a, b) =>
    BigInt(a.revision) < BigInt(b.revision)
      ? -1
      : BigInt(a.revision) > BigInt(b.revision)
        ? 1
        : 0,
  );
  let revision = parseCounter("0");
  let baseline = initialState(content, run.taskId);
  let previous: AdvanceId | null = null;
  let terminal: AdvanceRow | undefined;
  const active = new Set<AdvanceId>();
  const popped = new Set<AdvanceId>();
  for (const event of events) {
    if (
      BigInt(event.revision) <= BigInt(revision) ||
      BigInt(event.revision) > BigInt(run.revision)
    )
      throw new Error("Saved acceptance event revision is invalid");
    revision = event.revision;
    if (event.kind === "withdraw") {
      const witness = event.witness;
      const advance = advances.find(
        (value) => value.advanceId === witness.advanceId,
      );
      const command = parseCommand(JSON.parse(witness.command));
      if (
        linear ||
        !advance ||
        advance.advanceId !== previous ||
        !active.has(advance.advanceId) ||
        popped.has(advance.advanceId) ||
        witness.runId !== run.runId ||
        witness.profileId !== owner.profileId ||
        witness.generation !== owner.generation ||
        (command.kind !== "undoAdvance" &&
          command.kind !== "writingUndoAdvance")
      )
        throw new Error("Saved withdrawal witness is invalid");
      const binding = command.payload;
      if (
        command.owner.profileId !== owner.profileId ||
        command.owner.generation !== owner.generation ||
        command.scope.id !== session.sessionId ||
        command.scope.generation !== owner.generation ||
        binding.sessionId !== session.sessionId ||
        binding.runId !== run.runId ||
        binding.packageHash !== run.packageHash ||
        binding.advanceId !== advance.advanceId ||
        increment(binding.runRevision) !== event.revision ||
        BigInt(command.expectedRevision) >= BigInt(session.revision) ||
        (await hash(
          canonical({ kind: command.kind, payload: command.payload }),
        )) !== command.payloadHash
      )
        throw new Error("Saved withdrawal command changed");
      const writing = writingTask({ content, taskId: run.taskId });
      if (writing) {
        if (
          command.kind !== "writingUndoAdvance" ||
          command.payload.barrier.documents.length !== 2 ||
          documents.length !== 2 ||
          new Set(
            command.payload.barrier.documents.map((token) => token.documentId),
          ).size !== 2
        )
          throw new Error("Writing withdrawal requires its document barrier");
        for (const token of command.payload.barrier.documents) {
          const document = documents.find(
            (value) => value.documentId === token.documentId,
          );
          const target = writing.targets.find(
            (value) => value.id === token.targetId,
          );
          if (
            !document ||
            !target ||
            token.profileId !== run.profileId ||
            token.generation !== run.generation ||
            token.runId !== run.runId ||
            token.courseId !== run.courseId ||
            token.packageHash !== run.packageHash ||
            token.lessonId !== run.lessonId ||
            token.taskId !== run.taskId ||
            document.targetId !== token.targetId ||
            document.sourceRefs !== canonical(target.sourceRefs) ||
            document.logicalWidth !== target.logicalWidth ||
            document.logicalHeight !== target.logicalHeight ||
            Number(document.codecVersion) !== 1 ||
            token.phase !==
              writingPermission({
                content,
                state: baseline,
                targetId: target.id,
              }).phase ||
            BigInt(token.revision) > BigInt(document.revision) ||
            BigInt(token.inputEpoch) > BigInt(document.inputEpoch)
          )
            throw new Error("Writing withdrawal document binding changed");
        }
      } else if (command.kind !== "undoAdvance")
        throw new Error("Ordinary withdrawal cannot carry writing documents");
      active.delete(advance.advanceId);
      popped.add(advance.advanceId);
      baseline = parseTeachingState(JSON.parse(advance.beforeState));
      previous = advance.previousAdvanceId;
      terminal = undefined;
      continue;
    }
    const advance = event.advance;
    if (
      terminal ||
      advance.previousAdvanceId !== previous ||
      (linear && advance.status !== "accepted")
    )
      throw new Error("Saved acceptance chain is invalid");
    const before = parseTeachingState(JSON.parse(advance.beforeState));
    const after = parseTeachingState(JSON.parse(advance.afterState));
    validateAcceptanceState({
      content,
      taskId: run.taskId,
      baseline,
      state: before,
    });
    let action: GraphAction | undefined;
    if (advance.acceptingCommand !== null) {
      const semantics: unknown = JSON.parse(advance.acceptingCommand);
      if (
        typeof semantics !== "object" ||
        semantics === null ||
        !("kind" in semantics) ||
        !("payload" in semantics) ||
        canonical(Object.keys(semantics).sort()) !==
          canonical(["kind", "payload"])
      )
        throw new Error("Invalid accepting command preimage");
      if ((await hash(canonical(semantics))) !== advance.payloadHash)
        throw new Error("Accepting command payload hash changed");
      const command = parseCommand({
        ...semantics,
        commandId: advance.commandId,
        owner,
        scope: {
          kind: "session",
          id: session.sessionId,
          generation: owner.generation,
        },
        expectedRevision: "0",
        payloadHash: advance.payloadHash,
      });
      if (
        command.kind !== "navigate" &&
        command.kind !== "writingNavigate" &&
        command.kind !== "advance"
      )
        throw new Error("Invalid accepting command kind");
      if (
        command.payload.packageHash !== run.packageHash ||
        command.payload.sessionId !== session.sessionId ||
        command.payload.runId !== run.runId
      )
        throw new Error("Accepting command ownership changed");
      const writing = writingTask({ content: content, taskId: run.taskId });
      if (writing) {
        if (command.kind !== "writingNavigate")
          throw new Error("Writing acceptance requires its document barrier");
        if (
          documents.length !== 2 ||
          command.payload.barrier.documents.length !== 2 ||
          new Set(command.payload.barrier.documents.map((t) => t.documentId))
            .size !== 2
        )
          throw new Error("Writing acceptance document set changed");
        for (const token of command.payload.barrier.documents) {
          const document = documents.find(
              (d) => d.documentId === token.documentId,
            ),
            target = writing.targets.find((t) => t.id === token.targetId);
          if (
            !document ||
            !target ||
            token.profileId !== run.profileId ||
            token.generation !== run.generation ||
            token.runId !== run.runId ||
            token.courseId !== run.courseId ||
            token.packageHash !== run.packageHash ||
            token.lessonId !== run.lessonId ||
            token.taskId !== run.taskId ||
            document.targetId !== token.targetId ||
            document.sourceRefs !== canonical(target.sourceRefs) ||
            document.logicalWidth !== target.logicalWidth ||
            document.logicalHeight !== target.logicalHeight ||
            Number(document.codecVersion) !== 1 ||
            token.phase !==
              writingPermission({
                content: content,
                state: before,
                targetId: target.id,
              }).phase ||
            BigInt(token.revision) > BigInt(document.revision) ||
            BigInt(token.inputEpoch) > BigInt(document.inputEpoch)
          )
            throw new Error("Writing acceptance document binding changed");
        }
      } else if (command.kind === "writingNavigate")
        throw new Error("Ordinary acceptance cannot carry a writing command");
      if (command.kind === "navigate" || command.kind === "writingNavigate") {
        if (
          (before.kind !== "graph" && before.kind !== "graphControls") ||
          command.payload.checkpointId !== currentCheckpoint(before).id
        )
          throw new Error("Accepting command checkpoint changed");
        action = command.payload.action;
        if (before.kind === "graph" && action.kind !== "continue")
          throw new Error("Printed acceptance command changed");
      } else if (
        before.kind !== "teaching" ||
        command.payload.nodeId !== before.nodeId
      )
        throw new Error("Legacy acceptance target changed");
    } else if (
      before.kind === "graphControls" ||
      BigInt(advance.seq) > BigInt(legacyLimit)
    )
      throw new Error("Control acceptance requires explicit command");
    const occurrenceId =
      before.kind === "graphControls"
        ? currentCheckpoint(before).occurrenceId
        : acceptedId(after);
    if (!occurrenceId) throw new Error("Accepted occurrence is missing");
    validateAcceptanceTransition({
      content: content,
      taskId: run.taskId,
      before,
      after,
      occurrenceId,
      ...(action ? { action } : {}),
    });
    const proof =
      after.kind === "writingSkipped"
        ? skipProof(content, after)
        : completionProof(content, after);
    if (
      advance.afterRunStatus !==
      (after.kind === "writingSkipped"
        ? "skipped"
        : proof
          ? "completed"
          : "inProgress")
    )
      throw new Error("Saved acceptance outcome is invalid");
    if (proof) terminal = advance;

    baseline = after;
    previous = advance.advanceId;
    active.add(advance.advanceId);
  }
  if (
    advances.some(
      (advance) =>
        (advance.status === "accepted") !== active.has(advance.advanceId) ||
        (advance.status === "withdrawn") !== popped.has(advance.advanceId),
    )
  )
    throw new Error("Saved acceptance status has no chronological evidence");
  const state = parseTeachingState(JSON.parse(run.state));
  validateAcceptanceState({ content, taskId: run.taskId, baseline, state });
  if (
    previous !== run.activeAdvanceId ||
    Boolean(terminal) !==
      (run.status === "completed" || run.status === "skipped") ||
    (state.kind === "writingSkipped"
      ? run.status !== "skipped"
      : Boolean(completionProof(content, state)) !==
        (run.status === "completed"))
  )
    throw new Error("Saved acceptance head is invalid");
  let terminalCount = 0;
  for (const advance of advances) {
    const after = parseTeachingState(JSON.parse(advance.afterState));
    const proof =
      after.kind === "writingSkipped"
        ? skipProof(content, after)
        : completionProof(content, after);
    if (!proof) continue;
    terminalCount++;
    const matching = credits.filter(
      (credit) => credit.terminalAdvanceId === advance.advanceId,
    );
    const credit = matching[0];
    if (
      !credit ||
      matching.length !== 1 ||
      credit.status !==
        (advance.status === "accepted" ? "valid" : "withdrawn") ||
      credit.outcome !== advance.afterRunStatus ||
      Number(credit.receiptVersion) !== 1 ||
      canonical(JSON.parse(credit.receipt)) !==
        canonical(durableReceipt({ run, advance, proof }))
    )
      throw new Error("Durable task completion receipt is invalid");
  }
  if (credits.length !== terminalCount)
    throw new Error("Completion credit has no terminal acceptance");
}
