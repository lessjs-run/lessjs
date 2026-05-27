# ADR-0056: External Dependencies — Consumer Import Map + AST Resolution

- Status: ACCEPTED
- Date: 2026-05-28
- Supersedes: ADR-0055

## Context

v0.23.0 → v0.23.5 的 CI consumer smoke test 修复尝试了两种极端：

1. **全部 externalize**（ADR-0047）：`ssrExternalDefaults = ['parse5', 'entities', 'hono']` → external list 缺子路径 → 部分被打进 SSR bundle → 运行时 `ERR_MODULE_NOT_FOUND`
2. **全部 noExternal bundle**（ADR-0055）：`/^parse5/`, `/^entities/`, `/^hono/` → Rolldown 尝试 bundle parse5 时遇到内部 `import 'entities/lib/escape.js'` → 无法通过 `@deno/vite-plugin` 解析 → 构建时失败

两种极端都失败。根本矛盾：

```
SSR bundle 的依赖 graph 跨越 consumer 和 adapter-vite 两个模块体系：
- adapter-vite → parse5/entities/hono (有)
- consumer → parse5/entities/hono (无, 但 SSR entry 需要)
```

## Decision

**三层架构**：

### Layer 1: Externalization with Complete Subpath Coverage

SSR 构建时 externalize `parse5`、`entities`、`hono`，通过 AST 方式（ADR-0054）
自动覆盖所有子路径导出。Rolldown 不触碰这些包的内部依赖图。

```ts
const ssrExternalDefaults = ['parse5', 'entities', 'hono'];
// ADR-0054: AST generates complete specifiers including subpaths
// → manifest.specifiers = ['hono', 'hono/secure-headers', ..., 'entities', 'entities/lib/escape.js', ...]
ssr: { noExternal: [/^@lessjs\//], external: manifest.specifiers }
```

### Layer 2: Consumer Import Map Declaration

Consumer 的 `deno.json` 显式声明这些包。这不是 "workaround"
——这是在 consumer 项目依赖图中声明**SSR 运行时需要的传递依赖**。

```json
{
  "imports": {
    "alien-signals": "npm:alien-signals@^3.2.0",
    "entities": "npm:entities@^4.5.0",
    "hono": "npm:hono@^4",
    "parse5": "npm:parse5@^7.0.0",
    "@lessjs/app": "...",
    "@lessjs/runtime": "...",
    "@lessjs/ui": "...",
    "@deno/vite-plugin": "...",
    "vite": "npm:vite@8.0.10"
  }
}
```

### Layer 3: Node Modules Fallback

子路径导入（`hono/secure-headers`, `entities/lib/escape.js`）不需要单独的
import map 条目。这些包在 `node_modules` 中已安装 → Deno 通过
Node.js 标准解析 fallback 找到子路径文件。

## Architecture

```
SSR Build (Rolldown)
│
├─ noExternal: [/^@lessjs\//]     → LessJS code bundled inline
├─ external: manifest.specifiers  → parse5/entities/hono + ALL subpaths
│                                    covered by ADR-0054 AST
│
▼
SSR Entry (entry.js)
│
├─ import '@lessjs/core'          → bundled inline ✅
├─ import 'parse5'                 → top-level import (externalized)
├─ import 'entities/lib/escape.js' → top-level import (externalized via AST)
│
▼
buildSSG() → import(entry.js)
│
├─ Consumer deno.json → parse5/hono/entities ✅ (Layer 2)
├─ Subpath fallback → node_modules ✅ (Layer 3)
```

## Why Not Bundle?

`parse5` imports `entities/lib/escape.js` as a bare Node.js import. In a Deno/Vite
SSR build with `@deno/vite-plugin`, bare subpath imports of npm packages can't
always be resolved during bundling. Externalizing avoids this entirely — Rolldown
never needs to understand `parse5`'s internal dependency graph.

## Consequences

### Positive

- Rolldown 不需要解析第三方包的内部依赖图
- AST 自动覆盖所有子路径（不遗漏 `entities/lib/escape.js`）
- Consumer 引用透明（可直接看到哪些包被使用）
- 不依赖 `--import-map` 子进程或运行时 hack

### Negative

- Consumer 模板有 9 个 imports（比 v0.23.0 的 5 个多 4 个）
- 新增 @lessjs/runtime → alien-signals 这条传递依赖链暴露给 consumer
- 如果 adapter-vite 新增外部依赖，consumer 模板需同步更新

### Neutral

- 保留 ADR-0054 的 AST 实现（完整的 external-resolver.ts）
- ADR-0047 的 `deno info --json` 路径作为 AST 的补充
