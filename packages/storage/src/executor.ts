import { parseCounter } from "../../teaching/src/index.ts";
import type { Counter } from "../../teaching/src/index.ts";
export type SqlValue = string | number | bigint | Uint8Array | null;
export interface SqlExecutor {
  execute(
    sql: string,
    parameters: readonly SqlValue[],
  ): Promise<{ rows: unknown[][] }>;
}
export function sqlValues(values: readonly unknown[]): SqlValue[] {
  return values.map((value) => {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "bigint" ||
      value instanceof Uint8Array
    )
      return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    throw new Error("Unsupported SQLite parameter");
  });
}
export function readCounter(value: unknown): Counter {
  if (typeof value === "bigint" && value >= 0n && value <= 9223372036854775807n)
    return parseCounter(value.toString());
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
    return parseCounter(value.toString());
  throw new Error("SQLite counter is not a lossless signed-64 integer");
}
