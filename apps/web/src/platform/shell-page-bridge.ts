import {
  increment,
  parseCounter,
  parseShellBridgeRequest,
  type ShellHash,
  type ShellPolicy,
} from "@readatthree/teaching";
import { verifyControlledShell } from "./controlled-shell.ts";

export function createPageShellBridge(
  input: Readonly<{
    port: MessagePort;
    policy: ShellPolicy;
    signal: AbortSignal;
  }>,
) {
  let closed = false;
  let epoch = parseCounter("0");
  let prepared:
    | Readonly<{
        epoch: typeof epoch;
        hash: ShellHash;
        controller: ServiceWorker;
      }>
    | undefined;
  function invalidate() {
    if (closed) return;
    epoch = increment(epoch);
    prepared = undefined;
    input.port.postMessage({ kind: "invalidated", epoch });
  }
  function close() {
    if (closed) return;
    invalidate();
    closed = true;
    navigator.serviceWorker.removeEventListener("controllerchange", invalidate);
    input.signal.removeEventListener("abort", close);
    input.port.close();
  }
  input.port.onmessage = (event: MessageEvent<unknown>) => {
    let request: ReturnType<typeof parseShellBridgeRequest>;
    try {
      request = parseShellBridgeRequest(event.data);
    } catch {
      close();
      return;
    }
    if (closed || input.signal.aborted) return;
    if (request.kind === "current") {
      input.port.postMessage({
        ...request,
        current:
          prepared?.epoch === request.epoch &&
          prepared.hash === request.hash &&
          epoch === request.epoch &&
          navigator.serviceWorker.controller === prepared.controller &&
          prepared.controller.state === "activated",
      });
      return;
    }
    const startingEpoch = epoch;
    const controller = navigator.serviceWorker.controller;
    void verifyControlledShell({ policy: input.policy, signal: input.signal })
      .then((result) => {
        if (closed || input.signal.aborted) return;
        if (
          startingEpoch !== epoch ||
          !controller ||
          controller !== navigator.serviceWorker.controller ||
          controller.state !== "activated"
        ) {
          input.port.postMessage({
            kind: "refused",
            requestId: request.requestId,
            failure: { kind: "corrupt", reason: "controller" },
          });
        } else if (result.kind === "controlled-verified") {
          prepared = { epoch, hash: result.hash, controller };
          input.port.postMessage({
            kind: "prepared",
            requestId: request.requestId,
            epoch,
            hash: result.hash,
          });
        } else
          input.port.postMessage({
            kind: "refused",
            requestId: request.requestId,
            failure: result,
          });
      })
      .catch(() => {
        if (!closed)
          input.port.postMessage({
            kind: "refused",
            requestId: request.requestId,
            failure: { kind: "unavailable", reason: "cache" },
          });
      });
  };
  input.port.onmessageerror = close;
  navigator.serviceWorker.addEventListener("controllerchange", invalidate);
  input.signal.addEventListener("abort", close, { once: true });
  input.port.start();
  if (input.signal.aborted) close();
  return { close };
}
