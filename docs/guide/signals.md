# Signals Guide

openElement uses fine-grained reactive signals for client-side state management.
Signals are the reactive primitive layer used by the rendering pipeline and
island hydration system.

## Core API

### `signal(initialValue)` — Writable Signal

```tsx
import { signal } from '@openelement/signals';

const count = signal(0);

// Read
console.log(count.value); // 0

// Write
count.value = 1;

// Subscribe
const unsub = count.subscribe((v) => console.log('count:', v));
unsub(); // cleanup
```

### `computed(fn)` — Derived Signal

Automatically tracks dependencies and re-evaluates when they change:

```tsx
import { computed, signal } from '@openelement/signals';

const firstName = signal('Jane');
const lastName = signal('Doe');
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

console.log(fullName.value); // "Jane Doe"

firstName.value = 'John';
console.log(fullName.value); // "John Doe"
```

### `effect(fn)` — Side Effect

Runs whenever its dependencies change. Returns an unsubscribe function:

```tsx
import { effect, signal } from '@openelement/signals';

const count = signal(0);

const stop = effect(() => {
  console.log(`Count is: ${count.value}`);
});

count.value = 1; // logs: "Count is: 1"
stop(); // cleanup — effect no longer runs
```

The effect function can return a cleanup function:

```tsx
effect(() => {
  const handler = () => console.log('clicked');
  document.addEventListener('click', handler);
  return () => document.removeEventListener('click', handler);
});
```

### `effectScope(fn)` — Lifecycle Management

Groups effects for batch cleanup. Used internally by DsdElement for
component-level effect lifecycle:

```tsx
import { effect, effectScope, signal } from '@openelement/signals';

const count = signal(0);

const dispose = effectScope(() => {
  effect(() => console.log('a:', count.value));
  effect(() => console.log('b:', count.value * 2));
});

// Later: clean up ALL effects in one call
dispose();
```

## Using Signals in Components

### With DsdElement

```tsx
import { DsdElement } from '@openelement/core';
import { signal } from '@openelement/signals';

class MyCounter extends DsdElement {
  count = signal(0);

  render() {
    return (
      <button onClick={() => this.count.value++}>
        Count: {this.count.value}
      </button>
    );
  }
}
customElements.define('my-counter', MyCounter);
```

### With Islands

```tsx
import { defineIsland } from '@openelement/app';
import { signal } from '@openelement/signals';

const count = signal(0);

export default defineIsland(
  'my-counter',
  () => (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  ),
);
```

## Architecture

```
User Code
    ↓ signal() / computed() / effect()
Framework Layer (framework.ts)
    ↓ delegates to
Signal Engine (alien-engine.ts)
    ↓ wraps
alien-signals (npm package)
```

The engine is pluggable via the `SignalEngine` interface:

```typescript
interface SignalEngine {
  signal<T>(initialValue: T): WritableSignal<T>;
  computed<T>(fn: () => T): ReadonlySignal<T>;
  effect(fn: () => void | Unsubscribe): Unsubscribe;
}
```

## Batch Updates

Signal writes are automatically batched — multiple writes in the same
synchronous block trigger only one re-evaluation:

```tsx
const a = signal(1);
const b = signal(2);
const sum = computed(() => a.value + b.value);

// Only ONE re-evaluation of `sum`, not two
a.value = 10;
b.value = 20;
```

## Best Practices

- **Prefer `computed` over `effect`** for derived values. Effects are for side
  effects (DOM manipulation, network calls, logging).
- **Use `effectScope`** in component lifecycle to avoid memory leaks.
- **Don't read signals outside of reactive contexts** — the value won't be tracked.
- **Signals are synchronous** — `.value` always returns the current value.
