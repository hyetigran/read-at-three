import {
  installInitialSetupObservation,
  completeInitialSetup,
} from "./parent-setup.ts";
import { test, expect, chromium } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { useLegacyContent } from "./legacy-content.ts";
test.beforeEach(async ({ context }) => {
  await useLegacyContent(context);
});

const base =
  process.env.READING_BROWSER_BUILD === "1"
    ? "http://127.0.0.1:5175"
    : "http://127.0.0.1:5174";
async function start(page: Page) {
  await useLegacyContent(page);
  await installInitialSetupObservation(page);
  await page.goto(base);
  await completeInitialSetup({ page });
  await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByText("Fixture model.", { exact: true })).toBeVisible();
}
async function anchors(page: Page) {
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

test("parent acceptance, cue cancellation, stable anchors and partial resume use real OPFS", async ({
  page,
}) => {
  await start(page);
  const before = await anchors(page);
  const cue = page.getByRole("button", { name: "Hold silent pointing cue" });
  await cue.focus();
  await page.keyboard.down("Space");
  await expect(cue).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.up("Space");
  await expect(cue).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("Fixture model.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("Fixture child response.", { exact: true }),
  ).toBeVisible();
  expect(await anchors(page)).toEqual(before);
  await page.reload();
  await expect(
    page.getByText("Fixture child response.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("This earlier activity is still in progress.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByText("This earlier activity is still in progress.", {
      exact: false,
    }),
  ).toBeVisible();
});

test("a full browser process restart restores the exact child-response turn", async () => {
  const directory = await mkdtemp(join(tmpdir(), "reading-opfs-restart-"));
  let context = await chromium.launchPersistentContext(directory, {
    headless: true,
    viewport: { width: 1024, height: 768 },
  });
  try {
    const page = await context.newPage();
    await start(page);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(
      page.getByText("Fixture child response.", { exact: true }),
    ).toBeVisible();
    await context.close();
    context = await chromium.launchPersistentContext(directory, {
      headless: true,
      viewport: { width: 1024, height: 768 },
    });
    const restored = await context.newPage();
    await useLegacyContent(restored);
    await restored.goto(`${base}/teaching`);
    await expect(
      restored.getByText("Fixture child response.", { exact: true }),
    ).toBeVisible();
    await expect(
      restored.getByRole("button", { name: "Start", exact: true }),
    ).toHaveCount(0);
  } finally {
    await context.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("unsupported durable storage has recovery and never a memory lesson", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator.storage, "getDirectory", {
      value: undefined,
    }),
  );
  await page.goto(base);
  await expect(
    page.getByRole("heading", { name: "Saved storage is unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toHaveCount(0);
  expect(page.workers()).toHaveLength(0);
});

test("a competing tab cannot open a second database and can resume after ownership release", async ({
  page,
  context,
}) => {
  await start(page);
  const competing = await context.newPage();
  await competing.goto(base);
  await expect(
    competing.getByRole("heading", { name: "Saved storage is unavailable" }),
  ).toBeVisible();
  await expect(
    competing.getByRole("button", { name: "Start", exact: true }),
  ).toHaveCount(0);
  await page.close();
  await competing
    .getByRole("button", { name: "Retry opening", exact: true })
    .click();
  await competing
    .getByRole("button", {
      name: "Resume saved activity · Lesson 1",
      exact: true,
    })
    .click();
  await expect(
    competing.getByText("Fixture model.", { exact: true }),
  ).toBeVisible();
});

test("unsupported windows pause the UI and restore the same turn without advancement", async ({
  page,
}) => {
  await start(page);
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(
    page.getByRole("heading", { name: "Make room for reading" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByText("Fixture model.", { exact: true })).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth > innerWidth ||
      document.documentElement.scrollHeight > innerHeight,
  );
  expect(overflow).toBe(false);
});

const faultWorkerSource = `
let locked;
self.onmessage=async ({data})=>{
  try{
    const root=await navigator.storage.getDirectory();
    const pool=await root.getDirectoryHandle('.read-at-three.sqlite');
    const opaque=await pool.getDirectoryHandle('.opaque');
    if(data==='snapshot'){
      const hashes=[];
      for await(const [name,handle] of opaque.entries()){
        if(handle.kind!=='file')continue;
        const bytes=await (await handle.getFile()).arrayBuffer();
        const digest=await crypto.subtle.digest('SHA-256',bytes);
        hashes.push([name,Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')]);
      }
      hashes.sort((a,b)=>a[0].localeCompare(b[0]));
      self.postMessage(hashes);
    }else if(data==='lock'){
      for await(const [,handle] of opaque.entries()){
        if(handle.kind==='file'){locked=await handle.createSyncAccessHandle();break;}
      }
      if(!locked)throw Error('No pool file to lock');
      self.postMessage('locked');
    }else if(data==='release'){
      locked.close();locked=undefined;self.postMessage('released');
    }
  }catch(error){self.postMessage({failure:String(error)});}
};`;

test("real OPFS initialization failure preserves every saved pool byte and permits reopening", async ({
  page,
  context,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("Fixture child response.", { exact: true }),
  ).toBeVisible();
  await page.close();
  const harness = await context.newPage();
  await harness.route("**/storage-harness", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<title>Owned storage fault harness</title>",
    }),
  );
  await harness.goto(`${base}/storage-harness`);
  const locker = await harness.evaluateHandle(
    (source) =>
      new Worker(
        URL.createObjectURL(new Blob([source], { type: "text/javascript" })),
      ),
    faultWorkerSource,
  );
  const operation = (kind: string) =>
    locker.evaluate(
      (worker, value) =>
        new Promise<unknown>((resolve) => {
          worker.onmessage = (event: MessageEvent<unknown>) =>
            resolve(event.data);
          worker.postMessage(value);
        }),
      kind,
    );
  const before = await operation("snapshot");
  expect(Array.isArray(before) && before.length >= 6).toBe(true);
  expect(await operation("lock")).toBe("locked");
  const failed = await context.newPage();
  await failed.goto(base);
  await expect(
    failed.getByRole("heading", { name: "Saved storage is unavailable" }),
  ).toBeVisible();
  expect(await operation("release")).toBe("released");
  expect(await operation("snapshot")).toEqual(before);
  await failed
    .getByRole("button", { name: "Retry opening", exact: true })
    .click();
  await failed
    .getByRole("button", {
      name: "Resume saved activity · Lesson 1",
      exact: true,
    })
    .click();
  await expect(
    failed.getByText("Fixture child response.", { exact: true }),
  ).toBeVisible();
  await locker.evaluate((worker) => worker.terminate());
});

test("lost reply after real COMMIT keeps the old screen and retries the identical acceptance once", async ({
  page,
}) => {
  await page.addInitScript(`
    const NativeWorker = window.Worker;
    let dropped = false;
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        super(url, options);
        this.addEventListener('message', event => {
          const data = event.data;
          if (!dropped && data?.id === this.advanceRequestId && data?.kind === 'execution' && data.value.kind === 'teaching' && data.value.result.kind === 'committed') {
            dropped = true;
            event.stopImmediatePropagation();
            queueMicrotask(() => this.dispatchEvent(new ErrorEvent('error', { message: 'Injected reply loss after real commit' })));
          }
        });
      }
      postMessage(message, options) {
        if (message?.kind === 'execute' && message.operation.kind === 'teaching' && message.operation.command.kind === 'advance') this.advanceRequestId = message.id;
        super.postMessage(message, options);
      }
    };
  `);
  await start(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("This save could not be confirmed.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("Fixture model.", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(
    page.getByText("Fixture child response.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("This earlier activity is still in progress.", {
      exact: false,
    }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByText("Fixture child response.", { exact: true }),
  ).toBeVisible();
});

test("minimum teaching window keeps source guidance and controls reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await start(page);
  const before = await anchors(page);
  for (const selector of [
    ".teaching-parent-panel",
    ".teaching-target",
    ".teaching-cue",
    ".teaching-continue",
  ]) {
    await expect(page.locator(selector)).toBeInViewport();
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("Fixture child response.", { exact: true }),
  ).toBeVisible();
  expect(await anchors(page)).toEqual(before);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth > innerWidth ||
        document.documentElement.scrollHeight > innerHeight,
    ),
  ).toBe(false);
});

test("recovery after committed acceptance replaces stale teaching and reopens the saved turn", async ({
  page,
}) => {
  await page.addInitScript(`
    const NativeWorker = window.Worker;
    let committedAdvance = false;
    let injected = false;
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        super(url, options);
        this.addEventListener('message', event => {
          const data = event.data;
          if (data?.id === this.advanceId && data?.kind === 'execution' && data.value.kind === 'teaching' && data.value.result.kind === 'committed') committedAdvance = true;
          if (!injected && committedAdvance && data?.kind === 'application') {
            injected = true;
            event.stopImmediatePropagation();
            this.dispatchEvent(new MessageEvent('message', { data: { ...data, value: { ...data.value, application: { kind: 'recovery', code: 'storage-recovery', message: 'Fixture recovery after saved acceptance.' } } } }));
          }
        });
      }
      postMessage(message, options) {
        if (message?.kind === 'execute' && message.operation.kind === 'teaching' && message.operation.command.kind === 'advance') this.advanceId = message.id;
        super.postMessage(message, options);
      }
    };
  `);
  await start(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Saved storage is unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Retry opening", exact: true })
    .click();
  await expect(
    page.getByText("Fixture child response.", { exact: true }),
  ).toBeVisible();
});
