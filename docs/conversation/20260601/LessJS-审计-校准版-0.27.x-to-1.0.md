# LessJS 审计校准版：v0.27.x 到 v1.0 项目管理基线

> 本文件是对 `docs/conversation/20260601/` 审计文件组的二次校准。
> 原 6 份专项报告和最终汇总报告保留为审计输入；后续 GitHub issue / project / release
> 排期以本文件为准。

## 1. 校准结论

LessJS 当前不是“不可用”，也不是“可以直接 1.0”。更准确的状态是：

- 框架主干方向成立：DSD-first、单遍 VNode 语义、SSR/CSR 同输入不同 backend、island
  渐进增强这条线是合理的。
- `www` 的近期关键体验问题已经进入回归覆盖：SPA 导航后 sidebar、search
  `[object Object]`、search 主题色、主页主题色均已有 E2E 用例。
- 当前最大的 1.0 风险不在“页面是否能构建”，而在 core/runtime 边界和工程门禁：
  event hydration 合约脆弱、VNode 守卫过松、middleware 类型洞、router/runtime/protocols
  零单元测试、SSR bundle 仍约 1.53MB、E2E 门禁存在 SEO 断言漂移和 Windows flaky。

因此 v0.27.x 的目标应是“把当前修补过的 docs site 功能和核心渲染合约固化成可发布的稳定线”，
v0.28+ 再做结构性瘦身和 API freeze。

## 2. 本次核对范围

### 2.1 读取的审计文件组

- `LessJS-审计-架构师.md`
- `LessJS-审计-前端核心开发.md`
- `LessJS-审计-测试工程师.md`
- `LessJS-审计-工程化DevOps.md`
- `LessJS-审计-性能优化.md`
- `LessJS-审计-安全工程师.md`
- `LessJS-审计-最终汇总报告.md`

### 2.2 核对的代码面

- `packages/core/src/event-hydration.ts`
- `packages/core/src/vnode.ts`
- `packages/core/src/dsd-element.ts`
- `packages/core/src/render-dsd.ts`
- `packages/core/src/types.ts`
- `packages/core/src/adapter-registry.ts`
- `packages/adapter-vite/src/entry-renderer.ts`
- `packages/router/src/client-router.ts`
- `packages/runtime/src/index.ts`
- `packages/protocols/src/index.ts`
- `packages/ui/src/less-layout.tsx`
- `www/app/islands/less-search.tsx`
- `www/app/routes/index/index.tsx`
- `www/e2e/*.spec.ts`
- `.github/workflows/*.yml`
- root `deno.json`

## 3. 门禁实测结果

| Gate                                 | Result             | Evidence                                                          |
| ------------------------------------ | ------------------ | ----------------------------------------------------------------- |
| `deno task typecheck`                | pass               | Deno check 全部目标通过                                           |
| `deno task graph:check`              | pass               | 19 packages, 0 cycles, publish order valid                        |
| `deno task docs:check-current`       | pass               | current docs 无 legacy API reference                              |
| `deno task dist:check-object-object` | pass               | built output 无 `[object Object]`                                 |
| `deno task test`                     | pass               | 966 passed, 0 failed                                              |
| `deno task build`                    | pass with warnings | 351 HTML, DSD report 322 pages / 0 errors, client island JS 163KB |
| `deno task test:e2e`                 | fail               | 98 passed, 2 SEO domain failures, 1 Windows worker flaky          |

### 3.1 Build 事实

- route scan: 32 page routes, 0 API routes, 14 islands
- generated HTML: 351 files, 38.1MB total
- DSD report: 322 pages, 0 errors
- client island JS: 163KB total, within current budget
- largest current client island chunks:
  - `flexsearch.bundle.module.min`: 49KB
  - `open-props-tokens`: 35KB
  - `less-layout`: 27KB
  - `less-search`: 6.7KB
- current HTML budget warnings:
  - `guide/core-concepts`
  - `guide/getting-started`
  - same pages under `/en` and `/zh`

### 3.2 E2E 事实

E2E currently fails for stale SEO expectations, not for the three user-facing docs-site regressions.

- `www/e2e/seo-meta.spec.ts` expects `lessjs.org`, but generated `og:url` and `sitemap.xml`
  use `https://lessjs.com`.
- one Windows worker teardown produced `句柄无效。 (os error 6)` on
  `theme toggle is keyboard accessible via delegatesFocus`; retry passed, so this is flaky/tooling risk.
- The docs-site regressions are covered:
  - `www/e2e/navigation-routing.spec.ts`: SPA home -> guide keeps sidebar.
  - `www/e2e/search.spec.ts`: search no `[object Object]`, viewport overlay, theme-aware panel.
  - `www/e2e/theme-system.spec.ts`: homepage surface colors follow active theme.

## 4. 对原最终报告的校准

| 原报告说法                                                             | 当前校准                                                                                                                      |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `www` search/sidebar/theme/i18n 功能失效                               | 已有代码修复和 E2E 覆盖，但 E2E 全量仍被 SEO 域名断言阻塞                                                                     |
| 客户端 JS 约 654KB                                                     | 当前 build 输出 client island JS 为 163KB，旧数字过期                                                                         |
| SSR bundle 1.53MB                                                      | 仍成立：`www/dist/server/entry.js` 约 1,526,147 bytes                                                                         |
| router/runtime/protocols 零测试                                        | 仍成立：三个 package 当前 test count 为 0                                                                                     |
| `data-signal-html` 子树完全不重绑                                      | 需要改口径：当前会重绑 `data-on-*` 事件，但不会重扫新 HTML 内的 `data-signal`                                                 |
| `collectEventBindings()` / `serializeEventMarkers()` 一定导致 mismatch | 需要改口径：当前依赖 SSR/CSR 同序遍历，简单用例通过；问题是缺少共享 event id allocation 合约和复杂树回归，仍应作为 P0/P1 处理 |
| Adapter Registry 全局桥污染                                            | 旧 `globalThis` 桥已清理为 module variable；但默认 adapter 仍是模块级 singleton，应作为 v0.28 请求/构建作用域化任务           |
| 生产环境 `console.log` 残留                                            | core `render-dsd.ts` debug log 仍成立；CLI 输出不应混为生产 runtime 问题                                                      |

## 5. 当前 P0：v0.27.x 必须闭环

### P0-1: 修正 E2E SEO 域名断言漂移

问题：

- sitemap / OG URL 现在生成 `https://lessjs.com`。
- E2E 仍期待 `lessjs.org`。

处理：

- 明确 canonical domain：若产品域名是 `lessjs.com`，更新 `seo-meta.spec.ts` 期望。
- 若产品域名应是 `lessjs.org`，更新 site config / sitemap config。
- 加一个单源配置断言，避免 OG、sitemap、robots、测试期望各写一遍。

验收：

- `deno task build`
- `deno task test:e2e --grep "SEO Meta Tags|Sitemap"`
- `deno task test:e2e`

### P0-2: event hydration id allocation contract

问题：

- `serializeEventMarkers()` 在 SSR 遍历中发 `data-eid`。
- `collectEventBindings()` 在 hydration 重新遍历 VNode 时重新计数。
- 简单树可以通过，但复杂组合（Fragment / Show / For / function component / nested CE）缺少 contract test。

处理：

- 引入 shared allocator/test helper，至少让 SSR serialize 和 hydration collect 共享同一“可验证遍历模型”。
- 补齐以下测试：
  - sibling event elements preserve ids
  - nested function components preserve ids
  - Show/For branches preserve ids
  - multiple events on one element bind all handlers
  - `onDoubleClick` maps to `dblclick`
- 若仍保持两次遍历，必须把“同输入、同语义、同遍历顺序”写成显式 contract。

验收：

- `deno test packages/core/__tests__/jsx-render-string.test.ts packages/core/__tests__/dsd-element.test.ts`
- `deno task test`

### P0-3: strengthen `isVNode`

问题：

- `packages/core/src/vnode.ts` 只检查 `tag/props/children` 三个字段存在。
- 任意普通对象可被误判为 VNode。

处理：

- 校验 `children` 是数组。
- 校验 `props` 是非空对象或允许 `undefined` 前先 normalize。
- 校验 `tag` 是 string/function/symbol。
- 为 spoofed object、bad children、bad props、valid Fragment 加测试。

验收：

- `deno test packages/core/__tests__/jsx-render-dom.test.ts packages/core/__tests__/jsx-render-string.test.ts`
- `deno task typecheck`

### P0-4: type `LessMiddleware` without `any`

问题：

- `packages/core/src/types.ts` 仍为 `(c: any, next: () => Promise<void>)`.

处理：

- 用 structural minimal context type，不在 runtime 引入 Hono。
- 例如 `LessMiddlewareContext = { req: { path: string; method?: string; url?: string }; [key: string]: unknown }`。
- 保留与 Hono middleware 的结构兼容。

验收：

- type-level tests for user middleware.
- `deno task typecheck`

### P0-5: protect DsdElement lifecycle hooks

问题：

- `_renderOrHydrate()` 直接调用 `_hyrateExistingDom()` / `_renderIntoShadowRoot()` /
  `onDsdHydrated()` / `onCsrRendered()`。
- 子类 hook throw 时可能中断 custom element upgrade。

处理：

- 在 `_renderOrHydrate()` 外层加 try/catch。
- hook 错误进入 `console.error` 或 LessError pipeline，不吞掉诊断。
- 加测试：hook throws but element remains connected and no blank replacement.

验收：

- `deno test packages/core/__tests__/dsd-element.test.ts`

### P0-6: router/runtime/protocols base tests

问题：

- `packages/router`, `packages/runtime`, `packages/protocols` 当前 test count 为 0。
- 这三个包分别承接 SPA 导航、公共 authoring facade、共享 build contracts。

处理：

- router:
  - locale path normalize
  - `localize()`
  - `switchPath()`
  - navigation failure fallback
- runtime:
  - public export contract snapshot
  - `jsx` only via jsx-runtime/runtime package, not root `@openelement/core`
- protocols:
  - build-types shape and key constants.

验收：

- three packages test count > 0.
- `deno task test`

## 6. 当前 P1：v0.27.x 可并行推进

| ID    | Item                                          | Why                                                                 |
| ----- | --------------------------------------------- | ------------------------------------------------------------------- |
| P1-1  | `renderEntry()` reuse `desc.ssrAdmissionPlan` | 当前 `entry-renderer.ts` 仍重新 `buildSsrAdmissionPlan()`           |
| P1-2  | Adapter Registry scope boundary               | 已从 globalThis 降级为 module singleton，但仍缺 request/build scope |
| P1-3  | `data-signal-html` subtree signal re-scan     | 当前只重绑 events，不重扫 signals                                   |
| P1-4  | remove `render-dsd.ts` debug `console.log`    | 当前 debug 信息会污染生产构建日志                                   |
| P1-5  | canonical domain single source                | 解决 SEO E2E drift                                                  |
| P1-6  | HTML page budget policy                       | guide pages >200KB，需要决定压缩、split、还是调整 budget            |
| P1-7  | E2E Windows worker flaky policy               | `os error 6` 需要 serial/project timeout/teardown 调整              |
| P1-8  | hub tasks least privilege                     | root `hub:scan` / `hub:validate` 仍为 `-A`                          |
| P1-9  | deploy token process visibility               | deploy workflow 通过 CLI arg 传 token                               |
| P1-10 | CI dedupe                                     | `test.yml` / `sop-gate.yml` / `lint.yml` 仍有重复 install 和 gate   |

## 7. `www` 当前状态判断

### 7.1 已闭环或基本闭环

- SPA blank/sidebar：已有 app shell replacement 逻辑和 E2E。
- search `[object Object]`：dist gate + E2E 覆盖。
- search theme：E2E 覆盖 panel background changes。
- homepage theme：E2E 覆盖 `docs-home[data-theme]` 和 surface colors。

### 7.2 仍需纳入项目管理

- E2E 全量红，不应以“核心体验通过”替代全站门禁。
- SEO canonical domain 需要产品决策，不能在测试里硬编码分裂。
- E2E suite 目前只有 Chromium 项目，1.0 前需要 Firefox/WebKit/mobile matrix。

## 8. 版本路线图

以下排期假设：1 名主维护者、无新增大范围功能、每天可投入完整工程时间。
当前日期为 2026-06-01。

| Version   | Date target | Goal                         | Exit criteria                                                                                                       |
| --------- | ----------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| v0.27.1   | 2026-06-03  | docs site regression closure | search/sidebar/theme/i18n regressions covered; SEO E2E fixed; full E2E green or flaky isolated                      |
| v0.27.2   | 2026-06-07  | core correctness hardening   | event hydration contract, `isVNode`, `LessMiddleware`, DsdElement hook guard                                        |
| v0.27.3   | 2026-06-12  | test floor                   | router/runtime/protocols tests added; package test count no longer zero; console debug logs cleaned                 |
| v0.27.4   | 2026-06-17  | release hygiene              | canonical domain single source, hub least privilege, deploy token env handling, CI gate summary cleanup             |
| v0.28.0   | 2026-07-01  | architecture boundary        | Adapter Registry scoped; `renderEntry()` plan reuse; generated-data/app-shell boundary documented in code and tests |
| v0.29.0   | 2026-07-16  | performance line             | SSR bundle slim plan implemented; page HTML budget decided; route/content cache scoped                              |
| v0.30.0   | 2026-08-05  | compatibility line           | Firefox/WebKit/mobile E2E, DSD polyfill externalization policy, API freeze draft                                    |
| v1.0-rc.1 | 2026-08-10  | release candidate            | API surface frozen, migration guide, all gates green                                                                |
| v1.0.0    | 2026-08-14  | stable release               | 7 days without P0 regression after RC, docs and examples aligned                                                    |

If core event hydration or Adapter Registry scoping uncovers deeper design debt, v1.0 should move to late
August 2026 rather than shipping with a fragile render contract.

## 9. GitHub Issue 内容

Title:

```text
Roadmap: LessJS v0.27.x hardening to v1.0
```

Body:

```markdown
## Goal

Track the verified LessJS v0.27.x hardening path from current docs-site stabilization to v1.0.

Baseline audit: `docs/conversation/20260601/LessJS-审计-校准版-0.27.x-to-1.0.md`.

## Current verified state

- `deno task typecheck`: pass
- `deno task graph:check`: pass, 19 packages, 0 cycles
- `deno task docs:check-current`: pass
- `deno task dist:check-object-object`: pass
- `deno task test`: pass, 966 passed
- `deno task build`: pass, 351 HTML, DSD report 322 pages / 0 errors, client island JS 163KB
- `deno task test:e2e`: fail, 98 passed, 2 SEO domain failures, 1 Windows flaky

## v0.27.1 docs-site stabilization

- [ ] Decide canonical domain: `lessjs.com` vs `lessjs.org`
- [ ] Fix `www/e2e/seo-meta.spec.ts` domain assertions or generated site config
- [ ] Isolate Windows Playwright worker teardown flaky (`os error 6`)
- [ ] Keep SPA home -> guide sidebar regression green
- [ ] Keep search `[object Object]` and theme regression green
- [ ] Keep homepage theme regression green

## v0.27.2 core correctness

- [ ] Formalize event hydration id allocation contract
- [ ] Add complex event hydration tests for Fragment / Show / For / nested function components
- [ ] Map `onDoubleClick` to `dblclick`
- [ ] Strengthen `isVNode`
- [ ] Replace `LessMiddleware` `any` with structural context type
- [ ] Add `_renderOrHydrate()` hook error boundary

## v0.27.3 test floor

- [ ] Add router unit tests
- [ ] Add runtime export-contract tests
- [ ] Add protocols tests
- [ ] Remove production `render-dsd.ts` debug logs
- [ ] Add `data-signal-html` subtree signal re-scan tests or document unsupported semantics

## v0.27.4 release hygiene

- [ ] Single-source canonical domain for OG / sitemap / robots / tests
- [ ] Reduce hub task permissions away from `-A`
- [ ] Pass deploy token via env instead of CLI argument
- [ ] Deduplicate CI gate/install flow
- [ ] Decide HTML page budget policy for large guide pages

## v0.28.0 architecture boundary

- [ ] Scope Adapter Registry away from default module singleton
- [ ] Make `renderEntry()` reuse `desc.ssrAdmissionPlan`
- [ ] Lock generated-data / app-shell boundary with tests
- [ ] Keep `www` zero hand-written routes/events/hardcoded CSS policy explicit

## v0.29.0 performance line

- [ ] Slim SSR bundle from ~1.53MB
- [ ] Split or externalize heavyweight optional dependencies where safe
- [ ] Add route/content scan cache
- [ ] Add performance regression gates

## v0.30.0 compatibility and API freeze

- [ ] Add Firefox/WebKit/mobile E2E matrix
- [ ] Decide DSD polyfill externalization strategy
- [ ] Freeze public API surface
- [ ] Write migration guide and 1.0 compatibility matrix

## Target

Assuming one primary maintainer and no scope expansion:

- v0.27.1: 2026-06-03
- v0.27.2: 2026-06-07
- v0.27.3: 2026-06-12
- v0.27.4: 2026-06-17
- v0.28.0: 2026-07-01
- v0.29.0: 2026-07-16
- v0.30.0: 2026-08-05
- v1.0-rc.1: 2026-08-10
- v1.0.0: 2026-08-14
```

## 10. GitHub Project 建议

Project name:

```text
LessJS v0.27.x to v1.0
```

Fields:

| Field    | Values                                                                         |
| -------- | ------------------------------------------------------------------------------ |
| Status   | Backlog / Ready / In Progress / In Review / Done / Blocked                     |
| Release  | v0.27.1 / v0.27.2 / v0.27.3 / v0.27.4 / v0.28.0 / v0.29.0 / v0.30.0 / v1.0     |
| Area     | core / router / runtime / protocols / www / ci / security / performance / docs |
| Priority | P0 / P1 / P2                                                                   |
| Gate     | typecheck / test / build / e2e / release                                       |

Initial project items:

| Release | Item                                           | Priority | Area                     |
| ------- | ---------------------------------------------- | -------- | ------------------------ |
| v0.27.1 | Fix canonical domain E2E drift                 | P0       | www                      |
| v0.27.1 | Isolate Windows Playwright teardown flaky      | P1       | ci                       |
| v0.27.2 | Event hydration id allocation contract         | P0       | core                     |
| v0.27.2 | Strengthen `isVNode`                           | P0       | core                     |
| v0.27.2 | Type `LessMiddleware` without `any`            | P0       | core                     |
| v0.27.2 | Guard DsdElement lifecycle hooks               | P0       | core                     |
| v0.27.3 | Add router/runtime/protocols test floor        | P0       | router/runtime/protocols |
| v0.27.3 | Remove production debug logs                   | P1       | core                     |
| v0.27.4 | Hub least-privilege tasks and deploy token env | P1       | security/ci              |
| v0.28.0 | Adapter Registry scoped boundary               | P1       | architecture             |
| v0.28.0 | `renderEntry()` plan reuse                     | P1       | adapter-vite             |
| v0.29.0 | SSR bundle slimming                            | P1       | performance              |
| v0.30.0 | Browser compatibility matrix                   | P1       | e2e                      |
| v1.0    | API freeze and migration guide                 | P0       | docs/core                |
