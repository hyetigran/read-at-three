import type { ValidateFunction } from "ajv";
import type {
  PrintedPreviewTask,
  PracticeControlsBinding,
  PracticeControlsSummary,
  DocumentToken,
  InkSnapshot,
  RecoveryOpening,
  RecoveryChoice,
  RecoveryInventory,
  BrushSpec,
  StrokeIdList,
  InkOperation,
  InkCommand,
  InkReceipt,
  ApplicationRead,
  HistoricalWork,
  DevelopmentPackage,
  CumulativeDevelopmentPackage,
  TeachingState,
  TeachingCommand,
  CommitReceipt,
  CommittedProjection,
  CommandResult,
} from "./index.ts";
export declare const validatePrintedPreviewTask: ValidateFunction<PrintedPreviewTask>;
export declare const validatePracticeControlsBinding: ValidateFunction<PracticeControlsBinding>;
export declare const validatePracticeControlsSummary: ValidateFunction<PracticeControlsSummary>;
export declare const validateDocumentToken: ValidateFunction<DocumentToken>;
export declare const validateInkSnapshot: ValidateFunction<InkSnapshot>;
export declare const validateRecoveryOpening: ValidateFunction<RecoveryOpening>;
export declare const validateRecoveryChoice: ValidateFunction<RecoveryChoice>;
export declare const validateRecoveryInventory: ValidateFunction<RecoveryInventory>;
export declare const validateInkBrush: ValidateFunction<BrushSpec>;
export declare const validateInkStrokeIds: ValidateFunction<StrokeIdList>;
export declare const validateInkOperation: ValidateFunction<InkOperation>;
export declare const validateInkCommand: ValidateFunction<InkCommand>;
export declare const validateInkReceipt: ValidateFunction<InkReceipt>;
export declare const validateApplicationRead: ValidateFunction<ApplicationRead>;
export declare const validateHistoricalWork: ValidateFunction<HistoricalWork>;
export declare const validatePackage: ValidateFunction<DevelopmentPackage>;
export declare const validateCumulativePackage: ValidateFunction<CumulativeDevelopmentPackage>;
export declare const validateState: ValidateFunction<TeachingState>;
export declare const validateCommand: ValidateFunction<TeachingCommand>;
export declare const validateReceipt: ValidateFunction<CommitReceipt>;
export declare const validateProjection: ValidateFunction<CommittedProjection>;
export declare const validateResult: ValidateFunction<CommandResult>;
