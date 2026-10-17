import { TeachingRecoveryError } from "@readatthree/react-integration";
import type {
  SelectedApplication,
  SelectedRecoveryOpening,
  PreparationAvailability,
} from "@readatthree/teaching";
import { loadBrowserPreparation, preparationInput } from "./preparation.ts";
type Input<Method extends keyof SelectedApplication> = Parameters<
  SelectedApplication[Method]
>[0];
import { parseResponse, parseWorkerRequestId } from "./protocol.ts";
import type {
  WorkerRequest,
  WorkerResponse,
  WorkerRequestId,
} from "./protocol.ts";

export function createBrowserTeachingClient() {
  let worker: Worker | undefined;
  let connectionRevision = 0;
  let preparation: PreparationAvailability = {
    kind: "unavailable",
    reason: "missing",
  };
  let lossListener = () => {};
  const pending = new Map<
    WorkerRequestId,
    {
      resolve: (response: WorkerResponse) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();
  function dispose() {
    connectionRevision++;
    preparation = { kind: "unavailable", reason: "missing" };
    worker?.terminate();
    worker = undefined;
    lossListener();
    for (const request of pending.values()) {
      clearTimeout(request.timeout);
      request.reject(
        new Error(
          "The local store connection closed. Retry to recover the same saved work.",
        ),
      );
    }
    pending.clear();
  }
  function request(value: WorkerRequest): Promise<WorkerResponse> {
    const active = worker;
    if (!active)
      return Promise.reject(new Error("The local store is unavailable."));
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(dispose, 15000);
      pending.set(value.id, { resolve, reject, timeout });
      active.postMessage(value);
    });
  }
  const id = () => parseWorkerRequestId(crypto.randomUUID());
  return {
    onLoss(listener: () => void) {
      lossListener = listener;
    },
    async connect(opening: SelectedRecoveryOpening) {
      dispose();
      const ticket = connectionRevision;
      if (
        !window.isSecureContext ||
        !navigator.storage?.getDirectory ||
        !navigator.locks ||
        typeof Worker === "undefined"
      )
        throw new Error(
          "This browser cannot save reading progress safely. Use a supported browser with local storage available, then retry.",
        );
      const contentResponse = await fetch("/curriculum/development.json", {
        cache: "no-store",
      });
      if (!contentResponse.ok)
        throw new Error(
          "The required lesson content is unavailable. Keep saved work and retry.",
        );
      const content: unknown = await contentResponse.json();
      const availablePreparation = await loadBrowserPreparation();
      if (ticket !== connectionRevision)
        throw new Error("This local store connection was retired.");
      const connection = new Worker(
        new URL("./teaching.worker.ts", import.meta.url),
        {
          type: "module",
        },
      );
      worker = connection;
      connection.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (worker !== connection) return;
        try {
          const result = parseResponse(event.data);
          const waiting = pending.get(result.id);
          if (!waiting) return;
          pending.delete(result.id);
          clearTimeout(waiting.timeout);
          if (result.kind === "failed")
            waiting.reject(new Error(result.message));
          else waiting.resolve(result);
        } catch {
          dispose();
        }
      });
      const lost = () => {
        if (worker === connection) dispose();
      };
      connection.addEventListener("error", lost);
      connection.addEventListener("messageerror", lost);
      const response = await request({
        id: id(),
        kind: "openRecovery",
        content,
        preparation: preparationInput(availablePreparation),
        opening,
      });
      if (response.kind !== "inventory")
        throw new Error(
          "The local store returned an invalid recovery inventory.",
        );
      if (ticket !== connectionRevision || worker !== connection)
        throw new Error("This local store connection was retired.");
      preparation = availablePreparation;
      return response.value;
    },
    readPreparation() {
      return {
        connectionTicket: connectionRevision,
        availability: preparation,
      };
    },
    connectionTicket: () => connectionRevision,
    async read(input: Input<"readApplication">) {
      const response = await request({ id: id(), kind: "read", input });
      if (response.kind !== "application")
        throw new Error("The saved place could not be read.");
      const { directory, application } = response.value;
      if (application.kind === "recovery")
        throw new TeachingRecoveryError(application);
      return {
        directory,
        courseId: application.courseId,
        projection: application.projection,
        application,
      };
    },
    async readDirectory() {
      const response = await request({ id: id(), kind: "readDirectory" });
      if (response.kind !== "directory")
        throw new Error("Child profiles could not be loaded.");
      return response.value;
    },
    async readWork(input: Input<"readWork">) {
      const response = await request({ id: id(), kind: "readWork", input });
      if (response.kind !== "work")
        throw new Error("Saved work could not be read.");
      return response.value;
    },
    async readPracticeControls(input: Input<"readPracticeControls">) {
      const response = await request({
        id: id(),
        kind: "readPracticeControls",
        input,
      });
      if (response.kind !== "practiceControls")
        throw new Error("Practice tools could not be read.");
      return response.value;
    },
    async execute(operation: Input<"execute">) {
      const response = await request({ id: id(), kind: "execute", operation });
      if (response.kind !== "execution")
        throw new Error("The saved action could not be confirmed.");
      return response.value;
    },
    async administer(command: Input<"administer">) {
      const response = await request({ id: id(), kind: "administer", command });
      if (response.kind !== "profileReceipt")
        throw new Error("The profile change could not be confirmed.");
      return response.value;
    },
    async readDeparture(input: Input<"readDeparture">) {
      const response = await request({
        id: id(),
        kind: "readDeparture",
        selection: input.selection,
      });
      if (response.kind !== "departure")
        throw new Error(
          "The current child’s saved work could not be confirmed.",
        );
      return response.value;
    },
    async readInk(input: Input<"readInk">) {
      const response = await request({ id: id(), kind: "readInk", input });
      if (response.kind !== "inkSnapshot")
        throw new Error("The writing could not be restored.");
      return response.value;
    },
    async recoverInk(input: Input<"recoverInk">) {
      const response = await request({
        id: id(),
        kind: "recoverInk",
        ...input,
      });
      if (response.kind !== "inkRecovery")
        throw new Error("Saved writing could not be recovered.");
      return response.value;
    },
    async recoverTeaching(input: Input<"recoverTeaching">) {
      const response = await request({
        id: id(),
        kind: "recoverTeaching",
        ...input,
      });
      if (response.kind !== "teachingRecovery")
        throw new Error("The saved lesson could not be recovered.");
      return response.value;
    },
    async recoverAdministration(input: Input<"recoverAdministration">) {
      const response = await request({
        id: id(),
        kind: "recoverAdministration",
        ...input,
      });
      if (response.kind !== "administrationRecovery")
        throw new Error("The profile change could not be recovered.");
      return response.value;
    },
    async reconcileRecovery(input: Input<"reconcileRecovery">) {
      const response = await request({
        id: id(),
        kind: "reconcileRecovery",
        ...input,
      });
      if (response.kind !== "reconciled")
        throw new Error("Saved work could not be reopened.");
      return response.value;
    },
    close: dispose,
  };
}
export type BrowserTeachingClient = ReturnType<
  typeof createBrowserTeachingClient
>;

export type InkLifecycleClient = Omit<
  BrowserTeachingClient,
  "readWork" | "readPracticeControls" | "readPreparation"
>;
