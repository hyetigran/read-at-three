# First printed-sound teaching slice

Issue [#2](https://github.com/hyetigran/read-at-three/issues/2) implements the initial model and child-response turns, with an explicit unfinished frontier. No task/lesson completion is granted by this partial package.

The portable teaching engine, immutable command preparation and Drizzle store execute inside one serialized browser worker. The UI receives committed projections through TanStack Query. SQLite owns saved teaching state; there is no memory fallback or optimistic advancement. Exact development package bytes are pinned in storage.

## Verification

The initial suite has 12 Node tests over engine transitions and real SQLite, including file-backed restart, stale/colliding commands, ownership, rollback, lost COMMIT acknowledgment, FIFO reads, full signed-64 counters, migration checksum refusal, missing-cursor recovery and Unicode package bytes. Six boundary validators are precompiled; generation is deterministic and checked in CI.

The browser suite runs against both Vite development and built production workers with explicit synthetic, non-book fixtures. It verifies parent-only acceptance, cancellation-safe held cues, stable layout anchors, unfinished-frontier restart, a full browser-process restart, unavailable durable storage, competing-tab recovery, portrait recovery, the 900×600 minimum teaching window, real OPFS initialization failure without deleting saved bytes, and identical-command retry after a committed reply is lost. The dependency-preservation test hashes every seeded pool file before and after a held-file initialization failure.

Local source review uses the supplied printed page 31, Lesson 1 Task 1 steps 1–2. Parent actions and spoken wording are separated from the child's expected answer. Regularized sound transcription is marked adapted; app-added copy is highlighted. The m target and pointing geometry were checked against the supplied scan. The local source-review manifest records input hashes. Browser screenshots and source-bearing runtime packages remain ignored under `.local`; they are not public CI fixtures or published assets.

Commands: `npm run content:prepare` for authorized private source, `npm run validators:check`, `npm run typecheck`, `npm run check:boundaries`, `npm test`, `npm run test:browser` and `npm run test:browser:build`. Run `npm run format` and `npm run format:check` before every commit. Public CI uses `READING_CONTENT_MODE=fixture`.

## Limits

This evidence covers the first development slice on Node 22.19.0 and headless Chromium 156. It does not complete the remaining source turns, corrections, all 45 tasks, ink, profiles, Undo, offline installation, protected backup, published-schema upgrade matrix or native adapters. Physical tablet accessibility, touch/stylus, lifecycle and latency qualification remain release gates. Unsigned private development content is distinct from approved signed runtime releases; publication arrangements remain pending.
