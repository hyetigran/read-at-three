import { expect, test } from "@playwright/test";
import { syntheticOralPairsCourse } from "../oral-pairs-fixture.ts";
import { completeInitialSetup } from "./parent-setup.ts";
import { probe, responses } from "./writing-helpers.ts";

for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
]) {
  test(`oral slow/fast obligations and every support route stay oral and anchored at ${viewport.width}`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    const { envelope } = await syntheticOralPairsCourse();
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
      await expect(page.locator(".teaching-target")).toHaveText("");
      await expect(page.locator(".teaching-listening-art")).toBeVisible();
      await expect(
        page.getByRole("button", { name: /pointing cue/ }),
      ).toHaveCount(0);
    }
    async function geometry() {
      return page
        .locator(".teaching-parent-panel,.teaching-target,.teaching-continue")
        .evaluateAll((nodes) =>
          nodes.map((n) => {
            const r = n.getBoundingClientRect();
            return [r.x, r.y, r.width, r.height];
          }),
        );
    }
    async function act(kind: string) {
      await page.locator(`button[data-action="${kind}"]`).click();
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    }
    await page
      .getByRole("button", { name: "Start Task 3", exact: true })
      .click();
    await at("fixture.oral.t3.initial.0");
    const anchors = await geometry();
    for (let item = 0; item < 5; item++) {
      await at(`fixture.oral.t3.initial.${item}`);
      expect(await geometry()).toEqual(anchors);
      await act("help");
      await at(`fixture.oral.t3.help.${item}.model`);
      await act("continue");
      await at(`fixture.oral.t3.help.${item}.together`);
      await act("continue");
      await at(`fixture.oral.t3.help.${item}.model`);
      await act("continue");
      await page.getByRole("button", { name: "Ready", exact: true }).click();
      await at(`fixture.oral.t3.help.${item}.retest`);
      expect(await geometry()).toEqual(anchors);
      await act("continue");
    }
    await expect(
      page.getByRole("heading", { name: "Task complete", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Activities", exact: true }).click();
    await page
      .getByRole("button", { name: "Start Task 5", exact: true })
      .click();
    for (let i = 0; i < 14; i++) {
      await at(`fixture.oral.t5.${i < 8 ? "initial" : "replay"}.${i}`);
      await expect(
        page.getByRole("button", { name: "Ready", exact: true }),
      ).toHaveCount(i === 13 ? 1 : 0);
      await expect(page.locator('button[data-action="help"]')).toHaveCount(0);
      expect(await geometry()).toEqual(anchors);
      if (i < 13) await act("continue");
    }
    await page
      .getByRole("button", { name: "Practice again", exact: true })
      .click();
    for (let i = 8; i < 14; i++) {
      await at(`fixture.oral.t5.replay.${i}`);
      if (i < 13) await act("continue");
    }
    await page.reload();
    await page
      .getByRole("button", { name: "Resume", exact: true })
      .first()
      .click();
    await at("fixture.oral.t5.replay.13");
    await page.getByRole("button", { name: "Ready", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Task complete", exact: true }),
    ).toBeVisible();
    expect((await responses(page)).filter((r) => r.kind === "failed")).toEqual(
      [],
    );
  });
}
