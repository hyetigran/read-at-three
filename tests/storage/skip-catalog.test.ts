import {
  executeTeaching,
  prepareSelectedTeaching,
  selectedProjection,
} from "./selected-support.ts";

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
  SelectedApplication,
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
  app: SelectedApplication;
  kind: TeachingIntent["kind"];
  ids: () => string;
  matches?: (action: AvailableAction) => boolean;
}) {
  const projection = ready(await selectedProjection(app));
  const action = projection.actions.find(
    (entry) => entry.intent.kind === kind && matches(entry),
  );
  if (!action) throw Error(`Missing ${kind} at ${projection.kind}`);
  const command =
    projection.kind === "writing" || projection.kind === "writingResult"
      ? await prepareSelectedTeaching(app, async () =>
          prepareWritingCommand({
            projection,
            action,
            barrier: { kind: "writing", documents: projection.documents },
            ids,
            hash,
          }),
        )
      : await prepareSelectedTeaching(app, async () =>
          prepareCommand({
            projection,
            request: { kind: "action", action },
            ids,
            hash,
          }),
        );
  const result = await executeTeaching(app, command);
  assert.equal(result.kind, "committed");
}
async function reopen(app: SelectedApplication) {
  const opening = await app.openRecovery({ kind: "cold" });
  await app.reconcileRecovery({
    recoveryId: opening.recoveryId,
    choice: { kind: "cold" },
  });
  return ready(await selectedProjection(app));
}

test("verified Skip survives task switch and reopen while an unfinished replay keeps Skip and Resume", async (t) => {
  const content = await parseDevelopmentPackage(
    JSON.parse(
      await readFile("tests/fixtures/writing-development-package.json", "utf8"),
    ),
    hash,
  );
  const f = await storageFixture(t, content);
  const first = await f.connectReady();
  const initial = ready(await selectedProjection(first.app));
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
  const terminal = ready(parseProjection(await selectedProjection(first.app)));
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
    writingCatalog(await selectedProjection(first.app)),
    writingCatalog(terminal),
  );
  const second = await f.connectReady();
  const switched = await reopen(second.app);
  assert.equal(switched.kind, "teaching");
  assert.deepEqual(writingCatalog(switched), writingCatalog(terminal));
  await act({
    app: second.app,
    kind: "start",
    ids: f.ids,
    matches: writingAction,
  });
  const replay = ready(await selectedProjection(second.app));
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
  const third = await f.connectReady();
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
  const resumed = ready(await selectedProjection(third.app));
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
  const first = await f.connectReady();
  await selectedProjection(first.app);
  await act({ app: first.app, kind: "start", ids: f.ids });
  await act({ app: first.app, kind: "skipWriting", ids: f.ids });
  assert.equal(
    writingCatalog(await selectedProjection(first.app)).skipped,
    true,
  );
  const second = await f.connectReady();
  assert.equal(writingCatalog(await reopen(second.app)).skipped, true);
  await act({ app: second.app, kind: "replay", ids: f.ids });
  assert.equal(
    writingCatalog(await selectedProjection(second.app)).skipped,
    true,
  );
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
  const completed = writingCatalog(
    parseProjection(await selectedProjection(second.app)),
  );
  assert.equal(completed.completed, true);
  assert.equal("skipped" in completed, false);
  await act({ app: second.app, kind: "replay", ids: f.ids });
  assert.equal(
    writingCatalog(await selectedProjection(second.app)).completed,
    true,
  );
  await act({ app: second.app, kind: "skipWriting", ids: f.ids });
  const skippedReplay = ready(await selectedProjection(second.app));
  if (skippedReplay.kind !== "writingResult")
    throw Error("Skip result missing");
  assert.equal(skippedReplay.outcome, "skipped");
  assert.deepEqual(writingCatalog(skippedReplay), completed);
  const third = await f.connectReady();
  assert.deepEqual(writingCatalog(await reopen(third.app)), completed);
  first.db
    .prepare(
      "UPDATE task_result SET outcome='skipped',accepted_credit_id=(SELECT credit_id FROM task_credit WHERE outcome='skipped' ORDER BY credit_id LIMIT 1)",
    )
    .run();
  assert.equal((await selectedProjection(third.app)).kind, "recovery");
});
