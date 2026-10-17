import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import {
  parseCounter,
  parseId,
  parseLocalPreferences,
  parsePreparationPolicy,
  parseProfileAdministrationCommand,
  parseProfileAdministrationReceipt,
  prepareProfileAdministration,
  resolveAvatar,
} from "@readatthree/teaching";

const installationId = parseId({ kind: "installation", value: "installation" });
const owner = {
  profileId: parseId({ kind: "profile", value: "child-a" }),
  generation: parseCounter("3"),
};
const selection = { installationId, revision: parseCounter("7"), owner };
const directory = { installationId, revision: parseCounter("12") };
const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");

test("profile preferences keep unknown animal keys and unrelated versioned choices while display fallback stays read-only", () => {
  const supplied = {
    version: 1,
    displayName: "Same",
    avatarId: "future-animal",
    writing: { version: 1, hand: "left" },
    accessibility: { largeText: true },
  };
  const preferences = parseLocalPreferences(supplied);
  assert.deepEqual(preferences, {
    version: 1,
    displayName: "Same",
    avatarId: "future-animal",
    writing: { version: 1, hand: "left" },
    accessibility: { largeText: true },
  });
  assert.equal(resolveAvatar({ savedId: preferences.avatarId }), "rabbit");
  assert.equal(resolveAvatar({ savedId: "owl" }), "owl");
  assert.equal(resolveAvatar({ savedId: undefined }), "rabbit");
  assert.equal(preferences.avatarId, "future-animal");
  for (const invalid of [
    { version: 2 },
    { version: 1, avatarId: "x".repeat(201) },
    { version: 1, displayName: "x".repeat(121) },
    { version: 1, writing: { pressure: Number.NaN } },
    { version: 1, extra: "x".repeat(16385) },
    { version: 1, callback: () => true },
  ])
    assert.throws(() => parseLocalPreferences(invalid));
});

test("preparation availability comes only from an explicit reviewed policy with a valid identity", () => {
  assert.deepEqual(parsePreparationPolicy({ kind: "unavailable" }), {
    kind: "unavailable",
  });
  assert.deepEqual(
    parsePreparationPolicy({ kind: "reviewed", hash: "1".repeat(64) }),
    { kind: "reviewed", hash: "1".repeat(64) },
  );
  for (const invalid of [
    "1".repeat(64),
    { kind: "reviewed" },
    { kind: "reviewed", hash: "unknown" },
    { kind: "unavailable", hash: "1".repeat(64) },
  ])
    assert.throws(() => parsePreparationPolicy(invalid));
});

test("preparing an independent avatar edit retains its exact selected lifetime, target generation and revisions", async () => {
  const command = await prepareProfileAdministration({
    intent: {
      kind: "setAvatar",
      directory,
      target: {
        owner: {
          profileId: parseId({ kind: "profile", value: "child-b" }),
          generation: parseCounter("5"),
        },
        revision: parseCounter("9"),
      },
      avatarId: "cat",
    },
    selection,
    ids: () => "command-edit-b",
    hash,
  });
  const expectedPayload = {
    kind: "setAvatar",
    target: { owner: { profileId: "child-b", generation: "5" }, revision: "9" },
    avatarId: "cat",
  };
  const expectedHash = createHash("sha256")
    .update(
      '{"payload":{"avatarId":"cat","kind":"setAvatar","target":{"owner":{"generation":"5","profileId":"child-b"},"revision":"9"}},"scope":{"installationId":"installation","revision":"12"},"selection":{"installationId":"installation","owner":{"generation":"3","profileId":"child-a"},"revision":"7"},"version":1}',
    )
    .digest("hex");
  assert.deepEqual(command, {
    version: 1,
    commandId: "command-edit-b",
    scope: { installationId: "installation", revision: "12" },
    selection: {
      installationId: "installation",
      revision: "7",
      owner: { profileId: "child-a", generation: "3" },
    },
    payloadHash: expectedHash,
    payload: expectedPayload,
  });
  assert.deepEqual(
    parseProfileAdministrationCommand(JSON.parse(JSON.stringify(command))),
    command,
  );
  for (const invalid of [
    { ...command, version: 2 },
    { ...command, unknown: true },
    { ...command, payload: { ...expectedPayload, avatarId: "future-animal" } },
    {
      ...command,
      scope: { ...command.scope, revision: "9223372036854775808" },
    },
    { ...command, scope: { ...command.scope, installationId: "foreign" } },
    {
      ...command,
      payload: {
        ...expectedPayload,
        target: {
          owner: { profileId: "child-b", generation: "-1" },
          revision: "9",
        },
      },
    },
  ])
    assert.throws(() => parseProfileAdministrationCommand(invalid));
});

test("creation preparation allocates one retained child identity and keeps the complete departure in the immutable command", async () => {
  let next = 0;
  const command = await prepareProfileAdministration({
    intent: {
      kind: "createAndSelect",
      directory,
      preferences: { avatarId: "owl", displayName: "Same" },
    },
    selection,
    departure: { courses: [] },
    ids: () => `allocated-${++next}`,
    hash,
  });
  assert.equal(next, 2);
  assert.equal(command.commandId, "allocated-2");
  assert.deepEqual(command.payload, {
    kind: "createAndSelect",
    owner: { profileId: "allocated-1", generation: "0" },
    preferences: { avatarId: "owl", displayName: "Same" },
    departure: { courses: [] },
  });
  const receipt = parseProfileAdministrationReceipt({
    kind: "profileCommitted",
    version: 1,
    commandId: command.commandId,
    payloadHash: command.payloadHash,
    administration: { installationId: "installation", revision: "13" },
    selection: {
      installationId: "installation",
      revision: "8",
      owner: { profileId: "allocated-1", generation: "0" },
    },
    effect: {
      kind: "created",
      target: {
        owner: { profileId: "allocated-1", generation: "0" },
        revision: "0",
      },
    },
  });
  assert.deepEqual(receipt.selection.owner, {
    profileId: "allocated-1",
    generation: "0",
  });
  assert.deepEqual(receipt.effect, {
    kind: "created",
    target: {
      owner: { profileId: "allocated-1", generation: "0" },
      revision: "0",
    },
  });
  assert.throws(() =>
    parseProfileAdministrationReceipt({ ...receipt, version: 2 }),
  );
  assert.throws(() =>
    parseProfileAdministrationReceipt({
      ...receipt,
      effect: {
        kind: "created",
        target: {
          owner: { profileId: "allocated-1", generation: "0" },
          revision: "-1",
        },
      },
    }),
  );
});

test("administration receipts describe one installation including the previous selected lifetime", () => {
  const receipt = {
    kind: "profileCommitted",
    version: 1,
    commandId: "selection-command",
    payloadHash: "3".repeat(64),
    administration: { installationId: "installation", revision: "13" },
    selection: {
      installationId: "installation",
      revision: "8",
      owner: { profileId: "child-b", generation: "0" },
    },
    effect: {
      kind: "selection",
      previous: {
        installationId: "installation",
        revision: "7",
        owner: { profileId: "child-a", generation: "3" },
      },
    },
  };
  assert.deepEqual(parseProfileAdministrationReceipt(receipt), receipt);
  for (const invalid of [
    {
      ...receipt,
      administration: { ...receipt.administration, installationId: "foreign" },
    },
    {
      ...receipt,
      selection: { ...receipt.selection, installationId: "foreign" },
    },
    {
      ...receipt,
      effect: {
        kind: "selection",
        previous: { ...receipt.effect.previous, installationId: "foreign" },
      },
    },
  ])
    assert.throws(
      () => parseProfileAdministrationReceipt(invalid),
      /installation/,
    );
});
