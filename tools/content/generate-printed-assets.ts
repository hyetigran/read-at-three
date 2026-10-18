import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { canonical } from "../../packages/teaching/src/identity.ts";
import { lessonFivePrintedAssetPayload } from "../../packages/teaching/src/printed-assets.ts";
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--check"))
  throw Error("Usage: generate-printed-assets.ts [--check]");
const hash = createHash("sha256")
  .update(canonical(lessonFivePrintedAssetPayload))
  .digest("hex");
const path = new URL(
  "../../packages/teaching/src/generated-lesson-five-asset-hash.ts",
  import.meta.url,
);
const expected = `export const lessonFivePrintedAssetHash =\n  "${hash}";\n`;
if (args.includes("--check")) {
  if ((await readFile(path, "utf8")) !== expected)
    throw Error("Printed asset identity is stale");
} else await writeFile(path, expected);
console.log("Complete Lesson five printed asset identity", hash);
