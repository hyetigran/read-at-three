import { test, expect } from "@playwright/test";
import { syntheticPrintedPair } from "../printed-board-fixture.ts";
import { probe, responses, requests } from "./writing-helpers.ts";
import { completeInitialSetup } from "./parent-setup.ts";
for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
]) {
  test(`printed pair stays on its complete board and saves fast due at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    const { envelope } = await syntheticPrintedPair();
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
    await page
      .getByRole("button", { name: "Start Task 4", exact: true })
      .click();
    const board = page.locator(".printed-board");
    await expect(board).toHaveAttribute("data-cue-stage", "idle");
    await expect(board.locator("[data-target]")).toHaveCount(3);
    const before = await board
      .locator("[data-anchor], .teaching-glyph")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const box = node.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        }),
      );
    const cue = page.getByRole("button", {
      name: "Play pointing cue",
      exact: true,
    });
    const countBefore = (await requests(page)).length;
    const start = await board
      .locator('[data-focused="true"] [data-anchor="start"]')
      .evaluate((node) => {
        if (!(node instanceof SVGCircleElement))
          throw new Error("Actual start circle required");
        const point = new DOMPoint(
          node.cx.baseVal.value,
          node.cy.baseVal.value,
        ).matrixTransform(node.getScreenCTM() ?? undefined);
        const hit = document.elementFromPoint(point.x, point.y);
        return {
          x: point.x,
          y: point.y,
          contact:
            hit instanceof Element &&
            hit.closest(".printed-board-contact") !== null,
        };
      });
    expect(start.contact).toBe(true);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await expect(board).toHaveAttribute("data-cue-stage", "underHold");
    await page.mouse.up();
    await expect(board).toHaveAttribute("data-cue-stage", "idle");
    await cue.focus();
    await page.keyboard.down(" ");
    await expect(board).toHaveAttribute("data-cue-stage", "underHold");
    await page.keyboard.up(" ");
    await expect(board).toHaveAttribute("data-cue-stage", "idle");
    expect((await requests(page)).length).toBe(countBefore);
    await page.locator('button[data-action="continue"]').click();
    await expect(page.locator("main")).toHaveAttribute(
      "data-committed-turn-id",
      "fixture.board.fast",
    );
    expect(
      await board
        .locator("[data-anchor], .teaching-glyph")
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const box = node.getBoundingClientRect();
            return { x: box.x, y: box.y, width: box.width, height: box.height };
          }),
        ),
    ).toEqual(before);
    await cue.focus();
    await page.keyboard.down("Enter");
    await expect(board).toHaveAttribute("data-cue-stage", "endpointHeld");
    await page.keyboard.up("Enter");
    await page.reload();
    await page
      .getByRole("button", { name: "Resume", exact: true })
      .first()
      .click();
    await expect(page.locator("main")).toHaveAttribute(
      "data-committed-turn-id",
      "fixture.board.fast",
    );
    const reads = await responses(page);
    expect(
      reads.some(
        (response) =>
          response.kind === "application" &&
          response.value.application.kind === "ready" &&
          response.value.application.projection.kind === "teaching" &&
          response.value.application.projection.turn.id ===
            "fixture.board.fast",
      ),
    ).toBe(true);
    await page.locator('button[data-action="continue"]').click();
    await expect(
      page.getByRole("heading", { name: "Task complete", exact: true }),
    ).toBeVisible();
  });
}

import { syntheticPrintedCourse } from "../printed-board-fixture.ts";
for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
]) {
  test(`all eighteen printed obligations retain fixed diagrams at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(180000);
    const { envelope } = await syntheticPrintedCourse();
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
    for (const [task, total] of [
      [1, 3],
      [2, 3],
      [4, 12],
    ] as const) {
      await page
        .getByRole("button", { name: `Start Task ${task}`, exact: true })
        .click();
      const board = page.locator(".printed-board");
      await expect(board).toBeVisible();
      const geometry = () =>
        board.locator("[data-anchor], .teaching-glyph").evaluateAll((nodes) =>
          nodes.map((node) => {
            const r = node.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          }),
        );
      const before = await geometry();
      expect(before).toHaveLength(task === 1 ? 4 : 12);
      for (const box of before) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      }
      for (let index = 0; index < total; index++) {
        await expect(page.locator("main")).toHaveAttribute(
          "data-committed-turn-id",
          `fixture.printed.t${task}.n${index}`,
        );
        expect(await geometry()).toEqual(before);
        if (index === 0)
          await page.screenshot({
            path: testInfo.outputPath(`board-${task}-${viewport.width}.png`),
          });
        if (task === 1 && index === 2) {
          await page.evaluate("window.armWritingFault('hold-teaching')");
          await page.locator('button[data-action="help"]').click();
          await expect(page.locator("main")).toHaveAttribute(
            "data-context",
            "uncommitted",
          );
          await expect(board.locator("button")).toHaveCount(0);
          expect(await geometry()).toEqual(before);
          await page.evaluate("window.releaseHeldTeachingWrite()");
          await expect(page.locator("main")).toHaveAttribute(
            "data-context",
            "committed",
          );
          await expect(page.locator("main")).toHaveAttribute(
            "data-committed-turn-id",
            "fixture.printed.support",
          );
          await expect(page.locator("main")).toHaveAttribute(
            "aria-busy",
            "false",
          );
          await expect(board.locator("button")).toHaveCount(0);
          await page.locator('button[data-action="continue"]').click();
          await expect(page.locator("main")).toHaveAttribute(
            "data-committed-turn-id",
            "fixture.printed.t1.n1",
          );
          await page.locator('button[data-action="continue"]').click();
          await expect(page.locator("main")).toHaveAttribute(
            "data-committed-turn-id",
            "fixture.printed.t1.n2",
          );
        }
        if (task === 4 && index === 9) {
          const cue = page.getByRole("button", {
            name: "Play pointing cue",
            exact: true,
          });
          const writes = async () =>
            (await requests(page)).filter((r) => r.kind === "execute").length;
          const beforeWrites = await writes();
          for (const reducedMotion of ["reduce", "no-preference"] as const) {
            await page.emulateMedia({ reducedMotion });
            await expect(cue).toBeEnabled();
            await cue.focus();
            await page.keyboard.down(" ");
            await expect(board).toHaveAttribute("data-cue-stage", "startHold");
            await page.keyboard.up("Enter");
            await expect(board).toHaveAttribute("data-cue-stage", "startHold");
            await page.keyboard.up(" ");
            await expect(board).toHaveAttribute(
              "data-cue-stage",
              "endpointFeedback",
            );
            await expect(board).toHaveAttribute("data-cue-stage", "idle");
            for (const event of ["blur", "visibilitychange"]) {
              await cue.focus();
              await page.keyboard.down("Enter");
              await expect(board).toHaveAttribute(
                "data-cue-stage",
                "startHold",
              );
              await page.evaluate((name) => {
                (name === "blur" ? window : document).dispatchEvent(
                  new Event(name),
                );
              }, event);
              await expect(board).toHaveAttribute("data-cue-stage", "idle");
              await page.keyboard.up("Enter");
              await expect(board).toHaveAttribute("data-cue-stage", "idle");
              await page.evaluate("window.dispatchEvent(new Event('focus'))");
              await expect(cue).toBeEnabled();
            }
            const point = await board
              .locator('[data-focused="true"] [data-anchor="start"]')
              .evaluate((node) => {
                if (!(node instanceof SVGCircleElement))
                  throw new Error("Start circle required");
                const p = new DOMPoint(
                  node.cx.baseVal.value,
                  node.cy.baseVal.value,
                ).matrixTransform(node.getScreenCTM() ?? undefined);
                return { x: p.x, y: p.y };
              });
            const box = { x: point.x - 1, y: point.y - 1, width: 2, height: 2 };
            await page.mouse.move(
              box.x + box.width / 2,
              box.y + box.height / 2,
            );
            await page.mouse.down();
            await expect(board).toHaveAttribute("data-cue-stage", "startHold");
            await cue.dispatchEvent("pointerup", {
              pointerId: 99,
              isPrimary: false,
            });
            await expect(board).toHaveAttribute("data-cue-stage", "startHold");
            await page.mouse.up();
            await expect(board).toHaveAttribute(
              "data-cue-stage",
              "endpointFeedback",
            );
            await expect(board).toHaveAttribute("data-cue-stage", "idle");
            await page.mouse.down();
            await expect(board).toHaveAttribute("data-cue-stage", "startHold");
            await cue.evaluate((button) => {
              for (let pointer = 0; pointer < 10; pointer++)
                if (button.hasPointerCapture(pointer))
                  button.releasePointerCapture(pointer);
            });
            await page.mouse.move(
              box.x + box.width / 2 + 1,
              box.y + box.height / 2,
            );
            await expect(board).toHaveAttribute("data-cue-stage", "idle");
            await page.mouse.up();
            await expect(board).toHaveAttribute("data-cue-stage", "idle");
          }
          expect(await writes()).toBe(beforeWrites);
          await cue.focus();
          await page.keyboard.down(" ");
          await expect(board).toHaveAttribute("data-cue-stage", "startHold");
          await page.setViewportSize({ width: 800, height: 600 });
          await expect(board).toHaveCount(0);
          await page.setViewportSize(viewport);
          await page.keyboard.up(" ");
          await expect(
            page.getByRole("heading", {
              name: "Reading is paused",
              exact: true,
            }),
          ).toBeVisible();
          await page
            .getByRole("button", { name: "Resume", exact: true })
            .click();
          await expect(page.locator("main")).toHaveAttribute(
            "data-committed-turn-id",
            "fixture.printed.t4.n9",
          );
          await expect(board).toHaveAttribute("data-cue-stage", "idle");
          await expect(cue).toBeEnabled();
          await page.evaluate("window.armWritingFault('hold-teaching')");
          await page.locator('button[data-action="continue"]').click();
          await expect(board).toHaveAttribute("data-cue-stage", "idle");
          await expect(cue).toBeDisabled();
          await page.evaluate("window.releaseHeldTeachingWrite()");
          await expect(page.locator("main")).toHaveAttribute(
            "data-committed-turn-id",
            "fixture.printed.t4.n10",
          );
          continue;
        }
        await page.locator('button[data-action="continue"]').click();
      }
      await expect(
        page.getByRole("heading", { name: "Task complete", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Activities", exact: true })
        .click();
    }
    await expect(
      page.locator('.course-task-module[data-available="true"]'),
    ).toHaveCount(3);
  });
}
