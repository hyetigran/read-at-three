import { createProfileRemoval } from "./profile-removal.ts";
import { decodeAdministrationEvidence, receiptFor } from "./profile-receipt.ts";
import type { SqlExecutor } from "./executor.ts";
import { and, asc, desc, eq } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  canonical,
  increment,
  parseCounter,
  parseLocalPreferences,
  parsePreparationPolicy,
  parseProfileDirectory,
} from "../../teaching/src/index.ts";
import type {
  Owner,
  PreparationPolicy,
  ProfileDirectory,
  CommandRejection,
  DepartureWitness,
  ProfileAdministrationCommand,
  ProfileAdministrationReceipt,
  ProfileSummary,
  SelectedOwnerWitness,
} from "../../teaching/src/index.ts";
import * as schema from "./schema.ts";

export function createProfileDirectory({
  db,
  executor,
  preparation: suppliedPreparation,
}: {
  db: ReturnType<typeof drizzle>;
  executor: SqlExecutor;
  preparation: PreparationPolicy | (() => PreparationPolicy);
}) {
  const policy = () =>
    parsePreparationPolicy(
      typeof suppliedPreparation === "function"
        ? suppliedPreparation()
        : suppliedPreparation,
    );
  const removal = createProfileRemoval({ db, executor });
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
    const preparation = policy();
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
  const reject = (code: string, message: string): CommandRejection => ({
    kind: "rejected",
    code,
    message,
  });
  async function resolveRetained({
    command,
    directory: current,
  }: {
    command: ProfileAdministrationCommand;
    directory: ProfileDirectory;
  }): Promise<ProfileAdministrationReceipt | CommandRejection | null> {
    if (command.scope.installationId !== current.administration.installationId)
      return reject(
        "stale-installation",
        "Profile changes belong to another installation.",
      );
    const saved = (
      await db
        .select()
        .from(schema.profileAdministrationReceipt)
        .where(
          and(
            eq(
              schema.profileAdministrationReceipt.installationId,
              command.scope.installationId,
            ),
            eq(
              schema.profileAdministrationReceipt.commandId,
              command.commandId,
            ),
          ),
        )
        .all()
    )[0];
    const evidence = saved ? decodeAdministrationEvidence(saved) : null;
    if (evidence && evidence.kind !== "full") {
      const identity =
        evidence.kind === "retired"
          ? evidence.identity
          : {
              payloadHash: evidence.receipt.payloadHash,
              version: evidence.receipt.version,
              expectedRevision: evidence.receipt.expectedRevision,
            };
      if (
        identity.payloadHash !== command.payloadHash ||
        identity.version !== command.version ||
        identity.expectedRevision !== command.scope.revision
      )
        return reject(
          "command-identity",
          "This profile command identity has a different payload.",
        );
      if (evidence.kind === "retired")
        return reject(
          "stale-owner",
          "This command belongs to a retired child lifetime.",
        );
      if (command.version !== 2 || command.payload.kind !== "deleteProfile")
        throw new Error("Saved deletion receipt is corrupt");
      return evidence.receipt;
    }
    const live = (owner: Owner) =>
      current.profiles.find(
        (profile) =>
          profile.edit.owner.profileId === owner.profileId &&
          profile.edit.owner.generation === owner.generation,
      );
    if (!live(command.selection.owner))
      return reject(
        "stale-owner",
        "The captured child generation is unavailable.",
      );
    const body = command.payload;
    if (command.version === 2 && !live(command.payload.target.owner))
      return reject(
        "stale-owner",
        "The removed child lifetime is unavailable.",
      );
    if (
      (body.kind === "setAvatar" ||
        body.kind === "setDisplayName" ||
        body.kind === "finishInitialProfile") &&
      !live(body.target.owner)
    )
      return reject(
        "stale-owner",
        "The edited child generation is unavailable.",
      );
    if (body.kind === "selectProfile" && !live(body.target))
      return reject(
        "stale-owner",
        "The selected child generation is unavailable.",
      );
    if (body.kind === "createAndSelect" && saved && !live(body.owner))
      return reject(
        "stale-owner",
        "The created child generation is unavailable.",
      );
    if (evidence) {
      if (
        canonical(evidence.command) !== canonical(command) ||
        evidence.receipt.payloadHash !== command.payloadHash
      )
        return reject(
          "command-identity",
          "This profile command identity has a different payload.",
        );
      return evidence.receipt;
    }
    return null;
  }
  async function administer({
    command,
    depart,
  }: {
    command: ProfileAdministrationCommand;
    depart(input: {
      selection: SelectedOwnerWitness;
      departure: DepartureWitness;
    }): Promise<CommandRejection | null>;
  }): Promise<ProfileAdministrationReceipt | CommandRejection> {
    const preparation = policy();
    const current = await read();
    const resolved = await resolveRetained({ command, directory: current });
    if (resolved) return resolved;
    if (command.version === 2)
      return removal.administer({ current, command, depart });
    const body = command.payload;
    const live = (owner: Owner) =>
      current.profiles.find(
        (profile) =>
          profile.edit.owner.profileId === owner.profileId &&
          profile.edit.owner.generation === owner.generation,
      );
    if (canonical(command.selection) !== canonical(current.selection))
      return reject("stale-selection", "The selected child lifetime changed.");
    if (command.scope.revision !== current.administration.revision)
      return reject(
        "stale-administration",
        "Profile settings changed before this command.",
      );
    if (
      body.kind !== "acknowledgePreparation" &&
      current.preparation.kind !== "acknowledged"
    )
      return reject(
        "preparation-required",
        "Reviewed parent preparation must be acknowledged before profile changes.",
      );
    if (
      body.kind !== "acknowledgePreparation" &&
      body.kind !== "finishInitialProfile" &&
      current.initialSetup.kind === "firstLaunch"
    )
      return reject(
        "initial-setup-required",
        "Confirm the initial child before changing profiles.",
      );
    let target: ProfileSummary | undefined;
    if (
      body.kind === "setAvatar" ||
      body.kind === "setDisplayName" ||
      body.kind === "finishInitialProfile"
    ) {
      target = live(body.target.owner);
      if (!target || target.edit.revision !== body.target.revision)
        return reject("stale-profile", "The edited child's settings changed.");
    }
    if (
      body.kind === "finishInitialProfile" &&
      (current.initialSetup.kind !== "firstLaunch" ||
        !target ||
        canonical(target.edit.owner) !== canonical(current.selection.owner))
    )
      return reject(
        "initial-profile-changed",
        "Initial setup must confirm the existing anonymous child.",
      );
    if (body.kind === "createAndSelect") {
      if (current.profiles.length >= 256)
        return reject(
          "profile-limit",
          "This installation has reached its child-profile limit.",
        );
      if (
        body.owner.generation !== "0" ||
        current.profiles.some(
          (profile) => profile.edit.owner.profileId === body.owner.profileId,
        )
      )
        return reject(
          "profile-identity",
          "A new child requires a fresh identity.",
        );
    }
    if (
      body.kind === "acknowledgePreparation" &&
      (preparation.kind !== "reviewed" || preparation.hash !== body.hash)
    )
      return reject(
        "preparation-unavailable",
        "This preparation identity is unavailable for acknowledgement.",
      );
    const result = receiptFor(command);
    if (body.kind === "selectProfile" || body.kind === "createAndSelect") {
      const rejection = await depart({
        selection: command.selection,
        departure: body.departure,
      });
      if (rejection) return rejection;
    }
    if (
      body.kind === "setAvatar" ||
      body.kind === "setDisplayName" ||
      body.kind === "finishInitialProfile"
    ) {
      if (!target) throw new Error("Validated profile target is unavailable");
      let preferences = target.preferences;
      if (body.kind === "setAvatar")
        preferences = parseLocalPreferences({
          ...preferences,
          avatarId: body.avatarId,
        });
      else if (body.kind === "setDisplayName") {
        const { displayName, ...withoutName } = preferences;
        preferences = parseLocalPreferences(
          body.displayName === null
            ? withoutName
            : { ...preferences, displayName: body.displayName },
        );
      } else
        preferences = parseLocalPreferences({
          ...preferences,
          ...body.preferences,
        });
      const revision = increment(target.edit.revision);
      const changed = await db
        .update(schema.profile)
        .set({ preferences: canonical(preferences), revision })
        .where(
          and(
            eq(schema.profile.id, target.edit.owner.profileId),
            eq(schema.profile.generation, target.edit.owner.generation),
            eq(schema.profile.revision, target.edit.revision),
          ),
        )
        .returning({ id: schema.profile.id })
        .all();
      if (changed.length !== 1)
        throw new Error("Profile revision changed during administration");
      if (body.kind === "finishInitialProfile")
        await db
          .update(schema.installationProfileState)
          .set({ setupMode: "complete" })
          .where(
            eq(
              schema.installationProfileState.installationId,
              current.administration.installationId,
            ),
          )
          .run();
    } else if (body.kind === "acknowledgePreparation") {
      await db
        .update(schema.installationProfileState)
        .set({ preparationHash: body.hash })
        .where(
          eq(
            schema.installationProfileState.installationId,
            current.administration.installationId,
          ),
        )
        .run();
    } else {
      const owner = body.kind === "createAndSelect" ? body.owner : body.target;
      if (body.kind === "createAndSelect")
        await db
          .insert(schema.profile)
          .values({
            id: owner.profileId,
            generation: owner.generation,
            revision: parseCounter("0"),
            undoRunId: null,
            preferencesVersion: 1,
            preferences: canonical(
              parseLocalPreferences({ version: 1, ...body.preferences }),
            ),
          })
          .run();
      const changed = await db
        .update(schema.installationProfileState)
        .set({
          profileId: owner.profileId,
          generation: owner.generation,
          selectionRevision: result.selection.revision,
          ...(body.kind === "createAndSelect" ? { setupMode: "complete" } : {}),
        })
        .where(
          and(
            eq(
              schema.installationProfileState.installationId,
              current.selection.installationId,
            ),
            eq(
              schema.installationProfileState.selectionRevision,
              current.selection.revision,
            ),
            eq(
              schema.installationProfileState.profileId,
              current.selection.owner.profileId,
            ),
            eq(
              schema.installationProfileState.generation,
              current.selection.owner.generation,
            ),
          ),
        )
        .returning({ id: schema.installationProfileState.installationId })
        .all();
      if (changed.length !== 1)
        throw new Error("Selected child changed during administration");
    }
    const revision = result.administration.revision;
    const changed = await db
      .update(schema.installation)
      .set({ revision })
      .where(
        and(
          eq(schema.installation.id, current.administration.installationId),
          eq(schema.installation.revision, current.administration.revision),
        ),
      )
      .returning({ id: schema.installation.id })
      .all();
    if (changed.length !== 1)
      throw new Error("Installation revision changed during administration");
    await db
      .insert(schema.profileAdministrationReceipt)
      .values({
        installationId: current.administration.installationId,
        commandId: command.commandId,
        commandVersion: 1,
        command: canonical(command),
        expectedRevision: command.scope.revision,
        resultingRevision: revision,
        payloadHash: command.payloadHash,
        resultVersion: 1,
        result: canonical(result),
      })
      .run();
    const retained = await db
      .select()
      .from(schema.profileAdministrationReceipt)
      .where(
        eq(
          schema.profileAdministrationReceipt.installationId,
          current.administration.installationId,
        ),
      )
      .orderBy(desc(schema.profileAdministrationReceipt.resultingRevision))
      .all();
    for (const expired of retained.slice(256))
      await db
        .delete(schema.profileAdministrationReceipt)
        .where(
          and(
            eq(
              schema.profileAdministrationReceipt.installationId,
              expired.installationId,
            ),
            eq(
              schema.profileAdministrationReceipt.commandId,
              expired.commandId,
            ),
          ),
        )
        .run();
    await read();
    return result;
  }
  return { read, bootstrap, migrate, selected, administer, resolveRetained };
}
