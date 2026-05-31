---
title: 架构
section: core
label: 架构
order: 10
---

## 分层模型

LessJS 采用严格的三层架构，通过 ESM import 连接：

```
应用层 (www/)         ─  路由、island、渲染器
    │ ESM import
构建层 (adapter-vite)  ─  路由扫描、SSG 管线、打包
    │ ESM import  
核心层 (@lessjs/core)  ─  DsdElement、renderDsd、VNode、JSX
    │ ESM import
信号层 (@lessjs/signals) ─  signal()、computed()、effect()
```

每一层只依赖下一层。上层对下层不可见。

## 渲染管线

### renderDsd(input, props?) — 唯一 API

```ts
// 按标签名 — 自动从 customElements 注册表查找
const result = await renderDsd('less-layout', {
  currentPath: '/zh/guide/getting-started',
  locale: 'zh',
})

// 按类 — 直接使用
const result = await renderDsd(LessLayout, { ... })

// result.html 包含完整 DSD 输出
```

### 单次 VNode 遍历

VNode 树只遍历一遍。遇到注册的自定义元素时，内联调用 `renderDsd()`：

```
VNode 树
    ├─ <div class="app-header">
    │     ├─ <less-search>       → renderDsd('less-search') 内联渲染
    │     └─ <less-theme-toggle> → renderDsd('less-theme-toggle') 内联渲染
    ├─ <slot></slot>             → light DOM 投射
    └─ <div class="app-footer">...</div>
```

无 parse5。无 visited Set。无字符串拍平。一棵树，一次遍历。

## Signal 原生水合

Signal 是 DsdElement 的一部分，不是独立系统：

```tsx
class MyCounter extends DsdElement {
  #count = signal(0)

  render() {
    // SSR: signal 值写入 HTML 的 data-signal 属性
    return <span data-signal="count">{this.#count.value}</span>
  }

  // CSR: _hydrateSignals() 自动将 effect() 绑定到 DOM
  // → effect(() => el.textContent = this.#count.value)
}
```

水合标记：`data-signal`、`data-signal-html`、`data-signal-attr`、`data-signal-class`。事件绑定：`data-on-click`、`data-on-input` 等。

## 构建管线

```
deno task build
  ├─ 路由扫描      → entry-renderer 生成 SSR 入口
  ├─ 客户端打包    → Rolldown 打包 island 组件  
  └─ SSG 渲染      → renderRoute() 逐个页面 → 写入 dist/
```

## 组件模型

```
DsdElement
├── static styles    → CSSStyleSheet，内联到 DSD 模板
├── render()         → VNode 树 (JSX)
├── signalRegistry   → Map<name, Signal>
├── _hydrateSignals() → 将 effect() 绑定到 DSD DOM
└── _bindEvents()    → 从 data-on-* 标记绑定事件
```

## 关键架构决策

| ADR | 决策 | 状态 |
|-----|------|------|
| ADR-0057 | JSX + Signal 组件模型 | 生效 |
| ADR-0065 | 统一 VNode 管线 (SSR+CSR) | 生效 |
| ADR-0067 | Ocean (静态) + Island (信号) 架构 | 生效 |
| ADR-0071 | 单次 VNode 遍历，删除 parse5 | 生效 |
| ADR-0072 | 一个 renderDsd()，jsx 仅 subpath | 生效 |
