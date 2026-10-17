import { createHash } from "node:crypto";
import {
  canonical,
  parseDevelopmentPackage,
} from "../../packages/teaching/src/index.ts";
import type {
  DevelopmentBodyInput,
  Serialized,
  WritingObligation,
} from "../../packages/teaching/src/index.ts";
export const writingHash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
export async function writingFixture() {
  const sourceRefs = ["fixture.writing.source"];
  const turns: readonly [string, Serialized<WritingObligation>][] = [
    ["first", { kind: "soundResponse" }],
    ["first", { kind: "modelAndSound" }],
    [
      "first",
      {
        kind: "phaseConfirmation",
        phase: "childTracing",
        practice: { minimum: 2, maximum: 3, allowMore: true },
      },
    ],
    [
      "first",
      {
        kind: "phaseConfirmation",
        phase: "childIndependentWriting",
        practice: { minimum: 3, maximum: 5, allowMore: true },
      },
    ],
    ["second", { kind: "modelAndSound" }],
    [
      "second",
      {
        kind: "phaseConfirmation",
        phase: "childTracing",
        practice: { minimum: 2, maximum: 3, allowMore: true },
      },
    ],
    [
      "second",
      {
        kind: "phaseConfirmation",
        phase: "childIndependentWriting",
        practice: { minimum: 3, maximum: 5, allowMore: true },
      },
    ],
  ];
  const title = {
    kind: "added",
    text: "Synthetic writing fixture",
  } satisfies Serialized<import("../../packages/teaching/src/index.ts").Copy>;
  const body = {
    courseId: "fixture.writing.course",
    releaseId: "fixture.writing.release",
    coverage: "lesson1-complete",
    title,
    lessonId: "fixture.writing.lesson",
    lessonTasks: [
      { id: "fixture.writing.task", number: 6, title, optional: true },
    ],
    tasks: [
      {
        kind: "soundWritingV1",
        task: {
          id: "fixture.writing.task",
          number: 6,
          title,
          optional: true,
          startNodeId: "fixture.writing.turn.1",
          targets: [
            {
              id: "first",
              sourceRefs,
              logicalWidth: 1000,
              logicalHeight: 180,
              guides: { top: 10, midline: 90, baseline: 170 },
              boardY: 0,
            },
            {
              id: "second",
              sourceRefs,
              logicalWidth: 1000,
              logicalHeight: 180,
              guides: { top: 10, midline: 90, baseline: 170 },
              boardY: 220,
            },
          ],
          nodes: turns.map(([targetId, obligation], i) => ({
            id: `fixture.writing.turn.${i + 1}`,
            sourceRefs,
            guidance: [
              {
                kind: "action",
                copy: { kind: "added", text: `Synthetic source turn ${i + 1}` },
              },
            ],
            kind: "turn",
            route: "normal",
            parentRole:
              obligation.kind === "modelAndSound" ? "model" : "listen",
            presentation: { kind: "writing", targetId, obligation },
            next:
              i === 6
                ? { kind: "end" }
                : { kind: "node", nodeId: `fixture.writing.turn.${i + 2}` },
          })),
        },
      },
    ],
  } satisfies DevelopmentBodyInput;
  return parseDevelopmentPackage(
    { formatVersion: 1, body, packageHash: await writingHash(canonical(body)) },
    writingHash,
  );
}
