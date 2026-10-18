import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { developmentContent } from "../../tools/content/vite-content.ts";
import { preserveSqliteFiles } from "../../tools/sqlite/preserve-files.ts";

export default defineConfig(({ mode }) => ({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [
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
    headers: { "Service-Worker-Allowed": "/" },
  },
  build: { outDir: "../../dist/web", emptyOutDir: true },
  worker: { format: "es", plugins: () => [preserveSqliteFiles()] },
}));
