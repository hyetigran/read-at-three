import {
  canonical,
  deepFreeze,
  increment,
  parseCounter,
  parseHash,
  parseId,
} from "./identity.ts";
import { parseDocumentToken } from "./ink.ts";
import { parseSelectedOwnerWitness } from "./selection.ts";
import {
  validateStorageCleanupView,
  validateStorageCleanupCommand,
  validateStorageCleanupReceipt,
} from "./generated-validators.js";
import type { CommandId, DocumentToken, PayloadHash } from "./types.ts";
import type { HashFunction, IdFactory } from "./types.ts";
import type { Owner, Counter } from "./types.ts";
export type StorageCleanupScope = Readonly<{ owner: Owner; revision: Counter }>;
import type { SelectedOwnerWitness } from "./profiles.ts";

export type StorageCleanupDrawing = Readonly<{
  token: DocumentToken;
  pointBytes: number;
}>;
export type StorageCleanupView = Readonly<{
  selection: SelectedOwnerWitness;
  scope: StorageCleanupScope;
  drawings: readonly StorageCleanupDrawing[];
}>;
export type StorageCleanupCommand = Readonly<{
  version: 1;
  commandId: CommandId;
  selection: SelectedOwnerWitness;
  expectedScope: StorageCleanupScope;
  drawings: readonly DocumentToken[];
  payloadHash: PayloadHash;
}>;
export type StorageCleanupReceipt = Readonly<{
  kind: "cleanupCommitted";
  commandId: CommandId;
  payloadHash: PayloadHash;
  scope: StorageCleanupScope;
  drawings: readonly DocumentToken[];
}>;
export interface StorageCleanupApplication {
  readStorageCleanup(input: {
    selection: SelectedOwnerWitness;
  }): Promise<StorageCleanupView>;
  cleanupStorage(
    command: StorageCleanupCommand,
  ): Promise<StorageCleanupReceipt>;
}
export function storageCleanupPreimage(
  command: Omit<StorageCleanupCommand, "payloadHash">,
): string {
  return canonical({
    kind: "storageCleanup",
    version: command.version,
    commandId: command.commandId,
    selection: command.selection,
    expectedScope: command.expectedScope,
    drawings: command.drawings,
  });
}
export function parseStorageCleanupCommand(
  input: unknown,
): StorageCleanupCommand {
  if (!validateStorageCleanupCommand(input))
    throw new Error("Unsupported storage cleanup command");
  const selection = parseSelectedOwnerWitness(input.selection);
  parseId({ kind: "command", value: input.commandId });
  parseHash({ kind: "payload", value: input.payloadHash });
  parseCounter(input.expectedScope.revision);
  increment(input.expectedScope.revision);
  if (canonical(selection.owner) !== canonical(input.expectedScope.owner))
    throw new Error("Cleanup profile does not match the selected child");
  const documents = new Set<string>();
  for (const token of input.drawings) {
    parseDocumentToken(token);
    if (
      token.profileId !== selection.owner.profileId ||
      token.generation !== selection.owner.generation ||
      documents.has(token.documentId)
    )
      throw new Error(
        "Cleanup drawings must be distinct and belong to the selected child",
      );
    documents.add(token.documentId);
  }
  return deepFreeze(input);
}
export async function prepareStorageCleanup(input: {
  view: StorageCleanupView;
  drawings: readonly StorageCleanupDrawing[];
  ids: IdFactory;
  hash: HashFunction;
}): Promise<StorageCleanupCommand> {
  const body = {
    version: 1 as const,
    commandId: parseId({ kind: "command", value: input.ids() }),
    selection: input.view.selection,
    expectedScope: input.view.scope,
    drawings: input.drawings.map((drawing) => drawing.token),
  };
  return parseStorageCleanupCommand({
    ...body,
    payloadHash: await input.hash(storageCleanupPreimage(body)),
  });
}
export function parseStorageCleanupReceipt(
  input: unknown,
): StorageCleanupReceipt {
  if (!validateStorageCleanupReceipt(input))
    throw new Error("Unsupported storage cleanup receipt");
  parseCounter(input.scope.revision);
  parseCounter(input.scope.owner.generation);
  parseId({ kind: "profile", value: input.scope.owner.profileId });
  parseId({ kind: "command", value: input.commandId });
  parseHash({ kind: "payload", value: input.payloadHash });
  for (const token of input.drawings) {
    parseDocumentToken(token);
    if (
      token.profileId !== input.scope.owner.profileId ||
      token.generation !== input.scope.owner.generation
    )
      throw new Error("Cleanup receipt ownership changed");
  }
  return deepFreeze(input);
}

export function storageCleanupReceipt(
  command: StorageCleanupCommand,
): StorageCleanupReceipt {
  return parseStorageCleanupReceipt({
    kind: "cleanupCommitted",
    commandId: command.commandId,
    payloadHash: command.payloadHash,
    scope: {
      ...command.expectedScope,
      revision: increment(command.expectedScope.revision),
    },
    drawings: command.drawings.map((token) => ({
      ...token,
      revision: increment(token.revision),
      inputEpoch: increment(token.inputEpoch),
    })),
  });
}
export function parseStorageCleanupView(input: unknown): StorageCleanupView {
  if (!validateStorageCleanupView(input))
    throw new Error("Unsupported storage cleanup view");
  const selection = parseSelectedOwnerWitness(input.selection);
  parseCounter(input.scope.revision);
  if (canonical(selection.owner) !== canonical(input.scope.owner))
    throw new Error("Cleanup view ownership changed");
  const seen = new Set<string>();
  for (const drawing of input.drawings) {
    parseDocumentToken(drawing.token);
    if (
      drawing.token.profileId !== selection.owner.profileId ||
      drawing.token.generation !== selection.owner.generation ||
      seen.has(drawing.token.documentId)
    )
      throw new Error("Cleanup view contains unrelated or duplicate drawings");
    seen.add(drawing.token.documentId);
  }
  return deepFreeze(input);
}
