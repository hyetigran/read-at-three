import {
  canonical,
  parseDevelopmentInstalledTeaching,
  parseInstallMaterial,
  packageMetadata,
} from "../../teaching/src/index.ts";
import type {
  InstalledTeaching,
  InstalledApplicationOptions,
  SignedInstallMaterial,
  HashFunction,
  PackageHash,
} from "../../teaching/src/index.ts";
import type { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema.ts";
import { decodeUtf8 } from "./utf8.ts";
export async function readInstalledPackages({
  db,
  hash,
  installed,
  historical = false,
}: Readonly<{
  db: ReturnType<typeof drizzle>;
  hash: HashFunction;
  installed: InstalledApplicationOptions | undefined;
  historical?: boolean;
}>) {
  const verified = new Map<PackageHash, InstalledTeaching>();
  const signed = new Map<PackageHash, SignedInstallMaterial>();
  const rows = await db.select().from(schema.installedPackage).all();
  const representations = historical
    ? []
    : await db.select().from(schema.installedRepresentation).all();
  if (
    !historical &&
    (rows.length !== representations.length ||
      representations.some(
        (rep) => !rows.some((row) => row.packageHash === rep.packageHash),
      ))
  )
    throw new Error("Installed representation inventory is incomplete");
  for (const row of rows) {
    const rep = representations.find(
      (item) => item.packageHash === row.packageHash,
    );
    if (!historical && !rep)
      throw new Error("Installed representation is missing");
    if (row.state !== "ready") continue;
    let value: InstalledTeaching;
    if (historical || rep?.kind === "development-v1") {
      if (
        rep &&
        (rep.mode !== null ||
          rep.curriculumUtf8 !== null ||
          rep.preparationUtf8 !== null)
      )
        throw new Error("Development representation is inconsistent");
      value = await parseDevelopmentInstalledTeaching({
        document: JSON.parse(decodeUtf8(row.verifiedManifest)),
        hash,
      });
    } else {
      if (
        !installed ||
        !rep ||
        rep.kind !== "signed-v1" ||
        rep.mode !== installed.mode ||
        !rep.curriculumUtf8 ||
        !rep.preparationUtf8
      )
        throw new Error("Signed installed representation is unavailable");
      const material = await parseInstallMaterial({
        envelope: row.verifiedManifest,
        curriculum: rep.curriculumUtf8,
        preparationBytes: rep.preparationUtf8,
        keys: installed.keys,
        crypto: installed.crypto,
        hash,
      });
      value = material.teaching;
      signed.set(value.key, material);
    }
    const metadata = packageMetadata(value.document);
    if (
      value.key !== row.packageHash ||
      value.body.courseId !== row.courseId ||
      value.body.releaseId !== row.releaseId ||
      row.storageKey !== value.key ||
      canonical(metadata.capabilities) !== row.capabilities ||
      metadata.contentSchemaVersion !== Number(row.contentSchemaVersion) ||
      Number(row.manifestVersion) !== 1
    )
      throw new Error(
        "Installed package metadata does not match verified bytes",
      );
    verified.set(value.key, value);
  }
  return { verified, signed };
}
