/**
 * @lessjs/ui - Design Tokens: Color Themes
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
 *   3. The less-theme-toggle Island propagates `data-theme` to
 *      both `<html>` AND every KISS component host element,
 *      so both `:root` vars (for light DOM) and `:host([data-theme])`
 *      selectors (for Shadow DOM) work correctly.
 *
 * DRY enforcement:
 *   - `kissColorValues` is the single source of truth
 *   - `kissColorTokens` generates `:host` CSS for Shadow DOM components
 *   - `lessRootColorCSS` generates `:root` CSS for page-level injection
 *   - Both MUST stay in sync — editing the object keeps them in sync
 */

// Import from 'lit' directly (not '@lessjs/core') to avoid circular dependency
// in Vite config bundling. This module is infrastructure — it must work in
// Node.js contexts (vite.config.ts) where @lessjs/core isn't resolvable.
import { css, unsafeCSS } from 'lit';

// ============================================================
// SINGLE SOURCE OF TRUTH — Color Token Values
// ============================================================
// Values reference OpenProps CSS variables (loaded via CDN).
// See: https://open-props.style/#colors

/** Dark theme color values (default) */
export const lessDarkColors = {
  '--less-bg-base': 'var(--gray-12)',
  '--less-bg-surface': 'var(--gray-11)',
  '--kiss-bg-elevated': 'var(--gray-10)',
  '--kiss-bg-hover': 'var(--gray-11)',
  '--kiss-bg-card': 'var(--gray-11)',
  '--less-border': 'var(--gray-9)',
  '--less-border-hover': 'var(--gray-8)',
  '--less-text-primary': 'var(--gray-0)',
  '--less-text-secondary': 'var(--gray-5)',
  '--less-text-tertiary': 'var(--gray-7)',
  '--kiss-text-muted': 'var(--gray-8)',
  '--kiss-accent': 'var(--gray-0)',
  '--kiss-accent-dim': 'var(--gray-4)',
  '--kiss-accent-subtle': 'var(--gray-11)',
  '--less-code-bg': 'var(--gray-10)',
  '--less-code-border': 'var(--gray-9)',
  '--kiss-error': 'var(--red-4)',
  '--kiss-scrollbar-track': 'transparent',
  '--kiss-scrollbar-thumb': 'var(--gray-9)',
} as const;

/** Light theme color values */
export const lessLightColors = {
  '--less-bg-base': 'var(--gray-0)',
  '--less-bg-surface': 'var(--gray-1)',
  '--kiss-bg-elevated': 'var(--gray-2)',
  '--kiss-bg-hover': 'var(--gray-2)',
  '--kiss-bg-card': 'var(--gray-0)',
  '--less-border': 'var(--gray-3)',
  '--less-border-hover': 'var(--gray-4)',
  '--less-text-primary': 'var(--gray-12)',
  '--less-text-secondary': 'var(--gray-8)',
  '--less-text-tertiary': 'var(--gray-7)',
  '--kiss-text-muted': 'var(--gray-6)',
  '--kiss-accent': 'var(--gray-12)',
  '--kiss-accent-dim': 'var(--gray-8)',
  '--kiss-accent-subtle': 'var(--gray-2)',
  '--less-code-bg': 'var(--gray-2)',
  '--less-code-border': 'var(--gray-3)',
  '--kiss-error': 'var(--red-7)',
  '--kiss-scrollbar-track': 'transparent',
  '--kiss-scrollbar-thumb': 'var(--gray-4)',
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
    ${unsafeCSS(declarations(lessLightColors))};
    color-scheme: light;
  }

  :host([data-theme="dark"]) {
    ${unsafeCSS(declarations(lessDarkColors))};
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
export const kissScaffoldColorCSS = lessRootColorCSS;
