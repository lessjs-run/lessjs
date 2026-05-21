# SOP-012: Full Regression Testing

> **ADR**: [ADR-0036 Ocean-Island Architecture](../../adr/0036-ocean-island-architecture.md)
> **Depends on**: SOP-011 (build verified)
> **Estimated time**: 0.5 day
> **Complexity**: 🟡 Medium

---

## Objective

Run comprehensive regression tests to confirm zero behavioral regressions across all 10 components after the Lit → DsdElement migration.

---

## Test Matrix

### 1. Visual Regression

| Page                 | Components used                 | What to check                                                     |
| -------------------- | ------------------------------- | ----------------------------------------------------------------- |
| Homepage (`/`)       | layout, button, card, hero-ping | Layout: nav, sidebar, content. Hero ping animation. Card styling. |
| Component browser    | ALL 10                          | Every component rendered. Variants visible.                       |
| Any page with dialog | dialog                          | Open/close, overlay, focus trap                                   |
| Any page with code   | code-block                      | Syntax highlight, copy button, language label                     |
| Dark mode            | all                             | Theme toggle. All components respect dark mode.                   |

**Method**:

- Build SSG (`deno task build`)
- Serve locally (`deno task serve` or `npx serve dist`)
- Screenshot key pages in light + dark mode
- Compare against v0.19 screenshots (pixel diff)

### 2. Interactive Regression

| Component         | Test               | Expected                             |
| ----------------- | ------------------ | ------------------------------------ |
| less-button       | Click              | `less-click` event fires             |
| less-button       | Disabled click     | No event                             |
| less-button       | `href` attribute   | Renders `<a>`, navigates             |
| less-input        | Type text          | `value` attribute updates            |
| less-input        | `less-input` event | Fires on input                       |
| less-theme-toggle | Click              | Theme toggles, localStorage updated  |
| less-code-block   | Copy button        | Code copied, "Copied!" appears       |
| less-code-block   | :state(copied)     | Visual feedback (2s)                 |
| less-dialog       | Add `open`         | Dialog + overlay visible             |
| less-dialog       | Remove `open`      | Dialog hidden                        |
| less-dialog       | Click ✕            | Dialog closes                        |
| less-dialog       | Click overlay      | Dialog closes                        |
| less-dialog       | ESC key            | Dialog closes                        |
| less-dialog       | Focus trap         | Tab cycles within dialog             |
| less-layout       | Nav toggle click   | Sidebar toggles                      |
| less-layout       | Nav item click     | Navigation works                     |
| less-layout       | Mobile responsive  | Sidebar collapses, hamburger appears |
| less-search       | Click trigger      | Overlay opens with input focused     |
| less-search       | Type + results     | Results appear                       |
| less-search       | Arrow keys         | Navigate results                     |
| less-search       | Enter              | Select result, navigate, close       |
| less-search       | Escape             | Close overlay                        |
| less-search       | Click outside      | Close overlay                        |
| less-hero-ping    | Page load          | Ping animation runs                  |

### 3. SSR Output Regression

```bash
# For each component, verify DSD template content matches v0.19:
deno task build
grep -A5 '<less-button' dist/**/*.html
grep -A5 '<less-card' dist/**/*.html
# ... all 10 components ...
```

Key checks for each `<template shadowrootmode>` block:

- [ ] `<style>` tag present with actual CSS (not empty, not `@import`)
- [ ] All `<slot>` elements present
- [ ] No Lit syntax (`@click`, `.prop`, `?attr`)
- [ ] `part="..."` attributes present
- [ ] HTML structure matches v0.19

### 4. Edge Cases

| Scenario                               | Expected                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| Disabled JavaScript                    | All content visible, no interaction                                           |
| No Lit loaded (network error)          | All 9 DSD components render and work. Hero-ping is static dot (no animation). |
| `customElements.define()` called twice | No error (guarded by `if (!customElements.get())`)                            |
| Attribute change during animation      | `_syncDOM()` updates correctly                                                |
| Rapid open/close (dialog)              | No state corruption                                                           |
| Empty slots                            | No extra whitespace, no broken layout                                         |

### 5. Cross-Browser (if applicable)

| Browser     | Priority | What to test                     |
| ----------- | -------- | -------------------------------- |
| Chrome/Edge | P0       | Full test matrix                 |
| Firefox     | P1       | Visual + basic interaction       |
| Safari      | P2       | Visual only (CSSStyleSheet, DSD) |

---

## Bug Report Template

If regression found:

```
## Bug: [component] — [brief description]

**v0.19 behavior**: [what it did]
**v0.20 behavior**: [what it does now]
**Reproduction steps**:
  1. ...
  2. ...
**Expected**: ...
**Actual**: ...
**Component**: less-[name].ts
**Likely cause**: [SSR / hydrateEvents / _syncDOM / CSSStyleSheet / attributeChangedCallback]
```

---

## Go/No-Go Criteria

### ✅ Go for v0.20.0 release if:

- [ ] Zero visual regressions (pixel-perfect vs v0.19)
- [ ] All interactive tests pass (15/15 scenarios)
- [ ] SSR output: all `<style>` tags populated, all `<slot>` elements present
- [ ] Zero Lit syntax in DSD output
- [ ] Bundle size ≤ 6KB gzip for UI package
- [ ] Hero-ping animation runs (Lit path intact)
- [ ] Dark mode works across all components

### ❌ No-Go if:

- [ ] Any visual difference (except intentional Open Props variable rename)
- [ ] Any interactive test fails
- [ ] Empty `<style>` tags in DSD output
- [ ] Any Lit import remaining in 9 DSD components
- [ ] Bundle size > 8KB gzip

---

## Verification Checklist

- [ ] Visual regression: all pages pixel-perfect vs v0.19
- [ ] Interactive regression: all 15+ scenarios pass
- [ ] SSR output: all checks pass per component
- [ ] Edge cases: all 6 scenarios pass
- [ ] No Lit import in DSD components (verified again)
- [ ] Bundle size target met
- [ ] Go/No-Go decision documented

---

## Dependencies

```
SOP-012 is the FINAL gate before v0.20.0 release.
SOP-012 blocked by: SOP-011
```
