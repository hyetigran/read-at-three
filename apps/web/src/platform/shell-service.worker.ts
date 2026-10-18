import {
  ShellError,
  PublicationResourceError,
  publicationLimits,
  type ShellPolicy,
} from "@readatthree/teaching";
import { createShellCache, serveInstalledPublication } from "./shell-cache.ts";

declare const __READING_SHELL_POLICY__: ShellPolicy;
declare const self: ServiceWorkerGlobalScope;
const scope = self;
const policy = __READING_SHELL_POLICY__;
const shell = createShellCache(policy, scope.location.origin);
function bounded<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  return run(controller.signal).finally(() => clearTimeout(timer));
}
scope.addEventListener("install", (event) =>
  event.waitUntil(bounded((signal) => shell.install(signal))),
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
  const url = new URL(event.request.url);
  if (url.origin !== scope.location.origin || event.request.method !== "GET")
    return;
  if (url.pathname.startsWith("/_reading/download/")) {
    const parts = url.pathname.slice("/_reading/download/".length).split("/");
    const path = parts.slice(2).join("/");
    if (
      parts[0] !== policy.mode ||
      !/^[a-f0-9]{64}$/.test(parts[1] ?? "") ||
      path.length > publicationLimits.pathLength ||
      !/^[A-Za-z0-9_-][A-Za-z0-9_./-]*$/.test(path) ||
      parts
        .slice(2)
        .some((part) => part === "" || part === "." || part === "..") ||
      url.search ||
      url.hash ||
      event.request.destination !== ""
    )
      event.respondWith(Promise.resolve(new Response(null, { status: 404 })));
    return;
  }
  if (url.pathname.startsWith("/_reading/content/")) {
    event.respondWith(
      bounded((signal) =>
        serveInstalledPublication({ policy, request: event.request, signal }),
      ).catch(
        (error: unknown) =>
          new Response(null, {
            status: 503,
            headers: {
              "X-Reading-Content":
                error instanceof ShellError ||
                error instanceof PublicationResourceError
                  ? error.failure.kind
                  : "unavailable",
            },
          }),
      ),
    );
    return;
  }
  const navigation =
    event.request.mode === "navigate" &&
    !url.search &&
    (/^\/$/.test(url.pathname) ||
      /^\/(lessons|teaching|work|parent)(\/|$)/.test(url.pathname));
  event.respondWith(
    bounded(async (signal) => {
      try {
        const current = await shell.current(signal);
        const path = navigation ? "index.html" : url.pathname.slice(1);
        if (
          url.search ||
          ![
            "index.html",
            "_reading/shell-descriptor.json",
            current.descriptor.body.serviceWorker.path,
            ...current.descriptor.body.resources.map((entry) => entry.path),
          ].includes(path)
        )
          return new Response(null, { status: 404 });
        return await shell.serve(current, path, signal);
      } catch (error) {
        return new Response(null, {
          status: 503,
          headers: {
            "X-Reading-Shell":
              error instanceof ShellError ? error.failure.kind : "unavailable",
            ...(error instanceof ShellError && error.failure.kind === "missing"
              ? { "X-Reading-Shell-Path": error.failure.path }
              : {}),
          },
        });
      }
    }),
  );
});
