import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { migrations } from "../../packages/storage/src/generated-migration.ts";
import { initializeDatabase } from "../../packages/storage/src/migration.ts";
import { executorFor, hash } from "./support.ts";

async function baseline(t: { after(fn: () => Promise<void>): void }) {
  const folder = await mkdtemp(join(tmpdir(), "connected-metadata-"));
  const file = join(folder, "state.sqlite");
  let db = new DatabaseSync(file);
  t.after(async () => {
    if (db.isOpen) db.close();
    await rm(folder, { recursive: true, force: true });
  });
  db.exec("PRAGMA foreign_keys=ON");
  for (const migration of migrations.slice(0, 11)) {
    const rebuild = "foreignKeys" in migration;
    if (rebuild) db.exec("PRAGMA foreign_keys=OFF");
    db.exec("BEGIN IMMEDIATE");
    for (const sql of migration.statements) db.exec(sql);
    db.prepare("INSERT INTO schema_migration VALUES(?,?,?)").run(
      migration.version,
      migration.id,
      await hash(migration.statements.join("\n")),
    );
    db.exec(`PRAGMA user_version=${migration.version}`);
    db.exec("COMMIT");
    if (rebuild) db.exec("PRAGMA foreign_keys=ON");
  }
  db.prepare(
    "INSERT INTO installation(singleton,installation_id,database_version,revision) VALUES(1,'synthetic-installation',11,0)",
  ).run();
  const packageHash = "f".repeat(64);
  db.prepare(
    "INSERT INTO installed_package VALUES(?,?,?,3,?,1,?,'ready',?)",
  ).run(
    packageHash,
    "synthetic-course",
    "synthetic-release",
    '["synthetic-capability"]',
    Buffer.from('{"synthetic":"retained manifest bytes"}'),
    packageHash,
  );
  db.prepare("INSERT INTO course_activation VALUES(?,?,NULL,0)").run(
    "synthetic-course",
    packageHash,
  );
  db.close();
  db = new DatabaseSync(file);
  return {
    file,
    get db() {
      return db;
    },
    reopen() {
      db.close();
      db = new DatabaseSync(file);
      return db;
    },
  };
}

for (const point of [
  "statement-0",
  "statement-1",
  "statement-2",
  "statement-3",
  "statement-4",
  "ledger",
  "version",
  "commit",
  "foreign-check",
]) {
  test(`DB12 ${point} failure preserves complete old file and restores foreign keys`, async (t) => {
    const f = await baseline(t),
      before = await readFile(f.file);
    let hit = false,
      inMigration = false;
    const last = migrations[11];
    assert.ok(last);
    await assert.rejects(
      initializeDatabase(
        executorFor(f.db, async (sql, work) => {
          if (sql === "BEGIN IMMEDIATE") inMigration = true;
          const matches = point.startsWith("statement-")
            ? sql === last.statements[Number(point.slice(10))]
            : point === "ledger"
              ? sql.startsWith("INSERT INTO schema_migration")
              : point === "version"
                ? sql === "PRAGMA user_version=12"
                : point === "commit"
                  ? sql === "COMMIT"
                  : sql === "PRAGMA foreign_key_check" && inMigration;
          if (matches && !hit) {
            hit = true;
            throw Error("Synthetic DB12 rollback");
          }
          return work();
        }),
        hash,
      ),
      /Synthetic DB12 rollback/,
    );
    assert.ok(hit);
    assert.equal(f.db.prepare("PRAGMA foreign_keys").get()?.foreign_keys, 1);
    assert.deepEqual(await readFile(f.file), before);
    assert.equal(
      f.reopen().prepare("PRAGMA user_version").get()?.user_version,
      11,
    );
    await initializeDatabase(executorFor(f.db), hash);
    assert.equal(f.db.prepare("PRAGMA user_version").get()?.user_version, 12);
    assert.equal(
      f.db.prepare("SELECT count(*) AS n FROM schema_migration").get()?.n,
      12,
    );
    assert.deepEqual(f.db.prepare("PRAGMA foreign_key_check").all(), []);
    assert.equal(
      f.db.prepare("SELECT content_schema_version FROM installed_package").get()
        ?.content_schema_version,
      3,
    );
  });
}

test("genuinely committed DB12 reply loss reopens and retries without another migration or package change", async (t) => {
  const f = await baseline(t);
  const originalPackages = f.db
    .prepare("SELECT * FROM installed_package")
    .all();
  let hit = false;
  await assert.rejects(
    initializeDatabase(
      executorFor(f.db, async (sql, work) => {
        const result = await work();
        if (sql === "COMMIT" && !hit) {
          hit = true;
          throw Error("Synthetic DB12 committed reply loss");
        }
        return result;
      }),
      hash,
    ),
    /committed reply loss/,
  );
  assert.ok(hit);
  const committed = await readFile(f.file);
  f.reopen();
  await initializeDatabase(executorFor(f.db), hash);
  await initializeDatabase(executorFor(f.db), hash);
  assert.deepEqual(await readFile(f.file), committed);
  assert.deepEqual(
    f.db.prepare("SELECT * FROM installed_package").all(),
    originalPackages,
  );
  assert.equal(f.db.prepare("PRAGMA foreign_keys").get()?.foreign_keys, 1);
});
