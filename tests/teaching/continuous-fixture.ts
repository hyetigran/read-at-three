import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  completionProof,
  currentCheckpoint,
  evaluateGraph,
  initialState,
  parseDevelopmentPackage,
  parseTeachingState,
  project,
  taskDefinition,
  validateAcceptanceTransition,
  validatePosition,
} from "../../packages/teaching/src/index.ts";
import { controlActions } from "../../packages/teaching/src/control-engine.ts";
import type {
  ControlTeachingState,
  GraphAction,
} from "../../packages/teaching/src/index.ts";
export const continuousHash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
export async function continuousFixture() {
  const content = await parseDevelopmentPackage(
    JSON.parse(
      await readFile(
        "tests/fixtures/continuous-development-package.json",
        "utf8",
      ),
    ),
    continuousHash,
  );
  if (content.body.coverage !== "lesson1-sounds-oral-complete")
    throw new Error("Continuous fixture missing");
  const selectedId = content.body.tasks.find((entry) => entry.task.number === 3)
    ?.task.id;
  if (!selectedId) throw new Error("Continuous fixture task missing");
  const entry = taskDefinition({ content, taskId: selectedId });
  const initial = initialState(content, selectedId);
  if (entry.kind !== "graphControls" || initial.kind !== "graphControls")
    throw new Error("Continuous fixture variant missing");
  const taskId = entry.graph.task.id;
  let state = initial;
  function view() {
    return project(content, state);
  }
  function actions() {
    return controlActions({
      content,
      state,
      status: completionProof(content, state) ? "completed" : "inProgress",
    });
  }
  function act(action: GraphAction) {
    const before = state;
    const plan = evaluateGraph({
      content,
      state,
      status: completionProof(content, state) ? "completed" : "inProgress",
      action,
    });
    if (plan.after.kind !== "graphControls")
      throw new Error("Continuous state variant changed");
    if (plan.kind === "acceptance" || plan.kind === "completion")
      validateAcceptanceTransition({
        content,
        taskId,
        before,
        after: plan.after,
        occurrenceId: plan.occurrenceId,
        action,
      });
    state = plan.after;
    return plan;
  }
  function decision() {
    const action = actions().find(
      (action) => action.intent.kind === "parentReady",
    )?.intent;
    return action?.kind === "parentReady"
      ? action
      : ({ kind: "continue" } satisfies GraphAction);
  }
  function current() {
    const p = view();
    if (p.kind !== "teaching" || !("kind" in p.turn) || p.turn.kind !== "turn")
      throw new Error("Continuous source turn missing");
    return p.turn;
  }
  return {
    content,
    taskId,
    task: entry.graph.task,
    graph: entry.graph,
    act,
    actions,
    decision,
    view,
    current,
    get state() {
      return state;
    },
    set state(value: ControlTeachingState) {
      state = value;
    },
    checkpoint() {
      return currentCheckpoint(state);
    },
    roundTrip() {
      const restored = parseTeachingState(JSON.parse(JSON.stringify(state)));
      validatePosition(content, restored, taskId);
      if (restored.kind !== "graphControls")
        throw new Error("Continuous restore changed variant");
      state = restored;
      return view();
    },
  };
}
