import { printedBoardAssetHash } from "@readatthree/teaching";
import { readFile } from "node:fs/promises";
import { canonical, parseRuntimePackage } from "@readatthree/teaching";
import type { BoardTask, Serialized } from "@readatthree/teaching";
import { hash } from "./lesson-two-fixture.ts";
export async function syntheticPrintedPair() {
  const original: unknown = JSON.parse(
    await readFile(
      "tests/fixtures/lesson-two-development-package.json",
      "utf8",
    ),
  );
  const base = await parseRuntimePackage(original, hash);
  if (base.body.coverage !== "course-development-v2")
    throw new Error("Synthetic V2 fixture required");
  const lesson = base.body.lessons[2];
  const metadata = lesson?.lessonTasks[3];
  if (!lesson || !metadata) throw new Error("Synthetic task metadata required");
  const modes = ["slow", "fast"] as const;
  const task: Serialized<BoardTask> = {
    id: metadata.id,
    number: metadata.number,
    title: metadata.title,
    startNodeId: "fixture.board.slow",
    corrections: [],
    nodes: modes.map((mode, index) => ({
      id: `fixture.board.${mode}`,
      kind: "normal",
      sourceRefs: ["fixture.board.source"],
      guidance: [
        {
          kind: "action",
          copy: { kind: "added", text: `Synthetic ${mode} response` },
        },
      ],
      parentRole: "listen",
      presentation: {
        kind: "printedBoard",
        board: {
          assetId: "two-above-one-mas",
          reviewId: "printed-boards-l03-v1",
          assetHash: printedBoardAssetHash,
        },
        focus: "m",
        cue:
          mode === "slow"
            ? { kind: "underSymbolHold", hold: "parentControlled" }
            : { kind: "endpointSweep", preparation: "touchStart" },
      },
      next:
        index === 0
          ? { kind: "node", nodeId: "fixture.board.fast" }
          : { kind: "end" },
    })),
  };
  const body = {
    ...base.body,
    coverage: "course-development-v3",
    releaseId: "fixture.board.release",
    contentSchemaVersion: 3,
    requiredEngineCapabilities: [
      "writing-practice-plan-v2",
      "guidance-runs-v2",
      "printed-board-cues-v2",
    ],
    lessons: base.body.lessons.map((entry, index) =>
      index === 2
        ? { ...entry, tasks: [{ kind: "printedGraphV2", task }] }
        : entry,
    ),
  };
  const envelope = {
    formatVersion: 1,
    packageHash: await hash(canonical(body)),
    body,
  };
  return {
    envelope,
    content: await parseRuntimePackage(envelope, hash),
    taskId: metadata.id,
  };
}

export async function syntheticPrintedCourse() {
  const { content: pair } = await syntheticPrintedPair();
  if (pair.body.coverage !== "course-development-v3")
    throw new Error("Synthetic V3 required");
  const lesson = pair.body.lessons[2];
  if (!lesson) throw new Error("Lesson 3 required");
  const shapes = [
    {
      number: 1,
      board: "single-a",
      roles: ["model", "listen", "listen"],
      glyphs: ["a", "a", "a"],
      modes: ["slow", "slow", "slow"],
    },
    {
      number: 2,
      board: "vertical-mas",
      roles: ["listen", "listen", "listen"],
      glyphs: ["m", "a", "s"],
      modes: ["slow", "slow", "slow"],
    },
    {
      number: 4,
      board: "two-above-one-mas",
      roles: ["model", "model", ...Array.from({ length: 10 }, () => "listen")],
      glyphs: ["m", "m", "m", "m", "a", "a", "m", "m", "s", "s", "a", "a"],
      modes: [
        "slow",
        "fast",
        "slow",
        "fast",
        "slow",
        "fast",
        "slow",
        "fast",
        "slow",
        "fast",
        "slow",
        "fast",
      ],
    },
  ];
  const tasks = shapes.map((shape) => {
    const metadata = lesson.lessonTasks[shape.number - 1];
    if (!metadata) throw new Error("Synthetic metadata required");
    const nodeId = (index: number) =>
      `fixture.printed.t${shape.number}.n${index}`;
    const nodes = shape.glyphs.map((glyph, index) => ({
      id: nodeId(index),
      kind: "normal",
      sourceRefs: ["fixture.printed.source"],
      guidance: [
        {
          kind: "action",
          runs: [
            {
              copy: {
                kind: "added",
                text: `Synthetic ${shape.roles[index]} ${shape.modes[index]} ${glyph} ${index}`,
              },
              emphasis: "strong",
            },
          ],
        },
      ],
      parentRole: shape.roles[index],
      presentation: {
        kind: "printedBoard",
        board: {
          assetId: shape.board,
          reviewId: "printed-boards-l03-v1",
          assetHash: printedBoardAssetHash,
        },
        focus: glyph,
        cue:
          shape.modes[index] === "fast"
            ? {
                kind: "endpointSweep",
                preparation:
                  glyph === "s" ? "parentControlledStartHold" : "touchStart",
              }
            : { kind: "underSymbolHold", hold: "parentControlled" },
      },
      next:
        index + 1 < shape.glyphs.length
          ? { kind: "node", nodeId: nodeId(index + 1) }
          : { kind: "end" },
    }));
    const corrections =
      shape.number === 1
        ? [
            {
              id: "fixture.printed.correction",
              eligibleNodeIds: [nodeId(1), nodeId(2)],
              instructionNodeId: "fixture.printed.support",
              retestNodeIds: [nodeId(1)],
              continuationNodeId: nodeId(2),
              sourceRefs: ["fixture.printed.source"],
            },
          ]
        : [];
    return {
      kind: "printedGraphV2",
      task: {
        id: metadata.id,
        number: shape.number,
        title: metadata.title,
        startNodeId: nodeId(0),
        nodes:
          shape.number === 1
            ? [
                ...nodes,
                {
                  ...nodes[0],
                  id: "fixture.printed.support",
                  kind: "correction",
                  presentation: {
                    ...nodes[0]?.presentation,
                    cue: { kind: "none" },
                  },
                  next: { kind: "end" },
                },
              ]
            : nodes,
        corrections,
      },
    };
  });
  const body = {
    ...pair.body,
    releaseId: "fixture.printed.complete",
    lessons: pair.body.lessons.map((entry, index) =>
      index === 2 ? { ...entry, tasks } : entry,
    ),
  };
  const envelope = {
    formatVersion: 1,
    packageHash: await hash(canonical(body)),
    body,
  };
  return { envelope, content: await parseRuntimePackage(envelope, hash) };
}
