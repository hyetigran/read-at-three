import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCoordinator,
  initialState,
  parseCounter,
  parseId,
  prepareCommand,
  parseProjection,
  evaluateGraph,
  canonical,
  parseCommand,
} from "../../packages/teaching/src/index.ts";
import type {
  AvailableAction,
  CommittedProjection,
  DevelopmentPackage,
  GraphTeachingState,
  StoredContext,
  StoredSession,
  TeachingStore,
  TeachingTransaction,
  TeachingCommand,
  CommitReceipt,
  PayloadHash,
} from "../../packages/teaching/src/index.ts";
import { graphFixture, task1, task4, hash } from "./graph-fixture.ts";
const id = parseId;
const count = parseCounter;
function state(content: DevelopmentPackage, task = task1): GraphTeachingState {
  const result = initialState(content, task);
  if (result.kind !== "graph") throw new Error("Expected graph");
  return result;
}
function session(
  content: DevelopmentPackage,
  task = task1,
  suffix = "a",
): StoredSession {
  return {
    sessionId: id({ kind: "session", value: `session-${suffix}` }),
    runId: id({ kind: "run", value: `run-${suffix}` }),
    revision: count("0"),
    runRevision: count("0"),
    packageHash: content.packageHash,
    lessonId: content.body.lessonId,
    taskId: task,
    status: "active",
    runStatus: "inProgress",
    state: state(content, task),
    activeAdvanceId: null,
    nextAdvanceSeq: count("1"),
  };
}
function harness(
  content: DevelopmentPackage,
  selected: StoredSession | null = null,
) {
  let context: StoredContext = {
    owner: {
      profileId: id({ kind: "profile", value: "p" }),
      generation: count("0"),
    },
    profileRevision: count("0"),
    undoRunId: selected?.runId ?? null,
    completedTaskIds: [],
    activePackageHash: content.packageHash,
    selectionCounter: count("0"),
    session: selected,
    sessions: selected ? [selected] : [],
  };
  let unavailable = false;
  const receipts = new Map<
    string,
    { payloadHash: PayloadHash; result: CommitReceipt }
  >();
  const selections: Parameters<TeachingTransaction["select"]>[0][] = [];
  const applications: Parameters<TeachingTransaction["apply"]>[0][] = [];
  const tx: TeachingTransaction = {
    async context(owner) {
      return owner.generation === context.owner.generation &&
        owner.profileId === context.owner.profileId
        ? context
        : null;
    },
    async receipt(command) {
      return receipts.get(command.commandId) ?? null;
    },
    async ensurePackage(exact) {
      assert.equal(exact.packageHash, content.packageHash);
    },
    async select(input) {
      selections.push(input);
    },
    async apply(input) {
      applications.push(input);
    },
  };
  const store: TeachingStore = {
    async current() {
      return context;
    },
    async resolvePackage(packageHash) {
      if (unavailable || packageHash !== content.packageHash)
        throw new Error("Unavailable");
      return content;
    },
    async transaction(work) {
      return work(tx);
    },
  };
  let next = 0;
  const ids = () => `generated-${++next}`;
  const app = createCoordinator({ store, ids, hash });
  return {
    app,
    selections,
    applications,
    receipts,
    ids,
    get context() {
      return context;
    },
    set context(value: StoredContext) {
      context = value;
    },
    set unavailable(value: boolean) {
      unavailable = value;
    },
  };
}
function ready(view: CommittedProjection) {
  if (view.kind === "recovery") throw new Error(view.message);
  return view;
}
function action(
  view: CommittedProjection,
  kind: AvailableAction["intent"]["kind"],
  task?: string,
) {
  const found = ready(view).actions.find(
    (entry) =>
      entry.intent.kind === kind &&
      (task === undefined ||
        ("taskId" in entry.intent && entry.intent.taskId === task)),
  );
  if (!found) throw new Error(`Missing ${kind} action`);
  return found;
}
async function prepared(
  h: ReturnType<typeof harness>,
  view: CommittedProjection,
  choice: AvailableAction,
) {
  return prepareCommand({ projection: view, action: choice, ids: h.ids, hash });
}
async function rehash(command: TeachingCommand) {
  return parseCommand({
    ...command,
    payloadHash: await hash(
      canonical({ kind: command.kind, payload: command.payload }),
    ),
  });
}

test("catalog offers only installed tasks and selection plans fresh fixed required occurrences", async () => {
  const content = await graphFixture();
  const h = harness(content);
  const view = ready(await h.app.read());
  assert.equal(view.kind, "entry");
  assert.deepEqual(
    view.catalog.filter((task) => task.available).map((task) => task.number),
    [1, 4],
  );
  assert(view.catalog.every((task) => !task.completed));
  const command = await prepared(h, view, action(view, "start", task4));
  assert.equal(command.kind, "select");
  assert.equal(command.scope.kind, "profile");
  assert(Object.isFrozen(command.payload));
  const result = await h.app.dispatch(command);
  assert.equal(result.kind, "committed");
  const plan = h.selections[0]?.selection;
  assert(plan && plan.kind === "new");
  assert.equal(plan.taskId, task4);
  assert.equal(plan.state.kind, "graph");
  if (plan.state.kind !== "graph") throw new Error("Expected graph");
  assert.equal(plan.state.acceptedOccurrenceIds.length, 0);
  assert.equal(plan.state.occurrences.length, 2);
  assert.equal(h.applications.length, 0);
});

test("paused projection exposes Resume without Continue and Resume uses profile revision CAS", async () => {
  const content = await graphFixture();
  const selected = {
    ...session(content),
    status: "paused",
  } satisfies StoredSession;
  const h = harness(content, selected);
  h.context = { ...h.context, profileRevision: count("12") };
  const view = parseProjection(await h.app.read());
  assert(view.kind === "teaching");
  assert.equal(view.sessionStatus, "paused");
  assert(
    !view.actions.some((entry) =>
      ["continue", "back", "repeat", "help", "pause"].includes(
        entry.intent.kind,
      ),
    ),
  );
  const command = await prepared(h, view, action(view, "resume"));
  assert.equal(command.expectedRevision, "12");
  assert.equal(command.scope.kind, "profile");
  assert.equal((await h.app.dispatch(command)).kind, "committed");
  const plan = h.selections[0]?.selection;
  assert(plan && plan.kind === "resume");
  assert.equal(plan.session.runId, selected.runId);
  assert.deepEqual(plan.session.state, selected.state);
});

test("stale Resume cannot steal selection even when the paused target session revision is unchanged", async () => {
  const content = await graphFixture();
  const a = session(content);
  const b = {
    ...session(content, task4, "b"),
    status: "paused",
  } satisfies StoredSession;
  const h = harness(content, a);
  h.context = { ...h.context, sessions: [a, b] };
  const view = await h.app.read();
  const command = await prepared(h, view, action(view, "resume", task4));
  h.context = {
    ...h.context,
    profileRevision: count("1"),
    selectionCounter: count("1"),
  };
  const result = await h.app.dispatch(command);
  assert.deepEqual(result, {
    kind: "rejected",
    code: "stale-revision",
    message: "Profile changed before this selection.",
  });
  assert.equal(h.selections.length, 0);
  assert.equal(b.revision, "0");
});

test("session commands recheck the selected cursor before accepting another owned run", async () => {
  const content = await graphFixture();
  const a = session(content);
  const b = session(content, task4, "b");
  const h = harness(content, a);
  h.context = { ...h.context, sessions: [a, b] };
  const view = await h.app.read();
  const command = await prepared(h, view, action(view, "continue"));
  h.context = { ...h.context, session: b };
  const result = await h.app.dispatch(command);
  assert.equal(result.kind, "rejected");
  if (result.kind !== "rejected") throw new Error("Expected rejection");
  assert.equal(result.code, "wrong-target");
  assert.equal(h.applications.length, 0);
});

test("retained matching receipt wins over stale revision and unavailable package after ownership checks", async () => {
  const content = await graphFixture();
  const selected = session(content);
  const h = harness(content, selected);
  const view = await h.app.read();
  const command = await prepared(h, view, action(view, "continue"));
  const receipt: CommitReceipt = {
    kind: "committed",
    commandId: command.commandId,
    owner: command.owner,
    sessionId: selected.sessionId,
    runId: selected.runId,
    revision: count("1"),
    packageHash: content.packageHash,
  };
  h.receipts.set(command.commandId, {
    payloadHash: command.payloadHash,
    result: receipt,
  });
  h.unavailable = true;
  const changedSession = { ...selected, revision: count("99") };
  h.context = {
    ...h.context,
    session: changedSession,
    sessions: [changedSession],
  };
  assert.deepEqual(await h.app.dispatch(command), receipt);
  assert.equal(h.applications.length, 0);
  if (command.kind !== "navigate") throw new Error("Expected navigate");
  const changed = await rehash({
    ...command,
    payload: { ...command.payload, action: { kind: "back" } },
  });
  const wrongIdentity = await h.app.dispatch(changed);
  assert.equal(wrongIdentity.kind, "rejected");
  if (wrongIdentity.kind !== "rejected") throw new Error("Expected rejection");
  assert.equal(wrongIdentity.code, "command-identity");
  h.context = {
    ...h.context,
    owner: { ...h.context.owner, generation: count("1") },
  };
  const stale = await h.app.dispatch(command);
  assert.equal(stale.kind, "rejected");
  if (stale.kind !== "rejected") throw new Error("Expected rejection");
  assert.equal(stale.code, "stale-owner");
});

test("Pause plan has no acceptance and terminal Back prepares a navigation command with its saved checkpoint", async () => {
  const content = await graphFixture();
  let selected = session(content);
  const h = harness(content, selected);
  let view = await h.app.read();
  const pause = await prepared(h, view, action(view, "pause"));
  assert.equal((await h.app.dispatch(pause)).kind, "committed");
  assert.equal(h.applications[0]?.plan.pause, true);
  assert.equal(h.applications[0]?.advanceId, null);
  let completed = state(content);
  for (let i = 0; i < 6; i++) {
    const plan = evaluateGraph({
      content,
      state: completed,
      status: "inProgress",
      action: { kind: "continue" },
    });
    if (plan.after.kind !== "graph") throw new Error("Expected graph");
    completed = plan.after;
  }
  selected = {
    ...selected,
    state: completed,
    status: "closed",
    runStatus: "completed",
  };
  h.context = {
    ...h.context,
    session: selected,
    sessions: [selected],
    completedTaskIds: [task1],
  };
  view = parseProjection(await h.app.read());
  assert.equal(view.kind, "completed");
  const back = await prepared(h, view, action(view, "back"));
  assert.equal(back.kind, "navigate");
  assert.equal((await h.app.dispatch(back)).kind, "committed");
  const applied = h.applications[1];
  assert(applied);
  assert.equal(applied.plan.acceptance, null);
  assert.equal(applied.plan.completion, null);
  assert.equal(applied.plan.after.kind, "graph");
});

test("an unfinished replay retains prior catalog completion and explicit replay starts fresh", async () => {
  const content = await graphFixture();
  const h = harness(content);
  h.context = { ...h.context, completedTaskIds: [task1] };
  const view = ready(await h.app.read());
  assert.equal(view.catalog.find((task) => task.id === task1)?.completed, true);
  const replay = await prepared(h, view, action(view, "replay", task1));
  assert.equal((await h.app.dispatch(replay)).kind, "committed");
  const plan = h.selections[0]?.selection;
  assert(plan && plan.kind === "new");
  assert.equal(plan.replaceSessionId, null);
  const replaySession = session(content);
  h.context = {
    ...h.context,
    session: replaySession,
    sessions: [replaySession],
  };
  const unfinished = ready(await h.app.read());
  assert.equal(
    unfinished.catalog.find((task) => task.id === task1)?.completed,
    true,
  );
});
