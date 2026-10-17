import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  canonical,
  parseRuntimePackage,
  packageMetadata,
  resolvedLessons,
  printedGlyphAssets,
  printedDiagramAsset,
  printedBoardAssets,
  printedBoardAssetHash,
} from "@readatthree/teaching";
import { syntheticPrintedCourse } from "../printed-board-fixture.ts";
import { hash } from "../lesson-two-fixture.ts";
import { reviewedPrintedCourseExtension } from "../../tools/content/extension.ts";

test("printed V3 has eighteen distinct required acknowledgements and preserves the full predecessor", async () => {
  const previous = await parseRuntimePackage(
    JSON.parse(
      await readFile(
        "tests/fixtures/lesson-two-development-package.json",
        "utf8",
      ),
    ),
    hash,
  );
  const { envelope, content } = await syntheticPrintedCourse();
  assert.deepEqual(
    await reviewedPrintedCourseExtension({
      previous,
      candidate: envelope,
      hash,
    }),
    content,
  );
  assert.deepEqual(
    resolvedLessons(content).map((l) => l.tasks.length),
    [6, 7, 3, 0, 0, 0],
  );
  assert.deepEqual(
    resolvedLessons(content).map((l) => l.lessonTasks.length),
    [6, 7, 8, 7, 9, 8],
  );
  const tasks = resolvedLessons(content)[2]?.tasks ?? [];
  assert.deepEqual(
    tasks.map((e) =>
      "nodes" in e.task
        ? e.task.nodes.filter((n) => n.kind === "normal").length
        : 0,
    ),
    [3, 3, 12],
  );
  assert.equal(resolvedLessons(content)[2]?.completeDefinition, false);
  assert.deepEqual(packageMetadata(content), {
    contentSchemaVersion: 3,
    capabilities: [
      "writing-practice-plan-v2",
      "guidance-runs-v2",
      "printed-board-cues-v2",
    ],
  });
});

test("printed registry hashes bind actual vector, anchor and layout bytes", () => {
  for (const glyph of Object.values(printedGlyphAssets)) {
    const { sha256, ...vector } = glyph;
    assert.equal(
      createHash("sha256").update(canonical(vector)).digest("hex"),
      sha256,
    );
  }
  assert.equal(
    createHash("sha256")
      .update(
        canonical({
          glyphs: printedGlyphAssets,
          diagram: printedDiagramAsset,
          layouts: printedBoardAssets,
        }),
      )
      .digest("hex"),
    printedBoardAssetHash,
  );
});

test("version and nested board boundaries reject unknown capabilities, foreign focus, unchecked assets and legacy widening", async () => {
  const { content } = await syntheticPrintedCourse();
  if (content.body.coverage !== "course-development-v3")
    throw new Error("V3 required");
  const original = content.body;
  const invalid = [
    {
      ...original,
      requiredEngineCapabilities: original.requiredEngineCapabilities.slice(1),
    },
    {
      ...original,
      requiredEngineCapabilities: [
        ...original.requiredEngineCapabilities,
        "unknown",
      ],
    },
    {
      ...original,
      requiredEngineCapabilities: [
        "writing-practice-plan-v2",
        "printed-board-cues-v2",
        "printed-board-cues-v2",
      ],
    },
    {
      ...original,
      coverage: "course-development-v2",
      contentSchemaVersion: 2,
      requiredEngineCapabilities: [
        "writing-practice-plan-v2",
        "guidance-runs-v2",
      ],
    },
    ...[
      { focus: "m" },
      {
        board: {
          assetId: "single-a",
          reviewId: "printed-boards-l03-v1",
          assetHash: "0".repeat(64),
        },
      },
    ].map((change) => ({
      ...original,
      lessons: original.lessons.map((lesson, index) =>
        index === 2
          ? {
              ...lesson,
              tasks: lesson.tasks.map((entry) =>
                entry.kind === "printedGraphV2" && entry.task.number === 1
                  ? {
                      ...entry,
                      task: {
                        ...entry.task,
                        nodes: entry.task.nodes.map((node, i) =>
                          i === 0
                            ? {
                                ...node,
                                presentation: {
                                  ...node.presentation,
                                  ...change,
                                },
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
    })),
  ];
  for (const body of invalid)
    await assert.rejects(() =>
      parseRuntimePackage(
        { formatVersion: 1, packageHash: "0".repeat(64), body },
        async () => "0".repeat(64),
      ),
    );
});
