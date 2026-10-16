import { createHash } from "node:crypto";
import {
  canonicalContentBody,
  parseDevelopmentPackage,
  parseId,
} from "../../packages/teaching/src/index.ts";
import type {
  GraphDevelopmentBody,
  GraphNode,
  GraphTask,
  Serialized,
} from "../../packages/teaching/src/index.ts";
export const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
const copy = (text: string) => ({ kind: "added", text }) as const;
const sourceRefs = ["synthetic-source"];
function node(
  id: string,
  glyph: "m" | "s",
  next: string | null,
  kind: "normal" | "correction" = "normal",
  model = false,
): Serialized<GraphNode> {
  return {
    id,
    kind,
    sourceRefs,
    guidance: [
      { kind: "speech", copy: copy(`Synthetic setup ${id}`) },
      { kind: "action", copy: copy(`Synthetic movement ${id}`) },
      { kind: "speech", copy: copy(`Synthetic prompt ${id}`) },
      { kind: "expected", copy: copy(`Synthetic expected ${id}`) },
      { kind: "praise", copy: copy(`Synthetic praise ${id}`) },
    ],
    parentRole: model ? "model" : "listen",
    glyph,
    cue: { kind: "sustain", minimumMs: kind === "normal" ? 3000 : null },
    next: next === null ? { kind: "end" } : { kind: "node", nodeId: next },
  };
}
const intro: Serialized<GraphTask> = {
  id: "task-1",
  number: 1,
  title: copy("Synthetic introduction"),
  startNodeId: "model-m",
  nodes: [
    node("model-m", "m", "child-m", "normal", true),
    node("child-m", "m", "again-m"),
    node("again-m", "m", "model-s"),
    node("model-s", "s", "child-s", "normal", true),
    node("child-s", "s", "again-s"),
    node("again-s", "s", null),
    node("support-m", "m", null, "correction"),
    node("support-s", "s", null, "correction"),
  ],
  corrections: [
    {
      id: "help-m",
      eligibleNodeIds: ["child-m", "again-m"],
      instructionNodeId: "support-m",
      retestNodeIds: ["child-m"],
      continuationNodeId: "again-m",
      sourceRefs,
    },
    {
      id: "help-s",
      eligibleNodeIds: ["child-s", "again-s"],
      instructionNodeId: "support-s",
      retestNodeIds: ["child-s"],
      continuationNodeId: "again-s",
      sourceRefs,
    },
  ],
};
const review: Serialized<GraphTask> = {
  id: "task-4",
  number: 4,
  title: copy("Synthetic review"),
  startNodeId: "review-m",
  nodes: [
    node("review-m", "m", "review-s"),
    node("review-s", "s", null),
    node("review-support-m", "m", null, "correction"),
    node("review-support-s", "s", null, "correction"),
  ],
  corrections: [
    {
      id: "review-help-m",
      eligibleNodeIds: ["review-m"],
      instructionNodeId: "review-support-m",
      retestNodeIds: ["review-m", "review-s"],
      continuationNodeId: null,
      sourceRefs,
    },
    {
      id: "review-help-s",
      eligibleNodeIds: ["review-s"],
      instructionNodeId: "review-support-s",
      retestNodeIds: ["review-m", "review-s"],
      continuationNodeId: null,
      sourceRefs,
    },
  ],
};
export const graphBody: Serialized<GraphDevelopmentBody> = {
  courseId: "graph-course",
  releaseId: "graph-release",
  coverage: "lesson1-sounds-complete",
  title: copy("Synthetic graph"),
  lessonId: "lesson-1",
  lessonTasks: Array.from({ length: 6 }, (_, index) => ({
    id: `task-${index + 1}`,
    number: index + 1,
    title:
      index === 0
        ? intro.title
        : index === 3
          ? review.title
          : copy(`Synthetic task ${index + 1}`),
    optional: index === 5,
  })),
  tasks: [intro, review],
};
export async function graphFixture(
  body: Serialized<GraphDevelopmentBody> = graphBody,
) {
  return parseDevelopmentPackage(
    {
      formatVersion: 1,
      body,
      packageHash: await hash(canonicalContentBody(body)),
    },
    hash,
  );
}
export const task1 = parseId({ kind: "task", value: "task-1" });
export const task4 = parseId({ kind: "task", value: "task-4" });
export const correction = (id: string) =>
  parseId({ kind: "correction", value: id });
