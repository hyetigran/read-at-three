import type { RuntimePackage } from "./course-content.ts";
import { writingTask } from "./writing.ts";
import {
  canonical,
  controlTask,
  deepFreeze,
  increment,
  parseCounter,
  parseId,
} from "./content.ts";
import {
  canonicalReviewChoice,
  type CompiledControlTask,
} from "./control-content.ts";
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
  CycleId,
  EngineProjection,
  GraphAction,
  NodeId,
  OccurrenceId,
  QueueId,
  ReviewQueue,
  TaskId,
  TransitionPlan,
  UntilFirmNode,
} from "./types.ts";
const normalFlow = { kind: "normal" } as const;
const sourceDelivery = { kind: "source" } as const;
function cycleSuccessor({
  cycles,
  delivery,
  owed,
}: {
  cycles: readonly CycleBinding[];
  delivery: Extract<ControlResume["delivery"], { kind: "cycle" }>;
  owed: OccurrenceId;
}): OccurrenceId {
  const binding = required(
    cycles.find((cycle) => cycle.id === delivery.cycleId),
  );
  const index = binding.turnOccurrenceIds.indexOf(owed);
  if (index < 0) throw new Error("Cycle response binding unavailable");
  return required(binding.turnOccurrenceIds[index + 1]);
}
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Control binding unavailable");
  return value;
}
export function controlCheckpoint(
  state: ControlTeachingState,
): ControlCheckpoint {
  return required(state.checkpoints[state.checkpointIndex]);
}
function occurrence({
  state,
  id,
}: {
  state: ControlTeachingState;
  id: OccurrenceId;
}) {
  return required(state.occurrences.find((o) => o.id === id));
}
function nodeFor({
  graph,
  currentOccurrence,
}: {
  graph: CompiledControlTask;
  currentOccurrence: ControlOccurrence;
}): ControlNode {
  if (currentOccurrence.target.kind !== "node")
    throw new Error("Not a source occurrence");
  return required(graph.nodes.get(currentOccurrence.target.nodeId));
}
function normalOccurrence({
  state,
  id,
}: {
  state: ControlTeachingState;
  id: NodeId;
}) {
  return required(
    state.occurrences.find(
      (o) =>
        o.obligation === "required" &&
        o.target.kind === "node" &&
        o.target.nodeId === id,
    ),
  );
}
function queue({ state, id }: { state: ControlTeachingState; id: QueueId }) {
  return required(state.queues.find((q) => q.id === id));
}
function cycle({ state, id }: { state: ControlTeachingState; id: CycleId }) {
  return required(state.cycles.find((c) => c.id === id));
}
function policyAfter({
  graph,
  node,
}: {
  graph: CompiledControlTask;
  node: ControlNode;
}): UntilFirmNode | undefined {
  if (node.kind !== "turn" || node.next.kind !== "node") return;
  const next = graph.nodes.get(node.next.nodeId);
  return next?.kind === "untilFirm" ? next : undefined;
}
type CorrectionContext = Extract<ControlContext, { kind: "correction" }>;
function correctionRoute({
  graph,
  context,
}: {
  graph: CompiledControlTask;
  context: CorrectionContext;
}) {
  const specification = required(
    graph.task.corrections.find((c) => c.id === context.correctionId),
  );
  const nodeIds =
    context.phase.kind === "instruction"
      ? specification.instructionNodeIds
      : specification.retestNodeIds;
  const occurrenceIds =
    context.phase.kind === "instruction"
      ? context.instructionOccurrenceIds
      : context.retestOccurrenceIds;
  const nextId = nodeIds[context.phase.index + 1];
  const next = nextId === undefined ? undefined : graph.nodes.get(nextId);
  return {
    nodeIds,
    occurrenceIds,
    index: context.phase.index,
    gate:
      nodeIds[context.phase.index + 1] !== undefined &&
      next?.kind === "untilFirm"
        ? next
        : undefined,
  };
}
function correctionBindings({
  context,
  occurrenceIds,
}: {
  context: CorrectionContext;
  occurrenceIds: readonly OccurrenceId[];
}): CorrectionContext {
  return context.phase.kind === "instruction"
    ? { ...context, instructionOccurrenceIds: occurrenceIds }
    : { ...context, retestOccurrenceIds: occurrenceIds };
}
function initialCycles({
  graph,
  occurrences,
}: {
  graph: CompiledControlTask;
  occurrences: readonly ControlOccurrence[];
}): CycleBinding[] {
  return [...graph.policies.values()]
    .filter((p) =>
      occurrences.some(
        (o) => o.target.kind === "node" && o.target.nodeId === p.id,
      ),
    )
    .map((policy) => {
      const gate = required(
        occurrences.find(
          (o) => o.target.kind === "node" && o.target.nodeId === policy.id,
        ),
      );
      return {
        id: parseId({ kind: "cycle", value: `cycle-${gate.id}` }),
        policyId: policy.policyId,
        gateOccurrenceId: gate.id,
        turnOccurrenceIds: required(graph.cycleRoutes.get(policy.policyId)).map(
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
function separatePolicy(content: RuntimePackage, graph: CompiledControlTask) {
  if (
    content.body.coverage !== "course-development-v4" ||
    content.body.contentSchemaVersion !== 4 ||
    !content.body.requiredEngineCapabilities.includes(
      "complete-lessons-01-06-v1",
    ) ||
    graph.task.id !== "l06.t05"
  )
    return;
  return [...graph.policies.values()].find(
    (policy) =>
      policy.policyId === "l06.t05.whole-replay" &&
      graph.normalNodeIds.includes(policy.id),
  );
}
function readinessAt({
  content,
  graph,
  state,
  checkpoint,
}: {
  content: RuntimePackage;
  graph: CompiledControlTask;
  state: ControlTeachingState;
  checkpoint: ControlCheckpoint;
}) {
  const policy = separatePolicy(content, graph);
  if (!policy || checkpoint.occurrenceId === null) return;
  const current = occurrence({ state, id: checkpoint.occurrenceId });
  if (current.target.kind !== "node" || current.target.nodeId !== policy.id)
    return;
  const context = checkpoint.context;
  if (
    context.kind !== "delivering" ||
    context.resume.flow.kind !== "normal" ||
    context.resume.delivery.kind !== "cycle"
  )
    throw new Error("Readiness decision context changed");
  const binding = cycle({ state, id: context.resume.delivery.cycleId });
  if (
    binding.policyId !== policy.policyId ||
    binding.gateOccurrenceId !== current.id ||
    binding.turnOccurrenceIds.some(
      (id) => !state.acceptedOccurrenceIds.includes(id),
    ) ||
    !state.cycleOutcomes.some((outcome) => outcome.cycleId === binding.id)
  )
    throw new Error("Readiness decision requires its complete cycle");
  return { policy, cycle: binding };
}
function separatePracticeEdge({
  content,
  graph,
  state,
  previous,
  next,
}: {
  content: RuntimePackage;
  graph: CompiledControlTask;
  state: ControlTeachingState;
  previous: ControlCheckpoint;
  next: ControlCheckpoint;
}) {
  const gate = readinessAt({ content, graph, state, checkpoint: previous });
  if (
    !gate ||
    next.context.kind !== "delivering" ||
    next.context.resume.flow.kind !== "normal" ||
    next.context.resume.delivery.kind !== "cycle"
  )
    return;
  const binding = cycle({ state, id: next.context.resume.delivery.cycleId });
  if (
    binding.id === gate.cycle.id ||
    binding.policyId !== gate.policy.policyId ||
    binding.gateOccurrenceId !== gate.cycle.gateOccurrenceId ||
    next.occurrenceId !== binding.turnOccurrenceIds[0]
  )
    return;
  const route = required(graph.cycleRoutes.get(gate.policy.policyId));
  if (
    binding.turnOccurrenceIds.length !== route.length ||
    binding.turnOccurrenceIds.some((id, i) => {
      const o = occurrence({ state, id });
      return (
        o.obligation !== "practice" ||
        o.target.kind !== "node" ||
        o.target.nodeId !== route[i]
      );
    })
  )
    return;
  return binding;
}
function separatePracticeIntroductions({
  content,
  graph,
  state,
}: {
  content: RuntimePackage;
  graph: CompiledControlTask;
  state: ControlTeachingState;
}) {
  const introductions = new Map<CycleId, number>();
  if (!separatePolicy(content, graph)) return introductions;
  for (let index = 1; index < state.checkpoints.length; index++) {
    const previous = required(state.checkpoints[index - 1]),
      next = required(state.checkpoints[index]);
    const introduced = separatePracticeEdge({
      content,
      graph,
      state,
      previous,
      next,
    });
    if (!introduced) continue;
    if (introductions.has(introduced.id))
      throw new Error("Practice cycle has duplicate introducing history");
    introductions.set(introduced.id, index);
  }
  for (const binding of state.cycles) {
    const obligations = binding.turnOccurrenceIds.map(
      (id) => occurrence({ state, id }).obligation,
    );
    if (obligations.every((obligation) => obligation === "required")) continue;
    if (
      obligations.some((obligation) => obligation !== "practice") ||
      !introductions.has(binding.id)
    )
      throw new Error("Practice cycle has no introducing history");
  }
  return introductions;
}
export function separateReadinessNavigationCycles({
  content,
  baseline,
  state,
}: {
  content: RuntimePackage;
  baseline: ControlTeachingState;
  state: ControlTeachingState;
}): ReadonlySet<CycleId> {
  const graph = controlTask({ content, taskId: state.taskId }),
    introductions = separatePracticeIntroductions({ content, graph, state });
  const appended = state.cycles
    .slice(baseline.cycles.length)
    .filter((binding) => introductions.has(binding.id));
  if (appended.length > 1)
    throw new Error("Navigation introduced more than one independent cycle");
  for (const binding of appended) {
    const index = required(introductions.get(binding.id)),
      next = required(state.checkpoints[index]);
    const number = /^checkpoint-([1-9][0-9]*)$/.exec(next.id)?.[1];
    if (
      !number ||
      BigInt(number) < BigInt(baseline.nextCheckpointNumber) ||
      binding.turnOccurrenceIds.some(
        (id) =>
          baseline.occurrences.some((o) => o.id === id) ||
          state.acceptedOccurrenceIds.includes(id),
      )
    )
      throw new Error(
        "Navigation practice cycle changed its acceptance baseline",
      );
  }
  return new Set(appended.map((binding) => binding.id));
}

export function initialControlState({
  content,
  taskId,
}: {
  content: RuntimePackage;
  taskId: TaskId;
}): ControlTeachingState {
  const graph = controlTask({ content, taskId });
  const occurrences = graph.normalNodeIds.map((id, i): ControlOccurrence => ({
    id: parseId({ kind: "occurrence", value: `occurrence-${i + 1}` }),
    target: { kind: "node", nodeId: id },
    obligation: "required",
  }));
  const cycles = initialCycles({ graph, occurrences });
  return deepFreeze({
    version: 1,
    kind: "graphControls",
    taskId,
    occurrences,
    acceptedOccurrenceIds: [],
    cycles,
    cycleOutcomes: [],
    queues: [],
    checkpoints: [initialControlCheckpoint({ graph, occurrences, cycles })],
    checkpointIndex: 0,
    nextOccurrenceNumber: parseCounter(String(occurrences.length + 1)),
    nextCheckpointNumber: parseCounter("2"),
  });
}
export function validateControlPosition({
  content,
  state,
  taskId,
}: {
  content: RuntimePackage;
  state: ControlTeachingState;
  taskId?: TaskId;
}): void {
  if (taskId !== undefined && state.taskId !== taskId)
    throw new Error("Control task changed");
  const graph = controlTask({ content, taskId: state.taskId }),
    initial = initialControlState({ content, taskId: state.taskId });
  if (
    state.occurrences.length >= 10000 ||
    state.nextOccurrenceNumber !== String(state.occurrences.length + 1) ||
    canonical(state.occurrences.slice(0, initial.occurrences.length)) !==
      canonical(initial.occurrences)
  )
    throw new Error("Control occurrence registry changed");
  for (const [i, currentOccurrence] of state.occurrences.entries()) {
    if (currentOccurrence.id !== `occurrence-${i + 1}`)
      throw new Error("Control occurrence identity invalid");
    if (currentOccurrence.target.kind === "node") {
      const node = graph.nodes.get(currentOccurrence.target.nodeId);
      if (
        !node ||
        (currentOccurrence.obligation !== "support" &&
          !graph.normalNodeIds.includes(node.id)) ||
        (i >= initial.occurrences.length &&
          currentOccurrence.obligation === "required" &&
          !state.queues.some((q) =>
            q.items.some((item) =>
              item.routeOccurrences.includes(currentOccurrence.id),
            ),
          ))
      )
        throw new Error("Control occurrence target invalid");
    } else {
      const reviewQueue = queue({
          state,
          id: currentOccurrence.target.queueId,
        }),
        item = currentOccurrence.target.itemId;
      if (
        currentOccurrence.obligation !== "required" ||
        !reviewQueue.items.some(
          (i) =>
            i.itemId === item &&
            i.confirmationOccurrenceId === currentOccurrence.id,
        )
      )
        throw new Error("Review confirmation binding invalid");
    }
  }
  const accepted = new Set(state.acceptedOccurrenceIds);
  if (
    accepted.size !== state.acceptedOccurrenceIds.length ||
    state.acceptedOccurrenceIds.some(
      (id) => !state.occurrences.some((o) => o.id === id),
    )
  )
    throw new Error("Invalid control acceptance membership");
  if (
    canonical(state.cycles.slice(0, initial.cycles.length)) !==
      canonical(initial.cycles) ||
    new Set(state.cycles.map((c) => c.id)).size !== state.cycles.length
  )
    throw new Error("Cycle registry changed");
  const cycleTurns = new Set<OccurrenceId>();
  for (const cycleBinding of state.cycles) {
    const policy = required(graph.policies.get(cycleBinding.policyId)),
      ids = required(graph.cycleRoutes.get(policy.policyId));
    if (
      cycleBinding.turnOccurrenceIds.length !== ids.length ||
      nodeFor({
        graph,
        currentOccurrence: occurrence({
          state,
          id: cycleBinding.gateOccurrenceId,
        }),
      }).id !== policy.id ||
      (cycleBinding.id !== `cycle-${cycleBinding.gateOccurrenceId}` &&
        cycleBinding.id !== `cycle-${cycleBinding.turnOccurrenceIds[0]}`)
    )
      throw new Error("Cycle policy binding invalid");
    cycleBinding.turnOccurrenceIds.forEach((id, i) => {
      if (
        cycleTurns.has(id) ||
        nodeFor({ graph, currentOccurrence: occurrence({ state, id }) }).id !==
          ids[i]
      )
        throw new Error("Cycle turns changed");
      cycleTurns.add(id);
    });
  }
  if (
    new Set(state.cycleOutcomes.map((o) => o.cycleId)).size !==
    state.cycleOutcomes.length
  )
    throw new Error("Duplicate cycle outcome");
  for (const outcome of state.cycleOutcomes) {
    const cycleBinding = cycle({ state, id: outcome.cycleId });
    if (
      cycleBinding.turnOccurrenceIds.some((id) => !accepted.has(id)) ||
      (outcome.kind === "independent" &&
        cycleBinding.turnOccurrenceIds.some((id) => {
          const currentOccurrence = occurrence({ state, id });
          const node = nodeFor({ graph, currentOccurrence });
          return (
            currentOccurrence.obligation === "support" ||
            (node.kind === "turn" && node.parentRole === "together")
          );
        }))
    )
      throw new Error(
        "Cycle outcome has unfinished response or false independence",
      );
  }
  for (const policy of graph.policies.values())
    for (const currentOccurrence of state.occurrences.filter(
      (o) => o.target.kind === "node" && o.target.nodeId === policy.id,
    ))
      if (
        accepted.has(currentOccurrence.id) &&
        !state.cycles.some(
          (c) =>
            c.gateOccurrenceId === currentOccurrence.id &&
            state.cycleOutcomes.some((outcome) => outcome.cycleId === c.id),
        )
      )
        throw new Error("Readiness has no completed current cycle");
  if (
    new Set(state.queues.map((q) => q.id)).size !== state.queues.length ||
    new Set(state.queues.map((q) => q.selectionOccurrenceId)).size !==
      state.queues.length
  )
    throw new Error("Duplicate immutable queue");
  for (const reviewQueue of state.queues) {
    const review = required(
      graph.reviews.find((r) => r.reviewId === reviewQueue.reviewId),
    );
    if (
      reviewQueue.id !== `queue-${reviewQueue.selectionOccurrenceId}` ||
      nodeFor({
        graph,
        currentOccurrence: occurrence({
          state,
          id: reviewQueue.selectionOccurrenceId,
        }),
      }).id !== review.id ||
      !accepted.has(reviewQueue.selectionOccurrenceId) ||
      reviewQueue.returnNodeId !== review.returnNodeId ||
      reviewQueue.exitNodeId !== review.exitNodeId ||
      reviewQueue.exitOccurrenceId !==
        normalOccurrence({ state, id: review.exitNodeId }).id ||
      canonical(reviewQueue.choice) !==
        canonical(
          canonicalReviewChoice({
            items: review.items,
            choice: reviewQueue.choice,
          }),
        )
    )
      throw new Error("Immutable review queue invalid");
    const selected =
      reviewQueue.choice.kind === "none" ? [] : reviewQueue.choice.itemIds;
    if (
      canonical(reviewQueue.items.map((i) => i.itemId)) !== canonical(selected)
    )
      throw new Error("Review selected order changed");
    const bound = new Set<OccurrenceId>();
    for (const item of reviewQueue.items) {
      const route = required(graph.itemRoutes.get(item.itemId));
      if (item.routeOccurrences.length !== route.length)
        throw new Error("Review route incomplete");
      item.routeOccurrences.forEach((id, i) => {
        const o = occurrence({ state, id });
        if (
          bound.has(id) ||
          initial.occurrences.some((n) => n.id === id) ||
          o.obligation !== "required" ||
          nodeFor({ graph, currentOccurrence: o }).id !== route[i]
        )
          throw new Error("Review route binding changed");
        bound.add(id);
      });
      const confirm = occurrence({ state, id: item.confirmationOccurrenceId });
      if (
        confirm.target.kind !== "reviewConfirmation" ||
        confirm.target.queueId !== reviewQueue.id ||
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
      accepted.has(reviewQueue.exitOccurrenceId) &&
      reviewQueue.items.some((i) => !accepted.has(i.confirmationOccurrenceId))
    )
      throw new Error("Review exited before confirmations");
  }
  if (
    state.checkpoints.length === 0 ||
    state.checkpoints.length >= 10000 ||
    !Number.isInteger(state.checkpointIndex) ||
    state.checkpointIndex < 0 ||
    state.checkpointIndex >= state.checkpoints.length
  )
    throw new Error("Control checkpoint cursor invalid");
  let prior = 0n;
  for (const [index, checkpoint] of state.checkpoints.entries()) {
    const number = /^checkpoint-([1-9][0-9]*)$/.exec(checkpoint.id)?.[1];
    if (
      !number ||
      BigInt(number) <= prior ||
      BigInt(number) >= BigInt(state.nextCheckpointNumber)
    )
      throw new Error("Control checkpoint identity invalid");
    prior = BigInt(number);
    if (checkpoint.occurrenceId === null) {
      if (!controlCompletionProof({ content, state }))
        throw new Error("Unproved control terminal");
      continue;
    }
    const current = occurrence({
        state,
        id: checkpoint.occurrenceId,
      }),
      node = nodeFor({ graph, currentOccurrence: current }),
      context = checkpoint.context;
    if (context.kind === "selection") {
      if (node.kind !== "selectiveReview" || node.reviewId !== context.reviewId)
        throw new Error("Selection checkpoint invalid");
      continue;
    }
    if (readinessAt({ content, graph, state, checkpoint })) continue;
    if (node.kind !== "turn") throw new Error("Control delivery is not a turn");
    const resume =
      context.kind === "correction" ? context.suspended : context.resume;
    if (resume.flow.kind === "review") {
      const flow = resume.flow;
      const reviewQueue = queue({ state, id: flow.queueId });
      if (!reviewQueue.items[flow.index])
        throw new Error("Review cursor invalid");
    }
    if (resume.delivery.kind === "cycle") {
      const cycleBinding = cycle({ state, id: resume.delivery.cycleId });
      const owed =
        context.kind === "correction" ? context.owedOccurrenceId : current.id;
      if (!cycleBinding.turnOccurrenceIds.includes(owed))
        throw new Error("Cycle checkpoint binding invalid");
    }
    if (resume.delivery.kind === "repeat") {
      const target = resume.delivery.returnCheckpointId;
      const back = state.checkpoints.findIndex((c) => c.id === target);
      if (back < 0 || back >= index) throw new Error("Practice return invalid");
    }
    if (context.kind === "correction") {
      const correctionSpec = required(
        graph.task.corrections.find((c) => c.id === context.correctionId),
      );
      const owed = occurrence({ state, id: context.owedOccurrenceId }),
        trigger = occurrence({ state, id: context.triggerOccurrenceId });
      if (
        !correctionSpec.eligibleNodeIds.includes(
          nodeFor({ graph, currentOccurrence: trigger }).id,
        ) ||
        nodeFor({ graph, currentOccurrence: owed }).kind !== "turn"
      )
        throw new Error("Correction owed response invalid");
      for (const kind of [
        "instruction",
        "retest",
      ] satisfies CorrectionContext["phase"]["kind"][]) {
        const route = correctionRoute({
          graph,
          context: { ...context, phase: { kind, index: 0 } },
        });
        if (
          route.occurrenceIds.length !== route.nodeIds.length ||
          new Set(route.occurrenceIds).size !== route.occurrenceIds.length ||
          route.occurrenceIds.some(
            (id, i) =>
              nodeFor({ graph, currentOccurrence: occurrence({ state, id }) })
                .id !== route.nodeIds[i] ||
              occurrence({ state, id }).obligation !== "support",
          )
        )
          throw new Error("Correction route bindings invalid");
      }
      const route = correctionRoute({ graph, context });
      if (
        !Number.isInteger(route.index) ||
        route.index < 0 ||
        route.nodeIds[route.index] !== node.id ||
        route.occurrenceIds[route.index] !== current.id ||
        current.obligation !== "support"
      )
        throw new Error("Correction route cursor invalid");
    } else if (node.route !== "normal" || current.obligation === "support")
      throw new Error("Normal control turn invalid");
  }
  validateCheckpointRoute({ content, graph, state });
}
function validateCheckpointRoute({
  content,
  graph,
  state,
}: {
  content: RuntimePackage;
  graph: CompiledControlTask;
  state: ControlTeachingState;
}): void {
  const introductions = separatePracticeIntroductions({
    content,
    graph,
    state,
  });
  const accepted = new Set(state.acceptedOccurrenceIds);
  const same = ({ a, b }: { a: unknown; b: unknown }) =>
    canonical(a) === canonical(b);
  const expectedContext = ({
    currentOccurrence,
    flow,
    delivery = sourceDelivery,
  }: {
    currentOccurrence: ControlOccurrence;
    flow: ControlFlow;
    delivery?: ControlResume["delivery"];
  }): Exclude<ControlContext, { kind: "terminal" }> => {
    const node = nodeFor({ graph, currentOccurrence });
    if (node.kind === "selectiveReview")
      return { kind: "selection", reviewId: node.reviewId };
    const cycleBinding = state.cycles.find(
      (c) => c.turnOccurrenceIds[0] === currentOccurrence.id,
    );
    return {
      kind: "delivering",
      resume: {
        flow,
        delivery: cycleBinding
          ? { kind: "cycle", cycleId: cycleBinding.id }
          : delivery,
      },
    };
  };
  const binding = ({ nodeId, flow }: { nodeId: NodeId; flow: ControlFlow }) => {
    if (flow.kind === "normal") return normalOccurrence({ state, id: nodeId });
    const item = required(queue({ state, id: flow.queueId }).items[flow.index]);
    return required(
      item.routeOccurrences
        .map((id) => occurrence({ state, id }))
        .find((o) => o.target.kind === "node" && o.target.nodeId === nodeId),
    );
  };
  const following = ({
    next,
    owed,
    resume,
  }: {
    next: ControlCheckpoint;
    owed: ControlOccurrence;
    resume: ControlResume;
  }): boolean => {
    const node = nodeFor({ graph, currentOccurrence: owed });
    const selectedPolicy = separatePolicy(content, graph);
    if (node.kind === "untilFirm" && selectedPolicy?.id === node.id) {
      if (
        resume.flow.kind !== "normal" ||
        resume.delivery.kind !== "cycle" ||
        !accepted.has(owed.id)
      )
        return false;
      const binding = cycle({ state, id: resume.delivery.cycleId });
      if (
        binding.gateOccurrenceId !== owed.id ||
        binding.policyId !== node.policyId
      )
        return false;
      if (node.next.kind === "end")
        return next.occurrenceId === null && next.context.kind === "terminal";
      const followingOccurrence = normalOccurrence({
        state,
        id: node.next.nodeId,
      });
      return same({
        a: next,
        b: {
          id: next.id,
          occurrenceId: followingOccurrence.id,
          context: expectedContext({
            currentOccurrence: followingOccurrence,
            flow: normalFlow,
          }),
        } satisfies ControlCheckpoint,
      });
    }
    if (node.kind !== "turn" || !accepted.has(owed.id)) return false;
    const delivery = resume.delivery,
      flow = resume.flow;
    if (delivery.kind === "repeat") {
      const back = required(
        state.checkpoints.find((cp) => cp.id === delivery.returnCheckpointId),
      );
      return same({ a: next, b: { ...back, id: next.id } });
    }
    const policy = policyAfter({ graph, node });
    let routeExit: NodeId = node.id;
    if (policy) {
      if (delivery.kind !== "cycle") return false;
      const cycleBinding = cycle({ state, id: delivery.cycleId });
      if (!state.cycleOutcomes.some((o) => o.cycleId === cycleBinding.id))
        return false;
      if (selectedPolicy?.id === policy.id)
        return same({
          a: next,
          b: {
            id: next.id,
            occurrenceId: cycleBinding.gateOccurrenceId,
            context: { kind: "delivering", resume },
          } satisfies ControlCheckpoint,
        });
      if (
        next.context.kind === "delivering" &&
        next.context.resume.delivery.kind === "cycle"
      ) {
        const nextCycle = cycle({
          state,
          id: next.context.resume.delivery.cycleId,
        });
        if (
          nextCycle.id !== cycleBinding.id &&
          nextCycle.gateOccurrenceId === cycleBinding.gateOccurrenceId &&
          same({ a: next.context.resume.flow, b: flow }) &&
          next.occurrenceId === nextCycle.turnOccurrenceIds[0]
        )
          return true;
      }
      if (!accepted.has(cycleBinding.gateOccurrenceId)) return false;
      routeExit = policy.id;
    }
    if (!policy && delivery.kind === "cycle") {
      const currentOccurrence = occurrence({
        state,
        id: cycleSuccessor({ cycles: state.cycles, delivery, owed: owed.id }),
      });
      return same({
        a: next,
        b: {
          id: next.id,
          occurrenceId: currentOccurrence.id,
          context: expectedContext({ currentOccurrence, flow, delivery }),
        } satisfies ControlCheckpoint,
      });
    }
    if (flow.kind === "review") {
      const reviewQueue = queue({ state, id: flow.queueId }),
        item = required(reviewQueue.items[flow.index]);
      const exit = required(item.routeOccurrences.at(-1));
      if (
        nodeFor({ graph, currentOccurrence: occurrence({ state, id: exit }) })
          .id === routeExit
      ) {
        if (!accepted.has(item.confirmationOccurrenceId)) return false;
        const following = reviewQueue.items[flow.index + 1];
        if (following) {
          const currentOccurrence = occurrence({
            state,
            id: required(following.routeOccurrences[0]),
          });
          return same({
            a: next,
            b: {
              id: next.id,
              occurrenceId: currentOccurrence.id,
              context: expectedContext({
                currentOccurrence,
                flow: {
                  ...flow,
                  index: flow.index + 1,
                },
              }),
            } satisfies ControlCheckpoint,
          });
        }
        if (!accepted.has(reviewQueue.exitOccurrenceId)) return false;
        const end = required(graph.nodes.get(reviewQueue.exitNodeId));
        if (end.kind !== "reviewExit") return false;
        if (end.next.kind === "end")
          return same({
            a: next,
            b: {
              id: next.id,
              occurrenceId: null,
              context: { kind: "terminal" },
            } satisfies ControlCheckpoint,
          });
        const currentOccurrence = normalOccurrence({
          state,
          id: end.next.nodeId,
        });
        return same({
          a: next,
          b: {
            id: next.id,
            occurrenceId: currentOccurrence.id,
            context: expectedContext({ currentOccurrence, flow: normalFlow }),
          } satisfies ControlCheckpoint,
        });
      }
    }
    const end = required(graph.nodes.get(routeExit));
    if (end.kind === "selectiveReview") return false;
    if (end.next.kind === "end")
      return same({
        a: next,
        b: {
          id: next.id,
          occurrenceId: null,
          context: { kind: "terminal" },
        } satisfies ControlCheckpoint,
      });
    const currentOccurrence = binding({ nodeId: end.next.nodeId, flow });
    return same({
      a: next,
      b: {
        id: next.id,
        occurrenceId: currentOccurrence.id,
        context: expectedContext({ currentOccurrence, flow }),
      } satisfies ControlCheckpoint,
    });
  };
  const initial = initialControlCheckpoint({
    graph,
    occurrences: state.occurrences,
    cycles: state.cycles,
  });
  if (!same({ a: state.checkpoints[0], b: initial }))
    throw new Error("Control checkpoint entry changed");
  for (let i = 1; i < state.checkpoints.length; i++) {
    const previous = required(state.checkpoints[i - 1]),
      next = required(state.checkpoints[i]);
    if (previous.occurrenceId === null)
      throw new Error("Control terminal cannot start another route");
    const current = occurrence({ state, id: previous.occurrenceId }),
      previousContext = previous.context,
      nextContext = next.context;
    if (
      nextContext.kind === "correction" &&
      nextContext.phase.kind === "instruction" &&
      nextContext.phase.index === 0 &&
      (previousContext.kind !== "correction" ||
        (!same({
          a: nextContext.instructionOccurrenceIds,
          b: previousContext.instructionOccurrenceIds,
        }) &&
          nextContext.instructionOccurrenceIds.every(
            (id) => !previousContext.instructionOccurrenceIds.includes(id),
          ) &&
          nextContext.retestOccurrenceIds.every(
            (id) => !previousContext.retestOccurrenceIds.includes(id),
          )))
    ) {
      if (
        previousContext.kind !== "delivering" &&
        previousContext.kind !== "correction"
      )
        throw new Error("Correction suspension is unavailable");
      const owed =
          previousContext.kind === "correction"
            ? previousContext.owedOccurrenceId
            : current.id,
        suspended =
          previousContext.kind === "correction"
            ? previousContext.suspended
            : previousContext.resume;
      const correctionSpec = required(
        graph.task.corrections.find((c) => c.id === nextContext.correctionId),
      );
      if (
        nextContext.owedOccurrenceId !== owed ||
        nextContext.triggerOccurrenceId !== owed ||
        !same({ a: nextContext.suspended, b: suspended }) ||
        !correctionSpec.eligibleNodeIds.includes(
          nodeFor({ graph, currentOccurrence: occurrence({ state, id: owed }) })
            .id,
        ) ||
        (correctionSpec.scope !== "any" &&
          correctionSpec.scope !== suspended.flow.kind)
      )
        throw new Error("Correction rewrote suspended teaching");
      continue;
    }
    if (
      nextContext.kind === "delivering" &&
      nextContext.resume.delivery.kind === "repeat"
    ) {
      const target =
        next.occurrenceId === null
          ? null
          : occurrence({ state, id: next.occurrenceId });
      if (
        previousContext.kind !== "delivering" ||
        !target ||
        nodeFor({ graph, currentOccurrence: target }).id !==
          nodeFor({ graph, currentOccurrence: current }).id ||
        target.obligation !== "practice" ||
        !same({ a: nextContext.resume.flow, b: previousContext.resume.flow }) ||
        nextContext.resume.delivery.returnCheckpointId !==
          (previousContext.resume.delivery.kind === "repeat"
            ? previousContext.resume.delivery.returnCheckpointId
            : previous.id)
      )
        throw new Error("Practice redirected its return");
      continue;
    }
    const introduced = separatePracticeEdge({
      content,
      graph,
      state,
      previous,
      next,
    });
    if (introduced && introductions.get(introduced.id) === i) continue;
    if (!accepted.has(current.id))
      throw new Error("Control checkpoint skipped an unaccepted turn");
    if (previousContext.kind === "selection") {
      const reviewQueue = required(
          state.queues.find((q) => q.selectionOccurrenceId === current.id),
        ),
        first = reviewQueue.items[0];
      if (first) {
        const currentOccurrence = occurrence({
          state,
          id: required(first.routeOccurrences[0]),
        });
        if (
          same({
            a: next,
            b: {
              id: next.id,
              occurrenceId: currentOccurrence.id,
              context: expectedContext({
                currentOccurrence,
                flow: {
                  kind: "review",
                  queueId: reviewQueue.id,
                  index: 0,
                },
              }),
            } satisfies ControlCheckpoint,
          })
        )
          continue;
      } else if (accepted.has(reviewQueue.exitOccurrenceId)) {
        const exit = required(graph.nodes.get(reviewQueue.exitNodeId));
        if (exit.kind !== "reviewExit") throw new Error("Review exit changed");
        if (
          exit.next.kind === "end" &&
          same({
            a: next,
            b: {
              id: next.id,
              occurrenceId: null,
              context: { kind: "terminal" },
            } satisfies ControlCheckpoint,
          })
        )
          continue;
        if (exit.next.kind === "node") {
          const currentOccurrence = normalOccurrence({
            state,
            id: exit.next.nodeId,
          });
          if (
            same({
              a: next,
              b: {
                id: next.id,
                occurrenceId: currentOccurrence.id,
                context: expectedContext({
                  currentOccurrence,
                  flow: normalFlow,
                }),
              } satisfies ControlCheckpoint,
            })
          )
            continue;
        }
      }
    } else if (previousContext.kind === "delivering") {
      if (following({ next, owed: current, resume: previousContext.resume }))
        continue;
    } else if (previousContext.kind === "correction") {
      if (
        nextContext.kind === "correction" &&
        nextContext.correctionId === previousContext.correctionId &&
        nextContext.owedOccurrenceId === previousContext.owedOccurrenceId &&
        nextContext.triggerOccurrenceId ===
          previousContext.triggerOccurrenceId &&
        same({ a: nextContext.suspended, b: previousContext.suspended }) &&
        accepted.has(current.id)
      ) {
        const a = previousContext.phase,
          b = nextContext.phase;
        const route = correctionRoute({ graph, context: previousContext });
        const nextRoute = correctionRoute({ graph, context: nextContext });
        const inactiveUnchanged =
          a.kind === "instruction"
            ? same({
                a: previousContext.retestOccurrenceIds,
                b: nextContext.retestOccurrenceIds,
              })
            : same({
                a: previousContext.instructionOccurrenceIds,
                b: nextContext.instructionOccurrenceIds,
              });
        if (inactiveUnchanged && a.kind === b.kind) {
          const gateId = route.occurrenceIds[a.index + 1];
          if (
            same({ a: route.occurrenceIds, b: nextRoute.occurrenceIds }) &&
            b.index === a.index + (route.gate ? 2 : 1) &&
            (!route.gate || accepted.has(required(gateId)))
          )
            continue;
          if (route.gate) {
            const cycleNodes = required(
                graph.cycleRoutes.get(route.gate.policyId),
              ),
              start = a.index - cycleNodes.length + 1;
            const cycleBinding = state.cycles.find(
              (c) =>
                c.gateOccurrenceId === gateId &&
                same({
                  a: c.turnOccurrenceIds,
                  b: nextRoute.occurrenceIds.slice(
                    start,
                    start + cycleNodes.length,
                  ),
                }),
            );
            if (
              cycleBinding &&
              b.index === start &&
              same({
                a: route.occurrenceIds.slice(0, start),
                b: nextRoute.occurrenceIds.slice(0, start),
              }) &&
              same({
                a: route.occurrenceIds.slice(a.index + 1),
                b: nextRoute.occurrenceIds.slice(a.index + 1),
              })
            )
              continue;
          }
        }
        const endIndex = a.index + (route.gate ? 2 : 1);
        if (
          a.kind === "instruction" &&
          b.kind === "retest" &&
          b.index === 0 &&
          endIndex === route.occurrenceIds.length &&
          (!route.gate ||
            accepted.has(required(route.occurrenceIds[a.index + 1]))) &&
          same({
            a: previousContext.instructionOccurrenceIds,
            b: nextContext.instructionOccurrenceIds,
          }) &&
          same({
            a: previousContext.retestOccurrenceIds,
            b: nextContext.retestOccurrenceIds,
          })
        )
          continue;
      }
      if (previousContext.phase.kind === "retest") {
        const route = correctionRoute({ graph, context: previousContext });
        const finished =
          route.index + (route.gate ? 2 : 1) === route.occurrenceIds.length &&
          (!route.gate ||
            accepted.has(required(route.occurrenceIds[route.index + 1])));
        if (
          finished &&
          following({
            next,
            owed: occurrence({ state, id: previousContext.owedOccurrenceId }),
            resume: previousContext.suspended,
          })
        )
          continue;
      }
    }
    throw new Error("Control checkpoint does not follow its authored route");
  }
}
function initialControlCheckpoint({
  graph,
  occurrences,
  cycles,
}: {
  graph: CompiledControlTask;
  occurrences: ControlTeachingState["occurrences"];
  cycles: ControlTeachingState["cycles"];
}): ControlCheckpoint {
  const currentOccurrence = required(occurrences[0]),
    node = nodeFor({ graph, currentOccurrence }),
    cycleBinding = cycles.find(
      (c) => c.turnOccurrenceIds[0] === currentOccurrence.id,
    );
  if (node.kind !== "turn" && node.kind !== "selectiveReview")
    throw new Error("Task must start with source turn or selection");
  return {
    id: parseId({ kind: "checkpoint", value: "checkpoint-1" }),
    occurrenceId: currentOccurrence.id,
    context:
      node.kind === "selectiveReview"
        ? { kind: "selection", reviewId: node.reviewId }
        : {
            kind: "delivering",
            resume: {
              flow: normalFlow,
              delivery: cycleBinding
                ? { kind: "cycle", cycleId: cycleBinding.id }
                : sourceDelivery,
            },
          },
  };
}

export function controlCompletionProof({
  content,
  state,
}: {
  content: RuntimePackage;
  state: ControlTeachingState;
}): CompletionProof | null {
  const graph = controlTask({ content, taskId: state.taskId });
  const requiredIds = graph.normalNodeIds.map(
    (id) => normalOccurrence({ state, id }).id,
  );
  for (const review of graph.reviews) {
    const reviewQueue = state.queues.find(
      (q) =>
        q.reviewId === review.reviewId &&
        q.selectionOccurrenceId ===
          normalOccurrence({ state, id: review.id }).id,
    );
    if (!reviewQueue) return null;
    for (const item of reviewQueue.items)
      requiredIds.push(...item.routeOccurrences, item.confirmationOccurrenceId);
  }
  if (requiredIds.some((id) => !state.acceptedOccurrenceIds.includes(id)))
    return null;
  return {
    taskId: state.taskId,
    packageHash: content.packageHash,
    requiredOccurrenceIds: requiredIds,
    sourceRefs: [
      ...new Set(
        graph.task.nodes
          .filter((n) => graph.normalNodeIds.includes(n.id))
          .flatMap((n) => n.sourceRefs),
      ),
    ],
  };
}
export function evaluateControls({
  content,
  state,
  status,
  action: requestedAction,
}: {
  content: RuntimePackage;
  state: ControlTeachingState;
  status: "inProgress" | "completed";
  action: GraphAction;
}): TransitionPlan {
  validateControlPosition({ content, state });
  if (
    (status === "completed") !==
    (controlCompletionProof({ content, state }) !== null)
  )
    throw new Error("Control run status does not match obligations");
  const graph = controlTask({ content, taskId: state.taskId }),
    checkpoint = controlCheckpoint(state);
  const writing = writingTask({ content, taskId: state.taskId });
  if (requestedAction.kind === "skipWriting") {
    if (!writing || status !== "inProgress" || checkpoint.occurrenceId === null)
      throw new Error("Skip requires optional writing");
    return {
      kind: "skip",
      after: {
        version: 1,
        kind: "writingSkipped",
        viewCheckpoint: null,
        taskId: state.taskId,
        last: state,
      },
      occurrenceId: checkpoint.occurrenceId,
      skip: {
        taskId: state.taskId,
        packageHash: content.packageHash,
        outcome: "skipped",
        sourceRefs: [...new Set(writing.nodes.flatMap((n) => n.sourceRefs))],
      },
    };
  }
  let action: Exclude<GraphAction, import("./types.ts").WritingAction>;
  if (
    requestedAction.kind === "confirmTracing" ||
    requestedAction.kind === "confirmIndependent"
  ) {
    const occurrence = state.occurrences.find(
      (o) => o.id === checkpoint.occurrenceId,
    );
    const node =
      occurrence?.target.kind === "node"
        ? graph.nodes.get(occurrence.target.nodeId)
        : undefined;
    if (
      !writing ||
      node?.kind !== "turn" ||
      node.presentation.kind !== "writing" ||
      node.id !== requestedAction.nodeId ||
      node.presentation.targetId !== requestedAction.targetId ||
      node.presentation.obligation.kind !== "phaseConfirmation" ||
      node.presentation.obligation.phase !== requestedAction.phase ||
      (requestedAction.kind === "confirmTracing") !==
        (requestedAction.phase === "childTracing") ||
      (checkpoint.occurrenceId !== null &&
        state.acceptedOccurrenceIds.includes(checkpoint.occurrenceId))
    )
      throw new Error("Exact writing phase confirmation unavailable");
    action = { kind: "continue" };
  } else {
    action = requestedAction;
    if (
      action.kind === "continue" &&
      checkpoint.occurrenceId !== null &&
      !state.acceptedOccurrenceIds.includes(checkpoint.occurrenceId)
    ) {
      const occurrence = state.occurrences.find(
        (o) => o.id === checkpoint.occurrenceId,
      );
      const node =
        occurrence?.target.kind === "node"
          ? graph.nodes.get(occurrence.target.nodeId)
          : undefined;
      if (
        node?.kind === "turn" &&
        node.presentation.kind === "writing" &&
        node.presentation.obligation.kind === "phaseConfirmation"
      )
        throw new Error("Explicit writing phase confirmation required");
    }
  }
  if (action.kind === "pause") return { kind: "pause", after: state };
  if (action.kind === "back") {
    if (state.checkpointIndex === 0) throw new Error("Back unavailable");
    return {
      kind: "navigation",
      after: { ...state, checkpointIndex: state.checkpointIndex - 1 },
    };
  }
  if (checkpoint.occurrenceId === null)
    throw new Error("Response action unavailable");
  const readiness = readinessAt({ content, graph, state, checkpoint });
  if (readiness && state.checkpointIndex < state.checkpoints.length - 1) {
    if (action.kind !== "continue")
      throw new Error("Saved readiness context only forwards with Continue");
    return {
      kind: "navigation",
      after: { ...state, checkpointIndex: state.checkpointIndex + 1 },
    };
  }
  if (readiness && action.kind !== "continue" && action.kind !== "parentReady")
    throw new Error("Readiness decision unavailable");
  const current = occurrence({
      state,
      id: checkpoint.occurrenceId,
    }),
    node = nodeFor({ graph, currentOccurrence: current });
  if (
    action.kind === "continue" ||
    action.kind === "parentReady" ||
    action.kind === "confirmReviewItem" ||
    action.kind === "commitReviewSelection"
  ) {
    if (
      state.acceptedOccurrenceIds.includes(current.id) &&
      state.checkpointIndex < state.checkpoints.length - 1
    ) {
      if (action.kind !== "continue")
        throw new Error("Saved context reconfirms with Continue");
      return {
        kind: "navigation",
        after: { ...state, checkpointIndex: state.checkpointIndex + 1 },
      };
    }
  }
  if (status === "completed")
    throw new Error("Completed task is saved-context review only");
  if (
    action.kind === "repeat" &&
    node.kind === "turn" &&
    node.presentation.kind === "writing" &&
    node.presentation.obligation.kind === "phaseConfirmation"
  )
    throw new Error("Writing phase practice remains open until confirmation");
  if (action.kind === "repeat" && checkpoint.context.kind === "correction")
    return evaluateControls({
      content,
      state,
      status,
      action: { kind: "help", correctionId: checkpoint.context.correctionId },
    });
  let occurrences = [...state.occurrences],
    accepted = [...state.acceptedOccurrenceIds],
    cycles = [...state.cycles],
    outcomes = [...state.cycleOutcomes],
    queues = [...state.queues],
    nextOccurrenceNumber = state.nextOccurrenceNumber;
  let primary: OccurrenceId | null = null;
  const nextCheckpointId = parseId({
    kind: "checkpoint",
    value: `checkpoint-${state.nextCheckpointNumber}`,
  });
  const allocate = ({
    target,
    obligation,
  }: {
    target: ControlOccurrence["target"];
    obligation: ControlOccurrence["obligation"];
  }): ControlOccurrence => {
    if (occurrences.length >= 9999) throw new Error("Occurrence bound reached");
    const currentOccurrence = {
      id: parseId({
        kind: "occurrence",
        value: `occurrence-${nextOccurrenceNumber}`,
      }),
      target,
      obligation,
    };
    nextOccurrenceNumber = increment(nextOccurrenceNumber);
    occurrences.push(currentOccurrence);
    return currentOccurrence;
  };
  const allocNode = ({
    id,
    kind,
  }: {
    id: NodeId;
    kind: ControlOccurrence["obligation"];
  }) => allocate({ target: { kind: "node", nodeId: id }, obligation: kind });
  const accept = (id: OccurrenceId) => {
    if (!accepted.includes(id)) accepted.push(id);
  };
  const byId = (id: OccurrenceId) =>
    required(occurrences.find((o) => o.id === id));
  const bound = ({
    id,
    flow,
  }: {
    id: NodeId;
    flow: ControlFlow;
  }): ControlOccurrence => {
    if (flow.kind === "normal") return normalOccurrence({ state, id });
    const item = required(queue({ state, id: flow.queueId }).items[flow.index]);
    return required(
      item.routeOccurrences
        .map(byId)
        .find((o) => o.target.kind === "node" && o.target.nodeId === id),
    );
  };
  const enter = ({
    currentOccurrence,
    resume,
  }: {
    currentOccurrence: ControlOccurrence;
    resume: ControlResume;
  }): ControlCheckpoint => {
    const node = nodeFor({ graph, currentOccurrence });
    if (node.kind === "selectiveReview") {
      return {
        id: nextCheckpointId,
        occurrenceId: currentOccurrence.id,
        context: { kind: "selection", reviewId: node.reviewId },
      };
    }
    if (node.kind !== "turn")
      throw new Error("Cannot present implicit control");
    const cycleBinding = cycles.find(
      (c) => c.turnOccurrenceIds[0] === currentOccurrence.id,
    );
    return {
      id: nextCheckpointId,
      occurrenceId: currentOccurrence.id,
      context: {
        kind: "delivering",
        resume: {
          ...resume,
          delivery: cycleBinding
            ? { kind: "cycle", cycleId: cycleBinding.id }
            : resume.delivery,
        },
      },
    };
  };
  const terminalAfter = ({
    id,
    flow,
  }: {
    id: NodeId;
    flow: ControlFlow;
  }): ControlCheckpoint => {
    const node = required(graph.nodes.get(id));
    if (node.kind === "selectiveReview")
      throw new Error("Selection requires explicit choice");
    if (node.next.kind === "end") {
      return {
        id: nextCheckpointId,
        occurrenceId: null,
        context: { kind: "terminal" },
      };
    }
    return enter({
      currentOccurrence: bound({ id: node.next.nodeId, flow }),
      resume: { flow, delivery: sourceDelivery },
    });
  };
  const confirm = (
    flow: Extract<ControlFlow, { kind: "review" }>,
  ): ControlCheckpoint => {
    const reviewQueue = queue({ state, id: flow.queueId }),
      item = required(reviewQueue.items[flow.index]);
    if (item.routeOccurrences.some((id) => !accepted.includes(id)))
      throw new Error("Review item has unfinished responses");
    accept(item.confirmationOccurrenceId);
    const next = reviewQueue.items[flow.index + 1];
    if (next) {
      return enter({
        currentOccurrence: byId(required(next.routeOccurrences[0])),
        resume: {
          flow: { ...flow, index: flow.index + 1 },
          delivery: sourceDelivery,
        },
      });
    }
    accept(reviewQueue.exitOccurrenceId);
    return terminalAfter({ id: reviewQueue.exitNodeId, flow: normalFlow });
  };
  const proceed = ({
    owed,
    resume,
    supported,
  }: {
    owed: ControlOccurrence;
    resume: ControlResume;
    supported: boolean;
  }): ControlCheckpoint => {
    const node = nodeFor({ graph, currentOccurrence: owed });
    if (node.kind !== "turn") throw new Error("Expected oral source turn");
    const flow = resume.flow,
      delivery = resume.delivery;
    if (delivery.kind === "repeat") {
      const returnTo = required(
        state.checkpoints.find((c) => c.id === delivery.returnCheckpointId),
      );
      return { ...returnTo, id: nextCheckpointId };
    }
    const policy = policyAfter({ graph, node });
    if (policy) {
      if (delivery.kind !== "cycle")
        throw new Error("Readiness turn has no cycle");
      const cycleBinding = required(
        cycles.find((c) => c.id === delivery.cycleId),
      );
      if (cycleBinding.turnOccurrenceIds.some((id) => !accepted.includes(id)))
        throw new Error("Cycle has unfinished turns");
      if (!outcomes.some((o) => o.cycleId === cycleBinding.id))
        outcomes.push({
          cycleId: cycleBinding.id,
          kind:
            supported ||
            cycleBinding.turnOccurrenceIds.some((id) => {
              const turn = nodeFor({ graph, currentOccurrence: byId(id) });
              return turn.kind === "turn" && turn.parentRole === "together";
            })
              ? "supported"
              : "independent",
        });
      if (separatePolicy(content, graph)?.id === policy.id) {
        if (action.kind !== "continue")
          throw new Error("Accept the final response before readiness");
        return {
          id: nextCheckpointId,
          occurrenceId: cycleBinding.gateOccurrenceId,
          context: { kind: "delivering", resume },
        };
      }
      if (action.kind === "parentReady") {
        if (action.policyId !== policy.policyId)
          throw new Error("Wrong readiness policy");
        accept(cycleBinding.gateOccurrenceId);
        if (flow.kind === "review") {
          const item = required(
            queue({ state, id: flow.queueId }).items[flow.index],
          );
          if (item.routeOccurrences.at(-1) === cycleBinding.gateOccurrenceId) {
            return confirm(flow);
          }
        }
        return terminalAfter({ id: policy.id, flow });
      }
      if (action.kind !== "continue")
        throw new Error("Readiness needs explicit decision");
      const turns = required(graph.cycleRoutes.get(policy.policyId)).map((id) =>
        allocNode({ id, kind: "practice" }),
      );
      const first = required(turns[0]);
      const nextCycle = {
        id: parseId({ kind: "cycle", value: `cycle-${first.id}` }),
        policyId: policy.policyId,
        gateOccurrenceId: cycleBinding.gateOccurrenceId,
        turnOccurrenceIds: turns.map((o) => o.id),
      };
      cycles.push(nextCycle);
      return enter({
        currentOccurrence: first,
        resume: {
          flow,
          delivery: { kind: "cycle", cycleId: nextCycle.id },
        },
      });
    }
    if (action.kind === "parentReady")
      throw new Error("Readiness unavailable here");
    if (delivery.kind === "cycle") {
      if (action.kind !== "continue")
        throw new Error("Response action unavailable");
      return enter({
        currentOccurrence: byId(
          cycleSuccessor({ cycles, delivery, owed: owed.id }),
        ),
        resume,
      });
    }
    if (flow.kind === "review") {
      const reviewQueue = queue({ state, id: flow.queueId }),
        item = required(reviewQueue.items[flow.index]);
      if (item.routeOccurrences.at(-1) === owed.id) {
        if (
          action.kind !== "confirmReviewItem" ||
          action.queueId !== reviewQueue.id ||
          action.itemId !== item.itemId
        )
          throw new Error("Explicit review confirmation required");
        return confirm(flow);
      }
      if (action.kind !== "continue")
        throw new Error("Item confirmation unavailable before route exit");
      const i = item.routeOccurrences.indexOf(owed.id),
        next = required(item.routeOccurrences[i + 1]);
      return enter({ currentOccurrence: byId(next), resume });
    }
    if (action.kind !== "continue")
      throw new Error("Response action unavailable");
    if (node.next.kind === "end") {
      return {
        id: nextCheckpointId,
        occurrenceId: null,
        context: { kind: "terminal" },
      };
    }
    return enter({
      currentOccurrence: bound({ id: node.next.nodeId, flow }),
      resume: { flow, delivery: sourceDelivery },
    });
  };
  const nextCheckpoint: ControlCheckpoint = ((): ControlCheckpoint => {
    if (action.kind === "help") {
      const previousContext = checkpoint.context;
      if (
        previousContext.kind !== "delivering" &&
        previousContext.kind !== "correction"
      )
        throw new Error("Help unavailable");
      const owed =
          previousContext.kind === "correction"
            ? byId(previousContext.owedOccurrenceId)
            : current,
        original = nodeFor({ graph, currentOccurrence: owed });
      const correctionSpec = required(
        graph.task.corrections.find(
          (c) =>
            c.id === action.correctionId &&
            c.eligibleNodeIds.includes(original.id) &&
            (c.scope === "any" ||
              c.scope ===
                (previousContext.kind === "correction"
                  ? previousContext.suspended.flow.kind
                  : previousContext.resume.flow.kind)),
        ),
      );
      const instructionOccurrenceIds = correctionSpec.instructionNodeIds.map(
          (id) => allocNode({ id, kind: "support" }).id,
        ),
        retestOccurrenceIds = correctionSpec.retestNodeIds.map(
          (id) => allocNode({ id, kind: "support" }).id,
        );
      cycles.push(
        ...initialCycles({
          graph,
          occurrences: instructionOccurrenceIds.map(byId),
        }),
        ...initialCycles({ graph, occurrences: retestOccurrenceIds.map(byId) }),
      );
      return {
        id: nextCheckpointId,
        occurrenceId: byId(required(instructionOccurrenceIds[0])).id,
        context: {
          kind: "correction",
          correctionId: correctionSpec.id,
          triggerOccurrenceId: owed.id,
          owedOccurrenceId: owed.id,
          suspended:
            previousContext.kind === "correction"
              ? previousContext.suspended
              : previousContext.resume,
          instructionOccurrenceIds,
          retestOccurrenceIds,
          phase: { kind: "instruction", index: 0 },
        },
      };
    } else if (action.kind === "repeat") {
      if (node.kind !== "turn") throw new Error("Repeat unavailable");
      if (checkpoint.context.kind === "correction") {
        return { ...checkpoint, id: nextCheckpointId };
      } else if (checkpoint.context.kind === "delivering") {
        const target = allocNode({ id: node.id, kind: "practice" });
        return {
          id: nextCheckpointId,
          occurrenceId: target.id,
          context: {
            kind: "delivering",
            resume: {
              flow: checkpoint.context.resume.flow,
              delivery:
                checkpoint.context.resume.delivery.kind === "repeat"
                  ? checkpoint.context.resume.delivery
                  : { kind: "repeat", returnCheckpointId: checkpoint.id },
            },
          },
        };
      } else throw new Error("Repeat unavailable");
    } else if (action.kind === "commitReviewSelection") {
      if (
        node.kind !== "selectiveReview" ||
        checkpoint.context.kind !== "selection" ||
        node.reviewId !== action.reviewId ||
        queues.some((q) => q.selectionOccurrenceId === current.id)
      )
        throw new Error("Review selection unavailable");
      const selected = canonicalReviewChoice({
        items: node.items,
        choice: action.choice,
      });
      if (canonical(selected) !== canonical(action.choice))
        throw new Error("Review choice must be source ordered");
      primary = current.id;
      accept(current.id);
      const queueId = parseId({ kind: "queue", value: `queue-${current.id}` });
      const items = (selected.kind === "none" ? [] : selected.itemIds).map(
        (itemId) => {
          const route = required(graph.itemRoutes.get(itemId)).map((id) =>
            allocNode({ id, kind: "required" }),
          );
          const confirmation = allocate({
            target: { kind: "reviewConfirmation", queueId, itemId },
            obligation: "required",
          });
          const extra = initialCycles({ graph, occurrences: route }).filter(
            (c) => route.some((o) => o.id === c.gateOccurrenceId),
          );
          cycles.push(...extra);
          return {
            itemId,
            routeOccurrences: route.map((o) => o.id),
            confirmationOccurrenceId: confirmation.id,
          };
        },
      );
      const reviewQueue: ReviewQueue = {
        id: queueId,
        reviewId: node.reviewId,
        selectionOccurrenceId: current.id,
        choice: selected,
        items,
        returnNodeId: node.returnNodeId,
        exitNodeId: node.exitNodeId,
        exitOccurrenceId: normalOccurrence({ state, id: node.exitNodeId }).id,
      };
      queues.push(reviewQueue);
      const first = items[0];
      if (first) {
        return enter({
          currentOccurrence: byId(required(first.routeOccurrences[0])),
          resume: {
            flow: { kind: "review", queueId, index: 0 },
            delivery: sourceDelivery,
          },
        });
      }
      accept(reviewQueue.exitOccurrenceId);
      return terminalAfter({ id: reviewQueue.exitNodeId, flow: normalFlow });
    } else if (
      action.kind === "continue" ||
      action.kind === "parentReady" ||
      action.kind === "confirmReviewItem"
    ) {
      if (
        checkpoint.context.kind !== "delivering" &&
        checkpoint.context.kind !== "correction"
      )
        throw new Error("Response unavailable");
      if (readiness) {
        if (action.kind === "parentReady") {
          if (action.policyId !== readiness.policy.policyId)
            throw new Error("Wrong readiness policy");
          primary = current.id;
          accept(current.id);
          return terminalAfter({ id: readiness.policy.id, flow: normalFlow });
        }
        if (action.kind !== "continue")
          throw new Error("Readiness decision unavailable");
        const turns = required(
          graph.cycleRoutes.get(readiness.policy.policyId),
        ).map((id) => allocNode({ id, kind: "practice" }));
        const first = required(turns[0]);
        const nextCycle = {
          id: parseId({ kind: "cycle", value: `cycle-${first.id}` }),
          policyId: readiness.policy.policyId,
          gateOccurrenceId: readiness.cycle.gateOccurrenceId,
          turnOccurrenceIds: turns.map((o) => o.id),
        };
        cycles.push(nextCycle);
        return enter({
          currentOccurrence: first,
          resume: {
            flow: normalFlow,
            delivery: { kind: "cycle", cycleId: nextCycle.id },
          },
        });
      }
      primary = current.id;
      accept(current.id);
      if (checkpoint.context.kind === "delivering")
        return proceed({
          owed: current,
          resume: checkpoint.context.resume,
          supported: false,
        });
      else {
        const correctionContext = checkpoint.context;
        const route = correctionRoute({ graph, context: correctionContext });
        const advanceRoute = ({
          index,
        }: {
          index: number;
        }): ControlCheckpoint => {
          const next = route.occurrenceIds[index];
          if (next)
            return {
              id: nextCheckpointId,
              occurrenceId: next,
              context: {
                ...correctionContext,
                phase: { kind: correctionContext.phase.kind, index },
              },
            };
          if (correctionContext.phase.kind === "instruction")
            return {
              id: nextCheckpointId,
              occurrenceId: required(correctionContext.retestOccurrenceIds[0]),
              context: {
                ...correctionContext,
                phase: { kind: "retest", index: 0 },
              },
            };
          const owed = byId(correctionContext.owedOccurrenceId);
          accept(owed.id);
          return proceed({
            owed,
            resume: correctionContext.suspended,
            supported: true,
          });
        };
        if (route.gate) {
          const gate = route.gate,
            nextId = required(route.occurrenceIds[route.index + 1]);
          const binding = required(
            cycles.find(
              (c) =>
                c.gateOccurrenceId === nextId &&
                c.turnOccurrenceIds.includes(current.id),
            ),
          );
          if (binding.turnOccurrenceIds.some((id) => !accepted.includes(id)))
            throw new Error("Support cycle unfinished");
          if (!outcomes.some((o) => o.cycleId === binding.id))
            outcomes.push({ cycleId: binding.id, kind: "supported" });
          if (action.kind === "parentReady") {
            if (action.policyId !== gate.policyId)
              throw new Error("Wrong support readiness");
            accept(nextId);
            return advanceRoute({ index: route.index + 2 });
          }
          if (action.kind !== "continue")
            throw new Error("Support cycle needs explicit readiness");
          const cycleNodes = required(graph.cycleRoutes.get(gate.policyId));
          const fresh = cycleNodes.map((id) =>
            allocNode({ id, kind: "support" }),
          );
          const first = required(fresh[0]),
            freshIds = fresh.map((o) => o.id);
          cycles.push({
            id: parseId({ kind: "cycle", value: `cycle-${first.id}` }),
            policyId: gate.policyId,
            gateOccurrenceId: nextId,
            turnOccurrenceIds: freshIds,
          });
          const start = route.index - cycleNodes.length + 1,
            occurrenceIds = [...route.occurrenceIds];
          occurrenceIds.splice(start, cycleNodes.length, ...freshIds);
          return {
            id: nextCheckpointId,
            occurrenceId: first.id,
            context: {
              ...correctionBindings({
                context: correctionContext,
                occurrenceIds,
              }),
              phase: { kind: correctionContext.phase.kind, index: start },
            },
          };
        }
        if (
          (correctionContext.phase.kind === "instruction" ||
            route.index + 1 < route.occurrenceIds.length) &&
          action.kind !== "continue"
        )
          throw new Error("Decision unavailable before correction route exit");
        return advanceRoute({ index: route.index + 1 });
      }
    } else {
      const _exhaustive: never = action.kind;
      return _exhaustive;
    }
  })();
  const checkpoints = state.checkpoints.slice(0, state.checkpointIndex + 1);
  if (checkpoints.length >= 9999) throw new Error("Checkpoint bound reached");
  checkpoints.push(nextCheckpoint);
  const after: ControlTeachingState = {
    ...state,
    occurrences,
    acceptedOccurrenceIds: accepted,
    cycles,
    cycleOutcomes: outcomes,
    queues,
    checkpoints,
    checkpointIndex: checkpoints.length - 1,
    nextOccurrenceNumber,
    nextCheckpointNumber: increment(state.nextCheckpointNumber),
  };
  validateControlPosition({ content, state: after });
  if (primary === null) return deepFreeze({ kind: "navigation", after });
  const completion = controlCompletionProof({ content, state: after });
  return deepFreeze(
    completion
      ? { kind: "completion", after, occurrenceId: primary, completion }
      : { kind: "acceptance", after, occurrenceId: primary },
  );
}
export function projectControls({
  content,
  state,
}: {
  content: RuntimePackage;
  state: ControlTeachingState;
}): EngineProjection {
  const graph = controlTask({ content, taskId: state.taskId }),
    checkpoint = controlCheckpoint(state);
  if (checkpoint.occurrenceId === null) return { kind: "completed" };
  const currentOccurrence = occurrence({ state, id: checkpoint.occurrenceId }),
    node = nodeFor({ graph, currentOccurrence });
  if (node.kind === "selectiveReview") {
    const items = node.items.map((i) => ({
      itemId: i.itemId,
      label: i.parentLabel,
    }));
    return {
      kind: "reviewSelection",
      reviewId: node.reviewId,
      items,
      selectionAction: {
        kind: "reviewSelection",
        reviewId: node.reviewId,
        eligibleItems: items,
        selectLabel: { kind: "added", text: "Review" },
        emptyLabel: { kind: "added", text: "No review" },
      },
      presentation: { kind: "oral" },
      guidance: node.guidance,
      committedChoice:
        state.queues.find(
          (q) => q.selectionOccurrenceId === currentOccurrence.id,
        )?.choice ?? null,
    };
  }
  const readiness = readinessAt({ content, graph, state, checkpoint });
  if (readiness)
    return {
      kind: "readiness",
      nodeId: readiness.policy.id,
      policyId: readiness.policy.policyId,
      cycleId: readiness.cycle.id,
      occurrenceId: currentOccurrence.id,
      guidance: readiness.policy.guidance,
    };
  if (
    node.kind !== "turn" ||
    (checkpoint.context.kind !== "delivering" &&
      checkpoint.context.kind !== "correction")
  )
    throw new Error("Control presentation unavailable");
  const gate =
    checkpoint.context.kind === "correction"
      ? correctionRoute({ graph, context: checkpoint.context }).gate
      : checkpoint.context.resume.delivery.kind !== "repeat"
        ? policyAfter({ graph, node })
        : undefined;
  return {
    kind: "teaching",
    turn: {
      ...node,
      guidance:
        gate && separatePolicy(content, graph)?.id !== gate.id
          ? [...node.guidance, ...gate.guidance]
          : node.guidance,
      extraPractice: currentOccurrence.obligation !== "required",
      routeKind: checkpoint.context.kind,
      occurrenceId: currentOccurrence.id,
      checkpointId: checkpoint.id,
    },
  };
}
export function controlActions({
  content,
  state,
  status,
}: {
  content: RuntimePackage;
  state: ControlTeachingState;
  status: "inProgress" | "completed";
}): AvailableAction[] {
  const graph = controlTask({ content, taskId: state.taskId }),
    checkpoint = controlCheckpoint(state),
    actions: AvailableAction[] = [];
  const add = ({
    text,
    intent,
  }: {
    text: string;
    intent: Exclude<GraphAction, { kind: "help" }>;
  }) => actions.push({ label: { kind: "added", text }, intent });
  if (state.checkpointIndex > 0)
    add({ text: "Back", intent: { kind: "back" } });
  if (checkpoint.occurrenceId === null) return actions;
  const currentOccurrence = occurrence({ state, id: checkpoint.occurrenceId }),
    node = nodeFor({ graph, currentOccurrence });
  const readiness = readinessAt({ content, graph, state, checkpoint });
  if (readiness) {
    if (state.checkpointIndex < state.checkpoints.length - 1)
      add({ text: "Continue", intent: { kind: "continue" } });
    else if (status === "inProgress") {
      add({ text: "Practice again", intent: { kind: "continue" } });
      add({
        text: "Ready",
        intent: { kind: "parentReady", policyId: readiness.policy.policyId },
      });
    }
    if (status === "inProgress")
      add({ text: "Pause", intent: { kind: "pause" } });
    return actions;
  }
  if (
    state.acceptedOccurrenceIds.includes(currentOccurrence.id) &&
    state.checkpointIndex < state.checkpoints.length - 1
  ) {
    add({ text: "Continue", intent: { kind: "continue" } });
    if (status === "completed") return actions;
  } else if (status === "completed") return actions;
  else if (node.kind === "turn") {
    const context = checkpoint.context;
    const activeRoute =
      context.kind === "correction"
        ? correctionRoute({ graph, context })
        : undefined;
    const resolves =
      context.kind !== "correction" ||
      (context.phase.kind === "retest" &&
        activeRoute !== undefined &&
        activeRoute.index === activeRoute.nodeIds.length - 1);
    const owed =
      context.kind === "correction"
        ? occurrence({ state, id: context.owedOccurrenceId })
        : currentOccurrence;
    const source = nodeFor({ graph, currentOccurrence: owed }),
      resume =
        context.kind === "correction"
          ? context.suspended
          : context.kind === "delivering"
            ? context.resume
            : undefined;
    const supportGate = activeRoute?.gate;
    const policy =
      supportGate ??
      (resolves && resume?.delivery.kind !== "repeat"
        ? policyAfter({ graph, node: source })
        : undefined);
    if (policy && separatePolicy(content, graph)?.id !== policy.id) {
      add({ text: "Practice again", intent: { kind: "continue" } });
      add({
        text: "Ready",
        intent: { kind: "parentReady", policyId: policy.policyId },
      });
    } else if (
      resolves &&
      resume?.flow.kind === "review" &&
      resume.delivery.kind !== "repeat"
    ) {
      const reviewQueue = queue({ state, id: resume.flow.queueId }),
        item = required(reviewQueue.items[resume.flow.index]);
      if (item.routeOccurrences.at(-1) === owed.id)
        add({
          text: "Next word",
          intent: {
            kind: "confirmReviewItem",
            queueId: reviewQueue.id,
            itemId: item.itemId,
          },
        });
      else add({ text: "Continue", intent: { kind: "continue" } });
    } else if (
      node.presentation.kind === "writing" &&
      node.presentation.obligation.kind === "phaseConfirmation"
    ) {
      const phase = node.presentation.obligation.phase;
      if (phase === "childTracing")
        add({
          text: "Confirm tracing",
          intent: {
            kind: "confirmTracing",
            targetId: node.presentation.targetId,
            nodeId: node.id,
            phase,
          },
        });
      else
        add({
          text: "Confirm independent writing",
          intent: {
            kind: "confirmIndependent",
            targetId: node.presentation.targetId,
            nodeId: node.id,
            phase,
          },
        });
    } else add({ text: "Continue", intent: { kind: "continue" } });
  }
  if (status === "inProgress") {
    if (node.kind === "turn") {
      if (
        node.presentation.kind !== "writing" ||
        node.presentation.obligation.kind !== "phaseConfirmation"
      )
        add({ text: "Repeat", intent: { kind: "repeat" } });
      const original =
        checkpoint.context.kind === "correction"
          ? nodeFor({
              graph,
              currentOccurrence: occurrence({
                state,
                id: checkpoint.context.owedOccurrenceId,
              }),
            })
          : node;
      for (const correction of graph.task.corrections)
        if (
          correction.eligibleNodeIds.includes(original.id) &&
          (correction.scope === "any" ||
            correction.scope ===
              (checkpoint.context.kind === "correction"
                ? checkpoint.context.suspended.flow.kind
                : checkpoint.context.kind === "delivering"
                  ? checkpoint.context.resume.flow.kind
                  : "normal"))
        ) {
          const preview = required(
            graph.nodes.get(required(correction.instructionNodeIds[0])),
          );
          if (preview.kind !== "turn")
            throw new Error("Correction preview is not a turn");
          actions.push({
            label: correction.label,
            intent: { kind: "help", correctionId: correction.id },
            correctionPreview: preview,
          });
        }
    }
    if (writingTask({ content, taskId: state.taskId }))
      add({ text: "Skip writing", intent: { kind: "skipWriting" } });
    add({ text: "Pause", intent: { kind: "pause" } });
  }
  return actions;
}
