---
title: '核心概念'
section: '指南'
label: '核心概念'
order: 2
---

# 核心概念

openElement 围绕一个应用模型和一条 renderer 管线构建。

## Application API

```tsx
import { defineElement, defineIsland, definePage } from '@openelement/app';
```

- `definePage()` 声明 route component 和页面 metadata。
- `defineIsland()` 声明可交互 Custom Element。
- `defineElement()` 声明可复用的 DSD-native element。
- `defineLayout()` 是 layout element 的语义别名。

## Renderer 管线

JSX 是编写语法。渲染路径是：

```text
JSX -> VNode -> RenderNode -> DSD HTML 或 DOM
```

应用代码不再有并行的 string-template renderer。原始 HTML 只能通过显式 `trustedHtml`
信任边界进入。

## Declarative Shadow DOM

服务端输出包含 `<template shadowrootmode="open">`，浏览器可以在 JavaScript 升级之前解析 shadow
root。

## Islands

静态内容保持静态。交互组件是带显式 hydration 策略的 islands，例如 `load`、`idle`、`visible` 或
`only`。

## Runtime primitives

`@openelement/runtime` 仍然给底层库代码使用：

```tsx
import { DsdElement, signal, StyleSheet } from '@openelement/runtime';
```

应用路由默认应先使用 `@openelement/app`。
