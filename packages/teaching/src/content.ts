import canonicalize from "canonicalize";
import type {
  DevelopmentBody,
  DevelopmentPackage,
  HashFunction,
  TeachingState,
  TeachingCommand,
  CommitReceipt,
  Counter,
} from "./types.ts";
import {
  validatePackage,
  validateState,
  validateCommand,
  validateReceipt,
  validateProjection,
  validateResult,
} from "./generated-validators.js";
export function canonicalContentBody(body: DevelopmentBody): string {
  return canonical(body);
}
export function canonical(value: unknown): string {
  const result = canonicalize(value);
  if (typeof result !== "string")
    throw new Error("Value cannot be canonically encoded");
  return result;
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
export async function parseDevelopmentPackage(
  input: unknown,
  hash: HashFunction,
): Promise<DevelopmentPackage> {
  if (!validatePackage(input))
    throw new Error("Development content schema is unsupported");
  deepFreeze(input);
  if ((await hash(canonical(input.body))) !== input.packageHash)
    throw new Error("Development content hash mismatch");
  const nodes = new Map(input.body.nodes.map((node) => [node.id, node]));
  if (nodes.size !== input.body.nodes.length)
    throw new Error("Duplicate content node");
  const visited = new Set<string>();
  let next = input.body.startNodeId;
  while (true) {
    if (visited.has(next)) throw new Error("Content cycle");
    const current = nodes.get(next);
    if (!current) throw new Error("Content node missing");
    visited.add(next);
    if (current.next.kind === "frontier") break;
    next = current.next.nodeId;
  }
  if (visited.size !== nodes.size) throw new Error("Unreachable content node");
  return deepFreeze(input);
}
export function parseTeachingState(input: unknown): TeachingState {
  if (!validateState(input))
    throw new Error("Stored teaching state schema is unsupported");
  return input;
}
export function parseCommand(input: unknown): TeachingCommand {
  if (!validateCommand(input)) throw new Error("Command schema is invalid");
  parseCounter(input.expectedRevision);
  parseCounter(input.owner.generation);
  parseCounter(input.scope.generation);
  return deepFreeze(input);
}
export function parseReceipt(input: unknown): CommitReceipt {
  if (!validateReceipt(input))
    throw new Error("Stored receipt schema is invalid");
  parseCounter(input.revision);
  parseCounter(input.owner.generation);
  return input;
}
export function parseProjection(
  input: unknown,
): import("./types.ts").CommittedProjection {
  if (!validateProjection(input))
    throw new Error("Projection schema is invalid");
  if (input.kind !== "recovery") {
    parseCounter(input.owner.generation);
    parseCounter(
      input.kind === "entry" ? input.profileRevision : input.revision,
    );
  }
  return deepFreeze(input);
}
export function parseDispatchResult(
  input: unknown,
): import("./types.ts").CommandResult {
  if (!validateResult(input))
    throw new Error("Command result schema is invalid");
  if (input.kind === "committed") {
    parseCounter(input.owner.generation);
    parseCounter(input.revision);
  }
  return deepFreeze(input);
}
