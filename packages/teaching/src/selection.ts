import { parseShellHash } from "./shell.ts";
import {
  validateSelectedOwnerWitness,
  validateSelectedOperation,
  validateSelectedReadTarget,
  validateCurrentApplicationRead,
  validateCurrentResult,
  validateExecutionResult,
  validateSelectedRecoveryOpening,
  validateSelectedRecoveryInventory,
  validateRecoveryResult,
  validateInkResult,
  validateSelectedWorkInput,
  validateSelectedInkInput,
  validateSelectedControlsInput,
  validateDepartureWitness,
  validateProfileAdministrationResult,
  validateSelectedWorkerRequest,
  validateSelectedWorkerResponse,
  validateShellBridgeRequest,
  validateShellBridgeResponse,
} from "./generated-selection-validators.js";
import type {
  ApplicationRead,
  CommandResult,
  CommitReceipt,
  InkReceipt,
  CourseReadTarget,
  InkCommand,
  InkResult,
  ProfileDirectory,
  SelectedOwnerWitness,
  TeachingCommand,
  HistoricalWork,
  RunId,
  PracticeControlsBinding,
  PracticeControlsSummary,
  DocumentToken,
  InkSnapshot,
  ProfileAdministrationApplication,
  ProfileAdministrationCommand,
  ProfileAdministrationReceipt,
  CommandRejection,
  RecoveryInventory,
  RecoveryChoice,
  StrokeId,
} from "./index.ts";
import { parseCommand, parseDispatchResult } from "./content.ts";
import { canonical, deepFreeze, parseCounter, parseId } from "./identity.ts";
import {
  parseInkCommand,
  parseInkStrokeIds,
  parseRecoveryInventory,
  parseInkReceipt,
} from "./ink.ts";
import { parseApplicationRead } from "./course.ts";
import {
  parseProfileAdministrationCommand,
  parseProfileDirectory,
  parseProfileAdministrationReceipt,
  decodeDepartureWitness,
} from "./profiles.ts";
import { parseDocumentToken } from "./ink.ts";
import { parsePracticeControlsBinding } from "./ink.ts";

export function parseSelectedOwnerWitness(
  input: unknown,
): SelectedOwnerWitness {
  if (!validateSelectedOwnerWitness(input))
    throw new Error("Selected child witness is unsupported");
  return deepFreeze({
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    revision: parseCounter(input.revision),
    owner: {
      profileId: parseId({ kind: "profile", value: input.owner.profileId }),
      generation: parseCounter(input.owner.generation),
    },
  });
}

export function parseSelectedOperation(input: unknown): SelectedOperation {
  if (!validateSelectedOperation(input))
    throw new Error("Selected operation is unsupported");
  const selection = parseSelectedOwnerWitness(input.selection);
  if (input.kind === "teaching")
    return deepFreeze({
      kind: input.kind,
      selection,
      command: parseCommand(input.command),
    });
  if (input.kind === "ink")
    return deepFreeze({
      kind: input.kind,
      selection,
      command: parseInkCommand(input.command),
    });
  throw new Error("Selected operation kind is unsupported");
}

export type SelectedTeachingOperation = Readonly<{
  kind: "teaching";
  selection: SelectedOwnerWitness;
  command: TeachingCommand;
}>;
export type SelectedInkOperation = Readonly<{
  kind: "ink";
  selection: SelectedOwnerWitness;
  command: InkCommand;
}>;
export type SelectedOperation =
  SelectedTeachingOperation | SelectedInkOperation;
export type CurrentApplicationRead = Readonly<{
  directory: ProfileDirectory;
  application: ApplicationRead;
}>;
export type CurrentResult<Result> = Readonly<{
  selection: SelectedOwnerWitness;
  value: Result;
}>;
export type SelectedReadTarget = Readonly<{
  selection: SelectedOwnerWitness;
  target: CourseReadTarget;
}>;
export type ExecutionResult =
  | Readonly<{
      kind: "teaching";
      selection: SelectedOwnerWitness;
      result: CommandResult;
    }>
  | Readonly<{
      kind: "ink";
      selection: SelectedOwnerWitness;
      result: InkResult;
    }>;
export interface SelectedExecutionApplication {
  execute(operation: SelectedOperation): Promise<ExecutionResult>;
}
export type SelectedRecoveryOpening =
  | Readonly<{ kind: "cold" }>
  | Readonly<{
      kind: "warm";
      selection: SelectedOwnerWitness;
      retainedStrokeIds: readonly StrokeId[];
      teaching: SelectedTeachingOperation | null;
      administration: ProfileAdministrationCommand | null;
    }>;
export type SelectedRecoveryInventory = RecoveryInventory &
  Readonly<{
    directory: ProfileDirectory;
  }>;
export type AcceptedReceipt =
  CommitReceipt | InkReceipt | ProfileAdministrationReceipt;
export type RecoveryResult<Receipt extends AcceptedReceipt> =
  | Readonly<{
      selection: SelectedOwnerWitness;
      resolution: "rejected";
      result: CommandRejection;
    }>
  | Readonly<{
      selection: SelectedOwnerWitness;
      resolution: "applied";
      result: Receipt;
    }>
  | Readonly<{
      selection: SelectedOwnerWitness;
      resolution: "receiptOnly";
      result: Receipt;
    }>;
export function recoveryResult<Receipt extends AcceptedReceipt>(
  selection: SelectedOwnerWitness,
  result: Receipt | CommandRejection,
  resolution: "applied" | "receiptOnly",
): RecoveryResult<Receipt> {
  if (result.kind === "rejected")
    return deepFreeze({ selection, resolution: "rejected", result });
  if (resolution === "receiptOnly")
    return deepFreeze({ selection, resolution, result });
  return deepFreeze({ selection, resolution, result });
}
export interface SelectedApplication
  extends ProfileAdministrationApplication, SelectedExecutionApplication {
  readApplication(input: SelectedReadTarget): Promise<CurrentApplicationRead>;
  readWork(input: {
    selection: SelectedOwnerWitness;
    runId: RunId;
  }): Promise<CurrentResult<HistoricalWork>>;
  readPracticeControls(input: {
    selection: SelectedOwnerWitness;
    binding: PracticeControlsBinding;
  }): Promise<CurrentResult<PracticeControlsSummary>>;
  readInk(input: {
    selection: SelectedOwnerWitness;
    token: DocumentToken;
  }): Promise<CurrentResult<InkSnapshot>>;
  openRecovery(
    input: SelectedRecoveryOpening,
  ): Promise<SelectedRecoveryInventory>;
  recoverInk(input: {
    recoveryId: string;
    operation: SelectedInkOperation;
  }): Promise<RecoveryResult<InkReceipt>>;
  recoverTeaching(input: {
    recoveryId: string;
    operation: SelectedTeachingOperation;
  }): Promise<RecoveryResult<CommitReceipt>>;
  recoverAdministration(input: {
    recoveryId: string;
    command: ProfileAdministrationCommand;
  }): Promise<RecoveryResult<ProfileAdministrationReceipt>>;
  reconcileRecovery(input: {
    recoveryId: string;
    choice: RecoveryChoice;
  }): Promise<ProfileDirectory>;
}

export class RetiredSelectionError extends Error {
  constructor() {
    super("The selected child lifetime changed before this read completed.");
    this.name = "RetiredSelectionError";
  }
}

export function parseCurrentApplicationRead(
  input: unknown,
): CurrentApplicationRead {
  if (!validateCurrentApplicationRead(input))
    throw new Error("Current application read is unsupported");
  const directory = parseProfileDirectory(input.directory);
  const application = parseApplicationRead(input.application);
  if (
    application.kind === "ready" &&
    (application.witness.owner.profileId !==
      directory.selection.owner.profileId ||
      application.witness.owner.generation !==
        directory.selection.owner.generation)
  )
    throw new Error(
      "Current application owner disagrees with its selected directory",
    );
  return deepFreeze({ directory, application });
}

export function parseCurrentResult<Result>(
  input: unknown,
  parseValue: (value: unknown) => Result,
): CurrentResult<Result> {
  if (!validateCurrentResult(input))
    throw new Error("Current operation result is unsupported");
  return deepFreeze({
    selection: parseSelectedOwnerWitness(input.selection),
    value: parseValue(input.value),
  });
}

export function parseSelectedRecoveryOpening(
  input: unknown,
): SelectedRecoveryOpening {
  if (!validateSelectedRecoveryOpening(input))
    throw new Error("Selected recovery opening is unsupported");
  if (input.kind === "cold") return deepFreeze({ kind: "cold" });
  const selection = parseSelectedOwnerWitness(input.selection);
  const retainedStrokeIds = parseInkStrokeIds(input.retainedStrokeIds);
  if (
    retainedStrokeIds.length > 64 ||
    new Set(retainedStrokeIds).size !== retainedStrokeIds.length
  )
    throw new Error("Invalid retained capture declaration");
  const teaching =
    input.teaching === null ? null : parseSelectedOperation(input.teaching);
  if (
    teaching &&
    (teaching.kind !== "teaching" ||
      canonical(teaching.selection) !== canonical(selection))
  )
    throw new Error(
      "Retained teaching selection differs from its recovery declaration",
    );
  const administration =
    input.administration === null
      ? null
      : parseProfileAdministrationCommand(input.administration);
  if (
    administration &&
    canonical(administration.selection) !== canonical(selection)
  )
    throw new Error(
      "Retained administration selection differs from its recovery declaration",
    );
  return deepFreeze({
    kind: "warm",
    selection,
    retainedStrokeIds,
    teaching,
    administration,
  });
}

export function parseSelectedRecoveryInventory(
  input: unknown,
): SelectedRecoveryInventory {
  if (!validateSelectedRecoveryInventory(input))
    throw new Error("Selected recovery inventory is unsupported");
  const inventory = parseRecoveryInventory({
    kind: input.kind,
    recoveryId: input.recoveryId,
    captures: input.captures,
  });
  return deepFreeze({
    ...inventory,
    directory: parseProfileDirectory(input.directory),
  });
}

export function parseRecoveryResult<Receipt extends AcceptedReceipt>(
  input: unknown,
  parseResult: (value: unknown) => Receipt | CommandRejection,
): RecoveryResult<Receipt> {
  if (!validateRecoveryResult(input))
    throw new Error("Selected recovery result is unsupported");
  const result = parseResult(input.result);
  const selection = parseSelectedOwnerWitness(input.selection);
  if (input.resolution === "rejected") {
    if (result.kind !== "rejected")
      throw new Error("Rejected recovery cannot contain an accepted receipt");
    return deepFreeze({ selection, resolution: input.resolution, result });
  }
  if (result.kind === "rejected")
    throw new Error("Accepted recovery requires a committed receipt");
  if (input.resolution === "receiptOnly")
    return deepFreeze({ selection, resolution: input.resolution, result });
  return deepFreeze({ selection, resolution: input.resolution, result });
}

export function parseSelectedReadTarget(input: unknown): SelectedReadTarget {
  if (!validateSelectedReadTarget(input))
    throw new Error("Selected read target is unsupported");
  const selection = parseSelectedOwnerWitness(input.selection);
  if (input.target.kind === "cursor")
    return deepFreeze({ selection, target: { kind: "cursor" } });
  const receipt = parseDispatchResult(input.target.receipt);
  if (receipt.kind !== "committed")
    throw new Error("Selected accepted read requires a committed receipt");
  return deepFreeze({ selection, target: { kind: "accepted", receipt } });
}
export function parseExecutionResult(input: unknown): ExecutionResult {
  if (!validateExecutionResult(input))
    throw new Error("Selected execution result is unsupported");
  const selection = parseSelectedOwnerWitness(input.selection);
  if (input.kind === "teaching")
    return deepFreeze({
      kind: input.kind,
      selection,
      result: parseDispatchResult(input.result),
    });
  return deepFreeze({
    kind: input.kind,
    selection,
    result: parseInkResult(input.result),
  });
}
export function parseInkResult(input: unknown): InkResult {
  if (!validateInkResult(input))
    throw new Error("Selected ink result is unsupported");
  if (input.kind === "rejected") {
    const rejection = parseDispatchResult(input);
    if (rejection.kind === "rejected") return rejection;
  }
  return parseInkReceipt(input);
}

export function parseSelectedWorkInput(
  input: unknown,
): Parameters<SelectedApplication["readWork"]>[0] {
  if (!validateSelectedWorkInput(input))
    throw new Error("Selected work input is unsupported");
  return deepFreeze({
    selection: parseSelectedOwnerWitness(input.selection),
    runId: parseId({ kind: "run", value: input.runId }),
  });
}
export function parseSelectedInkInput(
  input: unknown,
): Parameters<SelectedApplication["readInk"]>[0] {
  if (!validateSelectedInkInput(input))
    throw new Error("Selected ink input is unsupported");
  return deepFreeze({
    selection: parseSelectedOwnerWitness(input.selection),
    token: parseDocumentToken(input.token),
  });
}
export function parseSelectedControlsInput(
  input: unknown,
): Parameters<SelectedApplication["readPracticeControls"]>[0] {
  if (!validateSelectedControlsInput(input))
    throw new Error("Selected control input is unsupported");
  return deepFreeze({
    selection: parseSelectedOwnerWitness(input.selection),
    binding: parsePracticeControlsBinding(input.binding),
  });
}
export function parseDepartureWitness(input: unknown) {
  if (!validateDepartureWitness(input))
    throw new Error("Profile departure is unsupported");
  return deepFreeze(decodeDepartureWitness(input));
}
export function parseProfileAdministrationResult(
  input: unknown,
): ProfileAdministrationReceipt | CommandRejection {
  if (!validateProfileAdministrationResult(input))
    throw new Error("Profile administration result is unsupported");
  if (input.kind === "profileCommitted")
    return parseProfileAdministrationReceipt(input);
  const result = parseDispatchResult(input);
  if (result.kind !== "rejected") throw new Error("Expected profile rejection");
  return result;
}
export function parseSelectedWorkerRequestWire(input: unknown) {
  if (!validateSelectedWorkerRequest(input))
    throw new Error("Selected worker request is unsupported");
  return deepFreeze(input);
}
export function parseSelectedWorkerResponseWire(input: unknown) {
  if (!validateSelectedWorkerResponse(input))
    throw new Error("Selected worker response is unsupported");
  return deepFreeze(input);
}

export function parseShellBridgeRequest(input: unknown) {
  if (!validateShellBridgeRequest(input))
    throw new Error("Shell bridge request is unsupported");
  const requestId = parseId({ kind: "command", value: input.requestId });
  if (input.kind === "prepare") return deepFreeze({ ...input, requestId });
  return deepFreeze({
    ...input,
    requestId,
    epoch: parseCounter(input.epoch),
    hash: parseShellHash(input.hash),
  });
}
export function parseShellBridgeResponse(input: unknown) {
  if (!validateShellBridgeResponse(input))
    throw new Error("Shell bridge response is unsupported");
  if (input.kind === "invalidated")
    return deepFreeze({ ...input, epoch: parseCounter(input.epoch) });
  const requestId = parseId({ kind: "command", value: input.requestId });
  if (input.kind === "refused") {
    if (
      input.failure.kind === "missing" &&
      (input.failure.path.length < 1 || input.failure.path.length > 1024)
    )
      throw new Error("Invalid shell failure path");
    return deepFreeze({ ...input, requestId });
  }
  return deepFreeze({
    ...input,
    requestId,
    epoch: parseCounter(input.epoch),
    hash: parseShellHash(input.hash),
  });
}
