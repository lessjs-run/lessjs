# SOP-002: KvIsrCache Adapters

> Version: v0.22.0
> Priority: P0
> Depends on: ADR-0038, v0.21 IsrCache interface

## Objective

Implement `KvIsrCache` adapters for the two platforms LessJS targets:
Cloudflare Workers KV and Deno KV. Both implement the existing `IsrCache`
interface — zero changes to the consumer code.

## Platforms

### CF Workers KV (`CfKvIsrCache`)

```ts
class CfKvIsrCache implements IsrCache {
  constructor(kv: KVNamespace) {}
  async get(key)  { ... kv.get(key, 'json') ... }
  async set(key, entry) { ... kv.put(key, json, { expirationTtl: entry.revalidate }) ... }
}
```

- TTL via native `expirationTtl`
- JSON serialization built into KV
- Zero extra dependencies

### Deno KV (`DenoKvIsrCache`)

```ts
class DenoKvIsrCache implements IsrCache {
  constructor(kv: Deno.Kv) {}
  async get(key)  { ... kv.get([key]) ... }
  async set(key, entry) { ... kv.set([key], entry, { expireIn: entry.revalidate * 1000 }) ... }
}
```

- TTL via native `expireIn`
- `Deno.openKv()` auto-initializes with local or remote backend
- Supports Deno Deploy (remote KV) and local dev (sqlite-backed)

## Deliverables

- [ ] `packages/core/src/isr-kv.ts` — both adapters in one file
- [ ] `CfKvIsrCache` class
- [ ] `DenoKvIsrCache` class
- [ ] Unit tests for hit/miss/stale/error with mock KV
- [ ] Integration test with local Deno KV

## Design Decision: One File, Two Classes

Both adapters share the same `IsrCache` interface and are ~20 lines each.
Splitting into separate packages (`@lessjs/isr-cf`, `@lessjs/isr-deno`) adds
package overhead with no benefit at this scale. If adapter implementations grow
significantly (connection pooling, retries, metrics), extract to separate
packages in v1.0.

## Verification

- `CfKvIsrCache` passes IsrCache contract tests with mock KV
- `DenoKvIsrCache` passes with real `Deno.openKv()`
- TTL is correctly set and expires entries
- Error state returned when KV is unavailable (don't throw)

## Non-Goals

- Redis adapter (community scope, not core)
- Connection pooling or advanced retry logic
- Multi-region KV consistency guarantees (platform responsibility)
