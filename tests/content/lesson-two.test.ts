import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  canonical,
  parseRuntimePackage,
  resolvedLessons,
  authoredTaskIdentity,
  packageMetadata,
} from "@readatthree/teaching";
import {
  reviewedCourseExtension,
  parseExtensionReview,
} from "../../tools/content/extension.ts";
import { hash } from "../lesson-two-fixture.ts";

test("new synthetic extension contains seven complete activities and preserves exact original authored lesson identities", async () => {
  const before = await parseRuntimePackage(
    JSON.parse(
      await readFile("tests/fixtures/course-development-package.json", "utf8"),
    ),
    hash,
  );
  const bytes = await readFile(
    "tests/fixtures/lesson-two-development-package.json",
    "utf8",
  );
  const content = await reviewedCourseExtension({
    previous: before,
    candidate: JSON.parse(bytes),
    hash,
  });
  assert.deepEqual(
    resolvedLessons(content).map((lesson) => lesson.tasks.length),
    [6, 7, 0, 0, 0, 0],
  );
  assert.equal(resolvedLessons(content)[1]?.completeDefinition, true);
  for (const entry of resolvedLessons(before)[0]?.tasks ?? [])
    assert.equal(
      authoredTaskIdentity({ content: before, taskId: entry.task.id }),
      authoredTaskIdentity({ content, taskId: entry.task.id }),
    );
  assert.deepEqual(packageMetadata(content), {
    contentSchemaVersion: 2,
    capabilities: ["writing-practice-plan-v2", "guidance-runs-v2"],
  });
  function check(value: unknown): void {
    if (value === null || typeof value !== "object") return;
    if (
      "kind" in value &&
      "text" in value &&
      typeof value.text === "string" &&
      ["source", "adapted", "added"].includes(String(value.kind))
    ) {
      assert.equal(value.kind, "added");
      assert.match(value.text, /^Synthetic/);
    }
    for (const child of Object.values(value)) check(child);
  }
  check(JSON.parse(bytes));
  assert.doesNotMatch(
    bytes,
    /book\.|\/Users\/|\.scratch|\.local|lawnmower|sidewalk|ship|mmmaaannn/,
  );
});

test("extension refuses rewrites of retained task definitions and incomplete source-review records", async () => {
  const before = await parseRuntimePackage(
    JSON.parse(
      await readFile("tests/fixtures/course-development-package.json", "utf8"),
    ),
    hash,
  );
  const original = await parseRuntimePackage(
    JSON.parse(
      await readFile(
        "tests/fixtures/lesson-two-development-package.json",
        "utf8",
      ),
    ),
    hash,
  );
  if (original.body.coverage !== "course-development-v2")
    throw new Error("Expected explicit extension");
  const body = {
    ...original.body,
    lessons: original.body.lessons.map((lesson, index) =>
      index === 0 ? { ...lesson, tasks: lesson.tasks.slice(1) } : lesson,
    ),
  };
  const candidate = {
    formatVersion: 1,
    packageHash: await hash(canonical(body)),
    body,
  };
  await assert.rejects(
    () => reviewedCourseExtension({ previous: before, candidate, hash }),
    /preserve existing authored/,
  );
  assert.throws(
    () =>
      parseExtensionReview({
        status: "local-development-review",
        publication: "pending",
      }),
    /missing or unsupported/,
  );
});
