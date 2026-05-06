/**
 * @lessjs/ui - Design Tokens: Color Themes
 *
 * LessJS Design System based on OpenProps design tokens.
 * Light theme by default, Dark via data-theme attribute on :root.
 *
 * Token naming: --less-{category}-{variant}
 *
 * SINGLE SOURCE OF TRUTH:
 * All color token values are defined below, referencing OpenProps CSS variables
 * (var(--gray-N), var(--red-N), etc.). At runtime, OpenProps CSS from CDN
 * provides the resolved color values. Users can override any OpenProps variable
 * globally to customize the theme.
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

// ============================================================
// SINGLE SOURCE OF TRUTH — Color Token Values
// ============================================================
// Values reference OpenProps CSS variables (loaded via CDN).
// See: https://open-props.style/#colors

/** Dark theme color values (default) */
export const lessDarkColors = {
  '--less-bg-base': 'var(--gray-12)',
  '--less-bg-surface': 'var(--gray-11)',
  '--less-bg-elevated': 'var(--gray-10)',
  '--less-bg-hover': 'var(--gray-11)',
  '--less-bg-card': 'var(--gray-11)',
  '--less-border': 'var(--gray-9)',
  '--less-border-hover': 'var(--gray-8)',
  '--less-text-primary': 'var(--gray-0)',
  '--less-text-secondary': 'var(--gray-5)',
  '--less-text-tertiary': 'var(--gray-7)',
  '--less-text-muted': 'var(--gray-8)',
  '--less-accent': 'var(--gray-0)',
  '--less-accent-dim': 'var(--gray-4)',
  '--less-accent-subtle': 'var(--gray-11)',
  '--less-code-bg': 'var(--gray-10)',
  '--less-code-border': 'var(--gray-9)',
  '--less-error': 'var(--red-4)',
  '--less-scrollbar-track': 'transparent',
  '--less-scrollbar-thumb': 'var(--gray-9)',
} as const;

/** Light theme color values */
export const lessLightColors = {
  '--less-bg-base': 'var(--gray-0)',
  '--less-bg-surface': 'var(--gray-1)',
  '--less-bg-elevated': 'var(--gray-2)',
  '--less-bg-hover': 'var(--gray-2)',
  '--less-bg-card': 'var(--gray-0)',
  '--less-border': 'var(--gray-3)',
  '--less-border-hover': 'var(--gray-4)',
  '--less-text-primary': 'var(--gray-12)',
  '--less-text-secondary': 'var(--gray-8)',
  '--less-text-tertiary': 'var(--gray-7)',
  '--less-text-muted': 'var(--gray-6)',
  '--less-accent': 'var(--gray-12)',
  '--less-accent-dim': 'var(--gray-8)',
  '--less-accent-subtle': 'var(--gray-2)',
  '--less-code-bg': 'var(--gray-2)',
  '--less-code-border': 'var(--gray-3)',
  '--less-error': 'var(--red-7)',
  '--less-scrollbar-track': 'transparent',
  '--less-scrollbar-thumb': 'var(--gray-4)',
} as const;

// ============================================================
// CSS GENERATORS — Do not edit CSS strings, edit values above
// ============================================================

/** Generate CSS declarations from a values object */
function declarations(values: Readonly<Record<string, string>>): string {
  return Object.entries(values)
    .map(([prop, value]) => `${prop}:${value}`)
    .join(';');
}

/** Color theme CSS custom properties for Shadow DOM components (:host)
 *
 * v0.6: Does NOT redeclare color values on :host — colors inherit from :root
 * via CSS custom property cascading. :host provides only minimal fallbacks
 * for standalone component usage, referencing the root-declared tokens.
 *
 * Theme switching only needs to update `data-theme` on `:root` — the CSS
 * cascade handles propagation into all shadow roots automatically.
 */
export const lessColorTokens = css`
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
export const lessRootColorCSS = `:root,[data-theme="light"]{${
  declarations(lessLightColors)
};color-scheme:light}[data-theme="dark"]{${declarations(lessDarkColors)};color-scheme:dark}`;

/**
 * Minified CSS for scaffolding (create-kiss template).
 * Same content as lessRootColorCSS but formatted for inline <style>.
 */
export const lessScaffoldColorCSS = lessRootColorCSS;
