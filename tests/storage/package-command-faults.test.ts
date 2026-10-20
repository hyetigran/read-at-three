import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { installationFixture } from "./installation-support.ts";
import { parseLessonFilesCommand } from "../../packages/teaching/src/index.ts";
import type {
  LessonFilesApplication,
  LessonFilesCommand,
  LessonFilesReceipt,
} from "../../packages/teaching/src/index.ts";

async function settled(
  app: LessonFilesApplication,
  command: LessonFilesCommand,
  predicate: (receipt: LessonFilesReceipt, retryable: boolean) => boolean,
) {
  for (let index = 0; index < 400; index++) {
    const saved = (await app.readLessonFiles()).commands.find(
      (item) => item.command.commandId === command.commandId,
    );
    if (
      saved &&
      predicate(saved.receipt, saved.observation.kind === "retryable")
    )
      return saved;
    await setImmediate();
  }
  throw new Error("Catalog continuation did not settle");
}
for (const stage of ["accepted", "ready", "activated", "cancelled"] as const) {
  for (const boundary of ["before", "after"] as const) {
    test(`${boundary} ${stage} COMMIT exact Retry recovers one durable command without rewriting initial facts`, async (t) => {
      const f = await installationFixture(t, "completeLessons");
      const first = f.connect();
      await first.app.initialInstall(await f.command(first.app));
      await f.until(first.app, "activated");
      const initialFacts = first.db
        .prepare("SELECT * FROM installation_command")
        .all();
      const b = await f.anotherRelease(`fixture.release.${stage}-${boundary}`);
      const offer = { publicationHash: b.target, releaseId: b.releaseId };
      let armed = false,
        injected = false;
      let connection: ReturnType<typeof f.connect> | undefined;
      let command: LessonFilesCommand | undefined;
      connection = f.connect(async (sql, work) => {
        if (sql !== "COMMIT" || !armed || injected || !connection || !command)
          return work();
        const row = connection.db
          .prepare("SELECT stage FROM lesson_files_command WHERE command_id=?")
          .get(command.commandId);
        if (row?.stage !== stage) return work();
        injected = true;
        if (boundary === "after") await work();
        throw new Error(`Injected ${boundary} ${stage} COMMIT`);
      }, offer);
      let page = await connection.app.readLessonFiles();
      if (page.offer.kind !== "available")
        throw new Error("Expected update offer");
      const installationId = (await connection.app.readDirectory())
        .administration.installationId;
      const download = parseLessonFilesCommand({
        version: 1,
        family: "lesson-files",
        installationId,
        commandId: "fault-download",
        expected: page.activation,
        action: { kind: "download", target: page.offer.target },
      });
      if (stage === "activated" || stage === "cancelled") {
        await connection.app.changeLessonFiles(download);
        await settled(
          connection.app,
          download,
          (receipt) => receipt.kind === "ready",
        );
        page = await connection.app.readLessonFiles();
        if (page.offer.kind !== "ready")
          throw new Error("Expected Ready download");
        command = parseLessonFilesCommand({
          version: 1,
          family: "lesson-files",
          installationId,
          commandId: `fault-${stage}`,
          expected: page.activation,
          action:
            stage === "activated"
              ? {
                  kind: "use",
                  target: page.offer.target,
                  ready: page.offer.receipt,
                }
              : { kind: "cancel", download: page.offer.receipt },
        });
      } else command = download;
      armed = true;
      if (stage === "accepted" || stage === "cancelled")
        await assert.rejects(
          connection.app.changeLessonFiles(command),
          /Injected/,
        );
      else {
        assert.equal(
          (await connection.app.changeLessonFiles(command)).kind,
          "accepted",
        );
        await settled(
          connection.app,
          command,
          (_receipt, retryable) => retryable,
        );
      }
      assert.equal(injected, true);
      const row = connection.db
        .prepare(
          "SELECT stage,result,command FROM lesson_files_command WHERE command_id=?",
        )
        .get(command.commandId);
      if (boundary === "before")
        assert.equal(
          row?.stage,
          stage === "accepted" || stage === "cancelled"
            ? undefined
            : "accepted",
        );
      else assert.equal(row?.stage, stage);
      assert.deepEqual(
        connection.db.prepare("SELECT * FROM installation_command").all(),
        initialFacts,
      );
      const acquisitions = f.acquisitions,
        downloads = f.downloads;
      f.setOffline(true);
      const cold = f.connect(undefined, offer);
      const recovered = await cold.app.readLessonFiles();
      assert.equal(
        f.acquisitions,
        acquisitions,
        "Cold reconciliation never acquires envelopes",
      );
      assert.equal(
        f.downloads,
        downloads,
        "Cold reconciliation never downloads resources",
      );
      const saved = recovered.commands.find(
        (item) => item.command.commandId === command?.commandId,
      );
      if (saved)
        assert.deepEqual(
          saved.command,
          command,
          "Cold projection retains the original activation witness and full command",
        );
      f.setOffline(false);
      const retried = await cold.app.changeLessonFiles(
        saved?.command ?? command,
      );
      if (stage === "accepted")
        await settled(cold.app, command, (receipt) => receipt.kind === "ready");
      else if (stage === "cancelled") assert.equal(retried.kind, "cancelled");
      else assert.equal(retried.kind, stage);
      const activation = cold.db
        .prepare("SELECT active_package_hash,revision FROM course_activation")
        .get();
      assert.equal(
        activation?.active_package_hash,
        stage === "activated" ? b.target : f.target,
      );
      assert.equal(activation?.revision, stage === "activated" ? 1 : 0);
      assert.equal(
        cold.db
          .prepare(
            "SELECT count(*) AS n FROM lesson_files_command WHERE command_id=?",
          )
          .get(command.commandId)?.n,
        1,
      );
      assert.deepEqual(
        cold.db.prepare("SELECT * FROM installation_command").all(),
        initialFacts,
      );
      if (stage !== "accepted") {
        assert.equal(f.acquisitions, acquisitions);
        assert.equal(f.downloads, downloads);
      }
      assert.deepEqual(cold.db.prepare("PRAGMA foreign_key_check").all(), []);
    });
  }
}
