import {
  prepareSelectedInk,
  executeInk,
  selectedInk,
} from "./selected-support.ts";
import {
  prepareInkCommand,
  encodeInkPoints,
  layerForPhase,
  increment,
} from "../../packages/teaching/src/index.ts";
import type {
  DocumentToken,
  InkEdit,
} from "../../packages/teaching/src/index.ts";

import {
  InstalledContentUnavailableError,
  parseRuntimePackage,
} from "../../packages/teaching/src/index.ts";
import { syntheticPreparation } from "./selected-support.ts";

import {
  confirmInitialProfile,
  selectedProjection,
  prepareSelectedTeaching,
  executeTeaching,
} from "./selected-support.ts";
import {
  prepareProfileAdministration,
  prepareProfileRemoval,
  prepareCommand,
  prepareWritingCommand,
} from "../../packages/teaching/src/index.ts";
import type {
  AvailableAction,
  TeachingIntent,
} from "../../packages/teaching/src/index.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";

import { setImmediate } from "node:timers/promises";
import { createTeachingApplication } from "../../packages/storage/src/store.ts";
import { parseInitialInstallCommand } from "../../packages/teaching/src/installation.ts";
import {
  canonical,
  parseId,
  parseHash,
} from "../../packages/teaching/src/identity.ts";
import { publicationUtf8 } from "../../packages/teaching/src/publication.ts";
import type { PublicationHash } from "../../packages/teaching/src/publication.ts";

import {
  packageMetadata,
  resolvedLessons,
} from "../../packages/teaching/src/course-content.ts";

import { executorFor, hash } from "./support.ts";

import { installationFixture as fixture } from "./installation-support.ts";

test("candidate-free opening installs exact signed representation through one durable command", async (t) => {
  const f = await fixture(t);
  const c = f.connect();
  assert.equal((await c.app.installations()).commands.length, 0);
  assert.equal(c.db.prepare("SELECT * FROM installed_package").all().length, 0);
  assert.equal(c.db.prepare("SELECT * FROM course_activation").all().length, 0);
  const command = await f.command(c.app);
  const accepted = await c.app.initialInstall(command);
  assert.equal(accepted.fact.kind, "accepted");
  const final = await f.until(c.app, "activated");
  const base = c.db.prepare("SELECT * FROM installed_package").get();
  const representation = c.db
    .prepare("SELECT * FROM installed_representation")
    .get();
  assert.ok(base && representation);
  assert.deepEqual(base.verified_manifest, f.envelope);
  assert.deepEqual(representation.curriculum_utf8, f.curriculum);
  assert.deepEqual(representation.preparation_utf8, f.preparation);
  assert.equal(base.package_hash, f.target);
  assert.notEqual(base.package_hash, f.content.packageHash);
  assert.equal(
    c.db.prepare("SELECT revision FROM installation").get()?.revision,
    0,
  );
  assert.equal(f.downloads, 2);
  f.cache.clear();
  f.setShell(false);
  assert.deepEqual((await c.app.initialInstall(command)).fact, final.fact);
  assert.equal(f.downloads, 2);
  await assert.rejects(
    c.app.initialInstall({
      ...command,
      target: {
        ...command.target,
        releaseId: parseId({ kind: "release", value: "changed.release" }),
      },
    }),
    /identity changed/,
  );
  c.retire();
  c.db.close();
  const cold = f.connect();
  assert.deepEqual((await cold.app.initialInstall(command)).fact, final.fact);
  assert.equal(f.downloads, 2);
});
test("cold opening discovers accepted work without acquisition and explicit Retry resumes it", async (t) => {
  const f = await fixture(t);
  let release!: () => void;
  f.setGate(
    new Promise((resolve) => {
      release = resolve;
    }),
  );
  const first = f.connect();
  const command = await f.command(first.app);
  await first.app.initialInstall(command);
  await setImmediate();
  first.retire();
  release();
  await setImmediate();
  await setImmediate();
  first.db.close();
  const count = f.acquisitions;
  const cold = f.connect();
  const discovered = await cold.app.installations();
  assert.equal(discovered.commands[0]?.fact.kind, "accepted");
  assert.equal(f.acquisitions, count);
  await cold.app.initialInstall(command);
  await f.until(cold.app, "activated");
  assert.equal(f.acquisitions, count + 1);
});
test("shell refusal preserves readyInactive and a fresh exact Retry activates", async (t) => {
  const f = await fixture(t);
  f.setShell(false);
  const c = f.connect();
  const command = await f.command(c.app);
  await c.app.initialInstall(command);
  const ready = await f.until(c.app, "readyInactive");
  assert.equal(c.db.prepare("SELECT * FROM course_activation").all().length, 0);
  for (let i = 0; i < 10; i++) await setImmediate();
  assert.notEqual(
    (await c.app.installations()).commands[0]?.availability.kind,
    "checking",
  );
  f.setShell(true);
  assert.equal(
    (await c.app.initialInstall(command)).fact.kind,
    ready.fact.kind,
  );
  await f.until(c.app, "activated");
});
test("matching active identity without this command receipt is rejected", async (t) => {
  const f = await fixture(t);
  const c = f.connect();
  await c.app.initialInstall(await f.command(c.app));
  await f.until(c.app, "activated");
  const other = await f.command(c.app, "fixture.other.command");
  const result = await c.app.initialInstall(other);
  assert.equal(result.fact.kind, "rejected");
  if (result.fact.kind === "rejected")
    assert.equal(result.fact.reason, "courseAlreadyActive");
  assert.equal(c.db.prepare("SELECT * FROM course_activation").all().length, 1);
});
for (const [stage, commitNumber] of [
  ["intent", 1],
  ["ready", 2],
  ["activation", 3],
] satisfies readonly (readonly [string, number])[]) {
  for (const timing of ["before", "after"]) {
    test(`real SQLite ${stage} COMMIT ${timing} fault resolves the exact retained command`, async (t) => {
      const f = await fixture(t);
      let armed = false,
        commits = 0,
        fired = false;
      const c = f.connect(async (sql, work) => {
        if (armed && sql === "COMMIT") {
          commits++;
          if (commits === commitNumber) {
            fired = true;
            armed = false;
            if (timing === "after") await work();
            throw new Error("Injected commit acknowledgement fault");
          }
        }
        return work();
      });
      const command = await f.command(c.app);
      armed = true;
      if (commitNumber === 1)
        await assert.rejects(c.app.initialInstall(command), /Injected/);
      else {
        await c.app.initialInstall(command);
        for (let i = 0; i < 300; i++) {
          const current = (await c.app.installations()).commands[0];
          if (fired && current?.availability.kind === "stale") break;
          await setImmediate();
        }
      }
      assert.equal(fired, true);
      await setImmediate();
      const before = await c.app.installations();
      const expected =
        commitNumber === 1
          ? timing === "before"
            ? undefined
            : "accepted"
          : commitNumber === 2
            ? timing === "before"
              ? "accepted"
              : "readyInactive"
            : timing === "before"
              ? "readyInactive"
              : "activated";
      assert.equal(before.commands[0]?.fact.kind, expected);
      assert.equal(
        c.db.prepare("SELECT count(*) n FROM installed_package").get()?.n,
        commitNumber === 1 || (commitNumber === 2 && timing === "before")
          ? 0
          : 1,
      );
      assert.equal(
        c.db.prepare("SELECT count(*) n FROM course_activation").get()?.n,
        commitNumber === 3 && timing === "after" ? 1 : 0,
      );
      c.retire();
      c.db.close();
      const cold = f.connect();
      const discovered = await cold.app.installations();
      assert.equal(discovered.commands[0]?.fact.kind, expected);
      await cold.app.initialInstall(command);
      const final = await f.until(cold.app, "activated");
      f.cache.clear();
      f.setShell(false);
      assert.deepEqual(
        (await cold.app.initialInstall(command)).fact,
        final.fact,
      );
      assert.equal(
        cold.db.prepare("SELECT count(*) n FROM course_activation").get()?.n,
        1,
      );
      assert.equal(
        cold.db.prepare("SELECT count(*) n FROM installation_command").get()?.n,
        1,
      );
    });
  }
}

test("installed preparation, exact acknowledgement Retry and signed SQL completion use current resources and outer identity", async (t) => {
  const f = await fixture(t);
  const c = f.connect();
  await c.app.initialInstall(await f.command(c.app));
  await f.until(c.app, "activated");
  const directory = await c.app.readDirectory();
  assert.equal(directory.preparation.kind, "required");
  const material = await c.app.parentMaterial({
    kind: "preparation",
    packageHash: parseHash({ kind: "package", value: f.target }),
  });
  assert.equal(material.kind, "preparation");
  if (material.kind !== "preparation") throw Error("Preparation missing");
  assert.equal(
    material.document.body.title.copy.text,
    "Neutral parent preparation",
  );
  assert.equal(
    material.document.preparationHash,
    directory.preparation.kind === "required"
      ? directory.preparation.requiredHash
      : undefined,
  );
  const preview = await c.app.parentMaterial({
    kind: "firstTaskPreview",
    packageHash: parseHash({ kind: "package", value: f.target }),
  });
  assert.equal(preview.kind, "firstTaskPreview");
  if (preview.kind !== "firstTaskPreview") throw Error("Preview missing");
  assert.equal(
    preview.task.task.id,
    resolvedLessons(f.content)[0]?.tasks[0]?.task.id,
  );
  const ack = await prepareProfileAdministration({
    selection: directory.selection,
    ids: f.ids,
    hash,
    intent: {
      kind: "acknowledgePreparation",
      directory: directory.administration,
      hash: material.document.preparationHash,
    },
  });
  const receipt = await c.app.administer(ack);
  assert.equal(receipt.kind, "profileCommitted");
  const retained = new Map(f.cache);
  f.cache.clear();
  f.setShell(false);
  assert.deepEqual(await c.app.administer(ack), receipt);
  const unavailable = await c.app.parentMaterial({
    kind: "preparation",
    packageHash: parseHash({ kind: "package", value: f.target }),
  });
  assert.equal(unavailable.kind, "unavailable");
  if (unavailable.kind !== "unavailable")
    throw Error("Expected unavailable material");
  assert.equal(unavailable.packageHash, f.target);
  assert.equal(unavailable.failure.kind, "content");
  for (const [key, value] of retained) f.cache.set(key, value);
  f.setShell(true);
  await confirmInitialProfile(c.app, f.ids, hash);
  async function command(
    kind: TeachingIntent["kind"],
    matches: (a: AvailableAction) => boolean = () => true,
  ) {
    const p = await selectedProjection(c.app);
    if (p.kind === "recovery") throw Error(p.message);
    const action = p.actions.find((a) => a.intent.kind === kind && matches(a));
    if (!action) throw Error(`Missing ${kind} at ${p.kind}`);
    return p.kind === "writing" || p.kind === "writingResult"
      ? prepareSelectedTeaching(c.app, () =>
          prepareWritingCommand({
            projection: p,
            action,
            barrier: { kind: "writing", documents: p.documents },
            ids: f.ids,
            hash,
          }),
        )
      : prepareSelectedTeaching(c.app, () =>
          prepareCommand({
            projection: p,
            request: { kind: "action", action },
            ids: f.ids,
            hash,
          }),
        );
  }
  const start = await command("start");
  const started = await executeTeaching(c.app, start);
  assert.equal(started.kind, "committed");
  const next = await command("continue");
  f.cache.clear();
  f.setShell(false);
  assert.deepEqual(await executeTeaching(c.app, start), started);
  await assert.rejects(executeTeaching(c.app, next));
  for (const [key, value] of retained) f.cache.set(key, value);
  f.setShell(true);
  assert.equal((await executeTeaching(c.app, next)).kind, "committed");
  for (let i = 0; i < 50; i++) {
    const p = await selectedProjection(c.app);
    if (p.kind === "completed") break;
    if (p.kind === "recovery") throw Error(p.message);
    assert.equal(
      (await executeTeaching(c.app, await command("continue"))).kind,
      "committed",
    );
  }
  const credits = c.db.prepare("SELECT package_hash FROM task_credit").all();
  assert.ok(credits.length > 0);
  assert.ok(credits.every((row) => row.package_hash === f.target));
  const p = await selectedProjection(c.app);
  if (p.kind === "recovery") throw Error(p.message);
  const writing = p.catalog.find((task) => task.optional);
  assert.ok(writing);
  await executeTeaching(
    c.app,
    await command(
      "start",
      (action) =>
        "taskId" in action.intent && action.intent.taskId === writing.id,
    ),
  );
  const skipped = await executeTeaching(c.app, await command("skipWriting"));
  assert.equal(skipped.kind, "committed");
  assert.equal(
    c.db
      .prepare(
        "SELECT c.package_hash FROM task_result r JOIN task_credit c ON c.credit_id=r.accepted_credit_id WHERE r.outcome='skipped'",
      )
      .get()?.package_hash,
    f.target,
  );
  const history = await c.app.readWork({
    selection: (await c.app.readDirectory()).selection,
    runId:
      skipped.kind === "committed"
        ? skipped.runId
        : parseId({ kind: "run", value: "unreachable" }),
  });
  assert.equal(history.value.summary.packageHash, f.target);
});

test("authenticated unsupported installation profile becomes a stable terminal rejection", async (t) => {
  const f = await fixture(t, "missingRole");
  const c = f.connect();
  const command = await f.command(c.app);
  await c.app.initialInstall(command);
  const rejected = await f.until(c.app, "rejected");
  assert.equal(rejected.fact.kind, "rejected");
  if (rejected.fact.kind !== "rejected") throw Error("Expected rejection");
  assert.equal(rejected.fact.reason, "unsupportedInstallProfile");
  assert.equal(rejected.fact.registeredPackageHash, null);
  assert.equal(
    c.db.prepare("SELECT count(*) n FROM installed_package").get()?.n,
    0,
  );
  assert.equal(
    c.db.prepare("SELECT count(*) n FROM course_activation").get()?.n,
    0,
  );
  const acquisitions = f.acquisitions;
  assert.deepEqual((await c.app.initialInstall(command)).fact, rejected.fact);
  assert.equal(f.acquisitions, acquisitions);
});

test("processed shell lease invalidation before activation COMMIT rolls B back to readyInactive", async (t) => {
  const f = await fixture(t);
  let invalidate = true;
  const c = f.connect(async (sql, work) => {
    const value = await work();
    if (invalidate && sql.startsWith('insert into "course_activation"')) {
      invalidate = false;
      f.setShell(false);
    }
    return value;
  });
  const command = await f.command(c.app);
  await c.app.initialInstall(command);
  await f.until(c.app, "readyInactive");
  for (let i = 0; i < 30; i++) {
    const read = (await c.app.installations()).commands[0];
    if (read?.availability.kind === "stale") break;
    await setImmediate();
  }
  assert.equal(invalidate, false);
  assert.equal(
    c.db.prepare("SELECT count(*) n FROM course_activation").get()?.n,
    0,
  );
  assert.equal(
    (await c.app.installations()).commands[0]?.fact.kind,
    "readyInactive",
  );
  f.setShell(true);
  await c.app.initialInstall(command);
  await f.until(c.app, "activated");
});

test("authenticated unsupported preparation document is terminal without misclassifying crypto failure", async (t) => {
  const f = await fixture(t, "unsupportedDocument");
  const c = f.connect();
  const command = await f.command(c.app);
  await c.app.initialInstall(command);
  const rejected = await f.until(c.app, "rejected");
  if (rejected.fact.kind !== "rejected") throw Error("Expected rejection");
  assert.equal(rejected.fact.reason, "unsupportedInstallProfile");
  assert.deepEqual((await c.app.initialInstall(command)).fact, rejected.fact);
});
test("preparation hashing failure and resource hash corruption remain retryable availability failures", async (t) => {
  for (const failure of ["crypto", "resource"]) {
    const f = await fixture(t);
    const c = f.connect();
    const command = await f.command(c.app);
    const first = f.curriculum[0];
    assert.notEqual(first, undefined);
    if (failure === "crypto") f.setHashFailure(true);
    else f.curriculum[0] = 0;
    await c.app.initialInstall(command);
    let settled = false;
    for (let i = 0; i < 300; i++) {
      const read = (await c.app.installations()).commands[0];
      if (read?.availability.kind === "stale") {
        assert.equal(read.fact.kind, "accepted");
        settled = true;
        break;
      }
      await setImmediate();
    }
    assert.equal(settled, true);
    assert.equal(
      c.db.prepare("SELECT count(*) n FROM installed_package").get()?.n,
      0,
    );
    f.setHashFailure(false);
    if (first !== undefined) f.curriculum[0] = first;
    await c.app.initialInstall(command);
    await f.until(c.app, "activated");
  }
});

test("another signed identity cannot overwrite a genuine readyInactive course/release", async (t) => {
  const f = await fixture(t);
  f.setShell(false);
  const c = f.connect();
  const first = await f.command(c.app);
  await c.app.initialInstall(first);
  await f.until(c.app, "readyInactive");
  for (let i = 0; i < 20; i++) await setImmediate();
  const bytes = c.db
    .prepare("SELECT verified_manifest FROM installed_package")
    .get()?.verified_manifest;
  const second = await f.command(
    c.app,
    "fixture.conflicting.release",
    await f.otherTarget(),
  );
  await c.app.initialInstall(second);
  let result;
  for (let i = 0; i < 300; i++) {
    result = (await c.app.installations()).commands.find(
      (read) => read.command.commandId === second.commandId,
    );
    if (result?.fact.kind === "rejected") break;
    await setImmediate();
  }
  assert.equal(result?.fact.kind, "rejected");
  if (result?.fact.kind !== "rejected") throw Error("Expected release refusal");
  assert.equal(result.fact.reason, "releaseIdentityConflict");
  assert.equal(result.fact.registeredPackageHash, null);
  assert.equal(
    c.db.prepare("SELECT count(*) n FROM installed_package").get()?.n,
    1,
  );
  assert.deepEqual(
    c.db.prepare("SELECT verified_manifest FROM installed_package").get()
      ?.verified_manifest,
    bytes,
  );
  assert.equal(
    c.db.prepare("SELECT count(*) n FROM course_activation").get()?.n,
    0,
  );
  assert.deepEqual((await c.app.initialInstall(second)).fact, result.fact);
});
test(
  "resource lock contention leaves metadata and exact final Retry available without granting material",
  { timeout: 30000 },
  async (t) => {
    const f = await fixture(t);
    const c = f.connect();
    const command = await f.command(c.app);
    await c.app.initialInstall(command);
    const final = await f.until(c.app, "activated");
    let release!: () => void;
    f.setResourceGate(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const key = parseHash({ kind: "package", value: f.target });
    const first = c.app.parentMaterial({
      kind: "preparation",
      packageHash: key,
    });
    const firstResult = first.then((value) =>
      assert.equal(value.kind, "unavailable"),
    );
    for (let i = 0; i < 30 && !f.contentLocked; i++) await setImmediate();
    assert.equal(f.contentLocked, true);
    const secondResult = c.app
      .parentMaterial({ kind: "preparation", packageHash: key })
      .then((value) => assert.equal(value.kind, "unavailable"));
    try {
      assert.equal(
        (await c.app.installations()).commands[0]?.fact.kind,
        "activated",
      );
      assert.deepEqual((await c.app.initialInstall(command)).fact, final.fact);
      f.cache.delete("preparation.json");
    } finally {
      release();
    }
    await Promise.all([firstResult, secondResult]);
    assert.equal(
      (await c.app.installations()).commands[0]?.fact.kind,
      "activated",
    );
  },
);

test("authenticated unsupported curriculum document is a stable installation profile refusal", async (t) => {
  const f = await fixture(t, "unsupportedCurriculum");
  const c = f.connect();
  const command = await f.command(c.app);
  await c.app.initialInstall(command);
  const rejected = await f.until(c.app, "rejected");
  if (rejected.fact.kind !== "rejected")
    throw Error("Expected profile rejection");
  assert.equal(rejected.fact.reason, "unsupportedInstallProfile");
  assert.equal(rejected.fact.registeredPackageHash, null);
  assert.deepEqual((await c.app.initialInstall(command)).fact, rejected.fact);
});

test("genuine cumulative development preserves a retained cursor and installed mode fences its exact old pin", async (t) => {
  const f = await fixture(t);
  const connection = f.connect();
  const executor = executorFor(connection.db);
  const first = createTeachingApplication({
    executor,
    content: f.content,
    preparation: syntheticPreparation,
    ids: f.ids,
    hash,
  });
  await confirmInitialProfile(first, f.ids, hash);
  const projection = await selectedProjection(first);
  if (projection.kind === "recovery") throw Error(projection.message);
  const action = projection.actions.find(
    (action) => action.intent.kind === "start",
  );
  assert.ok(action);
  const command = await prepareSelectedTeaching(first, () =>
    prepareCommand({
      projection,
      request: { kind: "action", action },
      ids: f.ids,
      hash,
    }),
  );
  assert.equal((await executeTeaching(first, command)).kind, "committed");
  const body = { ...f.content.body, releaseId: "fixture.retained.later" };
  const next = await parseRuntimePackage(
    { formatVersion: 1, body, packageHash: await hash(canonical(body)) },
    hash,
  );
  const later = createTeachingApplication({
    executor,
    content: next,
    preparation: syntheticPreparation,
    ids: f.ids,
    hash,
  });
  const directory = await later.readDirectory();
  assert.equal(
    connection.db
      .prepare("SELECT active_package_hash FROM course_activation")
      .get()?.active_package_hash,
    next.packageHash,
  );
  assert.equal(
    connection.db
      .prepare(
        "SELECT s.package_hash FROM course_cursor c JOIN session s ON s.session_id=c.resume_session_id",
      )
      .get()?.package_hash,
    f.content.packageHash,
  );
  const installedDirectory = await connection.app.readDirectory();
  assert.deepEqual(installedDirectory.selection, directory.selection);
  const before = connection.db
    .prepare("SELECT * FROM task_run ORDER BY run_id")
    .all();
  const exact = (error: unknown) =>
    error instanceof InstalledContentUnavailableError &&
    error.packageHash === f.content.packageHash;
  await assert.rejects(
    connection.app.readApplication({
      selection: installedDirectory.selection,
      target: { kind: "cursor" },
    }),
    exact,
  );
  await assert.rejects(
    connection.app.readDeparture({ selection: installedDirectory.selection }),
    exact,
  );
  assert.deepEqual(
    connection.db.prepare("SELECT * FROM task_run ORDER BY run_id").all(),
    before,
  );
});

test("parent material requests reject unknown fields/kinds before storage or resources", async (t) => {
  const f = await fixture(t);
  const c = f.connect();
  for (const request of [
    { kind: "unknown", packageHash: f.target },
    { kind: "preparation", packageHash: f.target, extra: true },
    { kind: "preparation", packageHash: "invalid" },
  ])
    await assert.rejects(Reflect.apply(c.app.parentMaterial, c.app, [request]));
  assert.equal(
    c.db
      .prepare("SELECT count(*) n FROM sqlite_master WHERE type='table'")
      .get()?.n,
    0,
  );
  assert.equal(f.acquisitions, 0);
  assert.equal(f.downloads, 0);
});

for (const recoveryCase of [
  "ordinary",
  "retired during reconcile",
  "retired at entry",
  "warm administration settled",
  "retired warm administration settled",
]) {
  test(`signed canonical handwriting, exact ink Retry and cold recovery preserve the outer key and full saved history: ${recoveryCase}`, async (t) => {
    const f = await fixture(t);
    const c = f.connect();
    await c.app.initialInstall(await f.command(c.app));
    await f.until(c.app, "activated");
    await confirmInitialProfile(c.app, f.ids, hash);
    const entry = await selectedProjection(c.app);
    if (entry.kind === "recovery") throw Error(entry.message);
    const writing = entry.catalog.find((task) => task.optional);
    assert.ok(writing);
    const start = entry.actions.find(
      (action) =>
        action.intent.kind === "start" &&
        "taskId" in action.intent &&
        action.intent.taskId === writing.id,
    );
    assert.ok(start);
    await executeTeaching(
      c.app,
      await prepareSelectedTeaching(c.app, () =>
        prepareCommand({
          projection: entry,
          request: { kind: "action", action: start },
          ids: f.ids,
          hash,
        }),
      ),
    );
    let view = await selectedProjection(c.app);
    if (view.kind !== "writing") throw Error("Writing expected");
    let token = view.documents[0];
    assert.ok(token);
    assert.equal(token.packageHash, f.target);
    let before = await selectedInk(c.app, { token });
    if (!before.writable) {
      assert.equal(view.turn.presentation.kind, "writing");
      if (view.turn.presentation.kind !== "writing")
        throw Error("Writing turn expected");
      assert.equal(view.turn.presentation.obligation.kind, "soundResponse");
      const action = view.actions.find((a) => a.intent.kind === "continue");
      assert.ok(action);
      const projection = view;
      await executeTeaching(
        c.app,
        await prepareSelectedTeaching(c.app, () =>
          prepareWritingCommand({
            projection,
            action,
            barrier: { kind: "writing", documents: projection.documents },
            ids: f.ids,
            hash,
          }),
        ),
      );
      view = await selectedProjection(c.app);
      if (view.kind !== "writing") throw Error("Writing expected");
      token = view.documents[0];
      assert.ok(token);
      before = await selectedInk(c.app, { token });
    }
    assert.equal(before.writable, true);
    const strokeId = parseId({ kind: "stroke", value: f.ids() });
    const layer = layerForPhase(token.phase);
    async function prepare(token: DocumentToken, edit: InkEdit) {
      return prepareSelectedInk(c.app, () =>
        prepareInkCommand({ token, edit, ids: f.ids, hash }),
      );
    }
    const begin = await prepare(token, {
      kind: "begin",
      strokeId,
      layer,
      brush: {
        kind: "round",
        width: 5,
        colorRole: layer === "model" ? "model" : "child",
        cap: "round",
        join: "round",
      },
      chunks: [
        {
          chunkIndex: 0,
          firstPointIndex: 0,
          pointCount: 2,
          codecVersion: 1,
          payload: Array.from(
            encodeInkPoints({
              bounds: before.bounds,
              points: [
                { x: 60, y: 100, elapsedMs: 0 },
                { x: 100, y: 120, elapsedMs: 8 },
              ],
            }),
          ),
        },
      ],
    });
    const begun = await executeInk(c.app, begin);
    if (begun.kind !== "inkCommitted") throw Error(begun.message);
    const finalize = await prepare(begun.token, {
      kind: "finalize",
      strokeId,
      layer,
      chunks: [],
      status: "finished",
    });
    const finalized = await executeInk(c.app, finalize);
    if (finalized.kind !== "inkCommitted") throw Error(finalized.message);
    const saved = await selectedInk(c.app, { token: finalized.token });
    assert.equal(saved.strokes.length, 1);
    assert.equal(saved.strokes[0]?.pointCount, 2);
    const tables = [
      "ink_stroke",
      "ink_point_chunk",
      "ink_history",
      "ink_operation",
    ];
    const rows = Object.fromEntries(
      tables.map((name) => [
        name,
        c.db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all(),
      ]),
    );
    if (recoveryCase.includes("warm administration settled")) {
      const initialDirectory = await c.app.readDirectory();
      const originalOwner = initialDirectory.selection.owner;
      const created = await c.app.administer(
        await prepareProfileAdministration({
          selection: initialDirectory.selection,
          departure: await c.app.readDeparture({
            selection: initialDirectory.selection,
          }),
          intent: {
            kind: "createAndSelect",
            directory: initialDirectory.administration,
            preferences: { avatarId: "owl" },
          },
          ids: f.ids,
          hash,
        }),
      );
      assert.equal(created.kind, "profileCommitted");
      const otherDirectory = await c.app.readDirectory();
      const other = otherDirectory.profiles.find(
        (profile) =>
          profile.edit.owner.profileId ===
          otherDirectory.selection.owner.profileId,
      );
      assert.ok(other);
      const deletion = await prepareProfileRemoval({
        selection: otherDirectory.selection,
        departure: await c.app.readDeparture({
          selection: otherDirectory.selection,
        }),
        intent: {
          kind: "deleteProfile",
          directory: otherDirectory.administration,
          target: other.edit,
          successor: { kind: "existing", owner: originalOwner },
        },
        ids: f.ids,
        hash,
      });
      const deleted = await c.app.administer(deletion);
      assert.equal(deleted.kind, "profileCommitted");
      c.retire();
      c.db.close();
      let armed = false;
      let fired = false;
      const warm = f.connect(async (sql, work) => {
        const result = await work();
        if (armed && sql.startsWith('update "ink_document"')) {
          armed = false;
          fired = true;
          warm.retire();
        }
        return result;
      });
      const opening = await warm.app.openRecovery({
        kind: "warm",
        selection: deletion.selection,
        retainedStrokeIds: [],
        teaching: null,
        administration: deletion,
      });
      const recovered = await warm.app.recoverAdministration({
        recoveryId: opening.recoveryId,
        command: deletion,
      });
      assert.equal(recovered.result.kind, "profileCommitted");
      assert.equal(recovered.resolution, "receiptOnly");
      const allTables = ["ink_document", ...tables];
      const snapshot = Object.fromEntries(
        allTables.map((name) => [
          name,
          warm.db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all(),
        ]),
      );
      const reconcile = () =>
        warm.app.reconcileRecovery({
          recoveryId: opening.recoveryId,
          choice: { kind: "warm", settledStrokeIds: [] },
        });
      if (recoveryCase.startsWith("retired")) {
        armed = true;
        await assert.rejects(reconcile(), /retired/);
        assert.equal(fired, true);
        for (const name of allTables)
          assert.deepEqual(
            warm.db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all(),
            snapshot[name],
          );
        warm.db.close();
        const fresh = f.connect();
        const recovery = await fresh.app.openRecovery({ kind: "cold" });
        await fresh.app.reconcileRecovery({
          recoveryId: recovery.recoveryId,
          choice: { kind: "cold" },
        });
        const restored = await selectedProjection(fresh.app);
        if (restored.kind !== "writing")
          throw Error("Original child's writing must survive");
        const restoredToken = restored.documents.find(
          (value) => value.documentId === token.documentId,
        );
        assert.ok(restoredToken);
        const ink = await selectedInk(fresh.app, { token: restoredToken });
        assert.deepEqual(ink.strokes, saved.strokes);
        assert.deepEqual(ink.histories, saved.histories);
      } else {
        await reconcile();
        const restored = await selectedProjection(warm.app);
        if (restored.kind !== "writing")
          throw Error("Original child's writing must survive");
        const restoredToken = restored.documents.find(
          (value) => value.documentId === token.documentId,
        );
        assert.ok(restoredToken);
        const ink = await selectedInk(warm.app, { token: restoredToken });
        assert.deepEqual(ink.strokes, saved.strokes);
        assert.deepEqual(ink.histories, saved.histories);
      }
      return;
    }
    const retained = new Map(f.cache);
    f.cache.clear();
    f.setShell(false);
    assert.deepEqual(await executeInk(c.app, finalize), finalized);
    c.retire();
    c.db.close();
    let retireDuringRecovery = false;
    let retiredRecovery = false;
    let recoveryCommits = 0;
    const cold = f.connect(async (sql, work) => {
      const result = await work();
      if (retireDuringRecovery && sql.startsWith('update "ink_document"')) {
        retireDuringRecovery = false;
        retiredRecovery = true;
        cold.retire();
      }
      if (retiredRecovery && sql === "COMMIT") recoveryCommits++;
      return result;
    });
    assert.deepEqual(await executeInk(cold.app, finalize), finalized);
    for (const [key, value] of retained) f.cache.set(key, value);
    f.setShell(true);
    const opening = await cold.app.openRecovery({ kind: "cold" });
    const recoveryTables = ["ink_document", ...tables];
    const beforeRecovery = Object.fromEntries(
      recoveryTables.map((name) => [
        name,
        cold.db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all(),
      ]),
    );
    if (recoveryCase !== "ordinary") {
      if (recoveryCase === "retired at entry") cold.retire();
      else retireDuringRecovery = true;
      const result = await cold.app
        .reconcileRecovery({
          recoveryId: opening.recoveryId,
          choice: { kind: "cold" },
        })
        .then(
          () => ({ kind: "returned" }),
          (error: unknown) => ({ kind: "refused", error }),
        );
      t.diagnostic(
        `Recovery ${recoveryCase}: ${result.kind}, commits after retirement ${recoveryCommits}`,
      );
      for (const name of recoveryTables)
        assert.deepEqual(
          cold.db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all(),
          beforeRecovery[name],
          `Retired recovery must preserve ${name}`,
        );
      assert.equal(result.kind, "refused");
      if (recoveryCase === "retired during reconcile")
        assert.equal(retiredRecovery, true);
      cold.db.close();
      const fresh = f.connect();
      const nextOpening = await fresh.app.openRecovery({ kind: "cold" });
      await fresh.app.reconcileRecovery({
        recoveryId: nextOpening.recoveryId,
        choice: { kind: "cold" },
      });
      const nextView = await selectedProjection(fresh.app);
      if (nextView.kind !== "writing")
        throw Error("Writing must survive retired recovery");
      const freshToken = nextView.documents.find(
        (value) => value.documentId === token.documentId,
      );
      assert.ok(freshToken);
      const freshInk = await selectedInk(fresh.app, { token: freshToken });
      assert.deepEqual(freshInk.strokes, saved.strokes);
      assert.deepEqual(freshInk.histories, saved.histories);
      return;
    }
    await cold.app.reconcileRecovery({
      recoveryId: opening.recoveryId,
      choice: { kind: "cold" },
    });
    const reopened = await selectedProjection(cold.app);
    if (reopened.kind !== "writing") throw Error("Restored writing expected");
    const restoredToken = reopened.documents.find(
      (value) => value.documentId === token.documentId,
    );
    assert.ok(restoredToken);
    assert.equal(restoredToken.packageHash, f.target);
    const restored = await selectedInk(cold.app, { token: restoredToken });
    assert.deepEqual(restored.strokes, saved.strokes);
    assert.deepEqual(restored.histories, saved.histories);
    for (const name of tables)
      assert.deepEqual(
        cold.db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all(),
        rows[name],
      );
    assert.ok(
      cold.db
        .prepare("SELECT package_hash FROM ink_document")
        .all()
        .every((row) => row.package_hash === f.target),
    );
  });
}

for (const stage of ["intent", "intent rejection", "registration rejection"]) {
  test(`retired installation ${stage} callback rolls back every return path`, async (t) => {
    const f = await fixture(t);
    let armed = false;
    let fired = false;
    const c = f.connect(async (sql, work) => {
      const result = await work();
      const matches =
        stage === "intent"
          ? sql.startsWith('insert into "installation_command"')
          : sql.startsWith('update "installation_command"') &&
            c.db
              .prepare("SELECT stage FROM installation_command")
              .all()
              .some((row) => row.stage === "rejected");
      if (armed && matches) {
        armed = false;
        fired = true;
        c.retire();
      }
      if (fired && sql === "COMMIT")
        t.diagnostic(
          `Forbidden post-retirement COMMIT ${stage}: ${JSON.stringify(c.db.prepare("SELECT command_id, stage FROM installation_command ORDER BY command_id").all())}`,
        );
      return result;
    });
    let command = await f.command(c.app);
    if (stage === "intent rejection") {
      await c.app.initialInstall(command);
      await f.until(c.app, "activated");
      command = await f.command(c.app, "fixture.retired.rejection");
    } else if (stage === "registration rejection") {
      command = parseInitialInstallCommand({
        ...command,
        target: { ...command.target, releaseId: "fixture.mismatched.release" },
      });
    }
    armed = true;
    if (stage === "registration rejection") {
      await c.app.initialInstall(command);
      for (let i = 0; i < 300 && !fired; i++) await setImmediate();
      for (let i = 0; i < 10; i++) await setImmediate();
    } else {
      await assert.rejects(c.app.initialInstall(command), /[Rr]etired/);
    }
    assert.equal(fired, true);
    const row = c.db
      .prepare("SELECT stage FROM installation_command WHERE command_id = ?")
      .get(command.commandId);
    assert.equal(
      row?.stage,
      stage === "registration rejection" ? "accepted" : undefined,
    );
    c.db.close();
    const cold = f.connect();
    const retry = await cold.app.initialInstall(command);
    if (stage === "intent") {
      assert.equal(retry.fact.kind, "accepted");
      await f.until(cold.app, "activated");
    } else {
      if (stage === "registration rejection") {
        await f.until(cold.app, "rejected");
      } else assert.equal(retry.fact.kind, "rejected");
    }
  });
}
test("readyInactive cold exact Retry activates offline from intact actual cache", async (t) => {
  const f = await fixture(t);
  f.setShell(false);
  const c = f.connect();
  const command = await f.command(c.app);
  await c.app.initialInstall(command);
  await f.until(c.app, "readyInactive");
  for (let i = 0; i < 20; i++) await setImmediate();
  c.retire();
  c.db.close();
  f.setShell(true);
  f.setOffline(true);
  const acquisitions = f.acquisitions;
  const downloads = f.downloads;
  const cold = f.connect();
  assert.equal(
    (await cold.app.installations()).commands[0]?.fact.kind,
    "readyInactive",
  );
  await cold.app.initialInstall(command);
  await f.until(cold.app, "activated");
  assert.equal(f.acquisitions, acquisitions);
  assert.equal(f.downloads, downloads);
  assert.equal(
    cold.db.prepare("SELECT count(*) n FROM installed_package").get()?.n,
    1,
  );
  assert.equal(
    cold.db.prepare("SELECT count(*) n FROM course_activation").get()?.n,
    1,
  );
});

for (const invalidation of ["lifetime", "lease"]) {
  test(`${invalidation} activation rejection rolls B back and cold exact Retry preserves registration`, async (t) => {
    const f = await fixture(t);
    f.setShell(false);
    let armed = false;
    let fired = false;
    const c = f.connect(async (sql, work) => {
      const result = await work();
      if (
        armed &&
        sql.startsWith('update "installation_command"') &&
        c.db
          .prepare(
            "SELECT stage FROM installation_command WHERE command_id = 'fixture.second.command'",
          )
          .get()?.stage === "rejected"
      ) {
        armed = false;
        fired = true;
        if (invalidation === "lifetime") c.retire();
        else f.setShell(false);
      }
      if (fired && sql === "COMMIT")
        t.diagnostic("Forbidden activation rejection COMMIT");
      return result;
    });
    const first = await f.command(c.app);
    const second = await f.command(c.app, "fixture.second.command");
    await c.app.initialInstall(first);
    await f.until(c.app, "readyInactive");
    for (let i = 0; i < 20; i++) await setImmediate();
    await c.app.initialInstall(second);
    for (let i = 0; i < 300; i++) {
      if (
        (await c.app.installations()).commands.find(
          (x) => x.command.commandId === second.commandId,
        )?.fact.kind === "readyInactive"
      )
        break;
      await setImmediate();
    }
    for (let i = 0; i < 20; i++) await setImmediate();
    assert.equal(
      c.db
        .prepare("SELECT stage FROM installation_command WHERE command_id = ?")
        .get(second.commandId)?.stage,
      "readyInactive",
    );
    f.setShell(true);
    await c.app.initialInstall(first);
    await f.until(c.app, "activated");
    armed = true;
    await c.app.initialInstall(second);
    for (let i = 0; i < 300 && !fired; i++) await setImmediate();
    for (let i = 0; i < 20; i++) await setImmediate();
    assert.equal(fired, true);
    assert.equal(
      c.db
        .prepare("SELECT stage FROM installation_command WHERE command_id = ?")
        .get(second.commandId)?.stage,
      "readyInactive",
    );
    assert.equal(
      c.db.prepare("SELECT count(*) n FROM course_activation").get()?.n,
      1,
    );
    c.retire();
    c.db.close();
    f.setShell(true);
    const fresh = f.connect();
    await fresh.app.initialInstall(second);
    for (let i = 0; i < 300; i++) {
      const state = (await fresh.app.installations()).commands.find(
        (x) => x.command.commandId === second.commandId,
      );
      if (state?.fact.kind === "rejected") {
        assert.equal(state.fact.reason, "activationChanged");
        assert.equal(state.fact.registeredPackageHash, f.target);
        return;
      }
      await setImmediate();
    }
    assert.fail(
      "Cold exact Retry must durably reject stale activation without losing registered bytes",
    );
  });
}
for (const cachedLength of ["declared", "unknown"]) {
  test(`accepted after genuine A rollback cold exact Retry activates offline from complete cache: ${cachedLength} length`, async (t) => {
    const f = await fixture(t);
    let commits = 0;
    let armed = false;
    let fault = false;
    const c = f.connect(async (sql, work) => {
      if (armed && sql === "COMMIT" && ++commits === 2) {
        fault = true;
        armed = false;
        throw new Error("Genuine A before-COMMIT failure");
      }
      return work();
    });
    const command = await f.command(c.app);
    commits = 0;
    armed = true;
    await c.app.initialInstall(command);
    for (let i = 0; i < 300; i++) {
      const state = (await c.app.installations()).commands[0];
      if (fault && state?.availability.kind === "stale") break;
      await setImmediate();
    }
    assert.equal(fault, true);
    assert.equal(
      c.db.prepare("SELECT stage FROM installation_command").get()?.stage,
      "accepted",
    );
    assert.equal(
      c.db.prepare("SELECT count(*) n FROM installed_package").get()?.n,
      0,
    );
    assert.equal(f.cache.size, 3);
    c.retire();
    c.db.close();
    f.setOffline(true);
    f.setCachedContentLength(cachedLength === "declared");
    const acquisitions = f.acquisitions;
    const downloads = f.downloads;
    const cold = f.connect();
    await cold.app.initialInstall(command);
    await f.until(cold.app, "activated");
    assert.equal(f.acquisitions, acquisitions);
    assert.equal(f.downloads, downloads);
    assert.equal(
      cold.db.prepare("SELECT count(*) n FROM installed_package").get()?.n,
      1,
    );
    assert.equal(
      cold.db.prepare("SELECT count(*) n FROM course_activation").get()?.n,
      1,
    );
  });
}
for (const failure of ["missing", "corrupt", "extra"]) {
  test(`readyInactive offline Retry refuses ${failure} actual namespace without SQL rehydration`, async (t) => {
    const f = await fixture(t);
    f.setShell(false);
    const c = f.connect();
    const command = await f.command(c.app);
    await c.app.initialInstall(command);
    await f.until(c.app, "readyInactive");
    for (let i = 0; i < 20; i++) await setImmediate();
    c.retire();
    c.db.close();
    f.setShell(true);
    f.setOffline(true);
    if (failure === "missing") f.cache.delete("preparation.json");
    else if (failure === "corrupt")
      f.cache.set("preparation.json", {
        bytes: new Uint8Array(f.preparation.length),
        mediaType: "application/json",
      });
    else
      f.cache.set("unexpected.json", {
        bytes: new Uint8Array([123, 125]),
        mediaType: "application/json",
      });
    const before = new Map(
      [...f.cache].map(([key, value]) => [
        key,
        { ...value, bytes: Uint8Array.from(value.bytes) },
      ]),
    );
    const downloads = f.downloads;
    const acquisitions = f.acquisitions;
    const cold = f.connect();
    await cold.app.initialInstall(command);
    let settled = false;
    for (let i = 0; i < 300; i++) {
      const state = (await cold.app.installations()).commands[0];
      if (state?.availability.kind === "stale") {
        assert.equal(state.fact.kind, "readyInactive");
        settled = true;
        break;
      }
      await setImmediate();
    }
    assert.equal(settled, true);
    assert.equal(f.downloads, downloads);
    assert.equal(f.acquisitions, acquisitions);
    assert.deepEqual(f.cache, before);
    assert.equal(
      cold.db.prepare("SELECT count(*) n FROM course_activation").get()?.n,
      0,
    );
    assert.deepEqual(
      cold.db.prepare("SELECT verified_manifest FROM installed_package").get()
        ?.verified_manifest,
      f.envelope,
    );
  });
}

for (const entry of [
  "readDirectory",
  "installations",
  "initialInstall",
] as const) {
  test(`installed initialization refuses retired ${entry} before any SQL`, async (t) => {
    const f = await fixture(t);
    const sql: string[] = [];
    const c = f.connect(async (statement, work) => {
      sql.push(statement);
      return work();
    });
    c.retire();
    const request =
      entry === "initialInstall"
        ? c.app.initialInstall(
            parseInitialInstallCommand({
              version: 1,
              kind: "initialInstall",
              installationId: "fixture.not.opened",
              commandId: "fixture.retired.opening",
              source: { mode: "fixture" },
              target: {
                publicationHash: f.target,
                courseId: f.content.body.courseId,
                releaseId: f.content.body.releaseId,
              },
              expected: { kind: "absent" },
            }),
          )
        : c.app[entry]();
    const outcome = await request.then(
      () => "resolved",
      (error: unknown) =>
        error instanceof Error
          ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ""}`
          : String(error),
    );
    t.diagnostic(JSON.stringify({ outcome, sqlCount: sql.length }));
    assert.match(outcome, /[Rr]etired/);
    assert.equal(sql.length, 0);
    assert.deepEqual(c.db.prepare("SELECT * FROM sqlite_master").all(), []);
    assert.equal(f.acquisitions, 0);
    assert.equal(f.downloads, 0);
  });
}

for (const retirementPoint of ["profile", "installation_profile_state"]) {
  test(`installed initialization rolls back ${retirementPoint} retirement before later writes or COMMIT`, async (t) => {
    const f = await fixture(t);
    let retired = false;
    const afterRetirement: string[] = [];
    const c = f.connect(async (sql, work) => {
      if (retired) afterRetirement.push(sql);
      const result = await work();
      if (sql.startsWith(`insert into "${retirementPoint}"`)) {
        retired = true;
        c.retire();
      }
      return result;
    });
    const outcome = await c.app.readDirectory().then(
      () => "resolved",
      (error: unknown) =>
        error instanceof Error
          ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ""}`
          : String(error),
    );
    t.diagnostic(JSON.stringify({ outcome, retired, afterRetirement }));
    assert.equal(retired, true);
    assert.match(outcome, /[Rr]etired/);
    assert.deepEqual(afterRetirement, ["ROLLBACK"]);
    for (const table of [
      "installation",
      "profile",
      "installation_profile_state",
    ])
      assert.deepEqual(c.db.prepare(`SELECT * FROM ${table}`).all(), []);
    c.db.close();
    const fresh = f.connect();
    const directory = await fresh.app.readDirectory();
    assert.equal(directory.profiles.length, 1);
    assert.equal((await fresh.app.installations()).commands.length, 0);
  });
}

function publicationPersonalCensus(db: DatabaseSync): string {
  const master = db
    .prepare(
      "SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name",
    )
    .all();
  const names = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all();
  const tables: Record<string, unknown[]> = {};
  const encode = (value: unknown): string =>
    JSON.stringify(value, (_key, item: unknown) =>
      typeof item === "bigint"
        ? { sqliteInteger: item.toString() }
        : item instanceof Uint8Array
          ? { sqliteBlob: Buffer.from(item).toString("hex") }
          : item,
    );
  for (const row of names) {
    if (typeof row.name !== "string") throw Error("Invalid SQLite table name");
    const statement = db.prepare(
      'SELECT * FROM "' + row.name.replaceAll('"', '""') + '"',
    );
    statement.setReadBigInts(true);
    tables[row.name] = statement
      .all()
      .sort((a, b) => encode(a).localeCompare(encode(b)));
  }
  return encode({
    master,
    tables,
    userVersion: db.prepare("PRAGMA user_version").get(),
  });
}

for (const path of [
  "_publication-envelope.json",
  "curriculum.json",
  "preparation.json",
])
  for (const fault of ["missing", "corrupt"] as const)
    test(
      "publication recovery: exact cache-only Check and Repair preserve all SQL for " +
        fault +
        " " +
        path,
      async (t) => {
        const f = await fixture(t),
          c = f.connect();
        await c.app.initialInstall(await f.command(c.app));
        await f.until(c.app, "activated");
        const catalog = await c.app.installations();
        const target = {
          installationId: catalog.installationId,
          packageHash: parseHash({ kind: "package", value: f.target }),
        };
        const retained = f.cache.get(path);
        assert.ok(retained);
        if (fault === "missing") f.cache.delete(path);
        else f.cache.set(path, { ...retained, bytes: Uint8Array.from([123]) });
        const before = publicationPersonalCensus(c.db),
          acquisitions = f.acquisitions,
          downloads = f.downloads;
        f.setOffline(true);
        const checked = await c.app.checkPublication(target);
        assert.equal(checked.kind, "unavailable");
        if (checked.kind !== "unavailable")
          throw Error("Missing typed local failure");
        assert.equal(checked.reason.kind, "content");
        assert.equal(f.acquisitions, acquisitions);
        assert.equal(f.downloads, downloads);
        assert.equal(publicationPersonalCensus(c.db), before);
        const unavailable = await c.app.repairPublication(target);
        assert.equal(unavailable.kind, "unavailable");
        assert.equal(publicationPersonalCensus(c.db), before);
        f.setOffline(false);
        const repaired = await c.app.repairPublication(target);
        assert.deepEqual(repaired, { kind: "verified", target });
        assert.equal(publicationPersonalCensus(c.db), before);
        assert.ok(f.acquisitions > acquisitions);
        assert.ok(f.downloads > downloads);
        const acquired = f.acquisitions,
          downloaded = f.downloads;
        assert.deepEqual(await c.app.checkPublication(target), {
          kind: "verified",
          target,
        });
        assert.equal(f.acquisitions, acquired);
        assert.equal(f.downloads, downloaded);
        assert.equal(publicationPersonalCensus(c.db), before);
        assert.notEqual(target.packageHash, f.content.packageHash);
        assert.notEqual(
          target.packageHash,
          createHash("sha256").update(f.curriculum).digest("hex"),
        );
        assert.notEqual(
          f.content.packageHash,
          createHash("sha256").update(f.curriculum).digest("hex"),
        );
      },
    );

test("publication recovery: wrong installation and unowned targets never acquire", async (t) => {
  const f = await fixture(t),
    c = f.connect();
  await c.app.initialInstall(await f.command(c.app));
  await f.until(c.app, "activated");
  const catalog = await c.app.installations(),
    before = publicationPersonalCensus(c.db),
    acquisitions = f.acquisitions,
    downloads = f.downloads;
  const wrong = {
    installationId: parseId({
      kind: "installation",
      value: "wrong.installation",
    }),
    packageHash: parseHash({ kind: "package", value: f.target }),
  };
  assert.deepEqual(await c.app.repairPublication(wrong), {
    kind: "notAuthorized",
    target: wrong,
  });
  const absent = {
    installationId: catalog.installationId,
    packageHash: parseHash({ kind: "package", value: "e".repeat(64) }),
  };
  const result = await c.app.repairPublication(absent);
  assert.equal(result.kind, "unavailable");
  if (result.kind !== "unavailable")
    throw Error("Expected representation refusal");
  assert.equal(result.reason.kind, "representationUnavailable");
  assert.equal(f.acquisitions, acquisitions);
  assert.equal(f.downloads, downloads);
  assert.equal(publicationPersonalCensus(c.db), before);
});

test("publication recovery: unexpected namespace inventory is refused without deletion or personal writes", async (t) => {
  const f = await fixture(t),
    c = f.connect();
  await c.app.initialInstall(await f.command(c.app));
  await f.until(c.app, "activated");
  const catalog = await c.app.installations(),
    target = {
      installationId: catalog.installationId,
      packageHash: parseHash({ kind: "package", value: f.target }),
    },
    before = publicationPersonalCensus(c.db);
  const extra = {
    bytes: Uint8Array.from([1, 2, 3]),
    mediaType: "application/json",
  };
  f.cache.set("unexpected.json", extra);
  const result = await c.app.repairPublication(target);
  assert.equal(result.kind, "unavailable");
  assert.deepEqual(f.cache.get("unexpected.json"), extra);
  assert.equal(publicationPersonalCensus(c.db), before);
});

for (const hostile of ["signature", "different-target"] as const)
  test(
    "publication recovery: hostile envelope " +
      hostile +
      " is a closed refusal with no personal writes",
    async (t) => {
      const f = await fixture(t),
        c = f.connect();
      await c.app.initialInstall(await f.command(c.app));
      await f.until(c.app, "activated");
      const catalog = await c.app.installations(),
        target = {
          installationId: catalog.installationId,
          packageHash: parseHash({ kind: "package", value: f.target }),
        };
      let other: PublicationHash | undefined;
      if (hostile === "signature") {
        const raw = JSON.parse(new TextDecoder().decode(f.envelope));
        raw.signature =
          (raw.signature.startsWith("A") ? "B" : "A") + raw.signature.slice(1);
        f.replaceEnvelope(publicationUtf8(canonical(raw)));
      } else {
        other = await f.otherTarget();
        f.replaceEnvelope(f.envelopeFor(other));
      }
      f.cache.clear();
      const before = publicationPersonalCensus(c.db);
      const result = await c.app.repairPublication(target);
      assert.equal(result.kind, "unavailable");
      if (result.kind !== "unavailable" || result.reason.kind !== "content")
        throw Error("Expected closed content refusal");
      assert.equal(result.reason.failure.kind, "corrupt");
      assert.equal(publicationPersonalCensus(c.db), before);
      assert.equal(f.cache.size, 0);
      if (other) assert.equal(f.namespacePresent(other), false);
    },
  );

async function seedControlledFutureRelease(
  db: DatabaseSync,
  f: Awaited<ReturnType<typeof fixture>>,
) {
  const next = await f.anotherRelease();
  db.prepare(
    "INSERT INTO installed_package SELECT ?,course_id,?,content_schema_version,capabilities,manifest_version,?,state,? FROM installed_package WHERE package_hash=?",
  ).run(next.target, next.releaseId, next.envelope, next.target, f.target);
  db.prepare(
    "INSERT INTO installed_representation(package_hash,kind,mode,curriculum_utf8,preparation_utf8) VALUES(?,'signed-v1','fixture',?,?)",
  ).run(next.target, next.curriculum, f.preparation);
  return next;
}
async function startRealPinnedTask(
  f: Awaited<ReturnType<typeof fixture>>,
  app: ReturnType<typeof createTeachingApplication>,
) {
  await confirmInitialProfile(app, f.ids, hash);
  const entry = await selectedProjection(app);
  if (entry.kind === "recovery") throw Error(entry.message);
  const start = entry.actions.find((action) => action.intent.kind === "start");
  assert.ok(start);
  await executeTeaching(
    app,
    await prepareSelectedTeaching(app, () =>
      prepareCommand({
        projection: entry,
        request: { kind: "action", action: start },
        ids: f.ids,
        hash,
      }),
    ),
  );
}

test("publication recovery: unchanged old session pin remains authorized after prior activation changes", async (t) => {
  const f = await fixture(t),
    c = f.connect();
  await c.app.initialInstall(await f.command(c.app));
  await f.until(c.app, "activated");
  await startRealPinnedTask(f, c.app);
  // Controlled future-update fixture setup; no production update API exists yet.
  const next = await seedControlledFutureRelease(c.db, f);
  c.db
    .prepare(
      "UPDATE course_activation SET active_package_hash=?,fallback_package_hash=?,revision=revision+1",
    )
    .run(next.target, f.target);
  assert.equal(
    c.db.prepare("SELECT package_hash FROM task_run").get()?.package_hash,
    f.target,
  );
  const catalog = await c.app.installations(),
    target = {
      installationId: catalog.installationId,
      packageHash: parseHash({ kind: "package", value: f.target }),
    };
  f.cache.clear();
  const before = publicationPersonalCensus(c.db),
    a = f.acquisitionTargets.length,
    d = f.downloadTargets.length;
  assert.deepEqual(await c.app.repairPublication(target), {
    kind: "verified",
    target,
  });
  assert.equal(publicationPersonalCensus(c.db), before);
  assert.deepEqual(f.acquisitionTargets.slice(a), [f.target]);
  assert.deepEqual(f.downloadTargets.slice(d), [
    { hash: f.target, path: "curriculum.json" },
    { hash: f.target, path: "preparation.json" },
  ]);
  assert.notEqual(target.packageHash, next.target);
  assert.notEqual(target.packageHash, f.content.packageHash);
  assert.notEqual(
    target.packageHash,
    createHash("sha256").update(f.curriculum).digest("hex"),
  );
});

test("publication recovery: inactive metadata grants no authority; an exact retained fallback anchors explicit repair", async (t) => {
  const f = await fixture(t),
    c = f.connect();
  await c.app.initialInstall(await f.command(c.app));
  await f.until(c.app, "activated");
  const next = await seedControlledFutureRelease(c.db, f);
  const catalog = await c.app.installations(),
    target = {
      installationId: catalog.installationId,
      packageHash: parseHash({ kind: "package", value: next.target }),
    },
    before = publicationPersonalCensus(c.db),
    a = f.acquisitions,
    d = f.downloads;
  assert.deepEqual(await c.app.repairPublication(target), {
    kind: "notAuthorized",
    target,
  });
  assert.equal(f.acquisitions, a);
  assert.equal(f.downloads, d);
  assert.equal(publicationPersonalCensus(c.db), before);
  c.db
    .prepare(
      "UPDATE course_activation SET fallback_package_hash=?,revision=revision+1",
    )
    .run(next.target);
  const retained = publicationPersonalCensus(c.db);
  assert.deepEqual(await c.app.repairPublication(target), {
    kind: "verified",
    target,
  });
  assert(f.acquisitions > a);
  assert(f.downloads > d);
  assert.equal(publicationPersonalCensus(c.db), retained);
});

test(
  "publication recovery: activation change while acquisition is held returns stale and leaves SQL alone",
  { timeout: 15000 },
  async (t) => {
    const f = await fixture(t),
      c = f.connect();
    await c.app.initialInstall(await f.command(c.app));
    await f.until(c.app, "activated");
    const next = await seedControlledFutureRelease(c.db, f);
    const catalog = await c.app.installations(),
      target = {
        installationId: catalog.installationId,
        packageHash: parseHash({ kind: "package", value: f.target }),
      };
    f.cache.clear();
    let release = () => {};
    f.setGate(
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    );
    const a = f.acquisitions;
    const pending = c.app.repairPublication(target);
    for (let i = 0; i < 300 && f.acquisitions === a; i++) await setImmediate();
    assert.equal(f.acquisitions, a + 1);
    // This queued read must complete while acquisition is blocked: no SQL queue is held.
    assert.equal(
      (await c.app.installations()).installationId,
      target.installationId,
    );
    c.db
      .prepare(
        "UPDATE course_activation SET active_package_hash=?,fallback_package_hash=?,revision=revision+1",
      )
      .run(next.target, f.target);
    const changed = publicationPersonalCensus(c.db);
    release();
    assert.deepEqual(await pending, { kind: "staleTarget", target });
    assert.equal(publicationPersonalCensus(c.db), changed);
  },
);

test(
  "publication recovery: the exact historical anchor revision is rechecked outside the current cursor scope",
  { timeout: 15000 },
  async (t) => {
    const f = await fixture(t),
      c = f.connect();
    await c.app.initialInstall(await f.command(c.app));
    await f.until(c.app, "activated");
    await startRealPinnedTask(f, c.app);
    const next = await seedControlledFutureRelease(c.db, f);
    c.db
      .prepare(
        "UPDATE course_activation SET active_package_hash=?,fallback_package_hash=NULL,revision=revision+1",
      )
      .run(next.target);
    c.db.exec(
      "UPDATE course_cursor SET resume_session_id=NULL,revision=revision+1",
    );
    const catalog = await c.app.installations(),
      target = {
        installationId: catalog.installationId,
        packageHash: parseHash({ kind: "package", value: f.target }),
      };
    f.cache.clear();
    let release = () => {};
    f.setGate(
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    );
    const a = f.acquisitions;
    const pending = c.app.repairPublication(target);
    for (let i = 0; i < 300 && f.acquisitions === a; i++) await setImmediate();
    assert.equal(f.acquisitions, a + 1);
    c.db.exec("UPDATE session SET revision=revision+1");
    const changed = publicationPersonalCensus(c.db);
    release();
    assert.deepEqual(await pending, { kind: "staleTarget", target });
    assert.equal(publicationPersonalCensus(c.db), changed);
  },
);

test("complete six-lesson signed installation retains all capabilities and cold writing identity", async (t) => {
  const f = await fixture(t, "completeLessons");
  const c = f.connect();
  await c.app.initialInstall(await f.command(c.app));
  const activated = await f.until(c.app, "activated");
  assert.equal(activated.fact.kind, "activated");
  const lessons = resolvedLessons(f.content);
  assert.deepEqual(
    lessons.map((lesson) => lesson.tasks.length),
    [6, 7, 8, 7, 9, 8],
  );
  const capabilities: readonly string[] = packageMetadata(
    f.content,
  ).capabilities;
  assert.ok(capabilities.includes("rhyming-connected-writing-l05-v1"));
  assert.ok(capabilities.includes("complete-lessons-01-06-v1"));
  const installed = c.db
    .prepare(
      "SELECT content_schema_version,capabilities FROM installed_package",
    )
    .get();
  assert.equal(installed?.content_schema_version, 4);
  assert.deepEqual(JSON.parse(String(installed?.capabilities)), capabilities);
  await confirmInitialProfile(c.app, f.ids, hash);
  const projection = await selectedProjection(c.app);
  if (projection.kind === "recovery") throw Error(projection.message);
  assert.equal(projection.catalog.length, 45);
  const taskId = lessons[5]?.tasks[7]?.task.id;
  assert.ok(taskId);
  const action = projection.actions.find(
    (action) =>
      action.intent.kind === "start" && action.intent.taskId === taskId,
  );
  assert.ok(action);
  const operation = await prepareSelectedTeaching(c.app, () =>
    prepareCommand({
      projection,
      request: { kind: "action", action },
      ids: f.ids,
      hash,
    }),
  );
  const started = await executeTeaching(c.app, operation);
  assert.equal(started.kind, "committed");
  const writing = await selectedProjection(c.app);
  if (writing.kind !== "writing") throw Error("Lesson six writing required");
  assert.equal(writing.packageHash, f.target);
  assert.equal(writing.taskId, taskId);
  const token = writing.documents[0];
  assert.ok(token);
  assert.equal(token.phase, "parentDemonstration");
  const snapshot = await selectedInk(c.app, { token });
  assert.equal(snapshot.writable, true);
  const documents = c.db
    .prepare(
      "SELECT target_id,package_hash,phase FROM ink_document ORDER BY target_id",
    )
    .all();
  assert.equal(documents.length, 2);
  assert.ok(documents.every((document) => document.package_hash === f.target));
  const downloads = f.downloads;
  const acquisitions = f.acquisitions;
  c.db.close();
  f.setOffline(true);
  const cold = f.connect();
  const opening = await cold.app.openRecovery({ kind: "cold" });
  await cold.app.reconcileRecovery({
    recoveryId: opening.recoveryId,
    choice: { kind: "cold" },
  });
  const reopened = await selectedProjection(cold.app);
  assert.deepEqual(reopened, {
    ...writing,
    documents: writing.documents.map((document) => ({
      ...document,
      revision: increment(document.revision),
      inputEpoch: increment(document.inputEpoch),
    })),
  });
  if (reopened.kind !== "writing")
    throw Error("Cold Lesson six writing required");
  const reopenedToken = reopened.documents[0];
  assert.ok(reopenedToken);
  const restored = await selectedInk(cold.app, { token: reopenedToken });
  assert.deepEqual(restored.strokes, snapshot.strokes);
  assert.deepEqual(restored.histories, snapshot.histories);
  assert.equal(restored.writable, snapshot.writable);
  assert.deepEqual(await executeTeaching(cold.app, operation), started);
  assert.deepEqual(
    cold.db
      .prepare(
        "SELECT target_id,package_hash,phase FROM ink_document ORDER BY target_id",
      )
      .all(),
    documents,
  );
  assert.equal(f.downloads, downloads);
  assert.equal(f.acquisitions, acquisitions);
});
