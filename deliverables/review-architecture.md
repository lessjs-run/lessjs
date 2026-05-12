# LessJS 系统架构审查报告

> **审查日期**: 2026-05-12  
> **审查人员**: 架构师-高见远  
> **项目版本**: v0.11.1  
> **审查范围**: 全部 9 个核心包

---

## 目录

1. [整体架构概览](#1-整体架构概览)
2. [各模块架构深度分析](#2-各模块架构深度分析)
3. [架构决策评估](#3-架构决策评估)
4. [发现的架构风险](#4-发现的架构风险)
5. [改进建议](#5-改进建议)

---

## 1. 整体架构概览

### 1.1 Monorepo 包结构

LessJS 采用 Deno workspace monorepo 架构，由 9 个独立包 + 1 个文档站点构成：

| 包 | 版本 | 职责 | 核心依赖 |
|---|---|---|---|
| `@lessjs/core` | 0.11.1 | 运行时核心：DSD 渲染、Island 体系、Navigation API、结构化日志 | parse5（唯一外部依赖） |
| `@lessjs/adapter-vite` | 0.1.0 | Vite 构建编排：路由扫描、Island Transform、SSG 管线 | vite, hono, esbuild |
| `@lessjs/app` | 0.3.0 | 统一入口 `lessjs()`，组合 core + content + i18n | 全部上层包 |
| `@lessjs/adapter-lit` | 0.8.0 | Lit SSR 适配器 + DSD Hydration Mixin | lit |
| `@lessjs/ui` | 0.7.0 | Web Component 组件库（8 个组件） | lit |
| `@lessjs/signal` | 0.6.2 | TC39 Signals 实现（polyfill + native） | 无依赖 |
| `@lessjs/content` | 0.3.1 | Blog + Nav + Sitemap 构建时插件 | marked, gray-matter |
| `@lessjs/i18n` | 0.1.0 | 国际化插件 | 无直接运行时依赖 |
| `@lessjs/rpc` | 0.6.1 | 轻量 RPC 控制器（fetch 包装） | 无依赖 |
| `@lessjs/create` | 0.7.0 | 项目脚手架 CLI | 无依赖 |

### 1.2 包依赖关系图

```
                    ┌──────────────────┐
                    │   @lessjs/app    │  ← 统一入口层
                    └───────┬──────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
  ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
  │               │ │              │ │              │
  │ adapter-vite  │ │  @lessjs/   │ │  @lessjs/    │
  │  (构建编排)    │ │  content     │ │  i18n        │
  │               │ │  (内容插件)   │ │  (国际化)     │
  └───────┬───────┘ └──────────────┘ └──────────────┘
          │
          ▼
  ┌───────────────┐     ┌──────────────┐
  │  @lessjs/core │◄────│ adapter-lit  │
  │  (运行时核心)  │     │ (Lit 适配器)  │
  └───────┬───────┘     └──────────────┘
          │                      │
          │              ┌───────┴───────┐
          │              │  @lessjs/ui   │
          │              │  (组件库)      │
          │              └───────────────┘
          │
  ┌───────┴───────┐  ┌──────────────┐  ┌──────────────┐
  │  @lessjs/     │  │  @lessjs/    │  │  @lessjs/    │
  │  signal       │  │  rpc         │  │  create      │
  │  (响应式信号)  │  │  (RPC工具)    │  │  (脚手架)     │
  └───────────────┘  └──────────────┘  └──────────────┘
```

**依赖方向说明**:
- **自上而下**: `app` → `adapter-vite` → `core`（核心渲染管线）
- **可选适配**: `adapter-lit` ← `core`（通过 `registerAdapter()` 插件接口）
- **水平层**: `signal`, `rpc`, `create` 为独立工具包，不依赖 core

### 1.3 SSG 渲染管线

LessJS 的 SSG 渲染管线分为三个 Build Phase，在单次 `viteBuild()` 调用中自动串联：

```
Phase 1: less() Vite Plugin (build orchestration)
  ├── Route Scanning (scanRoutes → RouteEntry[])
  ├── Island Scanning (scanIslands, scanPackageIslands)
  ├── Virtual Module Generation (virtual:less-hono-entry)
  ├── Vite Config + Workspace Alias Generation
  └── closeBundle() → triggers Phase 2 & 3

Phase 2: Client Island Build (buildClient)
  ├── Generate client entry (virtual:less-client-entry)
  ├── viteBuild() islands/**/*.ts → dist/client/islands/*.js
  └── Build Manifest (chunk sizes, budgets)

Phase 3: SSG Rendering (buildSSG)
  ├── Generate SSG entry (virtual:less-ssg-entry)
  ├── viteBuild(ssr:true, noExternal) → self-contained SSR bundle
  ├── Load bundle → import() Hono app
  ├── Dynamic Route Expansion (getStaticPaths + renderRoute)
  ├── Hono toSSG() → static HTML files
  ├── i18n Locale Expansion
  ├── Post-processing Pipeline:
  │   ├── injectClientScript()
  │   ├── injectViewTransitionMeta()
  │   ├── injectSpeculationRules()
  │   ├── injectCspMeta()
  │   ├── injectDsdPolyfill()
  │   └── PWA manifest + sw.js generation
  └── Sitemap generation
```

### 1.4 单页渲染数据流

```
Route module (LitElement / Web Component)
  │
  ├── render() → TemplateResult / string
  │
  ├── renderDSD(tagName, componentClass, props)
  │   ├── Instantiate component → set props
  │   ├── Call render() → get shadow DOM HTML
  │   ├── [Adapter] Lit TemplateResult → string interpolation
  │   ├── renderNestedCustomElements()  ← parse5 AST, bottom-up
  │   │   └── Recursively render child CEs → wrap in <template shadowrootmode>
  │   └── Wrap in DSD template
  │
  ├── Static HTML with nested DSD templates
  │
  ├── Hono toSSG() → write to dist/*.html
  │
  └── Browser:
      ├── Parse HTML → native DSD attachment (shadowrootmode)
      ├── Custom Elements upgrade → connectedCallback()
      ├── DSD Hydration (_dsdHydrated): shadow root already exists → return nothing
      ├── Event hydration: _hydrateEvents() → bind listeners
      └── Optional: Island chunk lazy loading
```

---

## 2. 各模块架构深度分析

### 2.1 @lessjs/core — 运行时核心

**文件**: `packages/core/src/` (12 个文件)

**架构亮点**:

1. **零依赖运行时**: core 被刻意设计为纯运行时库，除 parse5 外无任何外部依赖。不存在 `node:*` 导入，可在 Deno/Node/Bun/Edge 环境中运行。

2. **子路径导出粒度**: core 通过 JSR 子路径导出 11 个独立模块（`/render-dsd`、`/logger`、`/errors` 等），允许消费者按需导入，避免包级 barrel 文件引入全部依赖。

3. **Adapter 模式**: `registerAdapter()` / `getAdapter()` 构成插件接口，Lit 适配器通过该接口接入渲染管线，无需修改 core 代码：
   ```typescript
   // adapter-lit/ssr.ts
   registerAdapter({
     render: renderLitToString,
     isTemplate: isLitTemplateResult,
     extractStyles: extractLitStyles,
   });
   ```

4. **三层组件模型** (`types.ts`):
   - **Layer 1 — DSD Static**: 静态内容，无需 hydration，DSD 模板完整输出
   - **Layer 2 — DSD Interactive**: DSD 模板 + 事件 hydration（`hydrateEvents` + `WithDsdHydration` Mixin）
   - **Layer 3 — Pure Island**: 无 DSD，框架完全拥有 shadow root

5. **嵌套 DSD 递归**: `render-nested.ts` 使用 parse5 AST 实现 O(n·d) 复杂度的递归渲染，替代了早期的 O(n²) 正则方案。

**设计问题**:

- `render-nested.ts` 中动态 `import('./render-dsd.js')` 存在循环依赖风险
- `ssr-handler.ts` 实际上只是 `html-escape.ts` 的重导出 facade，增加了不必要的间接层

### 2.2 @lessjs/adapter-vite — 构建编排层

**文件**: `packages/adapter-vite/src/` (16 个文件)

**架构亮点**:

1. **Phase-in-closeBundle 架构**: ADR 0011 将三个 build phase 串联在 Vite 的 `closeBundle()` 钩子中，避免了外部编排脚本。这是一个巧妙的设计——单次 `viteBuild()` 触发全部构建。

2. **LessBuildContext 替代全局变量**: 原有的 `globalThis` 桥接和 `.less/` 临时文件已被统一的 `LessBuildContext` 对象取代（ADR 0010），通过显式参数传递，提高了可测试性和架构清晰度。

3. **JSR 远程解析**: `createCoreResolvePlugin()` 处理 JSR 远程包的虚拟模块加载，包括 TypeScript → JavaScript 的 esbuild 编译和 npm: specifier 重写——这是 Deno-first 框架必须解决的实际问题。

4. **可选包存根**: `optionalPackageStubsPlugin()` 在 SSG 构建时自动提供缺失包的空存根，使 `@lessjs/adapter-lit`、`@lessjs/content` 等成为可选依赖。

**设计问题**:

- `LessBuildContext` 是一个巨型状态对象（>30 个字段），承载了从 Phase 1 到 Phase 3 的所有元数据，缺少类型安全的字段访问约束
- `buildPlugin` 中 inline 了 Phase 2/3 的触发逻辑，使 `closeBundle` 钩子承担了过多职责
- JSR 核心解析插件中的 `jsrSourceCache` 使用模块级 `Map`，在 watch 模式下可能产生缓存泄漏

### 2.3 @lessjs/app — 统一入口

**文件**: `packages/app/src/index.ts`（单个文件，76 行）

**架构亮点**:

1. **薄组合层**: `lessjs()` 函数是纯组合逻辑，将 `less()` + `lessContent()` + `lessI18n()` 组合为单个调用，共享 `LessBuildContext` 实例。代码量极精简（~70 行），职责清晰。

2. **Opt-in 设计**: content 和 i18n 子模块通过 `options.content` 和 `options.i18n` 按需启用，不增加未使用特性的包体积。

### 2.4 @lessjs/adapter-lit — Lit 适配器

**文件**: `packages/adapter-lit/src/` (3 个文件)

**架构亮点**:

1. **无 @lit-labs/ssr 依赖**: 自制 TemplateResult 插值引擎，通过 `strings[]` + `values[]` 交错拼接生成干净 HTML，避免 Lit SSR 的 `<!--lit-part-->` 注释标记。

2. **SafeHtml/UnsafeHtml 品牌类型**: 使用 TypeScript 品牌类型（branded type）区分已转义和未转义的 HTML，在类型层面防止 XSS。

3. **WithDsdHydration Mixin**: 通过 TS Mixin 模式提供 DSD hydration 能力，组件可选择继承 `DsdLitElement` 或组合 `WithDsdHydration` 与其他基类。

4. **嵌套 CE 展开**: `unwrapDsdForNestedCe()` 检测渲染结果中的嵌套 Custom Element，展开 DSD 包装使子 CE 成为真实 DOM 节点，而不是父 shadow DOM 中的文本内容。

**设计问题**:

- Lit 内部实现依赖（`_$litType$`、`Symbol.for('lit-nothing')`、`_$litDirective$`）的检测逻辑脆弱，Lit 主版本升级可能破坏这些内部 API 的访问
- `detectBindingType()` 使用正则从 HTML 字符串片段推断绑定类型，而非 AST 解析，边界情况可能失效
- `uninstallLitAdapter()` 传入 `undefined` 作为 `RenderAdapter` 来清除注册，类型不安全

### 2.5 @lessjs/ui — 组件库

**文件**: `packages/ui/src/` (11 个文件，8 个组件)

**架构亮点**:

1. **DSD Hydration**: 所有 UI 组件均实现 DSD hydration，在 `render()` 中检测 `_dsdHydrated` 标志并在 DSD 预填充时返回 `nothing`。

2. **Form-Associated CE**: `less-button` 和 `less-input` 实现了 Form-Associated Custom Elements API，通过 `ElementInternals.setFormValue()` 参与原生表单提交。

3. **:state() CSS 伪类**: 利用 `ElementInternals.states` 实现自定义 CSS 状态（如 `:host(:state(disabled))`），这是 Progressive Enhancement 的体现。

4. **自注册 Islands**: `index.ts` 导出 `islands` 元数据数组，供 `scanPackageIslands()` 自动发现：
   ```typescript
   export const islands: PackageIslandMeta[] = [
     { tagName: 'less-theme-toggle', modulePath: '@lessjs/ui/less-theme-toggle', strategy: 'eager' }
   ];
   ```

**设计问题**:

- 8 个组件中存在 2 个 Island 组件（`less-theme-toggle`, `less-hero-ping`），其余为静态 DSD 组件。Island 的必要性需要评估——`less-hero-ping` 的交互复杂度是否值得引入客户端 JS chunk？
- 组件间缺乏一致性的事件系统，`hydrateEvents` 模式依赖字符串方法名，缺乏编译时检查

### 2.6 @lessjs/signal — TC39 Signals

**文件**: `packages/signals/src/index.ts`（单个文件，~800 行）

**架构亮点**:

1. **Polyfill + Native 双引擎**: 全局 `Signal` API 可用时自动使用原生实现，否则回退到内联 polyfill，符合渐进增强理念。

2. **三层架构**: Engine Layer（TC39 Signal.State/Computed）→ Framework Layer（`.value` 语法、`subscribe()`）→ Sugar Layer（`islandEffect()`、`channel()`、`themeSignal`）。

3. **islandEffect()**: 通过 `MutationObserver` + 定时器轮询组合检测 Island 断开，自动清理副作用，防止内存泄漏。

4. **跨 Island 通信**: `channel()` API 基于 `CustomEvent` 实现，遵循 "Islands 通过共享信号或 channel 事件通信" 的 L2 通信规则。

**设计问题**:

- 单一文件 ~800 行，包含 polyfill 的全部底层实现（`_createPolyfill()` 内联了完整的依赖图追踪算法），可维护性较差
- `islandEffect()` 的 `setInterval(5000)` 轮询是防御性设计，但每 5 秒检查一次连接状态有性能隐患
- 没有独立的测试导出入口，所有测试必须导入整个文件

### 2.7 @lessjs/content — 内容插件

**文件**: `packages/content/src/` (5 个源文件)

**架构亮点**:

1. **纯构建时插件**: Blog、Nav、Sitemap 完全在构建阶段执行，零运行时开销。

2. **虚拟模块数据流**: ADR 0018 确保路线组件从 `virtual:less-blog-data` 导入数据，而非从 content 模块状态直接读取，保持了纯函数可测试性。

3. **HMR 支持**: `configureServer()` 监听 Markdown 文件变化，调用 `invalidateModule()` 触发热更新。

### 2.8 @lessjs/i18n — 国际化

**文件**: `packages/i18n/src/` (4 个文件)

**架构亮点**:

1. **轻量设计**: 核心功能为 locale 展开 + 路径切换，代码极简。
2. **虚拟模块集成**: 与 content 类似，通过 `virtual:less-i18n-data` 提供数据。

### 2.9 @lessjs/rpc — RPC 工具

**文件**: `packages/rpc/src/index.ts`（单个文件）

**架构亮点**:

1. **零依赖**: 纯 Web API（fetch、AbortController），不依赖任何框架。
2. **Lit 兼容**: 实现 `ReactiveController` 接口，可无缝集成 Lit 生命周期。
3. **自动重试**: 支持指数退避和瞬态错误重试。

---

## 3. 架构决策评估

### 3.1 ADR 风格决策

项目中观察到一系列 ADR（架构决策记录）引用：

| ADR | 决策内容 | 评估 |
|-----|---------|------|
| **ADR 0008** | renderRoute()/getStaticPaths() 公共 API | 好——将渲染知识封装在 SSR bundle 内 |
| **ADR 0010** | ctx 取代 .less/ 临时文件 | 好——消除了文件系统 IPC，提升构建可靠性 |
| **ADR 0011** | closeBundle 内联 Phase 2/3 | 好——简化构建管道，但也增加了耦合 |
| **ADR 0013** | 直接导入 adapter-registry 而非 barrel | 好——避免引入不必要的依赖图 |
| **ADR 0014** | Hono toSSG + bundle APIs 处理动态路由 | 好——避免了直接正则处理路由模块的脆弱性 |
| **ADR 0016** | Core 子路径解析 | 好——细粒度导入控制 |
| **ADR 0018** | 虚拟模块替代模块状态 | **优秀**——纯函数设计，可测试性大幅提升 |

### 3.2 模块边界合理性

**合理的边界**:
- `core` vs `adapter-vite` 的分离：运行时 vs 构建时，职责清晰
- `adapter-lit` 作为可选适配器：Lit 框架可变性被隔离在 adapter 层
- `signal`, `rpc` 作为独立工具：与核心渲染管线正交

**边界模糊之处**:
- `adapter-vite/src/build-manifest.ts` 中的代码被标注为 `@lessjs/core` 但实际在 adapter-vite 包中
- `adapter-vite/src/hono-entry.ts` 生成的 Hono entry 代码耦合了 SSG 与 Dev Server 的入口逻辑
- `content` 和 `i18n` 都依赖 `@lessjs/adapter-vite/build-context`，形成了对构建编排包的依赖

### 3.3 扩展性设计

**良好扩展点**:
- `registerAdapter()` 可扩展到其他 Web Component 框架（FAST、Stencil 等）
- `island()` 的 `strategy` 枚举可扩展新的升级策略
- Virtual module pattern 可扩展到更多数据源（CMS API、数据库等）
- `LessRenderer` 接口实现了类似 Next.js layout 的渲染器嵌套

**扩展性限制**:
- 自定义渲染器（`_renderer.ts`）只能包装 HTML 字符串，无法参与属性传递或数据流控制
- 没有插件生命周期钩子在 SSR 渲染前后执行自定义逻辑
- Island chunk 的代码分割策略不可自定义（仅支持 tag-based 手动分块）

---

## 4. 发现的架构风险

### 4.1 高风险

| # | 风险 | 描述 | 影响 |
|---|------|------|------|
| R1 | **LessBuildContext 巨型对象** | 包含 30+ 字段，承载全部 Phase 元数据，无类型安全字段约束 | 修改任一 Phase 的数据流转需理解全部字段，增加维护成本 |
| R2 | **closeBundle 超载** | Phase 2/3 在 Vite 的 closeBundle 钩子中同步触发，违背单一职责 | 构建失败时难以定位 fault domain；Vite 升级可能改变 closeBundle 语义 |
| R3 | **Lit 内部 API 依赖** | `_$litType$`、`Symbol.for('lit-nothing')` 等内部 API 被用于模板检测 | Lit 主版本升级可能无声破坏 SSR 渲染 |
| R4 | **parse5 在 core 中作为强制依赖** | core 的唯一外部依赖，但 core 定位为"零依赖运行时" | 在非 HTML 场景（如 JSON API）中仍然打包了 HTML 解析器 |

### 4.2 中风险

| # | 风险 | 描述 | 影响 |
|---|------|------|------|
| R5 | **模块级状态泄漏** | JSR 源码缓存（`jsrSourceCache`）、polyfill 引擎状态等使用模块级变量 | Watch 模式下状态残留可能引发未定义行为 |
| R6 | **DSD 递归无限循环** | `renderNestedCustomElements()` 递归渲染嵌套 CE，若 CE 相互引用可能栈溢出 | 当前通过 `elementAlreadyHasDSD()` 防护，但深层嵌套性能仍不可预测 |
| R7 | **Hono toSSG 与 bundle API 并存** | 动态路由使用了两种渲染路径（toSSG + renderRoute/getStaticPaths） | 功能重复，增加维护成本；两路径的渲染行为可能产生差异 |
| R8 | **Island 策略可观测性不足** | Island upgrade 策略（eager/lazy/visible）在运行时无监控机制 | 生产环境下无法验证策略是否按预期生效 |

### 4.3 低风险

| # | 风险 | 描述 |
|---|------|------|
| R9 | **包版本号不统一** | core 0.11.1、app 0.3.0、signal 0.6.2 等版本号各自独立演进 |
| R10 | **debug 日志不可关闭** | `DEBUG` 编译时常量默认为 `true`，生产构建需注意保留 |
| R11 | **PWA sw.js 硬编码** | Service Worker 代码以字符串模板形式嵌入 `build-ssg.ts`，不可定制 |

---

## 5. 改进建议

### 5.1 架构级改进（高优先级）

#### S1: 重构 LessBuildContext 为类型安全的状态管理

**问题**: `LessBuildContext` 是扁平的巨型对象，字段赋值散布在多个 Plugin 中。

**建议**: 
- 将字段按 Phase 分组（`Phase1Meta`、`Phase2Meta`、`Phase3Meta`），Context 作为容器持有子对象
- 引入类型安全的 getter/setter 或 `Readonly<T>` 投影
- 考虑使用状态机模式确保 Phase 顺序执行的合法性

```typescript
class LessBuildContext {
  readonly phase1: Phase1Meta = new Phase1Meta();
  readonly phase2: Phase2Meta = new Phase2Meta();
  readonly phase3: Phase3Meta = new Phase3Meta();
}
```

#### S2: 将 closeBundle 驱动改为显式编排

**问题**: Phase 2/3 隐藏在 `closeBundle` 钩子中，构建流程不可见。

**建议**:
- 将 Phase 2/3 抽象为独立的 `BuildStep`，实现可观察的构建管道
- 或保留当前内联模式但增加错误隔离（每个 Phase 有独立 try-catch + 诊断日志）

#### S3: 减少对 Lit 内部 API 的依赖

**问题**: 对 `_$litType$` 等私有属性的访问构成了 Lit 版本兼容性风险。

**建议**:
- 与 Lit 团队合作推动官方 TemplateResult 检测 API
- 或创建适配器兼容性测试套件，在 CI 中针对多个 Lit 版本运行

### 5.2 模块边界优化（中优先级）

#### S4: 分离 parse5 依赖

**问题**: parse5 是 core 的唯一外部依赖，打破了"零依赖运行时"承诺。

**建议**:
- 将 `renderNestedCustomElements()` 移至独立包（如 `@lessjs/dsd-renderer`）
- core 保留接口定义，DSD 渲染器通过 adapter 接口注册

#### S5: 统一渲染路径

**问题**: 动态路由同时使用了 Hono toSSG 和 bundle renderRoute/getStaticPaths API。

**建议**:
- 统一使用 bundle API 路径，将 Hono toSSG 降级为仅处理静态路由
- 或反之：将 renderRoute/getStaticPaths 功能合并到 Hono toSSG 中

### 5.3 可观测性增强（低优先级）

#### S6: Island 升级监控

- 在 Island 注册时注入性能标记（Performance Mark）
- 输出 Island 升级延迟报告到 Build Manifest

#### S7: PWA sw.js 可配置化

- 将 Service Worker 逻辑拆分为可导入模块
- 支持用户自定义缓存策略注入

### 5.4 技术债务清理

| # | 项 | 位置 | 建议 |
|---|-----|------|------|
| T1 | `ssr-handler.ts` 仅重导出 | `core/src/ssr-handler.ts` | 删除文件，消费者直接导入 `html-escape` |
| T2 | `adapter-vite/src/build-manifest.ts` 代码标注与包名不一致 | 文件头部标注 `@lessjs/core` | 修正为 `@lessjs/adapter-vite` |
| T3 | `render-nested.ts` 循环导入 | 动态 `import('./render-dsd.js')` | 重构模块分层 |
| T4 | `signals/src/index.ts` 单文件过大 | ~800 行 | 拆分为 engine/polyfill/framework 三个模块 |

---

## 总结

LessJS 的架构设计体现了清晰的分层思想和 Web Standards First 的理念。核心亮点包括：

1. **运行时/构建时严格分离**：core 作为零依赖运行时与 adapter-vite 构建编排层的边界清晰
2. **ADR 驱动的演进**：每个重大架构变更都有记录可追溯，代码中 ADR 引用频繁
3. **Web Platform First**：优先使用 Shadow DOM、Custom Elements v1、Form-Associated CE、Navigation API、View Transitions API、Speculation Rules API、URLPattern 等原生能力
4. **渐进增强的三层模型**：DSD Static → DSD Interactive → Pure Island 的组件模型完美匹配了"HTML 先于 JavaScript"的理念
5. **虚拟模块数据流**：ADR 0018 的虚拟模块模式替代模块状态，是构建时插件的最佳实践

主要改进方向是：控制 LessBuildContext 的复杂度、减少对框架内部 API 的依赖、优化构建管线的可观测性。
