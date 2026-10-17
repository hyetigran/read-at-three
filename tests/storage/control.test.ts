import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  prepareCommand,
} from "../../packages/teaching/src/index.ts";
import type {
  ReviewChoice,
  TeachingApplication,
  TeachingCommand,
} from "../../packages/teaching/src/index.ts";
import { controlFixture } from "../teaching/control-fixture.ts";
import { hash, storageFixture } from "./support.ts";
async function setup(t: Parameters<typeof storageFixture>[0]) {
  const oral = await controlFixture();
  const f = await storageFixture(t, oral.content);
  return { ...f, oral };
}
async function start(
  f: Awaited<ReturnType<typeof setup>>,
  app: TeachingApplication,
) {
  await app.open();
  await f.act(
    app,
    "start",
    (a) => "taskId" in a.intent && a.intent.taskId === f.oral.taskId,
  );
}
async function toSelection(
  f: Awaited<ReturnType<typeof setup>>,
  app: TeachingApplication,
) {
  await f.act(app, "continue");
  await f.act(app, "parentReady");
  for (let i = 0; i < 5; i++) await f.act(app, "continue");
  const p = await app.read();
  assert.equal(p.kind, "reviewSelection");
  return p;
}
async function select(
  f: Awaited<ReturnType<typeof setup>>,
  app: TeachingApplication,
  choice: ReviewChoice,
) {
  const projection = await app.read();
  if (projection.kind !== "reviewSelection")
    throw new Error("Selection missing");
  return prepareCommand({
    projection,
    request: { action: projection.selectionAction, choice },
    ids: f.ids,
    hash,
  });
}
function accepted(
  db: ReturnType<Awaited<ReturnType<typeof setup>>["connect"]>["db"],
) {
  return db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n;
}
test("real SQLite restores selection, immutable source-order queue, correction/retest, Back and terminal proof", async (t) => {
  const f = await setup(t),
    first = f.connect();
  await start(f, first.app);
  await toSelection(f, first.app);
  const selection = await first.app.read();
  assert.deepEqual(await f.connect().app.open(), selection);
  if (selection.kind !== "reviewSelection")
    throw new Error("Missing selection");
  const a = selection.items[0],
    c = selection.items[2];
  assert.ok(a && c);
  const command = await select(f, first.app, {
    kind: "items",
    itemIds: [c.itemId, a.itemId],
  });
  if (
    command.kind !== "navigate" ||
    command.payload.action.kind !== "commitReviewSelection"
  )
    throw new Error("Wrong command");
  assert.deepEqual(command.payload.action.choice, {
    kind: "items",
    itemIds: [a.itemId, c.itemId],
  });
  assert.ok(Object.isFrozen(command.payload.action));
  const receipt = await first.app.dispatch(command);
  assert.equal(receipt.kind, "committed");
  const review = await first.app.read();
  assert.deepEqual(await f.connect().app.open(), review);
  const selectionCount = accepted(first.db);
  await f.act(first.app, "back");
  const restoredSelection = await first.app.read();
  assert.equal(restoredSelection.kind, "reviewSelection");
  if (restoredSelection.kind === "reviewSelection")
    assert.deepEqual(restoredSelection.committedChoice, {
      kind: "items",
      itemIds: [a.itemId, c.itemId],
    });
  await assert.rejects(select(f, first.app, { kind: "none" }), /unavailable/);
  await f.act(first.app, "continue");
  assert.deepEqual(await first.app.read(), {
    ...review,
    revision: String(
      BigInt(
        review.kind !== "recovery" && review.kind !== "entry"
          ? review.revision
          : "0",
      ) + 2n,
    ),
  });
  assert.equal(accepted(first.db), selectionCount);
  await f.act(first.app, "parentReady");
  await f.act(first.app, "help");
  await f.act(first.app, "pause");
  const paused = await first.app.read();
  const restart = f.connect();
  assert.deepEqual(await restart.app.open(), paused);
  await f.act(restart.app, "resume");
  await f.act(restart.app, "continue");
  const retest = await restart.app.read();
  assert.deepEqual(await f.connect().app.open(), retest);
  if (retest.kind !== "teaching") throw new Error("Missing retest");
  assert.match(retest.turn.id, /response-03$/);
  assert.equal("glyph" in retest.turn, false);
  assert.equal("cue" in retest.turn, false);
  await f.act(restart.app, "confirmReviewItem");
  assert.equal((await restart.app.read()).kind, "completed");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    1,
  );
  const count = accepted(first.db);
  await f.act(restart.app, "back");
  await f.act(restart.app, "continue");
  assert.equal(accepted(first.db), count);
  assert.equal((await f.connect().app.open()).kind, "completed");
  first.db.prepare("DELETE FROM command_receipt").run();
  assert.equal((await f.connect().app.open()).kind, "completed");
  const row = first.db
    .prepare(
      "SELECT accepting_command FROM task_advance ORDER BY seq DESC LIMIT 1",
    )
    .get();
  assert.equal(
    JSON.parse(String(row?.accepting_command)).payload.action.kind,
    "confirmReviewItem",
  );
});
test("selection and readiness failure roll back; same immutable retry and lost COMMIT reply converge once", async (t) => {
  for (const stage of ["selection", "ready", "terminal"]) {
    const f = await setup(t);
    let failure: "write" | "reply" | null = null;
    const first = f.connect({
      hook: async (sql, work) => {
        if (failure === "write" && sql.includes('insert into "task_advance"')) {
          failure = null;
          throw new Error("Injected decision write failure");
        }
        const value = await work();
        if (failure === "reply" && sql === "COMMIT") {
          failure = null;
          throw new Error("Lost decision reply");
        }
        return value;
      },
    });
    await start(f, first.app);
    let command: TeachingCommand;
    if (stage === "ready") {
      await f.act(first.app, "continue");
      const p = await first.app.read();
      if (p.kind === "recovery") throw new Error("Recovery");
      const action = p.actions.find((a) => a.intent.kind === "parentReady");
      assert.ok(action);
      command = await prepareCommand({
        projection: p,
        action,
        ids: f.ids,
        hash,
      });
    } else {
      await toSelection(f, first.app);
      const item = f.oral.graph.reviews[0]?.items[2];
      assert.ok(item);
      command = await select(
        f,
        first.app,
        stage === "selection"
          ? { kind: "items", itemIds: [item.itemId] }
          : { kind: "none" },
      );
    }
    const before = await first.app.read(),
      count = accepted(first.db);
    failure = "write";
    await assert.rejects(
      first.app.dispatch(command),
      (error: unknown) =>
        error instanceof Error &&
        error.cause instanceof Error &&
        error.cause.message === "Injected decision write failure",
    );
    assert.deepEqual(await first.app.read(), before);
    assert.equal(accepted(first.db), count);
    failure = "reply";
    await assert.rejects(first.app.dispatch(command), /Lost/);
    const receipt = await first.app.dispatch(command);
    assert.equal(receipt.kind, "committed");
    assert.equal(accepted(first.db), Number(count) + 1);
    assert.deepEqual(await f.connect().app.open(), await first.app.read());
    assert.deepEqual(await first.app.dispatch(command), receipt);
  }
});
test("receipt pruning cannot replay stale complete choice or replace a committed queue", async (t) => {
  const f = await setup(t),
    first = f.connect();
  await start(f, first.app);
  await toSelection(f, first.app);
  const view = await first.app.read();
  if (view.kind !== "reviewSelection") throw new Error("Selection missing");
  const item = view.items[2];
  assert.ok(item);
  const command = await select(f, first.app, {
    kind: "items",
    itemIds: [item.itemId],
  });
  await first.app.dispatch(command);
  first.db.prepare("DELETE FROM command_receipt").run();
  const before = await first.app.read(),
    count = accepted(first.db);
  const stale = await first.app.dispatch(command);
  assert.equal(stale.kind, "rejected");
  assert.deepEqual(await first.app.read(), before);
  assert.equal(accepted(first.db), count);
  assert.deepEqual(await f.connect().app.open(), before);
});
test("reopen rejects missing, changed semantic action, changed hash, wrong checkpoint/run/package and queue bytes", async (t) => {
  for (const tamper of [
    "missing",
    "action",
    "hash",
    "checkpoint",
    "run",
    "package",
    "queue",
  ]) {
    const f = await setup(t),
      first = f.connect();
    await start(f, first.app);
    await toSelection(f, first.app);
    const command = await select(f, first.app, { kind: "none" });
    await first.app.dispatch(command);
    const row = first.db
      .prepare(
        "SELECT advance_id,accepting_command,after_state,payload_hash FROM task_advance ORDER BY seq DESC LIMIT 1",
      )
      .get();
    assert.ok(row);
    const advanceId = row.advance_id;
    assert.equal(typeof advanceId, "string");
    if (typeof advanceId !== "string")
      throw new Error("Invalid advance identity");
    const preimage = JSON.parse(String(row.accepting_command));
    let json = String(row.accepting_command),
      payloadHash = String(row.payload_hash);
    if (tamper === "missing")
      first.db
        .prepare(
          "UPDATE task_advance SET accepting_command=NULL WHERE advance_id=?",
        )
        .run(advanceId);
    else if (tamper === "queue") {
      const after = JSON.parse(String(row.after_state));
      after.queues[0].exitNodeId = after.queues[0].returnNodeId;
      first.db
        .prepare("UPDATE task_advance SET after_state=? WHERE advance_id=?")
        .run(canonical(after), advanceId);
    } else {
      if (tamper === "action") preimage.payload.action = { kind: "continue" };
      if (tamper === "checkpoint")
        preimage.payload.checkpointId = "checkpoint-1";
      if (tamper === "run") preimage.payload.runId = "wrong-run";
      if (tamper === "package") preimage.payload.packageHash = "a".repeat(64);
      json = canonical(preimage);
      payloadHash = tamper === "hash" ? "b".repeat(64) : await hash(json);
      first.db
        .prepare(
          "UPDATE task_advance SET accepting_command=?,payload_hash=? WHERE advance_id=?",
        )
        .run(json, payloadHash, advanceId);
    }
    assert.equal((await f.connect().app.open()).kind, "recovery", tamper);
    assert.equal(accepted(first.db), 8);
    assert.equal(
      first.db.prepare("SELECT count(*) AS n FROM profile").get()?.n,
      1,
    );
  }
});
