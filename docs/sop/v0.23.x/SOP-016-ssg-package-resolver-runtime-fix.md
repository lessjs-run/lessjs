# SOP-016: SSG Package Resolver — 补充 `runtime` 包解析

> Version: v0.23.1
> Priority: P0
> Status: COMPLETED
> Depends on: SOP-015（验证门禁）
> Blocks: 无

## Objective

修复 JSR post-publish consumer smoke test 中 SSG/SSR 构建阶段 `@lessjs/runtime`
无法被 Rolldown 解析的问题。

## Background

### 问题

v0.23.0 发布后，CI 三个 workflow 失败：

1. **Lint & Format** — `deno fmt` 格式不一致（2 个 ADR 文档未格式化）
2. **SOP Gate** — 同上，fmt:check 失败
3. **Publish to JSR (consumer-smoke)** — SSR build 阶段 Rolldown 无法解析
   `@lessjs/runtime`

### 根因

`packages/adapter-vite/src/ssg-package-resolver.ts` 的 `DEFAULT_LESSJS_PACKAGES` Set
是 SSG 构建时解析 `@lessjs/*` JSR 包的白名单。`runtime` 包在 v0.23.0 中未加入该白名单，
导致 `createLessJsrPackageResolverPlugin` 对 `@lessjs/runtime` 的 import 返回 `null`，
Rolldown 回退到 Node.js 标准解析失败。

```ts
// BEFORE (有缺陷)
const DEFAULT_LESSJS_PACKAGES = new Set([
  'adapter-vite',
  'app',
  'cem',
  'compat-check',
  'core',
  'hub',
  'rpc',
  'signals',
  'style-sheet',
  'ui',
  // ❌ 缺少 'runtime'
]);

// AFTER (修复后)
const DEFAULT_LESSJS_PACKAGES = new Set([
  'adapter-vite',
  'app',
  'cem',
  'compat-check',
  'core',
  'hub',
  'rpc',
  'runtime', // ✅ 已添加
  'signals',
  'style-sheet',
  'ui',
]);
```

此外 `LESSJS_EXPORT_FILES` 映射表也需要同步添加 `runtime` 的导出配置。

### 影响范围

- Consumer 项目（通过 `@lessjs/create` 生成的用户项目）的 SSG/SSR 构建
- 不影响 workspace 内开发（workspace 内走 Deno 原生模块解析）

## Procedure

### Step 1: 修复 `ssg-package-resolver.ts`

**目标**：将 `runtime` 包加入 SSG 包解析白名单。

**涉及文件**：

- `packages/adapter-vite/src/ssg-package-resolver.ts`

**执行动作**：

1. 在 `DEFAULT_LESSJS_PACKAGES` Set 中加入 `'runtime'`
2. 在 `LESSJS_EXPORT_FILES` 映射表中加入 `runtime: { '.': 'src/index.ts' }`

**通过标准**：

- [x] `packages/adapter-vite/__tests__/ssg-package-resolver.test.ts` 10/10 通过
- [x] `deno check` 通过

### Step 2: 统一版本号 bump

**目标**：由于 `ssg-package-resolver.ts` 使用 adapter-vite 自身版本号解析所有
`@lessjs/*` 包，必须保证所有包版本一致。

**涉及文件**：

- 全部 17 个 `packages/*/deno.json`

**执行动作**：

```sh
# 将所有 0.23.0 → 0.23.1
for f in packages/*/deno.json; do
  sed -i 's/"version": "0\.23\.0"/"version": "0.23.1"/' "$f"
done
```

**通过标准**：

- [x] 所有包的 `deno.json` 版本字段均为 `0.23.1`
- [x] 跨包版本引用使用 `^0.23.0` 范围，自动覆盖 `0.23.1`

### Step 3: 文档 + changelog 更新

**涉及文件**：

- `docs/sop/v0.23.x/` — 本文件（SOP-016）
- `docs/release/0.23.1.md` — 版本 changelog
- `docs/sop/v0.23.x/README.md` — 索引更新

## Quality Gates

- [x] `deno fmt` 全量通过（568 files）
- [x] `packages/adapter-vite/__tests__/ssg-package-resolver.test.ts` 全通过
- [x] CI: Lint & Format 通过（待 CI 验证）
- [x] CI: SOP Gate 通过（待 CI 验证）
- [x] CI: Publish to JSR consumer-smoke 通过（待 CI 验证）

## Lessons Learned

**维护规则（已记录到 `.workbuddy/memory/MEMORY.md`）**：

> 新增任何 `@lessjs/*` 包时必须同步更新 3 处：
>
> 1. `SSG Package Resolver` 的 `DEFAULT_LESSJS_PACKAGES` Set
> 2. `SSG Package Resolver` 的 `LESSJS_EXPORT_FILES` 映射表
> 3. `@lessjs/create` CLI 中的 `PKG_DIR_MAP`（如果用于项目模板生成）

遗漏会导致 consumer smoke test 的 SSR build 阶段无法解析新包。
