import { expect, test } from "@playwright/test";
import { syntheticLessonFiveCompletion } from "../lesson-five-completion-fixture.ts";
import { completeInitialSetup } from "./parent-setup.ts";
import { probe, requests } from "./writing-helpers.ts";
for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
])
  test(`rhyming keeps only its initial and parent-controlled hold through correction at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180000);
    const { candidate, taskIds } = await syntheticLessonFiveCompletion();
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
    await page.getByRole("link", { name: "Lesson 5", exact: true }).click();
    await page
      .getByRole("button", { name: "Start Task 7", exact: true })
      .click();
    const board = page.locator(".printed-board"),
      cue = page.getByRole("button", {
        name: "Play pointing cue",
        exact: true,
      });
    await expect(board).toHaveAttribute("data-board", "single-m-rhyme-l05");
    await expect(board.locator("[data-target]")).toHaveCount(1);
    await expect(board.locator("[data-target]")).toHaveAttribute(
      "data-target",
      "m",
    );
    const cell = await board.locator(".printed-board-cell").boundingBox();
    expect(cell?.width).toBe(310);
    expect(cell?.height).toBe(302);
    const anchors = () =>
      page
        .locator(
          ".teaching-parent-panel,.printed-board-activity,.teaching-navigation-actions,.teaching-save-area",
        )
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const r = node.getBoundingClientRect();
            return [r.x, r.y, r.width, r.height];
          }),
        );
    const original = await anchors();
    const rect = await cue.boundingBox();
    if (!rect) throw Error("Rhyme cue required");
    expect(rect.width).toBe(48);
    expect(rect.height).toBe(48);
    const count = (await requests(page)).length;
    await page.mouse.move(rect.x + 24, rect.y + 24);
    await page.mouse.down();
    await expect(board).toHaveAttribute("data-cue-stage", "underHold");
    expect((await requests(page)).length).toBe(count);
    await page.mouse.up();
    await expect(board).toHaveAttribute("data-cue-stage", "endpointFeedback");
    await expect(board).toHaveAttribute("data-cue-stage", "idle");
    expect((await requests(page)).length).toBe(count);
    const act = async (kind: string) => {
      await page.locator(`button[data-action="${kind}"]`).click();
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    };
    const at = async (index: number) => {
      await expect(page.locator("main")).toHaveAttribute(
        "data-committed-turn-id",
        `${taskIds[0]}.turn${index}`,
      );
    };
    for (let i = 1; i <= 13; i++) {
      await act("continue");
      await at(i);
      expect(await anchors()).toEqual(original);
    }
    await act("repeat");
    await act("help");
    expect(await anchors()).toEqual(original);
    await cue.focus();
    await page.keyboard.down("Enter");
    await expect(board).toHaveAttribute("data-cue-stage", "underHold");
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect(board).toHaveAttribute("data-cue-stage", "idle");
    await page.keyboard.up("Enter");
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await act("continue");
    await expect(
      page.locator('button[data-action="parentReady"]'),
    ).toBeVisible();
    const supportedCheckpoint = await page
      .locator("main")
      .getAttribute("data-checkpoint-id");
    await act("help");
    await expect(page.locator("main")).toHaveAttribute(
      "data-committed-turn-id",
      `${taskIds[0]}.help2.support`,
    );
    expect(
      await page.locator("main").getAttribute("data-checkpoint-id"),
    ).not.toBe(supportedCheckpoint);
    await act("continue");
    await act("parentReady");
    for (const i of [10, 11, 12, 13]) {
      await at(i);
      await act("continue");
    }
    await at(13);
    await act("continue");
    await at(14);
    for (const i of [15, 16, 17]) {
      await act("continue");
      await at(i);
      expect(await anchors()).toEqual(original);
    }
    await act("continue");
    await expect(
      page.getByText("Task complete", { exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("rhyming-completion.png"),
    });
  });
