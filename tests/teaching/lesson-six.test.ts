import { installedFixture } from "../installed-fixture.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  validateAcceptanceState,
  validatePosition,
  parseId,
  compileControlTask,
  reviewedPrintedBoards,
  writingTask,
  writingPermission,
  completionProof,
  evaluateGraph,
  initialState,
  parseTeachingState,
  parseRuntimePackage,
  project,
  taskDefinition,
  lessonSixAssetPayload,
  lessonSixAssetHash,
  connectedRenderingProfile,
  connectedPointingSvg,
  lessonSixPrintedBoards,
  printedRenderingProfile,
} from "@readatthree/teaching";
import type { GraphAction, TeachingState } from "@readatthree/teaching";
import { reviewedLessonSixCourseExtension } from "../../tools/content/extension.ts";
import { syntheticLessonSixReadiness } from "../lesson-six-readiness-fixture.ts";
import { hash } from "../lesson-two-fixture.ts";

async function fixture(index: number) {
  const { content: document, taskIds } = await syntheticLessonSixReadiness();
  const content = await installedFixture(document, hash);
  const taskId = taskIds[index];
  if (!taskId) throw Error("Synthetic task required");
  const initial = initialState(content, taskId);
  if (initial.kind === "teaching" || initial.kind === "frontier")
    throw Error("Synthetic graph state required");
  let state = initial;
  const definition = taskDefinition({ content: content.document, taskId });
  return {
    content,
    taskId,
    definition,
    get state() {
      return state;
    },
    view() {
      return project(content, state);
    },
    act(action: GraphAction) {
      const result = evaluateGraph({
        content,
        state,
        status: completionProof(content, state) ? "completed" : "inProgress",
        action,
      });
      const parsed = parseTeachingState(
        JSON.parse(JSON.stringify(result.after)),
      );
      if (parsed.kind === "teaching" || parsed.kind === "frontier")
        throw Error("Synthetic graph state required");
      state = parsed;
      return result;
    },
  };
}
for (const [index, count] of [8, 12, 24, 8, 28, 18, 8].entries())
  test(`complete course task ${index + 1} requires every ordinary response`, async () => {
    const f = await fixture(index);
    for (let i = 0; i < count; i++) {
      assert.equal(completionProof(f.content, f.state), null);
      assert.equal(f.view().kind, "teaching");
      f.act({ kind: "continue" });
    }
    if (index === 4) {
      const task = f.definition;
      if (task.kind !== "graphControls")
        throw Error("Synthetic control task required");
      const gate = task.graph.task.nodes.find(
        (node) => node.kind === "untilFirm",
      );
      if (gate?.kind !== "untilFirm")
        throw Error("Synthetic readiness required");
      assert.equal(completionProof(f.content, f.state), null);
      f.act({ kind: "parentReady", policyId: gate.policyId });
    }
    assert.ok(completionProof(f.content, f.state));
  });
for (const index of [2, 6])
  for (const repeat of [false, true])
    for (const at of index === 2 ? [13, 14, 16, 17, 19, 20, 22, 23] : [3, 7])
      test(`task ${index + 1} ${repeat ? "Repeat" : "ordinary"} Help at ${at} preserves owed response and successor`, async () => {
        const f = await fixture(index);
        if (f.definition.kind !== "graphControls")
          throw Error("Synthetic control graph required");
        for (let i = 0; i < at; i++) f.act({ kind: "continue" });
        if (repeat) f.act({ kind: "repeat" });
        const correction = f.definition.graph.task.corrections.find((c) =>
          c.eligibleNodeIds.some((id) => id === `${f.taskId}.turn${at}`),
        );
        if (!correction) throw Error("Synthetic Help required");
        f.act({ kind: "help", correctionId: correction.id });
        f.act({ kind: "continue" });
        const gate = f.definition.graph.task.nodes.find(
          (node) =>
            node.kind === "untilFirm" &&
            correction.instructionNodeIds.includes(node.id),
        );
        if (gate?.kind !== "untilFirm")
          throw Error("Synthetic readiness required");
        f.act({ kind: "parentReady", policyId: gate.policyId });
        for (let i = index === 2 ? 13 : 3; i <= at; i++) {
          const v = f.view();
          assert.equal(v.kind, "teaching");
          if (v.kind !== "teaching") throw Error("Synthetic turn required");
          assert.equal(v.turn.id, `${f.taskId}.turn${i}`);
          f.act({ kind: "continue" });
        }
        if (repeat) {
          const v = f.view();
          if (v.kind !== "teaching") throw Error("Owed ordinary required");
          assert.equal(v.turn.id, `${f.taskId}.turn${at}`);
          f.act({ kind: "continue" });
        }
        const v = f.view();
        if (at === (index === 2 ? 23 : 7)) assert.equal(v.kind, "completed");
        else {
          if (v.kind !== "teaching") throw Error("Ordinary successor required");
          assert.equal(v.turn.id, `${f.taskId}.turn${at + 1}`);
        }
      });
test("readiness refuses first and incomplete second cycles and extra practice repeats all fourteen", async () => {
  const f = await fixture(4);
  if (f.definition.kind !== "graphControls")
    throw Error("Synthetic control task required");
  const gate = f.definition.graph.task.nodes.find(
    (node) => node.kind === "untilFirm",
  );
  if (gate?.kind !== "untilFirm") throw Error("Synthetic gate required");
  for (let i = 0; i < 28; i++) {
    assert.throws(() =>
      f.act({ kind: "parentReady", policyId: gate.policyId }),
    );
    f.act({ kind: "continue" });
  }
  const before = f.state;
  if (before.kind !== "graphControls")
    throw Error("Synthetic control state required");
  f.act({ kind: "continue" });
  const occurrenceIds = [];
  for (let i = 14; i < 28; i++) {
    const v = f.view();
    if (v.kind !== "teaching") throw Error("Synthetic extra cycle required");
    assert.equal(v.turn.id, `${f.taskId}.turn${i}`);
    if (!("occurrenceId" in v.turn))
      throw Error("Synthetic occurrence required");
    occurrenceIds.push(v.turn.occurrenceId);
    assert.throws(() =>
      f.act({ kind: "parentReady", policyId: gate.policyId }),
    );
    f.act({ kind: "continue" });
  }
  assert.equal(new Set(occurrenceIds).size, 14);
  assert.ok(
    occurrenceIds.every((id) => !before.acceptedOccurrenceIds.includes(id)),
  );
  f.act({ kind: "back" });
  assert.equal(f.view().kind, "teaching");
  f.act({ kind: "continue" });
  f.act({ kind: "parentReady", policyId: gate.policyId });
  assert.ok(completionProof(f.content, f.state));
});
test("eighth capability preserves every predecessor and all catalog records", async () => {
  const { previous, candidate } = await syntheticLessonSixReadiness();
  const result = await reviewedLessonSixCourseExtension({
    previous,
    candidate,
    hash,
  });
  assert.ok("lessons" in result.body && "lessons" in previous.body);
  assert.equal(result.body.lessons.flatMap((l) => l.tasks).length, 45);
  assert.deepEqual(
    result.body.lessons.slice(0, 5),
    previous.body.lessons.slice(0, 5),
  );
  for (const [li, lesson] of previous.body.lessons.entries())
    for (const [ti] of lesson.tasks.entries()) {
      const changedBody = {
        ...candidate.body,
        lessons: candidate.body.lessons.map((l, index) =>
          index === li
            ? {
                ...l,
                tasks: l.tasks.map((entry, at) =>
                  at === ti
                    ? {
                        ...entry,
                        task: {
                          ...entry.task,
                          title: { kind: "added", text: "Changed predecessor" },
                        },
                      }
                    : entry,
                ),
              }
            : l,
        ),
      };
      const changed = {
        ...candidate,
        body: changedBody,
        packageHash: await hash(canonical(changedBody)),
      };
      await assert.rejects(() =>
        reviewedLessonSixCourseExtension({
          previous,
          candidate: changed,
          hash,
        }),
      );
    }
  const oldBody = {
    ...candidate.body,
    requiredEngineCapabilities:
      candidate.body.requiredEngineCapabilities.filter(
        (c) => c !== "complete-lessons-01-06-v1",
      ),
  };
  const old = {
    ...candidate,
    body: oldBody,
    packageHash: await hash(canonical(oldBody)),
  };
  await assert.rejects(() => parseRuntimePackage(old, hash));
});
test("new reviewed glyph geometry has one digest and preserves old 44 pixel connected contacts", async () => {
  assert.equal(
    await hash(canonical(lessonSixAssetPayload)),
    lessonSixAssetHash,
  );
  assert.equal(connectedRenderingProfile("am").contactSize, 44);
  assert.equal(connectedRenderingProfile("ēm").contactSize, 48);
  assert.equal(connectedRenderingProfile("mē").contactSize, 48);
  assert.ok(
    connectedPointingSvg("mē").includes(
      `viewBox="${lessonSixAssetPayload.diagram.glyphViewBox}"`,
    ),
  );
  const p = printedRenderingProfile(
    lessonSixPrintedBoards["single-s-rhyme-l06"],
  );
  assert.equal(p.rhyme, true);
  assert.equal(p.single.contactSize, 48);
});
for (const board of ["sē", "ēm", "ēs", "ma"] as const)
  test(`new connected Help refuses substituted ${board} support`, async () => {
    const f = await fixture(6);
    if (f.definition.kind !== "graphControls")
      throw Error("Synthetic control task required");
    const task = f.definition.graph.task;
    const changed = {
      ...task,
      nodes: task.nodes.map((node) =>
        node.kind === "turn" &&
        node.route === "support" &&
        node.presentation.kind === "connectedPointing"
          ? { ...node, presentation: { ...node.presentation, board } }
          : node,
      ),
    };
    assert.throws(
      () => compileControlTask(changed),
      /literal first pair|support family/,
    );
  });
test("new connected Help refuses a cross-family owed pair and wrong guided role", async () => {
  const f = await fixture(6);
  if (f.definition.kind !== "graphControls")
    throw Error("Synthetic control task required");
  const task = f.definition.graph.task;
  assert.throws(
    () =>
      compileControlTask({
        ...task,
        nodes: task.nodes.map((node) =>
          node.kind === "turn" &&
          node.presentation.kind === "connectedPointing" &&
          node.presentation.role === "childConnect"
            ? { ...node, presentation: { ...node.presentation, board: "ma" } }
            : node,
        ),
      }),
    /support family/,
  );
  assert.throws(
    () =>
      compileControlTask({
        ...task,
        nodes: task.nodes.map((node) =>
          node.kind === "turn" &&
          node.route === "support" &&
          node.presentation.kind === "connectedPointing"
            ? { ...node, presentation: { ...node.presentation, role: "echo" } }
            : node,
        ),
      }),
    /role|shared voices/,
  );
});
test("new rhyme support refuses mismatched initials and unrelated boards", async () => {
  const f = await fixture(5);
  if (f.definition.kind !== "graphControls")
    throw Error("Synthetic control task required");
  const task = f.definition.graph.task;
  assert.throws(
    () =>
      compileControlTask({
        ...task,
        nodes: task.nodes.map((node) =>
          node.kind === "turn" && node.presentation.kind === "printedBoard"
            ? { ...node, presentation: { ...node.presentation, focus: "m" } }
            : node,
        ),
      }),
    /focus/,
  );
  assert.throws(
    () =>
      compileControlTask({
        ...task,
        nodes: task.nodes.map((node) =>
          node.kind === "turn" && node.presentation.kind === "printedBoard"
            ? {
                ...node,
                presentation: {
                  ...node.presentation,
                  board: reviewedPrintedBoards["single-a"],
                  focus: "a",
                },
              }
            : node,
        ),
      }),
    /reviewed initial/,
  );
});
test("V3 first target statement stays readonly and second target retains sound response", async () => {
  const f = await fixture(7);
  const task = writingTask({ content: f.content.document, taskId: f.taskId });
  if (!task) throw Error("Synthetic writing required");
  assert.deepEqual(
    task.nodes.map((n) => n.presentation.obligation.kind),
    [
      "parentModel",
      "parentInstruction",
      "phaseConfirmation",
      "phaseConfirmation",
      "parentModel",
      "soundResponse",
      "phaseConfirmation",
      "phaseConfirmation",
    ],
  );
  const first = task.targets[0];
  if (!first) throw Error("Synthetic target required");
  assert.equal(
    writingPermission({
      content: f.content.document,
      state: f.state,
      targetId: first.id,
    }).writable,
    true,
  );
  f.act({ kind: "continue" });
  assert.deepEqual(
    writingPermission({
      content: f.content.document,
      state: f.state,
      targetId: first.id,
    }),
    { phase: "parentDemonstration", writable: false },
  );
  f.act({ kind: "back" });
  assert.equal(
    writingPermission({
      content: f.content.document,
      state: f.state,
      targetId: first.id,
    }).writable,
    false,
  );
});
test("separate decision accepts only its gate and three whole extra cycles remain nonaccepting choices", async () => {
  const f = await fixture(4);
  for (let i = 0; i < 28; i++) f.act({ kind: "continue" });
  let view = f.view();
  assert.equal(view.kind, "readiness");
  if (view.kind !== "readiness") throw Error("Real decision required");
  const policyId = view.policyId;
  assert.equal(f.state.kind, "graphControls");
  if (f.state.kind !== "graphControls") throw Error("Control state required");
  assert.equal(f.state.acceptedOccurrenceIds.length, 28);
  assert.equal(
    f.state.acceptedOccurrenceIds.includes(view.occurrenceId),
    false,
  );
  for (let cycle = 0; cycle < 3; cycle++) {
    const before: TeachingState = f.state;
    if (before.kind !== "graphControls") throw Error("Control state required");
    const practice = f.act({ kind: "continue" });
    assert.equal(practice.kind, "navigation");
    const after: TeachingState = f.state;
    if (after.kind !== "graphControls") throw Error("Control state required");
    assert.deepEqual(after.acceptedOccurrenceIds, before.acceptedOccurrenceIds);
    assert.deepEqual(after.cycleOutcomes, before.cycleOutcomes);
    assert.equal(after.occurrences.length, before.occurrences.length + 14);
    assert.equal(after.cycles.length, before.cycles.length + 1);
    validateAcceptanceState({
      content: f.content,
      taskId: f.taskId,
      baseline: before,
      state: after,
    });
    for (let i = 0; i < 14; i++) {
      assert.equal(f.view().kind, "teaching");
      assert.throws(() => f.act({ kind: "parentReady", policyId }));
      f.act({ kind: "continue" });
    }
    assert.equal(f.view().kind, "readiness");
    assert.equal(completionProof(f.content, f.state), null);
  }
  view = f.view();
  if (view.kind !== "readiness") throw Error("Real decision required");
  const before: TeachingState = f.state;
  if (before.kind !== "graphControls") throw Error("Control state required");
  const result = f.act({ kind: "parentReady", policyId: view.policyId });
  assert.equal(result.kind, "completion");
  assert.ok("occurrenceId" in result);
  assert.equal(result.occurrenceId, view.occurrenceId);
  if (f.state.kind !== "graphControls") throw Error("Control state required");
  assert.deepEqual(f.state.acceptedOccurrenceIds, [
    ...before.acceptedOccurrenceIds,
    view.occurrenceId,
  ]);
});
test("historical unaccepted gate cannot bypass partial extra practice or allocate another cycle", async () => {
  const f = await fixture(4);
  for (let i = 0; i < 28; i++) f.act({ kind: "continue" });
  const gate = f.view();
  if (gate.kind !== "readiness") throw Error("Real decision required");
  f.act({ kind: "continue" });
  f.act({ kind: "continue" });
  f.act({ kind: "continue" });
  const partial = f.state;
  if (partial.kind !== "graphControls") throw Error("Control state required");
  for (let i = 0; i < 3; i++) f.act({ kind: "back" });
  assert.equal(f.view().kind, "readiness");
  const historical = f.state;
  for (const action of [
    { kind: "parentReady", policyId: gate.policyId },
    { kind: "repeat" },
  ] as const) {
    assert.throws(() => f.act(action));
    assert.deepEqual(f.state, historical);
  }
  for (let i = 0; i < 3; i++) {
    const result = f.act({ kind: "continue" });
    assert.equal(result.kind, "navigation");
  }
  assert.deepEqual(f.state, partial);
  assert.equal(f.view().kind, "teaching");
});
test("Repeat final response retains the owed ordinary response before a separate decision", async () => {
  const f = await fixture(4);
  for (let i = 0; i < 27; i++) f.act({ kind: "continue" });
  const before = f.view();
  if (before.kind !== "teaching") throw Error("Final response required");
  f.act({ kind: "repeat" });
  const repeated = f.view();
  if (repeated.kind !== "teaching")
    throw Error("Repeated final response required");
  assert.equal(repeated.turn.id, before.turn.id);
  f.act({ kind: "continue" });
  const owed = f.view();
  if (owed.kind !== "teaching") throw Error("Owed final response required");
  assert.equal(owed.turn.id, before.turn.id);
  if (!("checkpointId" in before.turn) || !("checkpointId" in owed.turn))
    throw Error("Bound checkpoints required");
  assert.deepEqual(owed, {
    ...before,
    turn: { ...before.turn, checkpointId: owed.turn.checkpointId },
  });
  f.act({ kind: "continue" });
  assert.equal(f.view().kind, "readiness");
  assert.equal(completionProof(f.content, f.state), null);
});
test("practice registries require an introducing edge and immutable navigation baseline", async () => {
  const f = await fixture(4);
  for (let i = 0; i < 28; i++) f.act({ kind: "continue" });
  const gate = f.state;
  if (gate.kind !== "graphControls") throw Error("Control state required");
  f.act({ kind: "continue" });
  const practice = f.state;
  if (practice.kind !== "graphControls") throw Error("Control state required");
  validateAcceptanceState({
    content: f.content,
    taskId: f.taskId,
    baseline: gate,
    state: practice,
  });
  const orphan = {
    ...practice,
    checkpoints: gate.checkpoints,
    checkpointIndex: gate.checkpointIndex,
    nextCheckpointNumber: gate.nextCheckpointNumber,
  };
  assert.throws(
    () => validatePosition(f.content, orphan),
    /introducing history/,
  );
  const wrong = {
    ...practice,
    checkpoints: practice.checkpoints.map((cp, i) =>
      i === practice.checkpoints.length - 1 &&
      cp.occurrenceId !== null &&
      cp.context.kind === "delivering"
        ? {
            ...cp,
            context: {
              ...cp.context,
              resume: {
                ...cp.context.resume,
                flow: {
                  kind: "review" as const,
                  queueId: parseId({ kind: "queue", value: "forged.queue" }),
                  index: 0,
                },
              },
            },
          }
        : cp,
    ),
  };
  assert.throws(() => validatePosition(f.content, wrong));
  assert.throws(() =>
    validateAcceptanceState({
      content: f.content,
      taskId: f.taskId,
      baseline: practice,
      state: gate,
    }),
  );
});
