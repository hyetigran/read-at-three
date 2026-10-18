import { chromium, expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { syntheticLessonFiveCompletion } from "../lesson-five-completion-fixture.ts";
import { completeInitialSetup } from "./parent-setup.ts";
import {
  drawPractice,
  latestDocuments,
  probe,
  writingAction,
} from "./writing-helpers.ts";

test("the readonly V3 statement and existing tracing ink survive actual browser process replacement and Undo", async ({}, testInfo) => {
  test.setTimeout(180000);
  const { candidate, taskIds } = await syntheticLessonFiveCompletion();
  const baseURL = testInfo.project.use.baseURL;
  if (!baseURL) throw Error("Configured browser origin required");
  const profile = testInfo.outputPath("persistent-profile");
  await mkdir(profile, { recursive: true });
  const options = {
    headless: true,
    viewport: { width: 900, height: 600 },
    baseURL,
  };
  let context = await chromium.launchPersistentContext(profile, options);
  async function open() {
    const page = await context.newPage();
    await page.route("**/curriculum/development.json", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(candidate),
      }),
    );
    await probe(page);
    await page.goto("/");
    return page;
  }
  try {
    let page = await open();
    await completeInitialSetup({ page });
    await page.getByRole("link", { name: "Lesson 5", exact: true }).click();
    await page
      .getByRole("button", { name: "Start Task 9", exact: true })
      .click();
    const statement = `${taskIds[2]}.fixture.plan.target-0.respond`,
      tracing = `${taskIds[2]}.fixture.plan.target-0.trace`;
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "true",
    );
    await drawPractice(page);
    await writingAction(page);
    await expect(page.locator("main")).toHaveAttribute(
      "data-turn-id",
      statement,
    );
    const saved = (await latestDocuments(page))[0];
    expect(saved?.strokes).toHaveLength(3);
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    page = await open();
    await page
      .getByRole("button", { name: "Resume · Lesson 5 · Task 9", exact: true })
      .click();
    await expect(page.locator("main")).toHaveAttribute(
      "data-turn-id",
      statement,
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "false",
    );
    let restored = (await latestDocuments(page))[0];
    expect(restored?.token.documentId).toBe(saved?.token.documentId);
    expect(restored?.strokes).toEqual(saved?.strokes);
    expect(restored?.histories).toEqual(saved?.histories);
    await writingAction(page);
    await expect(page.locator("main")).toHaveAttribute("data-turn-id", tracing);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "true",
    );
    await drawPractice(page);
    await writingAction(page, "Pause");
    const traced = (await latestDocuments(page))[0];
    expect(traced?.strokes).toHaveLength(6);
    await context.close();
    context = await chromium.launchPersistentContext(profile, options);
    page = await open();
    await page
      .getByRole("button", { name: "Resume · Lesson 5 · Task 9", exact: true })
      .click();
    await expect(page.locator("main")).toHaveAttribute("data-turn-id", tracing);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "true",
    );
    restored = (await latestDocuments(page))[0];
    expect(restored?.token.documentId).toBe(saved?.token.documentId);
    expect(restored?.strokes).toEqual(traced?.strokes);
    expect(restored?.histories).toEqual(traced?.histories);
    await writingAction(page, "Undo advance");
    await expect(page.locator("main")).toHaveAttribute(
      "data-turn-id",
      statement,
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "false",
    );
    restored = (await latestDocuments(page))[0];
    expect(restored?.strokes).toEqual(traced?.strokes);
    expect(restored?.histories).toEqual(traced?.histories);
    await writingAction(page);
    await expect(page.locator("main")).toHaveAttribute("data-turn-id", tracing);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "true",
    );
  } finally {
    await context.close();
  }
});
