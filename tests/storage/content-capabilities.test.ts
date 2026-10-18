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
  db.exec("BEGIN IMMEDIATE");
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
  db.exec("ROLLBACK");
  await initializeDatabase(executor, hash);
  assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 13);
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
  assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 13);
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

test("V2 rejects wrong, stale and repeated phase requests without SQL changes and retains ink through Skip and Undo", async (t) => {
  const {
    parseCommand,
    prepareInkCommand,
    parseId,
    encodeInkPoints,
    canonical,
    layerForPhase,
  } = await import("@readatthree/teaching");
  const { selectedInk, prepareSelectedInk, executeInk } =
    await import("./selected-support.ts");
  const content = await parseRuntimePackage(
      await syntheticPlanEnvelope(),
      hash,
    ),
    f = await storageFixture(t, content),
    { app, db } = await f.connectReady();
  const initial = await selectedProjection(app);
  assert.equal(initial.kind, "entry");
  if (initial.kind !== "entry") throw new Error("Entry missing");
  const task = resolvedLessons(content)[0]?.tasks.find(
    (entry) => entry.kind === "writingPracticePlanV2",
  );
  assert.ok(task);
  const start = initial.actions.find(
    (action) =>
      action.intent.kind === "start" && action.intent.taskId === task.task.id,
  );
  assert.ok(start);
  await executeTeaching(
    app,
    await prepareSelectedTeaching(app, () =>
      prepareCommand({
        projection: initial,
        request: { kind: "action", action: start },
        ids: f.ids,
        hash,
      }),
    ),
  );
  function graph() {
    return db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((row) => {
        if (typeof row.name !== "string") throw new Error("Table name missing");
        return [
          row.name,
          db.prepare(`SELECT * FROM "${row.name}" ORDER BY rowid`).all(),
        ];
      });
  }
  async function current() {
    const p = await selectedProjection(app);
    if (p.kind !== "writing") throw new Error("Writing required");
    return p;
  }
  async function draw() {
    const p = await current();
    if (p.turn.presentation.kind !== "writing")
      throw new Error("Writing target missing");
    const token = p.documents.find(
      (document) =>
        p.turn.presentation.kind === "writing" &&
        document.targetId === p.turn.presentation.targetId,
    );
    assert.ok(token);
    const layer = layerForPhase(token.phase),
      strokeId = parseId({ kind: "stroke", value: f.ids() });
    const begin = await prepareSelectedInk(app, () =>
      prepareInkCommand({
        token,
        edit: {
          kind: "begin",
          strokeId,
          layer,
          brush: {
            kind: "round",
            width: 4,
            colorRole: layer === "model" ? "model" : "child",
            cap: "round",
            join: "round",
          },
          chunks: [
            {
              chunkIndex: 0,
              firstPointIndex: 0,
              pointCount: 2,
              codecVersion: 1,
              payload: [
                ...encodeInkPoints({
                  points: [
                    { x: 100, y: 200, elapsedMs: 0 },
                    { x: 150, y: 220, elapsedMs: 20 },
                  ],
                  bounds: { width: 1600, height: 400 },
                }),
              ],
            },
          ],
        },
        ids: f.ids,
        hash,
      }),
    );
    const receipt = await executeInk(app, begin);
    assert.equal(receipt.kind, "inkCommitted");
    if (receipt.kind !== "inkCommitted") throw new Error("Ink did not commit");
    const final = await prepareSelectedInk(app, () =>
      prepareInkCommand({
        token: receipt.token,
        edit: {
          kind: "finalize",
          strokeId,
          layer,
          chunks: [],
          status: "finished",
        },
        ids: f.ids,
        hash,
      }),
    );
    assert.equal((await executeInk(app, final)).kind, "inkCommitted");
  }
  await draw();
  await act(app, f.ids, "continue");
  await act(app, f.ids, "continue");
  let p = await current();
  const tracing = p.actions.find(
    (action) => action.intent.kind === "confirmTracing",
  );
  assert.ok(tracing);
  const correct = await prepareWritingCommand({
    projection: p,
    action: tracing,
    barrier: { kind: "writing", documents: p.documents },
    ids: f.ids,
    hash,
  });
  assert.equal(correct.kind, "writingNavigate");
  if (correct.kind !== "writingNavigate")
    throw new Error("Phase command missing");
  const other = p.documents.find(
    (document) =>
      correct.payload.action.kind === "confirmTracing" &&
      document.targetId !== correct.payload.action.targetId,
  );
  assert.ok(other);
  const changes = [
    {
      action: {
        kind: "confirmTracing",
        targetId: other.targetId,
        nodeId: p.turn.id,
        phase: "childTracing",
      },
    },
    {
      action: {
        kind: "confirmIndependent",
        targetId:
          correct.payload.action.kind === "confirmTracing"
            ? correct.payload.action.targetId
            : other.targetId,
        nodeId: p.turn.id,
        phase: "childIndependentWriting",
      },
    },
    { expectedRevision: "999" },
  ];
  for (const change of changes) {
    const payload = {
      ...correct.payload,
      ...("action" in change ? { action: change.action } : {}),
    };
    const invalid = parseCommand({
      ...correct,
      commandId: f.ids(),
      expectedRevision:
        "expectedRevision" in change
          ? change.expectedRevision
          : correct.expectedRevision,
      payload,
      payloadHash: await hash(canonical({ kind: correct.kind, payload })),
    });
    const operation = await prepareSelectedTeaching(app, () => invalid),
      before = graph();
    assert.equal((await executeTeaching(app, operation)).kind, "rejected");
    assert.deepEqual(graph(), before);
  }
  await draw();
  p = await current();
  const validAction = p.actions.find(
    (action) => action.intent.kind === "confirmTracing",
  );
  assert.ok(validAction);
  const accepted = await prepareSelectedTeaching(app, () =>
    prepareWritingCommand({
      projection: p,
      action: validAction,
      barrier: { kind: "writing", documents: p.documents },
      ids: f.ids,
      hash,
    }),
  );
  const acceptedReceipt = await executeTeaching(app, accepted);
  assert.equal(acceptedReceipt.kind, "committed");
  const after = graph();
  assert.deepEqual(await executeTeaching(app, accepted), acceptedReceipt);
  assert.deepEqual(graph(), after);
  const next = await current();
  assert.equal(accepted.command.kind, "writingNavigate");
  if (accepted.command.kind !== "writingNavigate")
    throw new Error("Accepted phase command missing");
  const duplicatePayload = {
    ...accepted.command.payload,
    barrier: { kind: "writing", documents: next.documents },
  };
  const duplicate = parseCommand({
    ...accepted.command,
    commandId: f.ids(),
    expectedRevision: next.revision,
    payload: duplicatePayload,
    payloadHash: await hash(
      canonical({ kind: accepted.command.kind, payload: duplicatePayload }),
    ),
  });
  const beforeDuplicate = graph();
  assert.equal(
    (
      await executeTeaching(
        app,
        await prepareSelectedTeaching(app, () => duplicate),
      )
    ).kind,
    "rejected",
  );
  assert.deepEqual(graph(), beforeDuplicate);
  await draw();
  const beforeSkip = await current();
  const saved = await Promise.all(
    beforeSkip.documents.map((token) => selectedInk(app, { token })),
  );
  assert.equal(saved.flatMap((snapshot) => snapshot.strokes).length, 3);
  assert.equal((await act(app, f.ids, "skipWriting")).kind, "committed");
  const skipped = await selectedProjection(app);
  assert.equal(skipped.kind, "writingResult");
  if (skipped.kind !== "writingResult") throw new Error("Skip result missing");
  assert.equal(skipped.outcome, "skipped");
  assert.equal(skipped.runStatus, "skipped");
  const retained = await Promise.all(
    skipped.documents.map((token) => selectedInk(app, { token })),
  );
  assert.deepEqual(
    retained.map((snapshot) => snapshot.strokes),
    saved.map((snapshot) => snapshot.strokes),
  );
  assert.deepEqual(
    retained.map((snapshot) => snapshot.histories),
    saved.map((snapshot) => snapshot.histories),
  );
  assert.equal((await act(app, f.ids, "undoAdvance")).kind, "committed");
  const restored = await current();
  assert.equal(restored.turn.id, beforeSkip.turn.id);
  const resumed = await Promise.all(
    restored.documents.map((token) => selectedInk(app, { token })),
  );
  assert.deepEqual(
    resumed.map((snapshot) => snapshot.strokes),
    saved.map((snapshot) => snapshot.strokes),
  );
  assert.deepEqual(
    resumed.map((snapshot) => snapshot.histories),
    saved.map((snapshot) => snapshot.histories),
  );
});
