# LessJS Router Content Architecture

> v0.27.0 — MD-based content with `@openelement/router` dynamic routes\
> Designed: 2026-05-30 | Migration target: v0.28.0

---

## 1. Current State (Baseline)

### 1.1 Route Files: Content Hard-Coded in TSX

All guide and architecture pages embed content directly in `DsdElement` subclasses via `_renderEn()`/`_renderZh()` template string methods. Each page is ~200-300 lines, ~80% content, ~20% boilerplate.

```
www/app/routes/
  guide/
    getting-started.tsx    # 300 lines, _renderEn() 110 lines, _renderZh() 120 lines
    core-concepts.tsx
    routing-and-data.tsx
    ...
  architecture/
    dsd.tsx                # 267 lines, _renderEn() 110 lines, _renderZh() 110 lines
    islands.tsx
    ...
  blog/
    index.tsx              # Thinner: uses virtual:less-blog-data
    [slug].tsx             # Thin loader: imports getPostBySlug(), renders html
```

**Key patterns in every route file:**

```tsx
// line 1: metadata for nav scanner
export const meta = { section: 'Quick Start', label: 'Getting Started', order: 1 };

// lines 2-9: imports (always same set)
import { headerNav, navSections } from '@openelement/content/nav';
import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens';
import '@openelement/ui\/open-layout';
import '@openelement/ui\/open-code-block';
import '@openelement/ui\/open-callout';

// lines 12-49: route-specific CSS via StyleSheet.replaceSync
const routeSheet = new StyleSheet();
routeSheet.replaceSync(`...`);

// lines 51-298: page class with two locale render methods
export class GettingStartedPage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];
  override render() {
    return (this._getLocale('zh')) === 'en' ? this._renderEn() : this._renderZh();
  }
  private _renderZh() {
    return `<open-layout ...>...html content...</open-layout>`;
  }
  private _renderEn() {
    return `<open-layout ...>...html content...</open-layout>`;
  }
}
```

**Route count**: ~20 files in guide/ + ~8 in architecture/ + others (registry, api, hub, etc.)

### 1.2 Blog: Already MD-Based

The blog system demonstrates the target pattern:

- **Content**: `www/content/blog/*.md` — grey-matter frontmatter + markdown body
- **Processing**: `@openelement/content` `parseMarkdownFile()` — matter + marked + sanitize-html
- **Data bridge**: `virtual:less-blog-data` Vite virtual module → `getPostBySlug(slug)`
- **SSG discovery**: `getStaticPaths()` in `blog/[slug].tsx` returns `[{slug}, ...]`
- **Route**: 160-line `DsdElement` that constructs `<open-layout>` + injects `post.html` via `innerHTML`

### 1.3 Navigation Scanning

`@openelement/content/nav/scanner.ts` `scanNavData()`:

- Walks `app/routes/` directory
- Parses `export const meta = { section, label, order }` from each route file
- Groups into `NavSection[]` by section name
- Exported via `virtual:less-nav` (or generated `.ts` module)

**Limitation**: Metadata lives in route files, not in content files. This creates the tight coupling between routing and content we want to break.

### 1.4 SSG Pipeline

`packages/adapter-vite/src/cli/ssg-render.ts`:

- Loads SSR bundle (Hono app)
- Calls each route module's `getStaticPaths()` for dynamic routes
- Renders each path via `app.fetch(request)` with locale header
- Writes HTML files, handles clean URLs, i18n expansion, client injection

---

## 2. Target Architecture

### 2.1 Design Principles

1. **Content in MD, not TSX** — All documentation content lives in `.md` files organized by section×locale
2. **Routes are thin loaders** — Each route file is ~30 lines that reads MD, renders HTML, slots into layout
3. **Single dynamic route per section** — `/:locale?/guide/:page` replaces N static route files
4. **SSG from content directory** — Page discovery comes from `www/content/` directory walk, not `getStaticPaths()` in each file
5. **Frontmatter drives navigation** — Section/label/order moves from `export const meta` into MD frontmatter
6. **Backward compatible** — During migration, existing TSX routes continue to work alongside new MD-based routes

### 2.2 Directory Structure

```
www/
  content/                          # ← All documentation content (MD)
    blog/                           # Blog: flat structure, legacy format
      2026-05-12-v0-12-0.md        # Dates in filename for sort order
      ...
    guide/                          # Guide content: per-locale subdirectories
      en/                           # English
        getting-started.md
        core-concepts.md
        routing-and-data.md
        islands-and-ssr.md
        api.md
        configuration.md
        deployment.md
        testing.md
        error-handling.md
      zh/                           # Chinese
        getting-started.md
        core-concepts.md
        routing-and-data.md
        islands-and-ssr.md
        api.md
        configuration.md
        deployment.md
        testing.md
        error-handling.md
    architecture/                   # Architecture content: per-locale
      en/
        architecture.md
        dsd.md
        islands.md
        islands-deep.md
        comparison.md
        benchmark.md
        design-system.md
        package-compatibility.md
        standards-registry.md
      zh/
        architecture.md
        dsd.md
        islands.md
        islands-deep.md
        comparison.md
        benchmark.md
        design-system.md
        package-compatibility.md
        standards-registry.md
    reference/                      # API reference content
      en/
        index.md
      zh/
        index.md

  app/
    routes/
      guide/[page].tsx              # Thin loader: ~30 lines
      architecture/[page].tsx       # Thin loader: ~30 lines
      reference/[page].tsx          # Thin loader: ~30 lines
      blog/[slug].tsx               # Existing (may also become MD-based thin loader)
      blog/index.tsx                # Existing
      index/index.tsx               # Homepage (remains custom TSX)
      hub/index.tsx                 # Hub page (remains custom TSX)
      registry/...                  # Registry (remains custom TSX)
      apilist.tsx                   # Unchanged
      404.tsx                       # Unchanged
```

### 2.3 MD Frontmatter Schema

Each `.md` file carries metadata in YAML frontmatter that replaces `export const meta` from route files:

```yaml
---
# ─── Required fields ───
title: 'Getting Started'           # Page <h1> title (per-locale)

# ─── Navigation metadata ───
section: 'Quick Start'             # Sidebar section heading
label: 'Getting Started'           # Sidebar nav item label
order: 1                           # Sort order within section

# ─── Optional fields ───
excerpt: 'Start from a minimal...' # Meta description / summary
tags: ['beginner', 'setup']        # Content tags
draft: false                       # Exclude from production builds
type: 'page'                       # Content type discriminator (page|adr|reference)
lastmod: '2026-05-25'              # Last modification date (for sitemap)

# ─── Section-specific optional ───
previous: '/guide/installation'    # Prev page for breadcrumb (auto-derived if omitted)
next: '/guide/core-concepts'       # Next page for breadcrumb (auto-derived if omitted)
---
```

**TypeScript schema:**

```typescript
/** Frontmatter for documentation pages (guide/architecture/reference) */
interface DocPageFrontmatter {
  /** Page title (per-locale, rendered as <h1>) */
  title: string;
  /** Sidebar section heading for grouping */
  section: string;
  /** Sidebar nav item label */
  label: string;
  /** Sort order within section (lower = higher in nav, default 100) */
  order?: number;
  /** Meta description / content excerpt */
  excerpt?: string;
  /** Content tags for filtering/metadata */
  tags?: string[];
  /** Exclude from production builds */
  draft?: boolean;
  /** Content type discriminator */
  type?: 'page' | 'adr' | 'reference';
  /** Last modification date (ISO 8601, for sitemap) */
  lastmod?: string;
  /** Previous page path override (auto-derived from nav order if omitted) */
  previous?: string;
  /** Next page path override (auto-derived from nav order if omitted) */
  next?: string;
}
```

### 2.4 Page-Specific Styles

Pages currently have route-specific CSS injected via `StyleSheet.replaceSync()`. With MD-based content, we have two options:

**Option A (recommended): `style` frontmatter field** — embed page-specific CSS

```yaml
---
title: 'DSD Rendering'
section: 'Principles'
style: |
  .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: var(--size-4); }
  .comparison-item { padding: var(--size-4); border: 1px solid var(--border); }
  .comparison-item.less { border-left: 3px solid var(--brand); }
---
```

The TSX loader injects styles from frontmatter into the component's `StyleSheet`.

**Option B: `style.md` companion files** — page-specific styles in sibling `.css` files

```
content/guide/en/getting-started.md
content/guide/en/getting-started.css   # ← companion CSS file
```

The loader checks for companion CSS and includes it if present.

**Recommendation**: Use Option A for now — simple, self-contained, no extra files. Migrate to Option B only if CSS grows beyond ~30 lines.

---

## 3. TSX Loader Template

### 3.1 Single-Section Loader (`guide/[page].tsx`)

This is the target pattern — each section has exactly one thin route file:

```tsx
/**
 * Guide Section Route — MD Content Loader
 * Maps /:locale?/guide/:page to www/content/guide/{locale}/{page}.md
 */
import { headerNav, navSections } from '@openelement/content/nav';
import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens';
import '@openelement/ui\/open-layout';
import '@openelement/ui\/open-code-block';
import '@openelement/ui\/open-callout';
import { resolveRoute } from '@openelement/router';
import { loadPage } from '@openelement/content/page-loader';

interface GuideRouteParams {
  locale: string;
  page: string;
}

// ─── Static Paths for SSG ──────────────────────────────────────

/** Return all locale×page combinations for SSG (called by ssg-render.ts) */
export function getStaticPaths(): Array<Record<string, string>> {
  return loadPage.getStaticPaths('guide');
}

// ─── Route Component ───────────────────────────────────────────

const routeSheet = new StyleSheet();
routeSheet.replaceSync(loadPage.getSharedStyles('guide'));

customElements.define(
  'page-guide',
  class GuidePage extends DsdElement {
    static override styles = [openPropsTokenSheet, routeSheet];

    /** Injected by router from URLPattern result: { locale, page } */
    declare routeParams: GuideRouteParams;

    override render() {
      const { locale, page } = this.routeParams;
      const doc = loadPage('guide', locale, page);

      if (!doc) {
        return `<open-layout ...>${loadPage.render404('guide', locale)}</open-layout>`;
      }

      // Inject page-specific styles from frontmatter
      if (doc.frontmatter?.style) {
        routeSheet.replaceSync(doc.frontmatter.style);
      }

      return `
      <open-layout
        locale="${locale}"
        locales='["en","zh"]'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/${locale}/guide/${page}"
      >
        <div class="container">
          <h1>${doc.frontmatter.title}</h1>
          ${doc.frontmatter.excerpt ? `<p class="subtitle">${doc.frontmatter.excerpt}</p>` : ''}
          <div class="content">${doc.html}</div>
          ${
        doc.navPrev || doc.navNext
          ? `
          <div class="nav-row">
            ${
            doc.navPrev
              ? `<a href="/${locale}/guide/${doc.navPrev.path}" class="nav-link">&larr; ${doc.navPrev.label}</a>`
              : ''
          }
            ${
            doc.navNext
              ? `<a href="/${locale}/guide/${doc.navNext.path}" class="nav-link">${doc.navNext.label} &rarr;</a>`
              : ''
          }
          </div>`
          : ''
      }
        </div>
        <less-toc></less-toc>
      </open-layout>
    `;
    }
  },
);

export default class GuidePage extends DsdElement {}
export const tagName = 'page-guide';
```

**Total: ~60 lines** (down from ~300 lines for a single page)

### 3.2 `@openelement/content/page-loader` API

A new module in `@openelement/content` that provides the MD loading infrastructure:

```typescript
// @openelement/content/page-loader — MD content loading for doc pages

/** Simplified loader for SSR — synchronous for DsdElement.render() compatibility */
export function loadPage(
  section: 'guide' | 'architecture' | 'reference',
  locale: string,
  page: string,
): DocPageResult | null;

/** SSG discovery: walk content directory for all locale×page combinations */
export function getStaticPaths(section: string): Array<Record<string, string>>;

/** Shared CSS for a section (base content styles: typography, code blocks, etc.) */
export function getSharedStyles(section: string): string;

/** Render a 404 snippet for missing pages */
export function render404(section: string, locale: string): string;

/** Aggregated nav from all MD frontmatter (replaces route-file meta extraction) */
export function buildNavFromContent(contentDir: string): NavSection[];

interface DocPageResult {
  /** Parsed frontmatter */
  frontmatter: DocPageFrontmatter;
  /** Rendered HTML from markdown */
  html: string;
  /** Previous page for breadcrumb links (derived from nav order) */
  navPrev?: { path: string; label: string };
  /** Next page for breadcrumb links (derived from nav order) */
  navNext?: { path: string; label: string };
}
```

### 3.3 Implementation Alternatives for SSG+SSR

The `loadPage()` function must work in both SSR (string-based DsdElement.render()) and SSG (content pre-build) contexts. Two approaches:

**Approach A: Virtual module (aligned with existing blog pattern)**

```typescript
// virtual:less-page-data-guide
// Generated at build-time by Vite plugin, used by both SSR and SSG
export const pages: Record<string, DocPageResult> = {
  'en/getting-started': { frontmatter: {...}, html: '<p>...</p>' },
  'zh/getting-started': { frontmatter: {...}, html: '<p>...</p>' },
  ...
};

export function loadPage(locale: string, page: string): DocPageResult | null {
  return pages[`${locale}/${page}`] ?? null;
}
```

**Approach B: Build-time inlining (simpler, matches current approach)**

A Vite plugin that at build-time reads all MD files and inlines the generated HTML+frontmatter into a `.ts` module placed in `www/generated/page-data-{section}.ts`, which route files import directly.

**Recommendation**: Start with Approach B (simpler, proven pattern). Graduate to Approach A when virtual module performance is needed.

---

## 4. SSG Integration

### 4.1 Content-Driven Page Discovery

Current SSG depends on `getStaticPaths()` in each route file. With MD-based content, the SSG pipeline instead walks the content directory:

```typescript
// @openelement/content/page-loader: SSG discovery

/**
 * Discover all static paths from the content directory.
 *
 * Walks www/content/{section}/{locale}/*.md and returns
 * { locale, page } combinations for SSG generation.
 *
 * Called by ssg-render.ts during Phase 2 (dynamic route collection).
 */
export function getStaticPaths(section: string): Array<Record<string, string>> {
  const paths: Array<Record<string, string>> = [];
  const contentDir = resolve(process.cwd(), 'www/content', section);

  if (!existsSync(contentDir)) return paths;

  // Iterate locale directories (en, zh, ...)
  for (const locale of readdirSync(contentDir)) {
    const localeDir = join(contentDir, locale);
    if (!statSync(localeDir).isDirectory()) continue;

    // Iterate markdown files
    for (const file of readdirSync(localeDir)) {
      if (!file.endsWith('.md')) continue;
      const page = file.replace(/\.md$/, '');

      paths.push({ locale, page });
    }
  }

  return paths;
}
```

### 4.2 Integration with SSG Pipeline

The existing `ssg-render.ts` pipeline needs one change: route-level `getStaticPaths()` for MD-based sections calls through to `@openelement/content`:

```
ssg-render.ts
  ├─ collect all route modules
  ├─ for each route:
  │   ├─ if route.exports.getStaticPaths → call it (existing pattern)
  │   └─ (NEW) if route is guide/[page].tsx:
  │       └─ getStaticPaths() delegates to loadPage.getStaticPaths('guide')
  ├─ expand by locale (existing i18n support)
  ├─ render each path via app.fetch()
  └─ write HTML files
```

The thin loader's `getStaticPaths()` hook:

```typescript
export function getStaticPaths(): Array<Record<string, string>> {
  // Delegates to content package for directory discovery
  return loadPage.getStaticPaths('guide');
}
```

### 4.3 Build Pipeline Changes

In `build-pipeline.ts` or `build-ssg.ts`:

```
Phase 1: Build SSR bundle
Phase 2: (NEW) Build page data modules
  ├─ Read www/content/guide/{en,zh}/*.md
  ├─ Parse frontmatter + render markdown
  └─ Write www/generated/page-data-guide.ts
  └─ Write www/generated/page-data-architecture.ts
Phase 3: Build client bundle
Phase 4: SSG rendering
  ├─ Load SSR bundle → app
  ├─ Collect static paths (includes MD-based discovery)
  ├─ Render all paths
  └─ Post-process (inject client scripts, clean URLs)
```

---

## 5. Navigation Scanning Adaptation

### 5.1 Current: Route File Meta Extraction

```typescript
// scanner.ts — walks app/routes/, reads export const meta from each file
function scanNavData(options: NavOptions): NavSection[] { ... }
```

### 5.2 Target: Content MD Frontmatter Extraction

A new scanner in `@openelement/content/nav/content-scanner.ts`:

```typescript
/**
 * Build navigation from MD frontmatter instead of route file meta exports.
 *
 * Walks www/content/{section}/{locale}/*.md, reads frontmatter,
 * and aggregates NavSection[] organized by section.
 */
export function scanNavFromContent(contentDir: string): NavSection[] {
  const sectionItems = new Map<string, NavItem[]>();
  const sectionOrder: string[] = [];

  for (const section of ['guide', 'architecture', 'reference']) {
    const sectionDir = join(contentDir, section, 'en'); // Use 'en' as canonical
    if (!existsSync(sectionDir)) continue;

    for (const file of readdirSync(sectionDir)) {
      if (!file.endsWith('.md')) continue;
      const page = file.replace(/\.md$/, '');

      const fullPath = join(sectionDir, file);
      const content = readFileSync(fullPath, 'utf-8');
      const { data } = matter(content);

      if (!data.section || !data.label) continue;

      if (!sectionItems.has(data.section)) {
        sectionOrder.push(data.section);
        sectionItems.set(data.section, []);
      }

      sectionItems.get(data.section)!.push({
        path: `/${section}/${page}`,
        label: data.label,
        order: data.order ?? 100,
      });
    }
  }

  return sectionOrder.map((section) => ({
    section,
    items: (sectionItems.get(section) || []).sort(
      (a, b) => (a.order ?? 100) - (b.order ?? 100),
    ),
  }));
}
```

### 5.3 Dual-Mode Scanning During Migration

During the transition period, the nav scanner should read from both sources:

```typescript
export function scanNavData(options: NavOptions & { contentDir?: string }): NavSection[] {
  const routeSections = scanNavFromRoutes(options); // existing scanner
  const contentSections = options.contentDir
    ? scanNavFromContent(options.contentDir) // new scanner
    : [];

  return mergeNavSections(routeSections, contentSections);
}
```

---

## 6. Migration Plan

### Phase 1: Infrastructure (v0.27.x)

**Goal**: Build the supporting infrastructure without changing any existing routes.

1. **Create `@openelement/content/page-loader` module**
   - `loadPage()` — MD file reader + matter + marked + sanitize pipeline
   - `getStaticPaths()` — content directory walker
   - `getSharedStyles()` — shared section CSS provider
   - Unit tests for all functions

2. **Create dual-mode nav scanner**
   - `scanNavFromContent()` in `@openelement/content/nav`
   - `mergeNavSections()` with route-level dedup
   - Integration test: identical nav output from both sources

3. **Add build-step page data generation plugin**
   - Vite plugin: `less:page-data`
   - Generates `www/generated/page-data-{section}.ts` during build
   - Runs before SSR bundle (Phase 2 before Phase 1)

### Phase 2: Pilot (v0.27.x)

**Goal**: Migrate one section to MD as proof of concept.

1. **Choose pilot section**: `guide` (9 pages, well-structured content)

2. **Create MD files**: Extract content from each `guide/*.tsx` into `www/content/guide/{en,zh}/{page}.md`
   - Copy `_renderEn()` HTML content → `en/{page}.md`
   - Copy `_renderZh()` HTML content → `zh/{page}.md`
   - Add YAML frontmatter with section/label/order from `export const meta`

3. **Create thin loader**: `www/app/routes/guide/[page].tsx` (~60 lines)
   - Uses `loadPage()` from `@openelement/content/page-loader`
   - Implements `getStaticPaths()` via directory discovery

4. **Keep old route files as fallback**
   - Rename `getting-started.tsx` → `getting-started.tsx.bak`
   - Verify SSG generates identical HTML for both paths
   - Only remove `.bak` files after verification

### Phase 3: Full Migration (v0.28.0)

1. **Migrate architecture section** (8 pages)
   - Same pattern as guide: extract content to MD, create thin loader
   - `www/app/routes/architecture/[page].tsx` (~60 lines)

2. **Migrate reference section** (1 page)
   - `www/app/routes/reference/[page].tsx`

3. **Remove old route files**: Delete all `guide/*.tsx`, `architecture/*.tsx`

4. **Update nav scanning**: Switch to content-only scanning, remove route-file meta extraction

### Phase 4: Optimization (v0.28.0+)

1. **Virtual module optimization**: Replace generated `.ts` files with `virtual:less-page-data-{section}` for zero-I/O SSG
2. **Shared CSS deduplication**: Extract common CSS patterns into section-level shared stylesheets
3. **Content hash caching**: SHA-256 of content files → skip rebuild for unchanged pages
4. **Hot reload**: Vite plugin watches `www/content/` for changes, rebuilds affected page data module

### 6.1 Component Pages (Special Handling)

Some pages use interactive island components (e.g., `dsd.tsx` uses `<reactive-showcase>`, `islands.tsx` uses `<island-timeline>`). These require special handling in MD:

**Option A: Custom element tags in markdown**

Markdown with raw HTML for custom elements:

```markdown
## Reactive DSD (v0.21)

DsdElement + Signals 提供零框架响应式。

<reactive-showcase></reactive-showcase>
```

The HTML sanitizer must allow custom element tags:

```typescript
// Add to SANITIZE_OPTIONS in markdown.ts
allowedTags: [
  ...existing,
  'reactive-showcase',
  'counter-island',
  'less-toc',
  'less-search',
],
```

**Option B: Island component placement**

The thin loader has slot injection points defined in frontmatter:

```yaml
---
title: 'DSD Rendering'
islands:
  after: '## Reactive DSD'
  component: 'reactive-showcase'
---
```

The loader inserts the component HTML after the specified heading marker.

**Recommendation**: Option A is simpler and more natural for content authors. Extend the allow-list in `markdown.ts` to permit known safe component tags.

---

## 7. Content Migration Mechanic

### 7.1 Extraction Script

A build-time utility that extracts content from existing TSX files:

```typescript
// scripts/extract-page-content.ts
// For each guide/*.tsx file:
//   1. Parse _renderEn() template string → extract inner HTML (between <open-layout> and </open-layout>)
//   2. Parse _renderZh() template string → extract inner HTML
//   3. Parse export const meta → convert to YAML frontmatter
//   4. Write en/{page}.md and zh/{page}.md
```

### 7.2 Content Validation

After extraction, validate that:

- SSG output for old route === SSG output for new route (HTML comparison)
- Navigation sidebar is identical
- All internal links resolve correctly (relative paths adjusted)
- Page-specific styles are preserved (frontmatter style field or companion CSS)

### 7.3 Rollback Strategy

All old route files are preserved during migration:

- Renamed to `.tsx.bak` rather than deleted
- Git history preserves original content
- SSG can fall back to old routes if MD file is missing
- Complete rollback requires: delete thin loader, rename `.bak` files back

---

## 8. File Count Comparison

| Category                     | Before                     | After                      | Delta        |
| ---------------------------- | -------------------------- | -------------------------- | ------------ |
| Route files (guide)          | 9 × .tsx (~300 lines each) | 1 × [page].tsx (~60 lines) | -92%         |
| Route files (architecture)   | 8 × .tsx (~300 lines each) | 1 × [page].tsx (~60 lines) | -90%         |
| Content files (guide)        | 0                          | 18 × .md (9 en + 9 zh)     | +18          |
| Content files (architecture) | 0                          | 16 × .md (8 en + 8 zh)     | +16          |
| **Total LOC (routes)**       | ~5,000 lines (17 files)    | ~300 lines (3 files)       | -94%         |
| **Total LOC (content)**      | 0                          | ~5,000 lines (34 files)    | Same (moved) |

Content volume is identical — it just moves from template strings to `.md` files.

---

## 9. Key Technical Decisions

| Decision                              | Rationale                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **MD over TSX for content**           | Content authors need no TypeScript/DSD knowledge; plain markdown with HTML fragments suffices                  |
| **Per-locale MD files**               | Each locale has its own markdown — avoids `isZh ? 'zh' : 'en'` conditionals, enables locale-specific structure |
| **Section-based thin loaders**        | One route per section (not one per page) — URLPattern `:page` captures the page name, no manual registration   |
| **Build-time MD processing**          | `matter()` + `marked()` + `sanitize-html` run at build time, not SSR runtime — zero overhead per request       |
| **Frontmatter for nav**               | Moves metadata from code to content — content is self-describing                                               |
| **getStaticPaths via directory walk** | SSG discovers pages by scanning `www/content/` — no manual path registration                                   |
| **Shared section styles**             | Extracted from old route files' `routeSheet` into shared stylesheets — reduces duplication                     |

---

## 10. Implementation Checklist

### v0.27.0-alpha

- [ ] Create `@openelement/content/page-loader` module
  - [ ] `loadPage()` — MD file read + parse + sanitize
  - [ ] `getStaticPaths()` — content directory walker
  - [ ] `getSharedStyles()` — section-level shared CSS
  - [ ] `buildNavFromContent()` — frontmatter-to-NavSection converter
  - [ ] Unit tests

- [ ] Create `less:page-data` Vite plugin
  - [ ] Build-step: read content MD, generate `.ts` data module
  - [ ] Watch mode: rebuild on content file changes

- [ ] Update nav scanner for dual-mode
  - [ ] `scanNavFromContent()` implementation
  - [ ] `mergeNavSections()` for coexistence period
  - [ ] Integration tests

### v0.27.0-beta

- [ ] Extract guide content to MD (9 pages × 2 locales = 18 files)
- [ ] Create `guide/[page].tsx` thin loader
- [ ] Verify SSG output matches old routes
- [ ] Rename old guide route files to `.bak`

### v0.28.0

- [ ] Extract architecture content to MD (8 pages × 2 locales = 16 files)
- [ ] Create `architecture/[page].tsx` thin loader
- [ ] Extract reference content
- [ ] Remove all old route `.bak` files
- [ ] Switch nav scanner to content-only mode
- [ ] Update content extraction script as reusable tool

---

## Appendix A: Example MD Content

### `www/content/guide/en/getting-started.md`

````markdown
---
title: 'Getting Started'
section: 'Quick Start'
label: 'Getting Started'
order: 1
excerpt: 'Start from a minimal project: create an app, start the dev server, build static output, and understand what each directory is responsible for.'
tags: ['quickstart', 'setup']
---

## 1. Create a Project

```bash
deno run -A jsr:@openelement/create my-app
cd my-app
```
````

The scaffolded project includes page routes, a sample island, Vite config, and common Deno tasks.

## 2. Start the Dev Server

```bash
deno task dev
```

Dev mode provides module loading and hot reload through Vite, with SSR/API behavior via the generated Hono entry. Open `http://localhost:5173` by default.

## 3. Build Static Output

```bash
deno task build
```

The build command produces the SSR bundle, client island entry, and SSG HTML sequentially. The final output lands in `dist/` and can be deployed to any static hosting platform.

## Project Structure

```
my-app/
|-- app/
|   |-- routes/
|   |   |-- index.ts          # page route for /
|   |   |-- about.ts          # page route for /about
|   |   └-- api/
|   |       └-- status.ts     # API route
|   |-- islands/
|   |   └-- counter.ts        # client-upgraded Custom Element
|   └-- _renderer.ts          # optional layout wrapper
|-- deno.json                 # tasks and imports
└-- vite.config.ts            # LessJS plugin config
```

<open-callout type="info" label="Recommended">
Deno 2.7+ recommended. LessJS is a Deno-first project — dependencies are managed through `deno.json`, and all dev/build commands use Deno tasks.
</open-callout>

## Next Steps

Read [Core Concepts](/guide/core-concepts), then [Routing & Data](/guide/routing-and-data), [Islands & SSR](/guide/islands-and-ssr), and [Deployment](/guide/deployment).

````
---

## Appendix B: Full Thin Loader Example

### `www/app/routes/guide/[page].tsx`

```tsx
/**
 * Guide Section — Dynamic MD Content Loader
 * Route: /:locale?/guide/:page → www/content/guide/{locale}/{page}.md
 * ADR: v0.27.0 router-content-architecture
 */
import { headerNav, navSections } from '@openelement/content/nav';
import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens';
import '@openelement/ui\/open-layout';
import '@openelement/ui\/open-code-block';
import '@openelement/ui\/open-callout';
import '../../islands/less-toc.tsx';
import { loadPage } from '@openelement/content/page-loader';

export function getStaticPaths(): Array<Record<string, string>> {
  return loadPage.getStaticPaths('guide');
}

const routeSheet = new StyleSheet();
routeSheet.replaceSync(loadPage.getSharedStyles('guide'));

customElements.define('page-guide', class GuidePage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];
  declare routeParams: { locale: string; page: string };

  override render() {
    const { locale, page } = this.routeParams;
    const doc = loadPage('guide', locale, page);

    if (!doc) {
      return `<open-layout locale="${locale}" ...><div class="container"><h1>404</h1>Page not found: ${page}</div></open-layout>`;
    }

    if (doc.frontmatter?.style) {
      routeSheet.replaceSync(doc.frontmatter.style);
    }

    const navHtml = (doc.navPrev || doc.navNext) ? `
      <div class="nav-row">
        ${doc.navPrev ? `<a href="/${locale}/guide/${doc.navPrev.path}" class="nav-link">&larr; ${doc.navPrev.label}</a>` : ''}
        ${doc.navNext ? `<a href="/${locale}/guide/${doc.navNext.path}" class="nav-link">${doc.navNext.label} &rarr;</a>` : ''}
      </div>` : '';

    return `
      <open-layout
        locale="${locale}"
        locales='["en","zh"]'
        nav-items='${JSON.stringify(navSections)}'
        header-nav='${JSON.stringify(headerNav)}'
        current-path="/${locale}/guide/${page}"
      >
        <div class="content-grid">
          <div class="container">
            <h1>${doc.frontmatter.title}</h1>
            ${doc.frontmatter.excerpt ? `<p class="subtitle">${doc.frontmatter.excerpt}</p>` : ''}
            <div class="markdown-content">${doc.html}</div>
            ${navHtml}
          </div>
          <less-toc></less-toc>
        </div>
      </open-layout>
    `;
  }
});

export default class GuidePage extends DsdElement {};
export const tagName = 'page-guide';
````
