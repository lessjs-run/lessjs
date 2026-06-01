# LessJS v0.27.0 技术审计 — 架构师专项报告

> 审计人：架构师 (Bob)  
> 审计日期：2026-06-01  
> 审计范围：架构设计 + 模块设计  
> 仓库路径：`C:\Users\Administrator\WorkBuddy\Claw\lessjs-main`

---

## 1. 核心架构流程图 + 设计亮点

### 1.1 整体架构拓扑

```
                        ┌─────────────────────────────────────────────┐
                        │            @lessjs/app (Umbrella)           │
                        │  lessjs() → 统一入口, 组合所有子插件          │
                        └───────┬──────────────┬──────────────┬───────┘
                                │              │              │
                    ┌───────────▼──┐  ┌────────▼───────┐  ┌──▼──────────┐
                    │ @lessjs/     │  │ @lessjs/       │  │ @lessjs/    │
                    │ adapter-vite │  │ content        │  │ i18n        │
                    │ (Vite Plugin)│  │ (Blog+Nav+Site)│  │ (多语言)     │
                    └──────┬───────┘  └───────┬────────┘  └──────┬──────┘
                           │                  │                   │
                    ┌──────▼──────────────────▼───────────────────▼──────┐
                    │        @lessjs/protocols (共享契约层)               │
                    │   LessBuildContextLike / LessPluginMeta            │
                    └──────────────────────┬────────────────────────────┘
                                           │
              ┌────────────────────────────┼─────────────────────────────┐
              │                            │                             │
    ┌─────────▼─────────┐    ┌─────────────▼──────────────┐  ┌─────────▼─────────┐
    │  @lessjs/core     │    │  SSR Adapter 层             │  │  @lessjs/         │
    │  (纯运行时核心)    │    │  ┌──────┐┌──────┐┌──────┐  │  │  style-sheet      │
    │  - renderDsd      │◄───┤  │ Lit  ││Vanilla││React│  │  │  (跨环境CSS抽象)  │
    │  - renderDsdTree  │    │  └──────┘└──────┘└──────┘  │  └───────────────────┘
    │  - DsdElement     │    └────────────────────────────┘
    │  - jsx-runtime    │
    │  - adapter-registry│
    │  - island/registry│
    └───────────────────┘
```

### 1.2 构建三阶段流水线（Phase Pipeline）

```
Phase 1: Route Scanning (buildStart)
  scanRoutes() → scanIslands() → scanIslandMeta() → scanPackageManifests()
  → detectAndClassifyCemPackages() → buildEntryDescriptor()
  → generateHonoEntryCode() → ctx.phase1 完成

Phase 2: Client Island Build (Vite Client Build)
  ctx.phase2.clientEntryCode 生成
  → Vite 客户端构建 (island 模块注册)

Phase 3: SSG Rendering (Vite SSR Build)
  ctx.phase3.ssgEntryCode 生成
  → viteBuild(ssr:true, noExternal)
  → renderRoute() + getStaticPaths()
  → 静态 HTML 输出
```

**Phase Token 编译期保障**：`LessBuildContext.completePhase1/2/3()` 使用 branded type (`Phase1Token` 等) 确保阶段调用顺序在编译期校验。

### 1.3 SSR 渲染核心流程

```
用户请求 → Hono 路由匹配
  → jsx(tag, params) 创建 VNode
  → Renderer.wrap(node, ctx) (可选的 _renderer.ts 包裹)
  → __renderAppShell(node, path)
      → renderDsdTree(vnode)
          ├── 普通 HTML 元素 → serializeAttrs + 递归子节点
          ├── 注册的 Custom Element → renderDsd(tag, Class, props)
          │   ├── instantiateComponent → injectProps → instance.render()
          │   ├── string 结果 → 直接输出
          │   ├── VNode 结果 → 递归 renderDsdTree
          │   └── TemplateResult → adapter.render() (Lit/React/Vanilla)
          └── Fragment/Show/For → 特殊控制流处理
      → renderDsd("less-layout", {nav, locale, ...})
      → layoutResult.html.replace("</less-layout>", pageHtml)
  → wrapInDocument(content, {title, lang, headExtras, cspNonce})
  → c.html(fullHtml) 响应
```

### 1.4 设计亮点

| 亮点 | 描述 | 代码位置 |
|------|------|---------|
| **纯运行时核心** | `@lessjs/core` 零 `node:*`、零 Vite 依赖，可在 Deno/Node/Bun/Edge 任意运行 | `packages/core/src/index.ts` |
| **DSD-First SSR** | 不依赖 `@lit-labs/ssr`，用字符串拼接产出标准 DSD HTML，无 `<!--lit-part-->` 污染 | `packages/core/src/render-dsd.ts` |
| **Entry Descriptor 分离** | `buildEntryDescriptor()` (纯数据) 与 `renderEntry()` (纯渲染) 分离，可测试、可序列化、可 diff | `packages/adapter-vite/src/entry-descriptor.ts` |
| **Phase Token 编译期保障** | Branded type 防止 Phase 2 在 Phase 1 完成前调用 | `packages/adapter-vite/src/build-context.ts:35-37` |
| **SSR Admission Plan** | 静态决策岛组件是否进入 SSR bundle，支持 CEM 分类 + Hub 标签 + 保守默认 | `packages/adapter-vite/src/entry-descriptor.ts:497-652` |
| **Multi-Adapter 模型** | `registerAdapter()` 支持多框架（Lit/React/Vanilla）共存，按 `isTemplate()` 分派 | `packages/core/src/adapter-registry.ts` |
| **Protocols 共享契约层** | `@lessjs/protocols` 零依赖接口包，解耦 content/i18n 与 adapter-vite | `packages/protocols/src/build-types.ts` |
| **Idempotent customElements.define** | SSR dom-shim 不幂等，框架在生成代码中 patch 使其幂等 | `entry-renderer.ts:421-439` |

---

## 2. 架构问题清单（P0/P1/P2/建议）

### P0 — 严重，阻塞发布

#### P0-01: Adapter Registry 全局单例，多实例互相覆盖

**路径**: `packages/core/src/adapter-registry.ts:25-26`

```ts
let _adapter: RendererProtocol | undefined;
const _namedAdapters: Map<string, RendererProtocol> = new Map();
```

**问题**: `registerAdapter()` 是模块级全局单例。SSR bundle 中只有一份实例（`viteBuild(ssr:true, noExternal)` 保证），但 dev 模式下 HMR 重载或测试环境多次 import 可能导致 adapter 互相覆盖。`installLitAdapter()` 的 `_installed` 守卫也是模块级变量，HMR 后失效。

**影响**: 测试中并行运行 Lit 和 Vanilla 测试用例会互相干扰；dev HMR 后 adapter 状态可能丢失。

**建议**: 将 adapter 注册移入 `LessBuildContext` 或 `SsrContext`，使其生命周期与构建上下文绑定，而非全局单例。

---

#### P0-02: renderEntry() 内二次调用 buildSsrAdmissionPlan()

**路径**: `packages/adapter-vite/src/entry-renderer.ts:322-326`

```ts
export function renderEntry(desc: EntryDescriptor): string {
  const ssrAdmissionPlan = buildSsrAdmissionPlan(
    desc.islands,
    desc.cemClassifications,
    desc.hubClientOnlyTags || [],
  );
```

**问题**: `buildSsrAdmissionPlan()` 已在 `buildEntryDescriptor()` 中调用过一次（line 460-464），结果存储在 `desc.ssrAdmissionPlan` 中。但 `renderEntry()` 忽略了已有的 `desc.ssrAdmissionPlan`，重新计算一遍。如果两次调用间 ctx 数据有变化（如 CEM 被更新），两个 plan 可能不一致。

**影响**: SSR 入口代码中的 `__CLIENT_ONLY_TAGS__` 和 `ssrAdmissionPlan` 可能与 `buildEntryDescriptor()` 返回的 plan 不一致。

**建议**: `renderEntry()` 应直接使用 `desc.ssrAdmissionPlan`，不再二次调用。

---

### P1 — 重要，应在本版本修复

#### P1-01: LessBuildContext.reset() 手动清空 30+ 字段，易遗漏

**路径**: `packages/adapter-vite/src/build-context.ts:226-270`

**问题**: `reset()` 方法逐一手写赋值清空所有字段。每次新增字段到 `Phase1Meta`/`Phase2Meta`/`Phase3Meta`/`PluginMeta` 时，必须同步更新 `reset()`。`userResolveAlias` 的注释说明「不 reset」但其他新字段未必有此自觉。

**影响**: watch 模式下旧状态泄漏，导致路由/岛组件/中间件配置错误。

**建议**: 使用构造函数模式替代手动 reset——每次 `buildStart()` 创建新的 `Phase1Meta()` 实例：

```ts
reset() {
  (this.phase1 as Phase1Meta) = new Phase1Meta();
  // 保留 userResolveAlias: this.phase1.userResolveAlias = saved;
  (this.phase2 as Phase2Meta) = new Phase2Meta();
  // phase3 不重置（保留跨构建的 SSG 配置）
}
```

---

#### P1-02: renderDsd() 参数签名过度重载，类型不安全

**路径**: `packages/core/src/render-dsd.ts:79-88`

```ts
export async function renderDsd(
  input: string | CustomElementConstructor,
  propsOrClass?: CustomElementConstructor | Record<string, unknown>,
  maybeProps?: Record<string, unknown>,
  sourceInfo?: ...,
  dsdOptions?: ...,
  collector?: ...,
  nestingDepth?: number,
  hooks?: RenderHooks,
): Promise<RenderOutput>
```

**问题**: 函数支持两种调用签名（`string` + `Class` + `props` 和 `string` + `props`），通过运行时 typeof 判断分派。8 个参数、3 个可选语义不同的中间参数，极易误传。

**影响**: 调用方容易混淆参数顺序，TypeScript 无法在编译期捕获。

**建议**: 使用 options 对象模式：

```ts
renderDsd({ tagName, componentClass, props, sourceInfo, dsdOptions, collector, nestingDepth, hooks })
```

---

#### P1-03: Hub Client-Only Tags 使用正则解析 TypeScript 源文件

**路径**: `packages/adapter-vite/src/less-plugin.ts:108-155`

**问题**: `discoverHubClientOnlyTags()` 用正则从 `_hub-data-full.ts` 源文件中提取 `tagName` 和 `compatibility` 字段。依赖位置距离来关联两者。如果文件格式变化（如添加注释、换行方式改变），关联可能出错。

**影响**: Hub 标签可能被错误分类，导致 SSG 时 DSD 渲染失败或客户端标签被误推入 SSR。

**建议**: 改为动态 import hub 数据模块并读取运行时值，或使用 JSON 数据源代替 TS 文件。

---

#### P1-04: SSR 错误处理中 console.log 残留调试代码

**路径**: `packages/core/src/render-dsd.ts:226-232`

```ts
console.log(
  '[LessJS Debug] isVNode check failed for',
  tagName,
  'Object.keys:',
  Object.keys(result),
  ...
);
```

**问题**: 生产代码中残留 `console.log` 调试输出。当组件 render() 返回既非 string/VNode/TemplateResult 的值时，会向用户终端/日志输出敏感调试信息。

**影响**: 信息泄漏（组件结构、属性键名），日志噪声。

**建议**: 替换为 `log.debug()` 或直接删除。`log.debug()` 在生产构建中会被 tree-shake。

---

#### P1-05: PluginMeta 的 index signature `[key: string]: unknown` 破坏类型安全

**路径**: `packages/adapter-vite/src/build-context.ts:147`

```ts
class PluginMeta implements LessPluginMeta {
  [key: string]: unknown;  // ← 索引签名
```

**问题**: 索引签名使得任何 `pluginMeta.anyKey` 都合法，TypeScript 无法捕获拼写错误（如 `pluginMeta.blogOptoins` 不会报错）。这同样影响 `@lessjs/protocols` 中的 `LessPluginMeta`。

**影响**: 子插件间通过 ctx 传递数据时，拼写错误只能在运行时发现。

**建议**: 移除 index signature，使用 `Record<string, unknown>` 的显式扩展接口，或添加类型映射工具。

---

### P2 — 改进，可在后续版本修复

#### P2-01: renderDsdTree() 与 renderToString() 大量代码重复

**路径**: `packages/core/src/jsx-render-string.ts`

**问题**: `renderToString()`（同步，~268 行）和 `renderDsdTree()`（异步，~437 行）逻辑高度相似（Fragment/Show/For/组件/HTML元素处理），仅 CE 渲染路径不同（前者输出空标签，后者调用 `renderDsd()`）。两处独立维护，新增特性（如 Signal 解包、Show/For、textContent）需同步修改。

**影响**: 维护负担倍增，行为不一致风险。

**建议**: 提取共享的节点类型判断和属性序列化，仅 CE 分派路径用策略注入：

```ts
function renderNode(node, ctx: RenderContext) {
  // 共享逻辑...
  if (isCustomElement && ctx.renderCE) {
    return ctx.renderCE(tagStr, props, children);
  }
  // 默认 HTML 路径...
}
```

---

#### P2-02: entry-renderer.ts 混合了代码生成与业务逻辑

**路径**: `packages/adapter-vite/src/entry-renderer.ts`

**问题**: 783 行的 `renderEntry()` 通过字符串拼接生成完整的 Hono 入口模块。其中混杂了：
- 代码生成逻辑（import 渲染、middleware 渲染、route 渲染）
- 运行时业务逻辑（CORS 校验、CSP nonce 生成、错误处理策略）
- SSG 专用逻辑（renderRoute、getStaticPaths、re-exports）

生成的代码无法被 TypeScript 检查，也无法被 IDE 跳转。

**影响**: 难以调试、难以静态分析、代码生成错误只能在运行时发现。

**建议**: 将运行时逻辑（如 `__ssr`、`__renderAppShell`、`renderRoute`）提取为独立的 `.ts` 模板文件，代码生成只负责拼装 import 和路由声明。

---

#### P2-03: LessBuildContext 既是构建状态又是运行时配置

**路径**: `packages/adapter-vite/src/build-context.ts`

**问题**: `LessBuildContext` 同时持有：
- 构建时瞬态数据（`honoEntryCode`、`cachedRoutes`、`buildCompleted`）
- 用户配置（`routesDir`、`islandsDir`、`upgradeStrategy`）
- 插件间通信数据（`plugins.blogOptions`、`plugins.i18nOptions`）

三类数据的生命周期和变更频率完全不同，但共享同一个 reset() 逻辑。

**影响**: 配置和状态耦合，reset 逻辑复杂，容易遗漏。

**建议**: 拆分为 `BuildConfig`（不可变）+ `BuildState`（可变）+ `PluginRegistry`（子插件数据）。

---

#### P2-04: CORS 默认配置硬编码 localhost 正则

**路径**: `packages/adapter-vite/src/entry-renderer.ts:123-129`

```ts
if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
  return origin
```

**问题**: 默认 CORS 策略只允许 `localhost` 和 `127.0.0.1`，不支持 `0.0.0.0`、`[::1]`、`.local` 等开发环境常见地址。此逻辑嵌在代码生成中，修改需要理解字符串拼接上下文。

**影响**: 部分开发环境无法使用默认 CORS 配置。

**建议**: 提取为 `@lessjs/core` 中的 `defaultCorsOriginValidator()` 函数，支持常见开发域名。

---

#### P2-05: CEM 自动检测扫描全量 node_modules

**路径**: `packages/adapter-vite/src/route-scanner.ts:558-599`

**问题**: `scanCemManifests()` 遍历 `node_modules` 目录下的所有包（包括 scoped packages 的两层目录），检查 `custom-elements.json` 是否存在。对于大型项目（数千包），这会导致显著的启动延迟。

**影响**: 构建启动时间随依赖数量线性增长。

**建议**: 增加配置项允许用户指定需扫描的包列表，或使用缓存机制避免每次全量扫描。

---

### 建议 — 长期改进方向

#### S-01: 考虑使用代码生成模板引擎替代字符串拼接

`entry-renderer.ts` 中 783 行的 `lines.push(...)` 字符串拼接模式可读性差、难维护。建议使用 tagged template literal 或轻量模板引擎（如 `deindent`）。

#### S-02: 考虑引入依赖注入容器

当前 adapter 注册、logger 创建、build context 均通过模块级变量或显式传参。随着包数量增长，建议引入轻量 DI 容器统一管理生命周期。

---

## 3. 模块依赖问题、耦合问题及重构方案

### 3.1 模块依赖图

```
@lessjs/app
  ├── @lessjs/adapter-vite (直接依赖)
  ├── @lessjs/content      (直接依赖)
  └── @lessjs/i18n         (直接依赖)

@lessjs/adapter-vite
  ├── @lessjs/core         (直接依赖 ✓ 单向)
  ├── @lessjs/protocols    (直接依赖 ✓ 共享契约)
  └── @lessjs/cem          (动态 import ✓ 延迟加载)
  └── @lessjs/compat-check (动态 import ✓ 延迟加载)

@lessjs/content
  ├── @lessjs/core         (直接依赖)
  └── @lessjs/protocols    (直接依赖 ✓ 通过 LessBuildContextLike)

@lessjs/adapter-lit
  ├── @lessjs/core         (直接依赖 ✓ 单向)
  └── @lessjs/style-sheet  (间接通过 core)

@lessjs/adapter-react
  └── @lessjs/core         (直接依赖 ✓)

@lessjs/adapter-vanilla
  └── @lessjs/core         (直接依赖 ✓)

@lessjs/style-sheet
  └── (零依赖 ✓)

@lessjs/protocols
  └── (零依赖 ✓)
```

### 3.2 发现的耦合问题

#### 耦合-01: entry-renderer.ts 硬编码 @lessjs/ui 和 @lessjs/generated 依赖

**路径**: `packages/adapter-vite/src/entry-renderer.ts:357-363`

```ts
lines.push(`import '@lessjs/ui/less-layout';`);
lines.push(`import { headerNav as __headerNav, navSections as __navSections } from '@lessjs/generated/nav';`);
lines.push(`import { getDefaultLocale as __getDefaultLocale, locales as __locales } from '@lessjs/generated/i18n';`);
```

**问题**: 代码生成器硬编码了对 `@lessjs/ui`（布局组件）和 `@lessjs/generated`（导航/国际化数据）的 import。这意味着：
1. 每个使用 LessJS 的项目都必须安装 `@lessjs/ui` 和 `@lessjs/generated`，即使不使用布局组件
2. 布局组件的引用方式（`__renderAppShell` 中直接 `renderDsd("less-layout", ...)` 和字符串替换 `</less-layout>`）与框架其他部分的解耦设计矛盾
3. `@lessjs/generated` 是构建时生成的包，其路径在代码生成时写死

**影响**: 无法替换布局组件，无法独立使用 adapter-vite，架构灵活性受限。

**重构方案**:
- 将 `less-layout` 和 `@lessjs/generated/*` 的 import 移入用户可配置的"layout provider"接口
- `__renderAppShell` 通过注册机制获取布局组件，而非硬编码
- 在 `FrameworkOptions` 中添加 `layout` 配置项

#### 耦合-02: build-ssg 对 SSR bundle 的内部变量有隐式依赖

**路径**: `packages/adapter-vite/src/entry-renderer.ts:603-680`

**问题**: SSG 构建后，`build-ssg.ts` import SSR bundle 并调用其 `renderRoute()`、`getStaticPaths()`、`routeInfo` 等导出。但这些函数的实现依赖 SSR bundle 内的模块级变量（如路由模块的 `varName`、`customElements` 注册表、adapter 实例）。

这意味着 SSG 构建器无法独立于 SSR bundle 运行，且 SSR bundle 的内部重构会隐式破坏 SSG。

**重构方案**:
- 将 SSG 需要的接口抽象为 `SsrBundleContract` 类型
- `build-ssg.ts` 只依赖此契约类型，不依赖具体实现

#### 耦合-03: PluginMeta 通过 index signature 绕过类型系统

**路径**: 同 P1-05

**问题**: `LessPluginMeta` 的 `[key: string]: unknown` 使得 content 和 i18n 插件可以无类型约束地读写共享上下文。当新增子插件时，无法通过 TypeScript 确保其数据结构正确。

**重构方案**:
- 定义 `PluginDataMap` 类型映射，每个子插件注册自己的数据类型
- `PluginMeta` 改为 `Map<PluginId, PluginData>`，通过泛型方法 `getPluginData<T>(id): T` 获取

### 3.3 循环依赖分析

代码注释中提到了 H-16 已知循环依赖：

> **H-16**: `adapter-vite` 生成代码 import `@lessjs/content/sitemap`，而 `content` 包 import `@lessjs/adapter-vite/build-context`

当前缓解措施：`@lessjs/protocols` 作为共享契约层。但生成代码中的 `import { generateSitemap } from '@lessjs/content/sitemap'`（entry-renderer.ts line 636）仍是一个硬编码的跨包引用，增加了未来循环依赖的风险。

---

## 4. 架构层面长期扩展风险预判

### 风险-01: 代码生成模式的可维护性天花板

**当前状态**: `entry-renderer.ts` 783 行纯字符串拼接生成完整 Hono 入口模块。

**风险**: 随着功能增长（如新增 middleware 类型、SSR 策略、路由特性），代码生成器的复杂度将指数增长。生成代码中的 bug 无法被 TypeScript 检查，无法被 IDE 跳转，无法被单元测试覆盖其内部逻辑。

**时间线**: v0.35+ 如果新增 3+ 个生成特性，维护成本将显著上升。

**缓解**: 将运行时逻辑提取为 `.ts` 模板文件，代码生成仅负责数据注入和路由声明拼装。

### 风险-02: Adapter Registry 全局状态与 Deno Deploy 多租户场景

**当前状态**: `adapter-registry.ts` 使用模块级全局变量存储 adapter。

**风险**: Deno Deploy 等边缘运行时可能复用同一进程处理多个请求。如果不同租户需要不同 adapter 配置，全局单例将成为瓶颈。

**时间线**: 当 LessJS 正式支持 Deno Deploy/Cloudflare Workers 等边缘运行时部署时。

**缓解**: 将 adapter 注册移入请求作用域的 `SsrContext`，而非模块全局。

### 风险-03: SSR Admission Plan 的策略扩展性

**当前状态**: `buildSsrAdmissionPlan()` 使用硬编码的 if-else 链判断 island 是否进入 SSR。

**风险**: 当前决策路径为：CEM tier → hydrate=only → ssr=false → package/local → 默认。每新增一种判断维度（如基于包大小、基于运行时特性检测、基于用户自定义规则），都需要修改此函数。

**时间线**: v0.30+ 当社区贡献新的 island 分类规则时。

**缓解**: 引入 `AdmissionRule` 接口，支持链式规则注册：

```ts
interface AdmissionRule {
  name: string;
  decide(island: IslandDecl, ctx: AdmissionContext): AdmissionDecision | undefined;
}
```

### 风险-04: renderDsdTree 递归深度与超时风险

**当前状态**: `renderDsdTree()` 对嵌套 CE 无递归深度限制（仅在 `renderDsd()` 中有 `nestingDepth` 参数但未做上限检查）。

**风险**: 深度嵌套的 CE 树（如 layout → sidebar → nav → menu-item → icon → svg）可能导致栈溢出或极长渲染时间。

**时间线**: 当页面组件嵌套超过 20 层时（当前实际约 5-8 层）。

**缓解**: 在 `renderDsdTree()` 中添加最大深度守卫（如 50 层），超限时降级为客户端渲染。

### 风险-05: @lessjs/ui 硬编码绑定限制框架通用性

**当前状态**: `__renderAppShell()` 中硬编码了 `less-layout` 组件的渲染和字符串替换。

**风险**: 无法替换布局组件，无法用于不使用 LessJS 官方 UI 库的项目，限制了框架作为通用 SSR 框架的适用范围。

**时间线**: 当社区希望用 LessJS 构建完全自定义布局的项目时。

**缓解**: 同耦合-01 方案。

---

## 5. 架构冻结/优化建议（面向 v1.0）

### 5.1 架构冻结建议（v1.0 前必须稳定）

| 冻结项 | 当前状态 | 冻结要求 |
|--------|---------|---------|
| `@lessjs/core` 公共 API | 187 行 re-exports | 冻结：核心 API 表面不可变，新增只能通过子路径 |
| `RendererProtocol` 接口 | `{name, render, isTemplate, extractStyles}` | 冻结：adapter 协议不可变 |
| `buildEntryDescriptor()` 签名 | routes + options → EntryDescriptor | 冻结：入口描述符构建接口 |
| `renderDsd()` 输出结构 | `RenderOutput {html, errors, metrics, hydrationHints}` | 冻结：渲染输出结构 |
| `@lessjs/protocols` 契约 | `LessBuildContextLike`, `LessPluginMeta` | 冻结：跨包通信契约 |

### 5.2 优化建议（v1.0 前应完成）

#### 优化-01: 消除 P0 问题

- **P0-01** (Adapter Registry 全局单例)：v1.0 前至少添加 HMR 安全守卫，理想方案是移入 context
- **P0-02** (二次调用 buildSsrAdmissionPlan)：简单修复，直接使用 `desc.ssrAdmissionPlan`

#### 优化-02: 重构 LessBuildContext

拆分为三层：
```
LessBuildConfig (不可变, 构建时传入)
  ├── routesDir, islandsDir, middleware, html, ...

LessBuildState (可变, 每次 buildStart 重置)
  ├── cachedRoutes, honoEntryCode, islandMeta, ...

LessPluginRegistry (子插件数据)
  ├── blogOptions, navSections, i18nOptions, ...
```

#### 优化-03: 代码生成模板化

将 `entry-renderer.ts` 中的运行时函数（`__ssr`、`__renderAppShell`、`__layoutAttr` 等）提取为独立的 `.ts` 文件，代码生成仅负责：
1. 生成 import 声明
2. 生成路由注册代码
3. 生成中间件配置

#### 优化-04: renderDsd 签名简化

将 8 参数重载函数改为 options 对象模式，保留旧签名作为 deprecated 兼容。

#### 优化-05: renderDsdTree + renderToString 统一

提取共享的节点处理逻辑，CE 分派用策略注入，消除 ~200 行重复代码。

### 5.3 v1.0 后的演进路线

| 阶段 | 主题 | 关键变更 |
|------|------|---------|
| v1.0 | 稳定化 | 冻结核心 API，消除 P0/P1 |
| v1.1 | 解耦化 | Layout Provider、代码生成模板化 |
| v1.2 | 边缘化 | Adapter Registry 请求作用域、Deno Deploy 适配 |
| v1.3 | 可扩展化 | AdmissionRule 插件、PluginMeta 类型安全 |
| v2.0 | 通用化 | 去除 @lessjs/ui 硬绑定，支持第三方布局 |

---

## 附录 A: 包间依赖矩阵

| 包 → 依赖 ↓ | core | protocols | style-sheet | adapter-vite | adapter-lit | adapter-react | adapter-vanilla | cem | compat-check | content | i18n | app | ui | hub | router | signals | rpc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| core | - | | ✓ | | | | | | | | | | | | | | |
| protocols | | - | | | | | | | | | | | | | | | |
| style-sheet | | | - | | | | | | | | | | | | | | |
| adapter-vite | ✓ | ✓ | | - | | | | dyn | dyn | | | | | | | | |
| adapter-lit | ✓ | | ✓ | | - | | | | | | | | | | | | |
| adapter-react | ✓ | | | | | - | | | | | | | | | | | |
| adapter-vanilla | ✓ | | | | | | - | | | | | | | | | | |
| content | ✓ | ✓ | | | | | | | | - | | | | | | | |
| i18n | ✓ | ✓ | | | | | | | | | - | | | | | | |
| app | ✓ | | | ✓ | | | | | | ✓ | ✓ | - | | | | | |

`dyn` = 动态 import (延迟加载)

## 附录 B: 关键文件索引

| 文件 | 行数 | 职责 |
|------|------|------|
| `packages/adapter-vite/src/entry-renderer.ts` | 824 | 代码生成：Hono 入口模块 |
| `packages/adapter-vite/src/entry-descriptor.ts` | 653 | 数据模型：EntryDescriptor + SSR Admission |
| `packages/adapter-vite/src/route-scanner.ts` | 669 | 路由扫描 + Island 发现 + CEM 自动检测 |
| `packages/adapter-vite/src/build-context.ts` | 271 | 构建上下文：三阶段状态 |
| `packages/adapter-vite/src/less-plugin.ts` | 378 | Vite 插件主入口 |
| `packages/core/src/render-dsd.ts` | 430 | DSD 渲染核心 |
| `packages/core/src/jsx-render-string.ts` | 437 | JSX → HTML 渲染 |
| `packages/core/src/index.ts` | 187 | Core 公共 API re-exports |
| `packages/adapter-lit/src/ssr.ts` | 496 | Lit SSR 适配器 |
| `packages/style-sheet/src/style-sheet.ts` | 127 | 跨环境 CSSStyleSheet |
