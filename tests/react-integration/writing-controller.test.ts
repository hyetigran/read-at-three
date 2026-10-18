import { syntheticPlanEnvelope, hash } from "../lesson-two-fixture.ts";
import { parseRuntimePackage, canonical } from "@readatthree/teaching";
import { readEnvelope } from "./support.ts";
import {
  executeInk,
  executeTeaching,
  selectedControls,
  selectedInk,
  selectedProjection,
  syntheticPreparation,
  changeProfile,
} from "../storage/selected-support.ts";

import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { createCommittedTeaching } from "@readatthree/react-integration";
import { createWritingController } from "../../apps/web/src/platform/writing-controller.ts";
import { practiceFixture } from "../storage/practice-support.ts";
function deferred() {
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
async function controllerFixture(
  t: Parameters<typeof practiceFixture>[0],
  options: {
    deferOpen?: boolean;
    content?: import("@readatthree/teaching").RuntimePackage;
    start?: boolean;
  } = {},
) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window"),
    previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: Object.assign(new EventTarget(), {
      innerWidth: 1280,
      innerHeight: 800,
      setInterval: globalThis.setInterval,
      clearInterval: globalThis.clearInterval,
    }),
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: Object.assign(new EventTarget(), { visibilityState: "visible" }),
  });
  const f = await practiceFixture(t, options.content);
  let sqlHook: import("../storage/support.ts").SqlHook = async (_sql, work) =>
    work();
  const hook: import("../storage/support.ts").SqlHook = (sql, work) =>
    sqlHook(sql, work);
  let { app, db } = await f.connectReady({ hook });
  if (options.start !== false) await f.start(app);
  let connectionRevision = 0;
  let replace = false;
  let onLoss = () => {};
  const events: string[] = [];
  const administrativeDeliveries: import("@readatthree/teaching").ProfileAdministrationCommand[] =
    [];
  let beforeAdmin = async (
    _command: import("@readatthree/teaching").ProfileAdministrationCommand,
  ) => {};
  let afterAdmin = async (
    _command: import("@readatthree/teaching").ProfileAdministrationCommand,
    _result: Awaited<ReturnType<typeof app.administer>>,
  ) => {};
  let beforeRead = async (
    _input: Parameters<typeof app.readApplication>[0],
  ) => {};
  let beforeInkRead = async (_input: Parameters<typeof app.readInk>[0]) => {};
  let afterDirectory = async (
    value: Awaited<ReturnType<typeof app.readDirectory>>,
  ) => value;
  let beforeConnect = async () => {};
  const read = async (input: Parameters<typeof app.readApplication>[0]) => {
    await beforeRead(input);
    return readEnvelope(app, input, f.content.body.courseId);
  };
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  let deliveries = 0;
  const teachingDeliveries: import("@readatthree/teaching").SelectedTeachingOperation[] =
    [];
  const controller = createWritingController({
    client: {
      onLoss(listener) {
        onLoss = listener;
      },
      close() {},
      connectionTicket: () => connectionRevision,
      connect: async (opening) => {
        await beforeConnect();
        connectionRevision++;
        if (replace) {
          if (db.isOpen) db.close();
          ({ app, db } = f.connect({
            preparation: syntheticPreparation,
            hook,
          }));
          replace = false;
        }
        events.push(`open:${opening.kind}`);
        return app.openRecovery(opening);
      },
      read: async (input) => {
        const value = await read(input);
        if (value.projection.kind === "recovery" || !value.application)
          throw new Error("Application required");
        return {
          directory: value.directory,
          projection: value.projection,
          courseId: value.courseId,
          application: value.application,
        };
      },
      readDirectory: async () => afterDirectory(await app.readDirectory()),
      readDeparture: (input) => app.readDeparture(input),
      administer: async (command) => {
        administrativeDeliveries.push(command);
        events.push("administration");
        await beforeAdmin(command);
        const result = await app.administer(command);
        await afterAdmin(command, result);
        return result;
      },
      recoverAdministration: (input) => {
        events.push("recover:administration");
        return app.recoverAdministration(input);
      },
      readInk: async (input) => {
        await beforeInkRead(input);
        return app.readInk(input);
      },
      execute: (operation) => {
        if (operation.kind === "ink") deliveries++;
        return app.execute(operation);
      },
      recoverInk: (input) => {
        events.push("recover:ink");
        return app.recoverInk(input);
      },
      recoverTeaching: (input) => {
        events.push("recover:teaching");
        return app.recoverTeaching(input);
      },
      reconcileRecovery: (input) => {
        events.push("reconcile");
        return app.reconcileRecovery(input);
      },
    },
    createTeaching: (stageRestore) =>
      createCommittedTeaching({
        queryClient,
        stageRestore,
        repository: {
          read,
          execute: (operation) => {
            if (operation.kind === "teaching")
              teachingDeliveries.push(operation);
            return app.execute(operation);
          },
          recoverTeaching: (input) => {
            events.push("recover:teaching");
            return app.recoverTeaching(input);
          },
          readPracticeControls: (input) => app.readPracticeControls(input),
        },
      }),
  });
  t.after(async () => {
    controller.close();
    queryClient.clear();
    if (previousWindow)
      Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (previousDocument)
      Object.defineProperty(globalThis, "document", previousDocument);
    else Reflect.deleteProperty(globalThis, "document");
  });
  if (!options.deferOpen) await controller.open();
  return {
    ...f,
    get app() {
      return app;
    },
    get db() {
      return db;
    },
    controller,
    queryClient,
    get board() {
      const value = controller
        .getBoard()
        .find((entry) => entry.snapshot.writable);
      if (!value) throw new Error("Writable board required");
      return value;
    },
    teachingDeliveries,
    administrativeDeliveries,
    events,
    deliveries: () => deliveries,
    sqlHook(value: typeof sqlHook) {
      sqlHook = value;
    },
    beforeAdmin(value: typeof beforeAdmin) {
      beforeAdmin = value;
    },
    afterAdmin(value: typeof afterAdmin) {
      afterAdmin = value;
    },
    beforeRead(value: typeof beforeRead) {
      beforeRead = value;
    },
    beforeInkRead(value: typeof beforeInkRead) {
      beforeInkRead = value;
    },
    afterDirectory(value: typeof afterDirectory) {
      afterDirectory = value;
    },
    beforeConnect(value: typeof beforeConnect) {
      beforeConnect = value;
    },
    lose() {
      connectionRevision++;
      replace = true;
      onLoss();
    },
  };
}
test(
  "controller reserves pending pre-hash command and accepted tails before the 2MiB bound",
  { timeout: 30000 },
  async (t) => {
    const f = await controllerFixture(t),
      entered = deferred(),
      release = deferred();
    const digest = crypto.subtle.digest.bind(crypto.subtle),
      descriptor = Object.getOwnPropertyDescriptor(crypto.subtle, "digest");
    let held = false;
    Object.defineProperty(crypto.subtle, "digest", {
      configurable: true,
      value: async (...args: Parameters<typeof crypto.subtle.digest>) => {
        if (
          !held &&
          new TextDecoder().decode(args[1]).includes('"kind":"ink"')
        ) {
          held = true;
          entered.release();
          await release.promise;
        }
        return digest(...args);
      },
    });
    t.after(async () => {
      release.release();
      if (descriptor)
        Object.defineProperty(crypto.subtle, "digest", descriptor);
      else Reflect.deleteProperty(crypto.subtle, "digest");
    });
    const first = f.controller.begin(
      f.board.snapshot.token.documentId,
      {
        x: 100,
        y: 100,
        elapsedMs: 0,
      },
      performance.now(),
    );
    if (!first) throw new Error("First contact required");
    await entered.promise;
    f.controller.append(
      first,
      Array.from({ length: 99999 }, (_, index) => ({
        x: 100 + (index % 100),
        y: 100,
        elapsedMs: index + 1,
      })),
    );
    f.controller.finish(first, "finished");
    const second = f.controller.begin(
      f.board.snapshot.token.documentId,
      {
        x: 300,
        y: 100,
        elapsedMs: 0,
      },
      performance.now(),
    );
    if (!second) throw new Error("Rapid second contact required");
    f.controller.append(
      second,
      Array.from({ length: 35000 }, (_, index) => ({
        x: 300 + (index % 100),
        y: 100,
        elapsedMs: index + 1,
      })),
    );
    assert.equal(f.controller.getState().operation.kind, "inkFailed");
    assert.equal(f.controller.canWrite(), false);
    assert.equal(f.deliveries(), 0);
    assert.deepEqual(
      f.controller
        .getBoard()[0]
        ?.strokes.filter((stroke) => stroke.layer === "tracing")
        .map((stroke) => stroke.points.length),
      [100000, 1],
    );
    release.release();
    await f.controller.retry();
    assert.equal(f.controller.getState().operation.kind, "idle");
    const snapshot = (await f.current(f.app)).snapshot;
    assert.deepEqual(
      snapshot.strokes
        .filter((stroke) => stroke.layer === "tracing")
        .map((stroke) => ({
          points: stroke.pointCount,
          status: stroke.status,
        })),
      [
        { points: 100000, status: "finished" },
        { points: 1, status: "interrupted" },
      ],
    );
    assert.equal(
      snapshot.strokes.filter((stroke) => stroke.layer === "model")[0]
        ?.pointCount,
      1,
    );
  },
);
test("original contact token and fence serial prevent old callbacks from joining a later gesture", async (t) => {
  const f = await controllerFixture(t),
    token = f.board.snapshot.token;
  const old = f.controller.begin(
    token.documentId,
    {
      x: 100,
      y: 100,
      elapsedMs: 0,
    },
    performance.now(),
  );
  if (!old) throw new Error("Old contact required");
  await f.controller.interrupt();
  assert.equal(
    f.controller.begin(
      token.documentId,
      { x: 900, y: 100, elapsedMs: 0 },
      old.startedAt,
    ),
    null,
  );
  const current = f.controller.begin(
    token.documentId,
    {
      x: 300,
      y: 100,
      elapsedMs: 0,
    },
    performance.now(),
  );
  if (!current) throw new Error("New contact required");
  assert.notEqual(current.fenceSerial, old.fenceSerial);
  assert.deepEqual(old.originalToken, token);
  f.controller.append(old, [{ x: 900, y: 170, elapsedMs: 100 }]);
  f.controller.finish(old, "finished");
  assert.equal(f.controller.getBoard()[0]?.strokes.at(-1)?.points.length, 1);
  f.controller.append(current, [{ x: 350, y: 120, elapsedMs: 10 }]);
  f.controller.finish(current, "finished");
  await f.controller.interrupt();
  const snapshot = (await f.current(f.app)).snapshot;
  assert.deepEqual(
    snapshot.strokes
      .filter((stroke) => stroke.layer === "tracing")
      .map((stroke) => ({ points: stroke.pointCount, status: stroke.status })),
    [
      { points: 1, status: "interrupted" },
      { points: 2, status: "finished" },
    ],
  );
});

test("blur and pagehide reject stale teaching callbacks while a lifecycle Pause remains allowed", async (t) => {
  const f = await controllerFixture(t);
  const { db } = await f.connectReady();
  function savedPosition() {
    return {
      runs: db
        .prepare(
          "SELECT run_id, status, state, active_advance_id, next_advance_seq FROM task_run ORDER BY run_id",
        )
        .all(),
      acceptances: db
        .prepare(
          "SELECT advance_id, run_id, seq, status FROM task_advance ORDER BY run_id, seq",
        )
        .all(),
    };
  }
  const before = savedPosition();
  assert.equal(before.runs.length, 1);
  assert.equal(before.acceptances.length, 2);
  function advance() {
    const projection =
      f.controller.committed.getSnapshot().visible.data?.projection;
    if (!projection || projection.kind === "recovery")
      throw new Error("Saved teaching required");
    const action = projection.actions.find((action) =>
      ["continue", "confirmTracing", "confirmIndependent"].includes(
        action.intent.kind,
      ),
    );
    if (!action) throw new Error("Parent acceptance required");
    return action;
  }
  const action = advance();
  window.dispatchEvent(new Event("blur"));
  assert.equal(f.controller.getState().inputSuspended, true);
  f.controller.act(action);
  await f.controller.visit();
  assert.deepEqual(
    f.teachingDeliveries.map((command) =>
      "action" in command.command.payload
        ? command.command.payload.action
        : command.command.kind,
    ),
    [{ kind: "pause" }],
  );
  assert.deepEqual(savedPosition(), before);
  window.dispatchEvent(new Event("focus"));
  f.controller.setSurface("teaching");
  const paused = f.controller.committed.getSnapshot().visible.data?.projection;
  if (!paused || paused.kind === "recovery")
    throw new Error("Paused place required");
  if (paused.kind !== "writing") throw new Error("Saved writing required");
  assert.equal(paused.sessionStatus, "paused");
  assert.equal(paused.turn.id, "fixture.writing.turn.3");
  const resume = paused.actions.find(
    (action) => action.intent.kind === "resume",
  );
  assert.ok(resume);
  assert.equal(await f.controller.enter(resume), true);
  assert.equal(f.teachingDeliveries.length, 2);
  const resumeCommand = f.teachingDeliveries[1];
  if (!resumeCommand || resumeCommand.command.kind !== "writingSelect")
    throw new Error("Exact saved writing selection required");
  assert.equal(resumeCommand.command.payload.intent, "resume");
  assert.equal(resumeCommand.command.payload.sessionId, paused.sessionId);
  assert.equal(resumeCommand.command.payload.taskId, paused.taskId);
  assert.equal(resumeCommand.command.payload.packageHash, paused.packageHash);
  assert.deepEqual(savedPosition(), before);
  const next = advance();
  const count = f.teachingDeliveries.length;
  window.dispatchEvent(new Event("pagehide"));
  assert.equal(f.controller.getState().inputSuspended, true);
  f.controller.act(next);
  await f.controller.visit();
  assert.deepEqual(
    f.teachingDeliveries
      .slice(count)
      .map((command) =>
        "action" in command.command.payload
          ? command.command.payload.action
          : command.command.kind,
      ),
    [{ kind: "pause" }],
  );
  const hidden = f.controller.committed.getSnapshot().visible.data?.projection;
  if (!hidden || hidden.kind !== "writing")
    throw new Error("Paused writing required");
  assert.equal(hidden.sessionStatus, "paused");
  assert.equal(hidden.runId, paused.runId);
  assert.equal(hidden.turn.id, "fixture.writing.turn.3");
  assert.deepEqual(savedPosition(), before);
});

test("teaching Undo drains a live child trace, fences old callbacks and publishes the restored phase through Query", async (t) => {
  const f = await controllerFixture(t);
  const origin = f.controller.committed.getSnapshot().visible.data?.projection;
  if (!origin || origin.kind !== "writing")
    assert.fail("Writing projection required");
  const undo = origin.actions.find(
    (action) => action.intent.kind === "undoAdvance",
  );
  assert.ok(undo);
  const contact = f.controller.begin(
    f.board.snapshot.token.documentId,
    { x: 100, y: 100, elapsedMs: 0 },
    performance.now(),
  );
  assert.ok(contact);
  f.controller.append(contact, [{ x: 150, y: 110, elapsedMs: 20 }]);
  const saving = f.controller.enter(undo);
  assert.equal(f.controller.canWrite(), false);
  assert.equal(await saving, true);
  const restored =
    f.controller.committed.getSnapshot().visible.data?.projection;
  if (!restored || restored.kind !== "writing")
    assert.fail("Restored writing required");
  assert.equal(restored.turn.id, "fixture.writing.turn.2");
  assert.equal(restored.runId, origin.runId);
  assert.equal(restored.sessionId, origin.sessionId);
  const delivered = f.teachingDeliveries.at(-1);
  assert.equal(delivered?.command.kind, "writingUndoAdvance");
  if (!delivered || delivered.command.kind !== "writingUndoAdvance")
    assert.fail("Writing Undo command required");
  assert.equal(delivered.command.payload.barrier.documents.length, 2);
  const board = f.controller
    .getBoard()
    .find((value) => value.snapshot.token.targetId === "first");
  assert.ok(board);
  assert.equal(board.snapshot.token.phase, "parentDemonstration");
  assert.equal(board.snapshot.writable, true);
  assert.deepEqual(
    board.strokes
      .filter((stroke) => stroke.layer === "tracing")
      .map((stroke) => stroke.points),
    [
      [
        { x: 100, y: 100, elapsedMs: 0, pressure: 1 },
        { x: 150, y: 110, elapsedMs: 20, pressure: 1 },
      ],
    ],
  );
  const beforeLate = board.strokes;
  f.controller.append(contact, [{ x: 900, y: 170, elapsedMs: 50 }]);
  f.controller.finish(contact, "finished");
  assert.deepEqual(
    f.controller
      .getBoard()
      .find((value) => value.snapshot.token.targetId === "first")?.strokes,
    beforeLate,
  );
  const canonical = await f.current(f.app);
  assert.equal(
    canonical.snapshot.strokes.find((stroke) => stroke.layer === "tracing")
      ?.status,
    "interrupted",
  );
  assert.equal(
    canonical.snapshot.strokes.find((stroke) => stroke.layer === "tracing")
      ?.pointCount,
    2,
  );
});

function waitForPaint(
  controller: ReturnType<typeof createWritingController>,
  predicate: () => boolean,
) {
  if (predicate()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const unsubscribe = controller.subscribePaint(() => {
      if (!predicate()) return;
      unsubscribe();
      resolve();
    });
  });
}
function controllerDirectory(
  controller: ReturnType<typeof createWritingController>,
) {
  const read = controller.committed.getSnapshot().visible.data;
  if (!read) throw new Error("Committed directory required");
  return read.directory;
}
async function choose(
  controller: ReturnType<typeof createWritingController>,
  owner: import("@readatthree/teaching").Owner,
) {
  const directory = controllerDirectory(controller);
  return controller.administer({
    kind: "selectProfile",
    directory: directory.administration,
    target: owner,
  });
}
async function resumeController(
  controller: ReturnType<typeof createWritingController>,
) {
  controller.setSurface("teaching");
  const view = controller.committed.getSnapshot().visible.data?.projection;
  if (!view || view.kind === "recovery") throw new Error("Teaching required");
  const resume = view.actions.find((action) => action.intent.kind === "resume");
  if (resume) assert.equal(await controller.enter(resume), true);
}

test("editing B's avatar keeps A's active contact, teaching and Undo intact across a later switch-back", async (t) => {
  const f = await controllerFixture(t);
  const ownerA = controllerDirectory(f.controller).selection.owner;
  const initial = controllerDirectory(f.controller);
  assert.equal(
    (
      await f.controller.administer({
        kind: "createAndSelect",
        directory: initial.administration,
        preferences: { avatarId: "owl" },
      })
    ).kind,
    "visible",
  );
  const ownerB = controllerDirectory(f.controller).selection.owner;
  assert.equal((await choose(f.controller, ownerA)).kind, "visible");
  await resumeController(f.controller);
  const board = f.board;
  const contact = f.controller.begin(
    board.snapshot.token.documentId,
    { x: 100, y: 100, elapsedMs: 0 },
    performance.now(),
  );
  assert.ok(contact);
  await waitForPaint(f.controller, () =>
    f.controller
      .getBoard()
      .some(
        (value) =>
          value.snapshot.token.documentId === board.snapshot.token.documentId &&
          BigInt(value.snapshot.token.revision) >
            BigInt(board.snapshot.token.revision),
      ),
  );
  const protectedRows = () => ({
    runs: f.db.prepare("SELECT * FROM task_run ORDER BY run_id").all(),
    advances: f.db
      .prepare("SELECT * FROM task_advance ORDER BY advance_id")
      .all(),
    cursors: f.db
      .prepare("SELECT * FROM course_cursor ORDER BY profile_id,course_id")
      .all(),
    documents: f.db
      .prepare("SELECT * FROM ink_document ORDER BY document_id")
      .all(),
    strokes: f.db.prepare("SELECT * FROM ink_stroke ORDER BY stroke_id").all(),
    profiles: f.db
      .prepare(
        "SELECT profile_id,generation,undo_run_id FROM profile ORDER BY profile_id",
      )
      .all(),
  });
  const before = protectedRows();
  const directory = controllerDirectory(f.controller);
  const profileB = directory.profiles.find(
    (profile) => profile.edit.owner.profileId === ownerB.profileId,
  );
  assert.ok(profileB);
  const teaching = f.teachingDeliveries.length;
  const result = await f.controller.administer({
    kind: "setAvatar",
    directory: directory.administration,
    target: profileB.edit,
    avatarId: "fox",
  });
  assert.equal(result.kind, "visible");
  assert.deepEqual(protectedRows(), before);
  assert.equal(f.teachingDeliveries.length, teaching);
  assert.deepEqual(
    controllerDirectory(f.controller).selection,
    directory.selection,
  );
  f.controller.append(contact, [{ x: 150, y: 110, elapsedMs: 10 }]);
  f.controller.finish(contact, "finished");
  await f.controller.interrupt();
  const saved = await f.current(f.app);
  const stroke = saved.snapshot.strokes.find(
    (value) => value.strokeId === contact.strokeId,
  );
  assert.ok(stroke);
  assert.equal(stroke.pointCount, 2);
  assert.equal(stroke.status, "finished");
  assert.equal((await choose(f.controller, ownerB)).kind, "visible");
  assert.equal((await choose(f.controller, ownerA)).kind, "visible");
  await resumeController(f.controller);
  const after = await f.current(f.app);
  assert.equal(after.projection.runId, saved.projection.runId);
  assert.equal(after.projection.turn.id, saved.projection.turn.id);
  assert.deepEqual(after.snapshot.strokes, saved.snapshot.strokes);
  const stable = after.snapshot;
  f.controller.append(contact, [{ x: 200, y: 120, elapsedMs: 20 }]);
  f.controller.finish(contact, "finished");
  await f.controller.interrupt();
  assert.deepEqual((await f.current(f.app)).snapshot.strokes, stable.strokes);
  const returned =
    f.controller.committed.getSnapshot().visible.data?.projection;
  assert.ok(returned?.kind === "writing");
  const undo = returned.actions.find(
    (action) => action.intent.kind === "undoAdvance",
  );
  assert.ok(undo);
  assert.equal(await f.controller.enter(undo), true);
  const restored =
    f.controller.committed.getSnapshot().visible.data?.projection;
  assert.ok(restored?.kind === "writing");
  assert.equal(restored.turn.id, "fixture.writing.turn.2");
  assert.equal(restored.runId, saved.projection.runId);
  assert.equal(
    f.db.prepare("SELECT count(*) AS count FROM advance_withdrawal").get()
      ?.count,
    1,
  );
  assert.ok(
    f.controller
      .getBoard()
      .some((value) =>
        value.strokes.some(
          (stroke) =>
            stroke.strokeId === contact.strokeId && stroke.points.length === 2,
        ),
      ),
  );
});

for (const boundary of ["beforeCommit", "afterCommit", "workerLoss"] as const) {
  test(`controller creates once with exact administrative Retry after ${boundary}`, async (t) => {
    const f = await controllerFixture(t);
    const ownerA = controllerDirectory(f.controller).selection.owner;
    let armed = true;
    if (boundary === "beforeCommit") {
      f.beforeAdmin(async () => {
        f.sqlHook(async (sql, work) => {
          if (sql === "COMMIT" && armed) {
            armed = false;
            throw new Error("Pre-COMMIT administration failure");
          }
          return work();
        });
      });
    } else {
      f.afterAdmin(async () => {
        if (!armed) return;
        armed = false;
        if (boundary === "workerLoss") f.lose();
        throw new Error("Committed administrative acknowledgement lost");
      });
    }
    const directory = controllerDirectory(f.controller);
    assert.equal(
      (
        await f.controller.administer({
          kind: "createAndSelect",
          directory: directory.administration,
          preferences: { avatarId: "bear" },
        })
      ).kind,
      "held",
    );
    assert.equal(f.controller.getState().operation.kind, "adminFailed");
    assert.equal(f.controller.canWrite(), false);
    const saved = await f.app.readDirectory();
    assert.equal(saved.profiles.length, boundary === "beforeCommit" ? 1 : 2);
    if (boundary === "beforeCommit")
      assert.deepEqual(saved.selection.owner, ownerA);
    const original = f.administrativeDeliveries[0];
    assert.ok(original);
    await f.controller.retry();
    const visible = controllerDirectory(f.controller);
    assert.equal(visible.profiles.length, 2);
    assert.equal(visible.selection.revision, "1");
    assert.notDeepEqual(visible.selection.owner, ownerA);
    assert.equal(f.controller.getState().operation.kind, "idle");
    assert.deepEqual(await f.app.readDirectory(), visible);
    if (boundary === "workerLoss") {
      assert.deepEqual(f.events.slice(-3), [
        "open:warm",
        "recover:administration",
        "reconcile",
      ]);
      assert.equal(f.administrativeDeliveries.length, 1);
    } else {
      assert.equal(f.administrativeDeliveries.length, 2);
      assert.deepEqual(f.administrativeDeliveries[1], original);
    }
    assert.equal(
      f.db.prepare("SELECT count(*) AS count FROM profile").get()?.count,
      2,
    );
    assert.equal(
      f.db
        .prepare(
          "SELECT count(*) AS count FROM profile_administration_receipt WHERE command_id=?",
        )
        .get(original.commandId)?.count,
      1,
    );
  });
}

test("committed B waits behind failed canonical restoration and Retry only adopts the saved selection", async (t) => {
  const f = await controllerFixture(t, { deferOpen: true });
  const ownerA = (await f.app.readDirectory()).selection.owner;
  const { hash } = await import("../storage/support.ts");
  await changeProfile(f.app, f.ids, hash, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  await f.start(f.app);
  const ownerB = (await f.app.readDirectory()).selection.owner;
  await changeProfile(f.app, f.ids, hash, (directory) => ({
    kind: "selectProfile",
    directory: directory.administration,
    target: ownerA,
  }));
  await f.controller.open();
  const old = f.controller.committed.getSnapshot().visible.data;
  const oldBoard = f.controller.getBoard();
  const entered = deferred(),
    release = deferred();
  let armed = true;
  f.beforeInkRead(async (input) => {
    if (!armed || input.selection.owner.profileId !== ownerB.profileId) return;
    armed = false;
    entered.release();
    await release.promise;
    throw new Error("Incoming canonical document unavailable");
  });
  const selecting = choose(f.controller, ownerB);
  await entered.promise;
  assert.deepEqual((await f.app.readDirectory()).selection.owner, ownerB);
  assert.strictEqual(f.controller.committed.getSnapshot().visible.data, old);
  assert.deepEqual(f.controller.getBoard(), oldBoard);
  assert.equal(f.controller.canWrite(), false);
  release.release();
  assert.equal((await selecting).kind, "held");
  assert.equal(f.controller.getState().operation.kind, "adoptionFailed");
  const selection = (await f.app.readDirectory()).selection;
  await f.controller.retry();
  assert.equal(f.administrativeDeliveries.length, 1);
  assert.deepEqual(controllerDirectory(f.controller).selection, selection);
  assert.deepEqual(controllerDirectory(f.controller).selection.owner, ownerB);
  assert.equal(f.controller.getState().operation.kind, "idle");
  assert.ok(
    f.controller
      .getBoard()
      .every((entry) => entry.snapshot.token.profileId === ownerB.profileId),
  );
});

test("a superseded administrative receipt resolves without adopting its retired B lifetime", async (t) => {
  const f = await controllerFixture(t);
  const ownerA = controllerDirectory(f.controller).selection.owner;
  const { hash } = await import("../storage/support.ts");
  let armed = true;
  f.afterAdmin(async () => {
    if (!armed) return;
    armed = false;
    await changeProfile(f.app, f.ids, hash, (directory) => ({
      kind: "selectProfile",
      directory: directory.administration,
      target: ownerA,
    }));
  });
  const directory = controllerDirectory(f.controller);
  const result = await f.controller.administer({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  });
  assert.equal(result.kind, "resolved");
  assert.equal(f.controller.getState().operation.kind, "rejected");
  assert.deepEqual(
    controllerDirectory(f.controller).selection,
    directory.selection,
  );
  assert.equal(f.controller.canWrite(), false);
  await f.controller.retry();
  const adopted = controllerDirectory(f.controller);
  assert.deepEqual(adopted.selection.owner, ownerA);
  assert.equal(adopted.selection.revision, "2");
  assert.equal(adopted.profiles.length, 2);
  assert.equal(f.administrativeDeliveries.length, 1);
});

test("ordinary cold opening retains actual stored recovery through one held Retry read and restores canonical work", async (t) => {
  const f = await controllerFixture(t, { deferOpen: true });
  const saved = await f.current(f.app);
  f.db.exec(
    "CREATE TEMP TABLE opening_saved_cursor AS SELECT * FROM course_cursor",
  );
  let reads = 0;
  let holdNext = false;
  const entered = deferred();
  const release = deferred();
  f.beforeRead(async () => {
    reads++;
    if (reads === 1) f.db.exec("DELETE FROM course_cursor");
    if (holdNext) {
      holdNext = false;
      entered.release();
      await release.promise;
    }
  });
  await f.controller.open();
  const failed = f.controller.committed.getSnapshot();
  const failure = failed.recovery;
  assert.ok(
    failure,
    JSON.stringify({
      operation: f.controller.getState().operation,
      reads,
      events: f.events,
      readStatus: failed.read.status,
    }),
  );
  assert.equal(failure.code, "invalid-position");
  assert.equal(
    failure.message,
    "Saved teaching and its exact content package could not be verified.",
  );
  assert.strictEqual(failed.read.error, failure);
  assert.equal(failed.visible.data, undefined);
  assert.equal(f.controller.getState().operation.kind, "openingFailed");
  assert.equal(f.controller.canWrite(), false);
  assert.equal(reads, 1);
  f.db.exec("INSERT INTO course_cursor SELECT * FROM opening_saved_cursor");
  holdNext = true;
  const retrying = f.controller.retry();
  await entered.promise;
  assert.deepEqual(f.controller.getState().operation, { kind: "opening" });
  assert.strictEqual(f.controller.committed.getSnapshot().recovery, failure);
  assert.equal(
    f.controller.committed.getSnapshot().read.fetchStatus,
    "fetching",
  );
  assert.equal(f.controller.committed.getSnapshot().visible.data, undefined);
  assert.equal(f.controller.canWrite(), false);
  release.release();
  await retrying;
  assert.equal(reads, 2);
  assert.deepEqual(f.controller.getState().operation, { kind: "idle" });
  assert.equal(f.controller.committed.getSnapshot().recovery, null);
  const restored =
    f.controller.committed.getSnapshot().visible.data?.projection;
  assert.equal(restored?.kind, "writing");
  if (restored?.kind !== "writing")
    assert.fail("Actual saved writing is required");
  assert.equal(restored.turn.id, "fixture.writing.turn.3");
  const canonical = await f.current(f.app);
  assert.deepEqual(canonical.snapshot.strokes, saved.snapshot.strokes);
  assert.deepEqual(canonical.snapshot.histories, saved.snapshot.histories);
  assert.deepEqual(f.teachingDeliveries, []);
});

test("failed cold opening exposes recovery without teaching or input and retries through the real replacement connection", async (t) => {
  const f = await controllerFixture(t, { deferOpen: true });
  const before = f.db.prepare("SELECT * FROM task_run ORDER BY run_id").all();
  f.db.exec("PRAGMA user_version=13");
  f.lose();
  await f.controller.open();
  const state = f.controller.getState();
  assert.equal(state.operation.kind, "openingFailed");
  if (state.operation.kind !== "openingFailed")
    assert.fail("Opening recovery required");
  assert.match(state.operation.message, /Unsupported database version/);
  assert.equal(f.controller.committed.getSnapshot().visible.data, undefined);
  assert.equal(f.controller.canWrite(), false);
  assert.deepEqual(
    f.db.prepare("SELECT * FROM task_run ORDER BY run_id").all(),
    before,
  );
  assert.equal(f.db.prepare("PRAGMA user_version").get()?.user_version, 13);
  f.db.exec("PRAGMA user_version=12");
  f.lose();
  await f.controller.retry();
  assert.equal(f.controller.getState().operation.kind, "idle");
  assert.equal(
    f.controller.committed.getSnapshot().visible.data?.projection.kind,
    "writing",
  );
});

test("same-selection connection replacement retires a delayed restore and old contact callbacks", async (t) => {
  const f = await controllerFixture(t);
  const selected = controllerDirectory(f.controller).selection;
  const original = f.controller.committed.getSnapshot().visible.data;
  const board = f.board;
  const contact = f.controller.begin(
    board.snapshot.token.documentId,
    { x: 100, y: 100, elapsedMs: 0 },
    performance.now(),
  );
  assert.ok(contact);
  const entered = deferred(),
    release = deferred();
  let armed = true;
  f.beforeRead(async () => {
    if (!armed) return;
    armed = false;
    entered.release();
    await release.promise;
  });
  const reading = f.controller.retry();
  await entered.promise;
  f.lose();
  release.release();
  await reading;
  assert.strictEqual(
    f.controller.committed.getSnapshot().visible.data,
    original,
  );
  assert.equal(f.controller.canWrite(), false);
  await f.controller.retry();
  assert.deepEqual(controllerDirectory(f.controller).selection, selected);
  const before = (await f.current(f.app)).snapshot;
  f.controller.append(contact, [{ x: 200, y: 200, elapsedMs: 20 }]);
  f.controller.finish(contact, "finished");
  await f.controller.interrupt();
  const after = (await f.current(f.app)).snapshot;
  assert.deepEqual(after, before);
  assert.equal(
    after.strokes.find((stroke) => stroke.strokeId === contact.strokeId)
      ?.pointCount,
    1,
  );
});

test("reset drains active contact then retires its visible documents, cached directory and delayed callbacks", async (t) => {
  const f = await controllerFixture(t);
  const directory = controllerDirectory(f.controller);
  const profile = directory.profiles.find(
    (profile) =>
      profile.edit.owner.profileId === directory.selection.owner.profileId,
  );
  assert.ok(profile);
  const token = f.board.snapshot.token;
  const contact = f.controller.begin(
    token.documentId,
    { x: 30, y: 40, elapsedMs: 0 },
    performance.now(),
  );
  assert.ok(contact);
  f.controller.append(contact, [{ x: 50, y: 60, elapsedMs: 10 }]);
  const outcome = await f.controller.administer({
    kind: "resetProfile",
    directory: directory.administration,
    target: profile.edit,
  });
  assert.equal(outcome.kind, "visible");
  const reset = controllerDirectory(f.controller);
  assert.equal(
    reset.selection.owner.profileId,
    directory.selection.owner.profileId,
  );
  assert.equal(reset.selection.owner.generation, "1");
  assert.equal(
    f.controller.committed.getSnapshot().visible.data?.projection.kind,
    "entry",
  );
  assert.deepEqual(f.controller.getBoard(), []);
  assert.deepEqual(f.controller.practiceControls.getSnapshot(), {
    kind: "readOnly",
  });
  const before = f.db.prepare("SELECT * FROM ink_stroke").all();
  f.controller.append(contact, [{ x: 70, y: 80, elapsedMs: 20 }]);
  f.controller.finish(contact, "finished");
  await f.controller.interrupt();
  assert.deepEqual(f.db.prepare("SELECT * FROM ink_stroke").all(), before);
  assert.deepEqual(before, []);
  assert.equal(
    f.db.prepare("SELECT count(*) AS count FROM task_run").get()?.count,
    0,
  );
  for (const query of f.queryClient.getQueryCache().getAll()) {
    if (query.meta?.readingDomain === "directory")
      assert.equal(query.meta.generation, "1");
  }
});

test("unselected removal returns before pausing or draining the selected child's active ink", async (t) => {
  const f = await controllerFixture(t);
  const directoryA = controllerDirectory(f.controller),
    ownerA = directoryA.selection.owner;
  const created = await f.controller.administer({
    kind: "createAndSelect",
    directory: directoryA.administration,
    preferences: { avatarId: "fox" },
  });
  assert.equal(created.kind, "visible");
  const directoryB = controllerDirectory(f.controller),
    ownerB = directoryB.selection.owner;
  await choose(f.controller, ownerA);
  await resumeController(f.controller);
  const directory = controllerDirectory(f.controller),
    targetB = directory.profiles.find(
      (profile) => profile.edit.owner.profileId === ownerB.profileId,
    );
  assert.ok(targetB);
  const contact = f.controller.begin(
    f.board.snapshot.token.documentId,
    { x: 20, y: 20, elapsedMs: 0 },
    performance.now(),
  );
  assert.ok(contact);
  const before = f.controller.committed.getSnapshot().visible.data;
  const deliveries = f.administrativeDeliveries.length;
  const outcome = await f.controller.administer({
    kind: "resetProfile",
    directory: directory.administration,
    target: targetB.edit,
  });
  assert.deepEqual(outcome, { kind: "held" });
  assert.equal(f.administrativeDeliveries.length, deliveries);
  assert.strictEqual(f.controller.committed.getSnapshot().visible.data, before);
  assert.equal(f.controller.canWrite(), true);
  f.controller.append(contact, [{ x: 25, y: 25, elapsedMs: 10 }]);
  f.controller.finish(contact, "finished");
  await f.controller.interrupt();
  assert.ok(
    f.controller
      .getBoard()
      .some((board) =>
        board.strokes.some(
          (stroke) =>
            stroke.strokeId === contact.strokeId && stroke.points.length === 2,
        ),
      ),
  );
});

test("known deletion clears outgoing visible ink and retains only its redacted receipt when incoming restore fails", async (t) => {
  const f = await controllerFixture(t),
    ownerA = controllerDirectory(f.controller).selection.owner;
  await f.controller.administer({
    kind: "createAndSelect",
    directory: controllerDirectory(f.controller).administration,
    preferences: { avatarId: "owl" },
  });
  const ownerB = controllerDirectory(f.controller).selection.owner;
  await f.start(f.app);
  await f.controller.retry();
  const bInk = await f.current(f.app);
  await choose(f.controller, ownerA);
  const directory = controllerDirectory(f.controller),
    target = directory.profiles.find(
      (profile) => profile.edit.owner.profileId === ownerA.profileId,
    );
  assert.ok(target);
  let fail = true;
  f.beforeInkRead(async (input) => {
    if (fail && input.selection.owner.profileId === ownerB.profileId) {
      fail = false;
      throw new Error("Incoming canonical restoration unavailable");
    }
  });
  const outcome = await f.controller.administer({
    kind: "deleteProfile",
    directory: directory.administration,
    target: target.edit,
    successor: { kind: "existing", owner: ownerB },
  });
  assert.deepEqual(outcome, { kind: "held" });
  const failed = f.controller.getState().operation;
  assert.equal(failed.kind, "adoptionFailed");
  if (failed.kind !== "adoptionFailed")
    assert.fail("Known redacted receipt required");
  assert.equal("selection" in failed.receipt, false);
  assert.equal("command" in failed, false);
  assert.deepEqual(failed.receipt.effect, { kind: "deleted" });
  assert.equal(f.controller.committed.getSnapshot().visible.data, undefined);
  assert.deepEqual(f.controller.getBoard(), []);
  assert.equal(f.controller.canWrite(), false);
  assert.equal(
    (await f.app.readDirectory()).profiles.some(
      (profile) => profile.edit.owner.profileId === ownerA.profileId,
    ),
    false,
  );
  const delivered = f.administrativeDeliveries.length;
  await f.controller.retry();
  assert.equal(f.controller.getState().operation.kind, "idle");
  assert.equal(f.administrativeDeliveries.length, delivered);
  assert.deepEqual(controllerDirectory(f.controller).selection.owner, ownerB);
  assert.deepEqual(
    (await f.current(f.app)).snapshot.strokes,
    bInk.snapshot.strokes,
  );
  assert.ok(f.controller.getBoard().length > 0);
});

for (const boundary of ["beforeCommit", "afterCommit", "workerLoss"] as const) {
  test(`final deletion uses one explicit fresh replacement and exact Retry after ${boundary}`, async (t) => {
    const f = await controllerFixture(t),
      directory = controllerDirectory(f.controller);
    const target = directory.profiles.find(
      (profile) =>
        profile.edit.owner.profileId === directory.selection.owner.profileId,
    );
    assert.ok(target);
    let armed = true;
    if (boundary === "beforeCommit") {
      f.beforeAdmin(async () =>
        f.sqlHook(async (sql, work) => {
          if (sql === "COMMIT" && armed) {
            armed = false;
            throw new Error("Before removal commit");
          }
          return work();
        }),
      );
    } else {
      f.afterAdmin(async () => {
        if (!armed) return;
        armed = false;
        if (boundary === "workerLoss") f.lose();
        throw new Error("Removal acknowledgement lost");
      });
    }
    const outcome = await f.controller.administer({
      kind: "deleteProfile",
      directory: directory.administration,
      target: target.edit,
      successor: { kind: "replacement", preferences: { avatarId: "cat" } },
    });
    assert.deepEqual(outcome, { kind: "held" });
    assert.equal(f.controller.getState().operation.kind, "adminFailed");
    const command = f.administrativeDeliveries.at(-1);
    assert.ok(
      command?.version === 2 && command.payload.kind === "deleteProfile",
    );
    await f.controller.retry();
    assert.equal(f.controller.getState().operation.kind, "idle");
    const restored = controllerDirectory(f.controller);
    assert.equal(restored.profiles.length, 1);
    assert.notEqual(
      restored.selection.owner.profileId,
      directory.selection.owner.profileId,
    );
    assert.deepEqual(restored.selection.owner, command.payload.successor.owner);
    assert.equal(restored.selection.owner.generation, "0");
    assert.deepEqual(f.controller.getBoard(), []);
    assert.equal(
      f.db.prepare("SELECT count(*) AS count FROM task_run").get()?.count,
      0,
    );
    if (boundary === "workerLoss")
      assert.equal(f.administrativeDeliveries.length, 1);
    else assert.deepEqual(f.administrativeDeliveries.at(-1), command);
  });
}

for (const workerLoss of [false, true]) {
  test(`lost reset acknowledgement reloads the resulting generation after stale Retry with workerLoss=${workerLoss}`, async (t) => {
    const f = await controllerFixture(t),
      directory = controllerDirectory(f.controller);
    const target = directory.profiles.find(
      (profile) =>
        profile.edit.owner.profileId === directory.selection.owner.profileId,
    );
    assert.ok(target);
    let armed = true;
    f.afterAdmin(async () => {
      if (!armed) return;
      armed = false;
      if (workerLoss) f.lose();
      throw new Error("Reset acknowledgement lost");
    });
    const outcome = await f.controller.administer({
      kind: "resetProfile",
      directory: directory.administration,
      target: target.edit,
    });
    assert.deepEqual(outcome, { kind: "held" });
    assert.equal(f.controller.getState().operation.kind, "adminFailed");
    assert.equal((await f.app.readDirectory()).selection.owner.generation, "1");
    await f.controller.retry();
    assert.equal(f.controller.getState().operation.kind, "idle");
    assert.equal(
      controllerDirectory(f.controller).selection.owner.generation,
      "1",
    );
    assert.deepEqual(f.controller.getBoard(), []);
    assert.equal(
      f.db.prepare("SELECT count(*) AS count FROM task_run").get()?.count,
      0,
    );
    assert.equal(
      f.queryClient
        .getQueryCache()
        .getAll()
        .some(
          (query) =>
            query.meta?.profileId === target.edit.owner.profileId &&
            query.meta.generation === "0",
        ),
      false,
    );
  });
}

test(
  "V2 sound responses expose read-only writing readiness and reject contacts until the source moves to practice",
  { timeout: 30000 },
  async (t) => {
    const envelope = await syntheticPlanEnvelope();
    const content = await parseRuntimePackage(envelope, hash);
    if (content.body.coverage !== "course-development-v2")
      throw new Error("V2 synthetic package missing");
    const lesson = content.body.lessons[0];
    assert.ok(lesson);
    const writing = lesson.tasks.find(
      (entry) => entry.kind === "writingPracticePlanV2",
    );
    assert.ok(writing && writing.kind === "writingPracticePlanV2");
    const task = { ...writing.task, number: 1 };
    const body = {
      ...content.body,
      lessons: [
        {
          ...lesson,
          lessonTasks: [
            {
              id: task.id,
              number: 1,
              title: task.title,
              optional: true,
              artKey: "writing",
            },
          ],
          tasks: [{ kind: "writingPracticePlanV2", task }],
        },
      ],
    };
    const isolated = await parseRuntimePackage(
      { formatVersion: 1, body, packageHash: await hash(canonical(body)) },
      hash,
    );
    const f = await controllerFixture(t, { content: isolated, start: false });
    assert.equal(f.controller.canWrite(), false);
    const entry = f.controller.committed.getSnapshot().visible.data?.projection;
    assert.ok(entry && entry.kind !== "recovery");
    const start = entry.actions.find(
      (action) => action.intent.kind === "start",
    );
    assert.ok(start);
    assert.equal(await f.controller.enter(start), true);
    assert.equal(f.controller.canWrite(), true);
    function current() {
      const p = f.controller.committed.getSnapshot().visible.data?.projection;
      if (!p || p.kind !== "writing")
        throw new Error("Writing projection missing");
      return p;
    }
    const model = current();
    assert.equal(model.turn.presentation.kind, "writing");
    const next = model.actions.find(
      (action) => action.intent.kind === "continue",
    );
    assert.ok(next);
    f.controller.act(next);
    await waitForPaint(
      f.controller,
      () =>
        f.controller.getState().operation.kind === "idle" &&
        current().turn.id.endsWith(".respond"),
    );
    assert.equal(f.controller.canWrite(), false);
    const rows = f.controller.getBoard();
    assert.equal(rows.length, 2);
    assert.ok(rows.every((row) => !row.snapshot.writable));
    const before = f.db
        .prepare("SELECT * FROM ink_document ORDER BY document_id")
        .all(),
      deliveries = f.deliveries();
    for (const row of rows)
      assert.equal(
        f.controller.begin(
          row.snapshot.token.documentId,
          { x: 100, y: 200, elapsedMs: 0 },
          performance.now(),
        ),
        null,
      );
    assert.equal(f.deliveries(), deliveries);
    assert.deepEqual(
      f.db.prepare("SELECT * FROM ink_document ORDER BY document_id").all(),
      before,
    );
    const respond = current().actions.find(
      (action) => action.intent.kind === "continue",
    );
    assert.ok(respond);
    f.controller.act(respond);
    await waitForPaint(
      f.controller,
      () =>
        f.controller.getState().operation.kind === "idle" &&
        current().turn.id.endsWith(".trace"),
    );
    assert.equal(f.controller.canWrite(), true);
    assert.equal(
      f.controller.getBoard().filter((row) => row.snapshot.writable).length,
      1,
    );
  },
);
