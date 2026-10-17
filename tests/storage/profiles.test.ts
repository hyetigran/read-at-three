import {
  selectedCourse,
  selectedProjection,
  selectedWork,
} from "./selected-support.ts";

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodeInkPoints,
  parseHash,
  prepareProfileAdministration,
} from "@readatthree/teaching";
import type {
  ProfileAdministrationIntent,
  ProfileDirectory,
  PreparationPolicy,
} from "@readatthree/teaching";
import { practiceFixture } from "./practice-support.ts";
import { hash } from "./support.ts";

test("confirming another child's animal survives SQLite reopen without changing the selected child's teaching, Undo or ink", async (t) => {
  const fixture = await practiceFixture(t);
  const preparation = {
    kind: "reviewed",
    hash: parseHash({ kind: "preparation", value: "2".repeat(64) }),
  } satisfies PreparationPolicy;
  const first = fixture.connect({ preparation });
  const app = first.app;
  assert.equal((await selectedProjection(app)).kind, "entry");

  async function administer(intent: ProfileAdministrationIntent) {
    const directory = await app.readDirectory();
    const preparation = {
      selection: directory.selection,
      ids: fixture.ids,
      hash,
    };
    const command =
      intent.kind === "createAndSelect" || intent.kind === "selectProfile"
        ? await prepareProfileAdministration({
            ...preparation,
            intent,
            departure: await app.readDeparture({
              selection: directory.selection,
            }),
          })
        : await prepareProfileAdministration({ ...preparation, intent });
    const result = await app.administer(command);
    if (result.kind !== "profileCommitted") assert.fail(result.message);
    return result;
  }

  function child(directory: ProfileDirectory, profileId: string) {
    const profile = directory.profiles.find(
      (entry) => entry.edit.owner.profileId === profileId,
    );
    if (!profile) assert.fail("The committed child must remain available");
    return profile;
  }

  let directory = await app.readDirectory();
  assert.equal(directory.initialSetup.kind, "firstLaunch");
  assert.equal(directory.profiles.length, 1);
  const ownerA = directory.selection.owner;
  if (directory.preparation.kind !== "required")
    assert.fail("Fresh setup requires reviewed preparation");
  await administer({
    kind: "acknowledgePreparation",
    directory: directory.administration,
    hash: directory.preparation.requiredHash,
  });
  directory = await app.readDirectory();
  await administer({
    kind: "finishInitialProfile",
    directory: directory.administration,
    target: child(directory, ownerA.profileId).edit,
    preferences: { avatarId: "rabbit" },
  });
  directory = await app.readDirectory();
  const created = await administer({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  });
  if (created.effect.kind !== "created")
    assert.fail("Confirmed creation must return the new child's identity");
  const ownerB = created.effect.target.owner;
  assert.notEqual(ownerB.profileId, ownerA.profileId);
  directory = await app.readDirectory();
  assert.deepEqual(directory.selection.owner, ownerB);
  assert.equal(directory.profiles.length, 2);
  await administer({
    kind: "selectProfile",
    directory: directory.administration,
    target: ownerA,
  });

  const modelStrokeId = await fixture.start(app);
  const childStrokeId = await fixture.draw(app, 75);
  assert.equal((await fixture.action(app, "pause")).kind, "committed");
  const before = await selectedCourse(app, { kind: "cursor" });
  if (before.kind !== "ready" || before.projection.kind !== "writing")
    assert.fail("A's unfinished writing must be selected");
  assert.equal(before.projection.turn.id, "fixture.writing.turn.3");
  assert.equal(before.projection.sessionStatus, "paused");
  assert.equal(
    before.projection.actions.some(
      (action) => action.intent.kind === "undoAdvance",
    ),
    true,
  );
  const work = await selectedWork(app, {
    owner: ownerA,
    runId: before.projection.runId,
  });
  assert.deepEqual(
    work.documents.flatMap((document) =>
      document.snapshot.strokes.map((stroke) => ({
        id: stroke.strokeId,
        layer: stroke.layer,
        points: stroke.chunks.flatMap((chunk) =>
          decodeInkPoints({
            bounds: document.snapshot.bounds,
            payload: Uint8Array.from(chunk.payload),
            pointCount: chunk.pointCount,
          }),
        ),
      })),
    ),
    [
      {
        id: modelStrokeId,
        layer: "model",
        points: [{ x: 25, y: 100, elapsedMs: 0, pressure: 1 }],
      },
      {
        id: childStrokeId,
        layer: "tracing",
        points: [{ x: 75, y: 100, elapsedMs: 0, pressure: 1 }],
      },
    ],
  );
  directory = await app.readDirectory();
  const selectedA = directory.selection;
  const profileA = child(directory, ownerA.profileId);
  await administer({
    kind: "setAvatar",
    directory: directory.administration,
    target: child(directory, ownerB.profileId).edit,
    avatarId: "cat",
  });
  directory = await app.readDirectory();
  assert.deepEqual(directory.selection, selectedA);
  assert.deepEqual(child(directory, ownerA.profileId), profileA);
  assert.equal(child(directory, ownerB.profileId).preferences.avatarId, "cat");
  assert.deepEqual(await selectedCourse(app, { kind: "cursor" }), before);
  assert.deepEqual(
    await selectedWork(app, { owner: ownerA, runId: before.projection.runId }),
    work,
  );

  first.db.close();
  assert.equal(first.db.isOpen, false);
  const reopened = fixture.connect({ preparation });
  const restoredDirectory = await reopened.app.readDirectory();
  assert.deepEqual(restoredDirectory.selection, selectedA);
  assert.deepEqual(child(restoredDirectory, ownerA.profileId), profileA);
  assert.equal(
    child(restoredDirectory, ownerB.profileId).preferences.avatarId,
    "cat",
  );
  const recovery = await reopened.app.openRecovery({ kind: "cold" });
  await reopened.app.reconcileRecovery({
    recoveryId: recovery.recoveryId,
    choice: { kind: "cold" },
  });
  const restored = await selectedCourse(reopened.app, { kind: "cursor" });
  if (restored.kind !== "ready" || restored.projection.kind !== "writing")
    assert.fail("A's saved writing must resume after reopening");
  const { documents: beforeDocuments, ...beforeTeaching } = before.projection;
  const { documents: restoredDocuments, ...restoredTeaching } =
    restored.projection;
  assert.deepEqual(restored.witness, before.witness);
  assert.deepEqual(restored.course, before.course);
  assert.deepEqual(restoredTeaching, beforeTeaching);
  assert.deepEqual(
    restoredDocuments,
    beforeDocuments.map((document) => ({
      ...document,
      revision: (BigInt(document.revision) + 1n).toString(),
      inputEpoch: (BigInt(document.inputEpoch) + 1n).toString(),
    })),
  );
  assert.deepEqual(
    await selectedWork(reopened.app, {
      owner: ownerA,
      runId: before.projection.runId,
    }),
    work,
  );
});
