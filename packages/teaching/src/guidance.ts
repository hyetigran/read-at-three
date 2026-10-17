import type { Copy, ParentSpan } from "./types.ts";

export function guidanceCopies(span: ParentSpan): readonly Copy[] {
  return "copy" in span ? [span.copy] : span.runs.map((run) => run.copy);
}

export function requirePlainGuidance(
  span: ParentSpan,
): import("./types.ts").PlainParentSpan;
export function requirePlainGuidance(
  span: import("./types.ts").Serialized<ParentSpan>,
): import("./types.ts").Serialized<import("./types.ts").PlainParentSpan>;
export function requirePlainGuidance(
  span: import("./types.ts").Serialized<ParentSpan>,
) {
  if (!("copy" in span))
    throw new Error("Legacy authoring requires plain guidance");
  return span;
}
