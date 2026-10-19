import {
  canonical,
  parseDevelopmentInstalledTeaching,
  parseInstallMaterial,
  packageMetadata,
  requireInstallMaterial,
  resolvedLessons,
} from "../../teaching/src/index.ts";
import type {
  InstalledTeaching,
  InstalledApplicationOptions,
  SignedInstallMaterial,
  HashFunction,
  PackageHash,
} from "../../teaching/src/index.ts";
import type { drizzle } from "drizzle-orm/sqlite-proxy";
import { and, eq } from "drizzle-orm";
import * as schema from "./schema.ts";
import { decodeUtf8, equalBytes } from "./utf8.ts";

const authenticatedMetadata = new WeakSet<InstalledTeaching>();
export type PackageFormatPolicy = Readonly<{
  contentSchemas: readonly number[];
  teachingStates: readonly number[];
  inkCodecs: readonly number[];
  capabilities: readonly string[];
}>;
export function updateCompatibility({
  current,
  candidate,
  policy,
}: Readonly<{
  current: InstalledTeaching;
  candidate: SignedInstallMaterial;
  policy: PackageFormatPolicy;
}>):
  | Readonly<{ kind: "compatible" }>
  | Readonly<{
      kind: "incompatible";
      reason: "course" | "catalog" | "taskIdentity" | "format" | "mapping";
    }> {
  if (!authenticatedMetadata.has(current))
    throw new Error("Compatibility requires authenticated retained metadata");
  requireInstallMaterial(candidate);
  const next = candidate.teaching;
  if (current.body.courseId !== next.body.courseId)
    return { kind: "incompatible", reason: "course" };
  const manifest = next.publication.envelope.body;
  if (manifest.compatibilityMappings.length || manifest.progressMappings.length)
    return { kind: "incompatible", reason: "mapping" };
  for (const document of [current.document, next.document]) {
    const metadata = packageMetadata(document);
    if (
      !policy.contentSchemas.includes(metadata.contentSchemaVersion) ||
      !policy.teachingStates.includes(1) ||
      !policy.inkCodecs.includes(1) ||
      metadata.capabilities.some(
        (capability) => !policy.capabilities.includes(capability),
      )
    )
      return { kind: "incompatible", reason: "format" };
  }
  const oldLessons = resolvedLessons(current.document);
  const newLessons = resolvedLessons(next.document);
  if (
    oldLessons.length > newLessons.length ||
    oldLessons.some(
      (lesson, index) =>
        lesson.lessonId !== newLessons[index]?.lessonId ||
        lesson.number !== newLessons[index]?.number,
    )
  )
    return { kind: "incompatible", reason: "catalog" };
  if (
    oldLessons.some((lesson, index) => {
      const updated = newLessons[index];
      return (
        !updated ||
        canonical(
          lesson.lessonTasks.map((task) => ({
            id: task.id,
            number: task.number,
            optional: task.optional,
          })),
        ) !==
          canonical(
            updated.lessonTasks.map((task) => ({
              id: task.id,
              number: task.number,
              optional: task.optional,
            })),
          )
      );
    })
  )
    return { kind: "incompatible", reason: "taskIdentity" };
  return { kind: "compatible" };
}

export async function registerSignedPackage({
  db,
  material,
  mode,
}: Readonly<{
  db: ReturnType<typeof drizzle>;
  material: SignedInstallMaterial;
  mode: InstalledApplicationOptions["mode"];
}>): Promise<
  "registered" | "releaseIdentityConflict" | "packageIdentityConflict"
> {
  requireInstallMaterial(material);
  const value = material.teaching;
  const collection = (
    await db
      .select()
      .from(schema.packageCollection)
      .where(eq(schema.packageCollection.packageHash, value.key))
      .all()
  )[0];
  if (collection?.state === "collecting") return "packageIdentityConflict";
  const metadata = packageMetadata(value.document);
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
    return "releaseIdentityConflict";
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
      base.courseId !== value.body.courseId ||
      base.releaseId !== value.body.releaseId ||
      Number(base.manifestVersion) !== 1 ||
      Number(base.contentSchemaVersion) !== metadata.contentSchemaVersion ||
      base.capabilities !== canonical(metadata.capabilities) ||
      !equalBytes(base.verifiedManifest, material.envelope) ||
      !rep ||
      rep.kind !== "signed-v1" ||
      rep.mode !== mode ||
      !rep.curriculumUtf8 ||
      !equalBytes(rep.curriculumUtf8, material.curriculum) ||
      !rep.preparationUtf8 ||
      !equalBytes(rep.preparationUtf8, material.preparationBytes)
    )
      return "packageIdentityConflict";
    if (base.state !== "ready" || base.storageKey !== value.key)
      await db
        .update(schema.installedPackage)
        .set({ state: "ready", storageKey: value.key })
        .where(eq(schema.installedPackage.packageHash, value.key))
        .run();
  } else {
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
        mode,
        curriculumUtf8: material.curriculum,
        preparationUtf8: material.preparationBytes,
      })
      .run();
  }
  return "registered";
}
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
      (row.storageKey !== null && row.storageKey !== value.key) ||
      (row.state === "ready" && row.storageKey === null) ||
      (row.state === "metadataOnly" && row.storageKey !== null) ||
      canonical(metadata.capabilities) !== row.capabilities ||
      metadata.contentSchemaVersion !== Number(row.contentSchemaVersion) ||
      Number(row.manifestVersion) !== 1
    )
      throw new Error(
        "Installed package metadata does not match verified bytes",
      );
    verified.set(value.key, value);
    authenticatedMetadata.add(value);
  }
  return { verified, signed };
}
