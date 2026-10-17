import { parseRuntimePackage, resolvedLessons } from "@readatthree/teaching";
import type { GraphTask, PackageHash } from "@readatthree/teaching";
import { hashText } from "@/platform/hash.ts";
import type { ParentLifetime } from "./parent-visit.ts";

export type TaskPreviewTicket = Readonly<{
  lifetime: ParentLifetime;
  routeAttempt: number;
  packageHash: PackageHash;
}>;
export type FirstTaskPreview =
  | Readonly<{ kind: "available"; ticket: TaskPreviewTicket; task: GraphTask }>
  | Readonly<{
      kind: "unavailable";
      ticket: TaskPreviewTicket;
      reason: "missing" | "invalid" | "retired";
    }>;
export async function readFirstTaskPreview({
  ticket,
  connectionTicket,
  isCurrent,
}: {
  ticket: TaskPreviewTicket;
  connectionTicket: () => number;
  isCurrent: (ticket: TaskPreviewTicket) => boolean;
}): Promise<FirstTaskPreview> {
  const current = () =>
    connectionTicket() === ticket.lifetime.connectionTicket &&
    isCurrent(ticket);
  const unavailable = (
    reason: Extract<FirstTaskPreview, { kind: "unavailable" }>["reason"],
  ): FirstTaskPreview => ({ kind: "unavailable", ticket, reason });
  if (!current()) return unavailable("retired");
  try {
    const response = await fetch("/curriculum/development.json", {
      cache: "no-store",
    });
    if (!current()) return unavailable("retired");
    if (!response.ok) return unavailable("missing");
    const input: unknown = await response.json();
    const content = await parseRuntimePackage(input, hashText);
    if (!current()) return unavailable("retired");
    if (content.packageHash !== ticket.packageHash)
      return unavailable("invalid");
    const entry = resolvedLessons(content)
      .find((lesson) => lesson.number === 1)
      ?.tasks.find((entry) => entry.task.number === 1);
    if (!entry || entry.kind !== "printedGraphV1")
      return unavailable("missing");
    return { kind: "available", ticket, task: entry.task };
  } catch {
    return unavailable(current() ? "invalid" : "retired");
  }
}
