import {
  canonical,
  lessonFiveCompletionBoards,
  parseRuntimePackage,
  parseId,
} from "@readatthree/teaching";
import type {
  ControlNode,
  ControlTask,
  MixedTask,
  Serialized,
  WritingPracticePlanV3,
} from "@readatthree/teaching";
import { syntheticLessonFiveCourse } from "./lesson-five-fixture.ts";
import { syntheticWritingPlan, hash } from "./lesson-two-fixture.ts";

const source = {
  sourceRefs: ["fixture.completion.source"],
  guidance: [
    {
      kind: "action",
      copy: { kind: "added", text: "Synthetic teaching instruction" },
    },
  ],
} as const;
export async function syntheticLessonFiveCompletion() {
  const { content: previous } = await syntheticLessonFiveCourse();
  if (previous.body.coverage !== "course-development-v4")
    throw Error("Synthetic predecessor required");
  const lesson = previous.body.lessons[4];
  if (!lesson) throw Error("Synthetic lesson required");
  function metadata(number: number) {
    const item = lesson?.lessonTasks[number - 1];
    if (!item) throw Error("Synthetic catalog item required");
    return item;
  }
  function task(number: 7 | 8): Serialized<ControlTask> {
    const m = metadata(number);
    const nodes: Serialized<ControlNode>[] = [];
    const {
      layout: _layout,
      targets: _targets,
      ...board
    } = lessonFiveCompletionBoards["single-m-rhyme-l05"];
    const count = number === 7 ? 18 : 8;
    for (let i = 0; i < count; i++) {
      const role =
        i % 4 === 0 ? "model" : i % 4 === 3 ? "childConnect" : "echo";
      nodes.push({
        ...source,
        id: `${m.id}.turn${i}`,
        kind: "turn",
        route: "normal",
        parentRole:
          (number === 8 && role === "model") ||
          (number === 7 && i > 0 && i < 10 && i % 3 !== 1)
            ? "model"
            : "listen",
        itemId: `${m.id}.item${i}`,
        presentation:
          number === 7
            ? {
                kind: "printedBoard",
                board,
                focus: "m",
                cue: { kind: "rhymeHoldThenSweep", hold: "parentControlled" },
              }
            : { kind: "connectedPointing", board: i < 4 ? "ēm" : "ēs", role },
        next:
          i + 1 < count
            ? { kind: "node", nodeId: `${m.id}.turn${i + 1}` }
            : { kind: "end" },
      });
    }
    const corrections: Serialized<ControlTask>["corrections"][number][] = [];
    for (const [index, at] of (number === 7
      ? [10, 11, 13, 14, 16, 17]
      : [3, 7]
    ).entries()) {
      const h = `${m.id}.help${index}`;
      const endpoint = nodes[at];
      if (endpoint?.kind !== "turn") throw Error("Synthetic endpoint required");
      nodes.push({
        ...source,
        id: `${h}.support`,
        kind: "turn",
        route: "support",
        parentRole: "together",
        itemId: endpoint.itemId,
        presentation:
          number === 7
            ? {
                kind: "printedBoard",
                board,
                focus: "m",
                cue: { kind: "rhymeHoldThenSweep", hold: "parentControlled" },
              }
            : {
                kind: "connectedPointing",
                board: "ēm",
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
          .slice(number === 7 ? 10 : 3, at + 1)
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
  const plan = syntheticWritingPlan();
  const [first, second] = plan.targets;
  const { sound: _firstSound, ...firstPractice } = first;
  const { sound: secondSound, ...secondPractice } = second;
  const m = metadata(9);
  const writing: Serialized<WritingPracticePlanV3> = {
    ...plan,
    id: m.id,
    number: 9,
    title: m.title,
    targets: [
      {
        ...firstPractice,
        identification: { kind: "parentInstruction", script: source },
      },
      {
        ...secondPractice,
        identification: { kind: "soundResponse", sound: secondSound },
      },
    ],
  };
  const additions: Serialized<MixedTask>[] = [
    { kind: "graphControls", task: task(7) },
    { kind: "graphControls", task: task(8) },
    { kind: "writingPracticePlanV3", task: writing },
  ];
  const body = {
    ...previous.body,
    releaseId: "fixture.lesson-five-complete.release",
    requiredEngineCapabilities: [
      ...previous.body.requiredEngineCapabilities,
      "rhyming-connected-writing-l05-v1",
    ],
    lessons: previous.body.lessons.map((item) =>
      item === lesson
        ? { ...item, tasks: [...item.tasks, ...additions] }
        : item,
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
