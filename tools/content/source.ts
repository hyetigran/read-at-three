import { Ajv } from "ajv/dist/jtd.js";
import type { JTDDataType, SomeJTDSchemaType } from "ajv/dist/jtd.js";

const sourceSchema = {
  properties: {
    lessons: {
      elements: {
        properties: {
          number: { type: "int32" },
          tasks: {
            elements: {
              properties: {
                number: { type: "int32" },
                title: { type: "string" },
                sourceContentMarkdown: { type: "string" },
              },
              additionalProperties: true,
            },
          },
        },
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
} satisfies SomeJTDSchemaType;

type LessonSources = JTDDataType<typeof sourceSchema>;
export type RawAuthoringInput = {
  lessons: unknown;
  overviewMarkdown: string;
};
export type SourceAuthoringInput = {
  sources: LessonSources;
  overviewMarkdown: string;
};

const validateSources = new Ajv({ int32range: false }).compile<
  never,
  typeof sourceSchema
>(sourceSchema);

export function parseLessonSources(input: {
  value: unknown;
  purpose: "cumulative" | "legacy";
}): LessonSources {
  const message =
    input.purpose === "cumulative"
      ? "The authorized local lesson records are invalid."
      : "The authorized local source records are invalid.";
  if (!validateSources(input.value)) throw new Error(message);
  if (
    input.purpose === "cumulative" &&
    input.value.lessons.some((lesson) =>
      lesson.tasks.some(
        (task) =>
          task.title.length === 0 || task.sourceContentMarkdown.length === 0,
      ),
    )
  )
    throw new Error(message);
  return input.value;
}
