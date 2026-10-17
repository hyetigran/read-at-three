import {
  executeTeaching,
  prepareSelectedTeaching,
  selectedProjection,
} from "./selected-support.ts";

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
  const first = await f.connectReady();
  assert.equal((await selectedProjection(first.app)).kind, "entry");
  assert.equal((await f.act(first.app, "start")).kind, "committed");
  for (let i = 0; i < 6; i++)
    assert.equal((await f.act(first.app, "continue")).kind, "committed");
  const completed = await selectedProjection(first.app);
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
    first.db.prepare("SELECT count(*) AS n FROM lesson_credit").get()?.n,
    0,
  );
  assert.equal((await f.act(first.app, "back")).kind, "committed");
  const review = await selectedProjection(first.app);
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
  const restart = await f.connectReady();
  assert.equal((await selectedProjection(restart.app)).kind, "completed");
  assert.equal((await f.act(restart.app, "replay")).kind, "committed");
  const replay = await selectedProjection(restart.app);
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
  const first = await f.connectReady();
  await selectedProjection(first.app);
  await f.act(first.app, "start");
  await f.act(first.app, "continue");
  await f.act(first.app, "repeat");
  const practice = await selectedProjection(first.app);
  assert.equal(practice.kind, "teaching");
  if (practice.kind === "teaching" && "extraPractice" in practice.turn)
    assert.equal(practice.turn.extraPractice, true);
  await f.act(first.app, "continue");
  const owed = await selectedProjection(first.app);
  assert.equal(owed.kind, "teaching");
  if (owed.kind === "teaching" && "extraPractice" in owed.turn)
    assert.equal(owed.turn.extraPractice, false);
  await f.act(first.app, "continue");
  const again = await selectedProjection(first.app);
  assert.equal(again.kind, "teaching");
  if (again.kind !== "teaching") throw new Error("Again missing");
  assert.match(again.turn.id, /s03/);
  await f.act(first.app, "help");
  await f.act(first.app, "pause");
  const paused = await selectedProjection(first.app);
  if (paused.kind !== "recovery" && paused.kind !== "entry")
    assert.equal(paused.sessionStatus, "paused");
  const next = await f.connectReady();
  const reopened = await selectedProjection(next.app);
  assert.deepEqual(reopened, paused);
  await f.act(next.app, "resume");
  await f.act(next.app, "continue");
  const retest = await selectedProjection(next.app);
  assert.equal(retest.kind, "teaching");
  if (retest.kind === "teaching") assert.match(retest.turn.id, /s02/);
  await f.act(next.app, "continue");
  const stillAgain = await selectedProjection(next.app);
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
  const first = await f.connectReady();
  await selectedProjection(first.app);
  await f.act(
    first.app,
    "start",
    (action) =>
      "taskId" in action.intent && String(action.intent.taskId).includes("t04"),
  );
  await f.act(first.app, "continue");
  await f.act(first.app, "help");
  await f.act(first.app, "continue");
  const retest = await selectedProjection(first.app);
  if (retest.kind !== "teaching") throw new Error("Review retest missing");
  assert.equal("glyph" in retest.turn && retest.turn.glyph, "m");
  await f.act(first.app, "pause");
  const paused = await selectedProjection(first.app);
  if (paused.kind === "recovery") throw new Error("Unexpected recovery");
  const resume = paused.actions.find(
    (action) => action.intent.kind === "resume",
  );
  assert.ok(resume);
  const stale = await prepareSelectedTeaching(first.app, async () =>
    prepareCommand({
      projection: paused,
      request: { kind: "action", action: resume },
      ids: f.ids,
      hash,
    }),
  );
  await f.act(
    first.app,
    "start",
    (action) =>
      "taskId" in action.intent && action.intent.taskId === "fixture.task",
  );
  const selected = await selectedProjection(first.app);
  const rejected = await executeTeaching(first.app, stale);
  assert.equal(rejected.kind, "rejected");
  if (rejected.kind === "rejected")
    assert.equal(rejected.code, "stale-revision");
  assert.deepEqual(await selectedProjection(first.app), selected);
});

test("navigation and terminal acceptance roll back together or retry one lost acknowledgement", async (t) => {
  const f = await storageFixture(t);
  let armed = false;
  let lost = false;
  const first = await f.connectReady({
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
  await selectedProjection(first.app);
  await f.act(first.app, "start");
  for (let i = 0; i < 5; i++) await f.act(first.app, "continue");
  const projection = await selectedProjection(first.app);
  const command = await prepareSelectedTeaching(first.app, async () =>
    prepareCommand({ projection, ids: f.ids, hash }),
  );
  armed = true;
  await assert.rejects(executeTeaching(first.app, command));
  assert.equal(lost, true);
  const next = await f.connectReady();
  assert.equal((await selectedProjection(next.app)).kind, "completed");
  assert.equal((await executeTeaching(next.app, command)).kind, "committed");
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
  assert.equal((await selectedProjection(next.app)).kind, "recovery");
});

test("legacy partial content can still run alone without completion after schema upgrade", async (t) => {
  const content = await parseDevelopmentPackage(
    JSON.parse(
      await readFile("tests/fixtures/development-package.json", "utf8"),
    ),
    hash,
  );
  const f = await storageFixture(t, content);
  const first = await f.connectReady();
  await selectedProjection(first.app);
  await f.act(first.app, "start");
  await f.act(first.app, "continue");
  await f.act(first.app, "continue");
  assert.equal((await selectedProjection(first.app)).kind, "frontier");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    0,
  );
});

test("a terminal result write failure rolls back acceptance, run, credit and receipt atomically", async (t) => {
  const f = await storageFixture(t);
  let armed = false;
  const first = await f.connectReady({
    hook: async (sql, work) => {
      if (armed && sql.startsWith('insert into "task_result"'))
        throw new Error("Injected terminal result write");
      return work();
    },
  });
  await selectedProjection(first.app);
  await f.act(first.app, "start");
  for (let index = 0; index < 5; index++) await f.act(first.app, "continue");
  const before = await selectedProjection(first.app);
  const command = await prepareSelectedTeaching(first.app, async () =>
    prepareCommand({
      projection: before,
      ids: f.ids,
      hash,
    }),
  );
  armed = true;
  await assert.rejects(executeTeaching(first.app, command));
  armed = false;
  assert.deepEqual(await selectedProjection(first.app), before);
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    0,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    5,
  );
  assert.equal((await executeTeaching(first.app, command)).kind, "committed");
  assert.equal((await selectedProjection(first.app)).kind, "completed");
});

test("task4 finishes in two required responses; Back and Pause cannot add acceptance", async (t) => {
  const f = await storageFixture(t);
  const first = await f.connectReady();
  await selectedProjection(first.app);
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
  const restarted = await f.connectReady();
  await selectedProjection(restarted.app);
  await f.act(restarted.app, "resume");
  await f.act(restarted.app, "continue");
  assert.equal((await selectedProjection(restarted.app)).kind, "completed");
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
  const first = await f.connectReady();
  await selectedProjection(first.app);
  await f.act(first.app, "start");
  await f.act(first.app, "continue");
  const saved = await selectedProjection(first.app);
  const body = { ...f.content.body, releaseId: "fixture.graph.later" };
  const later = await parseDevelopmentPackage(
    {
      formatVersion: 1,
      body,
      packageHash: await hash(canonicalContentBody(body)),
    },
    hash,
  );
  const staged = await f.connectReady({ content: later });
  await selectedProjection(staged.app);
  first.db
    .prepare(
      "UPDATE course_activation SET active_package_hash=?,fallback_package_hash=?,revision=revision+1",
    )
    .run(later.packageHash, f.content.packageHash);
  const oldBundle = await f.connectReady();
  const reopened = await selectedProjection(oldBundle.app);
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
  const fresh = await selectedProjection(oldBundle.app);
  if (fresh.kind !== "teaching") throw new Error("Fresh task did not start");
  assert.equal(fresh.packageHash, later.packageHash);
});

test("retained acceptance receipt remains replayable after explicit Restart archives its session", async (t) => {
  const f = await storageFixture(t);
  const first = await f.connectReady();
  await selectedProjection(first.app);
  await f.act(first.app, "start");
  const command = await prepareSelectedTeaching(first.app, async () =>
    prepareCommand({
      projection: await selectedProjection(first.app),
      ids: f.ids,
      hash,
    }),
  );
  const receipt = await executeTeaching(first.app, command);
  assert.equal(receipt.kind, "committed");
  await f.act(first.app, "restart");
  const fresh = await selectedProjection(first.app);
  assert.deepEqual(await executeTeaching(first.app, command), receipt);
  assert.deepEqual(await selectedProjection(first.app), fresh);
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    1,
  );
});

test("result-to-credit NO ACTION relationship is deferred until COMMIT", async (t) => {
  const f = await storageFixture(t);
  const first = await f.connectReady();
  await selectedProjection(first.app);
  await f.act(first.app, "start");
  for (let index = 0; index < 6; index++) await f.act(first.app, "continue");
  const ddl = first.db
    .prepare("SELECT sql FROM sqlite_master WHERE name='task_result'")
    .get()?.sql;
  assert.equal(typeof ddl, "string");
  assert.match(String(ddl), /DEFERRABLE INITIALLY DEFERRED/);
  first.db.exec("BEGIN");
  first.db.exec("DELETE FROM task_credit");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_result").get()?.n,
    1,
  );
  assert.throws(() => first.db.exec("COMMIT"), /FOREIGN KEY constraint failed/);
  first.db.exec("ROLLBACK");
  assert.equal((await selectedProjection(first.app)).kind, "completed");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    1,
  );
});
