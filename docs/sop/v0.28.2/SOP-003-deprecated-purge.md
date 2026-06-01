# SOP-003: v0.28.2 Deprecated Code Purge — Single-Pass Cleanup

> **版本**: v0.28.2
> **日期**: 2026-06-01
> **执行状态**: Planned / not implemented in current `dev`
> **输入**: [v0.28.0 综合仓库审计](../../conversation/20260601/LessJS-审计-最终汇总报告.md) 47 findings + v0.28.1 hygiene baseline
> **目标**: 一遍删光所有 compat exports / 死代码 / `any` / v0.27 锚点 / 过时签名 / weak type guard / SSR bundle 1.53 MB。
> **非目标**: 不写新功能、不加新 API、不补 router/runtime/protocols 测试（留给 v1.0.0-patch 系列）
> **目标输出**: v0.28.2 release note + 18 项代码删除 + 5 项 security + 1 项 perf

---

## 概要

> 2026-06-02 校准：当前 `dev` 只新增了本 SOP 与 v0.28.3 SOP。代码仍保留
> compat exports、部分 v0.27 注释锚点、CLI `console.log` 用法，19 个包版本仍是
> `0.28.0`。因此本文件是执行计划，不是 release evidence；未跑完出口标准前不得
> bump package、写 release note 或发布 JSR。

v0.28.1 关了 13 项 hygiene（文档/`.gitignore`/版本锚点），剩 34 项。v0.28.2 把剩 34 项再筛一遍：

- **本周期直接删/重写（18 项）**：无用户可见行为变化的纯删除
- **本周期顺手修（6 项）**：5 P1 security + 1 P1 perf
- **本周期跳过（10 项）**：3 项零测试 + 2 项 deno.lock drift + 5 项杂项 P2 → 留给 v1.0.0-patch 或 v0.28.3

**v0.28.2 完成后状态**: 无 compat exports、无 `any` 在 hot path、无 v0.27 注释、security 干净、SSR bundle < 1 MB、19 个包 deno.json 自洽。

---

## 工作流

```
本 SOP → 工程师按 3 阶段顺序执行 → fmt + lint + 6 项 check → 提交到 codex/v0.28.2-deprecated-purge → 合并 dev → 合并 main → 推送
```

**3 阶段独立 commit**：阶段 1 失败可单独 revert，阶段 2 失败不动阶段 1，阶段 3 失败可挪 v0.28.3。

---

## 阶段 1: Deprecated Code Purge（18 项，纯删除/重写）

### 1.1 `registerAdapter` / `getAdapter` / `getRegisteredAdapters` 兼容导出删除

**文件**:

- `packages/core/src/index.ts`
- `packages/core/src/adapter-registry.ts`

**变更**:

- 删 module-level `registerAdapter` / `getAdapter` / `getRegisteredAdapters` 实现
- 全部内部调用改成 `createAdapterRegistry()` 工厂实例（v0.28.0 已引入）
- 暴露 `getDefaultRegistry()` 函数（工厂后的默认 singleton）

**风险**: 中（grep 全部 47 个 @lessjs/* import 站点）

**验证**: `git grep "registerAdapter(" packages/ www/ docs/` 只剩工厂内部或注释引用

### 1.2 `_layoutWorkaroundReRender` 状态检查并删除

**文件**: `www/app/components/less-layout.tsx`（grep 确认实际路径）

**变更**:

- 检查 GitHub Issue #28 状态
- 已修 → 删整个函数 + 所有调用
- 未修 → 移到 `docs/known-issues/ISSUE-28.md`，代码里只留一行 `// workaround for chromium DSD layout — see ISSUE-28`

**验证**: `git grep "_layoutWorkaroundReRender"` 只剩 known-issues.md 引用

### 1.3 v0.27/v0.26 注释锚点清扫

**文件**:

- `www/vite.config.ts:220-221` — `// v0.26: Minimal headerNav` + `// TODO(v0.27): derive from route meta scanning.`
- `packages/ui/src/less-layout.ts:1114` — `// v0.27: adopt + move — proper DOM API, no innerHTML hack.`
- `packages/core/src/dsd-element.ts:145, 160` — `* v0.27 (ADR-0065): Effect dispose tracking.`
- `packages/core/src/jsx-render-string.ts:250` — `// textContent prop: ... (v0.27)` (historical — 改成 `// historical` 或删)

**变更**:

- vite.config.ts: 删 v0.26 anchor；TODO 已完工（看代码确认）就删，没完工改成 `// TODO: derive from route meta scanning.`
- less-layout.ts: 删 v0.27 anchor（move 动作 v0.27 已 ship）
- dsd-element.ts: 注释改 `Effect dispose tracking (ADR-0065)`，删 v0.27 前缀
- jsx-render-string.ts: historical 注释保留但改 `// historical — v0.27 fix`

**验证**: `git grep "v0\.27" -- 'packages/**/*.ts' 'www/**/*.ts' 'www/**/*.tsx'` 只剩 import path 字符串（`@lessjs/core@0.27`）和 historical comment

### 1.4 根 deno.json 47 个 `@lessjs/*` imports 拆分

**文件**: 根 `deno.json` imports 块

**变更**: 把 47 个 `@lessjs/*` 实际只被子包用到的 import，挪到对应 `packages/<name>/deno.json` 的 imports 块；根 deno.json 只留 workspace-level 工具

**风险**: 高（要重跑 graph:check + import-map check + 全 workspace build）

**验证**: `deno run -A tools/check-import-map.ts` 通过；`deno run -A tools/check-package-graph.ts` 通过；每个 `deno task -f packages/<name> build` 通过

### 1.5 `packages/core/deno.json:34` 引用非导出文件

**文件**: `packages/core/deno.json:34`

**变更**:

- 选项 A: `deno check src/index.ts src/render-dsd.ts` → `deno check src/index.ts src/render-dsd-stream.ts`（用真实导出的文件）
- 选项 B: 改 task 名 `build` → `typecheck`（更准确反映实际做的事）

**推荐**: B（task 名应反映实际行为）

**验证**: `deno task -f packages/core typecheck` 退出 0；其他子包统一改

### 1.6 `renderDsd()` 8-param signature 重构

**文件**: `packages/core/src/render-dsd.ts`

**变更**: 8 个 positional params → 1 个 options object

```ts
// 之前
export function renderDsd(vnode, mode, ssrAdmissionPlan, isHydrating, isClient, ctx, adapter, opts);

// 之后
export interface RenderDsdOptions {
  mode?: RenderMode;
  ssrAdmissionPlan?: SsrAdmissionPlan;
  isHydrating?: boolean;
  isClient?: boolean;
  ctx?: LessRenderContext;
  adapter?: LessAdapter;
  experimental?: { signalTracking?: boolean };
}
export function renderDsd(vnode: VNode, opts: RenderDsdOptions = {}): string;
```

**风险**: 中（grep 所有调用点 + 更新所有 caller）

**验证**: `deno task test` 全过；`git grep "renderDsd("` 全部使用新签名（除 `render-dsd.ts` 内部）

### 1.7 `LessBuildContext.reset()` 手动字段清理

**文件**: `packages/core/src/build-context.ts`（grep 确认）

**变更**:

```ts
// 之前
reset() {
  this.field1 = null;
  this.field2 = undefined;
  this.field3 = [];
  ...
}

// 之后
reset() {
  Object.assign(this, freshContext);
}
```

**验证**: build-context 单元测试通过

### 1.8 `console.log` production residual 清除

**文件**: `packages/**/src/` + `www/app/` 下所有 `console.log`（test 文件除外）

**变更**:

- 改 `console.debug` 或 `console.warn` 加条件
- 加 `@internal` 注释标注
- 真要保留的加 `if (Deno.env.get("LESS_DEBUG"))` 包裹

**验证**: `git grep "console\.log" -- 'packages/' 'www/app/'` 只剩 test 文件和显式 DEBUG 包裹

### 1.9 Hub Client-Only Tags regex parsing 替换

**文件**: `packages/hub/src/scanner.ts`（grep "Client-Only Tags"）

**变更**: 用 manifest schema parse 替代 regex 解析

**验证**: `deno task test:hub` 通过

### 1.10 `serializeEventMarkers` 只序列化第一个 handler

**文件**: `packages/core/src/event-hydration.ts`

**变更**: 改循环序列化所有 handlers（同一元素多个 `on-*` 都该有 marker）

**验证**: event-hydration 单元测试加 case（同一元素 2+ 事件 handler）

### 1.11 事件名映射缺 `dblclick` 等

**文件**: `packages/core/src/event-hydration.ts` 或 `packages/core/src/dom-events.ts`

**变更**: 补全 DOM Level 3 事件名映射表（`dblclick`, `focusin`, `focusout`, `mouseenter`, `mouseleave`, `pointerover`, `pointerout`, `pointerenter`, `pointerleave`, `pointerdown`, `pointermove`, `pointerup`, `pointercancel`）

**验证**: 单元测试覆盖所有 DOM Level 3 事件名

### 1.12 `_renderOrHydrate` 错误处理一致性

**文件**: `packages/core/src/dsd-element.ts`

**变更**: v0.28.0 已加 try/catch + onRenderError 钩子。验证：

- 所有 `_renderOrHydrate` 抛错路径都过 `_renderErrorFallback`
- `_renderErrorFallback` 清理顺序正确（effect disposers → event cleanups → onRenderError）
- 没有 try/catch 漏掉的早期返回

**验证**: dsd-element-hydration 128 个新测试 + manual code review

### 1.13 `data-signal-html` subtree 不重绑

**文件**: `packages/core/src/dsd-element.ts` `_hydrateSignals` 块

**变更**: v0.28.0 SOP-001 已加 data-signal-html，验证 subtree 重绑完整（特别是嵌套 island）

**验证**: signal-hydration regression test 加 case

### 1.14 `SignalContext` SSR Map 泄漏

**文件**: `packages/core/src/signal-context.ts`

**变更**: 加 per-request scoping。SSR 用 `WeakMap<Request, SignalContext>` 或 `AsyncLocalStorage`

**验证**: SSR 多请求并发测试（10+ 并发请求不互相污染）

### 1.15 `isVNode()` weak type guard 强化

**文件**: `packages/core/src/vnode.ts`

**变更**:

```ts
// 之前
export function isVNode(x: unknown): x is VNode {
  return x != null && typeof x === 'object' && 'type' in x;
}

// 之后
export function isVNode(x: unknown): x is VNode {
  if (x == null || typeof x !== 'object') return false;
  const t = (x as { type?: unknown }).type;
  return typeof t === 'string' || isVNodeComponent(t);
}
```

**验证**: type test 加 case（`null`, `undefined`, primitive, plain object, malformed VNode）

### 1.16 `LessMiddleware = (c: any, next)` 改具体类型

**文件**: `packages/hono-adapter` 或 `packages/server/src/...`（grep "LessMiddleware"）

**变更**:

```ts
// 之前
export type LessMiddleware = (c: any, next: Next) => Promise<void> | void;

// 之后
import type { Context, Next } from 'hono';
export type LessMiddleware = (c: Context, next: Next) => Promise<void> | void;
```

**验证**: hono-adapter 类型测试

### 1.17 dsd-element try/catch 收尾验证

（v0.28.0 c9af56c8 已加，验证完整性）

### 1.18 registerAdapter singleton 工厂化收尾

（v0.28.0 c9af56c8 已做，验证旧 compat exports 1.1 删除彻底）

---

## 阶段 2: 安全硬化（5 项 P1 security）

### 2.1 `hub:scan` 最小权限

**文件**: `deno.json:110`, `packages/hub/scan.ts`

**变更**:

```json
// 之前
"hub:scan": "deno run -A packages/hub/scan.ts",

// 之后（精确权限）
"hub:scan": "deno run --allow-read --allow-write=. --allow-net=esm.sh,registry.npmjs.org --allow-env=DENO_DIR packages/hub/scan.ts"
```

**验证**: `deno task hub:scan` 跑通；权限审计不再出现 `-A`

### 2.2 esm.sh CDN 替换为 jsdelivr

**文件**: `packages/hub/src/snapshot-playwright.ts:60-86`

**变更**:

- 加 env var `LESS_CDN_BASE` 控制（`unpkg` | `jsdelivr` | `esm.sh` | `self-hosted`）
- 默认 `jsdelivr`
- 加注释说明选 jsdelivr 的原因（隐私 + SLA + 比 esm.sh 少跟踪）

**验证**: snapshot 测试 3 个 CDN 都能跑

### 2.3 headExtras XSS regex 替换

**文件**: `packages/adapter-vite/src/...`（grep headExtras）

**变更**: 用 `sanitize-html` 替代 regex 解析

**验证**: headExtras 单元测试覆盖 `<script>`, `javascript:`, `onerror=`, data: URI 等 XSS vector

### 2.4 less-layout URL scheme 验证

**文件**: `packages/ui/src/less-layout.ts`（grep `href` / `src`）

**变更**: 加 URL scheme allowlist

```ts
const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:', 'sms:']);
function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url, 'https://lessjs.com/');
    return SAFE_SCHEMES.has(u.protocol);
  } catch {
    return false;
  }
}
```

**验证**: layout 单元测试覆盖 `javascript:`, `data:`, `vbscript:`, `file:`, relative path

### 2.5 innerHTML prop 消毒

**文件**: `packages/core/src/vnode.ts` 或 `packages/core/src/render-dsd.ts`（grep innerHTML）

**变更**:

- `innerHTML` prop 默认 escape
- 显式 `rawHtml: true` 才不 escape
- 不 escape 路径用 `sanitize-html` 二次消毒

**验证**: innerHTML 测试覆盖 `<script>`, `<img onerror>`, svg, mathml

---

## 阶段 3: SSR Bundle 性能（1 项 P1 perf）

### 3.1 SSR Bundle 1.53 MB → 条件化 `ssr.noExternal`

**文件**: `packages/adapter-vite/src/cli/build-ssg.ts:404-524`

**变更**:

```ts
// 之前（hardcoded 全部 bundle）
ssr: {
  noExternal: [/^@lessjs\//, /^lit/, /^@lit/, 'alien-signals', 'react', 'react-dom'],
}

// 之后（按 adapter 配置）
const adapter = options.adapter ?? 'vanilla';
const noExternal = ['alien-signals', /^@lessjs\//];
if (adapter === 'lit') noExternal.push(/^lit/, /^@lit/);
if (adapter === 'react') noExternal.push('react', 'react-dom');
ssr: { noExternal }
```

**验证**: `deno task build` SSR bundle size:

- vanilla: < 500 KB
- lit: < 800 KB
- react: < 1.2 MB

---

## 阶段 4: 不在本 SOP 范围（10 项）

| #  | Finding                                               | 留给              | 理由                                                           |
| -- | ----------------------------------------------------- | ----------------- | -------------------------------------------------------------- |
| 1  | router 零测试                                         | v1.0.0-patch.1    | 100+ 单元测试是独立工作                                        |
| 2  | runtime 零测试                                        | v1.0.0-patch.2    | 80+ 单元测试是独立工作                                         |
| 3  | protocols 零测试                                      | v1.0.0-patch.3    | 同上                                                           |
| 4  | deno.lock hono drift                                  | v1.0.0-patch.4    | 需 `deno install --node-modules-dir` 重对，影响全部 subpackage |
| 5  | deno.lock playwright drift                            | v1.0.0-patch.5    | 同上                                                           |
| 6  | `tsconfig.json` 缺注释说明                            | v0.28.3           | 文档类                                                         |
| 7  | `fmt.exclude` vs `lint.exclude` 漂移                  | v0.28.3           | v0.28.1 已修一个，剩 lint 也对齐                               |
| 8  | `tools/check-strategic-docs.ts` publicDocs 列表 stale | ✓ v0.28.1 已修    | —                                                              |
| 9  | `.github/agents/` 3 个 agent 文档用途                 | 不修              | 决定保留或移除                                                 |
| 10 | `_layoutWorkaroundReRender` upstream 状态             | ✓ 本 SOP 1.2 处理 | —                                                              |

---

## 验证清单

- [ ] `deno task fmt` 0 改动
- [ ] `deno task fmt:check` 通过
- [ ] `deno task lint` 0 错误
- [ ] `deno run -A tools/check-strategic-docs.ts` 通过
- [ ] `deno run -A tools/check-current-docs-no-legacy.ts` 通过
- [ ] `deno run -A tools/check-import-map.ts` 通过
- [ ] `deno run -A tools/check-package-graph.ts` 通过
- [ ] `deno run -A tools/check-dist-no-object-object.ts` 通过
- [ ] `deno task test` 全部通过
- [ ] `deno task build` SSR bundle < 1 MB（gzip < 200 KB）
- [ ] `git grep "registerAdapter("` 只剩工厂内部或注释
- [ ] `git grep ": any" -- 'packages/core/src/' 'packages/router/src/' 'packages/runtime/src/'` 显著减少（< 5）
- [ ] `git grep "v0\.27" -- 'packages/' 'www/'` 只剩 import path 字符串和 historical comment
- [ ] `deno task hub:scan` 跑通且无 `-A`
- [ ] 所有 19 个 `deno task -f packages/<name> build` 通过

## 出口标准

- 所有 19 个 `packages/*/deno.json` 只在本清单全绿后才能从 `0.28.0` bump
- 上面验证清单全勾
- 提交到 `codex/v0.28.2-deprecated-purge` 分支（每阶段一个 commit）
- 合并到 `dev`
- 合并到 `main`（ff）
- `origin/dev` 和 `origin/main` 都已推送（HTTP/1.1）
- 发布 v0.28.2 到 JSR（19 个包）
- 写 `docs/changelog/v0.28.2.md` 和 `docs/release/v0.28.2.md`

## 非目标

- 不写新功能
- 不加新 API
- 不补测试覆盖率（router/runtime/protocols 留给 v1.0.0-patch）
- 不动 Hub 协议 / manifest schema
- 不动 `deliverables/` / `docs/conversation/20260601/` 去向

---

## 元信息

- **执行人**: 待指派工程师
- **执行预估**: 3-4 周（阶段 1: 1.5 周, 阶段 2: 1 周, 阶段 3: 0.5 周, 收尾: 1 周）
- **回滚策略**: 阶段间独立 commit，可单独 revert
- **v0.28.0 → v0.28.2 兼容性**:
  - 阶段 1.1 删 compat exports 是技术 breaking change
  - 实际影响: grep 全 workspace 0 处外部依赖使用 `registerAdapter`（v0.28.0 release note 已说明）
  - release note 显式列出删除项
  - CHANGELOG 标 `### Breaking Changes`
- **依赖关系**:
  - 阶段 1 内部无依赖（每项可独立 commit）
  - 阶段 2 依赖阶段 1（同一文件可能改）
  - 阶段 3 独立（只动 `build-ssg.ts`）
