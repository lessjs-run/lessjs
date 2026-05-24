# SOP-004: Deployment Guide

> Version: v0.22.0
> Priority: P1
> Status: PLANNED
> Depends on: SOP-001, SOP-002, SOP-003

## Objective

Publish deployment guides and templates for the three realistic LessJS
deployment modes:

1. Static-only hosting.
2. Cloudflare Workers with KV for API routes and ISR.
3. Deno Deploy with Deno KV for API routes and ISR.

## Non-Goals

- Do not document unsupported Node production server as first-class.
- Do not require users to deploy ISR when static hosting is enough.
- Do not include auth/database setup in the core deployment guide.
- Do not write platform docs that cannot be verified by command or template.

## Target Files

Templates:

- `www/wrangler.toml`
- `www/worker.ts`
- `www/deno-serve.ts`
- `.github/workflows/deploy-cloudflare.yml` if appropriate
- `.github/workflows/deploy-deno.yml` if appropriate

Docs:

- `docs/guide/deploy-static.md`
- `docs/guide/deploy-cloudflare-workers.md`
- `docs/guide/deploy-deno-deploy.md`
- `www/app/routes/guide/deployment.ts`

## Step-by-Step Execution

### Step 0: Decision Tree

- [ ] Add a plain decision tree:
  - static content only -> static hosting;
  - API routes or ISR on Cloudflare -> Workers + KV;
  - API routes or ISR on Deno -> Deno Deploy + Deno KV;
  - auth/database needed -> integrate external service, not core.

Acceptance:

- [ ] A new user can choose deployment mode without reading all guides.

### Step 1: Static-Only Guide

- [ ] Document `deno task build`.
- [ ] Document output directory.
- [ ] Document GitHub Pages, Netlify, S3, or generic static host assumptions.
- [ ] Explain that API routes and ISR are unavailable in static-only mode.

Acceptance:

- [ ] Static guide does not mention KV as required.

### Step 2: Cloudflare Workers Guide

- [ ] Provide `wrangler.toml` with:
  - worker name;
  - compatibility date;
  - assets/dist binding;
  - KV namespace binding;
  - environment variables.
- [ ] Provide `worker.ts` using `createLessEdgeHandler`.
- [ ] Document:
  - `wrangler kv namespace create`;
  - `deno task build`;
  - `wrangler deploy`;
  - cache header verification;
  - `/api/stats` verification;
  - `/isr-demo` verification.

Acceptance:

- [ ] Guide can be followed from a clean checkout.
- [ ] Required binding names match code.

### Step 3: Deno Deploy Guide

- [ ] Provide `www/deno-serve.ts`.
- [ ] Document `Deno.openKv()` permissions and runtime assumptions.
- [ ] Document deployctl or Deno Deploy dashboard flow.
- [ ] Document local smoke command:
  - `deno task build`
  - `deno task serve --cache deno-kv`
- [ ] Document `/api/stats` and `/isr-demo` verification.

Acceptance:

- [ ] Deno guide does not rely on Cloudflare concepts.
- [ ] Local Deno KV path works or skip condition is documented.

### Step 4: CI/CD Templates

- [ ] Add or document a Cloudflare deploy workflow.
- [ ] Add or document a Deno Deploy workflow.
- [ ] Include required secrets by name.
- [ ] Keep workflows optional; do not make CI deploy part of normal tests.

Acceptance:

- [ ] Users can copy template without guessing secret names.

### Step 5: Troubleshooting

- [ ] Add common failure cases:
  - missing KV binding;
  - missing `www/dist`;
  - stale manifest;
  - wrong cache key;
  - API route not found;
  - Worker asset path mismatch.
- [ ] Add exact symptom and fix for each.

Acceptance:

- [ ] Troubleshooting entries point to commands or files.

## Verification

```sh
deno task build
deno task serve
curl -i http://localhost:8000/
curl -i http://localhost:8000/api/stats
curl -i http://localhost:8000/isr-demo
```

Platform verification:

- [ ] `wrangler deploy` succeeds with KV binding.
- [ ] Cloudflare `/api/stats` returns 200 JSON.
- [ ] Cloudflare `/isr-demo` returns ISR cache headers.
- [ ] Deno Deploy route returns 200.
- [ ] Deno Deploy `/isr-demo` updates according to revalidate window.

## Exit Criteria

- Static, Cloudflare, and Deno guides are all present.
- Templates match implementation names.
- The guide does not overpromise full-stack features outside v0.22 scope.

## Related

- SOP-001: ISR Production Handler
- SOP-002: KV ISR Cache Adapters
- SOP-003: www Showcase
