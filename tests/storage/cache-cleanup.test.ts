import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { installationFixture } from "./installation-support.ts";
import {
  parseCounter,
  parseId,
  parseLessonFilesCommand,
} from "../../packages/teaching/src/index.ts";

async function cancelledDownload(t: Parameters<typeof installationFixture>[0]) {
  const f = await installationFixture(t, "completeLessons");
  const first = f.connect();
  await first.app.initialInstall(await f.command(first.app));
  await f.until(first.app, "activated");
  const release = await f.anotherRelease("fixture.release.cleanup");
  const connection = f.connect(undefined, {
    publicationHash: release.target,
    releaseId: release.releaseId,
  });
  let view = await connection.app.readLessonFiles();
  if (view.offer.kind !== "available") throw new Error("Expected offer");
  const installationId = (await connection.app.readDirectory()).administration
    .installationId;
  await connection.app.changeLessonFiles(
    parseLessonFilesCommand({
      version: 1,
      family: "lesson-files",
      installationId,
      commandId: "cleanup-download",
      expected: view.activation,
      action: { kind: "download", target: view.offer.target },
    }),
  );
  for (let attempt = 0; attempt < 300; attempt++) {
    view = await connection.app.readLessonFiles();
    if (view.offer.kind === "ready") break;
    await setImmediate();
  }
  if (view.offer.kind !== "ready") throw new Error("Expected ready download");
  await connection.app.changeLessonFiles(
    parseLessonFilesCommand({
      version: 1,
      family: "lesson-files",
      installationId,
      commandId: "cleanup-cancel",
      expected: view.activation,
      action: { kind: "cancel", download: view.offer.receipt },
    }),
  );
  return { f, connection, release, installationId };
}

test("explicit cache cleanup resumes its exact tombstone and never repeats completed deletion", async (t) => {
  const { f, connection, release } = await cancelledDownload(t);
  f.setOffline(true);
  const view = await connection.app.readCacheCleanup();
  assert.deepEqual(
    view.targets.map((target) => target.packageHash),
    [release.target],
  );
  const command = {
    version: 1 as const,
    installationId: view.installationId,
    targets: view.targets,
  };
  const activation = connection.db
    .prepare("SELECT * FROM course_activation")
    .all();
  const commands = connection.db
    .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
    .all();
  let erases = 0;
  f.setEraseHook(async ({ stage }) => {
    if (stage !== "after") return;
    erases++;
    throw new Error("Injected cache erase interruption");
  });
  await assert.rejects(connection.app.cleanupCache(command), /interruption/);
  assert.equal(erases, 1);
  const tombstone = connection.db
    .prepare("SELECT * FROM package_collection WHERE package_hash=?")
    .get(release.target);
  assert.equal(tombstone?.state, "collecting");
  assert.equal(
    String(tombstone?.revision),
    view.targets[0]?.collectionRevision,
  );
  f.setEraseHook(undefined);
  const result = await connection.app.cleanupCache(command);
  assert.equal(result.results[0]?.outcome, "collected");
  assert.equal(f.namespacePresent(release.target), false);
  f.setEraseHook(async () => {
    throw new Error("Completed cleanup must not erase again");
  });
  assert.deepEqual(await connection.app.cleanupCache(command), result);
  const reopened = f.connect();
  assert.deepEqual(await reopened.app.cleanupCache(command), result);
  assert.equal(f.namespacePresent(release.target), false);
  assert.deepEqual(
    connection.db.prepare("SELECT * FROM course_activation").all(),
    activation,
  );
  assert.deepEqual(
    connection.db
      .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
      .all(),
    commands,
  );
  f.setOffline(false);
  let files = await connection.app.readLessonFiles();
  if (files.offer.kind !== "available")
    throw new Error("Expected offer for reacquisition");
  await connection.app.changeLessonFiles(
    parseLessonFilesCommand({
      version: 1,
      family: "lesson-files",
      installationId: view.installationId,
      commandId: "cleanup-reacquire",
      expected: files.activation,
      action: { kind: "download", target: files.offer.target },
    }),
  );
  for (let attempt = 0; attempt < 300; attempt++) {
    files = await connection.app.readLessonFiles();
    if (files.offer.kind === "ready") break;
    await setImmediate();
  }
  if (files.offer.kind !== "ready")
    throw new Error("Expected reacquired files");
  await connection.app.changeLessonFiles(
    parseLessonFilesCommand({
      version: 1,
      family: "lesson-files",
      installationId: view.installationId,
      commandId: "cleanup-recancel",
      expected: files.activation,
      action: { kind: "cancel", download: files.offer.receipt },
    }),
  );
  const reacquired = [...f.namespace(release.target)!];
  assert(reacquired.length > 0);
  assert.deepEqual(await connection.app.cleanupCache(command), result);
  assert.deepEqual(
    [...f.namespace(release.target)!],
    reacquired,
    "Old cleanup must not erase reacquired bytes",
  );
  const next = await connection.app.readCacheCleanup();
  assert.equal(next.targets[0]?.collectionRevision, "1");
  f.setEraseHook(undefined);
  await connection.app.cleanupCache({
    version: 1,
    installationId: next.installationId,
    targets: next.targets,
  });
  assert.equal(
    (await connection.app.cleanupCache(command)).results[0]?.outcome,
    "changed",
  );
  await assert.rejects(
    connection.app.cleanupCache({
      ...command,
      installationId: parseId({
        kind: "installation",
        value: "other-installation",
      }),
    }),
    /installation/,
  );
});

test("cache cleanup rechecks retention and refuses a changed collection revision without erasing", async (t) => {
  const { f, connection, release, installationId } = await cancelledDownload(t);
  const view = await connection.app.readCacheCleanup();
  const command = {
    version: 1 as const,
    installationId,
    targets: view.targets,
  };
  const original = [...f.namespace(release.target)!];
  f.setEraseHook(async () => {
    throw new Error("Protected or stale cache must not be erased");
  });
  const stale = await connection.app.cleanupCache({
    ...command,
    targets: command.targets.map((target) => ({
      ...target,
      collectionRevision: parseCounter("10"),
    })),
  });
  assert.equal(stale.results[0]?.outcome, "changed");
  const files = await connection.app.readLessonFiles();
  assert.equal(files.offer.kind, "available");
  if (files.offer.kind !== "available") throw new Error("Expected offer");
  await connection.app.changeLessonFiles(
    parseLessonFilesCommand({
      version: 1,
      family: "lesson-files",
      installationId,
      commandId: "cleanup-redownload",
      expected: files.activation,
      action: { kind: "download", target: files.offer.target },
    }),
  );
  const protectedResult = await connection.app.cleanupCache(command);
  assert.equal(protectedResult.results[0]?.outcome, "retained");
  assert.deepEqual([...f.namespace(release.target)!], original);
  assert.equal(
    connection.db
      .prepare(
        "SELECT count(*) AS n FROM package_collection WHERE package_hash=?",
      )
      .get(release.target)?.n,
    0,
  );
});

test("cache cleanup never erases when its durable tombstone cannot commit", async (t) => {
  const { f, connection, release } = await cancelledDownload(t);
  const view = await connection.app.readCacheCleanup();
  const original = [...f.namespace(release.target)!];
  let fail = true;
  const retrying = f.connect(async (sql, work) => {
    if (fail && /insert into "package_collection"/i.test(sql))
      throw new Error("Injected tombstone write failure");
    return work();
  });
  f.setEraseHook(async () => {
    throw new Error("Deletion without committed tombstone");
  });
  const command = {
    version: 1 as const,
    installationId: view.installationId,
    targets: view.targets,
  };
  await assert.rejects(retrying.app.cleanupCache(command), (error: unknown) => {
    assert(error instanceof Error && error.cause instanceof Error);
    assert.match(error.cause.message, /tombstone write failure/);
    return true;
  });
  assert.deepEqual([...f.namespace(release.target)!], original);
  assert.equal(
    retrying.db
      .prepare(
        "SELECT count(*) AS n FROM package_collection WHERE package_hash=?",
      )
      .get(release.target)?.n,
    0,
  );
  fail = false;
  f.setEraseHook(undefined);
  assert.equal(
    (await retrying.app.cleanupCache(command)).results[0]?.outcome,
    "collected",
  );
});
