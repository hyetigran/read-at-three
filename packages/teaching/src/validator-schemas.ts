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
function list(items: object, maxItems = 1000, minItems = 0) {
  return { type: "array", items, minItems, maxItems };
}
const ids = { ...list(id), uniqueItems: true };
const nullableId = { anyOf: [id, { type: "null" }] };
const copy = {
  oneOf: [
    record({ kind: { enum: ["source", "adapted"] }, text, sourceRef: id }),
    record({ kind: { const: "added" }, text }),
  ],
};
const legacyNode = record({
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
        unmetObligations: { ...ids, minItems: 1, maxItems: 100 },
      }),
    ],
  },
});
const span = record({
  kind: { enum: ["action", "speech", "expected", "praise"] },
  copy,
});
const graphNode = record({
  id,
  kind: { enum: ["normal", "correction"] },
  sourceRefs: { ...ids, minItems: 1 },
  guidance: list(span, 100, 1),
  parentRole: { enum: ["model", "listen"] },
  glyph: { enum: ["m", "s"] },
  cue: record({
    kind: { const: "sustain" },
    minimumMs: {
      anyOf: [
        { type: "integer", minimum: 1, maximum: 30000 },
        { type: "null" },
      ],
    },
  }),
  next: {
    oneOf: [
      record({ kind: { const: "node" }, nodeId: id }),
      record({ kind: { const: "end" } }),
    ],
  },
});
const correction = record({
  id,
  eligibleNodeIds: { ...ids, minItems: 1 },
  instructionNodeId: id,
  retestNodeIds: { ...ids, minItems: 1, maxItems: 100 },
  continuationNodeId: nullableId,
  sourceRefs: { ...ids, minItems: 1 },
});
const taskNumber = { type: "integer", minimum: 1, maximum: 100 };
const lessonTask = record({
  id,
  number: taskNumber,
  title: copy,
  optional: { type: "boolean" },
});
const graphTask = record({
  id,
  number: taskNumber,
  title: copy,
  startNodeId: id,
  nodes: list(graphNode, 100, 1),
  corrections: list(correction, 100),
});
const packageCommon = {
  courseId: id,
  releaseId: id,
  title: copy,
  lessonId: id,
};
const destination = {
  oneOf: [
    record({ kind: { const: "node" }, nodeId: id }),
    record({ kind: { const: "end" } }),
  ],
};
const controlSource = {
  id,
  sourceRefs: { ...ids, minItems: 1 },
  guidance: list(span, 100, 1),
};
const oralPresentation = record({ kind: { const: "oral" } });
const controlTurnNode = record({
  ...controlSource,
  kind: { const: "turn" },
  route: { enum: ["normal", "support"] },
  parentRole: { enum: ["model", "listen"] },
  itemId: nullableId,
  presentation: oralPresentation,
  next: destination,
});
const controlNode = {
  oneOf: [
    controlTurnNode,
    record({
      ...controlSource,
      kind: { const: "untilFirm" },
      policyId: id,
      cycleEntryNodeId: id,
      cycleExitNodeId: id,
      next: destination,
    }),
    record({
      ...controlSource,
      kind: { const: "selectiveReview" },
      reviewId: id,
      items: list(
        record({
          itemId: id,
          parentLabel: copy,
          entryNodeId: id,
          exitNodeId: id,
        }),
        100,
        1,
      ),
      returnNodeId: id,
      exitNodeId: id,
    }),
    record({
      ...controlSource,
      kind: { const: "reviewExit" },
      reviewId: id,
      next: destination,
    }),
  ],
};
const controlTask = record({
  id,
  number: taskNumber,
  title: copy,
  startNodeId: id,
  nodes: list(controlNode, 1000, 1),
  corrections: list(
    record({
      id,
      label: copy,
      scope: { enum: ["normal", "review", "any"] },
      eligibleNodeIds: { ...ids, minItems: 1 },
      instructionNodeIds: { ...ids, minItems: 1 },
      retestNodeIds: { ...ids, minItems: 1 },
      sourceRefs: { ...ids, minItems: 1 },
    }),
    100,
  ),
});
const reviewChoice = {
  oneOf: [
    record({ kind: { const: "none" } }),
    record({
      kind: { const: "items" },
      itemIds: { ...ids, minItems: 1, maxItems: 100 },
    }),
  ],
};
const eligibleItems = list(record({ itemId: id, label: copy }), 100, 1);
const reviewSelectionAction = record({
  kind: { const: "reviewSelection" },
  reviewId: id,
  eligibleItems,
  selectLabel: copy,
  emptyLabel: copy,
});
const controlFlow = {
  oneOf: [
    record({ kind: { const: "normal" } }),
    record({
      kind: { const: "review" },
      queueId: id,
      index: { type: "integer", minimum: 0, maximum: 99 },
    }),
  ],
};
const controlResume = record({
  flow: controlFlow,
  delivery: {
    oneOf: [
      record({ kind: { const: "source" } }),
      record({ kind: { const: "cycle" }, cycleId: id }),
      record({ kind: { const: "repeat" }, returnCheckpointId: id }),
    ],
  },
});
const activeControlContext = {
  oneOf: [
    record({ kind: { const: "delivering" }, resume: controlResume }),
    record({ kind: { const: "selection" }, reviewId: id }),
    record({
      kind: { const: "correction" },
      correctionId: id,
      triggerOccurrenceId: id,
      owedOccurrenceId: id,
      suspended: controlResume,
      instructionOccurrenceIds: { ...ids, minItems: 1 },
      retestOccurrenceIds: { ...ids, minItems: 1 },
      phase: record({
        kind: { enum: ["instruction", "retest"] },
        index: { type: "integer", minimum: 0, maximum: 999 },
      }),
    }),
  ],
};
const terminalControlContext = record({ kind: { const: "terminal" } });
const controlCheckpoint = {
  oneOf: [
    record({ id, occurrenceId: id, context: activeControlContext }),
    record({
      id,
      occurrenceId: { type: "null" },
      context: terminalControlContext,
    }),
  ],
};
const controlState = record({
  version: { const: 1 },
  kind: { const: "graphControls" },
  taskId: id,
  occurrences: list(
    record({
      id,
      target: {
        oneOf: [
          record({ kind: { const: "node" }, nodeId: id }),
          record({
            kind: { const: "reviewConfirmation" },
            queueId: id,
            itemId: id,
          }),
        ],
      },
      obligation: { enum: ["required", "practice", "support"] },
    }),
    10000,
    1,
  ),
  acceptedOccurrenceIds: { ...ids, maxItems: 10000 },
  cycles: list(
    record({
      id,
      policyId: id,
      gateOccurrenceId: id,
      turnOccurrenceIds: { ...ids, minItems: 1 },
    }),
    10000,
  ),
  cycleOutcomes: list(
    record({ cycleId: id, kind: { enum: ["independent", "supported"] } }),
    10000,
  ),
  queues: list(
    record({
      id,
      reviewId: id,
      selectionOccurrenceId: id,
      choice: reviewChoice,
      items: list(
        record({
          itemId: id,
          routeOccurrences: { ...ids, minItems: 1 },
          confirmationOccurrenceId: id,
        }),
        100,
      ),
      returnNodeId: id,
      exitNodeId: id,
      exitOccurrenceId: id,
    }),
    100,
  ),
  checkpoints: list(controlCheckpoint, 10000, 1),
  checkpointIndex: { type: "integer", minimum: 0, maximum: 9999 },
  nextOccurrenceNumber: counter,
  nextCheckpointNumber: counter,
});
const readyAction = record({ kind: { const: "parentReady" }, policyId: id });
const confirmAction = record({
  kind: { const: "confirmReviewItem" },
  queueId: id,
  itemId: id,
});
const commitReviewAction = record({
  kind: { const: "commitReviewSelection" },
  reviewId: id,
  choice: reviewChoice,
});

const bodySchema = {
  oneOf: [
    record({
      ...packageCommon,
      coverage: { const: "partial-first-m" },
      taskId: id,
      startNodeId: id,
      nodes: list(legacyNode, 100, 2),
    }),
    record({
      ...packageCommon,
      coverage: { const: "lesson1-sounds-complete" },
      lessonTasks: list(lessonTask, 100, 1),
      tasks: list(graphTask, 100, 1),
    }),
    record({
      ...packageCommon,
      coverage: { const: "lesson1-sounds-oral-complete" },
      lessonTasks: list(lessonTask, 100, 1),
      tasks: list(
        {
          oneOf: [
            record({ kind: { const: "printedGraphV1" }, task: graphTask }),
            record({ kind: { const: "graphControls" }, task: controlTask }),
          ],
        },
        100,
        1,
      ),
    }),
  ],
};
const packageSchema = record({
  formatVersion: { const: 1 },
  packageHash: hashSchema,
  body: bodySchema,
});
const normalContext = record({ kind: { const: "normal" } });
const repeatContext = record({
  kind: { const: "repeat" },
  returnCheckpointId: id,
});
const suspended = { oneOf: [normalContext, repeatContext] };
const correctionCommon = {
  correctionId: id,
  triggerOccurrenceId: id,
  returnOccurrenceId: id,
  suspended,
};
const context = {
  oneOf: [
    normalContext,
    repeatContext,
    record({ ...correctionCommon, kind: { const: "correctionInstruction" } }),
    record({
      ...correctionCommon,
      kind: { const: "correctionRetest" },
      retestIndex: { type: "integer", minimum: 0, maximum: 99 },
    }),
  ],
};
const stateSchema = {
  oneOf: [
    controlState,
    record({
      version: { const: 1 },
      kind: { const: "teaching" },
      nodeId: id,
      acceptedNodeIds: { ...ids, maxItems: 100 },
    }),
    record({
      version: { const: 1 },
      kind: { const: "frontier" },
      acceptedNodeIds: { ...ids, minItems: 1, maxItems: 100 },
      unmetObligations: { ...ids, minItems: 1, maxItems: 100 },
    }),
    record({
      version: { const: 1 },
      kind: { const: "graph" },
      taskId: id,
      occurrences: list(
        record({
          id,
          nodeId: id,
          kind: { enum: ["normal", "practice", "support"] },
        }),
        10000,
        1,
      ),
      acceptedOccurrenceIds: { ...ids, maxItems: 10000 },
      nextOccurrenceNumber: counter,
      checkpoints: list(
        record({ id, occurrenceId: nullableId, context }),
        10000,
        1,
      ),
      checkpointIndex: { type: "integer", minimum: 0, maximum: 9999 },
      nextCheckpointNumber: counter,
    }),
  ],
};
const regularGraphAction = record({
  kind: { enum: ["continue", "back", "repeat", "pause"] },
});
const helpIntent = record({ kind: { const: "help" }, correctionId: id });
const graphAction = {
  oneOf: [
    regularGraphAction,
    helpIntent,
    readyAction,
    confirmAction,
    commitReviewAction,
  ],
};
const selectionIntent = { enum: ["start", "resume", "replay", "restart"] };
const semanticIntent = {
  oneOf: [
    regularGraphAction,
    readyAction,
    confirmAction,
    commitReviewAction,
    record({
      kind: selectionIntent,
      taskId: id,
      packageHash: hashSchema,
      sessionId: nullableId,
    }),
  ],
};
const action = {
  oneOf: [
    record({ label: copy, intent: semanticIntent }),
    record({
      label: copy,
      intent: helpIntent,
      correctionPreview: { oneOf: [graphNode, controlTurnNode] },
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
const profileScope = record({
  kind: { const: "profile" },
  id,
  generation: counter,
});
const sessionScope = record({
  kind: { const: "session" },
  id,
  generation: counter,
});
const sessionPayload = { packageHash: hashSchema, sessionId: id, runId: id };
const commandSchema = {
  oneOf: [
    record({
      ...commandCommon,
      kind: { const: "start" },
      scope: profileScope,
      payload: record({ packageHash: hashSchema }),
    }),
    record({
      ...commandCommon,
      kind: { const: "advance" },
      scope: sessionScope,
      payload: record({ ...sessionPayload, nodeId: id }),
    }),
    record({
      ...commandCommon,
      kind: { const: "select" },
      scope: profileScope,
      payload: record({
        packageHash: hashSchema,
        intent: selectionIntent,
        taskId: id,
        sessionId: nullableId,
      }),
    }),
    record({
      ...commandCommon,
      kind: { const: "navigate" },
      scope: sessionScope,
      payload: record({
        ...sessionPayload,
        checkpointId: id,
        action: graphAction,
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
const commonProjection = {
  owner,
  packageHash: hashSchema,
  title: copy,
  profileRevision: counter,
  actions: list(action),
  catalog: list(
    record({
      id,
      number: taskNumber,
      title: copy,
      optional: { type: "boolean" },
      available: { type: "boolean" },
      completed: { type: "boolean" },
      packageHash: hashSchema,
      savedSessionId: nullableId,
    }),
  ),
};
const sessionProjection = {
  ...commonProjection,
  sessionId: id,
  runId: id,
  revision: counter,
  runStatus: { enum: ["inProgress", "completed"] },
  sessionStatus: { enum: ["active", "paused", "closed"] },
  checkpointId: nullableId,
  taskId: id,
  taskNumber,
  selectionCounter: counter,
};
const graphTurn = record({
  ...graphNode.properties,
  extraPractice: { type: "boolean" },
  routeKind: {
    enum: ["normal", "repeat", "correctionInstruction", "correctionRetest"],
  },
  occurrenceId: id,
  checkpointId: id,
});
const projectionSchema = {
  oneOf: [
    record({ ...commonProjection, kind: { const: "entry" } }),
    record({
      ...sessionProjection,
      kind: { const: "teaching" },
      turn: {
        oneOf: [
          legacyNode,
          graphTurn,
          record({
            ...controlTurnNode.properties,
            extraPractice: { type: "boolean" },
            routeKind: { enum: ["delivering", "correction"] },
            occurrenceId: id,
            checkpointId: id,
          }),
        ],
      },
    }),
    record({
      ...sessionProjection,
      kind: { const: "frontier" },
      status: { const: "inProgress" },
      unmetObligations: { ...ids, minItems: 1, maxItems: 100 },
    }),
    record({ ...sessionProjection, kind: { const: "completed" } }),
    record({
      ...sessionProjection,
      kind: { const: "reviewSelection" },
      reviewId: id,
      items: eligibleItems,
      selectionAction: reviewSelectionAction,
      presentation: oralPresentation,
      guidance: list(span, 100, 1),
      committedChoice: { anyOf: [reviewChoice, { type: "null" }] },
    }),
    record({ kind: { const: "recovery" }, code: id, message: text }),
  ],
};
const resultSchema = {
  oneOf: [
    receiptSchema,
    record({ kind: { const: "rejected" }, code: id, message: text }),
  ],
};
const rootSchemas = {
  validatePackage: packageSchema,
  validateState: stateSchema,
  validateCommand: commandSchema,
  validateReceipt: receiptSchema,
  validateProjection: projectionSchema,
  validateResult: resultSchema,
};

const sharedDefinitions = {
  copy,
  graphNode,
  controlTurnNode,
  owner,
  activeControlContext,
  controlState,
  graphTurn,
  action,
  receiptSchema,
};
function withDefinitions(root: object) {
  function object(value: object): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, walk(child)]),
    );
  }
  function walk(value: unknown): unknown {
    if (value === null || typeof value !== "object") return value;
    for (const [name, schema] of Object.entries(sharedDefinitions))
      if (value === schema) return { $ref: `#/$defs/${name}` };
    return Array.isArray(value) ? value.map(walk) : object(value);
  }
  return {
    ...object(root),
    $defs: Object.fromEntries(
      Object.entries(sharedDefinitions).map(([name, schema]) => [
        name,
        object(schema),
      ]),
    ),
  };
}
export const validatorSchemas = {
  validatePackage: withDefinitions(rootSchemas.validatePackage),
  validateState: withDefinitions(rootSchemas.validateState),
  validateCommand: withDefinitions(rootSchemas.validateCommand),
  validateReceipt: withDefinitions(rootSchemas.validateReceipt),
  validateProjection: withDefinitions(rootSchemas.validateProjection),
  validateResult: withDefinitions(rootSchemas.validateResult),
};
