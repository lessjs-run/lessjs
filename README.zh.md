# openElement

[English](./README.md) | 简体中文

**JSX-first、DSD-first Web Components 应用框架 (v0.37.2 current，SSR / ISR runtime contract active)。**
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

v0.37.2 当前公开线的契约分层很明确：

- 应用编写：`definePage({ route, head, renderIntent, load, render, error })`、`defineIslandConfig()`、`defineIsland()`、`defineElement()`、`defineLayout()`
- 构建配置：从 `@openelement/app/vite` 导入 `openElement()`
- 渲染模型：JSX -> VNode -> RenderNode -> DSD HTML 或 DOM
- island metadata 字段：`export const openElement = defineIslandConfig(...)`
- UI 命名：`open-*`
- 信任边界：`trustedHtml` 用于已清洗或可信的非交互 HTML；页面 head 的原始片段必须显式放在 `head.dangerouslyHeadFragments`

## 包

20 个包统一对齐到 [`@openelement`](https://jsr.io/@openelement)，当前包线为
**v0.37.2**。本仓库的活动执行目标是 v0.37.2 SSR / ISR Server Runtime Contract。

| Package                     | Role                                      |
| --------------------------- | ----------------------------------------- |
| `@openelement/app`          | JSX-first 应用编写 API                    |
| `@openelement/app/vite`     | `openElement()` Vite 配置入口             |
| `@openelement/core`         | DSD renderer、DsdElement、JSX runtime     |
| `@openelement/adapter-vite` | Vite adapter 和构建编排                   |
| `@openelement/ssg`          | SSG engine、route scanning、data resolver |
| `@openelement/runtime`      | runtime convenience facade                |
| `@openelement/ui`           | `open-*` DSD 组件                         |
| `@openelement/content`      | Markdown、MDX、nav、blog、sitemap         |
| `@openelement/i18n`         | 多语言数据和静态路径助手                  |
| `@openelement/hub`          | registry metadata 和验证                  |

## 文档

| Section | Link                                                                                           |
| ------- | ---------------------------------------------------------------------------------------------- |
| Guide   | [openelement.org/guide/getting-started](https://openelement.org/guide/getting-started)         |
| API     | [openelement.org/apilist](https://openelement.org/apilist)                                     |
| 架构    | [openelement.org/architecture/architecture](https://openelement.org/architecture/architecture) |

## 当前版本

v0.37.2 当前线把 SSG ownership 收敛到 `@openelement/ssg`，包括 route scanning、entry generation、generated data resolution、render 和 postprocess；adapter-vite 只保留 Vite orchestration。应用编写仍使用
`definePage({ route, head, renderIntent, load, render, error })`，island 静态元数据使用
`defineIslandConfig({ ssr, dsd, hydrate })`。

后续 minor 会继续推进 AutoFlow2、rendering/deploy、server/data/UI 产品闭环，同时不重新打开
v0.30 已清理完成的 renderer contract。v1.0 的目标是在 v0.31-v0.39 这条线被实现和门禁证明后，冻结稳定应用引擎。

## 贡献

参见 [CONTRIBUTING.md](./CONTRIBUTING.md)。架构决策在 [docs/adr/](./docs/adr/)，执行 SOP
在 [docs/sop/](./docs/sop/)，活动执行包在 [docs/next/](./docs/next/)，当前状态在
[docs/status/STATUS.md](./docs/status/STATUS.md)。

## 许可

MIT
