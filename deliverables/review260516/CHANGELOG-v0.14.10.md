# LessJS v0.14.10 变更日志 / Changelog

**日期 / Date**: 2026-05-16
**上一版本 / Previous Version**: v0.14.9
**范围 / Scope**: 安全加固 + 构建管线修复 + 运行时健壮性 + 代码卫生 / Security hardening + build pipeline fixes + runtime robustness + code hygiene

---

## 🔴 CRITICAL 严重修复（3 项）/ CRITICAL Fixes (3 items)

### S1: Markdown HTML 消毒器从正则替换为 `sanitize-html` 允许列表 / Replace regex sanitizer with `sanitize-html` allow-list

- **文件 / Files**: `packages/content/src/blog/markdown.ts`, `packages/content/src/blog/markdown.test.ts`, `packages/content/deno.json`
- **问题 / Problem**: 博客 markdown 渲染使用正则 `/<script[\s\S]*?<\/script>/gi` 剥离危险标签 — 可被 `<img src=x onerror=alert(1)>`、`<svg onload=...>` 等绕过 / Blog markdown rendering used regex to strip dangerous tags — bypassable via event handlers on `<img>`, `<svg>`, etc.
- **修复 / Fix**:
  - 引入 `sanitize-html@^2.17.4`，使用严格的标签/属性/URL scheme 允许列表 / Introduced `sanitize-html` with strict tag/attribute/URL-scheme allow-list
  - 自定义 `transformTags` 强制 `target=_blank` 链接添加 `rel=noopener noreferrer` / Added `rel=noopener noreferrer` enforcement for `target=_blank` links
  - 自定义 markdown 渲染器输出默认消毒，`trustedHtml: true` 可跳过 / Custom markdown renderer output sanitized by default; `trustedHtml: true` bypasses
  - 新增 10 个 XSS 回归测试 / Added 10 XSS regression tests

### S2: SSR 虚拟入口残留公开 dist / SSR virtual entry leaked to public dist

- **文件 / Files**: `packages/adapter-vite/src/build.ts`
- **问题 / Problem**: `closeBundle` 阶段的 `_virtual_less-hono-entry-*.js`（~1.4 MB）和 `src-*.js` 残留在 `dist/assets/`，部署到静态托管后暴露 SSR 源码 / Phase 1 SSR virtual entry (~1.4 MB) and source maps leaked to `dist/assets/`, exposing SSR source on static hosting
- **修复 / Fix**: 在 `closeBundle` 尾部添加清理逻辑，删除 `dist/assets/` 下的 `_virtual_less-hono-entry*` 和 `src-*.js` / Added cleanup in `closeBundle` tail to remove virtual entry and source maps from `dist/assets/`

### S3: i18n 路由前缀重复 `/en/zh/`、`/zh/zh/` / i18n route prefix duplication

- **文件 / Files**: `packages/adapter-vite/src/cli/ssg-render.ts`
- **问题 / Problem**: SSG 渲染 i18n 变体时，已含语言前缀的路由（如 `/zh/guide/dsd`）被再次添加前缀 → `/en/zh/guide/dsd` / Routes already under a locale prefix were re-prefixed during i18n rendering
- **修复 / Fix**: 添加跳过逻辑 — 若路由路径已以 `/en/` 或 `/zh/` 开头，则不再添加语言前缀 / Added skip logic for routes already under a locale prefix

---

## 🟠 HIGH 高优先级修复（6 项）/ HIGH Fixes (6 items)

### H1: Hono 升级至 4.12.18 / Upgrade Hono to 4.12.18

- **文件 / Files**: `deno.json`, `deno.lock`
- **问题 / Problem**: Hono 版本过旧，缺少安全修补 / Hono version outdated, missing security patches
- **修复 / Fix**: 升级 `hono` 至 `^4.12.18` / Upgraded to `^4.12.18`

### H3: term API 输入校验 / term API input validation

- **文件 / Files**: `www/app/routes/api/term.ts`
- **问题 / Problem**: `POST /api/term` 的 JSON body 解析无 try/catch — 畸形请求导致 500；`cmd` 参数无类型检查 / JSON body parsing without try/catch — malformed requests cause 500; no `typeof cmd` validation
- **修复 / Fix**: 添加 JSON 解析 try/catch 和 `typeof cmd === 'string'` 校验 / Added JSON parse try/catch and `typeof cmd` validation; neofetch version bumped to 0.14.9

### H4: 构建时 CORS credentials 拦截 / Build-time CORS credentials check

- **文件 / Files**: `packages/adapter-vite/src/entry-renderer.ts`
- **问题 / Problem**: `origin: '*' + credentials: true` 是无效的 CORS 配置，但构建时不报错 / Invalid CORS config `origin: '*' + credentials: true` not caught at build time
- **修复 / Fix**: 在 `entry-renderer.ts` 添加构建时检查，拒绝不安全组合 / Added build-time check rejecting unsafe `origin: '*' + credentials: true`

### H5: FlexSearch 本地打包 / FlexSearch local bundling

- **文件 / Files**: `www/app/islands/less-search.ts`, `deno.json`
- **问题 / Problem**: FlexSearch 通过 `esm.sh` 运行时 `import()` 加载 — 网络不稳定时搜索不可用，且有供应链风险 / FlexSearch loaded via `esm.sh` runtime import — search unavailable on network issues, supply chain risk
- **修复 / Fix**: 通过 `deno.json` import map 将 `flexsearch` 映射到 `npm:flexsearch@0.8.212`，改为构建时打包 / Mapped via import map to `npm:flexsearch@0.8.212`, bundled at build time; added `_loaded` reset on failure

### H6: Island 组件 AbortController + 清理 / Island AbortController + cleanup

- **文件 / Files**: `www/app/islands/api-consumer.ts`, `www/app/islands/less-term.ts`, `www/app/islands/less-toc.ts`
- **问题 / Problem**: Island 组件的 `fetch()` 请求在组件从 DOM 移除后仍继续运行 — 内存泄漏和 stale 回调 / Island `fetch()` requests continued after component removal — memory leak and stale callbacks
- **修复 / Fix**:
  - `api-consumer.ts` / `less-term.ts`: 添加 `private _abortController = new AbortController()`，`fetch()` 传入 `signal`，`disconnectedCallback` 调用 `abort()` / Added `AbortController`, passed `signal` to fetch, abort on disconnect
  - `less-toc.ts`: 添加 `private _retryTimer`，`disconnectedCallback` 调用 `clearTimeout()` / Added timer tracking, clear on disconnect

### entities 解析修复（CI 热修复）/ entities resolution hotfix

- **文件 / Files**: `deno.json`, `packages/adapter-vite/src/cli/build-ssg.ts`
- **问题 / Problem**: G6 修复移除 `entities` 导入映射后，`parse5@7` 的子路径导入 `entities/lib/escape.js` 在 Rolldown SSR 构建中无法解析 → CI 全红 / After G6 removed `entities` from import map, `parse5`'s subpath import `entities/lib/escape.js` failed in Rolldown SSR build → CI fully red
- **修复 / Fix**: 恢复 `"entities": "npm:entities@^4"` 到 `deno.json`；添加 `'entities': 'npm:entities@4'` 到 SSG importMap / Restored `entities` import map entry; added to SSG importMap

---

## 🟡 MEDIUM 中等修复（6 项）/ MEDIUM Fixes (6 items)

### G2: 版本号同步 / Version sync

- **文件 / Files**: `README.md`, `README.en.md`, `www/app/routes/roadmap.ts`
- **问题 / Problem**: README 和 roadmap 中多处版本引用仍为旧版 / Multiple version references in README and roadmap were outdated
- **修复 / Fix**: 统一同步至 `0.14.9` / Synced all version references to `0.14.9`

### G3: DevTools 乱码修复 / DevTools garbled strings

- **文件 / Files**: `packages/adapter-vite/src/devtools/index.ts`
- **问题 / Problem**: DevTools 面板中 Unicode 字符显示为乱码：`鉁?`→`✓`，`鈩?`→`⚠`，`鈴?`→`🔧` / Unicode characters displayed as garbled text in DevTools panel
- **修复 / Fix**: 替换所有乱码字符串为正确 Unicode / Replaced all garbled strings with correct Unicode

### G4: theme-init.js 隐私模式安全 / theme-init.js private browsing safety

- **文件 / Files**: `www/public/theme-init.js`
- **问题 / Problem**: `localStorage.getItem()` 和 `matchMedia()` 在隐私浏览模式/受限 WebView 中抛出异常 / Throws in private browsing / restricted WebView
- **修复 / Fix**: 在 IIFE 中用 try/catch 包裹所有存储和媒体查询调用 / Wrapped all storage and media query calls in try/catch within IIFE

### G7: less-code-block 安全注释 / less-code-block security comment

- **文件 / Files**: `packages/ui/src/less-code-block.ts`
- **问题 / Problem**: `innerHTML` 赋值缺少安全上下文说明 / `innerHTML` assignment missing security context
- **修复 / Fix**: 添加注释说明 innerHTML 安全性（仅接受 Prism 输出）/ Added comment explaining innerHTML is safe (Prism output only)

### G8: DevTools 按需扫描 / DevTools scan-on-demand

- **文件 / Files**: `packages/adapter-vite/src/devtools/index.ts`
- **问题 / Problem**: DevTools 面板在打开时立即触发扫描 — 不必要的资源消耗 / DevTools panel triggered scan immediately on open
- **修复 / Fix**: 改为面板默认关闭，仅用户手动打开时扫描 / Changed panel to start closed; scan only on explicit toggle open

### G9: 构建体积断言测试 / Build output size assertions

- **文件 / Files**: `www/__tests__/build-output.test.ts`
- **问题 / Problem**: 无自动化测试防止 SSR 产物泄露到公开 dist 或客户端 JS 体积膨胀 / No automated test to prevent SSR artifacts in public dist or client JS bloat
- **修复 / Fix**: 新增两个断言测试：
  1. `dist/assets/` 中不含 `_virtual_less-hono-entry` / No Hono virtual entry in public assets
  2. `dist/client/` JS 总量 < 200KB / Client island JS total under 200KB

---

## 🟢 LOW 低优先级修复（2 项）/ LOW Fixes (2 items)

### H2: E2E 跨平台命令 / E2E cross-platform command

- **文件 / Files**: `deno.json`
- **问题 / Problem**: `test:e2e` 使用 `./node_modules/.bin/playwright` — 仅 Unix 兼容 / Used `./node_modules/.bin/playwright` — Unix only
- **修复 / Fix**: 改为 `deno run -A npm:@playwright/test@1.59.1` / Changed to `deno run -A npm:@playwright/test@1.59.1`

### G13: CI `deno audit` 门禁 / CI `deno audit` gate

- **文件 / Files**: `.github/workflows/test.yml`
- **问题 / Problem**: CI 无依赖审计步骤 / No dependency audit step in CI
- **修复 / Fix**: 新增 `audit` job 运行 `deno audit` / Added `audit` job running `deno audit`

---

## 🔧 测试修复 / Test Fix

### ssg-smoke test: 适配 S2 产物清理 / Adapt to S2 artifact cleanup

- **文件 / Files**: `packages/adapter-vite/__tests__/ssg-smoke.test.ts`
- **问题 / Problem**: `hasSsrBundle()` 检查 `dist/assets/_virtual_less-hono-entry-*.js`，但 S2 修复已将其从构建输出中删除 / Checked for `_virtual_less-hono-entry-*.js` in `dist/assets/`, but S2 fix removes it
- **修复 / Fix**: 改用 `hasServerEntry()` 检查 `dist/server/entry.js` / Changed to check `dist/server/entry.js`

---

## ⏭️ 延后至 v0.14.11+（5 项）/ Deferred to v0.14.11+ (5 items)

| ID | 原因 / Reason |
|----|---------------|
| G1 | `deno fmt` 对路由文件的 panic 需 Deno 上游修复 / `deno fmt` panic on route files needs upstream fix |
| G5 | nav scanner 正则 → AST 解析需引入 ts-morph 或编写简易解析器 / nav scanner regex → AST needs ts-morph or custom parser |
| G10 | adapter-vite ↔ content 循环依赖需包结构重组 / Circular dep requires package restructuring |
| G11 | term API 去重需抽取共享模块 / Term API dedup needs shared module |
| G12 | lint 收紧需逐文件审计 / Lint tightening needs file-by-file audit |

---

## 📁 修改文件清单 / Modified Files

```
deno.json
deno.lock
.github/workflows/test.yml
packages/adapter-vite/src/build.ts
packages/adapter-vite/src/cli/build-ssg.ts
packages/adapter-vite/src/cli/ssg-render.ts
packages/adapter-vite/src/entry-renderer.ts
packages/adapter-vite/src/devtools/index.ts
packages/adapter-vite/__tests__/ssg-smoke.test.ts
packages/content/src/blog/markdown.ts
packages/content/src/blog/markdown.test.ts
packages/content/deno.json
packages/ui/src/less-code-block.ts
www/app/islands/api-consumer.ts
www/app/islands/less-search.ts
www/app/islands/less-term.ts
www/app/islands/less-toc.ts
www/app/routes/api/term.ts
www/public/theme-init.js
www/__tests__/build-output.test.ts
README.md
README.en.md
www/app/routes/roadmap.ts
```

---

## ✅ 验证 / Verification

- `deno task build` ✅ 通过（298 页 SSG + 175KB 客户端 islands）/ Pass (298 pages SSG + 175KB client islands)
- `deno task test` ✅ 通过（493 测试全绿）/ Pass (493 tests all green)
- `deno task typecheck` ✅ 通过 / Pass
- `deno lint` ✅ 通过 / Pass

---

*变更日志生成 / Changelog generated: 2026-05-16T08:10+08:00*
