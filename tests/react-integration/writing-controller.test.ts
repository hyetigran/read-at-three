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
async function controllerFixture(t: Parameters<typeof practiceFixture>[0]) {
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
  const f = await practiceFixture(t),
    { app } = f.connect();
  await f.start(app);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  let deliveries = 0;
  const controller = createWritingController({
    client: {
      onLoss() {},
      close() {},
      connect: (opening) => app.openRecovery(opening),
      readInk: (input) => app.readInk(input),
      dispatchInk: (command) => {
        deliveries++;
        return app.dispatchInk(command);
      },
      recoverInk: (input) => app.recoverInk(input),
      reconcileRecovery: (input) => app.reconcileRecovery(input),
    },
    createTeaching: (stageRestore) =>
      createCommittedTeaching({
        queryClient,
        stageRestore,
        repository: {
          read: async () => ({
            courseId: f.content.body.courseId,
            projection: await app.read(),
          }),
          dispatch: (command) => app.dispatch(command),
          recoverTeaching: (input) => app.recoverTeaching(input),
          readPracticeControls: (binding) => app.readPracticeControls(binding),
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
  await controller.open();
  const board = controller.getBoard().find((value) => value.snapshot.writable);
  if (!board) throw new Error("Writable board required");
  return { ...f, app, controller, board, deliveries: () => deliveries };
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
    const first = f.controller.begin(f.board.snapshot.token.documentId, {
      x: 100,
      y: 100,
      elapsedMs: 0,
    });
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
    const second = f.controller.begin(f.board.snapshot.token.documentId, {
      x: 300,
      y: 100,
      elapsedMs: 0,
    });
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
  const old = f.controller.begin(token.documentId, {
    x: 100,
    y: 100,
    elapsedMs: 0,
  });
  if (!old) throw new Error("Old contact required");
  await f.controller.interrupt();
  const current = f.controller.begin(token.documentId, {
    x: 300,
    y: 100,
    elapsedMs: 0,
  });
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
