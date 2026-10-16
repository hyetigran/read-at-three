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

export type WorkerRequest =
  | { id: string; kind: "open"; content: unknown }
  | { id: string; kind: "read" }
  | { id: string; kind: "dispatch"; command: TeachingCommand };
export type WorkerResponse =
  | { id: string; kind: "projection"; value: Projection }
  | { id: string; kind: "receipt"; value: DispatchResult }
  | { id: string; kind: "failed"; message: string };

function validId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 200;
}

export function parseRequest(value: unknown): WorkerRequest {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    !validId(value.id) ||
    !("kind" in value)
  )
    throw new Error("Invalid worker request.");
  if (value.kind === "open" && "content" in value)
    return { id: value.id, kind: "open", content: value.content };
  if (value.kind === "read") return { id: value.id, kind: "read" };
  if (value.kind === "dispatch" && "command" in value)
    return {
      id: value.id,
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
    !validId(value.id) ||
    !("kind" in value)
  )
    throw new Error("Invalid worker response.");
  if (value.kind === "projection" && "value" in value)
    return {
      id: value.id,
      kind: "projection",
      value: parseProjection(value.value),
    };
  if (value.kind === "receipt" && "value" in value)
    return {
      id: value.id,
      kind: "receipt",
      value: parseDispatchResult(value.value),
    };
  if (
    value.kind === "failed" &&
    "message" in value &&
    typeof value.message === "string"
  )
    return { id: value.id, kind: "failed", message: value.message };
  throw new Error("Unsupported worker response.");
}
