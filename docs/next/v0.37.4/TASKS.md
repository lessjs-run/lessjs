# v0.37.4 Tasks

## A. Code-Quality Hygiene

- [x] Fix `packages/app/src/authoring.ts` single-quote template interpolation bug.
- [x] Unify `console.error`/`console.warn` in `core/src/dsd-element.ts` via `createLogger('dsd')`.
- [x] Unify `console.error`/`console.warn` in `core/src/render-ir.ts` via `createLogger('render')`.
- [x] Unify `console.warn` in `core/src/security.ts` via `createLogger('security')`.
- [x] Unify `console.error` in `core/src/jsx-render-dom.ts` via `createLogger('dom-render')`.
- [x] Migrate `island-manifest.ts` and `entry-generators.ts` from adapter-vite to ssg.
- [x] Update `build-client.ts` and test files to import from @openelement/ssg.
- [x] Delete all 11 @deprecated re-export shells from `packages/adapter-vite/src/`.
- [x] Update `adapter-vite/src/index.ts` barrel exports.
- [x] Verify graph:check passes after shell removal.

## B. dsd-hydration Deduplication

- [x] Extract `_hydrateEvents()` and `createRenderRoot()` shared logic to `core/src/dsd-hydration.ts`.
- [x] Update adapter-lit, adapter-react, adapter-vanilla to import shared helpers.
- [x] All adapter hydration tests pass.

## C. UI / Router Decoupling

- [x] Inline locale/path utilities and SPA navigation in `open-layout.tsx`.
- [x] Remove `@openelement/router` from `packages/ui/deno.json`.
- [x] All ui tests and graph:check pass (ui no longer depends on router).

## D. Pure CSS UI Foundation

- [x] Audit daisyUI license (MIT).
- [x] Fork daisyUI compiled CSS class definitions for ~17 classes as pure CSS.
- [x] Rewrite Tailwind refs to Open Props custom properties.
- [x] Expand open-props-tokens.ts with 27 component semantic tokens.
- [x] Ensure DSD compatibility: :host selectors, @property, no global document.styleSheets.
- [x] Create daisyClassSheet export via CSSStyleSheet API.
- [x] Smoke tests: token sheet, daisy class selectors, DSD adoptedStyleSheets compatibility.
- [x] Keep existing open-* DSD components unchanged.

### D2. Interactive Components (DsdElement Thin Shells)

Strategy: daisyUI CSS-only interactions use hidden `<input>` `:checked`/`:focus-within` selectors that break in shadow DOM. Solution: thin DsdElement wrappers using signal state → host attribute → `:host([attr])` CSS selectors. Each component reuses daisyClassSheet HTML structure and class names.

- [x] `open-dropdown` — signal `#open`, `data-open` host attr, `:host([data-open="true"])` CSS toggle.
- [x] `open-modal` — signal `#open`, `<dialog>` pattern with `.modal[open]` CSS, backdrop click-to-close.
- [x] `open-tabs` — signal `#active` index, `[slot="tab"]`/`[slot="panel"]` light DOM children pattern.
- [x] Export all 3 components from `packages/ui/src/index.ts`.

## E. Test Supplementation

- [x] Expand ssg tests: ~45 new tests (entry-descriptor, entry-renderer, ssg-render error paths).
- [x] Expand router tests: ~31 new tests (error routes, edge cases, client-router lifecycle).
- [x] Expand protocols tests: ~71 new tests (validator boundary conditions, type-level conformance).
- [x] Total: 1600 tests passed (from 1487), 0 failed.

## F. Documentation

- [x] Update www/home-console and www/open-search to adopt daisyClassSheet.
- [x] Run full gate (fmt, lint, typecheck, test, build, graph, arch, docs, autoflow, dsd, publish dry-run, hub validate, verify configs).
- [x] Extend v0.37.4 scope with interactive component strategy + 3 proof-of-concept thin shells.
