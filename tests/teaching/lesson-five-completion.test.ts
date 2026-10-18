import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  completionProof,
  evaluateGraph,
  initialState,
  parseTeachingState,
  parseRuntimePackage,
  project,
  taskDefinition,
  writingPermission,
  writingTask,
  compileWritingTask,
  compileWritingPlan,
} from "@readatthree/teaching";
import type { GraphAction } from "@readatthree/teaching";
import { syntheticLessonFiveCompletion } from "../lesson-five-completion-fixture.ts";
import { hash } from "../lesson-two-fixture.ts";

async function fixture(index: number) {
  const { content, taskIds } = await syntheticLessonFiveCompletion();
  const taskId = taskIds[index];
  if (!taskId) throw Error("Synthetic task required");
  const initial = initialState(content, taskId);
  if (initial.kind !== "graphControls")
    throw Error("Synthetic control state required");
  let state = initial;
  const definition = taskDefinition({ content, taskId });
  if (definition.kind !== "graphControls")
    throw Error("Synthetic control graph required");
  return {
    content,
    taskId,
    task: definition.graph.task,
    get state() {
      return state;
    },
    act(action: GraphAction) {
      const result = evaluateGraph({
        content,
        state,
        status: completionProof(content, state) ? "completed" : "inProgress",
        action,
      });
      const next = parseTeachingState(JSON.parse(JSON.stringify(result.after)));
      if (next.kind !== "graphControls")
        throw Error("Synthetic control state required");
      state = next;
      return result;
    },
    view() {
      return project(content, state);
    },
  };
}
for (const [index, count] of [18, 8].entries())
  test(`final task ${index + 7} keeps every required occurrence`, async () => {
    const f = await fixture(index);
    for (let i = 0; i < count; i++) {
      const v = f.view();
      assert.equal(v.kind, "teaching");
      assert.equal(completionProof(f.content, f.state), null);
      f.act({ kind: "continue" });
    }
    assert.ok(completionProof(f.content, f.state));
    assert.equal(f.state.acceptedOccurrenceIds.length, count);
  });
for (const index of [0, 1])
  for (const repeated of [false, true])
    for (const at of index === 0 ? [10, 11, 13, 14, 16, 17] : [3, 7])
      test(`task ${index + 7} Help at ${at} in ${repeated ? "Repeat" : "ordinary"} preserves the retest and ordinary successor`, async () => {
        const f = await fixture(index);
        for (let i = 0; i < at; i++) f.act({ kind: "continue" });
        if (repeated) f.act({ kind: "repeat" });
        const before = f.state.acceptedOccurrenceIds.length;
        const view = f.view();
        assert.equal(view.kind, "teaching");
        if (view.kind !== "teaching")
          throw Error("Synthetic response required");
        const correction = f.task.corrections.find((item) =>
          item.eligibleNodeIds.includes(view.turn.id),
        );
        assert.ok(correction);
        f.act({ kind: "help", correctionId: correction.id });
        f.act({ kind: "continue" });
        const gate = f.task.nodes.find(
          (node) =>
            node.kind === "untilFirm" &&
            correction.instructionNodeIds.includes(node.id),
        );
        assert.ok(gate?.kind === "untilFirm");
        f.act({ kind: "parentReady", policyId: gate.policyId });
        const prefix = at - (index === 0 ? 10 : 3) + 1;
        for (let i = 0; i < prefix; i++) {
          const turn = f.view();
          assert.equal(turn.kind, "teaching");
          if (turn.kind !== "teaching")
            throw Error("Synthetic retest required");
          assert.equal(
            turn.turn.id,
            `${f.taskId}.turn${(index === 0 ? 10 : 3) + i}`,
          );
          f.act({ kind: "continue" });
        }
        const afterRetest = f.state.acceptedOccurrenceIds.length;
        assert.ok(afterRetest > before);
        if (repeated) {
          const ordinary = f.view();
          assert.equal(ordinary.kind, "teaching");
          if (ordinary.kind !== "teaching")
            throw Error("Synthetic ordinary required");
          assert.equal(ordinary.turn.id, `${f.taskId}.turn${at}`);
          f.act({ kind: "continue" });
          assert.equal(f.state.acceptedOccurrenceIds.length, afterRetest + 1);
        }
      });
test("V3 statement stays on the readonly model phase and never invents a child response", async () => {
  const f = await fixture(2);
  const task = writingTask({ content: f.content, taskId: f.taskId });
  assert.ok(task);
  assert.deepEqual(
    task.nodes.map((node) => node.presentation.obligation.kind),
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
  assert.ok(first);
  assert.deepEqual(
    writingPermission({
      content: f.content,
      state: f.state,
      targetId: first.id,
    }),
    { phase: "parentDemonstration", writable: true },
  );
  f.act({ kind: "continue" });
  assert.deepEqual(
    writingPermission({
      content: f.content,
      state: f.state,
      targetId: first.id,
    }),
    { phase: "parentDemonstration", writable: false },
  );
  f.act({ kind: "back" });
  assert.equal(
    writingPermission({
      content: f.content,
      state: f.state,
      targetId: first.id,
    }).writable,
    false,
  );
  f.act({ kind: "continue" });
  f.act({ kind: "continue" });
  assert.deepEqual(
    writingPermission({
      content: f.content,
      state: f.state,
      targetId: first.id,
    }),
    { phase: "childTracing", writable: true },
  );
  assert.throws(() => compileWritingTask(task), /Legacy|seven source turns/);
});
test("seventh capability is explicit and all predecessor definitions remain exact", async () => {
  const { previous, candidate, content } =
    await syntheticLessonFiveCompletion();
  assert.ok("lessons" in previous.body && "lessons" in content.body);
  assert.equal(
    content.body.lessons.flatMap((lesson) => lesson.tasks).length,
    37,
  );
  for (const [i, lesson] of previous.body.lessons.entries())
    assert.deepEqual(
      content.body.lessons[i]?.tasks.slice(0, lesson.tasks.length),
      lesson.tasks,
    );
  const old = {
    ...candidate,
    body: {
      ...candidate.body,
      requiredEngineCapabilities:
        candidate.body.requiredEngineCapabilities.slice(0, -1),
    },
  };
  old.packageHash = await hash(canonical(old.body));
  await assert.rejects(() => parseRuntimePackage(old, hash));
});

test("same-object plan caches cannot cross the V2 and V3 obligation boundary in either order", async () => {
  const { content } = await syntheticLessonFiveCompletion();
  assert.ok("lessons" in content.body);
  const entry = content.body.lessons[4]?.tasks.find(
    (item) => item.kind === "writingPracticePlanV3",
  );
  assert.ok(entry?.kind === "writingPracticePlanV3");
  const v3 = structuredClone(entry.task);
  compileWritingPlan(v3);
  const v2Content = await parseRuntimePackage(
    await (await import("../lesson-two-fixture.ts")).syntheticPlanEnvelope(),
    hash,
  );
  assert.ok("lessons" in v2Content.body);
  const old = v2Content.body.lessons[0]?.tasks.find(
    (item) => item.kind === "writingPracticePlanV2",
  );
  assert.ok(old?.kind === "writingPracticePlanV2");
  const mutableV2 = structuredClone(old.task);
  compileWritingPlan(mutableV2);
  const identification = v3.targets[0].identification;
  Reflect.deleteProperty(v3.targets[0], "identification");
  Object.assign(v3.targets[0], { sound: mutableV2.targets[0].sound });
  assert.throws(() => compileWritingPlan(v3), /Writing source order invalid/);
  Object.assign(mutableV2.targets[0], { identification });
  assert.throws(
    () => compileWritingPlan(mutableV2),
    /Writing source order invalid/,
  );
});
