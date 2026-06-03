# SOP-011: v0.29.5 Type Safety & SSR Cleanup

> Version: v0.29.5
> Date: 2026-06-04
> Status: Completed
> Output: Ban-types eliminated, WeakMap replaces Symbol.for(), render() tightens to VNode, SSR stub removed

## Summary

Type safety and SSR cleanup: eliminate `ban-types` suppressions, replace symbol-keyed prop storage with WeakMap, tighten `render()` to VNode-only, remove SSR stub class and happy-dom dependency.

## Workstreams

### 1: VNode.tag precise types

- Define `ComponentFn` and `ComponentCtor` types
- Add `isComponentCtor()` and `isComponentFn()` type guards
- Update all component call sites
- Eliminate 3 ban-types suppressions

### 2: prop.ts WeakMap refactor

- Replace 5 Symbol.for() with 5 WeakMap
- Change function signatures to DsdElement
- Eliminate 21 type escapes
- Delete 4 accessor types

### 3: render() → VNode | null

- Change render() return type
- Simplify _renderIntoShadowRoot to 1 branch
- Update _renderErrorFallback

### 4: SSR cleanup

- Remove _SsrHTMLElementStub
- Remove happy-dom dependency
- Add SSR-safe DOM method overrides

### 5: Remaining escapes

- Fix adoptedStyleSheets type escape

## Verification

- Core tests: 161 passed, 0 failed
- fmt, lint, typecheck, build all passed
- 19 packages bumped to 0.29.5
