import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  resolvedLessons,
  packageMetadata,
} from "@readatthree/teaching";
import { reviewedOralCourseExtension } from "../../tools/content/extension.ts";
import { syntheticOralPairsCourse } from "../oral-pairs-fixture.ts";
import { hash } from "../lesson-two-fixture.ts";

test("oral stage preserves its exact printed predecessor and full catalog without widening capabilities", async () => {
  const { previous, envelope, content } = await syntheticOralPairsCourse();
  assert.deepEqual(
    await reviewedOralCourseExtension({ previous, candidate: envelope, hash }),
    content,
  );
  assert.deepEqual(
    resolvedLessons(content).map((l) => l.tasks.length),
    [6, 7, 5, 0, 0, 0],
  );
  assert.deepEqual(
    resolvedLessons(content).map((l) => l.lessonTasks.length),
    [6, 7, 8, 7, 9, 8],
  );
  assert.deepEqual(packageMetadata(content), packageMetadata(previous));
  assert.equal(resolvedLessons(content)[2]?.completeDefinition, false);
});

test("oral stage refuses rehashed earlier oral or printed rewrites and missing additions", async () => {
  const { previous, content } = await syntheticOralPairsCourse();
  if (content.body.coverage !== "course-development-v3")
    throw new Error("V3 required");
  for (const lessonIndex of [1, 2]) {
    const body = {
      ...content.body,
      lessons: content.body.lessons.map((lesson, i) =>
        i === lessonIndex
          ? {
              ...lesson,
              tasks: lesson.tasks.map((entry, j) =>
                j === 0 && "nodes" in entry.task
                  ? {
                      ...entry,
                      task: {
                        ...entry.task,
                        nodes: entry.task.nodes.map((node, n) =>
                          n === 0
                            ? {
                                ...node,
                                guidance: [
                                  ...node.guidance,
                                  {
                                    kind: "action",
                                    copy: {
                                      kind: "added",
                                      text: "Synthetic altered predecessor",
                                    },
                                  },
                                ],
                              }
                            : node,
                        ),
                      },
                    }
                  : entry,
              ),
            }
          : lesson,
      ),
    };
    const candidate = {
      formatVersion: 1,
      body,
      packageHash: await hash(canonical(body)),
    };
    await assert.rejects(
      () => reviewedOralCourseExtension({ previous, candidate, hash }),
      /preserve exact predecessor curriculum/,
    );
  }
  const body = {
    ...content.body,
    lessons: content.body.lessons.map((lesson, i) =>
      i === 2
        ? { ...lesson, tasks: lesson.tasks.filter((e) => e.task.number !== 5) }
        : lesson,
    ),
  };
  const candidate = {
    formatVersion: 1,
    body,
    packageHash: await hash(canonical(body)),
  };
  await assert.rejects(
    () => reviewedOralCourseExtension({ previous, candidate, hash }),
    /exactly reviewed tasks/,
  );
});
