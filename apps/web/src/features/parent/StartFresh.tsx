import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { prepareStartFresh } from "@readatthree/teaching";
import type { StartFreshCommand } from "@readatthree/teaching";
import { readStartFresh, startFresh } from "../../platform/store-reset.ts";
import { Button } from "../../components/ui/button.tsx";
import { AddedText } from "../teaching/CopyText.tsx";
import { ParentGate } from "./ParentScreens.tsx";

export function StartFresh({
  retained,
  disconnect,
  onClose,
}: {
  retained: { current: StartFreshCommand | null };
  disconnect(): void;
  onClose(): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const flight = useRef(false);
  const [granted, setGranted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const record = useQuery({
    queryKey: ["start-fresh"],
    queryFn: async () => {
      disconnect();
      return readStartFresh();
    },
    enabled: granted,
    networkMode: "always",
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  async function erase() {
    if (flight.current || !confirmed || (!record.data && !retained.current))
      return;
    flight.current = true;
    setBusy(true);
    try {
      if (!retained.current) {
        if (!record.data) return;
        retained.current = prepareStartFresh(record.data, crypto.randomUUID());
      }
      disconnect();
      await startFresh(retained.current);
      retained.current = null;
      setDone(true);
      setMessage(
        "The old saved work has been erased. Open a new reading store to begin setup.",
      );
    } catch {
      setMessage(
        "Start fresh could not be confirmed. Saved work may already have been erased. Retry the same action; reading stays paused while the reset is unfinished.",
      );
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-label="Start fresh"
      className="course-message"
      onCancel={(event) => {
        event.preventDefault();
        if (!flight.current) {
          if (done) window.location.assign("/");
          else onClose();
        }
      }}
    >
      {!granted ? (
        <ParentGate
          busy={false}
          initial={false}
          prompt="To review Start fresh, type the word meadow."
          onGrant={() => setGranted(true)}
          onReturn={onClose}
        />
      ) : (
        <section>
          <h2>
            <AddedText>Start fresh</AddedText>
          </h2>
          <p>
            <AddedText>
              This permanently erases all children’s reading progress, saved
              drawings, unfinished work and parent settings in this app on this
              device. Any unsaved work in this window is discarded. This cannot
              be undone. Lesson files may need to be installed again.
            </AddedText>
          </p>
          {message ? (
            <p role="status">
              <AddedText>{message}</AddedText>
            </p>
          ) : null}
          {done ? (
            <Button onClick={() => window.location.assign("/")}>
              <AddedText>Open new reading store</AddedText>
            </Button>
          ) : (
            <>
              {record.isPending ? (
                <p>
                  <AddedText>Checking recovery state…</AddedText>
                </p>
              ) : null}
              {record.isError ? (
                <p role="alert">
                  <AddedText>
                    Recovery state could not be checked. Keep other reading
                    windows closed and retry. No new reset can begin until this
                    check succeeds.
                  </AddedText>
                </p>
              ) : null}
              {record.data?.phase === "resetting" ? (
                <p>
                  <AddedText>
                    A previously confirmed Start fresh action is unfinished.
                    Continuing retries that same action.
                  </AddedText>
                </p>
              ) : null}
              <label>
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={busy}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                <AddedText>
                  Erase all children’s reading progress and drawings on this
                  device.
                </AddedText>
              </label>
              {record.isError ? (
                <Button disabled={busy} onClick={() => void record.refetch()}>
                  <AddedText>Retry checking recovery</AddedText>
                </Button>
              ) : null}
              <Button
                disabled={
                  busy || !confirmed || (!record.data && !retained.current)
                }
                onClick={() => void erase()}
              >
                <AddedText>
                  {busy
                    ? "Starting fresh…"
                    : retained.current
                      ? "Retry same Start fresh"
                      : "Erase saved work and start fresh"}
                </AddedText>
              </Button>
            </>
          )}
          {!done ? (
            <Button disabled={busy} onClick={onClose}>
              <AddedText>
                {retained.current || record.data?.phase === "resetting"
                  ? "Return to recovery"
                  : "Keep saved work"}
              </AddedText>
            </Button>
          ) : null}
        </section>
      )}
    </dialog>
  );
}
