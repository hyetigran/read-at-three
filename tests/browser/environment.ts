export const browserBuild = process.env.READING_BROWSER_BUILD === "1";
export const browserPort = Number(
  process.env.READING_BROWSER_PORT ?? (browserBuild ? 5175 : 5174),
);
if (
  !Number.isSafeInteger(browserPort) ||
  browserPort < 1024 ||
  browserPort > 65535
) {
  throw new Error("READING_BROWSER_PORT must be an unprivileged TCP port");
}
export const browserBaseURL = `http://127.0.0.1:${browserPort}`;
