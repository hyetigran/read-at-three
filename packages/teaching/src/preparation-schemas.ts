import type { JTDDataType, SomeJTDSchemaType } from "ajv/dist/jtd.js";

const markKinds: ("bold" | "italic" | "underline")[] = [
  "bold",
  "italic",
  "underline",
];
const roles: ("guidance" | "action" | "speech")[] = [
  "guidance",
  "action",
  "speech",
];
const symbols: ("m" | "s" | "a" | "ē")[] = ["m", "s", "a", "ē"];
const reasons: ("missing" | "invalid")[] = ["missing", "invalid"];
const reviewKinds: ("synthetic" | "sourceReviewed")[] = [
  "synthetic",
  "sourceReviewed",
];
const mediaTypes: "image/svg+xml"[] = ["image/svg+xml"];
const discriminator: "kind" = "kind";
const string = { type: "string" } satisfies SomeJTDSchemaType;
const number = { type: "uint32" } satisfies SomeJTDSchemaType;
const copy = {
  discriminator,
  mapping: {
    added: { properties: { text: string } },
    source: { properties: { text: string, sourceRef: string } },
    adapted: { properties: { text: string, sourceRef: string } },
  },
} satisfies SomeJTDSchemaType;
const rich = {
  properties: {
    copy,
    marks: {
      elements: {
        properties: {
          kind: { enum: markKinds },
          start: number,
          length: number,
        },
      },
    },
  },
} satisfies SomeJTDSchemaType;
const target = {
  discriminator,
  mapping: {
    section: { properties: { sectionId: string } },
    lessonTask: { properties: { lesson: number, task: number } },
  },
} satisfies SomeJTDSchemaType;
const block = {
  discriminator,
  mapping: {
    paragraph: {
      properties: {
        id: string,
        role: { enum: roles },
        content: rich,
      },
    },
    list: {
      properties: {
        id: string,
        ordered: { type: "boolean" },
        items: { elements: rich },
      },
    },
    table: {
      properties: {
        id: string,
        caption: rich,
        headers: { elements: rich },
        rows: {
          elements: {
            properties: {
              cells: {
                elements: {
                  properties: { lines: { elements: rich } },
                  optionalProperties: {
                    symbol: { enum: symbols },
                  },
                },
              },
            },
          },
        },
      },
    },
    diagram: {
      properties: { id: string, assetId: string, caption: rich, alt: rich },
    },
    reference: { properties: { id: string, label: rich, target } },
  },
} satisfies SomeJTDSchemaType;
export const preparationInputSchema = {
  discriminator,
  mapping: {
    unavailable: {
      properties: { reason: { enum: reasons } },
    },
    available: { properties: { package: {} } },
  },
} satisfies SomeJTDSchemaType;
export const preparationValidationSchemas = {
  validatePreparationInput: preparationInputSchema,
  validatePreparationPackage: {
    properties: {
      formatVersion: number,
      preparationHash: string,
      body: {
        properties: {
          documentId: string,
          title: rich,
          reviewHash: string,
          provenance: {
            properties: {
              kind: { enum: reviewKinds },
              reviewId: string,
              compositionHash: string,
              reviews: {
                elements: { properties: { id: string, sha256: string } },
              },
              sources: {
                elements: {
                  properties: {
                    sourceRef: string,
                    sourceKey: string,
                    documentId: string,
                    pdfPages: { elements: number },
                    printedPages: { elements: { ...number, nullable: true } },
                    textHash: string,
                    parentTextHash: string,
                    start: number,
                    length: number,
                  },
                },
              },
            },
          },
          sections: {
            elements: {
              properties: {
                id: string,
                title: rich,
                blocks: { elements: block },
              },
            },
          },
          assets: {
            elements: {
              properties: {
                id: string,
                path: string,
                sha256: string,
                byteLength: number,
                mediaType: { enum: mediaTypes },
              },
            },
          },
        },
      },
      assets: { elements: { properties: { path: string, svg: string } } },
    },
  },
} satisfies Record<string, SomeJTDSchemaType>;
export type RawPreparationInput = JTDDataType<typeof preparationInputSchema>;
export type RawPreparationPackage = JTDDataType<
  typeof preparationValidationSchemas.validatePreparationPackage
>;
export type PreparationBody = RawPreparationPackage["body"];
export type PreparationRichText = PreparationBody["title"];
export type PreparationBlock =
  PreparationBody["sections"][number]["blocks"][number];
