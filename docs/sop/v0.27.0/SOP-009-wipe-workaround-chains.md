# SOP-009: Wipe Workaround Chains — 消除 23 条架构债

> Version: v0.27.0
> Status: **PARTIALLY COMPLETE** (Phase B done, Phase A failed, Phase C/D untouched)
> Date: 2026-05-31
> Author: Qi (Delivery Director), Gao (Architect)
> Based on: ADR-0069, 5-round full audit (23 chains)
> Supersedes: SOP-007, SOP-008 (absorbed into this)

---

## 执行结果总览

| Phase | 优先级 | 计划 | 实际 | 状态 |
|-------|--------|------|------|------|
| Phase A | 🔴 P0 | 消灭 3 个 data virtual | **失败** — 3 次构建尝试均炸在 Phase 3 SSG 重建 | ❌ |
| Phase B | 🟡 P1 | 品牌清洗 + 死代码 + depressed + cross-runtime | 链条 2/3/14/15/17/19/20 已修 | ✅ |
| Phase C | 🟠 P2 | Entry Renderer 重写 | 未开始 | — |
| Phase D | 🟢 P3 | 逐条清理 (8/9/10/12/18/21/22/23) | 未开始 | — |

---

## Phase A 失败分析（CRITICAL — 交接时必须理解）

### 目标
消除 `virtual:less-nav`, `virtual:less-blog-data`, `virtual:less-i18n-data` 三个数据 virtual，
改为 `less-layout` 静态 import `@lessjs/content/nav`（读磁盘文件 `_generated-nav.ts`）。

### 尝试的方法（3 种，全部失败）

#### 尝试 1: 动态 import ESM
```typescript
// less-layout.tsx
const navMod = await import('@lessjs/content/nav');
```
**失败原因**: Phase 3 SSG 重建时，Vite 将 `@lessjs/content/nav` 提前解析为磁盘路径，
且在 SSR bundle 的重建中作为 `@lessjs/ui` 的依赖被 JSR package resolver 改写。

#### 尝试 2: 静态 import ESM
```typescript
// less-layout.tsx
import { navSections, headerNav } from '@lessjs/content/nav';
```
**失败原因**: 同上。静态 import 在 Phase 3 重构建中遭遇相同的 JSR resolver 重写。

#### 尝试 3: 统一 virtual ID
将 `generatedDataPlugin`（Phase 1）和 `less:ssg-data-dispatch`（Phase 3）
改为统一的 `\0less:gen-nav` virtual ID，两边都用 `load()` 读磁盘文件。

**失败原因**: `less-layout.tsx` 属于 `@lessjs/ui` package。
Phase 3 SSG 重建时，`createLessJsrPackageResolverPlugin` 以 `enforce:'pre'` 拦截
`@lessjs/ui` 内部所有 import，将其放入自己的内部依赖图管理。
即使用了 `\0` 前缀的 virtual ID，经过 JSR resolver 的内部重写后仍然无法正确解析。

### 根因

`ssg-package-resolver.ts` 的 `createLessJsrPackageResolverPlugin`（`enforce:'pre'`）
管理 `@lessjs/ui` 包内所有 import 的解析。当 `less-layout.tsx`（inside `@lessjs/ui`）
import 任何 `@lessjs/content/*` 路径时，JSR resolver 将其视为 `@lessjs/ui` 的
monorepo 内依赖，按 workspace alias 逻辑重写为 `packages/ui/src/app/data/...`（错误路径）。

修复这个需要重构 JSR resolver 的内部依赖图管理逻辑。不是小改。

### 当前状态

| Virtual 模块 | 类型 | 状态 |
|-------------|------|------|
| `virtual:less-nav` | 数据 bridge | 保留 — Phase 3 结构性约束 |
| `virtual:less-blog-data` | 数据 bridge | 保留 — 同上 |
| `virtual:less-i18n-data` | 数据 bridge | 保留 — 同上 |
| `virtual:less-hono-entry` | Builder entry | 保留 — 构建时代码生成 |
| `virtual:less-build-trigger` | Builder trigger | 保留 — Vite 钩子 |
| `virtual:less-client-entry` | Builder entry | 保留 — 客户端入口 |
| `virtual:less-ssg-entry` | Builder entry | 保留 — SSG 入口 |
| `virtual:less-routes` | Builder types | 保留 — 路由类型生成 |

**结论**: 8 个 virtual 模块一个没少。3 个数据 virtual 理论上能删但 pipeline bug 卡住了。
5 个 builder virtual 是构建时代码生成的内存载体，和写到磁盘临时文件功能等价。

---

## Phase B 完成清单（✅ 已验证）

### 品牌清洗

| 链条 | 旧值 | 新值 | 涉及文件 |
|------|------|------|---------|
| 2 | `__LESS_CLIENT_ONLY_TAGS__` | `__CLIENT_ONLY_TAGS__` | entry-renderer.ts, render-nested.ts, less-plugin.ts, render-dsd.test.ts |
| 2 | `__LESS_HEAD_EXTRAS__` | `__HEAD_EXTRAS__` | entry-renderer.ts, build-ssg.ts |
| 2 | `__LESS_BLOG_BASE_PATH__` | `__BLOG_BASE_PATH__` | content/index.ts |
| 3 | `data-less-e` (DOM 属性) | `data-eid` | event-hydration.ts + 3 test files |
| 14 | `LessJS Island Markers` 注释 | `Island Markers` | island-transform.ts |
| 19 | `<!-- LessJS ERROR: -->` | `<!-- Render Error: -->` | render-errors.ts |

### 死代码 + Deprecated + Cross-Runtime

| 链条 | 操作 | 文件 |
|------|------|------|
| 15 | 删除 `dom-simulation.ts` | core/src/dom-simulation.ts |
| 17 | 去掉 `@deprecated` 标记（仍在用，无替代品） | core/src/types.ts |
| 20 | `typeof Deno` → `LESSJS_ENV` 环境变量 | core/src/render-errors.ts |

### 验证

```
✅ 全仓库 grep __LESS_* → 零残余
✅ data-less-e → 零残余
✅ LessJS ERROR HTML 注释 → 零残余
✅ 构建: 351 页 HTML, 185 KB client JS, 三阶段全过
```

---

## 未完成任务（交接清单）

### 立即可做（小改动）

| 链条 | 任务 | 预估 |
|------|------|------|
| 4 | 路由页 `locale=` 批量删除（less-layout 已自推导，28 个文件只需删属性） | 30 min |
| 11 | `www/app/data/` 硬编码路径参数化 | 1 hr |
| 18 | `normalizeLocalePath` 重复：接受现状或提取到共享包 | 讨论 |
| 22 | CSP Nonce 占位符 → Hono 原生 nonce | 1 hr |
| 23 | 清理 `adapter-vite/build-context` dead export | 10 min |

### 需要中等重构（P1）

| 链条 | 任务 | 预估 |
|------|------|------|
| 8 | try/catch 静默吞错审计（43+ 处） | 4-6 hr |
| 10 | SSG HTML 正则操作 → cheerio/htmlparser2 | 3-4 hr |
| 16 | Core 模块级可变状态（5 个 `let`）→ Singleton/context | 3-4 hr |

### 需要大重构（P2，建议 v0.28）

| 链条 | 任务 | 预估 |
|------|------|------|
| 7 | Entry Renderer 785 行字符串代码生成 → 模板/AST | 1-2 天 |
| 9 | Route Scanner 668 行正则 → AST parser（oxc/swc） | 1-2 天 |
| 21 | Content Scanner `extractMeta()` 手写解析器 → AST | 4-6 hr |

### 需要架构突破（P0，但被 pipeline 阻塞）

| 链条 | 任务 | 说明 |
|------|------|------|
| 1+5+6+13 | 消灭 3 个 data virtual | 需要改 `createLessJsrPackageResolverPlugin` 内部依赖图管理 |

---

## 已写入的 Docs

- `docs/conversation/v0.27.0/23-chains-audit.md` — 五轮审计全记录
- `docs/adr/ADR-0069-wipe-workaround-chains.md` — 架构决策
- `docs/sop/v0.27.0/SOP-009-wipe-workaround-chains.md` — 本文档
- `.workbuddy/artifacts/virtual-chains-audit.md` — 完整技术审计报告（23 链条细节）

## 构建

```
cd www && deno task build
```
351 页 HTML, 185 KB client JS, zero build errors.
