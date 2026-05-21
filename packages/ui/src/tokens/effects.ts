/**
 * @lessjs/ui - Design Tokens: Effects
 *
 * Shadows and visual elevation.
 * v0.19.1 Phase 6: Explicit 3-tier shadow system (ADR-0035 B1)
 * replacing OpenProps variable references with direct values.
 */

/** Shadow/effect CSS custom properties (pure CSS string — v0.20 Ocean-Island) */
export const lessEffectTokens = `
  :host {
    /* === Shadow System (3-tier) === */
    --less-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
    --less-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
    --less-shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);

    /* === Brand Shadow System (www-redesign) === */
    --less-shadow-brand-sm: 0 2px 12px rgba(83, 74, 183, 0.2);
    --less-shadow-brand-md: 0 4px 20px rgba(83, 74, 183, 0.3);
    --less-shadow-brand-lg: 0 8px 32px rgba(83, 74, 183, 0.4);
    --less-shadow-glow: 0 0 20px rgba(83, 74, 183, 0.15);
  }

  /* Dark mode: lighter shadows on dark surfaces */
  :host([data-theme="dark"]) {
    --less-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
    --less-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
    --less-shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
`;
