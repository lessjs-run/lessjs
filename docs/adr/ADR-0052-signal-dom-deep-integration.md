# ADR-0052: Signal-DOM Deep Integration — Reactive Property Binding

> ⚠️ **SUPERSEDED** by [ADR-0057](../adr/0057-jsx-signal-component-model.md) (v0.24.1)
> The `@prop()` decorator approach has been replaced by `static props` class fields.

- Status: SUPERSEDED (Replaced by ADR-0057 in v0.24.1)
- Date: 2026-05-27
- Supercedes: Extends ADR-0039 (DsdElement + Signals Reactive)
- Applies to: v0.24.0+

## Context

ADR-0039 established the architectural intent: DsdElement integrates with
`@openelement/signal` to enable zero-framework reactivity. The actual implementation
achieved the "html template with Signal interpolation" half — Signals can be
interpolated into templates and trigger microtask-batched re-renders.

However, the deep evaluation report (2026-05-27) exposed that the integration
is **unfinished**:

1. **Only 1 UI component uses Signal** (`less-theme-toggle`). The other 9
   components rely on `attributeChangedCallback` + manual `_syncDOM()`.
2. **Signal changes do not automatically update the DOM.** Components must
   manually call `this.update()` after any signal mutation.
3. **No reactive property system.** Every attribute must be manually declared
   in `observedAttributes`, handled in `attributeChangedCallback`, stored in
   a private field, and synchronized to the DOM via `_syncDOM()`. This is
   4 separate code sites per property.

Current component code (10+ lines per property):

```ts
static get observedAttributes() { return ['variant']; }
attributeChangedCallback(name: string, _old: string | null, value: string | null) {
  if (name === 'variant') {
    this._variant = (value as Variant) || 'default';
    this._syncDOM();
  }
}
private _variant: Variant = 'default';
private _syncDOM() {
  const btn = this.shadowRoot!.querySelector('.btn');
  if (btn) { btn.setAttribute('data-variant', this._variant); }
}
```

The root cause is that ADR-0039 focused on the **rendering contract** (how
Signals appear in templates and trigger re-renders) but did not define the
**property-binding contract** (how component properties become signals and
how signal mutations automatically reach the DOM).

## Decision

**DsdElement gains a `@prop()` decorator for declaring reactive properties.
Changes to reactive properties automatically propagate to the DOM via signal
subscription — no manual `_syncDOM()` required.**

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│ DsdElement                                                │
│                                                            │
│  @prop() variant: string = 'default';  ← 1-line declare   │
│       │                                                    │
│       ▼                                                    │
│  ┌─────────────┐    ┌─────────────────────────────┐       │
│  │ _props Map   │ →  │ Signal<Variant>              │       │
│  │ 'variant'    │    │ .value = 'primary'           │       │
│  └─────────────┘    │ .subscribe(updateDOM)        │       │
│                      └─────────────────────────────┘       │
│                               │                            │
│  ┌────────────────────────────▼───────────────────────┐   │
│  │ render() {                                          │   │
│  │   return html`<button class=${classMap({            │   │
│  │     primary: this.variant === 'primary'             │   │  Auto-tracks
│  │   })}>Click</button>`;                              │   │  this.variant
│  │ }                                                    │   │  signal
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### `@prop()` Decorator API

```ts
import { DsdElement, html, prop } from '@openelement/runtime';

class LessButton extends DsdElement {
  @prop()
  variant: 'default' | 'primary' | 'ghost' = 'default';
  @prop({ type: Boolean })
  disabled = false;
  @prop({ attribute: 'aria-label' })
  ariaLabel = '';

  render() {
    return html`
      <button
        class="${classMap({
          'btn-primary': this.variant === 'primary',
          'btn-ghost': this.variant === 'ghost',
        })}"
        ?disabled="${this.disabled}"
        aria-label="${this.ariaLabel}"
        @click="${this._onClick}"
      >
        <slot></slot>
      </button>
    `;
  }
}
```

### Metadata & Configuration

```ts
export interface PropOptions<T = unknown> {
  /** Attribute name override (default: kebab-case of property name) */
  attribute?: string;
  /** Type coercion: String | Number | Boolean | Array | Object */
  type?: PropType;
  /** Reflect property changes back to the HTML attribute */
  reflect?: boolean;
  /** Custom converter: attribute value → property value */
  converter?: {
    fromAttribute?(value: string | null): T;
    toAttribute?(value: T): string | null;
  };
  /** Skip this property in observedAttributes (virtual property) */
  noAccessor?: boolean;
}

type PropType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ArrayConstructor
  | ObjectConstructor;
```

### Internal Implementation (within `dsd-element.ts`)

The decorator registers metadata on the class:

```ts
// dsd-element.ts — new ReactiveHost capability
class DsdElement extends HTMLElement implements ReactiveHost {
  // Existing signal subscription for template-level tracking
  subscribeTo(signal: ReadonlySignal<unknown>): void { ... }

  // NEW: reactive property infrastructure
  static _propMetadata: Map<string, InternalPropMeta> = new Map();

  constructor() {
    super();
    // For each @prop() declaration: create a Signal, install getter/setter
    for (const [name, meta] of (this.constructor as typeof DsdElement)._propMetadata) {
      const signal = createSignal(meta.defaultValue);
      this._props.set(name, signal);
      Object.defineProperty(this, name, {
        get: () => signal.value,
        set: (v) => { signal.value = v; this.requestReactiveUpdate(); },
      });
    }
  }

  // Tracks which properties changed since last render
  protected override requestReactiveUpdate(): void {
    if (!this._updateScheduled) {
      this._updateScheduled = true;
      queueMicrotask(() => this._performReactiveUpdate());
    }
  }
}
```

### Attribute ↔ Property Synchronization

1. **attribute → property** (on `attributeChangedCallback`): Parse attribute
   value using the declared `type` or `converter`, set the signal value.
2. **property → attribute** (if `reflect: true`): On signal change, serialize
   value using converter and call `setAttribute()`/`removeAttribute()`.

Boolean attribute special case: `?disabled=${this.disabled}` in templates
handles boolean attribute presence/absence automatically.

### Migration Path

```ts
// BEFORE (v0.23) — 10+ lines, manual
static get observedAttributes() { return ['variant', 'disabled']; }
private _variant: Variant = 'default';
private _disabled = false;
attributeChangedCallback(name, _old, value) {
  if (name === 'variant') { this._variant = value as Variant; this._syncDOM(); }
  if (name === 'disabled') { this._disabled = value !== null; this._syncDOM(); }
}

// AFTER (v0.24) — 2 lines, declarative
@prop() variant: Variant = 'default';
@prop({ type: Boolean }) disabled = false;
```

### Performance Considerations

- Property access (getter/setter) overhead: negligible (~1 function call vs field read)
- Signal subscription per property: each `@prop()` creates 1 signal. For a component
  with 10 properties, this is 10 signals — well within alien-signals' sweet spot.
- `queueMicrotask` batching: multiple property changes in the same synchronous block
  coalesce into a single re-render.

## Consequences

### Positive

- Property declaration reduces from 4 code sites to 1 line
- Type-safe: TypeScript infers the property type from the default value
- Automatic attribute ↔ property sync eliminates manual `_syncDOM()` patterns
- Every `@prop()` is a signal — composing with `html` templates auto-tracks
  changes and patches only the affected DOM nodes
- `attributeChangedCallback` becomes an opt-in escape hatch, not a requirement
- New components can be written in 3 lines: class declaration + `@prop()` declarations + `render()`

### Negative

- Adds TypeScript decorator dependency (`experimentalDecorators` or TC39 decorators)
- `Object.defineProperty` per-property increases per-instance initialization cost
  (mitigated by lazy initialization: defer until first access)
- Signal-per-property is ~50 bytes per property (acceptable up to 50+ properties)
- Breaking change for components that assume `observedAttributes` + private field pattern
  (migration is mechanical: replace 4 code sites with 1 `@prop()`)

### Neutral

- `render(): string` components are unaffected (opt-in, not forced)
- Existing `attributeChangedCallback` implementations continue to work
  (if both `@prop()` and manual `observedAttributes` exist, `@prop()` takes precedence)
- This does not replace the `html` template system — it complements it

## Comparison to Other Frameworks

| Framework             | Mechanism                                                      | Lines per property |
| --------------------- | -------------------------------------------------------------- | ------------------ |
| Lit                   | `@property()` decorator + `render()`                           | 1                  |
| FAST                  | `@attr` decorator + `html`                                     | 1                  |
| Stencil               | `@Prop()` decorator + JSX                                      | 1                  |
| Vanilla WC            | `observedAttributes` + `attributeChangedCallback` + manual DOM | 10+                |
| **LessJS (proposed)** | `@prop()` decorator + `html`                                   | **1**              |

## Related

- ADR-0039: DsdElement + Signals Reactive Architecture
- ADR-0051: Self-built `html` Template System Strengthening
- ADR-0053: Unified Error Handling Architecture
- `packages/signal/src/`: Signal engine facade over alien-signals
- `packages/core/src/dsd-element.ts`: DsdElement base class (~501 lines)
