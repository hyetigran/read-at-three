import { createHash, randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { DATABASE_VERSION } from "@readatthree/storage";
import {
  parsePreparationAvailability,
  prepareProfileAdministration,
} from "@readatthree/teaching";
import type { ProfileDirectory } from "@readatthree/teaching";
import {
  parseRequest,
  parseResponse,
  parseWorkerRequestId,
} from "../../apps/web/src/platform/protocol.ts";
import type { WorkerRequest } from "../../apps/web/src/platform/protocol.ts";

declare global {
  interface Window {
    parentUiReplies: readonly import("../../apps/web/src/platform/protocol.ts").WorkerResponse[];
    hasHeldParentAdministration: () => boolean;
    hasHeldParentAdministrationReply: () => boolean;
  }
}

async function request(page: Page, value: WorkerRequest) {
  const result: unknown = await page.evaluate((value) => {
    if (
      !("parentUiRequest" in window) ||
      typeof window.parentUiRequest !== "function"
    )
      throw new Error("Parent UI observation is unavailable.");
    return window.parentUiRequest(value);
  }, value);
  return parseResponse(result);
}

async function directory(page: Page): Promise<ProfileDirectory> {
  const result = await request(page, {
    id: parseWorkerRequestId(randomUUID()),
    kind: "readDirectory",
  });
  if (result.kind !== "directory")
    throw new Error("The actual profile directory is required.");
  return result.value;
}

async function observeParentUi(page: Page) {
  await page.addInitScript(`
    const NativeWorker = window.Worker;
    let holdAdministration = false;
    let heldAdministration = null;
    let holdAdministrationReply = false;
    let heldAdministrationReply = null;
    window.armParentAdministrationReplyHold = () => { holdAdministrationReply = true; };
    window.hasHeldParentAdministrationReply = () => heldAdministrationReply !== null;
    window.loseHeldParentAdministrationReply = () => {
      if (!heldAdministrationReply) throw new Error("No actual administration acknowledgement is held.");
      const { worker } = heldAdministrationReply;
      heldAdministrationReply = null;
      worker.dispatchEvent(new ErrorEvent("error", { message: "Injected transport loss after actual profile COMMIT" }));
    };
    window.armParentAdministrationHold = () => { holdAdministration = true; };
    window.hasHeldParentAdministration = () => heldAdministration !== null;
    window.releaseParentAdministration = () => {
      if (!heldAdministration) throw new Error('No actual administration is held.');
      const { worker, value, options } = heldAdministration;
      heldAdministration = null;
      NativeWorker.prototype.postMessage.call(worker, value, options);
    };
    window.parentUiRequests = [];
    window.parentUiReplies = [];
    window.parentUiSavedWorkOrigins = [];
    document.addEventListener("click", event => {
      if (event.target instanceof Element && event.target.closest("#parent-profiles")) {
        const screen = document.querySelector(".course-saved");
        if (screen) window.parentUiSavedWorkOrigins.push({ pathname: location.pathname, scrollTop: screen.scrollTop });
      }
    }, true);
    window.parentUiRequest = value => new Promise((resolve, reject) => {
      const worker = window.parentUiWorker;
      if (!worker) return reject(new Error('The actual parent UI Worker is unavailable.'));
      const timeout = setTimeout(() => {
        worker.removeEventListener('message', listener);
        reject(new Error('Parent UI observation timed out.'));
      }, 15000);
      const listener = event => {
        if (event.data?.id !== value.id) return;
        clearTimeout(timeout);
        worker.removeEventListener('message', listener);
        resolve(event.data);
      };
      worker.addEventListener('message', listener);
      worker.postMessage(value);
    });
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        super(url, options);
        window.parentUiWorker = this;
        this.addEventListener('message', event => {
          window.parentUiReplies.push(structuredClone(event.data));
          if (holdAdministrationReply && event.data?.kind === "profileReceipt") {
            holdAdministrationReply = false;
            heldAdministrationReply = { worker: this, data: event.data };
            event.stopImmediatePropagation();
          }
        });
      }
      postMessage(value, options) {
        window.parentUiRequests.push(structuredClone(value));
        if (holdAdministration && value.kind === 'administer') {
          holdAdministration = false;
          heldAdministration = { worker: this, value, options };
          return;
        }
        super.postMessage(value, options);
      }
    };
  `);
}
async function openPreparation(page: Page) {
  await observeParentUi(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  const raw: unknown = await page.evaluate(
    "window.parentUiRequests.find(value => value.kind === 'openRecovery').preparation",
  );
  const preparation = await parsePreparationAvailability(raw, async (text) =>
    createHash("sha256").update(text).digest("hex"),
  );
  if (preparation.kind !== "available")
    throw new Error("Actual verified preparation is required.");
  const before = await directory(page);
  await page.getByLabel("Type the word", { exact: true }).fill("meadow");
  await page
    .getByRole("button", { name: "Continue setup", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: preparation.document.body.title.copy.text,
      exact: true,
    }),
  ).toBeVisible();
  return { before, preparation: preparation.document };
}

test("fresh parent setup confirms the existing anonymous child only after exact preparation acknowledgement and animal Continue", async ({
  page,
}, testInfo) => {
  await observeParentUi(page);
  await page.goto("/");
  await page.waitForFunction(
    () =>
      window.parentUiReplies.some((value) => value.kind === "inventory") &&
      window.parentUiReplies.some(
        (value) =>
          value.kind === "application" &&
          value.value.application.kind === "ready",
      ),
  );
  const before = await directory(page);
  const traffic: unknown = await page.evaluate(
    "({ requests: window.parentUiRequests, replies: window.parentUiReplies })",
  );
  await testInfo.attach("initial-actual-worker-directory", {
    body: JSON.stringify({ directory: before, traffic }, null, 2),
    contentType: "application/json",
  });
  expect(before.initialSetup.kind).toBe("firstLaunch");
  expect(before.profiles).toHaveLength(1);
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  const rawPreparation: unknown = await page.evaluate(
    "window.parentUiRequests.find(value => value.kind === 'openRecovery').preparation",
  );
  const preparation = await parsePreparationAvailability(
    rawPreparation,
    async (text) => createHash("sha256").update(text).digest("hex"),
  );
  if (preparation.kind !== "available")
    throw new Error("Actual verified fixture preparation is required.");
  await page.getByLabel("Type the word", { exact: true }).fill("meadow");
  await page
    .getByRole("button", { name: "Continue setup", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: preparation.document.body.title.copy.text,
      exact: true,
    }),
  ).toBeVisible();
  const reference = preparation.document.body.sections
    .flatMap((section) => section.blocks)
    .find(
      (block) => block.kind === "reference" && block.target.kind === "section",
    );
  if (reference)
    await page.locator(`[id="preparation-reference-${reference.id}"]`).click();
  expect(
    await page.evaluate(
      "window.parentUiRequests.filter(value => value.kind === 'administer' || value.kind === 'execute').length",
    ),
  ).toBe(0);
  await page
    .getByRole("button", { name: "I have read this preparation", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Choose your animal", exact: true }),
  ).toBeVisible();
  const acknowledged = await directory(page);
  expect(acknowledged.preparation).toEqual({
    kind: "acknowledged",
    hash: preparation.document.preparationHash,
  });
  await expect(page.getByRole("radio")).toHaveCount(8);
  const rabbit = page.getByRole("radio", { name: "Rabbit", exact: true });
  await expect(rabbit).toBeChecked();
  await rabbit.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("radio", { name: "Fox", exact: true }),
  ).toBeChecked();
  expect(
    await page.evaluate(
      "window.parentUiRequests.filter(value => value.kind === 'administer').length",
    ),
  ).toBe(1);
  const pending = await directory(page);
  expect(pending.profiles).toEqual(acknowledged.profiles);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".course-map")).toBeVisible();
  const finished = await directory(page);
  expect(finished.profiles).toHaveLength(1);
  expect(finished.selection).toEqual(before.selection);
  expect(finished.initialSetup.kind).toBe("complete");
  expect(finished.profiles[0]?.edit.owner).toEqual(before.selection.owner);
  expect(finished.profiles[0]?.preferences.avatarId).toBe("fox");
  const committedKinds: unknown = await page.evaluate(
    "window.parentUiRequests.filter(value => value.kind === 'administer').map(value => value.command.payload.kind)",
  );
  expect(committedKinds).toEqual([
    "acknowledgePreparation",
    "finishInitialProfile",
  ]);
  expect(
    await page.evaluate(
      "window.parentUiRequests.filter(value => value.kind === 'execute').length",
    ),
  ).toBe(0);
  await expect(page.locator(".parent-profile-button img")).toHaveAttribute(
    "data-avatar",
    "fox",
  );
  await page.reload();
  await expect(page.locator(".course-map")).toBeVisible();
  await expect(page.locator(".parent-profile-button img")).toHaveAttribute(
    "data-avatar",
    "fox",
  );
  expect((await directory(page)).profiles).toEqual(finished.profiles);
  await page.goto("/parent/settings");
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Type the word", { exact: true })).toHaveValue(
    "",
  );
});

test("rejected preparation Retry reloads the guide without success navigation or another administration", async ({
  page,
}) => {
  const { before, preparation } = await openPreparation(page);
  const accepted = await prepareProfileAdministration({
    selection: before.selection,
    ids: () => randomUUID(),
    hash: async (text) => createHash("sha256").update(text).digest("hex"),
    intent: {
      kind: "acknowledgePreparation",
      directory: before.administration,
      hash: preparation.preparationHash,
    },
  });
  await page.evaluate("window.armParentAdministrationHold()");
  await page
    .getByRole("button", { name: "I have read this preparation", exact: true })
    .click();
  await page.waitForFunction(() => window.hasHeldParentAdministration());
  const actual = await request(page, {
    id: parseWorkerRequestId(randomUUID()),
    kind: "administer",
    command: accepted,
  });
  expect(actual.kind === "profileReceipt" && actual.value.kind).toBe(
    "profileCommitted",
  );
  await page.evaluate("window.releaseParentAdministration()");
  await expect(page.getByRole("alert")).toContainText(
    "Profile settings changed before this command.",
  );
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await expect(
    page.getByRole("heading", {
      name: preparation.body.title.copy.text,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Choose your animal", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeEnabled();
  const after = await directory(page);
  expect(after.profiles).toEqual(before.profiles);
  expect(after.selection).toEqual(before.selection);
  expect(after.administration.revision).toBe("1");
  expect(after.initialSetup.kind).toBe("firstLaunch");
  expect(
    await page.evaluate(
      "window.parentUiRequests.filter(value => value.kind === 'administer').length",
    ),
  ).toBe(2);
  const outcomes: unknown = await page.evaluate(
    "window.parentUiReplies.filter(value => value.kind === 'profileReceipt').map(value => value.value.kind === 'rejected' ? value.value.code : value.value.kind)",
  );
  expect(outcomes).toEqual(["profileCommitted", "stale-administration"]);
  await expect(page).toHaveURL(/\/parent\/preparation$/);
});

test("required diagram decode failure blocks acknowledgement and retries the same verified payload", async ({
  page,
}) => {
  await page.addInitScript(`
    const create = URL.createObjectURL;
    let fail = true;
    window.allowParentDiagramDecode = () => { fail = false; };
    window.parentUiDiagramPayloads = [];
    window.parentUiDiagramErrors = 0;
    document.addEventListener('error', event => {
      if (event.target instanceof HTMLImageElement && event.target.src.startsWith('blob:')) window.parentUiDiagramErrors++;
    }, true);
    URL.createObjectURL = function(blob) {
      if (blob instanceof Blob && blob.type === 'image/svg+xml') {
        blob.text().then(text => window.parentUiDiagramPayloads.push(text));
        if (fail) {
          return create.call(URL, new Blob(['invalid SVG bytes'], { type: 'image/svg+xml' }));
        }
      }
      return create.call(URL, blob);
    };
  `);
  const { before, preparation } = await openPreparation(page);
  await expect
    .poll(() => page.evaluate("window.parentUiDiagramErrors"))
    .toBeGreaterThan(0);
  await expect(page.getByRole("alert")).toContainText(
    "A preparation diagram could not be displayed.",
  );
  await expect(
    page.getByRole("button", {
      name: "I have read this preparation",
      exact: true,
    }),
  ).toBeDisabled();
  expect(await page.evaluate("window.parentUiDiagramErrors")).toBeGreaterThan(
    0,
  );
  expect(
    await page.evaluate(
      "window.parentUiRequests.filter(value => value.kind === 'administer' || value.kind === 'execute').length",
    ),
  ).toBe(0);
  expect(await directory(page)).toEqual(before);
  const beforePayloads: unknown = await page.evaluate(
    "window.parentUiDiagramPayloads.length",
  );
  if (typeof beforePayloads !== "number")
    throw new Error("Observed diagram attempt count is required.");
  await page.evaluate("window.allowParentDiagramDecode()");
  await page
    .getByRole("button", { name: "Retry diagram", exact: true })
    .click();
  const image = page.locator("[data-preparation-asset] img");
  await expect
    .poll(() =>
      image.evaluate(
        (image) =>
          image instanceof HTMLImageElement &&
          image.complete &&
          image.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await expect(
    page.getByRole("button", {
      name: "I have read this preparation",
      exact: true,
    }),
  ).toBeEnabled();
  const payload = preparation.assets[0];
  if (!payload) throw new Error("Actual fixture diagram required.");
  const attempted: unknown = await page.evaluate(
    "window.parentUiDiagramPayloads",
  );
  expect(attempted).toEqual(
    Array.from({ length: beforePayloads + 1 }, () => payload.svg),
  );
  expect(await directory(page)).toEqual(before);
  await page
    .getByRole("button", { name: "I have read this preparation", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Choose your animal", exact: true }),
  ).toBeVisible();
  expect((await directory(page)).preparation).toEqual({
    kind: "acknowledged",
    hash: preparation.preparationHash,
  });
  expect(
    await page.evaluate(
      "window.parentUiRequests.filter(value => value.kind === 'administer').length",
    ),
  ).toBe(1);
});

async function completeSetup(page: Page) {
  await openPreparation(page);
  await page
    .getByRole("button", { name: "I have read this preparation", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Choose your animal", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".course-map")).toBeVisible();
  return directory(page);
}

async function grantParents(page: Page) {
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Type the word", { exact: true }).fill("meadow");
  await page
    .getByRole("button", { name: "Continue to parent settings", exact: true })
    .click();
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
}

async function openProfiles(page: Page) {
  await page
    .getByRole("button", { name: "Choose child profile", exact: true })
    .click();
  await grantParents(page);
  await expect(
    page.getByRole("heading", { name: "Who is reading today?", exact: true }),
  ).toBeVisible();
}

function profileRow(page: Page, profile: ProfileDirectory["profiles"][number]) {
  return page.locator(`[data-profile-id="${profile.edit.owner.profileId}"]`);
}

async function parentRequests(page: Page) {
  const raw: unknown = await page.evaluate("window.parentUiRequests");
  if (!Array.isArray(raw))
    throw new Error("Actual Worker requests are required.");
  return raw.map(parseRequest);
}

async function administrationCommands(page: Page) {
  return (await parentRequests(page)).flatMap((value) =>
    value.kind === "administer" ? [value.command] : [],
  );
}

async function application(page: Page) {
  const current = await directory(page);
  const result = await request(page, {
    id: parseWorkerRequestId(randomUUID()),
    kind: "read",
    input: { selection: current.selection, target: { kind: "cursor" } },
  });
  if (
    result.kind !== "application" ||
    result.value.application.kind !== "ready"
  )
    throw new Error("The actual committed application is required.");
  return result.value.application;
}

async function personalWork(page: Page) {
  const current = await directory(page);
  const read = await application(page);
  const work = [];
  for (const saved of read.course.lessons.flatMap((lesson) =>
    lesson.tasks.flatMap((task) => task.history),
  )) {
    const result = await request(page, {
      id: parseWorkerRequestId(randomUUID()),
      kind: "readWork",
      input: { selection: current.selection, runId: saved.runId },
    });
    if (result.kind !== "work")
      throw new Error("Actual complete saved work is required.");
    work.push(result.value.value);
  }
  return { read, work };
}

async function selectedProfile(page: Page) {
  const current = await directory(page);
  const selected = current.profiles.find(
    (profile) =>
      profile.edit.owner.profileId === current.selection.owner.profileId,
  );
  if (!selected) throw new Error("Actual selected child is required.");
  return selected;
}

async function chooseAnimal(page: Page, animal: string) {
  const radio = page.getByRole("radio", { name: animal, exact: true });
  await page.locator(".parent-animal-card").filter({ has: radio }).click();
  await expect(radio).toBeChecked();
}

async function createChild(page: Page, name: string, animal: string) {
  await page.getByRole("button", { name: "Add child", exact: true }).click();
  await page.getByLabel("Name (optional)", { exact: true }).fill(name);
  await chooseAnimal(page, animal);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".course-map")).toBeVisible();
  return selectedProfile(page);
}

async function startWritingWithInk(page: Page) {
  await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
  await page.getByRole("button", { name: "Start Task 6", exact: true }).click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    "fixture.graph.l01.t06.m-sound",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    "fixture.graph.l01.t06.m-model",
  );
  await expect(page.locator("canvas")).toHaveAttribute("data-writable", "true");
  const point = await page.locator("canvas").evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scale = Number(canvas.dataset.scale);
    return {
      x: rect.left + Number(canvas.dataset.offsetX) + 150 * scale,
      y: rect.top + Number(canvas.dataset.offsetY) + 100 * scale,
    };
  });
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 30, point.y + 20);
  await page.mouse.up();
  await expect
    .poll(
      async () =>
        (await parentRequests(page)).filter(
          (value) =>
            value.kind === "execute" &&
            value.operation.kind === "ink" &&
            value.operation.command.edit.kind === "finalize",
        ).length,
    )
    .toBe(1);
}

test("unconfirmed profile drafts cancel, go Back and reload without a profile write", async ({
  page,
}) => {
  const before = await completeSetup(page);
  const original = before.profiles[0];
  if (!original) throw new Error("The original anonymous profile is required.");
  const baseline = await personalWork(page);
  const commands = await administrationCommands(page);
  await openProfiles(page);
  await page.getByRole("button", { name: "Add child", exact: true }).click();
  await page
    .getByLabel("Name (optional)", { exact: true })
    .fill("Pending child");
  await chooseAnimal(page, "Cat");
  expect(await directory(page)).toEqual(before);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Who is reading today?", exact: true }),
  ).toBeVisible();
  await profileRow(page, original)
    .getByRole("button", { name: "Change animal", exact: true })
    .click();
  await chooseAnimal(page, "Owl");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.locator(".course-map")).toBeVisible();
  await openProfiles(page);
  await profileRow(page, original)
    .getByRole("button", { name: "Change animal", exact: true })
    .click();
  await chooseAnimal(page, "Fox");
  expect(await directory(page)).toEqual(before);
  expect(await administrationCommands(page)).toEqual(commands);
  await page.reload();
  await expect(page.getByLabel("Type the word", { exact: true })).toHaveValue(
    "",
  );
  await grantParents(page);
  await expect(
    page.getByRole("radio", { name: "Rabbit", exact: true }),
  ).toBeChecked();
  expect(await directory(page)).toEqual(before);
  expect(await personalWork(page)).toEqual(baseline);
  expect(await administrationCommands(page)).toEqual([]);
  expect(commands.map((command) => command.payload.kind)).toEqual([
    "acknowledgePreparation",
    "finishInitialProfile",
  ]);
});

test("optional and duplicate names preserve stable child identity while another child is edited", async ({
  page,
}, testInfo) => {
  const initial = await completeSetup(page);
  const a = await selectedProfile(page);
  await startWritingWithInk(page);
  await openProfiles(page);
  const b = await createChild(page, "", "Fox");
  expect(b.preferences).toEqual({ version: 1, avatarId: "fox" });
  expect(b.edit.owner.profileId).not.toBe(a.edit.owner.profileId);
  const created = await directory(page);
  expect(created.selection.revision).toBe("1");
  expect(created.profiles).toHaveLength(2);
  await openProfiles(page);
  await profileRow(page, a)
    .getByRole("button", { name: "Read together", exact: true })
    .click();
  await expect(page.locator(".course-map")).toBeVisible();
  const selectedA = await directory(page);
  expect(selectedA.selection.owner).toEqual(a.edit.owner);
  expect(selectedA.selection.revision).toBe("2");
  const aWork = await personalWork(page);
  await openProfiles(page);
  await profileRow(page, b)
    .getByRole("button", { name: "Change animal", exact: true })
    .click();
  await chooseAnimal(page, "Cat");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Who is reading today?", exact: true }),
  ).toBeVisible();
  await profileRow(page, b)
    .getByRole("button", { name: "Change name", exact: true })
    .click();
  await page.getByLabel("Name (optional)", { exact: true }).fill("Sam");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(profileRow(page, b)).toContainText("Sam");
  expect((await directory(page)).selection).toEqual(selectedA.selection);
  expect(await personalWork(page)).toEqual(aWork);
  expect(await selectedProfile(page)).toEqual(
    selectedA.profiles.find(
      (profile) => profile.edit.owner.profileId === a.edit.owner.profileId,
    ),
  );
  await profileRow(page, a)
    .getByRole("button", { name: "Change name", exact: true })
    .click();
  await page.getByLabel("Name (optional)", { exact: true }).fill("Sam");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(page.locator("[data-profile-id] strong")).toHaveText([
    "Sam",
    "Sam",
  ]);
  await profileRow(page, a)
    .getByRole("button", { name: "Change animal", exact: true })
    .click();
  await chooseAnimal(page, "Bear");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Who is reading today?", exact: true }),
  ).toBeVisible();
  const after = await directory(page);
  expect(
    after.profiles.find(
      (profile) => profile.edit.owner.profileId === a.edit.owner.profileId,
    )?.preferences,
  ).toEqual({ version: 1, avatarId: "bear", displayName: "Sam" });
  expect(
    after.profiles.find(
      (profile) => profile.edit.owner.profileId === b.edit.owner.profileId,
    )?.preferences,
  ).toEqual({ version: 1, avatarId: "cat", displayName: "Sam" });
  expect(after.selection).toEqual(selectedA.selection);
  const commands = await administrationCommands(page);
  expect(commands.map((command) => command.payload.kind)).toEqual([
    "acknowledgePreparation",
    "finishInitialProfile",
    "createAndSelect",
    "selectProfile",
    "setAvatar",
    "setDisplayName",
    "setDisplayName",
    "setAvatar",
  ]);
  expect(commands.slice(2).map((command) => command.scope.revision)).toEqual([
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
  ]);
  expect(commands[4]?.payload).toEqual({
    kind: "setAvatar",
    target: b.edit,
    avatarId: "cat",
  });
  expect(commands[5]?.payload).toEqual({
    kind: "setDisplayName",
    target: { owner: b.edit.owner, revision: "1" },
    displayName: "Sam",
  });
  expect(commands[6]?.payload).toEqual({
    kind: "setDisplayName",
    target: { owner: a.edit.owner, revision: "2" },
    displayName: "Sam",
  });
  expect(commands[7]?.payload).toEqual({
    kind: "setAvatar",
    target: { owner: a.edit.owner, revision: "3" },
    avatarId: "bear",
  });
  expect(
    aWork.work[0]?.documents
      .flatMap((document) => document.snapshot.strokes)
      .map((stroke) => ({
        layer: stroke.layer,
        pointCount: stroke.pointCount,
        status: stroke.status,
      })),
  ).toEqual([{ layer: "model", pointCount: 3, status: "finished" }]);
  expect(
    aWork.read.projection.actions.some(
      (action) => action.intent.kind === "undoAdvance",
    ),
  ).toBe(true);
  await testInfo.attach("actual-profile-identity-commands", {
    body: JSON.stringify({ initial, after, commands }, null, 2),
    contentType: "application/json",
  });
  await page
    .getByRole("link", { name: "Return to lesson map", exact: true })
    .click();
  await expect(page.locator(".parent-profile-button")).toContainText("Sam");
  await expect(page.locator(".parent-profile-button img")).toHaveAttribute(
    "data-avatar",
    "bear",
  );
  await page.reload();
  await expect(page.locator(".parent-profile-button")).toContainText("Sam");
  expect(await directory(page)).toEqual(after);
  await openProfiles(page);
  await profileRow(page, b)
    .getByRole("button", { name: "Read together", exact: true })
    .click();
  await expect(page.locator(".parent-profile-button img")).toHaveAttribute(
    "data-avatar",
    "cat",
  );
  await page.reload();
  await expect(page.locator(".course-map")).toBeVisible();
  await expect(page.locator(".parent-profile-button img")).toHaveAttribute(
    "data-avatar",
    "cat",
  );
  expect((await directory(page)).profiles).toEqual(after.profiles);
  await openProfiles(page);
  await profileRow(page, a)
    .getByRole("button", { name: "Read together", exact: true })
    .click();
  await expect(page.locator(".course-map")).toBeVisible();
  const returned = await directory(page);
  expect(returned.selection.owner).toEqual(a.edit.owner);
  expect(returned.selection.revision).toBe("4");
  const restored = await personalWork(page);
  expect(restored.read.course).toEqual(aWork.read.course);
  if (
    aWork.read.projection.kind !== "writing" ||
    restored.read.projection.kind !== "writing"
  )
    throw new Error("Both actual A lifetimes must retain writing.");
  const beforeTokens = [...aWork.read.projection.documents].sort((a, b) =>
    a.targetId.localeCompare(b.targetId),
  );
  const afterTokens = [...restored.read.projection.documents].sort((a, b) =>
    a.targetId.localeCompare(b.targetId),
  );
  const [m, s] = beforeTokens;
  if (!m || !s)
    throw new Error("Both saved writing target tokens are required.");
  expect(
    beforeTokens.map((token) => ({
      target: token.targetId,
      revision: token.revision,
      inputEpoch: token.inputEpoch,
    })),
  ).toEqual([
    { target: "fixture.graph.l01.t06.m", revision: "4", inputEpoch: "2" },
    { target: "fixture.graph.l01.t06.s", revision: "2", inputEpoch: "2" },
  ]);
  expect(afterTokens).toEqual([
    { ...m, revision: "6", inputEpoch: "4" },
    { ...s, revision: "4", inputEpoch: "4" },
  ]);
  expect(restored.read.projection).toEqual({
    ...aWork.read.projection,
    profileRevision: "4",
    documents: aWork.read.projection.documents.map((token) =>
      token.targetId === "fixture.graph.l01.t06.m"
        ? { ...m, revision: "6", inputEpoch: "4" }
        : { ...s, revision: "4", inputEpoch: "4" },
    ),
    actions: aWork.read.projection.actions.map((action) =>
      action.intent.kind === "undoAdvance"
        ? {
            ...action,
            intent: {
              ...action.intent,
              binding: { ...action.intent.binding, profileRevision: "4" },
            },
          }
        : action,
    ),
  });
  expect(restored.work).toEqual(aWork.work);
  expect(restored.read.witness).toEqual({
    ...aWork.read.witness,
    profileRevision: "4",
  });
  await page
    .getByRole("button", { name: "Choose child profile", exact: true })
    .click();
  await expect(page.getByLabel("Type the word", { exact: true })).toHaveValue(
    "",
  );
});

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
]) {
  test(`same-child map and long menu return restore focus and scroll at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const before = await completeSetup(page);
    const baseline = await personalWork(page);
    await openProfiles(page);
    await page
      .getByRole("link", { name: "Return to lesson map", exact: true })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("#parent-profiles")).toBeFocused();
    await page.getByRole("link", { name: "Lesson 5", exact: true }).click();
    const route = page.url();
    const scroll = page.locator("[data-menu-scroll]");
    await scroll.evaluate((element) => {
      element.scrollTop = 80;
    });
    await expect
      .poll(() => scroll.evaluate((element) => element.scrollTop))
      .toBe(80);
    await page.getByRole("link", { name: "For parents", exact: true }).click();
    await grantParents(page);
    await expect(
      page.getByRole("heading", { name: "Reading together", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Return to reading", exact: true })
      .click();
    await expect(page).toHaveURL(route);
    await expect(page.locator("#parent-settings")).toBeFocused();
    expect(await scroll.evaluate((element) => element.scrollTop)).toBe(80);
    expect(await directory(page)).toEqual(before);
    expect(await personalWork(page)).toEqual(baseline);
    expect(
      (await administrationCommands(page)).map(
        (command) => command.payload.kind,
      ),
    ).toEqual(["acknowledgePreparation", "finishInitialProfile"]);
  });
}

test("direct parent routes, query strings, reload and history never retain a gate grant", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const before = await completeSetup(page);
  const a = await selectedProfile(page);
  for (const path of [
    "/parent/settings?granted=true",
    "/parent/profiles",
    "/parent/preparation",
    "/parent/profiles/new",
    `/parent/profiles/${a.edit.owner.profileId}/animal`,
    `/parent/profiles/${a.edit.owner.profileId}/name`,
    "/parent/profiles/missing-child/animal",
  ]) {
    await page.goto(path);
    await expect(page.getByLabel("Type the word", { exact: true })).toHaveValue(
      "",
    );
    await grantParents(page);
    if (path.includes("missing-child")) {
      await expect(
        page.getByRole("heading", {
          name: "This parent page is unavailable",
          exact: true,
        }),
      ).toBeVisible();
    }
    expect(await directory(page)).toEqual(before);
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: "A moment for the grown-up",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByLabel("Type the word", { exact: true })).toHaveValue(
      "",
    );
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.locator(".course-map")).toBeVisible();
  }
  await openProfiles(page);
  await page
    .getByRole("link", { name: "Return to lesson map", exact: true })
    .click();
  await expect(page.locator(".course-map")).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Type the word", { exact: true })).toHaveValue(
    "",
  );
  expect(await directory(page)).toEqual(before);
  expect(await administrationCommands(page)).toEqual([]);
});

test("same-child teaching and saved handwriting return preserve the exact paused run and documents", async ({
  page,
}, testInfo) => {
  await completeSetup(page);
  await startWritingWithInk(page);
  await openProfiles(page);
  const paused = await personalWork(page);
  expect(paused.read.projection.kind).toBe("writing");
  if (paused.read.projection.kind !== "writing")
    throw new Error("Committed paused writing is required.");
  expect(paused.read.projection.sessionStatus).toBe("paused");
  expect(paused.read.projection.turn.id).toBe("fixture.graph.l01.t06.m-model");
  expect(paused.work).toHaveLength(1);
  expect(paused.work[0]?.documents).toHaveLength(2);
  const commands = await parentRequests(page);
  await page
    .getByRole("link", { name: "Return to reading", exact: true })
    .click();
  await expect(page).toHaveURL(/\/teaching$/);
  await expect(
    page.getByRole("heading", { name: "Reading is paused", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#parent-profiles")).toBeFocused();
  expect(await personalWork(page)).toEqual(paused);
  expect(
    (await parentRequests(page)).filter((value) => value.kind === "execute"),
  ).toEqual(commands.filter((value) => value.kind === "execute"));
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    "fixture.graph.l01.t06.m-model",
  );
  await expect(page.locator("canvas")).toHaveAttribute("data-writable", "true");
  await page.getByRole("button", { name: "Activities", exact: true }).click();
  await expect(page.locator(".course-menu")).toBeVisible();
  const stored = await personalWork(page);
  const work = stored.work[0];
  if (!work) throw new Error("Actual saved handwriting is required.");
  await page.locator('[data-task-number="6"] summary').click();
  await page.locator(`[id="work-${work.summary.runId}"]`).click();
  await expect(
    page.getByRole("heading", { name: "Saved work · Read-only", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".course-saved-drawing")).toHaveCount(2);
  const savedRoute = page.url();
  await page.setViewportSize({ width: 1024, height: 600 });
  const scroll = page.locator(".course-saved");
  await testInfo.attach("actual-saved-work-scroll-geometry", {
    body: JSON.stringify(
      await scroll.evaluate((element) => ({
        client: element.clientHeight,
        scroll: element.scrollHeight,
        content: element
          .querySelector(".course-saved-content")
          ?.getBoundingClientRect().height,
      })),
    ),
    contentType: "application/json",
  });
  await scroll.evaluate((element) => {
    element.scrollTop = 5;
  });
  await expect
    .poll(() => scroll.evaluate((element) => element.scrollTop))
    .toBe(5);
  await openProfiles(page);
  expect(await page.evaluate("window.parentUiSavedWorkOrigins")).toEqual([
    { pathname: new URL(savedRoute).pathname, scrollTop: 5 },
  ]);
  await page
    .getByRole("link", { name: "Return to reading", exact: true })
    .click();
  await expect(page).toHaveURL(savedRoute);
  await expect(page.locator(".course-saved-drawing")).toHaveCount(2);
  await expect(page.locator("#parent-profiles")).toBeFocused();
  expect(await scroll.evaluate((element) => element.scrollTop)).toBe(5);
  expect(await personalWork(page)).toEqual(stored);
  await testInfo.attach("actual-paused-writing-and-saved-work", {
    body: JSON.stringify({ paused, stored }, null, 2),
    contentType: "application/json",
  });
});

test("a committed child creation retries after route departure without reviving its parent grant", async ({
  page,
}, testInfo) => {
  const before = await completeSetup(page);
  await page.getByRole("link", { name: "Lesson 5", exact: true }).click();
  await openProfiles(page);
  await page.getByRole("button", { name: "Add child", exact: true }).click();
  await page.getByLabel("Name (optional)", { exact: true }).fill("B");
  await chooseAnimal(page, "Owl");
  await page.evaluate("window.armParentAdministrationReplyHold()");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForFunction(() => window.hasHeldParentAdministrationReply());
  const committed = await directory(page);
  expect(committed.profiles).toHaveLength(2);
  expect(committed.selection.revision).toBe("1");
  expect(committed.selection.owner).not.toEqual(before.selection.owner);
  const commands = await administrationCommands(page);
  const creation = commands.find(
    (command) => command.payload.kind === "createAndSelect",
  );
  if (!creation)
    throw new Error("The exact actual child creation command is required.");
  await page.goBack();
  await expect(page.locator(".course-menu")).toBeVisible();
  await page.evaluate("window.loseHeldParentAdministrationReply()");
  await expect(page.getByRole("alert")).toContainText(
    "This save could not be confirmed. Keep this reading window open and retry the same action.",
  );
  await page.getByRole("button", { name: "Retry save", exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".parent-profile-button img")).toHaveAttribute(
    "data-avatar",
    "owl",
  );
  expect(await directory(page)).toEqual(committed);
  const after = await administrationCommands(page);
  expect(
    after.filter((command) => command.payload.kind === "createAndSelect"),
  ).toEqual([creation]);
  const recovered = (await parentRequests(page)).filter(
    (value) => value.kind === "recoverAdministration",
  );
  expect(recovered.map((value) => value.command)).toEqual([creation]);
  await testInfo.attach("actual-committed-create-departure-recovery", {
    body: JSON.stringify(
      { before, committed, creation, recovered, finalRoute: page.url() },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await page
    .getByRole("button", { name: "Choose child profile", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Type the word", { exact: true })).toHaveValue(
    "",
  );
});

test("locked gate drafts expire after repeated Cancel and immediate browser Back", async ({
  page,
}) => {
  const before = await completeSetup(page);
  const baseline = await personalWork(page);
  await page.goto("/parent/gate");
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  for (let round = 0; round < 2; round++) {
    await page.getByLabel("Type the word", { exact: true }).fill("draft");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.goBack();
    await expect(page).toHaveURL(/\/parent\/gate$/);
    await expect(
      page.getByRole("heading", {
        name: "A moment for the grown-up",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByLabel("Type the word", { exact: true })).toHaveValue(
      "",
    );
  }
  expect(await directory(page)).toEqual(before);
  expect(await personalWork(page)).toEqual(baseline);
  expect(await administrationCommands(page)).toEqual([]);
});

test("reset confirmation cancels without a write and confirmed reset retires the saved-work origin behind a fresh gate", async ({
  page,
}) => {
  const before = await completeSetup(page);
  await startWritingWithInk(page);
  await page
    .getByRole("button", { name: "Choose child profile", exact: true })
    .click();
  await grantParents(page);
  const commandsBefore = (await administrationCommands(page)).length;
  await page
    .getByRole("button", { name: "Reset progress", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Reset this child's progress?",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".parent-removal")).toContainText("Rabbit");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect((await administrationCommands(page)).length).toBe(commandsBefore);
  await page
    .getByRole("button", { name: "Reset progress", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reset progress permanently", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  const after = await directory(page);
  expect(after.selection.owner.profileId).toBe(
    before.selection.owner.profileId,
  );
  expect(after.selection.owner.generation).toBe("1");
  expect((await personalWork(page)).work).toEqual([]);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".course-map")).toBeVisible();
  await page.reload();
  await expect(page.locator(".course-map")).toBeVisible();
  expect(await directory(page)).toEqual(after);
});

test("final child deletion requires explicit replacement animal and a separate concrete confirmation", async ({
  page,
}) => {
  const before = await completeSetup(page);
  await openProfiles(page);
  const count = (await administrationCommands(page)).length;
  await page.getByRole("button", { name: "Delete child", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Review deletion", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".parent-removal")).toContainText(
    "This is the only child",
  );
  await page.getByRole("radio", { name: "Fox", exact: true }).check();
  await page
    .getByLabel("New child's name (optional)", { exact: true })
    .fill("Fresh child");
  await page
    .getByRole("button", { name: "Review deletion", exact: true })
    .click();
  await expect(page.locator(".parent-successor-summary")).toContainText(
    "Create a fresh child Fresh child (Fox).",
  );
  expect((await administrationCommands(page)).length).toBe(count);
  await page
    .getByRole("button", { name: "Delete child permanently", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  const after = await directory(page);
  expect(after.profiles).toHaveLength(1);
  expect(after.selection.owner.profileId).not.toBe(
    before.selection.owner.profileId,
  );
  expect(after.selection.owner.generation).toBe("0");
  expect(after.profiles[0]?.preferences).toEqual({
    version: 1,
    avatarId: "fox",
    displayName: "Fresh child",
  });
  expect((await personalWork(page)).work).toEqual([]);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator(".course-map")).toBeVisible();
});

test("parent support displays bounded local metadata and whole-origin estimates without a profile mutation", async ({
  page,
}) => {
  await completeSetup(page);
  await openProfiles(page);
  await page
    .getByRole("button", { name: "Parent settings", exact: true })
    .click();
  const before = await directory(page);
  const count = (await administrationCommands(page)).length;
  await page
    .getByRole("button", { name: "Local support information", exact: true })
    .click();
  const preview = page.locator(".parent-support-preview");
  await expect(preview).toBeVisible();
  const text = await preview.innerText();
  expect(new TextEncoder().encode(text).byteLength).toBeLessThanOrEqual(8192);
  expect(JSON.parse(text)).toMatchObject({
    version: 1,
    persistence: "durable",
    metadata: { versions: { database: DATABASE_VERSION, inkCodec: 1 } },
    browserWholeOriginEstimate: { scope: "origin" },
  });
  expect(await directory(page)).toEqual(before);
  expect((await administrationCommands(page)).length).toBe(count);
  await expect(
    page.getByRole("button", { name: /export|copy|upload/i }),
  ).toHaveCount(0);
});
