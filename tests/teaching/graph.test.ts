import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  completionProof,
  currentCheckpoint,
  evaluateGraph,
  initialState,
  parseTeachingState,
  project,
  validatePosition,
  validateAcceptanceState,
  validateAcceptanceTransition,
} from "../../packages/teaching/src/index.ts";
import type {
  DevelopmentPackage,
  GraphAction,
  GraphTeachingState,
  TeachingState,
  TaskId,
} from "../../packages/teaching/src/index.ts";
import {
  graphFixture,
  graphBody,
  task1,
  task4,
  correction,
} from "./graph-fixture.ts";
function graph(state: TeachingState): GraphTeachingState {
  if (state.kind !== "graph") throw new Error("Expected graph");
  return state;
}
function start(content: DevelopmentPackage, taskId = task1) {
  return graph(initialState(content, taskId));
}
function turn(content: DevelopmentPackage, state: GraphTeachingState) {
  const screen = project(content, state);
  if (screen.kind !== "teaching" || !("occurrenceId" in screen.turn))
    throw new Error("Expected graph turn");
  return screen.turn;
}
function act(
  content: DevelopmentPackage,
  state: GraphTeachingState,
  action: GraphAction = { kind: "continue" },
  status: "inProgress" | "completed" = "inProgress",
) {
  const plan = evaluateGraph({ content, state, status, action });
  return { ...plan, after: graph(plan.after) };
}
function advance(
  content: DevelopmentPackage,
  state: GraphTeachingState,
  count: number,
) {
  for (let i = 0; i < count; i++) state = act(content, state).after;
  return state;
}

test("six introductory turns and two review turns require separate parent acceptance", async () => {
  const content = await graphFixture();
  for (const [taskId, expected] of [
    [task1, ["model-m", "child-m", "again-m", "model-s", "child-s", "again-s"]],
    [task4, ["review-m", "review-s"]],
  ] satisfies [TaskId, string[]][]) {
    let state = start(content, taskId);
    const seen: string[] = [];
    for (let i = 0; i < expected.length; i++) {
      const view = turn(content, state);
      seen.push(view.id);
      assert.deepEqual(
        view.guidance.map((span) => span.kind),
        ["speech", "action", "speech", "expected", "praise"],
      );
      assert.equal(completionProof(content, state), null);
      const plan = act(content, state);
      assert.notEqual(plan.acceptance, null);
      assert.equal(plan.completion !== null, i === expected.length - 1);
      state = plan.after;
    }
    assert.deepEqual(seen, expected);
    assert.deepEqual(project(content, state), { kind: "completed" });
    assert.equal(
      completionProof(content, state)?.requiredOccurrenceIds.length,
      expected.length,
    );
  }
});

test("first-child Help retests its fixed required occurrence and still owes Again for both sounds", async () => {
  const content = await graphFixture();
  for (const [prefix, count] of [
    ["m", 1],
    ["s", 4],
  ] satisfies [string, number][]) {
    let state = advance(content, start(content), count);
    const owed = turn(content, state).occurrenceId;
    state = act(content, state, {
      kind: "help",
      correctionId: correction(`help-${prefix}`),
    }).after;
    assert.equal(turn(content, state).id, `support-${prefix}`);
    state = act(content, state).after;
    assert.equal(turn(content, state).id, `child-${prefix}`);
    assert.equal(turn(content, state).occurrenceId, owed);
    const retest = act(content, state);
    assert.equal(retest.acceptance?.occurrenceId, owed);
    assert.equal(retest.completion, null);
    assert.equal(turn(content, retest.after).id, `again-${prefix}`);
    assert.equal(
      retest.after.acceptedOccurrenceIds.includes(
        turn(content, retest.after).occurrenceId,
      ),
      false,
    );
  }
});

test("Help from Again creates a support retest and returns to the outstanding Again", async () => {
  const content = await graphFixture();
  for (const [prefix, count] of [
    ["m", 2],
    ["s", 5],
  ] satisfies [string, number][]) {
    let state = advance(content, start(content), count);
    const again = turn(content, state).occurrenceId;
    const acceptedBefore = [...state.acceptedOccurrenceIds];
    state = act(content, state, {
      kind: "help",
      correctionId: correction(`help-${prefix}`),
    }).after;
    state = act(content, state).after;
    assert.equal(turn(content, state).id, `child-${prefix}`);
    assert.equal(turn(content, state).extraPractice, true);
    assert(!acceptedBefore.includes(turn(content, state).occurrenceId));
    const retest = act(content, state);
    assert.equal(turn(content, retest.after).occurrenceId, again);
    assert.equal(retest.after.acceptedOccurrenceIds.includes(again), false);
    assert.equal(retest.completion, null);
  }
});

test("Repeat practice and Help during Repeat preserve the owed normal response and Again", async () => {
  const content = await graphFixture();
  let state = advance(content, start(content), 1);
  const owed = turn(content, state).occurrenceId;
  state = act(content, state, { kind: "repeat" }).after;
  const practice = turn(content, state).occurrenceId;
  assert.notEqual(practice, owed);
  assert.equal(turn(content, state).extraPractice, true);
  state = act(content, state, {
    kind: "help",
    correctionId: correction("help-m"),
  }).after;
  state = act(content, state).after;
  assert.notEqual(turn(content, state).occurrenceId, owed);
  assert.equal(turn(content, state).extraPractice, true);
  state = act(content, state).after;
  assert.equal(turn(content, state).occurrenceId, practice);
  assert.equal(state.acceptedOccurrenceIds.includes(owed), false);
  state = act(content, state).after;
  assert.equal(turn(content, state).occurrenceId, owed);
  state = act(content, state).after;
  assert.equal(turn(content, state).id, "again-m");
  assert.equal(
    state.acceptedOccurrenceIds.includes(turn(content, state).occurrenceId),
    false,
  );
});

test("review s correction repeats the whole m/s exercise and retests only authored normal bindings", async () => {
  const content = await graphFixture();
  let state = advance(content, start(content, task4), 1);
  const owedS = turn(content, state).occurrenceId;
  const acceptedM = state.acceptedOccurrenceIds[0];
  state = act(content, state, {
    kind: "help",
    correctionId: correction("review-help-s"),
  }).after;
  state = act(content, state).after;
  assert.equal(turn(content, state).id, "review-m");
  assert.notEqual(turn(content, state).occurrenceId, acceptedM);
  assert.equal(state.acceptedOccurrenceIds.includes(owedS), false);
  state = act(content, state).after;
  assert.equal(turn(content, state).id, "review-s");
  assert.equal(turn(content, state).occurrenceId, owedS);
  const done = act(content, state);
  assert.equal(done.completion?.requiredOccurrenceIds.length, 2);
  assert.equal(
    done.after.acceptedOccurrenceIds.filter((id) => id === acceptedM).length,
    1,
  );
});

test("Back and reconfirm retain acceptance, including completion independent of current view", async () => {
  const content = await graphFixture();
  let state = advance(content, start(content), 2);
  const accepted = [...state.acceptedOccurrenceIds];
  state = act(content, state, { kind: "back" }).after;
  assert.equal(turn(content, state).id, "child-m");
  const reconfirm = act(content, state);
  assert.equal(reconfirm.acceptance, null);
  assert.deepEqual(reconfirm.after.acceptedOccurrenceIds, accepted);
  state = advance(content, reconfirm.after, 4);
  const proof = completionProof(content, state);
  assert(proof);
  state = act(content, state, { kind: "back" }, "completed").after;
  assert.equal(turn(content, state).id, "again-s");
  assert.deepEqual(completionProof(content, state), proof);
  assert.throws(
    () => act(content, state, { kind: "repeat" }, "completed"),
    /closed/,
  );
  assert.throws(
    () =>
      act(
        content,
        state,
        { kind: "help", correctionId: correction("help-s") },
        "completed",
      ),
    /closed/,
  );
  const forward = act(content, state, { kind: "continue" }, "completed");
  assert.equal(forward.acceptance, null);
  assert.equal(forward.completion, null);
  assert.deepEqual(project(content, forward.after), { kind: "completed" });
});

test("pause/restart serialization restores correction retest and suspended practice exactly", async () => {
  const content = await graphFixture();
  let state = advance(content, start(content), 1);
  state = act(content, state, { kind: "repeat" }).after;
  state = act(content, state, {
    kind: "help",
    correctionId: correction("help-m"),
  }).after;
  state = act(content, state).after;
  const paused = act(content, state, { kind: "pause" });
  assert.equal(paused.pause, true);
  assert.equal(paused.acceptance, null);
  const restored = graph(
    parseTeachingState(JSON.parse(canonical(paused.after))),
  );
  assert.deepEqual(project(content, restored), project(content, state));
  assert.deepEqual(act(content, restored).after, act(content, state).after);
});

test("acceptance validation permits navigation gaps and rejects changed acceptance/bindings", async () => {
  const content = await graphFixture();
  const before = start(content);
  const accepted = act(content, before);
  assert(accepted.acceptance);
  validateAcceptanceTransition({
    content,
    taskId: task1,
    before,
    after: accepted.after,
    occurrenceId: accepted.acceptance.occurrenceId,
  });
  const navigated = act(content, accepted.after, { kind: "repeat" }).after;
  validateAcceptanceState({
    content,
    taskId: task1,
    baseline: accepted.after,
    state: navigated,
  });
  assert.notEqual(canonical(navigated), canonical(accepted.after));
  const fabricated = {
    ...navigated,
    acceptedOccurrenceIds: [
      ...navigated.acceptedOccurrenceIds,
      turn(content, navigated).occurrenceId,
    ],
  };
  assert.throws(
    () =>
      validateAcceptanceState({
        content,
        taskId: task1,
        baseline: accepted.after,
        state: fabricated,
      }),
    /acceptance/,
  );
  const changed = {
    ...navigated,
    occurrences: navigated.occurrences.map((entry, index) =>
      index === 0 ? { ...entry, nodeId: turn(content, navigated).id } : entry,
    ),
  };
  assert.throws(() => validatePosition(content, changed), /binding/);
});

test("malformed graph routes, context indexes, unknown fields and numeric counters fail closed", async () => {
  const content = await graphFixture();
  const state = start(content);
  assert.throws(
    () =>
      parseTeachingState({
        ...state,
        nextOccurrenceNumber: "9223372036854775808",
      }),
    /counter/,
  );
  assert.throws(
    () => parseTeachingState({ ...state, unknown: true }),
    /schema/,
  );
  assert.throws(
    () => validatePosition(content, { ...state, checkpointIndex: 99 }),
    /cursor/,
  );
  let retest = act(content, advance(content, state, 1), {
    kind: "help",
    correctionId: correction("help-m"),
  }).after;
  retest = act(content, retest).after;
  const checkpoint = currentCheckpoint(retest);
  if (checkpoint.context.kind !== "correctionRetest")
    throw new Error("Expected correction");
  const invalid = {
    ...retest,
    checkpoints: retest.checkpoints.map((entry) =>
      entry.id === checkpoint.id
        ? { ...entry, context: { ...checkpoint.context, retestIndex: 99 } }
        : entry,
    ),
  };
  assert.throws(() => validatePosition(content, invalid), /retest/);
  const first = graphBody.tasks[0];
  if (!first) throw new Error("Missing fixture task");
  const spec = first.corrections[0];
  if (!spec) throw new Error("Missing fixture correction");
  await assert.rejects(
    () =>
      graphFixture({
        ...graphBody,
        tasks: [
          {
            ...first,
            corrections: [
              { ...spec, continuationNodeId: "model-s" },
              ...first.corrections.slice(1),
            ],
          },
          ...graphBody.tasks.slice(1),
        ],
      }),
    /continuation/,
  );
  await assert.rejects(
    () =>
      graphFixture({
        ...graphBody,
        tasks: [
          {
            ...first,
            corrections: [
              { ...spec, retestNodeIds: ["child-m", "child-s"] },
              ...first.corrections.slice(1),
            ],
          },
          ...graphBody.tasks.slice(1),
        ],
      }),
    /contiguous/,
  );
});

test("Help replacing a review retest frame preserves suspended practice and never consumes the owed normal turn", async () => {
  const content = await graphFixture();
  let state = advance(content, start(content, task4), 1);
  const owedS = turn(content, state).occurrenceId;
  state = act(content, state, { kind: "repeat" }).after;
  const practiceS = turn(content, state).occurrenceId;
  state = act(content, state, {
    kind: "help",
    correctionId: correction("review-help-s"),
  }).after;
  state = act(content, state).after;
  assert.equal(turn(content, state).id, "review-m");
  state = act(content, state, {
    kind: "help",
    correctionId: correction("review-help-m"),
  }).after;
  state = act(content, state).after;
  assert.equal(turn(content, state).id, "review-m");
  state = act(content, state).after;
  assert.equal(turn(content, state).id, "review-s");
  assert.notEqual(turn(content, state).occurrenceId, owedS);
  state = act(content, state).after;
  assert.equal(turn(content, state).occurrenceId, practiceS);
  assert.equal(state.acceptedOccurrenceIds.includes(owedS), false);
  state = act(content, state).after;
  assert.equal(turn(content, state).occurrenceId, owedS);
  assert.equal(completionProof(content, state), null);
});

test("a saved checkpoint cannot skip an unaccepted source turn or redirect a Repeat to another target", async () => {
  const content = await graphFixture();
  const initial = start(content);
  const child = initial.occurrences[1];
  if (!child) throw new Error("Missing child occurrence");
  const skipped = parseTeachingState({
    ...initial,
    checkpoints: [
      ...initial.checkpoints,
      {
        id: "checkpoint-2",
        occurrenceId: child.id,
        context: { kind: "normal" },
      },
    ],
    checkpointIndex: 1,
    nextCheckpointNumber: "3",
  });
  assert.throws(() => validatePosition(content, skipped), /skipped/);
  let repeated = act(content, advance(content, initial, 1), {
    kind: "repeat",
  }).after;
  const other = repeated.occurrences.find(
    (entry) => entry.nodeId === "child-s",
  );
  if (!other) throw new Error("Missing s occurrence");
  const last = repeated.occurrences[repeated.occurrences.length - 1];
  if (!last) throw new Error("Missing practice");
  repeated = {
    ...repeated,
    occurrences: repeated.occurrences.map((entry) =>
      entry.id === last.id ? { ...entry, nodeId: other.nodeId } : entry,
    ),
  };
  assert.throws(
    () => validatePosition(content, repeated),
    /skipped|unauthored/,
  );
});
