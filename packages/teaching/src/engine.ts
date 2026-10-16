import type {
  DevelopmentPackage,
  TeachingState,
  EngineProjection,
} from "./types.ts";
import { canonical } from "./content.ts";
export function initialState(content: DevelopmentPackage): TeachingState {
  return {
    version: 1,
    kind: "teaching",
    nodeId: content.body.startNodeId,
    acceptedNodeIds: [],
  };
}
function currentNode(content: DevelopmentPackage, id: string) {
  const node = content.body.nodes.find((node) => node.id === id);
  if (!node) throw new Error("Saved content position is unavailable");
  return node;
}
export function validatePosition(
  content: DevelopmentPackage,
  state: TeachingState,
): void {
  let expected = initialState(content);
  for (const id of state.acceptedNodeIds) {
    if (expected.kind !== "teaching" || expected.nodeId !== id)
      throw new Error("Saved content position is invalid");
    expected = transition(content, expected);
  }
  if (canonical(expected) !== canonical(state))
    throw new Error("Saved content position is invalid");
}
function transition(
  content: DevelopmentPackage,
  state: Extract<TeachingState, { kind: "teaching" }>,
): TeachingState {
  const node = currentNode(content, state.nodeId);
  const acceptedNodeIds = [...state.acceptedNodeIds, node.id];
  return node.next.kind === "node"
    ? {
        version: 1,
        kind: "teaching",
        nodeId: node.next.nodeId,
        acceptedNodeIds,
      }
    : {
        version: 1,
        kind: "frontier",
        acceptedNodeIds,
        unmetObligations: node.next.unmetObligations,
      };
}
export function evaluate(
  content: DevelopmentPackage,
  state: TeachingState,
  nodeId: string,
): TeachingState {
  validatePosition(content, state);
  if (state.kind === "frontier")
    throw new Error("Partial content frontier cannot advance");
  if (state.nodeId !== nodeId)
    throw new Error("Parent acceptance does not target current node");
  return transition(content, state);
}
export function project(
  content: DevelopmentPackage,
  state: TeachingState,
): EngineProjection {
  validatePosition(content, state);
  return state.kind === "teaching"
    ? { kind: "teaching", turn: currentNode(content, state.nodeId) }
    : {
        kind: "frontier",
        status: "inProgress",
        unmetObligations: state.unmetObligations,
      };
}
