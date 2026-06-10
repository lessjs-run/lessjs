# v0.37.4 SOP: Hygiene + Pure CSS UI + Test Supplementation

> Status: Active\
> Roadmap: Four-Product Validation Train\
> Depends on: v0.37.3\
> NextVersion: `docs/next/v0.37.4/`

## Goal

Close code-quality debt identified in the 2026-06-10 comprehensive audit, build
a pure CSS UI foundation, and supplement test coverage for under-tested
packages — within a single bounded version.

## Entry Criteria

- v0.37.3 Data / Database Boundary is closed.
- v0.37.2 JSR publish (20/20) and consumer smoke confirmed.
- Comprehensive audit `docs/conversation/20260610/` completed and reviewed.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0093: SSR / ISR Runtime Contract.
- ADR-0074: UI Dual-Track Ocean and Island Architecture.
- ADR-0075: Fork daisyUI Compiled CSS.
- ADR-0076: Open Props and daisyUI Token Merge.

## Step-by-Step Tasks

### A. Code-Quality Hygiene

1. [ ] Fix `packages/app/src/authoring.ts` single-quote template interpolation
       bug (lines 216, 221, 231, 351: `'${ERROR_PREFIX}'` → backticks).
2. [ ] Unify `console.error`/`console.warn` in `core/src/dsd-element.ts` to
       `createLogger('core')`.
3. [ ] Unify `console.error`/`console.warn` in `core/src/render-ir.ts` to
       `createLogger('render')`.
4. [ ] Unify `console.warn` in `core/src/security.ts` to
       `createLogger('security')`.
5. [ ] Unify `console.error` in `core/src/jsx-render-dom.ts` to
       `createLogger('dom-render')`.
6. [ ] Migrate `island-manifest.ts` and `entry-generators.ts` original
       implementations from `packages/adapter-vite/src/` to
       `packages/ssg/src/`.
7. [ ] Update `build-client.ts` and 9 test files to import directly from
       `@openelement/ssg`.
8. [ ] Delete all 11 `@deprecated` re-export shells from
       `packages/adapter-vite/src/`.
9. [ ] Update `adapter-vite/src/index.ts` barrel exports.
10. [ ] Verify `graph:check` passes after shell removal.

### B. dsd-hydration Deduplication

11. [ ] Extract `_hydrateEvents()` and `createRenderRoot()` shared logic to
        `packages/core/src/dsd-hydration.ts`.
12. [ ] Update adapter-lit, adapter-react, adapter-vanilla to import shared
        helpers.
13. [ ] Run all adapter hydration tests — all pass.

### C. UI / Router Decoupling

14. [ ] Inline locale/path utilities and SPA navigation lifecycle in
        `open-layout.tsx` (~120 lines net addition).
15. [ ] Remove `@openelement/router` and `@openelement/router/client-router`
        from `packages/ui/deno.json` imports.
16. [ ] Run ui tests and www e2e nav tests — all pass.
17. [ ] Verify `graph:check` shows ui no longer depends on router.

### D. Pure CSS UI Foundation (Core Deliverable)

18. [ ] Audit daisyUI license (MIT) and document.
19. [ ] Extract daisyUI compiled CSS class definitions for ~15–20 utility
        classes as pure CSS (zero Tailwind runtime).
20. [ ] Rewrite all Tailwind-specific references (`theme()`, `rgb()`,
        `@apply`) to Open Props custom properties.
21. [ ] Expand `open-props-tokens.ts` to ~40 tokens covering colors, spacing,
        typography, radii, shadows, transitions.
22. [ ] Ensure DSD compatibility: `:host` not `:root`, `@property` for shadow
        boundary inheritance, no global `document.styleSheets` reliance.
23. [ ] Add smoke tests: plain HTML, DsdElement light DOM, DsdElement shadow
        DOM (DSD SSR output verified).
24. [ ] Keep existing `open-*` DSD components unchanged.

### E. Test Supplementation

23. [ ] Expand ssg tests: EntryDescriptor, EntryRenderer, SSG render error
        paths (≥40% coverage).
24. [ ] Expand router tests: error routes, edge cases, client-router SPA
        lifecycle (≥60% coverage).
25. [ ] Expand protocols tests: validator boundary conditions, type-level
        conformance (≥60% coverage).

### F. Gate and Evidence

26. [ ] Run `deno task gate` (fmt, lint, typecheck, test, build, graph:check,
        arch:check, docs:check, autoflow, dsd:check-report, publish:dry-run,
        hub:validate, verify:configs).
27. [ ] Record evidence in `docs/next/v0.37.4/`.

## Verification

- No `@deprecated` shells remaining in adapter-vite.
- `core/src/` product files use `createLogger`, not bare `console.*`.
- `authoring.ts` error messages interpolate correctly.
- `open-layout.tsx` no longer imports `@openelement/router`.
- ssg/router/protocols test coverage meets targets.
- CSS tokens work in plain HTML, DsdElement light DOM, and DsdElement shadow DOM (DSD SSR verified).
- All existing gates pass.

## Non-Goals

- No blind daisyUI fork.
- No Tailwind runtime dependency.
- No coupling between CSS and DsdElement behavior.
- No large component rewrite.
- No package split/merge (protocols migration deferred to v0.37.5).
- No new external dependencies.

## Exit Criteria

- All 11 deprecated shells deleted from adapter-vite.
- UI CSS has a clear import path and theme contract.
- The same CSS layer works in plain HTML, light DOM, and shadow DOM.
- Behavior components remain optional.
- ssg test ≥40%, router test ≥60%, protocols test ≥60%.
- `deno task gate` fully green.

## AutoFlow Boundary

AutoFlow may check test coverage, gate results, and CSS snapshots. It must not
decide license strategy, fork policy, or package removals.
