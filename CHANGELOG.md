## v0.24.1 — JSX+Signal Component Model + Remove Old Component Model (2026-05-28)

> **ADR**: ADR-0057 | **Previous**: v0.23.0

### ADR-0057: JSX+Signal Component Model

- **jsx-runtime** (`packages/core/src/jsx-runtime.ts`): Implements `jsx()`, `jsxs()`, `jsxDEV()`, `Fragment` — React-compatible JSX transform interface
- **VNode** (`packages/core/src/vnode.ts`): 5-field frozen interface (tag/props/children/key/ref), zero DOM dependency, no VDOM diff
- **renderToString** (`packages/core/src/jsx-render-string.ts`): VNode → HTML string for SSR, skips `on*` event props, supports className/htmlFor/style objects
- **renderToDOM** (`packages/core/src/jsx-render-dom.ts`): VNode → real DOM nodes for CSR, event binding via `addEventListener` with AbortSignal lifecycle, SVG namespace support (`createElementNS`)
- **static props runtime** (`packages/core/src/prop.ts`): Replaces `@prop()` decorator with ES2022 `static` class fields
- **Signal auto-unwrap**: `valueOf()` + `Symbol.toPrimitive` on PropSignal for implicit JSX `{}` unwrapping; `unwrap()` utility; `renderToString` / `renderToDOM` auto-unwrap Signal values
- **Type inference** (`packages/core/src/prop-types.ts`): `PropDecl`, `PropType<D>`, `PropsFrom<P>` — TypeScript type deduction from `static props` declarations
- **DSD pipeline integration** (`packages/core/src/render-dsd.ts`): VNode consumption path alongside existing TemplateResult path
- **DsdElement** (`packages/core/src/dsd-element.ts`): `render()` return type `string | TemplateResult | VNode`; VNode path uses `renderToDOM` for event binding + `effect()` for signal-driven re-render
- **ErrorBoundary** (`packages/core/src/error-boundary.ts`): `render()` return type expanded to include VNode
- **JSX IntrinsicElements**: Global type declaration for TypeScript JSX type-checking

### Breaking Changes

- **Removed `html` tagged template API**: `html`, `classMap`, `when`, `choose`, `repeat`, `ref`, `unsafeHTML` exports removed from `@lessjs/core`
- **Removed `@prop()` decorator**: Use `static props = { name: Type }` instead
- **Removed TemplateResult types**: `TemplateResult`, `isTemplateResult`, `TemplateValue`, `AttrValue`, `ContentValue`, `EventValue`, `ClassMapValue`, `UnsafeHtmlValue`, `RefDirective`, `ChooseCase`, `ClassMapInput` removed from public API
- **Removed `PropertyOptions` and `renderTemplateToString`**: Internal only; no longer exported
- **File extensions**: All UI and island components changed from `.ts` to `.tsx`
- **`@lessjs/signals` new dependency of `@lessjs/core`**: Core now imports `effect()` for VNode signal tracking; publish order: signals(5) → core(6)

### Migration: `packages/ui/`

All 10 UI components migrated from `html` tagged templates to JSX:

- `less-button`, `less-card`, `less-callout`, `less-code-block`, `less-dialog`, `less-hero-ping`, `less-input`, `less-layout`, `less-step-card`, `less-theme-toggle`
- Legacy template helpers replaced with JSX equivalents (`onClick`/`disabled`/`ariaInvalid`/inline SVG)

### Migration: `www/app/islands/`

6 island components migrated to JSX:

- `counter-island`, `less-search`, `less-term`, `less-toc`, `reactive-showcase`, `shoelace-showcase`
- `api-consumer` left unchanged (uses Lit's `html`)

### Bug Fixes

- **Island JSX `[object Object]` rendering**: `build-client.ts` and `build-ssg.ts` internal `viteBuild()` calls used `configFile: false`, ignoring the user's `vite.config.ts` esbuild JSX config. Fixed by adding explicit `esbuild: { jsx: 'automatic', jsxImportSource: '@lessjs/core' }` to both internal build configs.
- **SVG icons disappearing**: `renderToDOM` used `document.createElement()` for SVG elements. Fixed by detecting SVG tags and using `document.createElementNS('http://www.w3.org/2000/svg', tag)`.
- **VNode signal subscription**: `_renderIntoShadowRoot` VNode branch rendered DOM but never subscribed to signals. Fixed by wrapping `render()` in an `effect()` that auto-tracks signal accesses and re-renders DOM on changes.
- **SSG package resolver**: Added `jsx-runtime` and `jsx-dev-runtime` subpath exports for core package.

### Configuration

- Root `deno.json`: Added `jsx: "react-jsx"` and `jsxImportSource: "@lessjs/core"` compiler options
- Root `deno.json`: Added `@lessjs/core/jsx-runtime` and `@lessjs/core/jsx-dev-runtime` import map entries
- `packages/core/deno.json`: Added `./jsx-runtime` and `./jsx-dev-runtime` subpath exports; `@lessjs/signals` dependency
- `.github/workflows/publish-jsr.yml`: signals moved before core in publish order
- All packages bumped to `0.24.1`; cross-package dependencies `^0.24.1`

## v0.23.0 — Layered Package Architecture (2026-05-26)

### Core Changes

- **@lessjs/runtime** — New authoring facade package providing a single import surface:
  `DsdElement, html, signal, StyleSheet`. Components and apps author against this
  one package instead of importing from multiple sub-packages.
- **@lessjs/cem** — CEM (Custom Elements Manifest) parser implementation and types
  migrated from core. Zero-dependency standalone package; canonical owner of all
  CEM-related types and parsing logic.
- **@lessjs/compat-check** — Compatibility classification, manifest validation,
  and `less-add` tooling migrated from core. Standalone package for build-time
  compatibility checks.
- **@lessjs/core** — Refined to a pure runtime kernel: `DsdElement`, `html`,
  `renderDSD`, islands, navigation, logger, and errors only. Zero alien-signals
  dependency.

### Breaking Changes

1. `signal` / `computed` / `effect`: migrated from `@lessjs/core` to
   `@lessjs/signals` (or import via `@lessjs/runtime`)
2. `StyleSheet`: migrated from `@lessjs/core` to `@lessjs/style-sheet`
   (or import via `@lessjs/runtime`)
3. Removed core exports: `./signals`, `./style-sheet`, `./cem-parser`,
   `./compatibility`, `./validate-manifest`, `./less-add`
4. `@lessjs/adapter-vite`: removed `./build-context` export
5. `@lessjs/create` templates now use `@lessjs/runtime` instead of multiple
   sub-package imports

### New Packages

- `@lessjs/runtime`: Unified component authoring entry point
- `@lessjs/cem`: Canonical owner of CEM types and parsing
- `@lessjs/compat-check`: Compatibility classification + manifest validation + less-add

### CI / Tooling

- Package graph checker (`graph:check`) integrated into CI pipeline
- Import map checker (`graph:check-imports`) integrated into CI pipeline
- Local consumer build smoke test (`consumer:local`) added
- `@lessjs/adapter-vite` focused test suites: head-injection (38 tests),
  subpath-resolver (23 tests), less-plugin (44 tests)

### Architecture Principles

- No backward compatibility; no bridge layers
- Core is pure runtime kernel with zero alien-signals dependency
- 18 packages, zero circular dependencies
- 906 tests passing

### SOP

- SOP-001: Contracts & Protocols
- SOP-002: Core Kernel Boundary
- SOP-003: Runtime & App Facades
- SOP-004: adapter-vite Build Modularity
- SOP-005: Package Graph & Consumer Gates
- SOP-006: Docs Governance

### Migration Guide

```diff
- import { DsdElement, html, signal, StyleSheet } from '@lessjs/core';
+ import { DsdElement, html, signal, StyleSheet } from '@lessjs/runtime';
```

## 0.21.16 (2026-05-25)

### Fixed

- Production builds now use a no-op outer Vite trigger entry instead of
  bundling the generated Hono SSR entry as a browser/client artifact.
- JSR remote core subpath resolution now fetches `@lessjs/core` source URLs
  instead of accidentally deriving paths from `@lessjs/adapter-vite`.

### CI / Documentation

- SOP Gate now stays source-backed and no longer runs the JSR latest consumer
  matrix as a required branch gate.
- Post-publish Ubuntu consumer smoke remains the authoritative release gate for
  freshly published immutable JSR packages.
- Added a scheduled/manual Windows JSR latest monitor for platform
  compatibility without blocking source branch gates.
- Added ADR-0048 and SOP-018 to document the CI/release gate split.

## 0.21.15 (2026-05-25)

### Fixed

- Content navigation now defaults `routesDir` to `app/routes` when `content.nav`
  is enabled without an explicit route directory.
- The create template now writes `content.nav.routesDir`, matching the runtime
  default and preventing post-publish consumer smoke builds from failing in
  `@lessjs/content`.

## 0.21.14 (2026-05-25)

### Fixed

- Client island builds in JSR consumers now reuse the LessJS package resolver,
  so package islands such as `@lessjs/ui/less-card` resolve from JSR in Phase 2.

## 0.21.13 (2026-05-25)

### Architecture: Clean Architecture — Import Map Universal Resolution (ADR-0042~0045)

- **SSG Phase 3 refactor**: Split SSR dependency strategy into external + noExternal two tiers.
  - `noExternal`: @lessjs/* + Lit ecosystem (bundled by Rolldown)
  - `external`: parse5, entities, hono, node-fetch, etc. (resolved by Deno ESM Runtime via import map)
- **SSR polyfill unification**: New `ssr-polyfills.ts` module — CSSStyleSheet → HTMLElement → customElements
- **Import map hardening**: Added `entities/` subpath mapping for Deno native npm resolution
- **Consumer template**: genenated deno.json now includes SSR transitive deps (hono, parse5, entities)
- **ADR**: 0042 (Import Map Universal Resolution), 0043 (SSG Phase3 dependency strategy), 0044 (SSR polyfill), 0045 (Native API first-class)

- **Phase 2 import map resolution**: Client island build now uses deno.json import map
  for module resolution, unified with Phase 1 and Phase 3. (ADR-0046)
- **Phase 1 virtual module fix**: Consumer template now includes a `virtual-passthrough`
  resolve plugin (`enforce: 'pre'`) to intercept `virtual:*` module IDs before
  `@deno/vite-plugin`, avoiding unsupported scheme errors. (SOP-015)

### Fixed

- `entities/lib/escape.js` subpath resolution failure in Rolldown SSR bundle
- `customElements is not defined` ReferenceError in SSR environment
- `deno fmt` check failure in ssg-package-resolver.ts

### Changed

- `defaultNoExternal` in build-ssg.ts now only covers @lessjs/* + Lit ecosystem
- SSG entry code uses shared polyfill module instead of inline + output.banner
- importmap.json sidecar now only records external dependencies
