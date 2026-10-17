# Issue tracker

The user selected GitHub Issues in **hyetigran/read-at-three**, with the **ready-for-agent** label, on October 16, 2026.

Use the authenticated GitHub connector or GitHub CLI against this exact repository. Check existing issues before creating tickets to avoid duplicates. Local Markdown delivery plans are planning records, not the issue tracker. The published plan links to GitHub, which owns issue status and blocking relationships.

The user authorized updating and publishing the 34-ticket delivery plan on October 16, 2026. For future breakdowns, publish only after the user approves the proposed breakdown. Create one issue per approved slice, in dependency order. Apply `ready-for-agent` to each issue; this label identifies agent-sized work, while blocking relationships determine which issues can start.

Every implementation PR includes a closing issue reference, such as `Closes #10`. Verify that GitHub recognizes the link. After merging, verify that the linked issue is closed and close it if necessary. Delete the merged PR branch on GitHub and locally after checking that its tip is the merged work. Keep active, unmerged branches.

Use native blocked-by relationships when available, and include the blocking issue references in the issue body. Native relationships use the blocker's numeric issue database ID, not its issue number. If native relationships are unavailable, the body references remain the dependency record. An issue with no blockers states “None — can start immediately.”

Use domain terms from the project glossary and respect the accepted ADRs. Each issue describes observable behavior and acceptance criteria; implementation paths and code snippets stay out of ticket bodies. Do not close or modify a source parent issue as part of publishing a breakdown.

Publication of source scans, book content, application builds, or store submissions is separate from publishing engineering issues. Pending content arrangements remain release inputs; tracker setup does not resolve them.
