# SOP-001: ISR Production Handler

> Version: v0.22.0
> Priority: P0
> Status: PLANNED
> Depends on: v0.21 ISR contract

## Objective

Build the ~100-line Deno/CF Worker server that closes the ISR loop:
receive HTTP request → check cache → render on miss → cache → serve.

The handler reuses `renderDSD()` from v0.20's SSG pipeline — same engine,
different invocation timing. This is ADR-0033's "rendering is timing-independent"
in production.

## Architecture

```
Edge Request
    ↓
IsrCache.get(cacheKey)
    ├─ hit   → return cached HTML (CF KV / Deno KV)
    ├─ miss  → renderDSD() → cache.set(revalidate TTL) → return fresh HTML
    ├─ stale → return cached HTML → background: renderDSD() → cache.set()
    └─ error → return last known HTML, log error
```

## Deliverables

### P0: ISR Server

- [ ] `packages/adapter-vite/src/cli/serve.ts` — `deno task serve` entry point
- [ ] Hono-based edge server that mounts:
  - Static file serving from `www/dist/`
  - API routes from the generated Hono app
  - ISR regeneration endpoint for stale-while-revalidate
- [ ] `isr-manifest.json` reader — maps route paths to cache keys
- [ ] Background regeneration via `waitUntil` (CF) / `ctx.waitUntil` (Hono)

### P0: CF Workers Entry

- [ ] `www/worker.ts` — Cloudflare Workers entry point
- [ ] `wrangler.toml` template
- [ ] KV namespace binding

### P1: Deno Deploy Entry

- [ ] `deno task serve` — single-command production server
- [ ] Deno KV auto-initialization

## Edge Cases

- Concurrent regeneration of the same route → single-flight promise dedup
- KV write failures → serve stale HTML, don't 500
- Cold start with empty cache → sequential SSG-like rendering
- Route with `revalidate = 0` → always regenerate (bypass cache)
- Route without `revalidate` → serve static file (bypass ISR entirely)
- `client:only` islands in ISR pages → stub rendering as in SSG

## Verification

- `deno task serve` starts and responds to HTTP
- `curl /isr-demo` returns fresh HTML on first request
- Second request within TTL returns cached HTML (same etag)
- Request after TTL returns stale HTML, triggers regeneration
- KV contains entry with correct TTL
- Error path: KV unavailable → serves stale HTML from fallback

## Non-Goals

- Generic SSR for all routes (ISR is route-opt-in via `revalidate`)
- Distributed lock (single-flight dedup is sufficient for v0.22)
- Request-time rendering for routes without `revalidate`
