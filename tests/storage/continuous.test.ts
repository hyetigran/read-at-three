import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  canonical,
  parseDevelopmentPackage,
  parseTeachingState,
  prepareCommand,
} from "../../packages/teaching/src/index.ts";
import type {
  CommittedProjection,
  TeachingApplication,
  TeachingIntent,
} from "../../packages/teaching/src/index.ts";
import { continuousFixture } from "../teaching/continuous-fixture.ts";
import { createContinuousOralFixtureBody } from "../../tools/content/continuous.ts";
import { hash, storageFixture } from "./support.ts";
async function setup(t: Parameters<typeof storageFixture>[0]) {
  const continuous = await continuousFixture();
  return { ...(await storageFixture(t, continuous.content)), continuous };
}
async function start(input: {
  fixture: Awaited<ReturnType<typeof setup>>;
  app: TeachingApplication;
}) {
  await input.app.open();
  await input.fixture.act(
    input.app,
    "start",
    (action) =>
      "taskId" in action.intent &&
      action.intent.taskId === input.fixture.continuous.taskId,
  );
}
async function advance(input: {
  fixture: Awaited<ReturnType<typeof setup>>;
  app: TeachingApplication;
}) {
  const p = await input.app.read();
  if (p.kind !== "teaching") throw new Error("Expected continuous teaching");
  return input.fixture.act(
    input.app,
    p.actions.some((a) => a.intent.kind === "parentReady")
      ? "parentReady"
      : "continue",
  );
}
async function to(input: {
  fixture: Awaited<ReturnType<typeof setup>>;
  app: TeachingApplication;
  suffix: string;
}) {
  for (let count = 0; count < 15; count++) {
    const p = await input.app.read();
    if (p.kind === "teaching" && p.turn.id.endsWith(`.${input.suffix}`))
      return p;
    await advance(input);
  }
  throw new Error("Continuous destination missing");
}
async function command(input: {
  fixture: Awaited<ReturnType<typeof setup>>;
  app: TeachingApplication;
  kind: TeachingIntent["kind"];
}) {
  const p = await input.app.read();
  if (p.kind === "recovery") throw new Error("Unexpected recovery");
  const action = p.actions.find((action) => action.intent.kind === input.kind);
  if (!action) throw new Error("Continuous action missing");
  return prepareCommand({
    projection: p,
    request: { kind: "action", action },
    ids: input.fixture.ids,
    hash,
  });
}
function position(projection: CommittedProjection) {
  if (projection.kind !== "teaching")
    throw new Error("Continuous projection missing");
  return projection.turn.id.split(".").at(-1);
}
function count({
  db,
  table,
}: {
  db: ReturnType<Awaited<ReturnType<typeof setup>>["connect"]>["db"];
  table: "task_advance" | "task_credit" | "command_receipt";
}) {
  return db.prepare(`SELECT count(*) AS n FROM ${table}`).get()?.n;
}
function savedState(
  db: ReturnType<Awaited<ReturnType<typeof setup>>["connect"]>["db"],
) {
  return db
    .prepare("SELECT state FROM task_run ORDER BY run_id DESC LIMIT 1")
    .get()?.state;
}
test("real SQLite reopens instruction practice, Ready, independent test, every later-item restart boundary, Back and terminal after pruning receipts", async (t) => {
  const fixture = await setup(t);
  let connection = fixture.connect();
  await start({ fixture, app: connection.app });
  await to({ fixture, app: connection.app, suffix: "if-independent" });
  await fixture.act(connection.app, "help");
  await fixture.act(connection.app, "continue");
  const before = await connection.app.read();
  assert.equal(position(before), "together");
  await fixture.act(connection.app, "continue");
  assert.equal(position(await connection.app.read()), "together");
  connection.db.prepare("DELETE FROM command_receipt").run();
  let snapshot = await connection.app.read();
  connection = fixture.connect();
  assert.deepEqual(await connection.app.open(), snapshot);
  await fixture.act(connection.app, "pause");
  snapshot = await connection.app.read();
  connection = fixture.connect();
  assert.deepEqual(await connection.app.open(), snapshot);
  await fixture.act(connection.app, "resume");
  await fixture.act(connection.app, "parentReady");
  assert.equal(position(await connection.app.read()), "test");
  snapshot = await connection.app.read();
  connection = fixture.connect();
  assert.deepEqual(await connection.app.open(), snapshot);
  await fixture.act(connection.app, "continue");
  const replay = [];
  for (let index = 0; index < 7; index++) {
    const p = await connection.app.read();
    replay.push(position(p));
    snapshot = p;
    connection.db.prepare("DELETE FROM command_receipt").run();
    connection = fixture.connect();
    assert.deepEqual(await connection.app.open(), snapshot);
    await advance({ fixture, app: connection.app });
  }
  assert.deepEqual(replay, [
    "am-model",
    "am-together",
    "am-again",
    "am-independent",
    "if-together",
    "if-again",
    "if-independent",
  ]);
  assert.equal(position(await connection.app.read()), "in-together");
  await fixture.act(connection.app, "back");
  const acceptances = count({ db: connection.db, table: "task_advance" });
  await fixture.act(connection.app, "continue");
  assert.equal(
    count({ db: connection.db, table: "task_advance" }),
    acceptances,
  );
  await to({ fixture, app: connection.app, suffix: "in-independent" });
  await fixture.act(connection.app, "continue");
  assert.equal((await connection.app.read()).kind, "completed");
  assert.equal(count({ db: connection.db, table: "task_credit" }), 1);
  connection.db.prepare("DELETE FROM command_receipt").run();
  snapshot = await connection.app.read();
  connection = fixture.connect();
  assert.deepEqual(await connection.app.open(), snapshot);
  await fixture.act(connection.app, "back");
  await fixture.act(connection.app, "continue");
  assert.equal((await connection.app.read()).kind, "completed");
  assert.equal(count({ db: connection.db, table: "task_credit" }), 1);
});
for (const stage of ["instructionReady", "terminal"])
  for (const failure of ["write", "reply"])
    test(`${stage} ${failure} failure preserves atomic state and exact Retry converges once`, async (t) => {
      const fixture = await setup(t);
      let armed = false;
      const connection = fixture.connect({
        hook: async (sql, work) => {
          if (
            armed &&
            failure === "write" &&
            sql.includes('insert into "task_advance"')
          ) {
            armed = false;
            throw new Error("Injected continuous decision write failure");
          }
          const result = await work();
          if (armed && failure === "reply" && sql === "COMMIT") {
            armed = false;
            throw new Error("Lost continuous decision acknowledgement");
          }
          return result;
        },
      });
      await start({ fixture, app: connection.app });
      if (stage === "instructionReady") {
        await to({ fixture, app: connection.app, suffix: "if-independent" });
        await fixture.act(connection.app, "help");
        await fixture.act(connection.app, "continue");
      } else
        await to({ fixture, app: connection.app, suffix: "in-independent" });
      const before = await connection.app.read(),
        advances = Number(count({ db: connection.db, table: "task_advance" })),
        receipts = Number(
          count({ db: connection.db, table: "command_receipt" }),
        );
      const immutable = await command({
        fixture,
        app: connection.app,
        kind: stage === "instructionReady" ? "parentReady" : "continue",
      });
      const bytes = canonical(immutable),
        stateBefore = savedState(connection.db);
      armed = true;
      await assert.rejects(
        connection.app.dispatch(immutable),
        failure === "write" ? /Failed query/ : /Lost continuous/,
      );
      assert.equal(canonical(immutable), bytes);
      if (failure === "write") {
        assert.deepEqual(await connection.app.read(), before);
        assert.deepEqual(savedState(connection.db), stateBefore);
        assert.equal(
          Number(count({ db: connection.db, table: "task_advance" })),
          advances,
        );
        assert.equal(
          Number(count({ db: connection.db, table: "command_receipt" })),
          receipts,
        );
        assert.equal(count({ db: connection.db, table: "task_credit" }), 0);
      } else {
        assert.equal(
          Number(count({ db: connection.db, table: "task_advance" })),
          advances + 1,
        );
        assert.equal(
          Number(count({ db: connection.db, table: "command_receipt" })),
          receipts + 1,
        );
      }
      const receipt = await connection.app.dispatch(immutable);
      assert.equal(receipt.kind, "committed");
      assert.deepEqual(await connection.app.dispatch(immutable), receipt);
      assert.equal(
        Number(count({ db: connection.db, table: "task_advance" })),
        advances + 1,
      );
      assert.equal(
        Number(count({ db: connection.db, table: "command_receipt" })),
        receipts + 1,
      );
      const after = await connection.app.read();
      if (stage === "instructionReady") {
        assert.equal(position(after), "test");
        assert.equal(count({ db: connection.db, table: "task_credit" }), 0);
      } else {
        assert.equal(after.kind, "completed");
        assert.equal(count({ db: connection.db, table: "task_credit" }), 1);
      }
      const committedState = parseTeachingState(
        JSON.parse(String(savedState(connection.db))),
      );
      if (committedState.kind !== "graphControls")
        throw new Error("Continuous saved state missing");
      assert.deepEqual(
        committedState.cycleOutcomes.map((outcome) => outcome.kind),
        ["supported", "supported", "supported"],
      );
      connection.db.prepare("DELETE FROM command_receipt").run();
      assert.deepEqual(await fixture.connect().app.open(), after);
      const stale = await fixture.connect().app.dispatch(immutable);
      assert.equal(stale.kind, "rejected");
      assert.equal(
        Number(count({ db: connection.db, table: "task_advance" })),
        advances + 1,
      );
    });
async function oldContent() {
  return parseDevelopmentPackage(
    JSON.parse(
      await readFile("tests/fixtures/oral-development-package.json", "utf8"),
    ),
    hash,
  );
}
async function packageFor(
  body: ReturnType<typeof createContinuousOralFixtureBody>,
) {
  return parseDevelopmentPackage(
    { formatVersion: 1, body, packageHash: await hash(canonical(body)) },
    hash,
  );
}
function activation(
  db: ReturnType<Awaited<ReturnType<typeof setup>>["connect"]>["db"],
) {
  return {
    ...db
      .prepare(
        "SELECT active_package_hash,fallback_package_hash,revision FROM course_activation",
      )
      .get(),
  };
}
test("strict oral expansion activates once, retains exact old blobs and pins, and describes unchanged complete oral runs truthfully", async (t) => {
  const old = await oldContent(),
    continuous = await continuousFixture();
  const fixture = await storageFixture(t, old);
  const first = fixture.connect();
  await first.app.open();
  await fixture.act(
    first.app,
    "start",
    (action) =>
      "taskId" in action.intent &&
      action.intent.taskId === "fixture.graph.l01.t02",
  );
  await fixture.act(first.app, "continue");
  const before = await first.app.read();
  const run = first.db.prepare("SELECT * FROM task_run").all();
  const blob = first.db
    .prepare(
      "SELECT verified_manifest FROM installed_package WHERE package_hash=?",
    )
    .get(old.packageHash)?.verified_manifest;
  const expanded = fixture.connect({ content: continuous.content });
  const p = await expanded.app.open();
  assert.equal(p.kind, "teaching");
  if (p.kind !== "teaching" || before.kind !== "teaching")
    throw new Error("Old pinned turn missing");
  assert.equal(p.packageHash, old.packageHash);
  assert.deepEqual(p.turn, before.turn);
  assert.deepEqual(first.db.prepare("SELECT * FROM task_run").all(), run);
  assert.deepEqual(
    p.actions
      .filter((a) => a.intent.kind === "restart")
      .map((a) => a.label.text),
    ["Restart task"],
  );
  assert.equal(p.catalog.filter((task) => task.available).length, 5);
  assert.deepEqual(activation(first.db), {
    active_package_hash: continuous.content.packageHash,
    fallback_package_hash: old.packageHash,
    revision: 1,
  });
  assert.deepEqual(
    first.db
      .prepare(
        "SELECT verified_manifest FROM installed_package WHERE package_hash=?",
      )
      .get(old.packageHash)?.verified_manifest,
    blob,
  );
  assert.deepEqual(
    await fixture.connect({ content: continuous.content }).app.open(),
    p,
  );
  assert.deepEqual(activation(first.db), {
    active_package_hash: continuous.content.packageHash,
    fallback_package_hash: old.packageHash,
    revision: 1,
  });
  await fixture.connect({ content: old }).app.open();
  assert.equal(
    activation(first.db)?.active_package_hash,
    continuous.content.packageHash,
  );
  await fixture.act(
    expanded.app,
    "start",
    (action) =>
      "taskId" in action.intent && action.intent.taskId === continuous.taskId,
  );
  const next = await expanded.app.read();
  assert.equal(next.kind, "teaching");
  if (next.kind !== "teaching") throw new Error("New task missing");
  assert.equal(next.packageHash, continuous.content.packageHash);
  assert.equal(position(next), "am-model");
  assert.equal(
    first.db
      .prepare("SELECT count(*) AS n FROM task_run WHERE package_hash=?")
      .get(old.packageHash)?.n,
    1,
  );
  assert.equal(
    first.db
      .prepare("SELECT count(*) AS n FROM task_run WHERE package_hash=?")
      .get(continuous.content.packageHash)?.n,
    1,
  );
});
test("equal, reordered, changed and shrinking oral packages cannot replace activation", async (t) => {
  const old = await oldContent(),
    body = createContinuousOralFixtureBody();
  const variants = [
    {
      ...body,
      tasks: body.tasks.filter((entry) => entry.task.number !== 3),
      releaseId: "fixture.equal",
    },
    {
      ...body,
      tasks: [...body.tasks].reverse(),
      releaseId: "fixture.reordered",
    },
    {
      ...body,
      tasks: body.tasks.map((entry) =>
        entry.task.number === 2 && entry.kind === "graphControls"
          ? {
              ...entry,
              task: {
                ...entry.task,
                nodes: entry.task.nodes.map((node, index) =>
                  index === 0
                    ? {
                        ...node,
                        guidance: [
                          {
                            kind: "speech",
                            copy: {
                              kind: "added",
                              text: "Synthetic changed model.",
                            },
                          },
                        ],
                      }
                    : node,
                ),
              },
            }
          : entry,
      ),
      releaseId: "fixture.changed",
    } satisfies typeof body,
    {
      ...body,
      title: { kind: "added", text: "Synthetic changed lesson title." },
      releaseId: "fixture.title",
    } satisfies typeof body,
  ];
  for (const variant of variants) {
    const fixture = await storageFixture(t, old),
      first = fixture.connect();
    await first.app.open();
    const candidate = await packageFor(variant);
    await fixture.connect({ content: candidate }).app.open();
    assert.deepEqual(activation(first.db), {
      active_package_hash: old.packageHash,
      fallback_package_hash: null,
      revision: 0,
    });
  }
  const fixture = await setup(t),
    first = fixture.connect();
  await first.app.open();
  await fixture.connect({ content: old }).app.open();
  assert.equal(
    activation(first.db)?.active_package_hash,
    fixture.content.packageHash,
  );
  assert.equal(activation(first.db)?.revision, 0);
});
for (const point of ["update", "commit", "reply"])
  test(`oral activation ${point} interruption rolls back or converges without duplicate activation`, async (t) => {
    const old = await oldContent(),
      continuous = await continuousFixture(),
      fixture = await storageFixture(t, old),
      first = fixture.connect();
    await first.app.open();
    let armed = true;
    const broken = fixture.connect({
      content: continuous.content,
      hook: async (sql, work) => {
        if (
          armed &&
          ((point === "update" &&
            sql.startsWith('update "course_activation"')) ||
            (point === "commit" && sql === "COMMIT"))
        ) {
          armed = false;
          throw new Error("Injected activation interruption");
        }
        const result = await work();
        if (armed && point === "reply" && sql === "COMMIT") {
          armed = false;
          throw new Error("Lost activation acknowledgement");
        }
        return result;
      },
    });
    assert.equal((await broken.app.open()).kind, "recovery");
    if (point !== "reply") {
      assert.deepEqual(activation(first.db), {
        active_package_hash: old.packageHash,
        fallback_package_hash: null,
        revision: 0,
      });
      assert.equal(
        first.db.prepare("SELECT count(*) AS n FROM installed_package").get()
          ?.n,
        1,
      );
    }
    await fixture.connect({ content: continuous.content }).app.open();
    assert.deepEqual(activation(first.db), {
      active_package_hash: continuous.content.packageHash,
      fallback_package_hash: old.packageHash,
      revision: 1,
    });
    await fixture.connect({ content: continuous.content }).app.open();
    assert.equal(activation(first.db)?.revision, 1);
    assert.equal(
      first.db.prepare("SELECT count(*) AS n FROM installed_package").get()?.n,
      2,
    );
  });
