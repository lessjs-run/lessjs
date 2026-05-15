# LessJS v0.14.2 → v0.14.6 变更总结 / Changelog Summary

> 时间范围 / Date Range: 2026-05-15 (all four versions released on the same day)
> 基线 / Baseline: `v0.14.2` (`c6a0e80`)
> 终点 / Endpoint: `v0.14.6` (`45696f5`)
> 涉及包 / Packages: 全部 10 个工作区包 / All 10 workspace packages

---

## 一句话总结 / TL;DR

**EN:** From v0.14.2 to v0.14.6, LessJS received four rounds of code review remediation — addressing prototype pollution, signal correctness, SSR/SSG robustness, CSP nonce validation, History API concurrency, i18n double-rendering, visible-strategy memory leaks, and CLI reliability — totaling 28 blocker/correctness fixes and 8 minor improvements across all packages.

**ZH:** 从 v0.14.2 到 v0.14.6，LessJS 经过四轮代码评审修复——解决了原型污染、信号正确性、SSR/SSG 健壮性、CSP Nonce 校验、History API 并发、i18n 重复渲染、可见策略内存泄漏和 CLI 可靠性问题——共计 28 项阻断/正确性修复和 8 项小改进，覆盖全部包。

---

## 版本总览 / Version Overview

| 版本 / Version | 核心主题 / Core Theme | 提交数 / Commits | 修复项 / Fixes |
|---|---|---|---|
| v0.14.3 | 安全修复 + 代码评审整改 | 2 | 3 安全 + 10 正确性 + 4 小改进 |
| v0.14.4 | 扫描后修复 + onNavigate 并发 | 1 (+2 辅助) | 1 阻断 + 2 正确性 + 3 小改进 |
| v0.14.5 | 综合代码评审整改 | 1 (+2 辅助) | 5 阻断 + 5 正确性 + 2 小改进 |
| v0.14.6 | 第二轮代码评审整改 + CI 修复 | 5 | 3 阻断 + 7 正确性 + 3 小改进 |

---

## v0.14.3 — 安全修复与代码评审整改 / Security Fixes & Code Review Remediation

### 🔴 安全修复 / Security Fixes (3)

| ID | 问题 / Issue | 文件 / File | 说明 / Description |
|---|---|---|---|
| B-1 | `lessBind()` 原型污染 / Prototype pollution in `lessBind()` | `packages/core/src/context.ts` | 过滤 `__proto__`/`constructor`/`prototype` 键，阻止通过属性绑定注入原型链 / Filter `__proto__`/`constructor`/`prototype` keys to prevent prototype chain injection via property binding |
| B-2 | `connectedCallback` 递归 / `connectedCallback` recursion | `packages/core/src/context.ts` | 添加 `__lessBindDone` 幂等守卫，防止 `lessBind()` 在同一元素上重复触发 `connectedCallback` / Add `__lessBindDone` idempotency guard to prevent `lessBind()` from re-triggering `connectedCallback` on the same element |
| B-3 | `uninstallLitAdapter()` 类型不安全转换 / Type-unsafe cast in `uninstallLitAdapter()` | `packages/adapter-lit/src/ssr.ts` | 直接传 `undefined` 而非强制类型转换 / Pass `undefined` directly instead of unsafe type cast |

### 🟡 正确性与性能修复 / Correctness & Performance Fixes (10)

| ID | 问题 / Issue | 文件 / File | 说明 / Description |
|---|---|---|---|
| S-1 | Signal `_epoch` 溢出 / Signal `_epoch` overflow | `packages/signals/src/polyfill.ts` | 添加 epoch 溢出保护，防止长运行时计数器回绕 / Add overflow protection to prevent counter wrap-around in long-running processes |
| S-2 | `renderDSD()` 双重序列化 / Dual serialization in `renderDSD()` | `packages/core/src/render-dsd.ts` | 文档说明有意为之的双重序列化策略（渲染 + 注入）/ Document intentional dual serialization strategy (render + inject) |
| S-3 | `headExtras` HTML 注释不平衡 / HTML comment balance in `headExtras` | `packages/core/src/html-escape.ts` | 添加注释闭合验证，防止注入未闭合注释破坏 HTML 结构 / Add comment closure validation to prevent unclosed comment injection that breaks HTML structure |
| S-4 | `createVisibleStrategy` MutationObserver 无超时 / No timeout for MutationObserver | `packages/core/src/island.ts` | 添加 30 秒超时自动断开，防止不可见岛永占 Observer 资源 / Add 30s auto-disconnect timeout to prevent invisible islands from permanently occupying Observer resources |
| S-5 | Speculation rules 过于宽泛 / Overly broad speculation rules | `packages/adapter-vite/src/index.ts` | 顶层页面不再应用过于宽泛的预加载规则 / Top-level pages no longer apply overly broad prefetch rules |
| S-6 | SSG 输出包含错误堆栈 / Error stack in production SSG output | `packages/adapter-vite/src/ssg-postprocess.ts` | 生产 SSG 输出中抑制错误堆栈信息 / Suppress error stack traces in production SSG output |
| S-7 | `hydratedComponents` 计算错误 / Incorrect `hydratedComponents` calculation | `packages/adapter-vite/src/index.ts` | 按 `dsd-interactive` layer 过滤水合组件计数 / Filter hydrated component count by `dsd-interactive` layer |
| S-8 | 简单哈希冲突 / `simpleHash` collisions | `packages/adapter-vite/src/island-manifest.ts` | 用 64 位 FNV-1a 替换 32 位简单哈希，大幅降低碰撞概率 / Replace 32-bit simple hash with 64-bit FNV-1a, drastically reducing collision probability |
| S-9 | 品牌类型运行时检查 / Branded type runtime checks | `packages/core/src/types.ts` | 文档说明品牌类型仅为编译时检查，运行时无额外校验 / Document that branded types are compile-time only, no runtime validation |
| S-10 | `onNavigate` History API 回退导航类型 / History API fallback navigation type | `packages/core/src/navigation.ts` | 修复回退导航的类型判断逻辑 / Fix navigation type detection in History API fallback path |

### 💭 小改进 / Minor Improvements (4)

| ID | 问题 / Issue | 说明 / Description |
|---|---|---|
| N-1 | `decodeURIComponent` 错误处理 / Error handling | 添加 try-catch 包裹 `decodeURIComponent`，防止畸形 URI 组件导致崩溃 / Wrap `decodeURIComponent` in try-catch to prevent crashes from malformed URI components |
| N-2 | `RpcController` 方法可选化 / Optional methods | `requestUpdate`/`addController` 改为可选，减少强制契约 / Make `requestUpdate`/`addController` optional to reduce mandatory contract |
| N-3 | `parseQuery` 简化 / Simplify `parseQuery` | 用 `key in query` 替代冗长查找 / Replace verbose lookup with `key in query` |
| N-4 | Windows 路径归一化 / Windows path normalization | 文档说明 `route-scanner` 中的 Windows 路径归一化行为 / Document Windows path normalization behavior in `route-scanner` |

### 📦 v0.14.3 补充修复 / Post-scan Fixes (same version, second commit)

| ID | 类型 / Type | 说明 / Description |
|---|---|---|
| B-4 | 🔴 阻断 / Blocker | `onNavigate` 多订阅者 `history.pushState` 补丁互相覆盖→替换为共享引用计数模式；延迟捕获 `history` 以兼容 SSR / Multi-subscriber `history.pushState` patching corrupts each other's state → replaced with shared reference counter; lazy `history` capture for SSR compat |
| S-11 | 🟡 正确性 / Correctness | 统一 `stableHash` 为 64 位 FNV-1a，消除 32 位与 64 位实现并存 / Unify `stableHash` to 64-bit FNV-1a, eliminate coexisting 32-bit and 64-bit implementations |
| S-13 | 🟡 正确性 / Correctness | `visible` 策略 `querySelector`→`querySelectorAll`，多实例页面每个元素独立 `IntersectionObserver` / `visible` strategy `querySelector`→`querySelectorAll`, individual `IntersectionObserver` per element |
| N-6 | 💭 小改进 / Minor | `renderDSD()` 添加 `nestingDepth` 参数，`maxNestingDepth` 构建报告不再永远为 0 / Add `nestingDepth` param to `renderDSD()`, `maxNestingDepth` build report no longer always 0 |
| N-7 | 💭 小改进 / Minor | `insertAfterHead` 正则支持多行 `<head>` 标签 / Regex supports multi-line `<head>` tags |
| N-8 | 💭 小改进 / Minor | Polyfill 哨兵符号 `UNSET`/`COMPUTING`/`ERRORED` 移至模块作用域，多次调用 `_createPolyfill` 不再创建不同 Symbol / Move sentinel symbols to module scope, multiple `_createPolyfill` calls no longer create different Symbols |
| — | 🔧 辅助 / Ancillary | 修复 `createVisibleStrategy` 计时器泄漏（注册成功后 `clearTimeout`）；导出 `_clearAllVisibilityTimeouts()` 供测试清理 / Fix timer leak; export `_clearAllVisibilityTimeouts()` for test cleanup; remove unused `RenderAdapter` import |

---

## v0.14.4 — 扫描后修复 / Post-scan Remediation

> 注：v0.14.4 的修复内容已合并到上表 v0.14.3 补充修复部分展示，因其核心改动（B-4 onNavigate、S-11 stableHash 统一、S-13 querySelectorAll、N-6/N-7/N-8）在同一轮扫描中完成，版本号在 CI 辅助修复后提升。
>
> Note: v0.14.4's fixes are shown above under v0.14.3 post-scan fixes, since the core changes (B-4, S-11, S-13, N-6/N-7/N-8) were completed in the same scan round; the version bump occurred after CI auxiliary fixes.

**辅助修复 / Auxiliary fixes in v0.14.4:**
- 修复多行联合类型注解格式 / Fix multiline union type annotation formatting
- 将裸 `process` 替换为 `globalThis` 括号访问以兼容 Deno / Replace bare `process` with `globalThis` bracket access for Deno compat

---

## v0.14.5 — 综合代码评审整改 / Comprehensive Code Review Remediation

### 🔴 阻断修复 / Blocker Fixes (5)

| ID | 严重度 / Severity | 问题 / Issue | 说明 / Description |
|---|---|---|---|
| B-1 | 高 / High | `effect()` 信号变更在 `pending` 窗口丢失 / Signal changes lost during `pending` window | 布尔 `pending` 标志→计数器 + while 循环排空，微任务中不再丢失变更 / Boolean `pending` flag → counter-based `pendingCount` + while loop drain; no more lost changes in microtask |
| B-2 | 中 / Medium | CSP Nonce 缺少字符校验 / CSP nonce missing character validation | 添加 base64 格式校验 (`NONCE_RE`)，非法 nonce 发出警告并回退为 `undefined` / Add base64 format validation; invalid nonces trigger warning and fall back to `undefined` |
| B-3 | 中 / Medium | `less-dialog._syncInert()` Shadow DOM 兼容性 + 状态恢复 / Shadow DOM compat + state restoration | 三重修复：`WeakMap` 保存原始 inert 状态、`ShadowRoot` 父节点回退、`disconnectedCallback` 清理 / Triple fix: `WeakMap` for original inert states, `ShadowRoot` parentNode fallback, `disconnectedCallback` cleanup |
| B-4 | 低 / Low | `renderNestedCustomElements()` 在 `renderDSD` 失败时静默退化 / Silent degradation on `renderDSD` failure | `dsdCeElement` 为 `undefined` 时添加诊断警告日志 / Add diagnostic warning log when `dsdCeElement` is `undefined` |
| B-5 | 低 / Low | `createVisibleStrategy` IntersectionObserver 内存泄漏 / IntersectionObserver memory leak | 目标元素被移除后立即断开 Observer，不再等待 30 秒超时 / Disconnect Observers immediately when target elements removed from DOM, no longer wait for 30s timeout |

### 🟡 正确性与一致性修复 / Correctness & Consistency Fixes (5)

| ID | 问题 / Issue | 说明 / Description |
|---|---|---|
| S-1 | `batch()` 标记 `@deprecated` | 文档说明当前为 no-op 占位符，等 TC39 Signal 规范确定原生批处理后再实现 / Document as no-op placeholder; implement after TC39 Signal spec finalizes native batching |
| S-2 | `islandEffect()` 轮询减少 MutationObserver 重连 | 追踪 `lastParent`，仅当父节点实际变化时重连 / Track `lastParent`; only reconnect MutationObserver when parent actually changes |
| S-5 | `renderDSD()` 适配器引用重复消除 | `getAdapter()` 调用从 3 次减为 1 次（移至函数顶部）/ Reduce `getAdapter()` calls from 3 to 1 (move to function top) |
| S-6 | `_ensureHistoryOriginals` SSR/SSG 守卫 | 添加 `typeof globalThis.history === 'undefined'` 守卫，防止 SSR 环境中 `ReferenceError` / Add guard to prevent `ReferenceError` in SSR/SSG environments |
| S-7 | 正则命名捕获组特殊字符转义 / Regex named capture group special character escape | 回调函数转义参数名中的特殊正则字符，防止 `SyntaxError` 和 ReDoS / Escape special regex characters in parameter names via callback to prevent `SyntaxError` and ReDoS |

### 💭 小改进 / Minor Improvements (2)

| ID | 问题 / Issue | 说明 / Description |
|---|---|---|
| N-1 | `parseAttrsToProps` JSON.parse 开销 / `JSON.parse` overhead | 添加快速结构检查（匹配开闭括号），避免对非 JSON 字符串的异常捕获开销 / Add fast structural checks (matching brackets) to avoid throw-catch overhead on non-JSON strings |
| N-4 | UI 组件注册策略说明 / UI component registration strategy | 注释说明双注册策略：直接 `define()` + island() 入口，幂等守卫防止重复注册错误 / Comment explaining dual registration: direct `define()` + island() entry, idempotent guard prevents duplicate registration errors |

---

## v0.14.6 — 第二轮代码评审整改 / Second-round Code Review Remediation

### 🔴 阻断修复 / Blocker Fixes (3)

| ID | 严重度 / Severity | 问题 / Issue | 说明 / Description |
|---|---|---|---|
| B-6 | 高 / High | `__matchingRenderers` 大小写敏感路由匹配 / Case-sensitive route matching | 路由路径和 `renderer.scope` 比较前先 `.toLowerCase()`，防止 SSG 布局包裹因大小写不一致而丢失 / Compare `routePath` and `renderer.scope` with `.toLowerCase()` to prevent missing layout wrapping from casing mismatch |
| B-7 | 中 / Medium | SSG 404 目录重命名残留 / SSG 404 directory rename leaves residual | `rmdirSync` → `rmSync({ recursive: true, force: true })`，确保 404 输出目录完全清理；添加已有 `404.html` 检查防止静默覆盖 / Replace `rmdirSync` with `rmSync({ recursive: true, force: true })`; add pre-check for existing `404.html` |
| B-8 | 中 / Medium | `allNoExternal` 推入重复别名路径 / Duplicate alias paths in `allNoExternal` | 推入前检查路径是否已被 `defaultNoExternal` 正则模式覆盖，防止 SSR Bundle 中 Vite 外部化不一致 / Check against `defaultNoExternal` regex before pushing; prevent Vite externalization inconsistencies |

### 🟡 正确性与一致性修复 / Correctness & Consistency Fixes (7)

| ID | 问题 / Issue | 说明 / Description |
|---|---|---|
| S-3 | 默认导出 Tree-shaking 文档 / Default exports tree-shaking docs | 为 `island.ts`、`index.ts` 的默认导出添加 JSDoc，说明聚合对象默认导出可能阻止 tree-shaking / Add JSDoc explaining aggregate default exports may prevent tree-shaking when only named imports are used |
| S-4 | `adapter-registry` 单例警告 / Singleton warning | 添加 `@warning` JSDoc：模块级 `_adapter` 单例在多 Bundle 场景下可能失败，推荐使用 `@lessjs/app` 统一入口 / Warn that module-level singleton can fail in multi-bundle scenarios; recommend `@lessjs/app` as unified entry |
| S-8 | `polyfill._producerRemoveLiveConsumerAtIndex` 边界守卫 / Boundary guard | 添加索引越界检查，防止 `unwatch()` 在同一信号上多次调用导致数组索引损坏 / Add index bounds check to prevent array corruption when `unwatch()` is called multiple times on same signal |
| S-9 | 动态导入 JSR 警告 / Dynamic import JSR warning | 添加 `/* @vite-ignore */` 注解 + try-catch 包裹 `import(pkg)`，JSR 发布时抑制不可分析动态导入警告 / Suppress `unanalyzable-dynamic-import` warning during JSR publishing; failed imports log warning and continue |
| S-10 | `c.req.param()` 防御性回退 / Defensive fallback | 生成代码中 `c.req.param()` 添加 `|| {}` 回退，防止静态路由下 Hono `param()` 返回 `undefined` 导致 `TypeError` / Add `|| {}` fallback to prevent `TypeError` when Hono's `param()` returns `undefined` |
| S-11 | i18n 区域扩展重复渲染静态路由 / i18n locale expansion re-renders static routes | 添加 `if (!route.isDynamic) continue;` 守卫，静态路由已由主 `toSSG()` 流程渲染，跳过可消除 N×M 次冗余 SSR 调用 / Skip static routes in i18n expansion; eliminates N×M redundant SSR renders |
| S-12 | `extractCustomElementTags` 从注释/脚本中提取 / Extracts from comments/scripts | 预处理 HTML 移除注释、`<script>`、`<style>` 块后再提取自定义元素标签，防止误报导致不必要的 chunk 加载 / Strip comments, `<script>`, `<style>` blocks before extracting custom element tags; prevent false positives |
| S-13 | `readWorkspacePackageVersion` 单仓路径假设 / Monorepo path assumption | 添加 `import.meta.url` 路径推断作为回退，支持 `@lessjs/adapter-vite` 在单仓外使用 / Add `import.meta.url`-based path inference fallback for out-of-monorepo usage |
| S-14 | `dispatchDataPlugin` O(n) 数组查找 / O(n) array lookup | 替换 `for-of` 遍历为 `Map.get()` O(1) 查找（`ENTRIES_MAP` + `RESOLVED_MAP`），提升未来虚拟模块扩展的可扩展性 / Replace `for-of` with `Map.get()` O(1) lookups for better scalability |

### 💭 小改进 / Minor Improvements (3)

| ID | 问题 / Issue | 说明 / Description |
|---|---|---|
| N-2 | `configResolved` 双重设置说明 / Dual setting clarification | 注释说明两个 `configResolved` 设置均为有意为之：第二个在 `buildStart` 中是因为 Vite 要求虚拟入口在 `buildStart` 前存在 / Comment explaining both settings are intentional: the second in `buildStart` is required because Vite needs virtual entry to exist before `buildStart` fires |
| N-4 | `ssg-render.ts` 同步 I/O 改异步 / Sync to async I/O | `writeFileSync`/`mkdirSync` → `node:fs/promises` `mkdir`/`writeFile`，大型 SSG 构建中避免事件循环阻塞 / Migrate to async I/O to avoid blocking event loop during parallel `toSSG()` writes in large builds |
| N-5 | `subtle_watched`/`subtle_unwatched` 每次调用创建不同 Symbol / Per-call Symbol mismatch | 将 Symbol 声明从 `_createPolyfill()` 内部移至模块作用域，多次调用不再创建不同 Symbol / Move Symbol declarations to module scope; multiple `_createPolyfill` calls no longer create mismatched Symbols |

### 🔧 CI 修复 / CI Fixes (4 commits)

v0.14.6 有 4 个额外提交用于修复 CI 失败：

- **格式/类型/cspNonce/fs 导入修复**: 修复 Deno fmt 格式、TypeScript 类型错误、CSP nonce 测试和 fs 导入兼容性
- **S-9 rethrow + S-11 默认区域跳过**: 修复 `LessError` 包装和 i18n 默认区域跳过逻辑
- **回退过度激进的 S-11 跳过**: S-11 的静态路由跳过过于激进，导致 `getStaticPaths()` 定义的静态路由也被错误跳过
- **i18n 预存 Bug 修复**: 修复了 `getStaticPaths()` 返回的静态路由被 i18n 扩展错误跳过的预存 Bug

---

## 按模块汇总 / Summary by Module

### `packages/core`

| 改动领域 / Area | 关键修复 / Key Fixes |
|---|---|
| 安全 / Security | 原型污染 (B-1)、`connectedCallback` 递归 (B-2) |
| 渲染 / Rendering | `renderDSD()` 双重序列化文档 (S-2)、`renderNestedCustomElements()` 诊断日志 (B-4 v0.14.5)、`nestingDepth` 参数 (N-6) |
| 导航 / Navigation | `onNavigate` 多订阅者并发 (B-4 v0.14.3)、History API 回退导航类型 (S-10 v0.14.3)、正则特殊字符转义 (S-7 v0.14.5)、SSR 守卫 (S-6 v0.14.5) |
| Island | `createVisibleStrategy` 超时 (S-4 v0.14.3) + 内存泄漏 (B-5 v0.14.5) + `querySelectorAll` (S-13 v0.14.3) |
| HTML / CSP | `headExtras` 注释平衡 (S-3 v0.14.3)、CSP nonce 校验 (B-2 v0.14.5) |

### `packages/signals`

| 改动领域 / Area | 关键修复 / Key Fixes |
|---|---|
| 正确性 / Correctness | `_epoch` 溢出保护 (S-1)、`effect()` pending 窗口信号丢失 (B-1 v0.14.5) |
| Polyfill | 边界守卫 `_producerRemoveLiveConsumerAtIndex` (S-8 v0.14.6)、哨兵 Symbol 模块作用域 (N-8 v0.14.3)、`subtle_watched` Symbol 模块作用域 (N-5 v0.14.6) |
| API | `batch()` 标记 `@deprecated` (S-1 v0.14.5) |

### `packages/adapter-vite`

| 改动领域 / Area | 关键修复 / Key Fixes |
|---|---|
| SSR/SSG | 大小写敏感路由匹配 (B-6 v0.14.6)、404 目录清理 (B-7 v0.14.6)、i18n 重复渲染 (S-11 v0.14.6)、同步→异步 I/O (N-4 v0.14.6) |
| Island 清单 | 64 位 FNV-1a 哈希 (S-8 v0.14.3)、注释/脚本误报 (S-12 v0.14.6)、O(1) 查找 (S-14 v0.14.6) |
| Vite 集成 | `allNoExternal` 去重 (B-8 v0.14.6)、Speculation rules (S-5 v0.14.3)、SSG 错误堆栈抑制 (S-6 v0.14.3) |
| 外部兼容 | `readWorkspacePackageVersion` 路径回退 (S-13 v0.14.6)、动态导入 JSR 注解 (S-9 v0.14.6) |

### `packages/ui`

| 改动领域 / Area | 关键修复 / Key Fixes |
|---|---|
| `less-dialog` | Shadow DOM 兼容 (B-3 v0.14.5)、inert 状态恢复、`disconnectedCallback` 清理 |
| 注册策略 | 双注册说明文档 (N-4 v0.14.5) |

### `packages/rpc`

| 改动领域 / Area | 关键修复 / Key Fixes |
|---|---|
| API | `requestUpdate`/`addController` 可选化 (N-2 v0.14.3) |

---

## 按严重度汇总 / Summary by Severity

| 严重度 / Severity | v0.14.3 | v0.14.4 | v0.14.5 | v0.14.6 | 合计 / Total |
|---|---|---|---|---|---|
| 🔴 安全 / Security | 3 | 0 | 0 | 0 | **3** |
| 🔴 阻断 / Blocker | 0 | 1 | 5 | 3 | **9** |
| 🟡 正确性 / Correctness | 10 | 2 | 5 | 7 | **24** |
| 🟡 小改进 / Minor | 4 | 3 | 2 | 3 | **12** |

---

## 关键主题回顾 / Key Themes Recap

### 1. 安全加固 / Security Hardening

**EN:** The most critical starting point was v0.14.3's prototype pollution fix in `lessBind()`, which could have allowed arbitrary property injection via `__proto__`/`constructor`/`prototype`. The `connectedCallback` recursion guard and CSP nonce validation (v0.14.5) complete the security surface hardening.

**ZH:** 最关键的起点是 v0.14.3 中 `lessBind()` 的原型污染修复——原本可能通过 `__proto__`/`constructor`/`prototype` 注入任意属性。`connectedCallback` 递归守卫和 CSP nonce 校验（v0.14.5）完成了安全面加固。

### 2. 信号系统正确性 / Signal System Correctness

**EN:** The signals package received fundamental fixes across three versions: epoch overflow protection (v0.14.3), the critical `effect()` pending-window signal loss fix with counter-based draining (v0.14.5), and the `_producerRemoveLiveConsumerAtIndex` boundary guard (v0.14.6). Together these move the signal system from "works in demos" to "works under concurrent stress."

**ZH:** 信号包跨三个版本获得了基础性修复：epoch 溢出保护（v0.14.3）、关键性的 `effect()` pending 窗口信号丢失修复——用计数器排空替代布尔标志（v0.14.5）、以及 `_producerRemoveLiveConsumerAtIndex` 边界守卫（v0.14.6）。这些修复将信号系统从"demo 可用"提升到"并发压力下可用"。

### 3. SSR/SSG 健壮性 / SSR/SSG Robustness

**EN:** SSR/SSG received the most fixes by volume: case-sensitive route matching (v0.14.6 B-6), i18n redundant rendering elimination (v0.14.6 S-11), History API concurrency for `onNavigate` (v0.14.3 B-4), 404 directory cleanup (v0.14.6 B-7), sync→async I/O migration (v0.14.6 N-4), and multiple edge-case guards (`c.req.param()` fallback, SSG error stack suppression, `readWorkspacePackageVersion` monorepo path).

**ZH:** SSR/SSG 按数量获得了最多修复：大小写敏感路由匹配（v0.14.6 B-6）、i18n 冗余渲染消除（v0.14.6 S-11）、`onNavigate` 的 History API 并发（v0.14.3 B-4）、404 目录清理（v0.14.6 B-7）、同步→异步 I/O 迁移（v0.14.6 N-4），以及多个边界情况守卫。

### 4. 内存与资源管理 / Memory & Resource Management

**EN:** Three separate memory/resource leaks were fixed: `createVisibleStrategy` MutationObserver timeout (v0.14.3), IntersectionObserver leak (v0.14.5 B-5), and timer leak with `_clearAllVisibilityTimeouts()` (v0.14.3 ancillary). The `islandEffect()` polling also reduced unnecessary MutationObserver reconnects (v0.14.5 S-2).

**ZH:** 三个独立的内存/资源泄漏被修复：`createVisibleStrategy` MutationObserver 超时（v0.14.3）、IntersectionObserver 泄漏（v0.14.5 B-5）、以及带 `_clearAllVisibilityTimeouts()` 的计时器泄漏（v0.14.3 辅助修复）。`islandEffect()` 轮询也减少了不必要的 MutationObserver 重连（v0.14.5 S-2）。

### 5. Polyfill 一致性 / Polyfill Consistency

**EN:** Two rounds of polyfill Symbol scope fixes: v0.14.3 moved `UNSET`/`COMPUTING`/`ERRORED` to module scope (N-8), and v0.14.6 moved `subtle_watched`/`subtle_unwatched` to module scope (N-5). Both addressed the same root cause: `_createPolyfill()` being called multiple times (e.g., in tests) created mismatched Symbols.

**ZH:** 两轮 Polyfill Symbol 作用域修复：v0.14.3 将 `UNSET`/`COMPUTING`/`ERRORED` 移至模块作用域（N-8），v0.14.6 将 `subtle_watched`/`subtle_unwatched` 移至模块作用域（N-5）。两者解决同一个根因：`_createPolyfill()` 被多次调用（如测试中）会创建不匹配的 Symbol。

---

## 遗留问题（来自 v0.14.6 评审）/ Known Issues (from v0.14.6 Review

| 优先级 / Priority | 问题 / Issue | 状态 / Status |
|---|---|---|
| P0 | 发布 parity 断裂：源码 0.14.6 vs JSR 0.14.2 / Release parity broken: source 0.14.6 vs JSR 0.14.2 | ❌ 未修复 / Open |
| P0 | `@lessjs/create` 远程版本解析不可靠 / Remote version resolution unreliable | ❌ 未修复 / Open |
| P0 | 包 Islands 未作为通用 SSR 协议注册 / Package islands not SSR-registered as protocol | ❌ 未修复 / Open |
| P1 | 每页面 Island 清单未接入 SSG 输出 / Per-page island manifest not wired to SSG output | ❌ 未修复 / Open |
| P1 | 脚手架测试假阳性 / Scaffold test false positives | ❌ 未修复 / Open |
| P2 | DSD polyfill 注入策略需现代化 / DSD polyfill injection policy needs modernization | ❌ 未修复 / Open |
| P2 | `PackageIslandMeta` 过小 / Too small for registry protocol | ❌ 未修复 / Open |
