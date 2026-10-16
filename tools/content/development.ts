import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { format } from "prettier";
import { Ajv2020 } from "ajv/dist/2020.js";
import {
  canonicalContentBody,
  parseDevelopmentPackage,
} from "@readatthree/teaching";
import type {
  Copy,
  DevelopmentBody,
  TeachingNode,
} from "@readatthree/teaching";

const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
const root = resolve(import.meta.dirname, "../..");
const sourceFile = resolve(root, "data/lessons-01-06.source.json");
const output = resolve(root, ".local/runtime/development-package.json");
const fixtureOutput = resolve(root, "tests/fixtures/development-package.json");
const fixture = process.argv.includes("--fixture");
const added = (text: string): Copy => ({ kind: "added", text });

async function save(body: DevelopmentBody, path: string) {
  const value = {
    formatVersion: 1,
    packageHash: await hash(canonicalContentBody(body)),
    body,
  };
  await parseDevelopmentPackage(value, hash);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    await format(JSON.stringify(value), { parser: "json" }),
  );
  process.stdout.write(
    `Prepared ${fixture ? "explicit synthetic test fixture" : "private development content"}.\n`,
  );
}

if (fixture) {
  const nodes: TeachingNode[] = [
    {
      id: "fixture.model",
      parentAction: added("Fixture parent action."),
      spoken: added("Fixture model."),
      expected: added("Fixture expected sound."),
      parentRole: "model",
      glyph: "m",
      cue: { kind: "sustain", durationMs: 3000 },
      next: { kind: "node", nodeId: "fixture.response" },
    },
    {
      id: "fixture.response",
      parentAction: added("Fixture response action."),
      spoken: added("Fixture child response."),
      expected: added("Fixture expected response."),
      parentRole: "listen",
      glyph: "m",
      cue: { kind: "sustain", durationMs: 3000 },
      next: {
        kind: "frontier",
        unmetObligations: ["fixture.remaining-required-teaching"],
      },
    },
  ];
  await save(
    {
      courseId: "fixture.course",
      releaseId: "fixture.release.1",
      coverage: "partial-first-m",
      title: added("Synthetic test activity"),
      lessonId: "fixture.lesson",
      taskId: "fixture.task",
      startNodeId: "fixture.model",
      nodes,
    },
    fixtureOutput,
  );
} else {
  type Source = {
    lessons: {
      number: number;
      tasks: { number: number; title: string; sourceContentMarkdown: string }[];
    }[];
  };
  const validate = new Ajv2020({ strict: true }).compile<Source>({
    type: "object",
    properties: {
      lessons: {
        type: "array",
        items: {
          type: "object",
          properties: {
            number: { type: "integer" },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  number: { type: "integer" },
                  title: { type: "string" },
                  sourceContentMarkdown: { type: "string" },
                },
                required: ["number", "title", "sourceContentMarkdown"],
              },
            },
          },
          required: ["number", "tasks"],
        },
      },
    },
    required: ["lessons"],
  });
  const raw = await readFile(sourceFile, "utf8");
  const source: unknown = JSON.parse(raw);
  if (!validate(source))
    throw new Error("The authorized local source records are invalid.");
  const task = source.lessons
    .find((lesson) => lesson.number === 1)
    ?.tasks.find((task) => task.number === 1);
  if (!task) throw new Error("Supplied Lesson 1 Task 1 is missing.");
  const nodeIds = ["l01.t01.s01.model-m", "l01.t01.s02.response-m"];
  const firstId = nodeIds[0];
  const secondId = nodeIds[1];
  if (!firstId || !secondId)
    throw new Error("Development authoring identity is incomplete.");
  const steps = [1, 2].map((number) => {
    const match = task.sourceContentMarkdown.match(
      new RegExp(`(?:^|\\n)${number}\\. ([^\\n]+)`),
    );
    if (!match?.[1])
      throw new Error("A required supplied source step is missing.");
    return match[1];
  });
  const nodes: TeachingNode[] = steps.map((step, index) => {
    const sourceRef = `book.printed31.l01.t01.s0${index + 1}`;
    const actions = [...step.matchAll(/\([^()]*\)/g)]
      .map((match) => match[0])
      .join(" ");
    const spoken = step
      .replace(/\([^()]*\)/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const response =
      spoken.match(/"([^"]+)"/)?.[1] ?? spoken.match(/\b(m+)\./)?.[0];
    if (!actions || !response)
      throw new Error(
        "Supplied model/response cannot be separated without editorial review.",
      );
    return {
      id: index === 0 ? firstId : secondId,
      parentAction: { kind: "source", text: actions, sourceRef },
      spoken: {
        kind: "adapted",
        text: index === 0 ? spoken : spoken.replace(/"[^"]+"/g, "").trim(),
        sourceRef,
      },
      expected: { kind: "adapted", text: response, sourceRef },
      parentRole: index === 0 ? "model" : "listen",
      glyph: "m",
      cue: { kind: "sustain", durationMs: 3000 },
      next:
        index === 0
          ? { kind: "node", nodeId: secondId }
          : {
              kind: "frontier",
              unmetObligations: [
                "l01.t01.s03.again-m",
                "l01.t01.s04.model-s",
                "l01.t01.s05.response-s",
                "l01.t01.s06.again-s",
              ],
            },
    };
  });
  const draft: DevelopmentBody = {
    courseId: "teach-reading.supplied",
    releaseId: "development-content-fingerprint",
    coverage: "partial-first-m",
    title: {
      kind: "source",
      text: task.title,
      sourceRef: "book.printed31.l01.t01.title",
    },
    lessonId: "l01",
    taskId: "l01.t01",
    startNodeId: firstId,
    nodes,
  };
  const releaseId = `development.first-m.${await hash(canonicalContentBody(draft))}`;
  await save({ ...draft, releaseId }, output);
  const scan = await readFile(
    resolve(root, "output/markdown/assets/lessons-1-6/page-02.png"),
  );
  const review = {
    sourceSha256: await hash(raw),
    scanSha256: createHash("sha256").update(scan).digest("hex"),
    scope:
      "Printed page31, task1 steps1–2 and m/arrow/ball geometry inspected locally on2026-10-16.",
    adaptation:
      "Transcription regularized sustained-sound letter counts; spoken/expected blocks are marked adapted and highlighted. Source parent actions remain verbatim fragments.",
    status: "local-development-review",
    publication: "pending",
    completionEligible: false,
  };
  await writeFile(
    resolve(root, ".local/runtime/source-review.json"),
    JSON.stringify(review, null, 2) + "\n",
  );
}
