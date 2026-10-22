import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { canonical, prepareStorageCleanup } from "@readatthree/teaching";
import type {
  SelectedOwnerWitness,
  StorageCleanupCommand,
  StorageCleanupDrawing,
} from "@readatthree/teaching";
import type { BrowserTeachingClient } from "../../platform/teaching-client.ts";
import { hashText } from "../../platform/hash.ts";
import { Button } from "../../components/ui/button.tsx";
import { AddedText, CopyText } from "../teaching/CopyText.tsx";
import { Drawing } from "../course/CourseScreens.tsx";
import { ParentGate } from "./ParentScreens.tsx";

type Client = Pick<
  BrowserTeachingClient,
  "readStorageCleanup" | "cleanupStorage" | "readWork" | "connectionTicket"
>;
function DrawingChoice({
  client,
  selection,
  drawing,
  checked,
  disabled,
  onChange,
}: {
  client: Client;
  selection: SelectedOwnerWitness;
  drawing: StorageCleanupDrawing;
  checked: boolean;
  disabled: boolean;
  onChange(): void;
}) {
  const work = useQuery({
    queryKey: [
      "cleanup-preview",
      client.connectionTicket(),
      selection,
      drawing.token,
    ],
    queryFn: () => client.readWork({ selection, runId: drawing.token.runId }),
    retry: false,
  });
  const document = work.data?.value.documents.find(
    (entry) =>
      entry.target.id === drawing.token.targetId && !entry.snapshot.removed,
  );
  return (
    <label className="cleanup-drawing">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled || !document}
        onChange={onChange}
      />
      <span>
        <AddedText>Remove this older drawing</AddedText>{" "}
        <AddedText>
          ({Math.ceil(drawing.pointBytes / 1024)} KB of points)
        </AddedText>
      </span>
      {work.data ? <CopyText copy={work.data.value.title} /> : null}
      {document ? (
        <Drawing document={document} />
      ) : (
        <AddedText>
          {work.isError
            ? "Preview is unavailable. This drawing cannot be selected."
            : "Loading saved drawing…"}
        </AddedText>
      )}
    </label>
  );
}
export function StorageCleanup({
  client,
  selection,
  retained,
  onClose,
}: {
  client: Client;
  selection: SelectedOwnerWitness;
  retained: { current: StorageCleanupCommand | null };
  onClose(): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const flight = useRef(false);
  const [granted, setGranted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const view = useQuery({
    queryKey: ["storage-cleanup", client.connectionTicket(), selection],
    queryFn: () => client.readStorageCleanup({ selection }),
    enabled: granted,
    retry: false,
    staleTime: 0,
  });
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  async function remove() {
    if (flight.current || (!view.data && !retained.current) || done) return;
    flight.current = true;
    setBusy(true);
    try {
      if (!retained.current) {
        if (!view.data) return;
        retained.current = await prepareStorageCleanup({
          view: view.data,
          drawings: view.data.drawings.filter((drawing) =>
            chosen.has(drawing.token.documentId),
          ),
          ids: () => crypto.randomUUID(),
          hash: hashText,
        });
      }
      await client.cleanupStorage(retained.current);
      retained.current = null;
      setDone(true);
      setMessage(
        "The selected older drawing bytes were removed. Completion credit is still saved. Return to reading and retry the pending save.",
      );
    } catch {
      setMessage(
        "Cleanup could not be confirmed. Your pending reading save and unsaved drawing are still waiting. Retry this same cleanup or return to reading.",
      );
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="storage-cleanup-dialog"
      aria-label="Remove older drawings"
      onCancel={(event) => {
        event.preventDefault();
        if (!flight.current) onClose();
      }}
    >
      {!granted ? (
        <ParentGate
          busy={false}
          initial={false}
          prompt="To manage older saved drawings, type the word meadow."
          onGrant={() => setGranted(true)}
          onReturn={onClose}
        />
      ) : (
        <section>
          <h2>
            <AddedText>Remove older drawings</AddedText>
          </h2>
          <p>
            <AddedText>
              Choose older drawings to remove permanently. Completion credit and
              lesson files stay saved. Current work and drawings protected by
              Undo are excluded. This does not save the drawing still waiting in
              reading.
            </AddedText>
          </p>
          {message ? (
            <p role="status">
              <AddedText>{message}</AddedText>
            </p>
          ) : null}
          {!done && !retained.current ? (
            <>
              {view.isError ? (
                <p role="alert">
                  <AddedText>
                    Older drawings could not be checked. Keep this window open
                    and retry.
                  </AddedText>
                </p>
              ) : null}
              {view.isPending ? (
                <p>
                  <AddedText>Checking saved drawings…</AddedText>
                </p>
              ) : null}
              {view.data?.drawings.length === 0 ? (
                <p>
                  <AddedText>
                    No older drawings can be safely removed.
                  </AddedText>
                </p>
              ) : null}
              {view.data?.drawings.map((drawing) => (
                <DrawingChoice
                  key={drawing.token.documentId}
                  client={client}
                  selection={selection}
                  drawing={drawing}
                  checked={chosen.has(drawing.token.documentId)}
                  disabled={busy}
                  onChange={() =>
                    setChosen((previous) => {
                      const next = new Set(previous);
                      if (next.has(drawing.token.documentId))
                        next.delete(drawing.token.documentId);
                      else next.add(drawing.token.documentId);
                      return next;
                    })
                  }
                />
              ))}
            </>
          ) : null}
          {view.isError && !retained.current ? (
            <Button disabled={busy} onClick={() => void view.refetch()}>
              <AddedText>Retry checking drawings</AddedText>
            </Button>
          ) : null}
          {!done ? (
            <Button
              disabled={
                busy ||
                (!retained.current && !chosen.size) ||
                (!view.data && !retained.current)
              }
              onClick={() => void remove()}
            >
              <AddedText>
                {busy
                  ? "Removing…"
                  : retained.current
                    ? "Retry same cleanup"
                    : "Permanently remove selected drawings"}
              </AddedText>
            </Button>
          ) : null}
          <Button disabled={busy} onClick={onClose}>
            <AddedText>Return to reading</AddedText>
          </Button>
        </section>
      )}
    </dialog>
  );
}
