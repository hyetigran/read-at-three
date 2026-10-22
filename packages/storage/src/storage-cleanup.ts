import { and, asc, eq, sql } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  canonical,
  parseCounter,
  storageCleanupReceipt,
  parseStorageCleanupView,
  parseStorageCleanupCommand,
  parseStorageCleanupReceipt,
  storageCleanupPreimage,
} from "../../teaching/src/index.ts";
import type {
  HashFunction,
  ProfileDirectory,
  StorageCleanupCommand,
  StorageCleanupReceipt,
  StorageCleanupView,
} from "../../teaching/src/index.ts";
import { inkDocumentToken } from "./ink.ts";
import type { SqlExecutor } from "./executor.ts";
import * as schema from "./schema.ts";

export function createStorageCleanup({
  db,
  executor,
  hash,
}: {
  db: ReturnType<typeof drizzle>;
  executor: SqlExecutor;
  hash: HashFunction;
}) {
  async function read(
    directory: ProfileDirectory,
  ): Promise<StorageCleanupView> {
    const selection = directory.selection;
    const profile = directory.profiles.find(
      (item) => canonical(item.edit.owner) === canonical(selection.owner),
    )?.edit;
    if (!profile) throw new Error("Cleanup child is unavailable");
    const state = (
      await db
        .select()
        .from(schema.storageCleanupState)
        .where(
          and(
            eq(schema.storageCleanupState.profileId, selection.owner.profileId),
            eq(
              schema.storageCleanupState.generation,
              selection.owner.generation,
            ),
          ),
        )
        .all()
    )[0];
    const scope = {
      owner: selection.owner,
      revision: state?.revision ?? parseCounter("0"),
    };
    const documents = await db
      .select({ document: schema.inkDocument })
      .from(schema.inkDocument)
      .innerJoin(
        schema.taskRunV6,
        eq(schema.taskRunV6.runId, schema.inkDocument.runId),
      )
      .innerJoin(
        schema.profile,
        eq(schema.profile.id, schema.inkDocument.profileId),
      )
      .where(
        and(
          eq(schema.inkDocument.profileId, selection.owner.profileId),
          eq(schema.inkDocument.generation, selection.owner.generation),
          sql`${schema.taskRunV6.status} IN ('completed','skipped','abandoned')`,
          sql`(${schema.profile.undoRunId} IS NULL OR ${schema.profile.undoRunId} <> ${schema.inkDocument.runId})`,
          sql`NOT EXISTS (SELECT 1 FROM removed_drawing r WHERE r.document_id=${schema.inkDocument.documentId})`,
          sql`EXISTS (SELECT 1 FROM ink_stroke s WHERE s.document_id=${schema.inkDocument.documentId})`,
          sql`NOT EXISTS (SELECT 1 FROM ink_stroke s WHERE s.document_id=${schema.inkDocument.documentId} AND s.status='capturing')`,
        ),
      )
      .orderBy(asc(schema.inkDocument.documentId))
      .limit(32)
      .all();
    const drawings = [];
    for (const { document } of documents) {
      const result = await executor.execute(
        "SELECT coalesce(sum(length(c.payload)),0) FROM ink_point_chunk c JOIN ink_stroke s ON s.stroke_id=c.stroke_id WHERE s.document_id=?",
        [document.documentId],
      );
      const pointBytes = Number(result.rows[0]?.[0]);
      if (!Number.isSafeInteger(pointBytes) || pointBytes < 0)
        throw new Error("Drawing size is unsupported");
      drawings.push({ token: inkDocumentToken(document), pointBytes });
    }
    return parseStorageCleanupView({ selection, scope, drawings });
  }
  async function execute(
    input: StorageCleanupCommand,
    directory: ProfileDirectory,
  ): Promise<StorageCleanupReceipt> {
    const command = parseStorageCleanupCommand(input);
    if (canonical(command.selection) !== canonical(directory.selection))
      throw new Error("Cleanup selection changed");
    if ((await hash(storageCleanupPreimage(command))) !== command.payloadHash)
      throw new Error("Cleanup command payload changed");
    const owner = command.expectedScope.owner;
    const where = and(
      eq(schema.storageCleanupReceipt.profileId, owner.profileId),
      eq(schema.storageCleanupReceipt.generation, owner.generation),
      eq(schema.storageCleanupReceipt.commandId, command.commandId),
    );
    const saved = (
      await db.select().from(schema.storageCleanupReceipt).where(where).all()
    )[0];
    const result = storageCleanupReceipt(command);
    if (saved) {
      const original = parseStorageCleanupCommand(JSON.parse(saved.command));
      const accepted = parseStorageCleanupReceipt(JSON.parse(saved.result));
      if (
        canonical(original) !== canonical(command) ||
        canonical(accepted) !== canonical(result) ||
        saved.resultingRevision !== accepted.scope.revision
      )
        throw new Error("Cleanup receipt identity changed");
      return accepted;
    }
    const view = await read(directory);
    if (canonical(view.scope) !== canonical(command.expectedScope))
      throw new Error("Cleanup profile revision changed");
    for (const token of command.drawings) {
      if (
        !view.drawings.some(
          (drawing) => canonical(drawing.token) === canonical(token),
        )
      )
        throw new Error("Selected drawing is no longer eligible for cleanup");
    }
    for (const token of result.drawings) {
      const parameters = [token.documentId];
      await executor.execute(
        "DELETE FROM ink_operation WHERE document_id=?",
        parameters,
      );
      await executor.execute(
        "UPDATE ink_history SET baseline='[]',base_seq=0,cursor_seq=0,tip_seq=0,next_op_seq=1 WHERE document_id=?",
        parameters,
      );
      await executor.execute(
        "DELETE FROM ink_point_chunk WHERE stroke_id IN (SELECT stroke_id FROM ink_stroke WHERE document_id=?)",
        parameters,
      );
      await executor.execute(
        "DELETE FROM ink_stroke WHERE document_id=?",
        parameters,
      );
      await db
        .update(schema.inkDocument)
        .set({ revision: token.revision, inputEpoch: token.inputEpoch })
        .where(eq(schema.inkDocument.documentId, token.documentId))
        .run();
      await db
        .insert(schema.removedDrawing)
        .values({ documentId: token.documentId })
        .run();
    }
    await db
      .insert(schema.storageCleanupState)
      .values({
        profileId: owner.profileId,
        generation: owner.generation,
        revision: result.scope.revision,
      })
      .onConflictDoUpdate({
        target: [
          schema.storageCleanupState.profileId,
          schema.storageCleanupState.generation,
        ],
        set: { revision: result.scope.revision },
      })
      .run();
    await db
      .insert(schema.storageCleanupReceipt)
      .values({
        profileId: owner.profileId,
        generation: owner.generation,
        commandId: command.commandId,
        resultingRevision: result.scope.revision,
        command: canonical(command),
        result: canonical(result),
      })
      .run();
    await executor.execute(
      "DELETE FROM storage_cleanup_receipt WHERE profile_id=? AND generation=? AND command_id NOT IN (SELECT command_id FROM storage_cleanup_receipt WHERE profile_id=? AND generation=? ORDER BY resulting_revision DESC,command_id LIMIT 256)",
      [
        owner.profileId,
        BigInt(owner.generation),
        owner.profileId,
        BigInt(owner.generation),
      ],
    );
    return result;
  }
  async function validate() {
    const invalid = await executor.execute(
      "SELECT r.document_id FROM removed_drawing r JOIN ink_document d ON d.document_id=r.document_id JOIN task_run t ON t.run_id=d.run_id JOIN profile p ON p.profile_id=d.profile_id WHERE t.status='inProgress' OR p.undo_run_id=d.run_id OR EXISTS (SELECT 1 FROM ink_stroke s WHERE s.document_id=d.document_id) OR EXISTS (SELECT 1 FROM ink_operation o WHERE o.document_id=d.document_id) OR EXISTS (SELECT 1 FROM ink_history h WHERE h.document_id=d.document_id AND (h.baseline<>'[]' OR h.base_seq<>0 OR h.cursor_seq<>0 OR h.tip_seq<>0 OR h.next_op_seq<>1)) LIMIT 1",
      [],
    );
    if (invalid.rows.length)
      throw new Error("Removed drawing contains protected work");
    const receipts = await db.select().from(schema.storageCleanupReceipt).all();
    const states = await db.select().from(schema.storageCleanupState).all();
    for (const saved of receipts) {
      const command = parseStorageCleanupCommand(JSON.parse(saved.command));
      const result = parseStorageCleanupReceipt(JSON.parse(saved.result));
      const state = states.find(
        (item) =>
          item.profileId === saved.profileId &&
          item.generation === saved.generation,
      );
      if (
        !state ||
        saved.profileId !== command.expectedScope.owner.profileId ||
        saved.generation !== command.expectedScope.owner.generation ||
        saved.commandId !== command.commandId ||
        saved.resultingRevision !== result.scope.revision ||
        BigInt(state.revision) < BigInt(saved.resultingRevision) ||
        (await hash(storageCleanupPreimage(command))) !== command.payloadHash ||
        canonical(result) !== canonical(storageCleanupReceipt(command))
      )
        throw new Error("Cleanup evidence is inconsistent");
    }
  }
  return { read, execute, validate };
}
