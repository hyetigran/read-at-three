import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { reloadSavedTurn } from "./reload-saved-turn.ts";
import {
  atWriting,
  atWritableWriting,
  drawStroke,
  latestDocuments,
  probe,
  requests,
  startWriting,
  writingAction,
} from "./writing-helpers.ts";

async function anchors(page: Page) {
  return page
    .locator(
      ".teaching-parent-panel,.teaching-target,.teaching-cue,.teaching-continue",
    )
    .evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return [rect.x, rect.y, rect.width, rect.height];
      }),
    );
}
for (const viewport of [
  { width: 900, height: 600 },
  { width: 1280, height: 800 },
]) {
  test(`parent Undo is distinct, highlighted and anchored through acceptance, restart and completion at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
    await page
      .locator('[data-task-number="1"]')
      .getByRole("button", { name: "Start Task 1", exact: true })
      .click();
    const screen = page.locator("main[data-committed-turn-id]");
    await expect(screen).toHaveAttribute(
      "data-committed-turn-id",
      "fixture.graph.l01.t01.s01.model-m",
    );
    const before = await anchors(page);
    await expect(
      page.getByRole("button", { name: "Undo advance", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(screen).toHaveAttribute(
      "data-committed-turn-id",
      "fixture.graph.l01.t01.s02.response-m",
    );
    const undo = page.getByRole("button", {
      name: "Undo advance",
      exact: true,
    });
    await expect(undo).toBeVisible();
    await expect(undo.locator('[data-origin="added"]')).toHaveText(
      "Undo advance",
    );
    expect(await anchors(page)).toEqual(before);
    await reloadSavedTurn({
      page,
      turnId: "fixture.graph.l01.t01.s02.response-m",
    });
    await expect(screen).toHaveAttribute(
      "data-committed-turn-id",
      "fixture.graph.l01.t01.s02.response-m",
    );
    await undo.click();
    await expect(screen).toHaveAttribute(
      "data-committed-turn-id",
      "fixture.graph.l01.t01.s01.model-m",
    );
    await expect(undo).toHaveCount(0);
    expect(await anchors(page)).toEqual(before);
    for (let i = 0; i < 6; i++)
      await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(
      page.getByText("Task complete", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Undo advance", exact: true })
      .click();
    await expect(screen).toHaveAttribute(
      "data-committed-turn-id",
      "fixture.graph.l01.t01.s06.again-s",
    );
    await expect(screen).toHaveAttribute("data-run-status", "inProgress");
    expect(await anchors(page)).toEqual(before);
  });
}

test("writing Undo keeps child ink through a lost commit reply and repeats the exact barrier command", async ({
  page,
}) => {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await drawStroke(page, [
    { x: 100, y: 110 },
    { x: 150, y: 130 },
  ]);
  await writingAction(page);
  await atWritableWriting(page, "m-tracing");
  await drawStroke(page, [
    { x: 180, y: 110 },
    { x: 230, y: 130 },
  ]);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeEnabled();
  await writingAction(page, "Pause");
  await writingAction(page, "Resume");
  await atWritableWriting(page, "m-tracing");
  const before = (await latestDocuments(page))[0];
  if (!before) throw new Error("Canonical writing required");
  await page.evaluate("window.armWritingFault('teaching-after')");
  await page.getByRole("button", { name: "Undo advance", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-writable",
    "false",
  );
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await atWritableWriting(page, "m-model");
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeDisabled();
  const restored = (await latestDocuments(page))[0];
  expect(restored?.token.documentId).toBe(before.token.documentId);
  expect(restored?.strokes).toEqual(before.strokes);
  expect(restored?.histories).toEqual(before.histories);
  const deliveries = (await requests(page)).flatMap((request) =>
    (request.kind === "execute" || request.kind === "recoverTeaching") &&
    request.operation.kind === "teaching" &&
    request.operation.command.kind === "writingUndoAdvance"
      ? [request.operation]
      : [],
  );
  expect(deliveries).toHaveLength(2);
  expect(deliveries[1]).toEqual(deliveries[0]);
  await reloadSavedTurn({ page, turnId: "fixture.graph.l01.t06.m-model" });
  await atWriting(page, "m-model");
  const cold = (await latestDocuments(page))[0];
  expect(cold?.strokes).toEqual(before.strokes);
  expect(cold?.histories).toEqual(before.histories);
});
