import {
  canonical,
  deepFreeze,
  increment,
  parseCommand,
  parseId,
} from "./content.ts";
import { evaluate, initialState, project } from "./engine.ts";
import type {
  CommittedProjection,
  DevelopmentPackage,
  HashFunction,
  IdFactory,
  TeachingApplication,
  TeachingCommand,
  TeachingStore,
  CommitReceipt,
  CommandResult,
} from "./types.ts";
export async function prepareCommand({
  projection,
  ids,
  hash,
}: {
  projection: CommittedProjection;
  ids: IdFactory;
  hash: HashFunction;
}): Promise<TeachingCommand> {
  if (projection.kind === "recovery" || projection.kind === "frontier")
    throw new Error("No command is available");
  const common = { commandId: ids(), owner: projection.owner };
  const draft =
    projection.kind === "entry"
      ? ({
          ...common,
          kind: "start",
          scope: {
            kind: "profile",
            id: projection.owner.profileId,
            generation: projection.owner.generation,
          },
          expectedRevision: projection.profileRevision,
          payload: { packageHash: projection.packageHash },
        } as const)
      : ({
          ...common,
          kind: "advance",
          scope: {
            kind: "session",
            id: projection.sessionId,
            generation: projection.owner.generation,
          },
          expectedRevision: projection.revision,
          payload: {
            packageHash: projection.packageHash,
            sessionId: projection.sessionId,
            runId: projection.runId,
            nodeId: projection.turn.id,
          },
        } as const);
  return parseCommand({
    ...draft,
    payloadHash: await hash(
      canonical({ kind: draft.kind, payload: draft.payload }),
    ),
  });
}
export function createCoordinator({
  store,
  content,
  ids,
  hash,
}: {
  store: TeachingStore;
  content: DevelopmentPackage;
  ids: IdFactory;
  hash: HashFunction;
}): TeachingApplication {
  const reject = (code: string, message: string): CommandResult => ({
    kind: "rejected",
    code,
    message,
  });
  async function read(): Promise<CommittedProjection> {
    const context = await store.current();
    const common = {
      owner: context.owner,
      packageHash: content.packageHash,
      title: content.body.title,
    };
    if (!context.session)
      return deepFreeze({
        ...common,
        kind: "entry",
        profileRevision: context.profileRevision,
      });
    if (context.session.packageHash !== content.packageHash)
      return {
        kind: "recovery",
        code: "missing-package",
        message: "Saved teaching needs its exact content package.",
      };
    try {
      return deepFreeze({
        ...common,
        sessionId: context.session.sessionId,
        runId: context.session.runId,
        revision: context.session.revision,
        ...project(content, context.session.state),
      });
    } catch {
      return {
        kind: "recovery",
        code: "invalid-position",
        message: "Saved teaching position could not be verified.",
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
          (!context.session || context.session.sessionId !== command.scope.id)
        )
          return reject("wrong-scope", "Command session is not current.");
        const saved = await tx.receipt(command);
        if (saved)
          return saved.payloadHash === command.payloadHash
            ? saved.result
            : reject(
                "command-identity",
                "Command identity was reused with a changed payload.",
              );
        if (command.payload.packageHash !== content.packageHash)
          return reject(
            "missing-package",
            "Exact command content package is unavailable.",
          );
        if (command.kind === "start") {
          if (command.expectedRevision !== context.profileRevision)
            return reject(
              "stale-revision",
              "Profile changed before this command.",
            );
          if (context.session)
            return reject("already-started", "Saved teaching must be resumed.");
          const sessionId = parseId({ kind: "session", value: ids() });
          const runId = parseId({ kind: "run", value: ids() });
          const receipt: CommitReceipt = {
            kind: "committed",
            commandId: command.commandId,
            owner: context.owner,
            sessionId,
            runId,
            revision: increment(context.profileRevision),
            packageHash: content.packageHash,
          };
          await tx.start({
            command,
            content,
            state: initialState(content),
            sessionId,
            runId,
            receipt,
          });
          return receipt;
        }
        const session = context.session;
        if (
          !session ||
          session.sessionId !== command.payload.sessionId ||
          session.runId !== command.payload.runId ||
          session.packageHash !== command.payload.packageHash
        )
          return reject(
            "wrong-target",
            "Command does not target current teaching.",
          );
        if (command.expectedRevision !== session.revision)
          return reject(
            "stale-revision",
            "Teaching changed before this command.",
          );
        let after;
        try {
          after = evaluate(content, session.state, command.payload.nodeId);
        } catch {
          return reject(
            "invalid-advance",
            "Parent acceptance is unavailable at this position.",
          );
        }
        const receipt: CommitReceipt = {
          kind: "committed",
          commandId: command.commandId,
          owner: context.owner,
          sessionId: session.sessionId,
          runId: session.runId,
          revision: increment(session.revision),
          packageHash: content.packageHash,
        };
        await tx.advance({
          command,
          context: { ...context, session },
          before: session.state,
          after,
          advanceId: parseId({ kind: "advance", value: ids() }),
          receipt,
        });
        return receipt;
      });
    },
  };
}
