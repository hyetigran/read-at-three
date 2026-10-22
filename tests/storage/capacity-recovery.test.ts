import assert from "node:assert/strict";
import { test } from "node:test";
import { storageFixture, hash, databaseSnapshot } from "./support.ts";
import {
  executeTeaching,
  prepareSelectedTeaching,
  selectedProjection,
  executeInk,
  prepareSelectedInk,
  selectedInk,
} from "./selected-support.ts";
import {
  prepareCommand,
  prepareWritingCommand,
  prepareInkCommand,
  parseId,
  encodeInkPoints,
} from "../../packages/teaching/src/index.ts";
import { writingFixture } from "../teaching/writing-fixture.ts";

function sqliteFull(error: unknown): boolean {
  const seen = new Set<unknown>();
  while (error instanceof Error && !seen.has(error)) {
    seen.add(error);
    if ("errcode" in error && error.errcode === 13) return true;
    error = error.cause;
  }
  return false;
}

test("real SQLite capacity refusal preserves acknowledged ink and retries the retained checkpoint once", async (t) => {
  const f = await storageFixture(t, await writingFixture());
  const { app, db } = await f.connectReady();
  await f.act(app, "start");
  const initial = await selectedProjection(app);
  assert.equal(initial.kind, "writing");
  if (initial.kind !== "writing") throw new Error("Expected writing");
  const action = initial.actions.find(
    (item) => item.intent.kind === "continue",
  );
  assert.ok(action);
  await executeTeaching(
    app,
    await prepareSelectedTeaching(app, async () =>
      prepareWritingCommand({
        projection: initial,
        action,
        barrier: { kind: "writing", documents: initial.documents },
        ids: f.ids,
        hash,
      }),
    ),
  );
  const projection = await selectedProjection(app);
  if (projection.kind !== "writing") throw new Error("Expected model writing");
  const token = projection.documents.find((item) => item.targetId === "first");
  assert.ok(token);
  const strokeId = parseId({ kind: "stroke", value: f.ids() });
  const begun = await executeInk(
    app,
    await prepareSelectedInk(app, async () =>
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
  if (begun.kind !== "inkCommitted")
    throw new Error("Expected acknowledged seed stroke");
  const saved = await selectedInk(app, { token: begun.token });
  const payload = [
    ...encodeInkPoints({
      points: Array.from({ length: 2048 }, (_, i) => ({
        x: 20 + (i % 900),
        y: 100,
        elapsedMs: i + 1,
      })),
      bounds: { width: 1000, height: 180 },
    }),
  ];
  const command = await prepareSelectedInk(app, async () =>
    prepareInkCommand({
      token: begun.token,
      ids: f.ids,
      hash,
      edit: {
        kind: "checkpoint",
        strokeId,
        layer: "model",
        chunks: [
          {
            codecVersion: 1,
            chunkIndex: 1,
            firstPointIndex: 1,
            pointCount: 2048,
            payload,
          },
        ],
      },
    }),
  );
  const pages = db.prepare("PRAGMA page_count").get()?.page_count;
  assert.equal(typeof pages, "number");
  db.exec(`PRAGMA max_page_count=${pages}`);
  const before = await databaseSnapshot(db);
  await assert.rejects(executeInk(app, command), sqliteFull);
  assert.equal(db.isTransaction, false);
  assert.deepEqual(await databaseSnapshot(db), before);
  assert.deepEqual(await selectedInk(app, { token: begun.token }), saved);
  db.exec("PRAGMA max_page_count=1073741823");
  const receipt = await executeInk(app, command);
  if (receipt.kind !== "inkCommitted")
    throw new Error("Expected retained checkpoint commit");
  const after = await databaseSnapshot(db);
  assert.deepEqual(await executeInk(app, command), receipt);
  assert.deepEqual(await databaseSnapshot(db), after);
  const restored = await selectedInk(app, { token: receipt.token });
  assert.ok(restored);
  assert.equal(restored.strokes.length, 1);
  assert.equal(restored.strokes[0]?.pointCount, 2049);
  assert.deepEqual(restored.strokes[0]?.chunks[1]?.payload, payload);
});

for (const reopen of [false, true]) {
  test(`real SQLite capacity refusal preserves teaching and exact Retry${reopen ? " after reopen" : " on the same connection"}`, async (t) => {
    const f = await storageFixture(t);
    const original = await f.connectReady();
    await f.act(original.app, "start");
    const pages = original.db.prepare("PRAGMA page_count").get()?.page_count;
    assert.equal(typeof pages, "number");
    assert.equal(
      original.db.prepare(`PRAGMA max_page_count=${pages}`).get()
        ?.max_page_count,
      pages,
    );
    let exhausted = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const projection = await selectedProjection(original.app);
      const command = await prepareSelectedTeaching(original.app, async () =>
        prepareCommand({ projection, ids: f.ids, hash }),
      );
      const before = await databaseSnapshot(original.db);
      try {
        const receipt = await executeTeaching(original.app, command);
        assert.equal(receipt.kind, "committed");
      } catch (error) {
        assert.equal(
          sqliteFull(error),
          true,
          "the native driver must report SQLITE_FULL",
        );
        exhausted = true;
        assert.equal(original.db.isTransaction, false);
        assert.deepEqual(await databaseSnapshot(original.db), before);
        assert.deepEqual(await selectedProjection(original.app), projection);
        const connection = reopen
          ? (original.db.close(), f.connect())
          : original;
        assert.deepEqual(await databaseSnapshot(connection.db), before);
        connection.db.exec("PRAGMA max_page_count=1073741823");
        const accepted = await executeTeaching(connection.app, command);
        assert.equal(accepted.kind, "committed");
        const after = await databaseSnapshot(connection.db);
        assert.deepEqual(
          await executeTeaching(connection.app, command),
          accepted,
        );
        assert.deepEqual(await databaseSnapshot(connection.db), after);
        break;
      }
    }
    assert.equal(
      exhausted,
      true,
      "bounded teaching must reach the configured real page limit",
    );
  });
}
