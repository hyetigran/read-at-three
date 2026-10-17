import { expect, test } from "@playwright/test";
import { useLegacyContent } from "./legacy-content.ts";

test.beforeEach(async ({ context }) => {
  await useLegacyContent(context);
});

test("unsupported durable storage preserves the actual highlighted explanation and Retry without a worker or memory lesson", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator.storage, "getDirectory", {
      value: undefined,
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Saved storage is unavailable" }),
  ).toBeVisible();
  await expect(
    page.locator(".teaching-recovery p [data-origin=added]"),
  ).toHaveText(
    "This browser cannot save reading progress safely. Use a supported browser with local storage available, then retry.",
  );
  const retry = page.getByRole("button", {
    name: "Retry opening",
    exact: true,
  });
  await expect(retry.locator("[data-origin=added]")).toBeVisible();
  await retry.click();
  await expect(retry).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Saved storage is unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toHaveCount(0);
  expect(page.workers()).toHaveLength(0);
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(
    page.getByRole("heading", { name: "Make room for reading" }),
  ).toBeVisible();
  await expect(retry).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(retry).toBeEnabled();
});

for (const { code, title } of [
  { code: "missing-package", title: "Teaching content is missing" },
  { code: "invalid-position", title: "Your saved place needs attention" },
]) {
  test(`repository ${code} recovery keeps its category and explanation through held Retry`, async ({
    page,
  }) => {
    await page.addInitScript(`
      const NativeWorker = window.Worker;
      let injected = false;
      let held = null;
      Object.defineProperty(window, 'openingReadHeld', { get: () => held !== null });
      Object.defineProperty(window, 'releaseOpeningRead', { value: () => {
        if (!held) throw new Error('Opening read is not held');
        const release = held;
        held = null;
        release();
      } });
      window.Worker = class extends NativeWorker {
        constructor(url, options) {
          super(url, options);
          this.reads = new Set();
          this.addEventListener('message', event => {
            const data = event.data;
            if (injected || data?.kind !== 'application' || !this.reads.has(data.id)) return;
            injected = true;
            event.stopImmediatePropagation();
            this.dispatchEvent(new MessageEvent('message', { data: { ...data, value: { ...data.value, application: { kind: 'recovery', code: ${JSON.stringify(code)}, message: 'The exact saved-place failure explanation.' } } } }));
          });
        }
        postMessage(message, options) {
          if (message?.kind === 'read') {
            this.reads.add(message.id);
            if (injected) {
              held = () => super.postMessage(message, options);
              return;
            }
          }
          super.postMessage(message, options);
        }
      };
    `);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(
      page.locator(".teaching-recovery p [data-origin=added]"),
    ).toHaveText("The exact saved-place failure explanation.");
    await page
      .getByRole("button", { name: "Retry opening", exact: true })
      .click();
    await page.waitForFunction(
      () => "openingReadHeld" in window && window.openingReadHeld === true,
    );
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Opening…", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Start", exact: true }),
    ).toHaveCount(0);
    await page.evaluate(() => {
      if (
        "releaseOpeningRead" in window &&
        typeof window.releaseOpeningRead === "function"
      )
        window.releaseOpeningRead();
      else throw new Error("Opening release is unavailable");
    });
    await expect(
      page.getByRole("link", { name: "Lesson 1", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
  });
}
