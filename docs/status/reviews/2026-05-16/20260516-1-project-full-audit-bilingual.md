# 项目全面审核报告

> 审核时间 / Review date: 2026-05-16\
> 审核范围 / Scope: 当前仓库前端源码、Deno workspace 包、站点路由、islands、构建配置、CI 配置、生成产物抽样。排除第三方依赖目录 `node_modules/`、`vendor/`、历史 `deliverables/` 和临时构建目录作为源码扫描对象。\
> 验证命令 / Commands run: `deno task typecheck`, `deno task lint`, `deno task fmt:check`, `deno task test`, `deno task build`, `deno audit --ignore-registry-errors`, `deno outdated`, `deno fmt --check www/app/routes`, `deno task test:e2e`, `.\node_modules\.bin\playwright.cmd test --config www/e2e/playwright.config.ts`.

## 1. 项目概况

- 项目类型：Deno-first monorepo 静态站点框架 + 文档站 + Web Components 组件库。\
  Project type: Deno-first monorepo containing an SSG framework, docs site, and Web Components UI packages.
- 主框架：LessJS 自研 DSD/Island 架构；站点侧使用 Vite、Lit、Hono、Web Components。\
  Main stack: custom LessJS DSD/islands runtime with Vite, Lit, Hono, and Web Components.
- 入口文件：根任务在 `deno.json:67-91`；站点配置在 `www/vite.config.ts:1-17`；构建 CLI 在 `packages/adapter-vite/src/cli/build.ts:13-20`；Vite 插件入口在 `packages/adapter-vite/src/index.ts:390-399`；首页路由在 `www/app/routes/index/index.ts`。\
  Entry points: root tasks in `deno.json:67-91`, site config in `www/vite.config.ts:1-17`, build CLI in `packages/adapter-vite/src/cli/build.ts:13-20`, Vite plugin virtual entry in `packages/adapter-vite/src/index.ts:390-399`, homepage route in `www/app/routes/index/index.ts`.
- 代码规模（估算）：179 个 JS/TS 源码文件，约 30,790 行；生成后 `www/dist` 有 297 个 HTML、约 19.95 MB HTML、约 23.38 MB 总产物。\
  Estimated scale: 179 JS/TS source files, about 30,790 lines; generated `www/dist` contains 297 HTML files, about 19.95 MB HTML and 23.38 MB total output.
- 构建工具：Deno 2.7.14、Vite 8.0.10、Deno fmt/lint/test/check、Playwright 1.59.1。\
  Build tools: Deno 2.7.14, Vite 8.0.10, Deno fmt/lint/test/check, Playwright 1.59.1.
- 当前验证结果：`typecheck` 通过；`lint` 通过 179 文件；根 `fmt:check` 通过但排除了 `www/app/routes/`；单元测试 481 passed；生产构建通过；Playwright `.cmd` 入口 92 passed；`deno audit` 发现 3 个 Hono 漏洞；根 `deno task test:e2e` 在 Windows 失败。\
  Current validation: typecheck passed; lint passed 179 files; root fmt passed but excludes `www/app/routes/`; unit tests passed 481 tests; production build passed; Playwright via `.cmd` passed 92 tests; `deno audit` found 3 Hono advisories; root `deno task test:e2e` fails on Windows.

## 2. 严重问题（必须立即修复）

- 问题1：Markdown HTML 正则清洗可被绕过，随后被 `unsafeHTML` 直接渲染。\
  Issue 1: Regex-based Markdown sanitization can be bypassed, then rendered through `unsafeHTML`.
  - 位置 / Location: `packages/content/src/blog/markdown.ts:17-28`, `packages/content/src/blog/markdown.ts:53-60`, `www/app/routes/blog/[slug].ts:11`, `www/app/routes/blog/[slug].ts:69`, `www/app/routes/blog/[slug].ts:90`, `www/app/routes/decisions/[slug].ts:206`, `packages/adapter-lit/src/ssr.ts:190-213`.
  - 原因 / Cause: `sanitizeHtml()` 只用正则删除少量标签和 `on*` 属性，只处理带引号的 `javascript:`；自定义 `options.markdown` 路径完全不再清洗。实际验证中 `<a href=javascript:alert(1)>x</a>` 和 `<a href="javas&#99;ript:alert(1)">x</a>` 仍保留在输出 HTML 中。
  - 风险 / Risk: 任何进入 `www/content/blog/` 或 ADR 内容的数据，只要被 PR、脚本或供应链污染，就会变成存储型 XSS；`unsafeHTML(post.html)` 会让浏览器执行危险链接或后续 HTML payload。
  - 修复方案 / Fix: 用真正的 HTML allow-list sanitizer 替换正则，例如 `npm:sanitize-html@^2`，只允许 `p,a,code,pre,ul,ol,li,h1-h6,blockquote,strong,em,table` 等标签；`href/src` 只允许 `http/https/mailto/#/relative`；自定义 `options.markdown` 输出也默认再清洗，除非显式 `trustedHtml: true`。新增测试覆盖未加引号 URL、HTML entity 编码、SVG/MathML、`data:` URL 和自定义 renderer。

- 问题2：生产构建把 Hono 虚拟入口大包残留到公开静态目录。\
  Issue 2: Production build leaves the Hono virtual entry bundle in the public static output.
  - 位置 / Location: `packages/adapter-vite/src/cli/build.ts:17`, `packages/adapter-vite/src/index.ts:390-399`, `packages/adapter-vite/src/index.ts:521-544`, `packages/adapter-vite/src/build.ts:118-129`, generated artifact `www/dist/assets/_virtual_less-hono-entry-D-OexBcT.js`.
  - 原因 / Cause: 顶层 `viteBuild({ configLoader: 'native' })` 会先产出 `virtual:less-hono-entry` 到 `www/dist/assets/`；后续 Phase 3/Phase 2 没有清理根 `dist/assets`。本次构建后该文件约 1,407.7 KB，且 `www/dist/index.html:1990` 只引用 `/client/islands/client.js`，说明该大包未被页面需要。
  - 风险 / Risk: 部署包多出 1.4 MB 未使用 JS，还公开了完整 Hono 路由、页面内容和构建时代码；CDN 会同步无用大文件，增加泄露面和部署成本。
  - 修复方案 / Fix: 将 Phase 1 的 Vite 输出改到临时目录，例如 `dist/.less-phase1`，SSG 完成后删除；或在 `closeBundle` 结束时删除 `assets/_virtual_less-hono-entry-*` 和伴随 `assets/src-*`，并加构建测试断言 `www/dist/assets/_virtual_less-hono-entry*.js` 不存在。

- 问题3：i18n 会把已经带 locale 前缀的路由再次套前缀，生成 `/en/zh/...` 和 `/zh/zh/...`。\
  Issue 3: i18n expansion prefixes already-localized routes again, generating `/en/zh/...` and `/zh/zh/...`.
  - 位置 / Location: `packages/adapter-vite/src/cli/ssg-render.ts:333-389`, `www/app/routes/zh/decisions/20260515-1-renderer-kernel-registry-sop.ts:15`, `www/app/routes/zh/decisions/20260515-1-renderer-kernel-registry-sop.ts:79-86`.
  - 原因 / Cause: i18n 循环对 `routeInfo` 的所有路由执行 `joinUrlPath(locale, resolvedPath)`，没有跳过已在 `routes/zh/` 下声明的路由。
  - 风险 / Risk: 生成重复页面、错误 sitemap/SEO URL、产物膨胀。本次构建日志明确出现 `/en/zh/decisions/...` 和 `/zh/zh/decisions/...`。
  - 修复方案 / Fix: 在 `ssg-render.ts:340` 后增加跳过逻辑：如果 `route.path` 已以任一配置 locale 前缀开头，则不再自动扩展；更稳妥是扫描阶段给路由加 `localeScope` 字段，只对无 locale scope 的 canonical routes 做扩展。新增测试断言构建产物不存在 `/en/zh/`、`/zh/zh/`。

## 3. 高危问题（建议尽快修复）

- 问题1：依赖审计失败，`hono@4.12.16` 命中 3 个公告。\
  Issue 1: Dependency audit fails because `hono@4.12.16` has 3 advisories.
  - 位置 / Location: `deno.json:51-52`, `deno.lock:17`, `deno.lock:25`, `deno.lock:824`.
  - 原因 / Cause: `deno audit --ignore-registry-errors` 报告 Hono `<4.12.18` 存在 2 个 moderate、1 个 low 漏洞。
  - 风险 / Risk: 当前 CI/发布流程没有审计门禁，安全补丁可能被漏发。
  - 修复方案 / Fix: 将 `hono` 锁到 `npm:hono@^4.12.18`，同步 `@hono/vite-dev-server` 后运行 `deno update hono @hono/vite-dev-server`、`deno task test`、`deno task build`、`deno audit`。

- 问题2：根 E2E 命令在 Windows 失败，但仓库当前工作环境就是 Windows。\
  Issue 2: Root E2E task fails on Windows while this workspace is Windows.
  - 位置 / Location: `deno.json:86`, `.github/workflows/test.yml:181-200`.
  - 原因 / Cause: `./node_modules/.bin/playwright` 是 Unix 风格入口；本机执行报 `%1 不是有效的 Win32 应用程序`。改用 `.\node_modules\.bin\playwright.cmd test --config www/e2e/playwright.config.ts` 后 92 passed。
  - 风险 / Risk: 本地开发者会以为 E2E 坏了，或跳过浏览器验证；Windows CI 会失败。
  - 修复方案 / Fix: 改成跨平台命令：`deno run -A npm:@playwright/test@1.59.1 test --config www/e2e/playwright.config.ts`，或新增 `test:e2e:win` 并在 README/CI 中明确。

- 问题3：`www` 的 terminal API 没有运行时输入校验，坏 JSON 或非字符串 `cmd` 会 500。\
  Issue 3: The `www` terminal API lacks runtime input validation; malformed JSON or non-string `cmd` can throw 500.
  - 位置 / Location: `www/app/routes/api/term.ts:68-70`; 对比已有稳健实现 / compare safer implementation: `functions/api/term.ts:86-97`.
  - 原因 / Cause: `c.req.json<{ cmd: string }>()` 只是 TypeScript 标注，不校验真实请求体；`body.cmd?.trim()` 在 `cmd` 为数字/对象时会抛错。
  - 风险 / Risk: 任意坏请求造成 500，日志噪声增加，也影响 demo API 可用性。
  - 修复方案 / Fix: 复用 `functions/api/term.ts` 的 try/catch；运行时判断 `typeof body.cmd === 'string'`，否则返回 400 `{ output: ['invalid command'] }`。

- 问题4：CORS 生成器允许调用方传入 `'*'` 且固定 `credentials: true`。\
  Issue 4: CORS generator allows caller-supplied `'*'` while always setting `credentials: true`.
  - 位置 / Location: `packages/adapter-vite/src/entry-renderer.ts:47-53`, `packages/adapter-vite/src/entry-renderer.ts:71-88`.
  - 原因 / Cause: 默认路径限制 localhost，但显式 `middleware.corsOrigin: '*'` 会生成 `origin: "*"` 和 `credentials: true` 的组合。
  - 风险 / Risk: 浏览器会拒绝这类 CORS 响应；开发者可能误以为跨域凭证已安全启用。
  - 修复方案 / Fix: 如果 `credentials: true` 且 origin 为 `'*'`，构建期直接抛错；或让 `credentials` 可配置，默认 false，仅白名单 origin 时允许 true。

- 问题5：`less-search` 运行时从 `esm.sh` 动态加载 FlexSearch，绕过构建锁定和 SRI。\
  Issue 5: `less-search` dynamically imports FlexSearch from `esm.sh`, bypassing build-time lock and SRI.
  - 位置 / Location: `www/app/islands/less-search.ts:174-181`.
  - 原因 / Cause: 浏览器运行时直接 `import('https://esm.sh/flexsearch@0.8.212')`；`www/vite.config.ts:38-88` 对 CDN script 有 SRI，但这个动态 import 没有 SRI，也不进 Vite bundle。
  - 风险 / Risk: 外部网络不可用时搜索永久失败；供应链变更不经过 lockfile；CSP 很难精确约束。
  - 修复方案 / Fix: 将 FlexSearch 加到 `deno.json` import map，例如 `"flexsearch": "npm:flexsearch@0.8.212"`，在 island 中 `import('flexsearch')`，让 Vite 打包进搜索 chunk；失败时把 `_loaded` 复位允许重试。

- 问题6：多个 island 发起请求或定时任务后没有断开保护。\
  Issue 6: Several islands start requests/timers without disconnect guards.
  - 位置 / Location: `www/app/islands/api-consumer.ts:225-267`, `www/app/islands/less-term.ts:236-244`, `www/app/islands/less-toc.ts:70-90`.
  - 原因 / Cause: `api-consumer` 和 `less-term` 没有 `AbortController`；`less-toc` 的 `setTimeout` 没有保存并在 `disconnectedCallback` 清理。
  - 风险 / Risk: SPA 导航或组件移除后仍可能更新已断开的元素，造成无效渲染、日志噪声和边界 bug。
  - 修复方案 / Fix: 参考 `packages/ui/src/less-hero-ping.ts:104-129`，为请求加 `AbortController`；为 TOC 保存 timeout id 并在断开时 `clearTimeout`。

## 4. 一般问题（优化项）

- 问题1：根 `fmt:check` 排除了大量页面路由，单独检查路由目录失败并触发 Deno formatter panic。\
  Issue 1: Root fmt excludes route pages; targeted route formatting fails and triggers a Deno formatter panic.
  - 位置 / Location: `deno.json:90-91`, `www/app/routes/api/term.ts:7`, `www/app/routes/api/term.ts:14-18`, `www/app/routes/api/term.ts:68-75`, `www/app/routes/api/term.ts:137-141`.
  - 原因 / Cause: `www/app/routes/` 被排除，至少 `api/term.ts` 仍是双引号风格；`deno fmt --check www/app/routes` 输出格式 diff 后触发 Deno 2.7.14/dprint panic。
  - 风险 / Risk: 页面源码风格和根配置脱节，PR 容易混入不可格式化文件。
  - 修复方案 / Fix: 先格式化 `www/app/routes/api/term.ts`；将路由目录拆成可格式化清单，逐步移出 ignore；对触发 panic 的文件单独最小复现并升级 Deno 或临时精确 ignore。

- 问题2：版本信息不同步。\
  Issue 2: Version information is inconsistent.
  - 位置 / Location: `packages/core/deno.json:3`, `packages/adapter-vite/deno.json:3`, `packages/ui/deno.json:3` 均为 `0.14.9`；`README.md:40-49` 写 `0.14.7`；`README.en.md:39-48` 写 `0.14.6`；`www/app/routes/roadmap.ts:168` 和 `www/app/routes/roadmap.ts:407` 写 `0.14.6`。
  - 原因 / Cause: 发布版本、README、roadmap 没有同一个生成源。
  - 风险 / Risk: 用户安装和发布沟通混乱，也会影响 JSR 发布判断。
  - 修复方案 / Fix: 增加 `deno task verify:versions`，读取所有 `packages/*/deno.json`，校验 README、roadmap、changelog 中的当前版本；失败则阻止 publish。

- 问题3：DevTools 面板存在真实乱码。\
  Issue 3: DevTools panel contains corrupted display text.
  - 位置 / Location: `packages/adapter-vite/src/devtools/index.ts:191`, `packages/adapter-vite/src/devtools/index.ts:195`.
  - 原因 / Cause: `鉁?Native`、`鈩癸笍 History API fallback` 等字符串已经损坏。
  - 风险 / Risk: 开发者工具可读性差，截图/文档会显得不专业。
  - 修复方案 / Fix: 改成 ASCII 或正确 Unicode：`Native`, `Polyfill`, `Supported`, `History API fallback`；加一个字符串快照测试。

- 问题4：`theme-init.js` 没有处理 `localStorage` 或 `matchMedia` 异常。\
  Issue 4: `theme-init.js` does not guard `localStorage` or `matchMedia`.
  - 位置 / Location: `www/public/theme-init.js:7-8`; 对比组件内已有保护 / compare guarded component: `packages/ui/src/less-theme-toggle.ts:149-189`.
  - 原因 / Cause: 头部同步脚本直接访问 `localStorage.getItem` 和 `globalThis.matchMedia(...).matches`。
  - 风险 / Risk: 隐私模式、禁用存储或旧 WebView 可能在首屏脚本抛错，导致 anti-flash cloak 不被移除。
  - 修复方案 / Fix: 用 try/catch 包住存储读取，`globalThis.matchMedia?.(...)` 可选调用；无能力时回退 light/dark 并继续移除 cloak。

- 问题5：nav meta 解析用正则把 JS 对象“改成 JSON”。\
  Issue 5: nav meta parsing rewrites JS object literals into JSON with regex.
  - 位置 / Location: `packages/content/src/nav/scanner.ts:24-37`.
  - 原因 / Cause: 只能处理简单对象；字符串里包含冒号、逗号、单引号或嵌套结构时容易误解析。
  - 风险 / Risk: 文档导航元数据一复杂就 silently 丢失或报错。
  - 修复方案 / Fix: 既然根 `deno.json:53` 已声明 `ts-morph`，要么删除不用的依赖，要么用 AST 解析 `export const meta`；至少新增包含冒号、单引号、数组的测试。

- 问题6：部分直接依赖可能未被源码使用。\
  Issue 6: Some direct dependencies appear unused in source.
  - 位置 / Location: `deno.json:53`, `deno.json:56`, `deno.json:59`.
  - 原因 / Cause: 本次 `rg` 未发现源码直接 import `ts-morph`、`tsx`、`entities`；`entities` 是 `parse5` 的传递依赖，不一定需要根 import。
  - 风险 / Risk: import map 越大，更新和安全审计噪声越大。
  - 修复方案 / Fix: 确认没有隐藏使用后移除根 import；若用于未来 AST，补上实际使用和测试。

## 5. 性能优化建议

- 渲染性能：修复 `packages/adapter-vite/src/cli/ssg-render.ts:333-389` 的重复 locale 生成，先减少无效 HTML；`packages/adapter-vite/src/devtools/index.ts:129` 只在用户点击刷新时扫描，避免每次打开全量 `querySelectorAll('*')`。\
  Rendering: fix duplicate locale generation first; scan DevTools only on explicit refresh instead of full `querySelectorAll('*')` on every open.
- 打包体积：删除 `www/dist/assets/_virtual_less-hono-entry-D-OexBcT.js` 这类未引用大包；构建后加体积断言：根 `dist/assets` 不应包含 Hono entry，client island JS 总量继续保持低于 200 KB。\
  Bundle size: remove unreferenced Hono virtual entry bundles from public assets; add a post-build assertion for no root Hono entry and keep client islands under 200 KB.
- 请求/资源：把 `www/app/islands/less-search.ts:179-180` 的远程 FlexSearch 改为本地 bundle；对 `www/app/islands/api-consumer.ts:239`、`www/app/islands/less-term.ts:237` 加 abort 和超时。\
  Requests/resources: bundle FlexSearch locally; add abort and timeout handling to API-consuming islands.
- 运行时：`packages/ui/src/less-code-block.ts:225-293` 依赖 Prism 输出再 `innerHTML` 注入，建议只对受信 Prism 输出使用，并加测试确认 raw code 中的 HTML 不会出现在最终 DOM。\
  Runtime: `less-code-block` injects Prism output via `innerHTML`; keep it trusted-only and add tests proving raw code HTML is not executed.

## 6. 安全风险清单

- XSS：最高风险是 `packages/content/src/blog/markdown.ts:17-28` 的正则 sanitizer 与 `www/app/routes/blog/[slug].ts:69/90`、`www/app/routes/decisions/[slug].ts:206` 的 `unsafeHTML` 组合。`packages/ui/src/less-code-block.ts:293`、`packages/adapter-vite/src/devtools/index.ts:103/200`、`packages/adapter-vite/src/ssg-postprocess.ts:189` 也使用 `innerHTML`，目前大多为框架生成或开发工具路径，但应保留测试和注释边界。\
  XSS: the highest risk is Markdown regex sanitization plus `unsafeHTML`; other `innerHTML` uses are mostly generated/trusted paths but need boundary tests.
- 敏感信息：未发现 API key、私钥、密码硬编码。`www/vite.config.ts:83-87` 的 GoatCounter 站点地址是公开统计配置，不是密钥。\
  Secrets: no hardcoded API keys, private keys, or passwords found. GoatCounter config is public analytics metadata.
- 依赖漏洞：`deno audit` 当前失败，`hono@4.12.16` 需要升级到 `4.12.18+`。\
  Dependency vulnerabilities: `deno audit` fails; upgrade Hono to `4.12.18+`.
- 配置风险：`www/vite.config.ts:38-88` 使用多个外部 CDN 脚本，已有 SRI；但 `www/app/islands/less-search.ts:180` 的动态 import 没有 SRI。`packages/adapter-vite/src/entry-renderer.ts:52-76` 的 CORS 组合需阻止 `'*' + credentials`。\
  Config risk: CDN scripts mostly have SRI, but dynamic import lacks SRI; CORS should reject `'*' + credentials`.

## 7. 代码规范与可维护性

- 命名：整体包命名清晰，`@openelement/core`、`adapter-vite`、`content`、`i18n` 边界明确；但版本号在 package/docs/roadmap 之间漂移，发布语义不可维护。\
  Naming: package boundaries are clear, but version drift makes release semantics hard to maintain.
- 注释：很多注释记录修复编号，利于追溯；但 `packages/adapter-vite/src/devtools/index.ts:40/49/191/195` 仍有乱码，降低可信度。\
  Comments: fix-history comments are useful, but corrupted DevTools strings reduce credibility.
- 结构：核心 runtime 与 Vite adapter 拆分合理；但 `packages/adapter-vite/src/entry-renderer.ts:19` 已承认 adapter-vite/content 循环依赖，仍建议抽出 `@openelement/build-types` 或把 sitemap 构建责任收回 adapter。\
  Structure: runtime/build split is sound; the known adapter/content cycle should be resolved by extracting build types or moving sitemap responsibility.
- 重复代码：`functions/api/term.ts:86-97` 已有健壮 JSON 处理，`www/app/routes/api/term.ts:68-70` 未复用；建议抽出共享 term command handler。\
  Duplication: Cloudflare and Hono terminal APIs diverge; extract shared command parsing/response logic.

## 8. 构建/依赖风险

- 依赖冲突：当前 lock 中 `hono@4.12.16` 同时被根 import 和 `@hono/vite-dev-server` 使用，升级时要同步 lock，避免 dev server 继续锁旧 Hono。\
  Dependency conflict: Hono is used directly and through `@hono/vite-dev-server`; update both lock entries together.
- 版本不兼容：`deno.json:86` 的 E2E 命令不兼容 Windows；`deno fmt --check www/app/routes` 在 Deno 2.7.14 上 panic，说明 formatter 路径还不能作为完整门禁。\
  Version incompatibility: E2E command is not Windows-compatible; Deno formatter panics on the route directory.
- 打包异常点：`www/dist/assets/_virtual_less-hono-entry-D-OexBcT.js` 和 `www/dist/assets/src-DMZ--1o0.js` 留在公开目录，前者约 1.4 MB，后者约 186.6 KB；需要产物清理或临时 outDir。\
  Bundling anomaly: unreferenced Hono/SSR artifacts remain public; clean them or use a temporary outDir.
- 环境配置问题：`deno.json:90-91` 排除 routes，让根 fmt 绿灯无法代表全仓格式；`deno.json:111-115` 排除 `no-explicit-any`，需要对框架边界文件逐步收紧。\
  Environment config: route files are excluded from root fmt; `no-explicit-any` is disabled globally and should be tightened around public API boundaries.

## 9. 总体评分（1-10）

- 代码质量：7.0 / 10\
  Code quality: 7.0 / 10
- 安全性：6.2 / 10\
  Security: 6.2 / 10
- 性能：6.5 / 10\
  Performance: 6.5 / 10
- 可维护性：7.0 / 10\
  Maintainability: 7.0 / 10
- 综合评分：6.7 / 10\
  Overall: 6.7 / 10

评分依据：类型检查、lint、单元测试、构建、实际 Playwright E2E 都能通过，基础工程质量不低；扣分主要来自可复现的 XSS 清洗绕过、公开产物残留大包、i18n 重复路由、依赖审计失败和 Windows 本地 E2E 任务失败。\
Scoring basis: typecheck, lint, unit tests, build, and actual Playwright E2E pass, so the baseline is solid; deductions come from reproducible sanitization bypasses, public build artifacts, duplicate i18n routes, dependency audit failure, and Windows E2E task failure.

## 10. 最终修复优先级清单（TOP 10）

1. 替换 `packages/content/src/blog/markdown.ts:17-28` 的正则 sanitizer，并对 `unsafeHTML(post.html)` 增加 XSS 回归测试。\
   Replace regex sanitizer and add XSS regression tests for `unsafeHTML(post.html)`.
2. 修复构建流程，确保 `www/dist/assets/_virtual_less-hono-entry*.js` 不再进入公开静态目录。\
   Fix build output so `_virtual_less-hono-entry*.js` never lands in public static assets.
3. 修复 `packages/adapter-vite/src/cli/ssg-render.ts:333-389` 的 i18n 重复前缀问题，并断言无 `/en/zh/`、`/zh/zh/`。\
   Fix duplicate i18n prefixing and assert no `/en/zh/` or `/zh/zh/` output.
4. 升级 Hono 到 `4.12.18+`，重新运行 `deno audit` 并把 audit 加入发布前检查。\
   Upgrade Hono to `4.12.18+`, rerun audit, and add audit before publishing.
5. 将 `deno.json:86` 改为跨平台 Playwright 命令。\
   Replace the root E2E task with a cross-platform Playwright command.
6. 给 `www/app/routes/api/term.ts:68-70` 加 JSON try/catch 和 `cmd` 类型校验。\
   Add JSON try/catch and runtime `cmd` validation to terminal API.
7. 处理 `www/app/routes/` 格式化：先修 `api/term.ts`，再逐步取消 `deno.json:90-91` 的路由排除。\
   Fix route formatting and gradually remove route fmt exclusions.
8. 把 `www/app/islands/less-search.ts:180` 的 `esm.sh` 动态 import 改为本地依赖打包。\
   Bundle FlexSearch locally instead of importing from `esm.sh` at runtime.
9. 为 `api-consumer`、`less-term`、`less-toc` 添加 abort/timeout/cleanup。\
   Add abort, timeout, and cleanup handling to API-consuming islands and timers.
10. 增加版本一致性检查，统一 `packages/*/deno.json`、README、roadmap、changelog；清理未使用的根依赖。\
    Add version consistency checks and remove unused direct imports.
