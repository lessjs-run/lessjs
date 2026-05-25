# SOP-017: Deno Pre-Resolution — 消除 External 依赖的子路径泄露

> **版本**: 1.0
> **日期**: 2026-05-25
> **状态**: accepted
> **关联 ADR**: ADR-0047
> **前置**: SOP-014, SOP-016

## 1. 问题

SSG Phase 3 构建时，Rolldown 即使对 `parse5` 标记为 external，仍解析其源码中的 import 语句。`entities/lib/escape.js` 子路径无法被字符串 `'entities'` 匹配，需要 regex。

手工 regex `/^entities(\/|$)/` 可 workaround，但：
- 每个有子路径的包都需要手工推断 regex
- 包升级时子路径变化不会自动感知
- 违反 ADR-0042 "ESM 解析是运行时的职责" 的架构承诺

## 2. 方案

**Deno Pre-Resolution（Option A）**：构建前调用 Deno 解析 external 包的完整传递依赖图，自动生成精确 specifier 清单。

```
deno.json imports → Deno info --json → 完整 external specifiers → Rolldown ssr.external
```

### 核心模块

`packages/adapter-vite/src/external-resolver.ts`：

- `ExternalManifest`：specifiers + importMap + lockHash
- `resolveExternalManifest(packages, root)`：三级策略（缓存命中 → Deno 探针 → regex 回退）
- 缓存：`.less/external-manifest.json`，基于 `deno.lock` SHA-256 hash

### 集成点

`build-ssg.ts`：
- `ssrExternalDefaults = ['parse5', 'entities', 'hono']`（纯包名，无 regex）
- `viteBuild` 前调用 `resolveExternalManifest()`
- `ssr.external` = `manifest.specifiers`
- importmap 从 `manifest.importMap` 动态生成

## 3. 变更文件

| # | 文件 | 操作 |
|---|------|------|
| 1 | `packages/adapter-vite/src/external-resolver.ts` | NEW |
| 2 | `packages/adapter-vite/src/build-context.ts` | MODIFY |
| 3 | `packages/adapter-vite/src/cli/build-ssg.ts` | MODIFY |
| 4 | `packages/adapter-vite/src/index.ts` | MODIFY |
| 5 | `packages/adapter-vite/__tests__/external-resolver.test.ts` | NEW |

## 4. 验证

- `deno test external-resolver.test.ts` — 12/12 passed
- `deno task typecheck` — 零错误
- `deno test cli.test.ts` — 14/15 (1 Windows sandbox 环境限制)
- `deno test ssg-smoke.test.ts` — 1/1, 4/4 steps
- `deno task build` — 成功，无子路径解析错误
