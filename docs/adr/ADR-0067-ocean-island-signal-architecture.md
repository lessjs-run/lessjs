# ADR-0067: DSD-Native SSR/SSG Architecture — Ocean + Island Model with Signal-Native Hydration

> **Status**: ACCEPTED
> **Date**: 2026-05-31
> **Author**: Zhi (Architect), Qi (Delivery Director)
> **Supersedes**: ADR-0058 (Signal→DOM binding), ADR-0062 (DSD-first RDOM), ADR-0065 (Unified VNode), ADR-0066 (Signal-Native Hydration)
> **Architecture Doc**: [lessjs-architecture.md](../architecture/lessjs-architecture.md)
> **Target**: v0.28.0

---

## Context

### History

LessJS evolved incrementally from an SSG-only DSD framework through multiple architecture decisions:

1. **ADR-0058** (v0.26.1): Established signal→DOM direct binding. Replaced `effect(() => render())` VDOM cycle with per-prop `effect(el.setAttribute())`. But hydration path was never updated — `_walkAndBind` continued position-based matching.

2. **ADR-0062** (v0.26.1): Diagnosed two failure modes (Chromium DSD layout bug + structural signal access). Proposed `_layoutWorkaroundReRender` as layout fix. This hack destroyed signal→DOM effects created during hydration.

3. **ADR-0065** (v0.27.0): Attempted to unify VNode pipeline. Added `data-signal` SSR output and `signalRegistry`. But hydration code (`_walkAndBind`) was never replaced — markers were produced but never read.

4. **ADR-0066** (v0.27.0, proposed): Identified that `_walkAndBind` position-matching is the root architectural flaw. Proposed marker-driven hydration via `_hydrateSignals()`.

### Current State

After v0.27.0 cleanup:
- `_layoutWorkaroundReRender` deleted ✅
- `@lessjs/core/navigation` deleted ✅
- `Router.start()` unified SPA navigation ✅
- `data-signal` markers in SSR HTML ✅
- All template strings migrated to JSX ✅
- CSS hardcoded values → Open Props tokens ✅
- `less-search` rewritten as DsdElement ✅

**But the core hydration pipeline still uses `_walkAndBind` position matching.** Effects created during hydration are unreliable (alien-signals `effectScope` issue or call timing issue). Counter still stuck at 42 in deployed build.

### Discussion Summary (2026-05-31)

Full-day architecture discussion with architect Zhi established:

1. Signal should be the **sole source of truth** for all state
2. `render()` is called **exactly once** — at SSR time (build or request)
3. DSD is the **first frame** of signal state, not a separate system
4. Hydration = reading `data-signal` markers → creating effect bindings
5. Ocean (static) + Island (interactive) model separates zero-JS pages from signal-driven pages
6. SSG/SSR dual mode via same `renderToString()` — different call timing
7. SolidJS/Fresh/Astro comparison confirms DSD gives LessJS an architectural advantage

---

## Decision

### Ocean + Island Model

Every page is composed of two kinds of content:

| | Ocean | Island |
|---|---|---|
| **Has signals?** | ❌ | ✅ |
| **Client JS** | 0 KB | ~2 KB (alien-signals + hydration) |
| **Rendering** | Pure DSD HTML | DSD HTML + `data-signal` / `data-on` markers |
| **SSG** | Static HTML file | Static HTML file + client script |
| **SSR** | HTML per request | HTML per request + client script |

### Three Architecture Layers

```
Layer 3: DOM      — DSD HTML → real DOM → effect() → atomic update
Layer 2: Signal   — signal() / computed() / effect() — ONE source of truth
Layer 1: Component — DsdElement: render() once, _hydrateSignals() once
```

### Signal-Native Hydration

**DELETE**: `_walkAndBind()` (80 lines of position-matching + childNodes filtering)
**ADD**: `_hydrateSignals()` (40 lines of marker-driven effect binding)

```ts
_hydrateSignals():
  for el in root.querySelectorAll('[data-signal]'):
    effect(() => el.textContent = signal.value)

  for el in root.querySelectorAll('[data-on-click]'):
    el.addEventListener('click', handler)
```

### SSG/SSR Dual Mode

```
renderToString(vnode) → pure function (~250 lines)
  ├── Build time → SSG (static files → CDN)
  └── Request time → SSR (Hono → Deno Deploy / CF Workers)
```

### What Gets Deleted

| Code | Reason |
|---|---|
| `_walkAndBind()` | Position matching → marker matching |
| `effectScope` in hydration | Alien scope blocks effect firing |
| `_layoutWorkaroundReRender` | Layout fix → RAF offsetHeight |
| `@lessjs/core/navigation` | Hand-written nav → Router |
| `data-less-*` attributes | Brand prefix → `data-signal` / `data-on` |

---

## Consequences

### Positive

- **Correctness**: Signal→DOM bindings are explicit (data-signal attribute) rather than implicit (position index). No more "stuck at 42" bugs.
- **Simplicity**: `_hydrateSignals()` is 40 lines vs. `_walkAndBind`'s 80 lines. No childNodes filtering, no index alignment.
- **Zero-JS pages**: Ocean pages ship 0 KB client JS. Island pages ship ~2 KB.
- **SSR capability**: Same `renderToString()` for SSG and SSR. No new rendering engine needed.
- **Architecture clarity**: Three layers, clean separation, one source of truth (signal).

### Negative

- **Migration work**: All island components must call `registerSignal()` + add `data-signal`/`data-on` markers to JSX.
- **Show/For needed**: Conditional and list rendering need `Show`/`For` components (runtime DOM managers). Not in scope for v0.28.0 — keep current patterns with explicit effect() in the interim.
- **data-* protocol dependency**: Hydration relies on HTML attributes that must be correctly generated by `renderToString()`. SSR output must match CSR expectations.

### Risks

- **Alien-signals version**: Current 3.2.0. Effect tracking verified in isolation. Integration issue is in LessJS wrapper layer (`alien-engine.ts`), not in alien-signals itself.
- **Conditional rendering gap**: Until `Show` component is implemented, `{signal && <div>}` in JSX is evaluated at render time only (static). Workaround: always render the element, toggle visibility via CSS class + effect.
- **Cross-component signals**: Signals shared between components require context or event-based communication. DSD encapsulation (shadow DOM) makes this explicit — a feature, not a bug.

---

## Implementation

See [SOP-005 Signal-Native Hydration Migration](../sop/v0.28.0/SOP-005-signal-native-hydration.md) for step-by-step execution plan.

Full architecture documentation: [lessjs-architecture.md](../architecture/lessjs-architecture.md)
