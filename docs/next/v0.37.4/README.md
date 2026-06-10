# v0.37.4 NextVersion

v0.37.4 is a **hygiene + foundation** release for the four-product validation
train. It combines code-quality cleanup identified in the 2026-06-10
comprehensive audit with the pure CSS UI foundation work, plus test
supplementation for under-covered packages.

Scope:

### A. Code-Quality Hygiene (Audit-Driven)

- fix `packages/app/src/authoring.ts` single-quote template interpolation bug
  (`'${ERROR_PREFIX}'` → `` `${ERROR_PREFIX}` ``);
- unify `console.error`/`console.warn` calls in `dsd-element.ts`, `render-ir.ts`,
  `security.ts`, `jsx-render-dom.ts` to use `core/logger.ts`'s `createLogger`;
- delete all 11 `@deprecated` re-export shells in `packages/adapter-vite/src/`
  and update their consumers to import directly from `@openelement/ssg`;
- extract shared `_hydrateEvents()` + `createRenderRoot()` logic from
  adapter-lit/react/vanilla `dsd-hydration.ts` into `core/src/dsd-hydration.ts`.

### B. Architecture Decoupling

- remove `@openelement/ui`'s dependency on `@openelement/router` by inlining
  locale/path utilities and SPA navigation lifecycle directly in
  `open-layout.tsx` (~150 lines net change, zero functionality loss);

### C. Pure CSS UI Foundation (Core Deliverable)

- fork daisyUI compiled CSS class definitions (~15–20 classes: `btn`, `card`,
  `badge`, `alert`, `input`, `modal`, `menu`, etc.) as pure CSS — zero Tailwind
  plugin, zero runtime JS;
- replace Tailwind token engine with Open Props (`open-props-tokens.ts`,
  expanded to ~40 tokens: colors, spacing, typography, radii, shadows,
  transitions);
- ensure DSD compatibility: `:host` not `:root`, `@property` for shadow
  boundary inheritance, no global `document.styleSheets` reliance;
- verify three surfaces: plain HTML (`<link>`), DsdElement light DOM
  (`adoptedStyleSheets`), DsdElement shadow DOM (`adoptedStyleSheets` with
  DSD SSR output);
- keep existing `open-*` DSD components unchanged (additive CSS layer).

### D. Test Supplementation

- **ssg**: raise test coverage from 16.5% to ≥40% via `entry-descriptor.test.ts`,
  `entry-renderer.test.ts`, `ssg-render.test.ts` expansion;
- **router**: raise from 4.3% to ≥60% via error-path, edge-case, and integration
  tests;
- **protocols**: raise from 6.4% to ≥60% via validator boundary-condition and
  type-level conformance tests.

## Related

- SOP: `docs/sop/v0.37.4/README.md`
- Audit: `docs/conversation/20260610/20260610-comprehensive-review-and-protocol-gap-audit.md`
- Roadmap ADR: `docs/adr/ADR-0091-four-product-platform-roadmap.md`
