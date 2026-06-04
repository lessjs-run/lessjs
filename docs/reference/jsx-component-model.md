# openElement JSX Component Model

Status: v0.24.1\
Scope: JSX + Signal authoring in `DsdElement`

## Authoring Model

Reactive DSD components use JSX syntax with Signal-driven state:

```tsx
import { DsdElement } from '@openelement/runtime';
import { signal } from '@openelement/runtime';

class CounterElement extends DsdElement {
  count = signal(0);

  render() {
    return (
      <button onClick={() => this.count.value++}>
        Count: {this.count}
      </button>
    );
  }
}

customElements.define('my-counter', CounterElement);
```

String-returning `render()` methods remain supported for static and legacy components. VNode is the canonical v0.24.1 authoring path for reactive components.

## VNode Interface

The VNode is a pure data structure — no VDOM diff, no runtime tree:

```ts
interface VNode {
  tag: string | Function | symbol; // HTML tag, component class, or Fragment
  props: Record<string, unknown>; // attributes, event handlers, ref
  children: (VNode | string)[]; // child VNodes or text
  key?: string | number; // reconciliation hint (future use)
  ref?: (el: Element) => void; // DOM ref callback
}
```

The 5-field interface is **frozen** until v1.0. Any new field requires an ADR.

## JSX Rules

### Tag Names

- Lowercase strings → HTML/SVG elements
- Uppercase / PascalCase → Component classes (must have `render()` method)

### Props

| JSX                     | DOM                               | Notes                                      |
| ----------------------- | --------------------------------- | ------------------------------------------ |
| `className="foo"`       | `class="foo"`                     |                                            |
| `htmlFor="bar"`         | `for="bar"`                       |                                            |
| `onClick={fn}`          | `addEventListener('click', fn)`   | Any `on*` prop is treated as event handler |
| `style={{color:'red'}}` | `element.style.color = 'red'`     | CamelCase → kebab-case in renderToString   |
| `ref={el => ...}`       | Callback invoked with DOM element |                                            |
| `disabled`              | `setAttribute('disabled', '')`    | Boolean `true` emits attribute             |
| `disabled={false}`      | `removeAttribute('disabled')`     | Boolean `false` removes attribute          |
| `key="id"`              | Skipped (reconciliation hint)     |                                            |

### Children

- String / number / boolean → `document.createTextNode()`
- Signal → auto-unwrapped via `.value`
- VNode → nested element
- Array → flattened

## SSR: renderToString()

`renderToString(vnode)` converts a VNode tree to an HTML string:

- Event handlers (`onClick`, `onInput`, etc.) are silently skipped.
- `ref` callbacks are silently skipped.
- Text content is HTML-escaped.
- Void elements (`<br>`, `<img>`, `<input>`, etc.) self-close.
- `className` → `class`, `htmlFor` → `for`.
- `style` objects are serialised to inline CSS strings.

## CSR: renderToDom()

`renderToDom(vnode, signal?)` converts a VNode tree to real DOM nodes:

- Event handlers bound via native `addEventListener(type, fn, { signal })`.
- `ref` callbacks invoked with the created DOM element.
- `style` objects assigned to `element.style`.
- AbortSignal passed to `addEventListener` for automatic cleanup on disconnect.

## SVG Support

SVG elements (`circle`, `line`, `path`, `svg`, `rect`, etc.) are auto-detected and created via `document.createElementNS('http://www.w3.org/2000/svg', tag)` instead of `document.createElement()`. This ensures they render correctly in all browsers. The detection uses a hardcoded set of 50+ known SVG element names.

## Signal Reactivity

When `DsdElement._renderIntoShadowRoot()` processes a VNode-returning `render()`:

1. Initial DOM is created via `renderToDom()`.
2. An alien-signals `effect()` is created that wraps `this.render()`.
3. All signal accesses inside `render()` are auto-tracked by the effect.
4. When any tracked signal changes, the effect re-executes:
   - Old DOM is cleared (old AbortController aborted).
   - New DOM is created via `renderToDom()` with a fresh AbortController.
5. The effect is disposed via `_vnodeEffectDispose` in `_disposeSignalSubscriptions()`.

This replaces the old TemplateResult fine-grained patch model (`_subscribeTemplateSignals` + `_patchBindings`). The trade-off is full DOM re-render instead of targeted patches — simpler, more predictable, and sufficient for component-level rendering.

## Fragment

```tsx
render() {
  return (
    <>
      <header>Title</header>
      <main>Content</main>
    </>
  );
}
```

`Fragment` (the `<>...</>` syntax) groups children without introducing a wrapper DOM element. It is rendered as a `DocumentFragment` in CSR and concatenated HTML in SSR.

## Comparison: VNode vs TemplateResult

|                 | VNode (v0.24.1)                    | TemplateResult (removed)          |
| --------------- | ---------------------------------- | --------------------------------- |
| Creation        | JSX transform at build time        | `html\`...\`` tagged template     |
| Type checking   | TypeScript JSX IntrinsicElements   | None                              |
| Tooling         | IDE autocomplete, syntax highlight | Basic string highlighting         |
| Event binding   | `onClick={fn}`                     | `@click=${fn}`                    |
| Signal tracking | `effect()` auto-tracking           | `_subscribeTemplateSignals()`     |
| SSR             | `renderToString()`                 | `renderTemplateToString()`        |
| CSR             | `renderToDom()`                    | `_patchBindings()`                |
| Interface       | 5-field frozen VNode               | TemplateResult + values + markers |
