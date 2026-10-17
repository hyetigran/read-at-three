import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  parseId,
  encodeInkPoints,
  prepareInkCommand,
  prepareWritingControl,
  parseCommand,
} from "@readatthree/teaching";
import { hash } from "./support.ts";
import { practiceFixture } from "./practice-support.ts";

for (const boundary of [
  "history",
  "collection",
  "receipt",
  "beforeCommit",
  "afterCommit",
]) {
  test(`practice ${boundary} fault preserves geometry and teaching rows, exact Retry commits once`, async (t) => {
    const f = await practiceFixture(t);
    let armed = false;
    const connection = f.connect({
      hook: async (sql, work) => {
        const matches =
          boundary === "history"
            ? sql.startsWith('delete from "ink_operation"')
            : boundary === "collection"
              ? sql.startsWith('delete from "ink_point_chunk"')
              : boundary === "receipt"
                ? sql.startsWith('insert into "command_receipt"')
                : sql === "COMMIT";
        if (armed && matches) {
          armed = false;
          if (boundary === "afterCommit") await work();
          throw new Error("Injected control boundary");
        }
        return work();
      },
    });
    const { app, db } = connection;
    const model = await f.start(app),
      first = await f.draw(app, 100),
      second = await f.draw(app, 200);
    const protectedRows = () =>
      [
        "task_run",
        "task_advance",
        "task_credit",
        "task_result",
        "profile",
        "course_cursor",
      ].map((table) => canonical(db.prepare(`SELECT * FROM ${table}`).all()));
    const beforeTeaching = protectedRows();
    await app.dispatch(await f.prepareControl(app, { kind: "inkUndo" }));
    const command = await f.prepareControl(app, { kind: "clearPractice" });
    if (boundary === "collection") {
      const old = await f.current(app);
      const history = old.snapshot.histories.find(
        (value) => value.layer === "tracing",
      );
      assert.equal(history?.cursorSeq, "1");
    }
    armed = true;
    await assert.rejects(app.dispatch(command), /Injected|Failed query/);
    assert.deepEqual(protectedRows(), beforeTeaching);
    assert.deepEqual(
      await f.visible(app),
      boundary === "afterCommit" ? [] : [first],
    );
    const result = await app.dispatch(command);
    assert.equal(result.kind, "committed");
    assert.deepEqual(await app.dispatch(command), result);
    assert.deepEqual(await f.visible(app), []);
    const saved = await f.current(app);
    assert.deepEqual(
      saved.snapshot.strokes.map((value) => value.strokeId),
      [model, first],
    );
    assert.equal(
      saved.snapshot.strokes.some((value) => value.strokeId === second),
      false,
    );
    assert.deepEqual(protectedRows(), beforeTeaching);
    assert.equal(
      db
        .prepare(
          "SELECT count(*) AS count FROM ink_operation WHERE kind='ClearPractice'",
        )
        .get()?.count,
      1,
    );
    const cold = f.connect().app,
      inventory = await cold.openRecovery({ kind: "cold" });
    await cold.reconcileRecovery({
      recoveryId: inventory.recoveryId,
      choice: { kind: "cold" },
    });
    assert.deepEqual(await f.visible(cold), []);
    await cold.dispatch(await f.prepareControl(cold, { kind: "inkUndo" }));
    assert.deepEqual(await f.visible(cold), [first]);
    await f.action(cold, "confirmTracing");
    await f.action(cold, "back");
    const earlier = await f.current(cold);
    assert.equal(earlier.snapshot.writable, false);
    assert.deepEqual(await f.visible(cold), [first]);
  });
}

test("Clear compaction collects only unreachable geometry, rolls back after actual collection, and reopens its baseline", async (t) => {
  const f = await practiceFixture(t);
  let armed = false;
  const { app, db } = f.connect({
    hook: async (sql, work) => {
      const result = await work();
      if (armed && sql.startsWith('delete from "ink_point_chunk"')) {
        armed = false;
        throw new Error("Injected after compaction collection");
      }
      return result;
    },
  });
  const model = await f.start(app),
    first = await f.draw(app, 100);
  await app.dispatch(await f.prepareControl(app, { kind: "clearPractice" }));
  for (let index = 0; index < 127; index++) await f.draw(app, 200 + index);
  const before = await f.current(app),
    history = before.snapshot.histories.find(
      (value) => value.layer === "tracing",
    );
  assert.deepEqual(
    {
      base: history?.baseSeq,
      count: history?.operations.length,
      first: history?.operations[0]?.kind,
    },
    { base: "1", count: 128, first: "ClearPractice" },
  );
  const strokeId = parseId({ kind: "stroke", value: f.ids() });
  const chunk = {
    chunkIndex: 0,
    firstPointIndex: 0,
    pointCount: 1,
    codecVersion: 1,
    payload: [
      ...encodeInkPoints({
        bounds: before.snapshot.bounds,
        points: [{ x: 900, y: 100, elapsedMs: 0 }],
      }),
    ],
  } satisfies import("@readatthree/teaching").InkChunk;
  const token = await f.edit(app, before.token, {
    kind: "begin",
    strokeId,
    layer: "tracing",
    brush: {
      kind: "round",
      width: 5,
      colorRole: "child",
      cap: "round",
      join: "round",
    },
    chunks: [chunk],
  });
  const capture = (await f.current(app)).snapshot;
  const finish = await prepareInkCommand({
    token,
    edit: {
      kind: "finalize",
      strokeId,
      layer: "tracing",
      chunks: [],
      status: "finished",
    },
    ids: f.ids,
    hash: hash,
  });
  armed = true;
  await assert.rejects(app.dispatchInk(finish), /Failed query/);
  assert.equal(canonical((await f.current(app)).snapshot), canonical(capture));
  assert.equal((await app.dispatchInk(finish)).kind, "inkCommitted");
  const saved = (await f.current(app)).snapshot,
    compacted = saved.histories.find((value) => value.layer === "tracing");
  assert.deepEqual(
    {
      base: compacted?.baseSeq,
      baseline: compacted?.baseline,
      count: compacted?.operations.length,
    },
    { base: "2", baseline: [], count: 128 },
  );
  assert.equal(
    saved.strokes.some((value) => value.strokeId === first),
    false,
  );
  assert.equal(
    saved.strokes.filter((value) => value.layer === "model")[0]?.strokeId,
    model,
  );
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS count FROM ink_point_chunk WHERE stroke_id=?",
      )
      .get(first)?.count,
    0,
  );
  const reopened = f.connect().app,
    inventory = await reopened.openRecovery({ kind: "cold" });
  await reopened.reconcileRecovery({
    recoveryId: inventory.recoveryId,
    choice: { kind: "cold" },
  });
  assert.deepEqual((await f.current(reopened)).snapshot.strokes, saved.strokes);
  assert.deepEqual(
    (await f.current(reopened)).snapshot.histories,
    saved.histories,
  );
});

test("empty begin retains redo, first nonempty checkpoint discards it and cold orphan recovery adds once", async (t) => {
  const f = await practiceFixture(t),
    { app } = f.connect();
  await f.start(app);
  const first = await f.draw(app, 100),
    second = await f.draw(app, 200);
  await app.dispatch(await f.prepareControl(app, { kind: "inkUndo" }));
  const before = await f.current(app);
  const strokeId = parseId({ kind: "stroke", value: f.ids() });
  const token = await f.edit(app, before.token, {
    kind: "begin",
    strokeId,
    layer: "tracing",
    brush: {
      kind: "round",
      width: 5,
      colorRole: "child",
      cap: "round",
      join: "round",
    },
    chunks: [],
  });
  assert.equal(
    (await f.current(app)).snapshot.histories.find(
      (value) => value.layer === "tracing",
    )?.tipSeq,
    "2",
  );
  await f.edit(app, token, {
    kind: "checkpoint",
    strokeId,
    layer: "tracing",
    chunks: [
      {
        chunkIndex: 0,
        firstPointIndex: 0,
        pointCount: 1,
        codecVersion: 1,
        payload: [
          ...encodeInkPoints({
            bounds: before.snapshot.bounds,
            points: [{ x: 300, y: 100, elapsedMs: 0 }],
          }),
        ],
      },
    ],
  });
  assert.equal(
    (await f.current(app)).snapshot.strokes.some(
      (value) => value.strokeId === second,
    ),
    false,
  );
  for (let open = 0; open < 2; open++) {
    const cold = f.connect(),
      inventory = await cold.app.openRecovery({ kind: "cold" });
    await cold.app.reconcileRecovery({
      recoveryId: inventory.recoveryId,
      choice: { kind: "cold" },
    });
    assert.deepEqual(await f.visible(cold.app), [first, strokeId]);
    assert.equal(
      cold.db
        .prepare(
          "SELECT count(*) AS count FROM ink_operation WHERE origin_stroke_id=?",
        )
        .get(strokeId)?.count,
      1,
    );
    assert.equal(
      (await f.current(cold.app)).snapshot.strokes.find(
        (value) => value.strokeId === strokeId,
      )?.status,
      "interrupted",
    );
  }
});

test("wrong layer, other target, accepted Back and terminal practice controls change no saved rows", async (t) => {
  const f = await practiceFixture(t),
    { app, db } = f.connect();
  await f.start(app);
  await f.draw(app, 100);
  async function attempt(
    target: "first" | "second",
    layer: "tracing" | "independent",
  ) {
    const { projection } = await f.current(app),
      token = projection.documents.find((value) => value.targetId === target);
    if (!token) throw new Error("Target missing");
    const command = await prepareWritingControl({
      projection,
      documentId: token.documentId,
      layer,
      control: { kind: "clearPractice" },
      barrier: { kind: "writing", documents: projection.documents },
      ids: f.ids,
      hash,
    });
    const before = canonical(db.prepare("SELECT * FROM task_run").all()),
      snapshot = (await f.current(app)).snapshot;
    assert.equal((await app.dispatch(command)).kind, "rejected");
    assert.equal(canonical(db.prepare("SELECT * FROM task_run").all()), before);
    assert.deepEqual((await f.current(app)).snapshot, snapshot);
    return command;
  }
  await attempt("first", "independent");
  await attempt("second", "tracing");
  await f.action(app, "confirmTracing");
  await f.action(app, "back");
  await attempt("first", "tracing");
  await f.action(app, "continue");
  const retained = await f.prepareControl(app, { kind: "clearPractice" });
  await f.action(app, "skipWriting");
  const terminal = await app.read();
  if (terminal.kind !== "writingResult")
    throw new Error("Terminal result required");
  const payload = {
    ...retained.payload,
    barrier: { kind: "writing", documents: terminal.documents },
  };
  const command = parseCommand({
    ...retained,
    commandId: f.ids(),
    expectedRevision: terminal.revision,
    payload,
    payloadHash: await hash(canonical({ kind: "writingControl", payload })),
  });
  const before = canonical(db.prepare("SELECT * FROM task_credit").all());
  assert.equal((await app.dispatch(command)).kind, "rejected");
  assert.equal(
    canonical(db.prepare("SELECT * FROM task_credit").all()),
    before,
  );
});

test(
  "a valid near-bound document rejects Clear before any write because reversible IDs need storage",
  { timeout: 120000 },
  async (t) => {
    const f = await practiceFixture(t);
    let armed = false,
      writes = 0;
    const { app, db } = f.connect({
      hook: async (sql, work) => {
        if (
          armed &&
          /^(insert|update|delete|replace|alter|drop|create)\b/i.test(sql)
        )
          writes++;
        return work();
      },
    });
    await f.start(app);
    const { token } = await f.current(app);
    const count = 40000,
      strokeIds = Array.from(
        { length: count },
        (_, index) =>
          `stroke-${String(index).padStart(5, "0")}-` + "x".repeat(187),
      );
    const brush = canonical({
      kind: "round",
      width: 5,
      colorRole: "child",
      cap: "round",
      join: "round",
    });
    const insertStroke = db.prepare(
      "INSERT INTO ink_stroke(stroke_id,document_id,layer,stroke_order,status,codec_version,brush_version,brush,point_count) VALUES(?,?,'tracing',?,'finished',1,1,?,1)",
    );
    const insertChunk = db.prepare(
      "INSERT INTO ink_point_chunk(stroke_id,chunk_index,first_point_index,point_count,codec_version,payload) VALUES(?,0,0,1,1,?)",
    );
    db.exec("BEGIN IMMEDIATE");
    for (const [index, id] of strokeIds.entries()) {
      insertStroke.run(id, token.documentId, index + 1, brush);
      insertChunk.run(id, new Uint8Array(16));
    }
    db.prepare(
      "UPDATE ink_history SET baseline=?,base_seq=?,cursor_seq=?,tip_seq=?,next_op_seq=? WHERE document_id=? AND layer='tracing'",
    ).run(
      canonical(strokeIds),
      count,
      count,
      count,
      count + 1,
      token.documentId,
    );
    db.prepare(
      "UPDATE ink_document SET next_stroke_order=? WHERE document_id=?",
    ).run(count + 1, token.documentId);
    db.exec("COMMIT");
    const before = await app.readInk({ token }),
      command = await f.prepareControl(app, { kind: "clearPractice" });
    assert.equal(before.strokes.length, 40001);
    const beforeHash = await hash(canonical(before));
    armed = true;
    const result = await app.dispatch(command);
    armed = false;
    assert.deepEqual(result, {
      kind: "rejected",
      code: "invalid-control",
      message: "Practice control is unavailable at this saved position.",
    });
    assert.equal(writes, 0);
    assert.equal(
      await hash(canonical(await app.readInk({ token }))),
      beforeHash,
    );
  },
);
