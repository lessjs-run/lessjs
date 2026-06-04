# SOP-005: SignalContext (DOM-Tree)

> Priority: P2* | Nature: ~20 lines | Time: 0.5d | Governing ADR: ADR-0060\
> *Conditional: `computed()` ≥1 real-world use.

## Objective

DOM-tree-based 跨组件 signal 共享：provider 暴露 symbolic 属性，consumer 沿 DOM 树向上查找。

## Step-by-Step

### Step 1: 创建 signal-context.ts

**文件**: `packages/core/src/signal-context.ts`

```typescript
import { effect, type Signal, signal } from '@openelement/signals';

const contexts = new Map<symbol, unknown>();

export function createContext<T>(key: symbol, defaultValue: T) {
  const s = signal<T>(defaultValue);
  contexts.set(key, s);
  return { key, defaultValue };
}

export function provideContext<T>(
  host: HTMLElement,
  ctx: { key: symbol; defaultValue: T },
  value: T,
): void {
  const s = contexts.get(ctx.key) as Signal<T> | undefined;
  if (s) s.value = value;
  (host as Record<symbol, unknown>)[ctx.key] = value;
}

export function consumeContext<T>(
  host: HTMLElement,
  ctx: { key: symbol; defaultValue: T },
): Signal<T> {
  let el: Element | null = host.parentElement;
  while (el) {
    const v = (el as Record<symbol, unknown>)[ctx.key];
    if (v !== undefined) return signal(v as T);
    el = el.parentElement || ((el.getRootNode() as ShadowRoot)?.host ?? null);
  }
  return signal(ctx.defaultValue);
}
```

### Step 2: 导出

**文件**: `packages/core/src/index.ts` + `packages/runtime/src/index.ts`

```typescript
export { consumeContext, createContext, provideContext } from './signal-context.js';
```

### Step 3: DsdElement 便捷方法

```typescript
// dsd-element.ts
consumeContext<T>(ctx: { key: symbol; defaultValue: T }): Signal<T> {
  return consumeContext(this, ctx);
}
```

### Step 4: Theme/Locale 用 SignalContext 替代 document hack

```typescript
// less-layout.tsx
const themeCtx = createContext<Theme>(Symbol('theme'), 'light');
provideContext(this, themeCtx, this._theme.value);

// less-theme-toggle.tsx
const theme = this.consumeContext(themeCtx);
```

### Step 5: 验证

- [ ] Consumer 通过 `consumeContext()` 获取 provider signal
- [ ] 跨 shadow DOM 边界正确遍历
- [ ] Theme/Locale 场景验证
- [ ] ~20 lines 实现，零新依赖
