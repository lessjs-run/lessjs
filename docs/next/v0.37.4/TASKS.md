# v0.37.4 Tasks

## A. Code-Quality Hygiene

- [ ] Fix `packages/app/src/authoring.ts` single-quote template interpolation
      bug (lines 216, 221, 231, 351: `'${ERROR_PREFIX}'` → backticks).
- [ ] Unify `console.error`/`console.warn` in `core/src/dsd-element.ts` to use
      `createLogger('core')`.
- [ ] Unify `console.error`/`console.warn` in `core/src/render-ir.ts` to use
      `createLogger('render')`.
- [ ] Unify `console.warn` in `core/src/security.ts` to use
      `createLogger('security')`.
- [ ] Unify `console.error` in `core/src/jsx-render-dom.ts` to use
      `createLogger('dom-render')`.
- [ ] Migrate `island-manifest.ts` original impl from
      `packages/adapter-vite/src/` to `packages/ssg/src/`.
- [ ] Migrate `entry-generators.ts` original impl from
      `packages/adapter-vite/src/` to `packages/ssg/src/`.
- [ ] Update `adapter-vite/src/cli/build-client.ts` import to
      `@openelement/ssg`.
- [ ] Update 9 adapter-vite test files to import from `@openelement/ssg`
      (route-scanner, entry-renderer, entry-descriptor, ssr-admission,
      ssg-package-resolver, hub-client-only-tags, generated-data-resolver,
      static-paths, external-resolver).
- [ ] Delete 11 `@deprecated` re-export shell files from
      `packages/adapter-vite/src/`.
- [ ] Update `adapter-vite/src/index.ts` barrel exports to remove deleted
      shells.
- [ ] Verify `graph:check` passes after shell removal.

## B. dsd-hydration Deduplication

- [ ] Extract `_hydrateEvents()` shared logic to
      `packages/core/src/dsd-hydration.ts`.
- [ ] Extract `createRenderRoot()` shared logic to
      `packages/core/src/dsd-hydration.ts`.
- [ ] Update `adapter-lit/src/dsd-hydration.ts` to import shared helpers.
- [ ] Update `adapter-react/src/dsd-hydration.ts` to import shared helpers.
- [ ] Update `adapter-vanilla/src/dsd-hydration.ts` to import shared helpers.
- [ ] Verify all adapter tests pass after deduplication.

## C. UI / Router Decoupling

- [ ] Inline locale/path utility functions (parsePathWithoutLocale,
      detectLocale, localizePath, switchPath, switchLabel) in
      `packages/ui/src/open-layout.tsx`.
- [ ] Inline SPA navigation lifecycle (start/stop, popstate, click delegation,
      Navigation API) in `open-layout.tsx`.
- [ ] Remove `@openelement/router` and `@openelement/router/client-router`
      from `packages/ui/deno.json` imports.
- [ ] Update `open-layout.tsx` tests to pass without router import.
- [ ] Verify `graph:check` shows ui no longer depends on router.

## D. Pure CSS UI Foundation (Core Deliverable)

- [ ] Audit daisyUI license (MIT) and document in `docs/next/v0.37.4/`.
- [ ] Extract daisyUI compiled CSS class definitions for ~15–20 utility classes
      (`btn`, `btn-primary`, `btn-ghost`, `card`, `card-body`, `badge`, `alert`,
      `input`, `textarea`, `select`, `divider`, `tooltip`, `modal`, `menu`,
      `dropdown`, `tabs`).
- [ ] Rewrite all Tailwind-specific var references (`theme()`, `rgb()`,
      `@apply`) in forked CSS to use Open Props custom properties
      (`var(--color-primary)` etc.).
- [ ] Expand `open-props-tokens.ts` from ~30 tokens to ~40 tokens covering
      colors, spacing, typography, radii, shadows, transitions.
- [ ] Ensure forked CSS is DSD-compatible: no `:root` selectors (use
      `:host`), no reliance on global `document.styleSheets`, prefer
      `@property` for shadow-boundary inheritance.
- [ ] Add smoke test: static HTML with `<link>` + tokens + daisy classes —
      visual regression snapshot.
- [ ] Add smoke test: DsdElement light DOM (`renderMode = 'light'`) with
      `adoptedStyleSheets = [tokenSheet]`.
- [ ] Add smoke test: DsdElement shadow DOM (default) with
      `adoptedStyleSheets = [tokenSheet, daisySheet]` — verify DSD SSR output
      renders correctly.
- [ ] Keep existing `open-*` DSD components unchanged (additive, not
      replacement).

## E. Test Supplementation

- [ ] Add `packages/ssg/__tests__/entry-descriptor.test.ts`: ~20 tests covering
      buildEntryDescriptor options, SSG/SSR modes, island mapping, CSP config,
      appShell variants.
- [ ] Add `packages/ssg/__tests__/entry-renderer.test.ts`: ~15 tests covering
      renderEntry output, Hono entry generation, middleware wiring, error
      paths.
- [ ] Add `packages/ssg/__tests__/ssg-render.test.ts` error paths: failing
      getStaticPaths, malformed modules, missing default exports.
- [ ] Add `packages/router/__tests__/router.test.ts`: ~20 tests covering error
      routes, edge case patterns, locale switching edge cases.
- [ ] Add `packages/router/__tests__/client-router.test.ts`: ~15 tests covering
      SPA navigation lifecycle, popstate, click delegation, locale.
- [ ] Add `packages/protocols/__tests__/validators.test.ts`: ~15 tests covering
      boundary conditions (null, undefined, malformed, empty arrays).
- [ ] Add `packages/protocols/__tests__/type-level.test.ts`: type-level
      conformance checks.

## F. Documentation

- [ ] Update `docs/status/STATUS.md` to set active execution = v0.37.4.
- [ ] Update `docs/roadmap/ROADMAP.md` to reflect expanded v0.37.4 scope.
- [ ] Update `docs/sop/v0.37.4/README.md` with full task list.
- [ ] Add CSS token documentation to `docs/guide/` or package README.
- [ ] Run `deno task gate` and record evidence.
