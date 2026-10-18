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

const originalAcquisition = `				async acquireAccessHandles(clearFiles = false) {
					const files = [];
					for await (const [name, h] of this.#dhOpaque) if ("file" === h.kind) files.push([name, h]);
					return Promise.all(files.map(async ([name, h]) => {
						try {
							const ah = await h.createSyncAccessHandle();
							this.#mapSAHToName.set(ah, name);
							if (clearFiles) {
								ah.truncate(HEADER_OFFSET_DATA);
								this.setAssociatedPath(ah, "", 0);
							} else {
								const path = this.getAssociatedPath(ah);
								if (path) this.#mapFilenameToSAH.set(path, ah);
								else this.#availableSAH.add(ah);
							}
						} catch (e) {
							this.storeErr(e);
							this.releaseAccessHandles();
							throw e;
						}
					}));
				}`;
const preservingAcquisition = `				async acquireAccessHandles(clearFiles = false) {
					const files = [];
					for await (const [name, h] of this.#dhOpaque) if ("file" === h.kind) files.push([name, h]);
					const acquired = [];
					const outcomes = await Promise.allSettled(files.map(async ([name, h]) => {
						const ah = await h.createSyncAccessHandle();
						acquired.push([name, ah]);
					}));
					for (const [name, ah] of acquired) this.#mapSAHToName.set(ah, name);
					try {
						const failed = outcomes.find((result) => result.status === "rejected");
						if (failed) throw failed.reason;
						for (const [, ah] of acquired) {
							if (clearFiles) {
								ah.truncate(HEADER_OFFSET_DATA);
								this.setAssociatedPath(ah, "", 0);
							} else {
								const path = this.getAssociatedPath(ah);
								if (path) this.#mapFilenameToSAH.set(path, ah);
								else this.#availableSAH.add(ah);
							}
						}
						return outcomes.map(() => undefined);
					} catch (e) {
						this.storeErr(e);
						this.releaseAccessHandles();
						throw e;
					}
				}`;

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
  if (source.split(originalAcquisition).length !== 2) {
    throw new Error(
      "The pinned SQLite handle acquisition must match exactly once.",
    );
  }
  return {
    name: "preserve-sqlite-files-on-initialization-failure",
    enforce: "pre",
    transform(code, id) {
      if (id.split("?", 1)[0] !== artifact) return;
      if (
        code.split(destructiveCleanup).length !== 2 ||
        code.split(originalAcquisition).length !== 2
      ) {
        throw new Error(
          "SQLite preservation transform encountered an unexpected artifact.",
        );
      }
      return {
        code: code
          .replace(destructiveCleanup, preservingCleanup)
          .replace(originalAcquisition, preservingAcquisition),
        map: null,
      };
    },
  };
}
