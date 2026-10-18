import assert from "node:assert/strict";
import { test } from "node:test";
import {
  prepareCommand,
  prepareWritingCommand,
  prepareInkCommand,
  parseId,
  encodeInkPoints,
  layerForPhase,
} from "@readatthree/teaching";
import { syntheticLessonFourCourse } from "../lesson-four-fixture.ts";
import { storageFixture, hash } from "./support.ts";
import {
  executeTeaching,
  prepareSelectedTeaching,
  selectedProjection,
  selectedCourse,
  prepareSelectedInk,
  executeInk,
  selectedInk,
} from "./selected-support.ts";

async function writingAction(
  f: Awaited<ReturnType<typeof storageFixture>>,
  app: Parameters<typeof selectedProjection>[0],
  kind:
    | "continue"
    | "confirmTracing"
    | "confirmIndependent"
    | "skipWriting"
    | "undoAdvance",
) {
  const projection = await selectedProjection(app);
  if (projection.kind !== "writing" && projection.kind !== "writingResult")
    throw Error("Writing turn required");
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

for (const task of [5, 6] as const) {
  test(`connected ${task} normal deliveries survive physical reopen, exact Retry, lost acknowledgement, Back and Undo`, async (t) => {
    const { content, taskIds } = await syntheticLessonFourCourse();
    const task6Id = taskIds[4],
      task7Id = taskIds[5];
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
    const taskId = task === 5 ? task6Id : task7Id;
    await f.act(
      connection.app,
      "start",
      (a) => "taskId" in a.intent && a.intent.taskId === taskId,
    );
    for (const suffix of ["model", "follow", "again"]) {
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
        course.course.lessons[3]?.progress === "unfinished",
    );
  });
}

for (const task of [5, 6] as const)
  for (const at of ["follow", "again"] as const) {
    test(`connected ${task} Help at ${at} reopens guided cycles and own-item independent retest`, async (t) => {
      const { content, taskIds } = await syntheticLessonFourCourse();
      const task6Id = taskIds[4],
        task7Id = taskIds[5];
      const f = await storageFixture(t, content);
      let connection = await f.connectReady();
      const taskId = task === 5 ? task6Id : task7Id;
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
  const { content, taskIds } = await syntheticLessonFourCourse();
  const writingTaskId = taskIds[6];
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
    if (obligation.kind !== "soundResponse") {
      const targetId = p.turn.presentation.targetId;
      const token = p.documents.find(
        (document) => document.targetId === targetId,
      );
      if (!token) throw Error("Current target document required");
      const layer = layerForPhase(token.phase),
        strokeId = parseId({ kind: "stroke", value: f.ids() });
      const begin = await prepareSelectedInk(connection.app, () =>
        prepareInkCommand({
          token,
          ids: f.ids,
          hash,
          edit: {
            kind: "begin",
            layer,
            strokeId,
            brush: {
              kind: "round",
              width: 5,
              colorRole: layer === "model" ? "model" : "child",
              cap: "round",
              join: "round",
            },
            chunks: [
              {
                chunkIndex: 0,
                firstPointIndex: 0,
                pointCount: 3,
                codecVersion: 1,
                payload: [
                  ...encodeInkPoints({
                    bounds: { width: 1600, height: 400 },
                    points: [
                      { x: 50, y: 100, elapsedMs: 0 },
                      { x: 75, y: 80, elapsedMs: 10 },
                      { x: 100, y: 100, elapsedMs: 20 },
                    ],
                  }),
                ],
              },
            ],
          },
        }),
      );
      const begun = await executeInk(connection.app, begin);
      if (begun.kind !== "inkCommitted") throw Error("Ink begin required");
      const finish = await prepareSelectedInk(connection.app, () =>
        prepareInkCommand({
          token: begun.token,
          ids: f.ids,
          hash,
          edit: {
            kind: "finalize",
            layer,
            strokeId,
            chunks: [],
            status: "finished",
          },
        }),
      );
      const finished = await executeInk(connection.app, finish);
      if (finished.kind !== "inkCommitted")
        throw Error("Finished stroke required");
      assert.deepEqual(await executeInk(connection.app, finish), finished);
    }
    const saved = await selectedProjection(connection.app);
    if (saved.kind !== "writing")
      throw Error("Writing required before restart");
    const beforeInk = await Promise.all(
      saved.documents.map((token) => selectedInk(connection.app, { token })),
    );
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
    if (restored.kind !== "writing") throw Error("Restored writing required");
    const afterInk = await Promise.all(
      restored.documents.map((token) => selectedInk(connection.app, { token })),
    );
    assert.deepEqual(
      afterInk.map(({ token: _token, writable: _writable, ...ink }) => ink),
      beforeInk.map(({ token: _token, writable: _writable, ...ink }) => ink),
    );
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
      course.course.lessons[3]?.progress === "unfinished",
  );
});

for (const outcome of ["completed", "skipped"] as const)
  test(`complete Lesson 4 definitions grant no credit until six core tasks and writing ${outcome}`, async (t) => {
    const { content, taskIds } = await syntheticLessonFourCourse();
    const writingTaskId = taskIds[6];
    const f = await storageFixture(t, content);
    const { app, db } = await f.connectReady();
    const course = await selectedCourse(app);
    if (course.kind !== "ready") throw Error("Course required");
    const lesson = course.course.lessons[3];
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
        (action) =>
          "taskId" in action.intent && action.intent.taskId === task.id,
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
          after.course.lessons[3]?.progress === "unfinished",
      );
    }
    assert.equal(
      db
        .prepare(
          "SELECT count(*) AS n FROM task_credit WHERE lesson_id=? AND status='valid'",
        )
        .get(lesson.lessonId)?.n,
      6,
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
    if (outcome === "skipped") await writingAction(f, app, "skipWriting");
    else
      for (let i = 0; i < 8; i++) {
        const p = await selectedProjection(app);
        if (p.kind !== "writing" || p.turn.presentation.kind !== "writing")
          throw Error("Writing phase required");
        const obligation = p.turn.presentation.obligation;
        await writingAction(
          f,
          app,
          obligation.kind === "phaseConfirmation"
            ? obligation.phase === "childTracing"
              ? "confirmTracing"
              : "confirmIndependent"
            : "continue",
        );
      }
    const after = await selectedCourse(app);
    assert.ok(
      after.kind === "ready" &&
        after.course.lessons[3]?.progress === "satisfied",
    );
    assert.equal(
      db
        .prepare(
          "SELECT count(*) AS n FROM lesson_credit WHERE lesson_id=? AND status='valid'",
        )
        .get(lesson.lessonId)?.n,
      1,
    );
    await writingAction(f, app, "undoAdvance");
    const undone = await selectedCourse(app);
    assert.equal(
      undone.kind === "ready" ? undone.course.lessons[3]?.progress : null,
      "unfinished",
    );
    assert.equal(
      db
        .prepare(
          "SELECT count(*) AS n FROM lesson_credit WHERE lesson_id=? AND status='valid'",
        )
        .get(lesson.lessonId)?.n,
      0,
    );
  });

test("Lesson four whole replay is mandatory and every further cycle delivers all ten responses", async (t) => {
  const { content, taskIds } = await syntheticLessonFourCourse();
  const taskId = taskIds[3];
  const f = await storageFixture(t, content);
  let connection = await f.connectReady();
  await f.act(
    connection.app,
    "start",
    (action) => "taskId" in action.intent && action.intent.taskId === taskId,
  );
  const delivered: string[] = [];
  for (let i = 0; i < 20; i++) {
    const projection = await selectedProjection(connection.app);
    if (projection.kind !== "teaching") throw Error("Oral delivery required");
    delivered.push(projection.turn.id);
    assert.equal(
      projection.actions.some((action) => action.intent.kind === "parentReady"),
      i === 19,
    );
    if (i === 10) {
      connection.db.close();
      connection = f.connect();
      await connection.app.readDirectory();
      assert.deepEqual(await selectedProjection(connection.app), projection);
      await f.act(connection.app, "pause");
      await f.act(connection.app, "resume");
    }
    await f.act(connection.app, "continue");
  }
  assert.deepEqual(
    delivered,
    ["initial", "replay"].flatMap((cycle) =>
      Array.from(
        { length: 10 },
        (_, i) => `${taskId}.${cycle}.${String(i + 1).padStart(2, "0")}`,
      ),
    ),
  );
  for (let i = 0; i < 10; i++) {
    const projection = await selectedProjection(connection.app);
    if (projection.kind !== "teaching")
      throw Error("Complete extra replay required");
    assert.equal(
      projection.turn.id,
      `${taskId}.replay.${String(i + 1).padStart(2, "0")}`,
    );
    assert.equal(
      projection.actions.some((action) => action.intent.kind === "parentReady"),
      i === 9,
    );
    if (i < 9) await f.act(connection.app, "continue");
  }
  await f.act(connection.app, "parentReady");
  assert.equal((await selectedProjection(connection.app)).kind, "completed");
  await f.act(connection.app, "undoAdvance");
  const undone = await selectedProjection(connection.app);
  assert.equal(undone.kind, "teaching");
  assert.equal(
    undone.actions.some((action) => action.intent.kind === "parentReady"),
    true,
  );
  await f.act(connection.app, "parentReady");
  assert.equal((await selectedProjection(connection.app)).kind, "completed");
});

test("Lesson four replay final acceptance rolls back before commit and retries one committed credit after reply loss", async (t) => {
  const { content, taskIds } = await syntheticLessonFourCourse();
  const taskId = taskIds[3];
  const f = await storageFixture(t, content);
  let fault: "none" | "before" | "after" = "none";
  const hook: import("./support.ts").SqlHook = async (sql, work) => {
    if (sql === "COMMIT" && fault === "before") {
      fault = "none";
      throw Error("Synthetic replay before commit");
    }
    const result = await work();
    if (sql === "COMMIT" && fault === "after") {
      fault = "none";
      throw Error("Synthetic replay reply loss");
    }
    return result;
  };
  let connection = await f.connectReady({ hook });
  await f.act(
    connection.app,
    "start",
    (action) => "taskId" in action.intent && action.intent.taskId === taskId,
  );
  for (let i = 0; i < 19; i++) await f.act(connection.app, "continue");
  const projection = await selectedProjection(connection.app);
  if (projection.kind !== "teaching") throw Error("Final replay required");
  assert.equal(projection.turn.id, `${taskId}.replay.10`);
  const action = projection.actions.find(
    (action) => action.intent.kind === "parentReady",
  );
  if (!action) throw Error("Parent final-cycle judgment required");
  const operation = await prepareSelectedTeaching(connection.app, () =>
    prepareCommand({
      projection,
      request: { kind: "action", action },
      ids: f.ids,
      hash,
    }),
  );
  const advances = connection.db
    .prepare("SELECT count(*) AS n FROM task_advance")
    .get()?.n;
  fault = "before";
  await assert.rejects(
    executeTeaching(connection.app, operation),
    /before commit/,
  );
  assert.deepEqual(await selectedProjection(connection.app), projection);
  assert.equal(
    connection.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    advances,
  );
  assert.equal(
    connection.db
      .prepare("SELECT count(*) AS n FROM task_credit WHERE status='valid'")
      .get()?.n,
    0,
  );
  fault = "after";
  await assert.rejects(
    executeTeaching(connection.app, operation),
    /reply loss/,
  );
  connection.db.close();
  connection = f.connect({ hook });
  await connection.app.readDirectory();
  const receipt = await executeTeaching(connection.app, operation);
  assert.equal(receipt.kind, "committed");
  assert.deepEqual(await executeTeaching(connection.app, operation), receipt);
  assert.equal((await selectedProjection(connection.app)).kind, "completed");
  assert.equal(
    connection.db
      .prepare("SELECT count(*) AS n FROM task_credit WHERE status='valid'")
      .get()?.n,
    1,
  );
  assert.equal(
    connection.db
      .prepare("SELECT count(*) AS n FROM lesson_credit WHERE status='valid'")
      .get()?.n,
    0,
  );
});
