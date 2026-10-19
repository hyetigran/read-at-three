import type { HashFunction } from "../../teaching/src/index.ts";
import type { SqlExecutor } from "./executor.ts";
import { migrations } from "./generated-migration.ts";
import { verifyForeignKeyPolicy } from "./foreign-key-policy.ts";
export { migrationStatements } from "./generated-migration.ts";
export const DATABASE_VERSION = 14;
export type MigrationDataHook = (
  version: number,
) => Promise<(() => Promise<void>) | undefined>;
export async function transaction<T>(
  executor: SqlExecutor,
  work: () => Promise<T>,
  checkCurrent?: () => void,
): Promise<T> {
  checkCurrent?.();
  await executor.execute("BEGIN IMMEDIATE", []);
  try {
    checkCurrent?.();
    const result = await work();
    checkCurrent?.();
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
function expectedObjects(version: number) {
  const objects = new Map<string, { type: string; table: string }>();
  for (const migration of migrations.slice(0, version)) {
    for (const statement of migration.statements) {
      const table = /^CREATE TABLE [`"]?([a-z_0-9]+)/.exec(statement);
      const index =
        /^CREATE (?:UNIQUE )?INDEX [`"]?([a-z_0-9]+)[`"]? ON [`"]?([a-z_0-9]+)/.exec(
          statement,
        );
      const view = /^CREATE VIEW ([a-z_]+) AS /.exec(statement);
      const trigger =
        /^CREATE TRIGGER ([a-z_]+) AFTER (?:INSERT|UPDATE) ON "([a-z_]+)" /.exec(
          statement,
        );
      const dropped = /^DROP (TABLE|INDEX) [`"]?([a-z_0-9]+)/.exec(statement);
      const renamed =
        /^ALTER TABLE [`"]?([a-z_0-9]+)[`"]? RENAME TO [`"]?([a-z_0-9]+)/.exec(
          statement,
        );
      if (table?.[1]) objects.set(table[1], { type: "table", table: table[1] });
      else if (index?.[1] && index[2])
        objects.set(index[1], { type: "index", table: index[2] });
      else if (view?.[1])
        objects.set(view[1], { type: "view", table: view[1] });
      else if (trigger?.[1] && trigger[2])
        objects.set(trigger[1], { type: "trigger", table: trigger[2] });
      else if (dropped?.[2]) {
        objects.delete(dropped[2]);
        if (dropped[1] === "TABLE")
          for (const [name, object] of objects)
            if (object.table === dropped[2]) objects.delete(name);
      } else if (renamed?.[1] && renamed[2]) {
        const previous = renamed[1],
          next = renamed[2];
        if (!objects.delete(previous))
          throw new Error("Bundled schema rename is unsupported");
        objects.set(next, { type: "table", table: next });
        for (const object of objects.values())
          if (object.table === previous) object.table = next;
      } else if (/^CREATE\b/.test(statement))
        throw new Error("Bundled schema object is unclassified");
    }
  }
  return objects;
}
export async function initializeDatabase(
  connection: SqlExecutor,
  hashFunction: HashFunction,
  prepareData?: MigrationDataHook,
  checkCurrent?: () => void,
  admitReadOnly?: (version: number) => Promise<void>,
): Promise<void> {
  return processDatabase(
    connection,
    hashFunction,
    prepareData,
    checkCurrent,
    admitReadOnly,
  );
}
export async function verifyCurrentDatabase(
  connection: SqlExecutor,
  hashFunction: HashFunction,
  checkCurrent?: () => void,
): Promise<void> {
  return processDatabase(
    connection,
    hashFunction,
    undefined,
    checkCurrent,
    async (version) => {
      if (version !== DATABASE_VERSION)
        throw new Error("Current database schema is required");
    },
    true,
  );
}
async function processDatabase(
  connection: SqlExecutor,
  hashFunction: HashFunction,
  prepareData?: MigrationDataHook,
  checkCurrent?: () => void,
  admitReadOnly?: (version: number) => Promise<void>,
  inspectionOnly = false,
): Promise<void> {
  const executor: SqlExecutor = checkCurrent
    ? {
        execute(sql, parameters) {
          if (sql !== "ROLLBACK") checkCurrent();
          return connection.execute(sql, parameters);
        },
      }
    : connection;
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
          "SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'",
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
                  /^CREATE (?:UNIQUE )?(?:TABLE|INDEX|VIEW|TRIGGER) [`"]?([a-z_]+)/.exec(
                    original,
                  )?.[1];
                return (
                  name &&
                  candidate.startsWith("CREATE ") &&
                  /^CREATE (?:UNIQUE )?(?:TABLE|INDEX|VIEW|TRIGGER) [`"]?([a-z_]+)/.exec(
                    candidate,
                  )?.[1] === name
                );
              })
            : undefined;
        const packageCreate =
          /^CREATE TABLE installed_package(?:_v10|_v11|_v12)? /.test(original);
        const statement =
          packageCreate && appliedVersion >= 10
            ? original
                .replace(
                  /^CREATE TABLE installed_package(?:_v10|_v11|_v12)? /,
                  'CREATE TABLE "installed_package" ',
                )
                .replace(
                  /CHECK\(content_schema_version(?:=1| IN \(1,2\)| IN \(1,2,3\)| IN \(1,2,3,4\))\)/,
                  appliedVersion >= 12
                    ? "CHECK(content_schema_version IN (1,2,3,4))"
                    : appliedVersion >= 11
                      ? "CHECK(content_schema_version IN (1,2,3))"
                      : "CHECK(content_schema_version IN (1,2))",
                )
            : (replacement ?? original);
        if (!statement.startsWith("CREATE ")) continue;
        const name =
          /^CREATE (?:UNIQUE )?(?:TABLE|INDEX|VIEW|TRIGGER) [`"]?([a-z_]+)/.exec(
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
    const expected = expectedObjects(appliedVersion);
    const objects = (
      await executor.execute(
        "SELECT type,name,tbl_name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'",
        [],
      )
    ).rows;
    if (
      objects.length !== expected.size ||
      objects.some(([type, name, table]) => {
        const object =
          typeof name === "string" ? expected.get(name) : undefined;
        return !object || object.type !== type || object.table !== table;
      })
    )
      throw new Error("Database schema contains unclassified objects");
    if (appliedVersion >= 14) await verifyForeignKeyPolicy(executor);
  }
  await verify(version);
  await admitReadOnly?.(version);
  if (inspectionOnly) return;
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
      await transaction(
        executor,
        async () => {
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
          await executor.execute(
            `PRAGMA user_version=${migration.version}`,
            [],
          );
        },
        checkCurrent,
      );
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
