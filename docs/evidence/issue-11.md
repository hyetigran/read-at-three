# Selected-child reset, deletion, and local support

Issue [#11](https://github.com/hyetigran/read-at-three/issues/11) is in progress. The implementation has not been merged. Full application qualification and independent review remain required.

## Committed data and recovery

The existing serialized administration boundary accepts versioned reset and deletion commands. Reset keeps the child's identity and exact preferences, increments its generation and revision, removes its personal graph, and stores a V2 reset result under the resulting generation. An old-generation reset Retry rejects as stale. Deletion removes the profile and its personal graph, then selects an explicitly confirmed surviving child. Deleting the final child requires explicit fresh-child preferences and allocates a new identity without teaching work.

V9 preserves migration objects and SQL for versions 1 through 8. It adds deferred selected-owner constraints, supported V2 administrative evidence, V2 personal reset receipts, and a bounded local diagnostics table. Semantic ownership traversal retires related evidence while preserving unrelated receipts and exact Retry results. A deleted owner's acknowledgement can resolve through redacted installation evidence. That evidence contains no child, successor, preferences, or departure graph.

Controller and Query retirement cancel obsolete directory projections, including surviving-child cache entries containing the removed child. Publication leases reject late directory, history, controls, and restoration callbacks. Input remains fenced until incoming canonical work restores. Known deletion settlement retains only its redacted receipt if adoption needs Retry. Parent navigation discards the previous visit and saved-work origin, then opens a fresh locked parent gate with a map return origin.

## Parent controls and support

The gated profiles view exposes reset and deletion for the selected child. Confirmation identifies the target's animal and optional name. Deletion requires an explicit successor choice and a separate confirmation. Cancel before submission sends no destructive command. All added visible copy is highlighted.

Local support shows versions, startup capabilities, finite aggregate timings and errors, persistence status, omitted events, and browser estimates for the whole origin. The complete preview is capped at 8 KiB. The durable ring includes its header within a 1 MiB limit. Missing measurements remain unavailable. Diagnostics exclude profile identifiers, names, source, ink, free-form exceptions, and passphrases. There is no upload, export, clipboard, analytics, or advertising path.

## Qualification checkpoint

Private immutable historical fixtures remain outside Git because they contain source-bearing observations. Qualification uses an isolated, hash-bound portable candidate and exclusive SQLite copies. The following checks have completed locally.

- All 41 genuine historical V8 states migrate to the reviewed additive V9 state. Each passes actual migration-COMMIT rollback, exact clean Retry, and refusal by the frozen V8 initializer without writer statements.
- All 102 frozen V8 reader observations match complete literal request and result values after migration. They contain 860 events. Separate readback compares all 102 final SQLite files and 306 recorded raw checkpoints.
- Reset and deletion pass 102 transitions covering every original profile in those states. Full surviving personal graphs and shared content remain exact. Actual closed connections reopen, V2 reset rows decode through Drizzle, unrelated V1 Retry remains exact, and deletion recovery resolves redacted receipts.
- Thirty-two removal fault cases cover eight profiles across multichild, withdrawn-advance, and credited replay states. Before-COMMIT failures preserve the whole original file. After-COMMIT loss follows the distinct reset and deletion recovery policies. Recovery's existing document fence increments are checked separately from the exact graph at COMMIT.
- Three actual-Worker browser scenarios pass reset cancellation and restoration, explicit final-child replacement, and bounded local support without a profile mutation.
- The complete current Node suite passes 331 tests without failures or skips. The complete development browser suite passes 112 tests. Strict TypeScript passes all three projects. Validator freshness, migration freshness, portable boundaries, and the no-ESLint check pass.

The first complete Node run exposes five outdated schema expectations. Four tests expect the previous version after initialization. The fifth expects immediate selected-owner rejection and unsupported version 2, which V9 deliberately changes. The original frozen V8 foundation suite still passes all eight tests. Current tests retain the V8 COMMIT fault and verify V9 rejection at actual COMMIT, exact rollback, unsupported version 3, and supported version 2. The two affected current files pass 25 focused tests. No original fixture is rewritten.

The production browser suite, actual supplied-source smoke, final source continuity, independent reviews, and exact-head CI remain delivery gates. Portable Node SQLite evidence does not qualify OPFS, native SQLite, physical devices, or release readiness.
