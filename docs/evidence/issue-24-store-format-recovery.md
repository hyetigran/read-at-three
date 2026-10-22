# Unsupported saved-format recovery

This issue #24 increment gives newer database schemas and unsupported canonical
ink versions explicit update guidance. It leaves issue #24 incomplete: damaged
store actions, cache cleanup, paused backup/restore, and the SPA gate remain
separate requirements.

Storage emits a portable typed unsupported-format error. The worker transmits a
closed category without raw database diagnostics. Opening and explicit Retry
preserve that category and display highlighted guidance to update the app to a
version that supports the saved format. They do not offer a writable lesson or
silently reset the store.

The browser fixture first saves real writing through SQLite/OPFS, changes one
format version, and closes the old database connection before reopening. Closing
it is essential: changing a live store underneath the old teaching controller
would allow that controller's shutdown writes to contaminate the preservation
baseline. The test compares every OPFS file's path, size and SHA-256 before and
after rejected opening and Retry. Codec fixtures deliberately bypass the old
schema's version CHECK solely to exercise the reader's unsupported-version path.
This is a test-only input, not a production migration or a claim that arbitrary
future formats can be read by this version.

Verification so far: all four development-browser format cases pass, including
unchanged OPFS hashes after Retry. Three real Node diagnostic-initialization
cases and three corrupt-ink/teaching/acceptance-history preservation cases pass.
Typechecks and portable-boundary checks pass. Production browser qualification,
full-suite CI and independent reviews remain pending. All fixtures contain
synthetic curriculum and writing.
