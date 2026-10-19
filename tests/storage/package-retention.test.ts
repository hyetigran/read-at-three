import assert from "node:assert/strict";
import { test } from "node:test";
import { storageFixture } from "./support.ts";
import { classifiedPackageColumns } from "../../packages/storage/src/package-references.ts";
import {
  ownedPackagePaths,
  retentionStatements,
} from "../../packages/storage/src/retention-contract.ts";
import type { OwnedPath } from "../../packages/storage/src/retention-contract.ts";
import {
  foreignKeyPolicy,
  verifyForeignKeyPolicy,
} from "../../packages/storage/src/foreign-key-policy.ts";

test("deployed retention guards preserve direct holds before a package row exists and exclude collecting admissions", async (t) => {
  const f = await storageFixture(t);
  const { app, db } = f.connect();
  await app.readDirectory();
  db.exec("DELETE FROM course_activation");
  const absent = "f".repeat(64);
  db.prepare(
    "INSERT INTO package_hold(owner_kind,owner_id,package_hash) VALUES('export','[\"test-operation\"]',?)",
  ).run(absent);
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS n FROM installed_package WHERE package_hash=?",
      )
      .get(absent)?.n,
    0,
  );
  assert.throws(
    () =>
      db
        .prepare(
          "INSERT INTO package_collection(package_hash,revision,state) VALUES(?,0,'collecting')",
        )
        .run(absent),
    /excludes new references/,
  );
  db.exec("DELETE FROM package_hold");
  db.prepare(
    "INSERT INTO package_collection(package_hash,revision,state) VALUES(?,0,'collecting')",
  ).run(absent);
  assert.throws(
    () =>
      db
        .prepare(
          "INSERT INTO package_hold(owner_kind,owner_id,package_hash) VALUES('export','[\"late-operation\"]',?)",
        )
        .run(absent),
    /excludes new references/,
  );
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
});

test("an unclassified raw package FK on an existing metadata table refuses the complete FK gate", async (t) => {
  const f = await storageFixture(t);
  const { app, db, executor } = f.connect();
  await app.readDirectory();
  await verifyForeignKeyPolicy(executor);
  db.exec(
    "ALTER TABLE installed_representation ADD COLUMN retained_package TEXT REFERENCES installed_package(package_hash)",
  );
  await assert.rejects(
    verifyForeignKeyPolicy(executor),
    /classification is incomplete/,
  );
  await assert.rejects(
    verifyForeignKeyPolicy(executor, {
      ...foreignKeyPolicy,
      "installed_representation(retained_package)->installed_package(package_hash)":
        "ownership",
    }),
    /package-column classification/,
  );
  await verifyForeignKeyPolicy(
    executor,
    {
      ...foreignKeyPolicy,
      "installed_representation(retained_package)->installed_package(package_hash)":
        "metadata",
    },
    [
      ...classifiedPackageColumns(),
      {
        table: "installed_representation",
        column: "retained_package",
        role: "metadata",
      },
    ],
  );
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
});

test("a new composite owner FK on an existing metadata table requires an explicit full ordered decision", async (t) => {
  const f = await storageFixture(t);
  const { app, db, executor } = f.connect();
  await app.readDirectory();
  const definition = db
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='local_diagnostics'",
    )
    .get()?.sql;
  if (typeof definition !== "string" || !definition.endsWith(")"))
    throw new Error("Diagnostic fixture schema unavailable");
  db.exec("ALTER TABLE local_diagnostics RENAME TO old_diagnostics");
  const extended = definition.replace(
    "(",
    "(retained_run TEXT, retained_profile TEXT, retained_generation INTEGER, ",
  );
  db.exec(
    `${extended.slice(0, -1)}, FOREIGN KEY(retained_run,retained_profile,retained_generation) REFERENCES task_run(run_id,profile_id,generation) DEFERRABLE INITIALLY DEFERRED)`,
  );
  db.exec("DROP TABLE old_diagnostics");
  await assert.rejects(
    verifyForeignKeyPolicy(executor),
    /classification is incomplete/,
  );
  await assert.rejects(
    verifyForeignKeyPolicy(executor, {
      ...foreignKeyPolicy,
      "local_diagnostics(retained_profile,retained_run,retained_generation)->task_run(profile_id,run_id,generation)":
        "metadata",
    }),
    /classification is incomplete/,
  );
  await verifyForeignKeyPolicy(executor, {
    ...foreignKeyPolicy,
    "local_diagnostics(retained_run,retained_profile,retained_generation)->task_run(run_id,profile_id,generation)":
      "metadata",
  });
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
});

const compositePath: OwnedPath = {
  root: "fixture_leaf",
  edges: [
    {
      child: "fixture_leaf",
      parent: "fixture_middle",
      columns: [
        ["owner", "owner"],
        ["generation", "generation"],
        ["middle_id", "middle_id"],
      ],
    },
    {
      child: "fixture_middle",
      parent: "fixture_parent",
      columns: [
        ["owner", "owner"],
        ["generation", "generation"],
        ["parent_id", "parent_id"],
      ],
    },
  ],
};

for (const order of [
  ["leaf", "middle", "parent"],
  ["leaf", "parent", "middle"],
  ["middle", "leaf", "parent"],
  ["middle", "parent", "leaf"],
  ["parent", "leaf", "middle"],
  ["parent", "middle", "leaf"],
]) {
  test(`generated guards close the complete deferred ownership path in ${order.join("/")} order`, async (t) => {
    const f = await storageFixture(t);
    const { app, db, executor } = f.connect();
    await app.readDirectory();
    db.exec("DELETE FROM course_activation");
    db.exec(
      "CREATE TABLE fixture_parent(owner TEXT NOT NULL,generation INTEGER NOT NULL,parent_id TEXT NOT NULL,package_hash TEXT NOT NULL REFERENCES installed_package(package_hash),other_package TEXT REFERENCES installed_package(package_hash),PRIMARY KEY(owner,generation,parent_id))",
    );
    db.exec(
      "CREATE TABLE fixture_middle(owner TEXT NOT NULL,generation INTEGER NOT NULL,middle_id TEXT NOT NULL,parent_id TEXT NOT NULL,PRIMARY KEY(owner,generation,middle_id),FOREIGN KEY(owner,generation,parent_id) REFERENCES fixture_parent(owner,generation,parent_id) DEFERRABLE INITIALLY DEFERRED)",
    );
    db.exec(
      "CREATE TABLE fixture_leaf(owner TEXT NOT NULL,generation INTEGER NOT NULL,leaf_id TEXT PRIMARY KEY,middle_id TEXT NOT NULL,FOREIGN KEY(owner,generation,middle_id) REFERENCES fixture_middle(owner,generation,middle_id) DEFERRABLE INITIALLY DEFERRED)",
    );
    db.exec(
      "CREATE TABLE fixture_direct_pin(package_hash TEXT PRIMARY KEY REFERENCES installed_package(package_hash))",
    );
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((row) => {
        if (typeof row.name !== "string")
          throw new Error("Expected fixture table");
        return row.name;
      });
    const columns = [
      ...classifiedPackageColumns(),
      { table: "fixture_parent", column: "package_hash", role: "metadata" },
      { table: "fixture_parent", column: "other_package", role: "metadata" },
      { table: "fixture_direct_pin", column: "package_hash", role: "root" },
    ] satisfies Parameters<typeof retentionStatements>[0];
    const policy = {
      ...foreignKeyPolicy,
      "fixture_parent(package_hash)->installed_package(package_hash)":
        "ownership",
      "fixture_parent(other_package)->installed_package(package_hash)":
        "metadata",
      "fixture_direct_pin(package_hash)->installed_package(package_hash)":
        "ownership",
      "fixture_leaf(owner,generation,middle_id)->fixture_middle(owner,generation,middle_id)":
        "ownership",
      "fixture_middle(owner,generation,parent_id)->fixture_parent(owner,generation,parent_id)":
        "ownership",
    } satisfies Parameters<typeof verifyForeignKeyPolicy>[1];
    const paths = [...ownedPackagePaths, compositePath];
    await verifyForeignKeyPolicy(executor, policy, columns, paths);
    await assert.rejects(
      verifyForeignKeyPolicy(
        executor,
        {
          ...policy,
          "fixture_parent(other_package)->installed_package(package_hash)":
            "ownership",
        },
        columns,
        paths,
      ),
      /package-column classification/,
    );
    await assert.rejects(
      verifyForeignKeyPolicy(
        executor,
        policy,
        columns.filter((column) => column.table !== "fixture_parent"),
        paths,
      ),
      /package-column classification/,
    );
    await assert.rejects(
      verifyForeignKeyPolicy(executor, policy, columns, ownedPackagePaths),
      /retention path|package-column classification/,
    );
    assert.throws(
      () =>
        retentionStatements(
          columns.filter((column) => column.table !== "fixture_direct_pin"),
          tables,
          [...ownedPackagePaths, compositePath],
        ),
      /classification/,
    );
    const triggers = db
      .prepare("SELECT name FROM sqlite_master WHERE type='trigger'")
      .all();
    for (const row of triggers) {
      if (typeof row.name !== "string" || !/^[a-z_]+$/.test(row.name))
        throw new Error("Expected generated trigger");
      db.exec(`DROP TRIGGER ${row.name}`);
    }
    db.exec("DROP VIEW package_retention");
    for (const statement of retentionStatements(columns, tables, [
      ...ownedPackagePaths,
      compositePath,
    ]))
      db.exec(statement);
    const packageHash = f.content.packageHash;
    const insert = (node: string) => {
      if (node === "parent")
        db.prepare(
          "INSERT INTO fixture_parent(owner,generation,parent_id,package_hash) VALUES('owner',2,'parent',?)",
        ).run(packageHash);
      else if (node === "middle")
        db.exec(
          "INSERT INTO fixture_middle VALUES('owner',2,'middle','parent')",
        );
      else if (node === "leaf")
        db.exec("INSERT INTO fixture_leaf VALUES('owner',2,'leaf','middle')");
      else throw new Error("Unexpected fixture node");
    };
    db.exec("BEGIN");
    for (const node of order) insert(node);
    db.exec("COMMIT");
    assert.throws(
      () =>
        db
          .prepare("INSERT INTO package_collection VALUES(?,0,'collecting')")
          .run(packageHash),
      /excludes new references/,
    );
    db.exec(
      "DELETE FROM fixture_leaf; DELETE FROM fixture_middle; DELETE FROM fixture_parent",
    );
    db.prepare(
      "INSERT INTO fixture_parent(owner,generation,parent_id,package_hash) VALUES('other-owner',2,'unrooted',?)",
    ).run(packageHash);
    db.prepare("INSERT INTO package_collection VALUES(?,0,'collecting')").run(
      packageHash,
    );
    assert.throws(
      () =>
        db.prepare("INSERT INTO fixture_direct_pin VALUES(?)").run(packageHash),
      /excludes new references/,
    );
    db.exec("BEGIN");
    assert.throws(() => {
      for (const node of order) insert(node);
    }, /excludes new references/);
    db.exec("ROLLBACK");
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM fixture_leaf").get()?.n,
      0,
    );
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
    assert.equal(db.prepare("PRAGMA foreign_keys").get()?.foreign_keys, 1);
  });
}
