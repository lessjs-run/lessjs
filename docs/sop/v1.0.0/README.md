# v1.0.0 SOP: Stable Application Engine

> Status: Vision\
> Roadmap: Stable Application Engine

## Goal

Freeze the stable openElement application engine after the v0.31-v0.36 line has
real implementation and gate proof.

## Entry Criteria

- Application API is stable.
- Rendering modes are deployed in fixtures.
- Server/API and data integration boundaries are documented and tested.
- UI Shell starters are browser-proven.
- Package graph and publish dry-run pass without exceptions.

## Tasks

- [ ] Publish stable public API list.
- [ ] Mark experimental APIs explicitly.
- [ ] Remove or document every internal subpath.
- [ ] Finalize migration guide.
- [ ] Run full local gates.
- [ ] Run CI on `dev` and `main`.
- [ ] Publish tag and GitHub release.

## Non-Goals

- No built-in ORM.
- No built-in auth platform.
- No silent compatibility shims for APIs removed during 0.x cleanup.

## Exit Criteria

- Users can build a static site, island app, API-backed app, and data-backed app
  without relying on undocumented internals.
- Release documentation matches code and gates.
