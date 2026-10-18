import { expect, test } from "@playwright/test";
import { syntheticPrintedCourse } from "../printed-board-fixture.ts";
import { probe } from "./writing-helpers.ts";
import { completeInitialSetup } from "./parent-setup.ts";

for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
]) {
  test(`printed save recovery preserves the teaching viewport at ${viewport.width}`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    const { envelope } = await syntheticPrintedCourse();
    await page.setViewportSize(viewport);
    await page.route("**/curriculum/development.json", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(envelope),
      }),
    );
    await probe(page);
    await page.addInitScript(`
      const NativeWorker = window.Worker;
      window.rejectPrintedHelp = false;
      window.Worker = class extends NativeWorker {
        postMessage(message, options) {
          if (window.rejectPrintedHelp && message.kind === 'execute' && message.operation.kind === 'teaching' && message.operation.command.payload.action?.kind === 'help') {
            window.rejectPrintedHelp = false;
            super.postMessage({...message, operation: {...message.operation, command: {...message.operation.command, expectedRevision: '999999'}}}, options);
            return;
          }
          super.postMessage(message, options);
        }
      };
    `);
    await page.goto("/");
    await completeInitialSetup({ page });
    await page.getByRole("link", { name: "Lesson 3", exact: true }).click();
    await page
      .getByRole("button", { name: "Start Task 1", exact: true })
      .click();
    const main = page.locator("main");
    const at = async (id: string) => {
      await expect(main).toHaveAttribute("data-committed-turn-id", id);
      await expect(main).toHaveAttribute("aria-busy", "false");
    };
    const geometry = () =>
      main.evaluate((screen) => ({
        scrollTop: screen.scrollTop,
        boxes: [
          ...screen.querySelectorAll(
            ".teaching-header,.teaching-parent-panel,.printed-board,.teaching-glyph,.teaching-navigation-actions",
          ),
        ].map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            className: node.getAttribute("class") ?? "",
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          };
        }),
      }));
    await at("fixture.printed.t1.n0");
    await page.locator('[data-action="continue"]').click();
    await at("fixture.printed.t1.n1");
    const before = await geometry();
    expect(before.scrollTop).toBe(0);
    await page.evaluate("window.rejectPrintedHelp = true");
    await page.locator('[data-action="help"]').click();
    const retry = page.getByRole("button", { name: "Retry save", exact: true });
    await expect(retry).toBeVisible();
    const footer = await page.locator(".teaching-save-area").boundingBox();
    const button = await retry.boundingBox();
    if (!footer || !button)
      throw new Error("Save recovery controls are missing.");
    expect(button.height).toBeGreaterThanOrEqual(44);
    expect(button.y).toBeGreaterThanOrEqual(footer.y);
    expect(button.y + button.height).toBeLessThanOrEqual(viewport.height);
    const errorText = page.locator(".teaching-save-error p");
    await expect(errorText.locator('[data-origin="added"]')).toBeVisible();
    await errorText.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    expect(
      await errorText.evaluate(
        (node) => node.scrollTop + node.clientHeight >= node.scrollHeight,
      ),
    ).toBe(true);
    await retry.click();
    await at("fixture.printed.t1.n1");
    expect(await geometry()).toEqual(before);
    await page.locator('[data-action="help"]').click();
    await at("fixture.printed.support");
    expect(await geometry()).toEqual(before);
    await page.locator('[data-action="continue"]').click();
    await at("fixture.printed.t1.n1");
    expect(await geometry()).toEqual(before);
  });
}
