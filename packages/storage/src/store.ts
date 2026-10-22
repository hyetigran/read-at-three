import {
  parsePublicationSelection,
  InstalledResourceUnavailableError,
  requireInstallationLease,
  parseParentMaterialRequest,
  PublicationResourceError,
  ShellError,
  InstalledTeachingError,
  UnsupportedInstallProfileError,
  InstalledContentUnavailableError,
  createInstallationMaterials,
  packageMetadata,
  canonical,
  appendDiagnostic,
  parseDiagnosticRing,
  lessonForTask,
  cumulativeExtension,
  resolvedTask,
  resolvedLessons,
  parseApplicationRead,
  parseHistoricalWork,
  summarizePractice,
  parsePracticeControlsBinding,
  createCoordinator,
  increment,
  parseCounter,
  parseId,
  parseRuntimePackage,
  parseDevelopmentInstalledTeaching,
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
  parseLocalPreferences,
} from "../../teaching/src/index.ts";
import type {
  PublicationSelection,
  PublicationCheck,
  ParentMaterialFailure,
  SignedInstallMaterial,
  InstallationLease,
  InstalledApplicationOptions,
  PortableInstallationApplication,
  DiagnosticRead,
  DiagnosticRing,
  LocalSupportApplication,
  CommitReceipt,
  CommittedProjection,
  RuntimePackage,
  InstalledTeaching,
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
  ProfileDeletionReceipt,
  CommandResult,
  RecoveryResult,
  LessonFilesApplication,
  StorageCleanupApplication,
} from "../../teaching/src/index.ts";
import {
  createInitialInstallation,
  readInstallationEvidence,
} from "./initial-installation.ts";
import {
  readInstalledPackages,
  registerSignedPackage,
} from "./installed-packages.ts";
import {
  createPackageCatalog,
  readLessonFilesEvidence,
} from "./package-catalog.ts";
import { validateCatalogInventory } from "./catalog-inventory.ts";
import { decodePersonalReceipt } from "./personal-receipt.ts";
import { decodeAdministrationEvidence } from "./profile-receipt.ts";
import {
  durableReceipt,
  validateAcceptanceHistory,
} from "./acceptance-history.ts";
import { createLessonProgress } from "./lesson-progress.ts";
import { createProfileDirectory } from "./profile-directory.ts";
import { createStorageCleanup } from "./storage-cleanup.ts";
import { createInkRepository } from "./ink.ts";
import { and, eq, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sqlite-proxy";
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
export type TeachingApplicationOptions = {
  executor: SqlExecutor;
  ids: IdFactory;
  hash: HashFunction;
} & (
  | {
      content: RuntimePackage;
      preparation?: PreparationPolicy;
      installed?: never;
    }
  | {
      installed: InstalledApplicationOptions;
      content?: never;
      preparation?: never;
    }
);
export function createTeachingApplication(
  options: TeachingApplicationOptions,
): SelectedApplication &
  LocalSupportApplication &
  PortableInstallationApplication &
  LessonFilesApplication &
  StorageCleanupApplication {
  const {
    executor: connection,
    content: suppliedContent,
    ids,
    hash,
    preparation = { kind: "unavailable" },
    installed,
  } = options;
  let readOnlyVersion: number | undefined;
  const executor: SqlExecutor = {
    get retired() {
      return connection.retired;
    },
    transaction(work, checkCurrent) {
      if (readOnlyVersion !== undefined)
        throw new Error(
          "Read-only compatibility admission attempted a transaction",
        );
      return connection.transaction(work, checkCurrent);
    },
    execute(sql, parameters) {
      if (
        readOnlyVersion !== undefined &&
        !/^\s*(?:SELECT\b|PRAGMA\s+user_version\s*$)/i.test(sql)
      )
        throw new Error("Read-only compatibility admission attempted a write");
      return connection.execute(sql, parameters);
    },
  };
  const productCourseId = parseId({
    kind: "course",
    value: installed?.courseId ?? suppliedContent?.body.courseId ?? "",
  });
  if (!productCourseId) throw new Error("Product course identity is required");
  if (suppliedContent !== undefined && installed !== undefined)
    throw new Error(
      "Development content and installed mode are mutually exclusive",
    );
  const db = drizzle(async (sql, parameters, method) => {
    if (method === "get")
      throw new Error("Repository must use array-row reads");
    if (!schemaInitialized) checkInitializationLifetime();
    return executor.execute(sql, sqlValues(parameters));
  });
  let activePreparation: PreparationPolicy = preparation;
  const signedMaterials = new Map<PackageHash, SignedInstallMaterial>();
  const availability = installed
    ? createInstallationMaterials(installed, hash)
    : undefined;
  const profileDirectory = createProfileDirectory({
    db,
    executor,
    preparation: () => activePreparation,
  });
  let tail: Promise<unknown> = Promise.resolve();
  function exclusive<T>(work: () => Promise<T>): Promise<T> {
    const next = tail.then(work);
    tail = next.catch(() => undefined);
    return next;
  }
  let diagnosticDurable = true;
  let diagnosticMemory: DiagnosticRing = {
    version: 1,
    omitted: 0,
    records: [],
  };
  async function diagnostics(): Promise<DiagnosticRead> {
    if (!diagnosticDurable)
      return { persistence: "memoryOnly", ring: diagnosticMemory };
    try {
      await ensureInitialized();
      const rows = await db.select().from(schema.localDiagnostics).all();
      const row = rows[0];
      if (rows.length > 1 || (row && Number(row.singleton) !== 1))
        throw new Error("Diagnostic storage is unsupported");
      const ring = row
        ? parseDiagnosticRing(JSON.parse(row.payload))
        : diagnosticMemory;
      diagnosticMemory = ring;
      return { persistence: "durable", ring };
    } catch {
      diagnosticDurable = false;
      return { persistence: "memoryOnly", ring: diagnosticMemory };
    }
  }
  let content: InstalledTeaching;
  const verified = new Map<PackageHash, InstalledTeaching>();
  async function warmPackages() {
    const raw = (await executor.execute("PRAGMA user_version", []))
      .rows[0]?.[0];
    const loaded = await readInstalledPackages({
      db,
      hash,
      installed,
      historical: raw === 12 || raw === 12n || Number(raw) < 13,
    });
    verified.clear();
    for (const [key, value] of loaded.verified) verified.set(key, value);
    signedMaterials.clear();
    for (const [key, value] of loaded.signed) signedMaterials.set(key, value);
    if (installed && Number(raw) >= 13) {
      const activation = (
        await db
          .select()
          .from(schema.courseActivation)
          .where(eq(schema.courseActivation.courseId, productCourseId))
          .all()
      )[0];
      const material = activation
        ? signedMaterials.get(activation.activePackageHash)
        : undefined;
      activePreparation = material
        ? { kind: "reviewed", hash: material.preparation.preparationHash }
        : { kind: "unavailable" };
    }
  }
  function pinned(packageHash: PackageHash) {
    const value = verified.get(packageHash);
    if (!value) throw new Error("Exact pinned package is unavailable");
    return value;
  }
  async function ensurePackage(value: InstalledTeaching) {
    const rows = await db
      .select()
      .from(schema.installedPackage)
      .where(eq(schema.installedPackage.packageHash, value.key))
      .all();
    const row = rows[0];
    if (
      !row ||
      row.state !== "ready" ||
      row.courseId !== value.body.courseId ||
      row.releaseId !== value.body.releaseId ||
      row.storageKey !== value.key ||
      Number(row.contentSchemaVersion) !==
        packageMetadata(value.document).contentSchemaVersion ||
      row.capabilities !==
        canonical(packageMetadata(value.document).capabilities) ||
      Number(row.manifestVersion) !== 1 ||
      !equalBytes(
        row.verifiedManifest,
        utf8(
          canonical(
            value.kind === "signed-v1"
              ? value.publication.envelope
              : value.document,
          ),
        ),
      )
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
  async function admitReadOnly(version: number) {
    if (version === 0) return;
    readOnlyVersion = version;
    acceptanceMode = version < 7 ? "v6" : "v7";
    legacyCursorRead = version < 6;
    try {
      await warmPackages();
      const installations = await db.select().from(schema.installation).all();
      if (
        installations.length > 1 ||
        installations.some((row) => Number(row.databaseVersion) !== version)
      )
        throw new Error("Installation metadata is incompatible");
      const profiles = await db.select().from(schema.profile).all();
      for (const profile of profiles) {
        if (
          Number(profile.preferencesVersion) !== 1 ||
          profile.preferences.length > 16384
        )
          throw new Error("Saved profile preferences are unsupported");
        parseLocalPreferences(JSON.parse(profile.preferences));
      }
      await validateOwners();
      const activations = await db.select().from(schema.courseActivation).all();
      const sessions = await db.select().from(schema.session).all();
      if (
        sessions.some(
          (session) =>
            !activations.some(
              (activation) => activation.courseId === session.courseId,
            ),
        )
      )
        throw new Error("Saved teaching has no course activation");
      if (version >= 4) await ink.inventory();
      const receipts = await db.select().from(schema.commandReceipt).all();
      const runs = await db.select().from(schema.taskRunV6).all();
      const documents =
        version >= 4 ? await db.select().from(schema.inkDocument).all() : [];
      for (const receipt of receipts) {
        const result = decodePersonalReceipt(receipt);
        if (
          (receipt.scopeKind === "profile" &&
            receipt.scopeId !== receipt.ownerProfileId) ||
          (receipt.scopeKind === "session" &&
            !sessions.some(
              (session) =>
                session.sessionId === receipt.scopeId &&
                session.profileId === receipt.ownerProfileId &&
                session.generation === receipt.ownerGeneration,
            )) ||
          (receipt.scopeKind === "document" &&
            !documents.some(
              (document) =>
                document.documentId === receipt.scopeId &&
                document.profileId === receipt.ownerProfileId &&
                document.generation === receipt.ownerGeneration,
            ))
        )
          throw new Error("Saved receipt has no semantic owner");
        if (
          result.kind === "committed" &&
          !runs.some(
            (run) =>
              run.runId === result.runId &&
              run.sessionId === result.sessionId &&
              run.packageHash === result.packageHash &&
              run.profileId === result.owner.profileId &&
              run.generation === result.owner.generation,
          )
        )
          throw new Error("Saved teaching receipt source binding is invalid");
      }
      if (version >= 6) {
        const lessons = await db.select().from(schema.lessonCredit).all();
        if (
          lessons.some(
            (lesson) =>
              !activations.some(
                (activation) => activation.courseId === lesson.courseId,
              ),
          )
        )
          throw new Error("Saved lesson credit has no course activation");
      }
      if (version >= 8) {
        if (installations.length) await profileDirectory.read();
        const evidence =
          version === 8
            ? (
                await db
                  .select()
                  .from(schema.profileAdministrationReceiptV8)
                  .all()
              ).map((row) => ({ ...row, evidenceKind: "full" as const }))
            : await db.select().from(schema.profileAdministrationReceipt).all();
        for (const row of evidence) decodeAdministrationEvidence(row);
      }
      if (version >= 13) {
        const commands = await db
          .select()
          .from(schema.installationCommand)
          .all();
        for (const row of commands) await readInstallationEvidence(row, hash);
      }
      if (version >= 15) await storageCleanup.validate();
      if (version >= 14) {
        await validateCatalogInventory({ db, executor, hash });
      }
    } finally {
      readOnlyVersion = undefined;
      acceptanceMode = "v7";
      legacyCursorRead = false;
    }
  }
  let initialization: Promise<ReturnType<typeof createCoordinator>> | undefined;
  let schemaInitialized = false;
  function checkInitializationLifetime() {
    if (installed && !installed.lifetime.isCurrent())
      throw new Error("Installed initialization connection was retired");
  }
  const initializationGuard = installed
    ? checkInitializationLifetime
    : undefined;
  function ensureInitialized() {
    checkInitializationLifetime();
    initialization ??= (async () => {
      if (suppliedContent)
        content = await parseDevelopmentInstalledTeaching({
          document: suppliedContent,
          hash,
        });
      await initializeDatabase(
        executor,
        hash,
        async (version) => {
          if (version !== 6 && version !== 7 && version !== 8) return undefined;
          await warmPackages();
          const prepared = [...verified.values()].sort((a, b) =>
            a.key.localeCompare(b.key),
          );
          return async () => {
            const readyPackages = await db
              .select()
              .from(schema.installedPackage)
              .all();
            if (
              readyPackages.length !== prepared.length ||
              readyPackages.some(
                (row) =>
                  !prepared.some((value) => value.key === row.packageHash),
              )
            )
              throw new Error("Prepared package set changed before migration");
            await warmPackages();
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
        },
        initializationGuard,
        admitReadOnly,
      );
      await warmPackages();
      await transaction(
        executor,
        async () => {
          const installations = await db
            .select()
            .from(schema.installation)
            .all();
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
          if (suppliedContent) {
            const packages = await db
              .select()
              .from(schema.installedPackage)
              .where(eq(schema.installedPackage.packageHash, content.key))
              .all();
            if (!packages.length)
              await db
                .insert(schema.installedPackage)
                .values({
                  packageHash: content.key,
                  courseId: content.body.courseId,
                  releaseId: content.body.releaseId,
                  contentSchemaVersion: packageMetadata(content.document)
                    .contentSchemaVersion,
                  capabilities: canonical(
                    packageMetadata(content.document).capabilities,
                  ),
                  manifestVersion: 1,
                  verifiedManifest: utf8(canonical(content.document)),
                  state: "ready",
                  storageKey: content.key,
                })
                .run();
            else await ensurePackage(content);
            if (!packages.length)
              await db
                .insert(schema.installedRepresentation)
                .values({
                  packageHash: content.key,
                  kind: "development-v1",
                  mode: null,
                  curriculumUtf8: null,
                  preparationUtf8: null,
                })
                .run();
            const activations = await db
              .select()
              .from(schema.courseActivation)
              .where(
                eq(schema.courseActivation.courseId, content.body.courseId),
              )
              .all();
            const active = activations[0];
            if (!active)
              await db
                .insert(schema.courseActivation)
                .values({
                  courseId: content.body.courseId,
                  activePackageHash: content.key,
                  fallbackPackageHash: null,
                  revision: parseCounter("0"),
                })
                .run();
            else if (active.activePackageHash !== content.key) {
              const previous = pinned(active.activePackageHash);
              if (previous.kind !== "development-v1")
                throw new Error(
                  "Development construction cannot replace signed content",
                );
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
                cumulativeExtension({
                  previous: previous.document,
                  candidate: content.document,
                }) ||
                cumulative ||
                isCumulativeOralExtension({
                  previous: previous.document,
                  candidate: content.document,
                }) ||
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
                    activePackageHash: content.key,
                    fallbackPackageHash: previous.key,
                    revision: increment(active.revision),
                  })
                  .where(
                    and(
                      eq(
                        schema.courseActivation.courseId,
                        content.body.courseId,
                      ),
                      eq(
                        schema.courseActivation.activePackageHash,
                        previous.key,
                      ),
                      eq(schema.courseActivation.revision, active.revision),
                    ),
                  )
                  .run();
            }
          }
        },
        initializationGuard,
      );
      await warmPackages();
      await profileDirectory.read();
      schemaInitialized = true;
      await validateOwners();
      await ink.inventory();
      checkInitializationLifetime();
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
      lessonForTask({ content: value.document, taskId: run.taskId }) !==
        run.lessonId
    )
      throw new Error("Saved package ownership is invalid");
    const state = parseTeachingState(JSON.parse(run.state));
    validatePosition(value, state, run.taskId);
    const advances =
      readOnlyVersion !== undefined && readOnlyVersion < 3
        ? (
            await db
              .select()
              .from(schema.taskAdvanceV2)
              .where(eq(schema.taskAdvanceV2.runId, run.runId))
              .orderBy(asc(schema.taskAdvanceV2.seq))
              .all()
          ).map((row) => ({ ...row, acceptingCommand: null }))
        : await db
            .select()
            .from(schema.taskAdvance)
            .where(eq(schema.taskAdvance.runId, run.runId))
            .orderBy(asc(schema.taskAdvance.seq))
            .all();
    const credits =
      readOnlyVersion !== undefined && readOnlyVersion < 2
        ? []
        : await db
            .select()
            .from(schema.taskCredit)
            .where(eq(schema.taskCredit.runId, run.runId))
            .all();
    const documents =
      readOnlyVersion !== undefined && readOnlyVersion < 4
        ? []
        : await db
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
    courseId = productCourseId,
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
    const results =
      readOnlyVersion !== undefined && readOnlyVersion < 2
        ? []
        : await db
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
    const credits =
      readOnlyVersion !== undefined && readOnlyVersion < 2
        ? []
        : await db
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
    const lessonResults =
      readOnlyVersion !== undefined && readOnlyVersion < 6
        ? []
        : await lessonProgress.validate({ owner, courseId });
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
    const result = decodePersonalReceipt(row);
    if (result.kind !== "committed")
      throw new Error("Personal command identity belongs to another protocol");
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
      eq(schema.courseCursor.courseId, productCourseId),
    );
    const existing = (
      await db.select().from(schema.courseCursor).where(where).all()
    )[0];
    await db
      .insert(schema.courseCursor)
      .values({
        profileId: owner.profileId,
        generation: owner.generation,
        courseId: productCourseId,
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
  const storageCleanup = createStorageCleanup({ db, executor, hash });
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
        if (value.key !== current.activePackageHash)
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
            packageHash: value.key,
            lessonId: lessonForTask({
              content: value.document,
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
            packageHash: value.key,
            lessonId: lessonForTask({
              content: value.document,
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
            packageHash: value.key,
            lessonId: lessonForTask({
              content: value.document,
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
        await repairTerminalCursors(owner, productCourseId);
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
        value.key,
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
            packageHash: value.key,
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
        if (current.activePackageHash !== value.key)
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
  let recovery:
    | { kind: "unopened" }
    | { kind: "ready" }
    | {
        kind: "administrationSettled";
        id: string;
        receipt: ProfileDeletionReceipt;
      }
    | ClosedRecovery = {
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
  const resourceScopes = new WeakMap<
    InstallationLease,
    { key: PackageHash; witness: string }
  >();
  async function scopeWitness(key: PackageHash) {
    const value = pinned(key);
    const directory = await profileDirectory.read();
    const activation = (
      await db
        .select()
        .from(schema.courseActivation)
        .where(eq(schema.courseActivation.courseId, value.body.courseId))
        .all()
    )[0];
    const cursor = (
      await db
        .select()
        .from(schema.courseCursor)
        .where(
          and(
            eq(
              schema.courseCursor.profileId,
              directory.selection.owner.profileId,
            ),
            eq(
              schema.courseCursor.generation,
              directory.selection.owner.generation,
            ),
            eq(schema.courseCursor.courseId, value.body.courseId),
          ),
        )
        .all()
    )[0];
    const session = cursor?.resumeSessionId
      ? (
          await db
            .select()
            .from(schema.session)
            .where(eq(schema.session.sessionId, cursor.resumeSessionId))
            .all()
        )[0]
      : undefined;
    const run = session
      ? (
          await db
            .select()
            .from(schema.taskRunV6)
            .where(eq(schema.taskRunV6.runId, session.currentRunId))
            .all()
        )[0]
      : undefined;
    const witness = {
      selection: directory.selection,
      activation: activation ?? null,
      cursor: cursor ?? null,
      session: session ?? null,
      run: run ?? null,
    };
    return canonical(
      JSON.parse(
        JSON.stringify(witness, (_key, value: unknown) =>
          typeof value === "bigint"
            ? { sqliteInteger: value.toString() }
            : value,
        ),
      ),
    );
  }
  function checkLease(lease?: InstallationLease) {
    if (installed && !installed.lifetime.isCurrent())
      throw new Error("Application connection retired");
    if (lease && (!resourceScopes.has(lease) || !lease.isCurrent()))
      throw new Error("Current installed resources are unavailable");
  }
  async function validateScope(lease?: InstallationLease) {
    checkLease(lease);
    if (!lease) return;
    const scope = resourceScopes.get(lease);
    if (!scope || (await scopeWitness(scope.key)) !== scope.witness)
      throw new Error(
        "Installed operation witness changed during verification",
      );
  }

  async function guardedTransaction<T>(
    lease: InstallationLease | undefined,
    work: () => Promise<T>,
  ): Promise<T> {
    await validateScope(lease);
    return transaction(executor, async () => {
      const result = await work();
      checkLease(lease);
      return result;
    });
  }
  async function activeKey() {
    await packageCatalog?.prepareAdmission();
    return exclusive(async () => {
      await ensureInitialized();
      const activation = (
        await db
          .select()
          .from(schema.courseActivation)
          .where(eq(schema.courseActivation.courseId, productCourseId))
          .all()
      )[0];
      if (!activation) throw new Error("Product course is not installed");
      return activation.activePackageHash;
    });
  }
  async function cursorPackage(
    selection: SelectedOwnerWitness,
  ): Promise<PackageHash> {
    await requireSelection(selection);
    const cursor = (
      await db
        .select()
        .from(schema.courseCursor)
        .where(
          and(
            eq(schema.courseCursor.profileId, selection.owner.profileId),
            eq(schema.courseCursor.generation, selection.owner.generation),
            eq(schema.courseCursor.courseId, productCourseId),
          ),
        )
        .all()
    )[0];
    if (cursor?.resumeSessionId) {
      const session = (
        await db
          .select()
          .from(schema.session)
          .where(eq(schema.session.sessionId, cursor.resumeSessionId))
          .all()
      )[0];
      if (
        !session ||
        session.profileId !== selection.owner.profileId ||
        session.generation !== selection.owner.generation ||
        session.courseId !== productCourseId
      )
        throw new Error("Resume cursor ownership is invalid");
      return session.packageHash;
    }
    const active = (
      await db
        .select()
        .from(schema.courseActivation)
        .where(eq(schema.courseActivation.courseId, productCourseId))
        .all()
    )[0];
    if (!active) throw new Error("Product course is not installed");
    return active.activePackageHash;
  }
  function withFreshExact<T>(
    key: PackageHash,
    run: (
      material: SignedInstallMaterial,
      lease: InstallationLease,
    ) => Promise<T>,
  ) {
    return withFreshTarget({ kind: "exact", key }, run);
  }
  function withFreshCursor<T>(
    selection: SelectedOwnerWitness,
    run: (
      material: SignedInstallMaterial,
      lease: InstallationLease,
    ) => Promise<T>,
  ) {
    return withFreshTarget({ kind: "cursor", selection }, run);
  }
  async function withFreshTarget<T>(
    target:
      | Readonly<{ kind: "exact"; key: PackageHash }>
      | Readonly<{ kind: "cursor"; selection: SelectedOwnerWitness }>,
    run: (
      material: SignedInstallMaterial,
      lease: InstallationLease,
    ) => Promise<T>,
  ): Promise<T> {
    if (!availability) throw new Error("Installed availability is unavailable");
    await packageCatalog?.prepareAdmission();
    const retained = await exclusive(async () => {
      await ensureInitialized();
      await warmPackages();
      const key =
        target.kind === "exact"
          ? target.key
          : await cursorPackage(target.selection);
      const value = signedMaterials.get(key);
      if (!value) throw new InstalledContentUnavailableError(key);
      return { key, material: value, witness: await scopeWitness(key) };
    });
    try {
      return await availability.withVerified(
        retained.material.envelope,
        async (material, lease) => {
          if (material.teaching.key !== retained.key)
            throw new Error("Exact installed package changed");
          const proof = Object.freeze({ isCurrent: () => lease.isCurrent() });
          resourceScopes.set(proof, {
            key: retained.key,
            witness: retained.witness,
          });
          try {
            return await run(material, proof);
          } finally {
            resourceScopes.delete(proof);
          }
        },
      );
    } catch (error) {
      const reason = resourceReason(error);
      if (reason) {
        packageCatalog?.invalidate(retained.key, reason);
        throw new InstalledResourceUnavailableError({
          packageHash: retained.key,
          reason,
        });
      }
      throw error;
    }
  }
  function queuedexecute(
    input: Parameters<SelectedApplication["execute"]>[0],
    lease?: InstallationLease,
  ): ReturnType<SelectedApplication["execute"]> {
    return exclusive(async () => {
      await validateScope(lease);
      const operation = parseSelectedOperation(input);
      const available = await ready();
      await warmPackages();
      return guardedTransaction(lease, async () => {
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
    });
  }
  function queuedadminister(
    input: Parameters<SelectedApplication["administer"]>[0],
    lease?: InstallationLease,
  ): ReturnType<SelectedApplication["administer"]> {
    return exclusive(async () => {
      await validateScope(lease);
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
      return guardedTransaction(lease, () =>
        profileDirectory.administer({ command, depart: departProfile }),
      );
    });
  }
  function queuedreadApplication(
    input: Parameters<SelectedApplication["readApplication"]>[0],
    lease?: InstallationLease,
  ): ReturnType<SelectedApplication["readApplication"]> {
    return exclusive(async () => {
      await validateScope(lease);
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
    });
  }
  function queuedreadDeparture(
    input: Parameters<SelectedApplication["readDeparture"]>[0],
    lease?: InstallationLease,
  ): ReturnType<SelectedApplication["readDeparture"]> {
    return exclusive(async () => {
      await validateScope(lease);
      if (!(await ready()))
        throw new Error("Writing recovery must finish before departure");
      return readDeparture(input.selection);
    });
  }
  function queuedreadWork(
    input: Parameters<SelectedApplication["readWork"]>[0],
    lease?: InstallationLease,
  ): ReturnType<SelectedApplication["readWork"]> {
    return exclusive(async () => {
      await validateScope(lease);
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
      const writing = writingTask({
          content: value.document,
          taskId: summary.taskId,
        }),
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
          : resolvedTask({ content: value.document, taskId: summary.taskId })
              ?.entry.task.title;
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
    });
  }
  function queuedreadPracticeControls(
    input: Parameters<SelectedApplication["readPracticeControls"]>[0],
    lease?: InstallationLease,
  ): ReturnType<SelectedApplication["readPracticeControls"]> {
    return exclusive(async () => {
      await validateScope(lease);
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
    });
  }
  function queuedreadInk(
    input: Parameters<SelectedApplication["readInk"]>[0],
    lease?: InstallationLease,
  ): ReturnType<SelectedApplication["readInk"]> {
    return exclusive(async () => {
      await validateScope(lease);
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
    });
  }
  function queuedrecoverInk(
    input: Parameters<SelectedApplication["recoverInk"]>[0],
    lease?: InstallationLease,
  ): ReturnType<SelectedApplication["recoverInk"]> {
    return exclusive(async () => {
      await validateScope(lease);
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
      const result = await guardedTransaction(lease, async () => {
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
        if (same && active.phase === "ink" && installed && !lease)
          return recoveryResult<InkReceipt>(
            current.selection,
            (await ink.resolveRetained(command)) ??
              rejectOperation(
                "resources-unavailable",
                "Fresh recovery requires current installed resources.",
              ),
            "applied",
          );
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
    });
  }
  function queuedrecoverTeaching(
    input: Parameters<SelectedApplication["recoverTeaching"]>[0],
    lease?: InstallationLease,
  ): ReturnType<SelectedApplication["recoverTeaching"]> {
    return exclusive(async () => {
      await validateScope(lease);
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
      const result = await guardedTransaction(lease, async () => {
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
        if (same && active.phase === "teaching" && installed && !lease)
          return recoveryResult<CommitReceipt>(
            current.selection,
            (await resolveTeachingReceipt(command)) ??
              rejectOperation(
                "resources-unavailable",
                "Fresh recovery requires current installed resources.",
              ),
            "applied",
          );
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
    });
  }
  function queuedrecoverAdministration(
    input: Parameters<SelectedApplication["recoverAdministration"]>[0],
    lease?: InstallationLease,
  ): ReturnType<SelectedApplication["recoverAdministration"]> {
    return exclusive(async () => {
      await validateScope(lease);
      const command = parseProfileAdministrationCommand(input.command);
      const active = recovery;
      const directory = await profileDirectory.read();
      if (
        active.kind === "administrationSettled" &&
        active.id === input.recoveryId
      ) {
        if (
          (await hash(profileAdministrationPreimage(command))) !==
            command.payloadHash ||
          command.commandId !== active.receipt.commandId ||
          command.payloadHash !== active.receipt.payloadHash ||
          command.scope.installationId !==
            active.receipt.administration.installationId
        )
          return recoveryResult<ProfileAdministrationReceipt>(
            directory.selection,
            rejectOperation(
              "command-identity",
              "Settled administration identity changed.",
            ),
            "receiptOnly",
          );
        return recoveryResult<ProfileAdministrationReceipt>(
          directory.selection,
          active.receipt,
          "receiptOnly",
        );
      }
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
      const result = await guardedTransaction(lease, async () => {
        const current = await profileDirectory.read();
        if (
          active.phase === "administration" &&
          canonical(current.selection) === canonical(command.selection)
        ) {
          if (installed && !lease)
            return recoveryResult<ProfileAdministrationReceipt>(
              current.selection,
              (await profileDirectory.resolveRetained({
                command,
                directory: current,
              })) ??
                rejectOperation(
                  "resources-unavailable",
                  "Fresh recovery requires current installed resources.",
                ),
              "applied",
            );
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
      if (
        result.result.kind === "profileCommitted" &&
        result.result.version === 2 &&
        "expectedRevision" in result.result &&
        result.result.effect.kind === "deleted"
      )
        recovery = {
          kind: "administrationSettled",
          id: active.id,
          receipt: result.result,
        };
      else if (active.phase === "administration") active.phase = "finalize";
      return result;
    });
  }
  type RepairAnchor =
    | Readonly<{
        kind: "active";
        row: typeof schema.courseActivation.$inferSelect;
      }>
    | Readonly<{
        kind: "fallback";
        row: typeof schema.courseActivation.$inferSelect;
      }>
    | Readonly<{
        kind: "pending";
        row: typeof schema.lessonFilesCommand.$inferSelect;
      }>
    | Readonly<{ kind: "session"; row: typeof schema.session.$inferSelect }>
    | Readonly<{ kind: "run"; row: typeof schema.taskRun.$inferSelect }>
    | Readonly<{ kind: "ink"; row: typeof schema.inkDocument.$inferSelect }>;
  function repairCanonical(value: unknown): string {
    return canonical(
      JSON.parse(
        JSON.stringify(value, (_key, value: unknown) =>
          typeof value === "bigint"
            ? { sqliteInteger: value.toString() }
            : value,
        ),
      ),
    );
  }
  function resourceReason(error: unknown): ParentMaterialFailure | undefined {
    if (error instanceof InstalledResourceUnavailableError)
      return error.failure.reason;
    if (error instanceof PublicationResourceError)
      return { kind: "content", failure: error.failure };
    if (error instanceof ShellError)
      return { kind: "shell", failure: error.failure };
    if (error instanceof InstalledContentUnavailableError)
      return { kind: "representationUnavailable" };
    if (error instanceof UnsupportedInstallProfileError)
      return { kind: "unsupportedProfile" };
    if (
      error instanceof InstalledTeachingError &&
      error.reason === "unavailable"
    )
      return { kind: "verificationUnavailable" };
  }
  async function repairAnchor(
    key: PackageHash,
  ): Promise<RepairAnchor | undefined> {
    const directory = await profileDirectory.read();
    const profiles = await db.select().from(schema.profile).all();
    const ownerExists = (row: {
      profileId: typeof schema.profile.$inferSelect.id;
      generation: typeof schema.profile.$inferSelect.generation;
      courseId: typeof schema.courseActivation.$inferSelect.courseId;
    }) =>
      row.courseId === productCourseId &&
      profiles.some(
        (profile) =>
          profile.id === row.profileId && profile.generation === row.generation,
      );
    const sessions = (await db.select().from(schema.session).all())
      .filter(ownerExists)
      .sort((a, b) => a.sessionId.localeCompare(b.sessionId));
    const runs = (await db.select().from(schema.taskRun).all())
      .filter(ownerExists)
      .filter(
        (run) =>
          run.packageHash === key &&
          sessions.some(
            (session) =>
              session.sessionId === run.sessionId &&
              session.profileId === run.profileId &&
              session.generation === run.generation &&
              session.courseId === run.courseId,
          ),
      )
      .sort((a, b) => a.runId.localeCompare(b.runId));
    const inks = (await db.select().from(schema.inkDocument).all())
      .filter(ownerExists)
      .filter(
        (ink) =>
          ink.packageHash === key &&
          runs.some(
            (run) =>
              run.runId === ink.runId &&
              run.profileId === ink.profileId &&
              run.generation === ink.generation &&
              run.courseId === ink.courseId &&
              run.packageHash === ink.packageHash &&
              run.lessonId === ink.lessonId &&
              run.taskId === ink.taskId,
          ),
      )
      .sort((a, b) => a.documentId.localeCompare(b.documentId));
    const cursor = (
      await db
        .select()
        .from(schema.courseCursor)
        .where(
          and(
            eq(
              schema.courseCursor.profileId,
              directory.selection.owner.profileId,
            ),
            eq(
              schema.courseCursor.generation,
              directory.selection.owner.generation,
            ),
            eq(schema.courseCursor.courseId, productCourseId),
          ),
        )
        .all()
    )[0];
    const current = sessions.find(
      (session) =>
        session.sessionId === cursor?.resumeSessionId &&
        session.profileId === directory.selection.owner.profileId &&
        session.generation === directory.selection.owner.generation,
    );
    if (current?.packageHash === key) return { kind: "session", row: current };
    const currentRun = runs.find((run) => run.runId === current?.currentRunId);
    if (currentRun) return { kind: "run", row: currentRun };
    const currentInk = inks.find((ink) => ink.runId === current?.currentRunId);
    if (currentInk) return { kind: "ink", row: currentInk };
    const active = (
      await db
        .select()
        .from(schema.courseActivation)
        .where(eq(schema.courseActivation.courseId, productCourseId))
        .all()
    )[0];
    if (active?.activePackageHash === key)
      return { kind: "active", row: active };
    if (active?.fallbackPackageHash === key)
      return { kind: "fallback", row: active };
    const retainedSession = sessions.find(
      (session) => session.packageHash === key,
    );
    if (retainedSession) return { kind: "session", row: retainedSession };
    if (runs[0]) return { kind: "run", row: runs[0] };
    if (inks[0]) return { kind: "ink", row: inks[0] };
    for (const row of await db.select().from(schema.lessonFilesCommand).all()) {
      const saved = await readLessonFilesEvidence(row, hash);
      if (
        saved.command.action.kind === "download" &&
        saved.downloadState === "pending" &&
        saved.receipt.kind === "ready" &&
        saved.receipt.packageHash === key
      )
        return { kind: "pending", row };
    }
  }
  async function sameRepairAnchor(
    anchor: RepairAnchor,
    key: PackageHash,
  ): Promise<boolean> {
    if (anchor.kind === "active" || anchor.kind === "fallback") {
      const row = (
        await db
          .select()
          .from(schema.courseActivation)
          .where(eq(schema.courseActivation.courseId, productCourseId))
          .all()
      )[0];
      return (
        !!row &&
        (anchor.kind === "active"
          ? row.activePackageHash
          : row.fallbackPackageHash) === key &&
        repairCanonical(row) === repairCanonical(anchor.row)
      );
    }
    if (anchor.kind === "pending") {
      const row = (
        await db
          .select()
          .from(schema.lessonFilesCommand)
          .where(
            and(
              eq(
                schema.lessonFilesCommand.installationId,
                anchor.row.installationId,
              ),
              eq(schema.lessonFilesCommand.commandId, anchor.row.commandId),
            ),
          )
          .all()
      )[0];
      if (!row || repairCanonical(row) !== repairCanonical(anchor.row))
        return false;
      const saved = await readLessonFilesEvidence(row, hash);
      return (
        saved.downloadState === "pending" &&
        saved.receipt.kind === "ready" &&
        saved.receipt.packageHash === key
      );
    }
    const profiles = await db.select().from(schema.profile).all();
    if (
      !profiles.some(
        (profile) =>
          profile.id === anchor.row.profileId &&
          profile.generation === anchor.row.generation,
      )
    )
      return false;
    const row =
      anchor.kind === "session"
        ? (
            await db
              .select()
              .from(schema.session)
              .where(eq(schema.session.sessionId, anchor.row.sessionId))
              .all()
          )[0]
        : anchor.kind === "run"
          ? (
              await db
                .select()
                .from(schema.taskRun)
                .where(eq(schema.taskRun.runId, anchor.row.runId))
                .all()
            )[0]
          : (
              await db
                .select()
                .from(schema.inkDocument)
                .where(eq(schema.inkDocument.documentId, anchor.row.documentId))
                .all()
            )[0];
    if (
      !row ||
      row.packageHash !== key ||
      row.courseId !== productCourseId ||
      repairCanonical(row) !== repairCanonical(anchor.row)
    )
      return false;
    if (anchor.kind === "session") return true;
    const run =
      anchor.kind === "run"
        ? anchor.row
        : (
            await db
              .select()
              .from(schema.taskRun)
              .where(eq(schema.taskRun.runId, anchor.row.runId))
              .all()
          )[0];
    if (
      !run ||
      run.packageHash !== key ||
      run.profileId !== anchor.row.profileId ||
      run.generation !== anchor.row.generation ||
      run.courseId !== productCourseId
    )
      return false;
    const session = (
      await db
        .select()
        .from(schema.session)
        .where(eq(schema.session.sessionId, run.sessionId))
        .all()
    )[0];
    return (
      !!session &&
      session.profileId === run.profileId &&
      session.generation === run.generation &&
      session.courseId === run.courseId &&
      (anchor.kind !== "ink" ||
        (run.lessonId === anchor.row.lessonId &&
          run.taskId === anchor.row.taskId))
    );
  }
  async function publicationOperation(
    input: PublicationSelection,
    acquire: boolean,
  ): Promise<PublicationCheck> {
    const target = parsePublicationSelection(input);
    if (!installed || !availability) return { kind: "notAuthorized", target };
    try {
      const captured = await exclusive(async () => {
        checkLease();
        await ensureInitialized();
        checkLease();
        const installation = (
          await db.select().from(schema.installation).all()
        )[0];
        if (installation?.id !== target.installationId) return;
        await warmPackages();
        const material = signedMaterials.get(target.packageHash);
        if (!material)
          throw new InstalledContentUnavailableError(target.packageHash);
        if (material.teaching.body.courseId !== productCourseId) return;
        const anchor = await repairAnchor(target.packageHash);
        if (!anchor) return;
        return {
          anchor,
          witness: await scopeWitness(target.packageHash),
          envelope: Uint8Array.from(material.envelope),
          curriculum: Uint8Array.from(material.curriculum),
          preparation: Uint8Array.from(material.preparationBytes),
          teaching: material.teaching,
        };
      });
      if (!captured) return { kind: "notAuthorized", target };
      checkLease();
      const raw = acquire
        ? await availability.acquire(captured.teaching.identity.hash)
        : captured.envelope;
      return await availability.withVerified(raw, async (material, lease) => {
        requireInstallationLease(lease);
        if (
          material.teaching.key !== target.packageHash ||
          material.teaching.identity.hash !== captured.teaching.identity.hash ||
          !equalBytes(material.envelope, captured.envelope) ||
          !equalBytes(material.curriculum, captured.curriculum) ||
          !equalBytes(material.preparationBytes, captured.preparation)
        )
          return { kind: "staleTarget", target };
        resourceScopes.set(lease, {
          key: target.packageHash,
          witness: captured.witness,
        });
        try {
          return await exclusive(async () => {
            checkLease(lease);
            const installation = (
              await db.select().from(schema.installation).all()
            )[0];
            if (installation?.id !== target.installationId)
              return { kind: "staleTarget", target };
            await warmPackages();
            const retained = signedMaterials.get(target.packageHash);
            if (
              !retained ||
              !equalBytes(retained.envelope, captured.envelope) ||
              !equalBytes(retained.curriculum, captured.curriculum) ||
              !equalBytes(retained.preparationBytes, captured.preparation) ||
              (await scopeWitness(target.packageHash)) !== captured.witness ||
              !(await sameRepairAnchor(captured.anchor, target.packageHash))
            )
              return { kind: "staleTarget", target };
            await validateScope(lease);
            if (acquire)
              await guardedTransaction(lease, async () => {
                if (
                  (await registerSignedPackage({
                    db,
                    material,
                    mode: installed.mode,
                  })) !== "registered"
                )
                  throw new Error(
                    "Exact repaired package registration conflicts",
                  );
              });
            checkLease(lease);
            packageCatalog?.observedVerified(target.packageHash);
            return { kind: "verified", target };
          });
        } finally {
          resourceScopes.delete(lease);
        }
      });
    } catch (error) {
      const reason = resourceReason(error);
      if (reason) {
        packageCatalog?.invalidate(target.packageHash, reason);
        return { kind: "unavailable", target, reason };
      }
      throw error;
    }
  }
  const installation = installed
    ? createInitialInstallation({
        db,
        executor,
        hash,
        options: installed,
        exclusive,
        initialize: ensureInitialized,
        canActivate: ready,
        refresh: warmPackages,
      })
    : undefined;
  const packageCatalog = installed
    ? createPackageCatalog({
        db,
        executor,
        hash,
        options: installed,
        exclusive,
        initialize: ensureInitialized,
        refresh: warmPackages,
        pinned,
        validateRetained: () => admitReadOnly(DATABASE_VERSION),
      })
    : undefined;
  return {
    readLessonFiles: async () => {
      if (!packageCatalog)
        throw new Error("Lesson-file updates require installed mode");
      return packageCatalog.readLessonFiles();
    },
    changeLessonFiles: async (command) => {
      if (!packageCatalog)
        throw new Error("Lesson-file updates require installed mode");
      return packageCatalog.changeLessonFiles(command);
    },
    checkPublication: (target) => publicationOperation(target, false),
    repairPublication: (target) => publicationOperation(target, true),
    parentMaterial: async (input) => {
      const request = parseParentMaterialRequest(input);
      try {
        return await withFreshExact(
          request.packageHash,
          async (material, lease) =>
            exclusive(async () => {
              await validateScope(lease);
              await ensurePackage(material.teaching);
              if (request.kind === "preparation")
                return {
                  kind: "preparation",
                  packageHash: material.teaching.key,
                  document: material.preparation,
                };
              const lesson = resolvedLessons(material.teaching.document)[0];
              const task = lesson?.tasks[0];
              if (!task) throw new Error("First source task is unavailable");
              return {
                kind: "firstTaskPreview",
                packageHash: material.teaching.key,
                task,
              };
            }),
        );
      } catch (error) {
        const failure = resourceReason(error);
        if (!failure) throw error;
        return {
          kind: "unavailable",
          packageHash: request.packageHash,
          failure,
        };
      }
    },
    initialInstall: async (command) => {
      if (!installation)
        throw new Error(
          "Signed installation is unavailable in development mode",
        );
      return installation.initialInstall(command);
    },
    installations: async () => {
      if (!installation)
        throw new Error(
          "Signed installation is unavailable in development mode",
        );
      return installation.installations();
    },
    execute: async (input) => {
      if (!installed) return queuedexecute(input);
      const operation = parseSelectedOperation(input);
      const replay = await exclusive(async () => {
        await ensureInitialized();
        const selection = (await profileDirectory.read()).selection;
        if (operation.kind === "teaching") {
          const result = await resolveTeachingReceipt(operation.command);
          return result
            ? { kind: "teaching" as const, selection, result }
            : null;
        }
        const result = await ink.resolveRetained(operation.command);
        return result ? { kind: "ink" as const, selection, result } : null;
      });
      if (replay) return replay;
      const key =
        operation.kind === "teaching"
          ? operation.command.payload.packageHash
          : operation.command.token.packageHash;
      return withFreshExact(key, (_material, lease) =>
        queuedexecute(input, lease),
      );
    },
    recordDiagnostic: (event) =>
      exclusive(async () => {
        const previous = await diagnostics();
        const ring = appendDiagnostic(previous.ring, event);
        try {
          await ensureInitialized();
          await transaction(executor, async () => {
            await db
              .insert(schema.localDiagnostics)
              .values({ singleton: 1, payload: canonical(ring) })
              .onConflictDoUpdate({
                target: schema.localDiagnostics.singleton,
                set: { payload: canonical(ring) },
              })
              .run();
          });
          diagnosticMemory = ring;
          diagnosticDurable = true;
          return { persistence: "durable", ring };
        } catch {
          diagnosticDurable = false;
          diagnosticMemory = ring;
          return { persistence: "memoryOnly", ring };
        }
      }),
    readDiagnostics: () => exclusive(diagnostics),
    readDirectory: async () => {
      await packageCatalog?.prepareAdmission();
      return exclusive(discoverDirectory);
    },
    readDeparture: async (input) => {
      if (!installed) return queuedreadDeparture(input);
      return withFreshCursor(input.selection, (_material, lease) =>
        queuedreadDeparture(input, lease),
      );
    },
    administer: async (input) => {
      if (!installed) return queuedadminister(input);
      const command = parseProfileAdministrationCommand(input);
      const replay = await exclusive(async () => {
        await ensureInitialized();
        if (
          (await hash(profileAdministrationPreimage(command))) !==
          command.payloadHash
        )
          return rejectOperation(
            "payload-hash",
            "The profile command payload changed.",
          );
        return profileDirectory.resolveRetained({
          command,
          directory: await profileDirectory.read(),
        });
      });
      if (replay) return replay;
      const key = await activeKey();
      return withFreshExact(key, (_material, lease) =>
        queuedadminister(input, lease),
      );
    },
    readApplication: async (input) => {
      if (!installed) return queuedreadApplication(input);
      const run = (
        _material: SignedInstallMaterial,
        lease: InstallationLease,
      ) => queuedreadApplication(input, lease);
      return input.target.kind === "accepted"
        ? withFreshExact(input.target.receipt.packageHash, run)
        : withFreshCursor(input.selection, run);
    },
    readWork: async (input) => {
      if (!installed) return queuedreadWork(input);
      const key = await exclusive(async () => {
        await ensureInitialized();
        const run = (
          await db
            .select()
            .from(schema.taskRunV6)
            .where(
              eq(
                schema.taskRunV6.runId,
                parseId({ kind: "run", value: input.runId }),
              ),
            )
            .all()
        )[0];
        if (!run) throw new Error("Historical work is unavailable");
        return run.packageHash;
      });
      return withFreshExact(key, (_material, lease) =>
        queuedreadWork(input, lease),
      );
    },
    readPracticeControls: async (input) => {
      if (!installed) return queuedreadPracticeControls(input);
      const binding = parsePracticeControlsBinding(input.binding);
      return withFreshExact(binding.packageHash, (_material, lease) =>
        queuedreadPracticeControls(input, lease),
      );
    },
    readStorageCleanup: (input) =>
      exclusive(async () => {
        await validateScope();
        await ensureInitialized();
        return storageCleanup.read(await requireSelection(input.selection));
      }),
    cleanupStorage: (command) =>
      exclusive(async () => {
        await validateScope();
        await ensureInitialized();
        return guardedTransaction(undefined, async () =>
          storageCleanup.execute(
            command,
            await requireSelection(command.selection),
          ),
        );
      }),
    readInk: async (input) => {
      if (!installed) return queuedreadInk(input);
      return withFreshExact(input.token.packageHash, (_material, lease) =>
        queuedreadInk(input, lease),
      );
    },
    openRecovery: async (input) => {
      await packageCatalog?.prepareAdmission();
      return exclusive(async () => {
        const opening = parseSelectedRecoveryOpening(input);
        await ensureInitialized();
        if (
          recovery.kind === "administrationSettled" &&
          opening.kind === "warm"
        ) {
          if (
            !opening.administration ||
            opening.administration.commandId !== recovery.receipt.commandId ||
            opening.administration.payloadHash !==
              recovery.receipt.payloadHash ||
            opening.administration.scope.installationId !==
              recovery.receipt.administration.installationId
          )
            throw new Error(
              "Settled administrative recovery declaration changed",
            );
          return parseSelectedRecoveryInventory({
            kind: "closed",
            recoveryId: recovery.id,
            captures: await ink.inventory(),
            directory: await profileDirectory.read(),
          });
        }
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
      });
    },
    recoverInk: async (input) => {
      if (!installed) return queuedrecoverInk(input);
      const operation = parseSelectedOperation(input.operation);
      if (operation.kind !== "ink") throw new Error("Wrong recovery protocol");
      const replay = await exclusive(async () => {
        await ensureInitialized();
        return ink.resolveRetained(operation.command);
      });
      if (replay) return queuedrecoverInk(input);
      return withFreshExact(
        operation.command.token.packageHash,
        (_material, lease) => queuedrecoverInk(input, lease),
      );
    },
    recoverTeaching: async (input) => {
      if (!installed) return queuedrecoverTeaching(input);
      const operation = parseSelectedOperation(input.operation);
      if (operation.kind !== "teaching")
        throw new Error("Wrong recovery protocol");
      const replay = await exclusive(async () => {
        await ensureInitialized();
        return resolveTeachingReceipt(operation.command);
      });
      if (replay) return queuedrecoverTeaching(input);
      return withFreshExact(
        operation.command.payload.packageHash,
        (_material, lease) => queuedrecoverTeaching(input, lease),
      );
    },
    recoverAdministration: async (input) => {
      if (!installed) return queuedrecoverAdministration(input);
      const command = parseProfileAdministrationCommand(input.command);
      const replay = await exclusive(async () => {
        await ensureInitialized();
        if (
          (await hash(profileAdministrationPreimage(command))) !==
          command.payloadHash
        )
          return rejectOperation("payload-hash", "Profile payload changed.");
        return profileDirectory.resolveRetained({
          command,
          directory: await profileDirectory.read(),
        });
      });
      if (replay) return queuedrecoverAdministration(input);
      return withFreshExact(await activeKey(), (_material, lease) =>
        queuedrecoverAdministration(input, lease),
      );
    },
    reconcileRecovery: (input) =>
      exclusive(async () => {
        checkLease();
        const choice = parseRecoveryChoice(input.choice);
        const active = recovery;
        if (
          active.kind === "administrationSettled" &&
          active.id === input.recoveryId &&
          choice.kind === "warm"
        ) {
          await guardedTransaction(undefined, async () => {
            await ink.recoverOrphans();
            await ink.fenceAll();
          });
          recovery = { kind: "ready" };
          return profileDirectory.read();
        }
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
        await guardedTransaction(undefined, async () => {
          await ink.recoverOrphans();
          await ink.fenceAll();
        });
        recovery = { kind: "ready" };
        return profileDirectory.read();
      }),
  };
}
