import {
  initialControlState,
  evaluateControls,
  projectControls,
  controlCompletionProof,
  controlActions,
} from "../../packages/teaching/src/control-engine.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  parseRuntimePackage,
  resolvedLessons,
  taskDefinition,
  guidanceCopies,
} from "@readatthree/teaching";
import { syntheticLessonFiveCourse } from "../lesson-five-fixture.ts";
import { installedFixture } from "../installed-fixture.ts";
import { hash } from "../lesson-two-fixture.ts";
import { reviewedLessonFiveCourseExtension } from "../../tools/content/extension.ts";

test("six capability curriculum preserves twenty eight predecessors and leaves the nine-task lesson unfinished", async () => {
  const { previous, envelope } = await syntheticLessonFiveCourse();
  const content = await reviewedLessonFiveCourseExtension({
    previous,
    candidate: envelope,
    hash,
  });
  assert.deepEqual(
    resolvedLessons(content).map((x) => x.tasks.length),
    [6, 7, 8, 7, 6, 0],
  );
  assert.equal(resolvedLessons(content)[4]?.completeDefinition, false);
  if (
    content.body.coverage !== "course-development-v4" ||
    previous.body.coverage !== "course-development-v4"
  )
    throw Error("Synthetic cumulative package required");
  assert.deepEqual(
    content.body.lessons.slice(0, 4),
    previous.body.lessons.slice(0, 4),
  );
  assert.deepEqual(
    content.body.lessons.map((x) => x.lessonTasks),
    previous.body.lessons.map((x) => x.lessonTasks),
  );
  assert.deepEqual(
    content.body.lessons[4]?.tasks.map((entry) =>
      "nodes" in entry.task
        ? entry.task.nodes.filter(
            (x) =>
              x.kind === "normal" ||
              (x.kind === "turn" && x.route === "normal"),
          ).length
        : 0,
    ),
    [3, 4, 8, 20, 8, 8],
  );
});

test("historical five capability grammar refuses new assets, glyph and child feedback", async () => {
  const { envelope } = await syntheticLessonFiveCourse();
  const body = {
    ...envelope.body,
    requiredEngineCapabilities: envelope.body.requiredEngineCapabilities.filter(
      (x) => x !== "child-pointed-single-sounds-l05-v1",
    ),
  };
  await assert.rejects(
    parseRuntimePackage(
      { ...envelope, body, packageHash: await hash(canonical(body)) },
      hash,
    ),
    /schema/,
  );
});

test("all predecessor edits and blank speech or quote markers are rejected at the authoring boundary", async () => {
  const { previous, envelope } = await syntheticLessonFiveCourse();
  function changed(
    lessonIndex: number,
    taskIndex: number,
    text: string,
    kind: "speech" | "action",
  ) {
    return {
      ...envelope.body,
      lessons: envelope.body.lessons.map((lesson, l) =>
        l !== lessonIndex
          ? lesson
          : {
              ...lesson,
              tasks: lesson.tasks.map((entry, t) =>
                t !== taskIndex
                  ? entry
                  : entry.kind === "writingPracticePlanV2"
                    ? {
                        ...entry,
                        task: {
                          ...entry.task,
                          introduction: {
                            ...entry.task.introduction,
                            guidance: [{ kind, copy: { kind: "added", text } }],
                          },
                        },
                      }
                    : "nodes" in entry.task
                      ? {
                          ...entry,
                          task: {
                            ...entry.task,
                            nodes: entry.task.nodes.map((node, n) =>
                              n !== 0
                                ? node
                                : {
                                    ...node,
                                    guidance: [
                                      { kind, copy: { kind: "added", text } },
                                    ],
                                  },
                            ),
                          },
                        }
                      : entry,
              ),
            },
      ),
    };
  }
  for (let lesson = 0; lesson < 4; lesson++)
    for (
      let index = 0;
      index < (envelope.body.lessons[lesson]?.tasks.length ?? 0);
      index++
    ) {
      const body = changed(
        lesson,
        index,
        "Synthetic changed predecessor",
        "action",
      );
      await assert.rejects(
        reviewedLessonFiveCourseExtension({
          previous,
          candidate: {
            ...envelope,
            body,
            packageHash: await hash(canonical(body)),
          },
          hash,
        }),
        /preserve|predecessor/,
      );
    }
  for (const text of [" ", "\n> Synthetic artifact"]) {
    const body = changed(4, 0, text, text.trim() ? "action" : "speech");
    await assert.rejects(
      reviewedLessonFiveCourseExtension({
        previous,
        candidate: {
          ...envelope,
          body,
          packageHash: await hash(canonical(body)),
        },
        hash,
      }),
      /speech|quote marker/,
    );
  }
});

for (const repeated of [false, true])
  for (let trigger = 0; trigger < 8; trigger++)
    test(`child support prefix ${trigger} restores ${repeated ? "Repeat" : "normal"} at the exact owed response`, async () => {
      const { content: document, taskIds } = await syntheticLessonFiveCourse();
      const content = await installedFixture(document, hash);
      const taskId = taskIds[5];
      if (!taskId) throw Error("Synthetic task required");
      const task = taskDefinition({ content: document, taskId });
      if (task.kind !== "graphControls")
        throw Error("Synthetic controls required");
      let state = initialControlState({ content, taskId });
      const correction = task.graph.task.corrections[trigger];
      if (!correction) throw Error("Synthetic correction required");
      function act(action: Parameters<typeof evaluateControls>[0]["action"]) {
        const next = evaluateControls({
          content,
          state,
          status: controlCompletionProof({ content, state })
            ? "completed"
            : "inProgress",
          action,
        }).after;
        if (next.kind !== "graphControls")
          throw Error("Synthetic state changed");
        state = next;
      }
      function current() {
        const view = projectControls({ content, state });
        return view.kind === "teaching" ? view.turn.id : null;
      }
      for (let i = 0; i < trigger; i++) act({ kind: "continue" });
      if (repeated) act({ kind: "repeat" });
      act({ kind: "help", correctionId: correction.id });
      for (let cycle = 0; cycle < 2; cycle++) {
        const slow = projectControls({ content, state });
        if (
          slow.kind !== "teaching" ||
          !("presentation" in slow.turn) ||
          slow.turn.presentation.kind !== "printedBoard"
        )
          throw Error("Synthetic printed support required");
        assert.deepEqual(slow.turn.presentation.cue, {
          kind: "childUnderSymbol",
          participant: "parentGuidesChild",
          pace: "slow",
        });
        act({ kind: "continue" });
        const fast = projectControls({ content, state });
        if (fast.kind !== "teaching" || !("guidance" in fast.turn))
          throw Error("Synthetic fast support required");
        assert.equal(
          fast.turn.guidance.flatMap(guidanceCopies).at(-1)?.text,
          "Synthetic correct response criterion",
        );
        if (cycle === 0) act({ kind: "continue" });
      }
      const ready = controlActions({
        content,
        state,
        status: "inProgress",
      }).find((a) => a.intent.kind === "parentReady");
      if (!ready || ready.intent.kind !== "parentReady")
        throw Error("Synthetic readiness required");
      act(ready.intent);
      for (let index = 0; index <= trigger; index++) {
        assert.equal(current(), `${taskId}.response${index}`);
        act({ kind: "continue" });
      }
      assert.equal(
        current(),
        repeated
          ? `${taskId}.response${trigger}`
          : trigger === 7
            ? null
            : `${taskId}.response${trigger + 1}`,
      );
      if (repeated) {
        act({ kind: "continue" });
        assert.equal(
          current(),
          trigger === 7 ? null : `${taskId}.response${trigger + 1}`,
        );
      }
    });

test("complete newest asset identity covers every vector, anchor, layout and compact renderer field", async () => {
  const { lessonFivePrintedAssetPayload, lessonFivePrintedAssetHash } =
    await import("../../packages/teaching/src/printed-assets.ts");
  assert.equal(
    await hash(canonical(lessonFivePrintedAssetPayload)),
    lessonFivePrintedAssetHash,
  );
  let mutated = 0;
  function variations(value: unknown): unknown[] {
    if (value === null) return ["synthetic mutation"];
    if (typeof value === "string") return [value + " synthetic mutation"];
    if (typeof value === "number") return [value + 1];
    if (Array.isArray(value))
      return value.flatMap((child, index) =>
        variations(child).map((next) =>
          value.map((v, i) => (i === index ? next : v)),
        ),
      );
    if (typeof value === "object")
      return Object.entries(value).flatMap(([key, child]) =>
        variations(child).map((next) => ({ ...value, [key]: next })),
      );
    throw Error("Unexpected asset payload field");
  }
  for (const changed of variations(lessonFivePrintedAssetPayload)) {
    assert.notEqual(await hash(canonical(changed)), lessonFivePrintedAssetHash);
    mutated++;
  }
  assert.equal(mutated, 52);
});

test("new child presentation rejects wrong participant roles, absent glyphs and substituted plain e", async () => {
  const { envelope } = await syntheticLessonFiveCourse();
  const lesson = envelope.body.lessons[4];
  const task = lesson?.tasks[5];
  if (task?.kind !== "graphControls")
    throw Error("Synthetic child graph required");
  const first = task.task.nodes[0];
  if (first?.kind !== "turn" || first.presentation.kind !== "printedBoard")
    throw Error("Synthetic child response required");
  const mutations = [
    { ...first, parentRole: "model" },
    { ...first, parentRole: "together" },
    { ...first, presentation: { ...first.presentation, focus: "e" } },
    {
      ...first,
      presentation: {
        ...first.presentation,
        board: { ...first.presentation.board, assetHash: "0".repeat(64) },
      },
    },
    {
      ...first,
      presentation: {
        ...first.presentation,
        cue: {
          kind: "childUnderSymbol",
          participant: "parentGuidesChild",
          pace: "slow",
        },
      },
    },
    {
      ...first,
      presentation: {
        ...first.presentation,
        cue: {
          kind: "childUnderSymbol",
          participant: "child",
          pace: "unknown",
        },
      },
    },
  ];
  for (const changed of mutations) {
    const body = {
      ...envelope.body,
      lessons: envelope.body.lessons.map((entry, index) =>
        index !== 4
          ? entry
          : {
              ...entry,
              tasks: entry.tasks.map((entry, index) =>
                index !== 5
                  ? entry
                  : {
                      ...entry,
                      task: {
                        ...task.task,
                        nodes: task.task.nodes.map((node, index) =>
                          index === 0 ? changed : node,
                        ),
                      },
                    },
              ),
            },
      ),
    };
    await assert.rejects(
      parseRuntimePackage(
        { ...envelope, body, packageHash: await hash(canonical(body)) },
        hash,
      ),
      /schema|participant/,
    );
  }
});
