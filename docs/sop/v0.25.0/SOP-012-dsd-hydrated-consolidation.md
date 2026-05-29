# SOP-012: `_dsdHydrated` Dual-Path Consolidation

> Priority: P1 | Nature: Runtime refactor | Time: 2d

## Objective

合并 DSD 和 CSR 两条渲染路径，消除 `_dsdHydrated` 分支（13 处引用）。

## Step-by-Step

### Step 1: 审计双路径差异

当前两条路径的差异：

| 方面         | DSD 路径                       | CSR 路径                  |
| ------------ | ------------------------------ | ------------------------- |
| Shadow DOM   | 已有（SSR 生成）               | `createRenderRoot()`      |
| Styles       | `_applyStyles(ctor)`           | `_applyStyles(ctor)`      |
| Render       | `_bindCurrentRenderTemplate()` | `_renderIntoShadowRoot()` |
| Events       | `_hydrateEvents()`             | 由 `renderToDom` 处理     |
| Initial done | `_initialRenderDone = true`    | VNode effect 设置         |

### Step 2: 统一为 "always render via VNode"

```typescript
// dsd-element.ts — 新 connectedCallback
override connectedCallback(): void {
  initializeProps(this);
  initializeStaticProps(this);
  syncStaticPropsFromAttributes(this);

  if (!this.shadowRoot) this.createRenderRoot();
  this._applyStyles();

  const docTheme = document.documentElement?.dataset?.theme;
  if (docTheme && !this.hasAttribute('data-theme')) {
    this.setAttribute('data-theme', docTheme);
  }

  // DSD: shadow root 已有 children → 读 slot，创建 VNode 结构
  // CSR: shadow root 为空 → 直接用 render() 返回的 VNode
  this._renderIntoShadowRoot(); // 统一路径
}

// _renderIntoShadowRoot 检测 DSD preset:
private _renderIntoShadowRoot(): void {
  const result = this.render();
  if (this.shadowRoot!.childNodes.length > 0) {
    // DSD: reuse existing shadow DOM, bind events via VNode tree
    this._hydrateExistingDom(result);
  } else {
    // CSR: full render
    // ... existing logic
  }
}
```

### Step 3: 删除 _dsdHydrated 标志

- 删除 `_dsdHydrated` 字段
- 删除 `_bindCurrentRenderTemplate()`
- 删除 `_hydrateOrRender()` (13 处引用合并为 1 处)

### Step 4: 保持事件绑定正确

DSD 预设的 DOM 已有事件处理器（`onClick`, `onInput` 等）通过 `@click` 在 SSR 输出中。需确保升级后事件不重复绑定。

### Step 5: 验证

- [ ] `_dsdHydrated` 从代码中删除
- [ ] DSD 组件 visual 一致性不变
- [ ] CSR 组件正常工作
- [ ] `deno task test` 全部通过
- [ ] SSR 事件不重复绑定
