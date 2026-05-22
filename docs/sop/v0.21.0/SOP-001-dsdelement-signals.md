# SOP-001: DsdElement + Signals Integration

> Version: v0.21.0 (Reactive DSD)
> Priority: P0
> Status: PLANNED
> Depends on: v0.20 Ocean-Island, @lessjs/signals, ADR-0039

## Objective

Make `DsdElement` the universal reactive base class. Currently DsdElement is
pure static DSD — components must imperatively manage their own DOM updates
(`this.shadowRoot!.innerHTML = ...`). Integrating Signals gives DsdElement
declarative, fine-grained reactivity without pulling in Lit, React, or any
framework runtime.

The result: `Ocean (80%)` components gain reactivity without leaving the
zero-framework DSD path.

## Design

### Current (v0.20)

```ts
class MyCounter extends DsdElement {
  #count = 0;
  render(): string {
    return `<button>${this.#count}</button>`;
  }
  // User must manually call this.render() or innerHTML on every update
}
```

### Target (v0.21)

```ts
class MyCounter extends DsdElement {
  #count = signal(0);
  render(): string {
    return html`
      <button @click="${() => this.#count.value++}">${this.#count}</button>
    `;
  }
  // Signals auto-track dependencies. Only <button> text re-renders on click.
}
```

### Architecture

```
DsdElement.render() calls signal.get() → registers dependency
    ↓
signal.set(value) → notifies DsdElement
    ↓
DsdElement dispatches microtask → re-renders only affected DOM node
    ↓
Fine-grained update: no virtual DOM, no full re-render
```

## Implementation Steps

### Phase 1: Signal-Aware Render

- [ ] `DsdElement` detects `render()` return type: `string` (static) | `TemplateResult` (signal-aware)
- [ ] `TemplateResult` stores: template strings array + signal values array
- [ ] `html` tagged template literal → wraps signal access into `TemplateResult`
- [ ] On signal change → re-render only the changed expression in the DSD template

### Phase 2: Template Literal Safety

- [ ] `html` escapes interpolated values by default (XSS prevention)
- [ ] `unsafeHTML()` escape hatch for trusted content
- [ ] Attribute binding: `html\`<div class=${signalValue}>\`` auto-sets attributes

### Phase 3: Event Binding

- [ ] `@click`, `@input`, `@submit` declarative event syntax in templates
- [ ] Events bound via DSD `hydrateEvents` mechanism (existing v0.20)
- [ ] Event handlers can call `signal.set()` for reactive updates

### Phase 4: Performance

- [ ] Microtask batching: multiple signal changes → single DOM update
- [ ] No virtual DOM — direct DOM mutation of changed nodes
- [ ] Benchmark: 1000 signal updates < 16ms (one frame)

## Key Decisions

| Decision                 | Rationale                                                    |
| ------------------------ | ------------------------------------------------------------ |
| `html` tag, not JSX      | Aligns with Lit/FAST ecosystem, zero build step              |
| Microtask batching       | Standard platform primitive, no scheduler needed             |
| Direct DOM mutation      | DSD guarantees the template is already in DOM; just patch it |
| Signal.get() in render() | Standard Signals pattern — auto-tracking via call stack      |

## Edge Cases

- Signal used in condition: `html\`${show ? signalA : signalB}\`` — re-track on re-render
- Signal used in loop: `html\`${items.map(i => html\`<li>${i.name}</li>\`)}\`` — per-item tracking
- Nested DsdElement: parent signal change → child re-render boundary
- Signal in attribute vs content: different DOM update paths
- Async signal resolution: `signal.value` is sync, no Promise unwrapping

## Non-Goals

- Do not implement a general-purpose reactivity system (Signals already exists)
- Do not add virtual DOM or diffing in Phase 1 (optional in SOP-003)
- Do not change the `render(): string` contract (TemplateResult extends the contract)
- Do not force Signals — static `render()` remains supported

## Verification

- `DsdElement` with signals re-renders on signal change
- Fine-grained: only changed expression updates in DOM
- No full re-render: sibling static content unchanged
- Microtask batching: 3 signal changes → 1 DOM update
- Event binding: `@click` handler calls `signal.set()` → re-render
- XSS: `<script>` in signal value is escaped by default
- Static render still works: `render(): string` path unchanged

## Related

- ADR-0039: DsdElement + Signals Reactive Architecture
- `@lessjs/signals`: Signal/SignalObject implementation
- ADR-0036: Ocean-Island Architecture
- SOP-002: Safe Templates
