# v0.26.0 Product Requirement Document

> **版本**: v0.26.0\
> **版本主题**: Framework Decoupling（框架-Vite 解耦）\
> **状态**: PLANNING\
> **Date**: 2026-05-29\
> **前置版本**: v0.25.0 — Declarative DX + Full Architecture Debt Consolidation\
> **关联 ADR**: ADR-0061\
> **Language**: 中文\
> **Programming Language**: TypeScript (Deno + Vite)

---

## 1. 项目信息

| 字段     | 值                                 |
| -------- | ---------------------------------- |
| 项目名称 | `lessjs_v026_framework_decoupling` |
| 版本号   | v0.26.0                            |
| 编程语言 | TypeScript                         |
| 运行时   | Deno                               |
| 构建工具 | Vite（仅用于生产构建）             |
| 目标平台 | Deno / Node / Bun / Edge           |

### 原始需求复述

移除框架层与 Vite 虚拟模块之间的耦合。当前有 3 类 Vite 虚拟模块（`virtual:less-nav`、`virtual:less-blog-data`、`virtual:less-i18n-data`）被 60+ 个路由文件和框架生成代码使用。这些虚拟模块使框架层依赖 Vite 构建工具，与 LessJS 的"Web Standards-first, 零构建工具依赖"愿景矛盾。

### 范围说明

本版本**只做解耦，不做功能新增**。所有用户可见的运行时行为应保持不变。变更只涉及 import 路径、包导出结构、和构建插件的职责收缩。

---

## 2. 产品定义

### 2.1 产品目标

1. **框架层实现零构建工具依赖**：`@openelement/content` 和 `@openelement/i18n` 的数据通过标准 ESM 子路径导出暴露，不依赖 Vite 虚拟模块机制
2. **用户 import 路径标准化**：路由组件中的 `virtual:less-*` import 全部替换为 `@openelement/*` 子路径 import，IDE 可正常跳转和类型检查
3. **构建适配器职责收缩**：Vite 插件不再做数据注入，只负责 alias 映射、打包和 tree-shaking

### 2.2 用户故事

1. **As a** LessJS 框架用户，**I want** 从 `@openelement/content/nav` 导入导航数据而不是 `virtual:less-nav`，**so that** 我的 IDE 可以跳转到定义、自动补全，且不依赖 Vite 构建工具的特殊机制。

2. **As a** LessJS 框架用户，**I want** 从 `@openelement/content/blog` 导入博客数据，**so that** 博客路由组件可以在任何 ESM 环境（Deno/Node/Bun）独立运行和测试。

3. **As a** LessJS 框架用户，**I want** 从 `@openelement/i18n/data` 导入国际化配置，**so that** i18n 数据不依赖 Vite 虚拟模块，dev 模式下数据刷新行为保持一致。

4. **As a** LessJS 框架维护者，**I want** entry-renderer 生成的代码使用标准 ESM import 而不是 `virtual:less-*`，**so that** 框架生成代码不再泄露构建工具实现细节。

5. **As a** LessJS 框架维护者，**I want** migration codemod 脚本能批量将路由文件的 `virtual:less-*` import 自动迁移到新路径，**so that** 55+ 个文件的迁移不会引入人为错误。

---

## 3. 功能列表与优先级

### P0 — Must Have（阻塞发布）

| ID    | 功能                                   | 描述                                                                      | 验收标准                                                            |
| ----- | -------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| F-001 | `@openelement/content/nav` 子路径导出  | 新增 `/nav` 子路径，导出 `navSections`、`headerNav`                       | `import { navSections } from '@openelement/content/nav'` 可正常工作 |
| F-002 | `@openelement/content/blog` 子路径导出 | 新增 `/blog` 子路径，导出 `posts`、`getPostBySlug`、`getBlogOptions`      | `import { posts } from '@openelement/content/blog'` 可正常工作      |
| F-003 | `@openelement/i18n/data` 子路径导出    | 新增 `/data` 子路径，导出 `locales`、`getDefaultLocale`、`getI18nOptions` | `import { locales } from '@openelement/i18n/data'` 可正常工作       |
| F-004 | 路由文件 import 迁移（55 个文件）      | `virtual:less-nav` → `@openelement/content/nav`                           | codemod 自动化，typecheck 验证通过                                  |
| F-005 | 路由文件 import 迁移（5 个文件）       | `virtual:less-blog-data` → `@openelement/content/blog`                    | codemod 自动化，typecheck 验证通过                                  |
| F-006 | entry-renderer 生成代码迁移            | 生成的 entry 代码不再包含 `virtual:less-*` import                         | `deno task build` 生成的 entry 文件中无 `virtual:` 前缀             |
| F-007 | 全量回归测试                           | typecheck、lint、test、build、e2e 全部门禁通过                            | 14 个门禁命令全部 pass                                              |

### P1 — Should Have（本版本完成）

| ID    | 功能                           | 描述                                                                                      | 验收标准                                                      |
| ----- | ------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| F-101 | Vite alias 兼容层              | Vite 插件将 `virtual:less-nav` 映射到 `@openelement/content/nav`，打印 deprecated warning | 使用旧 import 路径时不报错，但显示 deprecated 警告            |
| F-102 | 移除 content 虚拟模块插件      | 移除 `@openelement/content` 中的 `virtualNavPlugin` 和 blog-data-plugin 虚拟模块注册      | `@openelement/content` 不再注册任何 `virtual:less-*` 模块     |
| F-103 | 移除 i18n 虚拟模块插件         | 移除 `@openelement/i18n` 中的 i18n-data-plugin 虚拟模块注册                               | `@openelement/i18n` 不再注册任何 `virtual:less-*` 模块        |
| F-104 | 移除 adapter-vite 虚拟模块处理 | 清理 `build-ssg.ts` 和 `phase-context.ts` 中的虚拟模块 resolveId/load 逻辑                | adapter-vite 中不再有 `virtual:less-nav/blog/i18n` 的特殊处理 |
| F-105 | migration codemod 脚本         | 提供自动化脚本批量迁移 `virtual:less-*` → `@openelement/*` import                         | 脚本可重复执行，幂等，覆盖所有受影响文件                      |

### P2 — Nice to Have（可延后）

| ID    | 功能                                          | 描述                                                             | 验收标准                                   |
| ----- | --------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------ |
| F-201 | dev 模式零 bundler 原型验证                   | 验证 Deno serve 直接跑路由源码（不经过 Vite dev server）的可行性 | 至少一个路由文件可在 Deno serve 下正常运行 |
| F-202 | 用户文档更新                                  | 更新文档中所有 `virtual:less-*` 引用为新路径                     | docs/ 下无 `virtual:less-nav` 等过时引用   |
| F-203 | `@openelement/protocols/virtual-ids` 常量清理 | 移除废弃的 VIRTUAL_NAV_ID 等常量                                 | 无废弃常量残留                             |

---

## 4. 技术规范

### 4.1 Requirements Pool

| ID      | 需求                                                                                             | 优先级 | 类型     |
| ------- | ------------------------------------------------------------------------------------------------ | ------ | -------- |
| REQ-001 | 子路径导出必须在 Deno（import map）、JSR（exports）、npm（exports）三端正确解析                  | P0     | 兼容性   |
| REQ-002 | 子路径导出的数据内容必须与当前虚拟模块导出一致（字段名、类型、值）                               | P0     | 正确性   |
| REQ-003 | dev 模式下导航数据在源文件变更后自动刷新（HMR 行为不变）                                         | P0     | 功能性   |
| REQ-004 | SSG 构建产物与 v0.25.0 行为一致（HTML 内容、数量、结构）                                         | P0     | 正确性   |
| REQ-005 | TypeScript 类型定义覆盖所有新增子路径导出                                                        | P0     | 类型安全 |
| REQ-006 | codemod 脚本支持 `virtual:less-nav`、`virtual:less-blog-data`、`virtual:less-i18n-data` 三种迁移 | P1     | 工具     |
| REQ-007 | deprecated alias 映射在构建时输出 warning（不阻塞构建）                                          | P1     | 兼容性   |

### 4.2 子路径导出结构设计

```
@openelement/content
├── index.ts              → lessContent() 插件（不变）
├── nav                   → 新增子路径
│   └── 导出: navSections, headerNav
├── blog                  → 新增子路径
│   └── 导出: posts, getPostBySlug, getBlogOptions
├── sitemap               → 已有子路径（不变）
│   └── 导出: generateSitemap, renderSitemapXml, renderRobotsTxt

@openelement/i18n
├── index.ts              → lessI18n() 插件（不变）
├── data                  → 新增子路径
│   └── 导出: locales, getDefaultLocale, getI18nOptions
├── routes                → 已有子路径（不变）
│   └── 导出: i18nStaticPaths, switchLocale
```

### 4.3 数据新鲜度保证机制

虚拟模块的 `load()` 钩子在每次 SSR 请求时重新执行，保证数据新鲜。迁移到子路径导出后：

- **dev 模式**：Vite HMR 在 content/i18n 源文件变更时 invalidate 相关模块，触发重新加载
- **SSG 构建**：每次构建启动时，`@openelement/content/nav` 和 `@openelement/content/blog` 通过惰性函数重新扫描数据源
- **实现方案**：子路径导出的入口文件使用 getter 函数而非顶层静态对象，利用 ESM live binding 特性

### 4.4 Open Questions

1. **子路径导出的模块入口文件放置在 packages/content/src/ 下的哪个位置？**\
   建议：`packages/content/src/nav/exports.ts` 和 `packages/content/src/blog/exports.ts`

2. **是否需要为子路径导出创建独立的 deno.json exports map？**\
   每个 `packages/*/deno.json` 需要新增 `exports` 字段

3. **entry-renderer 中生成的 import 语句何时切换？**\
   建议与路由文件迁移同步进行（同一次 PR），通过 feature flag 确保安全回滚

4. **已发布到 JSR 的 `@openelement/content` 是否允许新增子路径？**\
   JSR 的子路径导出需要在 `deno.json` 中声明，需要确认发布流程

---

## 5. 验收标准

### 5.1 门禁命令（全部必须通过）

```
deno task fmt:check    → 445 files checked, PASS
deno task lint         → 276 files checked, PASS
deno task typecheck    → PASS
deno audit             → No known vulnerabilities, PASS
deno task test         → All tests pass (≥787 passed)
deno task build        → SSG/SSR build success, PASS
deno task dsd:check-report → Within known-error threshold, PASS
deno task hub:validate --strict --json → PASS
deno task hub:check-index → PASS
deno task docs:check-strategy → PASS
deno task test:e2e     → 92+ tests pass, PASS
```

### 5.2 额外验收

- [ ] 所有路由文件（60+ 个）的 import 语句不包含 `virtual:less-` 前缀
- [ ] `entry-renderer.ts` 生成的代码不包含 `virtual:less-` 前缀
- [ ] `@openelement/content` 的 `deno.json` 声明了 `./nav` 和 `./blog` 子路径导出
- [ ] `@openelement/i18n` 的 `deno.json` 声明了 `./data` 子路径导出
- [ ] 新旧 import 路径在 `deno task build` 产出的 HTML 内容一致（diff 验证）
- [ ] migration codemod 脚本可正确迁移所有受影响的文件

### 5.3 发布检查清单

- [ ] JSR publish dry-run 通过
- [ ] `@openelement/create` 生成的新项目使用新 import 路径
- [ ] 生成项目 smoke test（typecheck + build）通过
- [ ] changelog 记录为 breaking change（import 路径变更）

---

## 6. 竞争分析摘要

> 注：本版本为纯架构解耦，不涉及功能新增，市场竞争格局无变化。以下为上下文参考：

LessJS 当前定位是"Web Components DSD-first 渲染引擎 + 确定性准入/报告管线"。主要差异化在于：

- **DSD-first**：支持 `<template shadowrootmode>` 的 SSR 框架中，LessJS 是最早提供确定性准入模型的
- **框架层零运行时**：与 Next.js（React 运行时）、Nuxt（Vue 运行时）不同，LessJS 的框架层是纯 ESM
- **Web Components 原生**：与 Lit SSR 互补，提供更轻的 DSD-native 组件基类

本版本完成后，LessJS 的框架层将实现真正的零构建工具依赖，这是上述竞品均不具备的特性。
