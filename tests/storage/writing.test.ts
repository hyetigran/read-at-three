import {
  executeInk,
  executeTeaching,
  prepareSelectedInk,
  prepareSelectedTeaching,
  selectedInk,
  selectedProjection,
} from "./selected-support.ts";

import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  encodeInkPoints,
  parseCounter,
  parseId,
  parseHash,
  prepareCommand,
  prepareWritingCommand,
  parseDevelopmentPackage,
  parseInkSnapshot,
  parseProjection,
  parseCommand,
  parseRecoveryInventory,
} from "../../packages/teaching/src/index.ts";
import type {
  DocumentToken,
  SelectedInkOperation,
  InkEdit,
  SelectedApplication,
  TeachingIntent,
  InkChunk,
} from "../../packages/teaching/src/index.ts";
import { writingFixture } from "../teaching/writing-fixture.ts";
import {
  databaseSnapshot,
  hash,
  isReadOnlySqlAttempt,
  storageFixture,
} from "./support.ts";
async function act({
  app,
  kind,
  ids,
}: {
  app: SelectedApplication;
  kind: TeachingIntent["kind"];
  ids: () => string;
}) {
  const projection = await selectedProjection(app);
  if (projection.kind === "recovery") throw Error(projection.message);
  const action = projection.actions.find((a) => a.intent.kind === kind);
  if (!action) throw Error(`Missing ${kind} at ${projection.kind}`);
  const command =
    projection.kind === "writing" || projection.kind === "writingResult"
      ? await prepareSelectedTeaching(app, async () =>
          prepareWritingCommand({
            projection,
            action,
            barrier: { kind: "writing", documents: projection.documents },
            ids,
            hash,
          }),
        )
      : await prepareSelectedTeaching(app, async () =>
          prepareCommand({
            projection,
            request: { kind: "action", action },
            ids,
            hash,
          }),
        );
  return executeTeaching(app, command);
}
function chunk({
  x = 10,
  index = 0,
  first = 0,
  elapsedMs = 0,
}: {
  x?: number;
  index?: number;
  first?: number;
  elapsedMs?: number;
} = {}): InkChunk {
  return {
    chunkIndex: index,
    firstPointIndex: first,
    pointCount: 1,
    codecVersion: 1,
    payload: [
      ...encodeInkPoints({
        points: [{ x, y: 100, elapsedMs }],
        bounds: { width: 1000, height: 180 },
      }),
    ],
  };
}
async function inkCommand({
  app,
  token,
  edit,
  ids,
}: {
  app: SelectedApplication;
  token: DocumentToken;
  edit: InkEdit;
  ids: () => string;
}): Promise<SelectedInkOperation> {
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
const brush = {
  kind: "round",
  width: 4,
  colorRole: "model",
  cap: "round",
  join: "round",
} satisfies import("../../packages/teaching/src/index.ts").BrushSpec;

test("real writing SQL enforces frontier, barriers, epochs, atomic capture and exact Retry", async (t) => {
  const f = await storageFixture(t, await writingFixture()),
    first = await f.connectReady(),
    app = first.app;
  await selectedProjection(app);
  await act({ app, kind: "start", ids: f.ids });
  let p = await selectedProjection(app);
  if (p.kind !== "writing") throw Error("writing missing");
  assert.equal(p.documents.length, 2);
  const token = p.documents.find((d) => d.targetId === "first");
  if (!token) throw Error();
  const begin = await inkCommand({
    app,
    token,
    edit: {
      kind: "begin",
      strokeId: parseId({ kind: "stroke", value: f.ids() }),
      layer: "model",
      brush,
      chunks: [chunk()],
    },
    ids: f.ids,
  });
  assert.equal((await executeInk(app, begin)).kind, "rejected");
  await act({ app, kind: "continue", ids: f.ids });
  p = await selectedProjection(app);
  if (p.kind !== "writing") throw Error();
  const active = p.documents.find((d) => d.targetId === "first");
  if (!active) throw Error();
  const command = await inkCommand({
    app,
    token: active,
    edit: begin.command.edit,
    ids: f.ids,
  });
  const receipt = await executeInk(app, command);
  assert.equal(receipt.kind, "inkCommitted");
  assert.deepEqual(await executeInk(app, command), receipt);
  assert.equal(
    (await act({ app, kind: "continue", ids: f.ids })).kind,
    "rejected",
  );
  if (receipt.kind !== "inkCommitted") throw Error();
  const finish = await inkCommand({
    app,
    token: receipt.token,
    edit: {
      kind: "finalize",
      strokeId: begin.command.edit.strokeId,
      layer: "model",
      chunks: [],
      status: "finished",
    },
    ids: f.ids,
  });
  assert.equal((await executeInk(app, finish)).kind, "inkCommitted");
  assert.equal(
    (await act({ app, kind: "continue", ids: f.ids })).kind,
    "committed",
  );
  p = await selectedProjection(app);
  if (p.kind !== "writing") throw Error();
  assert.equal(p.turn.presentation.kind, "writing");
  assert.equal(
    p.actions.some(
      (a) => a.intent.kind === "continue" || a.intent.kind === "repeat",
    ),
    false,
  );
  const advanced = p.documents.find((d) => d.targetId === "first");
  if (!advanced) throw Error();
  assert.equal(advanced.phase, "childTracing");
  const snapshot = await selectedInk(app, { token: advanced });
  assert.equal(snapshot.strokes[0]?.layer, "model");
  assert.deepEqual(snapshot.guides, { top: 10, midline: 90, baseline: 170 });
  assert.equal(snapshot.boardY, 0);
  assert.equal(
    (
      await executeInk(
        app,
        await inkCommand({
          app,
          token: advanced,
          edit: {
            kind: "begin",
            strokeId: parseId({ kind: "stroke", value: f.ids() }),
            layer: "model",
            brush,
            chunks: [],
          },
          ids: f.ids,
        }),
      )
    ).kind,
    "rejected",
  );
  await act({ app, kind: "back", ids: f.ids });
  p = await selectedProjection(app);
  if (p.kind !== "writing") throw Error();
  const earlier = p.documents.find((d) => d.targetId === "first");
  if (!earlier) throw Error();
  assert.equal((await selectedInk(app, { token: earlier })).writable, false);
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    2,
  );
  await act({ app, kind: "continue", ids: f.ids });
  await act({ app, kind: "pause", ids: f.ids });
  const reopened = f.connect();
  assert.equal((await selectedProjection(reopened.app)).kind, "recovery");
  const inv = await reopened.app.openRecovery({ kind: "cold" });
  await reopened.app.reconcileRecovery({
    recoveryId: inv.recoveryId,
    choice: { kind: "cold" },
  });
  assert.equal((await selectedProjection(reopened.app)).kind, "writing");
});

test("lost checkpoint and tail-finalize acknowledgements survive two warm replacements with one origin", async (t) => {
  const f = await storageFixture(t, await writingFixture()),
    first = await f.connectReady();
  await selectedProjection(first.app);
  await act({ app: first.app, kind: "start", ids: f.ids });
  await act({ app: first.app, kind: "continue", ids: f.ids });
  const p = await selectedProjection(first.app);
  if (p.kind !== "writing") throw Error();
  const token = p.documents.find((d) => d.targetId === "first");
  if (!token) throw Error();
  const strokeId = parseId({ kind: "stroke", value: f.ids() }),
    begin = await inkCommand({
      app: first.app,
      token,
      edit: {
        kind: "begin",
        strokeId,
        layer: "model",
        brush,
        chunks: [chunk()],
      },
      ids: f.ids,
    });
  let lose = false;
  const second = f.connect({
    hook: async (sql, work) => {
      const result = await work();
      if (sql === "COMMIT" && lose) {
        lose = false;
        throw Error("Lost reply");
      }
      return result;
    },
  });
  const opened = await second.app.openRecovery({
    kind: "warm",
    selection: begin.selection,
    retainedStrokeIds: [strokeId],
    teaching: null,
    administration: null,
  });
  lose = true;
  await assert.rejects(
    second.app.recoverInk({ recoveryId: opened.recoveryId, operation: begin }),
    /Lost reply/,
  );
  const third = f.connect();
  const thirdOpen = await third.app.openRecovery({
    kind: "warm",
    selection: begin.selection,
    retainedStrokeIds: [strokeId],
    teaching: null,
    administration: null,
  });
  assert.equal((await selectedProjection(third.app)).kind, "recovery");
  const recovered = await third.app.recoverInk({
    recoveryId: thirdOpen.recoveryId,
    operation: begin,
  });
  assert.equal(recovered.resolution, "applied");
  if (recovered.resolution !== "applied")
    throw Error("Missing recovered checkpoint");
  const tail = await inkCommand({
    app: third.app,
    token: recovered.result.token,
    edit: {
      kind: "finalize",
      strokeId,
      layer: "model",
      status: "interrupted",
      chunks: [chunk({ x: 20, index: 1, first: 1, elapsedMs: 5 })],
    },
    ids: f.ids,
  });
  let loseTail = false;
  const fourth = f.connect({
    hook: async (sql, work) => {
      const result = await work();
      if (sql === "COMMIT" && loseTail) {
        loseTail = false;
        throw Error("Lost tail reply");
      }
      return result;
    },
  });
  const fourthOpen = await fourth.app.openRecovery({
    kind: "warm",
    selection: begin.selection,
    retainedStrokeIds: [strokeId],
    teaching: null,
    administration: null,
  });
  loseTail = true;
  await assert.rejects(
    fourth.app.recoverInk({
      recoveryId: fourthOpen.recoveryId,
      operation: tail,
    }),
    /Lost tail reply/,
  );
  const fifth = f.connect();
  const fifthOpen = await fifth.app.openRecovery({
    kind: "warm",
    selection: begin.selection,
    retainedStrokeIds: [strokeId],
    teaching: null,
    administration: null,
  });
  const finalized = await fifth.app.recoverInk({
    recoveryId: fifthOpen.recoveryId,
    operation: tail,
  });
  assert.equal(finalized.resolution, "applied");
  if (finalized.resolution !== "applied")
    throw Error("Missing recovered finalization");
  assert.equal(finalized.result.kind, "inkCommitted");
  await fifth.app.reconcileRecovery({
    recoveryId: fifthOpen.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [strokeId] },
  });
  const final = await selectedProjection(fifth.app);
  if (final.kind !== "writing") throw Error();
  const finalToken = final.documents.find((d) => d.targetId === "first");
  if (!finalToken) throw Error();
  const snapshot = await selectedInk(fifth.app, { token: finalToken });
  assert.equal(snapshot.strokes.length, 1);
  assert.equal(snapshot.strokes[0]?.pointCount, 2);
  assert.equal(snapshot.strokes[0]?.status, "interrupted");
  assert.equal(
    fifth.db.prepare("SELECT count(*) AS n FROM ink_operation").get()?.n,
    1,
  );
});

test("Skip is a terminal acceptance, retained drawings survive, and completion dominates skipped replay", async (t) => {
  const f = await storageFixture(t, await writingFixture()),
    first = await f.connectReady(),
    app = first.app;
  await selectedProjection(app);
  await act({ app, kind: "start", ids: f.ids });
  await act({ app, kind: "skipWriting", ids: f.ids });
  assert.equal((await selectedProjection(app)).kind, "writingResult");
  assert.equal(
    first.db.prepare("SELECT outcome FROM task_result").get()?.outcome,
    "skipped",
  );
  const reopened = f.connect();
  const inv = await reopened.app.openRecovery({ kind: "cold" });
  await reopened.app.reconcileRecovery({
    recoveryId: inv.recoveryId,
    choice: { kind: "cold" },
  });
  assert.equal((await selectedProjection(reopened.app)).kind, "writingResult");
  await act({ app: reopened.app, kind: "replay", ids: f.ids });
  for (const kind of [
    "continue",
    "continue",
    "confirmTracing",
    "confirmIndependent",
    "continue",
    "confirmTracing",
    "confirmIndependent",
  ] satisfies TeachingIntent["kind"][])
    assert.equal(
      (await act({ app: reopened.app, kind, ids: f.ids })).kind,
      "committed",
    );
  assert.equal((await selectedProjection(reopened.app)).kind, "writingResult");
  assert.equal(
    first.db.prepare("SELECT outcome FROM task_result").get()?.outcome,
    "completed",
  );
  await act({ app: reopened.app, kind: "replay", ids: f.ids });
  await act({ app: reopened.app, kind: "skipWriting", ids: f.ids });
  assert.equal(
    first.db.prepare("SELECT outcome FROM task_result").get()?.outcome,
    "completed",
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    3,
  );
  first.db
    .prepare(
      "UPDATE task_result SET outcome='skipped',accepted_credit_id=(SELECT credit_id FROM task_credit WHERE outcome='skipped' ORDER BY credit_id LIMIT 1)",
    )
    .run();
  assert.equal((await selectedProjection(reopened.app)).kind, "recovery");
});

test("partial ink survives Skip and cold reopen; Resume retains documents and replay allocates new documents", async (t) => {
  const f = await storageFixture(t, await writingFixture()),
    first = await f.connectReady(),
    app = first.app;
  await selectedProjection(app);
  await act({ app, kind: "start", ids: f.ids });
  await act({ app, kind: "continue", ids: f.ids });
  let p = await selectedProjection(app);
  if (p.kind !== "writing") throw Error();
  const originalIds = p.documents.map((d) => d.documentId),
    token = p.documents.find((d) => d.targetId === "first");
  if (!token) throw Error();
  const strokeId = parseId({ kind: "stroke", value: f.ids() }),
    begin = await inkCommand({
      app,
      token,
      edit: {
        kind: "begin",
        strokeId,
        layer: "model",
        brush,
        chunks: [chunk()],
      },
      ids: f.ids,
    });
  const begun = await executeInk(app, begin);
  if (begun.kind !== "inkCommitted") throw Error();
  await executeInk(
    app,
    await inkCommand({
      app,
      token: begun.token,
      edit: {
        kind: "finalize",
        strokeId,
        layer: "model",
        chunks: [],
        status: "interrupted",
      },
      ids: f.ids,
    }),
  );
  await act({ app, kind: "pause", ids: f.ids });
  await act({ app, kind: "resume", ids: f.ids });
  p = await selectedProjection(app);
  if (p.kind !== "writing") throw Error();
  assert.deepEqual(
    p.documents.map((d) => d.documentId),
    originalIds,
  );
  assert.deepEqual(await executeInk(app, begin), begun);
  await act({ app, kind: "skipWriting", ids: f.ids });
  const reopened = f.connect(),
    inventory = await reopened.app.openRecovery({ kind: "cold" });
  await reopened.app.reconcileRecovery({
    recoveryId: inventory.recoveryId,
    choice: { kind: "cold" },
  });
  const terminal = await selectedProjection(reopened.app);
  if (terminal.kind !== "writingResult") throw Error();
  assert.equal(terminal.outcome, "skipped");
  const old = terminal.documents.find((d) => d.targetId === "first");
  if (!old) throw Error();
  const retained = await selectedInk(reopened.app, { token: old });
  assert.equal(retained.strokes[0]?.pointCount, 1);
  assert.equal(retained.writable, false);
  await act({ app: reopened.app, kind: "replay", ids: f.ids });
  const replay = await selectedProjection(reopened.app);
  if (replay.kind !== "writing") throw Error();
  assert.equal(
    replay.documents.some((d) => originalIds.includes(d.documentId)),
    false,
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM ink_document").get()?.n,
    4,
  );
});

test("cold recovery removes empty captures, interrupts committed points once, and rejects corrupt bytes", async (t) => {
  const f = await storageFixture(t, await writingFixture()),
    first = await f.connectReady();
  await selectedProjection(first.app);
  await act({ app: first.app, kind: "start", ids: f.ids });
  await act({ app: first.app, kind: "continue", ids: f.ids });
  let p = await selectedProjection(first.app);
  if (p.kind !== "writing") throw Error();
  let token = p.documents.find((d) => d.targetId === "first");
  if (!token) throw Error();
  await executeInk(
    first.app,
    await inkCommand({
      app: first.app,
      token,
      edit: {
        kind: "begin",
        strokeId: parseId({ kind: "stroke", value: f.ids() }),
        layer: "model",
        brush,
        chunks: [],
      },
      ids: f.ids,
    }),
  );
  const second = f.connect(),
    opening = await second.app.openRecovery({ kind: "cold" });
  assert.equal(opening.captures[0]?.pointCount, 0);
  await second.app.reconcileRecovery({
    recoveryId: opening.recoveryId,
    choice: { kind: "cold" },
  });
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM ink_stroke").get()?.n,
    0,
  );
  p = await selectedProjection(second.app);
  if (p.kind !== "writing") throw Error();
  token = p.documents.find((d) => d.targetId === "first");
  if (!token) throw Error();
  const strokeId = parseId({ kind: "stroke", value: f.ids() });
  await executeInk(
    second.app,
    await inkCommand({
      app: second.app,
      token,
      edit: {
        kind: "begin",
        strokeId,
        layer: "model",
        brush,
        chunks: [chunk()],
      },
      ids: f.ids,
    }),
  );
  for (let i = 0; i < 2; i++) {
    const next = f.connect(),
      open = await next.app.openRecovery({ kind: "cold" });
    await next.app.reconcileRecovery({
      recoveryId: open.recoveryId,
      choice: { kind: "cold" },
    });
  }
  assert.equal(
    first.db.prepare("SELECT status FROM ink_stroke").get()?.status,
    "interrupted",
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM ink_operation").get()?.n,
    1,
  );
  const corrupt = new Uint8Array(16);
  new DataView(corrupt.buffer).setFloat32(0, NaN, true);
  first.db.prepare("UPDATE ink_point_chunk SET payload=?").run(corrupt);
  const before = await databaseSnapshot(first.db),
    attempts: string[] = [];
  const failed = f.connect({
    hook: async (sql, work) => {
      attempts.push(sql);
      return work();
    },
  });
  await assert.rejects(
    failed.app.openRecovery({ kind: "cold" }),
    /Invalid canonical ink point/,
  );
  await assert.rejects(
    selectedProjection(failed.app),
    /Invalid canonical ink point/,
  );
  assert.ok(attempts.length > 0);
  assert.ok(attempts.every(isReadOnlySqlAttempt));
  assert.deepEqual(await databaseSnapshot(failed.db), before);
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM ink_stroke").get()?.n,
    1,
  );
});

test("cross binding, layer, chunk order and unclosed recovery reject without writes", async (t) => {
  const f = await storageFixture(t, await writingFixture()),
    first = await f.connectReady(),
    app = first.app;
  await selectedProjection(app);
  await act({ app, kind: "start", ids: f.ids });
  await act({ app, kind: "continue", ids: f.ids });
  const p = await selectedProjection(app);
  if (p.kind !== "writing") throw Error();
  const token = p.documents.find((d) => d.targetId === "first"),
    inactive = p.documents.find((d) => d.targetId === "second");
  if (!token || !inactive) throw Error();
  const strokeId = parseId({ kind: "stroke", value: f.ids() }),
    edit = {
      kind: "begin",
      strokeId,
      layer: "model",
      brush,
      chunks: [chunk()],
    } satisfies InkEdit;
  for (const changed of [
    { ...token, profileId: parseId({ kind: "profile", value: "other" }) },
    { ...token, runId: parseId({ kind: "run", value: "other" }) },
    { ...token, targetId: inactive.targetId },
  ]) {
    const candidate = await inkCommand({
      app,
      token: changed,
      edit,
      ids: f.ids,
    });
    assert.equal((await executeInk(app, candidate)).kind, "rejected");
  }
  assert.equal(
    (
      await executeInk(
        app,
        await inkCommand({
          app,
          token: { ...token, inputEpoch: parseCounter("99") },
          edit,
          ids: f.ids,
        }),
      )
    ).kind,
    "rejected",
  );
  assert.equal(
    (
      await executeInk(
        app,
        await inkCommand({ app, token: inactive, edit, ids: f.ids }),
      )
    ).kind,
    "rejected",
  );
  assert.equal(
    (
      await executeInk(
        app,
        await inkCommand({
          app,
          token,
          edit: { ...edit, layer: "tracing" },
          ids: f.ids,
        }),
      )
    ).kind,
    "rejected",
  );
  assert.equal(
    (
      await executeInk(
        app,
        await inkCommand({
          app,
          token,
          edit: { ...edit, chunks: [chunk({ index: 1 })] },
          ids: f.ids,
        }),
      )
    ).kind,
    "rejected",
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM ink_stroke").get()?.n,
    0,
  );
  const selection = (await app.readDirectory()).selection;
  const inventory = await app.openRecovery({
    kind: "warm",
    selection,
    retainedStrokeIds: [strokeId],
    teaching: null,
    administration: null,
  });
  assert.equal(
    (await executeInk(app, await inkCommand({ app, token, edit, ids: f.ids })))
      .kind,
    "rejected",
  );
  assert.equal((await selectedProjection(app)).kind, "recovery");
  await assert.rejects(
    app.reconcileRecovery({
      recoveryId: inventory.recoveryId,
      choice: { kind: "warm", settledStrokeIds: [] },
    }),
  );
  const begun = await app.recoverInk({
    recoveryId: inventory.recoveryId,
    operation: await inkCommand({ app, token, edit, ids: f.ids }),
  });
  assert.equal(begun.resolution, "applied");
  if (begun.resolution !== "applied") throw Error("Missing recovered capture");
  await assert.rejects(
    app.reconcileRecovery({
      recoveryId: inventory.recoveryId,
      choice: { kind: "warm", settledStrokeIds: [strokeId] },
    }),
    /still requires/,
  );
  const finalized = await app.recoverInk({
    recoveryId: inventory.recoveryId,
    operation: await inkCommand({
      app,
      token: begun.result.token,
      edit: {
        kind: "finalize",
        strokeId,
        layer: "model",
        chunks: [],
        status: "interrupted",
      },
      ids: f.ids,
    }),
  });
  assert.equal(finalized.resolution, "applied");
  if (finalized.resolution !== "applied")
    throw Error("Missing settled capture");
  assert.equal(finalized.result.kind, "inkCommitted");
  await app.reconcileRecovery({
    recoveryId: inventory.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [strokeId] },
  });
});

test("real checkpoint and finalization write faults roll back; immutable Retry converges", async (t) => {
  const f = await storageFixture(t, await writingFixture());
  let failPattern: RegExp | null = null;
  const first = await f.connectReady({
      hook: async (sql, work) => {
        if (failPattern?.test(sql)) {
          failPattern = null;
          throw Error("Injected ink write");
        }
        return work();
      },
    }),
    app = first.app;
  await selectedProjection(app);
  await act({ app, kind: "start", ids: f.ids });
  await act({ app, kind: "continue", ids: f.ids });
  const p = await selectedProjection(app);
  if (p.kind !== "writing") throw Error();
  const token = p.documents.find((d) => d.targetId === "first");
  if (!token) throw Error();
  const strokeId = parseId({ kind: "stroke", value: f.ids() }),
    begin = await executeInk(
      app,
      await inkCommand({
        app,
        token,
        edit: {
          kind: "begin",
          strokeId,
          layer: "model",
          brush,
          chunks: [chunk()],
        },
        ids: f.ids,
      }),
    );
  if (begin.kind !== "inkCommitted") throw Error();
  const checkpoint = await inkCommand({
    app,
    token: begin.token,
    edit: {
      kind: "checkpoint",
      strokeId,
      layer: "model",
      chunks: [chunk({ index: 1, first: 1, elapsedMs: 5 })],
    },
    ids: f.ids,
  });
  failPattern = /insert into "ink_point_chunk"/;
  await assert.rejects(executeInk(app, checkpoint), /Failed query/);
  assert.equal(
    first.db.prepare("SELECT point_count FROM ink_stroke").get()?.point_count,
    1,
  );
  const checkpointReceipt = await executeInk(app, checkpoint);
  if (checkpointReceipt.kind !== "inkCommitted") throw Error();
  const final = await inkCommand({
    app,
    token: checkpointReceipt.token,
    edit: {
      kind: "finalize",
      strokeId,
      layer: "model",
      chunks: [],
      status: "finished",
    },
    ids: f.ids,
  });
  failPattern = /insert into "ink_operation"/;
  await assert.rejects(executeInk(app, final), /Failed query/);
  assert.equal(
    first.db.prepare("SELECT status FROM ink_stroke").get()?.status,
    "capturing",
  );
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM ink_operation").get()?.n,
    0,
  );
  assert.equal((await executeInk(app, final)).kind, "inkCommitted");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM ink_operation").get()?.n,
    1,
  );
});

test("130 real finalized strokes compact oldest applied origins and prune stale command receipts", async (t) => {
  const f = await storageFixture(t, await writingFixture()),
    first = await f.connectReady(),
    app = first.app;
  await selectedProjection(app);
  await act({ app, kind: "start", ids: f.ids });
  await act({ app, kind: "continue", ids: f.ids });
  const p = await selectedProjection(app);
  if (p.kind !== "writing") throw Error();
  let token = p.documents.find((d) => d.targetId === "first");
  if (!token) throw Error();
  let firstCommand: SelectedInkOperation | undefined;
  for (let i = 0; i < 130; i++) {
    const strokeId = parseId({ kind: "stroke", value: f.ids() }),
      command = await inkCommand({
        app,
        token,
        edit: {
          kind: "begin",
          strokeId,
          layer: "model",
          brush,
          chunks: [chunk()],
        },
        ids: f.ids,
      });
    firstCommand ??= command;
    const begin = await executeInk(app, command);
    if (begin.kind !== "inkCommitted") throw Error();
    const end = await executeInk(
      app,
      await inkCommand({
        app,
        token: begin.token,
        edit: {
          kind: "finalize",
          strokeId,
          layer: "model",
          chunks: [],
          status: "finished",
        },
        ids: f.ids,
      }),
    );
    if (end.kind !== "inkCommitted") throw Error();
    token = end.token;
  }
  const snapshot = await selectedInk(app, { token });
  assert.equal(snapshot.strokes.length, 130);
  const history = snapshot.histories.find((h) => h.layer === "model");
  if (!history) throw Error();
  assert.equal(history.baseline.length, 2);
  assert.equal(history.operations.length, 128);
  assert.equal(history.baseSeq, "2");
  assert.equal(history.tipSeq, "130");
  assert.equal(
    first.db
      .prepare(
        "SELECT count(*) AS n FROM command_receipt WHERE scope_kind='document'",
      )
      .get()?.n,
    256,
  );
  if (!firstCommand) throw Error();
  assert.equal((await executeInk(app, firstCommand)).kind, "rejected");
});

test("new writing activation changes only Task6 availability while preserving five bodies, pins and action kinds", async (t) => {
  const previous = await parseDevelopmentPackage(
    JSON.parse(
      await readFile(
        "tests/fixtures/continuous-development-package.json",
        "utf8",
      ),
    ),
    hash,
  );
  if (previous.body.coverage !== "lesson1-sounds-oral-complete") throw Error();
  const synthetic = await writingFixture();
  if (synthetic.body.coverage !== "lesson1-complete") throw Error();
  const source = synthetic.body.tasks[0],
    metadata = previous.body.lessonTasks.find((t) => t.number === 6);
  if (source?.kind !== "soundWritingV1" || !metadata) throw Error();
  const body = {
    ...previous.body,
    coverage: "lesson1-complete",
    releaseId: "fixture.writing.cumulative",
    tasks: [
      ...previous.body.tasks,
      {
        kind: "soundWritingV1",
        task: { ...source.task, id: metadata.id, title: metadata.title },
      },
    ],
  };
  const candidate = await parseDevelopmentPackage(
    { formatVersion: 1, packageHash: await hash(canonical(body)), body },
    hash,
  );
  const f = await storageFixture(t, previous),
    first = await f.connectReady();
  await selectedProjection(first.app);
  await act({ app: first.app, kind: "start", ids: f.ids });
  const before = await selectedProjection(first.app);
  if (before.kind !== "teaching") throw Error();
  const bytes = first.db
    .prepare(
      "SELECT verified_manifest FROM installed_package WHERE package_hash=?",
    )
    .get(previous.packageHash)?.verified_manifest;
  const upgraded = f.connect({ content: candidate }),
    after = await selectedProjection(upgraded.app);
  if (after.kind !== "teaching") throw Error();
  assert.equal(after.packageHash, previous.packageHash);
  assert.equal(after.runId, before.runId);
  assert.deepEqual(after.turn, before.turn);
  assert.deepEqual(
    after.actions
      .filter((a) => !("taskId" in a.intent) || a.intent.taskId !== metadata.id)
      .map((a) => [a.label, a.intent.kind]),
    before.actions.map((a) => [a.label, a.intent.kind]),
  );
  assert.equal(
    after.actions.some((a) => a.label.text === "Start full task"),
    false,
  );
  assert.equal(after.catalog.find((t) => t.number === 6)?.available, true);
  assert.equal(
    after.catalog.every((t) => t.packageHash === candidate.packageHash),
    true,
  );
  assert.deepEqual(
    first.db
      .prepare(
        "SELECT verified_manifest FROM installed_package WHERE package_hash=?",
      )
      .get(previous.packageHash)?.verified_manifest,
    bytes,
  );
  if (candidate.body.coverage !== "lesson1-complete") throw Error();
  assert.deepEqual(candidate.body.tasks.slice(0, 5), previous.body.tasks);
});

test("all nested wire counters enforce signed64 before use", async (t) => {
  const f = await storageFixture(t, await writingFixture()),
    first = await f.connectReady();
  await selectedProjection(first.app);
  await act({ app: first.app, kind: "start", ids: f.ids });
  const p = await selectedProjection(first.app);
  if (p.kind !== "writing") throw Error();
  const token = p.documents[0];
  if (!token) throw Error();
  const bad = "9223372036854775808";
  assert.throws(
    () =>
      parseProjection({
        ...p,
        documents: [{ ...token, inputEpoch: bad }, p.documents[1]],
      }),
    /signed-64/,
  );
  const snapshot = await selectedInk(first.app, { token });
  assert.throws(
    () => parseInkSnapshot({ ...snapshot, nextStrokeOrder: bad }),
    /signed-64/,
  );
  assert.throws(
    () =>
      parseInkSnapshot({
        ...snapshot,
        histories: snapshot.histories.map((h) => ({ ...h, tipSeq: bad })),
      }),
    /signed-64/,
  );
  assert.throws(
    () =>
      parseRecoveryInventory({
        kind: "closed",
        recoveryId: "recovery",
        captures: [
          {
            token: { ...token, revision: bad },
            strokeId: "stroke",
            layer: "model",
            pointCount: 0,
            nextChunkIndex: 0,
          },
        ],
      }),
    /signed-64/,
  );
  const action = p.actions.find((a) => a.intent.kind === "continue");
  if (!action) throw Error();
  const command = await prepareSelectedTeaching(first.app, async () =>
    prepareWritingCommand({
      projection: p,
      action,
      barrier: { kind: "writing", documents: p.documents },
      ids: f.ids,
      hash,
    }),
  );
  const inner = command.command;
  if (inner.kind !== "writingNavigate") throw Error();
  assert.throws(
    () =>
      parseCommand({
        ...inner,
        payload: {
          ...inner.payload,
          barrier: {
            kind: "writing",
            documents: inner.payload.barrier.documents.map((d) => ({
              ...d,
              revision: bad,
            })),
          },
        },
      }),
    /signed-64/,
  );
});

test("completed writing retains all six target-owned layers through cold reopen and Back reconfirmation", async (t) => {
  const f = await storageFixture(t, await writingFixture()),
    first = await f.connectReady(),
    app = first.app;
  await selectedProjection(app);
  await act({ app, kind: "start", ids: f.ids });
  await act({ app, kind: "continue", ids: f.ids });
  for (const kind of [
    "continue",
    "confirmTracing",
    "confirmIndependent",
    "continue",
    "confirmTracing",
    "confirmIndependent",
  ] satisfies TeachingIntent["kind"][]) {
    const p = await selectedProjection(app);
    if (p.kind !== "writing") throw Error();
    let writable: DocumentToken | undefined;
    for (const token of p.documents)
      if ((await selectedInk(app, { token })).writable) writable = token;
    if (!writable) throw Error();
    const layer =
        writable.phase === "parentDemonstration"
          ? "model"
          : writable.phase === "childTracing"
            ? "tracing"
            : "independent",
      strokeId = parseId({ kind: "stroke", value: f.ids() }),
      begin = await executeInk(
        app,
        await inkCommand({
          app,
          token: writable,
          edit: {
            kind: "begin",
            strokeId,
            layer,
            brush: {
              ...brush,
              colorRole: layer === "model" ? "model" : "child",
            },
            chunks: [chunk()],
          },
          ids: f.ids,
        }),
      );
    if (begin.kind !== "inkCommitted") throw Error();
    await executeInk(
      app,
      await inkCommand({
        app,
        token: begin.token,
        edit: {
          kind: "finalize",
          strokeId,
          layer,
          chunks: [],
          status: "finished",
        },
        ids: f.ids,
      }),
    );
    assert.equal((await act({ app, kind, ids: f.ids })).kind, "committed");
  }
  const reopened = f.connect(),
    opening = await reopened.app.openRecovery({ kind: "cold" });
  await reopened.app.reconcileRecovery({
    recoveryId: opening.recoveryId,
    choice: { kind: "cold" },
  });
  const terminal = await selectedProjection(reopened.app);
  if (terminal.kind !== "writingResult") throw Error();
  assert.equal(terminal.outcome, "completed");
  for (const token of terminal.documents) {
    const snapshot = await selectedInk(reopened.app, { token });
    assert.deepEqual(
      snapshot.strokes.map((s) => s.layer),
      ["model", "tracing", "independent"],
    );
    assert.equal(snapshot.writable, false);
  }
  await act({ app: reopened.app, kind: "back", ids: f.ids });
  const review = await selectedProjection(reopened.app);
  if (review.kind !== "writing") throw Error();
  for (const token of review.documents)
    assert.equal((await selectedInk(reopened.app, { token })).writable, false);
  await act({ app: reopened.app, kind: "continue", ids: f.ids });
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    7,
  );
});

test("skipped Back inspects preserved practice without accepting or reopening input", async (t) => {
  const f = await storageFixture(t, await writingFixture()),
    first = await f.connectReady(),
    app = first.app;
  await selectedProjection(app);
  await act({ app, kind: "start", ids: f.ids });
  await act({ app, kind: "continue", ids: f.ids });
  await act({ app, kind: "skipWriting", ids: f.ids });
  await act({ app, kind: "back", ids: f.ids });
  const p = await selectedProjection(app);
  if (p.kind !== "writing") throw Error();
  assert.equal(p.runStatus, "skipped");
  for (const token of p.documents)
    assert.equal((await selectedInk(app, { token })).writable, false);
  await act({ app, kind: "continue", ids: f.ids });
  const terminal = await selectedProjection(app);
  if (terminal.kind !== "writingResult") throw Error();
  assert.equal(terminal.outcome, "skipped");
  assert.equal(
    first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
    2,
  );
  const reopened = f.connect(),
    opening = await reopened.app.openRecovery({ kind: "cold" });
  await reopened.app.reconcileRecovery({
    recoveryId: opening.recoveryId,
    choice: { kind: "cold" },
  });
  assert.equal((await selectedProjection(reopened.app)).kind, "writingResult");
});

test("reopen rejects rehashed writing acceptance that drops its writing tag or crosses document bindings", async (t) => {
  for (const mutation of ["ordinary", "cross-document"]) {
    const f = await storageFixture(t, await writingFixture()),
      first = await f.connectReady(),
      app = first.app;
    await selectedProjection(app);
    await act({ app, kind: "start", ids: f.ids });
    await act({ app, kind: "continue", ids: f.ids });
    const row = first.db
      .prepare("SELECT advance_id,accepting_command FROM task_advance")
      .get();
    if (
      !row ||
      typeof row.accepting_command !== "string" ||
      typeof row.advance_id !== "string"
    )
      throw Error();
    const semantics: unknown = JSON.parse(row.accepting_command);
    if (
      typeof semantics !== "object" ||
      semantics === null ||
      !("payload" in semantics) ||
      !("kind" in semantics)
    )
      throw Error();
    const projection = await selectedProjection(app);
    if (projection.kind !== "writing") throw Error();
    const initial = projection.documents;
    const original = parseCommand({
      ...semantics,
      commandId: "retained",
      owner: projection.owner,
      scope: {
        kind: "session",
        id: projection.sessionId,
        generation: projection.owner.generation,
      },
      expectedRevision: "0",
      payloadHash: await hash(canonical(semantics)),
    });
    if (original.kind !== "writingNavigate") throw Error();
    const firstToken = original.payload.barrier.documents[0];
    if (!firstToken) throw Error();
    const other = initial.find((d) => d.documentId !== firstToken.documentId);
    if (!other) throw Error();
    const { barrier, ...ordinaryPayload } = original.payload;
    const source =
      mutation === "ordinary"
        ? { kind: "navigate", payload: ordinaryPayload }
        : {
            kind: "writingNavigate",
            payload: {
              ...original.payload,
              barrier: {
                kind: "writing",
                documents: barrier.documents.map((token, i) =>
                  i === 0 ? { ...token, documentId: other.documentId } : token,
                ),
              },
            },
          };
    first.db
      .prepare(
        "UPDATE task_advance SET accepting_command=?,payload_hash=? WHERE advance_id=?",
      )
      .run(canonical(source), await hash(canonical(source)), row.advance_id);
    const before = await databaseSnapshot(first.db),
      attempts: string[] = [];
    const reopened = f.connect({
      hook: async (sql, work) => {
        attempts.push(sql);
        return work();
      },
    });
    await assert.rejects(
      selectedProjection(reopened.app),
      /Writing acceptance (?:requires its document barrier|document set changed|document binding changed)/,
    );
    await assert.rejects(
      reopened.app.openRecovery({ kind: "cold" }),
      /Writing acceptance (?:requires its document barrier|document set changed|document binding changed)/,
    );
    assert.ok(attempts.length > 0);
    assert.ok(attempts.every(isReadOnlySqlAttempt));
    assert.deepEqual(await databaseSnapshot(reopened.db), before);
    assert.equal(
      first.db.prepare("SELECT count(*) AS n FROM task_advance").get()?.n,
      1,
    );
  }
});
