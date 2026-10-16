import {
  parseCommand,
  parseDispatchResult,
  parseProjection,
} from "@readatthree/teaching";
import type {
  DispatchResult,
  Projection,
  TeachingCommand,
} from "@readatthree/teaching";

export type WorkerRequestId = string & { readonly __brand: "WorkerRequestId" };
export type WorkerRequest =
  | { id: WorkerRequestId; kind: "open"; content: unknown }
  | { id: WorkerRequestId; kind: "read" }
  | { id: WorkerRequestId; kind: "dispatch"; command: TeachingCommand };
export type WorkerResponse =
  | { id: WorkerRequestId; kind: "projection"; value: Projection }
  | { id: WorkerRequestId; kind: "receipt"; value: DispatchResult }
  | { id: WorkerRequestId; kind: "failed"; message: string };

export function parseWorkerRequestId(value: unknown): WorkerRequestId {
  if (typeof value !== "string" || value.length < 1 || value.length > 200)
    throw new Error("Invalid worker request identity.");
  return value as WorkerRequestId;
}

export function parseRequest(value: unknown): WorkerRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    !("kind" in value)
  )
    throw new Error("Invalid worker request.");
  const id = parseWorkerRequestId(value.id);
  if (value.kind === "open" && "content" in value)
    return { id, kind: "open", content: value.content };
  if (value.kind === "read") return { id, kind: "read" };
  if (value.kind === "dispatch" && "command" in value)
    return {
      id,
      kind: "dispatch",
      command: parseCommand(value.command),
    };
  throw new Error("Unsupported worker request.");
}

export function parseResponse(value: unknown): WorkerResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    !("kind" in value)
  )
    throw new Error("Invalid worker response.");
  const id = parseWorkerRequestId(value.id);
  if (value.kind === "projection" && "value" in value)
    return {
      id,
      kind: "projection",
      value: parseProjection(value.value),
    };
  if (value.kind === "receipt" && "value" in value)
    return {
      id,
      kind: "receipt",
      value: parseDispatchResult(value.value),
    };
  if (
    value.kind === "failed" &&
    "message" in value &&
    typeof value.message === "string"
  )
    return { id, kind: "failed", message: value.message };
  throw new Error("Unsupported worker response.");
}
