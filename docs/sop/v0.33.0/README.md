# v0.33.0 SOP: Rendering Runtime and Deployment

> Status: Planned\
> Roadmap: Rendering Runtime and Deployment\
> ADR: ADR-0084

## Goal

Turn the v0.32 lifecycle contract into explicit rendering, cache, streaming, and
deployment behavior.

## Entry Criteria

- v0.32.0 lifecycle semantics are stable.
- Route-level render intent exists as structured metadata.
- Existing ISR primitives and DSD streaming behavior are audited before
  expansion.

## Tasks

- [ ] Define runtime rendering modes for static SSG, request-time SSR, ISR, and
      streaming DSD.
- [ ] Normalize `revalidate` and freshness values into one internal cache
      representation.
- [ ] Audit current `IsrCache`, `MemoryIsrCache`, and manifest behavior.
- [ ] Add cache adapter boundary for memory, filesystem, Deno KV, and
      Cloudflare KV.
- [ ] Prove stale/fresh ISR behavior with tests.
- [ ] Prove streaming chunk order, shell timing, and error fallback.
- [ ] Add deploy recipes for static hosts, Deno Deploy, Cloudflare Workers, and
      Node-compatible hosts.
- [ ] Update create templates only for rendering modes with production proof.
- [ ] Update www rendering and deployment docs.

## Verification

- targeted ISR/cache tests
- targeted streaming DSD tests
- deployment recipe fixture builds
- `deno task test`
- `deno task build`
- `deno task test:e2e`

## Non-Goals

- No server mutation API.
- No ORM or data recipe work.
- No UI Shell redesign.
- No new renderer model.
- No package surface reset.

## Exit Criteria

- At least one static, one SSR, one ISR, and one streaming fixture pass.
- Deployment docs match runtime support rather than aspirational targets.
- Rendering runtime behavior is usable by v0.34 server routes and mutations.
