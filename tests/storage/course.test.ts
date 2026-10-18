import {
  executeTeaching,
  prepareSelectedTeaching,
  selectedCourse,
  selectedProjection,
  selectedWork,
} from "./selected-support.ts";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  canonical,
  parseDevelopmentPackage,
  parseRuntimePackage,
  prepareCommand,
  prepareWritingCommand,
} from "../../packages/teaching/src/index.ts";
import type {
  AvailableAction,
  CommittedProjection,
  SelectedApplication,
  RuntimePackage,
  TeachingIntent,
} from "../../packages/teaching/src/index.ts";
import { hash, storageFixture } from "./support.ts";
async function sourceFixture() {
  return parseDevelopmentPackage(
    JSON.parse(
      await readFile("tests/fixtures/writing-development-package.json", "utf8"),
    ),
    hash,
  );
}
async function courseFixture() {
  const original = await sourceFixture();
  if (original.body.coverage !== "lesson1-complete")
    throw new Error("Full synthetic lesson required");
  const originalBody = original.body;
  const body = {
    coverage: "course-development",
    courseId: originalBody.courseId,
    releaseId: "fixture.course.release",
    title: { kind: "added", text: "Synthetic course" },
    lessons: Array.from({ length: 6 }, (_, index) =>
      index === 0
        ? {
            lessonId: originalBody.lessonId,
            number: 1,
            title: originalBody.title,
            lessonTasks: originalBody.lessonTasks.map((task) => ({
              ...task,
              artKey: task.optional ? "writing" : "printedSound",
            })),
            tasks: originalBody.tasks,
          }
        : {
            lessonId: `fixture.lesson.${index + 1}`,
            number: index + 1,
            title: { kind: "added", text: `Synthetic lesson ${index + 1}` },
            lessonTasks: [
              {
                id: `fixture.task.${index + 1}`,
                number: 1,
                title: { kind: "added", text: "Synthetic missing teaching" },
                optional: false,
                artKey: "oralSounds",
              },
            ],
            tasks: [],
          },
    ),
  };
  return parseRuntimePackage(
    { formatVersion: 1, packageHash: await hash(canonical(body)), body },
    hash,
  );
}
function ready(projection: CommittedProjection) {
  if (projection.kind === "recovery") throw new Error(projection.message);
  return projection;
}
async function commandFor({
  app,
  kind,
  ids,
  matches = () => true,
}: {
  app: SelectedApplication;
  kind: TeachingIntent["kind"];
  ids: () => string;
  matches?: (action: AvailableAction) => boolean;
}) {
  const projection = ready(await selectedProjection(app)),
    action = projection.actions.find(
      (action) => action.intent.kind === kind && matches(action),
    );
  assert.ok(action, `Missing ${kind} at ${projection.kind}`);
  return projection.kind === "writing" || projection.kind === "writingResult"
    ? prepareSelectedTeaching(app, async () =>
        prepareWritingCommand({
          projection,
          action,
          barrier: { kind: "writing", documents: projection.documents },
          ids,
          hash,
        }),
      )
    : prepareSelectedTeaching(app, async () =>
        prepareCommand({
          projection,
          request: { kind: "action", action },
          ids,
          hash,
        }),
      );
}
async function act(
  app: SelectedApplication,
  ids: () => string,
  kind: TeachingIntent["kind"],
  matches?: (action: AvailableAction) => boolean,
) {
  const command = await commandFor({
      app,
      ids,
      kind,
      ...(matches ? { matches } : {}),
    }),
    result = await executeTeaching(app, command);
  assert.equal(result.kind, "committed");
  return result;
}
async function finish(app: SelectedApplication, ids: () => string) {
  for (let i = 0; i < 250; i++) {
    const projection = ready(await selectedProjection(app));
    if ("runStatus" in projection && projection.runStatus !== "inProgress")
      return projection;
    if (
      projection.kind === "reviewSelection" &&
      projection.committedChoice === null
    ) {
      assert.equal(
        (
          await executeTeaching(
            app,
            await prepareSelectedTeaching(app, async () =>
              prepareCommand({
                projection,
                request: {
                  kind: "review",
                  action: projection.selectionAction,
                  choice: { kind: "none" },
                },
                ids,
                hash,
              }),
            ),
          )
        ).kind,
        "committed",
      );
      continue;
    }
    const action =
      projection.actions.find(
        (action) => action.intent.kind === "parentReady",
      ) ??
      projection.actions.find(
        (action) =>
          action.intent.kind === "confirmTracing" ||
          action.intent.kind === "confirmIndependent",
      ) ??
      projection.actions.find((action) => action.intent.kind === "continue");
    assert.ok(action, `No final action at ${projection.kind}`);
    await act(app, ids, action.intent.kind);
  }
  throw new Error("Teaching did not finish");
}
async function replayWriting(
  app: SelectedApplication & SelectedApplication,
  ids: () => string,
) {
  const view = await selectedCourse(app, { kind: "cursor" });
  assert.equal(view.kind, "ready");
  if (view.kind !== "ready") throw new Error("Course unavailable");
  const task = view.course.lessons[0]?.tasks.find((task) => task.optional);
  assert.ok(task);
  return act(
    app,
    ids,
    "replay",
    (action) => "taskId" in action.intent && action.intent.taskId === task.id,
  );
}
async function completeCore(
  app: SelectedApplication & SelectedApplication,
  ids: () => string,
  content: RuntimePackage,
) {
  const view = await selectedCourse(app, { kind: "cursor" });
  assert.equal(view.kind, "ready");
  if (view.kind !== "ready") throw new Error("Course unavailable");
  for (const task of view.course.lessons[0]?.tasks ?? []) {
    if (task.optional) continue;
    await act(
      app,
      ids,
      "start",
      (action) => "taskId" in action.intent && action.intent.taskId === task.id,
    );
    await finish(app, ids);
  }
}
function count(
  db: ReturnType<Awaited<ReturnType<typeof storageFixture>>["connect"]>["db"],
  table: string,
) {
  return Number(db.prepare(`SELECT count(*) AS n FROM ${table}`).get()?.n);
}

test("coherent course reads preserve source order, exact saved work and full supported optional Skip across physical cold open", async (t) => {
  const content = await courseFixture(),
    f = await storageFixture(t, content),
    { app, db } = await f.connectReady();
  await selectedProjection(app);
  let view = await selectedCourse(app, { kind: "cursor" });
  assert.equal(view.kind, "ready");
  if (view.kind !== "ready") return;
  assert.equal(view.course.lessons.length, 6);
  assert.equal(view.course.lessons[0]?.tasks.length, 6);
  assert.equal(
    view.course.lessons[1]?.tasks[0]?.availability,
    "missingTeaching",
  );
  assert.equal(view.course.lessons[0]?.progress, "unfinished");
  await completeCore(app, f.ids, content);
  assert.equal(count(db, "lesson_credit"), 0);
  await act(
    app,
    f.ids,
    "start",
    (action) =>
      "taskId" in action.intent &&
      view.kind === "ready" &&
      action.intent.taskId === view.course.lessons[0]?.tasks[5]?.id,
  );
  const receipt = await act(app, f.ids, "skipWriting");
  if (receipt.kind !== "committed") return;
  const accepted = await selectedCourse(app, { kind: "accepted", receipt });
  assert.equal(accepted.kind, "ready");
  if (accepted.kind !== "ready") return;
  assert.equal(accepted.projection.kind, "writingResult");
  assert.equal(accepted.course.lessons[0]?.progress, "satisfied");
  assert.equal(accepted.course.lessons[0]?.tasks[5]?.outcome, "skipped");
  assert.equal(count(db, "lesson_credit"), 1);
  assert.equal(count(db, "lesson_credit_support"), 6);
  assert.equal(count(db, "lesson_result"), 1);
  const savedReceipt = db
    .prepare("SELECT receipt FROM lesson_credit")
    .get()?.receipt;
  assert.equal(typeof savedReceipt, "string");
  if (typeof savedReceipt !== "string") return;
  assert.equal(savedReceipt, canonical(JSON.parse(savedReceipt)));
  const before = db.prepare("SELECT * FROM course_cursor").all(),
    runCount = count(db, "task_run"),
    history = await selectedWork(app, {
      owner: accepted.witness.owner,
      runId: receipt.runId,
    });
  assert.equal(history.documents.length, 2);
  assert.ok(
    history.documents.every(
      (document) =>
        document.access === "readOnly" &&
        !("token" in document.snapshot) &&
        !("writable" in document.snapshot),
    ),
  );
  assert.deepEqual(db.prepare("SELECT * FROM course_cursor").all(), before);
  assert.equal(count(db, "task_run"), runCount);
  await replayWriting(app, f.ids);
  assert.equal(count(db, "lesson_credit"), 1);
  const replay = ready(await selectedProjection(app));
  assert.ok("runId" in replay && replay.runId !== receipt.runId);
  const reopened = await f.connectReady();
  const recovery = await reopened.app.openRecovery({ kind: "cold" });
  await reopened.app.reconcileRecovery({
    recoveryId: recovery.recoveryId,
    choice: { kind: "cold" },
  });
  const cold = await selectedCourse(reopened.app, { kind: "cursor" });
  assert.equal(cold.kind, "ready");
  if (cold.kind !== "ready") return;
  assert.equal(cold.course.lessons[0]?.progress, "satisfied");
  assert.equal(cold.course.lessons[0]?.tasks[5]?.outcome, "skipped");
  assert.equal(cold.course.resume.kind, "unfinished");
});

test("an older resumed run completes with a cleared cursor and receipt-targeted terminal publication while other paused work stays explicit", async (t) => {
  const f = await storageFixture(t, await courseFixture()),
    { app, db } = await f.connectReady();
  await selectedProjection(app);
  let view = await selectedCourse(app, { kind: "cursor" });
  assert.equal(view.kind, "ready");
  if (view.kind !== "ready") return;
  const first = view.course.lessons[0]?.tasks[0],
    fourth = view.course.lessons[0]?.tasks[3],
    third = view.course.lessons[0]?.tasks[2];
  assert.ok(first && fourth && third);
  await act(
    app,
    f.ids,
    "start",
    (action) => "taskId" in action.intent && action.intent.taskId === first.id,
  );
  const older = ready(await selectedProjection(app));
  assert.ok("sessionId" in older);
  await act(app, f.ids, "pause");
  await act(
    app,
    f.ids,
    "start",
    (action) => "taskId" in action.intent && action.intent.taskId === third.id,
  );
  await act(app, f.ids, "pause");
  await act(
    app,
    f.ids,
    "start",
    (action) => "taskId" in action.intent && action.intent.taskId === fourth.id,
  );
  await finish(app, f.ids);
  await act(
    app,
    f.ids,
    "resume",
    (action) =>
      "sessionId" in action.intent &&
      action.intent.sessionId === older.sessionId,
  );
  let terminal: Awaited<ReturnType<typeof executeTeaching>> | undefined;
  for (let i = 0; i < 6; i++) terminal = await act(app, f.ids, "continue");
  assert.equal(terminal?.kind, "committed");
  if (terminal?.kind !== "committed") return;
  assert.equal((await selectedProjection(app)).kind, "entry");
  assert.equal(
    db.prepare("SELECT resume_session_id FROM course_cursor").get()
      ?.resume_session_id,
    null,
  );
  const accepted = await selectedCourse(app, {
    kind: "accepted",
    receipt: terminal,
  });
  assert.equal(accepted.kind, "ready");
  if (accepted.kind !== "ready") return;
  assert.equal(accepted.projection.kind, "completed");
  assert.equal(
    accepted.projection.actions.some(
      (action) =>
        action.intent.kind === "back" || action.intent.kind === "continue",
    ),
    false,
  );
  assert.equal(accepted.course.resume.kind, "none");
  assert.equal(accepted.course.lessons[0]?.tasks[2]?.unfinished.length, 1);
  const before = db.prepare("SELECT * FROM course_cursor").all();
  await selectedWork(app, { owner: terminal.owner, runId: terminal.runId });
  assert.deepEqual(db.prepare("SELECT * FROM course_cursor").all(), before);
  const reopened = await f.connectReady();
  assert.equal((await selectedProjection(reopened.app)).kind, "entry");
  await act(
    app,
    f.ids,
    "replay",
    (action) => "taskId" in action.intent && action.intent.taskId === fourth.id,
  );
  const newer = ready(await selectedProjection(app));
  assert.ok("runId" in newer);
  const newerCursor = db.prepare("SELECT * FROM course_cursor").all();
  const earlierReceipt = await selectedCourse(app, {
    kind: "accepted",
    receipt: terminal,
  });
  assert.equal(earlierReceipt.kind, "ready");
  if (earlierReceipt.kind === "ready") {
    assert.equal(earlierReceipt.projection.kind, "completed");
    assert.equal(earlierReceipt.course.resume.kind, "unfinished");
    if (earlierReceipt.course.resume.kind === "unfinished")
      assert.equal(earlierReceipt.course.resume.work.runId, newer.runId);
  }
  assert.deepEqual(
    db.prepare("SELECT * FROM course_cursor").all(),
    newerCursor,
  );
});

for (const boundary of ["beforeCommit", "afterCommit"] as const)
  test(`lesson support ${boundary} fault rolls back or retries exactly once`, async (t) => {
    const f = await storageFixture(t, await courseFixture());
    let armed = false;
    const connection = await f.connectReady({
        hook: async (sql, work) => {
          if (armed && sql === "COMMIT") {
            armed = false;
            if (boundary === "afterCommit") await work();
            throw new Error("Injected acknowledgment boundary");
          }
          return work();
        },
      }),
      { app, db } = connection;
    await selectedProjection(app);
    await completeCore(app, f.ids, f.content);
    const view = await selectedCourse(app, { kind: "cursor" });
    assert.equal(view.kind, "ready");
    if (view.kind !== "ready") return;
    const writing = view.course.lessons[0]?.tasks.find((task) => task.optional);
    assert.ok(writing);
    await act(
      app,
      f.ids,
      "start",
      (action) =>
        "taskId" in action.intent && action.intent.taskId === writing.id,
    );
    const command = await commandFor({ app, ids: f.ids, kind: "skipWriting" });
    armed = true;
    await assert.rejects(executeTeaching(app, command));
    assert.equal(
      count(db, "lesson_credit"),
      boundary === "beforeCommit" ? 0 : 1,
    );
    const receipt = await executeTeaching(app, command);
    assert.equal(receipt.kind, "committed");
    assert.equal(count(db, "lesson_credit"), 1);
    assert.equal(count(db, "lesson_credit_support"), 6);
    assert.equal(count(db, "lesson_result"), 1);
    assert.equal(count(db, "task_credit"), 6);
    assert.equal(
      db
        .prepare("SELECT count(*) AS n FROM command_receipt WHERE command_id=?")
        .get(command.command.commandId)?.n,
      1,
    );
  });

async function satisfy(
  f: Awaited<ReturnType<typeof storageFixture>>,
  app: SelectedApplication & SelectedApplication,
  writing: "completed" | "skipped",
) {
  await selectedProjection(app);
  await completeCore(app, f.ids, f.content);
  const view = await selectedCourse(app, { kind: "cursor" });
  assert.equal(view.kind, "ready");
  if (view.kind !== "ready") throw new Error("Course unavailable");
  const task = view.course.lessons[0]?.tasks.find((task) => task.optional);
  assert.ok(task);
  await act(
    app,
    f.ids,
    "start",
    (action) => "taskId" in action.intent && action.intent.taskId === task.id,
  );
  if (writing === "skipped") await act(app, f.ids, "skipWriting");
  else await finish(app, f.ids);
}
async function release(content: RuntimePackage, additional = false) {
  if (content.body.coverage !== "course-development")
    throw new Error("Cumulative fixture required");
  const first = content.body.lessons[0];
  assert.ok(first);
  const printed = first.tasks.find((entry) => entry.kind === "printedGraphV1");
  assert.ok(printed && printed.kind === "printedGraphV1");
  const extra = {
    ...printed,
    task: {
      ...printed.task,
      id: "fixture.editorial.additional",
      number: 7,
      title: { kind: "added", text: "Synthetic additional practice" },
    },
  };
  const body = {
    ...content.body,
    releaseId: additional
      ? "fixture.course.editorial"
      : "fixture.course.release-only",
    lessons: content.body.lessons.map((lesson, index) =>
      index === 0 && additional
        ? {
            ...lesson,
            lessonTasks: [
              ...lesson.lessonTasks,
              {
                id: extra.task.id,
                number: 7,
                title: extra.task.title,
                optional: false,
                artKey: "printedSound",
              },
            ],
            tasks: [...lesson.tasks, extra],
          }
        : lesson,
    ),
  };
  return parseRuntimePackage(
    { formatVersion: 1, body, packageHash: await hash(canonical(body)) },
    hash,
  );
}

test("completed writing dominates skipped replay, and unfinished Replay retains accepted historical lesson support", async (t) => {
  const f = await storageFixture(t, await courseFixture()),
    { app, db } = await f.connectReady();
  await satisfy(f, app, "completed");
  const selected = db.prepare("SELECT * FROM lesson_result").all(),
    receipts = db
      .prepare("SELECT receipt FROM task_credit ORDER BY credit_id")
      .all();
  await replayWriting(app, f.ids);
  const replay = ready(await selectedProjection(app));
  assert.equal(replay.kind, "writing");
  assert.deepEqual(db.prepare("SELECT * FROM lesson_result").all(), selected);
  await act(app, f.ids, "skipWriting");
  const view = await selectedCourse(app, { kind: "cursor" });
  assert.equal(view.kind, "ready");
  if (view.kind !== "ready") return;
  assert.equal(view.course.lessons[0]?.tasks[5]?.outcome, "completed");
  assert.equal(view.course.lessons[0]?.progress, "satisfied");
  assert.equal(count(db, "lesson_credit"), 1);
  assert.deepEqual(db.prepare("SELECT * FROM lesson_result").all(), selected);
  assert.ok(
    receipts.every((receipt) =>
      db
        .prepare("SELECT receipt FROM task_credit WHERE receipt=?")
        .get(receipt.receipt ?? null),
    ),
  );
});

test("release-only packages share canonical support while editorial tasks preserve the historical accepted task set", async (t) => {
  const content = await courseFixture(),
    f = await storageFixture(t, content),
    first = await f.connectReady();
  await satisfy(f, first.app, "skipped");
  const original = first.db.prepare("SELECT * FROM lesson_credit").all(),
    selected = first.db.prepare("SELECT * FROM lesson_result").all();
  const next = await release(content),
    same = await f.connectReady({ content: next });
  const recovery = await same.app.openRecovery({ kind: "cold" });
  await same.app.reconcileRecovery({
    recoveryId: recovery.recoveryId,
    choice: { kind: "cold" },
  });
  await replayWriting(same.app, f.ids);
  await act(same.app, f.ids, "skipWriting");
  assert.deepEqual(
    same.db.prepare("SELECT * FROM lesson_credit").all(),
    original,
  );
  assert.deepEqual(
    same.db.prepare("SELECT * FROM lesson_result").all(),
    selected,
  );
  const editorial = await f.connectReady({
      content: await release(next, true),
    }),
    inventory = await editorial.app.openRecovery({ kind: "cold" });
  await editorial.app.reconcileRecovery({
    recoveryId: inventory.recoveryId,
    choice: { kind: "cold" },
  });
  const view = await selectedCourse(editorial.app, { kind: "cursor" });
  assert.equal(view.kind, "ready");
  if (view.kind !== "ready") return;
  assert.equal(view.course.lessons[0]?.tasks.length, 7);
  assert.equal(view.course.lessons[0]?.progress, "satisfied");
  assert.equal(view.course.lessons[0]?.tasks[6]?.outcome, "unseen");
  assert.equal(view.course.lessons[0]?.tasks[6]?.availability, "ready");
  assert.deepEqual(
    editorial.db.prepare("SELECT * FROM lesson_credit").all(),
    original,
  );
});

for (const corruption of ["order", "hash", "receipt"] as const)
  test(`corrupt ${corruption} lesson support enters preserved recovery`, async (t) => {
    const f = await storageFixture(t, await courseFixture()),
      { app, db } = await f.connectReady();
    await satisfy(f, app, "skipped");
    const protectedReceipts = db
      .prepare("SELECT receipt FROM task_credit ORDER BY credit_id")
      .all();
    if (corruption === "order")
      db.exec(
        "BEGIN; UPDATE lesson_credit_support SET ordinal=99 WHERE ordinal=0; UPDATE lesson_credit_support SET ordinal=0 WHERE ordinal=1; UPDATE lesson_credit_support SET ordinal=1 WHERE ordinal=99; COMMIT",
      );
    else if (corruption === "hash")
      db.prepare("UPDATE lesson_credit SET support_hash=?").run("0".repeat(64));
    else
      db.prepare("UPDATE lesson_credit SET receipt=?").run(
        canonical({ version: 1 }),
      );
    const before = db.prepare("SELECT * FROM lesson_credit").all(),
      cold = f.connect();
    assert.equal((await selectedProjection(cold.app)).kind, "recovery");
    assert.deepEqual(
      cold.db.prepare("SELECT * FROM lesson_credit").all(),
      before,
    );
    assert.deepEqual(
      cold.db
        .prepare("SELECT receipt FROM task_credit ORDER BY credit_id")
        .all(),
      protectedReceipts,
    );
    assert.equal(count(cold.db, "task_credit"), 6);
  });

test("normalized lesson support rejects a cross-owner edge using the actual SQLite composite FKs", async (t) => {
  const f = await storageFixture(t, await courseFixture()),
    { app, db } = await f.connectReady();
  await satisfy(f, app, "skipped");
  const edge = db
    .prepare("SELECT * FROM lesson_credit_support WHERE ordinal=0")
    .get();
  assert.ok(edge);
  db.prepare(
    "INSERT INTO profile(profile_id,generation,revision,undo_run_id,preferences_version,preferences) VALUES(?,0,0,NULL,1,?)",
  ).run("fixture.other.owner", canonical({ version: 1 }));
  assert.throws(
    () =>
      db
        .prepare(
          "INSERT INTO lesson_credit_support(lesson_credit_id,profile_id,generation,course_id,lesson_id,ordinal,task_id,outcome,task_credit_id) VALUES(?,?,?,?,?,?,?,?,?)",
        )
        .run(
          edge.lesson_credit_id ?? null,
          "fixture.other.owner",
          edge.generation ?? null,
          edge.course_id ?? null,
          edge.lesson_id ?? null,
          99,
          "fixture.cross.owner",
          edge.outcome ?? null,
          edge.task_credit_id ?? null,
        ),
    /FOREIGN KEY/,
  );
  assert.equal(count(db, "lesson_credit_support"), 6);
});

test("actual offline Query reads publish profile Start and Resume receipts with the session revision witness", async (t) => {
  const { QueryClient } = await import("@tanstack/react-query"),
    client = new QueryClient({
      defaultOptions: { queries: { retry: false, networkMode: "always" } },
    });
  t.after(() => client.clear());
  const f = await storageFixture(t, await courseFixture()),
    { app } = await f.connectReady();
  await selectedProjection(app);
  const start = await act(app, f.ids, "start");
  assert.equal(start.kind, "committed");
  if (start.kind !== "committed") return;
  const started = await client.query({
    queryKey: ["course", "started", start.commandId],
    networkMode: "always",
    queryFn: () => selectedCourse(app, { kind: "accepted", receipt: start }),
  });
  assert.equal(started.kind, "ready");
  if (started.kind !== "ready" || started.projection.kind === "entry") return;
  assert.equal(started.projection.revision, "0");
  assert.equal(started.witness.profileRevision, start.revision);
  assert.equal(started.witness.selectedSessionRevision, "0");
  assert.notEqual(
    started.witness.profileRevision,
    started.witness.selectedSessionRevision,
  );
  await act(app, f.ids, "continue");
  await act(app, f.ids, "pause");
  const resume = await act(app, f.ids, "resume");
  assert.equal(resume.kind, "committed");
  if (resume.kind !== "committed") return;
  const resumed = await client.query({
    queryKey: ["course", "resumed", resume.commandId],
    networkMode: "always",
    queryFn: () => selectedCourse(app, { kind: "accepted", receipt: resume }),
  });
  assert.equal(resumed.kind, "ready");
  if (resumed.kind !== "ready" || resumed.projection.kind === "entry") return;
  assert.equal(resumed.projection.runId, start.runId);
  assert.equal(
    resumed.witness.selectedSessionRevision,
    resumed.projection.revision,
  );
  assert.equal(resumed.witness.profileRevision, resume.revision);
  assert.equal(resumed.projection.revision, "3");
});

test("migration 6 data-hook failure rolls back new tables, ledger and version before a clean retry", async (t) => {
  const { initializeDatabase } =
      await import("../../packages/storage/src/migration.ts"),
    f = await storageFixture(t, await courseFixture()),
    { executor, db } = f.connect();
  let observed = false;
  await assert.rejects(
    initializeDatabase(executor, hash, async (version) =>
      version === 6
        ? async () => {
            observed = true;
            assert.equal(count(db, "lesson_credit"), 0);
            throw new Error("Injected migration data failure");
          }
        : undefined,
    ),
    /Injected migration data failure/,
  );
  assert.equal(observed, true);
  assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 5);
  assert.equal(count(db, "schema_migration"), 5);
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS n FROM sqlite_master WHERE name IN ('lesson_credit','lesson_credit_support','lesson_result')",
      )
      .get()?.n,
    0,
  );
  await initializeDatabase(executor, hash);
  assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 12);
  assert.equal(count(db, "schema_migration"), 12);
  assert.equal(count(db, "lesson_credit"), 0);
});

test("strict committed and historical parsers reject forged witnesses, capabilities and geometry without writable tokens", async (t) => {
  const { parseApplicationRead, parseHistoricalWork } =
      await import("../../packages/teaching/src/index.ts"),
    { practiceFixture } = await import("./practice-support.ts"),
    f = await practiceFixture(t),
    { app } = await f.connectReady();
  await f.start(app);
  const current = await selectedCourse(app, { kind: "cursor" });
  assert.equal(current.kind, "ready");
  if (current.kind !== "ready" || current.projection.kind === "entry") return;
  assert.deepEqual(parseApplicationRead(structuredClone(current)), current);
  assert.throws(
    () =>
      parseApplicationRead({
        ...current,
        witness: { ...current.witness, profileRevision: "999" },
      }),
    /witness/,
  );
  assert.throws(
    () => parseApplicationRead({ ...current, unknown: true }),
    /envelope/,
  );
  const historical = await selectedWork(app, {
    owner: current.witness.owner,
    runId: current.projection.runId,
  });
  assert.deepEqual(
    parseHistoricalWork(structuredClone(historical)),
    historical,
  );
  const document = historical.documents[0];
  assert.ok(document);
  assert.throws(
    () =>
      parseHistoricalWork({
        ...historical,
        documents: [
          { ...document, snapshot: { ...document.snapshot, writable: true } },
        ],
      }),
    /schema/,
  );
  assert.throws(
    () =>
      parseHistoricalWork({
        ...historical,
        documents: [
          {
            ...document,
            snapshot: {
              ...document.snapshot,
              bounds: { width: 123, height: 180 },
            },
          },
        ],
      }),
    /guide/,
  );
  const stroke = document.snapshot.strokes[0];
  assert.ok(stroke);
  assert.throws(
    () =>
      parseHistoricalWork({
        ...historical,
        documents: [
          {
            ...document,
            snapshot: {
              ...document.snapshot,
              strokes: [{ ...stroke, pointCount: stroke.pointCount + 1 }],
            },
          },
        ],
      }),
    /geometry/,
  );
});

test("internal dependent-support recomputation retains prior Skip support and rolls back with its surrounding transaction", async (t) => {
  const { createLessonProgress } =
      await import("../../packages/storage/src/lesson-progress.ts"),
    { transaction } = await import("../../packages/storage/src/migration.ts"),
    { parseId } = await import("../../packages/teaching/src/index.ts");
  const content = await courseFixture(),
    f = await storageFixture(t, content),
    { app, db, executor } = await f.connectReady();
  await satisfy(f, app, "skipped");
  const originalResult = db.prepare("SELECT * FROM lesson_result").all();
  await replayWriting(app, f.ids);
  await finish(app, f.ids);
  const view = await selectedCourse(app, { kind: "cursor" });
  assert.equal(view.kind, "ready");
  if (view.kind !== "ready") return;
  const writing = view.course.lessons[0]?.tasks.find((task) => task.optional);
  assert.ok(writing);
  const credit = db
    .prepare(
      "SELECT credit_id FROM task_credit WHERE task_id=? AND outcome='completed'",
    )
    .get(writing.id);
  assert.ok(credit && typeof credit.credit_id === "string");
  const taskCreditId = parseId({ kind: "credit", value: credit.credit_id });
  const progress = createLessonProgress({
      executor,
      hash,
      ids: f.ids,
      pinned: (packageHash) => {
        assert.equal(packageHash, content.packageHash);
        return content;
      },
    }),
    before = db.prepare("SELECT * FROM task_credit ORDER BY credit_id").all(),
    lessonsBefore = db
      .prepare("SELECT * FROM lesson_credit ORDER BY lesson_credit_id")
      .all();
  await assert.rejects(
    transaction(executor, async () => {
      db.prepare(
        "UPDATE task_credit SET status='withdrawn' WHERE credit_id=?",
      ).run(taskCreditId);
      const dependent = await progress.withdrawDependentSupport({
        owner: view.witness.owner,
        courseId: view.courseId,
        taskCreditId,
      });
      assert.equal(dependent.length, 1);
      assert.equal(
        db
          .prepare("SELECT outcome FROM task_result WHERE task_id=?")
          .get(writing.id)?.outcome,
        "skipped",
      );
      assert.deepEqual(
        db.prepare("SELECT * FROM lesson_result").all(),
        originalResult,
      );
      await progress.derive({ owner: view.witness.owner, content });
      assert.equal(count(db, "lesson_credit"), 2);
      await progress.validate({
        owner: view.witness.owner,
        courseId: view.courseId,
      });
      throw new Error("Abort prospective withdrawal");
    }),
    /Abort prospective withdrawal/,
  );
  assert.deepEqual(
    db.prepare("SELECT * FROM task_credit ORDER BY credit_id").all(),
    before,
  );
  assert.deepEqual(
    db.prepare("SELECT * FROM lesson_credit ORDER BY lesson_credit_id").all(),
    lessonsBefore,
  );
  assert.equal((await selectedCourse(app, { kind: "cursor" })).kind, "ready");
});

test("abandoned acceptance corruption is validated while the newer delivery and original geometry remain preserved", async (t) => {
  const { practiceFixture } = await import("./practice-support.ts"),
    f = await practiceFixture(t),
    { app, db } = await f.connectReady();
  await f.start(app);
  const old = ready(await selectedProjection(app));
  assert.ok("runId" in old);
  const geometry = db
    .prepare(
      "SELECT payload FROM ink_point_chunk ORDER BY stroke_id,chunk_index",
    )
    .all();
  await f.action(app, "restart");
  assert.equal(count(db, "task_run"), 2);
  db.prepare("UPDATE task_run SET next_advance_seq=999 WHERE run_id=?").run(
    old.runId,
  );
  const records = db.prepare("SELECT * FROM task_run ORDER BY run_id").all(),
    cold = f.connect();
  assert.equal((await selectedProjection(cold.app)).kind, "recovery");
  assert.deepEqual(
    cold.db.prepare("SELECT * FROM task_run ORDER BY run_id").all(),
    records,
  );
  assert.deepEqual(
    cold.db
      .prepare(
        "SELECT payload FROM ink_point_chunk ORDER BY stroke_id,chunk_index",
      )
      .all(),
    geometry,
  );
});

test("noncurrent legacy preview offers exact Resume or explicit full Restart and rejects fresh Start across package boundaries", async (t) => {
  const legacy = await parseDevelopmentPackage(
      JSON.parse(
        await readFile("tests/fixtures/development-package.json", "utf8"),
      ),
      hash,
    ),
    f = await storageFixture(t, legacy),
    initial = await f.connectReady();
  await selectedProjection(initial.app);
  await act(initial.app, f.ids, "start");
  await act(initial.app, f.ids, "continue");
  const old = ready(await selectedProjection(initial.app));
  assert.ok("sessionId" in old);
  const full = await f.connectReady({ content: await courseFixture() });
  await selectedProjection(full.app);
  const before = await selectedCourse(full.app, { kind: "cursor" });
  assert.equal(before.kind, "ready");
  if (before.kind !== "ready") return;
  const other = before.course.lessons[0]?.tasks[3];
  assert.ok(other);
  await act(
    full.app,
    f.ids,
    "start",
    (action) => "taskId" in action.intent && action.intent.taskId === other.id,
  );
  const view = await selectedCourse(full.app, { kind: "cursor" });
  assert.equal(view.kind, "ready");
  if (view.kind !== "ready") return;
  const task = view.course.lessons[0]?.tasks[0];
  assert.ok(task);
  const unsafe = task.actions.find((action) => action.intent.kind === "start");
  assert.equal(unsafe, undefined);
  const { parseCommand } = await import("../../packages/teaching/src/index.ts");
  const valid = await commandFor({ app: full.app, ids: f.ids, kind: "start" });
  assert.equal(valid.command.kind, "select");
  if (valid.command.kind !== "select")
    throw new Error("Selection command required");
  const payload = { ...valid.command.payload, taskId: task.id },
    forged = {
      ...valid,
      command: parseCommand({
        ...valid.command,
        commandId: f.ids(),
        payload,
        payloadHash: await hash(
          canonical({ kind: valid.command.kind, payload }),
        ),
      }),
    };
  const rejected = await executeTeaching(full.app, forged);
  assert.equal(rejected.kind, "rejected");
  if (rejected.kind === "rejected")
    assert.equal(rejected.code, "saved-run-exists");
  assert.ok(
    task.actions.some(
      (action) =>
        action.intent.kind === "resume" &&
        action.intent.sessionId === old.sessionId,
    ),
  );
  const restart = task.actions.find(
    (action) =>
      action.intent.kind === "restart" &&
      action.intent.sessionId === old.sessionId,
  );
  assert.ok(restart);
  await act(
    full.app,
    f.ids,
    "restart",
    (action) => canonical(action) === canonical(restart),
  );
  const current = ready(await selectedProjection(full.app));
  assert.ok("runId" in current && current.runId !== old.runId);
  assert.equal(current.packageHash, view.witness.activePackageHash);
  assert.equal(
    full.db.prepare("SELECT status FROM task_run WHERE run_id=?").get(old.runId)
      ?.status,
    "abandoned",
  );
});

test("effective support selection uses lexical identity independent of locale and retains valid selected credit at the highest outcome", async () => {
  const { effectiveTaskCredit } =
      await import("../../packages/storage/src/lesson-progress.ts"),
    { parseId } = await import("../../packages/teaching/src/index.ts");
  const lower = {
    creditId: parseId({ kind: "credit", value: "alpha" }),
    status: "valid",
    outcome: "completed",
  } as const;
  const upper = {
    creditId: parseId({ kind: "credit", value: "Bravo" }),
    status: "valid",
    outcome: "completed",
  } as const;
  const punctuation = {
    creditId: parseId({ kind: "credit", value: "-" }),
    status: "valid",
    outcome: "completed",
  } as const;
  const skip = {
    creditId: parseId({ kind: "credit", value: "A" }),
    status: "valid",
    outcome: "skipped",
  } as const;
  assert.equal(
    effectiveTaskCredit({
      credits: [lower, upper, punctuation, skip],
      selected: null,
    })?.creditId,
    punctuation.creditId,
  );
  assert.equal(
    effectiveTaskCredit({ credits: [lower, upper, skip], selected: null })
      ?.creditId,
    upper.creditId,
  );
  assert.equal(
    effectiveTaskCredit({
      credits: [lower, upper, skip],
      selected: lower.creditId,
    })?.creditId,
    lower.creditId,
  );
  assert.equal(
    effectiveTaskCredit({
      credits: [lower, upper, skip],
      selected: skip.creditId,
    })?.creditId,
    upper.creditId,
  );
});
