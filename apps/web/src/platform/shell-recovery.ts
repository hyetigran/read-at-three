import { ShellError } from "@readatthree/teaching";
import type { createShellCache } from "./shell-cache.ts";
import {
  isShellApplicationNavigation,
  type ShellNavigationRequest,
} from "./shell-request.ts";
import { shellResourceHeaders } from "./shell-response-policy.ts";

const prefix = "/_reading/repair-shell/";
type Failure = "missing" | "corrupt" | "unavailable" | "expired" | "busy";
function failure(error: unknown): Failure {
  return error instanceof ShellError ? error.failure.kind : "unavailable";
}
function escape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
export function createShellRecovery(
  input: Readonly<{
    origin: string;
    shell: Pick<ReturnType<typeof createShellCache>, "install" | "current">;
    now?: () => number;
  }>,
) {
  const tokens = new Map<string, number>();
  const now = input.now ?? (() => performance.now());
  let active = false;
  function prune() {
    const time = now();
    for (const [token, expiry] of tokens)
      if (expiry <= time) tokens.delete(token);
  }
  function recoveryNavigation(request: ShellNavigationRequest): boolean {
    const url = new URL(request.url);
    return (
      url.origin === input.origin &&
      request.method === "GET" &&
      request.mode === "navigate" &&
      request.destination === "document" &&
      !url.search &&
      !url.hash &&
      /^\/_reading\/repair-shell\/[a-f0-9]{64}$/.test(url.pathname)
    );
  }
  function eligible(request: ShellNavigationRequest): boolean {
    return (
      isShellApplicationNavigation(request, input.origin) ||
      recoveryNavigation(request)
    );
  }
  function page(
    state: Failure | "repaired" | "refused",
    action: string | undefined,
  ): Response {
    const message =
      state === "repaired"
        ? "App files repaired."
        : state === "busy"
          ? "Another app repair is in progress."
          : state === "expired"
            ? "The repair link expired. Choose Repair app files to try again."
            : state === "refused"
              ? "This request cannot repair app files."
              : state === "corrupt"
                ? "App files could not be safely verified or selected."
                : "App files are unavailable.";
    const guidance =
      state === "repaired"
        ? "Choose Return to app when you are ready."
        : state === "refused"
          ? "Return to the app using its usual address."
          : "Connect to the internet, then choose Repair app files. Repair may be unavailable if stored app versions conflict.";
    const link =
      state === "repaired"
        ? '<a href="/" rel="noreferrer"><mark>Return to app</mark></a>'
        : action
          ? '<a href="' +
            escape(action) +
            '" rel="noreferrer"><mark>Repair app files</mark></a>'
          : "";
    return new Response(
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>App files</title><style>body{font-family:system-ui,sans-serif;line-height:1.6;max-width:42rem;margin:4rem auto;padding:1.5rem;color:#17202a;background:#fff}mark{background:#fff09b;color:inherit;box-decoration-break:clone}a{display:inline-block;padding:1rem 0;font-weight:700}a:focus-visible{outline:3px solid #17202a;outline-offset:4px}</style></head><body><main><h1><mark>' +
        escape(message) +
        "</mark></h1><p><mark>" +
        escape(guidance) +
        "</mark></p>" +
        link +
        "</main></body></html>",
      {
        status: state === "repaired" ? 200 : 503,
        headers: {
          ...shellResourceHeaders("text/html"),
          "Referrer-Policy": "no-referrer",
          "X-Reading-Shell": state,
        },
      },
    );
  }
  function issue(request: ShellNavigationRequest, state: Failure): Response {
    if (!eligible(request)) return page("refused", undefined);
    prune();
    while (tokens.size >= 64) {
      const first = tokens.keys().next();
      if (first.done) break;
      tokens.delete(first.value);
    }
    const token = Array.from(
      crypto.getRandomValues(new Uint8Array(32)),
      (value) => value.toString(16).padStart(2, "0"),
    ).join("");
    tokens.set(token, now() + 120000);
    return page(state, prefix + token);
  }
  return {
    unavailable(request: ShellNavigationRequest, error: unknown): Response {
      return issue(request, failure(error));
    },
    async handle(
      request: ShellNavigationRequest,
      signal: AbortSignal,
    ): Promise<Response | undefined> {
      const url = new URL(request.url);
      if (
        url.pathname !== prefix.slice(0, -1) &&
        !url.pathname.startsWith(prefix)
      )
        return;
      if (!recoveryNavigation(request)) return page("refused", undefined);
      prune();
      const token = url.pathname.slice(prefix.length);
      const expiry = tokens.get(token);
      tokens.delete(token);
      if (expiry === undefined) return issue(request, "expired");
      if (active) return issue(request, "busy");
      active = true;
      try {
        signal.throwIfAborted();
        const installed = await input.shell.install(signal);
        const current = await input.shell.current(signal);
        if (installed.hash !== current.hash)
          throw new ShellError({ kind: "corrupt", reason: "inventory" });
        return page("repaired", undefined);
      } catch (error) {
        return issue(request, failure(error));
      } finally {
        active = false;
      }
    },
  };
}
