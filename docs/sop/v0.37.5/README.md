# v0.37.5 SOP: Protocol Ports + DaisyUI Coverage Completion

> Status: Active\
> Roadmap: Four-Product Validation Train\
> Depends on: v0.37.0-v0.37.4

## Goal

Complete daisyUI interactive component coverage and migrate protocol types
out of implementation packages into `@openelement/protocols`.

## Entry Criteria

- v0.37.4 Pure CSS UI Foundation is complete (daisyClassSheet, tokens, theme,
  3 thin-shell proof-of-concept components).
- Existing protocol types (RendererProtocol, IslandConfig, HydrationStrategy,
  SignalEngine, SignalLike, DataAdapter) have been identified in their source
  packages.
- The signal → host attribute → `:host([attr])` CSS pattern is validated.

## ADR Links

- ADR-0091: Four-Product Platform Roadmap.
- ADR-0077: Structured Render IR and Single Renderer Pipeline.
- ADR-0025: Renderer Protocol.
- ADR-0093: SSR / ISR Runtime Contract.
- ADR-0095: Data / Database Boundary.

## Step-by-Step Tasks

### A. daisyUI Interactive Completion (12 components)

1. [ ] collapse (accordion): DsdElement thin shell, signal `#open` index,
       `:host([data-open])` CSS
2. [ ] drawer: DsdElement thin shell, signal `#open`, slide-from-left with
       backdrop
3. [ ] carousel: DsdElement thin shell, signal `#index`, snap-scroll +
       prev/next buttons
4. [ ] swap: DsdElement thin shell, signal `#active`, two-face toggle with
       rotation
5. [ ] toast: DsdElement thin shell, signal `#toasts[]`, position-fixed stack
       with auto-dismiss
6. [ ] navbar: DsdElement thin shell, responsive collapse menu
7. [ ] footer: pure CSS component (no interaction, just layout)
8. [ ] indicator: pure CSS component (badge positioning on avatars/icons)
9. [ ] skeleton: already in v0.37.4 daisy-classes.css — no additional work
10. [ ] loading: already in v0.37.4 daisy-classes.css — no additional work
11. [ ] chat bubble: pure CSS component
12. [ ] toggle (theme switch wrapper): DsdElement thin shell

### B. Form Enhancement Components (4 components)

1. [ ] checkbox: DsdElement thin shell, signal `#checked`, custom
       ::before/::after
2. [ ] radio: DsdElement thin shell, signal `#checked`, radio group via slot
3. [ ] range: DsdElement thin shell, signal `#value`, custom track/fill via CSS
4. [ ] file-input: DsdElement thin shell, signal `#file`, drag-and-drop zone

### C. Protocol Type Migration

1. [ ] Migrate `RendererProtocol` (from `core/src/render-schemas.ts`)
2. [ ] Migrate `IslandConfig` / `HydrationStrategy` (from `app/src/authoring.ts`,
       `core/src/schemas.ts`)
3. [ ] Migrate `SignalEngine` / `SignalLike` (from `signals/src/types.ts`,
       `core/src/signal-like.ts`)
4. [ ] Migrate `DataAdapter` (from `core/src/data.ts`)
5. [ ] Write ADR for `EntryDescriptor` route manifest contract
6. [ ] Add exportable conformance test suites: `runRendererConformance(impl)`

### D. Documentation & Release

1. [ ] Update workflow and status docs for v0.37.5.
2. [ ] Run full release gate (fmt, lint, typecheck, test, build, graph, arch,
       docs, autoflow, dsd, publish dry-run).

## Verification

- All 16 daisyUI interactive/form components render in browser smoke tests.
- Protocol type imports resolve from `@openelement/protocols` without breaking
  existing consumers (re-exports from original locations).
- `runRendererConformance(impl)` test suite passes against the core renderer.
- No new package cycles (`graph:check`).
- Architecture contract check passes.
- Docs strategy check passes.

## Non-Goals

- No new external dependencies.
- No package split or merge (protocol types are migrated via re-exports).
- No Tailwind runtime.
- No theme system changes (Open Props already covers this).
- No database, ORM, or auth ownership.
- No full Deno/Node or Hono/Express equivalence claims.

## Exit Criteria

- All daisyUI interactive components have DsdElement thin shells using the
  established signal → host attribute pattern.
- Form enhancement components (checkbox, radio, range, file-input) are
  functional with signal state management.
- Five protocol types are migrated into `@openelement/protocols` with
  backward-compatible re-exports.
- EntryDescriptor ADR is written and accepted.
- Conformance test suites exist for RendererProtocol.
- v0.37.6 can build on completed interactive UI and protocol surfaces.

## AutoFlow Boundary

AutoFlow may check component smoke tests and protocol conformance suite
results. It must not select protocol package names, declare substitution
support without proof, or approve ADRs.
