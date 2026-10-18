import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  lessonFiveCompletionAssetHash,
  lessonFiveCompletionAssetPayload,
  resolvedLessons,
} from "@readatthree/teaching";
import { reviewedLessonFiveCompletionExtension } from "../../tools/content/extension.ts";
import { syntheticLessonFiveCompletion } from "../lesson-five-completion-fixture.ts";
import { hash } from "../lesson-two-fixture.ts";

test("completion authoring appends exactly three tasks and preserves the full catalog and predecessor definitions", async () => {
  const { previous, candidate } = await syntheticLessonFiveCompletion();
  const content = await reviewedLessonFiveCompletionExtension({
    previous,
    candidate,
    hash,
  });
  assert.deepEqual(
    resolvedLessons(content).map((lesson) => lesson.tasks.length),
    [6, 7, 8, 7, 9, 0],
  );
  assert.equal(resolvedLessons(content)[4]?.completeDefinition, true);
  for (const [lessonIndex, lesson] of candidate.body.lessons.entries())
    for (const [taskIndex] of lesson.tasks
      .slice(0, lessonIndex === 4 ? 6 : lesson.tasks.length)
      .entries()) {
      const body = {
        ...candidate.body,
        lessons: candidate.body.lessons.map((item, i) =>
          i !== lessonIndex
            ? item
            : {
                ...item,
                tasks: item.tasks.map((entry, j) =>
                  j !== taskIndex
                    ? entry
                    : {
                        ...entry,
                        task: {
                          ...entry.task,
                          title: {
                            kind: "added",
                            text: "Synthetic altered predecessor",
                          },
                        },
                      },
                ),
              },
        ),
      };
      const altered = {
        ...candidate,
        body,
        packageHash: await hash(canonical(body)),
      };
      await assert.rejects(() =>
        reviewedLessonFiveCompletionExtension({
          previous,
          candidate: altered,
          hash,
        }),
      );
    }
});
test("consumed completion asset identity binds actual glyphs, diagrams, contact size and participant roles", async () => {
  assert.equal(
    await hash(canonical(lessonFiveCompletionAssetPayload)),
    lessonFiveCompletionAssetHash,
  );
  for (const candidate of [
    {
      ...lessonFiveCompletionAssetPayload,
      single: { ...lessonFiveCompletionAssetPayload.single, width: 309 },
    },
    {
      ...lessonFiveCompletionAssetPayload,
      connected: {
        ...lessonFiveCompletionAssetPayload.connected,
        contactSize: 47,
      },
    },
    {
      ...lessonFiveCompletionAssetPayload,
      roles: {
        ...lessonFiveCompletionAssetPayload.roles,
        echo: {
          ...lessonFiveCompletionAssetPayload.roles.echo,
          voice: "parent",
        },
      },
    },
    {
      ...lessonFiveCompletionAssetPayload,
      glyphs: {
        ...lessonFiveCompletionAssetPayload.glyphs,
        ē: { ...lessonFiveCompletionAssetPayload.glyphs.ē, path: "M0 0" },
      },
    },
  ])
    assert.notEqual(
      await hash(canonical(candidate)),
      lessonFiveCompletionAssetHash,
    );
});
