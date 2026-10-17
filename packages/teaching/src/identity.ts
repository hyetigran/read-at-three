import canonicalize from "canonicalize";
import { unicodeLength } from "./unicode-length.ts";
import type { Id, IdKind, Hash, HashKind, Counter } from "./types.ts";
export function canonical(value: unknown): string {
  const result = canonicalize(value);
  if (typeof result !== "string")
    throw new Error("Value cannot be canonically encoded");
  return result;
}
export function parseId<Kind extends IdKind>({
  kind,
  value,
}: {
  kind: Kind;
  value: unknown;
}): Id<Kind> {
  if (
    typeof value !== "string" ||
    unicodeLength(value) < 1 ||
    unicodeLength(value) > 200
  )
    throw new Error(`Invalid ${kind} identity`);
  return value as Id<Kind>;
}
export function parseHash<Kind extends HashKind>({
  kind,
  value,
}: {
  kind: Kind;
  value: unknown;
}): Hash<Kind> {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    throw new Error(`Invalid ${kind} hash`);
  return value as Hash<Kind>;
}
export function parseCounter(value: unknown): Counter {
  if (
    typeof value !== "string" ||
    !/^(0|[1-9][0-9]{0,18})$/.test(value) ||
    BigInt(value) > 9223372036854775807n
  )
    throw new Error("Invalid signed-64 counter");
  return value as Counter;
}
export function increment(value: string): Counter {
  return parseCounter((BigInt(parseCounter(value)) + 1n).toString());
}
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
