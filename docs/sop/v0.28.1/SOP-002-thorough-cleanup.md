# SOP-002: v0.28.1 Thorough Cleanup — Hygiene Convergence

> **版本**: v0.28.1
> **日期**: 2026-06-01
> **输入**: [v0.28.0 综合仓库审计报告](../../conversation/20260601/LessJS-审计-最终汇总报告.md)（47 findings: 8 P0, 13 P1, 12 P2, 14 P3）
> **目标**: 把 v0.28.0 留下的"散弹"收拾干净——版本锚点漂移、`.gitignore` 漏洞、文档索引失同步、最小权限违规——为后续 v0.28.2 代码工作周期铺平地面
> **非目标**: 不解决审计中需要实际代码 / 测试 / 架构改动的 P0/P1（router/runtime 零测试、SSR bundle 1.53 MB、9 个 P0 代码问题等），这些留给 v0.28.2+ 后续周期

---

## 概要

v0.28.0 合并到 main 之后，对仓库做了一次**无目标盲扫**（10 个类别：卫生、配置、文档、安全、CI、www、代码、Agent artifacts、审计报告、杂项），共发现 47 个可执行项。本 SOP 把它们分成三层：

- **本周期执行（Day 1 hygiene）**：8 P0 + 5 选定 P1 = 13 个 trivially safe 改动。无代码逻辑变化，无 API 改动。
- **下周期规划（v0.28.2+）**：需要实际代码 / 测试 / 架构工作的 5 个 P0 + 7 个 P1。列入 v0.28.2 SOP。
- **追踪但不紧急（v0.29+ 或不修）**：纯风格 / 文档组织 / 信息类发现。文档化为 follow-up。

---

## 工作流

```
本 SOP → 用户确认 → 工程师执行 → deno fmt + lint → 提交 → 合并 dev → 合并 main → 推送
```

---

## 执行步骤

### Step 1: `.gitignore` 整理（P0 trivials）

**文件**: `.gitignore`

**变更**:

- L44-45: 去重 `.workbuddy/`（保留一行）
- L59-60: 去重 `node_modules`（保留 `node_modules/`）
- 新增 `.gstack/` 到 L44 之后
- 新增 `www/.less/` 路径修正（当前 `.less/` 已存在，根级 `.less/` 已覆盖，但 `www/.less/` 被 `www/.less/` 单独指定，与 `.less/` 重复）

**为什么 P0**: `.gstack/` 是 AI agent 的安全审计历史目录，包含敏感扫描数据，不应入库。已被误提交 1 个 23.3 KB 文件。

### Step 2: 清理已泄漏的跟踪文件

```bash
git rm --cached .gstack/security-audit-history/audit-2025-05-22-comprehensive.md
git rm --cached .less/external-manifest.json
```

**为什么 P0**: 这些文件原本就不该入库；被 .gitignore 后必须显式 untrack。

### Step 3: 版本锚点统一升级 v0.27 → v0.28

| 文件                                       | 改动                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `README.md`                                | 7 处 v0.27.0 → v0.28.0（含包版本表、What's New 标题）                         |
| `README.zh.md`                             | 7 处 v0.27.0 → v0.28.0                                                        |
| `www/app/routes/index/index.tsx`           | L2 comment v0.27→v0.28; L203 hero eyebrow V0.27→V0.28                         |
| `www/app/routes/roadmap.tsx`               | L281 v0.27.x→v0.28.x                                                          |
| `www/app/routes/guide/getting-started.tsx` | L52 v0.27→v0.28                                                               |
| `www/app/routes/changelog.tsx`             | L5 v0.27.0→v0.28.0                                                            |
| `docs/status/STATUS.md`                    | 全文改写为 v0.28.0 现状（详见 Step 4）                                        |
| `docs/sop/README.md`                       | 加 v0.28.0 row + v0.28.1 row；v0.22.x/v0.23.0/v0.24.3 行从 Planning 移到 Done |
| `tools/check-strategic-docs.ts`            | L48 check name; L50 required 数组; publicDocs 加 v0.22-v0.28 changelogs       |

### Step 4: `docs/status/STATUS.md` 全文重写

**输入参考**:

- v0.28.0 changelog (12 commits, 9 themes)
- v0.28.0 release note
- 19 packages aligned to v0.28.0
- Architecture positioning unchanged

**新结构**（按 v0.28 现状）:

- Current Line: v0.28.0 (Contracts & Tokens — IMPLEMENTED)
- Historical: v0.27.0, v0.26.x, v0.25.0, v0.24.x, v0.23.x
- Next: v0.28.1 hygiene (本 SOP) → v0.28.2 security/code → v1.0.0 freeze
- Package Version State: All 19 packages at v0.28.0
- Rendering Mode: 加 Theme System 行（Open Props migrated）

### Step 5: `tools/check-strategic-docs.ts` 同步

**变更 5.1** — 升级版本断言:

```ts
// L48
name: 'v0.28.0 is the current public line',
// L50
required: ['v0.28'],
```

**变更 5.2** — publicDocs 列表加新 changelog（Finding 10.6）:

```ts
'docs/changelog/v0.22.x.md',
'docs/changelog/v0.23.0.md',
'docs/changelog/v0.24.2.md',
'docs/changelog/v0.24.3.md',
'docs/changelog/v0.24.4.md',
'docs/changelog/v0.25.0.md',
'docs/changelog/v0.26.0.md',
'docs/changelog/v0.26.1.md',
'docs/changelog/v0.27.0.md',
'docs/changelog/v0.28.0.md',
```

### Step 6: 验证

```bash
deno task fmt          # 期望: 0 改动
deno task lint         # 期望: 0 错误
deno run -A tools/check-strategic-docs.ts   # 期望: passed
```

### Step 7: 提交

```bash
git add .gitignore README.md README.zh.md docs/ www/app/routes/ tools/check-strategic-docs.ts
git rm --cached .gstack/security-audit-history/audit-2025-05-22-comprehensive.md
git rm --cached .less/external-manifest.json
git commit -m "chore(v0.28.1): hygiene cleanup — bump v0.28 doc anchors, gitignore leaks, sync strategic-docs check"
```

---

## 47 项发现的完整分类（审计报告映射）

### 本 SOP 执行（13 项）

| #  | Finding                                             | 文件                    | Effort     |
| -- | --------------------------------------------------- | ----------------------- | ---------- |
| 1  | 1.1 `.gitignore` L44-45 去重 `.workbuddy/`          | `.gitignore`            | trivial    |
| 2  | 1.2 `.gitignore` L59-60 去重 `node_modules`         | `.gitignore`            | trivial    |
| 3  | 1.3 `.gstack/` 不在 gitignore                       | `.gitignore`            | trivial    |
| 4  | 1.3 git rm cached audit-2025-05-22                  | `.gstack/...`           | trivial    |
| 5  | 1.4 `.less/external-manifest.json` tracked          | `.less/...`             | trivial    |
| 6  | 4.7 `STATUS.md` 全文改写 v0.28                      | `docs/status/STATUS.md` | small      |
| 7  | 4.8 `README.md` / `README.zh.md` 升级 v0.28         | `README*.md`            | trivial    |
| 8  | 4.9 `www/app/routes/index/index.tsx` v0.28          | `www/.../index.tsx`     | trivial    |
| 9  | 4.1 `docs/sop/README.md` 索引补 v0.28 + v0.28.1     | `docs/sop/README.md`    | small      |
| 10 | 4.6 留 v0.28.0 后续 (CHANGELOG.md)                  | —                       | 留 v0.28.2 |
| 11 | 7.1 `tools/check-strategic-docs.ts` 升级断言 v0.28  | `tools/...`             | trivial    |
| 12 | 7.5/7.6/7.7 roadmap/getting-started/changelog v0.28 | `www/...`               | trivial    |
| 13 | 10.6 publicDocs 列表加新 changelog                  | `tools/...`             | trivial    |

### 下周期规划 v0.28.2+（代码工作，5 P0 + 7 P1 = 12 项）

| #  | Finding                                                                    | 主题      | 为什么不在本周期                                                      |
| -- | -------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------- |
| 14 | 5.1 `hub:scan` 用 `-A` 改最小权限                                          | Security  | 需分析 scanner.ts 实际需要的 permissions（Playwright 需 --allow-net） |
| 15 | 5.2 esm.sh CDN 替换                                                        | Security  | 需引入 unpkg/jsdelivr 自托管逻辑                                      |
| 16 | 5.3 headExtras XSS regex                                                   | Security  | 需新 sanitizer + 测试                                                 |
| 17 | 5.4 `less-layout` URL 验证                                                 | Security  | 需 security review + 新 utils                                         |
| 18 | 5.5 innerHTML 无 runtime 消毒                                              | Security  | 需品牌化 DSD prop + 全栈迁移                                          |
| 19 | 9.1 P0-QA-1: router 零测试                                                 | QA        | 需写 100+ 单元测试                                                    |
| 20 | 9.1 P0-QA-2: runtime 零测试                                                | QA        | 需写 80+ 单元测试                                                     |
| 21 | 9.1 P0-PERF-1: SSR Bundle 1.53 MB                                          | Perf      | 需条件化 `ssr.noExternal`                                             |
| 22 | 9.1 P0-FE-1: `collectEventBindings` vs `serializeEventMarkers` ID mismatch | Frontend  | 需 unified counter + 测试                                             |
| 23 | 9.1 P0-FE-3: `LessMiddleware = (c: any, next)` 改类型                      | Frontend  | 需 Hono 上下文类型调研                                                |
| 24 | 9.1 P0-ARCH-1: `registerAdapter()` module-level singleton                  | Architect | 需 `createAdapterRegistry()` 工厂                                     |
| 25 | 9.1 P0-DEV-25: subpackage hono version drift (4.12.22+4.12.23)             | DevOps    | 需 `deno install --node-modules-dir` 重对                             |
| 26 | 9.1 P0-DEV-26: deno.lock playwright drift (1.57+1.59)                      | DevOps    | 同上                                                                  |

### 追踪但不紧急 v0.29+（12 项 P2）

| #  | Finding                                                      | 主题                             |
| -- | ------------------------------------------------------------ | -------------------------------- |
| 27 | 3.2 `tsconfig.json` 缺注释说明                               | Config                           |
| 28 | 3.3 `fmt.exclude` vs `lint.exclude` 漂移                     | Config                           |
| 29 | 3.4 subpackage `build` 任务是 `deno check` 而非 build        | Config（潜在 break，风险待评估） |
| 30 | 4.2 留 v0.28.0 README 是空的                                 | Doc（已修：v0.28.0 有 SOP-001）  |
| 31 | 4.3 `docs/sop/*.md` 散落组织                                 | Doc                              |
| 32 | 4.6 `CHANGELOG.md` 缺 v0.27+v0.28                            | Doc                              |
| 33 | 5.6 `DENO_DEPLOY_TOKEN` 命令行参数                           | Security（已知，建议改 env var） |
| 34 | 7.2-7.4 架构页缺版本                                         | Doc                              |
| 35 | 7.8 代码注释残留 v0.27 锚点                                  | Doc                              |
| 36 | 10.4 `packages/core/deno.json:34` 引用未导出 `render-dsd.ts` | Config                           |
| 37 | 10.6 strategic-docs publicDocs 列表已修                      | Doc ✓                            |
| 38 | 10.7 `check-current-docs-no-legacy.ts` 未审计                | Tooling                          |

### 追踪但不修（14 项 P3 informational）

- `.gstack/` 文件非跟踪确认（之前误判）
- `.gitattributes` 已 minimal but correct
- 零 `package.json` 确认
- `dom-simulation.ts` / `less-toc.tsx` 确认已删
- `_layoutWorkaroundReRender` Issue #28 追踪
- v0.27.0 release note post-tag rewrite 已在 v0.28.0 披露
- `.github/agents/` 3 个 agent 文档待确认用途

---

## v0.28.2+ 候选 SOP 主题（next cycles）

基于审计剩余的 12 项 P0/P1，下个周期 v0.28.2 应聚焦：

1. **Security Minimum Privileges**（Findings 5.1, 5.2, 5.3, 5.4, 5.5, 5.6）— 把 hub:scan、esm.sh、headExtras、less-layout、innerHTML、DENO_DEPLOY_TOKEN 一并治理
2. **Test Floor for Zero-Test Packages**（Findings 9.1 P0-QA-1/2）— router + runtime + protocols 单元测试
3. **Event Hydration ID Unification**（Finding 9.1 P0-FE-1）— 单一 ID 计数器
4. **SSR Bundle Size Reduction**（Finding 9.1 P0-PERF-1）— 条件化 `ssr.noExternal`
5. **Adapter Registry Refactor**（Finding 9.1 P0-ARCH-1）— `createAdapterRegistry()` 工厂

每个主题独立 SOP，避免本次 hygiene-only 范围被撑大。

---

## 验证清单

- [ ] `deno task fmt` 通过（0 改动）
- [ ] `deno task lint` 通过（0 错误）
- [ ] `deno run -A tools/check-strategic-docs.ts` 通过
- [ ] `git ls-files | grep -E "^\.gstack|^\.less/external-manifest"` 返回空
- [ ] `git grep "v0\.27\.0 is the current public"` 返回空
- [ ] `git grep "<code>v0\.27\.0" README.md README.zh.md` 返回空
- [ ] `git status` 干净（除 .workbuddy 校对稿外）

## 出口标准

- 上方验证清单全勾
- 提交到 `codex/v0.28.1-thorough-cleanup` 分支
- 合并到 `dev`
- 合并到 `main`（ff）
- `origin/dev` 和 `origin/main` 都已推送（HTTP/1.1）

## 非目标

- 不修任何 P0/P1 代码问题（留给 v0.28.2+）
- 不改 changelog/release 的措辞
- 不动 `packages/hub` 任何代码
- 不重命名 SOP 编号体系
- 不解决 `deliverables/` / `docs/conversation/20260601/` 的去向（决策待用户）

---

## 元信息

- **执行人**: opencode (miniMax-M3)
- **审计来源**: 6 个角色 + 1 个汇总报告，详见 `docs/conversation/20260601/`
- **本 SOP 输入文件**:
  - `docs/conversation/20260601/LessJS-审计-最终汇总报告.md` (242 lines)
  - 6 个角色分报告（架构师/前端/QA/DevOps/性能/安全，共 ~4,000 lines）
- **本 SOP 输出文件**: 本文件 + 12 个代码改动（13 个 execution items）
