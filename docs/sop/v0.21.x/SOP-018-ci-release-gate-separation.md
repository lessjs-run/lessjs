# SOP-018: CI and Release Gate Separation

Status: implemented\
Applies to: v0.21.x JSR consumer hardening\
Related ADR: [ADR-0048](../../adr/ADR-0048-ci-release-gate-separation.md)

## Goal

Keep LessJS release validation strict without making every branch gate depend
on already-published JSR latest packages. The pipeline must distinguish current
source validation, immutable JSR release validation, and platform monitoring.

## Required CI Shape

### Source-backed SOP Gate

`.github/workflows/sop-gate.yml` validates the current branch. It must include:

- formatting, lint, typecheck, audit, full tests;
- generated-project starter proof from local source;
- repo build, DSD report, Hub validation, Hub index check, docs strategy check;
- e2e tests.

It must not require a JSR latest consumer matrix, because that checks the last
published version rather than the current commit.

### Post-publish Consumer Smoke

`.github/workflows/publish.yml` remains the release truth for JSR consumers:

```sh
deno run -A jsr:@lessjs/create test-blog
cd test-blog
deno task build
test -f dist/index.html
```

This gate runs only after missing package versions are published, so it can
validate the exact immutable package set users will install.

### Windows JSR Latest Monitor

`.github/workflows/jsr-consumer-monitor.yml` runs the public JSR latest path on
Windows by schedule and manual dispatch. It monitors platform compatibility and
hosted-runner drift, but it is not a required branch or publish gate.

## v0.21.13 to v0.21.16 Lessons

The post-publish smoke caught issues that local source tests could not fully
prove before publication:

- `0.21.13`: JSR remote execution needed `file:` guards before
  `fileURLToPath()`.
- `0.21.14`: Phase 2 client island builds needed the same LessJS JSR package
  resolver used by Phase 3 SSG.
- `0.21.15`: `content.nav` needed a default `routesDir` and the create template
  needed to write it explicitly.
- `0.21.16`: the outer Vite build needed a no-op trigger entry instead of
  bundling the generated Hono SSR entry as a browser artifact; remote
  `@lessjs/core/*` resolution needed to derive URLs from `@lessjs/core`, not
  `@lessjs/adapter-vite`.

## Acceptance Commands

Before pushing a CI/SOP change:

```sh
deno task fmt:check
deno task typecheck
deno test --allow-read --allow-write --allow-env --allow-run packages/create/__tests__/cli.test.ts packages/adapter-vite/__tests__/build.test.ts
deno task docs:check-strategy
```

After publishing a new package set:

```sh
deno run -A jsr:@lessjs/create test-blog
cd test-blog
deno task build
test -f dist/index.html
```

For Windows compatibility monitoring, run `JSR Consumer Monitor` manually if
the scheduled result is canceled or stale.
