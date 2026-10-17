import type { JSONSchemaType } from "ajv";
import type {
  Copy,
  DocumentToken,
  ParentSpan,
  Serialized,
  WritingAction,
  WritingBarrier,
  WritingNode,
  WritingObligation,
  WritingPresentation,
  WritingTarget,
  WritingTask,
} from "./types.ts";
import type {
  BrushSpec,
  InkChunk,
  InkCommand,
  InkEdit,
  InkReceipt,
} from "./ink.ts";
const id = {
  type: "string",
  minLength: 1,
  maxLength: 200,
} satisfies JSONSchemaType<string>;
const counter = {
  type: "string",
  pattern: "^(0|[1-9][0-9]{0,18})$",
} satisfies JSONSchemaType<string>;
const hash = {
  type: "string",
  pattern: "^[a-f0-9]{64}$",
} satisfies JSONSchemaType<string>;
const number = { type: "number" } satisfies JSONSchemaType<number>;
const integer = {
  type: "integer",
  minimum: 0,
  maximum: 1000000,
} satisfies JSONSchemaType<number>;
const refs = {
  type: "array",
  items: id,
  minItems: 1,
  maxItems: 1000,
  uniqueItems: true,
} satisfies JSONSchemaType<readonly string[]>;
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
} satisfies JSONSchemaType<Serialized<Copy>>;

const span = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["action", "speech", "expected", "praise"] },
    copy,
  },
  required: ["kind", "copy"],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<ParentSpan>>;
export const writingObligationSchema = {
  oneOf: [
    {
      type: "object",
      properties: { kind: { type: "string", const: "soundResponse" } },
      required: ["kind"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: { kind: { type: "string", const: "modelAndSound" } },
      required: ["kind"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        kind: { type: "string", const: "phaseConfirmation" },
        phase: {
          type: "string",
          enum: ["childTracing", "childIndependentWriting"],
        },
        practice: {
          type: "object",
          properties: {
            minimum: { type: "integer", minimum: 2, maximum: 3 },
            maximum: { type: "integer", minimum: 3, maximum: 5 },
            allowMore: { type: "boolean", const: true },
          },
          required: ["minimum", "maximum", "allowMore"],
          additionalProperties: false,
        },
      },
      required: ["kind", "phase", "practice"],
      additionalProperties: false,
    },
  ],
} satisfies JSONSchemaType<Serialized<WritingObligation>>;
export const writingPresentationSchema = {
  type: "object",
  properties: {
    kind: { type: "string", const: "writing" },
    targetId: id,
    obligation: writingObligationSchema,
  },
  required: ["kind", "targetId", "obligation"],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<WritingPresentation>>;
export const writingNodeSchema = {
  type: "object",
  properties: {
    id,
    sourceRefs: refs,
    guidance: { type: "array", items: span, minItems: 1, maxItems: 100 },
    kind: { type: "string", const: "turn" },
    route: { type: "string", const: "normal" },
    parentRole: { type: "string", enum: ["model", "listen"] },
    presentation: writingPresentationSchema,
    next: {
      oneOf: [
        {
          type: "object",
          properties: { kind: { type: "string", const: "node" }, nodeId: id },
          required: ["kind", "nodeId"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: { kind: { type: "string", const: "end" } },
          required: ["kind"],
          additionalProperties: false,
        },
      ],
    },
  },
  required: [
    "id",
    "sourceRefs",
    "guidance",
    "kind",
    "route",
    "parentRole",
    "presentation",
    "next",
  ],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<WritingNode>>;
export const writingTargetSchema = {
  type: "object",
  properties: {
    id,
    sourceRefs: refs,
    logicalWidth: { type: "number", exclusiveMinimum: 0, maximum: 100000 },
    logicalHeight: { type: "number", exclusiveMinimum: 0, maximum: 100000 },
    guides: {
      type: "object",
      properties: { top: number, midline: number, baseline: number },
      required: ["top", "midline", "baseline"],
      additionalProperties: false,
    },
    boardY: { type: "number", minimum: 0, maximum: 100000 },
  },
  required: [
    "id",
    "sourceRefs",
    "logicalWidth",
    "logicalHeight",
    "guides",
    "boardY",
  ],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<WritingTarget>>;
export const writingTaskSchema = {
  type: "object",
  properties: {
    id,
    number: { type: "integer", minimum: 1, maximum: 100 },
    title: copy,
    optional: { type: "boolean", const: true },
    startNodeId: id,
    targets: {
      type: "array",
      items: writingTargetSchema,
      minItems: 2,
      maxItems: 2,
    },
    nodes: {
      type: "array",
      items: writingNodeSchema,
      minItems: 7,
      maxItems: 7,
    },
  },
  required: [
    "id",
    "number",
    "title",
    "optional",
    "startNodeId",
    "targets",
    "nodes",
  ],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<WritingTask>>;
export const writingActionSchema = {
  oneOf: [
    {
      type: "object",
      properties: {
        kind: { type: "string", const: "confirmTracing" },
        targetId: id,
        nodeId: id,
        phase: { type: "string", const: "childTracing" },
      },
      required: ["kind", "targetId", "nodeId", "phase"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        kind: { type: "string", const: "confirmIndependent" },
        targetId: id,
        nodeId: id,
        phase: { type: "string", const: "childIndependentWriting" },
      },
      required: ["kind", "targetId", "nodeId", "phase"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: { kind: { type: "string", const: "skipWriting" } },
      required: ["kind"],
      additionalProperties: false,
    },
  ],
} satisfies JSONSchemaType<Serialized<WritingAction>>;
export const documentTokenSchema = {
  type: "object",
  properties: {
    profileId: id,
    generation: counter,
    documentId: id,
    runId: id,
    courseId: id,
    packageHash: hash,
    lessonId: id,
    taskId: id,
    targetId: id,
    revision: counter,
    phase: {
      type: "string",
      enum: ["parentDemonstration", "childTracing", "childIndependentWriting"],
    },
    inputEpoch: counter,
  },
  required: [
    "profileId",
    "generation",
    "documentId",
    "runId",
    "courseId",
    "packageHash",
    "lessonId",
    "taskId",
    "targetId",
    "revision",
    "phase",
    "inputEpoch",
  ],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<DocumentToken>>;
export const writingBarrierSchema = {
  type: "object",
  properties: {
    kind: { type: "string", const: "writing" },
    documents: {
      type: "array",
      items: documentTokenSchema,
      minItems: 2,
      maxItems: 2,
    },
  },
  required: ["kind", "documents"],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<WritingBarrier>>;
export const inkChunkSchema = {
  type: "object",
  properties: {
    chunkIndex: integer,
    firstPointIndex: integer,
    pointCount: { type: "integer", minimum: 1, maximum: 2048 },
    codecVersion: { type: "integer", const: 1 },
    payload: {
      type: "array",
      items: { type: "integer", minimum: 0, maximum: 255 },
      minItems: 16,
      maxItems: 32768,
    },
  },
  required: [
    "chunkIndex",
    "firstPointIndex",
    "pointCount",
    "codecVersion",
    "payload",
  ],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<InkChunk>>;
const layer: JSONSchemaType<Serialized<import("./types.ts").InkLayer>> = {
  type: "string",
  enum: ["model", "tracing", "independent"],
} satisfies JSONSchemaType<Serialized<import("./types.ts").InkLayer>>;
const brush = {
  type: "object",
  properties: {
    kind: { type: "string", const: "round" },
    width: { type: "number", exclusiveMinimum: 0, maximum: 1000 },
    colorRole: { type: "string", enum: ["model", "child"] },
    cap: { type: "string", const: "round" },
    join: { type: "string", const: "round" },
  },
  required: ["kind", "width", "colorRole", "cap", "join"],
  additionalProperties: false,
} satisfies JSONSchemaType<BrushSpec>;
const chunks = {
  type: "array",
  items: inkChunkSchema,
  maxItems: 64,
} satisfies JSONSchemaType<readonly Serialized<InkChunk>[]>;
export const inkEditSchema = {
  oneOf: [
    {
      type: "object",
      properties: {
        kind: { type: "string", const: "begin" },
        strokeId: id,
        layer,
        brush,
        chunks,
      },
      required: ["kind", "strokeId", "layer", "brush", "chunks"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        kind: { type: "string", const: "checkpoint" },
        strokeId: id,
        layer,
        chunks,
      },
      required: ["kind", "strokeId", "layer", "chunks"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        kind: { type: "string", const: "finalize" },
        strokeId: id,
        layer,
        chunks,
        status: { type: "string", enum: ["finished", "interrupted"] },
      },
      required: ["kind", "strokeId", "layer", "chunks", "status"],
      additionalProperties: false,
    },
  ],
} satisfies JSONSchemaType<Serialized<InkEdit>>;
export const inkCommandSchema = {
  type: "object",
  properties: {
    kind: { type: "string", const: "ink" },
    commandId: id,
    token: documentTokenSchema,
    payloadHash: hash,
    edit: inkEditSchema,
  },
  required: ["kind", "commandId", "token", "payloadHash", "edit"],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<InkCommand>>;
export const inkReceiptSchema = {
  type: "object",
  properties: {
    kind: { type: "string", const: "inkCommitted" },
    commandId: id,
    token: documentTokenSchema,
  },
  required: ["kind", "commandId", "token"],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<InkReceipt>>;
export const inkStrokeIdsSchema = {
  type: "array",
  items: id,
  maxItems: 1000000,
  uniqueItems: true,
} satisfies JSONSchemaType<
  Serialized<readonly import("./types.ts").StrokeId[]>
>;
export const inkOperationSchema = {
  oneOf: [
    {
      type: "object",
      properties: {
        seq: counter,
        kind: { type: "string", const: "AddStroke" },
        strokeId: id,
      },
      required: ["seq", "kind", "strokeId"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        seq: counter,
        kind: { type: "string", const: "ClearPractice" },
        strokeIds: { ...inkStrokeIdsSchema, minItems: 1 },
      },
      required: ["seq", "kind", "strokeIds"],
      additionalProperties: false,
    },
  ],
} satisfies JSONSchemaType<Serialized<import("./ink.ts").InkOperation>>;
export { brush as inkBrushSchema };
const inkStrokeSchema = {
  type: "object",
  properties: {
    strokeId: id,
    layer,
    strokeOrder: counter,
    status: { type: "string", enum: ["capturing", "finished", "interrupted"] },
    brush,
    pointCount: { type: "integer", minimum: 0, maximum: 100000 },
    chunks: { type: "array", items: inkChunkSchema, maxItems: 100000 },
  },
  required: [
    "strokeId",
    "layer",
    "strokeOrder",
    "status",
    "brush",
    "pointCount",
    "chunks",
  ],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<import("./ink.ts").InkStroke>>;
const inkHistorySchema = {
  type: "object",
  properties: {
    layer,
    baseline: inkStrokeIdsSchema,
    baseSeq: counter,
    cursorSeq: counter,
    tipSeq: counter,
    nextOpSeq: counter,
    operations: { type: "array", items: inkOperationSchema, maxItems: 128 },
  },
  required: [
    "layer",
    "baseline",
    "baseSeq",
    "cursorSeq",
    "tipSeq",
    "nextOpSeq",
    "operations",
  ],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<import("./ink.ts").InkHistory>>;
export const inkSnapshotSchema = {
  type: "object",
  properties: {
    token: documentTokenSchema,
    sourceRefs: refs,
    bounds: {
      type: "object",
      properties: {
        width: { type: "number", exclusiveMinimum: 0, maximum: 100000 },
        height: { type: "number", exclusiveMinimum: 0, maximum: 100000 },
      },
      required: ["width", "height"],
      additionalProperties: false,
    },
    guides: {
      type: "object",
      properties: { top: number, midline: number, baseline: number },
      required: ["top", "midline", "baseline"],
      additionalProperties: false,
    },
    boardY: { type: "number", minimum: 0, maximum: 100000 },
    writable: { type: "boolean" },
    nextStrokeOrder: counter,
    strokes: { type: "array", items: inkStrokeSchema, maxItems: 1000000 },
    histories: {
      type: "array",
      items: inkHistorySchema,
      minItems: 3,
      maxItems: 3,
    },
  },
  required: [
    "token",
    "sourceRefs",
    "bounds",
    "guides",
    "boardY",
    "writable",
    "nextStrokeOrder",
    "strokes",
    "histories",
  ],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<import("./ink.ts").InkSnapshot>>;
const retainedIds = {
  type: "array",
  items: id,
  maxItems: 64,
  uniqueItems: true,
} satisfies JSONSchemaType<readonly string[]>;
const recoveryTeachingSchema = {
  oneOf: [
    {
      type: "object",
      properties: { kind: { type: "string", const: "none" } },
      required: ["kind"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        kind: { type: "string", const: "pending" },
        commandId: id,
        payloadHash: hash,
      },
      required: ["kind", "commandId", "payloadHash"],
      additionalProperties: false,
    },
  ],
} satisfies JSONSchemaType<Serialized<import("./ink.ts").RecoveryTeaching>>;
export const recoveryOpeningSchema = {
  oneOf: [
    {
      type: "object",
      properties: { kind: { type: "string", const: "cold" } },
      required: ["kind"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        kind: { type: "string", const: "warm" },
        retainedStrokeIds: retainedIds,
        teaching: recoveryTeachingSchema,
      },
      required: ["kind", "retainedStrokeIds", "teaching"],
      additionalProperties: false,
    },
  ],
} satisfies JSONSchemaType<Serialized<import("./ink.ts").RecoveryOpening>>;
export const recoveryChoiceSchema = {
  oneOf: [
    {
      type: "object",
      properties: { kind: { type: "string", const: "cold" } },
      required: ["kind"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        kind: { type: "string", const: "warm" },
        settledStrokeIds: retainedIds,
      },
      required: ["kind", "settledStrokeIds"],
      additionalProperties: false,
    },
  ],
} satisfies JSONSchemaType<Serialized<import("./ink.ts").RecoveryChoice>>;
export const recoveryInventorySchema = {
  type: "object",
  properties: {
    kind: { type: "string", const: "closed" },
    recoveryId: id,
    captures: {
      type: "array",
      maxItems: 64,
      items: {
        type: "object",
        properties: {
          token: documentTokenSchema,
          strokeId: id,
          layer,
          pointCount: { type: "integer", minimum: 0, maximum: 100000 },
          nextChunkIndex: { type: "integer", minimum: 0, maximum: 100000 },
        },
        required: [
          "token",
          "strokeId",
          "layer",
          "pointCount",
          "nextChunkIndex",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["kind", "recoveryId", "captures"],
  additionalProperties: false,
} satisfies JSONSchemaType<Serialized<import("./ink.ts").RecoveryInventory>>;
export const writingNavigateSchema = {
  type: "object",
  properties: {
    kind: { type: "string", const: "writingNavigate" },
    commandId: id,
    owner: {
      type: "object",
      properties: { profileId: id, generation: counter },
      required: ["profileId", "generation"],
      additionalProperties: false,
    },
    expectedRevision: counter,
    payloadHash: hash,
    scope: {
      type: "object",
      properties: {
        kind: { type: "string", const: "session" },
        id,
        generation: counter,
      },
      required: ["kind", "id", "generation"],
      additionalProperties: false,
    },
    payload: {
      type: "object",
      properties: {
        packageHash: hash,
        sessionId: id,
        runId: id,
        checkpointId: id,
        action: { $ref: "#/$defs/graphAction" },
        barrier: writingBarrierSchema,
      },
      required: [
        "packageHash",
        "sessionId",
        "runId",
        "checkpointId",
        "action",
        "barrier",
      ],
      additionalProperties: false,
    },
  },
  required: [
    "kind",
    "commandId",
    "owner",
    "expectedRevision",
    "payloadHash",
    "scope",
    "payload",
  ],
  additionalProperties: false,
} satisfies JSONSchemaType<
  Serialized<
    Extract<import("./types.ts").TeachingCommand, { kind: "writingNavigate" }>
  >
>;
export const writingSelectSchema = {
  type: "object",
  properties: {
    kind: { type: "string", const: "writingSelect" },
    commandId: id,
    owner: {
      type: "object",
      properties: { profileId: id, generation: counter },
      required: ["profileId", "generation"],
      additionalProperties: false,
    },
    expectedRevision: counter,
    payloadHash: hash,
    scope: {
      type: "object",
      properties: {
        kind: { type: "string", const: "profile" },
        id,
        generation: counter,
      },
      required: ["kind", "id", "generation"],
      additionalProperties: false,
    },
    payload: {
      type: "object",
      properties: {
        packageHash: hash,
        intent: {
          type: "string",
          enum: ["start", "resume", "replay", "restart"],
        },
        taskId: id,
        sessionId: { anyOf: [id, { type: "null", nullable: true }] },
        barrier: writingBarrierSchema,
      },
      required: ["packageHash", "intent", "taskId", "sessionId", "barrier"],
      additionalProperties: false,
    },
  },
  required: [
    "kind",
    "commandId",
    "owner",
    "expectedRevision",
    "payloadHash",
    "scope",
    "payload",
  ],
  additionalProperties: false,
} satisfies JSONSchemaType<
  Serialized<
    Extract<import("./types.ts").TeachingCommand, { kind: "writingSelect" }>
  >
>;
export const writingSkippedSchema = {
  type: "object",
  properties: {
    version: { type: "integer", const: 1 },
    kind: { type: "string", const: "writingSkipped" },
    taskId: id,
    last: { $ref: "#/$defs/controlState" },
    viewCheckpoint: {
      anyOf: [
        { type: "integer", minimum: 0, maximum: 9999 },
        { type: "null", nullable: true },
      ],
    },
  },
  required: ["version", "kind", "taskId", "last", "viewCheckpoint"],
  additionalProperties: false,
} satisfies JSONSchemaType<
  Serialized<import("./types.ts").WritingSkippedState>
>;

export const writingControlSchema = {
  ...writingNavigateSchema,
  properties: {
    ...writingNavigateSchema.properties,
    kind: { type: "string", const: "writingControl" },
    payload: {
      type: "object",
      properties: {
        packageHash: hash,
        sessionId: id,
        runId: id,
        checkpointId: id,
        barrier: writingBarrierSchema,
        documentId: id,
        layer: { type: "string", enum: ["tracing", "independent"] },
        control: {
          oneOf: [
            {
              type: "object",
              properties: { kind: { type: "string", const: "inkUndo" } },
              required: ["kind"],
              additionalProperties: false,
            },
            {
              type: "object",
              properties: { kind: { type: "string", const: "inkRedo" } },
              required: ["kind"],
              additionalProperties: false,
            },
            {
              type: "object",
              properties: { kind: { type: "string", const: "clearPractice" } },
              required: ["kind"],
              additionalProperties: false,
            },
          ],
        },
      },
      required: [
        "packageHash",
        "sessionId",
        "runId",
        "checkpointId",
        "barrier",
        "documentId",
        "layer",
        "control",
      ],
      additionalProperties: false,
    },
  },
} satisfies JSONSchemaType<
  Serialized<
    Extract<import("./types.ts").TeachingCommand, { kind: "writingControl" }>
  >
>;

export const practiceControlsBindingSchema = {
  type: "object",
  properties: {
    owner: writingNavigateSchema.properties.owner,
    packageHash: hash,
    sessionId: id,
    runId: id,
  },
  required: ["owner", "packageHash", "sessionId", "runId"],
  additionalProperties: false,
} satisfies JSONSchemaType<
  Serialized<import("./ink.ts").PracticeControlsBinding>
>;
export const practiceControlsSummarySchema = {
  oneOf: [
    {
      type: "object",
      properties: { kind: { type: "string", const: "readOnly" } },
      required: ["kind"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        kind: { type: "string", const: "editable" },
        binding: practiceControlsBindingSchema,
        token: documentTokenSchema,
        layer: { type: "string", enum: ["tracing", "independent"] },
        undo: { type: "boolean" },
        redo: { type: "boolean" },
        clear: { type: "boolean" },
        retainedUsage: {
          type: "object",
          properties: {
            pointCount: integer,
            canonicalByteLength: {
              type: "integer",
              minimum: 0,
              maximum: 33554432,
            },
          },
          required: ["pointCount", "canonicalByteLength"],
          additionalProperties: false,
        },
      },
      required: [
        "kind",
        "binding",
        "token",
        "layer",
        "undo",
        "redo",
        "clear",
        "retainedUsage",
      ],
      additionalProperties: false,
    },
  ],
} satisfies JSONSchemaType<
  Serialized<import("./ink.ts").PracticeControlsSummary>
>;
