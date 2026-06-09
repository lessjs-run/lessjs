# v0.37.2 Design

## Runtime Boundary

`@openelement/core/isr-runtime` is a Web-standard contract. It accepts a manifest,
an injected cache, and an injected renderer, then returns a Web `Response`.

## ISR Flow

1. Match `path` and `params` against `IsrManifestEntry[]`.
2. Return `404` with state `not-found` when no entry exists.
3. Read `IsrCache` by `cacheKey`.
4. Serve `hit` entries without rendering.
5. Render and store `miss` entries.
6. Serve `stale` entries with blocking regeneration by default.
7. Allow background regeneration when a host injects a scheduler.
8. Return `500` for cache error states.

## Server Boundary

The contract does not import Hono or any server framework. Hono remains the
current primary app engine, but future server adapters should call this runtime
contract rather than fork ISR semantics.
