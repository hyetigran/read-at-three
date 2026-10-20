import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { readFile } from "node:fs/promises";
import { installationFixture } from "./installation-support.ts";

for (const fault of [
  "create",
  "normalization",
  "lastStatement",
  "beforeCommit",
  "afterCommit",
] as const) {
  test(`populated DB13 ${fault} migration14 fault conserves original v1 facts and normalizes a pre-install target once`, async (t) => {
    const f = await installationFixture(t, "completeLessons");
    const first = f.connect();
    f.setOffline(true);
    const command = await f.command(first.app);
    assert.equal(
      (await first.app.initialInstall(command)).fact.kind,
      "accepted",
    );
    for (let index = 0; index < 100; index++) {
      if (
        (await first.app.installations()).commands[0]?.availability.kind ===
        "stale"
      )
        break;
      await setImmediate();
    }
    await setImmediate();
    first.retire();
    const triggers = first.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name",
      )
      .all();
    assert.equal(triggers.length, 58);
    first.db.exec("BEGIN IMMEDIATE");
    for (const row of triggers) {
      if (
        typeof row.name !== "string" ||
        !/^retention_[a-z_]+_(insert|update)$/.test(row.name)
      )
        throw new Error("Unexpected fixture trigger");
      first.db.exec(`DROP TRIGGER "${row.name}"`);
    }
    first.db.exec("DROP VIEW package_retention");
    for (const table of [
      "lesson_files_command",
      "package_hold",
      "package_collection",
    ])
      first.db.exec(`DROP TABLE ${table}`);
    first.db.exec("DELETE FROM schema_migration WHERE version=14");
    first.db.exec("UPDATE installation SET database_version=13");
    first.db.exec("PRAGMA user_version=13");
    first.db.exec("COMMIT");
    const objects = first.db
      .prepare(
        "SELECT type,name,tbl_name,rootpage,sql FROM sqlite_master ORDER BY type,name",
      )
      .all();
    const names = first.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      )
      .all()
      .map((row) => {
        if (typeof row.name !== "string" || !/^[a-z_]+$/.test(row.name))
          throw new Error("Unexpected fixture table");
        return row.name;
      });
    const before = names.map((name) => ({
      name,
      rows: first.db.prepare(`SELECT * FROM ${name}`).all(),
    }));
    const facts = first.db.prepare("SELECT * FROM installation_command").all();
    const filename = first.db.prepare("PRAGMA database_list").get()?.file;
    if (typeof filename !== "string") throw new Error("Missing fixture file");
    first.db.close();
    const file = await readFile(filename);
    let injected = false;
    let opened: ReturnType<typeof f.connect> | undefined;
    opened = f.connect(async (sql, work) => {
      const selected =
        fault === "create"
          ? /^CREATE TABLE `lesson_files_command`/.test(sql)
          : fault === "normalization"
            ? /^INSERT INTO package_hold/.test(sql)
            : fault === "lastStatement"
              ? /^UPDATE installation SET database_version = 14/.test(sql)
              : sql === "COMMIT" &&
                opened?.db.prepare("PRAGMA user_version").get()
                  ?.user_version === 14;
      if (injected || !selected) return work();
      injected = true;
      if (fault === "afterCommit") await work();
      throw new Error("Injected migration14 boundary");
    });
    await assert.rejects(opened.app.installations(), /migration14 boundary/);
    assert.equal(injected, true);
    if (fault !== "afterCommit") {
      assert.deepEqual(
        opened.db
          .prepare(
            "SELECT type,name,tbl_name,rootpage,sql FROM sqlite_master ORDER BY type,name",
          )
          .all(),
        objects,
      );
      assert.deepEqual(
        names.map((name) => ({
          name,
          rows: opened.db.prepare(`SELECT * FROM ${name}`).all(),
        })),
        before,
      );
      assert.equal(
        opened.db.prepare("PRAGMA user_version").get()?.user_version,
        13,
      );
    }
    opened.db.close();
    if (fault !== "afterCommit")
      assert.deepEqual(await readFile(filename), file);
    const retry = f.connect();
    const catalog = await retry.app.installations();
    assert.deepEqual(
      retry.db.prepare("SELECT * FROM installation_command").all(),
      facts,
    );
    assert.deepEqual(catalog.commands[0]?.command, command);
    assert.equal(
      retry.db.prepare("PRAGMA user_version").get()?.user_version,
      14,
    );
    assert.equal(
      retry.db
        .prepare(
          "SELECT count(*) AS n FROM package_hold WHERE owner_kind='pendingCommand' AND package_hash=?",
        )
        .get(f.target)?.n,
      1,
    );
    assert.equal(
      retry.db.prepare("SELECT count(*) AS n FROM installed_package").get()?.n,
      0,
    );
    assert.deepEqual(retry.db.prepare("PRAGMA foreign_key_check").all(), []);
    assert.equal(f.downloads, 0);
  });
}
