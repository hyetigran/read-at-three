import { and, eq, asc, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  canonical,
  createCoordinator,
  evaluate,
  initialState,
  increment,
  parseCounter,
  parseDevelopmentPackage,
  parseReceipt,
  parseTeachingState,
} from "../../teaching/src/index.ts";
import type {
  CommittedProjection,
  DevelopmentPackage,
  HashFunction,
  IdFactory,
  Owner,
  StoredContext,
  TeachingApplication,
  TeachingCommand,
  TeachingStore,
  TeachingTransaction,
} from "../../teaching/src/index.ts";
import { sqlValues } from "./executor.ts";
import type { SqlExecutor } from "./executor.ts";
import { initializeDatabase, transaction } from "./migration.ts";
import * as schema from "./schema.ts";
import { utf8, equalBytes } from "./utf8.ts";
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
  let initialization: Promise<TeachingApplication> | undefined;
  function ensureInitialized(): Promise<TeachingApplication> {
    initialization ??= (async () => {
      content = await parseDevelopmentPackage(content, hash);
      await initializeDatabase(executor, hash);
      await transaction(executor, async () => {
        const installations = await db.select().from(schema.installation).all();
        if (installations.length === 0) {
          await db
            .insert(schema.installation)
            .values({
              id: ids(),
              revision: parseCounter("0"),
              databaseVersion: 1,
              singleton: 1,
            })
            .run();
          await db
            .insert(schema.profile)
            .values({
              id: ids(),
              generation: parseCounter("0"),
              revision: parseCounter("0"),
              undoRunId: null,
              preferencesVersion: 1,
              preferences: canonical({ version: 1 }),
            })
            .run();
        } else if (
          installations.length !== 1 ||
          (installations[0]?.databaseVersion !== 1 &&
            BigInt(installations[0]?.databaseVersion ?? 0) !== 1n)
        )
          throw new Error("Installation metadata is incompatible");
        const packages = await db
          .select()
          .from(schema.installedPackage)
          .where(eq(schema.installedPackage.packageHash, content.packageHash))
          .all();
        if (packages.length === 0)
          await db
            .insert(schema.installedPackage)
            .values({
              packageHash: content.packageHash,
              courseId: content.body.courseId,
              releaseId: content.body.releaseId,
              contentSchemaVersion: 1,
              capabilities: canonical(["partial-first-m"]),
              manifestVersion: 1,
              verifiedManifest: utf8(canonical(content)),
              state: "ready",
              storageKey: content.packageHash,
            })
            .run();
        else {
          const installed = packages[0];
          if (
            !installed ||
            installed.courseId !== content.body.courseId ||
            installed.releaseId !== content.body.releaseId ||
            !equalBytes(installed.verifiedManifest, utf8(canonical(content)))
          )
            throw new Error(
              "Installed package identity does not match verified content",
            );
        }
        const activations = await db
          .select()
          .from(schema.courseActivation)
          .where(eq(schema.courseActivation.courseId, content.body.courseId))
          .all();
        if (activations.length === 0)
          await db
            .insert(schema.courseActivation)
            .values({
              courseId: content.body.courseId,
              activePackageHash: content.packageHash,
              fallbackPackageHash: null,
              revision: parseCounter("0"),
            })
            .run();
      });
      return createCoordinator({ store, content, ids, hash });
    })();
    return initialization;
  }
  async function context(owner: Owner): Promise<StoredContext | null> {
    parseCounter(owner.generation);
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
    if (!cursor?.resumeSessionId) {
      const orphaned = await db
        .select({ id: schema.session.sessionId })
        .from(schema.session)
        .where(
          and(
            eq(schema.session.profileId, owner.profileId),
            eq(schema.session.generation, owner.generation),
            eq(schema.session.courseId, content.body.courseId),
            ne(schema.session.status, "closed"),
          ),
        )
        .all();
      if (orphaned.length > 0)
        throw new Error("Saved teaching is missing its resume cursor");
      return { owner, profileRevision: profile.revision, session: null };
    }
    const sessions = await db
      .select()
      .from(schema.session)
      .where(
        and(
          eq(schema.session.sessionId, cursor.resumeSessionId),
          eq(schema.session.profileId, owner.profileId),
          eq(schema.session.generation, owner.generation),
          eq(schema.session.courseId, content.body.courseId),
        ),
      )
      .all();
    const session = sessions[0];
    if (!session || session.status === "closed")
      throw new Error("Saved session ownership or status is invalid");
    const runs = await db
      .select()
      .from(schema.taskRun)
      .where(eq(schema.taskRun.runId, session.currentRunId))
      .all();
    const run = runs[0];
    if (
      !run ||
      run.sessionId !== session.sessionId ||
      run.profileId !== owner.profileId ||
      run.generation !== owner.generation ||
      run.courseId !== session.courseId ||
      run.packageHash !== session.packageHash ||
      run.lessonId !== session.lessonId ||
      run.taskId !== session.taskId ||
      run.status !== "inProgress"
    )
      throw new Error("Saved run ownership or status is invalid");
    if (
      run.packageHash === content.packageHash &&
      (run.lessonId !== content.body.lessonId ||
        run.taskId !== content.body.taskId)
    )
      throw new Error("Saved task is not in its pinned package");
    const state = parseTeachingState(JSON.parse(run.state));
    if (run.activeAdvanceId === null) {
      if (
        state.acceptedNodeIds.length !== 0 ||
        run.nextAdvanceSeq !== "1" ||
        run.revision !== "0"
      )
        throw new Error("Saved run has no matching acceptance chain");
    } else {
      const advances = await db
        .select()
        .from(schema.taskAdvance)
        .where(eq(schema.taskAdvance.runId, run.runId))
        .orderBy(asc(schema.taskAdvance.seq))
        .all();
      let previous: string | null = null;
      let previousAfter: string | null = null;
      let nextSeq = "1";
      for (const advance of advances) {
        if (
          advance.status !== "accepted" ||
          advance.profileId !== owner.profileId ||
          advance.generation !== owner.generation ||
          advance.previousAdvanceId !== previous ||
          advance.seq !== nextSeq ||
          advance.acceptedRunRevision !== advance.seq ||
          advance.beforeRunStatus !== "inProgress" ||
          advance.afterRunStatus !== "inProgress"
        )
          throw new Error("Saved acceptance chain is invalid");
        if (previousAfter !== null && previousAfter !== advance.beforeState)
          throw new Error("Saved acceptance snapshots do not connect");
        const before = parseTeachingState(JSON.parse(advance.beforeState));
        const after = parseTeachingState(JSON.parse(advance.afterState));
        if (run.packageHash === content.packageHash) {
          if (
            previous === null &&
            canonical(before) !== canonical(initialState(content))
          )
            throw new Error(
              "Saved acceptance chain does not start at task entry",
            );
          if (
            before.kind !== "teaching" ||
            canonical(evaluate(content, before, before.nodeId)) !==
              canonical(after)
          )
            throw new Error("Saved acceptance snapshots do not match content");
        }
        previous = advance.advanceId;
        previousAfter = advance.afterState;
        nextSeq = increment(nextSeq);
      }
      if (
        previous !== run.activeAdvanceId ||
        previousAfter !== run.state ||
        nextSeq !== run.nextAdvanceSeq ||
        run.revision !== String(advances.length)
      )
        throw new Error("Saved acceptance head is invalid");
    }
    return {
      owner,
      profileRevision: profile.revision,
      session: {
        sessionId: session.sessionId,
        runId: run.runId,
        revision: session.revision,
        runRevision: run.revision,
        packageHash: session.packageHash,
        state,
        activeAdvanceId: run.activeAdvanceId,
        nextAdvanceSeq: run.nextAdvanceSeq,
      },
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
  async function saveReceipt(
    command: TeachingCommand,
    result: import("../../teaching/src/index.ts").CommitReceipt,
  ) {
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
  const repositories: TeachingTransaction = {
    context,
    receipt,
    async start(input) {
      const {
        command,
        content,
        state,
        sessionId,
        runId,
        receipt: result,
      } = input;
      const owner = command.owner;
      const packages = await db
        .select()
        .from(schema.installedPackage)
        .where(eq(schema.installedPackage.packageHash, content.packageHash))
        .all();
      if (packages[0]?.state !== "ready")
        throw new Error("Pinned package is not ready");
      const activations = await db
        .select()
        .from(schema.courseActivation)
        .where(eq(schema.courseActivation.courseId, content.body.courseId))
        .all();
      if (activations[0]?.activePackageHash !== content.packageHash)
        throw new Error("Package is not active for this course");
      await db
        .insert(schema.session)
        .values({
          sessionId,
          profileId: owner.profileId,
          generation: owner.generation,
          courseId: content.body.courseId,
          packageHash: content.packageHash,
          lessonId: content.body.lessonId,
          taskId: content.body.taskId,
          currentRunId: runId,
          scopeKind: "progression",
          scopeTargetId: content.body.lessonId,
          status: "active",
          lastSelectedSeq: parseCounter("1"),
          returnSessionId: null,
          revision: parseCounter("0"),
        })
        .run();
      await db
        .insert(schema.taskRun)
        .values({
          runId,
          sessionId,
          profileId: owner.profileId,
          generation: owner.generation,
          courseId: content.body.courseId,
          packageHash: content.packageHash,
          lessonId: content.body.lessonId,
          taskId: content.body.taskId,
          ordinal: parseCounter("0"),
          status: "inProgress",
          stateVersion: 1,
          state: canonical(state),
          activeAdvanceId: null,
          nextAdvanceSeq: parseCounter("1"),
          revision: parseCounter("0"),
        })
        .run();
      await db
        .update(schema.profile)
        .set({ revision: result.revision, undoRunId: runId })
        .where(
          and(
            eq(schema.profile.id, owner.profileId),
            eq(schema.profile.generation, owner.generation),
          ),
        )
        .run();
      await db
        .insert(schema.courseCursor)
        .values({
          profileId: owner.profileId,
          generation: owner.generation,
          courseId: content.body.courseId,
          resumeSessionId: sessionId,
          selectionCounter: parseCounter("1"),
          revision: parseCounter("1"),
        })
        .onConflictDoUpdate({
          target: [
            schema.courseCursor.profileId,
            schema.courseCursor.generation,
            schema.courseCursor.courseId,
          ],
          set: {
            resumeSessionId: sessionId,
            selectionCounter: parseCounter("1"),
            revision: parseCounter("1"),
          },
        })
        .run();
      await saveReceipt(command, result);
    },
    async advance({
      command,
      context: current,
      before,
      after,
      advanceId,
      receipt: result,
    }) {
      const saved = current.session;
      const nextRevision = increment(saved.runRevision);
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
          afterState: canonical(after),
          beforeRunStatus: "inProgress",
          afterRunStatus: "inProgress",
          acceptedRunRevision: nextRevision,
        })
        .run();
      await db
        .update(schema.taskRun)
        .set({
          state: canonical(after),
          activeAdvanceId: advanceId,
          nextAdvanceSeq: increment(saved.nextAdvanceSeq),
          revision: nextRevision,
        })
        .where(eq(schema.taskRun.runId, saved.runId))
        .run();
      await db
        .update(schema.session)
        .set({ revision: result.revision })
        .where(eq(schema.session.sessionId, saved.sessionId))
        .run();
      const cursors = await db
        .select()
        .from(schema.courseCursor)
        .where(
          and(
            eq(schema.courseCursor.profileId, current.owner.profileId),
            eq(schema.courseCursor.generation, current.owner.generation),
            eq(schema.courseCursor.courseId, content.body.courseId),
          ),
        )
        .all();
      const cursor = cursors[0];
      if (!cursor) throw new Error("Saved course cursor is missing");
      await db
        .update(schema.courseCursor)
        .set({ revision: increment(cursor.revision) })
        .where(
          and(
            eq(schema.courseCursor.profileId, current.owner.profileId),
            eq(schema.courseCursor.generation, current.owner.generation),
            eq(schema.courseCursor.courseId, content.body.courseId),
          ),
        )
        .run();
      await saveReceipt(command, result);
    },
  };
  const store: TeachingStore = {
    async current() {
      const profiles = await db
        .select()
        .from(schema.profile)
        .orderBy(asc(schema.profile.id))
        .all();
      const profile = profiles[0];
      if (!profile) throw new Error("Installation has no local profile");
      const result = await context({
        profileId: profile.id,
        generation: profile.generation,
      });
      if (!result) throw new Error("Local profile disappeared");
      return result;
    },
    transaction: (work) => transaction(executor, () => work(repositories)),
  };
  async function read(): Promise<CommittedProjection> {
    try {
      const coordinator = await ensureInitialized();
      return await coordinator.read();
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
