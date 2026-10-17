import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  atWriting,
  probe,
  responses,
  startWriting,
  writingAction,
} from "./writing-helpers.ts";

async function assertSkippedCatalog(page: Page) {
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  const task = page.locator('.teaching-task-list [data-task-number="6"]');
  const status = task.locator('p [data-origin="added"]');
  await expect(status).toHaveText("Skipped · Optional");
  await expect(status).toHaveCSS("background-color", "rgb(255, 240, 163)");
  const response = (await responses(page)).findLast(
    (response) => response.kind === "projection",
  );
  if (response?.kind !== "projection" || response.value.kind === "recovery")
    throw Error("Committed catalog projection is missing");
  const projectedTask = response.value.catalog.find(
    (entry) => entry.number === 6,
  );
  expect(projectedTask).toMatchObject({
    optional: true,
    completed: false,
    skipped: true,
  });
  return task;
}

test("Activities shows highlighted authoritative Skip immediately, after task switch and after reload", async ({
  page,
}) => {
  await probe(page);
  await startWriting(page);
  await writingAction(page, "Skip writing");
  await expect(
    page.getByText("Optional writing skipped", { exact: true }),
  ).toBeVisible();
  await assertSkippedCatalog(page);
  await page.getByRole("button", { name: "Start Task 2", exact: true }).click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /t02/,
  );
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await assertSkippedCatalog(page);
  await page.reload();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /t02/,
  );
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  const task = await assertSkippedCatalog(page);
  await task.getByRole("button", { name: "Start Task 6", exact: true }).click();
  await atWriting(page, "m-sound");
  await assertSkippedCatalog(page);
  await page
    .getByRole("button", { name: "Resume Task 2", exact: true })
    .click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /t02/,
  );
  const saved = await assertSkippedCatalog(page);
  await expect(
    saved.getByRole("button", { name: "Resume Task 6", exact: true }),
  ).toBeVisible();
});
