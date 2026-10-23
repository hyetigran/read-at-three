# Issue 24 restart and rejection evidence

This audit maps concrete recovery assertions to the second acceptance criterion
of issue 24. It does not close the issue or qualify backup/reimport, which remain
dependent on the paused backup work.

## Ownership and foreign-key rejection

Three actual SQLite scenarios now close their original connection and open the
same database file after rejection:

- `graph.test.ts`: removing referenced task credit fails at COMMIT. Explicit
  rollback restores the entire logical database snapshot. A new connection sees
  the identical snapshot and completed teaching projection, with no foreign-key
  violations.
- `course.test.ts`: a lesson-credit support edge pointing across owners fails
  the actual composite foreign key. All prior rows remain unchanged. A new
  connection preserves both the complete snapshot and course projection.
- `profile-foundation.test.ts`: deferred selection ownership and generation
  violations fail at COMMIT; unsupported receipt versions and revision steps
  fail constraints. After rollback and close/reopen, the directory and complete
  database snapshot match their original values and foreign-key checks are empty.

These tests compare logical SQLite schema/data through `databaseSnapshot`, not
byte-for-byte file identity. They exercise rejected mutations of already saved
state, rather than substituting a mocked repository rejection.

## Other existing restart coverage inspected

| Requirement                       | Concrete assertions                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generation and revision conflicts | `recovery-teaching.test.ts`: replacement-connection recovery rejects a genuine advanced revision and a real owner-generation reset; retained exact commands cannot accept old work.                                                                                                                                     |
| Receipt pruning                   | `control.test.ts`: after deleting command receipts, stale selection cannot replay or replace a committed queue; reconnect preserves the projection and acceptance count. `writing.test.ts` also proves automatic document-receipt bounds after 130 finalized strokes.                                                   |
| Ink compaction                    | `practice-controls.test.ts`: failure after actual unreachable-geometry collection rolls back to the capture snapshot; exact Retry converges. A newly opened connection preserves all saved strokes and compacted histories, including the baseline and model layer.                                                     |
| Package activation                | `package-command-faults.test.ts`: failures before and after COMMIT at accepted, ready, activated and cancelled stages; offline replacement connection retains original command/witness, performs no automatic acquisition, and exact Retry converges to one command and the expected activation revision.               |
| Migrations                        | `connected-pointing-migration.test.ts`: each DB12 statement, ledger, version, COMMIT and foreign-key-check failure preserves the complete old file; physical reopen remains at DB11; Retry reaches the current version with valid foreign keys. Earlier migration suites also cover rollback and lost acknowledgements. |
| Single owner / multiple tabs      | `storage-ownership.spec.ts`: queued ownership restores saved writing after release; a retained owner causes refusal without file changes; retiring a queued page cancels its lease while a genuine second tab stays excluded.                                                                                           |

Browser save/worker-loss, damaged-store reset, quota-capacity and parent cleanup
flows have separate feature evidence. A complete issue-24 handoff must evaluate
those flows and the deferred backup/reimport acceptance together; this matrix is
not a substitute for that gate.
