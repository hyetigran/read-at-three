import {
  administrationIdentity,
  removalReceipt,
  decodeAdministrationEvidence,
} from "./profile-receipt.ts";
import { and, eq } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  canonical,
  increment,
  parseCounter,
  parseLocalPreferences,
  profileAdministrationOwners,
} from "../../teaching/src/index.ts";
import type {
  CommandRejection,
  DepartureWitness,
  Owner,
  ProfileDirectory,
  ProfileRemovalCommand,
  ProfileRemovalReceipt,
  SelectedOwnerWitness,
} from "../../teaching/src/index.ts";
import type { SqlExecutor } from "./executor.ts";
import * as schema from "./schema.ts";

export function createProfileRemoval({
  db,
  executor,
}: {
  db: ReturnType<typeof drizzle>;
  executor: SqlExecutor;
}) {
  const reject = (code: string, message: string): CommandRejection => ({
    kind: "rejected",
    code,
    message,
  });
  async function retireEvidence(target: Owner, allGenerations: boolean) {
    const rows = await db
      .select()
      .from(schema.profileAdministrationReceipt)
      .all();
    for (const row of rows) {
      const evidence = decodeAdministrationEvidence(row);
      if (evidence.kind !== "full") continue;
      const { command, receipt } = evidence;
      const related = profileAdministrationOwners({ command, receipt }).some(
        (owner) =>
          owner.profileId === target.profileId &&
          (allGenerations || owner.generation === target.generation),
      );
      if (related)
        await db
          .update(schema.profileAdministrationReceipt)
          .set({
            evidenceKind: "retired",
            command: administrationIdentity(row),
            result: "{}",
          })
          .where(
            and(
              eq(
                schema.profileAdministrationReceipt.installationId,
                row.installationId,
              ),
              eq(schema.profileAdministrationReceipt.commandId, row.commandId),
            ),
          )
          .run();
    }
  }
  async function removeGraph(target: Owner, allGenerations: boolean) {
    const where = allGenerations
      ? "profile_id=?"
      : "profile_id=? AND generation=?";
    const parameters = allGenerations
      ? [target.profileId]
      : [target.profileId, BigInt(target.generation)];
    await executor.execute(
      `UPDATE profile SET undo_run_id=NULL WHERE profile_id=?`,
      [target.profileId],
    );
    await executor.execute(
      `UPDATE course_cursor SET resume_session_id=NULL WHERE ${where}`,
      parameters,
    );
    await executor.execute(
      `UPDATE session SET return_session_id=NULL WHERE ${where}`,
      parameters,
    );
    const documentIds = `SELECT document_id FROM ink_document WHERE ${where}`;
    await executor.execute(
      `DELETE FROM ink_operation WHERE document_id IN (${documentIds})`,
      parameters,
    );
    await executor.execute(
      `DELETE FROM ink_history WHERE document_id IN (${documentIds})`,
      parameters,
    );
    await executor.execute(
      `DELETE FROM ink_point_chunk WHERE stroke_id IN (SELECT stroke_id FROM ink_stroke WHERE document_id IN (${documentIds}))`,
      parameters,
    );
    await executor.execute(
      `DELETE FROM ink_stroke WHERE document_id IN (${documentIds})`,
      parameters,
    );
    await executor.execute(
      `DELETE FROM ink_document WHERE ${where}`,
      parameters,
    );
    for (const table of [
      "lesson_result",
      "lesson_credit_support",
      "lesson_credit",
      "task_result",
      "task_credit",
      "advance_withdrawal",
      "task_advance",
      "course_cursor",
      "task_run",
      "session",
    ])
      await executor.execute(`DELETE FROM ${table} WHERE ${where}`, parameters);
    await executor.execute(
      `DELETE FROM command_receipt WHERE ${allGenerations ? "owner_profile_id=?" : "owner_profile_id=? AND owner_generation=?"}`,
      parameters,
    );
  }
  async function administer(input: {
    current: ProfileDirectory;
    command: ProfileRemovalCommand;
    depart(input: {
      selection: SelectedOwnerWitness;
      departure: DepartureWitness;
    }): Promise<CommandRejection | null>;
  }): Promise<ProfileRemovalReceipt | CommandRejection> {
    const { current, command } = input,
      body = command.payload;
    if (canonical(command.selection) !== canonical(current.selection))
      return reject("stale-selection", "The selected child lifetime changed.");
    if (command.scope.revision !== current.administration.revision)
      return reject(
        "stale-administration",
        "Profile settings changed before this command.",
      );
    if (current.preparation.kind !== "acknowledged")
      return reject(
        "preparation-required",
        "Reviewed parent preparation must be acknowledged before profile changes.",
      );
    if (current.initialSetup.kind === "firstLaunch")
      return reject(
        "initial-setup-required",
        "Confirm the initial child before changing profiles.",
      );
    const target = current.profiles.find(
      (profile) =>
        canonical(profile.edit.owner) === canonical(body.target.owner),
    );
    if (
      !target ||
      canonical(body.target.owner) !== canonical(current.selection.owner)
    )
      return reject(
        "unselected-target",
        "Choose this child before removing their data.",
      );
    if (target.edit.revision !== body.target.revision)
      return reject("stale-profile", "The selected child's settings changed.");
    if (body.kind === "deleteProfile") {
      const successor = body.successor;
      if (successor.kind === "existing") {
        if (
          canonical(successor.owner) === canonical(body.target.owner) ||
          !current.profiles.some(
            (profile) =>
              canonical(profile.edit.owner) === canonical(successor.owner),
          )
        )
          return reject(
            "successor-unavailable",
            "Confirm another existing child to select.",
          );
      } else if (
        current.profiles.length !== 1 ||
        successor.owner.generation !== "0" ||
        current.profiles.some(
          (profile) =>
            profile.edit.owner.profileId === successor.owner.profileId,
        )
      )
        return reject(
          "replacement-identity",
          "Deleting the final child requires an explicitly confirmed fresh child.",
        );
    }
    const rejection = await input.depart({
      selection: command.selection,
      departure: body.departure,
    });
    if (rejection) return rejection;
    await retireEvidence(body.target.owner, body.kind === "deleteProfile");
    await removeGraph(body.target.owner, body.kind === "deleteProfile");
    const result = removalReceipt(command);
    let selected: Owner;
    if (body.kind === "resetProfile") {
      if (!("selection" in result) || result.effect.kind !== "reset")
        throw new Error("Reset result is unavailable");
      selected = result.selection.owner;
      await db
        .update(schema.profile)
        .set({
          generation: selected.generation,
          revision: result.effect.target.revision,
          undoRunId: null,
        })
        .where(eq(schema.profile.id, body.target.owner.profileId))
        .run();
      await db
        .insert(schema.commandReceipt)
        .values({
          scopeKind: "profile",
          scopeId: selected.profileId,
          scopeGeneration: selected.generation,
          commandId: command.commandId,
          ownerProfileId: selected.profileId,
          ownerGeneration: selected.generation,
          expectedRevision: body.target.revision,
          resultingRevision: result.effect.target.revision,
          payloadHash: command.payloadHash,
          resultVersion: 2,
          result: canonical(result),
        })
        .run();
    } else {
      selected = body.successor.owner;
      if (body.successor.kind === "replacement")
        await db
          .insert(schema.profile)
          .values({
            id: selected.profileId,
            generation: selected.generation,
            revision: parseCounter("0"),
            undoRunId: null,
            preferencesVersion: 1,
            preferences: canonical(
              parseLocalPreferences({
                version: 1,
                ...body.successor.preferences,
              }),
            ),
          })
          .run();
      await db
        .update(schema.installationProfileState)
        .set({ profileId: selected.profileId, generation: selected.generation })
        .where(
          eq(
            schema.installationProfileState.installationId,
            current.administration.installationId,
          ),
        )
        .run();
      await db
        .delete(schema.profile)
        .where(eq(schema.profile.id, body.target.owner.profileId))
        .run();
    }
    await db
      .update(schema.installationProfileState)
      .set({
        profileId: selected.profileId,
        generation: selected.generation,
        selectionRevision: increment(current.selection.revision),
        setupMode: "complete",
      })
      .where(
        eq(
          schema.installationProfileState.installationId,
          current.administration.installationId,
        ),
      )
      .run();
    await db
      .update(schema.installation)
      .set({ revision: result.administration.revision })
      .where(eq(schema.installation.id, current.administration.installationId))
      .run();
    const identity = {
      installationId: current.administration.installationId,
      commandId: command.commandId,
      commandVersion: command.version,
      expectedRevision: command.scope.revision,
      resultingRevision: result.administration.revision,
      payloadHash: command.payloadHash,
    };
    await db
      .insert(schema.profileAdministrationReceipt)
      .values({
        ...identity,
        command: administrationIdentity(identity),
        evidenceKind: body.kind === "deleteProfile" ? "deleted" : "retired",
        resultVersion: 2,
        result: body.kind === "deleteProfile" ? canonical(result) : "{}",
      })
      .run();
    await executor.execute(
      "DELETE FROM profile_administration_receipt WHERE installation_id=? AND command_id IN (SELECT command_id FROM profile_administration_receipt WHERE installation_id=? ORDER BY resulting_revision DESC LIMIT -1 OFFSET 256)",
      [
        current.administration.installationId,
        current.administration.installationId,
      ],
    );
    if ((await executor.execute("PRAGMA foreign_key_check", [])).rows.length)
      throw new Error("Profile removal violated the ownership graph");
    return result;
  }
  return { administer };
}
