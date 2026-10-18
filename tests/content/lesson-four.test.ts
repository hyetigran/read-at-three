import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  parseRuntimePackage,
  compileWritingPlan,
  guidanceCopies,
  resolvedLessons,
  connectedPointingSvg,
  reviewedPrintedBoards,
} from "@readatthree/teaching";
import { createHash } from "node:crypto";
import { reviewedLessonFourCourseExtension } from "../../tools/content/extension.ts";
import { syntheticLessonFourCourse } from "../lesson-four-fixture.ts";
import { hash } from "../lesson-two-fixture.ts";

test("reviewed Lesson four adds all seven task families and preserves predecessor definitions", async () => {
  const { previous, envelope } = await syntheticLessonFourCourse();
  const content = await reviewedLessonFourCourseExtension({
    previous,
    candidate: envelope,
    hash,
  });
  assert.deepEqual(
    resolvedLessons(content).map((lesson) => lesson.tasks.length),
    [6, 7, 8, 7, 0, 0],
  );
  const lesson = resolvedLessons(content)[3];
  assert.equal(lesson?.completeDefinition, true);
  assert.deepEqual(
    lesson?.tasks.map((entry) =>
      entry.kind === "writingPracticePlanV2"
        ? compileWritingPlan(entry.task).normalNodeIds.length
        : "nodes" in entry.task
          ? entry.task.nodes.filter(
              (node) =>
                node.kind === "normal" ||
                (node.kind === "turn" && node.route === "normal"),
            ).length
          : 0,
    ),
    [3, 8, 6, 20, 3, 3, 8],
  );
  const writing = lesson?.tasks[6];
  if (writing?.kind !== "writingPracticePlanV2")
    throw Error("Synthetic writing missing");
  const lowered = compileWritingPlan(writing.task);
  const trace = [...lowered.nodes.values()].filter(
    (node) =>
      node.kind === "turn" &&
      node.presentation.kind === "writing" &&
      node.presentation.obligation.kind === "phaseConfirmation" &&
      node.presentation.obligation.phase === "childTracing",
  );
  assert.deepEqual(
    trace.map((node) =>
      node.guidance.flatMap(guidanceCopies).map((copy) => copy.text),
    ),
    [["Synthetic qualitative tracing"], ["Synthetic qualitative tracing"]],
  );
  assert.deepEqual(
    content.body.coverage === "course-development-v4"
      ? content.body.lessons.slice(0, 3)
      : [],
    previous.body.coverage === "course-development-v4"
      ? previous.body.lessons.slice(0, 3)
      : [],
  );
});

test("new boards and absent writing copy require the disjoint complete five-capability grammar", async () => {
  const { content, previous } = await syntheticLessonFourCourse();
  if (
    content.body.coverage !== "course-development-v4" ||
    previous.body.coverage !== "course-development-v4"
  )
    throw Error("Synthetic v4 required");
  const original = content.body;
  const rejectedBodies: unknown[] = [
    {
      ...original,
      requiredEngineCapabilities: original.requiredEngineCapabilities.slice(
        0,
        4,
      ),
    },
    {
      ...original,
      requiredEngineCapabilities: original.requiredEngineCapabilities.slice(1),
    },
    {
      ...original,
      requiredEngineCapabilities: [
        ...original.requiredEngineCapabilities.slice(0, 4),
        "connected-pointing-v1",
      ],
    },
    {
      ...original,
      requiredEngineCapabilities: [
        ...original.requiredEngineCapabilities.slice(0, 4),
        "unknown-layout",
      ],
    },
    {
      ...original,
      lessons: original.lessons.map((lesson, i) =>
        i === 3
          ? {
              ...lesson,
              tasks: lesson.tasks.filter((entry) => entry.task.number === 7),
            }
          : lesson,
      ),
      requiredEngineCapabilities: previous.body.requiredEngineCapabilities,
    },
    {
      ...original,
      lessons: original.lessons.map((lesson, i) =>
        i === 3
          ? {
              ...lesson,
              tasks: lesson.tasks.filter((entry) => entry.task.number === 5),
            }
          : lesson,
      ),
      requiredEngineCapabilities: previous.body.requiredEngineCapabilities,
    },
    {
      ...original,
      lessons: original.lessons.map((lesson, i) =>
        i === 3
          ? {
              ...lesson,
              tasks: lesson.tasks.filter((entry) => entry.task.number === 3),
            }
          : lesson,
      ),
      requiredEngineCapabilities: previous.body.requiredEngineCapabilities,
    },
  ];
  for (const body of rejectedBodies)
    await assert.rejects(
      parseRuntimePackage(
        { formatVersion: 1, body, packageHash: await hash(canonical(body)) },
        hash,
      ),
      /schema is unsupported/,
    );
  assert.equal(
    (await parseRuntimePackage(previous, hash)).packageHash,
    previous.packageHash,
  );
});

test("reviewed board validation correlates asset identity, review and bytes", async () => {
  const { content } = await syntheticLessonFourCourse();
  if (content.body.coverage !== "course-development-v4")
    throw Error("Synthetic v4 required");
  const body = content.body;
  for (const changed of [
    {
      ...reviewedPrintedBoards["two-above-one-sma"],
      reviewId: "printed-boards-l03-v1",
    },
    {
      ...reviewedPrintedBoards["two-above-one-sma"],
      assetHash: "0".repeat(64),
    },
  ]) {
    const { layout: _layout, targets: _targets, ...board } = changed;
    const candidate = {
      ...body,
      lessons: body.lessons.map((lesson, i) =>
        i === 3
          ? {
              ...lesson,
              tasks: lesson.tasks.map((entry) =>
                entry.kind === "printedGraphV2" && entry.task.number === 3
                  ? {
                      ...entry,
                      task: {
                        ...entry.task,
                        nodes: entry.task.nodes.map((node) => ({
                          ...node,
                          presentation: { ...node.presentation, board },
                        })),
                      },
                    }
                  : entry,
              ),
            }
          : lesson,
      ),
    };
    await assert.rejects(
      parseRuntimePackage(
        {
          formatVersion: 1,
          body: candidate,
          packageHash: await hash(canonical(candidate)),
        },
        hash,
      ),
      /schema is unsupported/,
    );
  }
  assert.deepEqual(reviewedPrintedBoards["two-above-one-mas"].targets, [
    "m",
    "a",
    "s",
  ]);
  assert.deepEqual(reviewedPrintedBoards["two-above-one-sma"].targets, [
    "s",
    "m",
    "a",
  ]);
  assert.equal(
    createHash("sha256").update(connectedPointingSvg("ma")).digest("hex"),
    "49bbbf47cb3dc9f6671483146edc219b8f98113698ce9d54bab3f1d9922a17a6",
  );
  assert.equal(
    createHash("sha256").update(connectedPointingSvg("sa")).digest("hex"),
    "d878304bef9016702b8ff63f425910c9ee99c01eb199a9ec7c1eca2ac7e0c48e",
  );
});

test("the extension refuses independently rehashed predecessor changes and incomplete Lesson four", async () => {
  const { previous, content } = await syntheticLessonFourCourse();
  if (content.body.coverage !== "course-development-v4")
    throw Error("Synthetic v4 required");
  for (const [index, lesson] of content.body.lessons.entries()) {
    if (index > 2) continue;
    for (const entry of lesson.tasks) {
      const body = {
        ...content.body,
        lessons: content.body.lessons.map((l, i) =>
          i === index
            ? {
                ...l,
                tasks: l.tasks.map((e) =>
                  e === entry
                    ? {
                        ...e,
                        task: {
                          ...e.task,
                          title: {
                            kind: "added",
                            text: "Synthetic predecessor mutation",
                          },
                        },
                      }
                    : e,
                ),
              }
            : l,
        ),
      };
      await assert.rejects(
        reviewedLessonFourCourseExtension({
          previous,
          candidate: {
            formatVersion: 1,
            body,
            packageHash: await hash(canonical(body)),
          },
          hash,
        }),
        /membership|preserve exact/,
      );
    }
  }
  const body = {
    ...content.body,
    lessons: content.body.lessons.map((l, i) =>
      i === 3 ? { ...l, tasks: l.tasks.slice(0, 6) } : l,
    ),
  };
  await assert.rejects(
    reviewedLessonFourCourseExtension({
      previous,
      candidate: {
        formatVersion: 1,
        body,
        packageHash: await hash(canonical(body)),
      },
      hash,
    }),
    /all seven/,
  );
});

test("Lesson four authoring refuses whole blank speech in every node and writing script", async () => {
  const { previous, content } = await syntheticLessonFourCourse();
  if (content.body.coverage !== "course-development-v4")
    throw Error("Synthetic v4 required");
  const blank = {
    kind: "speech",
    runs: [{ copy: { kind: "added", text: " \t\n" }, emphasis: "plain" }],
  } as const;
  const lesson = content.body.lessons[3];
  if (!lesson) throw Error("Synthetic lesson missing");
  for (const entry of lesson.tasks) {
    const tasks = [];
    if (entry.kind === "writingPracticePlanV2") {
      const script = {
        sourceRefs: entry.task.introduction.sourceRefs,
        guidance: [blank],
      };
      tasks.push({ ...entry, task: { ...entry.task, introduction: script } });
      for (const [index, target] of entry.task.targets.entries()) {
        const practices = [
          { ...target, demonstration: script },
          { ...target, sound: { ...target.sound, prompt: script } },
          { ...target, sound: { ...target.sound, expected: script } },
          { ...target, sound: { ...target.sound, affirmation: script } },
          { ...target, tracing: { ...target.tracing, instruction: script } },
          { ...target, tracing: { ...target.tracing, praise: script } },
          {
            ...target,
            independent: { ...target.independent, instruction: script },
          },
          { ...target, independent: { ...target.independent, praise: script } },
        ];
        for (const practice of practices)
          tasks.push({
            ...entry,
            task: {
              ...entry.task,
              targets: entry.task.targets.map((target, i) =>
                i === index ? practice : target,
              ),
            },
          });
      }
    } else if ("nodes" in entry.task) {
      for (const node of entry.task.nodes)
        if ("guidance" in node)
          tasks.push({
            ...entry,
            task: {
              ...entry.task,
              nodes: entry.task.nodes.map((value) =>
                value === node
                  ? { ...value, guidance: [...node.guidance, blank] }
                  : value,
              ),
            },
          });
    }
    for (const changed of tasks) {
      const body = {
        ...content.body,
        lessons: content.body.lessons.map((value) =>
          value === lesson
            ? {
                ...value,
                tasks: value.tasks.map((value) =>
                  value === entry ? changed : value,
                ),
              }
            : value,
        ),
      };
      await assert.rejects(
        reviewedLessonFourCourseExtension({
          previous,
          candidate: {
            formatVersion: 1,
            body,
            packageHash: await hash(canonical(body)),
          },
          hash,
        }),
        /whitespace-only speech block/,
      );
    }
  }
});

test("Lesson four authoring preserves whitespace runs within populated speech and absent scripts", async () => {
  const { previous, content } = await syntheticLessonFourCourse();
  if (content.body.coverage !== "course-development-v4")
    throw Error("Synthetic v4 required");
  const body = {
    ...content.body,
    lessons: content.body.lessons.map((lesson, i) =>
      i !== 3
        ? lesson
        : {
            ...lesson,
            tasks: lesson.tasks.map((entry) =>
              entry.kind === "printedGraphV2"
                ? {
                    ...entry,
                    task: {
                      ...entry.task,
                      nodes: entry.task.nodes.map((node) => ({
                        ...node,
                        guidance: [
                          ...node.guidance,
                          {
                            kind: "speech",
                            runs: [
                              {
                                copy: { kind: "added", text: " " },
                                emphasis: "plain",
                              },
                              {
                                copy: {
                                  kind: "added",
                                  text: "Synthetic populated speech",
                                },
                                emphasis: "strong",
                              },
                              {
                                copy: { kind: "added", text: "\n" },
                                emphasis: "plain",
                              },
                            ],
                          },
                        ],
                      })),
                    },
                  }
                : entry,
            ),
          },
    ),
  };
  const candidate = {
    formatVersion: 1,
    body,
    packageHash: await hash(canonical(body)),
  };
  assert.deepEqual(
    await reviewedLessonFourCourseExtension({ previous, candidate, hash }),
    candidate,
  );
});
