import {
  parseId,
  parseCommand,
  parseDispatchResult,
  parseProjection,
  parseDocumentToken,
  parseInkCommand,
  parseInkReceipt,
  parseInkSnapshot,
  parseRecoveryOpening,
  parseRecoveryChoice,
  parseRecoveryInventory,
} from "@readatthree/teaching";
import type {
  CourseId,
  DispatchResult,
  Projection,
  TeachingCommand,
  DocumentToken,
  InkCommand,
  InkResult,
  InkSnapshot,
  RecoveryOpening,
  RecoveryChoice,
  RecoveryInventory,
} from "@readatthree/teaching";

export type WorkerRequestId = string & { readonly __brand: "WorkerRequestId" };
export type WorkerRequest =
  | {
      id: WorkerRequestId;
      kind: "openRecovery";
      content: unknown;
      opening: RecoveryOpening;
    }
  | { id: WorkerRequestId; kind: "read" }
  | { id: WorkerRequestId; kind: "dispatch"; command: TeachingCommand }
  | {
      id: WorkerRequestId;
      kind: "recoverTeaching";
      recoveryId: string;
      command: TeachingCommand;
    }
  | { id: WorkerRequestId; kind: "readInk"; token: DocumentToken }
  | { id: WorkerRequestId; kind: "dispatchInk"; command: InkCommand }
  | {
      id: WorkerRequestId;
      kind: "recoverInk";
      recoveryId: string;
      command: InkCommand;
    }
  | {
      id: WorkerRequestId;
      kind: "reconcileRecovery";
      recoveryId: string;
      choice: RecoveryChoice;
    };
export type WorkerResponse =
  | {
      id: WorkerRequestId;
      kind: "projection";
      courseId: CourseId;
      value: Projection;
    }
  | { id: WorkerRequestId; kind: "receipt"; value: DispatchResult }
  | { id: WorkerRequestId; kind: "inkReceipt"; value: InkResult }
  | { id: WorkerRequestId; kind: "inkSnapshot"; value: InkSnapshot }
  | { id: WorkerRequestId; kind: "inventory"; value: RecoveryInventory }
  | { id: WorkerRequestId; kind: "failed"; message: string };

export function parseWorkerRequestId(value: unknown): WorkerRequestId {
  if (typeof value !== "string" || value.length < 1 || value.length > 200)
    throw new Error("Invalid worker request identity.");
  return value as WorkerRequestId;
}
function exact(value: object, keys: readonly string[]) {
  if (
    Object.keys(value).length !== keys.length ||
    Object.keys(value).some((key) => !keys.includes(key))
  )
    throw new Error("Unexpected worker envelope fields.");
}
function recoveryId(value: unknown): string {
  if (typeof value !== "string" || value.length < 1 || value.length > 200)
    throw new Error("Invalid recovery identity.");
  return value;
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
  switch (value.kind) {
    case "openRecovery":
      if ("content" in value && "opening" in value) {
        exact(value, ["id", "kind", "content", "opening"]);
        return {
          id,
          kind: value.kind,
          content: value.content,
          opening: parseRecoveryOpening(value.opening),
        };
      }
      break;
    case "read":
      exact(value, ["id", "kind"]);
      return { id, kind: value.kind };
    case "dispatch":
    case "dispatchInk":
      if ("command" in value) {
        exact(value, ["id", "kind", "command"]);
        return value.kind === "dispatch"
          ? { id, kind: value.kind, command: parseCommand(value.command) }
          : { id, kind: value.kind, command: parseInkCommand(value.command) };
      }
      break;
    case "readInk":
      if ("token" in value) {
        exact(value, ["id", "kind", "token"]);
        return { id, kind: value.kind, token: parseDocumentToken(value.token) };
      }
      break;
    case "recoverTeaching":
      if ("recoveryId" in value && "command" in value) {
        exact(value, ["id", "kind", "recoveryId", "command"]);
        return {
          id,
          kind: value.kind,
          recoveryId: recoveryId(value.recoveryId),
          command: parseCommand(value.command),
        };
      }
      break;
    case "recoverInk":
      if ("recoveryId" in value && "command" in value) {
        exact(value, ["id", "kind", "recoveryId", "command"]);
        return {
          id,
          kind: value.kind,
          recoveryId: recoveryId(value.recoveryId),
          command: parseInkCommand(value.command),
        };
      }
      break;
    case "reconcileRecovery":
      if ("recoveryId" in value && "choice" in value) {
        exact(value, ["id", "kind", "recoveryId", "choice"]);
        return {
          id,
          kind: value.kind,
          recoveryId: recoveryId(value.recoveryId),
          choice: parseRecoveryChoice(value.choice),
        };
      }
      break;
  }
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
  if (
    value.kind === "failed" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    exact(value, ["id", "kind", "message"]);
    return { id, kind: value.kind, message: value.message };
  }
  if (!("value" in value)) throw new Error("Missing worker response value.");
  exact(
    value,
    value.kind === "projection"
      ? ["id", "kind", "courseId", "value"]
      : ["id", "kind", "value"],
  );
  switch (value.kind) {
    case "projection":
      if (!("courseId" in value))
        throw new Error("Missing verified course identity.");
      return {
        id,
        kind: value.kind,
        courseId: parseId({ kind: "course", value: value.courseId }),
        value: parseProjection(value.value),
      };
    case "receipt":
      return { id, kind: value.kind, value: parseDispatchResult(value.value) };
    case "inkSnapshot":
      return { id, kind: value.kind, value: parseInkSnapshot(value.value) };
    case "inventory":
      return {
        id,
        kind: value.kind,
        value: parseRecoveryInventory(value.value),
      };
    case "inkReceipt": {
      if (
        typeof value.value === "object" &&
        value.value !== null &&
        "kind" in value.value &&
        value.value.kind === "inkCommitted"
      )
        return { id, kind: value.kind, value: parseInkReceipt(value.value) };
      const rejection = parseDispatchResult(value.value);
      if (rejection.kind !== "rejected")
        throw new Error("Invalid ink rejection.");
      return { id, kind: value.kind, value: rejection };
    }
    default:
      throw new Error("Unsupported worker response.");
  }
}
