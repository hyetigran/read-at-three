import { and, eq } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  increment,
  parseCounter,
  parsePublicationHash,
  publicationCatalogLimits,
} from "../../teaching/src/index.ts";
import type {
  HashFunction,
  InstalledApplicationOptions,
  PackageHash,
} from "../../teaching/src/index.ts";
import { issueCollectionClaim } from "./collection-claims.ts";
import type { SqlExecutor } from "./executor.ts";
import { transaction, verifyCurrentDatabase } from "./migration.ts";
import * as schema from "./schema.ts";

export function createPackageCollection({
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
  function current() {
    if (!options.lifetime.isCurrent())
      throw new Error("Collection connection was retired");
  }
  async function rooted(key: PackageHash) {
    return (
      (
        await executor.execute(
          "SELECT 1 FROM package_retention WHERE package_hash = ? LIMIT 1",
          [key],
        )
      ).rows.length !== 0
    );
  }
  async function verify() {
    current();
    await verifyCurrentDatabase(executor, hash, current);
    await validateRetained();
    current();
  }
  async function collect(key: PackageHash): Promise<"retained" | "collected"> {
    return options.resources.exclusive({
      mode: options.mode,
      hash: parsePublicationHash(key),
      run: async (namespace) => {
        if (!namespace.erase)
          throw new Error("Owned namespace collection is unavailable");
        let held = true;
        try {
          const revision = await exclusive(async () => {
            await verify();
            return transaction(
              executor,
              async () => {
                if (await rooted(key)) return null;
                const previous = (
                  await db
                    .select()
                    .from(schema.packageCollection)
                    .where(eq(schema.packageCollection.packageHash, key))
                    .all()
                )[0];
                if (previous?.state === "collecting") return previous.revision;
                const revision = previous
                  ? increment(previous.revision)
                  : parseCounter("0");
                await db
                  .insert(schema.packageCollection)
                  .values({ packageHash: key, revision, state: "collecting" })
                  .onConflictDoUpdate({
                    target: schema.packageCollection.packageHash,
                    set: { revision, state: "collecting" },
                  })
                  .run();
                return revision;
              },
              current,
            );
          });
          if (revision === null) return "retained";
          async function validate() {
            current();
            if (!held) throw new Error("Collection hash lock was released");
            await verifyCurrentDatabase(executor, hash, current);
            const row = (
              await db
                .select()
                .from(schema.packageCollection)
                .where(eq(schema.packageCollection.packageHash, key))
                .all()
            )[0];
            if (
              !row ||
              row.state !== "collecting" ||
              row.revision !== revision ||
              (await rooted(key))
            )
              throw new Error("Collection tombstone is stale");
          }
          const owned = issueCollectionClaim({
            packageHash: key,
            tombstoneRevision: revision,
            mode: options.mode,
            current: () => held && options.lifetime.isCurrent(),
            validate: () => exclusive(validate),
          });
          try {
            await namespace.erase(owned.claim);
            await exclusive(() =>
              transaction(
                executor,
                async () => {
                  await validate();
                  await db
                    .update(schema.installedPackage)
                    .set({ state: "metadataOnly", storageKey: null })
                    .where(eq(schema.installedPackage.packageHash, key))
                    .run();
                  await db
                    .update(schema.packageCollection)
                    .set({ state: "complete" })
                    .where(
                      and(
                        eq(schema.packageCollection.packageHash, key),
                        eq(schema.packageCollection.revision, revision),
                      ),
                    )
                    .run();
                },
                current,
              ),
            );
            return "collected";
          } finally {
            owned.revoke();
          }
        } finally {
          held = false;
        }
      },
    });
  }
  async function inventory() {
    current();
    if (!options.resources.inventory)
      throw new Error("Owned namespace inventory is unavailable");
    const keys = await options.resources.inventory({ mode: options.mode });
    if (
      keys.length > publicationCatalogLimits.namespaces ||
      new Set(keys).size !== keys.length
    )
      throw new Error("Owned namespace inventory exceeds its bounded contract");
    return keys.map((key) => parsePublicationHash(key)).sort();
  }
  return { collect, inventory };
}
