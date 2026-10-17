import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  parseId,
  parseRuntimePackage,
  prepareProfileAdministration,
} from "@readatthree/teaching";
import { profileFixture } from "./profile-support.ts";
import { hash } from "./support.ts";

async function beginEmptyCapture(
  fixture: Awaited<ReturnType<typeof profileFixture>>,
  app: ReturnType<typeof fixture.connect>["app"],
) {
  const { token } = await fixture.current(app);
  const strokeId = parseId({ kind: "stroke", value: fixture.ids() });
  const next = await fixture.edit(app, token, {
    kind: "begin",
    strokeId,
    layer: "tracing",
    brush: {
      kind: "round",
      width: 5,
      colorRole: "child",
      cap: "round",
      join: "round",
    },
    chunks: [],
  });
  return { token: next, strokeId };
}

test("profile departure reads and checks every active course before atomically pausing outgoing teaching", async (t) => {
  const fixture = await profileFixture(t);
  const first = fixture.connect();
  const ownerA = await fixture.setup(first.app);
  await fixture.start(first.app);
  const original = await first.app.readApplication({ kind: "cursor" });
  if (original.kind !== "ready" || original.projection.kind !== "writing")
    assert.fail("First-course writing required");
  const firstWork = await first.app.readWork({
    owner: ownerA,
    runId: original.projection.runId,
  });
  first.db.close();
  const body = {
    ...fixture.content.body,
    courseId: "fixture.writing.second-course",
    releaseId: "fixture.writing.second-release",
  };
  const otherContent = await parseRuntimePackage(
    { formatVersion: 1, body, packageHash: await hash(canonical(body)) },
    hash,
  );
  const second = fixture.connect({ content: otherContent });
  const recovery = await second.app.openRecovery({ kind: "cold" });
  await second.app.reconcileRecovery({
    recoveryId: recovery.recoveryId,
    choice: { kind: "cold" },
  });
  await fixture.start(second.app);
  const before = await second.app.readApplication({ kind: "cursor" });
  if (before.kind !== "ready" || before.projection.kind !== "writing")
    assert.fail("Second-course writing required");
  const directory = await second.app.readDirectory();
  const departure = await second.app.readDeparture({
    selection: directory.selection,
  });
  assert.deepEqual(
    departure.courses.map((course) => ({
      courseId: course.courseId,
      owner: course.witness.owner,
      documents: course.documents.length,
    })),
    [
      { courseId: "fixture.writing.course", owner: ownerA, documents: 2 },
      {
        courseId: "fixture.writing.second-course",
        owner: ownerA,
        documents: 2,
      },
    ],
  );
  assert.deepEqual(
    await second.app.readApplication({ kind: "cursor" }),
    before,
  );
  assert.equal(
    second.db
      .prepare("SELECT count(*) AS count FROM session WHERE status='active'")
      .get()?.count,
    2,
  );
  const incomplete = await prepareProfileAdministration({
    intent: {
      kind: "createAndSelect",
      directory: directory.administration,
      preferences: { avatarId: "owl" },
    },
    selection: directory.selection,
    departure: {
      courses: departure.courses.filter(
        (course) => course.courseId !== "fixture.writing.course",
      ),
    },
    ids: fixture.ids,
    hash,
  });
  const rejected = await second.app.administer(incomplete);
  assert.equal(rejected.kind, "rejected");
  if (rejected.kind === "rejected")
    assert.equal(rejected.code, "stale-departure");
  assert.deepEqual(await second.app.readDirectory(), directory);
  assert.deepEqual(
    await second.app.readApplication({ kind: "cursor" }),
    before,
  );
  const created = await fixture.change(second.app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  assert.equal(created.result.selection.revision, "1");
  assert.equal(
    second.db
      .prepare("SELECT count(*) AS count FROM session WHERE status='paused'")
      .get()?.count,
    2,
  );
  assert.equal(
    second.db.prepare("SELECT count(*) AS count FROM task_run").get()?.count,
    2,
  );
  await assert.rejects(
    second.app.readDeparture({ selection: directory.selection }),
    /lifetime changed/,
  );
  await fixture.change(second.app, (directory) => ({
    kind: "selectProfile",
    directory: directory.administration,
    target: ownerA,
  }));
  await assert.rejects(
    second.app.readDeparture({ selection: directory.selection }),
    /lifetime changed/,
  );
  const restored = await second.app.readApplication({ kind: "cursor" });
  if (restored.kind !== "ready" || restored.projection.kind !== "writing")
    assert.fail("A's second course must return");
  assert.equal(restored.projection.runId, before.projection.runId);
  assert.equal(restored.projection.sessionStatus, "paused");
  assert.equal(
    restored.projection.actions.some(
      (action) => action.intent.kind === "undoAdvance",
    ),
    true,
  );
  second.db.close();
  const returned = fixture.connect();
  const reopening = await returned.app.openRecovery({ kind: "cold" });
  await returned.app.reconcileRecovery({
    recoveryId: reopening.recoveryId,
    choice: { kind: "cold" },
  });
  const olderCourse = await returned.app.readApplication({ kind: "cursor" });
  if (olderCourse.kind !== "ready" || olderCourse.projection.kind !== "writing")
    assert.fail("A's first course must remain saved");
  assert.equal(olderCourse.projection.runId, original.projection.runId);
  assert.equal(olderCourse.projection.sessionStatus, "paused");
  assert.equal(olderCourse.projection.turn.id, original.projection.turn.id);
  assert.deepEqual(
    await returned.app.readWork({
      owner: ownerA,
      runId: original.projection.runId,
    }),
    firstWork,
  );
});

test("profile selection rejects unflushed owned capture without pausing or creating another child", async (t) => {
  const fixture = await profileFixture(t);
  const { app, db } = fixture.connect();
  await fixture.setup(app);
  await fixture.start(app);
  const capture = await beginEmptyCapture(fixture, app);
  const before = await app.readApplication({ kind: "cursor" });
  const directory = await app.readDirectory();
  const command = await fixture.request(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  const rejected = await app.administer(command);
  assert.equal(rejected.kind, "rejected");
  if (rejected.kind === "rejected")
    assert.equal(rejected.code, "unsettled-capture");
  assert.deepEqual(await app.readApplication({ kind: "cursor" }), before);
  assert.deepEqual(await app.readDirectory(), directory);
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS count FROM ink_stroke WHERE status='capturing'",
      )
      .get()?.count,
    1,
  );
  await fixture.edit(app, capture.token, {
    kind: "finalize",
    strokeId: capture.strokeId,
    layer: "tracing",
    chunks: [],
    status: "interrupted",
  });
  const stale = await app.administer(command);
  assert.equal(stale.kind, "rejected");
  if (stale.kind === "rejected") assert.equal(stale.code, "stale-departure");
  await fixture.change(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  assert.equal((await app.readDirectory()).profiles.length, 2);
});

test("a constructed stranded capture in an abandoned run is rejected even when current-run departure tokens omit it", async (t) => {
  const fixture = await profileFixture(t);
  const { app, db } = fixture.connect();
  await fixture.setup(app);
  await fixture.start(app);
  const capture = await beginEmptyCapture(fixture, app);
  db.prepare(
    "CREATE TEMP TABLE stranded_capture_fixture AS SELECT * FROM ink_stroke WHERE stroke_id=?",
  ).run(capture.strokeId);
  await fixture.edit(app, capture.token, {
    kind: "finalize",
    strokeId: capture.strokeId,
    layer: "tracing",
    chunks: [],
    status: "interrupted",
  });
  assert.equal((await fixture.action(app, "restart")).kind, "committed");
  db.exec("INSERT INTO ink_stroke SELECT * FROM temp.stranded_capture_fixture");
  const directory = await app.readDirectory();
  const departure = await app.readDeparture({ selection: directory.selection });
  assert.equal(
    departure.courses
      .flatMap((course) => course.documents)
      .some((document) => document.documentId === capture.token.documentId),
    false,
  );
  const command = await fixture.request(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  const result = await app.administer(command);
  assert.equal(result.kind, "rejected");
  if (result.kind === "rejected")
    assert.equal(result.code, "unsettled-capture");
  assert.deepEqual(await app.readDirectory(), directory);
  assert.equal(
    db
      .prepare(
        "SELECT count(*) AS count FROM ink_stroke WHERE status='capturing'",
      )
      .get()?.count,
    1,
  );
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM profile").get()?.count,
    1,
  );
});
