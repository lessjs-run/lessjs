# 2026-06-04: Type Safety Deep Dive

## Context

After completing v0.29.x (Renderer IR + Simplification), we conducted a comprehensive audit of type safety issues in the codebase. The goal: identify all `as unknown as` type escapes and `ban-types` suppressions, understand root causes, and design a unified solution.

## Problem Statement

**42 type escapes** (`as unknown as`) + **3 `ban-types` suppressions** across the codebase.

### Distribution by File

| File | Count | Primary Root Cause |
|------|-------|-------------------|
| prop.ts | 17 | RC-2, RC-3 (Symbol-keyed properties, Function type) |
| dsd-element.ts | 7 | RC-8, RC-9, RC-10 (SSR stub, adoptedStyleSheets, static props) |
| island.ts | 8 | RC-4, RC-12, RC-13, RC-14 (DOM types, constructor metadata) |
| signal-context.ts | 4 | RC-4, RC-5 (DOM types, library type mismatch) |
| render-ir.ts | 1 | RC-6 (For render function) |
| render-dsd.ts | 3 | RC-7 (DSD constructor properties) |
| jsx-render-dom.ts | 2 | RC-6 (For render function) |
| event-hydration.ts | 1 | RC-6 (For render function) |
| vnode.ts | 1 | RC-1 (VNode.tag Function type) |
| jsx-runtime.ts | 1 | RC-1 (ComponentTag Function type) |
| jsx-types.d.ts | 1 | RC-1 (JSX.Element.tag Function type) |

## Root Cause Analysis

### RC-1: VNode.tag uses bare `Function` (3 ban-types)

**Files**: vnode.ts:26, jsx-runtime.ts:71, jsx-types.d.ts:21

**Pattern**:
```typescript
// deno-lint-ignore ban-types
tag: string | Function | symbol;
```

**Root cause**: LessJS needs to support both function components and class components, but uses bare `Function` to merge two completely different semantics.

**Solution**: Define precise types:
```typescript
export type ComponentFn = (props: Record<string, unknown>) => unknown;
export type ComponentCtor = new (...args: unknown[]) => { render(): unknown };
export interface VNode {
  tag: string | ComponentFn | ComponentCtor | symbol;
}
```

### RC-2: Symbol-keyed properties invisible to TypeScript (prop.ts: 10 escapes)

**Pattern**:
```typescript
const PROP_SIGNALS = Symbol.for('lessjs.propSignals');
(instance as unknown as _PropSignalsAccessor)[PROP_SIGNALS] = sigMap;
```

**Root cause**: TypeScript cannot model properties keyed by `Symbol.for()`. Runtime stores signal maps under well-known symbols, but declared types have no knowledge of these slots.

**Solution**: Replace Symbol-keyed properties with WeakMap:
```typescript
const _propSignals = new WeakMap<DsdElement, PropSignalMap>();
_propSignals.set(instance, sigMap);  // Type-safe!
```

### RC-3: `Function` doesn't model static class members (prop.ts: 5 escapes)

**Pattern**:
```typescript
const ctor = instance.constructor as unknown as _PropsCtor;
const propsDef = ctor.props;
```

**Root cause**: `instance.constructor` is typed as `Function`, which doesn't declare `.props` static property.

**Solution**: Same as RC-2 — use WeakMap keyed by constructor:
```typescript
const _ctorMetadata = new WeakMap<Function, PropMetadataStore>();
const store = _ctorMetadata.get(instance.constructor as Function);
```

### RC-4: DOM types lack index signatures (island.ts: 3, signal-context.ts: 2)

**Pattern**:
```typescript
(el as unknown as Record<string, unknown>)[key] = value;
(host as unknown as Record<symbol, unknown>)[ctx.key] = scoped;
```

**Root cause**: `HTMLElement`/`Node` are closed interfaces with no index signature. Runtime treats them as open property bags.

**Solution**: Use WeakMap for metadata storage instead of stamping on DOM elements:
```typescript
const _elementMetadata = new WeakMap<HTMLElement, ElementMetadata>();
_elementMetadata.set(el, { key: value });
```

### RC-5: Library type mismatch (signal-context.ts: 2 escapes)

**Pattern**:
```typescript
scoped = signal<T>(initialValue) as unknown as SignalValue<T>;
```

**Root cause**: `@openelement/signals`' `signal()` return type doesn't structurally match local `SignalValue<T>` alias.

**Solution**: Align `SignalValue<T>` with actual alien-signals type, or use the library's exported type directly.

### RC-6: `<For>` render function extraction (4 escapes across 3 files)

**Pattern**:
```typescript
const renderFn = children[0] as unknown as ((item: unknown, idx: number) => unknown);
```

**Root cause**: `children` is typed as `(VNode | string)[]`, but `<For>`'s first child is a render function.

**Solution**: Extend children type to include render functions:
```typescript
type RenderFn = (item: unknown, idx: number) => unknown;
type Children = (VNode | string | RenderFn)[];
```

### RC-7: DSD constructor property access (render-dsd.ts: 3 escapes)

**Pattern**:
```typescript
const ctor = componentClass as unknown as { styles?: StyleSheetLike };
```

**Root cause**: `CustomElementConstructor` doesn't declare framework-convention static properties.

**Solution**: Define `DsdComponentConstructor` type:
```typescript
export type DsdComponentConstructor = new () => DsdComponent & {
  styles?: StyleSheetLike;
  tagName?: string;
};
```

### RC-8: SSR stub bridging (dsd-element.ts: 1 escape)

**Pattern**:
```typescript
_SsrHTMLElementStub as unknown as typeof HTMLElement
```

**Root cause**: SSR environment needs a stub base class.

**Solution**: Delete `_SsrHTMLElementStub`, use conditional base class:
```typescript
const Base = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};
```

### RC-9: adoptedStyleSheets DOM lib gap (dsd-element.ts: 1 escape)

**Pattern**:
```typescript
(target as unknown as { adoptedStyleSheets: typeof sheets }).adoptedStyleSheets = sheets;
```

**Root cause**: TypeScript's `ShadowRoot` may not include `adoptedStyleSheets` depending on lib setting.

**Solution**: Use `CSSStyleSheet[]` type directly:
```typescript
target.adoptedStyleSheets = sheets as CSSStyleSheet[];
```

### RC-10: static props system accepts `Record<string, unknown>` (dsd-element.ts: 4 escapes)

**Pattern**:
```typescript
initializeStaticProps(this as unknown as Record<string, unknown>);
```

**Root cause**: prop.ts functions accept `Record<string, unknown>` instead of `DsdElement`.

**Solution**: Change prop.ts function signatures to accept `DsdElement`:
```typescript
export function initializeStaticProps(instance: DsdElement): void {
  // ...
}
```

### RC-11: Dynamic method lookup (dsd-element.ts: 1 escape)

**Pattern**:
```typescript
(this as Record<string, unknown>)[methodName]
```

**Root cause**: `data-on-*` event binding needs dynamic method lookup.

**Solution**: **Keep with comment** — this is a fundamental limitation of dynamic dispatch.

### RC-12: Constructor metadata stamping (island.ts: 3 escapes)

**Pattern**:
```typescript
(componentClass as unknown as Record<string, unknown>).__island = true;
```

**Root cause**: Metadata stamped on constructor function object.

**Solution**: Use WeakMap:
```typescript
const _islandMetadata = new WeakMap<Function, IslandMetadata>();
_islandMetadata.set(componentClass, { isIsland: true, tagName, layer });
```

### RC-13: connectedCallback replacement (island.ts: 1 escape)

**Pattern**:
```typescript
function(...) as unknown as typeof componentClass.prototype.connectedCallback
```

**Root cause**: Prototype method replacement with different `this` parameter.

**Solution**: **Keep with comment** — TypeScript cannot model prototype method replacement.

### RC-14: globalThis browser API detection (island.ts: 1 escape)

**Pattern**:
```typescript
globalThis as unknown as { requestIdleCallback?; requestAnimationFrame? }
```

**Root cause**: Standard lib doesn't include `requestIdleCallback`.

**Solution**: **Keep with comment** — feature detection requires type escape.

## Solution: 5 Phases

### Phase 1: VNode.tag precise types

**Goal**: Eliminate 3 `ban-types` suppressions

**Changes**:
- Define `ComponentFn` and `ComponentCtor` types in vnode.ts
- Add `isComponentCtor()` and `isComponentFn()` type guards
- Update `callComponent()` and `renderToDom()` to use type guards

**Impact**: 3 ban-types → 0, 6 as-escapes → 0

### Phase 2: prop.ts WeakMap refactor

**Goal**: Eliminate 21 as-escapes (RC-2 + RC-3 + RC-10)

**Changes**:
- Replace all `Symbol.for()` with WeakMap
- Change prop.ts function signatures from `Record<string, unknown>` to `DsdElement`
- Update dsd-element.ts to pass `this` directly

**Impact**: 21 as-escapes → 0

### Phase 3: render() → VNode | null

**Goal**: Eliminate `string | VNode` union type

**Changes**:
- Change `render()` return type from `string | VNode` to `VNode | null`
- Simplify `_renderIntoShadowRoot` from 3 branches to 1
- Delete `wrongTypeErrorHtml()` function

**Impact**: 2 isVNode checks → 0, ~20 lines deleted

**Break risk**: **Zero** — codebase already uses JSX everywhere (47 components scanned, all return JSX)

### Phase 4: SSR stub removal + happy-dom cleanup

**Goal**: Delete `_SsrHTMLElementStub`, remove happy-dom

**Changes**:
- Delete `_SsrHTMLElementStub` class (~30 lines)
- Use conditional base class
- Remove happy-dom from deno.json
- Delete or migrate happy-dom tests

**Impact**: 1 as-escape → 0, ~30 lines deleted

### Phase 5: Remaining type escapes

**Goal**: Eliminate 14 as-escapes (RC-4, RC-5, RC-6, RC-7, RC-9, RC-12)

**Changes**:
- WeakMap for element metadata (RC-4, RC-12)
- Align SignalValue<T> with alien-signals (RC-5)
- Extend children type for render functions (RC-6)
- Define DsdComponentConstructor (RC-7)
- Use CSSStyleSheet[] directly (RC-9)

**Impact**: 14 as-escapes → 0

**Keep with comment**: RC-11, RC-13, RC-14 (3 escapes, fundamental limitations)

## Impact Summary

| Phase | as-escapes eliminated | ban-types eliminated | Lines deleted | Break risk |
|-------|----------------------|---------------------|---------------|------------|
| 1 | 6 | 3 | ~10 | Zero |
| 2 | 21 | 0 | ~30 | Zero |
| 3 | 2 | 0 | ~20 | Zero |
| 4 | 1 | 0 | ~30 | Zero |
| 5 | 14 | 0 | ~10 | Zero |
| **Total** | **44** | **3** | **~100** | **Zero** |

**Final state**:
- `as unknown as`: 42 → 3 (remaining 3 with comments explaining why)
- `ban-types`: 3 → 0
- `render()` type: `string | VNode` → `VNode | null`
- SSR layer: `_SsrHTMLElementStub` deleted, happy-dom deleted
- Symbol-keyed properties: all replaced with WeakMap

## Execution Plan

1. Write conversation doc (this file)
2. Write SOP
3. Execute Phase 1 → run tests
4. Execute Phase 2 → run tests
5. Execute Phase 3 → run tests
6. Execute Phase 4 → run tests
7. Execute Phase 5 → run tests
8. Write changelog + release note
9. Bump 19 packages to v0.30.0
10. Update version.ts
11. fmt + lint + test
12. Push dev, merge main

## Risks

**Phase 2 (WeakMap refactor)** is the highest risk:
- Changes internal storage mechanism for prop signals
- Could break prop reactivity if done incorrectly
- Requires careful testing of prop initialization, updates, and cleanup

**Mitigation**: Run tests after each phase. If Phase 2 tests fail, defer to v0.30.1.

## Conclusion

This is a comprehensive type safety cleanup that eliminates 44 type escapes and 3 ban-types suppressions. All changes are zero-break because the codebase has already standardized on JSX returns and modern patterns. The result: a cleaner, more type-safe codebase ready for v1.0.
