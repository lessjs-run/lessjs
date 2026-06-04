# Static Props API Reference

Status: v0.24.1\
Scope: `DsdElement` static props — the replacement for `@prop()` decorator

`static props` is an ES2022 class field that declares reactive, attribute-synced properties on a `DsdElement` subclass. It replaces the `@prop()` decorator removed in v0.24.1 (ADR-0057), providing the same reactive semantics without decorator syntax or stage-3 proposal risk.

## Quick Reference

```ts
class MyCounter extends DsdElement {
  static props = {
    count: Number,
    label: { type: String, default: 'Counter', reflect: true },
  };
  // this.count → Number signal (auto-unwraps to number in JSX)
  // this.label → String signal (auto-unwraps to string in JSX)
}
```

## PropDecl Types

Each value in `static props` must be a `PropDecl` — either a shorthand constructor or a full-object declaration.

### Shorthand Form

The constructor alone sets the type and uses default defaults:

```ts
static props = {
  name: String,    // type: String,  default: '',      reflect: false
  count: Number,   // type: Number,  default: 0,        reflect: false
  active: Boolean, // type: Boolean, default: false,    reflect: false
  items: Array,    // type: Array,   default: [],       reflect: false
  config: Object,  // type: Object,  default: {},       reflect: false
};
```

### Full Form

An object declaration adds `default` and `reflect` control:

```ts
static props = {
  count: {
    type: Number,
    default: 5,
    reflect: true,    // property writes → HTML attribute
  },
  label: {
    type: String,
    default: 'Hello',
    reflect: false,
  },
  active: {
    type: Boolean,
    default: false,
    reflect: true,    // attribute presence toggle
  },
};
```

| Field     | Type                                                                                                    | Default            | Description                                                  |
| --------- | ------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| `type`    | `StringConstructor \| NumberConstructor \| BooleanConstructor \| ArrayConstructor \| ObjectConstructor` | **(required)**     | Constructor used for attribute↔property type conversion      |
| `default` | Same as `type` instance                                                                                 | type-specific zero | Initial value when no attribute or own property exists       |
| `reflect` | `boolean`                                                                                               | `false`            | When `true`, property writes are reflected to HTML attribute |

### Supported Types

| Constructor | TS Property Type          | Attribute → Property      | Property → Attribute                         | Default |
| ----------- | ------------------------- | ------------------------- | -------------------------------------------- | ------- |
| `String`    | `string`                  | `getAttribute()` as-is    | `setAttribute(n, str)`                       | `''`    |
| `Number`    | `number`                  | `Number(attrVal)`         | `String(val)`                                | `0`     |
| `Boolean`   | `boolean`                 | `hasAttribute()` → `true` | `setAttribute(n, '')` / `removeAttribute(n)` | `false` |
| `Array`     | `unknown[]`               | Not serializable via attr | Not serializable                             | `[]`    |
| `Object`    | `Record<string, unknown>` | Not serializable via attr | Not serializable                             | `{}`    |

> **Note**: `Array` and `Object` types cannot be meaningfully serialised through HTML attributes. Use them for runtime-only properties that are set via JS property or passed through SSR `injectProps()`. For attribute-synced complex data, prefer `JSON.parse`/`JSON.stringify` in an attribute handler.

## TypeScript Utilities

### PropType\<D\>

Maps a `PropDecl` to its runtime TypeScript type:

```ts
import type { PropType } from '@openelement/runtime';

type CountType = PropType<NumberConstructor>; // number
type LabelType = PropType<StringConstructor>; // string
type ActiveType = PropType<BooleanConstructor>; // boolean
type ItemsType = PropType<ArrayConstructor>; // unknown[]
type ConfigType = PropType<ObjectConstructor>; // Record<string, unknown>
```

Works identically for full-form declarations:

```ts
type X = PropType<{ type: StringConstructor; default: string }>; // string
type Y = PropType<{ type: NumberConstructor; reflect: boolean }>; // number
```

### PropsFrom\<P\>

Maps an entire `static props` record to typed properties:

```ts
import type { PropsFrom } from '@openelement/runtime';

class MyCard extends DsdElement {
  static props = {
    title: String,
    count: Number,
    visible: Boolean,
  };

  // TypeScript now infers:
  // this.title  → string  (Signal auto-unwrap)
  // this.count  → number  (Signal auto-unwrap)
  // this.visible → boolean (Signal auto-unwrap)
}
```

The type deduction requires TypeScript's `declare` keyword if you want to annotate the property type explicitly:

```ts
class MyCard extends DsdElement {
  static props = {
    title: String,
    count: Number,
    visible: Boolean,
  };

  declare title: string;
  declare count: number;
  declare visible: boolean;

  render() {
    return <h1>{this.title}: {this.count}</h1>;
  }
}
```

## observedAttributes Auto-Generation

When `static props` is declared, the prop names are automatically added to `observedAttributes`:

```ts
class MyCounter extends DsdElement {
  static props = {
    count: Number,
    label: String,
  };
}

// The following are equivalent to:
// MyCounter.observedAttributes = ['count', 'label'];

// If the class already has observedAttributes, the prop names
// are merged in — duplicates are skipped.
```

The observable attribute name is always the **lowercased property name**. There is no `attribute` field in `PropDecl` — the attribute name is always the lowercased property key, matching standard Web Component conventions and the HTML spec.

## attributeChangedCallback Integration

`DsdElement.attributeChangedCallback()` automatically routes attribute changes to the static props system:

```ts
// Step 1: Browser sets HTML attribute
// <my-counter count="42" label="hello"></my-counter>

// Step 2: connectedCallback() calls syncStaticPropsFromAttributes()
//   → signal values are initialised from HTML attributes

// Step 3: User changes attribute (e.g. via setAttribute or devtools)
myCounter.setAttribute('count', '99');

// Step 4: attributeChangedCallback('count', '42', '99') fires
//   → DsdElement.base calls handleStaticPropAttributeChange()
//   → Signal value is updated
//   → If reflect: true, no double-write (already the attribute)
//   → DsdElement schedules reactive re-render
```

The dispatch chain within `attributeChangedCallback`:

```ts
attributeChangedCallback(name, oldValue, newValue) {
  handlePropAttributeChange(this, name, oldValue, newValue);       // legacy @prop()
  handleStaticPropAttributeChange(this, name, oldValue, newValue);  // static props
}
```

Both handlers co-exist — a component with legacy `@prop()` decorators and new `static props` will have both paths active. This allows incremental migration.

## Lifecycle

### initializeStaticProps()

Called from `DsdElement.connectedCallback()`. For each declared prop:

1. Reads the class's `static props` record.
2. Creates a `PropSignal` (per-property signal with `value`, `subscribe`, `valueOf`, `Symbol.toPrimitive`).
3. Installs a get/set accessor on the instance via `Object.defineProperty`:
   - **get**: returns the PropSignal object itself (not `.value` — auto-unwrap via `valueOf` in JSX).
   - **set**: writes to `sig.value`.
4. If `reflect: true`, subscribes to signal changes and writes back to the HTML attribute.
5. Registers the lowercased property names in `observedAttributes`.

### syncStaticPropsFromAttributes()

Called immediately after `initializeStaticProps()`. Reads HTML attributes already on the element and sets initial signal values:

- `String`: `getAttribute(name)` → signal value.
- `Number`: `Number(getAttribute(name))` → signal value (NaN → 0).
- `Boolean`: `hasAttribute(name)` → `true`, otherwise stays at default (`false`).

### disposeStaticProps()

Called from `DsdElement.disconnectedCallback()`. Cleans up all signal subscriptions (reflect subscribers, etc.).

### Full Lifecycle Diagram

```
constructor()
  └─ [class fields initialised — own property values set]

connectedCallback()
  ├─ initializeProps(this)              // legacy @prop()
  ├─ initializeStaticProps(this)        // creates signals + accessors
  ├─ syncStaticPropsFromAttributes(this) // reads HTML attrs → signals
  ├─ createRenderRoot()                 // DSD detection + shadow root
  └─ _hydrateOrRender()                 // first render

[property changes via JS]
  └─ this.count = 5
     └─ set accessor → sig.value = 5
        └─ if reflect: setAttribute('count', '5')

[attribute changes via HTML]
  └─ attributeChangedCallback('count', ...)
     └─ handleStaticPropAttributeChange()
        └─ sig.value = 5

disconnectedCallback()
  ├─ _disposeTemplateRuntime()
  ├─ _disposeSignalSubscriptions()
  ├─ disposeProps(this)
  └─ disposeStaticProps(this)           // clean up reflect subscribers
```

## Full Code Example

### Counter with Static Props + JSX

```tsx
import { computed, DsdElement, signal } from '@openelement/runtime';

class CounterElement extends DsdElement {
  static props = {
    initial: { type: Number, default: 0, reflect: true },
    step: { type: Number, default: 1 },
    label: { type: String, default: 'Count' },
  };

  // Internal state (not a prop — no HTML attribute)
  #count = signal(this.initial);

  get doubleCount() {
    return computed(() => this.#count.value * 2);
  }

  render() {
    return (
      <div class='counter'>
        <span class='label'>{this.label}:</span>
        <span class='value'>{this.#count}</span>
        <span class='double'>(×2 = {this.doubleCount})</span>
        <button onClick={() => this.#count.value += this.step}>
          +{this.step}
        </button>
        <button onClick={() => this.#count.value -= this.step}>
          -{this.step}
        </button>
      </div>
    );
  }
}

customElements.define('my-counter', CounterElement);
```

### Usage in HTML

```html
<!-- initial=10 comes in as this.initial signal → 10 -->
<my-counter initial="10" step="5" label="Score"></my-counter>

<!-- Boolean props: mere presence is true -->
<my-toggle active></my-toggle>
```

### SSR with Static Props

Static props are automatically passed through SSR via `injectProps()`:

```ts
// During SSR, the renderer calls:
// element.initial = 10   → set accessor → sig.value = 10
// element.step = 5       → set accessor → sig.value = 5
// element.label = 'Score' → set accessor → sig.value = 'Score'

// Then element.render() sees the correct values.
```

## Signal Auto-Unwrap

Properties declared via `static props` install accessors that return the `PropSignal` object. In JSX expressions `{}`, this auto-unwraps:

| Context                      | Behaviour                                                  |
| ---------------------------- | ---------------------------------------------------------- |
| `{this.count}`               | Auto-unwrap via `valueOf()` → number                       |
| `{this.count + 1}`           | Auto-unwrap via `valueOf()` → `42 + 1`                     |
| `` `${this.count}` ``        | Auto-unwrap via `Symbol.toPrimitive('string')`             |
| `JSON.stringify(this.count)` | ❌ Does NOT unwrap — use `this.count.value`                |
| `Array.isArray(this.items)`  | ❌ Does NOT unwrap — use `Array.isArray(this.items.value)` |
| `typeof this.count`          | Returns `"object"` — use `typeof this.count.value`         |

## Migration from @prop()

| Before (v0.23)                                         | After (v0.24.1)                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| `@prop({ type: String }) name`                         | `static props = { name: String }`                                   |
| `@prop({ type: Number }) count`                        | `static props = { count: Number }`                                  |
| `@prop({ type: Boolean }) active`                      | `static props = { active: Boolean }`                                |
| `@prop({ type: Number, reflect: true, default: 5 }) x` | `static props = { x: { type: Number, default: 5, reflect: true } }` |
| `PropertyOptions` import                               | `PropDecl` / `PropType<D>` / `PropsFrom<P>` import                  |

1. Remove the `@prop()` decorator decorator import.
2. Add `static props = { ... }` with the equivalent declarations.
3. Update TypeScript types from `PropertyOptions` to `PropDecl`/`PropType`/`PropsFrom`.
4. Remove any `attribute` field — the attribute name is always the lowercased property name.
