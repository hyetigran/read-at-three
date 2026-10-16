# Reading together

Production reading application for Lessons 1–6 of the supplied curriculum, with digital handwriting. Implement the entire application as a React/Vite SPA first, then adapt it to React Native/Expo after the complete functional SPA handoff gate passes.

Selected stack: TypeScript, shadcn/ui for web UI, TanStack React Query, and Drizzle/SQLite. Shared curriculum/session/ink logic and schema stay independent of platform screens. The application projects are not scaffolded yet; the root package currently provides formatting/commit tooling.

- [Product requirements](PRD.md)
- [Architecture](ARCHITECTURE.md)
- [Selected technologies and migration boundaries](docs/architecture/STACK.md)
- Local authoring material includes the supplied transcriptions, source records and high-fidelity viewer. The source-bearing `data`, `output` and `design` directories are deliberately excluded from this public repository while content publication arrangements remain pending. Use the authorized local working copies for source review; engineering PRs do not publish them.

Run `npm ci`, then `npm run format` to format all supported authored files, or `npm run format:check` to verify them. Prettier uses its defaults. ESLint is excluded.

Husky/lint-staged formats staged files and checks project formatting before a commit. Git is initialized on `main`, with `https://github.com/hyetigran/read-at-three.git` as `origin`; the commit hook is activated. The minimal formatting-tooling baseline is committed and pushed. Implementation uses one branch and reviewed PR per issue. Binary assets and generated output are outside source formatting. Local-only authoring artifacts retain their existing formatting and source wording. Application typechecks/tests will be added when the actual app exists.

- [Issue tracker configuration](docs/agents/issue-tracker.md)
- [Published delivery tickets and dependencies](docs/delivery-plan.md)

The 34 delivery tickets are [published on GitHub](https://github.com/hyetigran/read-at-three/issues?q=is%3Aissue%20label%3Aready-for-agent). The updated plan includes avatar onboarding, task-module navigation, interaction polish and parent preparation. All 48 native blocking relationships are verified. Run `python3 scripts/delivery-tickets.py` to check the live tracker against the plan.
