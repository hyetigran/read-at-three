import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { parsePreparationAvailability } from "@readatthree/teaching";
import {
  atWriting,
  probe,
  requests,
  responses,
  writingAction,
} from "./writing-helpers.ts";

async function writingMenu(page: Page) {
  const fixture = await readFile(
    new URL("../fixtures/writing-development-package.json", import.meta.url),
  );
  await page.route("**/curriculum/development.json", (route) =>
    route.fulfill({ contentType: "application/json", body: fixture }),
  );
  await probe(page);
  await page.addInitScript(`
    const ExistingWorker = window.Worker;
    let rejectNextEntry = false;
    window.rejectNextCourseEntry = () => { rejectNextEntry = true; };
    window.Worker = class extends ExistingWorker {
      postMessage(value, options) {
        if (rejectNextEntry && value.kind === "execute" && value.operation.kind === "teaching" && (value.operation.command.kind === "select" || value.operation.command.kind === "writingSelect")) {
          rejectNextEntry = false;
          super.postMessage({ ...value, operation: { ...value.operation, command: { ...value.operation.command, expectedRevision: "99" } } }, options);
          return;
        }
        super.postMessage(value, options);
      }
    };
  `);
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  const opening = (await requests(page)).find(
    (request) => request.kind === "openRecovery",
  );
  if (opening?.kind !== "openRecovery")
    throw new Error("Actual opening preparation is required.");
  const preparation = await parsePreparationAvailability(
    opening.preparation,
    async (text) => createHash("sha256").update(text).digest("hex"),
  );
  if (preparation.kind !== "available")
    throw new Error("Actual verified preparation is required.");
  await page.getByLabel("Type the word", { exact: true }).fill("meadow");
  await page
    .getByRole("button", { name: "Continue setup", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: preparation.document.body.title.copy.text,
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "I have read this preparation", exact: true })
    .click();
  await expect(page.getByRole("radio")).toHaveCount(8);
  await expect(
    page.getByRole("radio", { name: "Rabbit", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".course-map")).toBeVisible();
  await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
  await page.getByRole("button", { name: "Start Task 6", exact: true }).click();
  await atWriting(page, "m-sound");
  await writingAction(page);
  await atWriting(page, "m-model");
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  await expect(page.locator(".course-menu")).toBeVisible();
}

async function task2Selection(page: Page) {
  const selection = (await requests(page)).findLast(
    (request) =>
      request.kind === "execute" &&
      request.operation.kind === "teaching" &&
      (request.operation.command.kind === "select" ||
        request.operation.command.kind === "writingSelect") &&
      request.operation.command.payload.taskId === "fixture.graph.l01.t02",
  );
  if (selection?.kind !== "execute" || selection.operation.kind !== "teaching")
    throw new Error("Actual Task 2 operation is required.");
  return selection.operation;
}

async function settledTask2(page: Page) {
  await expect
    .poll(async () => {
      const reply = (await responses(page)).findLast(
        (response) => response.kind === "application",
      );
      return reply?.kind === "application" &&
        reply.value.application.kind === "ready" &&
        reply.value.application.projection.kind === "teaching"
        ? reply.value.application.projection.taskId
        : null;
    })
    .toBe("fixture.graph.l01.t02");
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
}

test("same retained task entry reaches teaching after two connection-replacing Retry recoveries", async ({
  page,
}, testInfo) => {
  await writingMenu(page);
  await page.evaluate("window.armWritingFault('teaching-before-twice')");
  await page.getByRole("button", { name: "Start Task 2", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  const retained = await task2Selection(page);
  expect(retained.command).toMatchObject({
    kind: "writingSelect",
    expectedRevision: "2",
    payload: {
      intent: "start",
      taskId: "fixture.graph.l01.t02",
      sessionId: null,
    },
  });
  await writingAction(page, "Retry save");
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await writingAction(page, "Retry save");
  await expect(page).toHaveURL(/\/teaching$/);
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /t02/,
  );
  const traffic = (await requests(page)).filter(
    (request) =>
      (request.kind === "execute" || request.kind === "recoverTeaching") &&
      request.operation.kind === "teaching" &&
      (request.operation.command.kind === "select" ||
        request.operation.command.kind === "writingSelect") &&
      request.operation.command.payload.taskId === "fixture.graph.l01.t02",
  );
  expect(traffic.map((request) => request.kind)).toEqual([
    "execute",
    "recoverTeaching",
    "recoverTeaching",
  ]);
  for (const request of traffic) {
    if (!("operation" in request))
      throw new Error("Retained operation is required.");
    expect(request.operation).toEqual(retained);
  }
  const replies = await responses(page);
  const receipt = replies.findLast(
    (response) => response.kind === "teachingRecovery",
  );
  if (
    receipt?.kind !== "teachingRecovery" ||
    receipt.value.result.kind !== "committed"
  )
    throw new Error("Actual recovered receipt is required.");
  expect(receipt.value.result).toMatchObject({
    commandId: retained.command.commandId,
    revision: "3",
  });
  const application = replies.findLast(
    (response) => response.kind === "application",
  );
  if (
    application?.kind !== "application" ||
    application.value.application.kind !== "ready"
  )
    throw new Error("Actual committed application is required.");
  expect(application.value.directory.selection).toEqual(retained.selection);
  expect(application.value.application.projection).toMatchObject({
    kind: "teaching",
    taskId: "fixture.graph.l01.t02",
    profileRevision: "3",
    revision: "0",
    packageHash: retained.command.payload.packageHash,
  });
  await testInfo.attach("retained-entry-recovery", {
    body: JSON.stringify(
      { retained, traffic, receipt, application, url: page.url() },
      null,
      2,
    ),
    contentType: "application/json",
  });
});

test("a rejected task entry reloads the menu and requires explicit Resume", async ({
  page,
}) => {
  await writingMenu(page);
  await page.evaluate("window.rejectNextCourseEntry()");
  await page.getByRole("button", { name: "Start Task 2", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "The saved reading place changed. Retry to reload it without advancing.",
  );
  const rejected = await task2Selection(page);
  expect(rejected.command.expectedRevision).toBe("99");
  const rejection = (await responses(page)).findLast(
    (response) => response.kind === "execution",
  );
  if (rejection?.kind !== "execution" || rejection.value.kind !== "teaching")
    throw new Error("Actual teaching rejection is required.");
  expect(rejection.value.result).toMatchObject({
    kind: "rejected",
    code: "stale-revision",
  });
  await writingAction(page, "Retry save");
  await expect(page).toHaveURL(/\/lessons\/fixture.lesson$/);
  await expect(page.locator(".course-menu")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await atWriting(page, "m-model");
});

test("history departure and return do not revive a held original task entry", async ({
  page,
}, testInfo) => {
  await writingMenu(page);
  await page.evaluate("window.armWritingFault('hold-teaching')");
  await page.getByRole("button", { name: "Start Task 2", exact: true }).click();
  await page.waitForFunction("window.hasHeldTeachingWrite()");
  const retained = await task2Selection(page);
  await page
    .getByRole("link", { name: "Back to lesson map", exact: true })
    .click();
  await expect(page.locator(".course-map")).toBeVisible();
  await page.goBack();
  await expect(page.locator(".course-menu")).toBeVisible();
  await page.evaluate("window.releaseHeldTeachingWrite()");
  await settledTask2(page);
  await expect(page).toHaveURL(/\/lessons\/fixture.lesson$/);
  await expect(page.locator(".course-menu")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Resume saved activity", exact: true }),
  ).toBeEnabled();
  await testInfo.attach("departed-entry-commit", {
    body: JSON.stringify(
      { retained, replies: await responses(page), url: page.url() },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await page
    .getByRole("button", { name: "Resume saved activity", exact: true })
    .click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /t02/,
  );
});

test("history departure retires a failed task entry while exact Retry still resolves its save", async ({
  page,
}, testInfo) => {
  await writingMenu(page);
  await page.evaluate("window.armWritingFault('teaching-before-twice')");
  await page.getByRole("button", { name: "Start Task 2", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  const retained = await task2Selection(page);
  await page
    .getByRole("link", { name: "Back to lesson map", exact: true })
    .click();
  await expect(page.locator(".course-map")).toBeVisible();
  await page.goBack();
  await expect(page.locator(".course-menu")).toBeVisible();
  await writingAction(page, "Retry save");
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await writingAction(page, "Retry save");
  await settledTask2(page);
  await expect(page).toHaveURL(/\/lessons\/fixture.lesson$/);
  await expect(page.locator(".course-menu")).toBeVisible();
  const traffic = (await requests(page)).filter(
    (request) =>
      (request.kind === "execute" || request.kind === "recoverTeaching") &&
      request.operation.kind === "teaching" &&
      (request.operation.command.kind === "select" ||
        request.operation.command.kind === "writingSelect") &&
      request.operation.command.payload.taskId === "fixture.graph.l01.t02",
  );
  expect(traffic.map((request) => request.kind)).toEqual([
    "execute",
    "recoverTeaching",
    "recoverTeaching",
  ]);
  for (const request of traffic) {
    if (!("operation" in request))
      throw new Error("Retained operation is required.");
    expect(request.operation).toEqual(retained);
  }
  await testInfo.attach("departed-entry-exact-retry", {
    body: JSON.stringify(
      { retained, traffic, replies: await responses(page), url: page.url() },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await page
    .getByRole("button", { name: "Resume saved activity", exact: true })
    .click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /t02/,
  );
});
