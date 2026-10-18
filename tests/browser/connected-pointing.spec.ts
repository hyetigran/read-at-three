import { expect, test } from "@playwright/test";
import { syntheticConnectedCourse } from "../connected-pointing-fixture.ts";
import { completeInitialSetup } from "./parent-setup.ts";
import { probe, requests } from "./writing-helpers.ts";

for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
]) {
  test(`connected pointer follows physical regions and all roles at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    const { envelope, task6Id, task7Id } = await syntheticConnectedCourse();
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
    await page.getByRole("link", { name: "Lesson 3", exact: true }).click();
    async function at(id: string) {
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
      await expect(page.locator("main")).toHaveAttribute(
        "data-committed-turn-id",
        id,
      );
    }
    async function act(kind: string) {
      await page.locator(`button[data-action="${kind}"]`).click();
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    }
    const board = page.locator(".teaching-connected-board");
    for (const task of [6, 7]) {
      const taskId = task === 6 ? task6Id : task7Id;
      await page
        .getByRole("button", { name: `Start Task ${task}`, exact: true })
        .click();
      await at(`${taskId}.model`);
      await expect(board).toHaveAttribute(
        "data-board",
        task === 6 ? "am" : "sa",
      );
      await expect(page.locator(".teaching-parent-heading")).toContainText(
        "Parent voices and points",
      );
      const anchors = await page
        .locator(
          ".teaching-parent-panel,.teaching-connected-board,button[data-action='continue'],button[data-action='repeat']",
        )
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const r = node.getBoundingClientRect();
            return [r.x, r.y, r.width, r.height];
          }),
        );
      const regions = await board
        .locator("circle[data-region]")
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            if (!(node instanceof SVGCircleElement))
              throw Error("Rendered circle required");
            const p = new DOMPoint(
              node.cx.baseVal.value,
              node.cy.baseVal.value,
            ).matrixTransform(node.getScreenCTM() ?? undefined);
            return {
              name: node.getAttribute("data-region"),
              x: p.x,
              y: p.y,
              hit: document.elementFromPoint(p.x, p.y) === node,
            };
          }),
        );
      expect(regions.map((r) => r.hit)).toEqual([true, true, true]);
      const count = (await requests(page)).length;
      const startRegion = regions[0],
        firstRegion = regions[1];
      if (!startRegion || !firstRegion)
        throw Error("Source circle centers required");
      await page.mouse.move(firstRegion.x + 21.9, firstRegion.y);
      await page.mouse.down();
      await expect(board).toHaveAttribute("data-contact", "idle");
      await page.mouse.up();
      await page.mouse.move(startRegion.x - 21.9, startRegion.y);
      await page.mouse.down();
      await expect(board).toHaveAttribute("data-contact", "start");
      await page.mouse.move(firstRegion.x + 21.9, firstRegion.y);
      await expect(board).toHaveAttribute("data-contact", "first");
      await page.mouse.move(firstRegion.x + 22.1, firstRegion.y);
      await expect(board).toHaveAttribute("data-contact", "idle");
      await page.mouse.up();

      for (const [index, region] of regions.entries()) {
        await page.mouse.move(region.x, region.y);
        if (index === 0) await page.mouse.down();
        await expect(board).toHaveAttribute("data-contact", region.name ?? "");
      }
      await page.mouse.up();
      await expect(board).toHaveAttribute("data-contact", "idle");
      await board.focus();
      await page.keyboard.down(" ");
      await page.keyboard.press("ArrowRight");
      await expect(board).toHaveAttribute("data-contact", "first");
      await page.keyboard.press("ArrowRight");
      await expect(board).toHaveAttribute("data-contact", "second");
      await page.keyboard.up(" ");
      await expect(board).toHaveAttribute("data-contact", "idle");
      expect((await requests(page)).length).toBe(count);
      await act("continue");
      if (task === 7) {
        await at(`${taskId}.required-model-repeat`);
        await act("continue");
      }
      for (const position of ["follow", "again"]) {
        await at(`${taskId}.${position}`);
        await expect(page.locator(".teaching-parent-heading")).toContainText(
          "Parent voices · Child points",
        );
        expect(
          await page
            .locator(
              ".teaching-parent-panel,.teaching-connected-board,button[data-action='continue'],button[data-action='repeat']",
            )
            .evaluateAll((nodes) =>
              nodes.map((node) => {
                const r = node.getBoundingClientRect();
                return [r.x, r.y, r.width, r.height];
              }),
            ),
        ).toEqual(anchors);
        await act("repeat");
        await act("help");
        await at(`${taskId}.help-${position}.guided`);
        await expect(page.locator(".teaching-parent-heading")).toContainText(
          "guides child's finger",
        );
        if (task === 6) {
          await act("continue");
          await at(`${taskId}.help-${position}.guided`);
          await act("parentReady");
        } else {
          await expect(page.locator('[data-action="parentReady"]')).toHaveCount(
            0,
          );
          await act("continue");
        }
        await at(`${taskId}.help-${position}.retest`);
        await expect(page.locator(".teaching-parent-heading")).toContainText(
          "Retest",
        );
        await act("continue");
        await at(`${taskId}.${position}`);
        await act("continue");
      }
      await expect(
        page.getByRole("heading", { name: "Task complete", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Activities", exact: true })
        .click();
    }
  });
}
