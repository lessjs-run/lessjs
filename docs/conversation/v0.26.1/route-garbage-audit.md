# Route File Garbage Audit — v0.26.1

**Scope**: 32 files in `www/app/routes/`\
**Date**: 2026-05-30\
**Auditor**: route-scanner (Agent)

---

## Executive Summary

| Severity | Count                                    |
| -------- | ---------------------------------------- |
| P0       | 19 files — old html`` template pattern   |
| P0       | 7 files — hard-coded colors              |
| P1       | 5 files — hard-coded sizes               |
| P1       | 4 files — dead version comments          |
| P1       | 1 file — duplicate import                |
| P2       | 3 files — content issues in code samples |

---

## 1. Old `html\`\`` Template Pattern (P0)

**19 of 32 files (59%)** still use `render()` returning template literal strings instead of JSX.

### File-by-file:

| File                                     | Lines            | Severity | Migration                                                                                                                      |
| ---------------------------------------- | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `404.tsx`                                | 63-73            | P0       | Convert to JSX: `<div class='container'>...`                                                                                   |
| `changelog.tsx`                          | 268-301          | P0       | Wrap in JSX. Note: uses `_getLocale()` already, plus inline markdown renderer — will need `innerHTML` for the markdown portion |
| `roadmap.tsx`                            | 238-332          | P0       | Large template. JSX conversion straightforward but verbose                                                                     |
| `apilist.tsx`                            | 41-151, 153-255  | P0       | Two locale variants. Duplicated content — refactor opportunity                                                                 |
| `blog/index.tsx`                         | 87-137, 141-193  | P0       | Complex data-driven rendering with map/filter in template                                                                      |
| `guide/core-concepts.tsx`                | 18-233, 237-457  | P0       | Very large templates (200+ lines each locale)                                                                                  |
| `guide/routing-and-data.tsx`             | 18-151, 155-290  | P0       | Large templates                                                                                                                |
| `guide/getting-started.tsx`              | 59-183, 187-297  | P0       | Large templates                                                                                                                |
| `guide/architecture.tsx`                 | 30-52            | P0       | Redirect page                                                                                                                  |
| `guide/islands-and-ssr.tsx`              | 18-156, 160-302  | P0       | Large templates                                                                                                                |
| `architecture/architecture.tsx`          | 299-413          | P0       | Large template, contains inline GRAPH constant                                                                                 |
| `architecture/dsd.tsx`                   | 50-151, 155-260  | P0       | Two locale variants                                                                                                            |
| `architecture/islands.tsx`               | 48-158, 162-258  | P0       | Two locale variants                                                                                                            |
| `architecture/comparison.tsx`            | 132-263          | P0       | Single locale (zh fallback)                                                                                                    |
| `architecture/package-compatibility.tsx` | 23-182, 186-352  | P0       | Two locale variants                                                                                                            |
| `architecture/standards-registry.tsx`    | 20-154, 158-306  | P0       | Two locale variants                                                                                                            |
| `hub/index.tsx`                          | 86-120           | P0       | Small template                                                                                                                 |
| `registry/index.tsx`                     | 421-587          | P0       | Complex template with nested conditionals, loops, inline handlers                                                              |
| `registry/[package].tsx`                 | 231-403, 245-403 | P0       | Multi-level template nesting                                                                                                   |
| `docs/index.tsx`                         | 103-141          | P0       | Small template                                                                                                                 |

### JSX-clean files (already migrated):

`contributing.tsx`, `blog/[slug].tsx`, `guide/testing.tsx`, `guide/error-handling.tsx`, `guide/api.tsx`, `guide/configuration.tsx`, `guide/deployment.tsx`, `architecture/benchmark.tsx`, `architecture/design-system.tsx`, `architecture/islands-deep.tsx`, `index/index.tsx`

---

## 2. Hard-Coded Colors (P0/P1)

Rule violated: Any `#hex`, `rgb()`, `rgba()` that is NOT a `var(--xxx)` token.

### roadmap.tsx

- Line 22: `background: #11131a` → `var(--bg-elevated)` or introduce `var(--bg-card-dark)`
- Line 59: `background: #fff` → `var(--bg-surface)` or `var(--gray-1)`
- Line 103: `background: #fff` → same
- Line 166: `background: #fff` → same
- Line 206: `background: #fff` → same
- Line 69: `border: 1px solid rgba(81, 72, 184, 0.28)` → should be `var(--border-brand-subtle)`
- Line 71: `background: rgba(81, 72, 184, 0.08)` → should be `var(--brand-subtle)`
- Line 140-153: `.done`, `.current`, `.planned` use `rgba(...)` for border/background colors — define as semantic tokens

### hub/index.tsx

- Lines 18-25: Defines LOCAL CSS variables with hard-coded values:
  ```css
  --ink: #14151d;        → should use var(--text-primary)
  --muted: #626676;      → should use var(--text-muted)
  --border: rgba(20,24,36,0.12); → should use var(--border)
  --accent: #5148b8;     → should use var(--brand)
  --success: #13795b;    → should use var(--brand-deep)
  --warning: #a05a00;    → no token exists — use var(--yellow-9) or create
  --danger: #b42318;     → should use var(--red-9) or create var(--danger)
  ```
- Line 54: `background: #fff` → `var(--bg-surface)`
- Line 56: `background: #fff` → same
- Line 63: `border-color: rgba(81,72,184,0.28)` → `var(--border-brand-subtle)`
- Line 75: `background: rgba(81,72,184,0.06)` → `var(--brand-subtle)`

### docs/index.tsx

- Lines 18-22: Same LOCAL CSS variable pattern as hub:
  ```css
  --ink: #14151d;
  --muted: #626676;
  --border: rgba(20, 24, 36, 0.12);
  --accent: #5148b8;
  --success: #13795b;
  ```
- Line 56: `background: #fff`
- Line 63: `border-color: rgba(81,72,184,0.28)`
- Line 90: `background: rgba(81,72,184,0.06)`

### registry/index.tsx

- Lines 36-39: `COMPAT_COLORS` object with hard-coded hex:
  ```ts
  'ssr-capable': '#22c55e',
  'client-only': '#f59e0b',
  'rejected': '#ef4444',
  'experimental-dom': '#8b5cf6',
  ```
  Used in inline `style` attributes (lines 548, 562, 570). Use semantic tokens like `var(--green-5)`, `var(--amber-5)`, `var(--red-5)`, `var(--purple-5)`.
- Lines 276, 281: `rgba(34, 197, 94, 0.1)`, `#22c55e`, `rgba(239, 68, 68, 0.1)`, `#ef4444` — style inline colors
- Lines 293: `rgba(99, 102, 241, 0.1)`, `#6366f1` — new badge colors
- Line 153: `color: #fff` — filter button active state

### registry/[package].tsx

- Lines 94-97: Same `COMPAT_COLORS` pattern
- Lines 151-152: `#ef4444` (error dot)
- Lines 153-154: `#22c55e`, `#f59e0b` (SSR/warn dots)
- Lines 160-169: `.compat-badge-lg-*` classes with inline hex colors
- Lines 119-120: `rgba(34,197,94,0.08)` and similar for install safe/unsafe

### architecture/design-system.tsx

- Lines 283-305: ~24 instances of `style='background:#xxx'` on swatch divs — **LEGITIMATE design system display** (showing the actual palette values). P1: Could use CSS classes instead of inline styles.
- Lines 85, 88: `rgba(255, 255, 255, 0.08)`, `rgba(0, 0, 0, 0.08)` — border for swatches

### architecture/architecture.tsx

- Lines 53-55: `rgba(81, 72, 184, 0.28)`, `rgba(81, 72, 184, 0.08)` — `.chip.current`
- Lines 59-60: `rgba(19, 121, 91, 0.26)`, `rgba(19, 121, 91, 0.08)` — `.chip.pass`
- Line 84: `rgba(20, 24, 36, 0.1)` — shadow

### changelog.tsx

- Line 97: `3px solid var(--brand)` — the `3px` is fine but the color uses token

### index/index.tsx (homepage)

- Lines 30-31: `rgba(255,255,255,0.015)` — grid lines — acceptable as decorative
- Line 64: `rgba(255,255,255,0.06)`, `rgba(96,239,255,0.5)` — laser line gradient — P1 custom visual effect
- Lines 70, 73-74: `rgba(96,239,255,...)` — laser dot glow
- Line 120: `rgba(255,255,255,0.015)` — card background
- Line 124: `rgba(124,111,245,0.08)` — card hover
- Lines 136-138: `0 0 18px var(--brand-glow)`, `0 0 30px var(--brand-neon)` — shadow effects

---

## 3. Hard-Coded Sizes (P1)

### roadmap.tsx

- Line 26: `max-width: 1080px` → `var(--size-content-wide)` or `var(--size-container-max)`
- Line 29: `grid-template-columns: minmax(0, 1fr) 320px` → hard-coded 320px sidebar
- Line 48: `max-width: 690px` → hard-coded
- Line 98: `grid-template-columns: 110px 1fr 140px` → three hard-coded values
- Line 107: `1.65` (line-height: 1.65) → `var(--font-lineheight-4)`
- Lines 213-228: `(max-width: 820px)`, `(max-width: 560px)` — media query breakpoints, could use design tokens

### hub/index.tsx

- Line 27: `padding: 44px 24px 72px` → `var(--size-10)` equivalents
- Line 36: `max-width: 680px` → hard-coded
- Line 38: `margin: 18px 0 0` → could be `var(--size-5)` etc.
- Line 51: `gap: 14px` → `var(--size-3)`
- Line 55: `padding: 22px` → `var(--size-5)`
- Line 59: `margin: 0 0 8px` → `var(--size-2)`
- Line 60: `font-size: 13px` → `var(--font-size-0)` (13px is ~0.8125rem)
- Line 67: `min-height: 26px` → hard-coded
- Line 70: `border-radius: 5px` → `var(--radius-1)`

### docs/index.tsx

- Same pattern as hub/index.tsx — nearly identical CSS with different layout

### architecture/architecture.tsx

- Line 17: `max-width: 1120px` → hard-coded
- Line 24: `grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr)` → 360px hard-coded
- Lines 91, 158: `padding: 14px var(--size-4)` → 14px hard-coded
- Line 156: `grid-template-columns: 170px 1fr 180px` → two hard-coded values

### architecture/design-system.tsx

- Line 26: `margin-bottom: 3.5rem` → `var(--size-12)` equivalent
- Line 32: `letter-spacing: 0.16em` → `var(--font-letterspacing-5)` or similar
- Line 91: `font-size: 0.5625rem` → `var(--font-size-00)` equivalent
- Multiple swatch size/label size values

### registry/index.tsx

- Line 46: `margin-bottom: 2rem` → `var(--size-8)`
- Lines 49-50: `font-size: 2rem`, `font-weight: 700` → `var(--font-size-6)`, `var(--font-weight-7)`
- Lines 98, 99: `padding: 0.625rem 0.875rem` → `var(--size-3)` equivalents
- Line 178: `box-shadow: 0 1px 4px rgba(0,0,0,0.04)` → could use `var(--shadow-1)`

---

## 4. Dead Version Comments (P1)

### roadmap.tsx

- Line 4: `// ADR-0037 anchors: DSD-first. Version: v0.21, v0.22, v0.23.`\
  **Current line is v0.23.x**. v0.21 and v0.22 are "Done" phases. Comment is stale — references old anchor points.

### architecture/architecture.tsx

- Line 313: `v0.23.0` chip — correct but will need update when v0.24 ships

### architecture/package-compatibility.tsx

- Line 34: `v0.18.0 引入的 Universal WC Engine` — references v0.18.0 in current codebase\
  Lines 171-174: `v0.18.1`, `v0.18.2`, `v0.18.3` roadmap items — all long past due. These features have either shipped or been abandoned.

### architecture/standards-registry.tsx

- Line 129: `v0.16 不应该直接冻结完整生态协议` — references v0.16 which is notably old

### guide/core-concepts.tsx

- Line 88: `&lt;Show when=signal&gt;...children...&lt;/Show&gt; (v0.26.1)` — correct, current version

### registry/index.tsx

- Line 4: `v0.19.0: Browse and search validated Web Component packages` — references v0.19.0

---

## 5. Duplicate CSS (P1)

### `hub/index.tsx` vs `docs/index.tsx`

Nearly identical CSS architecture shared between two files:

- Same `:host` local variable definitions (lines 18-25 hub, lines 18-22 docs)
- Same `.shell` class with minor `padding` differences
- Same `.card`/`.path` patterns
- Same media query breakpoints
- Same chip styles

**Recommendation**: Extract shared "landing page card grid" styles into `page-styles.js` or a dedicated shared sheet.

### `registry/index.tsx` and `registry/[package].tsx`

- Both define identical `COMPAT_LABELS` and `COMPAT_COLORS` objects (identical code duplication)
- Same `.compat-badge` pattern across files

**Recommendation**: Create a shared `registry-styles.ts` module.

### `guide/architecture.tsx`

Duplicates `.shell` class with `44px var(--size-6) 72px` padding pattern seen in `roadmap.tsx`, `architecture/architecture.tsx`, and others.

---

## 6. `_esc()` Usage (P2)

### changelog.tsx

- Line 246-252: Defines local `esc()` helper function — HTML entity escaping for inline markdown rendering
- Lines 178-184, 191, 198, 236: Calls `esc()` and `renderInline()` in the changelog markdown renderer

**Assessment**: This is **legitimate** and necessary. The changelog page reads raw CHANGELOG.md at build time and renders it as HTML strings. The `esc()` function prevents XSS in the markdown content. The markdown renderer is self-contained and intentionally avoids external dependencies.

---

## 7. Hard-Coded `locale` (P0)

### apilist.tsx

- Line 43: `locale="zh"` — hard-coded string instead of `this._getLocale('zh')`\
  Line 156: `locale="en"` — same
  **However**: this is a template literal, so `_getLocale()` IS available. Should be `locale="${this._getLocale('zh')}"`

### registry/index.tsx

- Line 426: `locale="en"` — hard-coded. No `_getLocale()` call
- Line 427: `locales='${JSON.stringify(['en'])}'` — only 'en' locale

### registry/[package].tsx

- Lines 232-234, 246-248: `locale="en"` hard-coded, `locales='${JSON.stringify(['en'])}'` — only en

### blog/[slug].tsx

- Uses `_getLocale()` correctly in JSX render. Clean.

### index/index.tsx

- Line 177: `locale='en'` — hard-coded, no `_getLocale()` call despite having `isZh` logic. Clever: determines isZh from locale then hard-codes 'en' — should use `_getLocale()`.

---

## 8. Raw `<style>` in render() (P0)

**No violations found** — all files use `StyleSheet` via `static styles`. This is clean across the board.

---

## 9. Additional Issues Found

### Duplicate Import (P1)

**`guide/getting-started.tsx`**

- Lines 9-10: `import '../../islands/less-toc.tsx';` imported **TWICE**. Same import statement duplicated on consecutive lines.

### Inline Styles in Render (P1)

**`architecture/design-system.tsx`**

- Lines 283-305: ~24 instances of `style='background:#xxx'` on swatch divs in render output. These are inline styles on DOM elements, not in CSS. Used to display design system palette swatches. Moving them to CSS classes would be more maintainable.

### Version Comment Lying (P1)

**`architecture/package-compatibility.tsx`**

- Lines 171-174: Lists roadmap items `v0.18.1`, `v0.18.2`, `v0.18.3` that are clearly past versions. Since the codebase is at v0.26.x, these items are either done or abandoned. The comment "lies" about the current state.

---

## Summary: Migration Priority

| Priority                         | Files                                          | Effort                                   |
| -------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| P0 — html template → JSX         | 19 files                                       | High (per-file rewrite)                  |
| P0 — hard-coded locale           | 4 files                                        | Low (1-line fix each)                    |
| P0 — hard-coded colors in styles | 3 files (hub, docs, architecture/architecture) | Medium (replace local vars)              |
| P1 — COMPAT_COLORS objects       | 2 files (registry/*)                           | Low (extract shared module + use tokens) |
| P1 — dead version comments       | 4 files                                        | Low (update/remove stale comments)       |
| P1 — duplicate CSS               | hub + docs, registry/*                         | Medium (extract shared styles)           |
| P1 — inline swatch styles        | design-system.tsx                              | Low (CSS class extraction)               |
| P1 — duplicate import            | getting-started.tsx                            | Trivial (delete line 10)                 |
| P2 — `_esc()` usage              | changelog.tsx                                  | No action needed (legitimate)            |

### Quick Wins (sub-5-minute fixes):

1. **Delete** `getting-started.tsx` line 10 (duplicate import)
2. **Replace** `locale="en"` with `locale=${this._getLocale('en')}` in `registry/index.tsx`, `registry/[package].tsx`
3. **Fix** `apilist.tsx` locale strings
4. **Replace** local `--ink`/`--muted`/`--border`/`--accent`/`--success`/`--danger` in `hub/index.tsx` and `docs/index.tsx` with existing semantic tokens
