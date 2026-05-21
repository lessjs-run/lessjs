/**
 * @lessjs/ui - Design Tokens: Color Themes
 *
 * LessJS Design System based on OpenProps design tokens.
 * Light theme by default, Dark via data-theme attribute on :root.
 *
 * Token naming: --less-{category}-{variant}
 *
 * SINGLE SOURCE OF TRUTH:
 * All color token VALUES live in ./color-values.ts (zero dependencies).
 * This file adds Lit-specific CSSResult wrappers on top of those values.
 *
 * v0.6 ARCHITECTURE — CSS Custom Properties for Theme Propagation:
 *
 * CSS custom properties inherit through Shadow DOM automatically.
 * Previously, LessJS used `_propagateTheme()` to recursively walk all shadow
 * roots and set `data-theme` on each host element. This was fragile and did
 * not scale with deep component trees.
 *
 * v0.6 strategy:
 *   1. `lessRootColorCSS` (injected into <head>) declares tokens on `:root`.
 *      Theme switching changes `data-theme` on `:root` — CSS custom properties
 *      cascade into all shadow roots automatically via `var()` references.
 *   2. `lessColorTokens` does NOT redeclare colors on `:host`. Instead,
 *      components reference `var(--less-bg-base)` which inherits from `:root`.
 *      Minimal `:host` fallbacks are provided for standalone component usage
 *      without root CSS.
 *   3. `less-theme-toggle` no longer calls `_propagateTheme()`. It only
 *      updates `data-theme` on `<html>` — CSS handles the rest.
 *
 * Benefits:
 *   - No DOM walking needed — O(1) theme switching regardless of tree depth
 *   - Works with closed shadow roots
 *   - Works with dynamic content added after theme switch
 *   - Follows the platform — CSS custom properties were designed for this
 */

// Import from 'lit' directly (not '@lessjs/core') to avoid circular dependency
// in Vite config bundling. This module is infrastructure — it must work in
// Node.js contexts (vite.config.ts) where @lessjs/core isn't resolvable.
import { css } from 'lit';

// Re-export pure data values from zero-dependency module.
// Both SSG post-processor and Lit components consume these.
export {
  declarations,
  generateRootColorCSS,
  lessDarkColors,
  lessLightColors,
} from './color-values.js';

// Import for use in lessRootColorCSS generation below
import { generateRootColorCSS } from './color-values.js';

/** Color theme CSS custom properties for Shadow DOM components (:host)
 *
 * v0.6: Does NOT redeclare color values on :host — colors inherit from :root
 * via CSS custom property cascading. :host provides only minimal fallbacks
 * for standalone component usage, referencing the root-declared tokens.
 *
 * Theme switching only needs to update `data-theme` on `:root` — the CSS
 * cascade handles propagation into all shadow roots automatically.
 */
export const lessColorTokens: ReturnType<typeof css> = css`
  :host {
    /* v0.6: Color tokens inherit from :root via CSS custom property cascade.
      DO NOT redeclare them on :host — that breaks inheritance!
      Setting --less-bg-base: initial would make var(--less-bg-base) invalid
      inside the shadow root, because 'initial' for custom properties means
      "guaranteed-invalid value", NOT "inherit from parent".

      For standalone usage (without LessJS head styles), the page must
      inject lessRootColorCSS into <head> — this is the expected setup.
      If tokens are missing, var() references without fallbacks will simply
      not apply, which is acceptable for standalone mode. */
    color-scheme: light dark;
  }
`;

/**
 * Page-level CSS for :root injection (headFragments).
 * Generated from lessDarkColors/lessLightColors — SINGLE SOURCE OF TRUTH.
 *
 * Use this in vite.config.ts `inject.headFragments` instead of
 * hand-writing the CSS values — ensures DRY with component tokens.
 *
 * Usage:
 * ```ts
 * import { lessRootColorCSS } from '@lessjs/ui/tokens/colors';
 * // or: import { lessRootColorCSS } from '@lessjs/ui/design-tokens.js';
 *
 * inject: {
 *   headFragments: [
 *     `<style>${lessRootColorCSS}</style>`,
 *   ]
 * }
 * ```
 */
export const lessRootColorCSS: string = generateRootColorCSS();
