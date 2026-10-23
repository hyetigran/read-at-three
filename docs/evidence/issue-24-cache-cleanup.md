# Explicit unused-download cleanup during recovery

Issue 24 remains incomplete. This increment adds parent-gated cleanup of unused
lesson downloads while a reading save is pending. Older drawing cleanup remains
available in the same dialog. Teaching and drawing input stay fenced, and closing
the dialog preserves the pending save for explicit Retry.

The portable cleanup command freezes an installation identity and a bounded set
of exact package hashes and collection revisions. Cleanup uses the existing
collector's verified retained-state checks, exclusive namespace ownership,
committed tombstone and deletion claim. It does not perform package admission,
activate a fallback, resume a download or change teaching state. Each target
returns collected, retained or changed. A completed revision can be retried
without erasing a newly downloaded copy of the same hash. A newer collection
revision makes the old target stale. Failed cleanup keeps the original command;
connection recovery precedes resubmission when necessary.

## Evidence boundaries

Real Node SQLite cases cover interrupted deletion and reopened exact Retry,
completed-revision replay, downloading the same hash again, stale revisions,
late retention roots, wrong installation identity and tombstone-write rollback.
The fixture creates cache namespaces on writes, matching browser CacheStorage,
so merely checking an already completed cleanup cannot recreate an empty cache.

The browser fixture builds and installs the real signed application shell with
synthetic lesson packages and temporary signing keys. It downloads and cancels
an update, leaves a drawing finalize pending, goes offline, grants the parent
gate and removes unused downloads. A fault after an actual CacheStorage entry
deletion tests partial cleanup. Assertions compare exact retry targets, retained
active-cache byte hashes, the original finalize operation, and saved ink after
offline reload. The pending finalize uses a transport fault before execution;
this is not evidence of physical disk or origin quota exhaustion. The separate
capacity recovery test exercises native SQLite capacity refusal. A second case
drops the completed cleanup reply and retires the connection. Explicit Retry
reopens storage, reuses the identical cleanup targets without another erase,
and recovers the original pending ink operation before offline reload.

Bringing up this installed fixture exposed a signed service-worker registration
failure in the test Chromium with the existing large library output. Isolated
worker registration and inert-size probes reproduced the failure independently
of teaching storage. Explicit output minification reduced the worker from about
7.2 MB to 4.6 MB and the actual signed installation passed. This establishes the
observed regression and fix, not a universal browser size limit.

Protected backup/restore, remaining damaged-store recovery, the complete SPA
handoff and native qualification remain separate requirements. Fixture builds
and keys do not authorize publication of book content or runtime packages.
