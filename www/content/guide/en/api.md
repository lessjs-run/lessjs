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

Declares a route component.

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

Declares an interactive Custom Element and its hydration metadata.

```tsx
export default defineIsland('my-counter', () => <button>Count</button>, {
  strategy: 'idle',
  dsd: true,
});
```

### `defineElement(tagName, render)`

Declares a reusable DSD-native custom element.

### `defineLayout(tagName, render)`

Declares a layout element. It is a semantic alias for `defineElement()`.

## `@openelement/app/vite`

```ts
import { openElement } from '@openelement/app/vite';
```

`openElement()` configures Vite, route scanning, SSG, islands, AppShell,
content, and i18n.

## Runtime Packages

- `@openelement/runtime`: low-level DSD element, signals, and stylesheet exports.
- `@openelement/core`: renderer kernel and JSX runtime.
- `@openelement/signals`: signal primitives.
- `@openelement/style-sheet`: CSSStyleSheet abstraction.
