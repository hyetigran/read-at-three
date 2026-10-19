import {
  publicationEnvelopePath,
  publicationLimits,
  readPublicationResponse,
  ShellError,
  type InstalledApplicationOptions,
} from "@readatthree/teaching";
import type { BrowserConfiguration } from "./browser-configuration.ts";
import { createWebPublicationResources } from "./publication-resources.ts";
import { createShellCache, webPublicationCrypto } from "./shell-cache.ts";
import { createWorkerShellBridge } from "./shell-worker-bridge.ts";

export function createBrowserInstalledOptions(
  input: Readonly<{
    configuration: Extract<BrowserConfiguration, { kind: "installed" }>;
    port: MessagePort;
    signal: AbortSignal;
  }>,
): InstalledApplicationOptions {
  const { configuration, signal } = input;
  const resources = createWebPublicationResources({
    origin: location.origin,
    signal,
  });
  const bridge = createWorkerShellBridge({ port: input.port, signal });
  const shell = createShellCache(configuration.shell, location.origin);
  return {
    courseId: configuration.courseId,
    mode: configuration.publication.mode,
    keys: configuration.publication.keys,
    crypto: webPublicationCrypto,
    resources,
    lifetime: { isCurrent: () => !signal.aborted },
    async envelope(hash, cancellation) {
      cancellation.throwIfCancelled();
      const response = await resources.download({
        mode: configuration.publication.mode,
        hash,
        path: publicationEnvelopePath,
      });
      return readPublicationResponse({
        response,
        maximumByteLength: publicationLimits.envelopeBytes,
        mediaType: "application/json",
        cancellation,
      });
    },
    shell: {
      async prepare({ cancellation }) {
        cancellation.throwIfCancelled();
        const prepared = await bridge.prepare();
        return {
          withVerified: (run) =>
            shell.withVerified({
              hash: prepared.hash,
              signal,
              run: async () => {
                await prepared.current();
                cancellation.throwIfCancelled();
                let held = true;
                const lease = {
                  isCurrent: () =>
                    held && prepared.isCurrent() && !signal.aborted,
                };
                try {
                  if (!lease.isCurrent())
                    throw new ShellError({
                      kind: "corrupt",
                      reason: "controller",
                    });
                  const result = await run(lease);
                  if (!lease.isCurrent())
                    throw new ShellError({
                      kind: "corrupt",
                      reason: "controller",
                    });
                  return result;
                } finally {
                  held = false;
                }
              },
            }),
        };
      },
    },
  };
}
