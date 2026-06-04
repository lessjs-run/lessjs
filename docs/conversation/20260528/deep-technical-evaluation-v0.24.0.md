# LessJS v0.24.0 — 深度技术评估

> 评估人视角：15 年全栈 JS 架构师，React/Vue/Next.js/Remix/Astro 源码研读者
> 评估日期：2026-05-28
> 评估基线：`C:\Users\Administrator\WorkBuddy\Claw\src-tmp` @ commit `2bc3195a`

---

## 一、整体定位与差异化分析

### 1.1 核心设计哲学

LessJS 的设计哲学可以总结为三点：

1. **DSD-first**：Declarative Shadow DOM 是一等公民。SSR 产出不是纯 HTML 字符串，
   而是 `<template shadowrootmode="open">` 包裹的 Shadow DOM。浏览器原生解析，零 JS
   即可呈现完整组件。这点与所有主流框架有本质区别。

2. **Ocean-Island 架构**：80% 的页面内容（"海洋"）作为 DSD 组件在 SSR 阶段完成，
   只在需要 interactivity 的 20%（"岛屿"）使用客户端 JS。这个比例分界不是修辞，
   而是实际架构约束——DsdElement 的 DSD 水合路径不执行 `render()`，只绑事件。

3. **Zero-dependency core**：`@openelement/core` 的 `renderDSD()` 是纯字符串插值实现，
   不依赖任何 DOM shim、不依赖 Lit、不依赖 Node.js API。这使其可以在 Deno/Node/Bun/Edge
   无差异运行。

### 1.2 与主流框架的差异化

| 维度       | Next.js        | Astro          | Remix        | LessJS                   |
| ---------- | -------------- | -------------- | ------------ | ------------------------ |
| SSR 产物   | HTML string    | HTML string    | HTML string  | **DSD template**         |
| 组件模型   | React          | Astro/任意     | React Router | **原生 Custom Elements** |
| 框架锁定   | 强（React）    | 弱             | 强（React）  | **无（原生 WC）**        |
| 零 JS 可见 | 否（水合必须） | 部分（island） | 否           | **是（DSD 路径）**       |
| 客户端引擎 | React          | 按需           | React        | **无（DsdElement）**     |

核心差异化：**LessJS 是唯一一个在 SSR 阶段产出完整 Shadow DOM 结构的框架。**
Astro 的 island 输出裸 HTML，Next.js 输出 React 水合标记。LessJS 的 DSD 产物
在浏览器禁用 JS 时仍然呈现完整的组件 UI（包括隔离样式）。

### 1.3 真正的创新点 vs 重新组合

**真正的创新**：

1. **DSD-native 渲染管线**：`renderDSD()` → `<template shadowrootmode>` 的零依赖
   纯字符串实现。这不是在 Lit SSR 上包装，而是从零构建的 DSD 方案。代码量 ~200 行，
   干净得令人惊讶。

2. **DsdElement 的 DSD/CSR 双路径**：`connectedCallback()` 中检测 `shadowRoot.childNodes.length > 0`
   来判断是否已被浏览器从 DSD 模板预填充。如果已填充 → 只绑事件，不做 `innerHTML`。
   如果未填充 → 执行完整 CSR 渲染。这个判断逻辑简单但精巧。

3. **`render(): string` 的 opt-in 演进**：组件可以返回纯 `string`（零开销 DSD）
   或 `TemplateResult`（带 `@click` 事件和 Signal 响应）。不是"两种模式"，而是
   `html` tagged template 是 `string` 的**严格超集**。升级路径零摩擦。

**重新组合/微调**：

1. **`@prop()` 装饰器**：本质上和 Lit 的 `@property()` 是同构方案。信号 + 访问器 +
   attribute 同步，没有提出新范式。差距在于 LessJS 的实现更轻（~300 行 vs Lit 的
   `reactive-element` ~2000 行），但功能也少得多（不支持 `converter`、`hasChanged`、
   `noAccessor` 的完整实现等）。

2. **模板助手（classMap/when/choose/repeat/ref）**：与 lit-html 的 `classMap`/`when`/
   `repeat`/`ref` 功能 1:1 对应。是合理的补课，不是创新。

3. **SSG 构建**：Vite 插件 + Rolldown SSR bundle + 静态生成。架构模式与 Astro 的
   Vite 插件 + SSG 几乎相同。适配器模式与 Astro 的 adapter 概念一致。

### 1.4 目标用户与市场

目标用户：**希望用 Web Components 构建 SSG 站点的全栈 JS 开发者**。

市场规模：小但真实。Lit SSR 实验性、Stencil 聚焦 Design System、Enhance 是小众选择。
WC + SSG 的成熟方案目前不存在（Astro 的 WC 支持是二等公民——不支持 DSD、不支持 SSR
时 Shadow DOM）。LessJS 填补了这个空白。

但需要注意：WC 生态本身在主流全栈圈占比 < 5%。这是一个"小而真"的市场，不是大市场。

### 1.5 一句话介绍

"唯一一个在 SSG 阶段产出完整 Declarative Shadow DOM 的全栈框架——浏览器禁用 JS 时，
你的组件依然有完整的隔离样式和 DOM 结构。"

---

## 二、技术架构与创新实现

### 2.1 整体架构

```
@openelement/runtime (组件作者门面)
  ├── @openelement/core     (DSD 渲染、DsdElement、模板、错误)
  ├── @openelement/signals   (alien-signals 包装)
  └── @openelement/style-sheet (CSSStyleSheet 抽象)

@openelement/adapter-vite (构建系统)
  ├── lessjs() Vite 插件
  ├── SSG 构建管线 (Phase 1: Client → Phase 2: Metadata → Phase 3: SSR + SSG)
  ├── 外部依赖解析器 (ADR-0054 AST)
  └── 适配器 (Lit/React/Vanilla)

@openelement/app (配置组装)
@openelement/create (项目脚手架)
@openelement/ui (DSD-native 组件库)
@openelement/content (Blog/Navigation)
@openelement/hub (Registry Hub)
```

架构分层清晰，职责边界明确。`@openelement/core` 真正做到了零依赖（`package.json` 中没有 npm
依赖），`@openelement/adapter-vite` 承担了所有构建复杂度。分层质量在自研框架中属于上乘。

### 2.2 亮点实现

**最佳：`renderDSD()` — `packages/core/src/render-dsd.ts`**

```ts
function renderComponent(tagName, props, options) {
  const Cls = customElements.get(tagName);
  const instance = new Cls();
  // 注入 props
  for (const [key, value] of Object.entries(props)) {
    (instance as any)[key] = value;
  }
  const inner = instance.render();
  // 嵌套 DSD 递归
  const nested = detectNestedCustomElements(inner);
  const resolved = renderNested(nested, options);
  return `<template shadowrootmode="open">${resolved}</template>`;
}
```

亮点：

- 零外部依赖的 DSD 渲染
- `new Cls()` → `render()` → `<template>` 的流程直观清晰
- 递归嵌套渲染解决了组件树的 SSR 问题
- 不到 300 行实现了完整的 DSD SSR 管线

**争议点**：嵌套检测使用正则 `/<\s*([\w-]+)(\s|>)/g`。这是脆弱但务实的方案——
完整 HTML 解析需要引入 htmlparser2（+200KB），而正则方案覆盖了 95% 的场景。

**最差：external-resolver.ts 的演进历史**

`external-resolver.ts` 经历了 regex → AST → 反复修改的曲折路径。v0.23.0 到 v0.23.6
之间，consumer smoke test 连续 6 轮失败，根源都在 external 依赖解析。最终方案
（ADR-0056：externalize + consumer import map）是正确的，但路径暴露了两个结构性问题：

1. 过分信任 `deno info --json` 的探针模块能覆盖所有子路径
2. 版本号统一 management 没有自动化——每次 bump 需要手动改 41 处引用

### 2.3 性能优化

| 优化             | 实现                                                | 效果                                 |
| ---------------- | --------------------------------------------------- | ------------------------------------ |
| DSD 零 JS 渲染   | `<template shadowrootmode>`                         | 浏览器原生解析，0ms 客户端渲染       |
| 模板缓存         | `WeakMap<TemplateStringsArray, ParsedTemplate>`     | 避免重复解析静态部分                 |
| 微任务批处理     | `queueMicrotask` + `_reactiveUpdateQueued` guard    | 多次 Signal 变化合并为一次 DOM patch |
| 细粒度 DOM patch | `_patchBindings()` 按 `data-less-b` marker 定点更新 | 不替换整个 shadowRoot，保留焦点/滚动 |
| ISR 缓存         | `MemoryIsrCache` with `IsrRouteConfig`              | 框架级 ISR 支持                      |

模板缓存的 `WeakMap` 设计值得特别指出：`TemplateStringsArray` 在 JS 中是 frozen 和
identity-stable 的，这意味着 `WeakMap` key 比较是 O(1) 的 identity check。这个选择
非常聪明。

### 2.4 安全性

**已做好的**：

- `sanitizeUrl()`：阻止 `javascript:`/`data:`/`vbscript:` 协议注入
- `escapeHtml()`/`escapeAttr()`：标准 HTML 转义
- `DANGEROUS_KEYS` 检查：防止 SSR 注入敏感属性
- `unsafeHTML()`：显式声明不安全 HTML（类似 React 的 `dangerouslySetInnerHTML`）

**缺失的**：

- 没有 CSP nonce 支持机制
- 没有内置 CSRF 保护
- SSR 阶段的 `injectProps()` 不验证输入类型（虽然 @prop 有运行时的 type 转换）

### 2.5 技术栈选择

- **TypeScript**：正确选择，类型安全
- **Vite 8 + Rolldown**：前沿但无兼容性负担——LessJS 不需要支持 Webpack
- **Deno 2.x**：作为开发/构建运行时，正确利用了 `nodeModulesDir: "auto"`
- **alien-signals**：作为信号引擎是个好选择（比 TC39 Signal 提案更成熟，比 Preact Signals 更轻）

**不必要的依赖**：`@openelement/signals` 实际上只是 alien-signals 的 ~20 行 wrapper。
考虑合并到 `@openelement/core` 或直接让用户导入 `alien-signals`。

---

## 三、代码质量与工程化水平

### 3.1 整体代码质量

代码整体质量**高于一般自研框架**。目录结构清晰，命名一致，注释充分。但存在几个问题：

1. **`dsd-element.ts` (~500 行) 职责过重**：同时管理 shadow DOM、事件绑定、Signal
   订阅、主题同步、ISR 支持、@prop 集成。应该拆分。

2. **`types.ts` (900+ 行)**：尽管已经拆分了一部分，仍然是"类型垃圾桶"。DSD 诊断、
   渲染报告、manifest 验证、ISR 类型全挤在一个文件里。

3. **多处重复的模式**：`less-plugin.ts`、`route-scanner.ts`、`subpath-resolver.ts`
   中有相似的文件扫描 + 错误处理模式，应该提取共享工具函数。

### 3.2 类型系统

**现状**：`any` 数量已从 50+ 降到 1（`packages/core/src/prop.ts` 中有一处必要的
dynamic property access）。

**好的方面**：

- `TemplateResult` / `SignalLike` / `ClassMapValue` 使用 branded symbol 做类型区分，
  不是简单的 `string | number | ...`
- `ErrorCode` 虽然是 const object 不是 enum，但作为 `string` 的 well-known 值是正确的
- 公共 API 的类型导出通过 `@openelement/runtime` 门面统一管理

**需要改进**：

- `ReactiveHost` 接口在 `types.ts` 中定义但未使用 `symbol` 做协议标记
- `RendererProtocol` 类型过于宽泛，很多字段是可选的但实际运行时必需
- `TemplateValue` 联合类型虽然被 `AttrValue`/`ContentValue`/`EventValue` 窄化，
  但 `html()` 函数仍接受完整的 `TemplateValue`（放弃了窄化收益）

### 3.3 错误处理

ADR-0053 的统一错误架构是一个**显著的进步**：

- `LessError` 类带 `code`/`severity`/`phase`/`recoverable`
- `ErrorBoundary` 组件可以捕获子组件渲染失败
- `SsrErrorContext` 在 SSR 管线中积累错误
- `setErrorTelemetryHook()` 提供全局错误观测

但仍有不足：

- `ErrorBoundary` 继承自 `DsdElement`，意味着你不能为非 DsdElement 的代码块设置边界
- CSR 路径的错误传播链没有完整实现（`ErrorBoundary.catchError()` 依赖于手动调用）
- Build pipeline 中的错误大多是直接 `throw`，没有通过 telemetry hook

### 3.4 测试覆盖

- 总测试数：932（1 预存失败）
- 新代码测试：style-sheet (5)、template helpers (5)、errors (3)
- signals 测试：signal/computed/effect 均有覆盖
- adapter-vite 测试：ssg-render、ssg-report 等关键路径有覆盖

**不足之处**：

- `@openelement/create` 的集成测试依赖 JSR 网络，本地跑不通
- `@openelement/ui` 组件没有视觉回归测试
- DSD 渲染的嵌套递归场景缺乏边界 case 测试（深层嵌套、循环引用）
- `@prop()` 装饰器没有单元测试（声明了但未写）

### 3.5 工程化

- ✅ `deno fmt`：强制格式化
- ✅ `deno lint`：312 文件无警告
- ✅ `deno task typecheck`：类型检查
- ✅ GitHub Actions CI：Lint & Format / SOP Gate / Publish to JSR / CodeQL
- ✅ ADR + SOP 双轨文档流程
- ⚠️ `deno.lock` 容易成为 CI 的"脏工作区"问题（需手动提交）
- ❌ 没有 semantic-release 或自动版本管理
- ❌ 没有 changelog 自动生成

---

## 四、开发者体验（DX）

### 4.1 上手难度

**中等偏高**。一个熟练的全栈开发者需要 2-4 小时才能跑通第一个页面。主要障碍：

- DSD/Shadow DOM 概念需要在思维中建立（与 React/Vue 的 VDOM 思维完全不同）
- `@openelement/runtime` 是唯一入口——但文档中混用了 `@openelement/core` 的旧示例
- SSG 构建错误提示不够友好（"SSR_RENDER_ERROR" 不带具体行号）

### 4.2 API 设计

**好的设计**：

```ts
// 组件声明直观
class MyCard extends DsdElement {
  render(): string { return `<div><slot></slot></div>`; }
}

// 响应式属性 1 行
@prop({ type: Boolean }) disabled = false;

// 模板助手语义清晰
html`<div class=${classMap({ active: true })}>`
```

**反直觉的设计**：

1. `render()` 返回值类型是 `string | TemplateResult`，但 TemplateResult-first 组件
   和 string 组件在行为上有细微差异（事件绑定只在 TemplateResult 上生效）
2. `connectedCallback()` 中自动调用 `_hydrateOrRender()`——开发者无法控制 DSD/CSR
   路径的选择，这在某些场景下会造成重复渲染
3. `lessBind()` 和 `island()` 的 API 命名不直观，文档覆盖不足

### 4.3 开发工具链

- ✅ Vite HMR：通过 `vite.config.ts` 的 lessjs 插件支持
- ❌ 无 DevTools 扩展
- ❌ 无组件浏览器（No Storybook/Pattern Library 集成）
- ❌ 错误提示中缺少组件堆栈（只有文件路径，没有组件树）

### 4.4 文档

**已存在**：

- ADR 文档 56 篇（详尽但有大量历史废弃）
- SOP 文档 18 篇（详细但面向开发者而非用户）
- Package README（core/runtime 已更新到 v0.24）
- Release Notes（0.23.0 / 0.24.0）

**严重缺失**：

- **没有 Getting Started 教程**：用户打开 repo 不知道该从哪里开始
- **没有 API 参考文档**：只能靠读源码
- **没有交互式 Playground**
- **中文/英文文档不统一**：部分文档只有中文，部分只有英文

### 4.5 错误提示

当前错误提示质量不高。典型例子：

```
SSR render failed: SSG pipeline
```

这条信息没有告诉用户：

- 哪个页面渲染失败
- 什么组件导致了错误
- 如何修复

对比 Next.js 的错误覆盖层（展示组件堆栈 + 源码位置 + 修复建议），LessJS 的错误提示
落后一代。

---

## 五、生态与可扩展性

### 5.1 可扩展性

**Adapter 协议** 设计合理：

```ts
interface RendererProtocol {
  render(opts: RendererOptions): Promise<string>;
  extractStyles?(opts: unknown): string | null;
}
```

Lit/React/Vanilla 三个 adapter 证明了协议的可行性。但扩展点太少——只有 render 和
extractStyles 两个钩子。缺少：

- 构建生命周期钩子（beforeBuild/afterBuild）
- 路由中间件（类似 Express/Koa 的 middleware chain）
- 数据加载钩子（类似 Next.js 的 getServerSideProps）

### 5.2 第三方兼容性

WC 原生兼容性是 LessJS 的最大优势。任何 Web Component 都可以在 LessJS 中工作——
不限于 LessJS UI 库。Shoelace、Spectrum、FAST 组件可以直接使用。

但 SSR 环境下，第三方 WC 的兼容性取决于它是否支持 DSD 渲染。这是一个显著的生态限制。

### 5.3 大型应用

- ✅ 模块化：monorepo 17 个包，按需引用
- ✅ 代码分割：Vite 原生支持，island 按需加载
- ⚠️ 状态管理：没有跨组件的状态管理方案（无 Context API、无 Store）
- ❌ 微前端：没有 Module Federation 或类似的微前端支持

### 5.4 部署

- ✅ SSG 产出静态文件，可以部署到任何静态托管
- ✅ Deno Deploy 原生支持
- ✅ Cloudflare Pages / Vercel / Netlify 均兼容
- ⚠️ JSR publish 流程依赖 GitHub Actions，无法本地手动发布
- ❌ 没有 Docker/容器化部署的官方指南

---

## 六、问题与改进建议

### 6.1 关键问题（按严重程度排序）

| #  | 问题                                                       | 严重度 | 影响     | 难度 |
| -- | ---------------------------------------------------------- | ------ | -------- | ---- |
| 1  | **无最终用户文档**（Getting Started / API Reference）      | P0     | 无法推广 | 中   |
| 2  | **consumer smoke test 过于脆弱**（6 轮 CI 失败的根本原因） | P0     | 开发效率 | 高   |
| 3  | **版本号管理无自动化**（41 处引用手动更新）                | P1     | 维护负担 | 低   |
| 4  | **ErrorBoundary 继承 DsdElement**（限制使用场景）          | P1     | 架构债务 | 中   |
| 5  | **SSR 嵌套检测用正则**（边界 case 可能遗漏组件）           | P1     | 潜在 bug | 中   |
| 6  | **DSD/CSR 双路径行为差异**（事件绑定差异不透明）           | P2     | DX 混淆  | 低   |
| 7  | **types.ts 仍 900+ 行**（类型垃圾桶问题未完全解决）        | P2     | 维护性   | 低   |
| 8  | **无 CSP nonce 支持**                                      | P2     | 安全     | 低   |
| 9  | **无跨组件状态管理**                                       | P2     | 生态     | 中   |
| 10 | **`@prop()` 装饰器缺少单元测试**                           | P3     | 质量     | 低   |

### 6.2 针对性建议

**P0-1：文档**

```
docs/
├── getting-started/     # 5 分钟快速上手
├── guides/              # 按主题：组件、路由、部署
├── api/                 # 自动生成的 API 参考
└── examples/            # 完整的示例项目
```

优先级：用 `@openelement/create` 生成的项目为基础，写一个从零到部署的完整教程。

**P0-2：Consumer Smoke Test**

```
方案：在 adapter-vite 的 build-ssg.ts 中增加 --smoke 模式，
跳过完整的 SSG 渲染（这需要 Hono app 和路由），只验证 SSR bundle
构建和导入是否成功。简单得多，覆盖关键路径。
```

**P1-3：版本号自动化**

```bash
# 新增 deno task bump -- 0.23.0 0.24.0
# 自动更新所有 packages/*/deno.json 中的版本号和跨包引用
```

### 6.3 最优先解决的 3 个问题

1. **文档**——没有文档的框架在 2026 年等于不存在。不管你架构多优雅。
2. **Consumer smoke test**——每次 push 都在赌 CI 是否绿，浪费大量时间。
3. **版本自动化**——防止 41 处手动更新的心智负担和遗漏风险。

---

## 七、最终结论

### 7.1 综合评分

| 维度           | 评分   | 理由                                                                        |
| -------------- | ------ | --------------------------------------------------------------------------- |
| 架构设计与创新 | 7.5/10 | DSD-native 有真正的差异化，但整体架构模式（Vite + SSG + adapter）对标 Astro |
| 代码质量       | 7/10   | 高于一般自研框架，types.ts 拆分和 @prop 集成仍有改进空间                    |
| 性能           | 8/10   | DSD 零 JS 渲染是性能杀手锏，模板缓存和微批处理是加分项                      |
| 安全性         | 6/10   | 基本 XSS 防护到位，但缺少 CSP/CSRF                                          |
| 开发者体验     | 5.5/10 | API 设计可接受，但文档严重缺失拖累分数                                      |
| 生态与可扩展性 | 5/10   | Adapter 协议设计好但钩子少，WC 兼容性是王牌但 SSR 限制大                    |
| 工程化         | 7.5/10 | ADR+SOP+CI 三件套齐全，fmt/lint/typecheck 门禁严格                          |

**综合评分：6.8/10**

> 一个架构优雅、代码质量中上、有真正技术差异化的自研框架。但严重缺文档，生态几乎是零，
> consumer smoke test 的 CI 问题拖累了开发和发布效率。如果文档和 CI 问题解决，评分
> 可达 7.5-8.0，足以进入 "可推荐试验" 的门槛。

### 7.2 是否值得继续投入？

**值得，但需要诚实面对全栈目标**。理由：

1. DSD-native 是真正的差异化赛道，没有其他 JS 框架在认真做这件事
2. WC 标准正在成熟（Safari 16.4+ 支持 DSD，Chrome 111+ 支持），浏览器生态在向 LessJS 的方向靠拢
3. 代码质量在自研框架中是上乘的——架构决策有 ADR 记录，实施有 SOP 规范
4. 17 个包的 monorepo 结构和分层清晰，说明作者有架构能力
5. AI 辅助开发正在改变"生态为王"的规则

**全栈目标 vs 现状**：框架愿景是 Island + Serverless + Edge Runtime + ORM + KV。当前完成度约 30%。

| 能力           | 现状                                       | 差距                           |
| -------------- | ------------------------------------------ | ------------------------------ |
| Island 架构    | ✅                                         | —                              |
| DSD 渲染       | ✅                                         | —                              |
| Hono API Route | ✅                                         | —                              |
| ISR            | ⚠️ MemoryIsrCache 框架已有，缺生产 handler | Deno Deploy/CF Workers adapter |
| Edge Runtime   | ⚠️ core 可在任何 runtime 运行              | 缺 KV adapter                  |
| ORM            | ❌                                         | 需 Drizzle 集成或代码生成      |
| KV             | ❌                                         | Deno KV / CF KV adapter        |

建议路线：v0.25 ISR handler → v0.26 KV 抽象 → v0.27 ORM → v0.28 Real-time。

### 7.3 定位建议（修正）

> ~~之前建议收缩到 SSG 框架。撤回。~~

修正后：

> **LessJS：The DSD-first full-stack Web Component framework.**
> 目标：Next.js 级全栈 + DSD-native 渲染 + 零框架锁定。当前 30%，第一支柱已坚实。

### 7.4 会推荐吗？（修正）

> "如果你在 2026 年想用 Web Components 构建全栈应用——LessJS 是目前唯一在 DSD 上认真走的框架。它有全栈野心（Hono → ISR → ORM + KV），但坦白说现在只完成了 30%。适合愿意参与早期框架建设的技术团队。"
