import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canonical,
  compileWritingTask,
  parseRuntimePackage,
  parseProjection,
  writingTask,
  resolvedLessons,
  taskDefinition,
} from "@readatthree/teaching";
import {
  hash,
  syntheticPlanEnvelope,
  syntheticWritingPlan,
} from "../lesson-two-fixture.ts";

test("semantic writing plan derives model before each response and four distinct source-qualified practice confirmations", async () => {
  const content = await parseRuntimePackage(
    await syntheticPlanEnvelope(),
    hash,
  );
  const entry = resolvedLessons(content)[0]?.tasks.find(
    (entry) => entry.kind === "writingPracticePlanV2",
  );
  assert.ok(entry && entry.kind === "writingPracticePlanV2");
  const graph = taskDefinition({ content, taskId: entry.task.id });
  assert.equal(graph.kind, "graphControls");
  const task = writingTask({ content, taskId: entry.task.id });
  assert.ok(task);
  assert.deepEqual(
    task.nodes.map((node) => node.presentation.obligation.kind),
    [
      "parentModel",
      "soundResponse",
      "phaseConfirmation",
      "phaseConfirmation",
      "parentModel",
      "soundResponse",
      "phaseConfirmation",
      "phaseConfirmation",
    ],
  );
  assert.equal(
    task.nodes.filter(
      (node) => node.presentation.obligation.kind === "phaseConfirmation",
    ).length,
    4,
  );
  assert.deepEqual(
    task.nodes
      .filter(
        (node) => node.presentation.obligation.kind === "phaseConfirmation",
      )
      .map((node) =>
        node.presentation.obligation.kind === "phaseConfirmation"
          ? node.presentation.obligation.practice
          : null,
      ),
    [
      entry.task.targets[0].tracing.practice,
      entry.task.targets[0].independent.practice,
      entry.task.targets[1].tracing.practice,
      entry.task.targets[1].independent.practice,
    ],
  );
  assert.equal(task.nodes[0]?.guidance[0]?.kind, "action");
  assert.throws(() => compileWritingTask(task), /Legacy|seven source turns/);
});

test("declared capabilities reject malformed qualitative counts, missing capabilities, and foreign guidance source references", async () => {
  const plan = syntheticWritingPlan();
  const malformedCount = {
    ...plan,
    targets: [
      {
        ...plan.targets[0],
        tracing: {
          ...plan.targets[0].tracing,
          practice: { ...plan.targets[0].tracing.practice, minimum: 2 },
        },
      },
      plan.targets[1],
    ],
  };
  const foreign = {
    ...plan,
    targets: [
      {
        ...plan.targets[0],
        demonstration: {
          ...plan.targets[0].demonstration,
          guidance: [
            {
              kind: "action",
              runs: [
                {
                  copy: {
                    kind: "source",
                    text: "Foreign source",
                    sourceRef: "not-a-member",
                  },
                  emphasis: "plain",
                },
              ],
            },
          ],
        },
      },
      plan.targets[1],
    ],
  };
  for (const definition of [malformedCount, foreign]) {
    const value = await syntheticPlanEnvelope(definition);
    await assert.rejects(() => parseRuntimePackage(value, hash));
  }
  const missingCapability = await syntheticPlanEnvelope();
  missingCapability.body.requiredEngineCapabilities.pop();
  missingCapability.packageHash = await hash(canonical(missingCapability.body));
  await assert.rejects(() => parseRuntimePackage(missingCapability, hash));
});

test("original coverage refuses rich runs and new writing semantics instead of silently accepting an undeclared capability", async () => {
  const value = await syntheticPlanEnvelope();
  const content = await parseRuntimePackage(value, hash);
  assert.ok(content);
  const old = await parseRuntimePackage(
    JSON.parse(
      await (
        await import("node:fs/promises")
      ).readFile("tests/fixtures/course-development-package.json", "utf8"),
    ),
    hash,
  );
  assert.equal(old.body.coverage, "course-development");
  assert.ok("lessons" in old.body);
  const lesson = old.body.lessons[0];
  const entry = lesson?.tasks[0];
  assert.ok(entry?.kind === "printedGraphV1");
  const node = entry.task.nodes[0];
  const span = node?.guidance[0];
  assert.ok(node && span && "copy" in span);
  const body = {
    ...old.body,
    lessons: old.body.lessons.map((item) =>
      item === lesson
        ? {
            ...item,
            tasks: item.tasks.map((task) =>
              task === entry
                ? {
                    ...task,
                    task: {
                      ...entry.task,
                      nodes: entry.task.nodes.map((candidate) =>
                        candidate === node
                          ? {
                              ...candidate,
                              guidance: candidate.guidance.map((guidance) =>
                                guidance === span
                                  ? {
                                      kind: span.kind,
                                      runs: [
                                        { copy: span.copy, emphasis: "strong" },
                                      ],
                                    }
                                  : guidance,
                              ),
                            }
                          : candidate,
                      ),
                    },
                  }
                : task,
            ),
          }
        : item,
    ),
  };
  const richLegacy = { ...old, body, packageHash: await hash(canonical(body)) };
  await assert.rejects(() => parseRuntimePackage(richLegacy, hash), /Legacy/);
  const plan = await syntheticPlanEnvelope();
  const {
    contentSchemaVersion: _version,
    requiredEngineCapabilities: _caps,
    ...fields
  } = plan.body;
  const undeclared = {
    ...plan,
    body: { ...fields, coverage: "course-development" },
    packageHash: await hash(
      canonical({ ...fields, coverage: "course-development" }),
    ),
  };
  await assert.rejects(() => parseRuntimePackage(undeclared, hash));
});
