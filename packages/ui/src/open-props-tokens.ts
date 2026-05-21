/**
 * @lessjs/ui - Open Props Design Tokens (CSSStyleSheet).
 *
 * ZERO Lit dependency. Pure CSSStyleSheet containing inlined Open Props
 * design tokens. No CDN dependency — all values are embedded for zero
 * flash-of-unstyled-content (FOUC) on first paint.
 *
 * Architecture (v0.20.0):
 *   - CSSStyleSheet replaces Lit's CSSResult for framework-agnostic usage.
 *   - DsdElement.styles can reference this directly via adoptedStyleSheets.
 *   - SSR pipeline extracts CSS rules from CSSStyleSheet via cssRules.
 *   - All values inlined — no open-props.style CDN needed.
 *
 * Token naming follows Open Props convention:
 *   --size-N, --gray-N, --indigo-N, --radius-N, --shadow-N, --font-*, --ease-*
 *
 * Usage:
 * ```ts
 * import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
 *
 * class MyComponent extends DsdElement {
 *   static styles = openPropsTokenSheet;
 *   // ...
 * }
 * ```
 *
 * @module @lessjs/ui/open-props-tokens
 */

import { StyleSheet, type StyleSheetLike } from '@lessjs/core';

/**
 * Open Props design tokens as an inlined StyleSheet.
 *
 * Provides spacing scale, gray palette, brand colors, border radius,
 * shadows, typography, and animation easing tokens. All values are
 * embedded directly — no network requests.
 *
 * Components can adopt this stylesheet via `static styles` (DsdElement)
 * or `adoptedStyleSheets` (vanilla Web Components).
 */
export const openPropsTokenSheet = createTokenSheet();

function createTokenSheet(): StyleSheetLike {
  const sheet = new StyleSheet();
  sheet.replaceSync(`
  /* ─── Spacing scale (from Open Props) ─── */
  --size-1: 4px;
  --size-2: 8px;
  --size-3: 12px;
  --size-4: 16px;
  --size-5: 20px;
  --size-6: 24px;
  --size-8: 64px;
  --size-10: 80px;
  --size-12: 96px;
  --size-16: 128px;

  /* ─── Gray palette (from Open Props) - light mode ─── */
  --gray-0: #f8f9fa;
  --gray-1: #f1f3f5;
  --gray-2: #e9ecef;
  --gray-3: #dee2e6;
  --gray-4: #ced4da;
  --gray-5: #adb5bd;
  --gray-6: #868e96;
  --gray-7: #495057;
  --gray-8: #343a40;
  --gray-9: #212529;
  --gray-10: #16191d;
  --gray-11: #0d0f12;
  --gray-12: #030507;

  /* ─── Indigo palette (brand accent) ─── */
  --indigo-5: #7950f2;
  --indigo-6: #6741d9;
  --indigo-7: #5a32b3;

  /* ─── Brand overrides ─── */
  --brand: #534ab7;
  --brand-hover: #4039a0;

  /* ─── Border radius ─── */
  --radius-1: 4px;
  --radius-2: 8px;
  --radius-3: 12px;
  --radius-4: 16px;
  --radius-round: 9999px;

  /* ─── Border size ─── */
  --border-size-1: 1px;
  --border-size-2: 2px;

  /* ─── Shadows ─── */
  --shadow-1: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-2: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-3: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* ─── Typography ─── */
  --font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', monospace;
  --font-size-00: 0.75rem;
  --font-size-0: 0.875rem;
  --font-size-1: 1rem;
  --font-size-2: 1.25rem;
  --font-size-3: 1.5rem;
  --font-size-4: 2rem;
  --font-weight-4: 400;
  --font-weight-5: 500;
  --font-weight-6: 600;
  --font-weight-7: 700;

  /* ─── Animation easing ─── */
  --ease-1: cubic-bezier(.25, 0, .5, 1);
  --ease-2: cubic-bezier(.45, 0, .25, 1);
  --ease-3: cubic-bezier(.5, 0, 0, 1);
`);
  return sheet;
}
