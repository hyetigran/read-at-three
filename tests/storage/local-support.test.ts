import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appendDiagnostic,
  canonical,
  diagnosticPreview,
  DIAGNOSTIC_LIMITS,
  parseDiagnosticEvent,
  parseDiagnosticRing,
} from "@readatthree/teaching";
import type { DiagnosticRing } from "@readatthree/teaching";
import { profileFixture } from "./profile-support.ts";

const event = {
  category: "write-failed",
  operation: "ink",
  count: 1,
  durationMs: 17,
} satisfies Parameters<typeof parseDiagnosticEvent>[0];

test("local support rejects private or unbounded fields and bounds the entire encoded ring and preview", () => {
  for (const input of [
    { ...event, profileId: "private" },
    { ...event, message: "private" },
    { ...event, category: "private" },
    { ...event, durationMs: Infinity },
    { ...event, durationMs: 600001 },
    { ...event, count: 0 },
    { ...event, count: 1000001 },
    { ...event, operation: "private" },
  ])
    assert.throws(() => parseDiagnosticEvent(input), /unsupported/);
  assert.throws(() =>
    parseDiagnosticRing({ version: 2, omitted: 0, records: [] }),
  );
  const parsed = parseDiagnosticEvent(event);
  let ring: DiagnosticRing = parseDiagnosticRing({
    version: 1,
    omitted: 0,
    records: Array.from({ length: DIAGNOSTIC_LIMITS.records }, () => parsed),
  });
  ring = appendDiagnostic(appendDiagnostic(ring, parsed), parsed);
  assert.equal(ring.records.length, DIAGNOSTIC_LIMITS.records);
  assert.equal(ring.omitted, 2);
  assert.ok(Buffer.byteLength(canonical(ring)) <= DIAGNOSTIC_LIMITS.bytes);
  const preview = diagnosticPreview({ persistence: "durable", ring });
  assert.ok(Buffer.byteLength(preview) <= DIAGNOSTIC_LIMITS.previewBytes);
  assert.deepEqual(JSON.parse(preview), {
    version: 1,
    persistence: "durable",
    omitted: 2,
    totals: [{ category: "write-failed", count: 4096, durationMs: 69632 }],
  });
});

test("diagnostics persist through the same SQLite FIFO and survive restart", async (t) => {
  const fixture = await profileFixture(t),
    first = fixture.connect();
  await fixture.setup(first.app);
  const recorded = await first.app.recordDiagnostic(
    parseDiagnosticEvent(event),
  );
  assert.equal(recorded.persistence, "durable");
  assert.equal(recorded.ring.records.length, 1);
  assert.equal(
    first.db
      .prepare(
        "SELECT length(CAST(payload AS BLOB)) AS bytes FROM local_diagnostics",
      )
      .get()?.bytes,
    Buffer.byteLength(canonical(recorded.ring)),
  );
  first.db.close();
  const second = fixture.connect();
  assert.deepEqual(await second.app.readDiagnostics(), recorded);
  assert.deepEqual(second.db.prepare("PRAGMA foreign_key_check").all(), []);
});

test("diagnostic persistence failure retains a labeled bounded memory ring and does not reject teaching", async (t) => {
  const fixture = await profileFixture(t);
  let fail = false;
  const { app } = fixture.connect({
    hook: async (sql, work) => {
      if (fail && sql.startsWith('insert into "local_diagnostics"'))
        throw new Error("injected support storage failure");
      return work();
    },
  });
  await fixture.setup(app);
  fail = true;
  const record = await app.recordDiagnostic(parseDiagnosticEvent(event));
  assert.equal(record.persistence, "memoryOnly");
  assert.deepEqual(await app.readDiagnostics(), record);
  await fixture.start(app);
  await fixture.draw(app, 20);
  assert.equal((await fixture.current(app)).snapshot.strokes.length, 2);
  fail = false;
  const restored = await app.recordDiagnostic(parseDiagnosticEvent(event));
  assert.equal(restored.persistence, "durable");
  assert.equal(restored.ring.records.length, 2);
  assert.deepEqual(await app.readDiagnostics(), restored);
});
