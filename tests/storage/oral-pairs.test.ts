import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareCommand } from "@readatthree/teaching";
import { syntheticOralPairsCourse } from "../oral-pairs-fixture.ts";
import { storageFixture, hash } from "./support.ts";
import {
  executeTeaching,
  prepareSelectedTeaching,
  selectedProjection,
  selectedCourse,
} from "./selected-support.ts";

for (const task of [3, 5]) {
  test(`oral ${task} preserves every obligation across physical close, faults, Retry, Back, Undo and pause`, async (t) => {
    const { content, task3Id, task5Id } = await syntheticOralPairsCourse();
    const f = await storageFixture(t, content);
    let fault: "none" | "before" | "after" = "none";
    const hook: import("./support.ts").SqlHook = async (sql, work) => {
      if (sql === "COMMIT" && fault === "before") {
        fault = "none";
        throw new Error("Synthetic oral before COMMIT");
      }
      const result = await work();
      if (sql === "COMMIT" && fault === "after") {
        fault = "none";
        throw new Error("Synthetic oral committed reply loss");
      }
      return result;
    };
    let connection = await f.connectReady({ hook });
    const taskId = task === 3 ? task3Id : task5Id;
    await f.act(
      connection.app,
      "start",
      (a) => "taskId" in a.intent && a.intent.taskId === taskId,
    );
    async function reopen() {
      const before = await selectedProjection(connection.app);
      connection.db.close();
      connection = f.connect({ hook });
      await connection.app.readDirectory();
      assert.deepEqual(await selectedProjection(connection.app), before);
      return before;
    }
    const count = task === 3 ? 5 : 14;
    for (let index = 0; index < count; index++) {
      const expected =
        task === 3
          ? `fixture.oral.t3.initial.${index}`
          : `fixture.oral.t5.${index < 8 ? "initial" : "replay"}.${index}`;
      const before = await reopen();
      assert.equal(before.kind, "teaching");
      if (before.kind !== "teaching")
        throw new Error("Oral obligation required");
      assert.equal(before.turn.id, expected);
      assert.ok("presentation" in before.turn);
      assert.equal(before.turn.presentation.kind, "oral");
      assert.equal(
        before.actions.some((a) => a.intent.kind === "parentReady"),
        task === 5 && index === 13,
      );
      await f.act(connection.app, "pause");
      connection.db.close();
      connection = f.connect({ hook });
      await connection.app.readDirectory();
      await f.act(connection.app, "resume");
      const resumed = await selectedProjection(connection.app);
      assert.equal(resumed.kind, "teaching");
      if (resumed.kind !== "teaching") throw new Error("Resume required");
      assert.equal(resumed.turn.id, expected);
      const action = resumed.actions.find(
        (a) =>
          a.intent.kind ===
          (task === 5 && index === 13 ? "parentReady" : "continue"),
      );
      assert.ok(action);
      const operation = await prepareSelectedTeaching(connection.app, () =>
        prepareCommand({
          projection: resumed,
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
        /before COMMIT/,
      );
      assert.deepEqual(await selectedProjection(connection.app), resumed);
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
      const receipt = await executeTeaching(connection.app, operation);
      assert.equal(
        receipt.kind,
        "committed",
        JSON.stringify({ index, receipt }),
      );
      assert.deepEqual(
        await executeTeaching(connection.app, operation),
        receipt,
      );
      await f.act(connection.app, "back");
      const back = await selectedProjection(connection.app);
      assert.equal(back.kind, "teaching");
      if (back.kind !== "teaching") throw new Error("Back required");
      assert.equal(back.turn.id, expected);
      const afterCount = connection.db
        .prepare("SELECT count(*) AS n FROM task_advance")
        .get()?.n;
      await f.act(connection.app, "continue");
      assert.equal(
        connection.db.prepare("SELECT count(*) AS n FROM task_advance").get()
          ?.n,
        afterCount,
      );
      await f.act(connection.app, "undoAdvance");
      const undone = await selectedProjection(connection.app);
      assert.equal(undone.kind, "teaching");
      if (undone.kind !== "teaching") throw new Error("Undo required");
      assert.equal(undone.turn.id, expected);
      await f.act(
        connection.app,
        task === 5 && index === 13 ? "parentReady" : "continue",
      );
    }
    assert.equal((await selectedProjection(connection.app)).kind, "completed");
    await reopen();
    const course = await selectedCourse(connection.app);
    assert.equal(course.kind, "ready");
    if (course.kind !== "ready") throw new Error("Course required");
    assert.equal(course.course.lessons[2]?.progress, "unfinished");
    assert.equal(
      course.course.lessons[2]?.tasks[task - 1]?.outcome,
      "completed",
    );
    assert.deepEqual(
      connection.db.prepare("PRAGMA foreign_key_check").all(),
      [],
    );
  });
}

for (let item = 0; item < 5; item++) {
  test(`oral support ${item} repeats full model/together, persists every boundary and resolves only its owed item`, async (t) => {
    const { content, task3Id } = await syntheticOralPairsCourse();
    const f = await storageFixture(t, content);
    let c = await f.connectReady();
    await f.act(
      c.app,
      "start",
      (a) => "taskId" in a.intent && a.intent.taskId === task3Id,
    );
    for (let i = 0; i < item; i++) await f.act(c.app, "continue");
    await f.act(c.app, "help");
    async function due(suffix: string) {
      const view = await selectedProjection(c.app);
      assert.equal(view.kind, "teaching");
      if (view.kind !== "teaching") throw new Error("Support turn required");
      assert.equal(view.turn.id, `fixture.oral.t3.help.${item}.${suffix}`);
      c.db.close();
      c = f.connect();
      await c.app.readDirectory();
      assert.deepEqual(await selectedProjection(c.app), view);
    }
    await due("model");
    await f.act(c.app, "continue");
    await due("together");
    await f.act(c.app, "continue");
    await due("model");
    await f.act(c.app, "continue");
    await due("together");
    await f.act(c.app, "parentReady");
    await due("retest");
    const normalBefore = c.db
      .prepare("SELECT count(*) AS n FROM task_advance")
      .get()?.n;
    await f.act(c.app, "continue");
    const next = await selectedProjection(c.app);
    if (item === 4) assert.equal(next.kind, "completed");
    else {
      assert.equal(next.kind, "teaching");
      if (next.kind !== "teaching") throw new Error("Remaining item required");
      assert.equal(next.turn.id, `fixture.oral.t3.initial.${item + 1}`);
    }
    assert.equal(
      Number(c.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n),
      Number(normalBefore) + 1,
    );
    assert.deepEqual(c.db.prepare("PRAGMA foreign_key_check").all(), []);
  });
}

test("oral final decision requires fourteen responses, then repeats all six with fresh occurrences excluding the initial item", async (t) => {
  const { content, task5Id } = await syntheticOralPairsCourse();
  const f = await storageFixture(t, content);
  const c = await f.connectReady();
  await f.act(
    c.app,
    "start",
    (a) => "taskId" in a.intent && a.intent.taskId === task5Id,
  );
  for (let i = 0; i < 13; i++) await f.act(c.app, "continue");
  const before = await selectedProjection(c.app);
  assert.equal(before.kind, "teaching");
  if (before.kind !== "teaching") throw new Error("Final response required");
  assert.equal(before.turn.id, "fixture.oral.t5.replay.13");
  await f.act(c.app, "continue");
  for (let i = 8; i < 14; i++) {
    const view = await selectedProjection(c.app);
    assert.equal(view.kind, "teaching");
    if (view.kind !== "teaching") throw new Error("Whole replay required");
    assert.equal(view.turn.id, `fixture.oral.t5.replay.${i}`);
    assert.ok("occurrenceId" in view.turn && "occurrenceId" in before.turn);
    assert.notEqual(view.turn.occurrenceId, before.turn.occurrenceId);
    await f.act(c.app, i === 13 ? "parentReady" : "continue");
  }
  assert.equal((await selectedProjection(c.app)).kind, "completed");
});
