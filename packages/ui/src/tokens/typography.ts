/**
 * @lessjs/ui - Design Tokens: Typography
 *
 * Swiss International Style: System font stack with precise sizing scale.
 * Line heights follow the golden ratio for optimal readability.
 */

import { css } from 'lit';

/** Typography CSS custom properties */
export const lessTypographyTokens: ReturnType<typeof css> = css`
  :host {
    /* === Font Families === */
    --less-font-sans:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      Arial,
      sans-serif;
    --less-font-mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;

    /* === Font Sizes (modular scale ~1.125) === */
    --less-font-size-xs: 0.6875rem; /* 11px */
    --less-font-size-sm: 0.75rem; /* 12px */
    --less-font-size-md: 0.875rem; /* 14px */
    --less-font-size-lg: 1rem; /* 16px */
    --less-font-size-xl: 1.125rem; /* 18px */
    --less-font-size-2xl: 1.25rem; /* 20px */
    --less-font-size-3xl: 1.5rem; /* 24px */

    /* === Display Typography (www-redesign) === */
    --less-font-size-display: clamp(3rem, 7vw, 5rem);
    --less-font-size-h1: clamp(2rem, 4vw, 2.75rem);

    /* === Font Weights === */
    --less-font-weight-normal: 400;
    --less-font-weight-medium: 500;
    --less-font-weight-semibold: 600;
    --less-font-weight-bold: 700;
    --less-font-weight-extrabold: 800;

    /* === Line Heights === */
    --less-line-height-tight: 1.2;
    --less-line-height-normal: 1.5;
    --less-line-height-relaxed: 1.7;

    /* === Letter Spacing === */
    --less-letter-spacing-tight: -0.03em;
    --less-letter-spacing-normal: 0;
    --less-letter-spacing-wide: 0.02em;
    --less-letter-spacing-wider: 0.05em;
    --less-letter-spacing-widest: 0.15em;
  }
`;
