import {
  captureQueryPublication,
  historicalWorkQuery,
} from "@readatthree/react-integration";
import { useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Settings } from "lucide-react";
import {
  canonical,
  decodeInkPoints,
  visibleInkStrokes,
} from "@readatthree/teaching";
import type {
  ApplicationRead,
  CourseAction,
  CourseTask,
  HistoricalWork,
  SavedWork,
  SelectedOwnerWitness,
  ProfileSummary,
} from "@readatthree/teaching";
import { Button } from "@/components/ui/button";
import { AddedText, CopyText } from "@/features/teaching/CopyText";
import type { BrowserTeachingClient } from "@/platform/teaching-client";
import { ProfileButton } from "../parent/AnimalPortrait.tsx";
import meadow from "@/assets/meadow.svg";

type Ready = Extract<ApplicationRead, { kind: "ready" }>;
type Entry = (action: CourseAction) => void;
const positions = [
  [23, 75],
  [40, 55],
  [57, 69],
  [75, 49],
  [69, 27],
  [88, 17],
];
export function CourseHeader({
  title,
  back = "/",
  children,
  profile,
  onParents,
}: {
  profile?: ProfileSummary | undefined;
  onParents?: ((kind: "settings" | "profiles") => void) | undefined;
  title: React.ReactNode;
  back?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="course-header">
      <Link
        className="course-icon-button"
        to={back}
        aria-label="Back to lesson map"
      >
        <ArrowLeft aria-hidden="true" />
      </Link>
      <h1>{title}</h1>
      <div className="course-header-actions">
        {children}
        {profile && onParents ? (
          <ProfileButton
            profile={profile}
            onClick={() => onParents("profiles")}
          />
        ) : null}
        <Link
          className="course-icon-button"
          id="parent-settings"
          to="/parent/gate"
          onClick={(event) => {
            if (onParents) {
              event.preventDefault();
              onParents("settings");
            }
          }}
          aria-label="For parents"
        >
          <Settings aria-hidden="true" />
          <span className="sr-only">
            <AddedText>For parents</AddedText>
          </span>
        </Link>
      </div>
    </header>
  );
}
function Resume({ read, onEntry }: { read: Ready; onEntry: Entry }) {
  const resume = read.course.resume;
  if (resume.kind === "none") return null;
  const lesson = read.course.lessons.find(
    (lesson) => lesson.lessonId === resume.work.lessonId,
  );
  const task = lesson?.tasks.find((task) => task.id === resume.work.taskId);
  return (
    <div className="course-resume">
      <Button
        className="course-primary"
        onClick={() =>
          resume.kind === "unfinished" ? onEntry(resume.action) : undefined
        }
        asChild={resume.kind === "terminalUndoView"}
      >
        {resume.kind === "terminalUndoView" ? (
          <Link to="/teaching">
            <AddedText>Return to saved completion</AddedText>
          </Link>
        ) : (
          <AddedText>
            {task
              ? `Resume · Lesson ${lesson?.number ?? ""} · Task ${task.number}`
              : lesson
                ? `Resume saved activity · Lesson ${lesson.number}`
                : "Resume saved activity"}
          </AddedText>
        )}
      </Button>
      {task ? (
        <p>
          <CopyText copy={task.title} />
        </p>
      ) : null}
    </div>
  );
}
export function LessonMap({
  read,
  onEntry,
  busy,
  profile,
  onParents,
}: {
  read: Ready;
  onEntry: Entry;
  busy: boolean;
  profile?: ProfileSummary | undefined;
  onParents?: ((kind: "settings" | "profiles") => void) | undefined;
}) {
  return (
    <main
      className="course-screen course-map"
      aria-busy={busy}
      style={{ backgroundImage: `url(${meadow})` }}
    >
      <header className="course-map-header">
        <h1>
          <span className="course-brand-star" aria-hidden="true">
            ✦
          </span>
          <AddedText>read at three</AddedText>
        </h1>
        {profile && onParents ? (
          <ProfileButton
            profile={profile}
            disabled={busy}
            onClick={() => onParents("profiles")}
          />
        ) : null}
        <Link
          id="parent-settings"
          onClick={(event) => {
            if (onParents) {
              event.preventDefault();
              onParents("settings");
            }
          }}
          className="course-icon-button"
          to="/parent/gate"
          aria-label="For parents"
        >
          <Settings aria-hidden="true" />
          <span className="sr-only">
            <AddedText>For parents</AddedText>
          </span>
        </Link>
      </header>
      <nav className="course-map-lessons" aria-label="Lessons">
        {read.course.lessons.map((lesson, index) => {
          const position = positions[index] ?? positions[0];
          return (
            <Link
              key={lesson.lessonId}
              id={`lesson-${lesson.lessonId}`}
              to={`/lessons/${lesson.lessonId}`}
              className="course-pedestal"
              data-lesson-number={lesson.number}
              data-completed={lesson.progress === "satisfied"}
              style={{
                left:
                  index === 5
                    ? "min(88%, calc(100% - 150px))"
                    : `${position?.[0] ?? 23}%`,
                top: `${position?.[1] ?? 75}%`,
              }}
              aria-label={`Lesson ${lesson.number}${lesson.progress === "satisfied" ? ", completed" : ""}`}
            >
              <span className="course-pedestal-top">
                <AddedText>{lesson.number}</AddedText>
                {lesson.progress === "satisfied" ? (
                  <Check className="course-pedestal-check" aria-hidden="true" />
                ) : null}
              </span>
              <span className="sr-only">
                <AddedText>
                  {lesson.progress === "satisfied"
                    ? "Completed"
                    : "Not yet complete"}
                </AddedText>
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="course-map-bottom">
        <Resume read={read} onEntry={onEntry} />
        {read.course.resume.kind === "none" &&
        read.course.recommendation.kind === "task" ? (
          <Link
            className="course-recommendation"
            to={`/lessons/${read.course.recommendation.lessonId}`}
          >
            <AddedText>Recommended next activity</AddedText>
            <ArrowRight aria-hidden="true" />
          </Link>
        ) : null}
        {read.course.recommendation.kind === "contentBoundary" ? (
          <p className="course-recommendation">
            <AddedText>
              All installed lessons are complete. You can revisit any lesson.
            </AddedText>
          </p>
        ) : null}
      </div>
    </main>
  );
}
function ActivityArt({ task }: { task: CourseTask }) {
  const paper = (
    <rect x="31" y="13" width="64" height="60" rx="11" fill="white" />
  );
  const art = {
    printedSound: (
      <>
        {paper}
        <path
          d="m63 27 4 11 12 4-12 4-4 12-4-12-12-4 12-4Z"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="m108 16 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"
          fill="currentColor"
          stroke="none"
        />
      </>
    ),
    printedReview: (
      <>
        <rect
          x="20"
          y="26"
          width="56"
          height="49"
          rx="10"
          fill="white"
          opacity=".65"
          transform="rotate(-12 48 50)"
        />
        {paper}
        <path d="M74 34a15 15 0 1 0 2 18M74 25v12H62" />
      </>
    ),
    printedSlowFast: (
      <>
        <rect
          x="19"
          y="22"
          width="59"
          height="53"
          rx="9"
          fill="white"
          opacity=".65"
          transform="rotate(-11 48 48)"
        />
        {paper}
        <path d="M47 33h31M47 43h23M47 53h31" opacity=".55" />
      </>
    ),
    oralSounds: (
      <>
        <path
          d="M50 58c-12-3-17-12-17-25a25 25 0 0 1 50 0c0 17-15 17-16 29-1 9-5 14-12 14-5 0-9-3-10-7"
          fill="white"
        />
        <path d="M48 35c0-10 5-15 12-15s12 5 12 12c0 8-10 8-10 16M97 28q9 9 0 18M106 20q17 17 0 34" />
      </>
    ),
    oralBlending: (
      <>
        <path
          d="M13 24h27v28H28l-8 8v-8h-7ZM56 24h27v28H71l-8 8v-8h-7Z"
          fill="white"
        />
        <path d="M44 38h8M90 38h20m-7-7 7 7-7 7" />
        <path d="M22 71h53M33 79h42" opacity=".45" />
      </>
    ),
    parentPointing: (
      <>
        <rect x="13" y="24" width="42" height="45" rx="10" fill="white" />
        <rect x="74" y="24" width="42" height="45" rx="10" fill="white" />
        <path d="M45 45h39m-8-8 8 8-8 8" />
        <path d="M25 80h79" opacity=".4" />
      </>
    ),
    childPointing: (
      <>
        <rect x="26" y="11" width="57" height="52" rx="11" fill="white" />
        <circle cx="55" cy="34" r="11" opacity=".3" />
        <path
          d="M53 80 39 64c-5-6 1-12 6-8l6 5V35c0-7 11-7 11 0v19l8-4 17 8v16l-8 10"
          fill="#ffdfba"
        />
        <path d="M95 20h8M91 10l6-6M94 31l7 5" />
      </>
    ),
    rhyming: (
      <>
        <path d="M21 35q8-20 16 0t16 0t16 0" />
        <path d="M21 62q8-20 16 0t16 0t16 0" />
        <path d="M78 35h20M78 62h20M99 35q15 0 15 14t-15 13" />
        <circle cx="113" cy="49" r="6" fill="white" />
      </>
    ),
    writing: (
      <>
        <rect x="16" y="15" width="81" height="66" rx="11" fill="white" />
        <path d="M28 35h54M28 49h54M28 63h54" opacity=".3" />
        <path d="m56 62 39-44 13 12-39 44-17 5Z" fill="#ffd47d" />
        <path d="m91 23 13 12M56 62l13 12M52 79l4-17" />
      </>
    ),
  };
  return (
    <svg
      className="course-activity-art"
      viewBox="0 0 132 94"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {art[task.artKey]}
    </svg>
  );
}

export function menuEntryKey(location: { key: string; state: unknown }) {
  const state = location.state;
  return typeof state === "object" &&
    state !== null &&
    "menuEntryKey" in state &&
    typeof state.menuEntryKey === "string"
    ? state.menuEntryKey
    : location.key;
}
const menuMemory = new Map<string, { top: number; focus: string | null }>();
function WorkLinks({
  works,
  taskNumber,
}: {
  works: readonly SavedWork[];
  taskNumber: number;
}) {
  return (
    <details className="course-history">
      <summary>
        <AddedText>{`Saved work (${works.length})`}</AddedText>
      </summary>
      <ul>
        {works.map((work, index) => (
          <li key={work.runId}>
            <Link id={`work-${work.runId}`} to={`/work/${work.runId}`}>
              <AddedText>{`Task ${taskNumber} · ${work.status === "inProgress" ? "Unfinished" : work.status === "abandoned" ? "Earlier run" : work.status === "skipped" ? "Skipped" : "Completed"} · ${index + 1} · View read-only`}</AddedText>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
export function LessonMenu({
  read,
  onEntry,
  busy,
  profile,
  onParents,
  navigationLifetime,
}: {
  read: Ready;
  onEntry: Entry;
  busy: boolean;
  profile?: ProfileSummary | undefined;
  onParents?: ((kind: "settings" | "profiles") => void) | undefined;
  navigationLifetime?: string;
}) {
  const { lessonId } = useParams();
  const location = useLocation();
  const lesson = read.course.lessons.find(
    (lesson) => lesson.lessonId === lessonId,
  );
  const scroll = useRef<HTMLDivElement>(null);
  const entryKey = menuEntryKey(location);
  const identity = canonical([
    entryKey,
    navigationLifetime,
    lessonId,
    read.witness.owner,
    read.witness.activePackageHash,
  ]);
  const memory = useRef(identity);
  memory.current = identity;
  useLayoutEffect(() => {
    const element = scroll.current;
    if (!element) return;
    const saved = menuMemory.get(identity);
    element.scrollTop = saved?.top ?? 0;
    if (saved?.focus) {
      document.getElementById(saved.focus)?.focus({ preventScroll: true });
    }
    return () => {
      menuMemory.set(identity, {
        top: element.scrollTop,
        focus:
          document.activeElement instanceof HTMLElement
            ? document.activeElement.id ||
              menuMemory.get(identity)?.focus ||
              null
            : menuMemory.get(identity)?.focus || null,
      });
    };
  }, [identity]);
  if (!lesson) return <Unavailable title="Lesson unavailable" />;
  const recommended = read.course.recommendation;
  function entry(action: CourseAction) {
    const element = scroll.current;
    if (element)
      menuMemory.set(memory.current, {
        top: element.scrollTop,
        focus:
          document.activeElement instanceof HTMLElement
            ? document.activeElement.id || null
            : null,
      });
    onEntry(action);
  }
  return (
    <main className="course-screen course-menu" aria-busy={busy}>
      <CourseHeader
        title={<CopyText copy={lesson.title} />}
        profile={profile}
        onParents={onParents}
      />
      <div className="course-menu-scroll" ref={scroll} data-menu-scroll>
        <div className="course-menu-intro">
          <p>
            <AddedText>
              {lesson.progress === "satisfied"
                ? "Lesson complete · Revisit any activity"
                : "Choose an activity together"}
            </AddedText>
          </p>
          {read.course.resume.kind !== "none" &&
          read.course.resume.work.lessonId === lesson.lessonId ? (
            <Resume read={read} onEntry={entry} />
          ) : null}
        </div>
        <ol className="course-task-grid">
          {lesson.tasks.map((task) => (
            <li
              className={`course-task-module course-art-${task.artKey}`}
              key={task.id}
              data-task-number={task.number}
              data-available={task.availability === "ready"}
            >
              <div className="course-task-topline">
                <span className="course-task-number">
                  <AddedText>{`Task ${task.number}`}</AddedText>
                </span>
                {task.outcome !== "unseen" ? (
                  <span className="course-outcome">
                    <AddedText>
                      {task.outcome === "completed" ? "Completed" : "Skipped"}
                    </AddedText>
                  </span>
                ) : null}
              </div>
              <h2>
                <CopyText copy={task.title} />
              </h2>
              <p className="course-task-status">
                {task.optional ||
                (recommended.kind === "task" &&
                  recommended.taskId === task.id) ? (
                  <AddedText>
                    {task.optional ? "Optional writing" : "Recommended next"}
                  </AddedText>
                ) : null}
              </p>
              <div className="course-module-bottom">
                <ActivityArt task={task} />
                <div className="course-task-entry">
                  {task.availability === "missingTeaching" ? (
                    <span>
                      <AddedText>Teaching content not installed</AddedText>
                    </span>
                  ) : (
                    task.actions.map((action) => (
                      <Button
                        id={`task-${task.id}-${action.intent.kind}-${action.intent.sessionId ?? "new"}`}
                        key={canonical(action.intent)}
                        data-action={action.intent.kind}
                        className={`course-entry-button${task.actions.length === 1 ? " course-entry-single" : ""}`}
                        disabled={busy}
                        onClick={() => entry(action)}
                      >
                        <span
                          className={
                            task.actions.length === 1 ? "sr-only" : undefined
                          }
                        >
                          <CopyText copy={action.label} />
                        </span>
                        <ArrowRight aria-hidden="true" />
                      </Button>
                    ))
                  )}
                </div>
              </div>
              {task.history.length ? (
                <WorkLinks works={task.history} taskNumber={task.number} />
              ) : null}
            </li>
          ))}
        </ol>
        {lesson.tasks.length === 0 ? (
          <div className="course-legacy-entry">
            {read.projection.actions
              .filter(
                (action): action is CourseAction =>
                  action.intent.kind === "start" ||
                  action.intent.kind === "resume" ||
                  action.intent.kind === "replay" ||
                  action.intent.kind === "restart",
              )
              .map((action) => (
                <Button
                  key={canonical(action.intent)}
                  className="course-primary"
                  onClick={() => entry(action)}
                  disabled={busy}
                >
                  <CopyText copy={action.label} />
                </Button>
              ))}
          </div>
        ) : null}
        <p className="course-menu-note">
          <AddedText>
            Choose any installed activity. Opening a lesson does not mark
            earlier work complete.
          </AddedText>
        </p>
      </div>
    </main>
  );
}
export function Unavailable({
  title = "Saved activity unavailable",
}: {
  title?: string;
}) {
  return (
    <main className="course-screen">
      <CourseHeader title={<AddedText>{title}</AddedText>} />
      <section className="course-message">
        <p>
          <AddedText>
            This address cannot open teaching. Your saved work is preserved.
          </AddedText>
        </p>
        <Link className="course-primary" to="/">
          <AddedText>Return to lesson map</AddedText>
        </Link>
      </section>
    </main>
  );
}
function Drawing({
  document,
}: {
  document: HistoricalWork["documents"][number];
}) {
  const snapshot = document.snapshot;
  const visible = new Set(
    snapshot.histories.flatMap((history) =>
      visibleInkStrokes({ history, strokes: snapshot.strokes }),
    ),
  );
  return (
    <svg
      className="course-saved-drawing"
      viewBox={`0 0 ${snapshot.bounds.width} ${snapshot.bounds.height}`}
      role="img"
      aria-label="Saved handwriting, read-only"
    >
      {[
        snapshot.guides.top,
        snapshot.guides.midline,
        snapshot.guides.baseline,
      ].map((y) => (
        <line
          key={y}
          x1="0"
          x2={snapshot.bounds.width}
          y1={y}
          y2={y}
          stroke="#b7adbf"
          strokeDasharray={y === snapshot.guides.midline ? "8 8" : undefined}
        />
      ))}
      {snapshot.strokes
        .filter((stroke) => visible.has(stroke.strokeId))
        .map((stroke) => {
          const points = stroke.chunks.flatMap((chunk) =>
            decodeInkPoints({
              payload: Uint8Array.from(chunk.payload),
              pointCount: chunk.pointCount,
              bounds: snapshot.bounds,
            }),
          );
          const first = points[0];
          return (
            <g
              key={stroke.strokeId}
              opacity={stroke.layer === "model" ? 0.3 : 1}
            >
              {first &&
              points.every(
                (point) => point.x === first.x && point.y === first.y,
              ) ? (
                <circle
                  cx={first.x}
                  cy={first.y}
                  r={stroke.brush.width / 2}
                  fill="#211b46"
                />
              ) : (
                <polyline
                  points={points
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="#211b46"
                  strokeWidth={stroke.brush.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </g>
          );
        })}
    </svg>
  );
}
export function SavedWorkScreen({
  read,
  client,
  selection,
  profile,
  onParents,
}: {
  read: Ready;
  client: BrowserTeachingClient;
  selection: SelectedOwnerWitness;
  profile?: ProfileSummary | undefined;
  onParents?: ((kind: "settings" | "profiles") => void) | undefined;
}) {
  const queryClient = useQueryClient();
  const connection = client.connectionTicket();
  const checkPublication = captureQueryPublication(
    queryClient,
    selection.installationId,
  );
  const { runId } = useParams();
  const work = read.course.lessons
    .flatMap((lesson) => lesson.tasks.flatMap((task) => task.history))
    .find((work) => work.runId === runId);
  const result = useQuery({
    ...historicalWorkQuery({
      selection,
      connection,
      courseId: read.courseId,
      packageHash: work?.packageHash,
      runId,
    }),
    queryFn: async () => {
      if (!work) throw new Error("Saved work is unavailable.");
      checkPublication();
      const saved = await client.readWork({ selection, runId: work.runId });
      checkPublication();
      if (
        connection !== client.connectionTicket() ||
        canonical(saved.selection) !== canonical(selection)
      )
        throw new Error("Saved-work reading lifetime changed.");
      return saved.value;
    },
    enabled: !!work,
    networkMode: "always",
    retry: false,
    refetchOnWindowFocus: false,
  });
  if (!work) return <Unavailable />;
  return (
    <main className="course-screen course-saved">
      <CourseHeader
        title={<AddedText>Saved work · Read-only</AddedText>}
        back={`/lessons/${work.lessonId}`}
        profile={profile}
        onParents={onParents}
      />
      <section className="course-saved-content">
        {result.data ? (
          <>
            <h2>
              <CopyText copy={result.data.title} />
            </h2>
            <p>
              <AddedText>
                This saved work keeps its original lesson and drawings. Viewing
                it does not resume or change the activity.
              </AddedText>
            </p>
            {result.data.documents.length ? (
              result.data.documents.map((document) => (
                <figure key={document.target.id}>
                  <Drawing document={document} />
                  <figcaption>
                    <AddedText>
                      Original saved handwriting · Read-only
                    </AddedText>
                  </figcaption>
                </figure>
              ))
            ) : (
              <p>
                <AddedText>
                  No handwriting was recorded for this activity.
                </AddedText>
              </p>
            )}
          </>
        ) : result.error ? (
          <div role="alert">
            <p>
              <AddedText>
                Saved work could not be opened. Keep your work and retry.
              </AddedText>
            </p>
            <Button
              className="course-primary"
              onClick={() => void result.refetch()}
            >
              <AddedText>Retry</AddedText>
            </Button>
          </div>
        ) : (
          <p role="status">
            <AddedText>Opening saved work…</AddedText>
          </p>
        )}
      </section>
    </main>
  );
}
