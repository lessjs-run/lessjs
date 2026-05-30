# LessJS v0.26.1 Framework & WWW Code Quality Audit

> **哲学**: 不要堆屎山
> **日期**: 2026-05-30
> **范围**: `packages/core/src/`, `packages/ui/src/`, `www/`
> **方法**: 逐文件审查信号滥用、死代码、冗余逻辑、可简化模式

---

## 1. packages/core/src/ 审计

### 1.1 dsd-element.ts — 总体可接受，两处可简化

| # | 行号 | 问题 | 建议 | 严重度 |
|---|------|------|------|--------|
| 1 | 62-63 | `@lessjs/signals` 被 import 了两次：`import { signal, effectScope } from '@lessjs/signals';` + `import { effect } from '@lessjs/signals';` | 合并为一行：`import { effect, effectScope, signal } from '@lessjs/signals';` | LOW |
| 2 | 80-95 | `_SsrHTMLElementStub` 类从未被实例化或引用——它的唯一用途是赋值给 `globalThis.HTMLElement`。实际上 `globalThis.HTMLElement = _SsrHTMLElementStub` 只在 `typeof HTMLElement === 'undefined'` 时发生。该 stub 缺少 `connectedCallback` 和 `observedAttributes`，这会导致继承链错误。 | 审计该 stub 是否被 SSR 使用。如果 SSR 使用 happy-dom，这个 stub 应该被删除。 | MEDIUM |

**render() 信号访问**: dsd-element.ts 自身不在 render() 中读 signal.value。它使用 effectScope 模式——正确。

**注释残留**: 第 400-402 行注释提到已删除的 `_disposeTemplateRuntime` + `_disposeSignalSubscriptions`——可以删除。

### 1.2 jsx-render-dom.ts — signal 参数闲置

| # | 行号 | 问题 | 建议 | 严重度 |
|---|------|------|------|--------|
| 3 | 140-186 | `applyProps(el, props, signal?)` 和 `renderToDom(node, signal?)` 的 `signal` (AbortSignal) 参数在所有内部调用路径中均未传递。核心渲染流程中唯一调用处是 `_walkAndBind` (dsd-element.ts:356) 和 `_renderIntoShadowRoot` (dsd-element.ts:494)，均不传 signal。 | effectScope 已经处理清理（dsd-element.ts:297 dispose）。signal 参数可以移除以简化签名。如果这是公开 API（index.ts 导出），先检查是否有外部调用者。 | MEDIUM |
| 4 | 174-178 | `applyProps` 中 signal → DOM 效果仍手动绑定 `signal.addEventListener('abort', dispose, { once: true })`。这个清理已经被 effectScope 覆盖——双重清理。 | 移除手动 signal→abort 绑定，依赖 effectScope 统一清理。 | LOW |

### 1.3 jsx-render-string.ts — 无问题

- 没有未使用的导出
- `serializeAttrs` 作为内部函数正确，不需要导出
- `styleObjectToString` 同样是内部的
- `renderToString` 是唯一的公开导出——正确

**无死代码，无冗余。**

### 1.4 jsx-runtime.ts — jsxs 冗余

| # | 行号 | 问题 | 建议 | 严重度 |
|---|------|------|------|--------|
| 5 | 95-114 | `jsx()` 和 `jsxs()` 是逐字相同的——都调用 `createVNode(tag, props, key)`。TypeScript JSX 转换根据子元素数量选择不同的工厂，但 LessJS 内部不需要这个区别。 | 可选：将 `jsxs` 设为 `jsx` 的别名（`export const jsxs = jsx;`）。保持它们分离也没问题（类型安全）。 | LOW |

**Show/For**: 用法正确。`Show` 和 `For` 函数返回带有内部符号的 VNode。`renderToDom` 和 `renderToString` 都正确匹配 `SHOW_TAG`/`FOR_TAG`。无死代码。

### 1.5 signal-context.ts — 未使用的 host 参数

| # | 行号 | 问题 | 建议 | 严重度 |
|---|------|------|------|--------|
| 6 | 48 | `consumeContext(_host: HTMLElement, ctx)` — `_host` 参数未被使用（有下划线前缀）。v0.26.1 修复后，signals 存储在中心 `contexts` Map 中，不再需要 DOM 遍历。 | 移除 `_host` 参数：`consumeContext(ctx: Context<T>)`。需要更新所有调用处。 | MEDIUM |

**影响分析**: 搜索 `consumeContext(` 的所有调用处。目前在 `home-console.tsx:134` 和可能的其他位置使用。签名变更是破坏性的但范围小。

### 1.6 signal-like.ts — 没问题

- `isSignalLike()` 被以下模块使用：`dsd-element.ts` (line 345), `jsx-render-dom.ts` (lines 16, 169, 211), `jsx-render-string.ts` (line 18)
- `unwrapSignalLike()` 被以下模块使用：`jsx-render-dom.ts` (lines 105, 171, 182), `jsx-render-string.ts` (lines 79, 91), `prop.ts`
- 这两个函数都在需要的地方使用

**无死代码。正确放置，恰当使用。**

### 1.7 render-dsd.ts — 一个死变量

| # | 行号 | 问题 | 建议 | 严重度 |
|---|------|------|------|--------|
| 7 | 77 | `const _textEncoder = new TextEncoder();` — 声明但从未使用。在代码库任何地方引用 0 次。 | 删除。 | HIGH |

**其他**: 第 441-447 行的向后兼容性重新导出是合理的（从 `render-dsd-stream.js` 重新导出 streaming API）。

### 1.8 prop.ts — 可以接受

- `PropertyOptions` 接口是内部的，未导出——正确
- `.value` 访问仅限于内部信号实现（`createPropSignal`）——正确
- `unwrap()` 导出是公共 API——被使用

**无死代码。结构良好。**

---

## 2. packages/ui/src/ 审计

### 2.1 less-theme-toggle.tsx — 正确重写

| # | 行号 | 问题 | 建议 | 严重度 |
|---|------|------|------|--------|
| - | 151-196 | `render()` 方法零 signal.value 读取。`data-theme={this._theme}` 将信号对象作为 prop 传递——`applyProps` 通过 effect 绑定处理。 | **已正确实现。无需更改。** | ✅ 通过 |

**render() 之外**: `.value` 使用仅限于事件处理器和生命周期（`_handleToggle`, `_initTheme`, `attributeChangedCallback`）——这些都是信号交互的正确位置。

结论：**重写完成。无残留 signal.value。**

### 2.2 less-layout.tsx — render() 中无信号，但有冗余属性读取

| # | 行号 | 问题 | 建议 | 严重度 |
|---|------|------|------|--------|
| 8 | 654-667 | `_renderLayout()` 对每个属性（`logo-text`, `logo-sub`, `footer-text`, `github-url` 等）调用 `this._getStr()`，每个都在内部读取 JS 属性和 HTML 属性。`_currentPath()` 被调用了 4 次（lines 655/663/786/818）。 | 在 render 开始时缓存结果以避免重复 I/O：`const path = this._currentPath();` 然后到处复用。 | LOW |

**render() 中无 signal.value 读取**——所有值都是属性读取或字符串拼接。

### 2.3 less-hero-ping.tsx — 不是基于信号的

| # | 行号 | 问题 | 建议 | 严重度 |
|---|------|------|------|--------|
| 9 | 119-141 | `render()` 读取 `this._state` 和 `this._msg`——这些是 POJO 字段，不是信号。每次状态改变时通过 `this.update()` 触发完全重新渲染。 | 对于极简组件来说可以接受。为了保持一致性，可以迁移到信号。不紧迫。 | LOW |

### 2.4 open-props-tokens.ts — CSS 完整

open-props-tokens.ts 包含：
- 2 个主题（`:host` 和 `:host([data-theme="dark"])`）
- 完整的 grayscale 调色板（12 步）
- 完整的 brand 语义标记
- 动画缓动、持续时间、排版比例、z-index 层级
- 布局标记（header 高度、滚动条样式）
- `:host` 基础规则（第 63 行正确设置了 `display: block; min-height: 1px; contain: layout style;`）

**CSS 完整。无需添加标记。**

### 2.5 所有其他 `less-*.tsx` 文件 — render() 中无 signal.value

| 组件 | render() 模式 | 状态 |
|-------|---------------|-------|
| `less-button.tsx` | 仅读取 `getAttribute()` | ✅ 干净 |
| `less-callout.tsx` | 仅读取 `getAttribute()` | ✅ 干净 |
| `less-card.tsx` | 仅结构，静态 JSX | ✅ 干净 |
| `less-code-block.tsx` | 仅结构，静态 JSX | ✅ 干净 |
| `less-dialog.tsx` | 仅读取 `getAttribute()` | ✅ 干净 |
| `less-input.tsx` | 仅读取 `getAttribute()` | ✅ 干净 |
| `less-step-card.tsx` | 仅读取 `getAttribute()` | ✅ 干净 |

---

## 3. www/ 审计

### 3.1 www/app/islands/ — 两个组件存在问题

#### ✅ counter-island.tsx — 正确
- 第 83 行: `{this.#count}` — 信号对象作为子元素传递 → renderToDom 处理绑定。**正确。**

#### ✅ home-console.tsx — 正确
- 类名信号（`#graphPaneClass`, `#counterPaneClass`, `#graphTabClass`, `#counterTabClass`）通过 computed() 计算，作为 props 传递。
- 文本子元素（`{this.#tabTitle}`, `{this.#count}`）是传递给 renderToDom 的信号对象。
- render() 中零 `.value` 读取。**正确。**

#### ❌ reactive-showcase.tsx — render() 中存在信号滥用

| # | 行号 | 代码 | 问题 |
|---|------|------|------|
| 10 | 118 | ``className={`theme-preview ${this.#isDark.value ? 'dark' : 'light'}`}`` | **render() 中的 `.value`！** 将渲染锁定为一次性快照——主题切换需要完全重新渲染。应该使用 computed 信号或通过 applyProps 将信号作为 prop 传递。 |
| 11 | 120 | `<strong>{this.#isDark.value ? 'dark' : 'light'}</strong>` | **render() 中的 `.value`！** 同上。 |
| 12 | 123 | ``Toggle {this.#isDark.value ? 'light' : 'dark'}`` | **render() 中的 `.value`！** 同上。 |
| 13 | 143 | `{this.#filtered.value.map(...)}` | **render() 中的 `.value`！** #filtered 是 computed——在 render 中展开会生成静态数组，破坏响应性。 |

**建议修复**: 使用 Show/For 组件或信号属性传递，类似于 home-console.tsx 中的模式：
```tsx
// 而非:
<div className={`theme-preview ${this.#isDark.value ? 'dark' : 'light'}`}>
// 使用:
const #themeClass = computed(() => `theme-preview ${this.#isDark.value ? 'dark' : 'light'}`);
<div className={this.#themeClass}>

// 而非:
{this.#filtered.value.map((f) => <div key={f}>{f}</div>)}
// 使用:
<For each={this.#filtered}>{(f) => <div key={f}>{f as string}</div>}</For>
```

#### ❌ less-toc.tsx — render() 中信号展开

| # | 行号 | 代码 | 问题 |
|---|------|------|------|
| 14 | 165 | `const headings = this.#headings.value;` | **render() 中的 `.value`！** headings 更新时需要完全重新渲染。 |
| 15 | 166 | `const activeId = this.#activeId.value;` | **render() 中的 `.value`！** activeId 更新时需要完全重新渲染。 |

**影响分析**: 与 reactive-showcase 不同，less-toc 已经对信号变化进行完全重新渲染（connectedCallback 中的 IntersectionObserver 写入信号 → DsdElement.requestReactiveUpdate → _renderIntoShadowRoot）。模式一致但次优——应该像 less-theme-toggle.js 一样将信号向下传递，供 applyProps 处理。

#### less-search.tsx — 可接受
- render() 返回静态 JSX——无信号子元素。
- `.value` 使用仅限于事件处理器和命令式覆盖逻辑（`_onInput`, `_resetState`）。
- 覆盖层完全通过命令式 DOM 管理。**可以接受。**

#### less-term.tsx — 可接受
- render() 返回静态 JSX——无信号子元素。
- `.value` 使用仅限于事件处理器（`_onKey` 中的箭头键历史记录）。
- 输出通过 `_addLine()` 命令式管理。**可以接受。**

#### api-consumer.tsx — 可以接受
- 使用 POJO 字段（`#apiData`, `#apiLoading` 等），不是信号。
- 通过 `requestUpdate()` 进行完全重新渲染。
- 对于非响应式状态更改来说可以接受。

### 3.2 www/app/routes/ — 无实时信号问题

路由页面（`*.tsx`）是 SSG 页面——它们不渲染实时信号。所有 `.value` 出现都在：
- 代码示例/教程内容中（`core-concepts.tsx`, `islands-and-ssr.tsx`）——有意为之
- CSS 类名中（`benchmark.tsx:20` `.metric .value`）——CSS，不是信号
- DOM 输入属性中（`registry/index.tsx:360,448`）——命令式，不是信号

**无问题。**

### 3.3 www/app/components/page-styles.ts — 重复的 CSS

| # | 行号 | 问题 | 建议 | 严重度 |
|---|------|------|------|--------|
| 16 | 235-241 vs 318-331 | `.nav-row` 定义重复。第一组（235-241）定义了 `margin-top: 2.5rem; display: flex; justify-content: space-between;`。第二组（318-331）用 `margin-top: 2rem; padding-top: 1rem; border-top` 覆盖了它。`.nav-link` 也被重复定义（242-255 vs 325-331）。 | 删除第一组（235-255），保留较新的 v0.26 版本（318-331）。合并样式。 | MEDIUM |

---

## 4. 汇总与建议

### 4.1 按严重度统计

| 严重度 | 数量 | 项目 |
|--------|-------|-------|
| HIGH | 1 | render-dsd.ts `_textEncoder` 未使用 |
| MEDIUM | 4 | signal-context `_host` 参数, applyProps `signal` 参数, page-styles 重复 CSS, dsd-element SSR stub 审计 |
| LOW | 9 | 合并导入, jsxs 别名, less-layout 属性缓存, Show/For 为 reactive-showcase/less-toc 生成 |

### 4.2 今日变更文件数

本次审计未跟踪 git 变更（非目标范围）。建议的变更为：

| 区域 | 需要编辑的文件 | 变更类型 |
|------|-----------------|----------|
| core | `render-dsd.ts` | 删除 `_textEncoder` |
| core | `signal-context.ts` | 移除 `_host` 参数 |
| core | `dsd-element.ts` | 合并 @lessjs/signals 导入 |
| core | `jsx-render-dom.ts` | 审计/移除 `signal` 参数 |
| www | `reactive-showcase.tsx` | 修复 4 处 signal.value |
| www | `less-toc.tsx` | 修复 2 处 signal.value |
| www | `page-styles.ts` | 移除重复的 `.nav-row` |

**总计: 7 个文件**

### 4.3 死代码候选

| 项目 | 文件:行号 | 类型 |
|------|-----------|------|
| `_textEncoder` | render-dsd.ts:77 | 未使用的常量 |
| `consumeContext._host` | signal-context.ts:48 | 未使用的参数 |
| 重复的 `.nav-row` CSS | page-styles.ts:235-255 | 被覆盖的 CSS |

### 4.4 冗余

| 项目 | 位置 | 类型 |
|------|------|------|
| `jsxs` 与 `jsx` 相同 | jsx-runtime.ts:95-114 | 函数重复 |
| 双重导入 `@lessjs/signals` | dsd-element.ts:62-63 | 导入重复 |
| 重复的 `.nav-row` / `.nav-link` CSS | page-styles.ts:235-241,318-331 | CSS 重复 |
| `signal` 参数（AbortSignal）重复了现有的 effectScope 清理 | jsx-render-dom.ts:140-186 | 双重清理 |

### 4.5 建议（按优先级）

#### 立即（删除死代码——零风险）
1. 删除 `render-dsd.ts:77` 的 `_textEncoder`
2. 合并 `dsd-element.ts:62-63` 的 `@lessjs/signals` 导入
3. 移除 `page-styles.ts:235-255` 的重复 CSS
4. 删除 `dsd-element.ts:400-402` 的注释残留

#### 短期（修复 signal.value 滥用）
5. 重写 `reactive-showcase.tsx` 使用 computed 信号 + signal 属性（如 home-console.tsx）
6. 重写 `less-toc.tsx` 使用 signal 属性传递

#### 中期（简化 API）
7. 从 `signal-context.ts` 的 `consumeContext()` 中移除 `_host` 参数
8. 审计 `applyProps` 的 `signal` 参数——如果有外部调用者则保留，否则移除
9. 审计 dsd-element.ts 中的 `_SsrHTMLElementStub`——如果 SSR 使用 happy-dom 则不必要

---

## 附录 A: signal.value 审计检查清单

| 文件 | render() 中的 .value？ | 状态 |
|------|----------------------|-------|
| `less-theme-toggle.tsx` | 否 | ✅ 已修复 (v0.26.1) |
| `less-layout.tsx` | 否 | ✅ 干净 |
| `less-button.tsx` | 否 | ✅ 干净 |
| `less-callout.tsx` | 否 | ✅ 干净 |
| `less-card.tsx` | 否 | ✅ 干净 |
| `less-code-block.tsx` | 否 | ✅ 干净 |
| `less-dialog.tsx` | 否 | ✅ 干净 |
| `less-hero-ping.tsx` | 不适用（无信号） | ✅ 干净 |
| `less-input.tsx` | 否 | ✅ 干净 |
| `less-step-card.tsx` | 否 | ✅ 干净 |
| `counter-island.tsx` | 否 | ✅ 干净 |
| `home-console.tsx` | 否 | ✅ 干净 |
| `less-search.tsx` | 否 | ✅ 干净 |
| `less-term.tsx` | 否 | ✅ 干净 |
| `api-consumer.tsx` | 不适用（无信号） | ✅ 干净 |
| **`reactive-showcase.tsx`** | **是 (4 处)** | ❌ **需要修复** |
| **`less-toc.tsx`** | **是 (2 处)** | ❌ **需要修复** |

## 附录 B: 导入审计

没有发现未使用的导入。所有组件导入的都是它们使用的符号。
