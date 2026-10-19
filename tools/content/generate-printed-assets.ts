import { lessonSixAssetPayload } from "../../packages/teaching/src/lesson-six-assets.ts";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { canonical } from "../../packages/teaching/src/identity.ts";
import { lessonFivePrintedAssetPayload } from "../../packages/teaching/src/printed-assets.ts";
import { lessonFiveCompletionAssetPayload } from "../../packages/teaching/src/lesson-five-completion-assets.ts";
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

const completionHash = createHash("sha256")
  .update(canonical(lessonFiveCompletionAssetPayload))
  .digest("hex");
const completionPath = new URL(
  "../../packages/teaching/src/generated-lesson-five-completion-asset-hash.ts",
  import.meta.url,
);
const completionExpected = `export const lessonFiveCompletionAssetHash =\n  "${completionHash}";\n`;
if (args.includes("--check")) {
  if ((await readFile(completionPath, "utf8")) !== completionExpected)
    throw Error("Completion asset identity is stale");
} else await writeFile(completionPath, completionExpected);

const lessonSixHash = createHash("sha256")
  .update(canonical(lessonSixAssetPayload))
  .digest("hex");
const lessonSixPath = new URL(
  "../../packages/teaching/src/generated-lesson-six-asset-hash.ts",
  import.meta.url,
);
const lessonSixExpected = `export const lessonSixAssetHash =\n  "${lessonSixHash}";\n`;
if (args.includes("--check")) {
  if ((await readFile(lessonSixPath, "utf8")) !== lessonSixExpected)
    throw Error("Lesson six asset identity is stale");
} else await writeFile(lessonSixPath, lessonSixExpected);
