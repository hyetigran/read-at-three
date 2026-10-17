import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import {
  canonicalContentBody,
  parseDevelopmentPackage,
} from "@readatthree/teaching";
import type {
  ControlDevelopmentBody,
  PlainParentSpan as ParentSpan,
  Serialized,
  WritingDevelopmentBody,
  WritingNode,
  WritingObligation,
} from "@readatthree/teaching";
import {
  authorContinuousBody,
  createContinuousOralFixtureBody,
} from "./continuous.ts";
import { verifyGraphInputReview } from "./graph.ts";
import { oralGuidance } from "./oral.ts";
import { parseLessonSources } from "./source.ts";
import type { RawAuthoringInput } from "./source.ts";

type Body = Serialized<WritingDevelopmentBody>;
type Node = Serialized<WritingNode>;
type Span = Serialized<ParentSpan>;
type Script = Pick<Node, "guidance" | "sourceRefs">;
type Turn = Readonly<{
  suffix: string;
  target: "m" | "s";
  obligation: Serialized<WritingObligation>;
  script: Script;
}>;
const root = resolve(import.meta.dirname, "../..");
const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
function required<T>(value: T | undefined): T {
  if (value === undefined)
    throw new Error("Writing source mapping is incomplete.");
  return value;
}
function script(guidance: readonly Span[]): Script {
  return {
    guidance,
    sourceRefs: [
      ...new Set(
        guidance.flatMap((span) =>
          span.copy.kind === "added" ? [] : [span.copy.sourceRef],
        ),
      ),
    ],
  };
}
function practice(phase: "childTracing" | "childIndependentWriting") {
  return {
    kind: "phaseConfirmation",
    phase,
    practice: {
      minimum: phase === "childTracing" ? 2 : 3,
      maximum: phase === "childTracing" ? 3 : 5,
      allowMore: true,
    },
  } satisfies Serialized<WritingObligation>;
}
function assemble(input: {
  previous: Serialized<ControlDevelopmentBody>;
  fixture: boolean;
  turns: readonly Turn[];
}): Body {
  const catalog = required(
    input.previous.lessonTasks.find((task) => task.number === 6),
  );
  return {
    ...input.previous,
    coverage: "lesson1-complete",
    releaseId: input.fixture
      ? "fixture.writing.release.1"
      : "development-content-fingerprint",
    tasks: [
      ...input.previous.tasks,
      {
        kind: "soundWritingV1",
        task: {
          id: catalog.id,
          number: catalog.number,
          title: catalog.title,
          optional: true,
          startNodeId: `${catalog.id}.${required(input.turns[0]).suffix}`,
          targets: ["m", "s"].map((target, index) => ({
            id: `${catalog.id}.${target}`,
            sourceRefs: [
              input.fixture
                ? "fixture.writing.guides"
                : "book.printed32.l01.t06.guides",
              ...new Set(
                input.turns
                  .filter((turn) => turn.target === target)
                  .flatMap((turn) => turn.script.sourceRefs),
              ),
            ],
            logicalWidth: 1000,
            logicalHeight: 160,
            guides: { top: 0, midline: 80, baseline: 160 },
            boardY: index * 160,
          })),
          nodes: input.turns.map((turn, index): Node => ({
            id: `${catalog.id}.${turn.suffix}`,
            kind: "turn",
            route: "normal",
            parentRole:
              turn.obligation.kind === "modelAndSound" ? "model" : "listen",
            ...turn.script,
            presentation: {
              kind: "writing",
              targetId: `${catalog.id}.${turn.target}`,
              obligation: turn.obligation,
            },
            next: input.turns[index + 1]
              ? {
                  kind: "node",
                  nodeId: `${catalog.id}.${required(input.turns[index + 1]).suffix}`,
                }
              : { kind: "end" },
          })),
        },
      },
    ],
  };
}
export function createWritingFixtureBody(): Body {
  const synthetic = (input: {
    text: string;
    expected?: boolean;
    praise?: boolean;
  }): Script => ({
    sourceRefs: ["fixture.writing.source"],
    guidance: [
      { kind: "action", copy: { kind: "added", text: input.text } },
      ...(input.expected
        ? [
            {
              kind: "expected",
              copy: { kind: "added", text: "Synthetic sound response." },
            } satisfies Span,
          ]
        : []),
      ...(input.praise
        ? [
            {
              kind: "praise",
              copy: { kind: "added", text: "Synthetic writing praise." },
            } satisfies Span,
          ]
        : []),
    ],
  });
  return assemble({
    previous: createContinuousOralFixtureBody(),
    fixture: true,
    turns: [
      {
        suffix: "m-sound",
        target: "m",
        obligation: { kind: "soundResponse" },
        script: synthetic({
          text: "Synthetic first-target sound introduction.",
          expected: true,
          praise: true,
        }),
      },
      {
        suffix: "m-model",
        target: "m",
        obligation: { kind: "modelAndSound" },
        script: synthetic({
          text: "Synthetic first-row parent demonstration: vertical, then humps; child sound response.",
          expected: true,
        }),
      },
      {
        suffix: "m-tracing",
        target: "m",
        obligation: practice("childTracing"),
        script: synthetic({
          text: "Synthetic first-row tracing: two to three repetitions, sound, help and further practice.",
          praise: true,
        }),
      },
      {
        suffix: "m-independent",
        target: "m",
        obligation: practice("childIndependentWriting"),
        script: synthetic({
          text: "Synthetic first-row independent writing: three to five letters, sound, help and further practice.",
          praise: true,
        }),
      },
      {
        suffix: "s-model",
        target: "s",
        obligation: { kind: "modelAndSound" },
        script: synthetic({
          text: "Synthetic second-row parent demonstration and child sound response.",
          expected: true,
          praise: true,
        }),
      },
      {
        suffix: "s-tracing",
        target: "s",
        obligation: practice("childTracing"),
        script: synthetic({
          text: "Synthetic second-row tracing: two to three repetitions, help and further practice.",
          praise: true,
        }),
      },
      {
        suffix: "s-independent",
        target: "s",
        obligation: practice("childIndependentWriting"),
        script: synthetic({
          text: "Synthetic second-row independent writing: three to five letters, help and further practice.",
          praise: true,
        }),
      },
    ],
  });
}
function fragments(input: {
  span: Span;
  count: number;
  parenthetical: boolean;
}): string[] {
  const text = input.parenthetical
    ? input.span.copy.text.slice(1, -1)
    : input.span.copy.text;
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z])/u);
  if (parts.length !== input.count)
    throw new Error("Writing source sentence boundaries need review.");
  return parts;
}
function fragment(input: {
  span: Span;
  text: string;
  kind: Span["kind"];
}): Span {
  if (input.span.copy.kind === "added")
    throw new Error("Writing source provenance is missing.");
  return {
    kind: input.kind,
    copy: {
      kind: "adapted",
      text: input.kind === "action" ? `(${input.text})` : input.text,
      sourceRef: input.span.copy.sourceRef,
    },
  };
}
export function createWritingBody(input: RawAuthoringInput): Body {
  const sources = parseLessonSources({
    value: input.lessons,
    purpose: "cumulative",
  });
  const previous = authorContinuousBody({
    sources,
    overviewMarkdown: input.overviewMarkdown,
  });
  const source = required(
    sources.lessons
      .find((lesson) => lesson.number === 1)
      ?.tasks.find((task) => task.number === 6)?.sourceContentMarkdown,
  );
  const rows = [...source.matchAll(/(?:^|\n)(\d+)\. ([^\n]+)/g)];
  if (
    rows.length !== 5 ||
    rows.some((row, index) => Number(row[1]) !== index + 1) ||
    /^> /m.test(source)
  )
    throw new Error(
      "Writing requires its five source steps and no correction box.",
    );
  const steps = rows.map((row, index) =>
    oralGuidance({
      text: required(row[2]),
      sourceRef: `book.printed32.l01.t06.s0${index + 1}`,
      afterExpected: index === 1 ? "speech" : "praise",
    }),
  );
  const [first, modelM, practiceM, modelS, practiceS] = steps;
  if (
    first?.length !== 3 ||
    first[0]?.kind !== "speech" ||
    first[1]?.kind !== "expected" ||
    first[2]?.kind !== "praise" ||
    modelM?.length !== 7 ||
    modelM[0]?.kind !== "speech" ||
    modelM.slice(1, 4).some((span) => span.kind !== "action") ||
    modelM[4]?.kind !== "speech" ||
    modelM[5]?.kind !== "expected" ||
    modelM[6]?.kind !== "speech" ||
    practiceM?.length !== 2 ||
    practiceM[0]?.kind !== "action" ||
    practiceM[1]?.kind !== "speech" ||
    modelS?.length !== 5 ||
    modelS[0]?.kind !== "speech" ||
    modelS[1]?.kind !== "action" ||
    modelS[2]?.kind !== "speech" ||
    modelS[3]?.kind !== "expected" ||
    modelS[4]?.kind !== "praise" ||
    practiceS?.length !== 3 ||
    practiceS[0]?.kind !== "speech" ||
    practiceS[1]?.kind !== "action" ||
    practiceS[2]?.kind !== "speech"
  )
    throw new Error("Writing source roles or turn boundaries need review.");
  const firstTail = required(first[2]);
  const firstTailParts = fragments({
    span: firstTail,
    count: 2,
    parenthetical: false,
  });
  const invitationM = required(modelM[6]);
  const mParts = fragments({
    span: invitationM,
    count: 3,
    parenthetical: false,
  });
  const invitationS = required(practiceS[0]);
  const sParts = fragments({
    span: invitationS,
    count: 2,
    parenthetical: false,
  });
  const phaseGuidance = (input: {
    spans: readonly Span[];
    actionIndex: number;
    tracing: boolean;
  }): Span[] => {
    const action = required(input.spans[input.actionIndex]);
    const parts = fragments({ span: action, count: 4, parenthetical: true });
    const direction = required(parts[input.tracing ? 0 : 1]);
    if (
      !/\btwo or three\b/.test(required(parts[0])) ||
      !/\bthree to five\b/.test(required(parts[1]))
    )
      throw new Error("Writing source practice ranges need review.");
    return [
      fragment({ span: action, text: direction, kind: "action" }),
      fragment({ span: action, text: required(parts[2]), kind: "action" }),
      fragment({ span: action, text: required(parts[3]), kind: "action" }),
      { ...required(input.spans[input.actionIndex + 1]), kind: "praise" },
    ];
  };
  const speech = (input: { span: Span; text: string }) =>
    fragment({ ...input, kind: "speech" });
  return assemble({
    previous,
    fixture: false,
    turns: [
      {
        suffix: "m-sound",
        target: "m",
        obligation: { kind: "soundResponse" },
        script: script([
          ...first.slice(0, 2),
          fragment({
            span: firstTail,
            text: required(firstTailParts[0]),
            kind: "praise",
          }),
          speech({ span: firstTail, text: required(firstTailParts[1]) }),
        ]),
      },
      {
        suffix: "m-model",
        target: "m",
        obligation: { kind: "modelAndSound" },
        script: script(modelM.slice(0, 6)),
      },
      {
        suffix: "m-tracing",
        target: "m",
        obligation: practice("childTracing"),
        script: script([
          speech({ span: invitationM, text: required(mParts[0]) }),
          speech({ span: invitationM, text: required(mParts[2]) }),
          ...phaseGuidance({ spans: practiceM, actionIndex: 0, tracing: true }),
        ]),
      },
      {
        suffix: "m-independent",
        target: "m",
        obligation: practice("childIndependentWriting"),
        script: script([
          speech({ span: invitationM, text: required(mParts[1]) }),
          speech({ span: invitationM, text: required(mParts[2]) }),
          ...phaseGuidance({
            spans: practiceM,
            actionIndex: 0,
            tracing: false,
          }),
        ]),
      },
      {
        suffix: "s-model",
        target: "s",
        obligation: { kind: "modelAndSound" },
        script: script(modelS),
      },
      {
        suffix: "s-tracing",
        target: "s",
        obligation: practice("childTracing"),
        script: script([
          speech({ span: invitationS, text: required(sParts[0]) }),
          ...phaseGuidance({ spans: practiceS, actionIndex: 1, tracing: true }),
        ]),
      },
      {
        suffix: "s-independent",
        target: "s",
        obligation: practice("childIndependentWriting"),
        script: script([
          speech({ span: invitationS, text: required(sParts[1]) }),
          ...phaseGuidance({
            spans: practiceS,
            actionIndex: 1,
            tracing: false,
          }),
        ]),
      },
    ],
  });
}
export async function prepareWritingContent(input: { fixture: boolean }) {
  const sourcePaths = [
    "data/lessons-01-06.source.json",
    "output/markdown/overview-and-practice-guide.md",
  ];
  const scanPaths = [
    "output/markdown/assets/lessons-1-6/page-02.png",
    "output/markdown/assets/overview-page-09.png",
    "output/markdown/assets/overview-page-15.png",
    "output/markdown/assets/lessons-1-6/page-03.png",
  ];
  const sourceText = input.fixture
    ? []
    : await Promise.all(
        sourcePaths.map((path) => readFile(resolve(root, path), "utf8")),
      );
  const sources = await Promise.all(
    sourceText.map(async (text, index) => ({
      path: required(sourcePaths[index]),
      sha256: await hash(text),
    })),
  );
  const scans = input.fixture
    ? []
    : await Promise.all(
        scanPaths.map(async (path) => ({
          path,
          sha256: createHash("sha256")
            .update(await readFile(resolve(root, path)))
            .digest("hex"),
        })),
      );
  const review = input.fixture
    ? null
    : verifyGraphInputReview({
        review: JSON.parse(
          await readFile(
            resolve(root, ".local/runtime/writing-input-review.json"),
            "utf8",
          ),
        ),
        sources,
        scans,
      });
  const draft = input.fixture
    ? createWritingFixtureBody()
    : createWritingBody({
        lessons: JSON.parse(required(sourceText[0])),
        overviewMarkdown: required(sourceText[1]),
      });
  const body = input.fixture
    ? draft
    : {
        ...draft,
        releaseId: `development.lesson1-writing.${await hash(canonicalContentBody(draft))}`,
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
      ? "tests/fixtures/writing-development-package.json"
      : ".local/runtime/writing-development-package.json",
  );
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    await format(JSON.stringify(value), { parser: "json" }),
  );
  if (review) {
    const writing = required(
      body.tasks.find((entry) => entry.kind === "soundWritingV1"),
    );
    await writeFile(
      resolve(root, ".local/runtime/writing-source-review.json"),
      await format(
        JSON.stringify({
          status: "local-development-review",
          reviewedOn: review.reviewedOn,
          packageHash: value.packageHash,
          sources,
          scans,
          scope:
            "Cumulative Lesson 1 Tasks 1–6; new Task 6 printed32, five source steps and seven meaningful turns.",
          preparation: {
            sourceRef: "book.printed32.l01.t06.preface",
            sourceRecord:
              "Lesson1 Task6 unnumbered preface in the hash-bound raw source",
            handling:
              "Retained in the immutable source and preparation review; paper/sand/marker/page400 directions do not replace digital writing and are not runtime teaching turns.",
          },
          adaptations: [
            "Sustained phonemes retain normalized transcription and adapted provenance.",
            "Expected quote delimiters are removed and highlighted.",
            "Separated sentence fragments and parentheticals retain adapted provenance; shared help/praise is repeated without extra acceptance.",
            "Step2 post-response tracing invitation is speech; step1 Watch me is speech, separated from praise.",
            "Paper, marker, sand and page400 directions remain preparation data; the digital surface preserves source guide relationships.",
          ],
          sourceStepCoverage: [1, 2, 3, 4, 5].map((step) => ({
            sourceRef: `book.printed32.l01.t06.s0${step}`,
            nodeIds: writing.task.nodes
              .filter((node) =>
                node.sourceRefs.includes(`book.printed32.l01.t06.s0${step}`),
              )
              .map((node) => node.id),
          })),
          turnCoverage: writing.task.nodes,
          geometry: {
            status:
              "selected-from-actual-source-comparison-pending-final-production-qualification",
            sourceRef: "book.printed32.l01.t06.guides",
            provenance: "adapted",
            basis:
              "Root selected 1000×160 rows with shared adjacent solid rules after actual-source model and tracing pixel comparisons at 900×600 and 1280×800. The scan's solid top/baseline, dotted halfway line and lowercase model in the lower half remain the source basis; final production qualification is pending.",
            targets: writing.task.targets,
          },
          independentMappingReview: "pending-root-literal-scan-review",
          publication: "pending",
          runtimePublicationApproval: "pending-separate-record",
        }),
        { parser: "json" },
      ),
    );
  }
  process.stdout.write(
    `Prepared ${input.fixture ? "explicit synthetic writing fixture" : "private writing development content"}.\n`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await prepareWritingContent({ fixture: process.argv.includes("--fixture") });
