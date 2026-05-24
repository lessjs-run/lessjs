# SOP-001: ISR Production Handler

> Version: v0.22.0
> Priority: P0
> Status: PLANNED
> Depends on: v0.21 renderer and ISR manifest contract

## Objective

Build the production HTTP handler that serves LessJS built output at the edge:
static files, Hono API routes, and route-level ISR regeneration.

ISR is not generic SSR. It is route-opt-in request-time regeneration using the
same DSD renderer that already powers SSG.

## Non-Goals

- Do not render every route on every request.
- Do not add auth, sessions, ORM, or database abstractions.
- Do not build a generic Node server target in v0.22.
- Do not require KV for static-only deployments.
- Do not make ISR pages depend on Redis.

## Target Files

Primary implementation:

- `packages/adapter-vite/src/cli/serve.ts`
- `packages/adapter-vite/src/isr-handler.ts`
- `packages/adapter-vite/src/static-handler.ts`
- `packages/adapter-vite/src/server-entry.ts`
- `packages/adapter-vite/src/index.ts`
- `deno.json`

Application templates:

- `www/worker.ts`
- `www/wrangler.toml`
- `www/deno-serve.ts`

Tests:

- `packages/adapter-vite/__tests__/isr-handler.test.ts`
- `packages/adapter-vite/__tests__/serve-cli.test.ts`
- `packages/adapter-vite/__tests__/static-handler.test.ts`
- `www/e2e/isr-demo.spec.ts`

## Handler Contract

```ts
export interface LessEdgeHandlerOptions {
  distDir: string;
  serverEntryPath: string;
  cache: IsrCache;
  platform: 'cloudflare' | 'deno' | 'memory';
  waitUntil?: (promise: Promise<unknown>) => void;
  now?: () => number;
}

export function createLessEdgeHandler(
  options: LessEdgeHandlerOptions,
): (request: Request, env?: unknown, ctx?: unknown) => Promise<Response>;
```

The final API may differ, but it must preserve these semantics: explicit cache,
explicit dist directory, explicit background task hook, and Web `Request` /
`Response` types.

## Step-by-Step Execution

### Step 0: Baseline and Inputs

- [ ] Run `deno task build`.
- [ ] Confirm `www/dist/server/entry.js` exists.
- [ ] Confirm `www/dist/isr-manifest.json` exists when routes export
      `revalidate`.
- [ ] Confirm generated Hono app still serves API routes in dev/build tests.

Acceptance:

- [ ] Existing SSG output remains valid without the handler.
- [ ] Missing `isr-manifest.json` means no ISR routes, not a hard failure.

### Step 1: Normalize ISR Manifest

- [ ] Define one manifest shape:
  - `routes: IsrManifestEntry[]`
  - `path`
  - `revalidate`
  - `cacheKey`
  - optional params/static path metadata
- [ ] Accept legacy manifest shape only through a migration helper if current
      build output still differs.
- [ ] Add `readIsrManifest(distDir)`.

Acceptance:

- [ ] Manifest parser handles empty/missing manifest.
- [ ] Invalid entries fail with actionable diagnostics.

### Step 2: Static Asset Handler

- [ ] Serve hashed JS/CSS/assets with long cache headers.
- [ ] Serve HTML with conservative cache headers.
- [ ] Prevent path traversal.
- [ ] Normalize clean URLs:
  - `/guide` -> `/guide/index.html`
  - `/guide/` -> `/guide/index.html`
  - `/404` fallback when available

Acceptance:

- [ ] Static file request returns correct content type.
- [ ] `..` traversal returns 400 or 404.
- [ ] Static-only projects work without KV.

### Step 3: API Route Mounting

- [ ] Load generated server entry.
- [ ] Call the Hono app for `/api/*`.
- [ ] Pass platform/env context through Hono where available.
- [ ] Preserve request method, headers, body, and params.

Acceptance:

- [ ] `/api/term` or fixture API route returns JSON.
- [ ] Non-API routes do not hit API handler.

### Step 4: ISR Route Matching

- [ ] Match request path against manifest route paths.
- [ ] Compute stable cache key with route path and params.
- [ ] Ignore ISR for methods other than `GET` and `HEAD`.
- [ ] Routes without `revalidate` use static file serving.

Acceptance:

- [ ] `GET /isr-demo` hits ISR.
- [ ] `POST /isr-demo` does not regenerate HTML.
- [ ] Non-ISR routes remain static.

### Step 5: Cache Result Handling

- [ ] `hit`: return cached HTML with `x-lessjs-isr: hit`.
- [ ] `stale`: return cached HTML with `x-lessjs-isr: stale` and schedule
      background regeneration.
- [ ] `miss`: render synchronously, cache, return with `x-lessjs-isr: miss`.
- [ ] `error` with last good entry: return stale fallback with
      `x-lessjs-isr: error-stale`.
- [ ] `error` without entry: return 500.

Acceptance:

- [ ] Headers expose cache state for tests and Showcase.
- [ ] Stale path does not block response on regeneration.

### Step 6: Regeneration

- [ ] Add `regenerateRoute(route, requestContext)`.
- [ ] Use `renderDSD()` or `renderDSDStream()` according to route/runtime
      support.
- [ ] Cache only successful HTML.
- [ ] Preserve important response headers.
- [ ] Add single-flight dedupe per cache key inside one runtime isolate.

Acceptance:

- [ ] Two concurrent stale requests trigger one regeneration task.
- [ ] Failed regeneration keeps last good HTML.

### Step 7: Background Task Hook

- [ ] Cloudflare path uses `ctx.waitUntil(promise)`.
- [ ] Hono path uses available execution context if exposed.
- [ ] Deno path starts task without blocking response and logs failures.
- [ ] Tests inject `waitUntil` and assert it was called.

Acceptance:

- [ ] Stale response returns before regeneration promise resolves.
- [ ] Regeneration failure is observable but not user-facing as 500.

### Step 8: CLI Entry

- [ ] Add `packages/adapter-vite/src/cli/serve.ts`.
- [ ] Add `deno task serve`.
- [ ] Flags:
  - `--dist www/dist`
  - `--host 0.0.0.0`
  - `--port 8000`
  - `--cache memory|deno-kv`
- [ ] Default local cache is memory unless Deno KV flag is provided.

Acceptance:

- [ ] `deno task serve` starts after `deno task build`.
- [ ] Local `/`, `/api/*`, and ISR fixture route respond.

### Step 9: Worker Entry

- [ ] Add `www/worker.ts`.
- [ ] Bind `ASSETS` if using Workers assets.
- [ ] Bind `LESSJS_ISR` KV namespace.
- [ ] Create `CfKvIsrCache` from env binding.
- [ ] Export default Worker `fetch`.

Acceptance:

- [ ] Worker entry typechecks.
- [ ] Mock Worker test can call `fetch(request, env, ctx)`.

## Verification

```sh
deno test packages/adapter-vite/__tests__/isr-handler.test.ts
deno test packages/adapter-vite/__tests__/serve-cli.test.ts
deno task build
deno task serve
```

Manual smoke:

```sh
curl -i http://localhost:8000/
curl -i http://localhost:8000/api/stats
curl -i http://localhost:8000/isr-demo
```

Required checks:

- [ ] First ISR request is miss.
- [ ] Second ISR request inside fresh window is hit.
- [ ] Request after fresh window is stale and schedules regeneration.
- [ ] KV/cache failure serves last good HTML where available.
- [ ] Static routes remain static.

## Exit Criteria

- Edge handler works locally.
- Worker entry is ready for SOP-004 deployment guide.
- No auth/DB/session scope was added.

## Related

- ADR-0038: ISR + Edge KV Architecture
- SOP-002: KV ISR Cache Adapters
- SOP-003: www Showcase
