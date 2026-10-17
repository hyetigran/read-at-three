import { test, expect, chromium } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "@playwright/test";
const base =
  process.env.READING_BROWSER_BUILD === "1"
    ? "http://127.0.0.1:5175"
    : "http://127.0.0.1:5174";
const first = "fixture.graph.l01.t01.s01.model-m";
async function turn(page: Page, suffix: string) {
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    `fixture.graph.l01.t01.${suffix}`,
  );
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeEnabled();
}
async function start(page: Page, task = 1) {
  await page.goto(base);
  await page
    .getByRole("button", { name: `Start Task ${task}`, exact: true })
    .click();
}
async function anchors(page: Page) {
  return page
    .locator(
      ".teaching-parent-panel,.teaching-target,.teaching-cue,.teaching-action-continue",
    )
    .evaluateAll((elements) =>
      elements.map((element) => {
        const r = element.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height];
      }),
    );
}
test("complete six source obligations with stable anchors, completed Back and explicit Replay", async ({
  page,
}) => {
  await start(page);
  await turn(page, "s01.model-m");
  const geometry = await anchors(page);
  for (const next of [
    "s02.response-m",
    "s03.again-m",
    "s04.model-s",
    "s05.response-s",
    "s06.again-s",
  ]) {
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await turn(page, next);
    expect(await anchors(page)).toEqual(geometry);
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Task complete", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Task complete", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await turn(page, "s06.again-s");
  await expect(page.locator("main[data-run-status]")).toHaveAttribute(
    "data-run-status",
    "completed",
  );
  await expect(
    page.getByRole("button", { name: "Help", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Replay task", exact: true }).click();
  await turn(page, "s01.model-m");
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator('[data-task-number="1"]')).toContainText(
    "Completed",
  );
  await expect(page.locator('[data-available="false"]')).toHaveCount(0);
  await page.keyboard.press("Escape");
  await turn(page, "s01.model-m");
});
test("Repeat and Again correction preserve owed responses through Pause/reload/Resume", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await turn(page, "s02.response-m");
  await page.getByRole("button", { name: "Repeat", exact: true }).click();
  await expect(
    page.getByText("Extra practice · Child responds", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await turn(page, "s02.response-m");
  await expect(
    page.getByText("Extra practice · Child responds", {
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await turn(page, "s03.again-m");
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /correction-m$/,
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Reading is paused", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Reading is paused", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /correction-m$/,
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await turn(page, "s02.response-m");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await turn(page, "s03.again-m");
});
test("Task4 s error retests m then s, and task switching resumes the selected run", async ({
  page,
}) => {
  await start(page, 4);
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /t04.s01.response-m$/,
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /t04.correction-s$/,
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /t04.s01.response-m$/,
  );
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  await page.getByRole("button", { name: "Start Task 1", exact: true }).click();
  await turn(page, "s01.model-m");
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  await page
    .getByRole("button", { name: "Resume Task 4", exact: true })
    .click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /t04.s01.response-m$/,
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /t04.s02.response-s$/,
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Task complete", exact: true }),
  ).toBeVisible();
});
test("held cue and pointer double-click cannot consume a second required turn", async ({
  page,
}) => {
  await start(page);
  await turn(page, "s01.model-m");
  const cue = page.getByRole("button", {
    name: "Hold silent pointing cue",
    exact: true,
  });
  await cue.focus();
  await page.keyboard.down("Space");
  await expect(cue).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Continue", exact: true }).dblclick();
  await page.keyboard.up("Space");
  await turn(page, "s02.response-m");
  await expect(
    page.getByRole("button", { name: "Hold silent pointing cue", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  const button = page.getByRole("button", { name: "Continue", exact: true });
  await button.focus();
  await page.keyboard.down("Enter");
  await turn(page, "s03.again-m");
  await expect(button).toBeFocused();
  await page.keyboard.down("Enter");
  await page.keyboard.down("Enter");
  await page.keyboard.up("Enter");
  await turn(page, "s03.again-m");
});
test("full browser process restart restores a graph correction route in actual OPFS", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reading-graph-restart-"));
  let context = await chromium.launchPersistentContext(directory, {
    headless: true,
    viewport: { width: 1024, height: 768 },
  });
  try {
    const page = await context.newPage();
    await start(page);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Help", exact: true }).click();
    await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
      "data-turn-id",
      /correction-m$/,
    );
    await expect(page.locator("main[data-context]")).toHaveAttribute(
      "data-context",
      "committed",
    );
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toBeEnabled();
    const checkpoint = await page
      .locator("main[data-turn-id]")
      .getAttribute("data-checkpoint-id");
    await context.close();
    context = await chromium.launchPersistentContext(directory, {
      headless: true,
      viewport: { width: 1024, height: 768 },
    });
    const next = await context.newPage();
    await next.goto(base);
    await expect(next.locator("main[data-turn-id]")).toHaveAttribute(
      "data-turn-id",
      /correction-m$/,
    );
    await expect(next.locator("main[data-checkpoint-id]")).toHaveAttribute(
      "data-checkpoint-id",
      checkpoint ?? "",
    );
    await next.getByRole("button", { name: "Continue", exact: true }).click();
    await turn(next, "s02.response-m");
  } finally {
    await context.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("Help shows an uncommitted source preview through delayed and failed save, then retries the same command", async ({
  page,
}) => {
  await page.addInitScript(`
  const NativeWorker=window.Worker;let held=false;const attempts=[];
  window.readHelpAttempts=()=>attempts.slice();
  window.Worker=class extends NativeWorker {
   postMessage(message,options){
    if(message?.kind==='dispatch'&&message.command?.kind==='navigate'&&message.command.payload.action.kind==='help'){
     attempts.push(JSON.stringify(message.command));
     if(!held){held=true;window.failHeldHelp=()=>this.dispatchEvent(new MessageEvent('message',{data:{id:message.id,kind:'failed',message:'Injected Help save failure'}}));return;}
    }
    super.postMessage(message,options);
   }
  };
 `);
  await start(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await turn(page, "s02.response-m");
  const geometry = await anchors(page);
  const cue = page.getByRole("button", {
    name: "Hold silent pointing cue",
    exact: true,
  });
  await cue.focus();
  await page.keyboard.down("Space");
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await page.keyboard.up("Space");
  await expect(
    page.getByText("Correction preview · Not saved", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Synthetic m correction model.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("main[data-context]")).toHaveAttribute(
    "data-context",
    "uncommitted",
  );
  await expect(page.locator("main[data-committed-turn-id]")).toHaveAttribute(
    "data-committed-turn-id",
    /s02.response-m$/,
  );
  expect(await anchors(page)).toEqual(geometry);
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Hold silent pointing cue", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.evaluate(() => {
    if ("failHeldHelp" in window && typeof window.failHeldHelp === "function")
      window.failHeldHelp();
    else throw new Error("Help fault hook missing");
  });
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Correction preview · Not saved", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Synthetic m correction model.", { exact: true }),
  ).toBeVisible();
  expect(await anchors(page)).toEqual(geometry);
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.locator("main[data-context]")).toHaveAttribute(
    "data-context",
    "committed",
  );
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /correction-m$/,
  );
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeEnabled();
  const attempts = await page.evaluate(() => {
    if (
      "readHelpAttempts" in window &&
      typeof window.readHelpAttempts === "function"
    )
      return window.readHelpAttempts();
    throw new Error("Help attempts unavailable");
  });
  expect(attempts).toHaveLength(2);
  expect(attempts[0]).toEqual(attempts[1]);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await turn(page, "s02.response-m");
});
