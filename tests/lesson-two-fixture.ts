import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { canonical, parseRuntimePackage } from "@readatthree/teaching";
import type { Serialized, WritingPracticePlan } from "@readatthree/teaching";

export const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
export function syntheticWritingPlan(): Serialized<WritingPracticePlan> {
  const script = (text: string) => ({
    sourceRefs: ["fixture.plan.source"],
    guidance: [
      {
        kind: "action" as const,
        runs: [
          {
            copy: { kind: "added" as const, text },
            emphasis: "strong" as const,
          },
        ],
      },
    ],
  });
  const practice = (index: number) => ({
    target: {
      id: `fixture.plan.target-${index}`,
      sourceRefs: ["fixture.plan.source"],
      logicalWidth: 1600,
      logicalHeight: 400,
      guides: { top: 40, midline: 190, baseline: 340 },
      boardY: index * 440,
    },
    demonstration: script(`Synthetic model ${index}`),
    sound: {
      prompt: script("Synthetic sound question"),
      expected: script("Synthetic expected response"),
      affirmation: script("Synthetic affirmation after response"),
    },
    tracing: {
      instruction: script("Synthetic qualitative tracing"),
      practice: {
        kind: "qualitative" as const,
        instruction: {
          kind: "added" as const,
          text: "Synthetic several repetitions",
        },
        sourceRef: "fixture.plan.source",
        furtherPractice: "parentDirected" as const,
      },
      praise: script("Synthetic conditional tracing help"),
    },
    independent: {
      instruction: script("Synthetic independent practice"),
      practice: {
        kind: "range" as const,
        minimum: 3,
        maximum: 5,
        sourceRef: "fixture.plan.source",
        furtherPractice: "parentDirected" as const,
      },
      praise: script("Synthetic conditional writing praise"),
    },
  });
  return {
    id: "fixture.writing.l01.t06",
    number: 6,
    title: { kind: "added", text: "Synthetic writing task" },
    optional: true,
    introduction: script("Synthetic introduction"),
    targets: [practice(0), practice(1)],
  };
}
export async function syntheticPlanEnvelope(override?: unknown) {
  const original: unknown = JSON.parse(
    await readFile("tests/fixtures/course-development-package.json", "utf8"),
  );
  const base = await parseRuntimePackage(original, hash);
  if (base.body.coverage !== "course-development")
    throw new Error("Expected synthetic cumulative fixture");
  const writing = base.body.lessons[0]?.tasks.find(
    (entry) => entry.kind === "soundWritingV1",
  );
  if (!writing) throw new Error("Expected old writing task");
  const plan = {
    ...syntheticWritingPlan(),
    id: writing.task.id,
    number: writing.task.number,
    title: writing.task.title,
  };
  const body = {
    ...base.body,
    coverage: "course-development-v2",
    contentSchemaVersion: 2,
    requiredEngineCapabilities: [
      "writing-practice-plan-v2",
      "guidance-runs-v2",
    ],
    releaseId: "fixture.plan.release",
    lessons: base.body.lessons.map((lesson, index) =>
      index === 0
        ? {
            ...lesson,
            tasks: lesson.tasks.map((entry) =>
              entry === writing
                ? { kind: "writingPracticePlanV2", task: override ?? plan }
                : entry,
            ),
          }
        : lesson,
    ),
  };
  return { formatVersion: 1, body, packageHash: await hash(canonical(body)) };
}
