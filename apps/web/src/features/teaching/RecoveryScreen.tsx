import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { CommittedProjection } from "@readatthree/teaching";
import { Button } from "@/components/ui/button";
import { isTeachingViewport, subscribeViewport } from "@/platform/viewport";
import { AddedText } from "./CopyText";

type RecoveryFailure = Pick<
  Extract<CommittedProjection, { kind: "recovery" }>,
  "code" | "message"
>;

function recoveryTitle(code: string) {
  switch (code) {
    case "unsupported-store-format":
      return "Update the app to open saved work";
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

export function WindowRecovery({ busy }: { busy: boolean }) {
  return (
    <main className="teaching-screen teaching-centered" aria-busy={busy}>
      <RecoveryPanel title="Make room for reading">
        <p>
          <AddedText>
            Rotate your tablet to landscape or enlarge this window to continue.
            Teaching, drawing and pointing cues are paused. Your saved place is
            kept.
          </AddedText>
        </p>
      </RecoveryPanel>
    </main>
  );
}

export function RecoveryScreen({
  recovery,
  busy,
  onRetry,
  message = "Keep this reading window open and retry.",
}: {
  recovery: RecoveryFailure | null;
  busy: boolean;
  onRetry: () => void;
  message?: string | undefined;
}) {
  const supportedWindow = useSyncExternalStore(
    subscribeViewport,
    isTeachingViewport,
    () => false,
  );
  if (!supportedWindow) return <WindowRecovery busy={busy} />;
  return (
    <main className="teaching-screen teaching-centered" aria-busy={busy}>
      <RecoveryPanel
        title={
          recovery
            ? recoveryTitle(recovery.code)
            : busy
              ? "Opening your saved place…"
              : "Your saved place could not open safely."
        }
      >
        {recovery || !busy ? (
          <>
            <p>
              <AddedText>{recovery?.message ?? message}</AddedText>
            </p>
            <Button
              className="teaching-button teaching-retry"
              onClick={onRetry}
              disabled={busy}
            >
              <AddedText>{busy ? "Opening…" : "Retry opening"}</AddedText>
            </Button>
          </>
        ) : null}
      </RecoveryPanel>
    </main>
  );
}
