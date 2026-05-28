# ADR-0057: JSX + Signal 新组件模型，替换 html tagged template

> **状态**: PROPOSED\
> **日期**: 2026-05-28\
> **作者**: LessJS 架构团队\
> **关联**: ADR-0036 (Ocean-Island), ADR-0051 (template strengthening), ADR-0052 (@prop decorator), ADR-0053 (unified errors)\
> **前置**: [JSX Transform 可行性评估](../../deliverables/lessjs-jsx-feasibility-2026-05-28.md)

---

## Context

### 现状

LessJS 当前组件模型由三层构成：

1. **`DsdElement extends HTMLElement`** — 零框架依赖的 Web Components 基类（`dsd-element.ts:106`）
2. **`html` tagged template** — 自建模板系统（`template.ts`, 570 行），包含自定义 DSL 指令（`classMap`/`when`/`choose`/`repeat`/`ref`）和 prefix-based binding 语法（`@click`/`.prop`/`?attr`）
3. **`@prop()` 装饰器 + alien-signals** — 属性 → Signal 自动绑定（`prop.ts`, 316 行）

核心 DSD 渲染管线（`render-dsd.ts`, 440 行 + `render-nested.ts`, 452 行）是 LessJS 最核心的技术资产，不受此 ADR 影响。

### 问题

**1. tagged template 的"Web 标准"定位虚假。**

`html`...`` 语法壳是 ES2015 tagged template（标准），但壳内的 binding 语法（`@`/`.`/`?` 前缀）和指令集（`classMap`/`when`/`choose`/`repeat`/`ref`）是 LessJS 自专 DSL，非任何标准。TypeScript 对字符串内容无编译时类型检查。

**2. 模板系统是 Lit 历史演化路径的遗留。**

`parseTemplate()` + `detectBinding()` 在 JavaScript 内用正则实现了一个微型 HTML 解析器（`template.ts:139-176`, `545-556`），这是 Lit 生态的技术惯性，不是 LessJS 的战略选择。DSD 引擎成熟后，模板层可以重新审视。

**3. 编译时类型检查缺失。**

TypeScript 可以检查 `DsdElement` 类的方法和属性类型，但 `html`...`` 内的标签名、属性名、表达式类型全部是字符串——编译时不透明。Lit 社区用 LSP 插件（`lit-plugin`）补洞，LessJS 无同等级别工具。

### 行业参考

| 框架         | 模板方案                 | 编译时类型检查           | 控制流              |
| ------------ | ------------------------ | ------------------------ | ------------------- |
| **React 19** | JSX → createElement      | ✅ JSX.IntrinsicElements | JS 表达式           |
| **SolidJS**  | JSX → DOM operations     | ✅ JSX 类型              | JS 表达式           |
| **Hono**     | JSX → HTML strings       | ✅ JSX 类型              | JS 表达式           |
| **Svelte 5** | 编译时模板 DSL           | ✅ 编译器内建            | `{#if}`/`{#each}`   |
| **Lit 3**    | Tagged template          | ❌ 需 LSP 插件           | `when()`/`map()`    |
| **Fast**     | Tagged template (`html`) | ❌ 需 LSP 插件           | `when()`/`repeat()` |
| **Fresh**    | Preact JSX               | ✅ JSX 类型              | JS 表达式           |

**核心观察**：JSX 是行业编译时类型检查的**最低共识**——从 React 到 SolidJS 到 Hono 都走这条路。Tagged template 阵营（Lit/FAST）都需要额外 LSP 插件来弥补类型检查缺失。Svelte 是唯一在编译时模板上同时做到类型检查和优化的，但代价是专用编译器。

---

## Decision

### 1. 采用 JSX 作为新的声明式模板语法

**完整的 JSX → Signal → DOM 管线**，替换当前的 `html` tagged template。

**配置**：

```json
// deno.json
{ "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "@lessjs/core" } }

// vite.config.ts
{ "esbuild": { "jsx": "automatic", "jsxImportSource": "@lessjs/core" } }
```

**jsx-runtime 最小接口**：

```typescript
// @lessjs/core/jsx-runtime.ts
export function jsx(tag, props, key?): VNode; // 0-1 child
export function jsxs(tag, props, key?): VNode; // ≥2 children
export function jsxDEV(tag, props, key?, source, self): VNode; // dev mode
export const Fragment: unique symbol;
```

**设计原则**：

- `jsx()`/`jsxs()` 返回 **纯 JavaScript 对象**（`VNode`），零 DOM 依赖，零 runtime 绑定——保持 runtime 无关
- SSR 路径：`renderToString(vnode)` 遍历 VNode 树拼 HTML 字符串，复用现有的 `renderDSD()` 外层逻辑
- CSR 路径：`renderToDOM(vnode)` 创建真实 DOM，events 直接绑定 `addEventListener`（不使用合成事件）
- **不使用 Virtual DOM diff**。VNode 树仅作为声明式描述——SSR 一次性消费，CSR 在 Signal 驱动下定点更新（复用现有 `_patchBindings`）

### 2. JSX 事件系统直接映射 DOM Event

JSX 的 `on[Event]={handler}` 在运行时映射为 **原生 `addEventListener`**，不走 React 的 SyntheticEvent。

```tsx
// 组件源码
<button onClick={this.handleClick}>Click</button>;

// 编译产物（Deno tsc 自动完成）
_jsx('button', { onClick: this.handleClick, children: 'Click' });

// jsx-runtime 在 CSR 时的行为
// → element.addEventListener("click", handler, { signal: this._abortController.signal })
```

**为何不用合成事件**：LessJS 组件是 Custom Elements，shadow root 内部的事件冒泡由浏览器原生管理。合成事件是 React 在 DOM 之上的补丁——LessJS 不需要。

### 3. Signal 值自动解包（valueOf 方案）

`static props` 创建的 Signal 实现 `valueOf()` 和 `[Symbol.toPrimitive]`：

```typescript
// prop.ts — createPropSignal
function createPropSignal<T>(initial: T) {
  const sig = signal(initial);
  return Object.defineProperties(sig, {
    valueOf: { value: () => sig.value },
    [Symbol.toPrimitive]: { value: (hint) => hint === 'string' ? String(sig.value) : sig.value },
  });
}
```

**效果**：

- `{this.count}` 在 JSX 表达式中自动解包（`Number()`/`String()` 隐式转换）
- `this.count > 5` 比较仍然有效（JavaScript 运算符触发 `valueOf`）
- 不引入编译器魔法，不修改 TypeScript 类型系统

### 4. 移除自建 DSL 指令

JSX 的控制流就是 JavaScript 标准表达式：

| 旧的 html 模板 DSL                  | 新的 JSX                                                        |
| ----------------------------------- | --------------------------------------------------------------- |
| `classMap({ active: isActive })`    | `class={isActive ? 'active' : ''}`                              |
| `when(condition, () => A, () => B)` | `{condition ? <A /> : <B />}`                                   |
| `choose(key, cases, fallback)`      | `{cases[key] ?? <Fallback />}` 或 `switch` 在函数体内           |
| `repeat(items, fn)`                 | `{items.map(item => <Item data={item} />)}`                     |
| `ref(callback)`                     | `<div ref={callback}>` (VNode 层面的 convention)                |
| `unsafeHTML(str)`                   | `<div innerHTML={sanitizedStr}>` 或保留 `unsafeHTML()` 工具函数 |

### 5. 属性声明：`static props` 配置（替代 @prop() 装饰器）

**决策：使用 `static props` 声明式配置替代 `@prop()` 装饰器。**

```tsx
class MyCounter extends DsdElement {
  static props = {
    count: Number, // 简写：类型 = Number，默认 0
    variant: { type: String, default: 'primary', reflect: true },
    active: Boolean, // Boolean 类型：attribute presence = true
  };

  render() {
    return (
      <div class='counter'>
        <button onClick={() => this.count--}>-</button>
        <span>{this.count}</span>
        <button onClick={() => this.count++}>+</button>
      </div>
    );
  }
}
```

**为什么不用装饰器**：

| 维度       | `@prop()` 装饰器                                              | `static props`                                  |
| ---------- | ------------------------------------------------------------- | ----------------------------------------------- |
| Web 标准   | ❌ 依赖 `experimentalDecorators`（TypeScript 专属编译器开关） | ✅ ES2022 `static` class field（纯 JavaScript） |
| TC39 兼容  | ❌ Stage 3 decorators 不能替换 class field 值                 | ✅ 无影响                                       |
| 运行时无关 | ❌ `Object.defineProperty` 在 SSR stub 环境需特殊处理         | ✅ 纯对象读取，所有 runtime 一致                |
| 声明可见性 | ⚠️ 分散在类体中                                               | ✅ 一个位置看到全部 reactive API                |

`static props` 的运行时机制：

1. **define-time**：DsdElement 读取 `static props`，自动生成 `observedAttributes` 静态 getter
2. **constructor**：为每个 prop 创建 Signal 对象（`createPropSignal(default, { reflect })`）
3. **connectedCallback**：读取 HTML attribute 初始值，覆盖 Signal 默认值
4. **attributeChangedCallback**：HTML attribute 变化 → Signal 更新
5. **Signal 变化**：`reflect: true` 时 → 写回 HTML attribute
6. **GC**：`disconnectedCallback` 清理 Signal 订阅

**Boolean 类型特殊处理**：`active: Boolean` → attribute 存在即为 `true`，不存在为 `false`（HTML boolean attribute 标准行为）。

**内部状态不需要 static props**：组件内部的私有状态直接用 `signal()`：

```tsx
class MyComp extends DsdElement {
  static props = { title: String }; // public API，映射 HTML attribute
  private _items = signal<string[]>([]); // internal state，无 attribute 映射
}
```

### 6. html tagged template 废弃路径

**版本**：

- **v0.26**: `html` tagged template 标记为 `@deprecated`，文档和示例优先展示 JSX。所有内部组件迁移到 JSX
- **v0.28**: `html` tagged template 从 `@lessjs/core` 主入口移除，移入 `@lessjs/core/html-legacy` 子路径
- **v1.0**: 完全移除 `template.ts`、`html-escape.ts` 中的 template 专用逻辑

### 7. 不做的

- **不引入 Virtual DOM**。DSD 的 `<template shadowrootmode>` 已有最终 DOM，不需要 diff
- **不引入合成事件**。使用原生 `addEventListener`
- **不引入双向绑定语法** 作为框架内置特性。`bind:value` 编译宏在 MVP 阶段不做——它是糖，不是核心
- **不引入运行时编译器**。JSX 编译由 tsc/esbuild 在构建时完成，运行时无编译器
- **不引入 Portal/Suspense/Context**。这些是 React 时代的抽象，不是 LessJS 需要的

---

## Consequences

### Positive

1. **TypeScript 编译时类型检查覆盖全部模板层**。属性拼写、标签名、事件类型全部编译时验证。消除了 `template.ts` 的运行时校验需求。

2. **删除 template.ts 约 570 行（parseTemplate + detectBinding + binding rendering + 指令）**，替换为 jsx-runtime 约 200 行（jsx/jsxs + renderToString + renderToDOM）。净减少约 370 行代码。

3. **控制流回归标准 JavaScript**。不需要学习 `when()`/`choose()`/`repeat()` 的 DSL 语义——`?`/`switch`/`.map()` 是通用知识。

4. **AI 工具兼容**。Copilot/Cursor 对 JSX 的训练数据远超 tagged template DSL，代码补全和生成质量显著提升。

5. **Runtime 无关性保持不变**。jsx-runtime 是纯 JavaScript 对象操作，Deno/Node/Bun/Cloudflare Workers 均可用。

6. **降低新用户门槛**。JSX 开发者池是 tagged template DSL 开发者池的 15 倍以上（State of JS 2024）。

### Negative

1. **DSD 嵌套渲染多一层间接**。当前 `render()` → 字符串，JSX 后 `render()` → VNode 树 → `renderToString()` → 字符串。多一次对象树遍历。预估开销 <2ms/component（纯 JS 对象遍历，已由 SolidJS/Hono 路径验证）。

2. **JSX 非 ECMAScript 标准**。JSX 是 Facebook 提案 + TypeScript 采纳的事实标准，但不是 ECMAScript 规范的一部分。LessJS 仍然依赖 TypeScript 编译器做 JSX transform（虽然 Deno 内置）。

3. **`static props` 比 `@prop()` 装饰器多写几行代码**。但换来的是零编译器开关依赖、全 runtime 兼容、声明集中可见。这是一次性 tradeoff。

4. **构建产物变化**。现有 `.ts` 文件产出 `html`...`` 调用，新组件产出 `jsx()` 调用，两者共存期的 bundle 分析工具需要适配。

### Neutral

1. **jsx-runtime 增加约 5KB gzip 到运行时**。在 Edge 场景下可控，且被删除的 template.ts 指令抵消约 2KB。

2. **现有 `RendererProtocol` 多适配器机制不受影响**。Lit/React/Vanilla 组件通过 adapter 桥接进 DSD 管线的路径保持不变。JSX 只是替换主路径的模板语法。

3. **Signal API 不变**。`signal(value)`、`.value`、`.subscribe(fn)` 保持不变。`createPropSignal` 内部增加 valueOf/Symbol.toPrimitive 实现。

---

## Related ADRs

- **ADR-0036**: Ocean-Island 三层架构（ComponentLayer = dsd-static | dsd-interactive | pure-island）— 不受影响
- **ADR-0051**: Template strengthening (classMap/when/choose/repeat/ref) — 被此 ADR 替代（指令全部移除）
- **ADR-0052**: @prop() reactive property decorator — 被此 ADR 替代（`static props` 取代装饰器）
- **ADR-0053**: Unified Error Architecture — 不受影响

---

## Appendix: Component Model Before / After

### Before (html tagged template + @prop decorator)

```typescript
import { classMap, DsdElement, html, signal, when } from '@lessjs/core';

class MyCard extends DsdElement {
  @prop()
  active = false;
  @prop()
  title = '';

  override render() {
    return html`
      <div class="${classMap({ card: true, active: this.active })}">
        <h2>${this.title}</h2>
        ${when(
          this.active,
          () =>
            html`
              <span class="badge">Active</span>
            `,
          () =>
            html`
              <span class="badge muted">Inactive</span>
            `,
        )}
        <slot></slot>
      </div>
    `;
  }
}
```

### After (JSX + static props)

```tsx
/** @jsxImportSource @lessjs/core */
import { DsdElement } from '@lessjs/core';

class MyCard extends DsdElement {
  static props = {
    active: { type: Boolean, default: false },
    title: String,
  };

  override render() {
    return (
      <div class={`card${this.active ? ' active' : ''}`}>
        <h2>{this.title}</h2>
        <span class={`badge${this.active ? '' : ' muted'}`}>
          {this.active ? 'Active' : 'Inactive'}
        </span>
        <slot />
      </div>
    );
  }
}
```

**变化**：

- `html`...`` → JSX 标签语法
- `@prop()` → `static props` 声明式配置
- `classMap({ ... })` → JavaScript 模板字符串表达式
- `when(condition, a, b)` → JavaScript ternary 表达式
- 无需 `signal` import — `static props` 自动创建 Signal
- Signal 在 JSX 表达式中自动解包（valueOf）
- 零编译器开关依赖（无 `experimentalDecorators`）

---

_ADR-0057 | LessJS v0.26 目标版本_
