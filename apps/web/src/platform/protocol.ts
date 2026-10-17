import {
  parseCurrentApplicationRead,
  parseCurrentResult,
  parseDepartureWitness,
  parseDispatchResult,
  parseExecutionResult,
  parseHistoricalWork,
  parseInkResult,
  parseInkSnapshot,
  parsePracticeControlsSummary,
  parseProfileAdministrationCommand,
  parseProfileAdministrationResult,
  parseProfileDirectory,
  parseRecoveryChoice,
  parseRecoveryResult,
  parseSelectedControlsInput,
  parseSelectedInkInput,
  parseSelectedOperation,
  parseSelectedOwnerWitness,
  parseSelectedReadTarget,
  parseSelectedRecoveryInventory,
  parseSelectedRecoveryOpening,
  parseSelectedWorkerRequestWire,
  parseSelectedWorkerResponseWire,
  parseSelectedWorkInput,
} from "@readatthree/teaching";
import type {
  CommandResult,
  CommitReceipt,
  InkReceipt,
  CurrentApplicationRead,
  CurrentResult,
  DepartureWitness,
  ExecutionResult,
  HistoricalWork,
  InkResult,
  InkSnapshot,
  PracticeControlsSummary,
  ProfileAdministrationReceipt,
  ProfileDirectory,
  CommandRejection,
  RecoveryResult,
  SelectedApplication,
  SelectedRecoveryInventory,
  SelectedRecoveryOpening,
} from "@readatthree/teaching";

export type WorkerRequestId = string & { readonly __brand: "WorkerRequestId" };
type Input<Method extends keyof SelectedApplication> = Parameters<
  SelectedApplication[Method]
>[0];
export type WorkerRequest = { id: WorkerRequestId } & (
  | { kind: "openRecovery"; content: unknown; opening: SelectedRecoveryOpening }
  | { kind: "readDirectory" }
  | { kind: "read"; input: Input<"readApplication"> }
  | { kind: "readWork"; input: Input<"readWork"> }
  | { kind: "readInk"; input: Input<"readInk"> }
  | { kind: "readPracticeControls"; input: Input<"readPracticeControls"> }
  | { kind: "execute"; operation: Input<"execute"> }
  | { kind: "administer"; command: Input<"administer"> }
  | { kind: "readDeparture"; selection: Input<"readDeparture">["selection"] }
  | ({ kind: "recoverInk" } & Input<"recoverInk">)
  | ({ kind: "recoverTeaching" } & Input<"recoverTeaching">)
  | ({ kind: "recoverAdministration" } & Input<"recoverAdministration">)
  | ({ kind: "reconcileRecovery" } & Input<"reconcileRecovery">)
);
export type WorkerResponse = { id: WorkerRequestId } & (
  | { kind: "directory" | "reconciled"; value: ProfileDirectory }
  | { kind: "application"; value: CurrentApplicationRead }
  | { kind: "work"; value: CurrentResult<HistoricalWork> }
  | { kind: "practiceControls"; value: CurrentResult<PracticeControlsSummary> }
  | { kind: "execution"; value: ExecutionResult }
  | {
      kind: "profileReceipt";
      value: ProfileAdministrationReceipt | CommandRejection;
    }
  | { kind: "departure"; value: DepartureWitness }
  | { kind: "inkSnapshot"; value: CurrentResult<InkSnapshot> }
  | { kind: "inventory"; value: SelectedRecoveryInventory }
  | { kind: "inkRecovery"; value: RecoveryResult<InkReceipt> }
  | { kind: "teachingRecovery"; value: RecoveryResult<CommitReceipt> }
  | {
      kind: "administrationRecovery";
      value: RecoveryResult<ProfileAdministrationReceipt>;
    }
  | { kind: "failed"; message: string }
);
export function parseWorkerRequestId(value: unknown): WorkerRequestId {
  if (typeof value !== "string" || value.length < 1 || value.length > 200)
    throw new Error("Invalid worker request identity.");
  return value as WorkerRequestId;
}
function recoveryId(value: string): string {
  if (value.length < 1 || value.length > 200)
    throw new Error("Invalid recovery identity.");
  return value;
}
export function parseRequest(input: unknown): WorkerRequest {
  const value = parseSelectedWorkerRequestWire(input);
  const id = parseWorkerRequestId(value.id);
  switch (value.kind) {
    case "openRecovery":
      return {
        id,
        kind: value.kind,
        content: value.content,
        opening: parseSelectedRecoveryOpening(value.opening),
      };
    case "readDirectory":
      return { id, kind: value.kind };
    case "read":
      return {
        id,
        kind: value.kind,
        input: parseSelectedReadTarget(value.input),
      };
    case "readWork":
      return {
        id,
        kind: value.kind,
        input: parseSelectedWorkInput(value.input),
      };
    case "readInk":
      return {
        id,
        kind: value.kind,
        input: parseSelectedInkInput(value.input),
      };
    case "readPracticeControls":
      return {
        id,
        kind: value.kind,
        input: parseSelectedControlsInput(value.input),
      };
    case "execute":
      return {
        id,
        kind: value.kind,
        operation: parseSelectedOperation(value.operation),
      };
    case "administer":
      return {
        id,
        kind: value.kind,
        command: parseProfileAdministrationCommand(value.command),
      };
    case "readDeparture":
      return {
        id,
        kind: value.kind,
        selection: parseSelectedOwnerWitness(value.selection),
      };
    case "recoverInk": {
      const operation = parseSelectedOperation(value.operation);
      if (operation.kind !== "ink")
        throw new Error("Ink recovery requires a retained ink operation.");
      return {
        id,
        kind: value.kind,
        recoveryId: recoveryId(value.recoveryId),
        operation,
      };
    }
    case "recoverTeaching": {
      const operation = parseSelectedOperation(value.operation);
      if (operation.kind !== "teaching")
        throw new Error(
          "Teaching recovery requires a retained teaching operation.",
        );
      return {
        id,
        kind: value.kind,
        recoveryId: recoveryId(value.recoveryId),
        operation,
      };
    }
    case "recoverAdministration":
      return {
        id,
        kind: value.kind,
        recoveryId: recoveryId(value.recoveryId),
        command: parseProfileAdministrationCommand(value.command),
      };
    case "reconcileRecovery":
      return {
        id,
        kind: value.kind,
        recoveryId: recoveryId(value.recoveryId),
        choice: parseRecoveryChoice(value.choice),
      };
  }
}
export function parseResponse(input: unknown): WorkerResponse {
  const value = parseSelectedWorkerResponseWire(input);
  const id = parseWorkerRequestId(value.id);
  switch (value.kind) {
    case "directory":
    case "reconciled":
      return {
        id,
        kind: value.kind,
        value: parseProfileDirectory(value.value),
      };
    case "application":
      return {
        id,
        kind: value.kind,
        value: parseCurrentApplicationRead(value.value),
      };
    case "work":
      return {
        id,
        kind: value.kind,
        value: parseCurrentResult(value.value, parseHistoricalWork),
      };
    case "practiceControls":
      return {
        id,
        kind: value.kind,
        value: parseCurrentResult(value.value, parsePracticeControlsSummary),
      };
    case "execution":
      return { id, kind: value.kind, value: parseExecutionResult(value.value) };
    case "profileReceipt":
      return {
        id,
        kind: value.kind,
        value: parseProfileAdministrationResult(value.value),
      };
    case "departure":
      return {
        id,
        kind: value.kind,
        value: parseDepartureWitness(value.value),
      };
    case "inkSnapshot":
      return {
        id,
        kind: value.kind,
        value: parseCurrentResult(value.value, parseInkSnapshot),
      };
    case "inventory":
      return {
        id,
        kind: value.kind,
        value: parseSelectedRecoveryInventory(value.value),
      };
    case "inkRecovery":
      return {
        id,
        kind: value.kind,
        value: parseRecoveryResult(value.value, parseInkResult),
      };
    case "teachingRecovery":
      return {
        id,
        kind: value.kind,
        value: parseRecoveryResult(value.value, parseDispatchResult),
      };
    case "administrationRecovery":
      return {
        id,
        kind: value.kind,
        value: parseRecoveryResult(
          value.value,
          parseProfileAdministrationResult,
        ),
      };
    case "failed":
      return { id, kind: value.kind, message: value.message };
  }
}
