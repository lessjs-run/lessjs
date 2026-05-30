# SOP-003: @lessjs/router — Hono + URLPattern Unified Routing

**Target**: v0.27.0\
**ADR**: [ADR-0063](./ADR-0063-unified-router-hono-urlpattern.md)\
**Status**: Proposed

## Phase 1: Infrastructure (v0.27.0-alpha)

### Task 1.1: Create `packages/router`

```bash
packages/router/
  deno.json                        # name: @lessjs/router, exports: ./mod.ts
  src/
    mod.ts                         # re-exports
    define-routes.ts               # RouteConfig type + defineRoutes()
    pattern-translate.ts           # toHono() + toURLPattern()
    client-router.ts               # URLPattern-based SPA handler
    page-loader.ts                 # MD file loader (gray-matter + marked)
```

### Task 1.2: `defineRoutes()` API

```ts
// packages/router/src/define-routes.ts
export interface RouteConfig {
  pattern: string;
  component: () => Promise<{ default: CustomElementConstructor }>;
  meta?: RouteMeta;
}

export interface RouteMeta {
  section?: string;
  label?: string;
  order?: number;
  dynamic?: boolean;
}

export function defineRoutes(routes: RouteConfig[]): RouteConfig[] {
  return routes;
}
```

### Task 1.3: Pattern Translation

```ts
// packages/router/src/pattern-translate.ts
export function toHono(pattern: string): string {
  // URLPattern regex: (\\d+) → Hono regex: {\\d+}
  return pattern.replace(/\(([^)]+)\)/g, '{$1}');
}

export function toURLPattern(pattern: string): string {
  return pattern; // Named params + optional segments are identical
}
```

### Task 1.4: `page-loader.ts` — MD Content Loader

```ts
// packages/router/src/page-loader.ts
import matter from 'gray-matter';
import { marked } from 'marked';

export interface PageData {
  html: string;
  meta: {
    title: string;
    section: string;
    label: string;
    order?: number;
    excerpt?: string;
  };
}

export async function loadPage(
  contentDir: string,
  locale: string,
  page: string,
): Promise<PageData | null> {
  try {
    const raw = await Deno.readTextFile(
      `${contentDir}/${locale}/${page}.md`,
    );
    const { data, content } = matter(raw);
    const html = await marked(content);
    return { html, meta: data as PageData['meta'] };
  } catch {
    return null;
  }
}
```

## Phase 2: Client Routing (v0.27.0-beta)

### Task 2.1: URLPattern-based Locale + Path Extraction

Replace in `less-layout.tsx`:

```ts
// BEFORE (~15 lines)
private _locale(): string { ... }
private _locales(): string[] { ... }
private _currentPath(): string { ... }

// AFTER (~6 lines)
private _routeParams(): { locale: string; path: string } {
  const pattern = new URLPattern({ pathname: '/:locale?/:page*' });
  const m = pattern.exec(location.pathname)?.pathname?.groups;
  return {
    locale: m?.locale || this._locales[0] || 'en',
    path: '/' + (m?.page || ''),
  };
}
```

### Task 2.2: Replace `_otherLocalePath()` + `_localizePath()`

```ts
// BEFORE (~20 lines)
private _otherLocalePath(): string { /* string slice + join */ }
private _localizePath(path: string): string { /* prefix concat */ }

// AFTER (~8 lines)
private _switchLocale(): void {
  const { locale, path } = this._routeParams();
  const target = this._locales.find(l => l !== locale) || this._locales[0];
  const url = `/${target}${path}`;
  // Use Navigation API or window.location
}
```

### Task 2.3: Delete `navigation.ts`

`navigation.ts` (~158 lines) — 完全被 `client-router.ts` 的 URLPattern + Navigation API 替代。

### Task 2.4: SPA Handler

```ts
// packages/router/src/client-router.ts
export function setupClientRouter(
  routes: RouteConfig[],
  onNavigate: (params: Record<string, string>) => void,
): AbortController {
  const ac = new AbortController();
  navigation.addEventListener('navigate', (e) => {
    const url = new URL(e.destination.url);
    for (const route of routes) {
      const pattern = new URLPattern({ pathname: route.pattern });
      const m = pattern.exec(url.pathname);
      if (m) {
        e.intercept({ handler: () => onNavigate(m.pathname.groups) });
        return;
      }
    }
  }, { signal: ac.signal });
  return ac;
}
```

## Phase 3: Content Migration (v0.27.0-rc)

### Task 3.1: MD Content Directory

```
www/content/
  guide/
    en/
      getting-started.md
      core-concepts.md
      routing-and-data.md
      islands-and-ssr.md
      api.md
      deployment.md
      configuration.md
      error-handling.md
      testing.md
    zh/
      (same files, Chinese content)
  architecture/
    en/
      architecture.md
      comparison.md
      dsd.md
      islands.md
      islands-deep.md
      package-compatibility.md
      standards-registry.md
      benchmark.md
    zh/
      (same files, Chinese content)
```

### Task 3.2: Thin TSX Loader

```tsx
// www/app/routes/guide/[page].tsx (~60 lines)
import { DsdElement } from '@lessjs/core';
import { pageStyles } from '../../components/page-styles.js';
import { loadPage, openPropsTokenSheet, PATTERN } from '@lessjs/router';
import '@lessjs/ui/less-layout';

export default class GuidePage extends DsdElement {
  static styles = [openPropsTokenSheet];

  override async render() {
    const pattern = new URLPattern({ pathname: PATTERN });
    const { locale, page } = pattern.exec(this._currentUrl())
      ?.pathname?.groups ?? {};

    const data = await loadPage('www/content/guide', locale, page);
    if (!data) return '<less-layout><h1>404</h1></less-layout>';

    return `
      <less-layout locale="${locale}" current-path="/${locale}/guide/${page}">
        <div class="container">
          <h1>${data.meta.title}</h1>
          ${data.html}
        </div>
      </less-layout>`;
  }
}
```

### Task 3.3: SSG Integration

`ssg-render.ts` 新增 content-driven 路径发现：

```ts
// Walk content directory, generate all locale × page combinations
async function discoverContentPaths(
  contentDir: string,
  locales: string[],
): Promise<string[]> {
  const paths: string[] = [];
  for (const locale of locales) {
    for await (const entry of Deno.readDir(`${contentDir}/${locale}`)) {
      if (entry.name.endsWith('.md')) {
        const page = entry.name.replace('.md', '');
        paths.push(`/${locale}/guide/${page}`);
      }
    }
  }
  return paths;
}
```

### Task 3.4: Nav Scanner from MD Frontmatter

```ts
// packages/router/src/nav-scanner.ts
export async function scanNavFromContent(
  contentDir: string,
): Promise<NavSection[]> {
  const sections: Record<string, NavItem[]> = {};

  for (const locale of ['en', 'zh']) {
    for await (const entry of Deno.readDir(`${contentDir}/${locale}`)) {
      const raw = await Deno.readTextFile(`${contentDir}/${locale}/${entry.name}`);
      const { data } = matter(raw);
      const section = data.section || 'Uncategorized';
      if (!sections[section]) sections[section] = [];
      sections[section].push({
        path: `/${locale}/guide/${entry.name.replace('.md', '')}`,
        label: data.label || data.title,
        order: data.order || 99,
      });
    }
  }
  return sections;
}
```

## Phase 4: Cleanup (v0.28.0)

### Task 4.1: Remove old route files

- 删除 17 个 guide/architecture TSX 文件
- 删除 `route-scanner.ts` 中的文件系统路由发现
- 删除 `_renderEn()`/`_renderZh()` 模式

### Task 4.2: Full Programmatic Routes

```ts
// www/app/routes.ts
export const routes = defineRoutes([
  {
    pattern: '/:locale?/guide/:page',
    component: () => import('./routes/guide/[page].tsx'),
  },
  {
    pattern: '/:locale?/architecture/:page',
    component: () => import('./routes/architecture/[page].tsx'),
  },
  {
    pattern: '/:locale?/blog/:slug',
    component: () => import('./routes/blog/[slug].tsx'),
  },
]);
```

## Verification Checklist

- [ ] Build: `deno task build` passes
- [ ] SSR: All locale×page combinations generate
- [ ] SPA: Client navigation uses URLPattern, no manual string ops
- [ ] Locale switch: EN↔ZH label updates correctly
- [ ] Nav: Sidebar populated from MD frontmatter
- [ ] Dynamic params: `:page` extracts correctly from URL
- [ ] 404: Unknown pages return proper 404
- [ ] Budget: No new JS budget violations
- [ ] Firefox: URLPattern polyfill loads conditionally

## Line Count Impact

| File                             | Before    | After          | Delta     |
| -------------------------------- | --------- | -------------- | --------- |
| `less-layout.tsx` route logic    | ~285      | ~40            | -245      |
| `navigation.ts`                  | ~158      | 0              | -158      |
| `ssg-render.ts` locale loop      | ~175      | ~40            | -135      |
| `route-scanner.ts`               | ~125      | ~85            | -40       |
| `entry-renderer.ts`              | ~90       | ~60            | -30       |
| 17 route files                   | ~5000     | ~300 (3 files) | -4700     |
| **New**: `@lessjs/router`        | 0         | ~190           | +190      |
| **New**: `www/content/` MD files | 0         | ~2000          | +2000     |
| **Net**                          | **~5833** | **~2715**      | **-3118** |
