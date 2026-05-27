# SOP-009: Framework Core Cleanliness

> Version: v0.23.0  
> Priority: P1  
> Status: IN PROGRESS  
> Depends on: ADR-0039 (DsdElement), ADR-0050 (Package Architecture)

## Objective

Ensure the LessJS framework core is clean, consistent with its original spirit (Web Standards-first, DSD-first, low-magic, deterministic), and free of redundant or duplicated logic.

## Current Problems

From the v0.23.0 audit:

| # | Problem | Severity | Status |
|---|---------|----------|--------|
| 1 | `_propagateTheme()` in less-layout should be a DsdElement capability | P1 | OPEN |
| 2 | No explicit lifecycle hooks for DSD vs CSR paths | P1 | OPEN |
| 3 | Island loading `visible` strategy limited to open shadow roots | P2 | DOCUMENTED |
| 4 | `app` facade still imports `adapter-vite/build-context` | P1 | DEFERRED (ADR-0050) |
| 5 | `less-layout` hardcoded www-specific icons/text in framework package | P2 | → SOP-008 |

## Procedure

### Step 1: Promote theme propagation to DsdElement

**Files**: `packages/core/src/dsd-element.ts`, `packages/ui/src/less-layout.ts`

- [ ] Add `static themeable = false` to DsdElement (opt-in for components that need theme propagation)
- [ ] Add `_syncTheme(theme: string)` method to DsdElement: sets `data-theme` on self + walks child custom elements in light DOM + shadow DOM
- [ ] less-layout's `_propagateTheme()` delegates to DsdElement's `_syncTheme()` for self + children
- [ ] less-layout's `_propagateTheme()` keeps only the "walk into slotted content" logic (which requires knowledge of slot projection)

**Acceptance:**
- [ ] Theme toggle → all DsdElement components with `static themeable = true` receive `data-theme`
- [ ] less-layout's theme propagation still works for slotted content
- [ ] No performance regression (walk is O(n) as before)

### Step 2: Add explicit lifecycle hooks

**File**: `packages/core/src/dsd-element.ts`

- [ ] Add `onDsdHydrated()` hook → called after `_bindCurrentRenderTemplate()` completes in DSD path
- [ ] Add `onCsrRendered()` hook → called after `_renderIntoShadowRoot()` completes in CSR path
- [ ] Both hooks are no-ops by default; subclasses override as needed
- [ ] Update `_hydrateOrRender()` to call the appropriate hook
- [ ] Deprecate pattern of calling `super.connectedCallback()` + `this.update()` in order-dependent way (see `less-theme-toggle`)

**Acceptance:**
- [ ] `less-theme-toggle` can use `onDsdHydrated()` instead of `connectedCallback() + update()`  
- [ ] Order of `super.connectedCallback()` relative to subclass code no longer matters for DSD hydration

### Step 3: Document island loading limitations

**File**: `docs/guide/islands.md` or `packages/adapter-vite/README.md`

- [ ] Document that `visible` strategy uses `document.querySelectorAll()` which cannot see into closed shadow roots
- [ ] Document that all LessJS components use open shadow roots by default
- [ ] Add note about `mode: 'closed'` being incompatible with island auto-detection

**Acceptance:**
- [ ] Documentation exists and is clear
- [ ] No code changes needed (current behavior is correct for open shadow roots)

## Quality Gates

| Gate | Criteria |
|------|----------|
| G1 | DsdElement.themeable opt-in mechanism exists and is documented |
| G2 | onDsdHydrated / onCsrRendered hooks work correctly |
| G3 | less-theme-toggle migrated to use onDsdHydrated |
| G4 | Theme propagation no regression |
| G5 | Island loading documentation updated |
| G6 | All existing tests pass |
