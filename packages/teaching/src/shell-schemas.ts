import type { JTDDataType, SomeJTDSchemaType } from "ajv/dist/jtd.js";
const text = { type: "string" } satisfies SomeJTDSchemaType;
const integer = { type: "uint32" } satisfies SomeJTDSchemaType;
const modes: ("fixture" | "publication")[] = ["fixture", "publication"];
const resource = {
  properties: {
    path: text,
    sha256: text,
    byteLength: integer,
    mediaType: text,
  },
} satisfies SomeJTDSchemaType;
export const shellDescriptorSchema = {
  properties: {
    formatVersion: integer,
    body: {
      properties: {
        formatVersion: integer,
        applicationVersion: text,
        bootstrapPolicyVersion: integer,
        mode: { enum: modes },
        serviceWorker: resource,
        navigation: resource,
        resources: { elements: resource },
      },
    },
    buildHash: text,
    signingKeyId: text,
    signature: text,
  },
} satisfies SomeJTDSchemaType;
export type ShellDescriptor = JTDDataType<typeof shellDescriptorSchema>;
export type ShellBody = ShellDescriptor["body"];
export type ShellResource = ShellBody["navigation"];
