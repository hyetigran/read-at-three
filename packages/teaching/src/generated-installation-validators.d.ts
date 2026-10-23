import type { ValidateFunction } from "ajv";
import type {
  RawPublicationSelection,
  RawPublicationCheck,
  RawInstalledResourceFailure,
  RawParentMaterialWire,
  RawInitialInstallCommand,
  RawInstallationFact,
  RawParentMaterialRequest,
  RawActivationWitness,
  RawInstallationRead,
  RawInstallationCatalog,
  RawLessonFilesCommand,
  RawLessonFilesReceipt,
  RawLessonFilesView,
  RawCacheCleanupView,
  RawCacheCleanupCommand,
  RawCacheCleanupResult,
} from "./installation-schemas.ts";
export declare const validatePublicationSelection: ValidateFunction<RawPublicationSelection>;
export declare const validatePublicationCheck: ValidateFunction<RawPublicationCheck>;
export declare const validateInstalledResourceFailure: ValidateFunction<RawInstalledResourceFailure>;
export declare const validateParentMaterialWire: ValidateFunction<RawParentMaterialWire>;
export declare const validateInitialInstallCommand: ValidateFunction<RawInitialInstallCommand>;
export declare const validateInstallationFact: ValidateFunction<RawInstallationFact>;
export declare const validateParentMaterialRequest: ValidateFunction<RawParentMaterialRequest>;
export declare const validateActivationWitness: ValidateFunction<RawActivationWitness>;
export declare const validateInstallationRead: ValidateFunction<RawInstallationRead>;
export declare const validateInstallationCatalog: ValidateFunction<RawInstallationCatalog>;
export declare const validateLessonFilesCommand: ValidateFunction<RawLessonFilesCommand>;
export declare const validateLessonFilesReceipt: ValidateFunction<RawLessonFilesReceipt>;
export declare const validateLessonFilesView: ValidateFunction<RawLessonFilesView>;
export declare const validateCacheCleanupView: ValidateFunction<RawCacheCleanupView>;
export declare const validateCacheCleanupCommand: ValidateFunction<RawCacheCleanupCommand>;
export declare const validateCacheCleanupResult: ValidateFunction<RawCacheCleanupResult>;
