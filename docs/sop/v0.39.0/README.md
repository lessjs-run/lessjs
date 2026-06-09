# v0.39.0 SOP: Full-Stack Framework Release Candidate

> Status: Planned\
> Roadmap: Full-Stack Framework RC\
> ADR: ADR-0091

## Goal

Validate the v1 candidate as a full-stack framework platform after the product
surface reset.

## Entry Criteria

- v0.38 product surface reset is complete.
- Public package names and import paths are frozen for RC.
- Create templates use the final public surface.
- Full local gates pass on the reset package graph.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0083: Deferred Public Surface Reset.

## Step-by-Step Tasks

1. Freeze the RC public API list.
2. Mark every experimental API explicitly.
3. Finalize migration guide from v0.30-v0.38.
4. Run generated project matrix from a clean checkout.
5. Run consumer smoke against the package graph.
6. Run deploy smoke for documented runtime targets.
7. Verify static zero-JS, explicit island JS, DsdElement shadow/light,
   pure CSS UI, SSR/ISR, and data recipe paths.
8. Fix release-candidate bugs without broadening feature scope.
9. Prepare v1.0 release checklist.

## Verification

- full local gate ladder.
- AutoFlow evidence report.
- generated project matrix.
- consumer smoke.
- deploy smoke.
- publish dry-run.
- GitHub Actions on dev and main.

## Non-Goals

- No new framework feature scope.
- No package map redesign after v0.38 unless a blocker ADR requires it.
- No ORM, auth, database, or backend ownership.
- No silent compatibility shims for intentionally removed APIs.

## Exit Criteria

- The v1 public API candidate is frozen.
- All documented product surfaces pass their gates.
- AutoFlow reports no hard workflow contradictions.
- v1.0 can be published as a release decision, not another feature release.

## AutoFlow Boundary

AutoFlow may prove RC evidence and hard contradictions. It must not approve the
v1 release by itself.
