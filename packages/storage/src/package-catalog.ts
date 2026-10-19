import {
  canonical,
  createInstallationMaterials,
  increment,
  lessonFilesIdentity,
  parseHash,
  parseLessonFilesCommand,
  parseLessonFilesReceipt,
  requireInstallationLease,
  runtimeCapabilityProfiles,
  parsePublicationHash,
  PublicationResourceError,
  UnsupportedInstallProfileError,
  parseId,
  parseCounter,
  assertLessonFilesEvidence,
} from "../../teaching/src/index.ts";
import type {
  AcquisitionObservation,
  ActivationWitness,
  DownloadReference,
  HashFunction,
  InstallationLease,
  InstalledApplicationOptions,
  InstalledTeaching,
  LessonFilesCommand,
  LessonFilesReceipt,
  LessonFilesTarget,
  LessonFilesView,
  PackageHash,
  SignedInstallMaterial,
  ParentMaterialFailure,
} from "../../teaching/src/index.ts";
import type { drizzle } from "drizzle-orm/sqlite-proxy";
import { and, eq } from "drizzle-orm";
import {
  registerSignedPackage,
  updateCompatibility,
} from "./installed-packages.ts";
import { transaction } from "./migration.ts";
import type { SqlExecutor } from "./executor.ts";
import * as schema from "./schema.ts";
import { createPackageCollection } from "./package-collection.ts";
import { createPackageHolds } from "./package-holds.ts";

type CommandRow = typeof schema.lessonFilesCommand.$inferSelect;
export async function readLessonFilesEvidence(
  row: CommandRow,
  hash: HashFunction,
) {
  const identity = await lessonFilesIdentity(
    parseLessonFilesCommand(JSON.parse(row.command)),
    hash,
  );
  const receipt = parseLessonFilesReceipt(JSON.parse(row.result));
  const command = identity.command;
  if (
    Number(row.commandVersion) !== 1 ||
    Number(row.resultVersion) !== 1 ||
    identity.preimage !== row.command ||
    identity.payloadHash !== row.payloadHash ||
    command.installationId !== row.installationId ||
    command.commandId !== row.commandId ||
    receipt.installationId !== row.installationId ||
    receipt.commandId !== row.commandId ||
    receipt.payloadHash !== row.payloadHash ||
    receipt.kind !== row.stage ||
    canonical(receipt) !== row.result
  )
    throw new Error("Lesson-file evidence is inconsistent");
  if (command.action.kind === "download") {
    if (
      (row.downloadState === "pending" &&
        receipt.kind !== "accepted" &&
        receipt.kind !== "ready") ||
      (row.downloadState === "used" && receipt.kind !== "ready") ||
      (row.downloadState === "cancelled" &&
        receipt.kind !== "cancelled" &&
        receipt.kind !== "ready") ||
      (row.downloadState === null && receipt.kind !== "rejected")
    )
      throw new Error("Download disposition is inconsistent");
  } else if (row.downloadState !== null)
    throw new Error("Non-download command has a download disposition");
  assertLessonFilesEvidence(command, receipt);
  return { ...identity, receipt, downloadState: row.downloadState };
}

const formatPolicy = {
  contentSchemas: [1, 2, 3, 4],
  teachingStates: [1],
  inkCodecs: [1],
  capabilities: [
    ...new Set([
      ...runtimeCapabilityProfiles.flatMap((profile) => [
        ...profile.capabilities,
      ]),
      "partial-first-m",
      "lesson1-sounds-complete",
      "lesson1-sounds-oral-complete",
      "lesson1-complete",
    ]),
  ],
};

export function createPackageCatalog({
  db,
  executor,
  hash,
  options,
  exclusive,
  initialize,
  refresh,
  pinned,
  validateRetained,
}: Readonly<{
  db: ReturnType<typeof drizzle>;
  executor: SqlExecutor;
  hash: HashFunction;
  options: InstalledApplicationOptions;
  exclusive<T>(work: () => Promise<T>): Promise<T>;
  initialize(): Promise<unknown>;
  refresh(): Promise<void>;
  pinned(key: PackageHash): InstalledTeaching;
  validateRetained(): Promise<void>;
}>) {
  const material = createInstallationMaterials(options, hash);
  const collection = createPackageCollection({
    db,
    executor,
    hash,
    options,
    exclusive,
    validateRetained,
  });
  const holds = createPackageHolds({
    db,
    executor,
    hash,
    options,
    exclusive,
    validateRetained,
  });
  const running = new Map<string, Promise<void>>();
  const observations = new Map<string, AcquisitionObservation>();
  const bytes = new Map<
    PackageHash,
    LessonFilesView["packages"][number]["bytes"]
  >();
  const keyFor = (
    command: Pick<LessonFilesCommand, "installationId" | "commandId">,
  ) => canonical([command.installationId, command.commandId]);
  const holdFor = (
    command: Pick<LessonFilesCommand, "installationId" | "commandId">,
  ) => canonical(["lesson-files", command.installationId, command.commandId]);
  function current(lease?: InstallationLease) {
    material.cancellation.throwIfCancelled();
    if (lease) requireInstallationLease(lease);
  }
  async function ownedTransaction<T>(
    work: () => Promise<T>,
    lease?: InstallationLease,
  ) {
    return transaction(executor, work, () => current(lease));
  }
  async function activation(): Promise<ActivationWitness> {
    const row = (
      await db
        .select()
        .from(schema.courseActivation)
        .where(eq(schema.courseActivation.courseId, options.courseId))
        .all()
    )[0];
    return row
      ? {
          kind: "present",
          revision: row.revision,
          activePackageHash: row.activePackageHash,
          fallbackPackageHash: row.fallbackPackageHash,
        }
      : { kind: "absent" };
  }
  async function installation() {
    const rows = await db.select().from(schema.installation).all();
    const row = rows[0];
    if (rows.length !== 1 || !row)
      throw new Error("Installation identity unavailable");
    return row.id;
  }
  async function retained(command: LessonFilesCommand) {
    const row = (
      await db
        .select()
        .from(schema.lessonFilesCommand)
        .where(
          and(
            eq(
              schema.lessonFilesCommand.installationId,
              command.installationId,
            ),
            eq(schema.lessonFilesCommand.commandId, command.commandId),
          ),
        )
        .all()
    )[0];
    if (!row) return null;
    const saved = await readLessonFilesEvidence(row, hash);
    const requested = await lessonFilesIdentity(command, hash);
    if (
      saved.preimage !== requested.preimage ||
      saved.payloadHash !== requested.payloadHash
    )
      throw new Error("Lesson-file command identity changed");
    return saved;
  }
  async function save(
    command: LessonFilesCommand,
    receipt: LessonFilesReceipt,
    downloadState: CommandRow["downloadState"],
  ) {
    const identity = await lessonFilesIdentity(command, hash);
    const values = {
      installationId: command.installationId,
      commandId: command.commandId,
      commandVersion: 1,
      command: identity.preimage,
      payloadHash: identity.payloadHash,
      resultVersion: 1,
      result: canonical(parseLessonFilesReceipt(receipt)),
      stage: receipt.kind,
      downloadState,
    };
    if (await retained(command))
      await db
        .update(schema.lessonFilesCommand)
        .set(values)
        .where(
          and(
            eq(
              schema.lessonFilesCommand.installationId,
              command.installationId,
            ),
            eq(schema.lessonFilesCommand.commandId, command.commandId),
          ),
        )
        .run();
    else await db.insert(schema.lessonFilesCommand).values(values).run();
    const pending =
      (receipt.kind === "accepted" || receipt.kind === "ready") &&
      downloadState !== "used" &&
      downloadState !== "cancelled";
    if (pending && command.action.kind !== "cancel")
      await db
        .insert(schema.packageHold)
        .values({
          ownerKind: "pendingCommand",
          ownerId: holdFor(command),
          packageHash: parseHash({
            kind: "package",
            value: command.action.target.publicationHash,
          }),
        })
        .onConflictDoNothing()
        .run();
    else
      await db
        .delete(schema.packageHold)
        .where(
          and(
            eq(schema.packageHold.ownerKind, "pendingCommand"),
            eq(schema.packageHold.ownerId, holdFor(command)),
          ),
        )
        .run();
  }
  async function identity(command: LessonFilesCommand) {
    const value = await lessonFilesIdentity(command, hash);
    return {
      version: 1,
      family: "lesson-files",
      installationId: command.installationId,
      commandId: command.commandId,
      payloadHash: value.payloadHash,
    } satisfies Pick<
      LessonFilesReceipt,
      "version" | "family" | "installationId" | "commandId" | "payloadHash"
    >;
  }
  async function reject(
    command: LessonFilesCommand,
    reason: Extract<LessonFilesReceipt, { kind: "rejected" }>["reason"],
  ) {
    const receipt: LessonFilesReceipt = {
      ...(await identity(command)),
      kind: "rejected",
      reason,
    };
    await save(command, receipt, null);
    return receipt;
  }
  async function readyDownload(reference: DownloadReference) {
    const row = (
      await db
        .select()
        .from(schema.lessonFilesCommand)
        .where(
          and(
            eq(
              schema.lessonFilesCommand.installationId,
              reference.installationId,
            ),
            eq(schema.lessonFilesCommand.commandId, reference.commandId),
          ),
        )
        .all()
    )[0];
    if (!row) return null;
    const saved = await readLessonFilesEvidence(row, hash);
    return saved.payloadHash === reference.payloadHash &&
      saved.command.action.kind === "download"
      ? saved
      : null;
  }
  function matches(
    target: LessonFilesTarget,
    candidate: SignedInstallMaterial,
  ) {
    return (
      target.mode === options.mode &&
      target.courseId === options.courseId &&
      candidate.teaching.identity.hash === target.publicationHash &&
      candidate.teaching.body.courseId === target.courseId &&
      candidate.teaching.body.releaseId === target.releaseId
    );
  }
  async function finishDownload(
    command: LessonFilesCommand,
    candidate: SignedInstallMaterial,
  ) {
    if (command.action.kind !== "download")
      throw new Error("Expected download command");
    const target = command.action.target;
    return exclusive(() =>
      ownedTransaction(async () => {
        const saved = await retained(command);
        if (!saved) throw new Error("Download intent disappeared");
        if (
          saved.receipt.kind !== "accepted" ||
          saved.downloadState !== "pending"
        )
          return saved.receipt;
        if (!matches(target, candidate)) return reject(command, "incompatible");
        const active = await activation();
        if (
          active.kind !== "present" ||
          updateCompatibility({
            current: pinned(active.activePackageHash),
            candidate,
            policy: formatPolicy,
          }).kind !== "compatible"
        )
          return reject(command, "incompatible");
        const result = await registerSignedPackage({
          db,
          material: candidate,
          mode: options.mode,
        });
        if (result !== "registered") return reject(command, "conflict");
        const receipt: LessonFilesReceipt = {
          ...(await identity(command)),
          kind: "ready",
          target,
          packageHash: candidate.teaching.key,
        };
        await save(command, receipt, "pending");
        bytes.set(candidate.teaching.key, "verified");
        return receipt;
      }),
    );
  }
  async function finishUse(
    command: LessonFilesCommand,
    candidate: SignedInstallMaterial,
    lease: InstallationLease,
  ) {
    if (command.action.kind !== "use") throw new Error("Expected use command");
    const action = command.action;
    return exclusive(() =>
      ownedTransaction(async () => {
        const saved = await retained(command);
        if (!saved) throw new Error("Use intent disappeared");
        if (saved.receipt.kind !== "accepted") return saved.receipt;
        const downloaded = await readyDownload(action.ready);
        if (
          !downloaded ||
          downloaded.command.action.kind !== "download" ||
          downloaded.downloadState !== "pending" ||
          downloaded.receipt.kind !== "ready"
        )
          return reject(command, "cancelled");
        if (
          canonical(downloaded.command.action.target) !==
            canonical(action.target) ||
          !matches(action.target, candidate)
        )
          return reject(command, "conflict");
        const active = await activation();
        if (
          canonical(active) !== canonical(command.expected) ||
          active.kind !== "present"
        )
          return reject(command, "staleActivation");
        await refresh();
        if (
          updateCompatibility({
            current: pinned(active.activePackageHash),
            candidate,
            policy: formatPolicy,
          }).kind !== "compatible"
        )
          return reject(command, "incompatible");
        const revision = increment(active.revision);
        await db
          .update(schema.courseActivation)
          .set({
            activePackageHash: candidate.teaching.key,
            fallbackPackageHash: active.activePackageHash,
            revision,
          })
          .where(eq(schema.courseActivation.courseId, options.courseId))
          .run();
        const receipt: LessonFilesReceipt = {
          ...(await identity(command)),
          kind: "activated",
          packageHash: candidate.teaching.key,
          activationRevision: revision,
        };
        await save(downloaded.command, downloaded.receipt, "used");
        await save(command, receipt, null);
        return receipt;
      }, lease),
    );
  }
  async function continueCommand(
    command: LessonFilesCommand,
    allowNetwork: boolean,
  ) {
    current();
    const saved = await exclusive(async () => {
      await initialize();
      return retained(command);
    });
    if (
      !saved ||
      saved.receipt.kind !== "accepted" ||
      command.action.kind === "cancel"
    )
      return;
    const raw =
      allowNetwork && command.action.kind === "download"
        ? await material.acquire(command.action.target.publicationHash)
        : await material.cachedEnvelope(command.action.target.publicationHash);
    if (!raw) throw new Error("Exact local lesson files are unavailable");
    if (command.action.kind === "download")
      await material.withContent(raw, (candidate) =>
        finishDownload(command, candidate),
      );
    else
      await material.withVerified(raw, (candidate, lease) =>
        finishUse(command, candidate, lease),
      );
    await exclusive(refresh);
  }
  function schedule(command: LessonFilesCommand, allowNetwork: boolean) {
    const key = keyFor(command);
    if (running.has(key)) return;
    observations.set(key, { kind: "acquiring" });
    const operation = Promise.resolve()
      .then(() => continueCommand(command, allowNetwork))
      .catch(async (error: unknown) => {
        if (
          error instanceof PublicationResourceError &&
          command.action.kind !== "cancel"
        ) {
          const key = parseHash({
            kind: "package",
            value: command.action.target.publicationHash,
          });
          invalidate(key, { kind: "content", failure: error.failure });
        }
        if (
          error instanceof UnsupportedInstallProfileError &&
          options.lifetime.isCurrent()
        ) {
          try {
            await exclusive(() =>
              ownedTransaction(async () => {
                const saved = await retained(command);
                if (saved?.receipt.kind === "accepted")
                  await reject(command, "incompatible");
              }),
            );
            return;
          } catch {
            if (options.lifetime.isCurrent())
              observations.set(key, {
                kind: "retryable",
                reason: "interrupted",
              });
            return;
          }
        }
        if (options.lifetime.isCurrent())
          observations.set(key, {
            kind: "retryable",
            reason:
              error instanceof PublicationResourceError &&
              error.failure.kind === "unavailable" &&
              error.failure.reason === "quota"
                ? "quota"
                : allowNetwork
                  ? "unavailable"
                  : "interrupted",
          });
      })
      .finally(() => {
        if (running.get(key) === operation) running.delete(key);
        if (observations.get(key)?.kind === "acquiring")
          observations.set(key, { kind: "idle" });
      });
    running.set(key, operation);
  }
  async function changeLessonFiles(
    input: LessonFilesCommand,
  ): Promise<LessonFilesReceipt> {
    const command = parseLessonFilesCommand(input);
    await lessonFilesIdentity(command, hash);
    const receipt = await exclusive(async () => {
      await initialize();
      const old = await retained(command);
      if (old) return old.receipt;
      current();
      if (command.installationId !== (await installation()))
        throw new Error("Lesson-file installation identity changed");
      const initial = await db
        .select()
        .from(schema.installationCommand)
        .where(
          and(
            eq(
              schema.installationCommand.installationId,
              command.installationId,
            ),
            eq(schema.installationCommand.commandId, command.commandId),
          ),
        )
        .all();
      if (initial.length)
        throw new Error("Command identity belongs to initial installation");
      return ownedTransaction(async () => {
        const active = await activation();
        if (command.action.kind === "cancel") {
          const downloaded = await readyDownload(command.action.download);
          if (
            !downloaded ||
            downloaded.command.installationId !== command.installationId ||
            downloaded.command.action.kind !== "download" ||
            downloaded.downloadState === "used" ||
            downloaded.receipt.kind === "rejected"
          )
            return reject(command, "conflict");
          const cancelled: LessonFilesReceipt = {
            ...(await identity(downloaded.command)),
            kind: "cancelled",
            download: command.action.download,
          };
          await save(
            downloaded.command,
            downloaded.receipt.kind === "ready"
              ? downloaded.receipt
              : cancelled,
            "cancelled",
          );
          const result: LessonFilesReceipt = {
            ...(await identity(command)),
            kind: "cancelled",
            download: command.action.download,
          };
          await save(command, result, null);
          return result;
        }
        if (
          canonical(active) !== canonical(command.expected) ||
          active.kind !== "present"
        )
          return reject(command, "staleActivation");
        if (
          command.action.target.mode !== options.mode ||
          command.action.target.courseId !== options.courseId
        )
          return reject(command, "incompatible");
        if (
          command.action.kind === "download" &&
          (!options.offer ||
            options.offer.publicationHash !==
              command.action.target.publicationHash ||
            options.offer.releaseId !== command.action.target.releaseId)
        )
          return reject(command, "conflict");
        if (command.action.kind === "use") {
          const downloaded = await readyDownload(command.action.ready);
          if (
            !downloaded ||
            downloaded.receipt.kind !== "ready" ||
            downloaded.downloadState !== "pending"
          )
            return reject(command, "cancelled");
          if (
            downloaded.command.action.kind !== "download" ||
            canonical(downloaded.command.action.target) !==
              canonical(command.action.target)
          )
            return reject(command, "conflict");
        }
        const result: LessonFilesReceipt = {
          ...(await identity(command)),
          kind: "accepted",
          target: command.action.target,
        };
        await save(
          command,
          result,
          command.action.kind === "download" ? "pending" : null,
        );
        return result;
      });
    });
    if (receipt.kind === "accepted") schedule(command, true);
    return receipt;
  }
  let admission: Promise<void> | undefined;
  let admissionRevision = 0;
  let admittedRevision = -1;
  function invalidate(key: PackageHash, failure: ParentMaterialFailure) {
    bytes.set(
      key,
      failure.kind === "content" &&
        (failure.failure.kind === "missing" ||
          failure.failure.kind === "corrupt")
        ? failure.failure.kind
        : "unchecked",
    );
    admissionRevision++;
  }
  function observedVerified(key: PackageHash) {
    bytes.set(key, "verified");
  }
  async function prepareAdmission() {
    await exclusive(initialize);
    while (admittedRevision !== admissionRevision) {
      if (!admission) {
        const revision = admissionRevision;
        admission = reconcile()
          .then(() => {
            admittedRevision = revision;
          })
          .finally(() => {
            admission = undefined;
          });
      }
      await admission;
    }
  }
  async function reconcile() {
    current();
    const inventory = await collection.inventory();
    await retireInternalRollbackHolds();
    const tombstones = await exclusive(() =>
      db
        .select()
        .from(schema.packageCollection)
        .where(eq(schema.packageCollection.state, "collecting"))
        .all(),
    );
    const completed = new Set<PackageHash>();
    for (const row of tombstones.sort((a, b) =>
      a.packageHash.localeCompare(b.packageHash),
    ))
      if ((await collection.collect(row.packageHash)) === "collected")
        completed.add(row.packageHash);
    const registered = await exclusive(() =>
      db.select().from(schema.installedPackage).all(),
    );
    const known = new Set(registered.map((row) => row.packageHash));
    const keys = [
      ...new Set([
        ...inventory,
        ...registered.map((row) => parsePublicationHash(row.packageHash)),
      ]),
    ].sort();
    const discovered = new Set<PackageHash>();
    for (const target of keys) {
      current();
      const key = parseHash({ kind: "package", value: target });
      if (completed.has(key)) {
        bytes.set(key, "metadataOnly");
        continue;
      }
      const tombstone = await exclusive(() =>
        db
          .select()
          .from(schema.packageCollection)
          .where(eq(schema.packageCollection.packageHash, key))
          .all(),
      );
      if (tombstone[0]?.state === "complete" && !inventory.includes(target)) {
        bytes.set(key, "metadataOnly");
        continue;
      }
      try {
        const raw = await material.cachedEnvelope(target);
        if (!raw)
          throw new PublicationResourceError({
            kind: "missing",
            path: "_publication-envelope.json",
          });
        await material.withContent(raw, (candidate) =>
          exclusive(() =>
            ownedTransaction(async () => {
              if (candidate.teaching.key !== key)
                throw new Error("Namespace identity changed");
              const result = await registerSignedPackage({
                db,
                material: candidate,
                mode: options.mode,
              });
              if (result !== "registered")
                throw new Error("Retained package identity conflicts");
              bytes.set(key, "verified");
              if (!known.has(key)) discovered.add(key);
            }),
          ),
        );
      } catch (error) {
        if (
          !(error instanceof PublicationResourceError) &&
          !(error instanceof UnsupportedInstallProfileError)
        )
          throw error;
        if (
          error instanceof PublicationResourceError &&
          error.failure.kind === "unavailable"
        )
          throw error;
        bytes.set(
          key,
          error instanceof PublicationResourceError &&
            error.failure.kind === "missing"
            ? "missing"
            : "corrupt",
        );
        if (known.has(key))
          await exclusive(() =>
            ownedTransaction(async () => {
              await db
                .update(schema.installedPackage)
                .set({ state: "missing" })
                .where(eq(schema.installedPackage.packageHash, key))
                .run();
            }),
          );
      }
    }
    await exclusive(refresh);
    const commands = await exclusive(async () =>
      Promise.all(
        (await db.select().from(schema.lessonFilesCommand).all()).map((row) =>
          readLessonFilesEvidence(row, hash),
        ),
      ),
    );
    for (const saved of commands)
      if (saved.receipt.kind === "accepted") {
        try {
          await continueCommand(saved.command, false);
        } catch {
          observations.set(keyFor(saved.command), {
            kind: "retryable",
            reason: "interrupted",
          });
        }
      }
    await recoverFallback();
    for (const target of keys) {
      const key = parseHash({ kind: "package", value: target });
      if (
        !discovered.has(key) &&
        !completed.has(key) &&
        !(bytes.get(key) === "metadataOnly" && !inventory.includes(target)) &&
        (await collection.collect(key)) === "collected"
      )
        bytes.set(key, "metadataOnly");
    }
    await exclusive(refresh);
  }
  async function recoverFallback() {
    const captured = await exclusive(activation);
    if (
      captured.kind !== "present" ||
      bytes.get(captured.activePackageHash) === "verified" ||
      !captured.fallbackPackageHash ||
      bytes.get(captured.fallbackPackageHash) !== "verified"
    )
      return;
    const owner = {
      kind: "rollback" as const,
      installationId: await exclusive(installation),
      commandId: parseId({
        kind: "command",
        value: `catalog-fallback-v1-${captured.revision}`,
      }),
    };
    const reservation = await holds.reserveSnapshot(owner, async () => {
      const snapshot = await activation();
      return {
        snapshot,
        packages:
          snapshot.kind === "present" && snapshot.fallbackPackageHash
            ? [snapshot.fallbackPackageHash]
            : [],
      };
    });
    try {
      await holds.withReservedMaterial(
        reservation,
        async (_snapshot, materials, lease) => {
          const candidate = materials[0];
          if (!candidate) throw new Error("Fallback material is unavailable");
          await exclusive(() =>
            ownedTransaction(async () => {
              if (canonical(await activation()) !== canonical(captured)) return;
              if (
                updateCompatibility({
                  current: pinned(captured.activePackageHash),
                  candidate,
                  policy: formatPolicy,
                }).kind !== "compatible"
              )
                return;
              await db
                .update(schema.courseActivation)
                .set({
                  activePackageHash: candidate.teaching.key,
                  fallbackPackageHash: captured.activePackageHash,
                  revision: increment(captured.revision),
                })
                .where(eq(schema.courseActivation.courseId, options.courseId))
                .run();
            }, lease),
          );
        },
      );
    } finally {
      if (options.lifetime.isCurrent()) await holds.release(owner);
    }
  }
  async function retireInternalRollbackHolds() {
    const installationId = await exclusive(installation);
    const rows = await exclusive(() =>
      db
        .select()
        .from(schema.packageHold)
        .where(eq(schema.packageHold.ownerKind, "rollback"))
        .all(),
    );
    const owners = new Set<string>();
    for (const row of rows) {
      const value: unknown = JSON.parse(row.ownerId);
      if (
        !Array.isArray(value) ||
        value.length !== 3 ||
        value[0] !== "rollback" ||
        value[1] !== installationId ||
        typeof value[2] !== "string"
      )
        continue;
      const match = /^catalog-fallback-v1-(0|[1-9][0-9]*)$/.exec(value[2]);
      if (!match?.[1]) continue;
      parseCounter(match[1]);
      owners.add(value[2]);
    }
    for (const commandId of owners)
      await holds.release({
        kind: "rollback",
        installationId,
        commandId: parseId({ kind: "command", value: commandId }),
      });
  }
  async function readLessonFiles(): Promise<LessonFilesView> {
    await prepareAdmission();
    return exclusive(async () => {
      await initialize();
      await refresh();
      const active = await activation();
      const rows = await db.select().from(schema.lessonFilesCommand).all();
      const commands = await Promise.all(
        rows.map((row) => readLessonFilesEvidence(row, hash)),
      );
      const target = options.offer
        ? { ...options.offer, courseId: options.courseId, mode: options.mode }
        : undefined;
      const ready =
        target &&
        commands.find(
          (item) =>
            item.command.action.kind === "download" &&
            item.downloadState === "pending" &&
            item.receipt.kind === "ready" &&
            canonical(item.command.action.target) === canonical(target),
        );
      const offer: LessonFilesView["offer"] =
        !target ||
        (active.kind === "present" &&
          active.activePackageHash ===
            parseHash({ kind: "package", value: target.publicationHash }))
          ? { kind: "absent" }
          : ready && ready.receipt.kind === "ready"
            ? {
                kind: "ready",
                target,
                packageHash: ready.receipt.packageHash,
                receipt: {
                  installationId: ready.command.installationId,
                  commandId: ready.command.commandId,
                  payloadHash: ready.payloadHash,
                },
              }
            : { kind: "available", target };
      const historical = new Set(
        (
          await executor.execute(
            "SELECT package_hash FROM session UNION SELECT package_hash FROM task_run UNION SELECT package_hash FROM task_credit UNION SELECT package_hash FROM lesson_credit UNION SELECT package_hash FROM ink_document",
            [],
          )
        ).rows.map(([key]) => key),
      );
      const packages = await db.select().from(schema.installedPackage).all();
      return {
        activation: active,
        offer,
        commands: commands.map((item) => ({
          command: item.command,
          receipt: item.receipt,
          observation: observations.get(keyFor(item.command)) ?? {
            kind: "idle",
          },
        })),
        packages: packages.map((item) => ({
          packageHash: item.packageHash,
          role:
            active.kind === "present" &&
            active.activePackageHash === item.packageHash
              ? "active"
              : active.kind === "present" &&
                  active.fallbackPackageHash === item.packageHash
                ? "fallback"
                : historical.has(item.packageHash)
                  ? "historical"
                  : "inactive",
          bytes:
            bytes.get(item.packageHash) ??
            (item.state === "metadataOnly"
              ? "metadataOnly"
              : item.state === "missing"
                ? "missing"
                : "unchecked"),
        })),
      };
    });
  }
  return {
    readLessonFiles,
    changeLessonFiles,
    prepareAdmission,
    invalidate,
    observedVerified,
  };
}
