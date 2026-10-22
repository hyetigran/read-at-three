# Issue 24 storage ownership recovery

When another reading window retains the exclusive storage lease, opening now shows “Storage is open in another window” with a highlighted instruction to close that window and retry. The earlier worker converted the known contention failure into a generic save failure, so the parent could not distinguish contention from unavailable storage.

The worker uses an explicit contention error at its existing lease deadline and transports a closed `storageBusy` response. The client reconstructs the safe error, and the controller retains its category for the opening recovery screen. No raw exception matching, database reset, automatic retry, or new storage owner is introduced. Other initialization failures keep their existing explanation and category.

## Verification

The existing real-browser ownership test was extended to require the specific title and explanation, unchanged saved OPFS file hashes while blocked, and exact saved writing after explicit Retry following lease release. Before the implementation it failed because the screen still displayed “Saved storage is unavailable” and the generic save error. The failure trace is retained locally.

Strict root, web and worker typechecks, whole-project default formatting and import-boundary checks pass. Eight focused browser tests pass in both development and production builds. They cover queued ownership, deadline expiry and exact saved-writing recovery, retirement of a pending window, genuine competing windows, unsupported durable storage, and missing-package/invalid-position explanations through held Retry. The latter two use injected repository responses; they do not establish actual corrupt-file recovery.

The browser command uses `tests/browser/storage-ownership.spec.ts`, `tests/browser/opening-recovery.spec.ts` and `tests/browser/teaching.spec.ts` with the filter `ownership|owner retained|pending reading|competing tab|unsupported durable|repository .* recovery`. Production sets `READING_BROWSER_BUILD=1`. Both runs used an isolated port and synthetic fixtures.

Independent Standards/Spec review and exact-head CI remain delivery gates. The full Node and browser regressions run in CI before merge.

## Scope

This is an independent part of issue 24. Protected backup and dependent restore remain deferred, and this change does not satisfy the complete SPA handoff or native-device qualification. The issue remains open for its other recovery requirements.
