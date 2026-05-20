# LessJS

[English](./README.en.md) | 简体中文

**全栈框架 + 通用 WC 渲染引擎 + Registry Hub** — 以 Web Components 为一等公民的全栈开发平台。基于 Declarative Shadow DOM 的零 JS 首屏渲染，Island 架构按需升级交互，Hono + Serverless API 提供后端能力，Registry Hub 一键发现和安装 WC 组件。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-published-blue)](https://jsr.io/@lessjs/core)
[![@lessjs/core](https://img.shields.io/jsr/v/@lessjs/core?label=@lessjs/core)](https://jsr.io/@lessjs/core)

## 三支柱架构

```
LessJS
│
├── 1. 全栈框架
│   ├── 文件约定路由 + Hono API Route
│   ├── 开发服务器（Vite HMR + Hono）
│   ├── 构建管线（SSG / ISR / SSR 同一套渲染引擎）
│   └── Serverless 部署（CF Pages / Deno Deploy）
│
├── 2. 通用 WC 渲染引擎
│   ├── DSD 字符串渲染（renderDSD — 纯字符串拼接）
│   ├── 多框架适配器（Lit / React / Vanilla → Vue）
│   ├── 渲染时机无关（build-time / ISR / request-time）
│   └── 兼容性分类 + 验证
│
└── 3. Registry Hub
    ├── 包发现 + 搜索 + 兼容性验证
    ├── 组件预览渲染（Playwright snapshots）
    └── 一键安装（less add）
```

**不是 SSG 框架** — SSG 只是渲染引擎的当前使用模式。`renderDSD()` **架构上**是渲染时机无关的：build-time (SSG)、cache-expiry-time (ISR)、request-time (SSR) 用的是同一套引擎。**当前实现**: SSG only, ISR/SSR 计划中。

## 特性

### 支柱 1：全栈框架

> ⚠️ 早期阶段：路由、开发服务器和 API Route 已可用。Hydration 策略、ISR 和 SSR 计划在 v0.20 实现。

- **文件约定路由** — `app/routes/` 自动扫描 + Hono 挂载
- **API Route** — `app/routes/api/*.ts` → Hono sub-app，Serverless 部署
- **Hono 运行时** — Fetch API 对齐，Deno / Node / Edge 多运行时
- **ISR (计划中)** — stale-while-revalidate 缓存层，`renderDSD()` ~1-5ms 天然匹配

### 支柱 2：通用 WC 渲染引擎

- **Declarative Shadow DOM** — WHATWG 标准，零 JS 首屏
- **Island 升级** — 仅交互组件加载客户端 JS（`client:load/idle/visible/only` — 计划中）
- **多适配器** — Lit / React / Vanilla 适配器，同一页面多框架共存
- **Universal WC Engine** — 自动检测第三方 Web Component，4 级兼容性分类
- **Renderer Protocol** — 结构化渲染输出 + 错误分类 + DSD 指标

### 支柱 3：Registry Hub（Early Access）

- **包搜索 + 过滤** — 发现兼容的 Web Component 库
- **兼容性验证 + 报告** — 安装前检查 SSR 能力
- **组件预览** — Playwright 渲染真实组件快照
- **一键安装** — `less add @scope/pkg` 自动配置

### 通用

- **Deno workspace** — 纯 ESM，零 `package.json`
- **validate-manifest CLI** — 安装前验证 CEM manifest 兼容性
- **less add 安全安装** — dry-run + 验证门禁 + 计划生成

## 快速开始

```bash
deno run -A jsr:@lessjs/create my-app
cd my-app
deno task dev      # 开发服务器
deno task build    # SSG 构建
```

要求：Deno 2.7+ / 支持 Declarative Shadow DOM 的现代浏览器

## 包

| 包                        | 职责                                                                   |
| ------------------------- | ---------------------------------------------------------------------- |
| `@lessjs/core`            | DSD 渲染器、Renderer Protocol、CEM 解析器、兼容性分类器、manifest 验证 |
| `@lessjs/adapter-vite`    | Vite 编排、路由扫描、SSG 管线、CEM 自动检测                            |
| `@lessjs/adapter-lit`     | Lit TemplateResult → DSD HTML                                          |
| `@lessjs/adapter-react`   | React 适配器                                                           |
| `@lessjs/adapter-vanilla` | Vanilla JS 适配器                                                      |
| `@lessjs/app`             | 统一入口 `lessjs()`                                                    |
| `@lessjs/content`         | Blog、Nav、Sitemap 插件                                                |
| `@lessjs/i18n`            | 国际化路由                                                             |
| `@lessjs/ui`              | Web Components 组件库                                                  |
| `@lessjs/signals`         | Signals 辅助                                                           |
| `@lessjs/rpc`             | Fetch RPC                                                              |
| `@lessjs/hub`             | Registry Hub — schema、indexer、scanner、snapshot-renderer             |
| `@lessjs/create`          | 项目脚手架 CLI                                                         |

## 渲染管线

```
render() → RenderAdapter → renderDSD() → DSD HTML → 浏览器解析
                                                       ↓
                                            customElements.upgrade()
                                                       ↓
                                            dsd-interactive → 绑定 hydrateEvents
```

**渲染时机无关**：同一套 `renderDSD()` 引擎在不同时机调用：

| 模式          | 何时调用 renderDSD() | 数据新鲜度        | 需要服务器   |
| ------------- | -------------------- | ----------------- | ------------ |
| SSG（当前）   | build 时             | 构建时快照        | ❌           |
| ISR（计划中） | 缓存过期时           | 可配置 stale 时间 | ✅ edge fn   |
| SSR（远期）   | 每次请求             | 实时              | ✅ always-on |

## 第三方包兼容性管线 (v0.18.x)

```
node_modules/*/custom-elements.json → CEM Parser → 4级分类器 → SSR admission
                                                          ↓
                                              less validate-manifest (CLI)
                                                          ↓
                                              less add (安全安装)
```

## 对标定位

| 维度         | LessJS                 | Astro          | Fresh          | Next.js       |
| ------------ | ---------------------- | -------------- | -------------- | ------------- |
| **定位**     | 全栈 + WC引擎 + Hub    | 全栈（多框架） | 全栈（Preact） | 全栈（React） |
| **WC 原生**  | ✅ DSD 一等公民        | ❌ 当普通元素  | ❌ Preact-only | ❌            |
| **首屏 JS**  | 0 KB                   | 0 KB           | ~23 KB         | ~90 KB        |
| **跨框架**   | Lit/React/Vanilla 共存 | 多框架共存     | Preact only    | React only    |
| **Registry** | ✅ Hub 内建            | ❌             | ❌             | ❌            |
| **后端**     | Hono + Serverless      | 内置           | Oak            | 内置          |

**核心差异化**：LessJS 以 DSD 和 Web Components 作为首要渲染契约，而非在框架特定组件模型之上叠加优化。

## 路线图

| 版本  | 目标                                 | 状态      |
| ----- | ------------------------------------ | --------- |
| v0.15 | Renderer Kernel Protocol             | ✅ 完成   |
| v0.16 | WC Package Protocol                  | ✅ 完成   |
| v0.17 | Ecosystem Entry + SSR 边界           | ✅ 完成   |
| v0.18 | Universal WC Engine                  | ✅ 完成   |
| v0.19 | **Registry Hub + Component Browser** | **当前**  |
| v0.20 | Islands 策略 + 全栈地基              | 📋 计划中 |
| v0.21 | 全栈框架成型（ISR + Vue + Supabase） | 📋 计划中 |
| v1.0  | API Freeze                           | 🚀 远期   |

详见 [ADR 文档](docs/adr/) 和 [官方文档](https://lessjs.org)。

## 治理文档

```
docs/
├── adr/           架构决策记录
├── changelog/     版本变更日志
├── conventions/   编码规范
├── sop/           标准作业流程
└── status/        项目状态 + 审核归档
```

## 贡献

参见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## License

MIT
