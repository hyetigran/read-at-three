import {
  installInitialSetupObservation,
  completeInitialSetup,
} from "./parent-setup.ts";
import { reloadSavedTurn } from "./reload-saved-turn.ts";
import { chromium, expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base =
  process.env.READING_BROWSER_BUILD === "1"
    ? "http://127.0.0.1:5175"
    : "http://127.0.0.1:5174";
const taskId = "fixture.graph.l01.t03";

async function at({ page, suffix }: { page: Page; suffix: string }) {
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    `${taskId}.${suffix}`,
  );
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("main")).toHaveAttribute(
    "data-context",
    "committed",
  );
  await expect(page.locator(".teaching-target")).toHaveText("");
  await expect(
    page.getByRole("button", { name: "Hold silent pointing cue", exact: true }),
  ).toHaveCount(0);
}

async function act({ page, name = "Continue" }: { page: Page; name?: string }) {
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
}

async function start(page: Page) {
  await installInitialSetupObservation(page);
  await page.goto(base);
  await completeInitialSetup({ page });
  await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
  await page.getByRole("button", { name: "Start Task 3", exact: true }).click();
  await at({ page, suffix: "am-model" });
}

async function geometry(page: Page) {
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

async function toIndependentIf(page: Page) {
  for (const { name, suffix } of [
    { name: "Continue", suffix: "am-together" },
    { name: "Continue", suffix: "am-again" },
    { name: "Ready", suffix: "am-independent" },
    { name: "Continue", suffix: "if-together" },
    { name: "Continue", suffix: "if-again" },
    { name: "Ready", suffix: "if-independent" },
  ]) {
    await act({ page, name });
    await at({ page, suffix });
  }
}

for (const viewport of [
  { width: 900, height: 600 },
  { width: 1280, height: 800 },
]) {
  test(`continuous oral task keeps all ten turns and mandatory Again at ${viewport.width} by ${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await start(page);
    const anchors = await geometry(page);
    await expect(page.locator(".teaching-parent-heading")).toContainText(
      "Parent models",
    );
    await act({ page });
    await at({ page, suffix: "am-together" });
    await expect(page.locator(".teaching-parent-heading")).toContainText(
      "Parent and child together",
    );
    await expect(
      page.getByRole("button", { name: "Ready", exact: true }),
    ).toHaveCount(0);
    await act({ page });
    await at({ page, suffix: "am-again" });
    await act({ page, name: "Practice again" });
    await at({ page, suffix: "am-again" });
    await expect(page.locator(".teaching-parent-heading")).toContainText(
      "Parent and child together",
    );
    expect(await geometry(page)).toEqual(anchors);
    await act({ page, name: "Ready" });
    await at({ page, suffix: "am-independent" });
    await expect(page.locator(".teaching-parent-heading")).toContainText(
      "Child responds",
    );
    await act({ page, name: "Back" });
    await at({ page, suffix: "am-again" });
    await expect(
      page.getByRole("button", { name: "Ready", exact: true }),
    ).toHaveCount(0);
    await act({ page });
    await at({ page, suffix: "am-independent" });

    for (const item of ["if", "in"]) {
      await act({ page });
      await at({ page, suffix: `${item}-together` });
      await expect(
        page.getByRole("button", { name: "Ready", exact: true }),
      ).toHaveCount(0);
      await act({ page });
      await at({ page, suffix: `${item}-again` });
      await act({ page, name: "Ready" });
      await at({ page, suffix: `${item}-independent` });
      expect(await geometry(page)).toEqual(anchors);
    }
    await expect(
      page.getByRole("heading", { name: "Task complete", exact: true }),
    ).toHaveCount(0);
    await act({ page });
    await expect(
      page.getByRole("heading", { name: "Task complete", exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Task complete", exact: true }),
    ).toBeVisible();
  });
}

test("joint correction readiness precedes the independent test and complete source restart prefix", async ({
  page,
}) => {
  await start(page);
  await toIndependentIf(page);
  const anchors = await geometry(page);
  await act({ page, name: "Synthetic continuous help" });
  await at({ page, suffix: "correction-if-independent.model" });
  await expect(page.locator(".teaching-parent-heading")).toContainText(
    "Correction · Parent models",
  );
  await act({ page });
  await at({ page, suffix: "correction-if-independent.together" });
  await expect(page.locator(".teaching-parent-heading")).toContainText(
    "Correction · Parent and child together",
  );
  await act({ page, name: "Practice again" });
  await at({ page, suffix: "correction-if-independent.together" });
  await act({ page, name: "Ready" });
  await at({ page, suffix: "correction-if-independent.test" });
  await expect(page.locator(".teaching-parent-heading")).toContainText(
    "Correction · Child responds",
  );
  await expect(page.locator(".teaching-praise")).toHaveCount(1);
  await act({ page });
  await at({ page, suffix: "am-model" });
  await toIndependentIf(page);
  await act({ page });
  await at({ page, suffix: "in-together" });
  await expect(
    page.getByRole("heading", { name: "Task complete", exact: true }),
  ).toHaveCount(0);
  expect(await geometry(page)).toEqual(anchors);
});

test("failed correction Ready keeps the committed joint turn and retries the identical command", async ({
  page,
}) => {
  await page.addInitScript(`
    const NativeWorker=window.Worker;let armed=false,held=false;const attempts=[];
    window.armContinuousReady=()=>{armed=true;};
    window.readContinuousReadyAttempts=()=>attempts.slice();
    window.Worker=class extends NativeWorker {
      postMessage(message,options){
        if(armed&&(message?.kind === 'execute' && message.operation.kind === 'teaching')&&message.operation.command?.kind==='navigate'&&message.operation.command.payload.action.kind==='parentReady'){
          attempts.push(JSON.stringify(message.operation));
          if(!held){held=true;this.dispatchEvent(new MessageEvent('message',{data:{id:message.id,kind:'failed',message:'Injected continuous Ready save failure'}}));return;}
        }
        super.postMessage(message,options);
      }
    };
  `);
  await start(page);
  await act({ page });
  await act({ page, name: "Synthetic continuous help" });
  await at({ page, suffix: "correction-am-together.model" });
  await act({ page });
  await at({ page, suffix: "correction-am-together.together" });
  const checkpoint = await page
    .locator("main")
    .getAttribute("data-checkpoint-id");
  await page.evaluate(() => {
    if (
      "armContinuousReady" in window &&
      typeof window.armContinuousReady === "function"
    )
      window.armContinuousReady();
    else throw new Error("Ready failure hook missing");
  });
  await act({ page, name: "Ready" });
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await at({ page, suffix: "correction-am-together.together" });
  expect(await page.locator("main").getAttribute("data-checkpoint-id")).toBe(
    checkpoint,
  );
  await expect(
    page.getByRole("button", { name: "Ready", exact: true }),
  ).toBeDisabled();
  await act({ page, name: "Retry save" });
  await at({ page, suffix: "correction-am-together.test" });
  const attempts = await page.evaluate(() => {
    if (
      "readContinuousReadyAttempts" in window &&
      typeof window.readContinuousReadyAttempts === "function"
    )
      return window.readContinuousReadyAttempts();
    throw new Error("Ready attempts missing");
  });
  expect(attempts).toHaveLength(2);
  expect(attempts[0]).toEqual(attempts[1]);
  await reloadSavedTurn({
    page,
    turnId: "fixture.graph.l01.t03.correction-am-together.test",
  });
  await at({ page, suffix: "correction-am-together.test" });
});

test("correction practice and its independent test survive full browser process restarts", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "reading-continuous-restart-"),
  );
  let context = await chromium.launchPersistentContext(directory, {
    headless: true,
    viewport: { width: 900, height: 600 },
  });
  try {
    let page = await context.newPage();
    await start(page);
    await act({ page });
    await act({ page });
    await act({ page, name: "Synthetic continuous help" });
    await act({ page });
    await act({ page, name: "Practice again" });
    await at({ page, suffix: "correction-am-again.together" });
    await act({ page, name: "Pause" });
    await context.close();
    context = await chromium.launchPersistentContext(directory, {
      headless: true,
      viewport: { width: 900, height: 600 },
    });
    page = await context.newPage();
    await page.goto(`${base}/teaching`);
    await expect(
      page.getByRole("heading", { name: "Reading is paused", exact: true }),
    ).toBeVisible();
    await act({ page, name: "Resume" });
    await at({ page, suffix: "correction-am-again.together" });
    await act({ page, name: "Ready" });
    await at({ page, suffix: "correction-am-again.test" });
    await context.close();
    context = await chromium.launchPersistentContext(directory, {
      headless: true,
      viewport: { width: 900, height: 600 },
    });
    page = await context.newPage();
    await page.goto(`${base}/teaching`);
    await at({ page, suffix: "correction-am-again.test" });
    await act({ page });
    await at({ page, suffix: "am-model" });
  } finally {
    await context.close();
    await rm(directory, { recursive: true, force: true });
  }
});
