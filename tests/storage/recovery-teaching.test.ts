import {
  executeInk,
  executeTeaching,
  prepareSelectedInk,
  prepareSelectedTeaching,
  selectedInk,
  selectedProjection,
} from "./selected-support.ts";

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  encodeInkPoints,
  parseCommand,
  parseId,
  prepareCommand,
  prepareInkCommand,
  prepareWritingCommand,
} from "../../packages/teaching/src/index.ts";
import type {
  CommittedProjection,
  TeachingIntent,
  SelectedApplication,
} from "../../packages/teaching/src/index.ts";
import { writingFixture } from "../teaching/writing-fixture.ts";
import { hash, storageFixture } from "./support.ts";

async function writing(app: SelectedApplication) {
  const projection = await selectedProjection(app);
  if (projection.kind !== "writing") throw Error("Expected open writing");
  return projection;
}
async function prepare({
  app,
  projection,
  kind,
  ids,
}: {
  app: SelectedApplication;
  projection: Extract<CommittedProjection, { kind: "writing" }>;
  kind: TeachingIntent["kind"];
  ids: () => string;
}) {
  const action = projection.actions.find(
    (action) => action.intent.kind === kind,
  );
  if (!action) throw Error(`Missing ${kind}`);
  return prepareSelectedTeaching(app, async () =>
    prepareWritingCommand({
      projection,
      action,
      barrier: { kind: "writing", documents: projection.documents },
      ids,
      hash,
    }),
  );
}
async function advance({
  app,
  kind,
  ids,
}: {
  app: SelectedApplication;
  kind: TeachingIntent["kind"];
  ids: () => string;
}) {
  const command = await prepare({
    app,
    projection: await writing(app),
    kind,
    ids,
  });
  assert.equal((await executeTeaching(app, command)).kind, "committed");
}
async function start({
  app,
  ids,
}: {
  app: SelectedApplication;
  ids: () => string;
}) {
  const projection = await selectedProjection(app);
  if (projection.kind !== "entry") throw Error("Expected entry");
  const action = projection.actions.find(
    (action) => action.intent.kind === "start",
  );
  if (!action) throw Error("Missing Start");
  assert.equal(
    (
      await executeTeaching(
        app,
        await prepareSelectedTeaching(app, async () =>
          prepareCommand({
            projection,
            request: { kind: "action", action },
            ids,
            hash,
          }),
        ),
      )
    ).kind,
    "committed",
  );
}

for (const commandKind of ["writingNavigate", "writingSelect"]) {
  for (const loss of ["before COMMIT", "after COMMIT"]) {
    test(`${commandKind} exact Retry survives ${loss}, two more replacements and lost reconcile reply`, async (t) => {
      const fixture = await storageFixture(t, await writingFixture());
      let armed = false;
      const first = await fixture.connectReady({
        hook: async (sql, work) => {
          if (sql === "COMMIT" && armed) {
            armed = false;
            if (loss === "after COMMIT") await work();
            throw Error(`Transport lost ${loss}`);
          }
          return work();
        },
      });
      await start({ app: first.app, ids: fixture.ids });
      if (commandKind === "writingNavigate") {
        for (const kind of [
          "continue",
          "continue",
          "confirmTracing",
          "confirmIndependent",
          "continue",
          "confirmTracing",
        ] satisfies TeachingIntent["kind"][])
          await advance({ app: first.app, kind, ids: fixture.ids });
      }
      const projection = await writing(first.app);
      const command = await prepare({
        app: first.app,
        projection,
        kind:
          commandKind === "writingNavigate" ? "confirmIndependent" : "restart",
        ids: fixture.ids,
      });
      assert.equal(command.command.kind, commandKind);
      const envelope = canonical(command);
      const documentIds = projection.documents.map(
        (document) => document.documentId,
      );
      const beforeAdvances = first.db
        .prepare("SELECT count(*) AS n FROM task_advance")
        .get()?.n;
      const beforeSelection = first.db
        .prepare("SELECT selection_counter AS n FROM course_cursor")
        .get()?.n;
      armed = true;
      await assert.rejects(
        executeTeaching(first.app, command),
        /Transport lost/,
      );
      assert.equal(
        first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
        commandKind === "writingNavigate" && loss === "after COMMIT"
          ? Number(beforeAdvances) + 1
          : beforeAdvances,
      );
      assert.equal(
        first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
        commandKind === "writingNavigate" && loss === "after COMMIT" ? 1 : 0,
      );
      assert.equal(
        first.db.prepare("SELECT count(*) AS n FROM ink_document").get()?.n,
        commandKind === "writingSelect" && loss === "after COMMIT" ? 4 : 2,
      );

      let loseRecoveredReply = false;
      const second = fixture.connect({
        hook: async (sql, work) => {
          if (sql === "COMMIT" && loseRecoveredReply) {
            loseRecoveredReply = false;
            if (loss === "after COMMIT") await work();
            throw Error("Lost recoverTeaching reply");
          }
          return work();
        },
      });
      const opening = await second.app.openRecovery({
        kind: "warm",
        retainedStrokeIds: [],
        selection: command.selection,
        teaching: command,
        administration: null,
      });
      assert.equal((await selectedProjection(second.app)).kind, "recovery");
      assert.equal((await selectedProjection(second.app)).kind, "recovery");
      const token = projection.documents[0];
      if (!token) throw Error("Missing token");
      await assert.rejects(selectedInk(second.app, { token }), /closed/);
      assert.equal(
        (await executeTeaching(second.app, command)).kind,
        "rejected",
      );
      await assert.rejects(
        second.app.reconcileRecovery({
          recoveryId: opening.recoveryId,
          choice: { kind: "warm", settledStrokeIds: [] },
        }),
        /Declared retained work still requires exact ordered resolution/,
      );
      loseRecoveredReply = true;
      await assert.rejects(
        second.app.recoverTeaching({
          recoveryId: opening.recoveryId,
          operation: command,
        }),
        /Lost recoverTeaching reply/,
      );
      await assert.rejects(
        second.app.reconcileRecovery({
          recoveryId: opening.recoveryId,
          choice: { kind: "warm", settledStrokeIds: [] },
        }),
        /Declared retained work still requires exact ordered resolution/,
      );

      let loseReconcileReply = false;
      const third = fixture.connect({
        hook: async (sql, work) => {
          const result = await work();
          if (sql === "COMMIT" && loseReconcileReply) {
            loseReconcileReply = false;
            throw Error("Lost reconcile reply");
          }
          return result;
        },
      });
      const reopened = await third.app.openRecovery({
        kind: "warm",
        retainedStrokeIds: [],
        selection: command.selection,
        teaching: command,
        administration: null,
      });
      const receipt = await third.app.recoverTeaching({
        recoveryId: reopened.recoveryId,
        operation: command,
      });
      assert.equal(receipt.resolution, "applied");
      if (receipt.resolution !== "applied")
        throw Error("Missing teaching resolution");
      assert.equal(receipt.result.kind, "committed");
      assert.deepEqual(receipt.selection, command.selection);
      const retry = await third.app.recoverTeaching({
        recoveryId: reopened.recoveryId,
        operation: command,
      });
      assert.equal(retry.resolution, "receiptOnly");
      if (retry.resolution !== "receiptOnly")
        throw Error("Missing retained receipt");
      assert.deepEqual(retry.selection, command.selection);
      assert.deepEqual(retry.result, receipt.result);
      assert.equal((await selectedProjection(third.app)).kind, "recovery");
      loseReconcileReply = true;
      await assert.rejects(
        third.app.reconcileRecovery({
          recoveryId: reopened.recoveryId,
          choice: { kind: "warm", settledStrokeIds: [] },
        }),
        /Lost reconcile reply/,
      );
      assert.equal((await selectedProjection(third.app)).kind, "recovery");

      const fourth = fixture.connect();
      const finalOpening = await fourth.app.openRecovery({
        kind: "warm",
        retainedStrokeIds: [],
        selection: command.selection,
        teaching: command,
        administration: null,
      });
      const resolved = await fourth.app.recoverTeaching({
        recoveryId: finalOpening.recoveryId,
        operation: command,
      });
      assert.equal(resolved.resolution, "applied");
      if (resolved.resolution !== "applied")
        throw Error("Missing reopened resolution");
      assert.deepEqual(resolved.selection, command.selection);
      assert.deepEqual(resolved.result, receipt.result);
      await fourth.app.reconcileRecovery({
        recoveryId: finalOpening.recoveryId,
        choice: { kind: "warm", settledStrokeIds: [] },
      });
      const committed = await selectedProjection(fourth.app);
      assert.equal(canonical(command), envelope);
      assert.equal(Object.isFrozen(command.command.payload), true);
      assert.equal(
        fourth.db
          .prepare(
            "SELECT count(*) AS n FROM command_receipt WHERE command_id = ?",
          )
          .get(command.command.commandId)?.n,
        1,
      );
      assert.equal(
        fourth.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
        commandKind === "writingNavigate"
          ? Number(beforeAdvances) + 1
          : beforeAdvances,
      );
      assert.equal(
        fourth.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
        commandKind === "writingNavigate" ? 1 : 0,
      );
      assert.equal(
        fourth.db.prepare("SELECT count(*) AS n FROM task_result").get()?.n,
        commandKind === "writingNavigate" ? 1 : 0,
      );
      assert.equal(
        fourth.db
          .prepare("SELECT selection_counter AS n FROM course_cursor")
          .get()?.n,
        commandKind === "writingSelect"
          ? Number(beforeSelection) + 1
          : beforeSelection,
      );
      assert.equal(
        fourth.db.prepare("SELECT count(*) AS n FROM task_run").get()?.n,
        commandKind === "writingSelect" ? 2 : 1,
      );
      assert.equal(
        fourth.db.prepare("SELECT count(*) AS n FROM ink_document").get()?.n,
        commandKind === "writingSelect" ? 4 : 2,
      );
      if (commandKind === "writingNavigate") {
        assert.equal(committed.kind, "writingResult");
        if (committed.kind !== "writingResult")
          throw Error("Missing completed writing");
        assert.equal(committed.outcome, "completed");
        assert.deepEqual(
          committed.documents.map((document) => document.documentId),
          documentIds,
        );
      } else {
        assert.equal(committed.kind, "writing");
        if (committed.kind !== "writing")
          throw Error("Missing restarted writing");
        assert.notEqual(committed.runId, projection.runId);
        assert.ok(
          committed.documents.every(
            (document) => !documentIds.includes(document.documentId),
          ),
        );
      }
      assert.deepEqual(fourth.db.prepare("PRAGMA foreign_key_check").all(), []);
    });
  }
}

test("closed recovery enforces declaration, identity and settled ink before resolving teaching", async (t) => {
  const fixture = await storageFixture(t, await writingFixture());
  const first = await fixture.connectReady();
  await start({ app: first.app, ids: fixture.ids });
  await advance({ app: first.app, kind: "continue", ids: fixture.ids });
  const projection = await writing(first.app);
  const token = projection.documents.find(
    (document) => document.targetId === "first",
  );
  if (!token) throw Error("Missing active token");
  const strokeId = parseId({ kind: "stroke", value: fixture.ids() });
  const begin = await prepareSelectedInk(first.app, async () =>
    prepareInkCommand({
      token,
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
            chunkIndex: 0,
            firstPointIndex: 0,
            pointCount: 1,
            codecVersion: 1,
            payload: [
              ...encodeInkPoints({
                points: [{ x: 10, y: 100, elapsedMs: 0 }],
                bounds: { width: 1000, height: 180 },
              }),
            ],
          },
        ],
      },
      ids: fixture.ids,
      hash,
    }),
  );
  const begun = await executeInk(first.app, begin);
  if (begun.kind !== "inkCommitted") throw Error("Missing ink receipt");
  const command = await prepare({
    app: first.app,
    projection: await writing(first.app),
    kind: "continue",
    ids: fixture.ids,
  });
  const undeclared = fixture.connect();
  const none = await undeclared.app.openRecovery({
    kind: "warm",
    retainedStrokeIds: [strokeId],
    selection: command.selection,
    teaching: null,
    administration: null,
  });
  const undeclaredResult = await undeclared.app.recoverTeaching({
    recoveryId: none.recoveryId,
    operation: command,
  });
  assert.equal(undeclaredResult.resolution, "rejected");
  if (undeclaredResult.resolution !== "rejected")
    throw Error("Undeclared teaching resolved");
  assert.equal(undeclaredResult.result.code, "undeclared-teaching");
  const replacement = fixture.connect();
  const opening = await replacement.app.openRecovery({
    kind: "warm",
    retainedStrokeIds: [strokeId],
    selection: command.selection,
    teaching: command,
    administration: null,
  });
  for (const changed of [
    {
      ...command,
      command: parseCommand({ ...command.command, commandId: fixture.ids() }),
    },
    {
      ...command,
      command: parseCommand({
        ...command.command,
        payloadHash: "0".repeat(64),
      }),
    },
  ]) {
    const result = await replacement.app.recoverTeaching({
      recoveryId: opening.recoveryId,
      operation: changed,
    });
    assert.equal(result.resolution, "rejected");
    if (result.resolution !== "rejected") throw Error();
    assert.equal(result.result.code, "undeclared-teaching");
  }
  const wrongRecovery = await replacement.app.recoverTeaching({
    recoveryId: "other",
    operation: command,
  });
  assert.equal(wrongRecovery.resolution, "rejected");
  if (wrongRecovery.resolution !== "rejected") throw Error();
  assert.equal(wrongRecovery.result.code, "recovery-closed");
  const unsettled = await replacement.app.recoverTeaching({
    recoveryId: opening.recoveryId,
    operation: command,
  });
  assert.equal(unsettled.resolution, "rejected");
  if (unsettled.resolution !== "rejected") throw Error();
  assert.equal(unsettled.result.code, "unsettled-capture");
  await assert.rejects(
    replacement.app.reconcileRecovery({
      recoveryId: opening.recoveryId,
      choice: { kind: "warm", settledStrokeIds: [strokeId] },
    }),
    /Declared retained work still requires exact ordered resolution/,
  );
  await assert.rejects(
    replacement.app.openRecovery({
      kind: "warm",
      retainedStrokeIds: [strokeId],
      selection: command.selection,
      teaching: null,
      administration: null,
    }),
    /declaration changed/,
  );
  await assert.rejects(
    replacement.app.openRecovery({
      kind: "warm",
      retainedStrokeIds: [strokeId],
      selection: command.selection,
      teaching: {
        ...command,
        command: parseCommand({ ...command.command, commandId: fixture.ids() }),
      },
      administration: null,
    }),
    /declaration changed/,
  );
  await assert.rejects(
    replacement.app.openRecovery({ kind: "cold" }),
    /Pending warm recovery declaration changed/,
  );
  assert.equal((await executeInk(replacement.app, begin)).kind, "rejected");
  assert.equal(
    (await executeTeaching(replacement.app, command)).kind,
    "rejected",
  );
  const finalized = await prepareSelectedInk(replacement.app, async () =>
    prepareInkCommand({
      token: begun.token,
      edit: {
        kind: "finalize",
        strokeId,
        layer: "model",
        chunks: [],
        status: "interrupted",
      },
      ids: fixture.ids,
      hash,
    }),
  );
  const inkResolution = await replacement.app.recoverInk({
    recoveryId: opening.recoveryId,
    operation: finalized,
  });
  assert.equal(inkResolution.resolution, "applied");
  if (inkResolution.resolution !== "applied")
    throw Error("Missing retained ink resolution");
  assert.equal(inkResolution.result.kind, "inkCommitted");
  const rejected = await replacement.app.recoverTeaching({
    recoveryId: opening.recoveryId,
    operation: command,
  });
  assert.equal(rejected.resolution, "rejected");
  if (rejected.resolution !== "rejected") throw Error();
  assert.equal(rejected.result.code, "writing-barrier");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    1,
  );
  assert.equal((await selectedProjection(replacement.app)).kind, "recovery");
  await replacement.app.reconcileRecovery({
    recoveryId: opening.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [strokeId] },
  });
  const committed = await selectedProjection(replacement.app);
  assert.equal(committed.kind, "writing");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM ink_operation").get()?.n,
    1,
  );
});

for (const commandKind of ["writingNavigate", "writingSelect"]) {
  test(`${commandKind} closed recovery preserves genuine stale revision rejection`, async (t) => {
    const fixture = await storageFixture(t, await writingFixture());
    const first = await fixture.connectReady();
    await start({ app: first.app, ids: fixture.ids });
    const command = await prepare({
      app: first.app,
      projection: await writing(first.app),
      kind: commandKind === "writingNavigate" ? "continue" : "restart",
      ids: fixture.ids,
    });
    if (commandKind === "writingNavigate")
      await advance({ app: first.app, kind: "continue", ids: fixture.ids });
    else first.db.exec("UPDATE profile SET revision = revision + 1");
    const before = first.db
      .prepare("SELECT count(*) AS n FROM task_advance")
      .get()?.n;
    const replacement = fixture.connect();
    const opening = await replacement.app.openRecovery({
      kind: "warm",
      retainedStrokeIds: [],
      selection: command.selection,
      teaching: command,
      administration: null,
    });
    const result = await replacement.app.recoverTeaching({
      recoveryId: opening.recoveryId,
      operation: command,
    });
    assert.equal(result.resolution, "rejected");
    if (result.resolution !== "rejected") throw Error();
    assert.equal(result.result.code, "stale-revision");
    assert.equal(
      first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
      before,
    );
    assert.equal((await selectedProjection(replacement.app)).kind, "recovery");
    await replacement.app.reconcileRecovery({
      recoveryId: opening.recoveryId,
      choice: { kind: "warm", settledStrokeIds: [] },
    });
    assert.equal((await selectedProjection(replacement.app)).kind, "writing");
  });
}

test("closed recovery rejects the original exact command after a real owner generation reset", async (t) => {
  const fixture = await storageFixture(t, await writingFixture());
  const first = await fixture.connectReady();
  await start({ app: first.app, ids: fixture.ids });
  const command = await prepare({
    app: first.app,
    projection: await writing(first.app),
    kind: "continue",
    ids: fixture.ids,
  });
  const replacement = fixture.connect();
  const opening = await replacement.app.openRecovery({
    kind: "warm",
    retainedStrokeIds: [],
    selection: command.selection,
    teaching: command,
    administration: null,
  });
  first.db.exec(`BEGIN;
    PRAGMA defer_foreign_keys=ON;
    DELETE FROM command_receipt;
    DELETE FROM ink_operation;
    DELETE FROM ink_history;
    DELETE FROM ink_point_chunk;
    DELETE FROM ink_stroke;
    DELETE FROM ink_document;
    DELETE FROM task_result;
    DELETE FROM task_credit;
    DELETE FROM task_advance;
    DELETE FROM task_run;
    DELETE FROM session;
    DELETE FROM course_cursor;
    UPDATE profile SET generation=generation+1,revision=revision+1,undo_run_id=NULL;
    UPDATE installation_profile_state SET generation=generation+1,selection_revision=selection_revision+1;
    COMMIT;`);
  assert.deepEqual(first.db.prepare("PRAGMA foreign_key_check").all(), []);
  const result = await replacement.app.recoverTeaching({
    recoveryId: opening.recoveryId,
    operation: command,
  });
  assert.equal(result.resolution, "rejected");
  if (result.resolution !== "rejected") throw Error();
  assert.equal(result.result.code, "stale-owner");
  await replacement.app.reconcileRecovery({
    recoveryId: opening.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [] },
  });
  const committed = await selectedProjection(replacement.app);
  assert.equal(committed.kind, "entry");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_run").get()?.n,
    0,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM ink_document").get()?.n,
    0,
  );
});

test("settled retained ink precedes teaching and same-worker save Retry retains exact command", async (t) => {
  const fixture = await storageFixture(t, await writingFixture());
  const first = await fixture.connectReady();
  await start({ app: first.app, ids: fixture.ids });
  await advance({ app: first.app, kind: "continue", ids: fixture.ids });
  const projection = await writing(first.app);
  const token = projection.documents.find(
    (document) => document.targetId === "first",
  );
  if (!token) throw Error("Missing token");
  const strokeId = parseId({ kind: "stroke", value: fixture.ids() });
  const begin = await prepareSelectedInk(first.app, async () =>
    prepareInkCommand({
      token,
      ids: fixture.ids,
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
  );
  const begun = await executeInk(first.app, begin);
  if (begun.kind !== "inkCommitted") throw Error("Missing receipt");
  const finalization = await prepareSelectedInk(first.app, async () =>
    prepareInkCommand({
      token: begun.token,
      ids: fixture.ids,
      hash,
      edit: {
        kind: "finalize",
        strokeId,
        layer: "model",
        chunks: [],
        status: "interrupted",
      },
    }),
  );
  const finished = await executeInk(first.app, finalization);
  if (finished.kind !== "inkCommitted") throw Error("Missing finalization");
  const command = await prepare({
    app: first.app,
    projection: await writing(first.app),
    kind: "continue",
    ids: fixture.ids,
  });
  const exactEnvelope = canonical(command);
  let failBeforeCommit = false;
  const replacement = fixture.connect({
    hook: async (sql, work) => {
      if (sql === "COMMIT" && failBeforeCommit) {
        failBeforeCommit = false;
        throw Error("Save failed before COMMIT");
      }
      return work();
    },
  });
  const opening = await replacement.app.openRecovery({
    kind: "warm",
    retainedStrokeIds: [strokeId],
    selection: command.selection,
    teaching: command,
    administration: null,
  });
  assert.deepEqual(opening.captures, []);
  const inkResolution = await replacement.app.recoverInk({
    recoveryId: opening.recoveryId,
    operation: finalization,
  });
  assert.equal(inkResolution.resolution, "applied");
  if (inkResolution.resolution !== "applied")
    throw Error("Missing retained ink receipt");
  assert.deepEqual(inkResolution.result, finished);
  failBeforeCommit = true;
  await assert.rejects(
    replacement.app.recoverTeaching({
      recoveryId: opening.recoveryId,
      operation: command,
    }),
    /Save failed/,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    1,
  );
  assert.equal((await selectedProjection(replacement.app)).kind, "recovery");
  await assert.rejects(
    replacement.app.reconcileRecovery({
      recoveryId: opening.recoveryId,
      choice: { kind: "warm", settledStrokeIds: [strokeId] },
    }),
    /Declared retained work still requires exact ordered resolution/,
  );
  const receipt = await replacement.app.recoverTeaching({
    recoveryId: opening.recoveryId,
    operation: command,
  });
  assert.equal(receipt.resolution, "applied");
  if (receipt.resolution !== "applied")
    throw Error("Missing teaching resolution");
  assert.equal(receipt.result.kind, "committed");
  assert.equal((await selectedProjection(replacement.app)).kind, "recovery");
  await replacement.app.reconcileRecovery({
    recoveryId: opening.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [strokeId] },
  });
  const committed = await selectedProjection(replacement.app);
  if (committed.kind !== "writing") throw Error("Missing writing");
  const current = committed.documents.find(
    (document) => document.targetId === "first",
  );
  if (!current) throw Error("Missing current token");
  const snapshot = await selectedInk(replacement.app, { token: current });
  assert.equal(snapshot.strokes.length, 1);
  assert.equal(snapshot.strokes[0]?.status, "interrupted");
  assert.equal(snapshot.strokes[0]?.pointCount, 1);
  assert.equal(
    snapshot.histories.find((history) => history.layer === "model")?.operations
      .length,
    1,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    2,
  );
  assert.equal(current.phase, "childTracing");
  assert.ok(BigInt(current.inputEpoch) > BigInt(finished.token.inputEpoch));
  const stale = await prepareSelectedInk(replacement.app, async () =>
    prepareInkCommand({
      token: finished.token,
      ids: fixture.ids,
      hash,
      edit: {
        kind: "begin",
        strokeId: parseId({ kind: "stroke", value: fixture.ids() }),
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
    }),
  );
  assert.equal((await executeInk(replacement.app, stale)).kind, "rejected");
  assert.equal(canonical(command), exactEnvelope);
});
