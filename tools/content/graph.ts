import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { format } from "prettier";
import {
  canonicalContentBody,
  parseDevelopmentPackage,
} from "@readatthree/teaching";
import type {
  Copy,
  GraphDevelopmentBody,
  GraphNode,
  GraphTask,
  LessonTask,
  ParentSpan,
  Serialized,
} from "@readatthree/teaching";

type CopyInput = Serialized<Copy>;
type SpanInput = Serialized<ParentSpan>;
type NodeInput = Serialized<GraphNode>;
type TaskInput = Serialized<GraphTask>;
type LessonTaskInput = Serialized<LessonTask>;
type BodyInput = Serialized<GraphDevelopmentBody>;
type SourceTask = {
  number: number;
  title: string;
  sourceContentMarkdown: string;
};
type LessonSources = {
  lessons: { number: number; tasks: SourceTask[] }[];
};
type NodeScript = Pick<NodeInput, "guidance" | "sourceRefs">;
type NormalPlan = Readonly<{
  step: number;
  suffix: string;
  glyph: "m" | "s";
  parentRole: "model" | "listen";
}>;
type AuthoredScripts = {
  title(task: number): CopyInput;
  normal(task: 1 | 4, step: number): NodeScript;
  correction(task: 1 | 4, glyph: "m" | "s"): NodeScript;
};
type SourceDigest = { path: string; sha256: string };
type InputReview = {
  status: "local-development-review";
  reviewedOn: string;
  sources: SourceDigest[];
  scans: SourceDigest[];
};

const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
const root = resolve(import.meta.dirname, "../..");
const added = (text: string): CopyInput => ({ kind: "added", text });
const pronunciationRef = "book.printed13.pronunciation.continuous";
const introduction: readonly NormalPlan[] = [
  { step: 1, suffix: "s01.model-m", glyph: "m", parentRole: "model" },
  { step: 2, suffix: "s02.response-m", glyph: "m", parentRole: "listen" },
  { step: 3, suffix: "s03.again-m", glyph: "m", parentRole: "listen" },
  { step: 4, suffix: "s04.model-s", glyph: "s", parentRole: "model" },
  { step: 5, suffix: "s05.response-s", glyph: "s", parentRole: "listen" },
  { step: 6, suffix: "s06.again-s", glyph: "s", parentRole: "listen" },
];
const review: readonly NormalPlan[] = [
  { step: 1, suffix: "s01.response-m", glyph: "m", parentRole: "listen" },
  { step: 2, suffix: "s02.response-s", glyph: "s", parentRole: "listen" },
];

function assembleTask(input: {
  number: 1 | 4;
  id: string;
  prefix: string;
  scripts: AuthoredScripts;
}): TaskInput {
  const plan = input.number === 1 ? introduction : review;
  const ids = plan.map((item) => `${input.prefix}.${item.suffix}`);
  const firstId = ids[0];
  if (!firstId) throw new Error("A task needs a normal start turn.");
  const normalNodes = plan.map((item, index): NodeInput => {
    const id = ids[index];
    if (!id) throw new Error("A source turn has no stable identity.");
    const nextId = ids[index + 1];
    return {
      id,
      kind: "normal",
      ...input.scripts.normal(input.number, item.step),
      parentRole: item.parentRole,
      glyph: item.glyph,
      cue: { kind: "sustain", minimumMs: 3000 },
      next: nextId ? { kind: "node", nodeId: nextId } : { kind: "end" },
    };
  });
  const corrections = (["m", "s"] satisfies ("m" | "s")[]).map((glyph) => {
    const instruction = input.scripts.correction(input.number, glyph);
    const matching = normalNodes.filter(
      (node) => node.parentRole === "listen" && node.glyph === glyph,
    );
    const firstResponse = matching[0];
    if (!firstResponse) throw new Error("A correction needs a child test.");
    const again = matching[1];
    return {
      spec: {
        id: `${input.prefix}.help-${glyph}`,
        eligibleNodeIds: matching.map((node) => node.id),
        instructionNodeId: `${input.prefix}.correction-${glyph}`,
        retestNodeIds:
          input.number === 1
            ? [firstResponse.id]
            : normalNodes.map((node) => node.id),
        continuationNodeId: input.number === 1 ? (again?.id ?? null) : null,
        sourceRefs: instruction.sourceRefs,
      },
      node: {
        id: `${input.prefix}.correction-${glyph}`,
        kind: "correction",
        ...instruction,
        parentRole: "model",
        glyph,
        cue: { kind: "sustain", minimumMs: null },
        next: { kind: "end" },
      } satisfies NodeInput,
    };
  });
  return {
    id: input.id,
    number: input.number,
    title: input.scripts.title(input.number),
    startNodeId: firstId,
    nodes: [...normalNodes, ...corrections.map((item) => item.node)],
    corrections: corrections.map((item) => item.spec),
  };
}

function assembleBody(input: {
  fixture: boolean;
  scripts: AuthoredScripts;
}): BodyInput {
  const prefix = input.fixture ? "fixture.graph.l01" : "l01";
  const taskId = (number: number) =>
    input.fixture && number === 1
      ? "fixture.task"
      : `${prefix}.t${String(number).padStart(2, "0")}`;
  const lessonTasks: LessonTaskInput[] = Array.from(
    { length: 6 },
    (_value, index) => {
      const number = index + 1;
      return {
        id: taskId(number),
        number,
        title: input.scripts.title(number),
        optional: number === 6,
      };
    },
  );
  return {
    courseId: input.fixture ? "fixture.course" : "teach-reading.supplied",
    releaseId: input.fixture
      ? "fixture.graph.release.1"
      : "development-content-fingerprint",
    coverage: "lesson1-sounds-complete",
    title: added(input.fixture ? "Synthetic lesson 1" : "Lesson 1"),
    lessonId: input.fixture ? "fixture.lesson" : "l01",
    lessonTasks,
    tasks: ([1, 4] satisfies (1 | 4)[]).map((number) =>
      assembleTask({
        number,
        id: taskId(number),
        prefix: `${prefix}.t${String(number).padStart(2, "0")}`,
        scripts: input.scripts,
      }),
    ),
  };
}

export function createGraphFixtureBody(): BodyInput {
  function fixtureSpan(kind: SpanInput["kind"], text: string): SpanInput {
    return { kind, copy: added(text) };
  }
  return assembleBody({
    fixture: true,
    scripts: {
      title: (task) => added(`Synthetic task ${task}`),
      normal(task, step) {
        const plan = (task === 1 ? introduction : review).find(
          (item) => item.step === step,
        );
        if (!plan) throw new Error("A synthetic normal turn is missing.");
        const guidance: SpanInput[] = [];
        if (plan.parentRole === "model" || (task === 4 && step === 1))
          guidance.push(
            fixtureSpan("speech", `Synthetic ${plan.glyph} setup.`),
          );
        if (plan.parentRole === "listen" && task === 1 && step % 3 === 2)
          guidance.push(
            fixtureSpan("speech", "Synthetic child response setup."),
          );
        guidance.push(
          fixtureSpan("action", "Synthetic first-point action."),
          fixtureSpan("speech", "Synthetic cue prompt."),
          fixtureSpan("action", "Synthetic sustained-point action."),
          fixtureSpan(
            plan.parentRole === "model" ? "speech" : "expected",
            `Synthetic ${plan.glyph} ${plan.parentRole}.`,
          ),
        );
        if (plan.parentRole === "model")
          guidance.push(fixtureSpan("action", "Synthetic release action."));
        if (task === 1 && step % 3 === 0)
          guidance.push(fixtureSpan("praise", "Synthetic response praise."));
        return {
          sourceRefs: [
            `fixture.graph.t${task}.s${step}`,
            "fixture.graph.pronunciation.continuous",
          ],
          guidance,
        };
      },
      correction(task, glyph) {
        const guidance = [
          fixtureSpan("action", "Synthetic correction action."),
          fixtureSpan("speech", `Synthetic ${glyph} correction model.`),
        ];
        if (task === 4)
          guidance.push(
            fixtureSpan("action", "Synthetic response invitation."),
            fixtureSpan("expected", `Synthetic ${glyph} correction response.`),
            fixtureSpan("praise", "Synthetic correction praise."),
          );
        guidance.push(fixtureSpan("action", "Synthetic source retest route."));
        return {
          sourceRefs: [`fixture.graph.t${task}.correction.${glyph}`],
          guidance,
        };
      },
    },
  });
}

const validateSources = new Ajv2020({ strict: true }).compile<LessonSources>({
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
                title: { type: "string", minLength: 1 },
                sourceContentMarkdown: { type: "string", minLength: 1 },
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

export function orderedGuidance(input: {
  text: string;
  sourceRef: string;
  adapted: boolean;
}): SpanInput[] {
  const plain = input.text.replaceAll("**", "");
  const tokens = [...plain.matchAll(/\([^()]*\)|"[^"\n]*"|[^(")]+/g)].map(
    (match) => match[0],
  );
  if (tokens.join("") !== plain)
    throw new Error("A source span needs explicit editorial review.");
  let responseSeen = false;
  const result: SpanInput[] = [];
  for (const token of tokens) {
    const text = token.trim();
    if (!text) continue;
    const expected = text.startsWith('"');
    const kind = text.startsWith("(")
      ? "action"
      : expected
        ? "expected"
        : responseSeen
          ? "praise"
          : "speech";
    result.push({
      kind,
      copy: {
        kind:
          input.adapted || expected || /\b(?:m{3,}|s{3,})\b/.test(text)
            ? "adapted"
            : "source",
        text: expected ? text.slice(1, -1) : text,
        sourceRef: input.sourceRef,
      },
    });
    if (expected) responseSeen = true;
  }
  if (result.length === 0) throw new Error("A source turn has no guidance.");
  return result;
}

function printedPage(markdown: string, page: number): string {
  const sections = markdown.split(
    /^## PDF page \d+ \(printed page (\d+)\)\s*$/m,
  );
  for (let index = 1; index < sections.length; index += 2) {
    if (sections[index] === String(page)) return sections[index + 1] ?? "";
  }
  throw new Error("The required overview page is missing.");
}

function generalCorrection(markdown: string): string {
  const page = printedPage(markdown, 22);
  const tables: string[][][] = [];
  let current: string[][] | null = null;
  for (const line of page.split("\n")) {
    if (!line.startsWith("|")) {
      current = null;
      continue;
    }
    const cells = line
      .slice(1, line.lastIndexOf("|"))
      .split("|")
      .map((cell) => cell.trim());
    if (cells.every((cell) => /^[-: ]+$/.test(cell))) continue;
    if (!current) {
      current = [];
      tables.push(current);
    }
    current.push(cells);
  }
  const correction = tables[1]?.[1]?.[1];
  if (!correction)
    throw new Error("The reviewed isolated-sound correction is missing.");
  return correction;
}

export function createGraphBody(input: {
  lessons: unknown;
  overviewMarkdown: string;
}): BodyInput {
  if (!validateSources(input.lessons))
    throw new Error("The authorized local lesson records are invalid.");
  const lesson = input.lessons.lessons.find((item) => item.number === 1);
  if (
    !lesson ||
    lesson.tasks.length !== 6 ||
    new Set(lesson.tasks.map((task) => task.number)).size !== 6 ||
    lesson.tasks.some((task) => task.number < 1 || task.number > 6)
  )
    throw new Error("Supplied Lesson 1 needs its six distinct source tasks.");
  const tasks = new Map(lesson.tasks.map((task) => [task.number, task]));
  const steps = new Map<number, Map<number, string>>();
  for (const number of [1, 4]) {
    const task = tasks.get(number);
    if (!task) throw new Error("A supplied printed-sound task is missing.");
    const rows = [
      ...task.sourceContentMarkdown.matchAll(/(?:^|\n)(\d+)\. ([^\n]+)/g),
    ];
    const expected = number === 1 ? 6 : 2;
    if (rows.length !== expected)
      throw new Error("The supplied printed-sound turn count changed.");
    steps.set(
      number,
      new Map(rows.map((row) => [Number(row[1]), row[2] ?? ""])),
    );
  }
  const taskOne = tasks.get(1);
  if (!taskOne) throw new Error("Supplied Lesson 1 Task 1 is missing.");
  const corrections = [
    ...taskOne.sourceContentMarkdown.matchAll(/^> (.+)$/gm),
  ].map((match) => match[1] ?? "");
  if (corrections.length !== 2)
    throw new Error("The source needs both printed introduction corrections.");
  const isolated = generalCorrection(input.overviewMarkdown);
  const pronunciation = printedPage(input.overviewMarkdown, 13);
  if (!/\bthree seconds\b/.test(pronunciation))
    throw new Error("The reviewed continuous-sound timing source is missing.");
  return assembleBody({
    fixture: false,
    scripts: {
      title(number) {
        const task = tasks.get(number);
        if (!task) throw new Error("A source task title is missing.");
        return {
          kind: "source",
          text: task.title,
          sourceRef: `book.printed${number < 4 ? 31 : 32}.l01.t${String(number).padStart(2, "0")}.title`,
        };
      },
      normal(task, step) {
        const text = steps.get(task)?.get(step);
        if (!text) throw new Error("A supplied normal turn is missing.");
        const sourceRef = `book.printed${task === 1 ? 31 : 32}.l01.t${String(task).padStart(2, "0")}.s${String(step).padStart(2, "0")}`;
        return {
          sourceRefs: [sourceRef, pronunciationRef],
          guidance: orderedGuidance({ text, sourceRef, adapted: false }),
        };
      },
      correction(task, glyph) {
        const sourceRef =
          task === 1
            ? `book.printed31.l01.t01.correction-${glyph}`
            : "book.printed22.correction.isolated-sound";
        const text = task === 1 ? corrections[glyph === "m" ? 0 : 1] : isolated;
        if (!text) throw new Error("A supplied correction is missing.");
        const substituted = task === 4 && glyph === "s";
        return {
          sourceRefs: [sourceRef],
          guidance: orderedGuidance({
            text: substituted
              ? text.replace(/\bm{3,}\b/g, (sound) => "s".repeat(sound.length))
              : text,
            sourceRef,
            adapted: substituted,
          }),
        };
      },
    },
  });
}

const digestSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    path: { type: "string", minLength: 1 },
    sha256: { type: "string", pattern: "^[a-f0-9]{64}$" },
  },
  required: ["path", "sha256"],
};
const validateReview = new Ajv2020({ strict: true }).compile<InputReview>({
  type: "object",
  additionalProperties: false,
  properties: {
    status: { const: "local-development-review" },
    reviewedOn: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    sources: { type: "array", minItems: 2, items: digestSchema },
    scans: { type: "array", minItems: 3, items: digestSchema },
  },
  required: ["status", "reviewedOn", "sources", "scans"],
});

export function verifyGraphInputReview(input: {
  review: unknown;
  sources: SourceDigest[];
  scans: SourceDigest[];
}): InputReview {
  if (!validateReview(input.review))
    throw new Error(
      "The independent local source review is missing or invalid.",
    );
  if (
    JSON.stringify(input.review.sources) !== JSON.stringify(input.sources) ||
    JSON.stringify(input.review.scans) !== JSON.stringify(input.scans)
  )
    throw new Error(
      "Source inputs changed. Review them before generating eligible content.",
    );
  return input.review;
}

export async function prepareGraphContent(input: { fixture: boolean }) {
  const lessonsPath = resolve(root, "data/lessons-01-06.source.json");
  const overviewPath = resolve(
    root,
    "output/markdown/overview-and-practice-guide.md",
  );
  const lessonText = input.fixture ? null : await readFile(lessonsPath, "utf8");
  const overviewText = input.fixture
    ? null
    : await readFile(overviewPath, "utf8");
  const sources =
    lessonText === null || overviewText === null
      ? []
      : [
          {
            path: "data/lessons-01-06.source.json",
            sha256: await hash(lessonText),
          },
          {
            path: "output/markdown/overview-and-practice-guide.md",
            sha256: await hash(overviewText),
          },
        ];
  const scanPaths = input.fixture
    ? []
    : [
        "output/markdown/assets/lessons-1-6/page-02.png",
        "output/markdown/assets/lessons-1-6/page-03.png",
        "output/markdown/assets/overview-page-15.png",
      ];
  const scans = await Promise.all(
    scanPaths.map(async (path) => ({
      path,
      sha256: createHash("sha256")
        .update(await readFile(resolve(root, path)))
        .digest("hex"),
    })),
  );
  const inputReview = input.fixture
    ? null
    : verifyGraphInputReview({
        review: JSON.parse(
          await readFile(
            resolve(root, ".local/runtime/graph-input-review.json"),
            "utf8",
          ),
        ),
        sources,
        scans,
      });
  const draft =
    lessonText === null || overviewText === null
      ? createGraphFixtureBody()
      : createGraphBody({
          lessons: JSON.parse(lessonText),
          overviewMarkdown: overviewText,
        });
  const body = input.fixture
    ? draft
    : {
        ...draft,
        releaseId: `development.lesson1-sounds.${await hash(canonicalContentBody(draft))}`,
      };
  const value = {
    formatVersion: 1,
    packageHash: await hash(canonicalContentBody(body)),
    body,
  };
  await parseDevelopmentPackage(value, hash);
  const path = resolve(
    root,
    input.fixture
      ? "tests/fixtures/graph-development-package.json"
      : ".local/runtime/graph-development-package.json",
  );
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    await format(JSON.stringify(value), { parser: "json" }),
  );
  if (inputReview !== null) {
    const review = {
      status: "local-development-review",
      reviewedOn: inputReview.reviewedOn,
      packageHash: value.packageHash,
      sources,
      scans,
      pronunciationReview: {
        sourceRef: pronunciationRef,
        printedPage: 13,
        pdfPage: 6,
        method:
          "Rendered supplied overview PDF and visually inspected the continuous-sound paragraph.",
      },
      coverage: body.tasks.map((task) => ({
        taskId: task.id,
        normalObligations: task.nodes
          .filter((node) => node.kind === "normal")
          .map((node) => node.id),
        orderedGuidance: task.nodes.map((node) => ({
          nodeId: node.id,
          kinds: node.guidance.map((span) => span.kind),
          provenance: node.guidance.map((span) => span.copy.kind),
          sourceRefs: node.sourceRefs,
        })),
        corrections: task.corrections,
      })),
      glyphReview: {
        targets: ["m", "s"],
        geometry:
          "Printed31/32 source references show lowercase symbols, a first ball, an arrow, an under-symbol hold ball, and an arrow endpoint. Rendered application comparison remains a separate UI check.",
      },
      adaptations: [
        "Sustained sound counts were regularized in the supplied transcription. Sound-bearing spans and unquoted expected responses are marked adapted.",
        "Task4 s correction substitutes the current symbol into the general m example. Every substituted-procedure span is marked adapted.",
      ],
      completionEligibleTasks: body.tasks.map((task) => task.id),
      publication: "pending",
      runtimePublicationApproval: "pending-separate-record",
    };
    await writeFile(
      resolve(root, ".local/runtime/graph-source-review.json"),
      await format(JSON.stringify(review), { parser: "json" }),
    );
  }
  process.stdout.write(
    `Prepared ${input.fixture ? "explicit synthetic graph fixture" : "private graph development content"}.\n`,
  );
}
