# LessJS v0.14.4 Release Notes

> Release Date: 2026-05-15
> Based on: v0.14.3 + post-scan remediation fixes

---

## 🔴 Blocker Fix

### B-4: `onNavigate` History API Fallback — Multiple Subscribers Corrupt Each Other's State
**Severity**: High | **File**: `packages/core/src/navigation.ts`

Replaced per-subscriber `history.pushState`/`replaceState` monkey-patching with a shared reference counter pattern. Each call to `onNavigate` increments the counter; each unsubscribe decrements. Only the first subscriber installs the patch; only the last removes it.

Also added lazy `history` capture (deferred until first use) so the module can be imported in non-browser environments (SSR, tests) without `ReferenceError`.

---

## 🟡 Correctness & Consistency Fixes

### S-11: Duplicate `stableHash` Implementation (32-bit vs 64-bit FNV-1a)
**File**: `packages/adapter-vite/src/island-manifest.ts`, `packages/adapter-vite/src/cli/ssg-render.ts`

Exported the 64-bit FNV-1a `stableHash` from `island-manifest.ts` (introduced in v0.14.3 S-8) and replaced the remaining 32-bit FNV-1a variant in `ssg-render.ts`. Now all stable hashing uses the same 64-bit implementation.

### S-13: Visible Strategy Only Observes First Matching Element
**File**: `packages/adapter-vite/src/entry-generators.ts`

Changed `document.querySelector(tag)` to `document.querySelectorAll(tag)` in the generated client entry code. Visible-strategy islands with multiple instances on the same page now properly observe all elements via individual `IntersectionObserver` instances.

---

## 💭 Minor Improvements

### N-6: `maxNestingDepth` Always Reports 0 in Build Report
**File**: `packages/core/src/render-dsd.ts`, `packages/core/src/render-nested.ts`

Added an optional `nestingDepth` parameter to `renderDSD()`. The `renderNestedCustomElements` function now passes the actual parse-tree depth of each custom element, making the build report's `maxNestingDepth` metric meaningful.

### N-7: `insertAfterHead` Regex Doesn't Handle Multi-line `<head>` Tag
**File**: `packages/adapter-vite/src/ssg-postprocess.ts`

Changed `/<head(\s[^>]*)?>/i` to `/<head(\s[\s\S]*?)?>/i` to handle `<head>` tags that span multiple lines.

### N-8: Polyfill Sentinel Symbols Created Per `_createPolyfill` Call
**File**: `packages/signals/src/polyfill.ts`

Moved `UNSET`, `COMPUTING`, and `ERRORED` sentinel symbols to module scope so they are created once regardless of how many times `_createPolyfill` is called (e.g., in tests).

---

## 🔧 Ancillary Fixes

- **Timer leak**: `createVisibleStrategy` now calls `clearTimeout()` when the element is successfully registered. Exported `_clearAllVisibilityTimeouts()` for test cleanup.
- **Lint cleanup**: Removed unused `RenderAdapter` import in `packages/adapter-lit/src/ssr.ts`.

---

## Version Bump

All 10 packages updated from `0.14.3` to `0.14.4`:
- `@lessjs/core`
- `@lessjs/rpc`
- `@lessjs/ui`
- `@lessjs/adapter-lit`
- `@lessjs/adapter-vite`
- `@lessjs/create`
- `@lessjs/signals`
- `@lessjs/content`
- `@lessjs/i18n`
- `@lessjs/app`

Cross-package dependency imports updated accordingly (`@lessjs/*@^0.14.3` → `@lessjs/*@^0.14.4`).
