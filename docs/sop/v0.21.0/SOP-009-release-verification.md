# SOP-009: Release Verification

> Version: v0.21.0\
> Phase: Release Closure\
> Priority: P0\
> Status: IMPLEMENTED

## Required Commands

Run from repository root:

```sh
deno task fmt:check
deno task lint
deno task typecheck
deno task docs:check-strategy
deno task hub:validate --strict --json
deno task hub:check-index
deno task test
deno audit
deno task build
deno task dsd:check-report
deno task test:e2e
deno task publish:dry-run
```

## Required Targeted Tests

Before full test, run targeted suites:

```sh
deno test --allow-read --allow-write --allow-env --allow-net --allow-run \
  packages/core/__tests__/island.test.ts \
  packages/adapter-vite/__tests__/island-manifest.test.ts \
  packages/adapter-vite/__tests__/entry-generators.test.ts \
  packages/adapter-vite/__tests__/ssg-report.test.ts
```

Add new tests for:

- `client:load`
- `client:idle`
- `client:visible`
- `client:only`
- ISR cache states
- API production handler

## Report Checks

Inspect generated:

- `www/dist/dsd-report.json`
- build manifest output
- `hub-index/index.json`

The release cannot close if:

- DSD report contains unknown error classes.
- client-only modules appear in SSR bundle.
- e2e has hydration strategy failures.
- docs claim unsupported SSR/ISR behavior.

## Changelog Requirements

Update:

- `docs/changelog/v0.21.0.md`
- `docs/status/STATUS.md`
- `docs/roadmap/ROADMAP.md`
- README files after implementation is complete

Do not mark v0.21 as current until the full gate is green.
