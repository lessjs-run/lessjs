# SOP-002: Island Manifest Pipeline

> Version: v0.21.0\
> Phase: Build Pipeline\
> Priority: P0\
> Status: IMPLEMENTED

## Objective

Carry normalized hydration strategy data from route scanning through client
entry generation, SSR admission, build reports, and generated HTML.

## Files To Inspect First

- `packages/core/src/island.ts`
- `packages/core/src/types.ts`
- `packages/adapter-vite/src/route-scanner.ts`
- `packages/adapter-vite/src/island-manifest.ts`
- `packages/adapter-vite/src/entry-generators.ts`
- `packages/adapter-vite/src/cli/build-ssg.ts`
- `packages/adapter-vite/src/cli/build-client.ts`

## Steps

1. Add `HydrationStrategy` and strategy-source fields to shared build types.
2. Update route scanning so directive attributes are detected and removed from
   SSR HTML output where appropriate.
3. Normalize old island strategy values to v0.21 values at one boundary.
4. Extend the island manifest with `strategy`, `strategySource`, and `ssrMode`.
5. Ensure client entry generation groups islands by strategy without changing
   component source modules.
6. Include strategy counts in the build manifest.
7. Include per-island strategy records in `dsd-report.json`.

## Edge Cases

- Multiple elements of the same island tag on one page must not duplicate module
  imports.
- A single module used with different strategies should fail validation unless
  an explicit override rule is defined.
- `client:only` must win over any SSR-capable package metadata.
- Missing strategy defaults to `load` only for interactive islands; static DSD
  components remain zero-JS.

## Verification

- Route scanner tests for each directive.
- Island manifest tests for normalized output.
- Entry generator tests for strategy grouping.
- DSD report tests for strategy fields.
- Build fixture with two pages that use different island sets.
