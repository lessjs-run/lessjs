# SOP-002: 跨包共享类型去重与内部冗余清理

> Version: v0.24.3\
> Priority: P1\
> Status: **COMPLETED** (2026-05-29)\
> Depends on: SOP-001 (Gate Recovery — build/typecheck gates must pass first)\
> Source: `docs/conversation/20260529/lessjs-v0.24.3-duplicate-code-audit.md`

## Objective

消除 `@lessjs/core` / `@lessjs/cem` / `@lessjs/compat-check` / `@lessjs/adapter-vite` 之间的跨包类型重复定义，以及 `template.ts` 内部因 v0.24.3 提取导致的同文件重复。

## Background

全仓库扫描（2026-05-29）发现了 8 个类型/函数在 2-3 个包中重复定义。根因是 **SOP-007 (v0.21.0) 从 core 提取 compat-check 时未清理 core 中的原版**，以及 **v0.24.3 从 template.ts 提取 signal-like.ts 时留下原版**。

这些重复导致：

- 修改 domain type 时需同步 N 处，否则产生行为不一致
- 新人阅读代码时困惑（"这是同一个类型吗？"）
- 类型检查时可能出现微妙的 `same-name-different-source` 类型不兼容

## Strategic Boundary

| Included                                       | Excluded                                          |
| ---------------------------------------------- | ------------------------------------------------- |
| core ↔ compat-check 重复 validation/types 去重 | 3 个 adapter 的 DSD hydration 实现合并            |
| template.ts 内部重复清理                       | template.ts 废弃函数完整删除（那是 TG-02 的工作） |
| cem/types.ts 共享类型去重                      | cem 与 compat-check 的功能合并                    |
| adapter-vite 重复类型移除                      | adapter-vite 架构级重构                           |
| nav-filter deprecated alias 重命名             | -                                                 |

## Step-by-Step Procedure

---

### Step 1: 确认 Gate Baseline

**Purpose**: 确保在修改类型定义前，所有 gate 已知状态。类型改动会影响跨包导入，需要 gate 来检测 breakage。

**Actions**:

1. 记录当前 commit。
2. 运行 baseline gate：

```bash
deno task typecheck
deno task test
deno task build
```

3. 记录结果。如果 `typecheck` 或 `test` 不通过，先修复再继续。`build` 中的 known DSD errors 是预期 baseline。

**Exit Criteria**:

- [ ] `typecheck` pass
- [ ] `test` pass (允许沙箱环境限制的 5 个 localStorage 失败)
- [ ] 已知当前 gate 状态已记录

---

### Step 2: 从 `template.ts` 删除重复的 `SignalLike` + `isSignalLike`

**Purpose**: 清理 v0.24.3 提取 signal-like.ts 后留在 template.ts 中的重复定义。

**Files**:

- `packages/core/src/template.ts` — 删除行 21-24 (SignalLike interface) + 383-390 (isSignalLike)
- `packages/core/src/signal-like.ts` — 不需要改（已是 canonical 版本）

**Actions**:

1. 检查 `template.ts` 内部有哪些地方引用了本地的 `SignalLike` 和 `isSignalLike`：

```bash
grep -n "SignalLike\|isSignalLike" packages/core/src/template.ts
```

模板中的 `AttrValue`、`ContentValue` 使用了 `SignalLike`：

```typescript
export type AttrValue = string | number | boolean | null | undefined | SignalLike;
export type ContentValue = string | number | ... | SignalLike | ...;
```

2. 在 `template.ts` 顶部添加：

```typescript
import { isSignalLike, type SignalLike } from './signal-like.js';
```

3. 删除 template.ts 中的本地定义：

```diff
- export interface SignalLike<T = unknown> {
-   readonly value: T;
-   subscribe(fn: (value: T) => void): () => void;
- }
+ // imported from ./signal-like.js

- export function isSignalLike(value: unknown): value is SignalLike {
-   return Boolean(
-     value &&
-       typeof value === 'object' &&
-       'value' in value &&
-       typeof (value as { subscribe?: unknown }).subscribe === 'function',
-   );
- }
+ // imported from ./signal-like.js
```

4. 运行 typecheck 确认无 breakage：

```bash
deno task typecheck
```

**Acceptance**:

- [ ] `template.ts` 不包含本地 `SignalLike` interface 定义
- [ ] `template.ts` 不包含本地 `isSignalLike` 函数定义
- [ ] `template.ts` 从 `./signal-like.js` 导入两者
- [ ] `AttrValue`、`ContentValue` 等类型引用不受影响
- [ ] `deno task typecheck` pass

---

### Step 3: 从 `compat-check/types.ts` 移除已在 core 的定义

**Purpose**: compat-check 的类型文件有 6 个 validation 类型和 2 个 manifest 类型与 core/types.ts 重复。

**Files**:

- `packages/compat-check/src/types.ts`
- `packages/compat-check/src/compatibility.ts` (如果使用了本地 `ManifestDecision`)
- `packages/compat-check/src/validate-manifest.ts`

**Actions**:

**3a. 识别可安全移除的类型**

以下类型与 `packages/core/src/types.ts` 中的定义完全相同，可直接删除，改为从 core 导入：

| 类型名                     | core 行号 | compat-check 行号 | 差异     |
| -------------------------- | --------- | ----------------- | -------- |
| `ManifestDecision`         | 869       | 114               | 完全相同 |
| `SsrAdmissionDecision`     | 891       | 136               | 完全相同 |
| `ValidationResult`         | 205       | 147               | 完全相同 |
| `ValidationError`          | 215       | 157               | 完全相同 |
| `ValidationDiagnostic`     | 1401      | 184               | 完全相同 |
| `ValidatedTag`             | 1420      | 203               | 完全相同 |
| `ManifestValidationReport` | 1444      | 227               | 完全相同 |

**3b. 处理 `ValidationWarning` 差异**

`ValidationWarning` 在两个包中**不完全相同**。先确认差异：

```bash
diff <(grep -A30 "^export interface ValidationWarning" packages/core/src/types.ts) \
     <(grep -A30 "^export interface ValidationWarning" packages/compat-check/src/types.ts)
```

根据差异决定：

- 如果差异是 compat-check 版本有额外字段：保留 compat-check 版本，core 版本做兼容
- 如果差异是 core 版本有额外字段：compat-check 改为 `extends core.ValidationWarning`
- 如果结构相同仅字段名/类型不同：统一到一个权威版本

**3c. 更新 compat-check 的 imports**

在 `compat-check/src/types.ts` 顶部添加：

```typescript
import type {
  ManifestDecision,
  ManifestValidationReport,
  SsrAdmissionDecision,
  ValidatedTag,
  ValidationDiagnostic,
  ValidationError,
  ValidationResult,
  // ValidationWarning — 待确认差异后决定
} from '@lessjs/core';
```

**3d. 删除本地定义并更新内部引用**

删除 `compat-check/src/types.ts` 中的本地定义。

**注意**：`compat-check/src/compatibility.ts` 和 `compat-check/src/validate-manifest.ts` 中可能直接 import 了这些类型，需检查：

```bash
grep -rn "ManifestDecision\|ValidationResult\|etc" packages/compat-check/src/
```

如有本地类型引用，更新为从 shared import 路径。如果它们已从 `./types.ts` 导入且 `./types.ts` 已 re-export from core，则无需额外改动。

**3e. 更新 compat-check 的 public exports**

`compat-check/src/index.ts` 已经 re-export 了这些类型。如果这些类型从 `./types.js` 导入，直接改为从 `@lessjs/core` 导入即可：

```diff
- export { ManifestDecision, SsrAdmissionDecision, ... } from './types.js';
+ export { ManifestDecision, SsrAdmissionDecision, ... } from '@lessjs/core';
```

**3f. 验证**

```bash
deno task typecheck
deno task test
```

**Acceptance**:

- [ ] `compat-check/src/types.ts` 不再定义已存在于 core 的 7+ 个类型
- [ ] compat-check 通过 `@lessjs/core` 获得这些类型
- [ ] `ValidationWarning` 已确认新 canonical 版本并统一
- [ ] `deno task typecheck` pass
- [ ] `deno task test` pass

---

### Step 4: 从 `cem/types.ts` 移除 `ComponentLayer` / `HydrationStrategy`

**Purpose**: cem 的 types.ts 定义了与 core/types.ts 完全相同的 `ComponentLayer` 和 `HydrationStrategy`。

**Files**:

- `packages/cem/src/types.ts`
- `packages/cem/src/cem-parser.ts`

**Actions**:

1. 在 `cem/src/types.ts` 添加：

```typescript
import type { ComponentLayer, HydrationStrategy } from '@lessjs/core';
```

2. 删除本地定义（行位置：`ComponentLayer` 和 `HydrationStrategy` 的 `export type` 行）。

3. 检查 `cem/src/cem-parser.ts` 是否直接使用了这些类型：

```bash
grep -n "ComponentLayer\|HydrationStrategy" packages/cem/src/cem-parser.ts
```

4. 如果 cem-parser 从 `./types.js` 导入，且 types.ts 已改为 re-export from core，则无需额外改动。

5. 验证：

```bash
deno task typecheck
```

**Acceptance**:

- [ ] `cem/src/types.ts` 不再定义 `ComponentLayer` / `HydrationStrategy`
- [ ] cem 通过 `@lessjs/core` 获得这些类型
- [ ] `deno task typecheck` pass

---

### Step 5: 从 `adapter-vite/entry-descriptor.ts` 移除重复的 `SsrAdmissionDecision`

**Purpose**: adapter-vite 的 entry-descriptor.ts 自带了 `SsrAdmissionDecision` 定义（与 core/types.ts 完全相同）。

**Files**:

- `packages/adapter-vite/src/entry-descriptor.ts`

**Actions**:

1. 找到 entry-descriptor.ts 中的 `SsrAdmissionDecision` 定义（约第 150 行）：

```bash
grep -n "SsrAdmissionDecision" packages/adapter-vite/src/entry-descriptor.ts
```

2. 确认 entry-descriptor.ts 是否已从 core 导入了其他类型（第 14 行已有 `HydrationStrategy` 从 core 导入）。

3. 将 `SsrAdmissionDecision` 添加到已有 import：

```diff
- import type { ComponentLayer, FrameworkOptions, HydrationStrategy } from '@lessjs/core';
+ import type { ComponentLayer, FrameworkOptions, HydrationStrategy, SsrAdmissionDecision } from '@lessjs/core';
```

4. 删除本地 `export interface SsrAdmissionDecision { ... }` 定义。

5. 验证：

```bash
deno task typecheck
```

**Acceptance**:

- [ ] `entry-descriptor.ts` 不再本地定义 `SsrAdmissionDecision`
- [ ] import 从 `@lessjs/core` 获取该类型
- [ ] `deno task typecheck` pass

---

### Step 6: 统一 `isValidTagName`

**Purpose**: cem 和 compat-check 各有一个 `isValidTagName` 实现，行为不同。

**Files**:

- `packages/cem/src/cem-parser.ts` (非导出函数)
- `packages/compat-check/src/compatibility.ts` (导出函数)

**差异分析**:

| 方面     | cem-parser.ts                    | compatibility.ts                          |
| -------- | -------------------------------- | ----------------------------------------- |
| 可见性   | `function` (内部)                | `export function`                         |
| 检查内容 | `TAG_NAME_REGEX.test()`          | `TAG_NAME_REGEX.test()` + `includes('-')` |
| 逻辑     | 宽松（允许无连字符的无效 WC 名） | 严格（符合 WC 规范）                      |

**Actions**:

1. 确认 compat-check 的 `isValidTagName` 是否为正确的 WC 规范实现（要求至少一个连字符）。

2. 将 compat-check 版本的逻辑提取到 `@lessjs/core` 或 `@lessjs/cem` 中的一个位置（建议放在 `packages/core/src/` 下作为共享 utility）：

```typescript
// packages/core/src/tag-utils.ts (新建)
const TAG_NAME_REGEX = /^[a-z](?:[a-z0-9._-]*[a-z0-9_-])?$/i;

export function isValidTagName(tagName: string): boolean {
  return TAG_NAME_REGEX.test(tagName) && tagName.includes('-');
}
```

3. cem 和 compat-check 都从 shared 位置导入。

4. 检查 cem-parser.ts 的 `isValidTagName` 用途——如果它是宽松检查（仅用于 early-exit），可保留为 `isValidTagFormat` 并加注释说明宽松意图。

**Acceptance**:

- [ ] 单一权威的 `isValidTagName` 实现
- [ ] 两个包通过 import 共享
- [ ] `deno task typecheck` pass
- [ ] `deno task test` pass

---

### Step 7: 批量重命名 nav-filter deprecated alias

**Purpose**: 将 50+ 处旧 alias 替换为新名字，消除 deprecated 引用。

**Files**:

- `www/app/routes/engine/*.ts` — 16 处 `filterEngineNav` → `filterArchitectureNav`
- `www/app/routes/guide/*.ts` + `www/app/routes/guide/*.tsx` — 35 处 `filterFrameworkNav` → `filterDocsNav`
- `www/app/routes/registry/*.ts` — 5 处 `filterRegistryNav` → `filterHubNav`
- `www/app/routes/zh/guide/*.tsx` — 4 处 `filterFrameworkNav` → `filterDocsNav`

**Actions**:

1. 执行批量替换（纯文本替换，不涉及逻辑变更）：

```bash
# 在 www/app/routes/ 下执行替换
# filterEngineNav → filterArchitectureNav
# filterFrameworkNav → filterDocsNav
# filterRegistryNav → filterHubNav
```

2. 删除 `nav-filter.ts` 中的 deprecated alias 定义（第 54-58 行）。

3. 重新 build 确认 DSD gate 不受影响：

```bash
deno task build
deno task dsd:check-report
```

**Acceptance**:

- [ ] `www/app/routes/` 下不存在 `filterFrameworkNav` / `filterEngineNav` / `filterRegistryNav` 引用
- [ ] `nav-filter.ts` 中不存在 deprecated alias
- [ ] `deno task build` pass
- [ ] `deno task dsd:check-report` PASS

---

### Step 8: 全量回归验证

**Purpose**: 确认所有改动没有破坏任何功能。

**Commands**:

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
deno task graph:check
```

**Exit Criteria**:

- [ ] `typecheck` pass
- [ ] `test` pass (允许 5 个 localStorage 失败)
- [ ] `build` pass
- [ ] `dsd:check-report` PASS (所有错误为已知类型)
- [ ] `graph:check` pass (零循环依赖)
- [ ] `fmt:check` + `lint` pass

---

## Quality Gates Summary

| Gate | Criteria                                                         |
| ---- | ---------------------------------------------------------------- |
| G1   | `template.ts` 无本地 `SignalLike` / `isSignalLike`               |
| G2   | `compat-check/types.ts` 无重复的 validation/manifest types       |
| G3   | `cem/types.ts` 无本地 `ComponentLayer` / `HydrationStrategy`     |
| G4   | `adapter-vite/entry-descriptor.ts` 无本地 `SsrAdmissionDecision` |
| G5   | 单一权威 `isValidTagName` 实现                                   |
| G6   | nav-filter 无 deprecated alias                                   |
| G7   | 全量 gate 通过                                                   |

## Dependencies

```
Step 1 (Gate Baseline)
  └─ Step 2 (template.ts SignalLike/isSignalLike 去重)
       ├─ Step 3 (compat-check types 去重)
       │    └─ Step 5 (adapter-vite SsrAdmissionDecision)
       ├─ Step 4 (cem types 去重)
       ├─ Step 6 (isValidTagName 统一)
       └─ Step 7 (nav-filter 重命名) ← 可并行
            └─ Step 8 (全量回归)
```

Steps 3/4/5/6/7 可以在 Step 2 完成后**并行执行**，然后汇合到 Step 8。

## Risks

| Risk                                             | Mitigation                           |
| ------------------------------------------------ | ------------------------------------ |
| 类型去重可能暴露出之前被重复定义掩盖的类型不兼容 | typecheck + test 兜底                |
| `ValidationWarning` 差异处理不当                 | Step 3b 必须先 diff 再决定方案       |
| `isValidTagName` 语义差异是 intentional          | Step 6 先确认差异是 bug 还是 feature |
| nav-filter 批量替换可能漏掉动态引用              | grep 验证后 `dsd:check-report` 兜底  |
