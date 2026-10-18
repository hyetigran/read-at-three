import {
  ShellError,
  shellDescriptorPath,
  shellEntries,
  verifyShellDescriptor,
  verifyShellResource,
  publicationLimits,
  readPublicationResponse,
  publicationEnvelopePath,
  revalidatePublicationClosure,
  verifyPublicationResource,
  PublicationResourceError,
  type PublicationCrypto,
  type PublicationResponse,
  type PublicationNamespace,
  type ShellPolicy,
  type VerifiedShell,
  type ShellResource,
} from "@readatthree/teaching";

export const webPublicationCrypto: PublicationCrypto = {
  async sha256(bytes) {
    return new Uint8Array(
      await crypto.subtle.digest("SHA-256", bytes.slice().buffer),
    );
  },
  async verifyEd25519(input) {
    const key = await crypto.subtle.importKey(
      "spki",
      input.spki.slice().buffer,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      "Ed25519",
      key,
      input.signature.slice().buffer,
      input.message.slice().buffer,
    );
  },
};
export function cachedPublicationResponse(
  response: Response,
  expectedUrl: string,
  signal: AbortSignal,
): PublicationResponse {
  return {
    status: response.status,
    redirected: response.redirected,
    exactUrl: response.url === "" || response.url === expectedUrl,
    mediaType: response.headers.get("Content-Type"),
    contentLength: response.headers.get("Content-Length"),
    contentEncoding: response.headers.get("Content-Encoding"),
    async cancel() {
      if (response.body && !response.body.locked) await response.body.cancel();
    },
    chunks: {
      async *[Symbol.asyncIterator]() {
        if (!response.body) return;
        const reader = response.body.getReader();
        try {
          while (true) {
            signal.throwIfAborted();
            const part = await reader.read();
            if (part.done) return;
            yield part.value;
          }
        } finally {
          await reader.cancel();
          reader.releaseLock();
        }
      },
    },
  };
}
export async function boundedShellResponse(
  response: Response,
  maximum: number,
  signal: AbortSignal,
): Promise<Uint8Array> {
  if (response.status !== 200 || response.redirected) {
    await response.body?.cancel();
    throw new ShellError({ kind: "corrupt", reason: "resource" });
  }
  const reader = response.body?.getReader();
  if (!reader) throw new ShellError({ kind: "corrupt", reason: "resource" });
  const buffer = new Uint8Array(maximum);
  let size = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const part = await reader.read();
      if (part.done) break;
      if (part.value.length > maximum - size)
        throw new ShellError({ kind: "corrupt", reason: "resource" });
      buffer.set(part.value, size);
      size += part.value.length;
    }
    return buffer.slice(0, size);
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}
function response(bytes: Uint8Array, mediaType: string): Response {
  return new Response(bytes.slice().buffer, {
    status: 200,
    headers: {
      "Content-Type": mediaType,
      "Content-Length": String(bytes.length),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
export function shellCacheName(shell: VerifiedShell): string {
  return `reading-shell-v1-${shell.descriptor.body.mode}-${shell.descriptor.body.applicationVersion}-${shell.hash}`;
}
export function createShellCache(policy: ShellPolicy, origin: string) {
  const prefix = `reading-shell-v1-${policy.mode}-${policy.applicationVersion}-`;
  const location = (path: string) => new URL(`/${path}`, origin).href;
  const readEntry = async (
    shell: VerifiedShell,
    entry: ShellResource,
    retained: Response,
    signal: AbortSignal,
  ) => {
    try {
      const bytes = await readPublicationResponse({
        response: {
          ...cachedPublicationResponse(retained, location(entry.path), signal),
          mediaType: (() => {
            const media =
              retained.headers
                .get("Content-Type")
                ?.split(";")[0]
                ?.trim()
                .toLowerCase() ?? null;
            return entry.mediaType === "application/javascript" &&
              media === "text/javascript"
              ? "application/javascript"
              : media;
          })(),
        },
        byteLength: entry.byteLength,
        mediaType: entry.mediaType,
        cancellation: { throwIfCancelled: () => signal.throwIfAborted() },
      });
      await verifyShellResource({
        shell,
        path: entry.path,
        bytes,
        crypto: webPublicationCrypto,
      });
      return bytes;
    } catch (error) {
      if (error instanceof PublicationResourceError)
        throw new ShellError(
          error.failure.kind === "corrupt"
            ? { kind: "corrupt", reason: "resource" }
            : {
                kind: "unavailable",
                reason: signal.aborted ? "cancelled" : "cache",
              },
        );
      throw error;
    }
  };
  async function inspect(
    shell: VerifiedShell,
    signal: AbortSignal,
  ): Promise<void> {
    const name = shellCacheName(shell);
    if (!(await caches.has(name)))
      throw new ShellError({ kind: "missing", path: "index.html" });
    const cache = await caches.open(name);
    const paths = (await cache.keys()).map((request) => request.url);
    const entries = shellEntries(shell);
    const expected = [
      shellDescriptorPath,
      ...entries.map((entry) => entry.path),
    ].map(location);
    if (paths.some((path) => !expected.includes(path)))
      throw new ShellError({ kind: "corrupt", reason: "inventory" });
    for (const entry of entries) {
      signal.throwIfAborted();
      const retained = await cache.match(location(entry.path));
      if (!retained)
        throw new ShellError({ kind: "missing", path: entry.path });
      await readEntry(shell, entry, retained, signal);
    }
  }
  return {
    async install(signal: AbortSignal): Promise<VerifiedShell> {
      const rawResponse = await fetch(location(shellDescriptorPath), {
        signal,
        redirect: "error",
        cache: "no-store",
        credentials: "omit",
      });
      if (rawResponse.url !== location(shellDescriptorPath))
        throw new ShellError({ kind: "corrupt", reason: "descriptor" });
      const raw = await boundedShellResponse(
        rawResponse,
        publicationLimits.envelopeBytes,
        signal,
      );
      const shell = await verifyShellDescriptor({
        raw,
        policy,
        crypto: webPublicationCrypto,
      });
      return navigator.locks.request(
        shellCacheName(shell),
        { mode: "exclusive", signal },
        async () => {
          const cache = await caches.open(shellCacheName(shell));
          for (const entry of shellEntries(shell)) {
            signal.throwIfAborted();
            const downloaded = await fetch(location(entry.path), {
              signal,
              redirect: "error",
              cache: "no-store",
              credentials: "omit",
            });
            if (downloaded.url !== location(entry.path))
              throw new ShellError({ kind: "corrupt", reason: "resource" });
            const bytes = await readEntry(shell, entry, downloaded, signal);
            await cache.put(
              location(entry.path),
              response(bytes, entry.mediaType),
            );
          }
          await cache.put(
            location(shellDescriptorPath),
            response(raw, "application/json"),
          );
          await inspect(shell, signal);
          return shell;
        },
      );
    },
    async current(signal: AbortSignal): Promise<VerifiedShell> {
      const names = (await caches.keys()).filter((name) =>
        name.startsWith(prefix),
      );
      if (names.length === 0)
        throw new ShellError({ kind: "missing", path: shellDescriptorPath });
      if (names.length !== 1)
        throw new ShellError({ kind: "corrupt", reason: "inventory" });
      const name = names[0];
      if (!name)
        throw new ShellError({ kind: "missing", path: shellDescriptorPath });
      return navigator.locks.request(
        name,
        { mode: "exclusive", signal },
        async () => {
          const cache = await caches.open(name);
          const retained = await cache.match(location(shellDescriptorPath));
          if (!retained)
            throw new ShellError({
              kind: "missing",
              path: shellDescriptorPath,
            });
          const raw = await boundedShellResponse(
            retained,
            publicationLimits.envelopeBytes,
            signal,
          );
          const shell = await verifyShellDescriptor({
            raw,
            policy,
            crypto: webPublicationCrypto,
          });
          if (shellCacheName(shell) !== name)
            throw new ShellError({ kind: "corrupt", reason: "inventory" });
          await inspect(shell, signal);
          return shell;
        },
      );
    },
    async serve(
      shell: VerifiedShell,
      path: string,
      signal: AbortSignal,
    ): Promise<Response> {
      return navigator.locks.request(
        shellCacheName(shell),
        { mode: "exclusive", signal },
        async () => {
          const cache = await caches.open(shellCacheName(shell));
          const retained = await cache.match(location(path));
          if (!retained) throw new ShellError({ kind: "missing", path });
          if (path === shellDescriptorPath) {
            const raw = await boundedShellResponse(
              retained,
              publicationLimits.envelopeBytes,
              signal,
            );
            const current = await verifyShellDescriptor({
              raw,
              policy,
              crypto: webPublicationCrypto,
            });
            if (current.hash !== shell.hash)
              throw new ShellError({ kind: "corrupt", reason: "descriptor" });
            return response(raw, "application/json");
          }
          const entry = shellEntries(shell).find(
            (entry) => entry.path === path,
          );
          if (!entry)
            throw new ShellError({ kind: "corrupt", reason: "inventory" });
          return response(
            await readEntry(shell, entry, retained, signal),
            entry.mediaType,
          );
        },
      );
    },
  };
}

export async function serveInstalledPublication(
  input: Readonly<{
    policy: ShellPolicy;
    request: Request;
    signal: AbortSignal;
  }>,
): Promise<Response> {
  const url = new URL(input.request.url);
  const match =
    /^\/_reading\/content\/(fixture|publication)\/([a-f0-9]{64})\/(.+)$/.exec(
      url.pathname,
    );
  const mode = match?.[1],
    hash = match?.[2],
    path = match?.[3];
  if (
    !match ||
    mode !== input.policy.mode ||
    !hash ||
    !path ||
    url.search ||
    input.request.method !== "GET"
  )
    return new Response(null, { status: 404 });
  const name = `reading-content-v1-${mode}-${hash}`;
  return navigator.locks.request(
    name,
    { mode: "exclusive", signal: input.signal },
    async () => {
      if (!(await caches.has(name)))
        return new Response(null, {
          status: 503,
          headers: { "X-Reading-Content": "missing" },
        });
      const cache = await caches.open(name);
      const prefix = new URL(`/_reading/content/${mode}/${hash}/`, url.origin)
        .href;
      const retained = await cache.match(prefix + publicationEnvelopePath);
      if (!retained)
        return new Response(null, {
          status: 503,
          headers: { "X-Reading-Content": "missing" },
        });
      const raw = await boundedShellResponse(
        retained,
        publicationLimits.envelopeBytes,
        input.signal,
      );
      const namespace: PublicationNamespace = {
        paths: async () =>
          (await cache.keys()).map((key) =>
            key.url.startsWith(prefix) ? key.url.slice(prefix.length) : key.url,
          ),
        read: async (declared) => {
          const value = await cache.match(prefix + declared);
          return value
            ? cachedPublicationResponse(value, prefix + declared, input.signal)
            : undefined;
        },
        write: async () => {
          throw new Error("Service worker cannot write content");
        },
      };
      const result = await revalidatePublicationClosure({
        mode,
        raw,
        keys: input.policy.keys,
        crypto: webPublicationCrypto,
        cancellation: { throwIfCancelled: () => input.signal.throwIfAborted() },
        ports: {
          download: async () => {
            throw new Error("Service worker cannot download content");
          },
          exclusive: async ({ run }) => run(namespace),
        },
      });
      if (
        result.kind !== "verified-closure" ||
        result.publication.hash !== hash
      )
        return new Response(null, {
          status: 503,
          headers: {
            "X-Reading-Content":
              result.kind === "verified-closure" ? "corrupt" : result.kind,
          },
        });
      const entry = [
        result.publication.envelope.body.curriculum,
        ...result.publication.envelope.body.assets,
      ].find((entry) => entry.path === path);
      if (!entry) return new Response(null, { status: 404 });
      const served = await cache.match(prefix + path);
      if (!served)
        return new Response(null, {
          status: 503,
          headers: { "X-Reading-Content": "missing" },
        });
      const bytes = await readPublicationResponse({
        response: cachedPublicationResponse(
          served,
          prefix + path,
          input.signal,
        ),
        byteLength: entry.byteLength,
        mediaType: entry.mediaType,
        cancellation: { throwIfCancelled: () => input.signal.throwIfAborted() },
      });
      await verifyPublicationResource({
        publication: result.publication,
        path,
        bytes,
        crypto: webPublicationCrypto,
      });
      return response(bytes, entry.mediaType);
    },
  );
}
