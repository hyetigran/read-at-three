import {
  durableReceipt,
  validateAcceptanceHistory,
} from "./acceptance-history.ts";
import { createLessonProgress } from "./lesson-progress.ts";
import { createProfileDirectory } from "./profile-directory.ts";
import { createInkRepository } from "./ink.ts";
import { and, eq, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  canonical,
  lessonForTask,
  cumulativeExtension,
  resolvedTask,
  parseApplicationRead,
  parseHistoricalWork,
  summarizePractice,
  parsePracticeControlsBinding,
  createCoordinator,
  increment,
  parseCounter,
  parseId,
  parseRuntimePackage,
  parseReceipt,
  parseCommand,
  parseTeachingState,
  validatePosition,
  writingTask,
  parseInkCommand,
  parseRecoveryOpening,
  parseRecoveryChoice,
  parseRecoveryInventory,
  parseProfileAdministrationCommand,
  profileAdministrationPreimage,
  dispatchTeachingInTransaction,
  parseSelectedOperation,
  recoveryResult,
  parseSelectedRecoveryOpening,
  parseSelectedRecoveryInventory,
  parseSelectedOwnerWitness,
  parseCurrentApplicationRead,
  RetiredSelectionError,
} from "../../teaching/src/index.ts";
import type {
  CommitReceipt,
  CommittedProjection,
  RuntimePackage,
  HashFunction,
  IdFactory,
  Owner,
  PackageHash,
  StoredContext,
  StoredSession,
  TeachingApplication,
  TeachingCommand,
  TeachingStore,
  TeachingTransaction,
  WritingApplication,
  RecoveryOpening,
  RecoveryChoice,
  RecoveryInventory,
  RecoveryTeaching,
  InkResult,
  InkReceipt,
  StrokeId,
  CourseApplication,
  CourseReadTarget,
  ApplicationRead,
  HistoricalWork,
  SavedWork,
  ProfileAdministrationApplication,
  PreparationPolicy,
  DepartureWitness,
  SelectedOwnerWitness,
  CommandRejection,
  SelectedApplication,
  SelectedRecoveryOpening,
  ProfileDirectory,
  ProfileAdministrationCommand,
  ProfileAdministrationReceipt,
  CommandResult,
  RecoveryResult,
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
  previous: RuntimePackage;
  candidate: RuntimePackage;
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

type RunRow = typeof schema.taskRunV6.$inferSelect;
export function createTeachingApplication({
  executor,
  content,
  ids,
  hash,
  preparation = { kind: "unavailable" },
}: {
  executor: SqlExecutor;
  content: RuntimePackage;
  ids: IdFactory;
  hash: HashFunction;
  preparation?: PreparationPolicy;
}): SelectedApplication {
  const db = drizzle(async (sql, parameters, method) => {
    if (method === "get")
      throw new Error("Repository must use array-row reads");
    return executor.execute(sql, sqlValues(parameters));
  });
  const profileDirectory = createProfileDirectory({ db, preparation });
  let tail: Promise<unknown> = Promise.resolve();
  function exclusive<T>(work: () => Promise<T>): Promise<T> {
    const next = tail.then(work);
    tail = next.catch(() => undefined);
    return next;
  }
  const verified = new Map<PackageHash, RuntimePackage>();
  async function warmPackages() {
    verified.clear();
    const rows = await db.select().from(schema.installedPackage).all();
    for (const row of rows) {
      if (row.state !== "ready") continue;
      const value = await parseRuntimePackage(
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
  async function ensurePackage(value: RuntimePackage) {
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
  const lessonProgress = createLessonProgress({ executor, hash, ids, pinned });
  let legacyCursorRead = false;
  let acceptanceMode: "v6" | "v7" = "v7";
  async function repairTerminalCursors(
    owner?: Owner,
    excludeCourse?: import("../../teaching/src/index.ts").CourseId,
  ) {
    const cursors = await db.select().from(schema.courseCursor).all();
    for (const cursor of cursors) {
      if (
        !cursor.resumeSessionId ||
        (owner &&
          (cursor.profileId !== owner.profileId ||
            cursor.generation !== owner.generation)) ||
        cursor.courseId === excludeCourse
      )
        continue;
      const selected = (
        await db
          .select()
          .from(schema.session)
          .where(eq(schema.session.sessionId, cursor.resumeSessionId))
          .all()
      )[0];
      const profile = (
        await db
          .select()
          .from(schema.profile)
          .where(
            and(
              eq(schema.profile.id, cursor.profileId),
              eq(schema.profile.generation, cursor.generation),
            ),
          )
          .all()
      )[0];
      if (!selected || !profile) throw new Error("Cursor owner missing");
      if (
        selected.status === "closed" &&
        selected.currentRunId !== profile.undoRunId
      )
        await db
          .update(schema.courseCursor)
          .set({ resumeSessionId: null, revision: increment(cursor.revision) })
          .where(
            and(
              eq(schema.courseCursor.profileId, cursor.profileId),
              eq(schema.courseCursor.generation, cursor.generation),
              eq(schema.courseCursor.courseId, cursor.courseId),
            ),
          )
          .run();
    }
  }
  async function validateOwners() {
    const profiles = await db.select().from(schema.profile).all(),
      activations = await db.select().from(schema.courseActivation).all();
    for (const profile of profiles)
      for (const activation of activations)
        await context(
          { profileId: profile.id, generation: profile.generation },
          activation.courseId,
        );
  }
  let initialization: Promise<ReturnType<typeof createCoordinator>> | undefined;
  let schemaInitialized = false;
  function ensureInitialized() {
    initialization ??= (async () => {
      content = await parseRuntimePackage(content, hash);
      await initializeDatabase(executor, hash, async (version) => {
        if (version !== 6 && version !== 7 && version !== 8) return undefined;
        await warmPackages();
        const prepared = [...verified.values()].sort((a, b) =>
          a.packageHash.localeCompare(b.packageHash),
        );
        return async () => {
          const readyPackages = await db
            .select()
            .from(schema.installedPackage)
            .where(eq(schema.installedPackage.state, "ready"))
            .all();
          if (
            readyPackages.length !== prepared.length ||
            readyPackages.some(
              (row) =>
                !prepared.some(
                  (value) => value.packageHash === row.packageHash,
                ),
            )
          )
            throw new Error("Prepared package set changed before migration");
          for (const value of prepared) await ensurePackage(value);
          if (version === 8) {
            await validateOwners();
            await ink.inventory();
            await profileDirectory.migrate();
            return;
          }
          if (version === 7) {
            acceptanceMode = "v6";
            try {
              await validateOwners();
              await ink.inventory();
            } finally {
              acceptanceMode = "v7";
            }
            await validateOwners();
            await ink.inventory();
            return;
          }
          acceptanceMode = "v6";
          legacyCursorRead = true;
          try {
            await validateOwners();
            await ink.inventory();
          } finally {
            legacyCursorRead = false;
          }
          await repairTerminalCursors();
          const profiles = await db.select().from(schema.profile).all();
          for (const profile of profiles)
            for (const value of prepared)
              await lessonProgress.derive({
                owner: {
                  profileId: profile.id,
                  generation: profile.generation,
                },
                content: value,
              });
          try {
            await validateOwners();
          } finally {
            acceptanceMode = "v7";
          }
        };
      });
      await warmPackages();
      await transaction(executor, async () => {
        const installations = await db.select().from(schema.installation).all();
        if (!installations.length) {
          const installationId = parseId({
            kind: "installation",
            value: ids(),
          });
          const owner = {
            profileId: parseId({ kind: "profile", value: ids() }),
            generation: parseCounter("0"),
          };
          await db
            .insert(schema.installation)
            .values({
              id: installationId,
              revision: parseCounter("0"),
              databaseVersion: DATABASE_VERSION,
              singleton: 1,
            })
            .run();
          await db
            .insert(schema.profile)
            .values({
              id: owner.profileId,
              generation: owner.generation,
              revision: parseCounter("0"),
              undoRunId: null,
              preferencesVersion: 1,
              preferences: canonical({ version: 1 }),
            })
            .run();
          await profileDirectory.bootstrap({ owner, installationId });
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
            cumulativeExtension({ previous, candidate: content }) ||
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
      await profileDirectory.read();
      schemaInitialized = true;
      await validateOwners();
      await ink.inventory();
      return createCoordinator({ store, ids, hash });
    })();
    return initialization;
  }
  async function loadSession(
    row: typeof schema.session.$inferSelect,
    owner: Owner,
    retainedRun?: RunRow,
  ): Promise<StoredSession | null> {
    const rows = await db
      .select()
      .from(schema.taskRunV6)
      .where(eq(schema.taskRun.runId, row.currentRunId))
      .all();
    const run = retainedRun ?? rows[0];
    if (
      !run ||
      run.sessionId !== row.sessionId ||
      run.profileId !== owner.profileId ||
      run.generation !== owner.generation ||
      run.courseId !== row.courseId ||
      run.packageHash !== row.packageHash ||
      run.lessonId !== row.lessonId ||
      (!retainedRun && run.taskId !== row.taskId)
    )
      throw new Error("Saved run ownership is invalid");
    if (
      run.status !== "inProgress" &&
      run.status !== "completed" &&
      run.status !== "skipped" &&
      run.status !== "abandoned"
    )
      throw new Error("Saved run status is unsupported");
    if (
      !retainedRun &&
      (run.status !== "inProgress") !== (row.status === "closed")
    )
      throw new Error("Saved session terminal status is invalid");
    const value = pinned(run.packageHash);
    if (
      value.body.courseId !== run.courseId ||
      lessonForTask({ content: value, taskId: run.taskId }) !== run.lessonId
    )
      throw new Error("Saved package ownership is invalid");
    const state = parseTeachingState(JSON.parse(run.state));
    validatePosition(value, state, run.taskId);
    const advances = await db
      .select()
      .from(schema.taskAdvance)
      .where(eq(schema.taskAdvance.runId, run.runId))
      .orderBy(asc(schema.taskAdvance.seq))
      .all();
    const credits = await db
      .select()
      .from(schema.taskCredit)
      .where(eq(schema.taskCredit.runId, run.runId))
      .all();
    const documents = await db
      .select()
      .from(schema.inkDocument)
      .where(eq(schema.inkDocument.runId, run.runId))
      .all();
    let legacyLimit = parseCounter(
      (BigInt(run.nextAdvanceSeq) - 1n).toString(),
    );
    if (acceptanceMode === "v7") {
      const limit = (
        await db
          .select({ limit: schema.taskRun.legacyAcceptanceSeqLimit })
          .from(schema.taskRun)
          .where(eq(schema.taskRun.runId, run.runId))
          .all()
      )[0];
      if (!limit) throw new Error("Saved run acceptance limit is missing");
      legacyLimit = limit.limit;
    }
    await validateAcceptanceHistory({
      run,
      session: row,
      owner,
      content: value,
      hash,
      advances,
      credits,
      documents,
      legacyLimit,
      linear: acceptanceMode === "v6",
      withdrawals:
        acceptanceMode === "v7"
          ? await db
              .select()
              .from(schema.advanceWithdrawal)
              .where(eq(schema.advanceWithdrawal.runId, run.runId))
              .all()
          : [],
    });
    if (run.status === "abandoned") return null;
    return {
      sessionId: row.sessionId,
      runId: run.runId,
      revision: row.revision,
      runRevision: run.revision,
      packageHash: run.packageHash,
      lessonId: run.lessonId,
      taskId: run.taskId,
      status: retainedRun ? "closed" : row.status,
      runStatus: run.status,
      state,
      activeAdvanceId: run.activeAdvanceId,
      nextAdvanceSeq: run.nextAdvanceSeq,
      lastSelectedSequence: row.lastSelectedSeq,
    };
  }
  async function context(
    owner: Owner,
    courseId = content.body.courseId,
  ): Promise<StoredContext | null> {
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
      .where(eq(schema.courseActivation.courseId, courseId))
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
          eq(schema.courseCursor.courseId, courseId),
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
          eq(schema.session.courseId, courseId),
        ),
      )
      .all();
    const sessions: StoredSession[] = [];
    for (const row of rows) {
      const session = await loadSession(row, owner);
      if (session) sessions.push(session);
    }
    const retainedRuns = await db
      .select()
      .from(schema.taskRunV6)
      .where(
        and(
          eq(schema.taskRun.profileId, owner.profileId),
          eq(schema.taskRun.generation, owner.generation),
          eq(schema.taskRun.courseId, courseId),
        ),
      )
      .all();
    const validatedRuns: StoredSession[] = [...sessions];
    for (const run of retainedRuns) {
      const row = rows.find((row) => row.sessionId === run.sessionId);
      if (!row) throw new Error("Retained run has no owned session");
      if (row.currentRunId === run.runId) continue;
      if (run.status === "inProgress")
        throw new Error("Unselected historical run cannot remain active");
      const historical = await loadSession(row, owner, run);
      if (historical) validatedRuns.push(historical);
    }
    const selected = cursor?.resumeSessionId
      ? sessions.find((session) => session.sessionId === cursor.resumeSessionId)
      : null;
    if (
      (cursor?.resumeSessionId && !selected) ||
      (!cursor?.resumeSessionId &&
        sessions.some((session) => session.status === "active"))
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
    if (
      !legacyCursorRead &&
      selected?.status === "closed" &&
      selected.runId !== profile.undoRunId
    )
      throw new Error("Closed terminal cursor does not own Undo");
    const results = await db
      .select()
      .from(schema.taskResult)
      .where(
        and(
          eq(schema.taskResult.profileId, owner.profileId),
          eq(schema.taskResult.generation, owner.generation),
          eq(schema.taskResult.courseId, courseId),
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
          eq(schema.taskCredit.courseId, courseId),
          eq(schema.taskCredit.status, "valid"),
        ),
      )
      .all();
    for (const credit of credits)
      if (
        !validatedRuns.some(
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
    const lessonResults = await lessonProgress.validate({ owner, courseId });
    const history: SavedWork[] = [];
    for (const run of retainedRuns) {
      const row = rows.find((row) => row.sessionId === run.sessionId);
      if (!row) throw new Error("Historical run owner missing");
      history.push({
        sessionId: row.sessionId,
        runId: run.runId,
        packageHash: run.packageHash,
        lessonId: run.lessonId,
        taskId: run.taskId,
        lastSelectedSequence: row.lastSelectedSeq,
        status: run.status,
      });
    }
    return {
      owner,
      activationRevision: active.revision,
      cursorRevision: cursor?.revision ?? parseCounter("0"),
      lessonResults,
      history,
      profileRevision: profile.revision,
      undoRunId: profile.undoRunId,
      activePackageHash: active.activePackageHash,
      selectionCounter: cursor?.selectionCounter ?? parseCounter("0"),
      session: selected ?? null,
      cursorSession: selected ?? null,
      sessions,
      ownedSessionIds: rows.map((row) => row.sessionId),
      taskResults: results.map(({ taskId, outcome }) => ({ taskId, outcome })),
    };
  }
  async function settleOwnedSessions(sessions: readonly StoredSession[]) {
    for (const other of sessions)
      if (other.status === "active") {
        await ink.fence({ session: other, content: pinned(other.packageHash) });
        await db
          .update(schema.session)
          .set({ status: "paused", revision: increment(other.revision) })
          .where(eq(schema.session.sessionId, other.sessionId))
          .run();
      }
  }
  async function readDeparture(
    selection: SelectedOwnerWitness,
  ): Promise<DepartureWitness> {
    const directory = await profileDirectory.read();
    if (canonical(selection) !== canonical(directory.selection))
      throw new Error("Selected child lifetime changed before departure read");
    await warmPackages();
    const activations = await db
      .select({ courseId: schema.courseActivation.courseId })
      .from(schema.courseActivation)
      .all();
    const retained = await db
      .select({ courseId: schema.session.courseId })
      .from(schema.session)
      .where(
        and(
          eq(schema.session.profileId, selection.owner.profileId),
          eq(schema.session.generation, selection.owner.generation),
        ),
      )
      .all();
    const courseIds = [
      ...new Set(
        [...activations, ...retained].map((course) => course.courseId),
      ),
    ].sort();
    const courses: DepartureWitness["courses"][number][] = [];
    for (const courseId of courseIds) {
      const current = await context(selection.owner, courseId);
      if (!current) throw new Error("Outgoing child generation is unavailable");
      const documents = [];
      for (const session of current.sessions) {
        for (const token of await ink.tokens({ session })) {
          await ink.snapshot({ token });
          documents.push(token);
        }
      }
      documents.sort((a, b) =>
        a.documentId < b.documentId ? -1 : a.documentId > b.documentId ? 1 : 0,
      );
      courses.push({
        courseId,
        witness: {
          owner: current.owner,
          profileRevision: current.profileRevision,
          activePackageHash: current.activePackageHash,
          activationRevision: current.activationRevision ?? parseCounter("0"),
          cursorRevision: current.cursorRevision ?? parseCounter("0"),
          selectedSessionRevision: current.session?.revision ?? null,
        },
        documents,
      });
    }
    return { courses };
  }
  async function departProfile(input: {
    selection: SelectedOwnerWitness;
    departure: DepartureWitness;
  }): Promise<CommandRejection | null> {
    const current = await readDeparture(input.selection);
    if (canonical(input.departure) !== canonical(current))
      return {
        kind: "rejected",
        code: "stale-departure",
        message: "Outgoing teaching or writing changed before selection.",
      };
    if (
      (await ink.inventory()).some(
        (capture) =>
          capture.token.profileId === input.selection.owner.profileId &&
          capture.token.generation === input.selection.owner.generation,
      )
    )
      return {
        kind: "rejected",
        code: "unsettled-capture",
        message:
          "Finish saving the outgoing child's retained writing before selection.",
      };
    for (const course of current.courses) {
      const scope = await context(input.selection.owner, course.courseId);
      if (!scope) throw new Error("Outgoing owner changed during selection");
      await settleOwnedSessions(scope.sessions);
    }
    return null;
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
    sessionId: StoredSession["sessionId"] | null,
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
          .from(schema.taskRunV6)
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
      if (run.status === "abandoned" || run.runId !== row.currentRunId) {
        await loadSession(row, owner, run);
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
            status: "closed",
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
    context: (owner) => context(owner),
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
      await settleOwnedSessions(current.sessions);
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
            lessonId: lessonForTask({
              content: value,
              taskId: selection.taskId,
            }),
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
            lessonId: lessonForTask({
              content: value,
              taskId: selection.taskId,
            }),
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
            lessonId: lessonForTask({
              content: value,
              taskId: selection.taskId,
            }),
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
      if (selection.kind === "new")
        await repairTerminalCursors(owner, content.body.courseId);
      await updateCursor(owner, result.sessionId, nextSelection);
      await saveReceipt(command, result);
    },
    async undoAdvance({
      command,
      context: current,
      content: value,
      receipt: result,
    }) {
      const saved = current.session;
      const head = (
        await db
          .select()
          .from(schema.taskAdvance)
          .where(eq(schema.taskAdvance.advanceId, command.payload.advanceId))
          .all()
      )[0];
      if (
        !head ||
        head.runId !== saved.runId ||
        head.profileId !== current.owner.profileId ||
        head.generation !== current.owner.generation ||
        head.status !== "accepted" ||
        saved.activeAdvanceId !== head.advanceId ||
        current.undoRunId !== saved.runId
      )
        throw new Error("Undo acceptance head changed");
      if (
        current.sessions.some(
          (session) =>
            session.sessionId !== saved.sessionId &&
            session.runStatus === "inProgress" &&
            session.taskId === saved.taskId,
        )
      )
        throw new Error("Undo would conflict with another live task scope");
      const state = parseTeachingState(JSON.parse(head.beforeState));
      const runRevision = increment(saved.runRevision);
      await db
        .insert(schema.advanceWithdrawal)
        .values({
          advanceId: head.advanceId,
          runId: saved.runId,
          profileId: current.owner.profileId,
          generation: current.owner.generation,
          withdrawnRunRevision: runRevision,
          command: canonical(command),
        })
        .run();
      await db
        .update(schema.taskAdvance)
        .set({ status: "withdrawn" })
        .where(eq(schema.taskAdvance.advanceId, head.advanceId))
        .run();
      await db
        .update(schema.taskRun)
        .set({
          state: canonical(state),
          status: "inProgress",
          activeAdvanceId: head.previousAdvanceId,
          revision: runRevision,
        })
        .where(eq(schema.taskRun.runId, saved.runId))
        .run();
      await db
        .update(schema.session)
        .set({
          status: saved.status === "paused" ? "paused" : "active",
          revision: result.revision,
        })
        .where(eq(schema.session.sessionId, saved.sessionId))
        .run();
      const affectedPackages = new Set<PackageHash>([
        value.packageHash,
        current.activePackageHash,
      ]);
      const terminalCredit = (
        await db
          .select()
          .from(schema.taskCredit)
          .where(eq(schema.taskCredit.terminalAdvanceId, head.advanceId))
          .all()
      )[0];
      if (terminalCredit) {
        await db
          .update(schema.taskCredit)
          .set({ status: "withdrawn" })
          .where(eq(schema.taskCredit.creditId, terminalCredit.creditId))
          .run();
        const dependent = await lessonProgress.withdrawDependentSupport({
          owner: current.owner,
          courseId: value.body.courseId,
          taskCreditId: terminalCredit.creditId,
        });
        const lessons = await db
          .select()
          .from(schema.lessonCredit)
          .where(
            and(
              eq(schema.lessonCredit.profileId, current.owner.profileId),
              eq(schema.lessonCredit.generation, current.owner.generation),
              eq(schema.lessonCredit.courseId, value.body.courseId),
            ),
          )
          .all();
        for (const lesson of lessons)
          if (dependent.includes(lesson.lessonCreditId))
            affectedPackages.add(lesson.packageHash);
        for (const packageHash of affectedPackages)
          await lessonProgress.derive({
            owner: current.owner,
            content: pinned(packageHash),
          });
      }
      await ink.fence({
        session: {
          ...saved,
          state,
          runStatus: "inProgress",
          status: saved.status === "paused" ? "paused" : "active",
        },
        content: value,
      });
      await updateCursor(
        current.owner,
        saved.sessionId,
        current.selectionCounter,
      );
      await saveReceipt(command, result);
      await context(current.owner);
    },
    async applyWritingControl({ command, context: current, receipt: result }) {
      const token = command.payload.barrier.documents.find(
        (document) => document.documentId === command.payload.documentId,
      );
      if (!token) throw new Error("Practice document missing");
      if (
        !(await ink.applyPracticeControl({
          token,
          layer: command.payload.layer,
          control: command.payload.control,
        }))
      )
        return false;
      await db
        .update(schema.session)
        .set({ revision: result.revision })
        .where(eq(schema.session.sessionId, current.session.sessionId))
        .run();
      await saveReceipt(command, result);
      return true;
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
            .from(schema.taskRunV6)
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
            lessonId: saved.lessonId,
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
            lessonId: saved.lessonId,
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
      if (plan.kind === "completion" || plan.kind === "skip") {
        await lessonProgress.derive({ owner: current.owner, content: value });
        if (current.activePackageHash !== value.packageHash)
          await lessonProgress.derive({
            owner: current.owner,
            content: pinned(current.activePackageHash),
          });
      }
      await ink.fence({
        session: { ...saved, state: plan.after },
        content: value,
      });
      await updateCursor(
        current.owner,
        (plan.kind === "completion" ||
          plan.kind === "skip" ||
          saved.runStatus !== "inProgress") &&
          current.undoRunId !== saved.runId
          ? null
          : saved.sessionId,
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
    async current(target) {
      await warmPackages();
      const profile = (
        await db
          .select()
          .from(schema.profile)
          .where(
            eq(
              schema.profile.id,
              (await profileDirectory.selected()).profileId,
            ),
          )
          .orderBy(asc(schema.profile.id))
          .all()
      )[0];
      if (!profile) throw new Error("Installation has no local profile");
      const result = await context({
        profileId: profile.id,
        generation: profile.generation,
      });
      if (!result) throw new Error("Local profile disappeared");
      if (target?.kind === "accepted") {
        const acknowledged = parseReceipt(target.receipt);
        if (
          acknowledged.owner.profileId !== result.owner.profileId ||
          acknowledged.owner.generation !== result.owner.generation
        )
          throw new Error("Acknowledgment owner changed");
        const rows = await db
          .select()
          .from(schema.commandReceipt)
          .where(
            and(
              eq(schema.commandReceipt.commandId, acknowledged.commandId),
              eq(schema.commandReceipt.ownerProfileId, result.owner.profileId),
              eq(
                schema.commandReceipt.ownerGeneration,
                result.owner.generation,
              ),
            ),
          )
          .all();
        const retained = rows[0];
        if (
          rows.length !== 1 ||
          !retained ||
          retained.result !== canonical(acknowledged) ||
          retained.scopeGeneration !== result.owner.generation ||
          retained.resultingRevision !== acknowledged.revision ||
          Number(retained.resultVersion) !== 1
        )
          throw new Error("Acknowledged receipt is not retained");
        if (
          (retained.scopeKind !== "profile" &&
            retained.scopeKind !== "session") ||
          (retained.scopeKind === "profile" &&
            (retained.scopeId !== result.owner.profileId ||
              result.profileRevision !== acknowledged.revision)) ||
          (retained.scopeKind === "session" &&
            retained.scopeId !== acknowledged.sessionId)
        )
          throw new Error("Acknowledged receipt scope changed");
        const selected = result.sessions.find(
          (session) =>
            session.sessionId === acknowledged.sessionId &&
            session.runId === acknowledged.runId &&
            session.packageHash === acknowledged.packageHash &&
            (retained.scopeKind === "profile" ||
              session.revision === acknowledged.revision),
        );
        if (!selected) throw new Error("Acknowledged delivery changed");
        return { ...result, session: selected };
      }
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
  type ClosedRecovery = {
    kind: "closed";
    id: string;
    opening: SelectedRecoveryOpening;
    phase: "ink" | "teaching" | "administration" | "finalize";
    settled: Set<StrokeId>;
  };
  let recovery: { kind: "unopened" } | { kind: "ready" } | ClosedRecovery = {
    kind: "unopened",
  };
  function afterInk(opening: SelectedRecoveryOpening): ClosedRecovery["phase"] {
    return opening.kind === "warm" && opening.teaching
      ? "teaching"
      : afterTeaching(opening);
  }
  function afterTeaching(
    opening: SelectedRecoveryOpening,
  ): ClosedRecovery["phase"] {
    return opening.kind === "warm" && opening.administration
      ? "administration"
      : "finalize";
  }
  const rejectOperation = (
    code: string,
    message: string,
  ): CommandRejection => ({ kind: "rejected", code, message });
  async function resolveTeachingReceipt(command: TeachingCommand) {
    if (
      (await hash(
        canonical({ kind: command.kind, payload: command.payload }),
      )) !== command.payloadHash
    )
      return rejectOperation(
        "payload-hash",
        "Command payload hash does not match.",
      );
    const value = pinned(command.payload.packageHash);
    const current = await context(command.owner, value.body.courseId);
    if (!current || command.scope.generation !== command.owner.generation)
      return rejectOperation(
        "stale-owner",
        "Retained command owner is unavailable.",
      );
    if (
      (command.scope.kind === "profile" &&
        command.scope.id !== command.owner.profileId) ||
      (command.scope.kind === "session" &&
        !current.ownedSessionIds.includes(command.scope.id))
    )
      return rejectOperation(
        "wrong-scope",
        "Retained command scope is unavailable.",
      );
    const saved = (
      await db
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
        .all()
    )[0];
    if (!saved) return null;
    if (saved.payloadHash !== command.payloadHash)
      return rejectOperation(
        "command-identity",
        "Retained command identity changed.",
      );
    const retained = await receipt(command);
    if (
      !retained ||
      Number(saved.resultVersion) !== 1 ||
      saved.expectedRevision !== command.expectedRevision ||
      saved.resultingRevision !== increment(command.expectedRevision) ||
      retained.result.packageHash !== command.payload.packageHash ||
      saved.result !== canonical(retained.result)
    )
      throw new Error(
        "Retained teaching receipt does not prove this exact command",
      );
    const run = (
      await db
        .select()
        .from(schema.taskRunV6)
        .where(eq(schema.taskRun.runId, retained.result.runId))
        .all()
    )[0];
    if (
      !run ||
      run.sessionId !== retained.result.sessionId ||
      run.profileId !== command.owner.profileId ||
      run.generation !== command.owner.generation ||
      run.packageHash !== command.payload.packageHash
    )
      throw new Error("Retained teaching receipt run is unavailable");
    if (command.kind === "start") {
      if (
        value.body.coverage !== "partial-first-m" ||
        run.taskId !== value.body.taskId
      )
        throw new Error("Retained teaching receipt task changed");
    } else if (command.kind === "select" || command.kind === "writingSelect") {
      if (
        run.taskId !== command.payload.taskId ||
        (command.payload.intent === "resume" &&
          retained.result.sessionId !== command.payload.sessionId)
      )
        throw new Error("Retained teaching receipt selection changed");
    } else if (
      retained.result.sessionId !== command.payload.sessionId ||
      retained.result.runId !== command.payload.runId
    ) {
      throw new Error("Retained teaching receipt delivery changed");
    }
    return retained.result;
  }
  const recoveryProjection = (): Extract<
    CommittedProjection,
    { kind: "recovery" }
  > => ({
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
  async function discoverDirectory(): Promise<ProfileDirectory> {
    try {
      await ensureInitialized();
    } catch (error) {
      if (!schemaInitialized) throw error;
    }
    return profileDirectory.read();
  }
  async function requireSelection(
    input: SelectedOwnerWitness,
  ): Promise<ProfileDirectory> {
    const selection = parseSelectedOwnerWitness(input);
    const directory = await discoverDirectory();
    if (canonical(selection) !== canonical(directory.selection))
      throw new RetiredSelectionError();
    return directory;
  }
  return {
    execute: (input) =>
      exclusive(async () => {
        const operation = parseSelectedOperation(input);
        const available = await ready();
        await warmPackages();
        return transaction(executor, async () => {
          const directory = await profileDirectory.read();
          const selection = directory.selection;
          let rejection: CommandRejection | null = null;
          if (!available)
            rejection = {
              kind: "rejected",
              code: "recovery-closed",
              message: "Writing recovery must finish before teaching.",
            };
          else if (canonical(selection) !== canonical(operation.selection))
            rejection = {
              kind: "rejected",
              code: "stale-selection",
              message: "The selected child lifetime changed.",
            };
          else {
            const owner =
              operation.kind === "teaching"
                ? operation.command.owner
                : operation.command.token;
            if (
              owner.profileId !== selection.owner.profileId ||
              owner.generation !== selection.owner.generation
            )
              rejection = {
                kind: "rejected",
                code: "stale-owner",
                message: "The operation belongs to another child.",
              };
            else if (directory.initialSetup.kind === "firstLaunch")
              rejection = {
                kind: "rejected",
                code: "initial-setup-required",
                message:
                  "Confirm parent preparation and the initial child before teaching.",
              };
          }
          if (operation.kind === "teaching")
            return {
              kind: operation.kind,
              selection,
              result:
                rejection ??
                (await dispatchTeachingInTransaction({
                  input: operation.command,
                  tx: repositories,
                  store,
                  ids,
                  hash,
                })),
            };
          return {
            kind: operation.kind,
            selection,
            result: rejection ?? (await ink.dispatch(operation.command)),
          };
        });
      }),
    readDirectory: () => exclusive(discoverDirectory),
    readDeparture: (input) =>
      exclusive(async () => {
        if (!(await ready()))
          throw new Error("Writing recovery must finish before departure");
        return readDeparture(input.selection);
      }),
    administer: (input) =>
      exclusive(async () => {
        const command = parseProfileAdministrationCommand(input);
        if (!(await ready()))
          return {
            kind: "rejected",
            code: "recovery-closed",
            message: "Writing recovery must finish before profile changes.",
          };
        if (
          (await hash(profileAdministrationPreimage(command))) !==
          command.payloadHash
        )
          return {
            kind: "rejected",
            code: "payload-hash",
            message: "The profile command payload changed.",
          };
        return transaction(executor, () =>
          profileDirectory.administer({ command, depart: departProfile }),
        );
      }),
    readApplication: (input) =>
      exclusive(async () => {
        const directory = await requireSelection(input.selection);
        try {
          const application = !(await ready())
            ? recoveryProjection()
            : parseApplicationRead(
                await (await ensureInitialized()).readApplication(input.target),
              );
          return parseCurrentApplicationRead({ directory, application });
        } catch {
          return parseCurrentApplicationRead({
            directory,
            application: await read(),
          });
        }
      }),
    readWork: (input) =>
      exclusive(async () => {
        if (!(await ready())) throw new Error("Writing recovery is closed");
        const directory = await requireSelection(input.selection);
        const owner = directory.selection.owner;
        const runId = parseId({ kind: "run", value: input.runId });
        await warmPackages();
        const current = await context(owner);
        const summary = current?.history?.find((work) => work.runId === runId);
        if (!current || !summary)
          throw new Error("Owned historical work is unavailable");
        const row = (
          await db
            .select()
            .from(schema.session)
            .where(eq(schema.session.sessionId, summary.sessionId))
            .all()
        )[0];
        const run = (
          await db
            .select()
            .from(schema.taskRunV6)
            .where(eq(schema.taskRun.runId, runId))
            .all()
        )[0];
        if (!row || !run) throw new Error("Historical owner missing");
        const value = pinned(summary.packageHash),
          state = parseTeachingState(JSON.parse(run.state));
        validatePosition(value, state, summary.taskId);
        const session = {
          sessionId: row.sessionId,
          runId,
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
        const writing = writingTask({ content: value, taskId: summary.taskId }),
          documents: HistoricalWork["documents"][number][] = [];
        for (const token of await ink.tokens({ session })) {
          const snapshot = await ink.snapshot({ token }),
            target = writing?.targets.find(
              (target) => target.id === token.targetId,
            );
          if (!target) throw new Error("Historical writing guide missing");
          const { token: privateToken, writable, ...readOnly } = snapshot;
          documents.push({ access: "readOnly", target, snapshot: readOnly });
        }
        const title =
          value.body.coverage === "partial-first-m"
            ? value.body.title
            : resolvedTask({ content: value, taskId: summary.taskId })?.entry
                .task.title;
        if (!title) throw new Error("Historical task unavailable");
        return {
          selection: directory.selection,
          value: parseHistoricalWork({
            kind: "work",
            summary,
            title,
            documents,
          }),
        };
      }),
    readPracticeControls: (input) =>
      exclusive(async () => {
        const directory = await requireSelection(input.selection);
        const binding = parsePracticeControlsBinding(input.binding);
        if (!(await ready())) throw new Error("Writing recovery is closed");
        const projection = await read();
        if (
          projection.kind !== "writing" ||
          projection.owner.profileId !== binding.owner.profileId ||
          projection.owner.generation !== binding.owner.generation ||
          projection.sessionId !== binding.sessionId ||
          projection.runId !== binding.runId ||
          projection.packageHash !== binding.packageHash
        )
          return {
            selection: directory.selection,
            value: { kind: "readOnly" },
          };
        for (const token of projection.documents) {
          const snapshot = await ink.snapshot({ token });
          const summary = summarizePractice({ binding, snapshot });
          if (summary.kind === "editable")
            return { selection: directory.selection, value: summary };
        }
        return { selection: directory.selection, value: { kind: "readOnly" } };
      }),
    readInk: (input) =>
      exclusive(async () => {
        const directory = await requireSelection(input.selection);
        if (!(await ready())) throw new Error("Writing recovery is closed");
        if (
          input.token.profileId !== directory.selection.owner.profileId ||
          input.token.generation !== directory.selection.owner.generation
        )
          throw new Error("Writing belongs to another selected profile");
        return {
          selection: directory.selection,
          value: await ink.snapshot({ token: input.token }),
        };
      }),
    openRecovery: (input) =>
      exclusive(async () => {
        const opening = parseSelectedRecoveryOpening(input);
        await ensureInitialized();
        if (
          recovery.kind === "closed" &&
          recovery.opening.kind === "warm" &&
          canonical(recovery.opening) !== canonical(opening)
        )
          throw new Error("Pending warm recovery declaration changed");
        const id = ids();
        recovery = {
          kind: "closed",
          id,
          opening,
          settled: new Set(),
          phase:
            opening.kind === "warm" && opening.retainedStrokeIds.length
              ? "ink"
              : afterInk(opening),
        };
        return parseSelectedRecoveryInventory({
          kind: "closed",
          recoveryId: id,
          captures: await ink.inventory(),
          directory: await profileDirectory.read(),
        });
      }),
    recoverInk: (input) =>
      exclusive(async () => {
        const operation = parseSelectedOperation(input.operation);
        if (operation.kind !== "ink")
          throw new Error("Ink recovery requires a retained ink operation");
        const active = recovery;
        const directory = await profileDirectory.read();
        if (
          active.kind !== "closed" ||
          active.id !== input.recoveryId ||
          active.opening.kind !== "warm"
        )
          return {
            selection: directory.selection,
            resolution: "rejected",
            result: rejectOperation(
              "recovery-closed",
              "Warm recovery is unavailable.",
            ),
          };
        const opening = active.opening;
        const command = operation.command;
        if (
          canonical(operation.selection) !== canonical(opening.selection) ||
          !opening.retainedStrokeIds.includes(command.edit.strokeId)
        )
          return {
            selection: directory.selection,
            resolution: "rejected",
            result: rejectOperation(
              "undeclared-capture",
              "Capture was not retained by this client.",
            ),
          };
        const result = await transaction(executor, async () => {
          const current = await profileDirectory.read();
          const same =
            canonical(current.selection) === canonical(operation.selection);
          if (
            operation.selection.installationId !==
            current.selection.installationId
          )
            return {
              selection: current.selection,
              resolution: "rejected",
              result: rejectOperation(
                "stale-installation",
                "Retained ink belongs to another installation.",
              ),
            } satisfies RecoveryResult<InkReceipt>;
          if (same && current.initialSetup.kind === "firstLaunch")
            return {
              selection: current.selection,
              resolution: "rejected",
              result: rejectOperation(
                "initial-setup-required",
                "Confirm the initial child before teaching.",
              ),
            } satisfies RecoveryResult<InkReceipt>;
          if (
            command.token.profileId !== operation.selection.owner.profileId ||
            command.token.generation !== operation.selection.owner.generation
          )
            return {
              selection: current.selection,
              resolution: "rejected",
              result: rejectOperation(
                "stale-owner",
                "Retained ink belongs to another child.",
              ),
            } satisfies RecoveryResult<InkReceipt>;
          if (same && active.phase === "ink")
            return recoveryResult<InkReceipt>(
              current.selection,
              await ink.dispatch(command),
              "applied",
            );
          const receipt = await ink.resolveRetained(command);
          return recoveryResult<InkReceipt>(
            current.selection,
            receipt ??
              rejectOperation(
                "stale-selection",
                "Retired ink has no exact committed receipt.",
              ),
            "receiptOnly",
          );
        });
        if (
          active.phase === "ink" &&
          result.result.kind === "inkCommitted" &&
          command.edit.kind === "finalize"
        ) {
          active.settled.add(command.edit.strokeId);
          if (
            opening.retainedStrokeIds.every((id) => active.settled.has(id)) &&
            !(await ink.inventory()).some((capture) =>
              opening.retainedStrokeIds.includes(capture.strokeId),
            )
          )
            active.phase = afterInk(opening);
        }
        return result;
      }),
    recoverTeaching: (input) =>
      exclusive(async () => {
        const operation = parseSelectedOperation(input.operation);
        if (operation.kind !== "teaching")
          throw new Error(
            "Teaching recovery requires a retained teaching operation",
          );
        const active = recovery;
        const directory = await profileDirectory.read();
        if (
          active.kind !== "closed" ||
          active.id !== input.recoveryId ||
          active.opening.kind !== "warm"
        )
          return {
            selection: directory.selection,
            resolution: "rejected",
            result: rejectOperation(
              "recovery-closed",
              "Warm recovery is unavailable.",
            ),
          };
        const opening = active.opening;
        if (
          !opening.teaching ||
          canonical(opening.teaching) !== canonical(operation)
        )
          return {
            selection: directory.selection,
            resolution: "rejected",
            result: rejectOperation(
              "undeclared-teaching",
              "This exact outer teaching operation was not retained.",
            ),
          };
        if (active.phase === "ink")
          return {
            selection: directory.selection,
            resolution: "rejected",
            result: rejectOperation(
              "unsettled-capture",
              "Retained ink must resolve before teaching.",
            ),
          };
        const result = await transaction(executor, async () => {
          const current = await profileDirectory.read();
          const same =
            canonical(current.selection) === canonical(operation.selection);
          const command = operation.command;
          if (
            operation.selection.installationId !==
            current.selection.installationId
          )
            return {
              selection: current.selection,
              resolution: "rejected",
              result: rejectOperation(
                "stale-installation",
                "Retained teaching belongs to another installation.",
              ),
            } satisfies RecoveryResult<CommitReceipt>;
          if (same && current.initialSetup.kind === "firstLaunch")
            return {
              selection: current.selection,
              resolution: "rejected",
              result: rejectOperation(
                "initial-setup-required",
                "Confirm the initial child before teaching.",
              ),
            } satisfies RecoveryResult<CommitReceipt>;
          if (
            command.owner.profileId !== operation.selection.owner.profileId ||
            command.owner.generation !== operation.selection.owner.generation
          )
            return {
              selection: current.selection,
              resolution: "rejected",
              result: rejectOperation(
                "stale-owner",
                "Retained teaching belongs to another child.",
              ),
            } satisfies RecoveryResult<CommitReceipt>;
          if (same && active.phase === "teaching")
            return recoveryResult<CommitReceipt>(
              current.selection,
              await dispatchTeachingInTransaction({
                input: command,
                tx: repositories,
                store,
                ids,
                hash,
              }),
              "applied",
            );
          const receipt = await resolveTeachingReceipt(command);
          return recoveryResult<CommitReceipt>(
            current.selection,
            receipt ??
              rejectOperation(
                "stale-selection",
                "Retired teaching has no exact committed receipt.",
              ),
            "receiptOnly",
          );
        });
        if (active.phase === "teaching") active.phase = afterTeaching(opening);
        return result;
      }),
    recoverAdministration: (input) =>
      exclusive(async () => {
        const command = parseProfileAdministrationCommand(input.command);
        const active = recovery;
        const directory = await profileDirectory.read();
        if (
          active.kind !== "closed" ||
          active.id !== input.recoveryId ||
          active.opening.kind !== "warm"
        )
          return {
            selection: directory.selection,
            resolution: "rejected",
            result: rejectOperation(
              "recovery-closed",
              "Warm recovery is unavailable.",
            ),
          };
        if (
          !active.opening.administration ||
          canonical(active.opening.administration) !== canonical(command)
        )
          return {
            selection: directory.selection,
            resolution: "rejected",
            result: rejectOperation(
              "undeclared-administration",
              "This exact administrative command was not retained.",
            ),
          };
        if (active.phase === "ink" || active.phase === "teaching")
          return {
            selection: directory.selection,
            resolution: "rejected",
            result: rejectOperation(
              "recovery-order",
              "Retained ink and teaching must resolve before administration.",
            ),
          };
        if (
          (await hash(profileAdministrationPreimage(command))) !==
          command.payloadHash
        )
          return {
            selection: directory.selection,
            resolution: "rejected",
            result: rejectOperation(
              "payload-hash",
              "The retained administrative payload changed.",
            ),
          };
        const result = await transaction(executor, async () => {
          const current = await profileDirectory.read();
          if (
            active.phase === "administration" &&
            canonical(current.selection) === canonical(command.selection)
          ) {
            const applied = await profileDirectory.administer({
              command,
              depart: departProfile,
            });
            return recoveryResult<ProfileAdministrationReceipt>(
              (await profileDirectory.read()).selection,
              applied,
              "applied",
            );
          }
          const receipt = await profileDirectory.resolveRetained({
            command,
            directory: current,
          });
          return recoveryResult<ProfileAdministrationReceipt>(
            current.selection,
            receipt ??
              rejectOperation(
                "stale-selection",
                "Retired administration has no exact committed receipt.",
              ),
            "receiptOnly",
          );
        });
        if (active.phase === "administration") active.phase = "finalize";
        return result;
      }),
    reconcileRecovery: (input) =>
      exclusive(async () => {
        const choice = parseRecoveryChoice(input.choice);
        const active = recovery;
        if (
          active.kind !== "closed" ||
          active.id !== input.recoveryId ||
          active.opening.kind !== choice.kind
        )
          throw new Error("Recovery identity changed");
        if (active.phase !== "finalize")
          throw new Error(
            "Declared retained work still requires exact ordered resolution",
          );
        if (choice.kind === "warm") {
          if (
            active.opening.kind !== "warm" ||
            canonical([...choice.settledStrokeIds].sort()) !==
              canonical([...active.opening.retainedStrokeIds].sort()) ||
            !choice.settledStrokeIds.every((id) => active.settled.has(id))
          )
            throw new Error("Retained captures are not settled");
          if (
            (await ink.inventory()).some((capture) =>
              choice.settledStrokeIds.includes(capture.strokeId),
            )
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
        return profileDirectory.read();
      }),
  };
}
