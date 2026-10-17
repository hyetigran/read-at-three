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
