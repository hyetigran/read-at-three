import type { HashFunction } from "../../teaching/src/index.ts";
import type { SqlExecutor } from "./executor.ts";
import { migrationStatements } from "./generated-migration.ts";
export { migrationStatements } from "./generated-migration.ts";
export const DATABASE_VERSION = 1;
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
