/**
 * @lessjs/ui - Open Props Token Sheet
 *
 * Shared CSSStyleSheet defining design tokens (spacing, gray palette,
 * border radius, typography, semantic brand/text/bg/border tokens)
 * that all LessJS components can adopt via `static styles`.
 *
 * v0.26.1: Cleaned dead tokens (49 removed). Only used tokens survive.
 */

import { StyleSheet, type StyleSheetLike } from '@lessjs/style-sheet';

export const openPropsTokenSheet: StyleSheetLike = createTokenSheet();

function createTokenSheet(): StyleSheetLike {
  const sheet: StyleSheetLike = new StyleSheet();
  sheet.replaceSync(`:host {
  display: block;
  min-height: 1px;
  contain: layout style;

  /* ═══════════════════════════════════════════════
     Spacing scale
     ═══════════════════════════════════════════════ */
  --size-1: 4px;   --size-2: 8px;   --size-3: 12px;  --size-4: 16px;
  --size-5: 20px;  --size-6: 24px;  --size-7: 28px;  --size-8: 32px;
  --size-9: 36px;  --size-10: 40px; --size-12: 48px; --size-16: 64px;

  /* ═══════════════════════════════════════════════
     Gray palette (light mode base)
     ═══════════════════════════════════════════════ */
  --gray-0: #f8f9fa;  --gray-1: #f1f3f5; --gray-2: #e9ecef;
  --gray-3: #dee2e6;  --gray-4: #ced4da; --gray-5: #adb5bd;
  --gray-6: #868e96;  --gray-7: #495057; --gray-8: #343a40;
  --gray-9: #212529;  --gray-10: #16191d; --gray-11: #0d0f12;
  --gray-12: #030507;

  /* ═══════════════════════════════════════════════
     Border radius
     ═══════════════════════════════════════════════ */
  --radius-1: 4px; --radius-2: 8px; --radius-3: 12px; --radius-4: 16px;
  --radius-round: 9999px;

  /* ═══════════════════════════════════════════════
     Border size
     ═══════════════════════════════════════════════ */
  --border-size-1: 1px; --border-size-2: 2px;

  /* ═══════════════════════════════════════════════
     Shadows
     ═══════════════════════════════════════════════ */
  --shadow-1: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);

  /* ═══════════════════════════════════════════════
     Typography
     ═══════════════════════════════════════════════ */
  --font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', monospace;
  --font-size-00: 0.75rem; --font-size-0: 0.875rem;
  --font-size-1: 1rem;     --font-size-2: 1.25rem;
  --font-size-3: 1.5rem;   --font-size-4: 2rem;
  --font-size-5: 2.5rem;   --font-size-6: 3rem;
  --font-size-7: 3.5rem;   --font-size-8: 4rem;
  --font-weight-4: 400; --font-weight-5: 500;
  --font-weight-6: 600; --font-weight-7: 700;
  --font-weight-8: 800; --font-weight-9: 900;
  --font-letterspacing-0: -0.02em;
  --font-letterspacing-4: 0.04em;
  --font-letterspacing-5: 0.08em;
  --font-lineheight-1: 0.95;
  --font-lineheight-3: 1.5;
  --font-lineheight-4: 1.75;

  /* ═══════════════════════════════════════════════
     Animation easing
     ═══════════════════════════════════════════════ */
  --ease-1: cubic-bezier(.25, 0, .5, 1);
  --ease-2: cubic-bezier(.45, 0, .25, 1);
  --ease-3: cubic-bezier(.5, 0, 0, 1);
  --duration-2: 200ms;

  /* ═══════════════════════════════════════════════
     Brand tokens
     ═══════════════════════════════════════════════ */
  --brand: #534ab7;      --brand-hover: #4039a0;
  --brand-light: #6d5ce8; --brand-pale: #8b7cf6;
  --brand-deep: #26215c;  --brand-subtle: rgba(83, 74, 183, 0.1);
  --brand-glow: rgba(83, 74, 183, 0.15);

  /* ═══════════════════════════════════════════════
     UI Semantic Tokens (light defaults)
     Dark mode overrides via :root[data-theme="dark"] in SSG
     ═══════════════════════════════════════════════ */
  --text-primary: var(--gray-9);
  --text-secondary: var(--gray-6);
  --text-muted: var(--gray-5);
  --bg-base: var(--gray-0);
  --bg-surface: var(--gray-1);
  --bg-card: var(--gray-0);
  --bg-elevated: #ffffff;
  --bg-hover: var(--gray-2);
  --bg-muted: var(--gray-1);
  --border: var(--gray-3);
  --border-hover: var(--gray-4);
  /* --bg-code, --code-border: inherited from :root[data-theme] via SSG polyfill */
  --error: #dc3545;
  --error-subtle: rgba(220,53,69,0.1);
  --success: #16a34a;
  --success-subtle: rgba(22,163,74,0.1);
  --warning: #d97706;
  --warning-subtle: rgba(217,119,6,0.1);
  --info: #2563eb;
  --info-subtle: rgba(37,99,235,0.1);
  --overlay: rgba(0,0,0,0.4);
}

/* ═══════════════════════════════════════════════
   Dark Mode — cascades from :root[data-theme="dark"]
   All shadow DOMs inherit these overrides
   ═══════════════════════════════════════════════ */
:host([data-theme="dark"]),
:host-context([data-theme="dark"]) {
  --gray-0: #030507;  --gray-1: #0d0f12; --gray-2: #16191d;
  --gray-3: #212529;  --gray-4: #343a40; --gray-5: #495057;
  --gray-6: #868e96;  --gray-7: #adb5bd; --gray-8: #ced4da;
  --gray-9: #dee2e6;  --gray-10: #e9ecef; --gray-11: #f1f3f5;
  --gray-12: #f8f9fa;
  --brand: #7c6ff5;     --brand-hover: #6d5ce8;
  --brand-light: #8b7cf6; --brand-deep: #3d3580;
  --brand-subtle: rgba(124,111,245,.15);
  --brand-glow: rgba(124,111,245,.2);
  --text-primary: var(--gray-10);
  --text-secondary: var(--gray-7);
  --text-muted: var(--gray-6);
  --bg-base: var(--gray-0);
  --bg-surface: var(--gray-1);
  --bg-card: var(--gray-2);
  --bg-elevated: var(--gray-1);
  --bg-hover: var(--gray-3);
  --border: var(--gray-3);
  --border-hover: var(--gray-4);
  --error: #f87171;
  --error-subtle: rgba(248,113,113,.15);
  --success: #4ade80;
  --success-subtle: rgba(74,222,128,.1);
  --warning: #fbbf24;
  --warning-subtle: rgba(251,191,36,.1);
  --info: #60a5fa;
  --info-subtle: rgba(96,165,250,.1);
  --overlay: rgba(0,0,0,.6);
}
`);
  return sheet;
}
