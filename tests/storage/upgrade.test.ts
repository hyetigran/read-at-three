import { selectedProjection } from "./selected-support.ts";

import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { Ajv2020 } from "ajv/dist/2020.js";
import {
  initializeDatabase,
  DATABASE_VERSION,
  migrationStatements,
} from "../../packages/storage/src/migration.ts";
import { migrations } from "../../packages/storage/src/generated-migration.ts";
import { canonical } from "../../packages/teaching/src/index.ts";
import { hash, storageFixture } from "./support.ts";
import type {
  SqlExecutor,
  SqlValue,
} from "../../packages/storage/src/index.ts";
import type { DatabaseSync } from "node:sqlite";
type FixtureValue = string | number | null | { $bytes: string };
type Fixture = {
  origin: string;
  userVersion: 1 | 2;
  packageHash: string;
  tables: { name: string; rows: Record<string, FixtureValue>[] }[];
};
const validate = new Ajv2020({ strict: true }).compile<Fixture>({
  type: "object",
  required: ["origin", "userVersion", "packageHash", "tables"],
  additionalProperties: false,
  properties: {
    origin: { type: "string" },
    userVersion: { enum: [1, 2] },
    packageHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
    tables: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "rows"],
        additionalProperties: false,
        properties: {
          name: { type: "string", pattern: "^[a-z_]+$" },
          rows: {
            type: "array",
            items: {
              type: "object",
              propertyNames: { pattern: "^[a-z_]+$" },
              additionalProperties: {
                anyOf: [
                  { type: "string" },
                  { type: "number" },
                  { type: "null" },
                  {
                    type: "object",
                    required: ["$bytes"],
                    additionalProperties: false,
                    properties: { $bytes: { type: "string" } },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
});
async function seed({
  db,
  version = 1,
}: {
  db: DatabaseSync;
  version?: 1 | 2;
}) {
  const raw: unknown = JSON.parse(
    await readFile(`tests/fixtures/storage-v${version}.json`, "utf8"),
  );
  if (!validate(raw)) throw new Error("V1 capture is invalid");
  db.exec("PRAGMA foreign_keys=OFF");
  db.exec("BEGIN");
  try {
    for (const migration of migrations.slice(0, version))
      for (const statement of migration.statements) db.exec(statement);
    for (const table of raw.tables)
      for (const row of table.rows) {
        const columns = Object.keys(row);
        const values: SqlValue[] = Object.values(row).map((value) => {
          if (typeof value === "object" && value !== null) {
            const bytes = Buffer.from(value.$bytes, "base64");
            if (bytes.toString("base64") !== value.$bytes)
              throw new Error("Invalid captured BLOB");
            return bytes;
          }
          return value;
        });
        db.prepare(
          `INSERT INTO ${table.name}(${columns.join(",")}) VALUES(${columns.map(() => "?").join(",")})`,
        ).run(...values);
      }
    db.exec(`PRAGMA user_version=${version}`);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  db.exec("PRAGMA foreign_keys=ON");
  return raw;
}
function sourceState(db: DatabaseSync, migration: "none" | "toV7" = "none") {
  return canonical(
    [
      "profile",
      "course_cursor",
      "session",
      "task_run",
      "task_advance",
      "command_receipt",
    ].map((name) => ({
      name,
      rows: db
        .prepare(`SELECT * FROM ${name}`)
        .all()
        .map((row) => {
          if (migration === "toV7" && name === "task_advance") {
            assert.equal(Object.hasOwn(row, "accepting_command"), false);
            return { ...row, accepting_command: null };
          }
          if (migration === "toV7" && name === "task_run") {
            assert.equal(
              Object.hasOwn(row, "legacy_acceptance_seq_limit"),
              false,
            );
            const next = row.next_advance_seq;
            if (
              typeof next !== "number" ||
              !Number.isSafeInteger(next) ||
              next < 1
            )
              assert.fail(
                "Captured sequence must be an exact positive integer",
              );
            return { ...row, legacy_acceptance_seq_limit: next - 1 };
          }
          return row;
        }),
    })),
  );
}

test("real captured V1 data upgrades without rebinding pinned bytes; full task requires explicit new run", async (t) => {
  const f = await storageFixture(t);
  const first = f.connect();
  const capture = await seed({ db: first.db });
  const before = sourceState(first.db, "toV7");
  assert.equal(
    await hash(migrationStatements.join("\n")),
    "b720e50ce599b3abffbc4b3fc89b09c2a8f06ba2811a14b17e0c86af275292bc",
  );
  const bytes = first.db
    .prepare(
      "SELECT verified_manifest FROM installed_package WHERE package_hash=?",
    )
    .get(capture.packageHash)?.verified_manifest;
  const view = await selectedProjection(first.app);
  assert.equal(view.kind, "teaching");
  if (view.kind === "teaching") {
    assert.equal(view.packageHash, capture.packageHash);
    assert.equal(view.turn.id, "fixture.response");
    assert.equal(
      view.actions.some((action) => action.label.text === "Start full task"),
      true,
    );
  }
  assert.equal(sourceState(first.db), before);
  assert.deepEqual(
    first.db
      .prepare(
        "SELECT verified_manifest FROM installed_package WHERE package_hash=?",
      )
      .get(capture.packageHash)?.verified_manifest,
    bytes,
  );
  assert.equal(
    first.db.prepare("PRAGMA user_version").get()?.user_version,
    DATABASE_VERSION,
  );
  assert.equal(
    first.db.prepare("SELECT database_version FROM installation").get()
      ?.database_version,
    DATABASE_VERSION,
  );
  const restart = f.connect();
  assert.deepEqual(await selectedProjection(restart.app), view);
  await f.act(restart.app, "continue");
  assert.equal((await selectedProjection(restart.app)).kind, "frontier");
  await f.act(restart.app, "restart");
  const full = await selectedProjection(restart.app);
  assert.equal(full.kind, "teaching");
  if (full.kind === "teaching") {
    assert.equal(full.packageHash, f.content.packageHash);
    assert.match(full.turn.id, /s01/);
  }
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    0,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_run").get()?.n,
    2,
  );
});

test("each failed V2 migration statement rolls back to exact V1 schema/data and retry converges", async (t) => {
  for (const failing of migrations[1].statements) {
    const f = await storageFixture(t);
    const first = f.connect();
    await seed({ db: first.db });
    const before = sourceState(first.db);
    const upgraded = sourceState(first.db, "toV7");
    const executor: SqlExecutor = {
      execute: async (sql, parameters) => {
        if (sql === failing) throw new Error("Injected V2 interruption");
        return first.executor.execute(sql, parameters);
      },
    };
    await assert.rejects(
      initializeDatabase(executor, hash),
      /Injected V2 interruption/,
    );
    assert.equal(
      first.db.prepare("PRAGMA user_version").get()?.user_version,
      1,
    );
    assert.equal(
      first.db.prepare("SELECT count(*) AS n FROM schema_migration").get()?.n,
      1,
    );
    assert.equal(sourceState(first.db), before);
    assert.equal(
      first.db
        .prepare(
          "SELECT count(*) AS n FROM sqlite_master WHERE name IN ('task_credit','task_result')",
        )
        .get()?.n,
      0,
    );
    await initializeDatabase(first.executor, hash);
    await initializeDatabase(first.executor, hash);
    assert.equal(
      first.db.prepare("PRAGMA user_version").get()?.user_version,
      DATABASE_VERSION,
    );
    assert.equal(sourceState(first.db), upgraded);
  }
});

test("tampered V1 ledger rejects before any upgrade and keeps saved state", async (t) => {
  const f = await storageFixture(t);
  const first = f.connect();
  await seed({ db: first.db });
  const before = sourceState(first.db);
  first.db
    .prepare("UPDATE schema_migration SET checksum=?")
    .run("a".repeat(64));
  await assert.rejects(initializeDatabase(first.executor, hash), /checksum/);
  assert.equal(first.db.prepare("PRAGMA user_version").get()?.user_version, 1);
  assert.equal(sourceState(first.db), before);
});

test("genuine main V2 capture upgrades in place; new oral catalog preserves exact printed correction context and old NULL acceptances", async (t) => {
  const { controlFixture } = await import("../teaching/control-fixture.ts");
  const oral = await controlFixture();
  const f = await storageFixture(t, oral.content);
  const first = f.connect();
  const capture = await seed({ db: first.db, version: 2 }),
    before = sourceState(first.db, "toV7");
  const blob = first.db
    .prepare(
      "SELECT verified_manifest FROM installed_package WHERE package_hash=?",
    )
    .get(capture.packageHash)?.verified_manifest;
  const view = await selectedProjection(first.app);
  assert.equal(view.kind, "teaching");
  if (view.kind !== "teaching") throw new Error("Lost captured context");
  assert.equal(view.packageHash, capture.packageHash);
  assert.equal(
    "routeKind" in view.turn && view.turn.routeKind,
    "correctionRetest",
  );
  assert.equal(sourceState(first.db), before);
  assert.equal(
    first.db.prepare("SELECT active_package_hash FROM course_activation").get()
      ?.active_package_hash,
    oral.content.packageHash,
  );
  assert.equal(view.catalog.filter((task) => task.available).length, 4);
  assert.deepEqual(
    first.db
      .prepare(
        "SELECT verified_manifest FROM installed_package WHERE package_hash=?",
      )
      .get(capture.packageHash)?.verified_manifest,
    blob,
  );
  assert.equal(
    first.db
      .prepare(
        "SELECT count(*) AS n FROM task_advance WHERE accepting_command IS NULL",
      )
      .get()?.n,
    2,
  );
  assert.deepEqual(await selectedProjection(f.connect().app), view);
  await f.act(first.app, "continue");
  assert.equal((await selectedProjection(f.connect().app)).kind, "teaching");
  const older = f.connect({
    content:
      f.content.body.coverage === "lesson1-sounds-oral-complete"
        ? await (
            await import("../../packages/teaching/src/index.ts")
          ).parseDevelopmentPackage(
            JSON.parse(
              await readFile(
                "tests/fixtures/graph-development-package.json",
                "utf8",
              ),
            ),
            hash,
          )
        : f.content,
  });
  await selectedProjection(older.app);
  assert.equal(
    first.db.prepare("SELECT active_package_hash FROM course_activation").get()
      ?.active_package_hash,
    oral.content.packageHash,
  );
});

test("every V3 migration write and pre-COMMIT interruption rolls back genuine V2 schema/data; lost acknowledgement retries", async (t) => {
  const points = [
    ...migrations[2].statements,
    "INSERT INTO schema_migration",
    "PRAGMA user_version=3",
    "COMMIT",
  ];
  for (const point of points) {
    const f = await storageFixture(t),
      first = f.connect();
    await seed({ db: first.db, version: 2 });
    const before = sourceState(first.db),
      upgraded = sourceState(first.db, "toV7"),
      schemaBefore = canonical(
        first.db
          .prepare("SELECT name,sql FROM sqlite_master ORDER BY name")
          .all(),
      );
    let injected = false;
    const executor: SqlExecutor = {
      execute: async (sql, parameters) => {
        if (
          !injected &&
          (sql === point ||
            (point === "INSERT INTO schema_migration" && sql.startsWith(point)))
        ) {
          injected = true;
          throw new Error("Injected V3 migration interruption");
        }
        return first.executor.execute(sql, parameters);
      },
    };
    await assert.rejects(initializeDatabase(executor, hash), /Injected V3/);
    assert.ok(injected);
    assert.equal(
      first.db.prepare("PRAGMA user_version").get()?.user_version,
      2,
    );
    assert.equal(sourceState(first.db), before);
    assert.equal(
      canonical(
        first.db
          .prepare("SELECT name,sql FROM sqlite_master ORDER BY name")
          .all(),
      ),
      schemaBefore,
    );
    await initializeDatabase(first.executor, hash);
    await initializeDatabase(first.executor, hash);
    assert.equal(
      first.db.prepare("PRAGMA user_version").get()?.user_version,
      DATABASE_VERSION,
    );
    assert.equal(sourceState(first.db), upgraded);
  }
  const f = await storageFixture(t),
    first = f.connect();
  await seed({ db: first.db, version: 2 });
  let lost = false;
  const executor: SqlExecutor = {
    execute: async (sql, parameters) => {
      const result = await first.executor.execute(sql, parameters);
      if (sql === "COMMIT" && !lost) {
        lost = true;
        throw new Error("Lost migration reply");
      }
      return result;
    },
  };
  await assert.rejects(initializeDatabase(executor, hash), /Lost migration/);
  assert.equal(first.db.prepare("PRAGMA user_version").get()?.user_version, 3);
  await initializeDatabase(first.executor, hash);
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM schema_migration").get()?.n,
    DATABASE_VERSION,
  );
});
