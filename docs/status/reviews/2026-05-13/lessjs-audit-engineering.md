# LessJS 工程维度审核报告

**审核人**: Alex (Software Engineer)\
**审核日期**: 2025-07-16\
**项目版本**: v0.14.0\
**代码规模**: ~12,965 行 TypeScript 源码（packages/*/src），121 个 TS 文件，10 个子包

---

## 总体评分: B+

LessJS 展现了优秀的工程素养——模块化架构清晰、类型安全意识强、安全考虑周到。代码风格高度一致，注释质量在开源项目中属于上乘。主要扣分点集中在 Signals 包的 `any` 类型泛滥、SSG 后处理的同步 I/O、以及部分运行时类型安全弱化点。

---

## 1. 代码质量

### 1.1 代码风格一致性 — 评分: A-

**亮点**:

- 全项目遵循统一的 `deno fmt` 配置（2 犯格缩进、单引号、分号），`deno.json` 顶层 fmt 配置确保一致
- 模块注释采用统一的 `@module` JSDoc 格式，每个文件开头都有清晰的模块描述
- 分隔线注释 `// ─── Section ─────` 在 `core`、`signals`、`adapter-vite` 中一致使用，提升可读性
- import 排序一致：标准库 → 第三方 → 内部模块

**问题**:

| #    | 文件                                            | 行号  | 优先级 | 描述                                                                                                                                                            |
| ---- | ----------------------------------------------- | ----- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-01 | `packages/signals/src/engine.ts`                | 12-18 | Minor  | Signals 包的日志使用 `console.warn/error` 直接调用，而其他包统一通过 `createLogger()` 抽象。风格不一致                                                          |
| Q-02 | `packages/adapter-vite/src/entry-generators.ts` | 51-52 | Minor  | 生成的客户端代码中使用 `var` + `function()` 旧式语法（ES3 风格），与项目其余部分的 ES2022+ 风格不协调。虽然这是因为生成代码需兼容旧浏览器，但缺少注释说明此意图 |
| Q-03 | `packages/core/src/types.ts`                    | 228   | Minor  | LessMiddleware 接口注释中残留 `console.log('API request:', c.req.path)` 示例代码，不一致于项目的 `log.info()` 模式                                              |

### 1.2 命名规范 — 评分: A-

**亮点**:

- 公共 API 命名精确且一致：`renderDsd`、`island`、`bindEvents`、`wrapInDocument`
- 文件命名遵循 kebab-case（`render-dsd.ts`、`html-escape.ts`、`ssg-postprocess.ts`）
- 构建阶段使用 `Phase1Meta`/`Phase2Meta`/`Phase3Meta` 清晰分层
- 常量命名遵循全大写（`VIRTUAL_BLOG_DATA_ID`、`RESOLVED_NAV_ID`）

**问题**:

| #    | 文件                                 | 行号  | 优先级 | 描述                                                                                                                                 |
| ---- | ------------------------------------ | ----- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| N-01 | `packages/adapter-vite/src/index.ts` | 25    | Minor  | `escapeAttr` 被 import 后重命名为 `escapeHtmlAttr`，语义不如原名清晰。应在使用处直接用 `escapeAttr` 或更明确命名                     |
| N-02 | `packages/signals/src/engine.ts`     | 93    | Minor  | `_engine` 以下划线前缀表示"内部"，但该变量被 `framework.ts` 和 `sugar.ts` 大量使用，实际上属于包内公开接口。命名暗示私有但实际非私有 |
| N-03 | `packages/signals/src/engine.ts`     | 11-18 | Minor  | `_log` 同理——以下划线开头暗示私有，但被同包其他模块导入使用                                                                          |

### 1.3 注释质量 — 评分: A

**亮点**:

- 每个模块文件开头有完整的 JSDoc 注释，包含版本历史、架构说明、使用示例
- `render-dsd.ts` 包含完整的 SSR/客户端生命周期文档（27 行模块头注释）
- `island.ts` 的注释解释了 Web Standards 对齐原理和设计决策
- `ssr.ts` 详细解释了"为什么不用 @lit-labs/ssr"（第 8-13 行），这是极好的设计决策文档
- ADR 编号引用贯穿代码（ADR 0014、ADR 0016、ADR 0018、ADR 0021 等），关联代码与架构决策

**问题**:

| #    | 文件                               | 行号   | 优先级 | 描述                                                                                                                                      |
| ---- | ---------------------------------- | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| C-01 | `packages/core/src/constants.ts`   | 全文件 | Minor  | 文件仅有 6 行注释无代码，缺少说明为何需要空文件（可能为未来预留，但无注释解释）                                                           |
| C-02 | `packages/signals/src/polyfill.ts` | 200+   | Minor  | polyfill 实现细节缺少注释。这是从 TC39 proposal 移植的复杂算法，关键步骤（如 `_producerAddLiveConsumer` 的 swap-remove 算法）需要注释解释 |

### 1.4 错误处理 — 评分: B+

**亮点**:

- 自定义错误层级体系清晰：`LessError`（基类）→ `SsrRenderError`（派生类）、`RpcError`
- 所有错误包含 `code` + `statusCode` + `message` 结构化信息
- `renderDsd` 在组件实例化失败、render() 失败时都返回安全的 HTML 注释而非抛出异常（优雅降级）
- `RpcController` 实现了完善的重试 + AbortController 取消机制
- `wrapInDocument` 对 `<script>` in headExtras 发出安全警告

**问题**:

| #    | 文件                                 | 行号    | 优先级   | 描述                                                                                                                                                                                                                              |
| ---- | ------------------------------------ | ------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-01 | `packages/core/src/render-dsd.ts`    | 108     | Major    | `renderDsd` 是 `async` 函数但内部渲染逻辑是纯同步字符串拼接。唯一的异步点是 `renderNestedCustomElements` 和 adapter.render()。函数签名标记 async 但大部分调用不需要，可能误导调用者以为可以并行渲染                               |
| E-02 | `packages/adapter-lit/src/ssr.ts`    | 493     | Major    | `uninstallLitAdapter()` 调用 `registerAdapter(undefined as unknown as RenderAdapter)` —— 用 `undefined` 强转 `RenderAdapter` 是不安全的类型欺骗。应提供显式的 `clearAdapter()` API 或将 `registerAdapter` 参数改为 `RenderAdapter |
| E-03 | `packages/adapter-vite/src/build.ts` | 113     | Critical | `ctx!.completePhase1()` 使用非空断言。如果 `ctx` 为 `undefined`（当 `externalCtx` 未传入且 `options` 中也未提供），运行时将抛出不可追踪的错误。应在函数入口验证 `ctx`                                                             |
| E-04 | `packages/core/src/island.ts`        | 276-288 | Major    | `island()` 函数直接修改 `componentClass.prototype.connectedCallback`，即使有 `__lessIslandWrapped` 守卫，这种 monkey-patch 模式在多重包装场景下可能导致意外行为。建议改用 Mixin 或 Symbol 属性模式                                |

---

## 2. API 设计

### 2.1 公开 API 导出 — 评分: A-

**v0.13 从 18 个导出收敛到 6 个的评估**:

当前 `@openelement/core` index.ts 导出清单（6 大类）:

1. **类型导出**: `FrameworkOptions`, `LessMiddleware`, `LessRenderer`, `PackageIslandMeta`, `RouteEntry`, `SpecialFileType`, `SsrContext`, `ComponentLayer`, `DsdOptions`, `HydrateEventDescriptor`, `RenderAdapter`
2. **错误类**: `LessError`, `SsrRenderError`
3. **上下文**: `createSsrContext`, `extractParams`, `parseQuery`
4. **渲染**: `renderDsd`, `renderDSDByName`, `camelToKebab`
5. **适配器**: `getAdapter`, `registerAdapter`
6. **工具**: `escapeAttr`, `escapeAttrValue`, `escapeHtml`, `SafeHtml`, `UnsafeHtml`, `createLogger`, `LessLogger`, `LogLevel`, `getSsrProps`, `island`, `IslandOptions`, `bindEvents`, `hasNavigationApi`, `matchRoute`, `navigate`, `onNavigate`, `NavigationCallback`, `wrapInDocument`, `renderSsrError`

**评估**: 导出收敛合理。核心包遵循"最少暴露"原则，将构建相关代码隔离到 `adapter-vite`，运行时相关代码留在 `core`。子路径导出（`@openelement/core/logger`、`@openelement/core/errors`、`@openelement/core/navigation`）设计得当，避免消费者引入不必要的依赖。

**问题**:

| #    | 文件                         | 行号 | 优先级 | 描述                                                                                                                                                |
| ---- | ---------------------------- | ---- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-01 | `packages/core/src/index.ts` | 34   | Minor  | `camelToKebab` 是 `render-dsd.ts` 的内部工具函数，从 `@openelement/core` 主入口导出可能不是最佳选择——外部用户很少需要直接调用它。考虑移到子路径导出 |
| A-02 | `packages/core/src/types.ts` | 242  | Major  | `LessMiddleware` 使用 `(c: any, next: ...)` 类型定义。这是为了避免 Hono 运行时依赖，但牺牲了类型安全。建议使用泛型或条件类型来提供更好的类型推断    |
| A-03 | `packages/core/src/index.ts` | 44   | Minor  | `wrapInDocument` 和 `renderSsrError` 从 `html-escape.ts` 导出，但文件名暗示这是 HTML 转义工具，而非文档包装。这违反了"模块名即功能"的直觉           |

### 2.2 各包导出一致性 — 评分: B+

**亮点**:

- 所有包遵循 `index.ts` 作为主入口的约定
- `@openelement/core` 提供子路径导出（`/logger`、`/errors`、`/navigation`），其他包也支持（`adapter-vite/build-context`、`adapter-vite/virtual-ids`）
- `@openelement/ui` 的 `islands` 元数据数组设计巧妙——包自描述其 Island 组件，实现零配置自动发现

**问题**:

| #    | 文件                              | 行号    | 优先级 | 描述                                                                                                                                     |
| ---- | --------------------------------- | ------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| A-04 | `packages/signals/src/index.ts`   | 37-51   | Minor  | 同时提供命名导出和 default 导出（对象形式），但 default 导出的对象结构与命名导出重复。考虑移除 default 导出或只保留一种形式              |
| A-05 | `packages/adapter-lit/src/ssr.ts` | 112-113 | Minor  | `escapeAttr` 和 `escapeHtml` 既被 export 又被 import 使用，re-export 是合理的，但缺少注释说明为什么 adapter-lit 需要重新导出 core 的函数 |

---

## 3. 实现细节

### 3.1 render-dsd.ts (DSD 渲染) — 评分: A-

**亮点**:

- 纯字符串拼接实现 DSD 渲染，零 DOM 依赖，性能优秀
- 完整支持 WHATWG DSD 规范属性（`shadowrootdelegatesfocus`、`shadowrootserializable` 等）
- 三层组件模型（dsd-static / dsd-interactive / pure-island）设计清晰
- 错误降级到 HTML 注释而非崩溃，适合 SSG 场景
- `DsdRenderCollector` 提供构建时性能度量

**问题**:

| #    | 文件                              | 行号 | 优先级 | 描述                                                                                                                                                                          |
| ---- | --------------------------------- | ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-01 | `packages/core/src/render-dsd.ts` | 100  | Major  | `renderDsd` 是 async 函数但内部大部分操作是同步的。性能敏感的 SSG 渲染路径不需要 async。建议拆分为 `renderDSDSync`（主路径）+ 异步 wrapper（需要 adapter 时）                 |
| I-02 | `packages/core/src/render-dsd.ts` | 108  | Minor  | `performance.now()` 在 SSR/SSG 环境中可能不可用（Deno 支持，但纯 Node.js 需要 perf_hooks）。建议加 fallback                                                                   |
| I-03 | `packages/core/src/render-dsd.ts` | 205  | Minor  | `instance.layer` 属性通过 `as unknown as DsdComponent` 访问，但 `DsdComponent` 接口的 `[key: string]: unknown` 索引签名使得这个属性永远存在但类型为 `unknown`。缺少运行时验证 |

### 3.2 html-escape.ts (安全转义) — 评分: A

**亮点**:

- `SafeHtml`/`UnsafeHtml` 品牌类型设计优秀——编译时区分已转义/未转义字符串
- `escapeHtml` 对已转义字符串短路返回，避免双重转义
- `wrapInDocument` 对 `headExtras` 中的 `<script>` 发出安全警告
- CSP nonce 支持完整
- `renderSsrError` 区分 dev/prod 环境，避免信息泄露

**问题**:

| #    | 文件                               | 行号   | 优先级 | 描述                                                                                                                                                                                                                                  |
| ---- | ---------------------------------- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-04 | `packages/core/src/html-escape.ts` | 33-34  | Minor  | `escapeHtml` 中通过 `(str as SafeHtml).__safeHtml !== undefined` 检查品牌，但品牌属性是 `unique symbol`，运行时值永远是 `undefined`。这意味着 SafeHtml 字符串会被错误地当作普通字符串处理并重新转义。品牌类型应在编译时生效而非运行时 |
| I-05 | `packages/core/src/html-escape.ts` | 96-101 | Minor  | `_warnedHeadExtrasScripts` 是模块级变量，只能警告一次。在长期运行的 dev server 中，如果第一次触发时用户不在控制台旁，后续注入将被静默忽略                                                                                             |

### 3.3 island.ts (Island 管理) — 评分: B+

**亮点**:

- 框架无关设计——支持 Lit、vanilla CE、FAST 等任何 Web Component 库
- 策略模式（eager/lazy/visible/idle）基于标准 Web API 实现
- `bindEvents` 自动绑定 SSR props 到客户端升级
- 幂等注册（`customElements.get()` 检查）

**问题**:

| #    | 文件                          | 行号    | 优先级 | 描述                                                                                                                                                                                                                                                    |
| ---- | ----------------------------- | ------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-06 | `packages/core/src/island.ts` | 276-288 | Major  | 直接修改 `componentClass.prototype.connectedCallback`——这是 prototype 级别的 monkey-patch。如果多个 `island()` 调用使用同一个类（虽然不太可能），守卫 `__lessIslandWrapped` 只保护一次包装。但更关键的是，这改变了类的原型，可能影响 Lit 的响应式更新链 |
| I-07 | `packages/core/src/island.ts` | 196-209 | Minor  | `createLazyStrategy` 的 fallback chain 中 `setTimeout(fn, 50)` 硬编码了 50ms 延迟。在高性能设备上这太保守，在低端设备上可能仍需调整。建议使用 `options.lazyDelay` 配置                                                                                  |
| I-08 | `packages/core/src/island.ts` | 138-187 | Minor  | `createVisibleStrategy` 在 `document.readyState === 'loading'` 时等待 DOMContentLoaded，但 MutationObserver 在 DOM 加载前无法 observe `document.body`。这段逻辑的时序依赖值得更多测试覆盖                                                               |

### 3.4 island-transform.ts (Island 转换) — 评分: A-

**亮点**:

- 安全性设计出色——tag name 校验（仅允许 `[a-z0-9-]+`）防止注入
- 只注入元数据标记，不注入运行时代码
- 使用 `this.error()` 在 Vite 中抛出构建错误（而非静默失败）

**问题**:

| #    | 文件                                            | 行号  | 优先级 | 描述                                                                                                                                                                               |
| ---- | ----------------------------------------------- | ----- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-09 | `packages/adapter-vite/src/island-transform.ts` | 30    | Minor  | `normalizedId.includes(`/${normalizedIslandsDir}/`)` 检测过于宽松——如果项目目录名碰巧包含 islandsDir 名称（如 `/my-islands-app/src/`），会产生误匹配。建议使用路径规范化的精确匹配 |
| I-10 | `packages/adapter-vite/src/island-transform.ts` | 59-63 | Minor  | 注入的代码直接拼接 `tagName` 到字符串字面量中，虽然前面有 `this.error()` 校验，但 `tagName` 值仍被模板字符串包裹。如果校验逻辑被意外绕过，可能产生语法错误                         |

### 3.5 ssg-postprocess.ts (SSG 后处理) — 评分: B

**亮点**:

- DSD polyfill 实现精巧，支持嵌套 DSD
- View Transitions、Speculation Rules 等 Web Platform API 集成
- `walkHtmlFiles` 抽象了目录遍历逻辑

**问题**:

| #    | 文件                                           | 行号  | 优先级       | 描述                                                                                                                                                                                     |
| ---- | ---------------------------------------------- | ----- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-11 | `packages/adapter-vite/src/ssg-postprocess.ts` | 17-18 | **Critical** | 使用 `readdirSync`/`readFileSync`/`writeFileSync` 同步 I/O。在 SSG 处理大量 HTML 文件时（如 1000+ 页面博客），这将阻塞事件循环。应改为 `readdir`/`readFile`/`writeFile`（异步版本）      |
| I-12 | `packages/adapter-vite/src/ssg-postprocess.ts` | 30-47 | Major        | `walkHtmlFiles` 是递归同步函数，深目录层级可能导致栈溢出。同时该函数对每个 HTML 文件执行"读取→处理→写回"操作，中间无错误恢复——如果写入失败，文件可能损坏                                 |
| I-13 | `packages/adapter-vite/src/ssg-postprocess.ts` | 52-61 | Minor        | `insertAfterHead` 使用正则 `/<head(\s[^>]*)?>/i` 匹配 `<head>` 标签。如果 HTML 中 `<head` 出现在注释或 CDATA 中，会产生误匹配。parse5 解析器已在 render-nested.ts 中使用，此处应保持一致 |

### 3.6 virtual-ids.ts (虚拟模块 ID) — 评分: A

**亮点**:

- 简洁明了，6 个常量定义
- 前缀命名（`VIRTUAL_`/`RESOLVED_`）一致且自解释
- 正确分离 Vite 特有常量到 adapter-vite 包

**无显著问题。**

### 3.7 signals/src/ (Signals 实现) — 评分: B-

**亮点**:

- 三层架构（Engine → Framework → Sugar）分离清晰
- 基于TC39 Signal Proposal 的 polyfill 实现，当浏览器原生支持时自动切换
- `islandEffect` 的 DOM 连接检测 + MutationObserver + 定时器三重保障设计周到
- `channel` 基于 CustomEvent 的跨 Island 通信方案符合 Web 标准

**问题**:

| #    | 文件                               | 行号             | 优先级       | 描述                                                                                                                                                                                                       |
| ---- | ---------------------------------- | ---------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-14 | `packages/signals/src/polyfill.ts` | 全文件           | **Critical** | 大量 `any` 类型使用（15+ 处），包括 `watch(...signals: any[])`、`getPending(): any[]`、`isState/isComputed/isWatcher` 参数等。虽然 deno-lint 已排除 `no-explicit-any`，但 TC39 polyfill 的类型安全应更严格 |
| I-15 | `packages/signals/src/engine.ts`   | 93               | Major        | `(globalThis as any).Signal ?? _createPolyfill()` — 对 `globalThis.Signal` 的访问缺乏类型守卫。如果浏览器 Signal API 与 polyfill 接口不完全兼容，将导致运行时错误而非编译时检测                            |
| I-16 | `packages/signals/src/polyfill.ts` | 221-222, 284-285 | Major        | `(options as any)[subtle_watched]` — 使用 `as any` 绕过类型系统访问 Symbol 属性。应使用 `SignalOptions` 接口扩展来正确声明这些属性                                                                         |
| I-17 | `packages/signals/src/sugar.ts`    | 51               | Minor        | `setInterval(() => ..., 30000)` 硬编码 30 秒轮询。在 SSG/SSR 环境中如果 `document` 存在但页面不活跃（如 headless browser），这些 interval 不会被清理，造成内存泄漏                                         |
| I-18 | `packages/signals/src/sugar.ts`    | 78               | Minor        | `_channelTarget` 在模块加载时读取 `document.body`，但如果脚本在 `<head>` 中加载，`document.body` 为 null。虽然有 null 检查，但没有任何日志或警告提示用户                                                   |

### 3.8 rpc/src/ (RPC 控制器) — 评分: A-

**亮点**:

- `RpcController` 作为 Lit `ReactiveController` 实现，自动管理生命周期
- 完善的 AbortController 集成——支持取消、重试竞速
- 指数退避重试 + 仅对 transient 错误（5xx/网络错误）重试
- `RpcError` 与 `LessError` 结构对齐（code + message + status）

**问题**:

| #    | 文件                        | 行号    | 优先级 | 描述                                                                                                                                                                                                           |
| ---- | --------------------------- | ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-19 | `packages/rpc/src/index.ts` | 254-260 | Minor  | 重试等待中，`signal.addEventListener('abort', ...)` 使用 `{ once: true }` 是正确的，但如果 `setTimeout` 先触发，abort listener 不会被自动移除。虽然最终会被 GC，但在高频调用场景下可能造成短暂的事件监听器泄漏 |
| I-20 | `packages/rpc/src/index.ts` | 113     | Minor  | `RpcController` 的 `host` 参数类型是 `ReactiveElement`（自定义接口），而非 Lit 的实际类型。这是为了框架无关性，但可能导致与 Lit 的类型不兼容（如 `requestUpdate()` 签名变化）                                  |

---

## 4. 性能问题

### 4.1 内存分配

| #    | 文件                                 | 行号    | 优先级 | 描述                                                                                                                                                                                                     |
| ---- | ------------------------------------ | ------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-01 | `packages/core/src/render-nested.ts` | 175-298 | Major  | 每次 `renderNestedCustomElements` 调用都 `parse5.parseFragment(html)` 创建完整 AST + 对每个嵌套 CE 调用 `parse5.parseFragment(dsdHtml)` 再解析一次。在深度嵌套场景中产生大量中间对象。建议缓存或复用 AST |
| P-02 | `packages/core/src/render-dsd.ts`    | 54-73   | Minor  | `serializeAttributes` 每次调用创建 `parts: string[]` 数组 + `Object.entries(props)` 遍历。对于渲染频率高的组件（如列表项），可预计算静态属性部分                                                         |
| P-03 | `packages/signals/src/sugar.ts`      | 51      | Minor  | `islandEffect` 中的 `setInterval` 每 30 秒触发一次，且每个 Island 实例创建一个 interval。100 个 Island = 100 个活跃定时器。建议使用共享的全局定时器                                                      |

### 4.2 同步阻塞

| #    | 文件                                           | 行号         | 优先级       | 描述                                                                                          |
| ---- | ---------------------------------------------- | ------------ | ------------ | --------------------------------------------------------------------------------------------- |
| P-04 | `packages/adapter-vite/src/ssg-postprocess.ts` | 17-18, 34-46 | **Critical** | 同步文件 I/O 在 SSG 路径中阻塞事件循环。这是整个项目最严重的性能瓶颈                          |
| P-05 | `packages/adapter-vite/src/route-scanner.ts`   | 109-187      | Minor        | `scanRoutes` 使用 `await readdir` + `await stat` 逐个文件串行 stat，可改为 `Promise.all` 并行 |

### 4.3 不必要的异步

| #    | 文件                                 | 行号 | 优先级 | 描述                                                                                                                                                                                      |
| ---- | ------------------------------------ | ---- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-06 | `packages/core/src/render-dsd.ts`    | 100  | Major  | `renderDsd` 标记为 async 但大部分操作是同步字符串拼接。async 函数的返回值会被包装为 Promise，在 SSG 渲染数千页面时增加微任务队列压力                                                      |
| P-07 | `packages/core/src/render-nested.ts` | 183  | Minor  | `const { renderDsd } = await import('./render-dsd.js')` 使用动态 import 避免循环依赖，但这在每次调用时都创建新的模块引用。Deno/Node.js 模块缓存会缓解，但顶层 import + 手动解决循环更高效 |

### 4.4 包体积

| #    | 描述                                                                                                                                                                                | 优先级 |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P-08 | `@openelement/core` 依赖 `parse5`（~45KB gzipped）仅用于 `renderNestedCustomElements`。对于不需要嵌套 CE 渲染的用户，这是不必要的体积。考虑将 `render-nested.ts` 移为可选子路径导出 | Major  |
| P-09 | `@openelement/adapter-vite` 依赖 `ts-morph`（~5MB 未压缩）用于类型分析。如果仅用于 SSG 构建时，可考虑延迟加载                                                                       | Minor  |

---

## 5. Deno 生态兼容

### 5.1 JSR 发布配置 — 评分: A-

**亮点**:

- 所有 10 个包都有 `deno.json` 配置，包含 `name`、`version`、`exports`
- `publish.include` 正确限定为 `src/**` + `deno.json` + `LICENSE`
- 子路径导出在 `@openelement/core` 的 `deno.json` 中正确声明
- `@openelement/adapter-vite` 的 `imports` 使用 `jsr:` 协议引用 `@openelement/core` 子包

**问题**:

| #    | 文件                              | 行号   | 优先级 | 描述                                                                                                                                                                                      |
| ---- | --------------------------------- | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | `packages/signals/deno.json`      | 全文件 | Minor  | 缺少 `imports` 字段——signals 包无任何外部依赖声明，但实际依赖 `document`、`IntersectionObserver`、`MutationObserver` 等浏览器 API。JSR 的 `slow-types` checker 可能因此无法验证类型兼容性 |
| D-02 | `deno.json` (root)                | 76     | Minor  | `lint.rules.exclude` 包含 `no-explicit-any`，这在 JSR 发布时可能导致类型质量降级。JSR 优先推荐严格类型                                                                                    |
| D-03 | `packages/adapter-vite/deno.json` | 10-13  | Minor  | `imports` 中使用 `jsr:@openelement/core@^0.14/logger` 等精确子路径引用，但主入口 `@openelement/core` 也被引用。如果版本号更新，需要同步修改 5 处版本号。建议使用 workspace: 协议自动解析  |

### 5.2 Workspace 配置 — 评分: A

**亮点**:

- `deno.json` 的 `workspace` 数组包含所有 10 个子包 + `www`
- `vendor: true` 启用依赖缓存，确保离线构建能力
- `nodeModulesDir: "manual"` 正确配合 Vite 使用

### 5.3 Vendor 策略 — 评分: B+

**亮点**:

- `vendor: true` 确保所有 npm 依赖被缓存到 `vendor/` 目录
- `exclude` 配置正确排除了 `vendor/` 目录的类型检查

**问题**:

| #    | 描述                                                                                                                                                      | 优先级 |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| D-04 | `vendor/` 目录被 `deno.json` 的 `exclude` 排除，意味着 `deno check` 和 `deno lint` 不覆盖 vendored 代码。这是正确的，但缺少 CI 中验证 vendor 完整性的步骤 | Minor  |

---

## 6. 代码坏味道

### 6.1 `any` 类型使用 — 严重程度: Major

**统计**: 源码中共 15+ 处 `any` 类型使用（不含测试文件）

**分布**:

| 包                             | 使用次数 | 严重程度               |
| ------------------------------ | -------- | ---------------------- |
| `signals/polyfill.ts`          | 15+      | Critical               |
| `adapter-vite/index.ts`        | 2        | Major                  |
| `adapter-lit/dsd-hydration.ts` | 3        | Minor (Mixin 标准)     |
| `core/types.ts`                | 1        | Major (LessMiddleware) |
| `signals/engine.ts`            | 2        | Major                  |
| `ui/less-code-block.ts`        | 1        | Minor (Prism 全局)     |

**最严重的 3 处**:

1. `signals/polyfill.ts` 整个文件缺乏类型安全——TC39 polyfill 的内部实现几乎全用 `any`
2. `core/types.ts:242` `LessMiddleware = (c: any, ...)` 暴露给所有消费者
3. `adapter-vite/index.ts:475,491` Vite 8 插件钩子的 `fn as any` 类型绕过

### 6.2 console.log 残留 — 严重程度: Minor

**发现**: 无直接 `console.log` 调用残留。所有日志通过 `createLogger()` 或 `LessLogger` 抽象。

**但注意**:

| #    | 文件                                 | 行号                  | 描述                                                                                       |
| ---- | ------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------ |
| S-01 | `signals/src/engine.ts`              | 13-18                 | 使用 `console.warn/error` 而非 `createLogger`，是代码坏味道                                |
| S-02 | `adapter-vite/src/build-manifest.ts` | 215-287               | 大量 `console.log` 用于格式化表格输出。这是 CLI 工具输出，可接受，但应通过 `log.info` 统一 |
| S-03 | `create/cli.ts`                      | 90, 261, 279, 305-307 | `console.log/error` 用于 CLI 输出，可接受                                                  |

### 6.3 死代码 — 严重程度: Minor

| #    | 文件                                        | 描述                                                                                                                                                                                               |
| ---- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-04 | `packages/core/src/constants.ts`            | 文件为空（6 行注释无代码），可能是历史遗留                                                                                                                                                         |
| S-05 | `packages/core/src/strategy-recommender.ts` | `buildRecommendation` 函数中 `current` 变量的赋值逻辑（第 95-100 行）在 `currentLayer !== 'pure-island'` 且 `currentLayer` 存在时直接赋值，但随后 `current` 变量只在 return 中使用，其语义令人困惑 |

### 6.4 过度抽象 — 严重程度: Minor

| #    | 文件                                            | 描述                                                                                                                                                                                                      |
| ---- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-06 | `packages/adapter-vite/src/entry-descriptor.ts` | `EntryDescriptor` 类型体系（`ImportDecl`、`MiddlewareDecl`、`ApiRouteDecl`、`PageRouteDecl`、`RendererDecl` 等）设计完善，但当前仅有一个消费者（`renderEntry`）。如果未来无其他消费者，这些中间类型可简化 |

### 6.5 重复代码 — 严重程度: Minor

| #    | 文件                                                                                 | 描述                                                                                                                          |
| ---- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| S-07 | `packages/core/src/html-escape.ts:37-41` vs `packages/core/src/html-escape.ts:46-52` | `escapeHtml` 和 `escapeAttr` 的替换逻辑高度相似（都替换 `&`、`<`、`>`、`"`、`'`），只是替换顺序略有不同。可提取共享的替换逻辑 |
| S-08 | `packages/core/src/render-dsd.ts:222-226` vs `230-233`                               | `serializeAttributes` 和 `data-ssr-props` 在 `pure-island` 和 DSD 路径中重复调用。可提取为辅助函数                            |

---

## 7. 亮点（值得肯定的设计）

1. **品牌类型系统** (`SafeHtml`/`UnsafeHtml`) — 编译时区分已转义/未转义 HTML，是防止 XSS 的优雅方案
2. **三层组件模型** (dsd-static / dsd-interactive / pure-island) — 精细化的渲染策略，允许开发者按需选择性能/交互平衡点
3. **Phase Token 构建编排** — `Phase1Token`/`Phase2Token`/`Phase3Token` 品牌类型确保编译时构建阶段顺序正确
4. __零 node:_ 的核心包_* — `@openelement/core` 不依赖任何 Node.js 特有 API，真正跨运行时
5. **ADR 文档驱动** — 代码中引用 ADR 编号（ADR 0014、ADR 0016 等），将代码变更与架构决策关联
6. **框架无关的 Island 设计** — `island()` 函数不绑定 Lit，任何 Custom Element 库都可使用
7. **Web Platform First** — Navigation API、URLPattern、IntersectionObserver、View Transitions、Speculation Rules 等全部基于 Web 标准
8. **安全的 SSG 错误处理** — 生产环境隐藏详细错误信息，开发环境展示完整栈

---

## 8. 改进建议（按优先级排序）

### Critical（应立即修复）

| # | 建议                                                                                                                                                  | 影响 |
| - | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1 | **ssg-postprocess.ts 改为异步 I/O** — 将 `readdirSync`/`readFileSync`/`writeFileSync` 替换为异步版本。对大型站点（1000+ 页面）性能提升显著            | P-04 |
| 2 | **build.ts 中 `ctx!` 非空断言添加守卫** — 在 `closeBundle` 入口验证 `ctx` 存在性，否则抛出明确的错误信息                                              | E-03 |
| 3 | **signals/polyfill.ts 添加类型安全** — 至少为公共 API（`watch`、`unwatch`、`getPending`、`isState`/`isComputed`/`isWatcher`）添加具体类型，移除 `any` | I-14 |

### Major（应尽快修复）

| #  | 建议                                                                                                                               | 影响                                    |
| -- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 4  | **renderDsd 拆分同步/异步路径** — 同步渲染路径（字符串拼接 + 已注册 adapter）不需要 async，可显著减少 SSG 渲染时的微任务开销       | I-01, P-06                              |
| 5  | **island() 的 connectedCallback 包装改用 Mixin 模式** — 避免直接修改 prototype，改用类似 `WithDsdHydration` 的 Mixin 模式          | I-06                                    |
| 6  | **LessMiddleware 类型改进** — 使用泛型 `LessMiddleware<C extends Record<string, unknown> = Record<string, unknown>>` 替代 `c: any` | A-02                                    |
| 7  | **uninstallLitAdapter 类型安全修复** — `registerAdapter` 参数改为 `RenderAdapter                                                   | undefined`，或新增`clearAdapter()` 方法 |
| 8  | **parse5 依赖移为可选** — `renderNestedCustomElements` 移到 `@openelement/core/nested` 子路径，核心包不依赖 parse5                 | P-08                                    |
| 9  | **renderNestedCustomElements 的 AST 缓存** — 对同一 HTML 字符串避免重复 parse + serialize                                          | P-01                                    |
| 10 | **Signals 包日志统一** — 将 `console.warn/error` 替换为 `createLogger('signal')`                                                   | Q-01, S-01                              |

### Minor（可计划修复）

| #  | 建议                                          | 影响       |
| -- | --------------------------------------------- | ---------- |
| 11 | `constants.ts` 空文件添加说明注释或删除       | S-04, C-01 |
| 12 | `escapeHtml` 和 `escapeAttr` 提取共享替换逻辑 | S-07       |
| 13 | `island-transform.ts` 路径匹配改用精确前缀    | I-09       |
| 14 | `islandEffect` 改用共享全局定时器             | P-03       |
| 15 | `createLazyStrategy` 延迟可配置化             | I-07       |
| 16 | `deno.json` lint 配置恢复 `no-explicit-any`   | D-02       |
| 17 | JSR 版本引用改用 workspace 协议               | D-03       |
| 18 | `build-manifest.ts` 日志统一到 `createLogger` | S-02       |

---

## 附录：文件审核清单

| 包                        | 文件数 | 审核深度 | 关键发现                                              |
| ------------------------- | ------ | -------- | ----------------------------------------------------- |
| @openelement/core         | 10 src | 完整     | 品牌类型优秀、async 不必要、SafeHtml 运行时检查有缺陷 |
| @openelement/adapter-vite | 14 src | 完整     | 同步 I/O 瓶颈、Phase Token 设计优秀、非空断言风险     |
| @openelement/adapter-lit  | 3 src  | 完整     | Lit SSR adapter 精巧、uninstall 类型不安全            |
| @openelement/signals      | 6 src  | 完整     | any 泛滥最严重、islandEffect 设计周到但 interval 泄漏 |
| @openelement/rpc          | 1 src  | 完整     | 最简洁的包、AbortController 集成优秀                  |
| @openelement/app          | 1 src  | 完整     | 统一入口设计良好                                      |
| @openelement/content      | 8 src  | 主要     | HMR 支持完善                                          |
| @openelement/i18n         | 5 src  | 主要     | 结构与 content 一致                                   |
| @openelement/ui           | 14 src | 概览     | islands 元数据设计巧妙                                |
| @openelement/create       | 1 src  | 完整     | JSR 版本解析逻辑健壮                                  |
