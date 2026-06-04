# ADR-0054: AST-Based External Specifier Resolution

- Status: ACCEPTED
- Date: 2026-05-27
- Applies to: v0.23.3+

## Context

v0.23.0 → v0.23.2 的 CI 修复过程中，consumer smoke test 的 SSG/SSR 构建
连续暴露了三次同根问题：

| Attempt | Error                                                  | 包            | Root Cause               |
| ------- | ------------------------------------------------------ | ------------- | ------------------------ |
| 1       | Rolldown 无法解析 `@openelement/runtime`               | runtime       | 不在 resolver 白名单     |
| 2       | JSR 404 (版本号 mismatch)                              | all           | 只 bump 了 adapter-vite  |
| 3       | SSR 运行时 `ERR_MODULE_NOT_FOUND: alien-signals`       | alien-signals | consumer import map 缺失 |
| 4       | SSR 运行时 `ERR_MODULE_NOT_FOUND: hono/secure-headers` | hono          | subpath external 不完整  |

第 4 个问题是系统性的。"external" 配置中只列出了主包名（`hono`），但 Rollup/Rolldown
的 SSR 外部化机制中，`external: ["hono"]` 是**精确匹配**，不匹配子路径导入
（`hono/secure-headers`）。

### 现有方案：FALLBACK_REGEX_MAP

```ts
const FALLBACK_REGEX_MAP: Record<string, string> = {
  parse5: '/^parse5(\\/|$)/',
  entities: '/^entities(\\/|$)/',
};
```

这些 regex 模式**从未被实际使用**：

- `buildFallbackManifest()` 返回 bare 包名，忽略 regex 值
- `extractExternalSpecifiers()` 只提取 `deno info --json` 输出的 `npm:` 主包名
- 子路径导入从未进入 `manifest.specifiers`

每次踩到新包的子路径导出问题，需要手动添加 regex → **维护负担线性增长，总比 bug 慢一步**。

## Decision

**替换 FALLBACK_REGEX_MAP 为 AST 驱动方案：解析每个外部包的实际 `package.json` `exports` 字段，自动生成完整子路径列表。**

### 工作原理

```
ssrExternalDefaults = ["hono", "entities", "parse5"]
                              ↓
          resolvePackageJson(packageName)
                              ↓
          walkExports(exportsField)  // 递归展平
                              ↓
          ["hono", "hono/secure-headers", "hono/cookie", "hono/context", ...]
                              ↓
          manifest.specifiers
```

### 关键实现

1. **解析 package.json**：使用 Deno 模块解析找到包根目录 → `readFileSync("package.json")`
2. **展平 exports**：递归遍历 `exports` 对象，收集所有键（非条件键）
3. *_处理 _/通配符__：`exports` 中的 `./*` 模式 → 替换为包名前缀（例如 `hono/*`）
4. **合并**：主包名 + 所有子路径导出 → `manifest.specifiers`

### 优势

| 维度     | FALLBACK_REGEX_MAP (旧) | AST (新)             |
| -------- | ----------------------- | -------------------- |
| 维护成本 | O(n) 每次踩坑手动加     | O(1) 自动发现        |
| 覆盖率   | 部分（已加白名单的）    | 完整（所有 exports） |
| 安全性   | 可能遗漏未知子路径      | 和实际 package 一致  |
| 复杂度   | 低但脆弱                | 中但可靠             |

### 权衡

- **pro**：彻底消除 "下一个包下一个子路径" 的踩坑循环
- **pro**：不需要维护 regex 白名单，新包自动生效
- **con**：依赖 Deno 模块解析找到包根目录（需要包在 node_modules 中）
- **con**：需要解析 `package.json`（引入文件读取和 JSON.parse）

## Consequences

### Positive

- consumer smoke test 不再因外部包的子路径导出问题反复失败
- 减少手动维护 FALLBACK_REGEX_MAP 的负担
- 任何 npm 包加入 `ssrExternalDefaults` 后自动正确处理所有子路径

### Negative

- 外部包解析需要包已安装到 node_modules（在 CI/smoke test 中不是问题）
- SSR build 多了一次 `package.json` 读取和 exports 遍历（可缓存）

### Neutral

- 移除 `FALLBACK_REGEX_MAP` 和相关的 regex 维护逻辑
- `extractExternalSpecifiers` 保留用于 `deno info --json` 路径，作为 fallback

## Implementation

- `packages/adapter-vite/src/external-resolver.ts`：实现 `walkExports` + `resolvePackageExports`
- `build-ssg.ts`：为 `manifest.specifiers` 补充 exports 子路径
- `packages/create/cli.ts`：consumer 模板补 `hono` 映射（belt-and-suspenders）
- 版本 bump：0.23.2 → 0.23.3
- 文档：SOP-017 + 本 ADR
