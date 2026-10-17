import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

export function developmentContent(): Plugin {
  const mode = process.env.READING_CONTENT_MODE ?? "local";
  if (mode !== "local" && mode !== "fixture")
    throw new Error("Select local or explicit fixture content mode.");
  const variant = process.env.READING_CONTENT_VARIANT ?? "continuous";
  if (
    variant !== "continuous" &&
    variant !== "oral" &&
    variant !== "graph" &&
    variant !== "legacy"
  )
    throw new Error(
      "Select continuous, oral, graph or legacy development content variant.",
    );
  const filenames = {
    continuous: "continuous-development-package.json",
    oral: "oral-development-package.json",
    graph: "graph-development-package.json",
    legacy: "development-package.json",
  };
  const path = resolve(
    import.meta.dirname,
    "../..",
    mode === "fixture" ? "tests/fixtures" : ".local/runtime",
    filenames[variant],
  );
  return {
    name: "explicit-development-content",
    configureServer(server) {
      server.middlewares.use(
        "/curriculum/development.json",
        (_request, response) => {
          response.setHeader("Content-Type", "application/json");
          response.setHeader("Cache-Control", "no-store");
          try {
            response.end(readFileSync(path));
          } catch {
            response.statusCode = 404;
            response.end(
              JSON.stringify({ code: "development-content-missing" }),
            );
          }
        },
      );
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "curriculum/development.json",
        source: readFileSync(path),
      });
    },
  };
}
