import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  canonical,
  canonicalContentBody,
  parseDevelopmentPackage,
  prepareCommand,
} from "../../packages/teaching/src/index.ts";
import { hash, storageFixture } from "./support.ts";

test("six normal obligations complete once; navigation and unfinished Replay preserve prior credit", async (t) => {
  const f = await storageFixture(t);
  const first = f.connect();
  assert.equal((await first.app.open()).kind, "entry");
  assert.equal((await f.act(first.app, "start")).kind, "committed");
  for (let i = 0; i < 6; i++)
    assert.equal((await f.act(first.app, "continue")).kind, "committed");
  const completed = await first.app.read();
  assert.equal(completed.kind, "completed");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    6,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    1,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_result").get()?.n,
    1,
  );
  assert.equal(
    first.db
      .prepare(
        "SELECT count(*) AS n FROM sqlite_master WHERE name='lesson_credit'",
      )
      .get()?.n,
    0,
  );
  assert.equal((await f.act(first.app, "back")).kind, "committed");
  const review = await first.app.read();
  assert.equal(review.kind, "teaching");
  if (review.kind === "teaching") {
    assert.equal(review.runStatus, "completed");
    assert.equal(
      review.actions.some(
        (action) =>
          action.intent.kind === "help" || action.intent.kind === "repeat",
      ),
      false,
    );
  }
  assert.equal((await f.act(first.app, "continue")).kind, "committed");
  const restart = f.connect();
  assert.equal((await restart.app.open()).kind, "completed");
  assert.equal((await f.act(restart.app, "replay")).kind, "committed");
  const replay = await restart.app.read();
  assert.equal(replay.kind, "teaching");
  if (replay.kind === "teaching")
    assert.equal(
      replay.catalog.find((task) => task.number === 1)?.completed,
      true,
    );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    1,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_run").get()?.n,
    2,
  );
});

test("Repeat is extra practice, required Again remains owed, correction/Pause survive cold reopen", async (t) => {
  const f = await storageFixture(t);
  const first = f.connect();
  await first.app.open();
  await f.act(first.app, "start");
  await f.act(first.app, "continue");
  await f.act(first.app, "repeat");
  const practice = await first.app.read();
  assert.equal(practice.kind, "teaching");
  if (practice.kind === "teaching" && "extraPractice" in practice.turn)
    assert.equal(practice.turn.extraPractice, true);
  await f.act(first.app, "continue");
  const owed = await first.app.read();
  assert.equal(owed.kind, "teaching");
  if (owed.kind === "teaching" && "extraPractice" in owed.turn)
    assert.equal(owed.turn.extraPractice, false);
  await f.act(first.app, "continue");
  const again = await first.app.read();
  assert.equal(again.kind, "teaching");
  if (again.kind !== "teaching") throw new Error("Again missing");
  assert.match(again.turn.id, /s03/);
  await f.act(first.app, "help");
  await f.act(first.app, "pause");
  const paused = await first.app.read();
  if (paused.kind !== "recovery" && paused.kind !== "entry")
    assert.equal(paused.sessionStatus, "paused");
  const next = f.connect();
  const reopened = await next.app.open();
  assert.deepEqual(reopened, paused);
  await f.act(next.app, "resume");
  await f.act(next.app, "continue");
  const retest = await next.app.read();
  assert.equal(retest.kind, "teaching");
  if (retest.kind === "teaching") assert.match(retest.turn.id, /s02/);
  await f.act(next.app, "continue");
  const stillAgain = await next.app.read();
  if (stillAgain.kind !== "teaching")
    throw new Error("Required Again was lost");
  assert.match(stillAgain.turn.id, /s03/);
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    0,
  );
});

test("Task4 s correction restarts whole review; stale Resume cannot take selection back", async (t) => {
  const f = await storageFixture(t);
  const first = f.connect();
  await first.app.open();
  await f.act(
    first.app,
    "start",
    (action) =>
      "taskId" in action.intent && String(action.intent.taskId).includes("t04"),
  );
  await f.act(first.app, "continue");
  await f.act(first.app, "help");
  await f.act(first.app, "continue");
  const retest = await first.app.read();
  if (retest.kind !== "teaching") throw new Error("Review retest missing");
  assert.equal(retest.turn.glyph, "m");
  await f.act(first.app, "pause");
  const paused = await first.app.read();
  if (paused.kind === "recovery") throw new Error("Unexpected recovery");
  const resume = paused.actions.find(
    (action) => action.intent.kind === "resume",
  );
  assert.ok(resume);
  const stale = await prepareCommand({
    projection: paused,
    action: resume,
    ids: f.ids,
    hash,
  });
  await f.act(
    first.app,
    "start",
    (action) =>
      "taskId" in action.intent && action.intent.taskId === "fixture.task",
  );
  const selected = await first.app.read();
  const rejected = await first.app.dispatch(stale);
  assert.equal(rejected.kind, "rejected");
  if (rejected.kind === "rejected")
    assert.equal(rejected.code, "stale-revision");
  assert.deepEqual(await first.app.read(), selected);
});

test("navigation and terminal acceptance roll back together or retry one lost acknowledgement", async (t) => {
  const f = await storageFixture(t);
  let armed = false;
  let lost = false;
  const first = f.connect({
    hook: async (sql, work) => {
      const result = await work();
      if (armed && sql === "COMMIT") {
        armed = false;
        lost = true;
        throw new Error("Lost commit reply");
      }
      return result;
    },
  });
  await first.app.open();
  await f.act(first.app, "start");
  for (let i = 0; i < 5; i++) await f.act(first.app, "continue");
  const projection = await first.app.read();
  const command = await prepareCommand({ projection, ids: f.ids, hash });
  armed = true;
  await assert.rejects(first.app.dispatch(command));
  assert.equal(lost, true);
  const next = f.connect();
  assert.equal((await next.app.open()).kind, "completed");
  assert.equal((await next.app.dispatch(command)).kind, "committed");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    6,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    1,
  );
  const receipt = first.db
    .prepare("SELECT receipt FROM task_credit")
    .get()?.receipt;
  assert.equal(typeof receipt, "string");
  first.db
    .prepare("UPDATE task_credit SET receipt=?")
    .run(canonical({ version: 1 }));
  assert.equal((await next.app.read()).kind, "recovery");
});

test("legacy partial content can still run alone without completion after schema upgrade", async (t) => {
  const content = await parseDevelopmentPackage(
    JSON.parse(
      await readFile("tests/fixtures/development-package.json", "utf8"),
    ),
    hash,
  );
  const f = await storageFixture(t, content);
  const first = f.connect();
  await first.app.open();
  await f.act(first.app, "start");
  await f.act(first.app, "continue");
  await f.act(first.app, "continue");
  assert.equal((await first.app.read()).kind, "frontier");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    0,
  );
});

test("a terminal result write failure rolls back acceptance, run, credit and receipt atomically", async (t) => {
  const f = await storageFixture(t);
  let armed = false;
  const first = f.connect({
    hook: async (sql, work) => {
      if (armed && sql.startsWith('insert into "task_result"'))
        throw new Error("Injected terminal result write");
      return work();
    },
  });
  await first.app.open();
  await f.act(first.app, "start");
  for (let index = 0; index < 5; index++) await f.act(first.app, "continue");
  const before = await first.app.read();
  const command = await prepareCommand({
    projection: before,
    ids: f.ids,
    hash,
  });
  armed = true;
  await assert.rejects(first.app.dispatch(command));
  armed = false;
  assert.deepEqual(await first.app.read(), before);
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    0,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    5,
  );
  assert.equal((await first.app.dispatch(command)).kind, "committed");
  assert.equal((await first.app.read()).kind, "completed");
});

test("task4 finishes in two required responses; Back and Pause cannot add acceptance", async (t) => {
  const f = await storageFixture(t);
  const first = f.connect();
  await first.app.open();
  await f.act(
    first.app,
    "start",
    (action) =>
      "taskId" in action.intent && String(action.intent.taskId).includes("t04"),
  );
  await f.act(first.app, "continue");
  await f.act(first.app, "back");
  await f.act(first.app, "continue");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    1,
  );
  await f.act(first.app, "pause");
  const restarted = f.connect();
  await restarted.app.open();
  await f.act(restarted.app, "resume");
  await f.act(restarted.app, "continue");
  assert.equal((await restarted.app.read()).kind, "completed");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    2,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    1,
  );
});

test("an older bundled catalog cannot downgrade a later active package or rebind its saved run", async (t) => {
  const f = await storageFixture(t);
  const first = f.connect();
  await first.app.open();
  await f.act(first.app, "start");
  await f.act(first.app, "continue");
  const saved = await first.app.read();
  const body = { ...f.content.body, releaseId: "fixture.graph.later" };
  const later = await parseDevelopmentPackage(
    {
      formatVersion: 1,
      body,
      packageHash: await hash(canonicalContentBody(body)),
    },
    hash,
  );
  const staged = f.connect({ content: later });
  await staged.app.open();
  first.db
    .prepare(
      "UPDATE course_activation SET active_package_hash=?,fallback_package_hash=?,revision=revision+1",
    )
    .run(later.packageHash, f.content.packageHash);
  const oldBundle = f.connect();
  const reopened = await oldBundle.app.open();
  if (reopened.kind !== "teaching" || saved.kind !== "teaching")
    throw new Error("Saved teaching was lost");
  assert.equal(reopened.runId, saved.runId);
  assert.equal(reopened.packageHash, f.content.packageHash);
  assert.equal(
    first.db.prepare("SELECT active_package_hash FROM course_activation").get()
      ?.active_package_hash,
    later.packageHash,
  );
  await f.act(oldBundle.app, "restart");
  const fresh = await oldBundle.app.read();
  if (fresh.kind !== "teaching") throw new Error("Fresh task did not start");
  assert.equal(fresh.packageHash, later.packageHash);
});
