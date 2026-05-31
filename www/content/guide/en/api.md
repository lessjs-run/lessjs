---
title: 'API Reference'
section: 'Reference'
label: 'API'
order: 70
---

## Core API

### renderDsd(input, props?)

The single rendering entry point. Renders a custom element to DSD HTML.

```ts
import { renderDsd } from '@lessjs/core';

// By tag name — auto-looks up from customElements registry
const result = await renderDsd('less-layout', {
  currentPath: '/guide/getting-started',
  locale: 'en',
});

// By class — direct use
const result = await renderDsd(MyComponent, { title: 'Hello' });

// result: { html: string, errors: [], metrics: {...}, hydrationHints: [] }
console.log(result.html);
```

**Parameters:**

| Param   | Type                                 | Description                               |
| ------- | ------------------------------------ | ----------------------------------------- |
| `input` | `string \| CustomElementConstructor` | Tag name (auto-lookup) or component class |
| `props` | `Record<string, unknown>`            | Properties passed to the component        |

**Returns:** `Promise<RenderOutput>` — contains `html`, `errors`, `metrics`, `hydrationHints`.

### renderToString(vnode)

Synchronous VNode to HTML string renderer. Does NOT handle nested custom elements.

```ts
import { jsx, renderToString } from '@lessjs/core/jsx-runtime';

const vnode = jsx('div', { class: 'greeting', children: 'hello' });
const html = renderToString(vnode);
// → '<div class="greeting">hello</div>'
```

## Component Model

### DsdElement

Base class for all DSD-native components.

```tsx
import { DsdElement } from '@lessjs/core';
import { signal } from '@lessjs/signals';

class MyCounter extends DsdElement {
  static override styles = StyleSheet.create(`
    :host { display: block; }
    button { padding: 8px 16px; }
  `);

  #count = signal(0);

  render() {
    return (
      <div>
        <span data-signal='count'>{this.#count.value}</span>
        <button data-on-click='_increment'>+</button>
      </div>
    );
  }

  _increment() {
    this.#count.value++;
  }
}

customElements.define('my-counter', MyCounter);
```

### Fragment

Empty wrapper for grouping children without extra DOM:

```tsx
render() {
  return (
    <>
      <span>one</span>
      <span>two</span>
    </>
  )
}
```

## JSX Runtime (Subpath)

Import from `@lessjs/core/jsx-runtime`:

```ts
import { For, jsx, jsxDEV, jsxs, Show } from '@lessjs/core/jsx-runtime';
```

### For

List rendering with signal arrays:

```tsx
<For each={this.#items}>
  {(item) => <li>{item.name}</li>}
</For>;
```

### Show

Conditional rendering:

```tsx
<Show when={this.#loading}>
  <Spinner />
  <Content />
</Show>;
```

## Signals

Import from `@lessjs/signals`:

```ts
import { computed, effect, signal } from '@lessjs/signals';

const count = signal(0);
const double = computed(() => count.value * 2);

effect(() => {
  console.log('count changed:', count.value);
});
```

## Islands

```tsx
// Create an island
import { defineIsland } from '@lessjs/core';

defineIsland('my-widget', {
  tagName: 'my-widget',
  strategy: 'idle', // load | idle | visible | only
});
```

```tsx
// Use in a page
<my-widget client:idle />;
```

Hydration strategies: `client:load` (immediate), `client:idle` (requestIdleCallback), `client:visible` (IntersectionObserver), `client:only` (CSR only, no SSR).

## wrapInDocument

Wraps content in a complete HTML document:

```ts
import { wrapInDocument } from '@lessjs/core';

const html = wrapInDocument(content, {
  title: 'My Page',
  lang: 'en',
  headExtras: '<link rel="stylesheet" href="/styles.css">',
});
```
