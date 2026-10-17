import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  canonicalContentBody,
  parseDevelopmentPackage,
} from "@readatthree/teaching";
import { createGraphFixtureBody } from "../../tools/content/graph.ts";
import {
  createOralBody,
  createOralFixtureBody,
  oralGuidance,
} from "../../tools/content/oral.ts";

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
                  "1. (Synthetic m target.) Synthetic m setup. (Synthetic point.) Synthetic mmm model.",
                  '2. Synthetic response. (Synthetic point.) "mmm."',
                  "> (Synthetic mistake.) Synthetic mmm model. (Synthetic return.)",
                  '3. Synthetic repetition. "mmm." Synthetic praise.',
                  "4. (Synthetic s target.) Synthetic s setup. (Synthetic point.) Synthetic sss model.",
                  '5. Synthetic response. (Synthetic point.) "sss."',
                  "> (Synthetic mistake.) Synthetic sss model. (Synthetic return.)",
                  '6. Synthetic repetition. "sss." Synthetic praise.',
                ].join("\n\n")
              : index === 1
                ? [
                    "1. Synthetic model. unit (pause) one. (Synthetic delay.) Synthetic whole model.",
                    '2. Synthetic response. unit (pause) one. (Synthetic delay.) Synthetic prompt. "unitone." (Synthetic repeat step 2 until firm.)',
                    '> (Synthetic mistake example, "unit [pause] one":) Synthetic whole model. "unitone." Synthetic repeat invitation. (Synthetic repeat step 2.)',
                    '3. Synthetic new item: unit (pause) two. (Synthetic delay.) Synthetic prompt. "unittwo."',
                    '4. Synthetic new item: unit (pause) three. (Synthetic delay.) Synthetic prompt. "unitthree."',
                    '5. Synthetic new item: unit (pause) four. (Synthetic delay.) Synthetic prompt. "unitfour."',
                    '6. Synthetic new item: mmmuuu. (Synthetic delay.) Synthetic prompt. "mu."',
                    '7. Synthetic new item: iiizzz. (Synthetic delay.) Synthetic prompt. "iz."',
                    "8. (Synthetic repeat troublesome items.)",
                  ].join("\n\n")
                : index === 3
                  ? [
                      '1. Synthetic review m. (Synthetic point.) "mmm."',
                      '2. Synthetic review s. (Synthetic point.) "sss."',
                    ].join("\n\n")
                  : index === 4
                    ? [
                        '1. Synthetic introduction. Listen: unit (pause) five. Synthetic prompt. "unitfive."',
                        '2. mmmuuu. (Synthetic delay.) Synthetic prompt. "mu." iiizzz. (Synthetic delay.) Synthetic prompt. "iz." zzzuuu. (Synthetic delay.) Synthetic prompt. "zu."',
                      ].join("\n\n")
                    : "Synthetic unavailable source data.",
        })),
      },
    ],
  };
}

const syntheticOverview = [
  "## PDF page 6 (printed page 13)",
  "Synthetic duration is three seconds.",
  "## PDF page 15 (printed page 22)",
  "### Oral Tasks Corrections",
  "| Synthetic error | Synthetic correction |",
  "| --- | --- |",
  "| Synthetic oral blending | Synthetic unrelated procedure |",
  '| Synthetic fast row | (Synthetic slow mistake.) **Synthetic FAST model: IZ. Synthetic listen... iiizzz. Synthetic FAST prompt!** "iz." **Synthetic FAST praise!** (Synthetic quiet mistake.) **Synthetic QUIETLY model. Synthetic listen... iiizzz. Iz. Synthetic FAST prompt!** "iz." **Synthetic quiet praise!** (Synthetic repeat exercise from first step.) |',
  "",
  "### Written Tasks Corrections",
  "| Synthetic error | Synthetic correction |",
  "| --- | --- |",
  '| Synthetic isolated row | (Synthetic target action.) **Synthetic mmm model.** (Synthetic invitation.) "mmm." **Synthetic mmm praise.** (Synthetic full review route.) |',
].join("\n");

test("the cumulative oral fixture is reproducible and preserves printed task definitions", async () => {
  const raw: unknown = JSON.parse(
    await readFile(
      new URL("../fixtures/oral-development-package.json", import.meta.url),
      "utf8",
    ),
  );
  const parsed = await parseDevelopmentPackage(raw, hash);
  const body = createOralFixtureBody();
  assert.deepEqual(parsed.body, body);
  assert.equal(parsed.packageHash, await hash(canonicalContentBody(body)));
  assert.deepEqual(body.lessonTasks, createGraphFixtureBody().lessonTasks);
  assert.deepEqual(
    body.tasks.map(({ kind, task }) => [kind, task.id, task.number]),
    [
      ["printedGraphV1", "fixture.task", 1],
      ["graphControls", "fixture.graph.l01.t02", 2],
      ["printedGraphV1", "fixture.graph.l01.t04", 4],
      ["graphControls", "fixture.graph.l01.t05", 5],
    ],
  );
  assert.deepEqual(
    body.tasks.flatMap((entry) =>
      entry.kind === "printedGraphV1" ? [entry.task] : [],
    ),
    createGraphFixtureBody().tasks,
  );
  const copies = body.tasks.flatMap(({ task }) => [
    task.title,
    ...task.corrections.flatMap((correction) =>
      "label" in correction ? [correction.label] : [],
    ),
    ...task.nodes.flatMap((node) => node.guidance.map((span) => span.copy)),
    ...task.nodes.flatMap((node) =>
      node.kind === "selectiveReview"
        ? node.items.map((item) => item.parentLabel)
        : [],
    ),
  ]);
  assert.ok(copies.every((copy) => copy.kind === "added"));
  assert.ok(copies.every((copy) => copy.text.startsWith("Synthetic")));
});

test("Task 2 has a model, six independent item identities, readiness and required review", () => {
  const entry = createOralFixtureBody().tasks.find(
    ({ task }) => task.number === 2,
  );
  assert.ok(entry?.kind === "graphControls");
  const { task } = entry;
  const turns = task.nodes
    .filter((node) => node.kind === "turn")
    .filter((node) => node.route === "normal");
  assert.deepEqual(
    turns.map((node) => [node.id, node.parentRole, node.itemId]),
    [
      ["fixture.graph.l01.t02.model", "model", "fixture.graph.l01.t02.item-01"],
      ...Array.from({ length: 6 }, (_value, index) => [
        `fixture.graph.l01.t02.response-0${index + 1}`,
        "listen",
        `fixture.graph.l01.t02.item-0${index + 1}`,
      ]),
    ],
  );
  assert.ok(
    turns.every(
      (node) =>
        node.presentation.kind === "oral" &&
        !("glyph" in node) &&
        !("cue" in node),
    ),
  );
  const gate = task.nodes.find((node) => node.kind === "untilFirm");
  assert.ok(gate?.kind === "untilFirm");
  assert.equal(gate.cycleEntryNodeId, "fixture.graph.l01.t02.response-01");
  assert.equal(gate.cycleExitNodeId, gate.cycleEntryNodeId);
  const selection = task.nodes.find((node) => node.kind === "selectiveReview");
  assert.ok(selection?.kind === "selectiveReview");
  assert.deepEqual(
    selection.items.map((item) => [
      item.itemId,
      item.entryNodeId,
      item.exitNodeId,
    ]),
    Array.from({ length: 6 }, (_value, index) => [
      `fixture.graph.l01.t02.item-0${index + 1}`,
      `fixture.graph.l01.t02.response-0${index + 1}`,
      index === 0
        ? "fixture.graph.l01.t02.first-item-firm"
        : `fixture.graph.l01.t02.response-0${index + 1}`,
    ]),
  );
  assert.equal(selection.returnNodeId, selection.id);
  assert.equal(selection.exitNodeId, "fixture.graph.l01.t02.review-exit");
});

test("source and synthetic oral authoring have identical control and correction topology", () => {
  const topology = (body: ReturnType<typeof createOralBody>) =>
    JSON.stringify(
      body.tasks.flatMap((entry) =>
        entry.kind === "graphControls"
          ? [
              {
                id: entry.task.id,
                number: entry.task.number,
                startNodeId: entry.task.startNodeId,
                nodes: entry.task.nodes.map((node) => {
                  const { guidance, sourceRefs, ...definition } = node;
                  return node.kind === "selectiveReview"
                    ? {
                        ...definition,
                        items: node.items.map(
                          ({ parentLabel, ...item }) => item,
                        ),
                      }
                    : definition;
                }),
                corrections: entry.task.corrections.map(
                  ({ sourceRefs, label, ...correction }) => correction,
                ),
              },
            ]
          : [],
      ),
    ).replaceAll("fixture.graph.", "");
  assert.equal(
    topology(createOralFixtureBody()),
    topology(
      createOralBody({
        lessons: syntheticSources(),
        overviewMarkdown: syntheticOverview,
      }),
    ),
  );
});

test("normal corrections restart the source exercise while review corrections preserve only the current selected item", () => {
  const entry = createOralFixtureBody().tasks.find(
    ({ task }) => task.number === 2,
  );
  assert.ok(entry?.kind === "graphControls");
  const prefix = "fixture.graph.l01.t02";
  const correction = (suffix: string) =>
    entry.task.corrections.find((item) => item.id === `${prefix}.${suffix}`);
  assert.deepEqual(correction("correction-slow-1.any")?.retestNodeIds, [
    `${prefix}.response-01`,
    `${prefix}.first-item-firm`,
  ]);
  assert.deepEqual(correction("correction-slow-3.normal")?.retestNodeIds, [
    `${prefix}.model`,
    `${prefix}.response-01`,
    `${prefix}.first-item-firm`,
    `${prefix}.response-02`,
    `${prefix}.response-03`,
  ]);
  assert.deepEqual(correction("correction-slow-3.review")?.retestNodeIds, [
    `${prefix}.response-03`,
  ]);
  assert.deepEqual(correction("correction-quiet-1.normal")?.retestNodeIds, [
    `${prefix}.model`,
    `${prefix}.response-01`,
    `${prefix}.first-item-firm`,
  ]);
  assert.deepEqual(correction("correction-quiet-1.review")?.retestNodeIds, [
    `${prefix}.response-01`,
    `${prefix}.first-item-firm`,
  ]);
});

test("source authoring separates all four Task 5 responses and highlights adapted general corrections", () => {
  const body = createOralBody({
    lessons: syntheticSources(),
    overviewMarkdown: syntheticOverview,
  });
  const entry = body.tasks.find(({ task }) => task.number === 5);
  assert.ok(entry?.kind === "graphControls");
  assert.deepEqual(
    [...new Set(entry.task.corrections.map((item) => item.label.text))],
    ["Say it fast", "Speak quietly"],
  );
  assert.ok(
    entry.task.corrections.every((item) => item.label.kind === "added"),
  );
  const turns = entry.task.nodes
    .filter((node) => node.kind === "turn")
    .filter((node) => node.route === "normal");
  assert.deepEqual(
    turns.map((node) =>
      node.guidance
        .filter((span) => span.kind === "expected")
        .map((span) => span.copy.text),
    ),
    [["unitfive."], ["mu."], ["iz."], ["zu."]],
  );
  assert.deepEqual(
    turns.map((node) => node.sourceRefs[0]),
    [
      "book.printed32.l01.t05.s01.turn1",
      "book.printed32.l01.t05.s02.turn1",
      "book.printed32.l01.t05.s02.turn2",
      "book.printed32.l01.t05.s02.turn3",
    ],
  );
  assert.deepEqual(
    entry.task.corrections.find(
      (item) => item.id === "l01.t05.correction-slow-3.normal",
    )?.retestNodeIds,
    ["l01.t05.response-01", "l01.t05.response-02", "l01.t05.response-03"],
  );
  const quiet = entry.task.nodes.find(
    (node) => node.id === "l01.t05.correction-quiet-1.instruction",
  );
  assert.ok(quiet);
  assert.ok(quiet.guidance.every((span) => span.copy.kind === "adapted"));
  assert.ok(
    quiet.guidance.some(
      (span) =>
        span.kind === "speech" &&
        span.copy.text === "five. Unitfive. Synthetic FAST prompt!",
    ),
  );
  assert.ok(
    quiet.guidance.some(
      (span) => span.kind === "expected" && span.copy.text === "unitfive.",
    ),
  );
  const slow = entry.task.nodes.find(
    (node) => node.id === "l01.t05.correction-slow-1.instruction",
  );
  assert.equal(slow?.guidance.at(-1)?.kind, "action");
  assert.equal(
    slow?.guidance.at(-1)?.copy.text,
    "(Synthetic repeat exercise from first step.)",
  );
});

test("Task 2's direct correction keeps supported response, new parent speech and source retest distinct", () => {
  const body = createOralBody({
    lessons: syntheticSources(),
    overviewMarkdown: syntheticOverview,
  });
  const entry = body.tasks.find(({ task }) => task.number === 2);
  assert.ok(entry?.kind === "graphControls");
  const direct = entry.task.nodes.find(
    (node) => node.id === "l01.t02.correction-slow-1.instruction",
  );
  assert.deepEqual(
    direct?.guidance.map((span) => span.kind),
    ["action", "speech", "expected", "speech", "action"],
  );
  assert.deepEqual(
    direct?.guidance
      .filter((span) => span.kind === "expected")
      .map((span) => span.copy.text),
    ["unitone."],
  );
});

test("oral span parsing does not turn a later parent prompt into praise", () => {
  const spans = oralGuidance({
    text: '(Synthetic action.) Synthetic model. "Synthetic response." Synthetic next parent prompt.',
    sourceRef: "synthetic.reference",
    afterExpected: "speech",
  });
  assert.deepEqual(
    spans.map((span) => [span.kind, span.copy.kind]),
    [
      ["action", "source"],
      ["speech", "source"],
      ["expected", "adapted"],
      ["speech", "source"],
    ],
  );
  assert.throws(
    () =>
      oralGuidance({
        text: "Synthetic unmatched (action.",
        sourceRef: "synthetic.reference",
        afterExpected: "speech",
      }),
    /editorial review/,
  );
});

test("changed source response counts cannot become oral packages", () => {
  const source = syntheticSources();
  const task = source.lessons[0]?.tasks[4];
  assert.ok(task);
  task.sourceContentMarkdown = task.sourceContentMarkdown.replace(
    ' zzzuuu. (Synthetic delay.) Synthetic prompt. "zu."',
    "",
  );
  assert.throws(
    () =>
      createOralBody({ lessons: source, overviewMarkdown: syntheticOverview }),
    /all three/,
  );
});

test("the frozen printed and legacy public fixture bytes remain unchanged", async () => {
  const values = [
    [
      "graph-development-package.json",
      "fbfa93afb1423867bcfe9bec3eae434cfafd25f9d335a3fc4a9296468cd4636b",
    ],
    [
      "development-package.json",
      "769d119a58fd0781328fabc70e665f9b42968dfb05ae4648955dc7d174325a37",
    ],
  ];
  for (const [filename, expected] of values) {
    assert.ok(filename);
    const bytes = await readFile(
      new URL(`../fixtures/${filename}`, import.meta.url),
    );
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected);
  }
});
