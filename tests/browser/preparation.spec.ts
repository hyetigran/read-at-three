import { createHash, randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  parsePreparationAvailability,
  prepareCommand,
  prepareProfileAdministration,
} from "@readatthree/teaching";
import type { ProfileDirectory } from "@readatthree/teaching";
import {
  parseResponse,
  parseWorkerRequestId,
} from "../../apps/web/src/platform/protocol.ts";
import type { WorkerRequest } from "../../apps/web/src/platform/protocol.ts";
import { useLegacyContent } from "./legacy-content.ts";

const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
const ids = () => randomUUID();
async function request(page: Page, value: WorkerRequest) {
  const result: unknown = await page.evaluate((value) => {
    if (
      !("preparationRequest" in window) ||
      typeof window.preparationRequest !== "function"
    )
      throw new Error("Preparation tracer unavailable.");
    return window.preparationRequest(value);
  }, value);
  return parseResponse(result);
}
async function directory(page: Page): Promise<ProfileDirectory> {
  const result = await request(page, {
    id: parseWorkerRequestId(ids()),
    kind: "readDirectory",
  });
  if (result.kind !== "directory")
    throw new Error("Directory response required.");
  return result.value;
}

test("verified fixture preparation acknowledges and finishes the existing profile on the actual Worker, then missing guidance preserves teaching", async ({
  page,
}) => {
  await useLegacyContent(page);
  await page.addInitScript(`
    const NativeWorker = window.Worker;
    window.preparationRequests=[];
    window.preparationReplies=[];
    window.preparationRequest=value=>new Promise((resolve,reject)=>{
      const worker=window.preparationWorker;
      const timeout=setTimeout(()=>{worker.removeEventListener('message',listener);reject(Error('Preparation tracer timed out.'));},15000);
      const listener=event=>{if(event.data?.id===value.id){clearTimeout(timeout);worker.removeEventListener('message',listener);resolve(event.data);}};
      worker.addEventListener('message',listener);
      worker.postMessage(value);
    });
    window.Worker=class extends NativeWorker {
      constructor(url,options){super(url,options);window.preparationWorker=this;this.addEventListener('message',event=>window.preparationReplies.push(structuredClone(event.data)));}
      postMessage(value,options){window.preparationRequests.push(structuredClone(value));super.postMessage(value,options);}
    };
  `);
  await page.goto("/");
  await page.waitForFunction(
    "window.preparationReplies.some(value=>value.kind==='inventory')",
  );
  const opening: unknown = await page.evaluate(
    "window.preparationRequests.find(value=>value.kind==='openRecovery').preparation",
  );
  const verified = await parsePreparationAvailability(opening, hash);
  expect(verified.kind).toBe("available");
  if (verified.kind !== "available")
    throw new Error("Fixture preparation required.");
  expect(verified.document.body.provenance.kind).toBe("synthetic");
  let before = await directory(page);
  expect(before.profiles).toHaveLength(1);
  const owner = before.selection.owner;
  expect(before.initialSetup.kind).toBe("firstLaunch");
  expect(before.preparation).toEqual({
    kind: "required",
    requiredHash: verified.document.preparationHash,
    acknowledgedHash: null,
  });
  const acknowledge = await prepareProfileAdministration({
    selection: before.selection,
    ids,
    hash,
    intent: {
      kind: "acknowledgePreparation",
      directory: before.administration,
      hash: verified.document.preparationHash,
    },
  });
  const acknowledged = await request(page, {
    id: parseWorkerRequestId(ids()),
    kind: "administer",
    command: acknowledge,
  });
  expect(acknowledged.kind).toBe("profileReceipt");
  if (
    acknowledged.kind !== "profileReceipt" ||
    acknowledged.value.kind !== "profileCommitted"
  )
    throw new Error("Acknowledgement did not commit.");
  before = await directory(page);
  const first = before.profiles[0];
  if (!first) throw new Error("Initial child missing.");
  const finish = await prepareProfileAdministration({
    selection: before.selection,
    ids,
    hash,
    intent: {
      kind: "finishInitialProfile",
      directory: before.administration,
      target: first.edit,
      preferences: { avatarId: "rabbit" },
    },
  });
  const finished = await request(page, {
    id: parseWorkerRequestId(ids()),
    kind: "administer",
    command: finish,
  });
  expect(finished.kind === "profileReceipt" && finished.value.kind).toBe(
    "profileCommitted",
  );
  before = await directory(page);
  expect(before.profiles).toHaveLength(1);
  expect(before.selection.owner).toEqual(owner);
  expect(before.initialSetup.kind).toBe("complete");
  const initial = await request(page, {
    id: parseWorkerRequestId(ids()),
    kind: "read",
    input: { selection: before.selection, target: { kind: "cursor" } },
  });
  if (
    initial.kind !== "application" ||
    initial.value.application.kind !== "ready"
  )
    throw new Error("Application read required.");
  const command = await prepareCommand({
    projection: initial.value.application.projection,
    ids,
    hash,
  });
  const started = await request(page, {
    id: parseWorkerRequestId(ids()),
    kind: "execute",
    operation: { kind: "teaching", selection: before.selection, command },
  });
  expect(started.kind === "execution" && started.value.result.kind).toBe(
    "committed",
  );
  await page.goto("/teaching");
  await expect(page.getByText("Fixture model.", { exact: true })).toBeVisible();
  expect((await directory(page)).preparation).toEqual({
    kind: "acknowledged",
    hash: verified.document.preparationHash,
  });
  for (const invalid of [false, true]) {
    await page.route("**/preparation/development.json", (route) =>
      route.fulfill({
        status: invalid ? 200 : 404,
        contentType: "application/json",
        body: invalid ? '{"kind":"available","package":{}}' : "{}",
      }),
    );
    await page.reload();
    await expect(
      page.getByText("Fixture model.", { exact: true }),
    ).toBeVisible();
    const retained = await directory(page);
    expect(retained.selection.owner).toEqual(owner);
    expect(retained.initialSetup.kind).toBe("complete");
    expect(retained.preparation).toEqual({
      kind: "unavailable",
      acknowledgedHash: verified.document.preparationHash,
    });
    const retry = await prepareProfileAdministration({
      selection: retained.selection,
      ids,
      hash,
      intent: {
        kind: "acknowledgePreparation",
        directory: retained.administration,
        hash: verified.document.preparationHash,
      },
    });
    const rejected = await request(page, {
      id: parseWorkerRequestId(ids()),
      kind: "administer",
      command: retry,
    });
    expect(
      rejected.kind === "profileReceipt" &&
        rejected.value.kind === "rejected" &&
        rejected.value.code,
    ).toBe("preparation-unavailable");
    await page.unroute("**/preparation/development.json");
  }
});
