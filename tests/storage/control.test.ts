import {
  executeTeaching,
  prepareSelectedTeaching,
  selectedProjection,
} from "./selected-support.ts";

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  prepareCommand,
} from "../../packages/teaching/src/index.ts";
import type {
  ReviewChoice,
  SelectedApplication,
  SelectedTeachingOperation,
} from "../../packages/teaching/src/index.ts";
import { controlFixture } from "../teaching/control-fixture.ts";
import {
  databaseSnapshot,
  hash,
  isReadOnlySqlAttempt,
  storageFixture,
} from "./support.ts";
async function setup(t: Parameters<typeof storageFixture>[0]) {
  const oral = await controlFixture();
  const f = await storageFixture(t, oral.content);
  return { ...f, oral };
}
async function start({
  fixture: f,
  app,
}: {
  fixture: Awaited<ReturnType<typeof setup>>;
  app: SelectedApplication;
}) {
  await selectedProjection(app);
  await f.act(
    app,
    "start",
    (a) => "taskId" in a.intent && a.intent.taskId === f.oral.taskId,
  );
}
async function toSelection({
  fixture: f,
  app,
}: {
  fixture: Awaited<ReturnType<typeof setup>>;
  app: SelectedApplication;
}) {
  await f.act(app, "continue");
  await f.act(app, "parentReady");
  for (let i = 0; i < 5; i++) await f.act(app, "continue");
  const p = await selectedProjection(app);
  assert.equal(p.kind, "reviewSelection");
  return p;
}
async function select({
  fixture: f,
  app,
  choice,
}: {
  fixture: Awaited<ReturnType<typeof setup>>;
  app: SelectedApplication;
  choice: ReviewChoice;
}) {
  const projection = await selectedProjection(app);
  if (projection.kind !== "reviewSelection")
    throw new Error("Selection missing");
  return prepareSelectedTeaching(app, async () =>
    prepareCommand({
      projection,
      request: { kind: "review", action: projection.selectionAction, choice },
      ids: f.ids,
      hash,
    }),
  );
}
function accepted(
  db: ReturnType<Awaited<ReturnType<typeof setup>>["connect"]>["db"],
) {
  return db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n;
}
test("real SQLite restores selection, immutable source-order queue, correction/retest, Back and terminal proof", async (t) => {
  const f = await setup(t),
    first = await f.connectReady();
  await start({ fixture: f, app: first.app });
  await toSelection({ fixture: f, app: first.app });
  const selection = await selectedProjection(first.app);
  assert.deepEqual(
    await selectedProjection((await f.connectReady()).app),
    selection,
  );
  if (selection.kind !== "reviewSelection")
    throw new Error("Missing selection");
  const a = selection.items[0],
    c = selection.items[2];
  assert.ok(a && c);
  const command = await select({
    fixture: f,
    app: first.app,
    choice: {
      kind: "items",
      itemIds: [c.itemId, a.itemId],
    },
  });
  if (
    command.command.kind !== "navigate" ||
    command.command.payload.action.kind !== "commitReviewSelection"
  )
    throw new Error("Wrong command");
  assert.deepEqual(command.command.payload.action.choice, {
    kind: "items",
    itemIds: [a.itemId, c.itemId],
  });
  assert.ok(Object.isFrozen(command.command.payload.action));
  const receipt = await executeTeaching(first.app, command);
  assert.equal(receipt.kind, "committed");
  const review = await selectedProjection(first.app);
  if (review.kind === "recovery") assert.fail(review.message);
  assert.deepEqual(
    await selectedProjection((await f.connectReady()).app),
    review,
  );
  const selectionCount = accepted(first.db);
  await f.act(first.app, "back");
  const restoredSelection = await selectedProjection(first.app);
  assert.equal(restoredSelection.kind, "reviewSelection");
  if (restoredSelection.kind === "reviewSelection")
    assert.deepEqual(restoredSelection.committedChoice, {
      kind: "items",
      itemIds: [a.itemId, c.itemId],
    });
  await assert.rejects(
    select({ fixture: f, app: first.app, choice: { kind: "none" } }),
    /unavailable/,
  );
  await f.act(first.app, "continue");
  const priorUndo = review.actions.find(
    (action) => action.intent.kind === "undoAdvance",
  );
  assert.ok(priorUndo?.intent.kind === "undoAdvance");
  assert.equal(priorUndo.intent.binding.runRevision, "8");
  assert.equal(priorUndo.intent.binding.cursorRevision, "9");
  assert.deepEqual(await selectedProjection(first.app), {
    ...review,
    actions: review.actions.map((action) =>
      action.intent.kind === "undoAdvance"
        ? {
            ...action,
            intent: {
              ...action.intent,
              binding: {
                ...action.intent.binding,
                runRevision: "10",
                cursorRevision: "11",
              },
            },
          }
        : action,
    ),
    revision: String(
      BigInt(review.kind !== "entry" ? review.revision : "0") + 2n,
    ),
  });
  assert.equal(accepted(first.db), selectionCount);
  await f.act(first.app, "parentReady");
  await f.act(first.app, "help");
  await f.act(first.app, "pause");
  const paused = await selectedProjection(first.app);
  const restart = await f.connectReady();
  assert.deepEqual(await selectedProjection(restart.app), paused);
  await f.act(restart.app, "resume");
  await f.act(restart.app, "continue");
  const retest = await selectedProjection(restart.app);
  assert.deepEqual(
    await selectedProjection((await f.connectReady()).app),
    retest,
  );
  if (retest.kind !== "teaching") throw new Error("Missing retest");
  assert.match(retest.turn.id, /response-03$/);
  assert.equal("glyph" in retest.turn, false);
  assert.equal("cue" in retest.turn, false);
  await f.act(restart.app, "confirmReviewItem");
  assert.equal((await selectedProjection(restart.app)).kind, "completed");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    1,
  );
  const count = accepted(first.db);
  await f.act(restart.app, "back");
  await f.act(restart.app, "continue");
  assert.equal(accepted(first.db), count);
  assert.equal(
    (await selectedProjection((await f.connectReady()).app)).kind,
    "completed",
  );
  first.db.prepare("DELETE FROM command_receipt").run();
  assert.equal(
    (await selectedProjection((await f.connectReady()).app)).kind,
    "completed",
  );
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
    const first = await f.connectReady({
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
    await start({ fixture: f, app: first.app });
    let command: SelectedTeachingOperation;
    if (stage === "ready") {
      await f.act(first.app, "continue");
      const p = await selectedProjection(first.app);
      if (p.kind === "recovery") throw new Error("Recovery");
      const action = p.actions.find((a) => a.intent.kind === "parentReady");
      assert.ok(action);
      command = await prepareSelectedTeaching(first.app, async () =>
        prepareCommand({
          projection: p,
          request: { kind: "action", action },
          ids: f.ids,
          hash,
        }),
      );
    } else {
      await toSelection({ fixture: f, app: first.app });
      const item = f.oral.graph.reviews[0]?.items[2];
      assert.ok(item);
      command = await select({
        fixture: f,
        app: first.app,
        choice:
          stage === "selection"
            ? { kind: "items", itemIds: [item.itemId] }
            : { kind: "none" },
      });
    }
    const before = await selectedProjection(first.app),
      count = accepted(first.db);
    failure = "write";
    await assert.rejects(
      executeTeaching(first.app, command),
      (error: unknown) =>
        error instanceof Error &&
        error.cause instanceof Error &&
        error.cause.message === "Injected decision write failure",
    );
    assert.deepEqual(await selectedProjection(first.app), before);
    assert.equal(accepted(first.db), count);
    failure = "reply";
    await assert.rejects(executeTeaching(first.app, command), /Lost/);
    const receipt = await executeTeaching(first.app, command);
    assert.equal(receipt.kind, "committed");
    assert.equal(accepted(first.db), Number(count) + 1);
    assert.deepEqual(
      await selectedProjection((await f.connectReady()).app),
      await selectedProjection(first.app),
    );
    assert.deepEqual(await executeTeaching(first.app, command), receipt);
  }
});
test("receipt pruning cannot replay stale complete choice or replace a committed queue", async (t) => {
  const f = await setup(t),
    first = await f.connectReady();
  await start({ fixture: f, app: first.app });
  await toSelection({ fixture: f, app: first.app });
  const view = await selectedProjection(first.app);
  if (view.kind !== "reviewSelection") throw new Error("Selection missing");
  const item = view.items[2];
  assert.ok(item);
  const command = await select({
    fixture: f,
    app: first.app,
    choice: {
      kind: "items",
      itemIds: [item.itemId],
    },
  });
  await executeTeaching(first.app, command);
  first.db.prepare("DELETE FROM command_receipt").run();
  const before = await selectedProjection(first.app),
    count = accepted(first.db);
  const stale = await executeTeaching(first.app, command);
  assert.equal(stale.kind, "rejected");
  assert.deepEqual(await selectedProjection(first.app), before);
  assert.equal(accepted(first.db), count);
  assert.deepEqual(
    await selectedProjection((await f.connectReady()).app),
    before,
  );
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
      first = await f.connectReady();
    await start({ fixture: f, app: first.app });
    await toSelection({ fixture: f, app: first.app });
    const command = await select({
      fixture: f,
      app: first.app,
      choice: { kind: "none" },
    });
    await executeTeaching(first.app, command);
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
    const before = await databaseSnapshot(first.db),
      attempts: string[] = [];
    const cold = f.connect({
      hook: async (sql, work) => {
        attempts.push(sql);
        return work();
      },
    });
    await assert.rejects(
      selectedProjection(cold.app),
      /acceptance|accepting|queue|command|payload|checkpoint|package|run|Response unavailable/i,
      tamper,
    );
    assert.ok(attempts.length > 0);
    assert.ok(attempts.every(isReadOnlySqlAttempt), tamper);
    assert.deepEqual(await databaseSnapshot(cold.db), before, tamper);

    assert.equal(accepted(first.db), 8);
    assert.equal(
      first.db.prepare("SELECT count(*) AS n FROM profile").get()?.n,
      1,
    );
  }
});
