# LessJS v0.14.5 Release Notes

> Release Date: 2026-05-15
> Based on: v0.14.4 + comprehensive code review remediation (deliverables/review260515/review260515.md)

---

## 🔴 Blocker Fixes (5 issues)

### B-1: `effect()` Signal Changes Lost During `pending` Window
**Severity**: High | **File**: `packages/signals/src/framework.ts:68-88`

Replaced the boolean `pending` flag with a counter-based approach (`pendingCount`). The Watcher callback now uses a `while` loop to drain all pending signals inside the microtask, ensuring that signal changes occurring during the pending window are not lost. Every invocation of the Watcher callback increments the counter, but only the first schedules the microtask.

### B-2: CSP Nonce Missing Character Validation
**Severity**: Medium | **File**: `packages/core/src/html-escape.ts:104-109`

Added base64 format validation (`NONCE_RE = /^[A-Za-z0-9+/=_-]+$/`) for CSP nonce values before inserting them into HTML attributes. Invalid nonces now trigger a warning via `log.warn` and fall back to `undefined`, preventing attribute injection vectors.

### B-3: `less-dialog._syncInert()` Shadow DOM Compatibility + State Restoration
**Severity**: Medium | **File**: `packages/ui/src/less-dialog.ts:60-61, 176-182, 231-268`

Three-fold fix:
- Added `static _originalInertStates = new WeakMap<Element, boolean>()` to preserve original inert states of siblings, preventing incorrect removal of pre-existing `inert` attributes when the dialog closes.
- `_syncInert()` now handles `ShadowRoot` parentNode (uses `parent.host.parentNode` as fallback), making it compatible with dialogs inside Shadow DOM.
- Added `disconnectedCallback()` to clean up inert states if the dialog is removed from the DOM while open.

### B-4: `renderNestedCustomElements()` Graceful Degradation on renderDSD Failure
**Severity**: Low | **File**: `packages/core/src/render-nested.ts`

Added explicit warning log when `dsdCeElement` is `undefined` (i.e., `renderDSD()` returned unexpected content or an error comment). The fallback to raw `dsdFragment.childNodes` is preserved, but now accompanied by a diagnostic log for debugging.

### B-5: `createVisibleStrategy` IntersectionObserver Memory Leak
**Severity**: Low | **File**: `packages/core/src/island.ts:198-210`

MutationObserver callback now detects when target elements have been removed from DOM (`document.querySelectorAll(tagName).length === 0`) and immediately disconnects both the IntersectionObserver and MutationObserver, rather than waiting for the 30-second timeout.

---

## 🟡 Correctness & Consistency Fixes

### S-1: `batch()` Marked as `@deprecated` (No-op Placeholder)
**File**: `packages/signals/src/sugar.ts:62-76`

Added comprehensive `@deprecated` JSDoc explaining that the current implementation is a no-op placeholder until the TC39 Signal specification finalizes native batching support. Developers are advised that calling `batch()` currently provides no optimization benefit.

### S-2: `islandEffect()` Polling — Reduced Unnecessary MutationObserver Reconnects
**File**: `packages/signals/src/sugar.ts`

Added `lastParent` tracking so the 30-second interval only reconnects the MutationObserver when the host element's parent has actually changed. This eliminates the race window where `disconnect()`/`observe()` between the host being removed from DOM and the next `isConnected` check.

### S-5: `renderDSD()` Adapter Reference Duplication Eliminated
**File**: `packages/core/src/render-dsd.ts:113`

Moved `const adapter = getAdapter()` to the function top (once) and removed the two duplicate `const adapter = getAdapter()` calls at lines 160 and 213, improving code maintainability.

### S-6: `_ensureHistoryOriginals` SSR/SSG Guard
**File**: `packages/core/src/navigation.ts:36-37`

Added `typeof globalThis.history === 'undefined'` guard to prevent `ReferenceError` when the module is imported in SSR/SSG environments where `history` is not available.

### S-7: Regex Named Capture Group — Special Character Escape
**File**: `packages/core/src/navigation.ts:224-229`

Replaced the inline named capture group replacement with a callback that escapes special regex characters (`.*+?^${}()|[\]\\`) in parameter names before inserting them into the regex pattern. Prevents `SyntaxError` on older JavaScript engines and protects against ReDoS when parameter names contain special characters.

---

## 💭 Minor Improvements

### N-1: `parseAttrsToProps` JSON.parse Overhead Reduced
**File**: `packages/core/src/render-nested.ts:56-66`

Added fast structural checks (matching opening/closing brackets) before attempting `JSON.parse()`, avoiding unnecessary throw-catch overhead for strings that begin with `{` or `[` but are not valid JSON (e.g., `{incomplete`).

### N-4: UI Component Registration Strategy Clarified
**Files**: `packages/ui/src/less-button.ts`, `packages/ui/src/less-dialog.ts`, `packages/ui/src/less-theme-toggle.ts`

Added comments explaining the dual registration strategy: direct `customElements.define()` guards support both `island()` usage and direct import paths, with the idempotent guard preventing errors when both registration paths are triggered on the same page.

---

## Version Bump

All 10 packages updated from `0.14.4` to `0.14.5`:
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

Cross-package dependency imports updated accordingly (`@lessjs/*@^0.14.4` → `@lessjs/*@^0.14.5`).
