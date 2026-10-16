import {
  customType,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
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
export const installation = sqliteTable("installation", {
  id: text("installation_id").primaryKey(),
  revision: counter("revision").notNull(),
  databaseVersion: integer("database_version").notNull(),
  singleton: integer("singleton").notNull(),
});
export const profile = sqliteTable("profile", {
  id: text("profile_id").primaryKey(),
  generation: counter("generation").notNull(),
  revision: counter("revision").notNull(),
  undoRunId: text("undo_run_id"),
  preferencesVersion: integer("preferences_version").notNull(),
  preferences: text("preferences").notNull(),
});
export const installedPackage = sqliteTable("installed_package", {
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
});
export const courseActivation = sqliteTable("course_activation", {
  courseId: text("course_id").primaryKey(),
  activePackageHash: text("active_package_hash").notNull(),
  fallbackPackageHash: text("fallback_package_hash"),
  revision: counter("revision").notNull(),
});
export const courseCursor = sqliteTable("course_cursor", {
  profileId: text("profile_id").notNull(),
  generation: counter("generation").notNull(),
  courseId: text("course_id").notNull(),
  resumeSessionId: text("resume_session_id"),
  selectionCounter: counter("selection_counter").notNull(),
  revision: counter("revision").notNull(),
});
export const session = sqliteTable("session", {
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
});
export const taskRun = sqliteTable("task_run", {
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
});
export const taskAdvance = sqliteTable("task_advance", {
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
});
export const commandReceipt = sqliteTable("command_receipt", {
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
});
