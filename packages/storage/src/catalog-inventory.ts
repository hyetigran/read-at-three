import { canonical, parseHash, parseId } from "../../teaching/src/index.ts";
import type { HashFunction } from "../../teaching/src/index.ts";
import type { drizzle } from "drizzle-orm/sqlite-proxy";
import { readInstallationEvidence } from "./initial-installation.ts";
import { readLessonFilesEvidence } from "./package-catalog.ts";
import type { SqlExecutor } from "./executor.ts";
import * as schema from "./schema.ts";

export async function validateCatalogInventory({
  db,
  executor,
  hash,
}: Readonly<{
  db: ReturnType<typeof drizzle>;
  executor: SqlExecutor;
  hash: HashFunction;
}>) {
  const initial = await db.select().from(schema.installationCommand).all();
  const installations = await db.select().from(schema.installation).all();
  const updates = await db.select().from(schema.lessonFilesCommand).all();
  const pending = new Set<string>();
  const commandIds = new Set<string>();
  for (const row of initial) {
    const saved = await readInstallationEvidence(row, hash);
    commandIds.add(
      canonical([saved.command.installationId, saved.command.commandId]),
    );
    if (saved.fact.kind === "accepted" || saved.fact.kind === "readyInactive")
      pending.add(
        canonical([
          canonical([
            "initialInstall",
            saved.command.installationId,
            saved.command.commandId,
          ]),
          parseHash({
            kind: "package",
            value: saved.command.target.publicationHash,
          }),
        ]),
      );
  }
  const evidence = await Promise.all(
    updates.map((row) => readLessonFilesEvidence(row, hash)),
  );
  for (const saved of evidence) {
    const command = saved.command;
    if (commandIds.has(canonical([command.installationId, command.commandId])))
      throw new Error("Command identity appears in two command families");
    if (
      (saved.receipt.kind === "accepted" || saved.receipt.kind === "ready") &&
      saved.downloadState !== "used" &&
      saved.downloadState !== "cancelled" &&
      command.action.kind !== "cancel"
    )
      pending.add(
        canonical([
          canonical([
            "lesson-files",
            command.installationId,
            command.commandId,
          ]),
          parseHash({
            kind: "package",
            value: command.action.target.publicationHash,
          }),
        ]),
      );
    if (command.action.kind === "use" && saved.receipt.kind !== "rejected") {
      const reference = command.action.ready;
      const downloaded = evidence.find(
        (item) =>
          item.command.installationId === reference.installationId &&
          item.command.commandId === reference.commandId &&
          item.payloadHash === reference.payloadHash,
      );
      if (
        !downloaded ||
        downloaded.command.action.kind !== "download" ||
        downloaded.command.installationId !== command.installationId ||
        canonical(downloaded.command.action.target) !==
          canonical(command.action.target)
      )
        throw new Error("Use command has no exact owned download evidence");
      if (
        saved.receipt.kind === "activated" &&
        (downloaded.downloadState !== "used" ||
          downloaded.receipt.kind !== "ready")
      )
        throw new Error(
          "Activated use has inconsistent retained download or revision",
        );
    }
    if (command.action.kind === "cancel" && saved.receipt.kind !== "rejected") {
      const reference = command.action.download;
      const downloaded = evidence.find(
        (item) =>
          item.command.installationId === reference.installationId &&
          item.command.commandId === reference.commandId &&
          item.payloadHash === reference.payloadHash,
      );
      if (
        !downloaded ||
        downloaded.command.action.kind !== "download" ||
        downloaded.command.installationId !== command.installationId ||
        downloaded.downloadState !== "cancelled" ||
        (downloaded.receipt.kind !== "cancelled" &&
          downloaded.receipt.kind !== "ready")
      )
        throw new Error(
          "Cancellation has no exact cancelled download evidence",
        );
    }
    if (command.action.kind === "download" && saved.downloadState === "used") {
      const users = evidence.filter(
        (item) =>
          item.command.action.kind === "use" &&
          item.receipt.kind === "activated" &&
          item.command.action.ready.installationId === command.installationId &&
          item.command.action.ready.commandId === command.commandId &&
          item.command.action.ready.payloadHash === saved.payloadHash,
      );
      if (users.length !== 1)
        throw new Error("Used download has no unique activated use evidence");
    }
    if (
      command.action.kind === "download" &&
      saved.downloadState === "cancelled" &&
      !evidence.some(
        (item) =>
          item.command.action.kind === "cancel" &&
          item.receipt.kind === "cancelled" &&
          item.command.action.download.installationId ===
            command.installationId &&
          item.command.action.download.commandId === command.commandId &&
          item.command.action.download.payloadHash === saved.payloadHash,
      )
    ) {
      throw new Error("Cancelled download has no cancellation evidence");
    }
  }
  const holds = await db.select().from(schema.packageHold).all();
  const actualPending = new Set<string>();
  for (const hold of holds) {
    const parsed: unknown = JSON.parse(hold.ownerId);
    if (!Array.isArray(parsed) || canonical(parsed) !== hold.ownerId)
      throw new Error("Package hold owner is unsupported");
    const owner: readonly unknown[] = parsed;
    if (hold.ownerKind === "pendingCommand") {
      if (
        owner.length !== 3 ||
        (owner[0] !== "initialInstall" && owner[0] !== "lesson-files")
      )
        throw new Error("Pending package hold owner is unsupported");
      parseId({ kind: "installation", value: owner[1] });
      parseId({ kind: "command", value: owner[2] });
      actualPending.add(canonical([hold.ownerId, hold.packageHash]));
    } else {
      if (
        owner[0] !== hold.ownerKind ||
        owner.length !== (hold.ownerKind === "rollback" ? 3 : 2)
      )
        throw new Error("Operation package hold owner is unsupported");
      parseId({
        kind: hold.ownerKind === "rollback" ? "installation" : "command",
        value: owner[1],
      });
      if (
        hold.ownerKind === "rollback" &&
        !installations.some((row) => row.id === owner[1])
      )
        throw new Error("Rollback hold belongs to another installation");
      if (hold.ownerKind === "rollback")
        parseId({ kind: "command", value: owner[2] });
    }
  }
  if (
    pending.size !== actualPending.size ||
    [...pending].some((key) => !actualPending.has(key))
  )
    throw new Error("Pending command material holds are inconsistent");
  if (
    (
      await executor.execute(
        "SELECT r.package_hash FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting' LIMIT 1",
        [],
      )
    ).rows.length
  )
    throw new Error("Collecting material still has a retained owner");
}
