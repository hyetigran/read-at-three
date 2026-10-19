import { expect, test } from "@playwright/test";
import { syntheticLessonSixCourse } from "../lesson-six-fixture.ts";
import { completeInitialSetup } from "./parent-setup.ts";
import { probe, requests } from "./writing-helpers.ts";
for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
])
  test(`Lesson six child voices connected sounds with stable full-size geometry at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180000);
    const { candidate, taskIds } = await syntheticLessonSixCourse();
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
    await page
      .getByRole("button", { name: "Start Task 7", exact: true })
      .click();
    const board = page.locator(".teaching-connected-board");
    const at = async (index: number) => {
      await expect(page.locator("main")).toHaveAttribute(
        "data-committed-turn-id",
        `${taskIds[6]}.turn${index}`,
      );
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    };
    const act = async (kind: string) => {
      await page.locator(`button[data-action="${kind}"]`).click();
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    };
    await at(0);
    const bounds = await board.boundingBox();
    expect(bounds?.width).toBe(680);
    expect(bounds?.height).toBe(300);
    const anchors = () =>
      page
        .locator(
          ".teaching-parent-panel,.teaching-connected-board,.teaching-navigation-actions,.teaching-save-area",
        )
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const r = node.getBoundingClientRect();
            return [r.x, r.y, r.width, r.height];
          }),
        );
    const original = await anchors();
    const collisions = await board
      .locator("path,circle[data-region],circle[data-contact-region]")
      .evaluateAll((nodes) => {
        const controls = [
          ...document.querySelectorAll(".teaching-navigation-actions button"),
        ].map((node) => node.getBoundingClientRect());
        return nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return {
            tag: node.tagName,
            region: node.getAttribute("data-contact-region"),
            r: { x: r.x, y: r.y, width: r.width, height: r.height },
            overlap: controls.some(
              (c) =>
                r.left < c.right &&
                r.right > c.left &&
                r.top < c.bottom &&
                r.bottom > c.top,
            ),
          };
        });
      });
    expect(collisions.filter((item) => item.overlap)).toEqual([]);
    const contacts = await board
      .locator("circle[data-contact-region]")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return {
            x: r.x + r.width / 2,
            y: r.y + r.height / 2,
            width: r.width,
            height: r.height,
          };
        }),
      );
    expect(
      contacts.every((item) => item.width >= 48 && item.height >= 48),
    ).toBe(true);
    await act("continue");
    await at(1);
    await expect(page.locator(".teaching-parent-heading")).toContainText(
      "Child voices",
    );
    const count = (await requests(page)).length;
    const start = contacts[0];
    const first = contacts[1];
    if (!start || !first) throw Error("Rendered contacts required");
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await expect(board).toHaveAttribute("data-contact", "idle");
    await page.mouse.up();
    expect((await requests(page)).length).toBe(count);
    await act("continue");
    await at(2);
    await act("continue");
    await at(3);
    expect(await anchors()).toEqual(original);
    const before = (await requests(page)).length;
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(first.x, first.y);
    await expect(board).toHaveAttribute("data-contact", "first");
    expect((await requests(page)).length).toBe(before);
    await page.mouse.up();
    await board.focus();
    await page.keyboard.down("Enter");
    await page.keyboard.press("ArrowRight");
    await expect(board).toHaveAttribute("data-contact", "first");
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect(board).toHaveAttribute("data-contact", "idle");
    await page.keyboard.up("Enter");
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await act("repeat");
    await act("help");
    await expect(board).toHaveAttribute("data-board", "mē");
    await expect(page.locator(".teaching-parent-heading")).toContainText(
      "Parent and child voice",
    );
    expect(await anchors()).toEqual(original);
    await act("continue");
    await expect(
      page.locator('button[data-action="parentReady"]'),
    ).toBeVisible();
    await act("parentReady");
    await act("continue");
    await at(3);
    await act("continue");
    await at(4);
    for (const i of [5, 6, 7]) {
      await act("continue");
      await at(i);
      expect(await anchors()).toEqual(original);
    }
    await act("help");
    await expect(board).toHaveAttribute("data-board", "mē");
    await act("continue");
    await act("parentReady");
    for (const i of [3, 4, 5, 6, 7]) {
      await at(i);
      await act("continue");
    }
    await expect(
      page.getByText("Task complete", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("connected-completion.png"),
    });
  });
