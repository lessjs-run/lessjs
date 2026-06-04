# ADR-0043: SSG Phase 3 依赖策略 — external + noExternal 两层模型

> **Status**: PROPOSED
> **Date**: 2026-05-25
> **Applies to**: v0.21.x → v0.22.0
> **Extends**: ADR-0042 (Import Map Universal Resolution)
> **Supersedes**: ADR-0008 Phase C 中的 `noExternal: ALL` 策略

## Context

当前 SSG Phase 3 的 `viteBuild({ssr:true})` 配置使用统一的 `noExternal` 策略：

```ts
const defaultNoExternal = [
  /^lit/,
  /^@lit/,
  /^@openelement\/ui/,
  /^@openelement\/adapter-lit/,
  'parse5',
  'entities',
  'node-fetch',
  'fetch-blob',
  'data-uri-to-buffer',
  'formdata-polyfill',
  'domexception',
  'node-domexception',
];
```

这个策略将所有依赖内联到单一 SSR bundle 中。动机是：

1. 生成自包含 bundle，方便 Deno Deploy 部署
2. 确保模块级变量（Phase B）在整个图中共享

问题：

1. **Rolldown 子路径解析失败**：`parse5` 内部引用 `entities/lib/escape.js`，Rolldown 无法正确解析
2. **bundle 膨胀**：node-fetch、fetch-blob 等 Deno 已有原生实现的包被冗余打包
3. **维护成本**：每个新增 SSR 依赖都需要手动添加到 `noExternal` 列表
4. **诊断困难**：Rolldown 的 npm 解析错误信息不友好，难以定位根因

## Decision

**SSG Phase 3 采用两层依赖策略：`external`（SSR 传递依赖）+ `noExternal`（LessJS/Lit 业务代码）。**

### 第一层：noExternal — LessJS 业务代码 + Lit 生态

这些包由 Rolldown 打包进 SSR bundle，因为它们需要：

- TypeScript 编译（Lit decorators）
- 模块级变量共享（Phase B 单例）
- Tree-shaking 和 dead code elimination

```ts
const ssrNoExternal = [
  /^@openelement\//, // 所有 LessJS 框架包
  /^lit/, // lit, lit-html, lit-element
  /^@lit/, // @lit/reactive-element, @lit-labs/ssr-dom-shim
  /^@lit-labs\//, // @lit-labs/* (ssr-dom-shim 等)
];
```

### 第二层：external — SSR 传递依赖

这些包由 Deno ESM 运行时在 `import()` 阶段通过 import map 解析：

```ts
const ssrExternal = [
  'parse5', // HTML parser — 有子路径导出
  'entities', // HTML entity codec — 有子路径导出
  'hono', // HTTP framework
  'hono/*', // Hono subpath exports
  'node-fetch', // Deno 有原生 fetch
  'fetch-blob', // Deno 有原生 Blob
  'data-uri-to-buffer',
  'formdata-polyfill',
  'domexception',
  'node-domexception',
];
```

### 决策规则

判断一个依赖属于哪一层的规则：

| 条件                               | 层级               | 理由                                    |
| ---------------------------------- | ------------------ | --------------------------------------- |
| `@openelement/*` 包                | `noExternal`       | 需要 TypeScript 编译 + Phase B 单例共享 |
| `lit` / `@lit/*` 生态              | `noExternal`       | 需要 decorator 编译 + Lit SSR 内部状态  |
| npm 包有子路径导出且被传递依赖引用 | `external`         | Rolldown 无法解析 → 交还 Deno           |
| npm 包在 Deno 有原生替代           | `external`         | 避免冗余打包                            |
| npm 纯 JS 包无子路径依赖           | `external`（默认） | 减少 Rolldown 负担                      |

## Architecture

```
viteBuild({ ssr: true })
│
├── ssr.noExternal                    ┌─────────────────────────┐
│   ├── /^@openelement\//  ──────────────▶ │ Rolldown 打包            │
│   ├── /^lit/                        │ - TypeScript 编译        │
│   └── /^@lit/                       │ - Decorator 转换         │
│                                     │ - Tree-shaking           │
│                                     │ - 模块级变量共享         │
│                                     └──────────┬──────────────┘
│                                                │
├── ssr.external                                 ▼
│   ├── parse5                     ┌─────────────────────────┐
│   ├── entities                   │ server/entry.js          │
│   ├── hono                       │                          │
│   └── ...                        │ import { Hono } from     │
│                                  │   'hono';  ← external    │
│                                  │ import { parse } from    │
│                                  │   'parse5'; ← external   │
│                                  └──────────┬──────────────┘
│                                             │
└── build.outDir: dist/server/                ▼
                                   ┌─────────────────────────┐
                                   │ Deno import()            │
                                   │                          │
                                   │ 通过 deno.json import    │
                                   │ map 解析所有 external:    │
                                   │                          │
                                   │ hono → npm:hono@^4       │
                                   │ parse5 → npm:parse5@7    │
                                   │ entities → npm:entities@^4│
                                   │                          │
                                   │ ✅ 子路径正确            │
                                   └─────────────────────────┘
```

## importmap.json Sidecar

为保持与 Deno Deploy 的兼容性，SSG Phase 3 继续生成 `importmap.json` sidecar 文件。但内容从"所有依赖"简化为"external 依赖"：

```json
{
  "imports": {
    "hono": "npm:hono@^4.12.18",
    "parse5": "npm:parse5@7.0.0",
    "entities": "npm:entities@^4",
    "entities/": "npm:entities@^4/"
  }
}
```

`noExternal` 的包已在 bundle 中内联，不需要出现在 import map 中。

## Consequences

### Positive

- **消除子路径解析 bug**：`entities/lib/escape.js` 等所有子路径由 Deno 正确解析
- **bundle 缩小**：不再打包 parse5（~200KB）、hono（~50KB）等大包
- **构建速度提升**：Rolldown 处理的模块数量大幅减少
- **维护简化**：新增 SSR 依赖默认走 external，无需手动配置
- **诊断清晰**：external 依赖的解析错误由 Deno 报告，错误信息更友好

### Negative

- **部署复杂度增加**：不再是单一 self-contained bundle
- **import map 同步**：`deno.json` 和 `importmap.json` 需要保持一致
- **vendor 依赖**：Deno Deploy 环境需要 vendor 缓存或远程拉取
- **诊断分散**：问题可能出在 Rolldown（noExternal）或 Deno（external）两个层级

### Mitigation

- 在 CI 中增加 `deno vendor` 步骤，预缓存所有 external 依赖
- `importmap.json` 从 `deno.json` 自动生成，避免手动同步
- 构建日志区分 "Rolldown bundled" 和 "Deno external" 两类依赖

## Related

- ADR-0008: Build Pipeline Phases (Phase C: SSG via viteBuild)
- ADR-0041: ESM Module Graph First for JSR Consumer Builds
- ADR-0042: Import Map as Universal Resolution Layer
