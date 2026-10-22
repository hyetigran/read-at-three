import { expect, test } from "@playwright/test";
import { DATABASE_VERSION } from "../../packages/storage/src/migration.ts";
import { browserBaseURL } from "./environment.ts";
import { installTransactionDriver } from "./transaction-driver.ts";
import { savedFiles } from "./saved-store-files.ts";
import {
  probe,
  startWriting,
  writingAction,
  atWritableWriting,
  drawPractice,
  latestDocuments,
  finalizedWriting,
} from "./writing-helpers.ts";

for (const format of ["schema", "document", "stroke", "chunk"] as const)
  test(`unsupported actual ${format} format requires an app update and preserves saved files through Retry`, async ({
    context,
    page,
  }) => {
    await installTransactionDriver(context, page);
    await probe(page);
    await startWriting(page);
    await writingAction(page);
    await atWritableWriting(page, "m-model");
    await drawPractice(page);
    const document = (await latestDocuments(page))[0];
    if (!document) throw new Error("Saved writing missing");
    await finalizedWriting(page, document.token.documentId, 3);
    await page.evaluate(
      format === "schema"
        ? "window.transactionDriverControl('storeVersion', " +
            (DATABASE_VERSION + 1) +
            ")"
        : "window.transactionDriverControl('inkCodec', " +
            JSON.stringify(format) +
            ")",
    );
    const harness = `${browserBaseURL}/store-file-harness`;
    await page.route(harness, (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<title>Stored files</title>",
      }),
    );
    await page.goto(harness);
    const before = await savedFiles(page);
    expect(before.length).toBeGreaterThan(0);
    await page.goto(`${browserBaseURL}/teaching`);
    await expect(
      page.getByRole("heading", {
        name: "Update the app to open saved work",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Your saved files have been kept. Update this app to a version that supports this saved format, then retry opening.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Retry opening", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Retry opening", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("heading", {
        name: "Update the app to open saved work",
        exact: true,
      }),
    ).toBeVisible();
    await page.goto(harness);
    expect(await savedFiles(page)).toEqual(before);
  });
