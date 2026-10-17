# Complete printed-sound tasks

Issue #3 delivers Lesson 1 Tasks 1 and 4 in the React SPA. It does not complete Lesson 1, all 45 supplied tasks, handwriting, native adaptation or release qualification.

## Teaching behavior

The introduction retains six distinct required occurrences: model, child response and Again for m, then the same source sequence for s. The review retains two required responses. Ordered guidance preserves interleaved actions, parent speech, expected responses and praise within each source turn.

Repeat adds a separate practice occurrence and returns to the owed turn. Task1 corrections retest the first child response for that sound while retaining its required Again. The general isolated-sound correction used for Task4 restarts the entire m/s review. Help during practice retains the suspended practice and the owed normal response.

Back changes the checkpoint without withdrawing acceptance. Reconfirming an accepted occurrence appends no advance or credit. Completed context review stays completed. Replay and Restart create new runs, preserve earlier data and replace the child's current Undo window. Implementing Undo itself remains issue #9.

## Storage and compatibility

The worker serializes the coordinator's complete command and read operations. Selection uses profile revision checks; teaching actions also target the selected session/run/checkpoint. Matching retained receipts precede revision checks. Save Retry reuses the same prepared command, and Query receives only the subsequent committed projection. Help actions expose only their applicable authored correction preview. The parent can read that separately labelled, nonaccepting preview while its save waits or fails; the committed session and command identity remain intact until recovery confirms the write.

Acceptance snapshots form an immutable chain independent of nonaccepting checkpoints. Terminal acceptance atomically writes the task credit, effective result, run/session state, course cursor and command receipt. An unfinished replay retains prior valid completion. No lesson credit is created from two available tasks.

Database version 2 adds credit/result tables. The version-1 statements/checksum and pinned package bytes remain unchanged. A real version-1 synthetic database captured from commit `536e326` exercises the upgrade. Every version-2 migration statement has an interruption case that proves rollback and successful retry. Changed checksums or invalid saved teaching open recovery without replacing data.

Bundled development activation verifies the cumulative task identity and preserves existing runs on exact pinned packages. A later active catalog is not downgraded by startup. This narrow development path does not implement the package downloader, signed updater or offline installation tickets.

## Verification

The Node suite covers source-neutral authoring, graph routes and corrections, coordinator ownership/selection, real SQLite restart/fault behavior, migration compatibility and UTF-8 package bytes. Browser tests use synthetic curriculum with actual OPFS, and run against both Vite development and production builds. They cover source-turn cadence, stable anchors, completed review/replay, task switching, correction/Pause/reload/Resume, full browser-process restart, held cues, keyboard repeat, double click, storage failure preservation, uncertain commit acknowledgement and unsupported windows.

Private source review separately checks the supplied scans and generated curriculum. Local captures compare ordered guidance/provenance and stable parent/target/cue/Continue bounds through normal, correction and retest screens at 1280×800 and 900×600. Source-bearing artifacts, review records and screenshots stay outside the public repository. Synthetic fixtures are not a substitute for that source review.

Local checks pass: 56 Node tests, 17 development-browser cases, 17 production-browser cases, TypeScript, current generated validators/migrations, import boundaries and project formatting. Private source UI checks include 38 normal/correction/retest captures across both landscape sizes. The comment audit removed two redundant internal explanations, corrected the generated migration header and found no suppression markers. The initial independent review found three Standards issues and one Spec issue. Fixes preserve archived-session receipt replay, defer the result-to-credit relationship, encode transition variants and show sourced uncommitted Help previews through slow/failed saves. Focused regression checks pass; final independent review remains pending in [PR #37](https://github.com/hyetigran/read-at-three/pull/37). Physical tablet input/performance, Safari, native SQLite and later task families remain unverified by this slice.
