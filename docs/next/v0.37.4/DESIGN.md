# v0.37.4 Design

## 1. Code-Quality Hygiene

### 1.1 authoring.ts Bug Fix

**Problem**: `packages/app/src/authoring.ts` lines 216, 221, 231, 351 use
single-quoted template strings (`'${ERROR_PREFIX}'`) — the template literal
is not interpolated, error messages output the literal string `${ERROR_PREFIX}`
instead of the actual prefix value.

**Fix**: Change single quotes to backticks on the affected lines.
Zero behavioral change beyond correct error messages.

### 1.2 Core Logger Unification

**Problem**: `dsd-element.ts`, `render-ir.ts`, `security.ts`, `jsx-render-dom.ts`
call `console.error`/`console.warn` directly instead of using the scoped
`createLogger` from `core/logger.ts`. This bypasses error format consistency
and the `OpenElementError` structured logging path.

**Approach**: Replace direct `console.*` calls with `createLogger(scope)` in
each file. Scopes: `core`, `render`, `security`, `dom-render`.
No behavioral change — same output, consistent format.

### 1.3 Adapter-Vite Shell Cleanup

**Problem**: 11 files in `packages/adapter-vite/src/` are `@deprecated`
re-exports from `@openelement/ssg` that were promised for removal in v0.37.0.
They persist in v0.37.2, creating deprecation trust deficit and code bloat.

**Affected files** (all ≤23 lines, pure re-export):
`route-scanner.ts`, `entry-renderer.ts`, `ssg-package-resolver.ts`,
`hub-client-only-tags.ts`, `entry-descriptor.ts`, `ssr-polyfills.ts`,
`route-type-generator.ts`, `generated-data-resolver.ts`, `ssg-postprocess.ts`,
`hono-entry.ts`, `external-resolver.ts`.

Also affected: `island-manifest.ts` and `entry-generators.ts` contain original
implementations that belong in `@openelement/ssg` per the v0.36.3 migration
design.

**Approach**:

1. Migrate `island-manifest.ts` and `entry-generators.ts` original impl to
   `@openelement/ssg`.
2. Update `build-client.ts` (1 internal consumer) and 9 test files to import
   directly from `@openelement/ssg`.
3. Delete all 11 shell files.
4. Update `adapter-vite/src/index.ts` barrel exports.
5. Verify `graph:check` passes (ssg has no reverse dep on adapter-vite).

### 1.4 dsd-hydration.ts Deduplication

**Problem**: `_hydrateEvents()` (~30 lines) and `createRenderRoot()` (~10
lines) are identically duplicated in:

- `packages/adapter-lit/src/dsd-hydration.ts`
- `packages/adapter-react/src/dsd-hydration.ts`
- `packages/adapter-vanilla/src/dsd-hydration.ts`

**Approach**: Extract shared logic into `packages/core/src/dsd-hydration.ts`
as exportable helper functions. Each adapter's mixin imports these helpers
and adds its own framework-specific behavior (Lit's `super.connectedCallback()`,
React's `_mountReact()`, Vanilla's `renderToDom` fallback).

## 2. UI / Router Decoupling

**Problem**: `packages/ui` depends on `@openelement/router` and
`@openelement/router/client-router` solely for `open-layout.tsx`'s locale
routing and SPA navigation. This violates the v0.37.4 goal of a "pure CSS UI
layer" and adds a heavyweight dependency to what should be a standalone
component package.

**Approach**: Inline 4 pure utility functions (~60 lines) and the SPA
navigation lifecycle directly in `open-layout.tsx`:

| Current Router API                 | Replacement                                            |
| ---------------------------------- | ------------------------------------------------------ |
| `new Router(this)`                 | Remove; no external constructor needed                 |
| `.path`                            | `parsePathWithoutLocale(location.pathname, locales)`   |
| `.locale` / `.locales`             | Read from element prop, parse from pathname            |
| `.localize(path)`                  | `/${locale}${path}` helper                             |
| `.switchPath()` / `.switchLabel()` | Inline ~10-line implementation                         |
| `.start()` / `.stop()`             | Inline in `connectedCallback` / `disconnectedCallback` |
| `.updateSwitch()`                  | Inline DOM query + update                              |

Remove 2 import-map entries from `packages/ui/deno.json`.
Estimated net code change: +120 / -5 lines in `open-layout.tsx`.

## 3. Pure CSS UI Foundation (Core Deliverable)

### Why

openElement's fundamental characteristic is **Declarative Shadow DOM**. A CSS
layer that can't penetrate shadow boundaries is useless for DSD components.
daisyUI's class semantics (`btn`, `card`, `badge`, `alert`, etc.) are exactly
the right API, but daisyUI is wired to Tailwind — which couples to the global
document and doesn't understand shadow roots. Open Props provides
standards-based CSS custom properties that work across shadow boundaries via
`adoptedStyleSheets` and `@property` / `:host` inheritance.

The goal: **fork daisyUI's compiled CSS class definitions, replace the Tailwind
token engine with Open Props, and produce a single CSS layer that works
identically in three contexts — shadow DOM (DSD components), light DOM, and
plain HTML.**

### Architecture

```text
Open Props tokens (CSS custom properties)
  └── consumed by adoptedStyleSheets (shadow DOM)
  └── consumed by <link> / @import (light DOM / plain HTML)

daisyUI compiled CSS (forked class definitions)
  └── references Open Props tokens via var(--color-primary), etc.
  └── zero Tailwind plugin / @apply / theme() — pure CSS
  └── zero runtime JS
```

### Scope

1. **License audit**: daisyUI is MIT. We fork only the compiled CSS class
   definitions, not the Tailwind plugin source. Document the audit.

2. **Token engine: Open Props** — replace `tailwind.config.js` / `@theme` with
   `@openelement/ui/open-props-tokens`. The token sheet is already a
   `CSSStyleSheet` via `replaceSync()`, which means it can be directly
   `adoptedStyleSheets = [openPropsTokenSheet]` inside any `DsdElement`
   shadow root. Define ~30–40 tokens covering:
   - colors (primary, secondary, accent, neutral, surface, border, text)
   - spacing (scale from 4px to 64px)
   - typography (font-family, sizes, line-height, font-weight)
   - radii, shadows, transitions

3. **Fork daisyUI class set**: Extract the compiled CSS for ~15–20 utility
   classes that cover the most common UI patterns — `btn`, `btn-primary`,
   `btn-ghost`, `card`, `card-body`, `badge`, `alert`, `input`, `textarea`,
   `select`, `divider`, `tooltip`, `modal`, `menu`, `dropdown`, `tabs`.
   Rewrite all `theme()` / `rgb()` / Tailwind-specific var references to use
   Open Props custom properties (`var(--color-primary)` etc.).

4. **DSD compatibility**: Every class definition must work inside a shadow root.
   This means:
   - Use `:host` for component-level overrides, not `:root`.
   - No reliance on global `document.fonts`, `document.styleSheets`, or
     Tailwind's `@layer` cascade.
   - Prefer `@property` declarations so custom properties inherit through
     shadow boundaries.
   - Test that `adoptedStyleSheets = [tokenSheet, daisySheet]` on a
     `DsdElement` produces correct visual output server-side (DSD SSR) and
     client-side.

5. **Three-surface smoke**:
   - Static HTML: `<link rel="stylesheet">` + tokens + daisy classes → visual
     regression snapshot.
   - DsdElement light DOM: `renderMode = 'light'`, token sheet via
     `adoptedStyleSheets`.
   - DsdElement shadow DOM: `renderMode = 'shadow'` (default), both token
     sheet and daisy sheet via `adoptedStyleSheets`.

6. **Keep existing `open-*` DSD components unchanged.** The CSS layer is
   additive — existing components can adopt the new token sheet with zero code
   changes.

### Non-Goals

- No Tailwind runtime dependency. The fork is pure CSS.
- No component behavior in the CSS layer. Behavior stays in DSD elements.
- No full daisyUI 1:1 port. Only the most-used ~15–20 class sets.

## 4. Test Supplementation

| Package   | Source Lines | Test Lines | Current % | Target % | Key Areas                                                   |
| --------- | ------------ | ---------- | --------- | -------- | ----------------------------------------------------------- |
| ssg       | 4,754        | 785        | 16.5%     | ≥40%     | EntryDescriptor, SSR admission, error paths, dynamic routes |
| router    | 468          | 20         | 4.3%      | ≥60%     | Error routes, edge cases, client-router, locale switching   |
| protocols | 203          | 13         | 6.4%      | ≥60%     | Validator boundary conditions, type-level conformance       |

**Pattern**: Each test file follows existing project conventions (Deno.test,
assertExists, assertThrows). Tests are self-contained, no external fixtures
beyond temp directories.
