import { expect, test } from "@playwright/test";
import { currentPrintedGlyphAssets } from "@readatthree/teaching";
import { syntheticLessonSixCourse } from "../lesson-six-fixture.ts";
import { completeInitialSetup } from "./parent-setup.ts";
import { probe } from "./writing-helpers.ts";
for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
])
  test(`Lesson six reviewed diagrams and contacts at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180000);
    const { candidate } = await syntheticLessonSixCourse();
    await page.setViewportSize(viewport);
    await page.route("**/curriculum/development.json", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(candidate),
      }),
    );
    await probe(page);
    await page.goto("/");
    await completeInitialSetup({ page });
    await page.getByRole("link", { name: "Lesson 6", exact: true }).click();
    const observations = [];
    for (const [task, board, targets] of [
      [1, "vertical-esam-l06", ["ē", "s", "a", "m"]],
      [3, "single-m-rhyme-l06", ["m"]],
      [4, "vertical-eams-l06", ["ē", "a", "m", "s"]],
      [6, "single-s-rhyme-l06", ["s"]],
    ] as const) {
      await page
        .getByRole("button", { name: `Start Task ${task}`, exact: true })
        .click();
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      const diagram = page.locator(`.printed-board[data-board="${board}"]`);
      await expect(diagram).toBeVisible();
      await expect(diagram.locator(".printed-board-cell")).toHaveCount(
        targets.length,
      );
      for (const glyph of targets) {
        const path = diagram.locator(
            `.printed-board-cell[data-target="${glyph}"] .teaching-glyph path`,
          ),
          asset = currentPrintedGlyphAssets[glyph];
        await expect(path).toHaveAttribute("d", asset.path);
        await expect(path).toHaveAttribute("fill-rule", asset.fillRule);
        expect(await path.getAttribute("transform")).toBe(asset.transform);
      }
      const contact = diagram.locator("button.printed-board-contact");
      await expect(contact).toHaveCount(1);
      const box = await contact.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(48);
      expect(box?.height).toBeGreaterThanOrEqual(48);
      const geometry = await diagram.evaluate((element) => ({
        html: element.outerHTML,
        bounds: element.getBoundingClientRect().toJSON(),
        contacts: [...element.querySelectorAll("button")].map((n) =>
          n.getBoundingClientRect().toJSON(),
        ),
      }));
      observations.push({ task, board, geometry });
      await page.screenshot({ path: testInfo.outputPath(`${board}.png`) });
      await page
        .getByRole("button", { name: "Activities", exact: true })
        .click();
    }
    await page
      .getByRole("button", { name: "Start Task 7", exact: true })
      .click();
    for (const [board, targets] of [
      ["mē", ["m", "ē"]],
      ["sē", ["s", "ē"]],
    ] as const) {
      const diagram = page.locator(
        `.teaching-connected-board[data-board="${board}"]`,
      );
      await expect(diagram).toBeVisible();
      const glyphs = diagram.locator(":scope > svg > path");
      await expect(glyphs).toHaveCount(2);
      for (const [i, glyph] of targets.entries()) {
        const asset = currentPrintedGlyphAssets[glyph];
        await expect(glyphs.nth(i)).toHaveAttribute("d", asset.path);
        await expect(glyphs.nth(i)).toHaveAttribute(
          "fill-rule",
          asset.fillRule,
        );
        expect(await glyphs.nth(i).getAttribute("transform")).toBe(
          asset.transform,
        );
      }
      const contacts = await diagram
        .locator("circle[data-contact-region]")
        .evaluateAll((nodes) =>
          nodes.map((n) => n.getBoundingClientRect().toJSON()),
        );
      expect(contacts).toHaveLength(3);
      expect(contacts.every((r) => r.width >= 48 && r.height >= 48)).toBe(true);
      const geometry = await diagram.evaluate((element) => ({
        html: element.outerHTML,
        bounds: element.getBoundingClientRect().toJSON(),
      }));
      observations.push({ task: 7, board, geometry });
      await page.screenshot({ path: testInfo.outputPath(`${board}.png`) });
      if (board === "mē")
        for (let i = 0; i < 4; i++) {
          await page.locator('button[data-action="continue"]').click();
          await expect(page.locator("main")).toHaveAttribute(
            "aria-busy",
            "false",
          );
        }
    }
    await testInfo.attach("actual-consumed-diagrams.json", {
      body: JSON.stringify({ viewport, observations }, null, 2),
      contentType: "application/json",
    });
  });
