# SOP-007: html tagged template @deprecated + 文档更新

> Version: v0.24.1
> Priority: P1
> Status: PLANNED
> Depends on: SOP-005 (all internal components migrated)

## Objective

标记 `html` tagged template 和 `@prop()` 为 `@deprecated`，更新文档和示例优先展示 JSX 路径。

## Procedure

### Step 1: 标记 html 和相关函数为 @deprecated

**文件**: `packages/core/src/template.ts`

```typescript
/**
 * @deprecated Use JSX syntax instead. See ADR-0057.
 * The `html` tagged template will be moved to `@openelement/core/html-legacy` in v0.28
 * and removed in v1.0.
 */
export function html(strings: TemplateStringsArray, ...values: any[]): TemplateResult {
  // ... 现有实现不变 ...
}
```

同样标记：`classMap`、`when`、`choose`、`repeat`、`ref`、`unsafeHTML`。

**文件**: `packages/core/src/prop.ts`

`@prop()` 已在 SOP-002 Step 5 中标记 deprecated。

### Step 2: 更新 deno.json exports

在 `@openelement/core` 的 deno.json 中保留所有导出（不删除），但 JSDoc 指向 JSX 路径。

### Step 3: 更新文档

**优先级排序**：

1. `README.md` — 组件示例改为 JSX + static props
2. `docs/guide/` — 新增 JSX 迁移指南
3. `www/` 文档站 — 所有组件示例改为 JSX
4. `packages/core/README.md` — API 文档更新

### Step 4: 新增迁移指南

**文件**: `docs/guide/migration-html-to-jsx.md`

内容：

- html → JSX 语法对照表（复用 ADR-0057 的表格）
- @prop() → static props 迁移说明
- 常见问题和陷阱
- 自动解包边界说明

**验证**：

- [ ] 所有 `@deprecated` 标记的 JSDoc 包含迁移路径
- [ ] README 示例使用 JSX
- [ ] 迁移指南存在且完整

## Rollback

无独立回退。如果 v0.24.1 发布时组件迁移未完成：

- 推迟 @deprecated 标记到 v0.25.x
- 文档中同时展示 html 和 JSX 两种写法
