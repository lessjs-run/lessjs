# v0.36.5 Acceptance Criteria

## Exit Criteria

1. `deno task workflow:check` reports v0.36.5.
2. `docs/next/v0.36.4/` includes all mandatory NextVersion files.
3. STATUS, ROADMAP, SOP index, changelog, release notes, and website copy agree
   that the package line is v0.36.4 and the active patch task is v0.36.5.
4. AutoFlow no longer reports missing evidence for the active v0.36.5 package.
5. Local release-truth gates pass or any failure is documented in the PR.

## Evidence Requirements

- Issue #48 exists and is linked from the PR.
- Gate command output is summarized in the PR.
- No package bump is included unless all release gates pass and a separate
  release decision is made.
