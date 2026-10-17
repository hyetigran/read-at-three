import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  completionProof,
  parseDevelopmentPackage,
  validatePosition,
} from "../../packages/teaching/src/index.ts";
import type { ControlTeachingState } from "../../packages/teaching/src/index.ts";
import { createContinuousOralFixtureBody } from "../../tools/content/continuous.ts";
import { continuousFixture, continuousHash } from "./continuous-fixture.ts";
const normal = [
  "am-model",
  "am-together",
  "am-again",
  "am-independent",
  "if-together",
  "if-again",
  "if-independent",
  "in-together",
  "in-again",
  "in-independent",
];
function suffix(id: string) {
  return id.split(".").at(-1);
}
async function at(trigger: string) {
  const fixture = await continuousFixture();
  for (let count = 0; suffix(fixture.current().id) !== trigger; count++) {
    if (count > 12) throw new Error("Trigger unavailable");
    fixture.act(fixture.decision());
  }
  return fixture;
}
function correctionContext(
  fixture: Awaited<ReturnType<typeof continuousFixture>>,
) {
  const context = fixture.checkpoint().context;
  if (context.kind !== "correction")
    throw new Error("Correction context missing");
  return context;
}
function requiredAccepted(
  fixture: Awaited<ReturnType<typeof continuousFixture>>,
) {
  return fixture.state.occurrences
    .filter(
      (o) =>
        o.obligation === "required" &&
        fixture.state.acceptedOccurrenceIds.includes(o.id),
    )
    .map((o) =>
      o.target.kind === "node" ? suffix(o.target.nodeId) : o.target.kind,
    );
}
test("ten oral turns retain mandatory Again, joint supported cycles and separate independent responses", async () => {
  const fixture = await continuousFixture();
  const delivered = [];
  for (const expected of normal) {
    delivered.push(suffix(fixture.current().id));
    assert.equal(suffix(fixture.current().id), expected);
    assert.equal(fixture.current().presentation.kind, "oral");
    assert.equal("glyph" in fixture.current(), false);
    assert.equal("cue" in fixture.current(), false);
    assert.equal(
      fixture.current().parentRole,
      expected.endsWith("model")
        ? "model"
        : expected.endsWith("independent")
          ? "listen"
          : "together",
    );
    assert.deepEqual(
      fixture
        .actions()
        .filter((a) => ["continue", "parentReady"].includes(a.intent.kind))
        .map((a) => a.label.text),
      expected.endsWith("again") ? ["Practice again", "Ready"] : ["Continue"],
    );
    const plan = fixture.act(fixture.decision());
    if (expected !== "in-independent") {
      assert.equal(plan.kind, "acceptance");
      assert.equal(completionProof(fixture.content, fixture.state), null);
    }
    fixture.roundTrip();
  }
  assert.deepEqual(delivered, normal);
  assert.equal(fixture.view().kind, "completed");
  assert.deepEqual(
    fixture.state.cycleOutcomes.map((o) => o.kind),
    ["supported", "supported", "supported"],
  );
  assert.equal(
    completionProof(fixture.content, fixture.state)?.requiredOccurrenceIds
      .length,
    13,
  );
  assert.deepEqual(
    completionProof(fixture.content, fixture.state)?.sourceRefs,
    ["fixture.continuous.source"],
  );
});
test("joint practice, single Repeat and Back never grant independent credit or duplicate acceptance", async () => {
  const fixture = await at("am-together");
  const returnTo = fixture.checkpoint();
  fixture.act({ kind: "repeat" });
  assert.equal(fixture.current().extraPractice, true);
  fixture.act({ kind: "continue" });
  assert.equal(fixture.checkpoint().occurrenceId, returnTo.occurrenceId);
  assert.equal(fixture.state.cycleOutcomes.length, 0);
  fixture.act({ kind: "continue" });
  const owed = fixture.checkpoint().occurrenceId;
  assert.equal(suffix(fixture.current().id), "am-again");
  fixture.act({ kind: "continue" });
  assert.equal(suffix(fixture.current().id), "am-again");
  assert.notEqual(fixture.checkpoint().occurrenceId, owed);
  assert.deepEqual(
    fixture.state.cycleOutcomes.map((o) => o.kind),
    ["supported"],
  );
  fixture.act(fixture.decision());
  assert.equal(suffix(fixture.current().id), "am-independent");
  const count = fixture.state.acceptedOccurrenceIds.length,
    outcomes = canonical(fixture.state.cycleOutcomes);
  fixture.act({ kind: "back" });
  assert.deepEqual(
    fixture
      .actions()
      .filter((a) => ["continue", "parentReady"].includes(a.intent.kind))
      .map((a) => a.label.text),
    ["Continue"],
  );
  assert.equal(fixture.act({ kind: "continue" }).kind, "navigation");
  assert.equal(fixture.state.acceptedOccurrenceIds.length, count);
  assert.equal(canonical(fixture.state.cycleOutcomes), outcomes);
  assert.equal(suffix(fixture.current().id), "am-independent");
});
for (const trigger of normal.slice(1))
  test(`correction at ${trigger} requires joint readiness, independent test/praise, full prefix and only original owed acceptance`, async () => {
    const fixture = await at(trigger);
    const before = requiredAccepted(fixture);
    const owed = fixture.checkpoint().occurrenceId;
    assert.ok(owed);
    const help = fixture.actions().find((a) => a.intent.kind === "help");
    assert.ok(help && help.intent.kind === "help");
    fixture.act(help.intent);
    const suspended = correctionContext(fixture).suspended;
    assert.equal(fixture.current().parentRole, "model");
    fixture.act({ kind: "continue" });
    assert.equal(fixture.current().parentRole, "together");
    assert.deepEqual(
      fixture
        .actions()
        .filter((a) => ["continue", "parentReady"].includes(a.intent.kind))
        .map((a) => a.label.text),
      ["Practice again", "Ready"],
    );
    const routeBeforePractice = correctionContext(fixture);
    assert.match(fixture.current().guidance.at(-1)?.copy.text ?? "", /firm/);
    fixture.act({ kind: "continue" });
    const routeAfterPractice = correctionContext(fixture);
    assert.equal(fixture.current().parentRole, "together");
    assert.equal(routeAfterPractice.owedOccurrenceId, owed);
    assert.deepEqual(routeAfterPractice.suspended, suspended);
    assert.deepEqual(
      routeAfterPractice.retestOccurrenceIds,
      routeBeforePractice.retestOccurrenceIds,
    );
    assert.equal(
      routeAfterPractice.instructionOccurrenceIds[2],
      routeBeforePractice.instructionOccurrenceIds[2],
    );
    assert.notEqual(
      routeAfterPractice.instructionOccurrenceIds[1],
      routeBeforePractice.instructionOccurrenceIds[1],
    );
    fixture.roundTrip();
    fixture.act(fixture.decision());
    assert.equal(fixture.current().parentRole, "listen");
    assert.match(fixture.current().id, /\.test$/);
    assert.deepEqual(
      fixture.current().guidance.map((span) => span.kind),
      ["speech", "expected", "praise", "action"],
    );
    assert.deepEqual(requiredAccepted(fixture), before);
    const testState = fixture.state;
    fixture.act({ kind: "back" });
    assert.equal(fixture.current().parentRole, "together");
    assert.equal(fixture.act({ kind: "continue" }).kind, "navigation");
    assert.deepEqual(
      fixture.state.acceptedOccurrenceIds,
      testState.acceptedOccurrenceIds,
    );
    assert.match(fixture.current().id, /\.test$/);
    fixture.act({ kind: "continue" });
    assert.equal(suffix(fixture.current().id), "am-model");
    const replay = [];
    for (
      let count = 0;
      fixture.checkpoint().context.kind === "correction";
      count++
    ) {
      if (count > 12) throw new Error("Correction did not resolve");
      replay.push(suffix(fixture.current().id));
      assert.deepEqual(requiredAccepted(fixture), before);
      fixture.act(fixture.decision());
      fixture.roundTrip();
    }
    assert.deepEqual(replay, normal.slice(0, normal.indexOf(trigger) + 1));
    const after = requiredAccepted(fixture);
    assert.deepEqual(
      after.filter((id) => !before.includes(id)),
      trigger.endsWith("again")
        ? [trigger, `${trigger.split("-")[0]}-firm`]
        : [trigger],
    );
    assert.equal(fixture.state.acceptedOccurrenceIds.includes(owed), true);
    if (trigger !== "in-independent")
      assert.equal(
        suffix(fixture.current().id),
        normal[normal.indexOf(trigger) + 1],
      );
    else assert.equal(fixture.view().kind, "completed");
    assert.equal(
      fixture.state.cycleOutcomes.every((o) => o.kind === "supported"),
      true,
    );
  });
test("repeated Help and correction Repeat retain the original suspension and fresh support routes", async () => {
  const fixture = await at("if-independent");
  const help = fixture.actions().find((a) => a.intent.kind === "help");
  assert.ok(help && help.intent.kind === "help");
  fixture.act(help.intent);
  const original = correctionContext(fixture);
  fixture.act({ kind: "continue" });
  fixture.act(fixture.decision());
  fixture.act(help.intent);
  const repeated = correctionContext(fixture);
  assert.equal(repeated.owedOccurrenceId, original.owedOccurrenceId);
  assert.deepEqual(repeated.suspended, original.suspended);
  assert.equal(
    repeated.instructionOccurrenceIds.some((id) =>
      original.instructionOccurrenceIds.includes(id),
    ),
    false,
  );
  fixture.act({ kind: "repeat" });
  const repeat = correctionContext(fixture);
  assert.equal(repeat.owedOccurrenceId, original.owedOccurrenceId);
  assert.deepEqual(repeat.suspended, original.suspended);
  assert.match(fixture.current().id, /\.model$/);
  assert.equal(
    repeat.instructionOccurrenceIds.some((id) =>
      repeated.instructionOccurrenceIds.includes(id),
    ),
    false,
  );
});
test("false independent outcomes, phase skips, inactive-route rewrites and forged binding reuse fail closed", async () => {
  const fixture = await at("am-independent");
  assert.throws(
    () =>
      validatePosition(fixture.content, {
        ...fixture.state,
        cycleOutcomes: fixture.state.cycleOutcomes.map((o) => ({
          ...o,
          kind: "independent",
        })),
      }),
    /false independence/,
  );
  const c = fixture.task.corrections.find((c) =>
    c.eligibleNodeIds.includes(fixture.current().id),
  );
  assert.ok(c);
  fixture.act({ kind: "help", correctionId: c.id });
  fixture.act({ kind: "continue" });
  fixture.act({ kind: "continue" });
  const state = fixture.state,
    context = correctionContext(fixture),
    last = fixture.checkpoint();
  assert.ok(last.occurrenceId);
  const firstRetest = context.retestOccurrenceIds[0];
  assert.ok(firstRetest);
  const forged: ControlTeachingState = {
    ...state,
    checkpoints: [
      ...state.checkpoints.slice(0, -1),
      {
        ...last,
        occurrenceId: firstRetest,
        context: { ...context, phase: { kind: "retest", index: 0 } },
      },
    ],
  };
  assert.throws(
    () => validatePosition(fixture.content, forged),
    /authored route/,
  );
  const modelBinding = context.instructionOccurrenceIds[0];
  assert.ok(modelBinding);
  assert.throws(
    () =>
      validatePosition(fixture.content, {
        ...state,
        checkpoints: [
          ...state.checkpoints.slice(0, -1),
          {
            ...last,
            context: {
              ...context,
              instructionOccurrenceIds: context.instructionOccurrenceIds.map(
                (id, index) => (index === 1 ? modelBinding : id),
              ),
            },
          },
        ],
      }),
    /bindings invalid/,
  );
  const reversed = [...context.retestOccurrenceIds].reverse();
  assert.throws(
    () =>
      validatePosition(fixture.content, {
        ...state,
        checkpoints: [
          ...state.checkpoints.slice(0, -1),
          { ...last, context: { ...context, retestOccurrenceIds: reversed } },
        ],
      }),
    /bindings invalid/,
  );
});
async function rejectBody({
  change,
  message,
}: {
  change: (
    body: ReturnType<typeof createContinuousOralFixtureBody>,
  ) => ReturnType<typeof createContinuousOralFixtureBody>;
  message: RegExp;
}) {
  const body = change(createContinuousOralFixtureBody());
  await assert.rejects(
    parseDevelopmentPackage(
      {
        formatVersion: 1,
        body,
        packageHash: await continuousHash(canonical(body)),
      },
      continuousHash,
    ),
    message,
  );
}
test("compiler rejects ambiguous, unowned, straddling, overlapping and incomplete readiness ownership", async () => {
  const modify =
    (
      change: (
        task: ReturnType<
          typeof createContinuousOralFixtureBody
        >["tasks"][number] & { kind: "graphControls" },
      ) => ReturnType<typeof createContinuousOralFixtureBody>["tasks"][number],
    ) =>
    (body: ReturnType<typeof createContinuousOralFixtureBody>) => ({
      ...body,
      tasks: body.tasks.map((entry) =>
        entry.task.number === 3 && entry.kind === "graphControls"
          ? change(entry)
          : entry,
      ),
    });
  await rejectBody({
    change: modify((entry) => ({
      ...entry,
      task: { ...entry.task, corrections: entry.task.corrections.slice(1) },
    })),
    message: /one defining owner/,
  });
  await rejectBody({
    change: modify((entry) => ({
      ...entry,
      task: {
        ...entry.task,
        corrections: [
          ...entry.task.corrections,
          {
            ...entry.task.corrections[0],
            id: "fixture.duplicate",
            label: { kind: "added", text: "Synthetic duplicate" },
            scope: "normal",
            sourceRefs: ["fixture.continuous.source"],
            eligibleNodeIds: [entry.task.startNodeId],
            instructionNodeIds:
              entry.task.corrections[0]?.instructionNodeIds ?? [],
            retestNodeIds: entry.task.corrections[0]?.retestNodeIds ?? [],
          },
        ],
      },
    })),
    message: /one defining owner/,
  });
  await rejectBody({
    change: modify((entry) => {
      const sharedTurn = `${entry.task.id}.correction-am-together.together`;
      const secondGate = `${entry.task.id}.correction-am-again.firm`;
      return {
        ...entry,
        task: {
          ...entry.task,
          nodes: entry.task.nodes.map((node) =>
            node.id === secondGate && node.kind === "untilFirm"
              ? {
                  ...node,
                  cycleEntryNodeId: sharedTurn,
                  cycleExitNodeId: sharedTurn,
                }
              : node,
          ),
          corrections: entry.task.corrections.map((correction, index) =>
            index === 1
              ? {
                  ...correction,
                  instructionNodeIds: correction.instructionNodeIds.map(
                    (id, position) => (position === 1 ? sharedTurn : id),
                  ),
                }
              : correction,
          ),
        },
      };
    }),
    message: /immediately before/,
  });
  await rejectBody({
    change: modify((entry) => ({
      ...entry,
      task: {
        ...entry.task,
        nodes: entry.task.nodes.map((node) =>
          node.kind === "untilFirm" && node.id.endsWith(".firm")
            ? { ...node, cycleEntryNodeId: entry.task.startNodeId }
            : node,
        ),
      },
    })),
    message: /immediately before/,
  });
  await rejectBody({
    change: modify((entry) => ({
      ...entry,
      task: {
        ...entry.task,
        corrections: entry.task.corrections.map((c, i) =>
          i === 0 ? { ...c, retestNodeIds: [`${entry.task.id}.am-again`] } : c,
        ),
      },
    })),
    message: /complete readiness cycle/,
  });
  await rejectBody({
    change: modify((entry) => ({
      ...entry,
      task: {
        ...entry.task,
        corrections: entry.task.corrections.map((c, i) =>
          i === 0 ? { ...c, eligibleNodeIds: [entry.task.startNodeId] } : c,
        ),
      },
    })),
    message: /eligibility/,
  });
  await rejectBody({
    change: modify((entry) => ({
      ...entry,
      task: {
        ...entry.task,
        corrections: entry.task.corrections.map((c, i) =>
          i === 0
            ? { ...c, retestNodeIds: [`${entry.task.id}.in-independent`] }
            : c,
        ),
      },
    })),
    message: /eligible item/,
  });
});
