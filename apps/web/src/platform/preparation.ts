import type {
  PreparationAvailability,
  RawPreparationInput,
} from "@readatthree/teaching";

export function preparationInput(
  value: PreparationAvailability,
): RawPreparationInput {
  return value.kind === "available"
    ? { kind: "available", package: value.document }
    : value;
}
