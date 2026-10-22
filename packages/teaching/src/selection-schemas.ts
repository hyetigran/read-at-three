import {
  publicationSelectionSchema,
  publicationCheckSchema,
  installedResourceFailureSchema,
  initialInstallCommandSchema,
  parentMaterialRequestSchema,
  parentMaterialWireSchema,
  lessonFilesCommandSchema,
  lessonFilesReceiptSchema,
  lessonFilesViewSchema,
} from "./installation-schemas.ts";
import type { JTDDataType, SomeJTDSchemaType } from "ajv/dist/jtd.js";
import {
  selectedOwnerSchema,
  departureSchema,
  diagnosticEventSchema,
} from "./profile-schemas.ts";

import { preparationInputSchema } from "./preparation-schemas.ts";

const discriminator: "kind" = "kind";
const resourceOperations: ("check" | "repair")[] = ["check", "repair"];
const string = { type: "string" } satisfies SomeJTDSchemaType;
const selection = selectedOwnerSchema;
const operation = {
  discriminator,
  mapping: {
    teaching: { properties: { selection, command: {} } },
    ink: { properties: { selection, command: {} } },
  },
} satisfies SomeJTDSchemaType;
const resolution: "resolution" = "resolution";
const closed: "closed" = "closed";
const rejection = {
  properties: { code: string, message: string },
} satisfies SomeJTDSchemaType;
const selectedTarget = {
  properties: {
    selection,
    target: {
      discriminator,
      mapping: {
        cursor: { properties: {} },
        accepted: { properties: { receipt: {} } },
      },
    },
  },
} satisfies SomeJTDSchemaType;
const workInput = {
  properties: { selection, runId: string },
} satisfies SomeJTDSchemaType;
const inkInput = {
  properties: { selection, token: {} },
} satisfies SomeJTDSchemaType;
const controlsInput = {
  properties: { selection, binding: {} },
} satisfies SomeJTDSchemaType;
const acceptedReceipt = {
  discriminator,
  mapping: {
    committed: { properties: {}, additionalProperties: true },
    inkCommitted: { properties: {}, additionalProperties: true },
    profileCommitted: { properties: {}, additionalProperties: true },
  },
} satisfies SomeJTDSchemaType;
const shellCorruptReasons: (
  "descriptor" | "inventory" | "resource" | "controller"
)[] = ["descriptor", "inventory", "resource", "controller"];
const shellUnavailableReasons: (
  | "cache"
  | "network"
  | "crypto"
  | "cancelled"
  | "uncontrolled"
  | "waiting"
  | "timeout"
)[] = [
  "cache",
  "network",
  "crypto",
  "cancelled",
  "uncontrolled",
  "waiting",
  "timeout",
];
const shellFailure = {
  discriminator,
  mapping: {
    missing: { properties: { path: string } },
    corrupt: {
      properties: {
        reason: { enum: shellCorruptReasons },
      },
    },
    unavailable: {
      properties: {
        reason: {
          enum: shellUnavailableReasons,
        },
      },
    },
  },
} satisfies SomeJTDSchemaType;
const shellBridgeRequest = {
  discriminator,
  mapping: {
    prepare: { properties: { requestId: string } },
    current: { properties: { requestId: string, epoch: string, hash: string } },
  },
} satisfies SomeJTDSchemaType;
const shellBridgeResponse = {
  discriminator,
  mapping: {
    prepared: {
      properties: { requestId: string, epoch: string, hash: string },
    },
    current: {
      properties: {
        requestId: string,
        epoch: string,
        hash: string,
        current: { type: "boolean" },
      },
    },
    refused: { properties: { requestId: string, failure: shellFailure } },
    invalidated: { properties: { epoch: string } },
  },
} satisfies SomeJTDSchemaType;
export const selectionValidationSchemas = {
  validateShellBridgeRequest: shellBridgeRequest,
  validateShellBridgeResponse: shellBridgeResponse,
  validateSelectedOwnerWitness: selection,
  validateSelectedOperation: operation,
  validateSelectedReadTarget: {
    properties: {
      selection,
      target: {
        discriminator,
        mapping: {
          cursor: { properties: {} },
          accepted: { properties: { receipt: {} } },
        },
      },
    },
  },
  validateSelectedWorkInput: workInput,
  validateSelectedInkInput: inkInput,
  validateSelectedControlsInput: controlsInput,
  validateDepartureWitness: departureSchema,
  validateProfileAdministrationResult: {
    discriminator,
    mapping: {
      profileCommitted: { properties: {}, additionalProperties: true },
      rejected: rejection,
    },
  },
  validateSelectedWorkerRequest: {
    discriminator,
    mapping: {
      openInstalledRecovery: { properties: { id: string, opening: {} } },
      openRecovery: {
        properties: {
          id: string,
          content: {},
          preparation: preparationInputSchema,
          opening: {},
        },
      },
      readDirectory: { properties: { id: string } },
      installations: { properties: { id: string } },
      readLessonFiles: { properties: { id: string } },
      changeLessonFiles: {
        properties: { id: string, command: lessonFilesCommandSchema },
      },
      checkPublication: {
        properties: { id: string, input: publicationSelectionSchema },
      },
      repairPublication: {
        properties: { id: string, input: publicationSelectionSchema },
      },
      initialInstall: {
        properties: { id: string, command: initialInstallCommandSchema },
      },
      parentMaterial: {
        properties: { id: string, input: parentMaterialRequestSchema },
      },
      readDiagnostics: { properties: { id: string } },
      recordDiagnostic: {
        properties: { id: string, event: diagnosticEventSchema },
      },
      read: { properties: { id: string, input: selectedTarget } },
      readWork: { properties: { id: string, input: workInput } },
      readInk: { properties: { id: string, input: inkInput } },
      readPracticeControls: {
        properties: { id: string, input: controlsInput },
      },
      execute: { properties: { id: string, operation } },
      administer: { properties: { id: string, command: {} } },
      readDeparture: { properties: { id: string, selection } },
      recoverInk: { properties: { id: string, recoveryId: string, operation } },
      recoverTeaching: {
        properties: { id: string, recoveryId: string, operation },
      },
      recoverAdministration: {
        properties: { id: string, recoveryId: string, command: {} },
      },
      reconcileRecovery: {
        properties: { id: string, recoveryId: string, choice: {} },
      },
    },
  },
  validateSelectedWorkerResponse: {
    discriminator,
    mapping: {
      directory: { properties: { id: string, value: {} } },
      installationCatalog: { properties: { id: string, value: {} } },
      lessonFiles: { properties: { id: string, value: lessonFilesViewSchema } },
      lessonFilesReceipt: {
        properties: { id: string, value: lessonFilesReceiptSchema },
      },
      publicationCheck: {
        properties: {
          id: string,
          operation: { enum: resourceOperations },
          value: publicationCheckSchema,
        },
      },
      contentUnavailable: {
        properties: { id: string, value: installedResourceFailureSchema },
      },
      installationRead: { properties: { id: string, value: {} } },
      parentMaterial: {
        properties: { id: string, value: parentMaterialWireSchema },
      },
      diagnostics: {
        properties: {
          id: string,
          value: {
            properties: {
              persistence: { enum: ["durable", "memoryOnly"] },
              ring: {},
            },
          },
          metadata: {
            properties: {
              versions: {
                properties: {
                  application: string,
                  database: { type: "uint32" },
                  inkCodec: { type: "uint8" },
                },
              },
              capabilities: {
                properties: {
                  opfs: { type: "boolean" },
                  storeLock: { type: "boolean" },
                  sqliteBigInt: { type: "boolean" },
                },
              },
            },
          },
        },
      },
      application: { properties: { id: string, value: {} } },
      work: { properties: { id: string, value: {} } },
      practiceControls: { properties: { id: string, value: {} } },
      execution: { properties: { id: string, value: {} } },
      profileReceipt: { properties: { id: string, value: {} } },
      departure: { properties: { id: string, value: {} } },
      inkSnapshot: { properties: { id: string, value: {} } },
      inventory: { properties: { id: string, value: {} } },
      inkRecovery: { properties: { id: string, value: {} } },
      teachingRecovery: { properties: { id: string, value: {} } },
      administrationRecovery: { properties: { id: string, value: {} } },
      reconciled: { properties: { id: string, value: {} } },
      storageBusy: { properties: { id: string } },
      failed: { properties: { id: string, message: string } },
    },
  },
  validateCurrentApplicationRead: {
    properties: { directory: {}, application: {} },
  },
  validateCurrentResult: { properties: { selection, value: {} } },
  validateExecutionResult: {
    discriminator,
    mapping: {
      teaching: { properties: { selection, result: {} } },
      ink: { properties: { selection, result: {} } },
    },
  },
  validateSelectedRecoveryOpening: {
    discriminator,
    mapping: {
      cold: { properties: {} },
      warm: {
        properties: {
          selection,
          retainedStrokeIds: { elements: string },
          teaching: {},
          administration: {},
        },
      },
    },
  },
  validateSelectedRecoveryInventory: {
    properties: {
      kind: { enum: [closed] },
      recoveryId: string,
      captures: {},
      directory: {},
    },
  },
  validateRecoveryResult: {
    discriminator: resolution,
    mapping: {
      applied: { properties: { selection, result: acceptedReceipt } },
      receiptOnly: { properties: { selection, result: acceptedReceipt } },
      rejected: {
        properties: {
          selection,
          result: { discriminator, mapping: { rejected: rejection } },
        },
      },
    },
  },
  validateInkResult: {
    discriminator,
    mapping: {
      inkCommitted: { properties: { commandId: string, token: {} } },
      rejected: rejection,
    },
  },
} satisfies Record<string, SomeJTDSchemaType>;
export type RawSelectedOwnerWitness = JTDDataType<
  typeof selectionValidationSchemas.validateSelectedOwnerWitness
>;
export type RawSelectedOperation = JTDDataType<
  typeof selectionValidationSchemas.validateSelectedOperation
>;
export type RawSelectedReadTarget = JTDDataType<
  typeof selectionValidationSchemas.validateSelectedReadTarget
>;
export type RawCurrentApplicationRead = JTDDataType<
  typeof selectionValidationSchemas.validateCurrentApplicationRead
>;
export type RawCurrentResult = JTDDataType<
  typeof selectionValidationSchemas.validateCurrentResult
>;
export type RawExecutionResult = JTDDataType<
  typeof selectionValidationSchemas.validateExecutionResult
>;
export type RawSelectedRecoveryOpening = JTDDataType<
  typeof selectionValidationSchemas.validateSelectedRecoveryOpening
>;
export type RawSelectedRecoveryInventory = JTDDataType<
  typeof selectionValidationSchemas.validateSelectedRecoveryInventory
>;
export type RawRecoveryResult = JTDDataType<
  typeof selectionValidationSchemas.validateRecoveryResult
>;
export type RawInkResult = JTDDataType<
  typeof selectionValidationSchemas.validateInkResult
>;
export type RawSelectedWorkInput = JTDDataType<
  typeof selectionValidationSchemas.validateSelectedWorkInput
>;
export type RawSelectedInkInput = JTDDataType<
  typeof selectionValidationSchemas.validateSelectedInkInput
>;
export type RawSelectedControlsInput = JTDDataType<
  typeof selectionValidationSchemas.validateSelectedControlsInput
>;
export type RawDepartureWitness = JTDDataType<
  typeof selectionValidationSchemas.validateDepartureWitness
>;
export type RawProfileAdministrationResult = JTDDataType<
  typeof selectionValidationSchemas.validateProfileAdministrationResult
>;
export type RawSelectedWorkerRequest = JTDDataType<
  typeof selectionValidationSchemas.validateSelectedWorkerRequest
>;
export type RawSelectedWorkerResponse = JTDDataType<
  typeof selectionValidationSchemas.validateSelectedWorkerResponse
>;

export type RawShellBridgeRequest = JTDDataType<typeof shellBridgeRequest>;
export type RawShellBridgeResponse = JTDDataType<typeof shellBridgeResponse>;
