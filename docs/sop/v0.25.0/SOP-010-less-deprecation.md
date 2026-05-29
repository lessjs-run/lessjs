# SOP-010: `less()` → @deprecated

> Priority: P2 | Nature: 文档 | Time: 0.5d

## Objective

`less()` 函数标记 @deprecated，指向 `lessPipeline()`。

## Step-by-Step

### Step 1: 标记 deprecated

```typescript
/** @deprecated since v0.25.0 — Use lessPipeline() instead. */
export function less(config: LessConfig): Plugin { ... }
```

### Step 2: 内部转为调用 lessPipeline

```typescript
export function less(config: LessConfig): Plugin {
  console.warn('[LessJS] less() is deprecated. Use lessPipeline() instead.');
  return lessPipeline({ routes: { dir: config.routes?.dir ?? 'app/routes' }, ...config });
}
```

### Step 3: 更新文档

- `docs/reference/core-api-surface.md`: 移除 `less()` 条目，新增 `lessPipeline()`
- `www/app/routes/guide/configuration.ts`: JSX 配置示例更新为 `lessPipeline()`
- `README.md`: 更新 Quick Start 示例

### Step 4: 验证

- [ ] `less()` 调用仍有 @deprecated 警告但正常工作
- [ ] `lessPipeline()` 文档完整
- [ ] www 示例使用新 API
