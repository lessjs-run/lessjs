# ADR-0042: Import Map 作为 Universal Resolution Layer

> **Status**: PROPOSED
> **Date**: 2026-05-25
> **Applies to**: v0.21.x → v0.22.0
> **Extends**: ADR-0041 (ESM Module Graph First)
> **Supersedes**: 部分替代 ADR-0028 中 SSR bundle 的 noExternal 策略

## Context

LessJS SSG 构建管线 Phase 3 当前使用 `viteBuild({ssr:true, noExternal: [...]})` 将所有依赖打包进单一日包含 bundle。`noExternal` 列表包含 `parse5`、`entities`、`node-fetch` 等 npm 包。

问题：Rolldown（Vite 底层打包器）在做 ESM 解析时，无法正确处理 npm 包的子路径导出（subpath exports）。具体表现为 `parse5` 内部引用 `entities/lib/escape.js` 时，Rolldown 无法通过 npm package.json 的 `exports` 字段正确解析该子路径，导致构建失败。

根因分析：

- **ESM 子路径解析是运行时（Deno/Browser）的职责**，不是打包工具的职责
- Rolldown 的 npm 包解析基于 node_modules 文件系统布局，而非 package.json `exports` 语义
- `noExternal` 策略强行将运行时解析责任转移给了打包工具
- Deno 原生 import map 完整支持 npm 子路径映射，包括 `"entities/"` 尾部斜杠语法

## Decision

**LessJS 将 Import Map（`deno.json` `"imports"` 字段）作为所有依赖的唯一分辨率来源。**

具体决策：

1. **`deno.json` import map 覆盖所有依赖**：包括 LessJS 自身包（`@openelement/*`）、Lit 生态（`lit`、`@lit/reactive-element` 等）、SSR 传递依赖（`parse5`、`entities`、`hono` 等）。

2. **SSR 传递依赖使用 subpath mapping**：对于有子路径导出的包（如 `entities`），使用 Deno import map 的尾部斜杠语法：
   ```json
   {
     "imports": {
       "entities": "npm:entities@^4",
       "entities/": "npm:entities@^4/"
     }
   }
   ```

3. **Import map 是单一事实来源**：无论是 Deno workspace 开发、JSR consumer 构建、还是 SSG SSR bundle，所有模块解析都通过同一个 import map。

4. **Rolldown 仅负责业务代码打包**：LessJS 框架代码 + Lit 生态代码由 Rolldown 打包；npm 传递依赖标记为 `external`，由 Deno ESM 运行时在 `import()` 阶段解析。

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  deno.json (Import Map)                       │
│                                                              │
│  "imports": {                                                │
│    // LessJS own packages                                    │
│    "@openelement/core": "jsr:@openelement/core@^0.21",                │
│    "@openelement/ui/": "jsr:@openelement/ui@^0.21/",                  │
│                                                              │
│    // Lit ecosystem                                          │
│    "lit": "npm:lit@^3.2.0",                                  │
│    "@lit/reactive-element": "npm:@lit/reactive-element@^2",  │
│                                                              │
│    // SSR transitive deps (with subpath mappings)            │
│    "parse5": "npm:parse5@7.0.0",                             │
│    "entities": "npm:entities@^4",                            │
│    "entities/": "npm:entities@^4/",     ← subpath mapping    │
│    "hono": "npm:hono@^4.12.18"                               │
│  },                                                           │
│  "vendor": true                                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
         │                                    │
         │  workspace dev                     │  consumer build
         ▼                                    ▼
┌──────────────────┐              ┌──────────────────────┐
│ Deno LSP +      │              │ deno.json import map  │
│ deno check      │              │ → Vite @deno/plugin   │
│ (native resolve)│              │ → Rolldown alias      │
└──────────────────┘              └──────────────────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              ▼                               ▼
                    ┌──────────────────┐          ┌──────────────────────┐
                    │ Phase 3:         │          │ Phase 3:             │
                    │ viteBuild(ssr)   │          │ Deno import()        │
                    │                  │          │                      │
                    │ noExternal:      │          │ Resolves external:   │
                    │  /^@openelement\//    │          │  parse5, entities,   │
                    │  /^lit/          │          │  hono via import map │
                    │  /^@lit/         │          │                      │
                    │                  │          │ ✅ Subpath ok        │
                    │ external:        │          │ ✅ exports ok        │
                    │  parse5          │          │                      │
                    │  entities        │          │                      │
                    │  hono            │          │                      │
                    └──────────────────┘          └──────────────────────┘
```

## Resolution Responsibility Boundary

| 组件                   | 旧职责                          | 新职责                                |
| ---------------------- | ------------------------------- | ------------------------------------- |
| `deno.json` import map | 仅 LessJS workspace 开发        | **所有环境**的模块分辨率来源          |
| Rolldown/Vite          | 解析所有依赖（含 npm 子路径）   | 仅打包 LessJS 业务代码 + Lit 生态     |
| Deno ESM Runtime       | 不使用（self-contained bundle） | 解析所有 external 依赖（含子路径）    |
| `@deno/vite-plugin`    | 开发服务器 bare specifier 解析  | 消费者构建时的 Deno import map bridge |

## Non-Goals

- 不引入新的包管理器或 registry
- 不替换 Vite/Rolldown
- 不改变 npm 包的分发方式
- 不在消费者项目中要求 vendor 目录（vendor 对 SSG 阶段是可选优化）

## Consequences

### Positive

- **消除子路径解析 bug**：`parse5 → entities/lib/escape.js` 等所有子路径由 Deno 正确解析
- **减少 Rolldown 复杂度**：Rolldown 只需处理 LessJS/Lit 代码，不用理解 npm `exports` 语义
- **单一分辨率来源**：import map 是唯一的 resolution 配置，消除 deno.json 与 bundle 配置之间的不一致
- **与 ADR-0041 对齐**：ESM module graph 是主合同，Deno/JSR 原生解析是唯一路径
- **消费者友好**：消费者只需一个 `deno.json` import map，无需理解 bundler 内部

### Negative

- **Bundle 结构变化**：从单一 self-contained bundle 变为 bundle + external imports
- **部署模型调整**：Deno Deploy 需要 `deno vendor` 或上传 vendor 目录
- **Import map 维护成本**：新增 SSR 依赖时需要同时在 import map 中声明
- **向后兼容**：现有消费者项目的 `noExternal` 配置可能需要调整

## Related

- ADR-0041: ESM Module Graph First for JSR Consumer Builds
- ADR-0043: SSG Phase 3 Dependency Strategy (external + noExternal)
- ADR-0045: Native API First-Class Citizen Strategy
- `deno.json` import map configuration
- Deno import maps spec: https://deno.com/manual@v2.3.5/basics/import_maps
