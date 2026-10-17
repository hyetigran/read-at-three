import { readEnvelope } from "./support.ts";
import {
  executeTeaching,
  selectedCourse,
  selectedProjection,
} from "../storage/selected-support.ts";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { QueryClient, onlineManager } from "@tanstack/react-query";
import {
  canonical,
  parseRuntimePackage,
  prepareCommand,
} from "@readatthree/teaching";
import type {
  AvailableAction,
  CourseReadTarget,
  SelectedTeachingOperation,
} from "@readatthree/teaching";
import {
  createCommittedTeaching,
  TeachingRecoveryError,
} from "@readatthree/react-integration";
import { hash, storageFixture } from "../storage/support.ts";

for (const retry of ["normal", "closedRecovery"]) {
  test(`actual Query publishes one coherent course and exact accepted terminal while the cursor has no eligible Resume${retry === "closedRecovery" ? " after closed recovery" : ""}`, async (t) => {
    const content = await parseRuntimePackage(
      JSON.parse(
        await readFile(
          "tests/fixtures/course-development-package.json",
          "utf8",
        ),
      ),
      hash,
    );
    const f = await storageFixture(t, content);
    let { app } = await f.connectReady();
    await selectedProjection(app);
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { retry: false, gcTime: Infinity },
      },
    });
    let lose = false;
    const commands: SelectedTeachingOperation[] = [];
    const targets: CourseReadTarget[] = [];
    const runtime = createCommittedTeaching({
      queryClient,
      repository: {
        async read(input) {
          const target = input.target;
          targets.push(target);
          const envelope = await readEnvelope(
            app,
            input,
            content.body.courseId,
          );
          const application = envelope.application;
          if (!application) throw new Error("Application required");
          return {
            directory: envelope.directory,
            courseId: application.courseId,
            projection: application.projection,
            application,
          };
        },
        async execute(operation) {
          const command = operation;
          commands.push(command);
          const result = await app.execute(operation);
          if (lose) {
            lose = false;
            throw new Error("Committed acknowledgement lost");
          }
          return result;
        },
        async recoverTeaching(input) {
          commands.push(input.operation);
          return app.recoverTeaching(input);
        },
      },
      stageRestore: async () => ({ activate() {} }),
    });
    t.after(() => {
      runtime.close();
      queryClient.clear();
      onlineManager.setOnline(true);
    });
    onlineManager.setOnline(false);
    await runtime.read({
      expectation: {
        kind: "opening",
        selection: (await app.readDirectory()).selection,
      },
    });
    async function prepare(
      kind: string,
      task?: number,
    ): Promise<import("@readatthree/react-integration").PreparedAction> {
      const projection = runtime.current()?.projection;
      if (!projection || projection.kind === "recovery")
        throw new Error("Missing projection");
      const action = projection.actions.find(
        (action: AvailableAction) =>
          action.intent.kind === kind &&
          (!task ||
            ("taskId" in action.intent &&
              action.intent.taskId ===
                runtime
                  .current()
                  ?.application?.course.lessons[0]?.tasks.find(
                    (entry) => entry.number === task,
                  )?.id)),
      );
      assert.ok(action, `Missing ${kind}`);
      return {
        origin: projection,
        operation: {
          kind: "teaching",
          selection: (await app.readDirectory()).selection,
          command: await prepareCommand({
            projection,
            request: { kind: "action", action },
            ids: f.ids,
            hash,
          }),
        },
      };
    }
    async function act(kind: string, task?: number) {
      const prepared = await prepare(kind, task);
      await runtime.execute({ kind: "normal", prepared });
    }
    await act("start", 1);
    await act("continue");
    await act("pause");
    await act("start", 4);
    await act("continue");
    await act("continue");
    await act("start", 2);
    await act("pause");
    await act("resume", 1);
    for (let index = 0; index < 4; index++) await act("continue");
    const terminal = await prepare("continue");
    lose = true;
    await assert.rejects(
      runtime.execute({ kind: "normal", prepared: terminal }),
      /acknowledgement lost/,
    );
    const before = runtime.current();
    assert.notEqual(before?.projection.kind, "completed");
    if (retry === "normal") {
      await runtime.execute({ kind: "normal", prepared: terminal });
    } else {
      runtime.connectionLost();
      ({ app } = await f.connectReady());
      const inventory = await app.openRecovery({
        kind: "warm",
        retainedStrokeIds: [],
        selection: terminal.operation.selection,
        teaching: terminal.operation,
        administration: null,
      });
      const recovered = await runtime.execute({
        kind: "closedRecovery",
        recoveryId: inventory.recoveryId,
        prepared: terminal,
      });
      if (
        recovered.kind !== "resolved" ||
        recovered.result.kind !== "committed"
      )
        throw new Error("Committed terminal recovery required");
      await app.reconcileRecovery({
        recoveryId: inventory.recoveryId,
        choice: { kind: "warm", settledStrokeIds: [] },
      });
      const projection = await selectedProjection(app);
      assert.equal(projection.kind, "entry");
      await runtime.read({
        expectation: {
          kind: "receipt",
          courseId: content.body.courseId,
          prepared: terminal,
          receipt: recovered.result,
          restoreBinding: { kind: "reconciled", projection },
        },
      });
    }
    const visible = runtime.current();
    assert.equal(visible?.projection.kind, "completed");
    assert.equal(visible?.application?.course.resume.kind, "none");
    assert.equal(
      visible?.application?.course.lessons[0]?.tasks[0]?.outcome,
      "completed",
    );
    assert.equal(
      visible?.application?.course.lessons[0]?.tasks[1]?.unfinished.length,
      1,
    );
    assert.equal((await selectedCourse(app, { kind: "cursor" })).kind, "ready");
    const ordinary = await selectedCourse(app, { kind: "cursor" });
    assert.equal(
      ordinary.kind === "ready" ? ordinary.projection.kind : "recovery",
      "entry",
    );
    const deliveries = commands.filter(
      (command) =>
        command.command.commandId === terminal.operation.command.commandId,
    );
    assert.equal(deliveries.length, 2);
    assert.equal(canonical(deliveries[0]), canonical(deliveries[1]));
    assert.equal(targets.at(-1)?.kind, "accepted");
    const selected = queryClient
      .getQueryCache()
      .getAll()
      .find(
        (query) =>
          query.queryKey[0] === "teaching" && query.state.data === visible,
      );
    assert.ok(selected);
    assert.ok(selected.queryKey.includes(content.packageHash));
  });
}
