import { reloadSavedTurn } from "./reload-saved-turn.ts";
import { expect, test } from "@playwright/test";
import { visibleInkStrokes, decodeInkPoints } from "@readatthree/teaching";
import {
  atWritableWriting,
  boardPoint,
  drawStroke,
  latestDocuments,
  probe,
  requests,
  startWriting,
  writingAction,
} from "./writing-helpers.ts";
import type { Page } from "@playwright/test";
async function prepare(page: Page) {
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await drawStroke(page, [
    { x: 100, y: 110 },
    { x: 140, y: 130 },
  ]);
  await writingAction(page);
  await atWritableWriting(page, "m-tracing");
}
async function childIds(page: Page) {
  const document = (await latestDocuments(page))[0];
  const history = document?.histories.find(
    (value) => value.layer === "tracing",
  );
  if (!document || !history) throw new Error("Practice history missing");
  return visibleInkStrokes({ history, strokes: document.strokes });
}
for (const viewport of [
  { width: 900, height: 600 },
  { width: 1280, height: 800 },
]) {
  test(`saved practice tools keep model, source and anchors through Clear, branch and restart at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await prepare(page);
    const model = (await latestDocuments(page))[0]?.strokes.filter(
      (value) => value.layer === "model",
    );
    const anchors = () =>
      page
        .locator(
          ".teaching-parent-panel,canvas,.teaching-parent-controls,.teaching-writing-footer",
        )
        .evaluateAll((elements) =>
          elements.map((element) => {
            const r = element.getBoundingClientRect();
            return [r.x, r.y, r.width, r.height];
          }),
        );
    const before = await anchors();
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeDisabled();
    await drawStroke(page, [
      { x: 180, y: 110 },
      { x: 220, y: 130 },
    ]);
    await drawStroke(page, [
      { x: 260, y: 110 },
      { x: 300, y: 130 },
    ]);
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeEnabled();
    await writingAction(page, "Clear practice");
    expect(await childIds(page)).toEqual([]);
    expect(
      (await latestDocuments(page))[0]?.strokes.filter(
        (value) => value.layer === "tracing",
      ),
    ).toHaveLength(2);
    await writingAction(page, "Undo ink");
    const restored = await childIds(page);
    expect(restored).toHaveLength(2);
    await writingAction(page, "Undo ink");
    expect(await childIds(page)).toEqual(restored.slice(0, 1));
    await drawStroke(page, [
      { x: 350, y: 110 },
      { x: 390, y: 130 },
    ]);
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("button", { name: "Redo ink", exact: true }),
    ).toBeDisabled();
    await reloadSavedTurn({ page, turnId: "fixture.graph.l01.t06.m-tracing" });
    await atWritableWriting(page, "m-tracing");
    expect(await anchors()).toEqual(before);
    const document = (await latestDocuments(page))[0];
    expect(
      document?.strokes.filter((value) => value.layer === "model"),
    ).toEqual(model);
    expect(
      document?.strokes.some((value) => value.strokeId === restored[1]),
    ).toBe(false);
    expect(await childIds(page)).toHaveLength(2);
    await writingAction(page, "Undo ink");
    await writingAction(page, "Redo ink");
    expect(await childIds(page)).toHaveLength(2);
    expect(await anchors()).toEqual(before);
    await expect(
      page.locator('.teaching-writing-tools [data-origin="added"]'),
    ).toHaveCount(3);
    await writingAction(page, "Confirm tracing");
    await atWritableWriting(page, "m-independent");
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeDisabled();
    await writingAction(page, "Back");
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeDisabled();
    expect(await anchors()).toEqual(before);
  });
}
for (const fault of [
  "teaching-before-twice",
  "teaching-after-reconcile",
  "teaching-receipt-command-id",
  "control-restore-revision",
]) {
  test(`practice exact control Retry survives ${fault} without another Undo`, async ({
    page,
  }) => {
    await prepare(page);
    await drawStroke(page, [{ x: 180, y: 110 }]);
    await drawStroke(page, [{ x: 260, y: 110 }]);
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeEnabled();
    await page.evaluate(`window.armWritingFault(${JSON.stringify(fault)})`);
    await page.getByRole("button", { name: "Undo ink", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Retry save", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Redo ink", exact: true }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Retry save", exact: true }).click();
    if (
      fault === "teaching-before-twice" ||
      fault === "teaching-after-reconcile"
    ) {
      await expect(
        page.getByRole("button", { name: "Retry save", exact: true }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Retry save", exact: true })
        .click();
    }
    await expect(
      page.getByRole("button", { name: "Redo ink", exact: true }),
    ).toBeEnabled();
    expect(await childIds(page)).toHaveLength(1);
    const controls = (await requests(page)).filter(
      (request) =>
        (request.kind === "execute" || request.kind === "recoverTeaching") &&
        request.operation.kind === "teaching" &&
        request.operation.command.kind === "writingControl",
    );
    expect(controls.length).toBeGreaterThanOrEqual(2);
    expect(
      new Set(
        controls.map((request) =>
          "operation" in request
            ? JSON.stringify(request.operation)
            : "invalid",
        ),
      ).size,
    ).toBe(1);
    await reloadSavedTurn({ page, turnId: "fixture.graph.l01.t06.m-tracing" });
    await atWritableWriting(page, "m-tracing");
    expect(await childIds(page)).toHaveLength(1);
  });
}

test("a held Query summary does not delay the next contact and exact acknowledged tokens gate tools", async ({
  page,
}) => {
  await prepare(page);
  await page.evaluate("window.armWritingFault('hold-summary')");
  await drawStroke(page, [
    { x: 180, y: 110 },
    { x: 220, y: 130 },
  ]);
  await expect.poll(() => page.evaluate("window.hasHeldSummary()")).toBe(true);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeDisabled();
  const before = (await requests(page)).filter(
    (request) =>
      request.kind === "execute" &&
      request.operation.kind === "ink" &&
      request.operation.command.edit.kind === "finalize",
  ).length;
  await drawStroke(page, [
    { x: 260, y: 110 },
    { x: 300, y: 130 },
  ]);
  await expect
    .poll(
      async () =>
        (await requests(page)).filter(
          (request) =>
            request.kind === "execute" &&
            request.operation.kind === "ink" &&
            request.operation.command.edit.kind === "finalize",
        ).length,
    )
    .toBe(before + 1);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeDisabled();
  await page.evaluate("window.releaseHeldSummary()");
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeEnabled();
  await writingAction(page, "Clear practice");
  expect(
    (await latestDocuments(page))[0]?.strokes
      .filter((stroke) => stroke.layer === "tracing")
      .map((stroke) => stroke.pointCount),
  ).toEqual([3, 3]);
  await writingAction(page, "Undo ink");
  await page.evaluate("window.armWritingFault('ahead-summary')");
  await drawStroke(page, [{ x: 350, y: 110 }]);
  await expect
    .poll(
      async () =>
        (await requests(page)).filter(
          (request) => request.kind === "readPracticeControls",
        ).length,
    )
    .toBeGreaterThanOrEqual(4);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeDisabled();
  await drawStroke(page, [{ x: 400, y: 110 }]);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeEnabled();
  await writingAction(page, "Clear practice");
  expect(
    (await latestDocuments(page))[0]?.strokes.filter(
      (stroke) => stroke.layer === "tracing",
    ),
  ).toHaveLength(4);
});

test("known control rejection stays fenced until canonical reload without reexecuting the rejection", async ({
  page,
}) => {
  await prepare(page);
  await drawStroke(page, [{ x: 180, y: 110 }]);
  await drawStroke(page, [{ x: 260, y: 110 }]);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeEnabled();
  await page.evaluate("window.armWritingFault('reject-control')");
  await page.getByRole("button", { name: "Undo ink", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeDisabled();
  const controls = async () =>
    (await requests(page)).filter(
      (request) =>
        request.kind === "execute" &&
        request.operation.kind === "teaching" &&
        request.operation.command.kind === "writingControl",
    ).length;
  expect(await controls()).toBe(1);
  await writingAction(page, "Retry save");
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeEnabled();
  expect(await controls()).toBe(1);
  expect(await childIds(page)).toHaveLength(2);
  await writingAction(page, "Undo ink");
  expect(await controls()).toBe(2);
  expect(await childIds(page)).toHaveLength(1);
});

for (const stale of [
  "down",
  "move",
  "up",
  "cancel",
  "lostpointercapture",
  "coalesced",
]) {
  test(`events from before a fence cannot reuse the mouse contact through stale ${stale}`, async ({
    page,
  }) => {
    await prepare(page);
    const old = await boardPoint(page, 100, 100),
      stray = await boardPoint(page, 900, 100);
    await page.mouse.move(old.x, old.y);
    await page.mouse.down();
    await page.evaluate(({ x, y }) => {
      const event = new PointerEvent("pointermove", {
        bubbles: true,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        button: 0,
        buttons: 1,
        clientX: x,
        clientY: y,
      });
      const events = new Map(
        ["down", "move", "up", "cancel", "lostpointercapture"].map((kind) => [
          kind,
          new PointerEvent(
            kind === "lostpointercapture" ? kind : `pointer${kind}`,
            {
              bubbles: true,
              pointerId: 1,
              pointerType: "mouse",
              isPrimary: true,
              button: 0,
              buttons: 1,
              clientX: x,
              clientY: y,
            },
          ),
        ]),
      );
      events.set("coalesced", event);
      Object.defineProperty(window, "oldInkEvents", {
        configurable: true,
        value: events,
      });
      window.dispatchEvent(new Event("resize"));
    }, stray);
    await page.mouse.up();
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeEnabled();
    if (stale === "down")
      await page.evaluate(
        "document.querySelector('canvas').dispatchEvent(window.oldInkEvents.get('down'))",
      );
    const current = await boardPoint(page, 300, 100);
    await page.mouse.move(current.x, current.y);
    await page.mouse.down();
    if (stale !== "down")
      await page.evaluate((kind) => {
        const value: unknown = Reflect.get(window, "oldInkEvents");
        if (!(value instanceof Map)) throw new Error("Old events missing");
        const event: unknown = value.get(kind);
        if (!(event instanceof PointerEvent))
          throw new Error("Old pointer event missing");
        const canvas = document.querySelector("canvas");
        if (!canvas) throw new Error("Canvas missing");
        if (kind === "coalesced") {
          const fresh = new PointerEvent("pointermove", {
            bubbles: true,
            pointerId: 1,
            pointerType: "mouse",
            isPrimary: true,
            buttons: 1,
          });
          Object.defineProperty(fresh, "getCoalescedEvents", {
            value: () => [event],
          });
          canvas.dispatchEvent(fresh);
        } else canvas.dispatchEvent(event);
      }, stale);
    const end = await boardPoint(page, 350, 120);
    await page.mouse.move(end.x, end.y);
    await page.mouse.up();
    await expect(
      page.getByRole("button", { name: "Undo ink", exact: true }),
    ).toBeEnabled();
    await reloadSavedTurn({ page, turnId: "fixture.graph.l01.t06.m-tracing" });
    await atWritableWriting(page, "m-tracing");
    const saved = (await latestDocuments(page))[0];
    if (!saved) throw new Error("Restored document required");
    const child = saved.strokes.filter((stroke) => stroke.layer === "tracing");
    expect(
      child.map((stroke) => ({
        status: stroke.status,
        points: stroke.pointCount,
      })),
    ).toEqual([
      { status: "interrupted", points: 1 },
      { status: "finished", points: 3 },
    ]);
    const points = child[1]?.chunks.flatMap((chunk) =>
      decodeInkPoints({
        payload: Uint8Array.from(chunk.payload),
        pointCount: chunk.pointCount,
        bounds: saved.bounds,
      }),
    );
    expect(points?.map((point) => Math.round(point.x))).toEqual([
      300, 350, 350,
    ]);
  });
}

test("events created while a control input fence is closed cannot start after reopening", async ({
  page,
}) => {
  await prepare(page);
  await drawStroke(page, [{ x: 180, y: 110 }]);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeEnabled();
  await page.evaluate("window.armWritingFault('hold-teaching')");
  await page.getByRole("button", { name: "Undo ink", exact: true }).click();
  await expect
    .poll(() => page.evaluate("window.hasHeldTeachingWrite()"))
    .toBe(true);
  const stray = await boardPoint(page, 900, 100);
  await page.evaluate(
    ({ x, y }) =>
      Object.defineProperty(window, "closedInkDown", {
        configurable: true,
        value: new PointerEvent("pointerdown", {
          bubbles: true,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true,
          button: 0,
          buttons: 1,
          clientX: x,
          clientY: y,
        }),
      }),
    stray,
  );
  await page.evaluate("window.releaseHeldTeachingWrite()");
  await expect(
    page.getByRole("button", { name: "Redo ink", exact: true }),
  ).toBeEnabled();
  await page.evaluate(
    "document.querySelector('canvas').dispatchEvent(window.closedInkDown)",
  );
  await drawStroke(page, [
    { x: 400, y: 100 },
    { x: 450, y: 120 },
  ]);
  await expect(
    page.getByRole("button", { name: "Undo ink", exact: true }),
  ).toBeEnabled();
  await reloadSavedTurn({ page, turnId: "fixture.graph.l01.t06.m-tracing" });
  await atWritableWriting(page, "m-tracing");
  const saved = (await latestDocuments(page))[0];
  if (!saved) throw new Error("Saved document missing");
  const child = saved.strokes.filter((stroke) => stroke.layer === "tracing");
  expect(
    child.map((stroke) => ({
      status: stroke.status,
      points: stroke.pointCount,
    })),
  ).toEqual([{ status: "finished", points: 3 }]);
  expect(
    child[0]?.chunks
      .flatMap((chunk) =>
        decodeInkPoints({
          payload: Uint8Array.from(chunk.payload),
          pointCount: chunk.pointCount,
          bounds: saved.bounds,
        }),
      )
      .map((point) => Math.round(point.x)),
  ).toEqual([400, 450, 450]);
});
