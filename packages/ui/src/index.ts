/**
 * @lessjs/ui - KISS UI Component Library
 *
 * Swiss International Style: Pure B&W, minimal, typography-driven.
 * Built on Lit + design tokens CSS custom properties.
 *
 * Components:
 * - less-button: Button with variants (default, primary, ghost)
 * - less-card: Card container with optional header/footer
 * - less-input: Input field with label and error states
 * - less-code-block: Code block with copy button
 * - less-layout: App layout with header, sidebar, footer
 * - less-theme-toggle: Theme toggle Island (Dark/Light)
 *
 * Usage:
 * ```ts
 * // Import all components
 * import '@lessjs/ui';
 *
 * // Or import specific components
 * import { KissButton } from '@lessjs/ui/less-button';
 * ```
 *
 * @module @lessjs/ui
 */

interface PackageIslandMeta {
  tagName: string;
  modulePath: string;
  strategy?: 'eager' | 'lazy' | 'idle' | 'visible';
}

// Design tokens (CSS custom properties)
export { lessDesignTokens } from './design-tokens.js';
// Individual token sub-modules (for partial imports)
export { kissSpacingTokens } from './tokens/spacing.js';
export { kissTypographyTokens } from './tokens/typography.js';
export { kissColorTokens } from './tokens/colors.js';
export { kissEffectTokens } from './tokens/effects.js';

// Components
export { KissButton, tagName as kissButtonTagName } from './less-button.js';
export { KissCard, tagName as kissCardTagName } from './less-card.js';
export { KissInput, tagName as kissInputTagName } from './less-input.js';
export { KissCodeBlock, tagName as kissCodeBlockTagName } from './less-code-block.js';
export { KissLayout, tagName as kissLayoutTagName } from './less-layout.js';
export type { HeaderNavLink, NavItem, NavSection } from './less-layout.js';
export { KissThemeToggle, tagName as kissThemeToggleTagName } from './less-theme-toggle.js';
export { default as KissHeroPing, tagName as kissHeroPingTagName } from './less-hero-ping.js';

// Vite plugin for Web Awesome CDN injection (convenience only)
export { kissUI } from './less-ui-plugin.js';
export type { KissUIOptions } from './less-ui-plugin.js';

// Island metadata for auto-detection by @lessjs/core
// These components are Islands with Shadow DOM and client-side behavior.
// Any component that appears in SSR output must be listed here so the
// client entry can import it for custom element self-registration.
export const islands: PackageIslandMeta[] = [
  {
    tagName: 'less-theme-toggle',
    modulePath: '@lessjs/ui/less-theme-toggle',
    strategy: 'eager', // Theme should be applied immediately
  },
  {
    tagName: 'less-button',
    modulePath: '@lessjs/ui/less-button',
    strategy: 'lazy',
  },
  {
    tagName: 'less-input',
    modulePath: '@lessjs/ui/less-input',
    strategy: 'lazy', // Form interaction needs JS
  },
  {
    tagName: 'less-code-block',
    modulePath: '@lessjs/ui/less-code-block',
    strategy: 'lazy', // Copy button needs JS
  },
  {
    tagName: 'less-layout',
    modulePath: '@lessjs/ui/less-layout',
    strategy: 'lazy',
  },
  {
    tagName: 'less-hero-ping',
    modulePath: '@lessjs/ui/less-hero-ping',
    strategy: 'lazy',
  },
];
