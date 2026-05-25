# ADR-0047: Deno 预解析 External 依赖 — 消除 ESM 子路径泄露

> **Status**: ACCEPTED
> **Date**: 2026-05-25
> **Applies to**: v0.21.x
> **Extends**: ADR-0042, ADR-0043

## Context

ADR-0042 和 ADR-0043 建立了 Clean Architecture 的核心契约：

1. **Deno ESM 运行时** 负责所有依赖解析（含 npm 子路径 exports）
2. **Rolldown/Vite** 仅打包 LessJS 业务代码 + Lit 生态
3. **npm 传递依赖标记为 `external`**，由 Deno 在 `import()` 阶段解析

实践发现：**Rolldown 构建 SSR bundle 时，即使包标记为 `external`，它仍会在依赖图分析阶段解析该包的源码中的 import 语句。** 字符串 `'entities'` 无法匹配子路径 `entities/lib/escape.js`。

## Decision

**在 SSG 构建前，调用 Deno 预解析 external 包的完整传递依赖图，自动生成包含所有子路径 specifier 的外部依赖清单。Rolldown 只做打包，不做任何解析决策。**

```
deno.json import map → Deno Pre-Resolution → 完整 external 清单 → Rolldown 纯打包
```

这是一次性 handoff：Deno 完成所有解析工作，Rolldown 接到不需再做解析决策的完整清单。

## Architecture

- `packages/adapter-vite/src/external-resolver.ts`：核心模块，`resolveExternalManifest()` 通过 `deno info --json` 解析外部包模块图
- 缓存到 `.less/external-manifest.json`，用 `deno.lock` hash 判断失效
- 不可用时回退到当前 regex 策略（`buildFallbackManifest()`）
- `build-ssg.ts`：`ssr.external` 从手工 regex 数组改为 `manifest.specifiers`

## Consequences

### Positive

- **真正 Clean Separation**：Rolldown 不再做 ESM 解析决策
- **零手工维护**：新增 external 依赖自动发现所有传递子路径
- **importmap.json 自动化**：从 pre-resolution 结果自动生成

### Negative

- 构建时间微增（缓存命中 < 50ms，无缓存 2-5s）
- 依赖 Deno CLI 运行时

## Related

- ADR-0042: Import Map as Universal Resolution Layer
- ADR-0043: SSG Phase 3 Dependency Strategy
- SOP-017: Deno Pre-Resolution External Dependencies
