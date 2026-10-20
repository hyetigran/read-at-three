import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { installationFixture } from "./installation-support.ts";
import {
  parseHash,
  parseLessonFilesCommand,
  createInstallationMaterials,
  parseInitialInstallCommand,
} from "../../packages/teaching/src/index.ts";
import { hash } from "./support.ts";
import { requireCollectionClaim } from "../../packages/storage/src/index.ts";

for (const fault of ["interrupted", "retired", "staleRevision"] as const) {
  test(`collection ${fault} preserves exclusion, revokes old claims and resumes one exact namespace idempotently`, async (t) => {
    const f = await installationFixture(t, "completeLessons");
    const first = f.connect();
    await first.app.initialInstall(await f.command(first.app));
    await f.until(first.app, "activated");
    const b = await f.anotherRelease(`fixture.release.collect-${fault}`);
    const update = f.connect(undefined, {
      publicationHash: b.target,
      releaseId: b.releaseId,
    });
    let view = await update.app.readLessonFiles();
    if (view.offer.kind !== "available") throw new Error("Expected offer");
    const installationId = (await update.app.readDirectory()).administration
      .installationId;
    const download = parseLessonFilesCommand({
      version: 1,
      family: "lesson-files",
      installationId,
      commandId: "collect-download",
      expected: view.activation,
      action: { kind: "download", target: view.offer.target },
    });
    await update.app.changeLessonFiles(download);
    for (let index = 0; index < 300; index++) {
      view = await update.app.readLessonFiles();
      if (view.offer.kind === "ready") break;
      await setImmediate();
    }
    if (view.offer.kind !== "ready") throw new Error("Expected ready download");
    const target = view.offer.target;
    const cancel = parseLessonFilesCommand({
      version: 1,
      family: "lesson-files",
      installationId,
      commandId: "collect-cancel",
      expected: view.activation,
      action: { kind: "cancel", download: view.offer.receipt },
    });
    await update.app.changeLessonFiles(cancel);
    const evidence = update.db
      .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
      .all();
    const manifests = update.db
      .prepare(
        "SELECT package_hash,verified_manifest FROM installed_package ORDER BY package_hash",
      )
      .all();
    const aBytes = [...f.cache].map(([path, entry]) => ({
      path,
      mediaType: entry.mediaType,
      bytes: Uint8Array.from(entry.bytes),
    }));
    const collecting = f.connect(undefined, {
      publicationHash: b.target,
      releaseId: b.releaseId,
    });
    let oldClaim: unknown;
    let deleted = 0;
    f.setEraseHook(async ({ stage, claim }) => {
      if (stage !== "after") return;
      deleted++;
      oldClaim = claim;
      assert.equal(
        collecting.db
          .prepare("SELECT state FROM package_collection WHERE package_hash=?")
          .get(b.target)?.state,
        "collecting",
      );
      assert.equal(
        (await collecting.app.readDiagnostics()).persistence,
        "durable",
        "Native deletion does not retain the coordinator queue",
      );
      await assert.rejects(
        requireCollectionClaim({
          claim: { ...claim },
          mode: "fixture",
          hash: b.target,
        }),
        /owned claim/,
      );
      await assert.rejects(
        requireCollectionClaim({ claim, mode: "publication", hash: b.target }),
        /owned claim/,
      );
      const late = parseLessonFilesCommand({
        version: 1,
        family: "lesson-files",
        installationId,
        commandId: "late-download",
        expected: view.activation,
        action: { kind: "download", target },
      });
      await assert.rejects(
        collecting.app.changeLessonFiles(late),
        (error: unknown) => {
          assert(error instanceof Error);
          assert(error.cause instanceof Error);
          assert.match(error.cause.message, /excludes new references/);
          return true;
        },
      );
      assert.equal(
        collecting.db
          .prepare(
            "SELECT count(*) AS n FROM lesson_files_command WHERE command_id='late-download'",
          )
          .get()?.n,
        0,
      );
      if (fault === "retired") collecting.retire();
      if (fault === "staleRevision")
        collecting.db
          .prepare(
            "UPDATE package_collection SET revision=revision+1 WHERE package_hash=?",
          )
          .run(b.target);
      throw new Error("Injected exact namespace interruption");
    });
    f.setOffline(true);
    await assert.rejects(collecting.app.readDirectory(), /interruption/);
    assert.equal(deleted, 1);
    assert.equal(f.namespace(b.target)?.size, 2);
    const tombstone = collecting.db
      .prepare(
        "SELECT revision,state FROM package_collection WHERE package_hash=?",
      )
      .get(b.target);
    assert.equal(tombstone?.state, "collecting");
    await assert.rejects(
      requireCollectionClaim({
        claim: oldClaim,
        mode: "fixture",
        hash: b.target,
      }),
      /owned claim/,
    );
    assert.deepEqual(
      collecting.db
        .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
        .all(),
      evidence,
    );
    assert.deepEqual(
      collecting.db
        .prepare(
          "SELECT package_hash,verified_manifest FROM installed_package ORDER BY package_hash",
        )
        .all(),
      manifests,
    );
    assert.deepEqual(
      [...f.cache].map(([path, entry]) => ({
        path,
        mediaType: entry.mediaType,
        bytes: Uint8Array.from(entry.bytes),
      })),
      aBytes,
    );
    f.setEraseHook(undefined);
    const reopened = f.connect();
    await reopened.app.readDirectory();
    assert.equal(f.namespacePresent(b.target), false);
    const complete = reopened.db
      .prepare(
        "SELECT revision,state FROM package_collection WHERE package_hash=?",
      )
      .get(b.target);
    assert.equal(complete?.revision, tombstone?.revision);
    assert.equal(complete?.state, "complete");
    assert.equal(
      reopened.db
        .prepare("SELECT state FROM installed_package WHERE package_hash=?")
        .get(b.target)?.state,
      "metadataOnly",
    );
    assert.deepEqual(
      reopened.db
        .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
        .all(),
      evidence,
    );
    await f.connect().app.readDirectory();
    assert.equal(f.namespacePresent(b.target), false);
    assert.deepEqual(
      reopened.db
        .prepare(
          "SELECT revision,state FROM package_collection WHERE package_hash=?",
        )
        .get(b.target),
      complete,
    );
    assert.deepEqual(reopened.db.prepare("PRAGMA foreign_key_check").all(), []);
    assert.equal(
      parseHash({ kind: "package", value: b.target }),
      claimHash(oldClaim),
    );
  });
}

function claimHash(value: unknown) {
  if (value === null || typeof value !== "object" || !("packageHash" in value))
    throw new Error("Missing actual claim observation");
  return value.packageHash;
}

test("initial installation cannot admit a target during its exact namespace collection", async (t) => {
  const f = await installationFixture(t, "completeLessons");
  const first = f.connect();
  const initial = await first.app.installations();
  const b = await f.anotherRelease("fixture.release.initial-collection-race");
  await createInstallationMaterials(first.installed, hash).acquire(b.target);
  const registered = f.connect();
  await registered.app.readDirectory();
  assert.equal(
    registered.db.prepare("SELECT count(*) AS n FROM course_activation").get()
      ?.n,
    0,
  );
  assert.equal(
    registered.db
      .prepare("SELECT state FROM installed_package WHERE package_hash=?")
      .get(b.target)?.state,
    "ready",
  );
  const collecting = f.connect();
  const command = parseInitialInstallCommand({
    version: 1,
    kind: "initialInstall",
    installationId: initial.installationId,
    commandId: "initial-during-collection",
    source: { mode: "fixture" },
    target: {
      publicationHash: b.target,
      courseId: f.content.body.courseId,
      releaseId: b.releaseId,
    },
    expected: { kind: "absent" },
  });
  let reached = false;
  f.setEraseHook(async ({ stage }) => {
    if (stage !== "after") return;
    reached = true;
    const acquisitions = f.acquisitions;
    await assert.rejects(
      collecting.app.initialInstall(command),
      (error: unknown) => {
        assert(error instanceof Error);
        assert(error.cause instanceof Error);
        assert.match(error.cause.message, /excludes new references/);
        return true;
      },
    );
    assert.equal(f.acquisitions, acquisitions);
    assert.equal(
      collecting.db
        .prepare("SELECT count(*) AS n FROM installation_command")
        .get()?.n,
      0,
    );
    assert.equal(
      collecting.db.prepare("SELECT count(*) AS n FROM package_hold").get()?.n,
      0,
    );
    throw new Error("Injected initial collection boundary");
  });
  await assert.rejects(
    collecting.app.readDirectory(),
    /initial collection boundary/,
  );
  assert.equal(reached, true);
  f.setEraseHook(undefined);
  const resumed = f.connect();
  await resumed.app.readDirectory();
  assert.equal(f.namespacePresent(b.target), false);
  const accepted = await resumed.app.initialInstall(command);
  assert.equal(accepted.fact.kind, "accepted");
  await f.until(resumed.app, "activated");
  assert.equal(
    resumed.db
      .prepare("SELECT active_package_hash FROM course_activation")
      .get()?.active_package_hash,
    b.target,
  );
  assert.deepEqual(resumed.db.prepare("PRAGMA foreign_key_check").all(), []);
});

for (const phase of ["mark", "complete"] as const)
  for (const boundary of ["before", "after"] as const) {
    test(`${boundary} collection ${phase} COMMIT restart preserves metadata and completes one tombstone revision`, async (t) => {
      const f = await installationFixture(t, "completeLessons");
      const first = f.connect();
      await first.app.initialInstall(await f.command(first.app));
      await f.until(first.app, "activated");
      const b = await f.anotherRelease(`fixture.release.${phase}-${boundary}`);
      const update = f.connect(undefined, {
        publicationHash: b.target,
        releaseId: b.releaseId,
      });
      let view = await update.app.readLessonFiles();
      if (view.offer.kind !== "available") throw new Error("Expected offer");
      const installationId = (await update.app.readDirectory()).administration
        .installationId;
      const download = parseLessonFilesCommand({
        version: 1,
        family: "lesson-files",
        installationId,
        commandId: "commit-download",
        expected: view.activation,
        action: { kind: "download", target: view.offer.target },
      });
      await update.app.changeLessonFiles(download);
      for (let index = 0; index < 300; index++) {
        view = await update.app.readLessonFiles();
        if (view.offer.kind === "ready") break;
        await setImmediate();
      }
      if (view.offer.kind !== "ready") throw new Error("Expected ready files");
      const cancel = parseLessonFilesCommand({
        version: 1,
        family: "lesson-files",
        installationId,
        commandId: "commit-cancel",
        expected: view.activation,
        action: { kind: "cancel", download: view.offer.receipt },
      });
      const cancelled = await update.app.changeLessonFiles(cancel);
      const metadata = update.db
        .prepare(
          "SELECT package_hash,verified_manifest FROM installed_package ORDER BY package_hash",
        )
        .all();
      const evidence = update.db
        .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
        .all();
      const initialEvidence = update.db
        .prepare("SELECT * FROM installation_command")
        .all();
      const profiles = update.db.prepare("SELECT * FROM profile").all();
      let opened: ReturnType<typeof f.connect> | undefined,
        injected = false;
      opened = f.connect(async (sql, work) => {
        if (sql !== "COMMIT" || injected || !opened) return work();
        const state = opened.db
          .prepare("SELECT state FROM package_collection WHERE package_hash=?")
          .get(b.target)?.state;
        if (state !== (phase === "mark" ? "collecting" : "complete"))
          return work();
        injected = true;
        if (boundary === "after") await work();
        opened.retire();
        throw new Error("Injected collection COMMIT acknowledgement loss");
      });
      f.setOffline(true);
      await assert.rejects(opened.app.readDirectory(), /acknowledgement loss/);
      assert.equal(injected, true);
      assert.equal(f.namespacePresent(b.target), phase === "mark");
      const before = opened.db
        .prepare("SELECT state FROM package_collection WHERE package_hash=?")
        .get(b.target)?.state;
      assert.equal(
        before,
        phase === "mark" && boundary === "before"
          ? undefined
          : phase === "complete" && boundary === "after"
            ? "complete"
            : "collecting",
      );
      const cold = f.connect();
      await cold.app.readDirectory();
      assert.equal(f.namespacePresent(b.target), false);
      const tombstone = cold.db
        .prepare(
          "SELECT revision,state FROM package_collection WHERE package_hash=?",
        )
        .get(b.target);
      assert.equal(tombstone?.revision, 0);
      assert.equal(tombstone?.state, "complete");
      assert.deepEqual(
        cold.db
          .prepare(
            "SELECT package_hash,verified_manifest FROM installed_package ORDER BY package_hash",
          )
          .all(),
        metadata,
      );
      assert.deepEqual(
        cold.db
          .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
          .all(),
        evidence,
      );
      assert.deepEqual(
        cold.db.prepare("SELECT * FROM installation_command").all(),
        initialEvidence,
      );
      assert.deepEqual(
        cold.db.prepare("SELECT * FROM profile").all(),
        profiles,
      );
      assert.deepEqual(await cold.app.changeLessonFiles(cancel), cancelled);
      await f.connect().app.readDirectory();
      assert.deepEqual(
        cold.db
          .prepare(
            "SELECT revision,state FROM package_collection WHERE package_hash=?",
          )
          .get(b.target),
        tombstone,
      );
    });
  }
