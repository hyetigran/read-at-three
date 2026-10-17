import {
  check,
  customType,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import type {
  Counter,
  Id,
  IdKind,
  Hash,
  HashKind,
} from "../../teaching/src/index.ts";
import { parseCounter, parseId, parseHash } from "../../teaching/src/index.ts";
import { readCounter } from "./executor.ts";
const identity = <Kind extends IdKind>(kind: Kind) =>
  customType<{ data: Id<Kind>; driverData: string }>({
    dataType: () => "text",
    toDriver: (value) => value,
    fromDriver: (value) => parseId({ kind, value }),
  });
const hashed = <Kind extends HashKind>(kind: Kind) =>
  customType<{ data: Hash<Kind>; driverData: string }>({
    dataType: () => "text",
    toDriver: (value) => value,
    fromDriver: (value) => parseHash({ kind, value }),
  });
const profileId = identity("profile");
const sessionId = identity("session");
const runId = identity("run");
const commandId = identity("command");
const advanceId = identity("advance");
const installationId = identity("installation");
const courseId = identity("course");
const releaseId = identity("release");
const lessonId = identity("lesson");
const taskId = identity("task");
const receiptScopeId = identity<"profile" | "session">("profile");
const scopeTargetId = identity<"lesson" | "task">("lesson");
const packageHash = hashed("package");
const payloadHash = hashed("payload");
const migrationId = identity("migration");
const migrationHash = hashed("migration");
const bytes = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType: () => "blob",
  toDriver: (value) => value,
  fromDriver: (value) => {
    if (!(value instanceof Uint8Array))
      throw new Error("Invalid SQLite byte string");
    return value;
  },
});
const counter = customType<{ data: Counter; driverData: bigint }>({
  dataType: () => "integer",
  toDriver: (value) => BigInt(parseCounter(value)),
  fromDriver: readCounter,
});
const nonnegative = (field: string) =>
  check(
    `${field}_nonnegative`,
    sql.raw(`typeof(${field})='integer' AND ${field}>=0`),
  );
const hash = (field: string) =>
  check(
    `${field}_hash`,
    sql.raw(`length(${field})=64 AND ${field} NOT GLOB '*[^a-f0-9]*'`),
  );
export const schemaMigration = sqliteTable(
  "schema_migration",
  {
    version: integer("version").primaryKey(),
    migrationId: migrationId("migration_id").notNull(),
    checksum: migrationHash("checksum").notNull(),
  },
  (table) => [
    check("version_positive", sql`version>0`),
    unique().on(table.migrationId),
    hash("checksum"),
  ],
);
export const installation = sqliteTable(
  "installation",
  {
    id: installationId("installation_id").primaryKey(),
    revision: counter("revision").notNull(),
    databaseVersion: integer("database_version").notNull(),
    singleton: integer("singleton").notNull(),
  },
  (table) => [
    nonnegative("revision"),
    check("database_version_positive", sql`database_version>0`),
    unique().on(table.singleton),
    check("installation_singleton", sql`singleton=1`),
  ],
);
export const profile = sqliteTable(
  "profile",
  {
    id: profileId("profile_id").primaryKey(),
    generation: counter("generation").notNull(),
    revision: counter("revision").notNull(),
    undoRunId: runId("undo_run_id"),
    preferencesVersion: integer("preferences_version").notNull(),
    preferences: text("preferences").notNull(),
  },
  (table) => [
    nonnegative("generation"),
    nonnegative("revision"),
    check("preferences_version_supported", sql`preferences_version=1`),
    check("preferences_json", sql`json_valid(preferences)`),
    unique().on(table.id, table.generation),
  ],
);
export const installedPackage = sqliteTable(
  "installed_package",
  {
    packageHash: packageHash("package_hash").primaryKey(),
    courseId: courseId("course_id").notNull(),
    releaseId: releaseId("release_id").notNull(),
    contentSchemaVersion: integer("content_schema_version").notNull(),
    capabilities: text("capabilities").notNull(),
    manifestVersion: integer("manifest_version").notNull(),
    verifiedManifest: bytes("verified_manifest").notNull(),
    state: text("state", {
      enum: ["staged", "ready", "missing", "metadataOnly"],
    }).notNull(),
    storageKey: text("storage_key"),
  },
  (table) => [
    hash("package_hash"),
    check("content_schema_version_supported", sql`content_schema_version=1`),
    check("capabilities_json", sql`json_valid(capabilities)`),
    check("manifest_version_supported", sql`manifest_version=1`),
    check("verified_manifest_bytes", sql`typeof(verified_manifest)='blob'`),
    check(
      "package_state",
      sql`state IN ('staged','ready','missing','metadataOnly')`,
    ),
    unique().on(table.courseId, table.releaseId),
    unique().on(table.packageHash, table.courseId),
    check(
      "package_storage",
      sql`(state='ready' AND storage_key IS NOT NULL) OR (state='metadataOnly' AND storage_key IS NULL) OR state IN ('staged','missing')`,
    ),
  ],
);
export const courseActivation = sqliteTable(
  "course_activation",
  {
    courseId: courseId("course_id").primaryKey(),
    activePackageHash: packageHash("active_package_hash").notNull(),
    fallbackPackageHash: packageHash("fallback_package_hash"),
    revision: counter("revision").notNull(),
  },
  (table) => [
    nonnegative("revision"),
    foreignKey({
      columns: [table.activePackageHash, table.courseId],
      foreignColumns: [installedPackage.packageHash, installedPackage.courseId],
    }),
    foreignKey({
      columns: [table.fallbackPackageHash, table.courseId],
      foreignColumns: [installedPackage.packageHash, installedPackage.courseId],
    }),
  ],
);
export const courseCursor = sqliteTable(
  "course_cursor",
  {
    profileId: profileId("profile_id").notNull(),
    generation: counter("generation").notNull(),
    courseId: courseId("course_id").notNull(),
    resumeSessionId: sessionId("resume_session_id"),
    selectionCounter: counter("selection_counter").notNull(),
    revision: counter("revision").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.profileId, table.generation, table.courseId],
    }),
    nonnegative("generation"),
    nonnegative("selection_counter"),
    nonnegative("revision"),
    foreignKey({
      columns: [table.profileId, table.generation],
      foreignColumns: [profile.id, profile.generation],
    }),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [courseActivation.courseId],
    }),
  ],
);
export const session = sqliteTable(
  "session",
  {
    sessionId: sessionId("session_id").primaryKey(),
    profileId: profileId("profile_id").notNull(),
    generation: counter("generation").notNull(),
    courseId: courseId("course_id").notNull(),
    packageHash: packageHash("package_hash").notNull(),
    lessonId: lessonId("lesson_id").notNull(),
    taskId: taskId("task_id").notNull(),
    currentRunId: runId("current_run_id").notNull(),
    scopeKind: text("scope_kind", {
      enum: ["progression", "lessonReplay", "taskReplay"],
    }).notNull(),
    scopeTargetId: scopeTargetId("scope_target_id").notNull(),
    status: text("status", { enum: ["active", "paused", "closed"] }).notNull(),
    lastSelectedSeq: counter("last_selected_seq").notNull(),
    returnSessionId: sessionId("return_session_id"),
    revision: counter("revision").notNull(),
  },
  (table) => [
    nonnegative("generation"),
    nonnegative("last_selected_seq"),
    nonnegative("revision"),
    check(
      "session_scope_kind",
      sql`scope_kind IN ('progression','lessonReplay','taskReplay')`,
    ),
    check("session_status", sql`status IN ('active','paused','closed')`),
    check(
      "session_return",
      sql`return_session_id IS NULL OR return_session_id!=session_id`,
    ),
    unique().on(
      table.sessionId,
      table.profileId,
      table.generation,
      table.courseId,
    ),
    unique().on(
      table.sessionId,
      table.profileId,
      table.generation,
      table.courseId,
      table.packageHash,
      table.lessonId,
    ),
    foreignKey({
      columns: [table.profileId, table.generation],
      foreignColumns: [profile.id, profile.generation],
    }),
    foreignKey({
      columns: [table.packageHash, table.courseId],
      foreignColumns: [installedPackage.packageHash, installedPackage.courseId],
    }),
    uniqueIndex("session_one_active")
      .on(table.profileId, table.generation, table.courseId)
      .where(sql`status='active'`),
    uniqueIndex("session_one_live_scope")
      .on(
        table.profileId,
        table.generation,
        table.courseId,
        table.scopeKind,
        table.scopeTargetId,
      )
      .where(sql`status IN ('active','paused')`),
    index("session_owner_selection").on(
      table.profileId,
      table.generation,
      table.courseId,
      table.status,
      table.lastSelectedSeq,
    ),
    index("session_package").on(table.packageHash),
  ],
);
export const taskRun = sqliteTable(
  "task_run",
  {
    runId: runId("run_id").primaryKey(),
    sessionId: sessionId("session_id").notNull(),
    profileId: profileId("profile_id").notNull(),
    generation: counter("generation").notNull(),
    courseId: courseId("course_id").notNull(),
    packageHash: packageHash("package_hash").notNull(),
    lessonId: lessonId("lesson_id").notNull(),
    taskId: taskId("task_id").notNull(),
    ordinal: counter("ordinal").notNull(),
    status: text("status", {
      enum: ["inProgress", "completed", "skipped", "abandoned"],
    }).notNull(),
    stateVersion: integer("state_version").notNull(),
    state: text("state").notNull(),
    activeAdvanceId: advanceId("active_advance_id"),
    nextAdvanceSeq: counter("next_advance_seq").notNull(),
    revision: counter("revision").notNull(),
  },
  (table) => [
    nonnegative("generation"),
    nonnegative("ordinal"),
    nonnegative("revision"),
    check(
      "run_status",
      sql`status IN ('inProgress','completed','skipped','abandoned')`,
    ),
    check("run_state_version", sql`state_version=1`),
    check("run_state_json", sql`json_valid(state)`),
    check(
      "run_next_advance",
      sql`typeof(next_advance_seq)='integer' AND next_advance_seq>0`,
    ),
    unique().on(table.sessionId, table.ordinal),
    unique().on(table.runId, table.profileId, table.generation),
    unique().on(
      table.runId,
      table.sessionId,
      table.profileId,
      table.generation,
      table.courseId,
      table.packageHash,
      table.lessonId,
      table.taskId,
    ),
    index("run_package").on(table.packageHash),
  ],
);
export const taskAdvance = sqliteTable(
  "task_advance",
  {
    advanceId: advanceId("advance_id").primaryKey(),
    runId: runId("run_id").notNull(),
    profileId: profileId("profile_id").notNull(),
    generation: counter("generation").notNull(),
    seq: counter("seq").notNull(),
    previousAdvanceId: advanceId("previous_advance_id"),
    status: text("status", { enum: ["accepted", "withdrawn"] }).notNull(),
    commandId: commandId("command_id").notNull(),
    payloadHash: payloadHash("payload_hash").notNull(),
    stateVersion: integer("state_version").notNull(),
    beforeState: text("before_state").notNull(),
    afterState: text("after_state").notNull(),
    beforeRunStatus: text("before_run_status", {
      enum: ["inProgress"],
    }).notNull(),
    afterRunStatus: text("after_run_status", {
      enum: ["inProgress", "completed", "skipped"],
    }).notNull(),
    acceptedRunRevision: counter("accepted_run_revision").notNull(),
  },
  (table) => [
    nonnegative("generation"),
    nonnegative("accepted_run_revision"),
    check("advance_seq", sql`typeof(seq)='integer' AND seq>0`),
    check("advance_status", sql`status IN ('accepted','withdrawn')`),
    hash("payload_hash"),
    check("advance_state_version", sql`state_version=1`),
    check("advance_before_json", sql`json_valid(before_state)`),
    check("advance_after_json", sql`json_valid(after_state)`),
    check("advance_before_status", sql`before_run_status='inProgress'`),
    check(
      "advance_after_status",
      sql`after_run_status IN ('inProgress','completed','skipped')`,
    ),
    unique().on(table.runId, table.seq),
    unique().on(table.advanceId, table.runId),
    foreignKey({
      columns: [table.runId, table.profileId, table.generation],
      foreignColumns: [taskRun.runId, taskRun.profileId, taskRun.generation],
    }),
    index("task_advance_chain").on(table.runId, table.seq, table.status),
  ],
);
export const commandReceipt = sqliteTable(
  "command_receipt",
  {
    scopeKind: text("scope_kind", { enum: ["profile", "session"] }).notNull(),
    scopeId: receiptScopeId("scope_id").notNull(),
    scopeGeneration: counter("scope_generation").notNull(),
    commandId: commandId("command_id").notNull(),
    ownerProfileId: profileId("owner_profile_id").notNull(),
    ownerGeneration: counter("owner_generation").notNull(),
    expectedRevision: counter("expected_revision").notNull(),
    resultingRevision: counter("resulting_revision").notNull(),
    payloadHash: payloadHash("payload_hash").notNull(),
    resultVersion: integer("result_version").notNull(),
    result: text("result").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.scopeKind,
        table.scopeId,
        table.scopeGeneration,
        table.commandId,
      ],
    }),
    check("receipt_scope", sql`scope_kind IN ('profile','session')`),
    nonnegative("scope_generation"),
    nonnegative("owner_generation"),
    nonnegative("expected_revision"),
    nonnegative("resulting_revision"),
    hash("payload_hash"),
    check("receipt_result_version", sql`result_version=1`),
    check("receipt_result_json", sql`json_valid(result)`),
    foreignKey({
      columns: [table.ownerProfileId, table.ownerGeneration],
      foreignColumns: [profile.id, profile.generation],
    }),
    check("receipt_generation", sql`scope_generation=owner_generation`),
    index("receipt_owner_revision").on(
      table.ownerProfileId,
      table.ownerGeneration,
      table.scopeKind,
      table.scopeId,
      table.resultingRevision,
    ),
  ],
);

const creditId = identity("credit");
export const taskCredit = sqliteTable(
  "task_credit",
  {
    creditId: creditId("credit_id").primaryKey(),
    profileId: profileId("profile_id").notNull(),
    generation: counter("generation").notNull(),
    courseId: courseId("course_id").notNull(),
    lessonId: lessonId("lesson_id").notNull(),
    taskId: taskId("task_id").notNull(),
    sessionId: sessionId("session_id").notNull(),
    runId: runId("run_id").notNull(),
    terminalAdvanceId: advanceId("terminal_advance_id").notNull(),
    packageHash: packageHash("package_hash").notNull(),
    outcome: text("outcome", { enum: ["completed", "skipped"] }).notNull(),
    status: text("status", { enum: ["valid", "withdrawn"] }).notNull(),
    receiptVersion: integer("receipt_version").notNull(),
    receipt: text("receipt").notNull(),
  },
  (table) => [
    nonnegative("generation"),
    hash("package_hash"),
    check("credit_outcome", sql`outcome IN ('completed','skipped')`),
    check("credit_status", sql`status IN ('valid','withdrawn')`),
    check("credit_receipt_version", sql`receipt_version=1`),
    check("credit_receipt_json", sql`json_valid(receipt)`),
    unique().on(table.terminalAdvanceId),
    unique().on(
      table.creditId,
      table.profileId,
      table.generation,
      table.courseId,
      table.lessonId,
      table.taskId,
      table.outcome,
    ),
    foreignKey({
      columns: [
        table.runId,
        table.sessionId,
        table.profileId,
        table.generation,
        table.courseId,
        table.packageHash,
        table.lessonId,
        table.taskId,
      ],
      foreignColumns: [
        taskRun.runId,
        taskRun.sessionId,
        taskRun.profileId,
        taskRun.generation,
        taskRun.courseId,
        taskRun.packageHash,
        taskRun.lessonId,
        taskRun.taskId,
      ],
    }),
    foreignKey({
      columns: [table.terminalAdvanceId, table.runId],
      foreignColumns: [taskAdvance.advanceId, taskAdvance.runId],
    }),
    index("credit_owner_task").on(
      table.profileId,
      table.generation,
      table.courseId,
      table.taskId,
      table.status,
    ),
    index("credit_package").on(table.packageHash),
  ],
);
export const taskResult = sqliteTable(
  "task_result",
  {
    profileId: profileId("profile_id").notNull(),
    generation: counter("generation").notNull(),
    courseId: courseId("course_id").notNull(),
    lessonId: lessonId("lesson_id").notNull(),
    taskId: taskId("task_id").notNull(),
    outcome: text("outcome", { enum: ["completed", "skipped"] }).notNull(),
    acceptedCreditId: creditId("accepted_credit_id").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.profileId,
        table.generation,
        table.courseId,
        table.taskId,
      ],
    }),
    nonnegative("generation"),
    check("result_outcome", sql`outcome IN ('completed','skipped')`),
    foreignKey({
      columns: [
        table.acceptedCreditId,
        table.profileId,
        table.generation,
        table.courseId,
        table.lessonId,
        table.taskId,
        table.outcome,
      ],
      foreignColumns: [
        taskCredit.creditId,
        taskCredit.profileId,
        taskCredit.generation,
        taskCredit.courseId,
        taskCredit.lessonId,
        taskCredit.taskId,
        taskCredit.outcome,
      ],
    }),
    index("result_owner_lesson").on(
      table.profileId,
      table.generation,
      table.courseId,
      table.lessonId,
    ),
  ],
);
