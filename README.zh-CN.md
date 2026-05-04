# KISS

[English](./README.md) | [简体中文](./README.zh-CN.md)

KISS 是一个 Deno-first、Web Standards-first 的现代全栈框架，面向 static-first 应用。

它把 Declarative Shadow DOM、Web Components、Island Upgrade、SSG、Hono serverless APIs
和 Vite 组合成一个很小的框架表面。KISS 的目标不是隐藏 Web 平台，而是让平台本身变得更好用。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/SisyphusZheng/kiss/actions/workflows/test.yml/badge.svg)](https://github.com/SisyphusZheng/kiss/actions/workflows/test.yml)
[![@kissjs/core](https://img.shields.io/jsr/v/@kissjs/core?logo=jsr&labelColor=0a0a0a)](https://jsr.io/@kissjs/core)
[![@kissjs/ui](https://img.shields.io/jsr/v/@kissjs/ui?logo=jsr&labelColor=083344)](https://jsr.io/@kissjs/ui)
[![@kissjs/rpc](https://img.shields.io/jsr/v/@kissjs/rpc?logo=jsr&labelColor=083344)](https://jsr.io/@kissjs/rpc)
[![@kissjs/create](https://img.shields.io/jsr/v/@kissjs/create?logo=jsr&labelColor=083344)](https://jsr.io/@kissjs/create)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF)](https://vite.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002)](https://hono.dev/)
[![Lit](https://img.shields.io/badge/Lit-optional-325CFF)](https://lit.dev/)

## 为什么是 KISS

很多现代前端栈把 HTML 变成运行时产物。KISS 反过来，从 HTML 和 Web 平台本身出发：

- 在构建期渲染语义化 HTML
- 用 Declarative Shadow DOM 保留组件边界
- 只升级真正需要 JavaScript 的交互岛屿
- 优先使用原生 Web APIs，而不是先制造框架抽象
- 让 serverless APIs 靠近路由树
- 通过 Deno-first 工作流运行、构建和发布

KISS 目前仍是 alpha 软件。方向已经稳定，API 还在继续加固。

## 快速开始

```bash
deno run -A jsr:@kissjs/create my-app
cd my-app
deno task dev
```

要求：

- Deno 2.7 或更新版本
- 支持 Declarative Shadow DOM 的现代浏览器

## 架构

KISS 不只是“代码少”。它是一组架构约束：

| 字母 | 约束      | 含义                                                             |
| ---- | --------- | ---------------------------------------------------------------- |
| K    | Knowledge | 优先使用构建期知识，而不是运行时发现。                           |
| I    | Isolated  | 客户端 JavaScript 应该待在 island 和组件边界内。                 |
| S    | Semantic  | HTML 仍然是主要文档格式，也是可访问性的基础。                    |
| S    | Static    | SSG 产物应该能作为静态文件部署，serverless APIs 是可选动态边缘。 |

当前渲染模型：

```text
Route module
  -> Web Component render()
  -> Declarative Shadow DOM HTML
  -> static HTML file
  -> optional island client chunk
  -> Custom Element upgrade in the browser
```

这和完整客户端 hydration 模型有意不同。KISS 不尝试在客户端重建应用树，而是在需要交互的位置升级
Custom Elements。

## 包

| 包                    | 职责                                               | 当前版本线      |
| --------------------- | -------------------------------------------------- | --------------- |
| `@kissjs/core`        | Vite 插件、路由扫描、DSD 渲染、SSG 管线            | `0.5.0-alpha.5` |
| `@kissjs/ui`          | 基于 Lit 的 Web Component 组件库和 package islands | `0.4.6`         |
| `@kissjs/rpc`         | 轻量 fetch/RPC controller 工具                     | `0.2.4`         |
| `@kissjs/adapter-lit` | 可选 Lit SSR 适配器                                | `0.1.4`         |
| `@kissjs/create`      | 项目脚手架 CLI                                     | `0.3.3`         |

历史包 `@kissjs/vite` 和 `@kissjs/ssg` 已废弃，不建议继续使用。

## 项目结构

```text
my-app/
  app/
    routes/
      index.ts
      about.ts
      api/
        status.ts
    islands/
      counter.ts
    components/
      shell.ts
  deno.json
  vite.config.ts
```

页面是文件路由。API 文件导出 Hono apps。Islands 是注册 Custom Elements 的客户端 chunk。

## 路由示例

```ts
import { css, html, LitElement } from 'lit';

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
        <h1>Hello from KISS</h1>
        <counter-island></counter-island>
      </main>
    `;
  }
}

customElements.define(tagName, HomePage);
```

## 构建管线

KISS 使用三阶段静态构建：

```bash
deno task build        # Phase 1: SSR bundle + build metadata
deno task build:client # Phase 2: island client chunks
deno task build:ssg    # Phase 3: static HTML + post-processing
```

完整仓库可运行：

```bash
deno task build:all
deno task test
deno task lint
```

本仓库是 Deno-first。Vite 通过 `deno run -A npm:vite` 执行；Node/npm/npx 不是主工作流的一部分。

## 当前状态

KISS 正在准备 `v0.5.0-alpha.5` 版本线。

已经适合评估：

- DSD-first 静态渲染
- package islands
- SSG 输出
- Hono API routes
- Deno-first 本地与 CI 工作流

仍在加固：

- 安全的 Lit SSR 插值
- 嵌套 island 路径处理
- 脚手架校验
- ISR/serverless 约定
- 未来 `.kiss` compiler 方向

## 文档

- 文档站：[kiss.js.org](https://kiss.js.org/)
- Roadmap：[docs/app/routes/roadmap.ts](./docs/app/routes/roadmap.ts)
- 架构决策：[docs/decisions](./docs/decisions)

## License

MIT
