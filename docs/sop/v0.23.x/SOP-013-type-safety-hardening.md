# SOP-013: 类型安全硬化

> Version: v0.23.x
> Priority: P1
> Status: PLANNED
> Depends on: SOP-009, SOP-010（新增代码需先定型再消除 any）
> Blocks: SOP-015（typecheck 门禁）

## Objective

消除代码库中 50+ 处 `any` 类型，拆分 `types.ts`（1462 行），将 TypeScript 类型安全从 7/10 提升到 9/10。

## Current Problem

评估报告指出两个类型安全问题：

1. **50+ 处 `any` 类型**：包括 `globalThis as any`、`Record<string, any>`、函数参数 `any` 等
2. **`types.ts` 1462 行**：渲染/CEM/配置/构建报告/验证诊断所有类型堆在一个文件

## Target Files

| File                         | Action | 说明                  |
| ---------------------------- | ------ | --------------------- |
| `packages/core/src/types.ts` | SPLIT  | 拆分为 5+ 个类型模块  |
| 全局                         | SEARCH | 找到所有 `any` 使用处 |
| 多个文件                     | MODIFY | 消除 `any` 类型       |

## Procedure

### Step 1: 清点 any 类型

**目标**：建立完整的 `any` 类型清单，分类处理。

**涉及文件**：全局搜索

**执行动作**：

- [ ] 运行搜索建立基线：

```sh
rg '\bany\b' packages/ --type ts -c | sort -t: -k2 -nr | head -20
```

- [ ] 分类：
  - **A 类**：`globalThis as any`（跨运行时兼容）→ 用类型守卫替代
  - **B 类**：`Record<string, any>` → 用 `Record<string, unknown>` 替代
  - **C 类**：函数参数 `any` → 用具体类型替代
  - **D 类**：`as any` 类型断言 → 用类型守卫或泛型替代
  - **E 类**：deno-lint 忽略的 `any` → 评估是否可消除

- [ ] 目标：从 50+ 处减少到 < 10 处（仅保留确实无法替代的 A 类）

**验收命令**：

```sh
rg '\bany\b' packages/ --type ts -c | awk -F: '{sum+=$2} END {print sum}'
# 预期 < 10
```

**通过标准**：

- [ ] `any` 使用处 < 10
- [ ] 每个 `any` 有 `// deno-lint-ignore no-explicit-any` 注释说明原因

**是否污染工作区**：是（修改多个文件）

---

### Step 2: 拆分 types.ts

**目标**：将 1462 行的 `types.ts` 拆分为 5+ 个模块。

**涉及文件**：`packages/core/src/types.ts`

**执行动作**：

- [ ] 拆分方案：

| 新文件                | 内容                                                    | 预估行数 |
| --------------------- | ------------------------------------------------------- | -------- |
| `types/render.ts`     | RenderOutput, RenderMetrics, RenderError, HydrationHint | ~300     |
| `types/cem.ts`        | CEM 包元数据类型                                        | ~200     |
| `types/config.ts`     | FrameworkOptions, SsgConfig, AdapterConfig              | ~200     |
| `types/build.ts`      | BuildReport, BuildPhase types                           | ~300     |
| `types/diagnostic.ts` | ValidationDiagnostic, DiagnosticSeverity                | ~150     |
| `types/shared.ts`     | 共享基础类型                                            | ~100     |
| `types.ts`            | 重新导出（向后兼容）                                    | ~50      |

- [ ] `types.ts` 变为 barrel file：

```ts
// types.ts — barrel re-export (backward compatible)
export type { RenderMetrics, RenderOutput } from './types/render.ts';
export type { CemModule, CemPackage } from './types/cem.ts';
// ... etc
```

- [ ] 更新所有 `import` 路径（保持从 `types.ts` 导入的向后兼容）

**验收命令**：

```sh
deno task typecheck
deno task test
wc -l packages/core/src/types.ts
# 预期 < 100 行（仅重新导出）
```

**通过标准**：

- [ ] `types.ts` < 100 行
- [ ] 所有类型从子模块导入正常
- [ ] 现有 `import { ... } from './types.ts'` 不受影响
- [ ] typecheck 全通过

**失败处理**：如果循环依赖导致拆分困难，先拆分无依赖的模块（diagnostic/cem）。

**是否污染工作区**：是（大规模文件重构）

---

### Step 3: A 类 any 消除 — globalThis as any

**目标**：用类型守卫替代 `globalThis as any` 的跨运行时访问。

**执行动作**：

- [ ] 模式转换：

```ts
// BEFORE
const _nodeProcess = (globalThis as any).process;

// AFTER
const _nodeProcess = typeof globalThis.process !== 'undefined'
  ? globalThis.process as { env?: Record<string, string | undefined> }
  : undefined;
```

- [ ] 或使用类型声明文件：

```ts
// global.d.ts
declare var process: { env?: Record<string, string | undefined> } | undefined;
```

**验收命令**：

```sh
rg 'globalThis\s+as\s+any' packages/ --type ts -c
# 预期：0
```

**是否污染工作区**：是

---

### Step 4: B/C/D 类 any 消除

**目标**：消除 `Record<string, any>`、函数参数 `any`、`as any` 断言。

**执行动作**：

- [ ] B 类：`Record<string, any>` → `Record<string, unknown>`
- [ ] C 类：函数参数 `any` → 具体类型或泛型
- [ ] D 类：`as any` → 类型守卫或 `as unknown as TargetType`

**验收命令**：

```sh
rg '\bany\b' packages/ --type ts -c | awk -F: '{sum+=$2} END {print sum}'
# 预期 < 10
```

**是否污染工作区**：是

## Quality Gates

| Gate | Criteria                                       |
| ---- | ---------------------------------------------- |
| G1   | `any` 使用处 < 10                              |
| G2   | `types.ts` < 100 行                            |
| G3   | 所有现有 import 路径向后兼容                   |
| G4   | `deno task typecheck && deno task test` 全通过 |

## Risk Assessment

| Risk                            | Likelihood | Impact | Mitigation                 |
| ------------------------------- | ---------- | ------ | -------------------------- |
| types.ts 拆分导致循环依赖       | 中         | 中     | 先拆无依赖模块             |
| any 消除引入类型错误            | 中         | 低     | 逐步替换，每步跑 typecheck |
| globalThis 类型声明与其他包冲突 | 低         | 低     | 使用局部声明               |
