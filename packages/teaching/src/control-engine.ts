import {
  canonical,
  controlTask,
  deepFreeze,
  increment,
  parseCounter,
  parseId,
} from "./content.ts";
import type { CompiledControlTask } from "./control-content.ts";
import type {
  AvailableAction,
  CompletionProof,
  ControlCheckpoint,
  ControlContext,
  ControlFlow,
  ControlNode,
  ControlOccurrence,
  ControlResume,
  ControlTeachingState,
  CycleBinding,
  DevelopmentPackage,
  EngineProjection,
  GraphAction,
  NodeId,
  OccurrenceId,
  ReviewChoice,
  ReviewQueue,
  TaskId,
  TransitionPlan,
  UntilFirmNode,
} from "./types.ts";
const normalFlow = { kind: "normal" } as const;
const sourceDelivery = { kind: "source" } as const;
function required<T>(
  value: T | undefined,
  message = "Control binding unavailable",
): T {
  if (value === undefined) throw new Error(message);
  return value;
}
export function controlCheckpoint(s: ControlTeachingState): ControlCheckpoint {
  return required(s.checkpoints[s.checkpointIndex]);
}
function occurrence(s: ControlTeachingState, id: OccurrenceId) {
  return required(s.occurrences.find((o) => o.id === id));
}
function nodeFor(g: CompiledControlTask, o: ControlOccurrence): ControlNode {
  if (o.target.kind !== "node") throw new Error("Not a source occurrence");
  return required(g.nodes.get(o.target.nodeId));
}
function normalOccurrence(s: ControlTeachingState, id: NodeId) {
  return required(
    s.occurrences.find(
      (o) =>
        o.obligation === "required" &&
        o.target.kind === "node" &&
        o.target.nodeId === id,
    ),
  );
}
function queue(s: ControlTeachingState, id: string) {
  return required(s.queues.find((q) => q.id === id));
}
function cycle(s: ControlTeachingState, id: string) {
  return required(s.cycles.find((c) => c.id === id));
}
function policyAfter(
  g: CompiledControlTask,
  node: ControlNode,
): UntilFirmNode | undefined {
  if (node.kind !== "turn" || node.next.kind !== "node") return;
  const next = g.nodes.get(node.next.nodeId);
  return next?.kind === "untilFirm" ? next : undefined;
}
function initialCycles(
  g: CompiledControlTask,
  occurrences: readonly ControlOccurrence[],
): CycleBinding[] {
  return [...g.policies.values()]
    .filter((p) =>
      occurrences.some(
        (o) => o.target.kind === "node" && o.target.nodeId === p.id,
      ),
    )
    .map((p) => {
      const gate = required(
        occurrences.find(
          (o) => o.target.kind === "node" && o.target.nodeId === p.id,
        ),
      );
      return {
        id: parseId({ kind: "cycle", value: `cycle-${gate.id}` }),
        policyId: p.policyId,
        gateOccurrenceId: gate.id,
        turnOccurrenceIds: required(g.cycleRoutes.get(p.policyId)).map(
          (id) =>
            required(
              occurrences.find(
                (o) => o.target.kind === "node" && o.target.nodeId === id,
              ),
            ).id,
        ),
      };
    });
}
export function initialControlState(
  content: DevelopmentPackage,
  taskId: TaskId,
): ControlTeachingState {
  const g = controlTask(content, taskId);
  const occurrences = g.normalNodeIds.map((id, i): ControlOccurrence => ({
    id: parseId({ kind: "occurrence", value: `occurrence-${i + 1}` }),
    target: { kind: "node", nodeId: id },
    obligation: "required",
  }));
  const first = required(occurrences[0]);
  const cycles = initialCycles(g, occurrences);
  const c = cycles.find((c) => c.turnOccurrenceIds[0] === first.id);
  const n = nodeFor(g, first);
  if (n.kind !== "turn" && n.kind !== "selectiveReview")
    throw new Error("Task must start with source turn or selection");
  return deepFreeze({
    version: 1,
    kind: "graphControls",
    taskId,
    occurrences,
    acceptedOccurrenceIds: [],
    cycles,
    cycleOutcomes: [],
    queues: [],
    checkpoints: [
      {
        id: parseId({ kind: "checkpoint", value: "checkpoint-1" }),
        occurrenceId: first.id,
        context:
          n.kind === "selectiveReview"
            ? { kind: "selection", reviewId: n.reviewId }
            : {
                kind: "delivering",
                resume: {
                  flow: normalFlow,
                  delivery: c
                    ? { kind: "cycle", cycleId: c.id }
                    : sourceDelivery,
                },
              },
      },
    ],
    checkpointIndex: 0,
    nextOccurrenceNumber: parseCounter(String(occurrences.length + 1)),
    nextCheckpointNumber: parseCounter("2"),
  });
}
export function canonicalReviewChoice(
  g: CompiledControlTask,
  reviewId: string,
  choice: ReviewChoice,
): ReviewChoice {
  const r = required(g.reviews.find((r) => r.reviewId === reviewId));
  if (choice.kind === "none") return choice;
  if (
    choice.itemIds.length === 0 ||
    new Set(choice.itemIds).size !== choice.itemIds.length ||
    choice.itemIds.some((id) => !r.items.some((i) => i.itemId === id))
  )
    throw new Error("Invalid complete review choice");
  return {
    kind: "items",
    itemIds: r.items
      .filter((i) => choice.itemIds.includes(i.itemId))
      .map((i) => i.itemId),
  };
}
export function validateControlPosition(
  content: DevelopmentPackage,
  s: ControlTeachingState,
  taskId?: TaskId,
): void {
  if (taskId !== undefined && s.taskId !== taskId)
    throw new Error("Control task changed");
  const g = controlTask(content, s.taskId),
    initial = initialControlState(content, s.taskId);
  if (
    s.occurrences.length >= 10000 ||
    s.nextOccurrenceNumber !== String(s.occurrences.length + 1) ||
    canonical(s.occurrences.slice(0, initial.occurrences.length)) !==
      canonical(initial.occurrences)
  )
    throw new Error("Control occurrence registry changed");
  for (const [i, o] of s.occurrences.entries()) {
    if (o.id !== `occurrence-${i + 1}`)
      throw new Error("Control occurrence identity invalid");
    if (o.target.kind === "node") {
      const n = g.nodes.get(o.target.nodeId);
      if (
        !n ||
        (o.obligation !== "support" &&
          n.kind === "turn" &&
          n.route === "support") ||
        (i >= initial.occurrences.length &&
          o.obligation === "required" &&
          !s.queues.some((q) =>
            q.items.some((item) => item.routeOccurrences.includes(o.id)),
          ))
      )
        throw new Error("Control occurrence target invalid");
    } else {
      const q = queue(s, o.target.queueId),
        item = o.target.itemId;
      if (
        o.obligation !== "required" ||
        !q.items.some(
          (i) => i.itemId === item && i.confirmationOccurrenceId === o.id,
        )
      )
        throw new Error("Review confirmation binding invalid");
    }
  }
  const accepted = new Set(s.acceptedOccurrenceIds);
  if (
    accepted.size !== s.acceptedOccurrenceIds.length ||
    s.acceptedOccurrenceIds.some(
      (id) => !s.occurrences.some((o) => o.id === id),
    )
  )
    throw new Error("Invalid control acceptance membership");
  if (
    canonical(s.cycles.slice(0, initial.cycles.length)) !==
      canonical(initial.cycles) ||
    new Set(s.cycles.map((c) => c.id)).size !== s.cycles.length
  )
    throw new Error("Cycle registry changed");
  const cycleTurns = new Set<OccurrenceId>();
  for (const c of s.cycles) {
    const p = required(g.policies.get(c.policyId)),
      ids = required(g.cycleRoutes.get(p.policyId));
    if (
      c.turnOccurrenceIds.length !== ids.length ||
      nodeFor(g, occurrence(s, c.gateOccurrenceId)).id !== p.id ||
      (c.id !== `cycle-${c.gateOccurrenceId}` &&
        c.id !== `cycle-${c.turnOccurrenceIds[0]}`)
    )
      throw new Error("Cycle policy binding invalid");
    c.turnOccurrenceIds.forEach((id, i) => {
      if (cycleTurns.has(id) || nodeFor(g, occurrence(s, id)).id !== ids[i])
        throw new Error("Cycle turns changed");
      cycleTurns.add(id);
    });
  }
  if (
    new Set(s.cycleOutcomes.map((o) => o.cycleId)).size !==
    s.cycleOutcomes.length
  )
    throw new Error("Duplicate cycle outcome");
  for (const outcome of s.cycleOutcomes) {
    const c = cycle(s, outcome.cycleId);
    if (
      c.turnOccurrenceIds.some((id) => !accepted.has(id)) ||
      (outcome.kind === "independent" &&
        c.turnOccurrenceIds.some(
          (id) => occurrence(s, id).obligation === "support",
        ))
    )
      throw new Error(
        "Cycle outcome has unfinished response or false independence",
      );
  }
  for (const p of g.policies.values())
    for (const o of s.occurrences.filter(
      (o) => o.target.kind === "node" && o.target.nodeId === p.id,
    ))
      if (
        accepted.has(o.id) &&
        !s.cycles.some(
          (c) =>
            c.gateOccurrenceId === o.id &&
            s.cycleOutcomes.some((outcome) => outcome.cycleId === c.id),
        )
      )
        throw new Error("Readiness has no completed current cycle");
  if (
    new Set(s.queues.map((q) => q.id)).size !== s.queues.length ||
    new Set(s.queues.map((q) => q.selectionOccurrenceId)).size !==
      s.queues.length
  )
    throw new Error("Duplicate immutable queue");
  for (const q of s.queues) {
    const r = required(g.reviews.find((r) => r.reviewId === q.reviewId));
    if (
      q.id !== `queue-${q.selectionOccurrenceId}` ||
      nodeFor(g, occurrence(s, q.selectionOccurrenceId)).id !== r.id ||
      !accepted.has(q.selectionOccurrenceId) ||
      q.returnNodeId !== r.returnNodeId ||
      q.exitNodeId !== r.exitNodeId ||
      q.exitOccurrenceId !== normalOccurrence(s, r.exitNodeId).id ||
      canonical(q.choice) !==
        canonical(canonicalReviewChoice(g, r.reviewId, q.choice))
    )
      throw new Error("Immutable review queue invalid");
    const selected = q.choice.kind === "none" ? [] : q.choice.itemIds;
    if (canonical(q.items.map((i) => i.itemId)) !== canonical(selected))
      throw new Error("Review selected order changed");
    const bound = new Set<OccurrenceId>();
    for (const item of q.items) {
      const route = required(g.itemRoutes.get(item.itemId));
      if (item.routeOccurrences.length !== route.length)
        throw new Error("Review route incomplete");
      item.routeOccurrences.forEach((id, i) => {
        const o = occurrence(s, id);
        if (
          bound.has(id) ||
          initial.occurrences.some((n) => n.id === id) ||
          o.obligation !== "required" ||
          nodeFor(g, o).id !== route[i]
        )
          throw new Error("Review route binding changed");
        bound.add(id);
      });
      const confirm = occurrence(s, item.confirmationOccurrenceId);
      if (
        confirm.target.kind !== "reviewConfirmation" ||
        confirm.target.queueId !== q.id ||
        confirm.target.itemId !== item.itemId
      )
        throw new Error("Review item confirmation invalid");
      if (
        accepted.has(confirm.id) &&
        item.routeOccurrences.some((id) => !accepted.has(id))
      )
        throw new Error("Review item confirmed before source obligations");
    }
    if (
      accepted.has(q.exitOccurrenceId) &&
      q.items.some((i) => !accepted.has(i.confirmationOccurrenceId))
    )
      throw new Error("Review exited before confirmations");
  }
  if (
    s.checkpoints.length === 0 ||
    s.checkpoints.length >= 10000 ||
    !Number.isInteger(s.checkpointIndex) ||
    s.checkpointIndex < 0 ||
    s.checkpointIndex >= s.checkpoints.length
  )
    throw new Error("Control checkpoint cursor invalid");
  let prior = 0n;
  for (const [index, cp] of s.checkpoints.entries()) {
    const number = /^checkpoint-([1-9][0-9]*)$/.exec(cp.id)?.[1];
    if (
      !number ||
      BigInt(number) <= prior ||
      BigInt(number) >= BigInt(s.nextCheckpointNumber)
    )
      throw new Error("Control checkpoint identity invalid");
    prior = BigInt(number);
    if (cp.context.kind === "terminal") {
      if (cp.occurrenceId !== null || !controlCompletionProof(content, s))
        throw new Error("Unproved control terminal");
      continue;
    }
    const current = occurrence(s, required(cp.occurrenceId ?? undefined)),
      n = nodeFor(g, current),
      context = cp.context;
    if (context.kind === "selection") {
      if (n.kind !== "selectiveReview" || n.reviewId !== context.reviewId)
        throw new Error("Selection checkpoint invalid");
      continue;
    }
    if (n.kind !== "turn") throw new Error("Control delivery is not a turn");
    const resume =
      context.kind === "correction" ? context.suspended : context.resume;
    if (resume.flow.kind === "review") {
      const f = resume.flow;
      const q = queue(s, f.queueId);
      if (!q.items[f.index]) throw new Error("Review cursor invalid");
    }
    if (resume.delivery.kind === "cycle") {
      const c = cycle(s, resume.delivery.cycleId);
      const owed =
        context.kind === "correction" ? context.owedOccurrenceId : current.id;
      if (!c.turnOccurrenceIds.includes(owed))
        throw new Error("Cycle checkpoint binding invalid");
    }
    if (resume.delivery.kind === "repeat") {
      const target = resume.delivery.returnCheckpointId;
      const back = s.checkpoints.findIndex((c) => c.id === target);
      if (back < 0 || back >= index) throw new Error("Practice return invalid");
    }
    if (context.kind === "correction") {
      const spec = required(
        g.task.corrections.find((c) => c.id === context.correctionId),
      );
      const owed = occurrence(s, context.owedOccurrenceId),
        trigger = occurrence(s, context.triggerOccurrenceId);
      if (
        !spec.eligibleNodeIds.includes(nodeFor(g, trigger).id) ||
        nodeFor(g, owed).kind !== "turn"
      )
        throw new Error("Correction owed response invalid");
      const route =
        context.phase.kind === "instruction"
          ? spec.instructionNodeIds
          : spec.retestNodeIds;
      const bindings =
        context.phase.kind === "instruction"
          ? context.instructionOccurrenceIds
          : context.retestOccurrenceIds;
      if (
        bindings.length !== route.length ||
        bindings.some(
          (id, i) =>
            nodeFor(g, occurrence(s, id)).id !== route[i] ||
            occurrence(s, id).obligation !== "support",
        ) ||
        route[context.phase.index] !== n.id ||
        bindings[context.phase.index] !== current.id ||
        current.obligation !== "support"
      )
        throw new Error("Correction route cursor invalid");
    } else if (n.route !== "normal" || current.obligation === "support")
      throw new Error("Normal control turn invalid");
  }
  validateCheckpointRoute(g, s);
}
function validateCheckpointRoute(
  g: CompiledControlTask,
  s: ControlTeachingState,
): void {
  const accepted = new Set(s.acceptedOccurrenceIds);
  const same = (a: unknown, b: unknown) => canonical(a) === canonical(b);
  const get = (cp: ControlCheckpoint) =>
    cp.occurrenceId === null ? null : occurrence(s, cp.occurrenceId);
  const expectedContext = (
    o: ControlOccurrence,
    flow: ControlFlow,
  ): ControlContext => {
    const n = nodeFor(g, o);
    if (n.kind === "selectiveReview")
      return { kind: "selection", reviewId: n.reviewId };
    const c = s.cycles.find((c) => c.turnOccurrenceIds[0] === o.id);
    return {
      kind: "delivering",
      resume: {
        flow,
        delivery: c ? { kind: "cycle", cycleId: c.id } : sourceDelivery,
      },
    };
  };
  const binding = (nodeId: NodeId, flow: ControlFlow) => {
    if (flow.kind === "normal") return normalOccurrence(s, nodeId);
    const item = required(queue(s, flow.queueId).items[flow.index]);
    return required(
      item.routeOccurrences
        .map((id) => occurrence(s, id))
        .find((o) => o.target.kind === "node" && o.target.nodeId === nodeId),
    );
  };
  const matches = (
    next: ControlCheckpoint,
    o: ControlOccurrence | null,
    context: ControlContext,
  ) => next.occurrenceId === (o?.id ?? null) && same(next.context, context);
  const following = (
    next: ControlCheckpoint,
    owed: ControlOccurrence,
    resume: ControlResume,
  ): boolean => {
    const n = nodeFor(g, owed);
    if (n.kind !== "turn" || !accepted.has(owed.id)) return false;
    const d = resume.delivery,
      f = resume.flow;
    if (d.kind === "repeat") {
      const back = required(
        s.checkpoints.find((cp) => cp.id === d.returnCheckpointId),
      );
      return matches(next, get(back), back.context);
    }
    const p = policyAfter(g, n);
    let routeExit: NodeId = n.id;
    if (p) {
      if (d.kind !== "cycle") return false;
      const c = cycle(s, d.cycleId);
      if (!s.cycleOutcomes.some((o) => o.cycleId === c.id)) return false;
      if (
        next.context.kind === "delivering" &&
        next.context.resume.delivery.kind === "cycle"
      ) {
        const fresh = cycle(s, next.context.resume.delivery.cycleId);
        if (
          fresh.id !== c.id &&
          fresh.gateOccurrenceId === c.gateOccurrenceId &&
          same(next.context.resume.flow, f) &&
          next.occurrenceId === fresh.turnOccurrenceIds[0]
        )
          return true;
      }
      if (!accepted.has(c.gateOccurrenceId)) return false;
      routeExit = p.id;
    }
    if (f.kind === "review") {
      const q = queue(s, f.queueId),
        item = required(q.items[f.index]);
      const exit = required(item.routeOccurrences.at(-1));
      if (nodeFor(g, occurrence(s, exit)).id === routeExit) {
        if (!accepted.has(item.confirmationOccurrenceId)) return false;
        const following = q.items[f.index + 1];
        if (following) {
          const o = occurrence(s, required(following.routeOccurrences[0]));
          return matches(
            next,
            o,
            expectedContext(o, { ...f, index: f.index + 1 }),
          );
        }
        if (!accepted.has(q.exitOccurrenceId)) return false;
        const end = required(g.nodes.get(q.exitNodeId));
        if (end.kind !== "reviewExit") return false;
        if (end.next.kind === "end")
          return matches(next, null, { kind: "terminal" });
        const o = normalOccurrence(s, end.next.nodeId);
        return matches(next, o, expectedContext(o, normalFlow));
      }
    }
    const end = required(g.nodes.get(routeExit));
    if (end.kind === "selectiveReview") return false;
    if (end.next.kind === "end")
      return matches(next, null, { kind: "terminal" });
    const o = binding(end.next.nodeId, f);
    return matches(next, o, expectedContext(o, f));
  };
  const initial = initialControlCheckpoint(g, s);
  if (!same(s.checkpoints[0], initial))
    throw new Error("Control checkpoint entry changed");
  for (let i = 1; i < s.checkpoints.length; i++) {
    const previous = required(s.checkpoints[i - 1]),
      next = required(s.checkpoints[i]),
      current = get(previous),
      target = get(next),
      old = previous.context,
      fresh = next.context;
    if (!current)
      throw new Error("Control terminal cannot start another route");
    if (
      fresh.kind === "correction" &&
      fresh.phase.kind === "instruction" &&
      fresh.phase.index === 0
    ) {
      if (old.kind !== "delivering" && old.kind !== "correction")
        throw new Error("Correction suspension is unavailable");
      const owed =
          old.kind === "correction" ? old.owedOccurrenceId : current.id,
        suspended = old.kind === "correction" ? old.suspended : old.resume;
      const spec = required(
        g.task.corrections.find((c) => c.id === fresh.correctionId),
      );
      if (
        fresh.owedOccurrenceId !== owed ||
        fresh.triggerOccurrenceId !== owed ||
        !same(fresh.suspended, suspended) ||
        !spec.eligibleNodeIds.includes(nodeFor(g, occurrence(s, owed)).id) ||
        (spec.scope !== "any" && spec.scope !== suspended.flow.kind)
      )
        throw new Error("Correction rewrote suspended teaching");
      continue;
    }
    if (
      fresh.kind === "delivering" &&
      fresh.resume.delivery.kind === "repeat"
    ) {
      if (
        old.kind !== "delivering" ||
        !target ||
        nodeFor(g, target).id !== nodeFor(g, current).id ||
        target.obligation !== "practice" ||
        !same(fresh.resume.flow, old.resume.flow) ||
        fresh.resume.delivery.returnCheckpointId !==
          (old.resume.delivery.kind === "repeat"
            ? old.resume.delivery.returnCheckpointId
            : previous.id)
      )
        throw new Error("Practice redirected its return");
      continue;
    }
    if (!accepted.has(current.id))
      throw new Error("Control checkpoint skipped an unaccepted turn");
    if (old.kind === "selection") {
      const q = required(
          s.queues.find((q) => q.selectionOccurrenceId === current.id),
        ),
        first = q.items[0];
      if (first) {
        const o = occurrence(s, required(first.routeOccurrences[0]));
        if (
          matches(
            next,
            o,
            expectedContext(o, { kind: "review", queueId: q.id, index: 0 }),
          )
        )
          continue;
      } else if (accepted.has(q.exitOccurrenceId)) {
        const exit = required(g.nodes.get(q.exitNodeId));
        if (exit.kind !== "reviewExit") throw new Error("Review exit changed");
        if (
          exit.next.kind === "end" &&
          matches(next, null, { kind: "terminal" })
        )
          continue;
        if (exit.next.kind === "node") {
          const o = normalOccurrence(s, exit.next.nodeId);
          if (matches(next, o, expectedContext(o, normalFlow))) continue;
        }
      }
    } else if (old.kind === "delivering") {
      if (following(next, current, old.resume)) continue;
    } else if (old.kind === "correction") {
      if (
        fresh.kind === "correction" &&
        fresh.correctionId === old.correctionId &&
        fresh.owedOccurrenceId === old.owedOccurrenceId &&
        fresh.triggerOccurrenceId === old.triggerOccurrenceId &&
        same(fresh.suspended, old.suspended) &&
        same(fresh.instructionOccurrenceIds, old.instructionOccurrenceIds)
      ) {
        const a = old.phase,
          b = fresh.phase;
        if (
          a.kind === "instruction" &&
          same(old.retestOccurrenceIds, fresh.retestOccurrenceIds) &&
          ((b.kind === "instruction" && b.index === a.index + 1) ||
            (b.kind === "retest" &&
              b.index === 0 &&
              a.index === old.instructionOccurrenceIds.length - 1))
        )
          continue;
        if (a.kind === "retest" && b.kind === "retest") {
          const nextId = old.retestOccurrenceIds[a.index + 1],
            n = nextId ? nodeFor(g, occurrence(s, nextId)) : undefined;
          if (
            same(old.retestOccurrenceIds, fresh.retestOccurrenceIds) &&
            b.index === a.index + (n?.kind === "untilFirm" ? 2 : 1) &&
            (n?.kind !== "untilFirm" || accepted.has(required(nextId)))
          )
            continue;
          if (n?.kind === "untilFirm") {
            const route = required(g.cycleRoutes.get(n.policyId)),
              start = a.index - route.length + 1;
            const c = s.cycles.find(
              (c) =>
                c.gateOccurrenceId === nextId &&
                same(
                  c.turnOccurrenceIds,
                  fresh.retestOccurrenceIds.slice(start, start + route.length),
                ),
            );
            if (
              c &&
              b.index === start &&
              same(
                old.retestOccurrenceIds.slice(0, start),
                fresh.retestOccurrenceIds.slice(0, start),
              ) &&
              same(
                old.retestOccurrenceIds.slice(a.index + 1),
                fresh.retestOccurrenceIds.slice(a.index + 1),
              )
            )
              continue;
          }
        }
      }
      if (old.phase.kind === "retest") {
        const index = old.phase.index,
          nextId = old.retestOccurrenceIds[index + 1],
          n = nextId ? nodeFor(g, occurrence(s, nextId)) : undefined;
        const finished =
          index === old.retestOccurrenceIds.length - 1 ||
          (n?.kind === "untilFirm" &&
            index === old.retestOccurrenceIds.length - 2 &&
            accepted.has(required(nextId)));
        if (
          finished &&
          following(next, occurrence(s, old.owedOccurrenceId), old.suspended)
        )
          continue;
      }
    }
    throw new Error("Control checkpoint does not follow its authored route");
  }
}
function initialControlCheckpoint(
  g: CompiledControlTask,
  s: ControlTeachingState,
): ControlCheckpoint {
  const o = required(s.occurrences[0]),
    n = nodeFor(g, o),
    c = s.cycles.find((c) => c.turnOccurrenceIds[0] === o.id);
  return {
    id: parseId({ kind: "checkpoint", value: "checkpoint-1" }),
    occurrenceId: o.id,
    context:
      n.kind === "selectiveReview"
        ? { kind: "selection", reviewId: n.reviewId }
        : {
            kind: "delivering",
            resume: {
              flow: normalFlow,
              delivery: c ? { kind: "cycle", cycleId: c.id } : sourceDelivery,
            },
          },
  };
}

export function controlCompletionProof(
  content: DevelopmentPackage,
  s: ControlTeachingState,
): CompletionProof | null {
  const g = controlTask(content, s.taskId);
  const requiredIds = g.normalNodeIds.map((id) => normalOccurrence(s, id).id);
  for (const r of g.reviews) {
    const q = s.queues.find(
      (q) =>
        q.reviewId === r.reviewId &&
        q.selectionOccurrenceId === normalOccurrence(s, r.id).id,
    );
    if (!q) return null;
    for (const item of q.items)
      requiredIds.push(...item.routeOccurrences, item.confirmationOccurrenceId);
  }
  if (requiredIds.some((id) => !s.acceptedOccurrenceIds.includes(id)))
    return null;
  return {
    taskId: s.taskId,
    packageHash: content.packageHash,
    requiredOccurrenceIds: requiredIds,
    sourceRefs: [
      ...new Set(
        g.task.nodes
          .filter((n) => n.kind !== "turn" || n.route === "normal")
          .flatMap((n) => n.sourceRefs),
      ),
    ],
  };
}
export function evaluateControls({
  content,
  state: s,
  status,
  action,
}: {
  content: DevelopmentPackage;
  state: ControlTeachingState;
  status: "inProgress" | "completed";
  action: GraphAction;
}): TransitionPlan {
  validateControlPosition(content, s);
  if (
    (status === "completed") !==
    (controlCompletionProof(content, s) !== null)
  )
    throw new Error("Control run status does not match obligations");
  const g = controlTask(content, s.taskId),
    cp = controlCheckpoint(s);
  if (action.kind === "pause") return { kind: "pause", after: s };
  if (action.kind === "back") {
    if (s.checkpointIndex === 0) throw new Error("Back unavailable");
    return {
      kind: "navigation",
      after: { ...s, checkpointIndex: s.checkpointIndex - 1 },
    };
  }
  const current = occurrence(s, required(cp.occurrenceId ?? undefined)),
    node = nodeFor(g, current);
  if (
    action.kind === "continue" ||
    action.kind === "parentReady" ||
    action.kind === "confirmReviewItem" ||
    action.kind === "commitReviewSelection"
  ) {
    if (
      s.acceptedOccurrenceIds.includes(current.id) &&
      s.checkpointIndex < s.checkpoints.length - 1
    ) {
      if (action.kind !== "continue")
        throw new Error("Saved context reconfirms with Continue");
      return {
        kind: "navigation",
        after: { ...s, checkpointIndex: s.checkpointIndex + 1 },
      };
    }
  }
  if (status === "completed")
    throw new Error("Completed task is saved-context review only");
  if (action.kind === "repeat" && cp.context.kind === "correction")
    return evaluateControls({
      content,
      state: s,
      status,
      action: { kind: "help", correctionId: cp.context.correctionId },
    });
  let occurrences = [...s.occurrences],
    accepted = [...s.acceptedOccurrenceIds],
    cycles = [...s.cycles],
    outcomes = [...s.cycleOutcomes],
    queues = [...s.queues],
    nextOccurrenceNumber = s.nextOccurrenceNumber;
  let target: ControlOccurrence | null = null,
    context: ControlContext = { kind: "terminal" },
    primary: OccurrenceId | null = null;
  const allocate = (
    target: ControlOccurrence["target"],
    obligation: ControlOccurrence["obligation"],
  ): ControlOccurrence => {
    if (occurrences.length >= 9999) throw new Error("Occurrence bound reached");
    const o = {
      id: parseId({
        kind: "occurrence",
        value: `occurrence-${nextOccurrenceNumber}`,
      }),
      target,
      obligation,
    };
    nextOccurrenceNumber = increment(nextOccurrenceNumber);
    occurrences.push(o);
    return o;
  };
  const allocNode = (id: NodeId, kind: ControlOccurrence["obligation"]) =>
    allocate({ kind: "node", nodeId: id }, kind);
  const accept = (id: OccurrenceId) => {
    if (!accepted.includes(id)) accepted.push(id);
  };
  const byId = (id: OccurrenceId) =>
    required(occurrences.find((o) => o.id === id));
  const bound = (id: NodeId, flow: ControlFlow): ControlOccurrence => {
    if (flow.kind === "normal") return normalOccurrence(s, id);
    const item = required(queue(s, flow.queueId).items[flow.index]);
    return required(
      item.routeOccurrences
        .map(byId)
        .find((o) => o.target.kind === "node" && o.target.nodeId === id),
    );
  };
  const enter = (o: ControlOccurrence, resume: ControlResume) => {
    const n = nodeFor(g, o);
    target = o;
    if (n.kind === "selectiveReview") {
      context = { kind: "selection", reviewId: n.reviewId };
      return;
    }
    if (n.kind !== "turn") throw new Error("Cannot present implicit control");
    const c = cycles.find((c) => c.turnOccurrenceIds[0] === o.id);
    context = {
      kind: "delivering",
      resume: {
        ...resume,
        delivery: c ? { kind: "cycle", cycleId: c.id } : resume.delivery,
      },
    };
  };
  const terminalAfter = (id: NodeId, flow: ControlFlow) => {
    const n = required(g.nodes.get(id));
    if (n.kind === "selectiveReview")
      throw new Error("Selection requires explicit choice");
    if (n.next.kind === "end") {
      target = null;
      context = { kind: "terminal" };
      return;
    }
    enter(bound(n.next.nodeId, flow), { flow, delivery: sourceDelivery });
  };
  const confirm = (flow: Extract<ControlFlow, { kind: "review" }>) => {
    const q = queue(s, flow.queueId),
      item = required(q.items[flow.index]);
    if (item.routeOccurrences.some((id) => !accepted.includes(id)))
      throw new Error("Review item has unfinished responses");
    accept(item.confirmationOccurrenceId);
    const next = q.items[flow.index + 1];
    if (next) {
      enter(byId(required(next.routeOccurrences[0])), {
        flow: { ...flow, index: flow.index + 1 },
        delivery: sourceDelivery,
      });
      return;
    }
    accept(q.exitOccurrenceId);
    terminalAfter(q.exitNodeId, normalFlow);
  };
  const proceed = (
    owed: ControlOccurrence,
    resume: ControlResume,
    supported: boolean,
  ) => {
    const n = nodeFor(g, owed);
    if (n.kind !== "turn") throw new Error("Expected oral source turn");
    const flow = resume.flow,
      delivery = resume.delivery;
    if (delivery.kind === "repeat") {
      const returnTo = required(
        s.checkpoints.find((c) => c.id === delivery.returnCheckpointId),
      );
      target =
        returnTo.occurrenceId === null ? null : byId(returnTo.occurrenceId);
      context = returnTo.context;
      return;
    }
    const policy = policyAfter(g, n);
    if (policy) {
      if (delivery.kind !== "cycle")
        throw new Error("Readiness turn has no cycle");
      const c = required(cycles.find((c) => c.id === delivery.cycleId));
      if (c.turnOccurrenceIds.some((id) => !accepted.includes(id)))
        throw new Error("Cycle has unfinished turns");
      if (!outcomes.some((o) => o.cycleId === c.id))
        outcomes.push({
          cycleId: c.id,
          kind: supported ? "supported" : "independent",
        });
      if (action.kind === "parentReady") {
        if (action.policyId !== policy.policyId)
          throw new Error("Wrong readiness policy");
        accept(c.gateOccurrenceId);
        if (flow.kind === "review") {
          const item = required(queue(s, flow.queueId).items[flow.index]);
          if (item.routeOccurrences.at(-1) === c.gateOccurrenceId) {
            confirm(flow);
            return;
          }
        }
        terminalAfter(policy.id, flow);
        return;
      }
      if (action.kind !== "continue")
        throw new Error("Readiness needs explicit decision");
      const turns = required(g.cycleRoutes.get(policy.policyId)).map((id) =>
        allocNode(id, "practice"),
      );
      const first = required(turns[0]);
      const fresh = {
        id: parseId({ kind: "cycle", value: `cycle-${first.id}` }),
        policyId: policy.policyId,
        gateOccurrenceId: c.gateOccurrenceId,
        turnOccurrenceIds: turns.map((o) => o.id),
      };
      cycles.push(fresh);
      enter(first, { flow, delivery: { kind: "cycle", cycleId: fresh.id } });
      return;
    }
    if (action.kind === "parentReady")
      throw new Error("Readiness unavailable here");
    if (flow.kind === "review") {
      const q = queue(s, flow.queueId),
        item = required(q.items[flow.index]);
      if (item.routeOccurrences.at(-1) === owed.id) {
        if (
          action.kind !== "confirmReviewItem" ||
          action.queueId !== q.id ||
          action.itemId !== item.itemId
        )
          throw new Error("Explicit review confirmation required");
        confirm(flow);
        return;
      }
      if (action.kind !== "continue")
        throw new Error("Item confirmation unavailable before route exit");
      const i = item.routeOccurrences.indexOf(owed.id),
        next = required(item.routeOccurrences[i + 1]);
      enter(byId(next), resume);
      return;
    }
    if (action.kind !== "continue")
      throw new Error("Response action unavailable");
    if (n.next.kind === "end") {
      target = null;
      context = { kind: "terminal" };
      return;
    }
    enter(bound(n.next.nodeId, flow), { flow, delivery: sourceDelivery });
  };
  if (action.kind === "help") {
    const old = cp.context;
    if (old.kind !== "delivering" && old.kind !== "correction")
      throw new Error("Help unavailable");
    const owed =
        old.kind === "correction" ? byId(old.owedOccurrenceId) : current,
      original = nodeFor(g, owed);
    const spec = required(
      g.task.corrections.find(
        (c) =>
          c.id === action.correctionId &&
          c.eligibleNodeIds.includes(original.id) &&
          (c.scope === "any" ||
            c.scope ===
              (old.kind === "correction"
                ? old.suspended.flow.kind
                : old.resume.flow.kind)),
      ),
    );
    const instructionOccurrenceIds = spec.instructionNodeIds.map(
        (id) => allocNode(id, "support").id,
      ),
      retestOccurrenceIds = spec.retestNodeIds.map(
        (id) => allocNode(id, "support").id,
      );
    cycles.push(...initialCycles(g, retestOccurrenceIds.map(byId)));
    target = byId(required(instructionOccurrenceIds[0]));
    context = {
      kind: "correction",
      correctionId: spec.id,
      triggerOccurrenceId: owed.id,
      owedOccurrenceId: owed.id,
      suspended: old.kind === "correction" ? old.suspended : old.resume,
      instructionOccurrenceIds,
      retestOccurrenceIds,
      phase: { kind: "instruction", index: 0 },
    };
  } else if (action.kind === "repeat") {
    if (node.kind !== "turn") throw new Error("Repeat unavailable");
    if (cp.context.kind === "correction") {
      target = current;
      context = cp.context;
    } else if (cp.context.kind === "delivering") {
      target = allocNode(node.id, "practice");
      context = {
        kind: "delivering",
        resume: {
          flow: cp.context.resume.flow,
          delivery:
            cp.context.resume.delivery.kind === "repeat"
              ? cp.context.resume.delivery
              : { kind: "repeat", returnCheckpointId: cp.id },
        },
      };
    } else throw new Error("Repeat unavailable");
  } else if (action.kind === "commitReviewSelection") {
    if (
      node.kind !== "selectiveReview" ||
      cp.context.kind !== "selection" ||
      node.reviewId !== action.reviewId ||
      queues.some((q) => q.selectionOccurrenceId === current.id)
    )
      throw new Error("Review selection unavailable");
    const selected = canonicalReviewChoice(g, node.reviewId, action.choice);
    if (canonical(selected) !== canonical(action.choice))
      throw new Error("Review choice must be source ordered");
    primary = current.id;
    accept(current.id);
    const queueId = parseId({ kind: "queue", value: `queue-${current.id}` });
    const items = (selected.kind === "none" ? [] : selected.itemIds).map(
      (itemId) => {
        const route = required(g.itemRoutes.get(itemId)).map((id) =>
          allocNode(id, "required"),
        );
        const confirmation = allocate(
          { kind: "reviewConfirmation", queueId, itemId },
          "required",
        );
        const extra = initialCycles(g, route).filter((c) =>
          route.some((o) => o.id === c.gateOccurrenceId),
        );
        cycles.push(...extra);
        return {
          itemId,
          routeOccurrences: route.map((o) => o.id),
          confirmationOccurrenceId: confirmation.id,
        };
      },
    );
    const q: ReviewQueue = {
      id: queueId,
      reviewId: node.reviewId,
      selectionOccurrenceId: current.id,
      choice: selected,
      items,
      returnNodeId: node.returnNodeId,
      exitNodeId: node.exitNodeId,
      exitOccurrenceId: normalOccurrence(s, node.exitNodeId).id,
    };
    queues.push(q);
    const first = items[0];
    if (first) {
      const o = byId(required(first.routeOccurrences[0]));
      const c = cycles.find((c) => c.turnOccurrenceIds[0] === o.id);
      target = o;
      context = {
        kind: "delivering",
        resume: {
          flow: { kind: "review", queueId, index: 0 },
          delivery: c ? { kind: "cycle", cycleId: c.id } : sourceDelivery,
        },
      };
    } else {
      accept(q.exitOccurrenceId);
      terminalAfter(q.exitNodeId, normalFlow);
    }
  } else {
    if (cp.context.kind !== "delivering" && cp.context.kind !== "correction")
      throw new Error("Response unavailable");
    primary = current.id;
    accept(current.id);
    if (cp.context.kind === "delivering")
      proceed(current, cp.context.resume, false);
    else {
      const c = cp.context,
        spec = required(
          g.task.corrections.find((s) => s.id === c.correctionId),
        );
      const bindings =
        c.phase.kind === "instruction"
          ? c.instructionOccurrenceIds
          : c.retestOccurrenceIds;
      const advanceRetest = (index: number) => {
        const next = c.retestOccurrenceIds[index];
        if (next) {
          target = byId(next);
          context = { ...c, phase: { kind: "retest", index } };
          return;
        }
        const owed = byId(c.owedOccurrenceId);
        accept(owed.id);
        proceed(owed, c.suspended, true);
      };
      if (c.phase.kind === "instruction") {
        if (action.kind !== "continue")
          throw new Error("Decision requires retest");
        const next = bindings[c.phase.index + 1];
        if (next) {
          target = byId(next);
          context = {
            ...c,
            phase: { kind: "instruction", index: c.phase.index + 1 },
          };
        } else advanceRetest(0);
      } else {
        const nextId = bindings[c.phase.index + 1],
          nextNode = nextId ? nodeFor(g, byId(nextId)) : undefined;
        if (nextNode?.kind === "untilFirm") {
          const binding = required(
            cycles.find(
              (cycle) =>
                cycle.gateOccurrenceId === nextId &&
                cycle.turnOccurrenceIds.includes(current.id),
            ),
          );
          if (binding.turnOccurrenceIds.some((id) => !accepted.includes(id)))
            throw new Error("Support cycle unfinished");
          if (!outcomes.some((o) => o.cycleId === binding.id))
            outcomes.push({ cycleId: binding.id, kind: "supported" });
          if (action.kind === "parentReady") {
            if (action.policyId !== nextNode.policyId)
              throw new Error("Wrong support readiness");
            accept(required(nextId));
            advanceRetest(c.phase.index + 2);
          } else if (action.kind === "continue") {
            const route = required(g.cycleRoutes.get(nextNode.policyId)),
              fresh = route.map((id) => allocNode(id, "support")),
              freshIds = fresh.map((o) => o.id);
            const first = required(fresh[0]);
            cycles.push({
              id: parseId({ kind: "cycle", value: `cycle-${first.id}` }),
              policyId: nextNode.policyId,
              gateOccurrenceId: required(nextId),
              turnOccurrenceIds: freshIds,
            });
            const start = c.phase.index - route.length + 1,
              retestOccurrenceIds = [...c.retestOccurrenceIds];
            retestOccurrenceIds.splice(start, route.length, ...freshIds);
            target = first;
            context = {
              ...c,
              retestOccurrenceIds,
              phase: { kind: "retest", index: start },
            };
          } else throw new Error("Support cycle needs explicit readiness");
        } else {
          if (nextId) {
            if (action.kind !== "continue")
              throw new Error("Decision unavailable before retest exit");
            advanceRetest(c.phase.index + 1);
          } else advanceRetest(c.phase.index + 1);
        }
      }
    }
  }
  const checkpoints = s.checkpoints.slice(0, s.checkpointIndex + 1);
  if (checkpoints.length >= 9999) throw new Error("Checkpoint bound reached");
  checkpoints.push({
    id: parseId({
      kind: "checkpoint",
      value: `checkpoint-${s.nextCheckpointNumber}`,
    }),
    occurrenceId: target?.id ?? null,
    context,
  });
  const after: ControlTeachingState = {
    ...s,
    occurrences,
    acceptedOccurrenceIds: accepted,
    cycles,
    cycleOutcomes: outcomes,
    queues,
    checkpoints,
    checkpointIndex: checkpoints.length - 1,
    nextOccurrenceNumber,
    nextCheckpointNumber: increment(s.nextCheckpointNumber),
  };
  validateControlPosition(content, after);
  if (primary === null) return deepFreeze({ kind: "navigation", after });
  const completion = controlCompletionProof(content, after);
  return deepFreeze(
    completion
      ? { kind: "completion", after, occurrenceId: primary, completion }
      : { kind: "acceptance", after, occurrenceId: primary },
  );
}
export function projectControls(
  content: DevelopmentPackage,
  s: ControlTeachingState,
): EngineProjection {
  const g = controlTask(content, s.taskId),
    cp = controlCheckpoint(s);
  if (cp.occurrenceId === null) return { kind: "completed" };
  const o = occurrence(s, cp.occurrenceId),
    n = nodeFor(g, o);
  if (n.kind === "selectiveReview") {
    const items = n.items.map((i) => ({
      itemId: i.itemId,
      label: i.parentLabel,
    }));
    return {
      kind: "reviewSelection",
      reviewId: n.reviewId,
      items,
      selectionAction: {
        kind: "reviewSelection",
        reviewId: n.reviewId,
        eligibleItems: items,
        selectLabel: { kind: "added", text: "Review" },
        emptyLabel: { kind: "added", text: "No review" },
      },
      presentation: { kind: "oral" },
      guidance: n.guidance,
      committedChoice:
        s.queues.find((q) => q.selectionOccurrenceId === o.id)?.choice ?? null,
    };
  }
  if (
    n.kind !== "turn" ||
    (cp.context.kind !== "delivering" && cp.context.kind !== "correction")
  )
    throw new Error("Control presentation unavailable");
  const retestNext =
    cp.context.kind === "correction" && cp.context.phase.kind === "retest"
      ? cp.context.retestOccurrenceIds[cp.context.phase.index + 1]
      : undefined;
  const nextNode = retestNext
    ? nodeFor(g, occurrence(s, retestNext))
    : undefined;
  const gate =
    nextNode?.kind === "untilFirm"
      ? nextNode
      : cp.context.kind === "delivering" &&
          cp.context.resume.delivery.kind !== "repeat"
        ? policyAfter(g, n)
        : undefined;
  return {
    kind: "teaching",
    turn: {
      ...n,
      guidance: gate ? [...n.guidance, ...gate.guidance] : n.guidance,
      extraPractice: o.obligation !== "required",
      routeKind: cp.context.kind,
      occurrenceId: o.id,
      checkpointId: cp.id,
    },
  };
}
export function controlActions(
  content: DevelopmentPackage,
  s: ControlTeachingState,
  status: "inProgress" | "completed",
): AvailableAction[] {
  const g = controlTask(content, s.taskId),
    cp = controlCheckpoint(s),
    actions: AvailableAction[] = [];
  const add = (text: string, intent: Exclude<GraphAction, { kind: "help" }>) =>
    actions.push({ label: { kind: "added", text }, intent });
  if (s.checkpointIndex > 0) add("Back", { kind: "back" });
  if (cp.occurrenceId === null) return actions;
  const o = occurrence(s, cp.occurrenceId),
    n = nodeFor(g, o);
  if (
    s.acceptedOccurrenceIds.includes(o.id) &&
    s.checkpointIndex < s.checkpoints.length - 1
  ) {
    add("Continue", { kind: "continue" });
    if (status === "completed") return actions;
  } else if (status === "completed") return actions;
  else if (n.kind === "turn") {
    const c = cp.context;
    const spec =
      c.kind === "correction"
        ? required(g.task.corrections.find((s) => s.id === c.correctionId))
        : undefined;
    const resolves =
      c.kind !== "correction" ||
      (c.phase.kind === "retest" &&
        c.phase.index === required(spec).retestNodeIds.length - 1);
    const owed =
      c.kind === "correction" ? occurrence(s, c.owedOccurrenceId) : o;
    const source = nodeFor(g, owed),
      resume =
        c.kind === "correction"
          ? c.suspended
          : c.kind === "delivering"
            ? c.resume
            : undefined;
    const retestNext =
      c.kind === "correction" && c.phase.kind === "retest"
        ? c.retestOccurrenceIds[c.phase.index + 1]
        : undefined;
    const retestNextNode = retestNext
      ? nodeFor(g, occurrence(s, retestNext))
      : undefined;
    const policy =
      retestNextNode?.kind === "untilFirm"
        ? retestNextNode
        : resolves && resume?.delivery.kind !== "repeat"
          ? policyAfter(g, source)
          : undefined;
    if (policy) {
      add("Practice again", { kind: "continue" });
      add("Ready", { kind: "parentReady", policyId: policy.policyId });
    } else if (
      resolves &&
      resume?.flow.kind === "review" &&
      resume.delivery.kind !== "repeat"
    ) {
      const q = queue(s, resume.flow.queueId),
        item = required(q.items[resume.flow.index]);
      if (item.routeOccurrences.at(-1) === owed.id)
        add("Next word", {
          kind: "confirmReviewItem",
          queueId: q.id,
          itemId: item.itemId,
        });
      else add("Continue", { kind: "continue" });
    } else add("Continue", { kind: "continue" });
  }
  if (status === "inProgress") {
    if (n.kind === "turn") {
      add("Repeat", { kind: "repeat" });
      const original =
        cp.context.kind === "correction"
          ? nodeFor(g, occurrence(s, cp.context.owedOccurrenceId))
          : n;
      for (const c of g.task.corrections)
        if (
          c.eligibleNodeIds.includes(original.id) &&
          (c.scope === "any" ||
            c.scope ===
              (cp.context.kind === "correction"
                ? cp.context.suspended.flow.kind
                : cp.context.kind === "delivering"
                  ? cp.context.resume.flow.kind
                  : "normal"))
        ) {
          const preview = required(
            g.nodes.get(required(c.instructionNodeIds[0])),
          );
          if (preview.kind !== "turn")
            throw new Error("Correction preview is not a turn");
          actions.push({
            label: c.label,
            intent: { kind: "help", correctionId: c.id },
            correctionPreview: preview,
          });
        }
    }
    add("Pause", { kind: "pause" });
  }
  return actions;
}
