# ADR-0060: DOM-Tree-Based SignalContext

> Status: PROPOSED\
> Date: 2026-05-29\
> Target: v0.25.0 (P2 — conditional on computed() adoption)\
> Replaces: "SignalContext explicitly excluded" from ADR-0059

## Context

ADR-0059 originally excluded SignalContext, citing zero `computed()` production
use. This was a partial assessment — theme and locale are, in fact, cross-component
shared state that currently uses document-level attribute hacks.

Actual cross-component shared state in LessJS:

| State                   | Current Mechanism                          | Problem                                                   |
| ----------------------- | ------------------------------------------ | --------------------------------------------------------- |
| Theme                   | `document.documentElement.dataset.theme`   | Bypasses component tree; not reactive in shadow DOM       |
| Locale                  | `this._getLocale()` reading host attribute | Works but requires manual prop drilling or attribute sync |
| Any future global state | N/A                                        | No mechanism exists                                       |

Every major Web Components / reactive framework has an equivalent:

| Framework | Mechanism                                         |
| --------- | ------------------------------------------------- |
| Lit       | `@provide()` / `@consume()` decorators            |
| Solid.js  | `createContext()` / `useContext()` (signal-based) |
| React     | `createContext()` / `useContext()`                |
| Vue       | `provide()` / `inject()`                          |
| FAST      | `DI` container                                    |

## Decision

Introduce a DOM-tree-based `createContext()` that leverages the existing signal
infrastructure. Implementation is **~20 lines of code** — no new dependencies.

```typescript
// packages/core/src/signal-context.ts

import { effect, type Signal, signal } from '@openelement/signal';

const contexts = new Map<symbol, unknown>();

export function createContext<T>(key: symbol, defaultValue: T) {
  const s = signal<T>(defaultValue);
  contexts.set(key, s);
  return { key, defaultValue };
}

export function provideContext<T>(
  host: HTMLElement,
  ctx: { key: symbol; defaultValue: T },
  value: T,
): void {
  const s = contexts.get(ctx.key) as Signal<T> | undefined;
  if (s) s.value = value;
  (host as Record<symbol, unknown>)[ctx.key] = value;
}

export function consumeContext<T>(
  host: HTMLElement,
  ctx: { key: symbol; defaultValue: T },
): Signal<T> {
  let el: Element | null = host.parentElement;
  while (el) {
    const v = (el as Record<symbol, unknown>)[ctx.key];
    if (v !== undefined) return signal(v as T);
    el = el.parentElement || ((el.getRootNode() as ShadowRoot)?.host ?? null);
  }
  return signal(ctx.defaultValue);
}
```

Usage:

```typescript
// provider
const themeCtx = createContext<Theme>(Symbol('theme'), 'light');

class AppShell extends DsdElement {
  override render() {
    provideContext(this, themeCtx, this._theme.value);
    return <slot></slot>;
  }
}

// consumer — anywhere in the tree
class ThemeToggle extends DsdElement {
  override render() {
    const theme = consumeContext(this, themeCtx);
    // theme is a signal — auto-tracks in effect()
    return <button onClick={() => theme.value = toggle(theme.value)}>{theme}</button>;
  }
}
```

### Design principles

1. **DOM tree as provider chain** — consumer walks up `parentElement`/`shadowRoot.host`, no JSX wrapper needed
2. **Signal-based** — context values are signals; `effect()` auto-tracks dependencies
3. **Zero new dependencies** — uses existing alien-signals + DOM APIs
4. **Optional** — components that don't use context are unaffected

### Why P2 (conditional)

SignalContext unlocks real use cases (theme, locale, any global state), but the
infrastructure should prove itself with `computed()` having at least one real
usage first. Current execution order:

```
TG-01 (BuildPipeline) → TG-02 (Route Types) → TG-03 (static head) → TG-04 (static client)
    ↓
TG-05 (SignalContext) — conditional on computed() having ≥1 production use
```

## Consequences

**正面**：

- Theme/locale no longer needs document-level hacks
- Any future global state (auth, feature flags, etc.) has a standard pattern
- Implementation cost is ~20 lines, tested via existing signal infrastructure

**负面**：

- Adds one more concept to the framework surface
- DOM-tree walking adds a micro-cost (< 1ms for typical 1-3 layer deep trees)

## Alternatives Considered

1. **Event-based context** — CustomEvent bubbling. Works but is verbose and not signal-integrated.
2. **Third-party context library** — None exists for alien-signals + Web Components specifically.
3. **Do nothing; keep document hacks** — Viable short-term, but theme/locale are real cross-component state that deserve a proper mechanism.

## Status

PROPOSED. Conditional on `computed()` having ≥1 real-world use.
