# SOP-008: www Cleanliness & Framework Dependency

> Version: v0.23.0  
> Priority: P1  
> Status: IN PROGRESS  
> Depends on: SOP-007 (DSD Hydration)

## Objective

Ensure the www documentation site is clean, minimal, and leverages framework capabilities wherever possible. Eliminate workarounds, redundancy, and patterns that bypass the framework's intended design.

## Current Problems

From the v0.23.0 audit (`docs/conversation/20260527/20260527-framework-audit-v0.23.0.md`):

| # | Problem | Severity | Status |
|---|---------|----------|--------|
| 1 | less-layout contains www-specific hardcoded content (icons, footer) | P2 | PARTIAL |
| 2 | "home" attribute used by non-home pages (contributing, changelog, 404, roadmap) | P2 | OPEN |
| 3 | 47 route files repeat `JSON.stringify(navSections)` / `JSON.stringify(headerNav)` | P2 | OPEN |
| 4 | react-showcase / media-chrome-showcase don't use DsdElement styles | P1 | DEFERRED |
| 5 | SEARCH_DSD injection bypassing SSG pipeline | P0 | ✅ FIXED |
| 6 | Search placed three different ways across routes | P1 | ✅ FIXED |
| 7 | contributing.ts duplicate pageStyles | P2 | ✅ FIXED |
| 8 | 404.ts dead pageSheet code | P2 | ✅ FIXED |
| 9 | nav-filter.ts legacy aliases unmarked | P2 | ✅ FIXED |

## Procedure

### Step 1: Make less-layout footer text configurable

**File**: `packages/ui/src/less-layout.ts`

- [ ] Add `footer-text` attribute (string, default: current marketing text)
- [ ] Move footer text from hardcoded to attribute-driven
- [ ] Keep sensible default for generic use

**Acceptance**: Footer text can be configured per-page via HTML attribute without modifying framework code.

### Step 2: Rename "home" → "full-width"

**File**: `packages/ui/src/less-layout.ts`  
**Affected files**: `index/index.ts`, `contributing.ts`, `changelog.ts`, `404.ts`, `roadmap.ts`

- [ ] Add `full-width` boolean attribute (same behavior as current `home`)
- [ ] Keep `home` attribute as deprecated alias (reads same _getBool)
- [ ] Update all 5 route files to use `full-width` instead of `home`
- [ ] Update CSS selectors: `[home]` → `[full-width], [home]`

**Acceptance**: "home" attribute still works (backward compat), "full-width" is the new canonical name. All current usages updated.

### Step 3: Route boilerplate reduction

**File**: `www/app/shared/route-helpers.ts` (new)

- [ ] Create `createLayoutAttrs()` helper that returns common less-layout attribute strings
- [ ] Returns: `locale`, `locales`, `nav-items`, `header-nav`, `current-path` as formatted attribute string
- [ ] Route files call: `` `<less-layout ${createLayoutAttrs(this, { currentPath: '/guide/foo' })}>` ``

**Acceptance**: Route files reduced from ~10 lines of attribute boilerplate to 1 function call. All tests pass.

## Quality Gates

| Gate | Criteria |
|------|----------|
| G1 | less-layout footer configurable via attribute |
| G2 | "full-width" canonical, "home" backward-compatible |
| G3 | Route helper reduces attribute boilerplate |
| G4 | No new framework bypasses introduced |
| G5 | All existing e2e tests pass |
| G6 | SSG build produces correct output for all pages |
