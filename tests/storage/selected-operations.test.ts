import { executeTeaching, selectedProjection } from "./selected-support.ts";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  parseDevelopmentPackage,
  prepareCommand,
  prepareInkCommand,
  parseId,
  parseRecoveryResult,
  parseInkResult,
} from "@readatthree/teaching";
import type { SelectedTeachingOperation } from "@readatthree/teaching";
import { profileFixture } from "./profile-support.ts";
import { databaseSnapshot, hash, isReadOnlySqlAttempt } from "./support.ts";

test("an accepted A operation remains retired after A to B to A, and fresh switch-back Undo executes", async (t) => {
  const content = await parseDevelopmentPackage(
    JSON.parse(
      await readFile("tests/fixtures/graph-development-package.json", "utf8"),
    ),
    hash,
  );
  const fixture = await profileFixture(t);
  let statements: string[] | null = null;
  const { app, db } = fixture.connect({
    content,
    hook: async (sql, work) => {
      statements?.push(sql);
      return work();
    },
  });
  const ownerA = await fixture.setup(app);
  await fixture.act(app, "start");
  const origin = await selectedProjection(app);
  if (origin.kind !== "teaching") assert.fail("A's model turn is required");
  const selection = (await app.readDirectory()).selection;
  const operation: SelectedTeachingOperation = {
    kind: "teaching",
    selection,
    command: await prepareCommand({
      projection: origin,
      ids: fixture.ids,
      hash,
    }),
  };
  const accepted = await executeTeaching(app, operation);
  assert.equal(accepted.kind, "committed");
  const beforeSwitch = await selectedProjection(app);
  if (beforeSwitch.kind !== "teaching")
    assert.fail("Accepted A response required");
  assert.equal(beforeSwitch.turn.id, "fixture.graph.l01.t01.s02.response-m");
  await fixture.change(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  await fixture.change(app, (directory) => ({
    kind: "selectProfile",
    directory: directory.administration,
    target: ownerA,
  }));
  const returned = await selectedProjection(app);
  if (returned.kind !== "teaching")
    assert.fail("A's saved response must return");
  assert.equal(returned.runId, origin.runId);
  assert.equal(returned.turn.id, beforeSwitch.turn.id);
  assert.equal(returned.sessionStatus, "paused");
  assert.equal((await app.readDirectory()).selection.revision, "2");
  statements = [];
  const oldResult = await app.execute(operation);
  const rejectedStatements = statements;
  statements = null;
  assert.equal(
    rejectedStatements.filter((sql) => sql === "BEGIN IMMEDIATE").length,
    1,
  );
  assert.equal(rejectedStatements.filter((sql) => sql === "COMMIT").length, 1);
  assert.equal(
    rejectedStatements.some((sql) => sql.includes('"command_receipt"')),
    false,
  );
  assert.equal(oldResult.kind, "teaching");
  assert.equal(oldResult.result.kind, "rejected");
  if (oldResult.result.kind === "rejected")
    assert.equal(oldResult.result.code, "stale-selection");
  assert.deepEqual(await selectedProjection(app), returned);
  const undo = returned.actions.find(
    (action) => action.intent.kind === "undoAdvance",
  );
  if (!undo) assert.fail("The retained Undo window must still be usable");
  const fresh = await app.execute({
    kind: "teaching",
    selection: (await app.readDirectory()).selection,
    command: await prepareCommand({
      projection: returned,
      request: { kind: "action", action: undo },
      ids: fixture.ids,
      hash,
    }),
  });
  assert.equal(fresh.result.kind, "committed");
  const restored = await selectedProjection(app);
  if (restored.kind !== "teaching")
    assert.fail("Undo must restore model teaching");
  assert.equal(restored.turn.id, origin.turn.id);
  assert.equal(restored.runId, origin.runId);
  assert.equal(restored.sessionId, origin.sessionId);
  assert.equal(
    db.prepare("SELECT count(*) AS count FROM advance_withdrawal").get()?.count,
    1,
  );
});

test("retired ordinary ink and reads refuse A to B to A while closed recovery resolves only its committed receipt", async (t) => {
  const fixture = await profileFixture(t);
  const { app, db } = fixture.connect();
  const ownerA = await fixture.setup(app);
  await fixture.start(app);
  const { projection, token } = await fixture.current(app);
  const selection = (await app.readDirectory()).selection;
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
  const operation = {
    kind: "ink",
    selection,
    command: await prepareInkCommand({
      token: next,
      edit: {
        kind: "finalize",
        strokeId,
        layer: "tracing",
        chunks: [],
        status: "finished",
      },
      ids: fixture.ids,
      hash,
    }),
  } satisfies import("@readatthree/teaching").SelectedInkOperation;
  const accepted = await app.execute(operation);
  assert.equal(accepted.result.kind, "inkCommitted");
  await fixture.change(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  await fixture.change(app, (directory) => ({
    kind: "selectProfile",
    directory: directory.administration,
    target: ownerA,
  }));
  const before = db
    .prepare("SELECT * FROM ink_document ORDER BY document_id")
    .all();
  const rejected = await app.execute(operation);
  assert.equal(rejected.result.kind, "rejected");
  if (rejected.result.kind === "rejected")
    assert.equal(rejected.result.code, "stale-selection");
  await assert.rejects(
    app.readApplication({ selection, target: { kind: "cursor" } }),
    /lifetime changed/,
  );
  await assert.rejects(
    app.readInk({ selection, token: next }),
    /lifetime changed/,
  );
  await assert.rejects(
    app.readWork({ selection, runId: projection.runId }),
    /lifetime changed/,
  );
  await assert.rejects(
    app.readPracticeControls({
      selection,
      binding: {
        owner: ownerA,
        packageHash: projection.packageHash,
        sessionId: projection.sessionId,
        runId: projection.runId,
      },
    }),
    /lifetime changed/,
  );
  const inventory = await app.openRecovery({
    kind: "warm",
    selection,
    retainedStrokeIds: [strokeId],
    teaching: null,
    administration: null,
  });
  const resolved = await app.recoverInk({
    recoveryId: inventory.recoveryId,
    operation,
  });
  assert.equal(resolved.resolution, "receiptOnly");
  assert.deepEqual(resolved.result, accepted.result);
  assert.deepEqual(parseRecoveryResult(resolved, parseInkResult), resolved);
  assert.throws(
    () =>
      parseRecoveryResult(
        { ...resolved, resolution: "rejected" },
        parseInkResult,
      ),
    /unsupported/,
  );
  assert.throws(
    () =>
      parseRecoveryResult(
        {
          ...resolved,
          resolution: "applied",
          result: {
            kind: "rejected",
            code: "stale-selection",
            message: "The selected child changed.",
          },
        },
        parseInkResult,
      ),
    /unsupported/,
  );
  assert.deepEqual(
    db.prepare("SELECT * FROM ink_document ORDER BY document_id").all(),
    before,
  );
  const directory = await app.reconcileRecovery({
    recoveryId: inventory.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [strokeId] },
  });
  assert.equal(directory.selection.revision, "2");
  assert.deepEqual(directory.selection.owner, ownerA);
});

test("retired teaching recovery cannot execute a missing command and resolves an exact accepted receipt without new teaching writes", async (t) => {
  const content = await parseDevelopmentPackage(
    JSON.parse(
      await readFile("tests/fixtures/graph-development-package.json", "utf8"),
    ),
    hash,
  );
  const fixture = await profileFixture(t);
  const { app, db } = fixture.connect({ content });
  const ownerA = await fixture.setup(app);
  await fixture.act(app, "start");
  const selection = (await app.readDirectory()).selection;
  const acceptedOperation: SelectedTeachingOperation = {
    kind: "teaching",
    selection,
    command: await prepareCommand({
      projection: await selectedProjection(app),
      ids: fixture.ids,
      hash,
    }),
  };
  const accepted = await app.execute(acceptedOperation);
  assert.equal(accepted.result.kind, "committed");
  const pendingOperation: SelectedTeachingOperation = {
    kind: "teaching",
    selection,
    command: await prepareCommand({
      projection: await selectedProjection(app),
      ids: fixture.ids,
      hash,
    }),
  };
  await fixture.change(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  const rows = () => ({
    runs: db.prepare("SELECT * FROM task_run ORDER BY run_id").all(),
    advances: db
      .prepare("SELECT * FROM task_advance ORDER BY advance_id")
      .all(),
    receipts: db
      .prepare("SELECT * FROM command_receipt ORDER BY command_id")
      .all(),
  });
  const before = rows();
  const missing = await app.openRecovery({
    kind: "warm",
    selection,
    retainedStrokeIds: [],
    teaching: pendingOperation,
    administration: null,
  });
  const rejected = await app.recoverTeaching({
    recoveryId: missing.recoveryId,
    operation: pendingOperation,
  });
  assert.equal(rejected.resolution, "rejected");
  assert.equal(rejected.result.kind, "rejected");
  if (rejected.result.kind === "rejected")
    assert.equal(rejected.result.code, "stale-selection");
  assert.deepEqual(rows(), before);
  await app.reconcileRecovery({
    recoveryId: missing.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [] },
  });
  const retained = await app.openRecovery({
    kind: "warm",
    selection,
    retainedStrokeIds: [],
    teaching: acceptedOperation,
    administration: null,
  });
  const resolved = await app.recoverTeaching({
    recoveryId: retained.recoveryId,
    operation: acceptedOperation,
  });
  assert.equal(resolved.resolution, "receiptOnly");
  assert.deepEqual(resolved.result, accepted.result);
  assert.deepEqual(rows(), before);
  const directory = await app.reconcileRecovery({
    recoveryId: retained.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [] },
  });
  assert.notDeepEqual(directory.selection.owner, ownerA);
});

test("canonical teaching corruption refuses selected recovery discovery before persistent writes", async (t) => {
  const fixture = await profileFixture(t),
    first = fixture.connect();
  await fixture.setup(first.app);
  await fixture.start(first.app);
  const selection = (await first.app.readDirectory()).selection;
  first.db.exec("DELETE FROM course_cursor");
  const before = await databaseSnapshot(first.db);
  first.db.close();
  const recorded: string[] = [];
  const reopened = fixture.connect({
    hook: async (sql, work) => {
      recorded.push(sql);
      return work();
    },
  });
  for (const read of [
    () => reopened.app.openRecovery({ kind: "cold" }),
    () => reopened.app.readDirectory(),
    () =>
      reopened.app.readApplication({ selection, target: { kind: "cursor" } }),
    () => reopened.app.readDeparture({ selection }),
  ])
    await assert.rejects(read(), /Saved teaching is missing its resume cursor/);
  assert.ok(recorded.length > 0);
  assert.ok(recorded.every(isReadOnlySqlAttempt));
  assert.deepEqual(await databaseSnapshot(reopened.db), before);
});

for (const substitutedTask of ["fixture.task", "fixture.graph.l01.t04"]) {
  test(`retired Resume rejects a canonical receipt substituted from another ${substitutedTask === "fixture.task" ? "same-task" : "different-task"} delivery`, async (t) => {
    const { canonical, parseCommand } = await import("@readatthree/teaching");
    const content = await parseDevelopmentPackage(
      JSON.parse(
        await readFile("tests/fixtures/graph-development-package.json", "utf8"),
      ),
      hash,
    );
    const fixture = await profileFixture(t);
    let statements: string[] | null = null;
    const { app, db } = fixture.connect({
      content,
      hook: async (sql, work) => {
        statements?.push(sql);
        return work();
      },
    });
    await fixture.setup(app);
    const first = await fixture.act(
      app,
      "start",
      (action) =>
        "taskId" in action.intent && action.intent.taskId === "fixture.task",
    );
    assert.ok(first.kind === "committed");
    const directory = await app.readDirectory();
    const active = directory.profiles.find(
      (profile) =>
        profile.edit.owner.profileId === directory.selection.owner.profileId,
    );
    assert.ok(active);
    const payload = {
      packageHash: content.packageHash,
      taskId: substitutedTask,
      intent: substitutedTask === "fixture.task" ? "restart" : "start",
      sessionId: substitutedTask === "fixture.task" ? first.sessionId : null,
    };
    const other = await app.execute({
      kind: "teaching",
      selection: directory.selection,
      command: parseCommand({
        kind: "select",
        commandId: fixture.ids(),
        owner: directory.selection.owner,
        scope: {
          kind: "profile",
          id: directory.selection.owner.profileId,
          generation: directory.selection.owner.generation,
        },
        expectedRevision: active.edit.revision,
        payload,
        payloadHash: await hash(canonical({ kind: "select", payload })),
      }),
    });
    assert.ok(other.result.kind === "committed");
    const target = substitutedTask === "fixture.task" ? other.result : first;
    const source = substitutedTask === "fixture.task" ? first : other.result;
    const beforeResume = await app.readDirectory();
    const profile = beforeResume.profiles.find(
      (value) =>
        value.edit.owner.profileId === beforeResume.selection.owner.profileId,
    );
    assert.ok(profile);
    const resumePayload = {
      packageHash: content.packageHash,
      taskId: "fixture.task",
      intent: "resume",
      sessionId: target.sessionId,
    };
    const operation: SelectedTeachingOperation = {
      kind: "teaching",
      selection: beforeResume.selection,
      command: parseCommand({
        kind: "select",
        commandId: fixture.ids(),
        owner: beforeResume.selection.owner,
        scope: {
          kind: "profile",
          id: beforeResume.selection.owner.profileId,
          generation: beforeResume.selection.owner.generation,
        },
        expectedRevision: profile.edit.revision,
        payload: resumePayload,
        payloadHash: await hash(
          canonical({ kind: "select", payload: resumePayload }),
        ),
      }),
    };
    const accepted = await app.execute(operation);
    assert.ok(accepted.result.kind === "committed");
    await fixture.change(app, (value) => ({
      kind: "createAndSelect",
      directory: value.administration,
      preferences: { avatarId: "owl" },
    }));
    const opening = {
      kind: "warm",
      selection: operation.selection,
      retainedStrokeIds: [],
      teaching: operation,
      administration: null,
    } satisfies import("@readatthree/teaching").SelectedRecoveryOpening;
    const inventory = await app.openRecovery(opening);
    const exact = await app.recoverTeaching({
      recoveryId: inventory.recoveryId,
      operation,
    });
    assert.equal(exact.resolution, "receiptOnly");
    assert.deepEqual(exact.result, accepted.result);
    db.prepare("UPDATE command_receipt SET result=? WHERE command_id=?").run(
      canonical({
        ...accepted.result,
        sessionId: source.sessionId,
        runId: source.runId,
      }),
      operation.command.commandId,
    );
    const rows = () => ({
      receipts: db
        .prepare("SELECT * FROM command_receipt ORDER BY command_id")
        .all(),
      runs: db.prepare("SELECT * FROM task_run ORDER BY run_id").all(),
      sessions: db.prepare("SELECT * FROM session ORDER BY session_id").all(),
    });
    const before = rows();
    statements = [];
    await assert.rejects(
      app.recoverTeaching({ recoveryId: inventory.recoveryId, operation }),
      /Retained teaching receipt/,
    );
    assert.equal(
      statements.some((sql) =>
        /^(?:INSERT|UPDATE|DELETE|REPLACE)/i.test(sql.trim()),
      ),
      false,
    );
    assert.deepEqual(rows(), before);
  });
}

test("retired committed ink, teaching and administration settle only in declared order before the final fence", async (t) => {
  const { prepareWritingCommand } = await import("@readatthree/teaching");
  const fixture = await profileFixture(t);
  const { app, db } = fixture.connect();
  await fixture.setup(app);
  await fixture.start(app);
  const initial = await fixture.current(app);
  const selection = (await app.readDirectory()).selection;
  const strokeId = parseId({ kind: "stroke", value: fixture.ids() });
  const token = await fixture.edit(app, initial.token, {
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
  const ink = {
    kind: "ink",
    selection,
    command: await prepareInkCommand({
      token,
      edit: {
        kind: "finalize",
        strokeId,
        layer: "tracing",
        chunks: [],
        status: "finished",
      },
      ids: fixture.ids,
      hash,
    }),
  } satisfies import("@readatthree/teaching").SelectedInkOperation;
  const acceptedInk = await app.execute(ink);
  assert.ok(acceptedInk.result.kind === "inkCommitted");
  const origin = await selectedProjection(app);
  assert.ok(origin.kind === "writing");
  const pause = origin.actions.find((action) => action.intent.kind === "pause");
  assert.ok(pause);
  const teaching = {
    kind: "teaching",
    selection,
    command: await prepareWritingCommand({
      projection: origin,
      action: pause,
      barrier: { kind: "writing", documents: origin.documents },
      ids: fixture.ids,
      hash,
    }),
  } satisfies SelectedTeachingOperation;
  const acceptedTeaching = await app.execute(teaching);
  assert.ok(acceptedTeaching.result.kind === "committed");
  const administration = await fixture.change(app, (directory) => ({
    kind: "createAndSelect",
    directory: directory.administration,
    preferences: { avatarId: "owl" },
  }));
  const current = await app.readDirectory();
  const before = db
    .prepare("SELECT * FROM ink_document ORDER BY document_id")
    .all();
  const runs = db.prepare("SELECT * FROM task_run ORDER BY run_id").all();
  const inventory = await app.openRecovery({
    kind: "warm",
    selection,
    retainedStrokeIds: [strokeId],
    teaching,
    administration: administration.command,
  });
  assert.equal(
    (
      await app.recoverTeaching({
        recoveryId: inventory.recoveryId,
        operation: teaching,
      })
    ).resolution,
    "rejected",
  );
  assert.equal(
    (
      await app.recoverAdministration({
        recoveryId: inventory.recoveryId,
        command: administration.command,
      })
    ).resolution,
    "rejected",
  );
  await assert.rejects(
    app.reconcileRecovery({
      recoveryId: inventory.recoveryId,
      choice: { kind: "warm", settledStrokeIds: [strokeId] },
    }),
  );
  const restoredInk = await app.recoverInk({
    recoveryId: inventory.recoveryId,
    operation: ink,
  });
  assert.equal(restoredInk.resolution, "receiptOnly");
  assert.deepEqual(restoredInk.result, acceptedInk.result);
  assert.deepEqual(
    db.prepare("SELECT * FROM ink_document ORDER BY document_id").all(),
    before,
  );
  assert.equal(
    (
      await app.recoverAdministration({
        recoveryId: inventory.recoveryId,
        command: administration.command,
      })
    ).resolution,
    "rejected",
  );
  const restoredTeaching = await app.recoverTeaching({
    recoveryId: inventory.recoveryId,
    operation: teaching,
  });
  assert.equal(restoredTeaching.resolution, "receiptOnly");
  assert.deepEqual(restoredTeaching.result, acceptedTeaching.result);
  const restoredAdmin = await app.recoverAdministration({
    recoveryId: inventory.recoveryId,
    command: administration.command,
  });
  assert.equal(restoredAdmin.resolution, "receiptOnly");
  assert.deepEqual(restoredAdmin.result, administration.result);
  assert.deepEqual(
    db.prepare("SELECT * FROM ink_document ORDER BY document_id").all(),
    before,
  );
  assert.deepEqual(
    db.prepare("SELECT * FROM task_run ORDER BY run_id").all(),
    runs,
  );
  const reconciled = await app.reconcileRecovery({
    recoveryId: inventory.recoveryId,
    choice: { kind: "warm", settledStrokeIds: [strokeId] },
  });
  assert.deepEqual(reconciled.selection, current.selection);
  assert.deepEqual(
    db.prepare("SELECT * FROM task_run ORDER BY run_id").all(),
    runs,
  );
});

test("selected Worker boundaries retain whole operations and reject legacy or mismatched recovery envelopes", async (t) => {
  const { canonical } = await import("@readatthree/teaching");
  const { parseRequest, parseResponse } =
    await import("../../apps/web/src/platform/protocol.ts");
  const fixture = await profileFixture(t);
  const { app } = fixture.connect();
  await fixture.setup(app);
  await fixture.start(app);
  const selection = (await app.readDirectory()).selection;
  const projection = await selectedProjection(app);
  assert.ok(projection.kind === "writing");
  const { prepareWritingCommand } = await import("@readatthree/teaching");
  const action = projection.actions.find(
    (value) => value.intent.kind === "pause",
  );
  assert.ok(action);
  const operation = {
    kind: "teaching",
    selection,
    command: await prepareWritingCommand({
      projection,
      action,
      barrier: { kind: "writing", documents: projection.documents },
      ids: fixture.ids,
      hash,
    }),
  } satisfies SelectedTeachingOperation;
  const bytes = canonical(operation);
  const wire = parseRequest(
    JSON.parse(
      JSON.stringify({ id: "selected-wire", kind: "execute", operation }),
    ),
  );
  assert.ok(wire.kind === "execute");
  assert.equal(canonical(wire.operation), bytes);
  assert.equal(
    wire.operation.command.payloadHash,
    operation.command.payloadHash,
  );
  assert.ok(Object.isFrozen(wire.operation));
  assert.throws(
    () =>
      parseRequest({
        id: "selected-wire",
        kind: "execute",
        operation: { kind: "teaching", command: operation.command },
      }),
    /unsupported/,
  );
  assert.throws(
    () =>
      parseRequest({
        id: "selected-wire",
        kind: "dispatch",
        command: operation.command,
      }),
    /unsupported/,
  );
  assert.throws(
    () =>
      parseRequest({
        id: "selected-wire",
        kind: "openRecovery",
        content: fixture.content,
        preparation: { kind: "unavailable", reason: "missing" },
        opening: {
          kind: "warm",
          selection: { ...selection, revision: "99" },
          retainedStrokeIds: [],
          teaching: operation,
          administration: null,
        },
      }),
    /selection differs/,
  );
  const result = await app.execute(operation);
  const response = parseResponse(
    JSON.parse(
      JSON.stringify({ id: "selected-wire", kind: "execution", value: result }),
    ),
  );
  assert.ok(response.kind === "execution");
  assert.deepEqual(response.value, result);
  assert.throws(
    () =>
      parseResponse({
        id: "selected-wire",
        kind: "teachingRecovery",
        value: { selection, resolution: "rejected", result: result.result },
      }),
    /unsupported/,
  );
});
