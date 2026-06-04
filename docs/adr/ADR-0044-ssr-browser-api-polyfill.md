# ADR-0044: SSR 浏览器 API Polyfill 策略

> **Status**: PROPOSED
> **Date**: 2026-05-25
> **Applies to**: v0.21.x → v0.22.0
> **Extends**: ADR-0028 (Universal SSR via DOM Simulation)
> **Supersedes**: ADR-0028 中分散的 polyfill 策略

## Context

Web Component 代码在模块顶层执行 `customElements.define()`、`class Foo extends HTMLElement`、`new CSSStyleSheet()` 等浏览器 API。SSG/SSR 构建环境（Node.js via Vite）和运行时（Deno）不提供这些浏览器原生 API。

当前处理方式：

- **CSSStyleSheet**：在 SSG entry code 顶部 `import { StyleSheet } from '@openelement/core'` 后手动 shim（`build-ssg.ts` L274-280）
- **HTMLElement**：通过 `@openelement/core/dsd-element.ts` 的 `_SsrHTMLElementStub` 自包含（[SOP-016]）
- **customElements**：**未处理** — 这是当前导致 SSR 崩溃的直接原因

问题表现：

```ts
// app/islands/my-counter.ts
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, MyCounter); // ← customElements is undefined in SSR
}
```

在 SSR 环境中，`typeof customElements === 'undefined'` → 条件跳过，但某些 Web Component 库（如第三方 Lit 组件）在模块顶层无条件调用 `customElements.define()`，导致 `ReferenceError: customElements is not defined`。

## Decision

**SSG entry code 统一提供浏览器 API polyfill，在模块图加载前注入。Polyfill 顺序按依赖关系排列：CSSStyleSheet → HTMLElement → customElements。**

### Polyfill 清单

| API              | Polyfill 来源                           | 注入位置                  | 必要性                                         |
| ---------------- | --------------------------------------- | ------------------------- | ---------------------------------------------- |
| `customElements` | Map-backed shim（[SOP-016]）            | `output.banner`           | `customElements.define()` 在模块顶层调用       |
| `HTMLElement`    | `@openelement/core` 自包含（[SOP-016]） | `dsd-element.ts` 模块求值 | `class Foo extends HTMLElement` 在模块顶层执行 |
| `CSSStyleSheet`  | `@openelement/core` StyleSheet          | SSG entry code 顶部       | Lit 内部引用 CSSStyleSheet，模块顶层即需       |
| `document`       | happy-dom（已有）                       | ssgRender 阶段            | DOM 操作在渲染时发生                           |
| `window`         | happy-dom（已有）                       | ssgRender 阶段            | 组件的 connectedCallback 可能访问              |

[SOP-016]: ../sop/v0.21.x/SOP-016-ssr-htmlelement-self-contained.md

### 注入机制

polyfill 按执行顺序分三层（[SOP-016]）：

1. **Layer 1 — `output.banner`：customElements（Map-backed）**
   - 最先执行，确保任何 `customElements.define()` 调用在模块图求值前可用
   - `define()` 存入 Map，`get()` 从 Map 取出 — `renderDSDByName()` 依赖此行为
   - 见 `packages/adapter-vite/src/cli/build-ssg.ts`

2. **Layer 2 — `@openelement/core/dsd-element.ts`：HTMLElement（自包含 stub）**
   - `_SsrHTMLElementStub` 提供 6 个成员
   - 在 `typeof HTMLElement === 'undefined'` 时赋值到 `globalThis.HTMLElement`
   - `@openelement/core` 不再依赖 `@lit-labs/ssr-dom-shim`

3. **Layer 3 — SSG entry code：CSSStyleSheet**
   - `import { StyleSheet } from '@openelement/core'` 后在 entry code body 中 polyfill
   - 见 `packages/adapter-vite/src/ssr-polyfills.ts`

````
### 构建集成

在 `build-ssg.ts` 的 SSG entry code 生成阶段，polyfill banner 作为 entry code 的第一部分：

```ts
const rawSsgEntryCode = generateSsrPolyfillBanner() + '\n' + generateHonoEntryCode(routes, {...});
````

替代原来分散在 entry code 和 output banner 中的 polyfill 代码。

## SSG Entry Code 结构

```
┌────────────────────────────────────────────┐
│ SSG Entry Code (virtual:less-ssg-entry)     │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ 1. SSR Polyfill Banner               │   │
│ │    ├── CSSStyleSheet shim            │   │
│ │    ├── HTMLElement shim              │   │
│ │    └── customElements shim           │   │
│ └──────────────────────────────────────┘   │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ 2. Hono Entry Code                   │   │
│ │    ├── @openelement/core imports          │   │
│ │    ├── @openelement/adapter-lit imports   │   │
│ │    ├── Route component imports       │   │
│ │    └── Hono app creation             │   │
│ └──────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

Polyfill banner 通过 Vite virtual module 机制作为 entry code 的静态前缀注入。Rolldown 将其与业务代码一起打包，但 polyfill 的副作用（在 `globalThis` 上设置属性）保证在所有其他模块加载前执行。

## HTMLElement 自包含策略

[SOP-016] 将 HTMLElement polyfill 从 `@lit-labs/ssr-dom-shim` 迁移到 `@openelement/core/dsd-element.ts` 自包含：

1. **`@openelement/core` 自包含**：拥有 `DsdElement` 的包必须自己提供 SSR-safe 的 HTMLElement 基类
2. **最小 stub**：`_SsrHTMLElementStub` 只提供内部代码实际调用的 6 个方法
3. **去除外部依赖**：不再依赖 `@lit-labs/ssr-dom-shim` 用于核心 SSR 功能

## Consequences

### Positive

- **消除 customElements undefined 错误**：Map-backed polyfill 使 `define()`/`get()` 真正工作
- **消除 DSD 渲染空白**：HTMLElement stub 提供组件 render() 所需的最小 DOM 方法
- **`@openelement/core` 自包含**：不再依赖 `@lit-labs/ssr-dom-shim` 用于核心 SSR
- **最小表面**：stub 只包含 6 个成员，不模拟完整 DOM

### Negative

- **HTMLElement stub 是最小实现**：仅提供 SSR render() 内部使用的 6 个方法，不支持完整 DOM 行为。实际 DOM 操作由 happy-dom 在 ssgRender 阶段提供
- **customElements shim 轻量级**：不支持完整的 Custom Elements 生命周期（`attributeChangedCallback` 等），仅支持 `define()`/`get()` 注册
- **模块顶层副作用**：polyfill 在模块顶层修改 `globalThis`

### Neutral

- **不影响客户端代码**：polyfill 仅在 SSR bundle 中生效
- **不改变组件编写方式**：组件代码中的 `customElements.define()` 调用保持不变

## Related

- ADR-0028: Universal SSR via DOM Simulation
- ADR-0029: Happy-DOM for DOM Simulation
- ADR-0042: Import Map as Universal Resolution Layer
- ADR-0045: Native API First-Class Citizen Strategy
