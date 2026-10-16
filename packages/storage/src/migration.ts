import type { HashFunction } from "../../teaching/src/index.ts";
import type { SqlExecutor } from "./executor.ts";
export const DATABASE_VERSION = 1;
const nonnegative = (field: string) =>
  `CHECK(typeof(${field})='integer' AND ${field}>=0)`;
const hash = (field: string) =>
  `CHECK(length(${field})=64 AND ${field} NOT GLOB '*[^a-f0-9]*')`;
export const migrationStatements = [
  `CREATE TABLE schema_migration (version INTEGER PRIMARY KEY CHECK(version>0), migration_id TEXT NOT NULL UNIQUE, checksum TEXT NOT NULL ${hash("checksum")})`,
  `CREATE TABLE installation (installation_id TEXT PRIMARY KEY NOT NULL, revision INTEGER NOT NULL ${nonnegative("revision")}, database_version INTEGER NOT NULL CHECK(database_version>0), singleton INTEGER NOT NULL UNIQUE CHECK(singleton=1))`,
  `CREATE TABLE profile (profile_id TEXT PRIMARY KEY NOT NULL, generation INTEGER NOT NULL ${nonnegative("generation")}, revision INTEGER NOT NULL ${nonnegative("revision")}, undo_run_id TEXT, preferences_version INTEGER NOT NULL CHECK(preferences_version=1), preferences TEXT NOT NULL CHECK(json_valid(preferences)), UNIQUE(profile_id,generation), FOREIGN KEY(undo_run_id,profile_id,generation) REFERENCES task_run(run_id,profile_id,generation) DEFERRABLE INITIALLY DEFERRED)`,
  `CREATE TABLE installed_package (package_hash TEXT PRIMARY KEY NOT NULL ${hash("package_hash")}, course_id TEXT NOT NULL, release_id TEXT NOT NULL, content_schema_version INTEGER NOT NULL CHECK(content_schema_version=1), capabilities TEXT NOT NULL CHECK(json_valid(capabilities)), manifest_version INTEGER NOT NULL CHECK(manifest_version=1), verified_manifest BLOB NOT NULL CHECK(typeof(verified_manifest)='blob'), state TEXT NOT NULL CHECK(state IN ('staged','ready','missing','metadataOnly')), storage_key TEXT, UNIQUE(course_id,release_id), UNIQUE(package_hash,course_id), CHECK((state='ready' AND storage_key IS NOT NULL) OR (state='metadataOnly' AND storage_key IS NULL) OR state IN ('staged','missing')))`,
  `CREATE TABLE course_activation (course_id TEXT PRIMARY KEY NOT NULL, active_package_hash TEXT NOT NULL, fallback_package_hash TEXT, revision INTEGER NOT NULL ${nonnegative("revision")}, FOREIGN KEY(active_package_hash,course_id) REFERENCES installed_package(package_hash,course_id), FOREIGN KEY(fallback_package_hash,course_id) REFERENCES installed_package(package_hash,course_id))`,
  `CREATE TABLE course_cursor (profile_id TEXT NOT NULL, generation INTEGER NOT NULL ${nonnegative("generation")}, course_id TEXT NOT NULL, resume_session_id TEXT, selection_counter INTEGER NOT NULL ${nonnegative("selection_counter")}, revision INTEGER NOT NULL ${nonnegative("revision")}, PRIMARY KEY(profile_id,generation,course_id), FOREIGN KEY(profile_id,generation) REFERENCES profile(profile_id,generation), FOREIGN KEY(course_id) REFERENCES course_activation(course_id), FOREIGN KEY(resume_session_id,profile_id,generation,course_id) REFERENCES session(session_id,profile_id,generation,course_id) DEFERRABLE INITIALLY DEFERRED)`,
  `CREATE TABLE session (session_id TEXT PRIMARY KEY NOT NULL, profile_id TEXT NOT NULL, generation INTEGER NOT NULL ${nonnegative("generation")}, course_id TEXT NOT NULL, package_hash TEXT NOT NULL, lesson_id TEXT NOT NULL, task_id TEXT NOT NULL, current_run_id TEXT NOT NULL, scope_kind TEXT NOT NULL CHECK(scope_kind IN ('progression','lessonReplay','taskReplay')), scope_target_id TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','paused','closed')), last_selected_seq INTEGER NOT NULL ${nonnegative("last_selected_seq")}, return_session_id TEXT CHECK(return_session_id IS NULL OR return_session_id!=session_id), revision INTEGER NOT NULL ${nonnegative("revision")}, UNIQUE(session_id,profile_id,generation,course_id), UNIQUE(session_id,profile_id,generation,course_id,package_hash,lesson_id), FOREIGN KEY(profile_id,generation) REFERENCES profile(profile_id,generation), FOREIGN KEY(package_hash,course_id) REFERENCES installed_package(package_hash,course_id), FOREIGN KEY(return_session_id,profile_id,generation,course_id) REFERENCES session(session_id,profile_id,generation,course_id) DEFERRABLE INITIALLY DEFERRED, FOREIGN KEY(current_run_id,session_id,profile_id,generation,course_id,package_hash,lesson_id,task_id) REFERENCES task_run(run_id,session_id,profile_id,generation,course_id,package_hash,lesson_id,task_id) DEFERRABLE INITIALLY DEFERRED)`,
  `CREATE TABLE task_run (run_id TEXT PRIMARY KEY NOT NULL, session_id TEXT NOT NULL, profile_id TEXT NOT NULL, generation INTEGER NOT NULL ${nonnegative("generation")}, course_id TEXT NOT NULL, package_hash TEXT NOT NULL, lesson_id TEXT NOT NULL, task_id TEXT NOT NULL, ordinal INTEGER NOT NULL ${nonnegative("ordinal")}, status TEXT NOT NULL CHECK(status IN ('inProgress','completed','skipped','abandoned')), state_version INTEGER NOT NULL CHECK(state_version=1), state TEXT NOT NULL CHECK(json_valid(state)), active_advance_id TEXT, next_advance_seq INTEGER NOT NULL CHECK(typeof(next_advance_seq)='integer' AND next_advance_seq>0), revision INTEGER NOT NULL ${nonnegative("revision")}, UNIQUE(session_id,ordinal), UNIQUE(run_id,profile_id,generation), UNIQUE(run_id,session_id,profile_id,generation,course_id,package_hash,lesson_id,task_id), FOREIGN KEY(session_id,profile_id,generation,course_id,package_hash,lesson_id) REFERENCES session(session_id,profile_id,generation,course_id,package_hash,lesson_id) DEFERRABLE INITIALLY DEFERRED, FOREIGN KEY(active_advance_id,run_id) REFERENCES task_advance(advance_id,run_id) DEFERRABLE INITIALLY DEFERRED)`,
  `CREATE TABLE task_advance (advance_id TEXT PRIMARY KEY NOT NULL, run_id TEXT NOT NULL, profile_id TEXT NOT NULL, generation INTEGER NOT NULL ${nonnegative("generation")}, seq INTEGER NOT NULL CHECK(typeof(seq)='integer' AND seq>0), previous_advance_id TEXT, status TEXT NOT NULL CHECK(status IN ('accepted','withdrawn')), command_id TEXT NOT NULL, payload_hash TEXT NOT NULL ${hash("payload_hash")}, state_version INTEGER NOT NULL CHECK(state_version=1), before_state TEXT NOT NULL CHECK(json_valid(before_state)), after_state TEXT NOT NULL CHECK(json_valid(after_state)), before_run_status TEXT NOT NULL CHECK(before_run_status='inProgress'), after_run_status TEXT NOT NULL CHECK(after_run_status IN ('inProgress','completed','skipped')), accepted_run_revision INTEGER NOT NULL ${nonnegative("accepted_run_revision")}, UNIQUE(run_id,seq), UNIQUE(advance_id,run_id), FOREIGN KEY(run_id,profile_id,generation) REFERENCES task_run(run_id,profile_id,generation), FOREIGN KEY(previous_advance_id,run_id) REFERENCES task_advance(advance_id,run_id) DEFERRABLE INITIALLY DEFERRED)`,
  `CREATE TABLE command_receipt (scope_kind TEXT NOT NULL CHECK(scope_kind IN ('profile','session')), scope_id TEXT NOT NULL, scope_generation INTEGER NOT NULL ${nonnegative("scope_generation")}, command_id TEXT NOT NULL, owner_profile_id TEXT NOT NULL, owner_generation INTEGER NOT NULL ${nonnegative("owner_generation")}, expected_revision INTEGER NOT NULL ${nonnegative("expected_revision")}, resulting_revision INTEGER NOT NULL ${nonnegative("resulting_revision")}, payload_hash TEXT NOT NULL ${hash("payload_hash")}, result_version INTEGER NOT NULL CHECK(result_version=1), result TEXT NOT NULL CHECK(json_valid(result)), PRIMARY KEY(scope_kind,scope_id,scope_generation,command_id), FOREIGN KEY(owner_profile_id,owner_generation) REFERENCES profile(profile_id,generation), CHECK(scope_generation=owner_generation))`,
  `CREATE UNIQUE INDEX session_one_active ON session(profile_id,generation,course_id) WHERE status='active'`,
  `CREATE UNIQUE INDEX session_one_live_scope ON session(profile_id,generation,course_id,scope_kind,scope_target_id) WHERE status IN ('active','paused')`,
  `CREATE INDEX session_owner_selection ON session(profile_id,generation,course_id,status,last_selected_seq)`,
  `CREATE INDEX task_advance_chain ON task_advance(run_id,seq,status)`,
  `CREATE INDEX receipt_owner_revision ON command_receipt(owner_profile_id,owner_generation,scope_kind,scope_id,resulting_revision)`,
  `CREATE INDEX session_package ON session(package_hash)`,
  `CREATE INDEX run_package ON task_run(package_hash)`,
] as const;
export async function transaction<T>(
  executor: SqlExecutor,
  work: () => Promise<T>,
): Promise<T> {
  await executor.execute("BEGIN IMMEDIATE", []);
  try {
    const result = await work();
    await executor.execute("COMMIT", []);
    return result;
  } catch (error) {
    try {
      await executor.execute("ROLLBACK", []);
    } catch {
      /* COMMIT may already have succeeded; preserve uncertain acknowledgement. */
    }
    throw error;
  }
}
function firstValue(rows: unknown[][]): unknown {
  return rows[0]?.[0];
}
function normalize(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().replace(/;$/, "");
}
export async function initializeDatabase(
  executor: SqlExecutor,
  hashFunction: HashFunction,
): Promise<void> {
  await executor.execute("PRAGMA foreign_keys=ON", []);
  const foreignKeys = firstValue(
    (await executor.execute("PRAGMA foreign_keys", [])).rows,
  );
  if (foreignKeys !== 1 && foreignKeys !== 1n)
    throw new Error("SQLite foreign key enforcement is unavailable");
  const journal = firstValue(
    (await executor.execute("PRAGMA journal_mode", [])).rows,
  );
  const synchronous = firstValue(
    (await executor.execute("PRAGMA synchronous", [])).rows,
  );
  if (journal !== "delete" || (synchronous !== 2 && synchronous !== 2n))
    throw new Error("SQLite requires DELETE journal and FULL synchronization");
  const version = firstValue(
    (await executor.execute("PRAGMA user_version", [])).rows,
  );
  if (
    version !== 0 &&
    version !== 0n &&
    version !== DATABASE_VERSION &&
    version !== BigInt(DATABASE_VERSION)
  )
    throw new Error(
      "Unsupported database version; update or recover this installation",
    );
  const checksum = await hashFunction(migrationStatements.join("\n"));
  if (version === 0 || version === 0n) {
    const tables = (
      await executor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        [],
      )
    ).rows;
    if (tables.length > 0)
      throw new Error("Unversioned database already has application tables");
    await transaction(executor, async () => {
      for (const statement of migrationStatements)
        await executor.execute(statement, []);
      await executor.execute(
        "INSERT INTO schema_migration(version,migration_id,checksum) VALUES(?,?,?)",
        [DATABASE_VERSION, "issue-02-initial", checksum],
      );
      await executor.execute(`PRAGMA user_version=${DATABASE_VERSION}`, []);
    });
  }
  const ledger = (
    await executor.execute(
      "SELECT version,migration_id,checksum FROM schema_migration ORDER BY version",
      [],
    )
  ).rows;
  if (
    ledger.length !== 1 ||
    (ledger[0]?.[0] !== 1 && ledger[0]?.[0] !== 1n) ||
    ledger[0]?.[1] !== "issue-02-initial" ||
    ledger[0]?.[2] !== checksum
  )
    throw new Error("Database migration checksum mismatch");
  for (const statement of migrationStatements) {
    const match = /^CREATE (?:UNIQUE )?(?:TABLE|INDEX) ([a-z_]+)/.exec(
      statement,
    );
    const name = match?.[1];
    if (!name) throw new Error("Invalid bundled migration");
    const actual = firstValue(
      (
        await executor.execute("SELECT sql FROM sqlite_master WHERE name=?", [
          name,
        ])
      ).rows,
    );
    if (
      typeof actual !== "string" ||
      normalize(actual) !== normalize(statement)
    )
      throw new Error("Database schema does not match its migration");
  }
  if ((await executor.execute("PRAGMA foreign_key_check", [])).rows.length > 0)
    throw new Error("Database ownership graph is corrupt");
}
