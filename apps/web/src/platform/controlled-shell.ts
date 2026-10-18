import {
  ShellError,
  shellDescriptorPath,
  shellServiceWorkerPath,
  verifyShellDescriptor,
  type ShellObservation,
  type ShellPolicy,
} from "@readatthree/teaching";
import { boundedShellResponse, webPublicationCrypto } from "./shell-cache.ts";

function failure(value: unknown): ShellObservation | undefined {
  if (!value || typeof value !== "object" || !("kind" in value)) return;
  if (
    value.kind === "missing" &&
    "path" in value &&
    typeof value.path === "string" &&
    value.path.length <= 1024
  )
    return { kind: "missing", path: value.path };
  if (!("reason" in value)) return;
  if (value.kind === "corrupt")
    switch (value.reason) {
      case "descriptor":
      case "inventory":
      case "resource":
      case "controller":
        return { kind: "corrupt", reason: value.reason };
    }
  if (value.kind === "unavailable")
    switch (value.reason) {
      case "cache":
      case "network":
      case "crypto":
      case "cancelled":
      case "uncontrolled":
      case "waiting":
      case "timeout":
        return { kind: "unavailable", reason: value.reason };
    }
}
export async function registerOfflineShell(
  policy: ShellPolicy,
): Promise<ServiceWorkerRegistration> {
  if (import.meta.env.DEV)
    throw new Error("Development server does not register an offline shell");
  if (!isSecureContext || !("serviceWorker" in navigator))
    throw new Error("Service workers unavailable");
  return navigator.serviceWorker.register(
    `/${shellServiceWorkerPath(policy)}`,
    { scope: "/", type: "module", updateViaCache: "none" },
  );
}
export async function verifyControlledShell(
  input: Readonly<{ policy: ShellPolicy; signal: AbortSignal }>,
): Promise<ShellObservation> {
  if (input.signal.aborted) return { kind: "unavailable", reason: "cancelled" };
  if (!("serviceWorker" in navigator))
    return { kind: "unavailable", reason: "uncontrolled" };
  const cancellation = new AbortController();
  const abort = () => cancellation.abort();
  input.signal.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 65000);
  async function observe<T>(run: () => Promise<T>): Promise<T> {
    cancellation.signal.throwIfAborted();
    return new Promise<T>((resolve, reject) => {
      const cancelled = () => reject(cancellation.signal.reason);
      cancellation.signal.addEventListener("abort", cancelled, { once: true });
      Promise.resolve()
        .then(() => {
          cancellation.signal.throwIfAborted();
          return run();
        })
        .then(resolve, reject)
        .finally(() =>
          cancellation.signal.removeEventListener("abort", cancelled),
        );
    });
  }
  try {
    cancellation.signal.throwIfAborted();
    const controller = navigator.serviceWorker.controller;
    const registration = await observe(() =>
      navigator.serviceWorker.getRegistration("/"),
    );
    if (!controller || controller.state !== "activated")
      return {
        kind: "unavailable",
        reason: registration?.waiting ? "waiting" : "uncontrolled",
      };
    const expectedWorker = new URL(
      `/${shellServiceWorkerPath(input.policy)}`,
      location.origin,
    ).href;
    if (
      registration?.waiting?.scriptURL === expectedWorker &&
      controller.scriptURL !== expectedWorker
    )
      return { kind: "unavailable", reason: "waiting" };
    if (
      controller.scriptURL !==
        new URL(`/${shellServiceWorkerPath(input.policy)}`, location.origin)
          .href ||
      registration?.active !== controller
    )
      return { kind: "corrupt", reason: "controller" };
    cancellation.signal.throwIfAborted();
    const url = new URL(`/${shellDescriptorPath}`, location.origin).href;
    const response = await observe(() =>
      fetch(url, {
        signal: cancellation.signal,
        redirect: "error",
        cache: "no-store",
        credentials: "omit",
      }),
    );
    if (response.url !== url) return { kind: "corrupt", reason: "descriptor" };
    if (response.status !== 200) {
      const state = response.headers.get("X-Reading-Shell");
      if (state === "missing") {
        const path = response.headers.get("X-Reading-Shell-Path");
        if (path && path.length <= 1024 && /^[A-Za-z0-9_./-]+$/.test(path))
          return { kind: "missing", path };
        return { kind: "unavailable", reason: "cache" };
      }
      if (state === "corrupt") return { kind: "corrupt", reason: "resource" };
      return { kind: "unavailable", reason: "cache" };
    }
    const raw = await observe(() =>
      boundedShellResponse(response, 1048576, cancellation.signal),
    );
    const current = await observe(() =>
      verifyShellDescriptor({
        raw,
        policy: input.policy,
        crypto: webPublicationCrypto,
      }),
    );
    const requestId = Array.from(
      crypto.getRandomValues(new Uint8Array(16)),
      (value) => value.toString(16).padStart(2, "0"),
    ).join("");
    return await new Promise<ShellObservation>((resolve) => {
      const channel = new MessageChannel();
      let finished = false;
      const finish = (result: ShellObservation) => {
        if (finished) return;
        finished = true;
        cancellation.signal.removeEventListener("abort", cancelled);
        channel.port1.close();
        channel.port2.close();
        resolve(result);
      };
      const cancelled = () =>
        finish({
          kind: "unavailable",
          reason: input.signal.aborted ? "cancelled" : "timeout",
        });
      cancellation.signal.addEventListener("abort", cancelled, { once: true });
      channel.port1.onmessage = (event) => {
        const data: unknown = event.data;
        if (
          !data ||
          typeof data !== "object" ||
          !("kind" in data) ||
          data.kind !== "shell-result" ||
          !("requestId" in data) ||
          data.requestId !== requestId ||
          !("applicationVersion" in data) ||
          data.applicationVersion !== input.policy.applicationVersion ||
          !("result" in data)
        )
          return;
        if (
          navigator.serviceWorker.controller !== controller ||
          controller.state !== "activated"
        )
          return finish({ kind: "corrupt", reason: "controller" });
        const result: unknown = data.result;
        if (
          result &&
          typeof result === "object" &&
          "kind" in result &&
          result.kind === "controlled-verified" &&
          "hash" in result &&
          result.hash === current.hash
        )
          finish({ kind: "controlled-verified", hash: current.hash });
        else
          finish(failure(result) ?? { kind: "corrupt", reason: "controller" });
      };
      if (cancellation.signal.aborted) cancelled();
      else
        try {
          controller.postMessage(
            {
              kind: "verify-shell",
              requestId,
              applicationVersion: input.policy.applicationVersion,
              buildHash: current.hash,
            },
            [channel.port2],
          );
        } catch {
          finish({ kind: "unavailable", reason: "cache" });
        }
    });
  } catch (error) {
    if (error instanceof ShellError) return error.failure;
    return {
      kind: "unavailable",
      reason: input.signal.aborted
        ? "cancelled"
        : cancellation.signal.aborted
          ? "timeout"
          : "network",
    };
  } finally {
    clearTimeout(timer);
    input.signal.removeEventListener("abort", abort);
  }
}
