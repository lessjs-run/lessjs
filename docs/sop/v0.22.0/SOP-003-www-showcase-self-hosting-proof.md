# SOP-003: www Showcase Self-Hosting Proof

> Version: v0.22.0
> Priority: P0
> Status: PLANNED
> Depends on: SOP-001, SOP-002

## Objective

Make the LessJS website prove the framework's claimed capabilities. The site
should demonstrate SSG, DSD, Reactive DSD, Islands, Hono API routes, ISR, and
edge deployment using LessJS itself.

This is not a marketing page. It is an executable integration fixture.

## Non-Goals

- Do not add user accounts.
- Do not add persistent analytics storage beyond simple platform counters.
- Do not add CMS/admin UI.
- Do not add a database dependency.
- Do not hide failures behind static mock text.

## Required Routes

| Route               | Purpose                                              | Rendering     |
| ------------------- | ---------------------------------------------------- | ------------- |
| `/showcase`         | Demonstrate DSD, Reactive DSD, and framework islands | SSG + islands |
| `/isr-demo`         | Demonstrate ISR miss/hit/stale behavior              | ISR           |
| `/api/stats`        | Demonstrate serverless API route                     | Hono API      |
| `/blog/:slug`       | Demonstrate real content route with ISR              | ISR + content |
| `/guide/deployment` | Explain static, Worker, and Deno Deploy choices      | SSG           |

## Step-by-Step Execution

### Step 0: Baseline

- [ ] Run `deno task build`.
- [ ] Confirm current homepage, guide, roadmap, and registry pages still build.
- [ ] Confirm `www/e2e` tests pass or record existing blockers.

### Step 1: `/showcase`

- [ ] Add `www/app/routes/showcase.ts`.
- [ ] Include one static DSD component.
- [ ] Include one Reactive DSD counter/toggle from v0.21.
- [ ] Include one Lit island.
- [ ] Include one React island.
- [ ] Include one `client:visible` example.
- [ ] Add visible runtime state only where interactivity is real.

Acceptance:

- [ ] Page builds as SSG.
- [ ] DSD report classifies components correctly.
- [ ] Island JS budget remains within configured limit.

### Step 2: `/isr-demo`

- [ ] Add `www/app/routes/isr-demo.ts`.
- [ ] Export `revalidate = 10` or another short test interval.
- [ ] Render:
  - generated timestamp;
  - cache state from response header when available;
  - next regeneration window;
  - manual refresh link or button.
- [ ] Avoid client-only dependency for the core proof.

Acceptance:

- [ ] First request shows generated timestamp.
- [ ] Subsequent request inside fresh window is cache hit.
- [ ] Request after fresh window returns stale or regenerated timestamp according
      to handler semantics.

### Step 3: `/api/stats`

- [ ] Add `www/app/routes/api/stats.ts`.
- [ ] Return JSON:
  - build timestamp;
  - runtime platform;
  - request count if available in memory/KV;
  - ISR cache state if request includes a route query.
- [ ] Keep the route Hono-native.

Acceptance:

- [ ] `/api/stats` returns valid JSON locally.
- [ ] Worker deployment returns platform info.

### Step 4: `/blog/:slug` ISR Proof

- [ ] Add or adapt `www/app/routes/blog/[slug].ts` with `revalidate`.
- [ ] Ensure static content still works for SSG.
- [ ] Ensure ISR route is included in manifest.
- [ ] Add response header visibility for cache state.

Acceptance:

- [ ] Blog route appears in `isr-manifest.json`.
- [ ] Blog HTML can be cached and regenerated.

### Step 5: Navigation and Docs Links

- [ ] Add Showcase route to nav where appropriate.
- [ ] Link ISR demo from deployment and roadmap pages.
- [ ] Make wording factual:
  - "Edge Full-Stack MVP"
  - "route-level ISR"
  - "Hono API routes"
  - not "complete replacement for mature full-stack frameworks"

Acceptance:

- [ ] Public pages do not overclaim auth/DB/ecosystem maturity.

### Step 6: E2E Tests

- [ ] Add `www/e2e/showcase.spec.ts`.
- [ ] Add `www/e2e/isr-demo.spec.ts`.
- [ ] Test:
  - Showcase loads;
  - Reactive DSD demo updates;
  - Lit/React islands hydrate;
  - `/api/stats` returns JSON;
  - `/isr-demo` exposes ISR headers in preview/serve mode.

Acceptance:

- [ ] E2E tests are deterministic and do not rely on external deployment.

## Verification

```sh
deno task build
deno task dsd:check-report
deno task test:e2e
```

Manual deployment smoke:

```sh
curl -i https://lessjs.run/showcase
curl -i https://lessjs.run/isr-demo
curl -i https://lessjs.run/api/stats
curl -i https://lessjs.run/blog/hello
```

## Exit Criteria

- The website demonstrates each v0.22 claim with working routes.
- Showcase failures are caught by build, DSD report, or e2e tests.
- The public wording stays inside the Edge Full-Stack MVP boundary.

## Related

- SOP-001: ISR Production Handler
- SOP-002: KV ISR Cache Adapters
- SOP-004: Deployment Guide
