import { defineConfig } from "@playwright/test";

const build = process.env.READING_BROWSER_BUILD === "1";
const port = build ? 5175 : 5174;

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 15000 },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
  },
  reporter: process.env.CI ? "github" : "list",
  webServer: {
    command: build
      ? "npm run build && npm run preview -- --port 5175"
      : "npm run dev -- --port 5174",
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    env: { READING_CONTENT_MODE: "fixture" },
  },
});
