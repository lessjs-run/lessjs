# LessJS v0.25.0 — Declarative DX + Architecture Debt Consolidation

> Status: PLANNED\
> Target: 声明式构建管线 + 类型安全路由 + 架构债清偿\
> Depends on: v0.24.4 (API naming consolidation)\
> Governing ADR: ADR-0058, ADR-0059, ADR-0060\
> Audit: 2026-05-29 comprehensive architecture debt scan

## Mission

v0.25.0 是一次"深度清洁"版本——消除已知架构债 + 统一 DX，为 v0.26 的功能工作铺路。

```
Before v0.25.0
  configFile:false ×2 — JSX 配置无法透传到内部构建
  less() → build.ts → build-client.ts → build-ssg.ts 三阶段硬编码
  _getRouteParams() → Record<string, string> 零类型安全
  <less-layout head-extras='<title>...</title>'> 字符串拼接
  20 处重复 openPropsTokenSheet import
  13 处 route-scanner 正则脆弱
  21 处 as any 类型 escape
  70 处测试相对路径硬编码
  31 个页面字符串渲染（非 JSX）
  81 处 _renderZh/_renderEn locale dispatch

After v0.25.0
  lessPipeline({ phases, routes, i18n, output }) 单一配置入口 + 配置透传
  RouteParams['/blog/[slug]'] 编译期类型推导
  static head = { title, description } 自动注入
  static client = { strategy: 'visible' } 声明式 island
  createContext() / consumeContext() DOM-tree SignalContext
  CSS tokens 单一注入点（openPropsTokenSheet 收敛）
  route-scanner 正则 → AST（TG-02 顺带）
  as any 类型安全硬化（core/src 清零）
  测试路径统一（monorepo test utils）
```

## Task Groups

### Feature Tasks

| Group | Task                        | Priority | Nature     | Time |
| ----- | --------------------------- | -------- | ---------- | ---- |
| TG-01 | BuildPipeline 声明式 API    | P0       | 纯重构     | 2d   |
| TG-02 | 路由类型代码生成            | P0       | 纯生成     | 1d   |
| TG-03 | `static head` 元数据        | P1       | 小 feature | 1d   |
| TG-04 | `static client` Island 声明 | P1       | 语法糖     | 0.5d |
| TG-05 | SignalContext (DOM-tree)    | P2*      | ~20 lines  | 0.5d |

> *P2 conditional: requires `computed()` to have ≥1 real-world use.

### Architecture Debt Tasks

| Group | Task                      | 债务                                   | Priority | Nature     | Time |
| ----- | ------------------------- | -------------------------------------- | -------- | ---------- | ---- |
| TG-06 | CSS token 注入收敛        | 20 处重复 `openPropsTokenSheet` import | P1       | token 去重 | 1d   |
| TG-07 | route-scanner 正则 → AST  | 13 处 string.match/replace             | P1       | TS AST     | 0.5d |
| TG-08 | `as any` 类型硬化         | 21 处 type escape in core/src          | P1       | 类型安全   | 0.5d |
| TG-09 | 测试路径统一              | 70 处 `../src/` 硬编码                 | P2       | 测试工具   | 0.5d |
| TG-10 | `less()` 标记 @deprecated | 向后兼容层                             | P2       | 文档       | 0.5d |
| TG-11 | island.test.ts 旧名修复   | 测试注释仍引用 `island()`              | P2       | 文档       | 0.1d |
| TG-12 | 全量回归 + docs           | 最终验证                               | P2       | 验证       | 1d   |

## Execution Order

```
Phase 1 (并行)
  TG-01 + TG-02             BuildPipeline + Route Types
  TG-11                      island.test.ts 旧名修复

Phase 2 (依赖 TG-01, 可并行)
  TG-03 + TG-06              static head + CSS token 收敛
  TG-07                      route-scanner AST（TG-02 顺带）

Phase 3 (独立)
  TG-04 + TG-05              static client + SignalContext
  TG-08 + TG-09              类型硬化 + 测试路径

Phase 4
  TG-10                      less() deprecation
  TG-12                      全量回归
```

## Step-by-Step

### Step 1: Baseline

```bash
deno task fmt:check && deno task lint && deno task typecheck && deno task graph:check && deno task test
```

### Step 2: TG-01 BuildPipeline + TG-11 island.test fix

**TG-01**: 创建 `packages/adapter-vite/src/build-pipeline.ts`

- `BuildPipeline` class + `lessPipeline()` 导出
- 透传用户 esbuild 配置到内部 `viteBuild()`，根本上消除 `configFile: false` JSX 问题
- `less()` 保持不变，标记 @deprecated

**TG-11**: `packages/core/__tests__/island.test.ts` 注释/字符串替换 `island()` → `defineIsland()`

**Acceptance**:

- [ ] `lessPipeline()` 替代三阶段硬编码
- [ ] 构建产物 bitwise 一致
- [ ] island.test.ts 零旧名

### Step 3: TG-02 Route Types + TG-07 Scanner AST

**TG-02**: route-scanner 扫描 `[param]` → `.less/routes.d.ts`

**TG-07**: route-scanner 正则升级

- `readBooleanMeta()` 等从 `string.match(/client:/)` → TS AST 静态分析
- `readDirective()` 正则扫描 → AST Node 遍历

**Acceptance**:

- [ ] `.less/routes.d.ts` 生成正确
- [ ] 13 处正则减少到 ≤3 处（仅保留 unavoidable 的错误消息匹配）

### Step 4: TG-03 static head + TG-06 CSS token

**TG-03**: `static head = { title, description }` → SSG 注入 `<head>`

**TG-06**: CSS token 收敛

- 创建 `packages/ui/src/global-tokens.ts` 统一导出 `globalTokenSheet`
- 10 个 UI 组件从 `openPropsTokenSheet` 改为 `globalTokenSheet`
- `less-layout` 作为所有页面 wrapper 自动注入 token，子组件不再单独导入

**Acceptance**:

- [ ] openPropsTokenSheet import 从 20 处降为 ≤2 处
- [ ] 构建后 CSS bundle 减小 ≥30%
- [ ] 视觉一致性不变

### Step 5: TG-04 static client + TG-05 SignalContext (可并行)

**TG-04**: `static client = { strategy: 'visible' }` island 声明

**TG-05**: `packages/core/src/signal-context.ts` — ~20 lines

- `createContext(key, defaultValue)`
- `provideContext(host, ctx, value)`
- `consumeContext(host, ctx)` — 沿 DOM 树向上遍历，返回 signal

### Step 6: TG-08 类型硬化 + TG-09 测试路径

**TG-08**: core/src 类型硬化

- 21 处 `as any` → 替换为精确类型或 Record<string, unknown>
- 每处添加注释说明为什么需要 type escape

**TG-09**: 测试路径统一

- 创建 `packages/core/__tests__/test-utils.ts` 统一 re-export
- 各测试文件从 `import { xxx } from '../src/xxx.ts'` 改为 `import { xxx } from './test-utils.ts'`

### Step 7: TG-10 less() deprecation

`less()` 函数加 @deprecated JSDoc，指向 `lessPipeline()`

### Step 8: TG-12 Full Regression

```bash
deno task fmt:check && deno task lint && deno task typecheck
deno task graph:check && deno task test && deno task build
```

## Quality Gates

| Gate | Criteria                                                        |
| ---- | --------------------------------------------------------------- |
| G1   | `lessPipeline()` 替代三阶段硬编码；`configFile: false` 根本解决 |
| G2   | 现有 `less()` 调用仍可工作                                      |
| G3   | `[param]` 路由在 RouteParams 中有对应类型                       |
| G4   | `static head` 声明的页面 title/meta 正确注入 dist HTML          |
| G5   | `static client` 声明的 island 正确生成 client chunk             |
| G6   | `consumeContext()` 跨 shadow DOM 边界获取 provider signal       |
| G7   | CSS token 注入从 20 处降为 ≤2 处；bundle 减小 ≥30%              |
| G8   | route-scanner 正则从 13 处降为 ≤3 处                            |
| G9   | core/src 中 `as any` 清零或全部有注释说明                       |
| G10  | 测试文件 0 处 `../src/` 直接 import                             |
| G11  | island.test.ts 0 处旧名 `island()` 引用                         |
| G12  | 全量 gate 通过                                                  |

## Deferred to v0.26.0

| 债务                      | 原因                                  |
| ------------------------- | ------------------------------------- |
| `_dsdHydrated` 双路径合并 | 核心 runtime 改动，需要更长的验证周期 |
| 31 个页面字符串 → JSX     | 内容渲染层重构，非阻塞                |

## Additional Audit Findings (Second Pass)

| #  | 发现                                           | 数据                    | 影响                 | 处理                                     |
| -- | ---------------------------------------------- | ----------------------- | -------------------- | ---------------------------------------- |
| A1 | `adapter-react` + `adapter-vanilla` 可能为死包 | 0 external consumers    | 434+363 lines unused | v0.25 TG-12 审计后保留或标记 @deprecated |
| A2 | UI 组件测试覆盖极低                            | 2 tests / 10 components | 核心组件无回归保护   | v0.26 专项                               |
| A3 | i18n 测试仅 1 个                               | 核心路由逻辑无覆盖      | locale 行为无验证    | v0.26 专项                               |
