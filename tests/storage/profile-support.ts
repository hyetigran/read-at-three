import assert from "node:assert/strict";
import { parseHash, prepareProfileAdministration } from "@readatthree/teaching";
import type {
  ProfileAdministrationIntent,
  ProfileDirectory,
} from "@readatthree/teaching";
import { practiceFixture } from "./practice-support.ts";
import { hash } from "./support.ts";

export async function profileFixture(t: Parameters<typeof practiceFixture>[0]) {
  const fixture = await practiceFixture(t);
  const preparation = {
    kind: "reviewed",
    hash: parseHash({ kind: "preparation", value: "4".repeat(64) }),
  } satisfies import("@readatthree/teaching").PreparationPolicy;
  const connect = (options: Parameters<typeof fixture.connect>[0] = {}) =>
    fixture.connect({ ...options, preparation });
  type Application = ReturnType<typeof connect>["app"];
  async function request(
    app: Application,
    build: (directory: ProfileDirectory) => ProfileAdministrationIntent,
  ) {
    const directory = await app.readDirectory();
    const intent = build(directory);
    const common = { selection: directory.selection, ids: fixture.ids, hash };
    return intent.kind === "createAndSelect" || intent.kind === "selectProfile"
      ? prepareProfileAdministration({
          ...common,
          intent,
          departure: await app.readDeparture({
            selection: directory.selection,
          }),
        })
      : prepareProfileAdministration({ ...common, intent });
  }
  async function change(
    app: Application,
    build: (directory: ProfileDirectory) => ProfileAdministrationIntent,
  ) {
    const command = await request(app, build);
    const result = await app.administer(command);
    if (result.kind !== "profileCommitted") assert.fail(result.message);
    return { command, result };
  }
  async function setup(app: Application) {
    await change(app, (directory) => ({
      kind: "acknowledgePreparation",
      directory: directory.administration,
      hash: preparation.hash,
    }));
    const directory = await app.readDirectory();
    const first = directory.profiles[0];
    await change(app, (directory) => ({
      kind: "finishInitialProfile",
      directory: directory.administration,
      target: first.edit,
      preferences: { avatarId: "rabbit", displayName: "Same" },
    }));
    return first.edit.owner;
  }
  return { ...fixture, connect, request, change, setup, preparation };
}
