# Landscape-only tablet application

**Status:** Accepted user correction on October 16, 2026.

The tablet application supports landscape layouts only; portrait teaching/application layouts are outside the initial release scope. This replaces the proposed portrait support and keeps the shared parent/child activity and writing layout focused. Platform orientation requests are not universal OS guarantees: qualify actual window dimensions and preserve teaching/ink in an unsupported-layout recovery state when necessary. The [interview](../design-interview.md) records this distinction and official platform constraints; no portrait implementation or guaranteed system lock is implied.
