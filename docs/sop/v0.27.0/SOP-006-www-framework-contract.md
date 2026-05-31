# SOP-006: Framework-Level WWW Reliability Contract

> Version: v0.27.0
> Status: Implemented in framework contracts; route-page migration continues
> Date: 2026-05-31
> Scope: packages/* first, www as a consumer

## Goal

Fix the docs site failures as framework contract failures, not as one-off
patches in `www`.

The target contract is:

- zero manual route wiring in `www`: no route lists, header nav arrays,
  `current-path` strings, locale-prefix logic, or hand-maintained search index
  entries in page components.
- zero manual event wiring in `www`: docs components use normal JSX event props
  such as `onClick` and `onInput`; the framework owns SSR markers and client
  hydration.
- zero hardcoded layout CSS in `www`: shared docs layout primitives, content
  grids, TOC columns, theme tokens, and page containers come from framework UI
  primitives or generated theme assets.

`www` may still contain authored page content and component-specific examples.
It must not carry framework responsibilities.

## Implementation Record

This SOP is implemented for the failure classes that caused the current docs
site breakage:

- DSD/VNode event handlers now use framework-owned SSR markers and hydration.
- Theme, search, i18n URL normalization, and SPA head/layout state are covered
  by focused Playwright regressions.
- Search index and route manifest output are generated from route metadata.
- Shared docs grid styles live in `@lessjs/ui/docs-page-styles`.
- Local island metadata scanning is static and no longer imports browser-only
  custom-element modules during SSR discovery.

The remaining migration is mechanical cleanup of old route-page attributes:
many existing `www/app/routes/**` files still pass `nav-items`, `header-nav`,
or `current-path` explicitly. That cleanup is no longer required to fix the
known broken runtime behavior, but it is still required before claiming the
strict "zero manual route wiring in www" target.

## Current Failures

The current audit found these docs-site failures:

1. Theme toggle is rendered but clicking it does not change
   `document.documentElement.dataset.theme`.
2. Locale switching can change the URL without updating `html[lang]`,
   `less-layout[locale]`, title/head state, or switch-label state.
3. Direct localized pages can disagree with the nested layout locale. For
   example, `/zh/` can have `html lang="zh"` while the inner layout remains
   `locale="en"`.
4. Search opens and can return results, but the static index contains stale
   paths such as `/guide/routing`, `/guide/ssg`, `/guide/dsd`,
   `/guide/islands`, `/ui`, and `/community`.
5. Search SSR can render a signal object as `[object Object]` because
   `innerHTML={computedSignal}` is cast to string before unwrapping.
6. `guide/getting-started` uses `.content-grid` without the shared page styles,
   so the page falls back to `display: block` instead of the intended grid.
7. Local island metadata scanning silently skips browser-facing islands because
   top-level `customElements` access throws during Deno-side metadata import.
8. Existing E2E selectors assume `less-layout` is in document light DOM, while
   current pages often nest it inside a route component shadow root.

These failures are related. `www` is currently forced to duplicate route,
locale, event, search, and style responsibilities that should be owned by the
framework.

## Non-Goals

- Do not redesign the docs site.
- Do not move away from DSD, Web Components, or the current file-based route
  model.
- Do not make `www` MPA-only to avoid fixing SPA state sync.
- Do not fix by only changing `www/app/routes/index/index.tsx`,
  `www/public/search-index.json`, or one missing `pageStyles` import. Those are
  allowed as temporary smoke fixes, not as the release-quality solution.
- Do not require page authors to write `data-on-*`, `data-signal-*`,
  `current-path`, locale-switch URLs, or duplicated layout CSS by hand.

## Ownership Map

| Concern         | Owner                                      | Consumer Contract                                        |
| --------------- | ------------------------------------------ | -------------------------------------------------------- |
| route discovery | `@lessjs/adapter-vite` + `@lessjs/content` | page exports route metadata only                         |
| navigation data | `@lessjs/content`                          | `www` imports generated manifest or layout consumes it   |
| search data     | `@lessjs/content`                          | no hand-maintained `public/search-index.json`            |
| locale parsing  | `@lessjs/i18n`                             | locale is derived from configured locales only           |
| SPA navigation  | `@lessjs/router`                           | document and layout state update together                |
| layout shell    | `@lessjs/ui`                               | route pages do not pass nav/header/current-path manually |
| event hydration | `@lessjs/core`                             | JSX event handlers survive SSR without method-name hacks |
| docs page CSS   | `@lessjs/ui`                               | route pages choose a layout preset, not raw grid CSS     |
| island metadata | `@lessjs/adapter-vite`                     | metadata scan does not execute browser-only code         |

## Phase 0: Reproduce and Lock the Baseline

Run before changing code:

```bash
deno task typecheck
deno task graph:check
deno task docs:check-current
deno task build
deno task dsd:check-report
deno run -A npm:@playwright/test@1.59.1 test --config www/e2e/playwright.config.ts --workers=1
```

Record:

- whether `deno task build` logs island metadata import failures containing
  `customElements is not defined`;
- the generated `www/dist` route list;
- stale `search-index.json` paths and HTTP status for each search result path;
- theme state before and after clicking `<less-theme-toggle>`;
- `html.lang`, `document.title`, layout locale, and switch href before and
  after clicking the language switch;
- computed style for `.content-grid` on `/guide/getting-started`.

The phase is complete when each failure has a named test or scripted browser
probe that fails before implementation.

## Phase 1: Generate a Route Manifest

### Problem

Route pages currently pass data into `less-layout` manually:

- `nav-items={JSON.stringify(navSections)}`
- `header-nav={JSON.stringify(headerNav)}`
- `current-path="/guide/..."`
- `locale={this._getLocale(...)}`
- hardcoded locale defaults such as `locale='en'` on the homepage

This makes every page a potential source of routing and locale drift.

### Target API

Add a generated manifest owned by framework packages:

```ts
export interface DocsRouteManifestEntry {
  path: string;
  localizedPaths: Record<string, string>;
  filePath: string;
  tagName?: string;
  title: Record<string, string> | string;
  label: Record<string, string> | string;
  section?: string;
  order?: number;
  layout?: 'home' | 'docs' | 'docs-toc' | 'full-width';
  searchable?: boolean;
  searchText?: Record<string, string> | string;
  aliases?: string[];
}

export interface DocsRouteManifest {
  locales: string[];
  defaultLocale: string;
  routes: DocsRouteManifestEntry[];
  headerNav: Array<{ href: string; label: string; section?: string }>;
  navSections: Array<{
    section: string;
    items: Array<{ path: string; label: string; order?: number }>;
  }>;
}
```

### Implementation

1. Extend `packages/content/src/types.ts` with manifest-facing route metadata.
2. Extend `packages/content/src/nav/scanner.ts` so route metadata can declare:
   `title`, `label`, `section`, `order`, `layout`, `searchable`, `searchText`,
   and optional localized labels.
3. Add a manifest writer under `packages/content/src/manifest/writer.ts`.
4. Add a generated module in `www/app/data/_generated-route-manifest.ts`.
5. Keep `@lessjs/content/nav` compatibility exports by deriving
   `navSections` and `headerNav` from the manifest.
6. Change `www` route pages to stop importing `navSections` and `headerNav`
   directly once `less-layout` can consume the manifest.

### Acceptance

- No `www/app/routes/**/*.tsx` file constructs `nav-items`,
  `header-nav`, or `current-path` strings.
- Header nav is derived from route metadata or one central `lessjs({ content:
  { nav: ... } })` config block.
- `deno task build` writes a route manifest whose paths match actual generated
  HTML pages.

## Phase 2: Make i18n and Router State Canonical

### Problem

`packages/router/src/client-router.ts` currently parses any first segment as a
locale through `URLPattern('/:locale?/:page*')`. It must validate the first
segment against configured locales before treating it as a locale.

`packages/ui/src/less-layout.tsx` currently fetches the target document and
swaps only the current layout light DOM children. That does not synchronize
document state.

### Target API

Move path normalization into `@lessjs/i18n`:

```ts
export interface LocalePath {
  locale: string;
  path: string;
  localizedPath: string;
  isDefaultLocalePath: boolean;
}

export function normalizeLocalePath(
  pathname: string,
  options: { locales: string[]; defaultLocale: string },
): LocalePath;
```

Move SPA document swap into `@lessjs/router`:

```ts
export interface PageSnapshot {
  url: string;
  lang: string;
  title: string;
  head: {
    canonical?: string;
    description?: string;
    alternates?: Array<{ lang: string; href: string }>;
  };
  layoutAttrs: Record<string, string | boolean>;
  bodySlotHtml: string;
}
```

### Implementation

1. Update `packages/i18n/src/routes.ts` to export `normalizeLocalePath`.
2. Update `packages/router/src/client-router.ts` to use
   `normalizeLocalePath`, not raw optional `URLPattern` locale extraction.
3. Update `Router.switchPath()`, `switchLabel()`, and `localize()` to use the
   canonical locale object.
4. Change `RouterStartOptions.contentLoader` to return a `PageSnapshot` rather
   than letting `less-layout` mutate the document directly.
5. Move fetch/parse/swap responsibility from `less-layout._loadContent()` into
   a framework helper that:
   - fetches the target page;
   - parses the nested page component and nested `less-layout`;
   - updates `document.documentElement.lang`;
   - updates `document.title`;
   - updates canonical, description, and alternate links;
   - updates the active layout attributes;
   - replaces the active route slot;
   - rehydrates nested custom elements when needed.
6. Make `<less-layout>` default to generated manifest data when `nav-items`,
   `header-nav`, `current-path`, `locale`, or `locales` are omitted.
7. Keep attributes as explicit override escape hatches for non-doc consumers.

### Acceptance

- Direct `/`, `/en/`, and `/zh/` pages have matching `html[lang]`,
  layout locale, switch text, and switch href.
- SPA navigation from `/` to `/zh/` updates URL, `html[lang]`, layout locale,
  title/head, and language-switch state.
- Non-locale paths such as `/guide/getting-started` are not parsed as
  `locale="guide"`.
- Existing route pages can remove manual locale/current-path wiring without
  losing active nav or edit-link behavior.

## Phase 3: Replace Function-Name Event Hydration

### Problem

`packages/core/src/jsx-render-string.ts` serializes event handlers as:

```ts
data-on-click="${value.name || '__anonymous__'}"
```

This breaks for inline arrows and many bound functions. The theme toggle uses
normal JSX event syntax, but SSR emits a marker that does not map to the
runtime method that should be called.

### Target Contract

Page and component authors write ordinary JSX:

```tsx
<button onClick={() => this.toggleTheme()}>Toggle</button>
<input onInput={this.onSearchInput} />
```

The framework must bind those handlers after DSD hydration without requiring:

- hand-written `data-on-*`;
- method-name strings;
- reliance on `function.name`;
- route-specific post-hydration scripts.

### Framework Design

Use generated event IDs plus a VNode event table:

```html
<button data-less-e="e0">Toggle</button>
```

During SSR:

1. `renderToString()` walks the VNode tree.
2. Every event prop receives a deterministic component-local event id.
3. The SSR HTML stores only the marker, not a function name.

During DSD hydration:

1. `DsdElement` calls `render()` once to rebuild the VNode event table only.
2. It does not replace existing DOM.
3. It queries `[data-less-e]` markers in the shadow root.
4. It binds the matching event type and handler from the VNode event table.

This is marker-based hydration, not position-only DOM walking. The DOM marker
is the contract.

### Implementation

1. Add `packages/core/src/event-hydration.ts` with:
   - `EventBindingRecord`;
   - `collectEventBindings(vnode): Map<string, EventBindingRecord>`;
   - `serializeEventMarkers(props, context)`;
   - `hydrateEventMarkers(root, bindings, cleanupBag)`.
2. Update `packages/core/src/jsx-render-string.ts` to emit `data-less-e`
   markers instead of `data-on-${event}="${function.name}"`.
3. Update `packages/core/src/dsd-element.ts` so `_hydrateSignals()` delegates
   event binding to the new marker hydrator.
4. Keep `data-on-*` as a temporary backward-compatible path for existing built
   HTML, but mark it deprecated in comments and tests.
5. Add tests for:
   - inline arrow `onClick`;
   - private method wrapper `onClick={() => this.#x()}`;
   - method reference `onInput={this._onInput}`;
   - repeated events in a list;
   - cleanup on disconnect.

### Acceptance

- `<less-theme-toggle>` works without changing it to a method-name string API.
- `www` has no hand-authored `data-on-*` event markers.
- `renderToString()` no longer depends on `Function.name` for event hydration.
- Event cleanup remains covered by disconnected lifecycle tests.

## Phase 4: Unwrap Signal-Like `innerHTML`

### Problem

`innerHTML={this.#resultsHtml}` is rendered by casting the signal object to a
string, producing `[object Object]` in SSR output.

### Implementation

1. Update `packages/core/src/jsx-render-string.ts` so `innerHTML` uses the same
   signal unwrapping contract as `textContent`.
2. Keep raw HTML escaping rules explicit:
   - `textContent` is escaped;
   - `innerHTML` is not escaped because the caller is declaring raw HTML;
   - signal values feeding `innerHTML` must be stringified after unwrapping.
3. Add a unit test that renders a computed signal into `innerHTML` and asserts
   no `[object Object]` appears.
4. Add a DSD report assertion that search result containers do not contain raw
   signal object text.

### Acceptance

- Search initial state renders useful text or an empty result container, never
  `[object Object]`.
- `data-signal-html` still updates the HTML after client hydration.

## Phase 5: Generate Search Index From the Manifest

### Problem

`www/public/search-index.json` is manually maintained and now contains stale
routes.

### Implementation

1. Add `packages/content/src/search/writer.ts`.
2. Generate search entries from `DocsRouteManifest.routes`.
3. Read per-locale title, section, and search text from route metadata.
4. Validate every generated path against the route manifest and SSG output.
5. Write `www/public/search-index.json` during build, or emit it directly to
   `dist/search-index.json` in the SSG phase.
6. Fail the build if a search entry points at a route that is not generated.

### Acceptance

- No manually edited static search index remains under `www/public`.
- Every search result path returns 200 in `www/dist`.
- Search tests cover at least one guide result, one architecture result, and
  one registry or hub result.

## Phase 6: Move Docs Page CSS Into `@lessjs/ui`

### Problem

`www/app/components/page-styles.ts` is a site-local copy of framework UI
concerns. Missing this import breaks layout, as seen on `guide/getting-started`.

### Target API

Provide framework-level docs layout primitives:

```tsx
<less-doc-page layout='toc'>
  <article slot='content'>...</article>
  <less-toc slot='toc'></less-toc>
</less-doc-page>;
```

or, if a wrapper element is too large for this release:

```ts
import { docsPageSheet, docsTocPageSheet } from '@lessjs/ui/docs-page';
```

### Implementation

1. Move shared `pageStyles` into `packages/ui/src/docs-page.ts` or
   `packages/ui/src/docs-page-styles.ts`.
2. Export the style sheet through `packages/ui/deno.json`.
3. Replace route-local page style imports with the package export.
4. Add a route-lint rule or build assertion:
   any route containing `.content-grid` must include the docs page style preset
   or use `<less-doc-page layout="toc">`.
5. Move theme bootstrap CSS currently assembled in `www/vite.config.ts` into a
   framework helper such as `createThemeHeadFragments()`.

### Acceptance

- `guide/getting-started` and all other docs pages compute
  `.content-grid { display: grid; }` on desktop.
- `www` does not own global theme token CSS strings.
- New docs pages can choose `layout="toc"` without importing raw CSS.

## Phase 7: Stop Executing Browser-Only Islands During Metadata Scan

### Problem

`scanIslandMeta()` dynamically imports island modules. Browser-facing modules
often register custom elements at top level, so Deno-side metadata import can
throw `customElements is not defined`.

### Implementation

1. Update `packages/adapter-vite/src/route-scanner.ts` so island metadata scan
   does not execute island modules by default.
2. Parse only the supported static export shape:

```ts
export const less = { ssr: false, dsd: false, hydrate: 'only' };
export const tagName = 'less-search';
```

3. Reuse or extract the existing small literal parser pattern already used by
   content nav scanning.
4. Keep dynamic import as an opt-in fallback only when explicitly allowed.
5. Add `defineCustomElement(tag, ctor)` to `@lessjs/core` or `@lessjs/ui`:

```ts
export function defineCustomElement(
  tag: string,
  ctor: CustomElementConstructor,
): void {
  if (typeof globalThis.customElements === 'undefined') return;
  if (!globalThis.customElements.get(tag)) {
    globalThis.customElements.define(tag, ctor);
  }
}
```

6. Migrate local islands to use the helper, but the build must no longer depend
   on that migration to scan metadata.

### Acceptance

- `deno task build` no longer logs island metadata skips caused by
  `customElements is not defined`.
- Metadata for local islands is present in the generated build manifest.
- A browser-only top-level custom element registration cannot break metadata
  discovery.

## Phase 8: E2E and Gate Updates

### Required Tests

Add or update Playwright tests under `www/e2e`:

1. `theme-system.spec.ts`
   - find `<less-theme-toggle>` through deep shadow traversal;
   - click the toggle;
   - assert `html[data-theme]` changes;
   - assert the choice survives reload.
2. `i18n-locale.spec.ts`
   - direct `/`, `/en/`, `/zh/`;
   - SPA click from `/` to `/zh/`;
   - assert URL, `html.lang`, layout locale, switch href, and title.
3. `search.spec.ts`
   - open search;
   - query `routing`;
   - assert result path returns 200;
   - assert no stale `/guide/routing`, `/guide/ssg`, `/guide/dsd`, or
     `/guide/islands` result remains.
4. `layout-structure.spec.ts`
   - verify docs pages using a TOC have desktop grid layout;
   - verify mobile collapses to one column without overflow.
5. `island-metadata.spec.ts` or build-log assertion
   - fail if build output includes `Unable to import island module for metadata`.

### Required Commands

Before closing this SOP:

```bash
deno fmt --check
deno task typecheck
deno task graph:check
deno task docs:check-current
deno task build
deno task dsd:check-report
deno run -A npm:@playwright/test@1.59.1 test --config www/e2e/playwright.config.ts --workers=1
```

If full E2E is slow, run the focused specs first, then the full suite before
release closure.

## Exit Criteria

This SOP is complete only when all of the following are true:

- `www` has no manual route list, search index, header nav, locale switch URL,
  or current-path wiring in route render methods.
- `www` route components can use normal JSX events without `data-on-*` or
  method-name strings.
- `www` docs pages use framework-provided docs page styles or wrapper
  components.
- Search index generation fails fast on stale paths.
- Theme, i18n, search, and layout E2E tests pass against `www/dist`.
- Build logs do not hide island metadata failures.
- `docs/status/STATUS.md` and root README version/package-count claims are
  updated to match the validated package graph before release.

## Stopgap Policy

The following stopgaps are acceptable only if they are committed with a linked
tracking issue and removed after the framework contract lands:

- fixing `index.tsx` hardcoded `locale='en'`;
- adding a missing `pageStyles` import to one route;
- editing `www/public/search-index.json` by hand;
- changing a broken event handler to a named method only to unblock one page.

These stopgaps do not satisfy this SOP by themselves.
