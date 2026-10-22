# Issue 24 independent transaction recovery

This delivery handles an unresolved SQLite transaction after failed cleanup. Issue 24 remains open for its other recovery requirements. Protected backup and dependent restore work remain deferred under the [PRD delivery deferral](../../PRD.md#current-delivery-deferral).

## Connection retirement

The old transaction helper discarded every failed ROLLBACK. A real SQLite regression reproduced a later SELECT returning an unacknowledged row from the unresolved transaction.

`createSqlExecutor` now owns the complete transaction lifetime. Its adapter supplies actual native transaction state, SQL execution, and handle closure. The browser reads `sqlite3_get_autocommit` from its actual SQLite WASM handle. The Node test adapter reads `DatabaseSync.isTransaction`.

A confirmed idle connection preserves an uncertain command error. Explicit Retry still reconciles the same command and its durable receipt. An active transaction gets one rollback attempt. Unknown health or an active transaction after cleanup retires the executor before any later SQL. Successful COMMIT also requires confirmed idle state. A failed handle close cannot reopen the executor.

The worker emits a typed connection-loss signal on retirement, including retirement during a background diagnostic write whose application fallback catches the error. It suppresses projections and further diagnostic writes from that connection. The client processes this signal before looking up an individual request. Existing loss handling cancels cues, fences input, retains pending command identities and live ink, and offers the highlighted Retry save control. Explicit retry opens a replacement worker when needed. Replies from the old worker cannot publish new state.

The executor owns the optional lifetime guard. It checks that guard immediately before native COMMIT, preserving the previous ordering without an extra Promise continuation. Two real SQLite microtask controls cover current and retired lifetimes.

Every executor constructor and wrapper uses the required transaction capability. Schema and migration bytes are unchanged. No additional recovery UI copy or production fault switch was added.

## Runtime evidence

The local checks use Node 22.19.0 with SQLite 3.50.4 and headless Chromium 156.0.8078.4. The application lockfile pins SQLite WASM 3.53.4-build2. These are desktop development checks, not a qualified Safari, native, or physical-device matrix.

The real SQLite tests cover failures before and after BEGIN and COMMIT, failed rollback before and after its actual effect, SQLite automatic rollback, unavailable native health, an apparent successful COMMIT that leaves a transaction active, failed handle closure, and unexpected initial transaction state. File reopen checks preserve acknowledged signed-64 integer, BLOB, null, text, and REAL cells. The existing domain recovery tests also exercise exact retained teaching and ink commands.

Six browser controls use the actual application worker, SQLite WASM, OPFS database, and UI. A test-only worker wrapper injects JavaScript exceptions at `DB.exec` boundaries. It does not simulate an entire database or add a production fault API.

- Failed COMMIT with successful rollback retains the same healthy connection and exact ink command.
- Failed COMMIT and unresolved rollback retire the connection. Explicit replacement-worker recovery preserves previously saved ink and the buffered stroke.
- Successful native COMMIT followed by lost acknowledgement returns the existing receipt on exact Retry. It does not duplicate a stroke or acceptance.
- A background diagnostic cleanup failure cancels a live pointing cue even when its initiating request is absent from the client's pending map.
- Teaching failures keep the original instruction visible and acceptance disabled until exact recovery commits or finds its existing receipt.
- Real SQLite snapshots compare all unaffected tables. Existing ink rows, chunk bytes, operations, and receipts remain present. The selected course cursor changes only its expected revision during teaching acceptance. Cold reopen preserves the saved instruction and canonical strokes through the existing Resume flow.

The final corrected source passed all six development controls and all nine production controls. The production group includes three existing lost-acknowledgement, retained-tail, and remount recovery controls.

## Reproduction

Use the pinned Node toolchain and an isolated browser profile. The browser port must be free and separate from any existing development session.

```sh
npm run typecheck
node --import tsx --test tests/storage/transaction-health.test.ts tests/storage/recovery-teaching.test.ts tests/storage/upgrade.test.ts
READING_BROWSER_PORT=6614 npx playwright test tests/browser/transaction-recovery.spec.ts
READING_BROWSER_BUILD=1 READING_BROWSER_PORT=6614 npx playwright test tests/browser/transaction-recovery.spec.ts tests/browser/teaching.spec.ts tests/browser/writing.spec.ts --grep 'actual OPFS|swallowed background|lost reply after real COMMIT|warm retained newer tail|Retry opening remount'
npm run check:boundaries
npm run validators:check
npm run migrations:check
npm run format:check
npm test
```

Strict TypeScript, import boundaries, generated validators, and unchanged migration checks passed. A separate decoder checked all 29 SQLite tables across the six retained before-and-after trace pairs. It verified 1,623 development baseline cells and 1,629 production baseline cells, including exact existing ink bytes and precise document, history, and cursor counter changes. The corrected source passed 35 focused transaction, domain recovery, and migration tests. The full Node regression suite passed all 753 tests, with no failures, cancellations, or skips.

## Limits and remaining work

These injected driver failures do not establish physical disk-full behavior, power-loss durability, corrupt-file repair, or every failed-migration path. Browser reload and worker replacement do not replace physical process-loss and device qualification. This unit does not implement cleanup UI, restore, or Start fresh. Existing personal data was not reset or deleted during this work.

Issue 24 still requires its full acceptance review, including the portions that depend on deferred backup and restore. This evidence does not close that issue, enable backup, or pass the complete SPA handoff gate.
