# v0.37.0 SOP: Production Hardening and Product Pruning

> Status: Planned\
> Roadmap: Production Hardening and Product Pruning\
> ADR: ADR-0084

## Goal

Turn the v0.31-v0.36 feature line into evidence for v0.38 public surface reset
and remove or defer product areas that cannot be proven.

## Entry Criteria

- v0.32 through v0.36 scopes are complete or explicitly deferred.
- No unresolved public API contradictions remain in docs.
- CI gate coverage reflects the release claims.

## Tasks

- [ ] Audit all public exports and classify APIs as stable, experimental,
      internal, or remove-before-v1.
- [ ] Add or update docs/API consistency gates.
- [ ] Add generated project matrix for common starter shapes.
- [ ] Add consumer smoke for the JSR package graph.
- [ ] Add performance baseline for build, SSR render, streaming render, and
      client island boot.
- [ ] Produce package and subpath inventory for v0.38.
- [ ] Mark package surfaces that should remain public, move to subpaths, become
      internal, be archived, or be removed.
- [ ] Make a written Hub decision: public product, internal tooling, deferred,
      archived, or removed.
- [ ] Remove stale SOP claims that cannot be proven by code or gates.
- [ ] Draft migration notes from v0.30/v0.31 to v1 candidates without finalizing
      import paths.

## Verification

- full local gate ladder
- generated project matrix
- consumer smoke
- publish dry-run
- www build and e2e

## Non-Goals

- No new feature scope unless required to close a blocker.
- No UI redesign.
- No ORM/auth ownership.
- No physical package reorganization; that belongs to v0.38.

## Exit Criteria

- Release claims are proven by commands.
- Hub and every package surface has a written disposition.
- The v0.38 public surface reset has enough evidence to start.
