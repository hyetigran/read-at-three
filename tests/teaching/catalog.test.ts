import assert from "node:assert/strict";
import { test } from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";
import { parseProjection } from "../../packages/teaching/src/index.ts";
import type {
  CatalogTask,
  CommittedProjection,
  Serialized,
} from "../../packages/teaching/src/index.ts";
import { validatorSchemas } from "../../packages/teaching/src/validator-schemas.ts";

const task = {
  id: "fixture.catalog.task",
  number: 6,
  title: { kind: "added", text: "Synthetic writing task" },
  optional: true,
  completed: false,
  available: true,
  packageHash: "a".repeat(64),
  savedSessionId: null,
} satisfies Serialized<CatalogTask>;
const projection = {
  kind: "entry",
  owner: { profileId: "fixture.catalog.profile", generation: "0" },
  packageHash: "a".repeat(64),
  title: { kind: "added", text: "Synthetic lesson" },
  profileRevision: "0",
  actions: [],
  catalog: [task],
} satisfies Serialized<CommittedProjection>;

test("strict catalog schema preserves legacy absence and accepts only optional uncompleted Skip", () => {
  const validate = new Ajv2020({ strict: true, allErrors: true }).compile<
    Serialized<CommittedProjection>
  >(validatorSchemas.validateProjection);
  for (const optional of [false, true]) {
    for (const completed of [false, true]) {
      const legacyTask = { ...task, optional, completed };
      const legacy = {
        ...projection,
        catalog: [legacyTask],
      };
      const bytes = JSON.stringify(legacy);
      assert.equal(validate(legacy), true);
      assert.equal(JSON.stringify(parseProjection(legacy)), bytes);
      assert.equal("skipped" in legacyTask, false);
    }
  }
  const skipped = {
    ...projection,
    catalog: [{ ...task, skipped: true }],
  } satisfies Serialized<CommittedProjection>;
  assert.equal(validate(skipped), true);
  assert.deepEqual(parseProjection(skipped), skipped);
  for (const invalid of [
    { ...task, completed: true, skipped: true },
    { ...task, optional: false, skipped: true },
    { ...task, skipped: false },
    { ...task, skipped: null },
    { ...task, skipped: "skipped" },
    { ...task, skipped: {} },
    { ...task, skipped: [] },
    { ...task, skipped: 0 },
    { ...task, unexpected: true },
    { ...task, skipped: true, unexpected: true },
  ]) {
    const value = { ...projection, catalog: [invalid] };
    assert.equal(validate(value), false, JSON.stringify(invalid));
    assert.throws(() => parseProjection(value), /Projection schema is invalid/);
  }
});
