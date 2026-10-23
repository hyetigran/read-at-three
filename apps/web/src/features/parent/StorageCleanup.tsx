import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { canonical, prepareStorageCleanup } from "@readatthree/teaching";
import type {
  SelectedOwnerWitness,
  StorageCleanupCommand,
  CacheCleanupCommand,
  StorageCleanupDrawing,
} from "@readatthree/teaching";
import type { BrowserTeachingClient } from "../../platform/teaching-client.ts";
import { hashText } from "../../platform/hash.ts";
import { Button } from "../../components/ui/button.tsx";
import { AddedText, CopyText } from "../teaching/CopyText.tsx";
import { Drawing } from "../course/CourseScreens.tsx";
import { CacheCleanup } from "./CacheCleanup.tsx";
import { ParentGate } from "./ParentScreens.tsx";

type Client = Pick<
  BrowserTeachingClient,
  | "readStorageCleanup"
  | "cleanupStorage"
  | "readWork"
  | "connectionTicket"
  | "isConnected"
  | "readCacheCleanup"
  | "cleanupCache"
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
    networkMode: "always",
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
  cacheRetained,
  recoverConnection,
  onClose,
}: {
  client: Client;
  selection: SelectedOwnerWitness;
  retained: { current: StorageCleanupCommand | null };
  cacheRetained: { current: CacheCleanupCommand | null } | undefined;
  recoverConnection(): Promise<void>;
  onClose(): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const flight = useRef(false);
  const [granted, setGranted] = useState(false);
  const [action, setAction] = useState<"drawings" | "downloads" | null>(null);
  const busy = action !== null;
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const view = useQuery({
    queryKey: ["storage-cleanup", client.connectionTicket(), selection],
    queryFn: () => client.readStorageCleanup({ selection }),
    enabled: granted,
    networkMode: "always",
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
    setAction("drawings");
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
      if (!client.isConnected()) await recoverConnection();
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
      setAction(null);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="storage-cleanup-dialog"
      aria-label="Manage saved files"
      onCancel={(event) => {
        event.preventDefault();
        if (!flight.current) onClose();
      }}
    >
      {!granted ? (
        <ParentGate
          busy={false}
          initial={false}
          prompt="To manage saved files, type the word meadow."
          onGrant={() => setGranted(true)}
          onReturn={onClose}
        />
      ) : (
        <section>
          <h2>
            <AddedText>Manage saved files</AddedText>
          </h2>
          {cacheRetained ? (
            <CacheCleanup
              client={client}
              retained={cacheRetained}
              busy={busy}
              onBusyChange={(value) => {
                flight.current = value;
                setAction(value ? "downloads" : null);
              }}
              ensureConnection={async () => {
                if (!client.isConnected()) await recoverConnection();
              }}
            />
          ) : null}
          <h3>
            <AddedText>Older drawings</AddedText>
          </h3>
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
                {action === "drawings"
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
