import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, test } from "@playwright/test";
import type { BrowserContext, Locator, Page, TestInfo } from "@playwright/test";
import { build } from "vite";
import {
  canonical,
  decodeInkPoints,
  parseCounter,
  parsePreparationAvailability,
  parsePreparationPackage,
} from "@readatthree/teaching";
import type {
  CurrentApplicationRead,
  CurrentResult,
  HistoricalWork,
  InkSnapshot,
  ProfileDirectory,
} from "@readatthree/teaching";
import {
  parseRequest,
  parseResponse,
  parseWorkerRequestId,
} from "../../apps/web/src/platform/protocol.ts";
import type {
  WorkerRequest,
  WorkerResponse,
} from "../../apps/web/src/platform/protocol.ts";
import {
  constructedPreferenceStrings,
  parseClosedPreferenceResult,
} from "../fixtures/closed-profile-preferences.ts";
import type { ClosedPreferenceJob } from "../fixtures/closed-profile-preferences.ts";
import { preserveSqliteFiles } from "../../tools/sqlite/preserve-files.ts";
import {
  completeInitialSetup,
  installInitialSetupObservation,
} from "./parent-setup.ts";
import { boardPoint, drawStroke } from "./writing-helpers.ts";

declare global {
  interface Window {
    profileLifecycleTraffic: () => WorkerTraffic;
  }
}

type Ready = Extract<CurrentApplicationRead["application"], { kind: "ready" }>;
type Child = ProfileDirectory["profiles"][number];
type WorkerTraffic = Readonly<{
  requests: readonly WorkerRequest[];
  responses: readonly WorkerResponse[];
}>;
type ProfileLifecycleObservation = WorkerTraffic &
  Readonly<{
    directory: ProfileDirectory;
    application: CurrentApplicationRead & { application: Ready };
    savedWork: readonly CurrentResult<HistoricalWork>[];
  }>;
type Portrait = Readonly<{ avatar: string; src: string; decoded: boolean }>;
const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");

async function installObservation(page: Page) {
  await installInitialSetupObservation(page);
  await page.addInitScript(`
    (() => {
      const NativeWorker = window.Worker;
      const requests = [], responses = [], browserEvents = [], gates = [];
      let worker;
      window.profileLifecycleTraffic = () => structuredClone({ requests, responses });
      window.profileLifecycleBrowserEvents = () => structuredClone(browserEvents);
      window.profileLifecycleGates = () => structuredClone(gates);
      let gateVisible = false;
      new MutationObserver(() => {
        const visible = document.querySelector('#parent-word') !== null;
        if (visible && !gateVisible) gates.push({ pathname: location.pathname, requestIds: requests.map(value => value.id), responseIds: responses.map(value => value.id) });
        gateVisible = visible;
      }).observe(document, { childList: true, subtree: true });
      window.profileLifecycleRequest = value => new Promise((resolve, reject) => {
        if (!worker) return reject(Error('The actual application Worker is unavailable.'));
        const timer = setTimeout(() => { worker.removeEventListener('message', listener); reject(Error('Actual Worker observation timed out.')); }, 15000);
        const listener = event => {
          if (event.data?.id !== value.id) return;
          clearTimeout(timer); worker.removeEventListener('message', listener); resolve(event.data);
        };
        worker.addEventListener('message', listener);
        worker.postMessage(value);
      });
      window.Worker = class extends NativeWorker {
        constructor(url, options) {
          super(url, options); worker = this;
          this.addEventListener('message', event => responses.push(structuredClone(event.data)));
        }
        postMessage(value, options) {
          requests.push(structuredClone(value));
          super.postMessage(value, options);
        }
      };
      for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture', 'focusin', 'focusout', 'click']) {
        document.addEventListener(type, event => {
          if (!(event.target instanceof Element)) return;
          if (event.target.matches('canvas,.teaching-cue,#parent-profiles') || event.target.closest('#parent-profiles'))
            browserEvents.push({ type, target: event.target.tagName, id: event.target.id, at: event.timeStamp, pathname: location.pathname, trusted: event.isTrusted });
        }, true);
      }
    })();
  `);
}

async function traffic(page: Page): Promise<WorkerTraffic> {
  const raw: unknown = await page.evaluate("window.profileLifecycleTraffic()");
  if (
    !raw ||
    typeof raw !== "object" ||
    !("requests" in raw) ||
    !Array.isArray(raw.requests) ||
    !("responses" in raw) ||
    !Array.isArray(raw.responses)
  )
    throw new Error("Complete actual Worker traffic is required.");
  return {
    requests: raw.requests.map(parseRequest),
    responses: raw.responses.map(parseResponse),
  };
}

async function readRequest(
  page: Page,
  value: Extract<
    WorkerRequest,
    { kind: "readDirectory" | "read" | "readWork" | "readInk" }
  >,
) {
  const result: unknown = await page.evaluate((value) => {
    const send: unknown = Reflect.get(window, "profileLifecycleRequest");
    if (typeof send !== "function")
      throw new Error("The actual Worker read channel is unavailable.");
    return send(value);
  }, value);
  return parseResponse(result);
}

async function directory(page: Page): Promise<ProfileDirectory> {
  const result = await readRequest(page, {
    id: parseWorkerRequestId(randomUUID()),
    kind: "readDirectory",
  });
  if (result.kind !== "directory")
    throw new Error("The actual profile directory is required.");
  return result.value;
}

async function observe(page: Page): Promise<ProfileLifecycleObservation> {
  const current = await directory(page);
  const result = await readRequest(page, {
    id: parseWorkerRequestId(randomUUID()),
    kind: "read",
    input: { selection: current.selection, target: { kind: "cursor" } },
  });
  if (
    result.kind !== "application" ||
    result.value.application.kind !== "ready"
  )
    throw new Error("The actual ready application is required.");
  expect(result.value.directory).toEqual(current);
  const savedWork: CurrentResult<HistoricalWork>[] = [];
  for (const saved of result.value.application.course.lessons.flatMap(
    (lesson) => lesson.tasks.flatMap((task) => task.history),
  )) {
    const work = await readRequest(page, {
      id: parseWorkerRequestId(randomUUID()),
      kind: "readWork",
      input: { selection: current.selection, runId: saved.runId },
    });
    if (work.kind !== "work")
      throw new Error("Actual complete saved work is required.");
    expect(work.value.selection).toEqual(current.selection);
    savedWork.push(work.value);
  }
  return {
    ...(await traffic(page)),
    directory: current,
    application: {
      directory: result.value.directory,
      application: result.value.application,
    },
    savedWork,
  };
}

async function attach(testInfo: TestInfo, name: string, evidence: unknown) {
  await testInfo.attach(name, {
    body: JSON.stringify(evidence, null, 2),
    contentType: "application/json",
  });
}

async function setup(page: Page, url = "/") {
  await installObservation(page);
  await page.goto(url);
  await completeInitialSetup({ page });
  const current = await directory(page);
  expect(current.initialSetup.kind).toBe("complete");
  return current.profiles[0];
}

async function grantParents(page: Page, initial = false) {
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Type the word", { exact: true }).fill("meadow");
  await page
    .getByRole("button", {
      name: initial ? "Continue setup" : "Continue to parent settings",
      exact: true,
    })
    .click();
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
}

async function openProfiles(page: Page) {
  const button = page.getByRole("button", {
    name: "Choose child profile",
    exact: true,
  });
  await button.click();
  await grantParents(page);
  await expect(
    page.getByRole("heading", { name: "Who is reading today?", exact: true }),
  ).toBeVisible();
}

function row(page: Page, child: Child) {
  return page.locator(`[data-profile-id="${child.edit.owner.profileId}"]`);
}

async function chooseAnimal(page: Page, name: string) {
  const radio = page.getByRole("radio", { name, exact: true });
  await page.locator(".parent-animal-card").filter({ has: radio }).click();
  await expect(radio).toBeChecked();
}

async function createChild(page: Page, name: string, animal: string) {
  await page.getByRole("button", { name: "Add child", exact: true }).click();
  await page.getByLabel("Name (optional)", { exact: true }).fill(name);
  await chooseAnimal(page, animal);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".course-map")).toBeVisible();
  const current = await directory(page);
  const child = current.profiles.find(
    (child) => child.edit.owner.profileId === current.selection.owner.profileId,
  );
  if (!child) throw new Error("The actual selected child is required.");
  expect(child.preferences).toEqual({
    version: 1,
    displayName: name,
    avatarId: animal.toLowerCase(),
  });
  return child;
}

async function selectChild(page: Page, child: Child) {
  await row(page, child)
    .getByRole("button", { name: "Read together", exact: true })
    .click();
  await expect(page.locator(".course-map")).toBeVisible();
  expect((await directory(page)).selection.owner).toEqual(child.edit.owner);
}

async function portrait(locator: Locator): Promise<Portrait> {
  await expect(locator).toBeVisible();
  return locator.evaluate((element) => {
    if (!(element instanceof HTMLImageElement) || !element.dataset.avatar)
      throw new Error("The actual bundled animal image is required.");
    return {
      avatar: element.dataset.avatar,
      src: element.currentSrc || element.src,
      decoded: element.complete && element.naturalWidth > 0,
    };
  });
}

async function startTask(page: Page, task: 1 | 6) {
  await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
  await page
    .getByRole("button", { name: `Start Task ${task}`, exact: true })
    .click();
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
}

async function writingTurn(page: Page, suffix: string) {
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    `fixture.graph.l01.t06.${suffix}`,
  );
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("canvas")).toHaveAttribute("data-writable", "true");
}

async function action(page: Page, name: string) {
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
}

function mutations(requests: readonly WorkerRequest[]) {
  return requests.filter(
    (value) =>
      value.kind === "administer" ||
      value.kind === "execute" ||
      value.kind === "recoverInk" ||
      value.kind === "recoverTeaching" ||
      value.kind === "recoverAdministration",
  );
}

async function committedFinalizes(page: Page, expected: number) {
  await expect
    .poll(async () => {
      const observed = await traffic(page);
      return observed.requests.filter(
        (request) =>
          request.kind === "execute" &&
          request.operation.kind === "ink" &&
          request.operation.command.edit.kind === "finalize" &&
          observed.responses.some(
            (response) =>
              response.id === request.id &&
              response.kind === "execution" &&
              response.value.kind === "ink" &&
              response.value.result.kind === "inkCommitted" &&
              response.value.result.commandId ===
                request.operation.command.commandId,
          ),
      ).length;
    })
    .toBe(expected);
}

test("selected child, names and actual bundled portraits survive a full Chromium process restart", async ({
  baseURL,
}, testInfo) => {
  if (!baseURL) throw new Error("The test origin is required.");
  const userData = await mkdtemp(join(tmpdir(), "profile-lifecycle-restart-"));
  let context = await chromium.launchPersistentContext(userData, {
    headless: true,
    viewport: { width: 1280, height: 800 },
  });
  try {
    let page = await context.newPage();
    const a = await setup(page, baseURL);
    await openProfiles(page);
    await row(page, a)
      .getByRole("button", { name: "Change name", exact: true })
      .click();
    await page.getByLabel("Name (optional)", { exact: true }).fill("Robin");
    await action(page, "Save name");
    await row(page, a)
      .getByRole("button", { name: "Change animal", exact: true })
      .click();
    await chooseAnimal(page, "Fox");
    await action(page, "Continue");
    const aListPortrait = await portrait(row(page, a).locator("img"));
    await row(page, a)
      .getByRole("button", { name: "Return to reading", exact: true })
      .click();
    await expect(page.locator(".course-map")).toBeVisible();
    const aPortrait = await portrait(
      page.locator(".parent-profile-button img"),
    );
    expect(aPortrait).toEqual(aListPortrait);
    expect(aPortrait).toEqual({
      avatar: "fox",
      src: aPortrait.src,
      decoded: true,
    });
    await openProfiles(page);
    const b = await createChild(page, "Juniper", "Owl");
    await openProfiles(page);
    await selectChild(page, a);
    await openProfiles(page);
    await selectChild(page, b);
    const header = await portrait(page.locator(".parent-profile-button img"));
    await openProfiles(page);
    const list = [
      await portrait(row(page, a).locator("img")),
      await portrait(row(page, b).locator("img")),
    ];
    expect(list).toEqual([aPortrait, header]);
    expect(header.avatar).toBe("owl");
    expect(header.decoded).toBe(true);
    const before = await observe(page);
    expect(before.directory.selection.owner).toEqual(b.edit.owner);
    expect(before.directory.profiles.map((child) => child.preferences)).toEqual(
      expect.arrayContaining([
        { version: 1, displayName: "Robin", avatarId: "fox" },
        { version: 1, displayName: "Juniper", avatarId: "owl" },
      ]),
    );
    await attach(testInfo, "before-graceful-process-close", {
      before,
      header,
      list,
    });
    await context.close();
    context = await chromium.launchPersistentContext(userData, {
      headless: true,
      viewport: { width: 1280, height: 800 },
    });
    page = await context.newPage();
    await installObservation(page);
    await page.goto(baseURL);
    await expect(page.locator(".course-map")).toBeVisible();
    const reopened = await observe(page);
    expect(reopened.directory).toEqual(before.directory);
    expect(reopened.application).toEqual(before.application);
    expect(await portrait(page.locator(".parent-profile-button img"))).toEqual(
      header,
    );
    await openProfiles(page);
    expect([
      await portrait(row(page, a).locator("img")),
      await portrait(row(page, b).locator("img")),
    ]).toEqual(list);
    const inspected = await observe(page);
    expect(inspected.directory).toEqual(before.directory);
    expect(mutations(inspected.requests)).toEqual([]);
    await attach(testInfo, "after-graceful-process-restart", {
      reopened,
      inspected,
      header,
      list,
    });
  } finally {
    await context.close();
    await rm(userData, { recursive: true, force: true });
  }
});

async function currentInk(page: Page, observed: ProfileLifecycleObservation) {
  const projection = observed.application.application.projection;
  if (projection.kind !== "writing" && projection.kind !== "writingResult")
    throw new Error("The actual writing documents are required.");
  const snapshots: InkSnapshot[] = [];
  for (const token of projection.documents) {
    const response = await readRequest(page, {
      id: parseWorkerRequestId(randomUUID()),
      kind: "readInk",
      input: { selection: observed.directory.selection, token },
    });
    if (response.kind !== "inkSnapshot")
      throw new Error("The actual ink snapshot is required.");
    expect(response.value.selection).toEqual(observed.directory.selection);
    expect(response.value.value.token.profileId).toBe(
      observed.directory.selection.owner.profileId,
    );
    expect(response.value.value.token.generation).toBe(
      observed.directory.selection.owner.generation,
    );
    snapshots.push(response.value.value);
  }
  return snapshots;
}

function firstInk(snapshots: readonly InkSnapshot[]) {
  const snapshot = snapshots.find((snapshot) => snapshot.boardY === 0);
  if (!snapshot)
    throw new Error("The actual first writing target is required.");
  return snapshot;
}

function assertStroke({
  snapshot,
  layer,
  geometry,
  status,
  requests,
}: {
  snapshot: InkSnapshot;
  layer: "model" | "tracing";
  geometry: readonly Readonly<{ x: number; y: number }>[];
  status: "finished" | "interrupted";
  requests: readonly WorkerRequest[];
}) {
  const strokes = snapshot.strokes.filter((stroke) => stroke.layer === layer);
  expect(strokes).toHaveLength(1);
  const stroke = strokes[0];
  if (!stroke) throw new Error("The concrete saved stroke is required.");
  expect(stroke.status).toBe(status);
  expect(stroke.pointCount).toBe(geometry.length);
  const points = stroke.chunks.flatMap((chunk) =>
    decodeInkPoints({
      payload: Uint8Array.from(chunk.payload),
      pointCount: chunk.pointCount,
      bounds: snapshot.bounds,
    }),
  );
  expect(points).toHaveLength(geometry.length);
  points.forEach((point, index) => {
    const expected = geometry[index];
    if (!expected) throw new Error("The concrete expected point is required.");
    expect(point.x).toBeCloseTo(expected.x, 3);
    expect(point.y).toBeCloseTo(expected.y, 3);
    expect(point.pressure).toBe(1);
  });
  const actualCommands = requests.flatMap((request) =>
    request.kind === "execute" &&
    request.operation.kind === "ink" &&
    request.operation.command.edit.strokeId === stroke.strokeId
      ? [request.operation]
      : [],
  );
  expect(
    actualCommands.map((operation) => operation.command.edit.kind),
  ).toEqual(expect.arrayContaining(["begin", "finalize"]));
  for (const operation of actualCommands) {
    expect(operation.selection.owner).toEqual({
      profileId: snapshot.token.profileId,
      generation: snapshot.token.generation,
    });
    expect(operation.command.token.profileId).toBe(snapshot.token.profileId);
    expect(operation.command.token.runId).toBe(snapshot.token.runId);
    expect(operation.command.token.documentId).toBe(snapshot.token.documentId);
  }
  expect(stroke.chunks).toEqual(
    actualCommands.flatMap((operation) => operation.command.edit.chunks),
  );
  return { stroke, points, actualCommands };
}

test("a held native contact stays with child A across A to B to A, and live Undo retains both children's ink", async ({
  page,
}, testInfo) => {
  const a = await setup(page);
  await openProfiles(page);
  const b = await createChild(page, "Second", "Turtle");
  await openProfiles(page);
  await selectChild(page, a);
  await startTask(page, 6);
  await action(page, "Continue");
  await writingTurn(page, "m-model");
  await drawStroke(page, [
    { x: 100, y: 100 },
    { x: 130, y: 120 },
  ]);
  await committedFinalizes(page, 1);
  await action(page, "Continue");
  await writingTurn(page, "m-tracing");
  const aBeforeContact = await observe(page);
  const aProjection = aBeforeContact.application.application.projection;
  if (aProjection.kind !== "writing")
    throw new Error("A's actual tracing run is required.");
  const start = await boardPoint(page, 210, 110),
    next = await boardPoint(page, 240, 140),
    stray = await boardPoint(page, 900, 100);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(next.x, next.y);
  const held: unknown = await page.evaluate(({ x, y }) => {
    const values = new Map<string, PointerEvent>();
    for (const type of ["pointermove", "pointerup", "coalesced"])
      values.set(
        type,
        new PointerEvent(type === "coalesced" ? "pointermove" : type, {
          bubbles: true,
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true,
          button: 0,
          buttons: type === "pointerup" ? 0 : 1,
          clientX: x,
          clientY: y,
        }),
      );
    Object.defineProperty(window, "heldProfileEvents", { value: values });
    return [...values].map(([kind, event]) => ({
      kind,
      type: event.type,
      at: event.timeStamp,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }));
  }, stray);
  await page
    .getByRole("button", { name: "Choose child profile", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  await committedFinalizes(page, 2);
  const aAtGate = await observe(page);
  const gatedProjection = aAtGate.application.application.projection;
  if (gatedProjection.kind !== "writing")
    throw new Error("A's preserved paused tracing projection is required.");
  expect(gatedProjection.sessionStatus).toBe("paused");
  expect(gatedProjection.turn.id).toBe("fixture.graph.l01.t06.m-tracing");
  expect(gatedProjection.runId).toBe(aProjection.runId);
  const departure = aAtGate.requests.filter(
    (request) =>
      request.kind === "execute" &&
      request.operation.kind === "teaching" &&
      request.operation.command.kind === "writingNavigate" &&
      request.operation.command.payload.action.kind === "pause",
  );
  expect(departure).toHaveLength(1);
  const pause = departure[0];
  if (!pause) throw new Error("The actual settled Pause command is required.");
  const finalized = aAtGate.requests.filter(
    (request) =>
      request.kind === "execute" &&
      request.operation.kind === "ink" &&
      request.operation.command.edit.kind === "finalize",
  );
  const final = finalized[1];
  if (!final)
    throw new Error("A's actual interrupted finalization is required.");
  expect(aAtGate.requests.indexOf(final)).toBeLessThan(
    aAtGate.requests.indexOf(pause),
  );
  const gateAfterBothReceipts = await page.evaluate(
    (ids) => {
      const gates: unknown = Reflect.get(window, "profileLifecycleGates");
      if (typeof gates !== "function")
        throw new Error("Actual gate ordering is required.");
      const recorded: unknown = gates();
      if (!Array.isArray(recorded))
        throw new Error("Actual gate records are required.");
      const gate: unknown = recorded.at(-1);
      if (
        !gate ||
        typeof gate !== "object" ||
        !("responseIds" in gate) ||
        !Array.isArray(gate.responseIds)
      )
        throw new Error("The actual gate response identities are required.");
      const responseIds = gate.responseIds;
      return ids.every((id) => responseIds.includes(id));
    },
    [final.id, pause.id],
  );
  expect(gateAfterBothReceipts).toBe(true);
  const aPausedInk = firstInk(await currentInk(page, aAtGate));
  const interrupted = assertStroke({
    snapshot: aPausedInk,
    layer: "tracing",
    geometry: [
      { x: 210, y: 110 },
      { x: 240, y: 140 },
    ],
    status: "interrupted",
    requests: aAtGate.requests,
  });
  await attach(testInfo, "A-held-contact-departure", {
    held,
    aBeforeContact,
    aAtGate,
    aPausedInk,
    interrupted,
    gateAfterBothReceipts,
    browserEvents: await page.evaluate(
      "window.profileLifecycleBrowserEvents()",
    ),
    gates: await page.evaluate("window.profileLifecycleGates()"),
  });
  await page.mouse.up();
  await grantParents(page);
  await selectChild(page, b);
  await startTask(page, 6);
  await action(page, "Continue");
  await writingTurn(page, "m-model");
  const bStart = await boardPoint(page, 310, 100),
    bEnd = await boardPoint(page, 350, 130);
  await page.mouse.move(bStart.x, bStart.y);
  await page.mouse.down();
  await page.evaluate(() => {
    const values: unknown = Reflect.get(window, "heldProfileEvents");
    const canvas = document.querySelector("canvas");
    if (!(values instanceof Map) || !canvas)
      throw new Error("The retained A events and live B canvas are required.");
    for (const type of ["pointermove", "pointerup", "coalesced"]) {
      const event: unknown = values.get(type);
      if (!(event instanceof PointerEvent))
        throw new Error("A's native event object is required.");
      if (type === "coalesced") {
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
    }
  });
  await page.mouse.move(bEnd.x, bEnd.y);
  await page.mouse.up();
  await committedFinalizes(page, 3);
  const bFinished = await observe(page);
  const bInk = firstInk(await currentInk(page, bFinished));
  const bStroke = assertStroke({
    snapshot: bInk,
    layer: "model",
    geometry: [
      { x: 310, y: 100 },
      { x: 350, y: 130 },
      { x: 350, y: 130 },
    ],
    status: "finished",
    requests: bFinished.requests,
  });
  expect(bInk.strokes.filter((stroke) => stroke.layer !== "model")).toEqual([]);
  await openProfiles(page);
  const bPaused = await observe(page);
  const bPausedInk = await currentInk(page, bPaused);
  await selectChild(page, a);
  await page
    .getByRole("button", { name: "Resume · Lesson 1 · Task 6", exact: true })
    .click();
  await writingTurn(page, "m-tracing");
  const aResumed = await observe(page);
  expect(aResumed.directory.selection).toEqual({
    ...aAtGate.directory.selection,
    revision: parseCounter(
      (BigInt(aAtGate.directory.selection.revision) + 2n).toString(),
    ),
  });
  const resumedProjection = aResumed.application.application.projection;
  if (resumedProjection.kind !== "writing")
    throw new Error("A's resumed tracing projection is required.");
  expect(resumedProjection.runId).toBe(aProjection.runId);
  const aResumedInk = firstInk(await currentInk(page, aResumed));
  expect(aResumedInk.strokes).toEqual(aPausedInk.strokes);
  await action(page, "Undo advance");
  await writingTurn(page, "m-model");
  const aUndone = await observe(page);
  const undoneProjection = aUndone.application.application.projection;
  if (undoneProjection.kind !== "writing")
    throw new Error("A's actual undone model projection is required.");
  expect(undoneProjection.runId).toBe(aProjection.runId);
  expect(aUndone.directory.selection).toEqual(aResumed.directory.selection);
  const aUndoneInk = firstInk(await currentInk(page, aUndone));
  expect(aUndoneInk.strokes).toEqual(aPausedInk.strokes);
  expect(aUndoneInk.token).toEqual({
    ...aResumedInk.token,
    phase: "parentDemonstration",
    revision: parseCounter(
      (BigInt(aResumedInk.token.revision) + 1n).toString(),
    ),
    inputEpoch: parseCounter(
      (BigInt(aResumedInk.token.inputEpoch) + 1n).toString(),
    ),
  });
  expect(aUndone.savedWork.map((work) => work.value.documents)).toEqual(
    aResumed.savedWork.map((work) => work.value.documents),
  );
  await openProfiles(page);
  await selectChild(page, b);
  const bAfterUndo = await observe(page);
  const expectedBSelection = {
    ...bPaused.directory.selection,
    revision: parseCounter(
      (BigInt(bPaused.directory.selection.revision) + 2n).toString(),
    ),
  };
  expect(bAfterUndo.directory.selection).toEqual(expectedBSelection);
  expect(bAfterUndo.savedWork).toEqual(
    bPaused.savedWork.map((work) => ({
      ...work,
      selection: expectedBSelection,
    })),
  );
  const bAfterUndoInk = await currentInk(page, bAfterUndo);
  expect(bAfterUndoInk).toEqual(bPausedInk);
  await attach(testInfo, "cross-child-native-events-and-live-Undo", {
    bFinished,
    bInk,
    bStroke,
    bPaused,
    bPausedInk,
    aResumed,
    aResumedInk,
    aUndone,
    aUndoneInk,
    bAfterUndo,
    bAfterUndoInk,
    browserEvents: await page.evaluate(
      "window.profileLifecycleBrowserEvents()",
    ),
  });
});

type FixtureBundle = Readonly<{
  javascript: string;
  wasm: Buffer;
  wasmPaths: readonly string[];
  hashes: Readonly<{
    sqliteModule: string;
    wasm: string;
    compiledWorker: string;
  }>;
}>;
let fixtureBundle: Promise<FixtureBundle> | undefined;

async function closedFixtureBundle(): Promise<FixtureBundle> {
  const require = createRequire(import.meta.url);
  const root = dirname(require.resolve("@sqlite.org/sqlite-wasm/package.json"));
  const moduleBytes = await readFile(join(root, "dist/index.mjs"));
  const wasm = await readFile(join(root, "dist/sqlite3.wasm"));
  const entry = fileURLToPath(
    new URL("../fixtures/closed-profile-preferences.ts", import.meta.url),
  );
  const entryId = "virtual:closed-profile-preferences-worker";
  const built = await build({
    configFile: false,
    base: "./",
    logLevel: "error",
    plugins: [
      preserveSqliteFiles(),
      {
        name: "closed-profile-preferences-test-entry",
        resolveId: (id) => (id === entryId ? `\0${entryId}` : undefined),
        load: (id) =>
          id === `\0${entryId}`
            ? `import { runClosedPreferenceFixture } from ${JSON.stringify(entry)}; self.addEventListener('message', async event => { try { self.postMessage({kind:'closedPreferenceResult', value: await runClosedPreferenceFixture(event.data)}); } catch(error) { self.postMessage({kind:'closedPreferenceFailure', message: error instanceof Error ? error.message : String(error)}); } });`
            : undefined,
      },
    ],
    build: {
      write: false,
      minify: false,
      assetsInlineLimit: 0,
      rollupOptions: {
        input: entryId,
        output: {
          format: "es",
          entryFileNames: "closed-preferences.js",
          assetFileNames: "[name][extname]",
          codeSplitting: false,
        },
      },
    },
  });
  if (Array.isArray(built) || !("output" in built))
    throw new Error("One in-memory fixture Worker bundle is required.");
  const chunks = built.output.filter((output) => output.type === "chunk");
  if (chunks.length !== 1 || chunks[0]?.type !== "chunk")
    throw new Error("One self-contained test-only fixture Worker is required.");
  const javascript = chunks[0].code;
  const wasmPaths = built.output.flatMap((output) => {
    if (output.type !== "asset" || !output.fileName.endsWith(".wasm"))
      return [];
    const bytes = Buffer.from(output.source);
    if (!bytes.equals(wasm))
      throw new Error(
        "Every served WASM alias must equal the installed pinned artifact.",
      );
    return [`/__profile-fixture/${output.fileName}`];
  });
  if (wasmPaths.length < 1)
    throw new Error(
      "The in-memory bundle must declare its actual SQLite WASM resource.",
    );
  return {
    javascript,
    wasm,
    wasmPaths,
    hashes: {
      sqliteModule: createHash("sha256").update(moduleBytes).digest("hex"),
      wasm: createHash("sha256").update(wasm).digest("hex"),
      compiledWorker: await hash(javascript),
    },
  };
}

async function runClosedFixture(
  context: BrowserContext,
  baseURL: string,
  job: ClosedPreferenceJob,
  testInfo: TestInfo,
) {
  fixtureBundle ??= closedFixtureBundle();
  const bundle = await fixtureBundle;
  expect(bundle.hashes.sqliteModule).toBe(
    "a6d3fe46aa3f924e7686329f97b0564549ef1f787e0c19924179aef7f72bcc01",
  );
  expect(bundle.hashes.wasm).toBe(
    "2ee8f3dab694532afc8840e07703127287662d08b74e6ff50491ce63f00d5752",
  );
  const fixture = await context.newPage();
  await fixture.route("**/__profile-fixture/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/__profile-fixture/empty")
      return route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Closed profile fixture</title>",
      });
    if (path === "/__profile-fixture/closed-preferences.js")
      return route.fulfill({
        contentType: "text/javascript",
        body: bundle.javascript,
      });
    if (bundle.wasmPaths.includes(path))
      return route.fulfill({
        contentType: "application/wasm",
        body: bundle.wasm,
      });
    throw new Error(`Unexpected fixture resource ${path}.`);
  });
  try {
    await fixture.goto(`${baseURL}/__profile-fixture/empty`);
    const raw: unknown = await fixture.evaluate(async (job) => {
      const worker = new Worker("/__profile-fixture/closed-preferences.js", {
        type: "module",
      });
      try {
        return await new Promise<unknown>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("Closed-store fixture timed out.")),
            15000,
          );
          worker.addEventListener("error", (event) => {
            clearTimeout(timer);
            reject(new Error(event.message));
          });
          worker.addEventListener(
            "message",
            (event) => {
              clearTimeout(timer);
              resolve(event.data);
            },
            { once: true },
          );
          worker.postMessage(job);
        });
      } finally {
        worker.terminate();
      }
    }, job);
    if (
      !raw ||
      typeof raw !== "object" ||
      !("kind" in raw) ||
      raw.kind !== "closedPreferenceResult" ||
      !("value" in raw)
    )
      throw new Error(`Closed-store fixture failed: ${JSON.stringify(raw)}`);
    const result = parseClosedPreferenceResult(raw.value);
    const locks = await fixture.evaluate(
      async () => (await navigator.locks.query()).held ?? [],
    );
    expect(
      locks.filter((lock) => lock.name === "read-at-three.sqlite.v1"),
    ).toEqual([]);
    await attach(testInfo, `${job.kind}-closed-store-fixture`, {
      result,
      bundleHashes: bundle.hashes,
      locksAfterWorkerTermination: locks,
    });
    return result;
  } finally {
    await fixture.close();
  }
}

test("constructed missing and unknown saved animal keys display Rabbit without rewriting either preference string", async ({
  context,
  page,
  baseURL,
}, testInfo) => {
  if (!baseURL) throw new Error("The test origin is required.");
  const a = await setup(page);
  await openProfiles(page);
  const b = await createChild(page, "Second", "Bear");
  await openProfiles(page);
  await selectChild(page, a);
  const created = await observe(page);
  await page.close();
  const profileIds: ClosedPreferenceJob["profileIds"] = [
    a.edit.owner.profileId,
    b.edit.owner.profileId,
  ];
  const seeded = await runClosedFixture(
    context,
    baseURL,
    { kind: "seedFallbackPreferences", profileIds },
    testInfo,
  );
  expect(seeded.kind).toBe("seedFallbackPreferences");
  expect(seeded.sqliteVersion).toBe("3.53.4");
  expect(seeded.after.map((row) => row.preferences)).toEqual(
    constructedPreferenceStrings,
  );
  expect(seeded.before.map((row) => row.preferences)).toEqual(
    profileIds.map((profileId) => {
      const child = created.directory.profiles.find(
        (child) => child.edit.owner.profileId === profileId,
      );
      if (!child)
        throw new Error("The created child's exact preferences are required.");
      return canonical(child.preferences);
    }),
  );
  const inspectedBefore = await runClosedFixture(
    context,
    baseURL,
    { kind: "inspectPreferences", profileIds },
    testInfo,
  );
  expect(inspectedBefore.before).toEqual(seeded.after);
  expect(inspectedBefore.after).toEqual(seeded.after);
  const reopened = await context.newPage();
  await installObservation(reopened);
  await reopened.goto(baseURL);
  await expect(reopened.locator(".course-map")).toBeVisible();
  const rabbit = await portrait(reopened.locator(".parent-profile-button img"));
  expect(rabbit.avatar).toBe("rabbit");
  expect(rabbit.decoded).toBe(true);
  await openProfiles(reopened);
  expect(await portrait(row(reopened, a).locator("img"))).toEqual(rabbit);
  expect(await portrait(row(reopened, b).locator("img"))).toEqual(rabbit);
  await selectChild(reopened, b);
  expect(
    await portrait(reopened.locator(".parent-profile-button img")),
  ).toEqual(rabbit);
  await openProfiles(reopened);
  await row(reopened, b)
    .getByRole("button", { name: "Change animal", exact: true })
    .click();
  await expect(reopened.getByRole("radio")).toHaveCount(8);
  await expect(
    reopened.getByRole("radio", { name: "Rabbit", exact: true }),
  ).toBeChecked();
  await action(reopened, "Cancel");
  const displayed = await observe(reopened);
  expect(
    displayed.directory.profiles.map((child) => child.preferences),
  ).toEqual(
    expect.arrayContaining(
      constructedPreferenceStrings.map((text) => JSON.parse(text)),
    ),
  );
  expect(
    displayed.requests.flatMap((value) =>
      value.kind === "administer" ? [value.command.payload.kind] : [],
    ),
  ).toEqual(["selectProfile"]);
  expect(mutations(displayed.requests).map((value) => value.kind)).toEqual([
    "administer",
  ]);
  expect(displayed.directory.selection.owner).toEqual(b.edit.owner);
  expect(displayed.directory.selection).toEqual({
    ...created.directory.selection,
    owner: b.edit.owner,
    revision: parseCounter(
      (BigInt(created.directory.selection.revision) + 1n).toString(),
    ),
  });
  await attach(testInfo, "actual-default-display-and-cancel", {
    created,
    displayed,
    rabbit,
    seeded,
    inspectedBefore,
  });
  await reopened.close();
  const inspectedAfter = await runClosedFixture(
    context,
    baseURL,
    { kind: "inspectPreferences", profileIds },
    testInfo,
  );
  expect(inspectedAfter.before).toEqual(seeded.after);
  expect(inspectedAfter.after).toEqual(seeded.after);
});

async function installCueObservation(page: Page) {
  await page.addInitScript(`
    (() => {
      const nativeSetTimeout = window.setTimeout.bind(window);
      const nativeClearTimeout = window.clearTimeout.bind(window);
      let armed = false, retained = null;
      const events = [];
      window.armProfileCue = () => { if(retained) throw Error('Only one actual cue callback is retained.'); armed = true; };
      window.profileCueEvidence = () => structuredClone({ retained: retained ? { id: retained.id, delay: retained.delay, cleared: retained.cleared, fired: retained.fired } : null, events });
      window.invokeRetiredProfileCue = () => {
        if (!retained || !retained.cleared || retained.fired) throw Error('The actual canceled, undelivered cue callback is required.');
        events.push({ kind: 'deliberate-late-callback', at: performance.now(), pathname: location.pathname, stage: document.querySelector('.teaching-cue')?.getAttribute('data-stage') });
        retained.callback(...retained.args);
      };
      window.setTimeout = function(callback, delay, ...args) {
        const cue = document.querySelector('.teaching-cue[data-stage="start"]');
        if (!armed || !cue || typeof callback !== 'function' || !(delay >= 0 && delay <= 250)) return nativeSetTimeout(callback, delay, ...args);
        armed = false;
        const record = { callback, args, delay, id: 0, cleared: false, fired: false };
        record.id = nativeSetTimeout(() => { record.fired = true; events.push({kind:'native-fired', id:record.id, at:performance.now(), pathname:location.pathname}); callback(...args); }, delay);
        retained = record;
        events.push({kind:'scheduled', id:record.id, delay, at:performance.now(), pathname:location.pathname, stage:cue.getAttribute('data-stage')});
        return record.id;
      };
      window.clearTimeout = function(id) {
        if (retained && id === retained.id) {
          retained.cleared = true;
          events.push({kind:'cleared', id, at:performance.now(), pathname:location.pathname, stage:document.querySelector('.teaching-cue')?.getAttribute('data-stage'), activeElement:document.activeElement?.id});
        }
        return nativeClearTimeout(id);
      };
    })();
  `);
}

test("an actually canceled A cue callback cannot affect B, with a real B hold as the positive control", async ({
  page,
}, testInfo) => {
  await installCueObservation(page);
  const a = await setup(page);
  await openProfiles(page);
  const b = await createChild(page, "Second", "Frog");
  await openProfiles(page);
  await selectChild(page, a);
  await startTask(page, 1);
  await expect(
    page.getByText("Synthetic m model.", { exact: true }),
  ).toBeVisible();
  const cue = page.getByRole("button", {
    name: "Hold silent pointing cue",
    exact: true,
  });
  await cue.focus();
  await page.evaluate("window.armProfileCue()");
  await page.keyboard.down("Space");
  await expect(cue).toHaveAttribute("data-stage", "start");
  await page
    .getByRole("button", { name: "Choose child profile", exact: true })
    .focus();
  await page.keyboard.up("Space");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  const canceled: unknown = await page.evaluate("window.profileCueEvidence()");
  expect(canceled).toMatchObject({
    retained: { cleared: true, fired: false },
    events: expect.arrayContaining([
      expect.objectContaining({
        kind: "cleared",
        pathname: "/teaching",
        activeElement: "parent-profiles",
      }),
    ]),
  });
  await grantParents(page);
  await selectChild(page, b);
  await startTask(page, 1);
  await expect(
    page.getByText("Synthetic m model.", { exact: true }),
  ).toBeVisible();
  await expect(cue).toHaveAttribute("data-stage", "idle");
  const before = await observe(page);
  const beforeProjection = before.application.application.projection;
  if (beforeProjection.kind !== "teaching")
    throw new Error("B's actual printed model turn is required.");
  expect(beforeProjection.owner).toEqual(b.edit.owner);
  const intervalStart = before.requests.length;
  await page.evaluate("window.invokeRetiredProfileCue()");
  await expect(cue).toHaveAttribute("data-stage", "idle");
  await expect(cue).toHaveAttribute("aria-pressed", "false");
  const afterLate = await observe(page);
  expect(afterLate.directory).toEqual(before.directory);
  expect(afterLate.application).toEqual(before.application);
  expect(afterLate.savedWork).toEqual(before.savedWork);
  expect(mutations(afterLate.requests.slice(intervalStart))).toEqual([]);
  await cue.focus();
  await page.keyboard.down("Space");
  await expect(cue).toHaveAttribute("data-stage", "start");
  await expect(cue).toHaveAttribute("data-stage", "holding");
  await page.keyboard.up("Space");
  await expect(cue).toHaveAttribute("data-stage", "idle");
  const positive = await observe(page);
  expect(positive.application).toEqual(before.application);
  expect(positive.directory).toEqual(before.directory);
  expect(positive.savedWork).toEqual(before.savedWork);
  expect(mutations(positive.requests.slice(intervalStart))).toEqual([]);
  await attach(testInfo, "actual-cue-cancel-order-and-late-callback", {
    cancellationOrder:
      "Focusing the real profile button blurs A's cue and clears its timer before route departure.",
    canceled,
    before,
    afterLate,
    positive,
    cueEvidence: await page.evaluate("window.profileCueEvidence()"),
    browserEvents: await page.evaluate(
      "window.profileLifecycleBrowserEvents()",
    ),
  });
});

async function constructedPreparation(page: Page) {
  const response = await page.request.get("/preparation/development.json");
  expect(response.status()).toBe(200);
  const raw: unknown = await response.json();
  const original = await parsePreparationAvailability(raw, hash);
  if (
    original.kind !== "available" ||
    original.document.body.provenance.kind !== "synthetic"
  )
    throw new Error("The existing verified synthetic preparation is required.");
  const first = original.document.body.sections[0];
  if (!first)
    throw new Error("The existing synthetic guide section is required.");
  const reference = {
    kind: "reference",
    id: "fixture.lifecycle.task-reference",
    label: {
      copy: { kind: "added", text: "Preview the synthetic first activity" },
      marks: [],
    },
    target: { kind: "lessonTask", lesson: 1, task: 1 },
  };
  const body = {
    ...original.document.body,
    sections: original.document.body.sections.map((section, index) =>
      index === 0
        ? { ...section, blocks: [...section.blocks, reference] }
        : section,
    ),
  };
  const constructed = await parsePreparationPackage(
    {
      formatVersion: original.document.formatVersion,
      preparationHash: await hash(canonical(body)),
      body,
      assets: original.document.assets,
    },
    hash,
  );
  const stripped = {
    ...constructed.body,
    sections: constructed.body.sections.map((section) => ({
      ...section,
      blocks: section.blocks.filter((block) => block.id !== reference.id),
    })),
  };
  expect(stripped).toEqual(original.document.body);
  expect(constructed.body.sections[0]?.blocks.at(-1)).toEqual(reference);
  expect(constructed.preparationHash).not.toBe(
    original.document.preparationHash,
  );
  const served = {
    kind: "available",
    package: {
      formatVersion: constructed.formatVersion,
      preparationHash: constructed.preparationHash,
      body: constructed.body,
      assets: constructed.assets,
    },
  };
  await page.route("**/preparation/development.json", (route) =>
    route.fulfill({ contentType: "application/json", body: canonical(served) }),
  );
  return {
    original: raw,
    originalHash: original.document.preparationHash,
    constructed: served,
    constructedHash: constructed.preparationHash,
  };
}

async function actualOpeningPreparation(page: Page) {
  const observed = await traffic(page);
  const opening = observed.requests.find(
    (value) => value.kind === "openRecovery",
  );
  if (opening?.kind !== "openRecovery")
    throw new Error(
      "The actual application's opening preparation payload is required.",
    );
  return parsePreparationAvailability(opening.preparation, hash);
}

test("verified preparation previews read-only, while fresh missing and malformed guides retain distinct highlighted unavailable states", async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  if (!baseURL) throw new Error("The test origin is required.");
  const fixture = await constructedPreparation(page);
  await installObservation(page);
  await page.goto("/");
  await page.waitForFunction(() =>
    window
      .profileLifecycleTraffic()
      .responses.some(
        (response) =>
          response.kind === "application" &&
          response.value.application.kind === "ready",
      ),
  );
  const preparation = await actualOpeningPreparation(page);
  if (preparation.kind !== "available")
    throw new Error(
      "The app must independently verify the actual served fixture.",
    );
  expect(preparation.document.preparationHash).toBe(fixture.constructedHash);
  await grantParents(page, true);
  await expect(
    page.getByRole("heading", {
      name: "Fixture parent preparation",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator('.preparation-diagram[data-diagram-status="ready"]'),
  ).toHaveCount(1);
  const before = await observe(page);
  expect(before.directory.preparation).toEqual({
    kind: "required",
    requiredHash: fixture.constructedHash,
    acknowledgedHash: null,
  });
  expect(before.application.application.projection.kind).toBe("entry");
  const mutationStart = before.requests.length;
  await page
    .getByRole("button", {
      name: "Preview the synthetic first activity",
      exact: true,
    })
    .click();
  const preview = page.getByRole("region", {
    name: "Read-only task preview",
    exact: true,
  });
  await expect(preview).toBeVisible();
  await expect(
    preview.getByRole("heading", { name: "Synthetic task 1", exact: true }),
  ).toBeVisible();
  const normal = preview.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Teaching sequence",
      exact: true,
    }),
  });
  const correction = preview.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Source correction",
      exact: true,
    }),
  });
  await expect(normal.locator(".preparation-preview-turn")).toHaveCount(6);
  await expect(correction.locator(".preparation-preview-turn")).toHaveCount(2);
  await expect(
    normal.getByText("Synthetic m model.", { exact: true }),
  ).toBeVisible();
  await expect(
    normal.getByText("Synthetic s model.", { exact: true }),
  ).toBeVisible();
  await expect(
    correction.getByText("Synthetic m correction model.", { exact: true }),
  ).toBeVisible();
  await expect(
    correction.getByText("Synthetic s correction model.", { exact: true }),
  ).toBeVisible();
  const glyphs = await preview
    .locator("svg.teaching-glyph")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("aria-label")),
    );
  expect(glyphs).toEqual(["m", "m", "m", "s", "s", "s", "m", "s"]);
  await page
    .getByRole("button", { name: "Return to preparation", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "I have read this preparation",
      exact: true,
    }),
  ).toBeEnabled();
  const after = await observe(page);
  expect(after.directory).toEqual(before.directory);
  expect(after.application).toEqual(before.application);
  expect(after.savedWork).toEqual(before.savedWork);
  expect(mutations(after.requests.slice(mutationStart))).toEqual([]);
  expect(mutations(after.requests)).toEqual([]);
  await attach(testInfo, "constructed-verified-preparation-readonly-preview", {
    fixture,
    preparation,
    before,
    after,
    glyphs,
  });
  const unavailable = [];
  for (const kind of ["missing", "malformed"] satisfies (
    "missing" | "malformed"
  )[]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      baseURL,
    });
    try {
      const fresh = await context.newPage();
      await installObservation(fresh);
      await fresh.route("**/preparation/development.json", (route) =>
        route.fulfill({
          status: kind === "missing" ? 404 : 200,
          contentType: "application/json",
          body: kind === "missing" ? "{}" : '{"kind":"available","package":{}}',
        }),
      );
      await fresh.goto("/");
      await fresh.waitForFunction(() =>
        window
          .profileLifecycleTraffic()
          .responses.some(
            (response) =>
              response.kind === "application" &&
              response.value.application.kind === "ready",
          ),
      );
      const actualPreparation = await actualOpeningPreparation(fresh);
      expect(actualPreparation).toEqual({
        kind: "unavailable",
        reason: kind === "missing" ? "missing" : "invalid",
      });
      const unopened = await observe(fresh);
      await grantParents(fresh, true);
      await expect(
        fresh.getByRole("heading", {
          name: "Preparation is unavailable",
          exact: true,
        }),
      ).toBeVisible();
      const message =
        kind === "missing"
          ? "The preparation guide is not installed. Your saved reading and writing are kept."
          : "The preparation guide could not be verified. Your saved reading and writing are kept.";
      const explanation = fresh.getByText(message, { exact: true });
      await expect(explanation).toBeVisible();
      await expect(explanation).toHaveAttribute("data-origin", "added");
      await expect(
        fresh
          .getByRole("heading", {
            name: "Preparation is unavailable",
            exact: true,
          })
          .locator("[data-origin=added]"),
      ).toBeVisible();
      await expect(
        fresh.getByRole("button", {
          name: "I have read this preparation",
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(
        fresh.getByRole("group", { name: "Choose your animal", exact: true }),
      ).toHaveCount(0);
      const opened = await observe(fresh);
      expect(opened.directory).toEqual(unopened.directory);
      expect(opened.application).toEqual(unopened.application);
      expect(opened.directory.initialSetup.kind).toBe("firstLaunch");
      expect(opened.directory.preparation).toEqual({
        kind: "unavailable",
        acknowledgedHash: null,
      });
      expect(mutations(opened.requests)).toEqual([]);
      unavailable.push({ kind, actualPreparation, unopened, opened, message });
      await attach(testInfo, `fresh-${kind}-preparation`, {
        kind,
        actualPreparation,
        unopened,
        opened,
        message,
      });
    } finally {
      await context.close();
    }
  }
  expect(unavailable.map((outcome) => outcome.kind)).toEqual([
    "missing",
    "malformed",
  ]);
});
