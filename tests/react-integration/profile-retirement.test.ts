import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import {
  captureQueryPublication,
  committedTeachingQuery,
  createCommittedTeaching,
  historicalWorkQuery,
  retireProfileQueries,
  teachingQuery,
} from "@readatthree/react-integration";
import { profileFixture } from "../storage/profile-support.ts";
import { readEnvelope } from "./support.ts";

function deferred() {
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

const removalKinds: ("reset" | "delete")[] = ["reset", "delete"];
for (const removalKind of removalKinds)
  test(`retirement removes dormant other-child directory envelopes and target history while fencing held reads for ${removalKind}`, async (t) => {
    const f = await profileFixture(t);
    const { app } = f.connect();
    const ownerA = await f.setup(app);
    const created = await f.change(app, (directory) => ({
      kind: "createAndSelect",
      directory: directory.administration,
      preferences: { avatarId: "fox", displayName: ownerA.profileId },
    }));
    const selectionB = created.result.selection;
    const readB = await readEnvelope(
      app,
      { selection: selectionB, target: { kind: "cursor" } },
      f.content.body.courseId,
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    t.after(() => client.clear());
    const dormant = committedTeachingQuery(readB);
    client.getQueryCache().build(client, dormant).setData(readB);
    const oldAHistory = teachingQuery(
      {
        installationId: selectionB.installationId,
        kind: "personal",
        owner: ownerA,
      },
      ["old-a-history"],
    );
    const preservedBHistory = historicalWorkQuery({
      selection: selectionB,
      connection: 1,
      courseId: readB.courseId,
      packageHash: undefined,
      runId: "b-work",
    });
    client
      .getQueryCache()
      .build(client, oldAHistory)
      .setData({ strokes: ["private-a"] });
    client
      .getQueryCache()
      .build(client, preservedBHistory)
      .setData({ strokes: ["private-b"] });
    const entered = deferred(),
      release = deferred();
    const check = captureQueryPublication(client, selectionB.installationId);
    const held = client.query({
      ...teachingQuery(
        {
          installationId: selectionB.installationId,
          kind: "directory",
          owner: selectionB.owner,
        },
        ["held-b-directory"],
      ),
      queryFn: async () => {
        entered.release();
        await release.promise;
        check();
        return readB;
      },
    });
    const rejected = assert.rejects(held);
    await entered.promise;
    retireProfileQueries(client, {
      installationId: selectionB.installationId,
      owner: ownerA,
      kind: removalKind,
    });
    assert.equal(client.getQueryData(dormant.queryKey), undefined);
    assert.equal(client.getQueryData(oldAHistory.queryKey), undefined);
    assert.deepEqual(client.getQueryData(preservedBHistory.queryKey), {
      strokes: ["private-b"],
    });
    release.release();
    await rejected;
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(client.getQueryData(["held-b-directory"]), undefined);
    assert.throws(check, /retired/);
    assert.equal((await app.readDirectory()).profiles.length, 2);
  });

test("actual committed runtime clears visible data and prevents staged restoration from publishing after retirement", async (t) => {
  const f = await profileFixture(t),
    { app } = f.connect();
  await f.setup(app);
  const directory = await app.readDirectory();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  let hold = false,
    activated = 0;
  const entered = deferred(),
    release = deferred();
  const runtime = createCommittedTeaching({
    queryClient: client,
    repository: {
      read: (input) => readEnvelope(app, input, f.content.body.courseId),
      execute: (operation) => app.execute(operation),
      recoverTeaching: (input) => app.recoverTeaching(input),
    },
    stageRestore: async () => {
      if (hold) {
        entered.release();
        await release.promise;
      }
      return {
        activate() {
          activated++;
        },
      };
    },
  });
  t.after(() => {
    runtime.close();
    client.clear();
  });
  await runtime.read({
    expectation: { kind: "opening", selection: directory.selection },
  });
  assert.ok(runtime.view.getSnapshot().visible.data);
  hold = true;
  const reading = runtime.read({
    expectation: { kind: "opening", selection: directory.selection },
  });
  const rejected = assert.rejects(reading);
  await entered.promise;
  runtime.retireProfile({
    installationId: directory.selection.installationId,
    owner: directory.selection.owner,
    kind: "reset",
  });
  assert.equal(runtime.current(), undefined);
  assert.equal(runtime.view.getSnapshot().visible.data, undefined);
  assert.deepEqual(runtime.practiceControls.getSnapshot(), {
    kind: "readOnly",
  });
  release.release();
  await rejected;
  assert.equal(activated, 1);
  assert.equal(runtime.current(), undefined);
  assert.equal(
    client
      .getQueryCache()
      .getAll()
      .filter((query) => query.meta?.readingDomain === "directory").length,
    0,
  );
});

test("historical work publication joins the installation retirement lifetime without deleting another child's stored work", async (t) => {
  const f = await profileFixture(t),
    { app } = f.connect();
  await f.setup(app);
  await f.start(app);
  const selection = (await app.readDirectory()).selection;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  t.after(() => client.clear());
  const current = await f.current(app);
  const entered = deferred(),
    release = deferred();
  const check = captureQueryPublication(client, selection.installationId);
  const query = historicalWorkQuery({
    selection,
    connection: 1,
    courseId: f.content.body.courseId,
    packageHash: current.projection.packageHash,
    runId: current.projection.runId,
  });
  const held = client.query({
    ...query,
    queryFn: async () => {
      const saved = await app.readWork({
        selection,
        runId: current.projection.runId,
      });
      entered.release();
      await release.promise;
      check();
      return saved.value;
    },
  });
  const rejected = assert.rejects(held);
  await entered.promise;
  retireProfileQueries(client, {
    installationId: selection.installationId,
    owner: selection.owner,
    kind: "reset",
  });
  release.release();
  await rejected;
  assert.equal(client.getQueryData(query.queryKey), undefined);
  assert.equal(
    (await app.readWork({ selection, runId: current.projection.runId })).value
      .documents.length,
    2,
  );
});
