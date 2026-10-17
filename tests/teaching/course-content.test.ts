import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { test } from "node:test";
import {
  parseRuntimePackage,
  resolvedLessons,
} from "../../packages/teaching/src/index.ts";

test("cumulative input is immutable before asynchronous hash verification and resolved lesson views keep the enclosing package", async () => {
  const input: unknown = JSON.parse(
    await readFile("tests/fixtures/course-development-package.json", "utf8"),
  );
  let witnessed = false;
  const content = await parseRuntimePackage(input, async (text) => {
    assert.equal(Object.isFrozen(input), true);
    witnessed = true;
    await Promise.resolve();
    return createHash("sha256").update(text).digest("hex");
  });
  assert.equal(witnessed, true);
  const lessons = resolvedLessons(content);
  assert.equal(Object.isFrozen(lessons), true);
  assert.equal(Object.isFrozen(lessons[0]), true);
  assert.equal(lessons[0]?.enclosing, content);
  assert.equal(resolvedLessons(content), lessons);
  assert.ok(lessons.slice(1).every((lesson) => !lesson.completeDefinition));
});
