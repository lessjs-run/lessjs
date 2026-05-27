# LessJS

简体中文 | [English](./README.en.md)

**DSD-first Web Components 应用框架** - LessJS 把标准优先的 DSD 渲染引擎、渐进式
Island、Hono API Route 和早期 Registry Hub 组合在一起，让 Web Components 成为一等公民。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-published-blue)](https://jsr.io/@lessjs/core)
[![@lessjs/core](https://img.shields.io/badge/jsr-v0.24.0-blue?label=@lessjs/core)](https://jsr.io/@lessjs/core)

## 海洋-岛屿架构

```
┌──────────────────────────────────────────┐
│               海洋（~80%）                 │
│   DSD 组件 → SSR 渲染 Shadow DOM          │
│   → 浏览器原生解析，零 JS 可见            │
│   → DsdElement 水合：只绑事件，不动 DOM  │
│   → 框架无关，纯原生 HTMLElement           │
│                                            │
│   ┌──────────────────────────────────┐    │
│   │         岛屿（~20%）              │    │
│   │  Pure Island → 客户端渲染         │    │
│   │  → 需要 reactivity                │    │
│   │  → 按需选框架: Lit/FAST/Preact   │    │
│   │  → 策略: eager/lazy/visible/idle │    │
│   └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

**核心理念**：海洋不需要 reactivity（DOM 已在 SSR 中渲染完毕），岛屿才需要。别的框架海洋是"裸 HTML"，LessJS 的海洋是"封装好的 Web Components"。

## 当前状态

项目线：**v0.24.0 DX Leap**。

### v0.24.0 新增

- **`@prop()` 装饰器** — 响应式属性声明从 10+ 行降到 1 行
- **模板助手** — `classMap`/`when`/`choose`/`repeat`/`ref` + 模板缓存
- **统一错误架构** — LessError 层级 + ErrorBoundary + telemetry
- **单入口** — 所有组件作者从 `@lessjs/runtime` 一个包 import

### 基础能力

当前生产渲染模式是 **SSG + Declarative Shadow DOM**。`renderDSD()` 的架构设计允许
未来在缓存过期时运行 ISR，或在请求时运行 SSR，但 ISR/SSR 仍是路线图能力，不应写成已发布保证。

全部包已统一到 v0.23.0，确保 JSR 发布包解析为同一套版本。v0.21.x 硬化线已完成：Core API 收紧、DSD 证据补强、
Adapter 架构清理、Hub trust gate 加固。CI 配备 11 道 SOP 门禁 + CodeQL 安全扫描 +
3 个 Copilot 自定义 Agent。

## 三个产品支柱

```text
LessJS
|
+-- 1. 应用框架
|   +-- 文件约定路由
|   +-- Hono API Route
|   +-- Vite dev server 与 SSG build
|   +-- 面向 serverless 的部署模型
|
+-- 2. DSD/WC 渲染引擎
|   +-- DsdElement, renderDSD(), StyleSheet
|   +-- Declarative Shadow DOM 输出
|   +-- Lit / React / Vanilla 适配器
|   +-- 兼容性准入与 dsd-report.json
|
+-- 3. Registry Hub
    +-- 包发现
    +-- 兼容性报告与快照
    +-- validation-gated less add workflow
```

## 已发布能力

- **DSD-first 渲染** - SSR-capable 组件输出 `<template shadowrootmode="open">`。
- **DsdElement** - 零依赖 `HTMLElement` 基类，用于 DSD-native Web Components。
- **SSR-safe StyleSheet** - 浏览器与 Deno/Node 构建都可用的样式表抽象。
- **Ocean-Island UI 模型** - 大部分 UI 是 DSD-native ocean 组件，复杂交互保留在 island。
- **Hono API Route** - 基础 API route 已接入应用路由树。
- **Registry evidence pipeline** - Hub record、包验证、快照、`less add` 已形成早期基础设施。
- **发布门禁** - fmt、lint、typecheck、test、build、e2e、audit、Hub 验证和 DSD report gate。

## 下一步

- **Architecture Integrity** - 清理消费者 import surface、包边界、adapter-vite 拆分和质量门禁。
- **Signals facade** - 保留 LessJS 自有 API，隔离底层 signal engine。
- **Validation ownership** - 统一 Hub、CEM、manifest 和 submission gate 的类型与诊断边界。
- **Edge Full-Stack after cleanup** - ISR handler、KV adapters 和部署指南顺延到架构清偿之后。
- **Hub 增长** - 更多真实 Web Component 包和更清晰的兼容性 badge。

## 快速开始

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app
deno task dev
deno task build
```

要求：Deno 2.7+，以及支持 Declarative Shadow DOM 的现代浏览器。

## 包

| Package                   | 职责                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `@lessjs/core`            | DSD renderer、DsdElement、StyleSheet、renderer protocol、CEM parser、compatibility classifier |
| `@lessjs/adapter-vite`    | Vite 编排、路由扫描、SSG 管线、island entry 生成                                              |
| `@lessjs/adapter-lit`     | Lit adapter，主要保留给 island 和兼容路径                                                     |
| `@lessjs/adapter-react`   | React adapter                                                                                 |
| `@lessjs/adapter-vanilla` | Vanilla Web Component adapter                                                                 |
| `@lessjs/app`             | 统一入口 `lessjs()`                                                                           |
| `@lessjs/content`         | Blog、nav、sitemap 构建插件                                                                   |
| `@lessjs/i18n`            | Locale 展开与路由辅助                                                                         |
| `@lessjs/ui`              | DSD-native Web Components 与 island 示例                                                      |
| `@lessjs/signals`         | Signals helpers 与 island effects                                                             |
| `@lessjs/compat-check`    | SSR 兼容性分类器（独立可用）                                                                  |
| `@lessjs/cem`             | Custom Elements Manifest 解析器（独立可用）                                                   |
| `@lessjs/style-sheet`     | 跨环境 CSSStyleSheet 抽象（独立可用）                                                         |
| `@lessjs/rpc`             | Fetch-based RPC controller                                                                    |
| `@lessjs/hub`             | Registry Hub schema、indexer、scanner、validator、snapshots                                   |
| `@lessjs/create`          | 项目脚手架 CLI                                                                                |

## 渲染时机无关

```text
route component
  -> renderDSD()
  -> <template shadowrootmode="open">
  -> browser parses DSD
  -> custom element upgrade
  -> @click binding / island runtime only where needed
```

| Mode | 状态   | 渲染时机      | 服务器要求                |
| ---- | ------ | ------------- | ------------------------- |
| SSG  | 已发布 | build time    | 构建后不需要              |
| ISR  | v0.24+ | cache expiry  | edge/serverless function  |
| SSR  | 后续   | every request | always-on request runtime |

## 兼容性边界

LessJS 不承诺任意 Web Component 都能自动 SSR。每个组件应该得到一个确定结果：

- 通过声明 adapter 或验证过的包契约进入 SSR/SSG
- 需要浏览器 API 时降级为 client-only
- metadata 无效或不安全时在生成构建产物前拒绝

## 路线图

| 版本  | 目标                                                      | 状态    |
| ----- | --------------------------------------------------------- | ------- |
| v0.15 | Renderer Kernel Protocol                                  | Done    |
| v0.16 | WC Package Protocol                                       | Done    |
| v0.17 | Ecosystem Entry + SSR Boundary                            | Done    |
| v0.18 | Universal WC Engine                                       | Done    |
| v0.19 | Registry Hub + Component Browser                          | Done    |
| v0.20 | Ocean-Island Architecture + DSD-native UI                 | Done    |
| v0.21 | Reactive DSD + Hardening — Core API / DSD / Adapter / Hub | Done    |
| v0.22 | Architecture Integrity — boundaries / imports / gates     | Done    |
| v0.23 | Layered Package Architecture                              | Current |
| v0.24 | Edge Full-Stack — ISR + KV adapters + Deploy              | Planned |
| v0.25 | Ecosystem Hardening                                       | Planned |
| v1.0  | Stable Engine contracts                                   | Vision  |

详见 [ADR docs](docs/adr/)、[SOP docs](docs/sop/) 和
[Roadmap](docs/roadmap/ROADMAP.md)。

## 治理文档

```text
docs/
+-- adr/        architecture decision records
+-- changelog/  version changelogs
+-- sop/        standard operating procedures
+-- status/     project status and review archive
+-- roadmap/    version planning
```

## 贡献

参见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## License

MIT
