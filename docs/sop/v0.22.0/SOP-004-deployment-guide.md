# SOP-004: Deployment Guide — CF Workers + Deno Deploy

> Version: v0.22.0
> Priority: P1
> Depends on: SOP-001, SOP-002

## Objective

Document the two production deployment paths with step-by-step guides,
working configuration templates, and CI/CD integration.

## Deliverables

### CF Workers Deployment

- [ ] `www/wrangler.toml` template with KV namespace binding
- [ ] `www/worker.ts` entry point using Hono + CfKvIsrCache
- [ ] Guide: `docs/guide/deploy-cf-workers.md`
- [ ] GitHub Action template for `wrangler deploy`

### Deno Deploy Deployment

- [ ] `deno task serve` command using Deno KV
- [ ] Guide: `docs/guide/deploy-deno-deploy.md`
- [ ] GitHub Action template for `deployctl`

### Common

- [ ] Static-only deployment (GitHub Pages, no ISR/API)
- [ ] Hybrid: static on Pages + API routes on Workers
- [ ] Decision tree: "Which deployment should I choose?"

## Decision Tree

```
Do you need API routes or ISR?
├── No → Static hosting (GitHub Pages, Netlify, S3)
└── Yes → Which runtime?
    ├── Cloudflare Workers → CfKvIsrCache + wrangler.toml
    └── Deno Deploy → DenoKvIsrCache + deployctl
```

## Verification

- `wrangler deploy` succeeds with KV binding
- `/api/stats` returns 200 on deployed Worker
- `/isr-demo` shows ISR timestamp updating
- Deno Deploy `deployctl` succeeds
