import { PrintedBoardActivity } from "./PrintedBoardActivity";
import type {
  AvailableAction,
  CommittedProjection,
  Copy,
  GraphTurn,
  PrintedNode,
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
import { AddedText, CopyText, ParentSpanText } from "./CopyText";
import { SoundGlyph } from "./SoundGlyph";
import { WritingBoard } from "./WritingBoard";
import { RecoveryScreen, WindowRecovery } from "./RecoveryScreen";
import type { WritingController } from "@/platform/writing-controller";

type TeachingScreenProps = {
  projection: CommittedProjection;
  writingController: WritingController;
  correctionPreview: PrintedNode | ControlTurnNode | null;
  busy: boolean;
  saveError: string | null;
  onAction: (action: AvailableAction) => void;
  onReview: (
    input: Readonly<{ action: ReviewSelectionAction; choice: ReviewChoice }>,
  ) => void;
  onRetry: () => void;
  onOpenRetry: () => void;
  onLessonMenu?: () => void;
  lessonNumber?: number;
  inputSuspended?: boolean;
  parentAccess?: ReactNode;
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
  primary = action.intent.kind === "continue" ||
    action.intent.kind === "confirmTracing" ||
    action.intent.kind === "confirmIndependent",
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

function ScreenHeading({
  title,
  taskNumber,
  lessonNumber = 1,
  children,
}: {
  title: Copy;
  taskNumber: number | null;
  lessonNumber?: number;
  children?: ReactNode;
}) {
  return (
    <header className="teaching-header">
      <p className="teaching-location">
        <AddedText>
          {taskNumber
            ? `Lesson ${lessonNumber} · Task ${taskNumber}`
            : `Lesson ${lessonNumber}`}
        </AddedText>
      </p>
      <h1>
        <CopyText copy={title} />
      </h1>
      <div className="teaching-header-actions">{children}</div>
    </header>
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
  TeachingNode | GraphTurn | PrintedNode | ControlTurn | ControlTurnNode;

const parentRoleLabels = {
  model: "Parent models",
  together: "Parent and child together",
  listen: "Child responds",
} satisfies Record<DisplayedTurn["parentRole"], string>;

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
      <ParentSpanText span={span} />
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
    actions.find(
      (action) =>
        action.intent.kind === "confirmTracing" ||
        action.intent.kind === "confirmIndependent",
    ) ??
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
  retireCue,
  onAction,
}: {
  turn: DisplayedTurn;
  preview: boolean;
  actions: readonly AvailableAction[];
  completed: boolean;
  disabled: boolean;
  cueKey: string;
  retireCue: import("react").RefObject<() => void>;
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
  const board =
    "presentation" in turn && turn.presentation.kind === "printedBoard"
      ? turn.presentation
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
                  ? `Correction · ${parentRoleLabels[turn.parentRole]}`
                  : routeKind === "correctionRetest"
                    ? `Retest · ${parentRoleLabels[turn.parentRole]}`
                    : routeKind === "repeat"
                      ? `Extra practice · ${parentRoleLabels[turn.parentRole]}`
                      : "extraPractice" in turn && turn.extraPractice
                        ? `Extra practice · ${parentRoleLabels[turn.parentRole]}`
                        : parentRoleLabels[turn.parentRole]}
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
          {board?.cue.kind === "endpointSweep" &&
          board.cue.preparation === "parentControlledStartHold" ? (
            <p>
              <AddedText>
                Hold the first ball while you get ready. Release to sweep to the
                arrow end.
              </AddedText>
            </p>
          ) : null}
        </div>
      </section>
      <section
        className="teaching-arena"
        aria-label={oral ? "Oral practice" : "Sound practice"}
        data-presentation={board ? "printedBoard" : oral ? "oral" : "printed"}
      >
        {board ? (
          <PrintedBoardActivity
            key={cueKey}
            presentation={board}
            disabled={disabled || preview}
            retire={retireCue}
          />
        ) : (
          <div className="teaching-target">
            {"glyph" in turn ? (
              <SoundGlyph glyph={turn.glyph} />
            ) : (
              <OralTarget />
            )}
          </div>
        )}
        {board ? null : oral ? (
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

function WritingActivity({
  projection,
  controller,
  disabled,
  onAction,
}: {
  projection: Extract<
    CommittedProjection,
    { kind: "writing" | "writingResult" }
  >;
  controller: WritingController;
  disabled: boolean;
  onAction: TeachingScreenProps["onAction"];
}) {
  const guidance = useRef<HTMLDivElement>(null);
  const controls = useSyncExternalStore(
    controller.practiceControls.subscribe,
    controller.practiceControls.getSnapshot,
  );
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  const toolsReady =
    !disabled && state.practiceControlsReady && controls.kind === "editable";
  const turn = projection.kind === "writing" ? projection.turn : null;
  useEffect(() => {
    if (guidance.current) guidance.current.scrollTop = 0;
  }, [turn?.id, projection.checkpointId]);
  const primary = mainAction(projection.actions);
  const phase =
    turn?.presentation.kind === "writing" ? turn.presentation.obligation : null;
  const heading =
    projection.kind === "writingResult"
      ? projection.outcome === "skipped"
        ? "Optional writing skipped"
        : "Writing task complete"
      : phase?.kind === "modelAndSound" || phase?.kind === "parentModel"
        ? "Parent demonstrates"
        : phase?.kind === "phaseConfirmation"
          ? phase.phase === "childTracing"
            ? "Child traces · Parent confirms"
            : "Child writes · Parent confirms"
          : "Child responds";
  return (
    <>
      <section className="teaching-parent-panel" aria-label="Parent guidance">
        <div className="teaching-parent-heading">
          <AddedText>{heading}</AddedText>
          <AddedText>Parent only</AddedText>
        </div>
        <div
          ref={guidance}
          className="teaching-parent-content"
          data-guidance="oral"
          tabIndex={0}
        >
          {turn ? (
            <TurnGuidance turn={turn} />
          ) : (
            <p>
              <AddedText>
                {projection.kind === "writingResult" &&
                projection.outcome === "skipped"
                  ? "Your drawings are kept. This optional task was skipped; it was not completed."
                  : "The parent confirmed both tracing and independent practice for each sound. Your drawings are kept. Completion records the teaching delivered."}
              </AddedText>
            </p>
          )}
        </div>
      </section>
      <section
        className="teaching-arena teaching-writing-arena"
        aria-label="Sound writing"
        data-presentation="writing"
      >
        <WritingBoard controller={controller} disabled={disabled} />
        <nav className="teaching-parent-controls" aria-label="Parent controls">
          <div className="teaching-navigation-actions">
            {projection.actions
              .filter(
                (action) => action.intent.kind === "back" || action === primary,
              )
              .map((action) => (
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
            {projection.actions
              .filter((action) => action.intent.kind === "repeat")
              .map((action) => (
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
        <div className="teaching-writing-footer">
          <div
            className="teaching-writing-tools"
            role="group"
            aria-label="Practice ink tools"
          >
            <Button
              className="teaching-button"
              variant="outline"
              disabled={!toolsReady || !controls.undo}
              onClick={() => controller.editPractice({ kind: "inkUndo" })}
            >
              <AddedText>Undo ink</AddedText>
            </Button>
            <Button
              className="teaching-button"
              variant="outline"
              disabled={!toolsReady || !controls.redo}
              onClick={() => controller.editPractice({ kind: "inkRedo" })}
            >
              <AddedText>Redo ink</AddedText>
            </Button>
            <Button
              className="teaching-button"
              variant="outline"
              disabled={!toolsReady || !controls.clear}
              onClick={() => controller.editPractice({ kind: "clearPractice" })}
            >
              <AddedText>Clear practice</AddedText>
            </Button>
          </div>
          {projection.actions
            .filter((action) => action.intent.kind === "skipWriting")
            .map((action) => (
              <ProjectedAction
                key={actionKey(action)}
                action={action}
                disabled={disabled}
                primary={false}
                onAction={onAction}
              />
            ))}
        </div>
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
  writingController,
  correctionPreview,
  busy,
  saveError,
  onAction,
  onReview,
  onRetry,
  onOpenRetry,
  onLessonMenu,
  lessonNumber = 1,
  inputSuspended = false,
  parentAccess,
}: TeachingScreenProps) {
  const supportedWindow = useSyncExternalStore(
    subscribeViewport,
    isTeachingViewport,
    () => false,
  );
  const [cueGeneration, setCueGeneration] = useState(0);
  const retireCue = useRef<() => void>(() => {});
  const disabled =
    busy || saveError !== null || correctionPreview !== null || inputSuspended;
  function act(action: AvailableAction) {
    retireCue.current();
    setCueGeneration((generation) => generation + 1);
    onAction(action);
  }
  const saveStatus = (
    <SaveStatus busy={busy} saveError={saveError} onRetry={onRetry} />
  );
  if (!supportedWindow) return <WindowRecovery busy={busy} />;
  if (projection.kind === "recovery")
    return (
      <RecoveryScreen recovery={projection} busy={busy} onRetry={onOpenRetry} />
    );
  if (
    (projection.kind === "teaching" ||
      projection.kind === "reviewSelection" ||
      projection.kind === "writing" ||
      projection.kind === "writingResult") &&
    projection.sessionStatus !== "paused"
  ) {
    const displayedTurn =
      projection.kind === "teaching" || projection.kind === "writing"
        ? (correctionPreview ?? projection.turn)
        : null;
    const undo = projection.actions.find(
      (action) => action.intent.kind === "undoAdvance",
    );
    const pause = projection.actions.filter(
      (action) => action.intent.kind === "pause",
    );
    return (
      <main
        className={`teaching-screen teaching-active${projection.kind === "teaching" && "presentation" in projection.turn && projection.turn.presentation.kind === "printedBoard" ? " teaching-printed-board" : ""}${projection.kind === "writing" || projection.kind === "writingResult" ? " teaching-writing" : ""}`}
        aria-busy={busy}
        data-turn-id={
          displayedTurn?.id ??
          (projection.kind === "reviewSelection"
            ? projection.reviewId
            : undefined)
        }
        data-committed-turn-id={
          projection.kind === "teaching" || projection.kind === "writing"
            ? projection.turn.id
            : projection.kind === "reviewSelection"
              ? projection.reviewId
              : undefined
        }
        data-context={correctionPreview ? "uncommitted" : "committed"}
        data-checkpoint-id={projection.checkpointId ?? undefined}
        data-run-status={projection.runStatus}
      >
        <ScreenHeading
          title={projection.title}
          taskNumber={projection.taskNumber}
          lessonNumber={lessonNumber}
        >
          {parentAccess}
          <div className="teaching-undo-slot">
            {undo ? (
              <ProjectedAction
                action={undo}
                disabled={disabled}
                primary={false}
                onAction={act}
              />
            ) : null}
          </div>
          {pause.map((action) => (
            <ProjectedAction
              key={actionKey(action)}
              action={action}
              disabled={disabled}
              onAction={act}
            />
          ))}
          {onLessonMenu ? (
            <Button
              className="teaching-button teaching-catalog-toggle"
              onClick={() => {
                setCueGeneration((generation) => generation + 1);
                retireCue.current();
                onLessonMenu();
              }}
              disabled={busy}
            >
              <AddedText>Activities</AddedText>
            </Button>
          ) : null}
        </ScreenHeading>
        {projection.kind === "writing" ||
        projection.kind === "writingResult" ? (
          <WritingActivity
            projection={projection}
            controller={writingController}
            disabled={disabled}
            onAction={act}
          />
        ) : projection.kind === "teaching" && displayedTurn !== null ? (
          <TeachingActivity
            key={JSON.stringify([
              projection.owner.profileId,
              projection.owner.generation,
              projection.sessionId,
              projection.runId,
            ])}
            retireCue={retireCue}
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
            disabled={disabled}
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
            disabled={disabled}
            onAction={act}
            onReview={(request) => {
              setCueGeneration((generation) => generation + 1);
              onReview(request);
            }}
          />
        ) : null}
        {saveStatus}
      </main>
    );
  }
  return (
    <main className="teaching-screen teaching-entry" aria-busy={busy}>
      <ScreenHeading
        title={projection.title}
        taskNumber={projection.kind === "entry" ? null : projection.taskNumber}
        lessonNumber={lessonNumber}
      >
        {parentAccess}
      </ScreenHeading>
      {projection.kind !== "entry" ? (
        <section className="teaching-session-summary" aria-live="polite">
          <h2>
            <AddedText>
              {projection.runStatus === "skipped"
                ? "Optional task skipped"
                : projection.runStatus === "completed"
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
              .filter(
                (action) =>
                  !("taskId" in action.intent) ||
                  action.intent.taskId === projection.taskId,
              )
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
      {onLessonMenu ? (
        <Button className="teaching-button" onClick={onLessonMenu}>
          <AddedText>Activities</AddedText>
        </Button>
      ) : null}
      {saveStatus}
    </main>
  );
}
