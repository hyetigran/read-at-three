import { asc } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  canonical,
  parseCounter,
  parseLocalPreferences,
  parsePreparationPolicy,
  parseProfileDirectory,
} from "../../teaching/src/index.ts";
import type {
  Owner,
  PreparationPolicy,
  ProfileDirectory,
} from "../../teaching/src/index.ts";
import * as schema from "./schema.ts";

export function createProfileDirectory({
  db,
  preparation: suppliedPreparation,
}: {
  db: ReturnType<typeof drizzle>;
  preparation: PreparationPolicy;
}) {
  const preparation = parsePreparationPolicy(suppliedPreparation);
  async function rows() {
    const installations = await db.select().from(schema.installation).all();
    const states = await db
      .select()
      .from(schema.installationProfileState)
      .all();
    const profiles = await db
      .select()
      .from(schema.profile)
      .orderBy(asc(schema.profile.id))
      .all();
    const installation = installations[0],
      state = states[0];
    if (
      installations.length !== 1 ||
      states.length !== 1 ||
      !installation ||
      !state ||
      state.installationId !== installation.id
    )
      throw new Error("Installation profile selection is unavailable");
    if (
      !profiles.some(
        (profile) =>
          profile.id === state.profileId &&
          profile.generation === state.generation,
      )
    )
      throw new Error("Selected child generation is unavailable");
    if (
      profiles.some(
        (profile) =>
          Number(profile.preferencesVersion) !== 1 ||
          profile.preferences.length > 16384,
      )
    )
      throw new Error("Saved profile preferences are unsupported");
    return { installation, state, profiles };
  }
  async function read(): Promise<ProfileDirectory> {
    const { installation, state, profiles } = await rows();
    return parseProfileDirectory({
      administration: {
        installationId: installation.id,
        revision: installation.revision,
      },
      selection: {
        installationId: installation.id,
        revision: state.selectionRevision,
        owner: { profileId: state.profileId, generation: state.generation },
      },
      profiles: profiles.map((profile) => ({
        edit: {
          owner: { profileId: profile.id, generation: profile.generation },
          revision: profile.revision,
        },
        preferences: JSON.parse(profile.preferences),
      })),
      preparation:
        preparation.kind === "unavailable"
          ? { kind: "unavailable", acknowledgedHash: state.preparationHash }
          : state.preparationHash === preparation.hash
            ? { kind: "acknowledged", hash: preparation.hash }
            : {
                kind: "required",
                requiredHash: preparation.hash,
                acknowledgedHash: state.preparationHash,
              },
      initialSetup: { kind: state.setupMode },
    });
  }
  async function bootstrap({
    owner,
    installationId,
  }: {
    owner: Owner;
    installationId: (typeof schema.installation.$inferSelect)["id"];
  }) {
    await db
      .insert(schema.installationProfileState)
      .values({
        installationId,
        profileId: owner.profileId,
        generation: owner.generation,
        selectionRevision: parseCounter("0"),
        preparationHash: null,
        setupMode: "firstLaunch",
      })
      .run();
  }
  async function migrate() {
    const installations = await db.select().from(schema.installation).all();
    if (installations.length === 0) return;
    const installation = installations[0];
    if (installations.length !== 1 || !installation)
      throw new Error("Installation metadata is incompatible");
    const profiles = await db
      .select()
      .from(schema.profile)
      .orderBy(asc(schema.profile.id))
      .all();
    const selected = profiles[0];
    if (!selected) throw new Error("Installation has no child to preserve");
    for (const profile of profiles) {
      if (
        Number(profile.preferencesVersion) !== 1 ||
        profile.preferences.length > 16384
      )
        throw new Error("Saved profile preferences are unsupported");
      parseLocalPreferences(JSON.parse(profile.preferences));
    }
    const [cursors, sessions, receipts] = await Promise.all([
      db
        .select({ id: schema.courseCursor.profileId })
        .from(schema.courseCursor)
        .all(),
      db.select({ id: schema.session.sessionId }).from(schema.session).all(),
      db
        .select({ id: schema.commandReceipt.commandId })
        .from(schema.commandReceipt)
        .all(),
    ]);
    const untouched =
      profiles.length === 1 &&
      installation.revision === "0" &&
      selected.generation === "0" &&
      selected.revision === "0" &&
      selected.undoRunId === null &&
      canonical(JSON.parse(selected.preferences)) ===
        canonical({ version: 1 }) &&
      cursors.length === 0 &&
      sessions.length === 0 &&
      receipts.length === 0;
    await db
      .insert(schema.installationProfileState)
      .values({
        installationId: installation.id,
        profileId: selected.id,
        generation: selected.generation,
        selectionRevision: parseCounter("0"),
        preparationHash: null,
        setupMode: untouched ? "firstLaunch" : "existingFamily",
      })
      .run();
    await read();
  }
  async function selected(): Promise<Owner> {
    const { state } = await rows();
    return { profileId: state.profileId, generation: state.generation };
  }
  return { read, bootstrap, migrate, selected };
}
