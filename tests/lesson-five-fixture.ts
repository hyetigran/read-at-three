import {
  canonical,
  parseRuntimePackage,
  reviewedPrintedBoards,
  parseId,
} from "@readatthree/teaching";
import type {
  BoardNode,
  ControlNode,
  Destination,
  MixedTask,
  Serialized,
} from "@readatthree/teaching";
import { syntheticLessonFourCourse } from "./lesson-four-fixture.ts";
import { hash } from "./lesson-two-fixture.ts";

export async function syntheticLessonFiveCourse() {
  const { content: previous } = await syntheticLessonFourCourse();
  if (previous.body.coverage !== "course-development-v4")
    throw Error("Synthetic predecessor required");
  const lesson = previous.body.lessons[4];
  if (!lesson) throw Error("Synthetic lesson required");
  const source = {
    sourceRefs: ["fixture.lesson-five.source"],
    guidance: [
      {
        kind: "action",
        copy: { kind: "added", text: "Synthetic parent guidance" },
      },
    ],
  } as const;
  function metadata(number: number) {
    const item = lesson?.lessonTasks[number - 1];
    if (!item) throw Error("Synthetic task required");
    return item;
  }
  function board(
    key: "single-long-e-l05" | "vertical-asme-l05" | "vertical-esma-l05",
    focus: "ē" | "s" | "m" | "a",
    cue: Serialized<BoardNode>["presentation"]["cue"],
  ) {
    const {
      layout: _layout,
      targets: _targets,
      ...registration
    } = reviewedPrintedBoards[key];
    return { kind: "printedBoard", board: registration, focus, cue } as const;
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
  function printed(
    number: 1 | 2,
  ): Serialized<Extract<MixedTask, { kind: "printedGraphV2" }>> {
    const m = metadata(number);
    const targets =
      number === 1
        ? (["ē", "ē", "ē"] as const)
        : (["a", "s", "m", "ē"] as const);
    const nodes: Serialized<BoardNode>[] = targets.map((focus, index) => ({
      ...source,
      id: `${m.id}.response${index}`,
      kind: "normal",
      parentRole: number === 1 && index === 0 ? "model" : "listen",
      presentation: board(
        number === 1 ? "single-long-e-l05" : "vertical-asme-l05",
        focus,
        { kind: "underSymbolHold", hold: "parentControlled" },
      ),
      next: { kind: "end" },
    }));
    const normal = link(nodes);
    const first = normal[0];
    if (!first) throw Error("Synthetic start required");
    if (number === 2)
      return {
        kind: "printedGraphV2",
        task: {
          id: m.id,
          number,
          title: m.title,
          startNodeId: first.id,
          nodes: normal,
          corrections: [],
        },
      };
    const support: Serialized<BoardNode> = {
      ...source,
      id: `${m.id}.support`,
      kind: "correction",
      parentRole: "model",
      presentation: board("single-long-e-l05", "ē", { kind: "none" }),
      next: { kind: "end" },
    };
    return {
      kind: "printedGraphV2",
      task: {
        id: m.id,
        number,
        title: m.title,
        startNodeId: first.id,
        nodes: [...normal, support],
        corrections: [
          {
            id: `${m.id}.help`,
            eligibleNodeIds: [`${m.id}.response1`, `${m.id}.response2`],
            instructionNodeId: support.id,
            retestNodeIds: [`${m.id}.response1`],
            continuationNodeId: `${m.id}.response2`,
            sourceRefs: source.sourceRefs,
          },
        ],
      },
    };
  }
  function controlled(
    number: 3 | 4 | 5 | 6,
  ): Serialized<Extract<MixedTask, { kind: "graphControls" }>> {
    const m = metadata(number);
    const nodes: Serialized<
      Extract<ControlNode, { kind: "turn" | "untilFirm" }>
    >[] = [];
    const count = number === 4 ? 20 : 8;
    for (let index = 0; index < count; index++) {
      const focus = (["ē", "s", "m", "a"] as const)[Math.floor(index / 2) % 4];
      if (!focus) throw Error("Synthetic focus required");
      nodes.push({
        ...source,
        id: `${m.id}.response${index}`,
        kind: "turn",
        route: "normal",
        parentRole: "listen",
        itemId: `${m.id}.item${number === 4 ? Math.floor((index % 10) / 2) : number === 3 ? index : Math.floor(index / 2)}`,
        presentation:
          number === 3 || number === 4
            ? { kind: "oral" }
            : board(
                "vertical-esma-l05",
                focus,
                number === 6
                  ? {
                      kind: "childUnderSymbol",
                      participant: "child",
                      pace: index % 2 === 0 ? "slow" : "fast",
                    }
                  : index % 2 === 0
                    ? { kind: "underSymbolHold", hold: "parentControlled" }
                    : { kind: "endpointSweep", preparation: "touchStart" },
              ),
        next: { kind: "end" },
      });
    }
    const normal: Serialized<
      Extract<ControlNode, { kind: "turn" | "untilFirm" }>
    >[] = link(nodes);
    const corrections: Serialized<
      Extract<MixedTask, { kind: "graphControls" }>
    >["task"]["corrections"][number][] = [];
    if (number === 4) {
      const last = normal.at(-1);
      if (!last) throw Error("Synthetic final required");
      normal[normal.length - 1] = {
        ...last,
        next: { kind: "node", nodeId: `${m.id}.ready` },
      };
      normal.push({
        ...source,
        id: `${m.id}.ready`,
        kind: "untilFirm",
        policyId: `${m.id}.firm`,
        cycleEntryNodeId: `${m.id}.response10`,
        cycleExitNodeId: `${m.id}.response19`,
        next: { kind: "end" },
      });
    }
    if (number === 6)
      for (let index = 0; index < 8; index++) {
        const owed = normal[index];
        if (owed?.kind !== "turn" || owed.presentation.kind !== "printedBoard")
          throw Error("Synthetic child turn required");
        const focus = owed.presentation.focus;
        const support: Serialized<
          Extract<ControlNode, { kind: "turn" | "untilFirm" }>
        >[] = ["slow", "fast"].map((pace, i) => ({
          ...source,
          id: `${m.id}.help${index}.${i}`,
          kind: "turn",
          route: "support",
          parentRole: "together",
          itemId: owed.itemId,
          presentation: board("vertical-esma-l05", focus, {
            kind: "childUnderSymbol",
            participant: "parentGuidesChild",
            pace: pace === "slow" ? "slow" : "fast",
          }),
          next: { kind: "end" },
        }));
        const a = support[0],
          b = support[1];
        if (!a || !b) throw Error("Synthetic support required");
        support.push({
          ...source,
          guidance: [
            {
              kind: "action",
              copy: {
                kind: "added",
                text: "Synthetic correct response criterion",
              },
            },
          ],
          id: `${m.id}.help${index}.ready`,
          kind: "untilFirm",
          policyId: `${m.id}.correct${index}`,
          cycleEntryNodeId: a.id,
          cycleExitNodeId: b.id,
          next: { kind: "end" },
        });
        corrections.push({
          id: `${m.id}.help${index}`,
          label: { kind: "added", text: "Synthetic support" },
          scope: "normal",
          eligibleNodeIds: [owed.id],
          instructionNodeIds: support.map((x) => x.id),
          retestNodeIds: normal.slice(0, index + 1).map((x) => x.id),
          sourceRefs: source.sourceRefs,
        });
        nodes.push(...support);
      }
    const first = normal[0];
    if (!first) throw Error("Synthetic start required");
    return {
      kind: "graphControls",
      task: {
        id: m.id,
        number,
        title: m.title,
        startNodeId: first.id,
        nodes: [...normal, ...nodes.slice(count)],
        corrections,
      },
    };
  }
  const tasks = [
    printed(1),
    printed(2),
    controlled(3),
    controlled(4),
    controlled(5),
    controlled(6),
  ];
  const body = {
    ...previous.body,
    requiredEngineCapabilities: [
      ...previous.body.requiredEngineCapabilities,
      "child-pointed-single-sounds-l05-v1",
    ],
    lessons: previous.body.lessons.map((entry, index) =>
      index === 4 ? { ...entry, tasks } : entry,
    ),
  };
  const envelope = {
    formatVersion: 1,
    packageHash: await hash(canonical(body)),
    body,
  };
  const content = await parseRuntimePackage(envelope, hash);
  return {
    previous,
    envelope,
    content,
    taskIds: tasks.map((x) => parseId({ kind: "task", value: x.task.id })),
  };
}
