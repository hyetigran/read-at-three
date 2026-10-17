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
  TeachingApplication,
  TeachingIntent,
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
  function connect(options: { content?: RuntimePackage; hook?: SqlHook } = {}) {
    const db = new DatabaseSync(path);
    connections.push(db);
    db.exec("PRAGMA journal_mode=DELETE");
    db.exec("PRAGMA synchronous=FULL");
    const executor = executorFor(db, options.hook);
    return {
      db,
      executor,
      app: createTeachingApplication({
        executor,
        content: options.content ?? content,
        ids,
        hash,
      }),
    };
  }
  async function act(
    app: TeachingApplication,
    kind: TeachingIntent["kind"],
    matches: (action: AvailableAction) => boolean = () => true,
  ) {
    const projection = await app.read();
    if (projection.kind === "recovery") throw new Error(projection.message);
    const action = projection.actions.find(
      (action) => action.intent.kind === kind && matches(action),
    );
    if (!action) throw new Error(`No ${kind} at ${projection.kind}`);
    return app.dispatch(
      await prepareCommand({
        projection,
        request: { kind: "action", action },
        ids,
        hash,
      }),
    );
  }
  return { content, connect, ids, act };
}
