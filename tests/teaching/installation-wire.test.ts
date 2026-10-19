import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import {
  initialInstallIdentity,
  parseInitialInstallCommand,
  parseInstallationRead,
  parseInstallationCatalog,
  parsePrintedPreviewTask,
  resolvedLessons,
} from "../../packages/teaching/src/index.ts";
import { syntheticPrintedCourse } from "../printed-board-fixture.ts";

async function readFixture() {
  const command = parseInitialInstallCommand({
    version: 1,
    kind: "initialInstall",
    installationId: "neutral-installation",
    commandId: "neutral-command",
    source: { mode: "fixture" },
    target: {
      publicationHash: "a".repeat(64),
      courseId: "neutral-course",
      releaseId: "neutral-release",
    },
    expected: { kind: "absent" },
  });
  const identity = await initialInstallIdentity(command, async (text) =>
    createHash("sha256").update(text).digest("hex"),
  );
  return {
    command,
    fact: {
      version: 1,
      kind: "activated",
      installationId: command.installationId,
      commandId: command.commandId,
      payloadHash: identity.payloadHash,
      registeredPackageHash: command.target.publicationHash,
      activationRevision: "0",
    },
    availability: { kind: "stale", last: "verified" },
  };
}

test("installation wire parsing retains exact command/fact identity and observational availability", async () => {
  const raw = await readFixture();
  assert.deepEqual(parseInstallationRead(structuredClone(raw)), raw);
  for (const value of [
    { ...raw, extra: true },
    { ...raw, fact: { ...raw.fact, commandId: "another-command" } },
    { ...raw, fact: { ...raw.fact, installationId: "another-installation" } },
    { ...raw, fact: { ...raw.fact, registeredPackageHash: "b".repeat(64) } },
    { ...raw, fact: { ...raw.fact, payloadHash: "invalid" } },
    { ...raw, fact: { ...raw.fact, activationRevision: "-1" } },
    { ...raw, availability: { kind: "verified" } },
    { ...raw, availability: { kind: "stale", last: "unknown" } },
    { ...raw, availability: { kind: "checking", inspectionId: "" } },
  ])
    assert.throws(() => parseInstallationRead(value));
});

test("installation catalog refuses duplicate or crossed ownership without treating metadata as permission", async () => {
  const read = await readFixture();
  const raw = {
    installationId: read.command.installationId,
    courses: [
      {
        courseId: read.command.target.courseId,
        activation: {
          kind: "present",
          revision: "0",
          activePackageHash: read.command.target.publicationHash,
          fallbackPackageHash: null,
        },
      },
    ],
    commands: [read],
  };
  assert.deepEqual(parseInstallationCatalog(structuredClone(raw)), raw);
  for (const value of [
    { ...raw, courses: [...raw.courses, ...raw.courses] },
    { ...raw, commands: [read, read] },
    { ...raw, installationId: "another-installation" },
    { ...raw, courses: [] },
    {
      ...raw,
      courses: [
        {
          ...raw.courses[0],
          activation: {
            kind: "present",
            revision: "0",
            activePackageHash: "bad",
            fallbackPackageHash: null,
          },
        },
      ],
    },
  ])
    assert.throws(() => parseInstallationCatalog(value));
});

test("standalone printed preview parsing uses actual task schema and semantic compiler", async () => {
  const { content } = await syntheticPrintedCourse();
  const first = resolvedLessons(content)[0]?.tasks[0];
  assert.ok(
    first &&
      (first.kind === "printedGraphV1" || first.kind === "printedGraphV2"),
  );
  const raw = structuredClone(first);
  assert.deepEqual(parsePrintedPreviewTask(raw), first);
  assert.throws(() =>
    parsePrintedPreviewTask({ ...raw, kind: "graphControls" }),
  );
  assert.throws(() =>
    parsePrintedPreviewTask({
      ...raw,
      task: { ...raw.task, startNodeId: "not-a-source-node" },
    }),
  );
  assert.throws(() =>
    parsePrintedPreviewTask({
      ...raw,
      task: { ...raw.task, unrecognized: true },
    }),
  );
});

test("publication recovery wire closes literal outer target and complete result reasons", async () => {
  const {
    parsePublicationSelection,
    parsePublicationCheck,
    parseInstalledResourceFailure,
  } = await import("../../packages/teaching/src/index.ts");
  const target = parsePublicationSelection({
    installationId: "fixture.installation",
    packageHash: "a".repeat(64),
  });
  for (const value of [
    { ...target, expected: { kind: "absent" } },
    { ...target, packageHash: "wrong" },
    { ...target, installationId: "" },
    { ...target, url: "/download" },
  ])
    assert.throws(() => parsePublicationSelection(value));
  for (const kind of ["verified", "notAuthorized", "staleTarget"])
    assert.deepEqual(parsePublicationCheck({ kind, target }), { kind, target });
  const reason = {
    kind: "content",
    failure: { kind: "corrupt", reason: "resource-integrity" },
  };
  assert.deepEqual(
    parsePublicationCheck({ kind: "unavailable", target, reason }),
    { kind: "unavailable", target, reason },
  );
  assert.deepEqual(
    parseInstalledResourceFailure({ packageHash: target.packageHash, reason }),
    { packageHash: target.packageHash, reason },
  );
  for (const value of [
    { kind: "verified", target, success: true },
    { kind: "unavailable", target },
    {
      kind: "unavailable",
      target,
      reason: {
        kind: "content",
        failure: { kind: "corrupt", reason: "invented" },
      },
    },
    { kind: "verified", target: { ...target, packageHash: "invalid" } },
  ])
    assert.throws(() => parsePublicationCheck(value));
});
