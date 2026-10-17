import assert from "node:assert/strict";
import {
  canonical,
  parseHash,
  parseSelectedOperation,
  prepareProfileAdministration,
} from "@readatthree/teaching";
import type {
  CourseReadTarget,
  DocumentToken,
  HashFunction,
  IdFactory,
  InkCommand,
  Owner,
  PracticeControlsBinding,
  PreparationPolicy,
  RunId,
  SelectedApplication,
  SelectedInkOperation,
  SelectedTeachingOperation,
  TeachingCommand,
  ProfileAdministrationIntent,
  ProfileDirectory,
} from "@readatthree/teaching";

export const syntheticPreparation = {
  kind: "reviewed",
  hash: parseHash({ kind: "preparation", value: "6".repeat(64) }),
} satisfies PreparationPolicy;

export async function confirmInitialProfile(
  app: SelectedApplication,
  ids: IdFactory,
  hash: HashFunction,
) {
  let directory = await app.readDirectory();
  if (directory.initialSetup.kind !== "firstLaunch") return;
  if (directory.preparation.kind !== "acknowledged") {
    if (directory.preparation.kind !== "required")
      throw new Error(
        "The fixture requires its reviewed synthetic preparation",
      );
    const result = await app.administer(
      await prepareProfileAdministration({
        selection: directory.selection,
        ids,
        hash,
        intent: {
          kind: "acknowledgePreparation",
          directory: directory.administration,
          hash: directory.preparation.requiredHash,
        },
      }),
    );
    if (result.kind !== "profileCommitted") throw new Error(result.message);
    directory = await app.readDirectory();
  }
  const result = await app.administer(
    await prepareProfileAdministration({
      selection: directory.selection,
      ids,
      hash,
      intent: {
        kind: "finishInitialProfile",
        directory: directory.administration,
        target: directory.profiles[0].edit,
        preferences: { avatarId: "rabbit" },
      },
    }),
  );
  if (result.kind !== "profileCommitted") throw new Error(result.message);
}

export async function selectedCourse(
  app: SelectedApplication,
  target: CourseReadTarget = { kind: "cursor" },
) {
  const directory = await app.readDirectory();
  const read = await app.readApplication({
    selection: directory.selection,
    target,
  });
  assert.deepEqual(read.directory.selection, directory.selection);
  return read.application;
}
export async function selectedProjection(app: SelectedApplication) {
  const read = await selectedCourse(app);
  return read.kind === "ready" ? read.projection : read;
}
export async function selectedInk(
  app: SelectedApplication,
  input: { token: DocumentToken },
) {
  const selection = (await app.readDirectory()).selection;
  const read = await app.readInk({ selection, token: input.token });
  assert.deepEqual(read.selection, selection);
  return read.value;
}
export async function selectedControls(
  app: SelectedApplication,
  binding: PracticeControlsBinding,
) {
  const selection = (await app.readDirectory()).selection;
  const read = await app.readPracticeControls({ selection, binding });
  assert.deepEqual(read.selection, selection);
  return read.value;
}
export async function selectedWork(
  app: SelectedApplication,
  input: { owner: Owner; runId: RunId },
) {
  const current = (await app.readDirectory()).selection;
  const selection = { ...current, owner: input.owner };
  const read = await app.readWork({ selection, runId: input.runId });
  assert.deepEqual(read.selection, selection);
  return read.value;
}
export async function prepareSelectedTeaching(
  app: SelectedApplication,
  build: () => TeachingCommand | Promise<TeachingCommand>,
): Promise<SelectedTeachingOperation> {
  const selection = (await app.readDirectory()).selection;
  const operation = parseSelectedOperation({
    kind: "teaching",
    selection,
    command: await build(),
  });
  if (operation.kind !== "teaching")
    throw new Error("Teaching operation required");
  return operation;
}
export async function prepareSelectedInk(
  app: SelectedApplication,
  build: () => InkCommand | Promise<InkCommand>,
): Promise<SelectedInkOperation> {
  const selection = (await app.readDirectory()).selection;
  const operation = parseSelectedOperation({
    kind: "ink",
    selection,
    command: await build(),
  });
  if (operation.kind !== "ink") throw new Error("Ink operation required");
  return operation;
}
export async function executeTeaching(
  app: SelectedApplication,
  operation: SelectedTeachingOperation,
) {
  const result = await app.execute(operation);
  if (result.kind !== "teaching") throw new Error("Teaching result required");
  return result.result;
}
export async function executeInk(
  app: SelectedApplication,
  operation: SelectedInkOperation,
) {
  const result = await app.execute(operation);
  if (result.kind !== "ink") throw new Error("Ink result required");
  return result.result;
}
export async function changeProfile(
  app: SelectedApplication,
  ids: IdFactory,
  hash: HashFunction,
  build: (directory: ProfileDirectory) => ProfileAdministrationIntent,
) {
  const directory = await app.readDirectory();
  const intent = build(directory);
  const common = { selection: directory.selection, ids, hash };
  const command =
    intent.kind === "selectProfile" || intent.kind === "createAndSelect"
      ? await prepareProfileAdministration({
          ...common,
          intent,
          departure: await app.readDeparture({
            selection: directory.selection,
          }),
        })
      : await prepareProfileAdministration({ ...common, intent });
  const result = await app.administer(command);
  if (result.kind !== "profileCommitted") throw new Error(result.message);
  return { command, result };
}
