import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  completionProof,
  parseTeachingState,
  validateAcceptanceState,
  validateAcceptanceTransition,
  validatePosition,
} from "../../packages/teaching/src/index.ts";
import type {
  ControlTeachingState,
  GraphAction,
} from "../../packages/teaching/src/index.ts";
import { controlFixture } from "./control-fixture.ts";
function policy(f: Awaited<ReturnType<typeof controlFixture>>) {
  const p = f.task.nodes.find((n) => n.kind === "untilFirm");
  if (!p || p.kind !== "untilFirm") throw new Error("No policy");
  return p.policyId;
}
function current(f: Awaited<ReturnType<typeof controlFixture>>) {
  const p = f.view();
  if (p.kind !== "teaching") throw new Error("No source turn");
  return p.turn.id;
}
function selectPosition(f: Awaited<ReturnType<typeof controlFixture>>) {
  f.act({ kind: "continue" });
  f.act({ kind: "parentReady", policyId: policy(f) });
  for (let i = 0; i < 5; i++) f.act({ kind: "continue" });
  assert.equal(f.view().kind, "reviewSelection");
}
function accept({
  fixture: f,
  action,
}: {
  fixture: Awaited<ReturnType<typeof controlFixture>>;
  action: GraphAction;
}) {
  const { before, plan } = f.act(action);
  assert.ok(plan.kind === "acceptance" || plan.kind === "completion");
  validateAcceptanceTransition({
    content: f.installed,
    taskId: f.taskId,
    before,
    after: plan.after,
    occurrenceId: plan.occurrenceId,
    action,
  });
  return plan;
}
test("oral tasks preserve every response, explicit first readiness and required review exit", async () => {
  const f = await controlFixture();
  assert.match(current(f), /\.model$/);
  accept({ fixture: f, action: { kind: "continue" } });
  const initialResponse = f.state.occurrences[1]?.id;
  assert.ok(initialResponse);
  accept({ fixture: f, action: { kind: "continue" } });
  assert.match(current(f), /response-01$/);
  assert.equal(f.state.cycleOutcomes.length, 1);
  assert.equal(f.state.cycleOutcomes[0]?.kind, "independent");
  assert.equal(completionProof(f.installed, f.state), null);
  const ready = accept({
    fixture: f,
    action: { kind: "parentReady", policyId: policy(f) },
  });
  assert.equal(ready.kind, "acceptance");
  assert.match(current(f), /response-02$/);
  for (let i = 0; i < 5; i++)
    accept({ fixture: f, action: { kind: "continue" } });
  assert.equal(f.view().kind, "reviewSelection");
  assert.equal(completionProof(f.installed, f.state), null);
  const review = f.graph.reviews[0];
  assert.ok(review);
  assert.throws(() => f.act({ kind: "continue" }), /unavailable/);
  const terminal = accept({
    fixture: f,
    action: {
      kind: "commitReviewSelection",
      reviewId: review.reviewId,
      choice: { kind: "none" },
    },
  });
  assert.equal(terminal.kind, "completion");
  assert.equal(f.view().kind, "completed");
  assert.equal(f.state.queues[0]?.choice.kind, "none");
  assert.ok(completionProof(f.installed, f.state));
  const t5 = await controlFixture(5);
  for (let i = 0; i < 4; i++) {
    assert.match(current(t5), new RegExp(`response-0${i + 1}$`));
    accept({ fixture: t5, action: { kind: "continue" } });
  }
  assert.equal(t5.view().kind, "completed");
  const count = t5.state.acceptedOccurrenceIds.length;
  t5.act({ kind: "back" });
  assert.match(current(t5), /response-04$/);
  assert.equal(t5.act({ kind: "continue" }).plan.kind, "navigation");
  assert.equal(t5.state.acceptedOccurrenceIds.length, count);
  assert.equal(t5.view().kind, "completed");
});
test("nonadjacent queue is source ordered, immutable, exact after round trip and Back reconfirmation", async () => {
  const f = await controlFixture();
  selectPosition(f);
  const review = f.graph.reviews[0];
  assert.ok(review);
  const first = review.items[0],
    third = review.items[2];
  assert.ok(first && third);
  assert.throws(
    () =>
      f.act({
        kind: "commitReviewSelection",
        reviewId: review.reviewId,
        choice: { kind: "items", itemIds: [third.itemId, first.itemId] },
      }),
    /source ordered/,
  );
  accept({
    fixture: f,
    action: {
      kind: "commitReviewSelection",
      reviewId: review.reviewId,
      choice: { kind: "items", itemIds: [first.itemId, third.itemId] },
    },
  });
  assert.match(current(f), /response-01$/);
  const q = f.state.queues[0];
  assert.ok(q);
  const snapshot = canonical(q);
  f.roundTrip();
  accept({ fixture: f, action: { kind: "parentReady", policyId: policy(f) } });
  assert.match(current(f), /response-03$/);
  f.act({ kind: "back" });
  assert.match(current(f), /response-01$/);
  const count = f.state.acceptedOccurrenceIds.length;
  assert.equal(f.act({ kind: "continue" }).plan.kind, "navigation");
  assert.equal(f.state.acceptedOccurrenceIds.length, count);
  assert.match(current(f), /response-03$/);
  accept({
    fixture: f,
    action: { kind: "confirmReviewItem", queueId: q.id, itemId: third.itemId },
  });
  assert.equal(f.view().kind, "completed");
  assert.equal(canonical(f.state.queues[0]), snapshot);
});
test("correction preserves one suspension, supports prefix readiness and resolves only current owed response", async () => {
  const f = await controlFixture();
  f.act({ kind: "continue" });
  f.act({ kind: "parentReady", policyId: policy(f) });
  f.act({ kind: "continue" });
  assert.match(current(f), /response-03$/);
  const correction = f.task.corrections.find(
    (c) => c.scope === "normal" && c.eligibleNodeIds.includes(current(f)),
  );
  assert.ok(correction);
  const accepted = [...f.state.acceptedOccurrenceIds];
  f.act({ kind: "help", correctionId: correction.id });
  const baseline = f.state;
  f.act({ kind: "help", correctionId: correction.id });
  assert.equal(f.state.checkpoints.at(-1)?.context.kind, "correction");
  validateAcceptanceState({
    content: f.installed,
    taskId: f.taskId,
    baseline,
    state: f.state,
  });
  f.roundTrip();
  accept({ fixture: f, action: { kind: "continue" } });
  assert.match(current(f), /\.model$/);
  accept({ fixture: f, action: { kind: "continue" } });
  assert.match(current(f), /response-01$/);
  accept({ fixture: f, action: { kind: "parentReady", policyId: policy(f) } });
  assert.match(current(f), /response-02$/);
  accept({ fixture: f, action: { kind: "continue" } });
  assert.match(current(f), /response-03$/);
  accept({ fixture: f, action: { kind: "continue" } });
  assert.match(current(f), /response-04$/);
  assert.equal(
    f.state.acceptedOccurrenceIds.filter(
      (id) =>
        !accepted.includes(id) &&
        f.state.occurrences.find((o) => o.id === id)?.obligation === "required",
    ).length,
    1,
  );
  assert.ok(f.state.cycleOutcomes.some((o) => o.kind === "supported"));
});
test("review Help never visits omitted items and combined retest confirms exact selected item", async () => {
  const f = await controlFixture();
  selectPosition(f);
  const review = f.graph.reviews[0],
    item = review?.items[2];
  assert.ok(review && item);
  f.act({
    kind: "commitReviewSelection",
    reviewId: review.reviewId,
    choice: { kind: "items", itemIds: [item.itemId] },
  });
  const correction = f.task.corrections.find(
    (c) => c.scope === "review" && c.eligibleNodeIds.includes(current(f)),
  );
  assert.ok(correction);
  const q = f.state.queues[0];
  assert.ok(q);
  f.act({ kind: "help", correctionId: correction.id });
  f.roundTrip();
  accept({ fixture: f, action: { kind: "continue" } });
  assert.match(current(f), /response-03$/);
  assert.equal(
    accept({
      fixture: f,
      action: { kind: "confirmReviewItem", queueId: q.id, itemId: item.itemId },
    }).kind,
    "completion",
  );
});
test("tampered queue, outcome, binding and acceptance action fail closed", async () => {
  const f = await controlFixture();
  selectPosition(f);
  const r = f.graph.reviews[0];
  assert.ok(r);
  const item = r.items[0];
  assert.ok(item);
  const plan = accept({
    fixture: f,
    action: {
      kind: "commitReviewSelection",
      reviewId: r.reviewId,
      choice: { kind: "items", itemIds: [item.itemId] },
    },
  });
  const malformed = structuredClone(f.state);
  const q = malformed.queues[0];
  assert.ok(q);
  const tampered: ControlTeachingState = {
    ...malformed,
    queues: [{ ...q, exitNodeId: r.id }],
  };
  assert.throws(() => validatePosition(f.installed, tampered), /queue/);
  const { before, plan: ready } = f.act({
    kind: "parentReady",
    policyId: policy(f),
  });
  assert.ok(ready.kind === "completion");
  assert.throws(
    () =>
      validateAcceptanceTransition({
        content: f.installed,
        taskId: f.taskId,
        before,
        after: ready.after,
        occurrenceId: ready.occurrenceId,
        action: { kind: "continue" },
      }),
    /match/,
  );
  assert.throws(
    () => parseTeachingState({ ...f.state, unknown: true }),
    /schema/,
  );
});

test("supported first-item practice keeps readiness owed and never becomes an independent cycle", async () => {
  const f = await controlFixture();
  f.act({ kind: "continue" });
  const c = f.task.corrections.find((c) => c.scope === "any");
  assert.ok(c);
  f.act({ kind: "help", correctionId: c.id });
  f.act({ kind: "continue" });
  f.act({ kind: "continue" });
  assert.match(current(f), /response-01$/);
  assert.equal(
    f.state.cycleOutcomes.every((o) => o.kind === "supported"),
    true,
  );
  f.act({ kind: "parentReady", policyId: policy(f) });
  assert.match(current(f), /response-02$/);
  assert.equal(
    f.state.cycleOutcomes.every((o) => o.kind === "supported"),
    true,
  );
});

test("saved checkpoints reject future normal jumps and a correction that changes its owed response", async () => {
  const f = await controlFixture();
  f.act({ kind: "continue" });
  const cp = f.state.checkpoints.at(-1),
    later = f.state.occurrences.find(
      (o) =>
        o.target.kind === "node" &&
        String(o.target.nodeId).endsWith("response-04"),
    );
  assert.ok(cp && later);
  const jumped: ControlTeachingState = {
    ...f.state,
    checkpoints: [
      ...f.state.checkpoints.slice(0, -1),
      {
        ...cp,
        occurrenceId: later.id,
        context: {
          kind: "delivering",
          resume: { flow: { kind: "normal" }, delivery: { kind: "source" } },
        },
      },
    ],
  };
  assert.throws(() => validatePosition(f.installed, jumped), /authored route/);
  const c = f.task.corrections.find((c) => c.scope === "any");
  assert.ok(c);
  f.act({ kind: "help", correctionId: c.id });
  const help = f.state.checkpoints.at(-1);
  assert.ok(
    help && help.occurrenceId !== null && help.context.kind === "correction",
  );
  if (help.context.kind !== "correction") throw new Error("Missing correction");
  const tampered: ControlTeachingState = {
    ...f.state,
    checkpoints: [
      ...f.state.checkpoints.slice(0, -1),
      { ...help, context: { ...help.context, owedOccurrenceId: later.id } },
    ],
  };
  assert.throws(
    () => validatePosition(f.installed, tampered),
    /Cycle checkpoint|suspended/,
  );
});
