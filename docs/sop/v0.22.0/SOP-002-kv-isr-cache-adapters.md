# SOP-002: KV ISR Cache Adapters

> Version: v0.22.0
> Priority: P0
> Status: PLANNED
> Depends on: ADR-0038, SOP-001

## Objective

Implement platform-native ISR cache adapters for Cloudflare Workers KV and
Deno KV.

The adapter contract must preserve stale-while-revalidate behavior. Therefore
`revalidate` must not be treated as the KV deletion TTL. `revalidate` is the
fresh window. KV retention must be longer so stale HTML can still be served
while regeneration runs.

## Non-Goals

- Do not add Redis to core.
- Do not add a database abstraction.
- Do not implement distributed locking in v0.22.
- Do not guarantee multi-region read-after-write consistency beyond what the
  platform provides.
- Do not put Cloudflare-specific types in the core barrel if that breaks
  cross-runtime typecheck.

## Target Files

- `packages/core/src/isr.ts`
- `packages/core/src/isr-kv.ts`
- `packages/core/src/index.ts`
- `packages/core/__tests__/isr.test.ts`
- `packages/core/__tests__/isr-kv.test.ts`
- `packages/adapter-vite/__tests__/isr-handler.test.ts`

## Cache Semantics

Recommended entry shape:

```ts
export interface IsrCacheEntry {
  html: string;
  createdAt: number;
  revalidate: number;
  staleTtl?: number;
  headers?: Record<string, string>;
}
```

State calculation:

```text
age < revalidate
  -> hit

revalidate <= age < staleTtl
  -> stale

age >= staleTtl or no entry
  -> miss
```

If `staleTtl` is not provided, use a conservative default such as
`max(revalidate * 10, revalidate + 300)` for production adapters. The exact
constant can change, but the distinction must remain.

## Step-by-Step Execution

### Step 0: Fix Contract Drift

- [ ] Align `createIsrCacheKey()` tests and implementation.
- [ ] Decide whether keys include `lessjs:isr:` prefix.
- [ ] Use the same function everywhere: build manifest, handler, tests, and
      adapters.

Acceptance:

- [ ] `packages/core/__tests__/isr.test.ts` passes.
- [ ] Manifest cache keys and runtime cache keys match.

### Step 1: Extend Cache Result Semantics

- [ ] Confirm `IsrCacheResult` can represent `miss`, `hit`, `stale`, and
      `error`.
- [ ] Preserve old `MemoryIsrCache` behavior unless a stale retention window is
      added.
- [ ] Add tests for stale retention if `staleTtl` is implemented.

Acceptance:

- [ ] Memory cache contract matches KV adapters.
- [ ] Cache adapters never throw for normal get/set failures; they return or
      surface `error` in a controlled way.

### Step 2: Cloudflare KV Adapter

- [ ] Implement `CfKvIsrCache`.
- [ ] Constructor accepts a minimal KV namespace shape instead of importing
      Cloudflare global types into core:

```ts
interface CfKvNamespaceLike {
  get(key: string, type: 'json'): Promise<unknown>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete?(key: string): Promise<void>;
}
```

- [ ] Serialize entries as JSON.
- [ ] Use `expirationTtl` for stale retention, not `revalidate`.
- [ ] Return `error` state on KV read parse failure or platform failure.

Acceptance:

- [ ] Mock KV hit/miss/stale/error tests pass.
- [ ] TTL written to KV is greater than `revalidate` when stale retention is
      enabled.

### Step 3: Deno KV Adapter

- [ ] Implement `DenoKvIsrCache`.
- [ ] Constructor accepts a minimal Deno KV shape:

```ts
interface DenoKvLike {
  get<T>(key: Deno.KvKey): Promise<{ value: T | null }>;
  set(key: Deno.KvKey, value: unknown, options?: { expireIn?: number }): Promise<unknown>;
  delete?(key: Deno.KvKey): Promise<void>;
}
```

- [ ] Store entries under structured keys, e.g. `['lessjs', 'isr', key]`.
- [ ] Use `expireIn` for stale retention, not `revalidate`.
- [ ] Provide helper `createDenoKvIsrCache()` that calls `Deno.openKv()` only in
      Deno-capable runtime paths, not at module import time.

Acceptance:

- [ ] Mock Deno KV tests pass.
- [ ] Optional real Deno KV integration test is gated so CI can skip when KV is
      unavailable.

### Step 4: Shared Contract Tests

- [ ] Write a reusable test suite that accepts a cache factory.
- [ ] Run it against:
  - `MemoryIsrCache`
  - `CfKvIsrCache` mock
  - `DenoKvIsrCache` mock
- [ ] Test miss, hit, stale, delete, parse error, write error.

Acceptance:

- [ ] All adapters pass identical behavior tests.

### Step 5: Barrel Exports

- [ ] Export adapters from an explicit subpath if the core barrel would leak
      platform-specific types.
- [ ] Otherwise export:
  - `CfKvIsrCache`
  - `DenoKvIsrCache`
  - related minimal types
- [ ] Update `deno task typecheck` entrypoints.

Acceptance:

- [ ] `import { MemoryIsrCache } from '@lessjs/core'` still works.
- [ ] New adapter imports work in Worker and Deno examples.

## Verification

```sh
deno test packages/core/__tests__/isr.test.ts
deno test packages/core/__tests__/isr-kv.test.ts
deno task typecheck
```

Required checks:

- [ ] Cache key function is consistent.
- [ ] Fresh entries return `hit`.
- [ ] Expired-fresh but retained entries return `stale`.
- [ ] Fully expired/missing entries return `miss`.
- [ ] Platform read/write failures are controlled.
- [ ] KV retention TTL is not equal to `revalidate` unless explicitly configured.

## Exit Criteria

- Production ISR handler can use either CF KV or Deno KV through the same
  `IsrCache` contract.
- Stale-while-revalidate is possible because stale entries are retained.
- Redis remains out of core.

## Related

- ADR-0038: ISR + Edge KV Architecture
- SOP-001: ISR Production Handler
