# Issue 24: damaged-store recovery and explicit Start fresh

This increment implements the destructive recovery action described in
[the recovery architecture](../../ARCHITECTURE.md#84-recovery-states).
It does not complete issue 24 or implement the paused backup/restore work.

## Behavior

Native SQLite CORRUPT and NOTADB errors produce highlighted damaged-storage
copy. The connection stops publishing teaching state and rejects further SQL
except rollback. Opening and Retry preserve the original personal-store files.
Unsupported schemas/codecs and capacity failures keep their distinct guidance.

A separate parent gate and explicit erasure checkbox authorize Start fresh.
The warning covers every child's progress, drawings, unfinished work, settings
and the current window's unsaved work. A durable reset intent precedes erasure
of the fixed personal-store directory under the existing exclusive owner lock.
A pending intent blocks ordinary opening. A completed command receipt makes
identical Retry harmless even after a new store has saved work. See the
[reset protocol](../architecture/STORE_RESET.md) for identity and failure rules.

## Behavioral verification

`tests/browser/damaged-store-recovery.spec.ts` first saves actual drawing
strokes, releases the worker, and changes the actual SQLite file header inside
OPFS. It compares paths, sizes and SHA-256 hashes before and after opening,
Retry and parent cancellation. Only synthetic fixture data is used.

The browser scenarios exercise confirmed reset, failure before reset-intent
close, acknowledgement loss after actual directory removal, and acknowledgement
loss after actual receipt close. The interrupted erase is resumed after reload;
another window cannot create a store while intent is pending. The completed
receipt retry is exercised after a second window creates a new store and saves
new drawing strokes; all files and the new strokes must remain unchanged.
Faults wrap native browser file operations in the test, with no production test
endpoint or replacement SQLite driver.

`tests/browser/installed-store-reset.spec.ts` installs the signed synthetic
six-lesson fixture, saves a drawing, damages the actual store, verifies the
specific recovery route and preservation, explicitly resets, and reinstalls
lessons into a new parent setup. The fixture and signed-shell minification
support are shared with the cache-cleanup increment.

These checks qualify observed browser behavior. They do not establish physical
power-loss durability, device recovery, or backup/reimport compatibility. A
missing or malformed recovery record cannot authorize reset Retry; an absent
record on ordinary opening remains compatible with existing installations.
