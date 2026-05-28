# SOP-004: JSX 事件系统

> Version: v0.24.1
> Priority: P0
> Status: PLANNED
> Depends on: SOP-001 (jsx-runtime core), SOP-003 (DSD pipeline integration)

## Objective

实现 JSX 事件绑定：`onClick` / `onInput` 等 → 原生 `addEventListener`。确保 SSR 输出中不包含事件处理器（纯字符串），CSR 路径中事件正确绑定并随组件生命周期清理。

## Non-Goals

- 不实现合成事件（SyntheticEvent）
- 不实现事件委托（event delegation）
- 不修改现有 `@click` 语法的事件处理逻辑（html 模板路径不变）

## Procedure

### Step 1: renderToString 中忽略事件属性

**文件**: `packages/core/src/jsx-render-string.ts`

在 `serializeAttrs()` 中，跳过以 `on` 开头的属性：

```typescript
function serializeAttrs(props: Record<string, any>): string {
  let result = '';
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;
    if (key.startsWith('on') && typeof value === 'function') continue; // SSR 跳过事件
    if (key === 'ref') continue; // SSR 跳过 ref
    if (typeof value === 'function') continue; // SSR 跳过所有函数值
    // ... 正常属性序列化 ...
  }
  return result;
}
```

**验证**：
- [ ] `<button onClick={handler}>` 的 SSR 输出不含任何事件相关属性

### Step 2: renderToDOM 中绑定事件

**文件**: `packages/core/src/jsx-render-dom.ts`（SOP-001 已实现基础版本）

确认 `applyProps()` 正确处理事件：

```typescript
if (key.startsWith('on') && typeof value === 'function') {
  const eventType = key.slice(2).toLowerCase();
  el.addEventListener(eventType, value);
  continue;
}
```

**验证**：
- [ ] `onClick` → `addEventListener('click', handler)`
- [ ] `onInput` → `addEventListener('input', handler)`
- [ ] `onKeyDown` → `addEventListener('keydown', handler)`

### Step 3: 事件监听器生命周期管理

**文件**: `packages/core/src/dsd-element.ts`

在 DsdElement 的 JSX hydration 路径中，使用 AbortController 管理事件生命周期：

```typescript
// DsdElement 新增
private _eventAbortController = new AbortController();

// connectedCallback 中绑定事件时
element.addEventListener('click', handler, {
  signal: this._eventAbortController.signal
});

// disconnectedCallback 中
this._eventAbortController.abort(); // 一次性清理所有事件监听
this._eventAbortController = new AbortController(); // 重置，为重新连接准备
```

**验证**：
- [ ] `disconnectedCallback` 后所有事件监听被清理
- [ ] 重新 `connectedCallback` 后事件可重新绑定
- [ ] 无内存泄漏

### Step 4: DSD hydration 中事件绑定路径

**文件**: `packages/core/src/dsd-element.ts`

DSD 模式下，shadow DOM 已由浏览器从 `<template shadowrootmode>` 创建。hydrate 时需要：

1. 调用 `render()` 获取 VNode
2. 遍历 VNode 中的事件属性
3. 在已有 shadow DOM 中查找对应元素
4. 绑定事件监听器

**方案**：复用现有的 `_bindCurrentRenderTemplate()` 模式，但改为从 VNode 提取事件映射：

```typescript
// 从 VNode 收集事件绑定信息
function collectEventBindings(vnode: VNode): Map<string, Map<string, Function>> {
  // 返回: selector → eventType → handler
  // 例: "button.primary" → "click" → handleClick
}
```

**验证**：
- [ ] DSD 预渲染页面上 JSX 组件的事件正确绑定
- [ ] 事件冒泡在 shadow DOM 内正确传播
- [ ] `preventDefault()` / `stopPropagation()` 正常工作

## Rollback

如果 JSX 事件绑定路径与 DSD hydration 存在不兼容：
1. 在 JSX 组件中保留 `@click` 语法作为临时兼容路径
2. 两者可以共存：`@click` 处理 DSD hydration，`onClick` 处理 CSR
3. 在 SOP-005 组件迁移时统一到 `onClick`
