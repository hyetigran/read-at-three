import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseProjection } from "@readatthree/teaching";
import { syntheticPrintedPair } from "../printed-board-fixture.ts";
import { storageFixture } from "./support.ts";
import { selectedProjection, selectedCourse } from "./selected-support.ts";

test("printed slow acceptance leaves fast due through physical SQLite reopen and serializable projection", async (t) => {
  const { content, taskId } = await syntheticPrintedPair();
  const f = await storageFixture(t, content);
  const first = await f.connectReady();
  await f.act(
    first.app,
    "start",
    (action) => "taskId" in action.intent && action.intent.taskId === taskId,
  );
  let view = await selectedProjection(first.app);
  assert.equal(view.kind, "teaching");
  if (view.kind !== "teaching") throw new Error("Teaching required");
  assert.equal(view.turn.id, "fixture.board.slow");
  assert.deepEqual(parseProjection(JSON.parse(JSON.stringify(view))), view);
  await f.act(first.app, "continue");
  view = await selectedProjection(first.app);
  assert.equal(view.kind, "teaching");
  if (view.kind !== "teaching") throw new Error("Fast response required");
  assert.equal(view.turn.id, "fixture.board.fast");
  assert.equal(first.db.prepare("PRAGMA user_version").get()?.user_version, 13);
  const before = view;
  first.db.close();
  const next = f.connect();
  await next.app.readDirectory();
  view = await selectedProjection(next.app);
  assert.deepEqual(view, before);
  await f.act(next.app, "continue");
  assert.equal((await selectedProjection(next.app)).kind, "completed");
  const course = await selectedCourse(next.app);
  assert.equal(course.kind, "ready");
  if (course.kind !== "ready") throw new Error("Course required");
  assert.equal(course.course.lessons[2]?.progress, "unfinished");
  assert.equal(course.course.lessons[2]?.tasks[3]?.outcome, "completed");
});

import { syntheticPrintedCourse } from "../printed-board-fixture.ts";
import { hash } from "./support.ts";
import { prepareCommand, resolvedLessons } from "@readatthree/teaching";
import {
  prepareSelectedTeaching,
  executeTeaching,
} from "./selected-support.ts";
for (const fastIndex of [1, 3, 5, 7, 9, 11]) {
  test(`fast obligation ${fastIndex} survives navigation, physical restart and exact commit Retry`, async (t) => {
    const { content } = await syntheticPrintedCourse();
    const f = await storageFixture(t, content);
    let fault: "none" | "before" | "after" = "none";
    const hook: import("./support.ts").SqlHook = async (sql, work) => {
      if (sql === "COMMIT" && fault === "before") {
        fault = "none";
        throw new Error("Synthetic before COMMIT");
      }
      const result = await work();
      if (sql === "COMMIT" && fault === "after") {
        fault = "none";
        throw new Error("Synthetic committed reply loss");
      }
      return result;
    };
    let connection = await f.connectReady({ hook });
    const taskId = resolvedLessons(content)[2]?.tasks.find(
      (entry) => entry.task.number === 4,
    )?.task.id;
    assert.ok(taskId);
    await f.act(
      connection.app,
      "start",
      (a) => "taskId" in a.intent && a.intent.taskId === taskId,
    );
    for (let index = 0; index < fastIndex; index++)
      await f.act(connection.app, "continue");
    async function fastDue() {
      const view = await selectedProjection(connection.app);
      assert.equal(view.kind, "teaching");
      if (view.kind !== "teaching") throw new Error("Fast due");
      assert.equal(view.turn.id, `fixture.printed.t4.n${fastIndex}`);
      return view;
    }
    await fastDue();
    await f.act(connection.app, "repeat");
    await f.act(connection.app, "continue");
    await fastDue();
    await f.act(connection.app, "back");
    await f.act(connection.app, "continue");
    await fastDue();
    await f.act(connection.app, "undoAdvance");
    await f.act(connection.app, "continue");
    await fastDue();
    await f.act(connection.app, "pause");
    connection.db.close();
    connection = f.connect({ hook });
    await connection.app.readDirectory();
    await f.act(connection.app, "resume");
    const before = await fastDue();
    const operation = await prepareSelectedTeaching(connection.app, () =>
      prepareCommand({ projection: before, ids: f.ids, hash }),
    );
    const beforeCount = connection.db
      .prepare("SELECT count(*) AS n FROM task_advance")
      .get()?.n;
    fault = "before";
    await assert.rejects(
      executeTeaching(connection.app, operation),
      /before COMMIT/,
    );
    assert.deepEqual(await fastDue(), before);
    assert.equal(
      connection.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
      beforeCount,
    );
    const accepted = await executeTeaching(connection.app, operation);
    assert.equal(accepted.kind, "committed");
    assert.deepEqual(
      await executeTeaching(connection.app, operation),
      accepted,
    );
    await f.act(connection.app, "undoAdvance");
    const second = await fastDue();
    const lost = await prepareSelectedTeaching(connection.app, () =>
      prepareCommand({ projection: second, ids: f.ids, hash }),
    );
    fault = "after";
    await assert.rejects(
      executeTeaching(connection.app, lost),
      /committed reply loss/,
    );
    const expected = await executeTeaching(connection.app, lost);
    assert.equal(expected.kind, "committed");
    assert.deepEqual(await executeTeaching(connection.app, lost), expected);
    assert.deepEqual(
      connection.db.prepare("PRAGMA foreign_key_check").all(),
      [],
    );
  });
}

test("printed correction retests the first response and leaves Again owed from both eligible contexts", async (t) => {
  const { content } = await syntheticPrintedCourse();
  const f = await storageFixture(t, content);
  const connection = await f.connectReady();
  const taskId = resolvedLessons(content)[2]?.tasks.find(
    (entry) => entry.task.number === 1,
  )?.task.id;
  assert.ok(taskId);
  for (const trigger of [1, 2]) {
    await f.act(
      connection.app,
      trigger === 1 ? "start" : "replay",
      (a) => "taskId" in a.intent && a.intent.taskId === taskId,
    );
    for (let i = 0; i < trigger; i++) await f.act(connection.app, "continue");
    const view = await selectedProjection(connection.app);
    assert.equal(view.kind, "teaching");
    await f.act(connection.app, "help");
    const corrected = await selectedProjection(connection.app);
    assert.equal(corrected.kind, "teaching");
    if (corrected.kind !== "teaching") throw Error("Correction missing");
    assert.equal(corrected.turn.id, "fixture.printed.support");
    assert.deepEqual(
      parseProjection(JSON.parse(JSON.stringify(corrected))),
      corrected,
    );
    await f.act(connection.app, "continue");
    let pending = await selectedProjection(connection.app);
    assert.equal(pending.kind, "teaching");
    if (pending.kind !== "teaching") throw Error("Retest missing");
    assert.equal(pending.turn.id, "fixture.printed.t1.n1");
    await f.act(connection.app, "continue");
    pending = await selectedProjection(connection.app);
    assert.equal(pending.kind, "teaching");
    if (pending.kind !== "teaching") throw Error("Again missing");
    assert.equal(pending.turn.id, "fixture.printed.t1.n2");
    await f.act(connection.app, "continue");
    assert.equal((await selectedProjection(connection.app)).kind, "completed");
  }
});

import { migrations } from "../../packages/storage/src/generated-migration.ts";
import { initializeDatabase } from "../../packages/storage/src/migration.ts";
import { executorFor } from "./support.ts";
test("V11 migration rolls back the whole V10 file on refused COMMIT and recovers a lost acknowledgement through current initialization without changing installed manifests", async (t) => {
  const f = await storageFixture(t);
  const { db, executor } = f.connect();
  db.exec("PRAGMA foreign_keys=ON");
  for (const migration of migrations.filter((item) => item.version <= 10)) {
    db.exec("BEGIN IMMEDIATE");
    for (const sql of migration.statements) db.exec(sql);
    db.prepare("INSERT INTO schema_migration VALUES(?,?,?)").run(
      migration.version,
      migration.id,
      await hash(migration.statements.join("\n")),
    );
    db.exec(`PRAGMA user_version=${migration.version}`);
    db.exec("COMMIT");
  }
  db.exec("INSERT INTO installation VALUES('synthetic-installation',0,10,1)");
  const manifest = await readFile(
    "tests/fixtures/lesson-two-development-package.json",
    "utf8",
  );
  const content = await import("@readatthree/teaching").then((m) =>
    m.parseRuntimePackage(JSON.parse(manifest), hash),
  );
  if (content.body.coverage !== "course-development-v2")
    throw Error("V2 required");
  db.prepare(
    "INSERT INTO installed_package VALUES(?,?,?,2,?,1,?,'ready',?)",
  ).run(
    content.packageHash,
    content.body.courseId,
    content.body.releaseId,
    JSON.stringify(content.body.requiredEngineCapabilities),
    Buffer.from(manifest),
    content.packageHash,
  );
  db.prepare("INSERT INTO course_activation VALUES(?,?,NULL,0)").run(
    content.body.courseId,
    content.packageHash,
  );
  const original = db.prepare("SELECT * FROM installed_package").all();
  const file = String(db.prepare("PRAGMA database_list").get()?.file);
  const bytes = await readFile(file);
  await assert.rejects(
    () =>
      initializeDatabase(
        executorFor(db, async (sql, work) => {
          if (sql === "COMMIT")
            throw Error("Synthetic migration COMMIT refusal");
          return work();
        }),
        hash,
      ),
    /COMMIT refusal/,
  );
  assert.deepEqual(await readFile(file), bytes);
  assert.equal(db.prepare("PRAGMA foreign_keys").get()?.foreign_keys, 1);
  await assert.rejects(
    () =>
      initializeDatabase(
        executorFor(db, async (sql, work) => {
          const result = await work();
          if (sql === "COMMIT") throw Error("Synthetic migration lost reply");
          return result;
        }),
        hash,
      ),
    /lost reply/,
  );
  assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 11);
  assert.deepEqual(
    db.prepare("SELECT * FROM installed_package").all(),
    original,
  );
  assert.equal(db.prepare("PRAGMA foreign_keys").get()?.foreign_keys, 1);
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  await initializeDatabase(executor, hash);
  assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 13);
  const committed = await readFile(file);
  await initializeDatabase(executor, hash);
  assert.deepEqual(await readFile(file), committed);
  assert.deepEqual(
    db.prepare("SELECT * FROM installed_package").all(),
    original,
  );
  assert.equal(db.prepare("PRAGMA foreign_keys").get()?.foreign_keys, 1);
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
});

import { parseResponse } from "../../apps/web/src/platform/protocol.ts";
test("actual selected Worker envelope validates board turns and Help previews and refuses malformed nested presentations", async (t) => {
  const { content } = await syntheticPrintedCourse();
  const f = await storageFixture(t, content);
  const { app } = await f.connectReady();
  const taskId = resolvedLessons(content)[2]?.tasks.find(
    (e) => e.task.number === 1,
  )?.task.id;
  assert.ok(taskId);
  await f.act(
    app,
    "start",
    (a) => "taskId" in a.intent && a.intent.taskId === taskId,
  );
  await f.act(app, "continue");
  const directory = await app.readDirectory();
  const value = await app.readApplication({
    selection: directory.selection,
    target: { kind: "cursor" },
  });
  const wire = { id: "synthetic-response", kind: "application", value };
  assert.deepEqual(
    parseResponse(JSON.parse(JSON.stringify(wire))).kind,
    "application",
  );
  if (
    value.application.kind !== "ready" ||
    value.application.projection.kind !== "teaching" ||
    !("presentation" in value.application.projection.turn) ||
    value.application.projection.turn.presentation.kind !== "printedBoard"
  )
    throw Error("Actual board required");
  const projection = value.application.projection;
  const turn = projection.turn;
  if (!("presentation" in turn) || turn.presentation.kind !== "printedBoard")
    throw Error("Actual board presentation required");
  const invalid = [
    {
      ...projection,
      turn: {
        ...turn,
        presentation: { ...turn.presentation, cue: { kind: "none" } },
      },
    },
    {
      ...projection,
      actions: projection.actions.map((action) =>
        "correctionPreview" in action &&
        "presentation" in action.correctionPreview
          ? {
              ...action,
              correctionPreview: {
                ...action.correctionPreview,
                presentation: {
                  ...action.correctionPreview.presentation,
                  cue: { kind: "underSymbolHold", hold: "parentControlled" },
                },
              },
            }
          : action,
      ),
    },
    {
      ...projection,
      turn: {
        ...projection.turn,
        presentation: { ...turn.presentation, focus: "m" },
      },
    },
    {
      ...projection,
      turn: {
        ...projection.turn,
        presentation: { ...turn.presentation, unexpected: true },
      },
    },
    {
      ...projection,
      actions: projection.actions.map((action) =>
        "correctionPreview" in action &&
        "presentation" in action.correctionPreview
          ? {
              ...action,
              correctionPreview: {
                ...action.correctionPreview,
                presentation: {
                  ...action.correctionPreview.presentation,
                  board: {
                    assetId: "single-a",
                    reviewId: "unchecked",
                    assetHash: "0".repeat(64),
                  },
                },
              },
            }
          : action,
      ),
    },
  ];
  for (const bad of invalid)
    assert.throws(() =>
      parseResponse({
        ...wire,
        value: {
          ...value,
          application: { ...value.application, projection: bad },
        },
      }),
    );
});
