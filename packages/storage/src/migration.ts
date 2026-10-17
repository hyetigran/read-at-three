import type { HashFunction } from "../../teaching/src/index.ts";
import type { SqlExecutor } from "./executor.ts";
import { migrations } from "./generated-migration.ts";
export { migrationStatements } from "./generated-migration.ts";
export const DATABASE_VERSION = 11;
export type MigrationDataHook = (
  version: number,
) => Promise<(() => Promise<void>) | undefined>;
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
  prepareData?: MigrationDataHook,
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
  const rawVersion = firstValue(
    (await executor.execute("PRAGMA user_version", [])).rows,
  );
  const version =
    typeof rawVersion === "bigint" ? Number(rawVersion) : rawVersion;
  if (
    typeof version !== "number" ||
    !Number.isSafeInteger(version) ||
    version < 0 ||
    version > DATABASE_VERSION
  )
    throw new Error(
      "Unsupported database version; update or recover this installation",
    );
  const checksums = await Promise.all(
    migrations.map((migration) =>
      hashFunction(migration.statements.join("\n")),
    ),
  );
  async function verify(appliedVersion: number): Promise<void> {
    if (appliedVersion === 0) {
      const tables = (
        await executor.execute(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
          [],
        )
      ).rows;
      if (tables.length)
        throw new Error("Unversioned database already has application tables");
      return;
    }
    const ledger = (
      await executor.execute(
        "SELECT version,migration_id,checksum FROM schema_migration ORDER BY version",
        [],
      )
    ).rows;
    if (ledger.length !== appliedVersion)
      throw new Error("Database migration ledger is incomplete");
    for (const migration of migrations.slice(0, appliedVersion)) {
      const row = ledger[migration.version - 1];
      if (
        !row ||
        BigInt(String(row[0])) !== BigInt(migration.version) ||
        row[1] !== migration.id ||
        row[2] !== checksums[migration.version - 1]
      )
        throw new Error("Database migration checksum mismatch");
      for (const original of migration.statements) {
        const replacement =
          appliedVersion >= 9 && original.startsWith("CREATE ")
            ? migrations[8]?.statements.find((candidate) => {
                const name =
                  /^CREATE (?:UNIQUE )?(?:TABLE|INDEX) [`"]?([a-z_]+)/.exec(
                    original,
                  )?.[1];
                return (
                  name &&
                  candidate.startsWith("CREATE ") &&
                  /^CREATE (?:UNIQUE )?(?:TABLE|INDEX) [`"]?([a-z_]+)/.exec(
                    candidate,
                  )?.[1] === name
                );
              })
            : undefined;
        const packageCreate =
          /^CREATE TABLE installed_package(?:_v10|_v11)? /.test(original);
        const statement =
          packageCreate && appliedVersion >= 10
            ? original
                .replace(
                  /^CREATE TABLE installed_package(?:_v10|_v11)? /,
                  'CREATE TABLE "installed_package" ',
                )
                .replace(
                  /CHECK\(content_schema_version(?:=1| IN \(1,2\)| IN \(1,2,3\))\)/,
                  appliedVersion >= 11
                    ? "CHECK(content_schema_version IN (1,2,3))"
                    : "CHECK(content_schema_version IN (1,2))",
                )
            : (replacement ?? original);
        if (!statement.startsWith("CREATE ")) continue;
        const name = /^CREATE (?:UNIQUE )?(?:TABLE|INDEX) [`"]?([a-z_]+)/.exec(
          statement,
        )?.[1];
        if (!name) throw new Error("Invalid bundled schema migration");
        const actual = firstValue(
          (
            await executor.execute(
              "SELECT sql FROM sqlite_master WHERE name=?",
              [name],
            )
          ).rows,
        );
        if (
          typeof actual !== "string" ||
          normalize(actual) !==
            normalize(
              appliedVersion >= 4 && name === "command_receipt"
                ? statement.replace(
                    "('profile','session')",
                    "('profile','session','document')",
                  )
                : appliedVersion >= 3 && name === "task_advance"
                  ? statement.replace(
                      ", UNIQUE(run_id,seq)",
                      ", `accepting_command` text, UNIQUE(run_id,seq)",
                    )
                  : appliedVersion >= 7 && name === "task_run"
                    ? statement.replace(
                        ", UNIQUE(session_id,ordinal)",
                        ", legacy_acceptance_seq_limit INTEGER NOT NULL DEFAULT 0 CHECK(typeof(legacy_acceptance_seq_limit)='integer' AND legacy_acceptance_seq_limit>=0), UNIQUE(session_id,ordinal)",
                      )
                    : statement,
            )
        )
          throw new Error("Database schema does not match its migration");
      }
    }
    if ((await executor.execute("PRAGMA foreign_key_check", [])).rows.length)
      throw new Error("Database ownership graph is corrupt");
  }
  await verify(version);
  for (const migration of migrations.slice(version)) {
    const checksum = checksums[migration.version - 1];
    if (!checksum) throw new Error("Migration checksum is missing");
    const migrateData = await prepareData?.(migration.version);
    const rebuildParent =
      "foreignKeys" in migration && migration.foreignKeys === "rebuild";
    try {
      if (rebuildParent) {
        await executor.execute("PRAGMA foreign_keys=OFF", []);
        const disabled = firstValue(
          (await executor.execute("PRAGMA foreign_keys", [])).rows,
        );
        if (disabled !== 0 && disabled !== 0n)
          throw new Error("Cannot enter isolated parent table migration");
      }
      await transaction(executor, async () => {
        for (const statement of migration.statements)
          await executor.execute(statement, []);
        await migrateData?.();
        await executor.execute(
          "INSERT INTO schema_migration(version,migration_id,checksum) VALUES(?,?,?)",
          [migration.version, migration.id, checksum],
        );
        if (
          (await executor.execute("PRAGMA foreign_key_check", [])).rows.length
        )
          throw new Error("Migration violated the ownership graph");
        await executor.execute(`PRAGMA user_version=${migration.version}`, []);
      });
    } finally {
      if (rebuildParent) {
        await executor.execute("PRAGMA foreign_keys=ON", []);
        const enabled = firstValue(
          (await executor.execute("PRAGMA foreign_keys", [])).rows,
        );
        if (enabled !== 1 && enabled !== 1n)
          throw new Error("Cannot restore SQLite foreign key enforcement");
      }
    }
    await verify(migration.version);
  }
}
