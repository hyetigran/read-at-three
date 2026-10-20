import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { installationFixture } from "./installation-support.ts";
import { hash } from "./support.ts";
import {
  confirmInitialProfile,
  selectedProjection,
  selectedCourse,
  prepareSelectedTeaching,
  executeTeaching,
} from "./selected-support.ts";
import {
  parseLessonFilesCommand,
  prepareCommand,
  prepareWritingCommand,
  parseRuntimePackage,
  parseId,
} from "../../packages/teaching/src/index.ts";
import type {
  LessonFilesApplication,
  LessonFilesReceipt,
} from "../../packages/teaching/src/index.ts";
import { canonical, parseHash } from "../../packages/teaching/src/index.ts";
import { readFile } from "node:fs/promises";

async function downloadAndUse(
  app: ReturnType<
    Awaited<ReturnType<typeof installationFixture>>["connect"]
  >["app"],
  name: string,
) {
  let page = await app.readLessonFiles();
  if (page.offer.kind !== "available")
    throw new Error("Expected exact configured offer");
  const installationId = (await app.readDirectory()).administration
    .installationId;
  const download = parseLessonFilesCommand({
    version: 1,
    family: "lesson-files",
    installationId,
    commandId: `download-${name}`,
    expected: page.activation,
    action: { kind: "download", target: page.offer.target },
  });
  await app.changeLessonFiles(download);
  await until(app, download.commandId, "ready");
  page = await app.readLessonFiles();
  if (page.offer.kind !== "ready") throw new Error("Expected ready offer");
  const use = parseLessonFilesCommand({
    version: 1,
    family: "lesson-files",
    installationId,
    commandId: `use-${name}`,
    expected: page.activation,
    action: {
      kind: "use",
      target: page.offer.target,
      ready: page.offer.receipt,
    },
  });
  await app.changeLessonFiles(use);
  const receipt = await until(app, use.commandId, "activated");
  return { download, use, receipt };
}

async function until(
  application: LessonFilesApplication,
  commandId: string,
  kind: LessonFilesReceipt["kind"],
) {
  for (let index = 0; index < 300; index++) {
    const view = await application.readLessonFiles();
    const result = view.commands.find(
      (item) => item.receipt.commandId === commandId,
    );
    if (result?.receipt.kind === kind) return result.receipt;
    await setImmediate();
  }
  throw new Error(
    `Lesson files did not reach ${kind}: ${JSON.stringify(await application.readLessonFiles())}`,
  );
}

test("explicit Download and separate Use preserve saved A, fresh restart uses B, and warm eviction never retargets B work", async (t) => {
  const f = await installationFixture(t, "completeLessons");
  const first = f.connect();
  await first.app.initialInstall(await f.command(first.app));
  await f.until(first.app, "activated");
  await confirmInitialProfile(first.app, f.ids, hash);
  const initial = await selectedProjection(first.app);
  if (initial.kind === "recovery") throw new Error(initial.message);
  const start = initial.actions.find(
    (action) => action.intent.kind === "start",
  );
  if (!start) throw new Error("Start action unavailable");
  await executeTeaching(
    first.app,
    await prepareSelectedTeaching(first.app, () =>
      prepareCommand({
        projection: initial,
        request: { kind: "action", action: start },
        ids: f.ids,
        hash,
      }),
    ),
  );
  const savedA = await selectedProjection(first.app);
  if (savedA.kind !== "teaching") throw new Error("Expected saved A teaching");
  const originalRun = first.db.prepare("SELECT * FROM task_run").all();
  const next = await f.anotherRelease("fixture.release.b");
  const second = f.connect(undefined, {
    publicationHash: next.target,
    releaseId: next.releaseId,
  });
  let page = await second.app.readLessonFiles();
  assert.equal(page.offer.kind, "available");
  if (page.offer.kind !== "available") throw new Error("Expected update offer");
  const installationId = (await second.app.readDirectory()).administration
    .installationId;
  const download = parseLessonFilesCommand({
    version: 1,
    family: "lesson-files",
    installationId,
    commandId: "download-b",
    expected: page.activation,
    action: { kind: "download", target: page.offer.target },
  });
  assert.equal((await second.app.changeLessonFiles(download)).kind, "accepted");
  await until(second.app, "download-b", "ready");
  assert.equal(
    second.db.prepare("SELECT active_package_hash FROM course_activation").get()
      ?.active_package_hash,
    f.target,
  );
  assert.deepEqual(
    second.db.prepare("SELECT * FROM task_run").all(),
    originalRun,
  );
  page = await second.app.readLessonFiles();
  if (page.offer.kind !== "ready") throw new Error("Ready update unavailable");
  const use = parseLessonFilesCommand({
    version: 1,
    family: "lesson-files",
    installationId,
    commandId: "use-b",
    expected: page.activation,
    action: {
      kind: "use",
      target: page.offer.target,
      ready: page.offer.receipt,
    },
  });
  assert.equal((await second.app.changeLessonFiles(use)).kind, "accepted");
  const activated = await until(second.app, "use-b", "activated");
  assert.deepEqual(await second.app.changeLessonFiles(use), activated);
  assert.deepEqual(
    second.db.prepare("SELECT * FROM task_run").all(),
    originalRun,
  );
  const reopened = await selectedProjection(second.app);
  if (reopened.kind !== "teaching") throw new Error("Saved A did not reopen");
  assert.equal(reopened.packageHash, f.target);
  assert.deepEqual(reopened.turn, savedA.turn);
  const restart = reopened.actions.find(
    (action) => action.intent.kind === "restart",
  );
  if (!restart) throw new Error("Explicit restart unavailable");
  await executeTeaching(
    second.app,
    await prepareSelectedTeaching(second.app, () =>
      prepareCommand({
        projection: reopened,
        request: { kind: "action", action: restart },
        ids: f.ids,
        hash,
      }),
    ),
  );
  const fresh = await selectedProjection(second.app);
  assert.equal(fresh.kind, "teaching");
  if (fresh.kind !== "teaching") throw new Error("New B run unavailable");
  assert.equal(fresh.packageHash, next.target);
  assert.notEqual(fresh.runId, reopened.runId);
  assert.equal(
    second.db.prepare("SELECT count(*) AS n FROM task_run").get()?.n,
    2,
  );
  const personalTables = [
    "profile",
    "course_cursor",
    "session",
    "task_run",
    "task_advance",
    "advance_withdrawal",
    "task_credit",
    "task_result",
    "lesson_credit",
    "lesson_credit_support",
    "lesson_result",
    "command_receipt",
    "ink_document",
    "ink_history",
    "ink_operation",
    "ink_stroke",
    "ink_point_chunk",
  ];
  const personal = () =>
    personalTables.map((name) => ({
      name,
      rows: second.db.prepare(`SELECT * FROM ${name}`).all(),
    }));
  const savedB = personal();
  f.namespace(next.target)?.clear();
  f.setOffline(true);
  const downloads = f.downloads,
    acquisitions = f.acquisitions;
  await assert.rejects(selectedProjection(second.app), /unavailable/i);
  const repairedView = await second.app.readLessonFiles();
  assert.equal(
    repairedView.activation.kind === "present" &&
      repairedView.activation.activePackageHash,
    f.target,
  );
  assert.equal(
    repairedView.packages.find((item) => item.packageHash === fresh.packageHash)
      ?.bytes,
    "missing",
  );
  assert.deepEqual(personal(), savedB);
  await assert.rejects(selectedProjection(second.app), /unavailable/i);
  assert.deepEqual(personal(), savedB);
  assert.equal(f.downloads, downloads);
  assert.equal(f.acquisitions, acquisitions);
  f.setOffline(false);
  const repaired = await second.app.repairPublication({
    installationId,
    packageHash: fresh.packageHash,
  });
  assert.equal(repaired.kind, "verified");
  assert.deepEqual(personal(), savedB);
  const resumedB = await selectedProjection(second.app);
  if (resumedB.kind !== "teaching")
    throw new Error("Exact B work did not resume after explicit repair");
  assert.equal(resumedB.packageHash, fresh.packageHash);
  assert.equal(resumedB.runId, fresh.runId);
});

test("terminal Use B retry after C activation and B eviction returns its original receipt without changing C or downloading", async (t) => {
  const f = await installationFixture(t, "completeLessons");
  const initial = f.connect();
  await initial.app.initialInstall(await f.command(initial.app));
  await f.until(initial.app, "activated");
  const b = await f.anotherRelease("fixture.release.retry-b");
  const second = f.connect(undefined, {
    publicationHash: b.target,
    releaseId: b.releaseId,
  });
  const old = await downloadAndUse(second.app, "retry-b");
  const c = await f.anotherRelease("fixture.release.retry-c");
  const third = f.connect(undefined, {
    publicationHash: c.target,
    releaseId: c.releaseId,
  });
  await downloadAndUse(third.app, "retry-c");
  const commandRows = third.db
    .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
    .all();
  const activation = third.db.prepare("SELECT * FROM course_activation").all();
  f.namespace(b.target)?.clear();
  f.setOffline(true);
  const downloads = f.downloads,
    acquisitions = f.acquisitions;
  const reopened = f.connect(undefined, {
    publicationHash: c.target,
    releaseId: c.releaseId,
  });
  assert.deepEqual(await reopened.app.changeLessonFiles(old.use), old.receipt);
  assert.deepEqual(
    reopened.db
      .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
      .all(),
    commandRows,
  );
  assert.deepEqual(
    reopened.db.prepare("SELECT * FROM course_activation").all(),
    activation,
  );
  assert.equal(f.downloads, downloads);
  assert.equal(f.acquisitions, acquisitions);
  const page = await reopened.app.readLessonFiles();
  assert.equal(
    page.activation.kind === "present" && page.activation.activePackageHash,
    c.target,
  );
  assert.equal(
    page.packages.find(
      (item) =>
        item.packageHash === parseHash({ kind: "package", value: b.target }),
    )?.bytes,
    "missing",
  );
  assert.equal(f.downloads, downloads);
  assert.equal(f.acquisitions, acquisitions);
});

test("cancelled inactive bytes collect under durable tombstones and preserve exact canonical command evidence", async (t) => {
  const f = await installationFixture(t, "completeLessons");
  const first = f.connect();
  await first.app.initialInstall(await f.command(first.app));
  await f.until(first.app, "activated");
  const b = await f.anotherRelease("fixture.release.cancelled");
  const updated = f.connect(undefined, {
    publicationHash: b.target,
    releaseId: b.releaseId,
  });
  const page = await updated.app.readLessonFiles();
  if (page.offer.kind !== "available") throw new Error("Expected offer");
  const installationId = (await updated.app.readDirectory()).administration
    .installationId;
  const download = parseLessonFilesCommand({
    version: 1,
    family: "lesson-files",
    installationId,
    commandId: "collect-download",
    expected: page.activation,
    action: { kind: "download", target: page.offer.target },
  });
  await updated.app.changeLessonFiles(download);
  const ready = await until(updated.app, download.commandId, "ready");
  const originalReady = updated.db
    .prepare(
      "SELECT result,stage,command,payload_hash FROM lesson_files_command WHERE command_id=?",
    )
    .get(download.commandId);
  const cancel = parseLessonFilesCommand({
    version: 1,
    family: "lesson-files",
    installationId,
    commandId: "collect-cancel",
    expected: page.activation,
    action: {
      kind: "cancel",
      download: {
        installationId,
        commandId: download.commandId,
        payloadHash: ready.payloadHash,
      },
    },
  });
  const result = await updated.app.changeLessonFiles(cancel);
  assert.equal(result.kind, "cancelled");
  assert.deepEqual(
    updated.db
      .prepare(
        "SELECT result,stage,command,payload_hash FROM lesson_files_command WHERE command_id=?",
      )
      .get(download.commandId),
    originalReady,
  );
  assert.deepEqual(await updated.app.changeLessonFiles(download), ready);
  if (ready.kind !== "ready") throw new Error("Expected Ready receipt");
  const oldUse = parseLessonFilesCommand({
    version: 1,
    family: "lesson-files",
    installationId,
    commandId: "cancelled-old-use",
    expected: page.activation,
    action: {
      kind: "use",
      target: ready.target,
      ready: {
        installationId,
        commandId: download.commandId,
        payloadHash: ready.payloadHash,
      },
    },
  });
  assert.deepEqual(
    (await updated.app.changeLessonFiles(oldUse)).kind,
    "rejected",
  );
  const evidence = updated.db
    .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
    .all();
  const metadata = updated.db
    .prepare(
      "SELECT verified_manifest FROM installed_package WHERE package_hash=?",
    )
    .get(b.target);
  const representations = updated.db
    .prepare("SELECT * FROM installed_representation ORDER BY package_hash")
    .all();
  f.setOffline(true);
  const downloads = f.downloads,
    acquisitions = f.acquisitions;
  const reopened = f.connect();
  await reopened.app.readDirectory();
  assert.equal(f.namespacePresent(b.target), false);
  assert.equal(
    reopened.db
      .prepare("SELECT state FROM package_collection WHERE package_hash=?")
      .get(b.target)?.state,
    "complete",
  );
  const retainedPackage = reopened.db
    .prepare(
      "SELECT state,storage_key FROM installed_package WHERE package_hash=?",
    )
    .get(b.target);
  assert.equal(retainedPackage?.state, "metadataOnly");
  assert.equal(retainedPackage?.storage_key, null);
  assert.deepEqual(
    reopened.db
      .prepare(
        "SELECT verified_manifest FROM installed_package WHERE package_hash=?",
      )
      .get(b.target),
    metadata,
  );
  assert.deepEqual(
    reopened.db
      .prepare("SELECT * FROM installed_representation ORDER BY package_hash")
      .all(),
    representations,
  );
  assert.deepEqual(
    reopened.db
      .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
      .all(),
    evidence,
  );
  assert.deepEqual(await reopened.app.changeLessonFiles(cancel), result);
  assert.deepEqual(await reopened.app.changeLessonFiles(download), ready);
  const coldUse = parseLessonFilesCommand({
    ...oldUse,
    commandId: "cancelled-cold-use",
  });
  const refused = await reopened.app.changeLessonFiles(coldUse);
  assert.equal(refused.kind, "rejected");
  if (refused.kind !== "rejected")
    throw new Error("Expected cancelled refusal");
  assert.equal(refused.reason, "cancelled");
  assert.equal((await reopened.app.readLessonFiles()).offer.kind, "absent");
  assert.equal(f.downloads, downloads);
  assert.equal(f.acquisitions, acquisitions);
  assert.deepEqual(reopened.db.prepare("PRAGMA foreign_key_check").all(), []);
});

test("missing active B falls back only through authenticated cumulative A and leaves B command receipts intact", async (t) => {
  const f = await installationFixture(t, "completeLessons");
  const first = f.connect();
  await first.app.initialInstall(await f.command(first.app));
  await f.until(first.app, "activated");
  const b = await f.anotherRelease("fixture.release.fallback-b");
  const second = f.connect(undefined, {
    publicationHash: b.target,
    releaseId: b.releaseId,
  });
  const used = await downloadAndUse(second.app, "fallback-b");
  const evidence = second.db
    .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
    .all();
  f.namespace(b.target)?.clear();
  f.setOffline(true);
  const downloads = f.downloads,
    acquisitions = f.acquisitions;
  const reopened = f.connect();
  const page = await reopened.app.readLessonFiles();
  assert.deepEqual(page.activation, {
    kind: "present",
    activePackageHash: f.target,
    fallbackPackageHash: b.target,
    revision: "2",
  });
  assert.equal(
    reopened.db
      .prepare(
        "SELECT count(*) AS n FROM package_hold WHERE owner_kind='rollback'",
      )
      .get()?.n,
    0,
  );
  assert.deepEqual(
    reopened.db
      .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
      .all(),
    evidence,
  );
  assert.deepEqual(
    await reopened.app.changeLessonFiles(used.use),
    used.receipt,
  );
  assert.equal(f.downloads, downloads);
  assert.equal(f.acquisitions, acquisitions);
});

for (const fault of [
  "beforeActivationCommit",
  "afterActivationCommit",
  "beforeReleaseCommit",
  "afterReleaseCommit",
] as const) {
  test(`fallback ${fault} cold restart retires only its exact internal rollback hold`, async (t) => {
    const f = await installationFixture(t, "completeLessons");
    const first = f.connect();
    await first.app.initialInstall(await f.command(first.app));
    await f.until(first.app, "activated");
    const b = await f.anotherRelease(`fixture.release.rollback-${fault}`);
    const second = f.connect(undefined, {
      publicationHash: b.target,
      releaseId: b.releaseId,
    });
    await downloadAndUse(second.app, `rollback-${fault}`);
    second.db
      .prepare(
        "INSERT INTO package_hold(owner_kind,owner_id,package_hash) VALUES('export','[\"export\",\"future-export-kept\"]',?)",
      )
      .run(f.target);
    second.db
      .prepare(
        "INSERT INTO package_hold(owner_kind,owner_id,package_hash) VALUES('restore','[\"restore\",\"future-restore-kept\"]',?)",
      )
      .run(b.target);
    const evidence = second.db
      .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
      .all();
    f.namespace(b.target)?.clear();
    f.setOffline(true);
    let injected = false;
    let opened: ReturnType<typeof f.connect> | undefined;
    opened = f.connect(async (sql, work) => {
      if (sql !== "COMMIT" || injected || !opened) return work();
      const active = opened.db
        .prepare("SELECT active_package_hash FROM course_activation")
        .get()?.active_package_hash;
      const pending = opened.db
        .prepare(
          "SELECT count(*) AS n FROM package_hold WHERE owner_kind='rollback'",
        )
        .get()?.n;
      const activationCommit = active === f.target && pending === 1;
      const releaseCommit = active === f.target && pending === 0;
      if (!(fault.includes("Activation") ? activationCommit : releaseCommit))
        return work();
      injected = true;
      if (fault.startsWith("after")) await work();
      opened.retire();
      throw new Error("Injected fallback COMMIT interruption");
    });
    await assert.rejects(opened.app.readLessonFiles(), /interruption/);
    assert.equal(injected, true);
    const activeBefore = opened.db
      .prepare("SELECT active_package_hash FROM course_activation")
      .get()?.active_package_hash;
    assert.equal(
      activeBefore,
      fault === "beforeActivationCommit" ? b.target : f.target,
    );
    assert.equal(
      opened.db
        .prepare(
          "SELECT count(*) AS n FROM package_hold WHERE owner_kind='rollback'",
        )
        .get()?.n,
      fault === "afterReleaseCommit" ? 0 : 1,
    );
    const reopened = f.connect();
    const page = await reopened.app.readLessonFiles();
    assert.equal(
      page.activation.kind === "present" && page.activation.activePackageHash,
      f.target,
    );
    assert.equal(
      reopened.db
        .prepare(
          "SELECT count(*) AS n FROM package_hold WHERE owner_kind='rollback'",
        )
        .get()?.n,
      0,
    );
    assert.equal(
      reopened.db
        .prepare(
          "SELECT count(*) AS n FROM package_hold WHERE owner_kind IN ('export','restore')",
        )
        .get()?.n,
      2,
    );
    assert.deepEqual(
      reopened.db
        .prepare("SELECT * FROM lesson_files_command ORDER BY command_id")
        .all(),
      evidence,
    );
    assert.deepEqual(reopened.db.prepare("PRAGMA foreign_key_check").all(), []);
  });
}

test("canonical edited ready source refuses before migration, reconciliation, diagnostics or deletion writes", async (t) => {
  const f = await installationFixture(t, "completeLessons");
  const first = f.connect();
  await first.app.initialInstall(await f.command(first.app));
  await f.until(first.app, "activated");
  const next = await f.anotherRelease("fixture.release.ready-evidence");
  const update = f.connect(undefined, {
    publicationHash: next.target,
    releaseId: next.releaseId,
  });
  const page = await update.app.readLessonFiles();
  if (page.offer.kind !== "available") throw new Error("Expected update offer");
  const command = parseLessonFilesCommand({
    version: 1,
    family: "lesson-files",
    installationId: (await update.app.readDirectory()).administration
      .installationId,
    commandId: "edited-ready",
    expected: page.activation,
    action: { kind: "download", target: page.offer.target },
  });
  await update.app.changeLessonFiles(command);
  const ready = await until(update.app, "edited-ready", "ready");
  if (ready.kind !== "ready") throw new Error("Expected ready evidence");
  update.db
    .prepare("UPDATE lesson_files_command SET result=? WHERE command_id=?")
    .run(canonical({ ...ready, packageHash: f.target }), command.commandId);
  const objects = update.db
    .prepare(
      "SELECT type,name,tbl_name,rootpage,sql FROM sqlite_master ORDER BY type,name",
    )
    .all();
  const names = update.db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
    .map((row) => {
      if (typeof row.name !== "string" || !/^[a-z_]+$/.test(row.name))
        throw new Error("Unexpected fixture table");
      return row.name;
    });
  const snapshot = () =>
    names.map((name) => ({
      name,
      rows: update.db.prepare(`SELECT * FROM ${name}`).all(),
    }));
  const before = snapshot();
  const filename = update.db.prepare("PRAGMA database_list").get()?.file;
  if (typeof filename !== "string") throw new Error("Fixture file unavailable");
  const file = await readFile(filename);
  const attempts: string[] = [];
  const reopened = f.connect(async (sql, work) => {
    attempts.push(sql);
    return work();
  });
  await assert.rejects(reopened.app.readDirectory(), /ready|source|receipt/i);
  assert.deepEqual(
    attempts.filter(
      (sql) =>
        !/^\s*(?:select\b|PRAGMA\s+(?:foreign_keys(?:=ON)?|foreign_key_check|foreign_key_list\("[a-z_]+"\)|user_version|journal_mode|synchronous)\s*$)/i.test(
          sql,
        ),
    ),
    [],
  );
  assert.deepEqual(snapshot(), before);
  assert.deepEqual(
    update.db
      .prepare(
        "SELECT type,name,tbl_name,rootpage,sql FROM sqlite_master ORDER BY type,name",
      )
      .all(),
    objects,
  );
  reopened.db.close();
  update.db.close();
  first.db.close();
  assert.deepEqual(await readFile(filename), file);
});

test("signed editorial suffix preserves accepted lesson support and cannot fall back below its activated task floor", async (t) => {
  const f = await installationFixture(t, "completeLessons"),
    first = f.connect();
  await first.app.initialInstall(await f.command(first.app));
  await f.until(first.app, "activated");
  await confirmInitialProfile(first.app, f.ids, hash);
  async function perform(kind: string, taskId?: string) {
    const projection = await selectedProjection(first.app);
    if (projection.kind === "recovery") throw new Error(projection.message);
    const action = projection.actions.find(
      (a) =>
        a.intent.kind === kind &&
        (!taskId || ("taskId" in a.intent && a.intent.taskId === taskId)),
    );
    assert.ok(action, `Missing ${kind} at ${projection.kind}`);
    const result = await executeTeaching(
      first.app,
      await prepareSelectedTeaching(first.app, () =>
        projection.kind === "writing" || projection.kind === "writingResult"
          ? prepareWritingCommand({
              projection,
              action,
              barrier: { kind: "writing", documents: projection.documents },
              ids: f.ids,
              hash,
            })
          : prepareCommand({
              projection,
              request: { kind: "action", action },
              ids: f.ids,
              hash,
            }),
      ),
    );
    assert.equal(result.kind, "committed");
  }
  if (f.content.body.coverage !== "course-development-v4")
    throw new Error("Full synthetic course required");
  const lesson = f.content.body.lessons[0];
  assert.ok(lesson);
  const exemplar = lesson.tasks[0];
  assert.ok(exemplar);
  const id = parseId({ kind: "task", value: "fixture.editorial.required" }),
    number = lesson.lessonTasks.length + 1;
  const extra = {
    ...exemplar,
    task: {
      ...exemplar.task,
      id,
      number,
      title: { kind: "added", text: "Synthetic additional practice" },
    },
  };
  const body = {
    ...f.content.body,
    lessons: f.content.body.lessons.map((l, i) =>
      i === 0
        ? {
            ...l,
            lessonTasks: [
              ...l.lessonTasks,
              {
                ...l.lessonTasks[0],
                id,
                number,
                title: extra.task.title,
                optional: false,
              },
            ],
            tasks: [...l.tasks, extra],
          }
        : l,
    ),
  };
  const editorial = await parseRuntimePackage(
    { formatVersion: 1, body, packageHash: await hash(canonical(body)) },
    hash,
  );
  const b = await f.anotherRelease("fixture.editorial.b", editorial);
  const initial = await selectedCourse(first.app, { kind: "cursor" });
  assert.equal(initial.kind, "ready");
  if (initial.kind !== "ready") return;
  for (const task of initial.course.lessons[0]?.tasks ?? []) {
    await perform("start", task.id);
    for (let i = 0; i < 250; i++) {
      const projection = await selectedProjection(first.app);
      if (projection.kind === "recovery") throw new Error(projection.message);
      if ("runStatus" in projection && projection.runStatus !== "inProgress")
        break;
      if (i === 249) throw new Error("Synthetic task failed to finish");
      if (
        projection.kind === "reviewSelection" &&
        projection.committedChoice === null
      ) {
        const result = await executeTeaching(
          first.app,
          await prepareSelectedTeaching(first.app, () =>
            prepareCommand({
              projection,
              request: {
                kind: "review",
                action: projection.selectionAction,
                choice: { kind: "none" },
              },
              ids: f.ids,
              hash,
            }),
          ),
        );
        assert.equal(result.kind, "committed");
        continue;
      }
      const action =
        projection.actions.find((a) => a.intent.kind === "skipWriting") ??
        projection.actions.find((a) => a.intent.kind === "parentReady") ??
        projection.actions.find((a) => a.intent.kind === "continue");
      assert.ok(action);
      await perform(action.intent.kind);
    }
  }
  const old = await selectedCourse(first.app, { kind: "cursor" });
  assert.equal(old.kind, "ready");
  if (old.kind !== "ready") return;
  assert.equal(old.course.lessons[0]?.progress, "satisfied");
  const tables = [
    "session",
    "task_run",
    "task_advance",
    "advance_withdrawal",
    "task_credit",
    "task_result",
    "lesson_credit",
    "lesson_credit_support",
    "lesson_result",
    "ink_document",
    "ink_history",
    "ink_operation",
    "ink_stroke",
    "ink_point_chunk",
  ];
  const personal = () =>
    tables.map((name) => ({
      name,
      rows: first.db
        .prepare(`SELECT * FROM ${name} ORDER BY rowid`)
        .all()
        .map((row) => ({ ...row })),
    }));
  const conserved = personal();
  const updated = f.connect(undefined, {
    publicationHash: b.target,
    releaseId: b.releaseId,
  });
  await downloadAndUse(updated.app, "editorial-b");
  assert.deepEqual(personal(), conserved);
  const waiting = await selectedCourse(updated.app, { kind: "cursor" });
  assert.equal(waiting.kind, "recovery");
  if (waiting.kind !== "recovery") return;
  assert.equal(waiting.code, "ink-reconciliation-required");
  const recovery = await updated.app.openRecovery({ kind: "cold" });
  await updated.app.reconcileRecovery({
    recoveryId: recovery.recoveryId,
    choice: { kind: "cold" },
  });
  const fenced = conserved.map((table) =>
    table.name !== "ink_document"
      ? table
      : {
          name: table.name,
          rows: table.rows.map((row) => {
            assert.equal(typeof row.revision, "number");
            assert.equal(typeof row.input_epoch, "number");
            return {
              ...row,
              revision: Number(row.revision) + 1,
              input_epoch: Number(row.input_epoch) + 1,
            };
          }),
        },
  );
  assert.deepEqual(personal(), fenced);
  const view = await selectedCourse(updated.app, { kind: "cursor" });
  assert.equal(view.kind, "ready", canonical(view));
  if (view.kind !== "ready") return;
  assert.equal(view.course.lessons[0]?.progress, "satisfied");
  const added = view.course.lessons[0]?.tasks.find((task) => task.id === id);
  assert.ok(added);
  assert.equal(added.outcome, "unseen");
  assert.equal(added.availability, "ready");
  assert.ok(added.actions.some((a) => a.intent.kind === "start"));
  assert.deepEqual(
    view.course.lessons[1]?.tasks.map((task) => ({
      id: task.id,
      availability: task.availability,
      actions: task.actions.map((a) => a.intent.kind),
    })),
    old.course.lessons[1]?.tasks.map((task) => ({
      id: task.id,
      availability: task.availability,
      actions: task.actions.map((a) => a.intent.kind),
    })),
  );
  f.namespace(b.target)?.clear();
  f.setOffline(true);
  const cold = f.connect(),
    catalog = await cold.app.readLessonFiles();
  assert.equal(catalog.activation.kind, "present");
  if (catalog.activation.kind !== "present") return;
  assert.equal(catalog.activation.activePackageHash, b.target);
  assert.equal(catalog.activation.fallbackPackageHash, f.target);
  assert.deepEqual(personal(), fenced);
});

for (const variant of ["removed", "reordered", "identity"] as const)
  test(`signed update refuses ${variant} existing task identities`, async (t) => {
    const f = await installationFixture(t, "completeLessons"),
      first = f.connect();
    await first.app.initialInstall(await f.command(first.app));
    await f.until(first.app, "activated");
    if (f.content.body.coverage !== "course-development-v4")
      throw new Error("Full synthetic course required");
    const lesson = f.content.body.lessons[0];
    assert.ok(lesson);
    let lessonTasks = [...lesson.lessonTasks];
    let tasks: unknown[] = [...lesson.tasks];
    if (variant === "removed") {
      lessonTasks.pop();
      tasks.pop();
    }
    if (variant === "reordered") {
      lessonTasks = lesson.lessonTasks.map((_task, i) => {
        const task = lesson.lessonTasks[i === 0 ? 1 : i === 1 ? 0 : i];
        assert.ok(task);
        return { ...task, number: i + 1 };
      });
      tasks = lesson.tasks.map((_entry, i) => {
        const entry = lesson.tasks[i === 0 ? 1 : i === 1 ? 0 : i];
        assert.ok(entry);
        return { ...entry, task: { ...entry.task, number: i + 1 } };
      });
    }
    if (variant === "identity") {
      const id = parseId({
        kind: "task",
        value: "fixture.editorial.changed-existing",
      });
      lessonTasks = lessonTasks.map((task, i) =>
        i === 0 ? { ...task, id } : task,
      );
      tasks = lesson.tasks.map((entry, i) =>
        i === 0 ? { ...entry, task: { ...entry.task, id } } : entry,
      );
    }
    const body = {
      ...f.content.body,
      lessons: f.content.body.lessons.map((l, i) =>
        i === 0 ? { ...l, lessonTasks, tasks } : l,
      ),
    };
    const content = await parseRuntimePackage(
      { formatVersion: 1, body, packageHash: await hash(canonical(body)) },
      hash,
    );
    const next = await f.anotherRelease(
      `fixture.editorial.${variant}`,
      content,
    );
    const c = f.connect(undefined, {
        publicationHash: next.target,
        releaseId: next.releaseId,
      }),
      view = await c.app.readLessonFiles();
    assert.equal(view.offer.kind, "available");
    if (view.offer.kind !== "available") return;
    const installationId = (await c.app.readDirectory()).administration
      .installationId;
    const command = parseLessonFilesCommand({
      version: 1,
      family: "lesson-files",
      installationId,
      commandId: `editorial-${variant}`,
      expected: view.activation,
      action: { kind: "download", target: view.offer.target },
    });
    await c.app.changeLessonFiles(command);
    const result = await until(c.app, command.commandId, "rejected");
    assert.equal(result.kind, "rejected");
    if (result.kind !== "rejected") return;
    assert.equal(result.reason, "incompatible");
    assert.equal(
      c.db.prepare("SELECT active_package_hash FROM course_activation").get()
        ?.active_package_hash,
      f.target,
    );
    assert.equal(
      c.db.prepare("SELECT count(*) AS n FROM installed_package").get()?.n,
      1,
    );
  });

test("quota observation survives local reconciliation until the exact explicit Retry", async (t) => {
  const f = await installationFixture(t),
    first = f.connect();
  await first.app.initialInstall(await f.command(first.app));
  await f.until(first.app, "activated");
  await confirmInitialProfile(first.app, f.ids, hash);
  const before = first.db.prepare("SELECT * FROM profile").all();
  const b = await f.anotherRelease("fixture.quota.b"),
    second = f.connect(undefined, {
      publicationHash: b.target,
      releaseId: b.releaseId,
    });
  const view = await second.app.readLessonFiles();
  assert.equal(view.offer.kind, "available");
  if (view.offer.kind !== "available") return;
  const command = parseLessonFilesCommand({
    version: 1,
    family: "lesson-files",
    installationId: (await second.app.readDirectory()).administration
      .installationId,
    commandId: "quota-real-intent",
    expected: view.activation,
    action: { kind: "download", target: view.offer.target },
  });
  const error = new Error("Synthetic resource write fault");
  error.name = "QuotaExceededError";
  f.setWriteFailure({ hash: b.target, path: "curriculum.json", error });
  await second.app.changeLessonFiles(command);
  let observation;
  for (let i = 0; i < 300; i++) {
    const page = await second.app.readLessonFiles(),
      saved = page.commands.find(
        (item) => item.command.commandId === command.commandId,
      );
    if (saved?.observation.kind === "retryable") {
      observation = saved.observation;
      break;
    }
    await setImmediate();
  }
  assert.deepEqual(observation, { kind: "retryable", reason: "quota" });
  for (let i = 0; i < 3; i++) {
    const page = await second.app.readLessonFiles(),
      saved = page.commands.find(
        (item) => item.command.commandId === command.commandId,
      );
    assert.deepEqual(saved?.observation, {
      kind: "retryable",
      reason: "quota",
    });
    assert.equal(saved?.receipt.kind, "accepted");
  }
  assert.deepEqual(first.db.prepare("SELECT * FROM profile").all(), before);
  f.setWriteFailure(null);
  await second.app.changeLessonFiles(command);
  await until(second.app, command.commandId, "ready");
  const final = await second.app.readLessonFiles();
  assert.equal(final.activation.kind, "present");
  if (final.activation.kind !== "present") return;
  assert.equal(final.activation.activePackageHash, f.target);
  assert.deepEqual(
    final.commands.find((item) => item.command.commandId === command.commandId)
      ?.command,
    command,
  );
  assert.deepEqual(first.db.prepare("SELECT * FROM profile").all(), before);
});
