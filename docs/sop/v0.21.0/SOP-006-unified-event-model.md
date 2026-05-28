> 📦 **HISTORICAL** — applies to v0.21.x only. Superseded by ADR-0057 (JSX+Signal) in v0.24.1.

# SOP-006: Unified Event Model — hydrateEvents Retirement

> Version: v0.21.0
> Priority: P0
> Status: DONE
> Depends on: SOP-001 (DsdElement+Signals), SOP-004 (Fine-Grained Patching)
> Supercedes: `static hydrateEvents` API surface from ADR-0036

## Problem

v0.20 DsdElement introduced two event binding mechanisms:

1. **`static hydrateEvents`** — declarative CSS-selector-based event binding for
   `render(): string` components. The component author writes a static array of
   `{ selector, event, method }` descriptors; DsdElement's `_hydrateEvents()`
   queries the shadow DOM and attaches listeners after DSD upgrade.

2. **`@click` in `html` template** — inline event binding in `html` tagged
   template literals (v0.21). The component author writes `@click=${fn}` inside
   the template; the runtime emits `data-less-event-N` markers in SSR output and
   `_bindCurrentRenderTemplate()` resolves them on the client.

These two mechanisms coexisted because `render(): string` could not express
event bindings, and `html` template results were new in v0.21. The coexistence
creates real problems:

| Problem                                                             | Impact                                                               |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Two mental models for the same thing                                | Developer confusion — when to use which?                             |
| `@click` + `hydrateEvents` on the same component = double-fire      | Event handler fires twice per click                                  |
| `hydrateEvents` selector decoupled from template                    | Selector drifts when template changes, silent failure                |
| `hydrateEvents` only works in DSD/CSR after `_hydrateEvents()` call | Misses the `_initialRenderDone` → signal update → innerHTML nuke bug |

The root cause: `render(): string` cannot express `@click`, so `hydrateEvents`
exists as a **workaround for a limitation that `html` tagged templates remove**.

## Decision

**Retire `hydrateEvents` as a public API. Unify on `html` + `@click` + Signal.**

Every DsdElement component — static or interactive — uses `html` tagged
templates. `@click` is the only event binding syntax. `signal()` is the only
state primitive. There is one model, one mental map.

`_hydrateEvents()` remains as a private implementation detail inside
`DsdElement.connectedCallback()` for backward compatibility during the
transition period, but the `static hydrateEvents` property is deprecated and
will be removed in v1.0.

## Before/After

### Before (two models)

```ts
// Static component — render(): string + hydrateEvents
class LessSearch extends DsdElement {
  static hydrateEvents = [
    { selector: 'button.search-trigger', event: 'click', method: '_handleClick' },
  ];
  render(): string {
    return '<button class="search-trigger">Search</button>';
  }
  _handleClick() { ... }
}

// Reactive component — html + @click + signal
class LessToggle extends DsdElement {
  #on = signal(false);
  render() {
    return html`<button @click=${() => this.#on.value = !this.#on.value}>
      ${this.#on}
    </button>`;
  }
}
```

### After (one model)

```ts
// Every component uses html — static or reactive
class LessSearch extends DsdElement {
  render() {
    return html`<button class="search-trigger" @click=${() => this._handleClick()}>
      Search
    </button>`;
  }
  _handleClick() { ... }
}

class LessToggle extends DsdElement {
  #on = signal(false);
  render() {
    return html`<button @click=${() => this.#on.value = !this.#on.value}>
      ${this.#on}
    </button>`;
  }
}
```

Same syntax. No selector to maintain. No double-fire risk.

## Migration Inventory

Every component currently using `static hydrateEvents` or `render(): string`
must be migrated.

### @lessjs/ui components

| Component           | Current                              | Target                           | Effort    |
| ------------------- | ------------------------------------ | -------------------------------- | --------- |
| `less-theme-toggle` | `html` + `@click` + signal           | Already done                     | 0         |
| `less-search`       | `render(): string` + `hydrateEvents` | `html` + `@click`                | ~10 lines |
| `less-layout`       | `render(): string` + `hydrateEvents` | `html` + `@click`                | ~30 lines |
| `less-button`       | `render(): string` + `hydrateEvents` | `html` + `@click`                | ~5 lines  |
| `less-input`        | `render(): string` + `hydrateEvents` | `html` + `@click`                | ~5 lines  |
| `less-code-block`   | `render(): string`                   | `html` (no events, just strings) | ~3 lines  |
| `less-card`         | `render(): string`                   | `html` (no events)               | ~3 lines  |
| `less-callout`      | `render(): string`                   | `html` (no events)               | ~3 lines  |
| `less-step-card`    | `render(): string`                   | `html` (no events)               | ~3 lines  |
| `less-dialog`       | `render(): string` + `hydrateEvents` | `html` + `@click`                | ~15 lines |

### www island components

| Component                  | Current                              | Target             | Effort    |
| -------------------------- | ------------------------------------ | ------------------ | --------- |
| `less-search.ts`           | `render(): string` + `hydrateEvents` | `html` + `@click`  | ~10 lines |
| `shoelace-showcase.ts`     | `render(): string`                   | `html` (no events) | ~3 lines  |
| `media-chrome-showcase.ts` | `render(): string`                   | `html` (no events) | ~3 lines  |
| `reactive-showcase.ts`     | `html` + `@click` + signal           | Already done       | 0         |
| `counter-island.ts`        | `html` + `@click` + signal           | Already done       | 0         |

## Step-by-Step Execution

### Step 0: Deprecation Annotation

- [ ] Add `@deprecated` JSDoc to `DsdElement.static hydrateEvents` in `dsd-element.ts`
- [ ] Add `@deprecated` JSDoc to `HydrateEventDescriptor` type in `types.ts`
- [ ] Add runtime `console.warn` when `hydrateEvents` is used at class definition
      time (only in dev mode, not production)
- [ ] Update `ADR-0036` to mark `hydrateEvents` as deprecated with migration note
- [ ] Update `ADR-0039` to state `@click` as the sole event binding mechanism

Acceptance:

- [ ] TypeScript `@deprecated` strikethrough appears in IDE for `hydrateEvents`
- [ ] Dev-mode console warning fires when a component defines `static hydrateEvents`

### Step 1: Migrate @lessjs/ui Static Components (no events)

These components have no `hydrateEvents` and no interactive state. The only
change is wrapping the template string in `html`:

```ts
// Before
render(): string {
  return '<div class="card"><slot></slot></div>';
}

// After
render() {
  return html`<div class="card"><slot></slot></div>`;
}
```

- [ ] `less-card` → `html` template
- [ ] `less-callout` → `html` template
- [ ] `less-step-card` → `html` template
- [ ] `less-code-block` → `html` template

Acceptance:

- [ ] SSR output is byte-identical (same HTML, same DSD template)
- [ ] No `hydrateEvents` remains in these components
- [ ] `deno task test` passes

### Step 2: Migrate @lessjs/ui Interactive Components (with events)

For each component currently using `hydrateEvents`:

1. Change `render(): string` to `render()` returning `html` template
2. Replace each `{ selector, event, method }` entry with `@event=${this._method}`
   directly in the template
3. Delete the `static hydrateEvents` array
4. Verify no double-fire by checking `_handleX` is called exactly once per event

Migration pattern:

```ts
// Before
static hydrateEvents = [
  { selector: '.btn', event: 'click', method: '_handleClick' },
];
render(): string {
  return '<button class="btn">Click</button>';
}

// After
render() {
  return html`<button class="btn" @click=${() => this._handleClick()}>Click</button>`;
}
```

- [ ] `less-button` — migrate `@click` for `.btn`
- [ ] `less-input` — migrate `@input` for `.input`
- [ ] `less-dialog` — migrate `@click` for `.close-btn`, `.overlay`
- [ ] `less-layout` — migrate `@click` for `.mobile-menu-btn`, `.nav-link`

Acceptance:

- [ ] No `static hydrateEvents` remains in any `@lessjs/ui` component
- [ ] Event handlers fire exactly once per user interaction
- [ ] DSD upgrade path: `data-less-event-N` markers present in SSR output
- [ ] Signal update path: `_patchBindings()` does not destroy event listeners
- [ ] `deno task test` passes

### Step 3: Migrate www Island Components

- [ ] `www/app/islands/less-search.ts` — migrate `hydrateEvents` to `@click`
- [ ] `www/app/islands/shoelace-showcase.ts` — change `render(): string` to `html`
- [ ] `www/app/islands/media-chrome-showcase.ts` — change `render(): string` to `html`

Acceptance:

- [ ] Search overlay opens on click
- [ ] Shoelace showcase renders with sl-button visible
- [ ] Media Chrome showcase renders after dynamic import
- [ ] `deno task build` produces valid HTML with `data-less-event-N` markers

### Step 4: Remove `_hydrateEvents()` from `_renderIntoShadowRoot()`

Currently `_renderIntoShadowRoot()` calls both `_bindTemplateRuntime()` (for
`@click`) and `_hydrateEvents()` (for `static hydrateEvents`). After all
components are migrated to `@click`, the dual-call creates a risk of double-fire
for any remaining `hydrateEvents` users.

After all `@lessjs/ui` and `www` components are migrated:

- [ ] Move `_hydrateEvents()` call in `_renderIntoShadowRoot()` behind a
      `if (ctor.hydrateEvents?.length)` guard — only call for components that
      still declare `hydrateEvents` (third-party consumers during transition)
- [ ] Add `console.warn('hydrateEvents is deprecated...')` inside the guard
- [ ] `_bindCurrentRenderTemplate()` remains the primary event binding path
- [ ] In DSD hydration path (`connectedCallback`), same guard

Acceptance:

- [ ] Components without `hydrateEvents` only go through `_bindTemplateRuntime`
- [ ] Components with `hydrateEvents` still work (backward compat) but log warning
- [ ] No double-fire in either path

### Step 5: Update DsdElement `_initialRenderDone` Contract

This was already fixed but needs explicit documentation:

- [ ] Document that `connectedCallback()` DSD path sets `_initialRenderDone = true`
      after `_bindCurrentRenderTemplate()` + `_hydrateEvents()`
- [ ] Add test: signal change after DSD upgrade uses `_patchBindings()`,
      not `_renderIntoShadowRoot()`
- [ ] Add test: event listeners survive signal-driven `_patchBindings()`

Acceptance:

- [ ] `connectedCallback` DSD path is documented with the `_initialRenderDone`
      contract
- [ ] Tests prove fine-grained patching preserves event listeners

### Step 6: Documentation

- [ ] Update `docs/sop/v0.21.0/README.md` — add SOP-006 to release order
- [ ] Update `ADR-0039` — add "hydrateEvents Retirement" section
- [ ] Update `ADR-0036` — mark `hydrateEvents` as `DEPRECATED (v0.21.0)`
- [ ] Add migration note to `docs/guide/migrating-from-lit.md`
- [ ] Add `@click` vs `hydrateEvents` comparison table to public docs

### Step 7: Verification

```sh
deno task fmt:check
deno task lint
deno task typecheck
deno task test
deno task build
deno task dsd:check-report
```

Required test cases:

- [ ] No `static hydrateEvents` in any `@lessjs/ui` component
- [ ] No `static hydrateEvents` in any `www/app/islands/*` component
- [ ] `@click` binds correctly after DSD upgrade
- [ ] `@click` survives signal-driven `_patchBindings()`
- [ ] No double-fire for any event
- [ ] Dev-mode `console.warn` fires for third-party `hydrateEvents` usage
- [ ] All SSR output contains `data-less-event-N` where `@click` is used

## Exit Criteria

- Every `@lessjs/ui` and `www` island component uses `html` tagged templates
- No `static hydrateEvents` declaration in any LessJS-maintained component
- `_hydrateEvents()` is a guarded backward-compat path with deprecation warning
- `@click` is the documented sole event binding mechanism
- All gate commands pass
- DSD report shows zero new errors from migration

## Retirement Timeline

| Version | `hydrateEvents` Status            | `_hydrateEvents()` Internal |
| ------- | --------------------------------- | --------------------------- |
| v0.21.0 | `@deprecated`, dev-mode warning   | Active, guarded             |
| v0.22.0 | Still works, warning on every use | Same                        |
| v1.0    | **Removed from public API**       | **Removed entirely**        |

## Rationale

### Why not keep both?

Two event models means two code paths, two sets of bugs, and two mental models.
The `_initialRenderDone` bug was caused by the interaction between
`_bindCurrentRenderTemplate` (v0.21) and `_hydrateEvents` (v0.20) — one path
set the flag, the other didn't. Unifying removes the interaction surface.

### Why not keep `hydrateEvents` for third-party compat?

Third-party components written against v0.20 will still work during the
deprecation window (v0.21–v0.22). The deprecation warning guides them to
migrate. v1.0 removes the API with a major version bump, which is the
semver-correct way to break compat.

### Why `html` + `@click` instead of `render(): string` + `hydrateEvents`?

`html` is a strict superset of `render(): string`:

```ts
// These produce identical SSR output:
render(): string { return '<div>hello</div>'; }
render() { return html`<div>hello</div>`; }
```

But `html` adds `@click` binding, signal tracking, and safe escaping for free.
There is no cost to using `html` for static content, and significant benefit
for interactive content. One template syntax for all components.

## Related

- ADR-0036: Ocean-Island Architecture (hydrateEvents origin)
- ADR-0039: DsdElement + Signals Reactive Architecture (@click origin)
- ADR-0040: Streaming DSD (independent — streaming is orthogonal to event model)
- SOP-001: DsdElement + Signals Integration
- SOP-004: Fine-Grained Patching + DX
