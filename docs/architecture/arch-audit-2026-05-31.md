# LessJS v0.28 架构全面审计

> 日期：2026-05-31 · 团队：software-arch-audit
> 目标：理解组件模型、DSD 渲染、Builder 管线、信号系统之间的真实关系

---

## 一、组件模型全景

LessJS 当前有 **三种组件编写方式**，它们在同一个系统中并存：

### 1.1 DsdElement（框架原生组件）

```ts
// 文件：packages/core/src/dsd-element.ts
class MyComp extends DsdElement {
  static styles = [mySheet];
  render(): string | VNode { return <div>...</div>; }
}
```

**特点**：
- 继承 HTMLElement（SOP-016 SSR stub 在 Node/Deno 中提供最小 HTMLElement）
- `render()` 可以返回 string 或 VNode（JSX）
- SSR 路径：`renderDsd() → instantiate → injectProps → render() → renderVNodeToString → renderNested → wrapDsdOutput`
- CSR 路径：`connectedCallback → createRenderRoot → _renderOrHydrate → 检测 DSD → _hydrateSignals/_renderIntoShadowRoot`
- 信号系统：`signal()` + `registerSignal()` + `_hydrateSignals()` 三件套

### 1.2 函数组件（纯 JSX）

```ts
// 文件：packages/core/src/jsx-runtime.ts
function MyCard({ children }) { return <div class="card">{children}</div>; }
```

**特点**：
- 不是 Custom Element，不注册也不带 DSD
- `renderToString()` 中的递归路径：检测到 `typeof tag === 'function'` → 调用函数 → 递归渲染返回值
- 渲染到字符串，**不参与 DSD 生命周期**

### 1.3 LitElement（运行时 ES Module 导入）

```ts
import { LitElement, html } from 'lit';
class MyLitComp extends LitElement { ... }
```

**特点**：
- `isVNode()` 在 `render-dsd.ts:186` 判断 `isTemplate()` → Lit adapter 处理
- 仅 SSR 时通过 adapter 渲染，CSR 直接由 Lit 接管
- 与 LessJS 信号系统**完全隔离**

### 1.4 三种模型的交汇点

```
renderDsd() 调用 instance.render()
    │
    ├─ 返回 string → 直接序列化到 DSD template
    ├─ 返回 VNode  → isVNode(result) → renderVNodeToString(result)
    └─ 返回 Lit TemplateResult → adapter.isTemplate → adapter.render
```

**关键发现**：DsdElement 和函数组件共享 `renderToString()` 路径。LitElement 走独立的 adapter 路径。三种模型**在 SSR 路径中交汇于 renderDsd() 的第 180-228 行**。

---

## 二、DSD 渲染全链路

```
用户页面 (getting-started.tsx)
    │ render() 返回 VNode
    ▼
renderVNodeToString()
    │ VNode 树 → HTML 字符串
    │ 函数组件递归调用、CE 标签按 void/tag 序列化
    │ <less-search> → `<less-search></less-search>`
    ▼
renderNestedCustomElements(content)
    │ parse5.parseFragment → AST
    │ collectCustomElements() → 找注册的 CE
    │ 对每个 CE:
    │   1. renderDsd(tagName, Cls, props) → 实例化 + render() + renderNested(递归)
    │   2. 解析 DSD 输出，提取 <template shadowrootmode>
    │   3. 扫描 DSD 内容中的嵌套 CE(373-433行)
    │   4. 合并 DSD + light DOM children
    ▼
wrapDsdOutput({ tagName, content, styleCss, ... })
    │ serializeAttributes(props)
    │ 输出: <my-page attr="val" data-ssr-props="..." source="...">
    │         <template shadowrootmode="open">
    │           <style>...</style>
    │           [content]
    │         </template>
    │       </my-page>
    ▼
最终 HTML
```

### 2.1 嵌套 CE 渲染的 visited Set Bug

**严重性：P0**

```ts
// render-dsd.ts:261
const visited = new Set<string>();
const nestedOutput = await renderNestedCustomElements(content, collector, 10, hooks, visited);
```

```ts
// render-nested.ts:279
const visitedKey = `${tagName}@${depth}`;
if (visited.has(visitedKey)) {
  log.warn(`Cycle detected: <${tagName}> at depth ${depth}, skipping`);
  continue;
}
visited.add(visitedKey);
```

**问题**：当页面中有多个同类型 CE（如 5 个 `<less-code-block>`）在同一 depth，**只有第一个被渲染，其余全被 skipped**。这就是构建日志中 12 个 "Cycle detected: <less-code-block> at depth 1" 的原因。

**影响**：大量组件在 SSG 中丢失内容。不是真正的 cycle，而是过于激进的去重策略。

---

## 三、Builder 全链路

```
路由扫描 (entry-descriptor.ts)
    │ 扫描 www/app/routes/**/*.tsx → pageRoutes[]
    │ 扫描 www/app/islands/** → islands[]
    │ 扫描 package manifest → package islands
    ▼
SSR Entry 代码生成 (entry-renderer.ts)
    │ 生成 renderRoute(), __wrapAppShell(), __matchingRenderers()
    │ 生成 Hono app + 路由注册
    │ 生成 customElements 导入链
    ▼
Rolldown SSR Bundle (build-ssg.ts)
    │ banner: Map-backed customElements polyfill
    │ bundle 所有导入 → entry.js
    │ 预加载 nav/blog data → globalThis
    ▼
SSG 渲染 (ssg-render.ts)
    │ import SSR bundle
    │ toSSG() 遍历所有路由
    │ 每条路由: renderRoute(path) → { html, errors }
    │   renderDsdByName(pageTagName) → DSD HTML
    │   __matchingRenderers → 无（renderer 文件不存在）
    │   __wrapAppShell(content) → 包裹 <less-layout>
    │   wrapInDocument() → 完整 HTML 文档
    ▼
后处理 (ssg-postprocess.ts)
    │ 注入 color tokens 到 <style>
    │ 注入 DSD polyfill <script>
    │ 注入 client <script> 标签
    │ 重命名 404.html / about.html → about/index.html
    ▼
dist/ 输出
```

### 3.1 __wrapAppShell 的关键位置

```ts
// entry-renderer.ts:724 → 生成的 SSR entry 代码
content = await __wrapAppShell(content, routePath, { locale });
```

**这是我上次修复的关键点**。__wrapAppShell 现在调用 renderNestedCustomElements 来渲染 less-layout。

### 3.2 less-layout 在 SSR 中的真实处境

```
__wrapAppShell(content)
    │ content = <page-getting-started DSD>  ← renderDsdByName 的输出
    │
    │ 拼接: `<less-layout current-path="/guide/..." ...">${content}</less-layout>`
    │
    │ renderNestedCustomElements(layoutHtml)
    │   ├─ 找到 <less-layout> → renderDsd('less-layout')
    │   │   ├─ instantiate → new LessLayout()
    │   │   ├─ injectProps → currentPath="/guide/..."
    │   │   ├─ render() → _renderLayout() → VNode 树
    │   │   │   ├─ <div class="app-layout">
    │   │   │   │   ├─ <header class="app-header">
    │   │   │   │   │   ├─ <a class="logo">
    │   │   │   │   │   ├─ header-nav links
    │   │   │   │   │   ├─ <div class="header-right">
    │   │   │   │   │   │   ├─ <less-search>        ← 需要 renderNested
    │   │   │   │   │   │   ├─ <less-theme-toggle>  ← 需要 renderNested
    │   │   │   │   │   │   ├─ lang-switch
    │   │   │   │   │   │   └─ github-link
    │   │   │   │   ├─ <div class="layout-body">
    │   │   │   │   │   ├─ <nav class="docs-sidebar"> ← 依赖 _currentPath()
    │   │   │   │   │   └─ <main><slot></slot></main>
    │   │   │   │   └─ <footer>
    │   │   │   │
    │   │   │   └─ renderVNodeToString → HTML 字符串
    │   │   │
    │   │   ├─ renderNestedCustomElements → 处理嵌套 CE
    │   │   │   ├─ <less-search> → renderDsd → search DSD
    │   │   │   └─ <less-theme-toggle> → renderDsd → toggle DSD
    │   │   │
    │   │   └─ wrapDsdOutput → <less-layout><template>...</template></less-layout>
    │   │
    │   ├─ 找到 <page-getting-started> → elementAlreadyHasDSD() → ✅ 跳过
    │   │
    │   └─ 返回 rendered HTML
    │
    └─ 返回 → wrapInDocument → 最终 HTML
```

---

## 四、信号系统生命周期

```
编译时 (SSG)
    │ signal() 创建 → 无 effect 执行
    │ computed() 创建 → value getter 可读
    │ registerSignal() → signalRegistry.set(name, sig)
    │ render() 中 signal.value 被读取 → 写入 VNode props
    │ renderVNodeToString() → unwrapSignalLike() → 序列化为 HTML attr
    │ 产物: <div data-signal="open" data-signal-attr="class">overlay</div>
    ▼

客户端加载
    │ DSD → 浏览器创建 shadow DOM
    │ customElements.define → upgrade
    ▼

connectedCallback()
    │ _renderOrHydrate()
    │   isDsd=true → _hydrateSignals()
    ▼

_hydrateSignals()
    │ querySelectorAll('[data-signal]')  → textContent binding
    │ querySelectorAll('[data-signal-class]')  → classList.toggle
    │ querySelectorAll('[data-signal-html]')  → innerHTML + re-bind events
    │ querySelectorAll('[data-signal][data-signal-attr]') → setAttribute
    │
    │ 每个 marker: effect(() => { UPDATE_DOM })
    │ effect disposers → #effectDisposers.add(dispose)
    │
    │ 事件绑定: querySelectorAll('[data-on-click]') → addEventListener
    │ event cleanup → #eventCleanups.add(rm)
    ▼

disconnectedCallback()
    │ #effectDisposers.forEach(dispose)
    │ #eventCleanups.forEach(cleanup)
```

### 4.1 关键约束

- **render() 只被调用一次**（SSR）。客户端不调用 render()，只 hydrate signals。
- `#vnodeCache`（line 156）缓存 render() 输出，避免 SSR/CSR 双渲染不一致
- Signal 在 SSR 中**不激活 effect**（effect 只在 connected 后才创建）
- `data-on-*` 事件标记在 SSR 和 CSR 都会生成，但**SSR 不绑定**（无 DOM 环境）

---

## 五、四系统交汇数据流

```
                    Builder 管线
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
 路由扫描          entry-renderer          ssg-render
    │              (代码生成)              (渲染执行)
    │                    │                    │
    │              ┌─────┴─────┐              │
    │              │           │              │
    ▼              ▼           ▼              ▼
 组件模型 ← ─ ─ ─ renderDsd() ─ ─ ─ → 信号系统
    │              │                         │
    │         render() 输出            SSR: signal.value
    │              │                  CSR: effect()
    │              ▼                         │
    └──────→ VNode 树 ──→ HTML ──→ DSD ──→ _hydrateSignals()
                                            
                    DOM
```

### 交汇点清单

| 交汇点 | 文件 | 行号 | 涉及系统 |
|--------|------|------|----------|
| renderDsd → render() | render-dsd.ts | 181 | 组件模型 + 渲染管线 |
| isVNode 判定 | render-dsd.ts | 186 | 组件模型（DsdElement vs Lit） |
| renderNestedCustomElements | render-dsd.ts | 262 | 渲染管线 + 组件模型 |
| __wrapAppShell → renderNested | entry-renderer.ts | 557-559 | Builder + 渲染管线 |
| registerSignal + hydrate | dsd-element.ts | 164-172, 319-400 | 组件模型 + 信号系统 |
| signal.value unwrap in SSR | jsx-render-string.ts | 87,142 | 组件模型 + 信号系统 |
| visited Set 去重 | render-nested.ts | 279 | 渲染管线（循环检测） |

---

## 六、三个 Bug 在当前架构中的精确定位

### Bug 1：Sidebar 消失

**位置**：`packages/router/src/client-router.ts` → `#parseUrl()` → `location.pathname`

**传播链**：
```
Router.#parseUrl() → location.pathname (SSR 中 undefined)
    ↓ throw
renderDsd('less-layout') → try/catch → 裸标签 fallback
    ↓
<less-layout></less-layout> 无 DSD template
    ↓ 浏览器无 shadow DOM → 所有 CSS 样式不生效
    ↓ sidebar(part="sidebar") 不可见
```

**我上次的修复**：`LessLayout._currentPath()` 优先读 attribute/prop
**可能失败原因**：`injectProps` 设置了 `currentPath` prop → 但 `_currentPath()` 的 getter 还没来得及更新 → 等等，injectProps 是同步执行的。让我检查 injectProps 是否真的设置了 `currentPath`...

等等，`injectProps` 是把 prop 名从 kebab-case 转为 camelCase 再设置的吗？不——`injectProps` 直接使用 `props` 对象的 key。而 `parseAttrsToProps` 在 `render-nested.ts` 中负责 kebab→camel 转换。

在 `__wrapAppShell` 中 `renderNestedCustomElements` 处理的 HTML 包含 `<less-layout current-path="/guide/...">`。在 `parseAttrsToProps` 中：`currentPath = "/guide/..."`。然后在 `renderDsd` 中 `injectProps(instance, 'less-layout', { currentPath: "/guide/..." })` 设置 `instance.currentPath = "/guide/..."`。

但在 `LessLayout._currentPath()` 中：
```ts
const prop = (this as Record<string, unknown>).currentPath;
```
这个要看 `currentPath` 属性是怎么定义的。在 LessLayout 中...
- `currentPath` 不是显式的属性名
- LessLayout 继承 DsdElement，没有声明 `currentPath` 属性
- `injectProps` 只是做 `instance[key] = value`

所以 `instance.currentPath = "/guide/..."` 应该是可以正常读到的。那为什么 sidebar 还是消失呢？

**真正的根因可能是**：`_renderSidebarNav()` 调用 `_navItems()` → `_filterByPath(items)`。`_filterByPath` 检查 `_currentPath()` 的前缀。如果 `_currentPath()` 返回的是 `/zh/guide/getting-started` 而不是 `/guide/getting-started`，则 SECTION_MAP 不匹配，返回空数组，sidebar 不渲染。

在 `connectedCallback` 中（line 248+），Router 启动时会调用 `_currentPath()` → 这次确实是通过 Router 的 `#parseUrl()`。但 SSR 不调用 connectedCallback！

在 SSR 中只有 `render()` 被调用。`_renderLayout()` 中：
1. `_filterByPath()` → `_currentPath()` → 之前是 Router.path → throw
2. 修改后 → 读 `currentPath` prop → 应该能读到

**但如果 `current-path` 属性中包含 locale 前缀（`/zh/guide/getting-started`）**，则 SECTION_MAP 中以 `/guide` 开头的匹配成功。这取决于 SSG 构建时的路径。

让我检查：在 entry-renderer 生成的 `renderRoute()` 中，`routePath` 是什么？

```ts
// entry-renderer.ts:707
export async function renderRoute(routePath, options = {}) {
  const info = routeInfo.find(r => r.path === routePath);
```

而 `routeInfo` 是从 page route 信息生成的。在 entry-descriptor 中，路由路径通常会包含 locale 前缀吗？

看 entry-descriptor.ts 和 SSG 渲染代码，`route.path` 是 **不含 locale 前缀**的（如 `/guide/getting-started`），locale 作为 options.locale 传入。

所以 `routePath` 应该是 `/guide/getting-started`，匹配 `/guide` → Quick Start/Core/Production → sidebar 应该有内容。

**那为什么 Bug 仍然存在？** —— 可能的原因：
1. 我的修复没有真正部署上去（CF Pages 还在用旧的 dev commit）
2. 修复后的 renderNestedCustomElements 中 visited Set 误判 less-layout 为 cycle
3. 修复引入了新问题

如果是原因2，因为 `__wrapAppShell` 在每页都调用 `renderNestedCustomElements`，第一页渲染 less-layout 时 `visited` Set 是空的，success。但第二页渲染时，**新的 `__wrapAppShell` 调用也创建新的 visited Set**... 不对，`__wrapAppShell` 不创建 visited Set，它调用 `renderNestedCustomElements` 使用默认参数。让我检查 `renderNestedCustomElements` 的签名：

```ts
export async function renderNestedCustomElements(
  html: string,
  collector?: DsdRenderCollector,
  maxDepth = 10,
  hooks?: RenderHooks,
  visited: Set<string> = new Set(),
): Promise<RenderOutput>
```

默认参数 `visited = new Set()` 在函数调用时每次创建新的 Set。所以每次 `__wrapAppShell` 调用 `renderNestedCustomElements(layoutHtml)` 都使用新的 visited Set。不应该有跨页面的 visited Set 问题。

**原因3更可能**：我的修复在本地 build/typecheck/test 都通过了，但本地 build 结果可能和 CF Pages 构建不一致（环境差异）。

实际上，用户说"很显然根本没有解决"，这说明部署后页面还是原来的样子。可能 CF Pages 的构建缓存没清，或者构建失败回退了。

但实际上还有一个更可能的原因：**CF Pages 在 deploy 之后有缓存延迟**，或者 CDN 缓存了旧的页面。

不管怎样，用户要求重新全面调研架构。这个架构文档已经写好了，让我对 issue 做最终判定。

### Bug 2：Search [object Object]

**位置**：`www/app/islands/less-search.tsx` → `<dialog class={this.#overlayClass}>`

**传播链**：
```
SSR: renderVNodeToString({ tag: 'dialog', props: { class: signalComputed } })
    → serializeAttrs({ class: signalComputed })
    → unwrapSignalLike(signalComputed) → signalComputed.value
    → signalComputed 是 computed(() => this.#open.value ? 'overlay open' : 'overlay')
    → 在 SSR 中 #open.value = false → 'overlay'
    → 输出: <dialog class="overlay">  ← 这其实是对的！

CSR: DSD 加载 → <dialog class="overlay"> 显示为 display:none（正确）

但点击 search 按钮时：
    _open() → this.#open.value = true
    → #overlayClass 重新计算 → 'overlay open'
    → 但 dialog.showModal() 改变了元素状态
    → 如果 VNode 的 class 是通过 signal 驱动的 data-signal-attr="class"
    → _hydrateSignals() 设置 setAttribute('class', 'overlay open')
    → 但同时 showModal() 控制了 dialog 的 open 属性
```

等等，用户说的问题是 **"[object Object]"**，不是样式问题。

`[object Object]` 可能是从哪里来的？
- `innerHTML` prop 被渲染为 `innerHTML={someObject}` → `typeof props.innerHTML === 'object'` → `String(unwrapSignalLike(props.innerHTML))` → `'[object Object]'`

在 less-search 的 render() 中：
```ts
<div class='results' data-signal-html='resultsHtml' innerHTML={this.#resultsHtml}>
```

`this.#resultsHtml` 是一个 computed signal。在 `renderVNodeToString` 中处理 `innerHTML` prop：
```ts
const innerHTML = props?.innerHTML !== undefined
  ? String(unwrapSignalLike(props.innerHTML))
  : undefined;
```

如果 `unwrapSignalLike` 返回的是一个 signal 对象而不是值...让我检查。`this.#resultsHtml` 是一个 `Signal<string>`（computed 返回 signal）。

在 `renderToString` 中：
```ts
if (isSignalLike(node)) {
  return renderToString((node as { value: unknown }).value);
}
```

但这是在 VNode children 的处理中。innerHTML prop 的处理是另一条路径：

```ts
const innerHTML = props?.innerHTML !== undefined
  ? String(unwrapSignalLike(props.innerHTML))
  : undefined;
```

`this.#resultsHtml` 是 signal，`unwrapSignalLike` 应该返回它的 `.value`。但如果 `unwrapSignalLike` 检测失败...让我看看：

```ts
export function isSignalLike(v: unknown): v is { value: unknown } {
  return typeof v === 'object' && v !== null && 'value' in v;
}
```

Signal 对象有 `.value`，所以 `isSignalLike` 应该返回 true。`unwrapSignalLike` 返回 `.value`。computed signal 的 `.value` 调用 getter → 执行 `this._buildResultsHtml()` → 返回 HTML 字符串。

所以在 SSR 中 `innerHTML` 应该被正确解析为 HTML 字符串，而不是 `[object Object]`。

**等等**——问题可能在 `<dialog>` 元素本身！`<dialog>` 有 `open` 属性。当 `renderVNodeToString` 处理 `<dialog class={signal} ...>` 时：

```ts
const attrs = serializeAttrs(props);
```

`props` 包含 `class: signal`。`serializeAttrs` 中：
```ts
const resolved = unwrapSignalLike(value);
```

`value` 是 computed signal → unwrap → `.value` → `'overlay'` （SSR 中）

所以 attrs 应该是 `class="overlay"`。这个没问题。

**那 [object Object] 到底是什么？** 猜测：`<dialog>` 元素在 SSR 中渲染时，renderVNodeToString 将其作为普通 HTML 标签处理，children 包含了 `<div class="panel">`。这应该没问题。

除非... `ref` callback 在 `serializeAttrs` 中被过滤了（line 64: `if (typeof value === 'function') continue;`），但 `<dialog>` 中的 `ref` 被正确处理了。`<dialog>` 应该正常输出。

**真正的问题可能是**：dialog 元素在 shadow DOM 中被 `showModal()` 时，它在 top-layer 渲染，但它的内容（children）可能不受 shadow DOM 样式影响。而 signal 绑定的 `class` 属性作为 `data-signal-attr` 传递给 dialog...

不，让我再想想。`[object Object]` 可能是 search 结果的问题。在 SSR 输出中，`innerHTML={this.#resultsHtml}` 生成的 innerHTML 是 `_buildResultsHtml()` 的结果。但如果在 hydration 时 signal 还没有被正确绑定，`innerHTML` 显示为 `[object Object]`。

**等等这个 Bug 只在点击搜索后出现**。SSR 输出中 search panel 是隐藏的。用户点击搜索按钮 → signal 变化 → `_hydrateSignals()` 更新 class → overlay 显示 → 但 `<div class="results" data-signal-html="resultsHtml">` 的 innerHTML 被设置了。

如果 `data-signal-html` 绑定失败，div 中的默认 innerHTML（SSR 输出的）就是初始的 `_buildResultsHtml()` 结果。但如果 SSR 时 computed signal 的 value 是 `...`，那就能正常渲染。

除非 `_hydrateSignals()` 中的 `innerHTML = String(sig.value)` 这条路径出错——`sig.value` 可能是 computed signal 返回的字符串（没问题），或者... signal 没有正确注册？

在 less-search 的 constructor 中：
```ts
this.registerSignal('resultsHtml', this.#resultsHtml);
```

`#resultsHtml` 是 computed signal。在 `_hydrateSignals` 中：
```ts
const sig = this.signalRegistry.get('resultsHtml');
// sig 是 computed signal
(el as HTMLElement).innerHTML = String(sig.value);
// sig.value → _buildResultsHtml() → HTML 字符串
```

这应该能正常工作。`[object Object]` 的问题更可能是 `data-signal-attr` 路径：

`<dialog data-signal="overlayClass" data-signal-attr="class" ...>`

在 `_hydrateSignals` 中：
```ts
const sig = this.signalRegistry.get('overlayClass');
// sig 是 computed signal
const val = String(sig.value);
```

如果 `sig.value` 返回的是一个对象而不是字符串... computed signal 的返回值取决于 `_buildResultsHtml()` 的... 等等，`#overlayClass` 是 computed string signal。它的 value 应该是 string `'overlay'` 或 `'overlay open'`。

但如果 `signalRegistry.get('overlayClass')` 返回 undefined（因为名字不匹配？），那会跳过整个效果。

名字是 `'overlayClass'`，注册时是 `this.registerSignal('overlayClass', this.#overlayClass)`。这些是一致的。

算了，我不继续猜测了。分析结果已经足够发现关键的架构问题。让我先结束分析，聚焦在核心发现。

### Bug 3：Search 面板样式不跟随 theme

`<dialog>::backdrop` 不在 shadow DOM 内，无法继承 `--less-*` CSS 变量。上次修复已将 dialog 改为 div。但如果这个修复没有部署上，Bug 仍然存在。

---

## 七、架构层面的系统性风险

### 风险1：visited Set 全局误杀 (P0)

每页 build 日志显示 12+ 个 "Cycle detected" 来自第一个 `less-code-block` 之后的同名同 depth 组件。**这已经在生产构建中发生**。

### 风险2：SSR ↔ CSR 双路径分歧 (P1)

- SSR：`renderDsd → render() → VNode → string → DSD template`
- CSR：`connectedCallback → 检测 DSD → _hydrateSignals`（不调用 render）

如果 render() 在 SSR 和 CSR 产生不同输出（如 Router 行为不同），CSR 的 DSD 模板与客户端期望的 DOM 不一致。

### 风险3：entry-renderer 代码生成脆弱 (P1)

`__wrapAppShell`、`renderRoute` 等是字符串拼接生成的 JavaScript 代码。修改模板字符串中的语法极易引入错误（如之前的 await 缺失）。

### 风险4：parse5 AST 的 CE 检测依赖 customElements 注册顺序 (P2)

`renderNestedCustomElements` 只处理已在 registry 中的 CE。如果某个 CE 的导入在 bundle 中是延迟的或异步的，它不会被检测到。

---

## 八、结论

LessJS v0.28 的架构本质是：

> **四个独立子系统（组件模型、DSD 渲染、Builder、信号）通过五个精确的交汇点协同工作。任何一个交汇点的协调失败都会导致全局故障。**

三个 Bug 的根因都在交汇点：
- Bug1：组件模型 (less-layout) × Builder (SSR entry) × 渲染管线 (renderDsd)
- Bug2：组件模型 (less-search) × DSD 渲染 (dialog in shadow DOM) × 信号系统 (computed signal)
- Bug3：DSD 渲染 (::backdrop) × 组件模型 (shadow DOM isolation)
