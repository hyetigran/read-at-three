import type { JTDDataType, SomeJTDSchemaType } from "ajv/dist/jtd.js";

export const animalCatalog = Object.freeze({
  rabbit: "Rabbit",
  fox: "Fox",
  bear: "Bear",
  owl: "Owl",
  turtle: "Turtle",
  bird: "Bird",
  frog: "Frog",
  cat: "Cat",
});
export const avatarSchema = {
  enum: Object.keys(animalCatalog).filter(
    (key): key is keyof typeof animalCatalog =>
      Object.hasOwn(animalCatalog, key),
  ),
} satisfies SomeJTDSchemaType;
export type AvatarId = JTDDataType<typeof avatarSchema>;
const discriminator: "kind" = "kind";
const committed: "profileCommitted" = "profileCommitted";
const setupModes: ("firstLaunch" | "existingFamily" | "complete")[] = [
  "firstLaunch",
  "existingFamily",
  "complete",
];
const string = { type: "string" } satisfies SomeJTDSchemaType;
const nullableString = {
  type: "string",
  nullable: true,
} satisfies SomeJTDSchemaType;
const version = { type: "uint8" } satisfies SomeJTDSchemaType;
const owner = {
  properties: { profileId: string, generation: string },
} satisfies SomeJTDSchemaType;
const administration = {
  properties: { installationId: string, revision: string },
} satisfies SomeJTDSchemaType;
const selection = {
  properties: { installationId: string, revision: string, owner },
} satisfies SomeJTDSchemaType;
export const selectedOwnerSchema = selection;
const target = {
  properties: { owner, revision: string },
} satisfies SomeJTDSchemaType;
export const preferencesSchema = {
  properties: { version },
  optionalProperties: { displayName: string, avatarId: string },
  additionalProperties: true,
} satisfies SomeJTDSchemaType;
const preferencesInput = {
  properties: { avatarId: avatarSchema },
  optionalProperties: { displayName: string },
} satisfies SomeJTDSchemaType;
const courseWitness = {
  properties: {
    owner,
    profileRevision: string,
    activePackageHash: string,
    activationRevision: string,
    cursorRevision: string,
    selectedSessionRevision: nullableString,
  },
} satisfies SomeJTDSchemaType;
const departure = {
  properties: {
    courses: {
      elements: {
        properties: {
          courseId: string,
          witness: courseWitness,
          documents: { elements: {} },
        },
      },
    },
  },
} satisfies SomeJTDSchemaType;
export const departureSchema = departure;
const payload = {
  discriminator,
  mapping: {
    setAvatar: { properties: { target, avatarId: avatarSchema } },
    setDisplayName: { properties: { target, displayName: nullableString } },
    finishInitialProfile: {
      properties: { target, preferences: preferencesInput },
    },
    createAndSelect: {
      properties: { owner, preferences: preferencesInput, departure },
    },
    selectProfile: { properties: { target: owner, departure } },
    acknowledgePreparation: { properties: { hash: string } },
  },
} satisfies SomeJTDSchemaType;
const removalPayload = {
  discriminator,
  mapping: {
    resetProfile: { properties: { target, departure } },
    deleteProfile: {
      properties: {
        target,
        departure,
        successor: {
          discriminator,
          mapping: {
            existing: { properties: { owner } },
            replacement: {
              properties: { owner, preferences: preferencesInput },
            },
          },
        },
      },
    },
  },
} satisfies SomeJTDSchemaType;
const diagnosticCategories: (
  | "storage-unavailable"
  | "storage-corrupt"
  | "quota"
  | "write-failed"
  | "read-failed"
  | "recovery"
  | "unsupported"
  | "timing"
)[] = [
  "storage-unavailable",
  "storage-corrupt",
  "quota",
  "write-failed",
  "read-failed",
  "recovery",
  "unsupported",
  "timing",
];
const diagnosticOperations: (
  "startup" | "read" | "teaching" | "ink" | "administration" | "support"
)[] = ["startup", "read", "teaching", "ink", "administration", "support"];
export const diagnosticEventSchema = {
  properties: {
    category: { enum: diagnosticCategories },
    operation: { enum: diagnosticOperations },
    count: { type: "uint32" },
    durationMs: { type: "uint32" },
  },
} satisfies SomeJTDSchemaType;
export const profileValidationSchemas = {
  validateDiagnosticEvent: diagnosticEventSchema,
  validateDiagnosticRing: {
    properties: {
      version: { type: "uint8" },
      omitted: { type: "float64" },
      records: { elements: diagnosticEventSchema },
    },
  },
  validateProfileRemovalCommand: {
    properties: {
      version,
      commandId: string,
      scope: administration,
      selection,
      payloadHash: string,
      payload: removalPayload,
    },
  },
  validateProfileResetReceipt: {
    properties: {
      kind: { enum: [committed] },
      version,
      commandId: string,
      payloadHash: string,
      administration,
      selection,
      effect: {
        properties: { kind: { enum: ["reset" satisfies "reset"] }, target },
      },
    },
  },
  validateProfileDeletionReceipt: {
    properties: {
      kind: { enum: [committed] },
      version,
      commandId: string,
      payloadHash: string,
      administration,
      expectedRevision: string,
      effect: {
        properties: { kind: { enum: ["deleted" satisfies "deleted"] } },
      },
    },
  },
  validateLocalPreferences: preferencesSchema,
  validatePreparationPolicy: {
    discriminator,
    mapping: {
      unavailable: { properties: {} },
      reviewed: { properties: { hash: string } },
    },
  },
  validateProfileDirectory: {
    properties: {
      administration,
      selection,
      profiles: {
        elements: {
          properties: { edit: target, preferences: preferencesSchema },
        },
      },
      preparation: {
        discriminator,
        mapping: {
          required: {
            properties: {
              requiredHash: string,
              acknowledgedHash: nullableString,
            },
          },
          acknowledged: { properties: { hash: string } },
          unavailable: { properties: { acknowledgedHash: nullableString } },
        },
      },
      initialSetup: {
        properties: {
          kind: { enum: setupModes },
        },
      },
    },
  },
  validateProfileAdministrationCommand: {
    properties: {
      version,
      commandId: string,
      scope: administration,
      selection,
      payloadHash: string,
      payload,
    },
  },
  validateProfileAdministrationReceipt: {
    properties: {
      kind: { enum: [committed] },
      version,
      commandId: string,
      payloadHash: string,
      administration,
      selection,
      effect: {
        discriminator,
        mapping: {
          preferences: { properties: { target } },
          created: { properties: { target } },
          initialSetup: { properties: { target } },
          selection: { properties: { previous: selection } },
          preparation: { properties: { hash: string } },
        },
      },
    },
  },
} satisfies Record<string, SomeJTDSchemaType>;
export type RawPreferences = JTDDataType<typeof preferencesSchema>;
export type RawPreparationPolicy = JTDDataType<
  typeof profileValidationSchemas.validatePreparationPolicy
>;
export type RawProfileDirectory = JTDDataType<
  typeof profileValidationSchemas.validateProfileDirectory
>;
export type RawProfileAdministrationCommand = JTDDataType<
  typeof profileValidationSchemas.validateProfileAdministrationCommand
>;
export type RawProfileAdministrationReceipt = JTDDataType<
  typeof profileValidationSchemas.validateProfileAdministrationReceipt
>;

export type RawProfileRemovalCommand = JTDDataType<
  typeof profileValidationSchemas.validateProfileRemovalCommand
>;
export type RawProfileResetReceipt = JTDDataType<
  typeof profileValidationSchemas.validateProfileResetReceipt
>;
export type RawProfileDeletionReceipt = JTDDataType<
  typeof profileValidationSchemas.validateProfileDeletionReceipt
>;

export type RawDiagnosticEvent = JTDDataType<typeof diagnosticEventSchema>;
export type RawDiagnosticRing = JTDDataType<
  typeof profileValidationSchemas.validateDiagnosticRing
>;
