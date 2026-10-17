import type { ParentSpan, Serialized } from "@readatthree/teaching";

export function plainCopy(span: Serialized<ParentSpan> | undefined) {
  if (span === undefined) return undefined;
  if (!("copy" in span))
    throw new Error("Expected exact legacy plain guidance");
  return span.copy;
}
export function requiredPlainCopy(span: Serialized<ParentSpan>) {
  const copy = plainCopy(span);
  if (!copy) throw new Error("Expected exact legacy guidance");
  return copy;
}
