import {
  PublicationResourceError,
  ShellError,
  canonical,
  parseHash,
  parseCounter,
  initialInstallIdentity,
  parseInstallationFact,
  parseInitialInstallCommand,
  createInstallationMaterials,
  requireInstallMaterial,
  requireInstallationLease,
  UnsupportedInstallProfileError,
  packageMetadata,
} from "../../teaching/src/index.ts";
import type {
  InitialInstallCommand,
  InstallationFact,
  InstallationRead,
  ActivationWitness,
  InstallationObservation,
  InstalledApplicationOptions,
  SignedInstallMaterial,
  InstallationLease,
  HashFunction,
  InstallationId,
} from "../../teaching/src/index.ts";
import { and, eq } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/sqlite-proxy";
import { transaction } from "./migration.ts";
import type { SqlExecutor } from "./executor.ts";
import * as schema from "./schema.ts";
import { equalBytes } from "./utf8.ts";
export function createInitialInstallation({
  db,
  executor,
  hash,
  options,
  exclusive,
  initialize,
  canActivate,
  refresh,
}: Readonly<{
  db: ReturnType<typeof drizzle>;
  executor: SqlExecutor;
  hash: HashFunction;
  options: InstalledApplicationOptions;
  exclusive<T>(run: () => Promise<T>): Promise<T>;
  initialize(): Promise<unknown>;
  canActivate(): Promise<boolean>;
  refresh(): Promise<void>;
}>) {
  const identities = new Map<
    string,
    Awaited<ReturnType<typeof initialInstallIdentity>>
  >();
  async function identify(command: InitialInstallCommand) {
    const text = canonical(command);
    let value = identities.get(text);
    if (!value) {
      value = await initialInstallIdentity(command, hash);
      identities.set(text, value);
    }
    return value;
  }
  const materials = createInstallationMaterials(options, hash);
  const running = new Map<string, Promise<void>>();
  const observations = new Map<string, InstallationObservation>();
  let inspection = 0;
  function live() {
    materials.cancellation.throwIfCancelled();
  }
  async function ownedTransaction<T>(
    work: () => Promise<T>,
    lease?: InstallationLease,
  ): Promise<T> {
    function check() {
      live();
      if (lease) requireInstallationLease(lease);
    }
    check();
    return transaction(executor, async () => {
      const result = await work();
      check();
      return result;
    });
  }
  const identityKey = (command: InitialInstallCommand) =>
    canonical([command.installationId, command.commandId]);
  async function installationId(): Promise<InstallationId> {
    const rows = await db.select().from(schema.installation).all();
    if (rows.length !== 1 || !rows[0])
      throw new Error("Installation identity unavailable");
    return rows[0].id;
  }
  async function witness(
    courseId: InitialInstallCommand["target"]["courseId"],
  ): Promise<ActivationWitness> {
    const rows = await db
      .select()
      .from(schema.courseActivation)
      .where(eq(schema.courseActivation.courseId, courseId))
      .all();
    const row = rows[0];
    return row
      ? {
          kind: "present",
          revision: row.revision,
          activePackageHash: row.activePackageHash,
          fallbackPackageHash: row.fallbackPackageHash,
        }
      : { kind: "absent" };
  }
  async function retained(
    command: InitialInstallCommand,
  ): Promise<InstallationRead | null> {
    const row = (
      await db
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
        .all()
    )[0];
    if (!row) return null;
    const saved = await identify(
      parseInitialInstallCommand(JSON.parse(row.command)),
    );
    const requested = await identify(command);
    const fact = parseInstallationFact(JSON.parse(row.result));
    const key = parseHash({
      kind: "package",
      value: saved.command.target.publicationHash,
    });
    const registered =
      fact.kind === "accepted" ? null : fact.registeredPackageHash;
    const revision = fact.kind === "activated" ? fact.activationRevision : null;
    if (
      Number(row.commandVersion) !== 1 ||
      Number(row.resultVersion) !== 1 ||
      saved.preimage !== row.command ||
      saved.payloadHash !== row.payloadHash ||
      canonical(fact) !== row.result ||
      fact.kind !== row.stage ||
      fact.installationId !== row.installationId ||
      fact.commandId !== row.commandId ||
      fact.payloadHash !== row.payloadHash ||
      registered !== row.registeredPackageHash ||
      revision !== row.activatedRevision ||
      (registered !== null && registered !== key) ||
      (fact.kind === "accepted" && fact.targetPackageHash !== key)
    )
      throw new Error("Installation evidence is inconsistent");
    if (
      requested.preimage !== saved.preimage ||
      requested.payloadHash !== saved.payloadHash
    )
      throw new Error("Installation command identity changed");
    return {
      command: saved.command,
      fact,
      availability: observations.get(identityKey(command)) ?? {
        kind: "notChecked",
      },
    };
  }
  async function save(command: InitialInstallCommand, fact: InstallationFact) {
    const identity = await identify(command);
    const registered =
      fact.kind === "accepted" ? null : fact.registeredPackageHash;
    const activated =
      fact.kind === "activated" ? fact.activationRevision : null;
    const values = {
      commandVersion: 1,
      resultVersion: 1,
      installationId: command.installationId,
      commandId: command.commandId,
      payloadHash: identity.payloadHash,
      command: identity.preimage,
      stage: fact.kind,
      result: canonical(parseInstallationFact(fact)),
      registeredPackageHash: registered,
      activatedRevision: activated,
    };
    const old = await retained(command);
    if (old)
      await db
        .update(schema.installationCommand)
        .set(values)
        .where(
          and(
            eq(
              schema.installationCommand.installationId,
              command.installationId,
            ),
            eq(schema.installationCommand.commandId, command.commandId),
          ),
        )
        .run();
    else await db.insert(schema.installationCommand).values(values).run();
  }
  async function reject(
    command: InitialInstallCommand,
    current: InstallationFact,
    reason: Extract<InstallationFact, { kind: "rejected" }>["reason"],
  ) {
    const registeredPackageHash =
      current.kind === "readyInactive" ? current.registeredPackageHash : null;
    const fact = parseInstallationFact({
      version: 1,
      installationId: command.installationId,
      commandId: command.commandId,
      payloadHash: current.payloadHash,
      kind: "rejected",
      reason,
      registeredPackageHash,
    });
    await save(command, fact);
    return fact;
  }
  async function guard(command: InitialInstallCommand) {
    live();
    if (command.installationId !== (await installationId()))
      throw new Error("Installation lifetime changed");
    const current = await retained(command);
    if (!current) throw new Error("Installation intent disappeared");
    return current;
  }
  async function register(
    command: InitialInstallCommand,
    material: SignedInstallMaterial,
  ) {
    requireInstallMaterial(material);
    return exclusive(async () =>
      ownedTransaction(async () => {
        const current = await guard(command);
        if (current.fact.kind !== "accepted") return current.fact;
        if (
          canonical(await witness(command.target.courseId)) !==
          canonical(command.expected)
        )
          return reject(command, current.fact, "activationChanged");
        const value = material.teaching;
        if (
          value.identity.hash !== command.target.publicationHash ||
          value.body.courseId !== command.target.courseId ||
          value.body.releaseId !== command.target.releaseId ||
          value.body.courseId !== options.courseId
        )
          return reject(command, current.fact, "packageIdentityConflict");
        const release = (
          await db
            .select()
            .from(schema.installedPackage)
            .where(
              and(
                eq(schema.installedPackage.courseId, value.body.courseId),
                eq(schema.installedPackage.releaseId, value.body.releaseId),
              ),
            )
            .all()
        )[0];
        if (release && release.packageHash !== value.key)
          return reject(command, current.fact, "releaseIdentityConflict");
        const base = (
          await db
            .select()
            .from(schema.installedPackage)
            .where(eq(schema.installedPackage.packageHash, value.key))
            .all()
        )[0];
        if (base) {
          const rep = (
            await db
              .select()
              .from(schema.installedRepresentation)
              .where(eq(schema.installedRepresentation.packageHash, value.key))
              .all()
          )[0];
          if (
            base.state !== "ready" ||
            base.courseId !== value.body.courseId ||
            base.releaseId !== value.body.releaseId ||
            !equalBytes(base.verifiedManifest, material.envelope) ||
            !rep ||
            rep.kind !== "signed-v1" ||
            rep.mode !== options.mode ||
            !rep.curriculumUtf8 ||
            !equalBytes(rep.curriculumUtf8, material.curriculum) ||
            !rep.preparationUtf8 ||
            !equalBytes(rep.preparationUtf8, material.preparationBytes)
          )
            return reject(command, current.fact, "packageIdentityConflict");
        } else {
          const metadata = packageMetadata(value.document);
          await db
            .insert(schema.installedPackage)
            .values({
              packageHash: value.key,
              courseId: value.body.courseId,
              releaseId: value.body.releaseId,
              contentSchemaVersion: metadata.contentSchemaVersion,
              capabilities: canonical(metadata.capabilities),
              manifestVersion: 1,
              verifiedManifest: material.envelope,
              state: "ready",
              storageKey: value.key,
            })
            .run();
          await db
            .insert(schema.installedRepresentation)
            .values({
              packageHash: value.key,
              kind: "signed-v1",
              mode: options.mode,
              curriculumUtf8: material.curriculum,
              preparationUtf8: material.preparationBytes,
            })
            .run();
        }
        live();
        const fact = parseInstallationFact({
          version: 1,
          installationId: command.installationId,
          commandId: command.commandId,
          payloadHash: current.fact.payloadHash,
          kind: "readyInactive",
          registeredPackageHash: value.key,
        });
        await save(command, fact);
        live();
        return fact;
      }),
    );
  }
  async function activate(
    command: InitialInstallCommand,
    material: SignedInstallMaterial,
    lease: InstallationLease,
  ) {
    return exclusive(async () => {
      live();
      requireInstallationLease(lease);
      if (!lease.isCurrent())
        throw new Error("Installation resources became unavailable");
      return ownedTransaction(async () => {
        const current = await guard(command);
        if (current.fact.kind !== "readyInactive") return current.fact;
        if (
          canonical(await witness(command.target.courseId)) !==
          canonical(command.expected)
        )
          return reject(command, current.fact, "activationChanged");
        if (!(await canActivate()))
          throw new Error("Installation recovery must finish");
        requireInstallationLease(lease);
        if (!lease.isCurrent())
          throw new Error("Installation resources became unavailable");
        const revision = parseCounter("0");
        await db
          .insert(schema.courseActivation)
          .values({
            courseId: command.target.courseId,
            activePackageHash: material.teaching.key,
            fallbackPackageHash: null,
            revision,
          })
          .run();
        const fact = parseInstallationFact({
          version: 1,
          installationId: command.installationId,
          commandId: command.commandId,
          payloadHash: current.fact.payloadHash,
          kind: "activated",
          registeredPackageHash: material.teaching.key,
          activationRevision: revision,
        });
        await save(command, fact);
        live();
        requireInstallationLease(lease);
        if (!lease.isCurrent())
          throw new Error("Installation resources became unavailable");
        return fact;
      }, lease);
    });
  }
  function schedule(command: InitialInstallCommand) {
    const key = identityKey(command);
    if (running.has(key)) return;
    const inspectionId = `installation-inspection-${++inspection}`;
    observations.set(key, { kind: "checking", inspectionId });
    const runner = Promise.resolve()
      .then(async () => {
        const current = await exclusive(() => guard(command));
        if (
          current.fact.kind === "activated" ||
          current.fact.kind === "rejected"
        )
          return;
        const raw =
          current.fact.kind === "accepted"
            ? await materials.acquire(command.target.publicationHash)
            : await exclusive(async () => {
                const ready = await guard(command);
                if (ready.fact.kind !== "readyInactive")
                  throw new Error("Installation stage changed");
                const row = (
                  await db
                    .select()
                    .from(schema.installedPackage)
                    .where(
                      eq(
                        schema.installedPackage.packageHash,
                        ready.fact.registeredPackageHash,
                      ),
                    )
                    .all()
                )[0];
                if (!row || row.state !== "ready")
                  throw new Error("Registered installation is unavailable");
                return Uint8Array.from(row.verifiedManifest);
              });
        if (current.fact.kind === "accepted")
          await materials.withContent(raw, (material) =>
            register(command, material),
          );
        const next = await exclusive(() => guard(command));
        if (next.fact.kind !== "readyInactive") return;
        await materials.withVerified(raw, (material, lease) => {
          if (
            material.teaching.identity.hash !==
              command.target.publicationHash ||
            material.teaching.body.courseId !== command.target.courseId ||
            material.teaching.body.releaseId !== command.target.releaseId
          )
            throw new Error("Registered installation identity changed");
          return activate(command, material, lease);
        });
        await exclusive(refresh);
        if (options.lifetime.isCurrent())
          observations.set(key, { kind: "stale", last: "verified" });
      })
      .catch(async (error: unknown) => {
        if (
          error instanceof UnsupportedInstallProfileError &&
          options.lifetime.isCurrent()
        ) {
          try {
            await exclusive(async () =>
              ownedTransaction(async () => {
                const current = await guard(command);
                if (
                  current.fact.kind === "accepted" ||
                  current.fact.kind === "readyInactive"
                )
                  await reject(
                    command,
                    current.fact,
                    "unsupportedInstallProfile",
                  );
                live();
              }),
            );
          } catch {}
        }
        if (options.lifetime.isCurrent())
          observations.set(key, {
            kind: "stale",
            last:
              error instanceof PublicationResourceError ||
              error instanceof ShellError
                ? error.failure.kind
                : "unavailable",
          });
      })
      .finally(() => {
        if (running.get(key) === runner) {
          running.delete(key);
          const observation = observations.get(key);
          if (
            observation?.kind === "checking" &&
            observation.inspectionId === inspectionId
          )
            observations.set(key, { kind: "notChecked" });
        }
      });
    running.set(key, runner);
  }
  async function initialInstall(
    input: InitialInstallCommand,
  ): Promise<InstallationRead> {
    const command = parseInitialInstallCommand(input);
    await identify(command);
    const result = await exclusive(async () => {
      await initialize();
      const old = await retained(command);
      if (old) return old;
      live();
      if (command.installationId !== (await installationId()))
        throw new Error("Installation identity changed");
      if (
        command.target.courseId !== options.courseId ||
        command.source.mode !== options.mode
      )
        throw new Error("Installation source is unsupported");
      return ownedTransaction(async () => {
        const identity = await identify(command);
        const fact = parseInstallationFact({
          version: 1,
          installationId: command.installationId,
          commandId: command.commandId,
          payloadHash: identity.payloadHash,
          kind: "accepted",
          targetPackageHash: parseHash({
            kind: "package",
            value: command.target.publicationHash,
          }),
        });
        await save(command, fact);
        const actual = await witness(command.target.courseId);
        if (canonical(actual) !== canonical(command.expected))
          await reject(command, fact, "activationChanged");
        else if (actual.kind === "present")
          await reject(command, fact, "courseAlreadyActive");
        const saved = await retained(command);
        if (!saved) throw new Error("Installation receipt absent");
        return saved;
      });
    });
    if (result.fact.kind === "accepted" || result.fact.kind === "readyInactive")
      schedule(command);
    return result;
  }
  async function installations() {
    return exclusive(async () => {
      if (!options.lifetime.isCurrent()) observations.clear();
      await initialize();
      const id = await installationId();
      const rows = await db.select().from(schema.installationCommand).all();
      const commands: InstallationRead[] = [];
      for (const row of rows) {
        const read = await retained(
          parseInitialInstallCommand(JSON.parse(row.command)),
        );
        if (!read || read.command.installationId !== id)
          throw new Error("Installation ledger owner changed");
        commands.push(read);
      }
      return {
        installationId: id,
        courses: [
          {
            courseId: options.courseId,
            activation: await witness(options.courseId),
          },
        ],
        commands,
      };
    });
  }
  return { initialInstall, installations };
}
