/**
 * @lessjs/ui - Design Tokens: Border Radius
 *
 * 6-level radius scale for consistent rounding across all components.
 * www-redesign: expanded from 3-level to 6-level for finer control.
 */

/** Border radius CSS custom properties (pure CSS string — v0.20 Ocean-Island) */
export const lessRadiusTokens = `
  :host {
    /* === Border Radius Scale (6 levels) === */
    --less-radius-xs: 2px;     /* badges, tags */
    --less-radius-sm: 4px;     /* buttons, inputs */
    --less-radius-md: 8px;     /* cards, panels */
    --less-radius-lg: 12px;    /* large cards, modals */
    --less-radius-xl: 16px;    /* code panels */
    --less-radius-full: 9999px; /* circular avatars, pills */
  }
`;
