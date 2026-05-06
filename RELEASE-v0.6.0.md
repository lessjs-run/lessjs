# v0.6.0 — Declarative Shadow DOM + Islands Architecture + Web Standards

## 概述

v0.6.0 是 LessJS 的重大架构升级版本，引入了 Declarative Shadow DOM (DSD)、岛屿懒加载架构、Safe/Unsafe HTML 品牌类型，以及全面采用 Web Standards 规范。

---

## 主要变更

### 🚀 核心架构升级

| 功能 | 描述 | 规范参考 |
|------|------|----------|
| **Declarative Shadow DOM (DSD)** | 服务端直接输出 Shadow DOM 结构 | [WHATWG HTML Standard](https://html.spec.whatwg.org/multipage/scripting.html#the-template-element) |
| **L2 Nested DSD** | 支持嵌套 Custom Elements 递归渲染 | DOM Standard |
| **岛屿懒加载** | visible/idle 策略的 client islands | Custom Elements |
| **Safe/Unsafe HTML** | 品牌类型区分安全/非安全 HTML | 遵循 Lit 语义 |
| **CSS 变量主题** | 替代 `_propagateTheme()` DOM 遍历 | CSS Custom Properties |

### 🎨 主题系统重构

| 变更 | 描述 |
|------|------|
| CSS Custom Properties | 主题颜色通过 CSS 变量注入到 `:root` |
| `_propagateTheme()` 移除 | 不再需要递归 DOM 遍历设置 `data-theme` |
| 主题切换性能 | O(1) 复杂度，不受组件树深度影响 |
| Closed Shadow DOM 支持 | CSS 变量自动穿透 |

### 📦 新增包

| 包 | 描述 |
|----|------|
| `@lessjs/signals` | 响应式信号系统（v0.6 基础设施） |
| `island.ts` | 岛屿懒加载组件 |
| `less-bind.ts` | SSR Props 绑定指令 |

### 🔧 改进

| 范围 | 变更 |
|------|------|
| `render-dsd.ts` | `data-ssr-props` 属性保留 SSR 属性 |
| `ssg-postprocess.ts` | CSS 变量注入到 `:root` |
| `less-layout.ts` | 统一 sidebar（移除 mobile-sidebar-overlay） |
| `adapter-lit/ssr.ts` | `unsafeHTML` directive 支持 |
| `entry-generators.ts` | visible/idle 懒加载策略 |

### 🧹 代码质量

| 改进 | 描述 |
|------|------|
| island.ts 语法修复 | 修复缺少右括号 |
| TypeScript 类型 | 修复 6 个类型断言问题 |
| JS 现代化 | `var` → `const/let`，移除禁用注释 |

---

## Web Standards 采用

v0.6 全面采用以下 Web 规范：

| 规范 | 应用 |
|------|------|
| **HTML Living Standard** | DSD 模板、`<template>`, `<slot>` |
| **DOM Standard** | Shadow DOM、Custom Elements |
| **Custom Elements** | `customElements.define()` 统一注册 |
| **CSS Custom Properties** | 主题系统、组件样式变量化 |
| **CSS Shadow Parts** | 预备 `::part()` 样式穿透 |
| **Fetch Standard** | 预备标准 Fetch API |

### 浏览器兼容性

| 特性 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| Custom Elements v1 | ✅ | ✅ | ✅ | ✅ |
| Shadow DOM v1 | ✅ | ✅ | ✅ | ✅ |
| HTML Templates | ✅ | ✅ | ✅ | ✅ |
| CSS Shadow Parts | ✅ | ✅ | ✅ | ✅ |
| Declarative Shadow DOM | ✅ | ✅ | ✅ | ✅ |

---

## 测试

- **322 个测试全部通过**
- `deno lint` 137 files 无警告
- `deno task test` 完整通过

---

## 版本号

| 包 | 旧版本 | 新版本 |
|-----|--------|--------|
| `@lessjs/core` | 0.5.5 | **0.6.0** |
| `@lessjs/ui` | 0.5.5 | **0.6.0** |
| `@lessjs/rpc` | 0.3.1 | **0.6.0** |
| `@lessjs/adapter-lit` | 0.2.1 | **0.6.0** |
| `@lessjs/create` | 0.4.6 | **0.6.0** |
| `@lessjs/signals` | - | **0.6.0** (NEW) |

---

## 破坏性变更

| 变更 | 描述 |
|------|------|
| `_propagateTheme()` 移除 | 主题系统改用 CSS 变量，不再需要此方法 |
| 移除 `mobile-sidebar-overlay` | 统一使用 `.docs-sidebar` |
| CSS 变量命名 | `--less-*` 继续使用，无变更 |

---

## 迁移指南

### 从 v0.5.x 迁移

1. **主题切换**：无需改动，`less-theme-toggle` 自动适配
2. **自定义样式**：使用 `var(--less-*)` 变量替代硬编码颜色
3. **岛屿组件**：无需改动，`island.ts` 向后兼容

### 新增用法

```ts
// SSR Props 绑定
import { less } from '@lessjs/core';
import { lessBind } from '@lessjs/core/less-bind';

// 岛屿懒加载
import { Island } from '@lessjs/core/island';
```

---

## 后续计划

- **v0.7**：Serverless Fullstack + Edge Deployment
- **v0.8**：PWA Support + Offline-First

---

*Built with Web Standards. Less is More.*
