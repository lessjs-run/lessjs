/**
 * @lessjs/ui - Design Tokens: Spacing & Layout
 *
 * KISS spacing scale based on 4px base unit (Swiss grid).
 * Consistent rhythm across all components.
 */

import { css } from 'lit';

/** Spacing & layout CSS custom properties */
export const kissSpacingTokens = css`
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

    /* === Border Radius (Swiss: minimal) === */
    --less-radius-sm: 2px;
    --less-radius-md: 4px;
    --less-radius-lg: 6px;

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
