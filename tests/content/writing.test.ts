import { plainCopy, requiredPlainCopy } from "../plain-guidance.ts";
import {
  executeTeaching,
  prepareSelectedTeaching,
  selectedProjection,
} from "../storage/selected-support.ts";

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  canonicalContentBody,
  parseDevelopmentPackage,
  prepareCommand,
} from "@readatthree/teaching";
import type { Serialized, WritingNode } from "@readatthree/teaching";
import {
  createContinuousOralBody,
  createContinuousOralFixtureBody,
} from "../../tools/content/continuous.ts";
import {
  createWritingBody,
  createWritingFixtureBody,
} from "../../tools/content/writing.ts";
import { storageFixture } from "../storage/support.ts";
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
    [
      '1. Synthetic first introduction mmm. Synthetic question? "mmm." Synthetic praise mmm. Synthetic watch.',
      '2. Synthetic mmm model. (Synthetic first-row vertical.) (Synthetic humps.) (Synthetic point.) Synthetic question? "mmm." Synthetic tracing mmm invitation. Synthetic further writing. Synthetic sound mmm while writing.',
      "3. (Synthetic trace two or three times. Synthetic independent three to five on top line. Synthetic help as necessary. Synthetic acceptable-letter praise:) Synthetic praise mmm.",
      '4. Synthetic sss model. (Synthetic second-row point.) Synthetic question? "sss." Synthetic praise sss.',
      "5. Synthetic tracing sss invitation. Synthetic further writing. (Synthetic trace two or three times. Synthetic independent three to five on second line. Synthetic help as necessary. Synthetic acceptable-letter praise:) Synthetic praise sss.",
    ],
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
async function packaged(body: ReturnType<typeof createWritingBody>) {
  return parseDevelopmentPackage(
    {
      formatVersion: 1,
      body,
      packageHash: await hash(canonicalContentBody(body)),
    },
    hash,
  );
}
test("writing fixture is reproducible, synthetic and adds only the explicit optional sixth task", async () => {
  const previous = createContinuousOralFixtureBody();
  const body = createWritingFixtureBody();
  const value = JSON.parse(
    await readFile("tests/fixtures/writing-development-package.json", "utf8"),
  );
  const content = await parseDevelopmentPackage(value, hash);
  assert.deepEqual(content.body, body);
  assert.equal(content.packageHash, await hash(canonicalContentBody(body)));
  assert.equal(body.coverage, "lesson1-complete");
  assert.deepEqual(body.lessonTasks, previous.lessonTasks);
  assert.deepEqual(body.title, previous.title);
  assert.deepEqual(body.tasks.slice(0, 5), previous.tasks);
  assert.deepEqual(
    body.tasks.map((entry) => entry.task.number),
    [1, 2, 3, 4, 5, 6],
  );
  const entry = body.tasks[5];
  assert.ok(entry?.kind === "soundWritingV1");
  assert.equal(entry.task.optional, true);
  assert.equal(entry.task.id, "fixture.graph.l01.t06");
  assert.equal(
    entry.task.nodes
      .flatMap((node) => node.guidance)
      .every((span) => requiredPlainCopy(span).kind === "added"),
    true,
  );
  assert.equal("corrections" in entry.task, false);
  assert.equal(
    entry.task.nodes.some((node) => "itemId" in node),
    false,
  );
});
test("source authoring preserves all five earlier bodies and literal seven-turn/four-confirmation topology", async () => {
  const input = sources();
  const previous = createContinuousOralBody(input);
  const body = createWritingBody(input);
  const content = await packaged(body);
  assert.equal(content.body.coverage, "lesson1-complete");
  assert.deepEqual(body.tasks.slice(0, 5), previous.tasks);
  assert.deepEqual(body.lessonTasks, previous.lessonTasks);
  const entry = body.tasks[5];
  assert.ok(entry?.kind === "soundWritingV1");
  assert.deepEqual(
    entry.task.targets.map((target) => [
      target.id,
      target.logicalWidth,
      target.logicalHeight,
      target.guides,
      target.boardY,
    ]),
    [
      ["l01.t06.m", 1000, 160, { top: 0, midline: 80, baseline: 160 }, 0],
      ["l01.t06.s", 1000, 160, { top: 0, midline: 80, baseline: 160 }, 160],
    ],
  );
  assert.deepEqual(
    entry.task.nodes.map((node) => [
      node.id,
      node.parentRole,
      node.presentation.targetId,
      node.presentation.obligation,
    ]),
    [
      ["l01.t06.m-sound", "listen", "l01.t06.m", { kind: "soundResponse" }],
      ["l01.t06.m-model", "model", "l01.t06.m", { kind: "modelAndSound" }],
      [
        "l01.t06.m-tracing",
        "listen",
        "l01.t06.m",
        {
          kind: "phaseConfirmation",
          phase: "childTracing",
          practice: { minimum: 2, maximum: 3, allowMore: true },
        },
      ],
      [
        "l01.t06.m-independent",
        "listen",
        "l01.t06.m",
        {
          kind: "phaseConfirmation",
          phase: "childIndependentWriting",
          practice: { minimum: 3, maximum: 5, allowMore: true },
        },
      ],
      ["l01.t06.s-model", "model", "l01.t06.s", { kind: "modelAndSound" }],
      [
        "l01.t06.s-tracing",
        "listen",
        "l01.t06.s",
        {
          kind: "phaseConfirmation",
          phase: "childTracing",
          practice: { minimum: 2, maximum: 3, allowMore: true },
        },
      ],
      [
        "l01.t06.s-independent",
        "listen",
        "l01.t06.s",
        {
          kind: "phaseConfirmation",
          phase: "childIndependentWriting",
          practice: { minimum: 3, maximum: 5, allowMore: true },
        },
      ],
    ],
  );
  assert.deepEqual(
    entry.task.nodes.map((node) => node.sourceRefs),
    [
      ["book.printed32.l01.t06.s01"],
      ["book.printed32.l01.t06.s02"],
      ["book.printed32.l01.t06.s02", "book.printed32.l01.t06.s03"],
      ["book.printed32.l01.t06.s02", "book.printed32.l01.t06.s03"],
      ["book.printed32.l01.t06.s04"],
      ["book.printed32.l01.t06.s05"],
      ["book.printed32.l01.t06.s05"],
    ],
  );
  assert.deepEqual(
    entry.task.nodes[0]?.guidance.map((span) => [
      span.kind,
      requiredPlainCopy(span).text,
    ]),
    [
      ["speech", "Synthetic first introduction mmm. Synthetic question?"],
      ["expected", "mmm."],
      ["praise", "Synthetic praise mmm."],
      ["speech", "Synthetic watch."],
    ],
  );
  const model = entry.task.nodes[1];
  assert.deepEqual(
    model?.guidance.map((span) => span.kind),
    ["speech", "action", "action", "action", "speech", "expected"],
  );
  assert.equal(plainCopy(model?.guidance[1])?.kind, "source");
  const trace = entry.task.nodes[2],
    independent = entry.task.nodes[3];
  assert.equal(trace?.guidance[0]?.kind, "speech");
  assert.equal(
    plainCopy(trace?.guidance[0])?.text,
    "Synthetic tracing mmm invitation.",
  );
  assert.equal(
    plainCopy(independent?.guidance[0])?.text,
    "Synthetic further writing.",
  );
  assert.equal(
    plainCopy(independent?.guidance[1])?.text,
    "Synthetic sound mmm while writing.",
  );
  for (const index of [2, 3, 5, 6]) {
    const phaseNode: Serialized<WritingNode> | undefined =
      entry.task.nodes[index];
    assert.ok(phaseNode);
    assert.equal(phaseNode.guidance.at(-1)?.kind, "praise");
    assert.equal(
      phaseNode.guidance.every(
        (span) => requiredPlainCopy(span).kind === "adapted",
      ),
      true,
    );
    assert.equal(
      phaseNode.guidance.filter((span) => span.kind === "action").length,
      3,
    );
  }
  const fixtureEntry = createWritingFixtureBody().tasks[5];
  assert.ok(fixtureEntry?.kind === "soundWritingV1");
  assert.deepEqual(
    entry.task.nodes.map((node) => node.presentation.obligation),
    fixtureEntry.task.nodes.map((node) => node.presentation.obligation),
  );
});
test("unreviewed writing roles, ranges, corrections and source-step count fail closed", () => {
  for (const mutate of [
    (text: string) => text.replace("two or three", "one or two"),
    (text: string) => text.replace("Synthetic watch.", ""),
    (text: string) => text.replace("(Synthetic humps.)", ""),
    (text: string) => text.replace(/^5\. .*$/m, ""),
    (text: string) => text + "\n> Synthetic unsupported correction.",
  ]) {
    const input = sources();
    const task = input.lessons.lessons[0]?.tasks[5];
    assert.ok(task);
    task.sourceContentMarkdown = mutate(task.sourceContentMarkdown);
    assert.throws(
      () => createWritingBody(input),
      /Writing.*(source|review|correction)/,
    );
  }
});
test("actual cumulative writing fixture activation preserves five bodies, pinned teaching and all earlier action kinds", async (t) => {
  const previous = await parseDevelopmentPackage(
    JSON.parse(
      await readFile(
        "tests/fixtures/continuous-development-package.json",
        "utf8",
      ),
    ),
    hash,
  );
  const candidate = await parseDevelopmentPackage(
    JSON.parse(
      await readFile("tests/fixtures/writing-development-package.json", "utf8"),
    ),
    hash,
  );
  if (
    previous.body.coverage !== "lesson1-sounds-oral-complete" ||
    candidate.body.coverage !== "lesson1-complete"
  )
    throw new Error("Cumulative fixtures missing");
  assert.deepEqual(candidate.body.tasks.slice(0, 5), previous.body.tasks);
  assert.deepEqual(candidate.body.lessonTasks, previous.body.lessonTasks);
  const f = await storageFixture(t, previous);
  const first = await f.connectReady();
  const ready = await selectedProjection(first.app);
  if (ready.kind === "recovery") throw new Error(ready.message);
  const action = ready.actions.find((action) => action.intent.kind === "start");
  assert.ok(action);
  await executeTeaching(
    first.app,
    await prepareSelectedTeaching(first.app, async () =>
      prepareCommand({
        projection: ready,
        request: { kind: "action", action },
        ids: f.ids,
        hash,
      }),
    ),
  );
  const before = await selectedProjection(first.app);
  const upgraded = await f.connectReady({ content: candidate });
  const after = await selectedProjection(upgraded.app);
  assert.ok(before.kind === "teaching" && after.kind === "teaching");
  assert.equal(after.packageHash, previous.packageHash);
  assert.equal(after.runId, before.runId);
  assert.deepEqual(after.turn, before.turn);
  const sixth = candidate.body.lessonTasks.find((task) => task.number === 6);
  assert.ok(sixth);
  assert.deepEqual(
    after.catalog.map((task) => [
      task.id,
      task.number,
      task.title,
      task.available,
    ]),
    before.catalog.map((task) => [
      task.id,
      task.number,
      task.title,
      task.number === 6 ? true : task.available,
    ]),
  );
  assert.deepEqual(
    after.actions
      .filter(
        (action) =>
          !("taskId" in action.intent) || action.intent.taskId !== sixth.id,
      )
      .map((action) => [action.label, action.intent.kind]),
    before.actions.map((action) => [action.label, action.intent.kind]),
  );
  assert.equal(
    after.actions.filter(
      (action) =>
        "taskId" in action.intent && action.intent.taskId === sixth.id,
    ).length,
    1,
  );
  assert.equal(
    after.catalog.every((task) => task.packageHash === candidate.packageHash),
    true,
  );
});
