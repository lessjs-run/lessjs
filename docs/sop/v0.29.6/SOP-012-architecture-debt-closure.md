# SOP-012: v0.29.6 Architecture Debt Closure

> Version: v0.29.6
> Date: 2026-06-04
> Status: Completed
> ADR: ADR-0079
> Output: Type escapes 42→12, ~350 lines deleted, all duplication resolved

## Summary

Close all remaining architecture debt in the v0.29.x arc. Eliminate 30 type escapes, ~250 lines of duplicate code, 20+ hardcoded values, and the legacy `render(): string` path.

## Entry Criteria

- v0.29.5 on main
- All tests pass
- Working tree clean

## Workstreams

### W1: Render path cleanup

- Delete `render()` string branches in render-dsd.ts, dsd-element.ts
- Delete `wrongTypeErrorHtml` function
- Update test mocks from string to VNode

### W2: Type escape elimination

- island.ts → WeakMap (3 escapes)
- signal-context.ts → WeakMap (2 escapes)
- Add DsdComponentConstructor type (5 escapes)
- Add RenderFn to VNode.children (4 escapes)
- signals type alignment (2 escapes)
- adapter styles cast fix ×2
- adapter-vite Plugin cast fix
- compat-check as-any fix
- cem-parser type cast fix
- scanner RouteMeta cast removal

### W3: Code deduplication

- htmlEscape/escapeAttr (3 files)
- loadRecords() (2 files)
- renderPlaceholder() (2 files)
- classifyCemManifest (2 files)
- CompatibilityClassification (3 files)
- create CLI map duplicate
- isValidTagName re-export removal
- LessBuildContext alias removal

### W4: Hub constants centralization

- Create packages/hub/src/constants.ts
- Migrate all hardcoded versions

### W5: Adapter dedup

- Extract shared DSD hydration logic to core

## Verification

- `deno task fmt:check`
- `deno task lint`
- `deno task typecheck`
- `deno task test`
- `deno task build`

## Exit Criteria

- All 28 items complete
- All tests pass
- Build succeeds with DSD verification
- 19 packages bumped to 0.29.6
