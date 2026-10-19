import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import {
  parseRequest,
  parseResponse,
  serializeParentMaterial,
} from "../../apps/web/src/platform/protocol.ts";
import {
  parseHash,
  parsePreparationPackage,
  preparationPolicy,
  resolvedLessons,
} from "../../packages/teaching/src/index.ts";
import { createFixturePreparationPackage } from "../../tools/content/preparation.ts";
import { syntheticPrintedCourse } from "../printed-board-fixture.ts";
const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
const packageHash = parseHash({ kind: "package", value: "a".repeat(64) });

test("actual installation request boundary closes extra fields and preserves exact material request", () => {
  assert.deepEqual(parseRequest({ id: "catalog", kind: "installations" }), {
    id: "catalog",
    kind: "installations",
  });
  assert.deepEqual(
    parseRequest({
      id: "material",
      kind: "parentMaterial",
      input: { kind: "preparation", packageHash },
    }),
    {
      id: "material",
      kind: "parentMaterial",
      input: { kind: "preparation", packageHash },
    },
  );
  for (const raw of [
    { id: "catalog", kind: "installations", keys: [] },
    {
      id: "material",
      kind: "parentMaterial",
      input: { kind: "preparation", packageHash, keys: [] },
    },
    {
      id: "material",
      kind: "parentMaterial",
      input: { kind: "unknown", packageHash },
    },
    {
      id: "material",
      kind: "parentMaterial",
      input: { kind: "preparation", packageHash: "bad" },
    },
  ])
    assert.throws(() => parseRequest(raw));
});

test("raw preparation round trip requires actual local asynchronous verification after clone", async () => {
  const document = await createFixturePreparationPackage();
  const cloned = structuredClone(document);
  assert.throws(
    () => preparationPolicy({ kind: "available", document: cloned }),
    /verified document/,
  );
  const wire = serializeParentMaterial({
    kind: "preparation",
    packageHash,
    document,
  });
  const response = parseResponse(
    structuredClone({ id: "material", kind: "parentMaterial", value: wire }),
  );
  assert.equal(response.kind, "parentMaterial");
  if (
    response.kind !== "parentMaterial" ||
    response.value.kind !== "preparation"
  )
    throw Error("Wrong material branch");
  assert.deepEqual(Object.keys(response.value.document).sort(), [
    "assets",
    "body",
    "formatVersion",
    "preparationHash",
  ]);
  assert.equal(Object.getOwnPropertySymbols(response.value.document).length, 0);
  const parsed = await parsePreparationPackage(response.value.document, hash);
  assert.deepEqual(preparationPolicy({ kind: "available", document: parsed }), {
    kind: "reviewed",
    hash: document.preparationHash,
  });
  assert.equal(response.value.packageHash, packageHash);
  const corrupt = structuredClone(response.value.document);
  corrupt.body.title.copy.text += " changed";
  await assert.rejects(parsePreparationPackage(corrupt, hash), /hash/);
});

test("actual printed material response validates source semantics rather than accepting cloned tasks", async () => {
  const { content } = await syntheticPrintedCourse();
  const task = resolvedLessons(content)[0]?.tasks[0];
  assert.ok(task);
  const value = serializeParentMaterial({
    kind: "firstTaskPreview",
    packageHash,
    task,
  });
  const response = parseResponse(
    structuredClone({ id: "preview", kind: "parentMaterial", value }),
  );
  assert.equal(response.kind, "parentMaterial");
  if (
    response.kind !== "parentMaterial" ||
    response.value.kind !== "firstTaskPreview"
  )
    throw Error("Wrong preview branch");
  assert.deepEqual(response.value.task, task);
  assert.throws(() =>
    parseResponse({
      id: "preview",
      kind: "parentMaterial",
      value: {
        ...value,
        task: {
          ...task,
          task: { ...task.task, startNodeId: "missing-source-node" },
        },
      },
    }),
  );
  for (const reason of [
    "content",
    "shell",
    "representationUnavailable",
    "unsupportedProfile",
    "verificationUnavailable",
    "unsupportedPreview",
  ]) {
    const parsed = parseResponse({
      id: "unavailable",
      kind: "parentMaterial",
      value: { kind: "unavailable", packageHash, reason },
    });
    assert.equal(parsed.kind, "parentMaterial");
  }
  assert.throws(() =>
    parseResponse({
      id: "unavailable",
      kind: "parentMaterial",
      value: { kind: "unavailable", packageHash, reason: "made-up" },
    }),
  );
});
