---
title: 'API Reference'
section: 'Reference'
label: 'API'
order: 70
---

## Core API

### renderDsd(input, options?)

The single rendering entry point. Renders a custom element to DSD HTML.

```ts
import { renderDsd } from '@openelement/core';

// By tag name — auto-looks up from customElements registry
const result = await renderDsd('less-layout', {
  props: {
    currentPath: '/guide/getting-started',
    locale: 'en',
  },
});

// By class — direct use
const result = await renderDsd(MyComponent, {
  props: { title: 'Hello' },
});

// result: { html: string, errors: [], metrics: {...}, hydrationHints: [] }
console.log(result.html);
```

**Parameters:**

| Param     | Type                                 | Description                                                                           |
| --------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| `input`   | `string \| CustomElementConstructor` | Tag name (auto-lookup) or component class                                             |
| `options` | `RenderDsdOptions`                   | Component class, props, source info, DSD options, collector, nesting depth, and hooks |

**Returns:** `Promise<RenderOutput>` — contains `html`, `errors`, `metrics`, `hydrationHints`.

### renderDsdTree(node)

Async VNode tree to HTML string renderer. Handles nested custom elements with DSD.

```ts
import { renderDsdTree } from '@openelement/core';

const vnode = jsx('div', { class: 'greeting', children: 'hello' });
const html = await renderDsdTree(vnode);
// → '<div class="greeting">hello</div>'
```

**Parameters:**

| Param  | Type      | Description                        |
| ------ | --------- | ---------------------------------- |
| `node` | `unknown` | VNode, string, number, or fragment |

**Returns:** `Promise<string>` — escaped HTML string with DSD for registered custom elements.

## Component Model

### DsdElement

Base class for all DSD-native components.

```tsx
import { DsdElement } from '@openelement/core';
import { signal } from '@openelement/signals';

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
        <button onClick={() => this._increment()}>+</button>
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

Import from `@openelement/core/jsx-runtime`:

```ts
import { For, jsx, jsxDEV, jsxs, Show } from '@openelement/core/jsx-runtime';
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

Import from `@openelement/signals`:

```ts
import { computed, effect, signal } from '@openelement/signals';

const count = signal(0);
const double = computed(() => count.value * 2);

effect(() => {
  console.log('count changed:', count.value);
});
```

## Islands

```tsx
// Create an island
import { defineIsland } from '@openelement/core';

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
import { wrapInDocument } from '@openelement/core';

const html = wrapInDocument(content, {
  title: 'My Page',
  lang: 'en',
  headExtras: '<link rel="stylesheet" href="/styles.css">',
});
```
