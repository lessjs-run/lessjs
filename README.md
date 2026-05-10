# LessJS

[简体中文](./README.md) | [English](./README.en.md)

LessJS 是一个 Deno-first 的静态站点框架，用 Declarative Shadow DOM + Island Upgrade 让 HTML 先于 JavaScript 存在。

它把 DSD 递归渲染、Web Components、SSG、Hono API 路由和 Vite 组合成最小框架表面。
LessJS 不隐藏 Web 平台——它让平台本身更好用。

LessJS 正在演化为一个**混合框架 + 编译器**：当前以 SSG + Island 为主，未来 .less Compiler 将用 AST
替代手工 runtime-shim，并在 serverless fullstack 和 ISR 场景下提供更完整的解决方案。
详见 [路线图](https://lessjs.com/roadmap)。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF)](https://vite.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002)](https://hono.dev/)
[![Lit](https://img.shields.io/badge/Lit-optional-325CFF)](https://lit.dev/)
[![@lessjs/core](https://img.shields.io/jsr/v/@lessjs/core?label=@lessjs/core&style=flat-square)](https://jsr.io/@lessjs/core)
[![@lessjs/ui](https://img.shields.io/jsr/v/@lessjs/ui?label=@lessjs/ui&style=flat-square)](https://jsr.io/@lessjs/ui)
[![@lessjs/adapter-lit](https://img.shields.io/jsr/v/@lessjs/adapter-lit?label=@lessjs/adapter-lit&style=flat-square)](https://jsr.io/@lessjs/adapter-lit)
[![@lessjs/rpc](https://img.shields.io/jsr/v/@lessjs/rpc?label=@lessjs/rpc&style=flat-square)](https://jsr.io/@lessjs/rpc)
[![@lessjs/signal](https://img.shields.io/jsr/v/@lessjs/signal?label=@lessjs/signal&style=flat-square)](https://jsr.io/@lessjs/signal)
[![@lessjs/create](https://img.shields.io/jsr/v/@lessjs/create?label=@lessjs/create&style=flat-square)](https://jsr.io/@lessjs/create)
[![@lessjs/content](https://img.shields.io/jsr/v/@lessjs/content?label=@lessjs/content&style=flat-square)](https://jsr.io/@lessjs/content)


## 为什么是 LessJS

很多现代前端栈把 HTML 变成运行时产物。LessJS 反过来，从 HTML 和 Web 平台本身出发：

- 在构建期渲染语义化 HTML
- 用 **Declarative Shadow DOM** 保留组件边界（嵌套递归）
- 只升级真正需要 JavaScript 的交互 **Island**
- 优先使用原生 Web APIs（`<dialog>`、`:state()`、Navigation API），而不是先制造框架抽象
- 用 **TC39 Signals** 管理响应式状态（浏览器原生 `Signal` 条件回退）
- 可选 Hono API 路由，靠近路由树定义 serverless 端点
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

## v0.8 变更

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

### 结构化日志 — createLogger

v0.8 引入 `createLogger(scope)` 结构化日志模块，全框架统一 `[LessJS]` / `[LessJS/SSG]` / `[LessJS/Blog]` 前缀，
支持 `debug/info/warn/error` 四级，`SILENT` 级别可静默所有输出。所有框架内部模块已迁移至结构化日志，
原始 `console.*` 调用仅在 CLI 工具和日志实现本身中保留。

```ts
import { createLogger } from '@lessjs/core/logger';

const log = createLogger('ssg');
log.warn('Client build failed:', err.message);
log.info('Routes: 5 page(s), 2 API route(s), 8 island(s)');
log.debug('customElements.define("my-counter") skipped: already defined');
```

### Runtime Shim 自动生成

v0.8 新增 `packages/core/scripts/generate-runtime-shim.ts`，使用 TypeScript AST 从源文件提取函数，
自动生成 `runtime-shim.ts`。消除了手工同步运行时 shim 与源码的风险。

```bash
deno task generate:runtime-shim          # 重新生成
deno task generate:runtime-shim && git diff --exit-code packages/core/src/runtime-shim.ts  # 验证一致性
```

### @lessjs/content — 统一内容插件

`@lessjs/content` 是 Blog + Nav + Sitemap 三合一的 Vite 插件，每个模块 opt-in：

```ts
import { lessContent } from '@lessjs/content';
import { lessjs } from '@lessjs/app';

export default defineConfig({
  plugins: [
    lessjs({
      content: {
        blog: {
          contentDir: resolve(__dirname, 'content/blog'),
          basePath: '/blog',
        },
        nav: {
          routesDir: resolve(__dirname, 'app/routes'),
          headerNav: [
            { href: '/guide', label: 'Docs' },
          ],
        },
        sitemap: {
          hostname: 'https://example.com',
        },
      },
    }),
  ],
});
```

- **Blog**：`parseMarkdownFile()` + `scanPosts()` + `generateBlogRoutes()` — Markdown → 路由 → 列表/文章页
- **Nav**：`scanNavData()` → `virtual:less-nav` — 路由 meta 扫描 → sidebar 自动生成
- **Sitemap**：`generateSitemap()` — SSG 后自动生成 sitemap.xml + robots.txt
- 纯构建时插件，零运行时

### 嵌套 DSD 渲染 — parse5 优化

v0.8 将嵌套自定义元素渲染从正则 O(n²) 替换为 parse5 AST O(n×d) 方案，支持复杂嵌套场景。

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
| `@lessjs/core`        | Vite 插件、路由扫描、DSD 渲染（L2 嵌套）、结构化日志、Navigation API、SSG 管线 | 0.10.0   |
| `@lessjs/app`         | 统一入口 lessjs()：组合 core + content + i18n                     | 0.2.0    |
| `@lessjs/ui`          | 基于 Lit 的 Web Component 组件库（含 DSD hydration）               | 0.7.0    |
| `@lessjs/signal`      | TC39 Signals 二开（signal/computed/effect/islandEffect）           | 0.6.2    |
| `@lessjs/adapter-lit` | 可选 Lit SSR 适配器                                                | 0.8.0    |
| `@lessjs/rpc`         | 轻量 fetch/RPC controller 工具                                     | 0.6.1    |
| `@lessjs/create`      | 项目脚手架 CLI                                                     | 0.7.0    |
| `@lessjs/content`     | 统一内容插件（Blog + Nav + Sitemap，纯构建时）                     | 0.3.0    |
| `@lessjs/i18n`        | 国际化插件（locale 展开 + 语言切换）                               | 0.1.0    |

历史包 `@lessjs/vite` 和 `@lessjs/ssg` 已废弃。### @lessjs/ui 组件清单

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
      blog/
        index.ts        # 博客列表（@lessjs/content）
        [slug].ts       # 博客文章
      api/
        status.ts       # Hono API route
    islands/
      counter.ts        # Island = 客户端交互组件
    components/
      shell.ts
  content/
    blog/               # Markdown 博客内容
      hello-world.md
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
deno task test:e2e     # Playwright E2E 测试
deno task lint         # lint 检查
deno task fmt:check    # 格式检查
```

本仓库是 Deno-first。Vite 通过 `deno run -A npm:vite` 执行；Node/npm/npx 不是主工作流的一部分。

### Pre-commit Hooks

安装 Git pre-commit hooks，在每次提交前自动运行格式化检查、lint 和类型检查：

```bash
deno task hooks:install
```

卸载：

```bash
deno task hooks:uninstall
```

Hook 会执行 `deno fmt --check`、`deno lint` 和 `deno check`，不运行完整测试套件。

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
- 博客：[/blog](https://lessjs.com/blog)

## 版本历史

| Version           | Date       | Highlights                                                                                   |
| ----------------- | ---------- | -------------------------------------------------------------------------------------------- |
| **0.10.0**        | 2026-05-10 | SSR 架构净化（ADR 0008-0014）：renderRoute()/getStaticPaths() 公共 API、@lessjs/app 统一入口、消除 globalThis 桥接和 .less/ 临时文件 |
| **0.9.2**         | 2026-05-09 | View Transitions API + Speculation Rules API + SSG 后处理管线重构 |
| **0.9.0-alpha-1** | 2026-05-09 | @lessjs/content 统一内容插件、SSR 属性绑定保留、Monorepo 包版本策略 |
| **0.8.0**         | 2026-05-08 | 结构化日志（createLogger）、runtime-shim 自动生成、@lessjs/blog 博客插件、parse5 嵌套优化、Playwright E2E |
| **0.7.0**         | 2026-05-07 | P0 审计修复 — 73 新测试、runtime-shim 一致性、XSS 警告、静默 catch 消除、CI 补全、pre-commit hooks |
| **0.6.2**         | 2026-05-07 | adapter-lit 静默 catch 修复                                                                   |
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
