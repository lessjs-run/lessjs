# SOP-001: Real DOM Signal Binding — 实现 Signal→DOM 直接绑定

Status: completed\
Target version: v0.26.1\
Owner: `@openelement/core` (dsd-element.ts, jsx-render-dom.ts, jsx-render-string.ts)\
前置: [ADR-0058](../../adr/0058-real-dom-signal-binding.md)

---

## Objective

消灭 `DsdElement` 中 `effect(() => render() + clear+rebuild)` 的 VDOM 循环，改为 `applyProps` 层自动创建 signal→DOM 属性绑定。signal 变化只更新对应 DOM 属性/样式，不触发全量 `render()`。

---

## Problem Statement

当前 `_renderIntoShadowRoot()` 的 effect 回调：

```typescript
effect(() => {
    const updated = this.render();    // 全量 re-render
    while (sr.firstChild) sr.removeChild(...); // 清空
    sr.appendChild(renderToDom(updated));       // 重建
});
```

每次 signal 变化全量 render → 清空+重建 DOM → 元素 identity 丢失 → `connectedCallback` 重入 → 死循环风险。这个模式对 `less-theme-toggle` 这种 signal 只驱动 className 的组件是 killloop，对所有信号驱动组件都是架构负债。

---

## Scope

### 改动文件

| 文件                                     | 改动类型              | 说明                                                    |
| ---------------------------------------- | --------------------- | ------------------------------------------------------- |
| `packages/core/src/jsx-render-dom.ts`    | 修改 `applyProps`     | 检测 signal-like prop 值，创建 effect 绑定              |
| `packages/core/src/dsd-element.ts`       | 删除 `effect(render)` | 移除两个 effect 回调（CSR + DSD 路径），还原初始 render |
| `packages/core/src/dsd-element.ts`       | 删除 `_patchChildren` | 回退方案 A 的 VDOM diff 代码                            |
| `packages/core/src/jsx-render-string.ts` | 不改                  | SSR 路径正确 unwrap signal 快照                         |

### 不改文件

| 文件                    | 原因                                  |
| ----------------------- | ------------------------------------- |
| `less-theme-toggle.tsx` | 组件代码无需改动                      |
| `island.ts`             | island runtime 不参与 signal 管理     |
| 其他 UI 组件            | render 中 signal 值的展开方式自动兼容 |

---

## Step-by-Step Implementation

### Step 1: 加强 `applyProps` — 添加 signal 检测

文件: `packages/core/src/jsx-render-dom.ts`

当前逻辑：`applyProps(el, props, signal?)` 对每个 prop 调用 `unwrapSignalLike(value)` 获取静态值，设到 DOM 上。

新逻辑：遇到 signal-like 值时，**不设静态值**。改为创建一个 `effect()` 订阅 signal 变化，disposer 挂在 AbortSignal 上：

```typescript
// applyProps 新增分支（在现有逻辑之前插入）
if (isSignalLike(value)) {
  const sig = value as { value: unknown };
  // 创建 effect 绑定
  const dispose = effect(() => {
    const resolved = unwrapSignalLike(sig.value);
    applySingleProp(el, key, resolved, signal);
  });
  // disposer 挂 AbortSignal
  if (signal) {
    signal.addEventListener('abort', dispose, { once: true });
  }
  continue;
}
```

新增辅助函数 `applySingleProp`（从现有 `applyProps` 的 for-loop body 提取）：

```typescript
function applySingleProp(
  el: Element,
  key: string,
  value: unknown,
  signal?: AbortSignal,
): void {
  if (value == null) return;
  const resolved = unwrapSignalLike(value);

  if (key === 'style' && typeof resolved === 'object' && resolved !== null) {
    const styleObj: Record<string, string> = {};
    for (const [sk, sv] of Object.entries(resolved as Record<string, unknown>)) {
      styleObj[sk] = String(unwrapSignalLike(sv));
    }
    Object.assign((el as HTMLElement).style, styleObj);
    return;
  }

  const attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;

  if (typeof resolved === 'boolean') {
    resolved ? el.setAttribute(attrName, '') : el.removeAttribute(attrName);
    return;
  }

  el.setAttribute(attrName, String(resolved));
}
```

**注意**：signal 检测必须在现有 `unwrapSignalLike(value)` 之前。`unwrapSignalLike` 会把 signal `{ value: 'dark' }` 展成 `'dark'` 字符串——此时已经丢失了 signal 身份。

**关键**：`isSignalLike` 和 `effect` 需要 import。`isSignalLike` 来自 `./signal-like.ts`，`effect` 来自 `@openelement/signals`。

### Step 2: 处理 `className` 的特殊情况

Signal 驱动 className 是最常见场景（`less-theme-toggle`）。需要确保：

- `className={signalValue}` → `effect(() => { el.className = String(signalValue.value) })`
- 使用 `el.className` 而非 `el.setAttribute('class', ...)`——前者覆盖全部 class，后者只追加

在 `applySingleProp` 中，`key === 'className'` 分支使用 `el.className = String(resolved)`：

```typescript
if (key === 'className') {
  (el as HTMLElement).className = String(resolved);
  return;
}
```

### Step 3: 重写 `_renderIntoShadowRoot` — 删除 effect(render)

文件: `packages/core/src/dsd-element.ts`

当前代码 structure（after 方案 A 的 patch）：

```typescript
private _renderIntoShadowRoot(): void {
    // ... dispose existing ...
    const result = this.render();
    if (isVNode(result)) {
        // 初始 render
        while (sr.firstChild) sr.removeChild(...);
        const dom = renderToDom(result, signal);
        sr.appendChild(dom);

        // ← 删除这一段 effect(render)
        let rootEl = dom instanceof Element ? dom : null;
        this._vnodeEffectDispose = effect(() => {
            const updated = this.render();
            // ... patch or rebuild ...
        });
    }
}
```

新代码：**完全删除 effect 段落**。初始 render 后，signal→DOM 绑定由 `applyProps` 自动管理。组件不再有 "re-render" 概念——每个 signal 变化是独立的 DOM 属性更新。

```typescript
private _renderIntoShadowRoot(): void {
    if (!this.shadowRoot) return;
    this._disposeTemplateRuntime();
    this._disposeSignalSubscriptions();

    const result = this.render();
    if (isVNode(result)) {
        while (this.shadowRoot.firstChild) {
            this.shadowRoot.removeChild(this.shadowRoot.firstChild);
        }
        this._templateAbortController = new AbortController();
        const dom = renderToDom(result, this._templateAbortController.signal);
        this.shadowRoot.appendChild(dom);
        // No effect(render) — signal→DOM bindings are auto-created by applyProps
    } else if (typeof result === 'string') {
        this.shadowRoot.innerHTML = result;
    } else {
        // Defensive warning (keep existing)
    }
}
```

### Step 4: 重写 `_hyrateExistingDom` — 同样删除 effect(render)

文件: `packages/core/src/dsd-element.ts`

```typescript
private _hyrateExistingDom(): void {
    if (!this.shadowRoot) return;
    const result = this.render();
    if (!isVNode(result)) return;
    // Only walk & bind events — no effect(render)
    this._walkAndBind(this.shadowRoot, result);
}
```

DSD 路径不需要 effect 绑定——DSD DOM 是 SSR 预填充的，signal 绑定在 CSR 的首次 `_renderIntoShadowRoot` 中已创建。

### Step 5: 删除 `_patchChildren` 方法（方案 A 回退）

文件: `packages/core/src/dsd-element.ts`

删除整个 `_patchChildren` 方法和相关 JSDoc 注释。同时删除 `unwrapSignalLike` import（如果不再需要）。

### Step 6: 清理 `_vnodeEffectDispose` 相关代码

删除 `_vnodeEffectDispose` 字段声明和相关 dispose 逻辑（在 `_disposeSignalSubscriptions` 中）。signal→DOM 的 disposers 现在挂在 AbortController 上，不需要单独管理。

### Step 7: 验证 `renderToString` 兼容性

文件: `packages/core/src/jsx-render-string.ts`

确认 SSR 路径 `renderToString` 正确 unwrap signal 值。SSR 不使用 `effect()`——signal 值在 `render()` 调用中被读取一次，生成静态 HTML。当前逻辑已经正确（ADR-0057 实现已验证）。

### Step 8: 运行全量测试

```bash
deno test packages/core/__tests__/
deno fmt packages/core/src/
deno lint packages/core/src/
deno check packages/core/src/dsd-element.ts packages/core/src/jsx-render-dom.ts
```

预期：所有现有测试通过，无新增 lint/fmt/typecheck 错误。

### Step 9: 构建 www 验证

```bash
cd www && deno task build
```

验证：

- `less-theme-toggle` 在 CSR 路径下不出现死循环
- 主题切换正常（dark ↔ light 按钮点击、localStorage 持久化）
- 无 console error

### Step 10: Children 动态文本 — `renderToDom` signal 分支修复

文件: `packages/core/src/jsx-render-dom.ts`

当前 `isSignalLike(node)` 分支做静态展开 → 改 effect 绑定：

```typescript
// Before (static — signal lost):
if (isSignalLike(node)) {
  return renderToDom((node as { value: unknown }).value, signal);
}

// After (reactive):
if (isSignalLike(node)) {
  const sig = node as SignalLike;
  const textNode = document.createTextNode(String(sig.value));
  const dispose = effect(() => {
    textNode.textContent = String(sig.value);
  });
  if (signal) signal.addEventListener('abort', dispose, { once: true });
  return textNode;
}
```

### Step 11: 新增 `<Show when={signal}>` 控制流组件

文件: `packages/core/src/jsx-runtime.ts`

新增 `Show` Symbol 导出：

```typescript
export const Show: unique symbol = Symbol('lessjs.show');
```

文件: `packages/core/src/jsx-render-dom.ts`

在 `renderToDom` 中新增 `Show` 分支（放在 Fragment 分支之后）：

```typescript
if (tag === Show) {
  const marker = document.createComment('show');
  const whenVal = unwrapSignalLike(props?.when);
  const childrenArr = children as VNode[];
  const truthyChild = childrenArr[0];
  const falsyChild = childrenArr[1];

  let current: Node | null = null;
  const dispose = effect(() => {
    const show = Boolean(unwrapSignalLike(
      isSignalLike(props?.when) ? props!.when.value : whenVal,
    ));
    const target = show ? truthyChild : falsyChild;
    if (current) {
      const replacement = target ? renderToDom(target, signal) : document.createTextNode('');
      marker.parentNode?.replaceChild(replacement, current);
      current = replacement;
    } else {
      current = target ? renderToDom(target, signal) : document.createTextNode('');
      marker.parentNode?.insertBefore(current, marker.nextSibling);
    }
  });
  if (signal) signal.addEventListener('abort', dispose, { once: true });
  return marker;
}
```

### Step 12: 新增 `<For each={signal}>` 列表渲染

文件: `packages/core/src/jsx-runtime.ts`

```typescript
export const For: unique symbol = Symbol('lessjs.for');
```

文件: `packages/core/src/jsx-render-dom.ts`

在 `renderToDom` 中新增 `For` 分支：

```typescript
if (tag === For) {
  const marker = document.createComment('for');
  const renderFn = (children as unknown[])[0] as (item: unknown, index: number) => unknown;
  const dispose = effect(() => {
    const items = (isSignalLike(props?.each)
      ? (props!.each as SignalLike).value
      : unwrapSignalLike(props?.each)) as unknown[];
    if (!Array.isArray(items)) {
      return;
    }
    // Clear existing
    let next = marker.nextSibling;
    while (next) {
      const toRemove = next;
      next = next.nextSibling;
      toRemove.remove();
    }
    // Render items
    for (let i = 0; i < items.length; i++) {
      const vnode = renderFn(items[i], i);
      const dom = renderToDom(vnode, signal);
      marker.parentNode?.insertBefore(dom, marker.nextSibling);
    }
  });
  if (signal) signal.addEventListener('abort', dispose, { once: true });
  return marker;
}
```

### Step 13: SSR 兼容 — `renderToString` 控制流处理

文件: `packages/core/src/jsx-render-string.ts`

- `Show`: 展开 truthy/falsy child（静态快照）
- `For`: 展开 each 数组，对每个 item 调 renderFn

### Step 14: 重新导出 `<Show>` / `<For>`

文件: `packages/core/mod.ts` 或 `packages/core/src/jsx-runtime.ts`

确认 `Show` / `For` 可通过 `@openelement/core` 导入。

### Step 15: 运行全量测试

```bash
deno test packages/core/__tests__/
deno fmt packages/core/src/
deno lint packages/core/src/
```

### Step 16: www 构建 + API 文档更新

更新 `www/app/routes/engine/reference/core.ts`，在 API 列表中加入 `Show` / `For`。

---

## Acceptance Criteria

- [x] `applyProps` 遇到 signal-like prop 值时创建 `effect()` 绑定，不设静态值
- [x] `_renderIntoShadowRoot` 删除 `effect(() => render())` 段落
- [x] `_hyrateExistingDom` 删除 `effect(() => render())` 段落
- [x] `_patchChildren` 方法完全删除
- [x] `_vnodeEffectDispose` 字段和相关清理逻辑删除
- [x] `less-theme-toggle` 在 CSR island 路径不出现 Max call stack
- [x] 主题切换功能正常
- [x] 所有 core 测试通过
- [x] fmt / lint / typecheck 全部通过
- [ ] Children 动态文本 `{sig}` 响应式更新
- [ ] `<Show when={signal}>` 条件渲染
- [ ] `<For each={signal}>` 列表渲染
- [ ] `renderToString` SSR 路径兼容 Show/For
- [ ] www API 文档更新

---

## Risks & Mitigations

| Risk                                                    | Impact | Mitigation                                                                                                 |
| ------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| 条件渲染 `{signal ? A : B}` 不工作                      | 中等   | MVP 阶段用 CSS 替代；后续 ADR 引入 `<Show>` 组件                                                           |
| `effect()` 在 `applyProps` 中创建，disposer 泄漏        | 高     | 每个 binding 挂到 AbortController.signal；`disconnectedCallback` 调用 `_disposeTemplateRuntime` 触发 abort |
| `isSignalLike` 检测假阳性（普通 `{ value: ... }` 对象） | 低     | `isSignalLike` 已有明确的 duck-type 检测（`brand` 或 `subscribe` 方法），误判概率极低                      |
| SSR `renderToString` 行为变化                           | 低     | SSR 不使用 effect，signal 值在 render 时读取一次快照                                                       |
