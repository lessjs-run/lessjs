# LessJS

[简体中文](./README.md) | [English](./README.en.md)

LessJS 是一个 Deno-first 的静态站点框架，以 **Declarative Shadow DOM + Island 架构** 让 HTML 先于 JavaScript 存在。

不隐藏 Web 平台——让平台本身更好用。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deno](https://img.shields.io/badge/Deno-2.7%2B-000000)](https://deno.com/)
[![JSR](https://img.shields.io/badge/JSR-published-blue)](https://jsr.io/@lessjs/core)
[![@lessjs/core](https://img.shields.io/jsr/v/@lessjs/core?label=core&style=flat-square)](https://jsr.io/@lessjs/core)
[![@lessjs/ui](https://img.shields.io/jsr/v/@lessjs/ui?label=ui&style=flat-square)](https://jsr.io/@lessjs/ui)

---

## 架构

```
                   ┌── @lessjs/app (统一入口)
                   │
         ┌─────────┼─────────┐
         ▼         ▼         ▼
   adapter-vite   content    i18n
   (构建编排)     (内容插件)  (国际化)
         │
         ▼
    @lessjs/core (纯运行时)
         │
    ┌────┼────┬────┬────┐
    │    │    │    │    │
  adapter-lit  ui  signals  rpc  create
  (Lit适配器)  (组件) (响应式)  (RPC)  (脚手架)
```

### 核心包

| 包 | 版本 | 职责 | 外部依赖 |
|---|------|------|---------|
| `@lessjs/core` | 0.13.0 | DSD 渲染、Island、Navigation、日志 | parse5（唯一） |
| `@lessjs/adapter-vite` | 0.3.0 | Vite 构建：路由扫描、Island Transform、SSG 三阶段 | vite, hono, esbuild |
| `@lessjs/adapter-lit` | 0.8.0 | Lit TemplateResult → DSD HTML | lit |
| `@lessjs/content` | 0.3.3 | Blog + Nav + Sitemap 构建时插件 | marked, gray-matter |
| `@lessjs/i18n` | 0.1.1 | 国际化 locale 展开 | 无 |
| `@lessjs/app` | 0.3.1 | 伞包：lessjs() = less() + content + i18n | — |
| `@lessjs/ui` | 0.7.1 | 8 个 Web Component（layout, button, input…） | lit |
| `@lessjs/signals` | 0.6.2 | TC39 Signals polyfill + framework layer | 无 |
| `@lessjs/rpc` | 0.6.1 | 零依赖 fetch RPC 控制器 | 无 |
| `@lessjs/create` | 0.7.0 | 脚手架 CLI | 无 |

### 渲染管线

```
Route module (Web Component / LitElement)
  → render() → string / TemplateResult
  → renderDSD() → L2 嵌套 DSD HTML（parse5 AST 递归）
  → SSG 输出: static HTML + inline DSD templates
  → 浏览器: 原生 DSD 附加 → Custom Element 升级
  → DSD Hydration: 跳过重渲染，仅绑定事件
  → Island chunk 按需加载（4 策略: eager / lazy / visible / idle）
```

**DSD Hydration**：浏览器原生解析 `<template shadowrootmode>` 后，Lit 组件检测已有 shadow root 并跳过 `render()`，避免重复内容。仅需绑定事件的组件通过 `WithDsdHydration` Mixin 声明式注册 `hydrateEvents`。

### SSG 构建管线

```
Phase 1: less() Vite Plugin
  → 路由扫描 + Island 扫描
  → 生成 virtual:less-hono-entry（Hono 应用代码）
  → closeBundle() 触发 Phase 2/3

Phase 2: buildClient()
  → 生成 virtual:less-client-entry
  → viteBuild() islands → dist/client/islands/*.js

Phase 3: buildSSG()
  → 生成 virtual:less-ssg-entry
  → viteBuild(ssr:true, noExternal) → SSR bundle
  → 加载 bundle → Hono toSSG() → static HTML
  → 后处理: client script, View Transitions, Speculation Rules, CSP, DSD polyfill, PWA
```

---

## 快速开始

```bash
# 安装
deno run -A jsr:@lessjs/create my-app
cd my-app

# 开发
deno task dev

# 构建（SSG 三阶段）
deno task build
```

要求：
- Deno 2.7+
- 支持 Declarative Shadow DOM 的现代浏览器

---

## 架构决策（ADR）

LessJS 的架构通过 [Architecture Decision Records](/blog/) 驱动。关键决策：

| ADR | 决策 |
|-----|------|
| 0017 | core 纯运行时 / adapter-vite 构建编排分离 |
| 0018 | 虚拟模块替代模块状态（零 bridge） |
| 0019 | @deno/vite-plugin 替代 20 条 resolve.alias + 静态内容页 |
| 0021 | API 表面收敛 + Phase branded type 校验 + core-Vite 分离 |

---

## 从 v0.12 到 v0.13 的变化

- **Core API 收敛**: 18 个导出 → 6 个。`./render-dsd`、`./html-escape` 等内部实现不再暴露
- **ssr-handler.ts 删除**: 纯 re-export facade，消费者改用 `@lessjs/core`
- **core-Vite 分离**: 虚拟模块 ID 迁至 `@lessjs/adapter-vite/virtual-ids`
- **Phase 编译器校验**: `Phase1Token` / `Phase2Token` / `Phase3Token` 品牌类型
- **CI 覆盖率**: 所有测试 job 加 `--coverage`
- **零 barrel**: 删除 `content/src/nav/types.ts` 和 `sitemap/types.ts`
- **islandEffect 优化**: setInterval 5000ms → 30000ms
- **@lessjs/app 测试**: 从 0 到 16 个

详见 [Release Notes](https://github.com/lessjs-run/lessjs/releases)。

---

## License

MIT
