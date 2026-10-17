import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { preparationResources } from "./preparation-resources.ts";

export function developmentContent(): Plugin {
  const mode = process.env.READING_CONTENT_MODE ?? "local";
  if (mode !== "local" && mode !== "fixture")
    throw new Error("Select local or explicit fixture content mode.");
  const variant = process.env.READING_CONTENT_VARIANT ?? "course";
  if (
    variant !== "course" &&
    variant !== "writing" &&
    variant !== "continuous" &&
    variant !== "oral" &&
    variant !== "graph" &&
    variant !== "legacy"
  )
    throw new Error(
      "Select course, writing, continuous, oral, graph or legacy development content variant.",
    );
  const filenames = {
    course: "course-development-package.json",
    writing: "writing-development-package.json",
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
  const root = resolve(import.meta.dirname, "../..");
  const preparation = () => preparationResources({ mode, root });
  return {
    name: "explicit-development-content",
    configureServer(server) {
      server.middlewares.use("/preparation", (request, response) => {
        void preparation().then((resources) => {
          const resource = resources.get(`/preparation${request.url ?? ""}`);
          response.setHeader("Cache-Control", "no-store");
          response.setHeader("X-Content-Type-Options", "nosniff");
          if (!resource) {
            response.statusCode = 404;
            response.end();
            return;
          }
          response.setHeader("Content-Type", resource.mediaType);
          response.end(resource.source);
        });
      });
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
    async generateBundle() {
      for (const [path, resource] of await preparation())
        this.emitFile({
          type: "asset",
          fileName: path.slice(1),
          source: resource.source,
        });
      this.emitFile({
        type: "asset",
        fileName: "curriculum/development.json",
        source: readFileSync(path),
      });
    },
  };
}
