import { and, eq } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  canonical,
  createInstallationMaterials,
  parseHash,
  parseId,
  requireInstallationLease,
} from "../../teaching/src/index.ts";
import type {
  CommandId,
  HashFunction,
  InstallationId,
  InstallationLease,
  InstalledApplicationOptions,
  PackageHash,
  SignedInstallMaterial,
} from "../../teaching/src/index.ts";
import type { SqlExecutor } from "./executor.ts";
import { transaction } from "./migration.ts";
import * as schema from "./schema.ts";

export type PackageHoldOwner =
  | Readonly<{
      kind: "rollback";
      installationId: InstallationId;
      commandId: CommandId;
    }>
  | Readonly<{ kind: "export" | "restore"; operationId: string }>;
const reservation = Symbol("owned package snapshot");
export type PackageSnapshot<T> = Readonly<{
  [reservation]: true;
  snapshot: T;
  packages: readonly PackageHash[];
}>;
function ownerKey(owner: PackageHoldOwner) {
  return owner.kind === "rollback"
    ? canonical([
        owner.kind,
        parseId({ kind: "installation", value: owner.installationId }),
        parseId({ kind: "command", value: owner.commandId }),
      ])
    : canonical([
        owner.kind,
        parseId({ kind: "command", value: owner.operationId }),
      ]);
}
function snapshotKey(value: unknown) {
  return canonical(
    JSON.parse(
      JSON.stringify(value, (_key, item: unknown) =>
        typeof item === "bigint"
          ? { sqliteInteger: item.toString() }
          : item instanceof Uint8Array
            ? { sqliteBlob: [...item] }
            : item,
      ),
    ),
  );
}
export function createPackageHolds({
  db,
  executor,
  hash,
  options,
  exclusive,
  validateRetained,
}: Readonly<{
  db: ReturnType<typeof drizzle>;
  executor: SqlExecutor;
  hash: HashFunction;
  options: InstalledApplicationOptions;
  exclusive<T>(work: () => Promise<T>): Promise<T>;
  validateRetained(): Promise<void>;
}>) {
  const material = createInstallationMaterials(options, hash);
  const issued = new WeakMap<
    object,
    Readonly<{
      owner: PackageHoldOwner;
      ownerId: string;
      witness: string;
      capture(): Promise<
        Readonly<{ snapshot: unknown; packages: readonly PackageHash[] }>
      >;
    }>
  >();
  const active = new Map<string, Set<object>>();
  function current() {
    material.cancellation.throwIfCancelled();
  }
  function packageKeys(values: readonly PackageHash[]) {
    return [
      ...new Set(
        values.map((key) => parseHash({ kind: "package", value: key })),
      ),
    ].sort();
  }
  async function reserveSnapshot<T>(
    owner: PackageHoldOwner,
    capture: () => Promise<
      Readonly<{ snapshot: T; packages: readonly PackageHash[] }>
    >,
  ): Promise<PackageSnapshot<T>> {
    const ownerId = ownerKey(owner);
    return exclusive(() =>
      transaction(
        executor,
        async () => {
          current();
          await validateRetained();
          const value = await capture(),
            packages = packageKeys(value.packages);
          const previous = await db
            .select()
            .from(schema.packageHold)
            .where(
              and(
                eq(schema.packageHold.ownerKind, owner.kind),
                eq(schema.packageHold.ownerId, ownerId),
              ),
            )
            .all();
          if (
            previous.length &&
            canonical(previous.map((row) => row.packageHash).sort()) !==
              canonical(packages)
          )
            throw new Error("Snapshot owner changed its reserved package set");
          for (const packageHash of packages)
            await db
              .insert(schema.packageHold)
              .values({ ownerKind: owner.kind, ownerId, packageHash })
              .onConflictDoNothing()
              .run();
          const held: PackageSnapshot<T> = Object.freeze({
            [reservation]: true,
            snapshot: value.snapshot,
            packages: Object.freeze(packages),
          });
          issued.set(held, {
            owner,
            ownerId,
            witness: snapshotKey(value.snapshot),
            capture,
          });
          const reservations = active.get(ownerId) ?? new Set();
          reservations.add(held);
          active.set(ownerId, reservations);
          return held;
        },
        current,
      ),
    );
  }
  async function withReservedMaterial<T, R>(
    held: PackageSnapshot<T>,
    use: (
      snapshot: T,
      materials: readonly SignedInstallMaterial[],
      lease: InstallationLease,
    ) => Promise<R>,
  ) {
    const proof = issued.get(held);
    if (!proof || snapshotKey(held.snapshot) !== proof.witness)
      throw new Error(
        "Material requires an unchanged owned snapshot reservation",
      );
    current();
    const envelopes = await exclusive(async () => {
      const values = [];
      for (const key of held.packages) {
        const rows = await db
          .select()
          .from(schema.installedPackage)
          .where(eq(schema.installedPackage.packageHash, key))
          .all();
        const row = rows[0];
        const representation = (
          await db
            .select()
            .from(schema.installedRepresentation)
            .where(eq(schema.installedRepresentation.packageHash, key))
            .all()
        )[0];
        if (
          !row ||
          representation?.kind !== "signed-v1" ||
          representation.mode !== options.mode
        )
          throw new Error(
            "Reserved authenticated representation is unavailable",
          );
        values.push(Uint8Array.from(row.verifiedManifest));
      }
      return values;
    });
    return material.withVerifiedBatch(envelopes, async (materials, lease) => {
      await exclusive(async () => {
        current();
        requireInstallationLease(lease);
        await validateRetained();
        if (!issued.has(held) || snapshotKey(held.snapshot) !== proof.witness)
          throw new Error("Snapshot reservation was released or changed");
        const rows = await db
          .select()
          .from(schema.packageHold)
          .where(
            and(
              eq(schema.packageHold.ownerKind, proof.owner.kind),
              eq(schema.packageHold.ownerId, proof.ownerId),
            ),
          )
          .all();
        if (
          canonical(rows.map((row) => row.packageHash).sort()) !==
          canonical(held.packages)
        )
          throw new Error("Durable snapshot holds changed");
        const value = await proof.capture();
        if (
          snapshotKey(value.snapshot) !== proof.witness ||
          canonical(packageKeys(value.packages)) !== canonical(held.packages) ||
          canonical(materials.map((item) => item.teaching.key)) !==
            canonical(held.packages)
        )
          throw new Error("Reserved snapshot changed before material use");
      });
      return use(held.snapshot, materials, lease);
    });
  }
  async function release(owner: PackageHoldOwner) {
    const ownerId = ownerKey(owner);
    await exclusive(() =>
      transaction(
        executor,
        async () => {
          current();
          await db
            .delete(schema.packageHold)
            .where(
              and(
                eq(schema.packageHold.ownerKind, owner.kind),
                eq(schema.packageHold.ownerId, ownerId),
              ),
            )
            .run();
        },
        current,
      ),
    );
    for (const held of active.get(ownerId) ?? []) issued.delete(held);
    active.delete(ownerId);
  }
  return { reserveSnapshot, withReservedMaterial, release };
}
