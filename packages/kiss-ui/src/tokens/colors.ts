/**
 * @kissjs/ui - Design Tokens: Color Themes
 *
 * KISS Design System based on OpenProps design tokens.
 * Light theme by default, Dark via data-theme attribute.
 *
 * Token naming: --kiss-{category}-{variant}
 *
 * SINGLE SOURCE OF TRUTH:
 * All color token values are defined below, referencing OpenProps CSS variables
 * (var(--gray-N), var(--red-N), etc.). At runtime, OpenProps CSS from CDN
 * provides the resolved color values. Users can override any OpenProps variable
 * globally to customize the theme.
 *
 * ARCHITECTURE NOTE — Theme Propagation in Shadow DOM:
 *
 * CSS custom properties DO inherit through Shadow DOM. However,
 * when a component's `:host` rule declares a custom property,
 * it shadows (overrides) the inherited value from `:root`.
 *
 * KISS theme strategy:
 *   1. `:host` declares light-theme defaults — provides fallback
 *      for standalone usage (without global <style>).
 *   2. `:host([data-theme="dark"])` overrides for dark theme.
 *   3. The kiss-theme-toggle Island propagates `data-theme` to
 *      both `<html>` AND every KISS component host element,
 *      so both `:root` vars (for light DOM) and `:host([data-theme])`
 *      selectors (for Shadow DOM) work correctly.
 *
 * DRY enforcement:
 *   - `kissColorValues` is the single source of truth
 *   - `kissColorTokens` generates `:host` CSS for Shadow DOM components
 *   - `kissRootColorCSS` generates `:root` CSS for page-level injection
 *   - Both MUST stay in sync — editing the object keeps them in sync
 */

// Import from 'lit' directly (not '@kissjs/core') to avoid circular dependency
// in Vite config bundling. This module is infrastructure — it must work in
// Node.js contexts (vite.config.ts) where @kissjs/core isn't resolvable.
import { css, unsafeCSS } from 'lit';

// ============================================================
// SINGLE SOURCE OF TRUTH — Color Token Values
// ============================================================
// Values reference OpenProps CSS variables (loaded via CDN).
// See: https://open-props.style/#colors

/** Dark theme color values (default) */
export const kissDarkColors = {
  '--kiss-bg-base': 'hsl(210 17% 10%)',
  '--kiss-bg-surface': 'hsl(210 17% 15%)',
  '--kiss-bg-elevated': 'hsl(210 17% 21%)',
  '--kiss-bg-hover': 'hsl(210 17% 15%)',
  '--kiss-bg-card': 'hsl(210 17% 15%)',
  '--kiss-border': 'hsl(210 17% 28%)',
  '--kiss-border-hover': 'hsl(210 17% 38%)',
  '--kiss-text-primary': 'hsl(210 17% 98%)',
  '--kiss-text-secondary': 'hsl(210 17% 69%)',
  '--kiss-text-tertiary': 'hsl(210 17% 47%)',
  '--kiss-text-muted': 'hsl(210 17% 38%)',
  '--kiss-accent': 'hsl(210 17% 98%)',
  '--kiss-accent-dim': 'hsl(210 17% 80%)',
  '--kiss-accent-subtle': 'hsl(210 17% 15%)',
  '--kiss-code-bg': 'hsl(210 17% 21%)',
  '--kiss-code-border': 'hsl(210 17% 28%)',
  '--kiss-error': 'hsl(0 80% 65%)',
  '--kiss-scrollbar-track': 'transparent',
  '--kiss-scrollbar-thumb': 'hsl(210 17% 28%)',
} as const;

/** Light theme color values */
export const kissLightColors = {
  '--kiss-bg-base': 'hsl(210 17% 98%)',
  '--kiss-bg-surface': 'hsl(210 17% 95%)',
  '--kiss-bg-elevated': 'hsl(210 17% 92%)',
  '--kiss-bg-hover': 'hsl(210 17% 92%)',
  '--kiss-bg-card': 'hsl(210 17% 98%)',
  '--kiss-border': 'hsl(210 17% 87%)',
  '--kiss-border-hover': 'hsl(210 17% 80%)',
  '--kiss-text-primary': 'hsl(210 17% 10%)',
  '--kiss-text-secondary': 'hsl(210 17% 47%)',
  '--kiss-text-tertiary': 'hsl(210 17% 57%)',
  '--kiss-text-muted': 'hsl(210 17% 69%)',
  '--kiss-accent': 'hsl(210 17% 10%)',
  '--kiss-accent-dim': 'hsl(210 17% 38%)',
  '--kiss-accent-subtle': 'hsl(210 17% 92%)',
  '--kiss-code-bg': 'hsl(210 17% 92%)',
  '--kiss-code-border': 'hsl(210 17% 87%)',
  '--kiss-error': 'hsl(0 80% 50%)',
  '--kiss-scrollbar-track': 'transparent',
  '--kiss-scrollbar-thumb': 'hsl(210 17% 80%)',
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

/** Color theme CSS custom properties for Shadow DOM components (:host) */
export const kissColorTokens = css`
  :host,
  :host([data-theme="light"]) {
    ${unsafeCSS(declarations(kissLightColors))};
    color-scheme: light;
  }

  :host([data-theme="dark"]) {
    ${unsafeCSS(declarations(kissDarkColors))};
    color-scheme: dark;
  }
`;

/**
 * Page-level CSS for :root injection (headFragments).
 * Use this in vite.config.ts `inject.headFragments` instead of
 * hand-writing the CSS values — ensures DRY with component tokens.
 *
 * Usage:
 * ```ts
 * import { kissRootColorCSS } from '@kissjs/ui/tokens/colors.js';
 * // or: import { kissRootColorCSS } from '@kissjs/ui/design-tokens.js';
 *
 * inject: {
 *   headFragments: [
 *     `<style>${kissRootColorCSS}</style>`,
 *   ]
 * }
 * ```
 */
export const kissRootColorCSS = `:root,[data-theme="light"]{${
  declarations(kissLightColors)
};color-scheme:light}[data-theme="dark"]{${declarations(kissDarkColors)};color-scheme:dark}`;

/**
 * Minified CSS for scaffolding (create-kiss template).
 * Same content as kissRootColorCSS but formatted for inline <style>.
 */
export const kissScaffoldColorCSS = kissRootColorCSS;
