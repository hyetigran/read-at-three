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
  DevelopmentPackage,
  HashFunction,
  IdFactory,
  TeachingApplication,
  TeachingCommand,
  TeachingStore,
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
  if (
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
function catalogFor(
  active: DevelopmentPackage,
  context: StoredContext,
): readonly CatalogTask[] {
  if (active.body.coverage === "partial-first-m") return [];
  return active.body.lessonTasks.map((task) => {
    const saved = context.sessions
      .filter(
        (session) =>
          session.taskId === task.id &&
          session.packageHash === active.packageHash &&
          session.runStatus === "inProgress",
      )
      .sort((a, b) => a.sessionId.localeCompare(b.sessionId))[0];
    return {
      ...task,
      completed: context.completedTaskIds.includes(task.id),
      available:
        active.body.coverage !== "partial-first-m" &&
        active.body.tasks.some(
          (entry) => ("task" in entry ? entry.task.id : entry.id) === task.id,
        ),
      packageHash: active.packageHash,
      savedSessionId: saved?.sessionId ?? null,
    };
  });
}
function selectionActions(
  active: DevelopmentPackage,
  context: StoredContext,
  catalog: readonly CatalogTask[],
): AvailableAction[] {
  const actions: AvailableAction[] = [];
  const current = context.session;
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
    if (current?.taskId === task.id) {
      if (current.runStatus === "completed")
        actions.push(
          choice("Replay task", {
            kind: "replay",
            taskId: task.id,
            packageHash: active.packageHash,
            sessionId: current.sessionId,
          }),
        );
      else if (current.packageHash !== active.packageHash)
        actions.push(
          choice("Start full task", {
            kind: "restart",
            taskId: task.id,
            packageHash: active.packageHash,
            sessionId: current.sessionId,
          }),
        );
    } else
      actions.push(
        choice(`${task.completed ? "Replay" : "Start"} Task ${task.number}`, {
          kind: task.completed ? "replay" : "start",
          taskId: task.id,
          packageHash: active.packageHash,
          sessionId: null,
        }),
      );
  }
  if (
    current?.runStatus === "inProgress" &&
    (current.state.kind === "graph" ||
      current.state.kind === "graphControls") &&
    current.packageHash === active.packageHash
  ) {
    actions.push(
      choice("Restart task", {
        kind: "restart",
        taskId: current.taskId,
        packageHash: active.packageHash,
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
}): TeachingApplication {
  const reject = (code: string, message: string): CommandResult => ({
    kind: "rejected",
    code,
    message,
  });
  async function read(): Promise<CommittedProjection> {
    try {
      const context = await store.current();
      const active = await store.resolvePackage(context.activePackageHash);
      const catalog = catalogFor(active, context);
      const selections = selectionActions(active, context, catalog);
      if (!context.session) {
        if (active.body.coverage === "partial-first-m")
          selections.push(
            choice("Start", {
              kind: "start",
              taskId: active.body.taskId,
              packageHash: active.packageHash,
              sessionId: null,
            }),
          );
        return deepFreeze({
          kind: "entry",
          owner: context.owner,
          packageHash: active.packageHash,
          title: active.body.title,
          profileRevision: context.profileRevision,
          catalog,
          actions: selections,
        });
      }
      const session = context.session;
      const content = await store.resolvePackage(session.packageHash);
      validatePosition(content, session.state, session.taskId);
      const engine = project(content, session.state);
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
          : taskDefinition({ content, taskId: session.taskId }).graph.task
              .title;
      const taskNumber =
        content.body.coverage === "partial-first-m"
          ? 1
          : taskDefinition({ content, taskId: session.taskId }).graph.task
              .number;
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
            const graph = graphTask(content, session.taskId);
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
                  correctionPreview,
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
      return deepFreeze({
        ...engine,
        owner: context.owner,
        packageHash: content.packageHash,
        title,
        profileRevision: context.profileRevision,
        sessionId: session.sessionId,
        runId: session.runId,
        revision: session.revision,
        runStatus: session.runStatus,
        sessionStatus: session.status,
        checkpointId:
          session.state.kind === "graph" ||
          session.state.kind === "graphControls"
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
  return {
    open: read,
    read,
    async dispatch(input) {
      const command = parseCommand(input);
      if (
        (await hash(
          canonical({ kind: command.kind, payload: command.payload }),
        )) !== command.payloadHash
      )
        return reject("payload-hash", "Command payload hash does not match.");
      let content: DevelopmentPackage | undefined;
      try {
        content = await store.resolvePackage(command.payload.packageHash);
      } catch {}
      return store.transaction(async (tx) => {
        if (command.scope.generation !== command.owner.generation)
          return reject("stale-owner", "Command owner generation changed.");
        const context = await tx.context(command.owner);
        if (!context)
          return reject("stale-owner", "Command owner no longer exists.");
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
        if (!content || content.packageHash !== command.payload.packageHash)
          return reject(
            "missing-package",
            "Exact command content package is unavailable.",
          );
        if (command.kind === "start" || command.kind === "select") {
          if (command.expectedRevision !== context.profileRevision)
            return reject(
              "stale-revision",
              "Profile changed before this selection.",
            );
          let selection: SelectionPlan;
          if (
            command.kind === "select" &&
            command.payload.intent === "resume"
          ) {
            const target = context.sessions.find(
              (session) => session.sessionId === command.payload.sessionId,
            );
            if (
              !target ||
              target.taskId !== command.payload.taskId ||
              target.packageHash !== content.packageHash ||
              target.runStatus !== "inProgress" ||
              target.status === "closed"
            )
              return reject(
                "wrong-target",
                "Saved run is unavailable for Resume.",
              );
            selection = { kind: "resume", session: target };
          } else {
            if (content.packageHash !== context.activePackageHash)
              return reject(
                "inactive-package",
                "New runs use the active content package.",
              );
            let taskId: TaskId;
            let replaceSessionId = null;
            if (command.kind === "start") {
              if (
                content.body.coverage !== "partial-first-m" ||
                context.session
              )
                return reject(
                  "already-started",
                  "Choose an explicit task action.",
                );
              taskId = content.body.taskId;
            } else {
              taskId = command.payload.taskId;
              if (content.body.coverage === "partial-first-m")
                return reject(
                  "legacy-start",
                  "Legacy preview can only be resumed.",
                );
              try {
                taskDefinition({ content, taskId });
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
                  command.payload.intent === "restart"
                    ? "inProgress"
                    : "completed";
                if (
                  command.payload.intent === "replay" &&
                  command.payload.sessionId === null
                ) {
                  if (!context.completedTaskIds.includes(taskId))
                    return reject(
                      "wrong-target",
                      "Replay needs an existing valid task result.",
                    );
                } else {
                  if (
                    !target ||
                    target.taskId !== taskId ||
                    target.runStatus !== needed
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
                  session.taskId === taskId &&
                  session.packageHash === content.packageHash &&
                  session.runStatus === "inProgress",
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
              selection.kind === "new"
                ? selection.runId
                : selection.session.runId,
            revision: increment(context.profileRevision),
            packageHash: content.packageHash,
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
          return reject(
            "stale-revision",
            "Teaching changed before this command.",
          );
        if (
          session.status === "paused" ||
          (session.status === "closed" && context.undoRunId !== session.runId)
        )
          return reject("not-active", "Resume the saved run before teaching.");
        let plan: TransitionPlan;
        try {
          if (command.kind === "advance") {
            if (
              session.runStatus !== "inProgress" ||
              session.status !== "active"
            )
              throw new Error("Legacy run is not active");
            plan = {
              kind: "acceptance",
              after: evaluate(content, session.state, command.payload.nodeId),
              occurrenceId: command.payload.nodeId,
            };
          } else {
            if (
              (session.state.kind !== "graph" &&
                session.state.kind !== "graphControls") ||
              currentCheckpoint(session.state).id !==
                command.payload.checkpointId
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
          packageHash: content.packageHash,
        };
        const application = {
          command,
          context: { ...context, session },
          content,
          before: session.state,
          receipt,
        };
        if (plan.kind === "acceptance" || plan.kind === "completion")
          await tx.apply({
            ...application,
            plan,
            advanceId: parseId({ kind: "advance", value: ids() }),
          });
        else await tx.apply({ ...application, plan, advanceId: null });
        return receipt;
      });
    },
  };
}
