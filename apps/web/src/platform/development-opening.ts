import { parsePreparationAvailability } from "@readatthree/teaching";
import type { PreparationAvailability } from "@readatthree/teaching";
import { hashText } from "./hash.ts";
export async function loadDevelopmentPreparation(): Promise<PreparationAvailability> {
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

export async function loadDevelopmentContent(): Promise<unknown> {
  const response = await fetch("/curriculum/development.json", {
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(
      "The required lesson content is unavailable. Keep saved work and retry.",
    );
  return response.json();
}
export async function loadDevelopmentOpening() {
  const content = await loadDevelopmentContent();
  const preparation = await loadDevelopmentPreparation();
  return { content, preparation };
}
