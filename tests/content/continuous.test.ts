import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  canonical,
  canonicalContentBody,
  parseDevelopmentPackage,
} from "@readatthree/teaching";
import {
  createContinuousOralBody,
  createContinuousOralFixtureBody,
} from "../../tools/content/continuous.ts";
import type { ControlNode, Serialized } from "@readatthree/teaching";
import { createOralFixtureBody } from "../../tools/content/oral.ts";
const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
function sources() {
  const tasks = [
    [
      "1. (Synthetic m target.) Synthetic m setup. (Synthetic point.) Synthetic mmm model.",
      '2. Synthetic response. (Synthetic point.) "mmm."',
      "> (Synthetic mistake.) Synthetic mmm model. (Synthetic return.)",
      '3. Synthetic repetition. "mmm." Synthetic praise.',
      "4. (Synthetic s target.) Synthetic s setup. (Synthetic point.) Synthetic sss model.",
      '5. Synthetic response. (Synthetic point.) "sss."',
      "> (Synthetic mistake.) Synthetic sss model. (Synthetic return.)",
      '6. Synthetic repetition. "sss." Synthetic praise.',
    ],
    [
      "1. Synthetic model. unit (pause) one. (Synthetic delay.) Synthetic whole model.",
      '2. Synthetic response. unit (pause) one. (Synthetic delay.) Synthetic prompt. "unitone." (Synthetic repeat step 2 until firm.)',
      '> (Synthetic mistake example, "unit [pause] one":) Synthetic whole model. "unitone." Synthetic invitation. (Synthetic repeat.)',
      ...[3, 4, 5].map(
        (step) =>
          `${step}. Synthetic item: unit (pause) ${step}. (Synthetic delay.) Synthetic prompt. "unit${step}."`,
      ),
      '6. Synthetic item: mmmuuu. (Synthetic delay.) Synthetic prompt. "mu."',
      '7. Synthetic item: iiizzz. (Synthetic delay.) Synthetic prompt. "iz."',
      "8. (Synthetic troublesome review.)",
    ],
    [
      '1. Synthetic continuous model: aaazzz. (Synthetic continuous hold.) Synthetic joint invitation. "aaazzz."',
      '2. Synthetic Again invitation. "aaazzz." (Synthetic joint readiness.)',
      '3. Synthetic independent invitation. "aaazzz."',
      '> (Synthetic stop example.) Synthetic correction model: aaazzz. Synthetic joint invitation. "aaazzz." (Synthetic joint readiness.)',
      '4. Synthetic joint invitation: iiivvv. "iiivvv." Synthetic Again. (Synthetic local response with parent.) Synthetic independent invitation. "iiivvv."',
      '5. Synthetic joint invitation: uuuzzz. "uuuzzz." Synthetic Again. (Synthetic joint readiness.) Synthetic independent invitation. "uuuzzz." Synthetic final praise.',
    ],
    [
      '1. Synthetic review m. (Synthetic point.) "mmm."',
      '2. Synthetic review s. (Synthetic point.) "sss."',
    ],
    [
      '1. Synthetic introduction. Listen: unit (pause) five. Synthetic prompt. "unitfive."',
      '2. mmmuuu. (Synthetic delay.) Synthetic prompt. "mu." iiizzz. (Synthetic delay.) Synthetic prompt. "iz." zzzuuu. (Synthetic delay.) Synthetic prompt. "zu."',
    ],
    ["Synthetic optional source data."],
  ];
  const lessons = {
    lessons: [
      {
        number: 1,
        tasks: tasks.map((steps, index) => ({
          number: index + 1,
          title: `Synthetic title ${index + 1}`,
          sourceContentMarkdown: steps.join("\n\n"),
        })),
      },
    ],
  };
  const overviewMarkdown = [
    "## PDF page 6 (printed page 13)",
    "Synthetic duration three seconds.",
    "## PDF page 9 (printed page 16)",
    "| Synthetic skill | Synthetic pronunciation | Synthetic technique |",
    "| --- | --- | --- |",
    "| Synthetic blending | aaazzz | Synthetic hold direction. Synthetic lead until firm. Synthetic mouth direction. |",
    "## PDF page 15 (printed page 22)",
    "### Oral Tasks Corrections",
    "| Synthetic error | Synthetic correction |",
    "| --- | --- |",
    '| Synthetic blending | (Synthetic stopped response.) Synthetic model: aaazzz. Synthetic joint invitation. "aaazzz." (Synthetic repeat until firm. Synthetic independent test:) Synthetic independent invitation: aaazzz. "aaazzz." Synthetic correction praise aaazzz. (Synthetic restart from first turn.) |',
    '| Synthetic fast row | (Synthetic slow mistake.) Synthetic FAST model: IZ. Synthetic listen... iiizzz. Synthetic prompt! "iz." Synthetic praise! (Synthetic quiet mistake.) Synthetic quiet model. Synthetic listen... iiizzz. Iz. Synthetic prompt! "iz." Synthetic quiet praise! (Synthetic restart.) |',
    "### Written Tasks Corrections",
    "| Synthetic error | Synthetic correction |",
    "| --- | --- |",
    '| Synthetic isolated row | (Synthetic target.) Synthetic mmm model. (Synthetic invitation.) "mmm." Synthetic praise. (Synthetic route.) |',
  ].join("\n");
  return { lessons, overviewMarkdown };
}
test("continuous fixture is reproducible, cumulative and source neutral with exact retained entries", async () => {
  const old = createOralFixtureBody();
  const body = createContinuousOralFixtureBody();
  const fixture = await parseDevelopmentPackage(
    JSON.parse(
      await readFile(
        "tests/fixtures/continuous-development-package.json",
        "utf8",
      ),
    ),
    hash,
  );
  assert.deepEqual(fixture.body, body);
  assert.equal(fixture.packageHash, await hash(canonicalContentBody(body)));
  assert.deepEqual(body.lessonTasks, old.lessonTasks);
  assert.deepEqual(body.title, old.title);
  assert.deepEqual(
    body.tasks.filter((entry) => entry.task.number !== 3),
    old.tasks,
  );
  assert.deepEqual(
    body.tasks.map((entry) => entry.task.number),
    [1, 2, 3, 4, 5],
  );
  const entry = body.tasks.find((entry) => entry.task.number === 3);
  assert.ok(entry && entry.kind === "graphControls");
  assert.equal(entry.task.id, "fixture.graph.l01.t03");
  assert.equal(
    entry.task.nodes.filter(
      (node) => node.kind === "turn" && node.route === "normal",
    ).length,
    10,
  );
  assert.equal(entry.task.corrections.length, 9);
  assert.deepEqual(
    entry.task.nodes
      .find((node) => node.id.endsWith(".in-independent"))
      ?.guidance.map((span) => span.kind),
    ["speech", "expected", "praise"],
  );
  assert.equal(
    entry.task.nodes
      .flatMap((node) => node.guidance)
      .every((span) => span.copy.kind === "added"),
    true,
  );
});
test("source authoring splits actual ten-turn topology, preserves local readiness and orders test with praise before restart", async () => {
  const input = sources();
  const body = createContinuousOralBody(input);
  const parsed = await parseDevelopmentPackage(
    {
      formatVersion: 1,
      body,
      packageHash: await hash(canonicalContentBody(body)),
    },
    hash,
  );
  const entry = body.tasks.find((entry) => entry.task.number === 3);
  assert.ok(entry && entry.kind === "graphControls");
  const normal = entry.task.nodes.filter(
    (node) => node.kind === "turn" && node.route === "normal",
  );
  assert.deepEqual(
    normal.map((node) => [
      node.id.split(".").at(-1),
      node.kind === "turn" ? node.parentRole : null,
    ]),
    [
      ["am-model", "model"],
      ["am-together", "together"],
      ["am-again", "together"],
      ["am-independent", "listen"],
      ["if-together", "together"],
      ["if-again", "together"],
      ["if-independent", "listen"],
      ["in-together", "together"],
      ["in-again", "together"],
      ["in-independent", "listen"],
    ],
  );
  const gate = entry.task.nodes.find((node) => node.id.endsWith(".if-firm"));
  assert.deepEqual(
    gate?.guidance.map((span) => [span.copy.kind, span.copy.text]),
    [
      ["source", "(Synthetic local response with parent.)"],
      ["source", "Synthetic lead until firm."],
    ],
  );
  assert.deepEqual(
    normal.at(-1)?.guidance.map((span) => span.kind),
    ["speech", "expected", "praise"],
  );
  for (const c of entry.task.corrections) {
    const correctionTest: Serialized<ControlNode> | undefined =
      entry.task.nodes.find((node) => node.id === c.instructionNodeIds.at(-1));
    assert.deepEqual(
      correctionTest?.guidance.map((span) => span.kind),
      ["action", "speech", "expected", "praise", "action"],
    );
    assert.equal(correctionTest?.guidance[0]?.copy.kind, "adapted");
    assert.equal(c.retestNodeIds[0], `${entry.task.id}.am-model`);
  }
  const later = entry.task.nodes.find((node) =>
    node.id.endsWith("correction-if-independent.model"),
  );
  assert.equal(
    later?.guidance.every((span) => span.copy.kind === "adapted"),
    true,
  );
  assert.equal(
    later?.guidance.at(-1)?.copy.text,
    "Synthetic correction model: iiivvv.",
  );
  const fixtureTask = createContinuousOralFixtureBody().tasks.find(
    (entry) => entry.task.number === 3,
  );
  assert.ok(fixtureTask && fixtureTask.kind === "graphControls");
  const topology = (task: typeof entry.task) =>
    task.nodes.map((node) => [
      node.id.replace(task.id, "task"),
      node.kind,
      node.kind === "turn" ? node.parentRole : "gate",
    ]);
  assert.deepEqual(topology(entry.task), topology(fixtureTask.task));
  assert.equal(parsed.body.coverage, "lesson1-sounds-oral-complete");
});
test("ambiguous source boundaries and missing guide instructions stop preparation", () => {
  const input = sources();
  assert.throws(
    () =>
      createContinuousOralBody({
        ...input,
        overviewMarkdown: input.overviewMarkdown.replace(
          "Synthetic lead until firm.",
          "",
        ),
      }),
    /source mapping is incomplete|guide readiness needs review/,
  );
  const altered = {
    ...input.lessons,
    lessons: input.lessons.lessons.map((lesson) => ({
      ...lesson,
      tasks: lesson.tasks.map((task) =>
        task.number === 3
          ? {
              ...task,
              sourceContentMarkdown: task.sourceContentMarkdown.replace(
                'Synthetic independent invitation. "iiivvv."',
                "",
              ),
            }
          : task,
      ),
    })),
  };
  assert.throws(
    () => createContinuousOralBody({ ...input, lessons: altered }),
    /later joint/,
  );
  assert.notEqual(
    canonical(createContinuousOralBody(input)),
    canonical(createOralFixtureBody()),
  );
});
