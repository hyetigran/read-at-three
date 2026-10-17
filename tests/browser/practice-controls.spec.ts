import { expect, test } from "@playwright/test";
import { visibleInkStrokes } from "@readatthree/teaching";
import {
  atWritableWriting,
  drawStroke,
  latestDocuments,
  probe,
  requests,
  startWriting,
  writingAction,
} from "./writing-helpers.ts";
import type { Page } from "@playwright/test";
async function prepare(page: Page) {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await drawStroke(page, [
    { x: 100, y: 110 },
    { x: 140, y: 130 },
  ]);
  await writingAction(page);
  await atWritableWriting(page, "m-tracing");
}
async function childIds(page: Page) {
  const document = (await latestDocuments(page))[0];
  const history = document?.histories.find(
    (value) => value.layer === "tracing",
  );
  if (!document || !history) throw new Error("Practice history missing");
  return visibleInkStrokes({ history, strokes: document.strokes });
}
for (const viewport of [
  { width: 900, height: 600 },
  { width: 1280, height: 800 },
]) {
  test(`saved practice tools keep model, source and anchors through Clear, branch and restart at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await prepare(page);
    const model = (await latestDocuments(page))[0]?.strokes.filter(
      (value) => value.layer === "model",
    );
    const anchors = () =>
      page
        .locator(
          ".teaching-parent-panel,canvas,.teaching-parent-controls,.teaching-writing-footer",
        )
        .evaluateAll((elements) =>
          elements.map((element) => {
            const r = element.getBoundingClientRect();
            return [r.x, r.y, r.width, r.height];
          }),
        );
    const before = await anchors();
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeDisabled();
    await drawStroke(page, [
      { x: 180, y: 110 },
      { x: 220, y: 130 },
    ]);
    await drawStroke(page, [
      { x: 260, y: 110 },
      { x: 300, y: 130 },
    ]);
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeEnabled();
    await writingAction(page, "Clear practice");
    expect(await childIds(page)).toEqual([]);
    expect(
      (await latestDocuments(page))[0]?.strokes.filter(
        (value) => value.layer === "tracing",
      ),
    ).toHaveLength(2);
    await writingAction(page, "Undo ink");
    const restored = await childIds(page);
    expect(restored).toHaveLength(2);
    await writingAction(page, "Undo ink");
    expect(await childIds(page)).toEqual(restored.slice(0, 1));
    await drawStroke(page, [
      { x: 350, y: 110 },
      { x: 390, y: 130 },
    ]);
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Redo ink", exact: true }),
    ).toBeDisabled();
    await page.reload();
    await atWritableWriting(page, "m-tracing");
    expect(await anchors()).toEqual(before);
    const document = (await latestDocuments(page))[0];
    expect(
      document?.strokes.filter((value) => value.layer === "model"),
    ).toEqual(model);
    expect(
      document?.strokes.some((value) => value.strokeId === restored[1]),
    ).toBe(false);
    expect(await childIds(page)).toHaveLength(2);
    await writingAction(page, "Undo ink");
    await writingAction(page, "Redo ink");
    expect(await childIds(page)).toHaveLength(2);
    expect(await anchors()).toEqual(before);
    await expect(
      page.locator('.teaching-writing-tools [data-origin="added"]'),
    ).toHaveCount(3);
    await writingAction(page, "Confirm tracing");
    await atWritableWriting(page, "m-independent");
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeDisabled();
    await writingAction(page, "Back");
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeDisabled();
    expect(await anchors()).toEqual(before);
  });
}
for (const fault of [
  "teaching-before-twice",
  "teaching-after-reconcile",
  "teaching-receipt-command-id",
  "control-restore-revision",
]) {
  test(`practice exact control Retry survives ${fault} without another Undo`, async ({
    page,
  }) => {
    await prepare(page);
    await drawStroke(page, [{ x: 180, y: 110 }]);
    await drawStroke(page, [{ x: 260, y: 110 }]);
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeEnabled();
    await page.evaluate(`window.armWritingFault(${JSON.stringify(fault)})`);
    await page.getByRole("button", { name: "Undo ink", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Redo ink", exact: true }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Retry save", exact: true }).click();
    if (
      fault === "teaching-before-twice" ||
      fault === "teaching-after-reconcile"
    ) {
      await expect(
        page.getByRole("button", { name: "Retry save", exact: true }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Retry save", exact: true })
        .click();
    }
    await expect(
      page.getByRole("button", { name: "Redo ink", exact: true }),
    ).toBeEnabled();
    expect(await childIds(page)).toHaveLength(1);
    const controls = (await requests(page)).filter(
      (request) =>
        (request.kind === "dispatch" || request.kind === "recoverTeaching") &&
        request.command.kind === "writingControl",
    );
    expect(controls.length).toBeGreaterThanOrEqual(2);
    expect(
      new Set(
        controls.map((request) =>
          "command" in request ? JSON.stringify(request.command) : "invalid",
        ),
      ).size,
    ).toBe(1);
    await page.reload();
    await atWritableWriting(page, "m-tracing");
    expect(await childIds(page)).toHaveLength(1);
  });
}

test("a held Query summary does not delay the next contact and exact acknowledged tokens gate tools", async ({
  page,
}) => {
  await prepare(page);
  await page.evaluate("window.armWritingFault('hold-summary')");
  await drawStroke(page, [
    { x: 180, y: 110 },
    { x: 220, y: 130 },
  ]);
  await expect.poll(() => page.evaluate("window.hasHeldSummary()")).toBe(true);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeDisabled();
  const before = (await requests(page)).filter(
    (request) =>
      request.kind === "dispatchInk" &&
      request.command.edit.kind === "finalize",
  ).length;
  await drawStroke(page, [
    { x: 260, y: 110 },
    { x: 300, y: 130 },
  ]);
  await expect
    .poll(
      async () =>
        (await requests(page)).filter(
          (request) =>
            request.kind === "dispatchInk" &&
            request.command.edit.kind === "finalize",
        ).length,
    )
    .toBe(before + 1);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeDisabled();
  await page.evaluate("window.releaseHeldSummary()");
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeEnabled();
  await writingAction(page, "Clear practice");
  expect(
    (await latestDocuments(page))[0]?.strokes
      .filter((stroke) => stroke.layer === "tracing")
      .map((stroke) => stroke.pointCount),
  ).toEqual([3, 3]);
  await writingAction(page, "Undo ink");
  await page.evaluate("window.armWritingFault('ahead-summary')");
  await drawStroke(page, [{ x: 350, y: 110 }]);
  await expect
    .poll(
      async () =>
        (await requests(page)).filter(
          (request) => request.kind === "readPracticeControls",
        ).length,
    )
    .toBeGreaterThanOrEqual(4);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeDisabled();
  await drawStroke(page, [{ x: 400, y: 110 }]);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeEnabled();
  await writingAction(page, "Clear practice");
  expect(
    (await latestDocuments(page))[0]?.strokes.filter(
      (stroke) => stroke.layer === "tracing",
    ),
  ).toHaveLength(4);
});

test("known control rejection stays fenced until canonical reload without reexecuting the rejection", async ({
  page,
}) => {
  await prepare(page);
  await drawStroke(page, [{ x: 180, y: 110 }]);
  await drawStroke(page, [{ x: 260, y: 110 }]);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeEnabled();
  await page.evaluate("window.armWritingFault('reject-control')");
  await page.getByRole("button", { name: "Undo ink", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeDisabled();
  const controls = async () =>
    (await requests(page)).filter(
      (request) =>
        request.kind === "dispatch" &&
        request.command.kind === "writingControl",
    ).length;
  expect(await controls()).toBe(1);
  await writingAction(page, "Retry save");
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeEnabled();
  expect(await controls()).toBe(1);
  expect(await childIds(page)).toHaveLength(2);
  await writingAction(page, "Undo ink");
  expect(await controls()).toBe(2);
  expect(await childIds(page)).toHaveLength(1);
});
