# KISS — Keep It Simple, Stupid

> **KISS Architecture**: Knowledge · Isolated · Semantic · Static
> 融合 Jamstack 部署模型与声明式岛屿交互范式的全栈架构风格。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/SisyphusZheng/kiss/actions/workflows/test.yml/badge.svg)](https://github.com/SisyphusZheng/kiss/actions/workflows/test.yml)
[![JSR](https://img.shields.io/badge/@kissjs/core-0.3.4-083344?logo=jsr)](https://jsr.io/@kissjs/core)
[![JSR](https://img.shields.io/badge/@kissjs/ui-0.4.0-083344?logo=jsr)](https://jsr.io/@kissjs/ui)
[![JSR](https://img.shields.io/badge/@kissjs/rpc-0.2.5-083344?logo=jsr)](https://jsr.io/@kissjs/rpc)
[![JSR](https://img.shields.io/badge/@kissjs/create-0.3.4-083344?logo=jsr)](https://jsr.io/@kissjs/create)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF)](https://vitejs.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.x-E36002)](https://hono.dev/)
[![Lit](https://img.shields.io/badge/Lit-3.x-325CFF)](https://lit.dev/)
[![Deno](https://img.shields.io/badge/Deno-2.x-000000)](https://deno.land/)

## 快速开始

```bash
deno run -A jsr:@kissjs/create my-app
cd my-app
deno task dev
```

## 包

| 包                                              | 版本                                                       | 说明                                       |
| ----------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| [@kissjs/core](https://jsr.io/@kissjs/core)     | ![JSR](https://img.shields.io/badge/0.3.4-083344?logo=jsr) | 核心框架 — Vite 插件 + Lit/Hono re-export  |
| [@kissjs/ui](https://jsr.io/@kissjs/ui)         | ![JSR](https://img.shields.io/badge/0.4.0-083344?logo=jsr) | UI 组件库 — kiss-layout, kiss-hero-ping 等 |
| [@kissjs/rpc](https://jsr.io/@kissjs/rpc)       | ![JSR](https://img.shields.io/badge/0.2.5-083344?logo=jsr) | RPC 客户端 — Lit ReactiveController        |
| [@kissjs/create](https://jsr.io/@kissjs/create) | ![JSR](https://img.shields.io/badge/0.3.4-083344?logo=jsr) | 项目脚手架                                 |

> JSR 上有旧包 `@kissjs/vite` 和 `@kissjs/ssg`，已废弃，请勿使用。

## 架构

| 字母  | 约束              | 含义                                                  |
| ----- | ----------------- | ----------------------------------------------------- |
| **K** | Knowledge（知识） | 所有内容在构建时预渲染为语义 HTML 静态文件            |
| **I** | Isolated（隔离）  | 客户端 JS 只能存在于 Island Shadow DOM 内             |
| **S** | Semantic（语义）  | Island 包裹原生 HTML 元素，禁用 JS 时提供等价基线功能 |
| **S** | Static（静态）    | 构建产物为纯静态文件，零运行时进程                    |

## 实际上需要多少 JS？

**零框架 JS，~400B 基础设施。**

| 场景           | 大小     |
| -------------- | -------- |
| 零交互页面     | ~400 B * |
| 单 Island 页面 | ~3-7 KB  |
| 多 Island 页面 | 按需叠加 |

*主题初始化 + Service Worker 注册，不可消除的 L2 平台基础设施。

对比：Fresh ~1 KB 页面加载器，Nuxt ~60 KB，Next.js ~70 KB。

## 技术栈

| 层     | 技术          | 用途                                 |
| ------ | ------------- | ------------------------------------ |
| 运行时 | Deno          | 首选运行时                           |
| HTTP   | Hono          | 构建时路由 + dev server + API Routes |
| UI     | Lit           | Web Component 渲染引擎               |
| Build  | Vite          | 构建工具                             |
| SSR    | @lit-labs/ssr | 构建时渲染 + DSD 输出                |
| 类型   | TypeScript    | 端到端类型安全                       |

## 文档

[完整文档站](https://kiss.js.org/) — 含博客、Demo、API 文档

## 当前状态

v0.4.0 — Serverless Integration Milestone。完整 SSG + Islands + DSD + PWA + Serverless API。

## License

MIT

---

KISS — Keep It Simple, Stupid / K·I·S·S Architecture
