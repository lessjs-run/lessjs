# SOP-017: AST-Based External Specifier Resolution

> Version: v0.23.3
> Priority: P0
> Status: IN PROGRESS
> Depends on: SOP-016
> Blocks: consumer-smoke 通过

## Objective

用 AST 驱动的 `package.json` exports 遍历替换手动的 `FALLBACK_REGEX_MAP`，
自动为 SSR 外部化包生成完整子路径 specifier 列表，从根源消除
"每次新增外部包子路径导入都要手动加 regex" 的维护负担。

## Background

### 问题

v0.23.0 → v0.23.2 的 CI 修复暴露了一个系统性缺陷：

SSR bundle 构建中，外部包（`hono`、`parse5`、`entities`）的子路径导出
没有被正确外部化。原因是 `external: ["hono"]` 在 Rollup/Rolldown 中是
**精确匹配**，不匹配 `hono/secure-headers`、`parse5/lib/escape.js` 等子路径。

现有的 `FALLBACK_REGEX_MAP` 存了 regex 模式，但从未实际传递到 Rolldown
的 external 配置中。

### 方案

ADR-0054 确定用 AST 方案：对每个 `ssrExternalDefaults` 中的包：

1. 解析到其 `node_modules` 中的实际位置
2. 读取 `package.json` 的 `exports` 字段
3. 递归展平所有子路径
4. 全部加入 `manifest.specifiers`

## Procedure

### Step 1: 实现 `walkExports` + `resolvePackageExports`

**目标**：将 `package.json` 的 `exports` 字段展平为裸 specifier 列表。

**涉及文件**：

- `packages/adapter-vite/src/external-resolver.ts`

**执行动作**：

1. 新增 `resolvePackageExports(packageName: string): string[]` 函数：
   - 通过 `import.meta.resolve(packageName)` 找到包根目录
   - 回退：尝试 `node_modules/${packageName}/package.json`
   - 读取 `package.json`，提取 `exports` 字段
   - 调用 `walkExports()` 展平

2. 新增 `walkExports(exports: unknown, prefix: string): string[]` 函数：
   - 递归遍历 `exports` 对象
   - 跳过条件键（`import`、`require`、`default`、`types`、`browser`、`deno` 等）
   - 拼接包名 → 子路径：`hono` + `/secure-headers` → `hono/secure-headers`
   - 处理 `./*` 通配符模式

3. 新增 `completeExternalSpecifiers(externalPackages: string[]): string[]` 函数：
   - 对每个包调用 `resolvePackageExports()`
   - 收集所有生成的 specifier
   - 合并去重

4. 移除 `FALLBACK_REGEX_MAP`

5. 在 `resolveExternalManifest()` 中：
   - 调用 `completeExternalSpecifiers()` 补充子路径到 `manifest.specifiers`
   - 保留 `extractExternalSpecifiers()` 作为 deno info --json 的补充

**通过标准**：

- [ ] 包含 `hono`、`hono/secure-headers`、`hono/cookie`（及所有其他 exports）
- [ ] 包含 `parse5`、`parse5/lib/escape` 等子路径
- [ ] 包含 `entities`、`entities/lib/escape` 等子路径
- [ ] 现有测试继续通过

### Step 2: Consumer 模板补 `hono` 映射（belt-and-suspenders）

**目标**：即使 SSR bundle 里有外部化的 `hono/*` import，Deno 运行时也能解析。

**涉及文件**：

- `packages/create/cli.ts`

**执行动作**：
在模板 `deno.json` 的 `imports` 中新增：

```json
"hono": "npm:hono@^4",
"hono/": "npm:hono@^4/"
```

**通过标准**：

- [ ] 生成的 consumer 项目 `deno.json` 包含 `hono` 映射
- [ ] `cli.test.ts` 的 imports 计数更新为预期值

### Step 3: 统一版本号 + 文档

**涉及文件**：

- 全部 17 个 `packages/*/deno.json` — 版本 bump 0.23.2 → 0.23.3
- `docs/adr/ADR-0054-ast-external-specifier-resolution.md` — 本 ADR
- `docs/sop/v0.23.x/SOP-017-ast-external-specifier-resolution.md` — 本文件
- `docs/release/0.23.3.md` — 版本 changelog
- `docs/sop/v0.23.x/README.md` — 索引更新

## Verification

### 单元测试

```sh
deno test packages/adapter-vite/__tests__/external-resolver.test.ts
deno test packages/create/__tests__/cli.test.ts
```

### 集成验证

Push → CI: Publish to JSR → consumer-smoke 在所有平台上通过。

### 回归检查

- [ ] `deno fmt` 全量通过
- [ ] SOP Gate 全绿
- [ ] consumer smoke test SSG build 无 `ERR_MODULE_NOT_FOUND`
- [ ] consumer smoke test SSG build 无 `Rolldown failed to resolve`
