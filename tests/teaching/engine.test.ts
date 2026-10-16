import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import {
  canonicalContentBody,
  evaluate,
  initialState,
  parseDevelopmentPackage,
  project,
  prepareCommand,
  parseProjection,
  parseId,
} from "../../packages/teaching/src/index.ts";
const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
const copy = { kind: "added", text: "Synthetic non-book fixture" } as const;
export const body = {
  courseId: "synthetic-course",
  releaseId: "synthetic-release",
  coverage: "partial-first-m",
  title: copy,
  lessonId: "synthetic-lesson",
  taskId: "synthetic-task",
  startNodeId: "model",
  nodes: [
    {
      id: "model",
      parentAction: copy,
      spoken: copy,
      expected: copy,
      parentRole: "model",
      glyph: "m",
      cue: { kind: "sustain", durationMs: 2000 },
      next: { kind: "node", nodeId: "child" },
    },
    {
      id: "child",
      parentAction: copy,
      spoken: copy,
      expected: copy,
      parentRole: "listen",
      glyph: "m",
      cue: { kind: "sustain", durationMs: 2000 },
      next: {
        kind: "frontier",
        unmetObligations: ["later-required-m", "required-s"],
      },
    },
  ],
} as const;
export async function fixture() {
  return parseDevelopmentPackage(
    {
      formatVersion: 1,
      body,
      packageHash: await hash(canonicalContentBody(body)),
    },
    hash,
  );
}
test("parent acceptance follows exact nodes and partial frontier never completes", async () => {
  const content = await fixture();
  const first = initialState(content);
  const modelId = parseId({ kind: "node", value: "model" });
  const childId = parseId({ kind: "node", value: "child" });
  assert.equal(project(content, first).kind, "teaching");
  assert.throws(() => evaluate(content, first, childId), /current/);
  const second = evaluate(content, first, modelId);
  assert.equal(project(content, second).kind, "teaching");
  const frontier = evaluate(content, second, childId);
  assert.deepEqual(project(content, frontier), {
    kind: "frontier",
    status: "inProgress",
    unmetObligations: ["later-required-m", "required-s"],
  });
  assert.throws(() => evaluate(content, frontier, childId), /frontier/);
});
test("content rejects tamper, cycles, unknown properties and missing frontier", async () => {
  const content = await fixture();
  await assert.rejects(
    () =>
      parseDevelopmentPackage(
        { ...content, body: { ...content.body, extra: true } },
        hash,
      ),
    /schema/,
  );
  await assert.rejects(
    () =>
      parseDevelopmentPackage(
        { ...content, packageHash: "0".repeat(64) },
        hash,
      ),
    /hash/,
  );
  const cyclic = {
    ...body,
    nodes: [
      { ...body.nodes[0], next: { kind: "node", nodeId: "model" } },
      body.nodes[1],
    ],
  } as const;
  const cyclicHash = await hash(canonicalContentBody(cyclic));
  await assert.rejects(
    () =>
      parseDevelopmentPackage(
        { formatVersion: 1, body: cyclic, packageHash: cyclicHash },
        hash,
      ),
    /cycle|frontier/,
  );
});
test("command preparation captures immutable profile scope exactly once", async () => {
  const content = await fixture();
  const command = await prepareCommand({
    projection: parseProjection({
      kind: "entry",
      owner: { profileId: "p", generation: "0" },
      profileRevision: "9007199254740993",
      packageHash: content.packageHash,
      title: content.body.title,
      catalog: [],
      actions: [
        {
          label: copy,
          intent: {
            kind: "start",
            taskId: "synthetic-task",
            packageHash: content.packageHash,
            sessionId: null,
          },
        },
      ],
    }),
    ids: () => "command",
    hash,
  });
  assert.equal(command.scope.kind, "profile");
  assert.equal(command.expectedRevision, "9007199254740993");
  assert(Object.isFrozen(command));
  assert(Object.isFrozen(command.payload));
});
