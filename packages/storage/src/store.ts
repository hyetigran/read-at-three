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
  parseTeachingState,
  validatePosition,
  validateAcceptanceState,
  validateAcceptanceTransition,
} from "../../teaching/src/index.ts";
import type {
  AdvanceId,
  CommitReceipt,
  CommittedProjection,
  CompletionProof,
  DevelopmentPackage,
  HashFunction,
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

type AdvanceRow = typeof schema.taskAdvance.$inferSelect;
type RunRow = typeof schema.taskRun.$inferSelect;
function durableReceipt({
  run,
  advance,
  proof,
}: {
  run: RunRow;
  advance: AdvanceRow;
  proof: CompletionProof;
}) {
  return {
    version: 1,
    commandId: advance.commandId,
    terminalAdvanceId: advance.advanceId,
    runId: run.runId,
    runRevision: advance.acceptedRunRevision,
    outcome: "completed",
    packageHash: run.packageHash,
    taskId: run.taskId,
    requiredOccurrenceIds: proof.requiredOccurrenceIds,
    sourceRefs: proof.sourceRefs,
  };
}
function acceptedId(state: TeachingState) {
  return state.kind === "graph"
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
}): TeachingApplication {
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
          if (
            previous.body.coverage === "partial-first-m" &&
            content.body.coverage === "lesson1-sounds-complete" &&
            previous.body.lessonId === content.body.lessonId &&
            content.body.tasks.some(
              (task) =>
                task.id ===
                (previous.body.coverage === "partial-first-m"
                  ? previous.body.taskId
                  : null),
            )
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
    if (run.status !== "inProgress" && run.status !== "completed")
      throw new Error("Saved run status is unsupported");
    if ((run.status === "completed") !== (row.status === "closed"))
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
      const occurrenceId = acceptedId(after);
      if (!occurrenceId) throw new Error("Accepted occurrence is missing");
      validateAcceptanceTransition({
        content: value,
        taskId: run.taskId,
        before,
        after,
        occurrenceId,
      });
      const proof = completionProof(value, after);
      if (advance.afterRunStatus !== (proof ? "completed" : "inProgress"))
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
      Boolean(terminal) !== (run.status === "completed") ||
      Boolean(completionProof(value, state)) !== (run.status === "completed")
    )
      throw new Error("Saved acceptance head is invalid");
    const credits = await db
      .select()
      .from(schema.taskCredit)
      .where(eq(schema.taskCredit.runId, run.runId))
      .all();
    if (terminal) {
      const proof = completionProof(value, baseline);
      const credit = credits[0];
      if (
        !proof ||
        credits.length !== 1 ||
        !credit ||
        credit.status !== "valid" ||
        credit.outcome !== "completed" ||
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
            session.runId === credit.runId && session.runStatus === "completed",
        ) ||
        !results.some((result) => result.taskId === credit.taskId)
      )
        throw new Error("Completion credit has no verified run/result");
    for (const result of results)
      if (
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
      completedTaskIds: results
        .filter((result) => result.outcome === "completed")
        .map((result) => result.taskId),
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
  const repositories: TeachingTransaction = {
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
        if (other.status === "active")
          await db
            .update(schema.session)
            .set({ status: "paused", revision: increment(other.revision) })
            .where(eq(schema.session.sessionId, other.sessionId))
            .run();
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
        await db
          .update(schema.session)
          .set({
            status: saved.runStatus === "completed" ? "closed" : "active",
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
            stateVersion: 1,
            beforeState: canonical(before),
            afterState: canonical(plan.after),
            beforeRunStatus: "inProgress",
            afterRunStatus:
              plan.kind === "completion" ? "completed" : "inProgress",
            acceptedRunRevision: revision,
          })
          .run();
      }
      await db
        .update(schema.taskRun)
        .set({
          state: canonical(plan.after),
          status: plan.kind === "completion" ? "completed" : saved.runStatus,
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
            plan.kind === "completion" || saved.runStatus === "completed"
              ? "closed"
              : plan.kind === "pause"
                ? "paused"
                : "active",
        })
        .where(eq(schema.session.sessionId, saved.sessionId))
        .run();
      if (advanceId !== null && plan.kind === "completion") {
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
            outcome: "completed",
            status: "valid",
            receiptVersion: 1,
            receipt: canonical(
              durableReceipt({ run, advance, proof: plan.completion }),
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
            outcome: "completed",
            acceptedCreditId: creditId,
          })
          .onConflictDoNothing()
          .run();
      }
      await updateCursor(
        current.owner,
        saved.sessionId,
        current.selectionCounter,
      );
      await saveReceipt(command, result);
    },
  };
  const store: TeachingStore = {
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
  return {
    open: () => exclusive(read),
    read: () => exclusive(read),
    dispatch: (command) =>
      exclusive(async () => {
        const coordinator = await ensureInitialized();
        return coordinator.dispatch(command);
      }),
  };
}
