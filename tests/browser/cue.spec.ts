import { test, expect } from "@playwright/test";
import { useLegacyContent } from "./legacy-content.ts";
test.beforeEach(async ({ context }) => {
  await useLegacyContent(context);
});

const motionModes: ("no-preference" | "reduce")[] = ["no-preference", "reduce"];

for (const reducedMotion of motionModes) {
  test(`silent cue preserves start, quick movement and minimum hold with ${reducedMotion} motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await expect(
      page.getByText("Fixture model.", { exact: true }),
    ).toBeVisible();
    const cue = page.getByRole("button", { name: "Hold silent pointing cue" });
    const target = page.locator(".teaching-target");
    const before = await target.boundingBox();
    const time = new Date("2030-01-01T00:00:00Z");
    await page.clock.install({ time });
    await page.clock.pauseAt(time);

    const startBall = await cue
      .locator(".teaching-cue-ball")
      .first()
      .boundingBox();
    if (!startBall) throw new Error("The first pointing ball is unavailable.");
    await page.mouse.move(
      startBall.x + startBall.width / 2,
      startBall.y + startBall.height / 2,
    );
    await page.mouse.down();
    await expect(cue).toHaveAttribute("data-stage", "start");
    await expect(cue.getByText("Cue at first ball")).toBeVisible();
    await expect(cue.locator(".teaching-cue-hold")).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 30, 40)",
    );
    await page.clock.runFor(250);
    await expect(cue).toHaveAttribute("data-stage", "moving");
    await expect(cue.getByText("Cue moving")).toBeVisible();
    await page.clock.runFor(150);
    await expect(cue).toHaveAttribute("data-stage", "holding");
    await expect(cue.getByText("Cue holding · 3 s minimum")).toBeVisible();
    await expect(cue.locator(".teaching-cue-hold")).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 340, 55)",
    );
    await page.clock.runFor(2999);
    await expect(cue).toHaveAttribute("data-stage", "holding");
    await page.clock.runFor(1);
    await expect(cue).toHaveAttribute("data-stage", "minimum-held");
    await expect(cue.getByText("Cue minimum reached")).toBeVisible();
    await expect(
      page.getByText("Fixture model.", { exact: true }),
    ).toBeVisible();
    expect(await target.boundingBox()).toEqual(before);
    await page.mouse.up();
    await expect(cue).toHaveAttribute("data-stage", "idle");
    await expect(cue).toHaveAttribute("aria-pressed", "false");

    await cue.focus();
    await page.keyboard.down("Space");
    await expect(cue).toHaveAttribute("data-stage", "start");
    await page.clock.runFor(250);
    await expect(cue).toHaveAttribute("data-stage", "moving");
    await page.clock.runFor(150);
    await expect(cue).toHaveAttribute("data-stage", "holding");
    await page.keyboard.up("Space");
    await page.clock.runFor(4000);
    await expect(cue).toHaveAttribute("data-stage", "idle");

    await page.keyboard.down("Enter");
    await expect(cue).toHaveAttribute("data-stage", "start");
    await cue.evaluate((element) => element.blur());
    await page.clock.runFor(4000);
    await expect(cue).toHaveAttribute("data-stage", "idle");
    await page.keyboard.up("Enter");
    await expect(
      page.getByText("Fixture model.", { exact: true }),
    ).toBeVisible();
  });
}
