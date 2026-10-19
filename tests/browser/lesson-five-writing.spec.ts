import { expect, test } from "@playwright/test";
import { syntheticLessonFiveCompletion } from "../lesson-five-completion-fixture.ts";
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
  test(`V3 real writing preserves readonly statement and all six ink layers at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
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
      .getByRole("button", { name: "Start Task 9", exact: true })
      .click();
    const at = async (suffix: string) => {
      await expect(page.locator("main")).toHaveAttribute(
        "data-turn-id",
        `${taskIds[2]}.fixture.plan.target-${suffix}`,
      );
      await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
    };
    await at("0.demonstrate");
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
    await at("0.respond");
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
      turnId: `${taskIds[2]}.fixture.plan.target-0.respond`,
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
    await at("0.demonstrate");
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "false",
    );
    await writingAction(page);
    await at("0.respond");
    await page.evaluate("window.armWritingFault('teaching-before')");
    await writingAction(page);
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toBeVisible();
    await at("0.respond");
    await writingAction(page, "Retry save");
    await at("0.trace");
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
      ["0.trace", 0, "Confirm tracing"],
      ["0.independent", 0, "Confirm independent writing"],
      ["1.demonstrate", 1, "Continue"],
      ["1.respond", 1, "Continue"],
      ["1.trace", 1, "Confirm tracing"],
      ["1.independent", 1, "Confirm independent writing"],
    ] as const) {
      await at(suffix);
      expect(await anchors()).toEqual(geometry);
      if (suffix !== "1.respond") {
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
    await at("1.independent");
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "true",
    );
    await writingAction(page, "Confirm independent writing");
    await expect(
      page.getByText("Writing task complete", { exact: true }),
    ).toBeVisible();
  });
