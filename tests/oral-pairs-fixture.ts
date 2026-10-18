import { canonical, parseRuntimePackage } from "@readatthree/teaching";
import type {
  ControlNode,
  ControlTask,
  Serialized,
} from "@readatthree/teaching";
import { syntheticPrintedCourse } from "./printed-board-fixture.ts";
import { hash } from "./lesson-two-fixture.ts";

export async function syntheticOralPairsCourse() {
  const { content: previous } = await syntheticPrintedCourse();
  if (previous.body.coverage !== "course-development-v3")
    throw new Error("Synthetic V3 predecessor required");
  const catalog = previous.body.lessons[2]?.lessonTasks;
  const third = catalog?.[2],
    fifth = catalog?.[4];
  if (!third || !fifth) throw new Error("Synthetic oral task catalog required");
  const guidance = (text: string) => [
    {
      kind: "action" as const,
      copy: { kind: "added" as const, text: `Synthetic ${text}` },
    },
  ];
  const turn = (input: {
    id: string;
    item: string;
    role: "model" | "together" | "listen";
    route: "normal" | "support";
  }): Serialized<ControlNode> => ({
    id: input.id,
    kind: "turn",
    route: input.route,
    parentRole: input.role,
    itemId: input.item,
    sourceRefs: ["fixture.oral-pairs.source"],
    guidance: guidance(input.id),
    presentation: { kind: "oral" },
    next: { kind: "end" },
  });
  const normal3 = Array.from({ length: 5 }, (_, i) =>
    turn({
      id: `fixture.oral.t3.initial.${i}`,
      item: `fixture.oral.t3.item.${i}`,
      role: "listen",
      route: "normal",
    }),
  );
  const support3: Serialized<ControlNode>[] = [];
  const corrections: Serialized<ControlTask>["corrections"][number][] = [];
  for (let i = 0; i < 5; i++) {
    const id = `fixture.oral.t3.help.${i}`;
    const model = turn({
      id: `${id}.model`,
      item: `fixture.oral.t3.item.${i}`,
      role: "model",
      route: "support",
    });
    const together = turn({
      id: `${id}.together`,
      item: `fixture.oral.t3.item.${i}`,
      role: "together",
      route: "support",
    });
    const retest = turn({
      id: `${id}.retest`,
      item: `fixture.oral.t3.item.${i}`,
      role: "listen",
      route: "support",
    });
    const gate: Serialized<ControlNode> = {
      id: `${id}.firm`,
      kind: "untilFirm",
      policyId: `${id}.policy`,
      cycleEntryNodeId: model.id,
      cycleExitNodeId: together.id,
      sourceRefs: ["fixture.oral-pairs.source"],
      guidance: guidance("complete supported cycle firmness"),
      next: { kind: "end" },
    };
    support3.push(model, together, gate, retest);
    corrections.push({
      id,
      label: { kind: "added", text: `Synthetic help ${i}` },
      scope: "normal",
      eligibleNodeIds: [`fixture.oral.t3.initial.${i}`],
      instructionNodeIds: [model.id, together.id, gate.id],
      retestNodeIds: [retest.id],
      sourceRefs: ["fixture.oral-pairs.source"],
    });
  }
  const task3: Serialized<ControlTask> = {
    id: third.id,
    number: 3,
    title: third.title,
    startNodeId: "fixture.oral.t3.initial.0",
    nodes: [
      ...normal3.map((node, i) => ({
        ...node,
        next:
          i < 4
            ? {
                kind: "node" as const,
                nodeId: `fixture.oral.t3.initial.${i + 1}`,
              }
            : { kind: "end" as const },
      })),
      ...support3,
    ],
    corrections,
  };
  const responses5 = Array.from({ length: 14 }, (_, i) =>
    turn({
      id: `fixture.oral.t5.${i < 8 ? "initial" : "replay"}.${i}`,
      item: `fixture.oral.t5.item.${i < 8 ? Math.floor(i / 2) : Math.floor((i - 8) / 2) + 1}`,
      role: "listen",
      route: "normal",
    }),
  );
  const gateId = "fixture.oral.t5.firm";
  const task5: Serialized<ControlTask> = {
    id: fifth.id,
    number: 5,
    title: fifth.title,
    startNodeId: "fixture.oral.t5.initial.0",
    corrections: [],
    nodes: [
      ...responses5.map((node, i) => ({
        ...node,
        next: {
          kind: "node" as const,
          nodeId: responses5[i + 1]?.id ?? gateId,
        },
      })),
      {
        id: gateId,
        kind: "untilFirm",
        policyId: "fixture.oral.t5.policy",
        cycleEntryNodeId: "fixture.oral.t5.replay.8",
        cycleExitNodeId: "fixture.oral.t5.replay.13",
        guidance: guidance("full mandatory group firmness"),
        sourceRefs: ["fixture.oral-pairs.source"],
        next: { kind: "end" },
      },
    ],
  };
  const body = {
    ...previous.body,
    releaseId: "fixture.oral-pairs.release",
    lessons: previous.body.lessons.map((lesson, i) =>
      i === 2
        ? {
            ...lesson,
            tasks: [
              ...lesson.tasks,
              { kind: "graphControls" as const, task: task3 },
              { kind: "graphControls" as const, task: task5 },
            ].sort((a, b) => a.task.number - b.task.number),
          }
        : lesson,
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
    task3Id: third.id,
    task5Id: fifth.id,
  };
}
