import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import {
  lessonFilesIdentity,
  parseLessonFilesCommand,
  parseLessonFilesReceipt,
} from "../../packages/teaching/src/index.ts";

const input = {
  version: 1,
  family: "lesson-files",
  installationId: "installation-fixture",
  commandId: "download-fixture",
  expected: { kind: "absent" },
  action: {
    kind: "download",
    target: {
      mode: "fixture",
      publicationHash: "a".repeat(64),
      courseId: "fixture-course",
      releaseId: "fixture-release",
    },
  },
};
const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");

test("lesson-file identity includes the complete explicit offer, mode, witness and command family", async () => {
  const expected = `{"action":{"kind":"download","target":{"courseId":"fixture-course","mode":"fixture","publicationHash":"${"a".repeat(64)}","releaseId":"fixture-release"}},"commandId":"download-fixture","expected":{"kind":"absent"},"family":"lesson-files","installationId":"installation-fixture","version":1}`;
  const identity = await lessonFilesIdentity(
    parseLessonFilesCommand(input),
    hash,
  );
  assert.equal(identity.preimage, expected);
  assert.equal(identity.payloadHash, await hash(expected));
  const changed = parseLessonFilesCommand({
    ...input,
    action: {
      kind: "download",
      target: { ...input.action.target, mode: "publication" },
    },
  });
  assert.notEqual(
    (await lessonFilesIdentity(changed, hash)).payloadHash,
    identity.payloadHash,
  );
  assert.deepEqual(
    parseLessonFilesCommand(JSON.parse(expected)),
    identity.command,
  );
  assert.equal(Object.isFrozen(identity.command.action), true);
});

test("lesson-file protocol rejects unsupported versions, unknown fields, malformed hashes and incomplete command variants", () => {
  for (const value of [
    { ...input, version: 2 },
    { ...input, family: "initial-install" },
    { ...input, hidden: true },
    { ...input, action: { kind: "use", target: input.action.target } },
    {
      ...input,
      action: {
        kind: "cancel",
        download: {
          installationId: input.installationId,
          commandId: "download-fixture",
          payloadHash: "bad",
        },
      },
    },
    {
      ...input,
      action: {
        kind: "download",
        target: { ...input.action.target, remoteCode: "ignored" },
      },
    },
  ])
    assert.throws(() => parseLessonFilesCommand(value));
});

test("ready and activation receipts retain exact source identity and lossless activation revision", () => {
  const common = {
    version: 1,
    family: "lesson-files",
    installationId: input.installationId,
    commandId: "use-fixture",
    payloadHash: "b".repeat(64),
  };
  const ready = parseLessonFilesReceipt({
    ...common,
    kind: "ready",
    target: input.action.target,
    packageHash: "a".repeat(64),
  });
  assert.equal(ready.kind, "ready");
  assert.throws(() =>
    parseLessonFilesReceipt({
      ...common,
      kind: "ready",
      target: input.action.target,
      packageHash: "c".repeat(64),
    }),
  );
  const active = parseLessonFilesReceipt({
    ...common,
    kind: "activated",
    packageHash: "a".repeat(64),
    activationRevision: "9007199254740993",
  });
  if (active.kind !== "activated")
    throw new Error("Expected activation receipt");
  assert.equal(active.activationRevision, "9007199254740993");
  assert.throws(() =>
    parseLessonFilesReceipt({
      ...common,
      kind: "activated",
      packageHash: "a".repeat(64),
      activationRevision: 9007199254740993,
    }),
  );
});
