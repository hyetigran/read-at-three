import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  canonicalContentBody,
  parseDevelopmentPackage,
} from "@readatthree/teaching";
import {
  createGraphBody,
  createGraphFixtureBody,
  orderedGuidance,
  verifyGraphInputReview,
} from "../../tools/content/graph.ts";

const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");

function syntheticSources() {
  return {
    lessons: [
      {
        number: 1,
        tasks: Array.from({ length: 6 }, (_value, index) => ({
          number: index + 1,
          title: `Synthetic title ${index + 1}`,
          sourceContentMarkdown:
            index === 0
              ? [
                  "1. (Synthetic m target.) Synthetic m setup. (Synthetic first point.) Synthetic mmm model. (Synthetic release.)",
                  '2. Synthetic response setup. (Synthetic first point.) Synthetic cue. (Synthetic hold.) "mmm."',
                  "> (Synthetic incorrect response.) Synthetic mmm correction. (Synthetic retest route.)",
                  '3. (Synthetic first point.) Synthetic required repetition. (Synthetic hold.) "mmm." Synthetic mmm praise.',
                  "4. (Synthetic s target.) Synthetic s setup. (Synthetic first point.) Synthetic sss model. (Synthetic release.)",
                  '5. Synthetic response setup. (Synthetic first point.) Synthetic cue. (Synthetic hold.) "sss."',
                  "> (Synthetic incorrect response.) Synthetic sss correction. (Synthetic retest route.)",
                  '6. (Synthetic first point.) Synthetic required repetition. (Synthetic hold.) "sss." Synthetic sss praise.',
                ].join("\n\n")
              : index === 3
                ? [
                    '1. Synthetic review setup. (Synthetic first point.) Synthetic cue. (Synthetic hold.) "mmm."',
                    '2. (Synthetic first point.) Synthetic cue. (Synthetic hold.) "sss."',
                  ].join("\n\n")
                : "Synthetic unavailable task data.",
        })),
      },
    ],
  };
}

const syntheticOverview = [
  "## PDF page 6 (printed page 13)",
  "Synthetic duration is three seconds.",
  "## PDF page 15 (printed page 22)",
  "| Synthetic error | Synthetic correction |",
  "| --- | --- |",
  "| Synthetic oral row | Synthetic oral procedure |",
  "",
  "| Synthetic error | Synthetic correction |",
  "| --- | --- |",
  '| Synthetic isolated row | (Synthetic target action.) **Synthetic mmm model.** (Synthetic invitation.) "mmm." **Synthetic mmm praise.** (Synthetic full review route.) |',
  "| Synthetic later row | Synthetic unrelated procedure |",
].join("\n");

test("the explicit synthetic graph fixture is reproducible and contains only added copy", async () => {
  const fixture: unknown = JSON.parse(
    await readFile(
      new URL("../fixtures/graph-development-package.json", import.meta.url),
      "utf8",
    ),
  );
  const parsed = await parseDevelopmentPackage(fixture, hash);
  const body = createGraphFixtureBody();
  assert.deepEqual(parsed.body, body);
  assert.equal(parsed.packageHash, await hash(canonicalContentBody(body)));
  assert.equal(body.courseId, "fixture.course");
  assert.equal(body.lessonId, "fixture.lesson");
  assert.equal(body.tasks[0]?.id, "fixture.task");
  assert.deepEqual(
    body.lessonTasks.map((task) => [task.number, task.optional]),
    [
      [1, false],
      [2, false],
      [3, false],
      [4, false],
      [5, false],
      [6, true],
    ],
  );
  const copies = [
    body.title,
    ...body.lessonTasks.map((task) => task.title),
    ...body.tasks.flatMap((task) => [
      task.title,
      ...task.nodes.flatMap((node) => node.guidance.map((span) => span.copy)),
    ]),
  ];
  assert.ok(copies.length > 50);
  assert.ok(copies.every((copy) => copy.kind === "added"));
  assert.ok(copies.every((copy) => copy.text.startsWith("Synthetic")));
});

test("six introduction obligations and two review obligations keep the prescribed retest topology", () => {
  const body = createGraphFixtureBody();
  const introduction = body.tasks.find((task) => task.number === 1);
  const review = body.tasks.find((task) => task.number === 4);
  assert.ok(introduction);
  assert.ok(review);
  assert.deepEqual(
    introduction.nodes
      .filter((node) => node.kind === "normal")
      .map((node) => [node.glyph, node.parentRole]),
    [
      ["m", "model"],
      ["m", "listen"],
      ["m", "listen"],
      ["s", "model"],
      ["s", "listen"],
      ["s", "listen"],
    ],
  );
  assert.deepEqual(
    introduction.corrections.map((correction) => ({
      eligible: correction.eligibleNodeIds,
      retest: correction.retestNodeIds,
      continuation: correction.continuationNodeId,
    })),
    [
      {
        eligible: [
          "fixture.graph.l01.t01.s02.response-m",
          "fixture.graph.l01.t01.s03.again-m",
        ],
        retest: ["fixture.graph.l01.t01.s02.response-m"],
        continuation: "fixture.graph.l01.t01.s03.again-m",
      },
      {
        eligible: [
          "fixture.graph.l01.t01.s05.response-s",
          "fixture.graph.l01.t01.s06.again-s",
        ],
        retest: ["fixture.graph.l01.t01.s05.response-s"],
        continuation: "fixture.graph.l01.t01.s06.again-s",
      },
    ],
  );
  assert.deepEqual(
    review.nodes
      .filter((node) => node.kind === "normal")
      .map((node) => node.glyph),
    ["m", "s"],
  );
  assert.deepEqual(
    review.corrections.map((correction) => [
      correction.retestNodeIds,
      correction.continuationNodeId,
    ]),
    [
      [
        [
          "fixture.graph.l01.t04.s01.response-m",
          "fixture.graph.l01.t04.s02.response-s",
        ],
        null,
      ],
      [
        [
          "fixture.graph.l01.t04.s01.response-m",
          "fixture.graph.l01.t04.s02.response-s",
        ],
        null,
      ],
    ],
  );
  assert.ok(
    body.tasks.every((task) =>
      task.nodes.every(
        (node) => node.cue.minimumMs === (node.kind === "normal" ? 3000 : null),
      ),
    ),
  );
});

test("ordered guidance preserves interleaved actions, response, and praise without adding a phase", () => {
  const guidance = orderedGuidance({
    text: 'Synthetic setup. (Synthetic point.) Synthetic prompt. (Synthetic hold.) "mmm." Synthetic mmm praise. (Synthetic release.)',
    sourceRef: "synthetic.source",
    adapted: false,
  });
  assert.deepEqual(
    guidance.map((span) => [span.kind, span.copy.text, span.copy.kind]),
    [
      ["speech", "Synthetic setup.", "source"],
      ["action", "(Synthetic point.)", "source"],
      ["speech", "Synthetic prompt.", "source"],
      ["action", "(Synthetic hold.)", "source"],
      ["expected", "mmm.", "adapted"],
      ["praise", "Synthetic mmm praise.", "adapted"],
      ["action", "(Synthetic release.)", "source"],
    ],
  );
  assert.throws(
    () =>
      orderedGuidance({
        text: "Synthetic unmatched (action.",
        sourceRef: "synthetic.source",
        adapted: false,
      }),
    /editorial review/,
  );
});

test("the source adapter preserves task titles, source order, and highlighted s correction substitution", async () => {
  const body = createGraphBody({
    lessons: syntheticSources(),
    overviewMarkdown: syntheticOverview,
  });
  await parseDevelopmentPackage(
    {
      formatVersion: 1,
      packageHash: await hash(canonicalContentBody(body)),
      body,
    },
    hash,
  );
  const introduction = body.tasks.find((task) => task.number === 1);
  const review = body.tasks.find((task) => task.number === 4);
  assert.ok(introduction);
  assert.ok(review);
  assert.deepEqual(
    body.lessonTasks.map((task) => task.title.text),
    [
      "Synthetic title 1",
      "Synthetic title 2",
      "Synthetic title 3",
      "Synthetic title 4",
      "Synthetic title 5",
      "Synthetic title 6",
    ],
  );
  assert.deepEqual(
    introduction.nodes
      .find((node) => node.id === "l01.t01.s03.again-m")
      ?.guidance.map((span) => span.kind),
    ["action", "speech", "action", "expected", "praise"],
  );
  assert.deepEqual(
    review.nodes
      .find((node) => node.id === "l01.t04.s01.response-m")
      ?.guidance.map((span) => span.kind),
    ["speech", "action", "speech", "action", "expected"],
  );
  const correction = review.nodes.find(
    (node) => node.id === "l01.t04.correction-s",
  );
  assert.ok(correction);
  assert.deepEqual(
    correction.guidance.map((span) => span.kind),
    ["action", "speech", "action", "expected", "praise", "action"],
  );
  assert.ok(correction.guidance.every((span) => span.copy.kind === "adapted"));
  assert.ok(
    correction.guidance.some(
      (span) => span.copy.text === "Synthetic sss model.",
    ),
  );
  assert.ok(
    correction.guidance.every((span) => !span.copy.text.includes("mmm")),
  );
  assert.ok(
    body.tasks
      .flatMap((task) => task.nodes)
      .filter((node) => node.kind === "normal")
      .every((node) =>
        node.sourceRefs.includes("book.printed13.pronunciation.continuous"),
      ),
  );
});

test("missing curriculum, changed turn counts, and missing overview policy fail before package generation", () => {
  assert.throws(
    () => createGraphBody({ lessons: {}, overviewMarkdown: syntheticOverview }),
    /records are invalid/,
  );
  const duplicate = syntheticSources();
  const first = duplicate.lessons[0]?.tasks[0];
  if (!first) throw new Error("Synthetic source is incomplete.");
  first.number = 2;
  assert.throws(
    () =>
      createGraphBody({
        lessons: duplicate,
        overviewMarkdown: syntheticOverview,
      }),
    /six distinct/,
  );
  const fewer = syntheticSources();
  const intro = fewer.lessons[0]?.tasks[0];
  if (!intro) throw new Error("Synthetic source is incomplete.");
  intro.sourceContentMarkdown = intro.sourceContentMarkdown.replace(
    /^6\..+$/m,
    "",
  );
  assert.throws(
    () =>
      createGraphBody({ lessons: fewer, overviewMarkdown: syntheticOverview }),
    /turn count changed/,
  );
  assert.throws(
    () =>
      createGraphBody({
        lessons: syntheticSources(),
        overviewMarkdown: syntheticOverview.replace(
          "printed page 22",
          "printed page 23",
        ),
      }),
    /overview page is missing/,
  );
  assert.throws(
    () =>
      createGraphBody({
        lessons: syntheticSources(),
        overviewMarkdown: syntheticOverview.replace(
          "three seconds",
          "unspecified duration",
        ),
      }),
    /timing source is missing/,
  );
});

test("the frozen v1 fixture remains byte-identical alongside the new graph fixture", async () => {
  const bytes = await readFile(
    new URL("../fixtures/development-package.json", import.meta.url),
  );
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    "769d119a58fd0781328fabc70e665f9b42968dfb05ae4648955dc7d174325a37",
  );
});

test("changed source or scan bytes cannot inherit a previous local editorial review", () => {
  const sources = [
    { path: "synthetic.source", sha256: "a".repeat(64) },
    { path: "synthetic.overview", sha256: "b".repeat(64) },
  ];
  const scans = [
    { path: "synthetic.scan1", sha256: "c".repeat(64) },
    { path: "synthetic.scan2", sha256: "d".repeat(64) },
    { path: "synthetic.scan3", sha256: "e".repeat(64) },
  ];
  const review = {
    status: "local-development-review",
    reviewedOn: "2026-10-16",
    sources,
    scans,
  };
  assert.equal(
    verifyGraphInputReview({ review, sources, scans }).reviewedOn,
    "2026-10-16",
  );
  assert.throws(
    () => verifyGraphInputReview({ review: {}, sources, scans }),
    /missing or invalid/,
  );
  assert.throws(
    () =>
      verifyGraphInputReview({
        review,
        sources: [
          ...sources,
          { path: "synthetic.changed", sha256: "f".repeat(64) },
        ],
        scans,
      }),
    /Source inputs changed/,
  );
  assert.throws(
    () =>
      verifyGraphInputReview({
        review,
        sources,
        scans: [
          { path: "synthetic.scan1", sha256: "f".repeat(64) },
          ...scans.slice(1),
        ],
      }),
    /Source inputs changed/,
  );
});
