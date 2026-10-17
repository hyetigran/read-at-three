import assert from "node:assert/strict";
import { test } from "node:test";
import { createGraphBody } from "../../tools/content/graph.ts";
import { createOralBody } from "../../tools/content/oral.ts";
import { createContinuousOralBody } from "../../tools/content/continuous.ts";
import { createWritingBody } from "../../tools/content/writing.ts";
import { parseLessonSources } from "../../tools/content/source.ts";

const task = {
  number: 1,
  title: "Synthetic task",
  sourceContentMarkdown: "Synthetic source data.",
};
const cumulativeError = "The authorized local lesson records are invalid.";
const legacyError = "The authorized local source records are invalid.";
const purposes = ["cumulative", "legacy"] satisfies ("cumulative" | "legacy")[];

test("source records reject missing fields and wrong shapes at every envelope level", () => {
  const malformed: unknown[] = [
    null,
    [],
    {},
    { lessons: null },
    { lessons: {} },
    { lessons: [null] },
    { lessons: [{ tasks: [] }] },
    { lessons: [{ number: 1 }] },
    { lessons: [{ number: "1", tasks: [] }] },
    { lessons: [{ number: 1, tasks: {} }] },
    { lessons: [{ number: 1, tasks: [null] }] },
    ...[
      {},
      { title: task.title, sourceContentMarkdown: task.sourceContentMarkdown },
      { number: 1, sourceContentMarkdown: task.sourceContentMarkdown },
      { number: 1, title: task.title },
      { ...task, number: "1" },
      { ...task, title: null },
      { ...task, title: 1 },
      { ...task, sourceContentMarkdown: null },
      { ...task, sourceContentMarkdown: [] },
    ].map((record) => ({ lessons: [{ number: 1, tasks: [record] }] })),
  ];
  for (const purpose of purposes)
    for (const value of malformed)
      assert.throws(() => parseLessonSources({ value, purpose }), {
        message: purpose === "cumulative" ? cumulativeError : legacyError,
      });
});

test("lesson and task numbers reject fractions and nonfinite values without imposing a bounded integer range", () => {
  for (const purpose of purposes) {
    for (const number of [0.5, -0.5, NaN, Infinity, -Infinity])
      for (const value of [
        { lessons: [{ number, tasks: [task] }] },
        { lessons: [{ number: 1, tasks: [{ ...task, number }] }] },
      ])
        assert.throws(() => parseLessonSources({ value, purpose }), {
          message: purpose === "cumulative" ? cumulativeError : legacyError,
        });
    for (const number of [
      0,
      -1,
      2 ** 31,
      -(2 ** 31) - 1,
      Number.MAX_SAFE_INTEGER + 1,
      Number.MAX_VALUE,
      -Number.MAX_VALUE,
    ]) {
      const value = {
        lessons: [{ number, tasks: [{ ...task, number }] }],
      };
      assert.equal(parseLessonSources({ value, purpose }), value);
    }
  }
});

test("extra source fields remain accepted and unchanged at all three object levels", () => {
  const value = {
    sourceNote: "Synthetic envelope note",
    lessons: [
      {
        number: 1,
        lessonNote: { reviewed: false },
        tasks: [{ ...task, taskNote: ["Synthetic task note"] }],
      },
    ],
  };
  const unchanged = structuredClone(value);
  for (const purpose of purposes) {
    assert.equal(parseLessonSources({ value, purpose }), value);
    assert.deepEqual(value, unchanged);
  }
});

test("cumulative authoring requires nonempty text while legacy source parsing retains empty strings", () => {
  for (const record of [
    { ...task, title: "" },
    { ...task, sourceContentMarkdown: "" },
    { ...task, title: "", sourceContentMarkdown: "" },
  ]) {
    const value = { lessons: [{ number: 1, tasks: [record] }] };
    assert.throws(() => parseLessonSources({ value, purpose: "cumulative" }), {
      message: cumulativeError,
    });
    assert.equal(parseLessonSources({ value, purpose: "legacy" }), value);
  }
  const whitespace = {
    lessons: [
      {
        number: 1,
        tasks: [{ ...task, title: " ", sourceContentMarkdown: "\n" }],
      },
    ],
  };
  assert.equal(
    parseLessonSources({ value: whitespace, purpose: "cumulative" }),
    whitespace,
  );
});

test("public cumulative factories retain graph-first source and curriculum errors", () => {
  for (const createBody of [
    createGraphBody,
    createOralBody,
    createContinuousOralBody,
    createWritingBody,
  ]) {
    assert.throws(() => createBody({ lessons: {}, overviewMarkdown: "" }), {
      message: cumulativeError,
    });
    assert.throws(
      () => createBody({ lessons: { lessons: [] }, overviewMarkdown: "" }),
      { message: "Supplied Lesson 1 needs its six distinct source tasks." },
    );
  }
});
