import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { parsePreparationAvailability } from "@readatthree/teaching";
import {
  parseRequest,
  parseResponse,
} from "../../apps/web/src/platform/protocol.ts";
import type {
  WorkerRequest,
  WorkerRequestId,
  WorkerResponse,
} from "../../apps/web/src/platform/protocol.ts";

type SetupTrafficBoundary = Readonly<{
  documentId: string;
  openingId: WorkerRequestId;
  finalReadId: WorkerRequestId;
  excluded: readonly Readonly<{
    requestId: WorkerRequestId;
    reason:
      | "initial application before setup"
      | "setup directory read"
      | "preparation acknowledgement"
      | "initial profile confirmation"
      | "intermediate setup adoption read";
  }>[];
}>;
type SetupObservation = Readonly<{
  documentId: string;
  requests: readonly WorkerRequest[];
  responses: readonly WorkerResponse[];
}>;
const installed = new WeakSet<Page>();
const boundaries = new WeakMap<Page, SetupTrafficBoundary>();

export async function installInitialSetupObservation(page: Page) {
  if (installed.has(page)) return;
  installed.add(page);
  await page.addInitScript(`
    (() => {
    const NativeWorker = window.Worker;
    const documentId = crypto.randomUUID();
    const requests = [], responses = [];
    Object.defineProperty(window, 'initialSetupDocumentId', { get: () => documentId });
    Object.defineProperty(window, 'initialSetupObservation', { value: () => structuredClone({ documentId, requests, responses }) });
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        super(url, options);
        this.addEventListener('message', event => responses.push(structuredClone(event.data)));
      }
      postMessage(message, options) {
        requests.push(structuredClone(message));
        super.postMessage(message, options);
      }
    };
    })();
  `);
}

async function observation(page: Page): Promise<SetupObservation> {
  const raw: unknown = await page.evaluate("window.initialSetupObservation()");
  if (
    !raw ||
    typeof raw !== "object" ||
    !("documentId" in raw) ||
    typeof raw.documentId !== "string" ||
    !("requests" in raw) ||
    !Array.isArray(raw.requests) ||
    !("responses" in raw) ||
    !Array.isArray(raw.responses)
  )
    throw new Error("Actual initial setup observation is unavailable.");
  return {
    documentId: raw.documentId,
    requests: raw.requests.map(parseRequest),
    responses: raw.responses.map(parseResponse),
  };
}

function actualPair(observed: SetupObservation, id: WorkerRequestId) {
  const requests = observed.requests.filter((request) => request.id === id);
  const responses = observed.responses.filter((response) => response.id === id);
  expect(requests).toHaveLength(1);
  expect(responses).toHaveLength(1);
  const request = requests[0];
  const response = responses[0];
  if (!request || !response)
    throw new Error("An actual matching setup request and reply are required.");
  return { request, response };
}

function partition(observed: SetupObservation, boundary: SetupTrafficBoundary) {
  const excludedIds = new Set(
    boundary.excluded.map((entry) => entry.requestId),
  );
  expect(excludedIds.size).toBe(boundary.excluded.length);
  expect(excludedIds.has(boundary.openingId)).toBe(false);
  expect(excludedIds.has(boundary.finalReadId)).toBe(false);
  const excluded = boundary.excluded.map((entry) => ({
    ...entry,
    ...actualPair(observed, entry.requestId),
  }));
  const retained = observed.requests
    .filter((request) => !excludedIds.has(request.id))
    .map((request) => actualPair(observed, request.id));
  const classifiedIds = [
    ...retained.map((pair) => pair.request.id),
    ...excluded.map((pair) => pair.request.id),
  ];
  expect(classifiedIds.length).toBe(observed.requests.length);
  expect(new Set(classifiedIds).size).toBe(observed.requests.length);
  expect(new Set(classifiedIds)).toEqual(
    new Set(observed.requests.map((request) => request.id)),
  );
  expect(observed.responses.map((response) => response.id).sort()).toEqual(
    [...classifiedIds].sort(),
  );
  return { retained, excluded };
}

export async function completeInitialSetup({
  page,
  entry = "map",
}: {
  page: Page;
  entry?: "map" | "consumer";
}) {
  await page.waitForFunction(
    "window.initialSetupObservation().responses.some(value => value.kind === 'inventory') && window.initialSetupObservation().responses.some(value => value.kind === 'application' && value.value.application.kind === 'ready')",
  );
  const initial = await observation(page);
  const opening = initial.requests.find(
    (request) => request.kind === "openRecovery",
  );
  if (opening?.kind !== "openRecovery")
    throw new Error("The real initial openRecovery request is required.");
  const inventory = actualPair(initial, opening.id).response;
  if (inventory.kind !== "inventory")
    throw new Error("The real initial recovery inventory is required.");
  const before = inventory.value.directory;
  const ordinaryEntry =
    entry === "map"
      ? page.locator(".course-map")
      : page.getByRole("button", { name: "Start Task 6", exact: true });
  if (before.initialSetup.kind !== "firstLaunch") {
    await expect(ordinaryEntry).toBeVisible();
    return;
  }
  expect(before.profiles).toHaveLength(1);
  const originalProfile = before.profiles[0];
  if (!originalProfile)
    throw new Error("The existing initial profile is required.");
  expect(originalProfile.edit.owner).toEqual(before.selection.owner);
  const preparation = await parsePreparationAvailability(
    opening.preparation,
    async (text) => createHash("sha256").update(text).digest("hex"),
  );
  if (preparation.kind !== "available")
    throw new Error("Actual verified preparation is required for setup.");
  await expect(
    page.getByRole("heading", {
      name: "A moment for the grown-up",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Type the word", { exact: true }).fill("meadow");
  await page
    .getByRole("button", { name: "Continue setup", exact: true })
    .click();
  if (before.preparation.kind !== "acknowledged") {
    await expect(
      page.getByRole("heading", {
        name: preparation.document.body.title.copy.text,
        exact: true,
      }),
    ).toBeVisible();
    const diagrams = preparation.document.body.sections.flatMap((section) =>
      section.blocks.filter((block) => block.kind === "diagram"),
    );
    await expect(
      page.locator('.preparation-diagram[data-diagram-status="ready"]'),
    ).toHaveCount(diagrams.length);
    await page
      .getByRole("button", {
        name: "I have read this preparation",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("group", { name: "Choose your animal", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(8);
  await expect(
    page.getByRole("radio", { name: "Rabbit", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(ordinaryEntry).toBeVisible();
  const completed = await observation(page);
  const finalApplication = completed.responses.findLast(
    (response) => response.kind === "application",
  );
  if (
    finalApplication?.kind !== "application" ||
    finalApplication.value.application.kind !== "ready"
  )
    throw new Error("The real post-confirmation application read is required.");
  const finalRead = actualPair(completed, finalApplication.id).request;
  if (finalRead.kind !== "read")
    throw new Error("The final actual application request must be a read.");
  const finalDirectory = completed.responses.findLast(
    (response) => response.kind === "directory",
  );
  if (finalDirectory?.kind !== "directory")
    throw new Error("The actual committed setup directory is required.");
  expect(finalDirectory.value.initialSetup.kind).toBe("complete");
  expect(finalDirectory.value.selection).toEqual(before.selection);
  expect(finalDirectory.value.profiles).toHaveLength(1);
  expect(finalDirectory.value.profiles[0]?.edit.owner).toEqual(
    originalProfile.edit.owner,
  );
  expect(finalDirectory.value.profiles[0]?.preferences.avatarId).toBe("rabbit");
  expect(finalDirectory.value.preparation).toEqual({
    kind: "acknowledged",
    hash: preparation.document.preparationHash,
  });
  expect(finalApplication.value.application.projection.kind).toBe("entry");
  const confirmed = completed.requests.filter(
    (request) =>
      request.kind === "administer" &&
      request.command.payload.kind === "finishInitialProfile",
  );
  expect(confirmed).toHaveLength(1);
  const confirmation = confirmed[0];
  if (
    confirmation?.kind !== "administer" ||
    confirmation.command.payload.kind !== "finishInitialProfile"
  )
    throw new Error("The exact initial confirmation is required.");
  expect(confirmation.command.payload.target).toEqual(originalProfile.edit);
  expect(confirmation.command.payload.preferences).toEqual({
    avatarId: "rabbit",
  });
  expect(
    completed.requests.indexOf(finalRead) >
      completed.requests.indexOf(confirmation),
  ).toBe(true);
  const acknowledgement = completed.requests.filter(
    (request) =>
      request.kind === "administer" &&
      request.command.payload.kind === "acknowledgePreparation",
  );
  expect(acknowledgement).toHaveLength(
    before.preparation.kind === "acknowledged" ? 0 : 1,
  );
  for (const request of acknowledgement) {
    if (
      request.kind !== "administer" ||
      request.command.payload.kind !== "acknowledgePreparation"
    )
      throw new Error("The actual preparation acknowledgement is required.");
    expect(request.command.payload.hash).toBe(
      preparation.document.preparationHash,
    );
  }
  expect(
    completed.requests.filter(
      (request) =>
        request.kind === "execute" ||
        request.kind === "recoverTeaching" ||
        request.kind === "recoverInk" ||
        request.kind === "readInk" ||
        request.kind === "readWork" ||
        request.kind === "readPracticeControls",
    ),
  ).toEqual([]);
  expect(
    completed.responses.filter((response) => response.kind === "inkSnapshot"),
  ).toEqual([]);
  const excluded: SetupTrafficBoundary["excluded"][number][] = [];
  for (const request of completed.requests) {
    if (request.id === opening.id || request.id === finalRead.id) continue;
    const response = actualPair(completed, request.id).response;
    switch (request.kind) {
      case "reconcileRecovery":
        if (response.kind !== "reconciled")
          throw new Error("The initial reconciliation reply is required.");
        continue;
      case "readDirectory":
        if (response.kind !== "directory")
          throw new Error(
            "A setup directory read must retain its actual reply.",
          );
        excluded.push({
          requestId: request.id,
          reason: "setup directory read",
        });
        continue;
      case "read":
        if (response.kind !== "application")
          throw new Error("A setup read must retain its actual reply.");
        excluded.push({
          requestId: request.id,
          reason:
            completed.requests.indexOf(request) <
            completed.requests.indexOf(confirmation)
              ? "initial application before setup"
              : "intermediate setup adoption read",
        });
        continue;
      case "administer":
        if (
          response.kind !== "profileReceipt" ||
          response.value.kind !== "profileCommitted" ||
          response.value.commandId !== request.command.commandId
        )
          throw new Error(
            "A setup administration must have its actual receipt.",
          );
        if (request.command.payload.kind === "acknowledgePreparation")
          excluded.push({
            requestId: request.id,
            reason: "preparation acknowledgement",
          });
        else if (request.command.payload.kind === "finishInitialProfile")
          excluded.push({
            requestId: request.id,
            reason: "initial profile confirmation",
          });
        else throw new Error("An unrelated administration cannot be setup.");
        continue;
      default:
        throw new Error(`Unexpected setup request ${request.kind}.`);
    }
  }
  const boundary: SetupTrafficBoundary = {
    documentId: completed.documentId,
    openingId: opening.id,
    finalReadId: finalRead.id,
    excluded,
  };
  const classified = partition(completed, boundary);
  boundaries.set(page, boundary);
  await test.info().attach("actual-initial-setup-traffic", {
    body: JSON.stringify(
      {
        boundary,
        preparationHash: preparation.document.preparationHash,
        initialDirectory: before,
        finalDirectory: finalDirectory.value,
        finalApplication,
        ...classified,
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
}

async function currentBoundary(page: Page) {
  const boundary = boundaries.get(page);
  if (!boundary) return null;
  const documentId: unknown = await page.evaluate(
    "window.initialSetupDocumentId",
  );
  if (documentId !== boundary.documentId) {
    boundaries.delete(page);
    return null;
  }
  return boundary;
}

export async function scenarioRequests(
  page: Page,
  requests: readonly WorkerRequest[],
): Promise<WorkerRequest[]> {
  const boundary = await currentBoundary(page);
  if (!boundary) return [...requests];
  const excluded = new Set(boundary.excluded.map((entry) => entry.requestId));
  for (const id of excluded)
    if (!requests.some((request) => request.id === id))
      throw new Error(
        `The original recorder is missing actual setup request ${id}.`,
      );
  return requests.filter((request) => !excluded.has(request.id));
}

export async function scenarioResponses(
  page: Page,
  responses: readonly WorkerResponse[],
): Promise<WorkerResponse[]> {
  const boundary = await currentBoundary(page);
  if (!boundary) return [...responses];
  const excluded = new Set(boundary.excluded.map((entry) => entry.requestId));
  for (const id of excluded)
    if (!responses.some((response) => response.id === id))
      throw new Error(
        `The original recorder is missing actual setup reply ${id}.`,
      );
  return responses.filter((response) => !excluded.has(response.id));
}
