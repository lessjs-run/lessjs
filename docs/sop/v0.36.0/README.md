# v0.36.0 SOP: Rendering Runtime and Deployment

> Status: Planned\
> Roadmap: Rendering Runtime and Deployment\
> ADR: ADR-0086

## Goal

Turn the v0.32 lifecycle and v0.33 AI-readable render intent into explicit
rendering, cache, streaming, and deployment behavior under AutoFlow2 evidence.

## Entry Criteria

- v0.32.0 lifecycle semantics are stable.
- v0.33.0 render intent and page metadata are explicit.
- v0.35.0 AutoFlow2 harness gate is implemented and low-noise.
- Existing ISR primitives and DSD streaming behavior are audited before
  expansion.
- The rendering work declares cells, expected evidence, and allowed transitions
  before implementation.

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
- [ ] Include AutoFlow evidence report in release artifacts.

## Verification

- targeted ISR/cache tests
- targeted streaming DSD tests
- deployment recipe fixture builds
- `deno task autoflow:check`
- `deno task workflow:check`
- `deno task test`
- `deno task build`
- `deno task test:e2e`

## Non-Goals

- No server mutation API.
- No ORM or data recipe work.
- No UI Shell redesign.
- No package surface reset.
- No AutoFlow release control.

## Exit Criteria

- At least one static, one SSR, one ISR, and one streaming fixture pass.
- Deployment docs match runtime support rather than aspirational targets.
- AutoFlow evidence agrees with implementation, docs, tests, and release
  claims.
- Rendering runtime behavior is usable by v0.37 server/data/UI product closure.
