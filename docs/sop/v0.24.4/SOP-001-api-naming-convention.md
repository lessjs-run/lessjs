# SOP-001: API 命名统一 — 贴近 Web Platform

> Version: v0.25.0 (原 v0.24.4)\
> Priority: P0\
> Status: PLANNED\
> Source: `docs/conversation/20260629/api-naming-convention-web-platform.md`

## Objective

将所有公共 API 统一为 Web Platform 风格：`verbNoun`、无品牌前缀、PascalCase acronym。

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

1. Rename function:

```bash
sed -i 's/export function island(/export function defineIsland(/' packages/core/src/island.ts
```

2. Update re-exports in `packages/core/src/index.ts` and `packages/runtime/src/index.ts`

3. Update all island files (15 files):

```bash
grep -rln "island(" www/app/islands/ packages/ui/ --include="*.ts" --include="*.tsx" | xargs sed -i 's/export default island(/export default defineIsland(/'
```

4. Update `island()` callers in route files that use it inline.

**Acceptance**:

- [ ] No `island(` function call remains in source
- [ ] All island files use `defineIsland()`
- [ ] typecheck pass

---

## Step 2: Rename lessBind() → bindEvents()

**Files**: `packages/core/src/island.ts`, callers

**Actions**:

```bash
sed -i 's/export function lessBind/export function bindEvents/' packages/core/src/island.ts
sed -i 's/lessBind/bindEvents/g' packages/core/src/index.ts packages/runtime/src/index.ts
grep -rln "lessBind" www/app/ packages/ --include="*.ts" --include="*.tsx" | xargs sed -i 's/lessBind/bindEvents/g'
```

**Acceptance**:

- [ ] No `lessBind` reference remains

---

## Step 3: Fix acronym casing

### 3a: getSSRProps → getSsrProps

```bash
grep -rln "getSSRProps" packages/ www/app/ --include="*.ts" --include="*.tsx" | xargs sed -i 's/getSSRProps/getSsrProps/g'
```

### 3b: renderDSD → renderDsd

```bash
grep -rln "renderDSD" packages/ www/app/ --include="*.ts" --include="*.tsx" | xargs sed -i 's/renderDSD/renderDsd/g'
```

**Careful**: check `renderDSDStream`, `renderDSDByName` are also covered.

### 3c: renderToDOM → renderToDom

```bash
grep -rln "renderToDOM" packages/ www/app/ --include="*.ts" --include="*.tsx" | xargs sed -i 's/renderToDOM/renderToDom/g'
```

### 3d: UnwrapSignalLike → unwrapSignalLike (verify already correct)

```bash
grep -rn "UnwrapSignal\|unwrapSignalLike" packages/core/src/ | head -3
```

Should already be `unwrapSignalLike` ✅

**Acceptance**:

- [ ] `getSsrProps` not `getSSRProps`
- [ ] `renderDsd` not `renderDSD`
- [ ] `renderToDom` not `renderToDOM`

---

## Step 4: Type-level renames

The acronym change affects type names exported from core:

| Old                                    | New                                                               |
| -------------------------------------- | ----------------------------------------------------------------- |
| `SSR_RENDER_ERROR` (error code string) | `SSR_RENDER_ERROR` — keep, it's a string constant not a type name |
| Type-level references in DSD types     | Verify `DsdBuildReport`, `SsrRenderError` already PascalCased ✅  |

Check types.ts, render-dsd.ts for any remaining all-caps acronyms in type names.

**Acceptance**:

- [ ] All type names use PascalCase acronyms

---

## Step 5: Update docs and migration guide

**Files**:

- `docs/reference/core-api-surface.md` — update to new names
- `docs/arch/current-architecture.md` — update examples
- `www/app/routes/` — update any guide pages referencing old API names
- `www/app/islands/` — all island files
- `packages/ui/` — all 10 UI components

**Acceptance**:

- [ ] All public docs reflect new naming
- [ ] Guide pages show new API names

---

## Step 6: Full regression

```bash
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
deno task docs:check-current
```

**Exit Criteria**:

- [ ] All gates pass
- [ ] `grep -rn "island(" --include="*.ts" --include="*.tsx"` returns only `defineIsland(`
- [ ] `grep -rn "lessBind"` returns empty
- [ ] `grep -rn "renderDSD\b"` returns empty (use `\b` to not match `renderDsd`)
- [ ] `grep -rn "getSSRProps"` returns empty
- [ ] `grep -rn "renderToDOM"` returns empty

## Quality Gates

| Gate | Criteria                                                          |
| ---- | ----------------------------------------------------------------- |
| G1   | `defineIsland()` replaces `island()`                              |
| G2   | `bindEvents()` replaces `lessBind()`                              |
| G3   | `getSsrProps()`, `renderDsd()`, `renderToDom()` replace old names |
| G4   | Guide docs + architecture docs updated                            |
| G5   | All gates pass                                                    |
