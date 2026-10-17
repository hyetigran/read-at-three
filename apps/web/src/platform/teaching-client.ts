import { TeachingRecoveryError } from "@readatthree/react-integration";
import type {
  WritingApplication,
  RecoveryOpening,
  CourseApplication,
  CourseReadTarget,
} from "@readatthree/teaching";
import { parseResponse, parseWorkerRequestId } from "./protocol.ts";
import type {
  WorkerRequest,
  WorkerResponse,
  WorkerRequestId,
} from "./protocol.ts";

export function createBrowserTeachingClient() {
  let worker: Worker | undefined;
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
    async connect(opening: RecoveryOpening) {
      dispose();
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
        opening,
      });
      if (response.kind !== "inventory")
        throw new Error(
          "The local store returned an invalid recovery inventory.",
        );
      return response.value;
    },
    async read(target: CourseReadTarget = { kind: "cursor" }) {
      const response = await request({ id: id(), kind: "read", target });
      if (response.kind !== "application")
        throw new Error("The saved place could not be read.");
      const application = response.value;
      if (application.kind === "recovery")
        throw new TeachingRecoveryError(application);
      return {
        courseId: application.courseId,
        projection: application.projection,
        application,
      };
    },
    async readWork(input: Parameters<CourseApplication["readWork"]>[0]) {
      const response = await request({ id: id(), kind: "readWork", ...input });
      if (response.kind !== "work")
        throw new Error("Saved work could not be read.");
      return response.value;
    },
    async readPracticeControls(
      binding: Parameters<WritingApplication["readPracticeControls"]>[0],
    ) {
      const response = await request({
        id: id(),
        kind: "readPracticeControls",
        binding,
      });
      if (response.kind !== "practiceControls")
        throw new Error("Practice tools could not be read.");
      return response.value;
    },
    async dispatch(command: Parameters<WritingApplication["dispatch"]>[0]) {
      const response = await request({ id: id(), kind: "dispatch", command });
      if (response.kind !== "receipt")
        throw new Error("The local save could not be confirmed.");
      return response.value;
    },
    async readInk({ token }: Parameters<WritingApplication["readInk"]>[0]) {
      const response = await request({ id: id(), kind: "readInk", token });
      if (response.kind !== "inkSnapshot")
        throw new Error("The writing could not be restored.");
      return response.value;
    },
    async dispatchInk(
      command: Parameters<WritingApplication["dispatchInk"]>[0],
    ) {
      const response = await request({
        id: id(),
        kind: "dispatchInk",
        command,
      });
      if (response.kind !== "inkReceipt")
        throw new Error("The writing save could not be confirmed.");
      return response.value;
    },
    async recoverInk({
      recoveryId,
      command,
    }: Parameters<WritingApplication["recoverInk"]>[0]) {
      const response = await request({
        id: id(),
        kind: "recoverInk",
        recoveryId,
        command,
      });
      if (response.kind !== "inkReceipt")
        throw new Error("The writing recovery could not be confirmed.");
      return response.value;
    },
    async recoverTeaching({
      recoveryId,
      command,
    }: Parameters<WritingApplication["recoverTeaching"]>[0]) {
      const response = await request({
        id: id(),
        kind: "recoverTeaching",
        recoveryId,
        command,
      });
      if (response.kind !== "receipt")
        throw new Error("The teaching recovery could not be confirmed.");
      return response.value;
    },
    async reconcileRecovery({
      recoveryId,
      choice,
    }: Parameters<WritingApplication["reconcileRecovery"]>[0]) {
      const response = await request({
        id: id(),
        kind: "reconcileRecovery",
        recoveryId,
        choice,
      });
      if (response.kind !== "projection")
        throw new Error("The saved place could not reopen.");
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
  "read" | "readWork" | "dispatch" | "recoverTeaching" | "readPracticeControls"
>;
