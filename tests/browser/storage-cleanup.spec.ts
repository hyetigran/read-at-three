import { expect, test } from "@playwright/test";
import { installTransactionDriver } from "./transaction-driver.ts";
import {
  probe,
  startWriting,
  writingAction,
  atWriting,
  atWritableWriting,
  drawPractice,
  drawStroke,
  finalizedWriting,
  latestDocuments,
  requests,
  writingTask,
} from "./writing-helpers.ts";
import { reloadSavedTurn } from "./reload-saved-turn.ts";

for (const scenario of [
  "commit-before",
  "commit-after",
  "failed-opening",
] as const)
  test(`parent cleanup ${scenario} preserves pending ink through exact Retry and reload`, async ({
    context,
    page,
  }) => {
    test.setTimeout(120000);
    const cleanupCut =
      scenario === "failed-opening" ? "commit-after" : scenario;
    await installTransactionDriver(context, page);
    await probe(page);
    await startWriting(page);
    await writingAction(page);
    await atWritableWriting(page, "m-model");
    await drawPractice(page);
    const historical = (await latestDocuments(page))[0];
    if (!historical) throw new Error("Historical drawing missing");
    await finalizedWriting(page, historical.token.documentId, 3);
    await writingAction(page, "Skip writing");
    await page.getByRole("button", { name: "Activities", exact: true }).click();
    await page
      .getByRole("listitem")
      .filter({ has: page.getByText("Task 6", { exact: true }) })
      .getByRole("button", { name: "Replay task", exact: true })
      .click();
    await atWriting(page, "m-sound");
    await writingAction(page);
    await atWritableWriting(page, "m-model");
    await page.evaluate(
      "window.transactionDriverControl('arm', {cut:'commit-before',operation:'ink',edit:'finalize'})",
    );
    await drawStroke(page, [
      { x: 320, y: 120 },
      { x: 360, y: 140 },
    ]);
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toBeVisible();
    const pending = (await requests(page)).findLast(
      (request) =>
        request.kind === "execute" &&
        request.operation.kind === "ink" &&
        request.operation.command.edit.kind === "finalize",
    );
    if (pending?.kind !== "execute") throw new Error("Pending ink is missing");
    if (cleanupCut === "commit-before") await context.setOffline(true);
    await page
      .getByRole("button", { name: "Parent storage cleanup", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Remove older drawings" });
    await expect(dialog.getByRole("checkbox")).toHaveCount(0);
    await dialog.getByLabel("Type the word").fill("meadow");
    await dialog
      .getByRole("button", { name: "Continue to parent settings", exact: true })
      .click();
    await expect(dialog.getByRole("checkbox")).toHaveCount(1);
    await dialog.getByRole("checkbox").check();
    await page.evaluate(
      "window.transactionDriverControl('arm', " +
        JSON.stringify({ cut: cleanupCut, operation: "cleanup" }) +
        ")",
    );
    await dialog
      .getByRole("button", {
        name: "Permanently remove selected drawings",
        exact: true,
      })
      .click();
    await expect(
      dialog.getByText(/Cleanup could not be confirmed/),
    ).toBeVisible();
    const cleanup = (await requests(page)).findLast(
      (request) => request.kind === "cleanupStorage",
    );
    if (cleanup?.kind !== "cleanupStorage")
      throw new Error("Cleanup identity missing");
    expect(cleanup.command.drawings.map((token) => token.documentId)).toEqual([
      historical.token.documentId,
    ]);
    if (cleanupCut === "commit-after")
      await page.evaluate(
        "window.activeWritingWorker.dispatchEvent(new ErrorEvent('error', {message: 'Cleanup connection lost after commit'}))",
      );
    if (scenario === "failed-opening") {
      await page.evaluate(`new Promise(resolve => {
        navigator.locks.request('read-at-three.sqlite.v1', async () => {
          resolve();
          await new Promise(release => { window.releaseCleanupLease = release; });
        });
      })`);
      const retry = dialog.getByRole("button", {
        name: "Retry same cleanup",
        exact: true,
      });
      await retry.click();
      await expect(retry).toBeEnabled();
      await expect(
        dialog.getByText(/Cleanup could not be confirmed/),
      ).toBeVisible();
      await page.evaluate("window.releaseCleanupLease()");
    }
    await dialog
      .getByRole("button", { name: "Retry same cleanup", exact: true })
      .click();
    await expect(
      dialog.getByText(/selected older drawing bytes were removed/),
    ).toBeVisible();
    const attempts = (await requests(page)).filter(
      (request) => request.kind === "cleanupStorage",
    );
    expect(attempts).toHaveLength(scenario === "failed-opening" ? 3 : 2);
    expect(
      attempts.every(
        (request) =>
          JSON.stringify(request.command) === JSON.stringify(cleanup.command),
      ),
    ).toBe(true);
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-writable",
      "false",
    );
    await dialog
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    if (cleanupCut === "commit-before") {
      await expect(
        page.getByRole("button", { name: "Continue", exact: true }),
      ).toBeDisabled();
      await writingAction(page, "Retry save");
    }
    await atWritableWriting(page, "m-model");
    const retried = (await requests(page)).filter(
      (request) =>
        (request.kind === "execute" || request.kind === "recoverInk") &&
        request.operation.command.commandId ===
          pending.operation.command.commandId,
    );
    expect(retried).toHaveLength(2);
    expect(
      retried.map((request) => {
        if (request.kind !== "execute" && request.kind !== "recoverInk")
          throw new Error("Expected retained execution");
        return request.operation;
      }),
    ).toEqual([pending.operation, pending.operation]);
    await context.setOffline(false);
    await reloadSavedTurn({ page, turnId: `${writingTask}.m-model` });
    await atWritableWriting(page, "m-model");
    expect((await latestDocuments(page))[0]?.strokes).toHaveLength(1);
  });
