# LessJS 全站架构与产品审计报告

审计日期: 2026-05-24\
仓库: `C:\Users\Administrator\WorkBuddy\Claw\src-tmp`\
分支: `dev`\
输出文件: `C:\Users\Administrator\WorkBuddy\LessJS-comprehensive-architecture-product-audit-2026-05-24.md`

## 1. 结论摘要

LessJS 当前已经不是一个只有概念的实验框架。按本次复核结果，v0.21.0 Reactive DSD 主线有较完整的实现闭环: 16 个 workspace 包均为 `0.21.0`，`DsdElement`、safe `html` template、`unsafeHTML()` 显式信任边界、`renderDSDStream()`、Signals 集成、ISR cache contract、Hub schema/validator、Vite/Hono SSG pipeline 都存在真实代码与测试覆盖。完整门禁本次全部通过，包括 `fmt:check`、`lint`、`typecheck`、`deno audit`、`test`、`build`、DSD gate、Hub strict validate、Hub index check、strategy docs check 和 92 个 Playwright e2e。

但产品定位仍需要收紧。LessJS 最可信的护城河不是“又一个全栈框架”，而是 “DSD-first Web Components rendering engine + deterministic admission/reporting pipeline”。如果继续把 v0.22 Edge Full-Stack、Registry Hub、Universal WC Engine 一起作为同等成熟卖点，市场叙事会跑在证据前面。当前可防守优势集中在 DSD/WC 渲染、SSR admission、构建报告、Hub 兼容性证据这些标准化接口；全栈 ISR/Edge runtime 和 Hub 生态规模还没有到可以作为成熟平台承诺的状态。

本次审计没有发现 P0 发布阻断级问题。主要风险是 P1: 构建仍有 `IMPORT_IS_UNDEFINED` 警告、DSD 报告仍包含 112 个已知第三方 SSR 边界错误、客户端 island 总 JS 偏大、Roadmap/Status/README 存在口径漂移、v0.22 仍主要停留在 SOP 计划态、Hub 目前只有 2 个包记录。工程质量比 2026-05-21 的旧审计状态明显改善，但产品化和生态化证据还不够厚。

## 2. 审计边界与当前工作树

执行时复核:

| 项目                                 | 结果                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- |
| `git status --short --branch` 开始   | `## dev...origin/dev`                                                |
| `git diff --stat`                    | 空输出                                                               |
| `git status --short --branch` 验证后 | `## dev...origin/dev`                                                |
| `rg --files`                         | Windows 环境报 `Access is denied`，改用 `git ls-files` 和 PowerShell |

说明: 计划阶段曾观察到 `README.md` 和 `deno.lock` 有未提交改动；正式执行审计、完整门禁和收尾复核时工作树为 clean。构建和测试产生的 `www/dist`、Playwright 输出等未造成 tracked 文件改动。

## 3. 门禁结果

| 命令                                     | 结果                   | 关键信号                                                                            |
| ---------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| `deno task fmt:check`                    | PASS                   | Checked 445 files                                                                   |
| `deno task lint`                         | PASS                   | Checked 276 files                                                                   |
| `deno task typecheck`                    | PASS                   | 显式入口 check 全部通过                                                             |
| `deno audit`                             | PASS                   | No known vulnerabilities found                                                      |
| `deno task test`                         | PASS                   | 787 passed, 251 steps, 0 failed                                                     |
| `deno task build`                        | PASS with warnings     | 36 pages, 1 API route, 24 islands; 439 HTML files; DSD report 407 pages, 112 errors |
| `deno task dsd:check-report`             | PASS with known errors | 112 total errors, 8 non-recoverable, 104 recoverable, unknown error types 0         |
| `deno task hub:validate --strict --json` | PASS                   | 2 records, 2 passed, 0 failed, no warnings                                          |
| `deno task hub:check-index`              | PASS                   | Index up to date, 2 packages                                                        |
| `deno task docs:check-strategy`          | PASS                   | 5 checks, 14 files                                                                  |
| `deno task test:e2e`                     | PASS                   | 92 Chromium tests passed                                                            |

构建体积补充:

| 指标                             | 当前值   |
| -------------------------------- | -------- |
| `www/dist` HTML 文件             | 439      |
| HTML 总大小                      | 31.4 MB  |
| `www/dist/client` JS 文件        | 33       |
| Core island JS                   | 560.4 KB |
| Showcase JS                      | 97.6 KB  |
| Total client JS                  | 658.1 KB |
| Build manifest reported total JS | 655 KB   |

DSD 报告补充:

| 指标                  | 当前值                                                       |
| --------------------- | ------------------------------------------------------------ |
| `totalPages`          | 407                                                          |
| `totalErrors`         | 112                                                          |
| `errorComponentCount` | 53                                                           |
| `avgRenderTimeMs`     | 4.97                                                         |
| hydration strategies  | load: 4, idle: 8, visible: 0, only: 0, clientOnlyExcluded: 1 |

## 4. 选型审计

### 4.1 Deno workspace + JSR

判断: 合理，但偏早期生态绑定。

证据:

- 根 `deno.json` 定义 16 个 workspace 包。
- 所有 `packages/*/deno.json` 当前都是 `0.21.0`。
- 根任务把 `fmt`、`lint`、`typecheck`、`audit`、`test`、`build`、`test:e2e` 串成发布基础门禁。
- `nodeModulesDir: "manual"`、`vendor: true` 说明项目有意识控制依赖解析和可重复性。

优点:

- Deno 权限模型和 JSR 发布路径与 LessJS 的 “standards-first / edge-first” 叙事一致。
- 单一 `deno.json` 管理 workspace 和 import map，适合小团队维护多包框架。
- 显式 typecheck entrypoint 规避了 Windows 上 glob 过长的问题。

风险:

- 对 npm/Vite/Playwright/React/Lit 等 npm 生态仍有实际依赖，不能把 Deno 选型叙述成“脱离 Node/npm 生态”。
- JSR 分发对前端框架用户仍是较窄入口；需要确保 npm/Node 消费路径明确，尤其是 `@lessjs/create` 和 Vite adapter。

建议:

- 文档中把 Deno/JSR 定位为 “primary runtime and publish path”，而不是唯一生态入口。
- 发布前保留 npm 消费 smoke test，验收命令建议: `deno task publish:dry-run` 加一个 Node/Vite generated-project build。

### 4.2 Vite + Hono

判断: 当前阶段正确。Vite 解决构建、dev server、island chunking；Hono 解决 API route 和 edge-compatible request model。

证据:

- `@lessjs/adapter-vite` 负责 route scanning、virtual Hono entry、island transform、SSG build。
- `@lessjs/app` 将 `less()`、content、i18n 组合为统一 Vite plugin。
- 构建输出显示 36 page routes、1 API route、24 islands。
- e2e 覆盖 direct URL、navigation、i18n、theme、DSD、PWA、SEO 等页面级行为。

风险:

- 当前框架的 build orchestration 明显依赖 Vite，`RendererProtocol` 虽然在 core 中存在，但短期不要公开承诺 bundler-agnostic 应用框架。
- Hono 作为 API route engine 是合理的，但 v0.22 Edge handler 尚未落地，不能直接等同于生产 full-stack runtime。

建议:

- 对外分层表述: `@lessjs/core` 是 renderer/runtime contract；`@lessjs/adapter-vite` 是当前官方 build adapter；`@lessjs/app` 是默认应用入口。
- v1.0 前不要扩大到多 bundler adapter，先把 Vite 路径做成稳定参照实现。

### 4.3 DSD-first + Islands

判断: 这是最强技术选择，也是 LessJS 当前最可信的差异化。

证据:

- `packages/core/src/render-dsd.ts` 暴露 `renderDSD()` 和 `renderDSDByName()`。
- `packages/core/src/dsd-element.ts` 直接继承 `HTMLElement`，不是 LitElement；支持 DSD detection、CSR fallback、template event binding、Signals patching。
- `packages/core/src/template.ts` 默认转义 text/attribute，URL 属性会清洗不安全协议，`unsafeHTML()` 是显式 escape hatch。
- `packages/core/src/render-dsd-stream.ts` 提供 `ReadableStream<Uint8Array>` 的 `renderDSDStream()`。
- `www/e2e/dsd-layers.spec.ts` 和 `www/e2e/islands-reactivity.spec.ts` 验证 DSD shadow roots 和 islands upgrade。

外部生态对照:

- MDN 对 Declarative Shadow DOM 的记录确认 `<template shadowrootmode>` 是平台能力，不是框架私有协议: https://developer.mozilla.org/en-US/docs/Web/Web_components/Using_shadow_DOM
- Astro 的 Islands 架构已经教育了市场“默认静态 HTML，按需 hydration”的价值: https://docs.astro.build/en/concepts/islands/
- Qwik 的 resumability 证明“减少 hydration 成本”是可被市场理解的方向，但 Qwik 走的是序列化/恢复执行模型，不是 DSD-first WC 模型: https://qwik.dev/docs/concepts/resumable/

风险:

- DSD/WC 是正确方向，但市场主流心智仍被 React/Next/Astro 等占据；LessJS 需要用可运行 demo、体积数字、组件兼容报告证明价值。
- 目前 DSD report 仍有大量第三方组件边界错误，说明“Universal WC Engine”只能解释为 deterministic outcome，不是 universal SSR。

建议:

- 主口径应固定为: “LessJS gives deterministic rendering outcomes for Web Components: DSD when safe, client-only fallback when unsafe, validation failure when metadata is invalid.”
- 避免说“任意 Web Component 自动 SSR”。

## 5. 架构审计

### 5.1 分层结构

当前分层基本成立:

| 层                    | 包/目录                                                      | 评价                                                                           |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Runtime core          | `@lessjs/core`                                               | 承载 DSD renderer、DsdElement、template、安全、ISR contract、manifest/types    |
| Reactivity            | `@lessjs/signals`                                            | 独立 signals 层，core 通过 framework export 提供单入口 DX                      |
| Build adapter         | `@lessjs/adapter-vite`                                       | 承载 route scanning、entry generation、SSG、island manifests、Hono integration |
| App facade            | `@lessjs/app`                                                | 组合 core adapter、content、i18n，适合作为用户默认入口                         |
| UI package            | `@lessjs/ui`                                                 | DSD-native 组件和 island 示例，是产品 showcase                                 |
| Hub                   | `@lessjs/hub`                                                | schema、indexer、submitter、snapshot、validator                                |
| Split helper packages | `@lessjs/cem`、`@lessjs/compat-check`、`@lessjs/style-sheet` | 已独立发布，但实现仍多为 core re-export                                        |

强项:

- core 不承担 Vite orchestration，职责边界清楚。
- adapter-vite 里 entry descriptor 与 renderer 分开，利于测试。
- ISR contract 放在 core，但平台 adapter 延后到 v0.22，避免过早引入 Cloudflare/Deno Deploy 绑定。
- Hub 和 compatibility classifier 与 build report 形成了“组件准入证据链”。

弱项:

- `@lessjs/cem`、`@lessjs/compat-check`、`@lessjs/style-sheet` 虽然独立成包，但当前仍偏 thin wrapper，不足以证明独立产品面。
- `adapter-vite/src/route-scanner.ts` 仍有 TODO: local island metadata 用 regex 读取，可能漏掉注释、computed property、destructured export 等边界。
- generated Hono entry 对 route module 的 `tagName` fallback 会触发 bundler warning，说明“默认 tagName 派生”和“显式 route export”之间的契约还不够干净。

### 5.2 Public API 稳定性

| API/契约                | 当前状态                                       | 风险                                                             |
| ----------------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| `renderDSD()`           | 已实现并测试                                   | 稳定性较好，仍要继续压缩第三方 known-error 噪音                  |
| `renderDSDStream()`     | 已实现并测试                                   | API 存在，但尚未进入真实 edge handler 主路径                     |
| `DsdElement`            | 已实现 Signals、template binding、patch marker | 是核心护城河，需要冻结前做更多浏览器兼容和内存泄露测试           |
| `html` / `unsafeHTML()` | 默认转义、有 URL sanitize                      | 设计正确，`unsafeHTML` 需要文档强调信任边界                      |
| `ReactiveHost`          | `DsdElement` implements explicit protocol      | 比 duck typing 更可维护                                          |
| `StyleSheet`            | SSR-safe abstraction，另有独立 package         | 独立包目前仍像 re-export facade                                  |
| `client:*` strategies   | load/idle/visible/only 有 e2e 覆盖             | visible 当前 DSD report summary 为 0，需要确认 showcase 是否足够 |
| Hub schema              | validator + strict check 通过                  | artifacts/submission 仍需要更多真实性约束和生态规模              |
| ISR cache/API route     | contract 已有，Memory cache 已测               | production handler 和 KV adapters 尚未实现                       |

## 6. 产品定位与产品形态

### 6.1 最适合的定位

LessJS 最适合定位为:

> 面向 Web Components 的 DSD-first 应用框架和渲染/兼容性证据引擎。

这比“通用全栈 JS 框架”更可信，因为仓库里最强证据都集中在:

- Declarative Shadow DOM 输出。
- `DsdElement` 零 Lit 依赖的 reactive component base。
- SSR/client-only/rejected 三分准入模型。
- DSD report、manifest validation、Hub compatibility reports。
- SSG + progressive islands 的应用模式。

### 6.2 不应该过早争夺的定位

短期不要把 LessJS 包装成:

- Next.js/Nuxt/SvelteKit 级别的全栈平台。
- Astro 的直接替代品。
- OpenWC 的全量替代。
- 任意 Web Component marketplace。
- 通用 UI library。

原因:

- v0.22 Edge Full-Stack 仍是 PLANNING，`CfKvIsrCache`、`DenoKvIsrCache`、`createLessEdgeHandler` 只出现在 ADR/SOP 中，没有实现代码。
- Hub strict validate 当前只有 2 条 package record。
- DSD report 仍有 112 个第三方 SSR 边界错误。
- 当前最强工程能力是 deterministic rendering/admission，不是完整 app platform。

### 6.3 生态对照

| 对象    | 它的强项                                  | LessJS 可避开的正面竞争                                                                |
| ------- | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| Lit     | 成熟的 Web Components 开发模型和 SSR 生态 | LessJS 不要替代 Lit，而是为 DSD-native 组件提供更轻的 runtime base，并允许 Lit adapter |
| Astro   | Islands 和内容站点心智成熟                | LessJS 应强调 Web Components + DSD admission，而不是泛内容站点                         |
| Qwik    | Resumability 和极低 hydration 成本叙事    | LessJS 不走恢复执行模型，而走平台 DSD 与显式 island runtime                            |
| OpenWC  | Web Components 工具、测试、最佳实践       | LessJS 可以补 renderer/admission/reporting，不要替代工具链社区                         |
| Open UI | 组件语义和标准化讨论                      | LessJS 可参考组件 contracts，但不要把标准讨论当成已拥有的市场 moat                     |

外部来源:

- Lit SSR docs: https://lit.dev/docs/ssr/overview/
- OpenWC docs: https://open-wc.org/docs/
- Open UI: https://open-ui.org/
- Custom Elements Manifest: https://github.com/webcomponents/custom-elements-manifest
- Astro Islands: https://docs.astro.build/en/concepts/islands/
- Qwik resumability: https://qwik.dev/docs/concepts/resumable/

## 7. 核心护城河判断

### 7.1 真实护城河

1. DSD-first renderer kernel: `renderDSD()`、nested CE handling、structured `RenderOutput`、DSD report。
2. DSD-native component base: `DsdElement` + `html` + Signals + patch markers，减少 Lit/React runtime 依赖。
3. Deterministic admission: SSR-capable、client-only、rejected、experimental-dom 的可解释结果。
4. Build evidence pipeline: 构建阶段输出 island manifest、DSD report、Hub validation 结果。
5. Standards-aligned package protocol: Less manifest、CEM parser、compatibility classifier、Registry Hub。

### 7.2 还不是护城河的部分

1. Hub marketplace: 当前 2 个包，只能称为 early registry evidence pipeline。
2. Edge Full-Stack: 当前是 v0.22 计划态，不是成熟 runtime moat。
3. Multi-framework adapters: Lit/React/Vanilla adapter 有价值，但不是稀缺点。
4. UI components: `@lessjs/ui` 可作为 showcase，但不应成为主护城河。
5. Package split: `cem`、`compat-check`、`style-sheet` 独立包还需要真实独立 API 和消费场景。

## 8. 主要问题清单

### P0

当前没有 P0。完整门禁全部通过，工作树最终 clean，未观察到发布阻断级失败。

### P1-01: v0.22 Edge Full-Stack 被标为 Current，但实现仍主要在计划文档中

证据:

- `docs/roadmap/ROADMAP.md` 将 v0.22.x 标为 Current。
- `docs/sop/v0.22.0/README.md` 标注 Status: PLANNING。
- `CfKvIsrCache`、`DenoKvIsrCache`、`createLessEdgeHandler` 只在 ADR/SOP 中出现，未在 package source 中实现。
- 构建后没有 `www/dist/isr-manifest.json`，仓库 routes 中未发现 `export const revalidate`。

风险:

- 对外宣称 “Edge Full-Stack” 时，用户会预期有可部署 runtime、KV adapter、ISR demo。当前证据只能支持 “v0.22 planned/current work”，不能支持 “shipped”。

建议:

- 文档中保持 “v0.22 current milestone/planned implementation”，不要说 production-ready。
- 先实现 `createLessEdgeHandler`、`CfKvIsrCache`、`DenoKvIsrCache`、至少一个 `revalidate` route 和部署 demo。

验收:

- `deno task typecheck`
- `deno task test`
- `deno task build`
- 构建生成 `www/dist/isr-manifest.json`
- 新增 Cloudflare/Deno KV mock contract tests
- e2e 覆盖 ISR demo 的 cache header 和 regeneration 行为

### P1-02: DSD gate 通过，但 112 个已知第三方 SSR 边界错误仍会削弱 “Universal WC Engine” 叙事

证据:

- `deno task build` 输出 `DSD report -> ... (407 pages, 112 errors)`。
- `deno task dsd:check-report` 显示: total errors 112，non-recoverable 8，recoverable 104。
- 错误集中在 Shoelace 类组件: `this.host.querySelector is not a function`、`this.host.childNodes is not iterable`、`sl-divider` render symbol、`sl-input` instantiate failure 等。
- DSD gate 通过原因是 known error types 为 0，且 non-recoverable 8 <= threshold 12。

风险:

- 这不是发布失败，但说明第三方 WC SSR 仍靠 classification 和 fallback 管控，不能被营销成“通吃所有 Web Components”。
- 如果 Hub 页面把这些组件作为成功案例展示，用户会混淆 snapshot/client-only 与 SSR-capable。

建议:

- Hub badge 明确区分 `SSR-capable`、`client-only`、`snapshot-only`、`known SSR boundary`。
- DSD report 页面公开展示 known errors 和 fallback path。
- v0.22 或 v1.0 前继续压低 known non-recoverable baseline。

验收:

- `deno task build`
- `deno task dsd:check-report`
- `www/dist/dsd-report.json` 中 unknown error types 保持 0，non-recoverable 逐步低于当前 8。

### P1-03: 构建仍有 `IMPORT_IS_UNDEFINED` 警告，route component 的 `tagName` 契约不干净

证据:

- `deno task build` 出现多条 warning: `Import tagName will always be undefined because there is no matching export in 'app/routes/guide/islands.ts'`。
- `www/app/routes/guide/islands.ts` 默认导出 `IslandsGuidePage`，没有 `tagName` export。
- `entry-renderer.ts` 生成代码使用 `${route.varName}.tagName || '${route.defaultTagName}'` fallback。

风险:

- 当前构建能成功，但 warning 会污染发布信号，也会掩盖真实导入错误。
- 契约模糊: page route 是否必须 export `tagName`，还是由 framework 派生 default tag name。

建议:

- 二选一收敛契约:
  - 框架派生: generated entry 不访问可能不存在的 named export，完全使用 descriptor 的 `defaultTagName`，除非 scanner 已静态确认 `tagName` export。
  - 用户显式: 所有 page route 必须 export `tagName`，缺失时 scanner 直接给出框架错误。

验收:

- `deno task build` 不再出现 `IMPORT_IS_UNDEFINED`。
- 新增 adapter-vite test 覆盖 “page default export without tagName”。

### P1-04: 客户端 JS 总量仍偏大，虽然测试预算当前通过

证据:

- Build manifest Phase 2 显示 `TOTAL JS 655 KB`，并提示 `Total JS exceeds 200 KB budget`。
- PowerShell 复算 `www/dist/client`: 33 个 JS 文件，core 560.4 KB，showcase 97.6 KB，总计 658.1 KB。
- `www/__tests__/build-output.test.ts` 的硬断言是 core < 600 KB、showcase < 320 KB，因此当前测试 PASS。

风险:

- 测试预算和 build manifest warning 的口径不同。对外讲 “less JS” 时，655 KB total client JS 会被用户质疑。
- `client`、`dist`、`server.browser`、FlexSearch、Shoelace showcase 等大 chunk 需要更清楚的 code splitting 和 demo isolation。

建议:

- 将 showcase/vendor/search 从核心 island runtime 中进一步隔离。
- 把 build manifest warning 和测试硬阈值统一，避免 “warning 说超预算，test 却 pass” 的解释成本。
- 首页和 guide 页只加载必要 islands，重型 showcase 延迟到专门页面。

验收:

- `deno task build`
- `deno test www/__tests__/build-output.test.ts --allow-read`
- Build manifest 不再提示 total JS 超 200 KB，或文档明确 200 KB 是 advisory budget、600 KB 是 release blocker。

### P1-05: 公共文档存在状态口径漂移

证据:

- `README.en.md` 和 `docs/status/STATUS.md` 均称 16 个包已对齐 `v0.21.0`。
- `docs/roadmap/ROADMAP.md` 仍写 “Package publishing is staggered... individual package versions may lag”。
- `docs/status/STATUS.md` 的 v0.21 表格列出 10 个 SOP，但末尾写 “Full SOP coverage: 9 SOPs (001-09) all implemented”，同时 `docs/sop/v0.21.0/SOP-010-architect-review-remediation.md` 存在。

风险:

- 状态文档本来是项目治理入口，口径漂移会降低 release note 和 roadmap 的可信度。

建议:

- 将 roadmap 的 package publishing 说明改为当前事实: 16 包已对齐 v0.21.0；如果以后允许 staggered，再写成版本策略而非当前事实。
- STATUS 统一 SOP 数量和完成范围，明确 SOP-010 是 implemented、deferred 还是 advisory。

验收:

- `deno task docs:check-strategy`
- 人工检查 README、STATUS、ROADMAP、v0.21 SOP index、v0.22 SOP index 的 current/completed/planned 口径一致。

### P1-06: Hub 还不足以支撑 marketplace 级别产品形态

证据:

- `deno task hub:validate --strict --json`: total 2, passed 2。
- `deno task hub:check-index`: Index is up to date (2 packages)。
- Roadmap 自己写了 Hub growth 目标: 至少 10 real packages indexed。

风险:

- 2 个包可以证明 pipeline，不足以证明 discovery network effect。
- 如果把 Hub 称为成熟 registry/marketplace，会超过当前证据。

建议:

- 对外称 “Registry evidence pipeline” 或 “early Registry Hub”。
- 先完成 10 个真实包、badges、author submission guide，再提高市场叙事。

验收:

- Hub index 至少 10 个非示例包。
- 每个包有 manifest hash、compatibility report、snapshot metadata、明确 install guidance。
- `deno task hub:validate --strict --json` 无 warning。

### P2-01: Local island metadata scanner 仍是 regex，长期会漏边界

证据:

- `packages/adapter-vite/src/route-scanner.ts` TODO 写明 `readBooleanMeta()` 和 `readHydrateMeta()` 应替换为 AST parsing 或 manifest-first。
- 当前注释列出会漏掉的形式: comment、computed property、destructured export。

风险:

- 用户写法稍复杂时，SSR/client-only admission 可能被误判。

建议:

- 采用 TypeScript AST 或约束 island manifest 文件。
- 对 unsupported syntax 直接给 diagnostic，而不是静默 fallback。

验收:

- 新增测试覆盖注释、computed property、re-export、destructure 四类 case。
- `deno task test --filter route-scanner` 通过。

### P2-02: split packages 目前偏 re-export facade，独立产品面还弱

证据:

- `packages/compat-check/src/index.ts` 从 `@lessjs/core/compatibility` re-export。
- `packages/cem/src/index.ts` 从 `@lessjs/core/cem-parser` re-export。
- `packages/style-sheet/src/index.ts` 从本包 `style-sheet.js` re-export，但 core 也继续暴露 StyleSheet。

风险:

- “独立可用包”是好方向，但如果实现仍强耦合 core，生态用户会把它看成 subpath alias。

建议:

- v1.0 前选择清楚:
  - 要么承认它们是 facade packages；
  - 要么把 canonical implementation 迁到独立包，让 core 反向依赖。

验收:

- 每个 split package 有独立 README、独立 tests、独立 import smoke test。
- `deno check packages/compat-check/src/index.ts packages/cem/src/index.ts packages/style-sheet/src/index.ts` 通过且不需要用户直接理解 core internals。

### P2-03: `renderDSDStream()` API 有代码和测试，但尚未进入真实请求路径

证据:

- `packages/core/src/render-dsd-stream.ts` 实现 `renderDSDStream()`，测试覆盖 shell/footer/order/error/metrics。
- v0.22 SOP 计划把 streaming DSD 接到 Edge handler，但 handler 还未实现。

风险:

- streaming 目前更像 engine primitive，不是产品可见能力。

建议:

- v0.22 Edge handler 中至少用一个 route 走 `renderDSDStream()`，并提供 e2e 或 integration test。

验收:

- `createLessEdgeHandler` 中存在 request-time streaming path。
- Playwright 或 Deno integration test 验证 chunked response 或 streaming-compatible Response。

## 9. 鲁棒性与安全性

强项:

- `html` template 默认 escape text/attribute。
- `unsafeHTML()` 是显式 API，不是默认行为。
- URL 属性会 neutralize unsafe protocols。
- `headExtras` 禁止 raw `<script>`，structured `inject.scripts` 会校验 URL。
- `deno audit` 通过。
- Hub strict validate、index check 和 DSD gate 都存在。
- e2e 覆盖 a11y、theme、i18n、navigation、SEO、PWA、DSD、island upgrade。

剩余风险:

- `unsafeHTML()` 必须在文档中反复强调只接受 trusted HTML。
- Hub snapshot sanitizer 存在，但 package submission trust policy 还不等于签名/溯源完整性。
- DSD report 已知错误仍多，平台要把 “已知 fallback” 和 “成功 SSR” 严格分开。
- route scanner 的 regex metadata 是鲁棒性弱点。

## 10. 后续任务建议

| 优先级 | 任务                                                    | 验收                                                   |
| ------ | ------------------------------------------------------- | ------------------------------------------------------ |
| P1     | 清理 `IMPORT_IS_UNDEFINED` build warning                | `deno task build` 无该 warning                         |
| P1     | 统一 build manifest advisory budget 与测试硬预算        | `deno task build` 和 `deno task test` 预算口径一致     |
| P1     | 收紧 README/STATUS/ROADMAP/SOP 版本口径                 | `deno task docs:check-strategy` + 人工核对             |
| P1     | v0.22 handler/KV/ISR demo 最小闭环                      | build 生成 `isr-manifest.json`，新增 handler tests/e2e |
| P1     | Hub 增长到 10 个真实包并展示 badge 语义                 | `hub:validate --strict --json` 无 warning              |
| P2     | route metadata AST parser 或 manifest-first             | route-scanner 新增边界测试                             |
| P2     | split packages 从 facade 变成真实独立包，或文档降级描述 | 独立 README/tests/smoke checks                         |

## 11. 简单来说有什么问题

1. 工程门禁现在是绿的，这一点比旧状态好很多；没有 P0 阻断。
2. 真正强的是 DSD/WC 渲染和准入证据链，不是泛全栈平台。
3. v0.22 Edge Full-Stack 还是计划态，不能说成已交付。
4. Hub 只有 2 个包，只能证明流程，不能证明生态。
5. 构建还有 `tagName` warning、客户端 JS 偏大、DSD report 还有 112 个已知第三方错误。
6. Roadmap/Status/README 有几处口径不一致，需要在下一轮 release closure 前清掉。

## 12. 参考来源

仓库证据:

- `README.en.md`
- `README.md`
- `deno.json`
- `docs/status/STATUS.md`
- `docs/roadmap/ROADMAP.md`
- `docs/adr/0036-ocean-island-architecture.md`
- `docs/adr/0037-dsd-first-strategic-boundary.md`
- `docs/adr/0038-isr-edge-kv-architecture.md`
- `docs/adr/0039-dsdelement-signals-reactive.md`
- `docs/adr/0040-streaming-dsd.md`
- `docs/sop/v0.21.0/README.md`
- `docs/sop/v0.22.0/README.md`
- `packages/core/src/render-dsd.ts`
- `packages/core/src/render-dsd-stream.ts`
- `packages/core/src/dsd-element.ts`
- `packages/core/src/template.ts`
- `packages/core/src/isr.ts`
- `packages/adapter-vite/src/index.ts`
- `packages/adapter-vite/src/route-scanner.ts`
- `packages/adapter-vite/src/entry-renderer.ts`
- `packages/hub/src/schema.ts`
- `packages/hub/src/cli/validate.ts`
- `packages/hub/src/cli/dsd-report-gate.ts`
- `www/__tests__/build-output.test.ts`
- `www/e2e/*.spec.ts`

外部来源:

- MDN, Using shadow DOM: https://developer.mozilla.org/en-US/docs/Web/Web_components/Using_shadow_DOM
- Lit SSR overview: https://lit.dev/docs/ssr/overview/
- Astro Islands architecture: https://docs.astro.build/en/concepts/islands/
- Qwik resumability: https://qwik.dev/docs/concepts/resumable/
- OpenWC documentation: https://open-wc.org/docs/
- Open UI: https://open-ui.org/
- Custom Elements Manifest: https://github.com/webcomponents/custom-elements-manifest
- Cloudflare Workers KV docs: https://developers.cloudflare.com/kv/
- Deno KV docs: https://docs.deno.com/deploy/kv/manual/
