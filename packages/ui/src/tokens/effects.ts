/**
 * @lessjs/ui - Design Tokens: Effects
 *
 * Shadows and visual elevation based on OpenProps shadow tokens.
 */

import { css } from 'lit';

/** Shadow/effect CSS custom properties */
export const kissEffectTokens = css`
  :host {
    --less-shadow-sm: var(--shadow-1);
    --less-shadow-md: var(--shadow-3);
    --less-shadow-lg: var(--shadow-5);
  }

  /* Dark mode: override with light-on-dark shadows */
  :host([data-theme="dark"]) {
    --less-shadow-sm: var(--inner-shadow-1);
    --less-shadow-md: var(--inner-shadow-2);
    --less-shadow-lg: var(--inner-shadow-3);
  }
`;
