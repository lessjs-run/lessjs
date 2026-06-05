# v0.36.0 SOP: Hardening and Migration

> Status: Planned\
> Roadmap: Hardening and Migration

## Goal

Turn the v0.31-v0.35 feature line into a stable release candidate and prepare
evidence for the v0.37 public surface reset.

## Entry Criteria

- v0.31 through v0.35 scopes are complete or explicitly deferred.
- No unresolved public API contradictions remain in docs.
- CI gate coverage reflects the release claims.

## Tasks

- [ ] Audit all public exports.
- [ ] Classify APIs as stable, experimental, internal, or deprecated-for-removal.
- [ ] Add docs/API consistency gate.
- [ ] Add generated project matrix for common starter shapes.
- [ ] Add consumer smoke for JSR package graph.
- [ ] Add performance baseline for build, SSR render, and client island boot.
- [ ] Add migration guide from v0.30/v0.31 to v1.0 candidates.
- [ ] Produce public package and subpath inventory for v0.37.
- [ ] Mark package surfaces that should remain public, move to subpaths, become
      internal, or be archived.
- [ ] Remove any stale SOP claims that cannot be proven by code or gates.

## Verification

- full local gate ladder
- generated project matrix
- consumer smoke
- publish dry-run
- www build and e2e

## Non-Goals

- No new feature scope unless it is required to close a blocker.
- No UI redesign.
- No ORM/auth ownership.
- No physical package reorganization; that belongs to v0.37.

## Exit Criteria

- Release claims are proven by commands.
- The v0.37 public surface reset has enough evidence to start.
