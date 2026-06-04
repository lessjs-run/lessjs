# ADR-0057: JSX + Signal 新组件模型，替换 html tagged template

> **状态**: IMPLEMENTED (v0.24.1)\
> **日期**: 2026-05-28\
> **修订**: 2026-05-28 (v2 — 重构叙事，深化护城河定位)\
> **作者**: LessJS 架构团队\
> **关联**: ADR-0036 (Ocean-Island), ADR-0051 (template strengthening), ADR-0052 (@prop decorator), ADR-0053 (unified errors)\
> **前置**: [JSX Transform 可行性评估](../../deliverables/lessjs-jsx-feasibility-2026-05-28.md)

---

## Positioning: LessJS 的理想定位与差异化

### 定位声明

**LessJS 是唯一同时满足"Web Components + SSR/SSG + Signal 响应式"三个条件的框架。**

这不是"比 Lit 更好"——Lit 和 LessJS 解决的是不同问题。Lit 解决的是 CSR 渐进增强的 Web Components 开发体验，LessJS 解决的是 Web Components 的 SSR 可行性和 DX。

### 差异化矩阵

| 能力                          | Lit              | Astro (WC)            | Solid Start | **LessJS**       |
| ----------------------------- | ---------------- | --------------------- | ----------- | ---------------- |
| Web Components (Shadow DOM)   | ✅               | ⚠️ 二等公民           | ❌          | ✅               |
| SSR/SSG 输出含 shadow DOM     | ❌ 需 DOM 模拟   | ❌ light DOM polyfill | ❌          | ✅ DSD 原生      |
| 细粒度 Signal 响应式          | ❌ 脏检查+微任务 | ❌                    | ✅          | ✅ alien-signals |
| 多运行时 (Deno/Node/Bun/Edge) | ⚠️ SSR 受限      | ✅                    | ✅          | ✅               |
| 编译时模板类型检查            | ❌ 需 LSP 插件   | N/A                   | ✅          | ✅ (此 ADR 后)   |

**三圈交集只有一个：LessJS。** 小众，但独占。

### 护城河定义

LessJS 的护城河不是"DSD-first 比 CSR 更快"（SSR 框架已普遍解决首屏问题），而是：

> **DSD 是让 Web Components 的 SSR 输出包含真正 shadow DOM 的唯一标准路径。**

没有 DSD，Web Components 只能 CSR——这是架构限制，不是性能问题。LessJS 的 DSD 管线让 Web Components 可以参与 SSR/SSG 生态，这是 Lit 和 Astro 都无法原生做到的。

**护城河不大，但它是真的。** 目标不是"做大池里最大的鱼"，而是"做这个小池里唯一的鱼，并把池子挖深"。

### 如何挖深护城河

1. **让 DSD 组件在其他框架中可用** — LessJS 组件应能在 Next.js/Nuxt/Astro 项目中以 DSD 方式 SSR 输出（RegistryHub 的战略价值）
2. **让组件开发体验无可挑剔** — 这是本 ADR 的核心任务：用 JSX+Signal 消除模板层的所有摩擦
3. **不与 Lit 正面竞争** — FAST 试图"比 Lit 更好地做 Lit 的事"而失败，LessJS 必须做 Lit 不做的事

---

## Context

### 现状

LessJS 当前组件模型由三层构成：

1. **`DsdElement extends HTMLElement`** — 零框架依赖的 Web Components 基类（`dsd-element.ts:106`）
2. **`html` tagged template** — 自建模板系统（`template.ts`, 570 行），包含自定义 DSL 指令（`classMap`/`when`/`choose`/`repeat`/`ref`）和 prefix-based binding 语法（`@click`/`.prop`/`?attr`）
3. **`@prop()` 装饰器 + alien-signals** — 属性 → Signal 自动绑定（`prop.ts`, 316 行）

核心 DSD 渲染管线（`render-dsd.ts`, 440 行 + `render-nested.ts`, 452 行）是 LessJS 最核心的技术资产，不受此 ADR 影响。

### 问题

**1. 自建 DSL 维护成本与收益不对等。**

`html`...`` 语法壳是 ES2015 tagged template，但壳内的 binding 语法（`@`/`.`/`?` 前缀）和指令集（`classMap`/`when`/`choose`/`repeat`/`ref`）是 LessJS 自专 DSL。这个 DSL 的维护成本是真实的（570 行模板引擎 + 指令实现 + 运行时校验），而它的差异化收益是零——Lit 和 FAST 有完全相同的指令集（`when()`/`repeat()`/`classMap()`），证明这不是创新，是惯性。

**2. 模板层与 LessJS 的战略定位不匹配。**

LessJS 的差异化在于 DSD 管线 + Signal 响应式，不在于模板语法。当前在模板层自建 DSL 等于在别人的赛道上投入资源——Lit 已经赢了 tagged template 这条赛道，LessJS 不应该在同一维度竞争。模板层应该选择行业共识方案（JSX），把团队精力集中在 DSD 管线和 Signal 这两个真正的护城河上。

**3. 编译时类型检查缺失是 DX 的硬伤。**

TypeScript 可以检查 `DsdElement` 类的方法和属性类型，但 `html`...`` 内的标签名、属性名、表达式类型全部是字符串——编译时不透明。Lit 社区用 LSP 插件（`lit-plugin`）补洞，LessJS 无同等级别工具。对于"小而精"的定位，DX 每一个摩擦点都是用户流失点。

**4. 当前模板层是 Lit 技术路径的遗留，不是 LessJS 的战略选择。**

`parseTemplate()` + `detectBinding()` 在 JavaScript 内用正则实现了一个微型 HTML 解析器（`template.ts:139-176`, `545-556`）。这个设计的核心假设是"运行时解析模板字符串 + 增量 patch DOM"——这是 Lit 的 CSR 渲染模型。LessJS 的 DSD 管线是"构建时生成完整 HTML + hydrate 时 Signal 接管"，两者对模板层的需求完全不同。继续沿用 Lit 的模板范式，是在用别人的架构假设写自己的代码。

### 行业参考

| 框架         | 模板方案                 | 编译时类型检查           | 控制流              | SSR 策略   |
| ------------ | ------------------------ | ------------------------ | ------------------- | ---------- |
| **React 19** | JSX → createElement      | ✅ JSX.IntrinsicElements | JS 表达式           | RSC / 流式 |
| **SolidJS**  | JSX → DOM operations     | ✅ JSX 类型              | JS 表达式           | SSR 流式   |
| **Hono**     | JSX → HTML strings       | ✅ JSX 类型              | JS 表达式           | 纯字符串   |
| **Svelte 5** | 编译时模板 DSL           | ✅ 编译器内建            | `{#if}`/`{#each}`   | 编译优化   |
| **Lit 3**    | Tagged template          | ⚠️ 需 LSP 插件           | `when()`/`map()`    | DOM 模拟   |
| **Fast**     | Tagged template (`html`) | ⚠️ 需 LSP 插件           | `when()`/`repeat()` | DOM 模拟   |

**关键观察**：

- JSX 阵营（React/SolidJS/Hono）全部获得编译时类型检查，且 SSR 路径干净（无 DOM 模拟）
- Tagged template 阵营（Lit/FAST）都需要 LSP 插件弥补类型检查，且 SSR 需要 DOM 模拟
- FAST 试图"比 Lit 更好地做 Lit 的事"而失败——Lit 已经赢了这条赛道
- **LessJS 应该走 JSX 路线，不是因为 tagged template 不好，而是因为 LessJS 的 SSR 模型（纯字符串拼接）天然与 JSX→字符串路径一致，与 tagged template→DOM patch 路径不匹配**

---

## Decision

### 1. 采用 JSX 作为新的声明式模板语法

**完整的 JSX → Signal → DOM 管线**，替换当前的 `html` tagged template。

**配置**：

```json
// deno.json
{ "compilerOptions": { "jsx": "react-jsx", "jsxImportSource": "@openelement/core" } }

// vite.config.ts
{ "esbuild": { "jsx": "automatic", "jsxImportSource": "@openelement/core" } }
```

**jsx-runtime 最小接口**：

```typescript
// @openelement/core/jsx-runtime.ts
export function jsx(tag, props, key?): VNode; // 0-1 child
export function jsxs(tag, props, key?): VNode; // ≥2 children
export function jsxDEV(tag, props, key?, source, self): VNode; // dev mode
export const Fragment: unique symbol;
```

**设计原则**：

- `jsx()`/`jsxs()` 返回 **纯 JavaScript 对象**（`VNode`），零 DOM 依赖，零 runtime 绑定——保持 runtime 无关
- SSR 路径：`renderToString(vnode)` 遍历 VNode 树拼 HTML 字符串，复用现有的 `renderDsd()` 外层逻辑
- CSR 路径：`renderToDom(vnode)` 创建真实 DOM，events 直接绑定 `addEventListener`（不使用合成事件）
- **不使用 Virtual DOM diff**。VNode 树仅作为声明式描述——SSR 一次性消费，CSR 在 Signal 驱动下定点更新（复用现有 `_patchBindings`）

#### 1.1 VNode 接口冻结条款（防膨胀保护）

VNode 是声明式描述的中间表示，不是通用渲染树。为防止"第二系统效应"（VNode 逐步膨胀为虚拟 DOM），施加以下冻结条款：

```typescript
// VNode 接口 — v1.0 前不可扩展
interface VNode {
  tag: string | Function; // HTML 标签名 或 组件函数/类
  props: Record<string, any>; // 属性对象（含事件、class、style 等）
  children: (VNode | string)[]; // 子节点
  key?: string | number; // 列表渲染 key
  ref?: (el: Element) => void; // DOM 引用回调
}
```

**冻结规则**：

- v1.0 之前，`VNode` 接口**只允许上述 5 个字段**，不增加 `hooks`/`memo`/`suspense`/`context`/`portal` 等字段
- 任何新字段提案必须走 ADR 流程，并证明它不引入 VDOM diff 语义
- 此条款的目的是：**LessJS 的 VNode 永远是描述，不是运行时树**

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

#### 3.1 自动解包的边界声明

`valueOf` / `Symbol.toPrimitive` 方案在大多数场景有效，但存在明确的边界：

| 场景                                  | 自动解包？           | 正确做法                           |
| ------------------------------------- | -------------------- | ---------------------------------- |
| JSX 表达式 `{this.count}`             | ✅                   | 直接使用                           |
| 算术比较 `this.count > 5`             | ✅                   | 直接使用                           |
| 字符串拼接 `` `val: ${this.count}` `` | ✅                   | 直接使用                           |
| `JSON.stringify(this.count)`          | ❌ 返回 Signal 对象  | `JSON.stringify(this.count.value)` |
| `Array.isArray(this.items)`           | ❌ Signal 不是 Array | `Array.isArray(this.items.value)`  |
| `typeof this.count`                   | ❌ 返回 `"object"`   | `typeof this.count.value`          |
| 函数传参 `fn(this.count)`             | ⚠️ 取决于函数实现    | 显式 `.value` 或类型标注           |

**规则**：在 JSX `{}` 外使用 Signal 值时，**必须显式 `.value`**。在 JSX `{}` 内，自动解包。

**兜底工具**：

```typescript
// @openelement/core — 显式解包工具（零开销，编译后内联）
export function unwrap<T>(sig: Signal<T> | T): T {
  return sig instanceof Signal ? sig.value : sig;
}
```

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

**移除理由不是"DSL 不好"而是"自建 DSL 是在 Lit 的赛道上投入资源"**。Lit 已经有 `when()`/`repeat()`/`classMap()`，LessJS 不需要在同一维度差异化。JSX 让控制流回归标准 JavaScript，LessJS 的差异化精力集中在 DSD 管线和 Signal 上。

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
| SSR 可行性 | ⚠️ 装饰器在无 decorator运行时环境需 polyfill                  | ✅ 静态属性在所有环境均可读取                   |

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

#### 5.1 `static props` 的 TypeScript 类型推导方案

`static props` 声明存在类型推导问题：TypeScript 默认推断 `count: Number` 的类型为 `NumberConstructor` 而非 `number`。需要映射类型解决：

```typescript
// @openelement/core — 类型推导工具

// Prop 声明类型
type PropDecl<T = any> =
  | FunctionConstructor // String, Number, Boolean, Array, Object
  | { type: FunctionConstructor; default?: T; reflect?: boolean };

// 从 PropDecl 推导实际类型
type PropType<D> = D extends NumberConstructor ? number
  : D extends StringConstructor ? string
  : D extends BooleanConstructor ? boolean
  : D extends ArrayConstructor ? unknown[]
  : D extends ObjectConstructor ? Record<string, unknown>
  : D extends { type: infer C extends FunctionConstructor; default?: infer V }
    ? (C extends NumberConstructor ? number
      : C extends StringConstructor ? string
      : C extends BooleanConstructor ? boolean
      : unknown)
  : unknown;

// 从 static props 推导组件属性类型
type PropsFrom<P extends Record<string, PropDecl>> = {
  [K in keyof P]: PropType<P[K]>;
};

// DsdElement 泛型约束
abstract class DsdElement<P extends Record<string, PropDecl> = {}> extends HTMLElement {
  static props: P;
  // 使 this 上可访问 props 的类型化版本
  // 具体实现通过 ThisType + 声明合并完成
}
```

**效果**：在 `render()` 内，`this.count` 被推导为 `number`，`this.title` 被推导为 `string`，获得完整的 IDE 补全和类型检查。

**MVP 简化**：如果完整映射类型在 v0.26 时间线内无法完成，可先使用 `AnyPropertyDescriptor` 让 `this.count` 类型为 `Signal<number>`（显式 `.value`），在 v0.28 补齐自动推导。

### 6. html tagged template 废弃路径

**版本**：

- **v0.26**: `html` tagged template 标记为 `@deprecated`，文档和示例优先展示 JSX。所有内部组件迁移到 JSX
- **v0.28**: `html` tagged template 从 `@openelement/core` 主入口移除，移入 `@openelement/core/html-legacy` 子路径
- **v1.0**: 完全移除 `template.ts`、`html-escape.ts` 中的 template 专用逻辑

### 7. 不做的

- **不引入 Virtual DOM**。DSD 的 `<template shadowrootmode>` 已有最终 DOM，不需要 diff。VNode 冻结条款确保它不会膨胀为 VDOM
- **不引入合成事件**。使用原生 `addEventListener`。Shadow DOM 内的事件冒泡由浏览器管理
- **不引入双向绑定语法** 作为框架内置特性。`bind:value` 编译宏在 MVP 阶段不做——它是糖，不是核心
- **不引入运行时编译器**。JSX 编译由 tsc/esbuild 在构建时完成，运行时无编译器
- **不引入 Portal/Suspense/Context**。这些是 React 时代的抽象，不是 LessJS 需要的。LessJS 的定位是 Web Components 组件库框架，不是通用应用框架
- **不尝试"比 Lit 更好地做 Lit 的事"**。这是 FAST 的失败路径。LessJS 的模板层选择（JSX）应定位为"最适合 DSD 管线的模板方案"，不是"比 tagged template 更好"

---

## Consequences

### Positive

1. **模板层与 LessJS 的战略定位对齐**。JSX 是行业共识的模板方案，LessJS 不再在模板层与 Lit 竞争，而是把差异化精力集中在 DSD 管线和 Signal——这两个真正的护城河上。

2. **TypeScript 编译时类型检查覆盖全部模板层**。属性拼写、标签名、事件类型全部编译时验证。消除了 `template.ts` 的运行时校验需求。

3. **代码净减 ~370 行**。删除 template.ts 约 570 行（parseTemplate + detectBinding + binding rendering + 指令），替换为 jsx-runtime 约 200 行（jsx/jsxs + renderToString + renderToDom）。

4. **控制流回归标准 JavaScript**。不需要学习 `when()`/`choose()`/`repeat()` 的 DSL 语义——`?`/`switch`/`.map()` 是通用知识。降低用户学习成本。

5. **AI 工具兼容**。Copilot/Cursor 对 JSX 的训练数据远超 tagged template DSL，代码补全和生成质量显著提升。2026 年 AI 辅助开发是硬需求，JSX 在此维度有结构性优势。

6. **Runtime 无关性保持不变**。jsx-runtime 是纯 JavaScript 对象操作，Deno/Node/Bun/Cloudflare Workers 均可用。SSR 路径是纯字符串拼接，无需 DOM 模拟——这是与 Lit SSR 的关键差异。

7. **SSR 模型与 JSX 天然匹配**。Lit 的 tagged template 在 SSR 时需要 DOM 模拟（`@lit-labs/ssr` + parse5/linkedom），因为它的渲染模型是"持续复用模板实例做增量 patch"。LessJS 的 DSD 渲染模型是"一次性生成 HTML 字符串 + hydrate"，与 JSX→VNode→字符串的路径完全一致。这不是偶然——两种模型对模板层的需求本来就不一样。

### Negative

1. **DSD 嵌套渲染多一层间接**。当前 `render()` → 字符串，JSX 后 `render()` → VNode 树 → `renderToString()` → 字符串。多一次对象树遍历。预估开销 <2ms/component（纯 JS 对象遍历，已由 SolidJS/Hono 路径验证）。

2. **JSX 非 ECMAScript 标准**。JSX 是 Facebook 提案 + TypeScript 采纳的事实标准，但不是 ECMAScript 规范的一部分。LessJS 仍然依赖 TypeScript 编译器做 JSX transform（虽然 Deno 内置）。这个 tradeoff 是值得的——JSX 的类型安全和工具链收益远超"非标准"的代价，且 tagged template 的绑定语义同样不是标准。

3. **Hydration 复杂度不因模板层变更而消除**。JSX 替换了模板语法，但 DSD→hydrate 路径的时序问题（如 `_initialRenderDone` 合约）仍然存在。这是 DSD-first 架构的根本复杂度，不是模板层的问题。此 ADR 不声称解决 hydration 复杂度，只是不在模板层增加新的复杂度。

4. **`static props` 比 `@prop()` 装饰器多写几行代码**，且类型推导需要额外的映射类型（`PropsFrom<T>`）。但换来的是零编译器开关依赖、全 runtime 兼容、声明集中可见、SSR 无障碍。

5. **构建产物变化**。现有 `.ts` 文件产出 `html`...`` 调用，新组件产出 `jsx()` 调用，两者共存期的 bundle 分析工具需要适配。

6. **小众定位的战略风险**。LessJS 占据的"Web Components + SSR + Signal"三圈交集是真实的护城河，但池子不大。如果 Web Components 的行业采纳持续低迷，护城河内没有足够的用户。此风险不受本 ADR 影响——无论模板层选择什么，定位风险都存在。

### Neutral

1. **jsx-runtime 增加约 5KB gzip 到运行时**。在 Edge 场景下可控，且被删除的 template.ts 指令抵消约 2KB。净增 ~3KB。

2. **现有 `RendererProtocol` 多适配器机制不受影响**。Lit/React/Vanilla 组件通过 adapter 桥接进 DSD 管线的路径保持不变。JSX 只是替换主路径的模板语法。

3. **Signal API 不变**。`signal(value)`、`.value`、`.subscribe(fn)` 保持不变。`createPropSignal` 内部增加 valueOf/Symbol.toPrimitive 实现。

4. **DSD 渲染管线不受影响**。`render-dsd.ts` 和 `render-nested.ts` 继续负责构建时 HTML 生成。JSX 的 `renderToString()` 是它的上游数据源。

---

## Risk Register

| 风险                              | 可能性 | 影响                   | 缓解措施                                                  |
| --------------------------------- | ------ | ---------------------- | --------------------------------------------------------- |
| VNode 逐步膨胀为 VDOM             | 中     | 高 — 违背"无 diff"原则 | VNode 接口冻结条款（§1.1）                                |
| `static props` 类型推导不完整     | 中     | 中 — DX 受损           | MVP 用 `Signal<T>` 类型兜底，v0.28 补齐自动推导           |
| Signal 自动解包在边界场景造成困惑 | 低     | 低                     | 边界声明（§3.1）+ `unwrap()` 工具函数                     |
| Lit 未来支持 DSD，缩小差异化      | 低     | 高 — 护城河变浅        | 加速 RegistryHub 跨框架集成，从"唯一选择"升级为"最佳体验" |
| Web Components 生态持续低迷       | 中     | 高 — 用户池不足        | 不受本 ADR 影响；持续关注 Chrome/Safari DSD 采纳进度      |

---

## Related ADRs

- **ADR-0036**: Ocean-Island 三层架构（ComponentLayer = dsd-static | dsd-interactive | pure-island）— 不受影响
- **ADR-0051**: Template strengthening (classMap/when/choose/repeat/ref) — 被此 ADR 替代（指令全部移除）
- **ADR-0052**: @prop() reactive property decorator — 被此 ADR 替代（`static props` 取代装饰器）
- **ADR-0053**: Unified Error Architecture — 不受影响

---

## Appendix A: Component Model Before / After

### Before (html tagged template + @prop decorator)

```typescript
import { classMap, DsdElement, html, signal, when } from '@openelement/core';

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
/** @jsxImportSource @openelement/core */
import { DsdElement } from '@openelement/core';

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

## Appendix B: 为什么不转 Lit 组件模型

此附录记录架构评审中的关键决策推理，避免未来重复讨论。

### Lit 组件模型的核心假设

Lit 的渲染模型是 **CSR progressive enhancement**：组件的 DOM 在浏览器端由 JavaScript 创建，模板实例被持续复用以增量 patch DOM 变化。整个设计围绕"运行时动态创建 + 持续高效更新"优化。

### 与 LessJS 的根本错配

| 维度             | Lit 的假设                  | LessJS 的现实               |
| ---------------- | --------------------------- | --------------------------- |
| DOM 创建时机     | 浏览器端 JS 创建            | 构建时 SSG 生成（DSD）      |
| 模板实例生命周期 | 持续复用，增量 patch        | 一次性消费，SSR 输出字符串  |
| SSR 策略         | DOM 模拟（parse5/linkedom） | 纯字符串拼接                |
| 响应式           | 脏检查 + 微任务批处理       | Signal 细粒度订阅           |
| 运行时环境       | 浏览器为主                  | Deno/Node/Bun/Edge 多运行时 |

**结论**：转 Lit 组件模型需要重写 DsdElement → LitElement、Signal → ReactiveProperty、DSD 管线 → Lit SSR、多运行时适配 → DOM shim。这不是"升级模板语法"，是"重写框架"。

### FAST 的前车之鉴

FAST（Microsoft）试图"比 Lit 更好地做 Lit 的事"——相同的 tagged template 模型、相同的指令集、相同的 CSR 范式。结果是：Fluent UI Web Components v3 已从 FAST 迁移到 Lit，微软自己承认 FAST 无法与 Lit 差异化。

**教训**：在 Lit 已经赢的赛道上竞争是死路。LessJS 必须在 Lit 不做的方向上差异化——DSD-first SSR + Signal 响应式就是那个方向。

---

_ADR-0057 v2 | LessJS v0.26 目标版本 | 修订：深化护城河定位，VNode 冻结条款，类型推导方案，解包边界声明_
