# First digital sound-writing task

Issue #6 adds Lesson 1 Task 6 to the cumulative development package. The five earlier task bodies, complete catalog and eight earlier package files remain exact. The other lessons and the complete application remain outstanding.

## Teaching and drawing

The task preserves seven meaningful turns for the two source targets. The parent introduces the first sound, demonstrates it, guides tracing and then guides independent writing. The second target has its own demonstration, tracing and independent practice. Four explicit parent confirmations preserve the source practice ranges and allow further practice. Stroke count, elapsed time and drawing shape never accept a teaching response or establish mastery.

Both source rows remain visible. The parent draws the model directly. That model becomes faint during tracing, and child tracing and independent writing remain separate layers. There is no generated letter outline or automatic handwriting assessment. The top guidance, board and controls keep their positions across phases. Added labels and adapted source text retain highlighting. Back shows accepted practice read-only. Optional Skip retains drawings and remains distinct from completion.

The browser controller owns the live stroke buffer and one pending action. Canvas and Pointer Events provide input through uniform document coordinates. Samples bypass Query and lesson rendering. Query caches committed teaching projections. All parent actions fence input synchronously, settle ink, prepare one immutable command, and publish after its durable receipt and matching reread. Hidden or unsupported windows, resize, cancellation and lost contact interrupt drawing without accepting teaching.

Publication checks match the command ID, owner, session, run, package and committed revision. Selection receipts use the profile revision; navigation receipts use the session revision. A mismatched reply keeps the old visible place, closes drawing and retains the same command for Retry.

## Durable state and recovery

The portable teaching engine retains its existing occurrence, checkpoint and accepting-command authority. Explicit writing confirmations bind the target and phase. Each target has a canonical document with separate model, tracing and independent histories. Stroke IDs remain stable through bounded checkpoints and finalization. Canonical point chunks use a versioned little-endian codec. The additive V4 migration preserves earlier data and receipts.

Warm recovery declares retained stroke IDs and the exact pending teaching identity. Ordinary teaching stays closed while retained ink settles. The original teaching command is then resolved through the existing coordinator before document epochs are fenced. This ordering preserves Retry after a connection loss before or after COMMIT. Failed saves and repeated lost replies retain the original envelope. A whole-browser crash restores committed checkpoints. Resume retains documents, while a new replay allocates fresh documents.

Undo, Redo and reversible Clear belong to issue #7. Teaching Undo belongs to issue #9. This slice establishes their canonical history boundary without exposing those controls early.

## Verification record

All 145 Node tests pass. Real SQLite checks cover migration failures, ownership and revision rejection, exact command Retry, repeated worker replacement, interrupted capture, terminal credit and distinct Skip. Type, validator, migration and package-boundary checks pass. The commit hook and whole-project formatting remain enabled.

The independent source audit binds the private package to the supplied scan and raw records. It checks all 37 guidance spans, five source steps, seven turns and four phase confirmations. All eight prior package files remain byte-identical. The new cumulative fixture contains synthetic text only.

A separate actual-source production build passes the complete writing flow at 900×600 and 1280×800, with device pixel ratios of one and two. Checks cover uniform coordinates, both rows, stable anchors, faint models, separate layers, persisted canonical points, reload and accepted Back views. Browser captures and source-bearing outputs remain private.

Frozen compatibility checks retain 636 earlier transitions and 32 saved databases through upgrade and repeated reopen. They compare the owned rows, exact package bytes and committed projections without regenerating baselines.

The production build reports JavaScript chunks above the configured warning threshold. This work does not qualify whole-application performance, physical-tablet latency, Safari support, native behavior or release distribution. Runtime content publication remains pending. Fresh Standards and Spec reviews, an independent production verdict and exact-head CI remain merge requirements.
