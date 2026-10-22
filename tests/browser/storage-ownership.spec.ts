import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { browserBaseURL } from "./environment.ts";
import { reloadSavedTurn } from "./reload-saved-turn.ts";
import {
  atWriting,
  drawPractice,
  finalizedWriting,
  latestDocuments,
  probe,
  startWriting,
  writingAction,
} from "./writing-helpers.ts";

const lease = "read-at-three.sqlite.v1";

async function ownership(page: Page) {
  return page.evaluate(async (name) => {
    const state = await navigator.locks.query();
    return {
      held: state.held?.filter((lock) => lock.name === name).length ?? 0,
      pending: state.pending?.filter((lock) => lock.name === name).length ?? 0,
    };
  }, lease);
}

async function holder(page: Page) {
  await page.route("**/ownership-harness", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<title>Ownership harness</title>",
    }),
  );
  await page.goto(`${browserBaseURL}/ownership-harness`);
  const worker = await page.evaluateHandle((name) => {
    const source = `let release; navigator.locks.request(${JSON.stringify(name)}, async () => { self.postMessage('held'); await new Promise(resolve => { release = resolve; }); }); self.onmessage = () => release();`;
    return new Worker(
      URL.createObjectURL(new Blob([source], { type: "text/javascript" })),
    );
  }, lease);
  await expect.poll(() => ownership(page)).toEqual({ held: 1, pending: 0 });
  return worker;
}

async function savedFiles(page: Page) {
  return page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const values: { path: string; size: number; sha256: string }[] = [];
    async function visit(directory: FileSystemDirectoryHandle, prefix: string) {
      for await (const [name, handle] of directory.entries()) {
        if (handle.kind === "directory")
          await visit(handle, `${prefix}${name}/`);
        else {
          const file = await handle.getFile();
          const bytes = await file.arrayBuffer();
          values.push({
            path: `${prefix}${name}`,
            size: file.size,
            sha256: [
              ...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
            ]
              .map((value) => value.toString(16).padStart(2, "0"))
              .join(""),
          });
        }
      }
    }
    await visit(root, "");
    return values.sort((a, b) => a.path.localeCompare(b.path));
  });
}

async function seed(page: Page) {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await atWriting(page, "m-model");
  await drawPractice(page);
  const document = (await latestDocuments(page))[0];
  if (!document) throw new Error("The saved writing document is missing.");
  await finalizedWriting(page, document.token.documentId, 3);
  await reloadSavedTurn({ page, turnId: "fixture.graph.l01.t06.m-model" });
  await atWriting(page, "m-model");
  const documents = await latestDocuments(page);
  expect(documents[0]?.strokes).toHaveLength(3);
  await page.close();
  return documents.map(({ strokes, token }) => ({
    documentId: token.documentId,
    strokes,
  }));
}

async function restored(page: Page) {
  const paused = page.getByRole("heading", {
    name: "Reading is paused",
    exact: true,
  });
  await expect(
    page
      .locator('main[data-turn-id="fixture.graph.l01.t06.m-model"]')
      .or(paused),
  ).toBeVisible();
  if (await paused.isVisible())
    await page.getByRole("button", { name: "Resume", exact: true }).click();
  await atWriting(page, "m-model");
  return (await latestDocuments(page)).map(({ strokes, token }) => ({
    documentId: token.documentId,
    strokes,
  }));
}

test("queued ownership restores committed writing after the previous owner releases", async ({
  context,
}) => {
  const expected = await seed(await context.newPage());
  const harness = await context.newPage();
  const lock = await holder(harness);
  const before = await savedFiles(harness);
  const reading = await context.newPage();
  await probe(reading);
  await reading.goto(`${browserBaseURL}/teaching`);
  await expect.poll(() => ownership(harness)).toEqual({ held: 1, pending: 1 });
  expect(await savedFiles(harness)).toEqual(before);
  await lock.evaluate((worker) => worker.postMessage("release"));
  expect(await restored(reading)).toEqual(expected);
  await expect.poll(() => ownership(harness)).toEqual({ held: 1, pending: 0 });
  await lock.evaluate((worker) => worker.terminate());
});

test("an owner retained through the ownership deadline refuses without changing saved files", async ({
  context,
}) => {
  const expected = await seed(await context.newPage());
  const harness = await context.newPage();
  const lock = await holder(harness);
  const before = await savedFiles(harness);
  const reading = await context.newPage();
  await probe(reading);
  const started = Date.now();
  await reading.goto(`${browserBaseURL}/teaching`);
  await expect.poll(() => ownership(harness)).toEqual({ held: 1, pending: 1 });
  await expect(
    reading.getByRole("heading", { name: "Storage is open in another window" }),
  ).toBeVisible();
  expect(Date.now() - started).toBeLessThan(15000);
  await expect(
    reading.getByText(
      "Close the other reading window, then retry opening here. Your saved reading and writing are kept.",
    ),
  ).toBeVisible();
  await expect.poll(() => ownership(harness)).toEqual({ held: 1, pending: 0 });
  expect(await savedFiles(harness)).toEqual(before);
  await lock.evaluate((worker) => worker.postMessage("release"));
  await expect.poll(() => ownership(harness)).toEqual({ held: 0, pending: 0 });
  expect(await savedFiles(harness)).toEqual(before);
  await lock.evaluate((worker) => worker.terminate());
  await reading.getByRole("button", { name: "Retry opening" }).click();
  expect(await restored(reading)).toEqual(expected);
});

test("retiring a pending reading page cancels its lease and a genuine second tab stays excluded", async ({
  context,
}) => {
  const expected = await seed(await context.newPage());
  const harness = await context.newPage();
  const lock = await holder(harness);
  const before = await savedFiles(harness);
  const retired = await context.newPage();
  await retired.goto(`${browserBaseURL}/teaching`);
  await expect.poll(() => ownership(harness)).toEqual({ held: 1, pending: 1 });
  await retired.close();
  await expect.poll(() => ownership(harness)).toEqual({ held: 1, pending: 0 });
  await lock.evaluate((worker) => worker.postMessage("release"));
  await expect.poll(() => ownership(harness)).toEqual({ held: 0, pending: 0 });
  expect(await savedFiles(harness)).toEqual(before);
  const reading = await context.newPage();
  await probe(reading);
  await reading.goto(`${browserBaseURL}/teaching`);
  expect(await restored(reading)).toEqual(expected);
  const second = await context.newPage();
  await second.goto(`${browserBaseURL}/teaching`);
  await expect(
    second.getByRole("heading", { name: "Storage is open in another window" }),
  ).toBeVisible();
  expect(await ownership(harness)).toEqual({ held: 1, pending: 0 });
  await atWriting(reading, "m-model");
  await lock.evaluate((worker) => worker.terminate());
});
