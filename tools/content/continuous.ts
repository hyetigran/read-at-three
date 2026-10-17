import { requirePlainGuidance } from "@readatthree/teaching";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { format } from "prettier";
import {
  canonicalContentBody,
  parseDevelopmentPackage,
} from "@readatthree/teaching";
import type {
  ControlDevelopmentBody,
  ControlNode,
  ControlTask,
  Copy,
  PlainParentSpan as ParentSpan,
  Serialized,
} from "@readatthree/teaching";
import { verifyGraphInputReview } from "./graph.ts";
import { authorOralBody, createOralFixtureBody, oralGuidance } from "./oral.ts";
import { parseLessonSources } from "./source.ts";
import type { RawAuthoringInput, SourceAuthoringInput } from "./source.ts";

type Body = Serialized<ControlDevelopmentBody>;
type Node = Serialized<ControlNode>;
type Span = Serialized<ParentSpan>;
type Script = Pick<Node, "guidance" | "sourceRefs">;
type Item = "am" | "if" | "in";
type Role = "model" | "together" | "listen";
type Turn = Readonly<{
  suffix: string;
  item: Item;
  role: Role;
  script: Script;
}>;
type Scripts = Readonly<{
  turns: readonly Turn[];
  readiness(input: { item: Item }): Script;
  correction(input: {
    item: Item;
    part: "model" | "together" | "firm" | "test";
  }): Script;
  correctionLabel: Serialized<Copy>;
}>;
const root = resolve(import.meta.dirname, "../..");
const added = (text: string): Serialized<Copy> => ({ kind: "added", text });
const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
function required<T>(value: T | undefined): T {
  if (value === undefined)
    throw new Error("Continuous oral source mapping is incomplete.");
  return value;
}
function script(input: { guidance: readonly Span[] }): Script {
  return {
    guidance: input.guidance,
    sourceRefs: [
      ...new Set(
        input.guidance.flatMap((span) =>
          span.copy.kind === "added" ? [] : [span.copy.sourceRef],
        ),
      ),
    ],
  };
}
function assemble(input: {
  previous: Body;
  fixture: boolean;
  scripts: Scripts;
}): Body {
  const catalog = required(
    input.previous.lessonTasks.find((task) => task.number === 3),
  );
  const id = catalog.id;
  const normal: Node[] = [];
  for (const [index, turn] of input.scripts.turns.entries()) {
    const next = input.scripts.turns[index + 1];
    const gate = turn.suffix.endsWith("-again");
    normal.push({
      id: `${id}.${turn.suffix}`,
      kind: "turn",
      route: "normal",
      parentRole: turn.role,
      itemId: `${id}.${turn.item}`,
      presentation: { kind: "oral" },
      ...turn.script,
      next: gate
        ? { kind: "node", nodeId: `${id}.${turn.item}-firm` }
        : next
          ? { kind: "node", nodeId: `${id}.${next.suffix}` }
          : { kind: "end" },
    });
    if (gate)
      normal.push({
        id: `${id}.${turn.item}-firm`,
        kind: "untilFirm",
        policyId: `${id}.${turn.item}-until-firm`,
        cycleEntryNodeId: `${id}.${turn.suffix}`,
        cycleExitNodeId: `${id}.${turn.suffix}`,
        ...input.scripts.readiness({ item: turn.item }),
        next: { kind: "node", nodeId: `${id}.${required(next).suffix}` },
      });
  }
  const support: Node[] = [];
  const corrections: Serialized<ControlTask>["corrections"][number][] = [];
  for (const turn of input.scripts.turns.filter(
    (turn) => turn.role !== "model",
  )) {
    const correctionId = `${id}.correction-${turn.suffix}`;
    const instructionNodeIds = ["model", "together", "firm", "test"].map(
      (part) => `${correctionId}.${part}`,
    );
    for (const part of ["model", "together", "firm", "test"] satisfies (
      "model" | "together" | "firm" | "test"
    )[]) {
      const common = {
        id: `${correctionId}.${part}`,
        ...input.scripts.correction({ item: turn.item, part }),
        next: { kind: "end" } satisfies { kind: "end" },
      };
      support.push(
        part === "firm"
          ? {
              ...common,
              kind: "untilFirm",
              policyId: `${correctionId}.until-firm`,
              cycleEntryNodeId: `${correctionId}.together`,
              cycleExitNodeId: `${correctionId}.together`,
            }
          : {
              ...common,
              kind: "turn",
              route: "support",
              parentRole:
                part === "model"
                  ? "model"
                  : part === "together"
                    ? "together"
                    : "listen",
              itemId: `${id}.${turn.item}`,
              presentation: { kind: "oral" },
            },
      );
    }
    const trigger = normal.findIndex(
      (node) => node.id === `${id}.${turn.suffix}`,
    );
    const end = trigger + (normal[trigger + 1]?.kind === "untilFirm" ? 2 : 1);
    corrections.push({
      id: correctionId,
      label: input.scripts.correctionLabel,
      scope: "normal",
      eligibleNodeIds: [`${id}.${turn.suffix}`],
      instructionNodeIds,
      retestNodeIds: normal.slice(0, end).map((node) => node.id),
      sourceRefs: [
        ...new Set(
          support
            .filter((node) => instructionNodeIds.includes(node.id))
            .flatMap((node) => node.sourceRefs),
        ),
      ],
    });
  }
  const task: Serialized<ControlTask> = {
    id: catalog.id,
    number: catalog.number,
    title: catalog.title,
    startNodeId: `${id}.am-model`,
    nodes: [...normal, ...support],
    corrections,
  };
  return {
    ...input.previous,
    releaseId: input.fixture
      ? "fixture.continuous.release.1"
      : "development-content-fingerprint",
    tasks: [
      ...input.previous.tasks,
      { kind: "graphControls", task } satisfies Body["tasks"][number],
    ].sort((a, b) => a.task.number - b.task.number),
  };
}
export function createContinuousOralFixtureBody(): Body {
  const synthetic = (input: {
    text: string;
    expected?: boolean;
    praise?: boolean;
    restart?: boolean;
    sourceRef?: string;
  }): Script => ({
    sourceRefs: [input.sourceRef ?? "fixture.continuous.source"],
    guidance: [
      { kind: "speech", copy: added(input.text) },
      ...(input.expected
        ? [
            {
              kind: "expected",
              copy: added("Synthetic continuous response."),
            } satisfies Span,
          ]
        : []),
      ...(input.praise
        ? [
            {
              kind: "praise",
              copy: added("Synthetic continuous praise."),
            } satisfies Span,
          ]
        : []),
      ...(input.restart
        ? [
            {
              kind: "action",
              copy: added("Synthetic restart at the first turn."),
            } satisfies Span,
          ]
        : []),
    ],
  });
  const turns: Turn[] = [
    {
      suffix: "am-model",
      item: "am",
      role: "model",
      script: synthetic({ text: "Synthetic continuous parent model." }),
    },
  ];
  for (const item of ["am", "if", "in"] satisfies Item[]) {
    for (const part of ["together", "again", "independent"])
      turns.push({
        suffix: `${item}-${part}`,
        item,
        role: part === "independent" ? "listen" : "together",
        script: synthetic({
          text: `Synthetic ${item} ${part} turn.`,
          expected: true,
          praise: item === "in" && part === "independent",
        }),
      });
  }
  return assemble({
    previous: createOralFixtureBody(),
    fixture: true,
    scripts: {
      turns,
      correctionLabel: added("Synthetic continuous help"),
      readiness: () =>
        synthetic({ text: "Synthetic parent judges joint practice firm." }),
      correction: ({ part }) =>
        synthetic({
          text: `Synthetic correction ${part}.`,
          expected: part === "together" || part === "test",
          praise: part === "test",
          restart: part === "test",
          sourceRef: "fixture.continuous.correction",
        }),
    },
  });
}
function sourcePage(input: { markdown: string; printed: number }): string {
  const page = input.markdown
    .split(
      new RegExp(
        `^## PDF page \\d+ \\(printed page ${input.printed}\\)\\s*$`,
        "m",
      ),
    )[1]
    ?.split(/^## PDF page /m)[0];
  return required(page);
}
function sentenceParts(input: { span: Span }): Span[] {
  return input.span.copy.text
    .split(/(?<=[.!?])\s+(?=[A-Z])/u)
    .map((text) => ({ ...input.span, copy: { ...input.span.copy, text } }));
}
export function createContinuousOralBody(input: RawAuthoringInput): Body {
  return authorContinuousBody({
    sources: parseLessonSources({
      value: input.lessons,
      purpose: "cumulative",
    }),
    overviewMarkdown: input.overviewMarkdown,
  });
}
export function authorContinuousBody(input: SourceAuthoringInput): Body {
  const previous = authorOralBody(input);
  const source = required(
    input.sources.lessons
      .find((lesson) => lesson.number === 1)
      ?.tasks.find((task) => task.number === 3)?.sourceContentMarkdown,
  );
  const rows = [...source.matchAll(/(?:^|\n)(\d+)\. ([^\n]+)/g)];
  if (
    rows.length !== 5 ||
    rows.some((row, index) => Number(row[1]) !== index + 1)
  )
    throw new Error("Continuous oral source steps changed.");
  const steps = rows.map((row, index) =>
    oralGuidance({
      text: required(row[2]),
      sourceRef: `book.printed31.l01.t03.s0${index + 1}`,
      afterExpected: "speech",
    }),
  );
  const first = required(steps[0]);
  if (
    first.length !== 4 ||
    first[0]?.kind !== "speech" ||
    first[1]?.kind !== "action" ||
    first[2]?.kind !== "speech" ||
    first[3]?.kind !== "expected"
  )
    throw new Error(
      "Continuous oral initial model and joint turn need review.",
    );
  const turns: Turn[] = [
    {
      suffix: "am-model",
      item: "am",
      role: "model",
      script: script({ guidance: first.slice(0, 2) }),
    },
    {
      suffix: "am-together",
      item: "am",
      role: "together",
      script: script({ guidance: first.slice(2) }),
    },
  ];
  const readiness = new Map<Item, Script>();
  const amAgain = required(steps[1]),
    amIndependent = required(steps[2]);
  if (
    amAgain.length !== 3 ||
    amAgain[2]?.kind !== "action" ||
    amIndependent.length !== 2
  )
    throw new Error(
      "Continuous oral first Again and independent turn need review.",
    );
  readiness.set("am", script({ guidance: amAgain.slice(2) }));
  turns.push(
    {
      suffix: "am-again",
      item: "am",
      role: "together",
      script: script({ guidance: amAgain.slice(0, 2) }),
    },
    {
      suffix: "am-independent",
      item: "am",
      role: "listen",
      script: script({ guidance: amIndependent }),
    },
  );
  const guide = sourcePage({ markdown: input.overviewMarkdown, printed: 16 });
  const technique = required(
    guide
      .split("\n")
      .find(
        (line) =>
          line.startsWith("|") &&
          !/^\|\s*[-:]/.test(line) &&
          line.split("|").at(-2)?.includes("until"),
      )
      ?.split("|")
      .at(-2)
      ?.trim(),
  );
  const guideSentences = technique.split(/(?<=[.!?])\s+/u);
  if (guideSentences.length !== 3)
    throw new Error("Continuous oral guide readiness needs review.");
  const leading: Span = {
    kind: "action",
    copy: {
      kind: "source",
      text: required(guideSentences[1]),
      sourceRef: "book.printed16.oral-blending.leading",
    },
  };
  for (const { item, index } of [
    { item: "if", index: 3 },
    { item: "in", index: 4 },
  ] satisfies { item: Item; index: number }[]) {
    const spans = required(steps[index]);
    if (
      spans.length !== (item === "in" ? 7 : 6) ||
      spans[1]?.kind !== "expected" ||
      spans[2]?.kind !== "speech" ||
      spans[3]?.kind !== "action" ||
      spans[4]?.kind !== "speech" ||
      spans[5]?.kind !== "expected"
    )
      throw new Error(
        "Continuous oral later joint, Again and independent turns need review.",
      );
    turns.push(
      {
        suffix: `${item}-together`,
        item,
        role: "together",
        script: script({ guidance: spans.slice(0, 2) }),
      },
      {
        suffix: `${item}-again`,
        item,
        role: "together",
        script: script({
          guidance: [
            required(spans[2]),
            {
              ...required(spans[1]),
              copy: {
                ...required(spans[1]).copy,
                kind: "adapted",
                sourceRef: `book.printed31.l01.t03.s0${index + 1}`,
              },
            },
          ],
        }),
      },
      {
        suffix: `${item}-independent`,
        item,
        role: "listen",
        script: script({
          guidance: spans
            .slice(4)
            .map((span, index) =>
              item === "in" && index === 2 ? { ...span, kind: "praise" } : span,
            ),
        }),
      },
    );
    readiness.set(
      item,
      script({
        guidance:
          item === "if" ? [required(spans[3]), leading] : [required(spans[3])],
      }),
    );
  }
  const box = [...source.matchAll(/^> (.+)$/gm)];
  if (box.length !== 1)
    throw new Error("Continuous oral correction box changed.");
  const correction = oralGuidance({
    text: required(required(box[0])[1]),
    sourceRef: "book.printed31.l01.t03.correction",
    afterExpected: "speech",
  });
  if (
    correction.length !== 4 ||
    correction[0]?.kind !== "action" ||
    correction[1]?.kind !== "speech" ||
    correction[2]?.kind !== "expected" ||
    correction[3]?.kind !== "action"
  )
    throw new Error(
      "Continuous oral correction model and joint practice need review.",
    );
  const correctionSpeech = sentenceParts({ span: required(correction[1]) });
  if (correctionSpeech.length !== 2)
    throw new Error("Continuous oral correction turn boundary needs review.");
  const correctionPage = sourcePage({
    markdown: input.overviewMarkdown,
    printed: 22,
  });
  const table = required(
    correctionPage.split(/^### Oral Tasks Corrections\s*$/m)[1],
  ).split(/^### /m)[0];
  const tableRows = required(table)
    .split("\n")
    .filter((line) => line.startsWith("|") && !/^\|\s*[-:]/.test(line));
  const procedure = required(required(tableRows[1]).split("|")[2]).trim();
  const general = oralGuidance({
    text: procedure,
    sourceRef: "book.printed22.correction.oral-continuous",
    afterExpected: "praise",
  });
  const firstExpected = general.findIndex((span) => span.kind === "expected");
  const testAction = required(general[firstExpected + 1]);
  const testDirection = required(
    testAction.copy.text.split(/\.\s+/u).at(-1),
  ).replace(/[)]$/, "");
  if (
    testAction.kind !== "action" ||
    general[firstExpected + 2]?.kind !== "praise" ||
    general[firstExpected + 3]?.kind !== "expected" ||
    general[firstExpected + 4]?.kind !== "praise" ||
    general[firstExpected + 5]?.kind !== "action" ||
    general.length !== firstExpected + 6
  )
    throw new Error(
      "Continuous oral correction independent test and praise need review.",
    );
  const test: Span[] = [
    {
      kind: "action",
      copy: {
        kind: "adapted",
        text: `(${testDirection})`,
        sourceRef: "book.printed22.correction.oral-continuous",
      },
    },
    { ...required(general[firstExpected + 2]), kind: "speech" },
    ...general.slice(firstExpected + 3),
  ];
  const expected = new Map<Item, string>(
    turns
      .filter((turn) => turn.suffix.endsWith("-together"))
      .map((turn) => [
        turn.item,
        requirePlainGuidance(
          required(
            turn.script.guidance.find((span) => span.kind === "expected"),
          ),
        ).copy.text.replace(/[.!?]$/, ""),
      ]),
  );
  const adapt = (input: { item: Item; guidance: readonly Span[] }): Script =>
    script({
      guidance: input.guidance.map((span) => {
        const text = span.copy.text.replace(
          /([a-z])\1{2,}([a-z])\2{2,}/giu,
          required(expected.get(input.item)),
        );
        return {
          ...span,
          copy:
            span.copy.kind === "added"
              ? span.copy
              : {
                  ...span.copy,
                  text,
                  kind:
                    text !== span.copy.text ||
                    input.item !== "am" ||
                    span.copy.kind === "adapted"
                      ? "adapted"
                      : "source",
                },
        };
      }),
    });
  return assemble({
    previous,
    fixture: false,
    scripts: {
      turns,
      readiness: ({ item }) => required(readiness.get(item)),
      correctionLabel: added("Sounds without stopping"),
      correction: ({ item, part }) =>
        adapt({
          item,
          guidance:
            part === "model"
              ? [required(correction[0]), required(correctionSpeech[0])]
              : part === "together"
                ? [required(correctionSpeech[1]), required(correction[2])]
                : part === "firm"
                  ? [required(correction[3])]
                  : test,
        }),
    },
  });
}
export async function prepareContinuousOralContent(input: {
  fixture: boolean;
}) {
  const sourcePaths = [
    "data/lessons-01-06.source.json",
    "output/markdown/overview-and-practice-guide.md",
  ];
  const scanPaths = [
    "output/markdown/assets/lessons-1-6/page-02.png",
    "output/markdown/assets/overview-page-09.png",
    "output/markdown/assets/overview-page-15.png",
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
            resolve(root, ".local/runtime/continuous-input-review.json"),
            "utf8",
          ),
        ),
        sources,
        scans,
      });
  const draft = input.fixture
    ? createContinuousOralFixtureBody()
    : createContinuousOralBody({
        lessons: JSON.parse(required(sourceText[0])),
        overviewMarkdown: required(sourceText[1]),
      });
  const body = input.fixture
    ? draft
    : {
        ...draft,
        releaseId: `development.lesson1-continuous.${await hash(canonicalContentBody(draft))}`,
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
      ? "tests/fixtures/continuous-development-package.json"
      : ".local/runtime/continuous-development-package.json",
  );
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    await format(JSON.stringify(value), { parser: "json" }),
  );
  if (review)
    await writeFile(
      resolve(root, ".local/runtime/continuous-source-review.json"),
      await format(
        JSON.stringify({
          status: "local-development-review",
          reviewedOn: review.reviewedOn,
          packageHash: value.packageHash,
          sources,
          scans,
          scope:
            "Lesson 1 Task 3 printed 31, oral blending guide printed 16 and continuous correction guide printed 22.",
          adaptations: [
            "Elongated phonemes use normalized transcription and are adapted throughout.",
            "Expected quote delimiters are removed and highlighted.",
            "Later Again turns reuse the current expected response as contextual adaptation.",
            "Correction test action is separated from joint readiness and highlighted.",
            "Current-item substitutions are adapted throughout correction guidance.",
            "Restart prefixes begin at the single normal sequence entry and end through the trigger and its gate. The endpoint is contextual application bookkeeping.",
          ],
          coverage: body.tasks.filter((entry) => entry.task.number === 3),
          independentMappingReview: "pending-separate-private-review",
          publication: "pending",
          runtimePublicationApproval: "pending-separate-record",
        }),
        { parser: "json" },
      ),
    );
  process.stdout.write(
    `Prepared ${input.fixture ? "explicit synthetic continuous fixture" : "private continuous development content"}.\n`,
  );
}
