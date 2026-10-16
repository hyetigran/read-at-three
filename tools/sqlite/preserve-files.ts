import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { Plugin } from "vite";

const require = createRequire(import.meta.url);
const packageRoot = dirname(
  require.resolve("@sqlite.org/sqlite-wasm/package.json"),
);
const artifact = join(packageRoot, "dist/index.mjs");
const expectedHash =
  "a6d3fe46aa3f924e7686329f97b0564549ef1f787e0c19924179aef7f72bcc01";
const destructiveCleanup = "await thePool.removeVfs().catch(() => {});";
const preservingCleanup = "thePool.releaseAccessHandles();";

export function preserveSqliteFiles(): Plugin {
  const source = readFileSync(artifact, "utf8");
  if (createHash("sha256").update(source).digest("hex") !== expectedHash) {
    throw new Error(
      "Review the SQLite initialization-preservation patch before upgrading the pinned artifact.",
    );
  }
  if (source.split(destructiveCleanup).length !== 2) {
    throw new Error(
      "The pinned SQLite initialization cleanup must match exactly once.",
    );
  }
  return {
    name: "preserve-sqlite-files-on-initialization-failure",
    enforce: "pre",
    transform(code, id) {
      if (id.split("?", 1)[0] !== artifact) return;
      if (!code.includes(destructiveCleanup)) {
        throw new Error(
          "SQLite preservation transform encountered an unexpected artifact.",
        );
      }
      return {
        code: code.replace(destructiveCleanup, preservingCleanup),
        map: null,
      };
    },
  };
}
