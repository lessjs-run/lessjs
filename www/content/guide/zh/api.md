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

声明可交互 Custom Element 和 hydration metadata。

```tsx
export default defineIsland('my-counter', () => <button>Count</button>, {
  strategy: 'idle',
  dsd: true,
});
```

### `defineElement(tagName, render)`

声明可复用的 DSD-native custom element。

### `defineLayout(tagName, render)`

声明 layout element。它是 `defineElement()` 的语义别名。

## `@openelement/app/vite`

```ts
import { openElement } from '@openelement/app/vite';
```

`openElement()` 配置 Vite、route scanning、SSG、islands、AppShell、content 和 i18n。

## Runtime packages

- `@openelement/runtime`：低层 DSD element、signals 和 stylesheet exports。
- `@openelement/core`：renderer kernel 和 JSX runtime。
- `@openelement/signals`：signal primitives。
- `@openelement/style-sheet`：CSSStyleSheet abstraction。
