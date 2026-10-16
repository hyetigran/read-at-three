import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { format } from "prettier";
import {
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
} from "drizzle-kit/api";
import { canonical } from "../../packages/teaching/src/index.ts";
import * as schema from "../../packages/storage/src/schema.ts";

// Drizzle cannot express deferred foreign keys. Keep these reviewed additions
// beside the packaging step; the runtime still has exactly one migration ledger.
const deferredForeignKeys: Record<string, readonly string[]> = {
  profile: [
    "FOREIGN KEY(undo_run_id,profile_id,generation) REFERENCES task_run(run_id,profile_id,generation) DEFERRABLE INITIALLY DEFERRED",
  ],
  course_cursor: [
    "FOREIGN KEY(resume_session_id,profile_id,generation,course_id) REFERENCES session(session_id,profile_id,generation,course_id) DEFERRABLE INITIALLY DEFERRED",
  ],
  session: [
    "FOREIGN KEY(return_session_id,profile_id,generation,course_id) REFERENCES session(session_id,profile_id,generation,course_id) DEFERRABLE INITIALLY DEFERRED",
    "FOREIGN KEY(current_run_id,session_id,profile_id,generation,course_id,package_hash,lesson_id,task_id) REFERENCES task_run(run_id,session_id,profile_id,generation,course_id,package_hash,lesson_id,task_id) DEFERRABLE INITIALLY DEFERRED",
  ],
  task_run: [
    "FOREIGN KEY(session_id,profile_id,generation,course_id,package_hash,lesson_id) REFERENCES session(session_id,profile_id,generation,course_id,package_hash,lesson_id) DEFERRABLE INITIALLY DEFERRED",
    "FOREIGN KEY(active_advance_id,run_id) REFERENCES task_advance(advance_id,run_id) DEFERRABLE INITIALLY DEFERRED",
  ],
  task_advance: [
    "FOREIGN KEY(previous_advance_id,run_id) REFERENCES task_advance(advance_id,run_id) DEFERRABLE INITIALLY DEFERRED",
  ],
};

const tableOrder = [
  "schema_migration",
  "installation",
  "profile",
  "installed_package",
  "course_activation",
  "course_cursor",
  "session",
  "task_run",
  "task_advance",
  "command_receipt",
];
const indexOrder = [
  "session_one_active",
  "session_one_live_scope",
  "session_owner_selection",
  "task_advance_chain",
  "receipt_owner_revision",
  "session_package",
  "run_package",
];
const tableChecks = new Set(["package_storage", "receipt_generation"]);
const arguments_ = process.argv.slice(2);
if (arguments_.some((argument) => argument !== "--check"))
  throw new Error("Usage: prepare.ts [--check]");
const root = resolve(import.meta.dirname, "../..");
const sql = await readFile(
  resolve(root, "packages/storage/migrations/0000_initial.sql"),
  "utf8",
);
const generatedSnapshot = await generateSQLiteDrizzleJson(schema);
const generatedStatements = await generateSQLiteMigration(
  await generateSQLiteDrizzleJson({}),
  generatedSnapshot,
);
const sqlStatements = sql
  .split("--> statement-breakpoint")
  .map((part) => part.trim())
  .filter(Boolean);
if (
  canonical(generatedStatements.map((statement) => statement.trim())) !==
  canonical(sqlStatements)
)
  throw new Error("Drizzle SQL baseline is stale relative to schema.ts");
function snapshotContent(value: unknown): string {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    typeof value.id !== "string" ||
    !("prevId" in value) ||
    typeof value.prevId !== "string" ||
    !("_meta" in value)
  )
    throw new Error("Invalid Drizzle SQLite snapshot metadata");
  const { id, prevId, _meta, ...content } = value;
  if (
    typeof _meta !== "object" ||
    _meta === null ||
    Object.values(_meta).some(
      (entry) =>
        typeof entry !== "object" ||
        entry === null ||
        Object.keys(entry).length !== 0,
    )
  )
    throw new Error("Initial SQLite snapshot cannot contain rename metadata");
  return canonical(content);
}
const storedSnapshot: unknown = JSON.parse(
  await readFile(
    resolve(root, "packages/storage/migrations/meta/0000_snapshot.json"),
    "utf8",
  ),
);
if (snapshotContent(storedSnapshot) !== snapshotContent(generatedSnapshot))
  throw new Error("Drizzle snapshot is stale relative to schema.ts");
const tables = new Map<
  string,
  {
    columns: Map<string, string>;
    primary: string[];
    foreign: string[];
    checks: Map<string, string>;
    unique: string[][];
  }
>();
const indexes = new Map<string, string>();

// This deliberately accepts only Kit's reviewed SQLite CREATE grammar. A Kit
// upgrade or new DDL form must fail here instead of silently changing v1.
for (const statement of sqlStatements) {
  const table = /^CREATE TABLE `([a-z_]+)` \(\n([\s\S]+)\n\);$/.exec(statement);
  if (table?.[1] && table[2]) {
    const columns = new Map<string, string>();
    const primary: string[] = [];
    const foreign: string[] = [];
    const checks = new Map<string, string>();
    for (const line of table[2].split("\n")) {
      const clause = line.trim().replace(/,$/, "");
      const column = /^`([a-z_]+)` (text|integer|blob)(.*)$/.exec(clause);
      const check = /^CONSTRAINT "([a-z_]+)" (CHECK\(.+\))$/.exec(clause);
      if (column?.[1] && column[2] && column[3] !== undefined)
        columns.set(
          column[1],
          `${column[1]} ${column[2].toUpperCase()}${column[3]}`,
        );
      else if (check?.[1] && check[2]) checks.set(check[1], check[2]);
      else if (clause.startsWith("PRIMARY KEY("))
        primary.push(clause.replaceAll("`", "").replaceAll(", ", ","));
      else if (clause.startsWith("FOREIGN KEY ("))
        foreign.push(
          clause
            .replaceAll("`", "")
            .replace("FOREIGN KEY (", "FOREIGN KEY(")
            .replace(/ ON UPDATE no action ON DELETE no action$/, ""),
        );
      else throw new Error(`Unreviewed generated table clause: ${clause}`);
    }
    tables.set(table[1], { columns, primary, foreign, checks, unique: [] });
    continue;
  }
  const index =
    /^CREATE (UNIQUE )?INDEX `([a-z_]+)` ON `([a-z_]+)` \(([^)]+)\)(.*);$/.exec(
      statement,
    );
  if (!index?.[2] || !index[3] || !index[4] || index[5] === undefined)
    throw new Error(`Unreviewed generated statement: ${statement}`);
  const columns = index[4].replaceAll("`", "").split(",");
  if (index[1] && index[2].endsWith("_unique") && index[5] === "") {
    const table = tables.get(index[3]);
    if (!table) throw new Error("Unique index precedes its generated table");
    table.unique.push(columns);
  } else
    indexes.set(
      index[2],
      `CREATE ${index[1] ?? ""}INDEX ${index[2]} ON ${index[3]}(${columns.join(",")})${index[5]}`,
    );
}

const statements: string[] = [];
for (const name of tableOrder) {
  const table = tables.get(name);
  if (!table) throw new Error(`Missing generated table: ${name}`);
  tables.delete(name);
  // Preserve v1's exact installed SQL and checksum while deriving each column,
  // key, index and CHECK from Kit output. These layout changes have no SQL effect.
  if (name === "schema_migration") {
    const version = table.columns.get("version");
    if (!version) throw new Error("Missing migration version");
    table.columns.set("version", version.replace(" NOT NULL", ""));
  }
  const unique: string[] = [];
  for (const columns of table.unique) {
    const column = columns[0];
    if (columns.length === 1 && column) {
      const definition = table.columns.get(column);
      if (!definition)
        throw new Error("Unique key references a missing column");
      table.columns.set(column, `${definition} UNIQUE`);
    } else unique.push(`UNIQUE(${columns.join(",")})`);
  }
  const trailingChecks: string[] = [];
  for (const [constraint, expression] of table.checks) {
    if (tableChecks.has(constraint)) {
      trailingChecks.push(expression);
      continue;
    }
    const firstColumn = expression
      .match(/[a-z_]+/g)
      ?.find((token) => table.columns.has(token));
    const definition = firstColumn && table.columns.get(firstColumn);
    if (!firstColumn || !definition)
      throw new Error("CHECK references no generated column");
    table.columns.set(firstColumn, `${definition} ${expression}`);
  }
  const clauses = [
    ...table.columns.values(),
    ...table.primary,
    ...unique,
    ...table.foreign,
    ...(deferredForeignKeys[name] ?? []),
    ...trailingChecks,
  ];
  statements.push(`CREATE TABLE ${name} (${clauses.join(", ")})`);
}
for (const name of indexOrder) {
  const statement = indexes.get(name);
  if (!statement) throw new Error(`Missing generated index: ${name}`);
  indexes.delete(name);
  statements.push(statement);
}
if (tables.size || indexes.size)
  throw new Error("Generated schema contains unreviewed objects");
const output = await format(
  `// Generated from migrations/0000_initial.sql plus reviewed deferred constraints.\n// Reproduce: npx drizzle-kit generate --config drizzle.config.ts --name initial\n// Then: node --import tsx tools/migrations/prepare.ts\nexport const migrationStatements = ${JSON.stringify(statements)} as const;\n`,
  { parser: "typescript" },
);
const path = resolve(root, "packages/storage/src/generated-migration.ts");
if (arguments_.includes("--check")) {
  if ((await readFile(path, "utf8")) !== output)
    throw new Error(
      "Packaged migration is stale; run tools/migrations/prepare.ts",
    );
} else await writeFile(path, output);
process.stdout.write(
  "Generated SQLite baseline and reviewed deferred constraints packaged.\n",
);
