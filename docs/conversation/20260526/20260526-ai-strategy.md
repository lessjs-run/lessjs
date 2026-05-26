# LessJS AI 特化策略

> **日期**: 2026-05-26
> **结论**: MCP Server 是唯一值得投入的 AI 特化方向。不做 UI 生成，不做内嵌 LLM。

---

## 1. LessJS 的天然 AI 优势

三个架构特征让 LessJS 对 AI 比大多数框架更友好，不需要改任何代码：

### 1.1 单文件组件——AI 读一个文件就够

```
app/routes/index.ts     ← 一个文件 = 一个页面
  ├── import DsdElement       (依赖)
  ├── StyleSheet.replaceSync  (样式)
  ├── render() { html`...` }  (模板)
  └── customElements.define   (注册)
```

Next.js 的 `layout.tsx` + `page.tsx` + `loading.tsx` + `error.tsx` 模式让 AI 要跨 4 个文件拼上下文。LessJS 的单文件模式意味着 **一次 read 就能理解整个组件的完整语义**。

### 1.2 CEM 已内置结构描述

`@lessjs/core` 有完整的 Custom Element Manifest 类型体系——每个组件的 tagName、props、slots、events 是声明式可查询的。这是 AI 理解项目的天然数据源，不需要额外构建。

### 1.3 纯 TS，无 DSL

`html\`\`` 是标准 Tagged Template Literal，render() 返回 string。没有 Svelte 编译器魔术、没有 JSX `.tsx` 语法、没有 Vue SFC `<template>` 标签。AI 最擅长 TypeScript，不会在框架特有语法上犯错。

---

## 2. 为什么不做 v0 式的 UI 生成

v0.dev 是 Vercel 的 AI UI 生成工具，输入描述，输出 React + Tailwind 代码。

| v0 的护城河 | LessJS 的现实 |
|------------|-------------|
| React 生态训练数据海量 | WC/DSD 训练数据极少 |
| 视觉即时预览 | 需要先 build 再预览 |
| Vercel 自研模型 fine-tune | 个人开发者没有这个资源 |
| Tailwind 是 Vercel 生态 | LessJS 用 Open Props |

这是 React 的战场，不需要去那里打。LessJS 的价值不在"AI 猜 UI 外观更好看"，而在 **"AI 理解 WC/DSD 框架更精准"**。

---

## 3. MCP Server 方案

### 3.1 现状

目前 AI 工具（Cursor/Copilot/Claude）在处理 LessJS 项目时：
- 完全靠训练数据猜测 API
- 不知道项目里有哪些已有组件可复用
- 不会正确用 DsdElement + StyleSheet + signal 的范式
- 经常编造不存在的 @lessjs/* 导出

### 3.2 MCP 能做什么

```
AI 询问                          MCP 响应
─────────────────────────────────────────────────
"有哪些组件？"          →  返回 CEM manifest 的组件列表 + props/slots/events
"/blog/:slug 接受什么参数？" → 返回路由签名 + 参数类型
"signal API 怎么用？"    →  返回 WritableSignal<T> 的类型定义
"项目的设计 tokens 是什么？" → 返回 Open Props 变量清单
"生成一个 counter 组件"    →  基于 CEM schema 生成正确的 DsdElement 模板
```

### 3.3 架构

```
@lessjs/mcp (新包)
  ├── tools/
  │   ├── get-components.ts       → 读取 CEM manifest
  │   ├── get-routes.ts           → 扫描 app/routes/
  │   ├── get-signals-api.ts      → 读取 @lessjs/core 类型定义
  │   ├── get-design-tokens.ts    → 读取 Open Props 变量
  │   └── analyze-project.ts      → 诊断死路由、未注册组件
  └── index.ts                    → MCP Server 入口
```

数据源全部已有（CEM + route scanner + API types + Open Props），只是缺 MCP 协议包装。

### 3.4 为什么这是蓝海

| 框架 | 有 MCP Server？ |
|------|:---:|
| Next.js | ❌ |
| Nuxt | ❌ |
| Astro | ❌ |
| SvelteKit | ❌ |
| Remix | ❌ |
| **LessJS** | 🟢 如果做就是唯一 |

所有框架都有组件描述数据，但**没有一个人把它包装成 MCP**。先做的那个定义 AI 集成的标准。LessJS 的三个天然优势（单文件 + CEM + 纯 TS）让这个工作比竞品更简单。

---

## 4. 不做的事

| 方向 | 为什么不 |
|------|---------|
| AI 驱动的 UI 生成 | v0.dev 已占住 React 生态，WC 训练数据太少 |
| 内嵌 LLM 上下文管理 | 那是模型层的事，框架不该管 |
| 框架内置 prompt template | Anthropic/OpenAI 自己的 system prompt 就是标准，框架不需要抢这个 |
| AI 驱动路由/数据层 | 过度工程，实际需求小 |

---

## 5. 优先级

| 优先级 | 事项 | 说明 |
|:---:|------|------|
| P2 | `.lessjs/ai-context.json` | 构建时自动生成组件清单 + API 引用，50 行附带产物 |
| P2 | `less generate` CLI | AI 可调用的脚手架命令 |
| P3 | `@lessjs/mcp` | MCP Server——AI 特化的最终形态 |
| 绝不做 | UI 生成 / 内嵌 LLM / AI 路由 | — |

MCP Server 放 P3 不是因为不重要，而是因为 v0.22 的首要目标是架构债清理 + Signals 客体化 + 消费者体验。基础设施先稳，AI 特化是锦上添花不是雪中送炭。

---

## 6. 一句话策略

**LessJS 的 AI 特化不是"让 AI 画 UI"，而是"让 AI 懂 LessJS"。** 通过 MCP Server 把 CEM + route scanner + API types 暴露给 AI，成为 WC/DSD 生态中第一个原生的 AI-ready 框架。
