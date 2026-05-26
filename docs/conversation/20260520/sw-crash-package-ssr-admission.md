# SW Fetch Crash + Package Island SSR Admission + Nested DSD

**问题**: 部署站点 Service Worker 抛 `Failed to fetch` + header/footer 样式完全丢失
**日期**: 2026-05-16
**状态**: ✅ 已修复

## 问题描述

部署后 `dev.lessjs.pages.dev` 首页出现三类错误：

1. **`Failed to load resource: the server responded with a status of 400`**
2. **`sw.js:19 Uncaught (in promise) TypeError: Failed to fetch`** — SW 网络请求失败
3. **Header / Footer 样式完全丢失** — 页面顶部出现纯文字 `<a href="/">` 锚点，无任何样式

## 排查过程

### 第一步：确认线上代码是否包含修复

对比线上 JS 文件名 hash：

- **线上**: `island-media-chrome-showcase-DjdF7uaP.js`
- **本地**: `Island-media-chrome-showcase-SPujsrd2.js`

文件名 hash 不同 → Cloudflare Pages 部署了不同版本。线上版本已包含之前的 `connectedCallback` 无限递归修复。但用户报告的错误文件名是 `island-media-chrome-showcase-C1R0XQuU.js` — 说明浏览器**还在使用缓存的旧 SW**。

### 第二步：确认 SW 崩溃原因

SW 代码（`ssg-render.ts` 生成的 `sw.js`）：

```js
// Bug: no catch for navigate requests
e.respondWith(
  (isAsset ? cacheFirst(e.request) : fetch(e.request))
    .catch(() => fetch(e.request))  // catch 里也 fetch，同样可能失败
);

// cacheFirst 也没有 try/catch
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);  // ← 没 try/catch
  ...
}
```

当用户访问的 Cloudflare Pages 预览部署 URL（如 `aad0fe18.lessjs.pages.dev`）已过期时，所有 fetch 都失败 → 未捕获 promise rejection → `sw.js:19 TypeError: Failed to fetch`。

### 第三步：确认 `less-layout` 没有 DSD 模板

线上 SSG HTML 中：

```html
<docs-home>
  <template shadowrootmode="open">
    ...
    <less-layout locale="en" version-info="v0.17.4">
      <!-- 这里没有 template shadowrootmode="open"！ -->
      ...
    </less-layout>
    ...
  </template>
</docs-home>
```

`less-layout` 在 `docs-home` 的 DSD shadow DOM 内部，但**它自己没有 DSD 模板**。`less-layout` 是 Lit 组件，样式全部在 Shadow DOM 内部。JS 一旦崩溃（如 SW 提供了旧版 JS → 无限递归），`less-layout` 无法升级 → 没有 Shadow DOM → 没有样式 → header/footer 完全裸奔。

### 第四步：定位 `less-layout` 没有 DSD 的根因

**根因 1 — Package Island SSR 被"一刀切"**：

`buildSsrAdmissionPlan()` 将所有 `source === 'package'` 的 island 标记为 `client-only`：

```ts
else if (source === 'package') {
  renderPath = 'client-only';
  reason = island.ssr === true
    ? 'package SSR import is deferred until v0.18 admission validation'
    : 'package island has no validated SSR capability';
}
```

即使 `@lessjs/ui/less-layout` 在 manifest 中声明了 `ssr: true`，也被排除在 SSR 之外。

**根因 2 — `isInsideDsdTemplate()` 阻止嵌套 DSD**：

`render-nested.ts` 的 `isInsideDsdTemplate()` 函数跳过所有在 `<template shadowrootmode="open">` 内部的 CE，认为这些是"已经渲染过的输出"。但 `less-layout` 在 `docs-home` 的 DSD template 内部，自己却**没有 DSD 模板**（因为根的根的因 1），所以被跳过后就永远没有 DSD 了。

## 修复方案

### 1. SW 缓存健壮性

```
Navigate 请求:           bare fetch(e.request)  →  networkFirst + offline fallback (408)
Asset 请求 (cacheFirst): fetch() 无 try/catch   →  包 try/catch，失败返回 408
非 asset / 非 navigate:  SW 拦截                →  放行
```

### 2. Package Island SSR Admission

```ts
// Before — package islands 全部 client-only
source === 'package' → client-only

// After — 信任 manifest 中 ssr: true 的 package islands
source === 'package'
  ? island.ssr === true ? 'ssr+client' : 'client-only'
```

### 3. 删除 `isInsideDsdTemplate()` 检查

删除 `render-nested.ts` 中 `isInsideDsdTemplate()` 的判断逻辑。已有的 `elementAlreadyHasDSD()` 检查足以正确处理已有 DSD 模板的 CE，不需要额外的 guard。

## 验证结果

| 检查项                        | 结果                                                     |
| ----------------------------- | -------------------------------------------------------- |
| `less-layout` 是否有 DSD 模板 | ✅ 是 — line 422 `<template shadowrootmode="open">` 出现 |
| 每页 DSD 模板数量             | ✅ 从 9 个增加到 13 个                                   |
| SW networkFirst fallback      | ✅ navigate 失败返回 408 而非抛异常                      |
| SW cacheFirst try/catch       | ✅ asset fetch 失败优雅降级                              |
| `deno task test`              | ✅ 554 passed                                            |
| `deno task build`             | ✅ 298 pages, 0 errors                                   |
| `deno task dev`               | ✅ 首页正常渲染                                          |

## 关键教训

1. **保守策略需要例外通道**：`ssr: true` 的 package islands 不应被"一刀切"为 client-only。manifest 元数据应被信任，推翻它需要明确理由而非默认行为。
2. **DSD 嵌套是合法的**：一个组件的 shadow DOM 里可以包含另一个带 DSD 的组件。`isInsideDsdTemplate()` 的假设"在 template 内的都是已渲染输出"是错误的。
3. **SW 代码必须假设网络不可靠**：所有 `fetch()` 调用都需要 try/catch，包括 catch 内部。`respondWith()` 里的 Promise 必须不会抛出。
4. **文件名 hash 是调试的关键线索**：对比线上/本地的 hash 可以快速判断部署版本是否正确，以及浏览器是否使用了缓存。
5. **系统性地追踪外层问题**：400 错误 → SW 崩溃 → JS 不执行 → layout 不升级 → 样式丢失。每层问题看似独立，但实际是因果链条。

## 修改文件

| 文件                                                     | 修改内容                                            |
| -------------------------------------------------------- | --------------------------------------------------- |
| `packages/adapter-vite/src/cli/ssg-render.ts`            | SW networkFirst + cacheFirst try/catch + 非资产放行 |
| `packages/adapter-vite/src/entry-descriptor.ts`          | Package island SSR admission 尊重 `ssr: true`       |
| `packages/core/src/render-nested.ts`                     | 删除 `isInsideDsdTemplate()`                        |
| `packages/adapter-vite/__tests__/entry-renderer.test.ts` | 更新 package island SSR 测试断言                    |
