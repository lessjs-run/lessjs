# SOP-004: `static client` Island Declaration

> Priority: P1 | Nature: 语法糖 | Time: 0.5d | Governing ADR: ADR-0059

## Objective

`static client = { strategy: 'visible' }` 替代 `island()` 函数调用。

## Step-by-Step

### Step 1: 类型定义

```typescript
// packages/core/src/dsd-element.ts
interface ClientConfig {
  strategy?: 'load' | 'idle' | 'visible' | 'only';
}

abstract class DsdElement extends HTMLElement {
  static client?: ClientConfig;
}
```

### Step 2: build-client.ts 扫描

```typescript
// packages/adapter-vite/src/cli/build-client.ts
function scanStaticClient(routeFile: string): ClientConfig | undefined {
  static cache: Map<string, ClientConfig> = new Map();
  // Read file, regex for 'static client = { strategy: "visible" }'
  const match = content.match(/static\s+client\s*=\s*\{[^}]+\}/);
  if (!match) return undefined;
  // Parse the config object
  return eval(`(${match[0].replace('static client = ', '')})`);
}
```

### Step 3: 自动注册 Island

检测到 `static client` 声明的组件 → 自动加入 island entry，不需要显式调用 `island()`。

### Step 4: Migration

```diff
- export default island('my-widget', MyWidget, { strategy: 'visible' });
+ export default class MyWidget extends DsdElement { static client = { strategy: 'visible' }; }
```

迁移 www/islands/ 中现有 4 个 demo 组件验证。

### Step 5: 验证

- [ ] `static client` 声明的组件生成 client chunk
- [ ] 4 个 demo island 迁移后行为一致
- [ ] `island()` 函数仍可工作（过渡期）
