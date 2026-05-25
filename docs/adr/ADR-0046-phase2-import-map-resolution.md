# ADR-0046: Phase 2 Client Build Import Map Resolution

> **Status**: ACCEPTED
> **Date**: 2026-05-25
> **Applies to**: v0.21.x
> **Extends**: ADR-0042 (Import Map Universal Resolution), ADR-0043 (SSG Phase3 dependency strategy)

## Context

Phase 2 client island build (`buildClient()`) uses `configFile: false` and only applies
`resolve.alias` from `ctx.phase1.userResolveAlias`. The user's full Vite configuration —
including `@deno/vite-plugin` (import map resolution), `resolve.extensions`, and other
plugins — is not inherited.

As a result, bare specifiers like `@lessjs/ui/less-card` in the generated
`virtual:less-client-entry` cannot be resolved. The build fails with Rolldown
resolution errors.

## Decision

**Phase 2 client build will use Deno import map (deno.json) for module resolution,
consistent with Phase 1 and Phase 3.**

Specifically:

1. Add `resolve.extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']` to the client
   build config, ensuring TypeScript files are discoverable.
2. Leverage the Deno import map for resolution of npm/jsr specifiers.

With this change, all three build phases share the same resolution source —
the `deno.json` import map:

| Phase   | Resolution                                                  | Bundler role       |
| ------- | ----------------------------------------------------------- | ------------------ |
| Phase 1 | import map (@deno/vite-plugin)                              | compile + optimize |
| Phase 2 | import map (deno.json)                                      | compile + optimize |
| Phase 3 | import map (Deno ESM Runtime + @lessjs/ssg-package-resolve) | compile + optimize |

## Consequences

- **Positive**: Unified resolution across all phases. No special-case alias
  configurations needed for client island builds.
- **Positive**: Consumer projects benefit from the same import map they
  already maintain for development and Phase 1/3.
- **Positive**: Resolves the pre-existing `@lessjs/ui/less-card` resolution
  failure that was masked by earlier Phase 3 failures.
- **Neutral**: Slightly different code path between workspace (local source)
  and JSR consumer (published packages), but resolution semantics are identical.
