import { parseStoreResetRecord } from "@readatthree/teaching";
import { expect, test } from "@playwright/test";
import { browserBaseURL } from "./environment.ts";
import {
  probe,
  startWriting,
  writingAction,
  atWritableWriting,
  drawPractice,
  latestDocuments,
  finalizedWriting,
} from "./writing-helpers.ts";
import { savedFiles, damageStoreHeader } from "./saved-store-files.ts";

test.use({ actionTimeout: 15000 });

for (const scenario of [
  "confirmed",
  "intent-failure",
  "erase-ack",
  "receipt-ack",
] as const)
  test(`damaged store ${scenario} preserves original files until confirmed and retries Start fresh safely`, async ({
    page,
    context,
  }) => {
    test.setTimeout(120000);
    await installResetFault(page);
    await probe(page);
    await startWriting(page);
    await writingAction(page);
    await atWritableWriting(page, "m-model");
    await drawPractice(page);
    const document = (await latestDocuments(page))[0];
    if (!document) throw new Error("Saved drawing required");
    await finalizedWriting(page, document.token.documentId, 3);
    const harness = `${browserBaseURL}/corrupt-store-probe`;
    await page.route(harness, (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<title>Isolated corrupt-store probe</title>",
      }),
    );
    await page.goto(harness);
    const changed = await damageStoreHeader(page);
    expect(changed.offset).toBeGreaterThan(0);
    const before = await savedFiles(page);
    expect(before.length).toBeGreaterThan(0);
    await page.goto(`${browserBaseURL}/teaching`);
    await expect(
      page.getByRole("heading", {
        name: "Saved storage needs repair",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    const retry = page.getByRole("button", {
      name: "Retry opening",
      exact: true,
    });
    await retry.click();
    await expect(retry).toBeEnabled();
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.goto(harness);
    expect(await savedFiles(page)).toEqual(before);
    await page.goto(`${browserBaseURL}/teaching`);
    await page
      .getByRole("button", { name: "Start fresh", exact: true })
      .click();
    let dialog = page.getByRole("dialog", { name: "Start fresh", exact: true });
    const eraseName = "Erase saved work and start fresh";
    await expect(
      dialog.getByRole("button", { name: eraseName, exact: true }),
    ).toHaveCount(0);
    await dialog.getByLabel("Type the word").fill("meadow");
    await dialog
      .getByRole("button", { name: "Continue to parent settings", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: eraseName, exact: true }),
    ).toBeDisabled();
    await dialog
      .getByRole("button", { name: "Keep saved work", exact: true })
      .click();
    await page.goto(harness);
    const afterCancel = await savedFiles(page);
    for (const file of before)
      expect(
        afterCancel.find((candidate) => candidate.path === file.path),
      ).toEqual(file);
    await page.goto(`${browserBaseURL}/teaching`);
    await page
      .getByRole("button", { name: "Start fresh", exact: true })
      .click();
    dialog = page.getByRole("dialog", { name: "Start fresh", exact: true });
    await dialog.getByLabel("Type the word").fill("meadow");
    await dialog
      .getByRole("button", { name: "Continue to parent settings", exact: true })
      .click();
    await dialog
      .getByRole("checkbox", {
        name: "Erase all children’s reading progress and drawings on this device.",
      })
      .check();
    await expect(
      dialog.getByRole("button", { name: eraseName, exact: true }),
    ).toBeEnabled();
    const beforeIntent = await savedFiles(page);
    if (scenario !== "confirmed")
      await page.evaluate((fault) => {
        if (
          !("armResetFault" in window) ||
          typeof window.armResetFault !== "function"
        )
          throw new Error("Reset fault control missing");
        window.armResetFault(fault);
      }, scenario);
    await dialog.getByRole("button", { name: eraseName, exact: true }).click();
    if (scenario !== "confirmed") {
      await expect(
        dialog.getByText(/Start fresh could not be confirmed/),
      ).toBeVisible();
      const written = (
        (await page.evaluate("window.resetAttempts()")) as unknown[]
      ).map(parseStoreResetRecord);
      const intent = written.find((value) => value.phase === "resetting");
      if (intent?.phase !== "resetting")
        throw new Error("Durable reset intent missing");
      const other = await context.newPage();
      if (scenario === "intent-failure") {
        expect(await savedFiles(page)).toEqual(beforeIntent);
        await other.close();
        await dialog
          .getByRole("button", { name: "Retry same Start fresh", exact: true })
          .click();
      } else if (scenario === "erase-ack") {
        const blockedFiles = await savedFiles(page);
        await other.goto(browserBaseURL);
        await expect(
          other.getByRole("heading", {
            name: "Start fresh needs to finish",
            exact: true,
          }),
        ).toBeVisible();
        await expect(other.locator("canvas")).toHaveCount(0);
        expect(await savedFiles(other)).toEqual(blockedFiles);
        await other.close();
        await page.reload();
        await page
          .getByRole("button", { name: "Start fresh", exact: true })
          .click();
        dialog = page.getByRole("dialog", { name: "Start fresh", exact: true });
        await dialog.getByLabel("Type the word").fill("meadow");
        await dialog
          .getByRole("button", {
            name: "Continue to parent settings",
            exact: true,
          })
          .click();
        await dialog.getByRole("checkbox").check();
        await dialog
          .getByRole("button", { name: eraseName, exact: true })
          .click();
      } else {
        await probe(other);
        await startWriting(other);
        await writingAction(other);
        await atWritableWriting(other, "m-model");
        await drawPractice(other);
        const newDocument = (await latestDocuments(other))[0];
        if (!newDocument) throw new Error("New saved drawing missing");
        await finalizedWriting(other, newDocument.token.documentId, 3);
        await other.route(harness, (route) =>
          route.fulfill({
            contentType: "text/html",
            body: "<title>Stored files</title>",
          }),
        );
        await other.goto(harness);
        const newFiles = await savedFiles(other);
        await other.close();
        await dialog
          .getByRole("button", { name: "Retry same Start fresh", exact: true })
          .click();
        await expect(
          dialog.getByRole("button", {
            name: "Open new reading store",
            exact: true,
          }),
        ).toBeVisible();
        expect(await savedFiles(page)).toEqual(newFiles);
      }
      await expect(
        dialog.getByRole("button", {
          name: "Open new reading store",
          exact: true,
        }),
      ).toBeVisible();
      const completed = (
        (await page.evaluate("window.resetEvidence()")) as unknown[]
      )
        .map(parseStoreResetRecord)
        .findLast(
          (value) => value.phase === "ready" && value.lastCommand !== null,
        );
      if (completed?.phase !== "ready")
        throw new Error("Completed reset receipt missing");
      expect(completed.lastCommand).toEqual(intent.command);
    }
    await dialog
      .getByRole("button", { name: "Open new reading store", exact: true })
      .click();
    if (scenario === "receipt-ack") {
      await page
        .getByRole("button", {
          name: "Resume · Lesson 1 · Task 6",
          exact: true,
        })
        .click();
      await expect(page.locator("canvas")).toHaveAttribute(
        "data-writable",
        "true",
      );
      expect((await latestDocuments(page))[0]?.strokes).toHaveLength(3);
    } else {
      await expect(
        page.getByRole("heading", {
          name: "A moment for the grown-up",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.locator("canvas")).toHaveCount(0);
    }
  });

async function installResetFault(page: import("@playwright/test").Page) {
  await page.addInitScript(`
    let fault = '';
    const records = [];
    const attempts = [];
    const values = new WeakMap();
    Object.defineProperty(window, 'armResetFault', {value: value => {fault = value;}});
    Object.defineProperty(window, 'resetAttempts', {value: () => structuredClone(attempts)});
    Object.defineProperty(window, 'resetEvidence', {value: () => structuredClone(records)});
    const write = FileSystemWritableFileStream.prototype.write;
    FileSystemWritableFileStream.prototype.write = async function(value) {
      await write.call(this, value);
      if (typeof value === 'string') {
        try { const record = JSON.parse(value); if (record.version === 1 && ['ready', 'resetting'].includes(record.phase)) { values.set(this, record); attempts.push(record); } } catch {}
      }
    };
    const close = FileSystemWritableFileStream.prototype.close;
    FileSystemWritableFileStream.prototype.close = async function() {
      const record = values.get(this);
      if (fault === 'intent-failure' && record?.phase === 'resetting') {
        fault = ''; await this.abort(); throw new Error('Injected failure before actual reset intent close');
      }
      await close.call(this);
      if (record) records.push(record);
      if (fault === 'receipt-ack' && record?.phase === 'ready' && record.lastCommand) {
        fault = ''; throw new Error('Injected acknowledgement loss after actual reset receipt close');
      }
    };
    const remove = FileSystemDirectoryHandle.prototype.removeEntry;
    FileSystemDirectoryHandle.prototype.removeEntry = async function(name, options) {
      await remove.call(this, name, options);
      if (fault === 'erase-ack' && name === '.read-at-three.sqlite') {
        fault = ''; throw new Error('Injected acknowledgement loss after actual personal-store erasure');
      }
    };
  `);
}
