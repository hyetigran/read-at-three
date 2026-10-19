import {
  validateApplicationRead,
  validateHistoricalWork,
} from "./generated-validators.js";
import { parseProjection } from "./content.ts";
import { canonical } from "./identity.ts";
import { validateInkChunks } from "./ink.ts";
import { evaluateInkHistory } from "./ink-history.ts";
import { deepFreeze, parseCounter } from "./identity.ts";
import { resolvedLessons } from "./course-content.ts";
import type { ActivityArtKey } from "./course-content.ts";
import type { InstalledTeaching } from "./installed-teaching.ts";
import type {
  AvailableAction,
  CommitReceipt,
  CommittedProjection,
  Copy,
  Counter,
  CourseId,
  InkSnapshot,
  LessonId,
  LessonTask,
  Owner,
  PackageHash,
  RunId,
  SessionId,
  StoredContext,
  StoredSession,
  TaskId,
  TeachingIntent,
  WritingTarget,
} from "./index.ts";
export type CourseReadTarget =
  | Readonly<{ kind: "cursor" }>
  | Readonly<{ kind: "accepted"; receipt: CommitReceipt }>;
export type CourseWitness = Readonly<{
  owner: Owner;
  profileRevision: Counter;
  activePackageHash: PackageHash;
  activationRevision: Counter;
  cursorRevision: Counter;
  selectedSessionRevision: Counter | null;
}>;
export type CourseAction = AvailableAction &
  Readonly<{
    intent: Extract<
      TeachingIntent,
      { kind: "start" | "resume" | "restart" | "replay" }
    >;
  }>;
export type SavedWork = Readonly<{
  sessionId: SessionId;
  runId: RunId;
  packageHash: PackageHash;
  lessonId: LessonId;
  taskId: TaskId;
  lastSelectedSequence: Counter;
  status: "inProgress" | "completed" | "skipped" | "abandoned";
}>;
export type CourseTask = LessonTask &
  Readonly<{
    artKey: ActivityArtKey;
    availability: "ready" | "missingTeaching";
    outcome: "unseen" | "completed" | "skipped";
    actions: readonly CourseAction[];
    unfinished: readonly SavedWork[];
    history: readonly SavedWork[];
  }>;
export type CourseProjection = Readonly<{
  lessons: readonly Readonly<{
    lessonId: LessonId;
    number: number;
    title: Copy;
    tasks: readonly CourseTask[];
    progress: "unfinished" | "satisfied";
  }>[];
  resume:
    | Readonly<{ kind: "none" }>
    | Readonly<{ kind: "unfinished"; work: SavedWork; action: CourseAction }>
    | Readonly<{ kind: "terminalUndoView"; work: SavedWork }>;
  recommendation:
    | Readonly<{ kind: "contentBoundary" }>
    | Readonly<{ kind: "task"; lessonId: LessonId; taskId: TaskId }>;
}>;
export type ApplicationRead =
  | Extract<CommittedProjection, { kind: "recovery" }>
  | Readonly<{
      kind: "ready";
      courseId: CourseId;
      witness: CourseWitness;
      course: CourseProjection;
      projection: Exclude<CommittedProjection, { kind: "recovery" }>;
    }>;
export type HistoricalWork = Readonly<{
  kind: "work";
  summary: SavedWork;
  title: Copy;
  documents: readonly Readonly<{
    access: "readOnly";
    target: WritingTarget;
    snapshot: Omit<InkSnapshot, "token" | "writable">;
  }>[];
}>;
export interface CourseApplication {
  readApplication(target: CourseReadTarget): Promise<ApplicationRead>;
  readWork(input: { owner: Owner; runId: RunId }): Promise<HistoricalWork>;
}
export function savedWork(session: StoredSession): SavedWork {
  return {
    sessionId: session.sessionId,
    runId: session.runId,
    packageHash: session.packageHash,
    lessonId: session.lessonId,
    taskId: session.taskId,
    lastSelectedSequence: session.lastSelectedSequence ?? parseCounter("0"),
    status: session.runStatus,
  };
}
export function courseProjection({
  active,
  context,
  actions,
}: {
  active: InstalledTeaching;
  context: StoredContext;
  actions: readonly AvailableAction[];
}): CourseProjection {
  const entries: CourseAction[] = [];
  for (const action of actions)
    if (
      action.intent.kind === "start" ||
      action.intent.kind === "resume" ||
      action.intent.kind === "restart" ||
      action.intent.kind === "replay"
    )
      entries.push({ ...action, intent: action.intent });
  const history = context.history ?? context.sessions.map(savedWork);
  const lessons = resolvedLessons(active.document).map((lesson) => ({
    lessonId: lesson.lessonId,
    number: lesson.number,
    title: lesson.title,
    tasks: lesson.lessonTasks.map((task): CourseTask => {
      const definition = lesson.tasks.find(
          (entry) => entry.task.id === task.id,
        ),
        outcome =
          context.taskResults.find((result) => result.taskId === task.id)
            ?.outcome ?? "unseen";
      const authoredArt =
        active.body.coverage === "course-development" ||
        active.body.coverage === "course-development-v2" ||
        active.body.coverage === "course-development-v3" ||
        active.body.coverage === "course-development-v4"
          ? active.body.lessons
              .find((item) => item.lessonId === lesson.lessonId)
              ?.lessonTasks.find((item) => item.id === task.id)?.artKey
          : null;
      if (
        (active.body.coverage === "course-development" ||
          active.body.coverage === "course-development-v2" ||
          active.body.coverage === "course-development-v3" ||
          active.body.coverage === "course-development-v4") &&
        !authoredArt
      )
        throw new Error("Required activity art mapping is missing");
      const artKey: ActivityArtKey =
        authoredArt ??
        (definition?.kind === "soundWritingV1" ||
        definition?.kind === "writingPracticePlanV2" ||
        definition?.kind === "writingPracticePlanV3"
          ? "writing"
          : definition?.kind === "printedGraphV1"
            ? "printedSound"
            : "oralSounds");
      return {
        ...task,
        artKey,
        availability: definition ? "ready" : "missingTeaching",
        outcome,
        actions: entries.filter((action) => action.intent.taskId === task.id),
        unfinished: history
          .filter(
            (work) => work.taskId === task.id && work.status === "inProgress",
          )
          .sort((a, b) =>
            BigInt(a.lastSelectedSequence) > BigInt(b.lastSelectedSequence)
              ? -1
              : BigInt(a.lastSelectedSequence) < BigInt(b.lastSelectedSequence)
                ? 1
                : a.sessionId.localeCompare(b.sessionId),
          ),
        history: history.filter((work) => work.taskId === task.id),
      };
    }),
    progress: context.lessonResults?.some(
      (result) => result.lessonId === lesson.lessonId,
    )
      ? ("satisfied" as const)
      : ("unfinished" as const),
  }));
  const current =
    "cursorSession" in context ? context.cursorSession : context.session;
  let resume: CourseProjection["resume"] = { kind: "none" };
  if (current?.runStatus === "inProgress") {
    const action =
      entries.find(
        (action) =>
          action.intent.kind === "resume" &&
          action.intent.sessionId === current.sessionId,
      ) ??
      ({
        label: { kind: "added", text: "Resume" },
        intent: {
          kind: "resume",
          taskId: current.taskId,
          packageHash: current.packageHash,
          sessionId: current.sessionId,
        },
      } satisfies CourseAction);
    resume = { kind: "unfinished", work: savedWork(current), action };
  } else if (current && current.runId === context.undoRunId)
    resume = { kind: "terminalUndoView", work: savedWork(current) };
  let recommendation: CourseProjection["recommendation"] = {
    kind: "contentBoundary",
  };
  for (const lesson of lessons) {
    if (lesson.progress === "satisfied") continue;
    const task = lesson.tasks.find(
      (task) =>
        task.outcome !== "completed" &&
        !(task.optional && task.outcome === "skipped"),
    );
    if (task) {
      recommendation = {
        kind: "task",
        lessonId: lesson.lessonId,
        taskId: task.id,
      };
      break;
    }
  }
  return deepFreeze({ lessons, resume, recommendation });
}

export function parseApplicationRead(input: unknown): ApplicationRead {
  if (!validateApplicationRead(input))
    throw new Error("Committed application envelope is invalid");
  if (input.kind === "recovery") return deepFreeze(input);
  const projection = parseProjection(input.projection);
  if (
    projection.kind === "recovery" ||
    canonical(input.witness.owner) !== canonical(projection.owner) ||
    input.witness.profileRevision !== projection.profileRevision ||
    input.witness.selectedSessionRevision !==
      (projection.kind === "entry" ? null : projection.revision)
  )
    throw new Error("Committed application witness does not match teaching");
  for (const counter of [
    input.witness.owner.generation,
    input.witness.profileRevision,
    input.witness.activationRevision,
    input.witness.cursorRevision,
  ])
    parseCounter(counter);
  const lessonIds = new Set<LessonId>(),
    taskIds = new Set<TaskId>();
  for (const [index, lesson] of input.course.lessons.entries()) {
    if (lesson.number !== index + 1 || lessonIds.has(lesson.lessonId))
      throw new Error("Course lesson order is invalid");
    lessonIds.add(lesson.lessonId);
    for (const [taskIndex, task] of lesson.tasks.entries()) {
      if (
        task.number < 1 ||
        (taskIndex > 0 &&
          task.number <= (lesson.tasks[taskIndex - 1]?.number ?? 0)) ||
        taskIds.has(task.id) ||
        (task.outcome === "skipped" && !task.optional)
      )
        throw new Error("Course task order or outcome is invalid");
      taskIds.add(task.id);
      for (const work of [...task.history, ...task.unfinished]) {
        parseCounter(work.lastSelectedSequence);
        if (work.taskId !== task.id || work.lessonId !== lesson.lessonId)
          throw new Error("Saved work is attached to a different task");
      }
      if (
        task.unfinished.some(
          (work) =>
            work.status !== "inProgress" ||
            !task.history.some(
              (history) => canonical(history) === canonical(work),
            ),
        )
      )
        throw new Error("Unfinished work is not retained history");
      for (const action of task.actions) {
        if (
          action.intent.taskId !== task.id ||
          ((action.intent.kind === "start" ||
            action.intent.kind === "restart" ||
            action.intent.kind === "replay") &&
            (task.availability !== "ready" ||
              action.intent.packageHash !== input.witness.activePackageHash))
        )
          throw new Error("Course entry capability is invalid");
        if (
          action.intent.kind === "resume" &&
          !task.unfinished.some(
            (work) =>
              work.sessionId === action.intent.sessionId &&
              work.packageHash === action.intent.packageHash,
          )
        )
          throw new Error("Resume capability has no exact saved destination");
        if (
          !projection.actions.some(
            (published) => canonical(published) === canonical(action),
          )
        )
          throw new Error(
            "Course action was not published by teaching authority",
          );
      }
    }
  }
  if (
    input.course.recommendation.kind === "task" &&
    !input.course.lessons.some(
      (lesson) =>
        input.course.recommendation.kind === "task" &&
        lesson.lessonId === input.course.recommendation.lessonId &&
        lesson.tasks.some(
          (task) =>
            input.course.recommendation.kind === "task" &&
            task.id === input.course.recommendation.taskId,
        ),
    )
  )
    throw new Error("Recommendation is outside the course");
  const resume = input.course.resume;
  if (resume.kind !== "none") {
    parseCounter(resume.work.lastSelectedSequence);
    if (
      resume.kind === "unfinished" &&
      (resume.work.status !== "inProgress" ||
        resume.action.intent.kind !== "resume" ||
        resume.action.intent.sessionId !== resume.work.sessionId ||
        resume.action.intent.packageHash !== resume.work.packageHash ||
        resume.action.intent.taskId !== resume.work.taskId)
    )
      throw new Error(
        "Course Resume does not identify its exact saved delivery",
      );
    if (
      resume.kind === "terminalUndoView" &&
      resume.work.status !== "completed" &&
      resume.work.status !== "skipped"
    )
      throw new Error("Terminal Resume is not terminal");
  }
  return deepFreeze(input);
}
export function parseHistoricalWork(input: unknown): HistoricalWork {
  if (!validateHistoricalWork(input))
    throw new Error("Historical work schema is invalid");
  parseCounter(input.summary.lastSelectedSequence);
  const targets = new Set<string>();
  for (const document of input.documents) {
    const { target, snapshot } = document;
    if (
      targets.has(target.id) ||
      canonical(snapshot.sourceRefs) !== canonical(target.sourceRefs) ||
      snapshot.bounds.width !== target.logicalWidth ||
      snapshot.bounds.height !== target.logicalHeight ||
      canonical(snapshot.guides) !== canonical(target.guides) ||
      snapshot.boardY !== target.boardY ||
      !(
        target.guides.top >= 0 &&
        target.guides.top < target.guides.midline &&
        target.guides.midline < target.guides.baseline &&
        target.guides.baseline <= target.logicalHeight
      )
    )
      throw new Error("Historical writing guide changed");
    targets.add(target.id);
    parseCounter(snapshot.nextStrokeOrder);
    if (
      new Set(snapshot.strokes.map((stroke) => stroke.strokeId)).size !==
        snapshot.strokes.length ||
      new Set(snapshot.strokes.map((stroke) => stroke.strokeOrder)).size !==
        snapshot.strokes.length
    )
      throw new Error("Historical stroke identity is duplicated");
    for (const stroke of snapshot.strokes) {
      parseCounter(stroke.strokeOrder);
      if (
        BigInt(stroke.strokeOrder) >= BigInt(snapshot.nextStrokeOrder) ||
        validateInkChunks({ chunks: stroke.chunks, bounds: snapshot.bounds })
          .pointCount !== stroke.pointCount ||
        (stroke.status !== "capturing" && stroke.pointCount === 0)
      )
        throw new Error("Historical stroke geometry is invalid");
    }
    if (new Set(snapshot.histories.map((history) => history.layer)).size !== 3)
      throw new Error("Historical layer set changed");
    for (const history of snapshot.histories) {
      for (const value of [
        history.baseSeq,
        history.cursorSeq,
        history.tipSeq,
        history.nextOpSeq,
      ])
        parseCounter(value);
      evaluateInkHistory({ history, strokes: snapshot.strokes });
    }
  }
  return deepFreeze(input);
}
