import { expect, test } from "@playwright/test";
import {
  probe,
  startWriting,
  writingAction,
  atWritableWriting,
  drawPractice,
  drawStroke,
  latestDocuments,
  finalizedWriting,
  requests,
} from "./writing-helpers.ts";
import {
  damageStoreHeader,
  restoreStoreHeader,
  savedFiles,
} from "./saved-store-files.ts";

test.use({ actionTimeout: 15000 });

test("live damage keeps parent recovery reachable and retains the exact pending ink through Retry and cancellation", async ({
  page,
}) => {
  test.setTimeout(90000);
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await atWritableWriting(page, "m-model");
  await drawPractice(page);
  const document = (await latestDocuments(page))[0];
  if (!document) throw new Error("Saved drawing missing");
  await finalizedWriting(page, document.token.documentId, 3);
  await page.reload();
  await writingAction(page, "Resume");
  await atWritableWriting(page, "m-model");
  const saved = (await latestDocuments(page))[0];
  expect(saved?.strokes).toHaveLength(3);
  // Inject the closed damage response before finalize; the later Retry uses physically damaged SQLite bytes.
  await page.evaluate("window.armWritingFault('ink-damage')");
  await drawStroke(page, [
    { x: 300, y: 100 },
    { x: 350, y: 120 },
  ]);
  const retry = page.getByRole("button", { name: "Retry save", exact: true });
  await expect(retry).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start fresh", exact: true }),
  ).toBeVisible();
  const original = (await requests(page)).findLast(
    (item) =>
      item.kind === "execute" &&
      item.operation.kind === "ink" &&
      item.operation.command.edit.kind === "finalize",
  );
  if (original?.kind !== "execute" || original.operation.kind !== "ink")
    throw new Error("Pending finalize missing");
  const target = await damageStoreHeader(page);
  const before = await savedFiles(page);
  await retry.click();
  await expect(retry).toBeEnabled();
  await expect(
    page.getByText(/Saved storage could not be read safely/).first(),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-writable",
    "false",
  );
  expect(await savedFiles(page)).toEqual(before);
  await page.getByRole("button", { name: "Start fresh", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Start fresh", exact: true });
  await dialog.getByLabel("Type the word").fill("meadow");
  await dialog
    .getByRole("button", { name: "Continue to parent settings", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Keep saved work", exact: true })
    .click();
  const after = await savedFiles(page);
  for (const file of before)
    expect(after.find((item) => item.path === file.path)).toEqual(file);
  await restoreStoreHeader(page, target);
  await retry.click();
  await expect(page.locator("canvas")).toHaveAttribute("data-writable", "true");
  const recovered = (await requests(page)).findLast(
    (item) =>
      item.kind === "recoverInk" &&
      item.operation.command.commandId === original.operation.command.commandId,
  );
  if (recovered?.kind !== "recoverInk")
    throw new Error("Exact pending ink not retried");
  expect(recovered.operation).toEqual(original.operation);
  expect((await latestDocuments(page))[0]?.strokes).toHaveLength(4);
  expect((await latestDocuments(page))[0]?.strokes.slice(0, 3)).toEqual(
    saved?.strokes,
  );
  await expect(
    page.getByRole("button", { name: "Start fresh", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await writingAction(page, "Resume");
  await atWritableWriting(page, "m-model");
  expect((await latestDocuments(page))[0]?.strokes).toHaveLength(4);
});
