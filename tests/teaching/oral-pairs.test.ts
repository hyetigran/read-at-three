import assert from "node:assert/strict";
import { test } from "node:test";
import {
  initialState,
  evaluateGraph,
  project,
  completionProof,
  parseTeachingState,
  validatePosition,
  taskDefinition,
} from "@readatthree/teaching";
import type { GraphAction } from "@readatthree/teaching";
import { syntheticOralPairsCourse } from "../oral-pairs-fixture.ts";

test("normal multi-response cycles preserve their bound identity through initial and optional groups", async () => {
  const { content, task5Id } = await syntheticOralPairsCourse();
  const initial = initialState(content, task5Id);
  if (initial.kind !== "graphControls")
    throw new Error("Control state required");
  let state = initial;
  function act(action: GraphAction) {
    const after = evaluateGraph({
      content,
      state,
      status: completionProof(content, state) ? "completed" : "inProgress",
      action,
    }).after;
    const restored = parseTeachingState(JSON.parse(JSON.stringify(after)));
    if (restored.kind !== "graphControls")
      throw new Error("Control state required");
    state = restored;
    validatePosition(content, state, task5Id);
  }
  function due(index: number) {
    const view = project(content, state);
    assert.equal(view.kind, "teaching");
    if (view.kind !== "teaching") throw new Error("Response required");
    assert.equal(
      view.turn.id,
      `fixture.oral.t5.${index < 8 ? "initial" : "replay"}.${index}`,
    );
    assert.ok("occurrenceId" in view.turn);
    return view.turn.occurrenceId;
  }
  for (let i = 0; i < 13; i++) {
    due(i);
    act({ kind: "continue" });
  }
  const previous = new Set([due(13)]);
  for (let cycle = 0; cycle < 2; cycle++) {
    act({ kind: "continue" });
    for (let i = 8; i < 14; i++) {
      const id = due(i);
      assert.equal(previous.has(id), false);
      previous.add(id);
      if (i < 13) act({ kind: "continue" });
    }
  }
  const entry = taskDefinition({ content, taskId: task5Id });
  if (entry.kind !== "graphControls")
    throw new Error("Control definition required");
  const policy = [...entry.graph.policies.keys()][0];
  assert.ok(policy);
  act({ kind: "parentReady", policyId: policy });
  assert.equal(project(content, state).kind, "completed");
  assert.ok(completionProof(content, state));
});
