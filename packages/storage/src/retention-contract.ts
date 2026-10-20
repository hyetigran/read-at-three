import type { PackageColumn } from "./package-references.ts";

type Edge = Readonly<{
  child: string;
  parent: string;
  columns: readonly (readonly [string, string])[];
}>;
export type OwnedPath = Readonly<{ root: string; edges: readonly Edge[] }>;

export const ownedPackagePaths: readonly OwnedPath[] = [
  {
    root: "profile",
    edges: [
      {
        child: "profile",
        parent: "task_run",
        columns: [
          ["undo_run_id", "run_id"],
          ["profile_id", "profile_id"],
          ["generation", "generation"],
        ],
      },
    ],
  },
  {
    root: "course_cursor",
    edges: [
      {
        child: "course_cursor",
        parent: "session",
        columns: [
          ["resume_session_id", "session_id"],
          ["profile_id", "profile_id"],
          ["generation", "generation"],
          ["course_id", "course_id"],
        ],
      },
    ],
  },
  {
    root: "task_advance",
    edges: [
      {
        child: "task_advance",
        parent: "task_run",
        columns: [
          ["run_id", "run_id"],
          ["profile_id", "profile_id"],
          ["generation", "generation"],
        ],
      },
    ],
  },
  {
    root: "advance_withdrawal",
    edges: [
      {
        child: "advance_withdrawal",
        parent: "task_run",
        columns: [
          ["run_id", "run_id"],
          ["profile_id", "profile_id"],
          ["generation", "generation"],
        ],
      },
    ],
  },
  {
    root: "task_result",
    edges: [
      {
        child: "task_result",
        parent: "task_credit",
        columns: [
          ["accepted_credit_id", "credit_id"],
          ["profile_id", "profile_id"],
          ["generation", "generation"],
          ["course_id", "course_id"],
          ["lesson_id", "lesson_id"],
          ["task_id", "task_id"],
          ["outcome", "outcome"],
        ],
      },
    ],
  },
  {
    root: "ink_stroke",
    edges: [
      {
        child: "ink_stroke",
        parent: "ink_document",
        columns: [["document_id", "document_id"]],
      },
    ],
  },
  {
    root: "ink_point_chunk",
    edges: [
      {
        child: "ink_point_chunk",
        parent: "ink_stroke",
        columns: [["stroke_id", "stroke_id"]],
      },
      {
        child: "ink_stroke",
        parent: "ink_document",
        columns: [["document_id", "document_id"]],
      },
    ],
  },
  {
    root: "ink_history",
    edges: [
      {
        child: "ink_history",
        parent: "ink_document",
        columns: [["document_id", "document_id"]],
      },
    ],
  },
  {
    root: "ink_operation",
    edges: [
      {
        child: "ink_operation",
        parent: "ink_history",
        columns: [
          ["document_id", "document_id"],
          ["layer", "layer"],
        ],
      },
      {
        child: "ink_history",
        parent: "ink_document",
        columns: [["document_id", "document_id"]],
      },
    ],
  },
  {
    root: "ink_operation",
    edges: [
      {
        child: "ink_operation",
        parent: "ink_stroke",
        columns: [
          ["origin_stroke_id", "stroke_id"],
          ["document_id", "document_id"],
          ["layer", "layer"],
        ],
      },
      {
        child: "ink_stroke",
        parent: "ink_document",
        columns: [["document_id", "document_id"]],
      },
    ],
  },
  {
    root: "lesson_credit_support",
    edges: [
      {
        child: "lesson_credit_support",
        parent: "lesson_credit",
        columns: [
          ["lesson_credit_id", "lesson_credit_id"],
          ["profile_id", "profile_id"],
          ["generation", "generation"],
          ["course_id", "course_id"],
          ["lesson_id", "lesson_id"],
        ],
      },
    ],
  },
  {
    root: "lesson_credit_support",
    edges: [
      {
        child: "lesson_credit_support",
        parent: "task_credit",
        columns: [
          ["task_credit_id", "credit_id"],
          ["profile_id", "profile_id"],
          ["generation", "generation"],
          ["course_id", "course_id"],
          ["lesson_id", "lesson_id"],
          ["task_id", "task_id"],
          ["outcome", "outcome"],
        ],
      },
    ],
  },
  {
    root: "lesson_result",
    edges: [
      {
        child: "lesson_result",
        parent: "lesson_credit",
        columns: [
          ["accepted_lesson_credit_id", "lesson_credit_id"],
          ["profile_id", "profile_id"],
          ["generation", "generation"],
          ["course_id", "course_id"],
          ["lesson_id", "lesson_id"],
        ],
      },
    ],
  },
];

export const metadataTables = [
  "schema_migration",
  "installation",
  "installed_package",
  "installed_representation",
  "command_receipt",
  "installation_profile_state",
  "profile_administration_receipt",
  "local_diagnostics",
  "lesson_files_command",
  "package_collection",
];

const identifier = (name: string) => {
  if (!/^[a-z_]+$/.test(name))
    throw new Error("Retention identifier is unsupported");
  return `"${name}"`;
};

export function retentionStatements(
  columns: readonly PackageColumn[],
  tables: readonly string[],
  paths: readonly OwnedPath[] = ownedPackagePaths,
): string[] {
  const classified = new Set([
    ...metadataTables,
    ...columns.map((column) => column.table),
    ...paths.flatMap((path) => [
      path.root,
      ...path.edges.flatMap((edge) => [edge.child, edge.parent]),
    ]),
  ]);
  if (
    tables.some((table) => !classified.has(table)) ||
    [...classified].some((table) => !tables.includes(table))
  )
    throw new Error(
      "Every owned schema table requires retention classification",
    );
  const roots = columns
    .filter((column) => column.role !== "metadata")
    .map((column) => {
      if (
        column.role === "pending" &&
        (column.table !== "installation_command" ||
          column.column !== "registered_package_hash")
      )
        throw new Error("Pending package reference predicate is unclassified");
      return `SELECT ${identifier(column.column)} AS package_hash FROM ${identifier(column.table)} WHERE ${identifier(column.column)} IS NOT NULL${column.role === "pending" ? " AND stage='readyInactive'" : ""}`;
    });
  for (const path of paths) {
    let current = path.root;
    const joins: string[] = [];
    for (const [index, edge] of path.edges.entries()) {
      if (edge.child !== current || edge.columns.length === 0)
        throw new Error("Retention path is not contiguous");
      joins.push(
        `JOIN ${identifier(edge.parent)} AS p${index + 1} ON ${edge.columns.map(([child, parent]) => `p${index}.${identifier(child)}=p${index + 1}.${identifier(parent)}`).join(" AND ")}`,
      );
      current = edge.parent;
    }
    const target = columns.find(
      (column) =>
        column.table === current &&
        column.column === "package_hash" &&
        column.role !== "pending",
    );
    if (!target)
      throw new Error("Retention path has no declared package owner");
    roots.push(
      `SELECT p${path.edges.length}.package_hash AS package_hash FROM ${identifier(path.root)} AS p0 ${joins.join(" ")}`,
    );
  }
  const conflict =
    "EXISTS(SELECT 1 FROM package_retention r JOIN package_collection c ON c.package_hash=r.package_hash WHERE c.state='collecting')";
  return [
    `CREATE VIEW package_retention AS ${roots.join(" UNION ")}`,
    ...tables.flatMap((table) =>
      ["INSERT", "UPDATE"].map(
        (operation) =>
          `CREATE TRIGGER retention_${table}_${operation.toLowerCase()} AFTER ${operation} ON ${identifier(table)} WHEN ${conflict} BEGIN SELECT RAISE(ABORT,'Package collection excludes new references'); END`,
      ),
    ),
  ];
}
