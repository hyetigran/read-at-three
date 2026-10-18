import type { ValidateFunction } from "ajv";
import type {
  RawInitialInstallCommand,
  RawInstallationFact,
  RawParentMaterialRequest,
} from "./installation-schemas.ts";
export declare const validateInitialInstallCommand: ValidateFunction<RawInitialInstallCommand>;
export declare const validateInstallationFact: ValidateFunction<RawInstallationFact>;
export declare const validateParentMaterialRequest: ValidateFunction<RawParentMaterialRequest>;
