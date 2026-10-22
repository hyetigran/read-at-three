import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { serialize } from "node:v8";
import type { DatabaseSync } from "node:sqlite";
import { parseDiagnosticEvent } from "@readatthree/teaching";
import { DATABASE_VERSION } from "../../packages/storage/src/migration.ts";
import { profileFixture } from "./profile-support.ts";

const event = parseDiagnosticEvent({
  category: "write-failed",
  operation: "ink",
  count: 1,
  durationMs: 17,
});
function snapshot(db: DatabaseSync) {
  const schema = db
    .prepare(
      "SELECT type,name,tbl_name,rootpage,sql FROM sqlite_schema ORDER BY type,name",
    )
    .all();
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all();
  return {
    schema,
    version: db.prepare("PRAGMA user_version").get(),
    integrity: db.prepare("PRAGMA integrity_check").all(),
    foreignKeys: db.prepare("PRAGMA foreign_key_check").all(),
    tables: tables.map(({ name }) => {
      assert.equal(typeof name, "string");
      if (typeof name !== "string") throw new Error("Missing table name");
      const statement = db.prepare(
        `SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`,
      );
      statement.setReadBigInts(true);
      return { name, rows: statement.all() };
    }),
  };
}
for (const refusal of ["newer-version", "checksum-mismatch"] as const) {
  test(`diagnostics preserve the complete populated database after ${refusal} initialization refusal`, async (t) => {
    const fixture = await profileFixture(t);
    const first = fixture.connect();
    await fixture.setup(first.app);
    await fixture.start(first.app);
    await fixture.draw(first.app, 20);
    for (let count = 0; count < 32; count++)
      await first.app.recordDiagnostic(event);
    if (refusal === "newer-version")
      first.db.exec(`PRAGMA user_version=${DATABASE_VERSION + 1}`);
    else
      first.db
        .prepare("UPDATE schema_migration SET checksum=? WHERE version=1")
        .run("0".repeat(64));
    const location = first.db.prepare("PRAGMA database_list").get()?.file;
    assert.equal(typeof location, "string");
    if (typeof location !== "string") throw new Error("Missing database file");
    const before = snapshot(first.db);
    assert.equal(before.tables.length, 32);
    const bytes = await readFile(location);
    first.db.close();
    const second = fixture.connect();
    await assert.rejects(
      second.app.readDirectory(),
      refusal === "newer-version"
        ? /Unsupported database version/
        : /checksum mismatch/,
    );
    assert.deepEqual(await second.app.readDiagnostics(), {
      persistence: "memoryOnly",
      ring: { version: 1, omitted: 0, records: [] },
    });
    const recorded = [];
    const reads = [];
    for (let count = 1; count <= 3; count++) {
      recorded.push(await second.app.recordDiagnostic(event));
      reads.push(await second.app.readDiagnostics());
    }
    const after = snapshot(second.db);
    second.db.close();
    const afterBytes = await readFile(location);
    const evidence = process.env.DIAGNOSTIC_EVIDENCE;
    if (evidence) {
      await mkdir(evidence, { recursive: true });
      await writeFile(join(evidence, `${refusal}-before.sqlite`), bytes);
      await writeFile(join(evidence, `${refusal}-after.sqlite`), afterBytes);
      await writeFile(
        join(evidence, `${refusal}-before.v8`),
        serialize(before),
      );
      await writeFile(join(evidence, `${refusal}-after.v8`), serialize(after));
    }
    for (let count = 1; count <= 3; count++) {
      assert.deepEqual(reads[count - 1], recorded[count - 1]);
      assert.deepEqual(recorded[count - 1], {
        persistence: "memoryOnly",
        ring: {
          version: 1,
          omitted: 0,
          records: Array.from({ length: count }, () => event),
        },
      });
    }
    assert.deepEqual(after, before);
    assert.deepEqual(afterBytes, bytes);
  });
}

test("a transient diagnostics read failure can regain durable storage", async (t) => {
  const fixture = await profileFixture(t);
  let fail = false;
  const { app, db } = fixture.connect({
    hook: async (sql, work) => {
      if (
        fail &&
        sql.startsWith('select "singleton", "payload" from "local_diagnostics"')
      ) {
        fail = false;
        throw new Error("Injected transient diagnostic read failure");
      }
      return work();
    },
  });
  await fixture.setup(app);
  fail = true;
  assert.deepEqual(await app.readDiagnostics(), {
    persistence: "memoryOnly",
    ring: { version: 1, omitted: 0, records: [] },
  });
  const restored = await app.recordDiagnostic(event);
  assert.deepEqual(restored, {
    persistence: "durable",
    ring: { version: 1, omitted: 0, records: [event] },
  });
  assert.deepEqual(
    JSON.parse(
      String(
        db.prepare("SELECT payload FROM local_diagnostics").get()?.payload,
      ),
    ),
    restored.ring,
  );
  assert.deepEqual(await app.readDiagnostics(), restored);
});
