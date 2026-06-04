# SOP-012: CI Consumer Smoke Test (Retired)

Status: retired\
Target version: v0.21.10+\
Owner: CI + release owner\
Related: SOP-011, SOP-013, ADR-0041

## Objective

Prevent ESM module graph boundary leaks from reaching JSR consumers.

## Why This SOP Was Retired

The original design placed a `consumer-smoke` job in `test.yml` (pre-publish CI)
to validate JSR consumer builds. This has a **chicken-and-egg problem**:

1. `publish.yml` depends on `test.yml` passing (`needs: [test]`)
2. `test.yml` consumer-smoke pulls packages from JSR (already-published versions)
3. The version on JSR is always **older** than the code being tested
4. If the older JSR version has a bug that the current code already fixes,
   consumer-smoke fails → test.yml fails → publish.yml never runs → fix is
   never published

Example: v0.21.9 had the optional-package 404 bug. We fixed it locally and
bumped to v0.21.10. But the CI consumer-smoke pulls `@openelement/adapter-vite@0.21.9`
from JSR (because 0.21.10 isn't published yet) → hits the same 404 → blocks
the publish that would ship the fix.

## Replacement

Consumer smoke testing is now handled exclusively by **SOP-013** (Post-Publish
Consumer Smoke) in `publish.yml`. The post-publish smoke:

- Runs **after** all packages are published to JSR
- Tests against the **freshly published** version
- Is not in the critical path that blocks publishing

For pre-merge validation, the existing in-workspace tests are sufficient:

- `packages/adapter-vite/__tests__/ssg-package-resolver.test.ts` — validates
  the resolver does not intercept optional packages
- `packages/adapter-vite/__tests__/ssg-smoke.test.ts` — validates the SSG
  build pipeline end-to-end within the workspace
- `packages/create/__tests__/cli.test.ts` — validates scaffold + build

## Lesson

A JSR consumer smoke test cannot be a **pre-publish** gate because it needs the
packages to already be published. The consumer validation belongs in the
**post-publish** phase (SOP-013).
