import { createHash, randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  parsePreparationAvailability,
  prepareProfileAdministration,
} from "@readatthree/teaching";
import type { ProfileDirectory } from "@readatthree/teaching";
import {
  parseResponse,
  parseWorkerRequestId,
} from "../../apps/web/src/platform/protocol.ts";
import type { WorkerRequest } from "../../apps/web/src/platform/protocol.ts";

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
    "window.parentUiReplies.some(value => value.kind === 'inventory') && window.parentUiReplies.some(value => value.kind === 'application' && value.value.application.kind === 'ready')",
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
  await page.waitForFunction("window.hasHeldParentAdministration()");
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
