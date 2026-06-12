# openElement

[English](./README.md) | 简体中文

**JSX-first、DSD-first Web Components 应用框架 (v0.37.6 current，Vite + Nitro Runtime Proof)。**
openElement 用 Declarative Shadow DOM、JSX/VNode 渲染、渐进式 islands、Hono 路由和可证明的发布门禁，构建静态优先应用。

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

## 为什么是 openElement

openElement 在服务端把 Web Components 渲染成 Declarative Shadow DOM。静态内容先以
HTML 到达浏览器，需要交互的部分再作为 island 按策略升级。

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: { title: 'Home' },
  render() {
    return <main>Hello openElement</main>;
  },
});
```

交互组件使用 `defineIsland()`：

```tsx
import { defineIsland } from '@openelement/app';
import { signal } from '@openelement/runtime';

const count = signal(0);

export default defineIsland(
  'my-counter',
  () => <button onClick={() => count.value++}>Count: {count.value}</button>,
);
```

v0.37.6 当前公开线的契约分层很明确：

- 应用编写：`definePage({ route, head, renderIntent, load, render, error })`、`defineIslandConfig()`、`defineIsland()`、`defineElement()`、`defineLayout()`
- 构建配置：从 `@openelement/app/vite` 导入 `openElement()`
- 渲染模型：JSX -> VNode -> RenderNode -> DSD HTML 或 DOM
- island metadata 字段：`export const openElement = defineIslandConfig(...)`
- UI 命名：`open-*`
- 信任边界：`trustedHtml` 用于已清洗或可信的非交互 HTML；页面 head 的原始片段必须显式放在 `head.dangerouslyHeadFragments`

## 包

20 个包统一对齐到 [`@openelement`](https://jsr.io/@openelement)，当前包线为
**v0.37.6**。本仓库的活动执行目标是 v0.38.0 产品表面重置。

| Package                  | Role                                   |
| ------------------------ | -------------------------------------- |
| `@openelement/create`    | 生成项目契约                           |
| `@openelement/app`       | JSX-first 应用编写 API                 |
| `@openelement/app/vite`  | `openElement()` Vite 配置入口          |
| `@openelement/runtime`   | component-authoring convenience facade |
| `@openelement/core`      | advanced DSD renderer 和 JSX kernel    |
| `@openelement/ui`        | `open-*` DSD 组件                      |
| `@openelement/protocols` | runtime-free protocol contracts        |

高级和内部包仍保留在 workspace graph 中。v0.38.0 产品地图把
`@openelement/adapter-vite`、`@openelement/content`、`@openelement/i18n`、
router、adapter、styling/signal 包放入高级参考文档；`@openelement/hub`、
`@openelement/ssg`、`@openelement/cem`、`@openelement/compat-check` 和
`@openelement/rpc` 不再作为主要 v1 产品表面。

## 文档

| Section | Link                                                                                           |
| ------- | ---------------------------------------------------------------------------------------------- |
| Guide   | [openelement.org/guide/getting-started](https://openelement.org/guide/getting-started)         |
| API     | [openelement.org/apilist](https://openelement.org/apilist)                                     |
| 架构    | [openelement.org/architecture/architecture](https://openelement.org/architecture/architecture) |

## 当前版本

v0.37.6 是当前 workspace 包线。v0.38.0 是活动执行线，目标是公开产品表面重置：
除非 ADR 批准新包名，否则保留现有包名；Hub 从主要 v1 产品地图中归档；
内部 build/tooling 包不再出现在 first-run 文档中。

## 贡献

参见 [CONTRIBUTING.md](./CONTRIBUTING.md)。架构决策在 [docs/adr/](./docs/adr/)，执行 SOP
在 [docs/sop/](./docs/sop/)，活动执行包在 [docs/next/](./docs/next/)，当前状态在
[docs/status/STATUS.md](./docs/status/STATUS.md)。

## 许可

<!-- Strategic docs anchor: v1.0 is the stable engine target -->

MIT
