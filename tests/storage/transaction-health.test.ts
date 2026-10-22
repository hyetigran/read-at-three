import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { transaction } from "../../packages/storage/src/migration.ts";
import { executorFor } from "./support.ts";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createSqlExecutor,
  SqlConnectionRetiredError,
} from "../../packages/storage/src/index.ts";

test("an unresolved rollback cannot expose unacknowledged rows through the executor", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE work(id INTEGER PRIMARY KEY, value TEXT NOT NULL)");
  db.exec("INSERT INTO work VALUES(1,'acknowledged')");
  const statements: string[] = [];
  const executor = executorFor(db, async (sql, work) => {
    statements.push(sql);
    if (sql === "COMMIT" || sql === "ROLLBACK")
      throw new Error("Controlled driver failure");
    return work();
  });
  try {
    await assert.rejects(
      transaction(executor, async () => {
        await executor.execute(
          "INSERT INTO work VALUES(2,'unacknowledged')",
          [],
        );
      }),
    );
    const reached = statements.length;
    await assert.rejects(executor.execute("SELECT * FROM work", []));
    assert.equal(statements.length, reached);
  } finally {
    if (db.isOpen) db.close();
  }
});

for (const cut of [
  "begin-before",
  "begin-after",
  "commit-before",
  "commit-after",
  "rollback-before",
  "rollback-after",
  "health-unknown",
  "health-throws",
  "false-commit-success",
  "engine-rollback",
] as const) {
  test(`actual SQLite ${cut} preserves acknowledged cells and exact retry`, async (t) => {
    const directory = await mkdtemp(
      join(tmpdir(), "reading-transaction-health-"),
    );
    const path = join(directory, "reading.sqlite");
    const db = new DatabaseSync(path);
    t.after(async () => {
      if (db.isOpen) db.close();
      await rm(directory, { recursive: true, force: true });
    });
    db.exec(
      "PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; CREATE TABLE work(id TEXT PRIMARY KEY, counter INTEGER, payload BLOB, absent TEXT, fraction REAL)",
    );
    db.prepare("INSERT INTO work VALUES(?,?,?,?,?)").run(
      "acknowledged",
      9007199254740993n,
      new Uint8Array([0, 255, 17]),
      null,
      0.125,
    );
    const baseline = () => {
      const statement = db.prepare("SELECT * FROM work ORDER BY id");
      statement.setReadBigInts(true);
      return statement.all();
    };
    const before = baseline();
    let failed = false;
    let closeCalls = 0;
    const statements: string[] = [];
    const original = new Error("Controlled driver boundary");
    const raw = executorFor(db);
    const executor = createSqlExecutor({
      transactionState() {
        if (failed && cut === "health-unknown") return "unknown";
        if (failed && cut === "health-throws")
          throw new Error("Unavailable native inspection");
        return db.isTransaction ? "active" : "idle";
      },
      close() {
        closeCalls++;
        db.close();
      },
      async execute(sql, parameters) {
        statements.push(sql);
        if (sql === "BEGIN IMMEDIATE" && cut.startsWith("begin-")) {
          if (cut === "begin-after") await raw.execute(sql, parameters);
          failed = true;
          throw original;
        }
        if (sql === "COMMIT" && cut !== "engine-rollback") {
          if (cut === "commit-after") await raw.execute(sql, parameters);
          if (cut === "false-commit-success") return { rows: [] };
          failed = true;
          throw original;
        }
        if (sql === "ROLLBACK" && cut.startsWith("rollback-")) {
          if (cut === "rollback-after") await raw.execute(sql, parameters);
          throw original;
        }
        return raw.execute(sql, parameters);
      },
    });
    const work = async () => {
      await executor.execute("INSERT INTO work VALUES(?,?,?,?,?)", [
        "same-command",
        4n,
        new Uint8Array([9, 8]),
        null,
        0.25,
      ]);
      if (cut === "engine-rollback")
        await executor.execute("INSERT OR ROLLBACK INTO work(id) VALUES(?)", [
          "acknowledged",
        ]);
    };
    const terminal = [
      "rollback-before",
      "health-unknown",
      "health-throws",
      "false-commit-success",
    ].includes(cut);
    await assert.rejects(
      transaction(executor, work),
      terminal
        ? SqlConnectionRetiredError
        : cut === "engine-rollback"
          ? /UNIQUE/
          : (error) => error === original,
    );
    assert.equal(executor.retired, terminal);
    assert.equal(closeCalls, terminal ? 1 : 0);
    if (terminal) {
      const count = statements.length;
      await assert.rejects(
        executor.execute("SELECT * FROM work", []),
        SqlConnectionRetiredError,
      );
      await assert.rejects(
        transaction(executor, work),
        SqlConnectionRetiredError,
      );
      assert.equal(statements.length, count);
    } else {
      assert.equal(db.isTransaction, false);
      const committed = cut === "commit-after";
      assert.deepEqual(
        baseline().filter((row) => row.id === "acknowledged"),
        before,
      );
      assert.equal(
        baseline().filter((row) => row.id === "same-command").length,
        committed ? 1 : 0,
      );
      if (committed || cut === "engine-rollback")
        assert.equal(statements.includes("ROLLBACK"), false);
      db.close();
    }
    const reopened = new DatabaseSync(path);
    try {
      const restored = reopened.prepare(
        "SELECT * FROM work WHERE id='acknowledged'",
      );
      restored.setReadBigInts(true);
      assert.deepEqual(restored.all(), before);
      const replacement = executorFor(reopened);
      let receipts = 0;
      const retry = () =>
        transaction(replacement, async () => {
          const existing = await replacement.execute(
            "SELECT id FROM work WHERE id=?",
            ["same-command"],
          );
          if (!existing.rows.length) {
            await replacement.execute("INSERT INTO work VALUES(?,?,?,?,?)", [
              "same-command",
              4n,
              new Uint8Array([9, 8]),
              null,
              0.25,
            ]);
            receipts++;
          }
          return "same-command";
        });
      assert.equal(await retry(), "same-command");
      assert.equal(await retry(), "same-command");
      assert.equal(receipts, cut === "commit-after" ? 0 : 1);
      assert.equal(
        reopened.prepare("SELECT count(*) AS n FROM work").get()?.n,
        2,
      );
      const after = reopened.prepare(
        "SELECT * FROM work WHERE id='acknowledged'",
      );
      after.setReadBigInts(true);
      assert.deepEqual(after.all(), before);
    } finally {
      reopened.close();
    }
  });
}

test("failed handle close cannot reopen a retired executor", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE work(id INTEGER PRIMARY KEY)");
  let statements = 0;
  const raw = executorFor(db);
  const executor = createSqlExecutor({
    transactionState: () => (db.isTransaction ? "active" : "idle"),
    close() {
      throw new Error("Synthetic handle close failure");
    },
    async execute(sql, parameters) {
      statements++;
      if (sql === "COMMIT" || sql === "ROLLBACK")
        throw new Error("Controlled driver failure");
      return raw.execute(sql, parameters);
    },
  });
  try {
    await assert.rejects(
      transaction(executor, () =>
        executor.execute("INSERT INTO work VALUES(1)", []),
      ),
      SqlConnectionRetiredError,
    );
    assert.equal(db.isTransaction, true);
    const reached = statements;
    await assert.rejects(
      executor.execute("SELECT * FROM work", []),
      SqlConnectionRetiredError,
    );
    assert.equal(statements, reached);
    assert.equal(executor.retired, true);
  } finally {
    db.close();
  }
});

for (const initial of ["active", "unknown"] as const) {
  test(`unexpected initial ${initial} state never enters work or SQL`, async () => {
    let sql = 0,
      work = 0,
      closed = 0;
    const executor = createSqlExecutor({
      transactionState: () => initial,
      close() {
        closed++;
      },
      async execute() {
        sql++;
        return { rows: [] };
      },
    });
    await assert.rejects(
      transaction(executor, async () => {
        work++;
      }),
      SqlConnectionRetiredError,
    );
    await assert.rejects(
      executor.execute("SELECT 1", []),
      SqlConnectionRetiredError,
    );
    assert.deepEqual({ sql, work, closed }, { sql: 0, work: 0, closed: 1 });
  });
}

test("the final lifetime guard runs immediately before native COMMIT", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE work(id INTEGER)");
  let current = true,
    checks = 0;
  const commits: boolean[] = [];
  const raw = executorFor(db);
  const executor = createSqlExecutor({
    transactionState: () => (db.isTransaction ? "active" : "idle"),
    close: () => db.close(),
    async execute(sql, parameters) {
      if (sql === "COMMIT") commits.push(current);
      return raw.execute(sql, parameters);
    },
  });
  try {
    await transaction(
      executor,
      () => executor.execute("INSERT INTO work VALUES(1)", []),
      () => {
        if (!current) throw new Error("Lifetime retired");
        checks++;
        if (checks === 3)
          queueMicrotask(() => {
            current = false;
          });
      },
    );
    assert.deepEqual(commits, [true]);
    assert.equal(checks, 3);
    assert.equal(db.prepare("SELECT count(*) AS n FROM work").get()?.n, 1);
  } finally {
    db.close();
  }
});

test("lifetime retirement while work settles rolls back before COMMIT", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE work(id INTEGER)");
  let current = true;
  const statements: string[] = [];
  const executor = executorFor(db, async (sql, work) => {
    statements.push(sql);
    return work();
  });
  try {
    await assert.rejects(
      transaction(
        executor,
        async () => {
          await executor.execute("INSERT INTO work VALUES(1)", []);
          queueMicrotask(() => {
            current = false;
          });
        },
        () => {
          if (!current) throw new Error("Lifetime retired");
        },
      ),
      /Lifetime retired/,
    );
    assert.equal(statements.includes("COMMIT"), false);
    assert.equal(statements.at(-1), "ROLLBACK");
    assert.equal(db.prepare("SELECT count(*) AS n FROM work").get()?.n, 0);
    assert.equal(executor.retired, false);
  } finally {
    db.close();
  }
});
