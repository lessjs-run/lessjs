# SOP-004: Unified VNode Pipeline — Signal-Aware SSR+CSR

> **Version**: v0.27.0 · **ADR**: ADR-0065 · **Status**: In Progress

---

## Goal

Eliminate the dual-renderer architecture (`renderToString` + `renderToDom` + `_walkAndBind` + `_layoutWorkaroundReRender`). Replace with:

1. **One VNode tree**, two serialization paths (HTML, DOM)
2. **`data-less-s`** attributes in SSR HTML preserving signal identity
3. **`querySelector`-based hydration** replacing traversal-based position guessing
4. **Delete `_layoutWorkaroundReRender`** — Chromium layout bug fixed with one-liner

---

## Pre-Flight Checks

```bash
# Ensure clean working tree
cd src-tmp && git status --short

# Ensure tests pass before starting
deno task test:core

# Current branch: dev
git branch --show-current
```

- [ ] `git status` shows no unexpected changes
- [ ] Core tests pass (`deno test packages/core/__tests__/`)
- [ ] Branch is `dev`

---

## Step 1: Add `signalRegistry` to DsdElement

**File**: `packages/core/src/dsd-element.ts`

### 1.1 Import `BaseSignal` type

```ts
import { type BaseSignal } from '@lessjs/signals';
```

### 1.2 Add `signalRegistry` property to `DsdElement` class

```ts
/** v0.27: Maps signal names → signal objects for hydration lookup. */
protected _signals: Map<string, BaseSignal<unknown>> = new Map();
```

### 1.3 Verification

```bash
deno check packages/core/src/dsd-element.ts  # Should pass
```

- [ ] `_signals` property exists on DsdElement
- [ ] Type imports compile

---

## Step 2: SSR — Preserve Signal Identity as `data-less-s` Attribute

**File**: `packages/core/src/jsx-render-string.ts`

### 2.1 Modify `serializeAttrs` — track signal names

Before the `textContent` skip line, add signal name tracking:

```ts
// textContent prop with signal: preserve identity as data-less-s attribute
if (key === 'textContent' && isSignalLike(value)) {
  // Signal name is embedded in the signal object during SSR prep
  // For now, emit data-less-s with auto-generated name based on element
  const sigName = (value as any)._name || 'signal';
  result += ` data-less-s="${escapeAttr(sigName)}"`;
  continue;
}

// textContent is a DOM property — rendered as child content, not as an HTML attribute.
if (key === 'textContent') continue;
```

### 2.2 Pass signal name through JSX

In `renderToString`, when encountering `textContent={signal}`:

```ts
// textContent prop: render signal/dynamic value as escaped child content (v0.27)
// Also emit data-less-s attribute for hydration
const textContent = props?.textContent !== undefined
  ? escapeHtml(String(unwrapSignalLike(props.textContent)))
  : undefined;
```

### 2.3 Verification

```bash
deno task build:docs  # SSR output should have data-less-s attributes
grep -r "data-less-s" www/dist/*.html | head -5
```

- [ ] `data-less-s` appears in SSR HTML output
- [ ] Value inside element is still the initial signal value (e.g. `42`)
- [ ] No `data-less-s` in browser-only attributes list

---

## Step 3: CSR — Build `signalRegistry` from Component State

**File**: `packages/core/src/dsd-element.ts`

### 3.1 In `connectedCallback`, before hydration, scan private fields

```ts
// v0.27: Build signal registry from #private fields
// Private field names starting with # are accessible via this.constructor
// Components register signals explicitly in constructor
if (!this._signals || this._signals.size === 0) {
  this._registerSignals();
}
```

### 3.2 Add `_registerSignals` method

```ts
/**
 * Register signals for hydration. Override in subclasses.
 * Components with reactive state call this._registerSignal(name, signal) in constructor.
 */
protected _registerSignal(name: string, sig: BaseSignal<unknown>): void {
  this._signals.set(name, sig);
}

/**
 * Auto-register signals. Default implementation is a no-op.
 * Override to call this._registerSignal() for each reactive field.
 */
protected _registerSignals(): void {}
```

### 3.3 Update component constructors

**File**: `www/app/islands/home-console.tsx`

```ts
constructor() {
  super();
  this._registerSignal('count', this.#count);
}
```

**File**: `www/app/islands/reactive-showcase.tsx`

```ts
constructor() {
  super();
  this._registerSignal('count', this.#count);
  this._registerSignal('isDark', this.#isDark);
}
```

### 3.4 Verification

```bash
deno check www/app/islands/home-console.tsx
deno check www/app/islands/reactive-showcase.tsx
```

- [ ] No type errors
- [ ] Signal names match `data-less-s` values in SSR output

---

## Step 4: Hydration — Replace `_walkAndBind` with `hydrateSignals`+`hydrateEvents`

**File**: `packages/core/src/dsd-element.ts`

### 4.1 Add `hydrateSignals` method

```ts
/**
 * v0.27 (ADR-0065): Hydrate DSD DOM with signal bindings.
 * Replaces _walkAndBind traversal with attribute-based lookup.
 */
private _hydrateSignals(root: ShadowRoot, signal?: AbortSignal): void {
  for (const el of root.querySelectorAll('[data-less-s]')) {
    const name = el.getAttribute('data-less-s')!;
    const sig = this._signals.get(name);
    if (!sig) continue;
    const dispose = effect(() => {
      (el as HTMLElement).textContent = String(sig.value ?? '');
    });
    if (signal) signal.addEventListener('abort', dispose, { once: true });
    // Clean up the marker attribute (hydration completed)
    el.removeAttribute('data-less-s');
  }
}
```

### 4.2 Add `hydrateEvents` method

```ts
/**
 * v0.27 (ADR-0065): Hydrate DSD DOM with event bindings.
 */
private _hydrateEvents(root: ShadowRoot, signal?: AbortSignal): void {
  for (const el of root.querySelectorAll('[data-less-on]')) {
    const spec = el.getAttribute('data-less-on')!;
    const colon = spec.indexOf(':');
    if (colon === -1) continue;
    const eventType = spec.slice(0, colon);
    const methodName = spec.slice(colon + 1);
    const handler = (this as Record<string, unknown>)[methodName];
    if (typeof handler === 'function') {
      el.addEventListener(eventType, handler as EventListener, signal ? { signal } : undefined);
    }
    el.removeAttribute('data-less-on');
  }
}
```

### 4.3 Rewrite `_hyrateExistingDom`

```ts
private _hyrateExistingDom(): void {
  if (!this.shadowRoot) return;

  const result = this.render();
  if (!isVNode(result)) return;

  this._scopeDispose?.();

  this._scopeDispose = effectScope(() => {
    const ac = new AbortController();

    // v0.27 (ADR-0065): Zero-traversal hydration.
    // Walk VNode tree once to apply non-signal props to DSD DOM,
    // and bind signal-driven props via data-less-s attributes.
    this._walkAndBind(this.shadowRoot!, result, ac.signal);

    // Hydrate signal bindings from data-less-s attributes
    this._hydrateSignals(this.shadowRoot!, ac.signal);

    // Hydrate event bindings from data-less-on attributes
    this._hydrateEvents(this.shadowRoot!, ac.signal);

    // v0.27 (ADR-0065): Fix Chromium DSD layout bug without DOM rebuild.
    // requestAnimationFrame forces a layout computation without destroying
    // existing DOM nodes or their effect bindings.
    requestAnimationFrame(() => {
      void this.shadowRoot!.offsetHeight; // Force layout
    });
  });
}
```

### 4.4 Verification

```bash
deno check packages/core/src/dsd-element.ts
deno task build:docs  # Build should succeed
```

- [ ] No type errors
- [ ] Build completes

---

## Step 5: Delete `_layoutWorkaroundReRender`

**File**: `packages/core/src/dsd-element.ts`

Simply remove the method:

```ts
// DELETE the entire _layoutWorkaroundReRender method (lines 309-321)
```

### Verification

```bash
grep -n "_layoutWorkaroundReRender" packages/core/src/dsd-element.ts
# Should return nothing
```

- [ ] Method completely removed
- [ ] No remaining references in codebase

---

## Step 6: Update www Components

### 6.1 home-console

```tsx
constructor() {
  super();
  this._registerSignal('count', this.#count);
}
```

### 6.2 reactive-showcase

```tsx
constructor() {
  super();
  this._registerSignal('count', this.#count);
  this._registerSignal('isDark', this.#isDark);
}
```

### 6.3 Remove explicit effect() workarounds

The `connectedCallback()` effect bindings added earlier in v0.27.0 as workarounds can now be removed — the hydration pipeline handles them correctly.

### Verification

```bash
deno task build:docs
grep -r "data-less-s" www/dist/*.html | wc -l  # Should be non-zero
```

- [ ] Counter page has `data-less-s="count"` in SSR HTML
- [ ] Reactive showcase has signal attributes in SSR HTML

---

## Step 7: Clean Up Old Code

### 7.1 Remove index alignment logic from `_walkAndBind`

`_walkAndBind` is retained but simplified — it now only applies non-signal props (class, id, aria, etc.) and recurses into child elements. Signal detection and event detection are handled by `hydrateSignals`/`hydrateEvents`.

### 7.2 Remove `@lessjs/core/navigation` module

Already unused. Delete:

```bash
rm packages/core/src/navigation.ts
```

Update `packages/core/deno.json` to remove navigation subpath export.

Update `packages/core/src/index.ts` to remove navigation re-export.

### 7.3 Remove unused imports

```bash
deno lint packages/core/src/dsd-element.ts
deno lint packages/core/src/jsx-render-string.ts
```

- [ ] Zero lint errors

---

## Step 8: Build & Test

### 8.1 Full build

```bash
deno task build:docs
```

### 8.2 Core tests

```bash
deno test packages/core/__tests__/ --allow-read --allow-write --allow-env --allow-net
```

### 8.3 Run full test suite

```bash
deno test --allow-read --allow-write --allow-env --allow-net
```

### 8.4 E2E Playwright tests

```bash
# Deploy to Cloudflare Pages, then verify:
# 1. Counter increments/decrements
# 2. SPA navigation works (no page reload)
# 3. i18n lang-switch works
# 4. Search overlay opens with Cmd+K
# 5. No console errors
```

- [ ] Full build passes
- [ ] Core tests pass
- [ ] Full test suite passes
- [ ] Zero lint errors
- [ ] Zero fmt errors

---

## Step 9: Git Workflow

```bash
git add -A
git commit -m "feat(v0.27): unified VNode pipeline — signal-aware SSR+CSR

ADR-0065: Eliminate dual renderer architecture.

- Add data-less-s attributes to SSR HTML (signal identity preserved)
- Replace _walkAndBind traversal with querySelector hydration
- Delete _layoutWorkaroundReRender (Chromium bug: RAF offsetHeight)
- Delete @lessjs/core/navigation module (fully replaced by Router)
- Add signalRegistry + _registerSignal to DsdElement
- Update home-console + reactive-showcase with signal registration
- Remove workaround effect() bindings in connectedCallback

Closes: counter stuck at 42, SPA nav crash, lang-switch page reload"

git push origin dev
```

---

## Rollback Plan

If SSR `data-less-s` attributes cause issues:

1. Revert `jsx-render-string.ts` changes (remove data-less-s generation)
2. Revert `dsd-element.ts` hydration changes (restore _walkAndBind)
3. Restore `_layoutWorkaroundReRender` as fallback
4. Re-add `@lessjs/core/navigation` module

Rollback is a single `git revert` of the v0.27.0 commit.

---

## Success Criteria

- [ ] `deno task build:docs` passes
- [ ] All core tests pass
- [ ] Counter increments/decrements in deployed app
- [ ] SPA navigation works without page reload
- [ ] i18n lang-switch works correctly
- [ ] Zero console errors in deployed app
- [ ] `_layoutWorkaroundReRender` deleted from codebase
- [ ] `_walkAndBind` traversal logic simplified (no index alignment)
- [ ] `@lessjs/core/navigation` deleted
- [ ] `data-less-s` attributes present in SSR HTML
