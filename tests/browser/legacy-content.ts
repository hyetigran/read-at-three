import { readFile } from "node:fs/promises";
import type { BrowserContext, Page } from "@playwright/test";
export async function useLegacyContent(target: BrowserContext | Page) {
  const body = await readFile(
    "tests/fixtures/development-package.json",
    "utf8",
  );
  await target.route("**/curriculum/development.json", (route) =>
    route.fulfill({ contentType: "application/json", body }),
  );
}
