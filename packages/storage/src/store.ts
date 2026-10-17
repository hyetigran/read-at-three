import { createInkRepository } from "./ink.ts";
import { and, eq, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  canonical,
  completionProof,
  createCoordinator,
  initialState,
  increment,
  parseCounter,
  parseId,
  parseDevelopmentPackage,
  parseReceipt,
  parseCommand,
  currentCheckpoint,
  parseTeachingState,
  validatePosition,
  validateAcceptanceState,
  validateAcceptanceTransition,
  writingTask,
  writingPermission,
  parseInkCommand,
  parseRecoveryOpening,
  parseRecoveryChoice,
  parseRecoveryInventory,
} from "../../teaching/src/index.ts";
import type {
  AdvanceId,
  CommitReceipt,
  CommittedProjection,
  CompletionProof,
  DevelopmentPackage,
  HashFunction,
  GraphAction,
  IdFactory,
  Owner,
  PackageHash,
  StoredContext,
  StoredSession,
  TeachingApplication,
  TeachingCommand,
  TeachingState,
  TeachingStore,
  TeachingTransaction,
  WritingApplication,
  RecoveryOpening,
  RecoveryChoice,
  RecoveryInventory,
  RecoveryTeaching,
  InkResult,
  StrokeId,
} from "../../teaching/src/index.ts";
import { sqlValues } from "./executor.ts";
import type { SqlExecutor } from "./executor.ts";
import {
  DATABASE_VERSION,
  initializeDatabase,
  transaction,
} from "./migration.ts";
import * as schema from "./schema.ts";
import { utf8, equalBytes, decodeUtf8 } from "./utf8.ts";

function isCumulativeOralExtension({
  previous,
  candidate,
}: {
  previous: DevelopmentPackage;
  candidate: DevelopmentPackage;
}): boolean {
  if (
    previous.body.coverage !== "lesson1-sounds-oral-complete" ||
    (candidate.body.coverage !== "lesson1-sounds-oral-complete" &&
      candidate.body.coverage !== "lesson1-complete")
  )
    return false;
  const old = previous.body,
    next = candidate.body;
  if (
    old.courseId !== next.courseId ||
    old.lessonId !== next.lessonId ||
    canonical(old.title) !== canonical(next.title) ||
    canonical(old.lessonTasks) !== canonical(next.lessonTasks) ||
    next.tasks.length <= old.tasks.length
  )
    return false;
  const retained = next.tasks.filter((entry) =>
    old.tasks.some((previousEntry) => previousEntry.task.id === entry.task.id),
  );
  return canonical(retained) === canonical(old.tasks);
}

type AdvanceRow = typeof schema.taskAdvance.$inferSelect;
type RunRow = typeof schema.taskRun.$inferSelect;
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
  content: DevelopmentPackage,
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
export function createTeachingApplication({
  executor,
  content,
  ids,
  hash,
}: {
  executor: SqlExecutor;
  content: DevelopmentPackage;
  ids: IdFactory;
  hash: HashFunction;
}): WritingApplication {
  const db = drizzle(async (sql, parameters, method) => {
    if (method === "get")
      throw new Error("Repository must use array-row reads");
    return executor.execute(sql, sqlValues(parameters));
  });
  let tail: Promise<unknown> = Promise.resolve();
  function exclusive<T>(work: () => Promise<T>): Promise<T> {
    const next = tail.then(work);
    tail = next.catch(() => undefined);
    return next;
  }
  const verified = new Map<PackageHash, DevelopmentPackage>();
  async function warmPackages() {
    verified.clear();
    const rows = await db.select().from(schema.installedPackage).all();
    for (const row of rows) {
      if (row.state !== "ready") continue;
      const value = await parseDevelopmentPackage(
        JSON.parse(decodeUtf8(row.verifiedManifest)),
        hash,
      );
      if (
        value.packageHash !== row.packageHash ||
        value.body.courseId !== row.courseId ||
        value.body.releaseId !== row.releaseId ||
        row.storageKey !== row.packageHash ||
        canonical([value.body.coverage]) !== row.capabilities
      )
        throw new Error(
          "Installed package metadata does not match verified bytes",
        );
      verified.set(row.packageHash, value);
    }
  }
  function pinned(packageHash: PackageHash) {
    const value = verified.get(packageHash);
    if (!value) throw new Error("Exact pinned package is unavailable");
    return value;
  }
  async function ensurePackage(value: DevelopmentPackage) {
    const rows = await db
      .select()
      .from(schema.installedPackage)
      .where(eq(schema.installedPackage.packageHash, value.packageHash))
      .all();
    const row = rows[0];
    if (
      !row ||
      row.state !== "ready" ||
      row.courseId !== value.body.courseId ||
      row.releaseId !== value.body.releaseId ||
      row.storageKey !== value.packageHash ||
      !equalBytes(row.verifiedManifest, utf8(canonical(value)))
    )
      throw new Error("Pinned package identity changed");
  }
  let initialization: Promise<TeachingApplication> | undefined;
  function ensureInitialized() {
    initialization ??= (async () => {
      content = await parseDevelopmentPackage(content, hash);
      await initializeDatabase(executor, hash);
      await warmPackages();
      await transaction(executor, async () => {
        const installations = await db.select().from(schema.installation).all();
        if (!installations.length) {
          await db
            .insert(schema.installation)
            .values({
              id: parseId({ kind: "installation", value: ids() }),
              revision: parseCounter("0"),
              databaseVersion: DATABASE_VERSION,
              singleton: 1,
            })
            .run();
          await db
            .insert(schema.profile)
            .values({
              id: parseId({ kind: "profile", value: ids() }),
              generation: parseCounter("0"),
              revision: parseCounter("0"),
              undoRunId: null,
              preferencesVersion: 1,
              preferences: canonical({ version: 1 }),
            })
            .run();
        } else if (
          installations.length !== 1 ||
          Number(installations[0]?.databaseVersion) !== DATABASE_VERSION
        )
          throw new Error("Installation metadata is incompatible");
        const packages = await db
          .select()
          .from(schema.installedPackage)
          .where(eq(schema.installedPackage.packageHash, content.packageHash))
          .all();
        if (!packages.length)
          await db
            .insert(schema.installedPackage)
            .values({
              packageHash: content.packageHash,
              courseId: content.body.courseId,
              releaseId: content.body.releaseId,
              contentSchemaVersion: 1,
              capabilities: canonical([content.body.coverage]),
              manifestVersion: 1,
              verifiedManifest: utf8(canonical(content)),
              state: "ready",
              storageKey: content.packageHash,
            })
            .run();
        else await ensurePackage(content);
        const activations = await db
          .select()
          .from(schema.courseActivation)
          .where(eq(schema.courseActivation.courseId, content.body.courseId))
          .all();
        const active = activations[0];
        if (!active)
          await db
            .insert(schema.courseActivation)
            .values({
              courseId: content.body.courseId,
              activePackageHash: content.packageHash,
              fallbackPackageHash: null,
              revision: parseCounter("0"),
            })
            .run();
        else if (active.activePackageHash !== content.packageHash) {
          const previous = pinned(active.activePackageHash);
          await ensurePackage(previous);
          const cumulative =
            previous.body.coverage === "lesson1-sounds-complete" &&
            (content.body.coverage === "lesson1-sounds-oral-complete" ||
              content.body.coverage === "lesson1-complete") &&
            previous.body.courseId === content.body.courseId &&
            previous.body.lessonId === content.body.lessonId &&
            previous.body.tasks.every(
              (old) =>
                (content.body.coverage === "lesson1-sounds-oral-complete" ||
                  content.body.coverage === "lesson1-complete") &&
                content.body.tasks.some(
                  (entry) =>
                    entry.kind === "printedGraphV1" &&
                    canonical(entry.task) === canonical(old),
                ),
            ) &&
            canonical(previous.body.lessonTasks) ===
              canonical(content.body.lessonTasks);
          const legacyCumulative =
            previous.body.coverage === "partial-first-m" &&
            (content.body.coverage === "lesson1-sounds-oral-complete" ||
              content.body.coverage === "lesson1-complete") &&
            previous.body.lessonId === content.body.lessonId &&
            content.body.tasks.some(
              (entry) =>
                entry.kind === "printedGraphV1" &&
                previous.body.coverage === "partial-first-m" &&
                entry.task.id === previous.body.taskId,
            );
          if (
            cumulative ||
            isCumulativeOralExtension({ previous, candidate: content }) ||
            legacyCumulative ||
            (previous.body.coverage === "partial-first-m" &&
              content.body.coverage === "lesson1-sounds-complete" &&
              previous.body.lessonId === content.body.lessonId &&
              content.body.tasks.some(
                (task) =>
                  task.id ===
                  (previous.body.coverage === "partial-first-m"
                    ? previous.body.taskId
                    : null),
              ))
          )
            await db
              .update(schema.courseActivation)
              .set({
                activePackageHash: content.packageHash,
                fallbackPackageHash: previous.packageHash,
                revision: increment(active.revision),
              })
              .where(
                and(
                  eq(schema.courseActivation.courseId, content.body.courseId),
                  eq(
                    schema.courseActivation.activePackageHash,
                    previous.packageHash,
                  ),
                  eq(schema.courseActivation.revision, active.revision),
                ),
              )
              .run();
        }
      });
      await warmPackages();
      return createCoordinator({ store, ids, hash });
    })();
    return initialization;
  }
  async function loadSession(
    row: typeof schema.session.$inferSelect,
    owner: Owner,
  ): Promise<StoredSession | null> {
    const rows = await db
      .select()
      .from(schema.taskRun)
      .where(eq(schema.taskRun.runId, row.currentRunId))
      .all();
    const run = rows[0];
    if (
      !run ||
      run.sessionId !== row.sessionId ||
      run.profileId !== owner.profileId ||
      run.generation !== owner.generation ||
      run.courseId !== row.courseId ||
      run.packageHash !== row.packageHash ||
      run.lessonId !== row.lessonId ||
      run.taskId !== row.taskId
    )
      throw new Error("Saved run ownership is invalid");
    if (run.status === "abandoned" && row.status === "closed") return null;
    if (
      run.status !== "inProgress" &&
      run.status !== "completed" &&
      run.status !== "skipped"
    )
      throw new Error("Saved run status is unsupported");
    if ((run.status !== "inProgress") !== (row.status === "closed"))
      throw new Error("Saved session terminal status is invalid");
    const value = pinned(run.packageHash);
    if (
      value.body.courseId !== run.courseId ||
      value.body.lessonId !== run.lessonId
    )
      throw new Error("Saved package ownership is invalid");
    const state = parseTeachingState(JSON.parse(run.state));
    validatePosition(value, state, run.taskId);
    let baseline = initialState(value, run.taskId);
    let previous: AdvanceId | null = null;
    let nextSeq = parseCounter("1");
    let acceptedRevision = parseCounter("0");
    let terminal: AdvanceRow | undefined;
    const advances = await db
      .select()
      .from(schema.taskAdvance)
      .where(eq(schema.taskAdvance.runId, run.runId))
      .orderBy(asc(schema.taskAdvance.seq))
      .all();
    for (const advance of advances) {
      if (
        terminal ||
        advance.status !== "accepted" ||
        advance.profileId !== owner.profileId ||
        advance.generation !== owner.generation ||
        advance.previousAdvanceId !== previous ||
        advance.seq !== nextSeq ||
        BigInt(advance.acceptedRunRevision) <= BigInt(acceptedRevision) ||
        BigInt(advance.acceptedRunRevision) > BigInt(run.revision) ||
        advance.beforeRunStatus !== "inProgress"
      )
        throw new Error("Saved acceptance chain is invalid");
      const before = parseTeachingState(JSON.parse(advance.beforeState));
      const after = parseTeachingState(JSON.parse(advance.afterState));
      validateAcceptanceState({
        content: value,
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
            id: row.sessionId,
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
          command.payload.sessionId !== row.sessionId ||
          command.payload.runId !== run.runId
        )
          throw new Error("Accepting command ownership changed");
        const writing = writingTask({ content: value, taskId: run.taskId });
        if (writing) {
          if (command.kind !== "writingNavigate")
            throw new Error("Writing acceptance requires its document barrier");
          const documents = await db
            .select()
            .from(schema.inkDocument)
            .where(eq(schema.inkDocument.runId, run.runId))
            .all();
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
                  content: value,
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
      } else if (before.kind === "graphControls")
        throw new Error("Control acceptance requires explicit command");
      const occurrenceId =
        before.kind === "graphControls"
          ? currentCheckpoint(before).occurrenceId
          : acceptedId(after);
      if (!occurrenceId) throw new Error("Accepted occurrence is missing");
      validateAcceptanceTransition({
        content: value,
        taskId: run.taskId,
        before,
        after,
        occurrenceId,
        ...(action ? { action } : {}),
      });
      const proof =
        after.kind === "writingSkipped"
          ? skipProof(value, after)
          : completionProof(value, after);
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
      nextSeq = increment(nextSeq);
      acceptedRevision = advance.acceptedRunRevision;
    }
    validateAcceptanceState({
      content: value,
      taskId: run.taskId,
      baseline,
      state,
    });
    if (
      previous !== run.activeAdvanceId ||
      nextSeq !== run.nextAdvanceSeq ||
      Boolean(terminal) !== (run.status !== "inProgress") ||
      (state.kind === "writingSkipped"
        ? run.status !== "skipped"
        : Boolean(completionProof(value, state)) !==
          (run.status === "completed"))
    )
      throw new Error("Saved acceptance head is invalid");
    const credits = await db
      .select()
      .from(schema.taskCredit)
      .where(eq(schema.taskCredit.runId, run.runId))
      .all();
    if (terminal) {
      const proof =
        baseline.kind === "writingSkipped"
          ? skipProof(value, baseline)
          : completionProof(value, baseline);
      const credit = credits[0];
      if (
        !proof ||
        credits.length !== 1 ||
        !credit ||
        credit.status !== "valid" ||
        credit.outcome !== run.status ||
        credit.terminalAdvanceId !== terminal.advanceId ||
        Number(credit.receiptVersion) !== 1 ||
        canonical(JSON.parse(credit.receipt)) !==
          canonical(durableReceipt({ run, advance: terminal, proof }))
      )
        throw new Error("Durable task completion receipt is invalid");
    } else if (credits.length)
      throw new Error("Unfinished run has completion credit");
    return {
      sessionId: row.sessionId,
      runId: run.runId,
      revision: row.revision,
      runRevision: run.revision,
      packageHash: run.packageHash,
      lessonId: run.lessonId,
      taskId: run.taskId,
      status: row.status,
      runStatus: run.status,
      state,
      activeAdvanceId: run.activeAdvanceId,
      nextAdvanceSeq: run.nextAdvanceSeq,
    };
  }
  async function context(owner: Owner): Promise<StoredContext | null> {
    const profiles = await db
      .select()
      .from(schema.profile)
      .where(
        and(
          eq(schema.profile.id, owner.profileId),
          eq(schema.profile.generation, owner.generation),
        ),
      )
      .all();
    const profile = profiles[0];
    if (!profile) return null;
    const activations = await db
      .select()
      .from(schema.courseActivation)
      .where(eq(schema.courseActivation.courseId, content.body.courseId))
      .all();
    const active = activations[0];
    if (!active) throw new Error("Course activation is missing");
    pinned(active.activePackageHash);
    const cursors = await db
      .select()
      .from(schema.courseCursor)
      .where(
        and(
          eq(schema.courseCursor.profileId, owner.profileId),
          eq(schema.courseCursor.generation, owner.generation),
          eq(schema.courseCursor.courseId, content.body.courseId),
        ),
      )
      .all();
    const cursor = cursors[0];
    const rows = await db
      .select()
      .from(schema.session)
      .where(
        and(
          eq(schema.session.profileId, owner.profileId),
          eq(schema.session.generation, owner.generation),
          eq(schema.session.courseId, content.body.courseId),
        ),
      )
      .all();
    const sessions: StoredSession[] = [];
    for (const row of rows) {
      const session = await loadSession(row, owner);
      if (session) sessions.push(session);
    }
    const selected = cursor?.resumeSessionId
      ? sessions.find((session) => session.sessionId === cursor.resumeSessionId)
      : null;
    if (
      (cursor?.resumeSessionId && !selected) ||
      (!cursor?.resumeSessionId &&
        sessions.some((session) => session.status !== "closed"))
    )
      throw new Error("Saved teaching is missing its resume cursor");
    if (
      sessions.some(
        (session) =>
          session.status === "active" &&
          session.sessionId !== selected?.sessionId,
      )
    )
      throw new Error("Active session is not selected");
    const results = await db
      .select()
      .from(schema.taskResult)
      .where(
        and(
          eq(schema.taskResult.profileId, owner.profileId),
          eq(schema.taskResult.generation, owner.generation),
          eq(schema.taskResult.courseId, content.body.courseId),
        ),
      )
      .all();
    const credits = await db
      .select()
      .from(schema.taskCredit)
      .where(
        and(
          eq(schema.taskCredit.profileId, owner.profileId),
          eq(schema.taskCredit.generation, owner.generation),
          eq(schema.taskCredit.courseId, content.body.courseId),
          eq(schema.taskCredit.status, "valid"),
        ),
      )
      .all();
    for (const credit of credits)
      if (
        !sessions.some(
          (session) =>
            session.runId === credit.runId &&
            session.runStatus === credit.outcome,
        ) ||
        !results.some((result) => result.taskId === credit.taskId)
      )
        throw new Error("Completion credit has no verified run/result");
    for (const result of results)
      if (
        (result.outcome === "skipped" &&
          credits.some(
            (credit) =>
              credit.taskId === result.taskId && credit.outcome === "completed",
          )) ||
        !credits.some(
          (credit) =>
            credit.creditId === result.acceptedCreditId &&
            credit.taskId === result.taskId &&
            credit.outcome === result.outcome,
        )
      )
        throw new Error("Effective task result has no valid credit");
    return {
      owner,
      profileRevision: profile.revision,
      undoRunId: profile.undoRunId,
      activePackageHash: active.activePackageHash,
      selectionCounter: cursor?.selectionCounter ?? parseCounter("0"),
      session: selected ?? null,
      sessions,
      ownedSessionIds: rows.map((row) => row.sessionId),
      taskResults: results.map(({ taskId, outcome }) => ({ taskId, outcome })),
    };
  }
  async function receipt(command: TeachingCommand) {
    const rows = await db
      .select()
      .from(schema.commandReceipt)
      .where(
        and(
          eq(schema.commandReceipt.scopeKind, command.scope.kind),
          eq(schema.commandReceipt.scopeId, command.scope.id),
          eq(schema.commandReceipt.scopeGeneration, command.scope.generation),
          eq(schema.commandReceipt.commandId, command.commandId),
        ),
      )
      .all();
    const row = rows[0];
    if (!row) return null;
    if (
      row.ownerProfileId !== command.owner.profileId ||
      row.ownerGeneration !== command.owner.generation
    )
      throw new Error("Saved receipt ownership is invalid");
    const result = parseReceipt(JSON.parse(row.result));
    if (
      result.commandId !== row.commandId ||
      result.owner.profileId !== row.ownerProfileId ||
      result.owner.generation !== row.ownerGeneration ||
      result.revision !== row.resultingRevision ||
      (row.scopeKind === "session" && result.sessionId !== row.scopeId)
    )
      throw new Error("Saved receipt result does not match its identity");
    return { payloadHash: row.payloadHash, result };
  }
  async function saveReceipt(command: TeachingCommand, result: CommitReceipt) {
    await db
      .insert(schema.commandReceipt)
      .values({
        scopeKind: command.scope.kind,
        scopeId: command.scope.id,
        scopeGeneration: command.scope.generation,
        commandId: command.commandId,
        ownerProfileId: command.owner.profileId,
        ownerGeneration: command.owner.generation,
        expectedRevision: command.expectedRevision,
        resultingRevision: result.revision,
        payloadHash: command.payloadHash,
        resultVersion: 1,
        result: canonical(result),
      })
      .run();
    await executor.execute(
      "DELETE FROM command_receipt WHERE scope_kind=? AND scope_id=? AND scope_generation=? AND command_id IN (SELECT command_id FROM command_receipt WHERE scope_kind=? AND scope_id=? AND scope_generation=? ORDER BY resulting_revision DESC LIMIT -1 OFFSET 256)",
      [
        command.scope.kind,
        command.scope.id,
        BigInt(command.scope.generation),
        command.scope.kind,
        command.scope.id,
        BigInt(command.scope.generation),
      ],
    );
  }
  async function updateCursor(
    owner: Owner,
    sessionId: StoredSession["sessionId"],
    selectionCounter: StoredContext["selectionCounter"],
  ) {
    const where = and(
      eq(schema.courseCursor.profileId, owner.profileId),
      eq(schema.courseCursor.generation, owner.generation),
      eq(schema.courseCursor.courseId, content.body.courseId),
    );
    const existing = (
      await db.select().from(schema.courseCursor).where(where).all()
    )[0];
    await db
      .insert(schema.courseCursor)
      .values({
        profileId: owner.profileId,
        generation: owner.generation,
        courseId: content.body.courseId,
        resumeSessionId: sessionId,
        selectionCounter,
        revision: existing ? increment(existing.revision) : parseCounter("1"),
      })
      .onConflictDoUpdate({
        target: [
          schema.courseCursor.profileId,
          schema.courseCursor.generation,
          schema.courseCursor.courseId,
        ],
        set: {
          resumeSessionId: sessionId,
          selectionCounter,
          revision: existing ? increment(existing.revision) : parseCounter("1"),
        },
      })
      .run();
  }
  const ink = createInkRepository({
    executor,
    ids,
    hash,
    resolve: async ({ token }) => {
      const owner = {
        profileId: token.profileId,
        generation: token.generation,
      };
      const profile = (
        await db
          .select()
          .from(schema.profile)
          .where(
            and(
              eq(schema.profile.id, owner.profileId),
              eq(schema.profile.generation, owner.generation),
            ),
          )
          .all()
      )[0];
      if (!profile) return null;
      const run = (
        await db
          .select()
          .from(schema.taskRun)
          .where(eq(schema.taskRun.runId, token.runId))
          .all()
      )[0];
      if (
        !run ||
        run.profileId !== token.profileId ||
        run.generation !== token.generation ||
        run.courseId !== token.courseId ||
        run.packageHash !== token.packageHash ||
        run.lessonId !== token.lessonId ||
        run.taskId !== token.taskId
      )
        return null;
      const row = (
        await db
          .select()
          .from(schema.session)
          .where(eq(schema.session.sessionId, run.sessionId))
          .all()
      )[0];
      if (!row) return null;
      if (run.status === "abandoned" && row.status === "closed") {
        const state = parseTeachingState(JSON.parse(run.state));
        validatePosition(pinned(run.packageHash), state, run.taskId);
        return {
          session: {
            sessionId: row.sessionId,
            runId: run.runId,
            revision: row.revision,
            runRevision: run.revision,
            packageHash: run.packageHash,
            lessonId: run.lessonId,
            taskId: run.taskId,
            status: row.status,
            runStatus: run.status,
            state,
            activeAdvanceId: run.activeAdvanceId,
            nextAdvanceSeq: run.nextAdvanceSeq,
          },
          content: pinned(run.packageHash),
        };
      }
      const session = await loadSession(row, owner);
      if (!session) return null;
      if (session.status === "active") {
        const cursor = (
          await db
            .select()
            .from(schema.courseCursor)
            .where(
              and(
                eq(schema.courseCursor.profileId, owner.profileId),
                eq(schema.courseCursor.generation, owner.generation),
                eq(schema.courseCursor.courseId, run.courseId),
              ),
            )
            .all()
        )[0];
        if (cursor?.resumeSessionId !== session.sessionId) return null;
      }
      return { session, content: pinned(token.packageHash) };
    },
  });
  const repositories: TeachingTransaction = {
    writingBarrier: ink.barrier,
    context,
    receipt,
    ensurePackage,
    async select({
      command,
      context: current,
      content: value,
      selection,
      receipt: result,
    }) {
      const owner = command.owner;
      const nextSelection = increment(current.selectionCounter);
      for (const other of current.sessions)
        if (other.status === "active") {
          await ink.fence({
            session: other,
            content: pinned(other.packageHash),
          });
          await db
            .update(schema.session)
            .set({ status: "paused", revision: increment(other.revision) })
            .where(eq(schema.session.sessionId, other.sessionId))
            .run();
        }
      if (selection.kind === "new") {
        if (value.packageHash !== current.activePackageHash)
          throw new Error("New teaching requires the active package");
        if (selection.replaceSessionId) {
          const previous = current.sessions.find(
            (session) => session.sessionId === selection.replaceSessionId,
          );
          if (!previous) throw new Error("Replaced session is missing");
          await db
            .update(schema.session)
            .set({ status: "closed", revision: increment(previous.revision) })
            .where(eq(schema.session.sessionId, previous.sessionId))
            .run();
          if (previous.runStatus === "inProgress")
            await db
              .update(schema.taskRun)
              .set({
                status: "abandoned",
                revision: increment(previous.runRevision),
              })
              .where(eq(schema.taskRun.runId, previous.runId))
              .run();
        }
        await db
          .insert(schema.session)
          .values({
            sessionId: selection.sessionId,
            profileId: owner.profileId,
            generation: owner.generation,
            courseId: value.body.courseId,
            packageHash: value.packageHash,
            lessonId: value.body.lessonId,
            taskId: selection.taskId,
            currentRunId: selection.runId,
            scopeKind: "taskReplay",
            scopeTargetId: selection.taskId,
            status: "active",
            lastSelectedSeq: nextSelection,
            returnSessionId: null,
            revision: parseCounter("0"),
          })
          .run();
        await db
          .insert(schema.taskRun)
          .values({
            runId: selection.runId,
            sessionId: selection.sessionId,
            profileId: owner.profileId,
            generation: owner.generation,
            courseId: value.body.courseId,
            packageHash: value.packageHash,
            lessonId: value.body.lessonId,
            taskId: selection.taskId,
            ordinal: parseCounter("0"),
            status: "inProgress",
            stateVersion: 1,
            state: canonical(selection.state),
            activeAdvanceId: null,
            nextAdvanceSeq: parseCounter("1"),
            revision: parseCounter("0"),
          })
          .run();
        await ink.create({
          session: {
            sessionId: selection.sessionId,
            runId: selection.runId,
            revision: parseCounter("0"),
            runRevision: parseCounter("0"),
            packageHash: value.packageHash,
            lessonId: value.body.lessonId,
            taskId: selection.taskId,
            status: "active",
            runStatus: "inProgress",
            state: selection.state,
            activeAdvanceId: null,
            nextAdvanceSeq: parseCounter("1"),
          },
          content: value,
          owner,
        });
        await db
          .update(schema.profile)
          .set({ revision: result.revision, undoRunId: selection.runId })
          .where(
            and(
              eq(schema.profile.id, owner.profileId),
              eq(schema.profile.generation, owner.generation),
              eq(schema.profile.revision, current.profileRevision),
            ),
          )
          .run();
      } else {
        const saved = selection.session;
        for (const token of await ink.tokens({ session: saved }))
          await ink.snapshot({ token });
        await ink.fence({ session: saved, content: value });
        await db
          .update(schema.session)
          .set({
            status: saved.runStatus !== "inProgress" ? "closed" : "active",
            revision: increment(saved.revision),
            lastSelectedSeq: nextSelection,
          })
          .where(eq(schema.session.sessionId, saved.sessionId))
          .run();
        await db
          .update(schema.profile)
          .set({ revision: result.revision })
          .where(
            and(
              eq(schema.profile.id, owner.profileId),
              eq(schema.profile.generation, owner.generation),
              eq(schema.profile.revision, current.profileRevision),
            ),
          )
          .run();
      }
      await updateCursor(owner, result.sessionId, nextSelection);
      await saveReceipt(command, result);
    },
    async apply(input) {
      const {
        command,
        context: current,
        content: value,
        receipt: result,
        before,
      } = input;
      const { plan, advanceId } = input;
      const saved = current.session;
      const revision = increment(saved.runRevision);
      if (advanceId) {
        await db
          .insert(schema.taskAdvance)
          .values({
            advanceId,
            runId: saved.runId,
            profileId: current.owner.profileId,
            generation: current.owner.generation,
            seq: saved.nextAdvanceSeq,
            previousAdvanceId: saved.activeAdvanceId,
            status: "accepted",
            commandId: command.commandId,
            payloadHash: command.payloadHash,
            acceptingCommand: canonical({
              kind: command.kind,
              payload: command.payload,
            }),
            stateVersion: 1,
            beforeState: canonical(before),
            afterState: canonical(plan.after),
            beforeRunStatus: "inProgress",
            afterRunStatus:
              plan.kind === "skip"
                ? "skipped"
                : plan.kind === "completion"
                  ? "completed"
                  : "inProgress",
            acceptedRunRevision: revision,
          })
          .run();
      }
      await db
        .update(schema.taskRun)
        .set({
          state: canonical(plan.after),
          status:
            plan.kind === "skip"
              ? "skipped"
              : plan.kind === "completion"
                ? "completed"
                : saved.runStatus,
          activeAdvanceId: advanceId ?? saved.activeAdvanceId,
          nextAdvanceSeq: advanceId
            ? increment(saved.nextAdvanceSeq)
            : saved.nextAdvanceSeq,
          revision,
        })
        .where(eq(schema.taskRun.runId, saved.runId))
        .run();
      await db
        .update(schema.session)
        .set({
          revision: result.revision,
          status:
            plan.kind === "completion" ||
            plan.kind === "skip" ||
            saved.runStatus !== "inProgress"
              ? "closed"
              : plan.kind === "pause"
                ? "paused"
                : "active",
        })
        .where(eq(schema.session.sessionId, saved.sessionId))
        .run();
      if (
        advanceId !== null &&
        (plan.kind === "completion" || plan.kind === "skip")
      ) {
        const run = (
          await db
            .select()
            .from(schema.taskRun)
            .where(eq(schema.taskRun.runId, saved.runId))
            .all()
        )[0];
        const advance = (
          await db
            .select()
            .from(schema.taskAdvance)
            .where(eq(schema.taskAdvance.advanceId, advanceId))
            .all()
        )[0];
        if (!run || !advance)
          throw new Error("Terminal acceptance was not written");
        const creditId = parseId({ kind: "credit", value: ids() });
        await db
          .insert(schema.taskCredit)
          .values({
            creditId,
            profileId: current.owner.profileId,
            generation: current.owner.generation,
            courseId: value.body.courseId,
            lessonId: value.body.lessonId,
            taskId: saved.taskId,
            sessionId: saved.sessionId,
            runId: saved.runId,
            terminalAdvanceId: advanceId,
            packageHash: value.packageHash,
            outcome: plan.kind === "skip" ? "skipped" : "completed",
            status: "valid",
            receiptVersion: 1,
            receipt: canonical(
              durableReceipt({
                run,
                advance,
                proof: plan.kind === "skip" ? plan.skip : plan.completion,
              }),
            ),
          })
          .run();
        await db
          .insert(schema.taskResult)
          .values({
            profileId: current.owner.profileId,
            generation: current.owner.generation,
            courseId: value.body.courseId,
            lessonId: value.body.lessonId,
            taskId: saved.taskId,
            outcome: plan.kind === "skip" ? "skipped" : "completed",
            acceptedCreditId: creditId,
          })
          .onConflictDoNothing()
          .run();
        if (plan.kind === "completion")
          await db
            .update(schema.taskResult)
            .set({ outcome: "completed", acceptedCreditId: creditId })
            .where(
              and(
                eq(schema.taskResult.profileId, current.owner.profileId),
                eq(schema.taskResult.generation, current.owner.generation),
                eq(schema.taskResult.courseId, value.body.courseId),
                eq(schema.taskResult.taskId, saved.taskId),
                eq(schema.taskResult.outcome, "skipped"),
              ),
            )
            .run();
      }
      await ink.fence({
        session: { ...saved, state: plan.after },
        content: value,
      });
      await updateCursor(
        current.owner,
        saved.sessionId,
        current.selectionCounter,
      );
      await saveReceipt(command, result);
    },
  };
  const store: TeachingStore = {
    documents: async (input) => {
      const tokens = await ink.tokens(input);
      for (const token of tokens) await ink.snapshot({ token });
      return tokens;
    },
    async current() {
      await warmPackages();
      const profile = (
        await db
          .select()
          .from(schema.profile)
          .orderBy(asc(schema.profile.id))
          .all()
      )[0];
      if (!profile) throw new Error("Installation has no local profile");
      const result = await context({
        profileId: profile.id,
        generation: profile.generation,
      });
      if (!result) throw new Error("Local profile disappeared");
      return result;
    },
    async resolvePackage(packageHash) {
      await warmPackages();
      return pinned(packageHash);
    },
    async transaction(work) {
      await warmPackages();
      return transaction(executor, () => work(repositories));
    },
  };
  async function read(): Promise<CommittedProjection> {
    try {
      return await (await ensureInitialized()).read();
    } catch {
      return {
        kind: "recovery",
        code: "storage-recovery",
        message:
          "Saved storage could not be verified. Recover this installation before continuing.",
      };
    }
  }
  let recovery:
    | { kind: "unopened" }
    | { kind: "ready" }
    | {
        kind: "closed";
        id: string;
        opening: RecoveryOpening;
        teaching:
          | RecoveryTeaching
          | {
              kind: "resolved";
              commandId: import("../../teaching/src/index.ts").CommandId;
              payloadHash: import("../../teaching/src/index.ts").PayloadHash;
            };
      } = {
    kind: "unopened",
  };
  const recoveryProjection = (): CommittedProjection => ({
    kind: "recovery",
    code: "ink-reconciliation-required",
    message: "Writing recovery must finish before teaching opens.",
  });
  async function ready() {
    await ensureInitialized();
    if (recovery.kind === "unopened") {
      if ((await db.select().from(schema.inkDocument).all()).length === 0)
        recovery = { kind: "ready" };
    }
    return recovery.kind === "ready";
  }
  async function normalRead() {
    try {
      if (!(await ready())) return recoveryProjection();
      return read();
    } catch {
      return {
        kind: "recovery",
        code: "storage-recovery",
        message:
          "Saved storage could not be verified. Recover this installation before continuing.",
      } satisfies CommittedProjection;
    }
  }
  return {
    open: () => exclusive(normalRead),
    read: () => exclusive(normalRead),
    dispatch: (command) =>
      exclusive(async () => {
        if (!(await ready()))
          return {
            kind: "rejected",
            code: "ink-reconciliation-required",
            message: "Writing recovery is closed.",
          };
        return (await ensureInitialized()).dispatch(command);
      }),
    readInk: (input) =>
      exclusive(async () => {
        if (!(await ready())) throw new Error("Writing recovery is closed");
        return ink.snapshot(input);
      }),
    dispatchInk: (command) =>
      exclusive(async () => {
        if (!(await ready()))
          return {
            kind: "rejected",
            code: "ink-reconciliation-required",
            message: "Writing recovery is closed.",
          };
        return transaction(executor, () => ink.dispatch(command));
      }),
    openRecovery: (opening) =>
      exclusive(async () => {
        opening = parseRecoveryOpening(opening);
        await ensureInitialized();
        if (
          opening.kind === "warm" &&
          (opening.retainedStrokeIds.length > 64 ||
            new Set(opening.retainedStrokeIds).size !==
              opening.retainedStrokeIds.length)
        )
          throw new Error("Invalid retained capture declaration");
        if (
          recovery.kind === "closed" &&
          recovery.opening.kind === "warm" &&
          opening.kind === "cold"
        )
          throw new Error(
            "Warm retained ink cannot be replaced by cold recovery",
          );
        if (
          recovery.kind === "closed" &&
          recovery.teaching.kind === "pending" &&
          (opening.kind !== "warm" ||
            opening.teaching.kind !== "pending" ||
            opening.teaching.commandId !== recovery.teaching.commandId ||
            opening.teaching.payloadHash !== recovery.teaching.payloadHash)
        )
          throw new Error("Pending teaching declaration changed");
        const id = ids();
        recovery = {
          kind: "closed",
          id,
          opening,
          teaching:
            opening.kind === "warm" ? opening.teaching : { kind: "none" },
        };
        const captures = await ink.inventory();
        return parseRecoveryInventory({
          kind: "closed",
          recoveryId: id,
          captures,
        });
      }),
    recoverInk: (input) =>
      exclusive(async () => {
        if (
          recovery.kind !== "closed" ||
          recovery.id !== input.recoveryId ||
          recovery.opening.kind !== "warm"
        )
          return {
            kind: "rejected",
            code: "recovery-closed",
            message: "Warm recovery is unavailable.",
          };
        const command = parseInkCommand(input.command);
        if (!recovery.opening.retainedStrokeIds.includes(command.edit.strokeId))
          return {
            kind: "rejected",
            code: "undeclared-capture",
            message: "Capture was not retained by this client.",
          };
        return transaction(executor, () => ink.dispatch(command));
      }),
    recoverTeaching: (input) =>
      exclusive(async () => {
        if (
          recovery.kind !== "closed" ||
          recovery.id !== input.recoveryId ||
          recovery.opening.kind !== "warm"
        )
          return {
            kind: "rejected",
            code: "recovery-closed",
            message: "Warm recovery is unavailable.",
          };
        const command = parseCommand(input.command);
        if (
          recovery.teaching.kind === "none" ||
          recovery.teaching.commandId !== command.commandId ||
          recovery.teaching.payloadHash !== command.payloadHash
        )
          return {
            kind: "rejected",
            code: "undeclared-teaching",
            message: "Teaching command was not retained by this client.",
          };
        const retained = recovery.opening.retainedStrokeIds;
        if ((await ink.inventory()).some((c) => retained.includes(c.strokeId)))
          return {
            kind: "rejected",
            code: "unsettled-capture",
            message:
              "Retained ink requires exact finalization before teaching.",
          };
        recovery.teaching = {
          kind: "pending",
          commandId: command.commandId,
          payloadHash: command.payloadHash,
        };
        const result = await (await ensureInitialized()).dispatch(command);
        recovery.teaching = {
          kind: "resolved",
          commandId: command.commandId,
          payloadHash: command.payloadHash,
        };
        return result;
      }),
    reconcileRecovery: (input) =>
      exclusive(async () => {
        input = { ...input, choice: parseRecoveryChoice(input.choice) };
        if (
          recovery.kind !== "closed" ||
          recovery.id !== input.recoveryId ||
          recovery.opening.kind !== input.choice.kind
        )
          throw new Error("Recovery identity changed");
        if (recovery.teaching.kind === "pending")
          throw new Error(
            "Retained teaching command still requires exact resolution",
          );
        if (input.choice.kind === "warm") {
          if (
            recovery.opening.kind !== "warm" ||
            input.choice.settledStrokeIds.length > 64 ||
            canonical([...input.choice.settledStrokeIds].sort()) !==
              canonical([...recovery.opening.retainedStrokeIds].sort())
          )
            throw new Error("Retained captures are not settled");
          const retained = recovery.opening.retainedStrokeIds;
          if (
            (await ink.inventory()).some((c) => retained.includes(c.strokeId))
          )
            throw new Error(
              "Retained capture still requires exact finalization",
            );
        }
        await transaction(executor, async () => {
          await ink.recoverOrphans();
          await ink.fenceAll();
        });
        recovery = { kind: "ready" };
        return read();
      }),
  };
}
