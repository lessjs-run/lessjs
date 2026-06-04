# ADR-0079: v0.29.6 Architecture Debt Closure

- Status: Accepted
- Date: 2026-06-04
- Target: v0.29.6
- Supersedes: ADR-0058 (Remove TemplateResult) — removal of `render(): string` path
- References: ADR-0044 (SSR polyfill), ADR-0078 (core simplification)

## Context

v0.29.x is the architecture cleanup arc. Previous releases eliminated:

- v0.29.0: Structured RenderNode IR
- v0.29.1: Core simplification (33→26 files, async-only render path)
- v0.29.5: Ban-types elimination, WeakMap replaces Symbol.for(), happy-dom removal

A comprehensive byte-level audit of the entire repository found remaining debt:

- 42 `as unknown as` type escapes in core (12 are TS language limits, 30 are eliminable)
- ~250 lines of duplicated logic across packages
- `render(): string` legacy path in DsdElement (ADR-0058 explicitly preserved it, but context has changed)
- 20+ hardcoded version strings in hub

## Decision

v0.29.6 eliminates all eliminable type escapes, all code duplication, and closes the `render(): string` path.

### Superseding ADR-0058

ADR-0058 (2026-05-29) preserved `render(): string` as an "escape hatch" for third-party WC adapters. The context was:

- JSX had just been introduced (v0.24.1)
- TemplateResult was being removed
- It was unknown how many components used strings

**Today's context is different:**

- All 47 real components return JSX (VNode)
- String returns exist only in test mock classes
- Third-party WC adapters (Lit/Vanilla) handle string conversion at their boundary, not in core
- The `render(): string` path adds 3 branches (`isVNode`/`typeof string`/fallback) in two hot rendering paths

**Decision:** Remove the `render(): string` path. Core accepts only `VNode | null`. Adapters handle string conversion at their boundary.

### Type Escape Elimination

| Root Cause                              | Count | Fix                                |
| --------------------------------------- | ----- | ---------------------------------- |
| island.ts constructor metadata stamping | 3     | WeakMap                            |
| signal-context.ts DOM stamping          | 2     | WeakMap                            |
| DSD constructor static property access  | 5     | `DsdComponentConstructor` type     |
| `<For>` render function extraction      | 4     | `VNode.children` + `RenderFn` type |
| signals library type mismatch           | 2     | Use library type directly          |
| compat-check `as any`                   | 1     | Proper typing                      |
| cem-parser double cast                  | 1     | Discriminated union                |
| content RouteMeta cast                  | 1     | Remove unnecessary cast            |
| adapter styles property access          | 2     | Interface type                     |
| adapter-vite Plugin cast                | 1     | Type assertion                     |

**Remaining escapes (TS language limits, documented with comments):**

- Symbol-keyed access on HTMLElement (signal-context.ts tree walk)
- Mixin pattern `Constructor<T>` (all 3 adapters)
- JSX children ambiguous typing in special VNodes
- CustomElementConstructor DOM lib mismatch

### Code Deduplication

| Duplication                                   | Saves      | Fix                 |
| --------------------------------------------- | ---------- | ------------------- |
| `classifyCemManifest` (compat-check + cem)    | ~30 lines  | cem as canonical    |
| `CompatibilityClassification` (3 definitions) | ~40 lines  | core adds `reason?` |
| `htmlEscape`/`escapeAttr` (4 implementations) | ~30 lines  | Import from core    |
| `loadRecords()` (2 CLI tools)                 | ~30 lines  | Shared util         |
| `renderPlaceholder()` (2 snapshot renderers)  | ~10 lines  | Shared util         |
| `jsrNames`/`PKG_DIR_MAP` duplicate            | ~10 lines  | Unified             |
| adapter DSD hydration mixin (~150 lines)      | ~150 lines | Extract to shared   |

### Hub Constants Centralization

- `validatorVersion: '0.19.0'` (20+ occurrences)
- Shoelace version `'2.20.1'` (5 occurrences)
- `@lessjs/ui` version `'0.29.0'` (1 occurrence)
- Deno cache paths (2 occurrences)

All moved to `packages/hub/src/constants.ts`.

## Consequences

### Positive

- `as unknown as`: core 42→12, adapter 15→3
- `as any` in production: 1→0
- ~350 lines deleted (duplication + unnecessary code)
- Single canonical source for duplicated logic
- Clean rendering pipeline: `VNode → IR → serialize → HTML`
- v0.29.x cleanup arc is complete

### Negative

- `render(): string` removed — BREAKING for any user who returns strings from `render()`
  - Mitigation: 47 real components already use JSX. Migration path: `return '<div>'` → `return jsx('div', {})` or use adapter layer

### Neutral

- ADR-0058 is partially superseded (only the `string` path decision)
- ADR-0044 SSR 3-layer polyfill is preserved (stub class remains, now anonymous)

## Non-Goals

- No new public API
- No router changes
- No UI component changes
- daisyUI fork deferred to v0.31.0
