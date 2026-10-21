# Reading together

Production reading application for Lessons 1–6 of the supplied curriculum, with digital handwriting. Implement the entire application as a React/Vite SPA first, then adapt it to React Native/Expo after the complete functional SPA handoff gate passes.

Protected-backup security qualification is paused at the user's request as of October 21, 2026. [Issue #22](https://github.com/hyetigran/read-at-three/issues/22) remains open and the production backup policy stays disabled. Development continues on independent application work; backup-dependent restore and recovery requirements remain pending. See the [PRD delivery deferral](PRD.md#current-delivery-deferral) for the remaining checks and conditions for resuming.

The selected stack uses TypeScript, shadcn/ui for web UI, TanStack React Query, and Drizzle/SQLite. Shared curriculum/session/ink logic and schema stay independent of platform screens. The SPA currently delivers all six Lesson 1 tasks, including printed sounds, oral practice, source corrections/retests and digital sound writing. The parent controls responses, readiness, tracing and independent-writing confirmations. Separate model and child drawing layers persist through the dedicated SQLite WASM/OPFS worker. Undo, Redo and reversible Clear edit the active child practice layer without changing the parent's model or teaching position. Task outcomes, Back/Pause and fresh Replay remain durable. The lesson map, the remaining five lessons, broader application features and Expo adaptation are still being implemented.

- [Product requirements](PRD.md)
- [Architecture](ARCHITECTURE.md)
- [Selected technologies and migration boundaries](docs/architecture/STACK.md)
- Local authoring material includes the supplied transcriptions, source records and high-fidelity viewer. The source-bearing `data`, `output` and `design` directories are deliberately excluded from this public repository while content publication arrangements remain pending. Use the authorized local working copies for source review; engineering PRs do not publish them.

Run `npm ci`, then `npm run format` to format all supported authored files, or `npm run format:check` to verify them. Prettier uses its defaults. ESLint is excluded.

Husky/lint-staged formats staged files and checks project formatting before a commit. Git is initialized on `main`, with `https://github.com/hyetigran/read-at-three.git` as `origin`; the commit hook is activated. The minimal formatting-tooling baseline is committed and pushed. Implementation uses one branch and reviewed PR per issue. Binary assets and generated output are outside source formatting. Local-only authoring artifacts retain their existing formatting and source wording. Run `npm run typecheck`, `npm run validators:check`, `npm run migrations:check`, `npm run check:boundaries` and `npm test` for the implemented contracts. Browser checks exercise real OPFS in development and production builds.

- [Issue tracker configuration](docs/agents/issue-tracker.md)
- [Published delivery tickets and dependencies](docs/delivery-plan.md)

The 34 delivery tickets are [published on GitHub](https://github.com/hyetigran/read-at-three/issues?q=is%3Aissue%20label%3Aready-for-agent). The updated plan includes avatar onboarding, task-module navigation, interaction polish and parent preparation. All 48 native blocking relationships are verified. Run `python3 scripts/delivery-tickets.py` to check the live tracker against the plan.

## Run the development application

Use Node 22.19.0 and npm 10.9.3, then `npm ci`. With the authorized local lesson JSON, overview transcription and matching independent source-review record available, run `npm run content:prepare`, followed by `npm run dev`. Open the printed local URL in a supported landscape Chromium window. Generated content stays in ignored `.local/runtime`; supplied source text is not published in this repository. Missing private content produces an explicit recovery screen. Reviewed cumulative content is generated into `.local/runtime/writing-development-package.json`. Earlier content remains separate and resumable through its exact stored package. Starting another run requires an explicit parent action.

For a source-free engineering checkout, run `npm run content:fixture` and `READING_CONTENT_MODE=fixture npm run dev`. This explicitly selects synthetic test wording; it is not the book curriculum. Use the same environment variable for a synthetic build. `npm run build` otherwise packages the locally prepared development content, which must remain private.

`npm run test:browser` and `npm run test:browser:build` use only synthetic fixtures and real browser storage. Legacy regression cases explicitly select the earlier partial fixture. `READING_CONTENT_VARIANT=legacy` selects the partial package, `graph` selects the earlier printed-task package, `oral` selects the earlier four-task package, and `continuous` selects the five-task package. The default `writing` variant contains all six implemented Lesson 1 tasks. Explicit `content:prepare:continuous` and `content:fixture:continuous` scripts retain the earlier generator, alongside the oral scripts. Task outcomes describe delivered teaching, not mastery. Lesson-wide progress and the other supplied lessons remain separate work. See [ink editing evidence](docs/evidence/issue-07.md), [writing evidence](docs/evidence/issue-06.md), [continuous-oral evidence](docs/evidence/issue-05.md), [oral-task evidence](docs/evidence/issue-04.md), [printed-task evidence](docs/evidence/issue-03.md) and [the earlier slice](docs/evidence/issue-02.md).
