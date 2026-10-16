# Delivery tickets

**Status:** Published and verified on October 16, 2026. All 34 issues have `ready-for-agent` and all 48 native blocking relationships match this plan. Numbers below are stable plan identifiers. The table at the end maps them to GitHub issues.

**Tracker:** [hyetigran/read-at-three](https://github.com/hyetigran/read-at-three), label `ready-for-agent`.

This plan implements the production application, starting with the entire React SPA and moving to Expo only after its functional gate. It covers all 45 supplied tasks, including six optional writing tasks. It does not author the remaining 94 lessons. Approved interview decisions and ADRs govern conflicts with older specification text; ticket 01 reconciles those contracts before implementation.

## Rules shared by the implementation tickets

Each feature slice includes its necessary authored curriculum, portable domain behavior, SQLite schema/repository changes, platform adapter, visible interaction, and behavioral verification. Extend those parts only as needed for the slice. These are increments of one production application, not disposable prototypes. A lesson may be partially available during development; completion credit requires its actual full required sequence.

- Keep the selected strict TypeScript, React/Vite, shadcn, React Query and Drizzle/SQLite stack. Pure teaching/progress/ink logic remains portable; committed engine/database state owns teaching. Query exposes committed projections. Preserve Prettier defaults and the enabled formatting hook; exclude ESLint. Extend CI with meaningful checks as behavior lands.
- Follow the source steps, parent judgment, required repeats, correction/retest routes, and meaningful-turn advance cadence. Silent cues never accept a response. Keep oral answers out of the child's printed reading area. Preserve stable target/canvas/control anchors and top parent guidance. Highlight all added/adapted wording, including errors, accessibility labels where visibly presented, and parent settings. Reading.com is a UI reference; runtime artwork must have its own approval/provenance.
- Each authored task includes source-step/turn/item/correction coverage and verified glyph/gesture evidence. Resolve transcription ambiguity against supplied scans; an unresolved string cannot become verified runtime curriculum. Source scans remain authoring inputs, not runtime assets.
- Every state-changing slice uses serialized, revision-checked, generation-scoped commands and idempotent receipts, with atomic durable saves and explicit same-command Retry. Add relevant real-driver restart/fault cases. A failed save cannot grant progress. The input fence must preserve pending ink through teaching transitions.
- Treat the accepted profiles, Undo, writing-phase confirmations and restore policy as authoritative. Follow the project glossary: a task run contains response attempts. Completion describes delivered teaching, not mastery.
- Use the approved high-fidelity design as the visual reference. The illustrated green map has a turquoise river, bridge and six blue lesson pedestals, with no unrelated right sidebar. Map entry opens that lesson's task modules, then the selected task's teaching. Parent settings are a separate gated route. Source transcripts remain authoring/review material.
- Task modules lead with the exact book title and a visible task number, supported by compact activity illustrations and an entry affordance. Animal portraits identify children, never task modules. Keep long titles legible, allow a natural third row for lessons with seven to nine tasks, and preserve scroll position on return.
- Preserve the pink/white top parent guidance, navy printed targets and stable guidance/target/cue/navigation anchors across model, child-response and correction states. Do not add a duplicate bottom instruction. Use stationary press/hover feedback, visible inset keyboard focus, fine-pointer-only hover, reduced motion and cancellation-safe held cues. No bouncing cards, sticky cues or decorative animation may interfere with teaching.
- The existing high-fidelity viewer is a design reference with sample interactions and in-memory profiles. It does not provide the production engine, persistence or complete 45-task teaching implementation. Build those behaviors and verify them against real storage.
- Build accessible landscape application screens. Preserve state and pause teaching/drawing safely when the actual window is unsupported. Phones and portrait application layouts are deferred. Native device measurements and store qualification remain separate from functional SPA checks.

Ticket 01 is a verifiable specification prerequisite. Tickets 25, 32 and 33 are integration/qualification gates rather than new horizontal implementation layers. Each other implementation ticket supplies a demonstrable user flow; source coverage grows along with executable behavior.

Dependencies list direct prerequisites only. They do not impose lesson locks or require one child to complete earlier teaching. Unrelated slices may proceed independently once their prerequisites land.

## 01 — Reconcile the accepted product and persistence contracts

**Blocked by:** None — can start immediately.

**What to build:** Give implementers one consistent specification for the accepted application, replacing superseded proposals before code depends on them.

**Acceptance criteria:**

- [ ] Reconcile the product, architecture, storage, technology and acceptance contracts with all accepted interview decisions and ADRs, retaining the historical interview/review as evidence. Reconcile the accepted avatar, task-module navigation and interaction-polish decisions with the high-fidelity reference.
- [ ] Specify durable current-task-run Undo, prior valid completion credit, parent overrides, profile isolation, once-per-target writing-phase confirmation, complete protected backup and restore-as-new behavior without contradictory legacy rules.
- [ ] Define checks for the full-functional-SPA handoff and landscape-only iPad/Android release; keep content arrangements pending and phones/permanent public web out of the launch promise.

## 02 — Open and resume the first printed-sound teaching turn

**Blocked by:** 01.

**What to build:** Open a runnable SPA and deliver the first m model/child-response turns from Lesson 1 Task 1, saving the parent's accepted position locally.

**Acceptance criteria:**

- [ ] A minimal lesson entry opens verified source wording and the m target in the intended parent/child layout, using the selected web stack and a bundled development content identity.
- [ ] The parent controls advance; a cold reload restores the committed position from the real SQLite WASM/OPFS worker through Drizzle. Unavailable durable storage shows recovery instead of silently using memory.
- [ ] The portable engine, coordinator, schema and canonical identifiers stay independent of DOM, platform APIs and Query; focused behavior/restart checks, build, type checking and formatting run in CI.

## 03 — Deliver complete printed introduction and review tasks

**Blocked by:** 02.

**What to build:** Complete Lesson 1 Tasks 1 and 4, including prescribed m/s models, responses, Again turns, correction and retest.

**Acceptance criteria:**

- [ ] Every source obligation in both tasks is represented; associated setup/praise stays with its meaningful turn and required Again responses remain distinct.
- [ ] Parent-triggered silent cues preserve holds/movement and stable screen anchors. Cue completion, touch and elapsed time never grant acceptance.
- [ ] Repeat, Back, Help/correction, pause and restart restore the correct route; stale cues and double advance cannot skip a response or award duplicate completion.

## 04 — Deliver oral say-it-fast and selective review

**Blocked by:** 03.

**What to build:** Deliver Lesson 1 Tasks 2 and 5 as oral teaching, including the parent's selection and review of troublesome words.

**Acceptance criteria:**

- [ ] Preserve every supplied item, model, independent response, until-firm loop, correction and retest; the child's canvas does not reveal the expected whole-word answer.
- [ ] Lesson 1 Task 2's selective review accepts nonadjacent stable item identities and retains selected order, current item, correction/retest context and source exit conditions.
- [ ] Pausing/restarting at review selection, correction or retest returns to the same unfinished work without silently accepting it.

## 05 — Deliver continuous oral sound practice

**Blocked by:** 03.

**What to build:** Deliver Lesson 1 Task 3 with the book's parent model, together and independent sound responses.

**Acceptance criteria:**

- [ ] The actual source turns and sustained sounds are followed, with no generic stage template or inserted gaps changing the exercise.
- [ ] The parent repeats and corrects at the supplied return points; oral material does not become an invented printed reading target.
- [ ] Committed position and supported/independent context survive pause and restart; only the parent's accepted required turns permit completion.

## 06 — Complete the first digital sound-writing task

**Blocked by:** 03.

**What to build:** Deliver Lesson 1 Task 6 with real parent demonstration, child tracing and independent finger writing for m, then s.

**Acceptance criteria:**

- [ ] Real freehand vector ink persists in separate parent-model and child-practice layers with source guides and stable canvas geometry; tracing and independent practice are distinct phases.
- [ ] Preserve the source practice guidance, including 2–3 tracings and 3–5 independent writings; allow further practice. The parent confirms once after tracing and once after independent practice per target, without inferred stroke/letter counts.
- [ ] A safe input/commit boundary supports pause/reload and recoverable interrupted strokes; the parent can explicitly skip optional writing, which remains distinct from completion and mastery.

## 07 — Edit and recover saved handwriting

**Blocked by:** 06.

**What to build:** Let the family undo, redo, clear and reopen editable child practice while retaining the parent's model and earlier work.

**Acceptance criteria:**

- [ ] Undo/redo and undoable Clear affect the intended practice layer; drawing after Undo discards the abandoned redo branch, including after restart.
- [ ] Canonical ink, bounded history and baseline compaction reconstruct the same visible geometry after restart or interrupted saves; Clear does not falsely promise freed storage.
- [ ] Exercise finger/available stylus, secondary contacts, cancellation, resize and background interruptions; no stray ink, stuck ownership, browser scrolling or lost acknowledged strokes.

## 08 — Navigate the Lesson 1 map with truthful progress

**Blocked by:** 04, 05, 06.

**What to build:** Complete, pause, resume and replay Lesson 1 from a lessons-only map, with parent entry into any installed lesson/task.

**Acceptance criteria:**

- [ ] Implement the illustrated lessons-only map and title-first task modules from the approved design. Show exact source task titles/order, visible task numbers, semantic activity art, recommended next work and unfinished resume destinations. Animal portraits do not appear as task choices.
- [ ] Map to task menu to teaching stays within the selected lesson and task. Each task opens its own source context, and return restores the correct menu/scroll position. Parent settings are separate and gated; lesson navigation never opens a parent transcript or design-review page. There is no unrelated right sidebar or mandatory sequential lock.
- [ ] Verify the six-task two-row layout and the seven-to-nine-task scroll layout at supported landscape sizes, including long titles, focus and header spacing. Other supplied lesson entries can show truthful missing-content states until their complete teaching tickets land.
- [ ] Lesson completion requires all core tasks and either completed or explicitly skipped optional writing. Opening later work does not grant credit to unseen work.
- [ ] A replay creates a distinct task run while resume preserves its run; earlier completed work and drawings remain accessible. The initial content boundary never invents later lessons.

## 09 — Undo accidental parent advances across restart

**Blocked by:** 08.

**What to build:** Retract mistaken accepted advances, including a just-completed task, without treating Back or stroke Undo as teaching reversal.

**Acceptance criteria:**

- [ ] Repeated Undo advance returns through the current task run to its start and recalculates effective task/lesson progress, including immediately after completion.
- [ ] The undo window survives restart; starting another task run for the same child closes the previous window. Switching children alone does not close it.
- [ ] Preserve ink and completion credit from earlier valid runs. Atomic retries, Back and correction/review branches cannot duplicate or resurrect withdrawn acceptance.

## 10 — Create child profiles with animal avatar onboarding

**Blocked by:** 08.

**What to build:** A parent creates and switches local child profiles. Each child chooses a cute animal during onboarding and resumes their own saved teaching and writing.

**Acceptance criteria:**

- [ ] An accessible adult-reading gate protects profile changes and parent settings; routine Continue, Repeat, Help and Undo remain one-tap teaching actions. Include the required parent preparation from the supplied introduction and practice guide, preserving source copy and highlighting additions. Preparation returns to the originating map/task and never interrupts routine lesson navigation.
- [ ] After parent profile setup, offer eight original bundled animals: Rabbit, Fox, Bear, Owl, Turtle, Bird, Frog and Cat. Provide an accessible radio group with visible selection/focus and keyboard arrow selection. Keep a default available; names, photos and birth dates are not required. Highlight added copy, including animal names.
- [ ] Continue confirms the pending choice through the revision-checked profile command and durable store. Back/Cancel discard it. The same committed portrait appears in the header and profile list after restart; gated Change animal reopens the choice.
- [ ] Store an optional stable bundled avatar ID in profile preferences, independent of display names. Duplicate names and editing a different child cannot change the active profile or another child's avatar. Missing/unsupported IDs render a default without rewriting the saved value. Avatar edits do not affect progress, teaching Undo, task runs or ink.
- [ ] Each profile has independent progress, runs and ink. Switching during unfinished teaching flushes safely and shows the selected child's committed state. Exercise onboarding, cancel, restart, editing another child and switching during paused writing against the real store.
- [ ] Late Query results, queued commands and cue/input callbacks cannot cross profile ownership/generation boundaries. No login or remote account is introduced.

## 11 — Reset or delete a child's local data safely

**Blocked by:** 10.

**What to build:** A parent can inspect local storage/diagnostics and explicitly reset or delete a selected child's saved work.

**Acceptance criteria:**

- [ ] Gated destructive actions explain their effect with highlighted added copy and require a concrete selection; other profiles and shared content remain intact.
- [ ] Queued reads/writes and retries cannot resurrect deleted/reset data; recreated profiles have fresh identity and generation-scoped state.
- [ ] Support information uses bounded allowlisted local diagnostics, excluding unnecessary child content and passphrases. No ads, external analytics or automatic diagnostic upload is added.

## 12 — Complete every Lesson 2 task

**Blocked by:** 08.

**What to build:** Deliver all seven Lesson 2 tasks using the working sound, oral-review and writing flows.

**Acceptance criteria:**

- [ ] Review every source step, item, correction and repetition; resolve Lesson 2 Task 3's ambiguous sh-related transcription against the supplied scan before verified runtime use.
- [ ] Preserve Task 2's selective troublesome-word review and supported/independent returns; test pause/resume inside a selected review branch.
- [ ] Writing uses s then m, the source's qualitative tracing guidance and 3–5 independent writings with one confirmation per phase per target; task and lesson results remain truthful.

## 13 — Introduce short a and printed slow/fast sound practice

**Blocked by:** 08.

**What to build:** Deliver Lesson 3 Tasks 1, 2 and 4, including printed short a and the supplied slow/fast cue behavior.

**Acceptance criteria:**

- [ ] All three tasks retain their actual printed symbols, source turns, repetitions and corrections; slow responses and quick responses remain separate obligations.
- [ ] Silent pointing geometry/holds match the supplied task and keep the teaching targets in stable positions.
- [ ] Direct parent entry, pause/restart and source retests preserve which response is due without counting cue completion as a response.

## 14 — Deliver Lesson 3 oral slow-to-fast practice

**Blocked by:** 05.

**What to build:** Deliver Lesson 3 Tasks 3 and 5, including oral slow/fast responses and their source support sequences.

**Acceptance criteria:**

- [ ] Preserve every supplied oral item and both slow/fast response roles where prescribed; source models/together turns are not replaced by a universal template.
- [ ] The parent judges firmness and follows exact correction/retest returns; no oral answer becomes a printed child target.
- [ ] Each task is directly runnable and restartable with its current response obligation intact.

## 15 — Follow the parent's voice and finish Lesson 3

**Blocked by:** 13, 14.

**What to build:** Complete Lesson 3 Tasks 6–8, adding child pointing while the parent voices am/sa and completing a/m writing.

**Acceptance criteria:**

- [ ] Pointing tasks preserve who speaks, who touches, the source diagram/gesture and every supplied practice/correction turn.
- [ ] Touches support the activity without automatically judging speech or advancing teaching; cancellation/restart retains the current role and item.
- [ ] Writing uses a then m, and all eight Lesson 3 tasks are covered end to end with truthful map/resume/completion behavior.

## 16 — Complete every Lesson 4 task

**Blocked by:** 15.

**What to build:** Deliver the seven source-faithful Lesson 4 tasks, including parent-voiced pointing through ma/sa and s/a writing.

**Acceptance criteria:**

- [ ] Every source step/item/repetition/correction maps to executable teaching, preserving printed review, oral slow/fast and pointing roles.
- [ ] Writing uses s then a with source guidance and parent phase confirmations; optional skip remains distinct from completion.
- [ ] Exercise correction/retest and pause/restart across its activity families, with verified whole-lesson map/progress results.

## 17 — Introduce long ē and child-pointed single sounds

**Blocked by:** 13, 14.

**What to build:** Deliver Lesson 5 Tasks 1–6, including long ē and the child's own coordinated pointing and speech.

**Acceptance criteria:**

- [ ] All six tasks preserve source items, review, oral/printed slow-fast distinctions, required responses and support routes.
- [ ] The printed target is ē where prescribed, with verified glyph/diagram fidelity; this does not change the later plain-e writing target.
- [ ] Child-pointed practice keeps speaking/touch roles and stable anchors, and resumes the exact item/turn after interruption without inferred correctness.

## 18 — Rhyme and read connected sounds to finish Lesson 5

**Blocked by:** 17.

**What to build:** Complete Lesson 5 Tasks 7–9 with m rhyming, child-pointed/voiced ēm/ēs and e/a writing.

**Acceptance criteria:**

- [ ] Rhyming displays the supplied initial symbol while the parent supplies the oral ending; preserve models, questions and child slow/fast turns without revealing oral answers as reading targets.
- [ ] Connected-sound touching/voicing follows the source's gesture and correction/retest paths, including restart within support.
- [ ] Writing uses plain e then a; all nine Lesson 5 tasks are covered and lesson completion is derived from actual accepted work.

## 19 — Complete every Lesson 6 task

**Blocked by:** 18.

**What to build:** Deliver all eight Lesson 6 tasks, including m/s rhyming, mē/sē and plain-e/s writing, then reach the supplied content boundary.

**Acceptance criteria:**

- [ ] Preserve every printed/oral slow-fast response, child pointing/speaking role, rhyme, supplied correction and retest across all eight tasks.
- [ ] Writing uses plain e then s; saved work and optional skip behave consistently with earlier lessons.
- [ ] The completed six-lesson catalog contains exactly the 45 supplied tasks, with source coverage evidence and no fabricated Lesson 7 or promised automatic mastery.

## 20 — Install content and cold-launch teaching offline

**Blocked by:** 08.

**What to build:** Install a verified immutable runtime package and reopen the complete installed teaching experience without connectivity.

**Acceptance criteria:**

- [ ] Validate package identity, schema/capabilities, hashes and signatures against fixed test vectors; unsupported or damaged packages never become active.
- [ ] Bundle/cache the shell, worker/WASM, guides, fonts and runtime material needed for installed tasks; cold-launch and resume a correction and writing phase offline using real browser storage.
- [ ] Display truthful installation/missing-content states and preserve personal data if content is unavailable. Separate internal development packages from publication-approved assets; original scans are excluded from runtime packages.

## 21 — Update content without changing saved teaching

**Blocked by:** 20.

**What to build:** Activate a revised cumulative course package while existing runs and drawings retain their exact pinned curriculum.

**Acceptance criteria:**

- [ ] New task runs use the selected active package; unfinished and completed work can reopen with its original source graph, guide assets and compatible ink decoder.
- [ ] Crash/restart across staging, file/cache publication, SQLite activation and cleanup reconciles to an intact old or new usable package without dropping saved work.
- [ ] Retention/garbage collection respects all live/saved references; use revisions of supplied Lessons 1–6 as update fixtures rather than inventing later lessons. Incompatible migrations or rollback refuse writable access safely.

## 22 — Export a protected offline-complete parent backup

**Blocked by:** 07, 09, 10, 20.

**What to build:** A gated parent action creates a passphrase-protected portable backup of selected children's saved work and required runtime content.

**Acceptance criteria:**

- [ ] Capture a consistent snapshot of progress, current runs/Undo, correction/review context, canonical ink/history, profile preferences including the stable avatar ID, and all pinned runtime versions needed for offline recovery; exclude raw scans and development artifacts.
- [ ] Use reviewed authenticated encryption and a qualified passphrase KDF/format with tamper/version test vectors and bounded resource limits. Explain passphrase responsibility and lack of account recovery using highlighted added copy.
- [ ] A real exported archive can be decrypted/validated by the backup reader fixture; cancelled/failed export leaves teaching and personal records unchanged, and diagnostics never capture secrets.

## 23 — Restore backups as new profiles and resume offline

**Blocked by:** 22.

**What to build:** A parent imports a protected backup, previews/renames its profiles and resumes their unfinished teaching without a network connection.

**Acceptance criteria:**

- [ ] Wrong passphrases, corruption, unsupported formats/codecs, unsafe ownership references and oversized archives fail safely before activation or personal-data mutation.
- [ ] Restore creates new profile identities even when names collide; remap owned references consistently while preserving curriculum identity, Undo, progress, editable ink and avatar preferences. Missing or unsupported avatar keys use the non-mutating display fallback. Existing profiles remain unchanged.
- [ ] Preview/cancel and interrupted import are safe; successful restore includes pinned runtime material and resumes a correction/review and writing phase offline without a silent merge or overwrite.

## 24 — Recover from storage failures without false progress

**Blocked by:** 11, 21, 23.

**What to build:** Keep teaching and saved work recoverable through failed commits, quota exhaustion, worker loss, migrations and damaged/unavailable local state.

**Acceptance criteria:**

- [ ] Fault-injected real-driver scenarios preserve acknowledged work, command identity and buffered ink, stop unsafe teaching/cues, and offer explicit available recovery actions without optimistic acceptance or silent reset.
- [ ] Exercise ownership/foreign-key rejection, single-owner/multiple-tab behavior, generation/revision conflicts, receipt pruning, ink compaction, package activation and migrations through restart.
- [ ] Help/save failure, Retry, missing pinned content, unsupported codec and corruption show accurate highlighted recovery copy; parent backup/reimport paths do not overwrite existing valid work.

## 25 — Pass the complete SPA functional handoff gate

**Blocked by:** 12, 16, 19, 24.

**What to build:** Demonstrate the entire production feature set working in the SPA before native adaptation starts.

**Acceptance criteria:**

- [ ] All 45 tasks pass source coverage and functional teaching/correction/review/writing paths, including the six target orders, plain-e distinction, selective review and parent judgments.
- [ ] Exercise avatar onboarding, confirmed/cancelled avatar edits, profile switching, source-based parent preparation, override/replay, Back versus Undo, saved editable ink, offline cold start, content updates, protected backup/restore and failure recovery together; retain reproducible real-driver evidence.
- [ ] Verify the approved map and title-first task-module flows, avatar/profile separation, long-title layouts, stationary interaction feedback, cancellation-safe cues, stable anchors, highlighted copy, keyboard/screen-reader parent access, landscape/window recovery, no ads/external analytics and the shared import boundaries. Resolve gate failures before Expo work; this is functional correctness, not an educational-efficacy study.

## 26 — Run the first teaching task natively with Expo

**Blocked by:** 25.

**What to build:** Open native iPad/Android builds and deliver/resume Lesson 1 Task 1 through the shared engine and actual native SQLite store.

**Acceptance criteria:**

- [ ] Use Expo Router, native screens and shared contracts/design tokens; adapt profile/parent access and map entry needed for the flow without embedding the lesson in a permanent WebView.
- [ ] The shared Drizzle schema, ordered checksummed migrations and repositories operate through expo-sqlite with qualified transaction/durability settings; the same teaching/storage fixtures agree with the browser adapter.
- [ ] AppState/Query/cue lifecycle bindings preserve committed position through restart/backgrounding; stale callbacks never advance. Select and pin compatible supported SDK/modules and record the tested build baseline.

## 27 — Deliver every reading activity on native screens

**Blocked by:** 26.

**What to build:** Run all non-writing tasks with native parent guidance, printed/oral activities, pointing, rhyming, correction and review.

**Acceptance criteria:**

- [ ] Port each activity family using the same authored graphs and source-aware projections; all 39 core tasks have executable native paths with no dropped source obligations.
- [ ] Retain the approved illustrated lessons-only map, title-first activity modules without avatar portraits, separate gated parent settings, truthful progress, direct parent entry, replay/resume, Back and current-run Undo semantics across profiles.
- [ ] Native touches/cues, accessibility and interruptions preserve stable anchors, speaking/touch roles and support return points; native UI checks cover each distinct family.

## 28 — Write, edit and resume all six tasks with native ink

**Blocked by:** 26.

**What to build:** Use finger and supported stylus input for every sound-writing task in the native application.

**Acceptance criteria:**

- [ ] A qualified native renderer/input adapter preserves canonical geometry, parent/practice layers, tracing and independent phases, target orders and parent confirmations without a WebView ink surface.
- [ ] Undo/redo/Clear, restart, input cancellation, multitouch/palm behavior and transition fencing pass shared history/recovery fixtures on the real native executor.
- [ ] Saved native drawings reconstruct through the portable format with no source-guide substitution; run preliminary physical-device latency checks during continuous drawing and saves, addressing blocking renderer issues before qualification.

## 29 — Install, update and recover native offline content

**Blocked by:** 26.

**What to build:** Cold-launch and resume installed native lessons offline, including after interrupted content or application updates.

**Acceptance criteria:**

- [ ] Implement bundled/file content and verification adapters with the same package hashes/signatures/capabilities and golden vectors; retain exact pinned versions for saved work.
- [ ] Native file/SQLite staging, activation, cleanup and process-loss recovery pass update/migration fixtures without missing assets or dropped personal records.
- [ ] Run native commit/quota/unavailable-content/corruption recovery paths with safe highlighted guidance, no false progress and no silent reset.

## 30 — Back up and restore native profiles offline

**Blocked by:** 28, 29.

**What to build:** Export/share and import protected parent backups from native tablets and resume restored work offline.

**Acceptance criteria:**

- [ ] Qualify SDK-compatible crypto/KDF and file/share adapters against the shared format/vectors; interoperable SPA/native fixtures preserve progress, Undo, ink/history, avatar preferences and pinned content. Unsupported avatar IDs retain their saved values and render the default.
- [ ] Gate file/share actions; restore previews/renames into new identities, retaining existing profiles and rejecting invalid archives before activation.
- [ ] Device tests cover wrong passphrase, cancellation, resource bounds, process interruption and offline resume from restored correction/review and writing context; secrets never enter diagnostics.

## 31 — Finish native landscape, accessibility and parent privacy flows

**Blocked by:** 27, 30.

**What to build:** Make all native application journeys usable in supported landscape tablet windows with accessible parent controls and safe unsupported-window recovery.

**Acceptance criteria:**

- [ ] Request landscape and validate actual window dimensions on both platforms; portrait/undersized/multitasking windows pause safely while preserving teaching and ink, then restore the same state after rotate/enlarge.
- [ ] Exercise native screen readers, text scaling, contrast, touch targets, reduced motion and the adult-reading gate across avatar onboarding, confirmed/cancelled profile edits, profile switching, source-based parent preparation, settings, deletion, backups and external links; routine teaching controls stay one-tap.
- [ ] Complete native reset/delete/diagnostic privacy checks, copy provenance/highlighting and stable-anchor review. Inventory bundled SDK/data behavior for child-directed declarations; no ads, third-party analytics, accounts or billing.

## 32 — Qualify the iPad release on real supported devices

**Blocked by:** 31.

**What to build:** Produce an evidence-backed iPad support matrix and a release candidate that passes full functional, lifecycle and ink requirements.

**Acceptance criteria:**

- [ ] Pin the supported minimum iPad/device/OS floor from actual testing; exercise all activity families, profiles, Undo, offline packages, protected backup/restore and upgrade/recovery on the real native store.
- [ ] Measure input-to-visible-ink p95 at or below 50 ms during 30 seconds of continuous drawing with saving on each minimum supported physical device; retain timing methodology/clock limits and evidence, not just frame callbacks.
- [ ] Pass landscape/window, accessibility, storage pressure, interruption and distribution-build checks; fix blockers and retain a reproducible signed/release-candidate build with accurate limitations.

## 33 — Qualify the Android tablet release on real supported devices

**Blocked by:** 31.

**What to build:** Produce an evidence-backed Android tablet support matrix and a release candidate that passes full functional, lifecycle and ink requirements.

**Acceptance criteria:**

- [ ] Pin supported device/OS floors and test actual large-screen orientation/resizing behavior rather than assuming the OS honors a requested lock; run all activity families and recovery/backup/update flows on the real native store.
- [ ] Measure input-to-visible-ink p95 at or below 50 ms during 30 seconds of continuous drawing with saving on each minimum supported physical device, retaining trace methodology and physical-device evidence.
- [ ] Pass accessibility, storage pressure, process death, stylus/finger and distribution-build checks; fix blockers and retain a reproducible signed/release-candidate build with accurate limitations.

## 34 — Prepare both tablet applications for public release

**Blocked by:** 32, 33.

**What to build:** Assemble reviewable iPad/Android release artifacts and store submission material for the free Lessons 1–6 application.

**Acceptance criteria:**

- [ ] Produce final source-coverage/asset approval inventories, license notices, build provenance, recovery/upgrade evidence, support/device information, privacy/data declarations and child-directed store metadata matching the actual binaries.
- [ ] Validate the exact runtime assets and backup redistribution scope against supplied approval records; identify missing publication arrangements and provisioning explicitly. Engineering completion cannot fabricate approval, store credentials or store acceptance.
- [ ] Present concrete release candidates, screenshots and submission packages with remaining blockers. Public upload/submission/release waits for actual content arrangements, required provisioning and explicit publication authorization; drafting issues does not perform publication.

## Curriculum coverage ownership

This table assigns first complete executable coverage to a plan ticket. Later integration/native tickets recheck it rather than adding replacement curriculum. Ticket 02 implements part of L1 T1; ticket 03 finishes it. The supplied source inventory contains 45 tasks: 39 core and six optional writing tasks.

| Lesson | Tasks first completed by plan ticket     | Total |
| ------ | ---------------------------------------- | ----- |
| 1      | T1/T4 → 03; T2/T5 → 04; T3 → 05; T6 → 06 | 6     |
| 2      | T1–T7 → 12                               | 7     |
| 3      | T1/T2/T4 → 13; T3/T5 → 14; T6/T7/T8 → 15 | 8     |
| 4      | T1–T7 → 16                               | 7     |
| 5      | T1–T6 → 17; T7/T8/T9 → 18                | 9     |
| 6      | T1–T8 → 19                               | 8     |

Writing targets in source order remain L1 m/s, L2 s/m, L3 a/m, L4 s/a, L5 e/a, L6 e/s. Writing uses plain e; prescribed printed long-e targets retain ē.

## Publication record

The user authorized the updated plan and GitHub publication on October 16, 2026. All 34 issues are published with `ready-for-agent`, body references and 48 verified native blocked-by relationships. The [publication manifest](github-issues.json) records real issue numbers, database IDs, URLs, body hashes and the verification timestamp. [Issue 1](https://github.com/hyetigran/read-at-three/issues/1) is the initial unblocked ticket. The other issues become available as their blockers complete. No parent issue was supplied. This operation publishes engineering tickets only; it does not publish book scans, application builds or store submissions.

Read the tracker back and verify every title, body, label and native dependency with `python3 scripts/delivery-tickets.py`. The explicit `--publish` option creates missing approved issues and dependencies, adopts matching plan markers after an interrupted publication, and refuses mismatched existing content. It does not edit or close existing issues.

| Plan | GitHub issue                                                                                                                | Blocked by                                                                                                                                                                                                                                         |
| ---- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01   | [#1 Reconcile the accepted product and persistence contracts](https://github.com/hyetigran/read-at-three/issues/1)          | None                                                                                                                                                                                                                                               |
| 02   | [#2 Open and resume the first printed-sound teaching turn](https://github.com/hyetigran/read-at-three/issues/2)             | [#1](https://github.com/hyetigran/read-at-three/issues/1)                                                                                                                                                                                          |
| 03   | [#3 Deliver complete printed introduction and review tasks](https://github.com/hyetigran/read-at-three/issues/3)            | [#2](https://github.com/hyetigran/read-at-three/issues/2)                                                                                                                                                                                          |
| 04   | [#4 Deliver oral say-it-fast and selective review](https://github.com/hyetigran/read-at-three/issues/4)                     | [#3](https://github.com/hyetigran/read-at-three/issues/3)                                                                                                                                                                                          |
| 05   | [#5 Deliver continuous oral sound practice](https://github.com/hyetigran/read-at-three/issues/5)                            | [#3](https://github.com/hyetigran/read-at-three/issues/3)                                                                                                                                                                                          |
| 06   | [#6 Complete the first digital sound-writing task](https://github.com/hyetigran/read-at-three/issues/6)                     | [#3](https://github.com/hyetigran/read-at-three/issues/3)                                                                                                                                                                                          |
| 07   | [#7 Edit and recover saved handwriting](https://github.com/hyetigran/read-at-three/issues/7)                                | [#6](https://github.com/hyetigran/read-at-three/issues/6)                                                                                                                                                                                          |
| 08   | [#8 Navigate the Lesson 1 map with truthful progress](https://github.com/hyetigran/read-at-three/issues/8)                  | [#4](https://github.com/hyetigran/read-at-three/issues/4), [#5](https://github.com/hyetigran/read-at-three/issues/5), [#6](https://github.com/hyetigran/read-at-three/issues/6)                                                                    |
| 09   | [#9 Undo accidental parent advances across restart](https://github.com/hyetigran/read-at-three/issues/9)                    | [#8](https://github.com/hyetigran/read-at-three/issues/8)                                                                                                                                                                                          |
| 10   | [#10 Create child profiles with animal avatar onboarding](https://github.com/hyetigran/read-at-three/issues/10)             | [#8](https://github.com/hyetigran/read-at-three/issues/8)                                                                                                                                                                                          |
| 11   | [#11 Reset or delete a child's local data safely](https://github.com/hyetigran/read-at-three/issues/11)                     | [#10](https://github.com/hyetigran/read-at-three/issues/10)                                                                                                                                                                                        |
| 12   | [#12 Complete every Lesson 2 task](https://github.com/hyetigran/read-at-three/issues/12)                                    | [#8](https://github.com/hyetigran/read-at-three/issues/8)                                                                                                                                                                                          |
| 13   | [#13 Introduce short a and printed slow/fast sound practice](https://github.com/hyetigran/read-at-three/issues/13)          | [#8](https://github.com/hyetigran/read-at-three/issues/8)                                                                                                                                                                                          |
| 14   | [#14 Deliver Lesson 3 oral slow-to-fast practice](https://github.com/hyetigran/read-at-three/issues/14)                     | [#5](https://github.com/hyetigran/read-at-three/issues/5)                                                                                                                                                                                          |
| 15   | [#15 Follow the parent's voice and finish Lesson 3](https://github.com/hyetigran/read-at-three/issues/15)                   | [#13](https://github.com/hyetigran/read-at-three/issues/13), [#14](https://github.com/hyetigran/read-at-three/issues/14)                                                                                                                           |
| 16   | [#16 Complete every Lesson 4 task](https://github.com/hyetigran/read-at-three/issues/16)                                    | [#15](https://github.com/hyetigran/read-at-three/issues/15)                                                                                                                                                                                        |
| 17   | [#17 Introduce long ē and child-pointed single sounds](https://github.com/hyetigran/read-at-three/issues/17)                | [#13](https://github.com/hyetigran/read-at-three/issues/13), [#14](https://github.com/hyetigran/read-at-three/issues/14)                                                                                                                           |
| 18   | [#18 Rhyme and read connected sounds to finish Lesson 5](https://github.com/hyetigran/read-at-three/issues/18)              | [#17](https://github.com/hyetigran/read-at-three/issues/17)                                                                                                                                                                                        |
| 19   | [#19 Complete every Lesson 6 task](https://github.com/hyetigran/read-at-three/issues/19)                                    | [#18](https://github.com/hyetigran/read-at-three/issues/18)                                                                                                                                                                                        |
| 20   | [#20 Install content and cold-launch teaching offline](https://github.com/hyetigran/read-at-three/issues/20)                | [#8](https://github.com/hyetigran/read-at-three/issues/8)                                                                                                                                                                                          |
| 21   | [#21 Update content without changing saved teaching](https://github.com/hyetigran/read-at-three/issues/21)                  | [#20](https://github.com/hyetigran/read-at-three/issues/20)                                                                                                                                                                                        |
| 22   | [#22 Export a protected offline-complete parent backup](https://github.com/hyetigran/read-at-three/issues/22)               | [#7](https://github.com/hyetigran/read-at-three/issues/7), [#9](https://github.com/hyetigran/read-at-three/issues/9), [#10](https://github.com/hyetigran/read-at-three/issues/10), [#20](https://github.com/hyetigran/read-at-three/issues/20)     |
| 23   | [#23 Restore backups as new profiles and resume offline](https://github.com/hyetigran/read-at-three/issues/23)              | [#22](https://github.com/hyetigran/read-at-three/issues/22)                                                                                                                                                                                        |
| 24   | [#24 Recover from storage failures without false progress](https://github.com/hyetigran/read-at-three/issues/24)            | [#11](https://github.com/hyetigran/read-at-three/issues/11), [#21](https://github.com/hyetigran/read-at-three/issues/21), [#23](https://github.com/hyetigran/read-at-three/issues/23)                                                              |
| 25   | [#25 Pass the complete SPA functional handoff gate](https://github.com/hyetigran/read-at-three/issues/25)                   | [#12](https://github.com/hyetigran/read-at-three/issues/12), [#16](https://github.com/hyetigran/read-at-three/issues/16), [#19](https://github.com/hyetigran/read-at-three/issues/19), [#24](https://github.com/hyetigran/read-at-three/issues/24) |
| 26   | [#26 Run the first teaching task natively with Expo](https://github.com/hyetigran/read-at-three/issues/26)                  | [#25](https://github.com/hyetigran/read-at-three/issues/25)                                                                                                                                                                                        |
| 27   | [#27 Deliver every reading activity on native screens](https://github.com/hyetigran/read-at-three/issues/27)                | [#26](https://github.com/hyetigran/read-at-three/issues/26)                                                                                                                                                                                        |
| 28   | [#28 Write, edit and resume all six tasks with native ink](https://github.com/hyetigran/read-at-three/issues/28)            | [#26](https://github.com/hyetigran/read-at-three/issues/26)                                                                                                                                                                                        |
| 29   | [#29 Install, update and recover native offline content](https://github.com/hyetigran/read-at-three/issues/29)              | [#26](https://github.com/hyetigran/read-at-three/issues/26)                                                                                                                                                                                        |
| 30   | [#30 Back up and restore native profiles offline](https://github.com/hyetigran/read-at-three/issues/30)                     | [#28](https://github.com/hyetigran/read-at-three/issues/28), [#29](https://github.com/hyetigran/read-at-three/issues/29)                                                                                                                           |
| 31   | [#31 Finish native landscape, accessibility and parent privacy flows](https://github.com/hyetigran/read-at-three/issues/31) | [#27](https://github.com/hyetigran/read-at-three/issues/27), [#30](https://github.com/hyetigran/read-at-three/issues/30)                                                                                                                           |
| 32   | [#32 Qualify the iPad release on real supported devices](https://github.com/hyetigran/read-at-three/issues/32)              | [#31](https://github.com/hyetigran/read-at-three/issues/31)                                                                                                                                                                                        |
| 33   | [#33 Qualify the Android tablet release on real supported devices](https://github.com/hyetigran/read-at-three/issues/33)    | [#31](https://github.com/hyetigran/read-at-three/issues/31)                                                                                                                                                                                        |
| 34   | [#34 Prepare both tablet applications for public release](https://github.com/hyetigran/read-at-three/issues/34)             | [#32](https://github.com/hyetigran/read-at-three/issues/32), [#33](https://github.com/hyetigran/read-at-three/issues/33)                                                                                                                           |
