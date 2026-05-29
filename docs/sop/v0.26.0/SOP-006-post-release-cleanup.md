# SOP-006: Post-Release Cleanup — Dead Code Removal + Architecture Polish

> **Priority**: P1 | **预估**: 3h | **依赖**: SOP-001~005 | **来源**: 全盘架构审计

## Objective

全盘审计发现 8 项需要清理的问题。完成后代码库达到 "A" 级清洁度。

## Step 1: 死代码移除 (0.5h)

### 1.1 删除 VIRTUAL_PAGE_DATA_ID

**文件**: `packages/protocols/src/virtual-ids.ts`

移除行：

```diff
- export const VIRTUAL_PAGE_DATA_ID = 'virtual:less-page-data';
- export const RESOLVED_PAGE_DATA_ID = '\0' + VIRTUAL_PAGE_DATA_ID;
```

### 1.2 删除重复的 virtual:less-nav 处理程序

**文件**: `packages/adapter-vite/src/cli/build-ssg.ts`

移除 `less:ssg-virtual-nav` 插件（第 544-557 行），因为 `content/src/index.ts` 的 `virtualNavPlugin` 提供了相同的逻辑。

## Step 2: 统一空数据存根 (1h)

### 2.1 创建共享存根模块

**文件**: `packages/adapter-vite/src/ssr-data-stubs.ts`（新建）

```ts
export const EMPTY_BLOG_DATA = [
  'export const posts = [];',
  'export function getPostBySlug() { return undefined; }',
  'export function getBlogOptions() { return {}; }',
].join('\n');

export const EMPTY_I18N_DATA = [
  'export const locales = [];',
  'export function getDefaultLocale() { return "en"; }',
  'export function getI18nOptions() { return null; }',
].join('\n');
```

### 2.2 替换所有内联 stub

以下文件改用 `EMPTY_BLOG_DATA` / `EMPTY_I18N_DATA`：

- `packages/adapter-vite/src/cli/build-ssg.ts`
- `packages/content/src/blog-data-plugin.ts`
- `packages/i18n/src/i18n-data-plugin.ts`

## Step 3: 命名修正 (0.5h)

### 3.1 snake_case → camelCase

**文件**: `packages/core/src/render-dsd.ts`

```diff
- function renderEnd_timeFallback()
+ function renderEndTimeFallback()
```

更新所有调用处。

### 3.2 统一 tagName 提取逻辑

`island-transform.ts` 的 `fileToTagName` 改用 `route-scanner.ts` 的实现，或提取为共享工具。

## Step 4: 弃用清理 (0.5h)

### 4.1 HydrateEventDescriptor

**文件**: `packages/core/src/types.ts`, `packages/compat-check/src/types.ts`

更新 `@deprecated` 注释：不是"v0.21.0 移除"，而是说明实际状态（仍被 adapter 使用，计划 v0.27 迁移）。

### 4.2 DANGEROUS_KEYS

标记为 `@internal`，不在公共 API 文档中展示。

## Step 5: 回归验证 (0.5h)

```bash
deno fmt && deno lint && deno task typecheck
deno test --allow-read --allow-write --allow-env --allow-net --allow-run
deno task build:docs
```

**验收**: 全部门禁绿色，审计发现 8 项全部解决。
