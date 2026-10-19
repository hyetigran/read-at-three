import type { JTDDataType, SomeJTDSchemaType } from "ajv/dist/jtd.js";
const text = { type: "string" } satisfies SomeJTDSchemaType;
const integer = { type: "uint32" } satisfies SomeJTDSchemaType;
const assetMedia: (
  | "application/json"
  | "image/svg+xml"
  | "image/png"
  | "image/webp"
  | "audio/mpeg"
  | "audio/ogg"
)[] = [
  "application/json",
  "image/svg+xml",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/ogg",
];
const resource = {
  properties: {
    path: text,
    sha256: text,
    byteLength: integer,
    mediaType: { enum: assetMedia },
  },
} satisfies SomeJTDSchemaType;
const asset = {
  properties: { ...resource.properties, assetId: text },
} satisfies SomeJTDSchemaType;
const mapping = {
  properties: { fromReleaseId: text, fromLessonId: text, toLessonId: text },
} satisfies SomeJTDSchemaType;
export const publicationEnvelopeSchema = {
  properties: {
    formatVersion: integer,
    body: {
      properties: {
        courseId: text,
        releaseId: text,
        contentSchemaVersion: integer,
        requiredEngineCapabilities: { elements: text },
        lessonIds: { elements: text },
        curriculum: resource,
        assets: { elements: asset },
        sourceReviewManifestHash: text,
        compatibilityMappings: { elements: mapping },
        progressMappings: { elements: mapping },
      },
    },
    packageHash: text,
    signingKeyId: text,
    signature: text,
  },
} satisfies SomeJTDSchemaType;
export type PublicationEnvelope = JTDDataType<typeof publicationEnvelopeSchema>;
export type ManifestBody = PublicationEnvelope["body"];
export type PublicationResource =
  ManifestBody["curriculum"] | ManifestBody["assets"][number];
