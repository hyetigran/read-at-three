import assert from "node:assert/strict";
import { test } from "node:test";
import {
  completionProof,
  evaluateGraph,
  initialState,
  project,
  writingPermission,
  writingTask,
  parseDevelopmentPackage,
  canonical,
  parseId,
} from "../../packages/teaching/src/index.ts";
import { writingFixture, writingHash } from "./writing-fixture.ts";

test("seven explicit normal writing turns require four distinct parent phase confirmations", async () => {
  const content = await writingFixture();
  let state = initialState(content);
  const observed: string[] = [],
    actions: string[] = [];
  for (const kind of [
    "continue",
    "continue",
    "confirmTracing",
    "confirmIndependent",
    "continue",
    "confirmTracing",
    "confirmIndependent",
  ]) {
    if (state.kind !== "graphControls")
      throw new Error("Control state missing");
    const current = project(content, state);
    if (
      current.kind !== "teaching" ||
      !("presentation" in current.turn) ||
      current.turn.presentation.kind !== "writing"
    )
      throw new Error("Writing turn missing");
    observed.push(current.turn.id);
    actions.push(kind);
    const p = current.turn.presentation;
    const before = state;
    if (p.obligation.kind === "phaseConfirmation") {
      assert.throws(
        () =>
          evaluateGraph({
            content,
            state: before,
            status: "inProgress",
            action: { kind: "repeat" },
          }),
        /confirmation/,
      );
      assert.throws(
        () =>
          evaluateGraph({
            content,
            state: before,
            status: "inProgress",
            action: { kind: "continue" },
          }),
        /confirmation/,
      );
    }
    const action =
      kind === "confirmTracing"
        ? ({
            kind,
            targetId: p.targetId,
            nodeId: current.turn.id,
            phase: "childTracing",
          } satisfies import("../../packages/teaching/src/index.ts").GraphAction)
        : kind === "confirmIndependent"
          ? ({
              kind,
              targetId: p.targetId,
              nodeId: current.turn.id,
              phase: "childIndependentWriting",
            } satisfies import("../../packages/teaching/src/index.ts").GraphAction)
          : ({
              kind: "continue",
            } satisfies import("../../packages/teaching/src/index.ts").GraphAction);
    state = evaluateGraph({
      content,
      state,
      status: "inProgress",
      action,
    }).after;
  }
  assert.deepEqual(observed, [
    "fixture.writing.turn.1",
    "fixture.writing.turn.2",
    "fixture.writing.turn.3",
    "fixture.writing.turn.4",
    "fixture.writing.turn.5",
    "fixture.writing.turn.6",
    "fixture.writing.turn.7",
  ]);
  assert.equal(actions.filter((a) => a.startsWith("confirm")).length, 4);
  assert.equal(
    completionProof(content, state)?.requiredOccurrenceIds.length,
    7,
  );
});
test("permissions follow accepted frontier while Back is read only and generic tasks cannot Skip", async () => {
  const content = await writingFixture();
  let state = initialState(content);
  const entry =
    content.body.coverage === "lesson1-complete"
      ? content.body.tasks[0]
      : undefined;
  if (!entry) throw Error();
  const task = writingTask({ content, taskId: entry.task.id });
  if (!task || state.kind !== "graphControls") throw Error();
  const first = task.targets[0],
    second = task.targets[1];
  if (!first || !second) throw Error();
  assert.equal(
    writingPermission({ content, state, targetId: first.id }).writable,
    false,
  );
  assert.equal(
    writingPermission({ content, state, targetId: second.id }).writable,
    false,
  );
  state = evaluateGraph({
    content,
    state,
    status: "inProgress",
    action: { kind: "continue" },
  }).after;
  if (state.kind !== "graphControls") throw Error();
  assert.equal(
    writingPermission({ content, state, targetId: first.id }).writable,
    true,
  );
  const back = evaluateGraph({
    content,
    state,
    status: "inProgress",
    action: { kind: "back" },
  }).after;
  assert.equal(
    writingPermission({ content, state: back, targetId: first.id }).writable,
    false,
  );
  const skipped = evaluateGraph({
    content,
    state,
    status: "inProgress",
    action: { kind: "skipWriting" },
  });
  assert.equal(skipped.kind, "skip");
  assert.equal(project(content, skipped.after).kind, "skipped");
  assert.equal(completionProof(content, skipped.after), null);
  const raw = JSON.parse(canonical(content));
  raw.body.tasks[0].kind = "graphControls";
  await assert.rejects(
    parseDevelopmentPackage(
      { ...raw, packageHash: await writingHash(canonical(raw.body)) },
      writingHash,
    ),
  );
});

test("Back to an accepted Repeat checkpoint with the frontier source node stays read only", async () => {
  const content = await writingFixture();
  let state = initialState(content);
  if (state.kind !== "graphControls") throw Error();
  state = evaluateGraph({
    content,
    state,
    status: "inProgress",
    action: { kind: "continue" },
  }).after;
  if (state.kind !== "graphControls") throw Error();
  state = evaluateGraph({
    content,
    state,
    status: "inProgress",
    action: { kind: "repeat" },
  }).after;
  if (state.kind !== "graphControls") throw Error();
  state = evaluateGraph({
    content,
    state,
    status: "inProgress",
    action: { kind: "continue" },
  }).after;
  if (state.kind !== "graphControls") throw Error();
  state = evaluateGraph({
    content,
    state,
    status: "inProgress",
    action: { kind: "back" },
  }).after;
  assert.equal(
    writingPermission({
      content,
      state,
      targetId: parseId({ kind: "target", value: "first" }),
    }).writable,
    false,
  );
});
