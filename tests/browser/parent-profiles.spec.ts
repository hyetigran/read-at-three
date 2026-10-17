import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
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

test("fresh parent setup confirms the existing anonymous child only after exact preparation acknowledgement and animal Continue", async ({
  page,
}, testInfo) => {
  await page.addInitScript(`
    const NativeWorker = window.Worker;
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
        super.postMessage(value, options);
      }
    };
  `);
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
});
