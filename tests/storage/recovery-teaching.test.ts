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
  TeachingCommand,
  TeachingIntent,
  WritingApplication,
} from "../../packages/teaching/src/index.ts";
import { writingFixture } from "../teaching/writing-fixture.ts";
import { hash, storageFixture } from "./support.ts";

async function writing(app: WritingApplication) {
  const projection = await app.read();
  if (projection.kind !== "writing") throw Error("Expected open writing");
  return projection;
}
async function prepare({
  projection,
  kind,
  ids,
}: {
  projection: Extract<CommittedProjection, { kind: "writing" }>;
  kind: TeachingIntent["kind"];
  ids: () => string;
}) {
  const action = projection.actions.find(
    (action) => action.intent.kind === kind,
  );
  if (!action) throw Error(`Missing ${kind}`);
  return prepareWritingCommand({
    projection,
    action,
    barrier: { kind: "writing", documents: projection.documents },
    ids,
    hash,
  });
}
async function advance({
  app,
  kind,
  ids,
}: {
  app: WritingApplication;
  kind: TeachingIntent["kind"];
  ids: () => string;
}) {
  const command = await prepare({ projection: await writing(app), kind, ids });
  assert.equal((await app.dispatch(command)).kind, "committed");
}
async function start({
  app,
  ids,
}: {
  app: WritingApplication;
  ids: () => string;
}) {
  const projection = await app.open();
  if (projection.kind !== "entry") throw Error("Expected entry");
  const action = projection.actions.find(
    (action) => action.intent.kind === "start",
  );
  if (!action) throw Error("Missing Start");
  assert.equal(
    (
      await app.dispatch(
        await prepareCommand({
          projection,
          request: { kind: "action", action },
          ids,
          hash,
        }),
      )
    ).kind,
    "committed",
  );
}
function pending(command: TeachingCommand) {
  return {
    kind: "pending",
    commandId: command.commandId,
    payloadHash: command.payloadHash,
  } satisfies import("../../packages/teaching/src/index.ts").RecoveryTeaching;
}

for (const commandKind of ["writingNavigate", "writingSelect"]) {
  for (const loss of ["before COMMIT", "after COMMIT"]) {
    test(`${commandKind} exact Retry survives ${loss}, two more replacements and lost reconcile reply`, async (t) => {
      const fixture = await storageFixture(t, await writingFixture());
      let armed = false;
      const first = fixture.connect({
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
        projection,
        kind:
          commandKind === "writingNavigate" ? "confirmIndependent" : "restart",
        ids: fixture.ids,
      });
      assert.equal(command.kind, commandKind);
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
      await assert.rejects(first.app.dispatch(command), /Transport lost/);
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
        teaching: pending(command),
      });
      assert.equal((await second.app.open()).kind, "recovery");
      assert.equal((await second.app.read()).kind, "recovery");
      const token = projection.documents[0];
      if (!token) throw Error("Missing token");
      await assert.rejects(second.app.readInk({ token }), /closed/);
      assert.equal((await second.app.dispatch(command)).kind, "rejected");
      await assert.rejects(
        second.app.reconcileRecovery({
          recoveryId: opening.recoveryId,
          choice: { kind: "warm", settledStrokeIds: [] },
        }),
        /teaching.*resolution/,
      );
      loseRecoveredReply = true;
      await assert.rejects(
        second.app.recoverTeaching({ recoveryId: opening.recoveryId, command }),
        /Lost recoverTeaching reply/,
      );
      await assert.rejects(
        second.app.reconcileRecovery({
          recoveryId: opening.recoveryId,
          choice: { kind: "warm", settledStrokeIds: [] },
        }),
        /teaching.*resolution/,
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
        teaching: pending(command),
      });
      const receipt = await third.app.recoverTeaching({
        recoveryId: reopened.recoveryId,
        command,
      });
      assert.equal(receipt.kind, "committed");
      assert.deepEqual(
        await third.app.recoverTeaching({
          recoveryId: reopened.recoveryId,
          command,
        }),
        receipt,
      );
      assert.equal((await third.app.read()).kind, "recovery");
      loseReconcileReply = true;
      await assert.rejects(
        third.app.reconcileRecovery({
          recoveryId: reopened.recoveryId,
          choice: { kind: "warm", settledStrokeIds: [] },
        }),
        /Lost reconcile reply/,
      );
      assert.equal((await third.app.read()).kind, "recovery");

      const fourth = fixture.connect();
      const finalOpening = await fourth.app.openRecovery({
        kind: "warm",
        retainedStrokeIds: [],
        teaching: pending(command),
      });
      assert.deepEqual(
        await fourth.app.recoverTeaching({
          recoveryId: finalOpening.recoveryId,
          command,
        }),
        receipt,
      );
      const committed = await fourth.app.reconcileRecovery({
        recoveryId: finalOpening.recoveryId,
        choice: { kind: "warm", settledStrokeIds: [] },
      });
      assert.equal(canonical(command), envelope);
      assert.equal(Object.isFrozen(command.payload), true);
      assert.equal(
        fourth.db
          .prepare(
            "SELECT count(*) AS n FROM command_receipt WHERE command_id = ?",
          )
          .get(command.commandId)?.n,
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
  const first = fixture.connect();
  await start({ app: first.app, ids: fixture.ids });
  await advance({ app: first.app, kind: "continue", ids: fixture.ids });
  const projection = await writing(first.app);
  const token = projection.documents.find(
    (document) => document.targetId === "first",
  );
  if (!token) throw Error("Missing active token");
  const strokeId = parseId({ kind: "stroke", value: fixture.ids() });
  const begin = await prepareInkCommand({
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
  });
  const begun = await first.app.dispatchInk(begin);
  if (begun.kind !== "inkCommitted") throw Error("Missing ink receipt");
  const command = await prepare({
    projection: await writing(first.app),
    kind: "continue",
    ids: fixture.ids,
  });
  const replacement = fixture.connect();
  const none = await replacement.app.openRecovery({
    kind: "warm",
    retainedStrokeIds: [strokeId],
    teaching: { kind: "none" },
  });
  assert.equal(
    (
      await replacement.app.recoverTeaching({
        recoveryId: none.recoveryId,
        command,
      })
    ).kind,
    "rejected",
  );
  const opening = await replacement.app.openRecovery({
    kind: "warm",
    retainedStrokeIds: [strokeId],
    teaching: pending(command),
  });
  for (const changed of [
    parseCommand({ ...command, commandId: fixture.ids() }),
    parseCommand({ ...command, payloadHash: "0".repeat(64) }),
  ]) {
    const result = await replacement.app.recoverTeaching({
      recoveryId: opening.recoveryId,
      command: changed,
    });
    assert.equal(result.kind, "rejected");
    if (result.kind !== "rejected") throw Error();
    assert.equal(result.code, "undeclared-teaching");
  }
  const wrongRecovery = await replacement.app.recoverTeaching({
    recoveryId: "other",
    command,
  });
  assert.equal(wrongRecovery.kind, "rejected");
  if (wrongRecovery.kind !== "rejected") throw Error();
  assert.equal(wrongRecovery.code, "recovery-closed");
  const unsettled = await replacement.app.recoverTeaching({
    recoveryId: opening.recoveryId,
    command,
  });
  assert.equal(unsettled.kind, "rejected");
  if (unsettled.kind !== "rejected") throw Error();
  assert.equal(unsettled.code, "unsettled-capture");
  await assert.rejects(
    replacement.app.reconcileRecovery({
      recoveryId: opening.recoveryId,
      choice: { kind: "warm", settledStrokeIds: [strokeId] },
    }),
    /teaching.*resolution/,
  );
  await assert.rejects(
    replacement.app.openRecovery({
      kind: "warm",
      retainedStrokeIds: [strokeId],
      teaching: { kind: "none" },
    }),
    /declaration changed/,
  );
  await assert.rejects(
    replacement.app.openRecovery({
      kind: "warm",
      retainedStrokeIds: [strokeId],
      teaching: pending(parseCommand({ ...command, commandId: fixture.ids() })),
    }),
    /declaration changed/,
  );
  await assert.rejects(
    replacement.app.openRecovery({ kind: "cold" }),
    /cannot be replaced/,
  );
  assert.equal((await replacement.app.dispatchInk(begin)).kind, "rejected");
  assert.equal((await replacement.app.dispatch(command)).kind, "rejected");
  const finalized = await prepareInkCommand({
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
  });
  assert.equal(
    (
      await replacement.app.recoverInk({
        recoveryId: opening.recoveryId,
        command: finalized,
      })
    ).kind,
    "inkCommitted",
  );
  const rejected = await replacement.app.recoverTeaching({
    recoveryId: opening.recoveryId,
    command,
  });
  assert.equal(rejected.kind, "rejected");
  if (rejected.kind !== "rejected") throw Error();
  assert.equal(rejected.code, "writing-barrier");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    1,
  );
  assert.equal((await replacement.app.read()).kind, "recovery");
  const committed = await replacement.app.reconcileRecovery({
    recoveryId: opening.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [strokeId] },
  });
  assert.equal(committed.kind, "writing");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM ink_operation").get()?.n,
    1,
  );
});

for (const commandKind of ["writingNavigate", "writingSelect"]) {
  test(`${commandKind} closed recovery preserves genuine stale revision rejection`, async (t) => {
    const fixture = await storageFixture(t, await writingFixture());
    const first = fixture.connect();
    await start({ app: first.app, ids: fixture.ids });
    const command = await prepare({
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
      teaching: pending(command),
    });
    const result = await replacement.app.recoverTeaching({
      recoveryId: opening.recoveryId,
      command,
    });
    assert.equal(result.kind, "rejected");
    if (result.kind !== "rejected") throw Error();
    assert.equal(result.code, "stale-revision");
    assert.equal(
      first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
      before,
    );
    assert.equal((await replacement.app.read()).kind, "recovery");
    assert.equal(
      (
        await replacement.app.reconcileRecovery({
          recoveryId: opening.recoveryId,
          choice: { kind: "warm", settledStrokeIds: [] },
        })
      ).kind,
      "writing",
    );
  });
}

test("closed recovery rejects the original exact command after a real owner generation reset", async (t) => {
  const fixture = await storageFixture(t, await writingFixture());
  const first = fixture.connect();
  await start({ app: first.app, ids: fixture.ids });
  const command = await prepare({
    projection: await writing(first.app),
    kind: "continue",
    ids: fixture.ids,
  });
  const replacement = fixture.connect();
  const opening = await replacement.app.openRecovery({
    kind: "warm",
    retainedStrokeIds: [],
    teaching: pending(command),
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
    COMMIT;`);
  assert.deepEqual(first.db.prepare("PRAGMA foreign_key_check").all(), []);
  const result = await replacement.app.recoverTeaching({
    recoveryId: opening.recoveryId,
    command,
  });
  assert.equal(result.kind, "rejected");
  if (result.kind !== "rejected") throw Error();
  assert.equal(result.code, "stale-owner");
  const committed = await replacement.app.reconcileRecovery({
    recoveryId: opening.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [] },
  });
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
  const first = fixture.connect();
  await start({ app: first.app, ids: fixture.ids });
  await advance({ app: first.app, kind: "continue", ids: fixture.ids });
  const projection = await writing(first.app);
  const token = projection.documents.find(
    (document) => document.targetId === "first",
  );
  if (!token) throw Error("Missing token");
  const strokeId = parseId({ kind: "stroke", value: fixture.ids() });
  const begin = await prepareInkCommand({
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
  });
  const begun = await first.app.dispatchInk(begin);
  if (begun.kind !== "inkCommitted") throw Error("Missing receipt");
  const finalization = await prepareInkCommand({
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
  });
  const finished = await first.app.dispatchInk(finalization);
  if (finished.kind !== "inkCommitted") throw Error("Missing finalization");
  const command = await prepare({
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
    teaching: pending(command),
  });
  assert.deepEqual(opening.captures, []);
  assert.deepEqual(
    await replacement.app.recoverInk({
      recoveryId: opening.recoveryId,
      command: finalization,
    }),
    finished,
  );
  failBeforeCommit = true;
  await assert.rejects(
    replacement.app.recoverTeaching({
      recoveryId: opening.recoveryId,
      command,
    }),
    /Save failed/,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    1,
  );
  assert.equal((await replacement.app.read()).kind, "recovery");
  await assert.rejects(
    replacement.app.reconcileRecovery({
      recoveryId: opening.recoveryId,
      choice: { kind: "warm", settledStrokeIds: [strokeId] },
    }),
    /teaching.*resolution/,
  );
  const receipt = await replacement.app.recoverTeaching({
    recoveryId: opening.recoveryId,
    command,
  });
  assert.equal(receipt.kind, "committed");
  assert.equal((await replacement.app.read()).kind, "recovery");
  const committed = await replacement.app.reconcileRecovery({
    recoveryId: opening.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [strokeId] },
  });
  if (committed.kind !== "writing") throw Error("Missing writing");
  const current = committed.documents.find(
    (document) => document.targetId === "first",
  );
  if (!current) throw Error("Missing current token");
  const snapshot = await replacement.app.readInk({ token: current });
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
  const stale = await prepareInkCommand({
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
  });
  assert.equal((await replacement.app.dispatchInk(stale)).kind, "rejected");
  assert.equal(canonical(command), exactEnvelope);
});
