import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  parseHash,
  parseId,
  prepareProfileAdministration,
} from "@readatthree/teaching";
import type {
  ProfileAdministrationCommand,
  ProfileDirectory,
} from "@readatthree/teaching";
import { profileFixture } from "./profile-support.ts";
import { practiceFixture } from "./practice-support.ts";
import { hash } from "./support.ts";

function child(directory: ProfileDirectory, id: string) {
  const found = directory.profiles.find(
    (profile) => profile.edit.owner.profileId === id,
  );
  if (!found) assert.fail("The child must remain in the committed directory");
  return found;
}

test("initial setup requires the supplied acknowledgement and configures the anonymous child without allocating work", async (t) => {
  const fixture = await profileFixture(t);
  const { app, db } = fixture.connect();
  const before = await app.readDirectory();
  const blocked = await fixture.request(app, (directory) => ({
    kind: "finishInitialProfile",
    directory: directory.administration,
    target: directory.profiles[0].edit,
    preferences: { avatarId: "owl" },
  }));
  assert.equal((await app.administer(blocked)).kind, "rejected");
  assert.deepEqual(await app.readDirectory(), before);
  const wrong = await fixture.request(app, (directory) => ({
    kind: "acknowledgePreparation",
    directory: directory.administration,
    hash: parseHash({ kind: "preparation", value: "5".repeat(64) }),
  }));
  assert.equal((await app.administer(wrong)).kind, "rejected");
  const owner = await fixture.setup(app);
  const ready = await app.readDirectory();
  assert.deepEqual(ready.selection.owner, owner);
  assert.equal(ready.profiles.length, 1);
  assert.equal(ready.profiles[0].preferences.avatarId, "rabbit");
  assert.equal(ready.profiles[0].preferences.displayName, "Same");
  assert.deepEqual(ready.preparation, {
    kind: "acknowledged",
    hash: fixture.preparation.hash,
  });
  assert.equal(ready.initialSetup.kind, "complete");
  assert.equal(ready.administration.revision, "2");
  assert.equal(ready.selection.revision, "0");
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM task_run").get()?.count,
    0,
  );
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM course_cursor").get()?.count,
    0,
  );
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM ink_document").get()?.count,
    0,
  );
});

test("unavailable preparation and another installation cannot authorize administration", async (t) => {
  const fixture = await practiceFixture(t);
  const { app } = fixture.connect();
  const before = await app.readDirectory();
  const preparationHash = parseHash({
    kind: "preparation",
    value: "4".repeat(64),
  });
  const command = await prepareProfileAdministration({
    intent: {
      kind: "acknowledgePreparation",
      directory: before.administration,
      hash: preparationHash,
    },
    selection: before.selection,
    ids: fixture.ids,
    hash,
  });
  const unavailable = await app.administer(command);
  assert.equal(unavailable.kind, "rejected");
  if (unavailable.kind === "rejected")
    assert.equal(unavailable.code, "preparation-unavailable");
  const otherInstallation = parseId({
    kind: "installation",
    value: fixture.ids(),
  });
  const foreign = await prepareProfileAdministration({
    intent: {
      kind: "acknowledgePreparation",
      directory: {
        ...before.administration,
        installationId: otherInstallation,
      },
      hash: preparationHash,
    },
    selection: { ...before.selection, installationId: otherInstallation },
    ids: fixture.ids,
    hash,
  });
  const rejected = await app.administer(foreign);
  assert.equal(rejected.kind, "rejected");
  if (rejected.kind === "rejected")
    assert.equal(rejected.code, "stale-installation");
  assert.deepEqual(await app.readDirectory(), before);
  assert.equal(before.preparation.kind, "unavailable");
});

test("cosmetic commands preserve duplicate-name ownership and unrelated preferences and accept a no-op exactly once", async (t) => {
  const fixture = await profileFixture(t);
  const { app, db } = fixture.connect();
  const ownerA = await fixture.setup(app);
  const created = await fixture.change(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl", displayName: "Same" },
  }));
  if (created.result.effect.kind !== "created")
    assert.fail("Creation must expose B's stable identity");
  const ownerB = created.result.effect.target.owner;
  await fixture.change(app, (directory) => ({
    kind: "selectProfile",
    directory: directory.administration,
    target: ownerA,
  }));
  db.prepare("UPDATE profile SET preferences=? WHERE profile_id=?").run(
    '{ "version":1,"displayName":"Same","avatarId":"future-animal","writing":{"hand":"left"},"accessibility":{"largeText":true} }',
    ownerB.profileId,
  );
  const before = await app.readDirectory();
  const renamed = await fixture.change(app, (directory) => ({
    kind: "setDisplayName",
    directory: directory.administration,
    target: child(directory, ownerB.profileId).edit,
    displayName: "Same",
  }));
  const after = await app.readDirectory();
  assert.deepEqual(after.selection, before.selection);
  assert.deepEqual(
    child(after, ownerA.profileId),
    child(before, ownerA.profileId),
  );
  assert.deepEqual(child(after, ownerB.profileId).preferences, {
    version: 1,
    displayName: "Same",
    avatarId: "future-animal",
    writing: { hand: "left" },
    accessibility: { largeText: true },
  });
  assert.equal(child(after, ownerB.profileId).edit.revision, "1");
  assert.equal(
    (await app.administer(renamed.command)).kind,
    "profileCommitted",
  );
  assert.deepEqual(await app.readDirectory(), after);
  await fixture.change(app, (directory) => ({
    kind: "setDisplayName",
    directory: directory.administration,
    target: child(directory, ownerB.profileId).edit,
    displayName: null,
  }));
  assert.deepEqual(
    child(await app.readDirectory(), ownerB.profileId).preferences,
    {
      version: 1,
      avatarId: "future-animal",
      writing: { hand: "left" },
      accessibility: { largeText: true },
    },
  );
});

test("retained administration retries resolve exactly while changed identity and stale revision witnesses cannot mutate profiles", async (t) => {
  const fixture = await profileFixture(t);
  const { app } = fixture.connect();
  const ownerA = await fixture.setup(app);
  const created = await fixture.change(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  if (created.result.effect.kind !== "created")
    assert.fail("B must be created");
  const ownerB = created.result.effect.target.owner;
  const late = await fixture.request(app, (directory) => ({
    kind: "setAvatar",
    directory: directory.administration,
    target: child(directory, ownerB.profileId).edit,
    avatarId: "cat",
  }));
  const selectedA = await fixture.change(app, (directory) => ({
    kind: "selectProfile",
    directory: directory.administration,
    target: ownerA,
  }));
  const before = await app.readDirectory();
  const rejectedLate = await app.administer(late);
  assert.equal(rejectedLate.kind, "rejected");
  if (rejectedLate.kind === "rejected")
    assert.equal(rejectedLate.code, "stale-selection");
  assert.deepEqual(await app.administer(created.command), created.result);
  assert.deepEqual(await app.readDirectory(), before);
  assert.deepEqual((await app.readDirectory()).selection.owner, ownerA);
  assert.deepEqual(await app.administer(selectedA.command), selectedA.result);
  if (created.command.payload.kind !== "createAndSelect")
    assert.fail("Creation must retain its explicit command kind");
  const changed = {
    ...created.command,
    payload: { ...created.command.payload, preferences: { avatarId: "fox" } },
  } satisfies ProfileAdministrationCommand;
  const changedHash = await hash(
    canonical({
      version: changed.version,
      scope: changed.scope,
      selection: changed.selection,
      payload: changed.payload,
    }),
  );
  const changedResult = await app.administer({
    ...changed,
    payloadHash: parseHash({ kind: "payload", value: changedHash }),
  });
  assert.equal(changedResult.kind, "rejected");
  if (changedResult.kind === "rejected")
    assert.equal(changedResult.code, "command-identity");
  assert.deepEqual(await app.readDirectory(), before);
  const oldTarget = child(before, ownerB.profileId).edit;
  const staleAdmin = await fixture.request(app, (directory) => ({
    kind: "setAvatar",
    directory: directory.administration,
    target: oldTarget,
    avatarId: "bear",
  }));
  await fixture.change(app, (directory) => ({
    kind: "setAvatar",
    directory: directory.administration,
    target: oldTarget,
    avatarId: "cat",
  }));
  const staleAdminResult = await app.administer(staleAdmin);
  assert.equal(staleAdminResult.kind, "rejected");
  if (staleAdminResult.kind === "rejected")
    assert.equal(staleAdminResult.code, "stale-administration");
  const staleTarget = await fixture.request(app, (directory) => ({
    kind: "setAvatar",
    directory: directory.administration,
    target: oldTarget,
    avatarId: "fox",
  }));
  const staleTargetResult = await app.administer(staleTarget);
  assert.equal(staleTargetResult.kind, "rejected");
  if (staleTargetResult.kind === "rejected")
    assert.equal(staleTargetResult.code, "stale-profile");
  assert.equal(
    child(await app.readDirectory(), ownerB.profileId).preferences.avatarId,
    "cat",
  );
});

test("a constructed target-generation invalidation rejects both a queued edit and its retained old receipt", async (t) => {
  const fixture = await profileFixture(t);
  const { app, db } = fixture.connect();
  const ownerA = await fixture.setup(app);
  const created = await fixture.change(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  if (created.result.effect.kind !== "created")
    assert.fail("B must be created");
  const ownerB = created.result.effect.target.owner;
  await fixture.change(app, (directory) => ({
    kind: "selectProfile",
    directory: directory.administration,
    target: ownerA,
  }));
  const committed = await fixture.change(app, (directory) => ({
    kind: "setAvatar",
    directory: directory.administration,
    target: child(directory, ownerB.profileId).edit,
    avatarId: "cat",
  }));
  const queued = await fixture.request(app, (directory) => ({
    kind: "setAvatar",
    directory: directory.administration,
    target: child(directory, ownerB.profileId).edit,
    avatarId: "fox",
  }));
  db.prepare("UPDATE profile SET generation=1 WHERE profile_id=?").run(
    ownerB.profileId,
  );
  const before = await app.readDirectory();
  for (const command of [queued, committed.command, created.command]) {
    const result = await app.administer(command);
    assert.equal(result.kind, "rejected");
    if (result.kind === "rejected") assert.equal(result.code, "stale-owner");
  }
  assert.deepEqual(await app.readDirectory(), before);
  assert.deepEqual(before.selection.owner, ownerA);
  assert.equal(child(before, ownerB.profileId).edit.owner.generation, "1");
  assert.equal(child(before, ownerB.profileId).preferences.avatarId, "cat");
});

test("a retained receipt with a valid shape but a different command effect cannot authorize a retry", async (t) => {
  const fixture = await profileFixture(t);
  const { app, db } = fixture.connect();
  const ownerA = await fixture.setup(app);
  const committed = await fixture.change(app, (directory) => ({
    kind: "setAvatar",
    directory: directory.administration,
    target: child(directory, ownerA.profileId).edit,
    avatarId: "cat",
  }));
  const before = await app.readDirectory();
  db.prepare(
    "UPDATE profile_administration_receipt SET result=? WHERE command_id=?",
  ).run(
    canonical({
      ...committed.result,
      effect: { kind: "preparation", hash: fixture.preparation.hash },
    }),
    committed.command.commandId,
  );
  await assert.rejects(app.administer(committed.command), /receipt.*corrupt/);
  assert.deepEqual(await app.readDirectory(), before);
});

for (const failure of ["before", "after"] satisfies readonly (
  "before" | "after"
)[]) {
  test(`a ${failure}-COMMIT failure preserves an exact administration retry through the real SQLite transaction`, async (t) => {
    const fixture = await profileFixture(t);
    let armed = false;
    const first = fixture.connect({
      hook: async (sql, work) => {
        if (sql === "COMMIT" && armed && failure === "before")
          throw new Error("Injected administration COMMIT failure");
        const result = await work();
        if (sql === "COMMIT" && armed && failure === "after")
          throw new Error("Injected administration lost acknowledgement");
        return result;
      },
    });
    const ownerA = await fixture.setup(first.app);
    await fixture.start(first.app);
    await fixture.draw(first.app, 80);
    const before = await first.app.readApplication({ kind: "cursor" });
    if (before.kind !== "ready" || before.projection.kind !== "writing")
      assert.fail("A's writing must be active");
    const work = await first.app.readWork({
      owner: ownerA,
      runId: before.projection.runId,
    });
    const command = await fixture.request(first.app, (directory) => ({
      kind: "createAndSelect",
      directory: directory.administration,
      preferences: { avatarId: "owl" },
    }));
    if (command.payload.kind !== "createAndSelect")
      assert.fail("Creation command required");
    armed = true;
    await assert.rejects(
      first.app.administer(command),
      /Injected administration/,
    );
    armed = false;
    const directory = await first.app.readDirectory();
    if (failure === "before") {
      assert.equal(directory.profiles.length, 1);
      assert.equal(directory.administration.revision, "2");
      assert.deepEqual(directory.selection.owner, ownerA);
      assert.deepEqual(
        await first.app.readApplication({ kind: "cursor" }),
        before,
      );
      assert.deepEqual(
        await first.app.readWork({
          owner: ownerA,
          runId: before.projection.runId,
        }),
        work,
      );
    } else {
      assert.equal(directory.profiles.length, 2);
      assert.equal(directory.administration.revision, "3");
      assert.equal(directory.selection.revision, "1");
      assert.deepEqual(directory.selection.owner, command.payload.owner);
    }
    const receipt = await first.app.administer(command);
    assert.equal(receipt.kind, "profileCommitted");
    const accepted = await first.app.readDirectory();
    assert.equal(accepted.profiles.length, 2);
    assert.equal(accepted.administration.revision, "3");
    assert.equal(accepted.selection.revision, "1");
    assert.deepEqual(accepted.selection.owner, command.payload.owner);
    first.db.close();
    const reopened = fixture.connect();
    const recovery = await reopened.app.openRecovery({ kind: "cold" });
    await reopened.app.reconcileRecovery({
      recoveryId: recovery.recoveryId,
      choice: { kind: "cold" },
    });
    assert.deepEqual(await reopened.app.administer(command), receipt);
    assert.deepEqual(await reopened.app.readDirectory(), accepted);
    await fixture.change(reopened.app, (directory) => ({
      kind: "selectProfile",
      directory: directory.administration,
      target: ownerA,
    }));
    const restored = await reopened.app.readApplication({ kind: "cursor" });
    if (restored.kind !== "ready" || restored.projection.kind !== "writing")
      assert.fail("A's saved writing must return");
    assert.equal(restored.projection.runId, before.projection.runId);
    assert.equal(restored.projection.sessionId, before.projection.sessionId);
    assert.equal(restored.projection.turn.id, before.projection.turn.id);
    assert.equal(restored.projection.sessionStatus, "paused");
    assert.deepEqual(
      await reopened.app.readWork({
        owner: ownerA,
        runId: before.projection.runId,
      }),
      work,
    );
  });
}

test("the 256-child limit and newest-256 administration receipts cannot turn pruned create, select or edit retries into fresh commands", async (t) => {
  const fixture = await profileFixture(t);
  const { app, db } = fixture.connect();
  const ownerA = await fixture.setup(app);
  const created = await fixture.change(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  if (created.result.effect.kind !== "created")
    assert.fail("B must be created");
  const ownerB = created.result.effect.target.owner;
  const selected = await fixture.change(app, (directory) => ({
    kind: "selectProfile",
    directory: directory.administration,
    target: ownerA,
  }));
  const edited = await fixture.change(app, (directory) => ({
    kind: "setAvatar",
    directory: directory.administration,
    target: child(directory, ownerB.profileId).edit,
    avatarId: "cat",
  }));
  for (let index = 0; index < 254; index++)
    await fixture.change(app, (directory) => ({
      kind: "createAndSelect",
      directory: directory.administration,
      preferences: { avatarId: "rabbit" },
    }));
  for (let index = 0; index < 3; index++)
    await fixture.change(app, (directory) => ({
      kind: "setAvatar",
      directory: directory.administration,
      target: child(directory, directory.selection.owner.profileId).edit,
      avatarId: "rabbit",
    }));
  const before = await app.readDirectory();
  assert.equal(before.profiles.length, 256);
  assert.equal(before.administration.revision, "262");
  assert.equal(before.selection.revision, "256");
  assert.equal(
    db
      .prepare("SELECT count(*) AS count FROM profile_administration_receipt")
      .get()?.count,
    256,
  );
  for (const command of [created.command, selected.command, edited.command]) {
    assert.equal(
      db
        .prepare(
          "SELECT count(*) AS count FROM profile_administration_receipt WHERE command_id=?",
        )
        .get(command.commandId)?.count,
      0,
    );
    const result = await app.administer(command);
    assert.equal(result.kind, "rejected");
  }
  const overflow = await fixture.request(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "fox" },
  }));
  const rejected = await app.administer(overflow);
  assert.equal(rejected.kind, "rejected");
  if (rejected.kind === "rejected")
    assert.equal(rejected.code, "profile-limit");
  assert.deepEqual(await app.readDirectory(), before);
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM task_run").get()?.count,
    0,
  );
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM course_cursor").get()?.count,
    0,
  );
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM ink_document").get()?.count,
    0,
  );
});
