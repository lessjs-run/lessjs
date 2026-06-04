# v0.32.0 SOP: Rendering Modes

> Status: Planned\
> Roadmap: Rendering Modes

## Goal

Turn openElement rendering modes into explicit, deployable contracts:

- static SSG;
- request-time SSR;
- ISR with cache adapters;
- streaming DSD.

## Entry Criteria

- v0.31.0 Application API is released.
- `definePage()` descriptors are available to carry rendering intent.
- Existing ISR primitives have tests and are understood before expansion.

## Tasks

- [ ] Define route-level `rendering` semantics: `static`, `dynamic`, and `auto`.
- [ ] Define route-level `streaming` semantics: `auto`, `force`, and `false`.
- [ ] Normalize `revalidate` values into one internal representation.
- [ ] Audit current `IsrCache`, `MemoryIsrCache`, and manifest behavior.
- [ ] Add cache adapter boundary for memory, filesystem, Deno KV, and Cloudflare KV.
- [ ] Add deploy recipes for static host, Deno Deploy, Cloudflare Workers, and Node-compatible hosts.
- [ ] Prove stale/fresh ISR behavior with tests.
- [ ] Prove streaming chunk order and error fallback.
- [ ] Update create template only when a rendering mode has production proof.
- [ ] Update www rendering docs.

## Verification

- `deno task test`
- targeted ISR/cache tests
- targeted streaming DSD tests
- `deno task build`
- `deno task test:e2e`

## Non-Goals

- No ORM.
- No auth.
- No UI Shell redesign.
- No new renderer model.

## Exit Criteria

- Rendering mode docs match implementation.
- At least one static, one SSR, one ISR, and one streaming fixture pass.
- Deployment recipes are honest about supported runtimes.
