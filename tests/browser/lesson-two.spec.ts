import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { CommittedProjection } from "@readatthree/teaching";
import { completeInitialSetup } from "./parent-setup.ts";
import {
  probe,
  responses,
  requests,
  drawStroke,
  latestDocuments,
  finalizedWriting,
} from "./writing-helpers.ts";

async function projection(
  page: Page,
): Promise<Exclude<CommittedProjection, { kind: "recovery" }>> {
  await expect(page.locator("main[aria-busy]")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  const reads = (await responses(page)).filter(
    (response) =>
      response.kind === "application" &&
      response.value.application.kind === "ready",
  );
  const last = reads.at(-1);
  if (
    !last ||
    last.kind !== "application" ||
    last.value.application.kind !== "ready"
  )
    throw new Error("Actual committed worker projection missing");
  const projection = last.value.application.projection;
  return projection;
}
async function act(page: Page, kind: string) {
  await page.locator(`button[data-action="${kind}"]`).first().click();
  await expect(page.locator("main[aria-busy]")).toHaveAttribute(
    "aria-busy",
    "false",
  );
}

for (const viewport of [
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
]) {
  test(`seven synthetic extension tasks preserve review and writing cadence at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    test.setTimeout(240000);
    await page.setViewportSize(viewport);
    const fixture = await readFile(
      "tests/fixtures/lesson-two-development-package.json",
      "utf8",
    );
    await page.route("**/curriculum/development.json", (route) =>
      route.fulfill({ contentType: "application/json", body: fixture }),
    );
    await probe(page);
    await page.goto("/");
    await completeInitialSetup({ page });
    await page.getByRole("link", { name: "Lesson 2", exact: true }).click();
    await expect(
      page.locator('.course-task-module[data-available="true"]'),
    ).toHaveCount(7);
    const foreground: Record<number, string[]> = {};
    let reviewSelected = false,
      reviewHelp = false,
      resumed = false;
    const writingKinds: string[] = [];
    const finalized = new Map<string, number>();
    for (let task = 1; task <= 7; task++) {
      await page
        .getByRole("button", { name: `Start Task ${task}`, exact: true })
        .click();
      foreground[task] = [];
      for (let step = 0; step < 120; step++) {
        let current = await projection(page);
        if (current.kind === "completed" || current.kind === "writingResult")
          break;
        if (
          current.kind === "reviewSelection" &&
          current.committedChoice === null
        ) {
          expect(current.items).toHaveLength(7);
          await page.locator("input[data-review-item]").nth(6).check();
          await page.locator("input[data-review-item]").nth(1).check();
          await act(page, "commitReviewSelection");
          reviewSelected = true;
          continue;
        }
        if (current.kind === "teaching") {
          if (!foreground[task]?.includes(current.turn.id))
            foreground[task]?.push(current.turn.id);
          if ([2, 3, 5, 6].includes(task)) {
            await expect(page.locator(".teaching-target")).toHaveText("");
            await expect(
              page.getByRole("button", {
                name: "Hold silent pointing cue",
                exact: true,
              }),
            ).toHaveCount(0);
          }
          if ([4, 5].includes(task))
            expect(
              current.actions.some((action) => action.intent.kind === "help"),
            ).toBe(false);
          if (
            task === 2 &&
            reviewSelected &&
            !reviewHelp &&
            current.actions.some((action) => action.intent.kind === "help")
          ) {
            await act(page, "help");
            reviewHelp = true;
            const supported = await projection(page);
            expect(supported.kind).toBe("teaching");
            if (supported.kind !== "teaching")
              throw new Error("Supported correction missing");
            const turn = supported.turn;
            await act(page, "pause");
            await page.reload();
            await expect(
              page.getByRole("heading", {
                name: "Reading is paused",
                exact: true,
              }),
            ).toBeVisible();
            await page
              .getByRole("button", { name: "Resume", exact: true })
              .click();
            const restored = await projection(page);
            expect(restored.kind).toBe("teaching");
            if (restored.kind !== "teaching")
              throw new Error("Restored correction missing");
            expect(restored.turn).toEqual(turn);
            resumed = true;
            continue;
          }
        }
        if (current.kind === "writing") {
          const presentation = current.turn.presentation;
          expect(presentation.kind).toBe("writing");
          if (presentation.kind !== "writing")
            throw new Error("Writing presentation missing");
          writingKinds.push(presentation.obligation.kind);
          await expect(
            page.locator(".teaching-guidance [data-origin=added]").first(),
          ).toBeVisible();
          if (presentation.obligation.kind !== "soundResponse")
            await expect(
              page
                .locator(".teaching-guidance strong [data-origin=added]")
                .first(),
            ).toBeVisible();
          await expect(page.locator("canvas")).toBeInViewport();
          const document = (await latestDocuments(page)).find(
            (document) => document.token.targetId === presentation.targetId,
          );
          expect(document).toBeDefined();
          if (!document) throw new Error("Canonical target missing");
          if (presentation.obligation.kind === "soundResponse") {
            await expect(page.locator("canvas")).toHaveAttribute(
              "data-writable",
              "false",
            );
            const before = (await requests(page)).filter(
              (request) =>
                request.kind === "execute" && request.operation.kind === "ink",
            ).length;
            await drawStroke(page, [
              { x: 100, y: document.boardY + 200 },
              { x: 150, y: document.boardY + 220 },
            ]);
            expect(
              (await requests(page)).filter(
                (request) =>
                  request.kind === "execute" &&
                  request.operation.kind === "ink",
              ),
            ).toHaveLength(before);
          } else {
            await expect(page.locator("canvas")).toHaveAttribute(
              "data-writable",
              "true",
            );
            await drawStroke(page, [
              { x: 100, y: document.boardY + 200 },
              { x: 150, y: document.boardY + 220 },
            ]);
            const count = (finalized.get(document.token.documentId) ?? 0) + 1;
            finalized.set(document.token.documentId, count);
            await finalizedWriting(page, document.token.documentId, count);
          }
          if (presentation.obligation.kind === "phaseConfirmation") {
            expect(
              current.actions.some(
                (action) => action.intent.kind === "continue",
              ),
            ).toBe(false);
            if (presentation.obligation.phase === "childTracing")
              expect(presentation.obligation.practice).toMatchObject({
                kind: "qualitative",
                furtherPractice: "parentDirected",
              });
            else
              expect(presentation.obligation.practice).toMatchObject({
                kind: "range",
                minimum: 3,
                maximum: 5,
              });
          }
          current = await projection(page);
        }
        const next = [
          "confirmTracing",
          "confirmIndependent",
          "parentReady",
          "confirmReviewItem",
          "continue",
        ]
          .map((kind) =>
            current.actions.find((action) => action.intent.kind === kind),
          )
          .find(Boolean);
        expect(next, `Advancing action at ${current.kind}`).toBeDefined();
        if (!next) throw new Error("Next projected action missing");
        await act(page, next.intent.kind);
      }
      const complete = await projection(page);
      expect(["completed", "writingResult"]).toContain(complete.kind);
      if (complete.kind !== "completed" && complete.kind !== "writingResult")
        throw new Error("Task did not finish");
      expect(complete.runStatus).toBe("completed");
      if (task === 7) {
        expect(complete.kind).toBe("writingResult");
        const documents = await latestDocuments(page);
        expect(documents).toHaveLength(2);
        for (const document of documents)
          for (const layer of ["model", "tracing", "independent"])
            expect(
              document.strokes.filter(
                (stroke) =>
                  stroke.layer === layer && stroke.status === "finished",
              ),
            ).toHaveLength(1);
      }
      await page
        .getByRole("button", { name: "Activities", exact: true })
        .click();
      await expect(page.locator(".course-task-module")).toHaveCount(7);
    }
    expect(foreground[1]).toHaveLength(6);
    expect(foreground[3]).toHaveLength(13);
    expect(foreground[4]).toHaveLength(2);
    expect(foreground[5]).toHaveLength(7);
    expect(foreground[6]).toHaveLength(4);
    expect(writingKinds).toEqual([
      "parentModel",
      "soundResponse",
      "phaseConfirmation",
      "phaseConfirmation",
      "parentModel",
      "soundResponse",
      "phaseConfirmation",
      "phaseConfirmation",
    ]);
    expect({ reviewSelected, reviewHelp, resumed }).toEqual({
      reviewSelected: true,
      reviewHelp: true,
      resumed: true,
    });
    await expect(
      page.getByText("Lesson complete · Revisit any activity", { exact: true }),
    ).toBeVisible();
  });
}
