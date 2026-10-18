import assert from "node:assert/strict";
import { test } from "node:test";
import { canonical } from "@readatthree/teaching";
import { reviewedConnectedCourseExtension } from "../../tools/content/extension.ts";
import { syntheticConnectedCourse } from "../connected-pointing-fixture.ts";
import { hash } from "../lesson-two-fixture.ts";

test("connected extension preserves predecessor definitions and complete catalog before adding only 6/7/8", async () => {
  const { previous, envelope } = await syntheticConnectedCourse();
  const accepted = await reviewedConnectedCourseExtension({
    previous,
    candidate: envelope,
    hash,
  });
  assert.equal(accepted.packageHash, envelope.packageHash);
  const body = {
    ...envelope.body,
    lessons: envelope.body.lessons.map((lesson, index) =>
      index === 2
        ? {
            ...lesson,
            lessonTasks: lesson.lessonTasks.map((task, i) =>
              i === 0
                ? {
                    ...task,
                    title: {
                      kind: "added",
                      text: "Synthetic rehashed predecessor mutation",
                    },
                  }
                : task,
            ),
            tasks: lesson.tasks.map((entry, i) =>
              i === 0
                ? {
                    ...entry,
                    task: {
                      ...entry.task,
                      title: {
                        kind: "added",
                        text: "Synthetic rehashed predecessor mutation",
                      },
                    },
                  }
                : entry,
            ),
          }
        : lesson,
    ),
  };
  const changed = {
    formatVersion: 1,
    body,
    packageHash: await hash(canonical(body)),
  };
  await assert.rejects(
    reviewedConnectedCourseExtension({ previous, candidate: changed, hash }),
    /preserve exact|catalog/,
  );
});
