import {
  parseShellBridgeResponse,
  parseId,
  ShellError,
  type Counter,
  type ShellHash,
} from "@readatthree/teaching";

type Reply = Exclude<
  ReturnType<typeof parseShellBridgeResponse>,
  { kind: "invalidated" }
>;
export function createWorkerShellBridge(
  input: Readonly<{ port: MessagePort; signal: AbortSignal }>,
) {
  let closed = false,
    generation = 0;
  let epoch: Counter | undefined;
  const pending = new Map<
    string,
    Readonly<{
      resolve: (reply: Reply) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }>
  >();
  const failure = () =>
    new ShellError({ kind: "unavailable", reason: "cancelled" });
  function close() {
    if (closed) return;
    closed = true;
    generation++;
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(failure());
    }
    pending.clear();
    input.port.close();
    input.signal.removeEventListener("abort", close);
  }
  input.port.onmessage = (event: MessageEvent<unknown>) => {
    let reply: ReturnType<typeof parseShellBridgeResponse>;
    try {
      reply = parseShellBridgeResponse(event.data);
    } catch {
      close();
      return;
    }
    if (closed) return;
    if (reply.kind === "invalidated") {
      if (epoch === undefined || BigInt(reply.epoch) >= BigInt(epoch)) {
        epoch = reply.epoch;
        generation++;
      }
      return;
    }
    const waiting = pending.get(reply.requestId);
    if (!waiting) return;
    pending.delete(reply.requestId);
    clearTimeout(waiting.timer);
    if (reply.kind === "refused") waiting.reject(new ShellError(reply.failure));
    else waiting.resolve(reply);
  };
  input.port.onmessageerror = close;
  input.port.start();
  input.signal.addEventListener("abort", close, { once: true });
  if (input.signal.aborted) close();
  function request(
    message:
      | Readonly<{ kind: "prepare" }>
      | Readonly<{ kind: "current"; epoch: Counter; hash: ShellHash }>,
  ): Promise<Reply> {
    if (closed || input.signal.aborted) return Promise.reject(failure());
    const requestId = parseId({ kind: "command", value: crypto.randomUUID() });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(new ShellError({ kind: "unavailable", reason: "timeout" }));
      }, 65000);
      pending.set(requestId, { resolve, reject, timer });
      try {
        input.port.postMessage({ ...message, requestId });
      } catch {
        pending.delete(requestId);
        clearTimeout(timer);
        reject(failure());
      }
    });
  }
  return {
    close,
    async prepare() {
      const response = await request({ kind: "prepare" });
      if (
        response.kind !== "prepared" ||
        closed ||
        (epoch !== undefined && BigInt(epoch) > BigInt(response.epoch))
      )
        throw new ShellError({ kind: "corrupt", reason: "controller" });
      epoch = response.epoch;
      const preparedGeneration = generation;
      const isCurrent = () =>
        !closed &&
        !input.signal.aborted &&
        preparedGeneration === generation &&
        epoch === response.epoch;
      return {
        hash: response.hash,
        isCurrent,
        async current() {
          if (!isCurrent()) throw failure();
          const barrier = await request({
            kind: "current",
            epoch: response.epoch,
            hash: response.hash,
          });
          if (
            barrier.kind !== "current" ||
            !barrier.current ||
            barrier.epoch !== response.epoch ||
            barrier.hash !== response.hash ||
            !isCurrent()
          )
            throw new ShellError({ kind: "corrupt", reason: "controller" });
        },
      };
    },
  };
}
