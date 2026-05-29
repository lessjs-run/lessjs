# SOP-001: API 命名统一 — 贴近 Web Platform

> Version: v0.24.4 (aligns to v0.25.0 plan)\
> Priority: P0\
> Status: PLANNED\
> Source: `docs/conversation/20260629/api-naming-convention-web-platform.md`

## Objective

在 **v0.24.3 完成收敛之后**，将公共 API 统一为 Web Platform 风格：`verbNoun`、无品牌前缀、PascalCase acronym，并提供一版兼容期。

## Preconditions (hard stop)

- v0.24.3 SOP exit criteria 全部通过（legacy `html`/`@prop()` 移除、renderer parity、docs truth 收敛、gates 全绿）。
- 目前公共 API surface 已锁定，不再暴露旧模板/装饰器；发布顺序与版本号一致。
- 本 SOP 执行前需记录基线：`git status -sb`、最新 commit，`deno task fmt:check && deno task lint` 通过。

## Naming Rules (authoritative)

| 类别    | 规则            | 示例                             |
| ------- | --------------- | -------------------------------- |
| 函数    | `verb` + `Noun` | `defineIsland`, `renderToString` |
| 布尔    | `is` + `Noun`   | `isVNode`                        |
| 存在    | `has` + `Noun`  | `hasNavigationApi`               |
| 获取    | `get` + `Noun`  | `getSsrProps`                    |
| 事件    | `on` + `Noun`   | `onNavigate`                     |
| acronym | PascalCase      | `Ssr`, `Dsd`, `Dom`              |
| 禁止    | ❌ 品牌前缀     | `bindEvents` 不是 `lessBind`     |

---

## Step 1: Rename island() → defineIsland()

**Files**: `packages/core/src/island.ts`, all island consumers

**Actions**:

1. 修改声明与导出（Windows 提示：用文本编辑器或 `deno run -A tools/rename.ts`，勿用 GNU sed）：
   - `packages/core/src/island.ts` 将 `island` 改名为 `defineIsland`（导出名 + 本地调用）。
   - 更新 re-export：`packages/core/src/index.ts`、`packages/runtime/src/index.ts`。
2. 扫描并替换调用：
   - `rg "\bisland\(" www/app/islands packages/ui www/app/routes --glob "*.ts" --glob "*.tsx"`
   - 人工或脚本将 `export default island(` / `island(` 改为 `defineIsland(`。
3. 保留兼容导出一版：`export { defineIsland as island } /* @deprecated v0.24.4 */`，用于平滑过渡。

**Acceptance**:

- [ ] 新名 `defineIsland` 为默认导出；旧名仅作为临时别名（有 @deprecated 注释）。
- [ ] 调用侧无裸 `island(`（除别名 re-export）。
- [ ] `deno task typecheck` 通过。

---

## Step 2: Rename lessBind() → bindEvents()

**Files**: `packages/core/src/island.ts`, callers

**Actions**:

建议：用编辑器或脚本，避免破坏大小写：

1. `packages/core/src/island.ts` 将实现与导出改名为 `bindEvents`。
2. `packages/core/src/index.ts`、`packages/runtime/src/index.ts` 更新 re-export。
3. 扫描调用并替换：`rg "lessBind" packages www/app --glob "*.ts" --glob "*.tsx"`。
4. 兼容期：导出 `lessBind` 别名一版并标记 @deprecated，计划下一小版本移除。

**Acceptance**:

- [ ] 默认导出为 `bindEvents`；`lessBind` 仅作为兼容别名（含 @deprecated）。
- [ ] 调用侧无新的 `lessBind` 引用。

---

## Step 3: Fix acronym casing

### 3a: getSSRProps → getSsrProps

替换时注意大小写，建议脚本逐个 token 处理：

- `rg "getSSRProps" packages www/app --glob "*.ts" --glob "*.tsx"` → 手动/脚本改为 `getSsrProps`。

### 3b: renderDSD → renderDsd

同理处理 `renderDSD` → `renderDsd`，覆盖 `renderDSDStream` → `renderDsdStream`。

**Careful**: check `renderDSDStream`, `renderDSDByName` are also covered.

### 3c: renderToDOM → renderToDom

`renderToDOM` → `renderToDom`（确保 JSX renderer、tests、docs 一致）。

### 3d: UnwrapSignalLike → unwrapSignalLike (verify already correct)

Check `unwrapSignalLike` 维持 camelCase（通常已正确）。

Should already be `unwrapSignalLike` ✅

**Acceptance**:

- [ ] 代码、测试、docs 统一使用新 casing。
- [ ] 旧名若保留别名需有 @deprecated 注记，并在下一版本移除计划中列出。

---

## Step 4: Type-level renames

The acronym change affects type names exported from core:

| Old                                    | New                                                               |
| -------------------------------------- | ----------------------------------------------------------------- |
| `SSR_RENDER_ERROR` (error code string) | `SSR_RENDER_ERROR` — keep, it's a string constant not a type name |
| Type-level references in DSD types     | Verify `DsdBuildReport`, `SsrRenderError` already PascalCased ✅  |

检查 `types.ts`、`render-dsd.ts` 等，确认类型名使用 PascalCase acronym（字符串常量可保留全大写）。

**Acceptance**:

- [ ] 类型名无全大写 acronym，保持 PascalCase。

---

## Step 5: Update docs and migration guide

**Files**:

- `docs/reference/core-api-surface.md` — 新名
- `docs/arch/current-architecture.md` — 例子改新名
- `www/app/routes/` — 指南示例改新名
- `www/app/islands/` — 全部 island 文件
- `packages/ui/` — 全 10 个 UI 组件
- `CHANGELOG.md`、`docs/release/0.24.3.md`/`0.24.4.md` — 说明命名调整与兼容期

**Acceptance**:

- [ ] 公共 docs/README/指南一致使用新名；迁移指南可提及旧名已弃用。
- [ ] 发布说明明确兼容期和移除时点。

---

## Step 6: Full regression

```bash
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
deno task docs:check-current
```

**Exit Criteria**:

- [ ] 所有 gate 通过。
- [ ] `rg "\bisland\(" --glob "*.ts" --glob "*.tsx"` 仅出现在 `defineIsland` 定义别名处。
- [ ] `rg "lessBind"` 仅在兼容导出处。
- [ ] `rg "renderDSD\b"` 为空；`renderToDOM` 为空；`getSSRProps` 为空。

## Quality Gates

| Gate | Criteria                                                          |
| ---- | ----------------------------------------------------------------- |
| G0   | v0.24.3 全部 exit criteria 已通过（否则暂停本 SOP）               |
| G1   | `defineIsland()` replaces `island()`（旧名仅兼容别名且标记弃用）  |
| G2   | `bindEvents()` replaces `lessBind()`（旧名仅兼容别名且标记弃用）  |
| G3   | `getSsrProps()`, `renderDsd()`, `renderToDom()` replace old names |
| G4   | Guide/docs/arch/release 统一新命名，说明兼容期与移除时点          |
| G5   | All gates pass                                                    |
