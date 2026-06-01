# LessJS v0.27.0 前端核心开发专项审计报告

**审计人**：前端核心开发工程师（Alex）
**审计日期**：2026-06-01
**审计范围**：代码质量 + TypeScript 类型 + 业务逻辑
**审计对象**：`packages/core/src/`、`packages/signals/src/`、`packages/runtime/src/`、`packages/router/src/`

---

## 一、总体评估

LessJS v0.27.0 核心代码展现了较高的架构水准——DSD 单遍渲染、Signal-native Hydration、VNode 统一等重构方向正确。代码注释丰富（含 ADR/SOP 引用），模块划分清晰。但在类型安全性、边界处理、遗留代码清理和部分逻辑鲁棒性上存在可整改的问题。

**成熟度判断**：框架核心功能链路完整可用，但存在若干中高风险问题需在生产落地前修复。预计 **1-2 个迭代**可完成整改。

---

## 二、代码规范问题清单

### 2.1 命名不一致

| 编号 | 级别 | 文件路径 | 行号 | 问题 | 整改建议 |
|------|------|---------|------|------|---------|
| CN-01 | P2 | `core/src/dsd-element.ts` | 456 | 方法名 `_hyrateExistingDom` 拼写错误，应为 `_hydrateExistingDom` | 修正拼写 |
| CN-02 | P2 | `core/src/jsx-render-string.ts` | 186 | `<For>` 标签匹配使用 `'fore'` 字面量，疑似拼写错误或历史遗留，与 `FOR_TAG` symbol 不一致 | 确认是否为有意设计；若是遗留则删除 |
| CN-03 | P2 | `core/src/render-dsd.ts` | 56 | `_textEncoder` 声明为模块级变量但从未使用 | 删除未使用变量 |
| CN-04 | P2 | `core/src/render-dsd.ts` | 394-396 | `renderEndTimeFallback()` 函数使用 `Date.now()` 而 `renderEnd` 主路径使用 `performance.now()`，时间基准不一致导致度量值不可比 | 统一为 `Date.now()` 或在 `performance` 不可用时从 t=0 计算相对值 |

### 2.2 硬编码与魔法值

| 编号 | 级别 | 文件路径 | 行号 | 问题 | 整改建议 |
|------|------|---------|------|------|---------|
| MV-01 | P2 | `core/src/dsd-element.ts` | 434 | `EVENT_TYPES` 硬编码为 5 种事件类型，不支持扩展 | 提取为可配置常量或接受外部注册 |
| MV-02 | P2 | `core/src/island.ts` | 221 | `VISIBILITY_TIMEOUT = 30_000` 硬编码 30 秒超时 | 提取为 `IslandOptions` 可选参数 |
| MV-03 | P2 | `core/src/island.ts` | 190 | `rootMargin: '200px'` 硬编码 | 提取为可配置常量 |
| MV-04 | P2 | `core/src/html-escape.ts` | 163 | `title = 'LessJS'` 硬编码默认标题 | 已通过 options 参数可覆盖，但默认值应从配置读取 |
| MV-05 | P1 | `core/src/island.ts` | 264 | `setTimeout(registerFn, 50)` 中的 50ms 为魔法数字 | 提取为具名常量 `IDLE_FALLBACK_MS = 50` |

### 2.3 遗留调试代码

| 编号 | 级别 | 文件路径 | 行号 | 问题 | 整改建议 |
|------|------|---------|------|------|---------|
| DB-01 | P1 | `core/src/render-dsd.ts` | 226-243 | `console.log('[LessJS Debug] isVNode check failed for...')` 生产代码中残留调试日志，包含 `Object.keys(result)` 等详细内部信息泄露 | 删除或替换为 `log.debug()`，不应在非 debug 模式输出内部结构 |

### 2.4 注释与代码不一致

| 编号 | 级别 | 文件路径 | 行号 | 问题 | 整改建议 |
|------|------|---------|------|------|---------|
| CC-01 | P2 | `core/src/dsd-element.ts` | 142 | 注释提到 "v0.25.0 (SOP-012): Removed — detection now inline in _renderOrHydrate()" 但未说明移除了什么字段 | 补充说明移除的是 `_dsdHydrated` 字段 |
| CC-02 | P2 | `core/src/dsd-element.ts` | 599 | 注释 v0.28.1 但项目版本为 v0.27.0 | 核对版本标注，与实际发布版本对齐 |
| CC-03 | P2 | `core/src/types.ts` | 599 | `ReactiveHost` 接口结束的 `}` 后紧跟另一个接口定义，缺少空行分隔 | 添加空行 |

---

## 三、TypeScript 类型缺陷

### 3.1 `any` 类型滥用

| 编号 | 级别 | 文件路径 | 行号 | 问题 | 影响 | 整改建议 |
|------|------|---------|------|------|------|---------|
| TS-01 | **P0** | `core/src/types.ts` | 518 | `LessMiddleware = (c: any, next: ...) => ...` 使用 `any` | 中间件参数完全失去类型检查，用户编写中间件时无类型提示 | 定义 `LessContext` 接口替代 `any`，或使用泛型 `<T>` |
| TS-02 | P1 | `router/src/client-router.ts` | 20 | `declare const navigation: any` | Navigation API 无类型约束，属性访问无检查 | 使用 `interface NavigationAPI` 定义已知方法签名 |
| TS-03 | P1 | `core/src/dsd-element.ts` | 多处 | `as unknown as Record<string, unknown>` 大量使用 | 虽比 `any` 安全，但频繁出现说明类型抽象不足 | 定义 `PropCarrier` 等中间类型统一处理 |
| TS-04 | P2 | `signals/src/engine.ts` | 12-18 | `_log` 工具方法使用 `...args: unknown[]` | 可接受但不精确 | 使用模板字面量类型约束格式化参数 |

### 3.2 类型不安全点

| 编号 | 级别 | 文件路径 | 行号 | 问题 | 影响 | 整改建议 |
|------|------|---------|------|------|------|---------|
| TS-05 | **P0** | `core/src/vnode.ts` | 42-50 | `isVNode()` 仅检查 `'tag' in v && 'props' in v && 'children' in v` | 任何含有这三个字段的普通对象都会被误判为 VNode（如 `{tag: 'x', props: {}, children: []}` 随意构造），导致后续 render 路径处理非预期对象 | 增加 `typeof v.tag === 'string' \|\| typeof v.tag === 'function' \|\| typeof v.tag === 'symbol'` 校验，或使用 branded type（`__brand: 'VNode'`） |
| TS-06 | P1 | `core/src/prop.ts` | 570 | `sigMap.signals.get(key)!` 使用非空断言 | 若 key 不存在，运行时抛出 undefined 访问错误而编译期无法捕获 | 使用 `const sig = sigMap.signals.get(key); if (!sig) return;` |
| TS-07 | P1 | `core/src/prop.ts` | 350-377 | `normalizePropDecl(decl: unknown)` 返回类型中 `type` 可能为非法值 | `d.type as NormalizedPropDecl['type']` 强制转换，若 `decl` 为 `{type: Date}` 等非法值，运行时 `DEFAULT_VALUES[ctor.name]` 返回 undefined | 增加 `type` 校验，非法值回退到 `String` |
| TS-08 | P1 | `core/src/jsx-render-string.ts` | 193 | `children[0] as unknown as ((item: unknown, idx: number) => unknown)` | 不验证 children[0] 是否存在且为函数 | 增加存在性与类型检查 |
| TS-09 | P2 | `core/src/jsx-render-dom.ts` | 290-291 | `children[0] as unknown as ((item: unknown, idx: number) => unknown) ?? (() => document.createTextNode(''))` | 空值合并的右侧类型不匹配，as 转换链过长 | 提取为独立变量并显式检查 |
| TS-10 | P2 | `core/src/jsx-runtime.ts` | 78 | `const { children, ref, ...rest } = props as Record<string, unknown> & { children?: unknown; ref?: ... }` | 解构 + spread 对 `ref` 的处理在 `createVNode` 外无法保证类型一致 | 使用显式属性提取替代解构 spread |

### 3.3 类型设计问题

| 编号 | 级别 | 文件路径 | 问题 | 整改建议 |
|------|------|---------|------|---------|
| TS-11 | P1 | `core/src/types.ts` | `DsdComponent` 接口含 `[key: string]: unknown` 索引签名，导致所有属性访问均返回 `unknown`，失去类型检查 | 使用泛型或移除索引签名，改用 `Partial<Record<string, unknown>>` |
| TS-12 | P1 | `core/src/types.ts` | `CemBase` 含 `[key: string]: unknown`，同样污染所有子接口 | 与 TS-11 同策略 |
| TS-13 | P2 | `core/src/types.ts` | `CustomElementsManifest` 含 `[key: string]: unknown` | 考虑使用 `Record<string, unknown>` 约束已知键外字段 |
| TS-14 | P2 | `core/src/signal-like.ts` | `SignalLike` 接口与 `@lessjs/signals` 的 `WritableSignal` / `ReadonlySignal` 不完全对齐（缺少 `valueOf` 等） | 统一为同一套接口定义，或让 `WritableSignal` extends `SignalLike` |

---

## 四、高复杂度函数/类分析

### 4.1 DsdElement 类（656 行）

**复杂度评估**：高。类承担 DSD 检测、CSR 渲染、信号水化、事件绑定、样式管理、属性同步、表单关联等 7+ 职责。

**具体问题**：
- `connectedCallback()` 方法内嵌 6 层逻辑：初始化 props → 创建 shadow root → 同步 data-theme → 解析 params → renderOrHydrate → attachInternals
- `_hydrateSignals()` 方法 107 行，包含 4 种信号绑定模式（textContent/class/innerHTML/attr），逻辑重复度高
- `#effectDisposers` 和 `#eventCleanups` 的生命周期管理分散在 4 个方法中

**重构建议**：
1. 提取 `SignalBindingManager` 类，封装 4 种信号→DOM 绑定模式
2. 提取 `EventManager` 类，统一事件绑定/解绑生命周期
3. `connectedCallback` 内的各步骤提取为独立的 `_initXxx()` 方法

### 4.2 renderDsd() 函数（429 行 → render-dsd.ts 389 行）

**复杂度评估**：中高。多态输入解析（string | class）、双阶段样式提取、错误恢复逻辑交织。

**具体问题**：
- 函数签名 8 个参数（含可选），过长且难以记忆
- 多态输入处理（string vs class）增加了认知负担
- 错误恢复逻辑在 3 处分散（实例化失败、render 失败、样式提取失败）

**重构建议**：
1. 使用 options 对象模式替代多参数：`renderDsd(input: RenderDsdInput): Promise<RenderOutput>`
2. 已有 `RenderInput` 类型但未用于函数签名，应统一
3. 提取 `_resolveInput()` 函数处理多态输入解析

### 4.3 renderToString() / renderDsdTree()（436 行 + 268 行）

**复杂度评估**：中高。两个函数有大量重复逻辑（Fragment/Show/For/Component 处理），仅内层递归调用不同（同步 vs 异步）。

**重构建议**：
1. 抽取共享的节点分类逻辑（Fragment/Show/For/Component 分支判断）
2. 通过策略模式或回调参数消除代码重复

### 4.4 prop.ts（607 行）

**复杂度评估**：中。legacy `@prop()` 运行时与 `static props` 运行时并存，symbol-keyed 状态管理复杂。

**具体问题**：
- `initializeProps()` + `initializeStaticProps()` 逻辑高度相似，但维护两套独立实现
- `normalizePropDecl()` 被多次调用（初始化时 + 每次属性变更时），可缓存结果
- `handleStaticPropAttributeChange()` 内部循环遍历所有 props 查找匹配，O(n) 复杂度

**重构建议**：
1. 统一 props 运行时为单套实现，内部区分 legacy/static
2. 缓存 `normalizePropDecl()` 结果到 `Map<unknown, NormalizedPropDecl>`
3. 构建属性名→prop 名的反向映射，O(1) 查找

---

## 五、代码隐性 BUG 与逻辑漏洞

### 5.1 P0 高风险

| 编号 | 文件路径 | 行号 | 问题描述 | 影响 | 整改建议 |
|------|---------|------|---------|------|---------|
| BG-01 | `core/src/dsd-element.ts` | 337-341 | `effect(() => { (el as HTMLElement).textContent = String(sig.value); })` 在 effect 回调中直接设置 textContent，但未处理信号值含 HTML 标签的情况——若 signal 值包含 `<script>` 或 `<img onerror=...>`，直接通过 textContent 设置是安全的（textContent 不解析 HTML），但与其他使用 `innerHTML` 的 data-signal-html 路径语义不一致，可能导致开发者误用 | 开发者可能误认为 data-signal 也会解析 HTML，从而在 signal 值中放入不安全内容 | 文档明确区分 data-signal（textContent，安全）vs data-signal-html（innerHTML，需信任） |
| BG-02 | `core/src/dsd-element.ts` | 371-379 | `data-signal-html` 路径：`innerHTML` 赋值后调用 `_bindEvents(el)`，但 effect 回调内 `_bindEvents` 仅绑定 `data-on-*` 事件，不处理子元素中的 `data-signal` 嵌套——innerHTML 更新后子树中的 data-signal 不会被重新绑定 | 动态内容中嵌套的信号绑定丢失，UI 不更新 | innerHTML 更新后应递归调用 `_hydrateSignals()` 或至少扫描子树的 data-signal |
| BG-03 | `core/src/event-hydration.ts` | 53-138 | `collectEventBindings()` 和 `renderToString()` 中的 `serializeEventMarkers()` 使用**独立计数器**——`collectEventBindings` 内部维护 `let count = 0`，`serializeEventMarkers` 使用 `EventMarkerContext` 的计数器。SSR 输出中的 `data-eid` 与客户端收集的绑定 ID 可能不匹配 | **事件水化失败**：SSR 生成的 `data-eid="e0"` 与客户端 `collectEventBindings` 产生的 `e0` 可能对应不同的元素 | 统一使用 `EventMarkerContext` 的计数器，或在 `collectEventBindings` 中也接受外部 context |
| BG-04 | `core/src/dsd-element.ts` | 297 | `const isDsd = this.shadowRoot && this.shadowRoot.childNodes.length > 0` 仅检查 childNodes 数量，不区分 DSD 内容与空文本节点——如果 DSD 模板输出仅含空白文本节点，仍会被误判为 DSD 已水化 | 空白内容的 DSD 组件可能跳过 CSR 渲染，显示空白 | 增加 `hasChildElement()` 检查，或验证是否存在非空文本/元素子节点 |

### 5.2 P1 中风险

| 编号 | 文件路径 | 行号 | 问题描述 | 影响 | 整改建议 |
|------|---------|------|---------|------|---------|
| BG-05 | `core/src/dsd-element.ts` | 565-575 | `subscribeTo()` 跳过首次触发（`initial = true; return;`），但 effect 系统本身也会在创建时立即执行一次回调——两次跳过可能导致首次信号变更不触发更新 | 信号首次变更可能被跳过，组件不更新 | 验证 alien-signals effect 首次执行语义，确认跳过逻辑正确 |
| BG-06 | `core/src/dsd-element.ts` | 588-614 | `_renderIntoShadowRoot()` 先 dispose 旧 effects，再 render，再 `renderToDom(result, undefined, disposers)`——但 `disposers` 已被 clear，新 effect 的 dispose 函数被加入已清空的 set | 新 effect 仍被正确跟踪（clear 后 add 正常工作），但逻辑意图不清晰 | 在 clear 之后添加注释说明意图，或重命名为更明确的变量 |
| BG-07 | `core/src/jsx-render-dom.ts` | 265-284 | `Show` 组件的 CSR 实现：`marker` comment node 在创建时还没有 parentNode，但 `swap()` 中 `marker.parentNode?.insertBefore()` 可能因 marker 尚未挂载而静默失败 | 首次渲染时 Show 组件可能不显示内容 | 在 `swap()` 后添加验证或改用其他挂载策略 |
| BG-08 | `core/src/jsx-render-dom.ts` | 296-316 | `For` 组件的 CSR 实现：`reconcile()` 在 effect 中调用时，`marker.parentNode` 可能为 null（组件尚未挂载到 DOM），`marker.parentNode?.insertBefore()` 静默跳过 | 列表渲染可能丢失元素 | 同 BG-07 |
| BG-09 | `core/src/prop.ts` | 193 | `getInitialValue()` 中 `const own = (instance as Record<PropertyKey, unknown>)[key]` ——类字段初始值（如 `count = 5`）会被读取为 PropSignal 对象而非数值 | 如果组件声明 `count = 5` 且同时声明 `static props = { count: Number }`，初始值可能被 PropSignal 覆盖 | 在读取 own property 前检查是否为 PropSignal |
| BG-10 | `core/src/signal-context.ts` | 20 | `contexts` 为模块级 `Map<symbol, unknown>`，多组件实例共享同一个 Map | 在 SSR 场景中，多个请求可能读写同一个 contexts Map，造成状态泄露 | 将 contexts 绑定到请求上下文，或使用 WeakMap |
| BG-11 | `core/src/render-dsd.ts` | 92-129 | `renderDsd()` 的多态参数解析逻辑复杂，`propsOrClass` 可能是 `CustomElementConstructor` 或 `Record<string, unknown>`，通过 `'prototype' in propsOrClass` 区分——但普通对象也可能含 `prototype` 属性 | 参数解析错误导致错误的渲染路径 | 使用 `typeof propsOrClass === 'function'` 作为首选判断 |
| BG-12 | `core/src/jsx-render-dom.ts` | 164-168 | 事件类型提取 `key.slice(2).toLowerCase()` 对 `onDoubleClick` 等驼峰命名产生 `doubleclick` 而非标准 `dblclick` | 双击事件无法正确绑定 | 增加事件名映射表：`{ doubleclick: 'dblclick' }` |

### 5.3 P2 低风险

| 编号 | 文件路径 | 行号 | 问题描述 | 整改建议 |
|------|---------|------|---------|---------|
| BG-13 | `core/src/island.ts` | 409 | `const isBrowser = typeof IntersectionObserver !== 'undefined'` 在 Deno SSR 环境中，如果加载了 IntersectionObserver polyfill，会误判为浏览器 | 使用 `typeof window !== 'undefined'` 或更完整的检测 |
| BG-14 | `core/src/html-escape.ts` | 38-41 | `escapeHtml()` 对非字符串输入返回空字符串，但调用方 `renderToString` 已做了类型判断——冗余防御 | 保留防御性编程但添加注释 |
| BG-15 | `core/src/event-hydration.ts` | 45-50 | `serializeEventMarkers()` 只为第一个 on* prop 生成 data-eid，如果同一元素有多个事件处理器（onClick + onKeydown），只序列化一个 marker | 多事件元素的后续事件无法水化 | 为每个事件类型生成独立 marker，或使用 JSON 编码多个事件 |

---

## 六、异常捕获与错误处理

### 6.1 空 catch 块

| 编号 | 级别 | 文件路径 | 行号 | 问题 | 整改建议 |
|------|------|---------|------|------|---------|
| EH-01 | P1 | `core/src/dsd-element.ts` | 278 | `catch { /* ignore malformed JSON */ }` — params 解析失败完全静默 | 至少 `log.debug()` 记录，帮助排查 SSR params 传递问题 |
| EH-02 | P1 | `core/src/render-dsd.ts` | 302 | `catch { /* Cross-origin stylesheet or empty sheet - skip silently */ }` | 保留静默但添加注释说明为何无法获取 cssRules |
| EH-03 | P2 | `core/src/event-hydration.ts` | 111 | `catch { return; }` — 组件实例化失败在事件收集阶段被完全忽略 | 记录 debug 日志 |
| EH-04 | P2 | `core/src/alien-engine.ts` | 72, 78 | `catch { /* swallow */ }` — effect cleanup 异常被吞没 | 记录 debug 日志，不应完全静默 |

### 6.2 缺失 try/catch

| 编号 | 级别 | 文件路径 | 行号 | 问题 | 整改建议 |
|------|------|---------|------|------|---------|
| EH-05 | P1 | `core/src/dsd-element.ts` | 337-341 | `effect()` 回调内设置 textContent 无 try/catch，若 signal 值访问抛出异常，effect 会中断 | 包裹 try/catch 或确保信号值访问不抛 |
| EH-06 | P1 | `core/src/jsx-render-dom.ts` | 267-283 | `Show` 的 `swap()` 中 `renderToDom` 可能抛出，但无 try/catch | 包裹 try/catch，失败时保留 marker |
| EH-07 | P2 | `core/src/prop.ts` | 410-419 | `Object.defineProperty()` 可能因属性不可配置而抛出 | 添加 try/catch |
| EH-08 | P2 | `core/src/signal-context.ts` | 37 | `(host as Record<symbol, unknown>)[ctx.key] = value` 无 try/catch | 在 SSR stub 场景下可能失败 |

---

## 七、可读性与可维护性优化建议

### 7.1 代码重复

| 编号 | 文件路径 | 问题 | 建议 |
|------|---------|------|------|
| RD-01 | `jsx-render-string.ts` + `jsx-render-dom.ts` | `renderToString()` 与 `renderToDom()` 有约 60% 重复的节点分类逻辑（Fragment/Show/For/Component 分支） | 提取 `classifyNode()` 共享函数，返回节点类型枚举，两个渲染器分别处理 |
| RD-02 | `jsx-render-string.ts` 内部 | `renderToString()` 与 `renderDsdTree()` 重复 | 考虑 `renderDsdTree` 复用 `renderToString` 的逻辑，仅替换 CE 渲染部分 |
| RD-03 | `event-hydration.ts` + `jsx-render-string.ts` | 组件类实例化 + props 注入逻辑重复（instance = new tag(); inject props; call render()） | 提取 `instantiateAndRender()` 工具函数 |

### 7.2 文档与注释

| 编号 | 文件路径 | 问题 | 建议 |
|------|---------|------|------|
| DC-01 | `core/src/dsd-element.ts` | 类注释中 v0.28 / v0.28.1 版本标注与项目 v0.27.0 不匹配 | 统一版本标注规范 |
| DC-02 | `core/src/prop.ts` | `createPropSignal()` 的 `valueOf`/`Symbol.toPrimitive` 行为对开发者而言不直观 | 增加使用示例和常见陷阱说明 |
| DC-03 | `core/src/signal-context.ts` | 缺少跨组件使用示例 | 补充 provider/consumer 组件配对示例 |
| DC-04 | `core/src/jsx-render-dom.ts` | `SVG_TAGS` 列表缺少注释说明为何选择这些标签 | 补充说明标准来源（SVG spec） |

### 7.3 架构可维护性

| 编号 | 问题 | 建议 |
|------|------|------|
| AM-01 | `@lessjs/core` 承担了过多职责（JSX runtime + DSD renderer + prop system + signal context + island + error boundary），单包 6911 行 | 考虑拆分为 `@lessjs/core`（DSD + base class）+ `@lessjs/jsx`（runtime + renderers）+ `@lessjs/props`（reactive property system） |
| AM-02 | `prop.ts` 中 legacy `@prop()` 与 `static props` 两套运行时并存，代码量膨胀 | 设定 deprecated 时间线，v1.0 前移除 `@prop()` 运行时 |
| AM-03 | `types.ts` 1448 行过于庞大，混合了 DSD、CEM、兼容性、ISR 等不相关类型 | 按 domain 拆分：`dsd-types.ts`、`cem-types.ts`、`route-types.ts` |

---

## 八、关键发现汇总

### P0 高风险（3 项）

1. **BG-03**：`collectEventBindings()` 与 `serializeEventMarkers()` 的计数器不共享，SSR/客户端事件 ID 可能不匹配，导致事件水化失败
2. **TS-05**：`isVNode()` 类型守卫过于宽松，任何含 tag/props/children 字段的对象都被误判
3. **TS-01**：`LessMiddleware` 使用 `any` 类型，中间件参数完全失去类型安全

### P1 中风险（12 项）

1. **BG-02**：`data-signal-html` 内部子树的 data-signal 不会被重新绑定
2. **BG-05**：`subscribeTo()` 跳过首次 + effect 自身首次执行的交互可能异常
3. **BG-07/BG-08**：Show/For 组件 marker 在未挂载时 parentNode 为 null
4. **BG-10**：SignalContext 模块级 Map 在 SSR 请求间共享
5. **BG-12**：事件名映射缺失 dblclick
6. **BG-15**：serializeEventMarkers 只序列化第一个事件处理器
7. **DB-01**：生产代码残留调试日志
8. **TS-06**：非空断言 `!` 使用
9. **TS-07**：normalizePropDecl 强制类型转换可能产生非法值
10. **TS-11/TS-12**：索引签名 `[key: string]: unknown` 污染子接口
11. **EH-01/EH-02**：关键路径空 catch 块

### P2 低风险（15+ 项）

详见各节表格。

---

## 九、整改优先级建议

| 优先级 | 事项 | 预估工作量 |
|--------|------|-----------|
| 🔴 紧急 | BG-03：统一事件 ID 计数器 | 0.5d |
| 🔴 紧急 | TS-05：加强 isVNode 类型守卫 | 0.5d |
| 🔴 紧急 | TS-01：替换 LessMiddleware any 类型 | 0.5d |
| 🟡 重要 | BG-02：data-signal-html 子树重绑定 | 1d |
| 🟡 重要 | BG-12：添加事件名映射表 | 0.5d |
| 🟡 重要 | BG-10：SignalContext SSR 隔离 | 1d |
| 🟡 重要 | DB-01：清理调试日志 | 0.5d |
| 🟡 重要 | TS-11/12：修复索引签名污染 | 1d |
| 🟡 重要 | CN-01：修复方法名拼写 | 0.1d |
| 🟢 建议 | AM-01/02/03：架构拆分规划 | 3-5d |
| 🟢 建议 | RD-01/02/03：消除代码重复 | 2d |
| 🟢 建议 | 4.1 DsdElement 职责拆分 | 3d |

---

## 十、结论

LessJS v0.27.0 核心代码在架构设计上方向正确（DSD 优先、Signal-native、VNode 统一），注释和 ADR 引用充分体现了工程规范意识。但存在 **3 个 P0 级问题**需要紧急修复——事件水化 ID 不匹配可能导致线上交互失败，isVNode 守卫过松可能引发渲染异常，any 类型滥用破坏类型安全链。

建议在进入生产环境前，优先解决 P0/P1 级问题（预估 **5-7 个工作日**），同时启动架构拆分和代码去重的中长期规划。
