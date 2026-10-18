import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareCommand } from "@readatthree/teaching";
import { syntheticLessonFiveCourse } from "../lesson-five-fixture.ts";
import { storageFixture, hash } from "./support.ts";
import {
  selectedProjection,
  prepareSelectedTeaching,
  executeTeaching,
  selectedCourse,
} from "./selected-support.ts";

test("all fifty one source responses persist exactly across SQLite reopen and exact Retry without granting lesson credit", async (t) => {
  const { content, taskIds } = await syntheticLessonFiveCourse();
  const f = await storageFixture(t, content);
  let connection = await f.connectReady();
  let accepted = 0;
  for (const [index, taskId] of taskIds.entries()) {
    await f.act(
      connection.app,
      "start",
      (a) => "taskId" in a.intent && a.intent.taskId === taskId,
    );
    for (
      let response = 0;
      response < ([3, 4, 8, 20, 8, 8][index] ?? 0);
      response++
    ) {
      const before = await selectedProjection(connection.app);
      assert.equal(before.kind, "teaching");
      if (before.kind !== "teaching")
        throw Error("Synthetic response required");
      connection.db.close();
      connection = f.connect();
      await connection.app.readDirectory();
      assert.deepEqual(await selectedProjection(connection.app), before);
      const ready = before.actions.find((a) => a.intent.kind === "parentReady");
      const operation = await prepareSelectedTeaching(connection.app, () =>
        prepareCommand({
          projection: before,
          ...(ready
            ? { request: { kind: "action", action: ready } as const }
            : {}),
          ids: f.ids,
          hash,
        }),
      );
      const result = await executeTeaching(connection.app, operation);
      assert.equal(result.kind, "committed");
      assert.deepEqual(
        await executeTeaching(connection.app, operation),
        result,
      );
      accepted++;
    }
    const completed = await selectedProjection(connection.app);
    assert.equal(completed.kind, "completed");
  }
  assert.equal(accepted, 51);
  assert.equal(
    connection.db
      .prepare("SELECT count(*) AS n FROM task_credit WHERE status='valid'")
      .get()?.n,
    6,
  );
  assert.equal(
    connection.db.prepare("SELECT count(*) AS n FROM lesson_credit").get()?.n,
    0,
  );
  const course = await selectedCourse(connection.app);
  assert.equal(
    course.kind === "ready" ? course.course.lessons[4]?.progress : null,
    "unfinished",
  );
});

for (const repeated of [false, true])
  for (let trigger = 0; trigger < 8; trigger++)
    test(`SQLite child Help ${trigger} ${repeated ? "Repeat" : "normal"} preserves support, prefix, Back and Undo through restart`, async (t) => {
      const { content, taskIds } = await syntheticLessonFiveCourse();
      const taskId = taskIds[5];
      const f = await storageFixture(t, content);
      let c = await f.connectReady();
      await f.act(
        c.app,
        "start",
        (a) => "taskId" in a.intent && a.intent.taskId === taskId,
      );
      for (let i = 0; i < trigger; i++) await f.act(c.app, "continue");
      if (repeated) await f.act(c.app, "repeat");
      await f.act(c.app, "help");
      for (let cycle = 0; cycle < 2; cycle++) {
        for (const pace of ["slow", "fast"]) {
          const before = await selectedProjection(c.app);
          if (
            before.kind !== "teaching" ||
            !("presentation" in before.turn) ||
            before.turn.presentation.kind !== "printedBoard"
          )
            throw Error("Synthetic support required");
          assert.deepEqual(before.turn.presentation.cue, {
            kind: "childUnderSymbol",
            participant: "parentGuidesChild",
            pace,
          });
          c.db.close();
          c = f.connect();
          await c.app.readDirectory();
          assert.deepEqual(await selectedProjection(c.app), before);
          if (pace === "slow" || cycle === 0) await f.act(c.app, "continue");
        }
      }
      await f.act(c.app, "parentReady");
      for (let i = 0; i <= trigger; i++) {
        const before = await selectedProjection(c.app);
        if (before.kind !== "teaching")
          throw Error("Synthetic retest required");
        assert.equal(before.turn.id, `${taskId}.response${i}`);
        c.db.close();
        c = f.connect();
        await c.app.readDirectory();
        assert.deepEqual(await selectedProjection(c.app), before);
        await f.act(c.app, "continue");
      }
      if (repeated) await f.act(c.app, "continue");
      const after = await selectedProjection(c.app);
      if (trigger === 7) assert.equal(after.kind, "completed");
      else {
        assert.equal(after.kind, "teaching");
        if (after.kind === "teaching")
          assert.equal(after.turn.id, `${taskId}.response${trigger + 1}`);
      }
      await f.act(c.app, "undoAdvance");
      const undone = await selectedProjection(c.app);
      c.db.close();
      c = f.connect();
      await c.app.readDirectory();
      assert.deepEqual(await selectedProjection(c.app), undone);
      await f.act(c.app, "continue");
      await f.act(c.app, "back");
      const backed = await selectedProjection(c.app);
      c.db.close();
      c = f.connect();
      await c.app.readDirectory();
      assert.deepEqual(await selectedProjection(c.app), backed);
    });

test("child acceptance rolls back before COMMIT and returns the same retained receipt after committed reply loss", async (t) => {
  const { content, taskIds } = await syntheticLessonFiveCourse();
  const f = await storageFixture(t, content);
  let fault: "none" | "before" | "after" = "none";
  const hook: import("./support.ts").SqlHook = async (sql, work) => {
    if (sql === "COMMIT" && fault === "before") {
      fault = "none";
      throw Error("Synthetic before COMMIT");
    }
    const result = await work();
    if (sql === "COMMIT" && fault === "after") {
      fault = "none";
      throw Error("Synthetic committed reply loss");
    }
    return result;
  };
  let c = await f.connectReady({ hook });
  await f.act(
    c.app,
    "start",
    (a) => "taskId" in a.intent && a.intent.taskId === taskIds[5],
  );
  const before = await selectedProjection(c.app);
  const operation = await prepareSelectedTeaching(c.app, () =>
    prepareCommand({ projection: before, ids: f.ids, hash }),
  );
  fault = "before";
  await assert.rejects(executeTeaching(c.app, operation), /before COMMIT/);
  assert.deepEqual(await selectedProjection(c.app), before);
  fault = "after";
  await assert.rejects(executeTeaching(c.app, operation), /reply loss/);
  c.db.close();
  c = f.connect({ hook });
  await c.app.readDirectory();
  const first = await executeTeaching(c.app, operation);
  assert.equal(first.kind, "committed");
  assert.deepEqual(await executeTeaching(c.app, operation), first);
  assert.equal(
    c.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    1,
  );
});

for (const trigger of [1, 2])
  for (const repeated of [false, true])
    test(`mandatory Again remains owed after first-task Help at ${trigger} ${repeated ? "Repeat" : "normal"}`, async (t) => {
      const { content, taskIds } = await syntheticLessonFiveCourse();
      const taskId = taskIds[0];
      const f = await storageFixture(t, content);
      let c = await f.connectReady();
      await f.act(
        c.app,
        "start",
        (a) => "taskId" in a.intent && a.intent.taskId === taskId,
      );
      for (let i = 0; i < trigger; i++) await f.act(c.app, "continue");
      if (repeated) await f.act(c.app, "repeat");
      await f.act(c.app, "help");
      await f.act(c.app, "continue");
      let current = await selectedProjection(c.app);
      if (current.kind !== "teaching")
        throw Error("Synthetic response required");
      assert.equal(current.turn.id, `${taskId}.response1`);
      c.db.close();
      c = f.connect();
      await c.app.readDirectory();
      assert.deepEqual(await selectedProjection(c.app), current);
      await f.act(c.app, "continue");
      current = await selectedProjection(c.app);
      assert.equal(current.kind, "teaching");
      if (repeated) {
        await f.act(c.app, "continue");
        current = await selectedProjection(c.app);
      }
      if (repeated && trigger === 1) {
        if (current.kind !== "teaching")
          throw Error("Original first response remains owed");
        assert.equal(current.turn.id, `${taskId}.response1`);
        await f.act(c.app, "continue");
        current = await selectedProjection(c.app);
      }
      if (current.kind !== "teaching") throw Error("Mandatory Again required");
      assert.equal(current.turn.id, `${taskId}.response2`);
      assert.equal(
        c.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
        0,
      );
      await f.act(c.app, "continue");
      assert.equal((await selectedProjection(c.app)).kind, "completed");
    });

test("oral pair readiness permits a further whole ten-response cycle without partial exit", async (t) => {
  const { content, taskIds } = await syntheticLessonFiveCourse();
  const f = await storageFixture(t, content);
  let c = await f.connectReady();
  const taskId = taskIds[3];
  await f.act(
    c.app,
    "start",
    (a) => "taskId" in a.intent && a.intent.taskId === taskId,
  );
  for (let i = 0; i < 29; i++) {
    const current = await selectedProjection(c.app);
    if (current.kind !== "teaching") throw Error("Synthetic pair required");
    assert.equal(
      current.actions.some((a) => a.intent.kind === "parentReady"),
      i === 19,
    );
    if (i === 20) {
      c.db.close();
      c = f.connect();
      await c.app.readDirectory();
      assert.deepEqual(await selectedProjection(c.app), current);
    }
    await f.act(c.app, "continue");
  }
  const final = await selectedProjection(c.app);
  if (final.kind !== "teaching")
    throw Error("Synthetic final response required");
  assert.equal(final.turn.id, `${taskId}.response19`);
  await f.act(c.app, "parentReady");
  assert.equal((await selectedProjection(c.app)).kind, "completed");
});
