# v0.37.0 SOP: Server/Data/UI Product Closure

> Status: Planned\
> Roadmap: Server/Data/UI Product Closure\
> ADR: ADR-0086

## Goal

Close the remaining server, data, UI, starter, Hub, hardening, and pruning
surfaces under AutoFlow2 supervision before the v0.38 public surface reset.

## Entry Criteria

- v0.36.0 rendering runtime and deploy boundaries are implementation-proven.
- AutoFlow2 reports are included in release evidence.
- No unresolved public API contradictions remain in docs.
- CI gate coverage reflects the release claims.

## Tasks

- [ ] Audit current `api/*.ts` route handling and generated Hono wiring.
- [ ] Define typed helpers for JSON, redirect, HTML, empty, and structured error
      responses.
- [ ] Define request context shared by page `load()` and API routes where it is
      genuinely common.
- [ ] Document middleware order, route scoping, handler precedence, cookies, and
      headers.
- [ ] Define mutation/action patterns for forms and server-side state changes.
- [ ] Add selected data integration recipes for SQL, KV, edge, and serverless
      use cases without owning an ORM.
- [ ] Add fixture apps that use external data libraries through `load()` and
      server mutations where practical.
- [ ] Audit AppShell and layout config against real www and starter needs.
- [ ] Decide `@openelement/ui/css` export shape.
- [ ] Separate Ocean components from browser-upgraded island components.
- [ ] Add starter templates for docs, blog, product, and dashboard.
- [ ] Add or update docs/API consistency gates.
- [ ] Add generated project matrix for common starter shapes.
- [ ] Add consumer smoke for the JSR package graph.
- [ ] Add performance baseline for build, SSR render, streaming render, and
      client island boot.
- [ ] Produce package and subpath inventory for v0.38.
- [ ] Make a written Hub decision: public product, internal tooling, deferred,
      archived, or removed.
- [ ] Remove stale SOP claims that cannot be proven by code or gates.

## Verification

- server route unit tests
- mutation/action fixture tests
- selected data recipe fixture builds
- UI package tests
- starter template builds
- generated project matrix
- consumer smoke
- performance baseline
- full local gate ladder
- `deno task autoflow:check`
- www build and e2e

## Non-Goals

- No full auth framework.
- No built-in ORM.
- No schema migration tool.
- No proprietary database abstraction.
- No physical package reorganization; that belongs to v0.38.
- No new feature scope that is not needed for product closure.

## Exit Criteria

- Users can build typed server routes and form mutations without reading adapter
  internals.
- Data docs are useful for real applications without pretending to be a backend
  platform.
- UI docs and starter templates are coherent with the v0.32-v0.36 product path.
- Hub and every package surface has a written disposition.
- The v0.38 public surface reset has enough AutoFlow and gate evidence to start.
