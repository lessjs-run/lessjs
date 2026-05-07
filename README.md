# LessJS

[简体中文](./README.md) | [English](./README.en.md)

LessJS 是一个 Deno-first、Web Standards-first 的现代全栈框架，面向 static-first 应用。

它把 Declarative Shadow DOM、Web Components、Island Upgrade、SSG、Hono serverless APIs
和 Vite 组合成一个很小的框架表面。LessJS 的目标不是隐藏 Web 平台，而是让平台本身变得更好用。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/lessjs-run/lessjs/actions/workflows/test.yml/badge.svg)](https://github.com/lessjs-run/lessjs/actions/workflows/test.yml)
[![@lessjs/core](https://img.shields.io/jsr/v/@lessjs/core?logo=jsr&labelColor=0a0a0a)](https://jsr.io/@lessjs/core)
[![@lessjs/ui](https://img.shields.io/jsr/v/@lessjs/ui?logo=jsr&labelColor=083344)](https://jsr.io/@lessjs/ui)
[![@lessjs/rpc](https://img.shields.io/jsr/v/@lessjs/rpc?logo=jsr&labelColor=083344)](https://jsr.io/@lessjs/rpc)
[![@lessjs/create](https://img.shields.io/jsr/v/@lessjs/create?logo=jsr&labelColor=083344)](https://jsr.io/@lessjs/create)
[![@lessjs/signal](https://img.shields.io/jsr/v/@lessjs/signal?logo=jsr&labelColor=083344)](https://jsr.io/@lessjs/signal)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF)](https://vite.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002)](https://hono.dev/)
[![Lit](https://img.shields.io/badge/Lit-optional-325CFF)](https://lit.dev/)

## 为什么是 LessJS

很多现代前端栈把 HTML 变成运行时产物。LessJS 反过来，从 HTML 和 Web 平台本身出发：

- 在构建期渲染语义化 HTML
- 用 **Declarative Shadow DOM** 保留组件边界（嵌套递归）
- 只升级真正需要 JavaScript 的交互 **Island**
- 优先使用原生 Web APIs（`<dialog>`、`:state()`、Navigation API），而不是先制造框架抽象
- 用 **TC39 Signals** 管理响应式状态（浏览器原生 `Signal` 条件回退）
- 让 serverless APIs 靠近路由树
- 通过 Deno-first 工作流运行、构建和发布

## 快速开始

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app
deno task dev
```

要求：

- Deno 2.7 或更新版本
- 支持 Declarative Shadow DOM 的现代浏览器

## 渲染模型

```text
Route module (Web Component / LitElement)
  → render() → TemplateResult
  → SSR adapter → Declarative Shadow DOM (L2 recursive nesting)
  → static HTML file + inline DSD templates
  → optional island client chunk (4 strategies: eager / lazy / visible / idle)
  → browser: native DSD attachment + Custom Element upgrade (DSD hydration, skip re-render)
```

LessJS 不做客户端整树 hydration，而是在需要交互的位置按需升级 Custom Elements。

**DSD Hydration**：当浏览器原生附加 Declarative Shadow DOM 后，Lit 组件检测已有 shadow root 并跳过重渲染，
避免重复内容（空白框、Footer 双写等）。

## v0.6 新特性

### Declarative Shadow DOM — 嵌套递归

v0.6 核心突破：**L2 Nested DSD**。

```html
<!-- 页面级 DSD -->
<page-examples>
  <template shadowrootmode="open">
    <!-- less-layout 的 DSD -->
    <less-layout>
      <template shadowrootmode="open">
        <!-- less-button 在 less-layout 内部也有自己的 DSD -->
        <less-button variant="primary">
          <template shadowrootmode="open">
            <style>
              /* button styles */
            </style>
            <button class="btn">Click me</button>
          </template>
        </less-button>
      </template>
    </less-layout>
  </template>
</page-examples>
```

每个嵌套的 Custom Element 都获得独立的 `<template shadowrootmode>`，CSS 封装完整保留，
无需 JavaScript 即可看到最终样式。

### TC39 Signals — 响应式状态

基于 signal-polyfill 二开，与浏览器原生 `Signal` API 对齐：

```ts
import { computed, effect, signal } from '@lessjs/signal';

const count = signal(0);
const doubled = computed(() => count.value * 2);
effect(() => console.log(`count is now ${count.value}`));
count.value++; // → "count is now 1"
```

- `signal()` — 响应式值
- `computed()` — 自动依赖追踪的计算属性
- `effect()` — 副作用自动重跑
- `islandEffect()` — Island 生命周期绑定

### Form-Associated Custom Elements

原生表单集成，无需 polyfill：

```html
<form onsubmit="console.log(new FormData(this))">
  <less-input name="email" label="Email" required></less-input>
  <less-input type="password" label="Password" required></less-input>
  <less-button type="submit" variant="primary">Submit</less-button>
</form>
```

- `less-button`: 支持 `type="submit"`，`:state(disabled)` CSS 伪类
- `less-input`: 支持 `:state(invalid)`, `:state(disabled)`
- 通过 `ElementInternals.setFormValue()` 参与原生表单提交

### Navigation API

客户端路由基于 WHATWG Navigation API：

```ts
import { matchRoute, navigate, onNavigate } from '@lessjs/core';

onNavigate((event) => {
  const route = matchRoute(event.destination.url);
  // 处理导航...
});
navigate('/about');
```

### less-dialog 组件

原生 `<dialog>` 元素封装：

```html
<less-dialog open>
  <p slot="header">Confirm Action</p>
  <p>Are you sure you want to proceed?</p>
  <less-button slot="footer" variant="primary">Yes</less-button>
</less-dialog>
```

- 原生 `<dialog>` + `::backdrop`
- `:state(open/closed)` CSS 伪类
- `inert` 无障碍属性

### Speculative Loading

根据 Island 策略注入不同的资源提示：

- **eager**: `<link rel="modulepreload">` — 预加载并执行
- **lazy/visible/idle**: `<link rel="prefetch">` — 仅预取到缓存

## 包

| 包                    | 职责                                                               | 当前版本 |
| --------------------- | ------------------------------------------------------------------ | -------- |
| `@lessjs/core`        | Vite 插件、路由扫描、DSD 渲染（L2 嵌套）、Navigation API、SSG 管线 | 0.6.1    |
| `@lessjs/ui`          | 基于 Lit 的 Web Component 组件库（含 DSD hydration）               | 0.6.1    |
| `@lessjs/signal`      | TC39 Signals 二开（signal/computed/effect/islandEffect）           | 0.6.1    |
| `@lessjs/adapter-lit` | 可选 Lit SSR 适配器                                                | 0.6.1    |
| `@lessjs/rpc`         | 轻量 fetch/RPC controller 工具                                     | 0.6.1    |
| `@lessjs/create`      | 项目脚手架 CLI                                                     | 0.6.1    |

历史包 `@lessjs/vite` 和 `@lessjs/ssg` 已废弃。

### @lessjs/ui 组件清单

| 组件                | 说明                              | DSD | Form-Associated      | Island |
| ------------------- | --------------------------------- | --- | -------------------- | ------ |
| `less-layout`       | 应用布局（header/sidebar/footer） | ✅  | ❌                   | ❌     |
| `less-button`       | 按钮（default/primary/ghost）     | ✅  | ✅ (`type="submit"`) | ❌     |
| `less-card`         | 卡片容器（可选 header/footer）    | ✅  | ❌                   | ❌     |
| `less-input`        | 输入框（支持 label/error）        | ✅  | ✅                   | ❌     |
| `less-code-block`   | 代码块（带复制按钮）              | ✅  | ❌                   | ❌     |
| `less-dialog`       | 对话框（原生 dialog）             | ✅  | ❌                   | ❌     |
| `less-theme-toggle` | 主题切换（dark/light）            | ✅  | ❌                   | ✅     |
| `less-hero-ping`    | API 状态指示器                    | ✅  | ❌                   | ✅     |

所有 UI 组件均已实现 **DSD hydration**：检测到浏览器已附加的 Declarative Shadow DOM 时跳过 Lit 重渲染，
确保 SSR 产出与客户端激活零差异。

## 项目结构

```text
my-app/
  app/
    routes/
      index.ts          # 页面 = 文件路由
      about.ts
      api/
        status.ts       # Hono API route
    islands/
      counter.ts        # Island = 客户端交互组件
    components/
      shell.ts
  deno.json
  vite.config.ts
```

页面是文件路由。API 文件导出 Hono apps。Islands 是注册 Custom Elements 的客户端 chunk。
全部页面组件输出 Declarative Shadow DOM。

## 路由示例

```ts
import { css, html, LitElement } from 'lit';
import '@lessjs/ui/less-layout';

export const tagName = 'home-page';

export default class HomePage extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 2rem;
    }
  `;

  override render() {
    return html`
      <main>
        <h1>Hello from LessJS</h1>
        <counter-island></counter-island>
      </main>
    `;
  }
}

customElements.define(tagName, HomePage);
```

## 构建

LessJS 应用的生产构建只需要一个命令：

```bash
deno task build
```

内部仍保留 SSR bundle、island client chunks、SSG rendering 三个阶段；这用于调试和 CI 定位。

完整仓库可运行：

```bash
deno task build:ssg    # 仅构建 SSG（静态 HTML）
deno task test         # 运行测试
deno task lint         # lint 检查
deno task fmt:check    # 格式检查
```

本仓库是 Deno-first。Vite 通过 `deno run -A npm:vite` 执行；Node/npm/npx 不是主工作流的一部分。

## 设计系统

LessJS UI 组件遵循瑞士国际主义风格（Swiss International Style）：

- **纯黑白配色** — 通过 Open Props Design Tokens 管理 light/dark 主题色
- **0.5px 边框** — 全站统一的极细边框
- **4px 间距基准** — spacing scale 基于 4px 单元
- **CSS 自定义属性穿透 Shadow DOM** — 主题变量从 `:root` 级联到所有组件
- **Form-Associated CE** — 表单组件原生参与 `<form>` 提交

主题变量示例：

```css
/* Light theme */
--less-text-primary: var(--gray-12); /* 黑 */
--less-bg-base: var(--gray-0); /* 白 */

/* Dark theme */
--less-text-primary: var(--gray-0); /* 白 */
--less-bg-base: var(--gray-12); /* 黑 */
```

## 文档

- 文档站：[lessjs.com](https://lessjs.com/)
- 更新日志：[/changelog](https://lessjs.com/changelog)
- 路线图：[/roadmap](https://lessjs.com/roadmap)
- 架构决策：[/decisions](https://lessjs.com/decisions)
- UI 组件展示：[/ui](https://lessjs.com/ui)

## 版本历史

| Version           | Date       | Highlights                                                                                   |
| ----------------- | ---------- | -------------------------------------------------------------------------------------------- |
| **0.6.1**         | 2026-05-07 | v0.6 正式版 — README 清理、全包版本对齐、CI 稳定性修复                                       |
| **0.6.0-alpha.1** | 2026-05-06 | DSD + Islands + Signals + Form-Associated CE + Navigation API + Dialog + Speculative Loading |
| **0.5.5**         | 2026-05-06 | 全面品牌重塑（105 个文件）                                                                   |
| **0.5.3**         | 2026-05-05 | Trust Release — 文档承诺与构建产物对齐                                                       |
| **0.5.0**         | 2026-05-04 | 正式单命令构建 + Core/Lit 边界收紧                                                           |
| **0.4.0**         | 2026-04-30 | Serverless API + Blog 系统 + PWA SW 策略重写                                                 |
| **0.3.0**         | 2026-04-29 | Package Islands 自动检测 + Theme Toggle Island                                               |
| **0.2.0**         | 2026-04-27 | Package Islands 自动检测                                                                     |
| **0.1.7**         | 2026-04-27 | @lessjs/ui 组件库 + dogfooding                                                               |
| **0.1.6**         | 2026-04-26 | 设计系统 + 移动端响应式                                                                      |
| **0.1.5**         | 2026-04-20 | 架构约束定义                                                                                 |
| **0.1.4**         | 2026-04-15 | inject option + API Routes docs                                                              |
| **0.1.3**         | 2026-04-10 | @lessjs/rpc + @lessjs/ui                                                                     |
| **0.1.2**         | 2026-04-05 | Island AST transform                                                                         |
| **0.1.1**         | 2026-04-01 | Initial JSR release                                                                          |

## License

MIT
