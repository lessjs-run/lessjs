# KISS v0.5.3 — Trust Release

**Released:** May 5, 2026

> v0.5.3 eliminates the trust gap between what the documentation promises and what the build actually produces. Every behavior described in the guides now works as stated.

---

## Package Version Bumps

| Package | v0.5.2 | v0.5.3 |
|---|---|---|
| `@kissjs/core` | 0.5.2 | **0.5.3** |
| `@kissjs/ui` | 0.5.1 | **0.5.2** |
| `@kissjs/rpc` | 0.3.0 | 0.3.0 |
| `@kissjs/adapter-lit` | 0.2.0 | 0.2.0 |
| `@kissjs/create` | 0.4.5 | 0.4.5 |

---

## Bug Fixes

### 1. Root middleware scope fixed (`'//*'` → `'/*'`)

**Problem:** A `_middleware.ts` at the project root generated `app.use('//*', ...)` in the Hono entry, which only matched the exact path `/` — not sub-routes. Security middleware, auth guards, and CSP headers silently disappeared on every route below `/`.

**Fix:** `entry-renderer.ts` now emits `app.use('/*', ...)` when the middleware scope is `/`.

### 2. Island chunk map double-prefix fixed

**Problem:** `buildIslandChunkMap()` constructed island script URLs as `client/islands/islands/island-counter-abc.js` because `entry.file` in the Vite manifest already includes the `islands/` prefix. SSG HTML pages referenced 404 script URLs.

**Fix:** `ssg-postprocess.ts` now uses `client/${entry.file}` instead of `client/islands/${entry.file}`.

### 3. Island strategy passthrough fixed

**Problem:** `PackageIslandMeta.strategy` (eager, lazy, idle, visible) was completely dropped in `build-client.ts`. All package islands were loaded with default behavior regardless of their configured strategy.

**Fix:** `build-client.ts` now passes `strategy` from package metadata into `ClientIslandEntry`. Package islands with `strategy: 'eager'` are loaded eagerly; others default to `'lazy'`.

### 4. Nested island file paths fixed

**Problem:** Islands in subdirectories (e.g., `app/islands/posts/index.ts`) generated a tagName `posts-index`, which was then reversed into a module path `islands/posts-index.ts` — a file that doesn't exist. SSR and client builds both failed for nested islands.

**Fix:** New `islandFiles` parameter flows the original scanned file paths through `buildEntryDescriptor()`, `generateHonoEntryCode()`, and `buildSSG()`. The old tagName-based path reconstruction is kept as fallback for backwards compatibility.

### 5. SSG CSP meta injection added

**Problem:** SSR responses included CSP headers from middleware configuration, but SSG-generated static HTML files had zero CSP. Static deployments on CDN/GitHub Pages had no security baseline.

**Fix:** `build-ssg.ts` post-processing now calls `injectCspMeta()` to inject `<meta http-equiv="Content-Security-Policy">` tags into all static HTML files.

### 6. Lit HTML template backtick fix

**Problem:** Code blocks in `getting-started.ts` and `error-handling.ts` used backtick characters (`` ` ``) inside lit `html` template literals, which broke Vite/rolldown parsing.

**Fix:** Replaced backtick tree-drawing characters with Unicode `└` (U+2514).

### 7. DEFAULT_NAV sync

**Problem:** `kiss-layout.ts` had a 9-section default navigation that didn't match the 7-section structure in `nav-data.ts`. The sidebar was inconsistent between layout defaults and data-driven mode.

**Fix:** Updated `DEFAULT_NAV` to the 7-section structure: Start Here → Core Model → Production → Packages → Strategy → Examples → History.

---

## Improvements

### `declare` + `constructor()` pattern for reactive properties

All `@kissjs/ui` components and docs islands now use TypeScript `declare` fields with explicit `constructor()` initialization instead of class field initializers. This eliminates a subtle Lit DSD SSR + client upgrade race condition where class field defaults could overwrite attribute-reflected values during `connectedCallback`.

**Affected components:** kiss-button, kiss-card, kiss-code-block, kiss-input, kiss-layout, kiss-theme-toggle, counter-island, code-block, api-consumer.

### `customElements.get()` guard

All island custom element registrations now use `if (!customElements.get(tagName))` to prevent duplicate definition errors during HMR and SSR + client overlap scenarios.

### escapeHtml cross-reference

`@kissjs/adapter-lit/ssr.ts` now has a comment pointing to `@kissjs/core/render-dsd.ts` as the canonical implementation, preventing the two copies from silently diverging.

---

## Regression Tests

Three new test files with 118 lines of assertions:

- `entry-descriptor.test.ts` — root scope `/*` assertion, nested island path assertion, `islandFiles` fallback assertion
- `entry-generators.test.ts` — package island `strategy: 'eager'` passthrough assertion
- `ssg-postprocess.test.ts` — manifest `entry.file` no double-prefix assertion

Test results: **309 passed**, 1 known Deno upstream signal listener leak (non-project bug).

---

## Docs Overhaul

- **14 guide pages rewritten** with bilingual content (中文为主，英语术语)
- **New page:** `/guide/positioning` — Framework Positioning
- **Navigation restructured** from 9 sections to 7: Start Here, Core Model, Production, Packages, Strategy, Examples, History
- **Roadmap** rewritten from task tables to phased narrative format
- **Homepage** simplified: removed comparison table, added "Read Next" grid
- **Changelog** page added
- `@kissjs/ui` version references updated to 0.5.2

---

## Breaking Changes

None. All fixes are backward-compatible.

---

## What's Next

v0.6 will focus on the **DSD Renderer 2**: safe/unsafe HTML contracts, nested DSD support, slot/projection behavior, and error observability that points to route/tag/source.
