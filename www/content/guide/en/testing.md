---
title: 'Testing'
section: 'Production'
label: 'Testing'
order: 40
---

# Testing

Tests should prove the public contract, not just private helpers.

## Application Tests

Use Deno's test runner for pure logic, page descriptors, API handlers, and
custom element helpers.

```bash
deno test --allow-read --allow-write --allow-env --allow-net --allow-run
```

## Build Smoke

Every release should build `www` and at least one generated consumer project.
This proves routing, JSX, DSD output, island metadata, and package resolution.

## Browser E2E

Use Playwright for behavior that depends on Custom Element upgrade,
IntersectionObserver, idle callbacks, Declarative Shadow DOM parsing, or real
DOM event handling.

## Release Gates

The release gate includes architecture checks, package graph checks, docs
checks, lint, typecheck, tests, build, DSD report, e2e, and publish dry-run.
