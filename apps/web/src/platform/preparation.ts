import { parsePreparationAvailability } from "@readatthree/teaching";
import type {
  PreparationAvailability,
  RawPreparationInput,
} from "@readatthree/teaching";
import { hashText } from "./hash.ts";

export async function loadBrowserPreparation(): Promise<PreparationAvailability> {
  try {
    const response = await fetch("/preparation/development.json", {
      cache: "no-store",
    });
    if (response.status === 404)
      return { kind: "unavailable", reason: "missing" };
    if (!response.ok) return { kind: "unavailable", reason: "invalid" };
    const text = await response.text();
    if (text.length > 196608) return { kind: "unavailable", reason: "invalid" };
    const input: unknown = JSON.parse(text);
    return parsePreparationAvailability(input, hashText);
  } catch {
    return { kind: "unavailable", reason: "invalid" };
  }
}
export function preparationInput(
  value: PreparationAvailability,
): RawPreparationInput {
  return value.kind === "available"
    ? { kind: "available", package: value.document }
    : value;
}
