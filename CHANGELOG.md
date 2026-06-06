## v0.34.0 - AutoFlow2 Sidecar Kernel (2026-06-06)

### AutoFlow2 Sidecar

- Added `tools/autoflow/` — an internal read-only workflow kernel.
- State machine with 5 workflow states: `planned`, `next`, `active`,
  `implemented`, `released`, plus `drifted` and `invalid`.
- 6 readers parse `STATUS.md`, SOP, NextVersion, ROADMAP, package graph, and ADRs
  into structured evidence.
- Reporter outputs JSON (`--json`) or Markdown summary for PR evidence.
- 9 evidence cells report on ADR, SOP, NextVersion, package graph, status,
  roadmap, workflow, docs, and release status.

### CLI

- `deno task autoflow:report` — runs the sidecar against the current repository.
- Advisory only: does not block CI, does not edit code, does not access network.
- Zero dependency on `packages/` — pure Deno stdlib with `--allow-read` only.

### Testing

- 35 unit + integration tests covering state machine, all 5 readers, reporter,
  and 5 fixture repositories (released, active, planned, drifted, invalid).

### Workflow and Docs

- Added `docs/next/v0.34.0/` execution package.
- Updated STATUS, SOP, Roadmap for v0.34.0.
- Bumped all 19 packages and internal JSR ranges to `0.34.0`.
- Updated `workflow:check` active version to v0.34.0.

---
## v0.33.0 - AI-Readable API Foundation (2026-06-06)

### Page API: Strict Canonical Descriptor

- `definePage()` now requires object-form only. Function-form `definePage(() => ...)`
  is rejected at runtime.
- Added structured `head` intent with `title`, `description`, `meta`, and
  `dangerouslyHeadFragments` trust boundary.
- Added `route` intent (`PageRouteIntent`): path, id, params metadata.
- Added `renderIntent` as the only public render intent field (`mode`,
  `streaming`, `revalidate`).
- Removed top-level page `title`, `description`, `meta`, `rendering`,
  `streaming`, and `revalidate` shortcuts.

### Head Trust Boundary

- Raw head fragments now enter only through `head.dangerouslyHeadFragments`.
- Ordinary `head` data is structured and serialized by the framework.
- Tests verify raw fragments cannot leak through safe structured head paths.

### Island API

- Added `defineIslandConfig()` — the only island metadata helper.
- Object-literal island metadata (`export const openElement = { ... }`) is
  rejected by the adapter scanner.
- App-level island options expose `ssr?: boolean` for readable SSR/client-only
  intent.

### Generated Entry and Templates

- Generated SSR/SSG entries read `head`, `route`, and `renderIntent` from the
  new canonical page descriptor.
- Adapter island scanning accepts only `defineIslandConfig(...)`.
- Create templates use object-form `definePage({ ... })` and
  `defineIslandConfig()`.

### Breaking Changes

```diff
- export default definePage(() => <Page />);
+ export default definePage({ render: () => <Page /> });

- definePage({ title: '...', description: '...', meta: {...} });
+ definePage({ head: { title: '...', description: '...' } });

- export const openElement = { ssr: true, hydrate: 'visible' };
+ export const openElement = defineIslandConfig({ ssr: true, hydrate: 'visible' });
```

### Workflow and Docs

- Added ADR-0086: AI-Readable Architecture and AutoFlow2 Roadmap.
- Added `docs/next/v0.33.0/` execution package.
- Updated STATUS, Roadmap, Architecture, SOPs, www homepage, and Getting Started
  for v0.33.0.
- Bumped all 19 packages and internal JSR ranges to `0.33.0`.

---
## v0.32.0 - App Lifecycle Contract (2026-06-05)

### Application Lifecycle

- Added `redirect()` and `notFound()` lifecycle helpers to `@openelement/app`.
- Added typed `OpenElementRedirect` and `OpenElementNotFound` controls plus type
  guards.
- Extended `definePage()` render context with `route` and `meta`.
- Added `definePage({ error })` fallback rendering through the existing VNode
  contract.
- Wired generated Hono and SSG entries to handle redirect/not-found controls.
- Exposed route file path, revalidate, rendering intent, and streaming intent in
  SSG `routeInfo`.

### Workflow and Docs

- Added mandatory AutoWorkflow governance in `docs/governance/PROJECT_WORKFLOW.md`.
- Added `docs/next/v0.32.0/` execution package and ADR-0085.
- Added GitHub issue templates, PR template, refreshed agent prompts, and
  `deno task workflow:check`.
- Updated Status, Roadmap, Architecture, SOP, www homepage, API reference, and
  Getting Started docs for v0.32.0.
- Bumped all 19 packages and internal JSR ranges to `0.32.0`.
---

## v0.31.0 - JSX-first Application API (2026-06-05)

### Application API

- Added `definePage()`, `defineIsland()`, `defineElement()`, and
  `defineLayout()` from `@openelement/app`.
- Moved the Vite configuration facade to `@openelement/app/vite`.
- Wired `definePage({ load, title, description, layout, revalidate })` into SSR
  and SSG generated entries.
- Updated the create template, README files, package docs, www guide pages,
  roadmap, SOPs, status, and ADRs for the new Application API.

### Breaking

```diff
- import { openElement } from '@openelement/app';
+ import { openElement } from '@openelement/app/vite';
```

---

## v0.30.1 - Clean Architecture Sweep (2026-06-04)

### Public Contract

- Renamed the current app facade to `openElement()`.
- Aligned active package metadata, protocol validators, route metadata, Vite
  plugin names, virtual module ids, UI subpaths, and component tags with the
  openElement vocabulary.
- Removed active LessJS compatibility names from the current source and current
  docs. Historical archives remain historical.

### Renderer and Islands

- Kept dynamic island UI on the VNode renderer path.
- Removed framework-authored `data-on-*` event binding and active
  `data-signal-html` dynamic UI.
- Preserved `trustedHtml` only for audited non-interactive content boundaries.

### Docs and Release

- Updated current architecture, SOP, ADR, status, package docs, and www content
  for v0.30.1.
- Bumped all 19 packages and internal `jsr:@openelement/*` ranges to `0.30.1`.

---

## v0.26.0 — Framework Decoupling + SSG Robustness (2026-05-29)

> **Previous**: v0.25.0 | **SOPs**: 5 | **ADR**: ADR-0061

### Virtual Modules Removed from Route Files

60 route files no longer import from `virtual:open-nav` or `virtual:open-blog-data`.
Data now flows through `@openelement/content/nav`, `@openelement/content/blog-data`, and
`@openelement/i18n/data` — framework-owned ESM exports, not Vite virtual modules.

```diff
- import { headerNav, navSections } from 'virtual:open-nav';
+ import { headerNav, navSections } from '@openelement/content/nav';
```

- `@openelement/content` now exports `./nav-data`, `./blog-data` writer utilities
- `@openelement/i18n` now exports `./data` writer
- `buildStart()` hooks write `_generated-nav.ts`, `_generated-blog-data.ts`, `_generated-i18n-data.ts`
- SSG bundle keeps virtual modules internally; route files use new paths

### Island Transform Extraction

- `@openelement/core/island-transform`: `transformIslandSource()` pure function, zero Vite
- `@openelement/adapter-vite` island-transform: 69 → 36 lines (−48%)
- 18 tests pass (6 core + 12 adapter)

### Dev Server Zero Bundler

```bash
deno task dev:fast  # ~100ms cold start
```

- `www/app/dev-server.ts`: Deno.serve + Hono, no Vite dependency
- `www/app/middleware/dev-static.ts`: static asset serving
- Vite HMR dev server (`deno task dev`) preserved as optional enhancement

### SSG Robustness Fixes

- **adapter stubs**: `DsdReactElement`/`DsdLitElement`/`DsdVanillaElement` stubs changed
  from `undefined` to real class stubs — prevents `(void 0) is not a function` in SSR
- **react-showcase island**: `typeof WithDsdHydration === 'function'` guard for
  externalized adapter imports
- **adapter-react stub**: `WithDsdHydration` added to SSG stub

### Verification

```
fmt       ✅ 666 files
lint      ✅ 269 files
typecheck ✅
graph     ✅ 18 packages, 0 cycles
test      ✅ 943 passed
build:docs ✅ 0 FAILED, sitemap 478 URLs
```

---

## v0.25.0 — Declarative DX (2026-05-29)

> **Previous**: v0.24.4 | **SOPs**: 14 | **ADR**: ADR-0058/0059/0060

### Breaking: createOpenPlugin() Removed

`createOpenPlugin()` fully removed from `@openelement/adapter-vite`. `openPipeline()` is the
only public build entry. Zero backward compatibility.

```diff
- import { createOpenPlugin } from '@openelement/adapter-vite/plugin';
+ import { openPipeline } from '@openelement/adapter-vite';
```

### 14 SOPs Delivered

| SOP | Feature                                             |
| --- | --------------------------------------------------- |
| 001 | `openPipeline()` declarative entry                  |
| 002 | `.less/routes.d.ts` type generation                 |
| 003 | `static head` metadata                              |
| 004 | `static client` declaration                         |
| 005 | SignalContext (DOM-tree context)                    |
| 006 | CSS token convergence (20→2 imports)                |
| 007 | Scanner AST hardening                               |
| 008 | `as any` hardening (21→0 in core/src)               |
| 009 | test-utils.ts infrastructure                        |
| 010 | `createOpenPlugin()` full removal (not @deprecated) |
| 011 | island.test.ts old name cleanup                     |
| 012 | `_dsdHydrated` removal, unified render              |
| 013 | 14 pages string→JSX                                 |
| 014 | Full regression (943 tests)                         |

### Critical Fixes

- **SSG DSD regression**: `import()` tagName detection silently failed for
  all 55 routes → SSG produced empty DSD. Fixed with regex source scan.
- **customElements guard**: 4 island components now idempotent in SSR.

### Verification

```
✅ fmt (689), lint (331), typecheck, graph (18/0)
✅ test: 943 passed, 0 failed
✅ SSG smoke: 4/4 steps, DSD preserved
```

---

## v0.24.4 — API Cleanup Line Endpoint (2026-05-29)

> **Previous**: v0.24.3 | **SOP**: 14 SOPs (v0.25.0 prep)

### API Naming Convention

- **verbNoun**: `island()` → `defineIsland()`, `lessBind()` → `bindSsrProps()`
- **PascalCase acronyms**: `renderDSD()` → `renderDsd()`, `renderToDOM()` → `renderToDom()`, `getSSRProps()` → `getSsrProps()`
- **No backward compatibility** — old names removed entirely

### createOpenPlugin() Public API Removal

- `createOpenPlugin()` removed from `@openelement/adapter-vite` public exports
- `openPipeline()` is the sole build pipeline entry
- `lessCompat` removed, `@deprecated` aliases removed
- `plugin.ts` marked `@internal`

### SSG Robustness

- **tagName detection**: Reverted from `import()` to regex source scan — `import()` failed for routes with Vite virtual module dependencies
- **SSG smoke test**: Always rebuild (no stale cache skip)
- **DSD output**: Restored from 3→5 DSD markers in generated pages
- **customElements guard**: Added `get()` guard to 4 island components preventing SSR duplicate registration

### TypeScript & Lint

- **`_dsdHydrated` removal**: Unified `_renderOrHydrate()` path, removed from tests
- **JSX lint compliance**: `jsx-no-comment-text-nodes`, `jsx-key` fixes
- **Unused lint directives**: Cleaned up `ban-unused-ignore` in prop.ts
- **`Function` type**: Added `ban-types` suppress for VNode internal

### Verification

```
✅ fmt — 689 files
✅ lint — 331 files
✅ typecheck
✅ graph:check — 18 packages, 0 cycles
✅ test — 943 passed, 0 failed
✅ SSG smoke — 4/4 steps, DSD preserved
```

---

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

- **Removed `html` tagged template API**: `html`, `classMap`, `when`, `choose`, `repeat`, `ref`, `unsafeHTML` exports removed from `@openelement/core`
- **Removed `@prop()` decorator**: Use `static props = { name: Type }` instead
- **Removed TemplateResult types**: `TemplateResult`, `isTemplateResult`, `TemplateValue`, `AttrValue`, `ContentValue`, `EventValue`, `ClassMapValue`, `UnsafeHtmlValue`, `RefDirective`, `ChooseCase`, `ClassMapInput` removed from public API
- **Removed `PropertyOptions` and `renderTemplateToString`**: Internal only; no longer exported
- **File extensions**: All UI and island components changed from `.ts` to `.tsx`
- **`@openelement/signals` new dependency of `@openelement/core`**: Core now imports `effect()` for VNode signal tracking; publish order: signals(5) → core(6)

### Migration: `packages/ui/`

All 10 UI components migrated from `html` tagged templates to JSX:

- `open-button`, `open-card`, `open-callout`, `open-code-block`, `open-dialog`, `open-hero-ping`, `open-input`, `open-layout`, `open-step-card`, `open-theme-toggle`
- Legacy template helpers replaced with JSX equivalents (`onClick`/`disabled`/`ariaInvalid`/inline SVG)

### Migration: `www/app/islands/`

6 island components migrated to JSX:

- `counter-island`, `open-search`, `less-term`, `less-toc`, `reactive-showcase`, `shoelace-showcase`
- `api-consumer` left unchanged (uses Lit's `html`)

### Bug Fixes

- **Island JSX `[object Object]` rendering**: `build-client.ts` and `build-ssg.ts` internal `viteBuild()` calls used `configFile: false`, ignoring the user's `vite.config.ts` esbuild JSX config. Fixed by adding explicit `esbuild: { jsx: 'automatic', jsxImportSource: '@openelement/core' }` to both internal build configs.
- **SVG icons disappearing**: `renderToDOM` used `document.createElement()` for SVG elements. Fixed by detecting SVG tags and using `document.createElementNS('http://www.w3.org/2000/svg', tag)`.
- **VNode signal subscription**: `_renderIntoShadowRoot` VNode branch rendered DOM but never subscribed to signals. Fixed by wrapping `render()` in an `effect()` that auto-tracks signal accesses and re-renders DOM on changes.
- **SSG package resolver**: Added `jsx-runtime` and `jsx-dev-runtime` subpath exports for core package.

### Configuration

- Root `deno.json`: Added `jsx: "react-jsx"` and `jsxImportSource: "@openelement/core"` compiler options
- Root `deno.json`: Added `@openelement/core/jsx-runtime` and `@openelement/core/jsx-dev-runtime` import map entries
- `packages/core/deno.json`: Added `./jsx-runtime` and `./jsx-dev-runtime` subpath exports; `@openelement/signals` dependency
- `.github/workflows/publish-jsr.yml`: signals moved before core in publish order
- All packages bumped to `0.24.1`; cross-package dependencies `^0.24.1`

## v0.24.3 — Shared Type Deduplication & Nav Alias Cleanup (2026-05-29)

> **SOP**: SOP-002 | **Previous**: v0.24.1

### TG-09: Shared Type Deduplication

12 types/utilities were duplicated across 2–3 packages. Every copy is now canonical at `@openelement/core`.

| Type                                                                                                                           | Previously duplicated in                                                       | Now                            |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------ |
| `SignalLike`, `isSignalLike`                                                                                                   | `core/template.ts` + `core/signal-like.ts`                                     | Canonical in `signal-like.ts`  |
| `ManifestDecision`, `SsrAdmissionDecision`                                                                                     | `core/types.ts` + `compat-check/types.ts` + `adapter-vite/entry-descriptor.ts` | Canonical in `core/types.ts`   |
| `ValidationResult`, `ValidationError`, `ValidationWarning`, `ValidationDiagnostic`, `ValidatedTag`, `ManifestValidationReport` | `core/types.ts` + `compat-check/types.ts`                                      | Canonical in `core/types.ts`   |
| `ComponentLayer`, `HydrationStrategy`                                                                                          | `core/types.ts` + `cem/types.ts` + `compat-check/types.ts`                     | Canonical in `core/types.ts`   |
| `StrategySource`                                                                                                               | `core/types.ts` + `compat-check/types.ts` + `adapter-vite/entry-generators.ts` | Canonical in `core/types.ts`   |
| `CompatibilityTier`                                                                                                            | `core/types.ts` + `cem/cem-parser.ts` (local)                                  | Canonical in `core/types.ts`   |
| `isValidTagName`                                                                                                               | `cem/cem-parser.ts` + `compat-check/compatibility.ts` (different impls)        | Unified in `core/tag-utils.ts` |

### Nav Alias Cleanup

- Replaced 50+ usages of deprecated aliases across 34 route files:
  - `filterFrameworkNav` → `filterDocsNav` (22 files in `guide/` + `zh/guide/`)
  - `filterEngineNav` → `filterArchitectureNav` (9 files in `engine/`)
  - `filterRegistryNav` → `filterHubNav` (3 files in `registry/`)
- Removed legacy aliases from `www/app/utils/nav-filter.ts`

### CLI Organization (SOP-003)

- **Rename**: `hub/src/cli/install-plan.ts` → `hub/src/cli/install-guide.ts` — eliminates naming collision with `compat-check/src/cli/install-plan.ts`
- **Data relocation**: `_hub-data-full.ts` (3867L) moved from `routes/registry/` to `app/data/registry/hub-data.ts`
- **Changelog**: `changelog.ts` (was 1956L inline HTML) now reads `CHANGELOG.md` at build time. Single source of truth; self-contained renderer, zero external deps.

### Dependencies Changed

- `@openelement/cem` now has 1 internal dependency (`@openelement/core`, was 0): eliminates `ComponentLayer`/`HydrationStrategy`/`CompatibilityTier`/`isValidTagName` duplication

### Files Changed

- `packages/core/src/signal-like.ts` — `SignalLike.value` changed to `readonly` for consistency
- `packages/core/src/template.ts` — removed local `SignalLike`/`isSignalLike`, import from `signal-like.js`
- `packages/core/src/dsd-element.ts` — `isSignalLike` import moved to `signal-like.js`
- `packages/core/src/index.ts` — added `StrategySource`, `isValidTagName` exports
- `packages/core/src/tag-utils.ts` — new file: canonical `isValidTagName()` with reserved-name check
- `packages/compat-check/src/types.ts` — 12 local types replaced with `export type { ... } from '@openelement/core'`
- `packages/compat-check/src/compatibility.ts` — `isValidTagName` imported from `@openelement/core`
- `packages/cem/deno.json` — added `@openelement/core` dependency
- `packages/cem/src/types.ts` — `ComponentLayer`/`HydrationStrategy` imported from `@openelement/core`
- `packages/cem/src/cem-parser.ts` — `isValidTagName`/`CompatibilityTier` imported from `@openelement/core`
- `packages/adapter-vite/src/entry-descriptor.ts` — `SsrAdmissionDecision` imported from `@openelement/core`
- `packages/adapter-vite/src/entry-generators.ts` — `StrategySource` imported from `@openelement/core`
- `www/app/utils/nav-filter.ts` — removed 3 deprecated aliases
- 34 route files in `www/app/routes/` — alias renames

### Gates

| Gate               | Result                                 |
| ------------------ | -------------------------------------- |
| `typecheck`        | ✅ PASS                                |
| `test`             | ✅ 972/977 (5 localStorage, unchanged) |
| `lint`             | ✅ PASS                                |
| `fmt:check`        | ✅ PASS                                |
| `graph:check`      | ✅ PASS, zero cycles, 18 packages      |
| `dsd:check-report` | ✅ PASS, 0 unknown errors              |

## v0.23.0 — Layered Package Architecture (2026-05-26)

### Core Changes

- **@openelement/runtime** — New authoring facade package providing a single import surface:
  `DsdElement, html, signal, StyleSheet`. Components and apps author against this
  one package instead of importing from multiple sub-packages.
- **@openelement/cem** — CEM (Custom Elements Manifest) parser implementation and types
  migrated from core. Zero-dependency standalone package; canonical owner of all
  CEM-related types and parsing logic.
- **@openelement/compat-check** — Compatibility classification, manifest validation,
  and `install-plan` tooling migrated from core. Standalone package for build-time
  compatibility checks.
- **@openelement/core** — Refined to a pure runtime kernel: `DsdElement`, `html`,
  `renderDSD`, islands, navigation, logger, and errors only. Zero alien-signals
  dependency.

### Breaking Changes

1. `signal` / `computed` / `effect`: migrated from `@openelement/core` to
   `@openelement/signals` (or import via `@openelement/runtime`)
2. `StyleSheet`: migrated from `@openelement/core` to `@openelement/style-sheet`
   (or import via `@openelement/runtime`)
3. Removed core exports: `./signals`, `./style-sheet`, `./cem-parser`,
   `./compatibility`, `./validate-manifest`, `./install-plan`
4. `@openelement/adapter-vite`: removed `./build-context` export
5. `@openelement/create` templates now use `@openelement/runtime` instead of multiple
   sub-package imports

### New Packages

- `@openelement/runtime`: Unified component authoring entry point
- `@openelement/cem`: Canonical owner of CEM types and parsing
- `@openelement/compat-check`: Compatibility classification + manifest validation + install-plan

### CI / Tooling

- Package graph checker (`graph:check`) integrated into CI pipeline
- Import map checker (`graph:check-imports`) integrated into CI pipeline
- Local consumer build smoke test (`consumer:local`) added
- `@openelement/adapter-vite` focused test suites: head-injection (38 tests),
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
- import { DsdElement, html, signal, StyleSheet } from '@openelement/core';
+ import { DsdElement, html, signal, StyleSheet } from '@openelement/runtime';
```

## 0.21.16 (2026-05-25)

### Fixed

- Production builds now use a no-op outer Vite trigger entry instead of
  bundling the generated Hono SSR entry as a browser/client artifact.
- JSR remote core subpath resolution now fetches `@openelement/core` source URLs
  instead of accidentally deriving paths from `@openelement/adapter-vite`.

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
  `@openelement/content`.

## 0.21.14 (2026-05-25)

### Fixed

- Client island builds in JSR consumers now reuse the openElement package resolver,
  so package islands such as `@openelement/ui/open-card` resolve from JSR in Phase 2.

## 0.21.13 (2026-05-25)

### Architecture: Clean Architecture — Import Map Universal Resolution (ADR-0042~0045)

- **SSG Phase 3 refactor**: Split SSR dependency strategy into external + noExternal two tiers.
  - `noExternal`: @openelement/* + Lit ecosystem (bundled by Rolldown)
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

- `defaultNoExternal` in build-ssg.ts now only covers @openelement/* + Lit ecosystem
- SSG entry code uses shared polyfill module instead of inline + output.banner
- importmap.json sidecar now only records external dependencies
