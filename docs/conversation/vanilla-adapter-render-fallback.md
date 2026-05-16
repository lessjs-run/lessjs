# Vanilla Adapter `render()` Fallback + Shoelace Color Contrast

**问题**: `WithDsdHydration(HTMLElement)` mixin 在 `ssr: false` 时不自动调用
`render()`，导致 shadow root 为空；Shoelace 默认主题色在浅色背景下对比度不足
**日期**: 2026-05-17
**状态**: ✅ 已修复

## 问题描述

### 问题 1 — Vanilla adapter ssr:false 空白

`media-chrome-showcase`（vanilla adapter + `ssr: false`）在页面上显示为完全空白。
对比其他 showcase：

| Island       | Base Class                      | ssr   | 渲染机制                         | 结果 |
| ------------ | ------------------------------- | ----- | -------------------------------- | ---- |
| Shoelace     | `LitElement`                    | false | Lit 生命周期自动调 `render()` ✅ | 可见 |
| React        | `WithDsdHydration(HTMLElement)` | true  | DSD 内容直接水合 ✅              | 可见 |
| Media Chrome | `WithDsdHydration(HTMLElement)` | false | 无 DSD + 无自动 render ❌        | 空白 |

### 问题 2 — Shoelace 颜色对比度不足

Shoelace 默认 Primary `#6366f1`、Success `#10b981`、Neutral `#71717a` 在 docs
浅色背景上偏淡，Neutral 按钮几乎融入背景。

## 根因分析

### 根因 1 — `WithDsdHydration` 设计缺口

Mixin 的设计隐含了一个假设："只在 DSD 场景下使用"。它提供：

- `createRenderRoot()` — 检测已有 shadow root（DSD 内容）
- `connectedCallback()` — 调用父类 + 绑定事件
- `disconnectedCallback()` — 清理

但它**没有为无 DSD 内容的场景提供兜底渲染机制**。当 `ssr: false` 时：

1. SSR 输出空标签
2. 客户端 upgrade → `createRenderRoot()` 创建新 shadow root
3. `_dsdHydrated = false`
4. `connectedCallback()` 只调了父类和事件绑定
5. `render()` **从未执行**
6. shadow root 始终为空

对比 Lit 的 `LitElement`：Lit 的 reactive-element 生命周期在
`update()` 中自动调用 `render()` 并 patch DOM。Vanilla adapter 没有这个机制。

### 根因 2 — Shoelace 主题色

Shoelace 2.x 默认使用 Indigo/Purple 色系，其 `--sl-color-primary-600` 等
token 在亮色主题下偏浅。这是 Shoelace 的设计选择，但放在 LessJS docs 站点
的白色背景上视觉对比度不足。

## 修复方案

### 1. Mixin 层 render fallback

不在每个 island 中打 workaround，直接在 `WithDsdHydration` mixin 的
`connectedCallback()` 中添加兜底逻辑：

```ts
// packages/adapter-vanilla/src/dsd-hydration.ts
connectedCallback(): void {
  // ... 父类调用 ...
  if (this._dsdHydrated) {
    this._hydrateEvents();
  } else if (this.shadowRoot) {
    // 客户端首次渲染：调用子类的 render() 填充 shadow root
    const renderFn = (this as Record<string, unknown>).render;
    if (typeof renderFn === 'function') {
      const html = renderFn.call(this);
      this.shadowRoot.innerHTML = String(html);
    }
  }
}
```

所有使用 vanilla adapter 的 `ssr: false` island 自动受益。

### 2. Shoelace 颜色修正

覆盖 Shoelace CSS 自定义属性，使用更高对比度的值：

```css
--sl-color-primary-600: #4f46e5; /* indigo-600 */
--sl-color-success-600: #059669; /* emerald-600 */
--sl-color-neutral-600: #52525b; /* zinc-600 */
```

## 验证结果

| 检查项                         | 结果                                |
| ------------------------------ | ----------------------------------- |
| `deno task test`               | ✅ 554 passed                       |
| `deno task typecheck`          | ✅ clean                            |
| `deno task build`              | ✅ 298 pages                        |
| mixin render fallback 在产物中 | ✅ `shadowRoot.innerHTML=String(t)` |
| Shoelace 颜色 token 覆盖       | ✅ `--sl-color-*-600` 覆写          |

## 关键教训

1. **Mixin 不能假设只在 DSD 场景使用**。当提供 `render()` 方法时，mixin
   应该能兜底调用它。这个假设在 Lit adapter 中成立（Lit 生命周期），但在
   vanilla adapter 中不成立。
2. **修复应放在最合适的一层**。第一次修复打在 `media-chrome-showcase.ts`，
   是 workaround；移到 mixin 层后，整个 adapter 的所有用户都受益。
3. **Showcase 组件也要注意视觉质量**。使用的第三方库的默认主题色可能
   不适合放置场景，需要主动覆写。

## 修改文件

| 文件                                            | 修改内容                   |
| ----------------------------------------------- | -------------------------- |
| `packages/adapter-vanilla/src/dsd-hydration.ts` | 添加客户端 render fallback |
| `www/app/islands/shoelace-showcase.ts`          | 覆写 Shoelace 颜色 token   |
