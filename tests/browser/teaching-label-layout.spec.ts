import { expect, test } from "@playwright/test";
import {
  completeInitialSetup,
  installInitialSetupObservation,
} from "./parent-setup.ts";

for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
]) {
  for (const activity of [
    { mode: "oral", lesson: 1, task: 3 },
    { mode: "writing", lesson: 1, task: 6 },
  ]) {
    test(`${activity.mode} header title clears profile and actions at ${viewport.width}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await installInitialSetupObservation(page);
      await page.goto("/");
      await completeInitialSetup({ page });
      await page
        .getByRole("link", { name: `Lesson ${activity.lesson}`, exact: true })
        .click();
      await page
        .getByRole("button", {
          name: `Start Task ${activity.task}`,
          exact: true,
        })
        .click();
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      const anchors = () =>
        page
          .locator(
            ".teaching-parent-panel,.teaching-arena,.teaching-navigation-actions,.teaching-save-area",
          )
          .evaluateAll((nodes) =>
            nodes.map((node) => {
              const rect = node.getBoundingClientRect();
              return [rect.x, rect.y, rect.width, rect.height];
            }),
          );
      const before = await anchors();
      for (const withUndo of [false, true]) {
        if (withUndo) {
          await page.locator('button[data-action="continue"]').click();
          await expect(page.locator("main")).toHaveAttribute(
            "aria-busy",
            "false",
          );
          await expect(
            page.locator(".teaching-undo-slot button"),
          ).toBeVisible();
        }
        await page.locator(".teaching-header h1").evaluate((heading) => {
          heading.textContent = "LISTEN TO SOUNDS THEN TRY AGAIN";
        });
        await page
          .locator(".parent-profile-button > span > [data-origin]")
          .evaluate((name) => {
            name.textContent = "Alexandria Maximiliana";
          });
        const geometry = await page
          .locator(".teaching-header")
          .evaluate((header) => {
            const title = header.querySelector("h1");
            const actions = header.querySelector(".teaching-header-actions");
            if (!title || !actions)
              throw new Error("Header content is missing.");
            const range = document.createRange();
            range.selectNodeContents(title);
            return {
              header: header.getBoundingClientRect().toJSON(),
              title: title.getBoundingClientRect().toJSON(),
              actions: actions.getBoundingClientRect().toJSON(),
              text: [...range.getClientRects()].map((rect) => rect.toJSON()),
              buttons: [...actions.querySelectorAll("button")].map((button) =>
                button.getBoundingClientRect().toJSON(),
              ),
            };
          });
        for (const rect of geometry.text) {
          expect(rect.left).toBeGreaterThanOrEqual(geometry.title.left);
          expect(rect.right).toBeLessThanOrEqual(geometry.title.right);
          expect(rect.right).toBeLessThanOrEqual(geometry.actions.left);
          expect(rect.top).toBeGreaterThanOrEqual(geometry.header.top);
          expect(rect.bottom).toBeLessThanOrEqual(geometry.header.bottom);
        }
        for (const rect of geometry.buttons) {
          expect(rect.width).toBeGreaterThanOrEqual(44);
          expect(rect.height).toBeGreaterThanOrEqual(44);
        }
        expect(await anchors()).toEqual(before);
      }
    });
  }
}

for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
]) {
  test(`long added Help label fits its button at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await installInitialSetupObservation(page);
    await page.goto("/");
    await completeInitialSetup({ page });
    await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
    await page
      .getByRole("button", { name: "Start Task 1", exact: true })
      .click();
    await page.locator('button[data-action="continue"]').click();
    await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    const anchors = () =>
      page
        .locator(
          '.teaching-parent-panel,.teaching-arena,.printed-board,.teaching-glyph,.teaching-navigation-actions,.teaching-save-area,[data-action="back"],[data-action="continue"],[data-action="repeat"]',
        )
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getBoundingClientRect().toJSON()),
        );
    const before = await anchors();
    const help = page.locator('button[data-action="help"]');
    const label = help.locator('[data-origin="added"]');
    await label.evaluate((node) => {
      node.textContent = "Help with practice and feedback";
    });
    await expect(label).toHaveText("Help with practice and feedback");
    const geometry = await help.evaluate((button) => {
      const span = button.querySelector('[data-origin="added"]');
      if (!span) throw new Error("Added Help label is missing.");
      const range = document.createRange();
      range.selectNodeContents(span);
      return {
        button: button.getBoundingClientRect().toJSON(),
        background: getComputedStyle(span).backgroundColor,
        text: [...range.getClientRects()].map((rect) => rect.toJSON()),
      };
    });
    expect(geometry.background).toBe("rgb(255, 240, 163)");
    expect(geometry.button.width).toBeGreaterThanOrEqual(44);
    expect(geometry.button.height).toBeGreaterThanOrEqual(44);
    for (const rect of geometry.text) {
      expect(rect.left).toBeGreaterThanOrEqual(geometry.button.left);
      expect(rect.right).toBeLessThanOrEqual(geometry.button.right);
      expect(rect.top).toBeGreaterThanOrEqual(geometry.button.top);
      expect(rect.bottom).toBeLessThanOrEqual(geometry.button.bottom);
      expect(rect.right).toBeLessThanOrEqual(viewport.width);
    }
    expect(await anchors()).toEqual(before);
  });
}
