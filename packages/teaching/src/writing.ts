import { requirePlainGuidance } from "./guidance.ts";
import { resolvedTask } from "./course-content.ts";
import type { RuntimePackage } from "./course-content.ts";
import { canonical, parseId } from "./identity.ts";
import { compileControlTask } from "./control-content.ts";
import type {
  ControlTask,
  ControlTeachingState,
  InkLayer,
  TaskId,
  TeachingState,
  WritingPhase,
  WritingTask,
  WritingPracticePlan,
  WritingPracticePlanV3,
  WritingScript,
  WritingNode,
} from "./types.ts";

const planCache = new WeakMap<
  WritingPracticePlan | WritingPracticePlanV3,
  WritingTask
>();
function joinScripts(scripts: readonly WritingScript[]): WritingScript {
  return {
    sourceRefs: [...new Set(scripts.flatMap((script) => script.sourceRefs))],
    guidance: scripts.flatMap((script) => script.guidance),
  };
}
function lowerPlan(
  plan: WritingPracticePlan | WritingPracticePlanV3,
): WritingTask {
  const version = "identification" in plan.targets[0] ? 3 : 2;
  const cached = planCache.get(plan);
  if (cached) return cached;
  if (plan.targets.length !== 2)
    throw new Error("Writing requires two targets");
  const turns = plan.targets.flatMap((practice, index) => {
    for (const phase of [practice.tracing, practice.independent]) {
      const prescription = phase.practice;
      if (!phase.instruction.sourceRefs.includes(prescription.sourceRef))
        throw new Error("Practice source missing");
      if (
        prescription.kind === "range" &&
        (!Number.isInteger(prescription.minimum) ||
          !Number.isInteger(prescription.maximum) ||
          prescription.minimum < 1 ||
          prescription.maximum < prescription.minimum)
      )
        throw new Error("Practice range invalid");
      if (
        prescription.kind === "qualitative" &&
        prescription.instruction.kind !== "added" &&
        !phase.instruction.sourceRefs.includes(
          prescription.instruction.sourceRef,
        )
      )
        throw new Error("Practice instruction source missing");
    }
    const identification =
      "identification" in practice
        ? practice.identification
        : ({ kind: "soundResponse", sound: practice.sound } as const);
    const base = { targetId: practice.target.id };
    return [
      {
        ...base,
        slot: "demonstrate",
        parentRole: "model",
        script: joinScripts(
          index === 0
            ? [plan.introduction, practice.demonstration]
            : [practice.demonstration],
        ),
        obligation: { kind: "parentModel" },
      },
      {
        ...base,
        slot: "respond",
        parentRole:
          identification.kind === "parentInstruction" ? "model" : "listen",
        script:
          identification.kind === "parentInstruction"
            ? identification.script
            : joinScripts([
                identification.sound.prompt,
                identification.sound.expected,
              ]),
        obligation: { kind: identification.kind },
      },
      {
        ...base,
        slot: "trace",
        parentRole: "listen",
        script: joinScripts([
          ...(identification.kind === "soundResponse"
            ? [identification.sound.affirmation]
            : []),
          practice.tracing.instruction,
          practice.tracing.praise,
        ]),
        obligation: {
          kind: "phaseConfirmation",
          phase: "childTracing",
          practice: practice.tracing.practice,
        },
      },
      {
        ...base,
        slot: "independent",
        parentRole: "listen",
        script: joinScripts([
          practice.independent.instruction,
          practice.independent.praise,
        ]),
        obligation: {
          kind: "phaseConfirmation",
          phase: "childIndependentWriting",
          practice: practice.independent.practice,
        },
      },
    ] satisfies readonly Readonly<{
      targetId: WritingNode["presentation"]["targetId"];
      slot: string;
      parentRole: WritingNode["parentRole"];
      script: WritingScript;
      obligation: WritingNode["presentation"]["obligation"];
    }>[];
  });
  const nodeId = (index: number) => {
    const turn = turns[index];
    if (!turn) throw new Error("Writing turn missing");
    return parseId({
      kind: "node",
      value: `${plan.id}.${turn.targetId}.${turn.slot}`,
    });
  };
  const result: WritingTask = {
    id: plan.id,
    number: plan.number,
    title: plan.title,
    optional: true,
    startNodeId: nodeId(0),
    targets: plan.targets.map((practice) => practice.target),
    nodes: turns.map((turn, index) => ({
      id: nodeId(index),
      ...turn.script,
      kind: "turn",
      route: "normal",
      parentRole: turn.parentRole,
      presentation: {
        kind: "writing",
        targetId: turn.targetId,
        obligation: turn.obligation,
      },
      next:
        index === turns.length - 1
          ? { kind: "end" }
          : { kind: "node", nodeId: nodeId(index + 1) },
    })),
  };
  compileTaskVersion(result, version);
  planCache.set(plan, result);
  return result;
}
export function compileWritingPlan(
  plan: WritingPracticePlan | WritingPracticePlanV3,
) {
  return compileTaskVersion(
    lowerPlan(plan),
    "identification" in plan.targets[0] ? 3 : 2,
  );
}

const caches = {
  1: new WeakMap<WritingTask, ReturnType<typeof compileControlTask>>(),
  2: new WeakMap<WritingTask, ReturnType<typeof compileControlTask>>(),
  3: new WeakMap<WritingTask, ReturnType<typeof compileControlTask>>(),
};
export function compileWritingTask(task: WritingTask) {
  return compileTaskVersion(task, 1);
}
function compileTaskVersion(task: WritingTask, version: 1 | 2 | 3) {
  const cache = caches[version];
  if (version === 1)
    for (const node of task.nodes)
      for (const span of node.guidance) requirePlainGuidance(span);
  const cached = cache.get(task);
  if (
    task.targets.length !== 2 ||
    new Set(task.targets.map((t) => t.id)).size !== 2 ||
    task.nodes.length !== (version === 1 ? 7 : 8)
  )
    throw new Error("Writing requires two targets and seven source turns");
  if (cached) return cached;
  const [first, second] = task.targets;
  if (!first || !second) throw new Error("Writing targets missing");
  const expected =
    version !== 1
      ? task.targets.flatMap((target, index) => [
          [target.id, "parentModel", null],
          [
            target.id,
            version === 3 && index === 0
              ? "parentInstruction"
              : "soundResponse",
            null,
          ],
          [target.id, "phaseConfirmation", "childTracing"],
          [target.id, "phaseConfirmation", "childIndependentWriting"],
        ])
      : [
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
        (obligation.kind === "modelAndSound" ||
        obligation.kind === "parentModel" ||
        obligation.kind === "parentInstruction"
          ? "model"
          : "listen") ||
      node.presentation.kind !== "writing" ||
      node.next.kind !== (i === task.nodes.length - 1 ? "end" : "node") ||
      (node.next.kind === "node" && node.next.nodeId !== task.nodes[i + 1]?.id)
    )
      throw new Error("Writing source order invalid");
    if (
      obligation.kind === "phaseConfirmation" &&
      version === 1 &&
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
  content: RuntimePackage;
  taskId: TaskId;
}): WritingTask | null {
  const entry = resolvedTask({ content, taskId })?.entry;
  return entry?.kind === "soundWritingV1"
    ? entry.task
    : entry?.kind === "writingPracticePlanV2" ||
        entry?.kind === "writingPracticePlanV3"
      ? lowerPlan(entry.task)
      : null;
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
  content: RuntimePackage;
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
      frontier.presentation.obligation.kind !== "soundResponse" &&
      frontier.presentation.obligation.kind !== "parentInstruction",
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
