# Edit and recover saved handwriting

Issue #7 adds Undo ink, Redo ink and reversible Clear to the currently editable child practice layer. These highlighted tools occupy the existing footer. Both source rows, the parent's model, other layers and other target documents retain their positions and contents. Controls remain disabled in demonstration, accepted Back and terminal views. Ink editing does not confirm a writing phase, advance teaching or grant credit. Teaching Undo remains issue #9.

## Durable editing

SQLite owns AddStroke and ClearPractice history. Clear records the exact ordered visible stroke IDs so Undo restores the same drawing. Beginning an empty contact preserves redo. The first durable nonempty checkpoint discards the abandoned suffix. Recovery of an orphaned checkpoint follows that same rule exactly once. Sequence allocation remains monotonic across discarded branches.

History retains at most 128 operations. Compaction folds only an applied prefix into the baseline. Collection preserves every stroke referenced by the baseline, retained Undo/Redo operations, reversible Clear or active capture. The transaction removes discarded operation rows before unreachable point chunks and strokes. Retained operation rows remain unchanged. Hidden ink still consumes storage. Clear can increase metadata and does not promise freed space.

A dedicated writing control command uses the existing serialized teaching coordinator and ordinary command receipts. It changes the selected document revision/input epoch, history, session revision and receipt atomically. Task-run revisions, accepted responses, advance records, credits, task results, course cursor, source turn, other documents and parent model remain unchanged. The V5 migration marks this behavior version without changing earlier schema or receipt formats. Older application initialization refuses the newer database before writing.

## Input and recovery

The web controller owns one pending semantic action and the live point buffer. Each admitted contact retains its original document token, fence serial and event start time. Input closes synchronously for controls and interruptions. Events created before a fence or while input was closed cannot start or join a later gesture after reopening, even when the browser reuses a pointer ID. Coalesced samples and termination events pass the same contact boundary.

Actual Query observers read the small committed toolbar summary. Tools require its exact acknowledged document token, matching session binding, settled capture and open input. A delayed summary does not prevent the next contact. Point samples and checkpoints do not trigger summary reads or lesson renders. Summaries cannot reduce the retained capacity reservation.

The controller reserves the complete encoded capture envelope before asynchronous hashing, including accepted unsent tails and pending semantic work. The 2 MiB queued-write reservation and 4 MiB live point buffer remain separate. Admission includes retained hidden geometry and conservatively encoded metadata. Acknowledgements do not subtract capacity before a fenced canonical restore.

Lost replies retain the same immutable command and explicit Retry. Reconciliation binds a later actual repository read before publication; it does not directly adopt a projection. Known rejection reloads canonical state without executing the rejected action again. A failed save keeps teaching and drawing fenced until the exact outcome and geometry are established.

## Verification record

All 174 Node tests pass. Real SQLite tests cover history and collection rollback, pre-COMMIT and post-COMMIT reply loss, exact Retry, 128-operation compaction, branch discard, cold orphan recovery, wrong layers, other targets and read-only views. Actual controller/Query/SQLite tests hold hashing while accepting 100,001 points across rapid contacts and reject further work before the queued-write bound. The default whole-project formatting check, strict types, generated validators, migration packaging and import boundaries pass; the commit hook remains enabled.

Seven new production browser regressions failed before the DOM event correction and pass after it. They check stale down, move, up, cancellation, capture loss, coalesced samples and a start created during a held control. Separate independent Chromium probes reproduce the original stray-point and closed-interval failures, then verify saved geometry and command counts after correction. [Exact-head CI](https://github.com/hyetigran/read-at-three/actions/runs/39009714595) passed 70 development browser cases and 68 production cases, with two explicit production skips for development-only consumer checks.

[PR #41](https://github.com/hyetigran/read-at-three/pull/41) merged as `358b99b` after [independent Standards and Spec review](https://github.com/hyetigran/read-at-three/pull/41#issuecomment-6230694470) reported zero findings at `dc38011`. The [independent production verdict](https://github.com/hyetigran/read-at-three/pull/41#issuecomment-6230689090) is PASS+NOTES. Actual-source parent/head builds verified all seven writing turns and four confirmations, six canonical layers, completion, restart, controls and repeated Retry at 900×600/DPR1 and 1280×800/DPR2. Its notes retain the physical-device and release limits below.

Frozen V4 compatibility uses 19 genuine disk databases with 38 physical cold reopens. Exact rows, schema, geometry, receipts and projections remain stable, apart from the reviewed version marker and two expected orphan recoveries. All 181 frozen inputs remain exact. The older compatibility lever also preserves 636 transitions and 32 saved databases. A separate old V4 initializer rejects an actual V5 save without changing its file hash.

An independent real-driver quota case retains 40,000 child strokes. Its document uses 26,950,438 canonical bytes before Clear; the reversible Clear would require 35,070,490 bytes, exceeding 32 MiB. The application returns a known rejection with zero attempted application writes and an unchanged database. Independent control tests also preserve literal pre-change drawings, roll back actual chunk deletion and resolve repeated Retry once.

Browser evidence uses Chromium Pointer Events, synthetic pen/finger input and actual OPFS. It does not qualify physical stylus behavior, native rendering, Safari, tablet latency or release distribution. Source-bearing artifacts remain private, and curriculum publication inputs remain pending. No supplied curriculum or earlier package bytes changed.
