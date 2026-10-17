import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { canonical, parsePreparationPackage } from "@readatthree/teaching";
import { createFixturePreparationPackage } from "./preparation.ts";

export type PreparationResource = Readonly<{
  mediaType: string;
  source: string;
}>;
export async function preparationResources(input: {
  mode: "local" | "fixture";
  root: string;
}): Promise<ReadonlyMap<string, PreparationResource>> {
  const result = new Map<string, PreparationResource>();
  let unavailable: "missing" | "invalid" = "invalid";
  try {
    const document =
      input.mode === "fixture"
        ? await createFixturePreparationPackage()
        : await (async () => {
            let text: string;
            try {
              text = await readFile(
                resolve(
                  input.root,
                  ".local/preparation/preparation-package.json",
                ),
                "utf8",
              );
            } catch (error) {
              if (
                error instanceof Error &&
                "code" in error &&
                error.code === "ENOENT"
              )
                unavailable = "missing";
              throw error;
            }
            if (text.length > 196608)
              throw new Error("Preparation resource is too large.");
            const value: unknown = JSON.parse(text);
            return parsePreparationPackage(value, async (text) =>
              createHash("sha256").update(text).digest("hex"),
            );
          })();
    result.set("/preparation/development.json", {
      mediaType: "application/json",
      source: canonical({ kind: "available", package: document }),
    });
    for (const asset of document.assets)
      result.set(`/preparation/${asset.path}`, {
        mediaType: "image/svg+xml",
        source: asset.svg,
      });
  } catch {
    result.clear();
    result.set("/preparation/development.json", {
      mediaType: "application/json",
      source: canonical({ kind: "unavailable", reason: unavailable }),
    });
  }
  return result;
}
