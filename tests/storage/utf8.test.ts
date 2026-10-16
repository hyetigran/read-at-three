import assert from "node:assert/strict";
import { test } from "node:test";
import { utf8, equalBytes } from "../../packages/storage/src/utf8.ts";
test("portable UTF-8 manifest bytes match Unicode golden vector", () => {
  assert.deepEqual(
    [...utf8("AéЖ🐻")],
    [0x41, 0xc3, 0xa9, 0xd0, 0x96, 0xf0, 0x9f, 0x90, 0xbb],
  );
  assert(equalBytes(utf8("AéЖ🐻"), new TextEncoder().encode("AéЖ🐻")));
  assert.throws(() => utf8("\ud800"), /Invalid UTF-8/);
});
