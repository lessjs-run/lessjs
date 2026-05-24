# LessJS v0.22.0 - Edge Full-Stack

> Status: PLANNING
> Target: ISR handler, KV adapters, Showcase, deployment guides

## Mission

v0.22.0 closes the lightweight full-stack loop for LessJS. After v0.21 makes
the DSD renderer stronger, v0.22 proves that the same renderer can run behind
an edge HTTP handler with API routes, static assets, ISR pages, and KV-backed
cache persistence.

The release should make this true:

```text
LessJS app
  -> SSG pages for stable content
  -> Hono API routes for serverless JSON/endpoints
  -> ISR routes for periodically regenerated DSD HTML
  -> KV cache adapter for platform-native persistence
  -> Cloudflare Workers and Deno Deploy deployment paths
  -> www site proves the feature set
```

## Scope Boundary

v0.22.0 is an Edge Full-Stack MVP, not a mature app platform.

| Included                | Excluded                      |
| ----------------------- | ----------------------------- |
| HTTP handler            | Auth/session framework        |
| Static file serving     | ORM/database layer            |
| Hono API route mounting | File upload/storage product   |
| Route-level ISR         | Queue/background job platform |
| CF Workers KV adapter   | Admin panel/CMS               |
| Deno KV adapter         | User accounts                 |
| Deployment guides       | Generic Node server target    |
| Showcase proof          | Marketplace/ecosystem growth  |

This keeps LessJS realistic: the framework owns rendering, routing, API
mounting, ISR, and deployment contracts. Data, auth, and storage can be
integrated later through documented examples or partner services.

## Release Order

| Step | SOP     | Priority | Purpose                         | Must Finish Before           |
| ---- | ------- | -------- | ------------------------------- | ---------------------------- |
| 1    | SOP-001 | P0       | ISR production handler          | Public Edge Full-Stack claim |
| 2    | SOP-002 | P0       | CF KV and Deno KV adapters      | Deployed ISR demo            |
| 3    | SOP-003 | P0       | www self-hosting proof          | Release announcement         |
| 4    | SOP-004 | P1       | Deployment guides and templates | User adoption                |
| 5    | SOP-005 | P0       | Cleanup, gates, release closure | v0.22.0 completion           |

## Entry Criteria

- v0.21 release gates pass.
- `renderDSD()` and, if shipped, `renderDSDStream()` are stable enough to call
  from a request handler.
- `isr-manifest.json` is emitted during build for `revalidate` routes.
- Hono API route generation works in dev and build.
- Public docs do not call ISR production-ready before SOP-005 passes.

## Architecture Contract

```text
Request
  -> match static asset
      -> return file
  -> match API route
      -> generated Hono app handles request
  -> match ISR route
      -> compute cache key
      -> cache.get(key)
          -> hit: return cached HTML
          -> stale: return cached HTML and schedule regeneration
          -> miss: render, cache, return fresh HTML
          -> error: return last good HTML when available, otherwise 500
  -> fallback static route or 404
```

## Key Design Rules

- `revalidate` is the fresh window, not the KV deletion TTL.
- KV records need enough retention to serve stale HTML while regeneration runs.
- Cloudflare Workers uses `ExecutionContext.waitUntil`.
- Deno Deploy uses `Deno.serve` and Deno KV.
- Static-only deployments remain supported and must not require KV.
- Redis stays out of core because Cloudflare Workers cannot use raw TCP.

## Exit Criteria

- `deno task serve` or equivalent production command can serve built output.
- Cloudflare Worker entry can serve static pages, API routes, and ISR pages.
- Deno Deploy entry can serve static pages, API routes, and ISR pages.
- `CfKvIsrCache` and `DenoKvIsrCache` pass the same contract tests.
- The www site contains working Showcase, ISR demo, API stats, and deployment
  guidance.
- Full release gates pass.

## Related

- ADR-0038: ISR + Edge KV Architecture
- SOP-001: ISR Production Handler
- SOP-002: KV ISR Cache Adapters
- SOP-003: www Showcase Self-Hosting Proof
- SOP-004: Deployment Guide
- SOP-005: Cleanup and Verification
