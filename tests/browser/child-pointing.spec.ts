import { test, expect } from "@playwright/test";
import { syntheticLessonFiveCourse } from "../lesson-five-fixture.ts";
import { probe, requests } from "./writing-helpers.ts";
import { completeInitialSetup } from "./parent-setup.ts";
for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
])
  test(`child owns contact without acceptance and keeps four stable rows at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180000);
    const { envelope, taskIds } = await syntheticLessonFiveCourse();
    await page.setViewportSize(viewport);
    await page.route("**/curriculum/development.json", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(envelope),
      }),
    );
    await probe(page);
    await page.goto("/");
    await completeInitialSetup({ page });
    await page.getByRole("link", { name: "Lesson 5", exact: true }).click();
    await page
      .getByRole("button", { name: "Start Task 6", exact: true })
      .click();
    const board = page.locator(".printed-board");
    await expect(board).toHaveAttribute("data-board", "vertical-esma-l05");
    await expect(board.locator("[data-target]")).toHaveCount(4);
    const anchors = () =>
      board.locator("[data-anchor], .teaching-glyph").evaluateAll((nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        }),
      );
    const before = await anchors();
    const region = page.getByRole("button", {
      name: "Child pointing feedback",
      exact: true,
    });
    const b = await region.boundingBox();
    expect(b).not.toBeNull();
    if (!b) throw Error("Synthetic contact required");
    expect(b.width).toBe(48);
    expect(b.height).toBe(48);
    const box = await board.boundingBox();
    if (!box) throw Error("Synthetic board required");
    expect(box.height).toBe(320);
    if (viewport.height === 600) {
      expect(box.y).toBe(218);
      expect(box.y + box.height).toBe(538);
    }
    const count = (await requests(page)).length;
    await page.mouse.move(b.x + 24, b.y + 24);
    await page.mouse.down();
    await expect(page.locator(".child-printed-contact")).toHaveAttribute(
      "data-contact-stage",
      "pointer",
    );
    const under = await board
      .locator('[data-focused="true"] [data-anchor="under"]')
      .evaluate((node) => {
        if (!(node instanceof SVGCircleElement))
          throw Error("Actual source anchor required");
        const p = new DOMPoint(
          node.cx.baseVal.value,
          node.cy.baseVal.value,
        ).matrixTransform(node.getScreenCTM() ?? undefined);
        return { x: p.x, y: p.y };
      });
    await page.mouse.move(under.x, under.y);
    expect((await requests(page)).length).toBe(count);
    await page.mouse.up();
    await expect(page.locator(".child-printed-contact")).toHaveAttribute(
      "data-contact-stage",
      "idle",
    );
    await region.focus();
    await page.keyboard.down(" ");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".child-printed-contact")).toHaveAttribute(
      "data-contact-stage",
      "keyboard",
    );
    await page.keyboard.up(" ");
    expect((await requests(page)).length).toBe(count);
    await page.mouse.move(b.x + 24, b.y + 24);
    await page.mouse.down();
    await region.dispatchEvent("pointerdown", {
      pointerId: 81,
      isPrimary: false,
      button: 0,
    });
    await expect(page.locator(".child-printed-contact")).toHaveAttribute(
      "data-contact-stage",
      "pointer",
    );
    await region.dispatchEvent("pointercancel", {
      pointerId: 1,
      isPrimary: true,
    });
    await expect(page.locator(".child-printed-contact")).toHaveAttribute(
      "data-contact-stage",
      "idle",
    );
    await page.mouse.up();
    await region.focus();
    await page.keyboard.down("Enter");
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect(page.locator(".child-printed-contact")).toHaveAttribute(
      "data-contact-stage",
      "idle",
    );
    await page.keyboard.up("Enter");
    expect((await requests(page)).length).toBe(count);
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator('button[data-action="continue"]').click();
    await expect(page.locator("main")).toHaveAttribute(
      "data-committed-turn-id",
      `${taskIds[5]}.response1`,
    );
    expect(await anchors()).toEqual(before);
    const fastBox = await region.boundingBox();
    if (!fastBox) throw Error("Synthetic fast contact required");
    const fastCount = (await requests(page)).length;
    await page.mouse.move(fastBox.x + 24, fastBox.y + 24);
    await page.mouse.down();
    await page.mouse.move(fastBox.x + 90, fastBox.y + 24);
    await expect(page.locator(".child-contact-marker circle")).toHaveAttribute(
      "cx",
      "155",
    );
    await expect(page.locator(".child-contact-marker circle")).toHaveAttribute(
      "cy",
      "43",
    );
    await page.mouse.up();
    expect((await requests(page)).length).toBe(fastCount);
    await page.locator('button[data-action="help"]').click();
    await expect(page.locator(".child-printed-contact")).toHaveAttribute(
      "data-participant",
      "parentGuidesChild",
    );
    expect(await anchors()).toEqual(before);
    await page.locator('button[data-action="continue"]').click();
    expect(await anchors()).toEqual(before);
    await expect(
      page.locator('button[data-action="parentReady"]'),
    ).toBeVisible();
    await page.reload();
    await page
      .getByRole("button", { name: "Resume", exact: true })
      .first()
      .click();
    await expect(page.locator(".child-printed-contact")).toHaveAttribute(
      "data-contact-stage",
      "idle",
    );
    await expect(
      page.locator('button[data-action="parentReady"]'),
    ).toBeVisible();
    expect(await anchors()).toEqual(before);
    await page.screenshot({ path: testInfo.outputPath("child-pointing.png") });
  });
