# openElement

[English](./README.md) | 简体中文

**JSX-first Web Components 平台。当前包线：`0.40.0`（`v0.40.0`）。当前执行线：`v0.40.0` Elements + Preact + Repository Slimming。**

openElement 用 Web Components、JSX/VNode 渲染、渐进式 islands、API routes，以及 Vite + Nitro 输出构建静态优先应用。Shadow/DSD 是默认组件渲染模式；light DOM 是显式 opt-in。

强制项目流程：[docs/governance/PROJECT_WORKFLOW.md](./docs/governance/PROJECT_WORKFLOW.md)。

## 快速开始

```bash
deno run -A jsr:@openelement/create my-app
cd my-app
deno task dev
```

## 产品矩阵

```text
openElement = Elements + UI + Framework + Protocols
```

| 产品      | Surface                                   | 角色                                                               |
| --------- | ----------------------------------------- | ------------------------------------------------------------------ |
| Elements  | `@openelement/elements`, `OpenElement`    | 原生 Web Components authoring facade。                             |
| UI        | `@openelement/ui`                         | 基于 Elements 模型的一方 `open-*` 组件库。                         |
| Framework | `@openelement/app`, `@openelement/create` | 页面、布局、islands、API routes、Vite + Nitro build/runtime 输出。 |
| Protocols | `@openelement/protocols`                  | Runtime-free 的可替换边界和 conformance contracts。                |

v0.40.x 当前 workspace 收敛为 11 个包。Hub、RPC、CEM、compat-check、Lit/React/vanilla interop adapters、独立 runtime/style-sheet/ssg 包已退出当前包图；历史细节保留在 git history 和 release evidence 中。

v1.0 目标是稳定的四产品平台，冻结 Elements、UI、Framework、Protocols 的公开契约。

## 示例

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

组件作者优先使用 `@openelement/elements`：

```tsx
import { DsdElement, signal, StyleSheet } from '@openelement/elements';
```

## 文档

| 主题         | 链接                                                                 |
| ------------ | -------------------------------------------------------------------- |
| 项目状态     | [docs/status/STATUS.md](./docs/status/STATUS.md)                     |
| 路线图       | [docs/roadmap/ROADMAP.md](./docs/roadmap/ROADMAP.md)                 |
| 当前版本计划 | [docs/current/VERSION_PLAN.md](./docs/current/VERSION_PLAN.md)       |
| 包表面       | [docs/current/PACKAGE_SURFACE.md](./docs/current/PACKAGE_SURFACE.md) |
| ADR          | [docs/adr/](./docs/adr/)                                             |

## 许可

MIT
