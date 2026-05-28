# SOP-009: v0.24.1 文档修复与新文档编写

> **优先级**: P0 → P3 顺序执行
> **依赖**: v0.24.1 代码已冻结 (commit bbab1fef)
> **目标**: 消除所有文档与代码不一致，补充 JSX+Signal 新模型缺失的参考文档

---

## Step 1 (P0): 修复 `www/app/routes/engine/reference/core.ts` — 删除过时 API 引用

**文件**: `www/app/routes/engine/reference/core.ts`
**位置**: Line 338-344

**当前状态**:
```
html() / unsafeHTML()
html(strings, ...values): TemplateResult
unsafeHTML(value): UnsafeHtmlValue
```

**操作**:
1. 删除 `html()` / `unsafeHTML()` 整个条目
2. 替换为 JSX 运行时 API 参考：

```tsx
// 新增条目：
jsx() / jsxs() / jsxDEV()
Factory functions: jsx(tag, props, children?) -> VNode
Fragment symbol for grouping children without wrapper DOM

renderToString(vnode)
VNode -> HTML string for SSR/SSG. Skips on* event props.

renderToDOM(vnode, signal?)
VNode -> real DOM nodes for CSR. Events via addEventListener.

VNode
{ tag, props, children, key?, ref? } — 5-field frozen interface.

isVNode(v)
Type guard: checks tag + props + children presence.
```

3. 保留 `RendererProtocol` 中 Lit TemplateResult 的引用（adapter-lit 的工作）

---

## Step 2 (P0): 重写 `docs/reference/core-api-surface.md`

**当前**: 基于 v0.21.x，列 `html()`, `unsafeHTML()` 为 Stable API
**目标**: v0.24.1 JSX 核心 API surface

**操作**: 完全重写，结构如下：

```markdown
# LessJS Core API Surface

Status: v0.24.1\
Scope: @lessjs/core

## Stable Userland API

| API | Role |
|-----|------|
| DsdElement | Zero-dependency custom element base for DSD and Reactive DSD |
| jsx() / jsxs() / jsxDEV() | JSX factory functions — VNode creation |
| Fragment | Symbol for grouping children |
| renderToString(vnode) | VNode → HTML string (SSR) |
| renderToDOM(vnode, signal?) | VNode → DOM nodes (CSR) |
| VNode / isVNode() | 5-field interface + type guard |
| static props | ES2022 class fields replacing @prop() decorator |
| signal() / computed() / effect() | Re-exported from @lessjs/signals |
| StyleSheet | SSR-safe stylesheet abstraction |
| renderDSD() / renderDSDStream() | Component-to-DSD renderer entrypoints |
| island() / lessBind() | Island declaration helpers |
| MemoryIsrCache / createIsrCacheKey() | ISR contract |

## Removed in v0.24.1

| API | Replacement |
|-----|------------|
| html() | JSX syntax: `<div>...</div>` |
| unsafeHTML() | Inline JSX with trusted content |
| classMap / when / choose / repeat / ref | JSX expressions |
| @prop() decorator | static props class fields |
| TemplateResult / isTemplateResult | VNode / isVNode() |
| renderTemplateToString | renderToString() |
```

---

## Step 3 (P0): 删除并替换 `docs/reference/template-reactive-contract.md`

**操作**:
1. 删除 `docs/reference/template-reactive-contract.md`
2. 新建 `docs/reference/jsx-component-model.md`

**新文件内容大纲**:
```markdown
# LessJS JSX Component Model

Status: v0.24.1\
Scope: JSX + Signal authoring in DsdElement

## Authoring Model

```tsx
class CounterElement extends DsdElement {
  count = signal(0);

  render() {
    return (
      <button onClick={() => this.count.value++}>
        Count: {this.count}
      </button>
    );
  }
}
```

## VNode Interface

{ tag, props, children, key?, ref? } — frozen 5-field contract.

## JSX Rules

- className → class attribute
- htmlFor → for attribute
- onClick → addEventListener('click', ...)
- style={{}} → element.style assignments
- Signal auto-unwrap in {} expressions via valueOf()

## SSR: renderToString()

VNode tree → HTML string. on* props silently dropped.

## CSR: renderToDOM()

VNode tree → DOM nodes. Events via addEventListener with AbortSignal.

## SVG Support

SVG elements (circle, line, path, svg, ...) auto-detected and created
via createElementNS('http://www.w3.org/2000/svg', tag).

## Signal Reactivity

effect() wraps render() in DsdElement._renderIntoShadowRoot().
All signal accesses in render() are auto-tracked — DOM re-renders on change.
```

---

## Step 4 (P1): 更新 `www/app/routes/guide/getting-started.ts`

**操作**: 在现有示例后增加 JSX 组件示例段落：

```tsx
<h2>编写第一个 JSX 组件</h2>
<less-code-block><pre><code>import { DsdElement } from '@lessjs/runtime';
import { signal } from '@lessjs/runtime';

export class CounterElement extends DsdElement {
  count = signal(0);

  render() {
    return (
      <button onClick={() => this.count.value++}>
        Count: {this.count}
      </button>
    );
  }
}

customElements.define('my-counter', CounterElement);
</code></pre></less-code-block>
```

同时在配置段落增加 JSX 配置说明。

---

## Step 5 (P1): 审计并更新 `www/app/routes/guide/api.ts`

**操作**:
1. 通读全文，搜索 `html\`` / `@prop` / `TemplateResult` / `classMap`
2. 替换所有旧 API 引用为 JSX 等价写法
3. 确保 API 列表与 core-api-surface.md 一致

---

## Step 6 (P1): 审计并更新 `www/app/routes/guide/islands.ts`

**操作**:
1. 搜索 `html\`` / `TemplateResult` 引用
2. Island 声明语法（`island()` / `lessBind()`）本身未变，但示例代码中的组件 render 方法需要展示 JSX

---

## Step 7 (P1): 更新 `www/app/routes/guide/configuration.ts` — 增加 JSX 配置段落

**操作**: 新增小节

```markdown
## JSX 配置

### deno.json

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@lessjs/core"
  },
  "imports": {
    "@lessjs/core/jsx-runtime": "jsr:@lessjs/core@^0.24.1/jsx-runtime",
    "@lessjs/core/jsx-dev-runtime": "jsr:@lessjs/core@^0.24.1/jsx-runtime"
  }
}
```

### vite.config.ts

```ts
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@lessjs/core',
  },
  plugins: [lessjs({ ... })]
});
```
```

---

## Step 8 (P1): 更新 `docs/arch/current-architecture.md`

**操作**:
1. 版本标注: `v0.23.x` → `v0.24.1`
2. 在 Layer Model 中增加 JSX+Signal 层描述
3. 更新 DSD 管线描述，提及 VNode 路径与 TemplateResult 路径并行

---

## Step 9 (P1): 重写 `docs/design/jsx-deep-integration.md`

**当前**: 描述旧 html 模型为"前置分析"
**目标**: v0.24.1 实现后回顾

**操作**: 重写为两段式：
1. **前置分析**（保留，缩小范围）：html template 的局限
2. **实现结果**（新增）：JSX runtime 架构、VNode 设计决策、renderToString/renderToDOM 对比、effect() 信号追踪

---

## Step 10 (P1): 更新 `docs/status/STATUS.md`

**操作**: 更新版本状态到 v0.24.1

---

## Step 11 (P1): 更新 `docs/roadmap/ROADMAP.md`

**操作**: 标记 ADR-0057 为 ✅ IMPLEMENTED

---

## Step 12 (P1): 审计 `docs/guide/migrating-from-lit.md`

**操作**: 搜索旧 API 引用，如有则替换为 JSX 等价写法

---

## Step 13 (P2): 新建 `www/app/routes/guide/jsx-components.md` — JSX 组件编写指南

**目标**: 面向 LessJS 组件开发者的完整 JSX 入门指南

**内容大纲**:
1. 为什么 JSX？（类型安全、工具链、AI 友好）
2. 第一个 JSX 组件（Counter）
3. VNode 接口
4. JSX 表达式 `{}` 与 Signal 自动解包
5. 事件绑定（onClick、onInput）
6. 条件渲染（三元、&&）
7. 列表渲染（Array.map）
8. Fragment（`<>...</>`）
9. SVG 内联
10. SSR vs CSR 行为差异

**中文版**: 同步输出 `www/app/routes/zh/guide/jsx-components.ts`

---

## Step 14 (P2): 新建 `www/app/routes/guide/static-props.md` — static props 指南

**内容大纲**:
1. `static props = { name: Type }` 声明
2. 类型：Number, String, Boolean, Signal\<T\>
3. observedAttributes 自动生成
4. 属性变化回调
5. PropsFrom\<T\> 类型推导
6. 与 `@prop()` 的对比（迁移参考）

**中文版**: `www/app/routes/zh/guide/static-props.ts`

---

## Step 15 (P2): 新建 `www/app/routes/guide/signal-reactivity.md` — Signal 响应式指南

**内容大纲**:
1. signal() 基础
2. computed() 派生状态
3. effect() 副作用追踪
4. JSX 中 signal 自动解包（valueOf）
5. unwrap() 显式解包
6. VNode 路径的 effect 驱动 re-render
7. 生命周期（disposeSignalSubscriptions）

**中文版**: `www/app/routes/zh/guide/signal-reactivity.ts`

---

## Step 16 (P2): 新建 `www/app/routes/guide/migration-v0.24.md` — 迁移指南

**内容大纲**:
1. `html` tagged template → JSX
2. `@prop()` → `static props`
3. `classMap` → className 三元表达式
4. `when` → 三元或 &&
5. `choose` → switch/对象字面量
6. `repeat` → Array.map
7. `ref` → JSX ref prop
8. `unsafeHTML` → 内联 JSX
9. 事件语法：`@click` → `onClick`
10. `@lessjs/runtime` 导入路径变更

**中文版**: `www/app/routes/zh/guide/migration-v0.24.ts`

---

## Step 17 (P2): 新建 `docs/reference/static-props.md`

**目标**: static props API 完整参考

**内容大纲**:
1. PropDecl 类型体系（shorthand / full / PropType）
2. 支持的 PropType：Number, String, Boolean
3. Signal\<T\> 包装
4. observedAttributes 行为
5. attributeChangedCallback 集成
6. initializeStaticProps / disposeStaticProps 生命周期
7. PropsFrom\<T\> / PropDecl / PropType 导出

---

## Step 18 (P2): 新建 `docs/reference/signal-vnode-effect.md`

**目标**: effect() 在 VNode 信号追踪中的完整说明

**内容大纲**:
1. 为什么需要 effect()（TemplateResult 有 _subscribeTemplateSignals，VNode 没有）
2. effect() 的 auto-tracking 机制
3. DsdElement._renderIntoShadowRoot 中的 effect 创建
4. _vnodeEffectDispose 生命周期
5. 全量 DOM re-render vs 细粒度 patch 的取舍
6. 注意事项：避免 effect 中的副作用循环

---

## Step 19 (P2): 新建 `docs/reference/jsx-component-model.md`

已在 Step 3 完成。

---

## Step 20 (P3): ADR-0052 标记 SUPERSEDED

**文件**: `docs/adr/ADR-0052-signal-dom-deep-integration.md`

**操作**: 在文件头部增加：
```markdown
> ⚠️ **SUPERSEDED** by [ADR-0057](../adr/0057-jsx-signal-component-model.md)
> @prop() decorator replaced by static props in v0.24.1
```

---

## Step 21 (P3): SOP-009 (0.23.x) 标记 OBSOLETE

**文件**: `docs/sop/v0.23.x/SOP-009-html-template-strengthening.md`

**操作**: 在文件头部增加：
```markdown
> ⚠️ **OBSOLETE** as of v0.24.1
> html tagged template has been removed. See SOP v0.24.1 for JSX+Signal model.
```

---

## Step 22 (P3): v0.21.0 SOP 归档标记

**文件**: `docs/sop/v0.21.0/` 目录下涉及 html template 的 SOP

**操作**: 在每个涉及 html template + @prop 的 SOP 顶部增加：
```markdown
> 📦 **HISTORICAL** — applies to v0.21.x only. Superseded by ADR-0057 (JSX+Signal) in v0.24.1.
```

影响的 SOP: SOP-001, SOP-002, SOP-004, SOP-005, SOP-006, SOP-007, SOP-008, SOP-009

---

## Step 23 (P3): 审计 `docs/reference/web-component-compatibility.md`

**操作**: 通读全文，搜索 `html\`` / `@prop` / `TemplateResult`，如有旧 API 引用则替换为 JSX 等价写法。

---

## i18n 中文文档补充

以下新页面需要同步创建中文版路由文件：

| 英文文件 | 中文文件 |
|---------|---------|
| `www/app/routes/guide/jsx-components.ts` | `www/app/routes/zh/guide/jsx-components.ts` |
| `www/app/routes/guide/static-props.ts` | `www/app/routes/zh/guide/static-props.ts` |
| `www/app/routes/guide/signal-reactivity.ts` | `www/app/routes/zh/guide/signal-reactivity.ts` |
| `www/app/routes/guide/migration-v0.24.ts` | `www/app/routes/zh/guide/migration-v0.24.ts` |

已存在的页面（Step 4-7）也需要审计对应中文版是否有同样的过时内容。

---

## 验收标准

- [ ] `deno fmt` ✅
- [ ] `deno lint` ✅
- [ ] `deno task typecheck` ✅
- [ ] `deno task test` ✅ (939 tests)
- [ ] `deno task graph:check` ✅
- [ ] `deno task build` ✅（www 构建成功）
- [ ] 无 `[object Object]` 渲染错误
- [ ] 无 `html()` / `unsafeHTML()` / `TemplateResult` 残留在公开文档中（changelog 历史条目除外）
- [ ] 新增中文页面可访问（`/zh/guide/jsx-components` 等）
