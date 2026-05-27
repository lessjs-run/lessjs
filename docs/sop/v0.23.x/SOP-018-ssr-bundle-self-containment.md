# SOP-018: SSR Bundle Self-Containment

> Version: v0.23.5
> Priority: P0
> Status: IN PROGRESS
> Depends on: SOP-017 (ADR-0054)
> Blocks: consumer-smoke 通过

## Objective

将 `parse5`、`entities`、`hono`（及它们的全部子路径导出）inline bundle 进
SSR entry，消除 consumer smoke test 中所有因 external import 导致的
`ERR_MODULE_NOT_FOUND`。

## Background

### 问题

v0.23.0 → v0.23.4 中 consumer smoke test 连续 5 轮失败。根本矛盾：
SSR 构建阶段 externalize 的外部包在 `buildSSG()` 的 `import(entry.js)` 时
consumer 的 deno.json import map 中不存在 → Deno 无法解析。

### 方案 (ADR-0055)

不再 externalize `parse5`、`entities`、`hono`。让 Rolldown 把它们 bundle
进 SSR entry，使 bundle 完全自包含。

## Procedure

### Step 1: 修改 SSR build 配置

**目标**：把 `ssrExternalDefaults` 中的包加入 `noExternal`，移除 `external`
列表。

**涉及文件**：

- `packages/adapter-vite/src/cli/build-ssg.ts`

**执行动作**：

1. 将 `ssrExternalDefaults` 改为 `ssrBundleInline` patterns：

```ts
const ssrBundleInline = [/^parse5/, /^entities/, /^hono/];
```

2. 合并到 `noExternal`：

```ts
const allNoExternal = [...defaultNoExternal, ...ssrBundleInline, ...userNoExternal];
```

3. 移除 `ssr: { ..., external: manifest.specifiers }` 中的 `external` 字段。

**通过标准**：

- [ ] SSR build 成功，无 `external` 配置
- [ ] 无 external import 残余在 entry.js 顶层

### Step 2: Consumer 模板清理

**目标**：移除为 workaround 添加的 external 映射。

**涉及文件**：

- `packages/create/cli.ts`
- `packages/create/__tests__/cli.test.ts`

**执行动作**：

1. 从模板 `deno.json` imports 中移除 `alien-signals` 和 `hono`
2. 恢复为 v0.23.0 的原始 5 个 imports 结构
3. 更新测试预期

**通过标准**：

- [ ] 模板 imports 不含 `alien-signals`、`hono`
- [ ] `cli.test.ts` 预期 count = 5

### Step 3: 版本 bump + 文档

**涉及文件**：

- 全部 17 个 `packages/*/deno.json` — bump 到 0.23.5
- `docs/adr/ADR-0055-ssr-bundle-self-containment.md`
- `docs/sop/v0.23.x/SOP-018-ssr-bundle-self-containment.md`
- `docs/release/0.23.5.md`
- `docs/adr/README.md` 索引更新

## Verification

### 本地测试

```sh
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build  # www 构建验证
```

### CI 验证

Push → CI: Lint & Format ✅ → SOP Gate ✅ → Publish to JSR → consumer-smoke ✅

### Smoke test 检查点

- [ ] SSR bundle 构建成功
- [ ] SSR bundle `entry.js` 顶层无 `import 'parse5'` / `import 'entities'` 等外部裸 import
- [ ] `buildSSG()` 的 `import(entry.js)` 无 `ERR_MODULE_NOT_FOUND`
- [ ] SSG 页面生成成功
- [ ] `dist/index.html` 存在
