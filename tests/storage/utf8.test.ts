import assert from "node:assert/strict";
import { test } from "node:test";
import {
  utf8,
  equalBytes,
  decodeUtf8,
} from "../../packages/storage/src/utf8.ts";
test("portable UTF-8 manifest bytes match Unicode golden vector", () => {
  assert.deepEqual(
    [...utf8("AéЖ🐻")],
    [0x41, 0xc3, 0xa9, 0xd0, 0x96, 0xf0, 0x9f, 0x90, 0xbb],
  );
  assert(equalBytes(utf8("AéЖ🐻"), new TextEncoder().encode("AéЖ🐻")));
  assert.throws(() => utf8("\ud800"), /Invalid UTF-8/);
});

test("portable UTF-8 decode rejects malformed, truncated, surrogate and overlong bytes", () => {
  assert.equal(
    decodeUtf8(
      Uint8Array.from([0x41, 0xc3, 0xa9, 0xd0, 0x96, 0xf0, 0x9f, 0x90, 0xbb]),
    ),
    "AéЖ🐻",
  );
  for (const bytes of [
    [0xc0, 0x80],
    [0xe0, 0x80, 0x80],
    [0xed, 0xa0, 0x80],
    [0xf4, 0x90, 0x80, 0x80],
    [0xc3],
    [0x80],
    [0xf0, 0x9f, 0x41, 0x80],
  ])
    assert.throws(() => decodeUtf8(Uint8Array.from(bytes)), /Invalid UTF-8/);
});
