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
  TeachingCommand,
} from "@readatthree/teaching";
import {
  createCommittedTeaching,
  TeachingRecoveryError,
} from "@readatthree/react-integration";
import { hash, storageFixture } from "../storage/support.ts";

test("actual Query publishes one coherent course and exact accepted terminal while the cursor has no eligible Resume", async (t) => {
  const content = await parseRuntimePackage(
    JSON.parse(
      await readFile("tests/fixtures/course-development-package.json", "utf8"),
    ),
    hash,
  );
  const f = await storageFixture(t, content);
  const { app } = f.connect();
  await app.open();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  let lose = false;
  const commands: TeachingCommand[] = [];
  const targets: CourseReadTarget[] = [];
  const runtime = createCommittedTeaching({
    queryClient,
    repository: {
      async read(target = { kind: "cursor" }) {
        targets.push(target);
        const application = await app.readApplication(target);
        if (application.kind === "recovery")
          throw new TeachingRecoveryError(application);
        return {
          courseId: application.courseId,
          projection: application.projection,
          application,
        };
      },
      async dispatch(command) {
        commands.push(command);
        const result = await app.dispatch(command);
        if (lose) {
          lose = false;
          throw new Error("Committed acknowledgement lost");
        }
        return result;
      },
      recoverTeaching: (input) => app.recoverTeaching(input),
    },
    stageRestore: async () => ({ activate() {} }),
  });
  t.after(() => {
    runtime.close();
    queryClient.clear();
    onlineManager.setOnline(true);
  });
  onlineManager.setOnline(false);
  await runtime.read({ expectation: { kind: "opening" } });
  async function prepare(kind: string, task?: number) {
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
      command: await prepareCommand({
        projection,
        request: { kind: "action", action },
        ids: f.ids,
        hash,
      }),
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
  await runtime.execute({ kind: "normal", prepared: terminal });
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
  assert.equal((await app.readApplication({ kind: "cursor" })).kind, "ready");
  const ordinary = await app.readApplication({ kind: "cursor" });
  assert.equal(
    ordinary.kind === "ready" ? ordinary.projection.kind : "recovery",
    "entry",
  );
  const deliveries = commands.filter(
    (command) => command.commandId === terminal.command.commandId,
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
