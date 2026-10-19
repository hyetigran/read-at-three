import {
  canonical,
  lessonSixPrintedBoards,
  parseId,
  parseRuntimePackage,
} from "@readatthree/teaching";
import type {
  BoardTask,
  ControlNode,
  ControlTask,
  MixedTask,
  Serialized,
  WritingPracticePlanV3,
} from "@readatthree/teaching";
import { syntheticLessonFiveCompletion } from "./lesson-five-completion-fixture.ts";
import { hash, syntheticWritingPlan } from "./lesson-two-fixture.ts";

const source = {
  sourceRefs: ["fixture.lesson-six.source"],
  guidance: [
    { kind: "action", copy: { kind: "added", text: "Synthetic instruction" } },
  ],
} as const;
export async function syntheticLessonSixCourse() {
  const { content: previous } = await syntheticLessonFiveCompletion();
  if (previous.body.coverage !== "course-development-v4")
    throw Error("Synthetic cumulative predecessor required");
  const lesson = previous.body.lessons[5];
  if (!lesson) throw Error("Synthetic lesson required");
  function metadata(number: number) {
    const entry = lesson?.lessonTasks[number - 1];
    if (!entry) throw Error("Synthetic catalog entry required");
    return entry;
  }
  function board(key: keyof typeof lessonSixPrintedBoards) {
    const {
      layout: _layout,
      targets: _targets,
      ...identity
    } = lessonSixPrintedBoards[key];
    return identity;
  }
  const m = metadata(1);
  const printed: Serialized<BoardTask> = {
    id: m.id,
    number: 1,
    title: m.title,
    startNodeId: `${m.id}.turn0`,
    corrections: [],
    nodes: Array.from({ length: 8 }, (_, i) => ({
      ...source,
      id: `${m.id}.turn${i}`,
      kind: "normal",
      parentRole: "listen",
      presentation: {
        kind: "printedBoard",
        board: board("vertical-esam-l06"),
        focus: i < 2 ? "ē" : i < 4 ? "s" : i < 6 ? "a" : "m",
        cue:
          i % 2 === 0
            ? { kind: "underSymbolHold", hold: "parentControlled" }
            : { kind: "endpointSweep", preparation: "touchStart" },
      },
      next:
        i < 7
          ? { kind: "node", nodeId: `${m.id}.turn${i + 1}` }
          : { kind: "end" },
    })),
  };
  function control(number: 2 | 3 | 4 | 5 | 6 | 7): Serialized<ControlTask> {
    const m = metadata(number),
      count =
        number === 2
          ? 12
          : number === 3
            ? 24
            : number === 5
              ? 28
              : number === 6
                ? 18
                : 8;
    const nodes: Serialized<ControlNode>[] = Array.from(
      { length: count },
      (_, i) => {
        const role =
          i % 4 === 0 ? "model" : i % 4 === 3 ? "childConnect" : "echo";
        return {
          ...source,
          id: `${m.id}.turn${i}`,
          kind: "turn",
          route: "normal",
          parentRole: number === 7 && role === "model" ? "model" : "listen",
          itemId: `${m.id}.item${i}`,
          presentation:
            number === 7
              ? { kind: "connectedPointing", board: i < 4 ? "mē" : "sē", role }
              : number === 3 || number === 6
                ? {
                    kind: "printedBoard",
                    board: board(
                      number === 3
                        ? "single-m-rhyme-l06"
                        : "single-s-rhyme-l06",
                    ),
                    focus: number === 3 ? "m" : "s",
                    cue: {
                      kind: "rhymeHoldThenSweep",
                      hold: "parentControlled",
                    },
                  }
                : number === 4
                  ? {
                      kind: "printedBoard",
                      board: board("vertical-eams-l06"),
                      focus: i < 2 ? "ē" : i < 4 ? "a" : i < 6 ? "m" : "s",
                      cue: {
                        kind: "childUnderSymbol",
                        pace: i % 2 === 0 ? "slow" : "fast",
                        participant: "child",
                      },
                    }
                  : { kind: "oral" },
          next:
            i + 1 < count
              ? { kind: "node", nodeId: `${m.id}.turn${i + 1}` }
              : number === 5
                ? { kind: "node", nodeId: `${m.id}.ready` }
                : { kind: "end" },
        };
      },
    );
    if (number === 5)
      nodes.push({
        ...source,
        id: `${m.id}.ready`,
        kind: "untilFirm",
        policyId: `${m.id}.firm`,
        cycleEntryNodeId: `${m.id}.turn14`,
        cycleExitNodeId: `${m.id}.turn27`,
        next: { kind: "end" },
      });
    const corrections: Serialized<ControlTask>["corrections"][number][] = [];
    for (const at of number === 3
      ? [13, 14, 16, 17, 19, 20, 22, 23]
      : number === 7
        ? [3, 7]
        : []) {
      const h = `${m.id}.help${at}`,
        endpoint = nodes[at];
      if (endpoint?.kind !== "turn") throw Error("Synthetic endpoint required");
      nodes.push({
        ...source,
        id: `${h}.support`,
        kind: "turn",
        route: "support",
        parentRole: "together",
        itemId: endpoint.itemId,
        presentation:
          number === 3
            ? {
                kind: "printedBoard",
                board: board("single-m-rhyme-l06"),
                focus: "m",
                cue: { kind: "rhymeHoldThenSweep", hold: "parentControlled" },
              }
            : {
                kind: "connectedPointing",
                board: "mē",
                role: "togetherGuided",
              },
        next: { kind: "end" },
      });
      nodes.push({
        ...source,
        id: `${h}.ready`,
        kind: "untilFirm",
        policyId: `${h}.firm`,
        cycleEntryNodeId: `${h}.support`,
        cycleExitNodeId: `${h}.support`,
        next: { kind: "end" },
      });
      corrections.push({
        id: h,
        label: { kind: "added", text: "Synthetic Help" },
        scope: "normal",
        eligibleNodeIds: [endpoint.id],
        instructionNodeIds: [`${h}.support`, `${h}.ready`],
        retestNodeIds: nodes
          .slice(number === 3 ? 13 : 3, at + 1)
          .map((node) => node.id),
        sourceRefs: source.sourceRefs,
      });
    }
    return {
      id: m.id,
      number,
      title: m.title,
      startNodeId: `${m.id}.turn0`,
      nodes,
      corrections,
    };
  }
  const plan = syntheticWritingPlan(),
    [first, second] = plan.targets;
  const { sound: _firstSound, ...firstPractice } = first;
  const { sound: secondSound, ...secondPractice } = second;
  const w = metadata(8);
  const writing: Serialized<WritingPracticePlanV3> = {
    ...plan,
    id: w.id,
    number: 8,
    title: w.title,
    targets: [
      {
        ...firstPractice,
        target: { ...firstPractice.target, id: "fixture.lesson-six.e" },
        identification: { kind: "parentInstruction", script: source },
      },
      {
        ...secondPractice,
        target: { ...secondPractice.target, id: "fixture.lesson-six.s" },
        identification: { kind: "soundResponse", sound: secondSound },
      },
    ],
  };
  const additions: Serialized<MixedTask>[] = [
    { kind: "printedGraphV2", task: printed },
    ...([2, 3, 4, 5, 6, 7] as const).map(
      (number) => ({ kind: "graphControls", task: control(number) }) as const,
    ),
    { kind: "writingPracticePlanV3", task: writing },
  ];
  const body = {
    ...previous.body,
    releaseId: "fixture.lesson-six.release",
    requiredEngineCapabilities: [
      ...previous.body.requiredEngineCapabilities,
      "complete-lessons-01-06-v1",
    ],
    lessons: previous.body.lessons.map((item) =>
      item === lesson ? { ...item, tasks: additions } : item,
    ),
  };
  const candidate = {
    formatVersion: 1,
    body,
    packageHash: await hash(canonical(body)),
  };
  const content = await parseRuntimePackage(candidate, hash);
  return {
    previous,
    candidate,
    content,
    taskIds: additions.map((entry) =>
      parseId({ kind: "task", value: entry.task.id }),
    ),
  };
}
