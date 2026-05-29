# SOP-009: Test Path Unification

> Priority: P2 | Nature: 测试工具 | Time: 0.5d

## Objective

70 处 `../src/xxx.ts` 硬编码路径 → 统一 `test-utils.ts` re-export。

## Step-by-Step

### Step 1: 创建 test-utils

**文件**: `packages/core/__tests__/test-utils.ts`

```typescript
// Re-export all commonly used modules from a single entry
export { DsdElement } from '../src/dsd-element.ts';
export { Fragment, jsx, jsxs } from '../src/jsx-runtime.ts';
export { renderToDom } from '../src/jsx-render-dom.ts';
export { renderToString } from '../src/jsx-render-string.ts';
export { isVNode, type VNode } from '../src/vnode.ts';
export { isSignalLike, unwrapSignalLike } from '../src/signal-like.ts';
export { computed, effect, signal } from '../../signals/src/framework.ts';
export { StyleSheet } from '../../style-sheet/src/style-sheet.ts';
```

### Step 2: 逐个迁移测试文件

```diff
- import { DsdElement } from '../src/dsd-element.ts';
- import { jsx } from '../src/jsx-runtime.ts';
+ import { DsdElement, jsx } from './test-utils.ts';
```

### Step 3: 统一 adapter 测试

```typescript
// packages/adapter-vite/__tests__/test-utils.ts
export { scanRoutes } from '../src/route-scanner.ts';
// ...
```

### Step 4: 验证

- [ ] 70 处 `../src/` 降为 0
- [ ] `deno task test` 全部通过
- [ ] 新增测试文件默认使用 test-utils
