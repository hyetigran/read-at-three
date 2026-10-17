import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Ajv } from "ajv/dist/jtd.js";
import type { JTDDataType, SomeJTDSchemaType } from "ajv/dist/jtd.js";
import {
  canonical,
  parsePreparationPackage,
  preparationByteLength,
} from "@readatthree/teaching";
import type {
  PreparationBody,
  PreparationBlock,
  PreparationRichText,
  VerifiedPreparationDocument,
} from "@readatthree/teaching";

const string = { type: "string" } satisfies SomeJTDSchemaType;
const number = { type: "uint32" } satisfies SomeJTDSchemaType;
const digestSchema = {
  properties: { path: string, sha256: string },
  additionalProperties: true,
} satisfies SomeJTDSchemaType;
const spanSchema = {
  properties: { sourceKey: string, exactVerifiedText: string },
  optionalProperties: {
    documentId: string,
    pdfPage: number,
    printedPage: { ...number, nullable: true },
    pdfPages: { elements: number },
    printedPages: { elements: { ...number, nullable: true } },
    taskTitle: string,
    kind: string,
    bold: { type: "boolean" },
    emphasisObservations: { elements: string },
    markdown: {
      optionalProperties: {
        inputId: string,
        lineNumbers: { elements: number },
        textAtReview: string,
        line: number,
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
} satisfies SomeJTDSchemaType;
const reviewSchema = {
  optionalProperties: {
    selectedVerifiedSpans: { elements: spanSchema },
    headers: { elements: spanSchema },
    selectedVerifiedRows: { elements: spanSchema },
    inputs: { elements: digestSchema },
    render: digestSchema,
    renders: { elements: digestSchema },
    source: {
      optionalProperties: { render: string, renderSha256: string },
      additionalProperties: true,
    },
    extendsWithoutModification: {
      properties: { index: string, sha256: string },
    },
    rowPresentation: {
      elements: {
        properties: {
          sourceKey: string,
          exampleWord: string,
          boldExampleWord: { type: "boolean" },
          underlinedRange: { properties: { start: number, length: number } },
        },
      },
    },
    runtimeAssets: {
      elements: { properties: { name: string, path: string, sha256: string } },
    },
    existingGlyph: {
      properties: {
        archivedPath: string,
        fileSha256: string,
        mPathSha256: string,
        transformation: string,
      },
    },
  },
  additionalProperties: true,
} satisfies SomeJTDSchemaType;
const appCopy = {
  properties: { origin: { enum: ["app"] }, text: string },
} satisfies SomeJTDSchemaType;
const strings = { elements: string } satisfies SomeJTDSchemaType;
const compositionSchema = {
  properties: {
    format: string,
    status: string,
    publicationApproval: string,
    sourceReviews: { elements: digestSchema },
    sections: {
      elements: {
        properties: { id: string },
        optionalProperties: {
          title: appCopy,
          titleSourceKey: string,
          subtitleSourceKey: string,
          chartTitleSourceKey: string,
          paragraphs: strings,
          chartRows: strings,
          chartColumnSourceKeys: strings,
          notation: strings,
          numberedSteps: strings,
          bulletSteps: strings,
          closingParagraphs: strings,
          introduction: strings,
          columnSourceKeys: strings,
          rows: strings,
          appChartExplanation: appCopy,
          appExplanation: appCopy,
          dependency: string,
          diagramReview: digestSchema,
          diagramAssets: {
            elements: {
              properties: { sourceKey: string, path: string, sha256: string },
            },
          },
          exactExcerpt: {
            properties: {
              sourceKey: string,
              newSourceKey: string,
              endBefore: string,
              reason: string,
            },
          },
        },
      },
    },
    excluded: {
      elements: { properties: { sourceKey: string, reason: string } },
    },
    runtimeRules: strings,
  },
} satisfies SomeJTDSchemaType;
const provenanceSchema = {
  properties: {
    inputs: {
      elements: {
        properties: { inputId: string, path: string, sha256: string },
        additionalProperties: true,
      },
    },
    rendering: {
      properties: {
        renders: {
          elements: {
            properties: { inputId: string, path: string, sha256: string },
            additionalProperties: true,
          },
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
} satisfies SomeJTDSchemaType;
const ajv = new Ajv();
const validateComposition = ajv.compile<never, typeof compositionSchema>(
  compositionSchema,
);
const validateReview = ajv.compile<never, typeof reviewSchema>(reviewSchema);
const validateProvenance = ajv.compile<never, typeof provenanceSchema>(
  provenanceSchema,
);
type Span = JTDDataType<typeof spanSchema>;
type Review = JTDDataType<typeof reviewSchema>;
const selectedCompositionHash =
  "86664436cf0475b56cdf232f4f5e1155dfda2b8bf75c71e506cef85dd58d611e";
const selectedProvenanceHash =
  "9216b6fb9ba411ccc5897973699bfd3a6bb77e39e4fc08a2e6c7afd3f93ea57b";
const digest = (input: string | Uint8Array) =>
  createHash("sha256").update(input).digest("hex");
const hash = async (input: string) => digest(input);
const added = (text: string): PreparationRichText => ({
  copy: { kind: "added", text },
  marks: [],
});
function needed<T>(value: T | undefined): T {
  if (value === undefined)
    throw new Error("Preparation review dependency is missing.");
  return value;
}
function readJson(text: string): unknown {
  return JSON.parse(text);
}
function marks(span: Span): PreparationRichText["marks"] {
  const result: PreparationRichText["marks"] = [];
  if (span.bold)
    result.push({
      kind: "bold",
      start: 0,
      length: span.exactVerifiedText.length,
    });
  for (const observation of span.emphasisObservations ?? []) {
    const entire = /^entire (paragraph|item|sentence) bold$/u.test(observation);
    const italic = observation.endsWith(" italic in the scan");
    const anchor = italic
      ? observation.slice(0, -" italic in the scan".length)
      : observation;
    const start = entire ? 0 : span.exactVerifiedText.indexOf(anchor);
    if (
      start < 0 ||
      (!entire && span.exactVerifiedText.indexOf(anchor, start + 1) !== -1)
    )
      throw new Error(`Ambiguous preparation emphasis in ${span.sourceKey}.`);
    result.push({
      kind: italic ? "italic" : "bold",
      start,
      length: entire ? span.exactVerifiedText.length : anchor.length,
    });
  }
  return result;
}
const checklistMarks: Record<string, PreparationRichText["marks"]> = {
  "prep.checklist.program": [{ kind: "bold", start: 36, length: 49 }],
  "prep.checklist.oral-sounds-fast": [{ kind: "italic", start: 0, length: 10 }],
  "prep.checklist.rhyming": [{ kind: "italic", start: 306, length: 40 }],
};

export async function compilePreparation(input: {
  compositionPath: string;
  sourceRoot: string;
}): Promise<VerifiedPreparationDocument> {
  const compositionPath = resolve(input.compositionPath),
    reviewRoot = dirname(compositionPath),
    sourceRoot = resolve(input.sourceRoot);
  const compositionBytes = await readFile(compositionPath);
  if (digest(compositionBytes) !== selectedCompositionHash)
    throw new Error(
      "Preparation composition changed. A new source review is required.",
    );
  const composition: unknown = readJson(compositionBytes.toString("utf8"));
  if (
    !validateComposition(composition) ||
    composition.format !== "private-preparation-composition-v1"
  )
    throw new Error("Preparation composition is unsupported.");
  const auditInputs: { id: string; sha256: string }[] = [];
  async function checked(
    path: string,
    expected: string,
    base: string,
  ): Promise<string> {
    const bytes = await readFile(isAbsolute(path) ? path : resolve(base, path));
    if (!/^[a-f0-9]{64}$/u.test(expected) || digest(bytes) !== expected)
      throw new Error("Preparation source/review/asset identity changed.");
    return bytes.toString("utf8");
  }
  const originalReview = needed(composition.sourceReviews[0]);
  const provenancePath = resolve(
    reviewRoot,
    dirname(originalReview.path),
    "provenance.json",
  );
  const provenanceValue: unknown = readJson(
    await checked(provenancePath, selectedProvenanceHash, reviewRoot),
  );
  if (!validateProvenance(provenanceValue))
    throw new Error("Preparation source provenance is invalid.");
  const sourceInputs = new Map(
    provenanceValue.inputs.map((entry) => [entry.inputId, entry]),
  );
  for (const name of [
    "source-introduction-pdf",
    "source-guide-pdf",
    "introduction-markdown",
    "guide-markdown",
  ]) {
    const entry = needed(sourceInputs.get(name));
    await checked(entry.path, entry.sha256, sourceRoot);
  }
  for (const render of provenanceValue.rendering.renders)
    await checked(render.path, render.sha256, sourceRoot);
  const spans = new Map<string, Span>(),
    presentation = new Map<
      string,
      NonNullable<Review["rowPresentation"]>[number]
    >();
  for (const [index, entry] of composition.sourceReviews.entries()) {
    const review: unknown = readJson(
      await checked(entry.path, entry.sha256, reviewRoot),
    );
    if (!validateReview(review))
      throw new Error(
        `Preparation source review shape is invalid: ${JSON.stringify(validateReview.errors)}`,
      );
    auditInputs.push({
      id: `source-review-${index + 1}`,
      sha256: entry.sha256,
    });
    if (
      review.extendsWithoutModification?.sha256 !== undefined &&
      review.extendsWithoutModification.sha256 !== originalReview.sha256
    )
      throw new Error("Preparation review extension changed.");
    for (const entry of review.inputs ?? [])
      await checked(entry.path, entry.sha256, sourceRoot);
    for (const entry of [
      ...(review.renders ?? []),
      ...(review.render ? [review.render] : []),
    ])
      await checked(entry.path, entry.sha256, sourceRoot);
    if (review.source?.render && review.source.renderSha256)
      await checked(
        review.source.render,
        review.source.renderSha256,
        reviewRoot,
      );
    for (const span of [
      ...(review.selectedVerifiedSpans ?? []),
      ...(review.headers ?? []),
      ...(review.selectedVerifiedRows ?? []),
    ]) {
      if (spans.has(span.sourceKey))
        throw new Error("Preparation source keys repeat.");
      spans.set(span.sourceKey, span);
      if (
        span.markdown?.inputId &&
        span.markdown.lineNumbers &&
        span.markdown.textAtReview
      ) {
        const file = needed(sourceInputs.get(span.markdown.inputId));
        const lines = (await checked(file.path, file.sha256, sourceRoot)).split(
          /\r?\n/u,
        );
        if (
          span.markdown.lineNumbers
            .map((number) => needed(lines[number - 1]))
            .join("\n") !== span.markdown.textAtReview
        )
          throw new Error("Preparation transcription span changed.");
      }
    }
    for (const row of review.rowPresentation ?? [])
      presentation.set(row.sourceKey, row);
  }
  const sources: PreparationBody["provenance"]["sources"] = [],
    assets: PreparationBody["assets"] = [],
    payloads: { path: string; svg: string }[] = [];
  const selected = new Set<string>();
  function source(
    key: string,
    options: {
      text?: string;
      offset?: number;
      field?: string;
      reference?: string;
      marks?: PreparationRichText["marks"];
    } = {},
  ): PreparationRichText {
    const span = needed(spans.get(key));
    selected.add(key);
    const parent =
      options.field === "title"
        ? needed(span.taskTitle)
        : span.exactVerifiedText;
    const text = options.text ?? parent,
      start = options.offset ?? 0;
    if (parent.slice(start, start + text.length) !== text)
      throw new Error("Preparation source slice is not exact.");
    const sourceRef = `${options.reference ?? key}.${options.field ?? "text"}.${start}`;
    if (sources.some((source) => source.sourceRef === sourceRef))
      throw new Error("Preparation source slice is duplicated.");
    const pdfPages = span.pdfPages ?? [span.pdfPage ?? 17],
      printedPages = span.printedPages ?? [span.printedPage ?? 24];
    sources.push({
      sourceRef,
      sourceKey: key,
      documentId: span.documentId ?? "tyc-overview-practice-guide",
      pdfPages,
      printedPages,
      textHash: digest(text),
      parentTextHash: digest(parent),
      start,
      length: text.length,
    });
    return {
      copy: { kind: "source", text, sourceRef },
      marks: options.marks ?? marks(span),
    };
  }
  const sections: PreparationBody["sections"] = [];
  for (const section of composition.sections) {
    const blocks: PreparationBlock[] = [];
    let sequence = 0;
    const nextId = () => `${section.id}.block.${++sequence}`;
    function paragraph(
      key: string,
      role: "guidance" | "action" | "speech" = "guidance",
    ) {
      blocks.push({
        kind: "paragraph",
        id: nextId(),
        role,
        content: source(key),
      });
    }
    if (!section.notation)
      for (const key of section.paragraphs ?? []) paragraph(key);
    if (section.chartRows) {
      const rows = section.chartRows.map((key) => {
        const span = needed(spans.get(key)),
          cells = span.exactVerifiedText.split("\t"),
          row = needed(presentation.get(key));
        if (
          cells.length !== 5 ||
          cells[2] !== row.exampleWord ||
          row.underlinedRange.start !== 0 ||
          row.underlinedRange.length !== 1
        )
          throw new Error("Preparation pronunciation table changed.");
        let offset = 0;
        return {
          cells: cells.map(
            (
              text,
              index,
            ): Extract<
              PreparationBlock,
              { kind: "table" }
            >["rows"][number]["cells"][number] => {
              const rich = source(key, {
                text,
                offset,
                marks:
                  index === 2
                    ? [
                        { kind: "bold", start: 0, length: text.length },
                        { kind: "underline", ...row.underlinedRange },
                      ]
                    : [],
              });
              offset += text.length + 1;
              if (index !== 0) return { lines: [rich] };
              const symbols = ["m", "s", "a", "ē"];
              if (!symbols.includes(text))
                throw new Error("Preparation chart symbol is unsupported.");
              const symbol =
                text === "m"
                  ? "m"
                  : text === "s"
                    ? "s"
                    : text === "a"
                      ? "a"
                      : "ē";
              return { lines: [rich], symbol };
            },
          ),
        };
      });
      blocks.push({
        kind: "table",
        id: nextId(),
        caption: source(needed(section.chartTitleSourceKey)),
        headers: needed(section.chartColumnSourceKeys).map((key) =>
          source(key),
        ),
        rows,
      });
    }
    if (section.appChartExplanation)
      blocks.push({
        kind: "paragraph",
        id: nextId(),
        role: "guidance",
        content: added(section.appChartExplanation.text),
      });
    if (section.diagramReview) {
      const review: unknown = readJson(
        await checked(
          section.diagramReview.path,
          section.diagramReview.sha256,
          reviewRoot,
        ),
      );
      if (
        !validateReview(review) ||
        !review.runtimeAssets ||
        !review.existingGlyph ||
        !review.source?.render ||
        !review.source.renderSha256
      )
        throw new Error("Preparation diagram review is invalid.");
      auditInputs.push({
        id: "diagram-review",
        sha256: section.diagramReview.sha256,
      });
      await checked(
        review.source.render,
        review.source.renderSha256,
        reviewRoot,
      );
      await checked(
        review.existingGlyph.archivedPath,
        review.existingGlyph.fileSha256,
        reviewRoot,
      );
      for (const [index, asset] of needed(section.diagramAssets).entries()) {
        const reviewed = needed(review.runtimeAssets[index]);
        if (asset.path !== reviewed.path || asset.sha256 !== reviewed.sha256)
          throw new Error("Preparation diagram selection changed.");
        const svg = await checked(asset.path, asset.sha256, sourceRoot),
          path = `assets/${asset.sha256}.svg`;
        const assetId = `preparation.diagram.${index + 1}`;
        assets.push({
          id: assetId,
          path,
          sha256: asset.sha256,
          byteLength: preparationByteLength(svg),
          mediaType: "image/svg+xml",
        });
        payloads.push({ path, svg });
        blocks.push({
          kind: "diagram",
          id: nextId(),
          assetId,
          caption: added(
            index === 0
              ? "Continuous pointing diagram"
              : "Rhyming pointing diagram",
          ),
          alt: added(
            index === 0
              ? "A focus ball leads to a hold point under the sound and a right-pointing arrow."
              : "A focus ball leads to a hold point under the sound and a longer right-pointing arrow.",
          ),
        });
      }
    }
    if (section.notation)
      blocks.push({
        kind: "list",
        id: nextId(),
        ordered: false,
        items: section.notation.map((key) => source(key)),
      });
    if (section.appExplanation)
      blocks.push({
        kind: "paragraph",
        id: nextId(),
        role: "guidance",
        content: added(section.appExplanation.text),
      });
    if (section.notation)
      for (const key of section.paragraphs ?? []) paragraph(key);
    for (const [keys, ordered] of [
      [section.numberedSteps, true],
      [section.bulletSteps, false],
    ] as const)
      if (keys)
        blocks.push({
          kind: "list",
          id: nextId(),
          ordered,
          items: keys.map((key) => source(key)),
        });
    for (const key of section.closingParagraphs ?? []) paragraph(key);
    if (section.exactExcerpt) {
      const excerpt = section.exactExcerpt,
        text = needed(spans.get(excerpt.sourceKey)).exactVerifiedText;
      if (
        !text.endsWith(excerpt.endBefore) ||
        !text.slice(0, -excerpt.endBefore.length).endsWith(".")
      )
        throw new Error("Preparation complete prefix changed.");
      blocks.push({
        kind: "paragraph",
        id: nextId(),
        role: "guidance",
        content: source(excerpt.sourceKey, {
          text: text.slice(0, -excerpt.endBefore.length),
          reference: excerpt.newSourceKey,
          marks: [],
        }),
      });
    }
    for (const key of section.introduction ?? []) {
      const span = needed(spans.get(key));
      paragraph(
        key,
        span.kind === "speech"
          ? "speech"
          : span.kind === "action"
            ? "action"
            : "guidance",
      );
    }
    if (section.subtitleSourceKey) paragraph(section.subtitleSourceKey);
    if (section.rows) {
      const rows = section.rows.map((key) => {
        const span = needed(spans.get(key)),
          lines = span.exactVerifiedText.split("\n");
        let offset = 0;
        return {
          cells: [
            {
              lines: [
                source(key, {
                  field: "title",
                  marks: [
                    {
                      kind: "bold",
                      start: 0,
                      length: needed(span.taskTitle).length,
                    },
                  ],
                }),
              ],
            },
            {
              lines: lines.map((text) => {
                const ranges = (checklistMarks[key] ?? [])
                  .filter(
                    (mark) =>
                      mark.start >= offset &&
                      mark.start + mark.length <= offset + text.length,
                  )
                  .map((mark) => ({ ...mark, start: mark.start - offset }));
                const rich = source(key, { text, offset, marks: ranges });
                offset += text.length + 1;
                return rich;
              }),
            },
          ],
        };
      });
      blocks.push({
        kind: "table",
        id: nextId(),
        caption: added("Beginner practice checklist"),
        headers: needed(section.columnSourceKeys).map((key) =>
          source(key, {
            marks: [
              {
                kind: "bold",
                start: 0,
                length: needed(spans.get(key)).exactVerifiedText.length,
              },
            ],
          }),
        ),
        rows,
      });
    }
    if (section.introduction) {
      for (const [label, target] of [
        [
          "Review the beginner checklist",
          { kind: "section", sectionId: "preparation.checklist" },
        ],
        [
          "Preview Lesson 1, Task 1",
          { kind: "lessonTask", lesson: 1, task: 1 },
        ],
      ] as const)
        blocks.push({
          kind: "reference",
          id: nextId(),
          label: added(label),
          target,
        });
    }
    if (section.rows)
      blocks.push({
        kind: "reference",
        id: nextId(),
        label: added("Review the introduction to your child"),
        target: { kind: "section", sectionId: "preparation.first-lesson" },
      });
    sections.push({
      id: section.id,
      title: section.title
        ? added(section.title.text)
        : source(needed(section.titleSourceKey), {
            marks: [
              {
                kind: "bold",
                start: 0,
                length: needed(spans.get(needed(section.titleSourceKey)))
                  .exactVerifiedText.length,
              },
            ],
          }),
      blocks,
    });
  }
  const exclusions = new Set(
    composition.excluded.map((entry) => entry.sourceKey),
  );
  if (
    selected.size !== 70 ||
    sections.length !== 9 ||
    [...spans.keys()].some((key) => !selected.has(key) && !exclusions.has(key))
  )
    throw new Error("Preparation selected source coverage is incomplete.");
  const provenance: PreparationBody["provenance"] = {
    kind: "sourceReviewed",
    reviewId: "beginner-parent-preparation.v1",
    compositionHash: digest(compositionBytes),
    reviews: auditInputs,
    sources,
  };
  const body: PreparationBody = {
    documentId: "beginner-parent-preparation.v1",
    title: added("Parent preparation"),
    provenance,
    reviewHash: digest(canonical(provenance)),
    sections,
    assets,
  };
  return parsePreparationPackage(
    {
      formatVersion: 1,
      preparationHash: digest(canonical(body)),
      body,
      assets: payloads,
    },
    hash,
  );
}

export async function createFixturePreparationPackage(): Promise<VerifiedPreparationDocument> {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" aria-hidden="true" focusable="false"><g fill="#211b46"><circle cx="25" cy="25" r="5"/><path d="M30 25h50"/></g></svg>';
  const assetHash = digest(svg),
    path = `assets/${assetHash}.svg`;
  const provenance: PreparationBody["provenance"] = {
    kind: "synthetic",
    reviewId: "fixture.preparation.review.v1",
    compositionHash: digest("Synthetic preparation composition."),
    reviews: [],
    sources: [],
  };
  const body: PreparationBody = {
    documentId: "fixture.preparation.v1",
    title: added("Fixture parent preparation"),
    reviewHash: digest(canonical(provenance)),
    provenance,
    sections: [
      {
        id: "fixture.overview",
        title: added("Read together"),
        blocks: [
          {
            kind: "paragraph",
            id: "fixture.direction",
            role: "guidance",
            content: {
              copy: {
                kind: "added",
                text: "A parent reads these synthetic directions.",
              },
              marks: [{ kind: "bold", start: 0, length: 8 }],
            },
          },
          {
            kind: "list",
            id: "fixture.steps",
            ordered: true,
            items: [
              added("Read the fixture guidance."),
              added("Confirm preparation explicitly."),
            ],
          },
          {
            kind: "table",
            id: "fixture.table",
            caption: added("Synthetic reference table"),
            headers: [added("Example"), added("Parent action")],
            rows: [
              {
                cells: [
                  {
                    lines: [
                      {
                        copy: { kind: "added", text: "Sample" },
                        marks: [{ kind: "underline", start: 0, length: 1 }],
                      },
                    ],
                  },
                  { lines: [added("Practice together.")] },
                ],
              },
            ],
          },
          {
            kind: "diagram",
            id: "fixture.diagram",
            assetId: "fixture.diagram",
            caption: added("Synthetic geometry"),
            alt: added("A circle and a horizontal line."),
          },
          {
            kind: "reference",
            id: "fixture.reference",
            label: added("Review this section"),
            target: { kind: "section", sectionId: "fixture.overview" },
          },
        ],
      },
    ],
    assets: [
      {
        id: "fixture.diagram",
        path,
        sha256: assetHash,
        byteLength: preparationByteLength(svg),
        mediaType: "image/svg+xml",
      },
    ],
  };
  return parsePreparationPackage(
    {
      formatVersion: 1,
      preparationHash: digest(canonical(body)),
      body,
      assets: [{ path, svg }],
    },
    hash,
  );
}
async function main() {
  const args = process.argv.slice(2),
    fixture = args.includes("--fixture");
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index++) {
    const key = needed(args[index]);
    if (key === "--fixture") continue;
    if (
      !["--composition", "--source-root", "--output", "--audit"].includes(
        key,
      ) ||
      values.has(key)
    )
      throw new Error(
        "Usage: preparation.ts [--fixture] [--composition PATH] [--source-root PATH] [--output PATH] [--audit PATH]",
      );
    values.set(key, needed(args[++index]));
  }
  const sourceRoot = resolve(values.get("--source-root") ?? process.cwd());
  const output = resolve(
    values.get("--output") ??
      resolve(sourceRoot, ".local/preparation/preparation-package.json"),
  );
  const result = fixture
    ? await createFixturePreparationPackage()
    : await compilePreparation({
        compositionPath:
          values.get("--composition") ??
          resolve(sourceRoot, ".local/preparation/composition.json"),
        sourceRoot,
      });
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, canonical(result) + "\n");
  const audit = values.get("--audit");
  if (audit) {
    const path = resolve(audit);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(
      path,
      JSON.stringify(
        {
          preparationHash: result.preparationHash,
          reviewHash: result.body.reviewHash,
          provenance: result.body.provenance,
          sections: result.body.sections.map((section) => ({
            id: section.id,
            blocks: section.blocks,
          })),
          publicationApproval: "pending-separate-runtime-record",
        },
        null,
        2,
      ) + "\n",
    );
  }
  process.stdout.write(
    JSON.stringify({
      preparationHash: result.preparationHash,
      reviewHash: result.body.reviewHash,
      sections: result.body.sections.length,
      sourceFields: result.body.provenance.sources.length,
      assets: result.assets.length,
      synthetic: fixture,
      publicationApproval: "pending-separate-runtime-record",
    }) + "\n",
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await main();
