# 20260610 全面审查建议：代码质量 / 架构 / 选型 / 定位 / 协议缺口审计

- 日期：2026-06-10
- 性质：外部视角快速审查 + 协议层缺口实证核查（conversation 记录，非 ADR，不具约束力）
- 仓库状态基线：v0.37.2 包线，v0.37.3（Data/Database Boundary）Active，发布门禁未闭合
- 范围：packages/（20 包，约 27,300 行 src + 17,000 行测试）、docs/、tools/、www/、CI

---

## 0. 一句话结论

工程质量和架构纪律在同类早期项目里属于上游水平，技术主张成立；最大风险不在代码，
而在**单人维护 20 包 + 重治理流程 + 三支柱定位的资源摊薄**。协议层现状是：
**参考实现已完成，协议本身尚未发货**——五大契约类型全部寄居在实现包内，
第三方可运行的合规测试套件全仓为零。

---

## 1. 代码质量审查

### 1.1 优点

- 模块划分细：core 33 个文件平均 160 行，无失控巨型模块；接口冻结有 ADR 编号回链
  （如 `packages/core/src/vnode.ts` 引用 ADR-0057）。
- 类型严谨：全部 packages 仅约 30 处 `: any`（多为 mixin 构造器惯用法），大量
  `unknown` + 类型守卫。TODO/FIXME 仅 3 处。
- 测试体系完整：94 个单元/集成测试文件、11 个 Playwright e2e spec、覆盖率门槛、
  发布后 consumer smoke。

### 1.2 需要修的具体问题（按优先级）

1. **字符串插值 bug**：`packages/app/src/authoring.ts:216,221,231,351` 用单引号
   字符串包含 `'${ERROR_PREFIX}'`，模板未插值，错误信息会原样输出字面量。
   同文件其他位置用反引号是正确写法。
2. **过期兼容壳**：`packages/adapter-vite/src/` 内 11 个 `@deprecated` re-export
   薄壳文件注明 "will be removed in v0.37.0"，当前已 v0.37.2 仍未删除。
   要么删除，要么更新注释为真实的移除版本。
3. **巨型文件**：`packages/ui/src/open-layout.tsx`（1,122 行，内含自称 "hack" 的
   `_setupDetailsToggle`，第 961 行附近）建议拆分。
4. **测试不均衡**：ui 包 3,346 行 src 仅 2 个测试文件；rpc/router/i18n/runtime
   覆盖偏薄。adapter-vite（29 个）与 core（23 个）则很厚。
5. **遗留注释漂移**：`packages/ssg/src/entry-renderer.ts` 文件头仍写
   `@openelement/core - Entry Renderer`（v0.36 迁移后未更新）。
6. 已知循环依赖 adapter-vite ↔ content（H-16，靠 protocols 包缓解）保持监控。

---

## 2. 架构审查

### 2.1 架构本身是对的

- `app`（作者门面）→ `ssg`（Vite 无关 SSG 核心）→ `adapter-vite`（Vite 编排）
  三层分工清晰，v0.36 的 SSG 抽取方向正确。
- "JSX 函数 API 编译为 DsdElement class" + AST 静态扫描 island 配置（要求字面量、
  动态值报错）是务实设计，渲染管线无需特判。
- 不做 VDOM diff、Signal 局部更新、DSD 为 ground truth——自洽且符合定位。

### 2.2 核心隐忧：治理/代码比例失衡

- 75 个 ADR、19 个 next 执行包（各 8 件套）、约 7,000 行治理工具（含 4,117 行
  AutoFlow 内核）、本地 16 条 gate 命令、10 个 CI workflow（sop-gate 14 job、
  test 17 job）——这套流程是为 20 人团队设计的，项目实际是单人 + AI 驱动。
- 建议：v1.0 前把 gate 收敛到 2 层（PR 快速门禁 + 发布全量门禁），AutoFlow
  冻结而非继续演进。
- 微型包建议合并评估：signals（247 行）、style-sheet（119 行）、runtime（144 行）、
  protocols（203 行）可考虑合并进 core 或相邻包，减少发布矩阵与版本对齐成本。
  注意：若 protocols 按第 5 节升级为真正的协议包，则 protocols 必须保留且独立。

---

## 3. 选型审查

| 选型 | 评价 |
| --- | --- |
| Deno + JSR | 自洽（Deno-first 定位），但显著缩小潜在用户池——多数 WC 用户在 Node/npm 生态。建议尽早在 gate 中实测 JSR 的 npm 兼容分发路径 |
| alien-signals | 轻量、性能好，合理；facade 封装正确（见 5.3） |
| Hono | 跨运行时、轻，合理；它本身就是运行时可移植层，不是需要被替换的接缝 |
| Vite 8 + 自写 adapter | 合理，ssg 核心已与 Vite 解耦，为换构建器留了余地 |
| Lit/React/Vanilla 三 adapter | 支撑"多框架 WC 共存"主张，是差异化必需品，保留 |

---

## 4. 定位审查与"全可替换"理想的可行性判断

### 4.1 真实空档

Astro 把 WC 当普通 HTML（无 DSD 预渲染）、Fresh 锁 Preact、Lit SSR 是库不是框架。
"WC 原生 DSD 引擎 + 静态默认 0 JS + 多框架 island 共存"确实没人占。

### 4.2 三个风险（按严重度）

1. **受众极小**（战略文档自己承认"当前唯一用户是作者本人"）。三支柱（全栈框架 +
   渲染引擎 + Registry Hub）对单人项目太宽。建议楔子收敛为最可防御的
   "通用 WC DSD 渲染引擎"（core + DsdElement）——它可被 Astro/11ty 用户作为库
   采用，比说服别人换整个框架容易一个数量级。Hub 最后做。
2. **护城河浅**：Astro 加一个 DSD 集成的成本远低于自建框架生态的成本。
   对策是速度 + 把 DsdElement 做成事实标准的 Lit-like base class。
3. **版本节奏与稳定性叙事矛盾**：6 周 110 个 tag、一天最多 6 个版本、JSR 发布
   出过 partial failure，与 "release gates that prove the package graph" 卖点
   相悖。v1.0 前降速，用稳定性本身做营销素材。

### 4.3 "每个环节可替换"的可行版本与不可行版本

愿景：modern web std API 构建的协议层，之上是 element（对标 Lit）+ 全栈框架，
element↔Lit、Deno↔Bun、UI 可换、database 可换、server 可换。

**结论：作为架构可行，作为单人维护的产品面不可行。成败取决于把"可替换"实现为
"标准面"还是"抽象层"。**

分层心智模型：

```text
Product 层（可替换实现）: DsdElement <-> Lit <-> 任意 WC 基类; fullstack f
Protocol 层（薄、冻结、有合规测试）: 唯一真正"拥有"的东西
Web Standards（只选用不拥有）: Custom Elements / DSD / fetch / Streams / ESM
```

逐接缝判断：

| 接缝 | 判断 | 理由 |
| --- | --- | --- |
| Element 基类（DsdElement ↔ Lit） | 可行，优先级最高 | Custom Elements 本身就是互操作标准；adapter-lit 已证明 |
| UI 库可换 | 可行 | Astro 已验证；三 adapter 已在做 |
| Deno ↔ Bun | 几乎免费，勿自建抽象 | 核心只依赖 Web 标准 API，CI 加 Bun smoke job 即可 |
| Hono ↔ Express | 错误接缝，放弃 | Hono 已是可移植层；Express 是 Node 专属 req/res 模型，桥接丢流式丢类型。正确姿势：对外暴露标准 `fetch` handler，Express 用户社区自桥 |
| Database 任意切换 | 定义契约不做适配器 | ADR-0095 方向正确：薄 `load(ctx)` / DataAdapter 契约 + recipe 文档，不发 adapter-postgres 类包，否则重造 ORM 必死 |

执行纪律："**默认 + 一个证明**"——每个接缝官方只维护默认实现 + 一个证明件
（证明协议不偏向默认实现），其余交社区：

| 接缝 | 默认 | 证明件 |
| --- | --- | --- |
| Element | DsdElement | adapter-lit |
| UI | adapter-vanilla | adapter-react |
| 运行时 | Deno | Bun CI smoke |
| Server | Hono | 暴露 fetch handler |
| Data | 内置 load(ctx) | 一份 Supabase/Drizzle recipe |

### 4.4 "厚协议层"的纠正：协议应薄而冻结，厚在合规测试

- 协议越厚，契约面越大，adapter 实现成本与版本耦合越重，N×M 矩阵爆炸。
- protocols 包目前 203 行是优点不是不足。
- 正确的"厚"在文档与测试：每个协议配官方合规测试套件（contract test suite），
  第三方写 adapter 跑套件即知合规。这是 Lit 没有的东西。
- 试金石一条："这个东西是标准的缺口补丁，还是标准之上又加的私有抽象？"
  前者该有（如 DSD SSR 契约——平台没有 SSR 标准），后者是 Sails 之路。
  例：signal 契约应对齐 TC39 Signals 提案形状而非 alien-signals 私有 API，
  标准落地后协议自动退役是好事。

---

## 5. 协议缺口实证审计（2026-06-10 核查）

判定标准：(a) 可工作实现；(b) 与实现分离的正式契约（ADR/冻结）；
(c) 第三方可运行的合规测试套件。

| 缺口 | (a) 实现 | (b) 正式契约 | (c) 合规套件 |
| --- | --- | --- | --- |
| 1 渲染契约（元素类 → DSD HTML） | ✅ `RendererProtocol` + `getDefaultRegistry().register(...)`，三 adapter 经此接入 | 🟡 ADR-0025/0077/0080 齐全，但接口定义在 `packages/core/src/render-schemas.ts:42`，未进 protocols；端口化排 v0.37.5（Planned） | ❌ `dsd-conformance.test.ts` 直接 import 第一方 `renderDsd`，只验证实现符合 WHATWG，不能验证第三方实现 |
| 2 island/hydration 契约 | ✅ 全链路（authoring → AST 扫描 → entry 生成 → client:* 调度） | 🟡 ADR-0092:62 禁止改名（软冻结）+ v0.33 DESIGN/ACCEPTANCE；无专门 ADR，类型在 app/core 实现包内 | ❌ |
| 3 signal 互操作契约 | ✅ `packages/signals` facade 封装 alien-signals，暴露自定义 `.value`/`.subscribe`，`createAlienEngine(alienMod)` 支持引擎注入 | 🟡 `SignalEngine`（types.ts:38）/`SignalLike`（core/src/signal-like.ts:12）接口存在；TC39 polyfill 已于 v0.22.1 删除；无互操作 ADR | ❌ 注入点天然适合做引擎合规套件但未写成引擎解耦形式 |
| 4 数据契约 | ✅ `DataAdapter` + `MemoryDataAdapter`（core 的 /data 子路径） | ✅ ADR-0095 Accepted（2026-06-10），五项中最完整 | ❌ MemoryDataAdapter 自称 reference implementation 但无可对第三方运行的套件 |
| 5 路由清单契约 | ✅ `EntryDescriptor`（ssg/src/entry-descriptor.ts，纯数据、可序列化可 diff，设计良好） | ❌ 零 ADR；冻结提议仅停留在 docs/conversation/20260601 审计稿:508 | ❌ |

三个关键事实：

1. **`@openelement/protocols` 名不副实**：当前只装构建期 blog/nav/i18n 元数据
   （47 行接口 + validators），README 自我声明不拥有渲染/引擎/配置。
   五大契约类型全部寄居在 core/app/ssg 实现包内。
2. **合规测试套件全仓为零**：无任何可用于验证第三方实现的 contract test。
3. **路线图自我认知一致**：v0.37.5 "Protocol Ports + Adapter Map" 仍 Planned；
   v0.37.3 仍 Active 且 ACCEPTANCE 8 项仅勾 1 项（与 ADR-0095 不同步：仍列着
   已被降级为 recipe 的 "FileDataAdapter has unit tests"）。

好消息：未发现"假抽象"。adapter 确实走注册接口、signal 确实走 facade、
EntryDescriptor 确实是纯数据。剩下的是搬家和固化，不是重构。

---

## 6. 建议行动序列（按依赖序）

1. **关闭 v0.37.3**：同步 ACCEPTANCE 与 ADR-0095（移除 FileDataAdapter 条目、
   勾选已达成项），闭合 hardened publish + post-publish consumer smoke 门禁。
2. **修小债**：authoring.ts 插值 bug；adapter-vite 11 个过期 @deprecated 壳；
   entry-renderer.ts 头注释。
3. **EntryDescriptor 补 ADR 并冻结**：五项中唯一契约空白，且是 ssg↔adapter-vite
   接缝，最该先冻结。
4. **v0.37.5 协议搬家**：将 `RendererProtocol`、`IslandConfig`/`HydrationStrategy`、
   `SignalEngine`/`SignalLike`、`DataAdapter`、`EntryDescriptor` 迁入
   `@openelement/protocols`，实现包反向依赖（纯类型搬家，成本低）。
5. **每契约配可导出合规套件**（形如 `runRendererConformance(impl)` 参数化测试）。
   起步顺序：signal 最容易（注入点已就位）；渲染契约价值最高（是
   "DsdElement 对标 Lit" 主张的证明件）。
6. **协议层成立的验收标准**：adapter-lit 只 import `@openelement/protocols`
   并通过全部合规套件。这一天之前，"厚协议层"只是架构意图，不是产品。
7. 并行的非代码项：验证 JSR→npm 分发路径；gate 收敛为 2 层；AutoFlow 冻结；
   降低发版频率；定位叙事收敛为"WC DSD 渲染引擎"单点。

---

## 7. 边界声明

本文是 conversation 记录，用于沉淀 2026-06-10 的外部审查结论与决策建议。
任何 API、包结构、发布与协议变更仍须按 PROJECT_WORKFLOW 走 ADR + next 执行包 +
门禁证据后方可实施。