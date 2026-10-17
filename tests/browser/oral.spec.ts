import { chromium, expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base =
  process.env.READING_BROWSER_BUILD === "1"
    ? "http://127.0.0.1:5175"
    : "http://127.0.0.1:5174";
const taskId = (task: number) => `fixture.graph.l01.t0${task}`;
async function saved(page: Page) {
  await expect(page.locator("main[aria-busy]")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(page.locator("main[data-context]")).toHaveAttribute(
    "data-context",
    "committed",
  );
}
async function at({
  page,
  task,
  suffix,
}: {
  page: Page;
  task: number;
  suffix: string;
}) {
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    `${taskId(task)}.${suffix}`,
  );
  await saved(page);
  await expect(page.locator(".teaching-target")).toHaveText("");
  await expect(
    page.getByRole("button", { name: "Hold silent pointing cue", exact: true }),
  ).toHaveCount(0);
}
async function act({ page, name = "Continue" }: { page: Page; name?: string }) {
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.locator("main[aria-busy]")).toHaveAttribute(
    "aria-busy",
    "false",
  );
}
async function start({ page, task = 2 }: { page: Page; task?: number }) {
  await page.goto(base);
  await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
  await page
    .getByRole("button", { name: `Start Task ${task}`, exact: true })
    .click();
  await at({ page, task, suffix: task === 2 ? "model" : "response-01" });
}
async function toSelection(page: Page) {
  await act({ page });
  await at({ page, task: 2, suffix: "response-01" });
  await act({ page, name: "Ready" });
  for (let item = 2; item <= 6; item++) {
    await at({ page, task: 2, suffix: `response-0${item}` });
    await act({ page });
  }
  await expect(
    page.getByRole("group", { name: "Words to review" }),
  ).toBeVisible();
  await saved(page);
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

test("oral model, all six responses, readiness and explicit empty review keep fixed anchors", async ({
  page,
}) => {
  await start({ page });
  const anchors = await geometry(page);
  await act({ page });
  await at({ page, task: 2, suffix: "response-01" });
  await expect(
    page.getByText("Synthetic repeat until the parent judges firm.", {
      exact: true,
    }),
  ).toBeVisible();
  await act({ page, name: "Practice again" });
  await at({ page, task: 2, suffix: "response-01" });
  expect(await geometry(page)).toEqual(anchors);
  await act({ page, name: "Ready" });
  for (let item = 2; item <= 6; item++) {
    await at({ page, task: 2, suffix: `response-0${item}` });
    expect(await geometry(page)).toEqual(anchors);
    await act({ page });
  }
  await expect(
    page.getByRole("group", { name: "Words to review" }),
  ).toBeVisible();
  expect(await geometry(page)).toEqual(anchors);
  await expect(
    page.getByRole("heading", { name: "Task complete", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Review", exact: true }),
  ).toBeDisabled();
  await act({ page, name: "No review" });
  await expect(
    page.getByRole("heading", { name: "Task complete", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Task complete", exact: true }),
  ).toBeVisible();
});

test("nonadjacent choices run in source order and Back reconfirms without skipping the earlier item", async ({
  page,
}) => {
  await start({ page });
  await toSelection(page);
  await page
    .getByRole("checkbox", { name: "Synthetic item 3", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "Synthetic item 1", exact: true })
    .check();
  await act({ page, name: "Review" });
  await at({ page, task: 2, suffix: "response-01" });
  await act({ page, name: "Ready" });
  await at({ page, task: 2, suffix: "response-03" });
  await act({ page, name: "Back" });
  await at({ page, task: 2, suffix: "response-01" });
  await act({ page });
  await at({ page, task: 2, suffix: "response-03" });
  await act({ page, name: "Next word" });
  await expect(
    page.getByRole("heading", { name: "Task complete", exact: true }),
  ).toBeVisible();
  await act({ page, name: "Back" });
  await at({ page, task: 2, suffix: "response-03" });
  await expect(page.locator("main")).toHaveAttribute(
    "data-run-status",
    "completed",
  );
  await expect(
    page.getByRole("button", { name: "Synthetic slow help", exact: true }),
  ).toHaveCount(0);
  await act({ page });
  await act({ page, name: "Replay task" });
  await at({ page, task: 2, suffix: "model" });
  await act({ page, name: "Activities" });
  await expect(page.locator('[data-task-number="2"]')).toContainText(
    "Completed",
  );
  await expect(page.locator('[data-available="false"]')).toHaveCount(0);
});

test("Task 5 keeps four responses and general correction repeats from the exercise start", async ({
  page,
}) => {
  await start({ page, task: 5 });
  const anchors = await geometry(page);
  await act({ page });
  await at({ page, task: 5, suffix: "response-02" });
  await act({ page });
  await at({ page, task: 5, suffix: "response-03" });
  await act({ page, name: "Synthetic quiet help" });
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /correction-quiet-3\.instruction$/,
  );
  await saved(page);
  expect(await geometry(page)).toEqual(anchors);
  await act({ page });
  await at({ page, task: 5, suffix: "response-01" });
  await act({ page });
  await at({ page, task: 5, suffix: "response-02" });
  await act({ page });
  await at({ page, task: 5, suffix: "response-03" });
  await act({ page });
  await at({ page, task: 5, suffix: "response-04" });
  expect(await geometry(page)).toEqual(anchors);
  await act({ page });
  await expect(
    page.getByRole("heading", { name: "Task complete", exact: true }),
  ).toBeVisible();
});

test("a failed review selection retains the immutable complete choice for identical Retry", async ({
  page,
}) => {
  await page.addInitScript(`
    const NativeWorker=window.Worker;let held=false;const attempts=[];
    window.readSelectionAttempts=()=>attempts.slice();
    window.Worker=class extends NativeWorker {
      postMessage(message,options){
        if((message?.kind === 'execute' && message.operation.kind === 'teaching')&&message.operation.command?.kind==='navigate'&&message.operation.command.payload.action.kind==='commitReviewSelection'){
          attempts.push(JSON.stringify(message.operation));
          if(!held){held=true;window.failHeldSelection=()=>this.dispatchEvent(new MessageEvent('message',{data:{id:message.id,kind:'failed',message:'Injected selection save failure'}}));return;}
        }
        super.postMessage(message,options);
      }
    };
  `);
  await start({ page });
  await toSelection(page);
  await page
    .getByRole("checkbox", { name: "Synthetic item 3", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "Synthetic item 1", exact: true })
    .check();
  const anchors = await geometry(page);
  await page.getByRole("button", { name: "Review", exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "true");
  await expect(
    page.getByRole("checkbox", { name: "Synthetic item 1", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Synthetic item 3", exact: true }),
  ).toBeDisabled();
  expect(await geometry(page)).toEqual(anchors);
  await page.evaluate(() => {
    if (
      "failHeldSelection" in window &&
      typeof window.failHeldSelection === "function"
    )
      window.failHeldSelection();
    else throw new Error("Selection fault hook missing");
  });
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Synthetic item 1", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await at({ page, task: 2, suffix: "response-01" });
  const attempts = await page.evaluate(() => {
    if (
      "readSelectionAttempts" in window &&
      typeof window.readSelectionAttempts === "function"
    )
      return window.readSelectionAttempts();
    throw new Error("Selection attempts missing");
  });
  expect(attempts).toHaveLength(2);
  expect(attempts[0]).toEqual(attempts[1]);
  await act({ page, name: "Ready" });
  await at({ page, task: 2, suffix: "response-03" });
});

test("the selected correction and its item confirmation survive complete browser process restarts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reading-oral-browser-"));
  let context = await chromium.launchPersistentContext(directory, {
    headless: true,
    viewport: { width: 900, height: 600 },
  });
  try {
    let page = await context.newPage();
    await start({ page });
    await toSelection(page);
    await page
      .getByRole("checkbox", { name: "Synthetic item 3", exact: true })
      .check();
    await act({ page, name: "Review" });
    await at({ page, task: 2, suffix: "response-03" });
    await act({ page, name: "Synthetic quiet help" });
    await saved(page);
    await act({ page, name: "Pause" });
    await expect(
      page.getByRole("heading", { name: "Reading is paused", exact: true }),
    ).toBeVisible();
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
    await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
      "data-turn-id",
      /correction-quiet-3\.instruction$/,
    );
    await act({ page });
    await at({ page, task: 2, suffix: "response-03" });
    await act({ page, name: "Next word" });
    await expect(
      page.getByRole("heading", { name: "Task complete", exact: true }),
    ).toBeVisible();
    await context.close();
    context = await chromium.launchPersistentContext(directory, {
      headless: true,
      viewport: { width: 900, height: 600 },
    });
    page = await context.newPage();
    await page.goto(`${base}/teaching`);
    await expect(
      page.getByRole("heading", { name: "Task complete", exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("oral Help retains its uncommitted answer-free preview through delayed and failed save", async ({
  page,
}) => {
  await page.addInitScript(`
    const NativeWorker=window.Worker;let held=false;const attempts=[];
    window.readOralHelpAttempts=()=>attempts.slice();
    window.Worker=class extends NativeWorker {
      postMessage(message,options){
        if((message?.kind === 'execute' && message.operation.kind === 'teaching')&&message.operation.command?.kind==='navigate'&&message.operation.command.payload.action.kind==='help'){
          attempts.push(JSON.stringify(message.operation));
          if(!held){held=true;window.failOralHelp=()=>this.dispatchEvent(new MessageEvent('message',{data:{id:message.id,kind:'failed',message:'Injected oral Help save failure'}}));return;}
        }
        super.postMessage(message,options);
      }
    };
  `);
  await start({ page });
  await act({ page });
  await at({ page, task: 2, suffix: "response-01" });
  const anchors = await geometry(page);
  await page
    .getByRole("button", { name: "Synthetic slow help", exact: true })
    .click();
  await expect(
    page.getByText("Correction preview · Not saved", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute(
    "data-context",
    "uncommitted",
  );
  await expect(page.locator("main")).toHaveAttribute(
    "data-committed-turn-id",
    `${taskId(2)}.response-01`,
  );
  await expect(
    page.getByRole("button", { name: "Ready", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".teaching-target")).toHaveText("");
  expect(await geometry(page)).toEqual(anchors);
  await page.evaluate(() => {
    if ("failOralHelp" in window && typeof window.failOralHelp === "function")
      window.failOralHelp();
    else throw new Error("Oral Help fault hook missing");
  });
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Correction preview · Not saved", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".teaching-target")).toHaveText("");
  expect(await geometry(page)).toEqual(anchors);
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await saved(page);
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /correction-slow-1\.instruction$/,
  );
  const attempts = await page.evaluate(() => {
    if (
      "readOralHelpAttempts" in window &&
      typeof window.readOralHelpAttempts === "function"
    )
      return window.readOralHelpAttempts();
    throw new Error("Oral Help attempts missing");
  });
  expect(attempts).toHaveLength(2);
  expect(attempts[0]).toEqual(attempts[1]);
  await act({ page });
  await at({ page, task: 2, suffix: "response-01" });
  await act({ page, name: "Ready" });
  await at({ page, task: 2, suffix: "response-02" });
});
