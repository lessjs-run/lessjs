/**
 * @lessjs/ui - Design Tokens: Border Radius
 *
 * 6-level radius scale for consistent rounding across all components.
 * www-redesign: expanded from 3-level to 6-level for finer control.
 */

import { css } from 'lit';

/** Border radius CSS custom properties */
export const lessRadiusTokens: ReturnType<typeof css> = css`
  :host {
    /* === Border Radius Scale (6 levels) === */
    --less-radius-xs: 2px; /* badges, tags */
    --less-radius-sm: 4px; /* buttons, inputs */
    --less-radius-md: 8px; /* cards, panels */
    --less-radius-lg: 12px; /* large cards, modals */
    --less-radius-xl: 16px; /* code panels */
    --less-radius-full: 9999px; /* circular avatars, pills */
  }
`;
