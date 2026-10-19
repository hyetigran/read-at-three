export type ShellNavigationRequest = Pick<
  Request,
  "url" | "method" | "destination" | "mode"
>;
export function isShellApplicationNavigation(
  request: ShellNavigationRequest,
  origin: string,
): boolean {
  const url = new URL(request.url);
  return (
    url.origin === origin &&
    request.method === "GET" &&
    !url.search &&
    !url.hash &&
    request.mode === "navigate" &&
    request.destination === "document" &&
    (url.pathname === "/" ||
      /^\/(lessons|teaching|work|parent)(\/|$)/.test(url.pathname))
  );
}
import {
  publicationLimits,
  shellDescriptorPath,
  shellEntries,
  type ShellPolicy,
  type VerifiedShell,
} from "@readatthree/teaching";
type RequestDecision =
  | Readonly<{ kind: "shell"; path: string }>
  | Readonly<{ kind: "publication" }>
  | Readonly<{ kind: "download" }>
  | Readonly<{ kind: "refused" }>;
export function selectShellRequest(
  input: Readonly<{
    shell: VerifiedShell;
    policy: ShellPolicy;
    origin: string;
    request: Pick<Request, "url" | "method" | "destination" | "mode">;
  }>,
): RequestDecision {
  const { request, policy } = input;
  const url = new URL(request.url);
  if (
    url.origin !== input.origin ||
    request.method !== "GET" ||
    url.search ||
    url.hash
  )
    return { kind: "refused" };
  if (url.pathname.startsWith("/_reading/download/")) {
    const parts = url.pathname.slice("/_reading/download/".length).split("/");
    const path = parts.slice(2).join("/");
    return parts[0] === policy.mode &&
      /^[a-f0-9]{64}$/.test(parts[1] ?? "") &&
      path.length <= publicationLimits.pathLength &&
      /^[A-Za-z0-9_-][A-Za-z0-9_./-]*$/.test(path) &&
      !parts
        .slice(2)
        .some((part) => part === "" || part === "." || part === "..") &&
      request.destination === ""
      ? { kind: "download" }
      : { kind: "refused" };
  }
  if (url.pathname.startsWith("/_reading/content/"))
    return ["", "image", "audio", "video"].includes(request.destination)
      ? { kind: "publication" }
      : { kind: "refused" };
  const navigation = isShellApplicationNavigation(request, input.origin);
  const path = navigation ? "index.html" : url.pathname.slice(1);
  return path === shellDescriptorPath ||
    shellEntries(input.shell).some((entry) => entry.path === path)
    ? { kind: "shell", path }
    : { kind: "refused" };
}
