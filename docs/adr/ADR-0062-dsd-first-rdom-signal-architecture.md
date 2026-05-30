# ADR-0062: DSD-First Real DOM Signal Architecture

> Status: PROPOSED\
> Date: 2026-05-30\
> Target: v0.27.0\
> Revises: ADR-0058 (SOP-001) — Real DOM Signal Binding\
> Relates: ADR-0057 (JSX+Signal), ADR-0059 (Show/For), ADR-0060 (SignalContext)

## Context

### What happened

On 2026-05-30, `dev.lessjs.pages.dev` went blank. Git bisect traced the regression to commit `7989e8e8` (ADR-0058: Real DOM Signal Binding), which removed `effect(() => render())` from `_hyrateExistingDom()`. Restoring it fixed the page.

The removal was correct in principle — per-prop signal→DOM bindings via `applyProps` are more efficient than full VNode re-render — but the implementation was incomplete. Two failure modes emerged:

1. **Structural signal gap**: `less-layout.render()` accesses `theme`, `locale`, `nav-items` signals to determine VNode *structure*, not just attribute values. `applyProps` binds `class="xxx"` but cannot add/remove entire subtrees.

2. **Browser layout quirk**: DSD-pre-populated shadow DOM content renders with correct DOM tree but Chromium's layout engine produces `0×0` host bounding rect. Only a CSR re-render (`renderToDom → appendChild`) triggers correct layout computation.

### Current architecture (post-hotfix)

```
DSD template (SSG) → shadow root populated
  ↓
client.js defines custom element
  ↓
connectedCallback() → _applyStyles() + _renderOrHydrate()
  ↓
_hyrateExistingDom():
  1. _walkAndBind() — bind events to DSD DOM
  2. effect(() => render()) — FULL re-render via CSR
     (clears shadow root, rebuilds via renderToDom)
```

The `effect(() => render())` step *replaces* the DSD DOM with CSR DOM. This is the VDOM approach that SOP-001 tried to eliminate.

### Why SOP-001 (ADR-0058) didn't work

SOP-001 correctly identified the goal: replace `effect(() => render())` with per-prop signal→DOM bindings. But it missed two preconditions:

| Precondition                                            | SOP-001 status       |
| ------------------------------------------------------- | -------------------- |
| All signal access in `render()` is attribute-only       | ❌ Not true          |
| DSD shadow DOM produces correct browser layout          | ❌ Not true          |
| `Show`/`For` work in DSD hydration path                 | ❌ CSR-only          |
| Components have `:host { display: block }` in DSD CSS   | ❌ Missing           |

## Decision

### Architecture principle

```
HTML = skeleton (generated once by SSG/DSD, never rebuilt)
CSS  = visual state (attribute-driven, zero JS for visual changes)
JS   = data + atomic updates + communication (signal → DOM attribute)
```

This is the **Real DOM (RDOM)** approach — same philosophy as SolidJS, Svelte 5, Vue Vapor.

### Key rules

1. **`render()` is initialization-only**. Called once per component lifecycle to produce the initial VNode. Signal changes after hydration update DOM attributes in-place — never trigger full re-render.

2. **All visual state is CSS-driven**. Theme, responsive breakpoints, loading states — all controlled by CSS via `data-*` attributes and CSS custom properties. JS only sets/removes attributes.

3. **Signal→DOM is attribute-level**. `applyProps` already creates `effect(() => setAttribute())` for signal-valued props. This is the sole mechanism for reactive DOM updates.

4. **Structural changes use `Show`/`For`**. The ADR-0059 control flow components (`<Show>`, `<For>`) handle conditional rendering and list rendering. They must work in the DSD hydration path.

5. **`effect(() => render())` is forbidden**. Marked `@deprecated`, removed in v0.27.0.

### Component contract

Every component must satisfy:

- `render()` accesses signals ONLY to compute attribute values, never to choose between different element trees
- Visual state variants (dark/light, loading/loaded, mobile/desktop) are expressed via `data-theme`, `data-state`, `data-breakpoint` attributes + CSS
- Content variants (locale strings, dynamic text) use `Show`/`For` or reactive text nodes

## Migration plan

### Phase 1: Fix DSD layout (v0.26.1)

| Task                                           | File                                           |
| ---------------------------------------------- | ---------------------------------------------- |
| Add `:host { display: block }` to all DSD CSS  | `open-props-tokens.ts`, index page `heroSheet` |
| Inject `docs-home { display: block }` globally | `ssg-postprocess.ts` (DSD_POLYFILL CSS)        |
| Keep `effect(() => render())` as temporary fix | `dsd-element.ts`                               |

### Phase 2: Convert components to attribute-only (v0.26.1 → v0.27)

| Component           | Signal            | Current (structural)         | Target (attribute-only)                |
| ------------------- | ----------------- | ---------------------------- | -------------------------------------- |
| `less-layout`       | theme             | `{theme==='dark'?<Dark>:<Light>}` | `data-theme={themeSignal}` + CSS       |
| `less-layout`       | locale            | Conditional text in render() | Reactive text node / `Show`           |
| `less-layout`       | nav-items         | `.map()` in render()         | `<For each={navSignal}>`               |
| `less-theme-toggle` | theme             | Conditional class            | ✅ Already attribute-only              |
| `home-console`      | count, loading    | Conditional children         | `<Show when={loading}>` / CSS opacity  |
| `counter-island`    | count             | `count.value` in text        | Reactive text node (already works)     |

### Phase 3: Delete effect (v0.27)

Remove `effect(() => render())` from `_hyrateExistingDom()`, `requestReactiveUpdate()`, and `_renderIntoShadowRoot()`. Remove `_vnodeEffectDispose` field.

Make `Show`/`For` work in DSD hydration path (walk existing DOM, match markers).

### Phase 4: Verify & document (v0.27)

- Run full CI gate (typecheck, test, lint, dsd:check-report, e2e)
- Verify dev.lessjs.pages.dev renders correctly with zero `effect(() => render())` calls
- Update component author guide to forbid structural signal access in `render()`

## Consequences

### Positive

- Zero full re-renders after hydration → no FOUC, no layout thrash
- DSD content preserved → no identity loss, no `connectedCallback` re-entry
- Per-prop bindings → predictable performance (O(changed attributes), not O(tree size))
- CSS-driven visual state → works without JS (SSG), seamless upgrade

### Negative

- Component authors must follow the attribute-only contract
- `Show`/`For` must handle DSD hydration (not just CSR)
- `data-*` attributes pollute the DOM (acceptable trade-off for zero-JS visual state)
- Migration effort for existing components (3-4 components, ~50-100 lines each)

### Risk

- The "browser layout quirk" (DSD shadow DOM → 0×0 host rect) may recur if any component
  accidentally uses structural signal access after migration
- Mitigation: add integration test that checks `getBoundingClientRect().height > 0` for
  all hydrated components

## Related

- ADR-0058: Real DOM Signal Binding (attempted, incomplete)
- ADR-0059: Show/For Control Flow
- ADR-0057: JSX+Signal Component Model
- ADR-0060: SignalContext (theme sharing via DOM tree)
- SOP-001: Real DOM Signal Binding implementation (superseded by this ADR)
- SOP-002: Signal-to-CSS-driven-visual migration (implements this ADR)
