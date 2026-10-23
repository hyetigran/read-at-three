import {
  canonical,
  deepFreeze,
  increment,
  parseCounter,
  parseId,
} from "./identity.ts";
import type { CommandId, Counter, Id } from "./types.ts";
import {
  validateStartFreshCommand,
  validateStoreResetRecord,
} from "./generated-selection-validators.js";

export type StartFreshCommand = Readonly<{
  version: 1;
  recoveryId: Id<"storeRecovery">;
  commandId: CommandId;
  expectedRevision: Counter;
}>;
export type StoreResetRecord = Readonly<{
  version: 1;
  recoveryId: Id<"storeRecovery">;
  revision: Counter;
}> &
  (
    | Readonly<{ phase: "ready"; lastCommand: StartFreshCommand | null }>
    | Readonly<{ phase: "resetting"; command: StartFreshCommand }>
  );

export function parseStartFreshCommand(input: unknown): StartFreshCommand {
  if (!validateStartFreshCommand(input) || input.version !== 1)
    throw new Error("Unsupported Start fresh command");
  return deepFreeze({
    version: 1,
    recoveryId: parseId({ kind: "storeRecovery", value: input.recoveryId }),
    commandId: parseId({ kind: "command", value: input.commandId }),
    expectedRevision: parseCounter(input.expectedRevision),
  });
}
export function parseStoreResetRecord(input: unknown): StoreResetRecord {
  if (!validateStoreResetRecord(input) || input.version !== 1)
    throw new Error("Unsupported recovery record");
  const recoveryId = parseId({
    kind: "storeRecovery",
    value: input.recoveryId,
  });
  const revision = parseCounter(input.revision);
  const command =
    input.phase === "resetting"
      ? parseStartFreshCommand(input.command)
      : input.lastCommand === null
        ? null
        : parseStartFreshCommand(input.lastCommand);
  if (
    command &&
    (command.recoveryId !== recoveryId ||
      (input.phase === "resetting"
        ? command.expectedRevision !== revision
        : increment(command.expectedRevision) !== revision))
  )
    throw new Error("Recovery record identity mismatch");
  if (!command && revision !== "0") throw new Error("Missing reset receipt");
  return deepFreeze(
    input.phase === "resetting"
      ? {
          version: 1,
          recoveryId,
          revision,
          phase: "resetting",
          command: command!,
        }
      : {
          version: 1,
          recoveryId,
          revision,
          phase: "ready",
          lastCommand: command,
        },
  );
}
export function prepareStartFresh(
  record: StoreResetRecord,
  commandId: string,
): StartFreshCommand {
  return record.phase === "resetting"
    ? record.command
    : parseStartFreshCommand({
        version: 1,
        recoveryId: record.recoveryId,
        expectedRevision: record.revision,
        commandId,
      });
}
export function beginStoreReset(
  record: StoreResetRecord,
  command: StartFreshCommand,
): StoreResetRecord {
  const previous =
    record.phase === "resetting" ? record.command : record.lastCommand;
  if (previous?.commandId === command.commandId) {
    if (canonical(previous) !== canonical(command))
      throw new Error("Start fresh command identity changed");
    return record;
  }
  if (
    record.phase !== "ready" ||
    record.recoveryId !== command.recoveryId ||
    record.revision !== command.expectedRevision
  )
    throw new Error("Start fresh target changed");
  return parseStoreResetRecord({
    version: 1,
    recoveryId: record.recoveryId,
    revision: record.revision,
    phase: "resetting",
    command,
  });
}
export function finishStoreReset(
  record: Extract<StoreResetRecord, { phase: "resetting" }>,
): StoreResetRecord {
  return parseStoreResetRecord({
    version: 1,
    recoveryId: record.recoveryId,
    revision: increment(record.revision),
    phase: "ready",
    lastCommand: record.command,
  });
}
