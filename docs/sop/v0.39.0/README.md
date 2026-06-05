# v0.39.0 SOP: v1 Release Candidate

> Status: Planned\
> Roadmap: v1 Release Candidate\
> ADR: ADR-0084

## Goal

Validate the v1 candidate after the public surface reset without adding new
feature scope.

## Entry Criteria

- v0.38 public surface reset is complete.
- Current docs and create templates use the final import paths.
- Full local release gates pass on the reset package graph.

## Tasks

- [ ] Freeze the v1 candidate public API list.
- [ ] Mark experimental APIs explicitly in docs and package READMEs.
- [ ] Finalize migration guide from v0.30/v0.31 through v0.38.
- [ ] Run generated project matrix from a clean checkout.
- [ ] Run consumer smoke against the package graph.
- [ ] Run deploy smoke for documented runtime targets.
- [ ] Fix release-candidate bugs without broadening feature scope.
- [ ] Prepare v1.0 release checklist.

## Verification

- full local gate ladder
- generated project matrix
- consumer smoke
- deploy smoke
- publish dry-run
- GitHub Actions on `dev` and `main`

## Non-Goals

- No new framework feature scope.
- No package map redesign after v0.38 unless a release blocker proves it is
  necessary.
- No new ORM, auth, database, or backend ownership.
- No silent compatibility shims for intentionally removed APIs.

## Exit Criteria

- The v1 public API candidate is frozen.
- All documented starters, runtime modes, server routes, data recipes, and UI
  shells pass their gates.
- v1.0 can be published as a release decision, not as another feature release.
