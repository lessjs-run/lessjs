# v0.38.0 SOP: Product Surface Reset

> Status: Planned\
> Roadmap: Product Surface Reset and Hardening\
> ADR: ADR-0083, ADR-0091

Execution dossier: `docs/next/v0.38.0/`.

## Goal

Reset the public product and package surface after the v0.37.x validation train
has produced evidence.

## Entry Criteria

- v0.37.0-v0.37.6 are complete or explicitly deferred by ADR.
- The four-product target has evidence from a generated full-stack smoke app.
- Hub disposition has a written decision.
- The current package graph has no unresolved release-truth drift.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0083: Deferred Public Surface Reset.
- ADR-0093: SSR / ISR Runtime Contract.
- Any package-surface ADRs created during v0.37.x.

## Step-by-Step Tasks

1. Inventory every `@openelement/*` package and public subpath.
2. Classify each surface as product, advanced subpath, internal, archived, or
   removed.
3. Decide whether to introduce `@openelement/elements`,
   `@openelement/protocol`, or `@openelement/framework`.
4. Keep UI independent from framework routing.
5. Keep protocol contracts small and runtime-free.
6. Move internal implementation details out of public docs.
7. Update create templates and website docs to the final public surface.
8. Write migration notes for intentional breaking changes.
9. Update package graph and architecture gates.
10. Run consumer smoke and publish dry-run.

## Verification

- full local gate ladder.
- consumer smoke.
- generated project matrix.
- publish dry-run.
- website build and E2E.
- AutoFlow evidence report.

## Non-Goals

- No new feature scope beyond reset blockers.
- No ORM/auth ownership.
- No silent compatibility shims for intentionally removed 0.x imports.
- No new package without ADR approval.

## Exit Criteria

- Public package map is documented and proven.
- Docs, README, package READMEs, create templates, and website agree.
- Internal packages are no longer presented as product packages.
- v0.39 release-candidate validation can start.

## AutoFlow Boundary

AutoFlow may prove docs, templates, package graph, build, E2E, consumer smoke,
publish dry-run, and release notes agree. It must not decide package names or
breaking-change policy.
