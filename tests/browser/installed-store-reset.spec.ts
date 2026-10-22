import { expect, test } from "@playwright/test";
import { installedBrowserFixture } from "./installed-fixture.ts";
import {
  probe,
  drawStroke,
  latestDocuments,
  finalizedWriting,
} from "./writing-helpers.ts";
import { damageStoreHeader, savedFiles } from "./saved-store-files.ts";
let fixture: Awaited<ReturnType<typeof installedBrowserFixture>>;
test.beforeAll(async () => {
  test.setTimeout(180000);
  fixture = await installedBrowserFixture();
});
test.afterAll(async () => {
  await fixture?.dispose();
});
test.use({ actionTimeout: 15000 });

test("installed damaged store retains files until parent reset and can install lessons into a new store", async ({
  page,
}) => {
  test.setTimeout(150000);
  await probe(page);
  await page.goto(fixture.origin);
  await page
    .getByRole("button", { name: "Install lessons", exact: true })
    .click();
  await page.getByRole("button", { name: "Open lessons", exact: true }).click();
  await page.getByLabel("Type the word", { exact: true }).fill("meadow");
  await page
    .getByRole("button", { name: "Continue setup", exact: true })
    .click();
  await page
    .getByRole("button", { name: "I have read this preparation", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("link", { name: "Lesson 6", exact: true }).click();
  await page.getByRole("button", { name: "Start Task 8", exact: true }).click();
  await expect(page.locator("canvas")).toHaveAttribute("data-writable", "true");
  const document = (await latestDocuments(page))[0];
  if (!document) throw new Error("Installed writing document required");
  const y = document.boardY + document.guides.midline;
  await drawStroke(page, [
    { x: 320, y },
    { x: 360, y: y + 20 },
  ]);
  await finalizedWriting(page, document.token.documentId, 1);
  const harness = `${fixture.origin}/store-files`;
  await page.route(harness, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<title>Stored files</title>",
    }),
  );
  await page.goto(harness);
  await damageStoreHeader(page);
  const before = await savedFiles(page);
  await page.goto(fixture.origin);
  await expect(
    page.getByRole("heading", {
      name: "Saved storage needs repair",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Install lessons", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Retry opening", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry opening", exact: true }),
  ).toBeEnabled();
  await page.goto(harness);
  expect(await savedFiles(page)).toEqual(before);
  await page.goto(fixture.origin);
  await page.getByRole("button", { name: "Start fresh", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Start fresh", exact: true });
  await dialog.getByLabel("Type the word").fill("meadow");
  await dialog
    .getByRole("button", { name: "Continue to parent settings", exact: true })
    .click();
  await dialog.getByRole("checkbox").check();
  await dialog
    .getByRole("button", {
      name: "Erase saved work and start fresh",
      exact: true,
    })
    .click();
  await dialog
    .getByRole("button", { name: "Open new reading store", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Install lessons", exact: true })
    .click();
  await page.getByRole("button", { name: "Open lessons", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});
