/**
 * @lessjs/ui - Design Tokens: Animation & Motion
 *
 * Duration and easing tokens for consistent motion across all components.
 * www-redesign: explicit timing + easing system for micro-interactions,
 * scroll reveals, and page transitions.
 *
 * All animations must respect prefers-reduced-motion: reduce.
 */

/** Animation/motion CSS custom properties (pure CSS string — v0.20 Ocean-Island) */
export const lessAnimationTokens = `
  :host {
    /* === Duration Scale === */
    --less-duration-micro: 150ms;      /* button hover, color switch */
    --less-duration-fast: 200ms;       /* tab switch, expand/collapse */
    --less-duration-reveal: 400ms;     /* scroll reveal animation */
    --less-duration-transition: 300ms;  /* page transition */

    /* === Easing Functions === */
    --less-easing-default: ease-out;
    --less-easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  }
`;
