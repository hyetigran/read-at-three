import { expect, test } from "@playwright/test";
import {
  atWriting,
  boardPoint,
  drawStroke,
  finalizedWriting,
  latestDocuments,
  probe,
  requests,
  responses,
  startWriting,
  writingAction,
} from "./writing-helpers.ts";

test("six source-ordered lesson menus expose all 45 truthful modules without starting a run", async ({
  page,
}) => {
  await probe(page);
  await page.goto("/");
  await expect(page.locator(".course-pedestal")).toHaveCount(6);
  for (const [index, count] of [6, 7, 8, 7, 9, 8].entries()) {
    await page
      .getByRole("link", { name: `Lesson ${index + 1}`, exact: true })
      .click();
    await expect(page.locator(".course-task-module")).toHaveCount(count);
    expect(
      await page
        .locator(".course-task-module")
        .evaluateAll((elements) =>
          elements.map((element) =>
            Number(element.getAttribute("data-task-number")),
          ),
        ),
    ).toEqual(Array.from({ length: count }, (_, i) => i + 1));
    if (index > 0) {
      await expect(
        page.getByText("Teaching content not installed", { exact: true }),
      ).toHaveCount(count);
      await expect(page.locator("button[data-action]")).toHaveCount(0);
    }
    await page
      .getByRole("link", { name: "Back to lesson map", exact: true })
      .click();
  }
  expect(
    (await requests(page)).filter(
      (request) =>
        request.kind === "execute" && request.operation.kind === "teaching",
    ),
  ).toHaveLength(0);
  const reads = (await responses(page)).filter(
    (response) =>
      response.kind === "application" &&
      response.value.application.kind === "ready",
  );
  expect(reads).toHaveLength(1);
});
for (const viewport of [
  { width: 900, height: 600 },
  { width: 1280, height: 800 },
]) {
  test(`long lesson menu has three columns, visible source titles and natural third-row scroll at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.locator(".course-pedestal")).toHaveCount(6);
    const mapGeometry = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll(".course-pedestal")];
      const controls = [
        ...document.querySelectorAll(
          ".course-map-header a,.course-map-bottom a,.course-map-bottom button",
        ),
      ];
      const collisions = nodes.flatMap((node) =>
        controls.flatMap((control) => {
          const a = node.getBoundingClientRect(),
            b = control.getBoundingClientRect();
          return Math.min(a.right, b.right) > Math.max(a.left, b.left) &&
            Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)
            ? [
                {
                  lesson: node.getAttribute("data-lesson-number"),
                  control: control.getAttribute("aria-label"),
                },
              ]
            : [];
        }),
      );
      const hits = nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return (
          document
            .elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
            ?.closest("[data-lesson-number]") === node
        );
      });
      return { collisions, hits };
    });
    expect(mapGeometry.collisions).toEqual([]);
    expect(mapGeometry.hits).toEqual([true, true, true, true, true, true]);
    await page.getByRole("link", { name: "Lesson 5", exact: true }).click();
    const modules = page.locator(".course-task-module");
    await expect(modules).toHaveCount(9);
    const geometry = await modules.evaluateAll((elements) =>
      elements.map((element) => {
        const r = element.getBoundingClientRect();
        const title = element.querySelector("h2");
        return {
          x: r.x,
          y: r.y,
          w: r.width,
          titleFits:
            !!title &&
            title.scrollWidth <= title.clientWidth &&
            title.scrollHeight <= title.clientHeight,
        };
      }),
    );
    expect(geometry.every((item) => item.titleFits)).toBe(true);
    expect(new Set(geometry.map((item) => item.x)).size).toBe(3);
    expect(new Set(geometry.map((item) => item.y)).size).toBe(3);
    const scroll = page.locator("[data-menu-scroll]");
    expect(
      await scroll.evaluate(
        (element) => element.scrollHeight > element.clientHeight,
      ),
    ).toBe(true);
    await scroll.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(modules.nth(8)).toBeInViewport();
    await expect(page.locator(".course-header")).toBeInViewport();
  });
}
test("real browser Back waits for ink and Pause, rejects drawing through the closed route and resumes exact documents", async ({
  page,
}) => {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await atWriting(page, "m-model");
  const first = (await latestDocuments(page))[0];
  if (!first) throw new Error("Writing document missing");
  await drawStroke(page, [
    { x: 100, y: 110 },
    { x: 150, y: 130 },
  ]);
  await finalizedWriting(page, first.token.documentId, 1);
  await page.evaluate("window.armWritingFault('hold-teaching')");
  const back = page.goBack();
  await expect
    .poll(() => page.evaluate("window.hasHeldTeachingWrite()"))
    .toBe(true);
  await expect(page).toHaveURL(/\/teaching$/);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-writable",
    "false",
  );
  const point = await boardPoint(page, 250, 140);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 15, point.y + 15);
  await page.mouse.up();
  await page.evaluate("window.releaseHeldTeachingWrite()");
  await back;
  await expect(page).toHaveURL(/\/lessons\//);
  const paused = (await requests(page)).filter(
    (request) =>
      request.kind === "execute" &&
      request.operation.kind === "teaching" &&
      "action" in request.operation.command.payload &&
      request.operation.command.payload.action.kind === "pause",
  );
  expect(paused).toHaveLength(1);
  await page
    .locator('[data-task-number="6"]')
    .getByRole("button", { name: "Resume", exact: true })
    .click();
  await atWriting(page, "m-model");
  const after = (await latestDocuments(page))[0];
  expect(after?.token.documentId).toBe(first.token.documentId);
  expect(after?.strokes).toHaveLength(1);
});
test("failed route Pause and repeated exact Retry keep the destination blocked until acknowledgement", async ({
  page,
}) => {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await page.evaluate("window.armWritingFault('teaching-before-twice')");
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry save and leave", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/teaching$/);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-writable",
    "false",
  );
  await page
    .getByRole("button", { name: "Retry save and leave", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry save and leave", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Retry save and leave", exact: true })
    .click();
  await expect(page).toHaveURL(/\/lessons\//);
  const pauses = (await requests(page)).filter(
    (request) =>
      (request.kind === "execute" || request.kind === "recoverTeaching") &&
      request.operation.kind === "teaching" &&
      "action" in request.operation.command.payload &&
      request.operation.command.payload.action.kind === "pause",
  );
  expect(pauses).toHaveLength(3);
  if (pauses[0]?.kind !== "execute" || pauses[0].operation.kind !== "teaching")
    throw new Error("Pause command missing");
  for (const retry of pauses) {
    if (
      (retry.kind !== "execute" || retry.operation.kind !== "teaching") &&
      retry.kind !== "recoverTeaching"
    )
      throw new Error("Pause retry missing");
    expect(retry.operation).toEqual(pauses[0].operation);
  }
});
test("earlier handwriting opens read-only without selecting work or changing the current run", async ({
  page,
}) => {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  const first = (await latestDocuments(page))[0];
  if (!first) throw new Error("Document missing");
  await drawStroke(page, [
    { x: 110, y: 110 },
    { x: 170, y: 140 },
  ]);
  await finalizedWriting(page, first.token.documentId, 1);
  await writingAction(page, "Skip writing");
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  const task = page.locator('[data-task-number="6"]');
  await task.locator("summary").click();
  const before = (await requests(page)).filter(
    (request) =>
      request.kind === "execute" && request.operation.kind === "teaching",
  ).length;
  await task.getByRole("link", { name: /View read-only/ }).click();
  await expect(page.locator(".course-saved-drawing")).toHaveCount(2);
  await expect(page.locator(".course-saved-drawing polyline")).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(
    (await requests(page)).filter(
      (request) =>
        request.kind === "execute" && request.operation.kind === "teaching",
    ),
  ).toHaveLength(before);
  await page.goBack();
  await task.getByRole("button", { name: "Replay task", exact: true }).click();
  await atWriting(page, "m-sound");
  expect(
    (await latestDocuments(page)).map((item) => item.token.documentId),
  ).not.toContain(first.token.documentId);
});
test("the adult word gate expires on exit and reload, and direct settings URLs cannot grant access", async ({
  page,
}) => {
  await page.goto("/parent/settings?approved=true");
  await expect(page).toHaveURL(/\/parent\/gate$/);
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Type the word", { exact: true }).fill("wrong");
  await page
    .getByRole("button", { name: "Continue to parent settings", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("does not match");
  await page.getByLabel("Type the word", { exact: true }).fill("meadow");
  await page
    .getByRole("button", { name: "Continue to parent settings", exact: true })
    .click();
  await expect(page).toHaveURL(/\/parent\/settings$/);
  await expect(
    page.getByRole("heading", { name: "Saved on this device", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Return to lesson map", exact: true })
    .click();
  await page.goBack();
  await expect(page).toHaveURL(/\/parent\/gate$/);
  await page.getByLabel("Type the word", { exact: true }).fill("meadow");
  await page
    .getByRole("button", { name: "Continue to parent settings", exact: true })
    .click();
  await page.reload();
  await expect(page).toHaveURL(/\/parent\/gate$/);
  await expect(page.getByLabel("Type the word", { exact: true })).toHaveValue(
    "",
  );
});

test("menu scroll and focused entry survive two teaching round trips", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await startWriting(page);
  await writingAction(page);
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  for (let round = 0; round < 2; round++) {
    const scroll = page.locator("[data-menu-scroll]");
    await scroll.evaluate(
      (element) => (element.scrollTop = element.scrollHeight),
    );
    const resume = page
      .locator('[data-task-number="6"]')
      .getByRole("button", { name: "Resume", exact: true });
    await resume.focus();
    const focus = await resume.getAttribute("id");
    const top = await scroll.evaluate((element) => element.scrollTop);
    expect(top).toBeGreaterThan(0);
    await resume.click();
    await atWriting(page, "m-model");
    await page.getByRole("button", { name: "Activities", exact: true }).click();
    await expect
      .poll(() => scroll.evaluate((element) => element.scrollTop))
      .toBe(top);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.id))
      .toBe(focus);
  }
});
test("late explicit selection cannot navigate or reopen an outdated menu", async ({
  page,
}) => {
  await probe(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
  await page.evaluate("window.armWritingFault('hold-teaching')");
  await page.getByRole("button", { name: "Start Task 6", exact: true }).click();
  await expect
    .poll(() => page.evaluate("window.hasHeldTeachingWrite()"))
    .toBe(true);
  await page
    .getByRole("link", { name: "Back to lesson map", exact: true })
    .click();
  await page.evaluate("window.releaseHeldTeachingWrite()");
  await expect(
    page.getByRole("button", { name: /^Resume · Lesson 1 · Task 6/ }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("canvas")).toHaveCount(0);
});
