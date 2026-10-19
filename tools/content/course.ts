import {
  reviewedCourseExtension,
  reviewedPrintedCourseExtension,
  reviewedOralCourseExtension,
  reviewedConnectedCourseExtension,
  reviewedLessonFourCourseExtension,
  reviewedLessonFiveCourseExtension,
  reviewedLessonFiveCompletionExtension,
  reviewedLessonSixCourseExtension,
  parseExtensionReview,
} from "./extension.ts";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv } from "ajv/dist/jtd.js";
import type { JTDDataType, SomeJTDSchemaType } from "ajv/dist/jtd.js";
import canonicalize from "canonicalize";
import { format } from "prettier";
import {
  activityArtKeys,
  parseDevelopmentPackage,
  parseRuntimePackage,
} from "@readatthree/teaching";
import type {
  CumulativeDevelopmentBody,
  DevelopmentPackage,
  Serialized,
  WritingDevelopmentBody,
} from "@readatthree/teaching";
import { parseLessonSources } from "./source.ts";

const digestSchema = {
  properties: { path: { type: "string" }, sha256: { type: "string" } },
} satisfies SomeJTDSchemaType;
const copySchema = {
  discriminator: "kind" as const,
  mapping: {
    source: {
      properties: { text: { type: "string" }, sourceRef: { type: "string" } },
    },
    adapted: {
      properties: { text: { type: "string" }, sourceRef: { type: "string" } },
    },
    added: { properties: { text: { type: "string" } } },
  },
} satisfies SomeJTDSchemaType;
const reviewSchema = {
  properties: {
    status: { enum: ["local-development-review"] as const },
    reviewedOn: { type: "string" },
    sources: { elements: digestSchema },
    scans: { elements: digestSchema },
    basePackage: {
      properties: {
        path: { type: "string" },
        sha256: { type: "string" },
        packageHash: { type: "string" },
      },
    },
    catalogSha256: { type: "string" },
    lessons: {
      elements: {
        properties: {
          lessonId: { type: "string" },
          number: { type: "uint8" },
          title: copySchema,
          printedPage: { type: "uint16" },
          headingRegion: { type: "string" },
          tasks: {
            elements: {
              properties: {
                taskId: { type: "string" },
                number: { type: "uint8" },
                rawTitle: { type: "string" },
                title: copySchema,
                titleDecision: {
                  enum: ["exact-heading", "scan-verified-override"] as const,
                },
                titleReviewNote: { type: "string" },
                sourceContentSha256: { type: "string" },
                optional: { type: "boolean" },
                optionalEvidence: { type: "string" },
                artKey: { enum: [...activityArtKeys] },
                roleEvidence: { type: "string" },
                printedPage: { type: "uint16" },
                scanPath: { type: "string" },
                headingRegion: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
} satisfies SomeJTDSchemaType;
export type CourseInputReview = JTDDataType<typeof reviewSchema>;
type Digest = JTDDataType<typeof digestSchema>;
type Body = Serialized<CumulativeDevelopmentBody>;
type Inventory = readonly Omit<Body["lessons"][number], "tasks">[];
const validateReview = new Ajv().compile<never, typeof reviewSchema>(
  reviewSchema,
);
const root = resolve(import.meta.dirname, "../..");
export const courseTaskCounts = [6, 7, 8, 7, 9, 8] as const;
const digest = (text: string | Uint8Array) =>
  createHash("sha256").update(text).digest("hex");
const hash = async (text: string) => digest(text);
function canonical(value: unknown): string {
  const text = canonicalize(value);
  if (text === undefined)
    throw new Error("Course content cannot be serialized.");
  return text;
}
function required<T>(value: T | undefined): T {
  if (value === undefined)
    throw new Error("Course source mapping is incomplete.");
  return value;
}
function completeLesson(content: DevelopmentPackage): WritingDevelopmentBody {
  if (content.body.coverage !== "lesson1-complete")
    throw new Error(
      "Course authoring requires the exact complete Lesson 1 package.",
    );
  return content.body;
}
export function reviewedCourseInventory(review: CourseInputReview): Inventory {
  return review.lessons.map((lesson) => ({
    lessonId: lesson.lessonId,
    number: lesson.number,
    title: lesson.title,
    lessonTasks: lesson.tasks.map((task) => ({
      id: task.taskId,
      number: task.number,
      title: task.title,
      optional: task.optional,
      artKey: task.artKey,
    })),
  }));
}
export function courseInventoryHash(inventory: Inventory): string {
  return digest(canonical(inventory));
}
export function verifyCourseInputReview(input: {
  review: unknown;
  sources: readonly Digest[];
  scans: readonly Digest[];
  basePackage: CourseInputReview["basePackage"];
}): CourseInputReview {
  if (!validateReview(input.review))
    throw new Error(
      "The independent course source review is missing or invalid.",
    );
  const review = input.review;
  const digests = [...review.sources, ...review.scans, review.basePackage];
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedOn) ||
    digests.some((item) => !item.path || !/^[a-f0-9]{64}$/.test(item.sha256)) ||
    !/^[a-f0-9]{64}$/.test(review.basePackage.packageHash) ||
    canonical(review.sources) !== canonical(input.sources) ||
    canonical(review.scans) !== canonical(input.scans) ||
    canonical(review.basePackage) !== canonical(input.basePackage)
  )
    throw new Error(
      "Course source inputs changed. Review them before preparing content.",
    );
  if (
    courseInventoryHash(reviewedCourseInventory(review)) !==
    review.catalogSha256
  )
    throw new Error(
      "The reviewed course catalog identity does not match its metadata.",
    );
  return review;
}
export function createCourseBody(input: {
  lessons: unknown;
  review: unknown;
  sources: readonly Digest[];
  scans: readonly Digest[];
  basePackage: DevelopmentPackage;
  basePackageFile: Digest;
}): Body {
  const sources = parseLessonSources({
    value: input.lessons,
    purpose: "cumulative",
  });
  const base = completeLesson(input.basePackage);
  const review = verifyCourseInputReview({
    review: input.review,
    sources: input.sources,
    scans: input.scans,
    basePackage: {
      ...input.basePackageFile,
      packageHash: input.basePackage.packageHash,
    },
  });
  if (sources.lessons.length !== 6 || review.lessons.length !== 6)
    throw new Error("The supplied course needs its six ordered lessons.");
  const inventory = reviewedCourseInventory(review);
  const scanPaths = new Set(review.scans.map((scan) => scan.path));
  for (const [index, lesson] of review.lessons.entries()) {
    const raw = required(sources.lessons[index]);
    const count = required(courseTaskCounts[index]);
    if (
      lesson.number !== index + 1 ||
      raw.number !== lesson.number ||
      lesson.lessonId !==
        (index === 0
          ? base.lessonId
          : `l${String(lesson.number).padStart(2, "0")}`) ||
      lesson.tasks.length !== count ||
      raw.tasks.length !== count ||
      !lesson.title.text.trim() ||
      !lesson.headingRegion.trim()
    )
      throw new Error(
        "The reviewed lesson order or source membership is invalid.",
      );
    for (const [taskIndex, task] of lesson.tasks.entries()) {
      const rawTask = required(raw.tasks[taskIndex]);
      if (
        task.number !== taskIndex + 1 ||
        rawTask.number !== task.number ||
        task.taskId !==
          (index === 0
            ? required(base.lessonTasks[taskIndex]).id
            : `${lesson.lessonId}.t${String(task.number).padStart(2, "0")}`) ||
        task.rawTitle !== rawTask.title ||
        !task.title.text.trim() ||
        task.sourceContentSha256 !== digest(rawTask.sourceContentMarkdown) ||
        (task.titleDecision === "exact-heading" &&
          task.title.text !== rawTask.title) ||
        !task.titleReviewNote.trim() ||
        !task.optionalEvidence.trim() ||
        !task.roleEvidence.trim() ||
        !task.headingRegion.trim() ||
        !scanPaths.has(task.scanPath) ||
        task.optional !== (task.number === count) ||
        (task.artKey === "writing") !== task.optional
      )
        throw new Error(
          "The reviewed task mapping or source membership is invalid.",
        );
    }
  }
  const first = required(inventory[0]);
  if (
    first.lessonId !== base.lessonId ||
    canonical(first.lessonTasks.map(({ artKey: _artKey, ...task }) => task)) !==
      canonical(base.lessonTasks)
  )
    throw new Error(
      "Course metadata must preserve the exact existing Lesson 1 catalog.",
    );
  return {
    coverage: "course-development",
    courseId: base.courseId,
    releaseId: `development.course.${review.catalogSha256}.${input.basePackage.packageHash}`,
    title: { kind: "added", text: "Reading together" },
    lessons: inventory.map((lesson, index) => ({
      ...lesson,
      tasks: index === 0 ? base.tasks : [],
    })),
  };
}
export function createCourseFixtureBody(input: {
  base: WritingDevelopmentBody;
}): Body {
  const roles = [
    [
      "printedSound",
      "oralBlending",
      "oralSounds",
      "printedReview",
      "oralBlending",
      "writing",
    ],
    [
      "printedReview",
      "oralBlending",
      "oralSounds",
      "printedReview",
      "oralBlending",
      "oralSounds",
      "writing",
    ],
    [
      "printedSound",
      "printedReview",
      "oralSounds",
      "printedSlowFast",
      "oralBlending",
      "parentPointing",
      "parentPointing",
      "writing",
    ],
    [
      "printedReview",
      "oralSounds",
      "printedSlowFast",
      "oralBlending",
      "parentPointing",
      "parentPointing",
      "writing",
    ],
    [
      "printedSound",
      "printedReview",
      "oralSounds",
      "oralBlending",
      "printedSlowFast",
      "childPointing",
      "rhyming",
      "childPointing",
      "writing",
    ],
    [
      "printedSlowFast",
      "oralSounds",
      "rhyming",
      "childPointing",
      "oralBlending",
      "rhyming",
      "childPointing",
      "writing",
    ],
  ] satisfies readonly (readonly (typeof activityArtKeys)[number][])[];
  return {
    coverage: "course-development",
    courseId: input.base.courseId,
    releaseId: "fixture.course.release.1",
    title: { kind: "added", text: "Synthetic course" },
    lessons: courseTaskCounts.map((count, index) => {
      const number = index + 1;
      const lessonId =
        index === 0 ? input.base.lessonId : `fixture.lesson.${number}`;
      return {
        lessonId,
        number,
        title: { kind: "added", text: `Synthetic lesson ${number}` },
        lessonTasks: Array.from({ length: count }, (_value, taskIndex) => {
          const taskNumber = taskIndex + 1;
          const artKey = required(required(roles[index])[taskIndex]);
          return index === 0
            ? { ...required(input.base.lessonTasks[taskIndex]), artKey }
            : {
                id: `${lessonId}.t${String(taskNumber).padStart(2, "0")}`,
                number: taskNumber,
                title: {
                  kind: "added",
                  text: `Synthetic lesson ${number} task ${taskNumber} activity`,
                },
                optional: taskNumber === count,
                artKey,
              };
        }),
        tasks: index === 0 ? input.base.tasks : [],
      };
    }),
  };
}
export async function prepareCourseContent(input: { fixture: boolean }) {
  const basePath = input.fixture
    ? "tests/fixtures/writing-development-package.json"
    : ".local/runtime/writing-development-package.json";
  const baseBytes = await readFile(resolve(root, basePath));
  const basePackage = await parseDevelopmentPackage(
    JSON.parse(baseBytes.toString("utf8")),
    hash,
  );
  const base = completeLesson(basePackage);
  let review: CourseInputReview | null = null;
  let body: Body;
  if (input.fixture) body = createCourseFixtureBody({ base });
  else {
    const reviewValue: unknown = JSON.parse(
      await readFile(
        resolve(root, ".local/runtime/course-input-review.json"),
        "utf8",
      ),
    );
    if (!validateReview(reviewValue))
      throw new Error(
        "The independent course source review is missing or invalid.",
      );
    const sourceFiles = await Promise.all(
      reviewValue.sources.map(async ({ path }) => ({
        path,
        bytes: await readFile(resolve(root, path)),
      })),
    );
    const sources = sourceFiles.map(({ path, bytes }) => ({
      path,
      sha256: digest(bytes),
    }));
    const scans = await Promise.all(
      reviewValue.scans.map(async ({ path }) => ({
        path,
        sha256: digest(await readFile(resolve(root, path))),
      })),
    );
    const lessonFile = sourceFiles.find(
      (source) => source.path === "data/lessons-01-06.source.json",
    );
    if (
      !lessonFile ||
      !sources.some(
        (source) => source.path === "output/markdown/lessons-01-06.md",
      ) ||
      !sources.some(
        (source) =>
          source.path === "output/markdown/overview-and-practice-guide.md",
      )
    )
      throw new Error(
        "The course review must bind the supplied raw records, lesson transcription and practice guide.",
      );
    const basePackageFile = { path: basePath, sha256: digest(baseBytes) };
    body = createCourseBody({
      lessons: JSON.parse(lessonFile.bytes.toString("utf8")),
      review: reviewValue,
      sources,
      scans,
      basePackage,
      basePackageFile,
    });
    review = reviewValue;
  }
  let value = {
    formatVersion: 1,
    packageHash: digest(canonical(body)),
    body,
  };
  const baseline = await parseRuntimePackage(value, hash);
  if (!input.fixture) {
    const candidateBytes = await readFile(
      resolve(root, ".local/runtime/lesson-02-development-package.json"),
    );
    const extensionReview = parseExtensionReview(
      JSON.parse(
        await readFile(
          resolve(root, ".local/runtime/lesson-02-input-review.json"),
          "utf8",
        ),
      ),
    );
    if (
      !review ||
      extensionReview.basePackageHash !== baseline.packageHash ||
      extensionReview.candidateSha256 !== digest(candidateBytes) ||
      canonical(extensionReview.sourceInputs) !==
        canonical([...review.sources, ...review.scans])
    )
      throw new Error(
        "Lesson extension review does not match reviewed curriculum inputs",
      );
    for (const item of extensionReview.evidenceInputs) {
      if (digest(await readFile(resolve(root, item.path))) !== item.sha256)
        throw new Error(
          "Lesson extension authoring evidence changed; review again",
        );
    }
    const extension = await reviewedCourseExtension({
      previous: baseline,
      candidate: JSON.parse(candidateBytes.toString("utf8")),
      hash,
    });
    if (extension.packageHash !== extensionReview.packageHash)
      throw new Error("Reviewed extension package identity changed");
    if (extension.body.coverage !== "course-development-v2")
      throw new Error("Expected reviewed content capability");
    const printedBytes = await readFile(
      resolve(root, ".local/runtime/lesson-03-development-package.json"),
    );
    const printedReview = parseExtensionReview(
      JSON.parse(
        await readFile(
          resolve(root, ".local/runtime/lesson-03-input-review.json"),
          "utf8",
        ),
      ),
    );
    if (
      printedReview.basePackageHash !== extension.packageHash ||
      printedReview.candidateSha256 !== digest(printedBytes) ||
      canonical(printedReview.sourceInputs) !==
        canonical([...review.sources, ...review.scans])
    )
      throw new Error(
        "Printed extension review does not match exact predecessor and source inputs",
      );
    for (const item of printedReview.evidenceInputs)
      if (digest(await readFile(resolve(root, item.path))) !== item.sha256)
        throw new Error(
          "Printed extension authoring evidence changed; review again",
        );
    const printed = await reviewedPrintedCourseExtension({
      previous: extension,
      candidate: JSON.parse(printedBytes.toString("utf8")),
      hash,
    });
    if (printed.packageHash !== printedReview.packageHash)
      throw new Error("Printed extension package identity changed");
    if (printed.body.coverage !== "course-development-v3")
      throw new Error("Expected reviewed printed capability");
    const oralBytes = await readFile(
      resolve(root, ".local/runtime/lesson-03-oral-development-package.json"),
    );
    const oralReview = parseExtensionReview(
      JSON.parse(
        await readFile(
          resolve(root, ".local/runtime/lesson-03-oral-input-review.json"),
          "utf8",
        ),
      ),
    );
    if (
      oralReview.basePackageHash !== printed.packageHash ||
      oralReview.candidateSha256 !== digest(oralBytes) ||
      canonical(oralReview.sourceInputs) !==
        canonical([...review.sources, ...review.scans])
    )
      throw new Error(
        "Oral extension review does not match exact predecessor and source inputs",
      );
    for (const item of oralReview.evidenceInputs)
      if (digest(await readFile(resolve(root, item.path))) !== item.sha256)
        throw new Error(
          "Oral extension authoring evidence changed; review again",
        );
    const oral = await reviewedOralCourseExtension({
      previous: printed,
      candidate: JSON.parse(oralBytes.toString("utf8")),
      hash,
    });
    if (oral.packageHash !== oralReview.packageHash)
      throw new Error("Oral extension package identity changed");
    if (oral.body.coverage !== "course-development-v3")
      throw new Error("Expected reviewed oral capability");
    if (
      oral.packageHash !==
      "026abc4cead9499de767a82067c57ce7c9bddc8ab13a819ac59ac1ded6b90ebe"
    )
      throw new Error(
        "Connected extension requires the exact accepted issue-14 predecessor",
      );
    const connectedBytes = await readFile(
      resolve(
        root,
        ".local/runtime/lesson-03-connected-development-package.json",
      ),
    );
    const connectedReview = parseExtensionReview(
      JSON.parse(
        await readFile(
          resolve(root, ".local/runtime/lesson-03-connected-input-review.json"),
          "utf8",
        ),
      ),
    );
    if (
      connectedReview.basePackageHash !== oral.packageHash ||
      connectedReview.candidateSha256 !== digest(connectedBytes) ||
      canonical(connectedReview.sourceInputs) !==
        canonical([...review.sources, ...review.scans])
    )
      throw new Error(
        "Connected extension review does not match exact predecessor and source inputs",
      );
    for (const item of connectedReview.evidenceInputs)
      if (digest(await readFile(resolve(root, item.path))) !== item.sha256)
        throw new Error(
          "Connected extension authoring evidence changed; review again",
        );
    const connected = await reviewedConnectedCourseExtension({
      previous: oral,
      candidate: JSON.parse(connectedBytes.toString("utf8")),
      hash,
    });
    if (connected.packageHash !== connectedReview.packageHash)
      throw new Error("Connected extension package identity changed");
    if (connected.body.coverage !== "course-development-v4")
      throw new Error("Expected reviewed connected capability");
    if (
      connected.packageHash !==
      "06ab8b8ec07c2aecfc357793cbba68ace83c33abf2c489e14b84b96336c3b076"
    )
      throw new Error(
        "Lesson four extension requires the exact accepted issue-15 predecessor",
      );
    const lessonFourBytes = await readFile(
      resolve(root, ".local/runtime/lesson-04-development-package.json"),
    );
    const lessonFourReview = parseExtensionReview(
      JSON.parse(
        await readFile(
          resolve(root, ".local/runtime/lesson-04-input-review.json"),
          "utf8",
        ),
      ),
    );
    if (
      lessonFourReview.basePackageHash !== connected.packageHash ||
      lessonFourReview.candidateSha256 !== digest(lessonFourBytes) ||
      canonical(lessonFourReview.sourceInputs) !==
        canonical([...review.sources, ...review.scans])
    )
      throw new Error(
        "Lesson four extension review does not match exact predecessor and source inputs",
      );
    for (const item of lessonFourReview.evidenceInputs)
      if (digest(await readFile(resolve(root, item.path))) !== item.sha256)
        throw new Error(
          "Lesson four extension authoring evidence changed; review again",
        );
    const lessonFour = await reviewedLessonFourCourseExtension({
      previous: connected,
      candidate: JSON.parse(lessonFourBytes.toString("utf8")),
      hash,
    });
    if (
      lessonFour.packageHash !== lessonFourReview.packageHash ||
      lessonFour.body.coverage !== "course-development-v4"
    )
      throw new Error("Reviewed lesson four package identity changed");
    const lessonFiveBytes = await readFile(
      resolve(root, ".local/runtime/lesson-05-development-package.json"),
    );
    const lessonFiveReview = parseExtensionReview(
      JSON.parse(
        await readFile(
          resolve(root, ".local/runtime/lesson-05-input-review.json"),
          "utf8",
        ),
      ),
    );
    if (
      lessonFiveReview.basePackageHash !== lessonFour.packageHash ||
      lessonFiveReview.candidateSha256 !== digest(lessonFiveBytes) ||
      canonical(lessonFiveReview.sourceInputs) !==
        canonical([...review.sources, ...review.scans])
    )
      throw new Error(
        "Lesson five extension review does not match exact predecessor and source inputs",
      );
    for (const item of lessonFiveReview.evidenceInputs)
      if (digest(await readFile(resolve(root, item.path))) !== item.sha256)
        throw new Error(
          "Lesson five extension authoring evidence changed; review again",
        );
    const lessonFive = await reviewedLessonFiveCourseExtension({
      previous: lessonFour,
      candidate: JSON.parse(lessonFiveBytes.toString("utf8")),
      hash,
    });
    if (
      lessonFive.packageHash !== lessonFiveReview.packageHash ||
      lessonFive.body.coverage !== "course-development-v4"
    )
      throw new Error("Reviewed lesson five package identity changed");
    const completionBytes = await readFile(
      resolve(
        root,
        ".local/runtime/lesson-05-complete-development-package.json",
      ),
    );
    const completionReview = parseExtensionReview(
      JSON.parse(
        await readFile(
          resolve(root, ".local/runtime/lesson-05-complete-input-review.json"),
          "utf8",
        ),
      ),
    );
    if (
      completionReview.basePackageHash !== lessonFive.packageHash ||
      completionReview.candidateSha256 !== digest(completionBytes) ||
      canonical(completionReview.sourceInputs) !==
        canonical(lessonFiveReview.sourceInputs)
    )
      throw new Error(
        "Lesson five completion review does not match exact predecessor and source inputs",
      );
    for (const item of completionReview.evidenceInputs)
      if (digest(await readFile(resolve(root, item.path))) !== item.sha256)
        throw new Error(
          "Lesson five completion authoring evidence changed; review again",
        );
    const completion = await reviewedLessonFiveCompletionExtension({
      previous: lessonFive,
      candidate: JSON.parse(completionBytes.toString("utf8")),
      hash,
    });
    if (
      completion.packageHash !== completionReview.packageHash ||
      completion.body.coverage !== "course-development-v4"
    )
      throw new Error("Reviewed lesson five completion identity changed");
    const lessonSixBytes = await readFile(
      resolve(
        root,
        ".local/runtime/lesson-06-complete-development-package.json",
      ),
    );
    const lessonSixReview = parseExtensionReview(
      JSON.parse(
        await readFile(
          resolve(root, ".local/runtime/lesson-06-complete-input-review.json"),
          "utf8",
        ),
      ),
    );
    if (
      lessonSixReview.basePackageHash !== completion.packageHash ||
      lessonSixReview.candidateSha256 !== digest(lessonSixBytes) ||
      canonical(lessonSixReview.sourceInputs) !==
        canonical(completionReview.sourceInputs)
    )
      throw new Error(
        "Lesson six review does not match exact predecessor and source inputs",
      );
    for (const item of lessonSixReview.evidenceInputs)
      if (digest(await readFile(resolve(root, item.path))) !== item.sha256)
        throw new Error("Lesson six authoring evidence changed; review again");
    const lessonSix = await reviewedLessonSixCourseExtension({
      previous: completion,
      candidate: JSON.parse(lessonSixBytes.toString("utf8")),
      hash,
    });
    if (
      lessonSix.packageHash !== lessonSixReview.packageHash ||
      lessonSix.body.coverage !== "course-development-v4"
    )
      throw new Error("Reviewed lesson six identity changed");
    body = lessonSix.body;
    value = { formatVersion: 1, packageHash: lessonSix.packageHash, body };
  }
  const path = resolve(
    root,
    input.fixture
      ? "tests/fixtures/course-development-package.json"
      : ".local/runtime/course-development-package.json",
  );
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    await format(JSON.stringify(value), { parser: "json" }),
  );
  if (review)
    await writeFile(
      resolve(root, ".local/runtime/course-source-review.json"),
      await format(
        JSON.stringify({
          status: "local-development-review",
          reviewedOn: review.reviewedOn,
          packageHash: value.packageHash,
          basePackage: review.basePackage,
          catalogSha256: review.catalogSha256,
          sources: review.sources,
          scans: review.scans,
          scope:
            "Six supplied lesson catalogs, 45 ordered tasks; complete executable Lessons 1 through 6. Publication remains unapproved.",
          lessons: review.lessons,
          laterTeaching:
            "Only the supplied Lessons 1 through 6 are available. No later instructional definitions or automatic mastery are created.",
          publication: "pending",
          runtimePublicationApproval: "pending-separate-record",
        }),
        { parser: "json" },
      ),
    );
  process.stdout.write(
    `Prepared ${input.fixture ? "explicit synthetic course fixture" : "private cumulative course development content"}.\n`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await prepareCourseContent({ fixture: process.argv.includes("--fixture") });
