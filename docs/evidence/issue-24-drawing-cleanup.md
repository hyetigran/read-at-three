# Parent-selected older drawing cleanup

This issue #24 increment adds parent-gated removal of selected older drawing
bytes from the save-failure view. It does not complete issue #24 or the SPA gate.
Cache cleanup, remaining damaged-store qualification and backup-dependent
recovery remain separate work. Paused backup/security and restore work remain
paused.

The parent sees saved drawing previews and explicitly selects a bounded batch
for permanent removal. The store excludes in-progress runs, the open Undo run,
capturing strokes and already removed drawings. A transaction rechecks exact
document tokens and the selected child before deleting strokes, chunks and
operations. It preserves document identity, terminal acceptance, valid credits,
support and pinned content. Historical displays explicitly identify removed
drawings instead of presenting them as empty work.

Cleanup uses its own generation-scoped revision and bounded receipts. Changing
the profile revision here would invalidate an already prepared teaching command;
the separate counter preserves that command's original identity and checks.
An uncertain cleanup retains the same command for Retry. Local list and preview
queries run offline. After connection loss, cleanup Retry uses the existing
controller recovery path before submitting that same command; the dialog keeps
teaching input and cues fenced until dismissal. Receipt pruning cannot
reexecute an old revision. Reset and deletion remove cleanup state, receipts and
removal markers with the owned graph.

Database version 15 adds the cleanup state, receipts and removal markers.
Version-aware admission preserves older migration validation. The storage
contract remains portable SQLite/Drizzle; browser transport, parent access and
previews are web adapters.

## Verification

- Real Node SQLite: cleanup refusal rolls back all tables and file bytes; protected
  Undo and mixed current/historical batches reject without mutation; the original
  pending teaching command commits after cleanup; duplicate cleanup and reopen
  return the same receipt; pruning rejects replay; removed historical work remains
  read-only with credit intact.
- Real Node SQLite: populated version 14 migration interruptions at creation,
  version update, commit and post-commit acknowledgement preserve original work
  and allow one successful migration on reopen. Version 13 catalog migration
  faults and profile removal regressions also pass (29 extended tests, plus the
  five catalog migration cases).
- Actual browser SQLite/OPFS: the development and production scenarios pass.
  A driver COMMIT refusal leaves new ink pending. Parent access previews and
  selects only an older drawing; another real COMMIT refusal leaves cleanup
  retryable. The same cleanup command succeeds on Retry, then the original ink
  command succeeds and its stroke survives reload.
- Whole-project type/format checks, generated validator/migration checks and
  portable boundary checks pass. The initial full Node suite passed 750 of 758
  tests; its eight failures exposed an outdated diagnostic table count and missing
  cleanup-table retention classifications. Those are corrected, and all 12 tests
  in the two affected files pass. Full-suite revalidation is pending. Independent
  Standards and Spec findings about offline reads and cleanup reconnection are
  addressed; review of the updated commit and full CI remain pending.

All scenarios use synthetic curriculum. The COMMIT cuts are test-only driver
faults, not claims of physical disk exhaustion or native-device qualification.
