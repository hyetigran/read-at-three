import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import {
  parseRequest,
  parseResponse,
} from "../../apps/web/src/platform/protocol.ts";
import {
  assertLessonFilesEvidence,
  lessonFilesIdentity,
  parseLessonFilesCommand,
  parseLessonFilesReceipt,
} from "../../packages/teaching/src/index.ts";

test("catalog worker boundaries retain the complete exact Retry command and reject changed receipt sources", async () => {
  const command = parseLessonFilesCommand({
    version: 1,
    family: "lesson-files",
    installationId: "fixture.installation",
    commandId: "fixture.download",
    expected: {
      kind: "present",
      activePackageHash: "a".repeat(64),
      fallbackPackageHash: null,
      revision: "9007199254740993",
    },
    action: {
      kind: "download",
      target: {
        mode: "fixture",
        publicationHash: "b".repeat(64),
        courseId: "fixture.course",
        releaseId: "fixture.release.b",
      },
    },
  });
  const identity = await lessonFilesIdentity(command, async (text) =>
    createHash("sha256").update(text).digest("hex"),
  );
  assert.deepEqual(
    parseRequest({ id: "exact-command", kind: "changeLessonFiles", command }),
    { id: "exact-command", kind: "changeLessonFiles", command },
  );
  assert.throws(() =>
    parseRequest({ id: "extra", kind: "readLessonFiles", acquire: true }),
  );
  assert.throws(() =>
    parseRequest({
      id: "extra",
      kind: "changeLessonFiles",
      command: { ...command, force: true },
    }),
  );
  const receipt = parseLessonFilesReceipt({
    version: 1,
    family: "lesson-files",
    installationId: command.installationId,
    commandId: command.commandId,
    payloadHash: identity.payloadHash,
    kind: "ready",
    target: command.action.kind === "download" ? command.action.target : null,
    packageHash: "b".repeat(64),
  });
  const response = {
    id: "view",
    kind: "lessonFiles",
    value: {
      activation: command.expected,
      offer: {
        kind: "available",
        target:
          command.action.kind === "download" ? command.action.target : null,
      },
      commands: [{ command, receipt, observation: { kind: "idle" } }],
      packages: [
        { packageHash: "b".repeat(64), role: "inactive", bytes: "verified" },
      ],
    },
  };
  const view = parseResponse(response);
  if (view.kind !== "lessonFiles")
    throw new Error("Expected catalog projection");
  assert.deepEqual(view.value.commands[0]?.command, command);
  assert.deepEqual(view.value.commands[0]?.receipt, receipt);
  if (receipt.kind !== "ready") throw new Error("Expected Ready receipt");
  assert.throws(
    () =>
      parseResponse({
        ...response,
        value: {
          ...response.value,
          commands: [
            {
              command,
              receipt: {
                ...receipt,
                target: {
                  ...receipt.target,
                  releaseId: "fixture.release.other",
                },
              },
              observation: { kind: "idle" },
            },
          ],
        },
      }),
    /target changed/,
  );
  const use = parseLessonFilesCommand({
    ...command,
    commandId: "fixture.use",
    action: {
      kind: "use",
      target: receipt.target,
      ready: {
        installationId: receipt.installationId,
        commandId: receipt.commandId,
        payloadHash: receipt.payloadHash,
      },
    },
  });
  const activated = parseLessonFilesReceipt({
    version: 1,
    family: "lesson-files",
    installationId: use.installationId,
    commandId: use.commandId,
    payloadHash: receipt.payloadHash,
    kind: "activated",
    packageHash: receipt.packageHash,
    activationRevision: "9007199254740993",
  });
  assert.throws(() => assertLessonFilesEvidence(use, activated));
});
