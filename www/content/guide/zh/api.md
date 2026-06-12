---
title: 'API Reference'
section: 'Reference'
label: 'API'
order: 70
---

# API Reference

## `@openelement/app`

```tsx
import { defineElement, defineIsland, defineLayout, definePage } from '@openelement/app';
```

### `definePage(input)`

声明 route component。

```tsx
export default definePage({
  title: 'Home',
  async load() {
    return { message: 'Hello' };
  },
  render({ data }) {
    return <main>{data.message}</main>;
  },
});
```

### `defineIsland(tagName, render, options?)`

声明可交互 Custom Element 及其 hydration metadata。

```tsx
export default defineIsland('my-counter', () => <button>Count</button>, {
  strategy: 'idle',
  dsd: true,
});
```

### `defineElement(tagName, render)`

声明可复用的 Elements-native custom element。Shadow/DSD 是默认渲染模式；
light DOM 必须显式选择。

### `defineLayout(tagName, render)`

声明 layout element。它是 `defineElement()` 的语义别名。

## `@openelement/app/vite`

```ts
import { openElement } from '@openelement/app/vite';
```

`openElement()` 配置 Vite、route scanning、SSG、islands、AppShell、content 和
i18n。

## 产品和 Runtime packages

- `@openelement/app` 和 `@openelement/create`：Framework 产品面。
- `@openelement/ui`：第一方 UI 产品面。
- `@openelement/protocols`：runtime-free Protocols 产品面。
- 未来 `@openelement/elements`：带 `OpenElement` 的 Elements 产品面。
- `@openelement/runtime`：当前底层 element、signals、stylesheet facade。
- `@openelement/core`：renderer kernel 和 JSX runtime。
- `@openelement/signals`：signal primitives。
- `@openelement/style-sheet`：CSSStyleSheet abstraction。
