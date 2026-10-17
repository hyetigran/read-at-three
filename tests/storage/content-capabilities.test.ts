import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  canonical,
  parseRuntimePackage,
  prepareCommand,
  prepareWritingCommand,
  resolvedLessons,
} from "@readatthree/teaching";
import { migrations } from "../../packages/storage/src/generated-migration.ts";
import { initializeDatabase } from "../../packages/storage/src/migration.ts";
import { hash, storageFixture, executorFor } from "./support.ts";
import {
  executeTeaching,
  prepareSelectedTeaching,
  selectedProjection,
} from "./selected-support.ts";
import { syntheticPlanEnvelope } from "../lesson-two-fixture.ts";
import type {
  SelectedApplication,
  TeachingIntent,
  AvailableAction,
} from "@readatthree/teaching";

async function act(
  app: SelectedApplication,
  ids: () => string,
  kind: TeachingIntent["kind"],
) {
  const projection = await selectedProjection(app);
  if (projection.kind === "recovery") throw new Error(projection.message);
  const action = projection.actions.find(
    (action) => action.intent.kind === kind,
  );
  assert.ok(action, `Missing ${kind} at ${projection.kind}`);
  return executeTeaching(
    app,
    await prepareSelectedTeaching(app, () =>
      projection.kind === "writing" || projection.kind === "writingResult"
        ? prepareWritingCommand({
            projection,
            action,
            barrier: { kind: "writing", documents: projection.documents },
            ids,
            hash,
          })
        : prepareCommand({
            projection,
            request: { kind: "action", action },
            ids,
            hash,
          }),
    ),
  );
}

test("V10 widens installed content without losing existing foreign-key linked package rows and physically rolls back failed COMMIT", async (t) => {
  const f = await storageFixture(t),
    { db, executor } = f.connect();
  db.exec("PRAGMA foreign_keys=ON");
  for (const migration of migrations.filter((item) => item.version <= 9)) {
    db.exec("BEGIN IMMEDIATE");
    for (const statement of migration.statements) db.exec(statement);
    db.prepare("INSERT INTO schema_migration VALUES(?,?,?)").run(
      migration.version,
      migration.id,
      await hash(migration.statements.join("\n")),
    );
    db.exec(`PRAGMA user_version=${migration.version}`);
    db.exec("COMMIT");
  }
  db.prepare(
    "INSERT INTO installation VALUES('fixture.installation',0,9,1)",
  ).run();
  const manifest = await readFile(
    "tests/fixtures/graph-development-package.json",
    "utf8",
  );
  const content = await parseRuntimePackage(JSON.parse(manifest), hash);
  db.prepare(
    "INSERT INTO installed_package VALUES(?,?,?,1,?,1,?,'ready',?)",
  ).run(
    content.packageHash,
    content.body.courseId,
    content.body.releaseId,
    canonical([content.body.coverage]),
    Buffer.from(canonical(content)),
    content.packageHash,
  );
  db.prepare("INSERT INTO course_activation VALUES(?,?,NULL,0)").run(
    content.body.courseId,
    content.packageHash,
  );
  const beforePackage = db.prepare("SELECT * FROM installed_package").all(),
    beforeActivation = db.prepare("SELECT * FROM course_activation").all();
  const file = db.prepare("PRAGMA database_list").get()?.file;
  assert.equal(typeof file, "string");
  if (typeof file !== "string") throw new Error("Real SQLite path missing");
  const bytes = await readFile(file);
  let commitObserved = false;
  const fault = executorFor(db, async (sql, work) => {
    if (sql === "COMMIT") {
      commitObserved = true;
      assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 10);
      assert.deepEqual(
        db.prepare("SELECT * FROM installed_package").all(),
        beforePackage,
      );
      assert.deepEqual(
        db.prepare("SELECT * FROM course_activation").all(),
        beforeActivation,
      );
      assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
      throw new Error("Injected V10 COMMIT failure");
    }
    return work();
  });
  await assert.rejects(
    () => initializeDatabase(fault, hash),
    /Injected V10 COMMIT failure/,
  );
  assert.equal(commitObserved, true);
  assert.deepEqual(await readFile(file), bytes);
  assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 9);
  assert.equal(db.prepare("PRAGMA foreign_keys").get()?.foreign_keys, 1);
  let committedAcknowledgementLost = false;
  const lostAcknowledgement = executorFor(db, async (sql, work) => {
    const result = await work();
    if (sql === "COMMIT") {
      committedAcknowledgementLost = true;
      throw new Error("Injected V10 lost COMMIT acknowledgement");
    }
    return result;
  });
  await assert.rejects(
    () => initializeDatabase(lostAcknowledgement, hash),
    /lost COMMIT acknowledgement/,
  );
  assert.equal(committedAcknowledgementLost, true);
  assert.equal(db.prepare("PRAGMA foreign_keys").get()?.foreign_keys, 1);
  assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 10);
  const committedBytes = await readFile(file);
  await initializeDatabase(executor, hash);
  assert.deepEqual(await readFile(file), committedBytes);
  assert.deepEqual(
    db.prepare("SELECT * FROM installed_package").all(),
    beforePackage,
  );
  assert.deepEqual(
    db.prepare("SELECT * FROM course_activation").all(),
    beforeActivation,
  );
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 10);
  const newHash = "f".repeat(64);
  db.prepare(
    "INSERT INTO installed_package VALUES(?,?,?,2,?,1,?,'ready',?)",
  ).run(
    newHash,
    "fixture.new.course",
    "fixture.new.release",
    "[]",
    Buffer.from("{}"),
    newHash,
  );
  assert.throws(
    () =>
      db
        .prepare(
          "UPDATE installed_package SET content_schema_version=3 WHERE package_hash=?",
        )
        .run(newHash),
    /CHECK/,
  );
});

test("V2 writing uses one durable executor with eight turns, explicit phase confirmation, restart and terminal Undo", async (t) => {
  const content = await parseRuntimePackage(
      await syntheticPlanEnvelope(),
      hash,
    ),
    f = await storageFixture(t, content);
  let { app, db } = await f.connectReady();
  const entry = await selectedProjection(app);
  assert.equal(entry.kind, "entry");
  if (entry.kind !== "entry") return;
  const writing = resolvedLessons(content)[0]?.tasks.find(
    (task) => task.kind === "writingPracticePlanV2",
  );
  assert.ok(writing);
  const start = entry.actions.find(
    (action) =>
      action.intent.kind === "start" &&
      action.intent.taskId === writing.task.id,
  );
  assert.ok(start);
  assert.equal(
    (
      await executeTeaching(
        app,
        await prepareSelectedTeaching(app, () =>
          prepareCommand({
            projection: entry,
            request: { kind: "action", action: start },
            ids: f.ids,
            hash,
          }),
        ),
      )
    ).kind,
    "committed",
  );
  const phases = [];
  let confirmations = 0;
  for (let index = 0; index < 8; index++) {
    const p = await selectedProjection(app);
    assert.equal(p.kind, "writing");
    if (p.kind !== "writing") throw new Error("Writing turn missing");
    assert.equal(p.documents.length, 2);
    const obligation =
      p.turn.presentation.kind === "writing"
        ? p.turn.presentation.obligation
        : null;
    assert.ok(obligation);
    phases.push(obligation.kind);
    assert.equal(
      p.documents.find(
        (document) =>
          p.turn.presentation.kind === "writing" &&
          document.targetId === p.turn.presentation.targetId,
      )?.phase,
      obligation.kind === "phaseConfirmation"
        ? obligation.phase
        : "parentDemonstration",
    );
    if (index === 1 || index === 5) assert.equal(p.turn.parentRole, "listen");
    const other = p.documents[1];
    assert.ok(other);
    const fake = {
      label: { kind: "added", text: "Synthetic invalid phase" },
      intent: {
        kind: "confirmTracing",
        targetId: other.targetId,
        nodeId: p.turn.id,
        phase: "childTracing",
      },
    } satisfies AvailableAction;
    await assert.rejects(() =>
      prepareWritingCommand({
        projection: p,
        action: fake,
        barrier: { kind: "writing", documents: p.documents },
        ids: f.ids,
        hash,
      }),
    );
    const kind =
      obligation.kind === "phaseConfirmation"
        ? obligation.phase === "childTracing"
          ? "confirmTracing"
          : "confirmIndependent"
        : "continue";
    if (obligation.kind === "phaseConfirmation") {
      confirmations++;
      assert.ok(!p.actions.some((action) => action.intent.kind === "continue"));
    }
    assert.equal((await act(app, f.ids, kind)).kind, "committed");
    if (index === 2) {
      db.close();
      ({ app, db } = f.connect());
      const recovery = await app.openRecovery({ kind: "cold" });
      await app.reconcileRecovery({
        recoveryId: recovery.recoveryId,
        choice: { kind: "cold" },
      });
    }
  }
  assert.deepEqual(phases, [
    "parentModel",
    "soundResponse",
    "phaseConfirmation",
    "phaseConfirmation",
    "parentModel",
    "soundResponse",
    "phaseConfirmation",
    "phaseConfirmation",
  ]);
  assert.equal(confirmations, 4);
  const result = await selectedProjection(app);
  assert.equal(result.kind, "writingResult");
  if (result.kind !== "writingResult")
    throw new Error("Writing result missing");
  assert.equal(result.outcome, "completed");
  assert.equal((await act(app, f.ids, "undoAdvance")).kind, "committed");
  const undone = await selectedProjection(app);
  assert.equal(undone.kind, "writing");
  assert.equal((await act(app, f.ids, "confirmIndependent")).kind, "committed");
});
