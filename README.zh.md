# openElement

[English](./README.md) | 简体中文

**DSD-first Web Components 框架 (v0.30.1)。** openElement 用 Declarative Shadow
DOM、JSX/VNode 渲染、渐进式 islands、Hono 路由和可证明的发布门禁来构建静态优先应用。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-@openelement/core-blue)](https://jsr.io/@openelement/core)
[![CI](https://github.com/open-element/openelement/actions/workflows/test.yml/badge.svg)](https://github.com/open-element/openelement/actions/workflows/test.yml)

## 快速开始

```bash
deno run -A jsr:@openelement/create my-app
cd my-app
deno task dev
```

## 当前契约

v0.30.1 的重点是清理，而不是兼容旧名字：

- 应用入口是 `openElement()`；
- 渲染模型是 JSX -> VNode -> RenderNode -> DSD HTML 或 DOM；
- metadata 字段是 `openElement`；
- UI 标签和子路径使用 `open-*`；
- `trustedHtml` 只用于已经清洗或可信的非交互 HTML 内容。

## 包

19 个包统一发布在 [`@openelement`](https://jsr.io/@openelement)，当前版本
为 **v0.30.1**。

| Package                     | Role                                  |
| --------------------------- | ------------------------------------- |
| `@openelement/core`         | DSD renderer, DsdElement, JSX runtime |
| `@openelement/adapter-vite` | Vite adapter, SSG pipeline, islands   |
| `@openelement/app`          | `openElement()` 配置入口              |
| `@openelement/runtime`      | 组件编写 facade                       |
| `@openelement/ui`           | `open-*` DSD 组件库                   |
| `@openelement/content`      | Markdown, MDX, nav, blog, sitemap     |
| `@openelement/i18n`         | 多语言数据和静态路径                  |
| `@openelement/hub`          | registry metadata 和验证              |

## 文档

| Section      | Link                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------- |
| Guide        | [openelement.org/guide/getting-started](https://openelement.org/guide/getting-started)         |
| API          | [openelement.org/apilist](https://openelement.org/apilist)                                     |
| Architecture | [openelement.org/architecture/architecture](https://openelement.org/architecture/architecture) |

## 路线

v0.30.1 是 v0.30.0 架构冻结后的清理版本。v0.31 留给 UI Shell/Ocean-Island
产品表面。**v1.0** 仍然是稳定引擎目标，前提是 renderer、metadata、package
graph 和 trust boundary 都已经在真实应用中证明。

## 贡献

见 [CONTRIBUTING.md](./CONTRIBUTING.md)。架构决策在 [docs/adr/](./docs/adr/)，
执行 SOP 在 [docs/sop/](./docs/sop/)，当前状态在
[docs/status/STATUS.md](./docs/status/STATUS.md)。

## 许可证

MIT
