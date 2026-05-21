/**
 * @lessjs/ui - LessJS UI Component Library
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
 * import { LessButton } from '@lessjs/ui/less-button';
 * ```
 *
 * @module @lessjs/ui
 */

// Design tokens (CSS custom properties)
export { lessDesignTokens } from './design-tokens.js';
// Open Props tokens (CSSStyleSheet, zero Lit dependency)
export { openPropsTokenSheet } from './open-props-tokens.js';
// Individual token sub-modules (for partial imports)
export { lessSpacingTokens } from './tokens/spacing.js';
export { lessTypographyTokens } from './tokens/typography.js';
export { lessEffectTokens } from './tokens/effects.js';
export { lessRadiusTokens } from './tokens/radius.js';
export { lessAnimationTokens } from './tokens/animation.js';

// Components
export { LessButton, tagName as lessButtonTagName } from './less-button.js';
export { LessCard, tagName as lessCardTagName } from './less-card.js';
export { LessInput, tagName as lessInputTagName } from './less-input.js';
export { LessCodeBlock, tagName as lessCodeBlockTagName } from './less-code-block.js';
export { LessLayout, tagName as lessLayoutTagName } from './less-layout.js';
export type { HeaderNavLink, NavItem, NavSection } from './less-layout.js';
export { LessThemeToggle, tagName as lessThemeToggleTagName } from './less-theme-toggle.js';
export { default as LessHeroPing, tagName as lessHeroPingTagName } from './less-hero-ping.js';
export { LessDialog, tagName as lessDialogTagName } from './less-dialog.js';
export { LessCallout, tagName as lessCalloutTagName } from './less-callout.js';
export { LessStepCard, tagName as lessStepCardTagName } from './less-step-card.js';

// Package manifest (WC Package Protocol)
// Consumers (adapter-vite) read manifest.declarations to derive island metadata.
export { manifest } from './manifest.js';
