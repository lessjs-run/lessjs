# LessJS v0.24.1 JSX+Signal 迁移深度审计报告

- **审计对象**: LessJS monorepo 当前工作区
- **审计重点**: v0.24.1 从 `html` tagged template DSL / `@prop()` 到 JSX + Signal 组件模型的迁移完整性
- **审计时间**: 2026-05-29
- **输出目录**: `docs/conversation/20260629`

## 结论摘要

v0.24.1 的核心 JSX 管线已经基本落地：`jsx/jsxs/jsxDEV/Fragment`、`renderToString`、`renderToDOM`、`DsdElement` VNode 渲染分支、SVG `createElementNS`、事件 `addEventListener` + `AbortSignal` 清理、`@openelement/signals` -> `@openelement/core` 依赖与发布顺序均有实装证据。

但当前仓库还不能被判定为“可发布的 v0.24.1 完成态”，原因是存在 **P0 release gate 失败** 与 **文档/代码事实不一致**：

- **P0**: `deno task lint` 当前失败，SOP gate 不可通过。
- **P0**: `deno task fmt:check` 当前失败，至少 15 个文件未格式化。
- **P0**: release notes / API reference 宣称旧 API “完全删除”，但代码、类型、测试与 DSD 分支仍保留 `TemplateResult` / legacy template runtime 兼容路径。
- **P0**: README、runtime/core README、官网多处仍宣称 v0.23.0 / v0.24.0 或继续教学 `html` / `@prop()`。
- **P1**: `renderToString` / `renderToDOM` 只对 JSX children 自动解包 Signal，属性、style 对象、SVG 属性中的 Signal 仍可能输出 `[object Object]`。
- **P1**: `renderToDOM` 缺少直接测试覆盖，当前回归主要靠 build/site smoke，无法防止 CSR Signal/SVG/event 关键路径倒退。

## 已执行验证矩阵

| Gate / 检查                           | 结果                            | 证据                                                                                        |
| ------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| `deno task build`                     | 通过                            | 生成 `www/dist`，472 HTML files，24 island bundles，Build complete                          |
| `deno task test`                      | 通过                            | `939 passed (229 steps), 0 failed`                                                          |
| `deno task typecheck`                 | 通过                            | 所有列出的 package / www entry check 通过                                                   |
| `deno audit`                          | 通过                            | `No known vulnerabilities found`                                                            |
| `deno task graph:check`               | 通过                            | 18 packages，无循环，source imports declared，publish order consistent                      |
| `deno task dsd:check-report`          | 通过但有警告                    | totalErrors 131；third-party non-recoverable 27 excluded；gate passed                       |
| `deno task docs:check-strategy`       | 通过                            | exit code 0                                                                                 |
| `deno task lint`                      | **失败**                        | `www/app/routes/guide/migration-v0.24.ts:262:9 Parenthesized expression cannot be empty`    |
| `deno task fmt:check`                 | **失败**                        | `Found 15 not formatted files in 606 files`                                                 |
| `www/dist` raw `[object Object]` scan | **严格意义失败 / 需上下文过滤** | 在 changelog/docs 页面和 JS bundle 文本中仍有 literal `[object Object]`；首页/en 首页 clean |

## P0 Findings

### P0-1: CI/SOP Gate 当前无法通过：`deno lint` 失败

- **Severity**: P0
- **Files**:
  - `www/app/routes/guide/migration-v0.24.ts:255-267`
  - `www/app/routes/zh/guide/migration-v0.24.ts:257-260` 也含类似 `html\` /``${...}` 文档示例，需要同步检查
- **Problem**:
  - `deno task lint` 在 `www/app/routes/guide/migration-v0.24.ts:262:9` 失败：`Parenthesized expression cannot be empty`。
  - 根因是文档代码块中展示旧 `html\` DSL 时，外层 TS source 仍会解析``${when(...)}`插值；示例内部的`() =&gt; html\`` 被 parser 误当成真实 TS 表达式的一部分。
  - 这直接推翻 `docs/release/0.24.1.md` 中 `deno lint ✅` 的发布验证结论。
- **Suggested fix**:
  - 所有文档示例中的 `${` 改为 `\${`，或通过 `String.raw` / 独立 `_code()` helper / 数组 join 存储代码样例，禁止文档样例被 TS template literal 解析。
  - 修复英文与中文 migration 页面后重新执行 `deno task lint`。
  - 在 docs route lint 中增加专门用例覆盖 `html\`` migration examples，防止后续文档示例再次破坏 parser。

### P0-2: `fmt:check` 失败，发布说明中的格式门禁结论不可信

- **Severity**: P0
- **Files**:
  - `docs/adr/ADR-0052-signal-dom-deep-integration.md`
  - `docs/reference/core-api-surface.md`
  - `docs/sop/v0.24.1/SOP-009-docs-remediation.md`
  - 以及当前工作区多处 docs/status/README/www docs 变更
- **Problem**:
  - `deno task fmt:check` 返回失败：`Found 15 not formatted files in 606 files`。
  - 输出中显示 Markdown table、code fence 与 prose spacing 需要由 `deno fmt` 重新格式化。
  - release notes 仍声称 `deno fmt ✅ (602 files)`，与当前仓库状态不一致。
- **Suggested fix**:
  - 执行 `deno task fmt`，检查 diff 是否只包含格式化。
  - 将 `docs/release/0.24.1.md` Verification 改为真实 gate 结果，或在 release 前重新跑完整 SOP gate 后再标记 ✅。

### P0-3: Release notes / API reference 宣称“旧 API 完全删除”，但代码仍保留 legacy template 运行时

- **Severity**: P0
- **Files**:
  - `docs/release/0.24.1.md:9-18`
  - `docs/reference/core-api-surface.md:6,38-53`
  - `CHANGELOG.md:21-24`
  - `packages/core/src/template.ts:195-348`
  - `packages/core/src/prop.ts:49-65`
  - `packages/core/src/types.ts:729-741`
  - `packages/core/src/dsd-element.ts` TemplateResult branch
  - `packages/core/__tests__/template.test.ts`
  - `packages/core/__tests__/template-helpers.test.ts`
  - `packages/core/__tests__/reactive-dsd.test.ts`
- **Problem**:
  - `docs/release/0.24.1.md` 写明 “removes the old `html` tagged template API entirely” 与 “zero backward-compatibility overhead”。
  - `docs/reference/core-api-surface.md` 写明 `html()`、`unsafeHTML()`、`TemplateResult`、`renderTemplateToString` 等 “Removed in v0.24.1”。
  - 但 `packages/core/src/template.ts` 仍实现并导出 `html`、`unsafeHTML`、`classMap`、`when`、`choose`、`repeat`、`ref`，只是未从 `@openelement/core` root barrel re-export。
  - `DsdElement` / `renderDSD` / streaming DSD / reactive-dsd tests 仍保留 `TemplateResult` 支持路径。
  - `prop.ts` 仍有 `@prop()` legacy runtime metadata 支持，虽注释称 decorator 已删除。
- **Suggested fix**:
  - 在 v0.24.1 选择一种一致叙事：
    - **方案 A（推荐，低风险）**: 改文档为“从 public root API 删除，legacy template runtime 作为 internal/back-compat path 暂留，不再推荐，不再从 root export”。同时明确计划迁移到 `@openelement/core/html-legacy` 或 v0.28/v1.0 删除。
    - **方案 B（高风险）**: 真删除 template runtime 与 `TemplateResult` 分支，并迁移所有 tests / DSD legacy cases。
  - 更新 `CHANGELOG.md` 的 “Removed” 表述为 “removed from public `@openelement/core` barrel”。
  - 为 `@openelement/core/template` 是否应为私有 internal 文件加 gate：禁止 app/ui/www 直接 import。

### P0-4: Public docs / README 仍展示旧组件模型或旧版本线

- **Severity**: P0
- **Files**:
  - `README.md:35-52`
  - `packages/core/README.md:3-10,27-49`
  - `packages/runtime/README.md:19-47,73-90`
  - `docs/status/STATUS.md:126-129`
  - `www/app/routes/index/index.ts:55,662-676,765-815`
  - `www/app/routes/roadmap.ts:269-278`
  - `www/app/routes/guide/architecture.ts:42-47`
  - `www/app/routes/engine/architecture.ts:327-414`
  - `www/app/routes/architecture/protocols.ts:48-79`
  - `www/app/routes/architecture/runtime-kernel.ts:1-66`
- **Problem**:
  - Root README 仍写 “项目线：v0.24.0 DX Leap”，并列出 `@prop()`、template helpers 为新增能力，还称全部包统一到 v0.23.0。
  - `packages/core/README.md` 把 `@prop()` decorator 与 `html template` 列为核心能力，并给出 `classMap/html/prop/when` 示例。
  - `packages/runtime/README.md` 继续教学 `choose/classMap/html/prop/ref/repeat/when`，Exports 表也列出 `TemplateResult` / `renderTemplateToString`。
  - 官网多处仍把 v0.23.0 称为 current line，与 v0.24.1 release 事实冲突。
- **Suggested fix**:
  - 将 README / package README / website architecture pages 全部改为 v0.24.1 JSX + static props + signals 叙事。
  - 旧 DSL 只能出现在 migration guide 的 “Before” 区块，且必须标注 removed/deprecated/internal legacy。
  - 建立 docs gate：非 `migration` / `changelog` / `legacy` 文件中禁止 `html\`、``@prop(`、`classMap`、`when`、`choose`、`repeat`、`unsafeHTML`。

## P1 Findings

### P1-1: JSX Signal auto-unwrap 只覆盖 children，未覆盖 props / attributes / style

- **Severity**: P1
- **Files**:
  - `packages/core/src/jsx-render-string.ts:56-93,116-130`
  - `packages/core/src/jsx-render-dom.ts:103-148,160-178`
  - `packages/signals/src/alien-engine.ts:38-51,54-64`
- **Problem**:
  - `renderToString()` 在 node 层对 Signal-like children 做 unwrap，但 `serializeAttrs()` 对 props 直接 `String(value)`。
  - `renderToDOM()` 在 node 层对 Signal-like children 做 unwrap，但 `applyProps()` 对 attrs 直接 `setAttribute(attrName, String(value))`，style 对象直接 `Object.assign()`。
  - `@openelement/signals` 的 `signal()` / `computed()` 返回对象只有 `.value` / `.subscribe()`，没有 `valueOf()` / `Symbol.toPrimitive`，因此属性位置仍可能产生 `[object Object]`。
  - 这意味着 `<div title={signal('x')}>`、`<div className={signal('active')}>`、`<svg width={signal(16)}>`、`style={{ opacity: signal(1) }}` 等场景没有 SSR/CSR parity。
- **Suggested fix**:
  - 增加统一 `unwrapSignalLike(value)`，在 `serializeAttrs()`、`styleObjectToString()`、`applyProps()`、style assignment 前全部调用。
  - 对 boolean attr、className/htmlFor、style object nested values、SVG numeric attrs 分别加测试。
  - 可选：在 `@openelement/signals` engine 创建的 signal/computed 上也定义 `valueOf()` 和 `Symbol.toPrimitive()`，但 renderer 显式 unwrap 仍应保留。

### P1-2: CSR renderer 关键路径测试不足

- **Severity**: P1
- **Files**:
  - `packages/core/__tests__/core-api-surface.test.ts:22-59`
  - `packages/core/__tests__/template.test.ts`
  - `packages/core/__tests__/template-helpers.test.ts`
  - `packages/core/__tests__/reactive-dsd.test.ts`
- **Problem**:
  - 当前核心 JSX tests 主要覆盖 `renderToString()`：VNode round-trip、Fragment、escape、boolean attrs、SSR event omission。
  - 全仓搜索未发现专门断言 `renderToDOM()` 的测试：Signal child unwrap、Signal attr unwrap、SVG namespaceURI、event add/remove cleanup、Fragment DOM、ref callback、function/class component recursion。
  - 旧 template tests 仍大量存在，导致测试权重没有跟随 v0.24.1 架构迁移。
- **Suggested fix**:
  - 新增 `packages/core/__tests__/jsx-render-dom.test.ts`：使用 DOM simulation/happy-dom 覆盖 `namespaceURI === 'http://www.w3.org/2000/svg'`、`onClick` 可触发且 abort 后不触发、Signal children/attrs 不输出 `[object Object]`、Fragment 生成 `DocumentFragment`。
  - 新增 `jsx-render-string.test.ts` 属性层 Signal unwrap 与 SVG attrs SSR parity。
  - 将 `template-*` tests 标注 legacy，并减少对 release readiness 的误导。

### P1-3: `www/dist` 严格 raw scan 仍命中 `[object Object]`

- **Severity**: P1
- **Files / Outputs**:
  - `www/dist/en/changelog/index.html:2361`
  - `www/dist/en/engine/dsd/index.html:2647`
  - `www/dist/en/guide/islands/index.html:2221`
  - `www/dist/client/islands/client-*.js`
  - `www/dist/server/entry.js`
- **Problem**:
  - 构建后执行 raw scan：`www/dist` 的 HTML/JS 中仍有 literal `[object Object]`。
  - 已抽样确认 `en/changelog` 命中来自 changelog 文本描述历史 bug，不是首页运行时渲染 bug；`www/dist/index.html` 与 `www/dist/en/index.html` clean。
  - 但如果 release gate 要求 “absence of `[object Object]` in `www/dist`”，当前严格 gate 仍会失败。
- **Suggested fix**:
  - 明确 gate 语义：
    - 如果要求产物完全无 literal，则把文档中的 `[object Object]` 改写为 code-escaped token 或 allowlist 页面。
    - 如果只检测运行时污染，则写专用 checker：排除 changelog/migration 文档代码块，重点扫描首页、layout/search/theme、registry rendered content。
  - 建议增加 `www/__tests__/build-output-no-object-object.test.ts`，带 allowlist 与上下文输出。

### P1-4: Root publish tasks 与 GitHub publish workflow 不一致

- **Severity**: P1
- **Files**:
  - `deno.json:114-128`
  - `.github/workflows/publish-jsr.yml:60-82`
- **Problem**:
  - GitHub workflow 的 publish order 覆盖 18 packages，并且顺序为 `rpc -> protocols -> style-sheet -> create -> signals -> core -> runtime -> ... -> app`，`graph:check` 也验证通过。
  - 但 root `deno task publish` / `publish:dry-run` 只包含 14 个 publish steps，缺少 `protocols`、`style-sheet`、`runtime`、`cem`、`compat-check` 等包。
  - 这会导致本地或人工误用 root publish task 时发布集合不完整，与 monorepo “18 packages unified release” 不一致。
- **Suggested fix**:
  - 将 `deno.json` 的 publish tasks 与 `.github/workflows/publish-jsr.yml` 统一，或删除 root publish task，明确只允许 GitHub workflow 发布。
  - 增加 gate：`tools/check-package-graph.ts` 同时检查 root publish task 中 package set/order 与 workflow 一致。

### P1-5: SVG namespace 修复方向正确，但 SVG tag/attr 兼容仍不完整

- **Severity**: P1
- **Files**:
  - `packages/core/src/jsx-render-dom.ts:18-88,127-147`
  - `packages/ui/src/less-layout.tsx:614-619`
  - `packages/ui/src/less-theme-toggle.tsx:178-203`
  - `www/app/islands/less-search.tsx:187-193`
- **Problem**:
  - `createElementForTag()` 已对常见 SVG tags 使用 `createElementNS()`，这是关键修复。
  - 但目前依赖静态 `SVG_TAGS` allowlist，缺少 `filter`、`marker` 等常用 SVG tag；未来新 SVG tag 可能回退到 HTML namespace。
  - `applyProps()` 对 SVG attrs 不做 JSX camelCase -> SVG attribute name 映射；仓库当前多处已使用 kebab-case `stroke-width` 避开问题，但 docs 仍提到 `viewBox` / SVG attributes 需要“passed through correctly”。
- **Suggested fix**:
  - 优先基于父节点 namespace 传播创建子元素，避免单纯 tag allowlist。
  - 补全 SVG tag set，并添加测试覆盖 `filter` / `linearGradient` / nested SVG。
  - 明确文档推荐 SVG attrs 使用原生 attribute spelling，或实现 `strokeWidth -> stroke-width` 等映射。

### P1-6: DSD report 仍有 131 known errors，门禁通过依赖 third-party exclude

- **Severity**: P1
- **Files / Outputs**:
  - `www/dist/dsd-report.json`
  - `packages/hub/src/cli/dsd-report-gate.ts`
- **Problem**:
  - `deno task build` 生成 DSD report：`totalPages=429 totalErrors=131`。
  - `deno task dsd:check-report` 通过，但输出显示 `27 third-party non-recoverable errors excluded from gate`，错误集中在 Shoelace SSR boundary，例如 `this.host.querySelector is not a function`、`this.host.childNodes is not iterable`、`Components must return a string from render(), got symbol`。
  - 这是可解释风险，但不是“零错误”状态。
- **Suggested fix**:
  - 在 release notes 明确 DSD gate 通过条件是 “known third-party SSR boundary excluded”，不要写成全站 DSD 零错误。
  - 对 registry/Shoelace 页面提供 fallback DSD 或 client-only boundary，并按版本逐步收紧阈值。

## P2 Findings

### P2-1: 发布工作流注释版本号漂移

- **Severity**: P2
- **File**: `.github/workflows/publish-jsr.yml:67`
- **Problem**:
  - 注释写 `v0.24.3: @openelement/signals is now a dependency of @openelement/core`，但当前包版本与审计目标是 `0.24.1`。
  - 逻辑本身正确，但版本注释会误导审计与 release archaeology。
- **Suggested fix**:
  - 改为 `v0.24.1` 或删除版本号，只保留事实说明。

### P2-2: Build budget warnings 未进入失败门禁

- **Severity**: P2
- **Output**: `deno task build`
- **Problem**:
  - build 成功，但输出显示多个 budget warnings：`client-*.js 178 KB`、`dist-*.js 172 KB`、`shoelace-showcase 82 KB`、Total JS `664 KB` 超过 200 KB budget。
  - 当前作为 warning 可接受，但若 v0.24.1 目标包含 CDN/cache/perf gate，则应明确预算是否阻断发布。
- **Suggested fix**:
  - 将 framework core bundles 与 showcase/demo bundles 分开预算。
  - CI 中对 production critical path 使用 hard budget，对 demo/registry 使用 soft budget。

### P2-3: CDN / Cloudflare Pages cache strategy 未在仓库中显式声明

- **Severity**: P2
- **Files**:
  - 未发现 `www/_headers`
  - 未发现 `wrangler.toml`
- **Problem**:
  - Cloudflare Pages 部署依赖 `www/dist`，但仓库中未发现 Pages `_headers` 或 worker-level cache rules。
  - hashed island chunks 理论上可长期缓存，HTML 应短缓存或 revalidate；当前策略可能只依赖平台默认值。
- **Suggested fix**:
  - 增加 `www/public/_headers` 或 build 注入 `_headers`：hashed `/client/islands/*` 使用 immutable，HTML 使用短缓存。
  - 把 CDN cache policy 纳入 `docs/release/0.24.1.md` 验证项。

## 正向确认

- **版本一致**: 全部 18 个 `packages/*/deno.json` 均为 `0.24.1`。
- **依赖图**: `deno task graph:check` 通过，无循环，source-level `@openelement/*` imports 均已声明。
- **发布顺序（CI workflow）**: `.github/workflows/publish-jsr.yml` 中 `signals` 位于 `core` 之前，且 workflow 覆盖 18 packages。
- **JSX runtime exports**: `packages/core/deno.json` 导出 `./jsx-runtime` 与 `./jsx-dev-runtime`。
- **Build JSX config**: root `deno.json` 配置 `jsx: "react-jsx"` 与 `jsxImportSource: "@openelement/core"`；adapter-vite 内部 build 已显式配置 JSX automatic runtime。
- **CSR event model**: `renderToDOM.applyProps()` 使用 `addEventListener`，并通过可选 `AbortSignal` 清理。
- **SVG namespace**: `renderToDOM` 已对常用 SVG tags 使用 `document.createElementNS(SVG_NS, tag)`。
- **Signal child unwrap**: `renderToString()` 与 `renderToDOM()` 已对 JSX children 中的 Signal-like node 做递归 unwrap。
- **Home output**: `www/dist/index.html` 与 `www/dist/en/index.html` raw scan 未发现 `[object Object]`。
- **测试规模**: `deno task test` 当前 939 tests 全部通过。

## 建议修复顺序

1. **先恢复 CI gate**: 修复 `migration-v0.24.ts` 文档示例 escaping，运行 `deno task lint`；执行 `deno task fmt` 并确认 `fmt:check` 通过。
2. **修正文档真相**: 更新 release notes / API reference / README / package README / 官网 current line，避免“完全删除”与“仍兼容”并存。
3. **补 Signal props unwrap**: renderer 层统一 unwrap attrs/style/SVG props，新增 SSR + CSR tests。
4. **补 renderToDOM tests**: 覆盖 SVG namespace、event cleanup、Fragment、ref、Signal attr/child。
5. **统一 publish task**: root `deno.json` publish tasks 与 GitHub workflow 对齐，或删除 root publish入口。
6. **建立 dist scan gate**: 对 `[object Object]` 使用上下文 allowlist，区分文档提及与运行时污染。
7. **显式 Cloudflare cache policy**: 添加 `_headers` / cache docs，保障 hashed chunks 与 HTML 缓存策略可审计。

## Release readiness 判定

当前状态建议标记为：**Not release-ready / Needs remediation**。

阻断项是 `lint` 与 `fmt:check` 失败，以及 public docs 与 runtime reality 不一致。核心 JSX+Signal 架构已经有足够基础，但需要补齐 Signal props unwrap 与 renderToDOM 回归测试，才能把 v0.24.1 从“修复可运行”推进到“可审计、可发布、可长期维护”。
