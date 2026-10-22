import {
  parsePreparationInput,
  parseInitialInstallCommand,
  parsePublicationSelection,
  parsePublicationCheck,
  parseInstalledResourceFailure,
  parseParentMaterialRequest,
  parseParentMaterialWire,
  parseInstallationRead,
  parseInstallationCatalog,
  parseStorageCleanupCommand,
  parseStorageCleanupView,
  parseStorageCleanupReceipt,
  parseLessonFilesCommand,
  parseLessonFilesReceipt,
  parseLessonFilesView,
  parseDiagnosticEvent,
  parseDiagnosticRing,
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
  DiagnosticEvent,
  DiagnosticRead,
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
  RawPreparationInput,
  InitialInstallCommand,
  InstallationRead,
  InstallationCatalog,
  PublicationSelection,
  PublicationCheck,
  InstalledResourceFailure,
  ParentMaterialRequest,
  ParentMaterialRead,
  StorageCleanupCommand,
  StorageCleanupView,
  StorageCleanupReceipt,
  SelectedOwnerWitness,
  LessonFilesCommand,
  LessonFilesReceipt,
  LessonFilesView,
} from "@readatthree/teaching";

export type LocalSupportMetadata = Readonly<{
  versions: Readonly<{
    application: string;
    database: number;
    inkCodec: number;
  }>;
  capabilities: Readonly<{
    opfs: boolean;
    storeLock: boolean;
    sqliteBigInt: boolean;
  }>;
}>;

export type WorkerRequestId = string & { readonly __brand: "WorkerRequestId" };
type Input<Method extends keyof SelectedApplication> = Parameters<
  SelectedApplication[Method]
>[0];
type MaterialWire = ReturnType<typeof parseParentMaterialWire>;
export function serializeParentMaterial(
  value: ParentMaterialRead,
): MaterialWire {
  if (value.kind === "unavailable")
    return parseParentMaterialWire({
      kind: "unavailable",
      packageHash: value.packageHash,
      reason: value.failure.kind,
    });
  if (value.kind === "firstTaskPreview") {
    if (
      value.task.kind !== "printedGraphV1" &&
      value.task.kind !== "printedGraphV2"
    )
      return parseParentMaterialWire({
        kind: "unavailable",
        packageHash: value.packageHash,
        reason: "unsupportedPreview",
      });
    return parseParentMaterialWire({
      kind: value.kind,
      packageHash: value.packageHash,
      task: value.task,
    });
  }
  const { formatVersion, preparationHash, body, assets } = value.document;
  return parseParentMaterialWire(
    JSON.parse(
      JSON.stringify({
        kind: "preparation",
        packageHash: value.packageHash,
        document: { formatVersion, preparationHash, body, assets },
      }),
    ),
  );
}
export type WorkerRequest = { id: WorkerRequestId } & (
  | {
      kind: "openRecovery";
      content: unknown;
      preparation: RawPreparationInput;
      opening: SelectedRecoveryOpening;
    }
  | { kind: "openInstalledRecovery"; opening: SelectedRecoveryOpening }
  | { kind: "readDirectory" }
  | { kind: "installations" }
  | { kind: "readLessonFiles" }
  | { kind: "changeLessonFiles"; command: LessonFilesCommand }
  | { kind: "initialInstall"; command: InitialInstallCommand }
  | {
      kind: "checkPublication" | "repairPublication";
      input: PublicationSelection;
    }
  | { kind: "parentMaterial"; input: ParentMaterialRequest }
  | { kind: "readDiagnostics" }
  | { kind: "recordDiagnostic"; event: DiagnosticEvent }
  | { kind: "readStorageCleanup"; selection: SelectedOwnerWitness }
  | { kind: "cleanupStorage"; command: StorageCleanupCommand }
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
  | { kind: "installationCatalog"; value: InstallationCatalog }
  | { kind: "installationRead"; value: InstallationRead }
  | { kind: "storageCleanup"; value: StorageCleanupView }
  | { kind: "storageCleanupReceipt"; value: StorageCleanupReceipt }
  | { kind: "lessonFiles"; value: LessonFilesView }
  | { kind: "lessonFilesReceipt"; value: LessonFilesReceipt }
  | {
      kind: "publicationCheck";
      operation: "check" | "repair";
      value: PublicationCheck;
    }
  | { kind: "storageFull" }
  | { kind: "contentUnavailable"; value: InstalledResourceFailure }
  | { kind: "parentMaterial"; value: MaterialWire }
  | {
      kind: "diagnostics";
      value: DiagnosticRead;
      metadata: LocalSupportMetadata;
    }
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
  | { kind: "storageBusy" }
  | { kind: "connectionLost" }
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
    case "openInstalledRecovery":
      return {
        id,
        kind: value.kind,
        opening: parseSelectedRecoveryOpening(value.opening),
      };
    case "openRecovery":
      return {
        id,
        kind: value.kind,
        content: value.content,
        preparation: parsePreparationInput(value.preparation),
        opening: parseSelectedRecoveryOpening(value.opening),
      };
    case "initialInstall":
      return {
        id,
        kind: value.kind,
        command: parseInitialInstallCommand(value.command),
      };
    case "readStorageCleanup":
      return {
        id,
        kind: value.kind,
        selection: parseSelectedOwnerWitness(value.selection),
      };
    case "cleanupStorage":
      return {
        id,
        kind: value.kind,
        command: parseStorageCleanupCommand(value.command),
      };
    case "changeLessonFiles":
      return {
        id,
        kind: value.kind,
        command: parseLessonFilesCommand(value.command),
      };
    case "checkPublication":
    case "repairPublication":
      return {
        id,
        kind: value.kind,
        input: parsePublicationSelection(value.input),
      };
    case "parentMaterial":
      return {
        id,
        kind: value.kind,
        input: parseParentMaterialRequest(value.input),
      };
    case "installations":
    case "readLessonFiles":
    case "readDirectory":
    case "readDiagnostics":
      return { id, kind: value.kind };
    case "recordDiagnostic":
      return { id, kind: value.kind, event: parseDiagnosticEvent(value.event) };
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
    case "storageCleanup":
      return {
        id,
        kind: value.kind,
        value: parseStorageCleanupView(value.value),
      };
    case "storageCleanupReceipt":
      return {
        id,
        kind: value.kind,
        value: parseStorageCleanupReceipt(value.value),
      };
    case "lessonFiles":
      return { id, kind: value.kind, value: parseLessonFilesView(value.value) };
    case "lessonFilesReceipt":
      return {
        id,
        kind: value.kind,
        value: parseLessonFilesReceipt(value.value),
      };
    case "publicationCheck":
      return {
        id,
        kind: value.kind,
        operation: value.operation,
        value: parsePublicationCheck(value.value),
      };
    case "storageFull":
      return { id, kind: value.kind };
    case "contentUnavailable":
      return {
        id,
        kind: value.kind,
        value: parseInstalledResourceFailure(value.value),
      };
    case "installationCatalog":
      return {
        id,
        kind: value.kind,
        value: parseInstallationCatalog(value.value),
      };
    case "installationRead":
      return {
        id,
        kind: value.kind,
        value: parseInstallationRead(value.value),
      };
    case "parentMaterial":
      return {
        id,
        kind: value.kind,
        value: parseParentMaterialWire(value.value),
      };
    case "directory":
    case "reconciled":
      return {
        id,
        kind: value.kind,
        value: parseProfileDirectory(value.value),
      };
    case "diagnostics":
      if (
        value.metadata.versions.application.length > 64 ||
        !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(
          value.metadata.versions.application,
        ) ||
        value.metadata.versions.database < 1 ||
        value.metadata.versions.inkCodec !== 1
      )
        throw new Error("Unsupported local support version metadata.");
      return {
        id,
        kind: value.kind,
        value: {
          persistence: value.value.persistence,
          ring: parseDiagnosticRing(value.value.ring),
        },
        metadata: value.metadata,
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
    case "storageBusy":
    case "connectionLost":
      return { id, kind: value.kind };
    case "failed":
      return { id, kind: value.kind, message: value.message };
  }
}
