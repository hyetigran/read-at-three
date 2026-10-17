import { drizzle } from "drizzle-orm/sqlite-proxy";
import { decodePersonalReceipt } from "../../packages/storage/src/index.ts";
import { sqlValues } from "../../packages/storage/src/executor.ts";
import { commandReceipt } from "../../packages/storage/src/schema.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  parseCounter,
  parseId,
  parseHash,
  parseProfileRemovalReceipt,
  prepareProfileRemoval,
} from "@readatthree/teaching";
import type { ProfileRemovalIntent } from "@readatthree/teaching";
import { profileFixture } from "./profile-support.ts";
import { hash } from "./support.ts";

async function removal(
  fixture: Awaited<ReturnType<typeof profileFixture>>,
  app: ReturnType<typeof fixture.connect>["app"],
  build: (
    intent: Pick<ProfileRemovalIntent, "target" | "directory">,
  ) => ProfileRemovalIntent,
) {
  const directory = await app.readDirectory();
  const target = directory.profiles.find(
    (profile) =>
      profile.edit.owner.profileId === directory.selection.owner.profileId,
  );
  assert.ok(target);
  return prepareProfileRemoval({
    intent: build({ target: target.edit, directory: directory.administration }),
    selection: directory.selection,
    departure: await app.readDeparture({ selection: directory.selection }),
    ids: fixture.ids,
    hash,
  });
}

test("reset retires the complete writing graph and exact old retries while preserving identity and preferences", async (t) => {
  const fixture = await profileFixture(t),
    { app, db, executor } = fixture.connect();
  const repository = drizzle(async (sql, parameters) =>
    executor.execute(sql, sqlValues(parameters)),
  );
  const owner = await fixture.setup(app);
  await fixture.start(app);
  await fixture.draw(app, 73);
  const before = await app.readDirectory();
  const legacyRows = await repository.select().from(commandReceipt).all();
  const legacyKinds = new Set(
    legacyRows.map((row) => decodePersonalReceipt(row).kind),
  );
  assert.deepEqual(legacyKinds, new Set(["committed", "inkCommitted"]));
  for (const row of legacyRows)
    assert.deepEqual(decodePersonalReceipt(row), JSON.parse(row.result));
  const command = await removal(fixture, app, (intent) => ({
    ...intent,
    kind: "resetProfile",
  }));
  const result = await app.administer(command);
  assert.equal(result.kind, "profileCommitted");
  if (
    result.kind !== "profileCommitted" ||
    !("selection" in result) ||
    result.effect.kind !== "reset"
  )
    assert.fail("Reset must expose its new generation");
  assert.deepEqual(result.selection.owner, { ...owner, generation: "1" });
  const after = await app.readDirectory();
  assert.deepEqual(
    after.profiles[0].preferences,
    before.profiles[0].preferences,
  );
  assert.equal(
    after.profiles[0].edit.revision,
    (BigInt(before.profiles[0].edit.revision) + 1n).toString(),
  );
  assert.equal(after.selection.revision, "1");
  assert.equal(after.administration.revision, "3");
  assert.deepEqual(after.preparation, before.preparation);
  for (const table of [
    "session",
    "task_run",
    "task_advance",
    "advance_withdrawal",
    "task_credit",
    "task_result",
    "lesson_credit",
    "lesson_result",
    "ink_document",
    "ink_stroke",
    "ink_point_chunk",
    "ink_history",
    "ink_operation",
    "course_cursor",
  ])
    assert.equal(
      db.prepare(`SELECT count(*) AS count FROM ${table}`).get()?.count,
      0,
      table,
    );
  const saved = db.prepare("SELECT * FROM command_receipt").all();
  assert.equal(saved.length, 1);
  assert.equal(saved[0]?.owner_generation, 1);
  assert.equal(saved[0]?.result_version, 2);
  assert.equal(typeof saved[0]?.result, "string");
  assert.deepEqual(
    parseProfileRemovalReceipt(JSON.parse(String(saved[0]?.result))),
    result,
  );
  const [personal] = await repository.select().from(commandReceipt).all();
  assert.ok(personal);
  assert.deepEqual(decodePersonalReceipt(personal), result);
  assert.throws(
    () => decodePersonalReceipt({ ...personal, resultVersion: 99 }),
    /unsupported/,
  );
  const retry = await app.administer(command);
  assert.equal(retry.kind, "rejected");
  if (retry.kind === "rejected") assert.equal(retry.code, "stale-owner");
  assert.deepEqual(await app.readDirectory(), after);
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  db.close();
  const reopened = fixture.connect();
  const inventory = await reopened.app.openRecovery({ kind: "cold" });
  await reopened.app.reconcileRecovery({
    recoveryId: inventory.recoveryId,
    choice: { kind: "cold" },
  });
  assert.deepEqual(await reopened.app.readDirectory(), after);
});

test("deletion preserves another child's exact work, equal-text name and unrelated exact retry", async (t) => {
  const fixture = await profileFixture(t),
    { app, db } = fixture.connect();
  const ownerA = await fixture.setup(app);
  await fixture.start(app);
  await fixture.draw(app, 12);
  const created = await fixture.change(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl", displayName: ownerA.profileId },
  }));
  if (created.result.effect.kind !== "created")
    assert.fail("B must be created");
  const ownerB = created.result.effect.target.owner;
  await fixture.start(app);
  await fixture.draw(app, 98);
  const b = (await app.readDirectory()).profiles.find(
    (p) => p.edit.owner.profileId === ownerB.profileId,
  );
  assert.ok(b);
  const named = await fixture.change(app, (directory) => ({
    kind: "setDisplayName",
    directory: directory.administration,
    target: b.edit,
    displayName: ownerA.profileId,
  }));
  await fixture.change(app, (directory) => ({
    kind: "selectProfile",
    directory: directory.administration,
    target: ownerA,
  }));
  const bRows = () => ({
    profile: db
      .prepare("SELECT * FROM profile WHERE profile_id=?")
      .all(ownerB.profileId),
    sessions: db
      .prepare("SELECT * FROM session WHERE profile_id=?")
      .all(ownerB.profileId),
    runs: db
      .prepare("SELECT * FROM task_run WHERE profile_id=?")
      .all(ownerB.profileId),
    docs: db
      .prepare("SELECT * FROM ink_document WHERE profile_id=?")
      .all(ownerB.profileId),
    strokes: db
      .prepare(
        "SELECT * FROM ink_stroke WHERE document_id IN (SELECT document_id FROM ink_document WHERE profile_id=?)",
      )
      .all(ownerB.profileId),
    receipts: db
      .prepare("SELECT * FROM command_receipt WHERE owner_profile_id=?")
      .all(ownerB.profileId),
    admin: db
      .prepare(
        "SELECT * FROM profile_administration_receipt WHERE command_id=?",
      )
      .all(named.command.commandId),
    packages: db.prepare("SELECT * FROM installed_package").all(),
    activation: db.prepare("SELECT * FROM course_activation").all(),
  });
  const before = bRows();
  const command = await removal(fixture, app, (intent) => ({
    ...intent,
    kind: "deleteProfile",
    successor: { kind: "existing", owner: ownerB },
  }));
  const result = await app.administer(command);
  assert.equal(result.kind, "profileCommitted");
  if (result.kind !== "profileCommitted") assert.fail("Deletion must commit");
  assert.deepEqual(result, {
    kind: "profileCommitted",
    version: 2,
    commandId: command.commandId,
    payloadHash: command.payloadHash,
    expectedRevision: command.scope.revision,
    administration: {
      installationId: command.scope.installationId,
      revision: parseCounter((BigInt(command.scope.revision) + 1n).toString()),
    },
    effect: { kind: "deleted" },
  });
  assert.deepEqual(bRows(), before);
  const directory = await app.readDirectory();
  assert.equal(directory.profiles.length, 1);
  assert.deepEqual(directory.selection.owner, ownerB);
  assert.equal(directory.profiles[0].preferences.displayName, ownerA.profileId);
  assert.equal(
    db
      .prepare("SELECT count(*) AS count FROM profile WHERE profile_id=?")
      .get(ownerA.profileId)?.count,
    0,
  );
  assert.equal(
    db
      .prepare("SELECT count(*) AS count FROM session WHERE profile_id=?")
      .get(ownerA.profileId)?.count,
    0,
  );
  assert.equal(
    db
      .prepare("SELECT count(*) AS count FROM ink_document WHERE profile_id=?")
      .get(ownerA.profileId)?.count,
    0,
  );
  assert.deepEqual(await app.administer(named.command), named.result);
  assert.deepEqual(await app.administer(command), result);
  assert.deepEqual(await app.readDirectory(), directory);
  const evidence = db
    .prepare(
      "SELECT command,result FROM profile_administration_receipt WHERE evidence_kind != 'full'",
    )
    .all();
  for (const row of evidence) {
    assert.deepEqual(Object.keys(JSON.parse(String(row.command))).sort(), [
      "commandId",
      "expectedRevision",
      "installationId",
      "payloadHash",
      "resultingRevision",
      "version",
    ]);
    assert.equal(
      Object.hasOwn(JSON.parse(String(row.result)), "selection"),
      false,
    );
  }
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
});

test("final-child deletion requires the confirmed fresh replacement and allocates no teaching", async (t) => {
  const fixture = await profileFixture(t),
    { app, db } = fixture.connect();
  const owner = await fixture.setup(app);
  const before = await app.readDirectory();
  const command = await removal(fixture, app, (intent) => ({
    ...intent,
    kind: "deleteProfile",
    successor: {
      kind: "replacement",
      preferences: { avatarId: "fox", displayName: "New child" },
    },
  }));
  const result = await app.administer(command);
  assert.equal(result.kind, "profileCommitted");
  const after = await app.readDirectory();
  assert.equal(after.profiles.length, 1);
  assert.notEqual(after.selection.owner.profileId, owner.profileId);
  assert.equal(after.selection.owner.generation, "0");
  assert.deepEqual(after.profiles[0].preferences, {
    version: 1,
    avatarId: "fox",
    displayName: "New child",
  });
  assert.deepEqual(after.preparation, before.preparation);
  assert.equal(after.initialSetup.kind, "complete");
  for (const table of [
    "session",
    "task_run",
    "course_cursor",
    "command_receipt",
    "ink_document",
  ])
    assert.equal(
      db.prepare(`SELECT count(*) AS count FROM ${table}`).get()?.count,
      0,
    );
});

for (const failure of ["before", "after"] satisfies readonly (
  "before" | "after"
)[]) {
  test(`deletion ${failure}-COMMIT failure uses exact retry without resurrecting the removed owner`, async (t) => {
    const fixture = await profileFixture(t);
    let armed = false;
    const { app, db } = fixture.connect({
      hook: async (sql, work) => {
        if (armed && sql === "COMMIT" && failure === "before")
          throw new Error("injected deletion commit failure");
        const result = await work();
        if (armed && sql === "COMMIT" && failure === "after")
          throw new Error("injected deletion acknowledgement loss");
        return result;
      },
    });
    const owner = await fixture.setup(app);
    await fixture.start(app);
    await fixture.draw(app);
    const before = await app.readDirectory();
    const command = await removal(fixture, app, (intent) => ({
      ...intent,
      kind: "deleteProfile",
      successor: { kind: "replacement", preferences: { avatarId: "cat" } },
    }));
    armed = true;
    await assert.rejects(app.administer(command), /injected deletion/);
    armed = false;
    assert.equal(
      (await app.readDirectory()).selection.owner.profileId === owner.profileId,
      failure === "before",
    );
    if (failure === "before")
      assert.deepEqual(await app.readDirectory(), before);
    db.close();
    const reopened = fixture.connect();
    const inventory = await reopened.app.openRecovery({
      kind: "warm",
      selection: command.selection,
      retainedStrokeIds: [],
      teaching: null,
      administration: command,
    });
    const recovered = await reopened.app.recoverAdministration({
      recoveryId: inventory.recoveryId,
      command,
    });
    assert.equal(recovered.result.kind, "profileCommitted");
    assert.equal(
      recovered.resolution,
      failure === "before" ? "applied" : "receiptOnly",
    );
    const repeated = await reopened.app.recoverAdministration({
      recoveryId: inventory.recoveryId,
      command,
    });
    assert.equal(repeated.resolution, "receiptOnly");
    assert.deepEqual(repeated.result, recovered.result);
    await reopened.app.reconcileRecovery({
      recoveryId: inventory.recoveryId,
      choice: { kind: "warm", settledStrokeIds: [] },
    });
    assert.notEqual(
      (await reopened.app.readDirectory()).selection.owner.profileId,
      owner.profileId,
    );
    assert.equal(
      reopened.db.prepare("SELECT count(*) AS count FROM session").get()?.count,
      0,
    );
  });
}

test("unselected removal, stale departure and unsettled capture reject before any teaching is settled", async (t) => {
  const fixture = await profileFixture(t),
    { app, db } = fixture.connect();
  const ownerA = await fixture.setup(app);
  await fixture.change(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "bear" },
  }));
  await fixture.start(app);
  const directory = await app.readDirectory(),
    a = directory.profiles.find(
      (profile) => profile.edit.owner.profileId === ownerA.profileId,
    );
  assert.ok(a);
  const command = await removal(fixture, app, (intent) => ({
    ...intent,
    target: a.edit,
    kind: "resetProfile",
  }));
  const rows = () => [
    db.prepare("SELECT * FROM profile").all(),
    db.prepare("SELECT * FROM session").all(),
    db.prepare("SELECT * FROM task_run").all(),
    db.prepare("SELECT * FROM ink_document").all(),
    db.prepare("SELECT * FROM profile_administration_receipt").all(),
  ];
  const before = rows();
  const rejected = await app.administer(command);
  assert.equal(rejected.kind, "rejected");
  if (rejected.kind === "rejected")
    assert.equal(rejected.code, "unselected-target");
  assert.deepEqual(rows(), before);
  const stale = await removal(fixture, app, (intent) => ({
    ...intent,
    kind: "resetProfile",
  }));
  await fixture.draw(app, 44);
  const written = rows();
  const staleResult = await app.administer(stale);
  assert.equal(staleResult.kind, "rejected");
  if (staleResult.kind === "rejected")
    assert.equal(staleResult.code, "stale-departure");
  assert.deepEqual(rows(), written);
  const { token } = await fixture.current(app);
  await fixture.edit(app, token, {
    kind: "begin",
    strokeId: parseId({ kind: "stroke", value: fixture.ids() }),
    layer: "tracing",
    brush: {
      kind: "round",
      width: 5,
      colorRole: "child",
      cap: "round",
      join: "round",
    },
    chunks: [],
  });
  const pending = await removal(fixture, app, (intent) => ({
    ...intent,
    kind: "resetProfile",
  }));
  const capturing = rows();
  const captureResult = await app.administer(pending);
  assert.equal(captureResult.kind, "rejected");
  if (captureResult.kind === "rejected")
    assert.equal(captureResult.code, "unsettled-capture");
  assert.deepEqual(rows(), capturing);
});

test("reset removes a real withdrawn advance before its immediate FK parents", async (t) => {
  const fixture = await profileFixture(t),
    { app, db } = fixture.connect();
  await fixture.setup(app);
  await fixture.start(app);
  await fixture.action(app, "skipWriting");
  await fixture.action(app, "undoAdvance");
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM advance_withdrawal").get()?.count,
    1,
  );
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM task_credit").get()?.count,
    1,
  );
  const command = await removal(fixture, app, (intent) => ({
    ...intent,
    kind: "resetProfile",
  }));
  assert.equal((await app.administer(command)).kind, "profileCommitted");
  for (const table of [
    "advance_withdrawal",
    "task_advance",
    "task_run",
    "task_credit",
    "task_result",
  ])
    assert.equal(
      db.prepare(`SELECT count(*) AS count FROM ${table}`).get()?.count,
      0,
    );
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
});

test("a conflicting deletion identity and a genuinely pruned deletion receipt cannot execute the retired request", async (t) => {
  const fixture = await profileFixture(t),
    { app, db } = fixture.connect();
  await fixture.setup(app);
  const command = await removal(fixture, app, (intent) => ({
    ...intent,
    kind: "deleteProfile",
    successor: { kind: "replacement", preferences: { avatarId: "cat" } },
  }));
  assert.equal((await app.administer(command)).kind, "profileCommitted");
  const changed = {
    ...command,
    payload: {
      ...command.payload,
      target: { ...command.payload.target, revision: parseCounter("90") },
    },
  };
  const conflicting = {
    ...changed,
    payloadHash: parseHash({
      kind: "payload",
      value: await hash(
        canonical({
          version: changed.version,
          scope: changed.scope,
          selection: changed.selection,
          payload: changed.payload,
        }),
      ),
    }),
  };
  const conflict = await app.administer(conflicting);
  assert.equal(conflict.kind, "rejected");
  if (conflict.kind === "rejected")
    assert.equal(conflict.code, "command-identity");
  for (let index = 0; index < 256; index++)
    await fixture.change(app, (directory) => ({
      kind: "setAvatar",
      directory: directory.administration,
      target: directory.profiles[0].edit,
      avatarId: "cat",
    }));
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS count FROM profile_administration_receipt WHERE command_id=?",
      )
      .get(command.commandId)?.count,
    0,
  );
  const before = await app.readDirectory();
  const stale = await app.administer(command);
  assert.equal(stale.kind, "rejected");
  if (stale.kind === "rejected") assert.equal(stale.code, "stale-owner");
  assert.deepEqual(await app.readDirectory(), before);
  assert.equal(before.profiles.length, 1);
});

for (const corruption of [
  "wrong deletion revision step",
  "noncanonical deletion bytes",
  "noncanonical deletion identity",
  "disagreeing deletion versions",
  "wrong supported deletion version",
  "full evidence containing a deletion identity",
  "retired evidence containing a deletion result",
  "unsupported retired version",
]) {
  for (const operation of ["retry", "reset"]) {
    test(`constructed ${corruption} rejects ${operation} without changing any SQLite state`, async (t) => {
      const fixture = await profileFixture(t),
        { app, db } = fixture.connect();
      await fixture.setup(app);
      const deletion = await removal(fixture, app, (intent) => ({
        ...intent,
        kind: "deleteProfile",
        successor: { kind: "replacement", preferences: { avatarId: "fox" } },
      }));
      const deleted = await app.administer(deletion);
      if (
        deleted.kind !== "profileCommitted" ||
        deleted.version !== 2 ||
        deleted.effect.kind !== "deleted"
      )
        assert.fail("The original deletion must commit");
      await fixture.start(app);
      await fixture.draw(app, 61);
      const reset = await removal(fixture, app, (intent) => ({
        ...intent,
        kind: "resetProfile",
      }));
      switch (corruption) {
        case "wrong deletion revision step":
          assert.throws(
            () =>
              parseProfileRemovalReceipt({ ...deleted, expectedRevision: "0" }),
            /revision step/,
          );
          db.prepare(
            "UPDATE profile_administration_receipt SET result=? WHERE command_id=?",
          ).run(
            canonical({ ...deleted, expectedRevision: "0" }),
            deletion.commandId,
          );
          break;
        case "noncanonical deletion bytes":
          db.prepare(
            "UPDATE profile_administration_receipt SET result=? WHERE command_id=?",
          ).run(JSON.stringify(deleted, null, 2), deletion.commandId);
          break;
        case "noncanonical deletion identity": {
          const row = db
            .prepare(
              "SELECT command FROM profile_administration_receipt WHERE command_id=?",
            )
            .get(deletion.commandId);
          assert.equal(typeof row?.command, "string");
          db.prepare(
            "UPDATE profile_administration_receipt SET command=? WHERE command_id=?",
          ).run(
            JSON.stringify(JSON.parse(String(row?.command)), null, 2),
            deletion.commandId,
          );
          break;
        }
        case "disagreeing deletion versions":
          db.prepare(
            "UPDATE profile_administration_receipt SET result_version=1 WHERE command_id=?",
          ).run(deletion.commandId);
          break;
        case "wrong supported deletion version":
          db.prepare(
            "UPDATE profile_administration_receipt SET command_version=1,result_version=1,command=? WHERE command_id=?",
          ).run(
            canonical({
              installationId: deletion.scope.installationId,
              commandId: deletion.commandId,
              version: 1,
              expectedRevision: deletion.scope.revision,
              resultingRevision: deleted.administration.revision,
              payloadHash: deletion.payloadHash,
            }),
            deletion.commandId,
          );
          break;
        case "full evidence containing a deletion identity":
          db.prepare(
            "UPDATE profile_administration_receipt SET evidence_kind='full' WHERE command_id=?",
          ).run(deletion.commandId);
          break;
        case "retired evidence containing a deletion result":
          db.prepare(
            "UPDATE profile_administration_receipt SET evidence_kind='retired' WHERE command_id=?",
          ).run(deletion.commandId);
          break;
        case "unsupported retired version": {
          const [row] = db
            .prepare(
              "SELECT * FROM profile_administration_receipt WHERE command_id=?",
            )
            .all(deletion.commandId);
          assert.ok(row);
          db.exec("PRAGMA ignore_check_constraints=ON");
          db.prepare(
            "UPDATE profile_administration_receipt SET evidence_kind='retired',command_version=3,result_version=3,command=?,result='{}' WHERE command_id=?",
          ).run(
            canonical({
              installationId: row.installation_id,
              commandId: row.command_id,
              version: 3,
              expectedRevision: String(row.expected_revision),
              resultingRevision: String(row.resulting_revision),
              payloadHash: row.payload_hash,
            }),
            deletion.commandId,
          );
          db.exec("PRAGMA ignore_check_constraints=OFF");
          break;
        }
      }
      const raw = () => {
        const schema = db
          .prepare("SELECT * FROM sqlite_schema ORDER BY type,name")
          .all();
        const tables = db
          .prepare(
            "SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name",
          )
          .all();
        return {
          schema,
          tables: tables.map((row) => {
            assert.equal(typeof row.name, "string");
            const name = String(row.name);
            return {
              name,
              rows: db
                .prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`)
                .all(),
            };
          }),
          userVersion: db.prepare("PRAGMA user_version").all(),
        };
      };
      const before = raw();
      await assert.rejects(
        app.administer(operation === "retry" ? deletion : reset),
      );
      assert.deepEqual(raw(), before);
      assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
    });
  }
}
