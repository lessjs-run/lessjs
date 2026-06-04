# SOP-008: ReactiveHost Protocol — Explicit Signal Integration

> Version: v0.21.0
> Priority: P0
> Status: IMPLEMENTED (DOCUMENTATION CATCH-UP)
> Depends on: SOP-001 (DsdElement+Signals)
> Supercedes: Duck Typing via `isSignalLike()` checks in v0.21.0-alpha
> Audit Date: 2026-05-23

## Problem

In the initial v0.21.0-alpha, `DsdElement._subscribeTemplateSignals()` used Duck
Typing to detect Signal-like objects:

```ts
// Duck Typing approach (removed)
function isSignalLike(value: unknown): boolean {
  return value && typeof value === 'object' &&
    'value' in value &&
    typeof (value as any).subscribe === 'function';
}
```

This approach had several problems:

| Problem                              | Impact                                                    |
| ------------------------------------ | --------------------------------------------------------- |
| No type-safe contract                | Any object with `.value` + `.subscribe` passes check      |
| External signal libs guess interface | Not clear what methods DsdElement needs                   |
| No scheduling control                | Signal source directly calls callback, no batching hook   |
| Fragile to implementation details    | `.subscribe` signature change breaks integration silently |

## Decision

**Replace Duck Typing with an explicit `ReactiveHost` protocol.**

`DsdElement` declares `implements ReactiveHost` with two methods:

```ts
interface ReactiveHost {
  subscribeTo(source: { subscribe(fn: (value: unknown) => void): Unsubscribe }): Unsubscribe;
  requestReactiveUpdate(): void;
}
```

External signal libraries target this protocol instead of guessing internal APIs.

## Implementation

### Type Definition (`packages/core/src/types.ts`)

```ts
export interface ReactiveHost {
  /**
   * Subscribe to a reactive source. The host decides how to handle updates
   * (e.g. schedule a microtask-batched re-render).
   */
  subscribeTo(source: { subscribe(fn: (value: unknown) => void): Unsubscribe }): Unsubscribe;

  /**
   * Request a reactive update. Called by the reactive source on value change.
   * The host batches multiple requests via microtask queue.
   */
  requestReactiveUpdate(): void;
}
```

### DsdElement Implementation (`packages/core/src/dsd-element.ts`)

```ts
export class DsdElement extends _HTMLElement implements ReactiveHost {
  subscribeTo(source: { subscribe(fn: (value: unknown) => void): () => void }): () => void {
    let initial = true;
    const unsubscribe = source.subscribe(() => {
      if (initial) {
        initial = false;
        return;
      } // Skip initial subscription fire
      this.requestReactiveUpdate();
    });
    return unsubscribe;
  }

  requestReactiveUpdate(): void {
    this._scheduleReactiveUpdate();
  }
}
```

### Usage in Template Signal Subscription

```ts
// Before (Duck Typing):
for (const signal of collectTemplateSignals(result)) {
  const unsubscribe = signal.subscribe(() => this._scheduleReactiveUpdate());
  this._signalUnsubscribers.push(unsubscribe);
}

// After (Protocol):
for (const signal of collectTemplateSignals(result)) {
  const unsubscribe = this.subscribeTo(signal); // ← Protocol dispatch
  this._signalUnsubscribers.push(unsubscribe);
}
```

### Public API

```ts
// @openelement/core exports
export type { ReactiveHost, Unsubscribe } from './types.js';

// External use
import type { ReactiveHost } from '@openelement/core';

class CustomSignalLib {
  connect(host: ReactiveHost) {
    host.subscribeTo(this._source);
  }
}
```

## Step-by-Step Execution

### Step 1: Define Interface

- [x] Add `ReactiveHost` interface to `packages/core/src/types.ts`
- [x] Add `Unsubscribe` type alias
- [x] Document interface contract (two methods, batching semantics)

### Step 2: Implement in DsdElement

- [x] `DsdElement` declares `implements ReactiveHost`
- [x] `subscribeTo()` wraps signal subscription with initial-fire skip
- [x] `requestReactiveUpdate()` delegates to `_scheduleReactiveUpdate()`

### Step 3: Update Template Subscription

- [x] `_subscribeTemplateSignals()` calls `this.subscribeTo(signal)` instead of `signal.subscribe()`
- [x] No change to `isSignalLike()` — it's still used for signal **detection**, not subscription

### Step 4: Export from Core

- [x] `ReactiveHost` exported from `@openelement/core`
- [x] `Unsubscribe` exported from `@openelement/core`

### Step 5: Verify

- [x] `deno task typecheck` passes — DsdElement satisfies ReactiveHost contract
- [x] `deno task test` — 760 passed, no regression
- [x] `deno task build` — clean build

## Architecture Boundary

| Concern                    | Boundary                                                             |
| -------------------------- | -------------------------------------------------------------------- |
| Who detects signals?       | `isSignalLike()` — Duck Typing is acceptable for detection           |
| Who subscribes to signals? | `ReactiveHost.subscribeTo()` — Protocol is required for subscription |
| Who controls scheduling?   | `ReactiveHost.requestReactiveUpdate()` — Host owns batching policy   |
| External signal libs       | Target `ReactiveHost`, not internal `DsdElement` methods             |

## Exit Criteria

- [x] `ReactiveHost` interface defined and exported
- [x] `DsdElement` explicitly implements `ReactiveHost`
- [x] Template signal subscriptions use `subscribeTo()` protocol
- [x] All tests pass without regression
- [x] No Duck Typing for subscription dispatch

## Related

- SOP-001: DsdElement + Signals Integration
- ADR-0039: DsdElement + Signals Reactive Architecture
- `packages/core/src/types.ts` (ReactiveHost interface)
- `packages/core/src/dsd-element.ts` (implementation)
- Comprehensive review 2026-05-23: protocol implemented, docs were missing
