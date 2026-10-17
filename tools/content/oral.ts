import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { format } from "prettier";
import {
  canonicalContentBody,
  parseDevelopmentPackage,
} from "@readatthree/teaching";
import type {
  ControlCorrection,
  ControlDevelopmentBody,
  ControlNode,
  ControlTask,
  Copy,
  GraphDevelopmentBody,
  ParentSpan,
  Serialized,
} from "@readatthree/teaching";
import {
  authorGraphBody,
  createGraphFixtureBody,
  verifyGraphInputReview,
} from "./graph.ts";
import { parseLessonSources } from "./source.ts";
import type { RawAuthoringInput, SourceAuthoringInput } from "./source.ts";

type BodyInput = Serialized<ControlDevelopmentBody>;
type NodeInput = Serialized<ControlNode>;
type TaskInput = Serialized<ControlTask>;
type SpanInput = Serialized<ParentSpan>;
type CopyInput = Serialized<Copy>;
type CorrectionInput = Serialized<ControlCorrection>;
type Script = Pick<NodeInput, "guidance" | "sourceRefs">;
type OralNumber = 2 | 5;
type CorrectionKind = "slow" | "quiet";
type ItemPlan = Readonly<{ step: number; turn: number }>;
type Scripts = Readonly<{
  model(): Script;
  response(input: { task: OralNumber; index: number }): Script;
  label(input: { task: OralNumber; index: number }): CopyInput;
  readiness(): Script;
  review(): Script;
  correctionLabel(kind: CorrectionKind): CopyInput;
  correction(input: {
    task: OralNumber;
    index: number;
    kind: CorrectionKind;
  }): Script;
}>;

const root = resolve(import.meta.dirname, "../..");
const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
const added = (text: string): CopyInput => ({ kind: "added", text });
const plans: Readonly<Record<OralNumber, readonly ItemPlan[]>> = {
  2: [
    { step: 2, turn: 1 },
    { step: 3, turn: 1 },
    { step: 4, turn: 1 },
    { step: 5, turn: 1 },
    { step: 6, turn: 1 },
    { step: 7, turn: 1 },
  ],
  5: [
    { step: 1, turn: 1 },
    { step: 2, turn: 1 },
    { step: 2, turn: 2 },
    { step: 2, turn: 3 },
  ],
};

function assembleTask(input: {
  id: string;
  number: OralNumber;
  title: CopyInput;
  scripts: Scripts;
}): TaskInput {
  const prefix = input.id;
  const responseId = (index: number) =>
    `${prefix}.response-${String(index + 1).padStart(2, "0")}`;
  const itemId = (index: number) =>
    `${prefix}.item-${String(index + 1).padStart(2, "0")}`;
  const firmId = `${prefix}.first-item-firm`;
  const selectionId = `${prefix}.select-review`;
  const exitId = `${prefix}.review-exit`;
  const reviewId = `${prefix}.review`;
  const modelId = `${prefix}.model`;
  const items = plans[input.number];
  const firstResponse = responseId(0);
  const normal: NodeInput[] = items.map((_item, index) => {
    const next =
      input.number === 2 && index === 0
        ? firmId
        : index + 1 < items.length
          ? responseId(index + 1)
          : input.number === 2
            ? selectionId
            : null;
    return {
      id: responseId(index),
      kind: "turn",
      route: "normal",
      ...input.scripts.response({ task: input.number, index }),
      parentRole: "listen",
      itemId: itemId(index),
      presentation: { kind: "oral" },
      next: next ? { kind: "node", nodeId: next } : { kind: "end" },
    };
  });
  if (input.number === 2) {
    normal.unshift({
      id: modelId,
      kind: "turn",
      route: "normal",
      ...input.scripts.model(),
      parentRole: "model",
      itemId: itemId(0),
      presentation: { kind: "oral" },
      next: { kind: "node", nodeId: firstResponse },
    });
    normal.splice(2, 0, {
      id: firmId,
      kind: "untilFirm",
      ...input.scripts.readiness(),
      policyId: `${prefix}.until-firm`,
      cycleEntryNodeId: firstResponse,
      cycleExitNodeId: firstResponse,
      next: { kind: "node", nodeId: responseId(1) },
    });
    normal.push(
      {
        id: selectionId,
        kind: "selectiveReview",
        ...input.scripts.review(),
        reviewId,
        items: items.map((_item, index) => ({
          itemId: itemId(index),
          parentLabel: input.scripts.label({ task: input.number, index }),
          entryNodeId: responseId(index),
          exitNodeId: index === 0 ? firmId : responseId(index),
        })),
        returnNodeId: selectionId,
        exitNodeId: exitId,
      },
      {
        id: exitId,
        kind: "reviewExit",
        ...input.scripts.review(),
        reviewId,
        next: { kind: "end" },
      },
    );
  }
  const support: NodeInput[] = [];
  const corrections: CorrectionInput[] = [];
  for (const [index] of items.entries()) {
    for (const kind of ["slow", "quiet"] satisfies CorrectionKind[]) {
      const correctionId = `${prefix}.correction-${kind}-${index + 1}`;
      const instructionId = `${correctionId}.instruction`;
      const script = input.scripts.correction({
        task: input.number,
        index,
        kind,
      });
      support.push({
        id: instructionId,
        kind: "turn",
        route: "support",
        ...script,
        parentRole: "listen",
        itemId: itemId(index),
        presentation: { kind: "oral" },
        next: { kind: "end" },
      });
      const taskSpecific = input.number === 2 && index === 0 && kind === "slow";
      const currentRoute =
        input.number === 2 && index === 0
          ? [responseId(index), firmId]
          : [responseId(index)];
      const exitIndex = normal.findIndex(
        (node) => node.id === currentRoute.at(-1),
      );
      if (exitIndex < 0)
        throw new Error("A correction has no current item exit.");
      const normalRoute = normal.slice(0, exitIndex + 1).map((node) => node.id);
      const scopes = taskSpecific
        ? (["any"] satisfies CorrectionInput["scope"][])
        : input.number === 2
          ? (["normal", "review"] satisfies CorrectionInput["scope"][])
          : (["normal"] satisfies CorrectionInput["scope"][]);
      for (const scope of scopes) {
        corrections.push({
          id: `${correctionId}.${scope}`,
          label: input.scripts.correctionLabel(kind),
          scope,
          eligibleNodeIds: [responseId(index)],
          instructionNodeIds: [instructionId],
          retestNodeIds:
            taskSpecific || scope === "review" ? currentRoute : normalRoute,
          sourceRefs: script.sourceRefs,
        });
      }
    }
  }
  return {
    id: input.id,
    number: input.number,
    title: input.title,
    startNodeId: input.number === 2 ? modelId : firstResponse,
    nodes: [...normal, ...support],
    corrections,
  };
}

function assembleBody(input: {
  printed: Serialized<GraphDevelopmentBody>;
  fixture: boolean;
  scripts: Scripts;
}): BodyInput {
  const oral = ([2, 5] satisfies OralNumber[]).map((number) => {
    const task = input.printed.lessonTasks.find(
      (item) => item.number === number,
    );
    if (!task)
      throw new Error("An oral task needs its stable catalog identity.");
    return assembleTask({ ...task, number, scripts: input.scripts });
  });
  return {
    ...input.printed,
    releaseId: input.fixture
      ? "fixture.oral.release.1"
      : "development-content-fingerprint",
    coverage: "lesson1-sounds-oral-complete",
    tasks: [
      ...input.printed.tasks.map(
        (task) =>
          ({
            kind: "printedGraphV1",
            task,
          }) satisfies BodyInput["tasks"][number],
      ),
      ...oral.map(
        (task) =>
          ({
            kind: "graphControls",
            task,
          }) satisfies BodyInput["tasks"][number],
      ),
    ].sort((left, right) => left.task.number - right.task.number),
  };
}

export function createOralFixtureBody(): BodyInput {
  const script = ({
    sourceRef,
    text,
    expected = false,
  }: {
    sourceRef: string;
    text: string;
    expected?: boolean;
  }): Script => ({
    sourceRefs: [sourceRef],
    guidance: [
      { kind: "speech", copy: added(text) },
      ...(expected
        ? [
            {
              kind: "expected",
              copy: added("Synthetic whole response."),
            } satisfies SpanInput,
          ]
        : []),
    ],
  });
  return assembleBody({
    fixture: true,
    printed: createGraphFixtureBody(),
    scripts: {
      model: () =>
        script({
          sourceRef: "fixture.oral.t2.s1",
          text: "Synthetic oral parent model.",
        }),
      response: ({ task, index }) =>
        script({
          sourceRef: `fixture.oral.t${task}.response${index + 1}`,
          text: `Synthetic oral item ${index + 1} prompt.`,
          expected: true,
        }),
      label: ({ task: _task, index }) => added(`Synthetic item ${index + 1}`),
      readiness: () =>
        script({
          sourceRef: "fixture.oral.t2.s2",
          text: "Synthetic repeat until the parent judges firm.",
        }),
      review: () =>
        script({
          sourceRef: "fixture.oral.t2.s8",
          text: "Synthetic parent chooses troublesome items to repeat.",
        }),
      correction: ({ task, index, kind }) =>
        script({
          sourceRef: `fixture.oral.t${task}.correction.${kind}`,
          text: `Synthetic ${kind} correction for item ${index + 1}.`,
          expected: true,
        }),
      correctionLabel: (kind) => added(`Synthetic ${kind} help`),
    },
  });
}

function tokens(text: string): string[] {
  const plain = text.replaceAll("**", "");
  const result = [...plain.matchAll(/\([^()]*\)|"[^"\n]*"|[^(")]+/g)].map(
    (match) => match[0],
  );
  if (result.join("") !== plain)
    throw new Error("An oral source span needs editorial review.");
  return result.map((token) => token.trim()).filter(Boolean);
}

export function oralGuidance(input: {
  text: string;
  sourceRef: string;
  adapted?: boolean;
  afterExpected: "speech" | "praise";
}): SpanInput[] {
  let responseSeen = false;
  return tokens(input.text).map((text): SpanInput => {
    const expected = text.startsWith('"');
    const kind = text.startsWith("(")
      ? "action"
      : expected
        ? "expected"
        : responseSeen
          ? input.afterExpected
          : "speech";
    if (expected) responseSeen = true;
    const adapted = input.adapted || expected || /([a-zē])\1{2,}/iu.test(text);
    return {
      kind,
      copy: {
        kind: adapted ? "adapted" : "source",
        text: expected ? text.slice(1, -1) : text,
        sourceRef: input.sourceRef,
      },
    };
  });
}

function splitResponses(text: string): string[] {
  const result: string[] = [];
  let current: string[] = [];
  for (const token of tokens(text)) {
    current.push(token);
    if (token.startsWith('"')) {
      result.push(current.join(" "));
      current = [];
    }
  }
  if (current.length)
    throw new Error(
      "An oral response group has an unreviewed trailing instruction.",
    );
  return result;
}

function expectedAnswer(text: string): string {
  const answers = tokens(text).filter((token) => token.startsWith('"'));
  if (answers.length !== 1 || !answers[0])
    throw new Error("An oral response needs one expected answer.");
  return answers[0].slice(1, -1);
}

function oralPrompt(text: string): string {
  const before = text.slice(0, text.indexOf('"')).trim();
  const withoutDirective = before.replace(/[^.!?()]+[.!?]\s*$/, "").trim();
  const withoutDelay = withoutDirective.replace(/\s*\([^()]*\)\s*$/, "").trim();
  const parts = withoutDelay.split(/\(pause\)/i);
  const clean = (part: string) =>
    part
      .split(/\.\s+|:\s*/)
      .at(-1)
      ?.replace(/[.]$/, "")
      .trim() ?? "";
  const prompt = parts.map(clean).join(" (pause) ");
  if (!prompt)
    throw new Error("An oral correction needs a reviewed spoken prompt.");
  return prompt;
}

function generalCorrections(
  markdown: string,
): Readonly<Record<CorrectionKind, string>> {
  const page = markdown
    .split(/^## PDF page \d+ \(printed page 22\)\s*$/m)[1]
    ?.split(/^## PDF page /m)[0];
  if (!page) throw new Error("The oral correction overview page is missing.");
  const section = page
    .split(/^### Oral Tasks Corrections\s*$/m)[1]
    ?.split(/^### /m)[0];
  const rows = section
    ?.split("\n")
    .filter((line) => line.startsWith("|") && !/^\|\s*[-:]/.test(line));
  const procedure = rows?.[2]?.split("|")[2]?.trim();
  if (!procedure)
    throw new Error(
      "The general oral fast and quiet correction row is missing.",
    );
  const pieces = tokens(procedure);
  const firstExpected = pieces.findIndex((piece) => piece.startsWith('"'));
  const quietStart = pieces.findIndex(
    (piece, index) => index > firstExpected && piece.startsWith("("),
  );
  if (firstExpected < 0 || quietStart < 0)
    throw new Error(
      "General oral corrections need distinct slow and quiet branches.",
    );
  const returnAction = pieces.at(-1);
  if (!returnAction?.startsWith("("))
    throw new Error("General oral corrections need their return direction.");
  const slow = [...pieces.slice(0, quietStart), returnAction].join(" ");
  const quiet = pieces.slice(quietStart).join(" ");
  expectedAnswer(slow);
  expectedAnswer(quiet);
  return { slow, quiet };
}

function substituteCorrection(input: {
  text: string;
  response: string;
  prompt: string;
}): string {
  const original = expectedAnswer(input.text).replace(/[.!?]$/, "");
  const replacement = input.response.replace(/[.!?]$/, "");
  const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const phonics = input.text.match(/\.{3}\s*([^.!?]+)[.!?]/)?.[1]?.trim();
  if (!phonics)
    throw new Error("The general correction needs its supplied oral example.");
  const titleCase = original[0]?.toUpperCase() + original.slice(1);
  const replacementTitle = replacement[0]?.toUpperCase() + replacement.slice(1);
  return input.text
    .replaceAll(phonics, input.prompt)
    .replace(
      new RegExp(`\\b${escaped.toUpperCase()}\\b`, "g"),
      replacement.toUpperCase(),
    )
    .replace(new RegExp(`\\b${escaped}\\b`, "g"), replacement)
    .replace(new RegExp(`\\b${titleCase}(?=[.!?])`, "g"), replacementTitle);
}

export function createOralBody(input: RawAuthoringInput): BodyInput {
  return authorOralBody({
    sources: parseLessonSources({
      value: input.lessons,
      purpose: "cumulative",
    }),
    overviewMarkdown: input.overviewMarkdown,
  });
}

export function authorOralBody(input: SourceAuthoringInput): BodyInput {
  const printed = authorGraphBody(input);
  const lesson = input.sources.lessons.find((item) => item.number === 1);
  if (!lesson) throw new Error("Supplied Lesson 1 is missing.");
  const texts = new Map<OralNumber, Map<number, string>>();
  const rawTasks = new Map(
    lesson.tasks.map((task) => [task.number, task.sourceContentMarkdown]),
  );
  for (const number of [2, 5] satisfies OralNumber[]) {
    const text = rawTasks.get(number);
    if (!text) throw new Error("A supplied oral task is missing.");
    const rows = [...text.matchAll(/(?:^|\n)(\d+)\. ([^\n]+)/g)];
    if (rows.length !== (number === 2 ? 8 : 2))
      throw new Error("The supplied oral step count changed.");
    texts.set(
      number,
      new Map(rows.map((row) => [Number(row[1]), row[2] ?? ""])),
    );
  }
  const step = ({
    task,
    number,
  }: {
    task: OralNumber;
    number: number;
  }): string => {
    const text = texts.get(task)?.get(number);
    if (!text) throw new Error("A supplied oral step is missing.");
    return text;
  };
  const taskTwoFirst = step({ task: 2, number: 2 });
  const firstTokens = tokens(taskTwoFirst);
  const repeat = firstTokens.at(-1);
  if (!repeat?.startsWith("(") || !/2/.test(repeat))
    throw new Error(
      "The first oral item needs its supplied until-firm direction.",
    );
  const responseText = ({
    task,
    index,
  }: {
    task: OralNumber;
    index: number;
  }): string => {
    const plan = plans[task][index];
    if (!plan) throw new Error("An oral item has no source plan.");
    if (task === 2 && index === 0) return firstTokens.slice(0, -1).join(" ");
    if (task === 5 && plan.step === 2) {
      const turns = splitResponses(step({ task: 5, number: 2 }));
      if (turns.length !== 3)
        throw new Error("Task 5 step 2 needs all three independent responses.");
      const text = turns[plan.turn - 1];
      if (!text) throw new Error("A Task 5 independent response is missing.");
      return text;
    }
    const text = step({ task, number: plan.step });
    expectedAnswer(text);
    return text;
  };
  const ref = ({ task, index }: { task: OralNumber; index: number }) => {
    const plan = plans[task][index];
    if (!plan) throw new Error("An oral source reference has no item.");
    return `book.printed${task === 2 ? 31 : 32}.l01.t${String(task).padStart(2, "0")}.s${String(plan.step).padStart(2, "0")}.turn${plan.turn}`;
  };
  const generals = generalCorrections(input.overviewMarkdown);
  const specific = [...(rawTasks.get(2) ?? "").matchAll(/^> (.+)$/gm)].map(
    (match) => match[1] ?? "",
  );
  if (specific.length !== 1 || !specific[0])
    throw new Error("Task 2 needs its supplied correction box.");
  const specificText = specific[0];
  return assembleBody({
    fixture: false,
    printed,
    scripts: {
      model: () => ({
        sourceRefs: ["book.printed31.l01.t02.s01"],
        guidance: oralGuidance({
          text: step({ task: 2, number: 1 }),
          sourceRef: "book.printed31.l01.t02.s01",
          afterExpected: "speech",
        }),
      }),
      response: ({ task, index }) => ({
        sourceRefs: [ref({ task, index })],
        guidance: oralGuidance({
          text: responseText({ task, index }),
          sourceRef: ref({ task, index }),
          afterExpected: "speech",
        }),
      }),
      label: ({ task, index }) => ({
        kind: "adapted",
        text: expectedAnswer(responseText({ task, index })).replace(
          /[.!?]$/,
          "",
        ),
        sourceRef: ref({ task, index }),
      }),
      readiness: () => ({
        sourceRefs: ["book.printed31.l01.t02.s02.until-firm"],
        guidance: [
          {
            kind: "action",
            copy: {
              kind: "source",
              text: repeat,
              sourceRef: "book.printed31.l01.t02.s02.until-firm",
            },
          },
        ],
      }),
      review: () => ({
        sourceRefs: ["book.printed31.l01.t02.s08"],
        guidance: oralGuidance({
          text: step({ task: 2, number: 8 }),
          sourceRef: "book.printed31.l01.t02.s08",
          afterExpected: "speech",
        }),
      }),
      correction({ task, index, kind }) {
        const direct = task === 2 && index === 0 && kind === "slow";
        const sourceRef = direct
          ? "book.printed31.l01.t02.correction-slow"
          : `book.printed22.correction.oral-fast.${kind}`;
        const text = direct
          ? specificText
          : substituteCorrection({
              text: generals[kind],
              response: expectedAnswer(responseText({ task, index })),
              prompt: oralPrompt(responseText({ task, index })),
            });
        return {
          sourceRefs: [sourceRef, ref({ task, index })],
          guidance: oralGuidance({
            text,
            sourceRef,
            adapted: !direct,
            afterExpected: direct ? "speech" : "praise",
          }),
        };
      },
      correctionLabel: (kind) =>
        added(kind === "slow" ? "Say it fast" : "Speak quietly"),
    },
  });
}

export async function prepareOralContent(input: { fixture: boolean }) {
  const sourcePaths = [
    "data/lessons-01-06.source.json",
    "output/markdown/overview-and-practice-guide.md",
  ];
  const scanPaths = [
    "output/markdown/assets/lessons-1-6/page-02.png",
    "output/markdown/assets/lessons-1-6/page-03.png",
    "output/markdown/assets/overview-page-15.png",
  ];
  const sourceText = input.fixture
    ? []
    : await Promise.all(
        sourcePaths.map((path) => readFile(resolve(root, path), "utf8")),
      );
  const sources = await Promise.all(
    sourceText.map(async (text, index) => ({
      path: sourcePaths[index] ?? "",
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
  const inputReview = input.fixture
    ? null
    : verifyGraphInputReview({
        review: JSON.parse(
          await readFile(
            resolve(root, ".local/runtime/oral-input-review.json"),
            "utf8",
          ),
        ),
        sources,
        scans,
      });
  const lessonText = sourceText[0];
  const overviewMarkdown = sourceText[1];
  const draft = input.fixture
    ? createOralFixtureBody()
    : lessonText && overviewMarkdown
      ? createOralBody({ lessons: JSON.parse(lessonText), overviewMarkdown })
      : null;
  if (!draft) throw new Error("Private oral source inputs are required.");
  const body = input.fixture
    ? draft
    : {
        ...draft,
        releaseId: `development.lesson1-sounds-oral.${await hash(canonicalContentBody(draft))}`,
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
      ? "tests/fixtures/oral-development-package.json"
      : ".local/runtime/oral-development-package.json",
  );
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    await format(JSON.stringify(value), { parser: "json" }),
  );
  if (inputReview) {
    await writeFile(
      resolve(root, ".local/runtime/oral-source-review.json"),
      await format(
        JSON.stringify({
          status: "local-development-review",
          reviewedOn: inputReview.reviewedOn,
          packageHash: value.packageHash,
          sources,
          scans,
          sourceMap: ".scratch/issue-04/content/source-map.md",
          scope:
            "Printed pages 31 and 32, oral fast and quiet correction row on printed page 22.",
          adaptations: [
            "Expected response quote delimiters become adapted parent-only copy.",
            "Regularized sustained sound notation remains adapted.",
            "General correction current-word and spoken-prompt substitutions are adapted throughout.",
            "Parent selection labels are adapted expected-answer text.",
            "Normal general correction restarts at task entry through the trigger, then resumes ordinary delivery. The correction-context endpoint is application bookkeeping rather than a printed source exit.",
            "Review correction restarts only the current selected item under the separately reviewed contextual range interpretation, preserving its queue and readiness.",
          ],
          coverage: body.tasks
            .filter((task) => task.kind === "graphControls")
            .map(({ task }) => ({
              taskId: task.id,
              turns: task.nodes.map((node) => ({
                id: node.id,
                kind: node.kind,
                sourceRefs: node.sourceRefs,
                guidanceKinds: node.guidance.map((span) => span.kind),
                provenance: node.guidance.map((span) => span.copy.kind),
              })),
              corrections: task.corrections,
            })),
          publication: "pending",
          runtimePublicationApproval: "pending-separate-record",
          independentMappingReview: "separate-private-record",
        }),
        { parser: "json" },
      ),
    );
  }
  process.stdout.write(
    `Prepared ${input.fixture ? "explicit synthetic oral fixture" : "private oral development content"}.\n`,
  );
}
