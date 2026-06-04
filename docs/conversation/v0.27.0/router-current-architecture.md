# LessJS Current Routing Architecture — Complete Map

> **v0.27.0 Migration Target**: Replace custom routing with `URLPattern` + `Hono`\
> **Estimated total manual routing logic**: ~1200+ lines across 8 files\
> **Estimated savings with Hono + URLPattern**: ~800-900 lines removed

---

## 1. Overview: The Routing Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                     BUILD TIME (adapter-vite)                    │
│                                                                 │
│  route-scanner.ts ──► entry-descriptor.ts ──► entry-renderer.ts│
│  (filesystem scan)    (data model)           (code generation)  │
│         │                    │                       │          │
│         ▼                    ▼                       ▼          │
│  RouteEntry[]          EntryDescriptor          virtual:less-entry │
│                                                         │       │
│  ssg-package-resolver.ts                                │       │
│  (JSR package resolution)                               ▼       │
│                                                    Hono App     │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
                         toSSG() / app.fetch()
                                   │
┌──────────────────────────────────▼──────────────────────────────┐
│                     RUNTIME (browser)                            │
│                                                                 │
│  less-layout.tsx (1145 lines — client-side component)           │
│  ├── _currentPath()          — read attr                      │
│  ├── _localizePath()         — prefix locale to path          │
│  ├── _otherLocalePath()      — swap locale segment            │
│  ├── _filterByPath()         — filter sidebar by path prefix  │
│  ├── _computeEditUrl()       — path → GitHub edit URL         │
│  ├── _renderHeaderNav()      — locale-aware header links      │
│  ├── _renderSidebarNav()     — locale-aware sidebar links     │
│  ├── _renderMobileTabBar()   — locale-aware mobile nav        │
│  ├── _updateLangSwitch()     — DOM mutation on locale change  │
│  ├── _setupNavDelegation()   — event delegation for SPA nav   │
│  ├── _loadContent()          — fetch + DOM swap               │
│  └── _updateActiveNav()      — aria-current update            │
│                                                                 │
│  navigation.ts (264 lines — Navigation API wrapper)            │
│  ├── navigate()              — push/replace                    │
│  ├── onNavigate()            — subscribe to nav events         │
│  ├── matchRoute()            — URLPattern fallback regex       │
│  └── History API monkey-patch                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. File-by-File Inventory

### 2.1 `packages/ui/src/less-layout.tsx` (1145 lines)

**Purpose**: Client-side Web Component that handles all navigation UI, locale switching, and SPA routing in the browser.

| Method                                 | Lines          | What It Does                                                      | Manual String Ops?                                                     | URLPattern+Hono Replacement                                                      | Savings |
| -------------------------------------- | -------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------- |
| `_currentPath()`                       | 479-483 (5)    | Reads `current-path` attribute                                    | No (attr read)                                                         | Removed; Hono manages path state natively                                        | 5       |
| `_computeEditUrl()`                    | 486-495 (10)   | Builds GitHub edit URL from path, strips locale prefix            | Yes — `split('/')`, `filter`, `join`                                   | Hono middleware or simple utility; could use URLPattern to extract path segments | 5       |
| `_navItems()`                          | 497-499 (3)    | Combines raw items + path filter                                  | No (delegates)                                                         | Removed; Hono routes handle this server-side                                     | 3       |
| `_filterByPath()`                      | 503-518 (16)   | Maps path prefix → sidebar sections                               | Yes — `path.startsWith(prefix)` hardcoded map                          | `URLPattern` matching per route; section membership defined in route config      | 16      |
| `_rawNavItems()`                       | 520-530 (11)   | Parses JSON attribute or property                                 | No (JSON)                                                              | Removed; nav data comes from Hono context                                        | 11      |
| `_headerNav()`                         | 532-542 (11)   | Parses JSON attribute                                             | No (JSON)                                                              | Removed; header nav from Hono context                                            | 11      |
| `_locales()`                           | 544-562 (19)   | Parses locales attribute                                          | No (JSON/array)                                                        | Removed; `hono/i18n` middleware                                                  | 19      |
| `_locale()`                            | 564-568 (5)    | Gets current locale from attr                                     | No (attr read)                                                         | Removed; Hono manages locale context                                             | 5       |
| `_otherLocalePath()`                   | 570-582 (13)   | **Swaps locale segment** in path — e.g. `/en/guide` → `/zh/guide` | **Yes — `split`, `startsWith`, `slice`, string concat**                | `hono/i18n` `t()` or URLPattern to rewrite prefix                                | 13      |
| `_otherLocaleLabel()`                  | 584-588 (5)    | Returns "EN" or "中文"                                            | No                                                                     | `hono/i18n` provides labels                                                      | 5       |
| `_updateLangSwitch()`                  | 591-597 (7)    | **DOM query + mutation** to update lang link text/href            | Yes (DOM manipulation)                                                 | Removed; SSR renders correct link from context                                   | 7       |
| `_localizePath()`                      | 599-607 (9)    | **Prefixes path with locale** — `/guide` → `/en/guide`            | **Yes — `startsWith`, string concat**                                  | `hono/i18n` `localizePath()`                                                     | 9       |
| `_renderHeaderNav()`                   | 792-815 (24)   | Renders nav links with locale prefix + active state               | Yes — calls `_localizePath()`, `startsWith` matching                   | Hono route data + URLPattern for active state                                    | 24      |
| `_renderSidebarNav()`                  | 817-852 (36)   | Renders sidebar with locale prefix + active state                 | Yes — calls `_localizePath()`, string comparison                       | Hono route data + URLPattern for active state                                    | 36      |
| `_renderMobileTabBar()`                | 854-898 (45)   | Renders mobile tab bar with locale-aware links                    | Yes — `sectionRoot()` inline function, `split`, `filter`, `startsWith` | Hono route data + dedicated URLPattern matchers                                  | 45      |
| `sectionRoot()` (nested)               | 861-865 (5)    | Extracts section root from href                                   | **Yes — `split`, `filter`, array index**                               | URLPattern `exec()` to get named groups                                          | 5       |
| `_setupNavDelegation()`                | 1046-1058 (13) | Event delegation: clicks on `[data-nav]` → `navigate()`           | No (DOM events)                                                        | Removed; Hono client-side router handles navigation                              | 13      |
| `_loadContent()`                       | 1083-1116 (34) | **Fetch HTML + DOM swap** for SPA                                 | **Yes — `fetch`, `DOMParser`, `querySelector`, DOM mutation**          | Hono client router swaps content; View Transitions API for animation             | 34      |
| `_updateActiveNav()`                   | 1118-1131 (14) | Updates `aria-current` on nav links by comparing paths            | **Yes — `querySelectorAll`, `getAttribute`, string comparison**        | Removed; Hono client router sets `aria-current`                                  | 14      |
| `connectedCallback()` locale detection | 905-913 (9)    | Detects locale from current-path attribute                        | **Yes — `split`, `startsWith`**                                        | Removed; Hono context                                                            | 9       |
| `attributeChangedCallback()` routing   | 962-966 (5)    | Triggers `_updateActiveNav()` on `current-path` change            | No (callback)                                                          | Removed                                                                          | 5       |

**Total manual routing/locale logic in less-layout.tsx**: ~300 lines\
**Estimated savings with Hono**: ~285 lines (most of the component's routing code removed)

---

### 2.2 `packages/adapter-vite/src/route-scanner.ts` (633 lines)

**Purpose**: Filesystem-based route discovery at build time. Recursively scans `routes/` directory and converts file paths to URL patterns.

| Function                         | Lines        | What It Does                                                           | Manual String Ops?                                                              | URLPattern+Hono Replacement                                                       | Savings |
| -------------------------------- | ------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------- |
| `filePathToRoutePath()`          | 104-128 (25) | **Converts file path to URL path** — `[slug]` → `:slug`, `index` → `/` | **Yes — regex replace for `[param]`, extension strip, separator normalization** | Partially kept; simplified with `path-to-regexp` or native URLPattern conventions | 10      |
| `getRouteType()`                 | 134-137 (4)  | Detects API vs page route                                              | Yes — string `startsWith`                                                       | Kept; trivial                                                                     | 0       |
| `pathToVarName()`                | 143-152 (10) | Path → valid JS variable name                                          | Yes — regex replace chain                                                       | Removed; Hono doesn't need per-route variable names                               | 10      |
| `getSpecialFileType()`           | 158-169 (12) | Detects `_renderer.ts` / `_middleware.ts`                              | Yes — regex extension strip                                                     | Kept or replaced with Hono layout/middleware conventions                          | 5       |
| `scanRoutes()`                   | 183-277 (95) | **Recursive filesystem scanner** — reads dirs, stats files, classifies | No (I/O only)                                                                   | Kept largely unchanged; Hono doesn't change how routes are discovered             | 0       |
| `fileToTagName()`                | 288-293 (6)  | File path → tag name                                                   | Yes — regex replace                                                             | Kept as utility                                                                   | 0       |
| `scanIslands()`                  | 299-343 (45) | Recursive island file scanner                                          | No (I/O)                                                                        | Kept                                                                              | 0       |
| `scanIslandMeta()`               | 370-420 (51) | **Dynamic import** to read island metadata                             | No                                                                              | Kept                                                                              | 0       |
| `scanPackageManifests()`         | 435-484 (50) | Scans package exports for component manifests                          | No                                                                              | Kept                                                                              | 0       |
| `scanCemManifests()`             | 522-563 (42) | Scans node_modules for CEM                                             | No                                                                              | Kept                                                                              | 0       |
| `detectAndClassifyCemPackages()` | 592-632 (41) | Classifies CEM packages                                                | No                                                                              | Kept                                                                              | 0       |

**Estimated savings in route-scanner.ts**: ~25 lines (mainly `pathToVarName()` removed, `filePathToRoutePath()` simplified)

---

### 2.3 `packages/adapter-vite/src/entry-renderer.ts` (786 lines)

**Purpose**: Code generation — produces the virtual `less-entry` module that creates a Hono app with routes.

| Function                  | Lines         | What It Does                                                                                                  | URLPattern+Hono Replacement                                                   | Savings                                       |
| ------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| `renderImport()`          | 69-72 (4)     | Renders import statement                                                                                      | Kept                                                                          | 0                                             |
| `renderMiddleware()`      | 91-189 (99)   | Generates Hono middleware code                                                                                | Already uses Hono patterns                                                    | 0                                             |
| `renderApiRoute()`        | 202-223 (22)  | Generates `app.route()` or `app.all()` for API routes                                                         | Already uses Hono `app.route()`                                               | 0                                             |
| `renderPageRoute()`       | 227-306 (80)  | Generates `app.get()` + SSR renderer + renderer wrapping                                                      | Already uses Hono `app.get()` with `:param` paths                             | 0                                             |
| `renderEntry()`           | 325-745 (421) | **Main code generator** — imports, island registration, SSR helper, app creation, route mount, SSG re-exports | Already Hono-based; could be simplified by removing custom registration logic | ~60 (SSR helper boilerplate, route var names) |
| `generateHonoEntryCode()` | 779-785 (7)   | Thin wrapper                                                                                                  | Kept                                                                          | 0                                             |

**Estimated savings in entry-renderer.ts**: ~60 lines (SSR helper simplification, route var name elimination)

---

### 2.4 `packages/adapter-vite/src/ssg-render.ts` (836 lines)

**Purpose**: The SSG render pipeline orchestration.

| Function                               | Lines         | What It Does                                                                                   | URLPattern+Hono Replacement                                                   | Savings                                          |
| -------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| `resolveDynamicRoutePath()`            | 152-184 (33)  | **Replaces `:param` with values** — manual string substitution                                 | Hono already has `generatePath()` equivalent; could use it                    | 20                                               |
| `ssgRender()`                          | 188-713 (526) | **Main SSG pipeline** — dynamic route expansion + `toSSG()` + post-processing + i18n expansion | Already uses Hono `toSSG()`; i18n expansion could use `hono/i18n` SSG helpers | ~100 (i18n locale loop, manual param resolution) |
| `i18n locale expansion` (in ssgRender) | 402-476 (75)  | **Nested loops** over locales × routes × params                                                | `hono/i18n` SSG middleware generates locale pages automatically               | 75                                               |
| Post-processing chain                  | 478-513 (36)  | DSD polyfill, speculation rules, CSP, view transitions                                         | Kept                                                                          | 0                                                |

**Estimated savings in ssg-render.ts**: ~175 lines (i18n expansion, manual param resolution)

---

### 2.5 `packages/core/src/navigation.ts` (264 lines)

**Purpose**: Client-side navigation using Navigation API with History API fallback.

| Function             | Lines                | What It Does                                                   | URLPattern+Hono Replacement                                        | Savings |
| -------------------- | -------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ | ------- |
| `navigate()`         | 125-147 (23)         | Push/replace navigation                                        | Hono client router's `navigate()`                                  | 23      |
| `onNavigate()`       | 162-203 (42)         | Subscribe to navigation events + popstate fallback             | Hono client router's navigation listener                           | 42      |
| `matchRoute()`       | 211-263 (53)         | **URL matching** — tries URLPattern first, falls back to regex | Already partially uses URLPattern; Hono client router bundles this | 53      |
| History API patching | 40-71, 186-201 (~40) | Monkey-patches `history.pushState/replaceState`                | Hono client router manages history internally                      | 40      |

**Estimated savings in navigation.ts**: ~158 lines (entire file replaced by Hono client)

---

### 2.6 `packages/adapter-vite/src/ssg-package-resolver.ts` (265 lines)

**Purpose**: Resolves `@openelement/` package imports for SSG builds (JSR → local or fetched sources).

| Component   | Savings | Notes                            |
| ----------- | ------- | -------------------------------- |
| Entire file | 0       | Not routing-related; stays as-is |

---

### 2.7 Route File Patterns: `www/app/routes/`

**Current Convention**:

| Pattern                              | URL Result                      | File Path                            |
| ------------------------------------ | ------------------------------- | ------------------------------------ |
| `index.tsx`                          | `/`                             | → `/index.html`                      |
| `about.tsx`                          | `/about`                        | → `/about/index.html`                |
| `blog/[slug].tsx`                    | `/blog/:slug`                   | → `/blog/hello-world/index.html`     |
| `registry/[package].tsx`             | `/registry/:package`            | → `/registry/@scope__pkg/index.html` |
| `registry/[package]/[component].tsx` | `/registry/:package/:component` | nested dynamic                       |

**Locale expansion**: SSG generates `/en/blog/post-slug/` and `/zh/blog/post-slug/` by looping through locales — this is ~75 lines of manual nested loops (see ssg-render.ts §2.4).

**SEO output**: `dist/en/guide/getting-started/index.html`, `dist/zh/guide/getting-started/index.html`

**Dynamic route conventions**:

- `[slug]` → `:slug` (via regex `\[([^\]]+)\]` in `filePathToRoutePath()`)
- `getStaticPaths()` export returns `Array<Record<string, string>>` for SSG expansion
- Route type detection: files under `api/` subdirectory → API routes, others → page routes

---

### 2.8 `packages/adapter-vite/src/ssg-postprocess.ts` (462 lines)

**Purpose**: Post-render HTML injection (DSD polyfill, speculation rules, CSP, View Transitions).

Not routing-related — stays as-is. Zero savings.

---

## 3. Hono + URLPattern Integration Points

### 3.1 Current State: Hono Already Present

LessJS **already integrates Hono** at multiple levels:

1. **SSR/Dev Server** (`entry-renderer.ts`): Generates a full Hono app with `app.get()`, `app.route()`, `app.use()`, `c.html()`, `c.req.param()`
2. **SSG** (`ssg-render.ts`): Uses `Hono.toSSG()` for static site generation
3. **Middleware** (middlewareDecl): Uses `hono/request-id`, `hono/logger`, `hono/cors`, `hono/secure-headers`

### 3.2 What's Missing: Client-Side Hono Router

The **key gap** is that Hono is only used server-side. The client-side (`less-layout.tsx`) has its own:

- Navigation event handling
- Path string manipulation
- Locale prefix/suffix operations
- DOM-based navigation state management

**What needs to change** (sorted by impact):

| Priority | Change                                                                                                          | Lines Saved | Risk                                   |
| -------- | --------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------- |
| **P1**   | Replace `_renderHeaderNav()`, `_renderSidebarNav()`, `_renderMobileTabBar()` with Hono context-driven rendering | ~105        | Low — data-flow change only            |
| **P1**   | Replace `navigate()`, `onNavigate()` with Hono client router                                                    | ~158        | Medium — navigation is critical        |
| **P1**   | Replace `_otherLocalePath()`, `_localizePath()` with `hono/i18n` helpers                                        | ~22         | Low — pure path manipulation           |
| **P2**   | Auto-generate locale SSG pages via `hono/i18n` SSG integration                                                  | ~75         | Medium — production SSG pipeline       |
| **P2**   | Remove `_filterByPath()` hardcoded section map                                                                  | ~16         | Low — config change                    |
| **P2**   | Remove `_computeEditUrl()`, `_setupNavDelegation()`, `_loadContent()`, `_updateActiveNav()`                     | ~66         | Medium — SPA behavior                  |
| **P3**   | Remove `_locales()`, `_locale()`, `_rawNavItems()`, `_headerNav()` attribute parsers                            | ~46         | Low — data comes from context          |
| **P3**   | Remove `_updateLangSwitch()` DOM mutation                                                                       | ~7          | Low                                    |
| **P3**   | Remove `filePathToRoutePath()`, `pathToVarName()` manual string ops                                             | ~25         | Low — replaced by standard conventions |

### 3.3 URLPattern: Where It Fits Now vs. Future

**Current usage**:

- `navigation.ts`: `matchRoute()` tries URLPattern first, falls back to regex
- `route-scanner.ts`: Comment mentions URLPattern-compatible `:param` syntax
- `ssg-postprocess.ts`: Comment mentions URLPattern for route matching

**Future usage**:

- Replace all `path.startsWith(prefix)` checks with `URLPattern.exec()`
- Replace `sectionRoot()` manual string splitting with URLPattern named groups
- Replace `_localizePath()` prefix logic with `new URLPattern({ pathname: '/:locale/*' })`
- Replace `_otherLocalePath()` swap logic with URLPattern group substitution

---

## 4. Summary: Line Count & Savings

| File                      | Total Lines | Routing Lines | Removable Lines | Saved                                      |
| ------------------------- | ----------- | ------------- | --------------- | ------------------------------------------ |
| `less-layout.tsx`         | 1145        | ~300          | ~285            | Routing code eliminated from UI component  |
| `route-scanner.ts`        | 633         | ~384          | ~25             | Minor simplification                       |
| `entry-renderer.ts`       | 786         | ~786          | ~60             | Boilerplate reduction                      |
| `ssg-render.ts`           | 836         | ~526          | ~175            | i18n expansion + param resolution          |
| `navigation.ts`           | 264         | ~264          | ~158            | Entire file replaced by Hono client router |
| `ssg-package-resolver.ts` | 265         | 0             | 0               | Not routing-related                        |
| `ssg-postprocess.ts`      | 462         | 0             | 0               | Not routing-related                        |
| **TOTAL**                 | **4391**    | **~2260**     | **~703**        |                                            |

---

## 5. Migration Priority Order

1. **Phase 1** (low risk, high gain): Add Hono client-side router, replace `navigate.ts` entirely + replace locale path helpers in `less-layout.tsx`
2. **Phase 2** (medium risk, high gain): Make `less-layout.tsx` navigation rendering data-driven from Hono context instead of manual path ops
3. **Phase 3** (medium risk, medium gain): Use `hono/i18n` for SSG locale expansion, eliminating 75 lines of nested loops in `ssg-render.ts`
4. **Phase 4** (low risk, low gain): Clean up `route-scanner.ts` and `entry-renderer.ts` leftovers

**Key constraint**: The SSR entry is already Hono — the migration is primarily about extending Hono to the client side and using `hono/i18n` for locale management. The core pattern (`[param]` → `:param`) is already compatible with both `URLPattern` and Hono.
