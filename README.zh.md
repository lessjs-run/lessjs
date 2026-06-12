# openElement

[English](./README.md) | 简体中文

**JSX-first Web Components 平台。当前包线：`0.39.0`（`v0.39.0` release）。活动执行线：`v0.39.0` Framework RC + Four-Product Matrix Reset。**

openElement 用 Web Components、JSX/VNode 渲染、渐进式 islands、API routes
以及 Vite + Nitro 输出构建静态优先应用。Shadow/DSD 是默认组件渲染模式；light
DOM 必须显式选择。

强制项目流程：[docs/governance/PROJECT_WORKFLOW.md](./docs/governance/PROJECT_WORKFLOW.md)。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-@openelement/core-blue)](https://jsr.io/@openelement/core)

## 产品矩阵

```text
openElement = Elements + UI + Framework + Protocols
```

| 产品      | 公开方向                                                           | 当前状态                                                                                                         |
| --------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Elements  | 未来 `@openelement/elements` 与 `OpenElement`                      | 面向 Lit/FAST 的原生 Web Components authoring surface；当前实现仍在 `@openelement/core` / `@openelement/runtime` |
| UI        | `@openelement/ui`                                                  | 第一方 `open-*` 组件库，基于 Elements 模型                                                                       |
| Framework | `@openelement/app`、`@openelement/app/vite`、`@openelement/create` | Vite + Nitro 应用层、routes、layouts、islands、API routes、SSG/SSR/ISR intent                                    |
| Protocols | `@openelement/protocols`                                           | Runtime-free contracts：renderers、routes、islands、cache、data、signals、validators                             |

Vite 和 Nitro 是默认 Framework engines，不是独立产品。`@openelement/core`、
`@openelement/runtime`、adapter 包和 advanced 包支撑四产品矩阵，但不替代它。

## 安装

```bash
deno add jsr:@openelement/core
```

创建应用：

```bash
deno run -A jsr:@openelement/create my-app
cd my-app
deno task dev
```

## 快速示例

```tsx
/** @jsxImportSource @openelement/core */
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: { title: 'Hello openElement' },
  render() {
    return <main>Hello openElement</main>;
  },
});
```

## 当前版本线

全部 20 个 workspace 包已经统一到 **0.39.0**（`v0.39.0`），命名空间为
[`@openelement`](https://jsr.io/@openelement)。活动执行线也是 **v0.39.0**。JSR
publish 和 live registry visibility 根据 ADR-0097 作为 best-effort distribution
telemetry，不作为版本退出 gate。

v0.39.0 验证 generated Framework RC surface，并记录 ADR-0099 的四产品矩阵重置。
Web Awesome 不属于当前 UI target；Vue 是本线唯一计划的 heavy-framework island
adapter proof。

v1.0 目标是在 Elements、UI、Framework 和 Protocols 四个产品面上冻结稳定 API，
并用 workflow evidence 支撑发布 gate。

## 文档

| 主题              | 链接                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| 项目状态          | [docs/status/STATUS.md](./docs/status/STATUS.md)                                               |
| 路线图            | [docs/roadmap/ROADMAP.md](./docs/roadmap/ROADMAP.md)                                           |
| ADR               | [docs/adr/](./docs/adr/)                                                                       |
| v0.39 SOP         | [docs/sop/v0.39.0/README.md](./docs/sop/v0.39.0/README.md)                                     |
| v0.39 NextVersion | [docs/next/v0.39.0/](./docs/next/v0.39.0/)                                                     |
| 网站文档          | [openelement.org/docs](https://openelement.org/docs)                                           |
| API               | [openelement.org/guide/api](https://openelement.org/guide/api)                                 |
| 架构              | [openelement.org/architecture/architecture](https://openelement.org/architecture/architecture) |

## 贡献

参见 [CONTRIBUTING.md](./CONTRIBUTING.md)。架构决策在
[docs/adr/](./docs/adr/)，版本执行在 [docs/sop/](./docs/sop/)，活动执行包在
[docs/next/](./docs/next/)，当前状态在
[docs/status/STATUS.md](./docs/status/STATUS.md)。

## 许可

MIT
