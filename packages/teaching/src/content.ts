import {
  validateBoardNode,
  resolvePrintedPresentation,
  validateControlPrintedTurn,
} from "./printed.ts";
import { guidanceCopies, requirePlainGuidance } from "./guidance.ts";
import type { RuntimePackage } from "./course-content.ts";
import { resolvedTask } from "./course-content.ts";
import {
  canonical,
  parseId,
  parseHash,
  parseCounter,
  increment,
  deepFreeze,
} from "./identity.ts";
export {
  canonical,
  parseId,
  parseHash,
  parseCounter,
  increment,
  deepFreeze,
} from "./identity.ts";
import { parseDocumentToken } from "./ink.ts";
import { compileWritingTask, compileWritingPlan } from "./writing.ts";
import { compileControlTask } from "./control-content.ts";
import type {
  DevelopmentBodyInput,
  Id,
  IdKind,
  Hash,
  HashKind,
  NodeId,
  DevelopmentPackage,
  HashFunction,
  TeachingState,
  TeachingCommand,
  CommitReceipt,
  Counter,
  GraphTask,
  PrintedPreviewTask,
  BoardTask,
  PrintedNode,
  CorrectionSpec,
  TaskId,
  CorrectionId,
} from "./types.ts";
import {
  validatePackage,
  validatePrintedPreviewTask,
  validateState,
  validateCommand,
  validateReceipt,
  validateProjection,
  validateResult,
} from "./generated-validators.js";
export function parsePrintedPreviewTask(input: unknown): PrintedPreviewTask {
  if (!validatePrintedPreviewTask(input))
    throw new Error("Printed preview task is unsupported");
  compileTask(input.task);
  return deepFreeze(input);
}
export function canonicalContentBody(
  body:
    | DevelopmentBodyInput
    | import("./types.ts").Serialized<
        import("./course-content.ts").CumulativeDevelopmentBody
      >,
): string {
  return canonical(body);
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
  if (input.body.coverage === "partial-first-m") {
    const nodes = new Map(input.body.nodes.map((node) => [node.id, node]));
    if (nodes.size !== input.body.nodes.length)
      throw new Error("Duplicate content node");
    const visited = new Set<NodeId>();
    let next = input.body.startNodeId;
    while (true) {
      if (visited.has(next)) throw new Error("Content cycle");
      const current = nodes.get(next);
      if (!current) throw new Error("Content node missing");
      visited.add(next);
      if (current.next.kind === "frontier") break;
      next = current.next.nodeId;
    }
    if (visited.size !== nodes.size)
      throw new Error("Unreachable content node");
  } else {
    const metadata = new Map(
      input.body.lessonTasks.map((task) => [task.id, task]),
    );
    if (
      metadata.size !== input.body.lessonTasks.length ||
      new Set(input.body.lessonTasks.map((task) => task.number)).size !==
        metadata.size
    )
      throw new Error("Duplicate task metadata");
    const seen = new Set<TaskId>();
    for (const entryTask of input.body.tasks) {
      const task = "task" in entryTask ? entryTask.task : entryTask;
      if (!("nodes" in task))
        throw new Error("Unsupported legacy content capability");
      for (const node of task.nodes)
        for (const span of node.guidance) requirePlainGuidance(span);
      if (seen.has(task.id)) throw new Error("Duplicate available task");
      seen.add(task.id);
      const entry = metadata.get(task.id);
      if (
        !entry ||
        entry.number !== task.number ||
        canonical(entry.title) !== canonical(task.title)
      )
        throw new Error("Task metadata mismatch");
      if (
        input.body.coverage === "lesson1-sounds-oral-complete" ||
        input.body.coverage === "lesson1-complete"
      ) {
        if ("kind" in entryTask && entryTask.kind === "soundWritingV1") {
          if (!entry.optional || input.body.coverage !== "lesson1-complete")
            throw new Error("Writing metadata must be optional and explicit");
          compileWritingTask(entryTask.task);
        } else if ("kind" in entryTask && entryTask.kind === "graphControls") {
          if (
            entryTask.task.nodes.some(
              (n) => n.kind === "turn" && n.presentation.kind !== "oral",
            )
          )
            throw new Error("Writing requires an explicit writing task");
          compileControlTask(entryTask.task);
        } else if ("kind" in entryTask && entryTask.kind === "printedGraphV1")
          compileTask(entryTask.task);
        else throw new Error("Unsupported legacy task capability");
      } else if (!("task" in entryTask)) compileTask(entryTask);
    }
  }
  return deepFreeze(input);
}
export function parseTeachingState(input: unknown): TeachingState {
  if (!validateState(input))
    throw new Error("Stored teaching state schema is unsupported");
  if (input.kind === "graph" || input.kind === "graphControls") {
    parseCounter(input.nextOccurrenceNumber);
    parseCounter(input.nextCheckpointNumber);
  }
  if (input.kind === "writingSkipped") {
    parseCounter(input.last.nextOccurrenceNumber);
    parseCounter(input.last.nextCheckpointNumber);
  }
  return deepFreeze(input);
}
export function parseCommand(input: unknown): TeachingCommand {
  if (!validateCommand(input)) throw new Error("Command schema is invalid");
  parseCounter(input.expectedRevision);
  parseCounter(input.owner.generation);
  parseCounter(input.scope.generation);
  if (input.kind === "undoAdvance" || input.kind === "writingUndoAdvance") {
    parseCounter(input.payload.runRevision);
    parseCounter(input.payload.profileRevision);
    parseCounter(input.payload.cursorRevision);
    parseCounter(input.payload.selectionCounter);
  }
  if (
    input.kind === "writingUndoAdvance" ||
    input.kind === "writingNavigate" ||
    input.kind === "writingSelect" ||
    input.kind === "writingControl"
  )
    for (const token of input.payload.barrier.documents)
      parseDocumentToken(token);
  return deepFreeze(input);
}
export function parseReceipt(input: unknown): CommitReceipt {
  if (!validateReceipt(input))
    throw new Error("Stored receipt schema is invalid");
  parseCounter(input.revision);
  parseCounter(input.owner.generation);
  return deepFreeze(input);
}
export function parseProjection(
  input: unknown,
): import("./types.ts").CommittedProjection {
  if (!validateProjection(input))
    throw new Error("Projection schema is invalid");
  if (input.kind !== "recovery") {
    parseCounter(input.owner.generation);
    parseCounter(input.profileRevision);
    if (input.kind !== "entry") {
      parseCounter(input.revision);
      parseCounter(input.selectionCounter);
      if ("documents" in input)
        for (const token of input.documents) parseDocumentToken(token);
    }
  }
  if (input.kind !== "recovery") {
    if (
      input.kind === "teaching" &&
      "kind" in input.turn &&
      input.turn.kind === "turn"
    )
      validateControlPrintedTurn(input.turn);
    for (const action of input.actions)
      if (
        "correctionPreview" in action &&
        action.correctionPreview.kind === "turn"
      )
        validateControlPrintedTurn(action.correctionPreview);
    if (
      input.kind === "teaching" &&
      "presentation" in input.turn &&
      input.turn.presentation.kind === "printedBoard" &&
      input.turn.kind !== "turn"
    )
      validateBoardNode(input.turn);
    for (const action of input.actions)
      if (
        "correctionPreview" in action &&
        "presentation" in action.correctionPreview &&
        action.correctionPreview.presentation.kind === "printedBoard" &&
        action.correctionPreview.kind !== "turn"
      )
        validateBoardNode(action.correctionPreview);
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

export type CompiledTask = Readonly<{
  task: GraphTask | BoardTask;
  nodes: ReadonlyMap<NodeId, PrintedNode>;
  normalNodeIds: readonly NodeId[];
  corrections: ReadonlyMap<CorrectionId, CorrectionSpec>;
}>;
const compiledTasks = new WeakMap<GraphTask | BoardTask, CompiledTask>();
export function compileTask(task: GraphTask | BoardTask): CompiledTask {
  const cached = compiledTasks.get(task);
  if (cached) return cached;
  const nodes = new Map<NodeId, PrintedNode>(
    task.nodes.map((node) => [node.id, node]),
  );
  const board = task.nodes.find((node) => "presentation" in node);
  if (board && "presentation" in board) {
    for (const node of task.nodes) {
      if (
        !("presentation" in node) ||
        canonical(node.presentation.board) !==
          canonical(board.presentation.board)
      )
        throw new Error("Printed task must retain one stable reviewed board");
      if (
        (node.kind === "correction") !==
        (node.presentation.cue.kind === "none")
      )
        throw new Error("Only correction instructions are cue-free");
    }
  }
  if (nodes.size !== task.nodes.length) throw new Error("Duplicate graph node");
  const normalNodeIds: NodeId[] = [];
  let next: NodeId | null = task.startNodeId;
  while (next !== null) {
    if (normalNodeIds.includes(next)) throw new Error("Normal route cycle");
    const node = nodes.get(next);
    if (!node || node.kind !== "normal")
      throw new Error("Normal route missing node");
    normalNodeIds.push(node.id);
    next = node.next.kind === "end" ? null : node.next.nodeId;
  }
  if (
    normalNodeIds.length !==
    task.nodes.filter((node) => node.kind === "normal").length
  )
    throw new Error("Unreachable normal node");
  const corrections = new Map(task.corrections.map((spec) => [spec.id, spec]));
  if (corrections.size !== task.corrections.length)
    throw new Error("Duplicate correction");
  const support = new Set<NodeId>();
  for (const spec of task.corrections) {
    const instruction = nodes.get(spec.instructionNodeId);
    if (
      !instruction ||
      instruction.kind !== "correction" ||
      instruction.next.kind !== "end"
    )
      throw new Error("Correction instruction is invalid");
    support.add(instruction.id);
    for (const eligibleId of spec.eligibleNodeIds) {
      const eligible = nodes.get(eligibleId);
      if (
        !eligible ||
        eligible.kind !== "normal" ||
        eligible.parentRole !== "listen" ||
        focusedGlyph(eligible) !== focusedGlyph(instruction)
      )
        throw new Error("Correction eligibility is invalid");
    }
    const first = spec.retestNodeIds[0];
    const start = first === undefined ? -1 : normalNodeIds.indexOf(first);
    if (
      start < 0 ||
      spec.retestNodeIds.some(
        (id, index) => normalNodeIds[start + index] !== id,
      )
    )
      throw new Error(
        "Correction retest must be an explicit contiguous normal route",
      );
    for (const id of spec.retestNodeIds) {
      if (nodes.get(id)?.parentRole !== "listen")
        throw new Error("Correction retest is not a child response");
    }
    if (
      spec.continuationNodeId !==
      (normalNodeIds[start + spec.retestNodeIds.length] ?? null)
    )
      throw new Error("Correction continuation does not follow retest");
  }
  if (
    task.nodes.some(
      (node) => node.kind === "correction" && !support.has(node.id),
    )
  )
    throw new Error("Unreachable correction instruction");
  for (const node of task.nodes) {
    if ("presentation" in node) validateBoardNode(node);
    for (const span of node.guidance) {
      if (
        guidanceCopies(span).some(
          (copy) =>
            copy.kind !== "added" && !node.sourceRefs.includes(copy.sourceRef),
        )
      )
        throw new Error("Guidance source reference is missing");
    }
  }
  const result = { task, nodes, normalNodeIds, corrections };
  compiledTasks.set(task, result);
  return result;
}
export function graphTask(
  content: RuntimePackage,
  taskId: TaskId,
): CompiledTask {
  if (
    content.body.coverage === "course-development" ||
    content.body.coverage === "course-development-v2" ||
    content.body.coverage === "course-development-v3" ||
    content.body.coverage === "course-development-v4" ||
    content.body.coverage === "lesson1-sounds-oral-complete" ||
    content.body.coverage === "lesson1-complete"
  ) {
    const entry = resolvedTask({ content, taskId })?.entry;
    if (
      !entry ||
      (entry.kind !== "printedGraphV1" && entry.kind !== "printedGraphV2")
    )
      throw new Error("Printed task is not available in exact package");
    return compileTask(entry.task);
  }
  if (content.body.coverage !== "lesson1-sounds-complete")
    throw new Error("Graph package required");
  const task = content.body.tasks.find((entry) => entry.id === taskId);
  if (!task) throw new Error("Task is not available in exact package");
  return compileTask(task);
}

export function taskDefinition({
  content,
  taskId,
}: {
  content: RuntimePackage;
  taskId: TaskId;
}) {
  if (
    content.body.coverage === "course-development" ||
    content.body.coverage === "course-development-v2" ||
    content.body.coverage === "course-development-v3" ||
    content.body.coverage === "course-development-v4" ||
    content.body.coverage === "lesson1-sounds-oral-complete" ||
    content.body.coverage === "lesson1-complete"
  ) {
    const entry = resolvedTask({ content, taskId })?.entry;
    if (!entry) throw new Error("Task unavailable in exact package");
    if (entry.kind === "writingPracticePlanV2")
      return {
        kind: "graphControls",
        graph: compileWritingPlan(entry.task),
      } as const;
    if (entry.kind === "soundWritingV1")
      return {
        kind: "graphControls",
        graph: compileWritingTask(entry.task),
      } as const;
    if (entry.kind === "graphControls")
      return {
        kind: "graphControls",
        graph: compileControlTask(entry.task),
      } as const;
  }
  return { kind: "printedGraphV1", graph: graphTask(content, taskId) } as const;
}
export function controlTask({
  content,
  taskId,
}: {
  content: RuntimePackage;
  taskId: TaskId;
}) {
  const entry = taskDefinition({ content, taskId });
  if (entry.kind !== "graphControls") throw new Error("Control task required");
  return entry.graph;
}

export function focusedGlyph(node: PrintedNode) {
  return "presentation" in node ? node.presentation.focus : node.glyph;
}
export function projectPrintedPreview(node: PrintedNode): PrintedNode {
  return "presentation" in node
    ? { ...node, presentation: resolvePrintedPresentation(node.presentation) }
    : node;
}
export function projectPrintedTurn({
  node,
  occurrence,
  checkpoint,
}: {
  node: PrintedNode;
  occurrence: import("./types.ts").Occurrence;
  checkpoint: import("./types.ts").Checkpoint;
}): import("./types.ts").GraphTurn | import("./types.ts").BoardTurn {
  return {
    ...projectPrintedPreview(node),
    extraPractice: occurrence.kind !== "normal",
    routeKind: checkpoint.context.kind,
    occurrenceId: occurrence.id,
    checkpointId: checkpoint.id,
  };
}
