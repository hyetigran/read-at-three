import {
  canonical,
  parseRuntimePackage,
  reviewedPrintedBoards,
} from "@readatthree/teaching";
import type {
  BoardNode,
  ControlNode,
  Destination,
  MixedTask,
  Serialized,
} from "@readatthree/teaching";
import { syntheticConnectedCourse } from "./connected-pointing-fixture.ts";
import { hash, syntheticWritingPlan } from "./lesson-two-fixture.ts";

export async function syntheticLessonFourCourse() {
  const { content: previous } = await syntheticConnectedCourse();
  if (previous.body.coverage !== "course-development-v4")
    throw Error("Synthetic connected predecessor required");
  const lesson = previous.body.lessons[3];
  const predecessorLesson = previous.body.lessons[2];
  if (!lesson || !predecessorLesson) throw Error("Synthetic catalog required");
  const source = {
    sourceRefs: ["fixture.lesson-four.source"],
    guidance: [
      {
        kind: "action",
        copy: { kind: "added", text: "Synthetic parent instruction" },
      },
    ],
  } as const;
  function metadata(number: number) {
    const task = lesson?.lessonTasks[number - 1];
    if (!task) throw Error("Synthetic task missing");
    return task;
  }
  function link<N extends { id: string; next: Serialized<Destination> }>(
    nodes: N[],
  ): N[] {
    return nodes.map((node, index) => {
      const next = nodes[index + 1];
      return {
        ...node,
        next: next ? { kind: "node", nodeId: next.id } : { kind: "end" },
      };
    });
  }
  function printed(number: 1 | 3): Serialized<MixedTask> {
    const task = metadata(number);
    const registration =
      reviewedPrintedBoards[
        number === 1 ? "vertical-mas" : "two-above-one-sma"
      ];
    const { layout: _layout, targets: _targets, ...board } = registration;
    const nodes: Serialized<BoardNode>[] = (
      number === 1 ? (["m", "a", "s"] as const) : (["s", "m", "a"] as const)
    ).flatMap((glyph) =>
      (number === 1 ? (["slow"] as const) : (["slow", "fast"] as const)).map(
        (speed) => ({
          ...source,
          id: `${task.id}.${glyph}.${speed}`,
          kind: "normal",
          parentRole: "listen",
          presentation: {
            kind: "printedBoard",
            board,
            focus: glyph,
            cue:
              speed === "slow"
                ? { kind: "underSymbolHold", hold: "parentControlled" }
                : { kind: "endpointSweep", preparation: "touchStart" },
          },
          next: { kind: "end" },
        }),
      ),
    );
    const first = nodes[0];
    if (!first) throw Error("Synthetic start missing");
    return {
      kind: "printedGraphV2",
      task: {
        id: task.id,
        number,
        title: task.title,
        startNodeId: first.id,
        nodes: link(nodes),
        corrections: [],
      },
    };
  }
  function oral(number: 2 | 4): Serialized<MixedTask> {
    const task = metadata(number);
    const nodes: Serialized<
      Extract<ControlNode, { kind: "turn" | "untilFirm" }>
    >[] = [];
    for (const cycle of number === 2 ? ["initial"] : ["initial", "replay"])
      for (let i = 1; i <= (number === 2 ? 8 : 10); i++)
        nodes.push({
          ...source,
          id: `${task.id}.${cycle}.${String(i).padStart(2, "0")}`,
          kind: "turn",
          route: "normal",
          parentRole: "listen",
          itemId: `${task.id}.${cycle}.${i}`,
          presentation: { kind: "oral" },
          next: { kind: "end" },
        });
    if (number === 4)
      nodes.push({
        ...source,
        id: `${task.id}.firm`,
        kind: "untilFirm",
        policyId: `${task.id}.whole-replay`,
        cycleEntryNodeId: `${task.id}.replay.01`,
        cycleExitNodeId: `${task.id}.replay.10`,
        next: { kind: "end" },
      });
    const first = nodes[0];
    if (!first) throw Error("Synthetic start missing");
    return {
      kind: "graphControls",
      task: {
        id: task.id,
        number,
        title: task.title,
        startNodeId: first.id,
        nodes: link(nodes),
        corrections: [],
      },
    };
  }
  function pointing(number: 5 | 6): Serialized<MixedTask> {
    const task = metadata(number);
    const template = predecessorLesson?.tasks.find(
      (entry) => entry.task.number === (number === 5 ? 7 : 6),
    );
    if (template?.kind !== "graphControls")
      throw Error("Synthetic pointing template missing");
    const rename = (id: string) => id.replace(template.task.id, task.id);
    const nodes: Serialized<ControlNode>[] = template.task.nodes
      .filter((node) => !node.id.endsWith(".required-model-repeat"))
      .map((node) => {
        if (node.kind !== "turn" && node.kind !== "untilFirm")
          throw Error("Synthetic template control unsupported");
        const next: Serialized<Destination> =
          node.next.kind === "end"
            ? node.next
            : {
                kind: "node",
                nodeId: rename(
                  node.next.nodeId.endsWith(".required-model-repeat")
                    ? `${template.task.id}.follow`
                    : node.next.nodeId,
                ),
              };
        if (
          node.kind === "turn" &&
          node.presentation.kind === "connectedPointing"
        )
          return {
            ...node,
            id: rename(node.id),
            next,
            itemId: node.itemId === null ? null : rename(node.itemId),
            presentation: {
              ...node.presentation,
              board: number === 5 ? "ma" : "sa",
            },
          };
        if (node.kind === "untilFirm")
          return {
            ...node,
            id: rename(node.id),
            next,
            policyId: rename(node.policyId),
            cycleEntryNodeId: rename(node.cycleEntryNodeId),
            cycleExitNodeId: rename(node.cycleExitNodeId),
          };
        throw Error("Synthetic connected template has an unexpected control");
      });
    const corrections = template.task.corrections.map((c) => ({
      ...c,
      id: rename(c.id),
      eligibleNodeIds: c.eligibleNodeIds.map(rename),
      instructionNodeIds: c.instructionNodeIds.map(rename),
      retestNodeIds: c.retestNodeIds.map(rename),
    }));
    return {
      kind: "graphControls",
      task: {
        id: task.id,
        number,
        title: task.title,
        startNodeId: rename(template.task.startNodeId),
        nodes,
        corrections,
      },
    };
  }
  const writingMetadata = metadata(7),
    plan = syntheticWritingPlan();
  const writing = {
    kind: "writingPracticePlanV2",
    task: {
      ...plan,
      id: writingMetadata.id,
      number: 7,
      title: writingMetadata.title,
      targets: plan.targets.map((target, i) => ({
        ...target,
        target: {
          ...target.target,
          id: `${writingMetadata.id}.${i === 0 ? "s" : "a"}`,
        },
        sound: {
          ...target.sound,
          affirmation: { sourceRefs: [], guidance: [] },
        },
        tracing: {
          ...target.tracing,
          praise: { sourceRefs: [], guidance: [] },
        },
      })),
    },
  } as const;
  const body = {
    ...previous.body,
    requiredEngineCapabilities: [
      ...previous.body.requiredEngineCapabilities,
      "reviewed-board-layouts-l04-v1",
    ],
    releaseId: "fixture.lesson-four.release",
    lessons: previous.body.lessons.map((l, i) =>
      i === 3
        ? {
            ...l,
            tasks: [
              printed(1),
              oral(2),
              printed(3),
              oral(4),
              pointing(5),
              pointing(6),
              writing,
            ],
          }
        : l,
    ),
  };
  const envelope = {
    formatVersion: 1,
    body,
    packageHash: await hash(canonical(body)),
  };
  return {
    previous,
    envelope,
    content: await parseRuntimePackage(envelope, hash),
    taskIds: lesson.lessonTasks.map((task) => task.id),
  };
}
