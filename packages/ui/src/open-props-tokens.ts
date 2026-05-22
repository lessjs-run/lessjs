/**
 * @lessjs/ui - Open Props Design Tokens (CSSStyleSheet).
 *
 * ZERO Lit dependency. Pure CSSStyleSheet containing inlined Open Props
 * design tokens. No CDN dependency - all values are embedded for zero
 * flash-of-unstyled-content (FOUC) on first paint.
 *
 * Architecture (v0.20.0):
 *   - CSSStyleSheet replaces Lit's CSSResult for framework-agnostic usage.
 *   - DsdElement.styles can reference this directly via adoptedStyleSheets.
 *   - SSR pipeline extracts CSS rules from CSSStyleSheet via cssRules.
 *   - All values inlined - no open-props.style CDN needed.
 *
 * Token naming convention:
 *   Open Props native: --size-N, --gray-N, --indigo-N, --radius-N,
 *                      --shadow-N, --font-*, --ease-*, --border-size-N
 *   Brand semantic:    --brand, --brand-hover, --brand-light, --brand-pale,
 *                      --brand-deep, --brand-subtle, --brand-glow
 *   UI semantic:       --text-primary/secondary/muted,
 *                      --bg-base/surface/card/code/elevated/hover/muted,
 *                      --border, --border-hover, --code-border,
 *                      --shadow-brand-sm/md/lg, --shadow-glow,
 *                      --radius-sm/md/lg/xl/full,
 *                      --duration-micro/fast/transition/normal/slow/reveal,
 *                      --easing-default/spring,
 *                      --font-size-display/h1/xs/sm/md/lg/xl/2xl/3xl,
 *                      --z-dropdown/sticky/fixed/tooltip/modal/popover/modal-backdrop
 *
 * All variables are wrapped in `:host { }` so they are valid CSS rules -
 * both for native CSSStyleSheet.replaceSync() in the browser and for
 * the ShimStyleSheet parser in Deno/Node SSR environments.
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
 * embedded directly - no network requests.
 *
 * Components can adopt this stylesheet via `static styles` (DsdElement)
 * or `adoptedStyleSheets` (vanilla Web Components).
 */
export const openPropsTokenSheet: StyleSheetLike = createTokenSheet();

function createTokenSheet(): StyleSheetLike {
  const sheet: StyleSheetLike = new StyleSheet();
  sheet.replaceSync(`:host {
  /* ═══════════════════════════════════════════════
     Open Props Native Tokens
     ═══════════════════════════════════════════════ */

  /* ─── Spacing scale ─── */
  --size-1: 4px;
  --size-2: 8px;
  --size-3: 12px;
  --size-4: 16px;
  --size-5: 20px;
  --size-6: 24px;
  --size-7: 28px;
  --size-8: 32px;
  --size-9: 36px;
  --size-10: 40px;
  --size-12: 48px;
  --size-16: 64px;

  /* ─── Gray palette (light mode) ─── */
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

  /* ═══════════════════════════════════════════════
     Brand Semantic Tokens
     ═══════════════════════════════════════════════ */
  --brand: #534ab7;
  --brand-hover: #4039a0;
  --brand-light: #6d5ce8;
  --brand-pale: #8b7cf6;
  --brand-deep: #26215c;
  --brand-subtle: rgba(83, 74, 183, 0.1);
  --brand-glow: rgba(83, 74, 183, 0.15);

  /* ═══════════════════════════════════════════════
     UI Semantic Tokens
     ═══════════════════════════════════════════════ */

  /* ─── Text ─── */
  --text-primary: var(--gray-9);
  --text-secondary: var(--gray-6);
  --text-muted: var(--gray-5);

  /* ─── Background ─── */
  --bg-base: var(--gray-0);
  --bg-surface: var(--gray-1);
  --bg-card: var(--gray-0);
  --bg-code: #1e1e2e;
  --bg-elevated: #ffffff;
  --bg-hover: var(--gray-2);
  --bg-muted: var(--gray-1);

  /* ─── Border ─── */
  --border: var(--gray-3);
  --border-hover: var(--gray-4);
  --code-border: rgba(255,255,255,0.06);

  /* ─── Status ─── */
  --error: #dc3545;

  /* ─── Radius semantic ─── */
  --radius-sm: var(--radius-1);
  --radius-md: var(--radius-2);
  --radius-lg: var(--radius-3);
  --radius-xl: var(--radius-4);
  --radius-full: var(--radius-round);
  --radius-xs: 2px;

  /* ─── Brand shadows ─── */
  --shadow-brand-sm: 0 2px 12px rgba(83, 74, 183, 0.2);
  --shadow-brand-md: 0 4px 20px rgba(83, 74, 183, 0.3);
  --shadow-brand-lg: 0 8px 32px rgba(83, 74, 183, 0.4);
  --shadow-glow: 0 0 20px rgba(83, 74, 183, 0.15);

  /* ─── Duration ─── */
  --duration-micro: 150ms;
  --duration-fast: 200ms;
  --duration-transition: 300ms;
  --duration-normal: 400ms;
  --duration-slow: 600ms;
  --duration-reveal: 500ms;

  /* ─── Easing ─── */
  --easing-default: ease-out;
  --easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ─── Font size semantic ─── */
  --font-size-display: clamp(3rem, 7vw, 5rem);
  --font-size-h1: clamp(2rem, 4vw, 2.75rem);
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;
  --font-size-3xl: 2.5rem;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  --letter-spacing-normal: normal;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* ─── Layout ─── */
  --layout-header-height: 64px;
  --scrollbar-thumb: var(--gray-4);
  --scrollbar-track: var(--gray-1);

  /* ─── Z-index ─── */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-tooltip: 400;
  --z-modal-backdrop: 500;
  --z-modal: 510;
  --z-popover: 600;
}

/* ═══════════════════════════════════════════════
   Dark Mode Overrides
   ═══════════════════════════════════════════════ */
:host([data-theme="dark"]) {
  /* ─── Gray palette (dark mode - inverted) ─── */
  --gray-0: #030507;
  --gray-1: #0d0f12;
  --gray-2: #16191d;
  --gray-3: #212529;
  --gray-4: #343a40;
  --gray-5: #495057;
  --gray-6: #868e96;
  --gray-7: #adb5bd;
  --gray-8: #ced4da;
  --gray-9: #dee2e6;
  --gray-10: #e9ecef;
  --gray-11: #f1f3f5;
  --gray-12: #f8f9fa;

  /* ─── Brand (slightly lighter for dark bg) ─── */
  --brand: #7c6ff5;
  --brand-hover: #6d5ce8;
  --brand-light: #8b7cf6;
  --brand-pale: #a594f8;
  --brand-deep: #3d3580;
  --brand-subtle: rgba(124, 111, 245, 0.15);
  --brand-glow: rgba(124, 111, 245, 0.2);

  /* ─── Text ─── */
  --text-primary: var(--gray-10);
  --text-secondary: var(--gray-7);
  --text-muted: var(--gray-6);

  /* ─── Background ─── */
  --bg-base: var(--gray-0);
  --bg-surface: var(--gray-1);
  --bg-card: var(--gray-2);
  --bg-code: #0d0d12;
  --bg-elevated: var(--gray-2);
  --bg-hover: var(--gray-3);
  --bg-muted: var(--gray-1);

  /* ─── Border ─── */
  --border: var(--gray-3);
  --border-hover: var(--gray-4);
  --code-border: rgba(255, 255, 255, 0.08);

  /* ─── Status ─── */
  --error: #f06565;

  /* ─── Brand shadows (brighter for dark) ─── */
  --shadow-brand-sm: 0 2px 12px rgba(124, 111, 245, 0.25);
  --shadow-brand-md: 0 4px 20px rgba(124, 111, 245, 0.35);
  --shadow-brand-lg: 0 8px 32px rgba(124, 111, 245, 0.45);
  --shadow-glow: 0 0 20px rgba(124, 111, 245, 0.2);

  /* ─── Layout ─── */
  --scrollbar-thumb: var(--gray-5);
  --scrollbar-track: var(--gray-1);
}`);
  return sheet;
}
