# Signal VNode Effect — `effect()` in Reactive Rendering

Status: v0.24.3\
Scope: `DsdElement._renderIntoShadowRoot()` — alien-signals `effect()` for VNode reactivity

## Why effect() Was Needed

### Background: TemplateResult Had It

In the pre-v0.24.1 era, `DsdElement` used the `html` tagged template DSL and `TemplateResult`. The signal tracking story was:

1. `_subscribeTemplateSignals(result)` — called after rendering a `TemplateResult`.
2. Collected all `SignalLike` values from the template's `values` array.
3. Subscribed to each via `ReactiveHost.subscribeTo()`.
4. On signal change, triggered `_scheduleReactiveUpdate()` → `_patchBindings()`.
5. `_patchBindings()` queried `[data-less-b="N"]` markers and patched only text content.

This was a **fine-grained patch model**: track each signal, patch only the affected DOM nodes.

### The Gap: VNode Had Nothing

When v0.24.1 introduced JSX + VNode (replacing `html` + `TemplateResult`), the fine-grained patch model could not apply:

- VNodes are a **pure data tree** — no binding markers, no `data-less-b` attributes.
- `renderToDom()` creates **real DOM nodes** with `addEventListener` for event handlers.
- There is no `values` array to enumerate signals from.

Initial v0.24.1 through v0.24.2 rendered VNodes once (on `connectedCallback`) but had **no reactive re-render**. Signal changes inside `render()` were invisible to the framework.

### The Solution: alien-signals effect()

v0.24.3 wraps the VNode render path in an alien-signals `effect()`, leveraging auto-tracking:

```ts
this._vnodeEffectDispose = effect(() => {
  const updated = this.render();
  if (!isVNode(updated)) return;
  // DOM update — full re-render (no fine-grained patch)
  if (this._templateAbortController) {
    this._templateAbortController.abort();
  }
  this._templateAbortController = new AbortController();
  while (this.shadowRoot!.firstChild) {
    this.shadowRoot!.removeChild(this.shadowRoot!.firstChild);
  }
  this.shadowRoot!.appendChild(
    renderToDom(updated, this._templateAbortController.signal),
  );
});
```

## How alien-signals effect Auto-Tracking Works

alien-signals uses a **push-pull hybrid** architecture (1.6 KB gzipped, used by Vue 3.6 core and XState):

1. **Phase 1 — Track**: When `effect(fn)` executes `fn`, it enters a tracking scope. Every signal `.value` read inside `fn` is automatically registered as a dependency.

2. **Phase 2 — Push**: When any tracked signal's value changes, alien-signals marks the effect as dirty and pushes a notification.

3. **Phase 3 — Pull**: The effect re-executes `fn`. During re-execution, new signal dependencies are collected and old ones are cleaned up (dynamic dependency tracking).

This means **no manual subscription management** — the `render()` method simply reads signal values naturally, and alien-signals handles the dependency graph:

```tsx
class CounterElement extends DsdElement {
  count = signal(0);
  label = signal('Counter');

  render() {
    // Both count and label are auto-tracked by the effect.
    // Changing either triggers a re-render.
    return (
      <div>
        <span>{this.label}:</span>
        <span>{this.count}</span>
      </div>
    );
  }
}
```

## DsdElement._renderIntoShadowRoot() Flow

The full flow within `_renderIntoShadowRoot()`:

```
_renderIntoShadowRoot()
  │
  ├─ 1. _disposeTemplateRuntime()
  │     └─ Abort previous AbortController (clean event listeners)
  │
  ├─ 2. _disposeSignalSubscriptions()
  │     └─ Dispose previous effect + signal subscribers
  │
  ├─ 3. const result = this.render()
  │
  ├─ 4. if (isVNode(result))
  │     │
  │     ├─ 4a. Clear shadow DOM
  │     │      while (shadowRoot.firstChild) removeChild(...)
  │     │
  │     ├─ 4b. Initial DOM render
  │     │      this._templateAbortController = new AbortController()
  │     │      dom = renderToDom(result, signal)
  │     │      shadowRoot.appendChild(dom)
  │     │
  │     └─ 4c. Create reactive effect
  │            this._vnodeEffectDispose = effect(() => {
  │              // Same clear + renderToDom pattern for each change
  │            })
  │
  ├─ 5. else if (isTemplateResult(result))
  │     └─ Legacy: string innerHTML + _bindTemplateRuntime + _subscribeTemplateSignals
  │
  └─ 6. else if (typeof result === 'string')
        └─ Static: shadowRoot.innerHTML = result
```

### Step-by-Step for VNode Path

#### Step 4a: Clear shadow DOM

```ts
while (this.shadowRoot.firstChild) {
  this.shadowRoot.removeChild(this.shadowRoot.firstChild);
}
```

Removes all existing child nodes. This includes the previous `renderToDom()` output and any user-added DOM. Rationale: full re-render is simpler and more predictable than diffing.

#### Step 4b: Initial DOM render

```ts
this._templateAbortController = new AbortController();
const dom = renderToDom(result, this._templateAbortController.signal);
this.shadowRoot.appendChild(dom);
```

`renderToDom()` creates real DOM nodes:

- HTML elements via `document.createElement()`.
- SVG elements via `document.createElementNS()`.
- Text nodes via `document.createTextNode()` (auto-unwrapping signals).
- Event handlers via `addEventListener(type, fn, { signal })`.

The `AbortController.signal` passed to `addEventListener` ensures all event listeners are automatically removed when the controller is aborted.

#### Step 4c: Create reactive effect

```ts
this._vnodeEffectDispose = effect(() => {
  const updated = this.render();
  if (!isVNode(updated)) return;
  if (this._templateAbortController) {
    this._templateAbortController.abort();
  }
  this._templateAbortController = new AbortController();
  while (this.shadowRoot!.firstChild) {
    this.shadowRoot!.removeChild(this.shadowRoot!.firstChild);
  }
  this.shadowRoot!.appendChild(
    renderToDom(updated, this._templateAbortController.signal),
  );
});
```

The effect closure:

1. Calls `this.render()` → auto-tracks all signal reads.
2. Aborts the previous `AbortController` → removes old event listeners.
3. Creates a new `AbortController` for new event listeners.
4. Clears old DOM.
5. Creates and appends new DOM via `renderToDom()`.

## _vnodeEffectDispose Lifecycle

The effect dispose function (`_vnodeEffectDispose`) is managed through two key paths:

### Creation

Set in `_renderIntoShadowRoot()`:

```ts
this._vnodeEffectDispose = effect(() => { ... });
```

### Disposal — Manual (Re-render)

`_renderIntoShadowRoot()` calls `_disposeSignalSubscriptions()` at the top:

```ts
private _disposeSignalSubscriptions(): void {
  if (this._vnodeEffectDispose) {
    this._vnodeEffectDispose();
    this._vnodeEffectDispose = undefined;
  }
  // ... also disposes TemplateResult signal subscribers
}
```

This means every call to `update()` or `requestUpdate()` disposes the old effect before creating a new one.

### Disposal — Automatic (disconnectedCallback)

```ts
disconnectedCallback(): void {
  this._disposeTemplateRuntime();
  this._disposeSignalSubscriptions();
  disposeProps(this);
  disposeStaticProps(this);
}
```

When the element is removed from the DOM, all effects are cleaned up. No memory leaks.

### Disposal — SSR Safety

The effect is **never created during SSR**. `_renderIntoShadowRoot()` is only called from `_hydrateOrRender()` which is only called from `connectedCallback()` — and `connectedCallback()` only fires in browser environments. SSR uses `renderToString()` directly.

## Full DOM Re-render vs Fine-Grained Patch

### Full DOM Re-render (VNode + effect)

**How it works**: On each signal change, destroy all DOM and recreate.

| Pro                                  | Con                                         |
| ------------------------------------ | ------------------------------------------- |
| Simple — no diff algorithm           | Loses DOM state (focus, scroll, input text) |
| Predictable — output is always fresh | Higher per-update cost for large trees      |
| No binding marker overhead           | CSS transitions / animations restart        |
| Works with any DOM structure         | Not suitable for high-frequency updates     |

### Fine-Grained Patch (TemplateResult + _patchBindings)

**How it works**: Query `[data-less-b="N"]` markers and update only text content.

| Pro                                        | Con                                  |
| ------------------------------------------ | ------------------------------------ |
| Preserves DOM state (focus, scroll, input) | Requires binding markers in template |
| Lower per-update cost (patch, not replace) | Only patches text — not attributes   |
| CSS transitions continue smoothly          | Template DSL only, not JSX           |

### Trade-off Rationale

The full re-render approach was chosen for VNodes because:

1. **Components are the unit of rendering**. openElement components tend to be small (a counter, a card, a form field). Full re-render of a small shadow DOM is fast.

2. **JSX trees are pure data**. There are no binding markers to query-and-patch, and retrofitting them into `renderToDom()` output would require either a virtual DOM diff or marker injection — both of which add complexity.

3. **Simplicity wins for correctness**. Full re-render guarantees the DOM exactly matches `render()` output. No stale nodes, no missed updates, no "patch didn't cover this edge case" bugs.

4. **Preserving DOM state is a future concern**. For form inputs, uncontrolled components, or animations, a future `key`-based reconciliation (using the existing `VNode.key` field) could preserve nodes across renders. See [Future: Keyed Reconciliation](#future-keyed-reconciliation).

## Error Handling in Effects

The alien-signals `effect()` wrapper in `@openelement/signals` includes cleanup-safe error handling:

```ts
effect(fn: () => void | (() => void)) {
  let cleanup: (() => void) | void;
  const e = alienMod.effect(() => {
    try {
      cleanup?.();
    } catch { /* swallow cleanup errors */ }
    cleanup = fn() as (() => void) | void;
  });
  return () => {
    try {
      cleanup?.();
    } catch { /* swallow cleanup errors */ }
    e();
  };
}
```

Key behaviours:

1. **Cleanup errors are swallowed**. If the previous effect's cleanup (`AbortController.abort()` or similar) throws, it doesn't prevent the new effect from starting.

2. **Effect errors propagate**. If `this.render()` or `renderToDom()` throws inside the effect, the error propagates to alien-signals. The effect is not disposed — subsequent signal changes will retry.

3. **Dispose swallows cleanup errors**. When disposing the effect (via `_vnodeEffectDispose()`), both the cleanup function and the alien-signals dispose are called, each with error swallowing.

### Practical Implications

```tsx
class BuggyElement extends DsdElement {
  count = signal(0);

  render() {
    if (this.count.value === 3) {
      throw new Error('Cannot render count=3');
    }
    return <div>Count: {this.count}</div>;
  }
}
```

When `count` reaches 3:

- The effect throws → error logged to console.
- The DOM remains in its last-good state (count=2).
- When `count` changes to 4, the effect re-executes and recovers.

This is **not** the same as an `ErrorBoundary` — it's a best-effort recovery pattern. For production, consider wrapping `render()` in a try/catch and returning fallback UI.

## Performance Considerations

### When Full Re-render is Acceptable

| Scenario                                | Per-update cost    | Recommendation                |
| --------------------------------------- | ------------------ | ----------------------------- |
| Small component (< 50 DOM nodes)        | < 1ms              | ✅ Use VNode + effect freely  |
| Medium component (50–200 DOM nodes)     | 1–5ms              | ✅ OK for most use cases      |
| Large component (200–1000 DOM nodes)    | 5–20ms             | ⚠️ Profile first              |
| Very large component (> 1000 DOM nodes) | 20ms+              | ❌ Consider splitting         |
| High-frequency updates (> 10/sec)       | Cumulative cost    | ❌ Consider manual DOM update |
| Form inputs / controlled components     | Loses focus/cursor | ❌ Use uncontrolled or keyed  |

### Mitigation Strategies

1. **Split large components**. Instead of one large component with many signals, split into smaller components. Each child component gets its own smaller shadow DOM and effect scope.

2. **Debounce rapid updates**. For input-driven reactivity (search-as-you-type), debounce the signal write:

   ```ts
   #debounceTimer = 0;
   onInput(e: Event) {
     clearTimeout(this.#debounceTimer);
     this.#debounceTimer = setTimeout(() => {
       this.query.value = (e.target as HTMLInputElement).value;
     }, 150);
   }
   ```

3. **Use derived signals**. `computed()` avoids re-rendering when the derived value hasn't changed:

   ```ts
   items = signal([...]);
   isEmpty = computed(() => this.items.value.length === 0);
   // Changing items only re-renders if isEmpty actually toggles.
   ```

4. **Avoid signal reads in hot paths**. If a signal is read but the value doesn't affect the DOM, read it outside `render()` or cache it.

### Effect Batching

alien-signals batches effect executions within the same microtask. If two signals change in the same synchronous block, the effect runs once:

```ts
// Both changes are batched — single re-render
this.firstName.value = 'Hello';
this.lastName.value = 'World';
// → effect runs once with both values
```

## Future: Keyed Reconciliation

The `VNode.key` field (`key?: string | number`) is reserved for future keyed reconciliation. When implemented, components could preserve DOM nodes across re-renders when the key matches:

```tsx
// Future: keyed list items preserve DOM state
<ul>
  {this.items.value.map((item) => <li key={item.id}>{item.name}</li>)}
</ul>;
```

This is **not yet implemented** in v0.24.3. The `key` field is currently ignored by `renderToDom()` and `renderToString()`.

## Comparison: effect() vs _subscribeTemplateSignals()

|                    | effect() (VNode)                      | _subscribeTemplateSignals (TemplateResult) |
| ------------------ | ------------------------------------- | ------------------------------------------ |
| Signal tracking    | Auto (alien-signals push-pull)        | Manual (collect + subscribe)               |
| Subscription model | Implicit (reads inside fn)            | Explicit (ReactiveHost.subscribeTo)        |
| Update strategy    | Full DOM re-render                    | Fine-grained text patch                    |
| DOM preservation   | ❌ Cleared each update                | ✅ Only text nodes patched                 |
| Dependency cleanup | Auto (dynamic dependency tracking)    | Manual (unsubscribe array)                 |
| Error handling     | Swallow cleanup errors, retry on next | Error in patch → leave DOM as-is           |
| Code overhead      | 1 effect() call                       | Signal collection + subscribe + patch      |
| Suited for         | Component-level reactive UI           | Template-level text interpolation          |
