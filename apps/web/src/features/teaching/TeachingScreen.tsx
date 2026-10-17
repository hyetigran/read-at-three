import type {
  AvailableAction,
  CatalogTask,
  CommittedProjection,
  Copy,
  GraphTurn,
  GraphNode,
  TeachingNode,
  ControlTurn,
  ControlTurnNode,
  ParentSpan,
  ItemId,
  ReviewChoice,
  ReviewSelectionAction,
} from "@readatthree/teaching";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { isTeachingViewport, subscribeViewport } from "@/platform/viewport";
import { AddedText, CopyText } from "./CopyText";
import { SoundGlyph } from "./SoundGlyph";

type TeachingScreenProps = {
  projection: CommittedProjection;
  correctionPreview: GraphNode | ControlTurnNode | null;
  busy: boolean;
  saveError: string | null;
  onAction: (action: AvailableAction) => void;
  onReview: (
    input: Readonly<{ action: ReviewSelectionAction; choice: ReviewChoice }>,
  ) => void;
  onRetry: () => void;
  onOpenRetry: () => void;
};

type ActionProps = {
  action: AvailableAction;
  disabled: boolean;
  onAction: TeachingScreenProps["onAction"];
  primary?: boolean;
};

function actionKey(action: AvailableAction) {
  const intent = action.intent;
  if ("taskId" in intent)
    return `${intent.kind}:${intent.taskId}:${intent.sessionId ?? "new"}`;
  return intent.kind === "help"
    ? `${intent.kind}:${intent.correctionId}`
    : intent.kind;
}

function ProjectedAction({
  action,
  disabled,
  onAction,
  primary = action.intent.kind === "continue",
}: ActionProps) {
  const direction =
    action.intent.kind === "back" ? "up" : primary ? "down" : null;
  return (
    <ActionButton
      label={action.label}
      actionKind={action.intent.kind}
      direction={direction}
      primary={primary}
      disabled={disabled}
      onActivate={() => onAction(action)}
    />
  );
}

function ActionButton({
  label,
  actionKind,
  direction,
  primary,
  disabled,
  onActivate,
}: {
  label: Copy;
  actionKind: string;
  direction: "up" | "down" | null;
  primary: boolean;
  disabled: boolean;
  onActivate: () => void;
}) {
  return (
    <Button
      className={`teaching-button teaching-action teaching-action-${actionKind}${primary ? " teaching-continue" : ""}`}
      data-action={actionKind}
      onClick={(event) => {
        if (disabled || event.detail > 1) return;
        onActivate();
      }}
      onKeyDown={(event) => {
        if (
          (disabled || event.repeat) &&
          (event.key === "Enter" || event.key === " ")
        )
          event.preventDefault();
      }}
      aria-disabled={disabled}
    >
      {direction ? (
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <path
            d={direction === "up" ? "M9 23 18 14 27 23" : "M9 14 18 23 27 14"}
          />
        </svg>
      ) : null}
      <CopyText copy={label} />
    </Button>
  );
}

function recoveryTitle(code: string) {
  switch (code) {
    case "missing-package":
    case "content-missing":
      return "Teaching content is missing";
    case "storage-recovery":
    case "unsupported-storage":
    case "storage-unavailable":
    case "storage-initialization-failed":
      return "Saved storage is unavailable";
    case "storage-busy":
      return "Storage is open in another window";
    case "worker-lost":
      return "The storage connection was interrupted";
    case "invalid-position":
      return "Your saved place needs attention";
    default:
      return "Reading is paused";
  }
}

function ScreenHeading({
  title,
  taskNumber,
  children,
}: {
  title: Copy;
  taskNumber: number | null;
  children?: ReactNode;
}) {
  return (
    <header className="teaching-header">
      <p className="teaching-location">
        <AddedText>
          {taskNumber ? `Lesson 1 · Task ${taskNumber}` : "Lesson 1"}
        </AddedText>
      </p>
      <h1>
        <CopyText copy={title} />
      </h1>
      <div className="teaching-header-actions">{children}</div>
    </header>
  );
}

function RecoveryPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="teaching-recovery" aria-labelledby="recovery-heading">
      <h1 id="recovery-heading">
        <AddedText>{title}</AddedText>
      </h1>
      {children}
    </section>
  );
}

function SaveStatus({
  busy,
  saveError,
  onRetry,
}: Pick<TeachingScreenProps, "busy" | "saveError" | "onRetry">) {
  return (
    <footer className="teaching-save-area" aria-live="polite">
      {saveError ? (
        <div className="teaching-save-error" role="alert">
          <p>
            <AddedText>{saveError}</AddedText>
          </p>
          <Button
            className="teaching-button teaching-retry"
            onClick={onRetry}
            disabled={busy}
          >
            <AddedText>{busy ? "Retrying…" : "Retry save"}</AddedText>
          </Button>
        </div>
      ) : busy ? (
        <p className="teaching-saving">
          <AddedText>Saving…</AddedText>
        </p>
      ) : null}
    </footer>
  );
}

function CatalogDialog({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="teaching-catalog-dialog"
      aria-label="Lesson activities"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <Button
        autoFocus
        className="teaching-button teaching-close-catalog"
        onClick={onClose}
      >
        <AddedText>Return to activity</AddedText>
      </Button>
      {children}
    </dialog>
  );
}

function TaskCatalog({
  catalog,
  actions,
  disabled,
  onAction,
}: {
  catalog: readonly CatalogTask[];
  actions: readonly AvailableAction[];
  disabled: boolean;
  onAction: TeachingScreenProps["onAction"];
}) {
  return (
    <section className="teaching-catalog" aria-label="Lesson activities">
      <h2>
        <AddedText>Lesson 1 activities</AddedText>
      </h2>
      {catalog.length ? (
        <ol className="teaching-task-list">
          {catalog.map((task) => {
            const taskActions = actions.filter(
              (action) =>
                "taskId" in action.intent && action.intent.taskId === task.id,
            );
            return (
              <li
                key={task.id}
                data-task-number={task.number}
                data-available={task.available}
              >
                <span className="teaching-task-number">
                  <AddedText>{task.number}</AddedText>
                </span>
                <div className="teaching-task-description">
                  <h3>
                    <CopyText copy={task.title} />
                  </h3>
                  <p>
                    <AddedText>
                      {!task.available
                        ? "Teaching content not installed"
                        : task.completed
                          ? "Completed"
                          : task.savedSessionId
                            ? "Saved activity"
                            : "Available"}
                      {task.optional ? " · Optional" : ""}
                    </AddedText>
                  </p>
                </div>
                <div className="teaching-task-actions">
                  {taskActions.map((action) => (
                    <ProjectedAction
                      key={actionKey(action)}
                      action={action}
                      disabled={disabled}
                      onAction={onAction}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="teaching-entry-actions">
          {actions.map((action) => (
            <ProjectedAction
              key={actionKey(action)}
              action={action}
              disabled={disabled}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type CueState =
  | { kind: "idle" }
  | {
      kind: "start" | "moving" | "holding" | "minimum-held";
      startedAt: number;
    };
const cueStartMs = 250;
const cueMovementMs = 150;

function SilentCue({
  disabled,
  minimumMs,
}: {
  disabled: boolean;
  minimumMs: number | null;
}) {
  const [cue, setCue] = useState<CueState>({ kind: "idle" });
  const stage = disabled ? "idle" : cue.kind;
  function release() {
    setCue({ kind: "idle" });
  }
  function begin() {
    if (disabled) return;
    const startedAt = performance.now();
    setCue((current) =>
      current.kind === "idle" ? { kind: "start", startedAt } : current,
    );
  }
  useEffect(() => {
    if (
      disabled ||
      cue.kind === "idle" ||
      cue.kind === "minimum-held" ||
      (cue.kind === "holding" && minimumMs === null)
    )
      return;
    const nextKind =
      cue.kind === "start"
        ? "moving"
        : cue.kind === "moving"
          ? "holding"
          : "minimum-held";
    const duration =
      cue.kind === "start"
        ? cueStartMs
        : cue.kind === "moving"
          ? cueMovementMs
          : (minimumMs ?? 0);
    const timer = window.setTimeout(
      () => {
        const startedAt = performance.now();
        setCue((current) =>
          current === cue ? { kind: nextKind, startedAt } : current,
        );
      },
      Math.max(0, cue.startedAt + duration - performance.now()),
    );
    return () => window.clearTimeout(timer);
  }, [cue, disabled, minimumMs]);
  useEffect(() => {
    function clear() {
      setCue({ kind: "idle" });
    }
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, []);
  useEffect(() => {
    if (disabled) setCue({ kind: "idle" });
  }, [disabled]);
  const label =
    stage === "idle"
      ? "Hold silent cue"
      : stage === "start"
        ? "Cue at first ball"
        : stage === "moving"
          ? "Cue moving"
          : stage === "holding"
            ? minimumMs === null
              ? "Cue holding"
              : `Cue holding · ${Math.ceil(minimumMs / 1000)} s minimum`
            : "Cue minimum reached";
  return (
    <Button
      className="teaching-cue"
      variant="ghost"
      disabled={disabled}
      aria-label="Hold silent pointing cue"
      aria-pressed={stage !== "idle"}
      data-held={stage !== "idle"}
      data-stage={stage}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        event.currentTarget.setPointerCapture(event.pointerId);
        begin();
      }}
      onPointerUp={(event) => {
        release();
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onBlur={release}
      onKeyDown={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        if (!event.repeat) begin();
      }}
      onKeyUp={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        release();
      }}
    >
      <svg className="teaching-cue-art" viewBox="0 0 680 72" aria-hidden="true">
        <path d="M30 40H641m-16-11 19 11-19 11" />
        <circle className="teaching-cue-ball" cx="30" cy="40" r="10" />
        <circle className="teaching-cue-ball" cx="340" cy="55" r="8" />
        <circle className="teaching-cue-hold" cx="0" cy="0" r="25" />
      </svg>
      <span className="teaching-cue-label" aria-live="polite">
        <AddedText>{label}</AddedText>
      </span>
    </Button>
  );
}

type DisplayedTurn =
  TeachingNode | GraphTurn | GraphNode | ControlTurn | ControlTurnNode;

function GuidanceSpans({ guidance }: { guidance: readonly ParentSpan[] }) {
  return guidance.map((span, index) => (
    <p className={`teaching-guidance teaching-${span.kind}`} key={index}>
      <span className="teaching-copy-label">
        <AddedText>
          {span.kind === "action"
            ? "Do"
            : span.kind === "speech"
              ? "Say"
              : span.kind === "praise"
                ? "Praise"
                : "Listen for"}
        </AddedText>
      </span>
      <CopyText copy={span.copy} />
    </p>
  ));
}

function OralTarget() {
  return (
    <svg
      className="teaching-listening-art"
      viewBox="0 0 200 200"
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="81" fill="#f5d9d5" />
      <path
        d="M77 121q-22-7-22-34a45 45 0 0 1 90 0c0 28-24 28-25 47q0 21-21 21-17 0-20-14"
        fill="none"
        stroke="#b78290"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M78 95q-2-27 22-27t20 26q-2 12-15 15"
        stroke="#b78290"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function mainAction(actions: readonly AvailableAction[]) {
  return (
    actions.find((action) => action.intent.kind === "parentReady") ??
    actions.find((action) => action.intent.kind === "confirmReviewItem") ??
    actions.find((action) => action.intent.kind === "continue")
  );
}

function TurnGuidance({ turn }: { turn: DisplayedTurn }) {
  if ("guidance" in turn) return <GuidanceSpans guidance={turn.guidance} />;
  return (
    <>
      <p className="teaching-action">
        <span className="teaching-copy-label">
          <AddedText>Do</AddedText>
        </span>
        <CopyText copy={turn.parentAction} />
      </p>
      <p className="teaching-speech">
        <span className="teaching-copy-label">
          <AddedText>Say</AddedText>
        </span>
        <CopyText copy={turn.spoken} />
      </p>
      <p className="teaching-expected">
        <span className="teaching-copy-label">
          <AddedText>
            {turn.parentRole === "model" ? "Model sound" : "Listen for"}
          </AddedText>
        </span>
        <CopyText copy={turn.expected} />
      </p>
    </>
  );
}

function TeachingActivity({
  turn,
  preview,
  actions,
  completed,
  disabled,
  cueKey,
  onAction,
}: {
  turn: DisplayedTurn;
  preview: boolean;
  actions: readonly AvailableAction[];
  completed: boolean;
  disabled: boolean;
  cueKey: string;
  onAction: TeachingScreenProps["onAction"];
}) {
  const guidance = useRef<HTMLDivElement>(null);
  const checkpointId = "checkpointId" in turn ? turn.checkpointId : null;
  useEffect(() => {
    if (guidance.current) guidance.current.scrollTop = 0;
  }, [turn.id, checkpointId]);
  const minimumMs =
    "cue" in turn
      ? "minimumMs" in turn.cue
        ? turn.cue.minimumMs
        : turn.cue.durationMs
      : null;
  const oral = "presentation" in turn && turn.presentation.kind === "oral";
  const primary = mainAction(actions);
  const routeKind = "routeKind" in turn ? turn.routeKind : "normal";
  const navigation = actions.filter(
    (action) => action.intent.kind === "back" || action === primary,
  );
  const support = actions.filter(
    (action) =>
      action.intent.kind === "repeat" ||
      action.intent.kind === "help" ||
      (action.intent.kind === "continue" && action !== primary),
  );
  return (
    <>
      <section className="teaching-parent-panel" aria-label="Parent guidance">
        <div className="teaching-parent-heading">
          <AddedText>
            {preview
              ? "Correction preview · Not saved"
              : completed
                ? "Completed task · Reviewing saved context"
                : routeKind === "correction" ||
                    routeKind === "correctionInstruction"
                  ? "Correction · Follow the source retest"
                  : routeKind === "correctionRetest"
                    ? "Retest"
                    : routeKind === "repeat"
                      ? "Extra practice · Return to the saved turn afterward"
                      : "extraPractice" in turn && turn.extraPractice
                        ? "Extra practice"
                        : turn.parentRole === "model"
                          ? "Parent models"
                          : "Child responds"}
          </AddedText>
          <AddedText>Parent only</AddedText>
        </div>
        <div
          ref={guidance}
          className="teaching-parent-content"
          data-guidance={oral ? "oral" : "printed"}
          tabIndex={0}
        >
          <TurnGuidance turn={turn} />
        </div>
      </section>
      <section
        className="teaching-arena"
        aria-label={oral ? "Oral practice" : "Sound practice"}
        data-presentation={oral ? "oral" : "printed"}
      >
        <div className="teaching-target">
          {"glyph" in turn ? <SoundGlyph glyph={turn.glyph} /> : <OralTarget />}
        </div>
        {oral ? (
          <div className="teaching-cue teaching-oral-cue" aria-hidden="true" />
        ) : (
          <SilentCue key={cueKey} disabled={disabled} minimumMs={minimumMs} />
        )}
        <nav className="teaching-parent-controls" aria-label="Parent controls">
          <div className="teaching-navigation-actions">
            {navigation.map((action) => (
              <ProjectedAction
                key={actionKey(action)}
                action={action}
                disabled={disabled}
                primary={action === primary}
                onAction={onAction}
              />
            ))}
          </div>
          <div className="teaching-support-actions">
            {support.map((action) => (
              <ProjectedAction
                key={actionKey(action)}
                action={action}
                disabled={disabled}
                primary={false}
                onAction={onAction}
              />
            ))}
          </div>
        </nav>
      </section>
    </>
  );
}

type ReviewProjection = Extract<
  CommittedProjection,
  { kind: "reviewSelection" }
>;

function ReviewSelectionActivity({
  projection,
  disabled,
  onAction,
  onReview,
}: {
  projection: ReviewProjection;
  disabled: boolean;
  onAction: TeachingScreenProps["onAction"];
  onReview: TeachingScreenProps["onReview"];
}) {
  const savedChoice = projection.committedChoice;
  const [selected, setSelected] = useState<readonly ItemId[]>(() =>
    savedChoice?.kind === "items" ? savedChoice.itemIds : [],
  );
  const saved = savedChoice !== null;
  return (
    <>
      <section className="teaching-parent-panel" aria-label="Parent guidance">
        <div className="teaching-parent-heading">
          <AddedText>
            {saved ? "Saved review selection" : "Choose words to review"}
          </AddedText>
          <AddedText>Parent only</AddedText>
        </div>
        <div
          className="teaching-parent-content"
          data-guidance="oral"
          tabIndex={0}
        >
          <GuidanceSpans guidance={projection.guidance} />
          <fieldset
            className="teaching-review-choices"
            aria-label="Words to review"
          >
            {projection.items.map((item) => (
              <label className="teaching-review-choice" key={item.itemId}>
                <input
                  type="checkbox"
                  data-review-item={item.itemId}
                  checked={selected.includes(item.itemId)}
                  disabled={disabled || saved}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    setSelected((current) =>
                      checked
                        ? [...current, item.itemId]
                        : current.filter((id) => id !== item.itemId),
                    );
                  }}
                />
                <CopyText copy={item.label} />
              </label>
            ))}
          </fieldset>
        </div>
      </section>
      <section
        className="teaching-arena"
        aria-label="Oral practice"
        data-presentation="oral"
      >
        <div className="teaching-target">
          <OralTarget />
        </div>
        <div className="teaching-cue teaching-oral-cue" aria-hidden="true" />
        <nav className="teaching-parent-controls" aria-label="Parent controls">
          <div className="teaching-navigation-actions">
            {projection.actions
              .filter(
                (action) =>
                  action.intent.kind === "back" ||
                  action.intent.kind === "continue",
              )
              .map((action) => (
                <ProjectedAction
                  key={actionKey(action)}
                  action={action}
                  disabled={disabled}
                  onAction={onAction}
                />
              ))}
            {!saved ? (
              <ActionButton
                label={projection.selectionAction.selectLabel}
                actionKind="commitReviewSelection"
                direction="down"
                primary
                disabled={disabled || selected.length === 0}
                onActivate={() =>
                  onReview({
                    action: projection.selectionAction,
                    choice: { kind: "items", itemIds: [...selected] },
                  })
                }
              />
            ) : null}
          </div>
          {!saved ? (
            <div className="teaching-support-actions">
              <ActionButton
                label={projection.selectionAction.emptyLabel}
                actionKind="confirmEmptyReview"
                direction={null}
                primary={false}
                disabled={disabled || selected.length !== 0}
                onActivate={() =>
                  onReview({
                    action: projection.selectionAction,
                    choice: { kind: "none" },
                  })
                }
              />
            </div>
          ) : null}
        </nav>
      </section>
    </>
  );
}

export function TeachingScreen({
  projection,
  correctionPreview,
  busy,
  saveError,
  onAction,
  onReview,
  onRetry,
  onOpenRetry,
}: TeachingScreenProps) {
  const supportedWindow = useSyncExternalStore(
    subscribeViewport,
    isTeachingViewport,
    () => false,
  );
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [cueGeneration, setCueGeneration] = useState(0);
  const disabled = busy || saveError !== null || correctionPreview !== null;
  function act(action: AvailableAction) {
    setCueGeneration((generation) => generation + 1);
    setCatalogOpen(false);
    onAction(action);
  }
  const saveStatus = (
    <SaveStatus busy={busy} saveError={saveError} onRetry={onRetry} />
  );
  if (!supportedWindow)
    return (
      <main className="teaching-screen teaching-centered">
        <RecoveryPanel title="Make room for reading">
          <p>
            <AddedText>
              Rotate your tablet to landscape or enlarge this window to
              continue. Teaching and pointing cues are paused. Your saved place
              is kept.
            </AddedText>
          </p>
        </RecoveryPanel>
      </main>
    );
  if (projection.kind === "recovery")
    return (
      <main className="teaching-screen teaching-centered">
        <RecoveryPanel title={recoveryTitle(projection.code)}>
          <p>
            <AddedText>{projection.message}</AddedText>
          </p>
          <Button
            className="teaching-button teaching-retry"
            onClick={onOpenRetry}
            disabled={busy}
          >
            <AddedText>{busy ? "Opening…" : "Retry opening"}</AddedText>
          </Button>
        </RecoveryPanel>
      </main>
    );
  const catalog = (
    <TaskCatalog
      catalog={projection.catalog}
      actions={projection.actions}
      disabled={disabled}
      onAction={act}
    />
  );
  if (
    (projection.kind === "teaching" || projection.kind === "reviewSelection") &&
    projection.sessionStatus !== "paused"
  ) {
    const displayedTurn =
      projection.kind === "teaching"
        ? (correctionPreview ?? projection.turn)
        : null;
    const pause = projection.actions.filter(
      (action) => action.intent.kind === "pause",
    );
    return (
      <main
        className="teaching-screen teaching-active"
        aria-busy={busy}
        data-turn-id={
          displayedTurn?.id ??
          (projection.kind === "reviewSelection"
            ? projection.reviewId
            : undefined)
        }
        data-committed-turn-id={
          projection.kind === "teaching"
            ? projection.turn.id
            : projection.reviewId
        }
        data-context={correctionPreview ? "uncommitted" : "committed"}
        data-checkpoint-id={projection.checkpointId ?? undefined}
        data-run-status={projection.runStatus}
      >
        <ScreenHeading
          title={projection.title}
          taskNumber={projection.taskNumber}
        >
          {pause.map((action) => (
            <ProjectedAction
              key={actionKey(action)}
              action={action}
              disabled={disabled}
              onAction={act}
            />
          ))}
          {projection.catalog.length ? (
            <Button
              className="teaching-button teaching-catalog-toggle"
              onClick={() => {
                setCueGeneration((generation) => generation + 1);
                setCatalogOpen(true);
              }}
              disabled={disabled}
              aria-haspopup="dialog"
            >
              <AddedText>Activities</AddedText>
            </Button>
          ) : null}
        </ScreenHeading>
        {projection.kind === "teaching" && displayedTurn !== null ? (
          <TeachingActivity
            key={JSON.stringify([
              projection.owner.profileId,
              projection.owner.generation,
              projection.sessionId,
              projection.runId,
            ])}
            cueKey={JSON.stringify([
              projection.owner.profileId,
              projection.owner.generation,
              projection.sessionId,
              projection.runId,
              projection.checkpointId,
              projection.revision,
              projection.turn.id,
              cueGeneration,
            ])}
            turn={displayedTurn}
            preview={correctionPreview !== null}
            actions={projection.actions}
            completed={projection.runStatus === "completed"}
            disabled={disabled || catalogOpen}
            onAction={act}
          />
        ) : projection.kind === "reviewSelection" ? (
          <ReviewSelectionActivity
            key={JSON.stringify([
              projection.owner.profileId,
              projection.owner.generation,
              projection.sessionId,
              projection.runId,
              projection.reviewId,
            ])}
            projection={projection}
            disabled={disabled || catalogOpen}
            onAction={act}
            onReview={(request) => {
              setCueGeneration((generation) => generation + 1);
              onReview(request);
            }}
          />
        ) : null}
        {saveStatus}
        {catalogOpen ? (
          <CatalogDialog onClose={() => setCatalogOpen(false)}>
            {catalog}
          </CatalogDialog>
        ) : null}
      </main>
    );
  }
  return (
    <main className="teaching-screen teaching-entry" aria-busy={busy}>
      <ScreenHeading
        title={projection.title}
        taskNumber={projection.kind === "entry" ? null : projection.taskNumber}
      />
      {projection.kind !== "entry" ? (
        <section className="teaching-session-summary" aria-live="polite">
          <h2>
            <AddedText>
              {projection.runStatus === "completed"
                ? "Task complete"
                : projection.sessionStatus === "paused"
                  ? "Reading is paused"
                  : "Your place is saved"}
            </AddedText>
          </h2>
          <p>
            <AddedText>
              {projection.runStatus === "completed"
                ? "Review the saved context or replay this task in a new run."
                : projection.sessionStatus === "paused"
                  ? "Resume to return to the exact saved turn."
                  : "This earlier activity is still in progress. Its next required turn is not installed. Start the full task separately when available."}
            </AddedText>
          </p>
          <div className="teaching-entry-actions">
            {projection.actions
              .filter((action) => !("taskId" in action.intent))
              .map((action) => (
                <ProjectedAction
                  key={actionKey(action)}
                  action={action}
                  disabled={disabled}
                  onAction={act}
                />
              ))}
          </div>
        </section>
      ) : null}
      {catalog}
      {saveStatus}
    </main>
  );
}
