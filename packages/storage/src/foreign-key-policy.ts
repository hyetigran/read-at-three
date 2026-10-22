import type { SqlExecutor } from "./executor.ts";
import { classifiedPackageColumns } from "./package-references.ts";
import type { PackageColumn } from "./package-references.ts";
import { ownedPackagePaths } from "./retention-contract.ts";
import type { OwnedPath } from "./retention-contract.ts";

type ForeignKeyRole = "ownership" | "binding" | "metadata" | "pending";
export const foreignKeyPolicy: Readonly<Record<string, ForeignKeyRole>> = {
  "removed_drawing(document_id)->ink_document(document_id)": "binding",
  "storage_cleanup_state(profile_id,generation)->profile(profile_id,generation)":
    "binding",
  "storage_cleanup_receipt(profile_id,generation)->profile(profile_id,generation)":
    "binding",
  "advance_withdrawal(run_id,profile_id,generation)->task_run(run_id,profile_id,generation)":
    "ownership",
  "advance_withdrawal(advance_id,run_id)->task_advance(advance_id,run_id)":
    "binding",
  "command_receipt(owner_profile_id,owner_generation)->profile(profile_id,generation)":
    "binding",
  "course_activation(fallback_package_hash,course_id)->installed_package(package_hash,course_id)":
    "ownership",
  "course_activation(active_package_hash,course_id)->installed_package(package_hash,course_id)":
    "ownership",
  "course_cursor(resume_session_id,profile_id,generation,course_id)->session(session_id,profile_id,generation,course_id)":
    "ownership",
  "course_cursor(course_id)->course_activation(course_id)": "binding",
  "course_cursor(profile_id,generation)->profile(profile_id,generation)":
    "binding",
  "ink_document(run_id,profile_id,generation,course_id,package_hash,lesson_id,task_id)->task_run(run_id,profile_id,generation,course_id,package_hash,lesson_id,task_id)":
    "binding",
  "ink_history(document_id)->ink_document(document_id)": "ownership",
  "ink_operation(origin_stroke_id,document_id,layer)->ink_stroke(stroke_id,document_id,layer)":
    "ownership",
  "ink_operation(document_id,layer)->ink_history(document_id,layer)":
    "ownership",
  "ink_point_chunk(stroke_id)->ink_stroke(stroke_id)": "ownership",
  "ink_stroke(document_id)->ink_document(document_id)": "ownership",
  "installation_command(registered_package_hash)->installed_package(package_hash)":
    "pending",
  "installation_command(installation_id)->installation(installation_id)":
    "metadata",
  "installation_profile_state(profile_id,generation)->profile(profile_id,generation)":
    "binding",
  "installation_profile_state(installation_id)->installation(installation_id)":
    "metadata",
  "installed_representation(package_hash)->installed_package(package_hash)":
    "metadata",
  "lesson_credit(package_hash,course_id)->installed_package(package_hash,course_id)":
    "ownership",
  "lesson_credit(profile_id,generation)->profile(profile_id,generation)":
    "binding",
  "lesson_credit_support(task_credit_id,profile_id,generation,course_id,lesson_id,task_id,outcome)->task_credit(credit_id,profile_id,generation,course_id,lesson_id,task_id,outcome)":
    "ownership",
  "lesson_credit_support(lesson_credit_id,profile_id,generation,course_id,lesson_id)->lesson_credit(lesson_credit_id,profile_id,generation,course_id,lesson_id)":
    "ownership",
  "lesson_files_command(installation_id)->installation(installation_id)":
    "metadata",
  "lesson_result(accepted_lesson_credit_id,profile_id,generation,course_id,lesson_id)->lesson_credit(lesson_credit_id,profile_id,generation,course_id,lesson_id)":
    "ownership",
  "profile(undo_run_id,profile_id,generation)->task_run(run_id,profile_id,generation)":
    "ownership",
  "profile_administration_receipt(installation_id)->installation(installation_id)":
    "metadata",
  "session(current_run_id,session_id,profile_id,generation,course_id,package_hash,lesson_id,task_id)->task_run(run_id,session_id,profile_id,generation,course_id,package_hash,lesson_id,task_id)":
    "binding",
  "session(return_session_id,profile_id,generation,course_id)->session(session_id,profile_id,generation,course_id)":
    "binding",
  "session(package_hash,course_id)->installed_package(package_hash,course_id)":
    "ownership",
  "session(profile_id,generation)->profile(profile_id,generation)": "binding",
  "task_advance(previous_advance_id,run_id)->task_advance(advance_id,run_id)":
    "binding",
  "task_advance(run_id,profile_id,generation)->task_run(run_id,profile_id,generation)":
    "ownership",
  "task_credit(terminal_advance_id,run_id)->task_advance(advance_id,run_id)":
    "binding",
  "task_credit(run_id,session_id,profile_id,generation,course_id,package_hash,lesson_id,task_id)->task_run(run_id,session_id,profile_id,generation,course_id,package_hash,lesson_id,task_id)":
    "binding",
  "task_result(accepted_credit_id,profile_id,generation,course_id,lesson_id,task_id,outcome)->task_credit(credit_id,profile_id,generation,course_id,lesson_id,task_id,outcome)":
    "ownership",
  "task_run(active_advance_id,run_id)->task_advance(advance_id,run_id)":
    "binding",
  "task_run(session_id,profile_id,generation,course_id,package_hash,lesson_id)->session(session_id,profile_id,generation,course_id,package_hash,lesson_id)":
    "binding",
};

export function foreignKeyPolicyForVersion(version: number) {
  return version >= 15
    ? foreignKeyPolicy
    : Object.fromEntries(
        Object.entries(foreignKeyPolicy).filter(
          ([key]) =>
            !key.startsWith("removed_drawing(") &&
            !key.startsWith("storage_cleanup_receipt(") &&
            !key.startsWith("storage_cleanup_state("),
        ),
      );
}

export async function verifyForeignKeyPolicy(
  executor: Pick<SqlExecutor, "execute">,
  policy: Readonly<Record<string, ForeignKeyRole>> = foreignKeyPolicy,
  columns: readonly PackageColumn[] = classifiedPackageColumns(),
  paths: readonly OwnedPath[] = ownedPackagePaths,
): Promise<void> {
  const tables = (
    await executor.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      [],
    )
  ).rows;
  const actual = new Set<string>();
  for (const [table] of tables) {
    if (typeof table !== "string" || !/^[a-z_]+$/.test(table))
      throw new Error("Foreign key inventory table is unsupported");
    const groups = new Map<
      number,
      { parent: string; columns: [string, string][] }
    >();
    const rows = (
      await executor.execute(`PRAGMA foreign_key_list("${table}")`, [])
    ).rows;
    for (const [
      rawId,
      rawSequence,
      parent,
      childColumn,
      parentColumn,
    ] of rows) {
      const id = typeof rawId === "bigint" ? Number(rawId) : rawId;
      const sequence =
        typeof rawSequence === "bigint" ? Number(rawSequence) : rawSequence;
      if (
        typeof id !== "number" ||
        !Number.isSafeInteger(id) ||
        id < 0 ||
        typeof sequence !== "number" ||
        !Number.isSafeInteger(sequence) ||
        sequence < 0 ||
        typeof parent !== "string" ||
        typeof childColumn !== "string" ||
        typeof parentColumn !== "string"
      )
        throw new Error("Foreign key inventory is unsupported");
      const group = groups.get(id) ?? { parent, columns: [] };
      if (group.parent !== parent || sequence !== group.columns.length)
        throw new Error("Foreign key component order is unsupported");
      group.columns.push([childColumn, parentColumn]);
      groups.set(id, group);
    }
    for (const group of groups.values()) {
      const key = `${table}(${group.columns.map(([child]) => child).join(",")})->${group.parent}(${group.columns.map(([, parent]) => parent).join(",")})`;
      if (actual.has(key) || !Object.hasOwn(policy, key))
        throw new Error("Foreign key retention classification is incomplete");
      const role = policy[key];
      if (group.parent === "installed_package") {
        const component = group.columns.find(
          ([, parent]) => parent === "package_hash",
        );
        const column =
          component &&
          columns.find(
            (entry) => entry.table === table && entry.column === component[0],
          );
        const indirectOwner =
          component?.[0] === "package_hash" &&
          paths.some((path) => path.edges.at(-1)?.parent === table);
        if (
          !column ||
          (role === "metadata" && column.role !== "metadata") ||
          (role === "pending" && column.role !== "pending") ||
          (role === "ownership" &&
            column.role !== "root" &&
            !(column.role === "metadata" && indirectOwner)) ||
          role === "binding"
        )
          throw new Error(
            "Foreign key material intent differs from package-column classification",
          );
      } else if (
        role === "ownership" &&
        !paths.some((path) =>
          path.edges.some(
            (edge) =>
              edge.child === table &&
              edge.parent === group.parent &&
              edge.columns.length === group.columns.length &&
              edge.columns.every(
                ([child, parent], index) =>
                  child === group.columns[index]?.[0] &&
                  parent === group.columns[index]?.[1],
              ),
          ),
        )
      )
        throw new Error(
          "Foreign key material ownership has no declared retention path",
        );
      actual.add(key);
    }
  }
  if (actual.size !== Object.keys(policy).length)
    throw new Error("Declared foreign key retention classification is stale");
}
