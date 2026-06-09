# v1.0.0 SOP: Stable Four-Product Platform

> Status: Vision\
> Roadmap: Stable Four-Product Platform\
> ADR: ADR-0091

## Goal

Publish openElement v1.0 as a stable four-product platform: elements, UI,
protocol, and framework/create.

## Entry Criteria

- v0.39 RC gates pass on dev and main.
- Public API list is frozen.
- Product docs match the final package surface.
- Create templates and consumer smoke prove the default path.
- AutoFlow evidence reports no hard contradictions.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0083: Deferred Public Surface Reset.
- ADR-0086: AutoFlow2 boundary.

## Step-by-Step Tasks

1. Confirm the stable public API list.
2. Confirm experimental APIs are marked or removed from stable docs.
3. Confirm internal subpaths are absent from beginner docs.
4. Confirm migration guide and release notes match actual code and gates.
5. Confirm static zero-JS, explicit island JS, SSR/ISR, data recipe,
   DsdElement shadow/light, and UI CSS paths.
6. Run full local gates.
7. Run CI on dev and main.
8. Tag and publish the GitHub release only after main CI is green.

## Verification

- full local gate ladder.
- generated project matrix.
- consumer smoke.
- deploy smoke.
- publish dry-run.
- GitHub Actions on dev and main.
- AutoFlow evidence report.

## Non-Goals

- No built-in ORM.
- No built-in auth platform.
- No new feature scope beyond release blockers.
- No autonomous merge, tag, bump, publish, or human-review replacement.

## Exit Criteria

- Users can build static, island, API-backed, data-backed, and ISR-backed apps
  without undocumented internals.
- Release documentation matches code, local gates, and GitHub Actions.
- AutoFlow evidence is part of the stable workflow gate.

## AutoFlow Boundary

AutoFlow is a required evidence source for v1. It is not an autonomous release
authority.
