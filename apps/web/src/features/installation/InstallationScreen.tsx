import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { makeInitialInstallCommand, parseId } from "@readatthree/teaching";
import type { InitialInstallCommand } from "@readatthree/teaching";
import type { BrowserTeachingClient } from "../../platform/teaching-client.ts";
import type { BrowserConfiguration } from "../../platform/browser-configuration.ts";
import { Button } from "../../components/ui/button.tsx";
import { AddedText } from "../teaching/CopyText.tsx";

export function InstallationScreen({
  client,
  configuration,
  opening,
  onOpen,
  onReconnect,
  retained,
}: Readonly<{
  client: BrowserTeachingClient;
  configuration: Extract<BrowserConfiguration, { kind: "installed" }>;
  opening: boolean;
  onOpen: () => void;
  onReconnect: () => void;
  retained: { current: InitialInstallCommand | null };
}>) {
  const attempt = useRef(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const catalog = useQuery({
    queryKey: ["initial-installation-catalog", client.connectionTicket()],
    queryFn: () => client.installations(),
    enabled: !opening,
    networkMode: "always",
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      query.state.data?.commands.some(
        (read) =>
          read.fact.kind === "accepted" || read.fact.kind === "readyInactive",
      )
        ? 1000
        : false,
  });
  const course = catalog.data?.courses.find(
    (course) => course.courseId === configuration.courseId,
  );
  const activated = course?.activation.kind === "present";
  const pending =
    catalog.data?.commands.filter(
      (read) =>
        read.fact.kind === "accepted" || read.fact.kind === "readyInactive",
    ) ?? [];
  async function submit(command: InitialInstallCommand) {
    if (submitting) return;
    retained.current = command;
    const serial = ++attempt.current,
      connection = client.connectionTicket();
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await client.initialInstall(command);
      if (
        serial !== attempt.current ||
        connection !== client.connectionTicket()
      )
        return;
      if (result.fact.kind === "rejected")
        setMessage(
          "These lessons could not be installed. Your saved work is kept.",
        );
      await catalog.refetch();
    } catch {
      if (serial === attempt.current)
        setMessage(
          "Installation could not be confirmed. Retry the same installation to recover it.",
        );
    } finally {
      if (serial === attempt.current) setSubmitting(false);
    }
  }
  function begin() {
    if (
      !catalog.data ||
      !course ||
      !configuration.initialTarget ||
      retained.current
    )
      return;
    const command = makeInitialInstallCommand({
      installationId: catalog.data.installationId,
      commandId: parseId({ kind: "command", value: crypto.randomUUID() }),
      source: { mode: configuration.publication.mode },
      target: {
        courseId: configuration.courseId,
        ...configuration.initialTarget,
      },
      expected: course.activation,
    });
    void submit(command);
  }
  function reconnect() {
    attempt.current++;
    setSubmitting(false);
    setMessage(null);
    onReconnect();
  }
  return (
    <main className="course-screen course-parent">
      <section className="course-message" aria-labelledby="installation-title">
        <h1 id="installation-title">
          <AddedText>
            {activated ? "Open your saved lessons" : "Get ready to read"}
          </AddedText>
        </h1>
        {opening || catalog.isPending ? (
          <p role="status">
            <AddedText>Opening your saved reading and writing</AddedText>
          </p>
        ) : null}
        {catalog.error ? (
          <p role="alert">
            <AddedText>
              The saved installation could not be read. Your work is kept.
            </AddedText>
          </p>
        ) : null}
        {message ? (
          <p role="alert">
            <AddedText>{message}</AddedText>
          </p>
        ) : null}
        {activated ? (
          <>
            <p>
              <AddedText>
                Open your lessons to check their availability and restore your
                saved work.
              </AddedText>
            </p>
            <Button
              className="course-primary"
              onClick={onOpen}
              disabled={opening || submitting}
            >
              <AddedText>Open lessons</AddedText>
            </Button>
          </>
        ) : null}
        {!activated &&
        catalog.data &&
        !configuration.initialTarget &&
        !pending.length ? (
          <p>
            <AddedText>
              Lessons are not available for installation yet.
            </AddedText>
          </p>
        ) : null}
        {!activated &&
        configuration.initialTarget &&
        catalog.data &&
        !retained.current &&
        !pending.length ? (
          <>
            <p>
              <AddedText>
                Install the lessons on this device before you begin.
              </AddedText>
            </p>
            <Button
              className="course-primary"
              onClick={begin}
              disabled={submitting || opening}
            >
              <AddedText>Install lessons</AddedText>
            </Button>
          </>
        ) : null}
        {!activated &&
        retained.current &&
        !pending.some(
          (read) => read.command.commandId === retained.current?.commandId,
        ) ? (
          <Button
            className="course-primary"
            onClick={() => {
              const command = retained.current;
              if (command) void submit(command);
            }}
            disabled={submitting || opening}
          >
            <AddedText>Retry installation</AddedText>
          </Button>
        ) : null}
        {!activated
          ? pending.map((read) => (
              <div key={read.command.commandId}>
                <p role="status">
                  <AddedText>
                    {read.fact.kind === "readyInactive"
                      ? "The lesson download was verified. Retry to finish installation."
                      : "Your installation request is saved. You can retry if it does not finish."}
                  </AddedText>
                </p>
                <Button
                  className="course-primary"
                  disabled={submitting || opening}
                  onClick={() => void submit(read.command)}
                >
                  <AddedText>Retry installation</AddedText>
                </Button>
              </div>
            ))
          : null}
        <Button
          className="course-secondary"
          onClick={() => void catalog.refetch()}
          disabled={opening}
        >
          <AddedText>Check installation</AddedText>
        </Button>
        <Button className="course-secondary" onClick={reconnect}>
          <AddedText>Reconnect and recover</AddedText>
        </Button>
      </section>
    </main>
  );
}
