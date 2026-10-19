import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  increment,
  encodeInkPoints,
  parseHash,
  parseId,
  prepareCommand,
  prepareWritingCommand,
} from "@readatthree/teaching";
import type {
  DocumentToken,
  InkEdit,
  SelectedApplication,
  TeachingIntent,
} from "@readatthree/teaching";
import { syntheticLessonFiveCompletion } from "../lesson-five-completion-fixture.ts";
import { storageFixture, hash } from "./support.ts";
import {
  executeInk,
  executeTeaching,
  prepareSelectedInk,
  prepareSelectedTeaching,
  selectedInk,
  selectedProjection,
  selectedCourse,
} from "./selected-support.ts";
async function action(
  app: SelectedApplication,
  kind: TeachingIntent["kind"],
  ids: () => string,
) {
  const projection = await selectedProjection(app);
  if (projection.kind === "recovery") throw Error(projection.message);
  const next = projection.actions.find((item) => item.intent.kind === kind);
  if (!next) throw Error(`Missing ${kind} at ${projection.kind}`);
  const operation = await prepareSelectedTeaching(app, () =>
    projection.kind === "writing" || projection.kind === "writingResult"
      ? prepareWritingCommand({
          projection,
          action: next,
          barrier: { kind: "writing", documents: projection.documents },
          ids,
          hash,
        })
      : prepareCommand({
          projection,
          request: { kind: "action", action: next },
          ids,
          hash,
        }),
  );
  const result = await executeTeaching(app, operation);
  assert.equal(result.kind, "committed");
  assert.deepEqual(await executeTeaching(app, operation), result);
  return result;
}
async function ink(
  app: SelectedApplication,
  token: DocumentToken,
  edit: InkEdit,
  ids: () => string,
) {
  return prepareSelectedInk(app, async () => ({
    kind: "ink",
    commandId: parseId({ kind: "command", value: ids() }),
    token,
    edit,
    payloadHash: parseHash({
      kind: "payload",
      value: await hash(canonical({ kind: "ink", token, edit })),
    }),
  }));
}
test("V3 real SQL keeps model ink readonly at the statement through reopen, Back, Undo and reconfirmation", async (t) => {
  const { content, taskIds } = await syntheticLessonFiveCompletion();
  const f = await storageFixture(t, content);
  let c = await f.connectReady();
  await f.act(
    c.app,
    "start",
    (a) => "taskId" in a.intent && a.intent.taskId === taskIds[2],
  );
  let p = await selectedProjection(c.app);
  if (p.kind !== "writing") throw Error("Writing required");
  const token = p.documents[0];
  assert.ok(token);
  const strokeId = parseId({ kind: "stroke", value: f.ids() });
  const begin = await ink(
    c.app,
    token,
    {
      kind: "begin",
      strokeId,
      layer: "model",
      brush: {
        kind: "round",
        width: 4,
        colorRole: "model",
        cap: "round",
        join: "round",
      },
      chunks: [
        {
          chunkIndex: 0,
          firstPointIndex: 0,
          pointCount: 1,
          codecVersion: 1,
          payload: [
            ...encodeInkPoints({
              points: [{ x: 10, y: 100, elapsedMs: 0 }],
              bounds: { width: 1600, height: 400 },
            }),
          ],
        },
      ],
    },
    f.ids,
  );
  const first = await executeInk(c.app, begin);
  assert.equal(first.kind, "inkCommitted");
  if (first.kind !== "inkCommitted") throw Error("Ink receipt required");
  const finish = await ink(
    c.app,
    first.token,
    {
      kind: "finalize",
      strokeId,
      layer: "model",
      chunks: [],
      status: "finished",
    },
    f.ids,
  );
  const saved = await executeInk(c.app, finish);
  assert.equal(saved.kind, "inkCommitted");
  if (saved.kind !== "inkCommitted") throw Error("Ink receipt required");
  const before = await selectedInk(c.app, { token: saved.token });
  const stale = await ink(
    c.app,
    saved.token,
    {
      kind: "begin",
      strokeId: parseId({ kind: "stroke", value: f.ids() }),
      layer: "model",
      brush: {
        kind: "round",
        width: 4,
        colorRole: "model",
        cap: "round",
        join: "round",
      },
      chunks: [],
    },
    f.ids,
  );
  await action(c.app, "continue", f.ids);
  p = await selectedProjection(c.app);
  if (p.kind !== "writing") throw Error("Writing statement required");
  assert.ok(p.turn.presentation.kind === "writing");
  assert.equal(p.turn.presentation.obligation.kind, "parentInstruction");
  const statement = p.documents[0];
  assert.ok(statement);
  assert.equal(statement.documentId, saved.token.documentId);
  assert.equal(statement.phase, "parentDemonstration");
  let snapshot = await selectedInk(c.app, { token: statement });
  assert.equal(snapshot.writable, false);
  assert.deepEqual(snapshot.strokes, before.strokes);
  assert.deepEqual(snapshot.histories, before.histories);
  assert.equal((await executeInk(c.app, stale)).kind, "rejected");
  const readonlyAttempt = await ink(
    c.app,
    statement,
    stale.command.edit,
    f.ids,
  );
  assert.equal((await executeInk(c.app, readonlyAttempt)).kind, "rejected");
  assert.deepEqual(await selectedInk(c.app, { token: statement }), snapshot);
  c.db.close();
  c = f.connect();
  await c.app.readDirectory();
  const opening = await c.app.openRecovery({ kind: "cold" });
  await c.app.reconcileRecovery({
    recoveryId: opening.recoveryId,
    choice: { kind: "cold" },
  });
  const reopened = await selectedProjection(c.app);
  assert.deepEqual(reopened, {
    ...p,
    documents: p.documents.map((document) => ({
      ...document,
      revision: increment(document.revision),
      inputEpoch: increment(document.inputEpoch),
    })),
  });
  if (reopened.kind !== "writing") throw Error("Writing statement required");
  const reopenedToken = reopened.documents[0];
  assert.ok(reopenedToken);
  snapshot = await selectedInk(c.app, { token: reopenedToken });
  assert.deepEqual(snapshot.strokes, before.strokes);
  assert.deepEqual(snapshot.histories, before.histories);
  assert.equal(snapshot.writable, false);
  await action(c.app, "back", f.ids);
  const back = await selectedProjection(c.app);
  if (back.kind !== "writing") throw Error("Writing history required");
  const historical = back.documents[0];
  assert.ok(historical);
  assert.equal(
    (await selectedInk(c.app, { token: historical })).writable,
    false,
  );
  await action(c.app, "continue", f.ids);
  await action(c.app, "undoAdvance", f.ids);
  const undone = await selectedProjection(c.app);
  if (undone.kind !== "writing") throw Error("Writing statement required");
  assert.ok(undone.turn.presentation.kind === "writing");
  assert.equal(undone.turn.presentation.obligation.kind, "parentModel");
  const undoneToken = undone.documents[0];
  assert.ok(undoneToken);
  assert.equal(
    (await selectedInk(c.app, { token: undoneToken })).writable,
    true,
  );
  await action(c.app, "continue", f.ids);
  const restated = await selectedProjection(c.app);
  if (restated.kind !== "writing") throw Error("Restated instruction required");
  const restatedToken = restated.documents[0];
  assert.ok(restatedToken);
  snapshot = await selectedInk(c.app, { token: restatedToken });
  assert.equal(snapshot.writable, false);
  assert.deepEqual(snapshot.strokes, before.strokes);
  assert.deepEqual(snapshot.histories, before.histories);
  await action(c.app, "continue", f.ids);
  const trace = await selectedProjection(c.app);
  if (trace.kind !== "writing") throw Error("Tracing required");
  const traceToken = trace.documents[0];
  assert.ok(traceToken);
  snapshot = await selectedInk(c.app, { token: traceToken });
  assert.equal(snapshot.token.documentId, saved.token.documentId);
  assert.equal(snapshot.token.phase, "childTracing");
  assert.equal(snapshot.writable, true);
  assert.deepEqual(snapshot.strokes, before.strokes);
  assert.deepEqual(snapshot.histories, before.histories);
});
test("Lesson5 requires all77 core responses and explicit optional decision before durable lesson credit", async (t) => {
  const { content } = await syntheticLessonFiveCompletion();
  const f = await storageFixture(t, content);
  let c = await f.connectReady();
  if (!("lessons" in content.body)) throw Error("Cumulative content required");
  const lesson = content.body.lessons[4];
  assert.ok(lesson);
  for (const [i, entry] of lesson.tasks.entries()) {
    await f.act(
      c.app,
      "start",
      (a) => "taskId" in a.intent && a.intent.taskId === entry.task.id,
    );
    if (i === 8) {
      assert.equal(
        c.db.prepare("SELECT count(*) AS n FROM lesson_credit").get()?.n,
        0,
      );
      await action(c.app, "skipWriting", f.ids);
    } else
      for (let j = 0; j < ([3, 4, 8, 20, 8, 8, 18, 8][i] ?? 0); j++) {
        const p = await selectedProjection(c.app);
        if (p.kind !== "teaching") throw Error("Teaching required");
        await action(
          c.app,
          p.actions.some((a) => a.intent.kind === "parentReady")
            ? "parentReady"
            : "continue",
          f.ids,
        );
        c.db.close();
        c = f.connect();
        await c.app.readDirectory();
      }
  }
  assert.equal(
    c.db
      .prepare("SELECT count(*) AS n FROM task_credit WHERE status='valid'")
      .get()?.n,
    9,
  );
  assert.equal(
    c.db
      .prepare("SELECT count(*) AS n FROM lesson_credit WHERE status='valid'")
      .get()?.n,
    1,
  );
  const course = await selectedCourse(c.app);
  assert.equal(
    course.kind === "ready" ? course.course.lessons[4]?.progress : null,
    "satisfied",
  );
  await action(c.app, "undoAdvance", f.ids);
  assert.equal(
    c.db
      .prepare("SELECT count(*) AS n FROM lesson_credit WHERE status='valid'")
      .get()?.n,
    0,
  );
});
