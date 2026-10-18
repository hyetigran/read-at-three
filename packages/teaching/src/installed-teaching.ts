import { canonical, deepFreeze } from "./identity.ts";
import {
  packageMetadata,
  parseRuntimePackage,
  resolvedLessons,
} from "./course-content.ts";
import type { RuntimePackage } from "./course-content.ts";
import {
  decodePublicationUtf8,
  publicationLimits,
  publicationUtf8,
  verifyPublicationResource,
} from "./publication.ts";
import type {
  PublicationCrypto,
  PublicationHash,
  VerifiedPublication,
} from "./publication.ts";
import type { HashFunction, PackageHash } from "./types.ts";

export type CurriculumFileHash = string & {
  readonly __brand: "CurriculumFileHash";
};
export type InstalledTeaching =
  | Readonly<{
      kind: "development-v1";
      identity: Readonly<{ kind: "development-v1"; hash: PackageHash }>;
      document: RuntimePackage;
      body: RuntimePackage["body"];
    }>
  | Readonly<{
      kind: "signed-v1";
      identity: Readonly<{ kind: "signed-v1"; hash: PublicationHash }>;
      publication: VerifiedPublication;
      curriculumFile: Readonly<{
        sha256: CurriculumFileHash;
        byteLength: number;
        utf8: string;
      }>;
      document: RuntimePackage;
      body: RuntimePackage["body"];
    }>;
export class InstalledTeachingError extends Error {
  constructor(readonly reason: "invalid" | "unavailable" = "invalid") {
    super(
      reason === "invalid"
        ? "Installed teaching content is invalid."
        : "Installed teaching verification is unavailable.",
    );
    this.name = "InstalledTeachingError";
  }
}
function curriculumJson(text: string): unknown {
  let depth = 0,
    quoted = false,
    escaped = false;
  for (const character of text) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
    } else if (character === '"') quoted = true;
    else if (character === "{" || character === "[") {
      if (++depth > publicationLimits.depth) throw new InstalledTeachingError();
    } else if (character === "}" || character === "]") depth--;
  }
  const value: unknown = JSON.parse(text);
  function requireScalars(item: unknown): void {
    if (typeof item === "string") publicationUtf8(item);
    else if (Array.isArray(item)) item.forEach(requireScalars);
    else if (item !== null && typeof item === "object")
      for (const [key, child] of Object.entries(item)) {
        publicationUtf8(key);
        requireScalars(child);
      }
  }
  requireScalars(value);
  return value;
}
export async function parseSignedInstalledTeaching(
  input: Readonly<{
    publication: VerifiedPublication;
    curriculum: Uint8Array;
    crypto: PublicationCrypto;
  }>,
): Promise<Extract<InstalledTeaching, { kind: "signed-v1" }>> {
  try {
    const manifest = input.publication.envelope.body;
    if (
      input.curriculum.byteLength === 0 ||
      input.curriculum.byteLength > publicationLimits.curriculumBytes ||
      input.curriculum.byteLength !== manifest.curriculum.byteLength
    )
      throw new InstalledTeachingError();
    const bytes = Uint8Array.from(input.curriculum);
    const crypto: PublicationCrypto = {
      ...input.crypto,
      sha256: async (value) => {
        try {
          return await input.crypto.sha256(value);
        } catch {
          throw new InstalledTeachingError("unavailable");
        }
      },
    };
    await verifyPublicationResource({
      publication: input.publication,
      path: manifest.curriculum.path,
      bytes,
      crypto,
    });
    const utf8 = decodePublicationUtf8(bytes);
    const document = await parseRuntimePackage(
      curriculumJson(utf8),
      async (text) => {
        const digest = await crypto.sha256(publicationUtf8(text));
        if (digest.length !== 32) throw new InstalledTeachingError();
        return Array.from(digest, (byte) =>
          byte.toString(16).padStart(2, "0"),
        ).join("");
      },
    );
    const metadata = packageMetadata(document);
    if (
      document.body.courseId !== manifest.courseId ||
      document.body.releaseId !== manifest.releaseId ||
      metadata.contentSchemaVersion !== manifest.contentSchemaVersion ||
      canonical([...metadata.capabilities].sort()) !==
        canonical([...manifest.requiredEngineCapabilities].sort()) ||
      canonical(resolvedLessons(document).map((lesson) => lesson.lessonId)) !==
        canonical(manifest.lessonIds) ||
      manifest.compatibilityMappings.length !== 0 ||
      manifest.progressMappings.length !== 0
    )
      throw new InstalledTeachingError();
    return deepFreeze({
      kind: "signed-v1",
      identity: { kind: "signed-v1", hash: input.publication.hash },
      publication: input.publication,
      curriculumFile: {
        sha256: manifest.curriculum.sha256 as CurriculumFileHash,
        byteLength: bytes.length,
        utf8,
      },
      document,
      body: document.body,
    });
  } catch (error) {
    if (error instanceof InstalledTeachingError) throw error;
    throw new InstalledTeachingError();
  }
}
export async function parseDevelopmentInstalledTeaching(
  input: Readonly<{ document: unknown; hash: HashFunction }>,
): Promise<Extract<InstalledTeaching, { kind: "development-v1" }>> {
  try {
    const document = await parseRuntimePackage(input.document, async (text) => {
      try {
        return await input.hash(text);
      } catch {
        throw new InstalledTeachingError("unavailable");
      }
    });
    return deepFreeze({
      kind: "development-v1",
      identity: { kind: "development-v1", hash: document.packageHash },
      document,
      body: document.body,
    });
  } catch (error) {
    if (error instanceof InstalledTeachingError) throw error;
    throw new InstalledTeachingError();
  }
}
