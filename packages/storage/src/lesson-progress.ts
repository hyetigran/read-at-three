import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import {
  canonical,
  parseHash,
  parseId,
  resolvedLessons,
  authoredTaskIdentity,
} from "../../teaching/src/index.ts";
import type {
  CreditId,
  HashFunction,
  IdFactory,
  LessonId,
  Owner,
  PackageHash,
  InstalledTeaching,
} from "../../teaching/src/index.ts";
import { sqlValues } from "./executor.ts";
import type { SqlExecutor } from "./executor.ts";
import * as schema from "./schema.ts";

type TaskCredit = typeof schema.taskCredit.$inferSelect;
export function effectiveTaskCredit<
  Credit extends Pick<TaskCredit, "creditId" | "status" | "outcome">,
>({
  credits,
  selected,
}: {
  credits: readonly Credit[];
  selected: CreditId | null;
}): Credit | null {
  const valid = credits.filter((credit) => credit.status === "valid");
  const outcome = valid.some((credit) => credit.outcome === "completed")
    ? "completed"
    : "skipped";
  const eligible = valid
    .filter((credit) => credit.outcome === outcome)
    .sort((a, b) =>
      a.creditId < b.creditId ? -1 : a.creditId > b.creditId ? 1 : 0,
    );
  return (
    eligible.find((credit) => credit.creditId === selected) ??
    eligible[0] ??
    null
  );
}
export function dependentLessonWithdrawal({
  taskCreditId,
  supports,
}: {
  taskCreditId: CreditId;
  supports: readonly Pick<
    typeof schema.lessonCreditSupport.$inferSelect,
    "taskCreditId" | "lessonCreditId"
  >[];
}): readonly CreditId[] {
  return [
    ...new Set(
      supports
        .filter((support) => support.taskCreditId === taskCreditId)
        .map((support) => support.lessonCreditId),
    ),
  ].sort();
}
export function createLessonProgress({
  executor,
  hash,
  ids,
  pinned,
}: {
  executor: SqlExecutor;
  hash: HashFunction;
  ids: IdFactory;
  pinned: (packageHash: PackageHash) => InstalledTeaching;
}) {
  const db = drizzle((sql, parameters) =>
    executor.execute(sql, sqlValues(parameters)),
  );
  const owned = (
    owner: Owner,
    courseId: InstalledTeaching["body"]["courseId"],
  ) =>
    and(
      eq(schema.lessonCredit.profileId, owner.profileId),
      eq(schema.lessonCredit.generation, owner.generation),
      eq(schema.lessonCredit.courseId, courseId),
    );
  async function taskReceiptHash(credit: TaskCredit) {
    if (canonical(JSON.parse(credit.receipt)) !== credit.receipt)
      throw new Error("Task receipt bytes are not canonical");
    return parseHash({ kind: "payload", value: await hash(credit.receipt) });
  }
  async function definitionHash(
    content: InstalledTeaching,
    taskId: TaskCredit["taskId"],
  ) {
    const identity = authoredTaskIdentity({
      content: content.document,
      taskId,
    });
    if (identity === null) return null;
    return parseHash({ kind: "payload", value: await hash(identity) });
  }
  async function receiptFor({
    content,
    lessonId,
    credits,
  }: {
    content: InstalledTeaching;
    lessonId: LessonId;
    credits: readonly TaskCredit[];
  }) {
    const lesson = resolvedLessons(content.document).find(
      (lesson) => lesson.lessonId === lessonId,
    );
    if (
      !lesson?.completeDefinition ||
      !lesson.lessonTasks.length ||
      lesson.tasks.length !== lesson.lessonTasks.length
    )
      throw new Error("Complete lesson definition is unavailable");
    const tasks = [];
    for (const [ordinal, task] of lesson.lessonTasks.entries()) {
      const credit = credits[ordinal];
      const instructionalHash = await definitionHash(content, task.id);
      if (
        !credit ||
        !instructionalHash ||
        credit.taskId !== task.id ||
        credit.lessonId !== lessonId ||
        credit.courseId !== content.body.courseId ||
        (credit.outcome === "skipped" && !task.optional) ||
        instructionalHash !==
          (await definitionHash(pinned(credit.packageHash), task.id))
      )
        throw new Error("Lesson task support is incompatible");
      tasks.push({
        taskId: task.id,
        optional: task.optional,
        instructionalHash,
        outcome: credit.outcome,
        taskCreditId: credit.creditId,
        taskReceiptHash: await taskReceiptHash(credit),
      });
    }
    if (credits.length !== tasks.length)
      throw new Error("Lesson support cardinality changed");
    return {
      version: 1,
      courseId: content.body.courseId,
      lessonId,
      packageHash: content.key,
      tasks,
    };
  }
  async function supportHash(receipt: Awaited<ReturnType<typeof receiptFor>>) {
    const { packageHash, ...identity } = receipt;
    return parseHash({
      kind: "payload",
      value: await hash(canonical(identity)),
    });
  }
  async function validate({
    owner,
    courseId,
  }: {
    owner: Owner;
    courseId: InstalledTeaching["body"]["courseId"];
  }) {
    const lessons = await db
      .select()
      .from(schema.lessonCredit)
      .where(owned(owner, courseId))
      .all();
    const supports = await db
      .select()
      .from(schema.lessonCreditSupport)
      .where(
        and(
          eq(schema.lessonCreditSupport.profileId, owner.profileId),
          eq(schema.lessonCreditSupport.generation, owner.generation),
          eq(schema.lessonCreditSupport.courseId, courseId),
        ),
      )
      .orderBy(asc(schema.lessonCreditSupport.ordinal))
      .all();
    const taskCredits = await db
      .select()
      .from(schema.taskCredit)
      .where(
        and(
          eq(schema.taskCredit.profileId, owner.profileId),
          eq(schema.taskCredit.generation, owner.generation),
          eq(schema.taskCredit.courseId, courseId),
        ),
      )
      .all();
    for (const lesson of lessons) {
      const edges = supports.filter(
        (edge) => edge.lessonCreditId === lesson.lessonCreditId,
      );
      const credits: TaskCredit[] = [];
      for (const [ordinal, edge] of edges.entries()) {
        const credit = taskCredits.find(
          (credit) => credit.creditId === edge.taskCreditId,
        );
        if (
          !credit ||
          Number(edge.ordinal) !== ordinal ||
          edge.lessonId !== lesson.lessonId ||
          edge.taskId !== credit.taskId ||
          edge.outcome !== credit.outcome ||
          credit.lessonId !== lesson.lessonId ||
          (lesson.status === "valid" && credit.status !== "valid")
        )
          throw new Error("Lesson support ownership or status is invalid");
        credits.push(credit);
      }
      const expected = await receiptFor({
        content: pinned(lesson.packageHash),
        lessonId: lesson.lessonId,
        credits,
      });
      if (
        Number(lesson.receiptVersion) !== 1 ||
        lesson.receipt !== canonical(expected) ||
        lesson.supportHash !== (await supportHash(expected))
      )
        throw new Error("Durable lesson receipt is invalid");
    }
    if (
      supports.some(
        (edge) =>
          !lessons.some(
            (lesson) => lesson.lessonCreditId === edge.lessonCreditId,
          ),
      )
    )
      throw new Error("Orphaned lesson support");
    const results = await db
      .select()
      .from(schema.lessonResult)
      .where(
        and(
          eq(schema.lessonResult.profileId, owner.profileId),
          eq(schema.lessonResult.generation, owner.generation),
          eq(schema.lessonResult.courseId, courseId),
        ),
      )
      .all();
    for (const result of results)
      if (
        !lessons.some(
          (lesson) =>
            lesson.lessonCreditId === result.acceptedLessonCreditId &&
            lesson.lessonId === result.lessonId &&
            lesson.status === "valid",
        )
      )
        throw new Error("Lesson result has invalid support");
    for (const lesson of lessons)
      if (
        lesson.status === "valid" &&
        !results.some((result) => result.lessonId === lesson.lessonId)
      )
        throw new Error("Valid lesson credit has no result");
    return results.map((result) => ({
      lessonId: result.lessonId,
      acceptedLessonCreditId: result.acceptedLessonCreditId,
    }));
  }
  async function recomputeResults({
    owner,
    courseId,
  }: {
    owner: Owner;
    courseId: InstalledTeaching["body"]["courseId"];
  }) {
    const credits = await db
      .select()
      .from(schema.lessonCredit)
      .where(owned(owner, courseId))
      .all();
    const results = await db
      .select()
      .from(schema.lessonResult)
      .where(
        and(
          eq(schema.lessonResult.profileId, owner.profileId),
          eq(schema.lessonResult.generation, owner.generation),
          eq(schema.lessonResult.courseId, courseId),
        ),
      )
      .all();
    for (const lessonId of new Set([
      ...credits.map((credit) => credit.lessonId),
      ...results.map((result) => result.lessonId),
    ])) {
      const existing = results.find((result) => result.lessonId === lessonId);
      const eligible = credits
        .filter(
          (credit) => credit.lessonId === lessonId && credit.status === "valid",
        )
        .sort((a, b) =>
          a.lessonCreditId < b.lessonCreditId
            ? -1
            : a.lessonCreditId > b.lessonCreditId
              ? 1
              : 0,
        );
      const selected =
        eligible.find(
          (credit) =>
            credit.lessonCreditId === existing?.acceptedLessonCreditId,
        ) ?? eligible[0];
      if (!selected) {
        if (existing)
          await db
            .delete(schema.lessonResult)
            .where(
              and(
                eq(schema.lessonResult.profileId, owner.profileId),
                eq(schema.lessonResult.generation, owner.generation),
                eq(schema.lessonResult.courseId, courseId),
                eq(schema.lessonResult.lessonId, lessonId),
              ),
            )
            .run();
        continue;
      }
      await db
        .insert(schema.lessonResult)
        .values({
          ...owner,
          courseId,
          lessonId,
          acceptedLessonCreditId: selected.lessonCreditId,
        })
        .onConflictDoUpdate({
          target: [
            schema.lessonResult.profileId,
            schema.lessonResult.generation,
            schema.lessonResult.courseId,
            schema.lessonResult.lessonId,
          ],
          set: { acceptedLessonCreditId: selected.lessonCreditId },
        })
        .run();
    }
  }
  async function derive({
    owner,
    content,
  }: {
    owner: Owner;
    content: InstalledTeaching;
  }) {
    const courseId = content.body.courseId;
    const credits = await db
      .select()
      .from(schema.taskCredit)
      .where(
        and(
          eq(schema.taskCredit.profileId, owner.profileId),
          eq(schema.taskCredit.generation, owner.generation),
          eq(schema.taskCredit.courseId, courseId),
          eq(schema.taskCredit.status, "valid"),
        ),
      )
      .all();
    const results = await db
      .select()
      .from(schema.taskResult)
      .where(
        and(
          eq(schema.taskResult.profileId, owner.profileId),
          eq(schema.taskResult.generation, owner.generation),
          eq(schema.taskResult.courseId, courseId),
        ),
      )
      .all();
    for (const lesson of resolvedLessons(content.document)) {
      if (!lesson.completeDefinition || !lesson.lessonTasks.length) continue;
      const support: TaskCredit[] = [];
      for (const task of lesson.lessonTasks) {
        const result = results.find((result) => result.taskId === task.id);
        const candidates: TaskCredit[] = [];
        const expected = await definitionHash(content, task.id);
        for (const credit of credits)
          if (
            credit.lessonId === lesson.lessonId &&
            credit.taskId === task.id &&
            (credit.outcome === "completed" || task.optional) &&
            expected !== null &&
            expected ===
              (await definitionHash(pinned(credit.packageHash), task.id))
          )
            candidates.push(credit);
        const selected = effectiveTaskCredit({
          credits: candidates,
          selected: result?.acceptedCreditId ?? null,
        });
        if (!selected) break;
        support.push(selected);
      }
      if (support.length !== lesson.lessonTasks.length) continue;
      const receipt = await receiptFor({
          content,
          lessonId: lesson.lessonId,
          credits: support,
        }),
        fingerprint = await supportHash(receipt);
      const existing = (
        await db
          .select()
          .from(schema.lessonCredit)
          .where(
            and(
              owned(owner, courseId),
              eq(schema.lessonCredit.lessonId, lesson.lessonId),
              eq(schema.lessonCredit.supportHash, fingerprint),
            ),
          )
          .all()
      )[0];
      if (existing) continue;
      const lessonCreditId = parseId({ kind: "credit", value: ids() });
      await db
        .insert(schema.lessonCredit)
        .values({
          lessonCreditId,
          ...owner,
          courseId,
          lessonId: lesson.lessonId,
          packageHash: content.key,
          status: "valid",
          receiptVersion: 1,
          receipt: canonical(receipt),
          supportHash: fingerprint,
        })
        .run();
      for (const [ordinal, credit] of support.entries())
        await db
          .insert(schema.lessonCreditSupport)
          .values({
            lessonCreditId,
            ...owner,
            courseId,
            lessonId: lesson.lessonId,
            ordinal,
            taskId: credit.taskId,
            outcome: credit.outcome,
            taskCreditId: credit.creditId,
          })
          .run();
    }
    await recomputeResults({ owner, courseId });
  }
  async function withdrawDependentSupport({
    owner,
    courseId,
    taskCreditId,
  }: {
    owner: Owner;
    courseId: InstalledTeaching["body"]["courseId"];
    taskCreditId: CreditId;
  }) {
    const credits = await db
      .select()
      .from(schema.taskCredit)
      .where(
        and(
          eq(schema.taskCredit.profileId, owner.profileId),
          eq(schema.taskCredit.generation, owner.generation),
          eq(schema.taskCredit.courseId, courseId),
        ),
      )
      .all();
    const withdrawn = credits.find(
      (credit) => credit.creditId === taskCreditId,
    );
    if (!withdrawn || withdrawn.status !== "withdrawn")
      throw new Error(
        "Dependent support recomputation requires an owned withdrawn task credit",
      );
    const edges = await db
      .select()
      .from(schema.lessonCreditSupport)
      .where(
        and(
          eq(schema.lessonCreditSupport.profileId, owner.profileId),
          eq(schema.lessonCreditSupport.generation, owner.generation),
          eq(schema.lessonCreditSupport.courseId, courseId),
        ),
      )
      .all();
    const dependent = dependentLessonWithdrawal({
      taskCreditId,
      supports: edges,
    });
    for (const lessonCreditId of dependent)
      await db
        .update(schema.lessonCredit)
        .set({ status: "withdrawn" })
        .where(
          and(
            owned(owner, courseId),
            eq(schema.lessonCredit.lessonCreditId, lessonCreditId),
          ),
        )
        .run();
    const results = await db
      .select()
      .from(schema.taskResult)
      .where(
        and(
          eq(schema.taskResult.profileId, owner.profileId),
          eq(schema.taskResult.generation, owner.generation),
          eq(schema.taskResult.courseId, courseId),
        ),
      )
      .all();
    for (const taskId of new Set([
      ...credits.map((credit) => credit.taskId),
      ...results.map((result) => result.taskId),
    ])) {
      const current = results.find((result) => result.taskId === taskId),
        selected = effectiveTaskCredit({
          credits: credits.filter((credit) => credit.taskId === taskId),
          selected: current?.acceptedCreditId ?? null,
        });
      const where = and(
        eq(schema.taskResult.profileId, owner.profileId),
        eq(schema.taskResult.generation, owner.generation),
        eq(schema.taskResult.courseId, courseId),
        eq(schema.taskResult.taskId, taskId),
      );
      if (!selected) {
        if (current) await db.delete(schema.taskResult).where(where).run();
        continue;
      }
      await db
        .insert(schema.taskResult)
        .values({
          ...owner,
          courseId,
          lessonId: selected.lessonId,
          taskId,
          outcome: selected.outcome,
          acceptedCreditId: selected.creditId,
        })
        .onConflictDoUpdate({
          target: [
            schema.taskResult.profileId,
            schema.taskResult.generation,
            schema.taskResult.courseId,
            schema.taskResult.taskId,
          ],
          set: {
            lessonId: selected.lessonId,
            outcome: selected.outcome,
            acceptedCreditId: selected.creditId,
          },
        })
        .run();
    }
    await recomputeResults({ owner, courseId });
    return dependent;
  }
  return { validate, derive, recomputeResults, withdrawDependentSupport };
}
