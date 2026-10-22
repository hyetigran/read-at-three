import type { ValidateFunction } from "ajv";
import type {
  RawStartFreshCommand,
  RawStoreResetRecord,
  RawShellBridgeRequest,
  RawShellBridgeResponse,
  RawSelectedOwnerWitness,
  RawSelectedOperation,
  RawSelectedReadTarget,
  RawCurrentApplicationRead,
  RawCurrentResult,
  RawExecutionResult,
  RawSelectedRecoveryOpening,
  RawSelectedRecoveryInventory,
  RawRecoveryResult,
  RawInkResult,
  RawSelectedWorkInput,
  RawSelectedInkInput,
  RawSelectedControlsInput,
  RawDepartureWitness,
  RawProfileAdministrationResult,
  RawSelectedWorkerRequest,
  RawSelectedWorkerResponse,
} from "./selection-schemas.ts";
export declare const validateStartFreshCommand: ValidateFunction<RawStartFreshCommand>;
export declare const validateStoreResetRecord: ValidateFunction<RawStoreResetRecord>;
export declare const validateShellBridgeRequest: ValidateFunction<RawShellBridgeRequest>;
export declare const validateShellBridgeResponse: ValidateFunction<RawShellBridgeResponse>;
export declare const validateSelectedOwnerWitness: ValidateFunction<RawSelectedOwnerWitness>;
export declare const validateSelectedOperation: ValidateFunction<RawSelectedOperation>;
export declare const validateSelectedReadTarget: ValidateFunction<RawSelectedReadTarget>;
export declare const validateCurrentApplicationRead: ValidateFunction<RawCurrentApplicationRead>;
export declare const validateCurrentResult: ValidateFunction<RawCurrentResult>;
export declare const validateExecutionResult: ValidateFunction<RawExecutionResult>;
export declare const validateSelectedRecoveryOpening: ValidateFunction<RawSelectedRecoveryOpening>;
export declare const validateSelectedRecoveryInventory: ValidateFunction<RawSelectedRecoveryInventory>;
export declare const validateRecoveryResult: ValidateFunction<RawRecoveryResult>;
export declare const validateInkResult: ValidateFunction<RawInkResult>;
export declare const validateSelectedWorkInput: ValidateFunction<RawSelectedWorkInput>;
export declare const validateSelectedInkInput: ValidateFunction<RawSelectedInkInput>;
export declare const validateSelectedControlsInput: ValidateFunction<RawSelectedControlsInput>;
export declare const validateDepartureWitness: ValidateFunction<RawDepartureWitness>;
export declare const validateProfileAdministrationResult: ValidateFunction<RawProfileAdministrationResult>;
export declare const validateSelectedWorkerRequest: ValidateFunction<RawSelectedWorkerRequest>;
export declare const validateSelectedWorkerResponse: ValidateFunction<RawSelectedWorkerResponse>;
