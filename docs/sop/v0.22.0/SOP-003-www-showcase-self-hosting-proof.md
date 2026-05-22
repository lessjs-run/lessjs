# SOP-003: www Showcase — Self-Hosting Proof

> Version: v0.22.0
> Priority: P0
> Depends on: SOP-001 (ISR handler), SOP-002 (KV adapters)

## Objective

The LessJS website (`lessjs.run`) must demonstrate every capability the framework
claims. Not "docs that describe" — the site itself IS the proof.

## Required Pages

### /showcase

- [ ] React Island demo — interactive data table with Lit-based sorting
- [ ] Lit Island demo — real-time counter with DSD hydration
- [ ] ISR stopwatch — "This page was generated X seconds ago, regenerates in Y seconds"
- [ ] `client:visible` demo — content loads on scroll (already in /guide/islands)

### /isr-demo

- [ ] Timestamp that updates via ISR every N seconds
- [ ] Visual indicator of cache state (green=hit, yellow=stale, red=miss)
- [ ] Manual revalidate button → calls API route → triggers regeneration

### /api/stats

- [ ] Hono API route returning real deployment stats
- [ ] Shows request count, cache hit rate, last build timestamp
- [ ] Demonstrates serverless API in production

### /blog/:slug (ISR)

- [ ] Blog page with `revalidate = 60`
- [ ] Content from markdown, HTML cached in KV
- [ ] Shows ISR cache header in response

## Architecture

```
lessjs.run (Cloudflare Workers)
├── SSG pages (/, /guide/*, /roadmap)  → static HTML
├── ISR pages (/isr-demo, /blog/:slug) → KV cache → renderDSD()
├── API routes (/api/stats)             → Hono → JSON
└── Island demo (/showcase)             → SSG + React/Lit hydration
```

## Verification

- `lessjs.run/showcase` — all demos functional
- `lessjs.run/isr-demo` — timestamp updates via ISR
- `lessjs.run/api/stats` — returns JSON with live data
- `lessjs.run/blog/hello` — ISR-cached page with correct TTL
- DSD report shows zero unknown errors for showcase components

## Non-Goals

- User accounts or authentication on the public site
- Persistent analytics storage (use CF Analytics or third-party)
- Admin panel for content management
