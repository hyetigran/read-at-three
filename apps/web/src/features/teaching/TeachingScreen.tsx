import type {
  CommittedProjection,
  Copy,
  TeachingNode,
} from "@readatthree/teaching";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { isTeachingViewport, subscribeViewport } from "@/platform/viewport";
import { AddedText, CopyText } from "./CopyText";

type TeachingScreenProps = {
  projection: CommittedProjection;
  busy: boolean;
  saveError: string | null;
  onAdvance: () => void;
  onRetry: () => void;
  onOpenRetry: () => void;
};

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

function ScreenHeading({ title }: { title: Copy }) {
  return (
    <header className="teaching-header">
      <p className="teaching-location">
        <AddedText>Lesson 1 · Task 1</AddedText>
      </p>
      <h1>
        <CopyText copy={title} />
      </h1>
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
  durationMs,
}: {
  disabled: boolean;
  durationMs: number;
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
    if (disabled || cue.kind === "idle" || cue.kind === "minimum-held") return;
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
          : durationMs;
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
  }, [cue, disabled, durationMs]);

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
            ? `Cue holding · ${Math.ceil(durationMs / 1000)} s minimum`
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
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
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

function TeachingActivity({
  turn,
  disabled,
  onAdvance,
}: {
  turn: TeachingNode;
  disabled: boolean;
  onAdvance: () => void;
}) {
  return (
    <>
      <section className="teaching-parent-panel" aria-label="Parent guidance">
        <div className="teaching-parent-heading">
          <AddedText>
            {turn.parentRole === "model" ? "Parent models" : "Child responds"}
          </AddedText>
          <AddedText>Parent only</AddedText>
        </div>
        <div className="teaching-parent-content" tabIndex={0}>
          <p className="teaching-action">
            <span className="teaching-copy-label">
              <AddedText>Do</AddedText>
            </span>
            <CopyText copy={turn.parentAction} />
          </p>
          <p className="teaching-spoken">
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
        </div>
      </section>
      <section className="teaching-arena" aria-label="Sound practice">
        <div className="teaching-target">
          <svg
            className="teaching-glyph"
            viewBox="0 0 310 250"
            role="img"
            aria-label={turn.glyph}
          >
            <path d="M35 220V80h42v20c12-16 27-24 46-24 24 0 40 10 49 29 14-19 31-29 52-29 37 0 56 24 56 63v81h-42v-77c0-19-8-29-23-29-19 0-30 13-30 33v73h-42v-77c0-19-8-29-23-29-19 0-33 13-33 33v73Z" />
          </svg>
        </div>
        <SilentCue disabled={disabled} durationMs={turn.cue.durationMs} />
        <nav className="teaching-parent-controls" aria-label="Parent controls">
          <Button
            className="teaching-button teaching-continue"
            onClick={onAdvance}
            disabled={disabled}
          >
            <svg viewBox="0 0 36 36" aria-hidden="true">
              <path d="M8 18h20M20 9l9 9-9 9" />
            </svg>
            <AddedText>Continue</AddedText>
          </Button>
        </nav>
      </section>
    </>
  );
}

export function TeachingScreen({
  projection,
  busy,
  saveError,
  onAdvance,
  onRetry,
  onOpenRetry,
}: TeachingScreenProps) {
  const supportedWindow = useSyncExternalStore(
    subscribeViewport,
    isTeachingViewport,
    () => false,
  );

  if (!supportedWindow) {
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
  }

  switch (projection.kind) {
    case "entry":
      return (
        <main className="teaching-screen teaching-entry">
          <ScreenHeading title={projection.title} />
          <section className="teaching-entry-card">
            <p>
              <AddedText>Read together · Parent-led sound practice</AddedText>
            </p>
            <h2>
              <CopyText copy={projection.title} />
            </h2>
            <Button
              className="teaching-button teaching-start"
              onClick={onAdvance}
              disabled={busy || saveError !== null}
            >
              <AddedText>Start</AddedText>
              <svg viewBox="0 0 36 36" aria-hidden="true">
                <path d="M8 18h20M20 9l9 9-9 9" />
              </svg>
            </Button>
          </section>
          <SaveStatus busy={busy} saveError={saveError} onRetry={onRetry} />
        </main>
      );
    case "teaching":
      return (
        <main className="teaching-screen teaching-active" aria-busy={busy}>
          <ScreenHeading title={projection.title} />
          <TeachingActivity
            key={JSON.stringify([
              projection.owner.profileId,
              projection.owner.generation,
              projection.sessionId,
              projection.runId,
              projection.turn.id,
            ])}
            turn={projection.turn}
            disabled={busy || saveError !== null}
            onAdvance={onAdvance}
          />
          <SaveStatus busy={busy} saveError={saveError} onRetry={onRetry} />
        </main>
      );
    case "frontier":
      return (
        <main className="teaching-screen teaching-entry">
          <ScreenHeading title={projection.title} />
          <section
            className="teaching-frontier"
            aria-labelledby="frontier-heading"
          >
            <h2 id="frontier-heading">
              <AddedText>Your place is saved</AddedText>
            </h2>
            <p>
              <AddedText>
                This task is still in progress. The next required teaching turn
                is not installed yet.
              </AddedText>
            </p>
          </section>
          <SaveStatus busy={busy} saveError={saveError} onRetry={onRetry} />
        </main>
      );
    case "recovery":
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
    default: {
      const exhaustive: never = projection;
      return exhaustive;
    }
  }
}
