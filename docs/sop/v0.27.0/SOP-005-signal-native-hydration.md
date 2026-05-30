# SOP-005: Signal-Native Hydration — 全面实施 ADR-0067

> **版本**: v0.27.0
> **日期**: 2026-05-31
> **关联 ADR**: ADR-0067 (Ocean + Island Signal-Native Architecture)
> **前置**: SOP-004 (Unified VNode Pipeline — 部分完成)
> **状态**: 执行中

---

## 概述

本 SOP 实施 ADR-0067 定义的全新架构：

1. **用 `_hydrateSignals()` 取代 `_walkAndBind()`**——位置匹配 → 标记匹配
2. **所有 island 组件迁移到 `registerSignal()` + `data-signal`/`data-on` 标记**
3. **删除死代码和遗留机制**
4. **www 完全依赖框架，不留手写**

---

## Step 1: 实现 `_hydrateSignals()` — 核心 hydration 引擎

### 1.1 在 DsdElement 中新增 `#eventCleanups` 追踪

**文件**: `packages/core/src/dsd-element.ts`

在 `#effectDisposers` 下方追加：

```ts
/** v0.28: Event listener cleanup tracking. */
#eventCleanups: Array<() => void> = [];
```

### 1.2 实现 `_hydrateSignals()` 方法

**文件**: `packages/core/src/dsd-element.ts`

在 `_walkAndBind` 之前插入新方法：

```ts
/**
 * v0.28 (ADR-0067): Signal-native hydration.
 * Replaces _walkAndBind() — reads data-signal and data-on
 * markers from DSD shadow root, creates direct effect bindings.
 *
 * No position matching, no childNodes filtering, no VNode traversal.
 * Effects are tracked in #effectDisposers for batch cleanup.
 * Events are tracked in #eventCleanups for removeEventListener.
 */
private _hydrateSignals(): void {
  if (!this.shadowRoot) return;

  // --- Signal bindings: data-signal="signalName" ---
  for (const el of this.shadowRoot.querySelectorAll('[data-signal]')) {
    const name = el.getAttribute('data-signal');
    if (!name) continue;
    const sig = this.signalRegistry.get(name);
    if (!sig) continue;

    // Apply initial signal value as text content
    (el as HTMLElement).textContent = String(sig.value);

    // Create reactive effect binding
    const dispose = effect(() => {
      (el as HTMLElement).textContent = String(sig.value);
    });
    this.#effectDisposers.add(dispose);
  }

  // --- Event bindings: data-on-<event>="methodName" ---
  const EVENT_TYPES = ['click', 'input', 'change', 'submit', 'keydown'] as const;
  for (const eventType of EVENT_TYPES) {
    const attr = `data-on-${eventType}`;
    for (const el of this.shadowRoot.querySelectorAll(`[${attr}]`)) {
      const methodName = el.getAttribute(attr);
      if (!methodName) continue;
      const handler = (this as any)[methodName];
      if (typeof handler === 'function') {
        const bound = handler.bind(this);
        el.addEventListener(eventType, bound);
        this.#eventCleanups.push(() => el.removeEventListener(eventType, bound));
      }
    }
  }

  // --- Chromium DSD layout fix: force reflow without DOM rebuild ---
  requestAnimationFrame(() => {
    void (this as HTMLElement).offsetHeight;
  });
}
```

### 1.3 替换 `_hyrateExistingDom`

将方法体替换为调用 `_hydrateSignals()`：

```ts
private _hyrateExistingDom(): void {
  if (!this.shadowRoot) return;

  // Dispose previous effects and events
  for (const d of this.#effectDisposers) d();
  this.#effectDisposers.clear();
  for (const f of this.#eventCleanups) f();
  this.#eventCleanups = [];

  this._hydrateSignals();
}
```

### 1.4 更新 `disconnectedCallback`

加入 `#eventCleanups` 清理：

```ts
disconnectedCallback(): void {
  for (const d of this.#effectDisposers) d();
  this.#effectDisposers.clear();
  for (const f of this.#eventCleanups) f();
  this.#eventCleanups = [];
  disposeProps(this);
  disposeStaticProps(this as unknown as Record<string, unknown>);
}
```

---

## Step 2: 删除 `_walkAndBind` 及关联死代码

### 2.1 删除 `_walkAndBind` 方法

**文件**: `packages/core/src/dsd-element.ts`

删除整个 `_walkAndBind()` 方法（~80 行）。

### 2.2 删除 `_walkAndBind` 中引用的死导入

检查并删除仅被 `_walkAndBind` 使用的导入：
- 如果 `isSignalLike` 不再被其他地方使用，删除导入

### 2.3 删除 `_layoutWorkaroundReRender` 的遗留注释

搜索 `_layoutWorkaroundReRender` 残留注释，全部清理。

---

## Step 3: SSR 端 — `data-on` 事件标记生成

### 3.1 修改 `renderToString` 序列化事件

**文件**: `packages/core/src/jsx-render-string.ts`

在 `serializeAttrs` 或 `renderToString` 的 VNode 处理中，识别 `onClick`/`onInput`/`onChange` 等 JSX 事件 prop，输出 `data-on-click`/`data-on-input` 等 HTML 属性：

```ts
// 在 renderToString 的 element 分支中
const eventMap: Record<string, string> = {
  onClick: 'click',
  onInput: 'input',
  onChange: 'change',
  onSubmit: 'submit',
  onKeydown: 'keydown',
};

const dataOnAttrs: string[] = [];
for (const [key, value] of Object.entries(props)) {
  const eventType = eventMap[key];
  if (eventType && typeof value === 'function') {
    // Function identity lost in SSR — output method name marker
    // Method name extracted from function name or passed explicitly
    dataOnAttrs.push(` data-on-${eventType}="${getMethodName(value)}"`);
  }
}
```

### 3.2 方法名提取

```ts
function getMethodName(fn: Function): string {
  // Bound methods and arrow functions don't have useful names
  // Components must use named methods or pass explicit names
  if (fn.name && fn.name !== 'bound' && fn.name !== '') return fn.name;
  return '__anonymous__'; // fallback — still outputs marker but needs explicit naming
}
```

### 3.3 扩展 `serializeAttrs` — 跳过事件 prop 的 attribute 序列化

事件 prop（`onClick` 等）不应作为 HTML 属性输出——它们在 `data-on-*` 标记中处理。

---

## Step 4: 迁移 Island 组件

### 4.1 home-console.tsx

**文件**: `www/app/islands/home-console.tsx`

```tsx
class HomeConsole extends DsdElement {
  #count = signal(0);

  constructor() {
    super();
    this.registerSignal('count', this.#count);
  }

  override connectedCallback() {
    super.connectedCallback(); // calls _hydrateSignals()
    const theme = consumeContext(THEME_CTX);
    this.setAttribute('data-theme', theme.value);
    theme.subscribe((t) => this.setAttribute('data-theme', t));
  }

  override render() {
    return (
      <div class="counter">
        <span class="counter-value" data-signal="count" textContent={this.#count}></span>
        <button data-on-click="decrement">-</button>
        <button data-on-click="increment">+</button>
      </div>
    );
  }

  decrement() { this.#count.value--; }
  increment() { this.#count.value++; }
}
```

**变更**：
- 添加 `registerSignal('count', this.#count)`
- JSX 中添加 `data-signal="count"` 和 `data-on-click="increment/decrement"`
- **删除** `import { effect }` — 不再需要手动 effect
- **删除** manual `effect(() => el.textContent = ...)` 代码

### 4.2 less-search.tsx

**文件**: `www/app/islands/less-search.tsx`

**变更**：
- 添加 `registerSignal('open')`、`registerSignal('query')`、`registerSignal('results')`
- `data-on-click="onSearchTrigger"` / `data-on-input="onSearchInput"` / `data-on-keydown="onSearchKeydown"` 标记
- Overlay 可见性通过 CSS class + effect 控制（临时，等 Show 组件就绪）

### 4.3 reactive-showcase.tsx

**文件**: `www/app/islands/reactive-showcase.tsx`

**变更**：
- `registerSignal('count')`、`registerSignal('isDark')`
- 对应 `data-signal` 和 `data-on-*` 标记

### 4.4 less-toc.tsx

**文件**: `www/app/islands/less-toc.tsx`

**变更**：
- `registerSignal('activeHeading')`
- 滚动追踪用 IntersectionObserver（非信号驱动的 Web API，不需 `data-signal`）

### 4.5 scroll-reveal.tsx

**文件**: `www/app/islands/scroll-reveal.tsx`

**不变**：纯 IntersectionObserver，无信号。Ocean 组件。

### 4.6 less-layout.tsx

**文件**: `packages/ui/src/less-layout.tsx`

**变更**：
- `registerSignal('locale')`、`registerSignal('currentPath')`
- Router 管理的信号不需要 `data-signal` 标记——它们修改的是组件属性，不是子 DOM 节点
- `data-on-click` 标记用于 lang-switch、theme-toggle

---

## Step 5: 清理遗留代码

### 5.1 删除不再需要的导入

**文件**: `packages/core/src/dsd-element.ts`

检查并删除：
- `isSignalLike` 导入（如果只被 `_walkAndBind` 使用）
- `renderToDom` 导入（如果只被 `_layoutWorkaroundReRender` 使用）
- 任何仅被已删除方法引用的导入

### 5.2 清理 `renderToString` 双路径残留

**文件**: `packages/core/src/jsx-render-string.ts`

确认：
- `data-signal` 属性生成逻辑正确（已在 Step 3 中处理）
- `data-on-*` 事件标记生成正确

### 5.3 清理未使用的 `applyProps` 参数

**文件**: `packages/core/src/jsx-render-dom.ts`

如果 `applyProps` 的 `disposers` 参数仅在 hydration 路径使用且 hydration 路径已重写，简化签名。

### 5.4 删除 `renderToString` 中 `textContent` prop 的独立处理

`textContent` prop 的 SSR 处理逻辑（`if (key === 'textContent') continue` + `escapeHtml` child）保留——它是 `data-signal` 标记生成的前置条件。确认信号检测逻辑正确（`isSignalLike(props.textContent)`）。

---

## Step 6: 构建验证

### 6.1 TypeScript 类型检查

```bash
deno check packages/core/src/dsd-element.ts
deno check packages/core/src/jsx-render-string.ts
deno check packages/core/src/index.ts
```

### 6.2 Lint

```bash
deno lint packages/core/src/dsd-element.ts
deno lint packages/core/src/jsx-render-string.ts
```

### 6.3 构建 SSG

```bash
deno task build:docs
```

### 6.4 验证 SSR 输出

```bash
# 确认 data-signal 属性在产物 HTML 中
grep -r "data-signal" www/dist/ --include="*.html" | wc -l
# 确认 data-on-click 属性在产物 HTML 中
grep -r "data-on-click" www/dist/ --include="*.html" | wc -l
# 确认旧属性不存在
grep -r "data-less-" www/dist/ --include="*.html" | wc -l  # 应为 0
```

### 6.5 Playwright E2E 验证

```bash
# 启动本地构建服务
cd www/dist && python -m http.server 8765 &
# 运行 E2E 测试
npx playwright test www/e2e/islands-reactivity.spec.ts
```

**测试覆盖**：
1. 首页 counter 点击 +/- 值变化
2. SPA 导航无崩溃
3. i18n lang-switch 正常工作
4. Search 搜索功能
5. 0 console errors

---

## Step 7: 格式化和提交

### 7.1 Fmt

```bash
deno fmt packages/core/src/dsd-element.ts \
        packages/core/src/jsx-render-string.ts \
        packages/core/src/index.ts \
        www/app/islands/home-console.tsx \
        www/app/islands/less-search.tsx \
        www/app/islands/reactive-showcase.tsx \
        www/app/islands/less-toc.tsx \
        packages/ui/src/less-layout.tsx
```

### 7.2 Commit

```
refactor(v0.28): _hydrateSignals replaces _walkAndBind

ADR-0067 implementation:
- _hydrateSignals(): marker-driven hydration (data-signal + data-on)
- DELETE _walkAndBind (80 lines of position matching)
- DELETE _layoutWorkaroundReRender remnants
- SSR: data-on-* event markers in renderToString
- Island components: registerSignal() + data-* markers
- All manual effect() workarounds removed from www components
- 0 framework violations in www
```

---

## 回滚计划

如果新 hydration 未通过 Playwright 测试，回滚至 `faadd3c3`（effectScope 删除后的状态），保留 `_walkAndBind` 作为 fallback path，用 `_hydrateSignals()` 作为优先路径（`try { _hydrateSignals() } catch { _walkAndBind() }`）。

---

## 附录：文件清单

| 文件 | 操作 | 变更量 |
|---|---|---|
| `packages/core/src/dsd-element.ts` | 重写 hydration 路径 | +50 -80 |
| `packages/core/src/jsx-render-string.ts` | 加 data-on-* 标记 | +15 |
| `packages/core/src/jsx-render-dom.ts` | 简化 applyProps 签名 | -5 |
| `www/app/islands/home-console.tsx` | 迁移到 registerSignal | +5 -10 |
| `www/app/islands/less-search.tsx` | 迁移到 registerSignal | +8 -30 |
| `www/app/islands/reactive-showcase.tsx` | 迁移到 registerSignal | +5 -5 |
| `www/app/islands/less-toc.tsx` | 迁移到 registerSignal | +3 |
| `packages/ui/src/less-layout.tsx` | 添加 data-on-* 标记 | +3 |
