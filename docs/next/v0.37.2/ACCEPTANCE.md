# v0.37.2 Acceptance

- `@openelement/core/isr-runtime` is exported as a public subpath.
- Runtime code has no Hono, Express, Cloudflare, Deno KV, Node, Vite, database,
  auth, or filesystem dependency.
- Manifest lookup is deterministic for sorted params.
- Cache miss renders and stores HTML.
- Cache hit serves cached HTML without rendering.
- Stale entries support blocking and background regeneration.
- Missing manifest entries return `not-found` and a `404` response.
