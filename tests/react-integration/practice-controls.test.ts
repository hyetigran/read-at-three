import { readEnvelope } from "./support.ts";
import {
  executeTeaching,
  selectedControls,
  selectedInk,
  selectedProjection,
} from "../storage/selected-support.ts";

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
    connection = await f.connectReady(),
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
      read: async (input) => {
        const value = await readEnvelope(app, input, f.content.body.courseId);
        return { ...value, projection: await afterRead(value.projection) };
      },
      execute: (operation) => app.execute(operation),
      recoverTeaching: (input) => app.recoverTeaching(input),
      readPracticeControls: async (input) => {
        summaryReads++;
        const value = await app.readPracticeControls(input);
        return { ...value, value: await afterSummary(value.value) };
      },
    },
    stageRestore: async ({ projection }) => {
      let summary: PracticeControlsSummary = { kind: "readOnly" };
      if (projection.kind === "writing")
        for (const token of projection.documents) {
          const snapshot = await selectedInk(app, { token });
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
  await runtime.read({
    expectation: {
      kind: "opening",
      selection: (await app.readDirectory()).selection,
    },
  });
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
  assert.deepEqual(cache?.queryKey.slice(3, 10), [
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
      selection: (await f.app.readDirectory()).selection,
      courseId: f.content.body.courseId,
    },
  });
  const old = f.runtime.current(),
    oldSummary = f.runtime.practiceControls.getSnapshot();
  const command = await f.prepareControl(f.app, { kind: "inkUndo" }),
    prepared = { operation: command, origin };
  assert.ok(command.command.kind === "writingControl");
  const documentId = command.command.payload.documentId;
  f.afterRead(async (projection) =>
    projection.kind === "writing"
      ? {
          ...projection,
          documents: projection.documents.map((token) =>
            token.documentId === documentId
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

test("A to B staged writing adoption publishes one ownership snapshot and refetchable B controls", async (t) => {
  const f = await queryFixture(t);
  const directoryA = await f.app.readDirectory();
  const { changeProfile } = await import("../storage/selected-support.ts");
  const { hash } = await import("../storage/support.ts");
  await changeProfile(f.app, f.ids, hash, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  await f.start(f.app);
  const directoryB = await f.app.readDirectory();
  assert.notDeepEqual(directoryA.selection.owner, directoryB.selection.owner);
  f.runtime.retire();
  const observed: string[] = [];
  const inspect = () => {
    const visible = f.runtime.current();
    const controls = f.runtime.practiceControls.getSnapshot();
    if (visible && controls.kind === "editable") {
      assert.deepEqual(
        controls.binding.owner,
        visible.directory.selection.owner,
      );
      observed.push(visible.directory.selection.owner.profileId);
    }
  };
  const stopView = f.runtime.view.subscribe(inspect);
  const stopControls = f.runtime.practiceControls.subscribe(inspect);
  t.after(() => {
    stopView();
    stopControls();
  });
  await f.runtime.read({
    expectation: { kind: "opening", selection: directoryB.selection },
  });
  const summary = f.runtime.practiceControls.getSnapshot();
  assert.ok(summary.kind === "editable");
  assert.deepEqual(summary.binding.owner, directoryB.selection.owner);
  const selected = f.client
    .getQueryCache()
    .getAll()
    .find((query) => query.queryKey[0] === "practice-controls");
  assert.ok(selected);
  assert.deepEqual(selected.queryKey.slice(1, 3), [
    directoryB.selection.installationId,
    directoryB.selection.revision,
  ]);
  const reads = f.summaryReads();
  const refetched = await f.client.query({
    queryKey: selected.queryKey,
    staleTime: 0,
  });
  assert.equal(f.summaryReads(), reads + 1);
  assert.deepEqual(refetched, summary);
  assert.deepEqual(f.runtime.practiceControls.getSnapshot(), summary);
  assert.ok(observed.includes(directoryB.selection.owner.profileId));
});

test("an older same-selection directory cannot replace newer committed profile cosmetics", async (t) => {
  const f = await queryFixture(t);
  const { changeProfile } = await import("../storage/selected-support.ts");
  const { hash } = await import("../storage/support.ts");
  const ownerA = (await f.app.readDirectory()).selection.owner;
  await changeProfile(f.app, f.ids, hash, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  const ownerB = (await f.app.readDirectory()).selection.owner;
  await changeProfile(f.app, f.ids, hash, (directory) => ({
    kind: "selectProfile",
    directory: directory.administration,
    target: ownerA,
  }));
  const directory = await f.app.readDirectory();
  f.runtime.retire();
  await f.runtime.read({
    expectation: { kind: "opening", selection: directory.selection },
  });
  const target = directory.profiles.find(
    (profile) => profile.edit.owner.profileId === ownerB.profileId,
  );
  assert.ok(target);
  await changeProfile(f.app, f.ids, hash, (value) => ({
    kind: "setAvatar",
    directory: value.administration,
    target: target.edit,
    avatarId: "fox",
  }));
  const older = await f.app.readDirectory();
  const nextTarget = older.profiles.find(
    (profile) => profile.edit.owner.profileId === ownerB.profileId,
  );
  assert.ok(nextTarget);
  await changeProfile(f.app, f.ids, hash, (value) => ({
    kind: "setAvatar",
    directory: value.administration,
    target: nextTarget.edit,
    avatarId: "bear",
  }));
  const newer = await f.app.readDirectory();
  const projection = f.runtime.current()?.projection;
  assert.equal(f.runtime.adoptDirectory(newer), true);
  assert.equal(f.runtime.adoptDirectory(older), false);
  assert.deepEqual(f.runtime.current()?.directory, newer);
  assert.strictEqual(f.runtime.current()?.projection, projection);
  assert.equal(
    f.runtime
      .current()
      ?.directory.profiles.find(
        (profile) => profile.edit.owner.profileId === ownerB.profileId,
      )?.preferences.avatarId,
    "bear",
  );
});
