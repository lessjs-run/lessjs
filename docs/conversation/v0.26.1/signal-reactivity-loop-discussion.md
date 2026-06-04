# v0.26.1 Signal 响应式死循环：问题分析与方案讨论

日期: 2026-05-29\
涉及组件: `less-theme-toggle`, `DsdElement`, `@openelement/signals`\
状态: 讨论完成，进入 ADR 阶段

---

## 1. 问题描述

### 1.1 现象

`less-theme-toggle` 作为 island 组件（`defineIsland('home-console', ..., { strategy: 'idle' })`）在 CSR 路径下触发无限递归，浏览器抛出 `RangeError: Maximum call stack size exceeded`。

### 1.2 调用栈

```
connectedCallback (island-demo-idle.js)
  → _renderOrHydrate
    → onCsrRendered
      → _initTheme
        → signal.value = 'dark'
          → effect() 回调
            → render()
              → clear shadow DOM + rebuild
                → 触发 island runtime 元素重建
                  → connectedCallback (重新触发)
```

### 1.3 根因分析

问题涉及**三层耦合**：

**Layer 1 — Island Runtime 的 signal 监听**：`defineIsland()` 包装了 `connectedCallback`，但关键在于 `DsdElement._renderIntoShadowRoot()` 在初次渲染后创建了一个 `effect()` 回调：

```typescript
// dsd-element.ts:491 (旧代码)
this._vnodeEffectDispose = effect(() => {
    const updated = this.render();       // (1) 全量 re-render → VNode
    // ...
    while (this.shadowRoot!.firstChild) {
        this.shadowRoot!.removeChild(    // (2) 清空 shadow DOM
            this.shadowRoot!.firstChild
        );
    }
    this.shadowRoot!.appendChild(
        renderToDom(updated, ...)        // (3) 新建 DOM 并追加
    );
});
```

**Layer 2 — 组件初始化修改 signal**：`_initTheme()` 在生命周期中被调用，根据 `<html data-theme>` / `localStorage` / `prefers-color-scheme` 解析主题，并设置 `this._theme.value`。

**Layer 3 — CSS class 依赖 signal 值**：`render()` 读取 `this._theme.value` 来决定 `className`：

```typescript
const lightClass = this._theme.value === 'light' ? ' is-light' : '';
return <button className={`theme-toggle${lightClass}`} ...>...</button>;
```

**死循环路径**：

1. `connectedCallback` → `_renderIntoShadowRoot()` 首次 render，创建 button DOM，设置 effect
2. effect 立即执行（alien-signals 的 `effect()` 首轮同步执行以收集依赖），读取 `_theme.value`
3. `onCsrRendered()` 或 `requestAnimationFrame(() => _initTheme())` 设置 `_theme.value = 'dark'`
4. signal 变化 → effect 再次触发 → `render()` 返回新 VNode → `removeChild() + appendChild()` 销毁并重建 button
5. button 被销毁重建 → island runtime 的元素 identity 变化 → 触发 `connectedCallback` → 回到步骤 1

**关键洞察**：`effect(() => render() + clear + rebuild)` 这个模式本身就是 VDOM。signal 变化 → 全量 render → 必须拿新旧 VNode 做 diff 或者清掉重建。但清掉重建导致元素 identity 丢失，进而触发生命周期重入。

这个死循环的根因不是 `onCsrRendered` 里调不调 `_initTheme`，不是用不用 `requestAnimationFrame`，不是加没加 `_initDone` guard。这些全部是 symptom-level 的绕过尝试。

**真正的架构矛盾是**：`effect() + 全量 render + clear+rebuild` 与 Web Components 的 `connectedCallback` 语义不兼容。

---

## 2. 方案空间

### 2.1 方案 A：VDOM 原地 patch（当前已实现）

**思路**：保留 `effect(() => this.render())` 模式，但在 effect 回调中不做 clear+rebuild，改为：

- 保存 root DOM element 引用
- 新 VNode 的 root tag 相同时：`applyProps()` 更新属性 + 递归 `_patchChildren()` 比对子节点
- root tag 不同时：fallback 到 clear+rebuild

**实现**：已在 `dsd-element.ts` 中完成（`_patchChildren` 方法 + 修改 `_renderIntoShadowRoot` 和 `_hyrateExistingDom` 的 effect 回调）。

**优点**：

- 改动量小（约 120 行新增代码）
- 不改变 API
- 立即可用，所有测试通过

**缺点**：

- **本质上是 VDOM diff**，与 LessJS 的 "real DOM" 定位矛盾
- `_patchChildren` 是 index-based reconciliation，不支持 key-based diff
- 每次 signal 变化仍全量执行 `render()`，CPU 开销没减少
- 维护成本：`_patchChildren` 需要随 VNode 演进保持同步
- 子节点结构性变化（如条件渲染 `{dark ? <MoonIcon/> : <SunIcon/>}`）patch 会退化为 replace

### 2.2 方案 B：Signal→DOM 直接绑定（Real DOM）

**思路**：彻底删除 `effect(() => this.render())`。改为 `applyProps()` 检测到 signal-like 值时，不设静态值，而是创建 `effect(() => { el.setAttribute(attr, signal.value) })`。signal 变化只动这一个 DOM 属性，不进 render、不进生命周期。

```
现在（方案 A / 旧代码）: signal变 → effect(render) → VNode树 → diff/patch → DOM
方案 B:                 signal变 → effect(el.className = ...) → DOM
```

**实现要点**：

1. `applyProps` 检测 `isSignalLike(value)`，创建 `effect(() => el.setAttribute(attr, unwrapSignalLike(value)))`，disposer 挂到 AbortController
2. `_renderIntoShadowRoot` 删除 `effect(() => this.render())` 段落
3. JSX render 中 signal 值自动转为信号绑定，非 signal 值保持静态

**优点**：

- **真正的 Real DOM**：signals 直连 DOM 属性，无需 VNode diff
- 彻底消除 `connectedCallback` 重入风险（元素identity 不变）
- render 只执行一次（首次），后续更新零 overhead
- 性能最优：只更新变化的属性/节点

**缺点**：

- 改动量中等（`jsx-render-dom.ts` + `dsd-element.ts` + `jsx-render-string.ts`）
- 条件渲染（`{dark ? A : B}`）需要额外处理——signal 值无法直接驱动子节点替换
  - **解法**：提供 `<Show when={signal}>` 和 `<For each={signal}>` 控制流组件（SolidJS 模式）
  - MVP 阶段可先不覆盖条件渲染，`less-theme-toggle` 等 class-only 的组件不受影响
- 需要确保 SSR (`renderToString`) 路径正确 unwrap signal 值的首轮快照

### 2.3 方案 C：组件侧规避

**思路**：不改 runtime，让 `less-theme-toggle` 不依赖 signal 驱动自身 DOM：

- 删除 `_theme` signal
- CSS class 用 `this.classList.toggle('is-light')` 手动管理
- 主题状态用 `getAttribute('data-theme')` 读写
- 其他组件通过 `less:theme-change` 事件获知变化

**优点**：

- 改动最小（仅 `less-theme-toggle.tsx`）

**缺点**：

- 这不是修复，这是规避。其他组件迟早撞上同一个问题
- 破坏了 signal 的使用一致性："有的组件能用 signal，有的不行"——开发体验灾难
- 不解决任何系统性问题

### 2.4 方案 D：Island runtime 不做 signal 驱动的元素重建

**思路**：Island runtime 检测到 signal 变化时不重建元素，只让组件自己处理 re-render。

**优点**：

- 概念上正确——island runtime 不应该介入组件的内部状态管理

**缺点**：

- Island runtime 目前是 framework-agnostic 的（支持 Lit、vanilla WC 等），改 island runtime 会影响所有 island 类型
- 实际上 island runtime 的 "重建" 行为来自 `defineIsland` 的 `connectedCallback` wrapper + `bindEvents`——它并不知道 signal 的存在，只是一个通用 wrapper
- Island runtime 本身并没有"检测 signal 变化然后重建"的逻辑——这个问题完全在 `DsdElement` 层

---

## 3. 方案评估矩阵

| 维度                 | 方案 A (VDOM patch)                        | 方案 B (Real DOM binding)     | 方案 C (组件规避) | 方案 D (改 island)     |
| -------------------- | ------------------------------------------ | ----------------------------- | ----------------- | ---------------------- |
| 解决根因             | ⚠️ 症状级（patch 代替 clear，但还是 VDOM） | ✅ 根因级（消除全量 render）  | ❌ 规避           | ❌ 不相关              |
| 与 LessJS 定位一致性 | ❌ VDOM diff 与 "real DOM" 矛盾            | ✅ Real DOM，SolidJS 模式     | ⚠️ 不一致的 DX    | ➖ 无关                |
| 实现复杂度           | 🟢 低（已完成）                            | 🟡 中（~300 行改动）          | 🟢 低             | 🔴 高（影响面大）      |
| 向后兼容             | ✅ 完全兼容                                | ⚠️ 条件渲染需额外组件         | ✅ 完全兼容       | ❌ 破坏性              |
| 性能                 | 🟡 每次 signal 变化全量 render             | ✅ 只更新变化的属性           | ✅ 无额外开销     | ➖ 无关                |
| 长期维护             | 🔴 diff 逻辑需持续维护                     | ✅ 少维护                     | 🟢 少维护         | 🔴 island runtime 维护 |
| 生态风险             | 🟡 "为什么 DSD-first 框架有 VDOM"          | 🟢 对标 SolidJS/Qwik 成熟模式 | 🔴 用户困惑       | 🔴 fragmentation       |

---

## 4. 结论

**方案 B（Signal→DOM 直接绑定）是唯一与 LessJS "Real DOM" 定位一致的架构级修复。** 方案 A 作为止血 patch 已经写入代码，但不应是最终状态。

方案 B 的核心思想：**destroy `effect(() => this.render())`，改为 `effect(() => el.someAttribute = signal.value)`**。参照 SolidJS 的细粒度更新模型，但限制在 LessJS 的 Web Components 边界内——只在本组件的 shadow DOM 内做绑定，不跨组件树。

---

## 5. 后续步骤

1. ADR-0058 记录此决议
2. SOP-v0.26.1-001 编写逐步实现步骤
3. 执行实现
4. 验证 `less-theme-toggle` 不再死循环
