import { preparationValidationSchemas } from "./preparation-schemas.ts";
const rejectionReasons = [
  "courseAlreadyActive",
  "activationChanged",
  "releaseIdentityConflict",
  "packageIdentityConflict",
  "unsupportedInstallProfile",
] as const;
import type { JTDDataType, SomeJTDSchemaType } from "ajv/dist/jtd.js";
const string = { type: "string" } satisfies SomeJTDSchemaType;
const discriminator: "kind" = "kind";
const installKinds: "initialInstall"[] = ["initialInstall"];
const publicationModes: ("fixture" | "publication")[] = [
  "fixture",
  "publication",
];
const staleStates: ("verified" | "missing" | "corrupt" | "unavailable")[] = [
  "verified",
  "missing",
  "corrupt",
  "unavailable",
];
const materialReasons: (
  | "content"
  | "shell"
  | "representationUnavailable"
  | "unsupportedProfile"
  | "verificationUnavailable"
  | "unsupportedPreview"
)[] = [
  "content",
  "shell",
  "representationUnavailable",
  "unsupportedProfile",
  "verificationUnavailable",
  "unsupportedPreview",
];

const nullableHash = {
  type: "string",
  nullable: true,
} satisfies SomeJTDSchemaType;
export const activationWitnessSchema = {
  discriminator,
  mapping: {
    absent: { properties: {} },
    present: {
      properties: {
        revision: string,
        activePackageHash: string,
        fallbackPackageHash: nullableHash,
      },
    },
  },
} satisfies SomeJTDSchemaType;
export const initialInstallCommandSchema = {
  properties: {
    version: { type: "uint8" },
    kind: { enum: installKinds },
    installationId: string,
    commandId: string,
    source: { properties: { mode: { enum: publicationModes } } },
    target: {
      properties: {
        publicationHash: string,
        courseId: string,
        releaseId: string,
      },
    },
    expected: activationWitnessSchema,
  },
} satisfies SomeJTDSchemaType;
const identity = {
  version: { type: "uint8" },
  installationId: string,
  commandId: string,
  payloadHash: string,
} satisfies Record<string, SomeJTDSchemaType>;
export const installationFactSchema = {
  discriminator,
  mapping: {
    accepted: { properties: { ...identity, targetPackageHash: string } },
    readyInactive: {
      properties: { ...identity, registeredPackageHash: string },
    },
    activated: {
      properties: {
        ...identity,
        registeredPackageHash: string,
        activationRevision: string,
      },
    },
    rejected: {
      properties: {
        ...identity,
        registeredPackageHash: nullableHash,
        reason: {
          enum: [...rejectionReasons],
        },
      },
    },
  },
} satisfies SomeJTDSchemaType;
const materialKinds = ["preparation", "firstTaskPreview"] as const;
export const parentMaterialRequestSchema = {
  properties: { kind: { enum: [...materialKinds] }, packageHash: string },
} satisfies SomeJTDSchemaType;
export type RawParentMaterialRequest = JTDDataType<
  typeof parentMaterialRequestSchema
>;
const installationObservationSchema = {
  discriminator,
  mapping: {
    notChecked: { properties: {} },
    checking: { properties: { inspectionId: string } },
    stale: {
      properties: {
        last: { enum: staleStates },
      },
    },
  },
} satisfies SomeJTDSchemaType;
const installationReadSchema = {
  properties: {
    command: initialInstallCommandSchema,
    fact: installationFactSchema,
    availability: installationObservationSchema,
  },
} satisfies SomeJTDSchemaType;
const installationCatalogSchema = {
  properties: {
    installationId: string,
    courses: {
      elements: {
        properties: { courseId: string, activation: activationWitnessSchema },
      },
    },
    commands: { elements: installationReadSchema },
  },
} satisfies SomeJTDSchemaType;
export type RawActivationWitness = JTDDataType<typeof activationWitnessSchema>;
export type RawInstallationRead = JTDDataType<typeof installationReadSchema>;
export type RawInstallationCatalog = JTDDataType<
  typeof installationCatalogSchema
>;
export const parentMaterialWireSchema = {
  discriminator,
  mapping: {
    unavailable: {
      properties: {
        packageHash: string,
        reason: {
          enum: materialReasons,
        },
      },
    },
    preparation: {
      properties: {
        packageHash: string,
        document: preparationValidationSchemas.validatePreparationPackage,
      },
    },
    firstTaskPreview: { properties: { packageHash: string, task: {} } },
  },
} satisfies SomeJTDSchemaType;
export type RawParentMaterialWire = JTDDataType<
  typeof parentMaterialWireSchema
>;

export const publicationSelectionSchema = {
  properties: { installationId: string, packageHash: string },
} satisfies SomeJTDSchemaType;
const contentCorruption = [
  "envelope-integrity",
  "namespace-integrity",
  "response-metadata",
  "response-length",
  "resource-integrity",
  "svg-grammar",
] as const;
const contentUnavailable = [
  "cache-access",
  "download",
  "stream",
  "crypto",
  "cancelled",
] as const;
const shellCorruption = [
  "descriptor",
  "inventory",
  "resource",
  "controller",
] as const;
const shellUnavailable = [
  "cache",
  "network",
  "crypto",
  "cancelled",
  "uncontrolled",
  "waiting",
  "timeout",
] as const;
export const installedResourceReasonSchema = {
  discriminator,
  mapping: {
    content: {
      properties: {
        failure: {
          discriminator,
          mapping: {
            missing: { properties: { path: string } },
            corrupt: {
              properties: { reason: { enum: [...contentCorruption] } },
            },
            unavailable: {
              properties: { reason: { enum: [...contentUnavailable] } },
            },
          },
        },
      },
    },
    shell: {
      properties: {
        failure: {
          discriminator,
          mapping: {
            missing: { properties: { path: string } },
            corrupt: { properties: { reason: { enum: [...shellCorruption] } } },
            unavailable: {
              properties: { reason: { enum: [...shellUnavailable] } },
            },
          },
        },
      },
    },
    representationUnavailable: { properties: {} },
    unsupportedProfile: { properties: {} },
    verificationUnavailable: { properties: {} },
  },
} satisfies SomeJTDSchemaType;
export const installedResourceFailureSchema = {
  properties: { packageHash: string, reason: installedResourceReasonSchema },
} satisfies SomeJTDSchemaType;
export const publicationCheckSchema = {
  discriminator,
  mapping: {
    verified: { properties: { target: publicationSelectionSchema } },
    unavailable: {
      properties: {
        target: publicationSelectionSchema,
        reason: installedResourceReasonSchema,
      },
    },
    notAuthorized: { properties: { target: publicationSelectionSchema } },
    staleTarget: { properties: { target: publicationSelectionSchema } },
  },
} satisfies SomeJTDSchemaType;
export type RawPublicationSelection = JTDDataType<
  typeof publicationSelectionSchema
>;
export type RawPublicationCheck = JTDDataType<typeof publicationCheckSchema>;
export type RawInstalledResourceFailure = JTDDataType<
  typeof installedResourceFailureSchema
>;

export const installationValidationSchemas = {
  validatePublicationSelection: publicationSelectionSchema,
  validatePublicationCheck: publicationCheckSchema,
  validateInstalledResourceFailure: installedResourceFailureSchema,
  validateParentMaterialWire: parentMaterialWireSchema,
  validateActivationWitness: activationWitnessSchema,
  validateInstallationRead: installationReadSchema,
  validateInstallationCatalog: installationCatalogSchema,
  validateInitialInstallCommand: initialInstallCommandSchema,
  validateInstallationFact: installationFactSchema,
  validateParentMaterialRequest: parentMaterialRequestSchema,
};
export type RawInitialInstallCommand = JTDDataType<
  typeof initialInstallCommandSchema
>;
export type RawInstallationFact = JTDDataType<typeof installationFactSchema>;
