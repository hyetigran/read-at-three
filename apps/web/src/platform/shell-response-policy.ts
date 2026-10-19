export const shellResponsePolicy = Object.freeze({
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; font-src 'self'; media-src 'self'; base-uri 'none'; object-src 'none'; frame-src 'none'; form-action 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Service-Worker-Allowed": "/",
});
export const shellHostingPolicyPath = "_reading/hosting-policy.json";
export function shellResourceHeaders(
  mediaType: string,
): Record<string, string> {
  return {
    "Content-Type": mediaType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...(mediaType === "text/html" || mediaType === "application/javascript"
      ? shellResponsePolicy
      : {}),
  };
}
