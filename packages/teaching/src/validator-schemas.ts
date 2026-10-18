import {
  reviewedPrintedBoards,
  historicalReviewedPrintedBoards,
} from "./printed.ts";
import { printedBoardAssetHash } from "./printed-assets.ts";
import { activityArtKeys } from "./course-art.ts";
import {
  writingTaskSchema,
  writingPlanSchema,
  reviewedWritingPlanSchema,
  parentSpanSchema,
  writingTargetSchema,
  writingPresentationSchema,
  writingActionSchema,
  writingBarrierSchema,
  documentTokenSchema,
  inkCommandSchema,
  inkReceiptSchema,
  inkBrushSchema,
  inkStrokeIdsSchema,
  inkOperationSchema,
  inkSnapshotSchema,
  recoveryOpeningSchema,
  recoveryChoiceSchema,
  recoveryInventorySchema,
  writingNavigateSchema,
  writingControlSchema,
  practiceControlsBindingSchema,
  practiceControlsSummarySchema,
  writingSelectSchema,
  writingSkippedSchema,
} from "./writing-schemas.ts";
import {
  catalogTaskSchema,
  forbiddenCatalogSkippedSchema,
} from "./catalog-schemas.ts";
const id = { type: "string", minLength: 1, maxLength: 200 };
const text = { type: "string", minLength: 1, maxLength: 20000 };
const hashSchema = { type: "string", pattern: "^[a-f0-9]{64}$" };
const counter = { type: "string", pattern: "^(0|[1-9][0-9]{0,18})$" };
function record<P extends Record<string, unknown>>(properties: P) {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}
function list<I extends object>(items: I, maxItems = 1000, minItems = 0) {
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
const span = parentSpanSchema;
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
const boardPresentation = record({
  kind: { const: "printedBoard" },
  board: record({
    assetId: { enum: ["single-a", "vertical-mas", "two-above-one-mas"] },
    reviewId: { const: "printed-boards-l03-v1" },
    assetHash: { const: printedBoardAssetHash },
  }),
  focus: { enum: ["m", "a", "s"] },
  cue: {
    oneOf: [
      record({ kind: { const: "none" } }),
      record({
        kind: { const: "underSymbolHold" },
        hold: { const: "parentControlled" },
      }),
      record({
        kind: { const: "endpointSweep" },
        preparation: { enum: ["touchStart", "parentControlledStartHold"] },
      }),
    ],
  },
});
const {
  glyph: _graphGlyph,
  cue: _graphCue,
  ...boardNodeFields
} = graphNode.properties;
const boardNode = record({
  ...boardNodeFields,
  presentation: boardPresentation,
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
const boardTask = record({
  ...graphTask.properties,
  nodes: list(boardNode, 100, 1),
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
  parentRole: { enum: ["model", "together", "listen"] },
  itemId: nullableId,
  presentation: { oneOf: [oralPresentation, writingPresentationSchema] },
  next: destination,
});
const connectedPointingPresentation = record({
  kind: { const: "connectedPointing" },
  board: { enum: ["am", "sa"] },
  role: { enum: ["model", "follow", "guided"] },
});
const connectedControlTurnNode = record({
  ...controlTurnNode.properties,
  presentation: {
    oneOf: [
      oralPresentation,
      writingPresentationSchema,
      connectedPointingPresentation,
    ],
  },
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
      coverage: { enum: ["lesson1-sounds-oral-complete", "lesson1-complete"] },
      lessonTasks: list(lessonTask, 100, 1),
      tasks: list(
        {
          oneOf: [
            record({ kind: { const: "printedGraphV1" }, task: graphTask }),
            record({ kind: { const: "graphControls" }, task: controlTask }),
            record({
              kind: { const: "soundWritingV1" },
              task: writingTaskSchema,
            }),
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
const cumulativePackageV1Schema = record({
  formatVersion: { const: 1 },
  packageHash: hashSchema,
  body: record({
    coverage: { const: "course-development" },
    courseId: id,
    releaseId: id,
    title: copy,
    lessons: list(
      record({
        lessonId: id,
        number: { type: "integer", minimum: 1, maximum: 100 },
        title: copy,
        lessonTasks: list(
          record({
            id,
            number: { type: "integer", minimum: 1, maximum: 100 },
            title: copy,
            optional: { type: "boolean" },
            artKey: {
              enum: activityArtKeys,
            },
          }),
          100,
          1,
        ),
        tasks: list(
          {
            oneOf: [
              record({ kind: { const: "printedGraphV1" }, task: graphTask }),
              record({ kind: { const: "graphControls" }, task: controlTask }),
              record({
                kind: { const: "soundWritingV1" },
                task: writingTaskSchema,
              }),
            ],
          },
          100,
        ),
      }),
      100,
      1,
    ),
  }),
});
const oldCumulativePackageSchema = {
  oneOf: [
    cumulativePackageV1Schema,
    {
      ...cumulativePackageV1Schema,
      properties: {
        ...cumulativePackageV1Schema.properties,
        body: {
          ...cumulativePackageV1Schema.properties.body,
          properties: {
            ...cumulativePackageV1Schema.properties.body.properties,
            coverage: { const: "course-development-v2" },
            contentSchemaVersion: { const: 2 },
            requiredEngineCapabilities: {
              type: "array",
              items: {
                type: "string",
                enum: ["writing-practice-plan-v2", "guidance-runs-v2"],
              },
              minItems: 2,
              maxItems: 2,
              uniqueItems: true,
            },
            lessons: {
              ...cumulativePackageV1Schema.properties.body.properties.lessons,
              items: {
                ...cumulativePackageV1Schema.properties.body.properties.lessons
                  .items,
                properties: {
                  ...cumulativePackageV1Schema.properties.body.properties
                    .lessons.items.properties,
                  tasks: list(
                    {
                      oneOf: [
                        ...cumulativePackageV1Schema.properties.body.properties
                          .lessons.items.properties.tasks.items.oneOf,
                        record({
                          kind: { const: "writingPracticePlanV2" },
                          task: writingPlanSchema,
                        }),
                      ],
                    },
                    100,
                  ),
                },
              },
            },
          },
          required: [
            ...cumulativePackageV1Schema.properties.body.required,
            "contentSchemaVersion",
            "requiredEngineCapabilities",
          ],
        },
      },
    },
  ],
};
const cumulativeV2 = oldCumulativePackageSchema.oneOf[1];
if (!cumulativeV2 || !("properties" in cumulativeV2))
  throw new Error("V2 schema missing");
const v2Body = cumulativeV2.properties.body;
const v2Lessons = v2Body.properties.lessons;
const cumulativeV3 = {
  ...cumulativeV2,
  properties: {
    ...cumulativeV2.properties,
    body: {
      ...v2Body,
      properties: {
        ...v2Body.properties,
        coverage: { const: "course-development-v3" },
        contentSchemaVersion: { const: 3 },
        requiredEngineCapabilities: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "writing-practice-plan-v2",
              "guidance-runs-v2",
              "printed-board-cues-v2",
            ],
          },
          minItems: 3,
          maxItems: 3,
          uniqueItems: true,
        },
        lessons: {
          ...v2Lessons,
          items: {
            ...v2Lessons.items,
            properties: {
              ...v2Lessons.items.properties,
              tasks: list(
                {
                  oneOf: [
                    ...v2Lessons.items.properties.tasks.items.oneOf,
                    record({
                      kind: { const: "printedGraphV2" },
                      task: boardTask,
                    }),
                  ],
                },
                100,
              ),
            },
          },
        },
      },
    },
  },
};
const connectedControlTask = record({
  ...controlTask.properties,
  nodes: list(
    { oneOf: [connectedControlTurnNode, ...controlNode.oneOf.slice(1)] },
    1000,
    1,
  ),
});
const v3Body = cumulativeV3.properties.body;
const v3Lessons = v3Body.properties.lessons;
const cumulativeV4 = {
  ...cumulativeV3,
  properties: {
    ...cumulativeV3.properties,
    body: {
      ...v3Body,
      properties: {
        ...v3Body.properties,
        coverage: { const: "course-development-v4" },
        contentSchemaVersion: { const: 4 },
        requiredEngineCapabilities: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "writing-practice-plan-v2",
              "guidance-runs-v2",
              "printed-board-cues-v2",
              "connected-pointing-v1",
            ],
          },
          minItems: 4,
          maxItems: 4,
          uniqueItems: true,
        },
        lessons: {
          ...v3Lessons,
          items: {
            ...v3Lessons.items,
            properties: {
              ...v3Lessons.items.properties,
              tasks: list(
                {
                  oneOf: [
                    ...v3Lessons.items.properties.tasks.items.oneOf.filter(
                      (entry) =>
                        entry.properties.kind.const !== "graphControls",
                    ),
                    record({
                      kind: { const: "graphControls" },
                      task: connectedControlTask,
                    }),
                  ],
                },
                100,
              ),
            },
          },
        },
      },
    },
  },
};
const reviewedBoardPresentation = {
  ...boardPresentation,
  properties: {
    ...boardPresentation.properties,
    board: {
      oneOf: Object.values(historicalReviewedPrintedBoards).map((board) =>
        record({
          assetId: { const: board.assetId },
          reviewId: { const: board.reviewId },
          assetHash: { const: board.assetHash },
        }),
      ),
    },
  },
};
const reviewedConnectedControlTurnNode = record({
  ...connectedControlTurnNode.properties,
  presentation: {
    oneOf: [
      oralPresentation,
      writingPresentationSchema,
      record({
        ...connectedPointingPresentation.properties,
        board: { enum: ["am", "sa", "ma"] },
      }),
    ],
  },
});
const reviewedBoardNode = record({
  ...boardNode.properties,
  presentation: reviewedBoardPresentation,
});
const reviewedConnectedControlTask = {
  ...connectedControlTask,
  properties: {
    ...connectedControlTask.properties,
    nodes: list(
      {
        oneOf: [
          reviewedConnectedControlTurnNode,
          ...controlNode.oneOf.slice(1),
        ],
      },
      1000,
      1,
    ),
  },
};
const reviewedBoardTask = {
  ...boardTask,
  properties: {
    ...boardTask.properties,
    nodes: list(reviewedBoardNode, 1000, 1),
  },
};
const v4Body = cumulativeV4.properties.body;
const v4Lessons = v4Body.properties.lessons;
const cumulativeReviewedBoards = {
  ...cumulativeV4,
  properties: {
    ...cumulativeV4.properties,
    body: {
      ...v4Body,
      properties: {
        ...v4Body.properties,
        requiredEngineCapabilities: {
          type: "array",
          items: {
            type: "string",
            enum: [
              ...v4Body.properties.requiredEngineCapabilities.items.enum,
              "reviewed-board-layouts-l04-v1",
            ],
          },
          minItems: 5,
          maxItems: 5,
          uniqueItems: true,
        },
        lessons: {
          ...v4Lessons,
          items: {
            ...v4Lessons.items,
            properties: {
              ...v4Lessons.items.properties,
              tasks: list(
                {
                  oneOf: [
                    ...v4Lessons.items.properties.tasks.items.oneOf.filter(
                      (entry) =>
                        entry.properties.kind.const !== "printedGraphV2" &&
                        entry.properties.kind.const !== "graphControls" &&
                        entry.properties.kind.const !== "writingPracticePlanV2",
                    ),
                    record({
                      kind: { const: "writingPracticePlanV2" },
                      task: reviewedWritingPlanSchema,
                    }),
                    record({
                      kind: { const: "printedGraphV2" },
                      task: reviewedBoardTask,
                    }),
                    record({
                      kind: { const: "graphControls" },
                      task: reviewedConnectedControlTask,
                    }),
                  ],
                },
                100,
              ),
            },
          },
        },
      },
    },
  },
};
const currentBoardPresentation = record({
  ...reviewedBoardPresentation.properties,
  board: {
    oneOf: Object.values(reviewedPrintedBoards).map((board) =>
      record({
        assetId: { const: board.assetId },
        reviewId: { const: board.reviewId },
        assetHash: { const: board.assetHash },
      }),
    ),
  },
  focus: { enum: ["m", "a", "s", "ē"] },
  cue: {
    oneOf: [
      ...boardPresentation.properties.cue.oneOf,
      record({
        kind: { const: "childUnderSymbol" },
        pace: { enum: ["slow", "fast"] },
        participant: { enum: ["child", "parentGuidesChild"] },
      }),
    ],
  },
});
const currentBoardNode = record({
  ...reviewedBoardNode.properties,
  presentation: currentBoardPresentation,
});
const currentControlTurnNode = record({
  ...reviewedConnectedControlTurnNode.properties,
  presentation: {
    oneOf: [
      ...reviewedConnectedControlTurnNode.properties.presentation.oneOf,
      currentBoardPresentation,
    ],
  },
});
const currentControlTask = {
  ...reviewedConnectedControlTask,
  properties: {
    ...reviewedConnectedControlTask.properties,
    nodes: list(
      { oneOf: [currentControlTurnNode, ...controlNode.oneOf.slice(1)] },
      1000,
      1,
    ),
  },
};
const currentBoardTask = {
  ...reviewedBoardTask,
  properties: {
    ...reviewedBoardTask.properties,
    nodes: list(currentBoardNode, 1000, 1),
  },
};
const reviewedBody = cumulativeReviewedBoards.properties.body;
const childPointedCumulative = {
  ...cumulativeReviewedBoards,
  properties: {
    ...cumulativeReviewedBoards.properties,
    body: {
      ...reviewedBody,
      properties: {
        ...reviewedBody.properties,
        requiredEngineCapabilities: {
          ...reviewedBody.properties.requiredEngineCapabilities,
          items: {
            type: "string",
            enum: [
              ...reviewedBody.properties.requiredEngineCapabilities.items.enum,
              "child-pointed-single-sounds-l05-v1",
            ],
          },
          minItems: 6,
          maxItems: 6,
        },
        lessons: {
          ...reviewedBody.properties.lessons,
          items: {
            ...reviewedBody.properties.lessons.items,
            properties: {
              ...reviewedBody.properties.lessons.items.properties,
              tasks: list(
                {
                  oneOf: [
                    ...reviewedBody.properties.lessons.items.properties.tasks.items.oneOf.filter(
                      (entry) =>
                        entry.properties.kind.const !== "printedGraphV2" &&
                        entry.properties.kind.const !== "graphControls",
                    ),
                    record({
                      kind: { const: "printedGraphV2" },
                      task: currentBoardTask,
                    }),
                    record({
                      kind: { const: "graphControls" },
                      task: currentControlTask,
                    }),
                  ],
                },
                100,
              ),
            },
          },
        },
      },
    },
  },
};
const cumulativePackageSchema = {
  oneOf: [
    ...oldCumulativePackageSchema.oneOf,
    cumulativeV3,
    cumulativeV4,
    cumulativeReviewedBoards,
    childPointedCumulative,
  ],
};
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
    writingSkippedSchema,
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
    writingActionSchema,
    regularGraphAction,
    helpIntent,
    readyAction,
    confirmAction,
    commitReviewAction,
  ],
};
const selectionIntent = { enum: ["start", "resume", "replay", "restart"] };
const undoBinding = {
  packageHash: hashSchema,
  sessionId: id,
  runId: id,
  advanceId: id,
  runRevision: counter,
  profileRevision: counter,
  cursorRevision: counter,
  selectionCounter: counter,
};
const semanticIntent = {
  oneOf: [
    record({ kind: { const: "undoAdvance" }, binding: record(undoBinding) }),
    writingActionSchema,
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
      correctionPreview: {
        oneOf: [graphNode, currentBoardNode, currentControlTurnNode],
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
      kind: { const: "undoAdvance" },
      scope: sessionScope,
      payload: record(undoBinding),
    }),
    record({
      ...commandCommon,
      kind: { const: "writingUndoAdvance" },
      scope: sessionScope,
      payload: record({ ...undoBinding, barrier: writingBarrierSchema }),
    }),
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
    writingSelectSchema,
    writingNavigateSchema,
    writingControlSchema,
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
  catalog: list(catalogTaskSchema),
};
const sessionProjection = {
  ...commonProjection,
  sessionId: id,
  runId: id,
  revision: counter,
  runStatus: { enum: ["inProgress", "completed", "skipped"] },
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
const boardTurn = record({
  ...currentBoardNode.properties,
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
          boardTurn,
          record({
            ...currentControlTurnNode.properties,
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
    record({ ...sessionProjection, kind: { const: "skipped" } }),
    record({
      ...sessionProjection,
      kind: { const: "writingResult" },
      outcome: { enum: ["completed", "skipped"] },
      documents: list(documentTokenSchema, 2, 2),
    }),
    record({
      ...sessionProjection,
      kind: { const: "writing" },
      documents: list(documentTokenSchema, 2, 2),
      turn: record({
        ...reviewedConnectedControlTurnNode.properties,
        extraPractice: { type: "boolean" },
        routeKind: { enum: ["delivering", "correction"] },
        occurrenceId: id,
        checkpointId: id,
      }),
    }),
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
const savedWorkSchema = record({
  sessionId: id,
  runId: id,
  packageHash: hashSchema,
  lessonId: id,
  taskId: id,
  lastSelectedSequence: counter,
  status: { enum: ["inProgress", "completed", "skipped", "abandoned"] },
});
const courseActionSchema = record({
  label: copy,
  intent: record({
    kind: { enum: ["start", "resume", "restart", "replay"] },
    taskId: id,
    packageHash: hashSchema,
    sessionId: nullableId,
  }),
});
const courseSchema = record({
  lessons: list(
    record({
      lessonId: id,
      number: { type: "integer", minimum: 1, maximum: 100 },
      title: copy,
      tasks: list(
        record({
          id,
          number: { type: "integer", minimum: 1, maximum: 100 },
          title: copy,
          optional: { type: "boolean" },
          artKey: {
            enum: activityArtKeys,
          },
          availability: { enum: ["ready", "missingTeaching"] },
          outcome: { enum: ["unseen", "completed", "skipped"] },
          actions: list(courseActionSchema, 100),
          unfinished: list(savedWorkSchema, 10000),
          history: list(savedWorkSchema, 10000),
        }),
        100,
      ),
      progress: { enum: ["unfinished", "satisfied"] },
    }),
    100,
    1,
  ),
  resume: {
    oneOf: [
      record({ kind: { const: "none" } }),
      record({
        kind: { const: "unfinished" },
        work: savedWorkSchema,
        action: courseActionSchema,
      }),
      record({ kind: { const: "terminalUndoView" }, work: savedWorkSchema }),
    ],
  },
  recommendation: {
    oneOf: [
      record({ kind: { const: "contentBoundary" } }),
      record({ kind: { const: "task" }, lessonId: id, taskId: id }),
    ],
  },
});
const applicationReadSchema = {
  oneOf: [
    record({ kind: { const: "recovery" }, code: id, message: text }),
    record({
      kind: { const: "ready" },
      courseId: id,
      witness: record({
        owner,
        profileRevision: counter,
        activePackageHash: hashSchema,
        activationRevision: counter,
        cursorRevision: counter,
        selectedSessionRevision: { anyOf: [counter, { type: "null" }] },
      }),
      course: courseSchema,
      projection: projectionSchema,
    }),
  ],
};
const historicalSnapshotSchema = {
  ...inkSnapshotSchema,
  properties: Object.fromEntries(
    Object.entries(inkSnapshotSchema.properties).filter(
      ([name]) => name !== "token" && name !== "writable",
    ),
  ),
  required: inkSnapshotSchema.required.filter(
    (name) => name !== "token" && name !== "writable",
  ),
};
const historicalWorkSchema = record({
  kind: { const: "work" },
  summary: savedWorkSchema,
  title: copy,
  documents: list(
    record({
      access: { const: "readOnly" },
      target: writingTargetSchema,
      snapshot: historicalSnapshotSchema,
    }),
    100,
  ),
});
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
  currentBoardPresentation,
  currentBoardNode,
  currentControlTurnNode,
  currentControlTask,
  currentBoardTask,
  childPointedCumulative,
  reviewedWritingPlanSchema,
  reviewedBoardTask,
  reviewedConnectedControlTask,
  reviewedConnectedControlTurnNode,
  reviewedBoardNode,
  projectionSchema,
  savedWorkSchema,
  courseActionSchema,
  graphTask,
  controlTask,
  writingTaskSchema,
  writingPlanSchema,
  parentSpanSchema,
  forbiddenCatalogSkipped: forbiddenCatalogSkippedSchema,
  catalogTask: catalogTaskSchema,
  graphAction,
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
  const transformed = object(root);
  const definitions = new Map(
    Object.entries(sharedDefinitions).map(([name, schema]) => [
      name,
      object(schema),
    ]),
  );
  const retained = new Map<string, Record<string, unknown>>();
  function references(value: unknown): void {
    if (value === null || typeof value !== "object") return;
    if ("$ref" in value) {
      if (typeof value.$ref !== "string" || !value.$ref.startsWith("#/$defs/"))
        throw new Error("Unreviewed shared schema reference");
      const name = value.$ref.slice("#/$defs/".length),
        definition = definitions.get(name);
      if (!definition) throw new Error("Missing shared schema definition");
      if (!retained.has(name)) {
        retained.set(name, definition);
        references(definition);
      }
    }
    for (const child of Object.values(value)) references(child);
  }
  references(transformed);
  return { ...transformed, $defs: Object.fromEntries(retained) };
}
export const validatorSchemas = {
  validatePracticeControlsBinding: practiceControlsBindingSchema,
  validatePracticeControlsSummary: practiceControlsSummarySchema,
  validateDocumentToken: withDefinitions(documentTokenSchema),
  validateInkSnapshot: withDefinitions(inkSnapshotSchema),
  validateRecoveryOpening: withDefinitions(recoveryOpeningSchema),
  validateRecoveryChoice: withDefinitions(recoveryChoiceSchema),
  validateRecoveryInventory: withDefinitions(recoveryInventorySchema),
  validateInkBrush: withDefinitions(inkBrushSchema),
  validateInkStrokeIds: withDefinitions(inkStrokeIdsSchema),
  validateInkOperation: withDefinitions(inkOperationSchema),
  validateInkCommand: withDefinitions(inkCommandSchema),
  validateInkReceipt: withDefinitions(inkReceiptSchema),
  validateApplicationRead: withDefinitions(applicationReadSchema),
  validateHistoricalWork: withDefinitions(historicalWorkSchema),
  validatePackage: withDefinitions(rootSchemas.validatePackage),
  validateCumulativePackage: withDefinitions(cumulativePackageSchema),
  validateState: withDefinitions(rootSchemas.validateState),
  validateCommand: withDefinitions(rootSchemas.validateCommand),
  validateReceipt: withDefinitions(rootSchemas.validateReceipt),
  validateProjection: withDefinitions(rootSchemas.validateProjection),
  validateResult: withDefinitions(rootSchemas.validateResult),
};

export const runtimeCapabilityProfiles = [
  { contentSchemaVersion: 1, capabilities: ["course-development"] },
  ...[
    v2Body,
    cumulativeV3.properties.body,
    cumulativeV4.properties.body,
    cumulativeReviewedBoards.properties.body,
    childPointedCumulative.properties.body,
  ].map((body) => {
    const props = body.properties;
    if (
      !("contentSchemaVersion" in props) ||
      !("requiredEngineCapabilities" in props)
    )
      throw new Error("Missing runtime capability profile");
    return {
      contentSchemaVersion: props.contentSchemaVersion.const,
      capabilities: props.requiredEngineCapabilities.items.enum,
    };
  }),
];
