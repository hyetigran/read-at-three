import { prepareCommand } from "@readatthree/teaching";
import type { Projection, TeachingCommand } from "@readatthree/teaching";
import { hashText } from "./hash.ts";
import { parseResponse } from "./protocol.ts";
import type { WorkerRequest, WorkerResponse } from "./protocol.ts";
import { isTeachingViewport } from "./viewport.ts";

export function createBrowserTeachingClient() {
  let worker: Worker | undefined;
  let opened: Promise<Projection> | undefined;
  const pending = new Map<
    string,
    {
      resolve: (response: WorkerResponse) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();
  function dispose() {
    worker?.terminate();
    worker = undefined;
    opened = undefined;
    for (const request of pending.values()) {
      clearTimeout(request.timeout);
      request.reject(
        new Error(
          "The local store connection closed. Reopen it before retrying the same saved action.",
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
      const timeout = setTimeout(() => dispose(), 15000);
      pending.set(value.id, { resolve, reject, timeout });
      active.postMessage(value);
    });
  }
  async function open(): Promise<Projection> {
    if (opened) return opened;
    opened = (async () => {
      if (
        !window.isSecureContext ||
        !navigator.storage?.getDirectory ||
        !navigator.locks ||
        typeof Worker === "undefined"
      )
        return {
          kind: "recovery",
          code: "unsupported-storage",
          message:
            "This browser cannot save reading progress safely. Use a supported browser with local storage available, then retry.",
        } satisfies Projection;
      const contentResponse = await fetch("/curriculum/development.json", {
        cache: "no-store",
      });
      if (!contentResponse.ok)
        return {
          kind: "recovery",
          code: "content-missing",
          message:
            "The supplied lesson content is unavailable. Keep saved work and install the required content before retrying.",
        } satisfies Projection;
      const content: unknown = await contentResponse.json();
      worker = new Worker(new URL("./teaching.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.addEventListener("message", (event: MessageEvent<unknown>) => {
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
      worker.addEventListener("error", () => dispose());
      worker.addEventListener("messageerror", () => dispose());
      try {
        const response = await request({
          id: crypto.randomUUID(),
          kind: "open",
          content,
        });
        if (response.kind !== "projection")
          throw new Error("The local store returned an invalid opening state.");
        return response.value;
      } catch (error) {
        dispose();
        return {
          kind: "recovery",
          code: "storage-initialization-failed",
          message:
            error instanceof Error
              ? error.message
              : "The local store could not open. Keep saved work and retry.",
        } satisfies Projection;
      }
    })();
    try {
      return await opened;
    } catch {
      dispose();
      return {
        kind: "recovery",
        code: "content-missing",
        message:
          "The required lesson content could not be loaded. Keep saved work and retry.",
      };
    }
  }
  return {
    open,
    async read(): Promise<Projection> {
      const initial = await open();
      if (initial.kind === "recovery") return initial;
      const response = await request({ id: crypto.randomUUID(), kind: "read" });
      if (response.kind !== "projection")
        throw new Error(
          "The local store returned an invalid reading position.",
        );
      return response.value;
    },
    prepare(projection: Projection) {
      return prepareCommand({
        projection,
        ids: () => crypto.randomUUID(),
        hash: hashText,
      });
    },
    async dispatch(command: TeachingCommand) {
      if (!isTeachingViewport() || document.visibilityState !== "visible")
        throw new Error(
          "Return to a supported landscape reading window before continuing.",
        );
      const current = await open();
      if (current.kind === "recovery") throw new Error(current.message);
      const response = await request({
        id: crypto.randomUUID(),
        kind: "dispatch",
        command,
      });
      if (response.kind !== "receipt")
        throw new Error("The local save could not be confirmed.");
      return response.value;
    },
    async reopen() {
      dispose();
      return open();
    },
    close: dispose,
  };
}
