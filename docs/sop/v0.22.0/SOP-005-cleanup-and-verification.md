# SOP-005: Cleanup and Release Verification

> Version: v0.22.0
> Priority: P0
> Status: PLANNED
> Depends on: SOP-001, SOP-002, SOP-003, SOP-004

## Objective

Close v0.22.0 only after the Edge Full-Stack MVP is implemented, documented,
and verified. This SOP prevents a repeat of status docs moving ahead of the
actual repo state.

## Preflight Cleanup

- [ ] Verify v0.21 SOPs are marked completed only after v0.21 gates passed.
- [ ] Verify no DOM diff docs remain in v0.21 scope.
- [ ] Verify no `RedisIsrCache` reference remains in core implementation.
- [ ] Verify `LessApiHandler` and `createLessApiContext` are not presented as
      current runtime APIs.
- [ ] Verify `README.en.md`, `STATUS.md`, `ROADMAP.md`, and SOP index agree on:
  - current line;
  - v0.21 Reactive DSD completion state;
  - v0.22 Edge Full-Stack completion state.

## Targeted Verification

```sh
deno test packages/core/__tests__/isr.test.ts
deno test packages/core/__tests__/isr-kv.test.ts
deno test packages/adapter-vite/__tests__/isr-handler.test.ts
deno test packages/adapter-vite/__tests__/serve-cli.test.ts
deno test packages/adapter-vite/__tests__/static-handler.test.ts
deno task build
deno task serve
```

Manual local smoke:

```sh
curl -i http://localhost:8000/
curl -i http://localhost:8000/showcase
curl -i http://localhost:8000/api/stats
curl -i http://localhost:8000/isr-demo
```

## Full Release Gate

Run in this order:

```sh
deno task fmt:check
deno task lint
deno task typecheck
deno task docs:check-strategy
deno audit
deno task test
deno task build
deno task dsd:check-report
deno task test:e2e
```

If Hub files or Registry docs changed, also run:

```sh
deno task hub:validate --strict --json
deno task hub:check-index
```

## Release Checklist

### ISR Handler

- [ ] Static routes serve correctly.
- [ ] API routes serve through Hono.
- [ ] ISR routes produce miss/hit/stale states.
- [ ] Stale responses schedule regeneration.
- [ ] Regeneration failures keep last good HTML.
- [ ] Static-only mode works without KV.

### KV Adapters

- [ ] Memory, CF KV mock, and Deno KV mock pass same contract tests.
- [ ] KV retention TTL is longer than fresh `revalidate` window.
- [ ] Adapter failures do not throw uncontrolled errors.
- [ ] Cache keys match manifest keys.

### Showcase

- [ ] `/showcase` demonstrates static DSD, Reactive DSD, and islands.
- [ ] `/isr-demo` demonstrates ISR behavior.
- [ ] `/api/stats` returns live JSON.
- [ ] `/blog/:slug` can be ISR-cached.
- [ ] DSD report has no unknown new error class.

### Deployment Docs

- [ ] Static-only guide exists.
- [ ] Cloudflare Workers guide exists.
- [ ] Deno Deploy guide exists.
- [ ] Templates match implementation names and binding names.
- [ ] Troubleshooting covers missing KV binding and stale manifest.

### Public Positioning

- [ ] Docs say "Edge Full-Stack MVP" or equivalent bounded claim.
- [ ] Docs do not claim auth/session/ORM/database platform support.
- [ ] Docs do not claim mature ecosystem or marketplace completion.
- [ ] Docs explain that ecosystem growth is still separate work.

## Changelog

- [ ] Create `docs/changelog/v0.22.0.md`.
- [ ] Document ISR handler.
- [ ] Document KV adapters and stale retention semantics.
- [ ] Document Showcase routes.
- [ ] Document deployment guides.
- [ ] Document known exclusions: auth, DB, ORM, Redis-in-core, generic SSR.

## Final State

- [ ] `git status --short` contains only intentional release changes.
- [ ] No generated verification artifacts are left dirty.
- [ ] Full gate results are recorded in changelog or status docs.

## Exit Criteria

- v0.22.0 can be called an Edge Full-Stack MVP.
- It cannot be described as a complete mature full-stack framework.
- Remaining gap is documented as production ecosystem and app-layer integration,
  not hidden as "only ecosystem".

## Related

- SOP-001: ISR Production Handler
- SOP-002: KV ISR Cache Adapters
- SOP-003: www Showcase
- SOP-004: Deployment Guide
