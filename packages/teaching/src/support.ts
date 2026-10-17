import type { RawDiagnosticEvent } from "./profile-schemas.ts";
import {
  validateDiagnosticEvent,
  validateDiagnosticRing,
} from "./generated-profile-validators.js";
import { canonical, deepFreeze } from "./identity.ts";

export const DIAGNOSTIC_LIMITS = Object.freeze({
  bytes: 1024 * 1024,
  records: 4096,
  eventCount: 1000000,
  durationMs: 600000,
  previewBytes: 8192,
});
export type DiagnosticEvent = Readonly<RawDiagnosticEvent>;
export type DiagnosticRing = Readonly<{
  version: 1;
  omitted: number;
  records: readonly DiagnosticEvent[];
}>;
export type DiagnosticRead = Readonly<{
  persistence: "durable" | "memoryOnly";
  ring: DiagnosticRing;
}>;
export interface LocalSupportApplication {
  recordDiagnostic(event: DiagnosticEvent): Promise<DiagnosticRead>;
  readDiagnostics(): Promise<DiagnosticRead>;
}
export function parseDiagnosticEvent(input: unknown): DiagnosticEvent {
  if (
    !validateDiagnosticEvent(input) ||
    input.count < 1 ||
    input.count > DIAGNOSTIC_LIMITS.eventCount ||
    input.durationMs > DIAGNOSTIC_LIMITS.durationMs
  )
    throw new Error("Diagnostic event is unsupported");
  return deepFreeze({ ...input });
}
export function parseDiagnosticRing(input: unknown): DiagnosticRing {
  if (
    !validateDiagnosticRing(input) ||
    input.version !== 1 ||
    !Number.isSafeInteger(input.omitted) ||
    input.omitted < 0 ||
    input.records.length > DIAGNOSTIC_LIMITS.records
  )
    throw new Error("Diagnostic ring is unsupported");
  const result = {
    version: 1,
    omitted: input.omitted,
    records: input.records.map(parseDiagnosticEvent),
  } satisfies DiagnosticRing;
  if (canonical(result).length > DIAGNOSTIC_LIMITS.bytes)
    throw new Error("Diagnostic ring exceeds its encoded bound");
  return deepFreeze(result);
}
export function appendDiagnostic(
  ring: DiagnosticRing,
  input: DiagnosticEvent,
): DiagnosticRing {
  const records = [...ring.records, parseDiagnosticEvent(input)];
  let omitted = ring.omitted;
  while (
    records.length > DIAGNOSTIC_LIMITS.records ||
    canonical({ version: 1, omitted, records }).length > DIAGNOSTIC_LIMITS.bytes
  ) {
    records.shift();
    omitted = Math.min(Number.MAX_SAFE_INTEGER, omitted + 1);
  }
  return parseDiagnosticRing({ version: 1, omitted, records });
}
export function diagnosticPreview(read: DiagnosticRead): string {
  const totals = new Map<
    DiagnosticEvent["category"],
    { count: number; durationMs: number }
  >();
  for (const record of read.ring.records) {
    const previous = totals.get(record.category) ?? { count: 0, durationMs: 0 };
    totals.set(record.category, {
      count: previous.count + record.count,
      durationMs: previous.durationMs + record.durationMs,
    });
  }
  const result = canonical({
    version: 1,
    persistence: read.persistence,
    omitted: read.ring.omitted,
    totals: [...totals].map(([category, totals]) => ({ category, ...totals })),
  });
  if (result.length > DIAGNOSTIC_LIMITS.previewBytes)
    throw new Error("Diagnostic preview exceeds its encoded bound");
  return result;
}
