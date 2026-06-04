# SOP-011: Build & Bundle Verification

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Depends on**: SOP-009 (all components migrated), SOP-010 (CSS Parts)
> **Estimated time**: 0.3 day
> **Complexity**: 🟢 Low

---

## Objective

Verify that the v0.20.0 migration delivers the promised improvements:

1. **Bundle size reduction**: ≥ 6KB gzip removed (Lit)
2. **Zero Lit imports**: All 9 DSD components are Lit-free
3. **SSR output integrity**: HTML output identical to v0.19
4. **Build succeeds**: Full SSG build passes without errors

---

## Step 1: Bundle Size Comparison

### Generate v0.19.0 baseline

```bash
cd packages/ui
# Build with Lit dependencies
deno task build
# Measure
gzip -c dist/less-ui.js | wc -c
```

### Generate v0.20.0 target

```bash
cd packages/ui
# Build after migration (Lit removed from DSD components)
deno task build
gzip -c dist/less-ui.js | wc -c
```

### Expected results

| Metric                | v0.19 (Lit) | v0.20 (Native)               | Target        |
| --------------------- | ----------- | ---------------------------- | ------------- |
| UI JS gzip            | ~12KB       | ≤ 6KB                        | **-50%**      |
| Lit in bundle         | 6KB         | 0 (DSD) + X (hero-ping only) | **DSD: zero** |
| adapter-lit in bundle | 4KB         | 0 (DSD) + 4KB (hero-ping)    | **DSD: zero** |

---

## Step 2: Import Audit

Verify zero Lit imports in DSD components:

```bash
# Should return NO results (except hero-ping)
grep -r "from 'lit'" packages/ui/src/less-card.ts
grep -r "from 'lit'" packages/ui/src/less-callout.ts
grep -r "from 'lit'" packages/ui/src/less-step-card.ts
grep -r "from 'lit'" packages/ui/src/less-button.ts
grep -r "from 'lit'" packages/ui/src/less-input.ts
grep -r "from 'lit'" packages/ui/src/less-code-block.ts
grep -r "from 'lit'" packages/ui/src/less-theme-toggle.ts
grep -r "from 'lit'" packages/ui/src/less-dialog.ts
grep -r "from 'lit'" packages/ui/src/less-layout.ts
grep -r "from 'lit'" packages/ui/src/less-search.ts

# This ONE should return results:
grep -r "from 'lit'" packages/ui/src/less-hero-ping.ts
```

```bash
# Should return NO results (except hero-ping)
grep -r "from '@openelement/adapter-lit'" packages/ui/src/less-card.ts
# ... same for all 9 DSD components ...

# This ONE should return results:
grep -r "from '@openelement/adapter-lit'" packages/ui/src/less-hero-ping.ts
```

```bash
# Should ALL return results:
grep -r "from '@openelement/core'" packages/ui/src/less-card.ts
grep -r "from '@openelement/core'" packages/ui/src/less-button.ts
# ... all 9 DSD components ...
```

---

## Step 3: deno.json Dependency Audit

Verify `packages/ui/deno.json`:

```json
{
  "imports": {
    "@openelement/core": "../core/src/index.ts"
    // "lit": "..."                    ← REMOVED (was here for DSD components)
    // "@openelement/adapter-lit": "..."    ← REMOVED (was here for DSD components)
  }
}
```

Verify `www/deno.json`:

```json
{
  "imports": {
    "@openelement/ui": "../packages/ui/src/index.ts",
    "@openelement/core": "../packages/core/src/index.ts",
    "lit": "..."                       ← KEPT (for less-hero-ping Island)
    "@openelement/adapter-lit": "..."       ← KEPT (for less-hero-ping SSR)
  }
}
```

If `www/` no longer needs Lit for its own components, consider removing. But less-hero-ping still needs it.

---

## Step 4: SSG Build Test

```bash
cd www
deno task build
```

Verify:

- [ ] Build completes with zero errors
- [ ] No warnings about missing Lit imports
- [ ] No warnings about unresolvable modules
- [ ] All pages generated
- [ ] DSD templates contain `<style>` tags with actual CSS (not empty)

---

## Step 5: SSR Output Comparison

Pick 3 representative pages and diff the SSR output:

```bash
# Generate v0.19 baseline (from main branch)
git stash
git checkout main
deno task build
cp -r dist dist-v019

# Generate v0.20
git checkout dev
git stash pop
deno task build

# Diff
diff -r dist-v019 dist-v020
```

Acceptable differences:

- `--less-*` → `--*` (Open Props variable rename) — expected
- `<style>` content slightly reformatted — expected
- CSS class order in `<style>` — acceptable

NOT acceptable:

- Missing HTML elements
- Different DOM structure
- Missing `<template shadowrootmode>` blocks
- Missing `<slot>` elements

---

## Verification Checklist

- [ ] Bundle gzip ≤ 6KB (≥ 50% reduction from v0.19)
- [ ] Zero `from 'lit'` imports in 9 DSD components
- [ ] Zero `from '@openelement/adapter-lit'` imports in 9 DSD components
- [ ] All 9 DSD components import from `@openelement/core`
- [ ] `packages/ui/deno.json`: no `lit` dependency
- [ ] `packages/ui/deno.json`: no `@openelement/adapter-lit` dependency
- [ ] SSG build: zero errors
- [ ] SSR output diff: only expected differences (CSS variables, formatting)
- [ ] Hero-ping still imports Lit (verified)

---

## Dependencies

```
SOP-011 blocks: SOP-012 (regression testing)
SOP-011 blocked by: SOP-009, SOP-010
```
