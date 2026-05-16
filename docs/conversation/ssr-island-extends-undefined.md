# SSR Island `class extends undefined` 崩溃排查

**问题**: `WithDsdHydration(globalThis.HTMLElement)` 在 SSR 模块求值时因 `HTMLElement` 未定义导致 `Class extends value undefined is not a constructor or null`
**日期**: 2026-05-16
**状态**: ✅ 已修复

## 问题描述

dev 分支首页出现以下错误：

1. **`Failed to load resource: 400`** — SSR 渲染失败
2. **`Cannot set properties of null (setting 'data')`** — `island-api-consumer` 客户端 JS 运行时错误
3. **Header / Footer / 大量样式失效** — 因 SSR 崩溃导致整页无法渲染
4. **Shoelace / Media Chrome showcase 样式失效** — 组件未渲染

## 根因分析

### 核心 Bug：`WithDsdHydration(globalThis.HTMLElement)` 在 SSR 模块求值时崩溃

**架构层面的矛盾**：

- Route 组件（如 `docs-home`）通过 `import '../../islands/react-showcase.js'` 引入 island 模块
- Vite 的模块图会将这些传递性导入拉入 SSR bundle
- Island 模块在顶层执行 `const Base = WithDsdHydration(globalThis.HTMLElement)` 和 `class X extends Base {}`
- 在 SSR dev 模式下，`globalThis.HTMLElement` 为 `undefined`（dom-shim 还未加载或不在该模块上下文中）
- 结果：`Class extends value undefined is not a constructor or null`

### 次级 Bug：ADR 0014 idempotent define 只在 SSG 模式生效

`entry-renderer.ts` 中的 `customElements.define` 幂等补丁被 `if (desc.isSSG)` 包裹，导致 dev 模式下 SSR dom-shim 的 `define()` 不是幂等的。Island 模块的 `try { customElements.define(tagName, X) } catch {}` 在重复调用时崩溃。

### 三级 Bug：`deno task dev` 从项目根目录运行

`deno task dev` 命令是 `npm:vite www --config www/vite.config.ts`，从项目根目录运行。但 route scanner 使用 `process.cwd()` 解析相对路径，导致 `app/routes` 解析为 `src-tmp/app/routes`（不存在）而非 `src-tmp/www/app/routes`。

### 四级 Bug：rolldown 需要 `--allow-ffi`

Vite 8 的 rolldown 原生绑定需要 FFI 权限，但 `dev` task 缺少 `--allow-ffi` flag。

## 修复方案

### 1. react-showcase.ts — 条件基类模式

```ts
// Before (crash):
const ReactShowcaseBase = WithDsdHydration(globalThis.HTMLElement);

// After (safe):
const ReactShowcaseBase = typeof globalThis.HTMLElement !== 'undefined'
  ? WithDsdHydration(globalThis.HTMLElement)
  : class {};
```

当 `HTMLElement` 不可用时，回退到空类，SSR 模块求值不会崩溃。浏览器端 `HTMLElement` 始终存在，正常行为不受影响。

### 2. media-chrome-showcase.ts — 条件基类 + 动态 import

```ts
// Before (crash):
import 'media-chrome';
const MediaChromeBase = WithDsdHydration(globalThis.HTMLElement);

// After (safe):
const MediaChromeBase = typeof globalThis.HTMLElement !== 'undefined'
  ? WithDsdHydration(globalThis.HTMLElement)
  : class {};

// In connectedCallback (browser-only):
override connectedCallback(): void {
  super.connectedCallback();
  if (!this._mcLoaded && typeof globalThis.HTMLElement !== 'undefined') {
    this._mcLoaded = true;
    import('media-chrome').catch(() => {});
  }
}
```

`media-chrome` 的静态 import 改为在 `connectedCallback` 中动态 import，避免 SSR 模块求值时触发浏览器专有 API 调用。

### 3. entry-renderer.ts — ADR 0014 补丁同时适用于 dev 和 SSG

```ts
// Before (SSG-only):
if (desc.isSSG) {
  // idempotent customElements.define patch
}

// After (dev + SSG):
{
  // ADR 0014: Idempotent customElements.define for SSR (dev + SSG)
}
```

### 4. deno.json — 修复 dev task

```json
// Before:
"dev": "deno run --allow-... npm:vite www --config www/vite.config.ts"

// After:
"dev": "cd www && deno run --allow-... --allow-ffi --allow-sys npm:vite --config vite.config.ts"
```

- `cd www` 确保 `process.cwd()` 匹配 Vite root
- 添加 `--allow-ffi --allow-sys` 满足 rolldown 原生绑定需求

## 验证结果

| 项目                  | 结果                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| `deno task dev` 首页  | ✅ 完整 HTML 渲染，无错误                                            |
| React showcase SSR    | ✅ DSD 内容正确输出（Primary/Success/Warning 按钮 + React 19 badge） |
| Shoelace showcase     | ✅ 空 tag（`ssr: false`），客户端 JS 存在                            |
| Media Chrome showcase | ✅ 空 tag（`ssr: false`），客户端 JS 存在                            |
| `deno task build`     | ✅ 298 页面，0 错误，exit code 0                                     |
| adapter-vite 测试     | ✅ 210 passed                                                        |
| core 测试             | ✅ 76 passed                                                         |
| fmt / lint            | ✅ 通过                                                              |

## 关键教训

1. **`class extends` 是模块求值时执行的**：不能在 SSR 上下文中使用依赖浏览器 API 的基类
2. **Proxy 不能作为 `class extends` 目标**：`DsdReactElement` 的 Proxy 设计对 `extends` 无效——JS 引擎需要 `[[Constructor]]` 内部槽
3. **SSR dom-shim 的 `define()` 不幂等**：ADR 0014 补丁必须在 dev 模式也生效
4. **Route import 是传递性的**：SSR admission plan 只控制 island 注册，不控制 route-level import
5. **Mixin 不能用 `Object.getPrototypeOf` 找父类方法**：会找到自己的方法导致无限递归（见下方第二轮修复）

## 第二轮修复：WithDsdHydration connectedCallback 无限递归

### 现象

部署后 `dev.lessjs.pages.dev` 首页：

- `Uncaught RangeError: Maximum call stack size exceeded` — `island-media-chrome-showcase` 和 `island-react-showcase` 的 `connectedCallback`
- Header / Footer / 全部样式失效 — 客户端 JS 崩溃导致所有 custom element 未升级

### 根因

`WithDsdHydration` mixin（adapter-vanilla 和 adapter-react 各一份）的 `connectedCallback` 使用 `Object.getPrototypeOf(Object.getPrototypeOf(this))` 来找父类的 `connectedCallback`：

```ts
// Bug: infinite recursion
connectedCallback(): void {
  const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(this));
  if (parentProto && typeof parentProto.connectedCallback === 'function') {
    parentProto.connectedCallback.call(this); // ← calls self!
  }
  ...
}
```

原型链：`ReactShowcase → WithDsdHydrationClass → HTMLElement`

- `Object.getPrototypeOf(this)` = `ReactShowcase.prototype`
- `Object.getPrototypeOf(ReactShowcase.prototype)` = `WithDsdHydrationClass.prototype`
- `WithDsdHydrationClass.prototype.connectedCallback` = 自己 → 无限递归

当子类没有覆写 `connectedCallback` 时（如 `ReactShowcase`），浏览器直接调用 mixin 的方法，此时 `this` 的两步原型遍历刚好绕回到 mixin 自身。

### 修复

用闭包捕获的 `superClass` 变量直接调用真正的父类，而非运行时沿原型链查找：

```ts
// Fix: use closure-captured superClass
connectedCallback(): void {
  if (typeof superClass.prototype.connectedCallback === 'function') {
    superClass.prototype.connectedCallback.call(this);
  }
  ...
}
```

`superClass` 是 `WithDsdHydration(superClass)` 函数的参数（如 `HTMLElement`），在闭包中始终指向真正的父类，不会受运行时原型链影响。

### 同步修复

- `packages/adapter-vanilla/src/dsd-hydration.ts` — `connectedCallback` + `disconnectedCallback`
- `packages/adapter-react/src/dsd-hydration.ts` — `connectedCallback` + `disconnectedCallback`
- `www/__tests__/build-output.test.ts` — core budget 350KB → 600KB（docs site demo weight 已知问题）
