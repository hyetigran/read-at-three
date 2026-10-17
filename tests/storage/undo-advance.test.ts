import assert from "node:assert/strict";
import { test } from "node:test";
import {
  prepareCommand,
  prepareInkCommand,
  prepareWritingCommand,
  parseRuntimePackage,
  canonical,
  parseId,
  parseCounter,
} from "../../packages/teaching/src/index.ts";
import type {
  CommittedProjection,
  TeachingApplication,
} from "../../packages/teaching/src/index.ts";
import { controlFixture } from "../teaching/control-fixture.ts";
import { writingFixture } from "../teaching/writing-fixture.ts";
import { practiceFixture } from "./practice-support.ts";
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

test("terminal Undo withdraws only this run's credit and new acceptance stays on a fresh branch", async (t) => {
  const fixture = await storageFixture(t);
  const { app, db } = fixture.connect();
  await app.open();
  await fixture.act(app, "start");
  for (let i = 0; i < 6; i++) await fixture.act(app, "continue");
  const completed = await app.read();
  assert.equal(completed.kind, "completed");
  if (completed.kind !== "completed") assert.fail("Completion required");
  assert.equal(
    completed.catalog.find((task) => task.id === "fixture.task")?.completed,
    true,
  );
  assert.equal((await fixture.act(app, "undoAdvance")).kind, "committed");
  const reopened = teaching(await app.read());
  assert.equal(reopened.turn.id, "fixture.graph.l01.t01.s06.again-s");
  assert.equal(reopened.runId, completed.runId);
  assert.equal(reopened.runStatus, "inProgress");
  assert.equal(
    reopened.catalog.find((task) => task.id === "fixture.task")?.completed,
    false,
  );
  assert.equal((await fixture.act(app, "continue")).kind, "committed");
  assert.equal((await app.read()).kind, "completed");
  assert.deepEqual(
    db
      .prepare("SELECT seq,status FROM task_advance ORDER BY seq")
      .all()
      .map((row) => [row.seq, row.status]),
    [
      [1, "accepted"],
      [2, "accepted"],
      [3, "accepted"],
      [4, "accepted"],
      [5, "accepted"],
      [6, "withdrawn"],
      [7, "accepted"],
    ],
  );
  assert.deepEqual(
    db
      .prepare("SELECT status FROM task_credit ORDER BY rowid")
      .all()
      .map((row) => row.status),
    ["withdrawn", "valid"],
  );
  await fixture.act(app, "replay");
  for (let i = 0; i < 6; i++) await fixture.act(app, "continue");
  await fixture.act(app, "undoAdvance");
  const earlierCredit = teaching(await app.read());
  assert.notEqual(earlierCredit.runId, completed.runId);
  assert.equal(
    earlierCredit.catalog.find((task) => task.id === "fixture.task")?.completed,
    true,
  );
  assert.deepEqual(
    db
      .prepare("SELECT status FROM task_credit ORDER BY rowid")
      .all()
      .map((row) => row.status),
    ["withdrawn", "valid", "withdrawn"],
  );
});

test("a lost Undo acknowledgement retries exactly once and pre-COMMIT failure preserves all teaching evidence", async (t) => {
  const fixture = await storageFixture(t);
  let failure: "write" | "reply" | null = null;
  const first = fixture.connect({
    hook: async (sql, work) => {
      if (
        failure === "write" &&
        sql.startsWith('insert into "advance_withdrawal"')
      ) {
        failure = null;
        throw new Error("Injected Undo witness failure");
      }
      const result = await work();
      if (failure === "reply" && sql === "COMMIT") {
        failure = null;
        throw new Error("Lost Undo reply");
      }
      return result;
    },
  });
  await first.app.open();
  await fixture.act(first.app, "start");
  await fixture.act(first.app, "continue");
  await fixture.act(first.app, "continue");
  const origin = teaching(await first.app.read());
  const undo = actionFor(origin, "undoAdvance");
  assert.ok(undo);
  const command = await prepareCommand({
    projection: origin,
    request: { kind: "action", action: undo },
    ids: fixture.ids,
    hash,
  });
  const before = first.db
    .prepare("SELECT state,revision,active_advance_id FROM task_run")
    .all();
  failure = "write";
  await assert.rejects(
    first.app.dispatch(command),
    (error: unknown) =>
      error instanceof Error &&
      error.cause instanceof Error &&
      error.cause.message === "Injected Undo witness failure",
  );
  assert.deepEqual(
    first.db
      .prepare("SELECT state,revision,active_advance_id FROM task_run")
      .all(),
    before,
  );
  assert.deepEqual(await first.app.read(), origin);
  failure = "reply";
  await assert.rejects(first.app.dispatch(command), /Lost Undo reply/);
  first.db.close();
  const replacement = fixture.connect();
  const receipt = await replacement.app.dispatch(command);
  assert.equal(receipt.kind, "committed");
  assert.deepEqual(await replacement.app.dispatch(command), receipt);
  assert.equal(
    teaching(await replacement.app.read()).turn.id,
    "fixture.graph.l01.t01.s02.response-m",
  );
  assert.equal(
    replacement.db.prepare("SELECT count(*) AS n FROM advance_withdrawal").get()
      ?.n,
    1,
  );
  replacement.db.prepare("DELETE FROM command_receipt").run();
  const saved = await replacement.app.read();
  assert.equal((await replacement.app.dispatch(command)).kind, "rejected");
  assert.deepEqual(await replacement.app.read(), saved);
  assert.equal(
    (await fixture.act(replacement.app, "undoAdvance")).kind,
    "committed",
  );
  assert.equal(
    teaching(await replacement.app.read()).turn.id,
    "fixture.graph.l01.t01.s01.model-m",
  );
});

test("sequential profile-bound storage reads preserve each child's window and only their new run closes it", async (t) => {
  const fixture = await storageFixture(t);
  const first = fixture.connect();
  await first.app.open();
  await fixture.act(first.app, "start");
  await fixture.act(first.app, "continue");
  await fixture.act(first.app, "continue");
  const saved = teaching(await first.app.read());
  const secondOwner = {
    profileId: parseId({ kind: "profile", value: "zz-child" }),
    generation: parseCounter("0"),
  };
  first.db
    .prepare(
      "INSERT INTO profile(profile_id,generation,revision,undo_run_id,preferences_version,preferences) VALUES(?,0,0,NULL,1,?)",
    )
    .run(secondOwner.profileId, '{"version":1}');
  const primaryUndo = actionFor(saved, "undoAdvance");
  assert.ok(primaryUndo);
  const otherOwnerCommand = await prepareCommand({
    projection: saved,
    request: { kind: "action", action: primaryUndo },
    ids: fixture.ids,
    hash,
  });
  assert.equal((await first.app.dispatch(otherOwnerCommand)).kind, "committed");
  const primaryWindow = first.db
    .prepare("SELECT undo_run_id FROM profile WHERE profile_id=?")
    .get(saved.owner.profileId)?.undo_run_id;
  first.db.close();
  const second = fixture.connect({ owner: secondOwner });
  const secondEntry = await second.app.open();
  assert.equal(secondEntry.kind, "entry");
  if (secondEntry.kind !== "entry") assert.fail("Second child entry required");
  assert.deepEqual(secondEntry.owner, secondOwner);
  assert.equal((await second.app.dispatch(otherOwnerCommand)).kind, "rejected");
  assert.equal(
    second.db
      .prepare("SELECT undo_run_id FROM profile WHERE profile_id=?")
      .get(saved.owner.profileId)?.undo_run_id,
    primaryWindow,
  );
  await fixture.act(second.app, "start");
  await fixture.act(second.app, "continue");
  const secondSaved = teaching(await second.app.read());
  second.db.close();
  const primary = fixture.connect({ owner: saved.owner });
  const returned = teaching(await primary.app.open());
  assert.equal(returned.runId, saved.runId);
  assert.ok(actionFor(returned, "undoAdvance"));
  await fixture.act(
    primary.app,
    "start",
    (action) =>
      "taskId" in action.intent && String(action.intent.taskId).includes("t04"),
  );
  primary.db.close();
  const alternate = fixture.connect({ owner: secondOwner });
  const secondReturned = teaching(await alternate.app.open());
  assert.equal(secondReturned.runId, secondSaved.runId);
  assert.ok(actionFor(secondReturned, "undoAdvance"));
  alternate.db.close();
  const resumed = fixture.connect({ owner: saved.owner });
  await resumed.app.open();
  await fixture.act(
    resumed.app,
    "resume",
    (action) =>
      "sessionId" in action.intent &&
      action.intent.sessionId === saved.sessionId,
  );
  assert.equal(teaching(await resumed.app.read()).runId, saved.runId);
  assert.equal(actionFor(await resumed.app.read(), "undoAdvance"), undefined);
  resumed.db.close();
  const staleOwner = fixture.connect({
    owner: { ...saved.owner, generation: parseCounter("1") },
  });
  assert.equal((await staleOwner.app.open()).kind, "recovery");
  assert.equal(
    staleOwner.db.prepare("SELECT count(*) AS n FROM profile").get()?.n,
    2,
  );
});

test("starting a run in another course permanently closes this child's older Undo window", async (t) => {
  const fixture = await storageFixture(t);
  const first = fixture.connect();
  await first.app.open();
  await fixture.act(first.app, "start");
  await fixture.act(first.app, "continue");
  const saved = teaching(await first.app.read());
  const undo = actionFor(saved, "undoAdvance");
  assert.ok(undo);
  const stale = await prepareCommand({
    projection: saved,
    request: { kind: "action", action: undo },
    ids: fixture.ids,
    hash,
  });
  first.db.close();
  const another = fixture.connect({
    owner: saved.owner,
    content: await writingFixture(),
  });
  await another.app.open();
  await fixture.act(another.app, "start");
  another.db.close();
  const original = fixture.connect({ owner: saved.owner });
  const recovery = await original.app.openRecovery({ kind: "cold" });
  await original.app.reconcileRecovery({
    recoveryId: recovery.recoveryId,
    choice: { kind: "cold" },
  });
  const restored = teaching(await original.app.open());
  assert.equal(restored.runId, saved.runId);
  assert.equal(restored.turn.id, "fixture.graph.l01.t01.s02.response-m");
  assert.equal(actionFor(restored, "undoAdvance"), undefined);
  assert.equal((await original.app.dispatch(stale)).kind, "rejected");
  assert.deepEqual(await original.app.read(), restored);
});

test("writing Undo preserves every layer and history while prior Skip remains valid", async (t) => {
  const fixture = await practiceFixture(t);
  const first = fixture.connect();
  await first.app.open();
  await fixture.action(first.app, "start");
  await fixture.action(first.app, "skipWriting");
  const skipped = await first.app.readApplication({ kind: "cursor" });
  assert.equal(skipped.kind, "ready");
  if (skipped.kind !== "ready") assert.fail("Skipped course required");
  assert.equal(skipped.course.lessons[0]?.progress, "unfinished");
  await fixture.action(first.app, "replay");
  await fixture.action(first.app, "continue");
  await fixture.draw(first.app, 25);
  await fixture.action(first.app, "continue");
  await fixture.draw(first.app, 75);
  await fixture.action(first.app, "confirmTracing");
  await fixture.draw(first.app, 125);
  const { token: oldIndependentToken } = await fixture.current(first.app);
  const staleInk = await prepareInkCommand({
    token: oldIndependentToken,
    edit: {
      kind: "begin",
      strokeId: parseId({ kind: "stroke", value: fixture.ids() }),
      layer: "independent",
      brush: {
        kind: "round",
        width: 5,
        colorRole: "child",
        cap: "round",
        join: "round",
      },
      chunks: [],
    },
    ids: fixture.ids,
    hash,
  });
  await fixture.action(first.app, "confirmIndependent");
  await fixture.action(first.app, "continue");
  await fixture.action(first.app, "confirmTracing");
  await fixture.action(first.app, "confirmIndependent");
  assert.equal((await first.app.read()).kind, "writingResult");
  const inkBefore = {
    strokes: first.db
      .prepare("SELECT * FROM ink_stroke ORDER BY stroke_id")
      .all(),
    chunks: first.db
      .prepare("SELECT * FROM ink_point_chunk ORDER BY stroke_id,chunk_index")
      .all(),
    histories: first.db
      .prepare("SELECT * FROM ink_history ORDER BY document_id,layer")
      .all(),
    operations: first.db
      .prepare("SELECT * FROM ink_operation ORDER BY document_id,layer,seq")
      .all(),
  };
  await fixture.action(first.app, "undoAdvance");
  let projection = await first.app.read();
  assert.equal(projection.kind, "writing");
  if (projection.kind !== "writing") assert.fail("Reopened writing required");
  assert.equal(projection.turn.id, "fixture.writing.turn.7");
  assert.equal(projection.runStatus, "inProgress");
  const course = await first.app.readApplication({ kind: "cursor" });
  assert.equal(course.kind, "ready");
  if (course.kind !== "ready") assert.fail("Course required");
  assert.equal(course.course.lessons[0]?.progress, "unfinished");
  assert.equal(course.course.lessons[0]?.tasks[0]?.outcome, "skipped");
  await fixture.action(first.app, "pause");
  for (let i = 0; i < 4; i++) await fixture.action(first.app, "undoAdvance");
  projection = await first.app.read();
  if (projection.kind !== "writing") assert.fail("Restored tracing required");
  assert.equal(projection.turn.id, "fixture.writing.turn.3");
  const current = projection.documents.find(
    (token) => token.targetId === "first",
  );
  assert.ok(current);
  const snapshot = await first.app.readInk({ token: current });
  assert.equal(snapshot.writable, false);
  assert.equal(projection.sessionStatus, "paused");
  assert.equal(current.phase, "childTracing");
  assert.equal((await first.app.dispatchInk(staleInk)).kind, "rejected");
  await fixture.action(first.app, "resume");
  assert.equal((await fixture.current(first.app)).snapshot.writable, true);
  projection = await first.app.read();
  if (projection.kind !== "writing") assert.fail("Resumed writing required");
  assert.equal(
    snapshot.strokes.filter((stroke) => stroke.layer === "independent").length,
    1,
  );
  assert.equal(
    projection.actions.some(
      (action) => action.intent.kind === "confirmTracing",
    ),
    true,
  );
  assert.equal(
    projection.actions.some(
      (action) => action.intent.kind === "confirmIndependent",
    ),
    false,
  );
  assert.deepEqual(
    {
      strokes: first.db
        .prepare("SELECT * FROM ink_stroke ORDER BY stroke_id")
        .all(),
      chunks: first.db
        .prepare("SELECT * FROM ink_point_chunk ORDER BY stroke_id,chunk_index")
        .all(),
      histories: first.db
        .prepare("SELECT * FROM ink_history ORDER BY document_id,layer")
        .all(),
      operations: first.db
        .prepare("SELECT * FROM ink_operation ORDER BY document_id,layer,seq")
        .all(),
    },
    inkBefore,
  );
  first.db.close();
  const reopened = fixture.connect();
  const inventory = await reopened.app.openRecovery({ kind: "cold" });
  await reopened.app.reconcileRecovery({
    recoveryId: inventory.recoveryId,
    choice: { kind: "cold" },
  });
  const cold = await reopened.app.open();
  assert.equal(cold.kind, "writing");
  if (cold.kind !== "writing") assert.fail("Cold writing required");
  assert.equal(cold.turn.id, "fixture.writing.turn.3");
  assert.equal(
    cold.actions.some((action) => action.intent.kind === "confirmTracing"),
    true,
  );
});

test("bounded receipt cleanup preserves the entire open acceptance chain and cannot repeat a pruned Undo", async (t) => {
  const fixture = await storageFixture(t);
  const { app, db } = fixture.connect();
  await app.open();
  await fixture.act(app, "start");
  await fixture.act(app, "continue");
  await fixture.act(app, "continue");
  const origin = teaching(await app.read());
  const undo = actionFor(origin, "undoAdvance");
  assert.ok(undo);
  const command = await prepareCommand({
    projection: origin,
    request: { kind: "action", action: undo },
    ids: fixture.ids,
    hash,
  });
  assert.equal((await app.dispatch(command)).kind, "committed");
  for (let i = 0; i < 130; i++) {
    assert.equal((await fixture.act(app, "back")).kind, "committed");
    assert.equal((await fixture.act(app, "continue")).kind, "committed");
  }
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS n FROM command_receipt WHERE scope_kind='session'",
      )
      .get()?.n,
    256,
  );
  assert.equal(
    db
      .prepare("SELECT count(*) AS n FROM command_receipt WHERE command_id=?")
      .get(command.commandId)?.n,
    0,
  );
  const retained = teaching(await app.read());
  assert.equal(retained.turn.id, "fixture.graph.l01.t01.s02.response-m");
  assert.equal((await app.dispatch(command)).kind, "rejected");
  assert.deepEqual(await app.read(), retained);
  assert.equal((await fixture.act(app, "undoAdvance")).kind, "committed");
  const start = teaching(await app.read());
  assert.equal(start.turn.id, "fixture.graph.l01.t01.s01.model-m");
  assert.equal(actionFor(start, "undoAdvance"), undefined);
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS n FROM task_advance WHERE status='withdrawn'",
      )
      .get()?.n,
    2,
  );
});

test("missing or rehashed contradictory withdrawal and acceptance evidence refuses writable opening", async (t) => {
  for (const mutation of [
    "missing-witness",
    "wrong-head",
    "wrong-owner",
    "event-revision",
    "allocation-order",
    "missing-preimage",
    "resurrect-status",
  ]) {
    const fixture = await storageFixture(t);
    const { app, db } = fixture.connect();
    await app.open();
    await fixture.act(app, "start");
    await fixture.act(app, "continue");
    await fixture.act(app, "continue");
    await fixture.act(app, "undoAdvance");
    const row = db
      .prepare("SELECT advance_id,command FROM advance_withdrawal")
      .get();
    assert.equal(typeof row?.advance_id, "string");
    if (typeof row?.advance_id !== "string") assert.fail("Withdrawal required");
    if (mutation === "missing-witness")
      db.prepare("DELETE FROM advance_withdrawal").run();
    if (mutation === "wrong-head" || mutation === "wrong-owner") {
      const command = JSON.parse(String(row.command));
      if (mutation === "wrong-head")
        command.payload.advanceId = "unowned-advance";
      else command.owner.profileId = "unowned-profile";
      command.payloadHash = await hash(
        canonical({ kind: command.kind, payload: command.payload }),
      );
      db.prepare("UPDATE advance_withdrawal SET command=?").run(
        canonical(command),
      );
    }
    if (mutation === "event-revision")
      db.prepare(
        "UPDATE advance_withdrawal SET withdrawn_run_revision=2",
      ).run();
    if (mutation === "allocation-order")
      db.prepare(
        "UPDATE task_advance SET accepted_run_revision=CASE seq WHEN 1 THEN 2 ELSE 1 END",
      ).run();
    if (mutation === "missing-preimage")
      db.prepare(
        "UPDATE task_advance SET accepting_command=NULL WHERE seq=1",
      ).run();
    if (mutation === "resurrect-status")
      db.prepare(
        "UPDATE task_advance SET status='accepted' WHERE advance_id=?",
      ).run(row.advance_id);
    const before = db
      .prepare("SELECT state,revision,active_advance_id FROM task_run")
      .all();
    assert.equal((await app.read()).kind, "recovery", mutation);
    assert.deepEqual(
      db.prepare("SELECT state,revision,active_advance_id FROM task_run").all(),
      before,
    );
  }
});

async function optionalWritingCourse() {
  const source = await writingFixture();
  if (source.body.coverage !== "lesson1-complete")
    assert.fail("Writing fixture required");
  const writing = source.body.tasks[0];
  if (!writing || writing.kind !== "soundWritingV1")
    assert.fail("Writing task required");
  const body = {
    coverage: "course-development",
    courseId: source.body.courseId,
    releaseId: source.body.releaseId,
    title: source.body.title,
    lessons: Array.from({ length: 6 }, (_, index) => ({
      lessonId:
        index === 0
          ? source.body.lessonId
          : `fixture.empty.lesson.${index + 1}`,
      number: index + 1,
      title: { kind: "added", text: `Synthetic lesson ${index + 1}` },
      lessonTasks: [
        {
          id: index === 0 ? writing.task.id : `fixture.empty.task.${index + 1}`,
          number: 1,
          title: writing.task.title,
          optional: index === 0,
          artKey: "writing",
        },
      ],
      tasks:
        index === 0
          ? [{ ...writing, task: { ...writing.task, number: 1 } }]
          : [],
    })),
  };
  return parseRuntimePackage(
    { formatVersion: 1, packageHash: await hash(canonical(body)), body },
    hash,
  );
}
async function courseAction(
  app: TeachingApplication,
  kind: string,
  ids: () => string,
) {
  const projection = await app.read();
  const action = actionFor(projection, kind);
  assert.ok(action, `Expected ${kind}`);
  const command =
    projection.kind === "writing" || projection.kind === "writingResult"
      ? await prepareWritingCommand({
          projection,
          action,
          barrier: { kind: "writing", documents: projection.documents },
          ids,
          hash,
        })
      : await prepareCommand({
          projection,
          request: { kind: "action", action },
          ids,
          hash,
        });
  const result = await app.dispatch(command);
  assert.equal(result.kind, "committed");
}

test("Undo of a just-satisfied lesson withdraws exact support while earlier valid lesson credit survives replay", async (t) => {
  const fixture = await storageFixture(t, await optionalWritingCourse());
  const { app, db } = fixture.connect();
  await app.open();
  await courseAction(app, "start", fixture.ids);
  await courseAction(app, "skipWriting", fixture.ids);
  let course = await app.readApplication({ kind: "cursor" });
  if (course.kind !== "ready") assert.fail("Course required");
  assert.equal(course.course.lessons[0]?.progress, "satisfied");
  await courseAction(app, "undoAdvance", fixture.ids);
  course = await app.readApplication({ kind: "cursor" });
  if (course.kind !== "ready") assert.fail("Course required");
  assert.equal(course.course.lessons[0]?.progress, "unfinished");
  assert.equal(course.course.lessons[0]?.tasks[0]?.outcome, "unseen");
  assert.deepEqual(
    db
      .prepare("SELECT status FROM lesson_credit ORDER BY rowid")
      .all()
      .map((row) => row.status),
    ["withdrawn"],
  );
  await courseAction(app, "skipWriting", fixture.ids);
  await courseAction(app, "replay", fixture.ids);
  await courseAction(app, "continue", fixture.ids);
  await courseAction(app, "continue", fixture.ids);
  await courseAction(app, "confirmTracing", fixture.ids);
  await courseAction(app, "confirmIndependent", fixture.ids);
  await courseAction(app, "continue", fixture.ids);
  await courseAction(app, "confirmTracing", fixture.ids);
  await courseAction(app, "confirmIndependent", fixture.ids);
  course = await app.readApplication({ kind: "cursor" });
  if (course.kind !== "ready") assert.fail("Completed course required");
  assert.equal(course.course.lessons[0]?.tasks[0]?.outcome, "completed");
  await courseAction(app, "undoAdvance", fixture.ids);
  course = await app.readApplication({ kind: "cursor" });
  if (course.kind !== "ready") assert.fail("Retained course required");
  assert.equal(course.course.lessons[0]?.progress, "satisfied");
  assert.equal(course.course.lessons[0]?.tasks[0]?.outcome, "skipped");
  assert.deepEqual(
    db
      .prepare("SELECT status FROM lesson_credit ORDER BY rowid")
      .all()
      .map((row) => row.status),
    ["withdrawn", "valid", "withdrawn"],
  );
});

test("Undo follows accepted turns through correction and preserves an explicit paused session", async (t) => {
  const fixture = await storageFixture(t);
  const { app } = fixture.connect();
  await app.open();
  await fixture.act(app, "start");
  await fixture.act(app, "continue");
  await fixture.act(app, "continue");
  await fixture.act(app, "help");
  assert.equal(
    teaching(await app.read()).turn.id,
    "fixture.graph.l01.t01.correction-m",
  );
  await fixture.act(app, "continue");
  assert.equal(
    teaching(await app.read()).turn.id,
    "fixture.graph.l01.t01.s02.response-m",
  );
  await fixture.act(app, "undoAdvance");
  assert.equal(
    teaching(await app.read()).turn.id,
    "fixture.graph.l01.t01.correction-m",
  );
  await fixture.act(app, "undoAdvance");
  assert.equal(
    teaching(await app.read()).turn.id,
    "fixture.graph.l01.t01.s02.response-m",
  );
  await fixture.act(app, "pause");
  await fixture.act(app, "undoAdvance");
  const restored = teaching(await app.read());
  assert.equal(restored.turn.id, "fixture.graph.l01.t01.s01.model-m");
  assert.equal(restored.sessionStatus, "paused");
  assert.equal(actionFor(restored, "continue"), undefined);
  assert.equal(actionFor(restored, "undoAdvance"), undefined);
  await fixture.act(app, "resume");
  assert.equal(
    teaching(await app.read()).turn.id,
    "fixture.graph.l01.t01.s01.model-m",
  );
  assert.equal((await fixture.act(app, "continue")).kind, "committed");
  assert.equal(
    teaching(await app.read()).turn.id,
    "fixture.graph.l01.t01.s02.response-m",
  );
});

test("withdrawn review choices cannot return through Back, old Retry or a newly chosen queue", async (t) => {
  const control = await controlFixture();
  const fixture = await storageFixture(t, control.content);
  const { app, db } = fixture.connect();
  await app.open();
  await fixture.act(
    app,
    "start",
    (action) =>
      "taskId" in action.intent && action.intent.taskId === control.taskId,
  );
  await fixture.act(app, "continue");
  await fixture.act(app, "parentReady");
  for (let i = 0; i < 5; i++) await fixture.act(app, "continue");
  let selection = await app.read();
  if (selection.kind !== "reviewSelection")
    assert.fail("Review selection required");
  const first = selection.items[0];
  assert.ok(first);
  const chosen = await prepareCommand({
    projection: selection,
    request: {
      kind: "review",
      action: selection.selectionAction,
      choice: { kind: "items", itemIds: [first.itemId] },
    },
    ids: fixture.ids,
    hash,
  });
  const accepted = await app.dispatch(chosen);
  assert.equal(accepted.kind, "committed");
  await fixture.act(app, "back");
  selection = await app.read();
  if (selection.kind !== "reviewSelection")
    assert.fail("Saved choice required");
  assert.deepEqual(selection.committedChoice, {
    kind: "items",
    itemIds: [first.itemId],
  });
  await fixture.act(app, "undoAdvance");
  selection = await app.read();
  if (selection.kind !== "reviewSelection")
    assert.fail("Withdrawn choice selection required");
  assert.equal(selection.committedChoice, null);
  assert.deepEqual(await app.dispatch(chosen), accepted);
  assert.deepEqual(await app.read(), selection);
  const none = await prepareCommand({
    projection: selection,
    request: {
      kind: "review",
      action: selection.selectionAction,
      choice: { kind: "none" },
    },
    ids: fixture.ids,
    hash,
  });
  assert.equal((await app.dispatch(none)).kind, "committed");
  assert.equal((await app.read()).kind, "completed");
  await fixture.act(app, "undoAdvance");
  const reopened = await app.read();
  if (reopened.kind !== "reviewSelection")
    assert.fail("Review obligation must reopen");
  assert.equal(reopened.committedChoice, null);
  assert.equal(reopened.runStatus, "inProgress");
  assert.equal(
    db
      .prepare("SELECT count(*) AS n FROM task_credit WHERE status='valid'")
      .get()?.n,
    0,
  );
});
