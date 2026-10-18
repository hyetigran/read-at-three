import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  completionProof,
  evaluateGraph,
  initialState,
  parseRuntimePackage,
  parseTeachingState,
  project,
  resolvedLessons,
  taskDefinition,
  validatePosition,
  connectedPointingRegion,
  connectedPointingRoles,
} from "@readatthree/teaching";
import type { GraphAction } from "@readatthree/teaching";
import { syntheticConnectedCourse } from "../connected-pointing-fixture.ts";
import { hash } from "../lesson-two-fixture.ts";

async function fixture(number: 6 | 7) {
  const { content, task6Id, task7Id } = await syntheticConnectedCourse();
  const taskId = number === 6 ? task6Id : task7Id;
  if (!taskId) throw new Error("Synthetic task missing");
  const initial = initialState(content, taskId);
  if (initial.kind !== "graphControls")
    throw new Error("Control state required");
  let state = initial;
  const graph = taskDefinition({ content, taskId });
  if (graph.kind !== "graphControls") throw new Error("Control task required");
  return {
    content,
    taskId,
    task: graph.graph.task,
    get state() {
      return state;
    },
    act(action: GraphAction) {
      const plan = evaluateGraph({
        content,
        state,
        status: completionProof(content, state) ? "completed" : "inProgress",
        action,
      });
      const after = parseTeachingState(JSON.parse(JSON.stringify(plan.after)));
      if (after.kind !== "graphControls")
        throw new Error("Control state required");
      state = after;
      validatePosition(content, state, taskId);
      return plan;
    },
    due() {
      const view = project(content, state);
      if (view.kind !== "teaching") throw new Error("Turn required");
      return view.turn;
    },
  };
}
for (const number of [6, 7] as const) {
  test(`connected task ${number} preserves every model, required repeat, follow and Again`, async () => {
    const f = await fixture(number);
    const expected =
      number === 6
        ? ["model", "follow", "again"]
        : ["model", "required-model-repeat", "follow", "again"];
    for (const suffix of expected) {
      const turn = f.due();
      assert.equal(turn.id, `${f.taskId}.${suffix}`);
      assert.ok(
        "presentation" in turn &&
          turn.presentation.kind === "connectedPointing",
      );
      if (
        !("presentation" in turn) ||
        turn.presentation.kind !== "connectedPointing"
      )
        throw Error("Pointing presentation required");
      assert.equal(
        connectedPointingRoles[turn.presentation.role].voice,
        "parent",
      );
      assert.equal(
        connectedPointingRoles[turn.presentation.role].pointer,
        suffix.includes("model") ? "parent" : "child",
      );
      assert.equal(completionProof(f.content, f.state), null);
      f.act({ kind: "continue" });
    }
    assert.ok(completionProof(f.content, f.state));
    assert.equal(f.state.acceptedOccurrenceIds.length, expected.length);
    f.act({ kind: "back" });
    assert.equal(f.due().id, `${f.taskId}.again`);
    assert.equal(f.act({ kind: "continue" }).kind, "navigation");
    assert.equal(f.state.acceptedOccurrenceIds.length, expected.length);
  });
  for (const at of ["follow", "again"] as const)
    for (const duringRepeat of [false, true]) {
      test(`task ${number} Help at ${at}${duringRepeat ? " during ordinary Repeat" : ""} returns independently and preserves only the interrupted obligation`, async () => {
        const f = await fixture(number);
        while (!f.due().id.endsWith(`.${at}`)) f.act({ kind: "continue" });
        if (duringRepeat) f.act({ kind: "repeat" });
        const correction = f.task.corrections.find((c) =>
          c.eligibleNodeIds.includes(f.due().id),
        );
        assert.ok(correction);
        const before = f.state.acceptedOccurrenceIds.length;
        f.act({ kind: "help", correctionId: correction.id });
        assert.equal(f.due().id, `${f.taskId}.help-${at}.guided`);
        if (number === 6) {
          const gate = f.task.nodes.find(
            (n) => n.kind === "untilFirm" && n.cycleEntryNodeId === f.due().id,
          );
          assert.ok(gate?.kind === "untilFirm");
          assert.equal(f.due().id, gate.cycleExitNodeId);
          for (let i = 0; i < 2; i++) {
            f.act({ kind: "continue" });
            assert.equal(f.due().id, `${f.taskId}.help-${at}.guided`);
          }
          f.act({ kind: "parentReady", policyId: gate.policyId });
        } else f.act({ kind: "continue" });
        assert.equal(f.due().id, `${f.taskId}.help-${at}.retest`);
        assert.equal(f.state.acceptedOccurrenceIds.length > before, true);
        f.act({ kind: "continue" });
        if (duringRepeat) {
          assert.equal(f.due().id, `${f.taskId}.${at}`);
          assert.equal(completionProof(f.content, f.state), null);
          f.act({ kind: "continue" });
        }
        if (at === "follow") {
          assert.equal(f.due().id, `${f.taskId}.again`);
          assert.equal(completionProof(f.content, f.state), null);
          f.act({ kind: "continue" });
        }
        assert.ok(completionProof(f.content, f.state));
      });
    }
}

test("schema4 is capability closed and historical schema3 rejects connected presentations", async () => {
  const { envelope, content } = await syntheticConnectedCourse();
  assert.equal(resolvedLessons(content)[2]?.completeDefinition, true);
  assert.deepEqual(
    resolvedLessons(content).map((l) => l.tasks.length),
    [6, 7, 8, 0, 0, 0],
  );
  const old = {
    ...envelope.body,
    coverage: "course-development-v3",
    contentSchemaVersion: 3,
    requiredEngineCapabilities: envelope.body.requiredEngineCapabilities.filter(
      (c) => c !== "connected-pointing-v1",
    ),
  };
  await assert.rejects(
    parseRuntimePackage(
      { formatVersion: 1, body: old, packageHash: await hash(canonical(old)) },
      hash,
    ),
    /unsupported/,
  );
  const missing = {
    ...envelope.body,
    requiredEngineCapabilities: envelope.body.requiredEngineCapabilities.filter(
      (c) => c !== "connected-pointing-v1",
    ),
  };
  await assert.rejects(
    parseRuntimePackage(
      {
        formatVersion: 1,
        body: missing,
        packageHash: await hash(canonical(missing)),
      },
      hash,
    ),
    /unsupported/,
  );
});

test("hit regions use real finite circle geometry and do not infer timing or completion", () => {
  assert.equal(connectedPointingRegion({ x: 50, y: 240 }), "start");
  assert.equal(connectedPointingRegion({ x: 250, y: 275 }), "first");
  assert.equal(connectedPointingRegion({ x: 480, y: 275 }), "second");
  assert.equal(connectedPointingRegion({ x: 644, y: 240 }), null);
  assert.equal(connectedPointingRegion({ x: 250, y: 250 }), null);
});

test("connected role and correction boundaries reject wrong voice roles and cross-board retests", async () => {
  const { envelope } = await syntheticConnectedCourse();
  for (const mutation of ["role", "board"] as const) {
    const body = {
      ...envelope.body,
      lessons: envelope.body.lessons.map((lesson, index) =>
        index !== 2
          ? lesson
          : {
              ...lesson,
              tasks: lesson.tasks.map((entry) =>
                entry.task.number !== 6 || entry.kind !== "graphControls"
                  ? entry
                  : {
                      ...entry,
                      task: {
                        ...entry.task,
                        nodes: entry.task.nodes.map((node) =>
                          node.kind !== "turn"
                            ? node
                            : mutation === "role" && node.id.endsWith(".follow")
                              ? { ...node, parentRole: "together" }
                              : mutation === "board" &&
                                  node.id.endsWith(".retest") &&
                                  node.presentation.kind === "connectedPointing"
                                ? {
                                    ...node,
                                    presentation: {
                                      ...node.presentation,
                                      board: "sa",
                                    },
                                  }
                                : node,
                        ),
                      },
                    },
              ),
            },
      ),
    };
    await assert.rejects(
      parseRuntimePackage(
        { formatVersion: 1, body, packageHash: await hash(canonical(body)) },
        hash,
      ),
      /Connected pointing/,
    );
  }
});
