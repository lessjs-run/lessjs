# LessJS

[English](./README.md) | 简体中文

**DSD-first Web Components 应用框架** - LessJS 把标准优先的 DSD 渲染引擎、渐进式
Island、Hono API Route 和早期 Registry Hub 组合在一起，让 Web Components 成为一等公民。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-published-blue)](https://jsr.io/@lessjs/core)
[![@lessjs/core](https://img.shields.io/badge/jsr-v0.24.3-blue?label=@lessjs/core)](https://jsr.io/@lessjs/core)

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

项目线：**v0.24.3 Consolidation** — 全 gate 绿色，架构硬化完成。

### v0.24.x 核心变更

- **JSX + Signal 组件模型** — `render(): string | VNode`，Signal 通过 `effect()` 驱动响应式
- **`static props` 声明式属性** — ES2022 class fields，零编译器开关
- **TemplateResult 完全移除** — 旧 `html` template DSL、`@prop()` decorator 不复存在
- **跨包类型去重** — 12 个类型统一到 `@lessjs/core` 单一权威来源
- **全新文档** — JSX 组件指南、static props 指南、Signal 响应式指南、迁移指南
- **渲染器硬化** — Signal 在属性和 style 中自动解包，SVG namespace 支持
- **架构文档冻结** — `docs/arch/current-architecture.md` + `docs/reference/core-api-surface.md`

### 注意

> v0.24.3 起，JSX + `static props` + Signal 是唯一支持的组件编写模型。
> `render()` 返回 `string | VNode`。TemplateResult 已不复存在。

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

- **声明式构建管线** — v0.24.4: 三阶段硬编码 → 声明式 BuildPipeline API
- **类型安全路由参数** — v0.24.4: 构建时生成路由类型文件
- **Edge Full-Stack** — ISR handler、KV adapters 和部署指南
- **Hub 增长** — 更多真实 Web Component 包和更清晰的兼容性 badge

## 快速开始

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app
deno task dev
deno task build
```

要求：Deno 2.7+，以及支持 Declarative Shadow DOM 的现代浏览器。

## 包

| Package                   | 职责                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `@lessjs/core`            | DSD renderer、DsdElement、JSX runtime、islands、navigation、logger、error boundary |
| `@lessjs/adapter-vite`    | Vite 编排、路由扫描、SSG 管线、island entry 生成                                   |
| `@lessjs/adapter-lit`     | Lit adapter，主要保留给 island 和兼容路径                                          |
| `@lessjs/adapter-react`   | React adapter                                                                      |
| `@lessjs/adapter-vanilla` | Vanilla Web Component adapter                                                      |
| `@lessjs/app`             | 统一入口 `lessjs()`                                                                |
| `@lessjs/content`         | Blog、nav、sitemap 构建插件                                                        |
| `@lessjs/i18n`            | Locale 展开与路由辅助                                                              |
| `@lessjs/ui`              | DSD-native Web Components 与 island 示例                                           |
| `@lessjs/signals`         | Signals helpers 与 island effects                                                  |
| `@lessjs/compat-check`    | SSR 兼容性分类器（独立可用）                                                       |
| `@lessjs/cem`             | Custom Elements Manifest 解析器（独立可用）                                        |
| `@lessjs/style-sheet`     | 跨环境 CSSStyleSheet 抽象（独立可用）                                              |
| `@lessjs/rpc`             | Fetch-based RPC controller                                                         |
| `@lessjs/hub`             | Registry Hub schema、indexer、scanner、validator、snapshots                        |
| `@lessjs/create`          | 项目脚手架 CLI                                                                     |

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

| 版本  | 目标                                                          | 状态        |
| ----- | ------------------------------------------------------------- | ----------- |
| v0.15 | Renderer Kernel Protocol                                      | Done        |
| v0.16 | WC Package Protocol                                           | Done        |
| v0.17 | Ecosystem Entry + SSR Boundary                                | Done        |
| v0.18 | Universal WC Engine                                           | Done        |
| v0.19 | Registry Hub + Component Browser                              | Done        |
| v0.20 | Ocean-Island Architecture + DSD-native UI                     | Done        |
| v0.21 | Reactive DSD + Hardening — Core API / DSD / Adapter / Hub     | Done        |
| v0.22 | Architecture Integrity — boundaries / imports / gates         | Done        |
| v0.23 | Layered Package Architecture                                  | Done        |
| v0.24 | Consolidation — JSX+Signal, TemplateResult removal, hardening | **Current** |
| v0.26 | Framework Decoupling                                          | Planned     |
| v1.0  | Stable Engine contracts                                       | Vision      |

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
