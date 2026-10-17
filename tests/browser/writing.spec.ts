import { chromium, expect, test } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decodeInkPoints, prepareInkCommand } from "@readatthree/teaching";
import {
  atWriting,
  boardPoint,
  drawPractice,
  drawStroke,
  latestDocuments,
  probe,
  requests,
  responses,
  snapshots,
  startWriting,
  writingAction,
  writingBase,
} from "./writing-helpers.ts";

for (const viewport of [
  { width: 900, height: 600 },
  { width: 1280, height: 800 },
]) {
  test(`seven source turns, four confirmations and all six durable layers at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await probe(page);
    await startWriting(page);
    const anchors = () =>
      page
        .locator(".teaching-parent-panel,canvas,.teaching-parent-controls")
        .evaluateAll((elements) =>
          elements.map((element) => {
            const r = element.getBoundingClientRect();
            return [r.x, r.y, r.width, r.height];
          }),
        );
    const geometry = await anchors();
    await drawPractice(page);
    expect(
      (await requests(page)).filter((r) => r.kind === "dispatchInk"),
    ).toHaveLength(0);
    await writingAction(page);
    await atWriting(page, "m-model");
    const phases = [
      { suffix: "m-model", y: 0, action: "Continue" },
      { suffix: "m-tracing", y: 0, action: "Confirm tracing" },
      { suffix: "m-independent", y: 0, action: "Confirm independent writing" },
      { suffix: "s-model", y: 1, action: "Continue" },
      { suffix: "s-tracing", y: 1, action: "Confirm tracing" },
      { suffix: "s-independent", y: 1, action: "Confirm independent writing" },
    ];
    for (const phase of phases) {
      await atWriting(page, phase.suffix);
      expect(await anchors()).toEqual(geometry);
      await expect(page.locator("canvas")).toBeInViewport();
      if (phase.suffix === "m-independent") {
        await writingAction(page, "Back");
        await atWriting(page, "m-tracing");
        const count = (await requests(page)).filter(
          (request) => request.kind === "dispatchInk",
        ).length;
        await drawPractice(page);
        expect(
          (await requests(page)).filter(
            (request) => request.kind === "dispatchInk",
          ),
        ).toHaveLength(count);
        await writingAction(page);
        await atWriting(page, "m-independent");
      }
      const reads = (await requests(page)).filter(
        (request) => request.kind === "readInk" || request.kind === "read",
      ).length;
      await drawPractice(page, phase.y);
      expect(
        (await requests(page)).filter(
          (request) => request.kind === "readInk" || request.kind === "read",
        ),
      ).toHaveLength(reads);
      await writingAction(page, phase.action);
    }
    await expect(
      page.getByText("Writing task complete", { exact: true }),
    ).toBeVisible();
    const documents = await latestDocuments(page);
    expect(documents).toHaveLength(2);
    for (const document of documents) {
      expect(document.writable).toBe(false);
      for (const layer of ["model", "tracing", "independent"]) {
        const strokes = document.strokes.filter(
          (stroke) => stroke.layer === layer,
        );
        expect(strokes).toHaveLength(3);
        expect(strokes.every((stroke) => stroke.status === "finished")).toBe(
          true,
        );
      }
      const first = document.strokes[0]?.chunks[0];
      if (!first) throw new Error("SQL dot chunk missing");
      const point = decodeInkPoints({
        payload: Uint8Array.from(first.payload),
        pointCount: first.pointCount,
        bounds: document.bounds,
      })[0];
      expect(point?.x).toBeCloseTo(100, 3);
      expect(point?.y).toBeCloseTo(document.guides.midline + 20, 3);
      expect(
        document.histories.every((history) => history.operations.length === 3),
      ).toBe(true);
    }
    const actions = (await requests(page)).filter(
      (request) =>
        request.kind === "dispatch" &&
        request.command.kind === "writingNavigate",
    );
    expect(
      actions.filter(
        (request) =>
          request.kind === "dispatch" &&
          request.command.kind === "writingNavigate" &&
          ["confirmTracing", "confirmIndependent"].includes(
            request.command.payload.action.kind,
          ),
      ),
    ).toHaveLength(4);
    const before = documents.map((document) => document.token.documentId);
    await page.reload();
    await expect(
      page.getByText("Writing task complete", { exact: true }),
    ).toBeVisible();
    expect(
      (await latestDocuments(page)).map(
        (document) => document.token.documentId,
      ),
    ).toEqual(before);
    await writingAction(page, "Back");
    await atWriting(page, "s-independent");
    const count = (await requests(page)).filter(
      (request) => request.kind === "dispatchInk",
    ).length;
    await drawPractice(page, 1);
    expect(
      (await requests(page)).filter(
        (request) => request.kind === "dispatchInk",
      ),
    ).toHaveLength(count);
    await writingAction(page, "Continue");
    await expect(
      page.getByText("Writing task complete", { exact: true }),
    ).toBeVisible();
  });
}

test("touch, pen semantics, contact cancellation and boundaries preserve confirmed SQL points", async ({
  page,
  context,
}) => {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  const cdp = await context.newCDPSession(page);
  const one = await boardPoint(page, 100, 120),
    two = await boardPoint(page, 500, 130);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: one.x, y: one.y, radiusX: 4, radiusY: 4, force: 1 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { id: 1, x: one.x, y: one.y, radiusX: 4, radiusY: 4, force: 1 },
      { id: 2, x: two.x, y: two.y, radiusX: 8, radiusY: 8, force: 1 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { id: 1, x: one.x + 20, y: one.y + 10, radiusX: 4, radiusY: 4, force: 1 },
      { id: 2, x: two.x + 20, y: two.y + 10, radiusX: 8, radiusY: 8, force: 1 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  const pen = await boardPoint(page, 300, 115);
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: pen.x,
    y: pen.y,
    button: "left",
    buttons: 1,
    pointerType: "pen",
    force: 0.5,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: pen.x + 30,
    y: pen.y + 15,
    button: "left",
    buttons: 1,
    pointerType: "pen",
    force: 0.7,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: pen.x + 30,
    y: pen.y + 15,
    button: "left",
    buttons: 0,
    pointerType: "pen",
  });
  await drawStroke(page, [
    { x: 700, y: 140 },
    { x: 710, y: 180 },
    { x: 720, y: 250 },
    { x: 750, y: 300 },
  ]);
  await writingAction(page);
  await atWriting(page, "m-tracing");
  const first = (await latestDocuments(page))[0];
  expect(first?.strokes).toHaveLength(3);
  expect(first?.strokes.map((stroke) => stroke.status)).toEqual([
    "interrupted",
    "finished",
    "interrupted",
  ]);
  expect(
    await page.evaluate(() => ({
      x: scrollX,
      y: scrollY,
      scale: visualViewport?.scale,
    })),
  ).toEqual({ x: 0, y: 0, scale: 1 });
  expect(
    first?.strokes.every((stroke) =>
      stroke.chunks.every((chunk) =>
        decodeInkPoints({
          payload: Uint8Array.from(chunk.payload),
          pointCount: chunk.pointCount,
          bounds: first.bounds,
        }).every(
          (point) =>
            point.x <= first.bounds.width && point.y <= first.bounds.height,
        ),
      ),
    ),
  ).toBe(true);
});

test("resize, hidden lifecycle, unsupported child unmount and reattach flush without accepting teaching", async ({
  page,
}) => {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  const start = await boardPoint(page, 120, 110);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 35, start.y + 20);
  await page.setViewportSize({ width: 800, height: 600 });
  await expect(
    page.getByText("Make room for reading", { exact: true }),
  ).toBeVisible();
  await page.mouse.up();
  await page.setViewportSize({ width: 1280, height: 800 });
  await atWriting(page, "m-model");
  const next = await boardPoint(page, 250, 110);
  await page.mouse.move(next.x, next.y);
  await page.mouse.down();
  await page.mouse.move(next.x + 20, next.y + 10);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new PageTransitionEvent("pagehide"));
  });
  await page.mouse.up();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.reload();
  await atWriting(page, "m-model");
  const first = (await latestDocuments(page))[0];
  expect(first?.strokes).toHaveLength(2);
  expect(
    first?.strokes.every((stroke) => stroke.status === "interrupted"),
  ).toBe(true);
});

test("warm retained newer tail survives two committed reply losses and Retry opening", async ({
  page,
}) => {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await page.evaluate("window.armWritingFault('checkpoint-tail')");
  const point = await boardPoint(page, 100, 110);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 20, point.y + 10);
  await expect
    .poll(
      async () =>
        (await requests(page)).filter(
          (request) =>
            request.kind === "dispatchInk" &&
            request.command.edit.kind === "checkpoint",
        ).length,
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() => page.evaluate("window.hasHeldWritingReply()"))
    .toBe(true);
  await page.mouse.move(point.x + 60, point.y + 25);
  await page.evaluate("window.loseWritingReply()");
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await writingAction(page, "Retry save");
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await writingAction(page, "Retry save");
  await atWriting(page, "m-model");
  const all = await requests(page);
  const checkpoints = all.filter(
    (request) =>
      (request.kind === "dispatchInk" || request.kind === "recoverInk") &&
      request.command.edit.kind === "checkpoint",
  );
  expect(checkpoints).toHaveLength(2);
  if (
    checkpoints[0]?.kind !== "dispatchInk" ||
    checkpoints[1]?.kind !== "recoverInk"
  )
    throw Error("Checkpoint recovery missing");
  expect(checkpoints[0].command).toEqual(checkpoints[1].command);
  const tails = all.filter(
    (request) =>
      request.kind === "recoverInk" && request.command.edit.kind === "finalize",
  );
  expect(tails).toHaveLength(2);
  if (tails[0]?.kind !== "recoverInk" || tails[1]?.kind !== "recoverInk")
    throw Error("Tail recovery missing");
  expect(tails[0].command).toEqual(tails[1].command);
  const first = (await latestDocuments(page))[0];
  expect(first?.strokes).toHaveLength(1);
  expect(first?.strokes[0]?.status).toBe("interrupted");
  expect(
    first?.histories.find((history) => history.layer === "model")?.operations,
  ).toHaveLength(1);
  const stroke = first?.strokes[0];
  if (!first || !stroke) throw Error("Recovered stroke missing");
  const points = stroke.chunks.flatMap((chunk) =>
    decodeInkPoints({
      payload: Uint8Array.from(chunk.payload),
      pointCount: chunk.pointCount,
      bounds: first.bounds,
    }),
  );
  expect(points.at(-1)?.x).toBeGreaterThan(150);
  await page.reload();
  await atWriting(page, "m-model");
  expect((await latestDocuments(page))[0]?.strokes).toHaveLength(1);
});

test("a failed finalize retains the action and retries ink before one phase acceptance; Skip is distinct", async ({
  page,
}) => {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await page.evaluate("window.armWritingFault('ink-failure')");
  await drawPractice(page);
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await atWriting(page, "m-model");
  await writingAction(page, "Retry save");
  await atWriting(page, "m-model");
  await writingAction(page, "Skip writing");
  await expect(
    page.getByText("Optional writing skipped", { exact: true }),
  ).toBeVisible();
  expect((await latestDocuments(page))[0]?.strokes.length).toBeGreaterThan(0);
  await page.reload();
  await expect(
    page.getByText("Optional writing skipped", { exact: true }),
  ).toBeVisible();
});

test("each phase survives a full browser process restart and cold committed capture recovery is idempotent", async () => {
  const directory = await mkdtemp(join(tmpdir(), "writing-opfs-restart-"));
  let context = await chromium.launchPersistentContext(directory, {
    headless: true,
    viewport: { width: 900, height: 600 },
  });
  try {
    let page = await context.newPage();
    await probe(page);
    await startWriting(page);
    await writingAction(page);
    for (const phase of [
      { suffix: "m-model", y: 0, action: "Continue" },
      { suffix: "m-tracing", y: 0, action: "Confirm tracing" },
      { suffix: "m-independent", y: 0, action: "Confirm independent writing" },
      { suffix: "s-model", y: 1, action: "Continue" },
      { suffix: "s-tracing", y: 1, action: "Confirm tracing" },
      { suffix: "s-independent", y: 1, action: "Confirm independent writing" },
    ]) {
      await atWriting(page, phase.suffix);
      const authored = (await latestDocuments(page))[phase.y];
      if (!authored) throw Error("Authored row missing");
      const point = await boardPoint(
        page,
        100,
        authored.boardY + authored.guides.midline + 30,
      );
      await page.mouse.move(point.x, point.y);
      await page.mouse.down();
      await page.mouse.move(point.x + 20, point.y + 10);
      await expect
        .poll(
          async () =>
            (await requests(page)).filter(
              (request) =>
                request.kind === "dispatchInk" &&
                request.command.edit.kind === "checkpoint",
            ).length,
        )
        .toBeGreaterThan(0);
      await context.close();
      context = await chromium.launchPersistentContext(directory, {
        headless: true,
        viewport: { width: 900, height: 600 },
      });
      page = await context.newPage();
      await probe(page);
      await page.goto(writingBase);
      await atWriting(page, phase.suffix);
      const documents = await latestDocuments(page);
      expect(
        documents
          .flatMap((document) => document.strokes)
          .every((stroke) => stroke.status !== "capturing"),
      ).toBe(true);
      const count = documents.flatMap((document) => document.strokes).length;
      await page.reload();
      await atWriting(page, phase.suffix);
      expect(
        (await latestDocuments(page)).flatMap((document) => document.strokes),
      ).toHaveLength(count);
      await writingAction(page, phase.action);
    }
    await expect(
      page.getByText("Writing task complete", { exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
    await rm(directory, { recursive: true, force: true });
  }
});

for (const fault of ["teaching-before-twice", "teaching-after-reconcile"]) {
  test(`the exact teaching envelope survives ${fault} while recovery stays closed`, async ({
    page,
  }) => {
    await probe(page);
    await startWriting(page);
    await writingAction(page);
    await drawPractice(page);
    await page.evaluate(`window.armWritingFault(${JSON.stringify(fault)})`);
    await writingAction(page);
    await atWriting(page, "m-model");
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 800, height: 600 });
    await expect(
      page.getByText("Make room for reading", { exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 800 });
    await atWriting(page, "m-model");
    await writingAction(page, "Retry save");
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toBeVisible();
    await atWriting(page, "m-model");
    await writingAction(page, "Retry save");
    await atWriting(page, "m-tracing");
    const all = await requests(page);
    const envelopes = all.filter(
      (request) =>
        (request.kind === "dispatch" || request.kind === "recoverTeaching") &&
        request.command.kind === "writingNavigate",
    );
    const relevant = envelopes.slice(-3);
    expect(relevant).toHaveLength(3);
    const first = relevant[0];
    if (!first || !("command" in first))
      throw Error("Teaching command missing");
    for (const request of relevant) {
      if (!("command" in request)) throw Error("Teaching recovery missing");
      expect(request.command).toEqual(first.command);
    }
    expect(
      all.filter((request) => request.kind === "recoverTeaching"),
    ).toHaveLength(2);
    const restored = (await latestDocuments(page))[0];
    expect(restored?.strokes).toHaveLength(3);
    await page.reload();
    await atWriting(page, "m-tracing");
  });
}

for (const path of ["normal", "recovered teaching"]) {
  for (const fault of [
    "teaching-receipt-command-id",
    "teaching-read-revision",
  ]) {
    test(`${path} publication rejects ${fault} and retains exact Retry`, async ({
      page,
    }) => {
      await probe(page);
      await startWriting(page);
      const selected = (await responses(page)).findLast(
        (response) => response.kind === "projection",
      );
      const selectedReceipt = (await responses(page)).findLast(
        (response) => response.kind === "receipt",
      );
      if (
        selected?.kind !== "projection" ||
        selected.value.kind !== "writing" ||
        selectedReceipt?.kind !== "receipt" ||
        selectedReceipt.value.kind !== "committed"
      )
        throw new Error("Committed writing selection missing");
      expect({
        receiptRevision: selectedReceipt.value.revision,
        profileRevision: selected.value.profileRevision,
        sessionRevision: selected.value.revision,
      }).toEqual({
        receiptRevision: "1",
        profileRevision: "1",
        sessionRevision: "0",
      });
      await writingAction(page);
      const checkpoint = await page
        .locator("main")
        .getAttribute("data-checkpoint-id");
      if (!checkpoint) throw new Error("Model checkpoint missing");
      const original = (await latestDocuments(page)).map(
        (document) => document.token.documentId,
      );
      await drawStroke(page, [{ x: 120, y: 110 }]);
      if (path === "recovered teaching") {
        await page.evaluate("window.armWritingFault('teaching-before')");
        await writingAction(page);
        await atWriting(page, "m-model");
        await expect(
          page.getByRole("button", { name: "Retry save", exact: true }),
        ).toBeVisible();
      }
      await page.evaluate(`window.armWritingFault(${JSON.stringify(fault)})`);
      await writingAction(page, path === "normal" ? "Continue" : "Retry save");
      await atWriting(page, "m-model");
      await expect(page.locator("main")).toHaveAttribute(
        "data-checkpoint-id",
        checkpoint,
      );
      await expect(
        page.getByRole("button", { name: "Retry save", exact: true }),
      ).toBeVisible();
      await expect(page.locator("canvas")).toHaveAttribute(
        "data-writable",
        "false",
      );
      const inkCount = (await requests(page)).filter(
        (request) => request.kind === "dispatchInk",
      ).length;
      await drawStroke(page, [{ x: 250, y: 120 }]);
      expect(
        (await requests(page)).filter(
          (request) => request.kind === "dispatchInk",
        ),
      ).toHaveLength(inkCount);
      await writingAction(page, "Retry save");
      await atWriting(page, "m-tracing");
      await expect(page.locator("canvas")).toHaveAttribute(
        "data-writable",
        "true",
      );
      const relevant = (await requests(page)).filter(
        (request) =>
          (request.kind === "dispatch" || request.kind === "recoverTeaching") &&
          request.command.kind === "writingNavigate" &&
          request.command.expectedRevision === "1",
      );
      expect(relevant).toHaveLength(path === "normal" ? 2 : 3);
      const first = relevant[0];
      if (!first || !("command" in first))
        throw new Error("Retained teaching command missing");
      for (const request of relevant) {
        if (!("command" in request))
          throw new Error("Teaching Retry command missing");
        expect(request.command).toEqual(first.command);
      }
      const committed = (await responses(page)).filter(
        (response) =>
          response.kind === "receipt" &&
          response.value.kind === "committed" &&
          response.value.commandId === first.command.commandId,
      );
      expect(committed).toHaveLength(2);
      for (const response of committed) {
        if (response.kind !== "receipt" || response.value.kind !== "committed")
          throw new Error("Committed teaching receipt missing");
        expect(response.value.revision).toBe("2");
      }
      const after = await latestDocuments(page);
      expect(after.map((document) => document.token.documentId)).toEqual(
        original,
      );
      expect(after.flatMap((document) => document.strokes)).toHaveLength(1);
      const model = after[0];
      const stroke = model?.strokes[0];
      if (!model || !stroke) throw new Error("Committed model stroke missing");
      expect(stroke.status).toBe("finished");
      expect(
        model.histories.find((history) => history.layer === "model")
          ?.operations,
      ).toHaveLength(1);
      const points = stroke.chunks.flatMap((chunk) =>
        decodeInkPoints({
          payload: Uint8Array.from(chunk.payload),
          pointCount: chunk.pointCount,
          bounds: model.bounds,
        }),
      );
      expect(points[0]?.elapsedMs).toBe(0);
      for (const [index, point] of points.entries()) {
        expect(point.x).toBeCloseTo(120, 3);
        expect(point.y).toBeCloseTo(110, 3);
        expect(point.pressure).toBe(1);
        expect(point.elapsedMs).toBeGreaterThanOrEqual(
          points[index - 1]?.elapsedMs ?? 0,
        );
      }
      await page.reload();
      await atWriting(page, "m-tracing");
      const reopened = await latestDocuments(page);
      expect(reopened.map((document) => document.token.documentId)).toEqual(
        original,
      );
      expect(reopened.flatMap((document) => document.strokes)).toEqual(
        after.flatMap((document) => document.strokes),
      );
      const durable = (await responses(page)).findLast(
        (response) => response.kind === "projection",
      );
      if (durable?.kind !== "projection" || durable.value.kind !== "writing")
        throw new Error("Reopened writing projection missing");
      expect(durable.value.revision).toBe("2");
    });
  }
}

test("Retry opening remount retains an uncertain teaching command and publishes its receipt only once", async ({
  page,
}) => {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await drawPractice(page);
  await page.evaluate("window.armWritingFault('teaching-read-recovery')");
  await writingAction(page);
  await expect(
    page.getByRole("button", { name: "Retry opening", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Retry opening", exact: true })
    .click();
  await atWriting(page, "m-tracing");
  expect((await latestDocuments(page))[0]?.strokes).toHaveLength(3);
  const recovered = (await requests(page)).filter(
    (request) => request.kind === "recoverTeaching",
  );
  expect(recovered).toHaveLength(1);
});

test("DPR reconstruction changes only pixels and stale document epochs cannot append", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  try {
    const page = await context.newPage();
    await probe(page);
    await startWriting(page);
    await writingAction(page);
    await drawStroke(page, [
      { x: 300, y: 120 },
      { x: 340, y: 140 },
    ]);
    await writingAction(page);
    await atWriting(page, "m-tracing");
    const committed = (await latestDocuments(page))[0];
    if (!committed) throw Error("Committed document missing");
    const old = (await requests(page)).find(
      (request) =>
        request.kind === "dispatchInk" && request.command.edit.kind === "begin",
    );
    if (!old || old.kind !== "dispatchInk")
      throw Error("Old ink token missing");
    const stale = await prepareInkCommand({
      token: old.command.token,
      edit: {
        ...old.command.edit,
        strokeId: committed.strokes[0]?.strokeId ?? old.command.edit.strokeId,
      },
      ids: () => crypto.randomUUID(),
      hash: async (text) => {
        const bytes = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(text),
        );
        return Array.from(new Uint8Array(bytes), (byte) =>
          byte.toString(16).padStart(2, "0"),
        ).join("");
      },
    });
    const response: unknown = await page.evaluate((command) => {
      if (
        "injectWritingCommand" in window &&
        typeof window.injectWritingCommand === "function"
      )
        return window.injectWritingCommand(command);
      throw new Error("Writing probe missing");
    }, stale);
    expect(response).toMatchObject({
      kind: "inkReceipt",
      value: { kind: "rejected" },
    });
    const before = (await requests(page)).filter(
      (request) => request.kind === "dispatchInk",
    ).length;
    await page.setViewportSize({ width: 900, height: 600 });
    await expect
      .poll(() =>
        page
          .locator("canvas")
          .evaluate((canvas) =>
            canvas instanceof HTMLCanvasElement ? canvas.width : 0,
          ),
      )
      .toBe(1452);
    expect(
      (await requests(page)).filter(
        (request) => request.kind === "dispatchInk",
      ),
    ).toHaveLength(before);
    await page.reload();
    await atWriting(page, "m-tracing");
    const restored = (await latestDocuments(page))[0];
    expect(restored?.strokes).toEqual(committed.strokes);
  } finally {
    await context.close();
  }
});

test("a parent action fences before its pending finalize and Retry preserves that request", async ({
  page,
}) => {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await page.evaluate("window.armWritingFault('hold-finalize')");
  await drawStroke(page, [
    { x: 180, y: 120 },
    { x: 210, y: 140 },
  ]);
  await expect
    .poll(() => page.evaluate("window.hasHeldWritingWrite()"))
    .toBe(true);
  const before = (await requests(page)).filter(
    (request) => request.kind === "dispatch",
  ).length;
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "true");
  await page.evaluate("window.failHeldWritingWrite()");
  await atWriting(page, "m-model");
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  expect(
    (await requests(page)).filter((request) => request.kind === "dispatch"),
  ).toHaveLength(before);
  await writingAction(page, "Retry save");
  await atWriting(page, "m-tracing");
  const all = await requests(page);
  expect(all.filter((request) => request.kind === "dispatch")).toHaveLength(
    before + 1,
  );
  const finalizes = all.filter(
    (request) =>
      request.kind === "dispatchInk" &&
      request.command.edit.kind === "finalize",
  );
  expect(finalizes).toHaveLength(2);
  if (
    finalizes[0]?.kind !== "dispatchInk" ||
    finalizes[1]?.kind !== "dispatchInk"
  )
    throw Error("Finalize Retry missing");
  expect(finalizes[0].command).toEqual(finalizes[1].command);
  expect((await latestDocuments(page))[0]?.strokes).toHaveLength(1);
});

test("task selection uses closed exact Retry, Resume keeps documents and Replay allocates fresh ones", async ({
  page,
}) => {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await drawPractice(page);
  const original = (await latestDocuments(page)).map(
    (document) => document.token.documentId,
  );
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  await page.evaluate("window.armWritingFault('teaching-before-twice')");
  await page.getByRole("button", { name: "Start Task 2", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await writingAction(page, "Retry save");
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await writingAction(page, "Retry save");
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    /t02/,
  );
  const selectedProjection = (await responses(page)).findLast(
    (response) => response.kind === "projection",
  );
  const selectedReceipt = (await responses(page)).findLast(
    (response) => response.kind === "receipt",
  );
  if (
    selectedProjection?.kind !== "projection" ||
    selectedProjection.value.kind !== "teaching" ||
    selectedReceipt?.kind !== "receipt" ||
    selectedReceipt.value.kind !== "committed"
  )
    throw new Error("Committed task selection missing");
  expect({
    receiptRevision: selectedReceipt.value.revision,
    profileRevision: selectedProjection.value.profileRevision,
    sessionRevision: selectedProjection.value.revision,
  }).toEqual({
    receiptRevision: "2",
    profileRevision: "2",
    sessionRevision: "0",
  });
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  await page
    .getByRole("button", { name: "Resume Task 6", exact: true })
    .click();
  await atWriting(page, "m-model");
  expect(
    (await latestDocuments(page)).map((document) => document.token.documentId),
  ).toEqual(original);
  expect((await latestDocuments(page))[0]?.strokes).toHaveLength(3);
  await writingAction(page, "Skip writing");
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  await page.getByRole("button", { name: "Replay task", exact: true }).click();
  await atWriting(page, "m-sound");
  const replayed = await latestDocuments(page);
  expect(replayed.map((document) => document.token.documentId)).not.toEqual(
    original,
  );
  expect(replayed.every((document) => document.strokes.length === 0)).toBe(
    true,
  );
  const selected = (await requests(page)).filter(
    (request) =>
      (request.kind === "dispatch" || request.kind === "recoverTeaching") &&
      request.command.kind === "writingSelect",
  );
  expect(selected.length).toBeGreaterThanOrEqual(3);
  if (!selected[0] || !("command" in selected[0]))
    throw Error("Writing selection missing");
  for (const request of selected.slice(0, 3)) {
    if (!("command" in request)) throw Error("Selection envelope missing");
    expect(request.command).toEqual(selected[0].command);
  }
});

test("abrupt browser process loss restores committed checkpoints without promising the newer tail", async () => {
  const directory = await mkdtemp(join(tmpdir(), "writing-opfs-crash-"));
  let context = await chromium.launchPersistentContext(directory, {
    headless: true,
    viewport: { width: 900, height: 600 },
  });
  try {
    let page = await context.newPage();
    await probe(page);
    await startWriting(page);
    await writingAction(page);
    await page.evaluate("window.armWritingFault('checkpoint-tail')");
    const start = await boardPoint(page, 100, 110);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 10, start.y + 10);
    await expect
      .poll(() => page.evaluate("window.hasHeldWritingReply()"))
      .toBe(true);
    await page.mouse.move(start.x + 60, start.y + 20);
    const ownedBrowser = context.browser();
    if (!ownedBrowser)
      throw new Error("Owned persistent browser is unavailable");
    const browserSession = await ownedBrowser.newBrowserCDPSession();
    const inventory = await browserSession.send("SystemInfo.getProcessInfo");
    const ownedProcess = inventory.processInfo.find(
      (info) => info.type === "browser",
    );
    if (
      !ownedProcess ||
      !Number.isSafeInteger(ownedProcess.id) ||
      ownedProcess.id <= 0
    )
      throw new Error("Owned browser process identity is unavailable");
    process.kill(ownedProcess.id, "SIGKILL");
    await context.close().catch(() => {});
    context = await chromium.launchPersistentContext(directory, {
      headless: true,
      viewport: { width: 900, height: 600 },
    });
    page = await context.newPage();
    await probe(page);
    await page.goto(writingBase);
    await atWriting(page, "m-model");
    const document = (await latestDocuments(page))[0];
    const stroke = document?.strokes[0];
    if (!document || !stroke)
      throw new Error("Committed checkpoint was not recovered");
    expect(stroke.status).toBe("interrupted");
    const points = stroke.chunks.flatMap((chunk) =>
      decodeInkPoints({
        payload: Uint8Array.from(chunk.payload),
        pointCount: chunk.pointCount,
        bounds: document.bounds,
      }),
    );
    expect(points.at(-1)?.x).toBeLessThan(150);
    expect(
      document.histories.find((history) => history.layer === "model")
        ?.operations,
    ).toHaveLength(1);
    await page.reload();
    await atWriting(page, "m-model");
    expect((await latestDocuments(page))[0]?.strokes).toHaveLength(1);
  } finally {
    await context.close().catch(() => {});
    await rm(directory, { recursive: true, force: true });
  }
});
