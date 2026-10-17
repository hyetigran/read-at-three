import { canonical } from "./identity.ts";
import { compileControlTask } from "./control-content.ts";
import type {
  ControlTask,
  ControlTeachingState,
  DevelopmentPackage,
  InkLayer,
  TaskId,
  TeachingState,
  WritingPhase,
  WritingTask,
} from "./types.ts";

const cache = new WeakMap<WritingTask, ReturnType<typeof compileControlTask>>();
export function compileWritingTask(task: WritingTask) {
  const cached = cache.get(task);
  if (cached) return cached;
  if (
    task.targets.length !== 2 ||
    new Set(task.targets.map((t) => t.id)).size !== 2 ||
    task.nodes.length !== 7
  )
    throw new Error("Writing requires two targets and seven source turns");
  const [first, second] = task.targets;
  if (!first || !second) throw new Error("Writing targets missing");
  const expected = [
    [first.id, "soundResponse", null],
    [first.id, "modelAndSound", null],
    [first.id, "phaseConfirmation", "childTracing"],
    [first.id, "phaseConfirmation", "childIndependentWriting"],
    [second.id, "modelAndSound", null],
    [second.id, "phaseConfirmation", "childTracing"],
    [second.id, "phaseConfirmation", "childIndependentWriting"],
  ];
  for (const target of task.targets) {
    const { top, midline, baseline } = target.guides;
    if (
      target.sourceRefs.length === 0 ||
      ![
        target.logicalWidth,
        target.logicalHeight,
        top,
        midline,
        baseline,
        target.boardY,
      ].every(Number.isFinite) ||
      target.logicalWidth <= 0 ||
      target.logicalHeight <= 0 ||
      top < 0 ||
      !(top < midline && midline < baseline) ||
      baseline > target.logicalHeight ||
      target.boardY < 0
    )
      throw new Error("Invalid source writing geometry");
  }
  if (second.boardY < first.boardY + first.logicalHeight)
    throw new Error("Writing rows overlap");
  for (const [i, node] of task.nodes.entries()) {
    const obligation = node.presentation.obligation;
    if (
      canonical([
        node.presentation.targetId,
        obligation.kind,
        obligation.kind === "phaseConfirmation" ? obligation.phase : null,
      ]) !== canonical(expected[i]) ||
      node.route !== "normal" ||
      node.parentRole !==
        (obligation.kind === "modelAndSound" ? "model" : "listen") ||
      node.presentation.kind !== "writing" ||
      node.next.kind !== (i === 6 ? "end" : "node") ||
      (node.next.kind === "node" && node.next.nodeId !== task.nodes[i + 1]?.id)
    )
      throw new Error("Writing source order invalid");
    if (
      obligation.kind === "phaseConfirmation" &&
      canonical(obligation.practice) !==
        canonical({
          minimum: obligation.phase === "childTracing" ? 2 : 3,
          maximum: obligation.phase === "childTracing" ? 3 : 5,
          allowMore: true,
        })
    )
      throw new Error("Writing practice range invalid");
  }
  const compiled: ControlTask = {
    id: task.id,
    number: task.number,
    title: task.title,
    startNodeId: task.startNodeId,
    nodes: task.nodes.map((node) => ({ ...node, itemId: null })),
    corrections: [],
  };
  const result = compileControlTask(compiled);
  cache.set(task, result);
  return result;
}
export function writingTask({
  content,
  taskId,
}: {
  content: DevelopmentPackage;
  taskId: TaskId;
}): WritingTask | null {
  if (content.body.coverage !== "lesson1-complete") return null;
  const entry = content.body.tasks.find((entry) => entry.task.id === taskId);
  return entry?.kind === "soundWritingV1" ? entry.task : null;
}
export function writingState(
  state: TeachingState,
): ControlTeachingState | null {
  return state.kind === "writingSkipped"
    ? state.last
    : state.kind === "graphControls"
      ? state
      : null;
}
export function writingPermission({
  content,
  state,
  targetId,
}: {
  content: DevelopmentPackage;
  state: TeachingState;
  targetId: WritingTask["targets"][number]["id"];
}): { phase: WritingPhase; writable: boolean } {
  const current = writingState(state);
  if (!current) throw new Error("Writing state missing");
  const task = writingTask({ content, taskId: current.taskId });
  if (!task) throw new Error("Writing task missing");
  const frontier = task.nodes.find((node) => {
    const occurrence = current.occurrences.find(
      (o) =>
        o.obligation === "required" &&
        o.target.kind === "node" &&
        o.target.nodeId === node.id,
    );
    return occurrence && !current.acceptedOccurrenceIds.includes(occurrence.id);
  });
  const targetTurns = task.nodes.filter(
    (n) => n.presentation.targetId === targetId,
  );
  const lastAccepted = targetTurns
    .filter((n) =>
      current.occurrences.some(
        (o) =>
          o.obligation === "required" &&
          o.target.kind === "node" &&
          o.target.nodeId === n.id &&
          current.acceptedOccurrenceIds.includes(o.id),
      ),
    )
    .at(-1);
  const active =
    frontier?.presentation.targetId === targetId ? frontier : lastAccepted;
  const obligation = active?.presentation.obligation;
  const phase =
    obligation?.kind === "phaseConfirmation"
      ? obligation.phase
      : "parentDemonstration";
  const cp = current.checkpoints[current.checkpointIndex];
  const shownOccurrence = current.occurrences.find(
    (o) => o.id === cp?.occurrenceId,
  );
  const shownNodeId =
    shownOccurrence?.target.kind === "node"
      ? shownOccurrence.target.nodeId
      : null;
  return {
    phase,
    writable:
      shownOccurrence !== undefined &&
      !current.acceptedOccurrenceIds.includes(shownOccurrence.id) &&
      shownNodeId === frontier?.id &&
      state.kind !== "writingSkipped" &&
      frontier?.presentation.targetId === targetId &&
      frontier.presentation.obligation.kind !== "soundResponse",
  };
}
export function layerForPhase(phase: WritingPhase): InkLayer {
  switch (phase) {
    case "parentDemonstration":
      return "model";
    case "childTracing":
      return "tracing";
    case "childIndependentWriting":
      return "independent";
  }
}
