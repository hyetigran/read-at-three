import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseCacheCleanupCommand } from "@readatthree/teaching";
import type { CacheCleanupCommand } from "@readatthree/teaching";
import type { BrowserTeachingClient } from "../../platform/teaching-client.ts";
import { Button } from "../../components/ui/button.tsx";
import { AddedText } from "../teaching/CopyText.tsx";

type Client = Pick<
  BrowserTeachingClient,
  "readCacheCleanup" | "cleanupCache" | "connectionTicket"
>;

export function CacheCleanup({
  client,
  retained,
  busy,
  onBusyChange,
  ensureConnection,
}: {
  client: Client;
  retained: { current: CacheCleanupCommand | null };
  busy: boolean;
  onBusyChange(value: boolean): void;
  ensureConnection(): Promise<void>;
}) {
  const flight = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const view = useQuery({
    queryKey: ["cache-cleanup", client.connectionTicket()],
    queryFn: () => client.readCacheCleanup(),
    networkMode: "always",
    retry: false,
    staleTime: 0,
  });
  async function run(remove: boolean) {
    if (flight.current || busy) return;
    flight.current = true;
    onBusyChange(true);
    try {
      if (remove && !retained.current) {
        if (!view.data?.targets.length) return;
        retained.current = parseCacheCleanupCommand({
          version: 1,
          ...view.data,
        });
      }
      await ensureConnection();
      if (!remove) {
        await view.refetch({ throwOnError: true });
        setMessage(null);
        return;
      }
      if (!retained.current) return;
      await client.cleanupCache(retained.current);
      retained.current = null;
      setDone(true);
      setMessage(
        "The cleanup request is complete. Files still needed, changed, or downloaded again were kept. Return to reading and retry the pending save.",
      );
    } catch {
      setMessage(
        remove
          ? "Cleanup could not be confirmed. Your pending reading save and unsaved drawing are still waiting. Retry this same cleanup or return to reading."
          : "Unused downloads could not be checked. Retry when storage is available.",
      );
    } finally {
      flight.current = false;
      onBusyChange(false);
    }
  }
  return (
    <section aria-label="Unused lesson downloads">
      <h3>
        <AddedText>Unused lesson downloads</AddedText>
      </h3>
      <p>
        <AddedText>
          Remove unused downloaded lesson files. Files needed for reading, saved
          work, Undo, or a pending download stay saved. This does not remove
          drawings or save work still waiting in reading.
        </AddedText>
      </p>
      {message ? (
        <p role="status">
          <AddedText>{message}</AddedText>
        </p>
      ) : null}
      {!done && !retained.current ? (
        <p>
          <AddedText>
            {view.isError
              ? "Unused downloads could not be checked."
              : view.isPending
                ? "Checking unused downloads…"
                : view.data.targets.length === 0
                  ? "There are no unused downloads to remove."
                  : "Unused downloads are available to remove."}
          </AddedText>
        </p>
      ) : null}
      {view.isError && !retained.current && !done ? (
        <Button disabled={busy} onClick={() => void run(false)}>
          <AddedText>Retry checking downloads</AddedText>
        </Button>
      ) : null}
      {!done ? (
        <Button
          disabled={busy || (!retained.current && !view.data?.targets.length)}
          onClick={() => void run(true)}
        >
          <AddedText>
            {flight.current
              ? "Cleaning up…"
              : retained.current
                ? "Retry same download cleanup"
                : "Remove unused downloads"}
          </AddedText>
        </Button>
      ) : null}
    </section>
  );
}
