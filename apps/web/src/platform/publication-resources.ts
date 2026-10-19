import type {
  PublicationResourcePorts,
  PublicationResponse,
} from "@readatthree/teaching";

export function createWebPublicationResources(
  input: Readonly<{
    origin: string;
    signal: AbortSignal;
  }>,
): PublicationResourcePorts {
  const origin = new URL(input.origin);
  if (
    origin.origin !== input.origin ||
    origin.origin !== globalThis.location.origin ||
    !["https:", "http:"].includes(origin.protocol)
  )
    throw new Error("Invalid publication origin");
  function location(mode: string, hash: string, path: string): string {
    return new URL(`/_reading/content/${mode}/${hash}/${path}`, origin).href;
  }
  function response(
    value: Response,
    expectedUrl: string,
    cached: boolean,
  ): PublicationResponse {
    return {
      status: value.status,
      redirected: value.redirected,
      exactUrl: cached
        ? value.url === "" || value.url === expectedUrl
        : value.url === expectedUrl,
      mediaType: value.headers.get("Content-Type"),
      contentLength: value.headers.get("Content-Length"),
      contentEncoding: value.headers.get("Content-Encoding"),
      async cancel() {
        if (value.body && !value.body.locked) await value.body.cancel();
      },
      chunks: {
        async *[Symbol.asyncIterator]() {
          if (!value.body) return;
          const reader = value.body.getReader();
          try {
            while (true) {
              input.signal.throwIfAborted();
              const next = await reader.read();
              if (next.done) return;
              yield next.value;
            }
          } finally {
            await reader.cancel();
            reader.releaseLock();
          }
        },
      },
    };
  }
  return {
    async download({ mode, hash, path }) {
      input.signal.throwIfAborted();
      const url = new URL(`/_reading/download/${mode}/${hash}/${path}`, origin)
        .href;
      const fetched = await fetch(url, {
        signal: input.signal,
        redirect: "error",
        credentials: "omit",
        cache: "no-store",
        mode: "same-origin",
      });
      return response(fetched, url, false);
    },
    async exclusive({ mode, hash, run }) {
      const name = `reading-content-v1-${mode}-${hash}`;
      return navigator.locks.request(
        name,
        { mode: "exclusive", signal: input.signal },
        async () => {
          input.signal.throwIfAborted();
          let cache = (await caches.has(name))
            ? await caches.open(name)
            : undefined;
          const prefix = location(mode, hash, "");
          return run({
            async paths() {
              const keys = cache ? await cache.keys() : [];
              return keys.map((key) =>
                key.url.startsWith(prefix)
                  ? key.url.slice(prefix.length)
                  : key.url,
              );
            },
            async read(path) {
              input.signal.throwIfAborted();
              const url = location(mode, hash, path);
              const retained = await cache?.match(url);
              return retained ? response(retained, url, true) : undefined;
            },
            async write({ path, bytes, mediaType }) {
              input.signal.throwIfAborted();
              cache ??= await caches.open(name);
              await cache.put(
                location(mode, hash, path),
                new Response(bytes.slice().buffer, {
                  status: 200,
                  headers: {
                    "Content-Type": mediaType,
                    "Content-Length": String(bytes.length),
                  },
                }),
              );
            },
          });
        },
      );
    },
  };
}
