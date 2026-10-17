import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareCommand } from "../../packages/teaching/src/index.ts";
import type { CommittedProjection } from "../../packages/teaching/src/index.ts";
import { hash, storageFixture } from "./support.ts";

function teaching(projection: CommittedProjection) {
  if (projection.kind !== "teaching")
    assert.fail(`Expected teaching, received ${projection.kind}`);
  return projection;
}

function actionFor(projection: CommittedProjection, kind: string) {
  if (projection.kind === "recovery") assert.fail(projection.message);
  return projection.actions.find((action) => action.intent.kind === kind);
}

test("a parent can repeatedly Undo advance to the same task run's start after a physical SQLite reopen", async (t) => {
  const fixture = await storageFixture(t);
  const first = fixture.connect();
  assert.equal((await first.app.open()).kind, "entry");
  assert.equal(
    (
      await fixture.act(
        first.app,
        "start",
        (action) =>
          "taskId" in action.intent && action.intent.taskId === "fixture.task",
      )
    ).kind,
    "committed",
  );
  const start = teaching(await first.app.read());
  assert.equal(start.taskId, "fixture.task");
  assert.equal(start.turn.id, "fixture.graph.l01.t01.s01.model-m");
  assert.equal(actionFor(start, "undoAdvance"), undefined);

  assert.equal((await fixture.act(first.app, "continue")).kind, "committed");
  const response = teaching(await first.app.read());
  assert.equal(response.turn.id, "fixture.graph.l01.t01.s02.response-m");
  assert.equal(response.runId, start.runId);
  assert.equal((await fixture.act(first.app, "continue")).kind, "committed");
  const again = teaching(await first.app.read());
  assert.equal(again.turn.id, "fixture.graph.l01.t01.s03.again-m");
  assert.equal(again.runId, start.runId);
  assert.equal((await fixture.act(first.app, "pause")).kind, "committed");

  first.db.close();
  assert.equal(first.db.isOpen, false);
  const reopened = fixture.connect();
  const recovery = await reopened.app.openRecovery({ kind: "cold" });
  await reopened.app.reconcileRecovery({
    recoveryId: recovery.recoveryId,
    choice: { kind: "cold" },
  });
  const cold = teaching(await reopened.app.open());
  assert.equal(cold.turn.id, "fixture.graph.l01.t01.s03.again-m");
  assert.equal(cold.runId, start.runId);
  assert.equal(cold.sessionId, start.sessionId);
  assert.equal(cold.packageHash, fixture.content.packageHash);
  if (cold.sessionStatus === "paused")
    assert.equal((await fixture.act(reopened.app, "resume")).kind, "committed");
  assert.equal(teaching(await reopened.app.read()).sessionStatus, "active");

  for (const expectedNodeId of [
    "fixture.graph.l01.t01.s02.response-m",
    "fixture.graph.l01.t01.s01.model-m",
  ]) {
    const projection = teaching(await reopened.app.read());
    const undo = actionFor(projection, "undoAdvance");
    assert.ok(
      undo,
      "Undo advance must be advertised for the saved accepted turn",
    );
    assert.equal(
      (
        await reopened.app.dispatch(
          await prepareCommand({
            projection,
            request: { kind: "action", action: undo },
            ids: fixture.ids,
            hash,
          }),
        )
      ).kind,
      "committed",
    );
    const restored = teaching(await reopened.app.read());
    assert.equal(restored.turn.id, expectedNodeId);
    assert.equal(restored.taskId, "fixture.task");
    assert.equal(restored.runId, start.runId);
    assert.equal(restored.sessionId, start.sessionId);
    assert.equal(restored.runStatus, "inProgress");
    assert.equal(restored.sessionStatus, "active");
  }

  const restoredStart = teaching(await reopened.app.read());
  assert.equal(actionFor(restoredStart, "undoAdvance"), undefined);
  assert.equal(first.db.isOpen, false);
  const application = await reopened.app.readApplication({ kind: "cursor" });
  if (application.kind !== "ready") assert.fail(application.message);
  assert.deepEqual(
    application.course.lessons.map((lesson) => ({
      lessonId: lesson.lessonId,
      progress: lesson.progress,
      tasks: lesson.tasks.map((task) => ({
        taskId: task.id,
        outcome: task.outcome,
      })),
    })),
    [
      {
        lessonId: "fixture.lesson",
        progress: "unfinished",
        tasks: [
          { taskId: "fixture.task", outcome: "unseen" },
          { taskId: "fixture.graph.l01.t02", outcome: "unseen" },
          { taskId: "fixture.graph.l01.t03", outcome: "unseen" },
          { taskId: "fixture.graph.l01.t04", outcome: "unseen" },
          { taskId: "fixture.graph.l01.t05", outcome: "unseen" },
          { taskId: "fixture.graph.l01.t06", outcome: "unseen" },
        ],
      },
    ],
  );
});
