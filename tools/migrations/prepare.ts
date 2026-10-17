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
const {
  taskCredit,
  taskResult,
  lessonCredit,
  lessonCreditSupport,
  lessonResult,
  taskAdvanceV2,
  commandReceiptV3,
  commandReceipt,
  inkDocument,
  inkStroke,
  inkPointChunk,
  inkHistory,
  inkOperation,
  ...baseSchema
} = schema;
const latestSchema = { commandReceipt: commandReceiptV3, ...baseSchema };
const initialSchema = { ...latestSchema, taskAdvance: taskAdvanceV2 };
const v2Schema = { ...initialSchema, taskCredit, taskResult };
const generatedSnapshot = await generateSQLiteDrizzleJson(initialSchema);
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
const creditSql = await readFile(
  resolve(root, "packages/storage/migrations/0001_sound_task_credits.sql"),
  "utf8",
);
const creditStatements = creditSql
  .split("--> statement-breakpoint")
  .map((part) => part.trim())
  .filter(Boolean);
const currentSnapshot = await generateSQLiteDrizzleJson(v2Schema);
const generatedCredits = await generateSQLiteMigration(
  generatedSnapshot,
  currentSnapshot,
);
if (
  canonical(generatedCredits.map((statement) => statement.trim())) !==
  canonical(creditStatements)
)
  throw new Error("Drizzle credit migration is stale relative to schema.ts");
const storedCurrentSnapshot: unknown = JSON.parse(
  await readFile(
    resolve(root, "packages/storage/migrations/meta/0001_snapshot.json"),
    "utf8",
  ),
);
if (snapshotContent(storedCurrentSnapshot) !== snapshotContent(currentSnapshot))
  throw new Error("Drizzle credit snapshot is stale relative to schema.ts");
const deferredCreditStatements = creditStatements.map((statement) => {
  if (!statement.startsWith("CREATE TABLE `task_result`")) return statement;
  const foreignKey =
    /^(\s*FOREIGN KEY \([^\n]+ REFERENCES `task_credit`\([^\n]+ ON UPDATE no action ON DELETE no action)(,?)$/gm;
  if ([...statement.matchAll(foreignKey)].length !== 1)
    throw new Error("Unreviewed result-to-credit foreign key grammar");
  return statement.replace(foreignKey, "$1 DEFERRABLE INITIALLY DEFERRED$2");
});
const upgrades = [
  ...deferredCreditStatements,
  "UPDATE installation SET database_version=2",
];
const latestSnapshot = await generateSQLiteDrizzleJson({
  ...latestSchema,
  taskCredit,
  taskResult,
});
const acceptanceStatements = await generateSQLiteMigration(
  currentSnapshot,
  latestSnapshot,
);
if (
  canonical(acceptanceStatements) !==
  canonical(["ALTER TABLE `task_advance` ADD `accepting_command` text;"])
)
  throw new Error("Unreviewed accepting command migration");
const acceptanceSql = await readFile(
  resolve(root, "packages/storage/migrations/0002_accepting_command.sql"),
  "utf8",
);
if (
  canonical(
    acceptanceSql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean),
  ) !== canonical(acceptanceStatements)
)
  throw new Error("Drizzle accepting-command migration is stale");
const snapshotPath = resolve(
  root,
  "packages/storage/migrations/meta/0002_snapshot.json",
);
if (arguments_.includes("--check")) {
  const storedLatest: unknown = JSON.parse(
    await readFile(snapshotPath, "utf8"),
  );
  if (snapshotContent(storedLatest) !== snapshotContent(latestSnapshot))
    throw new Error("Drizzle accepting-command snapshot is stale");
} else {
  const existing: unknown = await readFile(snapshotPath, "utf8")
    .then(JSON.parse)
    .catch(() => null);
  const id =
    typeof existing === "object" &&
    existing !== null &&
    "id" in existing &&
    typeof existing.id === "string"
      ? existing.id
      : latestSnapshot.id;
  const prevId =
    typeof storedCurrentSnapshot === "object" &&
    storedCurrentSnapshot !== null &&
    "id" in storedCurrentSnapshot &&
    typeof storedCurrentSnapshot.id === "string"
      ? storedCurrentSnapshot.id
      : undefined;
  if (!prevId) throw new Error("Missing V2 snapshot identity");
  await writeFile(
    snapshotPath,
    await format(JSON.stringify({ ...latestSnapshot, id, prevId }), {
      parser: "json",
    }),
  );
}
const finalStatements = [
  ...acceptanceStatements,
  "UPDATE installation SET database_version=3",
];
const inkTables = {
  inkDocument,
  inkStroke,
  inkPointChunk,
  inkHistory,
  inkOperation,
};
const inkStatements = await generateSQLiteMigration(
  await generateSQLiteDrizzleJson({}),
  await generateSQLiteDrizzleJson(inkTables),
);
const originalReceipt = statements.find((statement) =>
  statement.startsWith("CREATE TABLE command_receipt "),
);
if (!originalReceipt) throw new Error("Missing original receipt schema");
const receiptReplacement = originalReceipt.replace(
  "('profile','session')",
  "('profile','session','document')",
);
const writingStatements = [
  "DROP INDEX receipt_owner_revision",
  "ALTER TABLE command_receipt RENAME TO command_receipt_v3",
  receiptReplacement,
  "INSERT INTO command_receipt SELECT * FROM command_receipt_v3",
  "DROP TABLE command_receipt_v3",
  "CREATE INDEX receipt_owner_revision ON command_receipt(owner_profile_id,owner_generation,scope_kind,scope_id,resulting_revision)",
  "CREATE UNIQUE INDEX ink_run_owner ON task_run(run_id,profile_id,generation,course_id,package_hash,lesson_id,task_id)",
  ...inkStatements,
  "UPDATE installation SET database_version=4",
];
const writingPath = resolve(
  root,
  "packages/storage/migrations/0003_canonical_ink.sql",
);
const writingSql =
  writingStatements
    .map((statement) => statement.replace(/;$/, ""))
    .join(";\n--> statement-breakpoint\n") + ";\n";
if (arguments_.includes("--check")) {
  if ((await readFile(writingPath, "utf8")) !== writingSql)
    throw new Error("Writing migration stale");
} else await writeFile(writingPath, writingSql);
const editingStatements = ["UPDATE installation SET database_version = 5"];
const editingPath = resolve(
  root,
  "packages/storage/migrations/0004_ink_editing.sql",
);
const editingSql = editingStatements.join(";\n") + ";\n";
if (arguments_.includes("--check")) {
  if ((await readFile(editingPath, "utf8")) !== editingSql)
    throw new Error("Ink editing migration stale");
} else await writeFile(editingPath, editingSql);
const generatedLessonStatements = await generateSQLiteMigration(
  await generateSQLiteDrizzleJson({}),
  await generateSQLiteDrizzleJson({
    lessonCredit,
    lessonCreditSupport,
    lessonResult,
  }),
);
const lessonStatements = generatedLessonStatements.map((statement) => {
  if (!statement.startsWith("CREATE TABLE `lesson_result`")) return statement;
  const foreignKey =
    /^(\s*FOREIGN KEY \([^\n]+ REFERENCES `lesson_credit`\([^\n]+ ON UPDATE no action ON DELETE no action)(,?)$/gm;
  if ([...statement.matchAll(foreignKey)].length !== 1)
    throw new Error("Unreviewed lesson result foreign key grammar");
  return statement.replace(foreignKey, "$1 DEFERRABLE INITIALLY DEFERRED$2");
});
lessonStatements.push("UPDATE installation SET database_version = 6");
const lessonPath = resolve(
  root,
  "packages/storage/migrations/0005_lesson_support.sql",
);
const lessonSql =
  lessonStatements
    .map((statement) => statement.replace(/;$/, ""))
    .join(";\n--> statement-breakpoint\n") + ";\n";
if (arguments_.includes("--check")) {
  if ((await readFile(lessonPath, "utf8")) !== lessonSql)
    throw new Error("Lesson support migration stale");
} else await writeFile(lessonPath, lessonSql);
const output = await format(
  `// Generated from ordered Kit migrations plus reviewed deferred constraints.\n// Reproduce: node --import tsx tools/migrations/prepare.ts\nexport const migrationStatements = ${JSON.stringify(statements)} as const;\nexport const migrations = [{version:1, id:"issue-02-initial", statements:migrationStatements}, {version:2, id:"issue-03-sound-task-credits", statements:${JSON.stringify(upgrades)}}, {version:3,id:"issue-04-accepting-command",statements:${JSON.stringify(finalStatements)}}, {version:4,id:"issue-06-canonical-ink",statements:${JSON.stringify(writingStatements)}}, {version:5,id:"issue-07-ink-editing",statements:${JSON.stringify(editingStatements)}}, {version:6,id:"issue-08-lesson-support",statements:${JSON.stringify(lessonStatements)}}] as const;\n`,
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
  "Ordered SQLite migrations and reviewed deferred constraints packaged.\n",
);
