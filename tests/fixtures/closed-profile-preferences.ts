import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import {
  parseCounter,
  parseId,
  parseLocalPreferences,
} from "@readatthree/teaching";
import type { ProfileId } from "@readatthree/teaching";
import { DATABASE_VERSION } from "../../packages/storage/src/migration.ts";

export type ClosedPreferenceJob = Readonly<{
  kind: "seedFallbackPreferences" | "inspectPreferences";
  profileIds: readonly [ProfileId, ProfileId];
}>;
type PreferenceRow = Readonly<{
  profileId: ProfileId;
  generation: string;
  revision: string;
  preferencesVersion: 1;
  preferences: string;
}>;
type PreferencePair = readonly [PreferenceRow, PreferenceRow];
type ClosedPreferenceCommon = Readonly<{
  lockAcquired: true;
  lockReleased: true;
  databaseClosed: true;
  poolReleased: true;
  sqliteVersion: string;
  databaseVersion: number;
  profileIds: readonly [ProfileId, ProfileId];
  before: PreferencePair;
  after: PreferencePair;
}>;
export type ClosedPreferenceFixtureResult = ClosedPreferenceCommon &
  (
    | Readonly<{ kind: "inspectPreferences" }>
    | Readonly<{
        kind: "seedFallbackPreferences";
        constructed: readonly [string, string];
        changedRows: 2;
      }>
  );

export const constructedPreferenceStrings: readonly [string, string] = [
  '{ "version": 1, "displayName": "Missing animal", "writing": { "hand": "left" }, "accessibility": { "reducedMotion": true } }',
  '{\n  "version": 1, "avatarId": "future-animal", "displayName": "Unknown animal",\n  "writing": { "hand": "right", "width": 7 }, "accessibility": { "largeText": true }\n}',
];

export function parseClosedPreferenceJob(input: unknown): ClosedPreferenceJob {
  if (
    !input ||
    typeof input !== "object" ||
    !("kind" in input) ||
    (input.kind !== "seedFallbackPreferences" &&
      input.kind !== "inspectPreferences") ||
    !("profileIds" in input) ||
    !Array.isArray(input.profileIds) ||
    input.profileIds.length !== 2 ||
    Object.keys(input).length !== 2
  )
    throw new Error("Only the fixed closed-profile fixture job is supported.");
  const first = parseId({ kind: "profile", value: input.profileIds[0] });
  const second = parseId({ kind: "profile", value: input.profileIds[1] });
  if (first === second)
    throw new Error("Two distinct existing children are required.");
  return { kind: input.kind, profileIds: [first, second] };
}

function parsePreferenceRow(input: unknown): PreferenceRow {
  if (
    !input ||
    typeof input !== "object" ||
    !("profileId" in input) ||
    !("generation" in input) ||
    !("revision" in input) ||
    !("preferencesVersion" in input) ||
    input.preferencesVersion !== 1 ||
    !("preferences" in input) ||
    typeof input.preferences !== "string"
  )
    throw new Error("An exact supported saved preference row is required.");
  const preferences: unknown = JSON.parse(input.preferences);
  parseLocalPreferences(preferences);
  return {
    profileId: parseId({ kind: "profile", value: input.profileId }),
    generation: parseCounter(input.generation),
    revision: parseCounter(input.revision),
    preferencesVersion: input.preferencesVersion,
    preferences: input.preferences,
  };
}

function parsePreferencePair(input: unknown): PreferencePair {
  if (!Array.isArray(input) || input.length !== 2)
    throw new Error("Both exact preference rows are required.");
  return [parsePreferenceRow(input[0]), parsePreferenceRow(input[1])];
}

export function parseClosedPreferenceResult(
  input: unknown,
): ClosedPreferenceFixtureResult {
  if (
    !input ||
    typeof input !== "object" ||
    !("kind" in input) ||
    !("profileIds" in input) ||
    !("lockAcquired" in input) ||
    input.lockAcquired !== true ||
    !("lockReleased" in input) ||
    input.lockReleased !== true ||
    !("databaseClosed" in input) ||
    input.databaseClosed !== true ||
    !("poolReleased" in input) ||
    input.poolReleased !== true ||
    !("sqliteVersion" in input) ||
    typeof input.sqliteVersion !== "string" ||
    !("databaseVersion" in input) ||
    input.databaseVersion !== DATABASE_VERSION ||
    !("before" in input) ||
    !("after" in input)
  )
    throw new Error("The actual closed-store fixture result is invalid.");
  const job = parseClosedPreferenceJob({
    kind: input.kind,
    profileIds: input.profileIds,
  });
  const common: ClosedPreferenceCommon = {
    lockAcquired: true,
    lockReleased: true,
    databaseClosed: true,
    poolReleased: true,
    sqliteVersion: input.sqliteVersion,
    databaseVersion: input.databaseVersion,
    profileIds: job.profileIds,
    before: parsePreferencePair(input.before),
    after: parsePreferencePair(input.after),
  };
  for (const index of [0, 1] satisfies (0 | 1)[]) {
    if (
      common.before[index].profileId !== job.profileIds[index] ||
      common.after[index].profileId !== job.profileIds[index] ||
      common.before[index].generation !== common.after[index].generation ||
      common.before[index].revision !== common.after[index].revision
    )
      throw new Error(
        "The fixture must retain the exact two child identities and revision strings.",
      );
  }
  if (job.kind === "inspectPreferences") return { ...common, kind: job.kind };
  if (
    !("changedRows" in input) ||
    input.changedRows !== 2 ||
    !("constructed" in input) ||
    !Array.isArray(input.constructed) ||
    input.constructed.length !== 2 ||
    input.constructed[0] !== constructedPreferenceStrings[0] ||
    input.constructed[1] !== constructedPreferenceStrings[1]
  )
    throw new Error("The fixed two-row construction did not complete.");
  return {
    ...common,
    kind: job.kind,
    constructed: constructedPreferenceStrings,
    changedRows: 2,
  };
}

export async function runClosedPreferenceFixture(
  input: unknown,
): Promise<ClosedPreferenceFixtureResult> {
  const job = parseClosedPreferenceJob(input);
  for (const text of constructedPreferenceStrings) {
    const preferences: unknown = JSON.parse(text);
    parseLocalPreferences(preferences);
  }
  const result = await navigator.locks.request(
    "read-at-three.sqlite.v1",
    { ifAvailable: true, mode: "exclusive" },
    async (lock) => {
      if (!lock)
        throw new Error(
          "The application must close before the fixture acquires its store.",
        );
      const root = await navigator.storage.getDirectory();
      await root.getDirectoryHandle(".read-at-three.sqlite", { create: false });
      const sqlite3 = await sqlite3InitModule();
      if (!sqlite3.config.bigIntEnabled)
        throw new Error("Lossless SQLite integers are required.");
      const pool = await sqlite3.installOpfsSAHPoolVfs({
        name: "opfs-sahpool",
        directory: ".read-at-three.sqlite",
        initialCapacity: 6,
      });
      try {
        if (!pool.getFileNames().includes("/reading.sqlite3"))
          throw new Error("The existing application database is required.");
        const database = new pool.OpfsSAHPoolDb("/reading.sqlite3");
        try {
          const version = Number(database.selectValue("PRAGMA user_version"));
          if (
            version !== DATABASE_VERSION ||
            Number(
              database.selectValue(
                "SELECT database_version FROM installation WHERE singleton=1",
              ),
            ) !== DATABASE_VERSION
          )
            throw new Error(
              "The fixture supports only the current initialized application schema.",
            );
          function read(profileId: ProfileId): PreferenceRow {
            const rows: unknown[][] = [];
            database.exec({
              sql: "SELECT profile_id,CAST(generation AS TEXT),CAST(revision AS TEXT),preferences_version,preferences FROM profile WHERE profile_id=?",
              bind: [profileId],
              rowMode: "array",
              callback: (row) => {
                rows.push([...row]);
              },
            });
            if (rows.length !== 1)
              throw new Error("The exact existing child is required.");
            const row = rows[0];
            if (!row)
              throw new Error("The exact saved preference row is required.");
            return parsePreferenceRow({
              profileId: row[0],
              generation: row[1],
              revision: row[2],
              preferencesVersion: Number(row[3]),
              preferences: row[4],
            });
          }
          const before: PreferencePair = [
            read(job.profileIds[0]),
            read(job.profileIds[1]),
          ];
          if (job.kind === "seedFallbackPreferences") {
            database.exec("BEGIN IMMEDIATE");
            try {
              database.exec({
                sql: "UPDATE profile SET preferences=? WHERE profile_id=? AND preferences_version=1",
                bind: [constructedPreferenceStrings[0], job.profileIds[0]],
              });
              const first = Number(database.selectValue("SELECT changes()"));
              database.exec({
                sql: "UPDATE profile SET preferences=? WHERE profile_id=? AND preferences_version=1",
                bind: [constructedPreferenceStrings[1], job.profileIds[1]],
              });
              const second = Number(database.selectValue("SELECT changes()"));
              if (first !== 1 || second !== 1)
                throw new Error(
                  "Both fixed preference updates must affect one child each.",
                );
              database.exec("COMMIT");
            } catch (error) {
              database.exec("ROLLBACK");
              throw error;
            }
          }
          return {
            kind: job.kind,
            sqliteVersion: sqlite3.capi.sqlite3_libversion(),
            databaseVersion: version,
            profileIds: job.profileIds,
            before,
            after: [read(job.profileIds[0]), read(job.profileIds[1])],
          };
        } finally {
          database.close();
        }
      } finally {
        pool.pauseVfs();
        if (!pool.isPaused())
          throw new Error("The fixture must release its pool before the lock.");
      }
    },
  );
  return parseClosedPreferenceResult({
    ...result,
    lockAcquired: true,
    lockReleased: true,
    databaseClosed: true,
    poolReleased: true,
    ...(job.kind === "seedFallbackPreferences"
      ? { constructed: constructedPreferenceStrings, changedRows: 2 }
      : {}),
  });
}
