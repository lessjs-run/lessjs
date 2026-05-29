# SOP-008: `as any` Type Escape Hardening

> Priority: P1 | Nature: 类型安全 | Time: 0.5d

## Objective

21 处 `as any` / `Record<string, unknown>` escape 在 core/src 中清零或注释。

## Step-by-Step

### Step 1: 审计并分类

```bash
rg '\bas any\b|Record<string, unknown>' packages/core/src/ --include='*.ts' \
  | grep -v '__tests__\|.d.ts'
```

按原因分类：

| 类别         | 示例                                 | 修复                  |
| ------------ | ------------------------------------ | --------------------- |
| Symbol 索引  | `instance[STATIC_PROP_SIGNALS]`      | 使用 `Map<symbol, T>` |
| DOM API 兼容 | `(this as any).locale`               | 声明 interface 扩展   |
| JSON 序列化  | `JSON.stringify(obj as Record<...>)` | 泛型约束              |
| 第三方库类型 | `(globalThis as any).Prism`          | declare global        |

### Step 2: 逐个修复

```typescript
// Before
static signals = (this as any)[STATIC_PROP_SIGNALS];

// After
private static _signalMap = new Map<symbol, Signal<unknown>>();
static signals = DsdElement._signalMap.get(STATIC_PROP_SIGNALS);
```

### Step 3: 例外

允许保留 `as any` 的场景：

- 跨包类型不兼容的 API bridge（标注 `// type-escape: cross-package bridge`）
- 第三方库（`globalThis.Prism` 等，标注 `// type-escape: external`）

### Step 4: 验证

- [ ] 21 处降为 ≤5 处，且全部有注释说明
- [ ] `deno task typecheck` 通过
- [ ] `deno task test` 通过
