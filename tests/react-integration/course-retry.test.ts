import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import {
  canonical,
  parseCounter,
  parseHash,
  parseId,
  summarizePractice,
  visibleInkStrokes,
} from "@readatthree/teaching";
import type {
  CommitReceipt,
  CourseReadTarget,
  InkSnapshot,
  PracticeControlsSummary,
  TeachingCommand,
} from "@readatthree/teaching";
import {
  createCommittedTeaching,
  TeachingRecoveryError,
} from "@readatthree/react-integration";
import type { PreparedAction } from "@readatthree/react-integration";
import { practiceFixture } from "../storage/practice-support.ts";

async function fixture(t: Parameters<typeof practiceFixture>[0]) {
  const storage = await practiceFixture(t);
  let { app } = storage.connect();
  const model = await storage.start(app);
  const first = await storage.draw(app, 100),
    second = await storage.draw(app, 200);
  const before = await storage.current(app);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const targets: CourseReadTarget[] = [];
  const deliveries: TeachingCommand[] = [];
  let fault: "none" | "before" | "after" | "wrongCommand" = "none";
  let loseRecoveredReply = false;
  let activated: readonly InkSnapshot[] = [];
  let activationCount = 0;
  let recoveryReceipt = (receipt: CommitReceipt) => receipt;
  const runtime = createCommittedTeaching({
    queryClient,
    repository: {
      async read(target = { kind: "cursor" }) {
        targets.push(target);
        const application = await app.readApplication(target);
        if (application.kind === "recovery")
          throw new TeachingRecoveryError(application);
        return {
          courseId: application.courseId,
          projection: application.projection,
          application,
        };
      },
      async dispatch(command) {
        deliveries.push(command);
        const current = fault;
        fault = "none";
        if (current === "before") throw Error("Lost before dispatch");
        const result = await app.dispatch(command);
        if (current === "after") throw Error("Lost after COMMIT");
        return current === "wrongCommand" && result.kind === "committed"
          ? {
              ...result,
              commandId: parseId({ kind: "command", value: "wrong-command" }),
            }
          : result;
      },
      async recoverTeaching(input) {
        deliveries.push(input.command);
        const result = await app.recoverTeaching(input);
        if (loseRecoveredReply) {
          loseRecoveredReply = false;
          throw Error("Lost recovered receipt");
        }
        return result.kind === "committed" ? recoveryReceipt(result) : result;
      },
    },
    async stageRestore(projection) {
      const snapshots: InkSnapshot[] = [];
      let practiceControls: PracticeControlsSummary = { kind: "readOnly" };
      if (projection.kind === "writing" || projection.kind === "writingResult")
        for (const token of projection.documents) {
          const snapshot = await app.readInk({ token });
          assert.equal(canonical(snapshot.token), canonical(token));
          snapshots.push(snapshot);
          const summary = summarizePractice({
            binding: {
              owner: projection.owner,
              sessionId: projection.sessionId,
              runId: projection.runId,
              packageHash: projection.packageHash,
            },
            snapshot,
          });
          if (summary.kind === "editable") practiceControls = summary;
        }
      return {
        practiceControls,
        activate() {
          activated = snapshots;
          activationCount++;
        },
      };
    },
  });
  t.after(async () => {
    runtime.close();
    queryClient.clear();
  });
  await runtime.read({ expectation: { kind: "opening" } });
  const origin = runtime.current()?.projection;
  if (!origin || origin.kind !== "writing") throw Error("Writing required");
  const prepared: PreparedAction = {
    origin,
    command: await storage.prepareControl(app, { kind: "inkUndo" }),
  };
  async function replace() {
    runtime.connectionLost();
    ({ app } = storage.connect());
    return app.openRecovery({
      kind: "warm",
      retainedStrokeIds: [],
      teaching: {
        kind: "pending",
        commandId: prepared.command.commandId,
        payloadHash: prepared.command.payloadHash,
      },
    });
  }
  function assertRestored() {
    const snapshot = activated.find(
      (value) => value.token.documentId === before.token.documentId,
    );
    assert.ok(snapshot);
    const history = snapshot.histories.find(
      (value) => value.layer === "tracing",
    );
    assert.ok(history);
    assert.deepEqual(
      visibleInkStrokes({ history, strokes: snapshot.strokes }),
      [first],
    );
    assert.equal(
      canonical(snapshot.strokes),
      canonical(before.snapshot.strokes),
    );
    assert.deepEqual(
      snapshot.strokes.map((value) => value.strokeId),
      [model, first, second],
    );
    const controls = runtime.practiceControls.getSnapshot();
    assert.equal(controls.kind, "editable");
    if (controls.kind !== "editable") throw Error("Editable controls required");
    assert.deepEqual(
      { undo: controls.undo, redo: controls.redo, clear: controls.clear },
      { undo: true, redo: true, clear: true },
    );
  }
  return {
    runtime,
    prepared,
    targets,
    deliveries,
    replace,
    get app() {
      return app;
    },
    setFault(value: typeof fault) {
      fault = value;
    },
    loseRecovery() {
      loseRecoveredReply = true;
    },
    setRecoveryReceipt(edit: typeof recoveryReceipt) {
      recoveryReceipt = edit;
    },
    activationCount: () => activationCount,
    assertRestored,
  };
}
for (const boundary of ["recovered-receipt", "reconciliation-reply"]) {
  test(`coherent accepted control Retry restores reconciled tokens after lost ${boundary}`, async (t) => {
    const f = await fixture(t);
    f.setFault(boundary === "recovered-receipt" ? "before" : "after");
    await assert.rejects(
      f.runtime.execute({ kind: "normal", prepared: f.prepared }),
      /Lost/,
    );
    const first = await f.replace();
    if (boundary === "recovered-receipt") {
      f.loseRecovery();
      await assert.rejects(
        f.runtime.execute({
          kind: "closedRecovery",
          recoveryId: first.recoveryId,
          prepared: f.prepared,
        }),
        /Lost recovered receipt/,
      );
    } else {
      await f.runtime.execute({
        kind: "closedRecovery",
        recoveryId: first.recoveryId,
        prepared: f.prepared,
      });
      await f.app.reconcileRecovery({
        recoveryId: first.recoveryId,
        choice: { kind: "warm", settledStrokeIds: [] },
      });
    }
    const second = await f.replace();
    const result = await f.runtime.execute({
      kind: "closedRecovery",
      recoveryId: second.recoveryId,
      prepared: f.prepared,
    });
    assert.equal(result.kind, "resolved");
    if (result.kind !== "resolved" || result.result.kind !== "committed")
      throw Error("Committed recovery required");
    const projection = await f.app.reconcileRecovery({
      recoveryId: second.recoveryId,
      choice: { kind: "warm", settledStrokeIds: [] },
    });
    const current = f.runtime.current();
    assert.ok(current);
    await f.runtime.read({
      expectation: {
        kind: "receipt",
        courseId: current.courseId,
        prepared: f.prepared,
        receipt: result.result,
        restoreBinding: { kind: "reconciled", projection },
      },
    });
    f.assertRestored();
    assert.equal(f.deliveries.length, 3);
    assert.equal(
      new Set(f.deliveries.map((command) => canonical(command))).size,
      1,
    );
    assert.equal(f.targets.at(-1)?.kind, "accepted");
    const selected = f.runtime.current();
    if (projection.kind !== "writing")
      throw Error("Reconciled writing required");
    const documents = projection.documents.map((token, index) =>
      index === 0 ? { ...token, inputEpoch: parseCounter("99") } : token,
    );
    await assert.rejects(
      f.runtime.read({
        expectation: {
          kind: "receipt",
          courseId: current.courseId,
          prepared: f.prepared,
          receipt: result.result,
          restoreBinding: {
            kind: "reconciled",
            projection: { ...projection, documents },
          },
        },
      }),
      /reconciled reading binding changed/,
    );
    assert.strictEqual(f.runtime.current(), selected);
    assert.equal(f.runtime.view.getSnapshot().recovery, null);
    f.assertRestored();
  });
}
test("uncorrelated committed acknowledgement stays an exact save Retry without reading a forged accepted target", async (t) => {
  const f = await fixture(t);
  const selected = f.runtime.current(),
    readCount = f.targets.length;
  f.setFault("wrongCommand");
  await assert.rejects(
    f.runtime.execute({ kind: "normal", prepared: f.prepared }),
    /did not match/,
  );
  assert.equal(f.targets.length, readCount);
  assert.equal(f.runtime.view.getSnapshot().recovery, null);
  assert.strictEqual(f.runtime.current(), selected);
  await f.runtime.execute({ kind: "normal", prepared: f.prepared });
  f.assertRestored();
  assert.equal(f.deliveries.length, 2);
  assert.equal(canonical(f.deliveries[0]), canonical(f.deliveries[1]));
});

test("direct receipt reads reject uncorrelated acknowledgements before touching the accepted repository target", async (t) => {
  const f = await fixture(t);
  const receipt = await f.app.dispatch(f.prepared.command);
  if (receipt.kind !== "committed") throw Error("Committed control required");
  const selected = f.runtime.current();
  assert.ok(selected);
  const reads = f.targets.length,
    activations = f.activationCount(),
    controls = f.runtime.practiceControls.getSnapshot();
  const edits: readonly Readonly<{
    name: string;
    edit: (value: CommitReceipt) => CommitReceipt;
  }>[] = [
    {
      name: "command identity",
      edit: (value) => ({
        ...value,
        commandId: parseId({ kind: "command", value: "other-command" }),
      }),
    },
    {
      name: "package identity",
      edit: (value) => ({
        ...value,
        packageHash: parseHash({ kind: "package", value: "f".repeat(64) }),
      }),
    },
    {
      name: "owner identity",
      edit: (value) => ({
        ...value,
        owner: {
          ...value.owner,
          profileId: parseId({ kind: "profile", value: "other-profile" }),
        },
      }),
    },
    {
      name: "owner generation",
      edit: (value) => ({
        ...value,
        owner: { ...value.owner, generation: parseCounter("99") },
      }),
    },
    {
      name: "committed revision",
      edit: (value) => ({ ...value, revision: parseCounter("99") }),
    },
    {
      name: "session identity",
      edit: (value) => ({
        ...value,
        sessionId: parseId({ kind: "session", value: "other-session" }),
      }),
    },
    {
      name: "run identity",
      edit: (value) => ({
        ...value,
        runId: parseId({ kind: "run", value: "other-run" }),
      }),
    },
  ];
  for (const { name, edit } of edits) {
    await assert.rejects(
      f.runtime.read({
        expectation: {
          kind: "receipt",
          courseId: selected.courseId,
          prepared: f.prepared,
          receipt: edit(receipt),
          restoreBinding: { kind: "normal" },
        },
      }),
      /did not match/,
      name,
    );
    assert.equal(f.targets.length, reads, name);
    assert.equal(f.runtime.view.getSnapshot().recovery, null, name);
    assert.strictEqual(f.runtime.current(), selected, name);
    assert.equal(f.activationCount(), activations, name);
    assert.strictEqual(
      f.runtime.practiceControls.getSnapshot(),
      controls,
      name,
    );
  }
  await f.runtime.read({
    expectation: {
      kind: "receipt",
      courseId: selected.courseId,
      prepared: f.prepared,
      receipt,
      restoreBinding: { kind: "normal" },
    },
  });
  f.assertRestored();
});

test("a closed recovery acknowledgement must correlate before its public receipt read can publish reconciled teaching", async (t) => {
  const f = await fixture(t);
  f.setFault("before");
  await assert.rejects(
    f.runtime.execute({ kind: "normal", prepared: f.prepared }),
    /Lost/,
  );
  const recovery = await f.replace();
  f.setRecoveryReceipt((value) => ({
    ...value,
    commandId: parseId({ kind: "command", value: "other-command" }),
  }));
  const result = await f.runtime.execute({
    kind: "closedRecovery",
    recoveryId: recovery.recoveryId,
    prepared: f.prepared,
  });
  if (result.kind !== "resolved" || result.result.kind !== "committed")
    throw Error("Recovered committed control required");
  const projection = await f.app.reconcileRecovery({
    recoveryId: recovery.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [] },
  });
  const selected = f.runtime.current();
  assert.ok(selected);
  const reads = f.targets.length,
    activations = f.activationCount(),
    controls = f.runtime.practiceControls.getSnapshot();
  await assert.rejects(
    f.runtime.read({
      expectation: {
        kind: "receipt",
        courseId: selected.courseId,
        prepared: f.prepared,
        receipt: result.result,
        restoreBinding: { kind: "reconciled", projection },
      },
    }),
    /did not match/,
  );
  assert.equal(f.targets.length, reads);
  assert.equal(f.runtime.view.getSnapshot().recovery, null);
  assert.strictEqual(f.runtime.current(), selected);
  assert.equal(f.activationCount(), activations);
  assert.strictEqual(f.runtime.practiceControls.getSnapshot(), controls);
  assert.equal(f.deliveries.length, 2);
  assert.equal(canonical(f.deliveries[0]), canonical(f.deliveries[1]));
});
