import { chromium, expect, test } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import { syntheticLessonSixReadiness } from "../lesson-six-readiness-fixture.ts";
import { completeInitialSetup } from "./parent-setup.ts";
import { probe } from "./writing-helpers.ts";
import { browserBaseURL } from "./environment.ts";
import { parseResponse } from "../../apps/web/src/platform/protocol.ts";

for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
])
  test(`separate readiness survives real browser replacement and historical Back at ${viewport.width}x${viewport.height}`, async ({}, testInfo) => {
    test.setTimeout(420000);
    const { candidate } = await syntheticLessonSixReadiness(),
      profile = testInfo.outputPath("persistent-browser-profile");
    let context: BrowserContext | undefined, tab: Page | undefined;
    function page() {
      if (!tab) throw Error("Actual browser page required");
      return tab;
    }
    const replacements: unknown[] = [];
    async function open(url: string) {
      context = await chromium.launchPersistentContext(profile, { viewport });
      tab = await context.newPage();
      await page().route("**/curriculum/development.json", (route) =>
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify(candidate),
        }),
      );
      await probe(page());
      await page().goto(url);
    }
    async function at(id: string) {
      await expect(page().locator("main")).toHaveAttribute(
        "data-committed-turn-id",
        id,
      );
      await expect(page().locator("main")).toHaveAttribute(
        "aria-busy",
        "false",
      );
    }
    async function act(kind: string) {
      await page().locator(`button[data-action="${kind}"]`).click();
      await expect(page().locator("main")).toHaveAttribute(
        "aria-busy",
        "false",
      );
    }
    async function committed() {
      const raw: unknown = await page().evaluate(
        "window.writingEvidence().responses",
      );
      if (!Array.isArray(raw)) throw Error("Real worker traffic required");
      const response = raw
        .map(parseResponse)
        .findLast(
          (item) =>
            item.kind === "application" &&
            item.value.application.kind === "ready",
        );
      if (
        response?.kind !== "application" ||
        response.value.application.kind !== "ready"
      )
        throw Error("Committed worker projection required");
      return response.value.application.projection;
    }
    async function replace(id: string) {
      await at(id);
      const before = await committed(),
        url = page().url();
      if (!context) throw Error("Actual browser context required");
      await context.close();
      context = undefined;
      await open(url);
      const paused = page().getByRole("heading", {
        name: "Reading is paused",
        exact: true,
      });
      await expect(
        page().locator(`main[data-committed-turn-id="${id}"]`).or(paused),
      ).toBeVisible();
      if (await paused.isVisible())
        await page()
          .getByRole("button", { name: "Resume", exact: true })
          .click();
      await at(id);
      const after = await committed();
      expect(after).toEqual(before);
      replacements.push({
        id,
        before,
        after,
        method:
          "Closed persistent browser, awaited close, launched a new browser on exact same profile",
      });
    }
    try {
      await open(browserBaseURL);
      await completeInitialSetup({ page: page() });
      await page().getByRole("link", { name: "Lesson 6", exact: true }).click();
      await page()
        .getByRole("button", { name: "Start Task 5", exact: true })
        .click();
      const anchors = () =>
        page()
          .locator(
            ".teaching-parent-panel,.teaching-target,.teaching-parent-controls,.teaching-save-area",
          )
          .evaluateAll((nodes) =>
            nodes.map((node) => {
              const r = node.getBoundingClientRect();
              return [r.x, r.y, r.width, r.height];
            }),
          );
      await at("l06.t05.turn0");
      const original = await anchors();
      for (let i = 0; i < 28; i++) {
        await at(`l06.t05.turn${i}`);
        await expect(
          page().locator('button[data-action="parentReady"]'),
        ).toHaveCount(0);
        if (i === 14) await replace("l06.t05.turn14");
        await act("continue");
      }
      await at("l06.t05.ready");
      await expect(
        page().locator('[data-presentation="readiness"]'),
      ).toBeVisible();
      await expect(
        page().locator('[data-presentation="readiness"] .teaching-target'),
      ).toBeEmpty();
      await expect(
        page().locator('[data-presentation="readiness"] .teaching-target'),
      ).toHaveAttribute("aria-hidden", "true");
      await expect(
        page().locator('[data-presentation="readiness"] .teaching-cue'),
      ).toBeEmpty();
      await expect(
        page().locator('[data-presentation="readiness"] .teaching-cue'),
      ).toHaveAttribute("aria-hidden", "true");
      await expect(page().locator(".teaching-parent-heading")).toHaveText(
        "Parent decisionParent only",
      );
      expect(await anchors()).toEqual(original);
      await replace("l06.t05.ready");
      await act("continue");
      await at("l06.t05.turn14");
      await act("continue");
      await act("continue");
      await at("l06.t05.turn16");
      for (let i = 0; i < 3; i++) await act("back");
      await at("l06.t05.ready");
      await expect(
        page().locator('button[data-action="parentReady"]'),
      ).toHaveCount(0);
      await expect(page().locator('button[data-action="repeat"]')).toHaveCount(
        0,
      );
      await replace("l06.t05.ready");
      await expect(
        page().locator('button[data-action="parentReady"]'),
      ).toHaveCount(0);
      for (let i = 0; i < 3; i++) await act("continue");
      await at("l06.t05.turn16");
      for (let i = 16; i < 28; i++) {
        await at(`l06.t05.turn${i}`);
        await expect(
          page().locator('button[data-action="parentReady"]'),
        ).toHaveCount(0);
        await act("continue");
      }
      await at("l06.t05.ready");
      expect(await anchors()).toEqual(original);
      await page().screenshot({
        path: testInfo.outputPath("readiness-decision.png"),
      });
      await act("parentReady");
      await expect(
        page().getByText("Task complete", { exact: true }),
      ).toBeVisible();
      await page()
        .getByRole("button", { name: "Undo advance", exact: true })
        .click();
      await at("l06.t05.ready");
      await page()
        .getByRole("button", { name: "Undo advance", exact: true })
        .click();
      await at("l06.t05.turn27");
      await expect(
        page().locator('button[data-action="parentReady"]'),
      ).toHaveCount(0);
      await act("continue");
      await at("l06.t05.ready");
      await act("parentReady");
      await expect(
        page().getByText("Task complete", { exact: true }),
      ).toBeVisible();
      await testInfo.attach("actual-browser-replacements.json", {
        body: JSON.stringify({ viewport, replacements }, null, 2),
        contentType: "application/json",
      });
    } finally {
      await context?.close();
    }
  });
