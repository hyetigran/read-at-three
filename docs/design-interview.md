# PRD and architecture design interview

**Started:** October 16, 2026. **Status:** Historical decision record. The later authorized issue #1 implementation reconciles all accepted rounds in the current PRD/architecture contracts. Earlier statements awaiting confirmation describe the interview at that time, not a current engineering approval gate. Publication arrangements remain pending.

The user invoked grill-with-docs over the PRD and architecture. Existing detailed architecture policies are proposals unless supported by an explicit user decision. This interview records decisions before changing those policies or implementing the application. No new recommendations below are accepted merely because they appear here.

## Established constraints

- Production application, all 45 supplied tasks in Lessons 1–6, including real digital handwriting. Add the other 94 lessons only when supplied.
- Parent-led teaching; the parent delivers instructions, judges responses, and controls progression. Writing participation is optional for the family; implementing digital writing is required.
- Book curriculum and source wording, with added/adapted visible copy distinguished. Reading.com is the UI/UX reference; the map contains lessons only.
- Full React SPA implementation first, then React Native/Expo. TypeScript, shadcn/ui, React Query, Drizzle, Prettier defaults, and no ESLint.

The [glossary](../CONTEXT.md) records established domain meanings. The [SPA-before-Expo ADR](adr/0001-build-spa-before-expo.md) records the already selected development sequence. Application implementation and runtime acceptance are still absent; formatting tools and hooks exist.

## Decision tree

```text
Production application: supplied curriculum + parent-led delivery
├── Q1 SPA release role [accepted: development SPA, Expo first public release]
│   ├── Maintained public web surface and browser support
│   ├── Public-release order and native-start acceptance
│   └── Whether real parent data must move from browser to native
├── Q2 Initial release audience [accepted: public family product, Lessons 1–6]
│   ├── Onboarding, support and publication arrangements
│   └── Accounts, access, pricing and distribution requirements
├── Q3 Full teaching/writing device scope [accepted: tablets first, phones deferred]
│   ├── Minimum hardware/OS/browser and orientation
│   └── Finger/stylus behavior, layout and physical ink acceptance
├── Q4 Parent interaction granularity [accepted: meaningful turns, praise grouped]
│   ├── Source steps versus app turns, confirmations and repeated practice
│   ├── Correction/retest and writing confirmation behavior
│   └── Accidental advancement and correction of progress records
├── Q5 Curriculum access policy [accepted: recommended sequence, parent override]
│   ├── Suggested sequence versus enforced locks and parent overrides
│   └── Preview, resume, replay and completion/unlock accounting
└── Q6 Child profile scope [accepted: multiple local profiles, no required account]
    ├── Profile creation/switching and separation of work
    └── Reset/deletion, backup and device transfer
```

The user accepted every recommendation in Round 1 with “agree with all recommended.” The interview ends only when the remaining branches are settled and the user confirms shared understanding. Recording these decisions is authorized; implementation is not part of this interview.

## Accepted decisions — Round 1

| ID  | Decision                                                                                                                            | Consequence / still unresolved                                                                                                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Build the full SPA for development; Expo is the first public release. Permanent public web support is not a launch commitment.      | Preserve full SPA functionality and portable logic. Browser support for development and the exact native-start gate still need specification; browser-to-native personal-data transfer is not automatically promised. |
| Q2  | Plan a public family product with all 45 supplied tasks in Lessons 1–6.                                                             | Public release needs explicit decisions on access, pricing, support, content publication, and distribution. None is inferred from production quality alone.                                                           |
| Q3  | Full teaching and digital writing support tablets first. Add phones after a workable writing layout is defined.                     | The current unconditional 320px teaching-layout requirement needs reconciliation. Native platform/device floors and orientation remain to be qualified.                                                               |
| Q4  | One parent advance per meaningful teaching turn; praise stays with its response. Setup sentences do not create extra confirmations. | Preserve required responses and source order. Writing-phase confirmation, repeat ranges, and accidental advancement still need precise rules.                                                                         |
| Q5  | Recommend the curriculum sequence but permit an explicit parent override. Unseen earlier work remains incomplete.                   | Replace mandatory lesson-lock policy. Define override granularity, parent preview, resume behavior, and effective progress without inventing completion.                                                              |
| Q6  | Multiple local child profiles from the first release; accounts are not required to separate siblings' work.                         | Separate progress, drawings and unfinished context. Profile details, switching, backup, optional accounts, reset and transfer remain to be specified.                                                                 |

## Accepted decisions — Round 2

The user again answered “agree with all recommended.” Q7–Q12 are accepted. For Q13 this records the recommended pending status, **not** confirmation of a publication arrangement outside the repository.

| ID  | Decision                          | Recommendation                                                                                                                                                                            | Branches it unlocks                                                              |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Q7  | Launch access / business model    | Free initial Lessons 1–6 release with no login, purchases or cloud sync. Public does not require a commercial service.                                                                    | Optional services, onboarding and entitlement scope.                             |
| Q8  | Device-loss recovery              | Parent-controlled export/import backup in v1, in addition to local restart recovery. Automatic cloud sync remains separate.                                                               | Backup contents, protection, restore collisions and parent-controlled transfer.  |
| Q9  | Native tablet platform scope      | Qualify both iPad and Android tablets for the first public release; publish a tested device/OS support list.                                                                              | Exact supported minimums, physical testing and native distribution gates.        |
| Q10 | Writing confirmation cadence      | Confirm tracing once per target and independent writing once per target; show the prescribed practice counts, permit further practice, never infer letters from strokes.                  | Count/range semantics, writing phases and completion milestones.                 |
| Q11 | Parent override granularity       | Permit entering available lessons or tasks, while normal delivery within a task preserves every required turn. Opening later material never completes unseen work.                        | Suggested next task, explicit starts, preview and replay/resume distinctions.    |
| Q12 | Correcting accidental advancement | Back is navigation; a separate parent Undo last advance withdraws that advance's confirmation while retaining drawings and credit from earlier valid runs.                                | Effective progress reversal, just-completed tasks and command/history contracts. |
| Q13 | Publication-ready content status  | Record existing authorization/approved asset arrangements explicitly; do not infer publication approval from supplied PDFs. Keep engineering separate from this unresolved release input. | Publication assets, content approval ownership and release readiness.            |

Q13 remains a pending release input until actual arrangement/approved-asset details are supplied. Do not repeatedly ask the user to approve the same pending status. Engineering/design can continue; public publication has not been authorized by these replies. Native renderer/driver qualification is engineering evidence, not a preference the user should be asked to guess.

## Accepted decisions — Round 3

The user accepted every recommendation except Q19, explicitly replacing portrait support with **landscape only**. Q14–Q18 and Q20–Q21 are accepted as recommended; Q19 below records the user's replacement decision.

| ID  | Decision                                       | Recommendation                                                                                                                                                                                                   | Consequence / boundary                                                                                                                                                                              |
| --- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q14 | Backup protection                              | Password-protect backup archives with a parent-chosen passphrase.                                                                                                                                                | Sharing a file does not disclose its contents; without an account there is no service to recover a forgotten passphrase. Crypto/KDF implementation remains an engineering decision to verify.       |
| Q15 | Restore collision behavior                     | Restore as new local child profiles, with parent preview/rename; never silently merge by name or overwrite existing work.                                                                                        | Replacing/deleting existing profiles stays a separate explicit action. Validate all identifiers/ownership and preserve source content identity.                                                     |
| Q16 | Backup completeness                            | Include saved work, unfinished context and the installed runtime content required to resume it offline; exclude original scans/development artifacts.                                                            | Exact pinned versions must remain reconstructable. Only runtime content cleared for this use can be packaged; publication arrangements are still pending.                                           |
| Q17 | Parent access boundary                         | Keep routine teaching controls one-tap; protect settings, profile changes, deletion, backup/share and external links behind an accessible adult-reading gate.                                                    | A gate is not an account or proof of identity. Verify store requirements against the implemented behavior before release.                                                                           |
| Q18 | Ads, analytics and child-directed distribution | No ads or third-party analytics in v1; allowlisted local diagnostics only. Prepare child-directed store declarations appropriate for the three-year-old audience.                                                | Free distribution alone did not settle these choices. Category/policy qualification is a release responsibility, not automatic approval.                                                            |
| Q19 | Tablet orientation                             | Landscape only. Portrait is not a supported application layout for the tablet release.                                                                                                                           | Request landscape on each platform and qualify actual window behavior. Preserve state/ink when an unsupported portrait or undersized window appears; never claim an unconditional OS rotation lock. |
| Q20 | Undo advance availability                      | Undo can step backward through accepted advances in the current task run, including its just-completed state, and survives restart. Starting another task run for that child closes the prior run’s undo window. | Stop at the current task run’s start. Back/preview is non-destructive, drawings remain, earlier valid run credit remains. No arbitrary editing of historical completions.                           |
| Q21 | SPA-to-Expo handoff gate                       | All 45 tasks and their teaching/correction/review/writing flows, profiles, progress/Undo, save/resume, offline and backup behavior are functionally implemented and tested in the SPA before native adaptation.  | Shared functional/source correctness first; final native polish and physical-device performance are native release gates. No educational-efficacy study or pilot gate is introduced.                |

There are no further product-preference questions identified in this interview. The remaining frontier is confirmation that the consolidated summary below captures shared understanding. SDK/driver/crypto versions, tested device floors, accessible gate implementation, CI/signing setup and store/device acceptance are engineering qualification or release provisioning; they are not facts the user should be asked to guess. Q13 is a pending external release input, not an approved arrangement. Do not silently promote any qualification to a completed result.

## Consolidated shared understanding — for final confirmation

- **Application and delivery:** Complete production functionality for all 45 supplied tasks in Lessons 1–6, with real finger/stylus digital ink. Build the entire React SPA first for development, then adapt to Expo. Begin native adaptation after the accepted functional/source correctness gate; first public release covers both iPad and Android tablets. Phones and permanent public web distribution are deferred. Tablet application layouts are landscape only.
- **Teaching:** Parent-led and book-faithful. Preserve required responses/corrections/review, separate tracing from independent writing, and confirm writing once per phase per target. One parent advance per meaningful turn, with associated setup/praise grouped. Additional practice is allowed; no stroke count, timer, tap or completion receipt establishes mastery.
- **Presentation:** Reading.com UI/UX reference, original/approved runtime assets, lessons-only map, stable activity anchors, top parent guidance, and highlighted added/adapted copy. Source scans/transcriptions remain authoring references, not automatically cleared distribution assets.
- **Navigation/progress:** Recommended sequence with explicit parent entry to any available lesson/task; unseen work remains incomplete. Normal task delivery preserves all required turns. Back is navigation; Undo advance retracts current-run acceptance, including immediate completion, without deleting ink or earlier valid run credit. Undo can step back within that run, survives restart, and closes when another run starts for the same child.
- **Profiles/access:** Multiple local child profiles. Initial public release is free with no login, purchases or cloud sync. Routine teaching controls are one-tap. Protect parent settings, profile changes, destructive actions, backup/share and external links behind an accessible adult-reading gate.
- **Recovery/privacy:** Local progress and canonical ink, password-protected parent backup/export/import, no account-based passphrase recovery. Backups include work, unfinished context and approved runtime content needed for offline resumption, excluding original scans/development artifacts. Restore as new profiles with preview/rename; no silent merge/overwrite. No ads or third-party analytics; allowlisted local diagnostics only.
- **Technology:** Strict TypeScript, React/Vite, shadcn web components, TanStack React Query over committed reads/commands, Drizzle/SQLite with portable domain contracts, then React Native/Expo adapters/native UI. Prettier defaults, no ESLint, formatting gate before commits. The engine/database owns committed teaching state, not a query cache.
- **Release evidence and pending inputs:** Qualify real devices, offline/durability/restore behavior, native ink latency, accessibility, orientation/window behavior and child-directed store declarations. Publication/content-use arrangements and runtime asset approvals remain pending release inputs. Application implementation and runtime acceptance have not occurred. Settled production quality is not contingent on an educational-efficacy study.

After the user confirms shared understanding, reconcile the PRD, architecture, database/stack/acceptance appendices and project guidance into a consistent specification. This confirmation does not itself request coding, deployment, publishing or contacting a rights holder.

### Landscape-only enforcement qualification

Landscape-only is the user-selected product requirement. Android's current large-screen policies can ignore app orientation restrictions, and Apple's older full-screen compatibility key is deprecated; an Expo orientation setting alone cannot guarantee the usable window's shape on every supported system. Request landscape where available and qualify the actual viewport. An unsupported-layout recovery view must preserve committed state, stop teaching advancement/drawing safely, and request rotation/window enlargement rather than exposing a portrait teaching layout. This is an implementation interpretation to validate, not a guarantee of store acceptance or a reopening of the user's orientation choice.

Primary references checked October 16, 2026: [Android 16 adaptive-layout behavior](https://developer.android.com/about/versions/16/behavior-changes-16#adaptive-layouts), [Android orientation/resizability guidance](https://developer.android.com/develop/adaptive-apps/guides/app-orientation-aspect-ratio-resizability), [Apple TN3192](https://developer.apple.com/documentation/technotes/tn3192-migrating-your-app-from-the-deprecated-uirequiresfullscreen-key), [Expo orientation configuration](https://docs.expo.dev/versions/latest/config/app/#orientation), and [Expo ScreenOrientation](https://docs.expo.dev/versions/latest/sdk/screen-orientation/).

### Store-policy facts informing Q17–Q18

Apple's Kids Category places outbound links/purchases and similar adult-directed actions behind a parental gate, distinguishes a gate from privacy consent, and restricts advertising/analytics. Google requires accurate child-audience declarations and applicable Families requirements. The three-year-old target and parent co-use do not turn this into an adults-only product. These are constraints to verify against the implementation and final store submission; no store approval or legal conclusion is asserted here. Placing backup/file sharing behind parent access is a design recommendation, not a claim that the policies specifically approve our unbuilt export implementation.

Primary references checked October 16, 2026: [Apple Kids guidance](https://developer.apple.com/kids/), [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google Play Families policy](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en), and [Google audience guidance](https://support.google.com/googleplay/android-developer/answer/9867159?hl=en).

## Evidence that prompted the first round

- Architecture §1 treats web as a supported implementation, but the user's SPA-first instruction establishes development order without explicitly promising a maintained public web product.
- PRD U4 promises narrow layouts down to 320px; no minimum usable handwriting area or supported phone/tablet matrix has been selected.
- Lesson 1, Task 1 has model, child response, and repeated response with praise for each symbol. Praise is part of source steps 3 and 6, not a separate numbered step. Screen grouping and parent tap counts are application decisions.
- Architecture §8.5 imposes sequential access and domain-enforced locks. Earlier beginner wireframes show a starting locked state; they do not establish the final override policy.
- Architecture proposes an internal default profile but leaves the one-child/multiple-child interface undecided.
- The word “attempt” refers to a child response in earlier design notes and a complete task delivery in the architecture. Resolve that naming collision when the teaching/progress model is discussed; do not silently equate them.

## Sources

- [PRD](../PRD.md), particularly §§2, 4–8, and 10.
- [Architecture](../ARCHITECTURE.md), particularly §§1, 3, 5, 8, 11, and 18.
- [Stack and migration boundaries](architecture/STACK.md).
- [Database contract](architecture/DATABASE_CONTRACT.md).
- [Lesson 1 source](../output/markdown/lessons-01-06.md), Task 1.
- [Instruction model](../output/markdown/instruction-model.md) and [wireframe decisions](../output/markdown/wireframes.md).
