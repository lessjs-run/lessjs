# ADR-0045: DSD + CSS Parts + Signals 原生 API 一等公民策略

> **Status**: PROPOSED
> **Date**: 2026-05-25
> **Applies to**: v0.21.x → v0.22.0
> **Extends**: ADR-0037 (DSD-First Strategic Boundary), ADR-0039 (DsdElement + Signals)
> **Scope**: 原生 Web API 在 LessJS 框架中的使用原则

## Context

LessJS 的核心价值主张是"Web Standards First"。框架在多个层面使用原生 Web API：

| API                        | 使用方式                                      | 涉及模块                                        |
| -------------------------- | --------------------------------------------- | ----------------------------------------------- |
| **Declarative Shadow DOM** | `shadowrootmode="open"` 属性，`DsdElement`    | `@openelement/core`, `@openelement/adapter-lit` |
| **CSS Parts**              | `::part()` 选择器                             | `@openelement/ui` (less-button, less-card 等)   |
| **Custom Elements**        | `customElements.define()`                     | 所有组件                                        |
| **HTML Template**          | `<template>` 元素                             | DSD 渲染管线                                    |
| **Signals**                | `@openelement/signal` (TC39 proposal-aligned) | `@openelement/core` (DsdElement reactive)       |
| **View Transitions API**   | `<meta name="view-transition">`               | SSG post-processing                             |

这些 API 的一个共同特征：**不需要打包工具（bundler）的特殊处理**。它们通过标准 ESM import 即可运行，浏览器原生支持（或通过 polyfill），不涉及 npm 子路径或 TypeScript 编译。

然而，当前构建管线中存在将框架抽象层插入这些原生 API 的倾向。例如：

- `StyleSheet` 类封装了 `CSSStyleSheet`（必要 — SSR 需要）
- 但有些地方通过框架中间层访问 DOM API，增加了不必要的间接性

## Decision

**LessJS 将原生 Web API 视为一等公民。框架代码直接使用原生 API，不经过框架封装层。Bundler（Rolldown）对原生 API 完全透明，不干预其导入和运行。**

### 一等公民定义

一个 Web API 在 LessJS 中是"一等公民"，当且仅当满足以下条件：

1. **直接 import**：通过标准 ESM import 或全局对象访问，无框架中间层
2. **Bundler 透明**：Rolldown 不转译、不重写、不替换
3. **无框架封装**：LessJS 不提供 wrapper class 或 helper 函数
4. **SSR 兼容**：在 SSR 环境中有对应的 polyfill（如需要）

### 各 API 的定位

| API                    | 定位       | Bundler 行为 | 框架封装（如有）                                    | 理由                                      |
| ---------------------- | ---------- | ------------ | --------------------------------------------------- | ----------------------------------------- |
| DSD (`shadowrootmode`) | 一等公民   | 不做任何处理 | `DsdElement`（仅管理 DSD 声明，不封装 DSD API）     | DSD 是 HTML 属性，渲染时直接输出          |
| CSS Parts (`::part()`) | 一等公民   | 不做任何处理 | 无                                                  | CSS 选择器，浏览器原生解析                |
| Custom Elements        | 一等公民   | 不做任何处理 | 无（`customElements.define()` 直接调用）            | 全局 API，仅在 SSR 时 polyfill            |
| HTML Template          | 一等公民   | 不做任何处理 | 无                                                  | `<template>` 是标准 HTML 元素             |
| Signals                | 一等公民   | 不做任何处理 | `@openelement/signal`（实现 TC39 proposal，非封装） | Signals 是 JS 库，ESM import              |
| View Transitions       | 一等公民   | 不做任何处理 | 无（直接注入 `<meta>` 标签）                        | Meta 标签，无 JS API 调用                 |
| `CSSStyleSheet`        | 有条件封装 | 不做任何处理 | `@openelement/core` StyleSheet（SSR 兼容层）        | SSR 环境需要 polyfill；客户端直接使用原生 |
| `HTMLElement`          | 有条件封装 | 不做任何处理 | `@lit-labs/ssr-dom-shim`（SSR polyfill）            | SSR 环境无此全局对象                      |

### 框架封装的原则

框架封装仅在以下情况下允许：

1. **SSR/SSG 兼容性**：如 `StyleSheet` 封装了浏览器和 SSR 两种环境的 `CSSStyleSheet` 行为
2. **DSD 声明式管理**：如 `DsdElement` 管理 DSD 模板的声明和 SSR 渲染，但不封装 DSD API 本身
3. **类型安全**：如 `@openelement/signal` 提供类型化的 Signal API

框架封装**不允许**：

- 为已有原生 API 创建 wrapper（如 `LessHTMLElement` 封装 `HTMLElement`）
- 通过框架 API 间接访问 DOM（如 `less.queryShadowRoot()`）
- 在 bundler 层面拦截或重写原生 API 调用

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Application Code                          │
│                                                              │
│  customElements.define('my-el', MyElement)  ← direct API     │
│  :host { ... }                              ← CSS Parts      │
│  <template shadowrootmode="open">           ← DSD            │
│  signal(0)                                  ← Signals        │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │ ESM import
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    LessJS Framework                           │
│                                                              │
│  DsdElement      ← manages DSD declaration,                  │
│                    does NOT wrap shadowrootmode              │
│  StyleSheet      ← SSR-safe CSSStyleSheet,                   │
│                    delegates to native in browser            │
│  @openelement/signal ← TC39-aligned implementation,              │
│                    not a wrapper around native               │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │ ESM import
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Bundler (Rolldown)                         │
│                                                              │
│  ✅ Passes through: DSD strings, CSS Parts, customElements   │
│  ✅ Bundles: LessJS code, Lit code                           │
│  ❌ Does NOT: rewrite, intercept, or transform native APIs   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Component Code Example

```ts
// ✅ 一等公民：直接使用原生 API
import { DsdElement, html, signal } from '@openelement/core';

export const tagName = 'my-greeting';

export default class MyGreeting extends DsdElement {
  // CSS Parts — 原生 ::part() 选择器
  // 消费者用 my-greeting::part(name) { color: red; }

  name = signal('World');

  override render() {
    // DSD — shadowrootmode 由 DsdElement 自动管理
    // 开发者只需返回模板内容
    return html`
      <h1 part="heading">Hello, ${this.name}!</h1>
    `;
  }
}

// Custom Elements — 直接调用原生 API
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, MyGreeting);
}
```

## 与 ADR-0037（DSD-First）的关系

ADR-0037 确立了"DSD-first"的战略定位。本 ADR 进一步明确：DSD-first 不仅意味着优先使用 DSD，还意味着 DSD 本身作为原生 API 不经框架封装。

具体说：

- `DsdElement` 不是 DSD API 的封装，而是 DSD 声明式管理的便利层
- `DsdElement.render()` 返回的字符串直接作为 DSD 内容输出
- 框架不添加任何中间层（如 JSX → DSD 转换）

## Consequences

### Positive

- **代码简洁**：开发者直接使用标准 Web API，无需学习框架特定的 API
- **Bundler 负担减轻**：Rolldown 不需要理解或处理原生 API
- **与 Web 标准对齐**：LessJS 组件与纯 Web Components 之间的迁移成本为零
- **调试简单**：运行时行为与浏览器原生行为一致，不需要理解框架抽象
- **减少 bundle 体积**：不需要框架封装层的额外代码

### Negative

- **SSR Polyfill 必要**：某些浏览器 API（`customElements`、`HTMLElement`）在 SSR 环境需要 polyfill
- **浏览器兼容性依赖**：依赖浏览器对 Web 标准的支持程度（可通过 polyfill 缓解）
- **框架无法提供"增强版"API**：如无法包装 `connectedCallback` 提供自动重试（这是有意的设计选择）

### Neutral

- **不影响已有组件**：现有 `DsdElement`、`@openelement/ui` 组件的 API 不变
- **Lit 适配器不受影响**：`@openelement/adapter-lit` 继续封装 Lit 的 CSS 和生命周期

## Related

- ADR-0037: DSD-First Strategic Boundary and v0.21 Roadmap Realignment
- ADR-0039: DsdElement + Signals Reactive Architecture
- ADR-0042: Import Map as Universal Resolution Layer
- ADR-0044: SSR Browser API Polyfill Strategy
