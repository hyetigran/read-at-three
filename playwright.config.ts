import { defineConfig } from "@playwright/test";

import {
  browserBuild as build,
  browserPort as port,
  browserBaseURL,
} from "./tests/browser/environment.ts";

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: build ? "test-results/production" : "test-results/development",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 15000 },
  use: {
    baseURL: browserBaseURL,
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
  },
  reporter: process.env.CI ? "github" : "list",
  webServer: {
    command: build
      ? `npm run build && npm run preview -- --port ${port}`
      : `npm run dev -- --port ${port}`,
    url: browserBaseURL,
    reuseExistingServer: false,
    env: { READING_CONTENT_MODE: "fixture" },
  },
});
