import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCounter, parseId } from "@readatthree/teaching";
import {
  currentVisit,
  parentRouteAllowed,
} from "../../apps/web/src/features/parent/parent-visit.ts";
import type { ParentVisit } from "../../apps/web/src/features/parent/parent-visit.ts";

const selection = {
  installationId: parseId({
    kind: "installation",
    value: "parent.installation",
  }),
  revision: parseCounter("0"),
  owner: {
    profileId: parseId({ kind: "profile", value: "child.a" }),
    generation: parseCounter("0"),
  },
};
const visit: ParentVisit = {
  lifetime: { selection, connectionTicket: 1, visitId: 1 },
  origin: {
    kind: "map",
    entryKey: "map.entry",
    focus: { kind: "parentButton", destination: "profiles" },
  },
  routeAttempt: 0,
  destination: { kind: "profiles" },
  gate: { kind: "locked" },
};
test("a parent visit cannot survive A to B to A or a replacement connection", () => {
  assert.equal(currentVisit({ visit, selection, connectionTicket: 1 }), true);
  assert.equal(
    currentVisit({
      visit,
      selection: { ...selection, revision: parseCounter("2") },
      connectionTicket: 1,
    }),
    false,
  );
  assert.equal(currentVisit({ visit, selection, connectionTicket: 2 }), false);
});
test("a parent grant authorizes only its current internal destination", () => {
  assert.equal(parentRouteAllowed(visit, "/parent/gate"), true);
  assert.equal(parentRouteAllowed(visit, "/parent/profiles"), false);
  const granted: ParentVisit = { ...visit, gate: { kind: "granted" } };
  assert.equal(parentRouteAllowed(granted, "/parent/profiles"), true);
  assert.equal(parentRouteAllowed(granted, "/parent/settings"), false);
  assert.equal(parentRouteAllowed(granted, "/parent/gate"), false);
  assert.equal(
    parentRouteAllowed(
      { ...granted, destination: { kind: "settings" } },
      "/parent/settings",
    ),
    true,
  );
});

test("removal creates a locked fresh visit with no saved-work return authority", async () => {
  const { freshParentAfterRemoval, parentAddress, originAddress } =
    await import("../../apps/web/src/features/parent/parent-visit.ts");
  const fresh = freshParentAfterRemoval({
    selection: {
      ...selection,
      revision: parseCounter("3"),
      owner: { ...selection.owner, generation: parseCounter("1") },
    },
    connectionTicket: 2,
    visitId: 5,
    entryKey: "fresh.map",
  });
  assert.deepEqual(fresh, {
    lifetime: {
      selection: {
        ...selection,
        revision: parseCounter("3"),
        owner: { ...selection.owner, generation: parseCounter("1") },
      },
      connectionTicket: 2,
      visitId: 5,
    },
    origin: { kind: "map", entryKey: "fresh.map", focus: { kind: "none" } },
    routeAttempt: 0,
    destination: { kind: "profiles" },
    gate: { kind: "locked" },
  });
  assert.equal(originAddress(fresh.origin), "/");
  assert.equal(parentRouteAllowed(fresh, "/parent/profiles"), false);
  assert.equal(parentRouteAllowed(fresh, "/parent/gate"), true);
  assert.equal(
    currentVisit({ visit: fresh, selection, connectionTicket: 2 }),
    false,
  );
  assert.equal(parentAddress({ kind: "support" }), "/parent/support");
});

test("total local support preview contains aggregate counts, persistence and truthful whole-origin estimate within 8 KiB", async () => {
  const { localSupportPreview } =
    await import("../../apps/web/src/features/parent/parent-visit.ts");
  const preview = localSupportPreview({
    diagnostics: {
      persistence: "memoryOnly",
      ring: { version: 1, omitted: 7, records: [] },
      metadata: {
        versions: { application: "0.0.0", database: 9, inkCodec: 1 },
        capabilities: { opfs: true, storeLock: true, sqliteBigInt: true },
      },
    },
    estimate: { kind: "incomplete", scope: "origin", usage: 0 },
  });
  assert.deepEqual(JSON.parse(preview), {
    version: 1,
    persistence: "memoryOnly",
    persistenceMeaning: "Memory only; lost when this process ends",
    omitted: 7,
    totals: [],
    metadata: {
      versions: { application: "0.0.0", database: 9, inkCodec: 1 },
      capabilities: { opfs: true, storeLock: true, sqliteBigInt: true },
    },
    browserWholeOriginEstimate: {
      kind: "incomplete",
      scope: "origin",
      usage: 0,
    },
  });
  assert.ok(new TextEncoder().encode(preview).byteLength <= 8192);
  assert.equal(preview.includes('"quota"'), false);
});

test("support preview aggregates repeated records and rejects a total UTF-8 overflow", async () => {
  const { localSupportPreview } =
    await import("../../apps/web/src/features/parent/parent-visit.ts");
  const diagnostic = {
    persistence: "durable",
    ring: {
      version: 1,
      omitted: 0,
      records: [
        {
          category: "write-failed",
          operation: "teaching",
          count: 2,
          durationMs: 17,
        },
        {
          category: "write-failed",
          operation: "teaching",
          count: 3,
          durationMs: 21,
        },
      ],
    },
    metadata: {
      versions: { application: "0.0.0", database: 9, inkCodec: 1 },
      capabilities: { opfs: true, storeLock: true, sqliteBigInt: true },
    },
  } satisfies Parameters<typeof localSupportPreview>[0]["diagnostics"];
  const preview = localSupportPreview({
    diagnostics: diagnostic,
    estimate: { kind: "unavailable", reason: "unsupported" },
  });
  assert.deepEqual(JSON.parse(preview).totals, [
    { category: "write-failed", count: 5, durationMs: 38 },
  ]);
  assert.throws(
    () =>
      localSupportPreview({
        diagnostics: {
          ...diagnostic,
          metadata: {
            ...diagnostic.metadata,
            versions: {
              ...diagnostic.metadata.versions,
              application: "é".repeat(5000),
            },
          },
        },
        estimate: { kind: "error", reason: "estimate-failed" },
      }),
    /encoded bound/,
  );
});
