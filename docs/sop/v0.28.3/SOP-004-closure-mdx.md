# SOP-004: v0.28.3 Cleanup Closure + MDX Support

> **版本**: v0.28.3
> **日期**: 2026-06-01
> **执行状态**: Deferred / blocked by v0.28.2
> **输入**: [v0.28.0 综合仓库审计](../../conversation/20260601/LessJS-审计-最终汇总报告.md) 47 findings（v0.28.1 已关 13；v0.28.2 仍是计划，未关 24）+ MDX feature 决策
> **目标**: 关掉 v0.28.2 留的 10 项 cleanup + 加入 MDX 支持（走 `renderDsd()` 路径）
> **非目标**: 不加其他新功能；不动 Hub 协议；不改 manifest schema
> **目标输出**: v0.28.3 release note + ADR-0072 (MDX) + 3 个包新增 MDX 能力 + 200+ 单元测试

---

## 概要

> 2026-06-02 校准：本 SOP 不能在 v0.28.2 未实现、未验证、未发布前启动 release
> bump。MDX、test floor 和 lockfile realignment 是多周工作，本轮只允许合并不改变
> runtime 行为的预备性修订。

v0.28.3 = **pre-freeze closure**。两件事合在一起：

**Closure (2 周)**:

- 阶段 1 — Test floor: `packages/router` / `packages/runtime` / `packages/protocols` 加单元测试
- 阶段 2 — deno.lock 重对齐: `deno install --node-modules-dir` + pin `hono@4.12.23` + `playwright@1.59.1`
- 阶段 3 — P2 杂项: `tsconfig.json` 加注释、`lint.exclude` 对齐 `fmt.exclude`、`.github/agents/` 用途决策

**MDX (2-3 周)**:

- 阶段 4 — 设计: ADR-0072，决策走 `renderDsd()`，选 `@mdx-js/mdx` 作 parser
- 阶段 5 — 实现: `@lessjs/content` 加 `.mdx` loader、`adapter-vite` 加 MDX plugin、snapshot 测试、docs

总 4-5 周。ship 后直接进 v0.29.0-rc.1 freeze。

---

## 工作流

```
本 SOP → 阶段 1-3 独立 commit → 阶段 4 ADR → 阶段 5 实现 → 全部 6 项 check + 全 workspace test → 提交 codex/v0.28.3-closure-mdx → 合并 dev → 合并 main → 推送 → 发 JSR
```

**Closure (1-3) 阶段可并行**：3 个 PR 同时跑，每个独立合并。MDX (4-5) 必须等 closure 完才进，因为 closure 涉及 deno.lock 改动，MDX 测试也可能用到 hono。

---

## Entry Criteria

- v0.28.2 deprecated purge merged to `dev` and `main`
- v0.28.2 package versions, changelog, release note, and CI are complete
- full local gate and GitHub Actions are green on the v0.28.2 release commit
- v0.28.3 ADR-0072 is reviewed before MDX implementation starts

---

## 阶段 1: Test Floor（1 周）

### 1.1 `packages/router` 单元测试

**目标**: 至少 100 个测试，覆盖：

- 路由匹配（静态、动态、catch-all、嵌套、optional segments）
- 参数提取（string、number、custom pattern）
- 导航 hook（beforeEach、afterEach、redirect、rewrite）
- 守卫（auth、role-based、conditional）
- 404 / error 边界
- URL pattern ↔ path 互转
- Hash 路由模式
- History API 集成
- 与 `client:load/idle/visible/only` 交互
- 与 `renderDsd()` 输出协作（路由变化触发 island re-render）

**测试文件**: `packages/router/src/__tests__/`

**验证**: `deno test -A packages/router/` 全过；覆盖率 ≥ 70%

### 1.2 `packages/runtime` 单元测试

**目标**: 至少 80 个测试，覆盖：

- `DsdElement` lifecycle（connectedCallback、disconnectedCallback、attributeChangedCallback、adoptedCallback）
- `render(): string | VNode` 行为
- effect 生命周期（创建、dispose、嵌套 effect）
- signal 集成（`effect()`、`computed()` 自动 unwrap）
- island boundary（`client:*` hydration 触发条件）
- error boundary（`onRenderError` 钩子）
- 与 `@lessjs/core` 的 facade re-export 行为
- 与 `@lessjs/signals` 的 facade re-export 行为
- 与 `@lessjs/style-sheet` 的 facade re-export 行为

**测试文件**: `packages/runtime/src/__tests__/`

**验证**: `deno test -A packages/runtime/` 全过；覆盖率 ≥ 70%

### 1.3 `packages/protocols` 单元测试

**目标**: 至少 60 个测试，覆盖：

- 协议类型定义（adapter、renderer、hydration、isr 的 schema）
- manifest schema 校验（happy path + 各字段错误路径）
- 协议版本协商（v1、v2、向后兼容）
- JSON schema 生成和消费
- 与 `@lessjs/core` types 的一致性

**测试文件**: `packages/protocols/src/__tests__/`

**验证**: `deno test -A packages/protocols/` 全过；覆盖率 ≥ 70%

---

## 阶段 2: deno.lock 重对齐（0.5 周）

### 2.1 删 `node_modules/.deno/`

**变更**:

```bash
rm -rf node_modules/.deno/
git checkout -- deno.lock  # 清空到 commit 时状态
```

**理由**: 当前 lockfile 里有 hono 4.12.22 + 4.12.23 双版本、playwright 1.57 + 1.59 双版本。删 `.deno/` 后重新生成会强制解析到最新允许范围。

### 2.2 重新 `deno install`

**变更**:

```bash
deno install --node-modules-dir
deno task graph:check
deno run -A tools/check-package-graph.ts
deno run -A tools/check-import-map.ts
```

### 2.3 在子包 `deno.json` 里 pin

**变更**: 在 `packages/hub/`、`packages/adapter-vite/` 等用到 hono 的子包 `deno.json`：

```json
"imports": {
  "hono": "npm:hono@4.12.23",
  "playwright": "npm:playwright@1.59.1"
}
```

**验证**:

- `git ls-files deno.lock` 只有单一 hono + 单一 playwright 版本
- `node_modules/.deno/hono/` 只有 `4.12.23/` 一个目录
- `deno task test` 全过

---

## 阶段 3: P2 杂项（0.5 周）

### 3.1 `tsconfig.json` 加注释

**文件**: `tsconfig.json`

**变更**: 文件头加注释说明 purpose（Deno 项目的 IDE 提示，JSX 走 `react-jsx`，target 选 Deno 默认）以及不维护（deno.json 才是 single source of truth）

**验证**: 注释存在

### 3.2 `lint.exclude` 对齐 `fmt.exclude`

**文件**: `deno.json`（或 `deno.json` lint config 块）

**变更**: 把 `fmt.exclude` 里的 `deliverables/, www/content/blog/, www/app/routes/, www/app/data/, docs/mockups/, docs/conversation/, custom-dist/, dist-test-ssg-render/, .deno_cache/` 同步到 `lint.exclude`（如果存在差异）

**验证**: `deno task lint` 不扫被 `fmt` 忽略的目录

### 3.3 `.github/agents/` 用途决策

**文件**: `.github/agents/adr-reviewer.agent.md`, `sop-gate.agent.md`, `test-quality.agent.md`

**决策路径**:

- 选项 A: **保留 + 加 README** — 写 `agents/README.md` 说明这些是 Copilot agent 提示文件，给开发者用
- 选项 B: **删除** — 当前没 CI 用到，是 dead docs
- 选项 C: **移入 docs/** — 当 docs 而不是 agent config

**推荐**: A（成本最低、保留 3 个 agent 提示资产）

**验证**: 选 A 时 `agents/README.md` 存在并解释用途

---

## 阶段 4: MDX 设计（1 周）

### 4.1 ADR-0072: MDX in LessJS

**输出文件**: `docs/adr/ADR-0072-mdx-in-lessjs.md`

**决策记录**:

- **MDX 输出路径**: 走 `renderDsd()`，输出 VNode 树
- **Parser**: `@mdx-js/mdx@3.x`（de-facto standard、active maintenance、ESM-native）
- **编译时机**: build-time（不在 runtime 解析）
- **集成点**: `packages/content/src/mdx/` 独立子目录
- **Hydration**: 通过现有 DSD 路径自动
- **Component 范围**: MDX 可用任何 `DsdElement` + `signal` 原语 + 全局 DSD context

**替代方案（已拒绝）**:

- ❌ 另开 HTML string 路径 — 引入 second content pipeline，违反"单一渲染路径"
- ❌ Runtime 解析 — 性能差、bundle 大，与 LessJS 静态优先理念冲突
- ❌ 自写 parser — 工程量大，违反"用成熟库"

### 4.2 集成点详细设计

```
.mdx file in www/content/blog/
    ↓ (build-time)
@mdx-js/mdx compile → JSX (with @lessjs/core/jsx-runtime import)
    ↓
renderDsd(<MDXRoot>) → VNode tree
    ↓
Same DSD pipeline as .tsx routes
    ↓
HTML output with declarative shadow DOM + hydration markers
```

**Frontmatter**: 同 blog post，YAML frontmatter parsed by `@lessjs/content` 现有逻辑

**Island 嵌入**: MDX 里直接写 `<my-counter client:idle />`，复用现有 island 协议

### 4.3 不在 MDX 设计范围

- ❌ MDX provider（不引入 React context-style provider 概念）
- ❌ MDX plugin 系统（不支持 custom remark/rehype plugins，v1.0 之后考虑）
- ❌ MDX 组件库（不预置组件，用户用 DSD 组件）

---

## 阶段 5: MDX 实现（1-2 周）

### 5.1 `packages/content` 加 MDX 支持

**新增文件**:

- `packages/content/src/mdx/compile.ts` — `@mdx-js/mdx` 包装
- `packages/content/src/mdx/types.ts` — MDX module type
- `packages/content/src/mdx/__tests__/compile.test.ts` — parser 测试

**导出**: `compileMdx(source: string, opts?): Promise<MdxModule>`

**测试**:

- 解析 simple markdown → VNode
- 解析含 JSX 的 markdown → VNode with components
- 解析 frontmatter → frontmatter 对象
- 解析含 `client:*` 的 island → 标记 hydration
- 错误 case（unclosed tag、bad import）

### 5.2 `packages/adapter-vite` 加 MDX plugin

**新增文件**:

- `packages/adapter-vite/src/plugin-mdx.ts` — Vite plugin 包装
- `packages/adapter-vite/src/__tests__/plugin-mdx.test.ts` — plugin 测试

**实现**:

```ts
import mdx from '@mdx-js/rollup';
export function mdxPlugin(): Plugin {
  return {
    ...mdx({
      jsxImportSource: '@lessjs/core',
      providerImportSource: undefined, // 不需要 provider
    }),
    enforce: 'pre',
  };
}
```

**集成点**: 在 `adapter-vite/src/cli/build-ssg.ts` 已有 plugin 列表加 `mdxPlugin()`

**验证**:

- `deno task build` 处理 `www/content/**/*.mdx`
- SSR 输出含 DSD 标记（`<template shadowrootmode>`）
- 浏览器 hydration 正常

### 5.3 文档

**新增文件**:

- `www/app/routes/guide/mdx.tsx` — MDX guide page
- `docs/adr/ADR-0072-mdx-in-lessjs.md` — 设计决策（阶段 4 已写）
- `packages/content/README.md` 加 MDX section

**内容**:

- 怎么写 `.mdx` file
- 怎么在 MDX 用 `DsdElement`
- 怎么在 MDX 用 signal
- 怎么在 MDX 嵌入 island
- frontmatter 用法
- 已知限制（不支援 plugin 系统、provider 等）

### 5.4 snapshot 测试

**新增文件**:

- `www/__tests__/v0.28.3-mdx.test.ts` — MDX end-to-end
- `packages/content/src/mdx/__tests__/fixtures/` — 测试用 `.mdx` 文件

**测试**:

- 1 个 simple MDX → SSR output snapshot
- 1 个含 island 的 MDX → SSR + hydration snapshot
- 1 个含 signal 的 MDX → SSR + interactive snapshot
- 1 个含错误案例的 MDX → 友好错误

### 5.5 E2E 测试（可选）

**新增文件**:

- `www/__tests__/e2e/mdx-content.spec.ts` — Playwright

**测试**:

- 访问 MDX content 页面
- 验证 DSD hydration 正常
- 验证 island 在 MDX 里工作

---

## 阶段 6: 不在本 SOP 范围

| # | Finding                                   | 留给             | 理由 |
| - | ----------------------------------------- | ---------------- | ---- |
| 1 | `_layoutWorkaroundReRender` upstream 修复 | v0.28.2 SOP 1.2  | —    |
| 2 | Router / runtime / protocols 零测试       | ✓ 本 SOP 1.1-1.3 | —    |
| 3 | deno.lock hono drift                      | ✓ 本 SOP 2.3     | —    |
| 4 | deno.lock playwright drift                | ✓ 本 SOP 2.3     | —    |
| 5 | `tsconfig.json` 缺注释                    | ✓ 本 SOP 3.1     | —    |
| 6 | `fmt.exclude` vs `lint.exclude` 漂移      | ✓ 本 SOP 3.2     | —    |
| 7 | `.github/agents/` 用途                    | ✓ 本 SOP 3.3     | —    |
| 8 | 其他 P2/P3 informational                  | 不修             | 追踪 |

---

## 验证清单

### Closure (1-3)

- [ ] `deno test -A packages/router/` ≥ 100 测试
- [ ] `deno test -A packages/runtime/` ≥ 80 测试
- [ ] `deno test -A packages/protocols/` ≥ 60 测试
- [ ] router/runtime/protocols 覆盖率 ≥ 70%
- [ ] `deno install --node-modules-dir` 后 `node_modules/.deno/hono/` 单版本
- [ ] `deno install --node-modules-dir` 后 `node_modules/.deno/playwright/` 单版本
- [x] `tsconfig.json` 注释存在（2026-06-02 preflight）
- [x] `lint.exclude` 与 `fmt.exclude` 对齐（2026-06-02 preflight）
- [x] `.github/agents/README.md` 存在并解释用途（2026-06-02 preflight）

### MDX (4-5)

- [ ] `docs/adr/ADR-0072-mdx-in-lessjs.md` 存在并签字（STATUS 标记 IMPLEMENTED）
- [ ] `packages/content/src/mdx/compile.ts` 存在
- [ ] `packages/adapter-vite/src/plugin-mdx.ts` 存在
- [ ] `deno task build` 处理 `*.mdx` 文件
- [ ] MDX SSR 输出含 `<template shadowrootmode>` 标记
- [ ] `www/app/routes/guide/mdx.tsx` 存在
- [ ] MDX snapshot 测试覆盖 4 个 case
- [ ] 1 个 example MDX file 在 `www/content/` 用于 demo

### 全局

- [ ] `deno task fmt` 0 改动
- [ ] `deno task fmt:check` 通过
- [ ] `deno task lint` 0 错误
- [ ] `deno run -A tools/check-strategic-docs.ts` 通过
- [ ] `deno run -A tools/check-current-docs-no-legacy.ts` 通过
- [ ] `deno run -A tools/check-import-map.ts` 通过
- [ ] `deno run -A tools/check-package-graph.ts` 通过
- [ ] `deno run -A tools/check-dist-no-object-object.ts` 通过
- [ ] `deno task test` 全部 19 个包通过
- [ ] `deno task build` SSR bundle < 1 MB

## 出口标准

- 入口条件全部满足；不得在 v0.28.2 未闭合时 bump 到 v0.28.3
- 上面验证清单全勾
- 提交到 `codex/v0.28.3-closure-mdx` 分支（每阶段独立 commit）
- 合并到 `dev`
- 合并到 `main`（ff）
- `origin/dev` 和 `origin/main` 都已推送（HTTP/1.1）
- 发布 v0.28.3 到 JSR（19 个包 + `@lessjs/content` 新增 MDX export）
- 写 `docs/changelog/v0.28.3.md` 和 `docs/release/v0.28.3.md`

## 非目标

- 不加其他新功能（不引入 Storybook、不加 CMS 集成、不加 i18n 增强）
- 不改 Hub 协议 / manifest schema
- 不写 MDX plugin 系统
- 不写 MDX provider 概念
- 不重命名 SOP 编号体系

---

## 元信息

- **执行人**: 待指派工程师
- **执行预估**: 4-5 周
  - 阶段 1: 1 周
  - 阶段 2: 0.5 周
  - 阶段 3: 0.5 周
  - 阶段 4: 1 周
  - 阶段 5: 1-2 周
- **回滚策略**: 阶段间独立 commit，可单独 revert
- **MDX 依赖**:
  - `@mdx-js/mdx@3.x` — parser/compiler
  - `@mdx-js/rollup@3.x` — Vite plugin (rollup-compatible)
  - 不需要 `@mdx-js/react`（不用 React）
- **兼容性**:
  - MDX 输出 100% DSD 兼容，不引入 second pipeline
  - 现有 `.tsx` route 行为不变
  - 现有 blog/nav 行为不变（除非显式改后缀 `.md` → `.mdx`）
- **依赖关系**:
  - 阶段 1-3 完全独立
  - 阶段 4 独立（只需 ADR review）
  - 阶段 5 依赖阶段 4 ADR 签字
