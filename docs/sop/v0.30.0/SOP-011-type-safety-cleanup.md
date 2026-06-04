# SOP-011: v0.30.0 Type Safety Cleanup

> Version: v0.30.0
> Date: 2026-06-04
> Status: Planned
> Output: 44 type escapes eliminated, 3 ban-types eliminated, ~100 lines deleted

## Summary

Comprehensive type safety cleanup eliminating 42 `as unknown as` type escapes and 3 `ban-types` suppressions. All changes are zero-break because the codebase has already standardized on JSX returns and modern patterns.

## Entry Criteria

- v0.29.4 is on `main`
- All existing tests pass (1317 tests)
- Working tree is clean

## Workstreams

### Workstream 1: VNode.tag precise types

**Goal**: Eliminate 3 `ban-types` suppressions

**Files**: vnode.ts, jsx-runtime.ts, jsx-types.d.ts, render-ir.ts, jsx-render-dom.ts

**Changes**:

1. Define precise component types in vnode.ts:

```typescript
export type ComponentFn = (props: Record<string, unknown>) => unknown;
export type ComponentCtor = new (...args: unknown[]) => { render(): unknown };

export interface VNode {
  tag: string | ComponentFn | ComponentCtor | symbol;
  // ...
}

export function isComponentCtor(tag: VNode['tag']): tag is ComponentCtor {
  return typeof tag === 'function' &&
    tag.prototype !== undefined &&
    typeof (tag as ComponentCtor).prototype.render === 'function';
}

export function isComponentFn(tag: VNode['tag']): tag is ComponentFn {
  return typeof tag === 'function' && !isComponentCtor(tag);
}
```

2. Update jsx-runtime.ts:

```typescript
import type { ComponentCtor, ComponentFn } from './vnode.ts';
type ComponentTag = string | ComponentFn | ComponentCtor | symbol;
```

3. Update jsx-types.d.ts:

```typescript
interface Element {
  tag: string | import('./vnode.ts').ComponentFn | import('./vnode.ts').ComponentCtor | symbol;
}
```

4. Update callComponent() in render-ir.ts to use type guards:

```typescript
function callComponent(tag: VNode['tag'], props, children): unknown {
  if (isComponentCtor(tag)) {
    const instance = new tag();
    // ...
  } else if (isComponentFn(tag)) {
    return tag({ ...props, children });
  }
  return null;
}
```

5. Update renderToDom() in jsx-render-dom.ts similarly.

**Acceptance**:

- Zero `ban-types` suppressions
- All existing tests pass

### Workstream 2: prop.ts WeakMap refactor

**Goal**: Eliminate 21 as-escapes (RC-2 + RC-3 + RC-10)

**Files**: prop.ts, dsd-element.ts

**Changes**:

1. Replace Symbol-keyed properties with WeakMap in prop.ts:

```typescript
const _propSignals = new WeakMap<DsdElement, PropSignalMap>();
const _propUnsubscribers = new WeakMap<DsdElement, Array<() => void>>();
const _ctorMetadata = new WeakMap<Function, PropMetadataStore>();
const _staticPropSignals = new WeakMap<DsdElement, Map<string, PropSignal>>();
const _staticPropUnsubs = new WeakMap<DsdElement, Array<() => void>>();
```

2. Change function signatures from `Record<string, unknown>` to `DsdElement`:

```typescript
export function initializeProps(instance: DsdElement): void {
  const store = _ctorMetadata.get(instance.constructor as Function);
  // ...
  _propSignals.set(instance, sigMap); // Type-safe!
}

export function initializeStaticProps(instance: DsdElement): void {
  // ...
  _staticPropSignals.set(instance, sigMap); // Type-safe!
}
```

3. Update dsd-element.ts to pass `this` directly:

```typescript
// Before
initializeStaticProps(this as unknown as Record<string, unknown>);

// After
initializeStaticProps(this);
```

4. Delete Symbol definitions and accessor types:

- `PROP_SIGNALS`, `PROP_UNSUBSCRIBERS`, `STATIC_PROP_SIGNALS`, `STATIC_PROP_UNSUBS`
- `_PropSignalsAccessor`, `_StaticPropSignalsAccessor`, `_PropMetadataAccessor`, `_PropsCtor`

**Acceptance**:

- 21 as-escapes eliminated
- All existing tests pass
- Prop reactivity works correctly

### Workstream 3: render() → VNode | null

**Goal**: Eliminate `string | VNode` union type

**Files**: dsd-element.ts, render-dsd.ts, types.ts

**Changes**:

1. Change render() return type:

```typescript
// dsd-element.ts
render(): VNode | null { return null; }
```

2. Simplify _renderIntoShadowRoot:

```typescript
private _renderIntoShadowRoot(): void {
  if (!this.shadowRoot) return;
  
  for (const d of this.#effectDisposers) d();
  this.#effectDisposers.clear();
  
  const result = this.render();
  this.#vnodeCache = result;
  this.#vnodeCacheValid = true;
  
  if (result != null) {
    while (this.shadowRoot!.firstChild) {
      this.shadowRoot!.removeChild(this.shadowRoot!.firstChild);
    }
    this.shadowRoot!.appendChild(renderToDom(result, undefined, this.#effectDisposers));
    this._bindEvents(this.shadowRoot!);
  }
}
```

3. Simplify render-dsd.ts:

```typescript
const result = instance.render();
if (result != null) {
  content = await renderDsdTree(result);
} else {
  content = '';
}
```

4. Delete wrongTypeErrorHtml() function.

5. Update types.ts DsdComponent interface:

```typescript
export interface DsdComponent {
  render(): VNode | null;
  // ...
}
```

**Acceptance**:

- 2 isVNode checks eliminated
- ~20 lines deleted
- All existing tests pass

### Workstream 4: SSR stub removal + happy-dom cleanup

**Goal**: Delete `_SsrHTMLElementStub`, remove happy-dom

**Files**: dsd-element.ts, deno.json, test files

**Changes**:

1. Delete _SsrHTMLElementStub class (~30 lines).

2. Use conditional base class:

```typescript
const Base = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export class DsdElement extends Base implements ReactiveHost {
  hasAttribute(name: string): boolean {
    if (typeof HTMLElement !== 'undefined') return super.hasAttribute(name);
    return false;
  }
  getAttribute(name: string): string | null {
    if (typeof HTMLElement !== 'undefined') return super.getAttribute(name);
    return null;
  }
  // ... other DOM methods
}
```

3. Remove happy-dom from deno.json:

```json
// Delete this line
"happy-dom": "npm:happy-dom@^20.8.9",
```

4. Delete or migrate happy-dom tests:

- `packages/core/__tests__/dsd-element-hydration.test.ts`
- `packages/core/__tests__/jsx-render-dom.test.ts`

5. Fix stale comment in dsd-element.ts:77.

**Acceptance**:

- 1 as-escape eliminated
- ~30 lines deleted
- All existing tests pass

### Workstream 5: Remaining type escapes

**Goal**: Eliminate 14 as-escapes (RC-4, RC-5, RC-6, RC-7, RC-9, RC-12)

**Files**: island.ts, signal-context.ts, render-ir.ts, render-dsd.ts, jsx-render-dom.ts, event-hydration.ts

**Changes**:

1. WeakMap for element metadata (RC-4, RC-12):

```typescript
// island.ts
const _elementMetadata = new WeakMap<HTMLElement, ElementMetadata>();
_elementMetadata.set(el, { key: value });

const _islandMetadata = new WeakMap<Function, IslandMetadata>();
_islandMetadata.set(componentClass, { isIsland: true, tagName, layer });
```

2. Align SignalValue<T> with alien-signals (RC-5):

```typescript
// signal-context.ts
import type { Signal } from '@openelement/signals';
type SignalValue<T> = Signal<T>;
```

3. Extend children type for render functions (RC-6):

```typescript
// vnode.ts
type RenderFn = (item: unknown, idx: number) => unknown;
export interface VNode {
  children: (VNode | string | RenderFn)[];
}
```

4. Define DsdComponentConstructor (RC-7):

```typescript
// render-dsd.ts
export type DsdComponentConstructor = new () => DsdComponent & {
  styles?: StyleSheetLike;
  tagName?: string;
};
```

5. Use CSSStyleSheet[] directly (RC-9):

```typescript
// dsd-element.ts
target.adoptedStyleSheets = sheets as CSSStyleSheet[];
```

**Keep with comment** (3 escapes, fundamental limitations):

- RC-11: Dynamic method lookup in dsd-element.ts:453
- RC-13: connectedCallback replacement in island.ts:375
- RC-14: globalThis browser API detection in island.ts:243

**Acceptance**:

- 14 as-escapes eliminated
- 3 as-escapes kept with comments
- All existing tests pass

## Verification

After each workstream:

1. `deno fmt`
2. `deno lint`
3. `deno task test` (1317 tests must pass)

After all workstreams:

1. `deno task typecheck` (19/19 packages)
2. `deno task build` (SSG build)
3. `deno task graph:check`

## Exit Criteria

- `as unknown as`: 42 → 3 (remaining 3 with comments)
- `ban-types`: 3 → 0
- `render()` type: `string | VNode` → `VNode | null`
- SSR layer: `_SsrHTMLElementStub` deleted, happy-dom deleted
- Symbol-keyed properties: all replaced with WeakMap
- All 1317 tests pass
- All 19 packages bumped to v0.30.0

## Risks

**Workstream 2 (WeakMap refactor)** is highest risk:

- Changes internal storage mechanism for prop signals
- Could break prop reactivity if done incorrectly
- Requires careful testing

**Mitigation**: Run tests after each workstream. If Workstream 2 tests fail, defer to v0.30.1.
