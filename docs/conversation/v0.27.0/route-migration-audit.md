# Route Migration Audit Report

**Date:** 2026-05-30
**Scope:** All `.tsx` files under `www/app/routes/`
**Files Audited:** 13

---

## Executive Summary

| Pattern                                           | Files Affected | Total Instances    |
| ------------------------------------------------- | -------------- | ------------------ |
| Pattern 1: Template string render()               | 9/13           | 15                 |
| Pattern 2: Manual locale handling                 | 9/13           | 21                 |
| Pattern 3: Manual HTML string construction        | 1/13           | 1 (spans 73 lines) |
| Pattern 4: Not using Router                       | 0/13           | 0                  |
| Pattern 5: Direct DOM manipulation                | 1/13           | 1 (minor)          |
| Pattern 6: StyleSheet without openPropsTokenSheet | 0/13           | 0                  |

**Overall assessment:** 9 of 13 route files (69%) use the old template string render pattern. Migration is a significant but well-scoped effort. All files correctly import `openPropsTokenSheet`. No files do manual path parsing. One file (changelog.tsx) has the most technical debt because it combines Pattern 1, Pattern 2, AND Pattern 3 (manual HTML construction) in a single file.

---

## Detailed Findings

### Pattern 1: Old template string `render()` returning string literal

#### Files Using JSX (CLEAN - No migration needed):

- `index/index.tsx` — returns JSX
- `contributing.tsx` — returns JSX (delegates to `_renderEn()` / `_renderZh()` which return JSX)
- `registry/[package]/[component].tsx` — returns JSX including not-found paths
- `blog/[slug].tsx` — returns JSX

#### Files Using Template Strings:

| File                     | Pattern | Line    | Details                                                                                                                                                                                                   | Severity | Migration Difficulty |
| ------------------------ | ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------- |
| `404.tsx`                | 1       | 65-73   | `override render()` returns template string with `POPULAR_LINKS.map(...).join(...)`. Simple content, no conditional logic.                                                                                | P1       | Simple               |
| `changelog.tsx`          | 1       | 269-302 | `override render()` returns large template string with `${this._getLocale()}`, `${JSON.stringify(...)}`, and `${renderedHtml}` interpolation. Contains `<open-layout>` wrapper.                           | P0       | Medium               |
| `roadmap.tsx`            | 1       | 239-333 | `override render()` returns very large template string (~95 lines). Static content with no conditional logic. Contains `<open-layout>`.                                                                   | P1       | Simple               |
| `apilist.tsx`            | 1       | 42-151  | `_renderZh()` returns ~110-line template string with hard-coded `locale="zh"`. API reference entries.                                                                                                     | P0       | Medium               |
| `apilist.tsx`            | 1       | 155-257 | `_renderEn()` returns ~103-line template string with hard-coded `locale="en"`. Mirror of `_renderZh`.                                                                                                     | P0       | Medium               |
| `guide/architecture.tsx` | 1       | 31-53   | `override render()` returns template string with conditional `${isZh ? '...' : '...'}` logic. Small content.                                                                                              | P1       | Simple               |
| `registry/index.tsx`     | 1       | 422-589 | `override render()` returns massive template string (~168 lines). Contains complex conditional logic, `.map()` for package cards, nested ternaries, event binding strings (`@input="${this._onSearch}"`). | P0       | Complex              |
| `registry/[package].tsx` | 1       | 232-244 | Not-found branch returns template string with `<open-layout>`.                                                                                                                                            | P0       | Medium               |
| `registry/[package].tsx` | 1       | 246-404 | Main render returns massive template string (~158 lines). Contains heavy conditional logic, `.map()` calls, inline style attributes, event binding strings.                                               | P0       | Complex              |
| `docs/index.tsx`         | 1       | 99-137  | `override render()` returns medium template string with `${this._getLocale()}`, static content only. Contains `<open-layout>`.                                                                            | P1       | Simple               |
| `hub/index.tsx`          | 1       | 80-114  | `override render()` returns small template string. Static content only. Contains `<open-layout>`.                                                                                                         | P1       | Simple               |

---

### Pattern 2: Manual Locale Handling

#### Per-File Breakdown:

| File                       | Pattern | Line          | Details                                                                                                                                                                                                                | Severity | Migration Difficulty |
| -------------------------- | ------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------- |
| `index/index.tsx`          | 2       | 175           | `const isZh = this._getLocale('en') === 'zh';` — Manual locale detection via `_getLocale()`. Used to conditionalize `hero-desc`, `features-head`, `ft-card` content, and CTA labels. Should use `this.routing.locale`. | P1       | Simple               |
| `changelog.tsx`            | 2       | 271           | `locale="${this._getLocale('zh')}"` in template string. `_getLocale()` call passing default. Should use `this.routing.locale`.                                                                                         | P1       | Simple               |
| `contributing.tsx`         | 2       | 53            | `this._getLocale('zh') === 'en'` — branch decision for locale.                                                                                                                                                         | P1       | Medium               |
| `contributing.tsx`         | 2       | 57, 110       | Two separate `const loc = this._getLocale(...)` calls (one per `_renderZh`/`_renderEn` method).                                                                                                                        | P1       | Medium               |
| `apilist.tsx`              | 2       | 38            | `this._getLocale('zh') === 'en'` — branch decision.                                                                                                                                                                    | P1       | Medium               |
| `apilist.tsx`              | 2       | 44            | Hard-coded `locale="zh"` in template string attribute.                                                                                                                                                                 | P0       | Simple               |
| `apilist.tsx`              | 2       | 157           | Hard-coded `locale="en"` in template string attribute.                                                                                                                                                                 | P0       | Simple               |
| `guide/architecture.tsx`   | 2       | 30            | `const isZh = this._getLocale('zh') === 'zh'` — Manual locale detection.                                                                                                                                               | P1       | Simple               |
| `guide/architecture.tsx`   | 2       | 33            | `locale="${this._getLocale('en')}"` in template string.                                                                                                                                                                | P1       | Simple               |
| `roadmap.tsx`              | 2       | 241           | `locale="${this._getLocale('en')}"` in template string.                                                                                                                                                                | P1       | Simple               |
| `registry/index.tsx`       | 2       | 427           | Hard-coded `locale="en"` in template string. English-only page but still hard-coded.                                                                                                                                   | P2       | Simple               |
| `registry/[package].tsx`   | 2       | 235, 249      | Hard-coded `locale="en"` in both not-found and main template strings.                                                                                                                                                  | P2       | Simple               |
| `registry/[component].tsx` | 2       | 407, 431, 468 | Hard-coded `locale='en'` in JSX (not-found paths and main render). This is already JSX but locale is hard-coded.                                                                                                       | P2       | Simple               |
| `docs/index.tsx`           | 2       | 101           | `locale="${this._getLocale('en')}"` in template string.                                                                                                                                                                | P1       | Simple               |
| `hub/index.tsx`            | 2       | 82            | `locale="${this._getLocale('en')}"` in template string.                                                                                                                                                                | P1       | Simple               |
| `blog/[slug].tsx`          | 2       | 58, 115       | `this._getLocale('zh') === 'en'` — branch decision + `const loc = this._getLocale(...)` calls. Used to pick `_renderEn()` vs `_renderZh()`.                                                                            | P1       | Medium               |

**Note on P2 severity for registry files:** The registry pages are intentionally English-only (`locales='["en"]'`). The hard-coded `locale="en"` is functionally correct for these pages but still represents a drift from the framework's recommended `this.routing.locale` pattern. Marked as P2 (nice-to-have) rather than P0/P1 (must-fix).

---

### Pattern 3: Manual HTML String Construction (`let html = ''` + `html +=`)

| File            | Pattern | Line    | Details                                                                                                                                                                                                                                                                                                                                                                                                                          | Severity | Migration Difficulty |
| --------------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------- |
| `changelog.tsx` | 3       | 161-233 | `renderChangelog()` function uses `let html = ''` (line 161) and extensive `html +=` concatenation (lines 178, 184, 192, 199, 205, 212, 219, 227, 231). This is a hand-written markdown-to-HTML renderer spanning 73 lines. This function also has its own `renderInline()` (line 236) and `esc()` (line 247) helpers. The entire function should be replaced with a JSX-based markdown renderer or proper template composition. | P0       | Complex              |

**Detail:** The `renderChangelog()` function manually generates HTML from markdown with:

- `h2`/`h3`/`h4` header extraction via regex (lines 168-201)
- `<hr>` detection (line 204)
- `<blockquote>` parsing (line 210)
- `<ul><li>` construction (line 217)
- Paragraph and inline rendering with `**bold**`, `` `code` ``, `[link](url)` (lines 237-243)
- HTML escaping function `esc()` (lines 248-253)

This is the most egregious Pattern 3 violation in the entire codebase. The markdown-to-HTML logic should be moved out of the component and replaced with a proper renderer that returns VNodes/JSX.

---

### Pattern 4: Not Using Router (Manual Path Parsing)

| File | Pattern | Line | Details                | Severity |
| ---- | ------- | ---- | ---------------------- | -------- |
| —    | —       | —    | **No instances found** | —        |

All route files correctly use the framework's routing mechanism. None of the following patterns were found:

- `location.pathname.split(...)`
- `location.pathname.startsWith(...)`
- `window.location.href = ...` for navigation
- Manual locale prefix stripping

Route parameters (`this.package`, `this.component`, `this.slug`) are correctly set by the framework. Navigation is done via standard `<a href>` links.

---

### Pattern 5: Direct DOM Manipulation

| File              | Pattern | Line | Details                                                                                                                                                                                                                                                                                                                | Severity | Migration Difficulty |
| ----------------- | ------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------- |
| `index/index.tsx` | 5       | 170  | `this.setAttribute('data-theme', theme.value)` in `connectedCallback()` — sets `data-theme` attribute on the component's host element for theme tracking via signal subscription. This is a legitimate signal-driven the pattern typical of DsdElement, but technically counts as direct `setAttribute` in route code. | P2       | Trivial              |

**Note:** The following files use `innerHTML={...}` as a JSX prop (approved pattern):

- `registry/[package]/[component].tsx:520` — `innerHTML={sanitizeSnapshot(...)}` — approved
- `blog/[slug].tsx:105,158` — `innerHTML={post.html}` — approved

No `document.querySelector` calls were found in any route file.

---

### Pattern 6: StyleSheet Without openPropsTokenSheet

| File | Pattern | Line | Details                | Severity |
| ---- | ------- | ---- | ---------------------- | -------- |
| —    | —       | —    | **No instances found** | —        |

All 13 route files correctly include `openPropsTokenSheet` in their `static styles` array:

| File                                     | Styles Configuration                           |
| ---------------------------------------- | ---------------------------------------------- |
| `index/index.tsx:164`                    | `[openPropsTokenSheet, heroSheet]`             |
| `404.tsx:63`                             | `[openPropsTokenSheet, styles]`                |
| `changelog.tsx:256`                      | `[openPropsTokenSheet, pageSheet, routeSheet]` |
| `contributing.tsx:51`                    | `[openPropsTokenSheet, routeSheet]`            |
| `roadmap.tsx:236`                        | `[openPropsTokenSheet, routeSheet]`            |
| `apilist.tsx:35`                         | `[openPropsTokenSheet, routeSheet]`            |
| `guide/architecture.tsx:27`              | `[openPropsTokenSheet, sheet]`                 |
| `registry/index.tsx:343`                 | `[openPropsTokenSheet, routeSheet]`            |
| `registry/[package].tsx:183`             | `[openPropsTokenSheet, routeSheet]`            |
| `registry/[package]/[component].tsx:317` | `[openPropsTokenSheet, routeSheet]`            |
| `docs/index.tsx:96`                      | `[openPropsTokenSheet, sheet]`                 |
| `hub/index.tsx:77`                       | `[openPropsTokenSheet, sheet]`                 |
| `blog/[slug].tsx:55`                     | `[openPropsTokenSheet, routeSheet]`            |

---

## Migration Priority Matrix

### Tier 1 — Critical (Blocking)

Files that must be migrated first due to high complexity or combined patterns:

| Priority | File                     | Patterns  | Risk                                                                                                           |
| -------- | ------------------------ | --------- | -------------------------------------------------------------------------------------------------------------- |
| P0       | `changelog.tsx`          | 1 + 2 + 3 | Highest risk. All three migration patterns in one file. Custom markdown renderer.                              |
| P0       | `registry/index.tsx`     | 1 + 2     | Very large template string (~168 lines). Complex conditional rendering, event binding strings, `.map()` calls. |
| P0       | `registry/[package].tsx` | 1 + 2     | Large template string (~158 lines). Heavy conditional logic, `.map()` calls, inline styles.                    |
| P0       | `apilist.tsx`            | 1 + 2     | Two large template strings (~213 lines total). Hard-coded locale values + locale branch logic.                 |

### Tier 2 — Important (Should Migrate)

| Priority | File                     | Patterns | Risk                                                                                         |
| -------- | ------------------------ | -------- | -------------------------------------------------------------------------------------------- |
| P1       | `roadmap.tsx`            | 1 + 2    | Large template string (~95 lines). Static content, no conditional logic — simpler migration. |
| P1       | `docs/index.tsx`         | 1 + 2    | Medium template string, static content.                                                      |
| P1       | `hub/index.tsx`          | 1 + 2    | Small template string, static content.                                                       |
| P1       | `guide/architecture.tsx` | 1 + 2    | Small template string + conditional locale logic.                                            |
| P1       | `404.tsx`                | 1        | Small template string, simple array mapping.                                                 |
| P1       | `contributing.tsx`       | 2        | Already returns JSX! Only needs locale refactoring.                                          |
| P1       | `blog/[slug].tsx`        | 2        | Already returns JSX! Only needs locale refactoring.                                          |

### Tier 3 — Nice to Have

| Priority | File                                 | Patterns | Risk                                                                    |
| -------- | ------------------------------------ | -------- | ----------------------------------------------------------------------- |
| P2       | `index/index.tsx`                    | 2 + 5    | Already returns JSX. Minor `_getLocale()` + `setAttribute` refinements. |
| P2       | `registry/[package]/[component].tsx` | 2        | Already returns JSX. Only hard-coded `locale='en'` to clean up.         |

---

## Consolidated By-File Summary

| File                       | Pattern 1                   | Pattern 2                              | Pattern 3            | Pattern 4 | Pattern 5          | Pattern 6 | Overall           |
| -------------------------- | --------------------------- | -------------------------------------- | -------------------- | --------- | ------------------ | --------- | ----------------- |
| `index/index.tsx`          | CLEAN                       | P1: `_getLocale()`                     | CLEAN                | CLEAN     | P2: `setAttribute` | CLEAN     | **P1/P2**         |
| `404.tsx`                  | P1: template string         | CLEAN                                  | CLEAN                | CLEAN     | CLEAN              | CLEAN     | **P1**            |
| `changelog.tsx`            | P0: template string         | P1: `_getLocale()`                     | P0: 73-line `html+=` | CLEAN     | CLEAN              | CLEAN     | **P0** (critical) |
| `contributing.tsx`         | CLEAN (JSX)                 | P1: `_getLocale()` x3                  | CLEAN                | CLEAN     | CLEAN              | CLEAN     | **P1**            |
| `roadmap.tsx`              | P1: template string         | P1: `_getLocale()`                     | CLEAN                | CLEAN     | CLEAN              | CLEAN     | **P1**            |
| `apilist.tsx`              | P0: two template strings    | P0: hard-coded locale + `_getLocale()` | CLEAN                | CLEAN     | CLEAN              | CLEAN     | **P0** (critical) |
| `guide/architecture.tsx`   | P1: template string         | P1: `_getLocale()` x2                  | CLEAN                | CLEAN     | CLEAN              | CLEAN     | **P1**            |
| `registry/index.tsx`       | P0: massive template string | P2: hard-coded `locale="en"`           | CLEAN                | CLEAN     | CLEAN              | CLEAN     | **P0** (critical) |
| `registry/[package].tsx`   | P0: massive template string | P2: hard-coded `locale="en"`           | CLEAN                | CLEAN     | CLEAN              | CLEAN     | **P0** (critical) |
| `registry/[component].tsx` | CLEAN (JSX)                 | P2: hard-coded `locale='en'`           | CLEAN                | CLEAN     | CLEAN              | CLEAN     | **P2**            |
| `docs/index.tsx`           | P1: template string         | P1: `_getLocale()`                     | CLEAN                | CLEAN     | CLEAN              | CLEAN     | **P1**            |
| `hub/index.tsx`            | P1: template string         | P1: `_getLocale()`                     | CLEAN                | CLEAN     | CLEAN              | CLEAN     | **P1**            |
| `blog/[slug].tsx`          | CLEAN (JSX)                 | P1: `_getLocale()` x2                  | CLEAN                | CLEAN     | CLEAN              | CLEAN     | **P1**            |

---

## Migration Strategy Recommendations

### Phase 1: Template String → JSX Conversion (highest impact)

**Target: 9 files.** Convert all `return \`...\``patterns to`return (...JSX...)`.

Key considerations:

1. **Event binding syntax change:** In template strings, events use `@input="${this._onSearch}"` string syntax. In JSX, they become `@input={this._onSearch}` (function reference).
2. **Conditional logic:** Template strings use `${condition ? '...' : '...'}`. JSX uses `{condition ? (<.../>) : (<.../>)}`.
3. **Array mapping:** Template strings use `${arr.map(item =>`<div>${item}</div>`).join('')}`. JSX uses `{arr.map(item => <div>{item}</div>)}`.
4. **Attribute interpolation:** Template strings use `locale="${this._getLocale('en')}"` (string). JSX uses `locale={this.routing.locale}` (expression).

**Recommended order:**

1. `404.tsx` (simplest) — warm-up migration
2. `hub/index.tsx` (small)
3. `docs/index.tsx` (medium)
4. `guide/architecture.tsx` (small with conditionals)
5. `roadmap.tsx` (large but static)
6. `apilist.tsx` (two big template strings)
7. `changelog.tsx` (combined with Phase 3, Pattern 3 fix)
8. `registry/index.tsx` (large + complex events)
9. `registry/[package].tsx` (large + complex)

### Phase 2: Locale Refactoring (cross-cutting)

**Target: 9 files.** Replace all `this._getLocale(...)` calls with `this.routing.locale`.

Unified approach:

```typescript
// Before
const isZh = this._getLocale('en') === 'zh';
const loc = this._getLocale('zh');

// After
const isZh = this.routing.locale === 'zh';
const loc = this.routing.locale;
```

Files with `_renderZh()` / `_renderEn()` branching should be refactored to use a single render function with locale-based conditionals, or better, adopt the framework's i18n expansion if available.

Files with hard-coded `locale="en"` / `locale="zh"` should use `this.routing.locale`.

### Phase 3: Manual HTML Construction → JSX Rendering (single file)

**Target: `changelog.tsx`.** Replace the `renderChangelog()` function (lines 160-233):

Option A: Use a proper Markdown-to-JSX renderer (would also solve Pattern 1)
Option B: Pre-render the changelog during SSG/build and inject as a static data import
Option C: Convert `renderChangelog()` to return VNodes/JSX directly instead of HTML strings

Option B is recommended because:

- CHANGELOG.md is static content that doesn't change between deploys
- Would eliminate both Pattern 1 and Pattern 3 from this file
- Would improve build performance (no regex parsing at render time)

### Phase 4: Cleanup (low priority)

- `index/index.tsx`: Replace `this.setAttribute('data-theme', ...)` with signal-bound attribute or `@openelement/signals` binding if available
- `registry/[component].tsx`: Replace hard-coded `locale='en'` with `this.routing.locale`

---

## Templates for Migration

### Simple template string → JSX migration

Template string:

```typescript
return `
  <open-layout locale="${this._getLocale('en')}" locales='${JSON.stringify(['en', 'zh'])}'>
    <div class="container">
      <h1>${title}</h1>
    </div>
  </open-layout>
`;
```

JSX equivalent:

```tsx
return (
  <open-layout locale={this.routing.locale} locales={JSON.stringify(['en', 'zh'])}>
    <div class='container'>
      <h1>{title}</h1>
    </div>
  </open-layout>
);
```

### Array mapping migration

Template string:

```typescript
${items.map((item) => `
  <div class="card">${item.name}</div>
`).join('')}
```

JSX equivalent:

```tsx
{
  items.map((item) => <div class='card'>{item.name}</div>);
}
```
