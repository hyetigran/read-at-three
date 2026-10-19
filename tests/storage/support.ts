import {
  confirmInitialProfile,
  executeTeaching,
  prepareSelectedTeaching,
  selectedProjection,
  syntheticPreparation,
} from "./selected-support.ts";

import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTeachingApplication } from "../../packages/storage/src/index.ts";
import type {
  SqlExecutor,
  SqlValue,
} from "../../packages/storage/src/index.ts";
import {
  parseDevelopmentPackage,
  prepareCommand,
} from "../../packages/teaching/src/index.ts";
import type {
  AvailableAction,
  RuntimePackage,
  SelectedApplication,
  TeachingIntent,
  Owner,
} from "../../packages/teaching/src/index.ts";

export const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");
export type SqlHook = (
  sql: string,
  work: () => Promise<{ rows: unknown[][] }>,
) => Promise<{ rows: unknown[][] }>;
export function executorFor(db: DatabaseSync, hook?: SqlHook): SqlExecutor {
  return {
    async execute(sql: string, parameters: readonly SqlValue[]) {
      const work = async () => {
        const statement = db.prepare(sql);
        statement.setReadBigInts(true);
        const columns = statement.columns();
        if (!columns.length) {
          statement.run(...parameters);
          return { rows: [] };
        }
        return {
          rows: statement
            .all(...parameters)
            .map((row) => columns.map((column) => row[column.name])),
        };
      };
      return hook ? hook(sql, work) : work();
    },
  };
}
export function isReadOnlySqlAttempt(sql: string) {
  return /^\s*(?:select\b|PRAGMA\s+(?:foreign_keys(?:=ON)?|foreign_key_check|foreign_key_list\("[a-z_]+"\)|user_version|journal_mode|synchronous)\s*$)/i.test(
    sql,
  );
}
export async function databaseSnapshot(db: DatabaseSync) {
  const file = db.prepare("PRAGMA database_list").get()?.file;
  if (typeof file !== "string") throw new Error("Missing database file");
  const names = db
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all();
  return {
    schema: db
      .prepare(
        "SELECT type,name,tbl_name,rootpage,sql FROM sqlite_schema ORDER BY type,name",
      )
      .all(),
    version: db.prepare("PRAGMA user_version").get(),
    tables: names.map(({ name }) => {
      if (typeof name !== "string") throw new Error("Missing table name");
      const query = db.prepare(
        `SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`,
      );
      query.setReadBigInts(true);
      return { name, rows: query.all() };
    }),
    bytes: await readFile(file),
  };
}
export async function storageFixture(
  t: { after(fn: () => Promise<void>): void },
  supplied?: RuntimePackage,
) {
  const directory = await mkdtemp(join(tmpdir(), "reading-graph-"));
  const path = join(directory, "reading.sqlite");
  const connections: DatabaseSync[] = [];
  let number = 0;
  const ids = () => `graph-store-${++number}`;
  const content =
    supplied ??
    (await parseDevelopmentPackage(
      JSON.parse(
        await readFile("tests/fixtures/graph-development-package.json", "utf8"),
      ),
      hash,
    ));
  t.after(async () => {
    for (const db of connections) if (db.isOpen) db.close();
    await rm(directory, { recursive: true, force: true });
  });
  function connect(
    options: {
      content?: RuntimePackage;
      hook?: SqlHook;
      preparation?: Parameters<
        typeof createTeachingApplication
      >[0]["preparation"];
    } = {},
  ) {
    const db = new DatabaseSync(path);
    connections.push(db);
    db.exec("PRAGMA journal_mode=DELETE");
    db.exec("PRAGMA synchronous=FULL");
    const executor = executorFor(db, options.hook);
    return {
      db,
      executor,
      app: createTeachingApplication({
        ...(options.preparation ? { preparation: options.preparation } : {}),
        executor,
        content: options.content ?? content,
        ids,
        hash,
      }),
    };
  }
  async function connectReady(options: Parameters<typeof connect>[0] = {}) {
    const connection = connect({
      preparation: syntheticPreparation,
      ...options,
    });
    await confirmInitialProfile(connection.app, ids, hash);
    return connection;
  }
  async function act(
    app: SelectedApplication,
    kind: TeachingIntent["kind"],
    matches: (action: AvailableAction) => boolean = () => true,
  ) {
    const projection = await selectedProjection(app);
    if (projection.kind === "recovery") throw new Error(projection.message);
    const action = projection.actions.find(
      (action) => action.intent.kind === kind && matches(action),
    );
    if (!action) throw new Error(`No ${kind} at ${projection.kind}`);
    return executeTeaching(
      app,
      await prepareSelectedTeaching(app, async () =>
        prepareCommand({
          projection,
          request: { kind: "action", action },
          ids,
          hash,
        }),
      ),
    );
  }
  return { content, connect, connectReady, ids, act };
}
