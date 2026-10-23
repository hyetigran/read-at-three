import assert from "node:assert/strict";
import { test } from "node:test";
import { databaseSnapshot, storageFixture } from "./support.ts";
import { selectedProjection } from "./selected-support.ts";

for (const cut of ["create", "version", "commit", "acknowledgement"] as const) {
  test(`populated database14 cleanup migration preserves saved work at ${cut}`, async (t) => {
    const f = await storageFixture(t);
    const first = await f.connectReady();
    await f.act(first.app, "start");
    await f.act(first.app, "continue");
    const projection = await selectedProjection(first.app);
    first.db.exec("BEGIN IMMEDIATE");
    for (const table of [
      "removed_drawing",
      "storage_cleanup_receipt",
      "storage_cleanup_state",
    ])
      first.db.exec(`DROP TABLE ${table}`);
    first.db.exec("DELETE FROM schema_migration WHERE version=15");
    first.db.exec("UPDATE installation SET database_version=14");
    first.db.exec("PRAGMA user_version=14");
    first.db.exec("COMMIT");
    const before = await databaseSnapshot(first.db);
    first.db.close();
    let injected = false;
    const broken = f.connect({
      hook: async (sql, work) => {
        const target =
          cut === "create"
            ? /^CREATE TABLE `removed_drawing`/.test(sql)
            : cut === "version"
              ? /^UPDATE installation SET database_version = 15/.test(sql)
              : sql === "COMMIT";
        if (injected || !target) return work();
        injected = true;
        if (cut === "acknowledgement") await work();
        throw new Error("Cleanup migration interrupted");
      },
    });
    await assert.rejects(
      broken.app.readDirectory(),
      /Cleanup migration interrupted/,
    );
    assert.equal(injected, true);
    if (cut !== "acknowledgement")
      assert.deepEqual(await databaseSnapshot(broken.db), before);
    broken.db.close();
    const retry = f.connect();
    assert.deepEqual(await selectedProjection(retry.app), projection);
    assert.equal(
      retry.db.prepare("PRAGMA user_version").get()?.user_version,
      15,
    );
    assert.deepEqual(retry.db.prepare("PRAGMA foreign_key_check").all(), []);
    assert.equal(
      retry.db
        .prepare("SELECT count(*) AS n FROM schema_migration WHERE version=15")
        .get()?.n,
      1,
    );
  });
}
