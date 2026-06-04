# ADR-0063: Unified Router — Hono + URLPattern + Content-Driven SSG

**Status**: Proposed\
**Date**: 2026-05-30\
**Target**: v0.27.0\
**Depends on**: ADR-0062 (DSD-First RDOM Signal Architecture)

## Context

LessJS 当前路由栈有三套独立系统：

1. **Hono** (SSR) — 服务端渲染路由
2. **手动字符串操作** (less-layout.tsx, ~285 行) — 客户端 SPA 导航 + locale 处理
3. **Vite scanner** (route-scanner.ts) — 文件系统路由发现

三套系统互不知晓，导致：locale prefix 处理重复 4 处、`startsWith()` 路径匹配脆弱、SSG locale 循环与客户端 locale 处理脱钩、路由文件命名约定 (`[slug].tsx`) 与程序化路由不一致。

## Research Summary

7 框架对比（Next.js, Astro, Fresh, Remix, Hono, TanStack Router, URLPattern）：

| 发现                                | 结论                                                     |
| ----------------------------------- | -------------------------------------------------------- |
| Hono 不支持 URLPattern              | 需要适配层转换模式语法                                   |
| URLPattern 是 Baseline 2025         | 客户端可原生使用，Firefox 142+                           |
| Hono 模式语法与 URLPattern 基本兼容 | 正则定界符不同 (Hono `{}` vs URLPattern `()`)            |
| 所有主流框架都分离 SSR/CSR 路由     | 统一 route definition → 编译为两端代码                   |
| Astro Content Collections 模式      | MD frontmatter → 路由元数据                              |
| 当前可删除 ~703 行                  | `less-layout` 285 + `navigation.ts` 158 + SSG 175 + 其他 |

## Decision

### 1. Unified Route Definition

```ts
// packages/router/src/define-routes.ts
export interface RouteConfig {
  pattern: string; // '/:locale?/guide/:page'
  component: () => Promise<{ default: CustomElementConstructor }>;
  meta?: RouteMeta;
}

export function defineRoutes(routes: RouteConfig[]): RouteConfig[] {
  return routes;
}
```

### 2. Adapter Layer — Pattern Translation

```
RouteConfig.pattern
  ├─ toHono(pattern)    → Hono RegExpRouter format
  │   /:locale?/guide/:page → /:locale?/guide/:page (same!)
  │   /blog/:slug        → /blog/:slug              (same!)
  │   regex: Hono {XXX} ← URLPattern (XXX)           (different!)
  └─ toURLPattern(pattern) → URLPattern format
      same as above, but regex delimiters differ
```

**Decision**: 优先使用简单命名参数模式（两者兼容），正则约束仅必要时使用适配层。

### 3. Client Routing — Replace less-layout Manual Logic

当前 `less-layout.tsx` 中的 ~285 行手动路径处理：

```diff
- _locale()          → getAttribute parse
- _locales()         → JSON.parse attributes
- _otherLocalePath() → string split + slice + join
- _localizePath()    → string concat
- _filterByPath()    → startsWith loop
- _currentPath()     → getAttribute fallback chain
+ const pattern = new URLPattern({ pathname: '/:locale?/:section/:page?' });
+ const { locale, section, page } = pattern.exec(location.pathname)?.pathname.groups ?? {};
```

### 4. Content-Driven SSG

Guide/architecture 页面从 TSX hard-coded → MD files + thin loaders：

```
Before: www/app/routes/guide/getting-started.tsx (~300 lines, EN+ZH inline)
After:  www/content/guide/en/getting-started.md
        www/content/guide/zh/getting-started.md
        www/app/routes/guide/[page].tsx (~60 lines thin loader)
```

**Navigation metadata**: 从 MD frontmatter 扫描，替代 `export const meta = {...}` 硬编码：

```yaml
# getting-started.md
---
title: Getting Started
section: Quick Start
label: Getting Started
order: 1
---
# Getting Started
...
```

### 5. File-system → Programmatic Routes（渐进）

| 阶段          | 路由发现方式                                |
| ------------- | ------------------------------------------- |
| v0.27.0-alpha | 文件系统（现状）+ Hono route 定义（新）并存 |
| v0.27.0-beta  | 新增 MD content 路由，旧 TSX 路由保持       |
| v0.28.0       | 完全迁移到 programmatic + content-driven    |

### 6. Migration Plan

```
Phase 1 (v0.27.0-alpha): Infrastructure
  - packages/router 包创建
  - defineRoutes() + toHono() + toURLPattern()
  - Vite plugin: MD content loader

Phase 2 (v0.27.0-beta): Client Routing
  - URLPattern 替换 less-layout 手动 locale/path 逻辑
  - navigation.ts → 基于 URLPattern 的 SPA handler
  - less-layout: -285 行

Phase 3 (v0.27.0-rc): Content Migration
  - Guide pages → MD + thin TSX loader
  - Architecture pages → MD + thin TSX loader
  - Route files: 17 → 3 (guide, architecture, reference)
  - LOC: ~5000 → ~300

Phase 4 (v0.28.0): Full Router
  - Programmatic route definitions
  - Dynamic params across all routes
  - Remove file-system route scanning
```

## Consequences

### Positive

- **-700+ 行手写路由逻辑**，替换为标准 API
- **统一路由定义**，SSR 和 CSR 共享
- **动态路由参数**，不再依赖文件命名约定
- **MD + frontmatter** 替代 TSX hard-coded 内容
- **URLPattern** 浏览器原生，零依赖

### Negative

- URLPattern Firefox 142+（2026年2月），旧版需 polyfill (~16KB)
- Hono 和 URLPattern 正则语法不兼容，需适配层
- 迁移期间双轨运行，增加复杂度

### Neutral

- SSG 仍需文件系统扫描或 Hono route 遍历
- 现有 `[slug].tsx` 约定保留至 v0.28.0
- `@openelement/router` 不超过 200 行核心代码

## Package Weight

| 组件             | 行数     | 依赖                           |
| ---------------- | -------- | ------------------------------ |
| `defineRoutes()` | ~40      | 无                             |
| `toHono()`       | ~30      | 无 (字符串转换)                |
| `toURLPattern()` | ~30      | 无 (字符串转换)                |
| `loadPage()`     | ~40      | gray-matter + marked           |
| Vite plugin      | ~50      | Vite API                       |
| **总计**         | **~190** | **gray-matter, marked (已有)** |
