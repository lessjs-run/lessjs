# ADR-0081: VNode Event Unification

- Status: Accepted
- Date: 2026-06-04
- Target: v0.30.1
- Supersedes: _bindEvents() restoration proposals
- Related: ADR-0079, ADR-0080

## Context

Commit `7007fd1c` ("feat: freeze v0.30 architecture contract") inadvertently deleted
the `_bindEvents()` method from `dsd-element.ts`. This method scanned the shadow DOM for
declarative event attributes (`data-on-click="methodName"`, `data-on-input="methodName"`,
etc.) and bound component methods as event listeners. Its removal broke all island
interactivity on the production website.

Two event binding mechanisms currently exist in the codebase:

1. **VNode path** (`collectEventBindings` + `hydrateEventMarkers` in `event-hydration.ts`):
   handles JSX inline functions (`onClick={() => ...}`) serialized as `data-eid` markers
   during SSR. Works for compile-time known event handlers.

2. **Declarative path** (`_bindEvents()` — now deleted): handled `data-on-click="_open"`
   string attributes at runtime by looking up method names on the component instance.
   Required for islands that generate DOM via `data-signal-html` (string → innerHTML).

The design tension: islands like `less-search` construct search results as HTML strings
that are injected via `data-signal-html`. These strings contain `data-on-click="_close"`
attributes that are invisible to the VNode tree. Without `_bindEvents()`, these events
are never bound.

## Decision

**Do not restore `_bindEvents()`.** Adopt a unified VNode rendering path for all
dynamic content generation.

### Key change: `data-signal-render`

Add a new signal hydration directive to `DsdElement._hydrateSignals()`:

- `data-signal-render="signalName"` — the signal's value is a `VNode | VNode[]`
- On signal change, `renderToDom()` renders the VNode(s) into the container element
- `renderToDom` automatically binds all JSX event handlers (`onClick={fn}`, etc.)
- No `data-on-*` attributes needed — events live on the VNode

### Before / After

**Before** (string concatenation + declarative events):

```tsx
// signal: Signal<string>
this.#resultsHtml.value = items
  .map((i) => `<a data-on-click="_close" ...>${escapeHtml(i.title)}</a>`)
  .join('');

// template
<div data-signal-html='resultsHtml' />;
```

**After** (VNode rendering — auto-escape, auto-bind):

```tsx
// signal: Signal<VNode[]>
this.#results.value = items.map((i) => (
  <a onClick={() => this._close(i)} href={`/blog/${i.slug}`}>
    {i.title}
  </a>
));

// template
<div data-signal-render='results' />;
```

### Scope

All four website islands are migrated:

| Island              | Change                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| `less-search`       | `data-signal-html` → `data-signal-render`, all `data-on-*` → JSX `on*` |
| `reactive-showcase` | Same pattern                                                           |
| `home-console`      | `data-on-click` → `onClick`                                            |
| `scroll-reveal`     | Audit `data-on-*` usage, migrate if present                            |

### What stays

- `escapeHtml`/`escapeAttr` remain in `core` — they are essential for SSR HTML
  serialization (`render-ir.ts`, `render-dsd.ts`, `head-injection.ts`). Islands
  simply no longer import them directly.
- `collectEventBindings` / `hydrateEventMarkers` stay — they handle VNode-level
  event hydration for the existing JSX path.

## Consequences

### Positive

- Single event binding system: VNodes are the sole source of truth for events
- Islands gain type safety: `onClick={fn}` is checked by TypeScript; `data-on-click="_close"`
  was a string with zero compile-time guarantees
- Islands no longer import `escapeHtml`/`escapeAttr` — JSX auto-escapes text content
- Architecture is self-documenting: the render tree IS the source of truth

### Negative

- `data-signal-render` is a new directive that must coexist with `data-signal-html`
  (which stays for existing non-island consumers)
- Islands must be hand-migrated (3 files, ~100 lines total)
- Requires `renderToDom` to be imported in islands (already available via `DsdElement`
  internal path)

### Risk

Migration is isolated to `packages/core/src/dsd-element.ts` (+~20 lines) and
`www/app/islands/` (3 files). No SSR or build pipeline changes. Build verification
is deterministic: `deno task build` succeeds and E2E tests confirm island interactivity.

## Alternatives Considered

1. **Restore `_bindEvents()`**: Zero cost but keeps two event binding systems.
   The same bug (accidental deletion) could recur because there's no architectural
   signal that declarative events are needed.

2. **Single `data-on-*` → JSX proxy**: A compiler transform that converts
   `data-on-click="_method"` to VNode events at build time. Too complex for 3 files.

3. **Keep `data-signal-html` + restore `_bindEvents`**: Shortest fix but doubles
   the maintenance surface. Breeds future bugs when new contributors don't know
   about the second event path.

## Rejected

Restoring `_bindEvents()` as-is without architectural change.
