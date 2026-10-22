import type { SomeJTDSchemaType } from "ajv/dist/jtd.js";
const string = { type: "string" } satisfies SomeJTDSchemaType;
export const startFreshCommandSchema = {
  properties: {
    version: { type: "uint8" },
    recoveryId: string,
    commandId: string,
    expectedRevision: string,
  },
} satisfies SomeJTDSchemaType;
export const storeResetRecordSchema = {
  discriminator: "phase",
  mapping: {
    ready: {
      properties: {
        version: { type: "uint8" },
        recoveryId: string,
        revision: string,
        lastCommand: { ...startFreshCommandSchema, nullable: true },
      },
    },
    resetting: {
      properties: {
        version: { type: "uint8" },
        recoveryId: string,
        revision: string,
        command: startFreshCommandSchema,
      },
    },
  },
} satisfies SomeJTDSchemaType;
