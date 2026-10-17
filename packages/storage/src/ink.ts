import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  canonical,
  decodeInkPoints,
  increment,
  INK_LIMITS,
  layerForPhase,
  parseCounter,
  parseId,
  parseInkBrush,
  parseInkCommand,
  parseInkSnapshot,
  parseInkOperation,
  parseInkReceipt,
  parseInkStrokeIds,
  validateInkChunks,
  validateInkDocumentUsage,
  visibleInkStrokes,
  writingPermission,
  writingTask,
} from "../../teaching/src/index.ts";
import type {
  DevelopmentPackage,
  DocumentToken,
  HashFunction,
  IdFactory,
  InkCommand,
  InkHistory,
  InkLayer,
  InkReceipt,
  InkResult,
  InkSnapshot,
  InkStroke,
  StoredSession,
  StrokeId,
  WritingBarrier,
  Owner,
} from "../../teaching/src/index.ts";
import type { SqlExecutor } from "./executor.ts";
import { sqlValues } from "./executor.ts";
import * as schema from "./schema.ts";
import { utf8 } from "./utf8.ts";

const layers: readonly InkLayer[] = ["model", "tracing", "independent"];
export type InkRunContext = Omit<StoredSession, "runStatus"> & {
  runStatus: StoredSession["runStatus"] | "abandoned";
};
export function createInkRepository({
  executor,
  ids,
  hash,
  resolve,
}: {
  executor: SqlExecutor;
  ids: IdFactory;
  hash: HashFunction;
  resolve: (input: {
    token: DocumentToken;
  }) => Promise<{ session: InkRunContext; content: DevelopmentPackage } | null>;
}) {
  const db = drizzle(async (sql, parameters, method) => {
    if (method === "get") throw new Error("Array reads required");
    return executor.execute(sql, sqlValues(parameters));
  });
  type DocumentRow = typeof schema.inkDocument.$inferSelect;
  function token(row: DocumentRow): DocumentToken {
    return {
      documentId: row.documentId,
      runId: row.runId,
      profileId: row.profileId,
      generation: row.generation,
      courseId: row.courseId,
      packageHash: row.packageHash,
      lessonId: row.lessonId,
      taskId: row.taskId,
      targetId: row.targetId,
      revision: row.revision,
      phase: row.phase,
      inputEpoch: row.inputEpoch,
    };
  }
  async function document(id: DocumentToken["documentId"]) {
    const row = (
      await db
        .select()
        .from(schema.inkDocument)
        .where(eq(schema.inkDocument.documentId, id))
        .all()
    )[0];
    if (!row) throw new Error("Ink document missing");
    return row;
  }
  function owned({
    row,
    expected,
    revision = true,
  }: {
    row: DocumentRow;
    expected: DocumentToken;
    revision?: boolean;
  }) {
    const current = token(row);
    if (revision) return canonical(current) === canonical(expected);
    const {
      revision: currentRevision,
      phase: currentPhase,
      inputEpoch: currentEpoch,
      ...currentIdentity
    } = current;
    const {
      revision: expectedRevision,
      phase: expectedPhase,
      inputEpoch: expectedEpoch,
      ...expectedIdentity
    } = expected;
    return canonical(currentIdentity) === canonical(expectedIdentity);
  }
  async function tokens({
    session,
  }: {
    session: StoredSession;
  }): Promise<readonly DocumentToken[]> {
    return (
      await db
        .select()
        .from(schema.inkDocument)
        .where(eq(schema.inkDocument.runId, session.runId))
        .orderBy(asc(schema.inkDocument.documentId))
        .all()
    ).map(token);
  }
  async function create({
    session,
    content,
    owner,
  }: {
    session: StoredSession;
    content: DevelopmentPackage;
    owner: Owner;
  }) {
    const task = writingTask({ content, taskId: session.taskId });
    if (!task) return;
    for (const target of task.targets) {
      const documentId = parseId({ kind: "document", value: ids() });
      await db
        .insert(schema.inkDocument)
        .values({
          documentId,
          runId: session.runId,
          profileId: owner.profileId,
          generation: owner.generation,
          courseId: content.body.courseId,
          packageHash: content.packageHash,
          lessonId: content.body.lessonId,
          taskId: session.taskId,
          targetId: target.id,
          sourceRefs: canonical(target.sourceRefs),
          phase: writingPermission({
            content,
            state: session.state,
            targetId: target.id,
          }).phase,
          logicalWidth: target.logicalWidth,
          logicalHeight: target.logicalHeight,
          codecVersion: 1,
          revision: parseCounter("0"),
          inputEpoch: parseCounter("0"),
          nextStrokeOrder: parseCounter("0"),
        })
        .run();
      for (const layer of layers)
        await db
          .insert(schema.inkHistory)
          .values({
            documentId,
            layer,
            baselineVersion: 1,
            baseline: "[]",
            baseSeq: parseCounter("0"),
            cursorSeq: parseCounter("0"),
            tipSeq: parseCounter("0"),
            nextOpSeq: parseCounter("1"),
          })
          .run();
    }
  }
  async function snapshot({
    token: expected,
  }: {
    token: DocumentToken;
  }): Promise<InkSnapshot> {
    const row = await document(expected.documentId);
    if (!owned({ row, expected })) throw new Error("Stale ink snapshot token");
    const binding = await resolve({ token: expected });
    if (!binding) throw new Error("Ink run ownership invalid");
    const task = writingTask({ content: binding.content, taskId: row.taskId }),
      target = task?.targets.find((t) => t.id === row.targetId);
    if (
      !target ||
      Number(row.codecVersion) !== 1 ||
      row.logicalWidth !== target.logicalWidth ||
      row.logicalHeight !== target.logicalHeight ||
      row.sourceRefs !== canonical(target.sourceRefs) ||
      writingPermission({
        content: binding.content,
        state: binding.session.state,
        targetId: row.targetId,
      }).phase !== row.phase
    )
      throw new Error("Ink source binding invalid");
    const bounds = { width: row.logicalWidth, height: row.logicalHeight };
    const strokeRows = await db
      .select()
      .from(schema.inkStroke)
      .where(eq(schema.inkStroke.documentId, row.documentId))
      .orderBy(asc(schema.inkStroke.strokeOrder))
      .all();
    const strokes: InkStroke[] = [];
    for (const stroke of strokeRows) {
      const chunks = (
        await db
          .select()
          .from(schema.inkPointChunk)
          .where(eq(schema.inkPointChunk.strokeId, stroke.strokeId))
          .orderBy(asc(schema.inkPointChunk.chunkIndex))
          .all()
      ).map((c) => {
        if (Number(c.codecVersion) !== 1)
          throw new Error("Unsupported chunk codec");
        return {
          chunkIndex: Number(c.chunkIndex),
          firstPointIndex: Number(c.firstPointIndex),
          pointCount: Number(c.pointCount),
          codecVersion: 1,
          payload: [...c.payload],
        } satisfies import("../../teaching/src/index.ts").InkChunk;
      });
      const valid = validateInkChunks({ chunks, bounds });
      if (
        valid.pointCount !== Number(stroke.pointCount) ||
        Number(stroke.codecVersion) !== 1 ||
        Number(stroke.brushVersion) !== 1 ||
        (stroke.status !== "capturing" && Number(stroke.pointCount) === 0) ||
        BigInt(stroke.strokeOrder) >= BigInt(row.nextStrokeOrder)
      )
        throw new Error("Invalid committed stroke");
      strokes.push({
        strokeId: stroke.strokeId,
        layer: stroke.layer,
        strokeOrder: stroke.strokeOrder,
        status: stroke.status,
        brush: parseInkBrush(JSON.parse(stroke.brush)),
        pointCount: Number(stroke.pointCount),
        chunks,
      });
    }
    if (strokes.filter((s) => s.status === "capturing").length > 1)
      throw new Error("Multiple capturing strokes");
    const historyRows = await db
      .select()
      .from(schema.inkHistory)
      .where(eq(schema.inkHistory.documentId, row.documentId))
      .all();
    const histories: InkHistory[] = [];
    for (const history of historyRows) {
      const operations = (
        await db
          .select()
          .from(schema.inkOperation)
          .where(
            and(
              eq(schema.inkOperation.documentId, row.documentId),
              eq(schema.inkOperation.layer, history.layer),
            ),
          )
          .orderBy(asc(schema.inkOperation.seq))
          .all()
      ).map((op) => {
        const value = parseInkOperation(JSON.parse(op.payload));
        if (
          op.kind !== "AddStroke" ||
          Number(op.payloadVersion) !== 1 ||
          value.seq !== op.seq ||
          value.strokeId !== op.originStrokeId
        )
          throw new Error("Invalid committed operation");
        return value;
      });
      if (Number(history.baselineVersion) !== 1)
        throw new Error("Unsupported history baseline");
      const value = {
        layer: history.layer,
        baseline: parseInkStrokeIds(JSON.parse(history.baseline)),
        baseSeq: history.baseSeq,
        cursorSeq: history.cursorSeq,
        tipSeq: history.tipSeq,
        nextOpSeq: history.nextOpSeq,
        operations,
      };
      visibleInkStrokes({ history: value, strokes });
      histories.push(value);
    }
    if (
      histories.length !== 3 ||
      layers.some((layer) => !histories.some((h) => h.layer === layer)) ||
      strokes.some(
        (s) =>
          s.status !== "capturing" &&
          !histories.some(
            (h) =>
              h.layer === s.layer &&
              visibleInkStrokes({ history: h, strokes }).includes(s.strokeId),
          ),
      )
    )
      throw new Error("Incomplete canonical ink history");
    const value = {
      token: token(row),
      sourceRefs: target.sourceRefs,
      bounds,
      guides: target.guides,
      boardY: target.boardY,
      writable:
        binding.session.status === "active" &&
        binding.session.runStatus === "inProgress" &&
        writingPermission({
          content: binding.content,
          state: binding.session.state,
          targetId: row.targetId,
        }).writable,
      nextStrokeOrder: row.nextStrokeOrder,
      strokes,
      histories,
    };
    checkBounds(value);
    return parseInkSnapshot(value);
  }
  function checkBounds(value: InkSnapshot) {
    const points = value.strokes.reduce((n, s) => n + s.pointCount, 0);
    const payloadBytes = value.strokes.reduce(
      (n, s) => n + s.chunks.reduce((sum, c) => sum + c.payload.length, 0),
      0,
    );
    const metadata = {
      ...value,
      strokes: value.strokes.map((s) => ({
        ...s,
        chunks: s.chunks.map(({ payload, ...chunk }) => chunk),
      })),
    };
    validateInkDocumentUsage({
      pointCount: points,
      canonicalByteLength: payloadBytes + utf8(canonical(metadata)).length,
    });
  }
  async function addOrigin({
    documentId,
    layer,
    strokeId,
  }: {
    documentId: DocumentToken["documentId"];
    layer: InkLayer;
    strokeId: StrokeId;
  }) {
    const row = (
      await db
        .select()
        .from(schema.inkHistory)
        .where(
          and(
            eq(schema.inkHistory.documentId, documentId),
            eq(schema.inkHistory.layer, layer),
          ),
        )
        .all()
    )[0];
    if (!row) throw new Error("History missing");
    if (row.cursorSeq !== row.tipSeq)
      throw new Error("History branching unsupported");
    const operations = await db
      .select()
      .from(schema.inkOperation)
      .where(
        and(
          eq(schema.inkOperation.documentId, documentId),
          eq(schema.inkOperation.layer, layer),
        ),
      )
      .orderBy(asc(schema.inkOperation.seq))
      .all();
    let baseline = parseInkStrokeIds(JSON.parse(row.baseline)),
      baseSeq = row.baseSeq;
    if (operations.length >= INK_LIMITS.retainedOperations) {
      const oldest = operations[0];
      if (!oldest || BigInt(oldest.seq) > BigInt(row.cursorSeq))
        throw new Error("Applied prefix unavailable");
      const operation = parseInkOperation(JSON.parse(oldest.payload));
      baseline = [...baseline, operation.strokeId];
      baseSeq = oldest.seq;
      await db
        .delete(schema.inkOperation)
        .where(
          and(
            eq(schema.inkOperation.documentId, documentId),
            eq(schema.inkOperation.layer, layer),
            eq(schema.inkOperation.seq, oldest.seq),
          ),
        )
        .run();
    }
    const operation = {
      seq: row.nextOpSeq,
      kind: "AddStroke",
      strokeId,
    } satisfies import("../../teaching/src/index.ts").InkOperation;
    await db
      .insert(schema.inkOperation)
      .values({
        documentId,
        layer,
        seq: row.nextOpSeq,
        kind: "AddStroke",
        payloadVersion: 1,
        payload: canonical(operation),
        originStrokeId: strokeId,
      })
      .run();
    await db
      .update(schema.inkHistory)
      .set({
        baseline: canonical(baseline),
        baseSeq,
        cursorSeq: row.nextOpSeq,
        tipSeq: row.nextOpSeq,
        nextOpSeq: increment(row.nextOpSeq),
      })
      .where(
        and(
          eq(schema.inkHistory.documentId, documentId),
          eq(schema.inkHistory.layer, layer),
        ),
      )
      .run();
  }
  const reject = (code: string, message: string): InkResult => ({
    kind: "rejected",
    code,
    message,
  });
  async function dispatch(input: InkCommand): Promise<InkResult> {
    const command = parseInkCommand(input),
      expected = command.token;
    if (
      (await hash(
        canonical({
          kind: command.kind,
          token: command.token,
          edit: command.edit,
        }),
      )) !== command.payloadHash
    )
      return reject("payload-hash", "Ink payload hash does not match.");
    const row = (
      await db
        .select()
        .from(schema.inkDocument)
        .where(eq(schema.inkDocument.documentId, expected.documentId))
        .all()
    )[0];
    if (!row) return reject("wrong-document", "Ink document is unavailable.");
    if (!owned({ row, expected, revision: false }))
      return reject("wrong-document", "Ink document binding or epoch changed.");
    const binding = await resolve({ token: expected });
    if (!binding) return reject("stale-owner", "Ink owner/run is unavailable.");
    const receipt = (
      await db
        .select()
        .from(schema.commandReceipt)
        .where(
          and(
            eq(schema.commandReceipt.scopeKind, "document"),
            eq(schema.commandReceipt.scopeId, expected.documentId),
            eq(schema.commandReceipt.scopeGeneration, expected.generation),
            eq(schema.commandReceipt.commandId, command.commandId),
          ),
        )
        .all()
    )[0];
    if (receipt) {
      if (
        receipt.ownerProfileId !== expected.profileId ||
        receipt.ownerGeneration !== expected.generation
      )
        throw new Error("Ink receipt owner invalid");
      if (receipt.payloadHash !== command.payloadHash)
        return reject("command-identity", "Ink command identity changed.");
      const result = parseInkReceipt(JSON.parse(receipt.result));
      if (
        result.commandId !== command.commandId ||
        result.token.documentId !== expected.documentId ||
        result.token.revision !== receipt.resultingRevision
      )
        throw new Error("Ink receipt identity invalid");
      return result;
    }
    if (row.phase !== expected.phase || row.inputEpoch !== expected.inputEpoch)
      return reject("input-fenced", "Ink phase or input epoch changed.");
    if (row.revision !== expected.revision)
      return reject(
        "stale-revision",
        "Ink document changed before this command.",
      );
    const permission = writingPermission({
      content: binding.content,
      state: binding.session.state,
      targetId: expected.targetId,
    });
    if (
      binding.session.status !== "active" ||
      binding.session.runStatus !== "inProgress" ||
      !permission.writable ||
      permission.phase !== row.phase ||
      command.edit.layer !== layerForPhase(row.phase)
    )
      return reject("input-fenced", "Writing input is closed for this turn.");
    const before = await snapshot({ token: expected }),
      edit = command.edit;
    let stroke = before.strokes.find((s) => s.strokeId === edit.strokeId);
    if (edit.kind === "begin") {
      if (stroke || before.strokes.some((s) => s.status === "capturing"))
        return reject("capture-conflict", "A capture already exists.");
      if (edit.brush.colorRole !== (edit.layer === "model" ? "model" : "child"))
        return reject("wrong-brush", "Brush does not match layer.");
      stroke = {
        strokeId: edit.strokeId,
        layer: edit.layer,
        strokeOrder: row.nextStrokeOrder,
        status: "capturing",
        brush: edit.brush,
        pointCount: 0,
        chunks: [],
      };
    } else if (
      !stroke ||
      stroke.status !== "capturing" ||
      stroke.layer !== edit.layer
    )
      return reject(
        "capture-closed",
        "Capture is absent, finalized, or in another layer.",
      );
    const existing = validateInkChunks({
      chunks: stroke.chunks,
      bounds: before.bounds,
    });
    let appended;
    try {
      appended = validateInkChunks({
        chunks: edit.chunks,
        bounds: before.bounds,
        firstPointIndex: existing.pointCount,
        chunkIndex: stroke.chunks.length,
        previousElapsedMs: existing.elapsedMs,
      });
      const proposed = {
        ...stroke,
        pointCount: appended.pointCount,
        chunks: [...stroke.chunks, ...edit.chunks],
      };
      checkBounds({
        ...before,
        strokes: [
          ...before.strokes.filter((s) => s.strokeId !== stroke.strokeId),
          proposed,
        ],
      });
    } catch (error) {
      return reject(
        error instanceof Error && /bound/.test(error.message)
          ? "ink-bound"
          : "invalid-ink",
        "Confirmed ink remains fenced for recovery.",
      );
    }
    if (edit.kind === "begin")
      await db
        .insert(schema.inkStroke)
        .values({
          strokeId: edit.strokeId,
          documentId: row.documentId,
          layer: edit.layer,
          strokeOrder: row.nextStrokeOrder,
          status: "capturing",
          codecVersion: 1,
          brushVersion: 1,
          brush: canonical(edit.brush),
          pointCount: 0,
        })
        .run();
    for (const chunk of edit.chunks)
      await db
        .insert(schema.inkPointChunk)
        .values({
          ...chunk,
          strokeId: edit.strokeId,
          payload: Uint8Array.from(chunk.payload),
        })
        .run();
    if (edit.kind === "finalize" && appended.pointCount === 0) {
      await db
        .delete(schema.inkStroke)
        .where(eq(schema.inkStroke.strokeId, edit.strokeId))
        .run();
    } else {
      await db
        .update(schema.inkStroke)
        .set({
          pointCount: appended.pointCount,
          status: edit.kind === "finalize" ? edit.status : "capturing",
        })
        .where(eq(schema.inkStroke.strokeId, edit.strokeId))
        .run();
      if (edit.kind === "finalize")
        await addOrigin({
          documentId: row.documentId,
          layer: edit.layer,
          strokeId: edit.strokeId,
        });
    }
    const next = { ...expected, revision: increment(row.revision) };
    await db
      .update(schema.inkDocument)
      .set({
        revision: next.revision,
        nextStrokeOrder:
          edit.kind === "begin"
            ? increment(row.nextStrokeOrder)
            : row.nextStrokeOrder,
      })
      .where(eq(schema.inkDocument.documentId, row.documentId))
      .run();
    const result = {
      kind: "inkCommitted",
      commandId: command.commandId,
      token: next,
    } satisfies InkReceipt;
    await db
      .insert(schema.commandReceipt)
      .values({
        scopeKind: "document",
        scopeId: row.documentId,
        scopeGeneration: row.generation,
        commandId: command.commandId,
        ownerProfileId: row.profileId,
        ownerGeneration: row.generation,
        expectedRevision: row.revision,
        resultingRevision: next.revision,
        payloadHash: command.payloadHash,
        resultVersion: 1,
        result: canonical(result),
      })
      .run();
    await executor.execute(
      "DELETE FROM command_receipt WHERE scope_kind='document' AND scope_id=? AND scope_generation=? AND command_id IN (SELECT command_id FROM command_receipt WHERE scope_kind='document' AND scope_id=? AND scope_generation=? ORDER BY resulting_revision DESC LIMIT -1 OFFSET 256)",
      [
        row.documentId,
        BigInt(row.generation),
        row.documentId,
        BigInt(row.generation),
      ],
    );
    await snapshot({ token: next });
    return result;
  }
  async function barrier({
    session,
    barrier,
  }: {
    session: StoredSession;
    barrier: WritingBarrier;
  }): Promise<boolean> {
    const current = await tokens({ session });
    if (
      current.length !== 2 ||
      barrier.documents.length !== 2 ||
      canonical(
        [...current].sort((a, b) => a.documentId.localeCompare(b.documentId)),
      ) !==
        canonical(
          [...barrier.documents].sort((a, b) =>
            a.documentId.localeCompare(b.documentId),
          ),
        )
    )
      return false;
    for (const expected of current) {
      const value = await snapshot({ token: expected });
      if (value.strokes.some((s) => s.status === "capturing")) return false;
    }
    return true;
  }
  async function fence({
    session,
    content,
  }: {
    session: StoredSession;
    content: DevelopmentPackage;
  }) {
    for (const expected of await tokens({ session })) {
      await db
        .update(schema.inkDocument)
        .set({
          phase: writingPermission({
            content,
            state: session.state,
            targetId: expected.targetId,
          }).phase,
          revision: increment(expected.revision),
          inputEpoch: increment(expected.inputEpoch),
        })
        .where(eq(schema.inkDocument.documentId, expected.documentId))
        .run();
    }
  }
  async function inventory() {
    const rows = await db.select().from(schema.inkDocument).all();
    const captures = [];
    for (const row of rows) {
      const value = await snapshot({ token: token(row) });
      for (const stroke of value.strokes)
        if (stroke.status === "capturing")
          captures.push({
            token: value.token,
            strokeId: stroke.strokeId,
            layer: stroke.layer,
            pointCount: stroke.pointCount,
            nextChunkIndex: stroke.chunks.length,
          });
    }
    if (captures.length > 64)
      throw new Error("Recovery capture inventory bound reached");
    return captures;
  }
  async function recoverOrphans() {
    const rows = await db.select().from(schema.inkDocument).all();
    for (const row of rows) {
      const value = await snapshot({ token: token(row) });
      let changed = false;
      for (const stroke of value.strokes) {
        if (stroke.status !== "capturing") continue;
        changed = true;
        if (Number(stroke.pointCount) === 0)
          await db
            .delete(schema.inkStroke)
            .where(eq(schema.inkStroke.strokeId, stroke.strokeId))
            .run();
        else {
          await db
            .update(schema.inkStroke)
            .set({ status: "interrupted" })
            .where(eq(schema.inkStroke.strokeId, stroke.strokeId))
            .run();
          await addOrigin({
            documentId: row.documentId,
            layer: stroke.layer,
            strokeId: stroke.strokeId,
          });
        }
      }
      if (changed)
        await db
          .update(schema.inkDocument)
          .set({
            revision: increment(row.revision),
            inputEpoch: increment(row.inputEpoch),
          })
          .where(eq(schema.inkDocument.documentId, row.documentId))
          .run();
    }
  }
  async function fenceAll() {
    for (const row of await db.select().from(schema.inkDocument).all())
      await db
        .update(schema.inkDocument)
        .set({
          revision: increment(row.revision),
          inputEpoch: increment(row.inputEpoch),
        })
        .where(eq(schema.inkDocument.documentId, row.documentId))
        .run();
  }
  return {
    tokens,
    create,
    snapshot,
    dispatch,
    barrier,
    fence,
    inventory,
    recoverOrphans,
    fenceAll,
  };
}
