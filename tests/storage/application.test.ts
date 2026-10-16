import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createTeachingApplication } from "../../packages/storage/src/index.ts";
import type {
  SqlExecutor,
  SqlValue,
} from "../../packages/storage/src/index.ts";
import {
  canonical,
  canonicalContentBody,
  parseCommand,
  parseDevelopmentPackage,
  prepareCommand,
} from "../../packages/teaching/src/index.ts";
import type {
  DevelopmentBody,
  TeachingApplication,
  TeachingCommand,
} from "../../packages/teaching/src/index.ts";
const hash = async (value: string) =>
  createHash("sha256").update(value).digest("hex");
const copy = {
  kind: "added",
  text: "Synthetic non-book integration fixture é Ж 🐻",
} as const;
const body = {
  courseId: "synthetic-course",
  releaseId: "synthetic-release",
  coverage: "partial-first-m",
  title: copy,
  lessonId: "synthetic-lesson",
  taskId: "synthetic-task",
  startNodeId: "model",
  nodes: [
    {
      id: "model",
      parentAction: copy,
      spoken: copy,
      expected: copy,
      parentRole: "model",
      glyph: "m",
      cue: { kind: "sustain", durationMs: 2000 },
      next: { kind: "node", nodeId: "child" },
    },
    {
      id: "child",
      parentAction: copy,
      spoken: copy,
      expected: copy,
      parentRole: "listen",
      glyph: "m",
      cue: { kind: "sustain", durationMs: 2000 },
      next: {
        kind: "frontier",
        unmetObligations: ["later-required-m", "required-s"],
      },
    },
  ],
} as const satisfies DevelopmentBody;
async function fixture(t: { after(fn: () => Promise<void>): void }) {
  const directory = await mkdtemp(join(tmpdir(), "reading-store-"));
  const path = join(directory, "teaching.sqlite");
  const databases: DatabaseSync[] = [];
  t.after(async () => {
    for (const db of databases) db.close();
    await rm(directory, { recursive: true, force: true });
  });
  let sequence = 0;
  const ids = () => `id-${++sequence}`;
  const content = await parseDevelopmentPackage(
    {
      formatVersion: 1,
      body,
      packageHash: await hash(canonicalContentBody(body)),
    },
    hash,
  );
  function connect(
    hook?: (
      sql: string,
      work: () => Promise<{ rows: unknown[][] }>,
    ) => Promise<{ rows: unknown[][] }>,
  ) {
    const db = new DatabaseSync(path);
    databases.push(db);
    db.exec("PRAGMA journal_mode=DELETE");
    db.exec("PRAGMA synchronous=FULL");
    const executor: SqlExecutor = {
      async execute(sql: string, parameters: readonly SqlValue[]) {
        const work = async () => {
          const stmt = db.prepare(sql);
          stmt.setReadBigInts(true);
          const columns = stmt.columns();
          if (columns.length === 0) {
            stmt.run(...parameters);
            return { rows: [] };
          }
          return {
            rows: stmt
              .all(...parameters)
              .map((row) => columns.map((column) => row[column.name])),
          };
        };
        return hook ? hook(sql, work) : work();
      },
    };
    return {
      db,
      executor,
      app: createTeachingApplication({ executor, content, ids, hash }),
    };
  }
  return { connect, content, ids };
}
async function command(
  app: TeachingApplication,
  ids: () => string,
): Promise<TeachingCommand> {
  return prepareCommand({ projection: await app.read(), ids, hash });
}
test("real SQLite restart resumes exact pinned node/revision and never credits partial frontier", async (t) => {
  const f = await fixture(t);
  const first = f.connect();
  const entry = await first.app.open();
  assert.equal(entry.kind, "entry");
  const start = await command(first.app, f.ids);
  assert.equal((await first.app.dispatch(start)).kind, "committed");
  const model = await first.app.read();
  assert.equal(model.kind, "teaching");
  assert.equal(
    (await first.app.dispatch(await command(first.app, f.ids))).kind,
    "committed",
  );
  const restart = f.connect();
  const child = await restart.app.open();
  assert.equal(child.kind, "teaching");
  if (child.kind === "teaching") {
    assert.equal(child.turn.id, "child");
    assert.equal(child.revision, "1");
    assert.equal(child.packageHash, f.content.packageHash);
  }
  await restart.app.dispatch(await command(restart.app, f.ids));
  const frontier = await restart.app.read();
  assert.equal(frontier.kind, "frontier");
  assert.deepEqual(
    first.db
      .prepare("select status from task_run")
      .all()
      .map((row) => row.status),
    ["inProgress"],
  );
  assert.equal(
    first.db
      .prepare(
        "select count(*) as n from sqlite_master where name like '%credit%' or name like '%result%'",
      )
      .get()?.n,
    0,
  );
  assert.equal(
    first.db.prepare("select count(*) as n from task_advance").get()?.n,
    2,
  );
});
test("matching retry replays receipt; changed identity, stale revision, stale owner and wrong run reject atomically", async (t) => {
  const f = await fixture(t);
  const { app, db } = f.connect();
  await app.open();
  const start = await command(app, f.ids);
  const accepted = await app.dispatch(start);
  assert.deepEqual(await app.dispatch(start), accepted);
  const advance = await command(app, f.ids);
  const reused = parseCommand({
    ...advance,
    commandId: start.commandId,
    kind: "start",
    scope: start.scope,
    expectedRevision: start.expectedRevision,
    payload: { packageHash: "0".repeat(64) },
    payloadHash: await hash(
      canonical({ kind: "start", payload: { packageHash: "0".repeat(64) } }),
    ),
  });
  const changed = await app.dispatch(reused);
  assert.equal(changed.kind, "rejected");
  if (changed.kind === "rejected")
    assert.equal(changed.code, "command-identity");
  const stale = parseCommand({
    ...advance,
    commandId: f.ids(),
    expectedRevision: "3",
  });
  assert.equal((await app.dispatch(stale)).kind, "rejected");
  const owner = parseCommand({
    ...advance,
    commandId: f.ids(),
    owner: { ...advance.owner, generation: "1" },
    scope: { ...advance.scope, generation: "1" },
  });
  assert.equal((await app.dispatch(owner)).kind, "rejected");
  if (advance.kind !== "advance") throw new Error("Expected advance fixture");
  const wrongPayload = { ...advance.payload, runId: "other-run" };
  const wrongRun = parseCommand({
    ...advance,
    commandId: f.ids(),
    payload: wrongPayload,
    payloadHash: await hash(
      canonical({ kind: advance.kind, payload: wrongPayload }),
    ),
  });
  assert.equal((await app.dispatch(wrongRun)).kind, "rejected");
  assert.equal(
    db.prepare("select count(*) as n from task_advance").get()?.n,
    0,
  );
});
test("pre-COMMIT write failure rolls back all snapshots/revisions/receipts", async (t) => {
  const f = await fixture(t);
  let fail = false;
  const { app, db } = f.connect(async (sql, work) => {
    if (fail && sql.startsWith('insert into "task_advance"'))
      throw new Error("Injected write failure");
    return work();
  });
  await app.open();
  await app.dispatch(await command(app, f.ids));
  const before = await app.read();
  const pending = await command(app, f.ids);
  fail = true;
  await assert.rejects(
    () => app.dispatch(pending),
    (error: unknown) =>
      error instanceof Error &&
      error.cause instanceof Error &&
      error.cause.message === "Injected write failure",
  );
  assert.deepEqual(await app.read(), before);
  assert.equal(
    db.prepare("select count(*) as n from task_advance").get()?.n,
    0,
  );
  fail = false;
  assert.equal((await app.dispatch(pending)).kind, "committed");
  assert.equal(
    db.prepare("select count(*) as n from task_advance").get()?.n,
    1,
  );
});
test("lost COMMIT acknowledgement retries same envelope without second acceptance", async (t) => {
  const f = await fixture(t);
  let lose = false;
  const { app, db } = f.connect(async (sql, work) => {
    const result = await work();
    if (lose && sql === "COMMIT") {
      lose = false;
      throw new Error("COMMIT acknowledgement lost");
    }
    return result;
  });
  await app.open();
  await app.dispatch(await command(app, f.ids));
  const pending = await command(app, f.ids);
  lose = true;
  await assert.rejects(() => app.dispatch(pending), /acknowledgement/);
  assert.equal((await app.dispatch(pending)).kind, "committed");
  assert.equal(
    db.prepare("select count(*) as n from task_advance").get()?.n,
    1,
  );
});
test("reads share the command FIFO and cannot observe uncommitted state", async (t) => {
  const f = await fixture(t);
  let block = false;
  let enteredResolve: () => void = () => {};
  const entered = new Promise<void>((resolve) => {
    enteredResolve = resolve;
  });
  let releaseResolve: () => void = () => {};
  const release = new Promise<void>((resolve) => {
    releaseResolve = resolve;
  });
  const { app } = f.connect(async (sql, work) => {
    const result = await work();
    if (block && sql.startsWith('insert into "task_advance"')) {
      enteredResolve();
      await release;
    }
    return result;
  });
  await app.open();
  await app.dispatch(await command(app, f.ids));
  const pending = await command(app, f.ids);
  block = true;
  const dispatch = app.dispatch(pending);
  await entered;
  let readFinished = false;
  const read = app.read().then((value) => {
    readFinished = true;
    return value;
  });
  await Promise.resolve();
  assert.equal(readFinished, false);
  releaseResolve();
  await dispatch;
  const value = await read;
  assert.equal(value.kind, "teaching");
  if (value.kind === "teaching") assert.equal(value.turn.id, "child");
});
test("signed-64 counters round trip above JavaScript safe integer range and reject overflow", async (t) => {
  const f = await fixture(t);
  const { app, executor } = f.connect();
  await app.open();
  await executor.execute("UPDATE profile SET revision=?", [9007199254740993n]);
  const entry = await app.read();
  assert.equal(entry.kind, "entry");
  if (entry.kind === "entry")
    assert.equal(entry.profileRevision, "9007199254740993");
  const receipt = await app.dispatch(await command(app, f.ids));
  assert.equal(receipt.kind, "committed");
  if (receipt.kind === "committed")
    assert.equal(receipt.revision, "9007199254740994");
  await executor.execute("UPDATE session SET revision=?", [
    9223372036854775807n,
  ]);
  const pending = await command(app, f.ids);
  await assert.rejects(() => app.dispatch(pending), /counter/);
});
test("migration checksum mismatch becomes recovery without replacing data", async (t) => {
  const f = await fixture(t);
  const first = f.connect();
  await first.app.open();
  await first.executor.execute("UPDATE schema_migration SET checksum=?", [
    "0".repeat(64),
  ]);
  const reopened = f.connect();
  assert.equal((await reopened.app.open()).kind, "recovery");
  assert.equal(
    first.db.prepare("select count(*) as n from profile").get()?.n,
    1,
  );
});
test("a missing resume cursor cannot turn existing teaching into a new entry", async (t) => {
  const f = await fixture(t);
  const { app, executor } = f.connect();
  await app.open();
  await app.dispatch(await command(app, f.ids));
  await executor.execute("DELETE FROM course_cursor", []);
  assert.equal((await app.read()).kind, "recovery");
});
