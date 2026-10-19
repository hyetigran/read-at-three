import { browserConfiguration } from "./browser-configuration.ts";
import {
  ShellError,
  PublicationResourceError,
  type ShellPolicy,
} from "@readatthree/teaching";
import { createShellCache, serveInstalledPublication } from "./shell-cache.ts";
import {
  selectShellRequest,
  isShellApplicationNavigation,
} from "./shell-request.ts";
import { createShellRecovery } from "./shell-recovery.ts";
import { shellResourceHeaders } from "./shell-response-policy.ts";

declare const __READING_SHELL_POLICY__: ShellPolicy;
declare const self: ServiceWorkerGlobalScope;
const scope = self;
const policy = __READING_SHELL_POLICY__;
if (browserConfiguration.kind !== "installed")
  throw new Error("Signed service worker requires installed configuration");
const publicationPolicy = browserConfiguration.publication;
const shell = createShellCache(policy, scope.location.origin);
const recovery = createShellRecovery({ origin: scope.location.origin, shell });
function bounded<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  return run(controller.signal).finally(() => clearTimeout(timer));
}
scope.addEventListener("install", (event) =>
  event.waitUntil(bounded((signal) => shell.install(signal))),
);
scope.addEventListener("activate", (event) =>
  event.waitUntil(scope.clients.claim()),
);
scope.addEventListener("message", (event) => {
  const data: unknown = event.data;
  if (
    !data ||
    typeof data !== "object" ||
    !("kind" in data) ||
    data.kind !== "verify-shell" ||
    !("requestId" in data) ||
    typeof data.requestId !== "string" ||
    !/^[a-f0-9]{32}$/.test(data.requestId) ||
    !("applicationVersion" in data) ||
    !("buildHash" in data)
  )
    return;
  const port = event.ports[0];
  if (!port) return;
  const source = event.source;
  if (
    !source ||
    !("url" in source) ||
    new URL(source.url).origin !== scope.location.origin
  ) {
    port.close();
    return;
  }
  event.waitUntil(
    bounded(async (signal) => {
      try {
        const current = await shell.current(signal);
        const result =
          data.applicationVersion === policy.applicationVersion &&
          data.buildHash === current.hash
            ? { kind: "controlled-verified", hash: current.hash }
            : { kind: "corrupt", reason: "controller" };
        port.postMessage({
          kind: "shell-result",
          requestId: data.requestId,
          applicationVersion: policy.applicationVersion,
          result,
        });
      } catch (error) {
        port.postMessage({
          kind: "shell-result",
          requestId: data.requestId,
          applicationVersion: policy.applicationVersion,
          result:
            error instanceof ShellError
              ? error.failure
              : { kind: "unavailable", reason: "cache" },
        });
      } finally {
        port.close();
      }
    }),
  );
});
scope.addEventListener("fetch", (event) => {
  event.respondWith(
    bounded(async (signal) => {
      const recovered = await recovery.handle(event.request, signal);
      if (recovered) return recovered;
      try {
        const current = await shell.current(signal);
        const decision = selectShellRequest({
          shell: current,
          policy,
          origin: scope.location.origin,
          request: event.request,
        });
        switch (decision.kind) {
          case "refused":
            return new Response(null, {
              status: 404,
              headers: shellResourceHeaders("text/plain"),
            });
          case "download":
            return fetch(event.request, {
              redirect: "error",
              credentials: "omit",
              cache: "no-store",
              signal,
            });
          case "shell":
            return shell.serve(current, decision.path, signal);
          case "publication":
            return serveInstalledPublication({
              publicationPolicy,
              request: event.request,
              signal,
            }).catch(
              (error: unknown) =>
                new Response(null, {
                  status: 503,
                  headers: {
                    ...shellResourceHeaders("text/plain"),
                    "X-Reading-Content":
                      error instanceof ShellError ||
                      error instanceof PublicationResourceError
                        ? error.failure.kind
                        : "unavailable",
                  },
                }),
            );
          default: {
            const exhaustive: never = decision;
            throw new Error(String(exhaustive));
          }
        }
      } catch (error) {
        if (isShellApplicationNavigation(event.request, scope.location.origin))
          return recovery.unavailable(event.request, error);
        return new Response(null, {
          status: 503,
          headers: {
            ...shellResourceHeaders("text/plain"),
            "X-Reading-Shell":
              error instanceof ShellError ||
              error instanceof PublicationResourceError
                ? error.failure.kind
                : "unavailable",
            ...(error instanceof ShellError && error.failure.kind === "missing"
              ? { "X-Reading-Shell-Path": error.failure.path }
              : {}),
          },
        });
      }
    }),
  );
});
