# SOP-010: Architect Review Remediation

> Version: v0.21.0
> Priority: P1
> Status: IMPLEMENTED
> Triggered by: Architect cross-review 2026-05-24 (高见远)
> Source: 5 actionable findings from code quality + architecture audit

## Objective

Close 5 architectural and code quality gaps identified by the architect
cross-review. These are not blocking for v0.21.0 release but should be fixed
before v0.22.0 feature work begins.

---

## Step 1: Eliminate Core/Split-Package Code Duplication (SOP-007 Completion)

**Problem**: `compatibility.ts` (492 lines) and `cem-parser.ts` (458 lines) exist
identically in both `packages/core/src/` and their respective independent packages.

```
packages/core/src/compatibility.ts  ≡  packages/compat-check/src/compatibility.ts  (492 lines each)
packages/core/src/cem-parser.ts     ≡  packages/cem/src/cem-parser.ts             (458 lines each)
```

**Root cause**: SOP-007 did a "logical split" (new packages with re-exports) but
never moved the physical implementation, so both locations have full copies.

**Action**:

- [ ] Verify that `packages/compat-check/src/compatibility.ts` and
      `packages/cem/src/cem-parser.ts` are byte-identical to their core
      counterparts. If so:
- [ ] In `packages/core/src/compatibility.ts`: replace entire file content with
      a single re-export from `@lessjs/compat-check`:
      `ts
      export * from '@lessjs/compat-check';`
- [ ] In `packages/core/src/cem-parser.ts`: replace entire file content with
      a single re-export from `@lessjs/cem`:
      `ts
      export * from '@lessjs/cem';`
- [ ] Run `deno task typecheck && deno task test` — ensure no regressions.
- [ ] If tests pass, **delete** `packages/compat-check/src/compatibility.ts` and
      `packages/cem/src/cem-parser.ts` (keep only the re-export wrappers in
      `index.ts` of each package).

**Files**: `packages/core/src/compatibility.ts`, `packages/core/src/cem-parser.ts`,
`packages/compat-check/src/compatibility.ts`, `packages/cem/src/cem-parser.ts`

**Effort**: ~30min

---

## Step 2: Add `./types` Subpath Export to `@lessjs/core`

**Problem**: `packages/core/deno.json` exports 20 subpaths but **missing
`"./types"`**. The independent packages (`compat-check`, `cem`) import types
from `@lessjs/core` (via their `index.ts` thin wrappers), and external consumers
of `ReactiveHost`, `HydrateEventDescriptor`, `Unsubscribe` etc. need a stable
path.

**Current exports (verified)**:

```json
"./compatibility": "./src/compatibility.ts",
"./cem-parser": "./src/cem-parser.ts",
// ... 18 more subpaths
```

**Missing**: `"./types": "./src/types.ts"`

**Action**:

- [ ] In `packages/core/deno.json`, add to the `"exports"` object:
      `json
      "./types": "./src/types.ts",`
- [ ] Verify: `deno task typecheck` — confirm the subpath is recognized.
- [ ] Verify: `deno task test` — ensure no regressions.

**Files**: `packages/core/deno.json`

**Effort**: ~5min

---

## Step 3: Implement Real `batch()` or Remove It

**Problem**: `packages/signals/src/sugar.ts` line ~207:

```ts
export function batch<T>(fn: () => T): T {
  return fn(); // ← Literally a no-op. Just calls the function.
}
```

This is documented as a batching API but provides zero batching. Users calling
`batch(() => { sigA.value = 1; sigB.value = 2; })` expect a single re-render but
get two separate updates.

**Decision**: Since `DsdElement._scheduleReactiveUpdate()` already does
microtask-level batching (multiple sync writes → 1 microtask → 1 patch), the
simplest fix is to implement `batch()` using TC39 `Signal.subtle`:

```ts
export function batch<T>(fn: () => T): T {
  let result: T;
  _engine.subtle.batch(() => {
    result = fn();
  });
  return result!;
}
```

**Action**:

- [ ] Read `packages/signals/src/engine.ts` to find the Signal.subtle.batch or
      equivalent API.
- [ ] If available, implement `batch()` using the engine's batch primitive.
- [ ] If NOT available (TC39 Signal.subtle doesn't expose batch), add a
      `@deprecated` JSDoc and `console.warn('batch() is a no-op. Use DsdElement microtask batching instead.')` and remove it in v1.0.
- [ ] Update `packages/signals/src/sugar.ts` accordingly.
- [ ] Run `deno test packages/signals/__tests__/` to verify.

**Files**: `packages/signals/src/sugar.ts`, `packages/signals/src/engine.ts`

**Effort**: ~30min

---

## Step 4: Extract `DANGEROUS_KEYS` to Independent `security.ts`

**Problem**: `DANGEROUS_KEYS` is defined in `packages/core/src/island.ts` and
imported by `packages/core/src/render-instantiate.ts` via `./island.js`. This
creates a false coupling — `render-instantiate.ts` (SSR props injection) depends
on `island.ts` (client-side island registration).

**Current usage**:

```
island.ts:136          → const DANGEROUS_KEYS: Set<string> = new Set([...])
island.ts:161          → if (DANGEROUS_KEYS.has(key)) { ... }
render-instantiate.ts  → import { DANGEROUS_KEYS } from './island.js';
render-instantiate.ts  → if (DANGEROUS_KEYS.has(key)) { ... }
```

**Action**:

- [ ] Create `packages/core/src/security.ts`:
      `ts
      /** SSR-injectable HTML attributes that MUST NOT come from untrusted input. */
      export const DANGEROUS_KEYS: ReadonlySet<string> = new Set([
        'innerHTML',
        'outerHTML',
        'shadowRoot',
        'style',
        'onload',
        'onerror',
        'onclick',
        'onfocus',
        'onblur',
      ]);`
- [ ] Update `packages/core/src/island.ts`: import `DANGEROUS_KEYS` from
      `./security.js` instead of local definition.
- [ ] Update `packages/core/src/render-instantiate.ts`: import from
      `./security.js` instead of `./island.js`.
- [ ] Run `deno task typecheck && deno task test` — verify no regressions.

**Files**: `packages/core/src/security.ts` (new), `packages/core/src/island.ts`,
`packages/core/src/render-instantiate.ts`

**Effort**: ~15min

---

## Step 5: Simplify `connectedCallback` Branching

**Problem**: `DsdElement.connectedCallback()` has ~25 lines with nested
if-else for DSD path vs CSR path vs formAssociated. The core difference
is a single dispatch: `_bindCurrentRenderTemplate()` vs `_renderIntoShadowRoot()`.

**Current structure** (conceptual):

```ts
connectedCallback() {
  if (!this.shadowRoot) {
    this.createRenderRoot();
  } else {
    if (this.shadowRoot.childNodes.length > 0) this._dsdHydrated = true;
    this._applyStyles(ctor);
  }
  // theme sync
  if (this._dsdHydrated) {
    this._bindCurrentRenderTemplate();
    this._initialRenderDone = true;
  } else if (this.shadowRoot) {
    this._renderIntoShadowRoot();
  }
  if (ctor.formAssociated && ...) { ... }
}
```

**Action**:

- [ ] Extract the DSD vs CSR render dispatch into a private method:
      `ts
      private _hydrateOrRender(): void {
        if (this._dsdHydrated) {
          this._bindCurrentRenderTemplate();
          this._initialRenderDone = true;
        } else if (this.shadowRoot) {
          this._renderIntoShadowRoot();
        }
      }`
- [ ] Replace the inline if-else in `connectedCallback()` with
      `this._hydrateOrRender()`.
- [ ] Run `deno test packages/core/__tests__/dsd-element.test.ts
      packages/core/__tests__/reactive-dsd.test.ts` — verify all event binding
      and render paths still work.
- [ ] Run `deno task test` — ensure no regressions.

**Files**: `packages/core/src/dsd-element.ts`

**Effort**: ~20min

---

## Verification

After all 5 steps complete:

```sh
deno fmt
deno lint
deno task typecheck
deno task test
deno task build
```

Expected: 787+ tests passing, zero regressions, fmt/lint clean.

---

## Progress Dashboard

| Step | Title                                 | Effort | Status  |
| ---- | ------------------------------------- | ------ | ------- |
| 1    | Eliminate code duplication            | 30min  | ⬜ Todo |
| 2    | Add ./types subpath export            | 5min   | ⬜ Todo |
| 3    | Implement or deprecate batch()        | 30min  | ⬜ Todo |
| 4    | Extract DANGEROUS_KEYS to security.ts | 15min  | ⬜ Todo |
| 5    | Simplify connectedCallback branching  | 20min  | ⬜ Todo |

**Total effort**: ~1h 40min

---

## Exit Criteria

- [ ] No duplicate implementation between core and independent packages
- [ ] `@lessjs/core` exports `./types` subpath
- [ ] `batch()` either works or is clearly deprecated with warning
- [ ] `DANGEROUS_KEYS` lives in `security.ts`, not `island.ts`
- [ ] `connectedCallback` branching simplified via extracted method
- [ ] All gate commands pass

## Related

- Architect cross-review 2026-05-24 (高见远)
- SOP-007: Core Package Split
- `packages/core/deno.json`
- `packages/signals/src/sugar.ts`
