import { DATABASE_VERSION } from "../../packages/storage/src/migration.ts";
import { selectedCourse, selectedProjection } from "./selected-support.ts";

import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { parseHash, resolveAvatar } from "@readatthree/teaching";
import { migrations } from "../../packages/storage/src/generated-migration.ts";
import { databaseSnapshot, storageFixture } from "./support.ts";
import { hash } from "./support.ts";

const preparationHash = parseHash({
  kind: "preparation",
  value: "1".repeat(64),
});

test("a fresh directory persists one anonymous selected child and requires the supplied reviewed preparation", async (t) => {
  const fixture = await storageFixture(t);
  const first = fixture.connect({
    preparation: { kind: "reviewed", hash: preparationHash },
  });
  assert.equal((await selectedProjection(first.app)).kind, "entry");
  const directory = await first.app.readDirectory();
  assert.deepEqual(directory, {
    administration: { installationId: "graph-store-1", revision: "0" },
    selection: {
      installationId: "graph-store-1",
      revision: "0",
      owner: { profileId: "graph-store-2", generation: "0" },
    },
    profiles: [
      {
        edit: {
          owner: { profileId: "graph-store-2", generation: "0" },
          revision: "0",
        },
        preferences: { version: 1 },
      },
    ],
    preparation: {
      kind: "required",
      requiredHash: "1".repeat(64),
      acknowledgedHash: null,
    },
    initialSetup: { kind: "firstLaunch" },
  });
  first.db.close();
  const reopened = fixture.connect({
    preparation: { kind: "reviewed", hash: preparationHash },
  });
  assert.deepEqual(await reopened.app.readDirectory(), directory);
  assert.equal((await selectedProjection(reopened.app)).kind, "entry");
  assert.equal(
    reopened.db.prepare("SELECT database_version FROM installation").get()
      ?.database_version,
    DATABASE_VERSION,
  );
});

test("unavailable preparation remains explicit and cannot appear acknowledged on restart", async (t) => {
  const fixture = await storageFixture(t);
  const first = fixture.connect();
  const directory = await first.app.readDirectory();
  assert.deepEqual(directory.preparation, {
    kind: "unavailable",
    acknowledgedHash: null,
  });
  assert.equal(directory.initialSetup.kind, "firstLaunch");
  first.db.close();
  const reopened = fixture.connect();
  assert.deepEqual((await reopened.app.readDirectory()).preparation, {
    kind: "unavailable",
    acknowledgedHash: null,
  });
});

async function constructedV7(
  fixture: Awaited<ReturnType<typeof storageFixture>>,
  profiles: readonly {
    id: string;
    generation: number;
    revision: number;
    preferences: string;
  }[],
) {
  const connection = fixture.connect();
  connection.db.exec("PRAGMA foreign_keys=ON");
  for (const migration of migrations.filter(
    (migration) => migration.version <= 7,
  )) {
    for (const statement of migration.statements) connection.db.exec(statement);
    connection.db
      .prepare(
        "INSERT INTO schema_migration(version,migration_id,checksum) VALUES(?,?,?)",
      )
      .run(
        migration.version,
        migration.id,
        await hash(migration.statements.join("\n")),
      );
  }
  connection.db
    .prepare(
      "INSERT INTO installation(installation_id,revision,database_version,singleton) VALUES('legacy-installation',0,7,1)",
    )
    .run();
  for (const profile of profiles)
    connection.db
      .prepare(
        "INSERT INTO profile(profile_id,generation,revision,undo_run_id,preferences_version,preferences) VALUES(?,?,?,NULL,1,?)",
      )
      .run(
        profile.id,
        profile.generation,
        profile.revision,
        profile.preferences,
      );
  connection.db.exec("PRAGMA user_version=7");
  assert.equal(
    connection.db
      .prepare(
        "SELECT count(*) AS count FROM sqlite_master WHERE name='installation_profile_state'",
      )
      .get()?.count,
    0,
  );
  return connection;
}

test("constructed untouched V7 migration preserves the anonymous child and requires first setup", async (t) => {
  const fixture = await storageFixture(t);
  const preferences = '{ "version" : 1 }';
  const first = await constructedV7(fixture, [
    { id: "untouched-child", generation: 0, revision: 0, preferences },
  ]);
  const directory = await first.app.readDirectory();
  assert.deepEqual(directory.selection, {
    installationId: "legacy-installation",
    revision: "0",
    owner: { profileId: "untouched-child", generation: "0" },
  });
  assert.deepEqual(directory.initialSetup, { kind: "firstLaunch" });
  assert.deepEqual(directory.preparation, {
    kind: "unavailable",
    acknowledgedHash: null,
  });
  assert.equal(
    first.db.prepare("SELECT preferences FROM profile").get()?.preferences,
    preferences,
  );
  assert.equal(
    first.db.prepare("PRAGMA user_version").get()?.user_version,
    DATABASE_VERSION,
  );
  assert.equal(
    first.db
      .prepare("SELECT count(*) AS count FROM profile_administration_receipt")
      .get()?.count,
    0,
  );
});

test("constructed multi-child V7 migration keeps the lexicographic owner and actual generation without changing preference bytes", async (t) => {
  const fixture = await storageFixture(t);
  const original = [
    {
      id: "z-child",
      generation: 0,
      revision: 0,
      preferences: '{"version":1,"avatarId":"owl","displayName":"Same"}',
    },
    {
      id: "a-child",
      generation: 7,
      revision: 4,
      preferences:
        '{ "version":1, "avatarId":"future-animal", "displayName":"Same", "writing":{"hand":"left"}, "accessibility":{"largeText":true} }',
    },
  ];
  const first = await constructedV7(fixture, original);
  const directory = await first.app.readDirectory();
  assert.deepEqual(directory.selection, {
    installationId: "legacy-installation",
    revision: "0",
    owner: { profileId: "a-child", generation: "7" },
  });
  assert.deepEqual(directory.initialSetup, { kind: "existingFamily" });
  assert.deepEqual(directory.preparation, {
    kind: "unavailable",
    acknowledgedHash: null,
  });
  assert.deepEqual(
    directory.profiles.map((profile) => ({
      id: profile.edit.owner.profileId,
      revision: profile.edit.revision,
      preferences: profile.preferences,
      displayAnimal: resolveAvatar({ savedId: profile.preferences.avatarId }),
    })),
    [
      {
        id: "a-child",
        revision: "4",
        preferences: {
          version: 1,
          avatarId: "future-animal",
          displayName: "Same",
          writing: { hand: "left" },
          accessibility: { largeText: true },
        },
        displayAnimal: "rabbit",
      },
      {
        id: "z-child",
        revision: "0",
        preferences: { version: 1, avatarId: "owl", displayName: "Same" },
        displayAnimal: "owl",
      },
    ],
  );
  for (const profile of original)
    assert.equal(
      first.db
        .prepare("SELECT preferences FROM profile WHERE profile_id=?")
        .get(profile.id)?.preferences,
      profile.preferences,
    );
  first.db.close();
  const reopened = fixture.connect();
  assert.deepEqual(await reopened.app.readDirectory(), directory);
  const application = await selectedCourse(reopened.app, { kind: "cursor" });
  if (application.kind !== "ready") assert.fail(application.message);
  assert.deepEqual(application.projection.owner, {
    profileId: "a-child",
    generation: "7",
  });
  for (const profile of original)
    assert.equal(
      reopened.db
        .prepare("SELECT preferences FROM profile WHERE profile_id=?")
        .get(profile.id)?.preferences,
      profile.preferences,
    );
});

for (const profile of [
  {
    id: "meaningful-preferences",
    generation: 0,
    revision: 0,
    preferences: '{"version":1,"writing":{"hand":"left"}}',
  },
  {
    id: "reset-generation",
    generation: 3,
    revision: 0,
    preferences: '{"version":1}',
  },
]) {
  test(`constructed V7 ${profile.id} without teaching retains routine entry`, async (t) => {
    const fixture = await storageFixture(t);
    const first = await constructedV7(fixture, [profile]);
    const directory = await first.app.readDirectory();
    assert.equal(directory.initialSetup.kind, "existingFamily");
    assert.equal(directory.selection.owner.profileId, profile.id);
    assert.equal(
      directory.selection.owner.generation,
      String(profile.generation),
    );
    assert.equal(
      first.db.prepare("SELECT count(*) AS count FROM task_run").get()?.count,
      0,
    );
    assert.equal(
      first.db.prepare("SELECT preferences FROM profile").get()?.preferences,
      profile.preferences,
    );
  });
}

test("a V8 failure immediately before actual migration COMMIT preserves the entire constructed V7 file", async (t) => {
  const fixture = await storageFixture(t);
  const old = await constructedV7(fixture, [
    {
      id: "rollback-child",
      generation: 0,
      revision: 0,
      preferences: '{ "version" : 1 }',
    },
  ]);
  const path = old.db.prepare("PRAGMA database_list").get()?.file;
  if (typeof path !== "string")
    assert.fail("The real SQLite file path is required");
  old.db.close();
  const before = createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
  let candidate: ReturnType<typeof fixture.connect> | undefined;
  let witnessed = false;
  candidate = fixture.connect({
    hook: async (sql, work) => {
      if (
        sql === "COMMIT" &&
        candidate?.db.prepare("PRAGMA user_version").get()?.user_version === 8
      ) {
        assert.equal(
          candidate.db
            .prepare(
              "SELECT count(*) AS count FROM schema_migration WHERE version=8",
            )
            .get()?.count,
          1,
        );
        assert.equal(
          candidate.db
            .prepare("SELECT count(*) AS count FROM installation_profile_state")
            .get()?.count,
          1,
        );
        witnessed = true;
        throw new Error("Injected V8 migration COMMIT failure");
      }
      return work();
    },
  });
  await assert.rejects(
    candidate.app.readDirectory(),
    /Injected V8 migration COMMIT failure/,
  );
  assert.equal(witnessed, true);
  candidate.db.close();
  assert.equal(
    createHash("sha256")
      .update(await readFile(path))
      .digest("hex"),
    before,
  );
  const recovered = fixture.connect();
  assert.deepEqual((await recovered.app.readDirectory()).selection.owner, {
    profileId: "rollback-child",
    generation: "0",
  });
  assert.equal(
    recovered.db.prepare("PRAGMA user_version").get()?.user_version,
    DATABASE_VERSION,
  );
});

test("V9 selection and administration tables enforce deferred ownership, supported versions and revision steps", async (t) => {
  const fixture = await storageFixture(t);
  const { app, db } = fixture.connect();
  const before = await app.readDirectory();
  const original = await databaseSnapshot(db);
  const originalSelection = db
    .prepare("SELECT * FROM installation_profile_state")
    .all();
  for (const sql of [
    "UPDATE installation_profile_state SET generation=1",
    "UPDATE installation_profile_state SET profile_id='another-child'",
  ]) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(sql);
      assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 1);
      assert.throws(() => db.exec("COMMIT"), /FOREIGN KEY constraint failed/);
    } finally {
      db.exec("ROLLBACK");
    }
    assert.deepEqual(
      db.prepare("SELECT * FROM installation_profile_state").all(),
      originalSelection,
    );
    assert.deepEqual(await app.readDirectory(), before);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const sql of [
      "UPDATE installation_profile_state SET installation_id='another-installation'",
      "UPDATE installation_profile_state SET selection_revision=-1",
      "UPDATE installation_profile_state SET initial_setup_mode='unknown'",
      "UPDATE installation_profile_state SET preparation_hash='not-a-hash'",
    ])
      assert.throws(() => db.exec(sql), /constraint failed/);
    const insert = db.prepare(
      "INSERT INTO profile_administration_receipt(installation_id,command_id,command_version,command,expected_revision,resulting_revision,payload_hash,result_version,result) VALUES(?,?,?,?,?,?,?,?,?)",
    );
    const installationId = before.administration.installationId;
    const parameters = [
      installationId,
      "constraint-command",
      1,
      "{}",
      0,
      1,
      "1".repeat(64),
      1,
      "{}",
    ];
    for (const [index, value] of [
      [0, "foreign-installation"],
      [2, 3],
      [3, "not-json"],
      [4, -1],
      [5, 2],
      [6, "bad-hash"],
      [7, 3],
      [8, "not-json"],
    ] satisfies readonly (readonly [number, string | number])[]) {
      const invalid = parameters.map((parameter, position) =>
        position === index ? value : parameter,
      );
      assert.throws(() => insert.run(...invalid), /constraint failed/);
    }
    insert.run(...parameters);
    assert.equal(
      db
        .prepare("SELECT count(*) AS count FROM profile_administration_receipt")
        .get()?.count,
      1,
    );
    assert.throws(() => insert.run(...parameters), /UNIQUE constraint failed/);
    assert.throws(
      () =>
        insert.run(
          installationId,
          "same-revision",
          1,
          "{}",
          0,
          1,
          "1".repeat(64),
          1,
          "{}",
        ),
      /UNIQUE constraint failed/,
    );
    insert.run(
      installationId,
      "version-two-command",
      2,
      "{}",
      1,
      2,
      "1".repeat(64),
      2,
      "{}",
    );
    assert.deepEqual(
      db
        .prepare(
          "SELECT command_version,result_version,expected_revision,resulting_revision FROM profile_administration_receipt WHERE command_id='version-two-command'",
        )
        .get(),
      Object.assign(Object.create(null), {
        command_version: 2,
        result_version: 2,
        expected_revision: 1,
        resulting_revision: 2,
      }),
    );
  } finally {
    db.exec("ROLLBACK");
  }
  assert.deepEqual(await app.readDirectory(), before);
  assert.equal(
    db
      .prepare("SELECT count(*) AS count FROM profile_administration_receipt")
      .get()?.count,
    0,
  );
  assert.deepEqual(await databaseSnapshot(db), original);
  db.close();
  const cold = fixture.connect();
  assert.deepEqual(await cold.app.readDirectory(), before);
  assert.deepEqual(await databaseSnapshot(cold.db), original);
  assert.deepEqual(cold.db.prepare("PRAGMA foreign_key_check").all(), []);
});
