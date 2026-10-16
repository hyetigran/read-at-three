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
import type { Counter } from "../../teaching/src/index.ts";
import { parseCounter } from "../../teaching/src/index.ts";
import { readCounter } from "./executor.ts";
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
    migrationId: text("migration_id").notNull(),
    checksum: text("checksum").notNull(),
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
    id: text("installation_id").primaryKey(),
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
    id: text("profile_id").primaryKey(),
    generation: counter("generation").notNull(),
    revision: counter("revision").notNull(),
    undoRunId: text("undo_run_id"),
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
    packageHash: text("package_hash").primaryKey(),
    courseId: text("course_id").notNull(),
    releaseId: text("release_id").notNull(),
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
    courseId: text("course_id").primaryKey(),
    activePackageHash: text("active_package_hash").notNull(),
    fallbackPackageHash: text("fallback_package_hash"),
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
    profileId: text("profile_id").notNull(),
    generation: counter("generation").notNull(),
    courseId: text("course_id").notNull(),
    resumeSessionId: text("resume_session_id"),
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
    sessionId: text("session_id").primaryKey(),
    profileId: text("profile_id").notNull(),
    generation: counter("generation").notNull(),
    courseId: text("course_id").notNull(),
    packageHash: text("package_hash").notNull(),
    lessonId: text("lesson_id").notNull(),
    taskId: text("task_id").notNull(),
    currentRunId: text("current_run_id").notNull(),
    scopeKind: text("scope_kind", {
      enum: ["progression", "lessonReplay", "taskReplay"],
    }).notNull(),
    scopeTargetId: text("scope_target_id").notNull(),
    status: text("status", { enum: ["active", "paused", "closed"] }).notNull(),
    lastSelectedSeq: counter("last_selected_seq").notNull(),
    returnSessionId: text("return_session_id"),
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
    runId: text("run_id").primaryKey(),
    sessionId: text("session_id").notNull(),
    profileId: text("profile_id").notNull(),
    generation: counter("generation").notNull(),
    courseId: text("course_id").notNull(),
    packageHash: text("package_hash").notNull(),
    lessonId: text("lesson_id").notNull(),
    taskId: text("task_id").notNull(),
    ordinal: counter("ordinal").notNull(),
    status: text("status", {
      enum: ["inProgress", "completed", "skipped", "abandoned"],
    }).notNull(),
    stateVersion: integer("state_version").notNull(),
    state: text("state").notNull(),
    activeAdvanceId: text("active_advance_id"),
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
    advanceId: text("advance_id").primaryKey(),
    runId: text("run_id").notNull(),
    profileId: text("profile_id").notNull(),
    generation: counter("generation").notNull(),
    seq: counter("seq").notNull(),
    previousAdvanceId: text("previous_advance_id"),
    status: text("status", { enum: ["accepted", "withdrawn"] }).notNull(),
    commandId: text("command_id").notNull(),
    payloadHash: text("payload_hash").notNull(),
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
    scopeId: text("scope_id").notNull(),
    scopeGeneration: counter("scope_generation").notNull(),
    commandId: text("command_id").notNull(),
    ownerProfileId: text("owner_profile_id").notNull(),
    ownerGeneration: counter("owner_generation").notNull(),
    expectedRevision: counter("expected_revision").notNull(),
    resultingRevision: counter("resulting_revision").notNull(),
    payloadHash: text("payload_hash").notNull(),
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
