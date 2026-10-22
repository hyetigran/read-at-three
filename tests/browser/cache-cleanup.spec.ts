import { expect, test } from "@playwright/test";
import { installInitialSetupObservation } from "./parent-setup.ts";
import {
  probe,
  drawStroke,
  latestDocuments,
  requests,
  writingAction,
} from "./writing-helpers.ts";
import { installedBrowserFixture } from "./installed-fixture.ts";

test.use({ actionTimeout: 15000 });

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

for (const scenario of ["partial-delete", "lost-reply"] as const)
  test(`installed cache cleanup ${scenario} retries exact targets while retaining pending ink offline`, async ({
    page,
    context,
  }) => {
    test.setTimeout(120000);
    await probe(page);
    if (scenario === "lost-reply")
      await page.addInitScript(() => {
        const NativeWorker = window.Worker;
        let fail = true;
        window.Worker = class extends NativeWorker {
          constructor(url: string | URL, options?: WorkerOptions) {
            super(url, options);
            this.addEventListener("message", (event) => {
              if (fail && event.data?.kind === "cacheCleanupResult") {
                fail = false;
                event.stopImmediatePropagation();
                this.dispatchEvent(
                  new ErrorEvent("error", {
                    message: "Injected loss after actual cache cleanup",
                  }),
                );
              }
            });
          }
        };
      });
    await page.goto(fixture.origin);
    await page
      .getByRole("button", { name: "Install lessons", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Open lessons", exact: true })
      .click();
    await page.getByLabel("Type the word", { exact: true }).fill("meadow");
    await page
      .getByRole("button", { name: "Continue setup", exact: true })
      .click();
    await page
      .getByRole("button", {
        name: "I have read this preparation",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.locator(".course-map")).toBeVisible();
    await page.getByRole("link", { name: "For parents", exact: true }).click();
    await page.getByLabel("Type the word", { exact: true }).fill("meadow");
    await page
      .getByRole("button", { name: "Continue to parent settings", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Lesson files", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Download lesson update", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Use these lessons", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Cancel download", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Download lesson update", exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("link", { name: "Lesson 6", exact: true }).click();
    await page
      .getByRole("button", { name: "Start Task 8", exact: true })
      .click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "true",
    );
    const turn = await page.locator("main").getAttribute("data-turn-id");
    const document = (await latestDocuments(page))[0];
    if (!document || !turn) throw new Error("Actual writing document required");
    const cacheName = `reading-content-v1-fixture-${fixture.unusedHash}`;
    const activeBefore = await cacheHashes(page, fixture.activeHash);
    const countBefore = await page.evaluate(
      async (name) => (await (await caches.open(name)).keys()).length,
      cacheName,
    );
    expect(countBefore).toBeGreaterThan(1);
    const worker = page
      .workers()
      .find((candidate) => candidate.url().includes("teaching.worker"));
    if (!worker) throw new Error("Actual teaching worker required");
    if (scenario === "partial-delete")
      await worker.evaluate((hash) => {
        const nativeDelete = Cache.prototype.delete;
        let fail = true;
        Cache.prototype.delete = async function (request, options) {
          const url =
            typeof request === "string"
              ? request
              : request instanceof Request
                ? request.url
                : request.href;
          const result = await nativeDelete.call(this, request, options);
          if (fail && url.includes(hash)) {
            fail = false;
            throw new Error(
              "Injected acknowledgement failure after actual cached entry deletion",
            );
          }
          return result;
        };
      }, fixture.unusedHash);
    await page.evaluate("window.armWritingFault('ink-failure')");
    const y = document.boardY + document.guides.midline;
    await drawStroke(page, [
      { x: 320, y },
      { x: 360, y: y + 20 },
    ]);
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toBeVisible();
    const pending = (await requests(page)).findLast(
      (request) =>
        request.kind === "execute" &&
        request.operation.kind === "ink" &&
        request.operation.command.edit.kind === "finalize",
    );
    if (pending?.kind !== "execute")
      throw new Error("Pending finalize command required");
    await context.setOffline(true);
    await page
      .getByRole("button", { name: "Parent storage cleanup", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Manage saved files",
      exact: true,
    });
    await expect(
      dialog.getByRole("button", {
        name: "Remove unused downloads",
        exact: true,
      }),
    ).toHaveCount(0);
    await dialog.getByLabel("Type the word").fill("meadow");
    await dialog
      .getByRole("button", { name: "Continue to parent settings", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Remove unused downloads", exact: true })
      .click();
    await expect(
      dialog.getByText(/Cleanup could not be confirmed/),
    ).toBeVisible();
    if (scenario === "partial-delete") {
      const countAfter = await page.evaluate(
        async (name) => (await (await caches.open(name)).keys()).length,
        cacheName,
      );
      expect(countAfter).toBe(countBefore - 1);
    } else {
      expect(await page.evaluate((name) => caches.has(name), cacheName)).toBe(
        false,
      );
    }
    await dialog
      .getByRole("button", { name: "Retry same download cleanup", exact: true })
      .click();
    await expect(dialog.getByText(/cleanup request is complete/)).toBeVisible();
    expect(await page.evaluate((name) => caches.has(name), cacheName)).toBe(
      false,
    );
    expect(await cacheHashes(page, fixture.activeHash)).toEqual(activeBefore);
    const cleanup = (await requests(page)).filter(
      (request) => request.kind === "cleanupCache",
    );
    expect(cleanup).toHaveLength(2);
    expect(cleanup[0]?.command).toEqual(cleanup[1]?.command);
    expect(
      cleanup[0]?.command.targets.map((target) => target.packageHash),
    ).toEqual([fixture.unusedHash]);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "false",
    );
    await dialog
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    if (scenario === "partial-delete") await writingAction(page, "Retry save");
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "true",
    );
    const attempts = (await requests(page)).filter(
      (request) =>
        (request.kind === "execute" || request.kind === "recoverInk") &&
        request.operation.command.commandId ===
          pending.operation.command.commandId,
    );
    expect(attempts).toHaveLength(2);
    expect(
      attempts.map((request) => {
        if (request.kind !== "execute" && request.kind !== "recoverInk")
          throw new Error("Expected ink execution");
        return request.operation;
      }),
    ).toEqual([pending.operation, pending.operation]);
    await page.reload();
    await expect(page.locator("main")).toHaveAttribute("data-turn-id", turn);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "true",
    );
    expect((await latestDocuments(page))[0]?.strokes).toHaveLength(1);
  });

async function cacheHashes(
  page: import("@playwright/test").Page,
  hash: string,
) {
  return page.evaluate(async (hash) => {
    const name = `reading-content-v1-fixture-${hash}`;
    if (!(await caches.has(name))) throw new Error("Expected retained cache");
    const cache = await caches.open(name);
    const result = [];
    for (const request of await cache.keys()) {
      const response = await cache.match(request);
      if (!response) throw new Error("Expected retained cache entry");
      const bytes = await response.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      result.push([
        request.url,
        bytes.byteLength,
        Array.from(new Uint8Array(digest), (value) =>
          value.toString(16).padStart(2, "0"),
        ).join(""),
      ]);
    }
    return result.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  }, hash);
}
