import {
  canonical,
  cumulativeExtension,
  guidanceCopies,
  parseRuntimePackage,
} from "@readatthree/teaching";
import type {
  HashFunction,
  ParentSpan,
  RuntimePackage,
} from "@readatthree/teaching";
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

export async function reviewedPrintedCourseExtension(input: {
  previous: RuntimePackage;
  candidate: unknown;
  hash: HashFunction;
}) {
  const candidate = await parseRuntimePackage(input.candidate, input.hash);
  if (
    input.previous.body.coverage !== "course-development-v2" ||
    candidate.body.coverage !== "course-development-v3" ||
    !cumulativeExtension({ previous: input.previous, candidate })
  )
    throw new Error(
      "Printed extension must preserve exact predecessor curriculum",
    );
  if (
    canonical(
      input.previous.body.lessons.map(
        ({ tasks: _tasks, ...catalog }) => catalog,
      ),
    ) !==
    canonical(
      candidate.body.lessons.map(({ tasks: _tasks, ...catalog }) => catalog),
    )
  )
    throw new Error("Printed extension changed source catalog");
  for (const [index, lesson] of candidate.body.lessons.entries()) {
    const before = input.previous.body.lessons[index];
    if (!before) throw new Error("Printed extension changed lesson catalog");
    if (index === 2) {
      if (
        before.tasks.length !== 0 ||
        canonical(lesson.tasks.map((entry) => entry.task.number)) !==
          canonical([1, 2, 4]) ||
        lesson.tasks.some((entry) => entry.kind !== "printedGraphV2")
      )
        throw new Error(
          "Printed extension requires exactly reviewed tasks 1, 2 and 4",
        );
    } else if (canonical(lesson.tasks) !== canonical(before.tasks))
      throw new Error("Printed extension changed predecessor task definitions");
  }
  return candidate;
}

export async function reviewedOralCourseExtension(input: {
  previous: RuntimePackage;
  candidate: unknown;
  hash: HashFunction;
}) {
  const candidate = await parseRuntimePackage(input.candidate, input.hash);
  if (
    input.previous.body.coverage !== "course-development-v3" ||
    candidate.body.coverage !== "course-development-v3" ||
    !cumulativeExtension({ previous: input.previous, candidate })
  )
    throw new Error(
      "Oral extension must preserve exact predecessor curriculum",
    );
  if (
    canonical(
      input.previous.body.lessons.map(
        ({ tasks: _tasks, ...catalog }) => catalog,
      ),
    ) !==
    canonical(
      candidate.body.lessons.map(({ tasks: _tasks, ...catalog }) => catalog),
    )
  )
    throw new Error("Oral extension changed source catalog");
  for (const [index, lesson] of candidate.body.lessons.entries()) {
    const before = input.previous.body.lessons[index];
    if (!before) throw new Error("Oral extension changed lesson catalog");
    if (index === 2) {
      if (
        canonical(before.tasks.map((entry) => entry.task.number)) !==
          canonical([1, 2, 4]) ||
        canonical(lesson.tasks.map((entry) => entry.task.number)) !==
          canonical([1, 2, 3, 4, 5]) ||
        lesson.tasks.some(
          (entry) =>
            [3, 5].includes(entry.task.number) &&
            (entry.kind !== "graphControls" ||
              entry.task.nodes.some(
                (node) =>
                  node.kind === "turn" && node.presentation.kind !== "oral",
              )),
        )
      )
        throw new Error(
          "Oral extension requires exactly reviewed tasks 3 and 5",
        );
    } else if (canonical(lesson.tasks) !== canonical(before.tasks))
      throw new Error("Oral extension changed predecessor task definitions");
  }
  return candidate;
}

export async function reviewedConnectedCourseExtension(input: {
  previous: RuntimePackage;
  candidate: unknown;
  hash: HashFunction;
}) {
  const candidate = await parseRuntimePackage(input.candidate, input.hash);
  if (
    input.previous.body.coverage !== "course-development-v3" ||
    candidate.body.coverage !== "course-development-v4" ||
    !cumulativeExtension({ previous: input.previous, candidate })
  )
    throw new Error(
      "Connected extension must preserve exact predecessor curriculum",
    );
  if (
    canonical(
      input.previous.body.lessons.map(
        ({ tasks: _tasks, ...catalog }) => catalog,
      ),
    ) !==
    canonical(
      candidate.body.lessons.map(({ tasks: _tasks, ...catalog }) => catalog),
    )
  )
    throw new Error("Connected extension changed source catalog");
  for (const [index, lesson] of candidate.body.lessons.entries()) {
    const before = input.previous.body.lessons[index];
    if (!before) throw new Error("Connected extension changed lesson catalog");
    if (index === 2) {
      if (
        canonical(before.tasks.map((entry) => entry.task.number)) !==
          canonical([1, 2, 3, 4, 5]) ||
        canonical(lesson.tasks.map((entry) => entry.task.number)) !==
          canonical([1, 2, 3, 4, 5, 6, 7, 8]) ||
        lesson.tasks.some(
          (entry) =>
            [6, 7].includes(entry.task.number) &&
            (entry.kind !== "graphControls" ||
              entry.task.nodes.some(
                (node) =>
                  node.kind === "turn" &&
                  node.presentation.kind !== "connectedPointing",
              )),
        ) ||
        lesson.tasks.find((entry) => entry.task.number === 8)?.kind !==
          "writingPracticePlanV2"
      )
        throw new Error(
          "Connected extension requires exactly reviewed pointing Tasks 6 and 7 and writing Task 8",
        );
    } else if (canonical(lesson.tasks) !== canonical(before.tasks))
      throw new Error(
        "Connected extension changed predecessor task definitions",
      );
  }
  return candidate;
}

function requirePopulatedSpeech(
  guidance: readonly ParentSpan[],
  lesson = "Lesson four",
) {
  if (
    guidance.some(
      (span) =>
        span.kind === "speech" &&
        guidanceCopies(span).every((copy) => copy.text.trim().length === 0),
    )
  )
    throw new Error(
      `${lesson} guidance contains a whitespace-only speech block`,
    );
}

export async function reviewedLessonFourCourseExtension(input: {
  previous: RuntimePackage;
  candidate: unknown;
  hash: HashFunction;
}) {
  const candidate = await parseRuntimePackage(input.candidate, input.hash);
  if (
    input.previous.body.coverage !== "course-development-v4" ||
    candidate.body.coverage !== "course-development-v4" ||
    !candidate.body.requiredEngineCapabilities.includes(
      "reviewed-board-layouts-l04-v1",
    ) ||
    !cumulativeExtension({ previous: input.previous, candidate })
  )
    throw new Error(
      "Lesson four extension must preserve exact predecessor curriculum",
    );
  if (
    canonical(
      input.previous.body.lessons.map(
        ({ tasks: _tasks, ...catalog }) => catalog,
      ),
    ) !==
    canonical(
      candidate.body.lessons.map(({ tasks: _tasks, ...catalog }) => catalog),
    )
  )
    throw new Error("Lesson four extension changed source catalog");
  for (const [index, lesson] of candidate.body.lessons.entries()) {
    const before = input.previous.body.lessons[index];
    if (!before)
      throw new Error("Lesson four extension changed lesson catalog");
    if (index === 3) {
      if (
        before.tasks.length !== 0 ||
        canonical(lesson.tasks.map((entry) => entry.task.number)) !==
          canonical([1, 2, 3, 4, 5, 6, 7]) ||
        canonical(lesson.tasks.map((entry) => entry.kind)) !==
          canonical([
            "printedGraphV2",
            "graphControls",
            "printedGraphV2",
            "graphControls",
            "graphControls",
            "graphControls",
            "writingPracticePlanV2",
          ])
      )
        throw new Error(
          "Lesson four extension requires all seven reviewed tasks",
        );
      for (const entry of lesson.tasks) {
        if (entry.kind === "writingPracticePlanV2") {
          const scripts = [
            entry.task.introduction,
            ...entry.task.targets.flatMap((target) => [
              target.demonstration,
              target.sound.prompt,
              target.sound.expected,
              target.sound.affirmation,
              target.tracing.instruction,
              target.tracing.praise,
              target.independent.instruction,
              target.independent.praise,
            ]),
          ];
          for (const script of scripts) requirePopulatedSpeech(script.guidance);
        } else if ("nodes" in entry.task)
          for (const node of entry.task.nodes)
            if ("guidance" in node) requirePopulatedSpeech(node.guidance);
      }
    } else if (canonical(lesson.tasks) !== canonical(before.tasks))
      throw new Error(
        "Lesson four extension changed predecessor task definitions",
      );
  }
  return candidate;
}

export async function reviewedLessonFiveCourseExtension(input: {
  previous: RuntimePackage;
  candidate: unknown;
  hash: HashFunction;
}) {
  const candidate = await parseRuntimePackage(input.candidate, input.hash);
  if (
    input.previous.body.coverage !== "course-development-v4" ||
    candidate.body.coverage !== "course-development-v4" ||
    !candidate.body.requiredEngineCapabilities.includes(
      "child-pointed-single-sounds-l05-v1",
    ) ||
    !cumulativeExtension({ previous: input.previous, candidate })
  )
    throw new Error(
      "Lesson five extension must preserve exact predecessor curriculum",
    );
  const before = input.previous.body;
  if (
    canonical(
      before.lessons.map(({ tasks: _tasks, ...catalog }) => catalog),
    ) !==
    canonical(
      candidate.body.lessons.map(({ tasks: _tasks, ...catalog }) => catalog),
    )
  )
    throw new Error("Lesson five extension changed source catalog");
  for (const [index, lesson] of candidate.body.lessons.entries()) {
    const prior = before.lessons[index];
    if (!prior) throw new Error("Lesson five extension changed lesson catalog");
    if (index !== 4) {
      if (canonical(lesson.tasks) !== canonical(prior.tasks))
        throw new Error(
          "Lesson five extension changed predecessor task definitions",
        );
      continue;
    }
    if (
      prior.tasks.length !== 0 ||
      canonical(lesson.tasks.map((entry) => entry.task.number)) !==
        canonical([1, 2, 3, 4, 5, 6]) ||
      canonical(lesson.tasks.map((entry) => entry.kind)) !==
        canonical([
          "printedGraphV2",
          "printedGraphV2",
          "graphControls",
          "graphControls",
          "graphControls",
          "graphControls",
        ])
    )
      throw new Error(
        "Lesson five extension requires exactly six reviewed tasks",
      );
    for (const entry of lesson.tasks)
      if ("nodes" in entry.task)
        for (const node of entry.task.nodes)
          if ("guidance" in node) {
            requirePopulatedSpeech(node.guidance, "Lesson five");
            if (
              node.guidance.some((span) =>
                /(^|\n)\s*>\s/.test(
                  guidanceCopies(span)
                    .map((copy) => copy.text)
                    .join(""),
                ),
              )
            )
              throw new Error(
                "Lesson five guidance contains a transcription quote marker",
              );
          }
  }
  return candidate;
}

export async function reviewedLessonFiveCompletionExtension(input: {
  previous: RuntimePackage;
  candidate: unknown;
  hash: HashFunction;
}) {
  const candidate = await parseRuntimePackage(input.candidate, input.hash);
  if (
    input.previous.body.coverage !== "course-development-v4" ||
    candidate.body.coverage !== "course-development-v4" ||
    !candidate.body.requiredEngineCapabilities.includes(
      "rhyming-connected-writing-l05-v1",
    ) ||
    !cumulativeExtension({ previous: input.previous, candidate })
  )
    throw new Error(
      "Lesson five completion must preserve exact predecessor curriculum",
    );
  const before = input.previous.body;
  if (
    canonical(
      before.lessons.map(({ tasks: _tasks, ...catalog }) => catalog),
    ) !==
    canonical(
      candidate.body.lessons.map(({ tasks: _tasks, ...catalog }) => catalog),
    )
  )
    throw new Error("Lesson five completion changed source catalog");
  for (const [index, lesson] of candidate.body.lessons.entries()) {
    const prior = before.lessons[index];
    if (!prior)
      throw new Error("Lesson five completion changed lesson catalog");
    if (index !== 4) {
      if (canonical(lesson.tasks) !== canonical(prior.tasks))
        throw new Error(
          "Lesson five completion changed predecessor task definitions",
        );
      continue;
    }
    if (
      prior.tasks.length !== 6 ||
      canonical(lesson.tasks.map((entry) => entry.task.number)) !==
        canonical([1, 2, 3, 4, 5, 6, 7, 8, 9]) ||
      canonical(lesson.tasks.slice(6).map((entry) => entry.kind)) !==
        canonical(["graphControls", "graphControls", "writingPracticePlanV3"])
    )
      throw new Error(
        "Lesson five completion requires exactly three reviewed final tasks",
      );
  }
  return candidate;
}
