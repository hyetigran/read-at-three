# Explicit personal-store reset

Start fresh is a separate parent-confirmed destructive recovery action. It is
never an opening fallback. Before confirmation, Retry preserves the original
personal-store files. Confirmation explains that all children’s progress,
drawings, unfinished work and parent settings on this device will be erased,
including the current window’s unsaved work. It does not erase downloaded
lesson bytes directly or provide a backup/restore feature. The new personal store
has no installation metadata, so lessons may need to be installed again.

## Authority and identity

The browser adapter uses the existing `read-at-three.sqlite.v1` exclusive lock.
It closes its old teaching connection before requesting that lock; another
reading owner prevents reset until it releases ownership. It removes only the
owned `.read-at-three.sqlite` directory, never the origin root or arbitrary
paths. Normal opening checks recovery state under the same lock before
initializing SQLite.

A small `.read-at-three.recovery.json` record lives outside the personal store
because the personal database may be unreadable. Its closed, versioned schema,
identity and revision transitions are portable teaching contracts. This record
owns reset intent and the latest reset receipt; it does not own teaching state
or act as a Query cache. Its randomly created recovery identity prevents replay
against a replacement recovery record. The command retains that identity, its
command ID and the expected revision across retries.

The record starts ready at revision zero. A confirmed command first persists
and rereads a resetting record. Only then may the adapter erase the directory.
While resetting, every normal opening is refused before SQLite access. A
reloaded parent flow reads and resumes the same command. After removal, the
adapter persists a ready record at the next revision with the completed command.
An identical completed retry returns without erasing or rewriting anything.
Stale revisions, changed identities and reused IDs with changed payloads refuse
reset. A new reset requires a new explicit confirmation against the current
record. Missing or malformed recovery evidence cannot authorize deletion.

Writes use `createWritable`, close, and strict readback. The
[File System Standard](https://fs.spec.whatwg.org/#api-filesystemfilehandle-createwritable)
describes replacement on close; actual browser fault tests remain necessary.
A failed or lost write acknowledgement leaves the command unresolved. No reset
is authorized merely because a stream was opened or a write was attempted.
Reset Retry refuses a missing or corrupt recovery record. An absent record on
ordinary opening remains compatible with the original store format. This
protocol does not claim a power-loss or device-loss guarantee.

## SQLite-reported damage

The browser recognizes native SQLite CORRUPT and NOTADB result codes, including
extended codes. It does not classify arbitrary error messages as corruption.
Once damage is observed, the worker refuses further SQL except transaction
rollback, suppresses projections and diagnostics, and emits a closed damage
response. The client retires that connection, propagates the safe explanation
and fences input while preserving pending commands and ink. Unsupported formats
retain their separate update guidance; ordinary capacity failures retain their
same-command Retry path.
