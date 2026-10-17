import {
  canonical,
  cumulativeExtension,
  parseRuntimePackage,
} from "@readatthree/teaching";
import type { HashFunction, RuntimePackage } from "@readatthree/teaching";
import { Ajv } from "ajv/dist/jtd.js";
import type { JTDDataType, SomeJTDSchemaType } from "ajv/dist/jtd.js";

const digest = {
  properties: { path: { type: "string" }, sha256: { type: "string" } },
} satisfies SomeJTDSchemaType;
const reviewSchema = {
  properties: {
    status: { enum: ["local-development-review"] },
    publication: { enum: ["pending"] },
    packageHash: { type: "string" },
    candidateSha256: { type: "string" },
    basePackageHash: { type: "string" },
    sourceInputs: { elements: digest },
    evidenceInputs: { elements: digest },
  },
} satisfies SomeJTDSchemaType;
const validate = new Ajv().compile<never, typeof reviewSchema>(reviewSchema);
export type ExtensionInputReview = JTDDataType<typeof reviewSchema>;
export function parseExtensionReview(input: unknown): ExtensionInputReview {
  if (!validate(input))
    throw new Error("Lesson extension source review missing or unsupported");
  const hashes = [
    input.packageHash,
    input.candidateSha256,
    input.basePackageHash,
    ...input.sourceInputs.map((item) => item.sha256),
    ...input.evidenceInputs.map((item) => item.sha256),
  ];
  if (
    hashes.some((value) => !/^[a-f0-9]{64}$/.test(value)) ||
    input.sourceInputs.length === 0 ||
    input.evidenceInputs.length === 0
  )
    throw new Error("Lesson extension source review is incomplete");
  return input;
}
export async function reviewedCourseExtension(input: {
  previous: RuntimePackage;
  candidate: unknown;
  hash: HashFunction;
}) {
  const candidate = await parseRuntimePackage(input.candidate, input.hash);
  if (
    candidate.body.coverage !== "course-development-v2" ||
    !cumulativeExtension({ previous: input.previous, candidate })
  )
    throw new Error(
      "Reviewed extension must preserve existing authored curriculum",
    );
  const before = input.previous.body;
  if (
    before.coverage !== "course-development" &&
    before.coverage !== "course-development-v2"
  )
    throw new Error("Reviewed course catalog required");
  if (
    canonical(
      before.lessons.map(({ tasks: _tasks, ...catalog }) => catalog),
    ) !==
    canonical(
      candidate.body.lessons.map(({ tasks: _tasks, ...catalog }) => catalog),
    )
  )
    throw new Error("Reviewed extension changed source catalog");
  const lesson = candidate.body.lessons[1];
  if (!lesson || lesson.tasks.length !== lesson.lessonTasks.length)
    throw new Error(
      "Reviewed lesson extension must implement every catalog task",
    );
  if (candidate.body.lessons.slice(2).some((item) => item.tasks.length > 0))
    throw new Error("Later lessons require their own reviewed extension");
  return candidate;
}
