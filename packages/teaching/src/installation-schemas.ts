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
    kind: { enum: ["initialInstall"] },
    installationId: string,
    commandId: string,
    source: { properties: { mode: { enum: ["fixture", "publication"] } } },
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
export const installationValidationSchemas = {
  validateInitialInstallCommand: initialInstallCommandSchema,
  validateInstallationFact: installationFactSchema,
  validateParentMaterialRequest: parentMaterialRequestSchema,
};
export type RawInitialInstallCommand = JTDDataType<
  typeof initialInstallCommandSchema
>;
export type RawInstallationFact = JTDDataType<typeof installationFactSchema>;
