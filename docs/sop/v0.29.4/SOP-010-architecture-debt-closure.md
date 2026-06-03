# SOP-010: v0.29.4 Architecture Debt Closure

> Version: v0.29.4
> Date: 2026-06-03
> Status: Planned
> Output: callComponent prototype filter, renderDsd lightDom IR support, mergeDsdHostHtmlWithLightDom deleted

## Summary

Close the last two architecture debts:

1. Add `DANGEROUS_KEYS` filter to `callComponent()` in `render-ir.ts`.
2. Pass light DOM children through `renderDsd()` at IR level, eliminating fragile string manipulation in `mergeDsdHostHtmlWithLightDom`.

## Entry Criteria

- v0.29.3 is on `main`.
- All existing tests pass.
- Working tree is clean aside from the `callComponent` fix.

## Workstream 1: callComponent prototype pollution

### Problem

`callComponent()` assigns props to class component instances without filtering `__proto__`, `constructor`, `prototype`. SSR path via `injectProps()` already has this guard.

### Steps

1. Import `DANGEROUS_KEYS` from `security.ts` in `render-ir.ts`.
2. Add `if (DANGEROUS_KEYS.has(key)) continue;` before prop assignment.

### Acceptance

- `__proto__`, `constructor`, `prototype` keys are skipped.
- All existing tests pass.

## Workstream 2: renderDsd lightDom at IR level

### Problem

`renderDsd()` returns `RenderOutput { html: string }`. `renderToNode` then calls `mergeDsdHostHtmlWithLightDom` which does fragile string manipulation (`lastIndexOf('</tag>')` on HTML).

### Steps

1. Add `lightDom?: RenderNode[]` to `RenderDsdOptions`.
2. Pass `lightDom` through to `wrapDsdOutput`.
3. `wrapDsdOutput` uses `lightDom` in `dsdHostNode.light` field.
4. In `renderToNode`, pass `childNodes` as `lightDom` to `renderDsd`.
5. Delete `mergeDsdHostHtmlWithLightDom` function.

### Acceptance

- `mergeDsdHostHtmlWithLightDom` is deleted.
- No string manipulation on rendered HTML.
- Light DOM children render correctly through the IR.
- All existing SSG output tests pass.

## Verification

- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task test`
- `deno task build`
- SSG output fixture comparison

## Exit Criteria

- `callComponent` has prototype pollution filter.
- `mergeDsdHostHtmlWithLightDom` is deleted.
- All tests pass.
- Architecture debt is closed.
