# SQLite capacity recovery — issue 24

This change covers the SQLite-full failure category and retained-command recovery. It is a partial increment of issue 24, which remains open. Protected backup/restore, safe parent-selected cleanup, browser-origin quota qualification and the complete SPA gate remain separate outstanding work.

## Behavior

The browser SQLite adapter recognizes the driver's native `SQLite3Error` with primary result code `SQLITE_FULL`. A closed worker response carries only the failure category; neither SQL nor bound values cross the worker boundary as error text. Drizzle's error wrapping preserves the category through the error cause chain.

The existing highlighted failure view explains that storage is full, asks the parent to keep the window open and free device storage, and offers the existing explicit Retry. New input and advancement remain fenced. The controller keeps its pending command and ink buffer; the category does not replace the command, reset the store or grant progress.

## Real-driver scenarios

The tests use synthetic curriculum and `PRAGMA max_page_count` to make the actual SQLite driver refuse growth. They do not replace SQLite execution with a thrown JavaScript exception.

- Two Node SQLite teaching cases fill a bounded database, verify native result code 13, unchanged tables and database bytes, unchanged teaching projection and an idle transaction, then retry the identical command on the same connection or after reopening. A duplicate Retry returns the same receipt without another change.
- The Node ink case preserves an acknowledged stroke when a 2,048-point checkpoint cannot fit. Raising the limit permits the retained checkpoint exactly once; its payload and the original point survive.
- The browser scenario saves three strokes, reloads and resumes the saved turn, applies the real worker database page limit, and draws until the native driver reports full. It verifies the specific parent guidance, disabled advancement, identical retried ink operation and preservation of the three original strokes alongside the retained new stroke. One test-only response is changed to a generic failure after a genuine SQLite refusal, then the next Retry receives the actual capacity response again. This verifies that each Retry refreshes the failure guidance while preserving its operation.

The page-limit mechanism qualifies real SQLite capacity refusal in the selected drivers. It does not establish physical disk exhaustion, browser eviction, permission denial or every browser's origin quota behavior. Clearing application storage is not a recovery step.

## Validation record

The initial browser regression reached native `SQLITE_FULL` and failed because the existing view displayed only generic save guidance. The development and production browser scenarios passed, including the review regression for changing failure categories across Retry. Typechecking, whole-project formatting and boundary checks passed. The full Node regression run is still in progress.
