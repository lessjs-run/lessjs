# ADR-0090: SSG Package Extraction — @openelement/ssg

- **Status:** Proposed
- **Date:** 2026-06-08
- **Decision:** Extract SSG (Static Site Generation) functionality from
  `@openelement/adapter-vite` into a new `@openelement/ssg` package.
  Phase 1 (v0.36): Create package with parallel rendering API.
  Phase 2 (v0.37): Migrate SSG files from adapter-vite.

## Context

`@openelement/adapter-vite` is 6800+ lines, combining Vite plugin logic,
dev server configuration, client build, entry generation, and SSG rendering.
This violates single-responsibility and makes the package hard to maintain.

SSG-specific files (~2247 lines):

- `cli/build-ssg.ts` (547 lines)
- `cli/ssg-render.ts` (814 lines)
- `cli/ssg.ts` (120 lines)
- `ssg-package-resolver.ts` (305 lines)
- `ssg-postprocess.ts` (461 lines)

## Decision

### Phase 1 (v0.36.0) — Package skeleton + parallel API

Create `@openelement/ssg` with:

- Parallel rendering engine (`renderSequential`, `renderParallel`)
- SSG page types (`SsgPageInput`, `SsgPageOutput`)
- Clean public API

adapter-vite continues to own SSG orchestration but can delegate
rendering to `@openelement/ssg`.

### Phase 2 (v0.37.0) — File migration

Move SSG files from adapter-vite to ssg package:

- adapter-vite imports from `@openelement/ssg`
- SSG tests move to ssg package
- adapter-vite shrinks by ~2247 lines

## Consequences

- **Positive**: adapter-vite becomes focused on Vite integration only.
- **Positive**: SSG can be used without Vite (e.g., custom build scripts).
- **Positive**: Parallel rendering API is available immediately.
- **Negative**: Temporary duplication during Phase 1-2 transition.
- **Risk**: File migration in Phase 2 may break existing builds.

## References

- ADR-0089: Agent Code Generator (file-system protocol)
- ADR-0088: AutoFlow-First Strategy
