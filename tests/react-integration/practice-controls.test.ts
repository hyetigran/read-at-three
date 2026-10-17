import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { canonical, increment, summarizePractice } from "@readatthree/teaching";
import type {
  CommittedProjection,
  PracticeControlsSummary,
} from "@readatthree/teaching";
import { createCommittedTeaching } from "@readatthree/react-integration";
import { practiceFixture } from "../storage/practice-support.ts";
function deferred() {
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
async function queryFixture(t: Parameters<typeof practiceFixture>[0]) {
  const f = await practiceFixture(t),
    connection = f.connect(),
    { app } = connection;
  await f.start(app);
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  let afterSummary = async (summary: PracticeControlsSummary) => summary;
  let afterRead = async (projection: CommittedProjection) => projection;
  let beforeActivation = async () => {};
  let summaryReads = 0,
    activations = 0;
  const runtime = createCommittedTeaching({
    queryClient: client,
    repository: {
      read: async () => ({
        courseId: f.content.body.courseId,
        projection: await afterRead(await app.read()),
      }),
      dispatch: (command) => app.dispatch(command),
      recoverTeaching: (input) => app.recoverTeaching(input),
      readPracticeControls: async (binding) => {
        summaryReads++;
        return afterSummary(await app.readPracticeControls(binding));
      },
    },
    stageRestore: async (projection) => {
      let summary: PracticeControlsSummary = { kind: "readOnly" };
      if (projection.kind === "writing")
        for (const token of projection.documents) {
          const snapshot = await app.readInk({ token });
          const value = summarizePractice({
            binding: {
              owner: projection.owner,
              sessionId: projection.sessionId,
              runId: projection.runId,
              packageHash: projection.packageHash,
            },
            snapshot,
          });
          if (value.kind === "editable") summary = value;
        }
      await beforeActivation();
      return {
        practiceControls: summary,
        activate() {
          activations++;
        },
      };
    },
  });
  t.after(async () => {
    runtime.close();
    client.clear();
  });
  await runtime.read({ expectation: { kind: "opening" } });
  return {
    ...f,
    ...connection,
    runtime,
    client,
    summaryReads: () => summaryReads,
    activations: () => activations,
    afterSummary(value: typeof afterSummary) {
      afterSummary = value;
    },
    afterRead(value: typeof afterRead) {
      afterRead = value;
    },
    beforeActivation(value: typeof beforeActivation) {
      beforeActivation = value;
    },
  };
}
test("real Query coalesces delayed obsolete summaries without waiting for rapid committed strokes", async (t) => {
  const f = await queryFixture(t),
    entered = deferred(),
    release = deferred();
  const initial = f.runtime.practiceControls.getSnapshot();
  assert.equal(initial.kind, "editable");
  f.afterSummary(async (summary) => {
    if (f.summaryReads() === 1) {
      entered.release();
      await release.promise;
    }
    return summary;
  });
  const first = await f.draw(f.app, 100);
  f.runtime.captureFinalized({ token: (await f.current(f.app)).token });
  await entered.promise;
  const second = await f.draw(f.app, 200);
  f.runtime.captureFinalized({ token: (await f.current(f.app)).token });
  assert.deepEqual(await f.visible(f.app), [first, second]);
  assert.equal(f.summaryReads(), 1);
  assert.strictEqual(f.runtime.practiceControls.getSnapshot(), initial);
  const selected = deferred();
  const unsubscribe = f.runtime.practiceControls.subscribe(() => {
    const summary = f.runtime.practiceControls.getSnapshot();
    if (summary.kind === "editable" && summary.undo) selected.release();
  });
  release.release();
  await selected.promise;
  unsubscribe();
  const summary = f.runtime.practiceControls.getSnapshot();
  assert.equal(summary.kind, "editable");
  if (summary.kind !== "editable") throw new Error("Editable summary required");
  assert.equal(summary.token.revision, (await f.current(f.app)).token.revision);
  assert.deepEqual(
    {
      undo: summary.undo,
      redo: summary.redo,
      clear: summary.clear,
      points: summary.retainedUsage.pointCount,
    },
    { undo: true, redo: false, clear: true, points: 3 },
  );
  assert.equal(f.summaryReads(), 2);
  const cache = f.client
    .getQueryCache()
    .getAll()
    .find((query) => query.queryKey[0] === "practice-controls");
  assert.deepEqual(cache?.queryKey.slice(1, 8), [
    summary.binding.owner.profileId,
    summary.binding.owner.generation,
    summary.token.courseId,
    summary.binding.packageHash,
    summary.binding.sessionId,
    summary.binding.runId,
    summary.token.documentId,
  ]);
  assert.equal(
    f.client
      .getQueryCache()
      .getAll()
      .filter((query) => query.queryKey[0] === "practice-controls-read").length,
    0,
  );
  assert.equal(
    JSON.stringify(
      f.client
        .getQueryCache()
        .getAll()
        .filter((query) => query.queryKey[0] === "practice-controls")
        .map((query) => query.state.data),
    ).includes('"chunks"'),
    false,
  );
});
test("control receipt rejects wrong exact document fences and obsolete staged activation, then exact Retry adopts once", async (t) => {
  const f = await queryFixture(t);
  await f.draw(f.app, 100);
  await f.draw(f.app, 200);
  const origin = (await f.current(f.app)).projection;
  await f.runtime.read({
    expectation: {
      kind: "refresh",
      owner: origin.owner,
      courseId: f.content.body.courseId,
    },
  });
  const old = f.runtime.current(),
    oldSummary = f.runtime.practiceControls.getSnapshot();
  const command = await f.prepareControl(f.app, { kind: "inkUndo" }),
    prepared = { command, origin };
  f.afterRead(async (projection) =>
    projection.kind === "writing"
      ? {
          ...projection,
          documents: projection.documents.map((token) =>
            token.documentId === command.payload.documentId
              ? { ...token, inputEpoch: increment(token.inputEpoch) }
              : token,
          ),
        }
      : projection,
  );
  await assert.rejects(
    f.runtime.execute({ kind: "normal", prepared }),
    /documents did not match/,
  );
  assert.strictEqual(f.runtime.current(), old);
  assert.strictEqual(f.runtime.practiceControls.getSnapshot(), oldSummary);
  assert.equal((await f.visible(f.app)).length, 1);
  f.afterRead(async (projection) => projection);
  const entered = deferred(),
    release = deferred();
  f.beforeActivation(async () => {
    entered.release();
    await release.promise;
  });
  const pending = f.runtime.execute({ kind: "normal", prepared });
  await entered.promise;
  f.runtime.connectionLost();
  release.release();
  await assert.rejects(pending, /connection changed/);
  assert.strictEqual(f.runtime.current(), old);
  assert.strictEqual(f.runtime.practiceControls.getSnapshot(), oldSummary);
  f.beforeActivation(async () => {});
  const result = await f.runtime.execute({ kind: "normal", prepared });
  assert.equal(result.kind, "visible");
  assert.equal((await f.visible(f.app)).length, 1);
  const summary = f.runtime.practiceControls.getSnapshot();
  assert.equal(summary.kind, "editable");
  if (summary.kind !== "editable") throw new Error("Editable summary required");
  assert.equal(summary.redo, true);
  assert.equal(
    canonical(summary.token),
    canonical((await f.current(f.app)).token),
  );
});
