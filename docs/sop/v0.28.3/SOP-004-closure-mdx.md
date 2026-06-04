# SOP-004: v0.28.3 Cleanup Closure + MDX

> Version: v0.28.3
> Date: 2026-06-02
> Status: Implemented
> Input: v0.28.2 deprecated purge implementation plus the deferred closure and
> MDX targets from the v0.28 audit
> Output: test floor, lockfile alignment, P2 cleanup, ADR-0072, MDX compiler and
> Vite plugin, package bump, changelog, and release note

## Summary

v0.28.3 is the pre-freeze closure release. It finishes the deferred cleanup
from the v0.28 audit and adds MDX through the existing LessJS DSD pipeline.

This SOP was rewritten from a deferred plan into an execution record because
the v0.28.2 and v0.28.3 work was completed together and published as one
coherent `0.28.3` package line.

## Implemented Changes

### Test Floor

- Added `packages/router/src/__tests__/router.test.ts` with 104 tests covering
  path parsing, matching, ranking, navigation, locale helpers, route manifests,
  and error cases.
- Added `packages/runtime/src/__tests__/runtime.test.ts` with 90 tests covering
  runtime facade exports, JSX runtime behavior, signal/style-sheet integration,
  and public runtime contracts.
- Added `packages/protocols/src/__tests__/validators.test.ts` with 101 tests
  for protocol and manifest validation.
- Added `packages/protocols/src/validators.ts` and exported it as
  `@openelement/protocols/validators`.

### Lockfile Alignment

- Removed stale dependency state and regenerated `deno.lock`.
- Aligned Hono to `4.12.23`.
- Aligned Playwright and Playwright Core to `1.59.1`.
- Added MDX dependencies through package import maps instead of ad hoc runtime
  imports.

### P2 Cleanup

- Documented root `tsconfig.json` as editor-only.
- Matched `deno.json` lint exclusions with formatter exclusions.
- Added `.github/agents/README.md` to explain retained agent prompt assets.

### MDX Design And Implementation

- Added `docs/adr/ADR-0072-mdx-in-lessjs.md`.
- Added `packages/content/src/mdx/` with `compileMdx()` and typed MDX metadata.
- Exported `@openelement/content/mdx`.
- Added `packages/adapter-vite/src/plugin-mdx.ts` with `lessMdx()` and
  `mdxPlugin()` exports.
- Inserted the MDX plugin into the Less Vite plugin stack.
- Added `www/content/mdx/example.mdx` and `www/app/routes/guide/mdx.tsx`.
- Added package-level and docs-site MDX tests.

### Package Release Alignment

- Bumped all 19 package `deno.json` versions to `0.28.3`.
- Updated internal `jsr:@openelement/*` ranges to `^0.28.3`.
- Added `docs/changelog/v0.28.3.md` and `docs/release/v0.28.3.md`.

## Rewrite Notes

- The original SOP required v0.28.2 to close first. That condition is now
  satisfied inside this release train; v0.28.2 is documented as the hardening
  layer and v0.28.3 as the final package bump and closure layer.
- MDX is implemented as build-time compilation through `@mdx-js/mdx` and the
  Less JSX runtime. There is no runtime MDX parser, no React dependency, and no
  second HTML renderer.
- The docs-site MDX example is intentionally small and exercises the DSD output
  path rather than creating a separate content framework.

## Verification

The local release gate for v0.28.3 passed on 2026-06-02:

- `deno task fmt:check`
- `deno task typecheck`
- `deno task docs:check-strategy`
- `deno task docs:check-current`
- `deno task lint`
- `deno audit`
- `deno task graph:check`
- `deno task graph:check-imports`
- `deno task dist:check-object-object`
- `deno task test`
- `deno task build`
- `deno task dsd:check-report`
- `deno task test:e2e`
- 19-package `deno publish --dry-run --allow-dirty`

The final command results are recorded in the v0.28.3 release note.

## Exit Criteria

- Router, runtime, and protocols have the requested test floor.
- Hono and Playwright lockfile drift is removed.
- P2 cleanup items are closed.
- ADR-0072 exists and MDX compiles through the LessJS DSD path.
- All packages are aligned to `0.28.3`.
- Changelog and release notes exist for v0.28.2 and v0.28.3.
- The full local release gate passed before pushing to `dev`.
