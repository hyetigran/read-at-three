import { browserConfiguration } from "../../platform/browser-configuration.ts";
import { loadDevelopmentContent } from "../../platform/development-opening.ts";
import type { BrowserTeachingClient } from "../../platform/teaching-client.ts";
import { parseRuntimePackage, resolvedLessons } from "@readatthree/teaching";
import type { GraphTask, BoardTask, PackageHash } from "@readatthree/teaching";
import { hashText } from "@/platform/hash.ts";
import type { ParentLifetime } from "./parent-visit.ts";

export type TaskPreviewTicket = Readonly<{
  lifetime: ParentLifetime;
  routeAttempt: number;
  packageHash: PackageHash;
}>;
export type FirstTaskPreview =
  | Readonly<{
      kind: "available";
      ticket: TaskPreviewTicket;
      task: GraphTask | BoardTask;
    }>
  | Readonly<{
      kind: "unavailable";
      ticket: TaskPreviewTicket;
      reason: "missing" | "invalid" | "retired";
    }>;
export async function readFirstTaskPreview({
  ticket,
  connectionTicket,
  isCurrent,
  readParentMaterial,
}: {
  ticket: TaskPreviewTicket;
  readParentMaterial: BrowserTeachingClient["parentMaterial"];
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
    if (browserConfiguration.kind === "installed") {
      const material = await readParentMaterial({
        kind: "firstTaskPreview",
        packageHash: ticket.packageHash,
      });
      if (!current()) return unavailable("retired");
      if (
        material.kind !== "firstTaskPreview" ||
        material.packageHash !== ticket.packageHash
      )
        return unavailable("missing");
      return { kind: "available", ticket, task: material.task.task };
    }
    const input = await loadDevelopmentContent();
    const content = await parseRuntimePackage(input, hashText);
    if (!current()) return unavailable("retired");
    if (content.packageHash !== ticket.packageHash)
      return unavailable("invalid");
    const entry = resolvedLessons(content)
      .find((lesson) => lesson.number === 1)
      ?.tasks.find((entry) => entry.task.number === 1);
    if (
      !entry ||
      (entry.kind !== "printedGraphV1" && entry.kind !== "printedGraphV2")
    )
      return unavailable("missing");
    return { kind: "available", ticket, task: entry.task };
  } catch {
    return unavailable(current() ? "invalid" : "retired");
  }
}
