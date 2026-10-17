import type { ValidateFunction } from "ajv";
import type {
  RawDiagnosticEvent,
  RawDiagnosticRing,
  RawProfileRemovalCommand,
  RawProfileResetReceipt,
  RawProfileDeletionReceipt,
  RawPreferences,
  RawPreparationPolicy,
  RawProfileDirectory,
  RawProfileAdministrationCommand,
  RawProfileAdministrationReceipt,
} from "./profile-schemas.ts";
export declare const validateDiagnosticEvent: ValidateFunction<RawDiagnosticEvent>;
export declare const validateDiagnosticRing: ValidateFunction<RawDiagnosticRing>;
export declare const validateProfileRemovalCommand: ValidateFunction<RawProfileRemovalCommand>;
export declare const validateProfileResetReceipt: ValidateFunction<RawProfileResetReceipt>;
export declare const validateProfileDeletionReceipt: ValidateFunction<RawProfileDeletionReceipt>;
export declare const validateLocalPreferences: ValidateFunction<RawPreferences>;
export declare const validatePreparationPolicy: ValidateFunction<RawPreparationPolicy>;
export declare const validateProfileDirectory: ValidateFunction<RawProfileDirectory>;
export declare const validateProfileAdministrationCommand: ValidateFunction<RawProfileAdministrationCommand>;
export declare const validateProfileAdministrationReceipt: ValidateFunction<RawProfileAdministrationReceipt>;
