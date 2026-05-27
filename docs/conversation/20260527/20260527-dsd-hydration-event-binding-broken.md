# DSD Hydration 事件绑定系统性失效分析

> 日期：2026-05-27  
> 严重程度：P0 — 影响所有使用 @click/@keydown 等声明式事件的静态渲染组件  
> 发现者：Zhi（智）· 齐活林（Qi）  
> 相关文件：`packages/core/src/dsd-element.ts`、`packages/core/src/template.ts`、`www/app/shared/section-renderer.ts`

---

## TL;DR

LessJS 的 Declarative Shadow DOM (DSD) hydration 路径在 `_bindCurrentRenderTemplate()` 中调用了 `applyRuntimeTemplateBindings()`，该方法通过 `querySelectorAll('[data-less-event-N]')` 查找标记来绑定事件。**但 SSG 生成的静态 DSD HTML 不含这些标记**——标记仅在 CSR 路径的 `renderTemplateToString(result, {runtimeMarkers: true})` 中生成。导致所有组件的 `@click`、`@keydown` 等声明式事件在 DSD 路径上**静默失效**。

Search 组件是这一 bug 的**症状**而非根因。在 search 组件中我们临时使用了 imperative `addEventListener` 绕过，但框架级修复必须解决 DSD hydration 的根本性问题。

---

## 一、Bug 溯源

### 1.1 两条渲染路径的差异

```
                          ┌─────────────────────────┐
                          │   connectedCallback()     │
                          │   DsdElement (line 210)   │
                          └───────────┬─────────────┘
                                      │
                          shadowRoot has childNodes?
                                      │
                    ┌─────────────────┴──────────────────┐
                    │ YES (DSD)                          │ NO (CSR)
                    ▼                                     ▼
    _bindCurrentRenderTemplate()          _renderIntoShadowRoot()
    (line 387)                            (line 330)
    │                                     │
    ├─ render() → TemplateResult          ├─ render() → TemplateResult
    ├─ _bindTemplateRuntime(result)       ├─ renderTemplateToString(result,
    │  └─ applyRuntimeTemplateBindings()  │     {runtimeMarkers: true})
    │     └─ querySelectorAll(            │     └─ 生成 data-less-event-0 等标记 ✓
    │        '[data-less-event-0]')       ├─ innerHTML = marker HTML
    │        └─ 找不到！永远找不到！❌     ├─ _bindTemplateRuntime(result)
    │                                     │  └─ applyRuntimeTemplateBindings()
    │                                     │     └─ querySelectorAll(
    │                                     │        '[data-less-event-0]')
    │                                     │        └─ 找到了！绑定 ✓
    │                                     └─ _subscribeTemplateSignals(result)
    └─ _subscribeTemplateSignals(result)
```

### 1.2 为什么标记是必需的

`applyRuntimeTemplateBindings()` (template.ts:175-204) 的核心逻辑：

```typescript
for (const binding of bindings.events) {
    const marker = `data-less-event-${binding.index}`;
    const elements = root.querySelectorAll(`[${marker}]`);  // ← 关键行
    for (const element of elements) {
        element.removeAttribute(marker);
        element.addEventListener(binding.eventName, handler, ...);
    }
}
```

它依赖 DOM 中存在 `data-less-event-N` HTML 属性来定位需要绑定事件的元素。这些属性由 `renderTemplateToString(result, {runtimeMarkers: true})` 生成（template.ts:236）：

```typescript
if (binding.sigil === '@') {
    return runtimeMarkers ? `data-less-event-${index}` : '';
}
```

但 CS Renderer 传 `{runtimeMarkers: true}`，SSG 生成 DSD 模板时**没有传**（也没有途径传——SSG 调用的是 `render()` 方法，通过 `renderTemplateToString` 生成纯 HTML 字符串作为 DSD 模板内容）。

### 1.3 受影响的组件范围

**所有**在 DSD 预渲染模板中使用 `html` 标签模板 + `@click`/`@keydown` 绑定的组件都受影响。包括但不限于：

| 组件 | 绑定 | 是否受影响 |
|------|------|------------|
| `less-search` | `@click` on trigger | ✅ 已通过 imperative workaround 缓解 |
| `less-layout` | `@click` on mobile menu | ✅ 同上，menu toggle 正常 |
| `less-theme-toggle` | `@click` | ✅ 有独立 `update()` 处理 |
| `less-code-block` | `@click` on copy | ❓ 未验证 |
| 其他带事件的组件 | `@click`/`@keydown` | ❓ 未验证 |

**关键结论：这不是 search 组件独有的 bug，而是框架级缺陷。**

---

## 二、当前 Workaround 评估

### 2.1 Search 组件 (www/app/islands/less-search.ts)

```typescript
// Imperative safety net (line 217, 231-232)
private _onTriggerClick = (): void => this._handleTriggerClick();

override connectedCallback(): void {
    // ...
    const btn = this.shadowRoot?.querySelector('.search-trigger');
    if (btn) btn.addEventListener('click', this._onTriggerClick);
    // ...
}
```

**问题**：
- 这是一种绕过框架的行为——框架的 DSD hydration 机制被完全绕过
- 如果 `render()` 模板结构变化，class selector 可能失效，产生静默回归
- 不符合 "复用框架能力" 的设计理念
- 需要每个组件各自实现类似 workaround，分散重复

### 2.2 Section Renderer (www/app/shared/section-renderer.ts)

手动注入 SEARCH_DSD 静态模板：
```typescript
const SEARCH_DSD = '<less-search slot="header-actions"><template shadowrootmode="open">...静态HTML...</template></less-search>';
```

**问题**：
- 静态 HTML 与 `less-search.render()` 输出不一致——DSD 显示的内容和 CSR 可能不同
- 修改 search 的 render() 时，必须同步更新 SEARCH_DSD 字符串，否则产生漂移
- 本质上是打破了 framework 的单一 render 源

---

## 三、框架级修复方案

### 3.1 核心修复：`_bindCurrentRenderTemplate()` 回退机制

**文件**：`packages/core/src/dsd-element.ts`  
**方法**：`_bindCurrentRenderTemplate()` (line 387)

**策略**：当 DSD 静态模板缺少 runtime markers 时，自动回退到完整 CSR 渲染路径。

```typescript
private _bindCurrentRenderTemplate(): void {
    this._disposeTemplateRuntime();
    this._disposeSignalSubscriptions();

    const result = this.render();
    if (!isTemplateResult(result) || !this.shadowRoot) return;

    // 检查是否有事件绑定需要 hydrate
    const bindings = collectRuntimeTemplateBindings(result);
    const hasEvents = bindings.events.length > 0;

    if (hasEvents) {
        // 检查 DSD 静态模板是否已有 markers
        const hasMarkers = bindings.events.some(b =>
            this.shadowRoot!.querySelector(`[data-less-event-${b.index}]`)
        );

        if (!hasMarkers) {
            // DSD 模板缺少 markers → 回退到 CSR 路径
            // renderTemplateToString 生成与静态模板结构一致的 HTML，
            // 但注入了 data-less-event-N 标记
            this.shadowRoot.innerHTML = renderTemplateToString(
                result, { runtimeMarkers: true }
            );
        }
    }

    this._bindTemplateRuntime(result);
    this._subscribeTemplateSignals(result);
}
```

**为什么安全**：
- `renderTemplateToString` 生成的 HTML 与静态 DSD 模板结构完全一致（相同的模板字符串），仅额外添加 `data-less-event-N` 属性
- 替换发生在 `connectedCallback` 期间，早于首次 paint，用户无感知
- 不影响 `_dsdHydrated` 标记后的信号驱动增量更新（`_patchBindings` 有自己的路径）

### 3.2 辅助修复：Search 统一放置

**文件**：`packages/ui/src/less-layout.ts`

将 `<less-search>` 作为 `less-layout` 的**内置渲染元素**，而非通过 slot 由各页面手动注入。

方案：
- `less-layout` 在 header 中直接渲染 `<less-search>`（当组件被 import 后可用）
- 各页面不再需要在 render 中手动放置 `<less-search slot="header-actions">`
- `section-renderer.ts` 的 SEARCH_DSD 注入逻辑可以删除

**注意事项**：
- `less-layout` (packages/ui) 和 `less-search` (www/app/islands) 属于不同层。直接在 framework 包中 import app 层的文件违反依赖方向
- 方案一：less-layout 保留 `<slot name="header-actions">` 但设置默认内容为 `<less-search>`——这需要在 SSG 层面处理
- 方案二：less-layout 接受 `show-search` 属性，渲染时根据此属性决定是否输出 `<less-search>` 模板——由 SSG 全局启用
- **推荐方案二**：保持 framework 层的独立性，由 app 层配置启用

### 3.3 清理：回退所有 Workaround

修复 `_bindCurrentRenderTemplate()` 后，以下 workaround 可以移除：

1. `www/app/islands/less-search.ts` — 移除 `_onTriggerClick` 和 imperative `addEventListener`
2. `www/app/islands/less-search.ts` — 移除 `override connectedCallback()` 中的额外 overlay 清理（如果 `super.connectedCallback()` 已正确重置状态）

---

## 四、验证标准

- [ ] `_bindCurrentRenderTemplate()` 修复后，search 按钮在所有页面上可点击并弹出搜索面板
- [ ] `less-theme-toggle` 在 DSD 页面上的 `@click` 切换主题功能正常
- [ ] `less-layout` 的 mobile menu `@click` 切换正常
- [ ] 无新增 console 错误或 warning
- [ ] e2e 测试通过（特别是搜索和导航相关测试）
- [ ] SSG 构建产物大小无明显增长（innerHTML 替换不应增加最终产物大小）
- [ ] 无视觉闪烁或布局偏移（CLS < 0.01）

---

## 五、根因总结

LessJS 的 DSD 架构有一个**系统性断点**：

1. **SSG 阶段**：调用 `render()` 生成纯 HTML 字符串作为 DSD 模板内容。`renderTemplateToString` 在此处不应启用 `runtimeMarkers`（标记是运行时概念，不应出现在静态 HTML 属性中）——这个设计是对的。
2. **Client DSD hydration 阶段**：`_bindCurrentRenderTemplate()` 尝试 hydrate 事件，但**依赖了不存在于静态 HTML 中的标记**——这是 bug。
3. **CSR 阶段**：`_renderIntoShadowRoot()` 先渲染带标记的 HTML 再 hydrate——这工作正常。

修复的核心原则：**当 DSD 静态模板缺少 hydration 所需标记时，框架应自动回退到带标记的完整渲染**。这保持了 DSD 的价值（首屏零 JS），同时在 hydration 时确保事件正确绑定。
