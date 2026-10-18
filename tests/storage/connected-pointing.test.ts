import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareCommand, prepareWritingCommand } from "@readatthree/teaching";
import { syntheticConnectedCourse } from "../connected-pointing-fixture.ts";
import { storageFixture, hash } from "./support.ts";
import {
  executeTeaching,
  prepareSelectedTeaching,
  selectedProjection,
  selectedCourse,
} from "./selected-support.ts";

async function writingAction(
  f: Awaited<ReturnType<typeof storageFixture>>,
  app: Parameters<typeof selectedProjection>[0],
  kind: "continue" | "confirmTracing" | "confirmIndependent" | "skipWriting",
) {
  const projection = await selectedProjection(app);
  if (projection.kind !== "writing") throw Error("Writing turn required");
  const action = projection.actions.find(
    (action) => action.intent.kind === kind,
  );
  if (!action) throw Error("Writing action required");
  return executeTeaching(
    app,
    await prepareSelectedTeaching(app, () =>
      prepareWritingCommand({
        projection,
        action,
        barrier: { kind: "writing", documents: projection.documents },
        ids: f.ids,
        hash,
      }),
    ),
  );
}

for (const task of [6, 7] as const) {
  test(`connected ${task} normal deliveries survive physical reopen, exact Retry, lost acknowledgement, Back and Undo`, async (t) => {
    const { content, task6Id, task7Id } = await syntheticConnectedCourse();
    const f = await storageFixture(t, content);
    let fault: "none" | "before" | "after" = "none";
    const hook: import("./support.ts").SqlHook = async (sql, work) => {
      if (sql === "COMMIT" && fault === "before") {
        fault = "none";
        throw Error("Synthetic connected before COMMIT");
      }
      const result = await work();
      if (sql === "COMMIT" && fault === "after") {
        fault = "none";
        throw Error("Synthetic connected committed reply loss");
      }
      return result;
    };
    let connection = await f.connectReady({ hook });
    const taskId = task === 6 ? task6Id : task7Id;
    await f.act(
      connection.app,
      "start",
      (a) => "taskId" in a.intent && a.intent.taskId === taskId,
    );
    for (const suffix of task === 6
      ? ["model", "follow", "again"]
      : ["model", "required-model-repeat", "follow", "again"]) {
      const before = await selectedProjection(connection.app);
      connection.db.close();
      connection = f.connect({ hook });
      await connection.app.readDirectory();
      assert.deepEqual(await selectedProjection(connection.app), before);
      assert.equal(before.kind, "teaching");
      if (before.kind !== "teaching") throw Error("Pointing delivery required");
      assert.equal(before.turn.id, `${taskId}.${suffix}`);
      const operation = await prepareSelectedTeaching(connection.app, () =>
        prepareCommand({ projection: before, ids: f.ids, hash }),
      );
      const advances = connection.db
        .prepare("SELECT count(*) AS n FROM task_advance")
        .get()?.n;
      fault = "before";
      await assert.rejects(
        executeTeaching(connection.app, operation),
        /before COMMIT/,
      );
      assert.deepEqual(await selectedProjection(connection.app), before);
      assert.equal(
        connection.db.prepare("SELECT count(*) AS n FROM task_advance").get()
          ?.n,
        advances,
      );
      fault = "after";
      await assert.rejects(
        executeTeaching(connection.app, operation),
        /committed reply loss/,
      );
      connection.db.close();
      connection = f.connect({ hook });
      await connection.app.readDirectory();
      const receipt = await executeTeaching(connection.app, operation);
      assert.equal(receipt.kind, "committed");
      assert.deepEqual(
        await executeTeaching(connection.app, operation),
        receipt,
      );
      await f.act(connection.app, "back");
      const back = await selectedProjection(connection.app);
      assert.ok(
        back.kind === "teaching" && back.turn.id === `${taskId}.${suffix}`,
      );
      const count = connection.db
        .prepare("SELECT count(*) AS n FROM task_advance")
        .get()?.n;
      await f.act(connection.app, "continue");
      assert.equal(
        connection.db.prepare("SELECT count(*) AS n FROM task_advance").get()
          ?.n,
        count,
      );
      await f.act(connection.app, "undoAdvance");
      const undone = await selectedProjection(connection.app);
      assert.ok(
        undone.kind === "teaching" && undone.turn.id === `${taskId}.${suffix}`,
      );
      await f.act(connection.app, "continue");
    }
    assert.equal((await selectedProjection(connection.app)).kind, "completed");
    const course = await selectedCourse(connection.app);
    assert.ok(
      course.kind === "ready" &&
        course.course.lessons[2]?.progress === "unfinished",
    );
  });
}

for (const task of [6, 7] as const)
  for (const at of ["follow", "again"] as const) {
    test(`connected ${task} Help at ${at} reopens guided cycles and own-item independent retest`, async (t) => {
      const { content, task6Id, task7Id } = await syntheticConnectedCourse();
      const f = await storageFixture(t, content);
      let connection = await f.connectReady();
      const taskId = task === 6 ? task6Id : task7Id;
      await f.act(
        connection.app,
        "start",
        (a) => "taskId" in a.intent && a.intent.taskId === taskId,
      );
      for (;;) {
        const p = await selectedProjection(connection.app);
        if (p.kind === "teaching" && p.turn.id === `${taskId}.${at}`) break;
        await f.act(connection.app, "continue");
      }
      await f.act(connection.app, "repeat");
      await f.act(connection.app, "help");
      const guided = await selectedProjection(connection.app);
      assert.ok(
        guided.kind === "teaching" &&
          guided.turn.id === `${taskId}.help-${at}.guided`,
      );
      if (task === 6)
        for (let i = 0; i < 2; i++) await f.act(connection.app, "continue");
      connection.db.close();
      connection = f.connect();
      await connection.app.readDirectory();
      const restored = await selectedProjection(connection.app);
      assert.ok(
        restored.kind === "teaching" &&
          restored.turn.id === `${taskId}.help-${at}.guided`,
      );
      await f.act(connection.app, task === 6 ? "parentReady" : "continue");
      const retest = await selectedProjection(connection.app);
      assert.ok(
        retest.kind === "teaching" &&
          retest.turn.id === `${taskId}.help-${at}.retest`,
      );
      connection.db.close();
      connection = f.connect();
      await connection.app.readDirectory();
      assert.deepEqual(await selectedProjection(connection.app), retest);
      await f.act(connection.app, "continue");
      const repeat = await selectedProjection(connection.app);
      assert.ok(
        repeat.kind === "teaching" && repeat.turn.id === `${taskId}.${at}`,
      );
      await f.act(connection.app, "continue");
      if (at === "follow") {
        const again = await selectedProjection(connection.app);
        assert.ok(
          again.kind === "teaching" && again.turn.id === `${taskId}.again`,
        );
        await f.act(connection.app, "continue");
      }
      assert.equal(
        (await selectedProjection(connection.app)).kind,
        "completed",
      );
    });
  }

test("all eight writing deliveries require parent phase confirmation and preserve exact saved turns", async (t) => {
  const { content, writingTaskId } = await syntheticConnectedCourse();
  const f = await storageFixture(t, content);
  let connection = await f.connectReady();
  await f.act(
    connection.app,
    "start",
    (a) => "taskId" in a.intent && a.intent.taskId === writingTaskId,
  );
  const phases: string[] = [];
  for (let index = 0; index < 8; index++) {
    const p = await selectedProjection(connection.app);
    if (p.kind !== "writing" || p.turn.presentation.kind !== "writing")
      throw Error("Writing delivery required");
    const obligation = p.turn.presentation.obligation;
    phases.push(obligation.kind);
    connection.db.close();
    connection = f.connect();
    const recovery = await connection.app.openRecovery({ kind: "cold" });
    await connection.app.reconcileRecovery({
      recoveryId: recovery.recoveryId,
      choice: { kind: "cold" },
    });
    const restored = await selectedProjection(connection.app);
    assert.ok(
      restored.kind === "writing" && restored.turn.id === p.turn.id,
      JSON.stringify({ index, before: p.turn.id, restored }),
    );
    assert.equal(restored.runStatus, "inProgress");
    await writingAction(
      f,
      connection.app,
      obligation.kind === "phaseConfirmation"
        ? obligation.phase === "childTracing"
          ? "confirmTracing"
          : "confirmIndependent"
        : "continue",
    );
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
  assert.equal(
    (await selectedProjection(connection.app)).kind,
    "writingResult",
  );
  const course = await selectedCourse(connection.app);
  assert.ok(
    course.kind === "ready" &&
      course.course.lessons[2]?.progress === "unfinished",
  );
});

test("complete Lesson 3 definitions grant no credit until seven core tasks and explicit optional skip", async (t) => {
  const { content, writingTaskId } = await syntheticConnectedCourse();
  const f = await storageFixture(t, content);
  const { app, db } = await f.connectReady();
  const course = await selectedCourse(app);
  if (course.kind !== "ready") throw Error("Course required");
  const lesson = course.course.lessons[2];
  assert.ok(lesson);
  assert.equal(lesson.progress, "unfinished");
  assert.equal(
    db.prepare("SELECT count(*) AS n FROM lesson_credit").get()?.n,
    0,
  );
  for (const task of lesson.tasks.filter((task) => !task.optional)) {
    await f.act(
      app,
      "start",
      (action) => "taskId" in action.intent && action.intent.taskId === task.id,
    );
    for (let step = 0; step < 30; step++) {
      const p = await selectedProjection(app);
      if (p.kind === "completed") break;
      assert.equal(p.kind, "teaching");
      await f.act(
        app,
        p.actions.some((action) => action.intent.kind === "parentReady")
          ? "parentReady"
          : "continue",
      );
    }
    assert.equal((await selectedProjection(app)).kind, "completed");
    const after = await selectedCourse(app);
    assert.ok(
      after.kind === "ready" &&
        after.course.lessons[2]?.progress === "unfinished",
    );
  }
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS n FROM task_credit WHERE lesson_id=? AND status='valid'",
      )
      .get(lesson.lessonId)?.n,
    7,
  );
  assert.equal(
    db
      .prepare("SELECT count(*) AS n FROM lesson_credit WHERE lesson_id=?")
      .get(lesson.lessonId)?.n,
    0,
  );
  await f.act(
    app,
    "start",
    (action) =>
      "taskId" in action.intent && action.intent.taskId === writingTaskId,
  );
  await writingAction(f, app, "skipWriting");
  const after = await selectedCourse(app);
  assert.ok(
    after.kind === "ready" && after.course.lessons[2]?.progress === "satisfied",
  );
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS n FROM lesson_credit WHERE lesson_id=? AND status='valid'",
      )
      .get(lesson.lessonId)?.n,
    1,
  );
});
