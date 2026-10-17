import type { ValidateFunction } from "ajv";
import type {
  RawPreparationInput,
  RawPreparationPackage,
} from "./preparation-schemas.ts";
export declare const validatePreparationInput: ValidateFunction<RawPreparationInput>;
export declare const validatePreparationPackage: ValidateFunction<RawPreparationPackage>;
