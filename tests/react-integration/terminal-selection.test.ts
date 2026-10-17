import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import {
  canonical,
  encodeInkPoints,
  parseCounter,
  parseDevelopmentPackage,
  parseHash,
  parseId,
  prepareCommand,
  prepareWritingCommand,
} from "@readatthree/teaching";
import type {
  CourseReadTarget,
  DocumentToken,
  InkCommand,
  InkEdit,
  TeachingCommand,
  TeachingIntent,
} from "@readatthree/teaching";
import {
  createCommittedTeaching,
  TeachingRecoveryError,
} from "@readatthree/react-integration";
import type { PreparedAction } from "@readatthree/react-integration";
import { hash, storageFixture } from "../storage/support.ts";

const writingTask = "fixture.graph.l01.t06";
const pausedTask = "fixture.graph.l01.t02";
const unseenTask = "fixture.task";

async function fixture(t: Parameters<typeof storageFixture>[0]) {
  const content = await parseDevelopmentPackage(
    JSON.parse(
      await readFile("tests/fixtures/writing-development-package.json", "utf8"),
    ),
    hash,
  );
  const store = await storageFixture(t, content);
  const { app, db } = store.connect();
  await app.open();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  let fault: "none" | "before" | "after" = "none";
  const deliveries: TeachingCommand[] = [];
  const targets: CourseReadTarget["kind"][] = [];
  const runtime = createCommittedTeaching({
    queryClient,
    repository: {
      async read(target = { kind: "cursor" }) {
        targets.push(target.kind);
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
        const failure = fault;
        fault = "none";
        if (failure === "before") throw new Error("Lost before dispatch");
        const result = await app.dispatch(command);
        if (failure === "after") throw new Error("Lost after COMMIT");
        return result;
      },
      recoverTeaching: (input) => app.recoverTeaching(input),
    },
    async stageRestore(projection) {
      if (
        projection.kind === "writing" ||
        projection.kind === "writingResult"
      ) {
        for (const token of projection.documents) {
          const snapshot = await app.readInk({ token });
          assert.deepEqual(snapshot.token, token);
          if (projection.runStatus !== "inProgress")
            assert.equal(snapshot.writable, false);
        }
      }
      return { activate() {} };
    },
  });
  t.after(async () => {
    runtime.close();
    queryClient.clear();
  });
  await runtime.read({ expectation: { kind: "opening" } });
  function current() {
    const projection = runtime.current()?.projection;
    assert.ok(projection && projection.kind !== "recovery");
    return projection;
  }
  async function prepare(
    kind: TeachingIntent["kind"],
    taskId?: string,
  ): Promise<PreparedAction> {
    const origin = current();
    const action = origin.actions.find(
      (candidate) =>
        candidate.intent.kind === kind &&
        (!taskId ||
          ("taskId" in candidate.intent && candidate.intent.taskId === taskId)),
    );
    assert.ok(action, `Missing ${kind} at ${origin.kind}`);
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
    return { origin, command };
  }
  async function act(kind: TeachingIntent["kind"], taskId?: string) {
    const prepared = await prepare(kind, taskId);
    const result = await runtime.execute({ kind: "normal", prepared });
    assert.equal(result.kind, "visible");
    assert.ok(result.kind === "visible");
    assert.equal(result.receipt.kind, "committed");
    return prepared;
  }
  async function refresh() {
    await runtime.read({
      expectation: {
        kind: "refresh",
        owner: current().owner,
        courseId: content.body.courseId,
      },
    });
  }
  async function ink(token: DocumentToken, edit: InkEdit) {
    const command: InkCommand = {
      kind: "ink",
      commandId: parseId({ kind: "command", value: store.ids() }),
      token,
      edit,
      payloadHash: parseHash({
        kind: "payload",
        value: await hash(canonical({ kind: "ink", token, edit })),
      }),
    };
    const result = await app.dispatchInk(command);
    assert.ok(result.kind === "inkCommitted");
    return result.token;
  }
  async function draw(finalize = true) {
    const projection = current();
    assert.ok(projection.kind === "writing");
    let writable: DocumentToken | undefined;
    for (const token of projection.documents)
      if ((await app.readInk({ token })).writable) writable = token;
    assert.ok(writable);
    assert.equal(writable.phase, "parentDemonstration");
    const strokeId = parseId({ kind: "stroke", value: store.ids() });
    const token = await ink(writable, {
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
              points: [{ x: 50, y: 60, elapsedMs: 0 }],
              bounds: { width: 1000, height: 180 },
            }),
          ],
        },
      ],
    });
    const end: InkEdit = {
      kind: "finalize",
      strokeId,
      layer: "model",
      chunks: [],
      status: "finished",
    };
    if (finalize) await ink(token, end);
    await refresh();
    return { token, end };
  }
  function count(table: string) {
    const value = db.prepare(`SELECT count(*) AS n FROM ${table}`).get()?.n;
    assert.ok(typeof value === "number");
    return value;
  }
  function counts() {
    return {
      runs: count("task_run"),
      documents: count("ink_document"),
      credits: count("task_credit"),
      advances: count("task_advance"),
      receipts: count("command_receipt"),
    };
  }
  function creditRows() {
    return db.prepare("SELECT * FROM task_credit ORDER BY credit_id").all();
  }
  async function assertRejected(command: TeachingCommand, code: string) {
    const result = await app.dispatch(command);
    assert.ok(result.kind === "rejected");
    assert.equal(result.code, code);
  }
  return {
    app,
    ids: store.ids,
    runtime,
    current,
    prepare,
    act,
    refresh,
    ink,
    draw,
    counts,
    creditRows,
    assertRejected,
    deliveries,
    targets,
    failNext(boundary: "before" | "after") {
      fault = boundary;
    },
  };
}

async function terminal(
  t: Parameters<typeof storageFixture>[0],
  outcome: "completed" | "skipped",
  superseded = true,
) {
  const f = await fixture(t);
  await f.act("start", writingTask);
  await f.act("continue");
  await f.draw();
  let older: { sessionId: string; runId: string } | null = null;
  if (superseded) {
    await f.act("pause");
    await f.act("start", pausedTask);
    const selected = f.current();
    assert.ok("runId" in selected);
    older = { sessionId: selected.sessionId, runId: selected.runId };
    await f.act("pause");
    await f.act("resume", writingTask);
  }
  if (outcome === "skipped") await f.act("skipWriting");
  else {
    for (
      let turn = 0;
      turn < 20 && f.current().kind !== "writingResult";
      turn++
    ) {
      const projection = f.current();
      const kind = projection.actions.find(
        (action) =>
          action.intent.kind === "confirmTracing" ||
          action.intent.kind === "confirmIndependent" ||
          action.intent.kind === "continue",
      )?.intent.kind;
      assert.ok(kind);
      await f.act(kind);
    }
  }
  const view = f.current();
  assert.ok(view.kind === "writingResult");
  assert.equal(view.outcome, outcome);
  assert.equal(view.runStatus, outcome);
  const cursor = await f.app.readApplication({ kind: "cursor" });
  assert.ok(cursor.kind === "ready");
  assert.equal(cursor.projection.kind, superseded ? "entry" : "writingResult");
  assert.equal(
    cursor.course.resume.kind,
    superseded ? "none" : "terminalUndoView",
  );
  assert.equal(f.targets.at(-1), "accepted");
  const snapshots = await Promise.all(
    view.documents.map((token) => f.app.readInk({ token })),
  );
  assert.equal(
    snapshots.some((snapshot) => snapshot.strokes.length === 1),
    true,
  );
  return { ...f, view, older, snapshots };
}

for (const outcome of ["completed", "skipped"] satisfies readonly (
  "completed" | "skipped"
)[]) {
  for (const next of ["replay", "start", "resume"] satisfies readonly (
    "replay" | "start" | "resume"
  )[]) {
    test(`${outcome} accepted writing selects ${next} when a cold cursor is entry`, async (t) => {
      const f = await terminal(t, outcome);
      const task =
        next === "replay"
          ? writingTask
          : next === "start"
            ? unseenTask
            : pausedTask;
      const prepared = await f.prepare(next, task);
      const command = prepared.command;
      const before = f.counts();
      const credits = f.creditRows();
      const result = await f.runtime.execute({ kind: "normal", prepared });
      assert.equal(result.kind, "visible");
      assert.equal(command.kind, "select");
      assert.ok(command.kind === "select");
      assert.equal(command.expectedRevision, f.view.profileRevision);
      assert.deepEqual(command.owner, f.view.owner);
      assert.equal(command.payload.intent, next);
      assert.equal(command.payload.taskId, task);
      assert.equal(
        command.payload.sessionId,
        next === "replay"
          ? f.view.sessionId
          : next === "resume"
            ? f.older?.sessionId
            : null,
      );
      assert.equal(
        command.payloadHash,
        await hash(canonical({ kind: "select", payload: command.payload })),
      );
      const selected = f.current();
      assert.ok("runId" in selected);
      assert.equal(selected.runStatus, "inProgress");
      if (next === "resume") {
        assert.equal(selected.runId, f.older?.runId);
        assert.equal(selected.sessionId, f.older?.sessionId);
      } else {
        assert.notEqual(selected.runId, f.view.runId);
        assert.notEqual(selected.sessionId, f.view.sessionId);
      }
      assert.equal(f.counts().runs, before.runs + (next === "resume" ? 0 : 1));
      if (next === "replay") {
        assert.ok(selected.kind === "writing");
        assert.equal(selected.documents.length, 2);
        for (const token of selected.documents) {
          assert.equal(
            f.view.documents.some((old) => old.documentId === token.documentId),
            false,
          );
          const snapshot = await f.app.readInk({ token });
          assert.deepEqual(snapshot.strokes, []);
        }
        assert.equal(f.counts().documents, before.documents + 2);
      }
      assert.deepEqual(
        await Promise.all(
          f.view.documents.map((token) => f.app.readInk({ token })),
        ),
        f.snapshots,
      );
      assert.equal(f.counts().credits, before.credits);
      assert.deepEqual(f.creditRows(), credits);
    });
  }

  test(`${outcome} terminal Back and Continue retain writing barriers and read-only ink`, async (t) => {
    const f = await terminal(t, outcome, false);
    const before = f.counts();
    const back = await f.prepare("back");
    assert.ok(back.command.kind === "writingNavigate");
    assert.deepEqual(back.command.payload.barrier.documents, f.view.documents);
    const result = await f.runtime.execute({ kind: "normal", prepared: back });
    assert.equal(result.kind, "visible");
    const reviewed = f.current();
    assert.ok(reviewed.kind === "writing");
    assert.equal(reviewed.runStatus, outcome);
    for (const token of reviewed.documents)
      assert.equal((await f.app.readInk({ token })).writable, false);
    const forward = await f.prepare("continue");
    assert.ok(forward.command.kind === "writingNavigate");
    assert.deepEqual(
      forward.command.payload.barrier.documents,
      reviewed.documents,
    );
    assert.equal(
      (await f.runtime.execute({ kind: "normal", prepared: forward })).kind,
      "visible",
    );
    assert.equal(f.current().kind, "writingResult");
    assert.equal(f.counts().credits, before.credits);
    assert.equal(f.counts().advances, before.advances);
    await f.act("back");
    const readonly = f.current();
    assert.ok(readonly.kind === "writing");
    assert.equal(readonly.runStatus, outcome);
    const snapshots = await Promise.all(
      readonly.documents.map((token) => f.app.readInk({ token })),
    );
    const credits = f.creditRows();
    const replay = await f.prepare("replay", writingTask);
    assert.equal(replay.command.kind, "select");
    assert.equal(
      (await f.runtime.execute({ kind: "normal", prepared: replay })).kind,
      "visible",
    );
    const fresh = f.current();
    assert.ok(fresh.kind === "writing");
    assert.equal(fresh.runStatus, "inProgress");
    assert.notEqual(fresh.runId, readonly.runId);
    assert.notEqual(fresh.sessionId, readonly.sessionId);
    for (const token of fresh.documents) {
      assert.equal(
        readonly.documents.some((old) => old.documentId === token.documentId),
        false,
      );
      assert.deepEqual((await f.app.readInk({ token })).strokes, []);
    }
    assert.deepEqual(
      await Promise.all(
        readonly.documents.map((token) => f.app.readInk({ token })),
      ),
      snapshots,
    );
    assert.equal(f.counts().credits, before.credits);
    assert.deepEqual(f.creditRows(), credits);
    assert.equal(f.counts().runs, before.runs + 1);
    assert.equal(f.counts().documents, before.documents + 2);
  });
}

test("active and paused unfinished selections require settled exact document barriers", async (t) => {
  const f = await fixture(t);
  await f.act("start", writingTask);
  await f.act("continue");
  const capture = await f.draw(false);
  const pending = await f.prepare("start", pausedTask);
  assert.ok(pending.command.kind === "writingSelect");
  assert.equal(pending.command.payload.barrier.documents.length, 2);
  await f.assertRejected(pending.command, "writing-barrier");
  await f.ink(capture.token, capture.end);
  await f.refresh();
  await f.assertRejected(pending.command, "writing-barrier");
  const active = await f.prepare("start", pausedTask);
  assert.ok(active.command.kind === "writingSelect");
  assert.ok(active.origin.kind !== "recovery");
  const action = active.origin.actions.find(
    (candidate) =>
      candidate.intent.kind === "start" &&
      candidate.intent.taskId === pausedTask,
  );
  assert.ok(action);
  const ordinary = await prepareCommand({
    projection: active.origin,
    request: { kind: "action", action },
    ids: f.ids,
    hash,
  });
  await f.assertRejected(ordinary, "writing-fence");
  await f.act("pause");
  const paused = await f.prepare("start", pausedTask);
  assert.ok(paused.command.kind === "writingSelect");
  assert.equal(paused.command.payload.barrier.documents.length, 2);
  assert.equal(
    (await f.runtime.execute({ kind: "normal", prepared: paused })).kind,
    "visible",
  );
  const selected = f.current();
  assert.ok("taskId" in selected);
  assert.equal(selected.taskId, pausedTask);
});

for (const boundary of ["before", "after"] satisfies readonly (
  "before" | "after"
)[]) {
  test(`terminal Replay keeps its accepted view and exact Retry after loss ${boundary} dispatch`, async (t) => {
    const f = await terminal(t, "skipped");
    const prepared = await f.prepare("replay", writingTask);
    const before = f.counts();
    const credits = f.creditRows();
    const delivered = f.deliveries.length;
    f.failNext(boundary);
    await assert.rejects(
      f.runtime.execute({ kind: "normal", prepared }),
      /Lost/,
    );
    assert.strictEqual(f.current(), f.view);
    assert.equal(f.deliveries.length, delivered + 1);
    assert.equal(f.counts().runs, before.runs + (boundary === "after" ? 1 : 0));
    assert.equal(
      (await f.runtime.execute({ kind: "normal", prepared })).kind,
      "visible",
    );
    assert.deepEqual(f.deliveries.slice(delivered), [
      prepared.command,
      prepared.command,
    ]);
    assert.equal(f.counts().runs, before.runs + 1);
    assert.equal(f.counts().documents, before.documents + 2);
    assert.equal(f.counts().credits, before.credits);
    assert.deepEqual(f.creditRows(), credits);
    assert.deepEqual(
      await Promise.all(
        f.view.documents.map((token) => f.app.readInk({ token })),
      ),
      f.snapshots,
    );
  });
}

test("terminal selection retains hash, profile revision, owner and capability guards", async (t) => {
  const f = await terminal(t, "skipped");
  const { command } = await f.prepare("replay", writingTask);
  assert.ok(command.kind === "select" || command.kind === "writingSelect");
  const before = f.counts();
  const wrongHash = {
    ...command,
    commandId: parseId({ kind: "command", value: f.ids() }),
    payloadHash: parseHash({ kind: "payload", value: "0".repeat(64) }),
  };
  await f.assertRejected(wrongHash, "payload-hash");
  const staleRevision = {
    ...command,
    commandId: parseId({ kind: "command", value: f.ids() }),
    expectedRevision: parseCounter("0"),
  };
  await f.assertRejected(staleRevision, "stale-revision");
  const staleOwner = {
    ...command,
    commandId: parseId({ kind: "command", value: f.ids() }),
    owner: { ...command.owner, generation: parseCounter("999") },
  };
  await f.assertRejected(staleOwner, "stale-owner");
  const wrongScope = {
    ...command,
    commandId: parseId({ kind: "command", value: f.ids() }),
    scope: {
      ...command.scope,
      id: parseId({ kind: "profile", value: "other-profile" }),
    },
  };
  await f.assertRejected(wrongScope, "wrong-scope");
  await assert.rejects(
    prepareWritingCommand({
      projection: f.view,
      action: {
        label: { kind: "added", text: "Unadvertised Back" },
        intent: { kind: "back" },
      },
      barrier: { kind: "writing", documents: f.view.documents },
      ids: f.ids,
      hash,
    }),
    /capability unavailable/,
  );
  assert.deepEqual(f.counts(), before);
  const replay = f.view.actions.find(
    (action) => action.intent.kind === "replay",
  );
  assert.ok(replay);
  const active = await prepareCommand({
    projection: f.view,
    request: { kind: "action", action: replay },
    ids: f.ids,
    hash,
  });
  assert.equal((await f.app.dispatch(active)).kind, "committed");
  const cursor = await f.app.readApplication({ kind: "cursor" });
  assert.ok(cursor.kind === "ready" && cursor.projection.kind === "writing");
  assert.equal(cursor.projection.runStatus, "inProgress");
  const activeCounts = f.counts();
  await f.assertRejected(command, "writing-fence");
  assert.deepEqual(f.counts(), activeCounts);
});
