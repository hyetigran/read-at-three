# PRD: Reading together — Production application

**Status:** Accepted production specification, reconciled October 16, 2026. Implementation and runtime qualification remain outstanding.

This document, the [architecture](ARCHITECTURE.md), and its storage/stack/acceptance appendices implement the accepted [interview decisions](docs/design-interview.md) and [ADRs](docs/adr/0001-build-spa-before-expo.md). The interview and earlier architecture review remain historical evidence. Superseded proposals do not override the current contracts. Subsequent authorization covers engineering implementation, PR review and merge; content publication remains a separate pending release input.

## Current delivery deferral

On October 21, 2026, the user paused protected-backup security qualification to continue other application work. [Issue #22](https://github.com/hyetigran/read-at-three/issues/22) remains open, and its implementation is preserved on `codex/issue-22-protected-backup`. The production backup policy remains disabled. Backup and dependent restore flows must not be presented as available recovery actions while this work is deferred.

Remaining work includes combined-workload qualification, reviewed finite resource limits, security fault checks, and final independent review and CI. Existing passing tests cover specific cases and do not establish production readiness. This deferral does not authorize weaker encryption, unencrypted exports, data deletion, or bypassing validation.

Development continues on independent teaching, handwriting, and local-storage recovery work. The backup-dependent portions of issues #23 and #24 remain pending. Their completion and the complete SPA handoff must account for this open requirement. Resume backup qualification through issue #22 before enabling backup or restore or claiming those requirements complete.

## 1. Product goal and release scope

Build a complete, production-ready reading application for a three-year-old beginner and their parent. Use **Teach Your Child to Read in 100 Easy Lessons** as the curriculum and the inspected **Reading.com** screens as the interface reference.

The first content release includes **Lessons 1–6: all 45 supplied tasks**, with functioning digital handwriting. It must meet the application's production quality requirements: complete teaching flows, durable progress, responsive touch interactions, offline lessons, finished interface assets, and a tested release process.

The remaining **94 lessons** will be added to the same production application as the user supplies them. This is staged curriculum delivery. There is no prototype phase, proof-of-concept milestone, or research-study gate before expansion. New content undergoes the same curriculum and release checks as the initial lessons.

Existing assets are the six-lesson transcription and source records, a Lesson 1/Task 1 interaction, and nine low-fidelity wireframes. These inform implementation; they are not the production application.

## 2. Product decisions

| Area                 | Requirement                                                                                                                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Teaching model       | Parent-led, following the selected Reading.com model. The parent reads, models, listens, corrects, praises, and advances.                                                                                                                                                             |
| App role             | Present the supplied steps and silent pointing aids; organize repetition, correction, navigation, digital writing, and progress.                                                                                                                                                      |
| Child avatar         | During onboarding, offer a child-friendly choice of a cute bundled animal to represent the child. Reuse the choice in the profile button and profile list. Animal portraits identify children; task modules use activity illustrations.                                               |
| Child role           | Watch, listen, speak, point, trace, and write where prescribed. The child does not need to read interface instructions.                                                                                                                                                               |
| Curriculum authority | The supplied book determines content, order, turn-taking, timing, and corrections. Reading.com supplies interface references.                                                                                                                                                         |
| Product scope        | Lessons only. A full-width lesson map; no Books/Games/Videos sidebar.                                                                                                                                                                                                                 |
| Content origin       | Prefer book wording. Added or adapted visible text must have a distinct highlight or color, including navigation labels and condensed directions. The current yellow convention applies until the user chooses another treatment. This requirement also applies to the production UI. |
| Layout stability     | Parent panel, target symbols, pointing aids, writing surface, and navigation remain anchored when prompts change within an activity.                                                                                                                                                  |
| Handwriting          | Digital handwriting is a required app capability. The book's sound-writing tasks remain optional for the family.                                                                                                                                                                      |
| Expansion            | Add Lessons 7–100 from supplied material. Preserve existing progress when releasing new lesson batches.                                                                                                                                                                               |

**Device experience:** full teaching and digital writing target landscape tablets. Phones, portrait application layouts and permanent public web support are deferred. Request landscape on both native platforms and validate actual window dimensions. Unsupported portrait, undersized or multitasking windows pause teaching/input safely, preserve committed work and pending ink, and offer rotation/window enlargement recovery. An orientation request is not an unconditional OS lock.

**Delivery:** implement the entire application as a React SPA for development, pass the full functional handoff gate, then adapt to React Native/Expo. The first public release is free on both iPad and Android tablets, with no login, purchases, cloud sync, ads or third-party analytics. Exact supported devices/versions require real qualification. The SPA is a full application, not a disposable prototype or a promised public web service.

**Selected technology:** React + Vite SPA, TypeScript, shadcn/ui, TanStack React Query, and Drizzle ORM/Kit over SQLite. React Query owns cached React-facing reads/mutations; committed lesson state and canonical writing remain authoritative in the engine/database. shadcn's DOM components belong to the SPA and need native counterparts in Expo. Formatting uses Prettier's defaults with a pre-commit gate; do not use ESLint or custom Prettier rules. Exact supported versions/devices and distribution channels are established during implementation/release validation.

## 3. Curriculum coverage

The supplied material contains **39 core tasks and six optional sound-writing tasks**, totaling 45. All tasks must be implemented in full, including optional tasks a family may skip.

| Lesson | Tasks | Progression to preserve                                                                                               | Digital writing targets, in order |
| ------ | ----- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 1      | 6     | Introduce printed m/s; oral say-it-fast and continuous sound practice; review.                                        | m, s                              |
| 2      | 7     | Review m/s; expand oral slow-sound and say-it-fast practice; preserve supported and independent responses.            | s, m                              |
| 3      | 8     | Introduce printed a for short a; slow/fast sound production; parent voices am/sa while the child follows by touching. | a, m                              |
| 4      | 7     | Review m/a/s; oral slow-to-fast practice; parent voices ma/sa while the child coordinates pointing.                   | s, a                              |
| 5      | 9     | Introduce ē; child touches and voices single symbols slowly/quickly; rhyming with m; child touches and voices ēm/ēs.  | e, a                              |
| 6      | 8     | Review slow/fast sounds; child pointing and voicing; rhyming with m and s; child touches and voices mē/sē.            | e, s                              |

When practicing the long-e sound in writing, the book specifies **e without the macron**. The app must preserve that difference between the printed sound symbol ē and the writing target e.

The lesson system must support these distinct patterns:

| Pattern                           | Source examples              | Required behavior                                                                                                                 |
| --------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Printed sound introduction/review | L1 T1/T4; L3 T1/T2; L5 T1/T2 | Parent model where prescribed, child response, required repetitions, correct printed symbols.                                     |
| Oral say-it-fast                  | L1 T2/T5; L2 T2/T5           | Parent supplies spoken parts; child gives the whole response. Do not display the word as a child reading target.                  |
| Oral continuous sounds            | L1 T3; L2 T3/T6; L3 T3       | Preserve model, together, and independent turns exactly where supplied; sustain sounds without inserted pauses.                   |
| Oral slow → fast                  | L3 T5; L4 T4; L5 T4; L6 T5   | Preserve both responses and every supplied item.                                                                                  |
| Printed slow → fast               | L3 T4; L4 T3; L5 T5; L6 T1   | Preserve holds and rapid pointing gestures; distinguish sustained sounds from quick responses.                                    |
| Parent speaks, child points       | L3 T6/T7; L4 T5/T6           | The child follows the parent's voice; retain that division of responsibilities.                                                   |
| Child points and speaks           | L5 T6/T8; L6 T4/T7           | Coordinate movement and speech for single symbols and connected sequences.                                                        |
| Rhyming                           | L5 T7; L6 T3/T6              | Display the initial symbol; parent supplies the oral ending. Preserve models, questions, and slow/fast child turns.               |
| Digital sound writing             | Last task of each lesson     | Parent demonstrates; child traces and independently writes while saying the sound. Preserve the supplied targets and repetitions. |

A task title alone does not identify its interaction. **SAY THE SOUNDS** can describe an oral exercise, parent-voiced pointing, or child pointing and speaking. Map each task's actual source steps to its interaction.

Oral prompts may contain sounds whose printed symbols have not been introduced. The child's printed practice area follows the symbols prescribed for that particular task. Printed two-symbol exercises retain their source role; Reading.com's curriculum milestones do not determine our lesson content.

## 4. Parent and child journey

1. **Prepare:** the parent can read relevant preparation material from the supplied introduction/practice guide. Newly written interface explanations are visibly distinguished from source wording.
2. **Choose an animal:** after the parent sets up a local profile, let the child choose a cute animal avatar. Show a clear selection and confirm it before applying it to that profile. Keep a default available without requiring a name, photo or birth date. The chosen animal appears beside that child throughout the app. Parents can reopen the choice through profile settings; cancelling leaves the prior avatar unchanged.
3. **Open the map:** show available lessons, the next lesson, and a resume destination for unfinished teaching. Completed lessons remain available for repetition.
4. **Open a lesson:** present its actual task titles and order. Continue into the next unfinished task or revisit completed work.
5. **Deliver a task:** show the parent action, spoken script, expected response, and child-facing target. The parent starts or performs the prescribed pointing cue.
6. **Judge the response:** the parent advances, repeats, or uses the supplied correction. A timer or touch event does not establish a correct spoken response.
7. **Correct and retest:** present the source support sequence and return to the prescribed test step. Preserve assisted/together turns and repeat-until-firm loops.
8. **Write digitally:** for a writing task, the parent demonstrates on the canvas, the child traces the model, and then writes independently while saying the sound. The parent supplies the book's feedback and confirms progress. The family may skip this optional task.
9. **Finish or pause:** complete a task only after its full supplied sequence. Offer the next task or pause; retain unfinished teaching and handwriting.
10. **Finish a lesson:** all core tasks are complete and optional writing is either completed or explicitly skipped. Make the next available lesson accessible.
11. **Reach the current content boundary:** after Lesson 6 in the initial release, retain progress and access to earlier work. Newly supplied lessons become available through content releases; unavailable lessons are not generated.

The initial animal catalog contains Rabbit, Fox, Bear, Owl, Turtle, Bird, Frog and Cat with original bundled art and stable keys. Avatar choice is a cosmetic profile preference, stored locally and included in complete profile backups. Changing it does not alter lessons, progress or handwriting. All added onboarding wording follows the yellow provenance treatment.

Parent controls manage progress; child touch input operates the current learning activity. A brief celebration follows completion without interrupting teaching or supplying an answer.

## 5. Digital handwriting requirements

Digital writing is integrated into every supplied **SOUNDS WRITING** task. Its educational purpose remains sound-symbol practice, with the parent judging the response and using the book's praise. It must provide real freehand ink, not a tapping exercise or an illustration of tracing.

| ID  | Requirement                                                                                                                | Acceptance criteria                                                                                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | Finger drawing and supported stylus input. A stylus is optional; pressure is not required to produce readable ink.         | Continuous marks appear under the finger/stylus, including separate strokes, dots, curves, and overlapping strokes. Every target can be drawn on a supported physical device.                                                                                                         |
| H2  | Parent demonstration, child tracing, and independent writing. Keep the parent model separate from the child's ink.         | Parent can draw the demonstrated letter; it remains visible as a faint tracing guide. Child can trace it and then make additional letters on the line. Clearing child ink does not erase the parent model.                                                                            |
| H3  | Source-aligned letterforms and line guides. Preserve baseline/midline relationships and adapt their size to the device.    | Compare guides and letter models with the source scans. Writing uses m/s/a/e in the required order, with plain e for long-e writing. Added digital guidance is highlighted.                                                                                                           |
| H4  | Support the book's tracing repetitions and space for three to five independently written letters where prescribed.         | Parent can repeat tracing and oversee the required practice. The app does not automatically equate a stroke count with a letter or a completed repetition.                                                                                                                            |
| H5  | Undo, redo, and clear the child's current practice area. Keep tools simple and stable.                                     | Undo removes the last stroke; redo restores it. Clearing can be undone. Controls do not overlap the writing area or cause accidental lesson advancement.                                                                                                                              |
| H6  | Capture writing without triggering page scroll, zoom, or navigation. Handle extra contacts and interrupted input.          | A drawing gesture remains a drawing gesture. Secondary contacts do not create stray strokes. Backgrounding, pointer cancellation, or interrupted stylus contact leaves recoverable work and no stuck drawing state. Use platform palm rejection when available.                       |
| H7  | Save strokes and the writing phase locally. Store canvas-independent coordinates so resizing does not distort the drawing. | Leaving, backgrounding, restarting, or resizing restores the parent model, child ink, current letter, trace/free-writing phase, and unfinished task. Saving occurs after completed strokes and at lifecycle checkpoints.                                                              |
| H8  | Keep drawing responsive.                                                                                                   | Target: ≤50 ms p95 input-to-visible-ink latency during a 30-second continuous writing run on each minimum supported physical device. Verify with input/render timing measurements, not visual impressions alone.                                                                      |
| H9  | Parent-controlled writing feedback and completion.                                                                         | The parent confirms tracing once per target and independent writing once per target after the prescribed practice, with extra practice available. Preserve sourced feedback. No stroke count or penmanship score replaces parent judgment. Optional skip is separate from completion. |
| H10 | Preserve independent attempts and source sequence.                                                                         | Tracing does not silently replace free writing. Changing to the next letter requires the prescribed practice and parent-controlled progression; earlier saved work remains associated with its target.                                                                                |

The parent may demonstrate directly on the device, matching the book's “that I made” scripts. Any built-in demonstration or stroke-order animation must be reviewed against the source before being used as instructional content.

Paper practice may remain an alternative, but does not replace the required digital experience. Handwriting recognition and automated grading are separate, unselected features; basic digital handwriting does not depend on them.

## 6. Lesson flow and interface requirements

| ID  | Requirement                                                                                          | Acceptance criteria                                                                                                                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Encode all 45 tasks and every supplied target, prompt, repeat, praise, and correction branch.        | A source-to-runtime review identifies each lesson/task/step/item with no missing content or changed order.                                                                                                                                                                                                                              |
| C2  | Preserve book words and instructional emphasis. Separate spoken text from parenthetical actions.     | Compare screens against Markdown and scans, including pauses, emphasis, phonics glyphs, and gesture diagrams.                                                                                                                                                                                                                           |
| C3  | Classify copy as source wording or addition/adaptation. New unreviewed copy defaults to highlighted. | Every visible text item has an origin classification. Highlights remain visible across themes and release builds.                                                                                                                                                                                                                       |
| F1  | Correct turn ownership; no universal model → together → child template.                              | L1 T1 retains model → child → repeat; prescribed together turns remain; L3/4 guided pointing stays parent-voiced.                                                                                                                                                                                                                       |
| F2  | Parent-controlled advancement and repeat-until-firm loops.                                           | Normal progression cannot bypass mandatory repeats, target items, or slow/fast response pairs. No automatic passing score is introduced.                                                                                                                                                                                                |
| F3  | Immediate, interruptible corrections that return to the right test step.                             | Exercise pronunciation/no-response, response-speed, interrupted blending, and pointing-coordination corrections from the source without accidental advancement.                                                                                                                                                                         |
| F4  | Silent pointing aids match prescribed timing and gestures.                                           | Continuous sounds receive 3+ second holds where specified; rapid gestures remain rapid. Connected sounds have individual holds without an inserted pause. Child-controlled pointing remains possible where prescribed.                                                                                                                  |
| F5  | Support physical parent assistance where the book calls for it.                                      | The parent can guide the child's finger, repeat supported practice, and retry independently. Assisted interaction does not produce a false success score.                                                                                                                                                                               |
| F6  | Back, repeat, pause, and resume preserve teaching context.                                           | Restore lesson, task, item, turn, repeat/correction state, and writing phase. Interrupted cues restart; they do not complete in the background.                                                                                                                                                                                         |
| F7  | Keep completion, optional skipping, and parent judgments distinct.                                   | Task totals remain 6/7/8/7/9/8. A skipped writing task is marked skipped. Undo withdraws only current-run acceptance; earlier valid run credit remains. Completion is not labeled mastery.                                                                                                                                              |
| U1  | Reading.com-inspired layout with the approved simplifications.                                       | Illustrated green map, turquoise river/bridge, six blue lesson pedestals, title-first task modules, pink/white top parent panel and navy printed targets. Map opens the selected lesson menu, then that task's teaching. Parent settings are separate and gated. No unrelated sidebar or transcript detour.                             |
| U2  | Parent guidance stays in the top panel.                                                              | No redundant bottom instruction repeats the current direction. Bottom content has a specific reference or control purpose.                                                                                                                                                                                                              |
| U3  | Stable positions throughout each activity.                                                           | Script changes, repeats, corrections, and handwriting prompts do not move targets, controls, or the canvas unexpectedly. Long copy remains fully visible.                                                                                                                                                                               |
| U4  | Touch accessibility and responsive layout.                                                           | Large non-overlapping targets, readable type, accessible parent controls and reduced motion on supported landscape tablet windows. Qualify text scaling and the minimum usable viewport. Unsupported windows preserve state in recovery; no 320px or portrait teaching layout is promised.                                              |
| U5  | Finished production presentation.                                                                    | Use original/approved art and the high-fidelity reference, without treating sample flows as production implementations. Task cards lead with exact source titles and task numbers, compact activity art and an entry affordance. Long titles fit; seven-to-nine-task lessons scroll naturally. Animal portraits identify profiles only. |
| F8  | Distinguish Back, Undo advance and ink Undo.                                                         | Back revisits context without changing acceptance. Undo retracts accepted advances to the current task run's start, including just-completed work, and survives restart. Starting another run for that child closes the old Undo window; switching profiles does not. Retain ink and earlier valid run credit.                          |
| F9  | Recommend sequence with explicit parent override.                                                    | Parents may open any installed lesson/task. In-task required turns remain enforced, and unseen earlier work stays incomplete. Access is not earned completion credit.                                                                                                                                                                   |
| F10 | Independent local profiles and accessible parent access.                                             | Each child owns progress, task runs, Undo, ink and preferences. An adult-reading gate protects settings, profile changes, deletion, backup/share and external links. Routine teaching actions remain one-tap. Names, photos and birth dates are not required.                                                                           |
| U6  | Confirmed animal onboarding and polished interactions.                                               | Offer eight bundled animals with clear accessible selection. Continue commits; Back/Cancel discard. Header/profile list share the stable avatar ID. Gated edits and missing-key fallback preserve work. Use stationary hover/press feedback, inset focus and cancellation-safe held cues; no sticky effects or layout jumps.            |

When a task has no specific correction script, use repeat controls and applicable sourced general guidance. Do not fabricate a spoken correction and present it as book text.

The child's practice area does not display the expected oral answer as a printed-word exercise. The chosen parent-led model remains in force; synthesized teaching narration or automatic pronunciation assessment is not assumed.

## 7. Production reliability, storage, and delivery

| ID  | Requirement                                  | Acceptance criteria                                                                                                                                                                                                                                                                                                          |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Durable local progress.                      | App termination, restart, backgrounding, and ordinary updates preserve completion, optional skips, unfinished context, and saved writing. An interrupted save does not leave a partly written progress record.                                                                                                               |
| P2  | Offline teaching and handwriting.            | Once a lesson and its assets are installed/downloaded, all core steps, corrections, writing, and resume work without a network connection. Progress saves locally and the app clearly handles unavailable downloads.                                                                                                         |
| P3  | Versioned curriculum and storage migrations. | New lesson batches and app updates retain existing stable lesson/task IDs and progress. Migrations are tested against earlier stored data; content corrections do not silently change completion or erase drawings.                                                                                                          |
| P4  | Recoverable failures.                        | Missing assets, failed downloads, storage errors, and interrupted updates have usable recovery paths. The app does not show false completion or pretend unsaved work was saved.                                                                                                                                              |
| P5  | Release testing on actual target devices.    | Test the complete curriculum, touch gestures, finger/stylus ink, lifecycle behavior, layout, and performance on the minimum supported hardware/OS and representative newer devices. Desktop-only checks are insufficient.                                                                                                    |
| P6  | Responsible child-data handling.             | Document what is stored and why. Keep handwriting/progress local; provide gated parent reset/delete and allowlisted previewable local diagnostics. No ads, third-party analytics, accounts or automatic diagnostic upload. Do not include child drawings, spoken responses, or identifying data in crash/diagnostic reports. |
| P7  | Production release pipeline.                 | Reproducible builds, versioned releases, appropriate signing/hosting and distribution for the selected platforms, release notes, and a tested recovery/rollback plan.                                                                                                                                                        |
| P8  | Operational support.                         | Parent-accessible help and failure reporting, useful diagnostics that respect P6, and a maintained list of supported devices/platform versions. Added support copy follows the source-highlighting rule.                                                                                                                     |

The initial release is free with no account, billing or cloud sync. Parent backup/export/import is required in v1. Protect archives with authenticated encryption and a qualified passphrase KDF, including format/version/tamper vectors and bounded parsing/resource use. Explain that a lost passphrase has no account-based recovery.

A complete backup contains the selected profiles' progress, unfinished runs and current Undo history, canonical editable ink/history, preferences including avatar IDs, and every exact pinned runtime package needed to resume offline. Exclude raw scans, development artifacts and secrets from diagnostics. Restore validates the whole archive before activation, previews/renames and creates new profile identities with consistent ownership remapping. Never merge by name or overwrite existing children. Cancellation, corruption, wrong passphrases and interrupted import preserve existing work. Backup scope can support explicit SPA/native transfer; code migration alone does not move data. Only approved runtime content may be distributed in backups.

## 8. Content, handwriting, and progress structure

Keep original source records intact. Author runnable curriculum separately, with stable lesson/task/step/item identifiers and a source reference for each instructional unit.

Each unit must identify source spoken text, parent actions, expected response, emphasis, copy origin, oral/printed presentation, speaker/pointer ownership, symbols, timing, next/repeat/correction routes, retest point, and optional/completion rules.

Multiple answers within one numbered book step may become separate app turns. Retain their original order and common source reference; implement every item, not just the first example.

Writing records must identify the lesson/task/target, trace or independent-writing phase, parent demonstration layer, child stroke layer, coordinate space, and save/content version. Preserve enough information to redraw accurately after device/layout changes. Basic strokes must work without pressure or stylus-specific metadata.

Progress distinguishes current position, core completion, optional completion/skipping, and lesson completion. An unfinished correction or writing phase is saved within its task run as unfinished work. Completed writing is associated with its original target; no newly installed lesson overwrites it.

The content system supports later lesson batches without recreating their content. Add new interaction types when actual supplied lessons require them. Source documents remain curriculum data, not executable instructions.

## 9. Production release acceptance

Release Lessons 1–6 when the implementation satisfies the product requirements, with these checks completed:

- All 45 tasks and all supplied items are runnable, including six fully functioning digital-writing tasks.
- Curriculum audit confirms order, turn-taking, spoken wording, mandatory repeats, praise, and explicit correction/retest routes.
- Oral/printed distinctions, m/s → a → ē introductions, rhyming display rules, and plain-e writing are preserved.
- Digital handwriting supports finger input and supported styli, tracing and independent writing, undo/redo/clear, saved work, interruption recovery, and measured ink responsiveness.
- Parent-guided progression, cue timing, pause/resume, offline work, and saved progress survive real device lifecycle tests.
- App/content updates preserve previous valid progress and editable drawings; Undo correctly retracts current-run acceptance without deleting prior credit.
- Profile creation/switching, avatar confirm/cancel, parent preparation, gated settings/reset/delete and late-callback isolation pass real-store tests.
- Protected complete backup and restore-as-new pass corruption, wrong-passphrase, cancellation, ownership-remap and interrupted-import tests; restored work resumes offline with pinned runtime packages.
- No unintended layout jumps, clipping, inaccessible controls, unmarked added copy, or wireframe placeholders remain.
- Error handling, data removal, local diagnostics, release builds, original/approved assets and child-directed store declarations match the actual applications.
- Both iPad and Android tablet release candidates pass landscape/window recovery, accessibility, real storage/lifecycle and physical ink latency requirements. Phone/portrait layouts are outside this release.
- Content-use arrangements, runtime asset approvals, required signing/provisioning and explicit public-release authorization are recorded before public content/build/store publication. These remain pending external inputs, not completed engineering evidence.
- No unresolved defect causes a wrong teaching step, bypassed correction, unusable handwriting, lost saved work, or incorrect completion state.

Resolve transcription ambiguities against scans before publishing runnable content. A known review item is Lesson 2, Task 3, Step 6, whose sh-related OCR strings need scan verification. Unicode approximations and repeated-letter counts are not definitive glyph shapes or duration values.

These are normal production quality checks. Expansion to later lessons is not conditioned on proving educational efficacy or conducting a separate pilot study.

## 10. Implementation and content rollout

| Stage                               | Production deliverable                                                                                                                                 | Completion condition                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1. SPA vertical features            | React/Vite/TypeScript SPA, shadcn, React Query over committed projections, Drizzle/SQLite and portable teaching/ink contracts.                         | Each slice delivers verified source teaching, durable state and its visible UI.                                                          |
| 2. Complete SPA                     | All 45 tasks, corrections/review, real writing, profiles/avatars, parent preparation, map, Undo, offline content/updates, backup/restore and recovery. | Full functional/source gate passes real-driver and UI checks for all accepted behavior. Representative samples do not satisfy this gate. |
| 3. Expo adaptation                  | Native iPad/Android screens, SQLite, lifecycle/files/input/ink and backup adapters using the same domain contracts.                                    | Starts only after stage 2 passes. Shared fixtures agree; native teaching and ink are implemented without permanent WebViews.             |
| 4. Native qualification and release | Both tablet platforms, physical-device performance, accessibility, landscape/window recovery, migrations, privacy and signed builds.                   | Section 9 checks pass and pending content/provisioning/publication inputs are resolved before public submission/release.                 |
| 5. Later supplied lessons           | Add Lessons 7–100 only as the user supplies them, preserving existing work.                                                                            | Each batch passes source coverage and the same production gates.                                                                         |

The application remains focused on the book's lesson curriculum. Standalone games, book/video libraries, and another curriculum's alphabet-name exercises are outside the agreed scope.

## 11. Sources and design assets

Book-bearing source/transcription records and the high-fidelity design viewer remain local authoring inputs, excluded from this public repository until publication arrangements cover them. Existing local paths below identify the authorized working copies; engineering PRs do not publish their contents. The viewer demonstrates layout and sample interactions, not complete runtime teaching or persistence.

- Local lesson transcription and source records are `output/markdown/lessons-01-06.md` and `data/lessons-01-06.source.json`.
- Local parent preparation is `output/markdown/introduction.md` and `output/markdown/overview-and-practice-guide.md`.
- Local design inputs are `output/markdown/instruction-model.md`, `output/markdown/wireframes.md`, and the high-fidelity viewer/reference under `design/high-fidelity`.
- [Reading.com official screenshot gallery](https://www.reading.com/presskit#app-screenshots), [official lesson-use guide](https://support.reading.com/en/articles/8774977), and [sound-slider guide](https://support.reading.com/en/articles/8775489): previously inspected interface and parent/child responsibility references.

Earlier app-spoken proposals and prototype/pilot scope are superseded by the current parent-led, production-application requirements.
