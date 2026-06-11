# v0.37.4 Acceptance Criteria

## A. Code-Quality Hygiene

- [x] `authoring.ts` error messages interpolate `${ERROR_PREFIX}` correctly.
- [x] `dsd-element.ts`, `render-ir.ts`, `security.ts`, and
      `jsx-render-dom.ts` use `createLogger(scope)`.
- [x] Deprecated adapter-vite re-export shells are deleted from
      `packages/adapter-vite/src/`.
- [x] `island-manifest.ts` and `entry-generators.ts` implementation ownership
      lives in `@openelement/ssg`.
- [x] `graph:check` passes with no new cycles after shell removal.
- [x] Adapter-vite tests pass with updated import paths.

## B. dsd-hydration Deduplication

- [x] `_hydrateEvents()` and `createRenderRoot()` live once in
      `core/src/dsd-hydration.ts`.
- [x] adapter-lit, adapter-react, and adapter-vanilla import shared helpers
      from core.
- [x] Adapter hydration tests pass.
- [x] The extracted logic is no longer duplicated across the adapter
      dsd-hydration files.

## C. UI / Router Decoupling

- [x] `packages/ui` has zero imports from `@openelement/router`.
- [x] `open-layout.tsx` owns its locale/path utilities.
- [x] SPA navigation click delegation, popstate, and locale switching remain
      covered.
- [x] `graph:check` confirms ui no longer depends on router.
- [x] UI and www tests pass.

## D. Pure CSS UI Foundation

- [x] daisyUI license audit is documented as MIT-compatible for the forked CSS
      class subset.
- [x] daisyUI class sets are forked as pure CSS with zero Tailwind runtime.
- [x] Tailwind-specific references are rewritten to Open Props custom
      properties.
- [x] `open-props-tokens.ts` contains the component semantic token foundation.
- [x] Forked CSS is DSD-compatible: shadow-safe selectors, no global
      `document.styleSheets` dependency, and token inheritance across the
      shadow boundary.
- [x] Static HTML, DsdElement light DOM, and DsdElement shadow/DSD smoke paths
      are covered.
- [x] Existing `open-*` DSD components remain compatible.
- [x] No Tailwind runtime dependency is introduced.

## E. Test Supplementation

- [x] SSG tests cover the new entry descriptor, entry renderer, and render
      error paths.
- [x] Router tests cover error routes, edge patterns, and client-router
      lifecycle.
- [x] Protocol tests cover validator boundary conditions and type-level
      conformance.
- [x] No existing test regressions remain.
- [x] `deno task test` passes with the new tests included.

## F. Gate

- [x] `deno task fmt:check` passes.
- [x] `deno task lint` passes.
- [x] `deno task typecheck` passes.
- [x] `deno task test` passes.
- [x] `deno task build` passes.
- [x] `deno task graph:check` passes.
- [x] `deno task arch:check` passes.

## Release Truth

- [x] v0.37.4 implementation, tag, and GitHub release exist.
- [x] JSR publish recovery was attempted and recorded.
- [x] JSR resolver visibility remains an external distribution caveat under
      ADR-0097, not a version-exit gate.
