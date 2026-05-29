# SOP-004: 移除 TemplateResult 渲染路径，DsdElement 仅保留 VNode + string

> Version: v0.24.3\
> Priority: P0\
> Status: PLANNED\
> Depends on: SOP-002 (type dedup), SOP-003 (cleanup)\
> Source: ADR-0058

## Objective

从 `DsdElement.render()` 中移除 `TemplateResult` 返回类型，将三态渲染（VNode | TemplateResult | string）缩减为两态（VNode | string）。同时删除 `template.ts` 中的全部 TemplateResult DSL 实现代码。

## Background

v0.24.1 迁移到 JSX 后，没有 Production 组件再返回 TemplateResult。当前保留 TemplateResult 路径的唯一效果是维持一套 0 使用者的后向兼容代码。

详见 ADR-0058。

## Step-by-Step Procedure

---

### Step 1: 删除 `template.ts` 中的废弃 DSL 函数及类型

**Purpose**: 移除 7 个 @deprecated 函数和它们独有的类型。

**Files**: `packages/core/src/template.ts`

**Actions**:

1. 从 template.ts 顶部删除以下类型定义和函数（定位约 15-200 行 + 187-371 行）：

删除清单：

```
- CLASS_MAP / UNSAFE_HTML symbol 常量
- SignalLike interface（已从 signal-like.js 导入，不受影响）
- AttrValue / ContentValue / EventValue / TemplateValue 类型
- TemplateResult / UnsafeHtmlValue / ClassMapValue / RefDirective 接口
- RuntimeEventBinding / RuntimePropertyBinding / RuntimeTemplateBindings 接口
- ClassMapInput 接口
- classMap() / isClassMapValue()
- when() / ChooseCase / choose()
- repeat()
- ref()
- html()
- unsafeHTML() / isUnsafeHTML()
```

2. 保留可用的 import 行（SignalLike, isSignalLike, escapeAttr, escapeHtml）

3. 验证：确认剩余 import 仍然可解析

**Acceptance**:

- [ ] template.ts 中不存在 classMap / when / choose / repeat / ref / html / unsafeHTML 定义
- [ ] 相关类型（ClassMapInput, ClassMapValue, ChooseCase, RefDirective 等）已删除
- [ ] typecheck pass

---

### Step 2: 删除 TemplateResult SSR/渲染函数

**Purpose**: `renderTemplateToString`、`collectRuntimeTemplateBindings`、`applyRuntimeTemplateBindings`、`collectTemplateSignals` 等只服务于 TemplateResult 的渲染管线函数，在 TemplateResult 被移除后成死代码。

**Files**: `packages/core/src/template.ts`

**Actions**:

1. 删除以下函数：
   - `isTemplateResult()`
   - `renderTemplateToString()`
   - `collectRuntimeTemplateBindings()`
   - `applyRuntimeTemplateBindings()`
   - `collectTemplateSignals()`
   - `resolveSignalValue()`（内部辅助函数）

2. template.ts 到此文件内容应为空或仅剩 import 行

**Acceptance**:

- [ ] template.ts 不存在上述函数
- [ ] typecheck 检测到所有 TemplateResult 引用报错（因为被删除）

---

### Step 3: 删除 template.ts 文件

**Purpose**: template.ts 在 Step 1+2 后为空。整个文件可以移除。

**Files**: `packages/core/src/template.ts`

**Actions**:

1. 删除 `packages/core/src/template.ts`
2. 全局搜索所有 `from './template.js'` 或 `from '../template.js'` 引用并清理

```bash
grep -rn "from.*template" packages/core/src/ --include="*.ts"
```

受影响的文件：

- `packages/core/src/dsd-element.ts` — 移除 TemplateResult 相关 import
- `packages/core/src/render-dsd.ts` — 移除 TemplateResult 相关 import
- `packages/core/src/error-boundary.ts` — 移除 TemplateResult 相关 import
- `packages/core/src/types.ts` — 移除 TemplateResult import

**Acceptance**:

- [ ] `packages/core/src/template.ts` 已删除
- [ ] 所有模块中无 `from '...template.js'` 引用
- [ ] typecheck pass

---

### Step 4: 清理 `dsd-element.ts` 中的 TemplateResult 分支

**Purpose**: 移除 DsdElement 中仅服务于 TemplateResult 的代码路径。

**Files**: `packages/core/src/dsd-element.ts`

**Actions**:

1. 移除 import 行中的 `isTemplateResult`、`renderTemplateToString`、`collectTemplateSignals`、`applyRuntimeTemplateBindings`、`TemplateResult` 类型

2. 删除 `_renderIntoShadowRoot()` 中的 TemplateResult 分支（~line 424）：

```diff
- } else if (isTemplateResult(result)) {
-   this.shadowRoot.innerHTML = renderTemplateToString(result, { runtimeMarkers: true });
-   this._bindTemplateRuntime(result);
-   this._subscribeTemplateSignals(result);
```

3. 删除 `_bindTemplateRuntime()` 方法（~line 508）
4. 删除 `_subscribeTemplateSignals()` 方法（~line 519）
5. 更新 `render()` 返回类型：

```diff
- render(): string | TemplateResult | VNode {
+ render(): string | VNode {
```

6. 更新 `_resolveRenderOutput()` 中的 TemplateResult 分支
7. 更新 `_hydrateOrRender()` 中的 TemplateResult 预处理
8. 删除 `_templateAbortController` 相关代码（仅用于 TemplateResult 事件绑定）
9. 删除 `_templateSignalSubscriptions` 相关代码（仅用于 TemplateResult signal 跟踪）

**Acceptance**:

- [ ] dsd-element.ts 中不存在 `isTemplateResult` 调用
- [ ] dsd-element.ts 中不存在 `_bindTemplateRuntime` / `_subscribeTemplateSignals` 方法
- [ ] `render()` 返回类型为 `string | VNode`
- [ ] typecheck pass

---

### Step 5: 清理 `render-dsd.ts` 中的 TemplateResult 分支

**Purpose**: SSR 渲染管线中的 TemplateResult 路径。

**Files**: `packages/core/src/render-dsd.ts`

**Actions**:

1. 移除 import 中的 `isTemplateResult`、`renderTemplateToString`
2. 删除 `render()` 结果处理中的 `isTemplateResult(result)` 分支（~line 190）
3. 删除 `isLitTemplateResultHeuristic()` 辅助函数（仅用于 TemplateResult 诊断）

**Acceptance**:

- [ ] render-dsd.ts 中不存在 TemplateResult 引用
- [ ] 所有 DSD 渲染分支仅处理 `string | VNode`

---

### Step 6: 清理 `error-boundary.ts`

**Purpose**: ErrorBoundary 的 `onError()` 不再接受 TemplateResult 返回。

**Files**: `packages/core/src/error-boundary.ts`

**Actions**:

1. 移除 `import { type TemplateResult }`
2. 更新 `onError()` 返回类型：

```diff
- abstract onError(error: LessError): TemplateResult;
+ abstract onError(error: LessError): VNode;
```

3. 更新 `render()` 返回类型：

```diff
- override render(): string | TemplateResult | VNode {
+ override render(): string | VNode {
```

**Acceptance**:

- [ ] error-boundary.ts 不引用 TemplateResult
- [ ] typecheck pass

---

### Step 7: 清理 `types.ts` 中的 TemplateResult 引用

**Files**: `packages/core/src/types.ts`

**Actions**:

1. 更新 `ReactiveHost` interface：

```diff
- render(): string | TemplateResult | unknown;
+ render(): string | VNode | unknown;
```

**Acceptance**:

- [ ] types.ts 不引用 TemplateResult

---

### Step 8: 清理测试文件

**Files**:

- `packages/core/__tests__/legacy-template.test.ts`
- `packages/core/__tests__/legacy-template-helpers.test.ts`
- `packages/core/__tests__/legacy-reactive-dsd.test.ts`

**Actions**:

1. 删除 `legacy-template.test.ts`（测试已不存在的 API）
2. 删除 `legacy-template-helpers.test.ts`
3. 评估 `legacy-reactive-dsd.test.ts`：将 TemplateResult 测试用例改为 VNode 版本或删除

**Acceptance**:

- [ ] 测试套件不引用 `html`、`TemplateResult`、`isTemplateResult` 等被删除的 API
- [ ] `deno task test` 结果与 baseline 一致（972/977）

---

### Step 9: 全量回归验证

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

- [ ] 所有 gate 通过
- [ ] DSD report 无新增 UNKNOWN 错误
- [ ] `template.ts` 不存在

---

## Quality Gates

| Gate | Criteria                                           |
| ---- | -------------------------------------------------- |
| G1   | `template.ts` 文件已删除                           |
| G2   | `DsdElement.render()` 返回类型为 `string \| VNode` |
| G3   | 无 `isTemplateResult` 调用存在于生产代码           |
| G4   | 无 `from '...template.js'` 导入                    |
| G5   | 全量 gate 通过                                     |

## Dependencies

```
Step 1 (删除 DSL 函数)
  └─ Step 2 (删除 SSR 函数)
       └─ Step 3 (删除 template.ts)
            ├─ Step 4 (清理 dsd-element.ts)
            ├─ Step 5 (清理 render-dsd.ts)
            ├─ Step 6 (清理 error-boundary.ts)
            ├─ Step 7 (清理 types.ts)
            └─ Step 8 (清理测试)
                 └─ Step 9 (全量回归)
```
