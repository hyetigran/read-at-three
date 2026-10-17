import { readEnvelope } from "./support.ts";
import {
  executeTeaching,
  selectedInk,
  selectedProjection,
} from "../storage/selected-support.ts";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { QueryClient, onlineManager } from "@tanstack/react-query";
import {
  canonical,
  parseCounter,
  parseDevelopmentPackage,
  prepareCommand,
  prepareWritingCommand,
} from "@readatthree/teaching";
import type {
  CommittedProjection,
  SelectedTeachingOperation,
  TeachingIntent,
  SelectedApplication,
} from "@readatthree/teaching";
import {
  createCommittedTeaching,
  TeachingRecoveryError,
} from "@readatthree/react-integration";
import type {
  PreparedAction,
  ReadEnvelope,
  ReadExpectation,
} from "@readatthree/react-integration";
import { hash, storageFixture } from "../storage/support.ts";

function deferred() {
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release: () => release() };
}
async function fixture(t: Parameters<typeof storageFixture>[0]) {
  const content = await parseDevelopmentPackage(
    JSON.parse(
      await readFile("tests/fixtures/writing-development-package.json", "utf8"),
    ),
    hash,
  );
  const store = await storageFixture(t, content);
  let failCommit = false;
  let reads = 0;
  const deliveries: SelectedTeachingOperation[] = [];
  let beforeDispatch = async () => {};
  let afterDispatch = async () => {};
  let afterRead = async (value: ReadEnvelope) => value;
  let beforeActivate = async () => {};
  const connection = await store.connectReady({
    hook: async (sql, work) => {
      if (sql === "COMMIT" && failCommit) {
        failCommit = false;
        throw new Error("Injected pre-COMMIT rollback");
      }
      return work();
    },
  });
  let app: SelectedApplication = connection.app;
  await selectedProjection(app);
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const activated: CommittedProjection[] = [];
  const runtime = createCommittedTeaching({
    queryClient: client,
    repository: {
      async read(input) {
        reads++;
        return afterRead(await readEnvelope(app, input, content.body.courseId));
      },
      async execute(operation) {
        const command = operation;
        deliveries.push(command);
        await beforeDispatch();
        const result = await app.execute(operation);
        await afterDispatch();
        return result;
      },
      async recoverTeaching(input) {
        deliveries.push(input.operation);
        return app.recoverTeaching(input);
      },
    },
    stageRestore: async ({ projection }) => {
      if (
        projection.kind === "writing" ||
        projection.kind === "writingResult"
      ) {
        for (const token of projection.documents) {
          const snapshot = await selectedInk(app, { token });
          assert.equal(canonical(snapshot.token), canonical(token));
        }
      }
      await beforeActivate();
      return {
        activate() {
          activated.push(projection);
        },
      };
    },
  });
  t.after(async () => {
    runtime.close();
    client.clear();
  });
  function current() {
    const value = runtime.current();
    assert.ok(value);
    return value;
  }
  function expectation(): ReadExpectation {
    const value = current();
    assert.notEqual(value.projection.kind, "recovery");
    if (value.projection.kind === "recovery")
      throw new Error(value.projection.message);
    return {
      kind: "refresh",
      courseId: value.courseId,
      selection: value.directory.selection,
    };
  }
  function assertSelected() {
    const value = current();
    const selected = client
      .getQueryCache()
      .getAll()
      .filter(
        (query) =>
          query.queryKey[0] === "teaching" && query.state.data === value,
      );
    assert.equal(selected.length, 1);
    assert.strictEqual(runtime.view.getSnapshot().visible.data, value);
    assert.equal(
      client
        .getQueryCache()
        .getAll()
        .filter((query) => query.queryKey[0] === "teaching-resolver").length,
      0,
    );
    return selected[0];
  }
  async function prepare(
    kind: TeachingIntent["kind"],
    taskId?: string,
  ): Promise<PreparedAction> {
    const origin = current().projection;
    assert.notEqual(origin.kind, "recovery");
    if (origin.kind === "recovery") throw new Error(origin.message);
    const action = origin.actions.find(
      (action) =>
        action.intent.kind === kind &&
        (!taskId ||
          ("taskId" in action.intent && action.intent.taskId === taskId)),
    );
    assert.ok(action);
    const command =
      origin.kind === "writing" || origin.kind === "writingResult"
        ? await prepareWritingCommand({
            projection: origin,
            action,
            barrier: { kind: "writing", documents: origin.documents },
            ids: store.ids,
            hash,
          })
        : await prepareCommand({
            projection: origin,
            request: { kind: "action", action },
            ids: store.ids,
            hash,
          });
    return {
      operation: {
        kind: "teaching",
        selection: current().directory.selection,
        command,
      },
      origin,
    };
  }
  async function start() {
    await runtime.read({
      expectation: {
        kind: "opening",
        selection: (await app.readDirectory()).selection,
      },
    });
    await runtime.execute({
      kind: "normal",
      prepared: await prepare("start", "fixture.graph.l01.t06"),
    });
    assert.equal(current().projection.kind, "writing");
  }
  return {
    ...connection,
    store,
    content,
    client,
    runtime,
    activated,
    current,
    expectation,
    assertSelected,
    prepare,
    start,
    readCount: () => reads,
    deliveries: () => deliveries,
    failCommit: () => {
      failCommit = true;
    },
    beforeDispatch: (fn: typeof beforeDispatch) => {
      beforeDispatch = fn;
    },
    afterDispatch: (fn: typeof afterDispatch) => {
      afterDispatch = fn;
    },
    afterRead: (fn: typeof afterRead) => {
      afterRead = fn;
    },
    beforeActivate: (fn: typeof beforeActivate) => {
      beforeActivate = fn;
    },
    replace: async () => {
      const next = await store.connectReady();
      app = next.app;
      return next;
    },
  };
}

test("real Query reads and exact explicit mutations remain local offline, preserve old cache on rollback/lost ack, and finish detached", async (t) => {
  onlineManager.setOnline(false);
  t.after(() => onlineManager.setOnline(true));
  const f = await fixture(t);
  await f.start();
  const selected = f.assertSelected();
  assert.ok(selected);
  assert.ok(selected.queryKey.includes(f.content.body.courseId));
  const beforeRead = f.readCount();
  await f.client.query({ queryKey: selected.queryKey, staleTime: 0 });
  assert.equal(f.readCount(), beforeRead + 1);
  const inkView = f.current().projection;
  if (inkView.kind !== "writing")
    throw new Error("Writing projection required");
  const token = inkView.documents[0];
  assert.ok(token);
  const beforeInk = f.readCount();
  f.runtime.inkCommitted({ token });
  assert.equal(f.client.getQueryState(selected.queryKey)?.isInvalidated, true);
  assert.equal(f.readCount(), beforeInk);
  const prepared = await f.prepare("skipWriting");
  const exact = canonical(prepared.operation);
  const before = f.current();
  f.failCommit();
  await assert.rejects(
    f.runtime.execute({ kind: "normal", prepared }),
    /pre-COMMIT/,
  );
  assert.strictEqual(f.current(), before);
  assert.equal(
    f.db.prepare("SELECT count(*) AS n FROM task_result").get()?.n,
    0,
  );
  assert.equal(f.runtime.view.getSnapshot().mutation.status, "error");
  f.afterDispatch(async () => {
    throw new Error("Injected lost COMMIT acknowledgement");
  });
  await assert.rejects(
    f.runtime.execute({ kind: "normal", prepared }),
    /lost COMMIT/,
  );
  assert.strictEqual(f.current(), before);
  assert.equal(
    f.db.prepare("SELECT outcome FROM task_result").get()?.outcome,
    "skipped",
  );
  f.afterDispatch(async () => {});
  const hold = deferred(),
    entered = deferred();
  f.beforeDispatch(async () => {
    entered.release();
    await hold.promise;
  });
  const detach = f.runtime.view.subscribe(() => {});
  const pending = f.runtime.execute({ kind: "normal", prepared });
  await entered.promise;
  assert.equal(f.runtime.view.getSnapshot().mutation.status, "pending");
  assert.equal(f.runtime.view.getSnapshot().mutation.isPaused, false);
  assert.strictEqual(f.current(), before);
  detach();
  hold.release();
  assert.equal((await pending).kind, "visible");
  assert.equal(f.current().projection.kind, "writingResult");
  assert.equal(
    f.db.prepare("SELECT count(*) AS n FROM task_credit").get()?.n,
    1,
  );
  assert.deepEqual(f.deliveries().slice(1).map(canonical), [
    exact,
    exact,
    exact,
  ]);
  assert.equal(f.readCount(), beforeRead + 2);
  f.assertSelected();
  const last = f.client.getMutationCache().getAll().at(-1);
  assert.deepEqual(last?.state.variables, { kind: "normal", prepared });
  assert.equal(last?.options.retry, false);
  assert.equal(last?.options.networkMode, "always");
});

test("mismatched committed reread and failed canonical restore retain the selected cache until exact Retry", async (t) => {
  const f = await fixture(t);
  await f.start();
  const prepared = await f.prepare("continue");
  const before = f.current(),
    activationCount = f.activated.length;
  f.afterRead(async (value) =>
    value.projection.kind === "writing"
      ? {
          ...value,
          projection: { ...value.projection, revision: parseCounter("99") },
        }
      : value,
  );
  await assert.rejects(
    f.runtime.execute({ kind: "normal", prepared }),
    /did not match/,
  );
  assert.strictEqual(f.current(), before);
  assert.equal(f.activated.length, activationCount);
  assert.equal(f.db.prepare("SELECT revision FROM session").get()?.revision, 1);
  f.afterRead(async (value) => value);
  f.beforeActivate(async () => {
    throw new Error("Injected canonical restore failure");
  });
  await assert.rejects(
    f.runtime.execute({ kind: "normal", prepared }),
    /restore failure/,
  );
  assert.strictEqual(f.current(), before);
  assert.equal(f.activated.length, activationCount);
  f.beforeActivate(async () => {});
  await f.runtime.execute({ kind: "normal", prepared });
  const current = f.current().projection;
  assert.equal(current.kind, "writing");
  if (current.kind !== "writing")
    throw new Error("Writing projection required");
  assert.equal(current.turn.id, "fixture.graph.l01.t06.m-model");
  assert.equal(f.db.prepare("SELECT revision FROM session").get()?.revision, 1);
  assert.equal(f.activated.length, activationCount + 1);
  assert.deepEqual(
    f
      .deliveries()
      .slice(1)
      .map((delivery) => canonical(delivery)),
    Array(3).fill(canonical(prepared.operation)),
  );
  f.assertSelected();
});

test("retired connection reads and restore tickets cannot activate or seed cache, and wrong generations reject", async (t) => {
  const f = await fixture(t);
  await f.start();
  const old = f.current();
  const heldRead = deferred(),
    readEntered = deferred();
  f.afterRead(async (value) => {
    readEntered.release();
    await heldRead.promise;
    return value;
  });
  const reading = f.runtime.read({ expectation: f.expectation() });
  await readEntered.promise;
  f.runtime.connectionLost();
  f.afterRead(async (value) => value);
  await f.runtime.read({ expectation: f.expectation() });
  const newer = f.current(),
    activations = f.activated.length;
  heldRead.release();
  await assert.rejects(reading, /connection changed/);
  assert.strictEqual(f.current(), newer);
  assert.equal(f.activated.length, activations);
  const heldRestore = deferred(),
    restoreEntered = deferred();
  f.beforeActivate(async () => {
    restoreEntered.release();
    await heldRestore.promise;
  });
  const restoring = f.runtime.read({ expectation: f.expectation() });
  await restoreEntered.promise;
  f.runtime.connectionLost();
  f.beforeActivate(async () => {});
  await f.runtime.read({ expectation: f.expectation() });
  const replacement = f.current(),
    replacedActivations = f.activated.length;
  heldRestore.release();
  await assert.rejects(restoring, /connection changed/);
  assert.strictEqual(f.current(), replacement);
  assert.equal(f.activated.length, replacedActivations);
  f.afterRead(async (value) =>
    value.projection.kind === "recovery"
      ? value
      : {
          ...value,
          projection: {
            ...value.projection,
            owner: {
              ...value.projection.owner,
              generation: parseCounter("99"),
            },
          },
        },
  );
  await assert.rejects(
    f.runtime.read({ expectation: f.expectation() }),
    /owner or course changed/,
  );
  assert.strictEqual(f.current(), replacement);
  assert.equal(f.activated.length, replacedActivations);
  assert.equal(canonical(f.current()), canonical(old));
  f.assertSelected();
});

for (const lostAcknowledgement of [false, true]) {
  test(`closed recovery teaching uses a Query mutation before reconciliation and actual receipt reread after ${lostAcknowledgement ? "COMMIT loss" : "rollback"}`, async (t) => {
    const f = await fixture(t);
    await f.start();
    const prepared = await f.prepare("continue"),
      original = canonical(prepared.operation),
      old = f.current();
    if (lostAcknowledgement)
      f.afterDispatch(async () => {
        throw new Error("Injected lost reply");
      });
    else f.failCommit();
    await assert.rejects(f.runtime.execute({ kind: "normal", prepared }));
    assert.strictEqual(f.current(), old);
    f.runtime.connectionLost();
    const next = await f.replace();
    const inventory = await next.app.openRecovery({
      kind: "warm",
      retainedStrokeIds: [],
      selection: prepared.operation.selection,
      teaching: prepared.operation,
      administration: null,
    });
    const reads = f.readCount(),
      activations = f.activated.length;
    assert.equal((await selectedProjection(next.app)).kind, "recovery");
    const resolved = await f.runtime.execute({
      kind: "closedRecovery",
      recoveryId: inventory.recoveryId,
      prepared,
    });
    assert.equal(resolved.kind, "resolved");
    if (resolved.kind !== "resolved" || resolved.result.kind !== "committed")
      throw new Error("Recovered commit required");
    assert.strictEqual(f.current(), old);
    assert.equal(f.readCount(), reads);
    assert.equal(f.activated.length, activations);
    await next.app.reconcileRecovery({
      recoveryId: inventory.recoveryId,
      choice: { kind: "warm", settledStrokeIds: [] },
    });
    await f.runtime.read({
      expectation: {
        kind: "receipt",
        courseId: f.content.body.courseId,
        prepared,
        receipt: resolved.result,
        restoreBinding: { kind: "normal" },
      },
    });
    assert.equal(f.readCount(), reads + 1);
    assert.equal(
      next.db.prepare("SELECT revision FROM session").get()?.revision,
      1,
    );
    assert.deepEqual(f.deliveries().slice(1).map(canonical), [
      original,
      original,
    ]);
    assert.equal(
      f.client.getMutationCache().getAll().at(-1)?.options.networkMode,
      "always",
    );
    f.assertSelected();
  });
}

test("an actual canonical repository refetch cannot publish changed teaching before the fenced restore gate", async (t) => {
  const f = await fixture(t);
  await f.start();
  const selected = f.assertSelected();
  assert.ok(selected);
  const old = f.current(),
    activations = f.activated.length;
  const prepared = await f.prepare("continue");
  const receipt = await executeTeaching(f.app, prepared.operation);
  assert.equal(receipt.kind, "committed");
  if (receipt.kind !== "committed")
    throw new Error("Committed transition required");
  const reads = f.readCount();
  await assert.rejects(
    f.client.query({ queryKey: selected.queryKey, staleTime: 0 }),
    /fenced read and canonical restore/,
  );
  assert.equal(f.readCount(), reads + 1);
  assert.strictEqual(f.current(), old);
  assert.equal(f.activated.length, activations);
  await f.runtime.read({
    expectation: {
      kind: "receipt",
      courseId: f.content.body.courseId,
      prepared,
      receipt,
      restoreBinding: { kind: "normal" },
    },
  });
  const view = f.current().projection;
  assert.equal(view.kind, "writing");
  if (view.kind !== "writing") throw new Error("Writing view required");
  assert.equal(view.turn.id, "fixture.graph.l01.t06.m-model");
  assert.equal(f.activated.length, activations + 1);
  f.assertSelected();
});

test("actual stored recovery preserves its category and explanation without selecting teaching cache data", async (t) => {
  const f = await fixture(t);
  await f.store.act(f.app, "start");
  f.db.exec("DELETE FROM course_cursor");
  await assert.rejects(
    f.runtime.read({
      expectation: {
        kind: "opening",
        selection: (await f.app.readDirectory()).selection,
      },
    }),
    (error: unknown) => {
      assert.ok(error instanceof TeachingRecoveryError);
      assert.equal(error.code, "invalid-position");
      assert.equal(
        error.message,
        "Saved teaching and its exact content package could not be verified.",
      );
      return true;
    },
  );
  const snapshot = f.runtime.view.getSnapshot();
  assert.ok(snapshot.recovery instanceof TeachingRecoveryError);
  assert.strictEqual(snapshot.read.error, snapshot.recovery);
  assert.equal(snapshot.read.status, "error");
  assert.equal(snapshot.visible.data, undefined);
  assert.equal(f.runtime.current(), undefined);
  assert.equal(f.activated.length, 0);
  assert.equal(
    f.client
      .getQueryCache()
      .getAll()
      .filter((query) => query.queryKey[0] === "teaching").length,
    0,
  );
  assert.equal(f.db.prepare("SELECT count(*) AS n FROM profile").get()?.n, 1);
});

test("known repository recovery stays visible through a pending Retry until successful staged adoption", async (t) => {
  const f = await fixture(t);
  await f.start();
  const old = f.current();
  f.db.exec("CREATE TEMP TABLE saved_cursor AS SELECT * FROM course_cursor");
  f.db.exec("DELETE FROM course_cursor");
  await assert.rejects(
    f.runtime.read({ expectation: f.expectation() }),
    TeachingRecoveryError,
  );
  const failure = f.runtime.view.getSnapshot().recovery;
  assert.ok(failure);
  assert.equal(failure.code, "invalid-position");
  assert.strictEqual(f.current(), old);
  f.db.exec("INSERT INTO course_cursor SELECT * FROM saved_cursor");
  const hold = deferred(),
    entered = deferred();
  f.beforeActivate(async () => {
    entered.release();
    await hold.promise;
  });
  const retrying = f.runtime.read({ expectation: f.expectation() });
  await entered.promise;
  assert.equal(f.runtime.view.getSnapshot().read.fetchStatus, "fetching");
  assert.equal(f.runtime.view.getSnapshot().read.error, null);
  assert.strictEqual(f.runtime.view.getSnapshot().recovery, failure);
  assert.strictEqual(f.current(), old);
  hold.release();
  await retrying;
  assert.equal(f.runtime.view.getSnapshot().recovery, null);
  f.assertSelected();
});

test("an old parsed recovery cannot replace newer successful adoption, while same-attempt connection loss retains failure information", async (t) => {
  const f = await fixture(t);
  await f.start();
  f.db.exec("CREATE TEMP TABLE saved_cursor AS SELECT * FROM course_cursor");
  f.db.exec("DELETE FROM course_cursor");
  const hold = deferred(),
    entered = deferred();
  f.afterRead(async (value) => {
    assert.equal(value.projection.kind, "recovery");
    entered.release();
    await hold.promise;
    return value;
  });
  const oldRead = f.runtime.read({ expectation: f.expectation() });
  await entered.promise;
  f.db.exec("INSERT INTO course_cursor SELECT * FROM saved_cursor");
  f.afterRead(async (value) => value);
  await f.runtime.read({ expectation: f.expectation() });
  const newer = f.current(),
    activations = f.activated.length;
  hold.release();
  await assert.rejects(oldRead, TeachingRecoveryError);
  assert.equal(f.runtime.view.getSnapshot().recovery, null);
  assert.strictEqual(f.current(), newer);
  assert.equal(f.activated.length, activations);
  f.assertSelected();
  f.db.exec("DELETE FROM course_cursor");
  f.afterRead(async (value) => {
    assert.equal(value.projection.kind, "recovery");
    f.runtime.connectionLost();
    return value;
  });
  await assert.rejects(
    f.runtime.read({ expectation: f.expectation() }),
    TeachingRecoveryError,
  );
  assert.equal(f.runtime.view.getSnapshot().recovery?.code, "invalid-position");
  assert.strictEqual(f.current(), newer);
  assert.equal(f.activated.length, activations);
  f.assertSelected();
});
