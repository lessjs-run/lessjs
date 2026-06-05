# v0.38.0 SOP: Public Surface Reset

> Status: Planned\
> Roadmap: Public Surface Reset\
> ADR: ADR-0083, ADR-0084

## Goal

Perform the final package and public import surface reset before the v1 release
candidate.

## Entry Criteria

- v0.32 lifecycle contract is implementation-proven.
- v0.33 rendering runtime and deploy boundaries are implementation-proven.
- v0.34 server route and mutation boundaries are implementation-proven.
- v0.35 data integration recipes are documented and tested.
- v0.36 UI surface and starters are browser-proven.
- v0.37 API inventory, Hub disposition, and consumer smoke are complete.
- ADR-0083 remains accepted or has been superseded by a newer package-surface
  ADR.

## Tasks

- [ ] Inventory every current `@openelement/*` package and subpath.
- [ ] Classify each surface as public product, public support, integration
      subpath, internal, archived, or removed.
- [ ] Decide the final v1 package map.
- [ ] Keep protocol contracts small, Web Standards-shaped, and runtime-free.
- [ ] Move integration APIs toward subpaths unless an ADR justifies a package.
- [ ] Ensure UI has no framework/router dependency.
- [ ] Ensure framework does not own ORM, auth, database, backend runtime, or
      builder internals.
- [ ] Write migration guide, import-path table, and codemod notes where useful.
- [ ] Update package READMEs, current docs, create templates, and www docs.
- [ ] Update package graph gates for the final package map.
- [ ] Run generated-project matrix and consumer smoke.

## Verification

- `deno task arch:check`
- `deno task graph:check`
- `deno task docs:check-current`
- `deno task docs:check-strategy`
- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task test`
- `deno task build`
- `deno task dsd:check-report`
- `deno task consumer:local`
- `deno task publish:dry-run`
- `deno task test:e2e`

## Non-Goals

- No new rendering feature scope.
- No new UI redesign scope.
- No ORM/auth ownership.
- No new top-level integration package without ADR approval.
- No compatibility shim if the import path is intentionally removed during the
  v1 reset.

## Exit Criteria

- Final public package map is documented.
- Current docs, create templates, and package READMEs use final import paths.
- Internal implementation packages are not presented as product packages.
- Consumer smoke proves the published package graph from a fresh project.
- v0.39 release-candidate validation can start without unresolved
  package-surface contradictions.
