import { resolvedLessons } from "./course-content.ts";
import type { RuntimePackage } from "./course-content.ts";
import { writingTask } from "./writing.ts";
import {
  initialControlState,
  validateControlPosition,
  evaluateControls,
  projectControls,
  controlCompletionProof,
} from "./control-engine.ts";
import type {
  TeachingState,
  LegacyTeachingState,
  GraphTeachingState,
  EngineProjection,
  NodeId,
  TaskId,
  GraphAction,
  ControlTeachingState,
  ControlCheckpoint,
  TransitionPlan,
  Occurrence,
  OccurrenceId,
  Checkpoint,
  RouteContext,
  CorrectionSpec,
  CompletionProof,
} from "./types.ts";
import {
  canonical,
  graphTask,
  increment,
  parseCounter,
  parseId,
  deepFreeze,
  taskDefinition,
} from "./content.ts";

export function initialState(
  content: RuntimePackage,
  taskId?: TaskId,
): TeachingState {
  if (content.body.coverage === "partial-first-m")
    return {
      version: 1,
      kind: "teaching",
      nodeId: content.body.startNodeId,
      acceptedNodeIds: [],
    };
  const firstTask = resolvedLessons(content)[0]?.tasks[0];
  const id = taskId ?? firstTask?.task.id;
  if (!id) throw new Error("Task is unavailable");
  if (taskDefinition({ content, taskId: id }).kind === "graphControls")
    return initialControlState({ content, taskId: id });
  const graph = graphTask(content, id);
  const occurrences: Occurrence[] = graph.normalNodeIds.map(
    (nodeId, index) => ({
      id: parseId({ kind: "occurrence", value: `occurrence-${index + 1}` }),
      nodeId,
      kind: "normal",
    }),
  );
  const first = occurrences[0];
  if (!first) throw new Error("Task normal route is empty");
  return deepFreeze({
    version: 1,
    kind: "graph",
    taskId: id,
    occurrences,
    acceptedOccurrenceIds: [],
    nextOccurrenceNumber: parseCounter(String(occurrences.length + 1)),
    checkpoints: [
      {
        id: parseId({ kind: "checkpoint", value: "checkpoint-1" }),
        occurrenceId: first.id,
        context: { kind: "normal" },
      },
    ],
    checkpointIndex: 0,
    nextCheckpointNumber: parseCounter("2"),
  });
}
function legacyNode(content: RuntimePackage, id: NodeId) {
  if (content.body.coverage !== "partial-first-m")
    throw new Error("Legacy state needs its exact legacy package");
  const node = content.body.nodes.find((node) => node.id === id);
  if (!node) throw new Error("Saved content position is unavailable");
  return node;
}
function legacyTransition(
  content: RuntimePackage,
  state: Extract<LegacyTeachingState, { kind: "teaching" }>,
): LegacyTeachingState {
  const node = legacyNode(content, state.nodeId);
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
export function currentCheckpoint(state: GraphTeachingState): Checkpoint;
export function currentCheckpoint(
  state: ControlTeachingState,
): ControlCheckpoint;
export function currentCheckpoint(
  state:
    | GraphTeachingState
    | ControlTeachingState
    | import("./types.ts").WritingSkippedState,
): Checkpoint | ControlCheckpoint;
export function currentCheckpoint(
  state:
    | GraphTeachingState
    | ControlTeachingState
    | import("./types.ts").WritingSkippedState,
): Checkpoint | ControlCheckpoint {
  if (state.kind === "writingSkipped") {
    const checkpoint =
      state.last.checkpoints[
        state.viewCheckpoint ?? state.last.checkpointIndex
      ];
    if (!checkpoint) throw new Error("Skipped view checkpoint unavailable");
    return checkpoint;
  }
  const checkpoint = state.checkpoints[state.checkpointIndex];
  if (!checkpoint) throw new Error("Saved checkpoint is unavailable");
  return checkpoint;
}
function occurrence(state: GraphTeachingState, id: OccurrenceId): Occurrence {
  const found = state.occurrences.find((entry) => entry.id === id);
  if (!found) throw new Error("Saved occurrence is unavailable");
  return found;
}
function normalOccurrence(
  state: GraphTeachingState,
  nodeId: NodeId,
): Occurrence {
  const found = state.occurrences.find(
    (entry) => entry.kind === "normal" && entry.nodeId === nodeId,
  );
  if (!found) throw new Error("Required occurrence is unavailable");
  return found;
}
export function validatePosition(
  content: RuntimePackage,
  state: TeachingState,
  taskId?: TaskId,
): void {
  if (state.kind === "writingSkipped") {
    if (
      !writingTask({ content, taskId: state.taskId }) ||
      state.taskId !== state.last.taskId ||
      (state.viewCheckpoint !== null &&
        (!Number.isInteger(state.viewCheckpoint) ||
          state.viewCheckpoint < 0 ||
          state.viewCheckpoint >= state.last.checkpoints.length)) ||
      (taskId !== undefined && taskId !== state.taskId) ||
      controlCompletionProof({ content, state: state.last }) !== null
    )
      throw new Error("Invalid skipped writing state");
    validateControlPosition({
      content,
      state: state.last,
      taskId: state.taskId,
    });
    return;
  }
  if (state.kind === "graphControls") {
    validateControlPosition({
      content,
      state,
      ...(taskId === undefined ? {} : { taskId }),
    });
    return;
  }
  if (state.kind !== "graph") {
    if (content.body.coverage !== "partial-first-m")
      throw new Error("Legacy state needs its exact legacy package");
    let expected: TeachingState = initialState(content);
    for (const id of state.acceptedNodeIds) {
      if (expected.kind !== "teaching" || expected.nodeId !== id)
        throw new Error("Saved content position is invalid");
      expected = legacyTransition(content, expected);
    }
    if (canonical(expected) !== canonical(state))
      throw new Error("Saved content position is invalid");
    return;
  }
  if (taskId !== undefined && taskId !== state.taskId)
    throw new Error("Saved task identity is invalid");
  const graph = graphTask(content, state.taskId);
  if (
    state.occurrences.length < graph.normalNodeIds.length ||
    state.occurrences.length >= 10000 ||
    state.nextOccurrenceNumber !== String(state.occurrences.length + 1)
  )
    throw new Error("Occurrence registry counter is invalid");
  state.occurrences.forEach((entry, index) => {
    if (
      entry.id !== `occurrence-${index + 1}` ||
      !graph.nodes.has(entry.nodeId)
    )
      throw new Error("Occurrence registry is invalid");
    if (index < graph.normalNodeIds.length) {
      if (
        entry.kind !== "normal" ||
        entry.nodeId !== graph.normalNodeIds[index]
      )
        throw new Error("Required occurrence binding changed");
    } else if (
      entry.kind === "normal" ||
      (entry.kind === "practice" &&
        graph.nodes.get(entry.nodeId)?.kind !== "normal")
    ) {
      throw new Error("Extra occurrence cannot bind a required milestone");
    }
  });
  if (
    new Set(state.acceptedOccurrenceIds).size !==
      state.acceptedOccurrenceIds.length ||
    state.acceptedOccurrenceIds.some(
      (id) => !state.occurrences.some((entry) => entry.id === id),
    )
  )
    throw new Error("Accepted occurrence registry is invalid");
  if (
    state.checkpoints.length === 0 ||
    state.checkpoints.length >= 10000 ||
    !Number.isInteger(state.checkpointIndex) ||
    state.checkpointIndex < 0 ||
    state.checkpointIndex >= state.checkpoints.length
  )
    throw new Error("Checkpoint cursor is invalid");
  const checkpointIds = new Set<string>();
  let previousNumber = 0n;
  state.checkpoints.forEach((checkpoint, index) => {
    const number = /^checkpoint-([1-9][0-9]*)$/.exec(checkpoint.id)?.[1];
    if (
      !number ||
      BigInt(number) <= previousNumber ||
      BigInt(number) >= BigInt(state.nextCheckpointNumber) ||
      checkpointIds.has(checkpoint.id)
    )
      throw new Error("Checkpoint registry is invalid");
    previousNumber = BigInt(number);
    checkpointIds.add(checkpoint.id);
    const context = checkpoint.context;
    const current =
      checkpoint.occurrenceId === null
        ? null
        : occurrence(state, checkpoint.occurrenceId);
    const checkRepeat = (value: Extract<RouteContext, { kind: "repeat" }>) => {
      const returnIndex = state.checkpoints.findIndex(
        (entry) => entry.id === value.returnCheckpointId,
      );
      if (
        returnIndex < 0 ||
        returnIndex >= index ||
        state.checkpoints[returnIndex]?.occurrenceId === null
      )
        throw new Error("Repeat return checkpoint is invalid");
    };
    if (context.kind === "normal") {
      if (current && current.kind !== "normal")
        throw new Error("Normal route occurrence is invalid");
      if (
        !current &&
        graph.normalNodeIds.some(
          (nodeId) =>
            !state.acceptedOccurrenceIds.includes(
              normalOccurrence(state, nodeId).id,
            ),
        )
      )
        throw new Error("Terminal checkpoint has unmet obligations");
    } else if (context.kind === "repeat") {
      checkRepeat(context);
      if (!current || current.kind !== "practice")
        throw new Error("Repeat occurrence is invalid");
    } else {
      const spec = graph.corrections.get(context.correctionId);
      const trigger = occurrence(state, context.triggerOccurrenceId);
      const returnTo = occurrence(state, context.returnOccurrenceId);
      if (!spec || !spec.eligibleNodeIds.includes(trigger.nodeId))
        throw new Error("Correction trigger is invalid");
      if (context.suspended.kind === "repeat") {
        checkRepeat(context.suspended);
        if (returnTo.kind !== "practice")
          throw new Error("Correction repeat return is invalid");
      }
      if (!current) throw new Error("Correction checkpoint is empty");
      if (context.kind === "correctionInstruction") {
        if (
          current.kind !== "support" ||
          current.nodeId !== spec.instructionNodeId
        )
          throw new Error("Correction instruction occurrence is invalid");
      } else if (
        current.nodeId !== spec.retestNodeIds[context.retestIndex] ||
        current.kind === "practice" ||
        (context.suspended.kind === "repeat" && current.kind === "normal")
      ) {
        throw new Error("Correction retest occurrence is invalid");
      }
    }
  });
  for (let index = 1; index < state.checkpoints.length; index++) {
    const previous = state.checkpoints[index - 1];
    const next = state.checkpoints[index];
    if (!previous || !next || previous.occurrenceId === null)
      throw new Error("Checkpoint route continues after its end");
    const from = occurrence(state, previous.occurrenceId);
    const to =
      next.occurrenceId === null ? null : occurrence(state, next.occurrenceId);
    const old = previous.context;
    const context = next.context;
    const same = (left: RouteContext, right: RouteContext) =>
      canonical(left) === canonical(right);
    const correctionCommon = (
      value: Extract<
        RouteContext,
        { kind: "correctionInstruction" | "correctionRetest" }
      >,
    ) =>
      canonical({
        correctionId: value.correctionId,
        triggerOccurrenceId: value.triggerOccurrenceId,
        returnOccurrenceId: value.returnOccurrenceId,
        suspended: value.suspended,
      });
    let navigation = false;
    if (
      context.kind === "repeat" &&
      to?.kind === "practice" &&
      to.nodeId === from.nodeId
    ) {
      navigation =
        old.kind === "repeat"
          ? same(old, context)
          : context.returnCheckpointId === previous.id;
    }
    if (context.kind === "correctionInstruction" && to?.kind === "support") {
      const spec = graph.corrections.get(context.correctionId);
      const suspended =
        old.kind === "normal" || old.kind === "repeat" ? old : old.suspended;
      const returnId =
        old.kind === "normal" || old.kind === "repeat"
          ? from.id
          : old.returnOccurrenceId;
      navigation ||= Boolean(
        spec?.eligibleNodeIds.includes(from.nodeId) &&
        context.triggerOccurrenceId === from.id &&
        context.returnOccurrenceId === returnId &&
        same(context.suspended, suspended),
      );
      navigation ||=
        old.kind === "correctionInstruction" &&
        same(old, context) &&
        to.nodeId === from.nodeId;
    }
    if (navigation) continue;
    let continuation = false;
    if (old.kind === "normal") {
      const node = graph.nodes.get(from.nodeId);
      continuation =
        context.kind === "normal" &&
        (node?.next.kind === "end"
          ? to === null
          : to?.kind === "normal" && to.nodeId === node?.next.nodeId);
    } else if (old.kind === "repeat") {
      const destination = state.checkpoints.find(
        (entry) => entry.id === old.returnCheckpointId,
      );
      continuation =
        destination !== undefined &&
        next.occurrenceId === destination.occurrenceId &&
        same(context, destination.context);
    } else {
      const spec = graph.corrections.get(old.correctionId);
      if (
        old.kind === "correctionInstruction" ||
        old.retestIndex + 1 < (spec?.retestNodeIds.length ?? 0)
      ) {
        const retestIndex =
          old.kind === "correctionInstruction" ? 0 : old.retestIndex + 1;
        continuation =
          context.kind === "correctionRetest" &&
          context.retestIndex === retestIndex &&
          correctionCommon(old) === correctionCommon(context);
      } else if (old.suspended.kind === "repeat") {
        continuation =
          next.occurrenceId === old.returnOccurrenceId &&
          same(context, old.suspended);
      } else {
        continuation =
          context.kind === "normal" &&
          (spec?.continuationNodeId === null
            ? to === null
            : to?.kind === "normal" && to.nodeId === spec?.continuationNodeId);
      }
    }
    if (!continuation || !state.acceptedOccurrenceIds.includes(from.id))
      throw new Error(
        "Checkpoint route skipped an unaccepted or unauthored turn",
      );
  }
  const first = state.checkpoints[0];
  if (
    first?.id !== "checkpoint-1" ||
    first.context.kind !== "normal" ||
    first.occurrenceId !== state.occurrences[0]?.id
  )
    throw new Error("Task checkpoint entry is invalid");
  currentCheckpoint(state);
}
export function evaluate(
  content: RuntimePackage,
  state: TeachingState,
  nodeId: NodeId,
): TeachingState {
  validatePosition(content, state);
  if (
    state.kind === "graph" ||
    state.kind === "graphControls" ||
    state.kind === "writingSkipped"
  )
    throw new Error("Graph teaching needs a semantic action");
  if (state.kind === "frontier")
    throw new Error("Partial content frontier cannot advance");
  if (state.nodeId !== nodeId)
    throw new Error("Parent acceptance does not target current node");
  return legacyTransition(content, state);
}
export function evaluateGraph({
  content,
  state,
  status,
  action,
}: {
  content: RuntimePackage;
  state:
    | GraphTeachingState
    | ControlTeachingState
    | import("./types.ts").WritingSkippedState;
  status: "inProgress" | "completed" | "skipped";
  action: GraphAction;
}): TransitionPlan {
  if (state.kind === "writingSkipped") {
    validatePosition(content, state);
    if (status !== "skipped") throw new Error("Skipped run status changed");
    if (action.kind === "back") {
      const index =
        state.viewCheckpoint === null
          ? state.last.checkpoints.length - 1
          : state.viewCheckpoint - 1;
      if (index < 0) throw new Error("Back unavailable");
      return { kind: "navigation", after: { ...state, viewCheckpoint: index } };
    }
    if (action.kind === "continue" && state.viewCheckpoint !== null)
      return {
        kind: "navigation",
        after: {
          ...state,
          viewCheckpoint:
            state.viewCheckpoint === state.last.checkpoints.length - 1
              ? null
              : state.viewCheckpoint + 1,
        },
      };
    throw new Error("Skipped writing is read only");
  }
  if (status === "skipped") throw new Error("Skipped teaching state missing");
  if (state.kind === "graphControls")
    return evaluateControls({ content, state, status, action });
  if (
    action.kind !== "continue" &&
    action.kind !== "back" &&
    action.kind !== "repeat" &&
    action.kind !== "pause" &&
    action.kind !== "help"
  )
    throw new Error("Printed action unavailable");
  validatePosition(content, state);
  const graph = graphTask(content, state.taskId);
  const checkpoint = currentCheckpoint(state);
  const current =
    checkpoint.occurrenceId === null
      ? null
      : occurrence(state, checkpoint.occurrenceId);
  const accepted =
    current !== null && state.acceptedOccurrenceIds.includes(current.id);
  const required = graph.normalNodeIds.map((id) => normalOccurrence(state, id));
  const wasComplete = required.every((entry) =>
    state.acceptedOccurrenceIds.includes(entry.id),
  );
  if ((status === "completed") !== wasComplete)
    throw new Error("Run completion does not match its obligations");
  let after = state;
  let occurrenceId: OccurrenceId | null = null;
  let occurrences = [...state.occurrences];
  let nextOccurrenceNumber = state.nextOccurrenceNumber;
  const allocate = (
    nodeId: NodeId,
    kind: "practice" | "support",
  ): Occurrence => {
    if (occurrences.length >= 9999)
      throw new Error("Practice history limit reached");
    const entry: Occurrence = {
      id: parseId({
        kind: "occurrence",
        value: `occurrence-${nextOccurrenceNumber}`,
      }),
      nodeId,
      kind,
    };
    occurrences.push(entry);
    nextOccurrenceNumber = increment(nextOccurrenceNumber);
    return entry;
  };
  const move = (target: Occurrence | null, context: RouteContext) => {
    const checkpoints = state.checkpoints.slice(0, state.checkpointIndex + 1);
    if (checkpoints.length >= 9999)
      throw new Error("Checkpoint history limit reached");
    checkpoints.push({
      id: parseId({
        kind: "checkpoint",
        value: `checkpoint-${state.nextCheckpointNumber}`,
      }),
      occurrenceId: target?.id ?? null,
      context,
    });
    after = {
      ...after,
      occurrences,
      nextOccurrenceNumber,
      checkpoints,
      checkpointIndex: checkpoints.length - 1,
      nextCheckpointNumber: increment(state.nextCheckpointNumber),
    };
  };
  const enterRetest = (
    spec: CorrectionSpec,
    context: Extract<
      RouteContext,
      { kind: "correctionInstruction" | "correctionRetest" }
    >,
    index: number,
  ) => {
    const nodeId = spec.retestNodeIds[index];
    if (!nodeId) throw new Error("Retest route is unavailable");
    const normal = normalOccurrence(state, nodeId);
    const target =
      context.suspended.kind === "normal" &&
      !after.acceptedOccurrenceIds.includes(normal.id)
        ? normal
        : allocate(nodeId, "support");
    move(target, {
      kind: "correctionRetest",
      correctionId: context.correctionId,
      triggerOccurrenceId: context.triggerOccurrenceId,
      returnOccurrenceId: context.returnOccurrenceId,
      suspended: context.suspended,
      retestIndex: index,
    });
  };
  switch (action.kind) {
    case "pause":
      return { kind: "pause", after: state };
    case "back":
      if (state.checkpointIndex === 0) throw new Error("Back is unavailable");
      after = { ...state, checkpointIndex: state.checkpointIndex - 1 };
      break;
    case "repeat": {
      if (status !== "inProgress" || !current)
        throw new Error("Repeat is unavailable on a closed run");
      if (checkpoint.context.kind === "correctionInstruction")
        move(allocate(current.nodeId, "support"), checkpoint.context);
      else
        move(
          allocate(current.nodeId, "practice"),
          checkpoint.context.kind === "repeat"
            ? checkpoint.context
            : { kind: "repeat", returnCheckpointId: checkpoint.id },
        );
      break;
    }
    case "help": {
      if (status !== "inProgress" || !current)
        throw new Error("Help is unavailable on a closed run");
      const spec = graph.corrections.get(action.correctionId);
      if (!spec || !spec.eligibleNodeIds.includes(current.nodeId))
        throw new Error("Correction is not applicable");
      const old = checkpoint.context;
      const suspended =
        old.kind === "normal" || old.kind === "repeat" ? old : old.suspended;
      const returnOccurrenceId =
        old.kind === "normal" || old.kind === "repeat"
          ? current.id
          : old.returnOccurrenceId;
      move(allocate(spec.instructionNodeId, "support"), {
        kind: "correctionInstruction",
        correctionId: spec.id,
        triggerOccurrenceId: current.id,
        returnOccurrenceId,
        suspended,
      });
      break;
    }
    case "continue": {
      if (!current) throw new Error("Terminal view cannot accept");
      if (accepted && state.checkpointIndex < state.checkpoints.length - 1) {
        after = { ...state, checkpointIndex: state.checkpointIndex + 1 };
        break;
      }
      if (!accepted) {
        if (status === "completed")
          throw new Error("Closed run cannot accept new practice");
        occurrenceId = current.id;
        after = {
          ...state,
          acceptedOccurrenceIds: [...state.acceptedOccurrenceIds, current.id],
        };
      }
      const context = checkpoint.context;
      if (context.kind === "normal") {
        const node = graph.nodes.get(current.nodeId);
        if (!node) throw new Error("Current node is unavailable");
        move(
          node.next.kind === "end"
            ? null
            : normalOccurrence(state, node.next.nodeId),
          context,
        );
      } else if (context.kind === "repeat") {
        const returnIndex = state.checkpoints.findIndex(
          (entry) => entry.id === context.returnCheckpointId,
        );
        if (returnIndex < 0) throw new Error("Repeat return is unavailable");
        const returnTo = state.checkpoints[returnIndex];
        if (!returnTo?.occurrenceId) throw new Error("Repeat return is empty");
        move(occurrence(state, returnTo.occurrenceId), returnTo.context);
      } else {
        const spec = graph.corrections.get(context.correctionId);
        if (!spec) throw new Error("Correction route is unavailable");
        if (context.kind === "correctionInstruction")
          enterRetest(spec, context, 0);
        else if (context.retestIndex + 1 < spec.retestNodeIds.length)
          enterRetest(spec, context, context.retestIndex + 1);
        else if (context.suspended.kind === "repeat")
          move(
            occurrence(state, context.returnOccurrenceId),
            context.suspended,
          );
        else
          move(
            spec.continuationNodeId === null
              ? null
              : normalOccurrence(state, spec.continuationNodeId),
            { kind: "normal" },
          );
      }
      break;
    }
    default: {
      const exhaustive: never = action;
      throw new Error(`Unknown action ${String(exhaustive)}`);
    }
  }
  validatePosition(content, after);
  if (occurrenceId === null) return deepFreeze({ kind: "navigation", after });
  const completion = wasComplete ? null : graphCompletionProof(content, after);
  if (completion !== null)
    return deepFreeze({
      kind: "completion",
      after,
      occurrenceId,
      completion,
    });
  return deepFreeze({ kind: "acceptance", after, occurrenceId });
}
export function validateAcceptanceTransition({
  content,
  taskId,
  before,
  after,
  occurrenceId,
  action,
}: {
  content: RuntimePackage;
  taskId: TaskId;
  before: TeachingState;
  after: TeachingState;
  occurrenceId: OccurrenceId | NodeId;
  action?: GraphAction;
}): void {
  validatePosition(content, before, taskId);
  validatePosition(content, after, taskId);
  if (before.kind === "graphControls") {
    if (
      (after.kind !== "graphControls" && after.kind !== "writingSkipped") ||
      !action
    )
      throw new Error("Explicit control acceptance required");
    const expected = evaluateControls({
      content,
      state: before,
      status: "inProgress",
      action,
    });
    if (
      (expected.kind !== "acceptance" &&
        expected.kind !== "completion" &&
        expected.kind !== "skip") ||
      expected.occurrenceId !== occurrenceId ||
      canonical(expected.after) !== canonical(after)
    )
      throw new Error("Control acceptance snapshots do not match command");
  } else if (before.kind === "graph") {
    if (after.kind !== "graph")
      throw new Error("Acceptance state variant changed");
    const current = currentCheckpoint(before);
    if (current.occurrenceId !== occurrenceId)
      throw new Error("Acceptance targets another occurrence");
    const expected = evaluateGraph({
      content,
      state: before,
      status: "inProgress",
      action: { kind: "continue" },
    });
    if (
      (expected.kind !== "acceptance" &&
        expected.kind !== "completion" &&
        expected.kind !== "skip") ||
      canonical(expected.after) !== canonical(after)
    )
      throw new Error("Acceptance snapshots do not match graph");
  } else {
    if (
      before.kind !== "teaching" ||
      before.nodeId !== occurrenceId ||
      canonical(evaluate(content, before, before.nodeId)) !== canonical(after)
    )
      throw new Error("Acceptance snapshots do not match legacy content");
  }
}
export function project(
  content: RuntimePackage,
  state: TeachingState,
): EngineProjection {
  validatePosition(content, state);
  if (state.kind === "writingSkipped")
    return state.viewCheckpoint === null
      ? { kind: "skipped" }
      : projectControls({
          content,
          state: { ...state.last, checkpointIndex: state.viewCheckpoint },
        });
  if (state.kind === "graphControls")
    return projectControls({ content, state });
  if (state.kind === "graph") {
    const checkpoint = currentCheckpoint(state);
    if (checkpoint.occurrenceId === null) return { kind: "completed" };
    const current = occurrence(state, checkpoint.occurrenceId);
    const node = graphTask(content, state.taskId).nodes.get(current.nodeId);
    if (!node) throw new Error("Current node is unavailable");
    return {
      kind: "teaching",
      turn: {
        ...node,
        extraPractice: current.kind !== "normal",
        routeKind: checkpoint.context.kind,
        occurrenceId: current.id,
        checkpointId: checkpoint.id,
      },
    };
  }
  return state.kind === "teaching"
    ? { kind: "teaching", turn: legacyNode(content, state.nodeId) }
    : {
        kind: "frontier",
        status: "inProgress",
        unmetObligations: state.unmetObligations,
      };
}

export function completionProof(
  content: RuntimePackage,
  state: TeachingState,
): CompletionProof | null {
  validatePosition(content, state);
  if (state.kind === "graphControls")
    return controlCompletionProof({ content, state });
  if (state.kind !== "graph") return null;
  return graphCompletionProof(content, state);
}
function graphCompletionProof(
  content: RuntimePackage,
  state: GraphTeachingState,
): CompletionProof | null {
  const graph = graphTask(content, state.taskId);
  const required = graph.normalNodeIds.map((id) => normalOccurrence(state, id));
  if (required.some((entry) => !state.acceptedOccurrenceIds.includes(entry.id)))
    return null;
  return deepFreeze({
    taskId: state.taskId,
    packageHash: content.packageHash,
    requiredOccurrenceIds: required.map((entry) => entry.id),
    sourceRefs: [
      ...new Set(
        graph.task.nodes
          .filter((node) => node.kind === "normal")
          .flatMap((node) => node.sourceRefs),
      ),
    ],
  });
}
export function validateAcceptanceState({
  content,
  taskId,
  baseline,
  state,
}: {
  content: RuntimePackage;
  taskId: TaskId;
  baseline: TeachingState;
  state: TeachingState;
}): void {
  validatePosition(content, baseline, taskId);
  validatePosition(content, state, taskId);
  if (baseline.kind === "writingSkipped") {
    if (
      state.kind !== "writingSkipped" ||
      canonical({ ...baseline, viewCheckpoint: null }) !==
        canonical({ ...state, viewCheckpoint: null })
    )
      throw new Error("Skipped writing history changed");
    return;
  }
  if (baseline.kind === "graphControls") {
    if (state.kind === "graphControls") {
      const oldCheckpoints = new Map(
        baseline.checkpoints.map((cp) => [cp.id, cp]),
      );
      for (const cp of state.checkpoints) {
        const number = /^checkpoint-([1-9][0-9]*)$/.exec(cp.id)?.[1];
        if (
          number &&
          BigInt(number) < BigInt(baseline.nextCheckpointNumber) &&
          canonical(oldCheckpoints.get(cp.id) ?? null) !== canonical(cp)
        )
          throw new Error("Navigation rewrote a saved control checkpoint");
      }
      if (
        state.cycles
          .slice(baseline.cycles.length)
          .some((c) =>
            c.turnOccurrenceIds.some(
              (id) =>
                state.occurrences.find((o) => o.id === id)?.obligation !==
                "support",
            ),
          )
      )
        throw new Error("Navigation invented an independent cycle");
      if (
        controlCompletionProof({ content, state: baseline }) !== null &&
        (canonical(baseline.checkpoints) !== canonical(state.checkpoints) ||
          canonical(baseline.occurrences) !== canonical(state.occurrences) ||
          baseline.nextCheckpointNumber !== state.nextCheckpointNumber)
      )
        throw new Error("Completed control history is read only");
    }
    if (
      state.kind !== "graphControls" ||
      canonical(baseline.acceptedOccurrenceIds) !==
        canonical(state.acceptedOccurrenceIds) ||
      canonical(baseline.occurrences) !==
        canonical(state.occurrences.slice(0, baseline.occurrences.length)) ||
      canonical(baseline.queues) !== canonical(state.queues) ||
      canonical(baseline.cycles) !==
        canonical(state.cycles.slice(0, baseline.cycles.length)) ||
      canonical(baseline.cycleOutcomes) !== canonical(state.cycleOutcomes) ||
      BigInt(state.nextCheckpointNumber) < BigInt(baseline.nextCheckpointNumber)
    )
      throw new Error("Control navigation changed durable obligations");
  } else if (baseline.kind === "graph") {
    if (
      state.kind !== "graph" ||
      baseline.taskId !== state.taskId ||
      canonical(baseline.acceptedOccurrenceIds) !==
        canonical(state.acceptedOccurrenceIds) ||
      canonical(baseline.occurrences) !==
        canonical(state.occurrences.slice(0, baseline.occurrences.length)) ||
      BigInt(state.nextCheckpointNumber) < BigInt(baseline.nextCheckpointNumber)
    )
      throw new Error(
        "Navigation changed durable acceptance or occurrence bindings",
      );
  } else if (
    state.kind === "graph" ||
    state.kind === "graphControls" ||
    canonical(baseline) !== canonical(state)
  ) {
    throw new Error("Legacy acceptance state changed without an advance");
  }
}
