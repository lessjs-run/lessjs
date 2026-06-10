# v0.37.4 Acceptance Criteria

## A. Code-Quality Hygiene

- [ ] `authoring.ts` error messages interpolate `${ERROR_PREFIX}` correctly.
- [ ] `dsd-element.ts`, `render-ir.ts`, `security.ts`, `jsx-render-dom.ts` use
      `createLogger(scope)` — zero direct `console.*` calls outside logger.
- [ ] All 11 `@deprecated` re-export shells deleted from
      `packages/adapter-vite/src/`.
- [ ] `island-manifest.ts` and `entry-generators.ts` original impls live in
      `@openelement/ssg`.
- [ ] `graph:check` passes with no new cycles after shell removal.
- [ ] All existing adapter-vite tests pass with updated import paths.

## B. dsd-hydration Deduplication

- [ ] `_hydrateEvents()` and `createRenderRoot()` live once in
      `core/src/dsd-hydration.ts`.
- [ ] adapter-lit, adapter-react, adapter-vanilla import shared helpers from
      core.
- [ ] All adapter hydration tests pass.
- [ ] No code duplication across the three adapter dsd-hydration files for the
      extracted logic.

## C. UI / Router Decoupling

- [ ] `packages/ui` has zero imports from `@openelement/router`.
- [ ] `open-layout.tsx` locale/path utilities work identically to before.
- [ ] SPA navigation (click delegation, popstate, locale switch) works
      identically.
- [ ] `graph:check` confirms ui no longer depends on router.
- [ ] All ui and www tests pass.

## D. Pure CSS UI Foundation

- [ ] daisyUI license audit documented (MIT, safe to fork compiled CSS).
- [ ] ~15–20 daisyUI class sets forked as pure CSS (zero Tailwind runtime).
- [ ] All Tailwind-specific references (`theme()`, `rgb()`, `@apply`) rewritten
      to Open Props custom properties.
- [ ] `open-props-tokens.ts` expanded to ~40 tokens (colors, spacing,
      typography, radii, shadows, transitions).
- [ ] Forked CSS is DSD-compatible: uses `:host` not `:root`, no global
      `document.styleSheets`, `@property` for shadow boundary inheritance.
- [ ] Smoke: static HTML + `<link>` + tokens + daisy classes renders correctly.
- [ ] Smoke: DsdElement light DOM with `adoptedStyleSheets = [tokenSheet]`.
- [ ] Smoke: DsdElement shadow DOM with `adoptedStyleSheets = [tokenSheet, daisySheet]` —
      DSD SSR output verified.
- [ ] Existing `open-*` DSD components unchanged.
- [ ] No Tailwind runtime dependency introduced.

## E. Test Supplementation

- [ ] ssg test coverage ≥40% (from 16.5%).
- [ ] router test coverage ≥60% (from 4.3%).
- [ ] protocols test coverage ≥60% (from 6.4%).
- [ ] No existing test regressions.
- [ ] `deno task test` passes with new tests included.

## F. Gate

- [ ] `deno task fmt:check` passes.
- [ ] `deno task lint` passes.
- [ ] `deno task typecheck` passes.
- [ ] `deno task test` passes.
- [ ] `deno task build` passes.
- [ ] `deno task graph:check` passes.
- [ ] `deno task arch:check` passes.
