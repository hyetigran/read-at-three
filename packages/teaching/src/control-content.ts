import { validateControlPrintedTurn } from "./printed.ts";
import { connectedPointingRoles } from "./connected-pointing.ts";
import { guidanceCopies } from "./guidance.ts";
import { canonical } from "./identity.ts";
import type {
  ControlTask,
  ControlNode,
  NodeId,
  UntilFirmNode,
  SelectiveReviewNode,
  ItemId,
  PolicyId,
  ReviewChoice,
} from "./types.ts";

export function canonicalReviewChoice({
  items,
  choice,
  invalidMessage = "Invalid complete review choice",
}: {
  items: readonly Pick<SelectiveReviewNode["items"][number], "itemId">[];
  choice: ReviewChoice;
  invalidMessage?: string;
}): ReviewChoice {
  if (choice.kind === "none") return choice;
  if (
    choice.itemIds.length === 0 ||
    new Set(choice.itemIds).size !== choice.itemIds.length ||
    choice.itemIds.some((id) => !items.some((item) => item.itemId === id))
  )
    throw new Error(invalidMessage);
  return {
    kind: "items",
    itemIds: items
      .filter((item) => choice.itemIds.includes(item.itemId))
      .map((item) => item.itemId),
  };
}

export type CompiledControlTask = Readonly<{
  task: ControlTask;
  nodes: ReadonlyMap<NodeId, ControlNode>;
  normalNodeIds: readonly NodeId[];
  policies: ReadonlyMap<PolicyId, UntilFirmNode>;
  cycleRoutes: ReadonlyMap<PolicyId, readonly NodeId[]>;
  itemRoutes: ReadonlyMap<ItemId, readonly NodeId[]>;
  reviews: readonly SelectiveReviewNode[];
}>;
const cache = new WeakMap<ControlTask, CompiledControlTask>();
export function compileControlTask(task: ControlTask): CompiledControlTask {
  const cached = cache.get(task);
  if (cached) return cached;
  const nodes = new Map(task.nodes.map((n) => [n.id, n]));
  if (nodes.size !== task.nodes.length)
    throw new Error("Duplicate control node");
  const normalNodeIds: NodeId[] = [];
  let next: NodeId | null = task.startNodeId;
  while (next !== null) {
    if (normalNodeIds.includes(next))
      throw new Error("Control normal route cycle");
    const n = nodes.get(next);
    if (!n || (n.kind === "turn" && n.route !== "normal"))
      throw new Error("Missing normal control node");
    normalNodeIds.push(next);
    next =
      n.kind === "selectiveReview"
        ? n.exitNodeId
        : n.next.kind === "node"
          ? n.next.nodeId
          : null;
  }
  if (
    task.nodes.some(
      (n) =>
        ((n.kind === "turn" && n.route === "normal") ||
          n.kind === "selectiveReview" ||
          n.kind === "reviewExit") &&
        !normalNodeIds.includes(n.id),
    )
  )
    throw new Error("Unreachable normal control node");
  const route = ({
    entry,
    exit,
  }: {
    entry: NodeId;
    exit: NodeId;
  }): readonly NodeId[] => {
    const a = normalNodeIds.indexOf(entry),
      b = normalNodeIds.indexOf(exit);
    if (a < 0 || b < a) throw new Error("Invalid control route range");
    return normalNodeIds.slice(a, b + 1);
  };
  const policies = new Map<PolicyId, UntilFirmNode>();
  const cycleRoutes = new Map<PolicyId, readonly NodeId[]>();
  const occupied = new Set<NodeId>();
  for (const n of task.nodes) {
    if (n.sourceRefs.length === 0 || n.guidance.length === 0)
      throw new Error("Control source guidance missing");
    for (const span of n.guidance)
      if (
        guidanceCopies(span).some(
          (copy) =>
            copy.kind !== "added" && !n.sourceRefs.includes(copy.sourceRef),
        )
      )
        throw new Error("Control guidance source missing");
    if (
      n.kind === "turn" &&
      n.presentation.kind === "connectedPointing" &&
      (n.parentRole !==
        connectedPointingRoles[n.presentation.role].parentRole ||
        ((n.presentation.role === "guided" ||
          n.presentation.role === "togetherGuided") &&
          n.route !== "support") ||
        n.itemId === null)
    )
      throw new Error("Connected pointing role does not match its delivery");
    if (n.kind === "turn") validateControlPrintedTurn(n);
    if (n.kind !== "untilFirm") continue;
    if (policies.has(n.policyId)) throw new Error("Duplicate readiness policy");
    const normalOwner = normalNodeIds.includes(n.id);
    const instructionOwners = task.corrections.filter((c) =>
      c.instructionNodeIds.includes(n.id),
    );
    if (Number(normalOwner) + instructionOwners.length !== 1)
      throw new Error("Readiness policy needs one defining owner");
    const owner = normalOwner
      ? normalNodeIds
      : instructionOwners[0]?.instructionNodeIds;
    if (!owner || (!normalOwner && n.next.kind !== "end"))
      throw new Error("Support readiness gate must be terminal");
    const start = owner.indexOf(n.cycleEntryNodeId),
      end = owner.indexOf(n.cycleExitNodeId);
    if (start < 0 || end < start || owner[end + 1] !== n.id)
      throw new Error("Readiness cycle must end immediately before its gate");
    const cycle = owner.slice(start, end + 1);
    if (
      cycle.some((id) => {
        const node = nodes.get(id);
        return (
          !node ||
          node.kind !== "turn" ||
          node.route !== (normalOwner ? "normal" : "support") ||
          occupied.has(id)
        );
      })
    )
      throw new Error("Readiness cycle must end immediately before its gate");
    if (nodes.get(n.cycleExitNodeId)?.kind !== "turn")
      throw new Error("Missing final cycle response");
    for (const id of cycle) occupied.add(id);
    policies.set(n.policyId, n);
    cycleRoutes.set(n.policyId, cycle);
  }
  const reviews = task.nodes.filter(
    (n): n is SelectiveReviewNode => n.kind === "selectiveReview",
  );
  if (new Set(reviews.map((n) => n.reviewId)).size !== reviews.length)
    throw new Error("Duplicate review identity");
  const itemRoutes = new Map<ItemId, readonly NodeId[]>();
  const reviewExits = new Set<NodeId>();
  for (const review of reviews) {
    const exit = nodes.get(review.exitNodeId);
    if (
      !exit ||
      exit.kind !== "reviewExit" ||
      exit.reviewId !== review.reviewId ||
      review.returnNodeId !== review.id
    )
      throw new Error("Invalid authored review exit or return");
    if (review.items.length === 0)
      throw new Error("Empty eligible review items");
    reviewExits.add(exit.id);
    let last = -1;
    for (const item of review.items) {
      if (itemRoutes.has(item.itemId)) throw new Error("Duplicate review item");
      const ids = route({ entry: item.entryNodeId, exit: item.exitNodeId });
      const start = normalNodeIds.indexOf(item.entryNodeId);
      if (
        start <= last ||
        normalNodeIds.indexOf(item.exitNodeId) >=
          normalNodeIds.indexOf(review.id)
      )
        throw new Error(
          "Review items must follow source order before selection",
        );
      last = normalNodeIds.indexOf(item.exitNodeId);
      if (
        ids.some((id) => {
          const n = nodes.get(id);
          return (
            !n ||
            (n.kind !== "turn" && n.kind !== "untilFirm") ||
            (n.kind === "turn" &&
              (n.parentRole !== "listen" || n.itemId !== item.itemId))
          );
        })
      )
        throw new Error("Review route has incompatible item turn");
      for (const id of ids) {
        const n = nodes.get(id);
        if (
          n?.kind === "untilFirm" &&
          (!ids.includes(n.cycleEntryNodeId) ||
            !ids.includes(n.cycleExitNodeId))
        )
          throw new Error("Review route omits readiness cycle");
      }
      itemRoutes.set(item.itemId, ids);
    }
  }
  if (task.nodes.some((n) => n.kind === "reviewExit" && !reviewExits.has(n.id)))
    throw new Error("Unowned review exit");
  const support = new Set<NodeId>();
  const corrections = new Set<string>();
  for (const c of task.corrections) {
    if (
      corrections.has(c.id) ||
      c.eligibleNodeIds.length === 0 ||
      c.instructionNodeIds.length === 0 ||
      c.retestNodeIds.length === 0 ||
      c.sourceRefs.length === 0
    )
      throw new Error("Invalid correction routes");
    corrections.add(c.id);
    const pointingEligible = c.eligibleNodeIds
      .map((id) => nodes.get(id))
      .filter(
        (n) =>
          n?.kind === "turn" && n.presentation.kind === "connectedPointing",
      );
    const voicedEligible = pointingEligible.some(
      (node) =>
        node?.kind === "turn" &&
        node.presentation.kind === "connectedPointing" &&
        node.presentation.role === "childConnect",
    );
    if (voicedEligible) {
      if (c.eligibleNodeIds.length !== 1)
        throw new Error("Child-voiced Help needs one owed response");
      const [eligibleId] = c.eligibleNodeIds;
      if (!eligibleId)
        throw new Error("Child-voiced Help needs an owed response");
      const eligible = nodes.get(eligibleId);
      const first = normalNodeIds.findIndex((id) => {
        const node = nodes.get(id);
        return (
          node?.kind === "turn" &&
          node.presentation.kind === "connectedPointing" &&
          node.presentation.role === "childConnect"
        );
      });
      if (
        eligible?.kind !== "turn" ||
        eligible.presentation.kind !== "connectedPointing" ||
        eligible.presentation.role !== "childConnect" ||
        canonical(c.retestNodeIds) !==
          canonical(
            normalNodeIds.slice(first, normalNodeIds.indexOf(eligible.id) + 1),
          )
      )
        throw new Error(
          "Child-voiced Help must retest from first coordinated response through owed response",
        );
      for (const id of c.instructionNodeIds) {
        const node = nodes.get(id);
        if (node?.kind === "untilFirm") continue;
        if (
          node?.kind !== "turn" ||
          node.presentation.kind !== "connectedPointing" ||
          node.presentation.role !== "togetherGuided" ||
          node.presentation.board !==
            childVoicedSupportBoard(eligible.presentation.board)
        )
          throw new Error(
            "Child-voiced support preserves literal first pair and shared voices",
          );
      }
    } else if (pointingEligible.length > 0) {
      for (const id of c.eligibleNodeIds) {
        const eligible = nodes.get(id);
        if (
          eligible?.kind !== "turn" ||
          eligible.presentation.kind !== "connectedPointing" ||
          eligible.presentation.role !== "follow"
        )
          throw new Error("Connected pointing Help requires a child follow");
        for (const [ids, role] of [
          [c.instructionNodeIds, "guided"],
          [c.retestNodeIds, "follow"],
        ] as const) {
          for (const routeId of ids) {
            const routeNode = nodes.get(routeId);
            if (routeNode?.kind === "untilFirm" && role === "guided") continue;
            if (
              routeNode?.kind !== "turn" ||
              routeNode.presentation.kind !== "connectedPointing" ||
              routeNode.presentation.role !== role ||
              routeNode.presentation.board !== eligible.presentation.board
            )
              throw new Error(
                "Connected pointing correction must preserve board and participants",
              );
          }
        }
      }
    }
    for (const id of c.eligibleNodeIds) {
      const n = nodes.get(id);
      if (
        !n ||
        n.kind !== "turn" ||
        n.route !== "normal" ||
        n.parentRole === "model"
      )
        throw new Error("Invalid oral correction eligibility");
    }
    for (const id of c.instructionNodeIds) {
      const n = nodes.get(id);
      if (
        !n ||
        (n.kind !== "turn" && n.kind !== "untilFirm") ||
        (n.kind === "turn" && n.route !== "support") ||
        normalNodeIds.includes(id) ||
        n.next.kind !== "end"
      )
        throw new Error("Invalid oral instruction route");
      support.add(id);
    }
    for (const [i, id] of c.retestNodeIds.entries()) {
      const n = nodes.get(id);
      if (!n || (n.kind !== "turn" && n.kind !== "untilFirm"))
        throw new Error("Invalid oral retest route");
      if (n.kind === "turn" && n.route === "support") support.add(id);
      if (n.kind === "untilFirm") {
        if (!normalNodeIds.includes(n.id))
          throw new Error("Correction retest uses an instruction policy");
        const route = cycleRoutes.get(n.policyId);
        if (
          !route ||
          canonical(c.retestNodeIds.slice(i - route.length, i)) !==
            canonical(route)
        )
          throw new Error("Correction retest omits readiness cycle");
      }
    }
    const lastId = c.retestNodeIds.at(-1);
    const last = lastId === undefined ? undefined : nodes.get(lastId);
    if (!last) throw new Error("Retest exit unavailable");
    const response =
      last.kind === "untilFirm" ? nodes.get(last.cycleExitNodeId) : last;
    if (
      !response ||
      response.kind !== "turn" ||
      response.parentRole === "model" ||
      c.eligibleNodeIds.some((id) => {
        const n = nodes.get(id);
        return n?.kind !== "turn" || n.itemId !== response.itemId;
      })
    )
      throw new Error("Retest exit does not resolve its eligible item");
    for (const ids of [c.instructionNodeIds, c.retestNodeIds]) {
      if (new Set(ids).size !== ids.length)
        throw new Error("Duplicate correction route node");
      for (const [policyId, cycle] of cycleRoutes) {
        const gate = policies.get(policyId);
        if (!gate) throw new Error("Missing readiness policy");
        if (![...cycle, gate.id].some((id) => ids.includes(id))) continue;
        const index = ids.indexOf(gate.id);
        if (
          index < cycle.length ||
          canonical(ids.slice(index - cycle.length, index)) !== canonical(cycle)
        )
          throw new Error("Correction route omits complete readiness cycle");
      }
    }
    if (c.label.kind !== "added" && !c.sourceRefs.includes(c.label.sourceRef))
      throw new Error("Correction selector source reference missing");
  }
  if (
    task.nodes.some(
      (n) => n.kind === "turn" && n.route === "support" && !support.has(n.id),
    )
  )
    throw new Error("Unreachable oral support node");
  const result = {
    task,
    nodes,
    normalNodeIds,
    policies,
    cycleRoutes,
    itemRoutes,
    reviews,
  };
  cache.set(task, result);
  return result;
}

function childVoicedSupportBoard(
  board: import("./types.ts").ConnectedPointingPresentation["board"],
) {
  switch (board) {
    case "ēm":
    case "ēs":
      return "ēm";
    case "mē":
    case "sē":
      return "mē";
    default:
      throw new Error("Child-voiced Help requires a reviewed support family");
  }
}
