import assert from "node:assert/strict";
import { test } from "node:test";
import {
  encodeInkPoints,
  parseId,
  prepareCommand,
  prepareStorageCleanup,
  prepareInkCommand,
  prepareWritingCommand,
} from "../../packages/teaching/src/index.ts";
import type {
  SelectedApplication,
  TeachingIntent,
} from "../../packages/teaching/src/index.ts";
import { writingFixture } from "../teaching/writing-fixture.ts";
import { databaseSnapshot, hash, storageFixture } from "./support.ts";
import {
  executeInk,
  executeTeaching,
  prepareSelectedInk,
  prepareSelectedTeaching,
  selectedInk,
  selectedProjection,
} from "./selected-support.ts";

async function act(
  app: SelectedApplication,
  ids: () => string,
  kind: TeachingIntent["kind"],
) {
  const projection = await selectedProjection(app);
  if (projection.kind === "recovery") throw new Error(projection.message);
  const action = projection.actions.find((item) => item.intent.kind === kind);
  assert.ok(action, `Expected ${kind} at ${projection.kind}`);
  return executeTeaching(
    app,
    await prepareSelectedTeaching(app, async () =>
      projection.kind === "writing" || projection.kind === "writingResult"
        ? prepareWritingCommand({
            projection,
            action,
            barrier: { kind: "writing", documents: projection.documents },
            ids,
            hash,
          })
        : prepareCommand({
            projection,
            request: { kind: "action", action },
            ids,
            hash,
          }),
    ),
  );
}

test("parent-selected older drawing cleanup preserves credit, current work and exact Retry through reopen", async (t) => {
  const f = await storageFixture(t, await writingFixture());
  let failCleanup = false;
  let failTeaching = false;
  const { app, db } = await f.connectReady({
    hook: async (sql, work) => {
      if (failTeaching && sql.startsWith('insert into "command_receipt"'))
        throw new Error("Pending teaching save refused");
      if (
        failCleanup &&
        sql.startsWith('insert into "storage_cleanup_receipt"')
      )
        throw new Error("Cleanup receipt refused");
      return work();
    },
  });
  await act(app, f.ids, "start");
  await act(app, f.ids, "continue");
  const model = await selectedProjection(app);
  if (model.kind !== "writing") throw new Error("Expected model writing");
  const token = model.documents[0];
  assert.ok(token);
  const strokeId = parseId({ kind: "stroke", value: f.ids() });
  const begun = await executeInk(
    app,
    await prepareSelectedInk(app, () =>
      prepareInkCommand({
        token,
        ids: f.ids,
        hash,
        edit: {
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
              codecVersion: 1,
              chunkIndex: 0,
              firstPointIndex: 0,
              pointCount: 1,
              payload: [
                ...encodeInkPoints({
                  points: [{ x: 20, y: 100, elapsedMs: 0 }],
                  bounds: { width: 1000, height: 180 },
                }),
              ],
            },
          ],
        },
      }),
    ),
  );
  if (begun.kind !== "inkCommitted") throw new Error("Seed ink must commit");
  await executeInk(
    app,
    await prepareSelectedInk(app, () =>
      prepareInkCommand({
        token: begun.token,
        ids: f.ids,
        hash,
        edit: {
          kind: "finalize",
          strokeId,
          layer: "model",
          chunks: [],
          status: "finished",
        },
      }),
    ),
  );
  for (const kind of [
    "continue",
    "confirmTracing",
    "confirmIndependent",
    "continue",
    "confirmTracing",
    "confirmIndependent",
  ] as const)
    await act(app, f.ids, kind);
  const terminal = await selectedProjection(app);
  if (terminal.kind !== "writingResult") throw new Error("Expected completion");
  const selection = (await app.readDirectory()).selection;
  const protectedView = await app.readStorageCleanup({ selection });
  const protectedToken = terminal.documents.find(
    (document) => document.documentId === token.documentId,
  );
  assert.ok(protectedToken);
  const protectedAttempt = await prepareStorageCleanup({
    view: protectedView,
    drawings: [{ token: protectedToken, pointBytes: 16 }],
    ids: f.ids,
    hash,
  });
  const protectedSnapshot = await databaseSnapshot(db);
  await assert.rejects(
    app.cleanupStorage(protectedAttempt),
    /no longer eligible/,
  );
  assert.deepEqual(await databaseSnapshot(db), protectedSnapshot);
  assert.equal(
    protectedView.drawings.length,
    0,
    "the open Undo window protects completed drawing bytes",
  );
  await act(app, f.ids, "replay");
  const current = await selectedProjection(app);
  if (current.kind !== "writing") throw new Error("Expected replay writing");
  const nextAction = current.actions.find(
    (action) => action.intent.kind === "continue",
  );
  assert.ok(nextAction);
  const pending = await prepareSelectedTeaching(app, () =>
    prepareWritingCommand({
      projection: current,
      action: nextAction,
      barrier: { kind: "writing", documents: current.documents },
      ids: f.ids,
      hash,
    }),
  );
  const beforePending = await databaseSnapshot(db);
  failTeaching = true;
  await assert.rejects(executeTeaching(app, pending));
  assert.deepEqual(await databaseSnapshot(db), beforePending);
  failTeaching = false;
  const plan = await app.readStorageCleanup({ selection });
  const older = plan.drawings.find(
    (item) => item.token.documentId === token.documentId,
  );
  assert.ok(
    older,
    "historical bytes become eligible only after the Undo window closes",
  );
  const credits = db
    .prepare("SELECT * FROM task_credit ORDER BY credit_id")
    .all();
  const results = db
    .prepare("SELECT * FROM task_result ORDER BY task_id")
    .all();
  const command = await prepareStorageCleanup({
    view: plan,
    drawings: [older],
    ids: f.ids,
    hash,
  });
  const currentToken = current.documents[0];
  assert.ok(currentToken);
  const mixed = await prepareStorageCleanup({
    view: plan,
    drawings: [older, { token: currentToken, pointBytes: 0 }],
    ids: f.ids,
    hash,
  });
  const beforeCleanup = await databaseSnapshot(db);
  await assert.rejects(app.cleanupStorage(mixed), /no longer eligible/);
  assert.deepEqual(
    await databaseSnapshot(db),
    beforeCleanup,
    "a protected target rejects the whole selected batch",
  );
  failCleanup = true;
  await assert.rejects(app.cleanupStorage(command));
  assert.deepEqual(
    await databaseSnapshot(db),
    beforeCleanup,
    "failed cleanup retains every acknowledged byte",
  );
  failCleanup = false;
  const receipt = await app.cleanupStorage(command);
  assert.equal(receipt.kind, "cleanupCommitted");
  assert.deepEqual(await selectedProjection(app), current);
  assert.deepEqual(
    db.prepare("SELECT * FROM task_credit ORDER BY credit_id").all(),
    credits,
  );
  assert.deepEqual(
    db.prepare("SELECT * FROM task_result ORDER BY task_id").all(),
    results,
  );
  const savedPending = await executeTeaching(app, pending);
  assert.equal(
    savedPending.kind,
    "committed",
    "cleanup must not stale the already prepared teaching command",
  );
  const after = await databaseSnapshot(db);
  assert.deepEqual(await app.cleanupStorage(command), receipt);
  assert.deepEqual(await databaseSnapshot(db), after);
  db.close();
  const reopened = f.connect();
  assert.deepEqual(await reopened.app.cleanupStorage(command), receipt);
  assert.deepEqual(await databaseSnapshot(reopened.db), after);
  assert.equal(
    reopened.db
      .prepare(
        "SELECT count(*) AS count FROM ink_point_chunk WHERE stroke_id=?",
      )
      .get(strokeId)?.count,
    0,
  );
  reopened.db.exec("DELETE FROM storage_cleanup_receipt");
  const pruned = await databaseSnapshot(reopened.db);
  await assert.rejects(
    reopened.app.cleanupStorage(command),
    /revision changed/,
  );
  assert.deepEqual(
    await databaseSnapshot(reopened.db),
    pruned,
    "pruning cannot turn old cleanup into a new mutation",
  );
  const removedToken = receipt.drawings[0];
  assert.ok(removedToken);
  const inventory = await reopened.app.openRecovery({ kind: "cold" });
  await reopened.app.reconcileRecovery({
    recoveryId: inventory.recoveryId,
    choice: { kind: "cold" },
  });
  const historical = await reopened.app.readWork({
    selection,
    runId: removedToken.runId,
  });
  const history = historical.value.documents.find(
    (document) => document.target.id === removedToken.targetId,
  )?.snapshot;
  assert.ok(history);
  assert.equal(
    history.removed,
    true,
    "removed drawings must never masquerade as blank work",
  );
  assert.equal(
    historical.value.documents.find(
      (document) => document.target.id === removedToken.targetId,
    )?.access,
    "readOnly",
  );
});
