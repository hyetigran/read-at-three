import {
  canonical,
  connectedPointingRoles,
  parseRuntimePackage,
} from "@readatthree/teaching";
import type {
  ConnectedPointingPresentation,
  ControlNode,
  ControlTask,
  ControlTurnNode,
  Serialized,
} from "@readatthree/teaching";
import { syntheticOralPairsCourse } from "./oral-pairs-fixture.ts";
import { hash, syntheticWritingPlan } from "./lesson-two-fixture.ts";

export async function syntheticConnectedCourse() {
  const { content: previous } = await syntheticOralPairsCourse();
  if (previous.body.coverage !== "course-development-v3")
    throw new Error("Synthetic V3 required");
  const catalog = previous.body.lessons[2]?.lessonTasks;
  if (!catalog) throw new Error("Synthetic catalog required");
  function pointing(number: 6 | 7) {
    const metadata = catalog?.[number - 1];
    if (!metadata) throw new Error("Synthetic task required");
    const board = number === 6 ? "am" : "sa";
    const sourceRefs = ["fixture.connected.source"];
    const guidance = [
      {
        kind: "action",
        copy: {
          kind: "added",
          text: `Synthetic parent voices ${board}; pointer follows actual contact.`,
        },
      },
    ] as const;
    function turn({
      suffix,
      role,
      item,
      route = "normal",
    }: {
      suffix: string;
      role: ConnectedPointingPresentation["role"];
      item: string;
      route?: "normal" | "support";
    }): Serialized<ControlTurnNode> {
      return {
        id: `${metadata?.id}.${suffix}`,
        kind: "turn",
        route,
        parentRole: connectedPointingRoles[role].parentRole,
        itemId: `${metadata?.id}.${item}`,
        presentation: { kind: "connectedPointing", board, role },
        sourceRefs,
        guidance,
        next: { kind: "end" },
      };
    }
    const normal = [
      turn({ suffix: "model", role: "model", item: "model" }),
      ...(number === 7
        ? [
            turn({
              suffix: "required-model-repeat",
              role: "model",
              item: "model",
            }),
          ]
        : []),
      turn({ suffix: "follow", role: "follow", item: "follow" }),
      turn({ suffix: "again", role: "follow", item: "again" }),
    ];
    for (let i = 0; i < normal.length - 1; i++) {
      const node = normal[i],
        next = normal[i + 1];
      if (node && next)
        normal[i] = { ...node, next: { kind: "node", nodeId: next.id } };
    }
    const support: Serialized<ControlNode>[] = [];
    const corrections: Serialized<ControlTask>["corrections"][number][] = [];
    for (const item of ["follow", "again"]) {
      const guided = turn({
        suffix: `help-${item}.guided`,
        role: "guided",
        item,
        route: "support",
      });
      const retest = turn({
        suffix: `help-${item}.retest`,
        role: "follow",
        item,
        route: "support",
      });
      const instructions = [guided.id];
      support.push(guided);
      if (number === 6) {
        const gate = {
          id: `${metadata.id}.help-${item}.firm`,
          kind: "untilFirm",
          policyId: `${metadata.id}.help-${item}.policy`,
          cycleEntryNodeId: guided.id,
          cycleExitNodeId: guided.id,
          sourceRefs,
          guidance,
          next: { kind: "end" },
        } satisfies Serialized<ControlNode>;
        support.push(gate);
        instructions.push(gate.id);
      }
      support.push(retest);
      corrections.push({
        id: `${metadata.id}.help-${item}`,
        label: { kind: "added", text: "Synthetic pointing help" },
        scope: "normal",
        eligibleNodeIds: [`${metadata.id}.${item}`],
        instructionNodeIds: instructions,
        retestNodeIds: [retest.id],
        sourceRefs,
      });
    }
    const first = normal[0];
    if (!first) throw new Error("Synthetic model missing");
    return {
      kind: "graphControls",
      task: {
        id: metadata.id,
        number,
        title: metadata.title,
        startNodeId: first.id,
        nodes: [...normal, ...support],
        corrections,
      },
    } as const;
  }
  const metadata = catalog[7];
  if (!metadata) throw new Error("Synthetic writing catalog required");
  const basePlan = syntheticWritingPlan();
  const writing = {
    kind: "writingPracticePlanV2",
    task: { ...basePlan, id: metadata.id, number: 8, title: metadata.title },
  } as const;
  const body = {
    ...previous.body,
    coverage: "course-development-v4",
    contentSchemaVersion: 4,
    requiredEngineCapabilities: [
      ...previous.body.requiredEngineCapabilities,
      "connected-pointing-v1",
    ],
    releaseId: "fixture.connected.release",
    lessons: previous.body.lessons.map((lesson, index) =>
      index === 2
        ? {
            ...lesson,
            tasks: [...lesson.tasks, pointing(6), pointing(7), writing],
          }
        : lesson,
    ),
  };
  const envelope = {
    formatVersion: 1,
    body,
    packageHash: await hash(canonical(body)),
  };
  const content = await parseRuntimePackage(envelope, hash);
  return {
    previous,
    envelope,
    content,
    task6Id: catalog[5]?.id,
    task7Id: catalog[6]?.id,
    writingTaskId: metadata.id,
  };
}
