import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  canonical,
  parseDevelopmentPackage,
  parseProjection,
  prepareCommand,
  prepareWritingCommand,
} from "../../packages/teaching/src/index.ts";
import type {
  AvailableAction,
  CommittedProjection,
  TeachingIntent,
  WritingApplication,
} from "../../packages/teaching/src/index.ts";
import { writingFixture } from "../teaching/writing-fixture.ts";
import { hash, storageFixture } from "./support.ts";

function ready(projection: CommittedProjection) {
  if (projection.kind === "recovery") throw Error(projection.message);
  return projection;
}
function writingCatalog(projection: CommittedProjection) {
  const task = ready(projection).catalog.find((entry) => entry.number === 6);
  if (!task) throw Error("Writing catalog entry is missing");
  return task;
}
async function act({
  app,
  kind,
  ids,
  matches = () => true,
}: {
  app: WritingApplication;
  kind: TeachingIntent["kind"];
  ids: () => string;
  matches?: (action: AvailableAction) => boolean;
}) {
  const projection = ready(await app.read());
  const action = projection.actions.find(
    (entry) => entry.intent.kind === kind && matches(entry),
  );
  if (!action) throw Error(`Missing ${kind} at ${projection.kind}`);
  const command =
    projection.kind === "writing" || projection.kind === "writingResult"
      ? await prepareWritingCommand({
          projection,
          action,
          barrier: { kind: "writing", documents: projection.documents },
          ids,
          hash,
        })
      : await prepareCommand({
          projection,
          request: { kind: "action", action },
          ids,
          hash,
        });
  const result = await app.dispatch(command);
  assert.equal(result.kind, "committed");
}
async function reopen(app: WritingApplication) {
  const opening = await app.openRecovery({ kind: "cold" });
  return ready(
    await app.reconcileRecovery({
      recoveryId: opening.recoveryId,
      choice: { kind: "cold" },
    }),
  );
}

test("verified Skip survives task switch and reopen while an unfinished replay keeps Skip and Resume", async (t) => {
  const content = await parseDevelopmentPackage(
    JSON.parse(
      await readFile("tests/fixtures/writing-development-package.json", "utf8"),
    ),
    hash,
  );
  const f = await storageFixture(t, content);
  const first = f.connect();
  const initial = ready(await first.app.open());
  const writingId = writingCatalog(initial).id;
  const otherId = initial.catalog.find((task) => task.number === 2)?.id;
  if (!otherId) throw Error("Other task is missing");
  const writingAction = (action: AvailableAction) =>
    "taskId" in action.intent && action.intent.taskId === writingId;
  const otherAction = (action: AvailableAction) =>
    "taskId" in action.intent && action.intent.taskId === otherId;
  await act({
    app: first.app,
    kind: "start",
    ids: f.ids,
    matches: writingAction,
  });
  await act({ app: first.app, kind: "skipWriting", ids: f.ids });
  const terminal = ready(parseProjection(await first.app.read()));
  assert.deepEqual(writingCatalog(terminal), {
    ...writingCatalog(initial),
    skipped: true,
  });
  assert.equal(
    canonical(terminal.catalog.filter((task) => task.id !== writingId)),
    canonical(initial.catalog.filter((task) => task.id !== writingId)),
  );
  assert.equal(
    first.db.prepare("SELECT outcome FROM task_result").get()?.outcome,
    "skipped",
  );
  await act({
    app: first.app,
    kind: "start",
    ids: f.ids,
    matches: otherAction,
  });
  assert.deepEqual(
    writingCatalog(await first.app.read()),
    writingCatalog(terminal),
  );
  const second = f.connect();
  const switched = await reopen(second.app);
  assert.equal(switched.kind, "teaching");
  assert.deepEqual(writingCatalog(switched), writingCatalog(terminal));
  await act({
    app: second.app,
    kind: "start",
    ids: f.ids,
    matches: writingAction,
  });
  const replay = ready(await second.app.read());
  if (replay.kind !== "writing") throw Error("Unfinished replay is missing");
  const replayTask = writingCatalog(replay);
  assert.deepEqual(replayTask, {
    ...writingCatalog(terminal),
    savedSessionId: replay.sessionId,
  });
  await act({
    app: second.app,
    kind: "resume",
    ids: f.ids,
    matches: otherAction,
  });
  const third = f.connect();
  const savedReplay = await reopen(third.app);
  assert.deepEqual(writingCatalog(savedReplay), replayTask);
  assert.equal(
    savedReplay.actions.some(
      (action) => action.intent.kind === "resume" && writingAction(action),
    ),
    true,
  );
  await act({
    app: third.app,
    kind: "resume",
    ids: f.ids,
    matches: writingAction,
  });
  const resumed = ready(await third.app.read());
  if (resumed.kind !== "writing") throw Error("Resumed writing is missing");
  assert.equal(resumed.runId, replay.runId);
  assert.deepEqual(
    resumed.documents.map((document) => document.documentId),
    replay.documents.map((document) => document.documentId),
  );
  assert.equal(writingCatalog(resumed).skipped, true);
});

test("catalog upgrades Skip to Completed, keeps Completed over skipped replay, and rejects corrupt support", async (t) => {
  const f = await storageFixture(t, await writingFixture());
  const first = f.connect();
  await first.app.open();
  await act({ app: first.app, kind: "start", ids: f.ids });
  await act({ app: first.app, kind: "skipWriting", ids: f.ids });
  assert.equal(writingCatalog(await first.app.read()).skipped, true);
  const second = f.connect();
  assert.equal(writingCatalog(await reopen(second.app)).skipped, true);
  await act({ app: second.app, kind: "replay", ids: f.ids });
  assert.equal(writingCatalog(await second.app.read()).skipped, true);
  for (const kind of [
    "continue",
    "continue",
    "confirmTracing",
    "confirmIndependent",
    "continue",
    "confirmTracing",
    "confirmIndependent",
  ] satisfies TeachingIntent["kind"][])
    await act({ app: second.app, kind, ids: f.ids });
  const completed = writingCatalog(parseProjection(await second.app.read()));
  assert.equal(completed.completed, true);
  assert.equal("skipped" in completed, false);
  await act({ app: second.app, kind: "replay", ids: f.ids });
  assert.equal(writingCatalog(await second.app.read()).completed, true);
  await act({ app: second.app, kind: "skipWriting", ids: f.ids });
  const skippedReplay = ready(await second.app.read());
  if (skippedReplay.kind !== "writingResult")
    throw Error("Skip result missing");
  assert.equal(skippedReplay.outcome, "skipped");
  assert.deepEqual(writingCatalog(skippedReplay), completed);
  const third = f.connect();
  assert.deepEqual(writingCatalog(await reopen(third.app)), completed);
  first.db
    .prepare(
      "UPDATE task_result SET outcome='skipped',accepted_credit_id=(SELECT credit_id FROM task_credit WHERE outcome='skipped' ORDER BY credit_id LIMIT 1)",
    )
    .run();
  assert.equal((await third.app.read()).kind, "recovery");
});
