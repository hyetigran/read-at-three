import { canonical, deepFreeze } from "./identity.ts";
import { parseDevelopmentPackage, compileTask } from "./content.ts";
import { compileControlTask } from "./control-content.ts";
import { compileWritingTask } from "./writing.ts";
import { validateCumulativePackage } from "./generated-validators.js";
import type {
  Copy,
  CourseId,
  DevelopmentPackage,
  HashFunction,
  LessonId,
  LessonTask,
  MixedTask,
  PackageHash,
  ReleaseId,
  TaskId,
} from "./types.ts";

export { activityArtKeys } from "./course-art.ts";
export type { ActivityArtKey } from "./course-art.ts";
import type { ActivityArtKey } from "./course-art.ts";
export type CourseCatalogTask = LessonTask &
  Readonly<{ artKey: ActivityArtKey }>;
export type CumulativeLesson = Readonly<{
  lessonId: LessonId;
  number: number;
  title: Copy;
  lessonTasks: readonly CourseCatalogTask[];
  tasks: readonly MixedTask[];
}>;
export type CumulativeDevelopmentBody = Readonly<{
  coverage: "course-development";
  courseId: CourseId;
  releaseId: ReleaseId;
  title: Copy;
  lessons: readonly CumulativeLesson[];
}>;
export type CumulativeDevelopmentPackage = Readonly<{
  formatVersion: 1;
  packageHash: PackageHash;
  body: CumulativeDevelopmentBody;
}>;
export type RuntimePackage = DevelopmentPackage | CumulativeDevelopmentPackage;
export type ResolvedLesson = Readonly<{
  kind: "resolvedLesson";
  enclosing: RuntimePackage;
  lessonId: LessonId;
  number: number;
  title: Copy;
  lessonTasks: readonly LessonTask[];
  tasks: readonly MixedTask[];
  completeDefinition: boolean;
}>;
const lessonViews = new WeakMap<RuntimePackage, readonly ResolvedLesson[]>();
export function resolvedLessons(
  content: RuntimePackage,
): readonly ResolvedLesson[] {
  const cached = lessonViews.get(content);
  if (cached) return cached;
  const resolved = resolveLessons(content);
  for (const lesson of resolved) {
    for (const entry of lesson.tasks) Object.freeze(entry);
    Object.freeze(lesson.tasks);
    Object.freeze(lesson.lessonTasks);
    Object.freeze(lesson);
  }
  Object.freeze(resolved);
  lessonViews.set(content, resolved);
  return resolved;
}
function resolveLessons(content: RuntimePackage): readonly ResolvedLesson[] {
  const body = content.body;
  if (body.coverage === "course-development")
    return body.lessons.map((lesson) => ({
      kind: "resolvedLesson",
      enclosing: content,
      ...lesson,
      completeDefinition:
        lesson.tasks.length > 0 &&
        lesson.tasks.length === lesson.lessonTasks.length,
    }));
  if (body.coverage === "partial-first-m")
    return [
      {
        kind: "resolvedLesson",
        enclosing: content,
        lessonId: body.lessonId,
        number: 1,
        title: body.title,
        lessonTasks: [],
        tasks: [],
        completeDefinition: false,
      },
    ];
  const tasks: readonly MixedTask[] =
    body.coverage === "lesson1-sounds-complete"
      ? body.tasks.map((task) => ({ kind: "printedGraphV1", task }))
      : body.tasks;
  return [
    {
      kind: "resolvedLesson",
      enclosing: content,
      lessonId: body.lessonId,
      number: 1,
      title: body.title,
      lessonTasks: body.lessonTasks,
      tasks,
      completeDefinition:
        body.coverage === "lesson1-complete" &&
        body.lessonTasks.length === 6 &&
        tasks.length === 6,
    },
  ];
}
export function resolvedTask({
  content,
  taskId,
}: {
  content: RuntimePackage;
  taskId: TaskId;
}) {
  for (const lesson of resolvedLessons(content)) {
    const entry = lesson.tasks.find((entry) => entry.task.id === taskId);
    if (entry) return Object.freeze({ lesson, entry });
  }
  return null;
}
export function lessonForTask({
  content,
  taskId,
}: {
  content: RuntimePackage;
  taskId: TaskId;
}): LessonId {
  if (
    content.body.coverage === "partial-first-m" &&
    content.body.taskId === taskId
  )
    return content.body.lessonId;
  const resolved = resolvedTask({ content, taskId });
  if (!resolved) throw new Error("Task unavailable in exact package");
  return resolved.lesson.lessonId;
}
export function authoredTaskIdentity({
  content,
  taskId,
}: {
  content: RuntimePackage;
  taskId: TaskId;
}): string | null {
  const resolved = resolvedTask({ content, taskId });
  if (!resolved) return null;
  const metadata = resolved.lesson.lessonTasks.find(
    (task) => task.id === taskId,
  );
  if (!metadata) throw new Error("Task metadata missing");
  return canonical({
    version: 1,
    courseId: content.body.courseId,
    lessonId: resolved.lesson.lessonId,
    optional: metadata.optional,
    definition: resolved.entry,
  });
}
export async function parseRuntimePackage(
  input: unknown,
  hash: HashFunction,
): Promise<RuntimePackage> {
  if (!validateCumulativePackage(input))
    return parseDevelopmentPackage(input, hash);
  deepFreeze(input);
  if ((await hash(canonical(input.body))) !== input.packageHash)
    throw new Error("Cumulative content hash mismatch");
  const lessonIds = new Set<LessonId>(),
    taskIds = new Set<TaskId>();
  for (const [index, lesson] of input.body.lessons.entries()) {
    if (lessonIds.has(lesson.lessonId) || lesson.number !== index + 1)
      throw new Error("Cumulative lesson order is invalid");
    lessonIds.add(lesson.lessonId);
    const metadata = new Map(
      lesson.lessonTasks.map((task, index) => {
        if (taskIds.has(task.id) || task.number !== index + 1)
          throw new Error("Cumulative task order is invalid");
        taskIds.add(task.id);
        return [task.id, task] as const;
      }),
    );
    const seen = new Set<TaskId>();
    for (const entry of lesson.tasks) {
      const task = entry.task,
        item = metadata.get(task.id);
      if (
        !item ||
        seen.has(task.id) ||
        item.number !== task.number ||
        canonical(item.title) !== canonical(task.title) ||
        item.optional !== (entry.kind === "soundWritingV1")
      )
        throw new Error("Cumulative task membership is invalid");
      seen.add(task.id);
      switch (entry.kind) {
        case "printedGraphV1":
          compileTask(entry.task);
          break;
        case "graphControls":
          if (
            entry.task.nodes.some(
              (node) =>
                node.kind === "turn" && node.presentation.kind !== "oral",
            )
          )
            throw new Error("Writing requires explicit capability");
          compileControlTask(entry.task);
          break;
        case "soundWritingV1":
          compileWritingTask(entry.task);
          break;
        default: {
          const exhaustive: never = entry;
          throw new Error(String(exhaustive));
        }
      }
    }
  }
  return input;
}
export function cumulativeExtension({
  previous,
  candidate,
}: {
  previous: RuntimePackage;
  candidate: RuntimePackage;
}): boolean {
  if (
    candidate.body.coverage !== "course-development" ||
    previous.body.courseId !== candidate.body.courseId
  )
    return false;
  const next = resolvedLessons(candidate),
    before = resolvedLessons(previous);
  if (before.some((lesson, index) => lesson.lessonId !== next[index]?.lessonId))
    return false;
  return before.every((lesson) => {
    const newer = next.find((item) => item.lessonId === lesson.lessonId);
    if (
      !newer ||
      lesson.lessonTasks.some(
        (task, index) => task.id !== newer.lessonTasks[index]?.id,
      )
    )
      return false;
    return lesson.tasks.every(
      (entry) =>
        authoredTaskIdentity({ content: previous, taskId: entry.task.id }) ===
        authoredTaskIdentity({ content: candidate, taskId: entry.task.id }),
    );
  });
}
