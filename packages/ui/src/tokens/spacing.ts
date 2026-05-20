/**
 * @lessjs/ui - Design Tokens: Spacing & Layout
 *
 * LessJS spacing scale based on 4px base unit (Swiss grid).
 * Consistent rhythm across all components.
 */

import { css } from 'lit';

/** Spacing & layout CSS custom properties */
export const lessSpacingTokens: ReturnType<typeof css> = css`
  :host {
    /* === Spacing Scale (4px base unit) === */
    --less-size-1: 0.25rem; /* 4px */
    --less-size-2: 0.375rem; /* 6px */
    --less-size-3: 0.5rem; /* 8px */
    --less-size-4: 0.75rem; /* 12px */
    --less-size-5: 1rem; /* 16px */
    --less-size-6: 1.25rem; /* 20px */
    --less-size-7: 1.5rem; /* 24px */
    --less-size-8: 2rem; /* 32px */
    --less-size-9: 2.5rem; /* 40px */
    --less-size-10: 3rem; /* 48px */

    /* === Extended Spacing (v0.19.1 Phase 6, ADR-0035 B1) === */
    --less-size-12: 3.75rem; /* 60px */
    --less-size-16: 5rem; /* 80px */

    /* === Semantic Spacing Tokens (www-redesign) === */
    --less-space-1: 4px; /* 4px — minimal gap (icon-text) */
    --less-space-2: 8px; /* 8px — compact (button inner) */
    --less-space-3: 12px; /* 12px — base (form elements) */
    --less-space-4: 16px; /* 16px — standard (card padding) */
    --less-space-5: 24px; /* 24px — block spacing */
    --less-space-6: 32px; /* 32px — section spacing */
    --less-space-7: 40px; /* 40px — large section */
    --less-space-8: 48px; /* 48px — major section */
    --less-space-9: 56px; /* 56px — large section */
    --less-space-16: 64px; /* 64px — page-level spacing */

    /* === Border Radius (v0.19.1: slightly larger for softer feel) === */
    --less-radius-sm: 4px;
    --less-radius-md: 6px;
    --less-radius-lg: 8px;

    /* === Transitions === */
    --less-transition-fast: 0.1s ease;
    --less-transition-normal: 0.15s ease;
    --less-transition-slow: 0.25s ease;

    /* === Z-Index Scale === */
    --less-z-dropdown: 100;
    --less-z-sticky: 200;
    --less-z-fixed: 300;
    --less-z-modal-backdrop: 400;
    --less-z-modal: 500;
    --less-z-popover: 600;
    --less-z-tooltip: 700;
  }
`;
