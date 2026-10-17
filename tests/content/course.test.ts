import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import canonicalize from "canonicalize";
import {
  parseDevelopmentPackage,
  parseRuntimePackage,
} from "@readatthree/teaching";
import {
  courseInventoryHash,
  courseTaskCounts,
  createCourseBody,
  createCourseFixtureBody,
  reviewedCourseInventory,
  verifyCourseInputReview,
} from "../../tools/content/course.ts";
import type { CourseInputReview } from "../../tools/content/course.ts";

const digest = (text: string) =>
  createHash("sha256").update(text).digest("hex");
const hash = async (text: string) => digest(text);
function canonical(value: unknown) {
  const text = canonicalize(value);
  if (text === undefined)
    throw new Error("Synthetic input is not serializable.");
  return text;
}
async function fixture() {
  const bytes = await readFile(
    "tests/fixtures/writing-development-package.json",
    "utf8",
  );
  const basePackage = await parseDevelopmentPackage(JSON.parse(bytes), hash);
  assert.ok(basePackage.body.coverage === "lesson1-complete");
  const body = createCourseFixtureBody({ base: basePackage.body });
  const lessons = {
    lessons: body.lessons.map((lesson) => ({
      number: lesson.number,
      tasks: lesson.lessonTasks.map((task) => ({
        number: task.number,
        title: task.title.text,
        sourceContentMarkdown: `Synthetic source data for lesson ${lesson.number} task ${task.number}.`,
      })),
    })),
  };
  const sources = [
    { path: "synthetic-source.json", sha256: digest(JSON.stringify(lessons)) },
    {
      path: "synthetic-transcription.md",
      sha256: digest("Synthetic transcription."),
    },
  ];
  const scans = [
    { path: "synthetic-scan.png", sha256: digest("Synthetic scan.") },
  ];
  const review: CourseInputReview = {
    status: "local-development-review",
    reviewedOn: "2026-10-17",
    sources,
    scans,
    basePackage: {
      path: "tests/fixtures/writing-development-package.json",
      sha256: digest(bytes),
      packageHash: basePackage.packageHash,
    },
    catalogSha256: "",
    lessons: body.lessons.map((lesson, index) => ({
      lessonId:
        index === 0
          ? lesson.lessonId
          : `l${String(lesson.number).padStart(2, "0")}`,
      number: lesson.number,
      title: lesson.title,
      printedPage: lesson.number,
      headingRegion: "Synthetic heading bounds 0,0,100,40.",
      tasks: lesson.lessonTasks.map((task) => ({
        taskId:
          index === 0
            ? task.id
            : `l${String(lesson.number).padStart(2, "0")}.t${String(task.number).padStart(2, "0")}`,
        number: task.number,
        rawTitle: task.title.text,
        title: task.title,
        titleDecision: "exact-heading",
        titleReviewNote: "Synthetic heading reviewed literally.",
        sourceContentSha256: digest(
          `Synthetic source data for lesson ${lesson.number} task ${task.number}.`,
        ),
        optional: task.optional,
        optionalEvidence: "Synthetic final writing task decision.",
        artKey: task.artKey,
        roleEvidence: "Synthetic explicit activity-role review.",
        printedPage: lesson.number,
        scanPath: "synthetic-scan.png",
        headingRegion: "Synthetic heading bounds 0,50,100,90.",
      })),
    })),
  };
  review.catalogSha256 = courseInventoryHash(reviewedCourseInventory(review));
  return {
    lessons,
    review,
    sources,
    scans,
    basePackage,
    basePackageFile: { path: review.basePackage.path, sha256: digest(bytes) },
    body,
  };
}
function rebind(review: CourseInputReview) {
  review.catalogSha256 = courseInventoryHash(reviewedCourseInventory(review));
}

test("course fixture reproduces the complete six-lesson catalog while preserving exact executable Lesson 1", async () => {
  const input = await fixture();
  const bytes = await readFile(
    "tests/fixtures/course-development-package.json",
    "utf8",
  );
  const content = await parseRuntimePackage(JSON.parse(bytes), hash);
  assert.ok(content.body.coverage === "course-development");
  assert.deepEqual(content.body, input.body);
  assert.equal(content.packageHash, digest(canonical(input.body)));
  assert.deepEqual(
    content.body.lessons.map((lesson) => lesson.lessonTasks.length),
    [6, 7, 8, 7, 9, 8],
  );
  assert.equal(
    content.body.lessons.flatMap((lesson) => lesson.lessonTasks).length,
    45,
  );
  assert.deepEqual(
    content.body.lessons[0]?.tasks,
    input.basePackage.body.coverage === "lesson1-complete"
      ? input.basePackage.body.tasks
      : [],
  );
  assert.deepEqual(
    content.body.lessons.slice(1).map((lesson) => lesson.tasks),
    [[], [], [], [], []],
  );
  assert.equal(
    content.body.lessons
      .flatMap((lesson) => lesson.lessonTasks)
      .every((task) => task.title.kind === "added"),
    true,
  );
  assert.equal(
    /sourceContentMarkdown|scanPath|\.local\/|output\/|book\.printed/.test(
      bytes,
    ),
    false,
  );
  assert.deepEqual(
    new Set(
      content.body.lessons.flatMap((lesson) =>
        lesson.lessonTasks.map((task) => task.artKey),
      ),
    ),
    new Set([
      "printedSound",
      "printedReview",
      "oralBlending",
      "oralSounds",
      "printedSlowFast",
      "parentPointing",
      "childPointing",
      "rhyming",
      "writing",
    ]),
  );
});

test("reviewed authoring preserves source order, exact L1 definitions and absent later teaching", async () => {
  const input = await fixture();
  const body = createCourseBody(input);
  const content = await parseRuntimePackage(
    { formatVersion: 1, body, packageHash: digest(canonical(body)) },
    hash,
  );
  assert.equal(content.body.coverage, "course-development");
  assert.deepEqual(
    body.lessons.map((lesson) => lesson.lessonTasks.length),
    courseTaskCounts,
  );
  assert.deepEqual(body.lessons[0]?.tasks, input.body.lessons[0]?.tasks);
  assert.deepEqual(
    body.lessons[0]?.lessonTasks,
    input.body.lessons[0]?.lessonTasks,
  );
  assert.equal(
    body.lessons.slice(1).every((lesson) => lesson.tasks.length === 0),
    true,
  );
  assert.deepEqual(
    body.lessons.map((lesson) =>
      lesson.lessonTasks
        .filter((task) => task.optional)
        .map((task) => task.number),
    ),
    [[6], [7], [8], [7], [9], [8]],
  );
  assert.equal(
    /sourceContentMarkdown|headingRegion|roleEvidence|synthetic-scan/.test(
      JSON.stringify(body),
    ),
    false,
  );
});

test("missing review and changed source, scan, package or metadata identities stop course preparation", async () => {
  const input = await fixture();
  assert.throws(
    () => createCourseBody({ ...input, review: null }),
    /source review is missing or invalid/,
  );
  for (const review of [
    { ...input.review, sources: [] },
    { ...input.review, scans: [] },
    {
      ...input.review,
      basePackage: {
        ...input.review.basePackage,
        sha256: digest("changed package"),
      },
    },
    { ...input.review, catalogSha256: digest("unreviewed metadata") },
  ])
    assert.throws(
      () => createCourseBody({ ...input, review }),
      /changed|identity/,
    );
  const unknownMapping: unknown = {
    ...input.review,
    lessons: input.review.lessons.map((lesson, index) =>
      index === 1
        ? {
            ...lesson,
            tasks: lesson.tasks.map((task, taskIndex) =>
              taskIndex === 0 ? { ...task, artKey: "titleGuess" } : task,
            ),
          }
        : lesson,
    ),
  };
  assert.throws(
    () => createCourseBody({ ...input, review: unknownMapping }),
    /source review is missing or invalid/,
  );
  assert.equal(
    verifyCourseInputReview({
      review: input.review,
      sources: input.sources,
      scans: input.scans,
      basePackage: input.review.basePackage,
    }),
    input.review,
  );
});

test("source membership and literal heading checks reject invented future titles even after metadata is rehashed", async () => {
  const input = await fixture();
  const review = structuredClone(input.review);
  const task = review.lessons[4]?.tasks[3];
  assert.ok(task);
  task.title = { kind: "added", text: "Unreviewed replacement heading" };
  rebind(review);
  assert.throws(
    () => createCourseBody({ ...input, review }),
    /task mapping or source membership/,
  );
  task.rawTitle = task.title.text;
  rebind(review);
  assert.throws(
    () => createCourseBody({ ...input, review }),
    /task mapping or source membership/,
  );
  const changedRaw = structuredClone(input.lessons);
  const rawTask = changedRaw.lessons[2]?.tasks[0];
  assert.ok(rawTask);
  rawTask.sourceContentMarkdown += " Changed source step.";
  assert.throws(
    () => createCourseBody({ ...input, lessons: changedRaw }),
    /task mapping or source membership/,
  );
});

test("reviewed scan overrides are explicit and do not rewrite original raw titles or L1 definitions", async () => {
  const input = await fixture();
  const review = structuredClone(input.review);
  const task = review.lessons[4]?.tasks[3];
  assert.ok(task);
  const originalRawTitle = task.rawTitle;
  task.title = {
    kind: "source",
    text: "Synthetic scan-verified heading",
    sourceRef: "fixture.catalog.verified.heading",
  };
  task.titleDecision = "scan-verified-override";
  task.titleReviewNote =
    "Synthetic scan verified a punctuation encoding difference; original raw bytes remain unchanged.";
  rebind(review);
  const body = createCourseBody({ ...input, review });
  assert.equal(
    body.lessons[4]?.lessonTasks[3]?.title.text,
    "Synthetic scan-verified heading",
  );
  assert.equal(task.rawTitle, originalRawTitle);
  const first = review.lessons[0]?.tasks[0];
  assert.ok(first);
  first.title = { kind: "added", text: "Changed L1 executable title" };
  first.titleDecision = "scan-verified-override";
  rebind(review);
  assert.throws(
    () => createCourseBody({ ...input, review }),
    /preserve the exact existing Lesson 1 catalog/,
  );
});

test("numbering, optional decisions and explicit activity roles are required source mappings", async () => {
  const input = await fixture();
  for (const mutate of [
    (review: CourseInputReview) => {
      const task = review.lessons[1]?.tasks[0];
      assert.ok(task);
      task.optional = true;
    },
    (review: CourseInputReview) => {
      const task = review.lessons[2]?.tasks[7];
      assert.ok(task);
      task.artKey = "oralSounds";
    },
    (review: CourseInputReview) => {
      const task = review.lessons[3]?.tasks[0];
      assert.ok(task);
      task.roleEvidence = "";
    },
    (review: CourseInputReview) => {
      const task = review.lessons[4]?.tasks[0];
      assert.ok(task);
      task.scanPath = "unreviewed-scan.png";
    },
    (review: CourseInputReview) => {
      const lesson = review.lessons[5];
      assert.ok(lesson);
      lesson.tasks.reverse();
    },
  ]) {
    const review = structuredClone(input.review);
    mutate(review);
    rebind(review);
    assert.throws(
      () => createCourseBody({ ...input, review }),
      /task mapping or source membership/,
    );
  }
  const sources = structuredClone(input.lessons);
  sources.lessons.reverse();
  assert.throws(
    () => createCourseBody({ ...input, lessons: sources }),
    /lesson order or source membership/,
  );
});

test("runtime verifier rejects changed package bytes and mismatched runnable catalog membership", async () => {
  const { body } = await fixture();
  const wrongHash = {
    formatVersion: 1,
    body,
    packageHash: digest("changed body"),
  };
  await assert.rejects(parseRuntimePackage(wrongHash, hash), /hash mismatch/);
  const changed = {
    ...body,
    lessons: body.lessons.map((lesson, index) =>
      index === 0
        ? {
            ...lesson,
            lessonTasks: lesson.lessonTasks.map((task, taskIndex) =>
              taskIndex === 0
                ? {
                    ...task,
                    title: {
                      kind: "added",
                      text: "Synthetic catalog differs from exact executable title",
                    },
                  }
                : task,
            ),
          }
        : lesson,
    ),
  };
  await assert.rejects(
    parseRuntimePackage(
      {
        formatVersion: 1,
        body: changed,
        packageHash: digest(canonical(changed)),
      },
      hash,
    ),
    /task membership/,
  );
});
