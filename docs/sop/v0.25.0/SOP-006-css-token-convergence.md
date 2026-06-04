# SOP-006: CSS Token Injection Convergence

> Priority: P1 | Nature: 去重 | Time: 1d

## Objective

20 处 `openPropsTokenSheet` import → ≤2 处集中注入。CSS bundle 减小 ≥30%。

## Step-by-Step

### Step 1: 创建全局 token sheet

**文件**: `packages/ui/src/global-tokens.ts`

```typescript
import { openPropsTokenSheet } from './open-props-tokens.ts';
export const globalTokenSheet = openPropsTokenSheet;
```

### Step 2: 在 less-layout 中注入

`less-layout` 作为所有页面的 wrapper，在 `static styles` 中包含 `globalTokenSheet`。子组件不再单独导入。

### Step 3: 逐个移除子组件 import

对 10 个 UI 组件（`less-button`, `less-card`, `less-callout` 等）：

1. 删除 `import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens'`
2. 删除 `static styles` 中的 `openPropsTokenSheet`
3. 验证视觉一致性

### Step 4: DsdElement 基类默认注入（可选）

```typescript
// dsd-element.ts
static styles = [globalTokenSheet]; // 可选，让所有 DsdElement 自动有 tokens
```

### Step 5: 验证

- [ ] openPropsTokenSheet import 从 20 → ≤2
- [ ] `deno task build` 后 CSS bundle 大小减小 ≥30%
- [ ] 10 个 UI 组件视觉一致性不变
- [ ] Playwright 视觉回归通过
