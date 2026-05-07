# LessJS v0.8.0 — Product Requirements Document

**版本**: v0.8.0
**定位**: 功能完善 + Island Manifest + Blog 开发启动
**前置**: v0.7.0 (P0 审计修复，354 测试通过)
**文档日期**: 2026-05-07

---

## 1. 产品目标

v0.8.0 要让 LessJS 从"经过审计但覆盖不足的框架"进入"核心模块可信、组件模型统一、Island 系统可演进"的状态。具体：

1. **测试覆盖补全** — signals (749 行)、dsd-hydration (Mixin 核心逻辑) 从零覆盖到有充分单元测试，使 v0.7.0 建立的工程纪律覆盖到所有核心模块
2. **代码结构可维护** — render-dsd.ts (780 行) 拆分为 4 个职责清晰的模块，消除单文件巨石
3. **组件模型统一** — UI 组件全部使用 DsdLitElement Mixin，insertAfterHead 去重到 core，消除 ui/core 的重复实现
4. **Island 系统演进基础** — Island Upgrade Manifest 提供页面级 island 清单，为后续 SSG 优化和 Fullstack 打基础
5. **Blog 生态起点** — @lessjs/blog 作为 SSG 插件启动开发，验证 core API 稳定性

**完成标准**: 所有 P0 需求完成，P1 需求至少完成 2/3，测试总数 > 400，零 P0/P1 级已知 Bug。

---

## 2. 用户故事

### 核心开发者（贡献 LessJS 本身）

- **US-1**: 作为 LessJS 贡献者，我希望 signals 包有完整测试，这样我重构 signal/computed/effect 时不担心破坏行为
- **US-2**: 作为 LessJS 贡献者，我希望 render-dsd.ts 拆分为多个文件，这样我修改 SSR 某个环节时不用在 780 行里定位
- **US-3**: 作为 LessJS 贡献者，我希望 dsd-hydration Mixin 有单元测试，这样我扩展水合逻辑时能验证正确性

### 应用开发者（使用 LessJS 构建站点）

- **US-4**: 作为应用开发者，我希望 Signal 在支持原生 Signal 的浏览器上自动切换，这样我的产物体积更小
- **US-5**: 作为应用开发者，我希望 Island 有页面级清单，这样 SSG 构建时只加载当前页面需要的 island chunk，减少无效请求
- **US-6**: 作为应用开发者，我希望用一行配置就能拥有博客功能（`lessBlog()`），这样我不必手写博客路由和 RSS

### 运维/性能优化者

- **US-7**: 作为性能优化者，我希望 Speculative Loading 策略可观测，这样我能验证 eager/visible/idle 策略是否按预期生效
- **US-8**: 作为框架评估者，我希望有 Interactive Playground（StackBlitz），这样我能 30 秒内体验 LessJS 而不必本地安装

---

## 3. 需求池

### P0 — 必须完成（版本阻断项）

| # | 需求 | 说明 | 验收标准 | 影响范围 |
|---|------|------|----------|----------|
| P0-1 | **signals 测试套件** | `@lessjs/signal` 749 行零覆盖 | signal/computed/effect/islandEffect 核心路径覆盖，测试行数 ≥ 300 | packages/signals |
| P0-2 | **dsd-hydration.ts 单元测试** | WithDsdHydration Mixin 核心逻辑验证 | DSD 检测、_hydrateEvents、updateDsdElement、AbortController 清理均有测试 | packages/core |
| P0-3 | **render-dsd.ts 拆分** | 780 行拆为 4 个模块 | 拆为 render-template / render-attributes / render-children / render-dsd（入口），单文件 ≤ 250 行，所有现有测试通过 | packages/core |
| P0-4 | **UI 统一到 DsdLitElement** | 3 个组件未使用 Mixin | 所有 @lessjs/ui 组件使用 `extends LitDsdElement`，无组件直接 extends LitElement | packages/ui, packages/adapter-lit |
| P0-5 | **insertAfterHead 去重** | ui → core | insertAfterHead 实现仅存在于 @lessjs/core，@lessjs/ui 引用 core 导出 | packages/core, packages/ui |

### P1 — 应该完成（版本重要项）

| # | 需求 | 说明 | 验收标准 | 影响范围 |
|---|------|------|----------|----------|
| P1-1 | **Signal 原生切换** | npm 依赖 + globalThis.Signal 回退 | 支持 globalThis.Signal 时使用原生实现，否则回退 @lessjs/signal；产物体积减少可测量 | packages/signals, packages/core |
| P1-2 | **Island Upgrade Manifest** | 页面级 island 清单 | SSG 构建输出每页 island 清单（chunk URL + strategy），替代全局入口；manifest 格式文档化 | packages/core |
| P1-3 | **@lessjs/blog 开发启动** | SSG 插件形态 | lessBlog() Vite 插件可用：扫描 .md → 生成路由 → 渲染列表页/文章页/RSS；至少 1 个 dogfooding 示例 | 新包 @lessjs/blog |

### P2 — 可以推迟（不阻断版本发布）

| # | 需求 | 说明 | 推迟理由 | 影响范围 |
|---|------|------|----------|----------|
| P2-1 | **Interactive Playground** | StackBlitz 一键体验 | 不影响框架质量，属于开发者体验优化 | docs/infrastructure |
| P2-2 | **Playwright E2E 测试** | 浏览器级集成测试 | 测试基础设施投入大，当前 deno test + mock HTMLElement 已覆盖核心逻辑；E2E 在 v0.9 全栈时价值更大 | 全局 |
| P2-3 | **Speculative Loading 可观测** | 策略浏览器测试 | 依赖 Playwright 基础设施，且当前 speculative loading 功能稳定 | packages/core |

---

## 4. 需求依赖关系

```
P0-3 (render-dsd 拆分)
  └── P0-2 (dsd-hydration 测试) — 拆分后测试更清晰，但非硬依赖

P0-4 (UI 统一到 DsdLitElement)
  └── P0-5 (insertAfterHead 去重) — 统一过程中可顺带去重

P1-1 (Signal 原生切换)
  └── P0-1 (signals 测试套件) — 先有测试才能安全重构

P1-2 (Island Upgrade Manifest)
  └── P0-3 (render-dsd 拆分) — manifest 需要清晰的渲染管线

P1-3 (@lessjs/blog)
  └── P0-3 (render-dsd 拆分) — blog 依赖稳定的 SSG 渲染接口
  └── P0-4 (UI 统一) — blog 页面可能使用 UI 组件
```

**建议实施顺序**:
1. P0-1 (signals 测试) + P0-2 (dsd-hydration 测试) — 并行
2. P0-3 (render-dsd 拆分) — 测试保障后的重构
3. P0-4 + P0-5 (UI 统一 + insertAfterHead 去重) — 一起做
4. P1-1 (Signal 原生切换) — 依赖 P0-1
5. P1-2 (Island Manifest) — 依赖 P0-3
6. P1-3 (@lessjs/blog) — 依赖 P0-3, P0-4

---

## 5. 待确认问题

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| Q-1 | render-dsd.ts 拆分为哪 4 个模块？具体边界？ | P0-3 实施方案 | 初步建议 render-template / render-attributes / render-children / render-dsd(入口)，需架构师确认 |
| Q-2 | 哪 3 个 UI 组件未使用 DsdLitElement？ | P0-4 范围 | 需代码审计确认 less-card / less-dialog / less-hero-ping 等组件的状态 |
| Q-3 | Signal 原生切换的回退策略：是运行时检测 globalThis.Signal，还是构建时通过条件导入？ | P1-1 实施方案 | 运行时检测更简单，构建时条件导入产物更小；需权衡 |
| Q-4 | Island Upgrade Manifest 的输出格式：JSON 文件？HTML `<script type="application/json">` 内联？还是 HTTP Link header？ | P1-2 API 设计 | 建议 JSON 文件（与 SSG 产物同目录），便于 CDN 预取 |
| Q-5 | @lessjs/blog 的 Markdown 解析器选型：marked vs markdown-it？ | P1-3 依赖选择 | marked 更轻量，markdown-it 插件生态更丰富；建议 marked 起，需要时迁移 |
| Q-6 | v0.8.0 是否需要提升包版本号（core → 0.8.0）？ | 发布策略 | ADR 0006 规定 0.x MINOR 升级允许 Breaking Change；render-dsd 拆分可能改变内部导入路径 |
| Q-7 | P2 项是否在 v0.8.x 补丁版本中完成，还是推迟到 v0.9？ | 版本规划 | 建议推迟到 v0.9（Playwright 与 Fullstack 测试一起做） |

---

## 6. 约束与风险

### 约束

- **测试环境**: deno test，无浏览器。HTMLElement/CustomElementRegistry 需要 mock
- **core 零框架依赖**: @lessjs/core 不依赖任何 UI 框架（Lit/Vue/React）
- **DSD-first**: 所有组件输出可读 HTML，JS 在 HTML 之后
- **技术栈**: Deno 2.x + TypeScript + Vite 8.x + Lit 3.x + Hono 4.x

### 风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| render-dsd 拆分引入回归 | 中 | 高 | 拆分前确保现有 354 测试全部通过，拆分后立即跑全量测试 |
| Signal 原生切换导致行为差异 | 低 | 高 | P0-1 测试套件先建立，切换后跑对比测试 |
| @lessjs/blog 范围蔓延 | 中 | 中 | 严格限定 v0.8 为 SSG 插件形态，不含 MDX/评论等扩展 |
| insertAfterHead 去重影响 SSG 输出 | 低 | 中 | 去重后跑 docs 站全量构建对比 |

---

_文档作者: 许清楚 (Xu) · Product Manager | 2026-05-07_
