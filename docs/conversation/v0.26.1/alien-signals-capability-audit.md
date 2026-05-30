# alien-signals Capability Audit (v0.26.1)

> **Author**: general-purpose-2 (Framework Architect)\
> **Date**: 2026-05-30\
> **Scope**: alien-signals v3.2.1 + @lessjs/signals + @lessjs/core integration

---

## 1. alien-signals Primitives (complete list)

alien-signals v3.2.1 (located at `node_modules/.deno/alien-signals@3.2.1/`) is a **push-pull hybrid** reactive engine — 1.6KB minified — with a doubly-linked dependency graph (Link nodes connect producers ↔ consumers).

### 1.1 Public API (`index.mjs`)

| Export                                   | Signature                     | Description                                                                                                                                                                                |
| ---------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `signal<T>(initialValue: T)`             | `{ (): T; (value: T): void }` | Reactive state cell. Read with `s()`, write with `s(newValue)`. Equality check before propagation.                                                                                         |
| `computed<T>(getter: (prev?: T) => T)`   | `() => T`                     | Lazy derived computation. Receives previous value. Auto-tracks dependencies. Dirty-flag + lazy eval.                                                                                       |
| `effect(fn: () => void \| (() => void))` | `() => void`                  | Side effect. Runs immediately, auto-tracks deps. Return value treated as cleanup (runs on re-run or dispose). Returns dispose function.                                                    |
| `effectScope(fn: () => void)`            | `() => void`                  | Creates an "effect container" that groups child effects. Disposing the scope disposes all child effects at once. Returns dispose function.                                                 |
| `trigger(fn: () => void)`                | `void`                        | Creates a temporary subscriber (`flags: Watching(2)`), runs `fn()` to track all signal reads, then walks collected deps and propagates changes. Useful for async patterns or manual flush. |
| `startBatch()` / `endBatch()`            | `void` / `void`               | Transaction batching. `startBatch()` increments depth; `endBatch()` decrements and flushes queue at depth 0. Writes during batch defer notification.                                       |
| `getBatchDepth()`                        | `number`                      | Returns current batch nesting depth.                                                                                                                                                       |
| `getActiveSub()`                         | `ReactiveNode \| undefined`   | Returns the currently tracking subscriber (effect/computed being evaluated).                                                                                                               |
| `setActiveSub(sub?: ReactiveNode)`       | `ReactiveNode \| undefined`   | Sets the active subscriber. Returns previous value. Enables custom tracking contexts.                                                                                                      |
| `isSignal(fn)`                           | `boolean`                     | Checks if `fn` is a bound `signalOper`. Structural check via `fn.name === 'bound signalOper'`.                                                                                             |
| `isComputed(fn)`                         | `boolean`                     | Checks if `fn` is a bound `computedOper`.                                                                                                                                                  |
| `isEffect(fn)`                           | `boolean`                     | Checks if `fn` is a bound `effectOper`.                                                                                                                                                    |
| `isEffectScope(fn)`                      | `boolean`                     | Checks if `fn` is a bound `effectScopeOper`.                                                                                                                                               |

### 1.2 Internal System (`system.mjs` / `system.d.ts`)

```ts
export const enum ReactiveFlags {
  None = 0,
  Mutable = 1, // Node is alive / mutable
  Watching = 2, // Is tracking (effect/trigger)
  RecursedCheck = 4, // Currently recomputing
  Recursed = 8, // Was recursed during inner write
  Dirty = 16, // Needs recomputation
  Pending = 32, // Pending notification
}
// HasChildEffect = 64 — used internally
```

| Export                                                | Description                                                                              |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `createReactiveSystem({ update, notify, unwatched })` | Core graph factory. Returns `{ link, unlink, propagate, checkDirty, shallowPropagate }`. |
| `ReactiveNode`                                        | Interface: `{ deps?, depsTail?, subs?, subsTail?, flags: ReactiveFlags }`                |
| `Link`                                                | Doubly-linked edge: `{ version, dep, sub, prevSub, nextSub, prevDep, nextDep }`          |
| `ReactiveFlags`                                       | Enum (see above)                                                                         |

**Core algorithms:**

- `link(dep, sub, version)` — connects producer→consumer with dedup (same dep/sub/version skips)
- `unlink(link, sub)` — removes one edge, calls `unwatched(dep)` when last subscriber dropped
- `propagate(link, innerWrite)` — marks downstream dirty (depth-first, iterative)
- `checkDirty(link, sub)` — lazy-evaluates upstream deps, returns whether dependencies changed
- `shallowPropagate(link)` — notifies direct dependent effects (synchronous, no recursion)

**Evaluation flow (write → propagate → flush):**

```
signal(s, newValue)
  → propagate(s.subs, innerWrite)   // mark dirty downstream
    → notify(effect)                // collect effects into queued[]
      → endBatch() or auto-flush
        → flush()
          → run(effect)             // checkDirty, re-run fn, run cleanup
```

---

## 2. @lessjs/signals Wrapper

### 2.1 Architecture

```
@lessjs/signals
  ├── index.ts         → Public exports (signal, computed, effect, types)
  ├── framework.ts     → Singleton engine, binds signal/computed/effect
  ├── alien-engine.ts  → Adapts alien-signals API → .value syntax
  ├── engine.ts        → Legacy types + internal logger (archaeological)
  └── types.ts         → WritableSignal, ReadonlySignal, SignalEngine, Unsubscribe
```

### 2.2 What IS Exposed

| Export                                                                             | alien-signals mapping                       | Notes                                                                        |
| ---------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| `signal<T>(v)` → `{get value():T, set value(v), subscribe(fn)}`                    | `alienSig.signal(v)` → `{ ():T, (v):void }` | Uses `.value` getter/setter syntax. Calls alien `signalOper` on each access. |
| `computed<T>(fn)` → `{readonly value:T, subscribe(fn)}`                            | `alienSig.computed(fn)` → `() => T`         | Same adaptor pattern.                                                        |
| `effect(fn)` → `Unsubscribe`                                                       | `alienSig.effect(fn)` → `() => void`        | Wraps fn return as cleanup. Disposes alien effect + runs cleanup.            |
| `createAlienEngine(mod)`                                                           | Direct adapter factory                      | Takes an `AlienSignalsModule` shape.                                         |
| `createDefaultEngine()`                                                            | Uses `{signal:_s, computed:_c, effect:_e}`  | Standard LessJS engine.                                                      |
| Types: `Signal`, `WritableSignal`, `ReadonlySignal`, `SignalEngine`, `Unsubscribe` | —                                           | Shared protocol types.                                                       |

### 2.3 What is NOT Exposed (Hidden from LessJS users)

| alien-signals primitive                                      | Status in @lessjs/signals      | Impact                                        |
| ------------------------------------------------------------ | ------------------------------ | --------------------------------------------- |
| `effectScope` / `createRoot`                                 | **NOT exposed**                | No grouped-effect lifecycle management        |
| `getOwner` / `runWithOwner`                                  | **NOT exposed**                | No effect ownership context                   |
| `startBatch` / `endBatch`                                    | **NOT exposed**                | No transaction batching                       |
| `getBatchDepth`                                              | **NOT exposed**                | Cannot check batch state                      |
| `trigger`                                                    | **NOT exposed**                | No manual tracking/flush                      |
| `getActiveSub` / `setActiveSub`                              | **NOT exposed**                | Cannot implement `untrack` or custom contexts |
| `isSignal` / `isComputed` / `isEffect`                       | **NOT exposed**                | `isSignalLike` uses duck-typing instead       |
| `update(node)` / `notify(node)` / `unwatched(dep)` callbacks | Internal to alien only         | No custom primitive building                  |
| `ReactiveNode` / `Link`                                      | Type present in engine.ts only | Not in public API                             |

### 2.4 Key Architectural Details

**The `subscribe()` overhead:** Each `subscribe()` call creates a new alien-signals `effect()` internally:

```ts
// alien-engine.ts:47-49
subscribe(fn: (value: T) => void): () => void {
  const e = alienMod.effect(() => fn(s()));  // <-- extra effect per subscriber
  return () => e();
}
```

This means every subscriber (used by `isSignalLike` duck-type check) creates a full effect node in alien's reactive graph. Signal→DOM bindings in `applyProps` bypass this by calling alien `effect()` directly.

---

## 3. Current LessJS Signal Integration Points

### 3.1 `applyProps` — Signal→DOM Attribute Binding

**File**: `packages/core/src/jsx-render-dom.ts:140-186`

**Flow:**

```
applyProps(el, props, signal?)
  → for each (key, value) in props:
     1. Skip children, key, null
     2. ref callback → invoke directly
     3. on* handlers → addEventListener(signal?)
     4. if isSignalLike(value):
        → effect(() => { applyStaticProp(el, key, unwrapSignalLike(value.value)) })
        → if signal: signal.addEventListener('abort', dispose, {once:true})
     5. else: applyStaticProp(el, key, unwrapSignalLike(value))
```

**What it does well:**

- Fine-grained updates: only the bound attribute is touched on signal change
- `applyStaticProp` handles: style objects, className→class, htmlFor→for, booleans, strings
- No full re-render needed

**Problems:**

- Effect disposal tied to `AbortSignal` only — no scope-based cleanup
- `applyStaticProp` also calls `unwrapSignalLike` on style sub-values (line 105) — reads signals but doesn NOT create reactive bindings for them

### 3.2 `renderToDom` — Signal→TextNode Binding

**File**: `packages/core/src/jsx-render-dom.ts:211-219`

```ts
if (isSignalLike(node)) {
  const textNode = document.createTextNode(String(sig.value ?? ''));
  const dispose = effect(() => {
    textNode.textContent = String(sig.value ?? '');
  });
  if (signal) signal.addEventListener('abort', dispose, { once: true });
  return textNode;
}
```

Creates a TextNode that updates reactively. Same disposal pattern (AbortSignal only).

### 3.3 `Show` and `For` Control Flow

**File**: `packages/core/src/jsx-render-dom.ts:237-295`

Both `<show when={sig}>` and `<for each={sig}>` use `effect(swap)` + `effect(reconcile)`. These are full re-renders (remove all children, re-render from scratch). Disposal via AbortSignal.

### 3.4 `signal-context` — Cross-Component Context

**File**: `packages/core/src/signal-context.ts`

**Architecture:**

- Global `Map<symbol, signal>` holds the "source of truth" signal per context key
- `provideContext(host, ctx, value)` writes to:
  1. The central signal (line 34-35)
  2. A symbol property on the host element (line 37)
- `consumeContext(host, ctx)` walks up parentElement/shadowRoot.host, finds symbol value
  1. Returns a **new signal** created from the found value snapshot (line 48)

**Critical issue**: Consumers get a **dead copy**. When `provideContext` sets the central signal (line 34-35), existing consumers hold their own independent signal — they never see the update.

### 3.5 `_walkAndBind` — DSD Hydration Event Binding

**File**: `packages/core/src/dsd-element.ts:344-369`

```ts
private _walkAndBind(parent, vnode): void {
  const vChildren = vnode.children;
  const domChildren = Array.from(parent.children);
  for (let i = 0; i < Math.min(domChildren.length, vChildren.length); i++) {
    if (typeof vChild === 'object' && 'props' in vChild) {
      applyProps(domChild, vChild.props);  // <-- NO AbortSignal!
      this._walkAndBind(domChild, vChild);
    }
    // Text children (strings, numbers) are SKIPPED
  }
}
```

**Problems:**

1. **No AbortSignal context** (line 362): `applyProps(domChild, vChild.props)` is called without the third argument → effects from signal props cannot be cleaned up
2. **Text children skipped**: DSD text nodes with signal content get no reactive binding

### 3.6 `_layoutWorkaroundReRender` — DSD Layout Fix

**File**: `packages/core/src/dsd-element.ts:326-339`

After `_walkAndBind`, this replaces the entire shadow DOM with fresh DOM from `renderToDom()`. This:

- Creates a new `AbortController` for the fresh render (effects created here CAN be cleaned up)
- **Leaks** all effects created by the preceding `_walkAndBind` (from line 304)

### 3.7 DsdElement Signal Lifecycle

**File**: `packages/core/src/dsd-element.ts`

| Method                          | What it does                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `_disposeTemplateRuntime()`     | Aborts `_templateAbortController` → cleans up effects from `_renderIntoShadowRoot`      |
| `_disposeSignalSubscriptions()` | Empties `_signalUnsubscribers[]` — **array is never populated by core code**            |
| `subscribeTo(source)`           | ReactiveHost protocol: subscribes to external signal, triggers full re-render on change |
| `requestReactiveUpdate()`       | Full re-render via `_renderIntoShadowRoot()`                                            |
| `#params`                       | Route params signal (always active, never disposed)                                     |

---

## 4. Gaps Found

### G1: Effect Memory Leak in DSD Path (CRITICAL)

**Location**: `dsd-element.ts:304, 344-369`

The DSD hydration path creates effects via `_walkAndBind` → `applyProps(domChild, vChild.props)` **without** an AbortSignal. These effects:

- Track signal changes forever (until page unload)
- Are never disposed on component disconnect
- Duplicate effects after each render cycle (prev _walkAndBind effects + fresh _layoutWorkaroundReRender effects)

**Affected scenario**: Any DSD-pre-populated component with signal-valued props.

**Severity**: Each signal prop on each element in the tree leaks one effect. On a page with 10 components × 5 signal props each, that's 50 leaked effects per page navigation.

### G2: consumeContext Returns Dead Copy (BUG)

**Location**: `signal-context.ts:40-56`

`consumeContext()` walks the DOM tree, finds a value stamped on a host element, then creates a **new `signal(v)`** with that value. This new signal has no connection to the provider's central signal.

When `provideContext()` writes `(s as { value: T }).value = value` (line 35), it updates the central Map signal. But consumers each have their own independent signal copy — they never see the update.

**Fix options:**

1. Return the central signal directly instead of creating a copy (but consumers could `.value =` it)
2. Create a `computed(() => centralSignal.value)` so consumers track the provider reactively
3. Don't use a signal at all — return a read-only getter that walks DOM on each access

### G3: DSD Text Binding Missing (BUG)

**Location**: `dsd-element.ts:358-367`

The `_walkAndBind` method only processes children with `props` objects. String/number VNode children are skipped entirely:

```ts
if (typeof vChild === 'object' && vChild !== null && 'props' in vChild) {
  // Element with props — bind events + signal props
} // else: text/string child — skipped!
```

If a VNode child is a signal (detected by `isSignalLike`), the text content won't get a reactive binding. This works in CSR because `renderToDom` handles it via `effect()` on line 214, but the DSD path never calls `renderToDom` for individual text children — it re-renders the whole tree after the walk via `_layoutWorkaroundReRender`.

**Impact**: DSD text nodes are set once with static values during the initial render → re-render cycle. They won't update reactively on signal change.

### G4: No Effect Scope / Component-Level Cleanup (DESIGN GAP)

**Location**: `@lessjs/signals` (framework layer)

alien-signals `effectScope()` groups child effects for batch disposal. LessJS doesn't expose this. Each component currently relies on:

- `AbortSignal` listeners (brittle, optional parameter)
- `_signalUnsubscribers[]` array (unused by core)
- `_templateAbortController` (only covers `_renderIntoShadowRoot` effects)

An effect scope per component instance would:

- Automatically track all effects created during `render()` / `_walkAndBind`
- Dispose all effects on `disconnectedCallback()` with a single `scope()`
- Eliminate manual tracking

### G5: No Batching for Multi-Prop Updates (DESIGN GAP)

**Location**: `@lessjs/signals` (framework layer)

When multiple signal-valued props change in the same synchronous block, each triggers its own `effect()` execution + DOM update immediately. alien-signals `startBatch()`/`endBatch()` defer notifications until the batch ends.

**Example problem:**

```ts
// Two effects fire separately, two DOM writes
props.signalA.value = 1; // effect fires → setAttribute("data-a", "1")
props.signalB.value = 2; // effect fires → setAttribute("data-b", "2")
```

With batching, both DOM writes would be batched into one flush.

### G6: No `untrack` for Non-Reactive Reads (DESIGN GAP)

**Location**: `@lessjs/signals` (framework layer)

Sometimes code needs to read a signal value without creating a dependency. alien-signals doesn't have a built-in `untrack()` but it CAN be implemented via `setActiveSub(undefined)` / restore. The TC39 proposal includes `untrack` as a first-class primitive.

LessJS's `engine.ts:44-45` defines `untrack` in the `SignalEngineNamespace.subtle` interface, but it's never implemented or exposed.

---

## 5. What alien-signals Offers That We're NOT Using

### 5.1 `effectScope` — Grouped Effect Lifecycle (HIGH VALUE)

```ts
// alien-signals
const dispose = effectScope(() => {
  effect(() => {/* child 1 */});
  effect(() => {/* child 2 */});
  // ...
});
dispose(); // disposes both effects
```

**Use in LessJS**: Each component instance could create one scope in `connectedCallback()` and dispose it in `disconnectedCallback()`. All effects created during render, DSD walk, and signal→DOM binding would be auto-cleaned.

### 5.2 `startBatch` / `endBatch` — Transaction Batching (HIGH VALUE)

```ts
startBatch();
signalA.value = newA; // deferred
signalB.value = newB; // deferred
signalC.value = newC; // deferred
endBatch(); // flush all at once
```

**Use in LessJS**: Batch multi-prop updates (e.g., route changes, theme toggles, form resets). Reduce DOM thrash.

### 5.3 `trigger` — Manual Tracking (MEDIUM VALUE)

```ts
trigger(() => {
  // Track all signal reads inside this callback
  // Then propagate changes to their subscribers
});
```

**Use in LessJS**: Async patterns (fetch-then-update), WebSocket handlers, or any code that runs outside the normal effect tracking lifecycle.

### 5.4 `setActiveSub` — Custom Tracking Contexts (MEDIUM VALUE)

```ts
const prev = setActiveSub(customSub);
// reads here will link to customSub
setActiveSub(prev);
```

**Use in LessJS**: Implement `untrack()` (set to undefined), custom reactive primitives, or debugging utilities.

### 5.5 `getActiveSub` — Current Subscriber Access (LOW VALUE)

```ts
const current = getActiveSub();
// Know if we're inside an effect/computed
```

**Use in LessJS**: Warnings when signal is written outside of reactive context, conditional behavior based on tracking state.

### 5.6 `isSignal` / `isComputed` / `isEffect` — Structural Type Guards (LOW VALUE)

```ts
if (isSignal(fn)) { /* ... */ }
```

**Use in LessJS**: Replace duck-typing in `isSignalLike` with structural checks. More reliable (won't false-positive on plain `{value, subscribe}` objects).

### 5.7 `ReactiveFlags` Enum (LOW VALUE)

Direct access to node flags for debugging or custom node types.

### 5.8 `createReactiveSystem` — Custom Reactive Graph (LOW VALUE)

The internal system exports `{link, unlink, propagate, checkDirty, shallowPropagate}`. Could build custom reactive primitives (e.g., lazy computed, write-through proxy) on top of alien's graph.

---

## Summary

| Category            | Count | Severity                                                               |
| ------------------- | ----- | ---------------------------------------------------------------------- |
| Bugs found (G1-G3)  | 3     | CRITICAL: G1 memory leak, G2 dead context, G3 missing DSD text binding |
| Design gaps (G4-G6) | 3     | MEDIUM: scope-based cleanup, batching, untrack                         |
| Unused primitives   | 8     | LOW-HIGH: effectScope, batching = high; guards = low                   |

**Top 3 Action Items:**

1. **Fix G1** — Add AbortSignal/effectScope to `_walkAndBind` cleanup path
2. **Fix G2** — Change `consumeContext` to return a live signal (computed or central signal)
3. **Fix G3** — Handle text/signal children in `_walkAndBind` with reactive TextNode binding
