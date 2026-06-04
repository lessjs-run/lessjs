# SOP-014: Package README 更新

> Version: v0.23.x
> Priority: P1
> Status: PLANNED
> Depends on: SOP-009, SOP-010（新增 API 需先完成）
> Blocks: 发布

## Objective

更新所有 Package README 使其与当前 API 一致，消除过时引用，补充 v0.21+ 新增 API 文档。

## Current Problem

评估报告指出 Package README 严重过时（评分 5/10）：

1. **`@openelement/signals`**：仍声称 "TC39 polyfill" 和 "islandEffect"（v0.22 已删除）
2. **`@openelement/core`**：示例使用 `hydrateEvents`（v0.21 已移除），缺少 `html`/`unsafeHTML`/`isTemplateResult` 文档
3. **`@openelement/core`**：缺少 `classMap`/`when`/`choose`/`repeat`/`ref` 文档（SOP-009 新增）
4. **`@openelement/core`**：缺少 `@prop()`/`Ref` 文档（SOP-010 新增）

## Target Files

| File                             | Action  | 说明                     |
| -------------------------------- | ------- | ------------------------ |
| `packages/core/README.md`        | REWRITE | 更新 API 文档            |
| `packages/signals/README.md`     | REWRITE | 更新为 alien-signals API |
| `packages/style-sheet/README.md` | REVIEW  | 检查是否过时             |
| `packages/ui/README.md`          | REVIEW  | 检查是否过时             |
| `packages/app/README.md`         | REVIEW  | 检查是否过时             |
| `packages/runtime/README.md`     | REVIEW  | 检查是否过时             |

## Procedure

### Step 1: @openelement/signals README

**目标**：删除 TC39 polyfill 和 islandEffect 引用，更新为 alien-signals API。

**涉及文件**：`packages/signals/README.md`

**执行动作**：

- [ ] 删除过时内容：
  - TC39 Signal polyfill 说明
  - `islandEffect` API（v0.22 已移除）
  - Signal.subtle API（如果已不可用）

- [ ] 添加当前 API 文档：
  - `createSignal(initialValue)` → `Signal<T>`
  - `Signal.value` 读写
  - `Signal.subscribe(callback)` → 取消订阅函数
  - `computed(fn)` → `ReadonlySignal<T>`
  - `effect(fn)` → 副作用
  - `batch(fn)` → 批处理
  - 类型：`Signal<T>`, `ReadonlySignal<T>`, `SignalLike`

- [ ] 添加使用示例

**验收命令**：

```sh
# 检查 README 中不再包含过时关键词
rg 'TC39|islandEffect|Signal\.subtle' packages/signals/README.md
# 预期：0 结果
```

**通过标准**：

- [ ] 无 TC39/islandEffect/Signal.subtle 引用
- [ ] 所有当前 API 有文档
- [ ] 使用示例可运行

**是否污染工作区**：是（重写 README）

---

### Step 2: @openelement/core README

**目标**：更新为 v0.23.x API，包含新增模板原语和 @prop()。

**涉及文件**：`packages/core/README.md`

**执行动作**：

- [ ] 删除过时内容：
  - `hydrateEvents` 示例
  - 旧的 `render(): string` 仅示例

- [ ] 更新核心 API 文档：
  - `html` tagged template（更新示例用 `@click` 替代 `hydrateEvents`）
  - `unsafeHTML(value)` 安全说明
  - `isTemplateResult(value)` 类型守卫
  - `renderTemplateToString(result)` SSR 路径
  - `applyRuntimeTemplateBindings(root, result, host)` 客户端路径

- [ ] 添加 SOP-009 新增 API：
  - `classMap(classes)` 助手
  - `when(condition, truthy, falsy?)` 条件渲染
  - `choose(value, cases, fallback?)` 多路分支
  - `repeat(items, keyFn?, templateFn)` 列表渲染
  - `ref()` / `Ref<T>` DOM 引用

- [ ] 添加 SOP-010 新增 API：
  - `@prop()` 装饰器
  - `PropOptions` 接口
  - `ReactiveHost` mixin

- [ ] 添加 SOP-011 新增 API：
  - `LessError` / `RenderError` / `RouteError` / `BuildError`
  - `onError` 生命周期
  - `isErrorBoundary` 静态标志
  - `FrameworkOptions.onError` 遥测 hook

**验收命令**：

```sh
rg 'hydrateEvents' packages/core/README.md
# 预期：0 结果（仅在 "v0.21 已移除" 说明中出现）
```

**通过标准**：

- [ ] 无 `hydrateEvents` 作为推荐用法
- [ ] 所有 v0.23.x 新增 API 有文档
- [ ] 代码示例可运行

**是否污染工作区**：是

---

### Step 3: 其他 Package README 审查

**目标**：审查 style-sheet/ui/app/runtime 的 README，确保无过时内容。

**涉及文件**：各 package 的 README.md

**执行动作**：

- [ ] 逐一读取各 README
- [ ] 检查过时 API 引用
- [ ] 检查安装命令正确性（`deno add @openelement/xxx`）
- [ ] 检查示例代码可运行性
- [ ] 必要时更新

**验收命令**：

```sh
# 检查所有 README 无 hydrateEvents
rg 'hydrateEvents' packages/*/README.md
# 预期：0 或仅 "已移除" 上下文
```

**通过标准**：

- [ ] 所有 README API 引用正确
- [ ] 安装命令可运行
- [ ] 示例代码可运行

**是否污染工作区**：是

## Quality Gates

| Gate | Criteria                                                                   |
| ---- | -------------------------------------------------------------------------- |
| G1   | `@openelement/signals` README 无 TC39/islandEffect 引用                    |
| G2   | `@openelement/core` README 包含 classMap/when/choose/repeat/ref/@prop 文档 |
| G3   | 所有 Package README 无 hydrateEvents 推荐用法                              |
| G4   | 示例代码可运行                                                             |

## Risk Assessment

| Risk                          | Likelihood | Impact | Mitigation                    |
| ----------------------------- | ---------- | ------ | ----------------------------- |
| 新增 API 文档与最终实现不一致 | 中         | 低     | SOP-009~011 完成后再写 README |
