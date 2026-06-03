# LessJS

[English](./README.md) | 简体中文

**DSD-first Web Components 框架 (v0.29)。** 构建带真实 Shadow DOM 的静态站点，零 JS 开销，渐进式 Island。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-@lessjs/core-blue)](https://jsr.io/@lessjs/core)
[![CI](https://github.com/lessjs-run/lessjs/actions/workflows/test.yml/badge.svg)](https://github.com/lessjs-run/lessjs/actions/workflows/test.yml)

## 快速开始

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app && deno task dev
```

## 为什么选择 LessJS

LessJS 通过 **声明式 Shadow DOM（DSD）** 在服务端渲染 Web Components。浏览器原生解析 DSD——无需 hydration，静态内容零 JS。交互部分用 **Island** 实现：按策略加载的轻量组件。

```tsx
// routes/index/index.tsx
import { DsdElement } from '@lessjs/runtime';

export default class HomePage extends DsdElement {
  render() {
    return <h1>Hello LessJS</h1>;
  }
}
```

## 特性

- **DSD-first** — 服务端渲染 Shadow DOM，静态内容零 JS 开销
- **JSX + Signals** — React 风格开发体验，`alien-signals` 细粒度响应式
- **文件路由** — `app/routes/` 一比一映射到 URL
- **内置 SSG** — 构建时渲染、sitemap、PWA manifest，Deno 原生
- **渐进式 Island** — `client:load | idle | visible | only` 四种策略
- **Hono API Route** — 直接在路由树中嵌入 API
- **零打包开发** — `deno task dev:fast` 冷启动 ~100ms
- **框架无关** — Lit、React、Vanilla 均可作为 Island 使用

## 文档

| 章节     | 链接                                                                                 |
| -------- | ------------------------------------------------------------------------------------ |
| 教程     | [lessjs.com/guide/getting-started](https://lessjs.com/guide/getting-started)         |
| API 参考 | [lessjs.com/apilist](https://lessjs.com/apilist)                                     |
| 架构设计 | [lessjs.com/architecture/architecture](https://lessjs.com/architecture/architecture) |

## 包列表

| 包名                   | 版本    | 说明                                               |
| ---------------------- | ------- | -------------------------------------------------- |
| `@lessjs/core`         | v0.28.0 | DSD 渲染、DsdElement、JSX 运行时、Island、导航     |
| `@lessjs/adapter-vite` | v0.28.0 | Vite 插件：路由扫描、SSG 管线、Island 入口生成     |
| `@lessjs/ui`           | v0.28.0 | DSD 原生 UI 组件（button、card、input、dialog...） |
| `@lessjs/signals`      | v0.28.0 | Signal 原语（signal、computed、effect）            |
| `@lessjs/content`      | v0.28.0 | Blog、导航、Sitemap 构建插件                       |
| `@lessjs/i18n`         | v0.28.0 | 多语言、路由展开                                   |
| `@lessjs/create`       | v0.28.0 | 项目脚手架 CLI                                     |

[全部 19 个包 →](https://jsr.io/@lessjs)

## 参与贡献

参见 [CONTRIBUTING.md](./CONTRIBUTING.md)。架构决策记录在 [docs/adr/](./docs/adr/)。目标：**v1.0** 稳定引擎冻结。

## 许可证

MIT
