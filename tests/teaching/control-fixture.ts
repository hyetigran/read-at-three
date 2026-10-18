import { installedFixture } from "../installed-fixture.ts";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  initialState,
  parseDevelopmentPackage,
  parseTeachingState,
  project,
  evaluateGraph,
  taskDefinition,
  completionProof,
} from "../../packages/teaching/src/index.ts";
import type {
  ControlTeachingState,
  GraphAction,
} from "../../packages/teaching/src/index.ts";
export const controlHash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
export async function controlFixture(number = 2) {
  const content = await parseDevelopmentPackage(
    JSON.parse(
      await readFile("tests/fixtures/oral-development-package.json", "utf8"),
    ),
    controlHash,
  );
  if (content.body.coverage !== "lesson1-sounds-oral-complete")
    throw new Error("Cumulative fixture missing");
  const taskId = content.body.tasks.find((t) => t.task.number === number)?.task
    .id;
  if (!taskId) throw new Error("Synthetic task missing");
  const entry = taskDefinition({ content, taskId });
  if (entry.kind !== "graphControls")
    throw new Error("Synthetic oral graph missing");
  const installed = await installedFixture(content, controlHash);
  const initial = initialState(installed, taskId);
  if (initial.kind !== "graphControls")
    throw new Error("Synthetic oral state missing");
  let state = initial;
  function act(action: GraphAction) {
    const before = state;
    const plan = evaluateGraph({
      content: installed,
      state,
      status: completionProof(installed, state) ? "completed" : "inProgress",
      action,
    });
    if (plan.after.kind !== "graphControls")
      throw new Error("State variant changed");
    state = plan.after;
    return { before, plan };
  }
  function view() {
    return project(installed, state);
  }
  return {
    content,
    installed,
    task: entry.graph.task,
    graph: entry.graph,
    taskId,
    act,
    view,
    get state() {
      return state;
    },
    set state(value: ControlTeachingState) {
      state = value;
    },
    roundTrip() {
      const restored = parseTeachingState(JSON.parse(JSON.stringify(state)));
      if (restored.kind !== "graphControls")
        throw new Error("Bad restored variant");
      state = restored;
      return view();
    },
  };
}
