import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { installationFixture } from "./installation-support.ts";
import { hash } from "./support.ts";
import { createPackageHolds } from "../../packages/storage/src/package-holds.ts";
import { readInstalledPackages } from "../../packages/storage/src/installed-packages.ts";
import { validateCatalogInventory } from "../../packages/storage/src/catalog-inventory.ts";
import { sqlValues } from "../../packages/storage/src/executor.ts";
import {
  parseHash,
  parseLessonFilesCommand,
  requireInstallationLease,
} from "../../packages/teaching/src/index.ts";

test("atomic snapshot holds pin both signed packages; sorted scopes revalidate, release and reject copied reservations", async (t) => {
  const f = await installationFixture(t, "completeLessons");
  const first = f.connect();
  await first.app.initialInstall(await f.command(first.app));
  await f.until(first.app, "activated");
  const b = await f.anotherRelease("fixture.release.held-b");
  const opened = f.connect(undefined, {
    publicationHash: b.target,
    releaseId: b.releaseId,
  });
  let page = await opened.app.readLessonFiles();
  if (page.offer.kind !== "available") throw new Error("Expected offer");
  const installationId = (await opened.app.readDirectory()).administration
    .installationId;
  const download = parseLessonFilesCommand({
    version: 1,
    family: "lesson-files",
    installationId,
    commandId: "held-download",
    expected: page.activation,
    action: { kind: "download", target: page.offer.target },
  });
  await opened.app.changeLessonFiles(download);
  for (let index = 0; index < 300; index++) {
    page = await opened.app.readLessonFiles();
    if (page.offer.kind === "ready") break;
    await setImmediate();
  }
  if (page.offer.kind !== "ready") throw new Error("Expected ready package");
  const db = drizzle((sql, parameters) =>
    opened.executor.execute(sql, sqlValues(parameters)),
  );
  let tail = Promise.resolve();
  function exclusive<T>(work: () => Promise<T>) {
    const result = tail.then(work);
    tail = result.then(
      () => {},
      () => {},
    );
    return result;
  }
  const holds = createPackageHolds({
    db,
    executor: opened.executor,
    hash,
    options: opened.installed,
    exclusive,
    validateRetained: async () => {
      await readInstalledPackages({ db, hash, installed: opened.installed });
      await validateCatalogInventory({ db, executor: opened.executor, hash });
    },
  });
  let captures = 0;
  const owner = {
    kind: "export" as const,
    operationId: "reserved-two-releases",
  };
  const held = await holds.reserveSnapshot(owner, async () => {
    captures++;
    assert.equal(
      f.contentLocked,
      captures !== 1,
      "Initial queue capture precedes hash locks; material revalidation holds them",
    );
    return {
      snapshot: opened.db
        .prepare(
          "SELECT package_hash,verified_manifest FROM installed_package ORDER BY package_hash",
        )
        .all(),
      packages: [
        parseHash({ kind: "package", value: b.target }),
        parseHash({ kind: "package", value: f.target }),
      ],
    };
  });
  assert.equal(captures, 1);
  assert.deepEqual(held.packages, [f.target, b.target].sort());
  const cancel = parseLessonFilesCommand({
    version: 1,
    family: "lesson-files",
    installationId,
    commandId: "held-cancel",
    expected: page.activation,
    action: { kind: "cancel", download: page.offer.receipt },
  });
  await opened.app.changeLessonFiles(cancel);
  f.setOffline(true);
  await f.connect().app.readDirectory();
  assert.equal(
    f.namespacePresent(b.target),
    true,
    "Snapshot hold retains inactive B after cancellation",
  );
  const materialKeys = await holds.withReservedMaterial(
    held,
    async (snapshot, materials, lease) => {
      requireInstallationLease(lease);
      assert.equal(f.contentLocked, true);
      assert.deepEqual(snapshot, held.snapshot);
      return materials.map((item) => item.teaching.key);
    },
  );
  assert.deepEqual(materialKeys, held.packages);
  assert.equal(captures, 2);
  await assert.rejects(
    holds.withReservedMaterial(Object.assign({}, held), async () => null),
    /owned snapshot/,
  );
  await holds.release(owner);
  await assert.rejects(
    holds.withReservedMaterial(held, async () => null),
    /owned snapshot/,
  );
  await f.connect().app.readDirectory();
  assert.equal(f.namespacePresent(b.target), false);
  assert.deepEqual(opened.db.prepare("PRAGMA foreign_key_check").all(), []);
});
