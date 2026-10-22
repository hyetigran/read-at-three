# Content catalog contract

The React SPA uses portable teaching commands and Drizzle SQLite ownership. Web CacheStorage, Web Locks and application-shell verification remain platform adapters. This contract covers versioned Lessons 1–6 packages; it does not author later lessons, publish supplied source material or implement backup/restore.

## Parent actions and committed evidence

`readLessonFiles` projects configured offers, exact original commands, receipts, connection-local acquisition observations and package byte observations. `changeLessonFiles` accepts version-1 `lesson-files` commands. Each command retains its complete canonical preimage, payload hash, installation/command identity, target, expected activation witness and action. Query caches these committed projections and never optimistically changes activation.

Download records intent and a durable target hold before network acquisition. A verified download registers an inactive package and returns Ready. The parent separately chooses Use these lessons. Use references that exact Ready command/payload identity, freshly verifies content and shell resources, and commits activation, fallback, revision and its receipt together. Unavailable acquisition, quota and interruption remain retryable observations beside accepted intent. Reads and startup reconciliation initiate no network acquisition.

Retry resends the original command, including its original activation witness. The projection includes that command so a browser restart can recover exact Retry. Existing exact receipts are read before current-witness or resource checks. Successful Use B retried after C returns its original B receipt and leaves C selected, even if B bytes are missing.

Cancel has its own command and receipt. It fences late registration and releases the original download's pending hold. A terminal Ready result keeps its exact bytes; its separate disposition becomes cancelled. An unfinished accepted Download may settle as cancelled. Old Ready Retry remains Ready after cancellation, but cancelled Ready references cannot authorize Use. A committed Use cannot be revoked by cancelling its consumed download. The parent UI derives pending controls from validated Use/Cancel evidence, rather than treating every historical Ready result as a current offer.

First installation and updates share the same signed registration owner. Registration compares immutable manifest, curriculum, preparation, release and mode identity and refuses a collecting target. The original initial-install version-1 command/fact bytes, `courseAlreadyActive` behavior and revision zero remain readable.

## Metadata, bytes and source pins

Authenticated retained manifests and curriculum/preparation representations are distinct from evictable package bytes. Missing A bytes do not prevent healthy B from opening. Malformed retained metadata or unsupported stored semantics refuse writable admission. Every old session, run, correction route, credit, document, guide and Undo history keeps its exact source package.

Compatible updates preserve existing lesson/task identities, numbers, optional flags and order while permitting appended editorial tasks. Accepted lesson-credit/support snapshots and next-lesson access remain unchanged; an added task starts unseen as additional practice. Removal, reordering and changed existing identities are incompatible. Fresh runs and explicit replay/restart use current activation. Historical View/Resume keeps its saved package. A compatible fallback can change activation for new runs only when it covers the complete activated cumulative lesson/task floor. It never retargets a missing pinned run. Exact Check, explicit signed-file Repair and Resume remain separate actions. Current activation, retained fallback, exact pending Ready intent and owned saved work provide bounded repair anchors; an arbitrary inactive metadata row does not.

Local reconciliation runs outside the coordinator queue at startup and after observed resource failure. A connection has one serialized reconciliation owner; invalidation during an attempt schedules a subsequent pass through that same owner. Complete orphan material may register inactive. Missing/corrupt byte observations preserve authenticated metadata. Pending commands can finish from complete local resources, without reacquisition. Internal fallback holds use exact installation-scoped, versioned owner identities; a replacement reconciliation retires only those prior internal attempts. Other rollback and future export/restore holds remain retained.

## Database admission and version 14

Database versions 0–13 keep their existing verified schema and semantic readers. A genuinely empty DB0 is distinct from an unsupported nonempty unversioned store. Real connection DDL, migration ledger and enforced foreign keys are checked before historical projection. Known absent tables/fields and historical acceptance/cursor modes are handled explicitly. Unsupported metadata or personal semantics refuse before migration, recovery, diagnostic or collection writes. A valid historical store with no installation row may still bootstrap without discarding earlier personal rows.

Migration 14 appends `0013_content_catalog.sql`. Earlier migration SQL and generated statement strings remain unchanged. It adds `lesson_files_command`, `package_hold`, `package_collection`, the `package_retention` view and finite path-closing guards. Accepted/ready-inactive initial targets receive canonical pending holds in the upgrade transaction, including targets with no installed-package row. Original facts are not rewritten.

The positive retention union includes active/fallback packages; every retained child/generation, session and run; terminal/skipped/abandoned work; valid and withdrawn credit provenance; ink/history ownership; pending commands; rollback; and future export/restore holds. Metadata and terminal receipts alone do not retain download bytes forever. Removing drawings or closing Undo does not release another owner's pin.

Package-bearing columns, complete ordered foreign keys and bounded indirect ownership paths have explicit classifications. Generation reconciles the complete deployed foreign-key inventory against those declarations. A newly added package FK on an existing table still needs an explicit decision. Direct and indirect owner declarations must select the exact package field used by the positive union. An indirect metadata parent alone need not retain bytes; a completed retained leaf path does.

AFTER INSERT/UPDATE guards cover every participating path node and ownership change. They see completed post-statement paths and reject references to collecting packages. Deferred foreign keys reject paths left incomplete at COMMIT. No custom COMMIT hook substitutes for those constraints. Unknown schema, omitted classification or a missing/tampered deployed guard refuses collection before deletion.

## Collection and snapshot holds

Collection holds one exact content-hash lock, revalidates the deployed contract and retained semantics, then commits a collecting tombstone only if the positive union is empty. It releases the SQL queue before deleting CacheStorage entries. The adapter requires a private runtime claim bound to mode, hash, tombstone revision, connection lifetime and the still-held lock. Copied, forged, stale and revoked claims provide no deletion authority. There is no public bare-hash erase operation.

New admissions cannot attach to a collecting target. Interrupted deletion retains that exclusion and resumes idempotently with the same revision. Completion changes byte availability to metadata-only and retains immutable representations, command receipts and personal rows. A missing namespace is a valid idempotent deletion result. Reopening an already completed, absent namespace does not start another tombstone generation.

Future snapshot owners atomically capture a snapshot and its complete package set in a short queue/SQL transaction and insert explicit operation-owned holds. They release the queue before acquiring sorted hash locks, then one shell scope. The existing material owner authenticates each namespace under those held scopes and mints the aggregate lease. A brief queued check revalidates snapshot identity and durable hold ownership before consumption. A hold never replaces fresh material verification. Explicit completion/cancellation releases holds; no timer expires them. This machinery is not a backup format or a generic job scheduler.

## Verification boundaries

Structural SQLite tests exercise real deployed DDL/FKs, omission controls, deferred insertion orders and collecting admission. Lifecycle tests call the actual application with signed synthetic six-lesson packages, real SQLite and controlled resource faults. Map-backed resources and simulated lifetimes establish portable behavior only. Production qualification must separately exercise the signed built SPA, real workers, CacheStorage, OPFS, Web Locks and whole-browser restart, including changed parent prompts and guides. None of these establishes React Native/Expo, physical-device, source-publication or store-release qualification.

## Explicit recovery cache cleanup

`readCacheCleanup` lists bounded, unrooted owned namespaces without reconciling offers, downloading, activating a fallback or changing personal state. Each target carries the exact content hash and intended collection revision. `cleanupCache` carries the installation identity and a frozen list of those targets; its Retry reuses that list.

The durable identity of each cleanup is the installation, content hash and collection revision. A missing tombstone admits revision zero; a completed tombstone admits only its next revision; an interrupted tombstone resumes its existing revision. A matching completed revision reports completion without erasing again, including after the same immutable package has been downloaded again. A different revision reports `changed`; newly rooted content reports `retained`. Neither authorizes deletion. Results are per-target observations, not teaching receipts or claims that every currently cached copy was removed.

The existing collector still owns deletion authority: validate the deployed schema and retained semantics, check every retention root, commit the tombstone, then erase under the exact namespace lock and private claim. An unsuccessful tombstone commit permits no deletion. Partial batches retain their original targets so Retry can skip completed revisions and resume interrupted ones. This action does not collect the application shell, change package activation, remove immutable verification metadata or alter teaching commands, progress or drawings.
