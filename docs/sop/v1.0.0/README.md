# v1.0.0 SOP: Stable Application Engine

> Status: Vision\
> Roadmap: Stable Application Engine\
> ADR: ADR-0084

## Goal

Publish the stable openElement application engine after the v0.31-v0.39 product
closure line has implementation, public surface, and release-candidate proof.

## Entry Criteria

- Application API is stable.
- Lifecycle, rendering, server, data, and UI starter contracts are documented
  and tested.
- v0.38 public surface reset is complete or explicitly rejected by ADR.
- v0.39 release-candidate gates pass on `dev` and `main`.
- Package graph and publish dry-run pass without exceptions.

## Tasks

- [ ] Publish stable public API list.
- [ ] Confirm experimental APIs are explicitly marked.
- [ ] Confirm every internal subpath is removed from user docs or explicitly
      documented as internal/advanced.
- [ ] Confirm the public package map has no unresolved product-boundary
      contradictions.
- [ ] Confirm migration guide and release notes match actual code and gates.
- [ ] Run full local gates.
- [ ] Run CI on `dev` and `main`.
- [ ] Publish tag and GitHub release.

## Non-Goals

- No built-in ORM.
- No built-in auth platform.
- No new feature scope beyond release blockers.
- No silent compatibility shims for APIs removed during 0.x cleanup.

## Exit Criteria

- Users can build a static site, island app, API-backed app, and data-backed app
  without relying on undocumented internals.
- Release documentation matches code, local gates, and GitHub Actions.
