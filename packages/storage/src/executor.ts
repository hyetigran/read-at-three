import { parseCounter } from "../../teaching/src/index.ts";
import type { Counter } from "../../teaching/src/index.ts";
export type SqlValue = string | number | bigint | Uint8Array | null;
export interface SqlExecutor {
  readonly retired: boolean;
  transaction<T>(work: () => Promise<T>, checkCurrent?: () => void): Promise<T>;
  execute(
    sql: string,
    parameters: readonly SqlValue[],
  ): Promise<{ rows: unknown[][] }>;
}
export class SqlConnectionRetiredError extends Error {
  constructor() {
    super("The local storage connection must be reopened before continuing.");
    this.name = "SqlConnectionRetiredError";
  }
}
export function createSqlExecutor(driver: {
  execute: SqlExecutor["execute"];
  transactionState(): "idle" | "active" | "unknown";
  close(): void;
}): SqlExecutor {
  let retired = false;
  function assertUsable() {
    if (retired) throw new SqlConnectionRetiredError();
  }
  function retire(): never {
    retired = true;
    try {
      driver.close();
    } catch {}
    throw new SqlConnectionRetiredError();
  }
  function state() {
    try {
      return driver.transactionState();
    } catch {
      return "unknown";
    }
  }
  const executor: SqlExecutor = {
    get retired() {
      return retired;
    },
    async execute(sql, parameters) {
      assertUsable();
      return driver.execute(sql, parameters);
    },
    async transaction<T>(
      work: () => Promise<T>,
      checkCurrent?: () => void,
    ): Promise<T> {
      assertUsable();
      if (state() !== "idle") retire();
      checkCurrent?.();
      try {
        await executor.execute("BEGIN IMMEDIATE", []);
        checkCurrent?.();
        const result = await work();
        checkCurrent?.();
        await executor.execute("COMMIT", []);
        if (state() !== "idle") retire();
        return result;
      } catch (error) {
        assertUsable();
        const current = state();
        if (current === "unknown") retire();
        if (current === "active") {
          try {
            await executor.execute("ROLLBACK", []);
          } catch {}
          if (state() !== "idle") retire();
        }
        throw error;
      }
    },
  };
  return executor;
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
