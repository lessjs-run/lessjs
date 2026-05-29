# 项目全面审核报告 / Comprehensive Project Audit Report

**项目 / Project**: LessJS — Deno-first SSG Framework\
**审核日期 / Date**: 2026-05-15\
**审核范围 / Scope**: 全量源码递归扫描（10 包 + www + 配置）/ Full recursive source scan (10 packages + www + config)\
**扫描文件数 / Files Scanned**: ~120 TS 源码 + 配置 / ~120 TS source files + configs\
**发现问题 / Total Findings**: 110

---

## 1. 项目概况 / Project Overview

| 项目 / Item             | 详情 / Detail                                                   |
| ----------------------- | --------------------------------------------------------------- |
| 项目类型 / Project Type | Deno Monorepo SSG Framework                                     |
| 主框架 / Main Framework | Deno 2.7+ / Vite 8 / Lit 3 / Hono 4                             |
| 入口文件 / Entry Points | `packages/app/src/index.ts` (伞包), `www/vite.config.ts` (站点) |
| 代码规模 / Code Scale   | ~120 TS 源码, 10 包, ~15k LOC (估算)                            |
| 构建工具 / Build Tool   | Deno + Vite 8 (三阶段 SSG 管线)                                 |
| 包管理 / Package Mgr    | Deno workspace + JSR + npm specifiers                           |
| 测试 / Testing          | Deno test + Playwright E2E                                      |

---

## 2. 严重问题（必须立即修复）/ CRITICAL Issues (Must Fix Immediately)

### C-01. XSS: Markdown 渲染未做 HTML 消毒 / Unsanitized Markdown HTML

- **文件 / File**: `packages/content/src/blog/markdown.ts:36`
- **代码 / Code**: `html = await marked(content);`
- **风险 / Risk**: `marked` 默认渲染原始 HTML。恶意 markdown 文件可注入 `<script>` / `<iframe>` / `onerror` 等攻击载荷，构成存储型 XSS。/ `marked` renders raw HTML by default. Malicious markdown can inject `<script>`/`<iframe>`/event handlers — stored XSS.
- **修复 / Fix**: 配置 `marked` 禁用 HTML 或接入 DOMPurify：
  ```ts
  // 方案 A：禁用原始 HTML
  marked.setOptions({ html: false });
  // 方案 B：消毒输出
  html = DOMPurify.sanitize(await marked(content));
  ```

### C-02. XSS: `headExtras` 未经转义直接插入 HTML / Unescaped `headExtras` in `wrapInDocument()`

- **文件 / File**: `packages/core/src/html-escape.ts:173`
- **代码 / Code**: `${headExtras}` 直接插值，无任何转义
- **风险 / Risk**: 开发者若传入用户可控内容（URL 参数、CMS 字段），可直接注入任意 JS。当前仅有日志警告，无运行时防护。/ Developer-controlled or user-controlled content injected as raw HTML. Only a console warning, no runtime protection.
- **修复 / Fix**: 用结构化注入 API（`inject.stylesheets`/`inject.scripts`）替代，或添加 `escapeHtml` 选项。

### C-03. 原型污染: `island.ts` 属性赋值黑名单不完整 / Incomplete Prototype Pollution Blocklist

- **文件 / File**: `packages/core/src/island.ts:146`
- **代码 / Code**: `(el as Record<string, unknown>)[key] = value;`
- **风险 / Risk**: `DANGEROUS_KEYS` 仅阻止 `__proto__`/`constructor`/`prototype`，未覆盖 `toString`/`valueOf`/`hasOwnProperty`/`__defineGetter__` 等 `Object.prototype` 方法。攻击者控制 `data-ssr-props` JSON 可覆写这些方法。/ Blocklist misses `toString`, `valueOf`, `hasOwnProperty`, `__defineGetter__` etc. Attacker controlling SSR props JSON can override these.
- **修复 / Fix**: 扩展黑名单或改用白名单：
  ```ts
  const DANGEROUS_KEYS = new Set([
    '__proto__',
    'constructor',
    'prototype',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toString',
    'toLocaleString',
    'valueOf',
  ]);
  ```

### C-04. 原型污染: `render-dsd.ts` 属性赋值无任何过滤 / No Filtering in `renderDsd()` Property Assignment

- **文件 / File**: `packages/core/src/render-dsd.ts:140`
- **代码 / Code**: `(instance as Record<string, unknown>)[key] = value;`
- **风险 / Risk**: 与 C-03 同类问题，但此处完全无 `DANGEROUS_KEYS` 过滤。SSR 渲染路径中可直接设置 `__proto__`/`constructor`。/ Same class as C-03 but with ZERO blocklist. SSR path can set `__proto__`/`constructor` directly.
- **修复 / Fix**: 应用与 C-03 相同的 `DANGEROUS_KEYS` 过滤器，提取为共享工具函数。

### C-05. XSS: 博客/ADR 页面 `unsafeHTML` 渲染未经消毒的 Markdown / `unsafeHTML` with Unvalidated Blog/ADR Content

- **文件 / File**: `www/app/routes/blog/[slug].ts:68,89`; `www/app/routes/decisions/[slug].ts:199`
- **代码 / Code**: `${unsafeHTML(post.html)}`
- **风险 / Risk**: `unsafeHTML` 绕过 Lit 的 XSS 防护。若 markdown 管线未消毒，直接构成 XSS。/ Bypasses Lit's XSS protection. If markdown pipeline doesn't sanitize, this is a direct XSS vector.
- **修复 / Fix**: 在渲染前添加消毒步骤：`unsafeHTML(sanitize(post.html))`

### C-06. XSS: 终端 Island `innerHTML` 直接赋值 / Terminal Island `innerHTML` Assignment

- **文件 / File**: `www/app/islands/less-term.ts:132`
- **代码 / Code**: `div.innerHTML = htmlStr;`
- **风险 / Risk**: API 返回数据 (`data.output`) 经 `_addLine()` 直接注入 DOM。若 API 被攻破，即 XSS。/ API response data injected into DOM via `innerHTML`. Compromised API = XSS.
- **修复 / Fix**: 使用白名单消毒：`div.innerHTML = sanitize(htmlStr, { ALLOWED_TAGS: ['span'], ALLOWED_ATTR: ['style', 'class'] });`

### C-07. XSS: API 反射用户输入未转义 / Reflected XSS in Term API

- **文件 / File**: `www/app/routes/api/term.ts:125`
- **代码 / Code**: `` `command not found:</span> ${cmd}. type ...` `` — `cmd` 来自用户 POST 输入，未转义
- **风险 / Risk**: 用户发送 `cmd: "<img src=x onerror=alert(1)>"` → API 返回含恶意 HTML → 客户端 `innerHTML` 渲染 → 完整 XSS 链。/ User sends malicious `cmd` → API reflects unsanitized HTML → client renders via `innerHTML` → complete XSS chain.
- **修复 / Fix**: 在 API 端转义 `cmd`：`escapeHtml(cmd)`

### C-08. ReDoS: `extractMeta` 正则可致灾难性回溯 / ReDoS in `extractMeta` Regex

- **文件 / File**: `packages/content/src/nav/scanner.ts:21-23`
- **代码 / Code**: `/\{[\s\S]*?\}/` — 嵌套 `{` 输入导致指数级回溯
- **风险 / Risk**: 恶意/畸形路由文件可使构建进程挂起。/ Malformed route file can freeze the build process.
- **修复 / Fix**: 使用受限模式：
  ```ts
  /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/;
  ```

### C-09. 锁文件过期: `@lessjs/ui@0.6.1` 和 `@0.14.2` 引用 / Stale Lock File with Ancient Versions

- **文件 / File**: `deno.lock:7,50,1121-1166`
- **风险 / Risk**: 锁文件固定了远古版本 `@lessjs/ui@0.6.1` 和 `@0.14.2` 依赖，工作区实际版本为 `0.14.6`。`deno install` 可能拉取不兼容版本，导致运行时崩溃。/ Lock file pins ancient `@lessjs/ui@0.6.1` and `@0.14.2` deps. Workspace is at `0.14.6`. `deno install` may pull incompatible versions.
- **修复 / Fix**: 运行 `deno install` 重新生成 `deno.lock`，提交更新。

### C-10. 硬编码过期版本: `v0.13.0` 在线上终端展示 / Stale Hardcoded Version in Live Terminal

- **文件 / File**: `functions/api/term.ts:22,33`
- **风险 / Risk**: 在线终端显示 `v0.13.0`，实际为 `0.14.6`。用户看到过期信息。/ Live terminal displays `v0.13.0`, actual is `0.14.6`. Misleading.
- **修复 / Fix**: 更新为 `v0.14.6` 或从工作区配置动态读取。

---

## 3. 高危问题（建议尽快修复）/ HIGH Issues (Fix Soon)

### H-01. 安全验证函数 `validateSafeUrl` 误捕自身异常 / `validateSafeUrl` Catches Its Own LessError

- **文件 / File**: `packages/adapter-vite/src/index.ts:237-254`
- **问题 / Problem**: `LessError` 在 `try` 内抛出后被 `catch` 重新包装为 "malformed percent-encoding" 消息，丢失原始 "Unsafe URL" 安全警告。/ `LessError` thrown inside `try` is caught and re-wrapped with wrong message, losing the original security warning.
- **修复 / Fix**: 添加 `if (e instanceof LessError) throw e;`

### H-02. 生成代码中路由路径未转义 / Unescaped Route Paths in Generated Code

- **文件 / File**: `packages/adapter-vite/src/entry-renderer.ts:172,180,552`
- **问题 / Problem**: `app.get('${route.path}', ...)` — 若路径含单引号，生成代码语法错误。/ Route paths with single quotes cause syntax errors in generated code.
- **修复 / Fix**: 使用 `JSON.stringify(route.path)`

### H-03. PWA manifest 链接注入未转义 `basePath` / Unescaped `basePath` in PWA Injection

- **文件 / File**: `packages/adapter-vite/src/cli/ssg-render.ts:456-458`
- **问题 / Problem**: `basePath` 直接插入 HTML 属性，含 `"` 或 `>` 可注入。/ `basePath` interpolated into HTML attributes; `"`/`>` can break out.
- **修复 / Fix**: 使用 `escapeAttr(basePath)`

### H-04. CDN 外部脚本无 SRI / External CDN Scripts Without SRI

- **文件 / File**: `www/vite.config.ts:87-119`
- **问题 / Problem**: 7 个 Prism CDN 脚本和 GoatCounter 均无 `integrity` 属性。CDN 被攻破 = 全站 XSS。/ 7 Prism CDN scripts + GoatCounter have no `integrity` attribute. Compromised CDN = site-wide XSS.
- **修复 / Fix**: 为所有外部资源添加 `integrity` + `crossorigin` 属性。

### H-05. CDN 样式表无 SRI / External Stylesheets Without SRI

- **文件 / File**: `www/vite.config.ts:133,151`
- **问题 / Problem**: Open Props 和 Prism CSS 均无 SRI。/ Same SRI concern for CSS resources.
- **修复 / Fix**: 添加 `integrity` 属性。

### H-06. HeroPing 组件 `apiUrl` 属性声明但未使用 / Unused `apiUrl` Property in HeroPing

- **文件 / File**: `packages/ui/src/less-hero-ping.ts:106`
- **问题 / Problem**: 组件声明了 `apiUrl` 属性但 fetch 硬编码使用外部 URL，属性无效。/ `apiUrl` property declared but fetch uses hardcoded external URL.
- **修复 / Fix**: `const r = await fetch(this.apiUrl || 'https://...');`

### H-07. HeroPing 无 AbortController，SPA 导航致重复请求 / HeroPing No AbortController — Duplicate Fetches on SPA Navigation

- **文件 / File**: `packages/ui/src/less-hero-ping.ts:96-99`
- **问题 / Problem**: `connectedCallback` 每次触发都 fetch，无 abort 机制。SPA 导航会叠加请求。/ Every `connectedCallback` triggers a fetch with no abort. SPA navigation stacks requests.
- **修复 / Fix**: 添加 `AbortController`，`disconnectedCallback` 中 abort。

### H-08. History API Monkey-Patch: `replaceState` 误标记为 `push` / `replaceState` Incorrectly Marked as `push`

- **文件 / File**: `packages/core/src/navigation.ts:47-54`
- **问题 / Problem**: `replaceState` 也设 `_lastNavWasPush = true`，导航类型判断错误。/ `replaceState` sets same flag as `pushState`, causing incorrect nav type detection.
- **修复 / Fix**: 使用三态：`_lastNavType: 'push' | 'replace' | 'back'`

### H-09. `navigate()` 回退路径未检查 `history` 可用性 / `navigate()` Fallback Missing `history` Guard

- **文件 / File**: `packages/core/src/navigation.ts:127-133`
- **问题 / Problem**: SSR 环境中 `history` 不存在直接报错。/ Direct `history` access in SSR throws `ReferenceError`.
- **修复 / Fix**: 添加 `typeof globalThis.history !== 'undefined'` 守卫。

### H-10. `renderDsd()` 使用 `performance.now()` 无 SSR 守卫 / `performance.now()` Without SSR Guard

- **文件 / File**: `packages/core/src/render-dsd.ts:112`
- **问题 / Problem**: 部分 SSR 环境无 `performance` 对象。/ Some SSR environments lack `performance` object.
- **修复 / Fix**: `typeof performance !== 'undefined' ? performance.now() : 0`

### H-11. `matchRoute()` 正则无缓存、无校验 — 潜在 ReDoS / `matchRoute()` Regex No Cache/Validation — ReDoS Risk

- **文件 / File**: `packages/core/src/navigation.ts:226-230`
- **问题 / Problem**: 路由模式未校验即构造正则，恶意模式可致灾难回溯。每次调用重新编译。/ Route pattern not validated before regex construction. Recompiled every call.
- **修复 / Fix**: 缓存编译后正则 + 校验路径字符。

### H-12. `workspace-alias.ts` 使用 `Deno.readTextFileSync` — Node.js 崩溃 / Deno-specific API Crashes in Node.js

- **文件 / File**: `packages/adapter-vite/src/workspace-alias.ts:18`
- **问题 / Problem**: Vite 插件在 Node.js 中运行，`Deno.readTextFileSync` 抛 `ReferenceError`。/ Vite runs in Node.js; `Deno.readTextFileSync` throws `ReferenceError`.
- **修复 / Fix**: 添加平台守卫，Node.js 使用 `require('node:fs').readFileSync`。

### H-13. CLI `jsrNames` 缺少 `adapterVite` 键 — 远程执行崩溃 / CLI `jsrNames` Missing `adapterVite` — Remote Crash

- **文件 / File**: `packages/create/cli.ts:91-99`
- **问题 / Problem**: 远程解析版本时 `jsrNames['adapterVite']` 为 `undefined`，fetch `@lessjs/undefined/meta` 导致 CLI 崩溃。/ `jsrNames['adapterVite']` is `undefined`, fetching `@lessjs/undefined/meta` crashes CLI.
- **修复 / Fix**: 添加 `adapterVite: 'adapter-vite'`

### H-14. CLI 未校验项目名称 — 路径穿越风险 / CLI No Project Name Validation

- **文件 / File**: `packages/create/cli.ts:258-265`
- **问题 / Problem**: 接受 `../etc`、`foo/bar` 等名称，仅靠相对路径检查兜底。/ Accepts names like `../etc`, `foo/bar`; relies only on relative path check.
- **修复 / Fix**: 添加 `/^[a-zA-Z0-9_-]+$/` 校验。

### H-15. 硬编码第三方 API URL / Hardcoded Third-party API URL

- **文件 / File**: `www/app/islands/api-consumer.ts:221`; `packages/ui/src/less-hero-ping.ts:106`
- **问题 / Problem**: `sisyphuszheng.deno.net` 非项目控制，可下线/被攻破。/ Personal domain not under project control; could go offline or be compromised.
- **修复 / Fix**: 使用 `/api` 相对路径或要求显式配置。

### H-16. 循环依赖: adapter-vite ↔ content / Circular Dependency

- **文件 / File**: `packages/adapter-vite/src/entry-renderer.ts:446` ↔ `packages/content/deno.json:14`
- **问题 / Problem**: `adapter-vite` 生成代码导入 `@lessjs/content/sitemap`，`content` 导入 `@lessjs/adapter-vite/build-context`。/ `adapter-vite` generates code importing from `content`; `content` imports from `adapter-vite`.
- **修复 / Fix**: 抽取共享类型包 `@lessjs/build-types`，或将 sitemap 生成移入 adapter-vite。

### H-17. `npx -y` 无版本锁定 — 供应链风险 / `npx -y` Without Version Pinning

- **文件 / File**: `deno.json:71-72`
- **问题 / Problem**: `npx -y` 自动下载执行未锁定版本的包。/ `npx -y` auto-downloads and executes unpinned packages.
- **修复 / Fix**: 锁定版本：`npx -y @playwright/test@1.52.0`

### H-18. `deno run -A` 权限过宽 / Overly Permissive `-A` Flag

- **文件 / File**: `deno.json:52-54`
- **问题 / Problem**: dev/build/preview 均使用 `-A`（全权限），无需 `--allow-run`。/ All tasks use `-A` (all permissions), but don't need `--allow-run`.
- **修复 / Fix**: 改用 `--allow-read --allow-write --allow-net --allow-env`

---

## 4. 一般问题（优化项）/ MEDIUM Issues (Optimization Items)

| #    | 文件 / File                                           | 问题 / Problem                                                           | 修复 / Fix                                        |
| ---- | ----------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| M-01 | `packages/core/src/html-escape.ts:45-46`              | `escapeHtml()` 中 `SafeHtml`/`UnsafeHtml` 运行时分支永远为 false，死代码 | 删除运行时检查                                    |
| M-02 | `packages/core/src/context.ts:97`                     | `parseQuery()` 中 `existing as string` 类型断言脆弱                      | 重构为 `if (Array.isArray(existing))` 分支        |
| M-03 | `packages/signals/src/sugar.ts:151-158`               | `createThemeSignal()` MutationObserver 永不 disconnect                   | 暴露 `_cleanupThemeSignal()` 测试辅助             |
| M-04 | `packages/rpc/src/index.ts:226`                       | `RpcController` 重试循环不保证 `fn()` 使用 signal                        | 文档说明或 dev 模式警告                           |
| M-05 | `packages/signals/src/sugar.ts:93`                    | `_channelTarget` 模块加载时捕获，SSR 中为 null 后不变                    | 改为懒加载 getter                                 |
| M-06 | `packages/core/src/errors.ts:32`                      | `SsrRenderError.cause` 遮蔽 `Error.cause` 内建属性                       | 重命名为 `sourceError`                            |
| M-07 | `packages/signals/src/framework.ts:64`                | `effect()` 清理函数异常被吞没                                            | 添加 `try/catch` + `log.warn`                     |
| M-08 | `packages/adapter-vite/src/index.ts:65`               | `jsrSourceCache` 无大小限制，长时 dev server 内存增长                    | 添加 max size + 清理策略                          |
| M-09 | `packages/adapter-vite/src/index.ts:140`              | JSR fetch 无超时，构建可能永久挂起                                       | 添加 `AbortController` + 30s 超时                 |
| M-10 | `packages/adapter-vite/src/ssg-postprocess.ts:30-47`  | `walkHtmlFiles` 全量同步 I/O，阻塞事件循环                               | 改用 `fs/promises` 异步                           |
| M-11 | `packages/adapter-vite/src/ssg-postprocess.ts:54`     | `<head>` 匹配正则 `[\s\S]*?` 可致回溯                                    | 改为 `[^>]*`                                      |
| M-12 | `packages/adapter-vite/src/build-context.ts:200`      | `reset()` 不清理 `_phaseTokens`，watch 模式残留旧值                      | 添加 `this._phaseTokens = {1:null,2:null,3:null}` |
| M-13 | `packages/adapter-vite/src/cli/build-client.ts:65-68` | `localIslandStrategies` 双重类型转换绕过类型系统                         | 添加到 `Phase1Meta` 正式类型或移除                |
| M-14 | `packages/adapter-vite/src/cli/ssg-render.ts`         | 混合同步/异步 fs 操作                                                    | 统一使用 `fs/promises`                            |
| M-15 | `packages/adapter-lit/src/ssr.ts:160-163`             | `unwrapDsdForNestedCe` 正则匹配嵌套 template 内层闭合标签                | 改用模板计数或 parse5                             |
| M-16 | `packages/adapter-lit/src/ssr.ts:423-425`             | 非 TemplateResult 对象静默转为 "[object Object]"                         | 添加警告 + escapeHtml                             |
| M-17 | `packages/adapter-lit/src/dsd-hydration.ts:178`       | `_hydrateEvents` 方法查找无原型污染守卫                                  | 校验 `desc.method` 不以 `__` 开头                 |
| M-18 | `packages/adapter-vite/src/cli/build-ssg.ts:392`      | `Deno.build.os`/`Deno.exit()` 在 Node.js 中报错                          | 使用 `process.platform`/`process.exit()`          |
| M-19 | `packages/content/src/index.ts:154-178`               | HMR watcher 事件监听器未清理                                             | 在 close hook 中 `server.watcher.off()`           |
| M-20 | `packages/ui/src/less-dialog.ts:278-281`              | `_handleCancel` 中 `preventDefault` + 手动关闭致双次 `close` 事件        | 检查是否已在关闭中                                |
| M-21 | `packages/ui/src/less-input.ts:160-165`               | `attachInternals()` 在 `connectedCallback` 而非构造函数调用              | 移至构造函数                                      |
| M-22 | `packages/ui/src/less-layout.ts:894-902`              | SPA 导航：fetch 内容解析后直接 appendChild，可能含事件处理器             | 移除 `<script>` 标签和 `on*` 属性                 |
| M-23 | `packages/ui/src/less-layout.ts:888-913`              | `_loadContent` 无 AbortController，快速导航竞态                          | 添加 AbortController                              |
| M-24 | `packages/i18n/src/i18n-data.ts:21-26`                | `loadI18nData` 浅拷贝不深克隆                                            | 文档说明或深克隆                                  |
| M-25 | `packages/ui/src/less-code-block.ts:221-262`          | Prism 重试定时器无最大次数，永不停止                                     | 添加 MAX_RETRIES = 20                             |
| M-26 | `packages/i18n/src/routes.ts:36-51`                   | `switchLocale` 不处理默认语言无前缀策略                                  | 添加 `defaultLocale` 参数                         |
| M-27 | `packages/content/src/nav/scanner.ts:29-33`           | `extractMeta` JSON 转换正则会破坏 URL                                    | 改用 lookbehind：`(?<=[{,]\s*)`                   |
| M-28 | `packages/ui/src/less-dialog.ts:234-268`              | 多对话框 `inert` 状态互相覆盖                                            | 使用引用计数替代布尔值                            |
| M-29 | `packages/content/src/sitemap/generator.ts:66`        | `changefreq` 未调用 `escapeXml()`                                        | 添加 `escapeXml(url.changefreq)`                  |
| M-30 | `www/app/routes/blog/[slug].ts:98`                    | `import { unsafeHTML }` 位于文件底部（use after define 位置）            | 移至顶部                                          |
| M-31 | `www/app/islands/less-term.ts:194`                    | `out.innerHTML = ''` 绕过 Lit 响应式循环                                 | 改用响应式属性管理                                |
| M-32 | `www/vite.config.ts:56-57`                            | `chunkSizeWarningLimit: 1500` 抑制合理警告                               | 降至 600 或添加代码分割                           |
| M-33 | `www/app/routes/decisions/[slug].ts:16-25`            | `extractStatus`/`adrId` 函数跨文件重复                                   | 提取到共享工具模块                                |
| M-34 | `www/app/islands/less-search.ts:195-197`              | 搜索 index 加载失败静默吞没                                              | 添加 console.warn + 用户提示                      |
| M-35 | `www/app/islands/less-search.ts:180`                  | `import('https://esm.sh/flexsearch@0.8.212')` 运行时 CDN import 无 SRI   | 作为项目依赖打包或使用 import map                 |
| M-36 | `www/e2e/playwright.config.ts:36`                     | `npx -y serve` 无版本锁定                                                | 锁定版本：`npx -y serve@14.2.0`                   |
| M-37 | `deno.json:33-47`                                     | 依赖版本策略不一致（有 `^` 有无）                                        | 统一为 `^` 策略或全量精确锁定                     |
| M-38 | `deno.json:46`                                        | `entities` 包在根 import map 声明但源码未直接使用                        | 移除                                              |
| M-39 | `deno.json:40,43`                                     | `ts-morph`/`tsx` 声明但源码未使用                                        | 移除或添加注释                                    |
| M-40 | 多个 deno.json                                        | 依赖在根和包级别重复声明                                                 | 包级别移除，统一由根提供                          |
| M-41 | `packages/content/deno.json:12`                       | `gray-matter@^4.0.3` 可能不再维护                                        | 监控安全公告，考虑 `front-matter` 替代            |
| M-42 | `www/dist/server/importmap.json`                      | 构建产物含过期版本引用且在 git 中                                        | 添加到 `.gitignore`                               |

---

## 5. 性能优化建议 / Performance Optimization

### 渲染性能 / Rendering Performance

| #    | 问题 / Issue                                        | 文件 / File                                  | 建议 / Suggestion                                         |
| ---- | --------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| P-01 | `escapeHtml()` 5 次 `replace()` 创建 5 个中间字符串 | `packages/core/src/html-escape.ts:47-52`     | 合并为单次 `replace(/[&<>"']/g, ch => MAP[ch])`           |
| P-02 | `isInsideDsdTemplate()` 每个节点遍历完整父链 O(d)   | `packages/core/src/render-nested.ts:143-159` | 递归遍历时跟踪 "inside DSD" 状态                          |
| P-03 | HeroPing 使用非响应式公共字段触发全量重渲染         | `packages/ui/src/less-hero-ping.ts:93-94`    | 声明为 `static properties` with `state: true`             |
| P-04 | LessInput `value` 不反映到 attribute                | `packages/ui/src/less-input.ts:124`          | 添加 `reflect: true`（注意：与原生 input 行为一致可不修） |

### 打包体积 / Bundle Size

| #    | 问题 / Issue                          | 文件 / File                          | 建议 / Suggestion                      |
| ---- | ------------------------------------- | ------------------------------------ | -------------------------------------- |
| P-05 | `chunkSizeWarningLimit: 1500` kB 过高 | `www/vite.config.ts:56-57`           | 降至 600 kB 或添加 `manualChunks` 分割 |
| P-06 | FlexSearch 运行时从 esm.sh CDN 加载   | `www/app/islands/less-search.ts:180` | 作为项目依赖打包，减少外部请求         |

### 请求/资源 / Requests & Resources

| #    | 问题 / Issue                                 | 文件 / File                              | 建议 / Suggestion             |
| ---- | -------------------------------------------- | ---------------------------------------- | ----------------------------- |
| P-07 | HeroPing/LessLayout fetch 无 AbortController | 多文件                                   | 添加 AbortController 取消请求 |
| P-08 | JSR fetch 无超时                             | `packages/adapter-vite/src/index.ts:140` | 添加 30s AbortController      |
| P-09 | 8 个外部 CDN 资源无 SRI                      | `www/vite.config.ts:87-151`              | 添加 integrity 属性           |

### 运行时 / Runtime

| #    | 问题 / Issue                     | 文件 / File                                  | 建议 / Suggestion        |
| ---- | -------------------------------- | -------------------------------------------- | ------------------------ |
| P-10 | `jsrSourceCache` 无大小限制      | `packages/adapter-vite/src/index.ts:65`      | 添加 max size + LRU 淘汰 |
| P-11 | Prism 重试定时器永不停止         | `packages/ui/src/less-code-block.ts:221-262` | 添加 MAX_RETRIES         |
| P-12 | MutationObserver 永不 disconnect | `packages/signals/src/sugar.ts:151-158`      | 暴露清理机制             |

---

## 6. 安全风险清单 / Security Risk Checklist

### XSS 攻击面 / XSS Attack Surface

| #      | 向量 / Vector                       | 文件 / File                                | 严重度 / Severity |
| ------ | ----------------------------------- | ------------------------------------------ | ----------------- |
| XSS-01 | Markdown HTML 未消毒                | `packages/content/src/blog/markdown.ts:36` | CRITICAL          |
| XSS-02 | `headExtras` 原始 HTML 插入         | `packages/core/src/html-escape.ts:173`     | CRITICAL          |
| XSS-03 | `unsafeHTML(post.html)`             | `www/app/routes/blog/[slug].ts:68`         | CRITICAL          |
| XSS-04 | `div.innerHTML = htmlStr`           | `www/app/islands/less-term.ts:132`         | CRITICAL          |
| XSS-05 | API 反射未转义 `cmd`                | `www/app/routes/api/term.ts:125`           | CRITICAL          |
| XSS-06 | SPA 导航 fetch 内容直接 appendChild | `packages/ui/src/less-layout.ts:894`       | MEDIUM            |
| XSS-07 | Prism innerHTML 注入                | `packages/ui/src/less-code-block.ts:283`   | MEDIUM            |

### 原型污染 / Prototype Pollution

| #     | 向量 / Vector                   | 文件 / File                                     | 严重度 / Severity |
| ----- | ------------------------------- | ----------------------------------------------- | ----------------- |
| PP-01 | `island.ts` 黑名单不完整        | `packages/core/src/island.ts:146`               | CRITICAL          |
| PP-02 | `render-dsd.ts` 无任何过滤      | `packages/core/src/render-dsd.ts:140`           | CRITICAL          |
| PP-03 | `_hydrateEvents` 方法查找无守卫 | `packages/adapter-lit/src/dsd-hydration.ts:178` | MEDIUM            |

### 敏感信息 / Sensitive Information

- ✅ 未发现硬编码 API 密钥、Token 或凭证 / No hardcoded API keys, tokens, or credentials found
- ⚠️ 硬编码第三方 API URL（非密钥但可控性问题）/ Hardcoded third-party API URL (not secret but controllability issue)

### 依赖漏洞 / Dependency Vulnerabilities

| #      | 问题 / Issue                                        | 严重度 / Severity |
| ------ | --------------------------------------------------- | ----------------- |
| DEP-01 | 锁文件固定远古版本 `@lessjs/ui@0.6.1`               | CRITICAL          |
| DEP-02 | `npx -y` 无版本锁定                                 | HIGH              |
| DEP-03 | 8 个外部 CDN 资源无 SRI                             | HIGH              |
| DEP-04 | FlexSearch 运行时 CDN import 无 SRI                 | MEDIUM            |
| DEP-05 | `gray-matter` 可能不再维护                          | MEDIUM            |
| DEP-06 | 未使用依赖 (`entities`/`ts-morph`/`tsx`) 增加攻击面 | MEDIUM            |

### 配置风险 / Configuration Risks

| #      | 问题 / Issue                             | 严重度 / Severity |
| ------ | ---------------------------------------- | ----------------- |
| CFG-01 | `deno run -A` 权限过宽                   | HIGH              |
| CFG-02 | `validateSafeUrl` 误捕异常致安全消息丢失 | HIGH              |
| CFG-03 | 构建产物 `www/dist/` 在 git 中           | MEDIUM            |
| CFG-04 | 版本策略不一致                           | MEDIUM            |

---

## 7. 代码规范与可维护性 / Code Standards & Maintainability

### 命名 / Naming

- ⚠️ `less-hero-ping.ts` 中 `_state`/`_msg` 应声明为 Lit reactive properties 而非普通字段
- ⚠️ `SsrRenderError.cause` 遮蔽 `Error.cause` 内建属性，应重命名为 `sourceError`
- ⚠️ `build-manifest.ts:173` 注释写 "100KB" 但代码为 200KB

### 注释 / Comments

- ⚠️ `island-manifest.ts:137-149` 注释声称有 BigInt fallback 但实际未实现
- ⚠️ `ssg-postprocess.ts:156` CSP 注入仅转义双引号，未处理 `>`

### 结构 / Structure

- ⚠️ 循环依赖: `adapter-vite` ↔ `content`（代码生成级）
- ⚠️ `extractStatus`/`adrId` 函数跨文件重复
- ⚠️ 依赖声明在根和包级别重复
- ⚠️ `@lessjs/create` deno.json 缺少 `compilerOptions`/`include`/`exclude`
- ⚠️ `www/deno.json` 缺少 `name` 字段

### 重复代码 / Duplicate Code

- `extractStatus`/`adrId` — `www/app/routes/decisions/[slug].ts` 和 `index.ts`
- `DANGEROUS_KEYS` 过滤逻辑 — `island.ts` 和 `render-dsd.ts` 应共享
- 依赖声明 — 根和包级别重复（hono, vite, @hono/vite-dev-server）

---

## 8. 构建/依赖风险 / Build & Dependency Risks

### 依赖冲突 / Dependency Conflicts

- 锁文件 `@lessjs/ui@0.6.1` 与工作区 `0.14.6` 不一致（**CRITICAL**）
- 版本策略混用：`vite@8.0.10`（精确）vs `hono@^4`（宽范围）

### 版本不兼容 / Version Incompatibility

- `parse5@7.0.0` 无 `^`，无法获取补丁更新
- `Deno.*` API 在 Node.js 环境中崩溃（`workspace-alias.ts`, `build-ssg.ts`, `ssg.ts`）
- CLI `jsrNames` 缺少 `adapterVite` 键致远程执行崩溃

### 打包异常点 / Build Anomalies

- `validateSafeUrl` 吞没安全异常（**HIGH**）
- 生成代码中路由路径未转义可致语法错误（**HIGH**）
- `reset()` 不清理 `_phaseTokens` 致 watch 模式残留

### 环境配置问题 / Environment Config Issues

- `deno run -A` 权限过宽
- `npx -y` 无版本锁定
- 构建产物 `www/dist/` 在 git 中
- `chunkSizeWarningLimit: 1500` 掩盖真实问题

---

## 9. 总体评分 / Overall Scoring (1-10)

| 维度 / Dimension           | 评分 / Score | 说明 / Rationale                                                                                                                                                                                                                                                                             |
| -------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 代码质量 / Code Quality    | **7/10**     | 架构设计合理，monorepo 结构清晰，Phase branded type 有亮点。主要扣分在安全相关代码（原型污染黑名单不完整、XSS 风险链）。/ Good architecture, clear monorepo, Phase branded types. Deductions for incomplete security code (prototype pollution blocklist, XSS chains).                       |
| 安全性 / Security          | **4/10**     | 5 个 CRITICAL XSS 向量 + 2 个原型污染 + SRI 缺失 + API 反射注入。框架级安全基础设施需要加固。/ 5 CRITICAL XSS vectors + 2 prototype pollution + missing SRI + reflected injection. Framework-level security needs hardening.                                                                 |
| 性能 / Performance         | **7/10**     | DSD Hydration 策略先进，Island 按需加载设计好。扣分在 `escapeHtml` 多次 replace、同步 I/O、无超时请求。/ DSD Hydration is advanced, Island lazy loading well-designed. Deductions for multi-pass escapeHtml, sync I/O, no timeouts.                                                          |
| 可维护性 / Maintainability | **7/10**     | 包职责清晰，API 表面收敛好。扣分在循环依赖、重复代码、过期锁文件、CLI 缺失配置。/ Clear package responsibilities, good API surface. Deductions for circular deps, duplicate code, stale lock, missing CLI config.                                                                            |
| **综合评分 / Overall**     | **6.3/10**   | 项目架构扎实，创新点突出（DSD + Island + 三阶段 SSG），但安全层面存在系统性短板，需要立即修复 CRITICAL 级 XSS 和原型污染问题后才能进入生产推荐。/ Solid architecture with innovative design, but systematic security gaps require immediate CRITICAL fixes before production recommendation. |

---

## 10. 最终修复优先级清单（TOP 10）/ Final Fix Priority List (TOP 10)

| 优先级 / Priority | 问题 ID / ID           | 问题 / Issue                                             | 影响 / Impact                                                   | 工作量 / Effort |
| ----------------- | ---------------------- | -------------------------------------------------------- | --------------------------------------------------------------- | --------------- |
| 🔴 1              | C-01, C-05, C-06, C-07 | XSS 攻击链：Markdown → unsafeHTML → innerHTML → API 反射 | 全站用户可被注入恶意脚本 / Full site XSS                        | 中              |
| 🔴 2              | C-03, C-04             | 原型污染：island.ts + render-dsd.ts 属性赋值             | 攻击者控制 SSR props 可覆写对象方法 / Prototype method override | 低              |
| 🔴 3              | C-02                   | `headExtras` 原始 HTML 插入无防护                        | 框架级 XSS 向量 / Framework-level XSS                           | 中              |
| 🟠 4              | H-04, H-05             | CDN 资源无 SRI                                           | CDN 被攻破 = 全站沦陷 / CDN compromise = site-wide XSS          | 低              |
| 🟠 5              | C-09                   | 锁文件过期（ui@0.6.1, @0.14.2）                          | 构建不可靠 / Unreliable builds                                  | 极低            |
| 🟠 6              | H-01                   | `validateSafeUrl` 误捕安全异常                           | 安全验证失效 / Security validation broken                       | 极低            |
| 🟡 7              | H-02, H-03             | 生成代码路径未转义 + PWA basePath 未转义                 | 特殊字符致构建/渲染失败 / Build/render failure on special chars | 低              |
| 🟡 8              | H-13                   | CLI `jsrNames` 缺 `adapterVite`                          | 远程脚手架崩溃 / Remote scaffold crash                          | 极低            |
| 🟡 9              | H-12, M-18             | Deno 专用 API 在 Node.js 环境崩溃                        | Vite 插件跨平台不兼容 / Cross-platform incompatibility          | 低              |
| 🟢 10             | H-17, H-18             | `npx -y` 无版本锁定 + `deno run -A` 权限过宽             | 供应链风险 + 权限溢出 / Supply chain + permission overreach     | 极低            |

---

> **审核结论 / Audit Conclusion**: LessJS 架构创新（DSD + Island + 三阶段 SSG 管线）技术含量高，代码组织合理，但在安全层面存在 **5 个 CRITICAL XSS 向量 + 2 个原型污染漏洞**，构成系统性风险。建议在 **1 周内完成 TOP 5 修复**，2 周内完成全部 CRITICAL + HIGH 修复，之后可进入生产推荐状态。
>
> The architecture is innovative and well-organized, but **5 CRITICAL XSS vectors + 2 prototype pollution vulnerabilities** represent a systematic security gap. Recommend completing TOP 5 fixes within **1 week**, all CRITICAL + HIGH within 2 weeks, after which the project can enter production recommendation status.
