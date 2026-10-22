import { expect, test } from "@playwright/test";
import { installInitialSetupObservation } from "./parent-setup.ts";
import { installedBrowserFixture } from "./installed-fixture.ts";

let fixture: Awaited<ReturnType<typeof installedBrowserFixture>>;
test.beforeAll(async () => {
  test.setTimeout(180000);
  fixture = await installedBrowserFixture();
});
test.afterAll(async () => {
  await fixture?.dispose();
});

test("installed fixture opens its signed lessons before recovery cleanup", async ({
  page,
}) => {
  test.setTimeout(90000);
  await installInitialSetupObservation(page);
  await page.goto(fixture.origin);
  await expect(
    page.getByRole("button", { name: "Install lessons", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Install lessons", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Open lessons", exact: true }),
  ).toBeVisible({ timeout: 60000 });
  const caches = await page.evaluate(() => window.caches.keys());
  expect(caches).toContain(`reading-content-v1-fixture-${fixture.activeHash}`);
  await page.getByRole("button", { name: "Open lessons", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
});
