# SOP-002: Entry Renderer 清理 — 不再生成 virtual: 代码

> **Priority**: P0 | **预估**: 3h | **依赖**: SOP-001 | **ADR**: ADR-0061

## Objective

`entry-renderer.ts` 生成的 SSR 入口代码不再包含 `virtual:less-blog-data` 和 `virtual:less-i18n-data` 导入。改用 `@lessjs/content/blog-data` 和 `@lessjs/i18n/data`。

## Background

当前 `entry-renderer.ts` 在 `renderGeneratedExports()` 中生成：

```ts
lines.push('export { posts, getPostBySlug, getBlogOptions } from "virtual:less-blog-data"');
lines.push('export { locales, getDefaultLocale, getI18nOptions } from "virtual:less-i18n-data"');
```

这导致生成的 SSR 入口文件依赖 Vite 虚拟模块，build-ssg.ts 在 import SSR bundle 时需等待 Vite 解析这些模块。

## Step 1: 修改 entry-renderer 生成代码 (1h)

**文件**: `packages/adapter-vite/src/entry-renderer.ts`

```diff
- lines.push('export { posts, getPostBySlug, getBlogOptions } from "virtual:less-blog-data"');
+ lines.push('export { posts, getPostBySlug, getBlogOptions } from "@lessjs/content/blog-data"');

- lines.push('export { locales, getDefaultLocale, getI18nOptions } from "virtual:less-i18n-data"');
+ lines.push('export { locales, getDefaultLocale, getI18nOptions } from "@lessjs/i18n/data"');
```

## Step 2: 更新 build-ssg.ts SSG 入口 (0.5h)

**文件**: `packages/adapter-vite/src/cli/build-ssg.ts`

移除 `resolveId` 中对 `virtual:less-blog-data` 和 `virtual:less-i18n-data` 的处理：

```diff
- if (id === 'virtual:less-blog-data') return '\0virtual:less-blog-data';
- if (id === 'virtual:less-i18n-data') return '\0virtual:less-i18n-data';
```

添加 alias 映射:

```typescript
resolve: {
  alias: {
    '@lessjs/content/blog-data': join(process.cwd(), 'app/data/_generated-blog-data.ts'),
    '@lessjs/i18n/data': join(process.cwd(), 'app/data/_generated-i18n-data.ts'),
  }
}
```

## Step 3: 更新 phase-context.ts (0.5h)

移除 `dispatchDataPlugin` 中的虚拟模块 handler:

```diff
- resolveId(id) {
-   if (id === VIRTUAL_BLOG_DATA_ID) return '\0' + VIRTUAL_BLOG_DATA_ID;
-   if (id === VIRTUAL_I18N_DATA_ID) return '\0' + VIRTUAL_I18N_DATA_ID;
- }
- load(id) {
-   if (id === '\0' + VIRTUAL_BLOG_DATA_ID) return blogDataModule;
-   if (id === '\0' + VIRTUAL_I18N_DATA_ID) return i18nDataModule;
- }
```

改为调用 SOP-001 的 `writeDataFiles(ctx)`。

## Step 4: 回归验证 (1h)

```bash
deno check packages/adapter-vite/src/entry-renderer.ts
deno check packages/adapter-vite/src/cli/build-ssg.ts
deno check packages/adapter-vite/src/phase-context.ts
deno test packages/adapter-vite/__tests__/entry-renderer.test.ts
deno task build:docs
deno test packages/adapter-vite/__tests__/ssg-smoke.test.ts
```

**验收**: SSG smoke test 通过，生成的 SSR 入口零 virtual: 引用。
