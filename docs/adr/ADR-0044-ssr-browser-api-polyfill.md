# ADR-0044: SSR 浏览器 API Polyfill 策略

> **Status**: PROPOSED
> **Date**: 2026-05-25
> **Applies to**: v0.21.x → v0.22.0
> **Extends**: ADR-0028 (Universal SSR via DOM Simulation)
> **Supersedes**: ADR-0028 中分散的 polyfill 策略

## Context

Web Component 代码在模块顶层执行 `customElements.define()`、`class Foo extends HTMLElement`、`new CSSStyleSheet()` 等浏览器 API。SSG/SSR 构建环境（Node.js via Vite）和运行时（Deno）不提供这些浏览器原生 API。

当前处理方式：
- **CSSStyleSheet**：在 SSG entry code 顶部 `import { StyleSheet } from '@lessjs/core'` 后手动 shim（`build-ssg.ts` L274-280）
- **HTMLElement**：通过 Rolldown output banner 注入 `@lit-labs/ssr-dom-shim` polyfill（L405-407）
- **customElements**：**未处理** — 这是当前导致 SSR 崩溃的直接原因

问题表现：
```ts
// app/islands/my-counter.ts
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, MyCounter);  // ← customElements is undefined in SSR
}
```

在 SSR 环境中，`typeof customElements === 'undefined'` → 条件跳过，但某些 Web Component 库（如第三方 Lit 组件）在模块顶层无条件调用 `customElements.define()`，导致 `ReferenceError: customElements is not defined`。

## Decision

**SSG entry code 统一提供浏览器 API polyfill，在模块图加载前注入。Polyfill 顺序按依赖关系排列：CSSStyleSheet → HTMLElement → customElements。**

### Polyfill 清单

| API | Polyfill 来源 | 注入位置 | 必要性 |
|-----|-------------|---------|--------|
| `CSSStyleSheet` | `@lessjs/core` StyleSheet | SSG entry code 顶部 | Lit 内部引用 CSSStyleSheet，模块顶层即需 |
| `HTMLElement` | `@lit-labs/ssr-dom-shim` | SSG entry code 顶部 | `class Foo extends HTMLElement` 在模块顶层执行 |
| `customElements` | 自实现轻量 shim | SSG entry code 顶部 | `customElements.define()` 在模块顶层调用 |
| `document` | happy-dom（已有） | ssgRender 阶段 | DOM 操作在渲染时发生 |
| `window` | happy-dom（已有） | ssgRender 阶段 | 组件的 connectedCallback 可能访问 |

### 注入机制

从分散的 polyfill（entry code + output banner）统一为单一 polyfill 模块：

```ts
// packages/adapter-vite/src/ssr-polyfills.ts
export function generateSsrPolyfillBanner(): string {
  return [
    // Layer 1: CSSStyleSheet (no dependencies)
    `import { StyleSheet } from '@lessjs/core';`,
    `if (typeof globalThis.CSSStyleSheet === 'undefined') {`,
    `  globalThis.CSSStyleSheet = class {`,
    `    replaceSync(_css: string) {}`,
    `    get cssRules() { return []; }`,
    `  };`,
    `}`,
    '',
    // Layer 2: HTMLElement (no dependencies)
    `import { HTMLElement as _SsrHTMLElement } from '@lit-labs/ssr-dom-shim';`,
    `if (!globalThis.HTMLElement) {`,
    `  globalThis.HTMLElement = _SsrHTMLElement;`,
    `}`,
    '',
    // Layer 3: customElements (depends on HTMLElement existing)
    `if (typeof globalThis.customElements === 'undefined') {`,
    `  const registry = new Map<string, typeof globalThis.HTMLElement>();`,
    `  globalThis.customElements = {`,
    `    define(name: string, ctor: typeof globalThis.HTMLElement) {`,
    `      registry.set(name, ctor);`,
    `    },`,
    `    get(name: string) {`,
    `      return registry.get(name);`,
    `    },`,
    `    whenDefined(_name: string) {`,
    `      return Promise.resolve();`,
    `    },`,
    `    upgrade(_root: Node) {},`,
    `  };`,
    `}`,
  ].join('\n');
}
```

### 构建集成

在 `build-ssg.ts` 的 SSG entry code 生成阶段，polyfill banner 作为 entry code 的第一部分：

```ts
const rawSsgEntryCode = generateSsrPolyfillBanner() + '\n' + generateHonoEntryCode(routes, {...});
```

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
│ │    ├── @lessjs/core imports          │   │
│ │    ├── @lessjs/adapter-lit imports   │   │
│ │    ├── Route component imports       │   │
│ │    └── Hono app creation             │   │
│ └──────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

Polyfill banner 通过 Vite virtual module 机制作为 entry code 的静态前缀注入。Rolldown 将其与业务代码一起打包，但 polyfill 的副作用（在 `globalThis` 上设置属性）保证在所有其他模块加载前执行。

## 与 Lit SSR DOM Shim 的关系

`@lit-labs/ssr-dom-shim` 提供 `HTMLElement` 的 shim 实现。我们**继续使用它**作为 HTMLElement polyfill 的来源，但将其从 output banner 移到 entry code 中。这样做的好处：

1. **统一 polyfill 位置**：所有 polyfill 在同一处管理
2. **去除 output banner**：output banner 机制不保证在所有 Vite 版本间行为一致
3. **明确依赖关系**：entry code 中的 import 顺序天然保证执行顺序

## Consequences

### Positive

- **消除 customElements undefined 错误**：所有 WC 代码可在 SSR 环境安全加载
- **统一 polyfill 管理**：从 3 个分散位置（entry code、output banner、@lit-labs/ssr-dom-shim）合并为 1 个模块
- **明确执行顺序**：CSSStyleSheet → HTMLElement → customElements 的依赖链在 entry code 中可见
- **易于扩展**：新增浏览器 API polyfill 只需在 `ssr-polyfills.ts` 中添加
- **去除 output banner 依赖**：不再依赖 Rolldown 特定 API

### Negative

- **customElements shim 是轻量级的**：不支持完整的 Custom Elements 生命周期（`attributeChangedCallback` 等），仅支持 `define()`/`get()` 注册
- **模块顶层副作用**：polyfill 在模块顶层修改 `globalThis`，如果将来需要隔离 polyfill 作用域，需要重构
- **polyfill 代码进入 bundle**：~1KB gzip 的额外开销（可接受）

### Neutral

- **不影响客户端代码**：polyfill 仅在 SSR bundle 中生效
- **不改变组件编写方式**：组件代码中的 `customElements.define()` 调用保持不变

## Related

- ADR-0028: Universal SSR via DOM Simulation
- ADR-0029: Happy-DOM for DOM Simulation
- ADR-0042: Import Map as Universal Resolution Layer
- ADR-0045: Native API First-Class Citizen Strategy
