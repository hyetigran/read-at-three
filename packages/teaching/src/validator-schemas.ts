// Trusted authoring schemas. Runtime parsing imports only the generated validators.
const id = { type: "string", minLength: 1, maxLength: 200 };
const text = { type: "string", minLength: 1, maxLength: 20000 };
const hashSchema = { type: "string", pattern: "^[a-f0-9]{64}$" };
const counter = { type: "string", pattern: "^(0|[1-9][0-9]{0,18})$" };
function record(properties: Record<string, unknown>) {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}
const copy = {
  oneOf: [
    record({ kind: { enum: ["source", "adapted"] }, text, sourceRef: id }),
    record({ kind: { const: "added" }, text }),
  ],
};
const node = record({
  id,
  parentAction: copy,
  spoken: copy,
  expected: copy,
  parentRole: { enum: ["model", "listen"] },
  glyph: { const: "m" },
  cue: record({
    kind: { const: "sustain" },
    durationMs: { type: "integer", minimum: 1, maximum: 30000 },
  }),
  next: {
    oneOf: [
      record({ kind: { const: "node" }, nodeId: id }),
      record({
        kind: { const: "frontier" },
        unmetObligations: {
          type: "array",
          items: id,
          minItems: 1,
          maxItems: 100,
          uniqueItems: true,
        },
      }),
    ],
  },
});
const bodySchema = record({
  courseId: id,
  releaseId: id,
  coverage: { const: "partial-first-m" },
  title: copy,
  lessonId: id,
  taskId: id,
  startNodeId: id,
  nodes: { type: "array", items: node, minItems: 2, maxItems: 100 },
});
const packageSchema = record({
  formatVersion: { const: 1 },
  packageHash: hashSchema,
  body: bodySchema,
});
const stateSchema = {
  oneOf: [
    record({
      version: { const: 1 },
      kind: { const: "teaching" },
      nodeId: id,
      acceptedNodeIds: {
        type: "array",
        items: id,
        maxItems: 100,
        uniqueItems: true,
      },
    }),
    record({
      version: { const: 1 },
      kind: { const: "frontier" },
      acceptedNodeIds: {
        type: "array",
        items: id,
        minItems: 1,
        maxItems: 100,
        uniqueItems: true,
      },
      unmetObligations: {
        type: "array",
        items: id,
        minItems: 1,
        maxItems: 100,
        uniqueItems: true,
      },
    }),
  ],
};
const owner = record({ profileId: id, generation: counter });
const commandCommon = {
  commandId: id,
  owner,
  expectedRevision: counter,
  payloadHash: hashSchema,
};
const commandSchema = {
  oneOf: [
    record({
      ...commandCommon,
      kind: { const: "start" },
      scope: record({ kind: { const: "profile" }, id, generation: counter }),
      payload: record({ packageHash: hashSchema }),
    }),
    record({
      ...commandCommon,
      kind: { const: "advance" },
      scope: record({ kind: { const: "session" }, id, generation: counter }),
      payload: record({
        packageHash: hashSchema,
        sessionId: id,
        runId: id,
        nodeId: id,
      }),
    }),
  ],
};
const receiptSchema = record({
  kind: { const: "committed" },
  commandId: id,
  owner,
  sessionId: id,
  runId: id,
  revision: counter,
  packageHash: hashSchema,
});
const commonProjection = { owner, packageHash: hashSchema, title: copy };
const sessionProjection = {
  ...commonProjection,
  sessionId: id,
  runId: id,
  revision: counter,
};
const projectionSchema = {
  oneOf: [
    record({
      ...commonProjection,
      kind: { const: "entry" },
      profileRevision: counter,
    }),
    record({ ...sessionProjection, kind: { const: "teaching" }, turn: node }),
    record({
      ...sessionProjection,
      kind: { const: "frontier" },
      status: { const: "inProgress" },
      unmetObligations: {
        type: "array",
        items: id,
        minItems: 1,
        maxItems: 100,
        uniqueItems: true,
      },
    }),
    record({ kind: { const: "recovery" }, code: id, message: text }),
  ],
};
const resultSchema = {
  oneOf: [
    record({
      kind: { const: "committed" },
      commandId: id,
      owner,
      sessionId: id,
      runId: id,
      revision: counter,
      packageHash: hashSchema,
    }),
    record({ kind: { const: "rejected" }, code: id, message: text }),
  ],
};

export const validatorSchemas = {
  validatePackage: packageSchema,
  validateState: stateSchema,
  validateCommand: commandSchema,
  validateReceipt: receiptSchema,
  validateProjection: projectionSchema,
  validateResult: resultSchema,
};
