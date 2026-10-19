import { expect, test } from "@playwright/test";
import { syntheticLessonSixCourse } from "../lesson-six-fixture.ts";
import { completeInitialSetup } from "./parent-setup.ts";
import { reloadSavedTurn } from "./reload-saved-turn.ts";
import {
  drawPractice,
  latestDocuments,
  probe,
  requests,
  writingAction,
} from "./writing-helpers.ts";
for (const viewport of [
  { width: 900, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
])
  test(`Lesson six writing preserves readonly statement and all six ink layers at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
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
      .getByRole("button", { name: "Start Task 8", exact: true })
      .click();
    const at = async (suffix: string) => {
      await expect(page.locator("main")).toHaveAttribute(
        "data-turn-id",
        `${taskIds[7]}.fixture.lesson-six.${suffix}`,
      );
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    };
    await at("e.demonstrate");
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "true",
    );
    const anchors = () =>
      page
        .locator(
          ".teaching-parent-panel,canvas,.teaching-parent-controls,.teaching-save-area",
        )
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const r = node.getBoundingClientRect();
            return [r.x, r.y, r.width, r.height];
          }),
        );
    const geometry = await anchors();
    await drawPractice(page);
    await writingAction(page);
    await at("e.respond");
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "false",
    );
    await expect(page.locator(".teaching-parent-heading")).toContainText(
      "Parent gives instructions",
    );
    const model = (await latestDocuments(page))[0];
    expect(model?.strokes).toHaveLength(3);
    const before = (await requests(page)).length;
    await drawPractice(page);
    expect((await requests(page)).length).toBe(before);
    expect(await anchors()).toEqual(geometry);
    await reloadSavedTurn({
      page,
      turnId: `${taskIds[7]}.fixture.lesson-six.e.respond`,
    });
    const restored = (await latestDocuments(page))[0];
    expect(restored?.token.documentId).toBe(model?.token.documentId);
    expect(restored?.strokes).toEqual(model?.strokes);
    expect(restored?.histories).toEqual(model?.histories);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "false",
    );
    await writingAction(page, "Back");
    await at("e.demonstrate");
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "false",
    );
    await writingAction(page);
    await at("e.respond");
    await page.evaluate("window.armWritingFault('teaching-before')");
    await writingAction(page);
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toBeVisible();
    await at("e.respond");
    await writingAction(page, "Retry save");
    await at("e.trace");
    expect(await anchors()).toEqual(geometry);
    const all = await requests(page);
    const recovered = all.filter(
      (request) => request.kind === "recoverTeaching",
    );
    expect(recovered).toHaveLength(1);
    const retried = recovered[0];
    if (retried?.kind !== "recoverTeaching")
      throw Error("Exact teaching recovery required");
    const original = all.find(
      (request) =>
        request.kind === "execute" &&
        request.operation.kind === "teaching" &&
        request.operation.command.commandId ===
          retried.operation.command.commandId,
    );
    if (original?.kind !== "execute")
      throw Error("Original teaching envelope required");
    expect(retried.operation).toEqual(original.operation);
    for (const [suffix, row, action] of [
      ["e.trace", 0, "Confirm tracing"],
      ["e.independent", 0, "Confirm independent writing"],
      ["s.demonstrate", 1, "Continue"],
      ["s.respond", 1, "Continue"],
      ["s.trace", 1, "Confirm tracing"],
      ["s.independent", 1, "Confirm independent writing"],
    ] as const) {
      await at(suffix);
      expect(await anchors()).toEqual(geometry);
      if (suffix !== "s.respond") {
        await expect(page.locator("canvas")).toHaveAttribute(
          "data-writable",
          "true",
        );
        await drawPractice(page, row);
      } else
        await expect(page.locator("canvas")).toHaveAttribute(
          "data-writable",
          "false",
        );
      await writingAction(page, action);
    }
    await expect(
      page.getByText("Writing task complete", { exact: true }),
    ).toBeVisible();
    for (const document of await latestDocuments(page))
      for (const layer of ["model", "tracing", "independent"]) {
        expect(
          document.strokes.filter((stroke) => stroke.layer === layer),
        ).toHaveLength(3);
        expect(
          document.histories.find((history) => history.layer === layer)
            ?.operations,
        ).toHaveLength(3);
      }
    await writingAction(page, "Undo advance");
    await at("s.independent");
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "true",
    );
    await writingAction(page, "Confirm independent writing");
    await expect(
      page.getByText("Writing task complete", { exact: true }),
    ).toBeVisible();
  });
