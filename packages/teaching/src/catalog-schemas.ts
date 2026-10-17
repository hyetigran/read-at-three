import type { JSONSchemaType } from "ajv";
import type { CatalogTask, Serialized } from "./types.ts";

const id = {
  type: "string",
  minLength: 1,
  maxLength: 200,
} satisfies JSONSchemaType<string>;
const copy = {
  oneOf: [
    {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["source", "adapted"] },
        text: { type: "string", minLength: 1, maxLength: 20000 },
        sourceRef: id,
      },
      required: ["kind", "text", "sourceRef"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        kind: { type: "string", const: "added" },
        text: { type: "string", minLength: 1, maxLength: 20000 },
      },
      required: ["kind", "text"],
      additionalProperties: false,
    },
  ],
} satisfies JSONSchemaType<Serialized<CatalogTask["title"]>>;
const common = {
  id,
  number: {
    type: "integer",
    minimum: 1,
    maximum: 100,
  } satisfies JSONSchemaType<number>,
  title: copy,
  available: { type: "boolean" } satisfies JSONSchemaType<boolean>,
  packageHash: {
    type: "string",
    pattern: "^[a-f0-9]{64}$",
  } satisfies JSONSchemaType<string>,
  savedSessionId: {
    anyOf: [id, { type: "null", nullable: true }],
  } satisfies JSONSchemaType<string | null>,
};
export const forbiddenCatalogSkippedSchema = {
  type: "object",
  properties: {},
  required: [],
  not: {},
};
const legacy = {
  type: "object",
  properties: {
    ...common,
    optional: { type: "boolean" },
    completed: { type: "boolean" },
    skipped: { $ref: "#/$defs/forbiddenCatalogSkipped" },
  },
  required: [
    "id",
    "number",
    "title",
    "optional",
    "available",
    "completed",
    "packageHash",
    "savedSessionId",
  ],
  additionalProperties: false,
} satisfies JSONSchemaType<
  Serialized<CatalogTask & Readonly<{ skipped?: never }>>
>;
const skipped = {
  type: "object",
  properties: {
    ...common,
    optional: { type: "boolean", const: true },
    completed: { type: "boolean", const: false },
    skipped: { type: "boolean", const: true },
  },
  required: [
    "id",
    "number",
    "title",
    "optional",
    "available",
    "completed",
    "packageHash",
    "savedSessionId",
    "skipped",
  ],
  additionalProperties: false,
} satisfies JSONSchemaType<
  Serialized<
    CatalogTask & Readonly<{ optional: true; completed: false; skipped: true }>
  >
>;
export const catalogTaskSchema = {
  oneOf: [legacy, skipped],
} satisfies JSONSchemaType<Serialized<CatalogTask>>;
