import assert from "node:assert/strict";
import { test } from "node:test";
import { reduceChildContact } from "../../apps/web/src/features/teaching/child-contact.ts";
import type { ChildContact } from "../../apps/web/src/features/teaching/child-contact.ts";

test("child feedback has one physical owner and stale movement cannot revive retired contact", () => {
  let state: ChildContact = { kind: "idle", generation: 0 };
  state = reduceChildContact(state, {
    kind: "begin",
    contact: { kind: "pointer", generation: 0, id: 7, x: 20, y: 20 },
  });
  assert.deepEqual(state, {
    kind: "pointer",
    generation: 0,
    id: 7,
    x: 20,
    y: 20,
  });
  const owned = state;
  assert.deepEqual(
    reduceChildContact(state, {
      kind: "begin",
      contact: { kind: "pointer", generation: 0, id: 8, x: 20, y: 20 },
    }),
    owned,
  );
  assert.deepEqual(
    reduceChildContact(state, {
      kind: "move",
      generation: 0,
      id: 8,
      x: 155,
      y: 43,
    }),
    owned,
  );
  state = reduceChildContact(state, {
    kind: "move",
    generation: 0,
    id: 7,
    x: 155,
    y: 43,
  });
  assert.deepEqual(state, {
    kind: "pointer",
    generation: 0,
    id: 7,
    x: 155,
    y: 43,
  });
  state = reduceChildContact(state, { kind: "retire" });
  assert.deepEqual(state, { kind: "idle", generation: 1 });
  assert.deepEqual(
    reduceChildContact(state, {
      kind: "move",
      generation: 0,
      id: 7,
      x: 155,
      y: 43,
    }),
    state,
  );
  assert.deepEqual(
    reduceChildContact(state, {
      kind: "begin",
      contact: { kind: "pointer", generation: 0, id: 7, x: 20, y: 20 },
    }),
    state,
  );
});

test("keyboard feedback stays transient and leaving the board retires the physical owner", () => {
  const idle: ChildContact = { kind: "idle", generation: 4 };
  const keyboard = reduceChildContact(idle, {
    kind: "begin",
    contact: { kind: "keyboard", generation: 4, key: "Enter", x: 20, y: 20 },
  });
  assert.deepEqual(
    reduceChildContact(keyboard, {
      kind: "keyboardMove",
      generation: 4,
      x: 155,
      y: 43,
    }),
    { kind: "keyboard", generation: 4, key: "Enter", x: 155, y: 43 },
  );
  assert.deepEqual(
    reduceChildContact(keyboard, {
      kind: "keyboardMove",
      generation: 3,
      x: 155,
      y: 43,
    }),
    keyboard,
  );
  const pointer = reduceChildContact(idle, {
    kind: "begin",
    contact: { kind: "pointer", generation: 4, id: 12, x: 20, y: 20 },
  });
  assert.deepEqual(
    reduceChildContact(pointer, {
      kind: "move",
      generation: 4,
      id: 12,
      x: 311,
      y: 43,
    }),
    { kind: "idle", generation: 5 },
  );
});
