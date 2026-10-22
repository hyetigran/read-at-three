import { reloadSavedTurn } from "./reload-saved-turn.ts";
import { expect, test } from "@playwright/test";
import { installTransactionDriver } from "./transaction-driver.ts";
import {
  probe,
  startWriting,
  writingAction,
  atWriting,
  drawPractice,
  drawStroke,
  finalizedWriting,
  requests,
  latestDocuments,
} from "./writing-helpers.ts";
import { browserBaseURL } from "./environment.ts";
import { useLegacyContent } from "./legacy-content.ts";
import {
  completeInitialSetup,
  installInitialSetupObservation,
} from "./parent-setup.ts";

for (const cut of [
  "rollback-before",
  "commit-before",
  "commit-after",
] as const) {
  test(`actual OPFS ${cut} retains buffered writing and reconciles the same command`, async ({
    context,
    page,
  }, testInfo) => {
    await installTransactionDriver(context, page);
    await probe(page);
    await startWriting(page);
    await writingAction(page);
    await atWriting(page, "m-model");
    await drawPractice(page);
    const initialDocument = (await latestDocuments(page))[0];
    if (!initialDocument) throw new Error("Actual model document missing");
    await finalizedWriting(page, initialDocument.token.documentId, 3);
    const before: {
      tables: { name: string; columns: string[]; rows: unknown[][] }[];
    } = await page.evaluate("window.transactionDriverControl('snapshot')");
    await page.evaluate(
      "window.transactionDriverControl('arm'," +
        JSON.stringify({ cut, operation: "ink", edit: "finalize" }) +
        ")",
    );
    await drawStroke(page, [
      { x: 320, y: 120 },
      { x: 360, y: 140 },
    ]);
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toBeDisabled();
    await atWriting(page, "m-model");
    const beforeRetry = await requests(page);
    const retained = beforeRetry
      .filter(
        (r) =>
          r.kind === "execute" &&
          r.operation.kind === "ink" &&
          r.operation.command.edit.kind === "finalize",
      )
      .at(-1);
    if (retained?.kind !== "execute" || retained.operation.kind !== "ink")
      throw new Error("Retained actual finalize command missing");
    const count = beforeRetry.length;
    await drawPractice(page);
    expect((await requests(page)).length).toBe(count);
    const fault = await page.evaluate("window.transactionDriverEvidence()");
    const events: { boundary: string; autocommit: number }[] =
      await page.evaluate(
        "window.transactionDriverEvidence().evidence.filter(item=>item.events).at(-1).events",
      );
    expect(
      events.find((event) => event.boundary === "COMMIT")?.autocommit,
    ).toBe(0);
    if (cut === "rollback-before")
      expect(events.at(-1)).toEqual({
        boundary: "ROLLBACK-refused",
        autocommit: 0,
      });
    if (cut === "commit-after")
      expect(events.at(-1)).toEqual({
        boundary: "COMMIT-effect",
        autocommit: 1,
      });
    await testInfo.attach("actual-driver-fault", {
      body: JSON.stringify(fault),
      contentType: "application/json",
    });
    await writingAction(page, "Retry save");
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toHaveCount(0);
    await atWriting(page, "m-model");
    const recovered = await requests(page);
    const retry = recovered.find(
      (r) =>
        r.kind === "recoverInk" &&
        r.operation.command.commandId === retained.operation.command.commandId,
    );
    if (cut === "rollback-before") {
      expect(retry?.kind).toBe("recoverInk");
      if (retry?.kind !== "recoverInk")
        throw new Error("Exact ink reconciliation missing");
      expect(retry.operation).toEqual(retained.operation);
      expect(
        await page.evaluate("window.transactionDriverEvidence().workers"),
      ).toBe(2);
    }
    if (cut !== "rollback-before")
      expect(
        await page.evaluate("window.transactionDriverEvidence().workers"),
      ).toBe(1);
    const duplicateCommands = recovered.filter(
      (r) =>
        ((r.kind === "execute" && r.operation.kind === "ink") ||
          r.kind === "recoverInk") &&
        r.operation.command.commandId === retained.operation.command.commandId,
    );
    expect(duplicateCommands.length).toBeGreaterThanOrEqual(2);
    const after = await latestDocuments(page);
    expect(after[0]?.strokes.length).toBe(
      (before.tables.find((table) => table.name === "ink_stroke")?.rows
        .length ?? 0) + 1,
    );
    const settled: typeof before = await page.evaluate(
      "window.transactionDriverControl('snapshot')",
    );
    const receipts = settled.tables.find(
      (table) => table.name === "command_receipt",
    );
    if (!receipts) throw new Error("Actual receipt table missing");
    expect(
      receipts.rows.filter(
        (row) =>
          row[receipts.columns.indexOf("command_id")] ===
          retained.operation.command.commandId,
      ),
    ).toHaveLength(1);
    const changed = new Set([
      "ink_document",
      "ink_stroke",
      "ink_point_chunk",
      "ink_history",
      "ink_operation",
      "command_receipt",
      "local_diagnostics",
    ]);
    for (const table of before.tables) {
      if (
        [
          "ink_stroke",
          "ink_point_chunk",
          "ink_operation",
          "command_receipt",
        ].includes(table.name)
      ) {
        expect(
          settled.tables.find((item) => item.name === table.name)?.rows,
          table.name,
        ).toEqual(expect.arrayContaining(table.rows));
      }
      if (changed.has(table.name)) continue;
      expect(
        settled.tables.find((item) => item.name === table.name),
        table.name,
      ).toEqual(table);
    }
    await page.evaluate("window.transactionDriverLateReply()");
    await atWriting(page, "m-model");
    expect(await latestDocuments(page)).toEqual(after);
    await reloadSavedTurn({ page, turnId: "fixture.graph.l01.t06.m-model" });
    await atWriting(page, "m-model");
    const cold = await latestDocuments(page);
    expect(cold.map((document) => document.strokes)).toEqual(
      after.map((document) => document.strokes),
    );
    await testInfo.attach("conservation-scope", {
      body: JSON.stringify({
        allTables: before.tables.map((t) => t.name),
        changedTables: [...changed],
        strokeCount: after[0]?.strokes.length,
      }),
      contentType: "application/json",
    });
  });
}

test("a swallowed background diagnostic failure retires the actual worker and cancels a live cue", async ({
  context,
  page,
}, testInfo) => {
  await useLegacyContent(context);
  await installTransactionDriver(context, page);
  await installInitialSetupObservation(page);
  await page.goto(browserBaseURL);
  await completeInitialSetup({ page });
  await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByText("Fixture model.", { exact: true })).toBeVisible();
  const before: {
    tables: { name: string; columns: string[]; rows: unknown[][] }[];
  } = await page.evaluate("window.transactionDriverControl('snapshot')");
  await page.evaluate(
    "window.transactionDriverControl('arm',{cut:'rollback-before',operation:'diagnostic'})",
  );
  const cue = page.getByRole("button", { name: "Hold silent pointing cue" });
  await cue.focus();
  await page.keyboard.down("Space");
  await expect(cue).toHaveAttribute("aria-pressed", "true");
  await page.evaluate("window.transactionDriverTriggerRead()");
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await expect(cue).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.up("Space");
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("Fixture model.", { exact: true })).toBeVisible();
  const events: { boundary: string; autocommit: number }[] =
    await page.evaluate(
      "window.transactionDriverEvidence().evidence.filter(item=>item.events).at(-1).events",
    );
  expect(events.at(-1)).toEqual({
    boundary: "ROLLBACK-refused",
    autocommit: 0,
  });
  await writingAction(page, "Retry save");
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Fixture model.", { exact: true })).toBeVisible();
  expect(
    await page.evaluate("window.transactionDriverEvidence().workers"),
  ).toBe(2);
  const after: typeof before = await page.evaluate(
    "window.transactionDriverControl('snapshot')",
  );
  for (const table of before.tables)
    if (table.name !== "local_diagnostics")
      expect(
        after.tables.find((item) => item.name === table.name),
        table.name,
      ).toEqual(table);
  await testInfo.attach("background-retirement", {
    body: JSON.stringify({
      events,
      tables: before.tables.map((table) => table.name),
    }),
    contentType: "application/json",
  });
});

for (const cut of ["rollback-before", "commit-after"] as const) {
  test(`actual OPFS teaching ${cut} never publishes false acceptance and retries once`, async ({
    context,
    page,
  }, testInfo) => {
    await useLegacyContent(context);
    await installTransactionDriver(context, page);
    await probe(page);
    await page.goto(browserBaseURL);
    await completeInitialSetup({ page });
    await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await expect(
      page.getByText("Fixture model.", { exact: true }),
    ).toBeVisible();
    const before: {
      tables: { name: string; columns: string[]; rows: unknown[][] }[];
    } = await page.evaluate("window.transactionDriverControl('snapshot')");
    await page.evaluate(
      "window.transactionDriverControl('arm'," +
        JSON.stringify({ cut, operation: "teaching" }) +
        ")",
    );
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Fixture model.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Fixture child response.", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Continue", exact: true }),
    ).toBeDisabled();
    const sent = await requests(page);
    const retained = sent
      .filter(
        (r) =>
          r.kind === "execute" &&
          r.operation.kind === "teaching" &&
          r.operation.command.kind === "advance",
      )
      .at(-1);
    if (retained?.kind !== "execute" || retained.operation.kind !== "teaching")
      throw new Error("Retained teaching command missing");
    await writingAction(page, "Retry save");
    await expect(
      page.getByText("Fixture child response.", { exact: true }),
    ).toBeVisible();
    const recovered = await requests(page);
    const exact = recovered.filter(
      (r) =>
        ((r.kind === "execute" && r.operation.kind === "teaching") ||
          r.kind === "recoverTeaching") &&
        r.operation.command.commandId === retained.operation.command.commandId,
    );
    expect(exact).toHaveLength(2);
    for (const retry of exact) {
      if (retry.kind !== "execute" && retry.kind !== "recoverTeaching")
        throw new Error("Unexpected command transport");
      expect(retry.operation).toEqual(retained.operation);
    }
    expect(
      await page.evaluate("window.transactionDriverEvidence().workers"),
    ).toBe(cut === "rollback-before" ? 2 : 1);
    const after: typeof before = await page.evaluate(
      "window.transactionDriverControl('snapshot')",
    );
    const changed = new Set([
      "session",
      "task_run",
      "task_advance",
      "command_receipt",
      "local_diagnostics",
      "course_cursor",
    ]);
    for (const table of before.tables)
      if (!changed.has(table.name))
        expect(
          after.tables.find((item) => item.name === table.name),
          table.name,
        ).toEqual(table);
    const cursorBefore = before.tables.find(
      (table) => table.name === "course_cursor",
    );
    const cursorAfter = after.tables.find(
      (table) => table.name === "course_cursor",
    );
    if (!cursorBefore || !cursorAfter || cursorBefore.rows.length !== 1)
      throw new Error("Selected course cursor missing");
    const revisionIndex = cursorBefore.columns.indexOf("revision");
    const previousRevision = cursorBefore.rows[0]?.[revisionIndex];
    if (typeof previousRevision !== "number")
      throw new Error(
        "Synthetic cursor revision must be an exact small integer",
      );
    expect(cursorAfter).toEqual({
      ...cursorBefore,
      rows: cursorBefore.rows.map((row) =>
        row.map((value, index) =>
          index === revisionIndex ? previousRevision + 1 : value,
        ),
      ),
    });
    expect(
      after.tables.find((table) => table.name === "task_advance")?.rows.length,
    ).toBe(
      (before.tables.find((table) => table.name === "task_advance")?.rows
        .length ?? 0) + 1,
    );
    const receipts = after.tables.find(
      (table) => table.name === "command_receipt",
    );
    if (!receipts) throw new Error("Actual receipts missing");
    expect(
      receipts.rows.filter(
        (row) =>
          row[receipts.columns.indexOf("command_id")] ===
          retained.operation.command.commandId,
      ),
    ).toHaveLength(1);
    const turnId = await page
      .locator("main[data-turn-id]")
      .getAttribute("data-turn-id");
    if (!turnId) throw new Error("Committed child turn missing");
    await page.reload();
    const paused = page.getByRole("heading", {
      name: "Reading is paused",
      exact: true,
    });
    await expect(
      page.getByText("Fixture child response.", { exact: true }).or(paused),
    ).toBeVisible();
    if (await paused.isVisible())
      await page.getByRole("button", { name: "Resume", exact: true }).click();
    await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
      "data-turn-id",
      turnId,
    );
    await expect(
      page.getByText("Fixture child response.", { exact: true }),
    ).toBeVisible();
    await testInfo.attach("teaching-exact-once", {
      body: JSON.stringify({
        cut,
        unaffectedTables: before.tables
          .filter((table) => !changed.has(table.name))
          .map((table) => table.name),
        advances: after.tables.find((table) => table.name === "task_advance")
          ?.rows.length,
      }),
      contentType: "application/json",
    });
  });
}
