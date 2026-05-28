# LessJS v0.24.1 全维度架构与战略评估报告

- **评估对象**: LessJS monorepo 当前工作区
- **评估基线**: v0.24.1 JSX + Signal Component Model
- **评估维度**: 代码质量、功能鲁棒性、解耦性、内聚性、框架架构、新旧模型对比、市场定位、未来发展、核心护城河与深化方向
- **生成位置**: `docs/conversation/20260629`
- **关联报告**: `docs/conversation/20260629/lessjs-v0.24.1-audit.md`

## 1. 总体判断

LessJS 当前已经从“Web Components 工具链集合”演进到一个具备明确战略中心的框架：**DSD-first Web Components application framework**。它的核心价值不在于再造一个通用 SSR 框架，也不在于和 Lit 在 tagged template 体验上竞争，而在于把 Web Components 拉进可审计、可预渲染、可发布、可验证的 SSR/SSG 工程体系中。

v0.24.1 的 JSX + Signal 迁移方向是正确的：它把 LessJS 从自研模板 DSL 的维护泥潭中拉出，把开发体验对齐 TypeScript/JSX 主流范式，并把差异化重新聚焦到 DSD 管线、Signal reactivity、Web Components compatibility、Registry/Hub evidence 这些真正能形成护城河的地方。

但当前状态仍处在“架构方向正确、工程收敛未完成”的阶段。最主要风险不是技术路线错误，而是 **新旧模型双轨并存、文档事实漂移、release gate 当前失败、关键 CSR renderer 测试不足**。这些问题如果不尽快收敛，会削弱 v0.24.1 迁移带来的架构收益。

### 核心结论

| 维度         | 当前评级     | 结论                                                                                            |
| ------------ | ------------ | ----------------------------------------------------------------------------------------------- |
| 代码质量     | B            | 核心模块分层清晰，但 legacy runtime 与新模型并存导致认知负担上升                                |
| 功能鲁棒性   | B-           | build/test/graph/typecheck 基础强，但 lint/fmt 当前失败，CSR 渲染关键测试不足                   |
| 解耦性       | B+           | 18 包分层与 graph gate 是强项，但 root publish task、legacy path、core-signal 边界仍需收敛      |
| 内聚性       | B            | `core`、`runtime`、`adapter-vite` 职责总体清晰，但 `template.ts`/`prop.ts` 历史包袱破坏模型纯度 |
| 框架架构     | A-           | DSD-first + Ocean/Island + package graph gate 是非常清晰的技术路线                              |
| 新旧模型迁移 | B-           | JSX 方向正确，但“已删除”与“仍兼容”的叙事不一致必须修正                                          |
| 市场定位     | B+           | 小众但真实：Web Components + DSD + SSR/SSG + Signals 的交集足够独特                             |
| 未来发展     | A-           | Roadmap 具备 v0.25/v1.0 演化路径，重点应放在 evidence、Hub、compatibility、Edge deployment      |
| 护城河       | B+ -> A 潜力 | 护城河真实但窄，需要通过 Registry + DSD portability + compatibility evidence 深挖               |

## 2. 代码质量评估

### 2.1 优点

- **核心路径短而明确**: `jsx-runtime.ts`、`jsx-render-string.ts`、`jsx-render-dom.ts` 形成了清晰的 JSX pipeline。VNode 模型足够小，避免引入 React/Solid 式完整 VDOM diff 或 synthetic event 复杂度。
- **运行时 API 方向收敛**: `@lessjs/runtime` 已成为组件作者 facade，`@lessjs/core` 保持 runtime kernel 定位，符合 ADR-0050 的分层原则。
- **工程 gate 意识强**: `graph:check`、`dsd:check-report`、consumer smoke、publish order 验证说明 LessJS 已经把发布一致性当成架构问题，而不是单纯 CI 配置。
- **Web 标准优先**: `DsdElement extends HTMLElement`、Declarative Shadow DOM、CSSStyleSheet abstraction、CSS Parts、native `addEventListener` 都是低 lock-in 的技术选择。

### 2.2 问题

- **legacy runtime 仍在核心代码内**: `packages/core/src/template.ts` 仍完整保留 `html`、`unsafeHTML`、`classMap`、`when`、`choose`、`repeat`、`ref` 等旧 DSL 实现。即使 root barrel 不再 re-export，代码层仍是双模型。
- **`prop.ts` 同时承载旧 `@prop()` 与新 `static props`**: 文件内部注释称 `@prop()` removed，但仍存在 legacy prop runtime。短期兼容可理解，长期会让“新模型是什么”变得模糊。
- **文档和代码事实不一致**: release notes/API reference 说旧模型完全删除，roadmap 又说 non-goal 是不删除 `html`，README 仍教学旧 API。代码质量不仅是源码质量，也包括事实一致性。
- **测试重心尚未迁移**: 旧 template tests 很多，新 `renderToDOM()` 的关键测试不足。这会导致代码看似完成，但长期回归保护不够。

### 2.3 建议

1. **把 legacy template 明确降级为 legacy island**:
   - 短期：改文档为 “removed from public root API, kept internally/legacy”。
   - 中期：移动到 `@lessjs/core/html-legacy` 或独立 `legacy-template.ts`，并在 import gate 中限制使用范围。
   - 长期：v1.0 前删除或冻结为 compat-only。
2. **按模型拆分测试目录**:
   - `__tests__/jsx-*` 覆盖新模型。
   - `__tests__/legacy-template-*` 覆盖兼容层。
   - release dashboard 分开展示新模型覆盖率与 legacy 覆盖率。
3. **把 renderer helper 抽成小单元**:
   - `unwrapSignalLike()`、`serializeAttrValue()`、`setDomPropOrAttr()`、`createElementWithNamespace()` 可单测，降低 `jsx-render-dom.ts` 的隐性复杂度。

## 3. 功能鲁棒性评估

### 3.1 已经可靠的部分

- **构建链路**: `deno task build` 已能生成 `www/dist`，包含 472 HTML files 与 24 island bundles。
- **测试基础**: `deno task test` 当前 939 tests 通过。
- **类型检查**: `deno task typecheck` 通过，说明核心包 entry、adapter、www config 的类型层面可用。
- **依赖图**: `deno task graph:check` 通过，验证 18 packages、无 circular deps、publish order consistent。
- **DSD gate**: `deno task dsd:check-report` 通过，且第三方 Shoelace SSR boundary 被分类为 known/excluded。

### 3.2 当前鲁棒性缺口

- **release gate 不完整通过**: `deno task lint` 和 `deno task fmt:check` 当前失败。这是 P0 级问题，因为它影响“可发布性”而非普通代码风格。
- **CSR renderer 回归保护不足**: `renderToDOM()` 是 v0.24.1 解决 `[object Object]`、theme/search失效、SVG 消失的核心，但缺少直接测试覆盖。
- **Signal unwrap 不完整**: children unwrap 已做，但 props/attrs/style/SVG attrs 中的 Signal 仍有风险。
- **third-party DSD 仍有 known errors**: 131 DSD errors 被 gate 分类放行，但这意味着 registry/third-party compatibility 仍是工程风险区。

### 3.3 鲁棒性改进路线

| 优先级 | 动作                          | 目标                                                                 |
| ------ | ----------------------------- | -------------------------------------------------------------------- |
| P0     | 修复 lint/fmt gate            | 恢复 release readiness 基线                                          |
| P0     | 修正文档与 release notes      | 防止错误发布叙事误导用户和未来维护者                                 |
| P1     | 新增 `jsx-render-dom.test.ts` | 覆盖 event、AbortSignal、SVG namespace、Fragment、ref、Signal unwrap |
| P1     | 新增 dist scan gate           | 区分文档提及 `[object Object]` 与真实渲染污染                        |
| P1     | DSD report 分类收紧           | 每个 v0.x 减少 known/excluded error budget                           |
| P2     | bundle budget 分级            | core path hard budget，demo/showcase soft budget                     |

## 4. 解耦性评估

### 4.1 已形成的优良边界

LessJS 的分层已经从概念进入代码与 CI：

```text
protocols / contracts
runtime kernel
implementation packages
build adapters
product facades
tools and ecosystem
```

这套分层最大的价值是：**把“谁拥有哪个概念”变成可检查的工程事实**。

- `@lessjs/core`: runtime kernel，拥有 `DsdElement`、DSD rendering、island runtime、navigation、logger、errors、JSX runtime。
- `@lessjs/signals`: signal facade over `alien-signals`，LessJS 拥有 `.value` / `subscribe()` contract，而不是底层 reactive algorithm。
- `@lessjs/protocols`: shared build contracts，防止 content/i18n 依赖 adapter-vite internals。
- `@lessjs/adapter-vite`: Vite-specific build、SSG phases、generated entries、package resolution。
- `@lessjs/runtime`: component authoring facade。
- `@lessjs/app`: configuration facade。

### 4.2 解耦风险

- **`core` 对 `signals` 的依赖是必要但敏感**: v0.24.1 为 DsdElement VNode signal tracking 引入 `@lessjs/signals` -> `@lessjs/core` 依赖。这符合功能需求，但改变了 ADR-0050 中 “core 不拥有 engine” 的边界。当前可接受的前提是 `core` 只依赖 LessJS signal facade，不直接依赖 `alien-signals`。
- **root publish task 与 workflow 不一致**: GitHub workflow 覆盖 18 packages，但 root `deno task publish` 缺少若干包。这是发布层解耦与一致性问题。
- **legacy template 仍在 core 内**: 旧 DSL 没有独立到 legacy package，会继续污染 core 的概念边界。

### 4.3 建议

- 保留 `core -> signals facade`，但禁止 `core -> alien-signals`。
- 将 template legacy path 从 “core public concept” 降级为 “compat/internal module”。
- 把 root publish task 与 workflow 统一，或者让 root publish task 只打印 “use GitHub workflow”。
- 对每个 package 维护 `owner / allowed deps / forbidden deps` 表，并由 graph checker 验证。

## 5. 内聚性评估

### 5.1 高内聚模块

- **JSX runtime**: `jsx()`、`jsxs()`、`jsxDEV()`、`Fragment` 的职责非常单一：创建 VNode。
- **String renderer**: `renderToString()` 专注 SSR/SSG HTML string，跳过 events/ref，符合服务端边界。
- **DOM renderer**: `renderToDOM()` 专注 CSR/hydration DOM nodes，负责 event/ref/SVG namespace。
- **adapter-vite build phases**: client build 与 SSG build 分开，职责清晰。
- **package graph checker**: 把版本、依赖、publish order 统一为可执行 gate，内聚度高。

### 5.2 内聚性下降点

- **`DsdElement` 同时支持 string、TemplateResult、VNode**: 这让它成为三代模型的交汇点。短期是迁移必需，长期会让生命周期与渲染路径复杂化。
- **`template.ts` 既是 legacy runtime 又是 `isSignalLike` 来源**: 新模型 renderer 还从 `template.ts` import `isSignalLike`，这在概念上不干净。Signal-like 判断应迁移到更中性的模块，例如 `signal-like.ts`。
- **`prop.ts` 同时包含 legacy prop 与 static props**: 建议拆为 `prop-legacy.ts`、`static-props.ts`、`signal-unwrapping.ts`。

### 5.3 建议

1. **把跨模型通用能力抽离**:
   - `isSignalLike` -> `signal-like.ts`
   - `unwrap` -> `unwrap.ts` 或 `signals-interop.ts`
   - `style serialization` -> renderer utility
2. **把 `DsdElement` 渲染策略表显式化**:
   - `renderVNodeResult()`
   - `renderTemplateResult()`
   - `renderStringResult()`
   - 每条路径独立测试。
3. **v0.25 前确立 legacy sunset plan**:
   - 只有 migration docs 和 legacy tests 可引用旧模型。

## 6. 框架架构评估

### 6.1 架构中心

LessJS 的架构中心可以概括为：

> Static-first + Declarative Shadow DOM + Web Components + explicit island boundaries + package evidence gates.

这比“一个更轻的 Astro”或“一个不用 Lit 的 WC 框架”更准确。LessJS 真正想解决的问题是：**Web Components 如何进入现代 SSR/SSG 框架工程体系**。

### 6.2 Ocean-Island 模型

LessJS 的 Ocean-Island 模型是当前最重要的架构资产之一：

- **Ocean**: 页面大部分区域由 DSD-rendered Web Components 组成，首屏无需框架 runtime 即可显示 shadow DOM 内容。
- **Island**: 真正需要交互、状态、第三方 runtime 的局部区域，通过显式策略加载。

它的优势是：

- 首屏 HTML 更接近最终 DOM。
- Web Components 的 shadow DOM 不再只能 CSR。
- 交互成本可局部化。
- 与多框架 islands 兼容。

它的风险是：

- 第三方 WC 的 shadow DOM 内部结构不可预测。
- DSD 预渲染需要兼容性证据，而不是盲目执行。
- 对用户来说，Ocean/Island/DSD/Registry/compat tier 这些概念需要优秀文档降低学习成本。

### 6.3 JSX + Signal 模型在架构中的位置

JSX + Signal 不是 LessJS 的护城河本体，而是降低护城河使用门槛的 DX 层。

旧 DSL 让 LessJS 把工程资源投入到模板语法维护；新模型把模板层降为主流基础设施，让核心团队重新聚焦到：

- DSD pipeline
- Signal-driven local reactivity
- renderer parity
- third-party WC compatibility
- registry evidence
- deployment reliability

因此 v0.24.1 是“战略收敛版本”，不是单纯语法迁移版本。

## 7. 新旧模型对比

### 7.1 旧模型: `html` tagged template + `@prop()`

| 方面     | 优点                           | 问题                                        |
| -------- | ------------------------------ | ------------------------------------------- |
| 模板表达 | 运行时简单，接近 Lit 习惯      | 自研 DSL，维护成本高，类型检查弱            |
| 控制流   | `when/choose/repeat` 可封装    | 与 JS 原生控制流割裂，用户需学 LessJS 指令  |
| 属性声明 | `@prop()` 简洁                 | decorator 需要编译/语义负担，不符合最小模型 |
| 事件     | `@click` 模板语法直观          | SSR/CSR 绑定路径复杂，和 JSX 主流习惯不一致 |
| 安全     | template runtime 可统一 escape | `unsafeHTML` 与字符串插值仍需教育成本       |
| 市场认知 | Lit 用户容易理解               | 容易被认为是 “小 Lit” 或 “重复造轮子”       |

### 7.2 新模型: JSX + static props + Signal

| 方面     | 优点                                   | 风险                                             |
| -------- | -------------------------------------- | ------------------------------------------------ |
| 模板表达 | TS/JSX 主流，类型检查好                | 需要保证 JSX runtime 与 SSR/CSR parity           |
| 控制流   | 原生 JS ternary/map/switch             | 用户需理解 JSX 与 Web Component attrs 的差异     |
| 属性声明 | `static props` 简单、无 decorator      | 类型推导和 runtime sync 需要足够测试             |
| 事件     | `onClick` -> native `addEventListener` | event name mapping、AbortSignal cleanup 必须稳定 |
| Signal   | `{signal}` auto unwrap 提升 DX         | 当前 attrs/style unwrap 不完整                   |
| 市场认知 | 不再与 Lit 在模板 DSL 上正面竞争       | 需要强调 LessJS 不是 React-like framework        |

### 7.3 迁移收益

- **降低心智成本**: 用户不再学习 `classMap/when/choose/repeat/ref`。
- **提高类型安全**: JSX 与 TS 工具链天然集成。
- **减少框架自研表面积**: LessJS 不再维护一套模板 DSL 作为核心差异化。
- **强化战略定位**: 差异化回到 DSD + Web Components + Signal。

### 7.4 迁移成本

- **双模型过渡复杂**: 旧 docs、tests、runtime path 需要严格隔离。
- **renderer parity 压力上升**: JSX runtime 必须同时保证 SSR string 与 CSR DOM 行为一致。
- **JSX Web Component attrs 教育成本**: `className` vs `class`、camelCase vs kebab-case、SVG attrs 等都要明确。

## 8. 市场定位分析

### 8.1 正确定位

LessJS 不应定位为：

- 更轻的 Next.js
- 更小的 Astro
- 更现代的 Lit
- 通用 SSR 框架
- 通用全栈 Web 框架

LessJS 更准确的定位是：

> 面向 Web Components 的 DSD-first SSR/SSG 应用框架与生态验证系统。

或者更市场化地说：

> The SSR/SSG framework for real Web Components and Declarative Shadow DOM.

### 8.2 对比竞品

| 对手    | 强项                           | LessJS 不应硬碰                      | LessJS 应强调                                   |
| ------- | ------------------------------ | ------------------------------------ | ----------------------------------------------- |
| Astro   | 内容站、islands、多框架成熟    | 通用 static site / content framework | Web Components 是一等公民，DSD shadow DOM SSR   |
| Fresh   | Deno/edge 全栈、Preact islands | Deno full-stack DX                   | WC-native + DSD + framework-agnostic components |
| Next.js | React 生态、RSC、商业成熟      | React app platform                   | 跨框架 Web Components、零 React runtime 首屏    |
| Lit     | WC authoring 心智成熟          | tagged template DX                   | Lit 不原生解决 DSD-first app framework          |
| Enhance | Web standards / HTML-first     | HTML-first server app                | DSD + Registry + compatibility evidence         |

### 8.3 目标用户

当前最适合 LessJS 的用户不是大众 React 开发者，而是：

- 已经相信 Web Components 的团队。
- 需要 Shadow DOM 样式隔离但又需要 SSR/SSG 的团队。
- 做设计系统/组件库/文档站/组件 registry 的团队。
- 需要让组件跨 React/Vue/Angular/Svelte 使用的团队。
- 对 Deno/JSR/Web Standards 有偏好的小团队或独立开发者。

### 8.4 市场挑战

- Web Components 市场本身比 React/Next 市场小。
- DSD 是正确标准，但大众认知低。
- 第三方 WC 质量不一，SSR compatibility 很难完全自动化。
- 如果 docs 不稳定，用户会认为框架实验性太强。

### 8.5 市场机会

- 设计系统团队对 Shadow DOM 和跨框架分发有真实痛点。
- AI/codegen 时代，标准 Web Components 的可移植性会更有价值。
- Registry + compatibility evidence 可以成为 npm/jsr 之外的“可信组件入口”。
- 如果 LessJS 能让 Shoelace/Material Web 等组件“可预渲染、有证据、有 fallback”，会形成非常清晰的 niche leadership。

## 9. 未来发展路线

### 9.1 0-1 个月: v0.24.1 收敛

目标：把 JSX + Signal 迁移从“能跑”变成“可信”。

- 修复 lint/fmt P0。
- 修正所有 docs/release/current line。
- 明确旧模型状态：public removed / legacy kept / deprecation timeline。
- 补 `renderToDOM` direct tests。
- 补 Signal props/style/SVG attrs unwrap。
- 建立 `[object Object]` dist gate。
- 统一 root publish task 与 workflow。

### 9.2 1-3 个月: v0.25 Ecosystem Hardening

目标：把 Hub 从 demo index 变成可信证据系统。

- 至少 10 个真实 WC packages indexed。
- 每个 package 有 compatibility badge：SSR-capable / client-only / rejected / snapshot-verified。
- DSD report 提供可解释 error taxonomy。
- `less add` 输出 package admission plan。
- 对 Shoelace 这类主流 WC 形成专门 adapter/fallback strategy。
- Registry pages 明确哪些组件是 DSD pre-rendered，哪些是 client-only。

### 9.3 3-6 个月: Edge/Deployment 路线

目标：把 LessJS 的 static-first 优势延伸到真实部署环境。

- Cloudflare Pages / Workers cache policy 明文化。
- ISR handler 与 KV cache adapter 形成最小可用路径。
- Deno Deploy parity。
- `www/dist` 产物预算与 cache headers gate。
- 文档给出 static-only、edge ISR、client-only fallback 三种部署模式。

### 9.4 6-12 个月: v1.0 Stable Engine 前置条件

目标：冻结真正有护城河的协议，而不是冻结历史包袱。

v1.0 应冻结：

- `DsdElement` lifecycle contract。
- `renderDSD()` / `renderDSDStream()` output contract。
- VNode shape 与 JSX runtime contract。
- manifest / compatibility schema。
- `dsd-report.json` schema。
- `less validate-manifest` / `less add` behavior。
- client-only fallback semantics。

v1.0 不应承诺：

- 任意 Web Component 都能 SSR。
- DOM simulation 与浏览器完全等价。
- 自动安全执行任意第三方包。
- 成熟 marketplace。

## 10. 核心护城河

### 10.1 护城河一: DSD-first Web Components SSR/SSG pipeline

这是 LessJS 最真实的技术壁垒。

没有 DSD，Web Components 的 Shadow DOM 首屏基本只能等待 JS upgrade。DSD 让 shadow DOM 成为 HTML 输出的一部分。这不是框架优化，而是浏览器标准路径。

深化方向：

- 完善 DSD renderer 的 error taxonomy。
- 对主流 WC library 建立 compatibility cookbook。
- 提供 DSD snapshot / fallback / client-only 三层策略。
- 让 DSD output 可被 Astro/Next/Nuxt 等外部框架消费。

### 10.2 护城河二: Registry + compatibility evidence

单独做 DSD renderer 容易被视为技术 demo。把 renderer 与 Registry/Hub 结合，才会变成生态基础设施。

深化方向：

- 每个包都有机器可读 compatibility report。
- 每个组件有 SSR/DSD/client-only 证据。
- `less add` 不只是安装，而是 admission planning。
- Hub 成为 “哪些 Web Components 能安全用于 SSR/SSG” 的事实来源。

### 10.3 护城河三: JSX + Signal 的低摩擦 authoring layer

JSX + Signal 本身不是独占技术，但它能显著降低 DSD-first WC 的使用门槛。

深化方向：

- 完整 Signal unwrap parity。
- static props 类型推导与 runtime sync 可靠。
- 更好的 JSX IntrinsicElements typing。
- Web Component attrs/events typing 从 CEM 自动生成。

### 10.4 护城河四: Deterministic release gates

LessJS 已经把 package graph、publish order、DSD report、consumer smoke 变成架构 gate。这是小框架可信度的重要来源。

深化方向：

- docs consistency gate。
- generated consumer from published JSR gate。
- package compatibility regression gate。
- browser snapshot gate。
- cache header/build budget gate。

### 10.5 护城河五: Web Standards substrate

LessJS 选择 Deno/JSR/Web Platform/Hono/Vite/DSD/CSSStyleSheet，而不是自建全套 runtime。这让它更轻、更可解释，也更适合小团队维护。

深化方向：

- 避免引入框架级 runtime lock-in。
- 所有能力优先用 standards 表达。
- 对非标准或实验能力保留 adapter/fallback 边界。

## 11. 最大战略风险

### 11.1 风险一: 小众市场不等于无市场，但需要极清晰定位

Web Components + DSD + SSR 的交集很小。LessJS 不能用大众框架指标衡量早期增长，应以“是否解决 WC 重度用户的真实痛点”衡量。

建议 KPI：

- indexed real WC packages 数量。
- DSD pre-render success ratio。
- client-only fallback correctness。
- `less add` 成功率。
- generated project first build success。

### 11.2 风险二: 文档漂移会摧毁信任

当前 docs 中 v0.23/v0.24.0/v0.24.1、新旧模型、删除/兼容叙事混杂。对于一个还在建立信任的小框架，这是高风险。

建议：

- 每次 release 前强制 docs truth table。
- `current version` 只允许一个来源。
- migration guide 之外禁止旧模型作为推荐写法。

### 11.3 风险三: 同时做 framework、renderer、registry、hub 容易摊薄资源

LessJS 的三支柱很有想象力，但小团队必须排序：

1. DSD renderer correctness。
2. JSX + Signal authoring DX。
3. Compatibility evidence。
4. Hub discovery。
5. Edge full-stack。

不要在 renderer 和 docs 没稳时过早扩展全栈能力。

### 11.4 风险四: 第三方 WC SSR 是长尾问题

Shoelace 类 known errors 表明：第三方 WC 的 shadow DOM 不可预测，自动 SSR 不可能 100% 成功。

正确策略不是承诺全自动，而是：

- classify
- report
- fallback
- snapshot
- trust badge

## 12. 建议的战略表述

### 12.1 对开发者的一句话

> LessJS lets Web Components render like real SSR components, using Declarative Shadow DOM, JSX, Signals, and verified compatibility reports.

### 12.2 中文表述

> LessJS 是面向 Web Components 的 DSD-first SSR/SSG 框架：用 Declarative Shadow DOM 预渲染真正的 Shadow DOM，用 JSX + Signal 提供现代组件开发体验，用 Registry/Hub 给第三方组件建立可验证的兼容性证据。

### 12.3 不建议使用的表述

- “Next.js 替代品”
- “Astro 替代品”
- “更好的 Lit”
- “任意 Web Components 自动 SSR”
- “零 JS 全栈框架”

这些都会把 LessJS 拉进错误赛道。

## 13. 最优先行动清单

### 13.1 本周必须完成

- 修复 `deno task lint`。
- 修复 `deno task fmt:check`。
- 修正 release notes 中 “old API removed entirely” 的不准确信息。
- README/package README/官网 current line 全部同步到 v0.24.1。
- 明确 legacy template 的真实状态与 sunset plan。

### 13.2 v0.24.1 patch 必须完成

- Signal unwrap 覆盖 attrs/style/SVG attrs。
- `renderToDOM` direct tests。
- dist `[object Object]` contextual gate。
- root publish task 与 workflow 对齐。
- `isSignalLike` 从 `template.ts` 抽离到中性模块。

### 13.3 v0.25 必须完成

- Hub compatibility badge。
- 至少 10 个真实 WC packages。
- Shoelace fallback strategy。
- `less add` admission plan。
- DSD report schema 文档化。

### 13.4 v1.0 前必须完成

- legacy template sunset。
- DsdElement lifecycle freeze。
- VNode shape freeze。
- manifest schema freeze。
- compatibility taxonomy freeze。
- published consumer smoke 作为强制 release gate。

## 14. 最终评价

LessJS 的方向是成立的，而且比很多早期框架更难得的一点是：它已经找到了自己不该竞争的领域。它不应该和 Lit 拼 tagged template，不应该和 Next 拼 React platform，不应该和 Astro 拼通用内容站能力。它应该把全部力量集中在一个小但真实的交集上：

> Web Components + DSD + SSR/SSG + Signals + compatibility evidence.

v0.24.1 的 JSX + Signal 迁移是一次必要的战略减法。它减少了模板 DSL 的维护负担，也让 LessJS 的差异化从“语法”回到“渲染能力与生态证据”。

但战略减法必须配套工程收敛。当前最危险的不是实现不够多，而是旧模型没有完全隔离、新模型测试不足、文档和代码事实不一致。只要先把这些 P0/P1 收敛，LessJS 就有机会从一个“很聪明的个人框架”升级为一个“小众但可信的 Web Components SSR 基础设施”。
