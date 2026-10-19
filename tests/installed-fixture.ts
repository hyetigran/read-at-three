import { parseDevelopmentInstalledTeaching } from "../packages/teaching/src/installed-teaching.ts";
import type { RuntimePackage } from "../packages/teaching/src/course-content.ts";
import type { HashFunction } from "../packages/teaching/src/types.ts";

export async function installedFixture<T extends RuntimePackage>(
  document: T,
  hash: HashFunction,
) {
  const installed = await parseDevelopmentInstalledTeaching({ document, hash });
  return { ...installed, document, body: document.body };
}
