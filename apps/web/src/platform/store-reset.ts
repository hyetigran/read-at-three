import {
  beginStoreReset,
  canonical,
  finishStoreReset,
  parseStartFreshCommand,
  parseStoreResetRecord,
} from "@readatthree/teaching";
import type {
  StartFreshCommand,
  StoreResetRecord,
} from "@readatthree/teaching";
import { StorageBusyError } from "./storage-busy.ts";
import { PendingStoreResetError } from "./storage-integrity.ts";

const recordName = ".read-at-three.recovery.json";
const storeDirectory = ".read-at-three.sqlite";
const lockName = "read-at-three.sqlite.v1";
const recordLimit = 16384;
function missing(error: unknown) {
  return error instanceof DOMException && error.name === "NotFoundError";
}
async function read(
  root: FileSystemDirectoryHandle,
): Promise<StoreResetRecord | null> {
  let handle: FileSystemFileHandle;
  try {
    handle = await root.getFileHandle(recordName);
  } catch (error) {
    if (missing(error)) return null;
    throw error;
  }
  const file = await handle.getFile();
  if (file.size > recordLimit) throw new Error("Recovery record is too large");
  return parseStoreResetRecord(JSON.parse(await file.text()));
}
async function write(root: FileSystemDirectoryHandle, value: StoreResetRecord) {
  const bytes = canonical(parseStoreResetRecord(value));
  if (new TextEncoder().encode(bytes).byteLength > recordLimit)
    throw new Error("Recovery record is too large");
  const handle = await root.getFileHandle(recordName, { create: true });
  const stream = await handle.createWritable();
  try {
    await stream.write(bytes);
    await stream.close();
  } catch (error) {
    await stream.abort().catch(() => {});
    throw error;
  }
  if (canonical(await read(root)) !== bytes)
    throw new Error("Recovery record could not be confirmed");
}
async function exclusive<T>(
  work: (root: FileSystemDirectoryHandle) => Promise<T>,
): Promise<T> {
  const cancellation = new AbortController();
  const deadline = setTimeout(
    () => cancellation.abort(new StorageBusyError()),
    10000,
  );
  try {
    return await navigator.locks.request(
      lockName,
      { mode: "exclusive", signal: cancellation.signal },
      async () => {
        clearTimeout(deadline);
        return work(await navigator.storage.getDirectory());
      },
    );
  } finally {
    clearTimeout(deadline);
  }
}
export async function assertStoreOpeningAllowed() {
  const record = await read(await navigator.storage.getDirectory());
  if (record?.phase === "resetting") throw new PendingStoreResetError();
}
export async function readStartFresh(): Promise<StoreResetRecord> {
  return exclusive(async (root) => {
    const existing = await read(root);
    if (existing) return existing;
    const record = parseStoreResetRecord({
      version: 1,
      phase: "ready",
      recoveryId: crypto.randomUUID(),
      revision: "0",
      lastCommand: null,
    });
    await write(root, record);
    return record;
  });
}
export async function startFresh(input: StartFreshCommand): Promise<void> {
  const command = parseStartFreshCommand(input);
  await exclusive(async (root) => {
    const current = await read(root);
    if (!current) throw new Error("The confirmed recovery record is missing");
    const next = beginStoreReset(current, command);
    if (next.phase === "ready") return;
    if (current.phase === "ready") await write(root, next);
    try {
      await root.removeEntry(storeDirectory, { recursive: true });
    } catch (error) {
      if (!missing(error)) throw error;
    }
    await write(root, finishStoreReset(next));
  });
}
