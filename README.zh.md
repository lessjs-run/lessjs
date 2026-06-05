# openElement

[English](./README.md) | 简体中文

**JSX-first、DSD-first Web Components 应用框架 (v0.32.0)。** openElement 用
Declarative Shadow DOM、JSX/VNode 渲染、渐进式 islands、Hono 路由和可证明的发布门禁，构建静态优先应用。

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

export default definePage(() => {
  return <main>Hello openElement</main>;
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

v0.32.0 的公开契约分层很明确：

- 应用编写：`definePage()`、`defineIsland()`、`defineElement()`、`defineLayout()`
- 构建配置：从 `@openelement/app/vite` 导入 `openElement()`
- 渲染模型：JSX -> VNode -> RenderNode -> DSD HTML 或 DOM
- metadata 字段：`openElement`
- UI 命名：`open-*`
- 信任边界：`trustedHtml` 只用于已经清洗或可信的非交互 HTML

## 包

19 个包统一发布到 [`@openelement`](https://jsr.io/@openelement)，当前版本为
**v0.32.0**。

| Package                     | Role                                    |
| --------------------------- | --------------------------------------- |
| `@openelement/app`          | JSX-first 应用编写 API                  |
| `@openelement/app/vite`     | `openElement()` Vite 配置入口           |
| `@openelement/core`         | DSD renderer、DsdElement、JSX runtime   |
| `@openelement/adapter-vite` | Vite adapter、SSG pipeline、island 构建 |
| `@openelement/runtime`      | runtime convenience facade              |
| `@openelement/ui`           | `open-*` DSD 组件                       |
| `@openelement/content`      | Markdown、MDX、nav、blog、sitemap       |
| `@openelement/i18n`         | 多语言数据和静态路径助手                |
| `@openelement/hub`          | registry metadata 和验证                |

## 文档

| Section | Link                                                                                           |
| ------- | ---------------------------------------------------------------------------------------------- |
| Guide   | [openelement.org/guide/getting-started](https://openelement.org/guide/getting-started)         |
| API     | [openelement.org/apilist](https://openelement.org/apilist)                                     |
| 架构    | [openelement.org/architecture/architecture](https://openelement.org/architecture/architecture) |

## 当前版本

v0.32.0 把默认心智从“继承 runtime class”改成“编写 JSX 页面和 islands”。`DsdElement`
仍然是底层 runtime primitive，但应用作者从 `@openelement/app` 开始。

后续 minor 会继续推进 streaming/ISR、server routes、数据集成和 UI Shell 产品面，同时不重新打开
v0.30 已清理完成的 renderer contract。
v1.0 的目标是在 v0.31-v0.39 这条线被实现和门禁证明后，冻结稳定应用引擎。

## 贡献

参见 [CONTRIBUTING.md](./CONTRIBUTING.md)。架构决策在 [docs/adr/](./docs/adr/)，执行 SOP
在 [docs/sop/](./docs/sop/)，当前状态在 [docs/status/STATUS.md](./docs/status/STATUS.md)。

## 许可

MIT
