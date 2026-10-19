import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { developmentContent } from "../../tools/content/vite-content.ts";
import { shellResponsePolicy } from "./src/platform/shell-response-policy.ts";
import { preserveSqliteFiles } from "../../tools/sqlite/preserve-files.ts";

function installedDevelopmentBoundary(mode: string): Plugin {
  const development = fileURLToPath(
    new URL("./src/platform/development-opening.ts", import.meta.url),
  );
  const disabled = fileURLToPath(
    new URL("./src/platform/disabled-development.ts", import.meta.url),
  );
  return {
    name: "explicit-installed-development-boundary",
    enforce: "pre",
    resolveId(source, importer) {
      if (
        mode === "signed-shell" &&
        importer &&
        source.startsWith(".") &&
        resolve(dirname(importer), source) === development
      )
        return disabled;
    },
  };
}
export default defineConfig(({ mode }) => ({
  root: fileURLToPath(new URL(".", import.meta.url)),
  define: {
    __READING_BROWSER_CONFIGURATION__: JSON.stringify({ kind: "development" }),
  },
  plugins: [
    installedDevelopmentBoundary(mode),
    react(),
    tailwindcss(),
    ...(mode === "signed-shell" ? [] : [developmentContent()]),
    preserveSqliteFiles(),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  optimizeDeps: { exclude: ["@sqlite.org/sqlite-wasm"] },
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
    headers: shellResponsePolicy,
  },
  build: { outDir: "../../dist/web", emptyOutDir: true },
  worker: {
    format: "es",
    plugins: () => [installedDevelopmentBoundary(mode), preserveSqliteFiles()],
  },
}));
