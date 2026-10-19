import { projectPrintedPreview } from "./content.ts";
import { parseCounter } from "./identity.ts";
import { courseProjection } from "./course.ts";
import type { ApplicationRead, CourseReadTarget } from "./course.ts";
import {
  resolvedLessons,
  resolvedTask,
  authoredTaskIdentity,
} from "./course-content.ts";
import type { InstalledTeaching } from "./installed-teaching.ts";
import { writingTask, writingPermission, layerForPhase } from "./writing.ts";
import { controlActions } from "./control-engine.ts";
import { canonicalReviewChoice } from "./control-content.ts";
import {
  canonical,
  deepFreeze,
  increment,
  parseCommand,
  parseId,
  graphTask,
  taskDefinition,
} from "./content.ts";
import {
  currentCheckpoint,
  evaluate,
  evaluateGraph,
  initialState,
  project,
  validatePosition,
  completionProof,
} from "./engine.ts";
import type {
  AvailableAction,
  CatalogTask,
  CommittedProjection,
  HashFunction,
  IdFactory,
  TeachingApplication,
  TeachingCommand,
  TeachingStore,
  TeachingTransaction,
  CommitReceipt,
  CommandResult,
  StoredContext,
  SelectionPlan,
  TeachingIntent,
  TransitionPlan,
  TaskId,
  ReviewSelectionAction,
  ReviewChoice,
} from "./types.ts";
const added = (text: string) => ({ kind: "added", text }) as const;
const choice = (
  label: string,
  intent: Exclude<TeachingIntent, { kind: "help" }>,
): AvailableAction => ({
  label: added(label),
  intent,
});

export async function prepareCommand({
  projection,
  request,
  ids,
  hash,
}: {
  projection: CommittedProjection;
  request?: Readonly<
    | { kind: "action"; action: AvailableAction }
    | { kind: "review"; action: ReviewSelectionAction; choice: ReviewChoice }
  >;
  ids: IdFactory;
  hash: HashFunction;
}): Promise<TeachingCommand> {
  if (projection.kind === "recovery")
    throw new Error("No command is available");
  let requested: AvailableAction | undefined;
  if (request?.kind === "review") {
    if (
      projection.kind !== "reviewSelection" ||
      projection.committedChoice !== null ||
      canonical(request.action) !== canonical(projection.selectionAction)
    )
      throw new Error("Review selection capability unavailable");
    const ordered = canonicalReviewChoice({
      items: projection.items,
      choice: request.choice,
      invalidMessage: "Complete explicit review choice invalid",
    });
    requested = {
      label: request.action.selectLabel,
      intent: {
        kind: "commitReviewSelection",
        reviewId: request.action.reviewId,
        choice: ordered,
      },
    };
  }
  const selected =
    requested ??
    (request?.kind === "action" ? request.action : undefined) ??
    projection.actions.find((entry) => entry.intent.kind === "continue") ??
    projection.actions.find(
      (entry) => "taskId" in entry.intent && entry.intent.kind === "start",
    );
  if (
    !selected ||
    (!requested &&
      !projection.actions.some(
        (entry) => canonical(entry) === canonical(selected),
      ))
  )
    throw new Error("Action is unavailable at this saved position");
  const intent = selected.intent;
  const common = { commandId: ids(), owner: projection.owner };
  let draft: unknown;
  if (intent.kind === "undoAdvance") {
    if (
      projection.kind === "entry" ||
      projection.kind === "writing" ||
      projection.kind === "writingResult"
    )
      throw new Error("Undo requires the current ordinary teaching view");
    draft = {
      ...common,
      kind: "undoAdvance",
      scope: {
        kind: "session",
        id: projection.sessionId,
        generation: projection.owner.generation,
      },
      expectedRevision: projection.revision,
      payload: intent.binding,
    };
  } else if (
    "taskId" in intent &&
    intent.kind === "start" &&
    projection.kind === "entry" &&
    projection.catalog.length === 0
  )
    draft = {
      ...common,
      kind: "start",
      scope: {
        kind: "profile",
        id: projection.owner.profileId,
        generation: projection.owner.generation,
      },
      expectedRevision: projection.profileRevision,
      payload: { packageHash: intent.packageHash },
    };
  else if ("taskId" in intent)
    draft = {
      ...common,
      kind: "select",
      scope: {
        kind: "profile",
        id: projection.owner.profileId,
        generation: projection.owner.generation,
      },
      expectedRevision: projection.profileRevision,
      payload: {
        packageHash: intent.packageHash,
        intent: intent.kind,
        taskId: intent.taskId,
        sessionId: intent.sessionId,
      },
    };
  else {
    if (
      projection.kind !== "teaching" &&
      projection.kind !== "completed" &&
      projection.kind !== "readiness" &&
      projection.kind !== "reviewSelection"
    )
      throw new Error("Teaching action is unavailable");
    const envelope = {
      ...common,
      scope: {
        kind: "session",
        id: projection.sessionId,
        generation: projection.owner.generation,
      },
      expectedRevision: projection.revision,
    };
    const payload = {
      packageHash: projection.packageHash,
      sessionId: projection.sessionId,
      runId: projection.runId,
    };
    if (projection.kind === "teaching" && !("guidance" in projection.turn)) {
      if (intent.kind !== "continue")
        throw new Error("Legacy preview accepts only Continue");
      draft = {
        ...envelope,
        kind: "advance",
        payload: { ...payload, nodeId: projection.turn.id },
      };
    } else {
      if (projection.checkpointId === null)
        throw new Error("Graph checkpoint is unavailable");
      draft = {
        ...envelope,
        kind: "navigate",
        payload: {
          ...payload,
          checkpointId: projection.checkpointId,
          action: intent,
        },
      };
    }
  }
  if (
    typeof draft !== "object" ||
    draft === null ||
    !("kind" in draft) ||
    !("payload" in draft)
  )
    throw new Error("Command preparation failed");
  return parseCommand({
    ...draft,
    payloadHash: await hash(
      canonical({ kind: draft.kind, payload: draft.payload }),
    ),
  });
}
function sameAuthoredTask({
  previous,
  candidate,
  taskId,
}: {
  previous: InstalledTeaching;
  candidate: InstalledTeaching;
  taskId: TaskId;
}) {
  const before = authoredTaskIdentity({ content: previous.document, taskId });
  return (
    before !== null &&
    before === authoredTaskIdentity({ content: candidate.document, taskId })
  );
}
function catalogFor({
  active,
  context,
  retained,
}: {
  active: InstalledTeaching;
  context: StoredContext;
  retained: ReadonlyMap<import("./types.ts").PackageHash, InstalledTeaching>;
}): readonly CatalogTask[] {
  if (active.body.coverage === "partial-first-m") return [];
  return resolvedLessons(active.document)
    .flatMap((lesson) => lesson.lessonTasks)
    .map((task): CatalogTask => {
      const saved = context.sessions
        .filter(
          (session) =>
            session.taskId === task.id &&
            (session.packageHash === active.key ||
              (() => {
                const previous = retained.get(session.packageHash);
                return (
                  previous !== undefined &&
                  sameAuthoredTask({
                    previous,
                    candidate: active,
                    taskId: task.id,
                  })
                );
              })()) &&
            session.runStatus === "inProgress",
        )
        .sort((a, b) =>
          BigInt(b.lastSelectedSequence ?? "0") >
          BigInt(a.lastSelectedSequence ?? "0")
            ? 1
            : BigInt(b.lastSelectedSequence ?? "0") <
                BigInt(a.lastSelectedSequence ?? "0")
              ? -1
              : a.sessionId.localeCompare(b.sessionId),
        )[0];
      const result = context.taskResults.find(
        (result) => result.taskId === task.id,
      );
      const entry = {
        id: task.id,
        number: task.number,
        title: task.title,
        optional: task.optional,
        completed: result?.outcome === "completed",
        available:
          resolvedTask({ content: active.document, taskId: task.id }) !== null,
        packageHash: active.key,
        savedSessionId: saved?.sessionId ?? null,
      };
      return result?.outcome === "skipped" && task.optional
        ? { ...entry, optional: true, completed: false, skipped: true }
        : entry;
    });
}
function selectionActions({
  active,
  content,
  context,
  catalog,
}: {
  active: InstalledTeaching;
  content: InstalledTeaching;
  context: StoredContext;
  catalog: readonly CatalogTask[];
}): AvailableAction[] {
  const actions: AvailableAction[] = [];
  const current = context.session;
  const sameCompleteTask =
    current !== null &&
    (current.packageHash === active.key ||
      sameAuthoredTask({
        previous: content,
        candidate: active,
        taskId: current.taskId,
      }));
  if (current?.status === "paused")
    actions.push(
      choice("Resume", {
        kind: "resume",
        taskId: current.taskId,
        packageHash: current.packageHash,
        sessionId: current.sessionId,
      }),
    );
  for (const task of catalog) {
    if (!task.available) continue;
    const saved =
      task.savedSessionId === null
        ? undefined
        : context.sessions.find(
            (session) => session.sessionId === task.savedSessionId,
          );
    if (saved) {
      if (saved.sessionId !== current?.sessionId)
        actions.push(
          choice(`Resume Task ${task.number}`, {
            kind: "resume",
            taskId: task.id,
            packageHash: saved.packageHash,
            sessionId: saved.sessionId,
          }),
        );
      continue;
    }
    const incompatibleSaved = context.sessions.find(
      (session) =>
        session.taskId === task.id && session.runStatus === "inProgress",
    );
    if (incompatibleSaved && current?.taskId !== task.id) {
      actions.push(
        choice(`Start full Task ${task.number}`, {
          kind: "restart",
          taskId: task.id,
          packageHash: active.key,
          sessionId: incompatibleSaved.sessionId,
        }),
      );
      continue;
    }
    if (current?.taskId === task.id) {
      if (current.runStatus === "completed" || current.runStatus === "skipped")
        actions.push(
          choice("Replay task", {
            kind: "replay",
            taskId: task.id,
            packageHash: active.key,
            sessionId: current.sessionId,
          }),
        );
      else if (!sameCompleteTask)
        actions.push(
          choice("Start full task", {
            kind: "restart",
            taskId: task.id,
            packageHash: active.key,
            sessionId: current.sessionId,
          }),
        );
    } else
      actions.push(
        choice(`${task.completed ? "Replay" : "Start"} Task ${task.number}`, {
          kind: task.completed ? "replay" : "start",
          taskId: task.id,
          packageHash: active.key,
          sessionId: null,
        }),
      );
  }
  if (
    current?.runStatus === "inProgress" &&
    (current.state.kind === "graph" ||
      current.state.kind === "graphControls") &&
    sameCompleteTask
  ) {
    actions.push(
      choice("Restart task", {
        kind: "restart",
        taskId: current.taskId,
        packageHash: active.key,
        sessionId: current.sessionId,
      }),
    );
  }
  return actions;
}
export function createCoordinator({
  store,
  ids,
  hash,
}: {
  store: TeachingStore;
  ids: IdFactory;
  hash: HashFunction;
}): TeachingApplication & {
  readApplication(target: CourseReadTarget): Promise<ApplicationRead>;
} {
  async function readApplication(
    target: CourseReadTarget,
  ): Promise<ApplicationRead> {
    try {
      const context = await store.current(target);
      const active = await store.resolvePackage(context.activePackageHash);
      const retained = new Map<
        import("./types.ts").PackageHash,
        InstalledTeaching
      >([[active.key, active]]);
      for (const session of context.sessions)
        if (!retained.has(session.packageHash))
          retained.set(
            session.packageHash,
            await store.resolvePackage(session.packageHash),
          );
      const catalog = catalogFor({ active, context, retained });
      const content = await store.resolvePackage(
        context.session?.packageHash ?? context.activePackageHash,
      );
      const selections = selectionActions({
        active,
        content,
        context,
        catalog,
      });
      for (const saved of context.sessions)
        if (
          saved.runStatus === "inProgress" &&
          !selections.some(
            (action) =>
              "sessionId" in action.intent &&
              action.intent.sessionId === saved.sessionId &&
              action.intent.kind === "resume",
          )
        )
          selections.push(
            choice("Resume saved activity", {
              kind: "resume",
              taskId: saved.taskId,
              packageHash: saved.packageHash,
              sessionId: saved.sessionId,
            }),
          );
      function envelope(
        projection: Exclude<CommittedProjection, { kind: "recovery" }>,
      ): ApplicationRead {
        return deepFreeze({
          kind: "ready",
          courseId: active.body.courseId,
          witness: {
            owner: context.owner,
            profileRevision: context.profileRevision,
            activePackageHash: active.key,
            activationRevision: context.activationRevision ?? parseCounter("0"),
            cursorRevision: context.cursorRevision ?? parseCounter("0"),
            selectedSessionRevision: context.session?.revision ?? null,
          },
          course: courseProjection({ active, context, actions: selections }),
          projection,
        });
      }

      if (!context.session) {
        if (active.body.coverage === "partial-first-m")
          selections.push(
            choice("Start", {
              kind: "start",
              taskId: active.body.taskId,
              packageHash: active.key,
              sessionId: null,
            }),
          );
        return envelope({
          kind: "entry",
          owner: context.owner,
          packageHash: active.key,
          title: active.body.title,
          profileRevision: context.profileRevision,
          catalog,
          actions: selections,
        });
      }
      const session = context.session;
      validatePosition(content, session.state, session.taskId);
      const engine = project(content, session.state);
      const writing = writingTask({
        content: content.document,
        taskId: session.taskId,
      });
      const documents = writing
        ? await store.documents?.({ session })
        : undefined;
      if (writing && (!documents || documents.length !== 2))
        throw new Error("Writing documents missing");
      if (
        (session.state.kind === "graph" ||
          session.state.kind === "graphControls") &&
        (completionProof(content, session.state) !== null) !==
          (session.runStatus === "completed")
      )
        throw new Error("Run result does not match its obligations");
      const title =
        content.body.coverage === "partial-first-m"
          ? content.body.title
          : taskDefinition({
              content: content.document,
              taskId: session.taskId,
            }).graph.task.title;
      const taskNumber =
        content.body.coverage === "partial-first-m"
          ? 1
          : taskDefinition({
              content: content.document,
              taskId: session.taskId,
            }).graph.task.number;
      const actions: AvailableAction[] = [];
      if (session.status === "active" && session.runStatus === "inProgress") {
        if (session.state.kind === "graphControls")
          actions.push(
            ...controlActions({
              content,
              state: session.state,
              status: session.runStatus,
            }),
          );
        else if (engine.kind === "teaching")
          actions.push(choice("Continue", { kind: "continue" }));
        if (session.state.kind === "graph") {
          if (session.state.checkpointIndex > 0)
            actions.push(choice("Back", { kind: "back" }));
          if (engine.kind === "teaching") {
            actions.push(choice("Repeat", { kind: "repeat" }));
            const current = engine.turn;
            const graph = graphTask(content.document, session.taskId);
            for (const spec of graph.task.corrections) {
              if (spec.eligibleNodeIds.includes(current.id)) {
                const correctionPreview = graph.nodes.get(
                  spec.instructionNodeId,
                );
                if (!correctionPreview)
                  throw new Error("Correction preview is unavailable");
                actions.push({
                  label: added("Help"),
                  intent: { kind: "help", correctionId: spec.id },
                  correctionPreview: projectPrintedPreview(correctionPreview),
                });
              }
            }
          }
          actions.push(choice("Pause", { kind: "pause" }));
        }
      } else if (
        session.runStatus === "completed" &&
        context.undoRunId === session.runId &&
        (session.state.kind === "graph" ||
          session.state.kind === "graphControls")
      ) {
        if (session.state.kind === "graphControls")
          actions.push(
            ...controlActions({
              content,
              state: session.state,
              status: session.runStatus,
            }),
          );
        else {
          if (session.state.checkpointIndex > 0)
            actions.push(choice("Back", { kind: "back" }));
          if (engine.kind === "teaching")
            actions.push(choice("Continue", { kind: "continue" }));
        }
      }
      if (
        session.state.kind === "writingSkipped" &&
        context.undoRunId === session.runId
      ) {
        if (
          session.state.viewCheckpoint === null ||
          session.state.viewCheckpoint > 0
        )
          actions.push(choice("Back", { kind: "back" }));
        if (session.state.viewCheckpoint !== null)
          actions.push(choice("Continue", { kind: "continue" }));
      }
      if (
        context.undoRunId === session.runId &&
        session.activeAdvanceId &&
        context.cursorRevision !== undefined &&
        (context.cursorSession === undefined ||
          context.cursorSession?.sessionId === session.sessionId)
      )
        actions.push(
          choice("Undo advance", {
            kind: "undoAdvance",
            binding: {
              packageHash: session.packageHash,
              sessionId: session.sessionId,
              runId: session.runId,
              advanceId: session.activeAdvanceId,
              runRevision: session.runRevision,
              profileRevision: context.profileRevision,
              cursorRevision: context.cursorRevision,
              selectionCounter: context.selectionCounter,
            },
          }),
        );
      const publishedEngine: import("./types.ts").EngineProjection =
        writing &&
        documents &&
        (engine.kind === "completed" || engine.kind === "skipped")
          ? { kind: "writingResult", outcome: engine.kind, documents }
          : writing &&
              engine.kind === "teaching" &&
              "presentation" in engine.turn &&
              engine.turn.kind === "turn" &&
              engine.turn.presentation.kind === "writing" &&
              documents
            ? { kind: "writing", turn: engine.turn, documents }
            : engine;
      return envelope({
        ...publishedEngine,
        owner: context.owner,
        packageHash: content.key,
        title,
        profileRevision: context.profileRevision,
        sessionId: session.sessionId,
        runId: session.runId,
        revision: session.revision,
        runStatus: session.runStatus,
        sessionStatus: session.status,
        checkpointId:
          session.state.kind === "graph" ||
          session.state.kind === "graphControls" ||
          session.state.kind === "writingSkipped"
            ? currentCheckpoint(session.state).id
            : null,
        taskId: session.taskId,
        taskNumber,
        selectionCounter: context.selectionCounter,
        catalog,
        actions: [...actions, ...selections],
      });
    } catch {
      return {
        kind: "recovery",
        code: "invalid-position",
        message:
          "Saved teaching and its exact content package could not be verified.",
      };
    }
  }
  async function read(): Promise<CommittedProjection> {
    const view = await readApplication({ kind: "cursor" });
    return view.kind === "ready" ? view.projection : view;
  }
  return {
    open: read,
    read,
    readApplication,
    async dispatch(input) {
      return store.transaction((tx) =>
        dispatchTeachingInTransaction({ input, tx, store, ids, hash }),
      );
    },
  };
}

export async function dispatchTeachingInTransaction({
  input,
  tx,
  store,
  ids,
  hash,
}: {
  input: TeachingCommand;
  tx: TeachingTransaction;
  store: Pick<TeachingStore, "resolvePackage">;
  ids: IdFactory;
  hash: HashFunction;
}): Promise<CommandResult> {
  const reject = (code: string, message: string): CommandResult => ({
    kind: "rejected",
    code,
    message,
  });
  const command = parseCommand(input);
  if (
    (await hash(
      canonical({ kind: command.kind, payload: command.payload }),
    )) !== command.payloadHash
  )
    return reject("payload-hash", "Command payload hash does not match.");
  let content: InstalledTeaching | undefined;
  try {
    content = await store.resolvePackage(command.payload.packageHash);
  } catch {}
  if (command.scope.generation !== command.owner.generation)
    return reject("stale-owner", "Command owner generation changed.");
  const context = await tx.context(command.owner);
  if (!context) return reject("stale-owner", "Command owner no longer exists.");
  if (
    command.scope.kind === "profile" &&
    command.scope.id !== context.owner.profileId
  )
    return reject("wrong-scope", "Command profile does not match.");
  if (
    command.scope.kind === "session" &&
    !context.ownedSessionIds.includes(command.scope.id)
  )
    return reject(
      "wrong-scope",
      "Command session is not owned by this profile.",
    );
  const saved = await tx.receipt(command);
  if (saved)
    return saved.payloadHash === command.payloadHash
      ? saved.result
      : reject(
          "command-identity",
          "Command identity was reused with a changed payload.",
        );
  if (!content || content.key !== command.payload.packageHash)
    return reject(
      "missing-package",
      "Exact command content package is unavailable.",
    );
  if (
    command.kind === "start" ||
    command.kind === "select" ||
    command.kind === "writingSelect"
  ) {
    if (
      context.session &&
      writingTask({
        content: (await store.resolvePackage(context.session.packageHash))
          .document,
        taskId: context.session.taskId,
      }) &&
      context.session.status === "active" &&
      context.session.runStatus === "inProgress" &&
      command.kind !== "writingSelect"
    )
      return reject(
        "writing-fence",
        "Pause writing with committed documents before selecting a task.",
      );
    if (
      command.kind === "writingSelect" &&
      (!context.session ||
        !tx.writingBarrier ||
        !(await tx.writingBarrier({
          session: context.session,
          barrier: command.payload.barrier,
        })))
    )
      return reject("writing-barrier", "Writing selection barrier changed.");
    if (command.expectedRevision !== context.profileRevision)
      return reject("stale-revision", "Profile changed before this selection.");
    let selection: SelectionPlan;
    if (
      (command.kind === "select" || command.kind === "writingSelect") &&
      command.payload.intent === "resume"
    ) {
      const target = context.sessions.find(
        (session) => session.sessionId === command.payload.sessionId,
      );
      if (
        !target ||
        target.taskId !== command.payload.taskId ||
        target.packageHash !== content.key ||
        target.runStatus !== "inProgress" ||
        target.status === "closed"
      )
        return reject("wrong-target", "Saved run is unavailable for Resume.");
      selection = { kind: "resume", session: target };
    } else {
      if (content.key !== context.activePackageHash)
        return reject(
          "inactive-package",
          "New runs use the active content package.",
        );
      let taskId: TaskId;
      let replaceSessionId = null;
      if (command.kind === "start") {
        if (content.body.coverage !== "partial-first-m" || context.session)
          return reject("already-started", "Choose an explicit task action.");
        taskId = content.body.taskId;
      } else {
        taskId = command.payload.taskId;
        if (content.body.coverage === "partial-first-m")
          return reject("legacy-start", "Legacy preview can only be resumed.");
        try {
          taskDefinition({ content: content.document, taskId });
        } catch {
          return reject(
            "task-unavailable",
            "Task is unavailable in the active package.",
          );
        }
        if (
          command.payload.intent === "restart" ||
          command.payload.intent === "replay"
        ) {
          const target = context.sessions.find(
            (session) => session.sessionId === command.payload.sessionId,
          );
          const needed =
            command.payload.intent === "restart" ? "inProgress" : "terminal";
          if (
            command.payload.intent === "replay" &&
            command.payload.sessionId === null
          ) {
            if (
              !context.taskResults.some(
                (result) =>
                  result.taskId === taskId && result.outcome === "completed",
              )
            )
              return reject(
                "wrong-target",
                "Replay needs an existing valid task result.",
              );
          } else {
            if (
              !target ||
              target.taskId !== taskId ||
              (needed === "terminal"
                ? target.runStatus === "inProgress"
                : target.runStatus !== needed)
            )
              return reject(
                "wrong-target",
                "Explicit replacement does not match its saved task.",
              );
            replaceSessionId = target.sessionId;
          }
        } else if (command.payload.sessionId !== null)
          return reject(
            "wrong-target",
            "Start cannot silently replace a saved run.",
          );
        const live = context.sessions.find(
          (session) =>
            session.taskId === taskId && session.runStatus === "inProgress",
        );
        if (live && live.sessionId !== replaceSessionId)
          return reject(
            "saved-run-exists",
            "Resume or explicitly restart this saved task.",
          );
      }
      selection = {
        kind: "new",
        sessionId: parseId({ kind: "session", value: ids() }),
        runId: parseId({ kind: "run", value: ids() }),
        taskId,
        state: initialState(content, taskId),
        replaceSessionId,
      };
    }
    await tx.ensurePackage(content);
    const receipt: CommitReceipt = {
      kind: "committed",
      commandId: command.commandId,
      owner: context.owner,
      sessionId:
        selection.kind === "new"
          ? selection.sessionId
          : selection.session.sessionId,
      runId:
        selection.kind === "new" ? selection.runId : selection.session.runId,
      revision: increment(context.profileRevision),
      packageHash: content.key,
    };
    await tx.select({ command, context, content, selection, receipt });
    return receipt;
  }
  const session = context.session;
  if (
    !session ||
    session.sessionId !== command.scope.id ||
    session.sessionId !== command.payload.sessionId ||
    session.runId !== command.payload.runId ||
    session.packageHash !== command.payload.packageHash
  )
    return reject(
      "wrong-target",
      "Command does not target the selected teaching run.",
    );
  if (command.expectedRevision !== session.revision)
    return reject("stale-revision", "Teaching changed before this command.");
  if (command.kind === "undoAdvance" || command.kind === "writingUndoAdvance") {
    const binding = command.payload;
    if (
      !tx.undoAdvance ||
      context.undoRunId !== session.runId ||
      session.activeAdvanceId !== binding.advanceId ||
      session.runRevision !== binding.runRevision ||
      context.profileRevision !== binding.profileRevision ||
      context.cursorRevision !== binding.cursorRevision ||
      context.selectionCounter !== binding.selectionCounter
    )
      return reject("stale-undo", "The saved Undo advance window changed.");
    const writing =
      writingTask({ content: content.document, taskId: session.taskId }) !==
      null;
    if (
      writing
        ? command.kind !== "writingUndoAdvance" ||
          !tx.writingBarrier ||
          !(await tx.writingBarrier({
            session,
            barrier: command.payload.barrier,
          }))
        : command.kind !== "undoAdvance"
    )
      return reject(
        "writing-barrier",
        "Undo requires the current committed writing documents.",
      );
    await tx.ensurePackage(content);
    const receipt: CommitReceipt = {
      kind: "committed",
      commandId: command.commandId,
      owner: context.owner,
      sessionId: session.sessionId,
      runId: session.runId,
      revision: increment(session.revision),
      packageHash: content.key,
    };
    await tx.undoAdvance({
      command,
      context: { ...context, session },
      content,
      receipt,
    });
    return receipt;
  }
  if (
    session.status === "paused" ||
    (session.status === "closed" && context.undoRunId !== session.runId)
  )
    return reject("not-active", "Resume the saved run before teaching.");
  const isWriting =
    writingTask({ content: content.document, taskId: session.taskId }) !== null;
  if (isWriting) {
    if (
      (command.kind !== "writingNavigate" &&
        command.kind !== "writingControl") ||
      !tx.writingBarrier ||
      !(await tx.writingBarrier({
        session,
        barrier: command.payload.barrier,
      }))
    )
      return reject(
        "writing-barrier",
        "Committed writing documents changed or retain an active capture.",
      );
  } else if (
    command.kind === "writingNavigate" ||
    command.kind === "writingControl"
  )
    return reject("wrong-task", "Writing command requires a writing task.");
  if (command.kind === "writingControl") {
    const document = command.payload.barrier.documents.find(
      (token) => token.documentId === command.payload.documentId,
    );
    if (
      !document ||
      session.status !== "active" ||
      session.runStatus !== "inProgress" ||
      (session.state.kind !== "graph" &&
        session.state.kind !== "graphControls") ||
      currentCheckpoint(session.state).id !== command.payload.checkpointId ||
      !writingPermission({
        content: content.document,
        state: session.state,
        targetId: document.targetId,
      }).writable ||
      layerForPhase(document.phase) !== command.payload.layer ||
      !tx.applyWritingControl
    )
      return reject(
        "invalid-control",
        "Practice control is unavailable at this saved position.",
      );
    const receipt: CommitReceipt = {
      kind: "committed",
      commandId: command.commandId,
      owner: context.owner,
      sessionId: session.sessionId,
      runId: session.runId,
      revision: increment(session.revision),
      packageHash: content.key,
    };
    if (
      !(await tx.applyWritingControl({
        command,
        context: { ...context, session },
        receipt,
      }))
    )
      return reject(
        "invalid-control",
        "Practice control is unavailable at this saved position.",
      );
    return receipt;
  }
  let plan: TransitionPlan;
  try {
    if (command.kind === "advance") {
      if (session.runStatus !== "inProgress" || session.status !== "active")
        throw new Error("Legacy run is not active");
      plan = {
        kind: "acceptance",
        after: evaluate(content, session.state, command.payload.nodeId),
        occurrenceId: command.payload.nodeId,
      };
    } else {
      if (
        (session.state.kind !== "graph" &&
          session.state.kind !== "graphControls" &&
          session.state.kind !== "writingSkipped") ||
        currentCheckpoint(session.state).id !== command.payload.checkpointId
      )
        throw new Error("Checkpoint changed");
      if (
        session.runStatus === "completed" &&
        command.payload.action.kind !== "back" &&
        command.payload.action.kind !== "continue"
      )
        throw new Error("Closed run is review only");
      plan = evaluateGraph({
        content,
        state: session.state,
        status: session.runStatus,
        action: command.payload.action,
      });
    }
  } catch {
    return reject(
      "invalid-action",
      "Parent action is unavailable at this saved position.",
    );
  }
  await tx.ensurePackage(content);
  const receipt: CommitReceipt = {
    kind: "committed",
    commandId: command.commandId,
    owner: context.owner,
    sessionId: session.sessionId,
    runId: session.runId,
    revision: increment(session.revision),
    packageHash: content.key,
  };
  const application = {
    command,
    context: { ...context, session },
    content,
    before: session.state,
    receipt,
  };
  if (
    plan.kind === "acceptance" ||
    plan.kind === "completion" ||
    plan.kind === "skip"
  )
    await tx.apply({
      ...application,
      plan,
      advanceId: parseId({ kind: "advance", value: ids() }),
    });
  else await tx.apply({ ...application, plan, advanceId: null });
  return receipt;
}

export async function prepareWritingCommand({
  projection,
  action,
  barrier,
  ids,
  hash,
}: {
  projection: CommittedProjection;
  action: AvailableAction;
  barrier: import("./types.ts").WritingBarrier;
  ids: IdFactory;
  hash: HashFunction;
}): Promise<TeachingCommand> {
  if (
    projection.kind === "entry" ||
    projection.kind === "recovery" ||
    projection.checkpointId === null ||
    !projection.actions.some(
      (candidate) => canonical(candidate) === canonical(action),
    )
  )
    throw new Error("Writing action capability unavailable");
  const intent = action.intent;
  if (
    intent.kind === "start" ||
    intent.kind === "resume" ||
    intent.kind === "restart" ||
    intent.kind === "replay"
  ) {
    switch (projection.runStatus) {
      case "completed":
      case "skipped":
        return prepareCommand({
          projection,
          request: { kind: "action", action },
          ids,
          hash,
        });
      case "inProgress":
        break;
      default: {
        const exhaustive: never = projection.runStatus;
        throw new Error(`Unknown run status ${String(exhaustive)}`);
      }
    }
    const payload = {
      packageHash: intent.packageHash,
      intent: intent.kind,
      taskId: intent.taskId,
      sessionId: intent.sessionId,
      barrier,
    };
    return parseCommand({
      kind: "writingSelect",
      commandId: ids(),
      owner: projection.owner,
      scope: {
        kind: "profile",
        id: projection.owner.profileId,
        generation: projection.owner.generation,
      },
      expectedRevision: projection.profileRevision,
      payload,
      payloadHash: await hash(canonical({ kind: "writingSelect", payload })),
    });
  }
  if (intent.kind === "undoAdvance") {
    const payload = { ...intent.binding, barrier };
    return parseCommand({
      kind: "writingUndoAdvance",
      commandId: ids(),
      owner: projection.owner,
      scope: {
        kind: "session",
        id: projection.sessionId,
        generation: projection.owner.generation,
      },
      expectedRevision: projection.revision,
      payload,
      payloadHash: await hash(
        canonical({ kind: "writingUndoAdvance", payload }),
      ),
    });
  }
  const payload = {
    packageHash: projection.packageHash,
    sessionId: projection.sessionId,
    runId: projection.runId,
    checkpointId: projection.checkpointId,
    action: intent,
    barrier,
  };
  return parseCommand({
    kind: "writingNavigate",
    commandId: ids(),
    owner: projection.owner,
    scope: {
      kind: "session",
      id: projection.sessionId,
      generation: projection.owner.generation,
    },
    expectedRevision: projection.revision,
    payload,
    payloadHash: await hash(canonical({ kind: "writingNavigate", payload })),
  });
}

export async function prepareWritingControl({
  projection,
  control,
  documentId,
  layer,
  barrier,
  ids,
  hash,
  reserve,
}: {
  projection: CommittedProjection;
  control: import("./ink-history.ts").PracticeControl;
  documentId: import("./types.ts").DocumentId;
  layer: import("./ink-history.ts").ChildPracticeLayer;
  barrier: import("./types.ts").WritingBarrier;
  ids: IdFactory;
  hash: HashFunction;
  reserve?: (canonicalEnvelope: string) => void;
}): Promise<Extract<TeachingCommand, { kind: "writingControl" }>> {
  if (projection.kind !== "writing" || projection.checkpointId === null)
    throw new Error("Practice control unavailable");
  const payload = {
    packageHash: projection.packageHash,
    sessionId: projection.sessionId,
    runId: projection.runId,
    checkpointId: projection.checkpointId,
    barrier,
    documentId,
    layer,
    control,
  };
  const envelope = deepFreeze({
    kind: "writingControl",
    commandId: ids(),
    owner: projection.owner,
    scope: {
      kind: "session",
      id: projection.sessionId,
      generation: projection.owner.generation,
    },
    expectedRevision: projection.revision,
    payload,
    payloadHash: "0".repeat(64),
  });
  reserve?.(canonical(envelope));
  const command = parseCommand({
    ...envelope,
    payloadHash: await hash(canonical({ kind: "writingControl", payload })),
  });
  if (command.kind !== "writingControl")
    throw new Error("Invalid practice command");
  return command;
}
