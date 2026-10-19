import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { canonical, parseLessonFilesCommand } from "@readatthree/teaching";
import type {
  InstallationId,
  LessonFilesCommand,
  PackageHash,
  PublicationCheck,
} from "@readatthree/teaching";
import type { BrowserTeachingClient } from "../../platform/teaching-client.ts";
import { Button } from "../../components/ui/button.tsx";
import { AddedText } from "../teaching/CopyText.tsx";

export type LessonFilesClient = Pick<
  BrowserTeachingClient,
  | "readLessonFiles"
  | "changeLessonFiles"
  | "checkPublication"
  | "repairPublication"
>;
export function LessonFiles({
  client,
  installationId,
  visitKey,
  isCurrent,
  retained,
  onChanged,
}: Readonly<{
  client: LessonFilesClient;
  installationId: InstallationId;
  visitKey: readonly unknown[];
  isCurrent(): boolean;
  retained: { current: LessonFilesCommand | null };
  onChanged(): Promise<void>;
}>) {
  const queries = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [checks, setChecks] = useState<
    ReadonlyMap<PackageHash, PublicationCheck>
  >(new Map());
  const serial = useRef(0);
  const activation = useRef<string | null>(null);
  const view = useQuery({
    queryKey: ["lesson-files", installationId, ...visitKey],
    queryFn: async () => {
      if (!isCurrent()) throw new Error("Parent visit was retired");
      const value = await client.readLessonFiles();
      if (!isCurrent()) throw new Error("Parent visit was retired");
      return value;
    },
    networkMode: "always",
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      query.state.data?.commands.some(
        (item) =>
          item.receipt.kind === "accepted" &&
          item.observation.kind === "acquiring",
      )
        ? 1000
        : false,
  });
  const witness = view.data ? canonical(view.data.activation) : null;
  useEffect(() => {
    if (!witness) return;
    const previous = activation.current;
    activation.current = witness;
    if (previous && previous !== witness && isCurrent()) {
      void queries.invalidateQueries({
        queryKey: ["installed-parent-preparation"],
        refetchType: "none",
      });
      void onChanged();
    }
  }, [witness, isCurrent, onChanged, queries]);
  async function submit(command: LessonFilesCommand) {
    if (busy || !isCurrent()) return;
    const attempt = ++serial.current;
    retained.current = command;
    setBusy(true);
    setMessage(null);
    try {
      const result = await client.changeLessonFiles(command);
      if (!isCurrent() || serial.current !== attempt) return;
      if (result.kind !== "accepted") retained.current = null;
      if (result.kind === "rejected")
        setMessage(
          "This lesson-file request could not be applied. Your saved reading and writing are kept.",
        );
      await view.refetch();
    } catch {
      if (isCurrent() && serial.current === attempt)
        setMessage(
          "The result could not be confirmed. Retry this exact request to recover its saved result.",
        );
    } finally {
      if (isCurrent() && serial.current === attempt) setBusy(false);
    }
  }
  function begin(action: LessonFilesCommand["action"]) {
    if (!view.data || busy || !isCurrent()) return;
    if (
      retained.current &&
      !view.data.commands.some(
        (item) => item.command.commandId === retained.current?.commandId,
      )
    )
      return;
    void submit(
      parseLessonFilesCommand({
        version: 1,
        family: "lesson-files",
        installationId,
        commandId: crypto.randomUUID(),
        expected: view.data.activation,
        action,
      }),
    );
  }
  async function check(packageHash: PackageHash, repair: boolean) {
    if (busy || !isCurrent()) return;
    const attempt = ++serial.current;
    setBusy(true);
    setMessage(null);
    try {
      const target = { installationId, packageHash };
      const result = repair
        ? await client.repairPublication(target)
        : await client.checkPublication(target);
      if (!isCurrent() || serial.current !== attempt) return;
      setChecks((old) => new Map(old).set(packageHash, result));
      await view.refetch();
    } catch {
      if (isCurrent() && serial.current === attempt)
        setMessage("The file check could not finish. Your saved work is kept.");
    } finally {
      if (isCurrent() && serial.current === attempt) setBusy(false);
    }
  }
  const data = view.data;
  const unconfirmed =
    retained.current !== null &&
    !data?.commands.some(
      (item) => item.command.commandId === retained.current?.commandId,
    );
  const pending =
    data?.commands.filter(
      (item) =>
        item.receipt.kind === "accepted" ||
        (item.receipt.kind === "ready" &&
          !data.commands.some(
            (other) =>
              other.receipt.kind === "activated" &&
              other.command.action.kind === "use" &&
              other.command.action.ready.installationId ===
                item.receipt.installationId &&
              other.command.action.ready.commandId === item.receipt.commandId &&
              other.command.action.ready.payloadHash ===
                item.receipt.payloadHash,
          ) &&
          !data.commands.some(
            (other) =>
              other.receipt.kind === "cancelled" &&
              other.command.action.kind === "cancel" &&
              other.command.action.download.installationId ===
                item.receipt.installationId &&
              other.command.action.download.commandId ===
                item.receipt.commandId &&
              other.command.action.download.payloadHash ===
                item.receipt.payloadHash,
          )),
    ) ?? [];
  const rejected =
    data?.commands.filter((item) => item.receipt.kind === "rejected") ?? [];
  return (
    <section className="course-settings" aria-busy={busy}>
      <h2>
        <AddedText>Lesson files</AddedText>
      </h2>
      <p>
        <AddedText>
          Download an update, then choose Use these lessons when you are ready.
          Saved activities keep the lesson version they started with.
        </AddedText>
      </p>
      {view.isPending ? (
        <p role="status">
          <AddedText>Checking saved lesson files</AddedText>
        </p>
      ) : null}
      {view.error || message ? (
        <p role="alert">
          <AddedText>
            {message ??
              "Saved lesson files could not be checked. Your work is kept."}
          </AddedText>
        </p>
      ) : null}
      {rejected.map((item) => (
        <p role="alert" key={item.command.commandId}>
          <AddedText>
            {item.receipt.kind === "rejected" &&
            item.receipt.reason === "incompatible"
              ? "This update is incompatible with the installed lessons. Your current lessons and saved work are kept."
              : item.receipt.kind === "rejected" &&
                  item.receipt.reason === "staleActivation"
                ? "The selected lesson version changed. Refresh file status before choosing an update."
                : "This update request could not select its exact download. Its saved result is retained."}
          </AddedText>
        </p>
      ))}
      {data?.offer.kind === "absent" ? (
        <p>
          <AddedText>Your current lessons are selected.</AddedText>
        </p>
      ) : null}
      {data?.offer.kind === "available" ? (
        <Button
          className="course-primary"
          disabled={
            busy ||
            unconfirmed ||
            pending.some(
              (item) =>
                item.command.action.kind === "download" &&
                item.receipt.kind === "accepted",
            )
          }
          onClick={() => {
            if (data.offer.kind === "available")
              begin({ kind: "download", target: data.offer.target });
          }}
        >
          <AddedText>Download lesson update</AddedText>
        </Button>
      ) : null}
      {data?.offer.kind === "ready" ? (
        <div>
          <p role="status">
            <AddedText>
              The update is ready. Your current lesson version is still
              selected.
            </AddedText>
          </p>
          <Button
            className="course-primary"
            disabled={
              busy ||
              unconfirmed ||
              pending.some(
                (item) =>
                  item.command.action.kind === "use" &&
                  item.receipt.kind === "accepted",
              )
            }
            onClick={() => {
              if (data.offer.kind === "ready")
                begin({
                  kind: "use",
                  target: data.offer.target,
                  ready: data.offer.receipt,
                });
            }}
          >
            <AddedText>Use these lessons</AddedText>
          </Button>
        </div>
      ) : null}
      {pending.map((item) => (
        <div key={item.command.commandId}>
          <p role="status">
            <AddedText>
              {item.receipt.kind === "ready"
                ? "Downloaded files are retained until you use or cancel this update."
                : item.observation.kind === "acquiring"
                  ? "Preparing the exact requested lesson files"
                  : item.observation.kind === "retryable" &&
                      item.observation.reason === "quota"
                    ? "Device storage could not accept the lesson files. Free space and retry this exact request."
                    : "This exact request is saved. Retry to continue it."}
            </AddedText>
          </p>
          {item.receipt.kind === "accepted" ? (
            <Button
              className="course-secondary"
              disabled={busy}
              onClick={() => void submit(item.command)}
            >
              <AddedText>Retry saved request</AddedText>
            </Button>
          ) : null}
          {item.command.action.kind === "download" ? (
            <Button
              className="course-secondary"
              disabled={busy}
              onClick={() =>
                begin({
                  kind: "cancel",
                  download: {
                    installationId: item.receipt.installationId,
                    commandId: item.receipt.commandId,
                    payloadHash: item.receipt.payloadHash,
                  },
                })
              }
            >
              <AddedText>Cancel download</AddedText>
            </Button>
          ) : null}
        </div>
      ))}
      {retained.current &&
      !data?.commands.some(
        (item) => item.command.commandId === retained.current?.commandId,
      ) ? (
        <Button
          className="course-secondary"
          disabled={busy}
          onClick={() => {
            if (retained.current) void submit(retained.current);
          }}
        >
          <AddedText>Retry unconfirmed request</AddedText>
        </Button>
      ) : null}
      <ul className="parent-file-list">
        {data?.packages.map((item) => (
          <li key={item.packageHash}>
            <p>
              <AddedText>
                {item.role === "active"
                  ? "Current lessons"
                  : item.role === "fallback"
                    ? "Recovery lesson version"
                    : item.role === "historical"
                      ? "Saved activity lesson version"
                      : "Downloaded lesson version"}
              </AddedText>
            </p>
            <p>
              <AddedText>
                {checks.get(item.packageHash)?.kind === "verified"
                  ? "Files verified. Resume reading separately when you are ready."
                  : checks.get(item.packageHash)?.kind === "unavailable"
                    ? "Exact lesson files remain unavailable. Repair these files before resuming this version."
                    : item.bytes === "verified"
                      ? "Lesson files verified"
                      : item.bytes === "metadataOnly"
                        ? "Lesson records kept; download files removed"
                        : item.bytes === "missing" || item.bytes === "corrupt"
                          ? "Exact lesson files need repair"
                          : "Lesson files have not been checked"}
              </AddedText>
            </p>
            <Button
              className="course-secondary"
              disabled={busy}
              onClick={() => void check(item.packageHash, false)}
            >
              <AddedText>Check files</AddedText>
            </Button>
            {item.role !== "inactive" ||
            pending.some(
              (entry) =>
                entry.receipt.kind === "ready" &&
                entry.receipt.packageHash === item.packageHash,
            ) ? (
              <Button
                className="course-secondary"
                disabled={busy}
                onClick={() => void check(item.packageHash, true)}
              >
                <AddedText>Repair exact files</AddedText>
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      <Button
        className="course-secondary"
        disabled={busy}
        onClick={() => void view.refetch()}
      >
        <AddedText>Refresh file status</AddedText>
      </Button>
    </section>
  );
}
